# Launch permission plan: written permission from Parliament of Singapore

Prepared 2026-10-18. This is research, not legal advice. Nothing here has been sent to anyone.

Scope: written permission for (a) showing the full Hansard text on a public website and (c) re-scraping SPRS on a schedule to load the 15th Parliament and later sittings. Bulk dataset download (b) is deferred and not requested. The informal route is out of scope.

Reading rules for this file. Quotes from parliament.gov.sg/terms-of-use come from a WebFetch summary tool, which returned fragments, not the full page. Treat each as a fragment and re-read the page in a browser before the letter goes out, and before quoting any clause number to Parliament. Claims backed only by a search snippet or a third-party mirror are marked [unverified].

## What the terms say

Source: https://www.parliament.gov.sg/terms-of-use (fetched 2026-10-18).

Reproduction and copyright:

- Clause 4: "are protected by copyright, trademark and other forms of proprietary rights."
- Clause 6: contents "shall not be reproduced, republished, uploaded, posted, transmitted or otherwise distributed in any way" and "without the prior permission of Parliament of Singapore."
- Clause 7: "use of the Contents for any other purpose will be a violation of Parliament of Singapore's copyright"
- Footer: "Copyright © 2017 The Parliament of Singapore."

Permission:

- Clause 6: "To use any parts of the Contents of this Site, the user must seek permission in writing, stating the Contents for use;"
- Clause 6: "Parliament of Singapore reserves the right to refuse permission without declaring reason(s)"
- No contact for permission requests is named on the page. It only says "in writing" and links a general Contact Us page.

Automated access:

- The page has no clause on scraping, bots or crawling. That is a gap, not a licence. Clause 6 (no reproduction without permission) and clause 13 (below) are what apply.

Caching, linking, framing:

- Clause 13: "Except as set forth below, caching and links to, and the framing of this Site or any of the Contents are prohibited."
- Clause 15: "You must make a specific request for, and secure permission from Parliament of Singapore prior to hyperlinking"
- Consequence for Royce: the app's links out to SPRS, and any stored copy of SPRS pages (his Postgres copy is a cache in the plain sense), both sit inside what the terms say needs permission. The letter should ask for linking too.

Disclaimers: clause 8 ("as is" basis without warranties), clause 9 (no liability for loss). Useful for the accuracy conversation, see the letter notes.

SPRS terms: https://sprs.parl.gov.sg returned only a search box, with no footer, terms or contact text in the fetch. No separate SPRS terms were found. The parliament.gov.sg terms are the only written terms found.

robots.txt:

- https://sprs.parl.gov.sg/robots.txt returned HTTP 404. SPRS publishes no crawl rules.
- https://www.parliament.gov.sg/robots.txt applies to `User-agent: *` and, per the fetch tool's summary (it refused to quote verbatim), disallows four or five specific files, PDFs and .xlsx under `/api/media/`. It does not disallow the MP list page the scraper uses (`/history/list-of-mps-by-parliament`). The rules list full URLs instead of paths, so crawlers may misread them. Re-read the raw file before relying on this.

Read: no robots rule blocks the scraper, and the terms never mention automation. Neither gives permission. A 404 robots.txt is silence, and the letter should not claim otherwise.

## What the law allows

Not legal advice. Statute text was not retrievable from the official site (sso.agc.gov.sg returned HTTP 403 to the fetch tool), so everything below rests on secondary sources and is partly [unverified]. Get the official text and a lawyer's read before launch.

Copyright Act 2021 (in force 21 November 2021): https://sso.agc.gov.sg/Acts-Supp/22-2021/ ; table of contents at https://en.wikisource.org/wiki/Copyright_Act_2021

- Government ownership, s 136 ("First owner, Government and prescribed international organisations"). Per a third-party mirror, the Government is first owner of copyright in works made by or under its direction or control (https://lawplayer.com/sg/act/CA2021/136) [unverified]. Whether Hansard counts as a Government work or a Parliament work was not settled by anything found. Either way the terms page claims the copyright, so assume an owner exists who can say no.
- No provision on reporting parliamentary proceedings was found in the Act's headings (Wikisource lists headings only). Do not assume the news-reporting exceptions help; check ss 190 onward with a lawyer.
- Computational data analysis, ss 243 and 244 (headings confirmed at Wikisource). Per Reed Smith's summary (https://www.reedsmith.com/en/perspectives/ai-in-entertainment-and-media/2024/02/text-and-data-mining-in-singapore) s 244 allows copying for computational data analysis, and the commentary says it extends to communicating and publishing, with conditions in s 244(2): copy made for the analysis only; no other use of the copy; copy not supplied to anyone else except to verify results or for collaborative research on the same purpose; lawful access to the source; and the source copy is not knowingly infringing. Commentary also says it cannot be excluded by contract [unverified]; see also https://www.asiaiplaw.com/article/computational-data-analysis-exception-in-singapores-copyright-act-2021-a-game-changer.
  - For (c), re-scraping: probably the strongest legal footing, since SPRS is openly reachable and the copy feeds parsing. Weak points: lawful access (SPRS is public, so likely met), and the "no other use" and "not supplied to anyone else" conditions.
  - For (a), public display of full text: s 244(2) conditions on supply to others are hard to square with a public website showing the whole text. A reading that it covers publication exists in commentary, but it is untested and this is the point to put to a lawyer. I would not launch publicly on s 244 alone.
- Fair use, ss 191 to 194 (https://lawplayer.com/sg/act/CA2021/191 , /194) [unverified, mirror]. s 191 weighs purpose and character, nature of the work, amount taken, and market effect. s 194 deems research or study fair for a "reasonable portion", which a full-text site is not. Full-text republication is the weakest case under fair use. Non-commercial use helps the first factor only.
- A contract point: the terms page is a website notice. Whether it binds a visitor, and whether s 244 overrides it, is a lawyer question.

Parliament (Privileges, Immunities and Powers) Act 1962 (https://sso.agc.gov.sg/Act/PPIPA1962 , 403 to the fetch tool):

- Its long title includes protecting "persons employed in the publication of the reports and other papers of Parliament" (via search snippet) [unverified]. That protects publication by or under authority of Parliament. Nothing found extends it to a third party republishing on its own account. The Canadian House and the Queensland Clerk both take that line: unofficial copies fall outside privilege (see Precedents). Assume Royce's site gets no privilege cover and carries ordinary defamation risk for historical remarks. Separately, a licence that says the copy is "not official" and "accurate" is how Canada draws that line.
- Not found: any provision that compels or forbids third-party publication of Hansard.

Where a lawyer is needed: (1) who owns Hansard copyright and whether terms bind; (2) whether s 244 supports public display; (3) defamation exposure and privilege for a non-official republisher, including old remarks about living or dead people; (4) personal liability when launching under his own name. A short consult with an IP lawyer is worth the fee before launch if Parliament refuses or goes silent.

## Who to ask

- Official channel: Parliament Secretariat, Parliament House, 1 Parliament Place, Singapore 178880. General email parl@parl.gov.sg, phone 6332 6666, hours 8:30 am to 6:00 pm, Monday to Friday, and a feedback form at https://form.gov.sg/67d3d98b0c83bab34c10d510 (all from https://www.parliament.gov.sg/contact-us).
- Addressee: the Clerk of Parliament. The Secretariat page lists Mr Siow Peng Han as Clerk (phone 63326668) and as Quality Service Manager (https://www.sgdi.gov.sg/organs-of-state/parl/departments/ps ; the fetch summary printed an individual email there, which I leave out of this file; read it off the page). An ASGP profile says he took up the Clerk post on 23 September 2025 (https://asgp.co/members/siow-peng-han/) [unverified], and one directory still lists a Deputy Clerk title. Confirm the incumbent on parliament.gov.sg before addressing the letter. Departments named on that page include Official Reports (the likely owner of Hansard) and Communications and Engagement. No legal department is named.
- Recommendation: send the letter as a PDF attached to an email to parl@parl.gov.sg, addressed to the Clerk, subject line "Request for written permission under Terms of Use clause 6". Also submit the short feedback form pointing to the email, so a ticket exists. The terms say "in writing," so keep the email as the record. Do not cold-email the individual first; the generic address is the stated channel and keeps the thread inside the Secretariat.

## Precedents

Singapore:

- Pair Search (https://www.parliament.gov.sg/newsroom/events/details/ai-powered-search-engine-for-singapore's-hansard-reports , 13 August 2024): built by the Pair team at Open Government Products "in collaboration with Parliament"; indexes Hansard Official Reports. Permission regime: a government-to-government collaboration, not a public licence. It is a precedent that Parliament wants Hansard searchable, and also a competitor. The letter must say what Royce's site does that Pair Search does not (MP pages, sittings, speaker attribution, full-text reading, coverage back to 1955).
- Par-leh-mate (talk at https://www.secoda.co/mds-fest-3-0/building-and-analysing-a-structured-dataset-of-singapores-parliamentary-speeches---par-leh-mate): the speakers listed include Royce Hoe. The page says nothing on source, permission or licence. Royce knows the answer from inside; whether Par-leh-mate has asked Parliament for permission is the most useful fact to settle before writing. If it never asked, say so only to himself and decide how that affects the ask. If it did, cite it.
- No other permission-granted Singapore Hansard republisher found. Library guides (https://libguides.nus.edu.sg/SGlawhistory/hansard) point to SPRS itself.

International:

- UK, TheyWorkForYou and ParlParse (https://parser.theyworkforyou.com/ , https://data.mysociety.org/datasets/uk-hansard/ , https://blog.okfn.org/2006/09/25/parliamentary-data-in-a-can/): scrapes official sources and republishes; mySociety's account of the original licence arrangement was not found. The Open Parliament Licence v3.0 now allows copying, publishing, adapting and commercial use with the attribution "Contains Parliamentary information licensed under the Open Parliament Licence v3.0" and no implied official status (https://spdx.org/licenses/OPL-UK-3.0.html). Whether current Hansard sits under it is not confirmed in what I read [unverified]. Regime: an open licence granted by Parliament. Singapore has no equivalent, and nothing found shows Parliament publishing under the Singapore Open Data Licence.
- Canada, House of Commons: a standing permission to reproduce proceedings "provided that the reproduction is accurate and is not presented as official", excluding "commercial purpose of financial gain", with contempt power retained and written authorisation available from the Speaker's Office (https://www.ourcommons.ca/en/important-notices). openparliament.ca's own legal basis was not found (its about page returned 403). The Canadian conditions are the best template for what Royce can offer: accurate, not official, non-commercial.
- Queensland, OpenAustralia (https://oaf.org.au/?p=329 , 7 August 2009): the Clerk refused republication after three months of correspondence. Stated reasons: becoming a "special stakeholder" whose needs future system changes must consider, unclear commercial interest, no authorised-publisher status under the Parliament of Queensland Act 2001, no privilege cover for republication, and loss of control over an unofficial site hosting the official record. The reasons are a checklist for the letter: say who you are, state non-commercial use, claim no special status, accept the legal risk, and commit to follow Parliament's corrections.
- Australia federal, 2010: Hansard published under CC BY-NC-ND (search snippet only, https://lists.ibiblio.org/sympa/arc/cc-au/2010-06/msg00002.html) [unverified]. NC would suit Royce; ND would block parsing, so ask for adaptation rights.

Pattern: permission was given by licence (UK, Canada) or by a standing notice. Where it came by a letter to a Clerk (Queensland), the answer was no. A Singapore reply is most likely to be a per-request answer that is conditional or silent, not an open licence.

## Current crawl behaviour

From /Users/user/ghq/github.com/roycehoe/handsard-scraper at the time of reading. State these facts in the letter as they are, and fix the gaps before sending.

- User agent: SPRS calls send the library defaults, `python-requests/x.y` (search and sync calls, `gateway/hansard_search.py`, `gateway/hansard_report.py`, `gateway/hansard_topic.py`) and `python-httpx/x.y` (async calls). Only the parliament.gov.sg MP list code sets one: `Mozilla/5.0`, which looks like a browser (`gateway/speakers_by_parliament.py`). No contact address, no project name.
- Search (`gateway/hansard_search.py`): one request at a time, no sleep between pages. 20 results per page. It walks calendar months from `search_from_date`. Because equal-key hits come back in a different order, it re-walks every page of a month window up to `_MAX_PASSES = 25` times until distinct report ids reach the engine total. Worst case that is 25 times the page count per window. Retries: 3 more attempts, backoff 1s, 2s, 4s (no jitter) on gateway errors.
- Async fetch of reports and topics (`gateway/http.py`, `populate/*.py`): `asyncio.Semaphore` caps concurrency at 4 for topic contents and responses (`populate/hansard_responses.py`, `populate/hansard_response_contents.py`) and 2 for sitting dates and sitting details. No delay between requests inside the cap. Timeouts 60s and 120s. Retries: up to 4 more attempts on HTTP 429, any 5xx, or HTTP 400 containing "System error occured"; delay 2s x 2^attempt plus 0 to 1s jitter (2, 4, 8, 16 seconds). It does back off on 429.
- MP list (`gateway/speakers_by_parliament.py`): one session, sequential, 0.5s sleep between 15 parliament pages, 10 to 15s timeouts, no retry.
- No robots.txt check, no `Retry-After` handling, no cap on total requests per hour, no incremental mode found in the gateway (date range is a setting; `search_to_date` is fixed at 2025-04-08).
- The README says the fetcher "caps concurrent requests and backs off on HTTP 429." True, but "polite" is not the right word for concurrency 4 with no pause.

Before sending, change the scraper to what the letter will promise: identify itself with a project name and contact email in the User-Agent; one request at a time with a fixed pause (the letter below says at least 2 seconds); honour `Retry-After`; fetch only new sittings (a scheduled run needs one search window since the last load, not the full history); run overnight Singapore time; and drop the 25-pass re-walk for the incremental case. Those changes are not made here (read-only task). Update the letter numbers if the code ends up different.

## Draft letter

Subject: Request for written permission under the Terms of Use, Official Reports (Hansard)

To: The Clerk of Parliament, Parliament Secretariat, Parliament House, 1 Parliament Place, Singapore 178880
Via: parl@parl.gov.sg

Dear Sir,

I am a software engineer in Singapore. I have built a free, non-commercial website that lets the public search and read the Official Reports of Parliament by MP, sitting and topic. I am writing under clause 6 of the Parliament website Terms of Use to ask for written permission for two uses, described below. I have not made the site public. It is behind a password while I wait for your reply.

What I am asking for

1. To display the full text of the Official Reports (1955 to date) on a public website, with each page naming the date and report and linking to the original on SPRS.
2. To fetch new Official Reports from SPRS once a day, so the site includes the 15th Parliament and later sittings.

I am also asking whether linking to SPRS pages (clause 15) is allowed in the same permission.

What I have done so far

I collected the reports from SPRS, and the MP lists from parliament.gov.sg, to build the site. That was before I read the Terms of Use closely, and I should have asked first. I have not shared the data or the site with anyone outside a small private test group. I will not release a downloadable dataset. If researchers ask me for one later, I will write to you separately before doing anything.

What I offer

- Attribution on every page: "Source: Parliament of Singapore, Official Report, [date]," with a link to the original.
- A footer on every page: "This is not an official Parliament site. The Official Report on SPRS is the authoritative record."
- No crest, no gov.sg branding, and no wording that suggests endorsement.
- Non-commercial use only: no advertising, no sale of data, no paid tier.
- Corrections: a visible address for error reports. I will fix transcription or attribution errors I introduce within 7 days, and I will remove any item you ask me to within 2 working days, with no reason needed.
- Crawl limits: one request at a time, at least 2 seconds apart, and one run a day at 4 am Singapore time. Each run fetches only sittings I do not yet hold, and re-reads the reports of the last 14 days so I see any you have corrected. The User-Agent names the project and gives my email, and I will stop at once if SPRS returns errors or you ask me to. Tell me any limits you prefer and I will use them. Earlier, while building the first copy, my tool ran up to four requests at a time with no pause. I have changed that. On 19 October 2026 a one-off load of the 15th Parliament, about 4,700 requests, ran one at a time but 1 second apart. Every run since keeps the 2-second gap.
- A named contact: me, below. I am publishing under my own name and I accept responsibility for the site.

I know the site duplicates some of what Pair Search does. Mine adds profiles for each MP and sitting, and attributes each speech to its speaker back to 1955. I am happy to describe it or to give you a login so you can look before you decide.

If full permission is not possible, I would value knowing which part you can allow, for example a search and snippet view that links to SPRS for the full text, or full text only for sittings you choose.

Yours faithfully,
Royce Hoe
[email] [mobile]
[site address, behind login]

Notes on the letter (do not send these):

- If asked about AI: say the site uses no machine learning on the text. The speaker attribution and the parsing are rule-based code plus manual overrides (check this against the repo before saying it; the `data/speaker_overrides.json` file suggests manual fixes). Say Royce will not train or fine-tune models on the text, will not offer it to third parties for that, and will tell Parliament first if that changes. Do not claim more than is true. If the Par-leh-mate side project uses LLM summaries (the talk lists "LLM summarisation"), do not say "no AI" about Royce's work in general; keep the answer to this site.
- If asked about accuracy: Say plainly the text is parsed from SPRS HTML and the structure (speaker, topic, order) is the author's inference, so errors exist. State the Known limitations section of the scraper README as the honest list. Point to the footer and the correction route, and rely on clause 8's "as is" wording only for Parliament's side. Do not promise 100 percent.
- If asked why not just link to SPRS: SPRS has no per-MP or per-sitting view and Royce's reading surface is the added value. Do not disparage SPRS or Pair Search.
- Do not claim s 244 gives him the right. Mention copyright law only if asked, and say he is asking because the terms say to.
- The sentence about the earlier scrape is deliberate. Parliament will find it out anyway, and the Queensland refusal turned on trust.
- Keep to one page plus one signature block.

## If they say yes / no / nothing

Timeline for silence: send on day 0. Follow-up email day 21 (one polite line, original attached). Phone the Secretariat on 6332 6666 on day 35 and ask who owns the request. Final email on day 56, which says: "If I do not hear by [date], I will keep the site private and will not launch." Decide on day 56. Eight weeks is long enough for a bureaucratic reply and still lets a Q3 launch slip to Q4 at worst.

| Outcome | What it means | Launch |
| --- | --- | --- |
| Yes, as asked | Written reply covers (a) and (c) | Get the reply as a PDF letter or email on file, quote its conditions on the About page, remove basic auth, announce. Re-read the scope before adding anything new such as a dataset. |
| Yes, with conditions | Likely: attribution wording, a link-out, limits on crawling, a review before launch | Accept any condition you can keep honestly. If a condition would break a core feature (for example, snippets only), decide whether the smaller site is still worth launching. Ask for the condition in writing, not on a call. |
| Partial yes, (a) only or (c) only | Display allowed but no scheduled crawl, or the reverse | If display only: launch with the existing data and say it ends at April 2025; ask whether Parliament would give him the 15th Parliament some other way. If crawl only: keep private; there is nothing to show. |
| No | Parliament "reserves the right to refuse permission without declaring reason(s)" (clause 6) | Do not launch the full-text site. Ask in one line whether a narrower use is acceptable (search with snippets and links to SPRS). Take a lawyer's view on whether s 244 supports private use for analysis, and note the Queensland precedent: appeals rarely worked there. Keep the repo private-use only and drop the public plan. |
| Referred to another agency (for example GovTech/OGP) | Common outcome when a body prefers its own tool | Follow up with the named office within a week. Stay private. |
| No reply by day 56 | Silence is not consent. Clause 6 requires permission "in writing" | Stay in private beta. Do not launch publicly on silence. Options in order of preference: (1) escalate once through the feedback form and a call to the named Clerk's office; (2) pay for a short legal opinion on s 244 and fair use for display, and launch a snippet-and-link-out version only if the lawyer supports it; (3) wait for a warm introduction through the informal route being handled separately. Do not put the full-text site live on silence alone. |

One more call for Royce: even the snippet-and-link-out fallback involves linking to SPRS, which clause 15 says needs permission. A lawyer should look at that before anything public goes up.

Open items before sending: re-read the terms in a browser and check the clause numbers; confirm who the Clerk is; fix the User-Agent and pacing in the scraper to match the letter; decide what Royce will say about Par-leh-mate.
