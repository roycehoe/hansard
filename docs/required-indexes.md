# Required indexes

The API is read-only (ADR 0001) and cannot create indexes. ADR 0003 gives the scraper ownership of every index the API relies on, as Alembic migrations. This file lists them: nine indexes and the `rum` extension, each with the exact definition, the endpoints that need it, the SQL the API sends, and the plan Postgres chooses for that SQL on the production database. A tenth index, `ix_speech_transcript_fts`, still exists, but no API statement uses it. The ninth, `ix_speech_transcript_tsv_sitting_date_rum`, reads the column `speech.sitting_date`. Scraper migration `c93f77e499cc` adds both, and neither is on production yet; see its section below. The SQL was captured by compiling each SQLModel statement from `api/crud/` with the Postgres dialect and literal parameters. The plans dated 14 October 2026 are plain `EXPLAIN`s taken read-only after the indexes were built, so no query was executed. The speech word search changed on 17 and 18 October 2026, and its date order changes again with the sitting-date index; "Ranking cost" holds its order clauses and timings.

Every index here except `ix_speech_transcript_tsv_sitting_date_rum` exists and is valid on production, and `alembic check` is clean against production. The scraper declares each one on its SQLModel classes. Three migrations built them:

- Scraper commit `b15908a` (`feat: add the indexes the read API relies on`, Alembic revision `e5a9c3b7d216`) created seven on 14 October 2026, from 11:01 to 11:07 SGT (392 seconds in total).
- Commit `c4b6aa2` (revision `f2b8d4a6c913`) added the stored column `speech.transcript_tsv` and `ix_speech_transcript_tsv`. Production took the upgrade on 17 October from 13:44 to 14:00 SGT, together with the attendance constraint (23 minutes; the column rewrites `speech`).
- Commit `489882e` (revision `50505c58da5d`, after `641870b78b3f`) created the `rum` extension and `ix_speech_transcript_tsv_rum`, then ran `ANALYZE speech`. Production took it on 18 October 2026 from 08:00:34 to 08:04:26 SGT (3 minutes 52 seconds). The index is valid at 222 MB, on `rum` 1.3 (DigitalOcean Postgres 17).

| Index | Table | Size on production |
|---|---|---|
| `ix_speech_report_id` | `speech` | 8152 kB |
| `ix_speech_speaker_id` | `speech` | 7480 kB |
| `ix_attendance_sitting_id` | `attendance` | 944 kB |
| `ix_attendance_speaker_id` | `attendance` | 952 kB |
| `ix_report_sitting_date_parliament_number` | `report` | 352 kB |
| `ix_report_title_fts` | `report` | 1768 kB |
| `ix_speech_transcript_fts` (not used by the API) | `speech` | 92 MB |
| `ix_speech_transcript_tsv` | `speech` | 94 MB on the rehearsal copy, not read on production |
| `ix_speech_transcript_tsv_rum` | `speech` | 222 MB |
| `ix_speech_transcript_tsv_sitting_date_rum` | `speech` | 411 MB on a clone, not on production yet |

The API no longer waits on any listed index. B1 and B2 are verified: on 14 October 2026 `GET /search/speeches` answered 200 with results against production for "housing estate" and for "housing" filtered to person 149. Two limits remain, both in the "Ranking cost" section. Relevance search takes 0.1 to 6.3 s on production in every shape tested, against the 300 ms target. Oldest-first search on one of the ten most common words can pass the 30-second timeout and answer `503 search.timed_out`, until the sitting-date index ships.

Facts that apply to every plan below:

- Besides these indexes, the tables keep their primary keys, `report.report_id` (unique) and `speaker.person_id`.
- `speech` holds about 1.07 million rows and `report` 41,809 on 14 October 2026.
- The database default text search configuration is `simple`. The API names `english` explicitly as a SQL literal (`literal_column("'english'")` in `api/crud/text_search.py`). A report title query compiles to `to_tsvector('english', title)`, and `ix_report_title_fts` names `english` too, or the planner would not match the expression. Speech search no longer builds the vector. It reads the stored column `speech.transcript_tsv`, which holds `to_tsvector('english'::regconfig, transcript)`, so only the query side, `websearch_to_tsquery('english', ...)`, names `english`.
- The API sets a 30-second statement timeout. Before the GIN index existed, the speech full-text query exceeded it on the shared database, so `GET /search/speeches` answered `503 search.timed_out`. Run once through psql with no timeout on 13 October 2026, the relevance-sorted speech query for "housing estate" in Parliament 8 took 394 seconds.
- Production analysed `speech` on 18 October 2026, as the last step of the rum migration. Until then `transcript_tsv` had no statistics: production held no `pg_stats` row for it, and the last autoanalyse ran on 16 October, before the column existed. The plans dated 14 October were taken earlier still, and their full-text row estimates are far too low (27 estimated against 4,822 matches for "housing estate").

## ix_speech_report_id

```sql
CREATE INDEX ix_speech_report_id ON speech (report_id);
```

Needed by `GET /reports/{report_slug}` and `GET /people/{person_id}/reports`. `GET /search/speeches` also joins `speech` to `report` on this column. `GET /coverage`, `GET /parliaments`, `GET /sittings/{sitting_date}` and `GET /search/reports` decide whether a Report has text with an `EXISTS` on `speech.report_id`, one index probe per Report.

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

```sql
-- person_reports (GET /people/{person_id}/reports)
SELECT anon_1.report_id, anon_1.speech_count  FROM (SELECT speech.report_id AS report_id, count(*) AS speech_count  FROM speech  WHERE speech.speaker_id IN (1349) GROUP BY speech.report_id) AS anon_1 JOIN report ON report.id = anon_1.report_id ORDER BY report.sitting_date DESC, report.speech_number DESC   LIMIT 21 OFFSET 0;
```

```text
-- person_reports (GET /people/{person_id}/reports)
Limit  (cost=9805.56..9805.61 rows=21 width=24)
  ->  Sort  (cost=9805.56..9817.65 rows=4836 width=24)
        Sort Key: report.sitting_date DESC, report.speech_number DESC
        ->  Nested Loop  (cost=4492.03..9675.17 rows=4836 width=24)
              ->  HashAggregate  (cost=4491.74..4540.10 rows=4836 width=12)
                    Group Key: speech.report_id
                    ->  Index Scan using ix_speech_speaker_id on speech  (cost=0.43..4460.39 rows=6270 width=4)
                          Index Cond: (speaker_id = 1349)
              ->  Index Scan using report_pkey on report  (cost=0.29..1.06 rows=1 width=16)
                    Index Cond: (id = speech.report_id)
```

## ix_speech_speaker_id

```sql
CREATE INDEX ix_speech_speaker_id ON speech (speaker_id);
```

Needed by `GET /people/{person_id}`, `GET /people/{person_id}/reports` and `GET /search/speeches` when `person_id` is given, with or without search words.

Both statements filter `speech.speaker_id`. Before the index existed each scanned the whole table. `person_reports` appears again here because it needs this index as well as `ix_speech_report_id`.

```sql
-- speech_counts_by_parliament (GET /people/{person_id})
SELECT report.parliament_number, count(*) AS count_1  FROM speech JOIN report ON report.id = speech.report_id  WHERE speech.speaker_id IN (1349) GROUP BY report.parliament_number;
```

```text
-- speech_counts_by_parliament (GET /people/{person_id})
Finalize GroupAggregate  (cost=10130.81..10134.61 rows=15 width=12)
  Group Key: report.parliament_number
  ->  Gather Merge  (cost=10130.81..10134.31 rows=30 width=12)
        Workers Planned: 2
        ->  Sort  (cost=9130.78..9130.82 rows=15 width=12)
              Sort Key: report.parliament_number
              ->  Partial HashAggregate  (cost=9130.34..9130.49 rows=15 width=12)
                    Group Key: report.parliament_number
                    ->  Nested Loop  (cost=55.31..9117.28 rows=2612 width=4)
                          ->  Parallel Bitmap Heap Scan on speech  (cost=55.02..6123.68 rows=2612 width=4)
                                Recheck Cond: (speaker_id = 1349)
                                ->  Bitmap Index Scan on ix_speech_speaker_id  (cost=0.00..53.45 rows=6270 width=0)
                                      Index Cond: (speaker_id = 1349)
                          ->  Index Scan using report_pkey on report  (cost=0.29..1.15 rows=1 width=8)
                                Index Cond: (id = speech.report_id)
```

```sql
-- person_reports (GET /people/{person_id}/reports)
SELECT anon_1.report_id, anon_1.speech_count  FROM (SELECT speech.report_id AS report_id, count(*) AS speech_count  FROM speech  WHERE speech.speaker_id IN (1349) GROUP BY speech.report_id) AS anon_1 JOIN report ON report.id = anon_1.report_id ORDER BY report.sitting_date DESC, report.speech_number DESC   LIMIT 21 OFFSET 0;
```

```text
-- person_reports (GET /people/{person_id}/reports)
Limit  (cost=9805.56..9805.61 rows=21 width=24)
  ->  Sort  (cost=9805.56..9817.65 rows=4836 width=24)
        Sort Key: report.sitting_date DESC, report.speech_number DESC
        ->  Nested Loop  (cost=4492.03..9675.17 rows=4836 width=24)
              ->  HashAggregate  (cost=4491.74..4540.10 rows=4836 width=12)
                    Group Key: speech.report_id
                    ->  Index Scan using ix_speech_speaker_id on speech  (cost=0.43..4460.39 rows=6270 width=4)
                          Index Cond: (speaker_id = 1349)
              ->  Index Scan using report_pkey on report  (cost=0.29..1.06 rows=1 width=16)
                    Index Cond: (id = speech.report_id)
```

`GET /search/speeches` with a `person_id` and no search words also uses this index. The statement filters `speech.speaker_id`, keeps the Parliament, date and report type filters through the join to `report`, and orders by sitting date newest first, then `speech.id`. The sitting date sort key is a scalar subquery on `report` and not the joined column, because with the joined column the planner walks `ix_report_sitting_date_parliament_number` backward and filters speeches one at a time: 9.2 seconds for person 29 against 127 ms for the subquery form on 14 October 2026. `EXPLAIN (ANALYZE, BUFFERS)` on production, warm, third run, for person 29 (12 Memberships, 13,135 speeches), page 1:

```sql
-- speech_search_filters_person (GET /search/speeches?person_id=29)
SELECT speech.id, speech.ordinal, speech.speaker, speech.transcript, speech.report_id, speech.speaker_id  FROM speech JOIN report ON report.id = speech.report_id  WHERE speech.speaker_id IN (30, 91, 158, 229, 308, 382, 462, 552, 644, 743, 846, 956) ORDER BY (SELECT report_1.sitting_date  FROM report AS report_1  WHERE report_1.id = speech.report_id) DESC, speech.id  LIMIT 21 OFFSET 0;
```

```text
-- speech_search_filters_person (GET /search/speeches?person_id=29)
Limit  (cost=48756.35..48756.40 rows=21 width=412) (actual time=123.973..123.984 rows=21 loops=1)
  ->  Sort  (cost=48756.35..48795.68 rows=15733 width=412) (actual time=123.971..123.978 rows=21 loops=1)
        Sort Key: ((SubPlan 1)) DESC, speech.id
        Sort Method: top-N heapsort  Memory: 48kB
        ->  Hash Join  (cost=1341.48..48332.16 rows=15733 width=412) (actual time=26.702..113.932 rows=13135 loops=1)
              Hash Cond: (speech.report_id = report.id)
              ->  Index Scan using ix_speech_speaker_id on speech  (cost=0.43..10645.92 rows=15733 width=404) (actual time=0.020..19.313 rows=13135 loops=1)
                    Index Cond: (speaker_id = ANY ('{30,91,158,229,308,382,462,552,644,743,846,956}'::integer[]))
              ->  Hash  (cost=818.41..818.41 rows=41811 width=4) (actual time=26.489..26.490 rows=41811 loops=1)
                    ->  Index Only Scan using report_pkey on report  (cost=0.29..818.41 rows=41811 width=4) (actual time=0.014..10.335 rows=41811 loops=1)
              SubPlan 1
                ->  Index Scan using report_pkey on report report_1  (cost=0.29..2.31 rows=1 width=8) (actual time=0.003..0.004 rows=1 loops=13135)
Execution Time: 124.095 ms
```

The same statement measured, warm, third run: page 50 (`OFFSET 980`) 144 ms, person 568 (39 speeches) 1.3 ms, person 29 with Parliament 5 (`report.parliament_number = 5` added) 19 ms. Every one reads the person's speeches through `ix_speech_speaker_id` and keeps the top 21 in a heap sort.

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
CREATE INDEX ix_attendance_speaker_id ON attendance (speaker_id);
```

Needed by `GET /people/{person_id}`.

```sql
-- attendance_counts_by_parliament (GET /people/{person_id})
SELECT anon_1.parliament_number, count(*) AS count_1  FROM attendance JOIN sitting ON sitting.id = attendance.sitting_id JOIN (SELECT DISTINCT report.sitting_date AS sitting_date, report.parliament_number AS parliament_number  FROM report) AS anon_1 ON CAST(anon_1.sitting_date AS DATE) = to_date(sitting.sitting_date, 'DD-MM-YYYY')  WHERE attendance.speaker_id IN (1349) AND attendance.is_present IS true GROUP BY anon_1.parliament_number;
```

```text
-- attendance_counts_by_parliament (GET /people/{person_id})
HashAggregate  (cost=1288.94..1290.94 rows=200 width=12)
  Group Key: report.parliament_number
  ->  Hash Join  (cost=186.06..1279.84 rows=1819 width=4)
        Hash Cond: ((report.sitting_date)::date = to_date((sitting.sitting_date)::text, 'DD-MM-YYYY'::text))
        ->  Unique  (cost=0.29..882.51 rows=4181 width=12)
              ->  Index Only Scan using ix_report_sitting_date_parliament_number on report  (cost=0.29..673.45 rows=41811 width=12)
        ->  Hash  (cost=184.69..184.69 rows=87 width=9)
              ->  Nested Loop  (cost=0.57..184.69 rows=87 width=9)
                    ->  Index Scan using ix_attendance_speaker_id on attendance  (cost=0.29..85.02 rows=87 width=4)
                          Index Cond: (speaker_id = 1349)
                          Filter: (is_present IS TRUE)
                    ->  Index Scan using sitting_pkey on sitting  (cost=0.28..1.15 rows=1 width=13)
                          Index Cond: (id = attendance.sitting_id)
```

## ix_report_sitting_date_parliament_number

```sql
CREATE INDEX ix_report_sitting_date_parliament_number ON report (sitting_date, parliament_number);
```

Needed by `GET /sittings/{sitting_date}`, `GET /sittings`, `GET /parliaments`, `GET /coverage`, `GET /people/{person_id}` (the attendance counts by Parliament) and the date filters and newest-first order of `GET /search/reports`, and of `GET /search/speeches` without search words. With search words, a date-ordered speech search reads it only for a Parliament's first and last sitting dates; the dates themselves filter `speech.sitting_date` (see `ix_speech_transcript_tsv_sitting_date_rum`).

The first version of this list named a single-column index on `report (sitting_date)`. The scraper builds this composite instead. On the rehearsal copy it served every statement the single column served. It also turned the per-Parliament statements (the Parliament list, the sittings list, the `DISTINCT sitting_date, parliament_number` subquery under the attendance counts) into index-only scans of 44 pages instead of 6,309 heap pages. On production a heap scan of `report` costs 0.4 to 1.4 seconds per statement, so that is the larger gain. A `(parliament_number, sitting_date)` index served fewer statements and was no better on any of them. The composite is 352 kB.

The date-filtered title search is repeated under `ix_report_title_fts`, because the text predicate decides its plan. The speech word search under a date range is in "Ranking cost".

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
SELECT report.id, report.volume_number, report.parliament_number, report.sitting_number, report.sitting_date, report.speech_number, report.title, report.subtitle, report.report_id, report.report_type, report.html_file_name, report.report_version  FROM report  WHERE (to_tsvector('english', report.title) @@ websearch_to_tsquery('english', 'housing estate')) AND report.parliament_number = 14 ORDER BY report.sitting_date DESC, ts_rank(to_tsvector('english', report.title), websearch_to_tsquery('english', 'housing estate')) DESC, report.id   LIMIT 21 OFFSET 0;
```

```text
-- title_search_date (GET /search/reports)
Limit  (cost=8.05..8.06 rows=1 width=194)
  ->  Sort  (cost=8.05..8.06 rows=1 width=194)
        Sort Key: sitting_date DESC, (ts_rank(to_tsvector('english'::regconfig, (title)::text), '''hous'' & ''estat'''::tsquery)) DESC, id
        ->  Bitmap Heap Scan on report  (cost=6.53..8.04 rows=1 width=194)
              Recheck Cond: (to_tsvector('english'::regconfig, (title)::text) @@ '''hous'' & ''estat'''::tsquery)
              Filter: (parliament_number = 14)
              ->  Bitmap Index Scan on ix_report_title_fts  (cost=0.00..6.53 rows=1 width=0)
                    Index Cond: (to_tsvector('english'::regconfig, (title)::text) @@ '''hous'' & ''estat'''::tsquery)
```

`GET /search/speeches` without search words and without a `person_id`, and `GET /search/reports` without search words, order by `report.sitting_date` descending and filter by the Parliament, dates and report type. The planner walks this index backward and stops after the first few reports, so a page costs about 1 ms. These statements use the joined `report.sitting_date` as the sort key. The scalar subquery form that the person shape needs took 480 ms for Parliament 9 on 14 October 2026. `EXPLAIN (ANALYZE, BUFFERS)` on production, warm, third run:

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

## ix_speech_transcript_fts

```sql
CREATE INDEX ix_speech_transcript_fts ON speech USING gin (to_tsvector('english', transcript));
```

Kept, and no API statement uses it. It indexes the same vector as `transcript_tsv`, so it duplicates `ix_speech_transcript_tsv`. Scraper commit `b15908a` built it for `GET /search/speeches` (B1, B2). Since API commit `49ebfad` (17 October 2026) the speech statements filter the stored column `transcript_tsv` and never write `to_tsvector('english', transcript)`, so the planner cannot match this expression. The index takes 92 MB, and every insert, delete and update of `transcript` on `speech` still maintains it. The scraper still declares it on `Speech`.

## ix_speech_transcript_tsv

```sql
ALTER TABLE speech ADD COLUMN transcript_tsv tsvector
    GENERATED ALWAYS AS (to_tsvector('english'::regconfig, transcript)) STORED;
CREATE INDEX ix_speech_transcript_tsv ON speech USING gin (transcript_tsv);
```

Needed by `GET /search/speeches` with search words, and by its match count. The statements filter `transcript_tsv @@ websearch_to_tsquery('english', ...)`. Scraper commit `c4b6aa2`, revision `f2b8d4a6c913`. The API has read the column since commit `49ebfad`.

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

Needed by `GET /search/speeches` with search words, sorted by relevance. The statement orders by `transcript_tsv <=> websearch_to_tsquery('english', ...)`. A rum index returns matches in that distance order, so the first page reads a few hundred buffers and the planner never ranks the rest. On a clone set like production, "government" read 136,400 buffers with `ts_rank` and about 410 with the rum index (0.24 to 0.34 s warm against 0.09 s). Production timings are in "Ranking cost". Scraper commit `489882e`, revision `50505c58da5d`.

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

Not on production yet. Needed by `GET /search/speeches` with search words, sorted oldest first or newest first, and by its match count under a date range. The index stores each match's sitting date in place of the word positions, so it returns the matches of a query in order of distance from a date. The API orders oldest first by `speech.sitting_date |=> '1900-01-01'` and newest first by `speech.sitting_date <=| '2100-01-01'`, then by `speech.id`, so the first page reads a few hundred buffers however common the word is. Date filters on word search read `speech.sitting_date`. In date order a Parliament filter also adds that Parliament's first and last sitting dates as a range on it, so the index reads only that span, and the exact Parliament filter on `report` stays. Relevance and the count do not get the range: with it, relevance in Parliament 14 read 159,000 buffers against 6,500. A member filter keeps a plain sort on `speech.sitting_date`, because a member's matches are few: walking the index until 20 of theirs turn up read 57,000 buffers for person 29 against 4,400 for the sort.

The index cannot order by relevance: it holds no word positions, so `<=>` against the query is not an index order. Relevance keeps `ix_speech_transcript_tsv_rum`. The scraper's ADR 0010 records why the date is a copy on `speech` and how the copy is kept in step.

The API's `Speech` model reads `speech.sitting_date`, so the API must not deploy before migration `c93f77e499cc` has run on production: every statement that selects a speech would fail on the missing column.

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

## ix_report_title_fts

```sql
CREATE INDEX ix_report_title_fts ON report USING gin (to_tsvector('english', title));
```

Needed by `GET /search/reports` (B1).

The title query was cheap before the index existed (about a second) but scanned the whole table. It now uses the same kind of expression index.

```sql
-- title_search_relevance (GET /search/reports)
SELECT report.id, report.volume_number, report.parliament_number, report.sitting_number, report.sitting_date, report.speech_number, report.title, report.subtitle, report.report_id, report.report_type, report.html_file_name, report.report_version  FROM report  WHERE to_tsvector('english', report.title) @@ websearch_to_tsquery('english', 'housing estate') ORDER BY ts_rank(to_tsvector('english', report.title), websearch_to_tsquery('english', 'housing estate')) DESC, report.sitting_date DESC, report.id   LIMIT 21 OFFSET 0;
```

```text
-- title_search_relevance (GET /search/reports)
Limit  (cost=8.05..8.06 rows=1 width=194)
  ->  Sort  (cost=8.05..8.06 rows=1 width=194)
        Sort Key: (ts_rank(to_tsvector('english'::regconfig, (title)::text), '''hous'' & ''estat'''::tsquery)) DESC, sitting_date DESC, id
        ->  Bitmap Heap Scan on report  (cost=6.53..8.04 rows=1 width=194)
              Recheck Cond: (to_tsvector('english'::regconfig, (title)::text) @@ '''hous'' & ''estat'''::tsquery)
              ->  Bitmap Index Scan on ix_report_title_fts  (cost=0.00..6.53 rows=1 width=0)
                    Index Cond: (to_tsvector('english'::regconfig, (title)::text) @@ '''hous'' & ''estat'''::tsquery)
```

```sql
-- title_search_date (GET /search/reports)
SELECT report.id, report.volume_number, report.parliament_number, report.sitting_number, report.sitting_date, report.speech_number, report.title, report.subtitle, report.report_id, report.report_type, report.html_file_name, report.report_version  FROM report  WHERE (to_tsvector('english', report.title) @@ websearch_to_tsquery('english', 'housing estate')) AND report.parliament_number = 14 ORDER BY report.sitting_date DESC, ts_rank(to_tsvector('english', report.title), websearch_to_tsquery('english', 'housing estate')) DESC, report.id   LIMIT 21 OFFSET 0;
```

```text
-- title_search_date (GET /search/reports)
Limit  (cost=8.05..8.06 rows=1 width=194)
  ->  Sort  (cost=8.05..8.06 rows=1 width=194)
        Sort Key: sitting_date DESC, (ts_rank(to_tsvector('english'::regconfig, (title)::text), '''hous'' & ''estat'''::tsquery)) DESC, id
        ->  Bitmap Heap Scan on report  (cost=6.53..8.04 rows=1 width=194)
              Recheck Cond: (to_tsvector('english'::regconfig, (title)::text) @@ '''hous'' & ''estat'''::tsquery)
              Filter: (parliament_number = 14)
              ->  Bitmap Index Scan on ix_report_title_fts  (cost=0.00..6.53 rows=1 width=0)
                    Index Cond: (to_tsvector('english'::regconfig, (title)::text) @@ '''hous'' & ''estat'''::tsquery)
```

## Ranking cost

Speech word search used to rank every match. `ts_rank` recomputed `to_tsvector('english', transcript)` for each matched row. On 14 October 2026, timed through a local API against production, "housing estate" (4,822 matches) took 1.5 to 1.8 s, "housing" with a person filter took 2.1 to 2.4 s, and "government" (137,785 matches) answered `503 search.timed_out`. The 17 October audit found "government" by relevance over 30 s in three of three runs, and by date at 12.9 s and 26.8 s.

Three commits changed that: the stored column (`49ebfad`, 17 October), the rum index with its `ANALYZE` (`489882e`, 18 October) and the order clauses below (`90f8ba0`, 18 October). `ts_rank` is gone from speech search. Report title search still uses it, and the title plans above stand.

The `ORDER BY` clauses of `GET /search/speeches` with search words, from `api/crud/speech.py`. The date orders need `ix_speech_transcript_tsv_sitting_date_rum`. Until it ships, production matches the clauses of `613c795`, which are in the "Newest first" and "Oldest first" paragraphs below:

```sql
-- relevance
ORDER BY speech.transcript_tsv <=> websearch_to_tsquery('english', 'government'), (SELECT report_1.sitting_date  FROM report AS report_1  WHERE report_1.id = speech.report_id) DESC, speech.id

-- relevance, with a date range
ORDER BY (speech.transcript_tsv <=> websearch_to_tsquery('english', 'government')) + 0, (SELECT report_1.sitting_date  FROM report AS report_1  WHERE report_1.id = speech.report_id) DESC, speech.id

-- newest first
ORDER BY speech.sitting_date <=| '2100-01-01 00:00:00', speech.id

-- oldest first
ORDER BY speech.sitting_date |=> '1900-01-01 00:00:00', speech.id

-- newest first with a member filter (ASC for oldest first)
ORDER BY speech.sitting_date DESC, speech.id
```

Relevance. The rum index returns matches in `<=>` order, so the planner stops after the first page. Under a date range that scan would walk matches in rank order until 20 pass the filter: 3.88 s and 35,400 buffers for "government" in 1975 on the clone, against 0.03 s and 3,000 buffers from the report date index. Adding zero hides the order from the rum index. At `613c795` the planner then started from `ix_report_sitting_date_parliament_number`; with the date filter on `speech.sitting_date` it reads the range from `ix_speech_transcript_tsv_sitting_date_rum` and ranks only the matches in it: 4,022 buffers and 0.03 s on the clone.

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

Residual. Oldest first on one of the ten or so lexemes found in more than 11% of speeches (sir, also, singapor, mr, would, minist, govern, year, time, member, from the production statistics) can pass the 30-second timeout. "government" took 34.7 s, and the API answers such a search with its timed-out message (`503 search.timed_out`). The change picked the shape that fails on the rarer case. The fix for both is the sitting date on the `speech` row and `ix_speech_transcript_tsv_sitting_date_rum`, with the order clauses above. On a clone it took "government" oldest first from 43.5 s to 0.16 s. It is a schema change and a write to production, and it has not shipped yet.

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

The planner expected 16,993 speeches for these memberships (13,345 real), so it joined to `report` with a hash join over a full sequential scan (183 ms, 4,010 pages read from disk) instead of 13,345 primary-key lookups. The speech side takes 12.6 ms. The other statements of the endpoint take under 30 ms each.

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

## Queries the GIN index cannot serve

A negation-only query, such as `-coe`, makes `websearch_to_tsquery` produce a query whose `querytree` is `T` (match everything). A GIN index cannot answer that, so the planner falls back to a sequential scan of `speech` or `report`. No index fixes this, and the API does not work around it (ADR 0003). The empty state tells the reader that common words are ignored.

## Deliberately not indexed

- `sitting` has 1,719 rows. A sequential scan is cheap, and `sitting_pkey` already serves the joins.
- `report.report_id` is already unique-indexed.
- `speaker.person_id` is already indexed.
- `speaker` for `GET /people` has 1,434 rows, so the filter by parliament and `ILIKE` on name scans the table at negligible cost. A leading-wildcard `ILIKE` could not use a B-tree anyway.
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
