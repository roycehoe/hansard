# Public mode and takedowns

The site runs as one container (`api/website.py`). Two things control what it shows: `PUBLIC_MODE` and the takedown list.

## Public mode

While `PUBLIC_MODE` is anything other than `true`, every page and API call needs the basic-auth username and password, and every response carries `X-Robots-Tag: noindex`. `/api/health` stays open for the platform's health check. In this mode the site does not start without `BASIC_AUTH_USERNAME` and `BASIC_AUTH_PASSWORD`.

With `PUBLIC_MODE` set to `true`, the site drops both the password and the noindex header. Only the word `true` does this, in any letter case. A typo, `1` or `yes` keeps the password on.

To go public:

1. In `.do/app.yaml`, change the `PUBLIC_MODE` value from `"false"` to `"true"`.
2. Commit and deploy.
3. Check that `curl -I https://{domain}/` answers 200 with no `X-Robots-Tag` header.

To put the site back behind the password, set the value to `"false"` and deploy. The two credentials must still be set as secrets.

## Taking a report down

Royce decides what comes down. The letter to Parliament promises removal within 2 working days of a request.

1. Copy the report's slug. It is the part of the address after `/reports/` and before any `?`. A slug copied from the address bar with `%23` in it works as it is.
2. Add the slug to `api/takedown-list.txt` on a line of its own. The file takes no comments, so record who asked and when in the commit message.
3. Commit and deploy.
4. Check that both addresses answer 410. Each command prints the HTTP status of a GET request:
   - `curl -s -o /dev/null -w '%{http_code}\n' https://{domain}/reports/{slug}`
   - `curl -s -o /dev/null -w '%{http_code}\n' https://{domain}/api/reports/{slug}`

   While public mode is off, each `curl` needs `-u` with the basic-auth username and password, or it prints `401`. A slug with a typo hides nothing, and this check is the only way to see that.

A taken-down report answers 410 on its page and in the API, and its page carries no preview tags. It drops out of search results, its sitting's report list and each person's report list. Counts on `/coverage` still include it. The stored rows do not change. Delete the line and deploy to bring the report back.

A deploy restarts the process, which empties the in-memory caches of preview tags and API responses. A browser or proxy can keep its own copy of a page for as long as the response's `Cache-Control` allows.

If the list has a line with `/`, `?` or a space, or the file is missing, the site does not start and the deploy fails. Fix the line and deploy again.

## Researchers form

`/researchers` and its footer link appear only when the build has `VITE_RESEARCHERS_FORM_URL` set to the form's address. Put the address in the `VITE_RESEARCHERS_FORM_URL` entry (`scope: BUILD_TIME`) in `.do/app.yaml`, commit, and deploy, which rebuilds the frontend. While it is unset, `/researchers` sends visitors to the home page.
