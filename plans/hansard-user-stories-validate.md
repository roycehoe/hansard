# Execution Validate: Hansard user stories

**Verdict:** PASS
**Commit range:** 48e34ba^..be7b517 (the feature range 4cb4690..HEAD, 27 feature commits plus one fix commit, 7a9e787)
**22 covered · 0 partial · 0 missing**
**Validated:** 2026-10-14T00:03:21+08:00

---

## How this was checked

The requirements are the 22 numbered Implementation Steps in `plans/hansard-user-stories.md`: R-001 to R-011 are API steps 1 to 11, and R-012 to R-022 are app steps 12 to 22. The commit log lists steps out of plan order (17 to 20 first, then 1 to 16, then 21 to 27), and steps 5 and 7 share commit 35cbb9a. Both are recorded in the log and in the execution plan's Amendments, so neither counts as a gap. The commits listed by `git log 48e34ba^..HEAD` match the hashes in the log. Each requirement was checked against the diff and the tree by reading the named files and symbols.

The 13 amendments in the execution plan were treated as recorded deviations. Two worth naming because they touch a requirement: the typed 503 `SearchTimedOutException` for a cancelled search (R-003, R-008), and `NaiveDatetime` for `Report.sitting_date` (R-001).

---

## Coverage

| Requirement | Description | Verdict | Notes |
|---|---|---|---|
| R-001 | Engine, read-only session, six table models | Covered | `get_session()` and the `default_transaction_read_only=on` and 30,000 ms `statement_timeout` options in `database/engine.py`; `Report`, `Speech`, `Sitting`, `Attendance`, `Speaker`, `Person` with the listed columns; `report_type` is `str`; no relationships. `NaiveDatetime` is amendment-recorded. |
| R-002 | Enums | Covered | `ReportType` with 23 members and `SearchSort` (`relevance`, `date`) in `api/enums.py`. |
| R-003 | Exceptions | Covered | `ErrorCode`, `ErrorSpec`, `ERRORS`, `AppHttpExceptionBase` in `exceptions/base.py`; no-argument `ReportNotFoundException`, `SittingNotFoundException`, `PersonNotFoundException` (404). The extra `SearchTimedOutException` is amendment-recorded. |
| R-004 | Pure helpers in `utils/` | Covered | `get_report_slug`, `get_report_id_candidates`, `get_official_record_url`, `get_person_slug`, `get_sitting_date_text`, `escape_like_pattern`, each in its named file. |
| R-005 | CRUD classes, one per table | Covered | Every method listed in the plan exists on `CRUDReport`, `CRUDSpeech`, `CRUDSitting`, `CRUDAttendance`, `CRUDMembership` and `CRUDPerson`. `api/crud/CLAUDE.md` is ported with no Kelix mentions (commit 2375de5). The private attendance helper and `session.get` are amendment-recorded. |
| R-006 | Membership to person middleware | Covered | `middleware/membership.py::get_membership_id_to_person(membership_ids, session)`; used by the report, sitting, and search services. |
| R-007 | Response schemas | Covered | `report`, `sitting`, `parliament`, `person`, `search`, `coverage` modules with every named model; no defaults; `Optional` only on `sitting_number`, `session_number`, `person_id` and the coverage dates; `subtitle` maps `None` to `""` in the services. |
| R-008 | Services | Covered | All listed functions exist, each with a `_get_validated_*` helper where a lookup can fail. Person reports and both searches fetch `page_size + 1` and set `has_next_page`. `is_attendance_available` is `len(attendances) > 0`. `get_person` builds per-Parliament counts from the three dict methods. Title search with a Person filter passes `is_text_available=False`, matching Decided without Royce 4. |
| R-009 | Routers and `main.py` | Covered | All 12 routes exist with the stated parameters; page size 20, cap 100, query max 200 via `Query` bounds; every router registered in `main.py`; `/health` kept. |
| R-010 | `docs/required-indexes.md` | Covered | Seven entries with exact DDL (five B-trees, two GIN expression indexes on `english`), the 13 October 2026 `EXPLAIN` runs, launch-gate statement, B1 and B2 unverified note, ranking cost with the stored-column alternative, and the negation-only case. |
| R-011 | API, app docs and env | Covered | `api/CLAUDE.md` layer tables and "what exists" rows updated; `app/CLAUDE.md` env table has `VITE_CONTACT_EMAIL`; `app/.env.example` and `vite-env.d.ts` carry it. |
| R-012 | App config, constants, shared helpers | Covered | Constants files for report type, search sort, coverage figures, known gaps and the official record URL; `lib/format.ts`, `lib/citation.ts`, `lib/transcript.ts`, `lib/utils.ts` (`buildQueryString`, `parsePersonSlug`); the `tag` badge variant (the `--tag` tokens already existed in `index.css`); no retry on a 404 in `main.tsx`; footer contact line renders only when non-empty. |
| R-013 | API hooks | Covered | All 11 hooks exist at the planned paths; `getReport` encodes the slug; the coverage hook uses the one-hour stale time; hooks for the person, sittings list and searches are disabled when their key is absent. |
| R-014 | Report page | Covered | Header with breadcrumb and citation action, metadata list, derived-text notice, text-less and no-speeches notices, `<article id="s{ordinal}" tabIndex={-1}>` with a person link when linked, italic when the label is empty, copy-link and copy-citation buttons, `TextTranscript` with no `dangerouslySetInnerHTML` anywhere, scroll and focus on the hash after render, skeleton, error and not-found states. |
| R-015 | Sitting page | Covered | Header with date, Parliament, volume, sitting and session; reports in order with type badge and "Text not in this archive yet"; Present and Absent lists with person links and the absence note; one notice replaces both lists when attendance is unavailable. |
| R-016 | Sittings browse | Covered | Without `parliament`, the Parliament list; with it, sittings grouped by session only if every sitting has one, else by volume with a visible note (Decided without Royce 1). Search param validated with Zod. |
| R-017 | People | Covered | Parliament (with Legislative Assembly), party and name filters kept in the URL, `FormFilterPersons`, results linking to `/people/{id}-{slug}` with `Parliament N, Party` memberships. The API maps Parliament 0 to the `is_legislative_assembly` flag. |
| R-018 | Person page | Covered | Slug parsed; canonical-slug redirect with `replace: true`; a slug with no integer renders not-found with no API call; name variants, memberships table with constituencies, per-Parliament table with attendance and coverage-end notes, link to `/search?person={id}`, paginated report list newest first with speech counts. |
| R-019 | Search | Covered | Zod params `q`, `parliament`, `from`, `to`, `type`, `person`, `sort`, `page`, `title_page`; `FormSearch`; removable Person chip; coverage notice above results; "Speech matches" and "Title matches" groups with their own Previous and Next; `#s{ordinal}` links; `<mark>` rendered from the literal tags; empty states mention ignored common words. |
| R-020 | Coverage page | Covered | Live counts, text and attendance date ranges, year table, the three dated and scoped attribution figures (97.61%, 90.42%, 96.81%) with plain-words detail, and the known-gaps list. |
| R-021 | Home, header, footer | Covered | Home has a description, a search form and cards to Sittings, People and Coverage; nav gains Search, Sittings, People, Coverage; header search navigates to `/search?q=`; footer Browse links, "How the record is parsed" and "Official Report" point where Decided without Royce 15 says; no literal email in the footer. |
| R-022 | Design page | Covered | `tag` added to the badge variants list in `components/design/SectionData.tsx`. |

---

## Notes that are not gaps

- Speech full-text search is implemented and answers a typed 503 until the scraper adds `ix_speech_transcript_fts`. B1 and B2 stay unverified, as brief decision 16 provides.
- The plan's static checks passed on the tree: no `dangerouslySetInnerHTML` under `app/src`, no literal address in the footer, and the only `'english'` in `api/crud` is the `literal_column` in `crud/text_search.py`.
- Cosmetic only: the stored-column DDL in `docs/required-indexes.md` writes `create index ... using gin` in lower case, unlike the rest of the file. No requirement is affected.
