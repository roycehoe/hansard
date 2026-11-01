"""Quarterly figures for openhansard.sg as one markdown table row, run by hand.

Prints the row for docs/running-cost.md:
| Quarter | Visits | Hosting cost (USD) | Cost per 1,000 visits | Errors fixed |

  python scripts/quarterly_figures.py 2026-Q4

It uses the standard library only, so it needs no uv project. It makes two read
requests and reads docs/corrections.md. It writes nothing.

Environment (the tokens are never printed):
  GOATCOUNTER_TOKEN    A GoatCounter API key for royceinbox.goatcounter.com with
                       the "Read statistics" permission only. Make it under
                       Settings, then API.
  DIGITALOCEAN_TOKEN   A DigitalOcean personal access token with the billing:read
                       scope only. A read-only token with that scope is enough.

Visits are GoatCounter's /stats/total for the quarter, in UTC, minus its events
(the site counts preview fetches as events). Hosting cost is the sum of the
DigitalOcean invoices for the quarter's three months. Errors fixed are the rows
of docs/corrections.md whose Fixed date falls in the quarter.
"""

import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.request
from datetime import date, datetime, timezone
from decimal import ROUND_HALF_UP, Decimal
from pathlib import Path
from urllib.parse import urlencode

GOATCOUNTER_API_URL = "https://royceinbox.goatcounter.com/api/v0"
DIGITALOCEAN_INVOICES_URL = "https://api.digitalocean.com/v2/customers/my/invoices"
INVOICES_PER_PAGE = 200
REQUEST_TIMEOUT_SECONDS = 30
CORRECTIONS_PATH = Path(__file__).resolve().parent.parent / "docs" / "corrections.md"
CORRECTIONS_LOG_HEADING = "## Log"
CORRECTIONS_FIXED_COLUMN = 1
CORRECTIONS_DATE_FORMAT = "%d %B %Y"
QUARTER_PATTERN = re.compile(r"(\d{4})-Q([1-4])")
CENTS = Decimal("0.01")


def parse_quarter(text: str) -> tuple[date, date]:
    """Return the first day of the quarter and the first day after it."""
    match = QUARTER_PATTERN.fullmatch(text)
    if match is None:
        sys.exit(f"Quarter must look like 2026-Q4, not {text!r}.")
    year, quarter = int(match.group(1)), int(match.group(2))
    start = date(year, 3 * quarter - 2, 1)
    end = date(year + 1, 1, 1) if quarter == 4 else date(year, 3 * quarter + 1, 1)
    return start, end


def get_json(url: str, token: str, auth_error: str) -> dict:
    request = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
    try:
        with urllib.request.urlopen(request, timeout=REQUEST_TIMEOUT_SECONDS) as reply:
            return json.load(reply)
    except urllib.error.HTTPError as error:
        if error.code in (401, 403):
            sys.exit(auth_error)
        sys.exit(f"{url.split('?')[0]} answered HTTP {error.code}.")


def fetch_visits(token: str, start: date, end: date) -> int:
    query = urlencode(
        {"start": f"{start}T00:00:00Z", "end": f"{end}T00:00:00Z"},
    )
    response = get_json(
        f"{GOATCOUNTER_API_URL}/stats/total?{query}",
        token,
        "GoatCounter refused GOATCOUNTER_TOKEN. It needs the Read statistics permission.",
    )
    # The total includes events, such as link preview fetches; visits are the rest.
    return response["total"] - response["total_events"]


def sum_invoices(pages: list[dict], start: date, end: date) -> Decimal:
    """Add the invoices whose period falls in the quarter. All three must be there."""
    periods = {f"{start.year}-{start.month + offset:02d}" for offset in range(3)}
    amounts = {
        invoice["invoice_period"]: Decimal(invoice["amount"])
        for page in pages
        for invoice in page["invoices"]
        if invoice["invoice_period"] in periods
    }
    missing = sorted(periods - amounts.keys())
    if missing:
        sys.exit(
            f"No DigitalOcean invoice yet for {', '.join(missing)}. "
            f"Run this after the last one is issued, in early {end:%B}."
        )
    return sum(amounts.values(), Decimal(0))


def fetch_hosting_cost(token: str, start: date, end: date) -> Decimal:
    pages = []
    url: str | None = f"{DIGITALOCEAN_INVOICES_URL}?per_page={INVOICES_PER_PAGE}"
    while url is not None:
        page = get_json(
            url,
            token,
            "DigitalOcean refused DIGITALOCEAN_TOKEN. It needs the billing:read scope.",
        )
        pages.append(page)
        url = page.get("links", {}).get("pages", {}).get("next")
    return sum_invoices(pages, start, end)


def count_errors_fixed(corrections_text: str, start: date, end: date) -> int:
    """Count Log rows whose Fixed date is in the quarter."""
    log = corrections_text.split(CORRECTIONS_LOG_HEADING, 1)[1]
    count = 0
    for line in log.splitlines():
        if not line.startswith("|"):
            continue
        cells = [cell.strip() for cell in line.strip("|").split("|")]
        try:
            fixed = datetime.strptime(
                cells[CORRECTIONS_FIXED_COLUMN], CORRECTIONS_DATE_FORMAT
            ).date()
        except ValueError:
            continue
        count += start <= fixed < end
    return count


def format_row(quarter: str, visits: int, cost: Decimal, errors_fixed: int) -> str:
    per_thousand = cost / visits * 1000
    return (
        f"| {quarter} | {visits:,} | {cost.quantize(CENTS, ROUND_HALF_UP)} "
        f"| {per_thousand.quantize(CENTS, ROUND_HALF_UP)} | {errors_fixed} |"
    )


def require_token(name: str) -> str:
    token = os.environ.get(name)
    if not token:
        sys.exit(f"Set {name} first. See the docstring for the scope it needs.")
    return token


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("quarter", help="for example 2026-Q4")
    quarter = parser.parse_args().quarter
    start, end = parse_quarter(quarter)
    if end > datetime.now(timezone.utc).date():
        sys.exit(f"{quarter} has not ended yet.")
    goatcounter_token = require_token("GOATCOUNTER_TOKEN")
    digitalocean_token = require_token("DIGITALOCEAN_TOKEN")
    visits = fetch_visits(goatcounter_token, start, end)
    cost = fetch_hosting_cost(digitalocean_token, start, end)
    errors_fixed = count_errors_fixed(CORRECTIONS_PATH.read_text(), start, end)
    print(format_row(quarter, visits, cost, errors_fixed))


if __name__ == "__main__":
    main()
