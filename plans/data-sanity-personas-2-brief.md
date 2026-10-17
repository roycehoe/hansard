# Data sanity personas, second pass: Brief

## Feature description

Four persona agents use the Hansard app a second time, once the data has stopped moving, and flag every place where the returned data looks wrong. The first pass (`plans/data-sanity-personas-brief.md`, findings in `plans/data-sanity-personas-findings.md`) found 14 confirmed problems. Since then the scraper has rewritten much of the data. This pass has three jobs: confirm that each first-pass finding is gone and nothing regressed, test whether the problem classes the scraper's loop listed but did not fix hurt a real user task, and look for anything the rewrites broke. An Opus triage agent confirms each finding, merges duplicates, assigns the owning repo and writes `plans/data-sanity-personas-2-findings.md`. The run changes no code and writes no data.

## What changed since the first pass

The personas reuse the first pass's method unchanged: curl against the API, headless Chromium for pages, read-only SQL, about 10 SPRS comparisons per persona. The environment is the same (API on 8001, Vite on 5174, no print of `DATABASE_URL`). What differs:

1. **`speech.kind` exists and drives behaviour.** In the first pass DS-15 found it NULL on every Speech. Commits `ee80a9b` to `64e4128` expose it on the report and search responses, add it to the search speech-type filter, style report rows by kind and keep a speaker's run across chamber events and notes. All four personas test this properly now, not only as a side check. Rows in the 162 held Reports may still have kind NULL (4,146 rows by ADR 0009 as of 16 Oct); a persona that meets one reports it only if the count has grown.
2. **Write #3 shipped to production** on 16 Oct (plan v4: ordinals renumbered on 599,528 rows, 45 junk attendance rows deleted, headings and subtitles unlinked or rebuilt). Anchors such as `#s194` from the first findings file moved; the first pass's examples are not stable ids.
3. **Write #4** rebuilds 2,923 Reports, releases 42 held Reports and moves 361 rows between kinds. It includes report 22149 and the other 40 of its class.
4. **The fix run's production writes** (groups G4, G5, G6 of `plans/data-sanity-fixes-brief.md`): excluded duplicate Reports (DS-04), sitting and session number backfill (DS-08), title trimming (DS-11), the Assembly flag (DS-12), the Chiam See Tong party and the party normalisation (DS-03, DS-17), constituency names (DS-10), Person name format (DS-13), the move of Assembly-only Memberships to Parliament 0 (DS-16, if approved) and the insert of 150 attendance rows for Sittings 5941, 5988 and 6009 (DS-07). G1's code fixes are already in the app: DS-01 (`22c1255`, `21f67be`), DS-02 (`8c69fd9`) and the party filter merge (`47f59d7`).
5. **Write #5** is the decision-memo stack from `SCRAPER/plans/decision-memos/INDEX.md`: glued footnote digits, small Tier C items, fallback rows for the 702 Reports with markdown and no rows, italic titles credited to a speaker, labels that are not people, procedural leftovers and column-marker `****` cuts, as one parser change set and one write. Attendance (parser stop rule, about 58 deletes, 3 aliases, 29 role rows, DS-06) goes separately in SQL. Which items ship is Royce's call; see the questions. The personas test what actually shipped, which the findings file's header states.
6. **The data loss register** (`SCRAPER/docs/data-loss-register.md`) now covers attendance, persons, memberships, sittings and report titles, so every cleaning step has a recorded cost. Personas read it to tell a deliberate loss from a bug. A discrepancy that a register row fully accounts for is Explained.

## Resolved terminology

Terms from the first brief hold: Report, Sitting, Speech, Person, Membership, Speaker label, Presiding officer, Linked, Text-less report, Derived text, Official record, Persona, Finding, Triage, Owner, Explained, Known gap. New terms:

| Term | Canonical meaning |
|---|---|
| Regression check | A persona re-runs a first-pass finding's repro and reports fixed, still present or changed. |
| Residual class | A problem class the scraper's loop found, counted and chose not to fix. Listed in cycle 4 `REPORT.md` section 4 and in `docs/vision.md`. |
| Hurts a task | A residual class counts as hurting when a persona, doing a task its user would do, reaches a wrong answer or has to distrust a result because of it. Present in the data but never met in a task does not hurt. |
| Start condition | The state of the data that must hold before the run starts. |

## Decisions

1. **Feature name** `data-sanity-personas-2`. Findings go to `plans/data-sanity-personas-2-findings.md`, which gets committed. The first findings file stays as written; the second file refers to DS ids and gives new findings ids DS2-01 onward.
2. **Same four personas**: the historian who also plays the data user, the Section 9A legal researcher, the journalist and the citizen. Each persona gets a budget of about 50 tool calls, up from 40, because of the regression list. Personas run on Sonnet, triage on Opus, for the reason given in the first brief.
3. **Method**: unchanged from the first brief's decisions 3 to 5. No browser window opens, the Playwright MCP tools are not used, the run uses its own instances on 8001 and 5174, and the checks are the app against itself, read-only SQL, what the persona knows, and SPRS. The first pass found that three personas fetched only the Angular shell from SPRS. Every persona now gets the SPRS method section of the first findings file (the JSON endpoint for 2012 to 2025) in its prompt.
4. **Start condition.** The run starts only when all of these hold:
   - write #4, the fix run's production writes (G4, G5, G6) and write #5 have each shipped, or Royce has said which of them will not;
   - the replica equals production by `table_hashes.sql` on every table and sequence, checked by a bounded read the same day;
   - `python -m alembic heads` shows one head and the database sits at it;
   - `python scripts/attribution_text_share.py` has been run and its three numbers are in the findings header: the ADR 0001 rate, the all-rows rate and text share;
   - no scraper agent is committing or writing.

   If any of these fails, the run does not start. Ordinals and Report ids that the personas quote are then stable for the whole run.
5. **Regression checks.** Each persona re-tests the DS findings assigned to it below with the repro in the first findings file, run against production-equal data. Triage re-runs every repro too and records one of: fixed, still present, changed, or not testable. A "still present" on a finding that was supposed to ship is high severity whatever its original grade. Allocation, so each DS finding is covered by two personas where cheap:
   - Historian: DS-03, DS-04, DS-05, DS-08, DS-10, DS-12, DS-13, DS-16, DS-17, DS-19, DS-14 (deferred on 17 Oct: confirm it is unchanged and say whether the missing markers hurt a task).
   - Lawyer: DS-01, DS-04, DS-05, DS-09, DS-11, DS-15, DS-18, DS-20 (the "The Chairman" link split), plus a fresh speech-by-speech SPRS comparison of the 5 Reports from the first pass, to catch a regression from write #4 or #5.
   - Journalist: DS-01, DS-02, DS-03, DS-09, DS-13, DS-17, DS-19.
   - Citizen: DS-01, DS-02, DS-06, DS-07, DS-08, DS-10, DS-15, DS-16.

   The persona that did not hit a finding in pass one still plays its user, and reports only what the task shows. The repro runs as a check of the fix, not as the whole task.
6. **Residual classes.** Each class listed in cycle 4 `REPORT.md` section 4 that write #5 did not fix gets a task check, so the personas can say whether it hurts. The classes, with the counts to hold them to (counted on master `1220161`, write #5 may have moved some):
   - italic titles stored as SPEECH rows (9,782 rows, 1,094 Reports; 2,281 close a member's run): lawyer and journalist, by counting a member's speeches and reading a run that ends in a title;
   - `<pre>` tables stored one row per line (18,591 rows, 863 Reports) and prose cut inside `<pre>` blocks (1,021 rows): historian, by reading a budget or statistics table the way a data user would, and asking whether a number can be recovered;
   - footnote digits glued to a word (1,462 hits, 185 change a number): journalist, by quoting a figure from a Report that has footnotes and comparing with SPRS. If write #5 shipped the marker fix, this becomes a regression check on the marker format and on whether a figure now reads correctly;
   - a column marker that leaves a `****` line so a paragraph stays cut (770 rows in 293 Reports): lawyer, by quoting a passage for Section 9A and checking whether it is complete;
   - labels that are not people (113 rows, 15 Reports; 33559 holds 6,300 characters of Dr Tan Cheng Bock's speech under a heading): historian and lawyer, by searching the member and checking whether his speech is attributed to him;
   - speech swallowed by a footnote run (6 rows, Report 23268) and "Table N:" caption text (2 lines): lawyer, by SPRS comparison of those Reports only;
   - Reports with markdown and no rows (702 Reports; 22 are prose a member said or wrote, 94,547 characters): citizen and journalist, by opening the Reports and judging whether an empty Report with a "text exists" notice misleads;
   - bare time stamps credited as speeches (51 rows), procedural near-misses (29 rows), first readings left credited (6 Reports) and "The voting was as follows:-" credited to the chair (9 rows): citizen, by whether a stray row appears in a Person's speech list or counts;
   - the six held Reports of the 22149 class (22806, 23038, 23268, 23627, 24839, 41804): any persona that meets one reports it as Explained, with the reason in `held/HELD.md`;
   - the honorific gap in `_SPEAKER_HONORIFIC_RE` (Miss, Madam, Che, LG, COL): latent, no stored line hits it, so personas do not test it;
   - items on the decision-memo list that stay unfixed, for instance unmatched attendance if the attendance SQL did not ship (111 names): citizen, by reading attendance on 5 Sittings and counting unlinked names.

   For each class the persona records a verdict in one line: hurts a task, or does not, with the task it tried. Triage turns that into a table in the findings file with the class, the count, the verdict and, where it hurts, a proposed severity and a fix direction. A class that no persona's task reached is marked "not reached", not "harmless".
7. **New checks on the rewritten data.** Because the data moved a lot, every persona also tries these, and a hit is a finding:
   - a Person's speech count on the Person page against the same search filtered to that Person, in two Parliaments, using the explained-gap method of the first brief (scenario 1);
   - the kind filter in search for each kind, against SQL counts of `speech.kind`, and a Report page whose rows alternate kinds, to see that styling, citation buttons and counts agree;
   - a speaker's run across a chamber event or note, in one Report from each era;
   - the Person pages of anyone whose Membership, party, constituency or name changed in the fix run (DS-03, DS-10, DS-13, DS-16), including an old slug that should redirect by id;
   - the sitting and session number on 5 Sittings and 5 Reports from before 1990;
   - Reports whose title changed in DS-11: the title shown, the subtitle and the search hit;
   - the 150 attendance rows inserted for Sittings 5941, 5988 and 6009, against SPRS;
   - the 10 Reports of the DS-04 exclusion list: none appears in search, and the kept Report holds the speeches.
8. **Known gaps** handed to every persona, which they do not report (as in pass one, updated): no Report text after 13 Aug 2012; Parliament 15 missing from the data (the People filter keeps it, `6138120`); no column numbers; no language markers (DS-14, deferred unless this pass finds they hurt a task); a common search term such as "government" can answer `503 search.timed_out`; footnote text for newer-system reports is not stored. The party-string and OCR-typo caveats from pass one are not known gaps any more and are tested.
9. **Spread.** As before: 1955 to 1965 Legislative Assembly, the 1970s and 80s, the 1990s, 2000 to 2012, and text-less Reports after 2012. Royce names no Person, bill or date. Personas pick samples that include at least one Report rebuilt by write #4 and one touched by write #5.
10. **Load on production**, unchanged: one request at a time, a 503, timeout or response over 10 s means a 60 s wait with growth on repeat, three failures in a row mean a 5 minute stop. SQL goes through the read-only wrapper with `default_transaction_read_only=on` and a statement timeout. Bounded reads only. No production writes by anyone. No browser launched from a script on Royce's screen; headless Chromium in the scratchpad is the only browser, as before.
11. **Finding format** as in the first brief (title, severity, owner, status, personas, URL and API call, expected and actual with how expected was established, curl and SQL, suspected cause with `file:line` or table and column, fix direction, records affected with up to five examples), plus one field: **Relation to pass one**, which is one of new, regression of DS-nn, or residual class (name). The findings file also carries the regression table (DS-01 to DS-20 by verdict) and the residual-class table from decision 6.
12. **Flag only.** No code changes in either repo.

## Stop condition

The run is done when all of these hold:
- every DS-01 to DS-20 has a verdict from at least one persona and triage;
- every residual class in decision 6 has a verdict or "not reached";
- triage has confirmed or rejected every finding;
- the findings file is written and the summary table counts match the detail sections.

The run stops early, and says so at the top of the findings file, if triage finds a high-severity regression (a DS finding still present that should have shipped, or write damage such as lost Reports or mass unlinked speeches), because Royce will want to act before the rest is polished. It does not loop: one pass, one findings file. A third pass is Royce's call after reading the file.

## Questions Royce answers before the run

1. **Which of write #5's items ship?** The personas test what shipped, and the residual-class list in decision 6 depends on it. Recommendation: the stack in `SCRAPER/plans/decision-memos/INDEX.md` ranks 1, 2, 3, 4, 5, 6 and 10 as one write, attendance separately, ranks 7, 11 and 13 deferred. Run the pass after the write you choose, not before.
2. **Do the fix run's G4, G5 and G6 writes all ship before the pass?** A pass on partial data re-reports the open findings. Recommendation: yes, all of them, or Royce lists which DS findings are knowingly left open and the brief marks those "expected open".
3. **Is DS-16 approved (Assembly-only Memberships to Parliament 0)?** It decides whether Persons from 1955 to 1965 show under Parliament 1. Recommendation: approve it, since G5 found zero link moves in simulation, and the pass then checks it as a regression.
4. **Is "hurts a task" the right test for the residual classes, and who sets the line?** Recommendation: yes, plus a fixed line: a class hurts when a persona gets a wrong figure, a wrong attribution or a missing passage in a task; style or layout defects are low.
5. **Persona budget and cost.** Four Sonnet personas at about 50 calls plus one Opus triage. Recommendation: accept; it is the same shape as pass one with a longer list. If tokens matter more, drop the journalist's regression allocation to DS-01, DS-03 and DS-13, since the historian and citizen cover the rest.
6. **Production query load.** Pass one ran against the production database through the read-only wrapper. Recommendation: keep that, now that the replica equals production, but allow the personas to use the replica for SQL-heavy counts (it is identical by the start condition) and keep the API and SPRS checks off production's slow paths. If you prefer, say replica only for SQL and API, and keep SPRS as the only outbound traffic.
7. **Stop on high regression, or finish?** Recommendation: stop early as written in the stop condition, so you can fix before the polish.
8. **Do you want a third pass promised now?** Recommendation: no. One pass, then decide from the findings.
9. **DS-14 (language markers).** Deferred: on 17 October Royce ruled that the language column is built only if a persona finds that the missing markers hurt a task. The personas test whether it hurts; they do not file it again as a finding.

**Answers (Royce, 17 October 2026).** Questions 1 to 3 are settled: write #5, G4, G5, G6 and DS-16 all shipped, and so did write #6 (the p06 and p04 fixes and 496 attendance names). Questions 4 to 8 take their recommendations: the fixed line in question 4; the budget in question 5 as written; the remote database for API and app checks, with the replica allowed for SQL-heavy counts; stop early on a high regression; no third pass promised. Question 9 is as above.

## Out of scope

- Fixing anything. The findings file is the input for later fix runs.
- Edits to either repo and writes to any database.
- Load or speed testing beyond noting a slow response.
- Visual design and copy, which the polish run covered.
- Civil servants as a persona.
- A full re-run of the scraper's speech fidelity loop. The personas test user tasks; the loop's own Tier A and B bounds stay in the scraper's docs.
