# How this was built

AI coding tools wrote most of the code and docs in this repository. Royce Hoe wrote the plans, made the decisions listed below and answers for the result. Everything here comes from the git history and the files in `plans/`.

## The October burst

The repository started at 19:11 on 13 October 2026. Up to commit `839d4bb`, made at 16:17 on 18 October 2026, it has 251 commits, all on `master`.

| Date | Commits |
| --- | --- |
| 13 October 2026 | 66 |
| 14 October 2026 | 124 |
| 15 October 2026 | 0 |
| 16 October 2026 | 22 |
| 17 October 2026 | 23 |
| 18 October 2026 | 16 |

38 of those commits landed between 11 pm and 2 am. That pace comes from agents committing one planned step at a time.

Every commit carries Royce's name, because the repository's rule is no attribution trailers. So git can't show which lines a person typed, and this page states the AI use instead.

The data comes from [roycehoe/hansard-scraper](https://github.com/roycehoe/hansard-scraper), a separate repository with its own history. It starts in August 2025, goes almost silent from September 2025 to May 2026, and has 333 commits in October 2026.

## How the work ran

The tool was Claude Code, Anthropic's coding agent, running Claude Opus and Claude Sonnet models. The larger features went through these steps, and each step left a file in `plans/`.

1. Royce answered the agent's questions about the feature, and the agent wrote his answers into a brief, `plans/*-brief.md`.
2. The agent wrote a plan and then an execution plan of numbered commits. A separate audit checked the execution plan against the plan before any code was written.
3. Workers wrote the code, one commit per step.
4. A validation pass checked the commits against the plan, and a fresh Opus session reviewed the whole change.

The largest example is `hansard-user-stories`. It had 27 steps, an audit with no blockers, 22 of 22 requirements covered at validation, and a final review that found 1 blocker and 13 should-fixes. All 14 were fixed. The files are `plans/hansard-user-stories-audit.md` and `plans/hansard-user-stories-validate.md`.

## What Royce decided

- What each feature does, through the briefs.
- The design. The models proposed changes and Royce picked. On 14 October he accepted 11 of 12 proposals from the AI-look review and 12 of 13 from a second round on search and the People filter, as `plans/hansard-polish.pipeline.json` records. He chose the mahogany accent over an orange timber one, recorded in `docs/adr/0005-palette-from-the-chamber.md`.

## Which audits checked the output

- **AI-look review, 14 October.** Three Sonnet researchers looked for patterns that make a site look machine-made, and a judge sorted what they found. The 6 clear fixes were applied. The 12 proposals that changed the design went to Royce. See `plans/hansard-polish-brief.md`.
- **Data sanity personas, 16 and 17 October.** Four Sonnet personas, a historian, a legal researcher, a journalist and a citizen, used the site against the production database and compared what they could against SPRS. An Opus pass re-ran every finding and confirmed 14: 2 high, 5 medium and 7 low. A second pass on 17 October found no high-severity regression. See `plans/data-sanity-personas-findings.md` and `plans/data-sanity-personas-2-findings.md`.
- **North star audit, 17 October.** An Opus auditor measured the database and both repositories against ten done tests, and the verdict is "Not done". Two tests pass, seven fail and one is unmeasured. Sonnet readers checked 406 rows credited to a person and found 404 right. The audit is `docs/report/north-star-audit-2026-10-17.md` in the scraper repository.

A model ran every check above. Royce has not yet read a sample of rows himself, and the methods page on the site says no person has read the checked rows.

## What is not checked

At commit `839d4bb`, neither `app/` nor `api/` has automated tests, and the repository has no CI.

## What the site does not do

The site calls no language model. Search is Postgres full-text search, and every page is built from stored rows.

## Contact

Royce Hoe, hansard@fancybinary.sg.
