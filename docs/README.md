# Docs index

What each file here is for and who reads it. The code's conventions are in `CLAUDE.md` at the root, `api/CLAUDE.md` and `app/CLAUDE.md`, not here.

## Files

| File | What it is | Who reads it |
| --- | --- | --- |
| `how-this-was-built.md` | Royce's statement of how AI tools built the site, and which audits checked it. | Visitors and reviewers |
| `corrections.md` | How an error is reported and the fix for each one reported so far. | Visitors, and Royce when he fixes one |
| `takedown.md` | Public mode and the takedown list: what each setting hides and how a report comes down. | Royce, when he runs the site |
| `api-database-role.md` | The SQL that creates the API's read-only Postgres role. Royce runs it on the remote database. | Royce, and anyone changing database access |
| `required-indexes.md` | Every index the API's queries need, with the definition, the endpoints and the query plans. The launch gate for the database. | Anyone changing a query or a migration |
| `palette.md` | The colour tokens, where each came from and the contrast each reaches. | Anyone touching colour |
| `palette-preview.html` | A page that shows the palette. Open it in a browser. | Anyone touching colour |
| `palette-v2-preview.html` | The v2 changes proposed for the first palette (see `palette.md`), kept as a record. | Anyone touching colour |
| `sgds-tokens.md` | How the non-colour Singapore Government Design System tokens map onto the Tailwind theme. | Anyone touching spacing, type or radii |
| `palette/` | `research.md` and the source photos the colours were sampled from. | Anyone auditing where a colour came from |
| `images/` | The banner and the report screenshot shown in the root `README.md`. | The root `README.md` |

## Decisions

Read these before changing how the API touches the database, how the site is branded, how pages are addressed, or how values are displayed.

| ADR | Decision |
| --- | --- |
| `adr/0001-read-only-api.md` | The API only reads the database. |
| `adr/0002-no-government-identity-marks.md` | The site borrows colours, never government artwork. |
| `adr/0003-search-indexes-in-scraper.md` | The scraper owns every index the API relies on. |
| `adr/0004-permanent-urls.md` | URLs are built from SPRS ids and dates, not database keys, so they survive a rebuild. |
| `adr/0005-palette-from-the-chamber.md` | The palette comes from the debating chamber. |
| `adr/0006-display-what-the-record-prints.md` | The site shows what the record prints, and our reading goes in a note. |
