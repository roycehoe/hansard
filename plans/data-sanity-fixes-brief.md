# Data sanity fixes: Brief

## Feature description

This run fixes the confirmed findings in `plans/data-sanity-personas-findings.md`. One Opus orchestrator starts a lead agent per group of findings, and each lead may start helpers. Fixes in `hansard` are committed directly. Fixes in `handsard-scraper` are committed to its master, applied to the rehearsal database, dry-run counted and reviewed. Every production write then waits for Royce's approval. The run updates the findings file as it goes, so each finding shows its group and its status.

## Groups

| Group | Findings | Repo | Writes data |
|---|---|---|---|
| G1. Bugs in this repo | DS-01, DS-02, the one-line API merge for DS-17's party filter | `hansard` | No |
| G2. Write #3 | Ship the scraper's write #3, plan v4. Then re-check DS-05, DS-06, DS-09, DS-15 and DS-18 and commits `ee80a9b` to `64e4128` on its data | `handsard-scraper` | Yes |
| G3. Speech fidelity loop detectors | DS-05, DS-09 | `handsard-scraper` | No |
| G4. Mechanical scraper rules | DS-04, DS-08, DS-11, DS-12 | `handsard-scraper` | Yes |
| G5. Reference data | DS-03, DS-16, DS-17, DS-10, DS-13, DS-19 | `handsard-scraper` | Yes |
| G6. Re-fetch one Sitting | DS-07 | `handsard-scraper` | Yes |

DS-14, the language markers, is deferred. It needs a new column, so it is a feature, not a fix.

## Decisions

1. **The rule against scraper edits is lifted for this run only.** The run may commit to `handsard-scraper` master and write to its databases for the groups above, and nothing else. Every write goes to the `hansard-rehearsal` container on port 5433 first. If rehearsal lacks the data, the run may restore it from a `pg_dump` of production, which only reads production. Each write then gets a dry run with counts, an Opus review, and a `docs/data-loss-register.md` row if it drops or changes source text.
2. **Every production write stops for Royce.** The orchestrator ends its turn with an approval packet and resumes only when Royce's approval is relayed. The packet holds the exact script, the rehearsal result, the dry-run counts, the review verdict, a backup of the affected rows and the rollback. The polish run's rule of going ahead with no stop once the gates pass does not apply here.
3. **Write #3 ships through the scraper's own plan v4.** The group follows that plan as written. It fixes report 22149 or lists it in the data-loss register, which is the round 3 Tier A failure.
4. **Order.** G1, G2, G6 preparation and G5 research run first, in parallel. G3 and G4 run after write #3 has been applied to rehearsal, and they work against that data. Their production writes queue behind write #3's production write. Only one group commits to `handsard-scraper` at a time. The rule against branches rules out worktrees.
5. **At most 4 agents run at once**, counting nested helpers. The machine ran low on memory on 16 Oct 2026 and Claude Code stopped the test servers. An agent that starts a server stops it when done.
6. **"Has text" (DS-02)** means a Report has at least one Speech.
7. **G3 adds DS-05 and DS-09 as census detectors** to the speech fidelity loop and records their counts. It does not run round 4.
8. **Models.** The orchestrator runs on Opus at xhigh effort. The leads of G2, G4, G5 and G6 run on Opus at high effort, because they decide what reaches production. G1 and G3 leads run on Sonnet, and G1 gets an Opus review before each commit. Helpers run on Sonnet or Haiku according to `~/.claude/CLAUDE.md`. Every spawned agent has its model set explicitly.
9. **Commits.** Conventional Commits, one logical change per commit, no attribution, no mention of Claude or AI. Run `git branch --show-current` before every commit. Never push.
10. **Production load.** One query at a time, bounded, with the backoff from the persona brief. Nobody prints `DATABASE_URL` or reads a `.env` file.

## Out of scope

- DS-14 and any other new column or feature.
- A full round 4 of the speech fidelity loop.
- Pushing either repo.
- Any production write without Royce's relayed approval.
