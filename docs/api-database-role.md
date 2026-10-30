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
GRANT SELECT ON report, speech, sitting, attendance, speaker, person, partyaffiliation TO hansard_api;
GRANT SELECT (id, website_responses_added, sitting_date_responses_added, sittings_added, reports_added, speeches_added, speeches_linked, speeches_named_unlinked, attendances_added, attendances_linked, reports_held_without_text, reports_without_speech_rows, reports_rechecked, reports_changed, latest_sitting_date_with_text, figures, started_at, finished_at, status) ON refresh_run TO hansard_api;
```

The table grants cover every table the API declares a model for (`api/database/`). The `refresh_run` grant is the column grant from "Write role SQL" in the scraper's `docs/refresh.md`. It leaves out `halt_reason` and `failure_reason`, because a failure reason can carry database host and user names. The API's `RefreshRun` model reads neither column.

The role gets no grant on the raw tables `hansardwebsiteresponse` and `hansardsittingdateresponse`, and no `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE` or `CREATE` anywhere. A table the scraper adds later is not readable until it gets its own `GRANT SELECT`.

## Check the role

Connect as `hansard_api` and run:

```sql
SELECT count(*) FROM report;
SELECT status FROM refresh_run LIMIT 1;
UPDATE report SET title = title WHERE false;
SET default_transaction_read_only = off;
UPDATE report SET title = title WHERE false;
SELECT failure_reason FROM refresh_run LIMIT 1;
```

The two `SELECT`s at the top return rows, or no rows from an empty `refresh_run`. The first `UPDATE` fails with "cannot execute UPDATE in a read-only transaction". The second fails with "permission denied for table report", which shows the grant holds even with the read-only option off. The last `SELECT` fails with "permission denied for table refresh_run".

## Point the API at it

1. Build the connection string from the current `DATABASE_URL`, with `hansard_api` and its password in place of the user and password.
2. Update the `DATABASE_URL` secret in GitHub, under Settings, Secrets and variables, Actions, then deploy. Every deploy writes the secret over the `web` component's `DATABASE_URL`, so a value saved in the DigitalOcean dashboard would last only until the next deploy.
3. Check that `https://{domain}/api/health` answers 200 and a report page loads. Then check that the footer shows "Includes sittings up to", which needs the `refresh_run` grant and a finished refresh run.
