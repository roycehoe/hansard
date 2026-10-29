# When to upgrade the database

The production database is DigitalOcean managed Postgres on the 1 GiB plan, with one shared vCPU. `SHOW max_connections` returned 25 on 29 October 2026. DigitalOcean reserves 3 of those, so the apps get 22. The 29 October load test (see `required-indexes.md`) kept the search limit at three at once, because speech search was already past 3 seconds at p95 on production with two at once.

## Triggers

Look at an upgrade when any one of these holds for two weeks in a row:

| Signal | Threshold | Where to read it |
| --- | --- | --- |
| Searches refused with `search.busy` | More than 1% of searches, on 3 or more days a week | GoatCounter: visitors to the `search-busy` event against visitors to `/search` |
| Speech search p95 on normal traffic, seat searches left out | More than 3 s | The request log, or a re-run of the load test |
| Database CPU at peak hours | More than 70% for over an hour a day | DigitalOcean console, Databases, Insights |
| "Too many connections" errors | Any | The web container's logs |
| Database disk | More than 80% of the plan's disk | DigitalOcean console |

## Before upgrading

Work in this order, and move to the next step only when the one before it has run out:

1. Fix the slow query. The seat filter is the example: 4% of searches took 44 to 46% of search time until its rewrite.
2. Cache what repeats.
3. Upgrade the plan.

## Which plan

The limit is the one shared vCPU, not memory. A 1 vCPU plan with more memory leaves search about where it is. The next plan worth paying for has 2 vCPUs. Check DigitalOcean's current prices before choosing.
