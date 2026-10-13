# Exploration: Hansard user stories

## Files read
- `plans/hansard-user-stories-brief.md`: the locked spec
- `plans/hansard-foundation-brief.md`: foundation decisions 1 to 29
- `docs/adr/0001-read-only-api.md` to `0004-permanent-urls.md`: API, branding, index and URL rules
- `CLAUDE.md`, `app/CLAUDE.md`, `app/STYLE.md`, `api/CLAUDE.md`, `api/STYLE.md`, `api/STYLE-RULINGS.md`: conventions
- `api/main.py`, `api/settings.py`, `api/database/engine.py`, `api/routers/health.py`: everything the API has today
- `app/src/main.tsx`, `app/src/index.css`, `app/src/api/client.ts`, `app/src/routes/__root.tsx`, `app/src/routes/index.tsx`, `app/src/routes/design.tsx`: app entry, theme and routes
- `app/src/components/layout/*.tsx`, `app/src/hooks/useTheme.ts`: header, footer, page header, notices
- `app/src/components/ui/{badge,button,pagination,skeleton,spinner,alert,breadcrumb,table,tabs,input,select}.tsx`: primitives to build on
- `app/src/components/design/*`: fixtures and the TanStack table shape
- `app/package.json`, `app/vite.config.ts`, `app/.prettierrc.cjs`, `app/eslint.config.js`, `app/tsconfig.app.json`, `api/pyproject.toml`: tooling
- `docs/sgds-tokens.md`, `docs/palette.md`: spacing scale, `tag` and `highlight` tokens
- `/Users/meinhardt/ghq/github.com/roycehoe/handsard-scraper/docs/data-dictionary.md` and `database/{report,speech,sitting,attendance,speaker,person}.py`: the schema (read-only)
- `/Users/meinhardt/ghq/github.com/roycehoe/handsard-scraper/docs/vision.md` ("Measuring progress") and `docs/adr/0001-attribution-denominator.md`: the three attribution numbers
- `/Users/meinhardt/ghq/github.com/roycehoe/handsard-scraper/docs/report/post-2012-text.md`: SPRS routes and the sprs2/sprs3 split
- `/Users/meinhardt/ghq/github.com/livelymushroom/kelix-audit/api/crud/CLAUDE.md`, `exceptions/base.py`, `exceptions/eula.py`, `routers/eula.py`, `services/eula.py`, `schemas/eula.py`, `crud/user_product_tour.py`, `database/init.py`: patterns to port

## Symbols confirmed
| Symbol | File | Line |
|---|---|---|
| `engine` | `api/database/engine.py` | 5 |
| `settings`, `AppSettings.database_url` | `api/settings.py` | 4-10 |
| `router`, `get_health` | `api/routers/health.py` | 7-13 |
| `app`, `app.include_router` | `api/main.py` | 6-16 |
| `apiGet`, `ApiError`, `API_URL` | `app/src/api/client.ts` | 1-50 |
| `NAV_ITEMS`, `SiteHeader`, `submitSearch` | `app/src/components/layout/SiteHeader.tsx` | 9-18 |
| `FOOTER_COLUMNS`, `SiteFooter` | `app/src/components/layout/SiteFooter.tsx` | 1-29 |
| `PageHeader` | `app/src/components/layout/PageHeader.tsx` | 10 |
| `NoticeEmpty` | `app/src/components/layout/NoticeEmpty.tsx` | 11 |
| `NoticeError` | `app/src/components/layout/NoticeError.tsx` | 13 |
| `badgeVariants`, `Badge` | `app/src/components/ui/badge.tsx` | 6, 31 |
| `Pagination*` | `app/src/components/ui/pagination.tsx` | 11-135 |
| `Skeleton` | `app/src/components/ui/skeleton.tsx` | 3 |
| `Table*` | `app/src/components/ui/table.tsx` | 4-110 |
| `cn` | `app/src/lib/utils.ts` | 4 |
| `createFileRoute`, route pattern | `app/src/routes/design.tsx` | 17 |

## Database facts confirmed (read-only, 13 October 2026)
- Tables and columns as in the scraper models; `sitting.sitting_date` is `varchar` in `D-M-YYYY`.
- Indexes: `report_pkey`, `report_report_id_key`, `speech_pkey`, `sitting_pkey`, `sittingattendance_pkey`, `mp_pkey`, `ix_speaker_person_id`, `person_pkey`. Nothing else.
- `rtrim(report_id, '#')` is unique across 37,929 rows; 3,878 end in `##`; no other URL-unsafe character.
- `speech.ordinal` minimum is 1.
- `report_version` is `sprs2` (21,708, to 2012-08-13, all with `html_file_name`) or `sprs3` (16,221, from 2012-09-10).
- Every `report.sitting_date` has a `sitting` row with the matching `D-M-YYYY` string.
- `default_text_search_config` is `pg_catalog.simple`.
- EXPLAIN of the candidate queries: speech by `report_id` and the full-text filters are parallel sequential scans; attendance by `sitting_id` and report by `sitting_date` are sequential scans; `report_id IN (...)` is an index scan on `report_report_id_key`.

## Layers / modules affected
- `api/`: `database/` (engine session and six models), `enums.py`, `exceptions/`, `utils/`, `crud/` (seven classes plus `crud/CLAUDE.md`), `schemas/`, `services/`, `routers/`, `main.py`, `CLAUDE.md`.
- `app/`: `src/api/<feature>/` hooks, `src/constants/`, `src/lib/`, `src/components/{reports,sittings,people,search,coverage,layout}`, `src/routes/`, `components/ui/badge.tsx`, `vite-env.d.ts`, `.env.example`, `CLAUDE.md`.
- `docs/required-indexes.md`.
