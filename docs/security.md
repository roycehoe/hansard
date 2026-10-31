# Security

What the site exposes, the control on each part, and what was left out. It covers the website, its API and the daily refresh job as the code stood on 31 October 2026. To report a vulnerability, see [SECURITY.md](../SECURITY.md).

The site has no accounts, takes no uploads and writes nothing to the database. Its public parts are pages and a GET-only API.

## The database

The API reads the database that `roycehoe/hansard-scraper` builds and never writes to it ([ADR 0001](adr/0001-read-only-api.md)). Two controls hold that. Every connection sets `default_transaction_read_only=on` and a statement timeout, 30 seconds for pages and 10 for search (`api/database/engine.py`). Any statement can switch that option off, so the second control is a Postgres role with `SELECT` and nothing else, which Royce creates on the remote database by hand ([api-database-role.md](api-database-role.md)). The role has no grant on the raw response tables or on the failure columns of `refresh_run`.

The API has no raw SQL. Queries use SQLModel expressions, which bind every value as a parameter. Search parameters have length and range limits (`api/routers/search.py`).

## Load

Search is the slow path. It has its own connection pool, and at most three searches run at once. A fourth is refused with a 429 (`api/middleware/search_slot.py`). A 200 answer from the API is kept in process memory for an hour and served again (`api/middleware/response_cache.py`).

## Who can reach it

While `PUBLIC_MODE` is anything other than `true`, every page and API call needs a basic-auth password, checked with a constant-time comparison, and every response carries `noindex`. Production runs with `PUBLIC_MODE` set to `true` (`.do/app.yaml`). The deployed app sets no OpenAPI document, so the API has no interactive docs (`api/website.py`).

## The browser

Every response carries `Strict-Transport-Security` for a year, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` and a `Content-Security-Policy` (`api/middleware/security_headers.py`). The policy lets scripts load only from the site itself and from GoatCounter, allows the one inline script by its hash, and stops other sites from framing the pages. Cross-origin requests are allowed only from `http://localhost:5173`. The one third-party script, GoatCounter's counter, loads with a Subresource Integrity hash.

## Takedowns

A taken-down report answers 410 on its page and in the API, and drops out of search and lists. The list of slugs lives in a GitHub secret, so the repo never records a takedown. [takedown.md](takedown.md) has the steps and the check that confirms a slug took effect.

## Secrets and deploys

The two database URLs (the API's and the refresh job's), the basic-auth username and password, the takedown list, the GoatCounter API token, the Telegram bot token and chat id, and the Healthchecks ping address are GitHub Actions secrets. Each deploy writes them into the App Platform's encrypted environment. The deploy job runs only on a push to `master`, after the app, API and schema-drift jobs pass, and it then requests four live addresses. CI installs from frozen lockfiles and runs with read-only repository permissions.

## The refresh job

The daily job writes through its own role, `hansard_refresh`. It can insert rows, set `speaker_id` on `speech` and `attendance`, update `refresh_run` and vacuum three tables, and nothing else (the scraper's `docs/refresh.md`, Write role SQL). It has no `DELETE`, `TRUNCATE` or `CREATE`, so it cannot change a stored row or run a migration. Migrations and backfills run by hand with the owner role. The job is an App Platform scheduled job built from the scraper's `master` (`.do/app.yaml`), and a push to that branch deploys it, so push access to the scraper decides what the job runs.

## What visitors leave behind

The site sets no cookies of its own; Cloudflare, in front of it, sets one, `__cf_bm`, to tell bots from people. There are no accounts. GoatCounter records page addresses, not search words, and stores no IP addresses. The API counts searches by day and endpoint, without the words. The server log records the query string of a request that answers 500 or 503, or takes over 3 seconds (`api/middleware/request_log.py`), so a slow search can leave its words in the platform log.

## Left out

- No penetration test has been run.
- There is no per-client rate limit in the code. One client can hold all three search slots, and `s` and `q` on a report address have no cap.
- The Content Security Policy allows inline styles (`style-src 'unsafe-inline'`), because Radix, sonner and the theme switch write `<style>` elements whose contents change at run time. Scripts are not loosened this way.
- Dependabot alerts and secret scanning are off in both repos as of 31 October 2026. CodeQL runs on each push and weekly.
- GitHub private vulnerability reporting is off. Reports go by email.
