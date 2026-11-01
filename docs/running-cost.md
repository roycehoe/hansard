# Running cost

This table shows what the site costs to run each quarter and how much use it gets. It also shows how many archive errors were fixed. Royce adds one row at the end of each quarter.

- Visits come from GoatCounter's statistics for the quarter's dates, minus its events.
- Hosting cost is the sum of the DigitalOcean invoices for the quarter's three months, in US dollars.
- Cost per 1,000 visits is the hosting cost divided by the visits, times 1,000.
- Errors fixed is the number of rows in `corrections.md` whose Fixed date falls in the quarter.

| Quarter | Visits | Hosting cost (USD) | Cost per 1,000 visits | Errors fixed |
| --- | --- | --- | --- | --- |

To add a row, run `python scripts/quarterly_figures.py 2026-Q4` with the quarter you want, then paste the row it prints at the top of the table. The script's docstring says which tokens it needs.
