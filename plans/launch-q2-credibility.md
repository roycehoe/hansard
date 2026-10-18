# Launch credibility: how to show this is not a vibe-coded project

Written 18 October 2026. Read-only research across `handsard-scraper` (local directory name; the GitHub remote is `roycehoe/hansard-scraper`) and `hansard`, plus web research on peer projects and on Open Government Products (OGP). Nothing was changed except this file.

The short version: the data work is unusually well documented and honest, which is the hard part. Three things undercut it. The public "read by hand" claim is not true as worded, the data stops in April 2025, and the `hansard` repo looks like a one-week sprint with no README, tests or CI. All three are cheap to fix.

## Evidence that already exists

### Accuracy and method (scraper repo)

| Evidence | Path | What a skeptic can verify |
|---|---|---|
| Three-number progress measure, with the warning never to quote the first alone | `handsard-scraper/docs/vision.md`, section "Measuring progress" | Linked rows over rows with a speaker (98.1%), over every row (84.2%), and characters of body text in linked rows (97.15%). Parliaments 0 to 11. |
| Script that produces the numbers, output committed after every write | `handsard-scraper/scripts/attribution_text_share.py`, `handsard-scraper/docs/figures/2026-10-17-round8.txt`, `2026-10-18-coverage-refill.txt` | Anyone can rerun it against their own copy and compare. |
| Self-audits that say "not done" | `handsard-scraper/docs/report/north-star-audit-2026-10-13.md`, `north-star-audit-2026-10-17.md` | The 17 Oct audit scores ten done tests: two pass, one unmeasured, seven fail. It reports O4 speaker linking at 404 of 406 right (99.5%, Wilson interval 98.2% to 99.9%). An audit that fails its own project is rare and is the strongest trust signal in the repos. |
| Sampling protocol with a stopping rule and error tiers | `handsard-scraper/docs/speech-fidelity-stopping-rule.md`, `docs/report/speech-fidelity-loop.md` | Stratified sample, seeded (20261015, 20261016), report-level bootstrap bounds, tiers A to C by harm to a researcher. The stopping rule explains why "zero errors in 400 rows" only bounds the rate below 0.75%. This is real statistics, not a vibe. |
| Register of every lossy step | `handsard-scraper/docs/data-loss-register.md` (136 KB) | Each transformation, its row count, whether it is reversible. Raw API responses are stored unmodified and every derived table can be rebuilt. Required by `CLAUDE.md`. |
| Nine ADRs | `handsard-scraper/docs/adr/0001` to `0009` | Denominator definition, role-holder attribution, text before the first speaker (0005 reversed by 0008, visibly). Changing your mind in the open reads as engineering. |
| Known limitations with counts | `handsard-scraper/README.md` ("Known limitations", "Coverage") | 654 full-text records with no speeches, 131 with no text, 2,078 reports whose stored rows lag the parser. |
| Data dictionary and parsing notes | `handsard-scraper/docs/data-dictionary.md`, `docs/parsing.md` | Field semantics for reuse. |
| Peer survey | `handsard-scraper/docs/peer-projects.md` | Compares ParlParse, openparliament.ca, Open Discourse, ParlaMint, Katz and Alexander. Shows he read prior art and borrowed from it. It marks snippet-only claims `[unverified]`, which is the convention this file also uses. |
| Tests | `handsard-scraper/tests/` (15 files, about 101 test functions, golden fixtures in `tests/fixtures/*.json`) | Name parsing, attendance, speaker overrides, and a golden-fixture speech test. Fixture names are specific behaviours, for example `amendment_negatived_has_no_speaker.json`. |
| Pre-commit hooks | `handsard-scraper/.pre-commit-config.yaml` | Present. |
| Citation line, licence, affiliation disclaimer | `handsard-scraper/README.md`, `LICENSE` (MIT) | README says the content belongs to Parliament and the project is not affiliated. |

### Accuracy and method (app repo)

| Evidence | Path | What a skeptic can verify |
|---|---|---|
| Coverage page and a long methods page | `hansard/app/src/routes/coverage.index.tsx`, `coverage.methods.tsx` (466 lines) | Sections: how the text was gathered, what the archive holds, who said what, known gaps, citing and permanent links. Says "Counts ... have not been checked item by item against the Official Report" and "No paragraph from 10 September 2012 on has been checked by hand." |
| Figures held as dated constants | `hansard/app/src/constants/coverage/constants.ts` | `METHODS_LAST_REVISED`, `HAND_CHECK_DATE` and so on. Dated claims are good. Several are now stale (see Gaps). |
| ADRs | `hansard/docs/adr/0001-read-only-api.md`, `0002-no-government-identity-marks.md`, `0004-permanent-urls.md` | Read-only API, a deliberate refusal to copy gov.sg marks so the site cannot pass for the official record, permanent URLs. ADR 0002 will matter to Parliament officials. |
| Launch decisions with measurements | `hansard/plans/launch-decisions.md` | Query timings with buffer counts, a rejected-options table, an index experiment (rum). Reads like an engineer's notebook. |
| Data sanity persona passes | `hansard/plans/data-sanity-personas-findings.md`, `data-sanity-personas-2-findings.md` | Findings tracked to fixes in the scraper. |
| Convention docs | `hansard/CLAUDE.md`, `api/STYLE.md`, `api/STYLE-RULINGS.md`, `app/STYLE.md` | OGP engineers will see that conventions were written down. |

### Outside the repos

Royce is listed as a co-presenter of the Par-leh-mate talk at MDS FEST 3.0 (Jonah Foong, Jeremy Chia, Royce Hoe), "a passion project among three friends" for Singapore parliamentary debates ([secoda.co](https://www.secoda.co/mds-fest-3-0/building-and-analysing-a-structured-dataset-of-singapores-parliamentary-speeches---par-leh-mate)). Jeremy Chia has one commit in the scraper history, so the link is checkable. That page lists Royce as Senior Software Engineer, MSUIT. This is prior work in the same domain with a public talk, and none of it is cited from either repo.

## Git history optics

Counts from `git log` on 18 Oct 2026.

| | `handsard-scraper` | `hansard` |
|---|---|---|
| Commits | 554 | 236 |
| Active months | Aug 2025 (34), Sep 2025 (1), Feb 2026 (1), May 2026 (118), Jun 2026 (117), Oct 2026 (283) | Oct 2026 only |
| Busiest days | 14 Oct 81, 31 May 81, 13 Oct 68, 17 Oct 56 | 13 Oct 66, 14 Oct 124, 16 Oct 22, 17 Oct 23 |
| Types | fix 98, refactor 88, docs 63, feat 26, chore 6, test 1, perf 1 (Oct only) | feat 75, fix 66, docs 65, refactor 12, style 8 |
| Authors | royce (two email spellings of one identity), jeremychia 1 | royce |

What a skeptic browsing GitHub concludes, bluntly:

- **Message quality is good.** Conventional Commits throughout, subjects say what changed ("fix: keep a member's label when the speech holds a pipe"). This is the best counter to "vibe-coded". Sloppy vibe-coding shows as "update", "fix stuff", "wip". Yours does not.
- **Cadence reads as bursts.** 124 commits in one day on `hansard`, 236 in six days (13 to 18 Oct), 43 commits in the midnight hour. A human cannot hand-write that, so a reviewer will infer agent-driven commits, which is true. The suspicious part is not the volume. It is that the app has no tests, no CI and no README, so the volume has nothing checking it.
- **`hansard` has nothing at the root a visitor expects.** No README, no LICENSE, no CI, no tests (zero test files outside `.venv`), no contact email wired in (`VITE_CONTACT_EMAIL` is unset). First impression of a repo with 236 commits and no README is "generated and abandoned". This is the single worst optic.
- **`handsard-scraper` has a longevity hole in the history.** One commit between 1 Sep 2025 and 29 May 2026 (a README on 10 Feb). A skeptic reading "will this be maintained" sees a project that went dormant for eight months and returned for two sprints. The honest reading is that it was a side project that became serious. Say so in the README instead of letting them guess.
- **Early history is ordinary.** Aug 2025 commits like `chore: savepoint; refactoring parliament parser to use pydantic basemodel` look like a person working. That helps.
- **Two repo names differ from the directory and one doc.** The local directory is `handsard-scraper` but the remote is `hansard-scraper`, and `hansard/CLAUDE.md` and `peer-projects.md` still say `roycehoe/handsard-scraper`. A reader following that link gets a 404. Fix before making public.
- **Dangling references.** `handsard-scraper/.gitignore` ignores `plans/` and `*.json`, yet public docs cite `plans/...` files ("local, gitignored") and scratchpad outputs ("not kept", `north-star-audit-2026-10-17.md`). The AI pipeline state is therefore invisible in the scraper repo but visible in `hansard/plans/`. Pick one policy. A cited file nobody can open weakens the citation.
- **Do not rewrite history.** Squashing would remove the best evidence (the iteration shown in ADR 0005 to 0008). Explain the bursts in writing.

## How it looks to each skeptic

**Parliament officials.** Their question is whether this misrepresents the record and whether the person is a nuisance. Good: ADR 0002 and the footer ("Not an official Parliament site") show he took impersonation seriously; the README names SPRS as the source, says the content belongs to Parliament, and notes the rate-limit backoff; every report can link to the Official Report; permanent URLs. Weak: no named contact, no statement of what he will do when they report an error, no mention of the terms-of-use permission he is asking for, and the "read by hand" wording (below). Officials will also compare against Pair Search, which OGP built with Parliament and announced on 13 Aug 2024 ([parliament.gov.sg](https://www.parliament.gov.sg/newsroom/events/details/ai-powered-search-engine-for-singapore's-hansard-reports)). They will ask why a second tool is needed. The answer is per-speaker attribution and published error rates, which Pair Search does not advertise (see below).

**Academic researchers.** They want a citable, versioned dataset, a stated error rate with a method, and a known-limitations list. The repos have the method and the limitations, which most projects lack. Missing: a versioned release (Zenodo DOI), a data export (the database "itself is not published"), and a human-verified gold sample. A political scientist will read "98.1%" and ask "98.1% of what, checked by whom". The vision doc answers the first half well and the second half badly, because the checkers were language-model readers.

**Journalists.** They need to quote safely: permanent links, a way to verify against the Official Report, and a clear statement of what the tool cannot say. Permanent URLs and report-level links to the source exist. Missing: a short plain-language "can I quote this?" note, a visible "data as of" stamp tied to what the corpus ends at, and a corrections email that works. A journalist who hits a wrong speaker credit and finds no way to report it will not come back.

**Hacker News and Reddit.** They will open the repo and the history, look for a README, and look for "AI slop". They will find `CLAUDE.md` and `plans/*.pipeline.json` in minutes. Expect one top comment saying "vibe-coded". The defence is a README that states the AI use up front plus a link to the audits that fail the project. A commenter cannot easily call a repo with a published "not done, seven of ten tests fail" audit careless. They can call `hansard` careless today, because there is no README.

**OGP engineers.** Evidence on what OGP values is in the next section. They will read the code, run the tests, read commits and the PR hygiene. They already built the strongest comparable (Pair Search) and know the Hansard HTML quirks, since Pair scraped and parsed 30,000 reports from 1955 to January 2024 ([hack.gov.sg](https://hack.gov.sg/hack-for-public-good-2024/2024-projects/pairsearch/)). They will find speaker attribution errors faster than anyone. For them the audits are the pitch: you found the same hard parts and measured them. What would put them off: zero tests in the app, an unreviewed agent-written backend, and unexplained stale numbers.

## What OGP says it values

- Culture is "collaborative, transparent, low ego, and focused on getting things done", and OGP wants people who will "own real problems, end-to-end" ([open.gov.sg/careers](https://open.gov.sg/careers)).
- Hiring assesses four attributes: ability, initiative, communication and values (same page).
- Postings list "Ownership and Autonomy" and "Rapid Prototyping" as principles, and test ideas over debating them [unverified, search snippet of [careers.open.gov.sg](https://careers.open.gov.sg/o/software-engineer/c/new); the page itself returned 404 when fetched].
- OGP publishes open source (FormSG, Isomer, Data.gov.sg) and describes a flat structure that "bypass[es] bureaucracy to focus on delivery" [unverified, search snippet]. Its careers site also lists an "AI Native" team that builds shared AI tooling so product teams "code, plan, and operate" with it [unverified, search snippet; direct fetch returned 404].
- Pair Search is still labelled a pilot, with no accuracy figures on its page: "We're exploring if these products are working well for users" ([reports.open.gov.sg/pairsearch](https://reports.open.gov.sg/pairsearch)). Its prototype page mentions neither accuracy nor grounding in a way I could read ([hack.gov.sg](https://hack.gov.sg/hack-for-public-good-2024/2024-projects/pairsearch/)). That is the opening: a measured error rate and speaker identity are things the official tool does not display.

Reading for evidence: OGP rewards ownership, shipping, plain communication and honesty, and it uses AI tooling itself. An engineer who shipped a measured, self-critical product and says plainly how it was built matches that. A polished claim with no numbers does not.

## How comparable projects built trust

| Project | Trust mechanism | Source |
|---|---|---|
| TheyWorkForYou / ParlParse (mySociety) | Institutional backing by a registered charity. Open parser code. Errors usually traced to Parliament's own feed and fixed upstream; users are told to report to the TheyWorkForYou team or the mailing list. The sister site Public Whip emailed errors to the House of Commons Information Office, which fixed serious ones (that page is old). | [Wikipedia](https://en.wikipedia.org/wiki/TheyWorkForYou), [publicwhip.org.uk](https://www.publicwhip.org.uk/project/liaison.php) [unverified, snippets] |
| openparliament.ca | One volunteer (Michael Mulley) since 2010, full source on GitHub, testimony to a House committee in 2010, cited by a university library guide. Trust came from longevity and openness, not an accuracy audit. | [university guide](https://guides.library.utoronto.ca/lipad), [slaw.ca](https://www.slaw.ca/2010/04/13/open-parliament/) [unverified, snippets; the about page returned 403] |
| Open Discourse (Bundestag) | Dataset on Harvard Dataverse with a DOI, conference talk (rC3), code public. The one outside critique I found is a Tagesspiegel Background piece saying the data is useful but has problems, and a CPP-BT note that its token count differs from Open Discourse (about 200M against 310M), unexamined. I found no published validation study for it. | [media.ccc.de](https://media.ccc.de/v/rc3-428768-wir_wissen_was_ihr_letzten_sommer_gesagt_habt_open_discourse_und_die_transparenz_des_bundestages), [zenodo.org](https://zenodo.org/records/15462956) [unverified, snippets] |
| Stanford Congressional Record (Gentzkow, Shapiro, Taddy) | Econometrica paper (2019) plus an online-appendix audit comparing the automated speaker-to-member mapping with a manual mapping; they agree in all but three cases for the bound edition. Known weakness: OCR errors in older sessions. | [NBER data appendix](https://admin.nber.org/data-appendix/w22423/politext_online.pdf) [unverified, snippet] |
| Katz and Alexander (Australian House 1998 to 2022) | Peer-reviewed in Scientific Data, 2023. Eight automated tests per file with manual sample checks (40% of 131 duplicate flags, 25% of 88 malformed timestamps), data on Zenodo, code on GitHub. No overall accuracy rate reported, and it says so. | [PMC10460412](https://pmc.ncbi.nlm.nih.gov/articles/PMC10460412) (fetched and read) |
| GermaParl | Evaluated against a manual gold standard of about 1% of protocols. | [per search summary] [unverified, snippet] |
| Par-leh-mate (Singapore) | Conference talk, a live tool, three named builders. The talk page makes no accuracy or validation claim and does not name its data source. One fetch of the live site returned HTTP 503 on 18 Oct, which proves nothing alone but a skeptic will try it. | [secoda.co](https://www.secoda.co/mds-fest-3-0/building-and-analysing-a-structured-dataset-of-singapores-parliamentary-speeches---par-leh-mate) |
| Pair Search (OGP, Singapore) | Institutional backing: built by OGP "in collaboration with Parliament", announced on Parliament's own newsroom. Pilot label. No accuracy statement, no citation guidance, no limits on the pages I read. | [parliament.gov.sg](https://www.parliament.gov.sg/newsroom/events/details/ai-powered-search-engine-for-singapore's-hansard-reports), [reports.open.gov.sg](https://reports.open.gov.sg/pairsearch) |

What this tells you:

1. Projects without institutional backing (openparliament.ca, Katz and Alexander, Stanford) won trust with one of two things: years of visible upkeep, or a written validation that reports its own gaps. You have the second already and cannot yet show the first.
2. The strongest mechanism that costs you little is the Katz and Alexander and Stanford pattern: a numbered list of checks, a manual sample against a second source, and the numbers. You are 80 percent there. The sample is the part that is not human yet.
3. Singapore's two precedents say nothing about accuracy. A published error rate is a way to differ from both.

## Gaps

Ordered by how likely a skeptic is to hit them first.

1. **"Read by hand" is not accurate as worded.** `coverage.methods.tsx` says 80 paragraphs "were read by hand" (75 right, 5 procedural, 20 unlinked right). The 13 Oct audit was done by "an independent agent" (`north-star-audit-2026-10-13.md`, line 3). The 17 Oct audit says "Sonnet readers did the hand checks" and the loop used "20 Sonnet cold readers" (`speech-fidelity-loop.md`). These are model readers checking against source HTML. That is a legitimate method, but calling it hand reading on the public page will read as a misstatement if anyone checks. No human has checked any row against the Official Report in the evidence I read.
2. **Public numbers lag the audits.** The methods page shows 75 of 80 (93.8%) dated 13 Oct. The 17 Oct audit has 404 of 406 for linking. `ATTRIBUTION_MEASURED_ON` is 14 Oct, `COVERAGE_LAST_UPDATED` is 14 Oct, and the vision doc has moved on through writes #4 to #7, round 8 and the coverage refill. The methods page also shows `HAND_CHECK_LINKED_SPEECH_COUNT = 80` where the README quotes 997,268 linked of 1,019,991. Hardcoded dates in a constants file will drift again. Derive them or stamp them from one place.
3. **The corpus ends in April 2025.** README: 22 April 1955 to 8 April 2025; the done tests stop at the end of Parliament 14. It is October 2026, so sittings since the 2025 election are missing. For "will it be maintained" this is the most direct evidence against you. The README never says "Parliament 15 is not included, and here is the plan". I could not find an incremental-ingest runbook.
4. **No human-verified gold sample, no data release.** No Zenodo DOI, no CSV of checked rows, no database export ("The database itself is not published").
5. **`hansard` repo is bare.** No README, LICENSE, tests, CI. The API has `validators/` and `crud/` but no test directory. The app has none either.
6. **No corrections process.** `VITE_CONTACT_EMAIL` is not set in the build, so contact lines are hidden. No issue template, no corrections log, no commitment on response time.
7. **No maintenance statement.** No plan for refresh cadence, who holds the database, what happens if SPRS changes format (the 2012 system change already forced a second parser), how long the hosted instance stays up.
8. **No stated relationship to Par-leh-mate or Pair Search.** A skeptic asks why a third tool exists. A comparison sentence in the README answers it.
9. **AI use is evident and unexplained.** `CLAUDE.md`, `STYLE.md`, `plans/*.pipeline.json`, `hansard/plans/feat-execute-*.log.md`. No "how this was built" document. Worse, commit authorship hides it (all `royce`), so the story is only in config files, which looks like concealment even if it is not.
10. **CI absent in both repos.** Scraper has pre-commit but no `.github/workflows`.
11. **Some prose in public docs is long and register-heavy.** `data-loss-register.md` is 136 KB and `vision.md` 53 KB, with a 12-column table in "Measuring progress". Thorough, but a first-time reader cannot find the answer. A one-page summary on top would help.
12. **Dangling references** to ignored files and a wrong repo slug (see optics).

## Recommended actions, ranked by impact per hour

Hours are estimates for Royce plus tooling.

1. **Fix the "read by hand" wording (15 minutes).** In `coverage.methods.tsx` say what happened: "read against the source by independent model readers" and give the 17 Oct result (404 of 406). Do this before anyone but you sees the site. This is the one item that could become an accusation instead of a criticism.
2. **Write a README for `hansard` (45 minutes).** One screen: what it is, that it is unofficial and read-only, link to the scraper repo, link to `/coverage/methods`, screenshot, how to run, licence, how to report an error, status (private beta). Add a LICENSE file at the same time (5 minutes). Fix the `handsard-scraper` slug in `hansard/CLAUDE.md` and `peer-projects.md`.
3. **Add a short status and scope section to the scraper README (30 minutes).** State the corpus end date, that Parliament 15 is not yet in, what refreshing involves, and the maintenance promise you can actually keep (for example, "I will add each new sitting within N weeks while the site is up; if I stop, I will say so here and keep the data downloadable"). Do not promise what you will not do. Also say why history has gaps (Sep 2025 to May 2026) in one sentence.
4. **Do a human check of 100 rows (3 to 4 hours).** Pull a seeded random sample using the existing sampling code, open each row beside the Official Report (SPRS) yourself, record verdict and error class in a CSV committed to `docs/report/human-check-2026-10.csv`. Report the count and Wilson interval the same way the loop does. Put it beside the model-read figures on the methods page, labelled by who read. This closes gap 1 and 4 and is the most persuasive thing for academics, journalists and OGP. If a friendly outside reader, ideally Jeremy Chia or an academic, checks 30 more, say so.
5. **Wire up the corrections path (1 hour).** Set `VITE_CONTACT_EMAIL`, add a "Report an error" link on each report page that prefills the permalink and row id, add a GitHub issue template "Wrong speaker / missing text", and start `docs/corrections.md` with a line per fix (date, report id, what changed). Plan for Parliament's staff to be the likeliest correspondents.
6. **Write `docs/how-this-was-built.md` and a README paragraph (1 hour).** Content in the last section. Link to the audits. Do this before launch so the first comment on HN is yours.
7. **Run one real incremental ingest and record it (3 to 6 hours, if SPRS cooperates).** Fetch a sitting after 8 April 2025, parse, link, run `attribution_text_share.py`, commit the figures. If a full Parliament 15 load is too large, do one sitting and document the commands in `docs/refresh.md`. A runbook plus one executed run is much better longevity evidence than a promise.
8. **Add CI to both repos (1 to 2 hours).** GitHub Actions: `ruff check`, `pytest` (the golden-fixture tests should run without a database; check), `pnpm lint && pnpm build`, `uv run ruff check`. Add the status badge. A green check mark on 236 commits changes how they read.
9. **Write 10 to 15 API tests for `hansard` (2 to 3 hours).** Cover the routes that carry claims: coverage numbers, citation fields, speaker label rows, permanent URL redirects, read-only enforcement (ADR 0001). A test that asserts the connection is read-only is a good signal. One test file per router is enough.
10. **Make the numbers on the site come from one source (2 hours).** Replace hand-edited constants (`HAND_CHECK_*`, `*_MEASURED_ON`) with a JSON file produced by `attribution_text_share.py` and rendered by the page, or at least a single `figures.ts`. Stops gap 2 from recurring.
11. **Put a one-page summary on top of `vision.md` or in the README (1 hour).** Three numbers, what each does and does not mean, one line on who checked. The detail stays below.
12. **Publish the data (3 to 5 hours, after Parliament replies).** Do not publish speech text before written permission. What you can publish now: the hand-check CSV, the figures, the speaker registry, and the code. After permission, deposit a versioned export on Zenodo for a DOI. Ask Parliament for permission to do this in the same letter.
13. **Write the comparison paragraph (30 minutes).** Place in README: "Pair Search (OGP) does semantic search and summaries; Par-leh-mate does X. This project attributes each paragraph to a person, links every one to the Official Report, and publishes how often it is wrong." Check Par-leh-mate's current state first; do not describe its features from the talk page alone.
14. **Resolve the `plans/` policy (30 minutes).** Either commit scraper `plans/` (strip anything private) or remove citations of ignored files from public docs. The `hansard` repo already commits them, so the two repos disagree.
15. **Tell the story of the burst commits (15 minutes).** In the how-built doc, state that 283 scraper commits landed in October 2026 and why.

Do items 1 to 6 before anyone sees the private beta. Items 7 to 9 before public launch. Item 12 gates on Parliament.

On the outreach itself (not an action I took): the letter to Parliament should cite the audit, the corrections path, ADR 0002 and the refresh plan, and say Pair Search exists and this is a different thing. An OGP contact is easier after items 1 to 6, because the first thing they open will be the README.

## How to talk about AI use

Position: say it first, say it plainly, then say what a human did. Hiding it is the worst option because the evidence (`CLAUDE.md`, `pipeline.json`, commit cadence) is findable in a minute. The audits already describe the models in plain terms ("An Opus auditor measured the database... Sonnet readers did the hand checks"), so the honest account exists; it only needs a front door.

What to state (draft for `docs/how-this-was-built.md`, then a three-line version in the README):

1. **Tools used.** Most code, tests and docs were written with an AI coding assistant working from written plans (`plans/`), under conventions in `CLAUDE.md` and `STYLE.md`. Model readers checked sample rows against the source HTML.
2. **What the human decided.** Scope, the definition of each metric (ADR 0001's denominator is a human choice that moves the headline), what counts as an error (the tier table), which fixes ship, and every write to the production database. List two or three concrete cases where you overruled the tooling or reversed a decision (ADR 0005 to 0008 is one).
3. **What checks the output.** Tests with golden fixtures, the three-number measure run before and after each change, the loss register, and a human-read sample (after item 4). Say the AI readers have limits and that is why the human sample exists.
4. **What is not covered.** The app has few tests today (until item 9). Say so.
5. **Who answers for it.** Your name, one email.

Rules for tone:

- Do not defend. A paragraph, not a manifesto. Skeptics read length as anxiety.
- Do not claim "reviewed every line" unless true. Say what you did read. In the hand-check wording, name the reader type each time (human, model).
- Do not use "AI-powered" as a feature of the site. The site does not use a language model at read time; say that if it holds, because it is the reassurance Parliament officials and journalists need.
- To OGP, state it as a working method. Their own careers site lists an AI Native team [unverified, snippet]. Point to the process (plans, audits, gates) as the thing you are good at, not to the tool.
- Keep commit attribution as it is. Your rule is no attribution trailers, so the how-built doc is where AI use is disclosed, not the commits. Put the disclosure where a visitor lands (README and methods page footer), not only in `CLAUDE.md`.

A line that would work on HN, to adapt: "I built this with an AI coding assistant doing most of the typing. The plans, the metric definitions and every write to the database are mine. Here is the audit that says it is not done, and here are 100 rows I checked myself."

## Sources fetched or searched

- Parliament newsroom on Pair Search: https://www.parliament.gov.sg/newsroom/events/details/ai-powered-search-engine-for-singapore's-hansard-reports (fetched)
- Pair Search prototype page: https://hack.gov.sg/hack-for-public-good-2024/2024-projects/pairsearch/ (fetched)
- OGP reports page: https://reports.open.gov.sg/pairsearch (fetched)
- OGP careers: https://open.gov.sg/careers (fetched); other careers URLs returned 404 or appeared only as search snippets
- Par-leh-mate talk: https://www.secoda.co/mds-fest-3-0/building-and-analysing-a-structured-dataset-of-singapores-parliamentary-speeches---par-leh-mate (fetched)
- Katz and Alexander: https://pmc.ncbi.nlm.nih.gov/articles/PMC10460412 (fetched)
- All TheyWorkForYou, openparliament.ca, Open Discourse, Stanford and GermaParl claims: search snippets only, marked [unverified]. openparliament.ca/about returned 403.
