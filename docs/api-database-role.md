# The API's read-only database role

ADR 0001 says the API connects through a Postgres role that can only `SELECT`. This file holds the SQL that creates that role. Royce runs it on the remote database with the owner role. The build never runs it.

Until the role exists, the API's only guard is the `default_transaction_read_only=on` connection option in `api/database/engine.py`, and any statement can switch that option off. The role makes the database itself refuse a write.

## Create the role

Replace `<database>` with the database name and set the password. Confirm each table name on the remote with `\d <table>` first; the names below are those on the scratch copy.

```sql
CREATE ROLE hansard_api LOGIN PASSWORD '<set by Royce>';
ALTER ROLE hansard_api SET default_transaction_read_only = on;
GRANT CONNECT ON DATABASE <database> TO hansard_api;
GRANT USAGE ON SCHEMA public TO hansard_api;
GRANT SELECT ON report, speech, sitting, attendance, speaker, person, personnamespelling, partyaffiliation, report_asker TO hansard_api;
GRANT SELECT (id, website_responses_added, sitting_date_responses_added, sittings_added, reports_added, speeches_added, speeches_linked, speeches_named_unlinked, attendances_added, attendances_linked, reports_held_without_text, reports_without_speech_rows, reports_rechecked, reports_changed, latest_sitting_date_with_text, figures, started_at, finished_at, status) ON refresh_run TO hansard_api;
```

The table grants cover every table the API declares a model for (`api/database/`). The `refresh_run` grant is the column grant from "Write role SQL" in the scraper's `docs/refresh.md`. It leaves out `halt_reason` and `failure_reason`, because a failure reason can carry database host and user names. The API's `RefreshRun` model reads neither column.

The role gets no grant on the raw tables `hansardwebsiteresponse` and `hansardsittingdateresponse`, and no `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE` or `CREATE` anywhere. A table the scraper adds later is not readable until it gets its own `GRANT SELECT`.

## When report links ship

`report_link` is not in the grant above. It exists only after the scraper's migration `e7b2c4d9f1a6` has run on the remote database, so run this once that migration is in place and not before. The API's `ReportLink` model reads five columns and leaves out `rule`, so the grant names them:

```sql
GRANT SELECT (id, link_type, printed_citation, source_report_id, target_report_id) ON report_link TO hansard_api;
```

The scraper's refresh role needs its own grants on the same table; they are under "Write role SQL" in the scraper's `docs/refresh.md`. Check the grant as `hansard_api`: `SELECT id, link_type FROM report_link LIMIT 1;` returns a row, and `SELECT rule FROM report_link LIMIT 1;` fails with "permission denied for table report_link".

## Grants for leave periods and seat history

The unreleased endpoints `GET /people/{person_id}/leave-periods`, `GET /leave-periods/latest-sitting` and `GET /seats` read three tables from scraper migration `e3b7c1d94a62`. Royce runs this as the owner role when the endpoints ship, after the migration is applied and the tables are filled. Until then no grant exists, and the endpoints answer 404 while `IS_UNRELEASED_ENDPOINTS_ENABLED` is off.

```sql
GRANT SELECT ON leave_period, leave_period_printing, seat_holding TO hansard_api;
```

Check it as `hansard_api` with `SELECT count(*) FROM leave_period_printing;`, which returns a row, and `UPDATE seat_holding SET sitting_count = sitting_count WHERE false;`, which fails with "cannot execute UPDATE in a read-only transaction".

## When the bill and act endpoints ship

The bill and act endpoints read seven tables that the scraper's law links migration creates or rewrites. Royce runs this line with the owner role after that migration is applied, or `GRANT` fails on a missing table. Until then the role cannot read them, and the endpoints stay off behind `IS_UNRELEASED_ENDPOINTS_ENABLED`. The build never runs it.

```sql
GRANT SELECT ON bill, billreport, act, acthistoryentry, billkey, billreportspeaker, billstageline TO hansard_api;
```

After it, connect as `hansard_api` and run `SELECT count(*) FROM billkey;`. It returns a row.

## When the office endpoints ship

The seven tables below back the endpoints under `/offices`, which answer 404 until `IS_UNRELEASED_ENDPOINTS_ENABLED` is turned on. They exist only once the scraper's migration `e7b4c2a9f1d3` has run on the remote and the three `apply_*` scripts have filled them. Run this SQL then, as the owner role, before the setting is switched on in production. Until the SQL runs, the role cannot read them and any `/offices` request would fail.

```sql
GRANT SELECT ON attendance_office, office_printed_range, report_put_to, ministry, office_title_ministry, ministry_see_also, report_participant TO hansard_api;
```

`report_participant` is not read by anything else in the API today. Confirm each name on the remote with `\d <table>` first.

## Attached files

The attached file endpoints read two tables the scraper adds in migration `81ba3804b972` (re-parented when it lands). Run this once the migration has been applied and before `IS_UNRELEASED_ENDPOINTS_ENABLED` is switched on. Without the grant, the role cannot read the tables, so a request to either endpoint fails while the setting is on.

```sql
GRANT SELECT ON attached_file, attached_file_pointer TO hansard_api;
```

Check it as `hansard_api` with `SELECT count(*) FROM attached_file_pointer;`.

## Votes and minutes

The unreleased endpoints `GET /divisions`, `GET /divisions/{division_id}` and `GET /minutes` read five tables the scraper adds in migrations `7b1f3c9a2e40`, `3e8a6d15c2f7`, `c41b7e2f9a06` and `5fa92d0e8b13` (re-parented when they land). Run this as the owner role once the migrations are applied and the five `apply_*` scripts have filled the tables, and before `IS_UNRELEASED_ENDPOINTS_ENABLED` is switched on. Until it runs, the role cannot read the tables and a request to any of the three endpoints fails while the setting is on. It is not a grant already in place.

```sql
GRANT SELECT ON division, division_vote, division_party_count, minutes_division TO hansard_api;
GRANT SELECT (id, sitting_date, printed_label, printed_parliament, file_url, archive_timestamp, file_format, status) ON minutes TO hansard_api;
```

`minutes` holds the extracted text of every Votes and Proceedings file, about 4 MB today, plus the file hash and a review note. The API reads none of them, so `minutes` takes a column grant, as `report_link` does, and a query that selects `extracted_text` fails with "permission denied for table minutes". The other four tables hold only values a response shows or harmless counts, so they take a whole-table grant. The API has no model for `minutes_index_capture` and needs no grant on it.

Check it as `hansard_api` with `SELECT count(*) FROM division_vote;` and `SELECT id, status FROM minutes LIMIT 1;`, which return rows, and `SELECT extracted_text FROM minutes LIMIT 1;`, which fails. The scraper's refresh role has its own grants on the same tables; they are in the scraper's `docs/refresh.md`.

## Check the role

Connect as `hansard_api` and run:

```sql
SELECT count(*) FROM report;
SELECT count(*) FROM report_asker;
SELECT status FROM refresh_run LIMIT 1;
UPDATE report SET title = title WHERE false;
SET default_transaction_read_only = off;
UPDATE report SET title = title WHERE false;
SELECT failure_reason FROM refresh_run LIMIT 1;
```

The three `SELECT`s at the top return rows, or no rows from an empty `refresh_run`. The first `UPDATE` fails with "cannot execute UPDATE in a read-only transaction". The second fails with "permission denied for table report", which shows the grant holds even with the read-only option off. The last `SELECT` fails with "permission denied for table refresh_run".

## Point the API at it

1. Build the connection string from the current `DATABASE_URL`, with `hansard_api` and its password in place of the user and password.
2. Update the `DATABASE_URL` secret in GitHub, under Settings, Secrets and variables, Actions, then deploy. Every deploy writes the secret over the `web` component's `DATABASE_URL`, so a value saved in the DigitalOcean dashboard would last only until the next deploy.
3. Check that `https://{domain}/api/health` answers 200 and a report page loads. Then check that the footer shows "Includes sittings up to", which needs the `refresh_run` grant and a finished refresh run.
