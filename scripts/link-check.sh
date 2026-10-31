#!/usr/bin/env bash
# Sample Official Report links through the public API and check that each one
# answers 2xx or 3xx. Prints one line per failing link to stdout; progress
# goes to stderr. Pauses DELAY seconds between requests.
set -euo pipefail

API_URL=${API_URL:-https://openhansard.sg/api}
TYPES=${TYPES:-oral-answer written-answer bill motion budget ministerial-statement clarification matter-adj speaker written-statement}
PER_TYPE=${PER_TYPE:-2}
DELAY=${DELAY:-5}

get() {
  sleep "$DELAY"
  curl -sf --max-time 30 "$API_URL/$1"
}

for type in $TYPES; do
  slugs=$(get "search/reports?report_type=$type&page_size=100" | jq -r '.results[].report_slug | @uri' | shuf -n "$PER_TYPE")
  for slug in $slugs; do
    url=$(get "reports/$slug" | jq -r .official_record_url)
    sleep "$DELAY"
    status=$(curl -s -o /dev/null -w '%{http_code}' --max-time 30 "$url" || true)
    echo "$status $type $url" >&2
    case $status in
      2* | 3*) ;;
      *) echo "$status $url (report: https://openhansard.sg/reports/$slug)" ;;
    esac
  done
done
