#!/usr/bin/env bash
# Sample Official Report links through the public API and check that each one
# answers 2xx or 3xx. Prints one line per failing link or failed API call to
# stdout; progress goes to stderr. Pauses DELAY seconds between requests.
# When every checked link fails with the same status, the cause is likely on
# Parliament's side or the network, not the links, so it prints nothing to
# stdout and exits 1.
set -euo pipefail

API_URL=${API_URL:-https://openhansard.sg/api}
TYPES=${TYPES:-oral-answer written-answer bill motion budget ministerial-statement clarification matter-adj speaker written-statement}
PER_TYPE=${PER_TYPE:-2}
DELAY=${DELAY:-5}
checked=0
failed=0
statuses=""
failures=""

get() {
  sleep "$DELAY"
  curl -sf --max-time 30 "$API_URL/$1"
}

for type in $TYPES; do
  slugs=$(get "search/reports?report_type=$type&page_size=100" | jq -r '.results[].report_slug | @uri' | shuf -n "$PER_TYPE") || {
    failures+="API failed: search/reports?report_type=$type"$'\n'
    continue
  }
  for slug in $slugs; do
    url=$(get "reports/$slug" | jq -r .official_record_url) || {
      failures+="API failed: reports/$slug"$'\n'
      continue
    }
    sleep "$DELAY"
    status=$(curl -s -o /dev/null -w '%{http_code}' --max-time 30 "$url" || true)
    echo "$status $type $url" >&2
    checked=$((checked + 1))
    case $status in
      2* | 3*) ;;
      *)
        failed=$((failed + 1))
        statuses+="$status"$'\n'
        failures+="$status $url (report: https://openhansard.sg/reports/$slug)"$'\n'
        ;;
    esac
  done
done

unique=$(printf '%s' "$statuses" | sort -u)
if [ "$checked" -gt 0 ] && [ "$failed" -eq "$checked" ] && [ "$(printf '%s\n' "$unique" | wc -l)" -eq 1 ]; then
  echo "Parliament's site answered every request with $unique, so the links themselves are probably fine." >&2
  exit 1
fi
printf '%s' "$failures"
