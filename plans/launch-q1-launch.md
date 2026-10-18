# Launch plan: private beta, public launch, and getting people to reshare

Written 18 October 2026. Research only. Nothing was changed except this file, nothing was sent or posted, and no database was touched. It builds on `launch-strategy-brief.md` (locked decisions), `launch-q2-credibility.md`, `launch-q3-permission.md`, `launch-q3b-fast-track.md` and `launch-decisions.md`, and does not re-ask what they settle.

Reading rules. Claims backed only by a search snippet, or inferred by me, are marked [unverified]. Hour figures are my estimates for Royce plus tooling. Where I found nothing, I say so instead of filling the gap.

## The short version

1. Resharing depends on one mechanism: a pasted link must show the quote, the MP and the date in the chat app. Today it cannot. The app is a Vite single-page app with one static `<title>Hansard</title>`, and a speech has no address a server can see (ADR 0004 gives it only `#s{ordinal}`, and a fragment never reaches the server). Server-written preview tags plus a speech permalink are the two items that matter most.
2. The cheapest correct place for the tags is the fallback that already exists in `api/middleware/frontend.py`. Every unknown path returns `index.html` from there. Replace that with a function that fills the head per route.
3. The launch is gated by Parliament's written reply, not by features. Build everything below during the wait, then flip one setting.
4. I found little evidence that Singapore newsrooms or academics already use Hansard text as data. The distribution plan therefore leans on Parliament-adjacent civic tech, OGP engineers and a short list of researchers, and treats newsrooms as a cold pitch with three ready permalinks.
5. The current hosting survives a quiet launch week and fails on the first burst of unique searches. Moving the database to 2 GiB and the app to 1 GiB costs about $42 a month, under the $50 cap, and a cache plus a concurrency limit on search matters more than the instance size.
6. Measure resharing by counting chat-app preview fetches of distinct permalinks (from the server, no user data) plus GoatCounter for referrers and copy-link clicks.

## 1. Phases and gates

Day 0 below means the day the letter is sent.

### Phase 0: prepare (now until the letter is sent)

Not a gate for users, but the letter's claims must be true, so these come first.

- Scraper behaves as the letter says: one request at a time, 2 seconds apart, named user agent with a contact address, weekly new-sittings runs. Brief decision 12, on hold until Royce says go.
- Fix the "read by hand" wording on `coverage.methods.tsx` and say model readers did the sample checks (q2, action 1).
- Choose the final domain (section 8). The letter's signature block lists the site address, and ADR 0004 says the domain never changes.
- Write the beta list (ten or fewer names) before the letter goes out. Brief decision 9.

### Gate A: start the private beta

All of these are true:

1. The beta list is written down with ten or fewer names, and the letter has gone out or goes out the same day. The letter says the site is shared with "a small private test group", so the list is closed.
2. Basic auth is on, and the site sends `X-Robots-Tag: noindex`.
3. Q2 actions 1 to 6 are done: wording fix, `hansard` README and LICENSE, scraper status section, corrections path with `VITE_CONTACT_EMAIL` set, how-this-was-built note. The brief's own rule is that these precede any outside viewer.
4. Every page shows a last-updated line (section 2, item 4).
5. The footer no longer links to `/design` and `/palette`, which are developer pages (`app/src/components/layout/SiteFooter.tsx` lists both).

The beta runs from here until Parliament replies. No new logins during that time (brief decision 9).

### Gate B: go public

All of these are true, in this order of importance:

1. A written reply from Parliament covering (a) and (c), kept as a PDF or email on file. Silence is not consent (brief decision 10, `launch-q3-permission.md`, outcome table). If the reply allows only snippets and links, the site stays private until Royce decides whether that smaller site is worth launching (brief scenario 2). Any condition in the reply is met and quoted on the About page.
2. The 15th Parliament is backfilled and the weekly refresh has run unattended at least three times, including one deliberate failure that sent Royce an alert (brief decision 13). The corpus currently stops at 8 April 2025 (scraper README); a launch that says "up to April 2025" in October 2026 reads as abandoned.
3. A human check of 100 rows against the Official Report is published beside the model-read figures (q2 action 4). It is the main answer to "who checked".
4. The build list items 1 to 7 in section 2 are shipped, and the takedown path (section 9) has been tested once by hiding a report and reloading.
5. The load test in section 6 passes.
6. The preview tags render correctly in WhatsApp, Telegram, LinkedIn and X on the real domain. This can only be checked after auth comes off (see section 2, item 1), so gate B includes one quiet hour on the public site before any announcement.
7. Insights: the page ships only if the open rules are settled. My view is that it does not ship at launch. Section 5 gives hand-checked facts that do the same job with less risk.
8. Royce can keep the 2 to 4 hours a week promise. If the weekly refresh needs more than a failure alert, it is not done (brief decision 16).

### Gate C: call the launch done

The brief set no number for resharing (decision 3). I propose these for Royce to accept or change. Review at day 30 after public launch.

1. At least one person in a public professional role (journalist, academic, civil servant, OGP engineer) has linked or cited a speech permalink. One is enough; it is the evidence that matters for the OGP goal.
2. At least 20 distinct permalinks were fetched by chat-app preview bots in the first 30 days, and at least 10 distinct referring domains appear in analytics (section 7). These are small numbers on purpose.
3. No wrong fact older than 7 days is open on the corrections log (letter commitment).
4. The weekly refresh ran four times with no manual step.
5. Time spent was 4 hours a week or less in weeks 2 to 4.
6. Royce has written the one-page account of the launch (what was tried, what happened, what he would change) for the OGP application. This is the real output of the project.

If gate C passes, stop launching and go into maintenance. If it fails on item 1 after 30 days, send the three best permalinks to the researchers' list again and do nothing else.

## 2. Build list before public launch, ranked by reshare effect per hour

Ranked by how much each item raises the odds that a link gets passed on, per hour of work. Items 1 to 7 are the gate B set.

| Rank | Item | Hours | Why it ranks here |
|---|---|---|---|
| 1 | Server-written preview tags per page | 4 to 6 | Without it every shared link shows "Hansard" and nothing else. |
| 2 | Speech permalink page | 6 to 8 | The share unit in the brief. It also needs the preview work. |
| 3 | Public mode switch and takedown list | 2 | Not about resharing, but the site cannot go public or be pulled back without it. |
| 4 | Last-updated lines | 2 | Journalists and academics ask "as of when". Cheap trust. |
| 5 | Report-an-error link with the permalink filled in | 1 | Turns a viral error into a fix. Q2 action 5. |
| 6 | "For researchers" page with a form | 1 to 2 | Collects demand for the dataset, which the brief says must come first. |
| 7 | Copy link and cite buttons on a speech | 2 | A cite button gives journalists the exact line they paste. A speech copy action bar already exists (`ActionBarSpeechCopy`), so this extends it. |
| 8 | Preview-bot counter and analytics | 2 | Needed to know whether anything worked. |
| 9 | Generated quote image per speech | 5 to 8 | Raises click-through in LinkedIn and X. Ship after launch if time is short. |
| 10 | Sitemap and robots for people and sittings | 1 | Slow payoff. Do not list speech URLs. |

### 1. Per-page preview tags written by the server

Why the server must do it: WhatsApp, Telegram, Slack, LinkedIn and X fetch the HTML and read the head; they do not run JavaScript. Several guides say a client-rendered app leaves the crawler with an empty head, and give "view source, not DevTools" as the test ([DEV Community](https://dev.to/ctrlzed/link-preview-not-showing-fix-it-on-whatsapp-x-linkedin-1l25), [abacktools](https://abacktools.com/blog/whatsapp-open-graph-tags)) [unverified, third-party guides]. LinkedIn has a Post Inspector for checking the result.

How, inside the one container in `launch-decisions.md`:

1. `api/website.py` mounts `FrontendFiles` at `/`. `api/middleware/frontend.py` already catches every 404 and returns `index.html`. That is the hook. Subclass or replace `get_response` so that for a known route pattern it reads `index.html` once at startup, replaces a marker with generated tags, and returns an `HTMLResponse`. For everything else it behaves as now.
2. Add one marker comment in `app/index.html` head, for example `<!--meta-->`, and a default tag set (site name, a generic description, the static card image) so any route without a dedicated handler still shows something sensible. Keep the existing static `<title>` out so there are not two.
3. Route patterns and what each emits:
   - `/reports/{slug}`: title "{Report title}, {sitting date}", description "Official Report extract" plus the first 150 characters of the first speech.
   - `/reports/{slug}` with `?s=12`: the speech permalink. Title "{Speaker}, {date}", description the quote at a sentence boundary, up to about 200 characters.
   - `/people/{id}-{slug}`: title "{Name}", description "Speeches in the Hansard, {first year} to {last year}, {n} Parliaments", no ranking text.
   - `/sittings/{date}`: title "Sitting of {date}", description the report count.
   - `/`, `/coverage`, `/coverage/methods`, `/researchers`: fixed text.
4. Tags: `<title>`, `<meta name="description">`, `og:title`, `og:description`, `og:url` (absolute, canonical), `og:type`, `og:site_name`, `og:image` (absolute, 1200 by 630), `twitter:card` set to `summary_large_image`. All dynamic values go through `html.escape`. Quote text comes from the database, so an unescaped quote mark would break the head.
5. Data access: the handler needs one speech and its report title, not the whole report. `get_report` loads the full report, which for a budget debate is hundreds of speeches. Add a small query for "one speech by report and ordinal". Cache the rendered tags in memory for an hour with a size limit. The data changes weekly, so staleness is not a problem.
6. React still mounts and renders as before. Nothing in the single-page app changes except the marker comment. After hydration the client may set `document.title` itself; that is optional.
7. Crawler gotchas: previews are cached after the first fetch, so a bad first fetch sticks (the usual workaround is a `?v=2` query parameter); use absolute https URLs; keep the image small, since one guide reports a 300 KB WhatsApp limit that I could not confirm [unverified]; do not block the preview user agents (WhatsApp, facebookexternalhit, Twitterbot, LinkedInBot, TelegramBot, Slackbot) in any firewall.
8. Beta consequence: basic auth sends crawlers a 401, so previews will not work for beta testers. Test locally with `curl -A "WhatsApp/2" http://localhost:8080/reports/...` and read the head. Treat the real-app check as part of gate B, and the quiet hour on the public site as the real test. If Royce wants beta testers to see previews, the only way is to exempt the preview user agents from auth, which exposes the quoted snippets to anyone who spoofs the agent. I recommend against it, because it weakens the letter's "behind a password" sentence.

My view on the image: ship a single static card first (site name and the words "Singapore Parliament record") and put the quote in `og:description`. All the chat apps show the description. Generate a per-speech image (Pillow, quote text, speaker, date, cached) after launch if the numbers say LinkedIn and X matter.

### 2. The speech permalink page

ADR 0004 says a speech has no permanent URL of its own. Its link is the report URL plus `#s{ordinal}`, and the page says speech links are best-effort, because a re-parse can renumber the speeches in a report. The amendments of 14 and 17 October move that note to "Citing and linking" on `/coverage/methods`. Two problems follow for sharing:

- A fragment never reaches the server, so no preview can name the speech.
- A shared link that later points at a different paragraph is the worst failure this site can have, because the quote in the chat no longer matches the page.

Proposal, for a new ADR 0004 amendment (the third) that Royce approves before code:

1. The permalink is `/reports/{slug}?s={ordinal}&q={anchor}`. `anchor` is the first 8 words of the paragraph, lowercased, in the URL. The server and the page use both.
2. On load, the server checks that paragraph `ordinal` starts with `anchor`. If yes, it serves that speech, with the preview tags built from it. If no, it searches the report for the anchor. If it finds one, it serves that paragraph and shows "This paragraph moved after an update". If it finds none, it serves the report with "The paragraph this link pointed to is no longer in this report" and no quote in the preview.
3. The preview tags use the same check, so the quote in a chat card always matches the page behind it, or the card shows no quote.
4. Keep `#s{ordinal}` working for old links and for scrolling.
5. Rule for the About page: report, sitting and person links never change; a speech link is verified by its opening words on every visit and says so when it cannot be.

What this costs: about 6 to 8 hours, an ADR amendment, and a rewrite of the "Citing and linking" paragraph. Weekly refresh does not renumber existing reports, because `populate_speeches` only parses reports that have no rows (scraper README, known limitations), so renumbering comes only from a targeted rebuild, which the verified-or-flagged check covers.

The brief says permalinks and MP pages are the share unit. This item is what makes the first half true.

### 3. Public mode switch and takedown list

`WebsiteSettings` requires `basic_auth_username` and `basic_auth_password`, and the site does not start without them (`api/settings.py`, `launch-decisions.md`). Going public therefore needs a code change, not just a deploy. Add `PUBLIC_MODE=true` that skips the auth middleware, and make the reverse (set it false, redeploy) the kill switch. Add a plain text file of hidden report slugs and speech anchors that the website layer answers with HTTP 410 and no preview, so Parliament's "remove within 2 working days" promise (the letter) is a one-line edit and a redeploy, with no database write. This respects ADR 0001 (the API stays read-only).

### 4. Last-updated lines

Brief decision 13: every page shows a last-updated date. Today only `/coverage` does, from the hand-edited constant `COVERAGE_LAST_UPDATED = '2026-10-14'`. Put one line in the footer: "Includes sittings up to {latest sitting date}. Checked weekly. Last checked {date}." The latest sitting date comes from the database through a small API field; the "last checked" date comes from the refresh job writing its run time to a table in the scraper, read by the API. The line must be correct after a run that finds no new sittings, which is why it needs the run time and not only the latest sitting. Q2 action 10 (numbers from one source) is the same change; do both together.

### 5. Report-an-error link

On each speech, a link that opens a pre-filled email to the contact address (set `VITE_CONTACT_EMAIL`) with the permalink and report id in the body, and a GitHub issue template for "Wrong speaker or missing text". Start `docs/corrections.md`. It is Q2 action 5, and it is the safety valve for sections 5 and 9.

### 6. "For researchers" page and form

A page at `/researchers` with: what exists (the site, the error figures, the methods), what does not (no bulk download yet), and a form. Use Tally rather than a Google Form so respondents do not need a Google account (Tally's free-tier limits: [unverified], check before relying on it). Fields: name, institution, intended use, email, "may I contact you about this", and "how did you hear about this". One line under the form saying what it is used for and that it is read by Royce only; Singapore's PDPA applies to collecting names and emails, so check the PDPC guidance before launch (https://www.pdpc.gov.sg). State plainly that bulk download waits for demand and for Parliament's permission (the letter does not ask for (b)).

### 7. Copy link and cite buttons

Add to the speech action bar: "Copy link" (the verified permalink above) and "Cite", which copies one line: "{Speaker}, {Report title}, Official Report, {sitting date}. Parliament of Singapore. Retrieved from {permalink} on {today}. Original: {SPRS link}". Journalists need to quote safely and verify (q2, skeptic section). Fire a custom event when either is used (section 7).

### 8 to 10

Item 8 is section 7. Item 9, the quote image, is a post-launch candidate. Item 10 is a sitemap listing people and sittings only. Do not list speech URLs, because the pages are many and the permalinks are for people, not crawlers.

### Not to build

Semantic search, summaries, accounts, comments, newsletters, rankings of "least" or "absent", an insights page, bulk download. Brief, out of scope.

## 3. What the beta should test

Two questions, three users. The OGP Applied Experiments posting asks for testing assumptions with users (as you described it; I could not retrieve the posting, and a search found only a general statement that OGP tests prototypes with real users [unverified]). So each question below names an assumption, an observation and a pass line, and Royce records what he sees, not what people say.

Pick three from the list of ten: one journalist or researcher, one engineer from the civic tech circle, and one ordinary reader who uses chat apps daily and is not in tech. They must already be on the list.

### Question 1: will someone pass on a speech?

Assumption: people who find a speech they care about will send it to someone.

Test (20 minutes, screen share, Royce watches): "Find something an MP said that you would send to one person you know. Then send it." Ask them to send it to Royce in the chat app they actually use.

Record: time to find a speech (pass: under 5 minutes), whether they used search or an MP page, whether they sent it, and what the preview looked like on arrival. Because basic auth blocks previews in beta, Royce shows what the card will look like from a local run and asks whether they would have sent it with that card. Ask last: "What would you have written with it?" The words people add to a link are the best signal for the first-week copy in section 5.

### Question 2: will a researcher trust it enough to quote?

Assumption: a journalist or researcher will quote a paragraph credited to a named MP if they can verify it in one step.

Test: open a speech page for the journalist or researcher and ask "What would you do before quoting this?" Do not point at anything. Watch whether they click the Official Report link, the "Unofficial transcript" popover or the methods page, and where they stop.

Record: whether the Official Report link is found without help (pass: within 1 minute), what they say they would need to see checked, and whether the stated error rate helps or alarms them. Ask last: "Would you trust a number like 99.5% linked, and what would you need to believe it?"

Do not ask whether they like it. Do not hand anyone a login outside the list. Write the results in half a page. This is also the material for the OGP write-up.

## 4. Distribution in Singapore after permission

Rule from `launch-q3b-fast-track.md`: no public posting while the request is open. Everything here starts after the written reply.

### Who writes about Hansard or parliamentary data (found, with links)

I searched for named Singapore outlets and academics that have written about Hansard or parliamentary data. The yield was thin, and I name only what I could tie to a page.

| Who | What they did | Link | Use |
|---|---|---|---|
| RICE Media, Sean Lim | "Singapore Parliament Unpacked" series, first piece "What is the Hansard?", 19 November 2021. Explains Hansard as a way to gauge MPs. Fetched and read. | https://www.ricemedia.co/singapore-parliament-unpacked-hansard/ | Warmest newsroom target. A series on how to read Parliament has a reason to cover a tool that does it. |
| Mothership | 2016 article on a portal built by SMU Masters in Information Analytics students (Michael Ng named) to judge MPs in the 12th Parliament. Fetched. The portal covered one Parliament and may not be maintained. | https://mothership.sg/2016/03/heres-how-you-judge-how-hardworking-your-mp-was-in-singapores-12th-parliament/ | Evidence that this outlet covers such a tool. Not evidence it will now. |
| Par-leh-mate talk, MDS FEST 3.0 (Jonah Foong, Jeremy Chia, Royce Hoe) | Talk on a structured dataset of Singapore's parliamentary speeches | https://www.secoda.co/mds-fest-3-0/building-and-analysing-a-structured-dataset-of-singapores-parliamentary-speeches---par-leh-mate | Your own prior work. |
| University of Chicago thesis, June 2023 | Word embeddings on Singapore parliamentary speeches 2012 to 2021, around the 2013 Little India riot. Restricted. Author not confirmed. | https://knowledge.uchicago.edu/records/szmgn-7y238 | Shows researchers want this text. Do not contact the author. |
| SAGE Research Methods case study (LaSalle College of the Arts publication page) | Discourse analysis of online Hansard debates for an education policy study | https://ww4.lasalle.edu.sg/publications/contextualizing-historical-education-policy-formation-through-the-use-of-online-access-to-parliamentary-debates-managing-documentary-data/ | Shows qualitative researchers use Hansard by hand. [unverified: page read in search snippet only] |
| Dr Elvin Ong, NUS Department of Political Science | A 2019 Michigan State event page says he was working on "legislative speech in Singapore". Current role and work are not confirmed. | https://polisci.msu.edu/news-events/events/past-events/ong-elvin.html | A named academic with a stated interest. [unverified, 2019 snippet]. Check the current NUS page before writing. |
| NUS Libraries Hansard guide | Library guide that points to SPRS | https://libguides.nus.edu.sg/SGlawhistory/hansard | A librarian can add a second link after permission. [unverified, snippet] |
| Pair Search (OGP and Parliament) | Parliament newsroom announcement, 13 August 2024 | https://www.parliament.gov.sg/newsroom/events/details/ai-powered-search-engine-for-singapore's-hansard-reports | Not a target. The comparison to make. |

What I did not find: any Straits Times, CNA or Mothership data piece built on Hansard text, or a published political science study of the full Singapore Hansard corpus. The searches returned commentators quoted on parliamentary debates (for example ISEAS researchers in 2017 coverage and an SMU law academic in 2011 [unverified snippets]), but being quoted on a debate is not evidence of using Hansard as data, so I do not list them as targets. Royce should build the newsroom list himself from bylines on parliament coverage. I will not name journalists I could not verify.

### Channels and what to post

Plain rule for all of them: lead with one checked fact and its permalink, then one line saying who built it, that it is unofficial, and that it publishes its error rate. Never lead with "I built a website".

| Channel | Audience | Post | Notes |
|---|---|---|---|
| Your own circle and the beta users | Warm | A message with one permalink each person likes | First, to catch broken cards before strangers see them. |
| Pair team (public support link) | OGP engineers | A short thank-you with the URL, no ask | Already approached on days 1 to 14 (q3b). Courtesy, not promotion. |
| LinkedIn, Royce's own profile | Engineers, OGP, civil service, researchers | One fact, the permalink, three lines on method, link to the audit that fails the project | Written without any job-search signal. The `linkedin-voice` skill refuses those. The how-this-was-built disclosure goes first, since commenters will find the AI use in minutes (q2). |
| Researchers' short list (5 to 10 named people with public research on Singapore politics, plus the NUS, SMU and LKYSPP librarians) | Primary audience per the brief | A four-line email: what it is, error rate with method, 2 permalinks from their period of interest, the form | Individual, not a mailing list. Public professional roles only. |
| Newsrooms (ST, CNA, Mothership, RICE, and any data desk): the same note to each, at the same time | Primary audience per the brief | Three checked permalinks, the error rate, the permission line, contact | Neutral by construction: same note, same hour, no exclusive. |
| r/singapore and r/askSingapore (reddit.com) | Wide public | A post titled with the fact, permalink in the body, a comment explaining the build | Read each sub's self-promotion rules first. I did not fetch them [unverified]. Be ready for the "AI slop" comment with the README link. |
| Hacker News, "Show HN" | Engineers, mostly non-Singapore | Only if the README is ready. Title is the project, text is the audit | Optional. It is where the code-quality skeptics are, which matches the OGP goal, but the traffic is not Singapore readers. |
| STACK Telegram group and hackerdrinks / Heartbeat circles | Civic tech, public officers | A short show-and-tell, posted as yourself | q3b rule 5: do not use these brands as backing. Ask a group admin before posting. |
| HardwareZone EDMW, general Telegram groups | Broad, political, fast | Skip at launch | High risk for a site about politicians, little control over framing. Revisit after week 4 only if people there already share the links. |
| Student societies (political science, law, public policy, debate; Singapore Model Parliament run by REACH, as in q3b) | Students | One email to each society's public contact with two permalinks | I did not verify society names or contacts. Find them in each university's club directory. Research-institute talks (IPS, as in q3b) are a later step, not launch. |

### Order

- Day 0 (written reply received): re-read the reply, add its conditions to the About page, set `PUBLIC_MODE`, check previews on the live domain in WhatsApp, Telegram, LinkedIn and X. Wait one day.
- Day 1: thank the Secretariat with the URL. Parliament should hear first, not read it in the press. Then message the beta users and your own circle with one permalink each.
- Day 2: Pair team courtesy note.
- Day 3: LinkedIn post, and the researchers' emails, in the same morning.
- Day 4: newsroom note, same text to every outlet.
- Day 5: r/singapore post with one fact. Pick a weekday evening Singapore time, since the audience is local.
- Day 7: optional Show HN, only if the first week had no wrong fact.
- Weeks 2 to 4: one permalink a day from section 5, on LinkedIn only. Answer every email within two days. Do not chase.

## 5. First-week content plan

Five to ten facts or permalinks, one per day. I did not query the database, so I give types and a procedure, not final picks. Royce picks the actual speeches.

### How to pick

A good item is neutral, checkable in one lookup, and a "first" or a "most" with a date. It names no living private person and says nothing about a current dispute. Spread it across parties and decades, so no one reads the week as a position. Avoid anything depending on the parser's judgment where it is least reliable: chairs in Committee of Supply, deputy speaker days, and anything in the 654 reports with no speeches or the 2,078 reports whose rows lag the parser (scraper README, known limitations).

Slots:

1. The first sitting in the archive, 22 April 1955, and one speech from it. The date is in the README.
2. A maiden speech by a current MP from the governing party.
3. A maiden speech by a current MP from an opposition party.
4. First mention in the archive of a word from the 1960s or 1970s that people still use (a housing or transport term).
5. First mention of a technology word from the 1980s or 1990s.
6. First mention of a recent word (a 2010s or 2020s term).
7. A well-known speech by a former Prime Minister or minister, for a quote with historical standing. Choose from the person's own page, not from a search for something quotable.
8. Optional: the first recorded speech in a Parliament where a new office or title appears.

Do not ship "most Parliaments served" or any tenure count in week one, because the registry stores only Parliament numbers (brief, open question on insights). Do not ship word counts or "longest speech", because they depend on the parser.

First-mention wording must say "first mention in the Hansard held by this site", with the measurement date and the corpus end date, never "first time anyone said it". Pick words that are rare enough to avoid the oldest-first timeout on common words described in `launch-decisions.md`.

### How Royce checks each one himself

For every item, before it is posted:

1. Open the permalink and read the whole paragraph and the paragraph before and after it.
2. Open the Official Report on SPRS (the "Official Report" link) and find the same paragraph. Confirm the speaker name, the date and the report title word for word.
3. For a "first" claim, search SPRS itself for the word, oldest first, and compare its earliest hit with the site's. If SPRS finds an earlier one, drop the item. If SPRS search is too limited to say, soften the line to "first in this archive" or drop it.
4. For a maiden speech, confirm the MP's first sitting from the person page and the parliament.gov.sg member page. If a speech looks earlier than the one you chose, drop it. A "maiden speech" claim needs the MP's whole record, and one missing earlier report breaks it.
5. Check the surrounding text for a trap: a speaker label that says "Mr Speaker" in a committee, or an unlinked paragraph credited by position.
6. Write a line in `docs/launch-facts.md`: date, permalink, what was checked, what he found. Commit it. This is the checkable trail and it answers the "who checked" question.
7. Ask one other person to repeat steps 1 to 3 on two of the items. Name them, and say in the post if a second person checked it.
8. Post the quote as it appears, with an ellipsis only at a sentence boundary. Never cut a clause that flips the meaning.

Shared items are not random samples. The sampled linking rate of 404 of 406 (q2) describes typical rows. An item picked because it is notable is more likely to sit in the tail, for example a chair or deputy speaker case. A 99.5% average gives no comfort for a hand-picked item, so every shared item gets a full check, not a sample.

## 6. Launch-week load

Figures from `launch-decisions.md`, `.do/app.yaml` and DigitalOcean's pricing pages.

### Current setup

- App: one container, `apps-s-1vcpu-0.5gb`, one shared vCPU, 512 MiB, 50 GiB a month bandwidth, $5 ([App Platform pricing](https://docs.digitalocean.com/products/app-platform/details/pricing/)).
- Database: about 1 GiB of RAM, `shared_buffers` 189 MB, `effective_cache_size` 568 MB. A 1 GiB single node costs about $15.15 a month ([managed database pricing](https://www.digitalocean.com/pricing/managed-databases)). Total today: about $20.
- Search after the rum index: relevance 0.12 to 6.28 s across 12 shapes, newest first 0.03 to 2.6 s, oldest first 0.25 to 18.7 s for nine of ten shapes and 34.7 s for "government". The API timeout is 30 s. The count query runs 0.23 to 1.47 s.

### Will it survive a spike

A quiet launch week, yes. Reports, people, sittings and static files are cheap. Search is not. Think in the unit that matters: a link on r/singapore that reaches a few thousand people in a few hours is about one page load every few seconds on average [my estimate], which any shared vCPU serves. The failure comes from unique searches. Curious visitors type names and words nobody has typed before, so a cache of popular queries does not help them. On a 1 GiB database a 3 to 6 s relevance search occupies the one vCPU for that time, so ten visitors searching at once queue behind each other, and the 30 s timeout then turns slow into broken. Brief scenario 3 says the same: search that runs past the timeout is the first thing to fail.

Second failure: the database connection limit. I did not find the limit for the 1 GiB plan and the API's pool size is not in what I read. Check both before launch [unverified].

Third: report pages for long debates load every speech. A thousand visitors on one Budget debate means a thousand large responses.

### What to change within the $50 cap

| Change | Monthly cost | Effect |
|---|---|---|
| Database 1 GiB to 2 GiB single node | $30.45 (from $15.15) | The brief's launch-week plan. More of the 879 MB speech table and the 222 MB rum index stay cached, so fewer cold reads. |
| App to `apps-s-1vcpu-1gb` | $12 (from $5) | Memory for the cache below, 150 GiB bandwidth. |
| Total with both | about $42.45 | $7.55 under the cap. |
| 4 GiB database | $60.90 | Breaks the cap. Do not. |
| Bandwidth overage | $0.02 a GiB | A spike of 100 GiB extra costs $2. Not a risk. |

Two cautions: DigitalOcean notes that from 30 November 2026 new Standard clusters cannot use plans above 4 GiB, which does not affect this; and I could not confirm whether a managed database can be resized down after launch week, so check before upsizing, or the "2 GiB for launch week" plan may become permanent at $30.45 [unverified].

No-cost changes that matter more than the instance:

1. Concurrency limit on search. Allow three searches at once; a fourth gets an immediate "busy, try again in a moment" answer. A fast polite refusal beats a 30 s hang.
2. A response cache for report, person and sitting pages and for the preview tags, in memory, TTL 1 to 24 hours (the data changes once a week), cleared on deploy. Add `Cache-Control: public, max-age=3600` on GET API responses so any proxy can help.
3. A cache of the top 200 search strings, filled by a script that runs after each refresh. Cheap, and it covers the queries the posts themselves will suggest ("housing", "CPF", the words in the week-one facts).
4. Lower the search statement timeout from 30 s to 10 s for visitors. A search that cannot answer in 10 s will not answer in 30, and holding a connection for 30 s is what hurts other users. Keep the message that suggests newest first.
5. Cloudflare's free plan in front of the domain, for static files and cacheable pages. This adds a third party in the path, which Parliament may ask about. Free plan terms: [unverified]. I would add it only if the load test fails.
6. An uptime monitor and an alert on CPU and database connections. DigitalOcean has alerts; email only.

Load test before gate B. Royce runs it, since I did not connect to anything. Use `hey` or k6 from his laptop against a staging copy of the container with the production database cloned (`launch-decisions.md` already uses a clone for rum). Shape: 20 concurrent users for 5 minutes, 70% permalink and report pages, 20% search from a list of 50 real queries including 10 you expect to be unique, 10% people pages. Pass: p95 under 3 s for non-search pages, zero 5xx, search either answers or refuses fast, database connections stay under the limit.

Not for launch: the sitting-date column on `speech` and a rum index carrying it, which would fix oldest-first on common words. It is a schema change and a remote write, so it waits for Royce (`launch-decisions.md`, "Not decided here"). Meanwhile, the timed-out message for oldest-first on the ten common lexemes is an acceptable known limit if stated on the methods page.

## 7. Measuring resharing without invasive tracking

Recommendation: GoatCounter, hosted, free.

Why: its own site says it identifies unique visits without cookies, does not track personal data, needs no GDPR notice, records referring sites and campaigns, and is free for reasonable public use; the software is open source and can be self-hosted for any purpose ([goatcounter.com](https://www.goatcounter.com/)). No upkeep, no cost, nothing running in the container. Alternatives: Plausible Cloud starts at about $9 a month after a trial and its self-hosted edition needs far more memory than the app has (one comparison puts it near 1.8 GiB against 400 MiB for Umami) [unverified, comparison articles: [vemetric](https://vemetric.com/blog/plausible-vs-umami), [toolradar](https://toolradar.com/guides/best-self-hosted-analytics)]. Umami would mean running another service, which breaks the 2 to 4 hours a week promise. Skip both.

Turn it on at public launch, not in the beta, and add one line on the About page saying what it counts. Leave it off during the beta so the letter's account of a small private group stays simple.

The limit of any analytics here: WhatsApp, Telegram and Signal remove referrers, so most real sharing shows up as "direct". Add the measures below, which fill that gap.

What to count, weekly, in a table in `docs/launch-metrics.md`:

1. Preview-bot fetches of distinct permalink URLs. In the preview-tag handler, when the user agent names a known preview bot, increment a counter keyed by day, bot name and path. Store no IP and no query beyond the path. Each fetch means somebody pasted that link into a chat or a post, so distinct URLs fetched per day is the closest honest count of shares. It overcounts people who paste and do not send, so call it an upper bound. About 2 hours including the table.
2. Copy link and cite clicks, as GoatCounter events.
3. Referring domains and top landing pages from GoatCounter. Landing pages show which permalinks and MP pages carry the traffic.
4. Mentions, by hand: once a week search Reddit, LinkedIn and X for the domain name. Note any outlet or researcher link. This is also gate C item 1.
5. The "how did you hear" field on the researchers' form.

No fingerprinting, no per-user identifiers, no session replays, no ad pixels. Do not read chat-app share counts from the apps themselves; there are none to read.

## 8. Naming

Brief decision 17: a subdomain of fancybinary.sg, chosen before public launch and never changed (ADR 0004). I add one deadline: choose it before the letter, since the signature block lists the site address and Parliament will see the name.

| Option | For | Against |
|---|---|---|
| `hansard.fancybinary.sg` | Shortest. It is the word people use, and the parent domain shows it is a personal project, which supports ADR 0002 (the site must not pass as official). Easy to say aloud and to type from a chat. | "Hansard" alone can read as the UK record in a global context. The preview title fixes this ("Singapore Hansard"). |
| `sghansard.fancybinary.sg` | Says Singapore in the link itself, which is what the chat preview shows under the card. Hard to confuse with other countries. | A little longer. "sg" twice, once in the parent domain. |
| `record.fancybinary.sg` or `parl.fancybinary.sg` | Short and neutral. | Does not say Hansard, so it is poor for finding it. `parl` echoes `parl.gov.sg`, which makes it look official. Avoid `parl`. |

My view: `hansard.fancybinary.sg`. The search term people already use is the name, the preview carries "Singapore" in the title, and the parent domain does the work ADR 0002 wants. `sghansard` is a fair second if Royce prefers the country in the link. Do not use `parl`. Whatever he picks, test that the `ondigitalocean.app` address redirects to it with a 301 once the custom domain is live, so any earlier link keeps working.

I did not check that `fancybinary.sg` and the subdomains are under Royce's control or whether any trademark use of "Hansard" applies. The word is the name of a record type used worldwide, and the brief says no lawyer. Mention the name in the letter and see whether Parliament objects.

## 9. Risks

### A wrong fact spreads

This is the main risk, and the one the site's value depends on.

- Before: the section 5 checklist for every shared item, with a trail in `docs/launch-facts.md`. The verified-or-flagged permalink (section 2, item 2) stops the other bad failure, a quote that no longer matches its page.
- During: the corrections path from the letter. Fix within 7 days; a wrong speaker credit that has spread gets a same-day fix because the fix is one entry. Reply under the original post with the corrected link, do not delete the post, and add a line to `docs/corrections.md` with the date, report and change. If the error is in a quote, change the permalink page to say what changed.
- After: add the error to the sample frame so the published error rate moves. The site already admits an error rate on the methods page (brief scenario 1), which is what makes a visible fix look like process and not scandal.
- Do not argue in comments. Use one template: "Thanks, checked, the credit was wrong, fixed here [link], logged here [link]."
- Under Singapore's law on online falsehoods, a false statement of fact can draw a correction direction (the Protection from Online Falsehoods and Manipulation Act). I did not research this and the brief says no lawyer. It is a reason to be conservative about what is posted, not a reason to look for a lawyer. [unverified]

### Political sensitivity

- Any site about what politicians said gets read as taking sides, whichever side the first viral quote helps. The brief removes the worst cases: no "least" or "absent" rankings, no leaderboards.
- Keep the preview text strictly verbatim: no summary, no headline, no adjectives. The card says who, when and what was said, in that order.
- Week-one facts are neutral by rule (section 5): same treatment for governing and opposition MPs, no current disputes.
- Send the newsroom note to every outlet at the same time, and do not give anyone an exclusive.
- Do not launch within an election period or by-election. I did not research the election advertising rules; check the Elections Department's guidance before choosing the day [unverified].
- Do not comment on current events from the site's channels. The About page says what it is: an unofficial reading surface.
- If an MP or party asks for removal, treat it as a request to Royce, not to Parliament. The letter commits to remove items Parliament asks for; it does not commit to remove items an MP asks for. Decide that rule now and put it on the About page. My view: the record is the record, and a private request is answered with the same corrections process as anyone else.

### Takedown

- Parliament can refuse or withdraw permission (clause 6, "without declaring reason(s)"). The letter promises removal within 2 working days on request.
- Build the hide list and the `PUBLIC_MODE` kill switch (section 2, item 3) and test them before launch. Add a line to the runbook: who, where the file is, how to redeploy, how to purge the cache.
- Keep Parliament's contact details and the reply letter in one place. If asked to remove everything, set auth back on first, then talk. Do not argue publicly.
- Posts and links already out will 410 or show nothing, which is acceptable. The failure to avoid is a preview still showing a quote after the page is hidden: the hide list must apply to the preview handler too, and the cache must be cleared on redeploy.
- Do not launch on silence (brief decision 10). Taking something down is far worse than not launching.

### The Pair overlap

- Pair Search is OGP's tool, built with Parliament, and OGP is where Royce wants to work. Reading the site as a rival is the risk. Reading it as a complement is the brief's position (decision 19).
- Say it in one sentence on the About page, in the README and in every pitch: "Pair Search searches by meaning and summarises. This site credits each paragraph to a person, links it to the Official Report and publishes its error rate." Link to Pair Search from the About page, with "for search by meaning, use Pair Search". Pointing at the official tool disarms the "why does this exist" comment before it is typed. Q2 action 13 asks for the same paragraph; check Par-leh-mate's current state before describing it.
- Never claim to be better, faster or more accurate than Pair. Pair shows no accuracy figures on the pages I read (q2), but a comparison would still read as an attack.
- Never use Pair's name as a source of support (q3b risk 3 and 5).
- If Pair adds speaker attribution later, the site's niche shrinks. For the OGP goal that outcome is not a failure, because the evidence of ownership, measurement and honesty (q2) travels with Royce. Put that in the day 30 write-up.

### Other risks worth one line each

- Looking vibe-coded on day one. The disclosure goes first, in the README and in Royce's first comment (q2, "How to talk about AI use").
- Launching before the 15th Parliament is in. The corpus ends April 2025 and the first reader will ask why. It is gate B item 2.
- Breaking the letter. Any public post before the reply, or a login handed to an eleventh person, contradicts the sentence the letter rests on (q3b, risk 4 and 7).
- Burnout. The refresh must alert on failure and otherwise leave Royce alone. If a launch week takes a week, say so on the day 30 note and do less in week five.

## Open questions for Royce

1. Do you accept the gate C numbers in section 1, or do you want to set your own? Recommendation: accept them. They are small and tied to the OGP goal.
2. Do you approve the third ADR 0004 amendment (speech permalink with a verified opening-words anchor)? Recommendation: yes, it is the only version that does not break the permanence promise.
3. Which three beta users, and which one is the journalist or researcher? The list must exist before the letter.
4. Is `hansard.fancybinary.sg` your choice? It needs to be final before the letter.
5. Insights page at launch? Recommendation: no, ship the hand-checked facts in section 5 instead.

## Sources

Fetched and read: https://www.ricemedia.co/singapore-parliament-unpacked-hansard/ ; https://mothership.sg/2016/03/heres-how-you-judge-how-hardworking-your-mp-was-in-singapores-12th-parliament/ ; https://docs.digitalocean.com/products/app-platform/details/pricing/ ; https://www.digitalocean.com/pricing/managed-databases ; https://docs.digitalocean.com/products/databases/postgresql/details/pricing/ ; https://www.goatcounter.com/

Search snippets only [unverified]: https://knowledge.uchicago.edu/records/szmgn-7y238 ; https://ww4.lasalle.edu.sg/publications/contextualizing-historical-education-policy-formation-through-the-use-of-online-access-to-parliamentary-debates-managing-documentary-data/ ; https://polisci.msu.edu/news-events/events/past-events/ong-elvin.html ; https://libguides.nus.edu.sg/SGlawhistory/hansard ; https://dev.to/ctrlzed/link-preview-not-showing-fix-it-on-whatsapp-x-linkedin-1l25 ; https://abacktools.com/blog/whatsapp-open-graph-tags ; https://vemetric.com/blog/plausible-vs-umami ; https://toolradar.com/guides/best-self-hosted-analytics

From the other plans in this folder: Parliament newsroom on Pair Search, the MDS FEST 3.0 Par-leh-mate talk, and the OGP and Parliament pages listed in `launch-q3b-fast-track.md`.

Not found: the OGP Applied Experiments posting (careers.open.gov.sg pages were not reachable by search), any Singapore newsroom data piece built on Hansard text, and named student societies.
