# Launch strategy: brief

Written 18 October 2026 from a grill session with Royce. It feeds three research answers: how to launch (`launch-q1-launch.md`), how to show the project is not vibe-coded (`launch-q2-credibility.md`), and how to get Parliament's permission (`launch-q3-permission.md`, `launch-q3b-fast-track.md`). Two related files sit in `job-search/research/`: `ogp-swe-roles-2026-10.md` and `heartbeat-bfg-activity.md`.

## Feature description

Royce launches the Hansard website under his own name: a private beta for a named group of ten or fewer, then a public launch once Parliament replies in writing to a request for permission to show the full text and to re-scrape SPRS weekly. The goal of the public launch is resharing: people pass on speech permalinks and MP pages with a quote preview. The reason behind the goal is a software engineering job at OGP. The site complements Pair Search, OGP's Hansard search built with Parliament, by crediting each paragraph to a person and publishing its error rate.

## Resolved terminology

| Term | Canonical meaning |
|---|---|
| The site | The `hansard` web app. Not the dataset. |
| The dataset | The scraper's Postgres database, offered for bulk download only after academics ask for it. |
| Private beta | The site behind basic auth, open to a named list of ten or fewer people written down before the letter is sent. |
| Public launch | The site open to anyone, after Parliament replies. |
| The letter | The written permission request to the Clerk of Parliament at parl@parl.gov.sg, drafted in `launch-q3-permission.md`. |
| Permission (a) | Showing the full Hansard text on a public website. |
| Permission (c) | Re-scraping SPRS on a schedule. |
| Permission (b) | Bulk dataset download. Deferred. |
| Share unit | A speech permalink with a quote preview card, or an MP page. |
| Insight | A fact derived from the record, such as most Parliaments served, shown with its measurement date and the rows behind it. |
| Sample check | A check of sampled rows against the source text. The 13 October check was run by an AI model, and the methods page says so. |

## Decisions

1. The site launches first. The dataset waits for demand, which a "For researchers" page collects through a Tally or Google Form asking for name, institution and intended use.
2. Primary audience: researchers and journalists.
3. Success is resharing. No number was set.
4. No monetisation. Royce wants civic contribution, credibility and academic recognition, and above all a software engineering role at OGP. The research recommends Senior SWE, Applied Experiments, with Anti-Scam second. Royce has not confirmed a role.
5. The skeptics are Parliament officials, academics, journalists, forum commenters and OGP engineers. The concern to answer is data accuracy and upkeep.
6. Both repos go public. History is not rewritten. Work-hours commit timestamps stay; new work happens outside office hours.
7. Royce launches under his own name. No outside-work disclosure for Hansard: his employer accepts side projects.
8. The letter asks for (a) and (c). Par-leh-mate, Royce's earlier project with Jeremy Chia, never asked Parliament. The site calls itself Par-leh-mate's successor and says the two took different directions.
9. Private beta until Parliament replies. The beta list is fixed before the letter goes out, and no new logins are handed out while the request is open, because the letter says the site is shared with a small test group.
10. Silence is not consent. The follow-up schedule is day 21, day 35 and day 56, as in `launch-q3-permission.md`.
11. Royce wants to shorten the wait through a senior contact and will go to events for it. Only the Clerk and the Speaker can grant permission, so informal contacts are asked for advice and introductions, never to lobby. Order: a question to the Pair team through their public support link, then Alwyn Tan for one pointer and permission to use his name, then Royce's MP only if Parliament is still silent around day 35. No letter to the Speaker or a minister.
12. Before the letter, the scraper must behave as the letter says: one request at a time, at least 2 seconds apart, a named user agent with a contact address, weekly runs for new sittings only. This change is on hold until Royce says go.
13. The 15th Parliament is backfilled and the weekly refresh runs unattended, alerting Royce when a run fails. Every page shows a last-updated date.
14. No launch date. Quality comes before speed.
15. Hosting is capped at $50 a month. Search gets a RUM index tested on a database clone plus caching of popular searches, with a 2 GB database for launch week.
16. Royce gives the site 2 to 4 hours a week after launch, aiming for none.
17. The site lives on a subdomain of fancybinary.sg. The final domain is chosen before the public launch and never changes, because ADR 0004 promises permanent URLs.
18. Shared links need a preview tag per page, written by the server, because chat apps do not run JavaScript.
19. The site complements Pair Search. It adds no semantic search and no AI summaries.
20. No insights page at public launch. Each checked fact goes out as a speech permalink, which is the share unit anyway. The rules for any fact:
    - "Spoke the most" counts words per Parliament, leaving out presiding-officer speech, and is shown as a sortable table, never a top-10 headline.
    - "Most" and "first" facts are allowed. "Least" and "absent" rankings are not.
    - Tenure is measured from the first and last sitting a person attended, from the attendance table, and labelled that way. The registry stores only Parliament numbers.
    - Every fact shows the date it was measured and links to the rows behind it. Royce checks it himself before it goes out.
    - The first candidates are maiden speeches and first mentions of a term.
21. No lawyer.
22. Heartbeat and CareCompass are now one team. Usage figures exist and are still to be supplied.
23. Gate C, launch done, is met 30 days after public launch when one person in a public role cites a permalink, chat-app preview bots fetch 20 distinct permalinks, and 10 referring domains appear in GoatCounter. The full plan is `launch-q1-launch.md`.
24. Speech permalinks become `/reports/{slug}?s={ordinal}&q={anchor}`, checked by their opening words on every visit, per the 18 October amendment to ADR 0004.
25. The domain is `hansard.fancybinary.sg`, fixed before the letter goes out because the letter's signature lists it.
26. No STACK ticket for now. Royce first asks the Pair team one question through their public support link.

## Open questions

- The names on the beta list: ten or fewer, including at least one researcher and one journalist.
- Heartbeat usage figures for `job-search/research/heartbeat-bfg-activity.md`.
- When to make the crawler change in decision 12 and send the letter. Both wait on Royce.

## Scenarios

These are proposed handling, not yet confirmed by Royce.

1. A beta tester or journalist finds a paragraph credited to the wrong MP. The corrections path in the letter applies: fix within 7 days, take down within 2 working days on request. The methods page states the sampled error rate, so the error is within what the site already admits.
2. Parliament allows linking and snippets but not full text. The site stays private while Royce decides whether a snippet-and-link version is worth launching under that condition.
3. A link spreads and traffic spikes. Cached popular searches and the 2 GB database carry launch week. Search that still runs past the 30-second timeout is the first thing to fail.

## Out of scope

- Bulk download until academics ask.
- Semantic search and AI summaries.
- Rankings of who spoke least, attendance leaderboards, "most absent" pages.
- Monetisation.
- Government identity marks (ADR 0002).
- Writing to the Speaker or a minister.
- Legal advice.
