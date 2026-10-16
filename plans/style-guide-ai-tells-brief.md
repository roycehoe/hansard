# Style guide AI tells: Brief

## Feature description

`app/STYLE.md` gains a `## Visual design` section that lists the AI tells in this app's layout, type, colour, radius, shadow, icons and motion, and tells a contributor how to avoid each one. The section uses the same format as `## Copy`: each symptom gets a source link, a fix and a Before/After from this codebase, then the house rules, then a review checklist. The rules come from the UI cleanup skills that the hansard-polish run gathered on 14 Oct 2026. They were filtered down to tells that apply to a read-only record browser, or that Claude produces by default with shadcn and Tailwind. The examples come from the taste proposals Royce accepted in that run. The same change adds the missing copy rules to `## Copy`, puts `tabular-nums` into `## Tables`, and rewrites the parts of `### Animations` that contradict the skills. No code in `app/src` changes.

## Source material

The polish run's scratchpad research files no longer exist. Read the subagent transcripts instead. They sit under `~/.claude/projects/-Users-meinhardt-ghq-github-com-roycehoe-handsard-scraper/b6495b6b-3458-43df-b694-6be8a1368c07/subagents/`. Each report is the text of the agent's last message or of its report tool call.

| File | Contents |
|---|---|
| `agent-a2765ecb7c71e5bc8.jsonl` | Skills researcher. Covers seven sources, the rules taken from each, a 49-item merged checklist under seven headings (type, colour, layout, icons, motion and states, copy, process), and the rules that conflict with foundation decisions. |
| `agent-ab151083c4906346b.jsonl` | Opus judge verdict. Holds clear fixes C1 to C7, taste proposals T1 to T11 with file:line, the AI-look reason and source URLs, and the 16 findings checked and rejected. |
| `agent-a804c4ec9e2b6cd42.jsonl` | Articles researcher, the source of the `ai-tells-articles.md` item numbers that the verdict cites. |
| `agent-a440d092e58b808a9.jsonl` | Developer-discussion researcher, the source of the `ai-tells-dev-discussion.md` item numbers. |

The verdict numbers Inter vs Source Sans 3 as T3. Royce's picks are in `plans/hansard-polish.pipeline.json` under `taste-artifact` and `follow-up`. He accepted T1, T2 and T4 to T12 and rejected T3. The verdict lists 11 proposals while the pipeline JSON counts 12. Count the T numbers the follow-up commits applied, and don't trust either total.

The vetted skills, with the URLs the guide links:
- Anthropic frontend-design: https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md
- anti-ai-slop: https://github.com/Vinayak-Shukla-03/anti-ai-slop
- DeSlop: https://github.com/nate-zz/DeSlop
- Impeccable: https://github.com/pbakaus/impeccable and https://www.impeccable.style/slop
- Hallmark: https://github.com/Nutlope/hallmark
- addyosmani frontend-ui-engineering: https://github.com/addyosmani/agent-skills/blob/main/skills/frontend-ui-engineering/SKILL.md

## Resolved terminology

| Term | Canonical meaning |
|---|---|
| AI tell | A visible pattern in the design or UI copy that people associate with AI-generated websites. Taken from `plans/hansard-polish-brief.md`. The guide never says "slop". |
| Clear fix | Fixing an AI tell when the fix removes something broken, fake or non-functional, or brings code into line with a hard rule in this guide. A contributor applies it without asking. |
| Taste proposal | Fixing an AI tell when the fix changes type, colour, spacing, layout, radius, shadow, icons or component choice beyond what a hard rule requires, or reverses a pick Royce made. It needs a before and an after, and Royce decides. |
| House choice | A foundation decision that one or more sources call an AI tell, which stays on purpose. The guide records each one with its reason. |

## Decisions

1. **"AI tell" is the term.** It matches the polish brief. The guide doesn't use "slop".
2. **One new `## Visual design` section.** It goes after `## Styling` and copies the shape of `## Copy`: an intro, `### Symptoms`, `### Rules for this codebase`, `### House choices where sources disagree` and `### Review checklist`. One place to scan is easier for a reviewer than rules spread across sections. A rule that belongs to an existing section goes there, and the new section links to it.
3. **Filter for this app.** A rule goes in only if it applies to a read-only record browser, or if it's a tell Claude produces by default with shadcn and Tailwind. Pure landing-page items stay out: hero layout, social proof, pricing grids, marquees, KPI rows, fake browser chrome and so on. The guide's header limits it to "things a contributor would get wrong without being told", and these rules meet that test only for this app.
4. **The examples are this codebase's own.** Each symptom's Before/After comes from an accepted taste proposal or a clear fix. The list:
   - search results and the home page as divided rows, not cards (T1, T2);
   - the coverage counts as a table, not a stat grid (T4);
   - a card with a border and no shadow (T5);
   - badges with `rounded-sm`, not `rounded-full` (T6);
   - one quiet style for repeated per-item actions (T7);
   - numeric columns right-aligned with `tabular-nums` (T8);
   - no specimen or scaffold pages in the primary nav, and no nav that wraps at 375 px (T9);
   - sentence case and `…` on buttons (T10);
   - specimen copy that describes real features (T11, C4);
   - shadcn template residue such as "No Results." (C3);
   - no placeholder `#` links (C1);
   - one link to the same destination per view (C6).
5. **New copy rules go in `## Copy`.** The guide gets five new symptoms or rules there:
   - a button names a verb and an object, never Submit or OK;
   - an error doesn't guess a cause it can't know, the C5 "Check your connection" lesson;
   - every figure comes from the data, with no invented counts or claims;
   - plurals are right for 0 and 1 (C2);
   - counts use `NUMBER_LOCALE` separators everywhere (C7).

   Rules already in `## Copy` aren't repeated.
6. **`tabular-nums` goes in `## Tables`.** The guide adds a short rule there that numeric columns are right-aligned with `tabular-nums` on the cell and `text-right` on the head. `## Visual design` links to it.
7. **House choices are listed with reasons.** Each one names the sources that object to it, so a future review doesn't re-flag it.
   - Inter for UI text. SGDS v3 sets `--sgds-font-family-brand` to Inter, Royce rejected Source Sans 3 on 14 Oct 2026, and `docs/sgds-tokens.md:188` records this. It is paired with Source Serif 4 for headings and speech text.
   - Serif headings. These are Source Serif 4 for the reading product (`docs/sgds-tokens.md:187`).
   - Lucide, used for functions only and never as decoration or as an icon tile.
   - shadcn primitives, changed only by the overrides recorded in `docs/sgds-tokens.md`.
   - The lilac search highlight, sampled from the national flower under the insignia palette (`docs/palette.md`). It is a text highlight, not a purple brand accent or gradient.
   - The off-white background, #fcfaf7 with chroma 0.004. It isn't the cream of frontend-design's cream, serif and terracotta cluster, and the accent is gown-red #8d0f14, not terracotta.
   - Monospace on `/palette`, used for hex, RGB, OKLCH values and token names, which is functional.
   - ALL CAPS report titles, which come from the Official Report source data.
8. **The `### Animations` contradictions are fixed in place.**
   - The transitions table names the transitioned properties and drops `transition-all`. Expand and collapse use `transition-[grid-template-rows] duration-300 ease-in-out`, or `transition-[height]` where the content has a fixed height. A drawer or sidebar uses `transition-transform duration-200 ease-out`.
   - The "Decorative animations" paragraph and its `animate-pulse-glow` example are replaced. The new rule is that motion only answers a user action or shows real progress, and that there is no decorative animation. The class doesn't exist in `app/src`. It came over from kelix-audit.
   - Primitives in `components/ui/` stay untouched, so `sheet.tsx:60` keeps its `transition-all`.
   - The `Spinner` rule and the reduced-motion behaviour in `index.css` stay.
9. **Rule strength follows the guide's existing convention.** Checkable tells are hard rules, for example no gradient text, no border plus shadow on one element, records as divided rows, badge radius, no `transition-all` or hover scale, no emoji as icons, and no eyebrow labels. Judgment calls are marked **Preference**, for example one focal point per screen, spending boldness in one place, and density that matches the task.
10. **Enforcement is a review checklist.** It holds `rg` sweeps over the diff and one manual look, with no ESLint rule. The sweeps cover added lines outside `components/ui/` and match:
    - `bg-gradient`, `bg-linear`, `bg-clip-text`, `backdrop-blur`;
    - `transition-all`, `hover:scale`;
    - `rounded-full`, `rounded-xl`, `rounded-2xl`;
    - `shadow-`;
    - `uppercase tracking`;
    - emoji code points;
    - `href="#"`.

    The manual step is to open each changed route at 375 px and 1280 px and check it against the symptoms.
11. **The section opens with the clear fix vs taste proposal split.** A contributor applies a clear fix directly. A taste proposal needs a before and after for Royce, and nothing reaches master until he accepts it. This rule goes in `app/STYLE.md`, not `app/CLAUDE.md`, because STYLE.md is what a reviewer reads.
12. **Each symptom links its source once.** The links are the skill URLs above, plus an article URL where the verdict cites one.
13. **The change is limited to the docs.** It edits `app/STYLE.md`. `app/CLAUDE.md` "Styling" (around line 127) gets one pointer to `## Visual design` only if the existing pointer to "Styling" doesn't cover it. No code changes in `app/src`, and no `api/` changes.
14. **No ADR.** Every decision is a style-doc edit that's cheap to reverse.

## Scenarios confirmed

1. **A new card grid.** Claude adds "Recent sittings" to the home page as three shadcn Cards in a `md:grid-cols-3` grid. No grep catches it. The hard rule "a list of records is divided rows, not cards" and the 1280 px manual look catch it. Because the rule is a hard rule, the reviewer fixes it directly as a clear fix and no taste proposal is needed.
2. **A reviewer flags Inter.** A review agent reads frontend-design and reports Inter as the most cited AI font. The house-choices entry says Inter stays because SGDS v3 uses it as its brand font, and the agent drops the finding.
3. **A tell that changes the look.** Someone adds a "Live" status badge with a pulsing green dot and a pill shape. The pulse breaks the motion rule. The "Live" claim is false because the archive doesn't update. Both are clear fixes, and the pulse and badge go. A separate request to bring pill badges back reverses accepted pick T6, so it is a taste proposal and needs Royce's before and after.

## Out of scope

- Any change to code in `app/src`. The guide describes the current code. It doesn't trigger a new cleanup pass.
- The em dashes and other AI tells in STYLE.md's own prose, which has many from the kelix-audit copy. They get mentioned in the final report, not fixed.
- Landing-page tells with no counterpart in this app, listed in decision 3.
- An ESLint rule or any other automated check beyond the `rg` checklist.
- Installing any of the skills into `~/.claude/skills`, or running their scripts. Impeccable in particular downloads a binary and installs hooks, and the polish run vetted it as text-only.
- `api/` style docs.
