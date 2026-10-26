# CLAUDE.md

Repo root. Thin by design: orientation plus the few facts that sit between the two subsystems. Each subsystem's own conventions are in its `CLAUDE.md` and `STYLE.md`; read those when you work in that subtree. The large `STYLE.md` files are not imported here on purpose.

## What this is

A web app for browsing Singapore Parliament Hansard records. The data comes from the Postgres database that `roycehoe/hansard-scraper` builds and owns. This repo reads it and never writes to it.

## Layout

| Path | What it is | Conventions |
|------|-----------|-------------|
| `app/` | Frontend: React 19, TypeScript, Vite, Tailwind 4, shadcn, TanStack | `app/CLAUDE.md`, `app/STYLE.md` |
| `api/` | Backend: Python 3.15, FastAPI, SQLModel, read-only against the scraper database | `api/CLAUDE.md`, `api/STYLE.md`, `api/STYLE-RULINGS.md` |
| `docs/` | Palette, indexes, takedown and corrections notes, and the ADRs. `docs/README.md` says what each file is for. | `docs/README.md` |
| `docs/adr/` | Architecture decision records. Read these before changing how the API touches the database or how the site is branded. | |
| `plans/` | Local feature briefs and pipeline state. Gitignored, so not in the repository. | |

Defer to the most specific `CLAUDE.md` for the code you are touching.

## Commands

```bash
# Frontend (from app/)
pnpm install
pnpm dev          # http://localhost:5173
pnpm build
pnpm lint
pnpm format
pnpm palette      # regenerate src/palette.css from the named colours
pnpm contrast     # WCAG check of every colour pair

# Backend (from api/)
uv sync
uv run fastapi dev        # http://localhost:8000, needs DATABASE_URL (see api/.env.example)
uv run ruff check .
uv run ruff format .
uv run pytest -m "not database"   # tests that need no database (what CI runs)
uv run pytest                     # every test; the database ones need the scratch database, see api/CLAUDE.md

# The deployed site (from the repo root): one container, frontend and API
docker build -t hansard-web .
```

The App Platform spec is `.do/app.yaml`. The container serves the frontend at `/` and the API at `/api`; see `api/CLAUDE.md`.

Runtimes: Node 24 and pnpm from asdf (`.tool-versions` at the root), Python 3.15 through uv (`api/.python-version`). Node 26 becomes LTS on 28 Oct 2026; move `.tool-versions` and `app/package.json` `engines` to it after that date.

## Cross-subsystem facts

- **The scraper owns the schema.** Every table and every Alembic migration lives in `roycehoe/hansard-scraper`. `api/` has no Alembic, connects through a read-only Postgres role, and declares its own SQLModel class for each table it reads. It does not import the scraper's models. See `docs/adr/0001-read-only-api.md`.
- **No shared type generation.** Request and response shapes are declared twice: TypeScript interfaces in `app/`, Pydantic schemas in `api/`. Change an API contract, update both sides by hand.
- **No government identity marks.** The palette borrows colours from Parliament House and national insignia, never the artwork, and the footer says the site is unofficial. See `docs/adr/0002-no-government-identity-marks.md`.
- **Record what cleaning loses.** Any change that cleans data on the way out of the database (merging two party spellings, hiding rows, rewriting a name) adds a row to the scraper's `docs/data-loss-register.md`, as the scraper's own cleaning does.
- **Display what the record prints.** The site shows a value as the record prints it, never a corrected one, and our reading goes in a note beside it, as the column marker's `TooltipColumnNote` does. See `docs/adr/0006-display-what-the-record-prints.md` and the scraper's ADR 0013.
- **Keep a change scoped to one subsystem** unless the task genuinely spans both.

## Git

- Commit straight to `master`. No branches.
- Conventional Commits: `type: description`, subject under 72 characters, one logical change per commit.
- No attribution trailers, no co-author lines.
- Never push unless asked in that session.
