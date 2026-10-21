# Required indexes

The API is read-only (ADR 0001) and cannot create indexes. ADR 0003 gives the scraper ownership of every index the API relies on, as Alembic migrations. This file lists them: eleven indexes and the `rum` extension, each with the exact definition, the endpoints that need it, the SQL the API sends, and the plan Postgres chooses for that SQL on the production database. Two more, `ix_speech_transcript_fts` and, since 21 October 2026, `ix_report_title_fts`, still exist, but no API statement uses them. The ninth, `ix_speech_transcript_tsv_sitting_date_rum`, reads the column `speech.sitting_date`. Scraper migration `c93f77e499cc` added both to production on 18 October 2026; see its section below. The SQL was captured by compiling each SQLModel statement from `api/crud/` with the Postgres dialect and literal parameters. The plans dated 14 October 2026 are plain `EXPLAIN`s taken read-only after the indexes were built, so no query was executed. The speech word search changed on 17 and 18 October 2026, and its date order changes again with the sitting-date index; "Ranking cost" holds its order clauses and timings.

Every index here except `ix_speech_transcript_tsv_sitting_date_rum` exists and is valid on production, and `alembic check` is clean against production. The scraper declares each one on its SQLModel classes. Five migrations built them:

- Scraper commit `1f0d8ef` (`feat: add the indexes the read API relies on`, Alembic revision `e5a9c3b7d216`) created seven on 14 October 2026, from 11:01 to 11:07 SGT (392 seconds in total).
- Commit `e856c26` (revision `f2b8d4a6c913`) added the stored column `speech.transcript_tsv` and `ix_speech_transcript_tsv`. Production took the upgrade on 17 October from 13:44 to 14:00 SGT, together with the attendance constraint (23 minutes; the column rewrites `speech`).
- Commit `aed4137` (revision `50505c58da5d`, after `641870b78b3f`) created the `rum` extension and `ix_speech_transcript_tsv_rum`, then ran `ANALYZE speech`. Production took it on 18 October 2026 from 08:00:34 to 08:04:26 SGT (3 minutes 52 seconds). The index is valid at 222 MB, on `rum` 1.3 (DigitalOcean Postgres 17).
- Commit `7dbfc78` (revision `8281c763bb21`) added the stored column `report.title_tsv` and `ix_report_title_tsv`. Production took it on 21 October 2026 from 02:06 to 02:09 UTC (202 seconds).
- Commit `d0ffc82` (revision `6b3a29f6f809`) rebuilt `ix_speech_speaker_id` and `ix_attendance_speaker_id` under the same names and key columns with `INCLUDE` columns, and added `ix_report_id_parliament_number`, so the reads behind `GET /people/{person_id}` are index-only scans. Production took it on 21 October 2026 from 13:13:26 to 13:13:45 SGT (19 seconds). Postgres does not deduplicate an index with `INCLUDE` columns, so the two rebuilt indexes are three to six times their old size.

| Index | Table | Size on production |
|---|---|---|
| `ix_speech_report_id` | `speech` | 8152 kB |
| `ix_speech_speaker_id` | `speech` | 25 MB (8448 kB before `INCLUDE`) |
| `ix_attendance_sitting_id` | `attendance` | 944 kB |
| `ix_attendance_speaker_id` | `attendance` | 6072 kB (1056 kB before `INCLUDE`) |
| `ix_report_id_parliament_number` | `report` | 1040 kB |
| `ix_report_sitting_date_parliament_number` | `report` | 352 kB |
| `ix_report_title_tsv` | `report` | 1768 kB on the scratch copy |
| `ix_report_title_fts` (not used by the API since 21 October 2026) | `report` | 1768 kB |
| `ix_speech_transcript_fts` (not used by the API) | `speech` | 92 MB |
| `ix_speech_transcript_tsv` | `speech` | 94 MB on the rehearsal copy, not read on production |
| `ix_speech_transcript_tsv_rum` | `speech` | 222 MB |
| `ix_speech_transcript_tsv_sitting_date_rum` | `speech` | 415 MB |

The API no longer waits on any listed index. B1 and B2 are verified: on 14 October 2026 `GET /search/speeches` answered 200 with results against production for "housing estate" and for "housing" filtered to person 149. One limit remains, in the "Ranking cost" section: relevance search takes 0.1 to 6.3 s on production in every shape tested, against the 300 ms target. Oldest-first search on one of the ten most common words passed the 30-second timeout until the sitting-date index reached production on 18 October 2026. Since then every date-order shape measured there takes under 1 s.

Facts that apply to every plan below:

- Besides these indexes, the tables keep their primary keys, `report.report_id` (unique) and `speaker.person_id`.
- `speech` holds about 1.07 million rows and `report` 41,809 on 14 October 2026.
- The database default text search configuration is `simple`. The API names `english` explicitly as a SQL literal (`literal_column("'english'")` in `api/crud/text_search.py`). Neither search builds the vector. Report title search reads the stored column `report.title_tsv` and speech search reads `speech.transcript_tsv`, which hold `to_tsvector('english'::regconfig, title)` and `to_tsvector('english'::regconfig, transcript)`, so only the query side, `websearch_to_tsquery('english', ...)`, names `english`.
- The API sets a 30-second statement timeout. Before the GIN index existed, the speech full-text query exceeded it on the shared database, so `GET /search/speeches` answered `503 search.timed_out`. Run once through psql with no timeout on 13 October 2026, the relevance-sorted speech query for "housing estate" in Parliament 8 took 394 seconds.
- Production analysed `speech` on 18 October 2026, as the last step of the rum migration. Until then `transcript_tsv` had no statistics: production held no `pg_stats` row for it, and the last autoanalyse ran on 16 October, before the column existed. The plans dated 14 October were taken earlier still, and their full-text row estimates are far too low (27 estimated against 4,822 matches for "housing estate").

## ix_speech_report_id

```sql
CREATE INDEX ix_speech_report_id ON speech (report_id);
```

Needed by `GET /reports/{report_slug}`. `GET /search/speeches` also joins `speech` to `report` on this column when a filter reads `report`: a Parliament or a report type, and for a member's speeches without search words a date range too. `GET /coverage`, `GET /parliaments`, `GET /sittings/{sitting_date}` and `GET /search/reports` decide whether a Report has text with an `EXISTS` on `speech.report_id`, one index probe per Report. Of the statements `GET /coverage` sends, only its text count per year probes every Report; its first and last sitting date with text stop at the first Report with text (see `ix_report_sitting_date_parliament_number`).

Before the index existed, `speech_by_report_id` scanned all of `speech` for one report's speeches. It now reads the report's rows through the index.

```sql
-- speech_by_report_id (GET /reports/{report_slug})
SELECT speech.id, speech.ordinal, speech.speaker, speech.transcript, speech.report_id, speech.speaker_id  FROM speech  WHERE speech.report_id = 27549 ORDER BY speech.ordinal;
```

```text
-- speech_by_report_id (GET /reports/{report_slug})
Sort  (cost=72.03..72.25 rows=87 width=405)
  Sort Key: ordinal
  ->  Index Scan using ix_speech_report_id on speech  (cost=0.43..69.23 rows=87 width=405)
        Index Cond: (report_id = 27549)
```

## ix_speech_speaker_id

```sql
CREATE INDEX ix_speech_speaker_id ON speech (speaker_id) INCLUDE (report_id);
```

Needed by `GET /people/{person_id}`, `GET /people/{person_id}/reports` and `GET /search/speeches` when `person_id` is given, with or without search words.

Both endpoints start with `speech_counts_by_report`, which filters `speech.speaker_id`. Before the index existed it scanned the whole table.

```sql
-- speech_counts_by_report (GET /people/{person_id} and GET /people/{person_id}/reports)
SELECT speech.report_id, count(*) AS count_1  FROM speech  WHERE speech.speaker_id IN (1349) GROUP BY speech.report_id;
```

On 20 October 2026 `speech_counts_by_parliament` changed to count speeches per report before joining `report`, so the join reads each report once instead of once per speech. Before, it joined every speech to `report`: 4,412 primary-key lookups and two parallel workers for person 383, 112 ms on production. For a member with many speeches the planner overestimated the reports (4,463 expected for 1349) and hashed a sequential scan of `report`, as the old statement did for person 29 (see "Ranking cost"). Every person's counts were identical before and after the change. On 21 October 2026 the join went. Both endpoints now count the member's speeches per report in this statement, and the service sums them per Parliament (`GET /people/{person_id}`) or pages through them (`GET /people/{person_id}/reports`) with the next statements, which read `report` only. Every person's `GET /people/{person_id}` and every page of `GET /people/{person_id}/reports` were identical before and after the change.

Until scraper revision `6b3a29f6f809` the index held `speaker_id` only, so this statement read each of the member's speech rows from the heap for its `report_id`, scattered across a table larger than production's memory. With `INCLUDE (report_id)` it is an index-only scan with no heap fetches. `EXPLAIN (ANALYZE, BUFFERS)` on production, second run, 21 October 2026, shared buffers and time before and after: person 29 6,647 to 112 buffers (75 to 9.0 ms), person 137 3,304 to 53 (9.1 to 4.4 ms), person 170 8,115 to 108 (178 to 12 ms), person 383 2,671 to 31 (16 to 3.6 ms). The builds had just loaded the new indexes into memory, so these are warm timings. On the scratch copy with every shared buffer of the database evicted first, person 170's statement went from 1,125 to 7.9 ms, and its `GET /people/{person_id}` statements from 1,236 to 477 ms in total, before the attendance indexes were rebuilt. The day before, heavy members' pages took 2.2 to 5.3 s on the live site. Plain `EXPLAIN` on the scratch copy:

```text
-- speech_counts_by_report, scratch copy
HashAggregate  (cost=223.17..273.14 rows=4997 width=12)
  Group Key: report_id
  ->  Index Only Scan using ix_speech_speaker_id on speech  (cost=0.43..190.56 rows=6522 width=4)
        Index Cond: (speaker_id = 1349)
```

```sql
-- person_reports (GET /people/{person_id}/reports)
SELECT report.id  FROM report  WHERE report.id = ANY (ARRAY[...]) ORDER BY report.sitting_date + make_interval(secs=>0.0) DESC, report.speech_number DESC, report.id   LIMIT 21 OFFSET 0;
```

The array holds the report ids that `speech_counts_by_report` returned; `...` stands for the 583 ids of member 1349. This statement reads no `speech` row. The sort key has zero added so the planner cannot walk `ix_report_sitting_date_parliament_number` backward and test each report against the id list, which it chose for member 1349 and person 29 when the key was the plain column: 14,453 buffers for person 29's first page against 639 with the zero added. The sort reads `sitting_date` and `speech_number` from the heap, so the planner now finds the rows through the smaller `ix_report_id_parliament_number` instead of `report_pkey`. Plain `EXPLAIN` on the scratch copy, not yet captured on production:

```text
-- person_reports (GET /people/{person_id}/reports), scratch copy
Limit  (cost=1905.76..1905.82 rows=21 width=16)
  ->  Sort  (cost=1905.76..1907.22 rows=583 width=16)
        Sort Key: ((sitting_date + '00:00:00'::interval)) DESC, speech_number DESC, id
        ->  Bitmap Heap Scan on report  (cost=153.30..1890.05 rows=583 width=16)
              Recheck Cond: (id = ANY ('{...}'::integer[]))
              ->  Bitmap Index Scan on ix_report_id_parliament_number  (cost=0.00..151.70 rows=583 width=0)
                    Index Cond: (id = ANY ('{...}'::integer[]))
```

```sql
-- report_parliament_numbers (GET /people/{person_id})
SELECT report.id, report.parliament_number  FROM report  WHERE report.id = ANY (ARRAY[...]);
```

The array holds the report ids from `speech_counts_by_report`; `...` stands for the 583 ids of member 1349. Since scraper revision `6b3a29f6f809` the planner answers it from `ix_report_id_parliament_number` alone, an index-only scan with no heap fetches; before, it read `report` by primary key. `EXPLAIN (ANALYZE, BUFFERS)` on production, second run, 21 October 2026, before and after: person 29 687 to 89 buffers (115 to 1.1 ms), person 137 1,058 to 71 (54 to 1.5 ms), person 170 1,714 to 181 (879 to 2.8 ms), person 383 983 to 125 (456 to 3.3 ms). Before, this statement read 229 to 790 buffers from disk even on a second run. Plain `EXPLAIN` on the scratch copy:

```text
-- report_parliament_numbers (GET /people/{person_id}), scratch copy
Index Only Scan using ix_report_id_parliament_number on report  (cost=0.29..157.53 rows=583 width=8)
  Index Cond: (id = ANY ('{...}'::integer[]))
```

`GET /search/speeches` with a `person_id` and no search words also uses this index. The statement filters `speech.speaker_id`, keeps the Parliament, date and report type filters through the join to `report` (with none of them set it has no join, see below), and orders by `speech.sitting_date`, newest first or oldest first, then `speech.id`. The sort key is the speech's own date, which equals its report's date on every row. Until 21 October 2026 it was a scalar subquery on `report`, because with the joined column `report.sitting_date` the planner walks `ix_report_sitting_date_parliament_number` backward and filters speeches one at a time: 9.2 seconds for person 29 against 127 ms for the subquery form on 14 October 2026. That reason does not apply to `speech.sitting_date`: no index orders speeches by it without search words, so the planner reads the member's speeches through `ix_speech_speaker_id` and keeps the top 21 in a sort. The subquery ran once for each of the member's speeches (12,457 times and 37,371 buffers for person 29), the join still hashed a sequential scan of `report`, and the plan's cost for the heavy members crossed `jit_above_cost`, so JIT fired. `EXPLAIN (ANALYZE, BUFFERS)` on the scratch copy, third run, not yet captured on production, for person 29 (12 Memberships, 12,457 speeches), page 1:

```sql
-- speech_search_filters_person (GET /search/speeches?person_id=29)
SELECT speech.id, speech.ordinal, speech.speaker, speech.transcript, speech.kind, speech.sitting_date, speech.report_id, speech.speaker_id FROM speech WHERE speech.report_id IS NOT NULL AND speech.speaker_id IN (30, 91, 158, 229, 308, 382, 462, 552, 644, 743, 846, 956) ORDER BY speech.sitting_date DESC, speech.id LIMIT 21 OFFSET 0;
```

```text
-- speech_search_filters_person (GET /search/speeches?person_id=29), scratch copy, not yet captured on production
Limit  (cost=41874.18..41874.23 rows=21 width=408) (actual time=5.221..5.224 rows=21 loops=1)
  Buffers: shared hit=3913
  ->  Sort  (cost=41874.18..41912.06 rows=15155 width=408) (actual time=5.221..5.222 rows=21 loops=1)
        Sort Key: sitting_date DESC, id
        Sort Method: top-N heapsort  Memory: 42kB
        Buffers: shared hit=3913
        ->  Bitmap Heap Scan on speech  (cost=218.62..41465.57 rows=15155 width=408) (actual time=0.873..3.459 rows=12457 loops=1)
              Recheck Cond: (speaker_id = ANY ('{30,91,158,229,308,382,462,552,644,743,846,956}'::integer[]))
              Filter: (report_id IS NOT NULL)
              Heap Blocks: exact=3867
              Buffers: shared hit=3913
              ->  Bitmap Index Scan on ix_speech_speaker_id  (cost=0.00..214.80 rows=15155 width=0) (actual time=0.523..0.523 rows=12457 loops=1)
                    Index Cond: (speaker_id = ANY ('{30,91,158,229,308,382,462,552,644,743,846,956}'::integer[]))
                    Buffers: shared hit=46
Planning Time: 0.054 ms
Execution Time: 5.258 ms
```

Before and after on the scratch copy, interleaved, 10 rounds, medians: person 170 55 to 38 ms and 59,003 to 4,617 buffers, with JIT gone; person 170 oldest first 47 to 23 ms; person 170 page 50 (`OFFSET 980`) 56 to 37 ms; person 29 53 to 42 ms and 48,552 to 3,949 buffers; person 349 43 to 24 ms and 66,579 to 3,372 buffers; person 547 (14 speeches) 1.4 to 1.1 ms. The pages were identical for all 573 people with memberships, 14,161 inputs over both sorts, no filter, Parliament 14, 2020, written answers and one report.

On 21 October 2026 the join to `report` went from this statement, its count and its per-report count whenever no Parliament, date or report type filter is set. The join only checked that the speech has a report, and `speech.report_id` is a foreign key to `report`, so `speech.report_id IS NOT NULL` keeps the same rows (the scratch copy has no null `report_id`). With the join, the planner chose between two plans: for 304 of the 532 people with speeches a parallel plan (Gather Merge, then one `report_pkey` probe per row on the page), and otherwise a hash join over a sequential scan of all of `report` (6,208 buffers). Without it, no person's page or count plans a parallel worker, and the plan above reads only the member's speeches. Interleaved on the scratch copy, 10 rounds, warm medians, page 1: person 152 (346 speeches) 4.9 to 1.7 ms, person 348 10.8 to 1.8, person 221 10.1 to 4.4, person 29 9.6 to 5.8, person 170 10.9 to 7.1, person 170 page 50 11.3 to 8.2; the capped counts 1.8 to 4.9 ms before, 0.9 to 2.0 after, and person 29's count 909 to 422 buffers. With every shared buffer of the database evicted first (3 rounds), the pages were within noise of each other, but without the join a plan can no longer fall back to the hash join, which took person 221 to 204 ms when workers were off. A 3-round sweep of page 1 for all 532 people took 1,910 ms in total before and 971 after (median person 3.6 to 1.3 ms), and no person got slower by more than 1 ms. 7,798 inputs were identical before and after: every person with Memberships over both sorts and pages 1, 2 and 50, with and without excluded reports, their counts and one report each, and the word search pages and counts listed under "Ranking cost". The earlier statement measured on production on 14 October 2026, warm, third run: page 1 for person 29 124 ms, page 50 144 ms, person 568 (39 speeches) 1.3 ms, person 29 with Parliament 5 19 ms.

Also on 21 October 2026 the search engine's connection options gained `-c max_parallel_workers_per_gather=0`, so no search statement plans parallel workers. Production's database has one shared vCPU, where two workers and their leader take turns on the one core, and it did launch workers: the old `speech_counts_by_parliament` ran two for person 383 (above). After the join went, the only search statements that still planned workers on the scratch copy were a member's speeches with a Parliament or a date range, which keep the join. Even with eight cores the workers lost: the page statement for person 29 in Parliament 12 took 12.1 ms with them and 6.3 ms without, person 170 in 2020 13.5 and 8.8 ms (10 interleaved rounds, warm medians). Under `EXPLAIN ANALYZE` each of the three processes spent about 5.6 ms in its share of the sort, so on one core the parallel plan would need about 17 ms of CPU before the join, against 5.2 ms for the whole serial plan. Through the API, interleaved, two passes of 8 rounds, warm medians: those two searches 18.6 to 13.0 ms and 26.5 to 16.0 ms. The other 52 search cases, speech search with and without words and with each filter, report title search and the counts inside them, plan no workers and stayed within noise; the largest move was plain "government" at 103 and 93 ms. The main engine keeps the default: its only statements that plan workers are the two whole-table counts of `GET /coverage`, which run at startup and then once an hour, and there the workers win on the scratch copy (40 against 88 ms for one count under `EXPLAIN ANALYZE`, 129 against 143 ms for the endpoint). On one core they would cost about the same as the serial plan (three processes of 31 ms against 76 to 88 ms), which is not worth a setting.

## ix_attendance_sitting_id

```sql
CREATE INDEX ix_attendance_sitting_id ON attendance (sitting_id);
```

Needed by `GET /sittings/{sitting_date}`.

```sql
-- attendance_by_sitting_id (GET /sittings/{sitting_date})
SELECT attendance.id, attendance.speaker_name, attendance.location_name, attendance.is_present, attendance.sitting_id, attendance.speaker_id  FROM attendance  WHERE attendance.sitting_id = 5852 ORDER BY attendance.is_present DESC, attendance.speaker_name;
```

```text
-- attendance_by_sitting_id (GET /sittings/{sitting_date})
Sort  (cost=79.97..80.16 rows=76 width=40)
  Sort Key: is_present DESC, speaker_name
  ->  Index Scan using ix_attendance_sitting_id on attendance  (cost=0.29..77.59 rows=76 width=40)
        Index Cond: (sitting_id = 5852)
```

## ix_attendance_speaker_id

```sql
CREATE INDEX ix_attendance_speaker_id ON attendance (speaker_id) INCLUDE (is_present, sitting_id, location_name);
```

Needed by `GET /people/{person_id}`, for `attendance_counts_by_parliament` (twice, present and absent) and for the Membership's location names (`SELECT DISTINCT speaker_id, location_name FROM attendance WHERE speaker_id IN (...) AND location_name IS NOT NULL`). Since scraper revision `6b3a29f6f809` the `INCLUDE` columns let all three read the index alone. `EXPLAIN (ANALYZE, BUFFERS)` on production, second run, 21 October 2026, shared buffers and time before and after:

| Person | Location names | Present count | Absent count |
|---|---|---|---|
| 29 | 1,341 to 49 (44 to 1.9 ms) | 3,280 to 1,988 (45 to 16 ms) | 3,754 to 2,462 (13 to 17 ms) |
| 137 | 678 to 22 (16 to 1.0 ms) | 2,097 to 1,441 (10 to 9.8 ms) | 824 to 168 (2.6 to 1.0 ms) |
| 170 | 988 to 32 (68 to 1.6 ms) | 2,493 to 1,537 (96 to 18 ms) | 2,679 to 1,723 (28 to 6.7 ms) |
| 383 | 289 to 12 (3.1 to 0.7 ms) | 1,070 to 793 (25 to 12 ms) | 305 to 28 (0.8 to 0.5 ms) |

What the counts still read is one probe of `ix_report_sitting_date_parliament_number` per attended sitting, plus `sitting` (the absent count also probes `sitting_pkey`). Cutting that further means changing the statement, not adding an index.

```sql
-- attendance_counts_by_parliament (GET /people/{person_id})
SELECT anon_1.parliament_number, count(*) AS count_1  FROM attendance JOIN sitting ON sitting.id = attendance.sitting_id JOIN LATERAL (SELECT DISTINCT report.parliament_number AS parliament_number  FROM report  WHERE report.sitting_date = to_date(sitting.sitting_date, 'DD-MM-YYYY')) AS anon_1 ON true  WHERE attendance.speaker_id IN (1349) AND attendance.is_present IS true GROUP BY anon_1.parliament_number;
```

On 20 October 2026 this statement changed to find each attended sitting's Parliament with a range on `report.sitting_date`, one probe of `ix_report_sitting_date_parliament_number` per sitting. Before, it built `DISTINCT sitting_date, parliament_number` over every report and joined through `CAST(sitting_date AS DATE)`, which no index serves. That read all 46,649 index entries for each of the endpoint's two attendance statements, 43 to 301 ms each on production for person 383. A member present at every one of the 1,719 sittings would probe about as many entries as the old statement read.

On 21 October 2026 the range became an equality, `report.sitting_date = to_date(sitting.sitting_date, 'DD-MM-YYYY')`. Every report's `sitting_date` is midnight (41,838 of 41,838 on the scratch copy, and `GET /sittings/{sitting_date}` already assumes it), so the same reports match: the counts are identical for all 573 people, present and absent. For the present count of 177 of those people the range estimated a cost of 107,973 to 396,184, above the default `jit_above_cost` of 100,000, so Postgres compiled the statement: 9.6 ms of a 21.5 ms run for person 29, 18.0 of 53.5 for person 170. The equality estimates at most 55,246, 4 to 7 times lower, so nothing compiles. The probe per attended sitting and its buffers are the same. The plan below is a plain `EXPLAIN` on the scratch copy, after scraper revision `6b3a29f6f809`.

```text
-- attendance_counts_by_parliament (GET /people/{person_id}), scratch copy
HashAggregate  (cost=915.34..915.46 rows=12 width=12)
  Group Key: report.parliament_number
  ->  Nested Loop  (cost=17.15..906.10 rows=1848 width=4)
        ->  Hash Join  (cost=16.86..149.58 rows=154 width=9)
              Hash Cond: (sitting.id = attendance.sitting_id)
              ->  Seq Scan on sitting  (cost=0.00..128.19 rows=1719 width=13)
              ->  Hash  (cost=14.94..14.94 rows=154 width=4)
                    ->  Index Only Scan using ix_attendance_speaker_id on attendance  (cost=0.42..14.94 rows=154 width=4)
                          Index Cond: (speaker_id = 1349)
                          Filter: (is_present IS TRUE)
        ->  Unique  (cost=0.29..4.79 rows=12 width=4)
              ->  Index Only Scan using ix_report_sitting_date_parliament_number on report  (cost=0.29..4.73 rows=25 width=4)
                    Index Cond: (sitting_date = to_date((sitting.sitting_date)::text, 'DD-MM-YYYY'::text))
```

## ix_report_id_parliament_number

```sql
CREATE INDEX ix_report_id_parliament_number ON report (id) INCLUDE (parliament_number);
```

Needed by `GET /people/{person_id}`, for `report_parliament_numbers` (see `ix_speech_speaker_id`, which holds its statement, plan and production numbers). It sits beside `report_pkey` on the same key, because rebuilding the primary key with `INCLUDE` would mean dropping and revalidating the foreign keys that point at it. `person_reports` (`GET /people/{person_id}/reports`) also finds its rows through it, though it reads the heap for the sort.

## ix_report_sitting_date_parliament_number

```sql
CREATE INDEX ix_report_sitting_date_parliament_number ON report (sitting_date, parliament_number);
```

Needed by `GET /sittings/{sitting_date}`, `GET /sittings`, `GET /parliaments`, `GET /coverage`, `GET /people/{person_id}` (the attendance counts by Parliament) and the date filters and newest-first order of `GET /search/reports` and of `GET /search/speeches`, both without search words. With search words, a date-ordered title search adds zero to its sort key so that the planner cannot walk this index for the order (see `ix_report_title_tsv`), and a date-ordered speech search and the speech match count read it only for a Parliament's first and last sitting dates; the dates themselves filter `speech.sitting_date` (see `ix_speech_transcript_tsv_sitting_date_rum`).

The first version of this list named a single-column index on `report (sitting_date)`. The scraper builds this composite instead. On the rehearsal copy it served every statement the single column served. It also turned the per-Parliament statements (the Parliament list, the sittings list, the `DISTINCT sitting_date, parliament_number` subquery under the attendance counts) into index-only scans of 44 pages instead of 6,309 heap pages. On production a heap scan of `report` costs 0.4 to 1.4 seconds per statement, so that is the larger gain. A `(parliament_number, sitting_date)` index served fewer statements and was no better on any of them. The composite is 352 kB.

The date-ordered title search is repeated under `ix_report_title_tsv`, because the text predicate decides its plan and the sort key is kept off this index. The speech word search under a date range is in "Ranking cost". The `title_search_date` plans here and under `ix_report_title_tsv` are plain `EXPLAIN`s on the scratch copy, not yet captured on production.

```sql
-- report_by_sitting_date (GET /sittings/{sitting_date})
SELECT report.id, report.volume_number, report.parliament_number, report.sitting_number, report.sitting_date, report.speech_number, report.title, report.subtitle, report.report_id, report.report_type, report.html_file_name, report.report_version  FROM report  WHERE report.sitting_date = '1993-10-12 00:00:00' ORDER BY report.speech_number;
```

```text
-- report_by_sitting_date (GET /sittings/{sitting_date})
Sort  (cost=19.37..19.41 rows=19 width=190)
  Sort Key: speech_number
  ->  Index Scan using ix_report_sitting_date_parliament_number on report  (cost=0.29..18.96 rows=19 width=190)
        Index Cond: (sitting_date = '1993-10-12 00:00:00'::timestamp without time zone)
```

```sql
-- title_search_date (GET /search/reports)
SELECT anon_1.id, anon_1.volume_number, anon_1.parliament_number, anon_1.sitting_number, anon_1.sitting_date, anon_1.speech_number, anon_1.title, anon_1.subtitle, anon_1.report_id, anon_1.report_type, anon_1.html_file_name, anon_1.report_version  FROM (SELECT report.id AS id, report.volume_number AS volume_number, report.parliament_number AS parliament_number, report.sitting_number AS sitting_number, report.sitting_date AS sitting_date, report.speech_number AS speech_number, report.title AS title, report.title_tsv AS title_tsv, report.subtitle AS subtitle, report.report_id AS report_id, report.report_type AS report_type, report.html_file_name AS html_file_name, report.report_version AS report_version  FROM report  WHERE (report.title_tsv @@ websearch_to_tsquery('english', 'housing estate')) AND report.parliament_number = 14 ORDER BY report.sitting_date + make_interval(secs=>0.0) DESC  FETCH FIRST (21) ROWS WITH TIES) AS anon_1 ORDER BY anon_1.sitting_date DESC, ts_rank(anon_1.title_tsv, websearch_to_tsquery('english', 'housing estate')) DESC, anon_1.id  LIMIT 21 OFFSET 0;
```

```text
-- title_search_date (GET /search/reports)
Limit  (cost=68.28..68.29 rows=3 width=194)
  ->  Sort  (cost=68.28..68.29 rows=3 width=194)
        Sort Key: anon_1.sitting_date DESC, (ts_rank(anon_1.title_tsv, '''hous'' & ''estat'''::tsquery)) DESC, anon_1.id
        ->  Subquery Scan on anon_1  (cost=68.21..68.25 rows=3 width=194)
              ->  Limit  (cost=68.21..68.22 rows=3 width=286)
                    ->  Sort  (cost=68.21..68.22 rows=3 width=286)
                          Sort Key: ((report.sitting_date + '00:00:00'::interval)) DESC
                          ->  Bitmap Heap Scan on report  (cost=21.58..68.19 rows=3 width=286)
                                Recheck Cond: (title_tsv @@ '''hous'' & ''estat'''::tsquery)
                                Filter: (parliament_number = 14)
                                ->  Bitmap Index Scan on ix_report_title_tsv  (cost=0.00..21.58 rows=12 width=0)
                                      Index Cond: (title_tsv @@ '''hous'' & ''estat'''::tsquery)
```

`GET /search/speeches` without search words and without a `person_id`, and `GET /search/reports` without search words, order by `report.sitting_date` descending and filter by the Parliament, dates and report type. The planner walks this index backward and stops after the first few reports, so a page costs about 1 ms. These statements use the joined `report.sitting_date` as the sort key. A scalar subquery as the sort key, which the person shape used until 21 October 2026, took 480 ms for Parliament 9 on 14 October 2026. `EXPLAIN (ANALYZE, BUFFERS)` on production, warm, third run:

```sql
-- speech_filters_parliament (GET /search/speeches?parliament_number=9)
SELECT speech.id, speech.ordinal, speech.speaker, speech.transcript, speech.report_id, speech.speaker_id  FROM speech JOIN report ON report.id = speech.report_id  WHERE report.parliament_number = 9 ORDER BY report.sitting_date DESC, speech.id  LIMIT 21 OFFSET 0;
```

```text
-- speech_filters_parliament (GET /search/speeches?parliament_number=9)
Limit  (cost=61.05..89.95 rows=21 width=412) (actual time=0.772..0.777 rows=21 loops=1)
  ->  Incremental Sort  (cost=61.05..75096.54 rows=54529 width=412) (actual time=0.768..0.771 rows=21 loops=1)
        Sort Key: report.sitting_date DESC, speech.id
        Presorted Key: report.sitting_date
        ->  Nested Loop  (cost=0.72..72920.08 rows=54529 width=412) (actual time=0.259..0.567 rows=222 loops=1)
              ->  Index Scan Backward using ix_report_sitting_date_parliament_number on report  (cost=0.29..2042.99 rows=2135 width=12) (actual time=0.229..0.236 rows=7 loops=1)
                    Index Cond: (parliament_number = 9)
              ->  Index Scan using ix_speech_report_id on speech  (cost=0.43..32.28 rows=92 width=404) (actual time=0.008..0.032 rows=32 loops=7)
                    Index Cond: (report_id = report.id)
Execution Time: 0.844 ms
```

```sql
-- report_filters_parliament (GET /search/reports?parliament_number=13)
SELECT report.id, report.volume_number, report.parliament_number, report.sitting_number, report.sitting_date, report.speech_number, report.title, report.subtitle, report.report_id, report.report_type, report.html_file_name, report.report_version  FROM report  WHERE report.parliament_number = 13 ORDER BY report.sitting_date DESC, report.id  LIMIT 21 OFFSET 0;
```

```text
-- report_filters_parliament (GET /search/reports?parliament_number=13)
Limit  (cost=2.70..18.05 rows=21 width=190) (actual time=0.263..0.268 rows=21 loops=1)
  ->  Incremental Sort  (cost=2.70..4093.86 rows=5598 width=190) (actual time=0.260..0.263 rows=21 loops=1)
        Sort Key: sitting_date DESC, id
        Presorted Key: sitting_date
        ->  Index Scan Backward using ix_report_sitting_date_parliament_number on report  (cost=0.29..3941.57 rows=5598 width=190) (actual time=0.086..0.202 rows=46 loops=1)
              Index Cond: (parliament_number = 13)
Execution Time: 0.311 ms
```

The speech statement measured the same way: report type `oral-answer` only 0.9 ms, a date range only (1 January to 31 March 2020) 1.0 ms.

On 21 October 2026 `GET /coverage` began to read its first and last sitting date with text from this index in order, stopping at the first Report with text, instead of `min()` and `max()` over the `EXISTS` filter. The planner takes its min/max index shortcut only on a query without a join, and the `EXISTS` is a semi join, so the old statements scanned `report` in parallel and probed `ix_speech_report_id` once per Report: 139,273 and 139,270 buffers, 22 ms warm. Each now reads 7 buffers. The plans below are `EXPLAIN (ANALYZE, BUFFERS)` on the scratch copy, warm, not yet captured on production.

```sql
-- coverage_first_date_with_text (GET /coverage)
SELECT report.sitting_date  FROM report  WHERE EXISTS (SELECT *  FROM speech  WHERE speech.report_id = report.id) ORDER BY report.sitting_date   LIMIT 1;
```

```text
-- coverage_first_date_with_text (GET /coverage)
Limit  (cost=0.72..4.93 rows=1 width=8) (actual time=0.025..0.026 rows=1 loops=1)
  Buffers: shared hit=7
  ->  Nested Loop Semi Join  (cost=0.72..49028.26 rows=11629 width=8) (actual time=0.025..0.025 rows=1 loops=1)
        Buffers: shared hit=7
        ->  Index Scan using ix_report_sitting_date_parliament_number on report  (cost=0.29..29921.52 rows=41838 width=12) (actual time=0.008..0.008 rows=1 loops=1)
              Buffers: shared hit=3
        ->  Index Only Scan using ix_speech_report_id on speech  (cost=0.43..2.12 rows=91 width=4) (actual time=0.016..0.016 rows=1 loops=1)
              Index Cond: (report_id = report.id)
              Heap Fetches: 0
              Buffers: shared hit=4
Execution Time: 0.031 ms
```

```sql
-- coverage_last_date_with_text (GET /coverage)
SELECT report.sitting_date  FROM report  WHERE EXISTS (SELECT *  FROM speech  WHERE speech.report_id = report.id) ORDER BY report.sitting_date DESC   LIMIT 1;
```

```text
-- coverage_last_date_with_text (GET /coverage)
Limit  (cost=0.72..4.93 rows=1 width=8) (actual time=0.004..0.005 rows=1 loops=1)
  Buffers: shared hit=7
  ->  Nested Loop Semi Join  (cost=0.72..49028.26 rows=11629 width=8) (actual time=0.004..0.005 rows=1 loops=1)
        Buffers: shared hit=7
        ->  Index Scan Backward using ix_report_sitting_date_parliament_number on report  (cost=0.29..29921.52 rows=41838 width=12) (actual time=0.003..0.003 rows=1 loops=1)
              Buffers: shared hit=3
        ->  Index Only Scan using ix_speech_report_id on speech  (cost=0.43..2.12 rows=91 width=4) (actual time=0.001..0.001 rows=1 loops=1)
              Index Cond: (report_id = report.id)
              Heap Fetches: 0
              Buffers: shared hit=4
Execution Time: 0.009 ms
```

## ix_speech_transcript_fts

```sql
CREATE INDEX ix_speech_transcript_fts ON speech USING gin (to_tsvector('english', transcript));
```

Kept, and no API statement uses it. It indexes the same vector as `transcript_tsv`, so it duplicates `ix_speech_transcript_tsv`. Scraper commit `1f0d8ef` built it for `GET /search/speeches` (B1, B2). Since API commit `1f8248d` (17 October 2026) the speech statements filter the stored column `transcript_tsv` and never write `to_tsvector('english', transcript)`, so the planner cannot match this expression. The index takes 92 MB, and every insert, delete and update of `transcript` on `speech` still maintains it. The scraper still declares it on `Speech`.

## ix_speech_transcript_tsv

```sql
ALTER TABLE speech ADD COLUMN transcript_tsv tsvector
    GENERATED ALWAYS AS (to_tsvector('english'::regconfig, transcript)) STORED;
CREATE INDEX ix_speech_transcript_tsv ON speech USING gin (transcript_tsv);
```

Needed by `GET /search/speeches` with search words, and by its match count. The statements filter `transcript_tsv @@ websearch_to_tsquery('english', ...)`. Scraper commit `e856c26`, revision `f2b8d4a6c913`. The API has read the column since commit `1f8248d`.

The column stores each vector once. A GIN expression index does not hold a vector Postgres can read back, so `ts_rank` recomputed `to_tsvector('english', transcript)` for every matched row, and a common word ranked every one of its matches. The column costs a table rewrite on creation and 94 MB of index (measured on the rehearsal copy, the same size as the expression index). The two rum indexes below serve the same `@@` predicate, so the planner chooses among the three for each statement. On a clone with the sitting-date index, hiding this one changed no plan in 61 search and count shapes: the two member-filtered shapes that read it in a bitmap read the relevance rum index instead, at 80 against 48 ms and 1.16 against 1.05 ms (the clone was under load from another job). Dropping it would save 94 MB and its upkeep on every write; that is Royce's call.

`speech_headlines` reads at most one page of rows by primary key and needs no index of its own, but it only runs after a search has returned ids.

```sql
-- speech_headlines (GET /search/speeches)
SELECT speech.id, ts_headline('english', speech.transcript, websearch_to_tsquery('english', 'housing estate'), 'StartSel=<mark>, StopSel=</mark>, MaxWords=35, MinWords=15') AS ts_headline_1  FROM speech  WHERE speech.id IN (1, 2, 3);
```

```text
-- speech_headlines (GET /search/speeches)
Index Scan using speech_pkey on speech  (cost=0.43..7.08 rows=3 width=36)
  Index Cond: (id = ANY ('{1,2,3}'::integer[]))
```

## ix_speech_transcript_tsv_rum

```sql
CREATE EXTENSION IF NOT EXISTS rum;
CREATE INDEX CONCURRENTLY ix_speech_transcript_tsv_rum ON speech USING rum (transcript_tsv rum_tsvector_ops);
ANALYZE speech;
```

Needed by `GET /search/speeches` with search words, sorted by relevance. The statement orders by `transcript_tsv <=> websearch_to_tsquery('english', ...)`. A rum index returns matches in that distance order, so the first page reads a few hundred buffers and the planner never ranks the rest. On a clone set like production, "government" read 136,400 buffers with `ts_rank` and about 410 with the rum index (0.24 to 0.34 s warm against 0.09 s). Production timings are in "Ranking cost". Scraper commit `aed4137`, revision `50505c58da5d`.

The index needs the `rum` extension, which DigitalOcean's Postgres 17 offers as version 1.3. Any other server that runs the migration needs the package first (`postgresql-17-rum` on Debian). The local replica container needed it installed with apt; its index is 200 MB.

The distance order is not the `ts_rank` order. In a clone test the top 20 matched `ts_rank` on 20 results for "government", "housing" and "CPF", on 18 for "Lee Kuan Yew", on 10 for "water agreement Malaysia" and on 6 for "national service". On a phrase, rum puts speeches whose words sit close together first.

The migration ends with `ANALYZE speech`. `transcript_tsv` had no statistics since it was added, so the planner took every word for a rare one: 5,258 matches estimated for "government" against 137,788 real. Under a 1975 date range it then scanned the rum index once per report, 222 rescans, and the statement took 23 to 50 s on the clone. After `ANALYZE` it read 4,531 buffers and took 90 ms, and `pg_stats` holds the 1,000 most common lexemes of `transcript_tsv`. A migration that adds a column or an index to `speech` should analyse the table in the same step.

## ix_speech_transcript_tsv_sitting_date_rum

```sql
-- inside scraper migration c93f77e499cc, which copies speech with its report's sitting date and swaps the copy in
ALTER TABLE speech_new ADD COLUMN sitting_date timestamp without time zone NOT NULL;
CREATE INDEX ix_speech_new_transcript_tsv_sitting_date_rum ON speech_new
    USING rum (transcript_tsv rum_tsvector_addon_ops, sitting_date) WITH (attach = 'sitting_date', to = 'transcript_tsv');
-- the copy is analysed before the swap, which renames this index to ix_speech_transcript_tsv_sitting_date_rum
```

On production since 18 October 2026, when scraper migration `c93f77e499cc` ran there from 17:52 to 18:21. Needed by `GET /search/speeches` with search words, sorted oldest first or newest first, and by its match count under a date range. The index stores each match's sitting date in place of the word positions, so it returns the matches of a query in order of distance from a date. The API orders oldest first by `speech.sitting_date |=> '1900-01-01'` and newest first by `speech.sitting_date <=| '2100-01-01'`, then by `speech.id`, so the first page reads a few hundred buffers however common the word is. Date filters on word search read `speech.sitting_date`, and the API binds their bounds as midnight timestamps. Bound as `date` values, as it did until 21 October 2026, the statement compares the timestamp column with a date, which this index cannot take as an index condition: the planner read every match of the word from `ix_speech_transcript_tsv` and tested the dates in the heap. For "housing" in 2020 the count read 67,018 matches, removed 53,531 on the date filter and took 36,873 buffers, against 1,314 buffers and the dates in the index condition with timestamps. A date written into the SQL text is untyped and gets the index, so a plain `EXPLAIN` with the dates written in does not show the problem. In date order and in the match count a Parliament filter also adds that Parliament's first and last sitting dates as a range on it, so the index reads only that span, and the exact Parliament filter on `report` stays. Relevance does not get the range: with it, relevance in Parliament 14 read 159,000 buffers against 6,500. The count gained the range on 21 October 2026 (see "Match counts"). A member filter keeps a plain sort on `speech.sitting_date`, because a member's matches are few: walking the index until 20 of theirs turn up read 57,000 buffers for person 29 against 4,400 for the sort.

The index cannot order by relevance: it holds no word positions, so `<=>` against the query is not an index order. Relevance keeps `ix_speech_transcript_tsv_rum`. The scraper's ADR 0010 records why the date is a copy on `speech` and how the copy is kept in step.

The API's `Speech` model reads `speech.sitting_date`, so the API must not deploy before migration `c93f77e499cc` has run on production: every statement that selects a speech would fail on the missing column. It ran there on 18 October 2026.

`EXPLAIN (ANALYZE, BUFFERS)` on a clone of the replica with production's planner settings (`random_page_cost` 1, `work_mem` 2MB, `effective_cache_size` 568MB), second run, 18 October 2026. Before is the API at `613c795` on the same clone with this index hidden; after is the API with the index. The clone was under load from another job for some runs, so the buffer counts compare better than the times:

| Shape | Before | After |
|---|---|---|
| "government", oldest first | 43.5 s, 508,000 buffers | 0.16 s, 262 |
| "singapore", oldest first | 39.7 s, 603,000 buffers | 0.13 s, 416 |
| "minister", oldest first | 17.8 s, 544,000 buffers | 0.11 s, 392 |
| "housing", oldest first | 5.8 s, 259,000 buffers | 0.06 s, 261 |
| "covid", oldest first | 0.31 s | 0.007 s |
| "government", newest first | 0.002 s | 0.14 to 0.18 s |
| "government", Parliament 3, newest first | 0.001 s | 0.02 to 0.03 s |
| "government", Parliament 14, oldest first | 26.8 s | 0.04 to 0.06 s |
| "government", 1975, newest first | 0.001 s | 0.01 s |
| "government", 2020, oldest first | 0.03 s | 0.02 to 0.03 s |
| "government", person 29, newest first | 0.10 s | 0.05 s |
| "government", count capped at 1,001 | 0.09 s | 0.17 to 0.34 s |
| "government", relevance | 0.19 s | 0.26 to 0.36 s |

Relevance and the count still use `ix_speech_transcript_tsv_rum`; their times moved with the load, not the plan.

The same statements on a server with production's memory and WAL settings as well (`shared_buffers` 189MB, `maintenance_work_mem` 89MB, `max_wal_size` 481MB), after the whole migration had run there, first run with a cold cache: "government" oldest first 0.13 s, newest first 0.10 s, relevance 0.15 s, count 0.11 s, Parliament 14 oldest first 0.03 s, Parliament 3 newest first 0.02 s, 1975 newest first 0.01 s, 2020 oldest first 0.02 s; "singapore" 0.14 s, "minister" 0.12 s, "housing" 0.06 s, "covid" 0.01 s and "online" 0.04 s oldest first. For "government" with each Parliament filter from 0 to 15 and with the years 1975 and 2020, oldest and newest first, page 1 and the page at offset 1,000 (offset 200 for 1975, which has fewer matches), the API before and after returned the same ids in the same order. So did person 29, alone, in Parliament 9 and in 1990, at offsets 0 and 200.

On production after the migration, on 18 October 2026 at 18:54, each statement of the API at `b5608fb` ran once under `EXPLAIN (ANALYZE, BUFFERS)` with a 60-second statement timeout: "government" oldest first 0.43 s (34.7 s before), newest first 0.47 s, relevance 0.45 s, count 0.69 s, Parliament 3 oldest first 0.07 s and newest first 0.06 s, 2020 oldest first 0.10 s and 1975 newest first 0.05 s; oldest first, "singapore" 0.82 s, "minister" 0.51 s, "housing" 0.22 s (18.7 s before), "covid" 0.18 s and "online" 0.08 s. The date-order shapes without a Parliament filter read this index, and relevance and the count read `ix_speech_transcript_tsv_rum`.

## ix_report_title_tsv

```sql
ALTER TABLE report ADD COLUMN title_tsv tsvector
    GENERATED ALWAYS AS (to_tsvector('english'::regconfig, title)) STORED;
CREATE INDEX ix_report_title_tsv ON report USING gin (title_tsv);
```

Needed by `GET /search/reports` (B1). Scraper commit `7dbfc78`, revision `8281c763bb21`.

The title query was cheap before any index existed (about a second) but scanned the whole table. Until 21 October 2026 it filtered through the expression index `ix_report_title_fts` (`USING gin (to_tsvector('english', title))`). An expression index holds no vector Postgres can read back, so `ts_rank` recomputed `to_tsvector('english', title)` for every match, as it did for speeches before `speech.transcript_tsv`. The API now filters and ranks on the stored column. On the scratch copy, warm, interleaved twice, relevance pages fell from 12.1 to 12.6 ms to 4.9 to 7.5 ms for "bill", 24.6 to 8.3 to 9.3 ms for "bill" at offset 980, 20.4 to 4.3 to 4.7 ms for "singapor" and 5.1 to 7.1 to 1.6 to 1.8 ms for "housing". The date orders and the match count only filter, which the expression index did as well, and did not change. Pages, row order and counts were identical over 2,268 pages and 1,342 counts. `ix_report_title_fts` still exists; the scraper can drop it once this API is deployed. The plans below are on the scratch copy, not yet captured on production.

On 21 October 2026 the newest-first and oldest-first orders of the title search changed. Ordering by `report.sitting_date` with the title match as a filter let the planner walk `ix_report_sitting_date_parliament_number` from one end and test every report against the title, because it expects matches to be spread evenly through time. For "covid" oldest first the plan returned 22 rows after removing 30,300 by filter, 15,474 buffers and 173 ms on the scratch copy (second block below). The statement now finds the matches through this index, keeps the first `limit + offset` of them by sitting date with `FETCH FIRST ... ROWS WITH TIES`, and ranks and orders only that cut. The sort key inside the cut is the sitting date plus a zero interval, so no index can supply the order. `WITH TIES` keeps every match on the cut-off date, because the ranking breaks ties within a date, and a plain `LIMIT` could drop one that belongs on the page. The cut selects every column of `report` except `markdown_content`. The relevance order is unchanged. The API binds the zero as an interval parameter; the compiled text below shows it as `make_interval(secs=>0.0)`.

On the scratch copy, over 57 words newest and oldest first, interleaved on one connection, the median page statement fell from 7.4 to 1.9 ms and the slowest from 159 to 9 ms. A common word oldest first got slower, because the old plan stopped after its first few hundred reports and the cut reads every match: "bill" 1.4 to 7.7 ms, "amend" 1.7 to 5.3 ms. psycopg prepares a statement on its sixth execution on a connection and Postgres may then switch to a generic plan. For the new statement the generic plan has the same shape as the custom one: a bitmap scan of this index, a sort and the cut. The two date-order plans below are plain `EXPLAIN`s on the scratch copy, not yet captured on production.

```sql
-- title_search_relevance (GET /search/reports)
SELECT report.id, report.volume_number, report.parliament_number, report.sitting_number, report.sitting_date, report.speech_number, report.title, report.subtitle, report.report_id, report.report_type, report.html_file_name, report.report_version  FROM report  WHERE report.title_tsv @@ websearch_to_tsquery('english', 'housing estate') ORDER BY ts_rank(report.title_tsv, websearch_to_tsquery('english', 'housing estate')) DESC, report.sitting_date DESC, report.id  LIMIT 21 OFFSET 0;
```

```text
-- title_search_relevance (GET /search/reports)
Limit  (cost=68.40..68.43 rows=12 width=194)
  ->  Sort  (cost=68.40..68.43 rows=12 width=194)
        Sort Key: (ts_rank(title_tsv, '''hous'' & ''estat'''::tsquery)) DESC, sitting_date DESC, id
        ->  Bitmap Heap Scan on report  (cost=21.58..68.18 rows=12 width=194)
              Recheck Cond: (title_tsv @@ '''hous'' & ''estat'''::tsquery)
              ->  Bitmap Index Scan on ix_report_title_tsv  (cost=0.00..21.58 rows=12 width=0)
                    Index Cond: (title_tsv @@ '''hous'' & ''estat'''::tsquery)
```

```sql
-- title_search_date (GET /search/reports)
SELECT anon_1.id, anon_1.volume_number, anon_1.parliament_number, anon_1.sitting_number, anon_1.sitting_date, anon_1.speech_number, anon_1.title, anon_1.subtitle, anon_1.report_id, anon_1.report_type, anon_1.html_file_name, anon_1.report_version  FROM (SELECT report.id AS id, report.volume_number AS volume_number, report.parliament_number AS parliament_number, report.sitting_number AS sitting_number, report.sitting_date AS sitting_date, report.speech_number AS speech_number, report.title AS title, report.title_tsv AS title_tsv, report.subtitle AS subtitle, report.report_id AS report_id, report.report_type AS report_type, report.html_file_name AS html_file_name, report.report_version AS report_version  FROM report  WHERE (report.title_tsv @@ websearch_to_tsquery('english', 'housing estate')) AND report.parliament_number = 14 ORDER BY report.sitting_date + make_interval(secs=>0.0) DESC  FETCH FIRST (21) ROWS WITH TIES) AS anon_1 ORDER BY anon_1.sitting_date DESC, ts_rank(anon_1.title_tsv, websearch_to_tsquery('english', 'housing estate')) DESC, anon_1.id  LIMIT 21 OFFSET 0;
```

```text
-- title_search_date (GET /search/reports)
Limit  (cost=68.28..68.29 rows=3 width=194)
  ->  Sort  (cost=68.28..68.29 rows=3 width=194)
        Sort Key: anon_1.sitting_date DESC, (ts_rank(anon_1.title_tsv, '''hous'' & ''estat'''::tsquery)) DESC, anon_1.id
        ->  Subquery Scan on anon_1  (cost=68.21..68.25 rows=3 width=194)
              ->  Limit  (cost=68.21..68.22 rows=3 width=286)
                    ->  Sort  (cost=68.21..68.22 rows=3 width=286)
                          Sort Key: ((report.sitting_date + '00:00:00'::interval)) DESC
                          ->  Bitmap Heap Scan on report  (cost=21.58..68.19 rows=3 width=286)
                                Recheck Cond: (title_tsv @@ '''hous'' & ''estat'''::tsquery)
                                Filter: (parliament_number = 14)
                                ->  Bitmap Index Scan on ix_report_title_tsv  (cost=0.00..21.58 rows=12 width=0)
                                      Index Cond: (title_tsv @@ '''hous'' & ''estat'''::tsquery)
```

```sql
-- title_search_oldest, before 21 October 2026 (GET /search/reports?q=covid&sort=oldest)
SELECT report.id, report.volume_number, report.parliament_number, report.sitting_number, report.sitting_date, report.speech_number, report.title, report.subtitle, report.report_id, report.report_type, report.html_file_name, report.report_version  FROM report  WHERE to_tsvector('english', report.title) @@ websearch_to_tsquery('english', 'covid') ORDER BY report.sitting_date ASC, ts_rank(to_tsvector('english', report.title), websearch_to_tsquery('english', 'covid')) DESC, report.id   LIMIT 21 OFFSET 0;
```

```text
-- title_search_oldest, before 21 October 2026 (GET /search/reports?q=covid&sort=oldest)
Limit  (cost=78.61..1466.74 rows=21 width=194) (actual time=173.425..173.428 rows=21 loops=1)
  Buffers: shared hit=15474
  ->  Incremental Sort  (cost=78.61..40664.95 rows=614 width=194) (actual time=173.424..173.425 rows=21 loops=1)
        Sort Key: sitting_date, (ts_rank(to_tsvector('english'::regconfig, (title)::text), '''covid'''::tsquery)) DESC, id
        Presorted Key: sitting_date
        Full-sort Groups: 1  Sort Method: quicksort  Average Memory: 30kB  Peak Memory: 30kB
        Buffers: shared hit=15474
        ->  Index Scan using ix_report_sitting_date_parliament_number on report  (cost=0.29..40640.65 rows=614 width=194) (actual time=171.522..173.306 rows=22 loops=1)
              Filter: (to_tsvector('english'::regconfig, (title)::text) @@ '''covid'''::tsquery)
              Rows Removed by Filter: 30300
              Buffers: shared hit=15474
Planning:
  Buffers: shared hit=1
Planning Time: 0.098 ms
Execution Time: 173.451 ms
```

```sql
-- title_search_oldest (GET /search/reports?q=covid&sort=oldest)
SELECT anon_1.id, anon_1.volume_number, anon_1.parliament_number, anon_1.sitting_number, anon_1.sitting_date, anon_1.speech_number, anon_1.title, anon_1.subtitle, anon_1.report_id, anon_1.report_type, anon_1.html_file_name, anon_1.report_version  FROM (SELECT report.id AS id, report.volume_number AS volume_number, report.parliament_number AS parliament_number, report.sitting_number AS sitting_number, report.sitting_date AS sitting_date, report.speech_number AS speech_number, report.title AS title, report.title_tsv AS title_tsv, report.subtitle AS subtitle, report.report_id AS report_id, report.report_type AS report_type, report.html_file_name AS html_file_name, report.report_version AS report_version  FROM report  WHERE report.title_tsv @@ websearch_to_tsquery('english', 'covid') ORDER BY report.sitting_date + make_interval(secs=>0.0) ASC  FETCH FIRST (21) ROWS WITH TIES) AS anon_1 ORDER BY anon_1.sitting_date ASC, ts_rank(anon_1.title_tsv, websearch_to_tsquery('english', 'covid')) DESC, anon_1.id  LIMIT 21 OFFSET 0;
```

```text
-- title_search_oldest (GET /search/reports?q=covid&sort=oldest)
Limit  (cost=1883.75..1883.80 rows=21 width=194) (actual time=2.576..2.580 rows=21 loops=1)
  Buffers: shared hit=457
  ->  Sort  (cost=1883.75..1883.80 rows=21 width=194) (actual time=2.575..2.577 rows=21 loops=1)
        Sort Key: anon_1.sitting_date, (ts_rank(anon_1.title_tsv, '''covid'''::tsquery)) DESC, anon_1.id
        Sort Method: quicksort  Memory: 30kB
        Buffers: shared hit=457
        ->  Subquery Scan on anon_1  (cost=1882.97..1883.29 rows=21 width=194) (actual time=2.512..2.527 rows=21 loops=1)
              Buffers: shared hit=448
              ->  Limit  (cost=1882.97..1883.03 rows=21 width=286) (actual time=2.507..2.514 rows=21 loops=1)
                    Buffers: shared hit=448
                    ->  Sort  (cost=1882.97..1884.55 rows=630 width=286) (actual time=2.506..2.509 rows=22 loops=1)
                          Sort Key: ((report.sitting_date + '00:00:00'::interval))
                          Sort Method: quicksort  Memory: 244kB
                          Buffers: shared hit=448
                          ->  Bitmap Heap Scan on report  (cost=16.13..1865.99 rows=630 width=286) (actual time=0.222..2.103 rows=634 loops=1)
                                Recheck Cond: (title_tsv @@ '''covid'''::tsquery)
                                Heap Blocks: exact=445
                                Buffers: shared hit=448
                                ->  Bitmap Index Scan on ix_report_title_tsv  (cost=0.00..15.97 rows=630 width=0) (actual time=0.147..0.148 rows=634 loops=1)
                                      Index Cond: (title_tsv @@ '''covid'''::tsquery)
                                      Buffers: shared hit=3
Planning:
  Buffers: shared hit=279
Planning Time: 2.056 ms
Execution Time: 2.701 ms
```

## Ranking cost

Speech word search used to rank every match. `ts_rank` recomputed `to_tsvector('english', transcript)` for each matched row. On 14 October 2026, timed through a local API against production, "housing estate" (4,822 matches) took 1.5 to 1.8 s, "housing" with a person filter took 2.1 to 2.4 s, and "government" (137,785 matches) answered `503 search.timed_out`. The 17 October audit found "government" by relevance over 30 s in three of three runs, and by date at 12.9 s and 26.8 s.

Three commits changed that: the stored column (`1f8248d`, 17 October), the rum index with its `ANALYZE` (`aed4137`, 18 October) and the order clauses below (`11f0aa6`, 18 October). `ts_rank` is gone from speech search. Report title search still uses it. The relevance plan above stands, and the date orders rank only the cut described under `ix_report_title_fts`.

The `ORDER BY` clauses of `GET /search/speeches` with search words, from `api/crud/speech.py`. The date orders need `ix_speech_transcript_tsv_sitting_date_rum`, on production since 18 October 2026. Before it, production matched the clauses of `613c795`, which are in the "Newest first" and "Oldest first" paragraphs below:

```sql
-- relevance
ORDER BY speech.transcript_tsv <=> websearch_to_tsquery('english', 'government'), speech.sitting_date DESC, speech.id

-- relevance, with a date range or a member filter
ORDER BY (speech.transcript_tsv <=> websearch_to_tsquery('english', 'government')) + 0, speech.sitting_date DESC, speech.id

-- newest first
ORDER BY speech.sitting_date <=| '2100-01-01 00:00:00', speech.id

-- oldest first
ORDER BY speech.sitting_date |=> '1900-01-01 00:00:00', speech.id

-- newest first with a member filter (ASC for oldest first)
ORDER BY speech.sitting_date DESC, speech.id
```

Relevance. The rum index returns matches in `<=>` order, so the planner stops after the first page. Under a date range that scan would walk matches in rank order until 20 pass the filter: 3.88 s and 35,400 buffers for "government" in 1975 on the clone, against 0.03 s and 3,000 buffers from the report date index. Adding zero hides the order from the rum index. At `613c795` the planner then started from `ix_report_sitting_date_parliament_number`; with the date filter on `speech.sitting_date` it reads the range from `ix_speech_transcript_tsv_sitting_date_rum` and ranks only the matches in it: 4,022 buffers and 0.03 s on the clone. That holds only when the bounds are timestamps. The API sent `date` bounds until 21 October 2026, and the planner then read all of the word's matches from `ix_speech_transcript_tsv` and filtered the dates in the heap: "housing" in 2020, relevance page 1, took 45,186 buffers and 56 ms on the scratch copy, against 2,056 buffers and 7 ms with timestamps. A member filter takes the same zero since 21 October 2026, and the tie-break since then is `speech.sitting_date`, which equals the report's date on every row, in place of a subquery on `report`.

On 21 October 2026 relevance took two changes. A member filter now adds zero to the distance, as a date range does. Without it the planner walked `ix_speech_transcript_tsv_rum` in rank order and tested each match against the member: for "sir" and the four Memberships of person 349 that removed 179,708 rows to find 367, and took 1,355 ms and 112,417 buffers on the scratch copy, spilling to temp files. With zero added it intersects `ix_speech_speaker_id` with `ix_speech_transcript_tsv` and sorts the member's matches: 9.8 ms and 642 buffers. The tie-break moved from a subquery on `report`, run once for every row the sort pulled, to `speech.sitting_date`; "government" page 50 fell from 9,657 to 5,520 buffers with it. Interleaved on the scratch copy, 5 rounds, page and count together, medians: "sir" for person 349 2,010 to 28 ms, "housing" for person 170 69 to 22 ms (13,064 to 1,086 buffers), "government" for person 29 page 2 114 to 40 ms (1,879 to 4,055 buffers, because the plan now reads both indexes). Plain "government" pages 1, 2 and 50 and "housing" in written answers did not move beyond noise over 20 rounds (68.4 to 68.5 ms, 65.9 to 62.4, 66.3 to 68.5, 53.8 to 53.9). The page ids and their order were identical before and after for 1,236 inputs.

On 21 October 2026 the join to `report` also went from the word search page, its count and its per-report count whenever no Parliament or report type filter is set, as it did from a member's speeches without search words (see `ix_speech_speaker_id`). The dates filter `speech.sitting_date`, so only those two filters read `report`. Without a filter on `report` the join only checked that the speech has a report, and `speech.report_id IS NOT NULL` keeps the same rows because `speech.report_id` is a foreign key to `report`. Interleaved on the scratch copy, 10 rounds, warm medians, then with every shared buffer of the database evicted first, 3 rounds: "housing" in 2020 by relevance 10.5 to 5.5 ms warm and 66 to 14 ms evicted (7,437 to 1,229 buffers), its count 5.0 to 4.7 ms (1,445 to 889); "housing" for person 170 newest first 9.8 to 6.5 ms warm, 21 to 13 ms evicted; the "public housing" count 14.5 to 7.8 ms warm, 63 to 32 ms evicted (15,762 to 2,883 buffers), where the join had made the planner pick a parallel plan; the "government" count 3.9 to 3.4 ms warm, 8.9 to 4.9 ms evicted (2,894 to 1,312). The broad word pages read fewer buffers ("government" page 50 7,048 to 5,012) but did not move beyond noise ("government" by relevance 64.0 and 62.4 ms, page 50 62.5 and 61.3, newest first 42.6 and 45.3). Searches with a Parliament or a report type keep the join and did not change. 1,520 word inputs were identical before and after: the 8 words of the earlier comparisons under no filter, Parliament 14, written answers, four date ranges, five people, a person with a year and a person with a Parliament, by all three sorts on pages 1, 2 and 50, their capped counts, two of the filter sets also with excluded reports, and pages and per-report counts for three words in the 40 reports with the most speeches.

The page for "sir" and person 349 after the change, scratch copy, third run, not yet captured on production:

```sql
-- speech_search_relevance_person (GET /search/speeches?q=sir&person_id=349)
SELECT speech.id, speech.ordinal, speech.speaker, speech.transcript, speech.kind, speech.sitting_date, speech.report_id, speech.speaker_id FROM speech WHERE speech.report_id IS NOT NULL AND (speech.transcript_tsv @@ websearch_to_tsquery('english', 'sir')) AND speech.speaker_id IN (953, 1071, 1180, 1302) ORDER BY (speech.transcript_tsv <=> websearch_to_tsquery('english', 'sir')) + 0, speech.sitting_date DESC, speech.id LIMIT 21 OFFSET 0;
```

```text
-- speech_search_relevance_person (GET /search/speeches?q=sir&person_id=349), scratch copy, not yet captured on production
Limit  (cost=8241.99..8242.05 rows=21 width=416) (actual time=10.682..10.684 rows=21 loops=1)
  Buffers: shared hit=392
  ->  Sort  (cost=8241.99..8246.78 rows=1913 width=416) (actual time=10.682..10.683 rows=21 loops=1)
        Sort Key: (((transcript_tsv <=> '''sir'''::tsquery) + '0'::double precision)), sitting_date DESC, id
        Sort Method: top-N heapsort  Memory: 54kB
        Buffers: shared hit=392
        ->  Bitmap Heap Scan on speech  (cost=1326.29..8190.42 rows=1913 width=416) (actual time=10.381..10.574 rows=367 loops=1)
              Recheck Cond: ((speaker_id = ANY ('{953,1071,1180,1302}'::integer[])) AND (transcript_tsv @@ '''sir'''::tsquery))
              Filter: (report_id IS NOT NULL)
              Heap Blocks: exact=323
              Buffers: shared hit=392
              ->  BitmapAnd  (cost=1326.29..1326.29 rows=1913 width=0) (actual time=10.354..10.354 rows=0 loops=1)
                    Buffers: shared hit=60
                    ->  Bitmap Index Scan on ix_speech_speaker_id  (cost=0.00..133.41 rows=11160 width=0) (actual time=0.306..0.306 rows=11760 loops=1)
                          Index Cond: (speaker_id = ANY ('{953,1071,1180,1302}'::integer[]))
                          Buffers: shared hit=23
                    ->  Bitmap Index Scan on ix_speech_transcript_tsv  (cost=0.00..1191.68 rows=180468 width=0) (actual time=9.908..9.908 rows=180075 loops=1)
                          Index Cond: (transcript_tsv @@ '''sir'''::tsquery)
                          Buffers: shared hit=37
Planning:
  Buffers: shared hit=3
Planning Time: 0.070 ms
Execution Time: 10.866 ms
```

Newest first, at `613c795`. The key is the joined `report.sitting_date`, so a common word walks the report date index from the newest report and stops after the first page. With the subquery date the planner sorted every match: 34.7 to 38.5 s for "government" once the rum index existed, and one cold run passed 120 s.

Oldest first, at `613c795`. The key stays the subquery date and Postgres sorts every match. The alternative, walking the report date index forward, answers "government" in 0.01 s. But a word of recent decades walks sixty years of reports before its first match, and that takes 15 to 58 s or more.

`EXPLAIN ANALYZE` of the SQL the API at `613c795` emits, on production, read-only, 18 October 2026, first page. The API's statement timeout is 30 s. Relevance was run three times, seconds per run:

| Relevance | Run 1 | Run 2 | Run 3 |
|---|---|---|---|
| "government" | 0.58 | 3.30 | 0.60 |
| "government", Parliament 3 | 1.82 | 4.82 | 2.38 |
| "government", Parliament 14 | 0.56 | 2.35 | 0.41 |
| "government", 1975 only | 1.81 | 2.58 | 0.69 |
| phrase "national service" | 0.54 | 0.54 | 0.31 |
| "government", one member (five Memberships) | 0.15 | 0.29 | 0.15 |
| "government", written answers only | 3.51 | 6.28 | 1.68 |
| "housing estate", Parliament 8 | 0.14 | 0.22 | 0.12 |
| "government", page 6 | 0.35 | 0.49 | 0.50 |
| "minister" | 0.51 | 1.21 | 0.51 |
| "housing" | 0.26 | 0.20 | 0.18 |

Run 2 was the slowest in 8 of 11 shapes, and the cause was not isolated. The slowest single run is 6.28 s. The brief's speed target is 300 ms warm, which only the narrow shapes meet. The launch test is an answer inside the 30-second timeout at full data size, and every relevance shape passes it.

Newest first and oldest first, one run each, seconds:

| Newest first | Time | Oldest first | Time |
|---|---|---|---|
| "government" | 0.13 | "covid" | 4.3 |
| "government", 1975 only | 0.15 | "online" | 2.2 |
| "covid" | 0.25 | "cpf" | 4.1 |
| "housing estate" | 2.6 | "digital" | 2.5 |
| "durian" | 0.06 | phrase "national service" | 0.90 |
| "barisan" | 0.42 | "government", Parliament 3 | 1.25 |
| "minister", written answers only | 0.03 | "government", 1975 only | 0.25 |
| "government", one member (twelve Memberships) | 0.93 | one member (twelve Memberships) | 0.85 |
| "federation" | 0.70 | "housing" | 18.7 |
| "colonial" | 0.54 | "government" | 34.7 |
| "unemployment" | 1.23 | | |
| phrase "chief minister" | 0.50 | | |

Residual. Oldest first on one of the ten or so lexemes found in more than 11% of speeches (sir, also, singapor, mr, would, minist, govern, year, time, member, from the production statistics) can pass the 30-second timeout. "government" took 34.7 s, and the API answers such a search with its timed-out message (`503 search.timed_out`). The change picked the shape that fails on the rarer case. The fix for both is the sitting date on the `speech` row and `ix_speech_transcript_tsv_sitting_date_rum`, with the order clauses above. On a clone it took "government" oldest first from 43.5 s to 0.16 s. It shipped to production on 18 October 2026, and there "government" oldest first now takes 0.43 s.

`GET /people/29` is the one endpoint outside speech word search that missed the target on 14 October 2026, at 0.30 to 0.64 s. The statement behind it that takes the time is `speech_counts_by_parliament`, which plans a sequential scan of `report`. Not retimed since the `ANALYZE speech` of 18 October. `EXPLAIN (ANALYZE, BUFFERS)` on production, with the 12 memberships of person 29:

```text
HashAggregate  (cost=18568.61..18568.76 rows=15 width=12) (actual time=248.854..248.866 rows=12 loops=1)
  Group Key: report.parliament_number
  Batches: 1  Memory Usage: 24kB
  Buffers: shared hit=5691 read=4010
  ->  Hash Join  (cost=7025.17..18483.64 rows=16993 width=4) (actual time=223.608..243.978 rows=13345 loops=1)
        Hash Cond: (speech.report_id = report.id)
        Buffers: shared hit=5691 read=4010
        ->  Index Scan using ix_speech_speaker_id on speech  (cost=0.43..11414.29 rows=16993 width=4) (actual time=0.030..12.556 rows=13345 loops=1)
              Index Cond: (speaker_id = ANY ('{30,91,158,229,308,382,462,552,644,743,846,956}'::integer[]))
              Buffers: shared hit=3617
        ->  Hash  (cost=6502.11..6502.11 rows=41811 width=8) (actual time=222.096..222.099 rows=41811 loops=1)
              Buckets: 65536  Batches: 1  Memory Usage: 2146kB
              Buffers: shared hit=2074 read=4010
              ->  Seq Scan on report  (cost=0.00..6502.11 rows=41811 width=8) (actual time=0.113..182.858 rows=41811 loops=1)
                    Buffers: shared hit=2074 read=4010
Planning:
  Buffers: shared hit=17
Planning Time: 1.359 ms
Execution Time: 249.034 ms
```

The planner expected 16,993 speeches for these memberships (13,345 real), so it joined to `report` with a hash join over a full sequential scan (183 ms, 4,010 pages read from disk) instead of 13,345 primary-key lookups. The speech side takes 12.6 ms. The other statements of the endpoint take under 30 ms each. On 21 October 2026 the statement was split in two, one counting the member's speeches per report and one reading those reports' Parliament numbers by primary key, so the sequential scan of `report` is gone; the plan above stays as the record of the old statement.

## Match counts

Every search page also carries `total_count` and `is_total_capped`. The count is its own statement per table, built from the same filter helpers as the page query, in the shape `SELECT count(*) FROM (SELECT id ... LIMIT 1001) AS capped`. `total_count` is the number of matches up to 1,000 and `is_total_capped` is true when there are more. An exact `count(*)` was measured first. `EXPLAIN (ANALYZE, BUFFERS)`, warm, best of three, read-only, on production on 14 October 2026, before the stored column (speeches joined to `report`, as the page query is):

| Count | Matches | Exact | Capped at 1,000 | Capped at 10,000 |
|---|---|---|---|---|
| speeches, "government" | 137,785 | over 30 s (statement timeout) | 3.0 to 6.5 s | 7.3 to 10.5 s |
| speeches, "water agreement" | 438 | 14 ms | | |
| speeches, "housing estate" | 4,822 | 241 ms | | |
| speeches, "government" and person 29 | | 1.3 s | 0.65 to 2.4 s | 6.7 s |
| speeches, person 29 | 13,135 | 47 ms | 4 to 22 ms | 245 ms |
| speeches, Parliament 9 | | 249 ms | 1 to 6 ms | 75 ms |
| speeches, `oral-answer` | | 2.15 s | 11 to 22 ms | 189 ms |
| reports, "government" | 1,024 | 30 ms | 3 to 15 ms | 28 ms |
| reports, Parliament 13 | | 11 ms | | |

Exact counts fail: "government" times out, and `oral-answer` alone takes 2.2 s. A cap of 1,000 keeps every search without words under 25 ms, against up to 245 ms at 10,000. With the expression index, no cap met 300 ms for a broad word, because `to_tsvector` was recomputed for every row the filter tested: "government" cost 0.95 s at a cap of 100, 3 to 6 s at 1,000 and 7 to 10 s at 10,000. The API uses 1,000, the cap that adds least to a broad word search while still giving an exact figure for every narrow one.

The stored column fixed the broad word cost, not a smaller cap. On 18 October 2026, with `transcript_tsv` and the rum index, the count capped at 1,001 took 0.23 to 1.47 s in every shape tested on production, "government" included.

On 21 October 2026 the search engine's connection options gained `-c synchronize_seqscans=off`. A broad word's capped count plans a sequential scan of `speech` that stops at the 1,001st match. Postgres synchronises sequential scans of a table larger than a quarter of `shared_buffers`, so with the default setting each scan started where the last cut scan stopped, and every run read pages no earlier run had cached. With the setting off, the scan always starts at block 0 and a repeat finds the same pages cached. `pg_settings` lists it with context `user`, so the read-only role can set it. A capped count is the lesser of its matches and 1,001 wherever the scan starts, so no count changes: the capped count of 335 inputs (44 broad words under no filter, a Parliament and a year, the 8 words under 23 filter sets, and 19 per-report cases) was identical before and after. The setting reaches only sequential scans. A bitmap or index plan is unchanged.

`EXPLAIN (ANALYZE, BUFFERS)` of the "government" count on the scratch copy, three runs each, before the join to `report` went (see "Ranking cost"): with the default setting `Rows Removed by Filter` was 7,396, 7,518 and 9,889 and the runs took 262, 261 and 347 ms. With it off it was 10,291 every time and the runs took 83, 11 and 14 ms. Interleaved against the old options on the scratch copy under load, 8 rounds, medians: "government" 963 to 9.8 ms, "housing" 311 to 16 ms, "year" 154 to 4.7 ms. Over the 44 words found in more than 5.6% of speeches, 3 rounds each, the median fell from 243 to 12 ms and the 90th percentile from 558 to 43 ms, and no word got slower. The plan below is the third run with the setting off and without the join to `report`, scratch copy, not yet captured on production.

The fixed start costs a count that filters to a part of the table the start does not favour. `speech` is not in date order (the sitting date has a correlation of 0.05 with block position), and Parliament 14 holds 4% of the first 10,000 blocks against 20% of the table. A Parliament 14 count that still scans sequentially moved both ways, medians over 3 rounds against a start moved by an unrelated count first: "sir" 1,534 to 755 ms, "mr" 984 to 594, "one" 501 to 474, "singapor" 86 to 111, "minist" 81 to 131, "also" 101 to 185, "government" 199 to 406. Since 21 October 2026 the count also carries the Parliament's date range, which takes these shapes off the sequential scan (below).

```sql
-- speech_count (GET /search/speeches?q=government)
SELECT count(*) AS count_1 FROM (SELECT speech.id AS id FROM speech WHERE speech.report_id IS NOT NULL AND (speech.transcript_tsv @@ websearch_to_tsquery('english', 'government')) LIMIT 1001) AS anon_1;
```

```text
-- speech_count (GET /search/speeches?q=government)
Aggregate  (cost=867.65..867.66 rows=1 width=8) (actual time=3.044..3.045 rows=1 loops=1)
  Buffers: shared hit=671 read=641
  ->  Limit  (cost=0.00..855.14 rows=1001 width=4) (actual time=0.021..2.992 rows=1001 loops=1)
        Buffers: shared hit=671 read=641
        ->  Seq Scan on speech  (cost=0.00..118551.32 rows=138773 width=4) (actual time=0.021..2.939 rows=1001 loops=1)
              Filter: ((report_id IS NOT NULL) AND (transcript_tsv @@ '''govern'''::tsquery))
              Rows Removed by Filter: 10291
              Buffers: shared hit=671 read=641
Planning:
  Buffers: shared hit=3
Planning Time: 0.085 ms
Execution Time: 3.053 ms
```

On 21 October 2026 the speech match count began to add the Parliament's date range when a Parliament is set, as the date-ordered page query already did: `speech.sitting_date` between the Parliament's first and last report date, each a one-row scalar subquery on `ix_report_sitting_date_parliament_number` (64 and 3 buffers for Parliament 14). The exact `report.parliament_number` filter stays. Before, a Parliament count read every match of the word from the GIN index and joined each to `report` until 1,001 were in the Parliament. Now `ix_speech_transcript_tsv_sitting_date_rum` returns only the matches inside the span. The range cannot drop a speech of the Parliament: `speech.sitting_date` equals its report's date on all 1,051,922 scratch rows, and every Parliament's speeches lie between its own first and last report date. No count changed. 638 inputs were identical before and after: Parliaments 0 to 15 and 99, each against the 8 matrix words, four words with excluded report ids, "housing" and "sir" under 11 other filters, and per-report cases. 335 of the counts were zero, 149 between 1 and 1,000 and 154 capped.

Interleaved on the scratch copy, 8 rounds, medians, with buffers from `EXPLAIN (ANALYZE, BUFFERS)`:

| Count | Before | After | Buffers before | Buffers after |
|---|---|---|---|---|
| "housing", Parliament 14 | 25 ms | 11 ms | 28,798 | 3,912 |
| "government", Parliament 9 | 20 ms | 11 ms | 13,617 | 1,832 |
| "minister", Parliament 1 | 54 ms | 12 ms | 70,929 | 1,180 |
| "sir", Parliament 14 | 86 ms | 13 ms | 68,809 | 2,469 |
| "government", Parliament 14 | 44 ms | 12 ms | 33,121 | 2,281 |
| "government", Parliament 3 | 15 ms | 11 ms | 18,142 | 1,475 |
| "housing", Parliament 0 | 17 ms | 10 ms | 16,007 | 4,058 |
| "covid", Parliament 14 | 3.0 ms | 6.4 ms | 2,199 | 3,678 |

A narrow word is the one regression: "covid" has few matches, so its GIN bitmap was already small and the ranged rum scan reads more. The seven Parliament 14 counts that scanned `speech` sequentially ("sir", "mr", "one", "singapor", "minist", "also", "government") took 22 to 51 ms each with the range, against 111 to 755 ms without it. In the harness a "sir" search in Parliament 14 took 264 ms warm before and 142 after, and "housing" in Parliament 14 with written answers 210 before and 85 after. None of these timings has a date filter of its own.

The plan below is the count for "housing" in Parliament 14 on the scratch copy, third run, not yet captured on production. Before, the plan was a Bitmap Heap Scan of `speech` over the 67,018 GIN matches, joined to `report` until 1,001 rows were in Parliament 14: 28,798 buffers, 24 ms.

```sql
-- speech_count, Parliament filter (GET /search/speeches?q=housing&parliament_number=14)
SELECT count(*) AS count_1 FROM (SELECT speech.id AS id FROM speech JOIN report ON report.id = speech.report_id WHERE (speech.transcript_tsv @@ websearch_to_tsquery('english', 'housing')) AND report.parliament_number = 14 AND speech.sitting_date >= (SELECT min(report_1.sitting_date) AS min_1 FROM report AS report_1 WHERE report_1.parliament_number = 14) AND speech.sitting_date <= (SELECT max(report_1.sitting_date) AS max_1 FROM report AS report_1 WHERE report_1.parliament_number = 14) LIMIT 1001) AS anon_1;
```

```text
-- speech_count, Parliament filter (GET /search/speeches?q=housing&parliament_number=14)
Aggregate  (cost=3702.33..3702.34 rows=1 width=8) (actual time=11.005..11.007 rows=1 loops=1)
  Buffers: shared hit=3912, temp read=282 written=282
  ->  Limit  (cost=65.16..3701.14 rows=95 width=4) (actual time=9.034..10.946 rows=1001 loops=1)
        Buffers: shared hit=3912, temp read=282 written=282
        InitPlan 2
          ->  Result  (cost=1.21..1.22 rows=1 width=8) (actual time=0.160..0.161 rows=1 loops=1)
                Buffers: shared hit=64
                InitPlan 1
                  ->  Limit  (cost=0.29..1.21 rows=1 width=8) (actual time=0.159..0.159 rows=1 loops=1)
                        Buffers: shared hit=64
                        ->  Index Only Scan using ix_report_sitting_date_parliament_number on report report_1  (cost=0.29..10416.33 rows=11284 width=8) (actual time=0.159..0.159 rows=1 loops=1)
                              Index Cond: (parliament_number = 14)
                              Heap Fetches: 1
                              Buffers: shared hit=64
        InitPlan 4
          ->  Result  (cost=1.21..1.22 rows=1 width=8) (actual time=0.005..0.006 rows=1 loops=1)
                Buffers: shared hit=3
                InitPlan 3
                  ->  Limit  (cost=0.29..1.21 rows=1 width=8) (actual time=0.005..0.005 rows=1 loops=1)
                        Buffers: shared hit=3
                        ->  Index Only Scan Backward using ix_report_sitting_date_parliament_number on report report_1_1  (cost=0.29..10416.33 rows=11284 width=8) (actual time=0.005..0.005 rows=1 loops=1)
                              Index Cond: (parliament_number = 14)
                              Heap Fetches: 0
                              Buffers: shared hit=3
        ->  Nested Loop  (cost=62.71..3698.69 rows=95 width=4) (actual time=9.033..10.884 rows=1001 loops=1)
              Buffers: shared hit=3912, temp read=282 written=282
              ->  Index Scan using ix_speech_transcript_tsv_sitting_date_rum on speech  (cost=62.42..1477.88 rows=351 width=4) (actual time=9.026..9.902 rows=1001 loops=1)
                    Index Cond: ((transcript_tsv @@ '''hous'''::tsquery) AND (sitting_date >= (InitPlan 2).col1) AND (sitting_date <= (InitPlan 4).col1))
                    Buffers: shared hit=909, temp read=282 written=282
              ->  Index Scan using report_pkey on report  (cost=0.29..6.33 rows=1 width=4) (actual time=0.001..0.001 rows=1 loops=1001)
                    Index Cond: (id = speech.report_id)
                    Filter: (parliament_number = 14)
                    Buffers: shared hit=3003
Planning:
  Buffers: shared hit=19
Planning Time: 0.264 ms
Execution Time: 11.299 ms
```

Date ranges. A date range filters `speech.sitting_date` in the page query and in the count. The API sent the bounds as `date` values, so the statement compared a timestamp column with `$2::DATE`, the rum index could not take the dates, and the planner read every match of the word from `ix_speech_transcript_tsv` and filtered them in the heap (see `ix_speech_transcript_tsv_sitting_date_rum`). On 21 October 2026 the bounds became midnight timestamps. Every `speech.sitting_date` is a midnight, so no result changed. 3,760 inputs were identical before and after, 2,157 of them with a date range: 1,236 pages, 638 and 335 counts, and 1,551 further date-range inputs (16 ranges from a single day to the whole record, four filter sets, six words; capped counts, three sorts, pages 1 and 2, per-report counts).

Interleaved on the scratch copy, 5 rounds, medians, page and capped count measured separately, buffers from `EXPLAIN (ANALYZE, BUFFERS)` (the last row has no dates and is the noise check: the same SQL took 41.3 and 31.4 ms, so a page difference under about 10 ms means nothing):

| Search | Page before | Page after | Count before | Count after |
|---|---|---|---|---|
| "housing", 2020 | 56 ms, 45,186 buffers | 7 ms, 2,056 | 42 ms, 36,873 | 5 ms, 1,314 |
| "housing", 2020, newest first | 30 ms, 8,047 | 11 ms, 203 | 46 ms, 36,873 | 5 ms, 1,314 |
| "housing", 2020, oldest first | 89 ms, 60,434 | 10 ms, 254 | 43 ms, 36,873 | 6 ms, 1,314 |
| "government", 2020 | 1,309 ms, 67,498 | 24 ms, 3,949 | 296 ms, 19,367 | 9 ms, 1,070 |
| "sir", 1975 | 216 ms, 66,065 | 23 ms, 1,515 | 210 ms, 65,874 | 12 ms, 997 |
| "housing", 1990 to 1995 | 63 ms, 51,995 | 11 ms, 5,859 | 26 ms, 22,743 | 6 ms, 1,918 |
| "housing", January 2020 | 50 ms, 42,096 | 6 ms, 344 | 47 ms, 42,093 | 5 ms, 341 |
| "housing", 4 October 2021 | 50 ms, 42,144 | 5 ms, 403 | 44 ms, 42,141 | 5 ms, 400 |
| "housing", 2020, written answers | 78 ms, 49,172 | 21 ms, 8,452 | 77 ms, 46,091 | 16 ms, 5,369 |
| "housing", 2020, person 170 | 8 ms, 609 | 5 ms, 268 | 6 ms, 609 | 4 ms, 268 |
| "housing", no dates | 41 ms, 279 | 31 ms, 279 | 9 ms, 3,962 | 9 ms, 3,962 |

Through the API with the response cache cleared, warm medians of two passes of five: "housing" in 2020 113 to 23 ms, newest first 92 to 34, oldest first 150 to 26, "government" in 2020 331 to 49, "sir" in 1975 272 to 54; the count inside the first fell from 34 to 4.5 ms. The first request after a start went from 510 to 128 ms for "housing" in 2020 and from 1,108 to 106 ms for "government". These are warm local timings. Whether this caused the production timeout on a year range is not confirmed; that waits for a deploy and a run of these statements on production.

The count for "housing" in 2020, scratch copy, third run, not yet captured on production. The statement as the API sends it (the dates bound `$2::DATE` and `$3::DATE`, the 1001 as a parameter), then the plan before the change:

```sql
-- speech_count, date range (GET /search/speeches?q=housing&date_from=2020-01-01&date_to=2020-12-31), before
SELECT count(*) AS count_1 FROM (SELECT speech.id AS id FROM speech JOIN report ON report.id = speech.report_id WHERE (speech.transcript_tsv @@ websearch_to_tsquery('english', $1::VARCHAR)) AND speech.sitting_date >= $2::DATE AND speech.sitting_date < $3::DATE LIMIT $4::INTEGER) AS anon_1;
```

```text
Aggregate  (cost=44260.43..44260.44 rows=1 width=8) (actual time=42.436..42.437 rows=1 loops=1)
  Buffers: shared hit=36873
  ->  Limit  (cost=471.72..44247.92 rows=1001 width=4) (actual time=14.259..42.392 rows=1001 loops=1)
        Buffers: shared hit=36873
        ->  Nested Loop  (cost=471.72..105298.44 rows=2397 width=4) (actual time=14.258..42.335 rows=1001 loops=1)
              Buffers: shared hit=36873
              ->  Bitmap Heap Scan on speech  (cost=471.43..100633.37 rows=2397 width=4) (actual time=14.242..41.655 rows=1001 loops=1)
                    Recheck Cond: (transcript_tsv @@ '''hous'''::tsquery)
                    Filter: ((sitting_date >= '2020-01-01'::date) AND (sitting_date < '2021-01-01'::date))
                    Rows Removed by Filter: 53531
                    Heap Blocks: exact=34542
                    Buffers: shared hit=34562
                    ->  Bitmap Index Scan on ix_speech_transcript_tsv  (cost=0.00..470.83 rows=70124 width=0) (actual time=5.633..5.634 rows=67018 loops=1)
                          Index Cond: (transcript_tsv @@ '''hous'''::tsquery)
                          Buffers: shared hit=20
              ->  Index Only Scan using report_pkey on report  (cost=0.29..1.95 rows=1 width=4) (actual time=0.001..0.001 rows=1 loops=1001)
                    Index Cond: (id = speech.report_id)
                    Heap Fetches: 308
                    Buffers: shared hit=2311
Planning:
  Buffers: shared hit=19
Planning Time: 0.210 ms
Execution Time: 42.456 ms
```

After the change the bounds are `$2::TIMESTAMP WITHOUT TIME ZONE` and `$3::TIMESTAMP WITHOUT TIME ZONE`. With the values written in, and without the join to `report`, which went later the same day (see "Ranking cost"):

```sql
-- speech_count, date range, after
SELECT count(*) AS count_1 FROM (SELECT speech.id AS id FROM speech WHERE speech.report_id IS NOT NULL AND (speech.transcript_tsv @@ websearch_to_tsquery('english', 'housing')) AND speech.sitting_date >= '2020-01-01 00:00:00' AND speech.sitting_date < '2021-01-01 00:00:00' LIMIT 1001) AS anon_1;
```

```text
Aggregate  (cost=3638.89..3638.90 rows=1 width=8) (actual time=3.884..3.885 rows=1 loops=1)
  Buffers: shared hit=889
  ->  Limit  (cost=93.83..3626.38 rows=1001 width=4) (actual time=3.362..3.848 rows=1001 loops=1)
        Buffers: shared hit=889
        ->  Bitmap Heap Scan on speech  (cost=93.83..8552.89 rows=2397 width=4) (actual time=3.361..3.796 rows=1001 loops=1)
              Recheck Cond: ((transcript_tsv @@ '''hous'''::tsquery) AND (sitting_date >= '2020-01-01 00:00:00'::timestamp without time zone) AND (sitting_date < '2021-01-01 00:00:00'::timestamp without time zone))
              Filter: (report_id IS NOT NULL)
              Heap Blocks: exact=754
              Buffers: shared hit=889
              ->  Bitmap Index Scan on ix_speech_transcript_tsv_sitting_date_rum  (cost=0.00..93.23 rows=2397 width=0) (actual time=3.285..3.285 rows=1395 loops=1)
                    Index Cond: ((transcript_tsv @@ '''hous'''::tsquery) AND (sitting_date >= '2020-01-01 00:00:00'::timestamp without time zone) AND (sitting_date < '2021-01-01 00:00:00'::timestamp without time zone))
                    Buffers: shared hit=96
Planning:
  Buffers: shared hit=3
Planning Time: 0.108 ms
Execution Time: 3.898 ms
```

## Queries the GIN index cannot serve

A negation-only query, such as `-coe`, makes `websearch_to_tsquery` produce a query whose `querytree` is `T` (match everything). A GIN index cannot answer that, so the planner falls back to a sequential scan of `speech` or `report`. No index fixes this, and the API does not work around it (ADR 0003). The empty state tells the reader that common words are ignored.

## Deliberately not indexed

- `sitting` has 1,719 rows. A sequential scan is cheap, and `sitting_pkey` already serves the joins.
- `report.report_id` is already unique-indexed.
- `speaker.person_id` is already indexed.
- `speaker` for `GET /people` has 1,434 rows, so the filter by parliament and `ILIKE` on name scans the table at negligible cost. A leading-wildcard `ILIKE` could not use a B-tree anyway.
- `attendance.location_name` for the `constituency` filter of `GET /people`, which keeps the Memberships whose id is in `SELECT speaker_id FROM attendance WHERE location_name ILIKE '%x%'`. `attendance` has about 140,000 rows, and a leading-wildcard `ILIKE` could not use a B-tree. Not timed.
- `report.parliament_number` on its own, for `GET /sittings`. The service runs three group-by statements of the shape below (volume, sitting number and report count per date), each a scan of `report` filtered by Parliament. `ix_report_sitting_date_parliament_number` serves them as an index-only scan, and no separate index on `parliament_number` is listed.

```sql
-- sittings_by_parliament (GET /sittings)
SELECT report.sitting_date, count(*) AS count_1  FROM report  WHERE report.parliament_number = 8 GROUP BY report.sitting_date ORDER BY report.sitting_date;
```

```text
-- sittings_by_parliament (GET /sittings)
GroupAggregate  (cost=0.29..400.29 rows=1182 width=16)
  Group Key: sitting_date
  ->  Index Only Scan using ix_report_sitting_date_parliament_number on report  (cost=0.29..378.60 rows=1973 width=8)
        Index Cond: (parliament_number = 8)
```

The `memberships_filtered` statement and its plan:

```sql
-- memberships_filtered (GET /people)
SELECT speaker.id, speaker.name, speaker.party, speaker.parliament_number, speaker.is_legislative_assembly, speaker.is_member, speaker.person_id  FROM speaker  WHERE speaker.parliament_number = 9 AND speaker.name ILIKE '%%tan%%' ESCAPE '\';
```

```text
-- memberships_filtered (GET /people)
Seq Scan on speaker  (cost=0.00..51.51 rows=7 width=51)
  Filter: (((name)::text ~~* '%%tan%%'::text) AND (parliament_number = 9))
```
