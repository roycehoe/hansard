# Plan audit: Hansard user stories

**Verdict:** PASS
**0 blockers · 10 warnings**
**Audited:** 2026-10-13T23:22:53+08:00 (re-audit; the first run, at 23:18:30, failed with 3 blockers)

Inputs: `plans/hansard-user-stories.md` (125 lines), `plans/hansard-user-stories-execution.md` (1,505 lines, 27 commit steps), `plans/hansard-user-stories-brief.md` (120 lines) and `plans/hansard-user-stories-explore.md` (53 lines).

On this run I read three ranges of the execution plan in full: lines 1 to 30, 420 to 520 and 1160 to 1505. I checked the changed regions in steps 12 and 13 directly. The rest of the file matched the first run's full read.

## What the revision fixed

- **B-001 is resolved.** Step 7 now lists `api/crud/CLAUDE.md` and says what its "Full-text search constants" section contains. Step 6 says it writes the file without that section.
- **B-002 is resolved for file ownership.** Step 19 lists `app/src/constants/constants.ts` and defines `HTTP_NOT_FOUND` and `DEFAULT_QUERY_RETRY_COUNT` there. Step 21 imports `HTTP_NOT_FOUND` from `@/constants/constants`, and the drafting aside is gone. One naming slip remains (W-001).
- **B-003 is resolved.** Coverage is now step 25 and search is step 26. I checked every `Link` target in steps 21 to 27 against the routes that exist at that commit. Each one either points at a route that already exists or is one of the four recorded deferrals:
  - the sitting crumb, moved from step 21 to step 22;
  - the person link in `CardSpeech` and `ListAttendance`, moved from steps 21 and 22 to step 24;
  - the person link in `ListPersons`, moved from step 23 to step 24;
  - the "Search this person's speeches" action, moved from step 24 to step 26.

  Each step that receives a deferral lists the file it edits: step 22 lists `reports.$reportSlug.tsx`; step 24 lists `ListPersons.tsx`, `CardSpeech.tsx` and `ListAttendance.tsx`; step 26 lists `people.$personSlug.tsx`. Each expected-state block checks for the `to=` targets it adds.
- **Earlier warnings resolved:**
  - W-001: Decided without Royce 10 in the plan now names the 200-character query cap.
  - W-002: the "The Chairman" known gap no longer carries a count.
  - W-003: I tested the completion-checklist grep against the step code, and it now passes.
  - W-007: `parsePersonSlug` uses `/^(\d+)(?:-(.*))?$/`, so `-foo`, `foo` and an empty string are all not found.
  - W-011: the orchestration note now runs steps 17 to 27 in order.

---

## Blockers

None.

---

## Warnings

### W-001. Step 19 still uses two names for the retry count
**Reference:** The `main.tsx` paragraph in step 19 says `shouldRetryQuery` returns "`failureCount < DEFAULT_RETRY_COUNT` otherwise". The same sentence exports `DEFAULT_QUERY_RETRY_COUNT = 3` from `constants/constants.ts`.
**Issue:** If the executor follows the sentence literally, `main.tsx` uses an identifier that is never defined, and `tsc -b` fails. The intent is clear, so this isn't a blocker.
**Recommendation:** Change `DEFAULT_RETRY_COUNT` to `DEFAULT_QUERY_RETRY_COUNT` in the `shouldRetryQuery` description.

### W-002. Step 7's `'english'` grep may now match the crud guide
**Reference:** Step 7's expected state says `grep -rn "'english'" api/crud` "finds only that file". The completion checklist has a similar line.
**Issue:** Step 7 now also writes a section in `api/crud/CLAUDE.md` saying the configuration is a SQL literal. If that section quotes `'english'` or `literal_column("'english'")`, the grep matches two files and the check fails on correct work.
**Recommendation:** Limit the grep with `--include="*.py"`, or tell the section not to quote the literal.

### W-003. Drafting residue in step 12 (carried over)
**Reference:** Step 12's code block still contains `def _get_membership_filters ... no: inline in get_all_persons:`, a `_get_validated_person` signature with no body, and the `if`/`else` that the prose under the block rejects.
**Issue:** The block isn't valid code, and it mixes the rejected design with the chosen one. The prose makes the final choice clear.
**Recommendation:** Replace the block with the final `_get_matching_memberships` helper and the full `_get_validated_person`.

### W-004. Component count mismatch in step 21 (carried over)
**Reference:** Step 21's expected state says "the thirteen components exist".
**Issue:** The Files list holds twelve components plus the route file.
**Recommendation:** Change the count to twelve.

### W-005. The table carve-out is not recorded in the execution plan (carried over)
**Reference:** Steps 24 (`TableMemberships`, `TableParliamentCounts`) and 25 (`TableCoverageYears`).
**Issue:** Decided without Royce 21 exempts these tables from the four-file split in `app/STYLE.md` and says the exemption is "recorded here and in the execution plan". Steps 24 and 25 call them static `Table`s but never state the exemption. feat-execute's final convention review may flag them.
**Recommendation:** Add a sentence to steps 24 and 25 naming the carve-out and its reason: the tables have no sorting, filtering or paging.

### W-006. Hook wiring is implicit in steps 24 and 26 (carried over)
**Reference:** Step 24 never names the `useGetPersonReports` call, or the loading and error states of the report list. Step 26 calls `useGetSearchSpeeches({...page})` without mapping the URL's search params to the request fields.
**Issue:** The search params are `parliament`, `from`, `to`, `type` and `person`. The API fields are `parliament_number`, `date_from`, `date_to`, `report_type` and `person_id`. A missed mapping fails silently: the filter is ignored.
**Recommendation:** Write out the request objects in both steps.

### W-007. Footer link typing may fail the build (carried over)
**Reference:** Step 27 types each footer link as `{ label: string; to: string } | { label: string; href: string }`.
**Issue:** TanStack Router's `Link` checks `to` against the union of route paths. A `to` widened to `string` is likely to be rejected by `tsc -b`. The current file avoids this by keeping literal types with `as const`.
**Recommendation:** Keep `as const`, or type `to` with the router's path type.

### W-008. The route tree needs regenerating before each build check (carried over)
**Reference:** The orchestration note says only the orchestrator edits `routeTree.gen.ts`. Every route step's expected state includes `pnpm build`.
**Issue:** `routeTree.gen.ts` is gitignored, and `pnpm build` runs `tsc -b` before the router plugin regenerates it. A new route file therefore fails the type check until the tree is regenerated (`app/CLAUDE.md`: run `pnpm dev` once). No step says when to regenerate.
**Recommendation:** Add "regenerate the route tree before `pnpm build`" to the orchestration note.

### W-009. `parsePersonSlug` still accepts id 0
**Reference:** `parsePersonSlug` in step 19, and `PagePerson` in step 24.
**Issue:** `\d+` accepts `0`, so `/people/0-foo` yields `personId` 0. That passes the `Number.isNaN` test, while `enabled: !!0` disables the query, so the page shows neither a loading state nor not-found. Person ids start at 1, so only a hand-typed URL can reach this.
**Recommendation:** Use `[1-9]\d*` in the pattern, or treat `personId < 1` as not found.

### W-010. The brief contains a tension that the plan resolves (Phase 9 note, carried over)
**Reference:** Brief decision 6 ("they wait for Royce's migration. They never ship an unindexed query") and decision 16 ("a launch gate, not a build gate").
**Issue:** The two decisions read differently on whether B1 and B2 can be built before the indexes exist. The plan follows decision 16, and step 15 records the launch gate and the unverified status. This isn't a plan defect.
**Recommendation:** None for this run. Royce confirms at the launch gate.

---

## Coverage map

| Requirement | Description | Covered by |
|---|---|---|
| R-001 | Read-only and timeout options on the engine, and `get_session` (plan 1, clarification 12) | Step 1 |
| R-002 | Six models with the listed columns; `report_type` as `str`; `html_file_name` on `Report` (plan 1) | Step 1 |
| R-003 | `ReportType` (23 stored strings) and `SearchSort` (plan 2) | Step 2 |
| R-004 | Exception base, `ERRORS`, and three not-found exceptions that take no arguments (plan 3) | Step 3 |
| R-005 | `utils/` helpers: report slug, official record, person slug, sitting date, LIKE escaping (plan 4) | Step 4 |
| R-006 | `CRUDReport` methods, including title search and headline (plan 5) | Steps 5 and 7 |
| R-007 | `CRUDSpeech` methods, including speech search and headline (plan 5) | Steps 5 and 7 |
| R-008 | `CRUDSitting` methods (plan 5) | Step 5 |
| R-009 | `CRUDAttendance` methods with the date join from clarification 4 (plan 5) | Step 5 |
| R-010 | `CRUDMembership` over `Speaker` (plan 5, clarification 15) | Step 5 |
| R-011 | `CRUDPerson` (plan 5) | Step 5 |
| R-012 | `api/crud/CLAUDE.md` ported with the Kelix facts stripped, plus the full-text constants section (plan 5) | Steps 6 and 7 |
| R-013 | `middleware/membership.py::get_membership_id_to_person` (plan 6) | Step 8 |
| R-014 | Response schemas with no defaults, and `Optional` only where listed (plan 7) | Step 9 |
| R-015 | Services: `_get_validated_*` helpers, `page_size + 1` paging, `is_attendance_available`, per-Parliament counts (plan 8) | Steps 10 to 14 |
| R-016 | Eleven routes registered in `main.py`, with `/health` kept (plan 9) | Steps 10 to 14 |
| R-017 | `docs/required-indexes.md`: seven indexes, each with DDL, endpoints and plain `EXPLAIN`, plus the launch gate, ranking cost and the negation case (plan 10, brief 16) | Step 15 |
| R-018 | `api/CLAUDE.md` "What exists today" (plan 11) | Steps 6 and 16 |
| R-019 | `app/CLAUDE.md` environment table and `app/.env.example` (plan 11) | Step 27 |
| R-020 | `VITE_CONTACT_EMAIL`, with the footer line hidden while it is empty (plan 12, brief 14) | Step 27 |
| R-021 | App constants: report types, search sort, snippet tags, coverage figures, known gaps, official record URL, Parliament options 0 to 15, the 404 and retry constants (plan 12) | Steps 18, 19 and 23 |
| R-022 | `lib/format.ts`, `lib/citation.ts`, `lib/transcript.ts`, and the `lib/utils.ts` additions (plan 12) | Step 19 |
| R-023 | `tag` badge variant (plan 12) | Step 17 |
| R-024 | Query client does not retry on a 404 (plan 12) | Step 19 (W-001) |
| R-025 | Eleven query hooks; `getReport` encodes the slug (plan 13) | Step 20 |
| R-026 | Report page: A1, A2, A5, D1, D2, F2 (plan 14) | Step 21; sitting crumb in step 22; person link in step 24 |
| R-027 | Sitting page: A3 (plan 15) | Step 22; person link in step 24 |
| R-028 | Sittings browse, grouped by session or volume: B3 (plan 16) | Step 22 |
| R-029 | People browse and filters: C3 (plan 17) | Step 23; person link in step 24 |
| R-030 | Person page: C1, C2, entry to B2, redirect to the canonical slug (plan 18) | Step 24; search action in step 26 |
| R-031 | Search page: B1, B2, two result groups, coverage notice (plan 19) | Step 26 |
| R-032 | Coverage page: F1 (plan 20) | Step 25 |
| R-033 | Home page, nav, header search and footer links (plan 21) | Step 27 |
| R-034 | Design page lists the `tag` badge (plan 22) | Step 17 |

Every requirement is covered.

---

## Other checks

**File existence preflight (Phase 1b).** All 27 existing files that the plan references are still present:
- 13 files are modified: `api/database/engine.py`, `api/main.py`, `api/CLAUDE.md`, `app/src/components/ui/badge.tsx`, `app/src/components/design/SectionData.tsx`, `app/src/lib/utils.ts`, `app/src/main.tsx`, `app/src/routes/index.tsx`, `SiteHeader.tsx`, `SiteFooter.tsx`, `app/src/vite-env.d.ts`, `app/.env.example` and `app/CLAUDE.md`.
- 14 files are pattern references only.

The paths added in this revision are each created by an earlier step:
- `api/crud/CLAUDE.md` in step 6;
- `app/src/constants/constants.ts` in step 18;
- `ListPersons.tsx` in step 23;
- `people.$personSlug.tsx` in step 24.

**Step self-consistency (Phase 11b).** Every step's Files list agrees with its prose. This revision changed steps 7, 19, 21, 22, 23, 24, 25 and 26. In each, every file the prose edits is listed, and the prose forbids no listed file.

**Constant drift (Phase 6).** Every value matches the plan:
- page size 20, capped at 100;
- query length capped at 200 characters (now in Decided without Royce 10);
- statement timeout of 30,000 ms;
- the `ts_headline` options;
- the `english` configuration, written as a SQL literal;
- "Legislative Assembly" as the label for Parliament 0, and Parliament options 0 to 15;
- the attribution figures, dated 2026-10-13 and scoped to Parliaments 0 to 11;
- a one-hour cache on coverage data;
- the `d MMMM yyyy` date format;
- the citation titles and the SPRS URL forms.

**State machine (Phase 7).** Skipped: the plan specifies no state machine.

**Resolved tradeoffs (Phase 8).** The execution plan implements every chosen option and none of the rejected ones.

**Decided without Royce.** All 25 entries are implemented:

| Entry | Steps |
|---|---|
| 1 | 22 |
| 2 | 11, 22 |
| 3 | 7, 13, 26 |
| 4 | 13 |
| 5 | 20, 26 |
| 6 | 18, 25 |
| 7 | 19 |
| 8 | 5, 7 |
| 9 | 5, 7 |
| 10 | 12, 13, 26 |
| 11 | 7, 26 |
| 12 | 7 |
| 13 | 12, 19, 23, 26 |
| 14 | 12 |
| 15, 16, 17 | 27 |
| 18 | none needed |
| 19 | 19, 24 (see W-009) |
| 20 | 19, 21 to 26 |
| 21 | 24, 25 (see W-005) |
| 22 | 19 |
| 23 | 15 |
| 24 | 18, 21, 22, 24 |
| 25 | 22 |

**Brief fidelity (Phase 9).** The plan honours every locked decision in the brief. W-010 notes the one tension inside the brief, which the plan resolves.

**Assumptions (Phase 11).** No step contradicts any of the five assumptions.
