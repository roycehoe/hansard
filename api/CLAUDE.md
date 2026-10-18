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

**No test suite.** Do not write tests unless explicitly asked.

**No pre-commit hooks.** Do not add any without being asked. The only auth is HTTP basic auth on the deployed site (`website.py`), added on 18 October 2026 for the private launch; the API in `main.py` has none.

## The database contract

The scraper repo owns the schema and every Alembic migration. This API only reads.

- **No Alembic here.** The API has no migrations and never changes the schema.
- **Read-only role.** The API connects through a read-only Postgres role. Do not write code that inserts, updates or deletes rows.
- **Own models.** The API declares its own SQLModel classes, one per table it reads, once endpoints exist. It does not import the scraper's models.
- **Tables owned by the scraper:** `hansard_website_response`, `report`, `speech`, `hansard_sitting_date_response`, `sitting`, `attendance`, `speaker`, `person`, `partyaffiliation`. The scraper's `CLAUDE.md` describes them.
- **A schema change is a scraper change.** If an endpoint needs a column that does not exist, make the change in the scraper repo, then update the matching model here.

## Architecture

**Request flow:** `routers/` → `services/` → `crud/` → `database/`

What exists today:

| Path | Contents |
|---|---|
| `main.py` | The `FastAPI` app. Every router is mounted here. `uv run fastapi dev` serves it. |
| `website.py` | The deployed site: `main.py`'s app under `/api`, the built frontend at `/`, both behind basic auth. The root `Dockerfile` runs it. |
| `settings.py` | `pydantic-settings` configuration: `AppSettings` (`DATABASE_URL`) and `WebsiteSettings`, which only `website.py` reads. |
| `enums.py` | `ReportType` (the 23 stored report type strings) and `SearchSort`. |
| `database/engine.py` | The SQLModel engine, with `default_transaction_read_only=on` and a 30-second `statement_timeout` set as connection options, and the `get_session()` dependency. |
| `database/` | One SQLModel class per table the API reads: `Report`, `Speech`, `Sitting`, `Attendance`, `Speaker`, `Person`, `PartyAffiliation`. Only the columns the API uses. |
| `exceptions/` | `base.py` (`ErrorCode`, `ErrorSpec`, `ERRORS`, `AppHttpExceptionBase`) and one no-argument exception class per domain file. |
| `utils/` | Pure helpers: report slug, official record URL, person slug, sitting date text, `LIKE` escaping, transcript snippet. |
| `validators/` | `search.py`: `validate_can_search`, which a search router calls before the service. |
| `crud/` | One read-only class per table (`CRUDReport`, `CRUDSpeech`, `CRUDSitting`, `CRUDAttendance`, `CRUDMembership`, `CRUDPerson`) and `text_search.py` with the shared full-text constants. See `crud/CLAUDE.md`. |
| `middleware/membership.py` | `get_membership_id_to_person`, which composes `CRUDMembership` and `CRUDPerson` for every service that resolves linked rows to Persons. |
| `middleware/basic_auth.py` | `BasicAuthMiddleware`: answers 401 unless the request carries the configured credentials; `/api/health` is open for the platform's health check. |
| `middleware/frontend.py` | `FrontendFiles`: serves the built frontend and answers `index.html` for any other path, so client routes load. |
| `schemas/` | Pydantic response models, one file per domain. No field defaults. |
| `services/` | Module-level functions, one file per domain: report, sitting, parliament, person, search, coverage. |
| `routers/` | One router per domain plus `health.py`. Each handler calls one service function. |

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
- **Terminology.** A row of the `speaker` table is a Membership everywhere outside `database/`: `CRUDMembership`, `membership_ids`, `membership_id_to_person`. The raw name on a speech is `speaker_label`. See the brief's terminology table.
- **Indexes are the launch gate.** `docs/required-indexes.md` lists every index the API's queries need, with the index definitions the scraper migrations build. All eight exist on production: six since 14 October 2026 (scraper commit `b15908a`), `ix_speech_transcript_tsv` since 17 October and the rum index `ix_speech_transcript_tsv_rum` since 18 October (`489882e`). A server that runs those migrations needs the `rum` extension installed (`postgresql-17-rum` on Debian). Without the indexes the queries are sequential scans, and the speech full-text search exceeds the statement timeout and answers `503 search.timed_out`. The ninth, `ix_speech_transcript_tsv_sitting_date_rum`, and the column `speech.sitting_date` come with scraper migration `c93f77e499cc`, which has not run on production. The `Speech` model reads that column and word search orders and filters by it, so do not deploy this API before the migration ships: every statement that selects a speech would fail. Until then, the API at `613c795` is the one that matches production, and there oldest-first search on one of the ten most common words can still pass the timeout; see "Ranking cost" in that file.
- **`/coverage` and `/parliaments` cache in-process for an hour**, as module state in `services/coverage.py` and `services/parliament.py`, filled on the first request. Restart the API after a scraper load to see new figures at once.
- **`crud/` is read-only here.** The rules in `STYLE.md` about CRUD writes stay in the guide, but this API has no write path.
- **Raw SQL** is limited to the `SELECT 1` health check. Everything else goes through SQLModel.
- **Do not run `mypy`.** Only `ruff` is used for static analysis.

## Environment variables

`settings.py` is the authoritative inventory of every setting and its type. Settings are read with `pydantic-settings`.

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string for the read-only role. |
| `BASIC_AUTH_USERNAME`, `BASIC_AUTH_PASSWORD` | `website.py` only. Required: the site does not start without them. |
| `FRONTEND_DIST_PATH` | `website.py` only. The built frontend; the `Dockerfile` sets it. |

Never put a secret in code or in an example env file.

## Style docs

- **`STYLE.md`** is the resident summary of the coding rules. Follow it when writing or reviewing code. It covers naming, layers, control flow and failure, types and data, the HTTP surface, and comments.
- **`STYLE-RULINGS.md`** is the append-only log of numbered rulings (R1 onward) behind `STYLE.md`. Where the two disagree, the ruling governs. A new convention is recorded there first and propagated to `STYLE.md` in the same commit.
- The rationale and review history behind both live in kelix-audit and are not ported.

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
