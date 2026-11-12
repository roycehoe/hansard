# Docs index

I keep the background to Open Hansard here: how I built it, why I made particular decisions, and what's involved in maintaining it. If you're new to the project, start with the [main README](../README.md). For work on the code, the [root CLAUDE.md](../CLAUDE.md) gives an overview, with more specific conventions in the [website](../app/CLAUDE.md) and [API](../api/CLAUDE.md) guides.

## Files

| File | What it is | Who reads it |
| --- | --- | --- |
| [how-this-was-built.md](how-this-was-built.md) | My account of building with AI tools, the decisions I made, and what the audits and reviews did and didn't check. | Visitors and reviewers |
| [corrections.md](corrections.md) | Where to report an error and follow the fixes, including what was wrong and how it changed. | Readers reporting errors, and me when I fix them |
| [user-testing.md](user-testing.md) | The plan for usability sessions, with the tasks I'll ask readers to try and a log for findings once sessions begin. | Visitors and reviewers |
| [running-cost.md](running-cost.md) | How I'll track visits, hosting costs and corrections each quarter, including the calculation for cost per 1,000 visits. | Readers interested in running costs, and site maintainers |
| [takedown.md](takedown.md) | Instructions for controlling public access and taking a report down, including how to check that it's hidden. | Me, or anyone maintaining the site |
| [api-database-role.md](api-database-role.md) | The database setup I use to give the API read-only access, with checks that it cannot change the records. | Anyone setting up or changing database access |
| [security.md](security.md) | A look at what the site exposes, the protections around it, and what's outside their scope. | Reviewers and anyone changing how the site is secured or deployed |
| [required-indexes.md](required-indexes.md) | The database indexes behind the API's queries, with definitions, query plans and past performance measurements to help investigate slow requests. | Anyone changing queries or the database |
| [database-upgrade.md](database-upgrade.md) | What would persuade me to pay for a larger database, and what to try before that. | Me, or anyone maintaining the site |
| [palette.md](palette.md) | Where the site's colours came from and how their contrast was checked, with earlier choices kept for reference. | Anyone working with the site's colours |
| [palette-preview.html](palette-preview.html) | A browser preview for seeing the palette's colours together in light and dark themes. | Anyone working with the site's colours |
| [palette-v2-preview.html](palette-v2-preview.html) | A preview of the changes proposed to the first palette, kept alongside the history in [palette.md](palette.md). | Anyone looking through the colour choices |
| [sgds-tokens.md](sgds-tokens.md) | How spacing, typography and other non-colour design values from the Singapore Government Design System carry over into the site's Tailwind theme. | Anyone working on the site's layout or typography |
| [palette/](palette/) | The colour research in [research.md](palette/research.md), source notes and reusable assets. The current chamber photos are cited in [palette.md](palette.md) but aren't included because they lack an open licence. | Anyone tracing the colours or checking asset sources |
| [images/](images/) | The banner and report screenshot used to introduce the project in the main README. | Anyone updating the main README's images |

## Decisions

These architecture decision records (ADRs) explain why I built parts of the site the way I did, including the compromises involved. If you're considering a change to the database access, design, links or treatment of the parliamentary record, the relevant decision is a useful place to start. Read its amendments too; some choices have changed as the project has developed.

| ADR | Decision |
| --- | --- |
| [adr/0001-read-only-api.md](adr/0001-read-only-api.md) | Why I keep the API read-only and leave changes to the database with the scraper. |
| [adr/0002-no-government-identity-marks.md](adr/0002-no-government-identity-marks.md) | How I borrow colours and design patterns without using government identity marks that could make the site look official. |
| [adr/0003-search-indexes-in-scraper.md](adr/0003-search-indexes-in-scraper.md) | Why search uses PostgreSQL, with the scraper responsible for the indexes it needs. |
| [adr/0004-permanent-urls.md](adr/0004-permanent-urls.md) | How links are meant to survive archive updates, and the limits that remain for person and speech links. |
| [adr/0005-palette-from-the-chamber.md](adr/0005-palette-from-the-chamber.md) | Why I chose colours from the debating chamber, and how the source photos' licences limit their use. |
| [adr/0006-display-what-the-record-prints.md](adr/0006-display-what-the-record-prints.md) | Why the site preserves what the record prints, with my interpretation in a note beside it. |
| [adr/0007-site-name-and-dataset-name.md](adr/0007-site-name-and-dataset-name.md) | Why I named the website Open Hansard while keeping Singapore Parliamentary Record as the dataset's name, so existing citations still make sense. |
| [adr/0008-pages-render-on-the-client.md](adr/0008-pages-render-on-the-client.md) | Why pages load their text in the browser while the server supplies titles and sharing information, what that costs readers and search engines, and why report pages and the home page now also carry server-written text for AI readers that run no JavaScript. |
| [adr/0009-ai-readers-person-judges-flags.md](adr/0009-ai-readers-person-judges-flags.md) | How I use AI checks to find possible errors for review, including decisions made by category and the process for repeat checks. |
| [adr/0010-search-notes.md](adr/0010-search-notes.md) | Why search may add a note when a hidden rule leaves out or adds records, and why the note never changes the results. |
| [adr/0011-links-come-from-fixed-rules.md](adr/0011-links-come-from-fixed-rules.md) | Why every link between records comes from a fixed rule, and why similarity scores and AI matching may not make one. |
| [adr/0012-act-note-on-search.md](adr/0012-act-note-on-search.md) | Why search may name an Act whose title the words contain, and which ADR 0010 gates that note departs from. |
