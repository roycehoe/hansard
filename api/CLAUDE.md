# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`api/` is a FastAPI backend for the hansard web app. It reads a Postgres database of Singapore Parliament Hansard records. That database is owned by a separate scraper repo at `roycehoe/hansard-scraper`, and the API is **read-only** against it.

## Setup and commands

Python 3.15 is pinned in `api/.python-version` and in `requires-python`. Dependencies are managed with **uv**. Run everything from `api/`.

```bash
# Install dependencies
uv sync

# Run the development server (localhost:8000)
uv run fastapi dev

# Lint (run before every commit)
uv run ruff check .

# Format (run before every commit)
uv run ruff format .
```

Dependencies: `fastapi[standard]`, `sqlmodel`, `pydantic-settings`, `psycopg` (v3).

Ruff config is `[tool.ruff.lint] select = ["I", "F"]`, so lint covers import order and unused names only. `ruff format` is the formatter and is enforced.

**Tests.** `api/tests/` holds the pytest suite. Run it from `api/`:

```bash
# Tests that need no database (what CI runs)
uv run pytest -m "not database"

# Every test, including those marked `database`
uv run pytest
```

The tests marked `database` read real rows, so they need the scratch database: a copy of the scraper's schema and data at `postgresql+psycopg://user:password@localhost:5435/hansard_launch`. `tests/conftest.py` sets `DATABASE_URL` to it before any project import and stops the session if `settings.database_url` resolves anywhere else, so no test can reach the database in `api/.env`. One database test seeds a `refresh_run` row through a separate writable test engine and deletes it; the API code itself never writes. `tests/test_schema_drift.py` also carries the `schema_drift` marker. It selects every column of each model with `LIMIT 0` and reads no rows. The `schema-drift` job in `.github/workflows/ci.yml` builds the scraper master's tables from its models in an empty Postgres 17 with rum, then runs `pytest -m schema_drift`; the `api` job leaves it out because it carries `database`. Do not write new tests unless explicitly asked; the existing ones must pass.

**No pre-commit hooks.** Do not add any without being asked. The only auth is HTTP basic auth in `website.py`, added on 18 October 2026 for the private launch; the API in `main.py` has none. It has been off on the live site since 20 October 2026, because `.do/app.yaml` sets `PUBLIC_MODE` to `true`, and any other value turns it on.

## The database contract

The scraper repo owns the schema and every Alembic migration. This API only reads.

- **No Alembic here.** The API has no migrations and never changes the schema.
- **Read-only role.** The API connects through a read-only Postgres role. Do not write code that inserts, updates or deletes rows.
- **Own models.** The API declares its own SQLModel classes, one per table it reads, once endpoints exist. It does not import the scraper's models.
- **Tables owned by the scraper:** `hansard_website_response`, `report`, `speech`, `hansard_sitting_date_response`, `sitting`, `attendance`, `speaker`, `person`, `partyaffiliation`, `refresh_run`. The scraper's `CLAUDE.md` describes them. `refresh_run` holds one row per daily refresh; `GET /refresh` and the `attribution` field of `GET /coverage` read the latest `SUCCEEDED` row and answer as if the table were empty while the table or the API role's `SELECT` grant is missing.
- **A schema change is a scraper change.** If an endpoint needs a column that does not exist, make the change in the scraper repo, then update the matching model here.

## Architecture

**Request flow:** `routers/` → `services/` → `crud/` → `database/`

What exists today:

| Path | Contents |
|---|---|
| `main.py` | The `FastAPI` app. Every router is mounted here. `GZipMiddleware` runs at level 4, not the default 9: a long report compresses in about 40% of the time for 6 to 9% more bytes. `uv run fastapi dev` serves it. |
| `website.py` | The deployed site: `main.py`'s app under `/api`, the built frontend at `/`, both behind basic auth unless public mode is on, and the takedown middleware in front of both. It also serves the sitemap at the site root (`routers/sitemap.py`), outside `/api`. Its lifespan starts a background thread that fills the `/coverage`, `/parliaments` and sitemap caches and recomputes them after each finished refresh run (`middleware/cache_fill.py`). The root `Dockerfile` runs it. |
| `settings.py` | `pydantic-settings` configuration: `AppSettings` (`DATABASE_URL`, `TAKEDOWN_REPORT_SLUGS`, `SITE_URL`, `PUBLIC_MODE`) and `WebsiteSettings`, which only `website.py` reads. |
| `enums.py` | `ReportType` (the 23 stored report type strings), `SearchSort`, `SpeechLinkStatus`, `PreviewType` and `RefreshRunStatus` (the four values the scraper writes to `refresh_run.status`). |
| `database/engine.py` | The SQLModel engine, with `default_transaction_read_only=on` and a 30-second `statement_timeout` set as connection options, and the `get_session()` dependency. A second engine serves visitor searches: the same read-only option, `synchronize_seqscans=off`, `max_parallel_workers_per_gather=0`, a 10-second `statement_timeout` and a pool of 3 with an overflow of 2, behind the `get_search_session()` dependency. |
| `database/` | One SQLModel class per table the API reads: `Report`, `Speech`, `Sitting`, `Attendance`, `Speaker`, `Person`, `PartyAffiliation`, `RefreshRun`. Only the columns the API uses. `RefreshRun` leaves out `halt_reason` and `failure_reason`, which the API role's column grant does not cover. |
| `exceptions/` | `base.py` (`ErrorCode`, `ErrorSpec`, `ERRORS`, `AppHttpExceptionBase`) and one no-argument exception class per domain file. |
| `utils/` | Pure helpers: report slug, official record URL, person slug, sitting date text, `LIKE` escaping, transcript snippet, speech link anchor and check, search words parsed into quoted and stemmed terms (`search_query.py`), preview tags, transcript quote, sitting date label, sitemap XML (`sitemap_xml.py`), preview bot name from a user agent, Singapore date of a timestamp, Parliament numbers from a stored figures group name, whether a speaker label names a role several people hold, Deputy Speaker or Chairman (`speaker_label.py`, which repeats the scraper's stage 8 label rules for those roles). |
| `validators/` | `search.py`: `validate_can_search`, which a search router calls before the service. It answers 422 `search.filter_required` for no words and no filter, and 422 `search.excluded_words_only` for a query of only excluded words. |
| `crud/` | One read-only class per table (`CRUDReport`, `CRUDSpeech`, `CRUDSitting`, `CRUDAttendance`, `CRUDMembership`, `CRUDPerson`, `CRUDRefreshRun`) `text_search.py` with the shared full-text constants and expression builders, and `location_name.py` with `get_folded_location_name`, the seat-name comparison both the Membership and speech filters use. See `crud/CLAUDE.md`. |
| `middleware/search_slot.py` | `hold_search_slot`, the context manager that holds one of the three search slots (`_MAX_RUNNING_SEARCHES`) and turns a `QueryCanceled` raised inside it into `503 search.timed_out`. Both search services and the report matched-words service run inside it. |
| `middleware/request_log.py` | `RequestLogMiddleware`, a pure ASGI middleware registered last in `main.py`, so it is outermost. It logs one line, to the platform logs only, for every response with status 500 or 503, every request that raises, and every request that takes over 3 seconds: method, route, path parameters, query string, status, duration and the exception class. The query string holds what people searched for. |
| `middleware/membership.py` | `get_membership_id_to_person`, which composes `CRUDMembership` and `CRUDPerson` for every service that resolves linked rows to Persons. |
| `middleware/basic_auth.py` | `BasicAuthMiddleware`: answers 401 unless the request carries the configured credentials; `/api/health` is open for the platform's health check. Every response it returns, the 401 and the health check included, carries `X-Robots-Tag: noindex`. A `public` `Cache-Control` on a response it lets through becomes `private`, so a shared cache cannot store an authorised answer. |
| `middleware/response_cache.py` | `ResponseCacheMiddleware`, a pure ASGI middleware registered in `main.py` between CORS and GZip. It keeps GET answers with status 200 in process memory for an hour (500 entries and 32 MB, oldest dropped first), keyed by path, the query parameters the route declares (sorted by name; any other parameter is ignored) and whether the client accepts gzip, and sends them with `Cache-Control: public, max-age=3600`. A path that matches no declared GET route in the app's OpenAPI schema is not cached. `/health` and `/preview-fetches` are never cached and get no `Cache-Control`; errors, 429 and 410 get none. |
| `middleware/frontend.py` | `FrontendFiles`: serves the built frontend, answers `index.html` for any other path so client routes load, and writes each page's preview tags between the markers in `index.html` (`services/preview.py`, cached in process for an hour). The same lookup decides the status: a path that is not a client route, or a report, person or sitting that does not exist, gets the shell with status 404; a database failure still answers 200. Files under `assets/`, whose names carry a hash of their contents, go out with `Cache-Control: public, max-age=31536000, immutable`, and the page itself with `no-cache`, so Cloudflare keeps the files and a release shows at once. When the user agent names a preview bot (`utils/preview_bot.py`), it first counts the fetch with `services/preview_fetch.py`. |
| `middleware/takedown.py` | The takedown list (the comma-separated `TAKEDOWN_REPORT_SLUGS`, read at import; a malformed entry stops startup): `is_report_id_taken_down` for the services, `get_taken_down_report_id_candidates`, which search turns into report ids it excludes in SQL so its counts and pages leave hidden reports out, and `TakedownMiddleware`, which answers 410 for a listed report's page. It compares the `reports/` prefix and the slug case-insensitively and drops spaces and control characters from the slug first, because the frontend route matches any case. |
| `middleware/cache_fill.py` | `fill_coverage_parliament_and_sitemap_caches_after_each_refresh`, run on a daemon thread from the lifespan in `website.py`. It fills the `/coverage` and `/parliaments` caches and the sitemap cache at startup. Every 15 minutes after that it reads the id of the `refresh_run` row with the latest `finished_at`, whatever its status, and recomputes all three when that id has changed. Each fill opens one session per answer. After a failed check or recompute the thread keeps the old run id and recomputes all three at the next check. An answer whose computation failed keeps its old value. If the startup fill fails, a request fills whichever cache is still empty. If the first read finds the table or the API role's grant missing, the thread fills once and ends. It logs nothing, so a failed recompute shows only as stale figures. The one uncaught call is the fill on the missing-table path, and a failure there prints its traceback. |
| `schemas/` | Pydantic response models, one file per domain. No field defaults. |
| `services/` | Module-level functions, one file per domain: report, sitting, parliament, person, search (three searches at once across both search endpoints, the next answers 429 `search.busy`), coverage, preview, refresh, preview_fetch, sitemap. |
| `routers/` | One router per domain plus `health.py`. `sitemap.py` is mounted by `website.py` at the site root, not in `main.py`. Each handler calls one service function. `refresh.py` serves `GET /refresh` with the usual session; `preview_fetch.py` serves `GET /preview-fetches` and takes no session. |

The layer table below is the full design. `gateway/` is not added yet.

| Layer | Responsibility | Forbidden |
|---|---|---|
| `routers/` | Route handlers. Validate input, call one service function, return the result. | Business logic, calling `crud/` or `database/` directly |
| `database/` | The engine and the SQLModel classes for tables the API reads. | Logic of any kind, importing the scraper's models |
| `settings.py` | All env-based configuration. | Reading `os.environ` elsewhere |
| `main.py` | App construction, router mounting. | Business logic |
| `services/` | Business logic. Module-level functions, one file per domain. | Raw SQL, session handling beyond what a router passes in |
| `crud/` | Database reads through SQLModel sessions. Class-based, one class per table. | Business logic, HTTP calls, writes |
| `schemas/` | Pydantic request and response models. | Database access, logic |
| `exceptions/` | Custom exception hierarchy. `base.py` defines the base types. | Exceptions that take arguments |
| `utils/` | Pure functions with no side effects. Any layer may import from here. | Database access, HTTP calls, importing from layers above |
| `validators/` | Input validation called from routers or services. | Session use, I/O |
| `middleware/` | Request-path middleware registered in `main.py`, and concerns that compose calls across gateways or services. | Single-service logic |
| `gateway/` (not yet added) | Thin wrappers around one external service each. | Interpreting failures, business logic |

Notes on the layers that matter now:

- **Routers** call one service function and return. A router never calls `crud/` or `database/` directly.
- **Terminology.** A row of the `speaker` table is a Membership everywhere outside `database/`: `CRUDMembership`, `membership_ids`, `membership_id_to_person`. The raw name on a speech is `speaker_label`.
- **Indexes are the launch gate.** `docs/required-indexes.md` lists every index the API's queries need, with the index definitions the scraper migrations build. All nine exist on production: six since 14 October 2026 (scraper commit `1f0d8ef`), `ix_speech_transcript_tsv` since 17 October and the rum index `ix_speech_transcript_tsv_rum` since 18 October (`aed4137`). A server that runs those migrations needs the `rum` extension installed (`postgresql-17-rum` on Debian). Without the indexes the queries are sequential scans, and the speech full-text search exceeds the statement timeout and answers `503 search.timed_out`. The ninth, `ix_speech_transcript_tsv_sitting_date_rum`, and the column `speech.sitting_date` came with scraper migration `c93f77e499cc`, on production since 18 October 2026. The `Speech` model reads that column and word search orders and filters by it, so this API cannot run against a database without that migration: every statement that selects a speech would fail. Scraper migration `6b3a29f6f809`, on production since 21 October 2026, gave `ix_speech_speaker_id` and `ix_attendance_speaker_id` `INCLUDE` columns and added `ix_report_id_parliament_number`, so the person page's reads are index-only scans. The API runs without it, but heavy members' pages read thousands of heap pages each.
- **`/coverage` and `/parliaments` cache in-process until a refresh run finishes**, as module state in `services/coverage.py` and `services/parliament.py`. `website.py` fills both at startup on a background thread (`middleware/cache_fill.py`), so the first visitor after a deploy does not wait for the computation. The thread replaces both answers within 15 minutes of a `refresh_run` row getting its `finished_at`, whatever the run's status, and a request computes an answer only while none is stored. `main.py` has no startup hook, so `uv run fastapi dev` fills them on the first request and never recomputes. New figures can take up to about 2 hours 15 minutes to reach a visitor: up to 15 minutes until the next check, up to an hour in the response cache, then up to an hour in the browser or Cloudflare. Restart the API after a write that creates no `refresh_run` row, such as a supervised script, a link round or a migration.
- **The sitemap is built from the database and cached like `/coverage`.** `services/sitemap.py` writes `/sitemap.xml` (an index) and `/sitemap-{sittings,people,reports}-{n}.xml` (at most 20,000 URLs a file, about 49,000 URLs in all) for `SITE_URL`, leaves out taken-down reports, and fills at startup and after each refresh run with the other two caches. While `SITE_URL` is unset, every sitemap path answers 404. A report, person or sitting page that does not exist answers 404 from `middleware/frontend.py`, which reads the answer from the preview lookup; that lookup is cached for an hour, so a page added by a refresh can answer 404 for up to an hour if someone asked for it first.
- **Every GET answer with status 200 is cached for an hour** by `middleware/response_cache.py` and sent with `Cache-Control: public, max-age=3600`, so browsers keep a copy for up to an hour too. The cache is process memory: a restart or deploy empties it. Behind basic auth the header goes out as `private`. A report taken down after its answer was cached keeps serving until the next restart.
- **Searches are limited to three at once across both search endpoints.** `GET /search/speeches` and `GET /search/reports` share one counter (`_MAX_RUNNING_SEARCHES`), and so does `GET /reports/{report_slug}/matched-words`, which also runs on the search engine; the fourth search answers `429 search.busy` without touching the database. One search page sends a speech request and a report request, so two visitors searching at the same moment can see the report half refused. Visitor searches run on the second engine (pool of 3, overflow of 2) with a 10-second `statement_timeout`, and one that passes it answers `503 search.timed_out`. `date_from` and `date_to` must fall between 1 January 1900 and 31 December 2100, or the answer is 422. `page` stops at 50 (`MAX_SEARCH_PAGE`), so a deep offset cannot hold a search slot. At the app's 20 results a page, page 50 ends at the 1,000th counted match. Page 51 answers 422, and page 50 reports no next page.
- **`constituency` on `GET /search/speeches` is a seat filter.** It matches the attendance lists' `location_name` by exact name, case and a trailing GRC or SMC ignored, and hyphens and runs of spaces folded to one space on both sides, so Tampines does not match Tampines Changkat. A name matching no seat answers 404 `search.constituency_not_found`. `GET /people` keeps its substring match for typed names. A speech counts only when its date falls between the first and last sittings its Membership attended for that location. A Membership covers a whole Parliament and some sat for two seats within one, so the Membership alone is not enough. Speeches made from the chair are left out: a speaker label that is a chair title (Mr or Mdm Speaker, Deputy Speaker, The Chairman, with or without a name in brackets) is credited to the presiding member, and without the rule a Speaker's seat opens on procedure. The person filter keeps them. The app drops a trailing GRC or SMC before it sends the name.
- **`GET /refresh` is the footer feed.** It reads the latest `SUCCEEDED` `refresh_run` row: the last sitting date with text and the date the run finished (as a Singapore date). Halted, failed and running rows are never read. While no `SUCCEEDED` row exists, or the table or grant is missing, both fields are null and the app shows no footer line. The response cache holds this answer for an hour like any other GET, so the footer can trail a finished run by up to an hour, plus the browser's hour.
- **`GET /coverage` is the only source of published figures.** Besides the counts, it carries `attribution`: the per-Parliament attribution shares, read from the latest `SUCCEEDED` `refresh_run` row whose `figures` is a JSON object. Bad `figures` JSON counts as no figures, and so does a missing table or grant. Then `attribution` is null and the app keeps its hand-kept figures. The figures and their method are on the site's `/coverage/methods` page. No supervised write stores figures yet, so they move only with a scheduled run that adds speech rows, and reach a visitor within about 2 hours 15 minutes with no restart.
- **Preview-bot fetches are counted in process memory**, because the API cannot write to the database (`docs/adr/0001-read-only-api.md`). `services/preview_fetch.py` keys each count by Singapore date, bot name and request path (no query, IP or user agent). A path that is not one of the site's routes, or is longer than 300 bytes, counts as `other`. It keeps at most 10,000 keys and 1 MB of paths, and loses them on restart or deploy. `GET /preview-fetches` reads them; read it before each deploy. In private mode a bot gets 401 before the counter, so counting happens only in public mode.
- **`crud/` is read-only here.** The rules in `STYLE.md` about CRUD writes stay in the guide, but this API has no write path.
- **Raw SQL** is limited to the database tests (seeding and reading `refresh_run`, the read-only write checks and the `SHOW statement_timeout` check). Everything else goes through SQLModel.
- **Do not run `mypy`.** Only `ruff` is used for static analysis.

## Environment variables

`settings.py` is the authoritative inventory of every setting and its type. Settings are read with `pydantic-settings`.

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string for the read-only role. |
| `BASIC_AUTH_USERNAME`, `BASIC_AUTH_PASSWORD` | `website.py` only. Required unless `PUBLIC_MODE` is true: the site does not start without them. |
| `PUBLIC_MODE` | Only `true` (any case) turns basic auth and the noindex header off in `website.py`, and turns off the API's `/docs`, `/redoc` and `/openapi.json` in `main.py`; anything else, or unset, keeps them on. |
| `FRONTEND_DIST_PATH` | `website.py` only. The built frontend; the `Dockerfile` sets it. |
| `TAKEDOWN_REPORT_SLUGS` | Optional. Report slugs separated by commas; each listed report answers 410 and drops out of every list. A secret, because the repo is public. See `docs/takedown.md`. |
| `SITE_URL` | Optional. The site's origin, such as `https://example.sg`, for the `og:url` preview tag and the canonical link, which drops the query, and for the sitemap's absolute URLs; the tags are left out and the sitemap answers 404 while unset. |

Never put a secret in code or in an example env file.

## Style docs

- **`STYLE.md`** is the resident summary of the coding rules. Follow it when writing or reviewing code. It covers naming, layers, control flow and failure, types and data, the HTTP surface, and comments.
- **`STYLE-RULINGS.md`** is the append-only log of numbered rulings (R1 onward) behind `STYLE.md`. Where the two disagree, the ruling governs. A new convention is recorded there first and propagated to `STYLE.md` in the same commit.

Rules that bite most often:

- Spell names out in full, with `is_` on every boolean (`STYLE.md`, Naming).
- No comments or docstrings, apart from the three licensed shapes (`STYLE.md`, Comments, diffs and deploys).
- Attempt the operation and catch the failure outside `validators/` (`STYLE.md`, Control flow and failure).
- Annotate every signature, but never the return type of `__init__` (`STYLE.md`, Types and data).
- Build only what the current change needs (`STYLE.md`, Layers).

## Git

- Commit straight to `master`. Do not create branches.
- Conventional Commits: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:` followed by a short description.
- No attribution trailers or co-author lines in commits.
- Run `uv run ruff check .` and `uv run ruff format .` before every commit, and confirm `uv run fastapi dev` starts without errors.

@STYLE.md
