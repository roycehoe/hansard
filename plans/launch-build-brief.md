# Launch build: brief

Written 18 October 2026 from a grill session with Royce. It locks the build of tasks 1 to 28 from the launch task list, run from one orchestrating session without stopping. Sources: `launch-strategy-brief.md`, `launch-q1-launch.md` (sections 2, 6 and 7), `launch-q2-credibility.md` (recommended actions), `launch-q3-permission.md`, and the 18 October amendment to `docs/adr/0004-permanent-urls.md`.

## Feature description

Build what the private beta and the public launch need, across `roycehoe/hansard` and `roycehoe/hansard-scraper`, in five batches. Batches A, B, C and E change `hansard`; batch D changes the scraper and runs alongside A to C. The site gains preview tags written by the server, checked Speech permalinks, a public mode switch with a takedown list, a `/researchers` page, a footer line saying how current the data is, search load limits, CI and API tests. The scraper gains a crawl rate that matches the letter, a daily refresh that runs as an App Platform scheduled job, adds new rows only and reports to Telegram, and a `refresh_run` table the API reads. Nothing is pushed or deployed, and nothing is requested from SPRS or parliament.gov.sg.

## Resolved terminology

| Term | Canonical meaning |
|---|---|
| Orchestrator | This session, on Opus at xhigh. It runs each batch's pipeline and does not write feature code itself. |
| Worker | A subagent `feat-execute` starts: Sonnet, or Opus for a slice with a `Risk: security` step, always at high. |
| Batch | One pipeline run (`/feat-quick` or `/feat-pipeline`) over a fixed set of tasks. |
| Remote database | The DigitalOcean PostgreSQL 17 database in the scraper's `DATABASE_URL`. |
| Replica | The local `hansard_replica` database. Left as it is; it may fall behind the remote. |
| Scratch database | `hansard_launch`, a local database restored from a dump of the replica at the start of the run. Used for tests and rehearsals. |
| Raw tables | `hansardwebsiteresponse` and `hansardsittingdateresponse`: API responses as received from SPRS. |
| Daily refresh | The scheduled job that fetches new sittings and reports and writes them to the remote database. |
| Refresh run | One execution of the daily refresh, recorded as a row of `refresh_run`. |
| Halt | The daily refresh stops before writing, records the reason in `refresh_run`, and sends a Telegram alert. |
| Checked Speech permalink | `/reports/{slug}?s={ordinal}&q={anchor}`, per ADR 0004's 18 October amendment. |
| Held item | A change kept off `master` until Royce accepts it, listed in the final report. |

## Decisions

### How the run works

1. The orchestrator runs on Opus at xhigh, which Royce chose over Fable and over high. Workers stay at high, as `feat-execute` fixes.
2. Royce gave one GO for all five batches. It covers each `/feat-pipeline` Stage 6 gate and auto-approves commit order. `feat-execution`'s constants are pre-answered by decision 31. The batches don't re-run `/grill-with-docs`, because each `feat-plan` reads this brief.
3. A batch still blocked after the audit's one retry is set aside. The orchestrator moves to the next batch and reports the blocked one at the end.
4. The run starts only after the other session working on both repos this morning has finished.
5. Commits go to `master` in each repo, one per step, in Conventional Commits form, with no attribution. Nothing is pushed. Nothing is deployed.

### What the run may touch

6. The run may connect to the remote database and write to it, because the site is not live and every derived table can be rebuilt from the raw tables. This replaces the Stage 6 line "NOT connect to a live database" and "NOT run data migrations" for this run.
7. The raw tables are read-only for the whole run: no DELETE, UPDATE, TRUNCATE or DROP, and no migration that alters them. `speaker` gets no deletes either, because it has no raw table and rebuilding it needs a new scrape.
8. Before its first write to the remote, the run takes a `pg_dump` of the remote into a file outside both repos.
9. Every write to the speech table still ends with `scripts/attribution_text_share.py` and a `docs/data-loss-register.md` row where the scraper's `CLAUDE.md` asks for one. Royce's approval of each write is waived for this run.
10. Tests and rehearsals use the scratch database.
11. No request goes to SPRS or parliament.gov.sg during the run. Tests use saved fixtures. Task 1's code is written, but the first real fetch, the 15th Parliament backfill, waits until the letter has been sent.
12. Rendered pages are checked with headless Chromium at 375 and 1280 px, with no visible window. Screenshots go to `plans/launch-build-screens/`.
13. New pages and components use only the existing components and patterns in `app/STYLE.md`, so they need no taste proposal. Anything beyond that is a held item. The preview card image is a held item, so preview tags ship without `og:image` until Royce accepts a design.
14. Public text follows the Copy rules in `app/STYLE.md` and the unslop rules. That covers the README, `docs/how-this-was-built.md`, `docs/corrections.md`, the `/researchers` page and the letter edits. It is committed and listed for Royce to review.
15. The public contact address is `hansard@fancybinary.sg`. It goes in the README, in `VITE_CONTACT_EMAIL` and in the crawler's user agent. Royce sets up the mailbox.
16. `docs/how-this-was-built.md` states the facts of the October commit burst: dates, commit counts, that most code was written by AI coding tools, and which audits checked the output.
17. `hansard` gets an MIT LICENSE, matching the scraper, with a note that it covers the code and not Parliament's text.
18. Accounts only Royce can create (Tally, GoatCounter, healthchecks.io, the Telegram bot) are read from environment variables, and their features are hidden while unset. The final report gives setup steps for each.

### Daily refresh

19. The daily refresh runs as an App Platform scheduled job at 04:00 Singapore time. The job component goes in `hansard/.do/app.yaml` and is built from a new Dockerfile in the scraper repo. Parliament's reports appear up to seven working days after a sitting, so daily runs catch each one soon after it appears.
20. Each run requests one thing at a time, at least 2 seconds apart, with the user agent `hansard-scraper (+hansard@fancybinary.sg)`. It asks only for sitting dates after the latest stored sitting, plus the 14-day window in decision 22.
21. A run only adds rows: new raw responses, sittings, reports, speech rows and attendance, plus stage 8 links on the new rows. It never re-parses or rewrites a stored row.
22. Each run re-fetches the reports of the last 14 days and compares a content hash. A changed report gets a Telegram alert and is not rewritten.
23. A run halts on any of these:
    - a new Parliament number
    - an SPRS response that fails `scripts/validate_api_field_mapping.py`
    - more than 5% of new speech rows with a speaker label left unlinked
24. A member missing from the speaker registry does not halt the run. Their rows are stored with no link, and the run sends an alert naming the label. This changes the earlier "halt on a missing member" rule for that one case, because a site that falls behind is worse than a few unlinked rows, and the methods page already reports the unlinked share.
25. A sitting is stored as soon as anything for it is published, attendance included. The footer's "Includes sittings up to" counts only sittings with report text.
26. Telegram:
    - a failure or halt sends its reason at once
    - a run that added anything sends one line ("2 sittings, 14 reports, 1,203 rows, 98.9% linked")
    - a run that added nothing sends nothing
27. healthchecks.io gets a ping at the end of each run and alerts through its Telegram integration when no run has arrived for 26 hours.
28. The scraper owns a new `refresh_run` table: start and finish times, status, halt reason, counts added, and the figures `attribution_text_share.py` reports. The API reads it for the footer line and the site's figures. The migration is applied on the remote during the run.
29. The daily refresh connects through its own database role that can write. Royce creates it, because it is a privilege change. The final report gives the SQL.
30. The letter draft in `launch-q3-permission.md` changes from weekly to daily runs at 04:00, new sittings only, with the 14-day re-check.

### Constants

31. The following constants are fixed:

| Constant | Value |
|---|---|
| Searches running at once | 3; a fourth gets an immediate "busy, try again in a moment" |
| Visitor search statement timeout | 10 s |
| API response cache | in memory, 1 hour, 500 entries; `Cache-Control: public, max-age=3600` on GET |
| Search warm-up script | dropped |
| Preview tag cache | in memory, 1 hour |
| Unlinked-label halt threshold | 5% of new rows |
| Permalink anchor | first 8 words of the paragraph, lowercased, searched within the same Report only |
| Re-check window | 14 days |
| Refresh schedule | daily, 04:00 Singapore time |
| Missed-run alert | 26 hours |
| Crawl gap | at least 2 s, one request at a time |
| Footer line | "Includes sittings up to {date}. Checked daily. Last checked {date}." |

### Batches

32. The batches, in order:

| Batch | Repo | Tasks | Lane |
|---|---|---|---|
| A | hansard | 3 (methods figure to the 17 October result), 4 (README and LICENSE), 5 (slug fix in `hansard/CLAUDE.md`), 7 (corrections path), 8 (`how-this-was-built.md`), 11 (developer pages out of the footer), 12 (`X-Robots-Tag: noindex` behind auth), the letter edit in decision 30 | `/feat-quick` |
| B | hansard | 13 (preview tags), 14 (checked Speech permalink and the "Citing and linking" rewrite), 17 (Copy link and Cite) | `/feat-pipeline` |
| C | hansard | 15 (`PUBLIC_MODE` and the takedown list, which needs an Opus worker), 16 (`/researchers` with a Tally link) | `/feat-pipeline` |
| D | scraper | 1 (crawl rate and user agent), 5 (slug fix in `docs/peer-projects.md`), 6 (README status section), 18 (15th Parliament backfill code, tested on fixtures, not run), 19 (daily refresh, `refresh_run`, Dockerfile, Telegram, healthchecks), and the scraper's CI | `/feat-pipeline`, alongside A to C |
| E | hansard | 9 and 10 (footer line and figures from `refresh_run`), 21 (search load limits), 22 (confirm the RUM index on the remote and that `api/crud/speech.py` uses it), 26 (hansard CI), 27 (API tests on the scratch database), 28 (GoatCounter, copy and cite events, preview-bot counter), the App Platform job component | `/feat-pipeline`, after D |

33. Tasks 20 (Royce's 100-row check), 23 (database resize), 24 (load test), 25 (DNS and the live preview check) are Royce's. The run prepares a load-test script for task 24 and a checklist for the others.
34. The run ends with `plans/launch-build-report.md`. It lists:
    - what landed, with commit hashes
    - held items and set-aside batches, with reasons
    - everything left for Royce: accounts, the write role, the deploy, sending the letter, the first supervised backfill, the 100-row check, the resize, the load test and DNS

## Scenarios confirmed

1. The 04:00 run finds a sitting whose reports are not out yet. It stores the attendance and whatever else SPRS has published. The footer does not count that sitting until report text arrives on a later run.
2. A by-election winner speaks for the first time. Their rows are stored with no link, and Telegram names the label. Royce adds them to the registry, and the next stage 8 run links them.
3. Parliament asks for a report to be taken down. Royce adds a line to the takedown list, commits and deploys. The page returns HTTP 410 with no preview.

## Out of scope

- Any request to SPRS or parliament.gov.sg, including the 15th Parliament backfill run.
- Pushing, deploying, DNS, the database resize and creating accounts.
- Deleting or changing rows in the raw tables, and deleting `speaker` rows.
- The per-speech quote image, the sitemap, and the `plans/` policy in the scraper (tasks 29 to 31).
- Semantic search, AI summaries, rankings of "least" or "absent", and an insights page.
- Royce's 100-row check.
