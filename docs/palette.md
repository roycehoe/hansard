# Palette

The colour tokens for the app, where each one came from, and the contrast each one reaches. The values live in `app/src/palette/palette.ts` and are generated into `app/src/palette.css`. `docs/palette-preview.html` shows every token in both themes. Running `pnpm contrast` from `app/` checks every pair listed below and exits 1 on any failure.

The current palette comes from the debating chamber in Parliament House and replaced the first palette on 17 Oct 2026 (ADR 0005). The first palette, taken from the building's exterior, the Speaker's gown and the former chamber, is kept below under "Version 1" with its sources, because the current palette still uses its state, highlight and flag colours.

## Method

1. Commons has no openly licensed photo of the current chamber (see "Gaps" in `docs/palette/research.md`). A worker searched official and press sources instead and kept Parliament's photo of the empty chamber from its facilities page, plus frames from sitting broadcasts. None of these photos has an open licence, so none is committed; each is cited below by URL (ADR 0005).
2. The sampling script runs k-means (k = 3) on a crop box around one object and records each cluster's hex, its share of the crop and its OKLCH value, as in v1. Before use it reproduced the v1 gown sample: #8d0f15 at 44.2% against the recorded #8d0f14 at 44%.
3. The official photo is the main source: even interior light, no people, and no mark visible at its size. Broadcast frames are rechecks only. Studio grading moves the leather to a mauve (hue 16 against 26) and greys the panelling (C 0.042 against 0.067), so no token takes a broadcast value.
4. Derived colours keep the parent's OKLCH hue and set the lightness, and usually the chroma. Where the result falls outside sRGB, chroma is lowered until it fits.
5. The first draft kept the page and panels on the stone walls and changed only the primary and the tags. It was too close to v1 ("there is hardly any difference"), so three variants with chamber surfaces were drawn up, with a timber, a leather and a mahogany primary. Royce chose mahogany on 17 Oct 2026. Leather was turned down because its hue (26) is the gown red's and near the PSP and SDP reds, and timber because an orange-brown primary on a cream page is the cream, serif and terracotta look `app/STYLE.md` lists as an AI tell.

Caveats:

- The official photo is small (670 by 377 px) and undated. Every crop is a few dozen pixels across.
- The floor carpet reads yellow in the photo (C 0.061). The page uses a paler tint of it (C 0.03), so the page is cream, not yellow.
- The panelling sample is the wall behind the Speaker's chair. Its shade cluster (C3) is close to the side panelling in the CNA frame.

## Sources

Crop boxes are fractions of the image: left, top, right, bottom. Shares are the cluster's share of the crop.

| Key | Colour | What it is | Source |
|---|---|---|---|
| C1 | #6d3e31 | Panelling on the wall behind the Speaker's chair, lit | `TheChamber.png`, box 0.43,0.20,0.60,0.40, 27.9% |
| C2 | #5b2f24 | Same panelling, mid tone | Same crop, 37.9% |
| C3 | #4a251b | Same panelling, in shade | Same crop, 34.1% |
| C4 | #9a5751 | Leather seat back, left benches, lit | `TheChamber.png`, box 0.045,0.63,0.11,0.74, 49.8%. Right benches (0.90,0.64,0.97,0.74) gave #99514a, 42.6% |
| C5 | #a64f17 | Front of the table of the House, lit | `TheChamber.png`, box 0.455,0.66,0.565,0.76, 40.5% |
| C6 | #fff3c5 | Floor carpet, centre aisle | `TheChamber.png`, box 0.36,0.82,0.62,0.97, 54.5% |

Photos, fetched 17 Oct 2026 and not committed:

- `TheChamber.png`. Parliament of Singapore, "The Chamber" on https://www.parliament.gov.sg/about-us/facilities, image https://cms.parliament.gov.sg/assets/ba94e15b-d7b7-4733-932b-7822b13ea479/TheChamber.png, 670 by 377 px. The empty chamber, no people.
- MDDI sitting broadcast, https://www.youtube.com/watch?v=vSzKCk0BCXk, frame https://i.ytimg.com/vi/vSzKCk0BCXk/maxresdefault.jpg, 1280 by 720 px. Members, the Mace and the channel's logo are in frame and outside every crop.
- CNA clip of the Speaker, 2022, https://www.youtube.com/watch?v=hCueuqgesEg, frame https://i.ytimg.com/vi/hCueuqgesEg/maxresdefault.jpg. The Speaker and the State Crest above the chair are in frame; crops take only the panelling at the edges and the canopy timber above the crest.

Rechecks (no token uses them):

| What | Broadcast value | Source |
|---|---|---|
| Speaker's wall panelling | #4d312c (86.0%), #492e28 (73.0%) | MDDI frame, boxes 0.28,0.17,0.46,0.34 and 0.54,0.17,0.72,0.34 |
| Side panelling beside the chair | #5b443a (48.3%), #5e463e (41.1%) | CNA frame, boxes 0,0,0.23,0.6 and 0.88,0.17,1,0.9 |
| Seat leather | #69373b (50.2%), #765052 (43.4%) | MDDI frame, boxes 0.72,0.43,0.765,0.53 and 0.08,0.55,0.125,0.65 |
| Table of the House | #704322 (52.9%) | MDDI frame, box 0.42,0.70,0.61,0.88 |
| Floor carpet | #f5edc4 (37.0%), #ebe2ba (37.0%) | MDDI frame, box 0.33,0.84,0.39,0.93 |

Sampled and not used: the stone beside the Speaker's wall (#d1b398, `TheChamber.png` box 0.36,0.10,0.41,0.45) and the side wall (#898278, MDDI frame box 0.735,0.08,0.81,0.26), which carried the page and panels in the first draft; the red stair carpet (#a65354), at the leather's hue; and the timber rail posts (#853c1c), within one step of C5.

## Named colours

Every hex is written once, in `app/src/palette/palette.ts`, as a named colour. Names describe the source, not the role (`panelling`, `seat-leather`, `table-timber`, `floor-carpet`, and from v1 `crest-red`, `lawn`, `gold-lace`, `sky-blue`, `orchid-lilac`, `flag-white`). A derived colour is named after its parent plus its OKLCH lightness times 100 (`panelling-80`, `table-timber-90`). The semantic tokens below point at named colours (`--primary: var(--panelling)`), and `pnpm palette` generates `app/src/palette.css` from the module; `pnpm contrast` refuses to run if that file is stale. Named colours are not registered in `@theme`, so no `bg-panelling` utility exists and components still use semantic tokens only. The public `/palette` route lists every named colour with its values, the tokens that use it and its source. A v1 photo source shows a thumbnail from `app/public/palette-photos/` with its credit and licence. The chamber source links to Parliament's page instead, because the photo has no open licence.

## Tokens

Roles: surface (a background something sits on), text, accent (brand colour and chart marks), border, state (success, warning, info, destructive). S keys refer to "Version 1, Sources" below.

| Token | Role | Light | Dark | Named colour (light / dark) | Citation (light / dark) |
|---|---|---|---|---|---|
| background | surface | #f8f2dc | #22110c | floor-carpet-96 / panelling-20 | derived from C6 / derived from C1 |
| foreground | text | #281c19 | #eee8d2 | panelling-24 / floor-carpet-93 | derived from C1 / derived from C6 |
| card | surface | #ffffff | #301b16 | flag-white / panelling-25 | S17 (v1) / derived from C1 |
| card-foreground | text | #281c19 | #eee8d2 | panelling-24 / floor-carpet-93 | derived from C1 / derived from C6 |
| popover | surface | #ffffff | #301b16 | flag-white / panelling-25 | S17 (v1) / derived from C1 |
| popover-foreground | text | #281c19 | #eee8d2 | panelling-24 / floor-carpet-93 | derived from C1 / derived from C6 |
| primary | accent | #6d3e31 | #e1b1a3 | panelling / panelling-80 | C1 / derived from C1 |
| primary-foreground | text | #ffffff | #4a251b | flag-white / panelling-shade | S17 (v1) / C3 |
| secondary | surface | #f3d8ca | #422922 | table-timber-90 / panelling-31 | derived from C5 / derived from C1 |
| secondary-foreground | text | #281c19 | #eee8d2 | panelling-24 / floor-carpet-93 | derived from C1 / derived from C6 |
| muted | surface | #f7e3da | #38231d | table-timber-93 / panelling-28 | derived from C5 / derived from C1 |
| muted-foreground | text | #674837 | #b7b19c | table-timber-43 / floor-carpet-76 | derived from C5 / derived from C6 |
| accent | surface (hover) | #efd0c1 | #4a2d1e | table-timber-88 / table-timber-33 | derived from C5 / derived from C5 |
| accent-foreground | text | #281c19 | #eee8d2 | panelling-24 / floor-carpet-93 | derived from C1 / derived from C6 |
| destructive | state | #c8102e | #ef6666 | crest-red / crest-red-68 | S18 (v1) / derived from S18 (v1) |
| destructive-foreground | text | #ffffff | #22110c | flag-white / panelling-20 | S17 (v1) / derived from C1 |
| success | state | #596d2c | #a5b961 | lawn / lawn-sunlit-75 | S13 (v1) / derived from S14 (v1) |
| success-foreground | text | #ffffff | #22110c | flag-white / panelling-20 | S17 (v1) / derived from C1 |
| warning | state | #7b5e2f | #d8a459 | gold-lace-50 / crest-gold | derived from S6 (v1) / S19 (v1) |
| warning-foreground | text | #ffffff | #22110c | flag-white / panelling-20 | S17 (v1) / derived from C1 |
| info | state | #0c4a7a | #8bb2d9 | sky-blue-40 / sky-blue-75 | derived from S22 (v1) / derived from S22 (v1) |
| info-foreground | text | #ffffff | #22110c | flag-white / panelling-20 | S17 (v1) / derived from C1 |
| reading | surface (transcript) | #ffffff | #2d1a10 | flag-white / table-timber-24 | S17 (v1) / derived from C5 |
| reading-foreground | text | #281c19 | #ddd8c2 | panelling-24 / floor-carpet-88 | derived from C1 / derived from C6 |
| separator | border (decorative) | #e1bfae | #4d332c | table-timber-83 / panelling-35 | derived from C5 / derived from C1 |
| overlay | surface (scrim) | #22110c | #22110c | panelling-20 / panelling-20 | derived from C1 / derived from C1 |
| primary-hover | accent (hover) | #5b2f24 | #ecc3b7 | panelling-mid / panelling-85 | C2 / derived from C1 |
| primary-active | accent (active) | #4a251b | #f7d5cc | panelling-shade / panelling-90 | C3 / derived from C1 |
| secondary-hover | surface (hover) | #ebcdbe | #4d332c | table-timber-87 / panelling-35 | derived from C5 / derived from C1 |
| secondary-active | surface (active) | #e4c2b2 | #533831 | table-timber-84 / panelling-37 | derived from C5 / derived from C1 |
| destructive-hover | state (hover) | #b00826 | #ff8481 | crest-red-48 / crest-red-75 | derived from S18 (v1) / derived from S18 (v1) |
| destructive-active | state (active) | #97061f | #ff9b97 | crest-red-43 / crest-red-79 | derived from S18 (v1) / derived from S18 (v1) |
| highlight | accent (search matches, tags) | #e8cbf9 | #513460 | orchid-lilac-88 / orchid-lilac-38 | derived from S20 (v1) / derived from S20 (v1) |
| highlight-foreground | text | #281c19 | #eee8d2 | panelling-24 / floor-carpet-93 | derived from C1 / derived from C6 |
| tag | surface (chip) | #fbd3cf | #552926 | seat-leather-90 / seat-leather-34 | derived from C4 / derived from C4 |
| tag-foreground | text | #281c19 | #eee8d2 | panelling-24 / floor-carpet-93 | derived from C1 / derived from C6 |
| tag-border | border (chip) | #9a5751 | #c5766f | seat-leather / seat-leather-65 | C4 / derived from C4 |
| border | border | #9d6e56 | #8f6753 | table-timber-58 / table-timber-55 | derived from C5 / derived from C5 |
| input | border | #9d6e56 | #a57c67 | table-timber-58 / table-timber-62 | derived from C5 / derived from C5 |
| ring | border (focus) | #6d3e31 | #e1b1a3 | panelling / panelling-80 | C1 / derived from C1 |
| chart-1 | accent (chart) | #6d3e31 | #dc795d | panelling / panelling-68 | C1 / derived from C1 |
| chart-2 | accent (chart) | #596d2c | #7a8c34 | lawn / lawn-sunlit | S13 (v1) / S14 (v1) |
| chart-3 | accent (chart) | #0c4a7a | #6194c4 | sky-blue-40 / sky-blue-65 | derived from S22 (v1) / derived from S22 (v1) |
| chart-4 | accent (chart) | #a68758 | #a68758 | gold-lace / gold-lace | S6 (v1) / S6 (v1) |
| chart-5 | accent (chart) | #a64f17 | #be6431 | table-timber / table-timber-60 | C5 / derived from C5 |
| sidebar | surface | #f7e3da | #301b16 | table-timber-93 / panelling-25 | derived from C5 / derived from C1 |
| sidebar-foreground | text | #281c19 | #eee8d2 | panelling-24 / floor-carpet-93 | derived from C1 / derived from C6 |
| sidebar-primary | accent | #6d3e31 | #e1b1a3 | panelling / panelling-80 | C1 / derived from C1 |
| sidebar-primary-foreground | text | #ffffff | #4a251b | flag-white / panelling-shade | S17 (v1) / C3 |
| sidebar-accent | surface (hover) | #efd0c1 | #4a2d1e | table-timber-88 / table-timber-33 | derived from C5 / derived from C5 |
| sidebar-accent-foreground | text | #281c19 | #eee8d2 | panelling-24 / floor-carpet-93 | derived from C1 / derived from C6 |
| sidebar-border | border | #9d6e56 | #8f6753 | table-timber-58 / table-timber-55 | derived from C5 / derived from C5 |
| sidebar-ring | border (focus) | #6d3e31 | #e1b1a3 | panelling / panelling-80 | C1 / derived from C1 |

The light theme sets near-black panelling text on the floor carpet's cream, with white cards and a white reading column. Pale timber makes the panels, hover surfaces and lines, the mahogany panelling is the one brand colour, and pale leather marks the tags. The dark theme sets cream carpet text on a background derived from the panelling, with a timber cast on the reading column. The states, the search highlight and white keep their v1 sources.

## Derived colours

Each derived colour keeps its parent's OKLCH hue. L is OKLCH lightness (0 to 1), C is chroma.

| Name | Value | Parent | How | Tokens |
|---|---|---|---|---|
| floor-carpet-76 | #b7b19c | C6 floor-carpet | L 0.76, C 0.03 | muted-foreground (dark) |
| floor-carpet-88 | #ddd8c2 | C6 floor-carpet | L 0.88, C 0.03 | reading-foreground (dark) |
| floor-carpet-93 | #eee8d2 | C6 floor-carpet | L 0.93, C 0.03 | foreground (dark), card-foreground (dark), popover-foreground (dark), secondary-foreground (dark), accent-foreground (dark), highlight-foreground (dark), tag-foreground (dark), sidebar-foreground (dark), sidebar-accent-foreground (dark) |
| floor-carpet-96 | #f8f2dc | C6 floor-carpet | L 0.96, C 0.03 | background (light) |
| panelling-20 | #22110c | C1 panelling | L 0.20, C 0.03 | background (dark), destructive-foreground (dark), success-foreground (dark), warning-foreground (dark), info-foreground (dark), overlay (light), overlay (dark) |
| panelling-24 | #281c19 | C1 panelling | L 0.24, C 0.02 | foreground (light), card-foreground (light), popover-foreground (light), secondary-foreground (light), accent-foreground (light), reading-foreground (light), highlight-foreground (light), tag-foreground (light), sidebar-foreground (light), sidebar-accent-foreground (light) |
| panelling-25 | #301b16 | C1 panelling | L 0.25, C 0.035 | card (dark), popover (dark), sidebar (dark) |
| panelling-28 | #38231d | C1 panelling | L 0.28, C 0.035 | muted (dark) |
| panelling-31 | #422922 | C1 panelling | L 0.31, C 0.04 | secondary (dark) |
| panelling-35 | #4d332c | C1 panelling | L 0.35, C 0.04 | separator (dark), secondary-hover (dark) |
| panelling-37 | #533831 | C1 panelling | L 0.37, C 0.04 | secondary-active (dark) |
| panelling-68 | #dc795d | C1 panelling | L 0.68, C 0.13 | chart-1 (dark) |
| panelling-80 | #e1b1a3 | C1 panelling | L 0.80, C 0.06 | primary (dark), ring (dark), sidebar-primary (dark), sidebar-ring (dark) |
| panelling-85 | #ecc3b7 | C1 panelling | L 0.85, C 0.05 | primary-hover (dark) |
| panelling-90 | #f7d5cc | C1 panelling | L 0.90, C 0.04 | primary-active (dark) |
| seat-leather-34 | #552926 | C4 seat-leather | L 0.34, C 0.065 | tag (dark) |
| seat-leather-65 | #c5766f | C4 seat-leather | L 0.65, C 0.1 | tag-border (dark) |
| seat-leather-90 | #fbd3cf | C4 seat-leather | L 0.90, C 0.045 | tag (light) |
| table-timber-24 | #2d1a10 | C5 table-timber | L 0.24, C 0.035 | reading (dark) |
| table-timber-33 | #4a2d1e | C5 table-timber | L 0.33, C 0.05 | accent (dark), sidebar-accent (dark) |
| table-timber-43 | #674837 | C5 table-timber | L 0.43, C 0.05 | muted-foreground (light) |
| table-timber-55 | #8f6753 | C5 table-timber | L 0.55, C 0.06 | border (dark), sidebar-border (dark) |
| table-timber-58 | #9d6e56 | C5 table-timber | L 0.58, C 0.07 | border (light), input (light), sidebar-border (light) |
| table-timber-60 | #be6431 | C5 table-timber | L 0.60, C as sampled | chart-5 (dark) |
| table-timber-62 | #a57c67 | C5 table-timber | L 0.62, C 0.06 | input (dark) |
| table-timber-83 | #e1bfae | C5 table-timber | L 0.83, C 0.045 | separator (light) |
| table-timber-84 | #e4c2b2 | C5 table-timber | L 0.84, C 0.045 | secondary-active (light) |
| table-timber-87 | #ebcdbe | C5 table-timber | L 0.87, C 0.04 | secondary-hover (light) |
| table-timber-88 | #efd0c1 | C5 table-timber | L 0.88, C 0.04 | accent (light), sidebar-accent (light) |
| table-timber-90 | #f3d8ca | C5 table-timber | L 0.90, C 0.035 | secondary (light) |
| table-timber-93 | #f7e3da | C5 table-timber | L 0.93, C 0.025 | muted (light), sidebar (light) |

Why the steps:

- `floor-carpet-96` is the page. The sampled carpet is a strong yellow (C 0.061), so the page keeps the hue at half the chroma. The other carpet steps are text and hover colours for the dark theme.
- The light timber steps (`table-timber-93` down to `table-timber-83`) are surfaces from quiet panel to pressed button to divider. `table-timber-58` is the control border, 3.23:1 on the panels at its tightest; `table-timber-43` is muted text, 4.5:1 on every light surface it meets.
- The dark panelling steps (`panelling-20` to `panelling-37`) are the page, cards, panels and pressed states, with chroma raised to 0.03 to 0.04 so the dark theme reads as mahogany rather than black. `table-timber-62` is the dark input border, because the 0.55 step fell under 3:1 on the dark panels.
- `panelling-80`, `-85` and `-90` are the dark primary and its hover and pressed steps. `panelling-68` (C 0.13) is dark `chart-1`; the 0.65 step at C 0.09 sat 0.060 (OKLab) from `chart-4`, closer than any v1 chart pair, and this one sits 0.085 and 0.097 from its nearest neighbours.
- `table-timber-60` is dark `chart-5`: the sampled timber gives 3.00:1 on the dark card, just under the minimum.
- `seat-leather-90` and `seat-leather-34` are the tag chips, `seat-leather-65` the dark chip border. The sampled leather is the light chip border.

## Contrast

Minimums: 4.5:1 for text (WCAG 2.2 AA, 1.4.3); 3:1 for the borders of controls (`border`, `input`), focus rings and chart marks (1.4.11). `separator` and `overlay` have no minimum: WCAG 2.2 AA sets no ratio for decorative lines, and the overlay is a scrim. The checker only requires that both exist in both themes. Output of `pnpm contrast` from `app/`, unedited:

```
light
pass  separator #e1bfae (no minimum)
pass  overlay #22110c (no minimum)
pass  14.74  foreground on background  (#281c19 on #f8f2dc, min 4.5)
pass  13.35  foreground on muted  (#281c19 on #f7e3da, min 4.5)
pass  12.19  foreground on secondary  (#281c19 on #f3d8ca, min 4.5)
pass  16.53  card-foreground on card  (#281c19 on #ffffff, min 4.5)
pass  16.53  popover-foreground on popover  (#281c19 on #ffffff, min 4.5)
pass   8.81  primary-foreground on primary  (#ffffff on #6d3e31, min 4.5)
pass  11.19  primary-foreground on primary-hover  (#ffffff on #5b2f24, min 4.5)
pass  13.36  primary-foreground on primary-active  (#ffffff on #4a251b, min 4.5)
pass  12.19  secondary-foreground on secondary  (#281c19 on #f3d8ca, min 4.5)
pass  11.03  secondary-foreground on secondary-hover  (#281c19 on #ebcdbe, min 4.5)
pass   9.96  secondary-foreground on secondary-active  (#281c19 on #e4c2b2, min 4.5)
pass  11.38  accent-foreground on accent  (#281c19 on #efd0c1, min 4.5)
pass   5.88  destructive-foreground on destructive  (#ffffff on #c8102e, min 4.5)
pass   7.22  destructive-foreground on destructive-hover  (#ffffff on #b00826, min 4.5)
pass   8.89  destructive-foreground on destructive-active  (#ffffff on #97061f, min 4.5)
pass   5.76  success-foreground on success  (#ffffff on #596d2c, min 4.5)
pass   6.03  warning-foreground on warning  (#ffffff on #7b5e2f, min 4.5)
pass   9.23  info-foreground on info  (#ffffff on #0c4a7a, min 4.5)
pass  16.53  reading-foreground on reading  (#281c19 on #ffffff, min 4.5)
pass  11.29  highlight-foreground on highlight  (#281c19 on #e8cbf9, min 4.5)
pass  12.06  tag-foreground on tag  (#281c19 on #fbd3cf, min 4.5)
pass  13.35  sidebar-foreground on sidebar  (#281c19 on #f7e3da, min 4.5)
pass   8.81  sidebar-primary-foreground on sidebar-primary  (#ffffff on #6d3e31, min 4.5)
pass  11.38  sidebar-accent-foreground on sidebar-accent  (#281c19 on #efd0c1, min 4.5)
pass   7.32  muted-foreground on background  (#674837 on #f8f2dc, min 4.5)
pass   8.21  muted-foreground on card  (#674837 on #ffffff, min 4.5)
pass   6.63  muted-foreground on muted  (#674837 on #f7e3da, min 4.5)
pass   6.05  muted-foreground on secondary  (#674837 on #f3d8ca, min 4.5)
pass   5.47  muted-foreground on secondary-hover  (#674837 on #ebcdbe, min 4.5)
pass   4.95  muted-foreground on secondary-active  (#674837 on #e4c2b2, min 4.5)
pass   5.65  muted-foreground on accent  (#674837 on #efd0c1, min 4.5)
pass   8.21  muted-foreground on reading  (#674837 on #ffffff, min 4.5)
pass   5.60  muted-foreground on highlight  (#674837 on #e8cbf9, min 4.5)
pass   7.86  primary on background  (#6d3e31 on #f8f2dc, min 4.5)
pass   8.81  primary on card  (#6d3e31 on #ffffff, min 4.5)
pass   8.81  primary on reading  (#6d3e31 on #ffffff, min 4.5)
pass   6.02  primary on highlight  (#6d3e31 on #e8cbf9, min 4.5)
pass   7.11  primary on muted  (#6d3e31 on #f7e3da, min 4.5)
pass   8.81  primary on popover  (#6d3e31 on #ffffff, min 4.5)
pass   9.98  primary-hover on background  (#5b2f24 on #f8f2dc, min 4.5)
pass  11.19  primary-hover on card  (#5b2f24 on #ffffff, min 4.5)
pass  11.19  primary-hover on reading  (#5b2f24 on #ffffff, min 4.5)
pass   9.03  primary-hover on muted  (#5b2f24 on #f7e3da, min 4.5)
pass  11.19  primary-hover on popover  (#5b2f24 on #ffffff, min 4.5)
pass   5.25  destructive on background  (#c8102e on #f8f2dc, min 4.5)
pass   5.88  destructive on card  (#c8102e on #ffffff, min 4.5)
pass   5.13  success on background  (#596d2c on #f8f2dc, min 4.5)
pass   5.76  success on card  (#596d2c on #ffffff, min 4.5)
pass   5.37  warning on background  (#7b5e2f on #f8f2dc, min 4.5)
pass   6.03  warning on card  (#7b5e2f on #ffffff, min 4.5)
pass   8.23  info on background  (#0c4a7a on #f8f2dc, min 4.5)
pass   9.23  info on card  (#0c4a7a on #ffffff, min 4.5)
pass   3.90  border on background  (#9d6e56 on #f8f2dc, min 3)
pass   4.38  border on card  (#9d6e56 on #ffffff, min 3)
pass   3.97  tag-border on tag  (#9a5751 on #fbd3cf, min 3)
pass   4.86  tag-border on background  (#9a5751 on #f8f2dc, min 3)
pass   5.45  tag-border on card  (#9a5751 on #ffffff, min 3)
pass   3.90  input on background  (#9d6e56 on #f8f2dc, min 3)
pass   4.38  input on card  (#9d6e56 on #ffffff, min 3)
pass   3.53  input on muted  (#9d6e56 on #f7e3da, min 3)
pass   3.23  input on secondary  (#9d6e56 on #f3d8ca, min 3)
pass   7.86  ring on background  (#6d3e31 on #f8f2dc, min 3)
pass   8.81  ring on card  (#6d3e31 on #ffffff, min 3)
pass   3.53  sidebar-border on sidebar  (#9d6e56 on #f7e3da, min 3)
pass   7.11  sidebar-ring on sidebar  (#6d3e31 on #f7e3da, min 3)
pass   7.86  chart-1 on background  (#6d3e31 on #f8f2dc, min 3)
pass   8.81  chart-1 on card  (#6d3e31 on #ffffff, min 3)
pass   5.13  chart-2 on background  (#596d2c on #f8f2dc, min 3)
pass   5.76  chart-2 on card  (#596d2c on #ffffff, min 3)
pass   8.23  chart-3 on background  (#0c4a7a on #f8f2dc, min 3)
pass   9.23  chart-3 on card  (#0c4a7a on #ffffff, min 3)
pass   3.01  chart-4 on background  (#a68758 on #f8f2dc, min 3)
pass   3.37  chart-4 on card  (#a68758 on #ffffff, min 3)
pass   4.99  chart-5 on background  (#a64f17 on #f8f2dc, min 3)
pass   5.60  chart-5 on card  (#a64f17 on #ffffff, min 3)

dark
pass  separator #4d332c (no minimum)
pass  overlay #22110c (no minimum)
pass  14.83  foreground on background  (#eee8d2 on #22110c, min 4.5)
pass  12.00  foreground on muted  (#eee8d2 on #38231d, min 4.5)
pass  10.88  foreground on secondary  (#eee8d2 on #422922, min 4.5)
pass  13.22  card-foreground on card  (#eee8d2 on #301b16, min 4.5)
pass  13.22  popover-foreground on popover  (#eee8d2 on #301b16, min 4.5)
pass   7.01  primary-foreground on primary  (#4a251b on #e1b1a3, min 4.5)
pass   8.31  primary-foreground on primary-hover  (#4a251b on #ecc3b7, min 4.5)
pass   9.76  primary-foreground on primary-active  (#4a251b on #f7d5cc, min 4.5)
pass  10.88  secondary-foreground on secondary  (#eee8d2 on #422922, min 4.5)
pass   9.37  secondary-foreground on secondary-hover  (#eee8d2 on #4d332c, min 4.5)
pass   8.65  secondary-foreground on secondary-active  (#eee8d2 on #533831, min 4.5)
pass  10.15  accent-foreground on accent  (#eee8d2 on #4a2d1e, min 4.5)
pass   5.86  destructive-foreground on destructive  (#22110c on #ef6666, min 4.5)
pass   7.69  destructive-foreground on destructive-hover  (#22110c on #ff8481, min 4.5)
pass   9.01  destructive-foreground on destructive-active  (#22110c on #ff9b97, min 4.5)
pass   8.42  success-foreground on success  (#22110c on #a5b961, min 4.5)
pass   8.13  warning-foreground on warning  (#22110c on #d8a459, min 4.5)
pass   8.21  info-foreground on info  (#22110c on #8bb2d9, min 4.5)
pass  11.58  reading-foreground on reading  (#ddd8c2 on #2d1a10, min 4.5)
pass   8.51  highlight-foreground on highlight  (#eee8d2 on #513460, min 4.5)
pass   9.88  tag-foreground on tag  (#eee8d2 on #552926, min 4.5)
pass  13.22  sidebar-foreground on sidebar  (#eee8d2 on #301b16, min 4.5)
pass   7.01  sidebar-primary-foreground on sidebar-primary  (#4a251b on #e1b1a3, min 4.5)
pass  10.15  sidebar-accent-foreground on sidebar-accent  (#eee8d2 on #4a2d1e, min 4.5)
pass   8.48  muted-foreground on background  (#b7b19c on #22110c, min 4.5)
pass   7.56  muted-foreground on card  (#b7b19c on #301b16, min 4.5)
pass   6.86  muted-foreground on muted  (#b7b19c on #38231d, min 4.5)
pass   6.22  muted-foreground on secondary  (#b7b19c on #422922, min 4.5)
pass   5.36  muted-foreground on secondary-hover  (#b7b19c on #4d332c, min 4.5)
pass   4.95  muted-foreground on secondary-active  (#b7b19c on #533831, min 4.5)
pass   5.80  muted-foreground on accent  (#b7b19c on #4a2d1e, min 4.5)
pass   7.72  muted-foreground on reading  (#b7b19c on #2d1a10, min 4.5)
pass   4.87  muted-foreground on highlight  (#b7b19c on #513460, min 4.5)
pass   9.55  primary on background  (#e1b1a3 on #22110c, min 4.5)
pass   8.52  primary on card  (#e1b1a3 on #301b16, min 4.5)
pass   8.70  primary on reading  (#e1b1a3 on #2d1a10, min 4.5)
pass   5.48  primary on highlight  (#e1b1a3 on #513460, min 4.5)
pass   7.73  primary on muted  (#e1b1a3 on #38231d, min 4.5)
pass   8.52  primary on popover  (#e1b1a3 on #301b16, min 4.5)
pass  11.32  primary-hover on background  (#ecc3b7 on #22110c, min 4.5)
pass  10.09  primary-hover on card  (#ecc3b7 on #301b16, min 4.5)
pass  10.31  primary-hover on reading  (#ecc3b7 on #2d1a10, min 4.5)
pass   9.15  primary-hover on muted  (#ecc3b7 on #38231d, min 4.5)
pass  10.09  primary-hover on popover  (#ecc3b7 on #301b16, min 4.5)
pass   5.86  destructive on background  (#ef6666 on #22110c, min 4.5)
pass   5.23  destructive on card  (#ef6666 on #301b16, min 4.5)
pass   8.42  success on background  (#a5b961 on #22110c, min 4.5)
pass   7.51  success on card  (#a5b961 on #301b16, min 4.5)
pass   8.13  warning on background  (#d8a459 on #22110c, min 4.5)
pass   7.24  warning on card  (#d8a459 on #301b16, min 4.5)
pass   8.21  info on background  (#8bb2d9 on #22110c, min 4.5)
pass   7.32  info on card  (#8bb2d9 on #301b16, min 4.5)
pass   3.67  border on background  (#8f6753 on #22110c, min 3)
pass   3.27  border on card  (#8f6753 on #301b16, min 3)
pass   3.58  tag-border on tag  (#c5766f on #552926, min 3)
pass   5.37  tag-border on background  (#c5766f on #22110c, min 3)
pass   4.79  tag-border on card  (#c5766f on #301b16, min 3)
pass   4.92  input on background  (#a57c67 on #22110c, min 3)
pass   4.39  input on card  (#a57c67 on #301b16, min 3)
pass   3.98  input on muted  (#a57c67 on #38231d, min 3)
pass   3.61  input on secondary  (#a57c67 on #422922, min 3)
pass   9.55  ring on background  (#e1b1a3 on #22110c, min 3)
pass   8.52  ring on card  (#e1b1a3 on #301b16, min 3)
pass   3.27  sidebar-border on sidebar  (#8f6753 on #301b16, min 3)
pass   8.52  sidebar-ring on sidebar  (#e1b1a3 on #301b16, min 3)
pass   6.01  chart-1 on background  (#dc795d on #22110c, min 3)
pass   5.36  chart-1 on card  (#dc795d on #301b16, min 3)
pass   4.88  chart-2 on background  (#7a8c34 on #22110c, min 3)
pass   4.35  chart-2 on card  (#7a8c34 on #301b16, min 3)
pass   5.67  chart-3 on background  (#6194c4 on #22110c, min 3)
pass   5.06  chart-3 on card  (#6194c4 on #301b16, min 3)
pass   5.40  chart-4 on background  (#a68758 on #22110c, min 3)
pass   4.81  chart-4 on card  (#a68758 on #301b16, min 3)
pass   4.38  chart-5 on background  (#be6431 on #22110c, min 3)
pass   3.91  chart-5 on card  (#be6431 on #301b16, min 3)
```

## Serif

**Source Serif 4** for headings and Hansard text, with Inter for the interface.

- Body legibility. It is a transitional serif with an even texture, open counters and a moderate x-height. The optical size axis (8 to 60) gives a sturdier text cut at 16 to 18 px and a finer display cut for headings, from one family.
- Italic. A true italic, served as its own file, not a slanted roman. Hansard sets procedural notes ("Question put, and agreed to.") in italic, so this matters.
- Figures. Google Fonts serves it with tabular and proportional figures (`tnum`, `pnum`) and fractions. Old-style figures are not available: Google's served files strip `onum` for every candidate checked (Source Serif 4, Literata, Newsreader, Spectral, EB Garamond, Crimson Pro, Fraunces). Lining tabular figures suit column numbers, dates and vote counts anyway.
- Weights. 200 to 900 on one variable axis. The app loads 400 to 700, roman and italic.
- Pairing with Inter. Both are plain, modern designs with similar proportions, so a serif heading over Inter controls looks like one system, not two.
- Tone. It looks like a printed official report without imitating one. Garamonds and Caslons lean towards old books; Fraunces is too expressive for a record.

**Runner-up: Literata.** It was built for long-form screen reading and has the same axes, a true italic and tabular figures, so it would serve the transcript well. It lost on tone: its heavier wedge serifs and darker texture read as a novel more than a record, and its headings sit less quietly beside Inter.

Newsreader came close, but Google serves it without fractions or `locl`, and its text sizes run tight. Crimson Pro and EB Garamond have small x-heights that make long transcripts harder at 16 px. Spectral has no optical size axis, so one cut has to serve both headings and body.

Loaded in `app/index.html` with one Google Fonts stylesheet link (and preconnects). `--font-serif` is `'Source Serif 4', ui-serif, Georgia, serif`. `--font-sans` stays Inter.

## Identity marks

The palette takes colours only. The crest red and crest gold are hex values read from the crest's published SVG; the crest itself, the Lion Head symbol, the mace image, the Parliament logo and the "A Singapore Government Agency Website" masthead never appear in the app or in the preview. The header is a plain wordmark set in Source Serif 4. Every page footer reads "Not an official Parliament site." See `docs/adr/0002-no-government-identity-marks.md`.

## Version 1: Parliament House palette (13 Oct 2026, superseded)

The first palette, replaced on 17 Oct 2026 (ADR 0005). Its tokens and contrast output below are history. Its sources still back the colours the current palette keeps: S6 gold lace, S13 and S14 lawn, S17 flag white, S18 and S19 crest red and gold, S20 orchid lilac and S22 evening sky. Statements below that the gown red is the primary or is not to be re-opened describe v1.

### Method

1. Workers fetched openly licensed photos of Parliament House, the Speaker's ceremonial gown and the former chamber from Wikimedia Commons. The committed copies and their licences are in `docs/palette/sources/` and `docs/palette/sources/SOURCES.md`.
2. Each worker ran PIL k-means on a crop around one object (gown satin, stone cladding, lawn and so on) and recorded the cluster hex, its share of the crop and the lighting.
3. Insignia colours come from published specifications, not photos: the flag's white, and the State Crest's red and gold as filled in its SVG. The palette takes the colours and reproduces no artwork.
4. During synthesis, every photo a token is sampled from was viewed, k-means was re-run on the crops relied on most, and two extra samples were taken: the blue sign lettering (since retired under decision 26) and the gold lace on the gown's cuff.
5. Where a sampled colour is too dark or too light for text on a given theme, it stays where it passes (accent, border, chart) and a derived token covers text. Derived tokens keep the parent's OKLCH hue and change its lightness, and sometimes its chroma. Each one is listed under "Derived tokens".

Caveats:

- Every chamber interior photo on Commons with an open licence shows the former chamber in the Old Parliament House (now The Arts House), not the current chamber. The teak and leather samples come from there.
- The gown photos were taken under museum spotlights. The satin reads darker in shadow (#62090b) than under light (#8d0f14). The lit value is used.
- Photo samples carry the light they were taken in. The cladding reads warm grey in direct sun and cooler under overcast skies.

### Sources

Crop boxes are fractions of the image: left, top, right, bottom. Shares are the cluster's share of the crop.

| Key | Colour | What it is | Source |
|---|---|---|---|
| S1 | #8d0f14 | Gown red satin facing, lit | `speaker-ceremonial-gown-01.jpg`, box 0.44,0.40,0.47,0.85, 44%. Recheck at 0.425,0.45,0.465,0.80 gave #8e0f15 (43%) |
| S2 | #62090b | Gown red satin, shaded | Same file and box, 51% |
| S3 | #252320 | Gown black cloth, ambient light | `speaker-ceremonial-gown-01.jpg`, box 0.31,0.45,0.36,0.70, 52%. Recheck gave #22201d |
| S4 | #ede8d9 | Gown gold lace, highlight | `speaker-ceremonial-gown-01.jpg`, box 0.375,0.40,0.42,0.75, 40% |
| S5 | #efe2b7 | Gown gold lace on the cuff, highlight | `speaker-ceremonial-gown-01.jpg`, box 0.66,0.56,0.80,0.62, 22% (synthesis sample) |
| S6 | #a68758 | Gown gold lace on the cuff, mid tone | Same box, 20% (synthesis sample) |
| S7 | #bab2a7 | Stone cladding, sunlit wall block | `parliament-house-2023-079.jpg`, box 0.095,0.43,0.16,0.5, 90%. Recheck gave #bdb5aa |
| S8 | #bdb3a6 | Painted perimeter fence bars, sunlit | `parliament-house-2023-079.jpg`, box 0.00,0.62,0.60,0.80, bright-pixel estimate |
| S9 | #908d82 | Granite sign plate, overcast | `parliament-house-2023-01.jpg`, box 0.08,0.62,0.12,0.8, 68% |
| S10 | #868680 | Honed speckled granite of the sign face | Retired (decision 26): the source photo showed the State Crest and the Mace and was removed. Replaced by S23 |
| S11 | #595855 | Concrete kerb in shadow, Parliament Place | `parliament-place-road.jpg`, box 0.0,0.55,0.12,0.9, 44% |
| S12 | #175082 | Blue lettering on the Parliament sign | Retired (decision 26), same photo. Replaced by S22 |
| S13 | #596d2c | Front lawn, overcast | `parliament-house-2013-02-25.jpg`, box 0.05,0.85,0.45,0.98, 28% |
| S14 | #7a8c34 | Lawn in direct sun | `parliament-house-2023-01.jpg`, box 0.55,0.55,0.95,0.68, 54% |
| S15 | #b65229 | Clay hip roof, sunlit slope | `parliament-house-2010-08-03.jpg`, box 0.306,0.334,0.3625,0.39, 75%, evening light |
| S16 | #75300f | Teak gallery front panelling, former chamber | `former-chamber-strangers-gallery.jpg`, box 0.05,0.6,0.7,0.82, 46%. Recheck gave #77310e |
| S17 | #ffffff | National flag white | Specified as Pantone White (National Heritage Board, citing the Singapore Arms and Flag and National Anthem (Amendment) Rules 2007); sRGB #FFFFFF in the Wikipedia "Flag of Singapore" infobox |
| S18 | #c8102e | State Crest shield red | `Coat_of_arms_of_Singapore.svg` on Wikimedia Commons, `fill: #c8102e` |
| S19 | #d8a459 | State Crest gold | Same SVG, `.st544 { fill: #d8a459 }`, the most used gold (93 elements) |
| S20 | #d9a6f4 | Vanda Miss Joaquim petal, lilac | `pc-vanda-miss-joaquim.jpg`, box 0.70,0.33,0.80,0.45, 36.2%, daylight in a shaded garden (Track B) |
| S21 | #843d17 | Teak bench fronts, former chamber | `civic-chamber-benches.jpg`, box 0.25,0.50,0.75,0.55, 44.9%, interior light (Track B); agrees with S16 |
| S22 | #85a4c2 | Evening sky above Parliament House | `parliament-house-2010-08-03.jpg`, box 0.0,0.0,0.3,0.22, 42%, no building in the crop (decision 26) |
| S23 | #655b51 | Granite pylon of Cavenagh Bridge, shaded face | `civic-cavenagh-pylon.jpg`, box 0.21,0.25,0.30,0.75, 59%, overcast (decision 26) |

### Named colours

Every hex is written once, in `app/src/palette/palette.ts`, as a named colour. Names describe the source, not the role (`gown-red`, `teak`, `orchid-lilac`, `granite-plate`, `lawn`, `sky-blue`, `gold-lace`, `roof-terracotta`, `crest-red`, `flag-white`). A derived colour is named after its parent plus its OKLCH lightness times 100 (`gown-red-80`, `stone-cladding-93`). The semantic tokens below point at named colours (`--primary: var(--gown-red)`), and `pnpm palette` generates `app/src/palette.css` from the module; `pnpm contrast` refuses to run if that file is stale. Named colours are not registered in `@theme`, so no `bg-teak` utility exists and components still use semantic tokens only. The public `/palette` route lists every named colour with its values, the tokens that use it and its source with the credit line, the licence (linked) and the Commons title (linked); thumbnails live under `app/public/palette-photos/`, cropped to a mark-free part of the photo where the full frame shows the crest, a flag or the Mace (`SOURCES.md` lists them). The sign close-up was removed under decision 26.

### Tokens

Roles: surface (a background something sits on), text, accent (brand colour and chart marks), border, state (success, warning, info, destructive).

| Token | Role | Light | Dark | Citation (light / dark) |
|---|---|---|---|---|
| background | surface | #fcfaf7 | #161512 | derived from S8 / derived from S3 |
| foreground | text | #252320 | #ede8d9 | S3 / S4 |
| card | surface | #ffffff | #252320 | S17 / S3 |
| card-foreground | text | #252320 | #ede8d9 | S3 / S4 |
| popover | surface | #ffffff | #252320 | S17 / S3 |
| popover-foreground | text | #252320 | #ede8d9 | S3 / S4 |
| primary | accent | #8d0f14 | #e8ada6 | S1 / derived from S1 |
| primary-foreground | text | #ffffff | #62090b | S17 / S2 |
| secondary | surface | #ede7df | #35312c | derived from S7 / derived from S7 |
| secondary-foreground | text | #252320 | #ede8d9 | S3 / S4 |
| muted | surface | #f3efea | #2e2b27 | derived from S7 / derived from S7 |
| muted-foreground | text | #595855 | #bab2a7 | S11 / S7 |
| accent | surface (hover) | #f3edd7 | #3e3424 | derived from S5 / derived from S6 |
| accent-foreground | text | #252320 | #ede8d9 | S3 / S4 |
| destructive | state | #c8102e | #ef6666 | S18 / derived from S18 |
| destructive-foreground | text | #ffffff | #161512 | S17 / dark background |
| success | state | #596d2c | #a5b961 | S13 / derived from S14 |
| success-foreground | text | #ffffff | #161512 | S17 / dark background |
| warning | state | #7b5e2f | #d8a459 | derived from S6 / S19 |
| warning-foreground | text | #ffffff | #161512 | S17 / dark background |
| info | state | #0c4a7a | #8bb2d9 | derived from S22 / derived from S22 |
| info-foreground | text | #ffffff | #161512 | S17 / dark background |
| reading | surface (transcript) | #fbf7ea | #221916 | derived from S5 / derived from S16 |
| reading-foreground | text | #252320 | #dcd7c9 | S3 / derived from S4 |
| separator | border (decorative) | #dcd7cf | #3b3732 | derived from S7 / derived from S7 |
| overlay | surface (scrim) | #161512 | #161512 | dark background, derived from S3 |
| primary-hover | accent (hover) | #76080e | #f3bfb9 | derived from S1 / derived from S1 |
| primary-active | accent (active) | #62090b | #fed2cd | S2 / derived from S1 |
| secondary-hover | surface (hover) | #e3ddd5 | #403c37 | derived from S7 / derived from S7 |
| secondary-active | surface (active) | #d6d0c8 | #46423d | derived from S7 / derived from S7 |
| destructive-hover | state (hover) | #b00826 | #ff8481 | derived from S18 / derived from S18 |
| destructive-active | state (active) | #97061f | #ff9b97 | derived from S18 / derived from S18 |
| highlight | accent (search matches, tags) | #e8cbf9 | #513460 | derived from S20 / derived from S20 |
| highlight-foreground | text | #252320 | #ede8d9 | S3 / S4 |
| tag | surface (chip) | #fde2d4 | #492a19 | derived from S21 / derived from S21 |
| tag-foreground | text | #252320 | #ede8d9 | S3 / S4 |
| tag-border | border (chip) | #843d17 | #b7734f | S21 / derived from S21 |
| border | border | #908d82 | #726f64 | S9 / derived from S9 |
| input | border | #897e74 | #897e74 | derived from S23 / derived from S23 |
| ring | border (focus) | #8d0f14 | #e8ada6 | S1 / derived from S1 |
| chart-1 | accent (chart) | #8d0f14 | #d76960 | S1 / derived from S1 |
| chart-2 | accent (chart) | #596d2c | #7a8c34 | S13 / S14 |
| chart-3 | accent (chart) | #0c4a7a | #6194c4 | derived from S22 / derived from S22 |
| chart-4 | accent (chart) | #a68758 | #a68758 | S6 / S6 |
| chart-5 | accent (chart) | #b65229 | #b65229 | S15 / S15 |
| sidebar | surface | #f3efea | #252320 | same as muted / same as card |
| sidebar-foreground | text | #252320 | #ede8d9 | S3 / S4 |
| sidebar-primary | accent | #8d0f14 | #e8ada6 | same as primary |
| sidebar-primary-foreground | text | #ffffff | #62090b | same as primary-foreground |
| sidebar-accent | surface (hover) | #f3edd7 | #3e3424 | same as accent |
| sidebar-accent-foreground | text | #252320 | #ede8d9 | S3 / S4 |
| sidebar-border | border | #897e74 | #726f64 | derived from S23 / same as border |
| sidebar-ring | border (focus) | #8d0f14 | #e8ada6 | same as ring |

Beyond the shadcn set and the three states, the palette adds `reading` and `reading-foreground`, which give long transcripts a warmer, paper-like column that sets the record apart from the app around it; `separator`, a lighter line for card edges, table rules and dividers (gate decision 19); `overlay`, the base colour of the dialog scrim, which is the one place an opacity utility is allowed; and hover and active steps for `primary`, `secondary` and `destructive`, so no component needs an opacity tint for a state. `destructive-foreground` is not in the current shadcn v4 defaults; it is added so the destructive button text is a token, not a hard-coded white.

The light theme puts the gown's black cloth on a warm near-white. Stone greys make the surfaces and lines, the gown's red satin is the one brand colour, and gold lace covers hover and warning. The lawn gives success and the evening sky gives info. The dark theme sets cream lace on the black cloth and keeps the same colour families.

### Derived tokens

Each derived value keeps its parent's OKLCH hue. L is OKLCH lightness (0 to 1), C is chroma.

| Token | Theme | Value | Parent | How | Why |
|---|---|---|---|---|---|
| background | light | #fcfaf7 | S8 #bdb3a6 fence paint | L 0.985, C 0.004 | Page needs near-white; keeps the warm cast of the painted railings |
| secondary | light | #ede7df | S7 #bab2a7 cladding | L 0.93, C 0.012 | Stone surface light enough for body text (12.76:1) |
| muted, sidebar | light | #f3efea | S7 #bab2a7 | L 0.955, C 0.008 | Lighter stone for quiet panels |
| accent, sidebar-accent | light | #f3edd7 | S5 #efe2b7 lace | L 0.945, C 0.03 | Pale gold hover surface |
| reading | light | #fbf7ea | S5 #efe2b7 | L 0.975, C 0.018 | Paper tone for transcripts |
| warning | light | #7b5e2f | S6 #a68758 lace | L 0.50 | S6 gives 3.24:1 on the background, too low for text. S6 stays as chart-4 |
| background | dark | #161512 | S3 #252320 black cloth | L 0.195 | One step below the card so cards lift off the page |
| secondary | dark | #35312c | S7 #bab2a7 | L 0.315, C 0.01 | Stone hue at dark-surface lightness |
| muted | dark | #2e2b27 | S7 #bab2a7 | L 0.29, C 0.008 | As above, one step quieter |
| accent, sidebar-accent | dark | #3e3424 | S6 #a68758 | L 0.33, C 0.03 | Dark gold hover surface |
| reading | dark | #221916 | S16 #75300f teak | L 0.225, C 0.016 | A faint timber cast for the transcript column |
| reading-foreground | dark | #dcd7c9 | S4 #ede8d9 | L 0.88 | Slightly softer than foreground for long reading at night (11.99:1) |
| primary, ring, sidebar-primary, sidebar-ring | dark | #e8ada6 | S1 #8d0f14 gown red | L 0.80, C 0.07 | S1 gives 1.92:1 on the dark background. S1 stays as the light primary |
| destructive | dark | #ef6666 | S18 #c8102e crest red | L 0.68, C 0.17 | S18 gives 3.10:1 on the dark background |
| success | dark | #a5b961 | S14 #7a8c34 sunlit lawn | L 0.75 | S13 gives 3.17:1 on the dark background. S14 stays as dark chart-2 |
| info | light | #0c4a7a | S22 #85a4c2 evening sky | L 0.40, C 0.10 | The sky itself is too light for a state colour; chroma raised from 0.056 so the blue reads as blue at text darkness (sky-blue-40) |
| info | dark | #8bb2d9 | S22 #85a4c2 | L 0.75, C 0.07 | sky-blue-75 |
| border, sidebar-border | dark | #726f64 | S9 #908d82 granite plate | L 0.54 | S9 is 5.49:1 on the dark background, brighter than a control edge needs. Lowered to just clear 3:1 on the card |
| input | light | #897e74 | S23 #655b51 pylon granite | L 0.60, C 0.02 | The shaded pylon is darker than a field edge needs (granite-pylon-60) |
| input | dark | #897e74 | S23 #655b51 | L 0.60, C 0.02 | Same value as light; it clears 3:1 on every dark surface including a selected row (granite-pylon-60) |
| chart-1 | dark | #d76960 | S1 #8d0f14 | L 0.65, C 0.14 | Visible on dark surfaces and distinct from the pale primary |
| chart-3 | dark | #6194c4 | S22 #85a4c2 | L 0.65, C 0.09 | Visible on dark surfaces (sky-blue-65) |
| highlight | light | #e8cbf9 | S20 #d9a6f4 orchid petal | L 0.88, C 0.07 | Pale lilac behind matched text |
| highlight | dark | #513460 | S20 #d9a6f4 | L 0.38, C 0.08 | Dark lilac behind matched text |
| tag | light | #fde2d4 | S21 #843d17 teak (hue 42 to 50 across veneer and teak) | L 0.931, C 0.035 (named teak-93) | Warm chip surface |
| tag | dark | #492a19 | S21 #843d17 | L 0.32, C 0.054 (named teak-32) | Warm chip surface on dark |
| tag-border | dark | #b7734f | S21 #843d17 | L 0.62, C 0.10 (named teak-62) | Sampled teak is 1.63:1 on the dark chip |
| separator | light | #dcd7cf | S7 #bab2a7 cladding | L 0.88, C 0.012 | Decorative line, lighter than `border`; no minimum ratio |
| separator | dark | #3b3732 | S7 #bab2a7 | L 0.34, C 0.01 | As above |
| overlay | both | #161512 | S3 #252320 | L 0.195 | Same as the dark background; used as `bg-overlay/60` behind dialogs |
| primary-hover | light | #76080e | S1 #8d0f14 | L 0.36, C 0.14 | One step darker for hover |
| primary-active | dark | #fed2cd | S1 #8d0f14 | L 0.90, C 0.05 | One step lighter again for pressed |
| primary-hover | dark | #f3bfb9 | S1 #8d0f14 | L 0.85, C 0.06 | One step lighter for hover on dark |
| secondary-hover, secondary-active | light | #e3ddd5, #d6d0c8 | S7 #bab2a7 | L 0.90, L 0.86 | Stone surface two steps down |
| secondary-hover, secondary-active | dark | #403c37, #46423d | S7 #bab2a7 | L 0.36, L 0.38 | Stone surface two steps up; active held at L 0.38 so `muted-foreground` stays above 4.5:1 on it (decision 23) |
| destructive-hover, destructive-active | light | #b00826, #97061f | S18 #c8102e | L 0.48 C 0.19, L 0.43 C 0.17 | Darker steps keep white text above 7:1 |
| destructive-hover, destructive-active | dark | #ff8481, #ff9b97 | S18 #c8102e | L 0.75 C 0.15, L 0.791 C 0.12 (named crest-red-79; the target L 0.80 clipped in gamut) | Lighter steps keep dark text above 7:1 |

Sampled colours that stay in a non-text role because they fail as text: S6 gold lace (3.24:1 on the light background, kept as chart-4), S15 terracotta (kept as chart-5; it passes 4.77:1 but reads orange next to the reds, so it is not used for text).

### Contrast

Minimums: 4.5:1 for text (WCAG 2.2 AA, 1.4.3); 3:1 for the borders of controls (`border`, `input`), focus rings and chart marks (1.4.11). `separator` and `overlay` have no minimum: WCAG 2.2 AA sets no ratio for decorative lines, and the overlay is a scrim. The checker only requires that both exist in both themes. Output of `pnpm contrast` from `app/`, unedited:

```
light
pass  separator #dcd7cf (no minimum)
pass  overlay #161512 (no minimum)
pass  15.04  foreground on background  (#252320 on #fcfaf7, min 4.5)
pass  13.69  foreground on muted  (#252320 on #f3efea, min 4.5)
pass  12.76  foreground on secondary  (#252320 on #ede7df, min 4.5)
pass  15.67  card-foreground on card  (#252320 on #ffffff, min 4.5)
pass  15.67  popover-foreground on popover  (#252320 on #ffffff, min 4.5)
pass   9.50  primary-foreground on primary  (#ffffff on #8d0f14, min 4.5)
pass  11.59  primary-foreground on primary-hover  (#ffffff on #76080e, min 4.5)
pass  13.43  primary-foreground on primary-active  (#ffffff on #62090b, min 4.5)
pass  12.76  secondary-foreground on secondary  (#252320 on #ede7df, min 4.5)
pass  11.62  secondary-foreground on secondary-hover  (#252320 on #e3ddd5, min 4.5)
pass  10.24  secondary-foreground on secondary-active  (#252320 on #d6d0c8, min 4.5)
pass  13.36  accent-foreground on accent  (#252320 on #f3edd7, min 4.5)
pass   5.88  destructive-foreground on destructive  (#ffffff on #c8102e, min 4.5)
pass   7.22  destructive-foreground on destructive-hover  (#ffffff on #b00826, min 4.5)
pass   8.89  destructive-foreground on destructive-active  (#ffffff on #97061f, min 4.5)
pass   5.76  success-foreground on success  (#ffffff on #596d2c, min 4.5)
pass   6.03  warning-foreground on warning  (#ffffff on #7b5e2f, min 4.5)
pass   9.23  info-foreground on info  (#ffffff on #0c4a7a, min 4.5)
pass  14.62  reading-foreground on reading  (#252320 on #fbf7ea, min 4.5)
pass  10.70  highlight-foreground on highlight  (#252320 on #e8cbf9, min 4.5)
pass  12.69  tag-foreground on tag  (#252320 on #fde2d4, min 4.5)
pass  13.69  sidebar-foreground on sidebar  (#252320 on #f3efea, min 4.5)
pass   9.50  sidebar-primary-foreground on sidebar-primary  (#ffffff on #8d0f14, min 4.5)
pass  13.36  sidebar-accent-foreground on sidebar-accent  (#252320 on #f3edd7, min 4.5)
pass   6.83  muted-foreground on background  (#595855 on #fcfaf7, min 4.5)
pass   7.11  muted-foreground on card  (#595855 on #ffffff, min 4.5)
pass   6.21  muted-foreground on muted  (#595855 on #f3efea, min 4.5)
pass   5.79  muted-foreground on secondary  (#595855 on #ede7df, min 4.5)
pass   5.27  muted-foreground on secondary-hover  (#595855 on #e3ddd5, min 4.5)
pass   4.65  muted-foreground on secondary-active  (#595855 on #d6d0c8, min 4.5)
pass   6.07  muted-foreground on accent  (#595855 on #f3edd7, min 4.5)
pass   6.64  muted-foreground on reading  (#595855 on #fbf7ea, min 4.5)
pass   4.86  muted-foreground on highlight  (#595855 on #e8cbf9, min 4.5)
pass   9.12  primary on background  (#8d0f14 on #fcfaf7, min 4.5)
pass   9.50  primary on card  (#8d0f14 on #ffffff, min 4.5)
pass   8.86  primary on reading  (#8d0f14 on #fbf7ea, min 4.5)
pass   6.49  primary on highlight  (#8d0f14 on #e8cbf9, min 4.5)
pass  11.13  primary-hover on background  (#76080e on #fcfaf7, min 4.5)
pass  11.59  primary-hover on card  (#76080e on #ffffff, min 4.5)
pass  10.82  primary-hover on reading  (#76080e on #fbf7ea, min 4.5)
pass   5.65  destructive on background  (#c8102e on #fcfaf7, min 4.5)
pass   5.88  destructive on card  (#c8102e on #ffffff, min 4.5)
pass   5.52  success on background  (#596d2c on #fcfaf7, min 4.5)
pass   5.76  success on card  (#596d2c on #ffffff, min 4.5)
pass   5.78  warning on background  (#7b5e2f on #fcfaf7, min 4.5)
pass   6.03  warning on card  (#7b5e2f on #ffffff, min 4.5)
pass   8.86  info on background  (#0c4a7a on #fcfaf7, min 4.5)
pass   9.23  info on card  (#0c4a7a on #ffffff, min 4.5)
pass   3.19  border on background  (#908d82 on #fcfaf7, min 3)
pass   3.32  border on card  (#908d82 on #ffffff, min 3)
pass   6.39  tag-border on tag  (#843d17 on #fde2d4, min 3)
pass   7.57  tag-border on background  (#843d17 on #fcfaf7, min 3)
pass   7.89  tag-border on card  (#843d17 on #ffffff, min 3)
pass   3.80  input on background  (#897e74 on #fcfaf7, min 3)
pass   3.96  input on card  (#897e74 on #ffffff, min 3)
pass   3.46  input on muted  (#897e74 on #f3efea, min 3)
pass   3.23  input on secondary  (#897e74 on #ede7df, min 3)
pass   9.12  ring on background  (#8d0f14 on #fcfaf7, min 3)
pass   9.50  ring on card  (#8d0f14 on #ffffff, min 3)
pass   3.46  sidebar-border on sidebar  (#897e74 on #f3efea, min 3)
pass   8.30  sidebar-ring on sidebar  (#8d0f14 on #f3efea, min 3)
pass   9.12  chart-1 on background  (#8d0f14 on #fcfaf7, min 3)
pass   9.50  chart-1 on card  (#8d0f14 on #ffffff, min 3)
pass   5.52  chart-2 on background  (#596d2c on #fcfaf7, min 3)
pass   5.76  chart-2 on card  (#596d2c on #ffffff, min 3)
pass   8.86  chart-3 on background  (#0c4a7a on #fcfaf7, min 3)
pass   9.23  chart-3 on card  (#0c4a7a on #ffffff, min 3)
pass   3.24  chart-4 on background  (#a68758 on #fcfaf7, min 3)
pass   3.37  chart-4 on card  (#a68758 on #ffffff, min 3)
pass   4.77  chart-5 on background  (#b65229 on #fcfaf7, min 3)
pass   4.97  chart-5 on card  (#b65229 on #ffffff, min 3)
dark
pass  separator #3b3732 (no minimum)
pass  overlay #161512 (no minimum)
pass  14.91  foreground on background  (#ede8d9 on #161512, min 4.5)
pass  11.50  foreground on muted  (#ede8d9 on #2e2b27, min 4.5)
pass  10.54  foreground on secondary  (#ede8d9 on #35312c, min 4.5)
pass  12.80  card-foreground on card  (#ede8d9 on #252320, min 4.5)
pass  12.80  popover-foreground on popover  (#ede8d9 on #252320, min 4.5)
pass   7.01  primary-foreground on primary  (#62090b on #e8ada6, min 4.5)
pass   8.29  primary-foreground on primary-hover  (#62090b on #f3bfb9, min 4.5)
pass   9.80  primary-foreground on primary-active  (#62090b on #fed2cd, min 4.5)
pass  10.54  secondary-foreground on secondary  (#ede8d9 on #35312c, min 4.5)
pass   8.93  secondary-foreground on secondary-hover  (#ede8d9 on #403c37, min 4.5)
pass   8.14  secondary-foreground on secondary-active  (#ede8d9 on #46423d, min 4.5)
pass   9.96  accent-foreground on accent  (#ede8d9 on #3e3424, min 4.5)
pass   5.88  destructive-foreground on destructive  (#161512 on #ef6666, min 4.5)
pass   7.71  destructive-foreground on destructive-hover  (#161512 on #ff8481, min 4.5)
pass   9.03  destructive-foreground on destructive-active  (#161512 on #ff9b97, min 4.5)
pass   8.44  success-foreground on success  (#161512 on #a5b961, min 4.5)
pass   8.15  warning-foreground on warning  (#161512 on #d8a459, min 4.5)
pass   8.23  info-foreground on info  (#161512 on #8bb2d9, min 4.5)
pass  11.99  reading-foreground on reading  (#dcd7c9 on #221916, min 4.5)
pass   8.53  highlight-foreground on highlight  (#ede8d9 on #513460, min 4.5)
pass  10.53  tag-foreground on tag  (#ede8d9 on #492a19, min 4.5)
pass  12.80  sidebar-foreground on sidebar  (#ede8d9 on #252320, min 4.5)
pass   7.01  sidebar-primary-foreground on sidebar-primary  (#62090b on #e8ada6, min 4.5)
pass   9.96  sidebar-accent-foreground on sidebar-accent  (#ede8d9 on #3e3424, min 4.5)
pass   8.71  muted-foreground on background  (#bab2a7 on #161512, min 4.5)
pass   7.47  muted-foreground on card  (#bab2a7 on #252320, min 4.5)
pass   6.72  muted-foreground on muted  (#bab2a7 on #2e2b27, min 4.5)
pass   6.15  muted-foreground on secondary  (#bab2a7 on #35312c, min 4.5)
pass   5.22  muted-foreground on secondary-hover  (#bab2a7 on #403c37, min 4.5)
pass   4.75  muted-foreground on secondary-active  (#bab2a7 on #46423d, min 4.5)
pass   5.82  muted-foreground on accent  (#bab2a7 on #3e3424, min 4.5)
pass   8.22  muted-foreground on reading  (#bab2a7 on #221916, min 4.5)
pass   4.98  muted-foreground on highlight  (#bab2a7 on #513460, min 4.5)
pass   9.53  primary on background  (#e8ada6 on #161512, min 4.5)
pass   8.18  primary on card  (#e8ada6 on #252320, min 4.5)
pass   8.99  primary on reading  (#e8ada6 on #221916, min 4.5)
pass   5.45  primary on highlight  (#e8ada6 on #513460, min 4.5)
pass  11.27  primary-hover on background  (#f3bfb9 on #161512, min 4.5)
pass   9.67  primary-hover on card  (#f3bfb9 on #252320, min 4.5)
pass  10.64  primary-hover on reading  (#f3bfb9 on #221916, min 4.5)
pass   5.88  destructive on background  (#ef6666 on #161512, min 4.5)
pass   5.05  destructive on card  (#ef6666 on #252320, min 4.5)
pass   8.44  success on background  (#a5b961 on #161512, min 4.5)
pass   7.25  success on card  (#a5b961 on #252320, min 4.5)
pass   8.15  warning on background  (#d8a459 on #161512, min 4.5)
pass   7.00  warning on card  (#d8a459 on #252320, min 4.5)
pass   8.23  info on background  (#8bb2d9 on #161512, min 4.5)
pass   7.07  info on card  (#8bb2d9 on #252320, min 4.5)
pass   3.63  border on background  (#726f64 on #161512, min 3)
pass   3.11  border on card  (#726f64 on #252320, min 3)
pass   3.43  tag-border on tag  (#b7734f on #492a19, min 3)
pass   4.85  tag-border on background  (#b7734f on #161512, min 3)
pass   4.16  tag-border on card  (#b7734f on #252320, min 3)
pass   4.61  input on background  (#897e74 on #161512, min 3)
pass   3.96  input on card  (#897e74 on #252320, min 3)
pass   3.55  input on muted  (#897e74 on #2e2b27, min 3)
pass   3.26  input on secondary  (#897e74 on #35312c, min 3)
pass   9.53  ring on background  (#e8ada6 on #161512, min 3)
pass   8.18  ring on card  (#e8ada6 on #252320, min 3)
pass   3.11  sidebar-border on sidebar  (#726f64 on #252320, min 3)
pass   8.18  sidebar-ring on sidebar  (#e8ada6 on #252320, min 3)
pass   5.29  chart-1 on background  (#d76960 on #161512, min 3)
pass   4.54  chart-1 on card  (#d76960 on #252320, min 3)
pass   4.89  chart-2 on background  (#7a8c34 on #161512, min 3)
pass   4.20  chart-2 on card  (#7a8c34 on #252320, min 3)
pass   5.69  chart-3 on background  (#6194c4 on #161512, min 3)
pass   4.88  chart-3 on card  (#6194c4 on #252320, min 3)
pass   5.42  chart-4 on background  (#a68758 on #161512, min 3)
pass   4.65  chart-4 on card  (#a68758 on #252320, min 3)
pass   3.68  chart-5 on background  (#b65229 on #161512, min 3)
pass   3.16  chart-5 on card  (#b65229 on #252320, min 3)
```

### parliament.gov.sg baseline

The parliament.gov.sg stylesheet was the starting palette. What happened to each part:

- Purple primary (#6037b3): dropped. It appears nowhere in the building, the robes or the insignia; it is a website brand colour. The gown red takes the primary role.
- Navy footer and nav (#1b3342): dropped. The footer will use a stone surface. The only navy in the sources is the Parliament logo, and the evening-sky blue already covers blue.
- Maroon hover accent (#7d1211): kept in spirit. The sampled gown red (#8d0f14) sits next to it, so the site's red accent survives with a source behind it.
- Link blue (#0070f2) and bottom nav blue (#3e69be): dropped. Links use the primary red.
- Status set (#d0021b danger, #008649 success, #f5a623 warning, #008196 info): replaced by source colours. The crest red is close to the old danger red; success, warning and info now come from the lawn, the gown's gold lace and the evening sky.
- Near-black text on white (#323232 on #fff): kept as an approach, with the gown's black cloth and the painted railing white as the values.
- Lato: dropped. Decision 14 sets Inter for the interface.

### Gate decisions (2026-10-13)

Second gate, after the v2 review: proposals 2 and 3 adopted, 1, 4 and 5 deferred; the two Track B photos with people stay; dark `secondary-active` raised to #46423d so `muted-foreground` reaches 4.75:1; `info` and `chart-3` accepted as blues in status and chart roles only; SGDS v3 non-colour tokens adopted (see `docs/sgds-tokens.md`). Brief decisions 21 to 25.

1. Primary and destructive both stay red as drafted. They are told apart by lightness; a read-only archive rarely shows the two side by side.
2. `border` and `input` keep 3:1 because they mark controls. Decorative lines (card edges, table rules, dividers) use the lighter `separator` token, which has no minimum. The earlier draft said the brief asked for 3:1 on every border; it asks for WCAG 2.2 AA, which sets that ratio only for control boundaries.
3. The former-chamber wood and seat samples are accepted with the caveat above. Royce may add his own photos later. Only images with a known licence are used.
4. The unused former-chamber leather maroon (#863427) is dropped from consideration.
5. Opacity tints from the shadcn template (`outline-ring/50`, `bg-primary/90` hovers and the like) are removed in component work. The hover and active tokens above replace them; the dialog scrim uses `bg-overlay/60`, the one case the colour rule allows.

### Proposed v2 changes

Status (decision 21, 2026-10-13): proposals 2 (`highlight`) and 3 (`tag`, `tag-border`) are adopted and now appear in the token table above and in `app/src/palette/palette.ts`. Proposals 1 (reading tint), 4 (heading band) and 5 (chart-6) are deferred until a screen needs them; their details stay below for that day. Nothing else above this heading changed. The research behind each proposal, with crop boxes and lighting, is in `docs/palette/research.md`. `docs/palette-v2-preview.html` shows each proposal beside its v1 value in both themes.

Rules used:

- Each proposed value passes the same minimum as its v1 counterpart: 4.5:1 for text and 3:1 for control borders, focus rings and chart marks (see "Contrast" above).
- Ratios were computed with the WCAG 2.x relative-luminance formula that `pnpm contrast` uses. The adopted proposals are now in `pnpm contrast`; the deferred ones are not, so rerun the checker after the app takes any of them.
- Where a sampled colour failed or was only a lighting peak, a passing value was derived in OKLCH from the sampled hue, as in v1.
- The primary, `#8d0f14`, is Royce's decision and is not re-opened. No proposal here touches a primary role or sits near a party colour (research.md has the party table).
- Four of the five proposals add a token. For a new token the "before" column names the closest v1 token as a stand-in, because v1 has no value for it.

There are five proposals. The candidates that did not earn a place are listed after them.

#### 1. `reading` from Gazette paper

Changes: a better-sourced replacement for a derived token. Light theme only; the dark `reading` stays as v1.

| | Light before (v1) | Light after (proposed) | Dark |
|---|---|---|---|
| `reading` | `#fbf7ea` | `#fff4e8` | unchanged, `#221916` |

Source: the paper margins of the three Gazette scans. `print-gazette-1871-issue1-text.jpg` `#d7bea2` (box 0.93,0.5,1.0,0.9), `print-gazette-1871-p16.jpg` `#dac0a5` (0,0.3,0.06,0.7), `print-gazette-1889-p14.jpg` `#e9caab` (0,0.2,0.1,0.8). OKLCH hue 67 to 70 on all three. v1 `reading` came from gold lace S5 at hue 92.7.

Derivation: hue 70 from the paper, L 0.972 (v1's L was 0.976), C 0.02 (v1's was 0.018). The scans have L 0.82 to 0.86 and C 0.047 to 0.054, but that is the scanner cast and the microfilm, so only the hue is carried over.

How much to trust it: low to moderate. Three pages from two volumes agree on hue, which shows a consistent cast, not the true paper colour. At this lightness the change from v1 is small (OKLab distance 0.008, under the usual visible threshold of about 0.02). If a visible change is wanted, raise C, not L. A halfway option, hue 78, differs from v1 by 0.005 and is not worth the churn. Treat this as optional.

Party note: a peach-cream neutral, not near any party colour.

| Pair | v1 | v2 | Minimum | Result |
|---|---|---|---|---|
| `reading-foreground` `#252320` on `reading` (light) | 14.62 | 14.45 | 4.5 | pass |
| `muted-foreground` `#595855` on `reading` (light) | 6.64 | 6.56 | 4.5 | pass |
| `primary` `#8d0f14` on `reading` (light) | 8.86 | 8.76 | 4.5 | pass |
| `primary-hover` `#76080e` on `reading` (light) | 10.82 | 10.69 | 4.5 | pass |
| `reading` on `background` `#fcfaf7` (light, for information) | 1.03 | 1.04 | none | n/a |
| Dark pairs | unchanged | unchanged | 4.5 | pass (11.99, 8.22, 8.99, 10.64) |

#### 2. `highlight` for search matches

Changes: a new accent, with a matching text token. Orchid lilac for search matches in the transcript and the result list.

| | Light before (v1 stand-in: `accent`) | Light after | Dark before (v1 stand-in: `accent`) | Dark after |
|---|---|---|---|---|
| `highlight` | `#f3edd7` | `#e8cbf9` | `#3e3424` | `#513460` |
| `highlight-foreground` | `#252320` | `#252320` (as `foreground`) | `#ede8d9` | `#ede8d9` (as `foreground`) |

Source: `pc-vanda-miss-joaquim.jpg`, petal lilac `#d9a6f4` (box 0.70,0.33,0.80,0.45, 36.2%, daylight in a shaded garden), OKLCH L 0.80, C 0.120, h 313.5.

Derivation: hue 313.5. Light L 0.88, C 0.07. Dark L 0.38, C 0.08. The sampled petal is too saturated and too light-medium to sit behind small text, so it is pushed pale for light and dark for dark.

The orchid's magenta lip (`#bb3eca`) is not used: C 0.225 is loud and it is in the same family as the dropped website purple.

Party note: the lilac is clear of the PAP, WP, PSP and SDP colours. Purple sits between red and blue, so do not combine `highlight` with a red element and a blue element in one component (that would read as the SDP pair). Highlights are shading behind text, so they also need a non-colour cue (the match is the text itself, in the same font) where colour alone must not carry meaning. No minimum applies to the highlight against the page, because the text contrast governs.

| Pair | Theme | v1 stand-in (`accent`) | v2 | Minimum | Result |
|---|---|---|---|---|---|
| `foreground` on `highlight` | light | 13.36 | 10.70 | 4.5 | pass |
| `muted-foreground` `#595855` on `highlight` | light | 6.07 | 4.86 | 4.5 | pass |
| `primary` `#8d0f14` on `highlight` | light | 8.10 | 6.49 | 4.5 | pass |
| `primary-hover` `#76080e` on `highlight` | light | not checked | 7.92 | 4.5 | pass |
| `foreground` `#ede8d9` on `highlight` | dark | 9.96 | 8.53 | 4.5 | pass |
| `reading-foreground` `#dcd7c9` on `highlight` | dark | not checked | 7.27 | 4.5 | pass |
| `muted-foreground` `#bab2a7` on `highlight` | dark | 5.82 | 4.98 | 4.5 | pass |
| `primary` `#e8ada6` on `highlight` | dark | 6.37 | 5.45 | 4.5 | pass |
| `primary-hover` `#f3bfb9` on `highlight` | dark | not checked | 6.45 | 4.5 | pass |

#### 3. `tag` (warm wood chip)

Changes: a new accent surface for tags and report-type chips, with a text token and a border token. A veneer-coloured chip with a thin border.

| | Light before (v1 stand-in: `secondary`) | Light after | Dark before (v1 stand-in: `secondary`) | Dark after |
|---|---|---|---|---|
| `tag` | `#ede7df` | `#fde2d4` | `#35312c` | `#492a19` |
| `tag-foreground` | `#252320` | `#252320` (as `foreground`) | `#ede8d9` | `#ede8d9` (as `foreground`) |
| `tag-border` | `#908d82` (`border`) | `#843d17` | `#726f64` (`border`) | `#b7734f` |

Source: the veneer on the ParlConnect sign and pillar and the former-chamber teak. `pc-parlconnect-sign.jpg` lit veneer `#be6123` (box 0.20,0.45,0.23,0.58, 33.4%, spotlit; a lighting peak), `pc-parlconnect-main-hall.jpg` pillar `#5b2e19` (0.58,0.30,0.61,0.55, 23.8%, shade), `civic-chamber-benches.jpg` teak `#843d17` (0.25,0.50,0.75,0.55, 44.9%, interior light), which agrees with S16 `#75300f`. Hue 42 to 50 across the four.

Derivation: hue 48. Light `tag` L 0.93, C 0.035. Dark `tag` L 0.32, C 0.055. Light `tag-border` is the sampled teak as it is. Dark `tag-border` is derived (L 0.62, C 0.10), because the teak fails as a border on the dark chip.

Party note: orange-brown at hue 48 and low chroma; none of the four parties uses it. It is about 20 degrees from the gown red's hue but a light peach tint or a brown line does not read as red. The leather red (`#7a2320`) was not used for this reason.

| Pair | Theme | v2 | Minimum | Result |
|---|---|---|---|---|
| `foreground` on `tag` | light | 12.69 | 4.5 | pass |
| `muted-foreground` on `tag` | light | 5.76 | 4.5 | pass |
| `tag-border` on `tag` | light | 6.39 | 3 | pass |
| `tag-border` on `background` | light | 7.57 | 3 | pass |
| `tag-border` on `card` | light | 7.89 | 3 | pass |
| `foreground` on `tag` | dark | 10.53 | 4.5 | pass |
| `muted-foreground` on `tag` | dark | 6.15 | 4.5 | pass |
| `tag-border` on `tag` | dark | 3.43 | 3 | pass |
| `tag-border` on `background` | dark | 4.85 | 3 | pass |
| `tag-border` on `card` | dark | 4.16 | 3 | pass |

For comparison, the stand-in `secondary` gives `foreground` 12.76 (light) and 10.54 (dark). The chip is told apart from `secondary` mainly by hue (OKLab distance 0.025 in light), so it is a subtle change. The sampled dark teak (`#843d17` on `#492a19`) is 1.63:1, which is why the dark border is derived.

#### 4. `heading-band` for report headers

Changes: a reading-view idea with a new token. A dark band with light text above each report, as on the ParlConnect panels. In light it is the gown black; in dark it is a lifted charcoal.

| | Light before (v1 stand-in: `muted`) | Light after | Dark before (v1 stand-in: `muted`) | Dark after |
|---|---|---|---|---|
| `heading-band` | `#f3efea` | `#252320` (S3) | `#2e2b27` | `#47423a` |
| `heading-band-foreground` | `#595855` (`muted-foreground`) | `#fcfaf7` (as `background`) | `#bab2a7` | `#ede8d9` (as `foreground`) |
| `heading-band-muted` | none | `#bab2a7` (S7) | none | `#bab2a7` (S7) |

Source: `pc-parlconnect-functions-panels.jpg`, panel header charcoal `#181715` (box 0.115,0.10,0.26,0.22, 41.6%) and its lit gradient `#47423a` (25.4%), track light. Light uses S3 (`#252320`, the gown's black cloth), which is already in the palette.

Derivation: none for light. For dark, the sampled lit tone `#47423a` is used as is: the raw charcoal `#181715` is within one step of the dark background, so it would not lift off the page.

The dark value is within one step of `secondary-active` dark (`#4b4742`, OKLab distance 0.019). The dark half could reuse that token and drop the new value. What the proposal adds is the role, and the light half, which inverts the page (dark band, light text) the way the panels do.

Party note: neutral charcoal. Not near any party colour.

| Pair | Theme | v2 | Minimum | Result |
|---|---|---|---|---|
| `heading-band-foreground` on `heading-band` | light | 15.04 | 4.5 | pass |
| `heading-band-muted` on `heading-band` | light | 7.47 | 4.5 | pass |
| `heading-band-foreground` on `heading-band` | dark | 8.13 | 4.5 | pass |
| `heading-band-muted` on `heading-band` | dark | 4.75 | 4.5 | pass |
| `primary` `#8d0f14` on `heading-band` | light | 1.65 | 4.5 | fail, so do not put primary text or links on the band; use `heading-band-foreground` with an underline |
| `primary` `#e8ada6` on `heading-band` | dark | 5.20 | 4.5 | pass |
| `heading-band` against `background` (for information) | light, dark | 15.04, 1.83 | none | n/a (decorative surface) |
| `heading-band` against `card` (for information) | light, dark | 15.67, 1.57 | none | n/a |

#### 5. `chart-6` from the Gazette binding

Changes: a new accent (chart) colour, for a sixth series only. v1 has five chart colours; this is needed only if a chart ever needs six.

| | Light before | Light after | Dark before | Dark after |
|---|---|---|---|---|
| `chart-6` | none | `#364c40` | none | `#71a68a` |

Source: `print-gazette-1889-cover.jpg`, the green cloth `#364c40` (box 0.25,0.3,0.75,0.7, 53.4%, flat photo), OKLCH L 0.394, C 0.034, h 160.5. It is the only cool green in the sources; the lawns are olive (h 120 to 127).

Derivation: light is the sampled value. Dark is derived at the same hue: L 0.68, C 0.07, because the sampled cloth is too dark for marks on a dark surface.

Colour-vision caution: the dark value is 0.106 (OKLab distance) from dark `chart-2`, 0.103 from `chart-4` and 0.124 from `chart-3`. That is further apart than v1's closest pair (dark `chart-2` and `chart-4`, 0.086), but it is still a muted green next to an olive, so series should also be told apart by shape, label or position, not colour alone.

Party note: green; none of the four parties uses it.

| Pair | Theme | v1 | v2 | Minimum | Result |
|---|---|---|---|---|---|
| `chart-6` on `background` | light | n/a | 8.90 | 3 | pass |
| `chart-6` on `card` | light | n/a | 9.27 | 3 | pass |
| `chart-6` on `background` | dark | n/a | 6.54 | 3 | pass |
| `chart-6` on `card` | dark | n/a | 5.61 | 3 | pass |

#### Considered and not proposed

- A `reading` ink (text) colour. The darkest 0.2% of pixels on the 1871 text page is `#2c1a06` (L 0.24, C 0.043, h 66), at about the lightness of `#252320` but with the paper's cast, so it is the paper darkened, not an independent ink. The sampled body-text cluster (`#8a7864`) is an anti-aliased edge. The evidence is too weak to replace `reading-foreground`.
- Padang or lawn as `success` or `chart-2`. The Padang turf (`#81a24e`, h 127.1) is the same hue family as the lawn (h 120 to 124). A light value at the same L as v1 `chart-2` (`#526e20`) differs by an OKLab distance of 0.017, which is not visible. In dark, the sampled turf passes 6.27:1 on the background and 5.38:1 on the card (v1: 4.89 and 4.20) but moves closer to dark `success` (0.084, against 0.144) and no further from `chart-4` (0.094, against 0.086). It is no better sourced than v1's S14, which is also a direct sample.
- The Gazette binding green as `success`. It is 8.90:1 on the light background, but its hue reads teal-green, and `success` is tied to the lawn. It is proposed only as `chart-6`.
- Floodlit roof for dark `chart-5`. A derived terracotta at L 0.68 (`#ce8456`) reaches 6.14:1 on the dark background and 5.27:1 on the card (v1: 3.68 and 3.16), but it lands closer to dark `chart-1` (OKLab distance 0.07, against 0.098) and `chart-4` (0.066, against 0.124). v1 already passes 3:1; the margin is not worth losing the separation.
- Elephant slate-black or granite as a dark surface. The elephant (`#28292d`, h 275) is a cool neutral and the granite samples are cool or warm depending on the sky. v1's `#161512` is warm and already has a source. A cool surface would split the dark theme from the warm stone and cream tokens.
- Orchid magenta (`#bb3eca`) for any role. Too loud (C 0.225) and in the family of the dropped website purple.
- Red leather (`#7a2320`, `#7a432d`). At the gown red's hue and near the PSP and SDP reds. No role needs it.
