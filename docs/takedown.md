# Public mode and takedowns

The site runs as one container (`api/website.py`). Two things control what it shows: `PUBLIC_MODE` and the takedown list in `TAKEDOWN_REPORT_SLUGS`.

## Public mode

While `PUBLIC_MODE` is anything other than `true`, every page and API call needs the basic-auth username and password, and every response carries `X-Robots-Tag: noindex`. `/api/health` stays open for the platform's health check. In this mode the site does not start without `BASIC_AUTH_USERNAME` and `BASIC_AUTH_PASSWORD`.

With `PUBLIC_MODE` set to `true`, the site drops both the password and the noindex header. Only the word `true` does this, in any letter case. A typo, `1` or `yes` keeps the password on.

To go public:

1. In `.do/app.yaml`, change the `PUBLIC_MODE` value from `"false"` to `"true"`.
2. Commit and push to `master`. CI deploys once its checks pass.
3. Check that `curl -I https://{domain}/` answers 200 with no `X-Robots-Tag` header.

`/robots.txt` allows every crawler in both modes. While the password is on, a crawler gets 401 and the noindex header at every address, `/robots.txt` included, so nothing is indexed. A `Disallow` there would stop crawlers from fetching pages, so they would never see the noindex header.

To put the site back behind the password, set `BASIC_AUTH_USERNAME` and `BASIC_AUTH_PASSWORD` as GitHub secrets first, then set the value to `"false"`, commit and push. Without the two secrets the new deployment fails to start and the platform rolls back.

## Taking a report down

Royce decides what comes down. When Parliament asks for a report to be removed, the site commits to taking it down within 2 working days of the request.

The list lives in the `TAKEDOWN_REPORT_SLUGS` GitHub secret, so it never appears in the public repo. Every deploy copies it into the `web` component's encrypted environment variable. It holds report slugs separated by commas, such as `written-answer-11589,oral-answer-2041`. Spaces around a comma don't matter. Each change works from a phone, in a mobile browser:

1. Copy the report's slug. It is the part of the address after `/reports/` and before any `?`. A slug copied from the address bar with `%23` in it works as it is.
2. Sign in at github.com and open the `roycehoe/hansard` repository, then Settings, then Secrets and variables, then Actions.
3. Tap the pencil beside `TAKEDOWN_REPORT_SLUGS`.
4. Replace the value with every slug already hidden plus the new one, separated by commas. A secret can't be read back, so copy the list from the private note in step 7. Tap Update secret.
5. Open the Actions tab, then the latest CI run on `master`, and tap Re-run all jobs. The checks and the deploy take about 4 minutes. Wait until the `deploy` job shows a green tick.
6. Check that both addresses answer 410. Each command prints the HTTP status of a GET request:
   - `curl -s -o /dev/null -w '%{http_code}\n' https://{domain}/reports/{slug}`
   - `curl -s -o /dev/null -w '%{http_code}\n' https://{domain}/api/reports/{slug}`

   On a phone, open both addresses instead. The page says "Report removed", and the API address shows `report.taken_down`. While public mode is off, each `curl` needs `-u` with the basic-auth username and password, or it prints `401`. A slug with a typo hides nothing, and this check is the only way to see that.
7. Add the slug, who asked and when to a private note kept outside the repo. That note holds the only readable copy of the list. The repo must not record a takedown.

A taken-down report answers 410 on its page and in the API, and its page carries no preview tags. It drops out of search results, its sitting's report list and each person's report list. Counts on `/coverage` still include it. The stored rows do not change. To bring a report back, save the list from the note without its slug.

A deploy restarts the process, which empties the in-memory caches of preview tags and API responses. A browser or proxy can keep its own copy of a page for as long as the response's `Cache-Control` allows.

If an entry holds `/`, `?` or a space, the site does not start and the deployment fails, with the entry's number in the deploy log. The platform rolls back to the last deployment that worked. Fix the secret and re-run the jobs.

If the deploy fails at the build, check the `refresh` image in the deploy log. A hansard deploy builds it from `hansard-scraper` master, so a scraper that does not import blocks every hansard deploy, and the old version stays live.

Change the list only through the GitHub secret. A value saved in the DigitalOcean dashboard lasts until the next push to `master`, whose deploy writes the secret over it and shows the hidden reports again.

## Researchers form

`/researchers` and its footer link appear only when the build has `VITE_RESEARCHERS_FORM_URL` set to the form's address. Put the address in the `VITE_RESEARCHERS_FORM_URL` entry (`scope: BUILD_TIME`) in `.do/app.yaml`, commit, and deploy, which rebuilds the frontend. While it is unset, `/researchers` sends visitors to the home page.
