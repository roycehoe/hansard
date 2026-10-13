# Required indexes

The API is read-only (ADR 0001) and cannot create indexes. ADR 0003 gives the scraper ownership of every index the API relies on, as Alembic migrations. This file lists them: seven indexes, each with the exact definition, the endpoints that need it, the SQL the API sends, and the `EXPLAIN` output from a read-only run against the production database on 13 October 2026. The SQL was captured by compiling each SQLModel statement from `api/crud/` with the Postgres dialect and literal parameters. Every plan is a plain `EXPLAIN`, so no query was executed.

Slow sequential scans are acceptable in local development. The API does not launch until every listed index exists. B1 and B2 are built against the documented expressions and are unverified until the two GIN indexes exist.

Facts that apply to every plan below:

- Today only the primary keys, `report.report_id` (unique) and `speaker.person_id` are indexed.
- `speech` holds about 640,000 rows and `report` 37,929 on 13 October 2026. The speech count moves because the scraper is rebuilding rows, so cost figures shift between runs.
- The database default text search configuration is `simple`. The API names `english` explicitly as a SQL literal (`literal_column("'english'")` in `api/crud/text_search.py`), so the query compiles to `to_tsvector('english', transcript)`. The index must name `english` too, or the planner will not match the expression.
- The API sets a 30-second statement timeout. Without the GIN index the speech full-text query exceeds it on the shared database (the title query runs in about a second), so `GET /search/speeches` answers `503 search.timed_out` until `ix_speech_transcript_fts` exists. Run once through psql with no timeout on 13 October 2026, while the scraper was rebuilding speech rows, the relevance-sorted speech query for "housing estate" in Parliament 8 took 394 seconds.

## ix_speech_report_id

```sql
CREATE INDEX ix_speech_report_id ON speech (report_id);
```

Needed by `GET /reports/{report_slug}` and `GET /people/{person_id}/reports`. `GET /search/speeches` also joins `speech` to `report` on this column.

Without it, `speech_by_report_id` scans all of `speech` for one report's speeches.

```sql
-- speech_by_report_id (GET /reports/{report_slug})
SELECT speech.id, speech.ordinal, speech.speaker, speech.transcript, speech.report_id, speech.speaker_id  FROM speech  WHERE speech.report_id = 27549 ORDER BY speech.ordinal;
```

```text
-- speech_by_report_id (GET /reports/{report_slug})
                                    QUERY PLAN                                    
----------------------------------------------------------------------------------
 Gather Merge  (cost=55989.95..55996.48 rows=56 width=403)
   Workers Planned: 2
   ->  Sort  (cost=54989.92..54989.99 rows=28 width=403)
         Sort Key: ordinal
         ->  Parallel Seq Scan on speech  (cost=0.00..54989.25 rows=28 width=403)
               Filter: (report_id = 27549)
(6 rows)
```

```sql
-- person_reports (GET /people/{person_id}/reports)
SELECT anon_1.report_id, anon_1.speech_count  FROM (SELECT speech.report_id AS report_id, count(*) AS speech_count  FROM speech  WHERE speech.speaker_id IN (1349) GROUP BY speech.report_id) AS anon_1 JOIN report ON report.id = anon_1.report_id ORDER BY report.sitting_date DESC, report.speech_number DESC   LIMIT 21 OFFSET 0;
```

```text
-- person_reports (GET /people/{person_id}/reports)
                                                   QUERY PLAN                                                   
----------------------------------------------------------------------------------------------------------------
 Limit  (cost=61507.97..61508.02 rows=21 width=24)
   ->  Sort  (cost=61507.97..61520.53 rows=5022 width=24)
         Sort Key: report.sitting_date DESC, report.speech_number DESC
         ->  Merge Join  (cost=56169.40..61372.57 rows=5022 width=24)
               Merge Cond: (speech.report_id = report.id)
               ->  Finalize GroupAggregate  (cost=56169.11..57020.47 rows=5022 width=12)
                     Group Key: speech.report_id
                     ->  Gather Merge  (cost=56169.11..56939.24 rows=6202 width=12)
                           Workers Planned: 2
                           ->  Partial GroupAggregate  (cost=55169.09..55223.35 rows=3101 width=12)
                                 Group Key: speech.report_id
                                 ->  Sort  (cost=55169.09..55176.84 rows=3101 width=4)
                                       Sort Key: speech.report_id
                                       ->  Parallel Seq Scan on speech  (cost=0.00..54989.25 rows=3101 width=4)
                                             Filter: (speaker_id = 1349)
               ->  Index Scan using report_pkey on report  (cost=0.29..4193.32 rows=38402 width=16)
(16 rows)
```

## ix_speech_speaker_id

```sql
CREATE INDEX ix_speech_speaker_id ON speech (speaker_id);
```

Needed by `GET /people/{person_id}`, `GET /people/{person_id}/reports` and `GET /search/speeches` when `person_id` is given.

Both statements filter `speech.speaker_id` and scan the whole table today. `person_reports` appears again here because it needs this index as well as `ix_speech_report_id`.

```sql
-- speech_counts_by_parliament (GET /people/{person_id})
SELECT report.parliament_number, count(*) AS count_1  FROM speech JOIN report ON report.id = speech.report_id  WHERE speech.speaker_id IN (1349) GROUP BY report.parliament_number;
```

```text
-- speech_counts_by_parliament (GET /people/{person_id})
                                               QUERY PLAN                                               
--------------------------------------------------------------------------------------------------------
 Finalize GroupAggregate  (cost=58629.83..58657.00 rows=15 width=12)
   Group Key: report.parliament_number
   ->  Gather Merge  (cost=58629.83..58656.70 rows=30 width=12)
         Workers Planned: 2
         ->  Partial GroupAggregate  (cost=57629.81..57653.21 rows=15 width=12)
               Group Key: report.parliament_number
               ->  Sort  (cost=57629.81..57637.56 rows=3101 width=4)
                     Sort Key: report.parliament_number
                     ->  Nested Loop  (cost=0.29..57449.97 rows=3101 width=4)
                           ->  Parallel Seq Scan on speech  (cost=0.00..54989.25 rows=3101 width=4)
                                 Filter: (speaker_id = 1349)
                           ->  Index Scan using report_pkey on report  (cost=0.29..0.79 rows=1 width=8)
                                 Index Cond: (id = speech.report_id)
(13 rows)
```

```sql
-- person_reports (GET /people/{person_id}/reports)
SELECT anon_1.report_id, anon_1.speech_count  FROM (SELECT speech.report_id AS report_id, count(*) AS speech_count  FROM speech  WHERE speech.speaker_id IN (1349) GROUP BY speech.report_id) AS anon_1 JOIN report ON report.id = anon_1.report_id ORDER BY report.sitting_date DESC, report.speech_number DESC   LIMIT 21 OFFSET 0;
```

```text
-- person_reports (GET /people/{person_id}/reports)
                                                   QUERY PLAN                                                   
----------------------------------------------------------------------------------------------------------------
 Limit  (cost=61507.97..61508.02 rows=21 width=24)
   ->  Sort  (cost=61507.97..61520.53 rows=5022 width=24)
         Sort Key: report.sitting_date DESC, report.speech_number DESC
         ->  Merge Join  (cost=56169.40..61372.57 rows=5022 width=24)
               Merge Cond: (speech.report_id = report.id)
               ->  Finalize GroupAggregate  (cost=56169.11..57020.47 rows=5022 width=12)
                     Group Key: speech.report_id
                     ->  Gather Merge  (cost=56169.11..56939.24 rows=6202 width=12)
                           Workers Planned: 2
                           ->  Partial GroupAggregate  (cost=55169.09..55223.35 rows=3101 width=12)
                                 Group Key: speech.report_id
                                 ->  Sort  (cost=55169.09..55176.84 rows=3101 width=4)
                                       Sort Key: speech.report_id
                                       ->  Parallel Seq Scan on speech  (cost=0.00..54989.25 rows=3101 width=4)
                                             Filter: (speaker_id = 1349)
               ->  Index Scan using report_pkey on report  (cost=0.29..4193.32 rows=38402 width=16)
(16 rows)
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
                             QUERY PLAN                              
---------------------------------------------------------------------
 Sort  (cost=2321.36..2321.53 rows=69 width=40)
   Sort Key: is_present DESC, speaker_name
   ->  Seq Scan on attendance  (cost=0.00..2319.25 rows=69 width=40)
         Filter: (sitting_id = 5852)
(4 rows)
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
                                                  QUERY PLAN                                                  
--------------------------------------------------------------------------------------------------------------
 HashAggregate  (cost=6819.37..6821.37 rows=200 width=12)
   Group Key: anon_1.parliament_number
   ->  Hash Join  (cost=4197.11..6806.99 rows=2477 width=4)
         Hash Cond: (to_date((sitting.sitting_date)::text, 'DD-MM-YYYY'::text) = (anon_1.sitting_date)::date)
         ->  Nested Loop  (cost=0.28..2399.31 rows=129 width=9)
               ->  Seq Scan on attendance  (cost=0.00..2319.25 rows=129 width=4)
                     Filter: ((is_present IS TRUE) AND (speaker_id = 1349))
               ->  Index Scan using sitting_pkey on sitting  (cost=0.28..0.62 rows=1 width=13)
                     Index Cond: (id = attendance.sitting_id)
         ->  Hash  (cost=4148.83..4148.83 rows=3840 width=12)
               ->  Subquery Scan on anon_1  (cost=4072.03..4148.83 rows=3840 width=12)
                     ->  HashAggregate  (cost=4072.03..4110.43 rows=3840 width=12)
                           Group Key: report.sitting_date, report.parliament_number
                           ->  Seq Scan on report  (cost=0.00..3880.02 rows=38402 width=12)
(14 rows)
```

## ix_report_sitting_date

```sql
CREATE INDEX ix_report_sitting_date ON report (sitting_date);
```

Needed by `GET /sittings/{sitting_date}`, `GET /sittings` and the date filters on `GET /search/speeches` and `GET /search/reports`.

The two date-filtered search statements are repeated under the GIN index sections, because the text predicate decides their plan. Today the date filter on `report` runs as a per-row filter after the primary-key lookup.

```sql
-- report_by_sitting_date (GET /sittings/{sitting_date})
SELECT report.id, report.volume_number, report.parliament_number, report.sitting_number, report.sitting_date, report.speech_number, report.title, report.subtitle, report.report_id, report.report_type, report.html_file_name, report.report_version  FROM report  WHERE report.sitting_date = '1993-10-12 00:00:00' ORDER BY report.speech_number;
```

```text
-- report_by_sitting_date (GET /sittings/{sitting_date})
                                     QUERY PLAN                                      
-------------------------------------------------------------------------------------
 Sort  (cost=3976.40..3976.45 rows=18 width=188)
   Sort Key: speech_number
   ->  Seq Scan on report  (cost=0.00..3976.03 rows=18 width=188)
         Filter: (sitting_date = '1993-10-12 00:00:00'::timestamp without time zone)
(4 rows)
```

```sql
-- sittings_by_parliament (GET /sittings)
SELECT report.sitting_date, count(*) AS count_1  FROM report  WHERE report.parliament_number = 8 GROUP BY report.sitting_date ORDER BY report.sitting_date;
```

```text
-- sittings_by_parliament (GET /sittings)
                               QUERY PLAN                               
------------------------------------------------------------------------
 Sort  (cost=4053.06..4055.87 rows=1123 width=16)
   Sort Key: sitting_date
   ->  HashAggregate  (cost=3984.93..3996.16 rows=1123 width=16)
         Group Key: sitting_date
         ->  Seq Scan on report  (cost=0.00..3976.03 rows=1781 width=8)
               Filter: (parliament_number = 8)
(6 rows)
```

```sql
-- speech_search_date (GET /search/speeches)
SELECT speech.id, speech.ordinal, speech.speaker, speech.transcript, speech.report_id, speech.speaker_id  FROM speech JOIN report ON report.id = speech.report_id  WHERE (to_tsvector('english', speech.transcript) @@ websearch_to_tsquery('english', 'housing estate')) AND report.sitting_date >= '1993-01-01' ORDER BY (SELECT report_1.sitting_date  FROM report AS report_1  WHERE report_1.id = speech.report_id) DESC, ts_rank(to_tsvector('english', speech.transcript), websearch_to_tsquery('english', 'housing estate')) DESC, speech.id   LIMIT 21 OFFSET 0;
```

```text
-- speech_search_date (GET /search/speeches)
                                                                           QUERY PLAN                                                                           
----------------------------------------------------------------------------------------------------------------------------------------------------------------
 Limit  (cost=123059.87..123059.90 rows=11 width=415)
   ->  Sort  (cost=123059.87..123059.90 rows=11 width=415)
         Sort Key: ((SubPlan 1)) DESC, (ts_rank(to_tsvector('english'::regconfig, (speech.transcript)::text), '''hous'' & ''estat'''::tsquery)) DESC, speech.id
         ->  Gather  (cost=1000.29..123059.68 rows=11 width=415)
               Workers Planned: 2
               ->  Nested Loop  (cost=0.29..122030.42 rows=5 width=403)
                     ->  Parallel Seq Scan on speech  (cost=0.00..122014.25 rows=7 width=403)
                           Filter: (to_tsvector('english'::regconfig, (transcript)::text) @@ '''hous'' & ''estat'''::tsquery)
                     ->  Index Scan using report_pkey on report  (cost=0.29..2.31 rows=1 width=4)
                           Index Cond: (id = speech.report_id)
                           Filter: (sitting_date >= '1993-01-01 00:00:00'::timestamp without time zone)
               SubPlan 1
                 ->  Index Scan using report_pkey on report report_1  (cost=0.29..2.31 rows=1 width=8)
                       Index Cond: (id = speech.report_id)
 JIT:
   Functions: 16
   Options: Inlining false, Optimization false, Expressions true, Deforming true
(17 rows)
```

```sql
-- title_search_date (GET /search/reports)
SELECT report.id, report.volume_number, report.parliament_number, report.sitting_number, report.sitting_date, report.speech_number, report.title, report.subtitle, report.report_id, report.report_type, report.html_file_name, report.report_version  FROM report  WHERE (to_tsvector('english', report.title) @@ websearch_to_tsquery('english', 'housing estate')) AND report.parliament_number = 14 ORDER BY report.sitting_date DESC, ts_rank(to_tsvector('english', report.title), websearch_to_tsquery('english', 'housing estate')) DESC, report.id   LIMIT 21 OFFSET 0;
```

```text
-- title_search_date (GET /search/reports)
                                                                    QUERY PLAN                                                                    
--------------------------------------------------------------------------------------------------------------------------------------------------
 Limit  (cost=8736.58..8736.59 rows=1 width=192)
   ->  Sort  (cost=8736.58..8736.59 rows=1 width=192)
         Sort Key: sitting_date DESC, (ts_rank(to_tsvector('english'::regconfig, (title)::text), '''hous'' & ''estat'''::tsquery)) DESC, id
         ->  Gather  (cost=1000.00..8736.57 rows=1 width=192)
               Workers Planned: 2
               ->  Parallel Seq Scan on report  (cost=0.00..7736.47 rows=1 width=192)
                     Filter: ((parliament_number = 14) AND (to_tsvector('english'::regconfig, (title)::text) @@ '''hous'' & ''estat'''::tsquery))
(7 rows)
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

The plans below are the current state, before the index exists: a parallel sequential scan filtered by the `@@` predicate. `speech_headlines` reads at most one page of rows by primary key and needs no index of its own, but it only runs after a search has returned ids.

```sql
-- speech_search_relevance (GET /search/speeches)
SELECT speech.id, speech.ordinal, speech.speaker, speech.transcript, speech.report_id, speech.speaker_id  FROM speech JOIN report ON report.id = speech.report_id  WHERE (to_tsvector('english', speech.transcript) @@ websearch_to_tsquery('english', 'housing estate')) AND report.parliament_number = 8 ORDER BY ts_rank(to_tsvector('english', speech.transcript), websearch_to_tsquery('english', 'housing estate')) DESC, (SELECT report_1.sitting_date  FROM report AS report_1  WHERE report_1.id = speech.report_id) DESC, speech.id   LIMIT 21 OFFSET 0;
```

```text
-- speech_search_relevance (GET /search/speeches)
                                                                           QUERY PLAN                                                                           
----------------------------------------------------------------------------------------------------------------------------------------------------------------
 Limit  (cost=123033.09..123033.10 rows=1 width=415)
   ->  Sort  (cost=123033.09..123033.10 rows=1 width=415)
         Sort Key: (ts_rank(to_tsvector('english'::regconfig, (speech.transcript)::text), '''hous'' & ''estat'''::tsquery)) DESC, ((SubPlan 1)) DESC, speech.id
         ->  Gather  (cost=1000.29..123033.08 rows=1 width=415)
               Workers Planned: 2
               ->  Nested Loop  (cost=0.29..122030.42 rows=1 width=403)
                     ->  Parallel Seq Scan on speech  (cost=0.00..122014.25 rows=7 width=403)
                           Filter: (to_tsvector('english'::regconfig, (transcript)::text) @@ '''hous'' & ''estat'''::tsquery)
                     ->  Index Scan using report_pkey on report  (cost=0.29..2.31 rows=1 width=4)
                           Index Cond: (id = speech.report_id)
                           Filter: (parliament_number = 8)
               SubPlan 1
                 ->  Index Scan using report_pkey on report report_1  (cost=0.29..2.31 rows=1 width=8)
                       Index Cond: (id = speech.report_id)
 JIT:
   Functions: 16
   Options: Inlining false, Optimization false, Expressions true, Deforming true
(17 rows)
```

```sql
-- speech_search_date (GET /search/speeches)
SELECT speech.id, speech.ordinal, speech.speaker, speech.transcript, speech.report_id, speech.speaker_id  FROM speech JOIN report ON report.id = speech.report_id  WHERE (to_tsvector('english', speech.transcript) @@ websearch_to_tsquery('english', 'housing estate')) AND report.sitting_date >= '1993-01-01' ORDER BY (SELECT report_1.sitting_date  FROM report AS report_1  WHERE report_1.id = speech.report_id) DESC, ts_rank(to_tsvector('english', speech.transcript), websearch_to_tsquery('english', 'housing estate')) DESC, speech.id   LIMIT 21 OFFSET 0;
```

```text
-- speech_search_date (GET /search/speeches)
                                                                           QUERY PLAN                                                                           
----------------------------------------------------------------------------------------------------------------------------------------------------------------
 Limit  (cost=123059.87..123059.90 rows=11 width=415)
   ->  Sort  (cost=123059.87..123059.90 rows=11 width=415)
         Sort Key: ((SubPlan 1)) DESC, (ts_rank(to_tsvector('english'::regconfig, (speech.transcript)::text), '''hous'' & ''estat'''::tsquery)) DESC, speech.id
         ->  Gather  (cost=1000.29..123059.68 rows=11 width=415)
               Workers Planned: 2
               ->  Nested Loop  (cost=0.29..122030.42 rows=5 width=403)
                     ->  Parallel Seq Scan on speech  (cost=0.00..122014.25 rows=7 width=403)
                           Filter: (to_tsvector('english'::regconfig, (transcript)::text) @@ '''hous'' & ''estat'''::tsquery)
                     ->  Index Scan using report_pkey on report  (cost=0.29..2.31 rows=1 width=4)
                           Index Cond: (id = speech.report_id)
                           Filter: (sitting_date >= '1993-01-01 00:00:00'::timestamp without time zone)
               SubPlan 1
                 ->  Index Scan using report_pkey on report report_1  (cost=0.29..2.31 rows=1 width=8)
                       Index Cond: (id = speech.report_id)
 JIT:
   Functions: 16
   Options: Inlining false, Optimization false, Expressions true, Deforming true
(17 rows)
```

```sql
-- speech_headlines (GET /search/speeches)
SELECT speech.id, ts_headline('english', speech.transcript, websearch_to_tsquery('english', 'housing estate'), 'StartSel=<mark>, StopSel=</mark>, MaxWords=35, MinWords=15') AS ts_headline_1  FROM speech  WHERE speech.id IN (1, 2, 3);
```

```text
-- speech_headlines (GET /search/speeches)
                                QUERY PLAN                                 
---------------------------------------------------------------------------
 Index Scan using speech_pkey on speech  (cost=0.42..8.04 rows=3 width=36)
   Index Cond: (id = ANY ('{1,2,3}'::integer[]))
(2 rows)
```

## ix_report_title_fts

```sql
CREATE INDEX ix_report_title_fts ON report USING gin (to_tsvector('english', title));
```

Needed by `GET /search/reports` (B1).

The title query is cheap today (about a second), but it also scans the whole table and gets the same expression index.

```sql
-- title_search_relevance (GET /search/reports)
SELECT report.id, report.volume_number, report.parliament_number, report.sitting_number, report.sitting_date, report.speech_number, report.title, report.subtitle, report.report_id, report.report_type, report.html_file_name, report.report_version  FROM report  WHERE to_tsvector('english', report.title) @@ websearch_to_tsquery('english', 'housing estate') ORDER BY ts_rank(to_tsvector('english', report.title), websearch_to_tsquery('english', 'housing estate')) DESC, report.sitting_date DESC, report.id   LIMIT 21 OFFSET 0;
```

```text
-- title_search_relevance (GET /search/reports)
                                                                 QUERY PLAN                                                                 
--------------------------------------------------------------------------------------------------------------------------------------------
 Limit  (cost=8696.58..8696.59 rows=1 width=192)
   ->  Sort  (cost=8696.58..8696.59 rows=1 width=192)
         Sort Key: (ts_rank(to_tsvector('english'::regconfig, (title)::text), '''hous'' & ''estat'''::tsquery)) DESC, sitting_date DESC, id
         ->  Gather  (cost=1000.00..8696.57 rows=1 width=192)
               Workers Planned: 2
               ->  Parallel Seq Scan on report  (cost=0.00..7696.47 rows=1 width=192)
                     Filter: (to_tsvector('english'::regconfig, (title)::text) @@ '''hous'' & ''estat'''::tsquery)
(7 rows)
```

```sql
-- title_search_date (GET /search/reports)
SELECT report.id, report.volume_number, report.parliament_number, report.sitting_number, report.sitting_date, report.speech_number, report.title, report.subtitle, report.report_id, report.report_type, report.html_file_name, report.report_version  FROM report  WHERE (to_tsvector('english', report.title) @@ websearch_to_tsquery('english', 'housing estate')) AND report.parliament_number = 14 ORDER BY report.sitting_date DESC, ts_rank(to_tsvector('english', report.title), websearch_to_tsquery('english', 'housing estate')) DESC, report.id   LIMIT 21 OFFSET 0;
```

```text
-- title_search_date (GET /search/reports)
                                                                    QUERY PLAN                                                                    
--------------------------------------------------------------------------------------------------------------------------------------------------
 Limit  (cost=8736.58..8736.59 rows=1 width=192)
   ->  Sort  (cost=8736.58..8736.59 rows=1 width=192)
         Sort Key: sitting_date DESC, (ts_rank(to_tsvector('english'::regconfig, (title)::text), '''hous'' & ''estat'''::tsquery)) DESC, id
         ->  Gather  (cost=1000.00..8736.57 rows=1 width=192)
               Workers Planned: 2
               ->  Parallel Seq Scan on report  (cost=0.00..7736.47 rows=1 width=192)
                     Filter: ((parliament_number = 14) AND (to_tsvector('english'::regconfig, (title)::text) @@ '''hous'' & ''estat'''::tsquery))
(7 rows)
```

## Ranking cost

`ts_rank` needs a `tsvector`, and an expression index stores none. Postgres therefore recomputes `to_tsvector('english', transcript)` for every matched row to rank it. A common word such as "government" matches roughly 94,000 speeches, so a broad query ranks all of them before the `LIMIT 21` applies. That is acceptable in development.

The alternative is a stored generated column with its own GIN index:

```sql
ALTER TABLE speech ADD COLUMN transcript_tsv tsvector
    GENERATED ALWAYS AS (to_tsvector('english', transcript)) STORED;
create index ix_speech_transcript_fts on speech using gin (transcript_tsv);
```

The same applies to `report.title`. This stores the vector once, so ranking reads it instead of recomputing it. It also adds table size and rewrites every row on creation. The API's expression would change from `to_tsvector('english', transcript)` to the column name, so adopting it means a matching API change. The expression indexes above are what the API is built against today.

## Queries the GIN index cannot serve

A negation-only query, such as `-coe`, makes `websearch_to_tsquery` produce a query whose `querytree` is `T` (match everything). A GIN index cannot answer that, so the planner falls back to a sequential scan of `speech` or `report`. No index fixes this, and the API does not work around it (ADR 0003). The empty state tells the reader that common words are ignored.

## Deliberately not indexed

- `sitting` has 1,719 rows. A sequential scan is cheap, and `sitting_pkey` already serves the joins.
- `report.report_id` is already unique-indexed.
- `speaker.person_id` is already indexed.
- `speaker` for `GET /people` has 1,434 rows, so the filter by parliament and `ILIKE` on name scans the table at negligible cost. A leading-wildcard `ILIKE` could not use a B-tree anyway.

The `memberships_filtered` statement and its plan:

```sql
-- memberships_filtered (GET /people)
SELECT speaker.id, speaker.name, speaker.party, speaker.parliament_number, speaker.is_legislative_assembly, speaker.is_member, speaker.person_id  FROM speaker  WHERE speaker.parliament_number = 9 AND speaker.name ILIKE '%%tan%%' ESCAPE '\';
```

```text
-- memberships_filtered (GET /people)
                                 QUERY PLAN                                 
----------------------------------------------------------------------------
 Seq Scan on speaker  (cost=0.00..51.51 rows=7 width=51)
   Filter: (((name)::text ~~* '%%tan%%'::text) AND (parliament_number = 9))
(2 rows)
```
