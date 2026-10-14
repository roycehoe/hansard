# Required indexes

The API is read-only (ADR 0001) and cannot create indexes. ADR 0003 gives the scraper ownership of every index the API relies on, as Alembic migrations. This file lists them: seven indexes, each with the exact definition, the endpoints that need it, the SQL the API sends, and the plan Postgres chooses for that SQL on the production database. The SQL was captured by compiling each SQLModel statement from `api/crud/` with the Postgres dialect and literal parameters. Every plan is a plain `EXPLAIN` taken read-only on 14 October 2026, after the indexes were built, so no query was executed.

All seven indexes exist and are valid on production. The scraper's commit `b15908a` (`feat: add the indexes the read API relies on`, Alembic revision `e5a9c3b7d216`) created them on 14 October 2026, from 11:01 to 11:07 SGT (392 seconds in total), and `alembic check` is clean against production. The scraper declares each one on its SQLModel classes.

| Index | Table | Size on production |
|---|---|---|
| `ix_speech_report_id` | `speech` | 8152 kB |
| `ix_speech_speaker_id` | `speech` | 7480 kB |
| `ix_attendance_sitting_id` | `attendance` | 944 kB |
| `ix_attendance_speaker_id` | `attendance` | 952 kB |
| `ix_report_sitting_date_parliament_number` | `report` | 352 kB |
| `ix_report_title_fts` | `report` | 1768 kB |
| `ix_speech_transcript_fts` | `speech` | 92 MB |

The API no longer waits on any listed index. B1 and B2 are verified: on 14 October 2026 `GET /search/speeches` answered 200 with results against production for "housing estate" and for "housing" filtered to person 149. Two limits remain, both in the "Ranking cost" section: a common term such as "government" still answers `503 search.timed_out`, and several speech searches take more than 300 ms.

Facts that apply to every plan below:

- Besides the seven indexes, the tables keep their primary keys, `report.report_id` (unique) and `speaker.person_id`.
- `speech` holds about 1.07 million rows and `report` 41,809 on 14 October 2026.
- The database default text search configuration is `simple`. The API names `english` explicitly as a SQL literal (`literal_column("'english'")` in `api/crud/text_search.py`), so the query compiles to `to_tsvector('english', transcript)`. The index names `english` too, or the planner would not match the expression.
- The API sets a 30-second statement timeout. Before the GIN index existed, the speech full-text query exceeded it on the shared database, so `GET /search/speeches` answered `503 search.timed_out`. Run once through psql with no timeout on 13 October 2026, the relevance-sorted speech query for "housing estate" in Parliament 8 took 394 seconds.
- Production has not analysed `speech` or `report` since the indexes were built, so the planner has no statistics for the two GIN expressions. Its row estimates for full-text predicates are far too low (27 estimated against 4,822 matches for "housing estate"). The plans below show those estimates.

## ix_speech_report_id

```sql
CREATE INDEX ix_speech_report_id ON speech (report_id);
```

Needed by `GET /reports/{report_slug}` and `GET /people/{person_id}/reports`. `GET /search/speeches` also joins `speech` to `report` on this column.

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

Needed by `GET /people/{person_id}`, `GET /people/{person_id}/reports` and `GET /search/speeches` when `person_id` is given.

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

Needed by `GET /sittings/{sitting_date}`, `GET /sittings`, `GET /parliaments`, `GET /coverage`, `GET /people/{person_id}` (the attendance counts by Parliament) and the date filters on `GET /search/speeches` and `GET /search/reports`.

The first version of this list named a single-column index on `report (sitting_date)`. The scraper builds this composite instead. On the rehearsal copy it served every statement the single column served. It also turned the per-Parliament statements (the Parliament list, the sittings list, the `DISTINCT sitting_date, parliament_number` subquery under the attendance counts) into index-only scans of 44 pages instead of 6,309 heap pages. On production a heap scan of `report` costs 0.4 to 1.4 seconds per statement, so that is the larger gain. A `(parliament_number, sitting_date)` index served fewer statements and was no better on any of them. The composite is 352 kB.

The two date-filtered search statements are repeated under the GIN index sections, because the text predicate decides their plan. With no statistics for the GIN expressions on production, the planner still applies the date filter as a per-row filter after the primary-key lookup.

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
-- speech_search_date (GET /search/speeches)
SELECT speech.id, speech.ordinal, speech.speaker, speech.transcript, speech.report_id, speech.speaker_id  FROM speech JOIN report ON report.id = speech.report_id  WHERE (to_tsvector('english', speech.transcript) @@ websearch_to_tsquery('english', 'housing estate')) AND report.sitting_date >= '1993-01-01' ORDER BY (SELECT report_1.sitting_date  FROM report AS report_1  WHERE report_1.id = speech.report_id) DESC, ts_rank(to_tsvector('english', speech.transcript), websearch_to_tsquery('english', 'housing estate')) DESC, speech.id   LIMIT 21 OFFSET 0;
```

```text
-- speech_search_date (GET /search/speeches)
Limit  (cost=153.70..153.75 rows=19 width=417)
  ->  Sort  (cost=153.70..153.75 rows=19 width=417)
        Sort Key: ((SubPlan 1)) DESC, (ts_rank(to_tsvector('english'::regconfig, (speech.transcript)::text), '''hous'' & ''estat'''::tsquery)) DESC, speech.id
        ->  Nested Loop  (cost=9.49..153.30 rows=19 width=417)
              ->  Bitmap Heap Scan on speech  (cost=9.20..43.29 rows=27 width=405)
                    Recheck Cond: (to_tsvector('english'::regconfig, (transcript)::text) @@ '''hous'' & ''estat'''::tsquery)
                    ->  Bitmap Index Scan on ix_speech_transcript_fts  (cost=0.00..9.19 rows=27 width=0)
                          Index Cond: (to_tsvector('english'::regconfig, (transcript)::text) @@ '''hous'' & ''estat'''::tsquery)
              ->  Index Scan using report_pkey on report  (cost=0.29..2.27 rows=1 width=4)
                    Index Cond: (id = speech.report_id)
                    Filter: (sitting_date >= '1993-01-01 00:00:00'::timestamp without time zone)
              SubPlan 1
                ->  Index Scan using report_pkey on report report_1  (cost=0.29..2.31 rows=1 width=8)
                      Index Cond: (id = speech.report_id)
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

## ix_speech_transcript_fts

```sql
CREATE INDEX ix_speech_transcript_fts ON speech USING gin (to_tsvector('english', transcript));
```

Needed by `GET /search/speeches` (B1, B2).

The expression in the index must match the API's expression exactly: `to_tsvector('english', transcript)` with `english` as a literal.

The API orders speech results by a scalar subquery on `report.sitting_date`, so Postgres does not sort every report first. The plans show it as `SubPlan 1`, one primary-key lookup on `report` per matched speech:

```text
               SubPlan 1
                 ->  Index Scan using report_pkey on report report_1  (cost=0.29..2.31 rows=1 width=8)
                       Index Cond: (id = speech.report_id)
```

The plans below are production's current plans. Each uses the GIN index through a bitmap scan. `speech_headlines` reads at most one page of rows by primary key and needs no index of its own, but it only runs after a search has returned ids.

```sql
-- speech_search_relevance (GET /search/speeches)
SELECT speech.id, speech.ordinal, speech.speaker, speech.transcript, speech.report_id, speech.speaker_id  FROM speech JOIN report ON report.id = speech.report_id  WHERE (to_tsvector('english', speech.transcript) @@ websearch_to_tsquery('english', 'housing estate')) AND report.parliament_number = 8 ORDER BY ts_rank(to_tsvector('english', speech.transcript), websearch_to_tsquery('english', 'housing estate')) DESC, (SELECT report_1.sitting_date  FROM report AS report_1  WHERE report_1.id = speech.report_id) DESC, speech.id   LIMIT 21 OFFSET 0;
```

```text
-- speech_search_relevance (GET /search/speeches)
Limit  (cost=107.23..107.23 rows=1 width=417)
  ->  Sort  (cost=107.23..107.23 rows=1 width=417)
        Sort Key: (ts_rank(to_tsvector('english'::regconfig, (speech.transcript)::text), '''hous'' & ''estat'''::tsquery)) DESC, ((SubPlan 1)) DESC, speech.id
        ->  Nested Loop  (cost=9.49..107.22 rows=1 width=417)
              ->  Bitmap Heap Scan on speech  (cost=9.20..43.29 rows=27 width=405)
                    Recheck Cond: (to_tsvector('english'::regconfig, (transcript)::text) @@ '''hous'' & ''estat'''::tsquery)
                    ->  Bitmap Index Scan on ix_speech_transcript_fts  (cost=0.00..9.19 rows=27 width=0)
                          Index Cond: (to_tsvector('english'::regconfig, (transcript)::text) @@ '''hous'' & ''estat'''::tsquery)
              ->  Index Scan using report_pkey on report  (cost=0.29..2.27 rows=1 width=4)
                    Index Cond: (id = speech.report_id)
                    Filter: (parliament_number = 8)
              SubPlan 1
                ->  Index Scan using report_pkey on report report_1  (cost=0.29..2.31 rows=1 width=8)
                      Index Cond: (id = speech.report_id)
```

```sql
-- speech_search_date (GET /search/speeches)
SELECT speech.id, speech.ordinal, speech.speaker, speech.transcript, speech.report_id, speech.speaker_id  FROM speech JOIN report ON report.id = speech.report_id  WHERE (to_tsvector('english', speech.transcript) @@ websearch_to_tsquery('english', 'housing estate')) AND report.sitting_date >= '1993-01-01' ORDER BY (SELECT report_1.sitting_date  FROM report AS report_1  WHERE report_1.id = speech.report_id) DESC, ts_rank(to_tsvector('english', speech.transcript), websearch_to_tsquery('english', 'housing estate')) DESC, speech.id   LIMIT 21 OFFSET 0;
```

```text
-- speech_search_date (GET /search/speeches)
Limit  (cost=153.70..153.75 rows=19 width=417)
  ->  Sort  (cost=153.70..153.75 rows=19 width=417)
        Sort Key: ((SubPlan 1)) DESC, (ts_rank(to_tsvector('english'::regconfig, (speech.transcript)::text), '''hous'' & ''estat'''::tsquery)) DESC, speech.id
        ->  Nested Loop  (cost=9.49..153.30 rows=19 width=417)
              ->  Bitmap Heap Scan on speech  (cost=9.20..43.29 rows=27 width=405)
                    Recheck Cond: (to_tsvector('english'::regconfig, (transcript)::text) @@ '''hous'' & ''estat'''::tsquery)
                    ->  Bitmap Index Scan on ix_speech_transcript_fts  (cost=0.00..9.19 rows=27 width=0)
                          Index Cond: (to_tsvector('english'::regconfig, (transcript)::text) @@ '''hous'' & ''estat'''::tsquery)
              ->  Index Scan using report_pkey on report  (cost=0.29..2.27 rows=1 width=4)
                    Index Cond: (id = speech.report_id)
                    Filter: (sitting_date >= '1993-01-01 00:00:00'::timestamp without time zone)
              SubPlan 1
                ->  Index Scan using report_pkey on report report_1  (cost=0.29..2.31 rows=1 width=8)
                      Index Cond: (id = speech.report_id)
```

```sql
-- speech_headlines (GET /search/speeches)
SELECT speech.id, ts_headline('english', speech.transcript, websearch_to_tsquery('english', 'housing estate'), 'StartSel=<mark>, StopSel=</mark>, MaxWords=35, MinWords=15') AS ts_headline_1  FROM speech  WHERE speech.id IN (1, 2, 3);
```

```text
-- speech_headlines (GET /search/speeches)
Index Scan using speech_pkey on speech  (cost=0.43..7.08 rows=3 width=36)
  Index Cond: (id = ANY ('{1,2,3}'::integer[]))
```

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

`ts_rank` needs a `tsvector`, and an expression index stores none. Postgres therefore recomputes `to_tsvector('english', transcript)` for every matched row to rank it, and both sort orders use `ts_rank` as a sort key. The GIN index finds the matches quickly; ranking them is what costs time. A common word such as "government" matches 137,785 speeches, so a broad query ranks all of them before the `LIMIT 21` applies.

The brief's speed target is 300 ms warm. On 14 October 2026, with all seven indexes in place, timed through a local API against production, every endpoint met it except these:

| Request | Matches | Time | Cause |
|---|---|---|---|
| `GET /search/speeches?q=housing estate` | 4,822 | 1.5 to 1.8 s | `ts_rank` recomputes 4,822 transcript vectors (1.57 s of 1.60 s in `EXPLAIN ANALYZE`) |
| `GET /search/speeches?q=housing estate&sort=date` | 4,822 | 0.73 to 0.84 s | same ranking cost, as the second sort key |
| `GET /search/speeches?q=housing&person_id=149` | 608 of 67,059 | 2.1 to 2.4 s | lossy bitmap at `work_mem` 2MB; the recheck recomputes vectors for 12,089 rows |
| `GET /search/speeches?q=government` | 137,785 | `503 search.timed_out` after 30 s | ranking 137,785 transcripts plus a lossy bitmap |
| `GET /people/29` | | 0.30 to 0.64 s | one statement, `speech_counts_by_parliament`, plans a sequential scan of `report` |

For comparison, the same "housing estate" plan takes 300 to 480 ms on the rehearsal copy, which has the whole working set in memory. A rehearsal run of "government" at production's `work_mem` of 2MB took 6 to 8 s by relevance and 8 to 11 s by date. At 32MB the relevance query took 2.6 s, and the date sort stayed slow because it also runs the `SubPlan 1` date lookup 137,785 times. No workaround is applied, per the brief.

Missing statistics make the person-filtered search worse. Production has not analysed `speech` or `report` since the indexes were built, so the planner estimates 27 matches for "housing estate" (4,822 real) and 5,343 for "government" (137,785 real). In the person-filtered search that puts the large "housing" bitmap into the `BitmapAnd`; at 2MB it turns lossy (681 of 885 heap blocks), and the recheck recomputes `to_tsvector` for rows the speaker filter then discards. On rehearsal the same statement took 146 ms with statistics and about 480 ms without. Production takes longer than rehearsal on every ranking step, and the cause was not isolated. An `ANALYZE speech; ANALYZE report;` on production (a scraper-side action outside this run's write permission), or the next automatic analyse, should correct the row estimates.

`EXPLAIN (ANALYZE, BUFFERS)` on production, `GET /search/speeches?q=housing estate`:

```text
Limit  (cost=148.35..148.40 rows=21 width=417) (actual time=1603.404..1603.432 rows=21 loops=1)
  Buffers: shared hit=27970
  ->  Sort  (cost=148.35..148.42 rows=27 width=417) (actual time=1603.401..1603.424 rows=21 loops=1)
        Sort Key: (ts_rank(to_tsvector('english'::regconfig, (speech.transcript)::text), '''hous'' & ''estat'''::tsquery)) DESC, ((SubPlan 1)) DESC, speech.id
        Sort Method: top-N heapsort  Memory: 71kB
        Buffers: shared hit=27970
        ->  Nested Loop  (cost=9.49..147.71 rows=27 width=417) (actual time=5.263..1593.445 rows=4822 loops=1)
              Buffers: shared hit=27970
              ->  Bitmap Heap Scan on speech  (cost=9.20..43.29 rows=27 width=405) (actual time=4.930..23.829 rows=4822 loops=1)
                    Recheck Cond: (to_tsvector('english'::regconfig, (transcript)::text) @@ '''hous'' & ''estat'''::tsquery)
                    Heap Blocks: exact=3667
                    Buffers: shared hit=3705
                    ->  Bitmap Index Scan on ix_speech_transcript_fts  (cost=0.00..9.19 rows=27 width=0) (actual time=3.985..3.986 rows=4822 loops=1)
                          Index Cond: (to_tsvector('english'::regconfig, (transcript)::text) @@ '''hous'' & ''estat'''::tsquery)
                          Buffers: shared hit=38
              ->  Index Only Scan using report_pkey on report  (cost=0.29..1.31 rows=1 width=4) (actual time=0.004..0.004 rows=1 loops=4822)
                    Index Cond: (id = speech.report_id)
                    Heap Fetches: 0
                    Buffers: shared hit=9645
              SubPlan 1
                ->  Index Scan using report_pkey on report report_1  (cost=0.29..2.31 rows=1 width=8) (actual time=0.007..0.007 rows=1 loops=4822)
                      Index Cond: (id = speech.report_id)
                      Buffers: shared hit=14466
Planning:
  Buffers: shared hit=18
Planning Time: 0.731 ms
Execution Time: 1603.736 ms
```

`EXPLAIN (ANALYZE, BUFFERS)` on production, `GET /search/speeches?q=housing&person_id=149`:

```text
Limit  (cost=402.86..402.91 rows=21 width=417) (actual time=4196.406..4196.420 rows=21 loops=1)
  Buffers: shared hit=4041
  ->  Sort  (cost=402.86..402.99 rows=54 width=417) (actual time=4196.403..4196.411 rows=21 loops=1)
        Sort Key: (ts_rank(to_tsvector('english'::regconfig, (speech.transcript)::text), '''hous'''::tsquery)) DESC, ((SubPlan 1)) DESC, speech.id
        Sort Method: top-N heapsort  Memory: 63kB
        Buffers: shared hit=4041
        ->  Nested Loop  (cost=129.40..401.40 rows=54 width=417) (actual time=30.475..4186.007 rows=608 loops=1)
              Buffers: shared hit=4041
              ->  Bitmap Heap Scan on speech  (cost=129.11..197.56 rows=54 width=405) (actual time=29.983..3814.507 rows=608 loops=1)
                    Recheck Cond: ((to_tsvector('english'::regconfig, (transcript)::text) @@ '''hous'''::tsquery) AND (speaker_id = ANY ('{385,466,556,647,746,849,959,1074,1181,1304}'::integer[])))
                    Rows Removed by Index Recheck: 11481
                    Heap Blocks: exact=204 lossy=681
                    Buffers: shared hit=988
                    ->  BitmapAnd  (cost=129.09..129.09 rows=54 width=0) (actual time=29.235..29.238 rows=0 loops=1)
                          Buffers: shared hit=60
                          ->  Bitmap Index Scan on ix_speech_transcript_fts  (cost=0.00..32.93 rows=5343 width=0) (actual time=26.124..26.125 rows=67059 loops=1)
                                Index Cond: (to_tsvector('english'::regconfig, (transcript)::text) @@ '''hous'''::tsquery)
                                Buffers: shared hit=19
                          ->  Bitmap Index Scan on ix_speech_speaker_id  (cost=0.00..95.88 rows=10875 width=0) (actual time=0.919..0.919 rows=11985 loops=1)
                                Index Cond: (speaker_id = ANY ('{385,466,556,647,746,849,959,1074,1181,1304}'::integer[]))
                                Buffers: shared hit=41
              ->  Index Only Scan using report_pkey on report  (cost=0.29..1.21 rows=1 width=4) (actual time=0.035..0.035 rows=1 loops=608)
                    Index Cond: (id = speech.report_id)
                    Heap Fetches: 0
                    Buffers: shared hit=1217
              SubPlan 1
                ->  Index Scan using report_pkey on report report_1  (cost=0.29..2.31 rows=1 width=8) (actual time=0.031..0.032 rows=1 loops=608)
                      Index Cond: (id = speech.report_id)
                      Buffers: shared hit=1824
Planning:
  Buffers: shared hit=18
Planning Time: 0.851 ms
Execution Time: 4196.582 ms
```

Plain `EXPLAIN` on production, `GET /search/speeches?q=government` (the query runs past 30 s, so it is not executed here):

```text
Limit  (cost=6917.87..6983.76 rows=21 width=417)
  ->  Incremental Sort  (cost=6917.87..23681.39 rows=5343 width=417)
        Sort Key: (ts_rank(to_tsvector('english'::regconfig, (speech.transcript)::text), '''govern'''::tsquery)) DESC, ((SubPlan 1)) DESC, speech.id
        Presorted Key: (ts_rank(to_tsvector('english'::regconfig, (speech.transcript)::text), '''govern'''::tsquery))
        ->  Nested Loop  (cost=6914.75..23442.04 rows=5343 width=417)
              ->  Gather Merge  (cost=6914.45..7536.73 rows=5343 width=405)
                    Workers Planned: 2
                    ->  Sort  (cost=5914.43..5919.99 rows=2226 width=405)
                          Sort Key: (ts_rank(to_tsvector('english'::regconfig, (speech.transcript)::text), '''govern'''::tsquery)) DESC
                          ->  Parallel Bitmap Heap Scan on speech  (cost=34.27..5790.66 rows=2226 width=405)
                                Recheck Cond: (to_tsvector('english'::regconfig, (transcript)::text) @@ '''govern'''::tsquery)
                                ->  Bitmap Index Scan on ix_speech_transcript_fts  (cost=0.00..32.93 rows=5343 width=0)
                                      Index Cond: (to_tsvector('english'::regconfig, (transcript)::text) @@ '''govern'''::tsquery)
              ->  Memoize  (cost=0.30..0.50 rows=1 width=4)
                    Cache Key: speech.report_id
                    Cache Mode: logical
                    ->  Index Only Scan using report_pkey on report  (cost=0.29..0.49 rows=1 width=4)
                          Index Cond: (id = speech.report_id)
              SubPlan 1
                ->  Index Scan using report_pkey on report report_1  (cost=0.29..2.31 rows=1 width=8)
                      Index Cond: (id = speech.report_id)
```

One alternative, out of scope for this run (the polish brief rules out a stored tsvector column), is a stored generated column with its own GIN index:

```sql
ALTER TABLE speech ADD COLUMN transcript_tsv tsvector
    GENERATED ALWAYS AS (to_tsvector('english', transcript)) STORED;
create index ix_speech_transcript_fts on speech using gin (transcript_tsv);
```

The same applies to `report.title`. This stores the vector once, so ranking reads it instead of recomputing it. It also adds table size and rewrites every row on creation. The API's expression would change from `to_tsvector('english', transcript)` to the column name, so adopting it means a matching API change. The expression indexes above are what the API is built against today.

The statement behind `GET /people/29` that takes the time is `speech_counts_by_parliament`. `EXPLAIN (ANALYZE, BUFFERS)` on production, with the 12 memberships of person 29:

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
