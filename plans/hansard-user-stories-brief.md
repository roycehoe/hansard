# Hansard user stories: Brief

## Feature description

The first feature run of `roycehoe/hansard` builds a reader for the Singapore parliamentary record over the scraper database. Its stance is the historical record, organised by Person and by Sitting, with citation-ready references and open data. It does not compete with Pair Search on meaning-based search. The run builds the stories marked MVP below: reading a Report and a Sitting, browsing Sittings, full-text search, Person pages, permanent URLs, citations, a coverage page, and clear labelling of derived text. The API stays read-only (ADR 0001). The search indexes and column numbers the stories need are scraper work, which Royce does separately (decision 6, ADR 0003). Everything from the foundation brief, decisions 1 to 29, still holds.

## Context this brief rests on

Database, read-only queries on 13 Oct 2026:

| | Count | Notes |
|---|---|---|
| Reports | 37,929 | 21,708 have text, from 22 Apr 1955 to 13 Aug 2012. Every report from 10 Sep 2012 has metadata only. Parliament 15 is missing. |
| Speeches | 640,729 | 580,410 linked to a Membership (90.6%). |
| Persons / Memberships | 573 / 1,434 | Party is per Membership. Party strings need cleaning. |
| Sittings | 1,719 | Volume and sitting number present. |
| Attendance | 96,500 | 99.8% linked. `location_name` carries the constituency per Sitting. |
| Column numbers | About 20,800 reports | In raw HTML only (`Column No : 1783`); markdown drops them. |

Other Hansard tools, researched 13 Oct 2026:
- SPRS offers keyword search with title-only results.
- Pair Search (Open Government Products) does keyword and semantic search from 1955. Its users are mostly civil servants.
- Telescope (GovTech) covers Parliamentary Questions only.
- Second Reading (secondreading.app) is a good reader, but only from 2016.
- Abroad: TheyWorkForYou, openparliament.ca, UK Historic Hansard and Mzalendo.

No tool covers 70 years with each speech attributed to a person, and none gives a Section 9A citation.

## Resolved terminology

| Term | Canonical meaning |
|---|---|
| Report | One item of business in a Sitting (an oral answer, a bill reading, a motion). The scraper's `report` row. |
| Sitting | One day's proceedings. The scraper's `sitting` row. Joined to Reports by sitting date. |
| Speech | One utterance within a Report. The scraper's `speech` row. Its position in the Report is its ordinal. |
| Person | One human across the whole record. The scraper's `person` row. |
| Membership | One Person in one Parliament with one party. The scraper's `speaker` row. The API and UI never call this a "speaker". |
| Speaker label | The raw name string printed on a Speech (`speech.speaker`), for example "The Minister for Law (Prof S Jayakumar)". |
| Presiding officer | Mr Speaker, Deputy Speaker or Chairman in the chair. Never shortened to "Speaker" in the UI. |
| Linked | A Speech or Attendance row whose Membership is resolved. Unlinked rows show the Speaker label as plain text. |
| Text-less report | A Report with no `markdown_content`. That covers every Report from 10 Sep 2012 on, plus a few earlier ones. |
| Derived text | Our parsed text, as opposed to the official record. |
| Official record | The published Hansard on SPRS. |

Only the SQLModel classes in `api/database/` keep the scraper's table names (`Speaker`, `Report` and so on).

## Users, in priority order

1. Historians and political scientists. They run long-run queries at Person level.
2. Legal researchers using Section 9A of the Interpretation Act. They need Second Reading speeches, verbatim text, and citations with volume, column, date, and speaker with office.
3. Journalists. They need what was said, by whom, and when, with a link they can share.
4. Data users. They want JSON and CSV.
5. Citizens. Secondary.

Civil servants are not a target, because Pair Search serves them.

## User stories

When: MVP means this run. Next and Later are listed so the plan doesn't block them. Data: Ready means today's data supports it. Scraper means it depends on scraper work (decision 6).

| # | Story | When | Data |
|---|---|---|---|
| A1 | As a historian, I read a Report as Speeches in order. Linked Speaker labels link to the Person, unlinked ones are plain text, and lines with no speaker are set as italic procedural lines. | MVP | Ready |
| A2 | As a lawyer, I see the Report's date, Parliament, volume, sitting number, report type (as a `tag` chip) and the official record link at the top. | MVP | Ready |
| A3 | As a historian, I read a whole Sitting: its Reports in `speech_number` order and its attendance (present and absent, with constituency). | MVP | Ready |
| A4 | As a lawyer, I see column numbers in the margin of a Report. | Next | Scraper |
| A5 | As anyone, a text-less Report shows its metadata and says the text isn't in this archive yet, with the official record link. | MVP | Ready |
| B1 | As a journalist, I search Speech text and Report titles. Filters are Parliament, date range, report type and Person. Results show snippets with matches in `highlight`, sorted by relevance or date. The default range is all years. | MVP | Scraper |
| B2 | As a historian, I search within one Person's Speeches. | MVP | Scraper |
| B3 | As anyone, I browse Parliament, then session, then Sitting date. | MVP | Ready |
| B4 | As a lawyer, I open a bill and see every reading, with the Second Reading marked. | Next | Bill grouping by title is fuzzy |
| B5 | As anyone, I search by meaning. | Later | Pair covers it |
| C1 | As a historian, I open a Person page showing name variants, Memberships (Parliament, party, constituencies) and Speech counts per Parliament, plus the Reports they spoke in, newest first. | MVP | Ready once party strings are cleaned |
| C2 | As a citizen, I see a Person's attendance as raw counts per Parliament, with a note that an absence can have many causes. No score. | MVP | Ready |
| C3 | As anyone, I browse Persons by Parliament and party, or find them by name. | MVP | Ready |
| C4 | As a lawyer, I see the offices a Person held, with dates. | Later | Not in the data |
| D1 | As a researcher, every Sitting, Report, Person and Speech has a permanent URL (decision 8). | MVP | Ready |
| D2 | As a lawyer, I copy a citation for a Report or Speech in Singapore Academy of Law style, with speaker and office taken from the Speaker label. The column is added once A4 lands. | MVP | Ready |
| E1 | As a data user, every page has a JSON twin. | Next | Ready |
| E2 | As a data user, I export search results or a Person's Speeches as CSV. | Next | Ready |
| E3 | As a journalist, I follow a search or a Person as an RSS feed. | Later | Needs new data to keep arriving |
| F1 | As a researcher, a coverage page shows which years have text, the scraper's three attribution numbers, and the known gaps. | MVP | Ready |
| F2 | As anyone, every Report says the text is derived and links to the official record. | MVP | Ready |
| F3 | As a researcher, I report a problem through a pre-filled email or GitHub issue link, with no write path. | Next | Ready |

## Decisions

1. **Positioning.** Historical record, organised by Person and Sitting, citation-ready, open data. No meaning-based search, because Pair Search does it.
2. **Users** are prioritised as in the list above. Lawyers are second because a Section 9A citation is something no other tool offers.
3. **MVP scope** is A1 to A3, A5, B1 to B3, C1 to C3, D1, D2, F1 and F2.
4. **Copyright: ask forgiveness, not permission.** The parliament.gov.sg terms of use forbid reproduction and deep links "without the prior permission of Parliament of Singapore". Royce has decided not to ask for permission before launch, and copyright does not gate launch. If Parliament objects, Royce handles it then.
5. **The 2012 to 2025 backfill blocks public launch, not building.** It's scraper work along the route in the scraper's `docs/report/post-2012-text.md`. A public site missing 14 years invites the comparison with SPRS and Second Reading.
6. **Scraper work is out of scope for this run, and Royce does it separately.** It covers (a) a GIN full-text index over Speech text and Report title, plus a B-tree index on `speech.report_id` (ADR 0003); (b) column numbers extracted from the raw HTML into a column the API can read; (c) party strings normalised (the two apostrophe forms of People's Action Party; "Unknown", "NA" and "Nominated Member of Parliament" treated as non-party labels); and the backfill in decision 5. This run never edits the scraper repo or writes to its database. The app and API are built against the contract in ADR 0003. If the indexes aren't there yet when B1 and B2 are built, they wait for Royce's migration. They never ship an unindexed query. Until party strings are cleaned, C1 and C3 show the stored party string as is.
7. **Search engine.** Postgres full-text search (ADR 0003). B1 matches Report titles across all years and Speech text where text exists, so text-less Reports from 2012 onward can still be found by title.
8. **Permanent URLs.** The Report URL comes from `report_id` with the trailing `#` stripped and URL-unsafe characters encoded, for example `/reports/written-answer-16079`, so it survives a scraper rebuild. Sittings: `/sittings/YYYY-MM-DD`. Persons: `/people/{person_id}-{slug}`. A Speech link is the Report URL plus `#s{ordinal}`. Next to Speech links, the page says they are best-effort, because a re-parse can renumber Speeches.
9. **Terminology** is as in the table above. The API and UI use Person, Membership, Speaker label and Presiding officer.
10. **No accounts.** Searches are shareable through their URLs. Nothing is stored on the server, and there are no alerts, saved searches or annotations.
11. **Derived text.** The official record link sits at the top of every Report, not in the footer. Unlinked Speaker labels are never guessed into links.
12. **Attendance shows raw counts with context, not scores.** This follows TheyWorkForYou's experience with absences such as parental leave.
13. **Par-leh-mate.** Nothing carries over in this run. Royce can name parts to reuse later.
14. **Contact address in the footer.** Under decision 4, the footer gives a contact address so Parliament can reach Royce before anything more formal. The address comes from app config (for example `VITE_CONTACT_EMAIL`) and is left empty until Royce sets it. The footer hides the line while it's empty. Never hard-code a personal address.
15. **Read-only is enforced on the connection.** The API's engine sets `default_transaction_read_only=on` through the connection options, so any write fails at the database whatever role the URL uses. Creating a dedicated read-only role is Royce's job, outside this run.
16. **The index list is a launch gate, not a build gate.** Every API query that would need an index the scraper doesn't have yet (at least `speech.report_id`, `speech.speaker_id`, `attendance.sitting_id`, `attendance.speaker_id`, `report.sitting_date`, and the full-text expressions for B1) is listed in `docs/required-indexes.md`. Each entry gives the exact index definition, including the exact `to_tsvector` expression and text search configuration the API queries use, the endpoints that need it, and an `EXPLAIN` of the query against today's database. Royce's scraper migration implements that file as written. Slow sequential scans are acceptable in local development. The API does not launch until every listed index exists. B1 and B2 are built against the documented expressions. They are verified end to end only once the index exists, and until then are marked unverified.

## Scenarios confirmed

1. **A lawyer cites a 1993 Second Reading speech.** The Report page shows volume, sitting number and date. The Speech's Speaker label is "The Minister for Law (Prof S Jayakumar)". D2 copies *Singapore Parliamentary Debates, Official Report (date) vol N (Prof S Jayakumar, Minister for Law)* without a column, and the copy action says the column is coming. After A4 lands, the column is added.
2. **A journalist searches "COE" for a Person in Parliament 14.** No Speech text exists after August 2012, so text matches are empty. B1 still returns Reports whose titles match, marked text-less, and a notice above the results gives the text coverage boundary and links to F1.
3. **The scraper rebuilds Speeches.** A shared link `/reports/oral-answer-1234#s12` now lands on a different Speech. The Report URL still resolves. The note beside Speech links already says they are best-effort. Report, Sitting and Person URLs never change.
4. **An unnamed chair.** A Speech labelled "The Chairman" with no resolved Membership shows the label as plain text, with no link and no guess (scraper ADR 0002).
5. **A Person across eras.** A member of the 1950s Legislative Assembly who also sat in later Parliaments has one Person page. It lists every Membership with its party and the constituencies from attendance, and Speech counts per Parliament.

## Out of scope

- Meaning-based or AI search, AI summaries and scorecards.
- Accounts, alerts, saved searches, annotations and any write path.
- Office history (C4), bill grouping (B4), JSON twins, CSV, RSS and problem reports (E1 to E3, F3). These are Next or Later.
- The scraper work in decision 6 and the backfill in decision 5. Royce does both separately.
- Public launch, deployment and hosting. Launch is gated on decision 5.
- Vernacular speeches and sitting sections. That data exists only in the post-2015 format, which the database doesn't hold.
