# Hansard foundation: Brief

## Feature description

Set up `roycehoe/hansard`, the web app that will sit on top of the handsard-scraper Postgres database. This run delivers four things in order: convention docs ported from kelix-audit, a bare frontend in `app/` and a bare backend in `api/`, a colour palette drawn from photos of Singapore Parliament and from Singapore insignia, and a shadcn component library styled with that palette and shown on an in-app `/design` route. There is a human gate after the palette. The run stops before user stories, domain components and data endpoints.

## Resolved terminology

| Term | Canonical meaning |
|---|---|
| Scraper | The `roycehoe/handsard-scraper` repo. It owns the Postgres schema and every Alembic migration. |
| API | The FastAPI backend in `hansard/api/`. Read-only against the scraper database. |
| App | The React frontend in `hansard/app/`. |
| Convention docs | The `CLAUDE.md`, `STYLE.md` and `STYLE-RULINGS.md` files that govern code style in this repo. |
| Source photo | An image committed under `docs/palette/sources/` that at least one palette token was sampled from. |
| Palette token | A named colour in `app/src/index.css` with a light value, a dark value and a citation to its source photo or insignia. |
| Primitive | A shadcn component restyled with palette tokens (button, input, dialog and so on). |
| Layout piece | A page-level component: site header, footer, page header, empty state, error state. |
| Domain component | A component tied to Hansard data, such as a speech card or speaker profile. Out of scope for this run. |
| Palette gate | The stop after the palette is drafted, where Royce approves or edits it before any component work starts. |

## Decisions

1. **Run scope.** Four deliverables: convention docs, bare app and API, palette, component library. It ends with a palette gate in the middle and a final review at the end. User stories, domain components and data endpoints come in a later run.
2. **Convention docs are ported, not copied verbatim.** Port the rules from kelix-audit `app/STYLE.md`, `api/STYLE.md` and `api/STYLE-RULINGS.md` and keep their wording. Strip anything specific to Kelix: Azure, Key Vault, MSAL, Entra, `AB#` branch names, the team squash-merge policy, CEM/KE/AuditFlow terms and Kelix file:line citations. Write new `CLAUDE.md` files for the root, `app/` and `api/` that describe this repo. Port `api/crud/CLAUDE.md` once the API has a `crud/` layer, which this run does not add. Leave out `STYLE-REFERENCE.md` and `CONTEXT.md` and put one line in `api/STYLE.md` saying the rationale and review history live in kelix-audit.
3. **The axios rule is replaced.** `app/STYLE.md`'s "HTTP Client" section and the axios-shaped response rules now point to a typed `fetch` wrapper in `app/src/api/client.ts`. axios is never a dependency.
4. **Layout mirrors kelix.** `app/` and `api/` sit at the repo root, so the ported docs keep their paths and the `style-sync` skill works unchanged.
5. **App stack.** pnpm, TypeScript, Vite 8, React 19.3, Tailwind 4.3, shadcn (CLI 4.x, Tailwind v4 mode, `tw-animate-css`), TanStack Router, Query and Table, React Hook Form with Zod, lucide icons. Pin exact versions in `package.json`, as kelix does.
6. **Runtimes and tools.** Node 24 (Active LTS) is pinned in `.tool-versions` for asdf and in `package.json` `engines`, with a `TODO` to move to Node 26 after it becomes LTS on 28 Oct 2026. Python 3.15 is pinned in `api/.python-version` and `requires-python`. **uv** manages Python dependencies, not Poetry. uv is not installed on this machine yet: install it with `brew install uv`. Install Node 24 with `asdf install nodejs`.
7. **The API is read-only against the scraper database.** No Alembic in `api/`. The API connects through a read-only Postgres role and will declare its own SQLModel classes, one for each table it reads, once endpoints exist. It does not import the scraper's models. For this run the API has `settings.py` (pydantic-settings, `DATABASE_URL`), an engine, and `GET /health`, which runs `SELECT 1`.
8. **Palette method.** No browser automation. Workers curl openly licensed photos, extract dominant colours with PIL k-means, and view each image to confirm what each cluster is (robe, granite, seat leather and so on). Categories to cover: Speaker's and Clerks' robes, Serjeant-at-Arms and staff uniforms, granite, chamber seats, official portraits, the terracotta used on the building, wood, the grass outside, the gates, the driveway. Insignia colours come from the national flag (its specified red and white), the State Crest, the Parliament mace and Parliament's own marks. The parliament.gov.sg website gives the starting palette, and any of its colours can be dropped.
9. **Source photos are committed.** Every image a token was sampled from goes in `docs/palette/sources/`, resized so the long edge is at most 1600 px. `docs/palette/sources/SOURCES.md` records, for each image, the source URL, author, licence, date fetched and what was sampled. Only images with a known licence get used. The repo is private. If it is ever made public, recheck the `SOURCES.md` licences first.
10. **Palette deliverables.** `docs/palette.md` lists each token with light and dark hex values, its role (background, surface, text, accent, border, state), its citation and its WCAG contrast ratios against the surfaces it sits on. `docs/palette-preview.html` is a standalone page of swatches for review at the gate. A script in `app/scripts/` checks contrast so the numbers can be re-run.
11. **Palette gate.** The run stops after decision 10 and reports. Components do not start until Royce approves the palette.
12. **No government identity marks.** Borrow layout and interaction patterns from SGDS v3 and Isomer: spacing, type scale, navigation, search, tables, footers. Never use the "A Singapore Government Agency Website" masthead, the State Crest artwork, the Lion Head symbol, gov.sg branding or a gov.sg-style domain. The footer says the site is unofficial and independent of the Parliament of Singapore.
13. **Component scope.** Primitives: button, input, textarea, select, checkbox, radio group, switch, dialog, alert dialog, sheet, dropdown menu, tabs, accordion, table, badge, alert, tooltip, pagination, breadcrumb, skeleton, card, separator, date picker, toast (sonner). Layout pieces: site header with nav and search, footer, page header, empty state, error state. Every one appears on the `/design` route, in every variant and size, in both themes. No Storybook.
14. **Visual targets.** Light and dark themes from day one, following kelix `app/STYLE.md` "Colours": semantic tokens only, no raw palette names, no opacity tints. WCAG 2.2 AA. Inter for UI text and a serif for headings and Hansard text. The palette workers pick the serif and record why in `docs/palette.md`.
15. **Orchestration.** A Fable 5 orchestrator runs the run. Every worker's model is set explicitly. Haiku fetches photos, extracts colours and runs measurements. Sonnet handles the scaffolds, doc ports, per-category colour notes and components. Opus synthesises the palette and does the final review, because both are taste and correctness calls. Independent work runs concurrently.
16. **Git.** Commit straight to `master` in `roycehoe/hansard`. Conventional Commits, one logical change per commit, no attribution trailers or AI mentions anywhere. Run `git branch --show-current` before every commit. Never push.
17. **Photo gaps (gate, 2026-10-13).** The former-chamber wood and seat samples are accepted with the caveat recorded in `docs/palette.md` and `SOURCES.md`. Royce may add his own photos later. Only images with a known licence are used.
18. **Primary and destructive (gate).** Both stay red as drafted.
19. **Separator token (gate).** A lighter `separator` token, in light and dark, covers decorative lines: card edges, table rules, dividers. `border` and `input` stay at 3:1 because they mark controls. The brief asks for WCAG 2.2 AA, not 3:1 on every border. `pnpm contrast` checks that `separator` exists in both themes and applies no minimum.
20. **Leather maroon (gate).** The unused former-chamber leather maroon (#863427) is dropped from the palette's open points.
21. **v2 palette (2026-10-13).** Adopt proposal 2, `highlight` (orchid lilac), and proposal 3, `tag` and `tag-border` (veneer and teak). Defer proposal 1 (reading tint), 4 (heading band) and 5 (chart-6) until a screen needs them; they stay listed in `docs/palette.md` as deferred.
22. **Photos with people.** `civic-chamber-benches.jpg` and `civic-cavenagh-pylon.jpg` stay.
23. **Dark `secondary-active`.** Raised so `muted-foreground` on it reaches 4.5:1; the pair is in `pnpm contrast`.
24. **Blues.** `info` and `chart-3` are accepted in status and chart roles only, as `docs/palette/research.md` flags.
25. **SGDS non-colour tokens.** Spacing, type scale, radius, borders, breakpoints, containers, focus ring, shadows and motion follow SGDS v3 where it defines them, mapped in `docs/sgds-tokens.md`. Colours stay Parliament-sourced; no identity mark (ADR 0002).

## Scenarios confirmed

1. **A sampled colour fails contrast.** The Speaker's robe green is too dark to use as text on the dark surface. It stays as an accent or border token, and a lighter derived token covers text use. `docs/palette.md` lists both and records that the second is derived from the first.
2. **A worker wants the State Crest in the header.** Decision 12 forbids it. The header uses a plain wordmark set in the chosen serif. Insignia contribute colours, not artwork.
3. **A component needs data on `/design`.** A table on `/design` needs rows. It uses static fixtures in the app. No component calls the API in this run, and the API exposes only `/health`.
4. **A great photo has no clear licence.** Skip it and find another. Nothing goes into `docs/palette/sources/` without a `SOURCES.md` row that names its licence.

## Out of scope

- User stories, domain components (speech card, speaker profile, sitting timeline) and data endpoints.
- Alembic or any schema change in the API. The scraper owns the schema.
- Storybook.
- Importing the scraper's models as a package.
- Porting `STYLE-REFERENCE.md`, `api/CONTEXT.md` and `api/ai/*`.
- Deployment, CI and auth.
- Playwright or any launched browser for research.
