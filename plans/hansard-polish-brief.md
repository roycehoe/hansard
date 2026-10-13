# Hansard polish: Brief

## Feature description

Three workstreams run at the same time.

1. **Footer.** The footer shrinks to one compact band.
2. **AI look.** Research agents find out what makes a website look AI-generated, and look for existing skills that clean such sites up. An Opus judge then reviews every page of the app against what they found. Clear AI tells get fixed directly. Anything that is a matter of taste goes into an artifact with a before and after for each proposal, and Royce accepts or rejects each one.
3. **Speed.** The run adds indexes to the scraper database through an Alembic migration in hansard-scraper. The migration is rehearsed locally and then applied to production. The API gains response caching and gzip, and the app preloads routes. The aim is every endpoint under 300 ms warm.

Everything from the foundation brief and the user-stories brief still holds, except where decision 9 below lifts a hard rule.

## Context this brief rests on

Measured on 14 Oct 2026 against the database the API and the scraper both use. It's remote, and this brief treats it as production.

| Endpoint | Time | Cause |
|---|---|---|
| `/reports/{slug}` | 9.9–12 s cold, 2.7 s warm | Parallel seq scan of `speech` (630 MB) for `report_id`. 61,106 buffers read to return 4 rows. The report lookup itself takes 41 ms, because `report.report_id` has a unique index. |
| `/coverage` | 22.4 s | Whole-table aggregates on every request. No API cache. |
| `/people/{id}` | 5.6 s | Seq scan on `speech.speaker_id`. |
| `/parliaments` | 2.5 s | Aggregate over `report`. |
| `/sittings/{date}` | 1.1 s | No index on `report.sitting_date`. |

Indexes that exist today:
- `report`: `report_pkey`, `report_report_id_key`
- `speaker`: `mp_pkey`, `ix_speaker_person_id`
- `speech`, `attendance`, `sitting`, `person`: primary keys only

Docker runs `hansard-rehearsal` (Postgres, port 5433).

## Resolved terminology

| Term | Canonical meaning |
|---|---|
| AI tell | A visible pattern in the design or UI copy that people associate with AI-generated websites. |
| Clear fix | An AI tell whose fix removes something broken, fake or non-functional and doesn't change how the site looks (decision 4). |
| Taste proposal | An AI tell whose fix changes how the site looks or the tone of its copy. Royce decides it in the artifact. |
| Production | The remote Postgres that `DATABASE_URL` points at in both `api/.env` and the scraper. |
| Rehearsal | The local `hansard-rehearsal` Postgres container on port 5433. |

## Decisions

1. **Footer.** One compact band, about 80 px tall on desktop. It keeps the ADR 0002 line "Unofficial. Independent of the Parliament of Singapore." Links: Coverage, Official Report, and the contact address once `VITE_CONTACT_EMAIL` is set. The four placeholder `#` links go (About Hansard, Accessibility, Source code, Report a problem), and so does the Browse column, which repeats the header nav. Royce approved this change, so it isn't a taste proposal.
2. **AI-look scope.** Visual design (layout, type, colour, spacing, component defaults) and UI copy on every route, including `/design` and `/palette`. Code style is out of scope.
3. **Research.**
   - Three Sonnet researchers run in parallel:
     - articles and design writing on AI tells,
     - developer discussion (HN, Reddit, X),
     - existing skills and checklists for cleaning up AI-looking sites.
   - The run reads each skill it finds in full and vets it for scripts and network calls. It then applies the skill's instructions in-session and never installs it into `~/.claude/skills`.
   - An Opus judge reviews the site against the findings and sorts each finding into a clear fix or a taste proposal.
4. **Clear fix or taste proposal.**
   - **Clear fix.** The fix removes something broken, fake or non-functional and leaves the look unchanged:
     - placeholder links,
     - filler or AI-vocabulary UI copy (puffery, em dashes, "Explore", "Discover", "Seamless"),
     - duplicated nav,
     - text describing features that don't exist,
     - accessibility defects.

     The run applies these and commits them.
   - **Taste proposal.** Any change to type, colour, spacing, layout, radius, shadow, icons or component choice, and any copy where the tone is a choice.
   - **Ties go to Royce.** So does any proposal that contradicts a foundation decision (Inter, shadcn defaults, the insignia palette, SGDS tokens).
5. **Taste proposals are prototyped, never committed.** The run applies each proposal to a scratch copy of `app/` in the scratchpad, takes screenshots, and throws the copy away. Master only ever receives proposals Royce has accepted, in a follow-up run.
6. **Taste artifact.** A private artifact with one card per proposal. Each card shows:
   - the before screenshot,
   - the after screenshot,
   - the AI-look reason, with its source,
   - the files the change would touch.

   Each card has Accept and Reject buttons, and the artifact stores each pick so the follow-up run can read it back. The follow-up run applies only accepted proposals.
7. **Screenshots.** Headless Chromium through Playwright, installed in the scratchpad and never added to the app's dependencies. No window opens. Every route is shot at 1280 px and at 375 px.
8. **Index migration.**
   - An Alembic migration in hansard-scraper uses `CREATE INDEX CONCURRENTLY` inside `autocommit_block()`, so a running scrape isn't blocked. Its downgrade drops the same indexes concurrently.
   - The scraper's SQLModel classes declare each index (expression GIN indexes in `__table_args__`), so `alembic check` stays clean.
   - The start set is the seven indexes in `docs/required-indexes.md`. An Opus worker may add more after running EXPLAIN on every API endpoint. An index ships only if an endpoint's plan uses it and the measured time drops.
   - No stored tsvector column, because adding one rewrites the 630 MB `speech` table under an exclusive lock.
9. **Hard rule lifted for this run only.** The run may edit the hansard-scraper repo and write to its databases, for the index migration and nothing else. Scraper commits go to master. Nothing gets pushed, in either repo. Every other scraper change stays off limits. The run never prints `DATABASE_URL`.
10. **Rehearsal, then production.** The migration runs on rehearsal first. If rehearsal lacks the data, the run may restore it from a `pg_dump` of production (a read on production). Production runs with no stop for Royce, but behind two automatic gates: the rehearsal passes, and an Opus review of the migration finds no blockers. Any failure aborts, and an index left INVALID by a failed concurrent build gets dropped.
11. **API speed-ups.**
    - `/coverage` and `/parliaments` cache their results in-process. Each cache fills lazily on the first request, with a one-hour TTL. Nothing computes at startup, so startup never waits on a slow aggregate.
    - `GZipMiddleware` goes in `main.py`.
    - The app's router sets `defaultPreload: 'intent'`, so it loads a page's data when the pointer hovers its link.
12. **Speed targets.** Every endpoint under 300 ms warm once the indexes exist. `/coverage` under 50 ms from cache. Any endpoint that misses its target is reported with its EXPLAIN, not hidden.
13. **Search verified.** Once the GIN indexes exist, the run verifies B1 and B2 end to end against production, marks them verified in the user-stories plan, and updates `docs/required-indexes.md` to record which indexes exist.
14. **Orchestration.** One Fable 5 orchestrator runs the three workstreams at once with subagents, each subagent's model set explicitly. There's no feat-plan, audit or validate pipeline. The final gate is an Opus review of the whole diff, alongside the migration gate in decision 10.

## Scenarios confirmed

1. **A placeholder link.** "Accessibility" points to `#`. That's a clear fix, and the run removes it without asking.
2. **Inter.** Anthropic's frontend-design skill calls Inter a generic AI font, and Inter is a foundation decision. That makes it a taste proposal: the artifact shows the current type next to an alternative, and the run commits nothing until Royce accepts.
3. **A concurrent index build fails on production.** The run drops the INVALID index, aborts the production step, leaves every index already built in place, and reports what exists.
4. **Search with the GIN index.** `GET /search/speeches` stops returning 503. If a common term still takes more than 300 ms because of ranking cost, the run reports the measured time and the EXPLAIN, and doesn't add a workaround.

## Out of scope

- Applying taste proposals. A follow-up run does that, after Royce's picks.
- A written AI-look report. Royce dropped it in favour of fixes and the artifact.
- Any scraper change beyond the index migration: column numbers, party normalisation, the backfill, session numbers, LA memberships, sitting order.
- A stored tsvector column, or a search engine outside Postgres.
- Pushing, deploying or hosting.
