# Data sanity personas: Brief

## Feature description

Four persona agents use the Hansard app the way its target users would, and flag every place where the returned data looks wrong. Each persona drives the API with curl, reads the rendered pages through headless Chromium, checks results against the database with read-only SQL, and compares a sample of Reports against the official record on SPRS. An Opus triage agent confirms each finding, merges duplicates, assigns the owning repo and writes `plans/data-sanity-personas-findings.md`. Royce and later agents will fix problems from that file, so each finding carries enough detail to reproduce it and start a fix without redoing the investigation. This run changes no code.

## Resolved terminology

Terms from `plans/hansard-user-stories-brief.md` still hold: Report, Sitting, Speech, Person, Membership, Speaker label, Presiding officer, Linked, Text-less report, Derived text, Official record.

| Term | Canonical meaning |
|---|---|
| Persona | A Sonnet agent that plays one target user and tests the app the way that user would. |
| Finding | One data problem a persona reports, with evidence. |
| Triage | The Opus pass that confirms, merges and classifies findings. |
| Owner | The repo whose code causes a finding: `api`, `app` or `scraper`. |
| Explained | A discrepancy that a known gap or a design decision fully accounts for. Recorded, but not a bug. |
| Known gap | A data limit already documented, listed under decision 6. Personas do not report these. |

## Decisions

1. **Feature name** `data-sanity-personas`. Findings go to `plans/data-sanity-personas-findings.md`, which gets committed.
2. **Four personas run at once**, taken from the ranked user list in the user-stories brief:
   - a historian or political scientist, who also plays the data user and calls the API directly, since JSON and CSV export aren't built,
   - a Section 9A legal researcher,
   - a journalist,
   - a citizen.

   Civil servants are not a persona.
3. **How the personas use the app.** They call the API with curl and read pages through headless Chromium installed in the scratchpad. No browser window opens. The Playwright MCP tools are not used.
4. **The run uses its own instances.** The Hansard API runs on port 8001, and a second Vite instance runs on 5174 with `VITE_API_URL=http://localhost:8001`. The process on port 8000, which belongs to another project, is left alone. Both instances use the production database through `api/.env`. Nobody prints `DATABASE_URL`.
5. **What the personas check against.** All four sources:
   - the app against itself, for example counts on one page against counts on another,
   - read-only SQL against the database, through a wrapper that forces `default_transaction_read_only=on` and a statement timeout,
   - what the persona would know about the subject,
   - the official record on SPRS, about 10 Reports per persona, fetched with curl.
6. **Every persona gets the known gaps:**
   - no Report text after 13 Aug 2012,
   - Parliament 15 missing,
   - no column numbers,
   - a common search term such as "government" can answer `503 search.timed_out`,
   - party strings may be uncleaned.

   Nobody knows yet whether the party strings have been cleaned. The personas check, and the findings file states the result.
7. **Spread.** Each persona covers 1955 to 1965 Legislative Assembly, the 1970s and 80s, the 1990s, 2000 to 2012, and text-less Reports after 2012. Every persona also checks speech kind and how a speaker's run of speeches is grouped, since that code is the newest (commits `ee80a9b` to `64e4128`). Royce named no Person, bill or date.
8. **Load on production.** Each persona sends one request at a time. A 503, a timeout or a response slower than 10 s makes the persona wait 60 s before trying again, and wait longer each time it repeats. After three failures in a row, the persona stops querying for 5 minutes. Each persona gets a budget of about 40 tool calls.
9. **Models.** Personas run on Sonnet. Triage runs on Opus, because a false alarm in the findings file costs Royce more time than the triage pass does.
10. **Finding format**, written for a future agent that fixes it:
    - title, severity (high, medium, low) and owner,
    - status: confirmed, explained or unconfirmed,
    - personas that hit it,
    - the app URL and the API call with its parameters,
    - expected value, actual value, and how the expected value was established, whether by SQL, SPRS or another page,
    - a curl command and, where useful, the SQL that reproduces it,
    - the suspected cause, with `file:line` for `api` and `app`, or the table and column for `scraper`,
    - a direction for the fix,
    - how many records it affects, counted with SQL where possible, and up to five examples.
11. **Flag only.** No code changes in either repo.

## Scenarios confirmed

1. **Speech counts disagree.** A Person page says 1,200 speeches while a search filtered to that Person finds 300. Search covers only Speeches with text before Aug 2012, and only Linked ones. Triage checks with SQL whether those two facts explain the whole difference. If they do, it's Explained. If not, it's a finding.
2. **A named Speaker label isn't linked.** "The Minister for Law (Prof S Jayakumar)" shows as plain text. Not guessing links is by design, but a Speaker label with a name in it that fails to link is a missed link in the scraper. It is reported as one scraper-owned, low-severity finding with a count from SQL, not one finding per Speech.
3. **Derived text differs from SPRS.** The finding quotes both versions and is owned by the scraper.

## Out of scope

- Fixing anything. The findings file is the input for later fix runs.
- Edits to the scraper repo and writes to any database.
- Load or speed testing beyond noting a slow response.
- Visual design and copy, which the polish run covered.
- Civil servants as a persona.
