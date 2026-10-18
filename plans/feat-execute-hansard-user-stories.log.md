# Execution log: hansard-user-stories

Steps are committed by the orchestrator after a Sonnet worker implements them and the subsystem checks pass on the whole tree. Hashes are the commits on master.

## Step 17: feat: add the tag badge variant (48e34ba)

- Amendments: none
- Expected-state: all verified
- User corrections: none

## Step 18: feat: add report, search and coverage constants (2edf8b4)

- Amendments: none
- Expected-state: all verified
- User corrections: none

## Step 19: feat: add date, citation and transcript helpers (c3bb115)

- Amendments: none
- Expected-state: all verified (worked citation examples read against the code)
- User corrections: none

## Step 20: feat: add query hooks for every endpoint (5a8d03f)

- Amendments: report_type typed as the ReportType enum in responses; request interfaces omit page_size
- Expected-state: all verified
- User corrections: none

## Step 1: feat: add the read-only session and the six table models (7998f85)

- Amendments: Report.sitting_date is NaiveDatetime
- Expected-state: all verified; read-only option and timeout exercised against the database
- User corrections: none

## Step 2: feat: add the report type and search sort enums (d5bb169)

- Amendments: none
- Expected-state: all verified
- User corrections: none

## Step 3: feat: add the exception base and the not-found exceptions (a768b2a)

- Amendments: none
- Expected-state: all verified
- User corrections: none

## Step 4: feat: add slug, official record, sitting date and like helpers (baa82a9)

- Amendments: none
- Expected-state: all verified; both official record URL examples checked against the database rows
- User corrections: none

## Steps 5 and 7: feat: add the CRUD classes and full-text search methods (35cbb9a)

- Amendments: aggregate-first person reports query; select_from on the parliament speech counts; scalar-subquery date ordering with an alias; private attendance helper; session.get for persons; one commit for both steps
- Expected-state: all verified; every method run read-only against the database except the speech full-text search, which exceeds the statement timeout without the GIN index
- User corrections: none

## Step 6: docs: port the crud layer conventions (2375de5)

- Amendments: em dashes in the draft replaced
- Expected-state: all verified
- User corrections: none

## Step 8: feat: add the membership to person lookup (d474591)

- Amendments: none
- Expected-state: all verified; run read-only against the database
- User corrections: none

## Step 9: feat: add the response schemas (286e46a)

- Amendments: none
- Expected-state: all verified
- User corrections: none

## Step 10: feat: add the report endpoint (0a54656)

- Amendments: none
- Expected-state: all verified; curl of a pre-2012 and a post-2012 report and a 404
- User corrections: none (a fix commit, 7a9e787, repaired the step 3 exception modules first)

## Step 11: feat: add the sitting and parliament endpoints (79bde09)

- Amendments: none
- Expected-state: all verified; curl of a 1993 sitting with attendance, a 2020 sitting without, a 404, the parliaments list and the Parliament 13 sittings list
- User corrections: none

## Step 12: feat: add the people and parties endpoints (8c2513f)

- Amendments: none
- Expected-state: all verified; curl of the Legislative Assembly filter, David Marshall's page and reports, two 404s and the parties list
- User corrections: none

## Step 13: feat: add the search endpoints (d8bf8ec)

- Amendments: typed 503 for a cancelled search
- Expected-state: all verified for title search; speech search answers 503 until the GIN index exists
- User corrections: none

## Step 14: feat: add the coverage endpoint (b8eacd6)

- Amendments: none
- Expected-state: all verified; curl returned the live counts and dates
- User corrections: none

## Step 15: docs: list the indexes the API needs (see git log)

- Amendments: none
- Expected-state: seven CREATE INDEX statements, EXPLAIN only, measured 394-second unindexed speech search recorded
- User corrections: none

## Step 16: docs: describe the API layers that now exist (see git log)

- Amendments: none
- Expected-state: two "not yet added" rows remain
- User corrections: none

## Step 21: feat: add the report page (4164a7e)

- Amendments: route component shape
- Expected-state: all verified; build, lint and prettier clean
- User corrections: none

## Step 22: feat: add the sitting page and the sittings browse page (a2f4d53)

- Amendments: section headings, both hooks called unconditionally
- Expected-state: all verified; build, lint and prettier clean
- User corrections: none

## Step 23: feat: add the people browse page (2a24b85)

- Amendments: error copy added
- Expected-state: all verified; build, lint and prettier clean
- User corrections: none

## Step 24: feat: add the person page (68725ce)

- Amendments: empty-state copy, section headings, report list owns its states
- Expected-state: all verified; build, lint and prettier clean
- User corrections: none

## Step 25: feat: add the coverage page (33fc4c7)

- Amendments: headings and error copy
- Expected-state: all verified; build, lint and prettier clean
- User corrections: none

## Step 26: feat: add the search page (32e3039)

- Amendments: type field validator, pagination reuse, badge fallback text
- Expected-state: all verified; build, lint and prettier clean
- User corrections: none

## Step 27: feat: wire the home page, nav, header search and footer (be7b517)

- Amendments: home card markup, plain FormData search forms
- Expected-state: all verified; build, lint, prettier and contrast clean; VITE_CONTACT_EMAIL in all four places; no literal address
- User corrections: none

## Fix commit outside the plan: fix: name the not-found exception modules and classes (7a9e787)

Repaired the step 3 modules before step 10 could import them.

## Review follow-ups (after validate)

- fix: apply review findings to the API: the hard-coded is_present filter became a parameter; /search/reports takes is_text_available instead of person_id; no tuples; ReportType through CRUD; _get_ affixes; sort in SQL; pure helpers in utils; chained LIKE escaping; router symmetry
- docs: record the review corrections to the style guide and index list: List, Text, Snippet and Pagination categories; the enabled exception for Parliament 0; GET /sittings moved out of the sitting-date index entry
- fix: apply review findings to the app: enum and constant placement; shared helpers; dedicated error notices; shared pager with aria-label; no retry below 500; keepPreviousData and form values instead of remounts; status regions; landmark names; bold marks; aria-describedby on copy buttons; is_text_available on the title search
