# Palette

The colour tokens for the app, where each one came from, and the contrast each one reaches. The values live in `app/src/index.css`. `docs/palette-preview.html` shows every token in both themes. Running `pnpm contrast` from `app/` checks every pair listed below and exits 1 on any failure.

## Method

1. Workers fetched openly licensed photos of Parliament House, the Speaker's ceremonial gown and the former chamber from Wikimedia Commons. The committed copies and their licences are in `docs/palette/sources/` and `docs/palette/sources/SOURCES.md`.
2. Each worker ran PIL k-means on a crop around one object (gown satin, stone cladding, lawn and so on) and recorded the cluster hex, its share of the crop and the lighting.
3. Insignia colours come from published specifications, not photos: the flag's white, and the State Crest's red and gold as filled in its SVG. The palette takes the colours and reproduces no artwork.
4. During synthesis, every photo a token is sampled from was viewed, k-means was re-run on the crops relied on most, and two extra samples were taken: the blue sign lettering and the gold lace on the gown's cuff.
5. Where a sampled colour is too dark or too light for text on a given theme, it stays where it passes (accent, border, chart) and a derived token covers text. Derived tokens keep the parent's OKLCH hue and change its lightness, and sometimes its chroma. Each one is listed under "Derived tokens".

Caveats:

- Every chamber interior photo on Commons with an open licence shows the former chamber in the Old Parliament House (now The Arts House), not the current chamber. The teak and leather samples come from there.
- The gown photos were taken under museum spotlights. The satin reads darker in shadow (#62090b) than under light (#8d0f14). The lit value is used.
- Photo samples carry the light they were taken in. The cladding reads warm grey in direct sun and cooler under overcast skies.

## Sources

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
| S10 | #868680 | Honed speckled granite of the sign face | `parliament-house-sign-close-up.jpg`, box 0.075,0.25,0.13,0.8, 44% |
| S11 | #595855 | Concrete kerb in shadow, Parliament Place | `parliament-place-road.jpg`, box 0.0,0.55,0.12,0.9, 44% |
| S12 | #175082 | Blue lettering on the Parliament sign (letters only) | `parliament-house-sign-close-up.jpg`, box 0.34,0.69,0.66,0.74, 17% (synthesis sample) |
| S13 | #596d2c | Front lawn, overcast | `parliament-house-2013-02-25.jpg`, box 0.05,0.85,0.45,0.98, 28% |
| S14 | #7a8c34 | Lawn in direct sun | `parliament-house-2023-01.jpg`, box 0.55,0.55,0.95,0.68, 54% |
| S15 | #b65229 | Clay hip roof, sunlit slope | `parliament-house-2010-08-03.jpg`, box 0.306,0.334,0.3625,0.39, 75%, evening light |
| S16 | #75300f | Teak gallery front panelling, former chamber | `former-chamber-strangers-gallery.jpg`, box 0.05,0.6,0.7,0.82, 46%. Recheck gave #77310e |
| S17 | #ffffff | National flag white | Specified as Pantone White (National Heritage Board, citing the Singapore Arms and Flag and National Anthem (Amendment) Rules 2007); sRGB #FFFFFF in the Wikipedia "Flag of Singapore" infobox |
| S18 | #c8102e | State Crest shield red | `Coat_of_arms_of_Singapore.svg` on Wikimedia Commons, `fill: #c8102e` |
| S19 | #d8a459 | State Crest gold | Same SVG, `.st544 { fill: #d8a459 }`, the most used gold (93 elements) |

## Tokens

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
| info | state | #175082 | #89b2dc | S12 / derived from S12 |
| info-foreground | text | #ffffff | #161512 | S17 / dark background |
| reading | surface (transcript) | #fbf7ea | #221916 | derived from S5 / derived from S16 |
| reading-foreground | text | #252320 | #dcd7c9 | S3 / derived from S4 |
| separator | border (decorative) | #dcd7cf | #3b3732 | derived from S7 / derived from S7 |
| overlay | surface (scrim) | #161512 | #161512 | dark background, derived from S3 |
| primary-hover | accent (hover) | #76080e | #f3bfb9 | derived from S1 / derived from S1 |
| primary-active | accent (active) | #62090b | #fed2cd | S2 / derived from S1 |
| secondary-hover | surface (hover) | #e3ddd5 | #403c37 | derived from S7 / derived from S7 |
| secondary-active | surface (active) | #d6d0c8 | #4b4742 | derived from S7 / derived from S7 |
| destructive-hover | state (hover) | #b00826 | #ff8481 | derived from S18 / derived from S18 |
| destructive-active | state (active) | #97061f | #ff9b97 | derived from S18 / derived from S18 |
| border | border | #908d82 | #726f64 | S9 / derived from S9 |
| input | border | #868680 | #7b7b75 | S10 / derived from S10 |
| ring | border (focus) | #8d0f14 | #e8ada6 | S1 / derived from S1 |
| chart-1 | accent (chart) | #8d0f14 | #d76960 | S1 / derived from S1 |
| chart-2 | accent (chart) | #596d2c | #7a8c34 | S13 / S14 |
| chart-3 | accent (chart) | #175082 | #5c94ca | S12 / derived from S12 |
| chart-4 | accent (chart) | #a68758 | #a68758 | S6 / S6 |
| chart-5 | accent (chart) | #b65229 | #b65229 | S15 / S15 |
| sidebar | surface | #f3efea | #252320 | same as muted / same as card |
| sidebar-foreground | text | #252320 | #ede8d9 | S3 / S4 |
| sidebar-primary | accent | #8d0f14 | #e8ada6 | same as primary |
| sidebar-primary-foreground | text | #ffffff | #62090b | same as primary-foreground |
| sidebar-accent | surface (hover) | #f3edd7 | #3e3424 | same as accent |
| sidebar-accent-foreground | text | #252320 | #ede8d9 | S3 / S4 |
| sidebar-border | border | #868680 | #726f64 | S10 / same as border |
| sidebar-ring | border (focus) | #8d0f14 | #e8ada6 | same as ring |

Beyond the shadcn set and the three states, the palette adds `reading` and `reading-foreground`, which give long transcripts a warmer, paper-like column that sets the record apart from the app around it; `separator`, a lighter line for card edges, table rules and dividers (gate decision 19); `overlay`, the base colour of the dialog scrim, which is the one place an opacity utility is allowed; and hover and active steps for `primary`, `secondary` and `destructive`, so no component needs an opacity tint for a state. `destructive-foreground` is not in the current shadcn v4 defaults; it is added so the destructive button text is a token, not a hard-coded white.

The light theme puts the gown's black cloth on a warm near-white. Stone greys make the surfaces and lines, the gown's red satin is the one brand colour, and gold lace covers hover and warning. The lawn gives success and the sign lettering gives info. The dark theme sets cream lace on the black cloth and keeps the same colour families.

## Derived tokens

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
| info | dark | #89b2dc | S12 #175082 sign lettering | L 0.75, C 0.075 | S12 gives 2.18:1 on the dark background. Chroma lowered so the blue sits with the warm surfaces |
| border, sidebar-border | dark | #726f64 | S9 #908d82 granite plate | L 0.54 | S9 is 5.49:1 on the dark background, brighter than a control edge needs. Lowered to just clear 3:1 on the card |
| input | dark | #7b7b75 | S10 #868680 granite | L 0.58 | One step above border so fields read as fields |
| chart-1 | dark | #d76960 | S1 #8d0f14 | L 0.65, C 0.14 | Visible on dark surfaces and distinct from the pale primary |
| chart-3 | dark | #5c94ca | S12 #175082 | L 0.65 | Visible on dark surfaces |
| separator | light | #dcd7cf | S7 #bab2a7 cladding | L 0.88, C 0.012 | Decorative line, lighter than `border`; no minimum ratio |
| separator | dark | #3b3732 | S7 #bab2a7 | L 0.34, C 0.01 | As above |
| overlay | both | #161512 | S3 #252320 | L 0.195 | Same as the dark background; used as `bg-overlay/60` behind dialogs |
| primary-hover | light | #76080e | S1 #8d0f14 | L 0.36, C 0.14 | One step darker for hover |
| primary-active | dark | #fed2cd | S1 #8d0f14 | L 0.90, C 0.05 | One step lighter again for pressed |
| primary-hover | dark | #f3bfb9 | S1 #8d0f14 | L 0.85, C 0.06 | One step lighter for hover on dark |
| secondary-hover, secondary-active | light | #e3ddd5, #d6d0c8 | S7 #bab2a7 | L 0.90, L 0.86 | Stone surface two steps down |
| secondary-hover, secondary-active | dark | #403c37, #4b4742 | S7 #bab2a7 | L 0.36, L 0.40 | Stone surface two steps up |
| destructive-hover, destructive-active | light | #b00826, #97061f | S18 #c8102e | L 0.48 C 0.19, L 0.43 C 0.17 | Darker steps keep white text above 7:1 |
| destructive-hover, destructive-active | dark | #ff8481, #ff9b97 | S18 #c8102e | L 0.75 C 0.15, L 0.80 C 0.13 | Lighter steps keep dark text above 7:1 |

Sampled colours that stay in a non-text role because they fail as text: S6 gold lace (3.24:1 on the light background, kept as chart-4), S10 granite (3.51:1, kept as the input border), S15 terracotta (kept as chart-5; it passes 4.77:1 but reads orange next to the reds, so it is not used for text).

## Contrast

Minimums: 4.5:1 for text (WCAG 2.2 AA, 1.4.3); 3:1 for the borders of controls (`border`, `input`), focus rings and chart marks (1.4.11). `separator` and `overlay` have no minimum: WCAG 2.2 AA sets no ratio for decorative lines, and the overlay is a scrim. The checker only requires that both exist in both themes. Output of `pnpm contrast` from `app/`, unedited:

```
> app@0.0.0 contrast /Users/meinhardt/ghq/github.com/roycehoe/hansard/app
> node scripts/contrast.ts


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
pass   8.38  info-foreground on info  (#ffffff on #175082, min 4.5)
pass  14.62  reading-foreground on reading  (#252320 on #fbf7ea, min 4.5)
pass  13.69  sidebar-foreground on sidebar  (#252320 on #f3efea, min 4.5)
pass   9.50  sidebar-primary-foreground on sidebar-primary  (#ffffff on #8d0f14, min 4.5)
pass  13.36  sidebar-accent-foreground on sidebar-accent  (#252320 on #f3edd7, min 4.5)
pass   6.83  muted-foreground on background  (#595855 on #fcfaf7, min 4.5)
pass   7.11  muted-foreground on card  (#595855 on #ffffff, min 4.5)
pass   6.21  muted-foreground on muted  (#595855 on #f3efea, min 4.5)
pass   6.07  muted-foreground on accent  (#595855 on #f3edd7, min 4.5)
pass   6.64  muted-foreground on reading  (#595855 on #fbf7ea, min 4.5)
pass   9.12  primary on background  (#8d0f14 on #fcfaf7, min 4.5)
pass   9.50  primary on card  (#8d0f14 on #ffffff, min 4.5)
pass   8.86  primary on reading  (#8d0f14 on #fbf7ea, min 4.5)
pass  11.13  primary-hover on background  (#76080e on #fcfaf7, min 4.5)
pass  11.59  primary-hover on card  (#76080e on #ffffff, min 4.5)
pass  10.82  primary-hover on reading  (#76080e on #fbf7ea, min 4.5)
pass   5.65  destructive on background  (#c8102e on #fcfaf7, min 4.5)
pass   5.88  destructive on card  (#c8102e on #ffffff, min 4.5)
pass   5.52  success on background  (#596d2c on #fcfaf7, min 4.5)
pass   5.76  success on card  (#596d2c on #ffffff, min 4.5)
pass   5.78  warning on background  (#7b5e2f on #fcfaf7, min 4.5)
pass   6.03  warning on card  (#7b5e2f on #ffffff, min 4.5)
pass   8.04  info on background  (#175082 on #fcfaf7, min 4.5)
pass   8.38  info on card  (#175082 on #ffffff, min 4.5)
pass   3.19  border on background  (#908d82 on #fcfaf7, min 3)
pass   3.32  border on card  (#908d82 on #ffffff, min 3)
pass   3.51  input on background  (#868680 on #fcfaf7, min 3)
pass   3.66  input on card  (#868680 on #ffffff, min 3)
pass   9.12  ring on background  (#8d0f14 on #fcfaf7, min 3)
pass   9.50  ring on card  (#8d0f14 on #ffffff, min 3)
pass   3.20  sidebar-border on sidebar  (#868680 on #f3efea, min 3)
pass   8.30  sidebar-ring on sidebar  (#8d0f14 on #f3efea, min 3)
pass   9.12  chart-1 on background  (#8d0f14 on #fcfaf7, min 3)
pass   9.50  chart-1 on card  (#8d0f14 on #ffffff, min 3)
pass   5.52  chart-2 on background  (#596d2c on #fcfaf7, min 3)
pass   5.76  chart-2 on card  (#596d2c on #ffffff, min 3)
pass   8.04  chart-3 on background  (#175082 on #fcfaf7, min 3)
pass   8.38  chart-3 on card  (#175082 on #ffffff, min 3)
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
pass   7.52  secondary-foreground on secondary-active  (#ede8d9 on #4b4742, min 4.5)
pass   9.96  accent-foreground on accent  (#ede8d9 on #3e3424, min 4.5)
pass   5.88  destructive-foreground on destructive  (#161512 on #ef6666, min 4.5)
pass   7.71  destructive-foreground on destructive-hover  (#161512 on #ff8481, min 4.5)
pass   9.03  destructive-foreground on destructive-active  (#161512 on #ff9b97, min 4.5)
pass   8.44  success-foreground on success  (#161512 on #a5b961, min 4.5)
pass   8.15  warning-foreground on warning  (#161512 on #d8a459, min 4.5)
pass   8.23  info-foreground on info  (#161512 on #89b2dc, min 4.5)
pass  11.99  reading-foreground on reading  (#dcd7c9 on #221916, min 4.5)
pass  12.80  sidebar-foreground on sidebar  (#ede8d9 on #252320, min 4.5)
pass   7.01  sidebar-primary-foreground on sidebar-primary  (#62090b on #e8ada6, min 4.5)
pass   9.96  sidebar-accent-foreground on sidebar-accent  (#ede8d9 on #3e3424, min 4.5)
pass   8.71  muted-foreground on background  (#bab2a7 on #161512, min 4.5)
pass   7.47  muted-foreground on card  (#bab2a7 on #252320, min 4.5)
pass   6.72  muted-foreground on muted  (#bab2a7 on #2e2b27, min 4.5)
pass   5.82  muted-foreground on accent  (#bab2a7 on #3e3424, min 4.5)
pass   8.22  muted-foreground on reading  (#bab2a7 on #221916, min 4.5)
pass   9.53  primary on background  (#e8ada6 on #161512, min 4.5)
pass   8.18  primary on card  (#e8ada6 on #252320, min 4.5)
pass   8.99  primary on reading  (#e8ada6 on #221916, min 4.5)
pass  11.27  primary-hover on background  (#f3bfb9 on #161512, min 4.5)
pass   9.67  primary-hover on card  (#f3bfb9 on #252320, min 4.5)
pass  10.64  primary-hover on reading  (#f3bfb9 on #221916, min 4.5)
pass   5.88  destructive on background  (#ef6666 on #161512, min 4.5)
pass   5.05  destructive on card  (#ef6666 on #252320, min 4.5)
pass   8.44  success on background  (#a5b961 on #161512, min 4.5)
pass   7.25  success on card  (#a5b961 on #252320, min 4.5)
pass   8.15  warning on background  (#d8a459 on #161512, min 4.5)
pass   7.00  warning on card  (#d8a459 on #252320, min 4.5)
pass   8.23  info on background  (#89b2dc on #161512, min 4.5)
pass   7.06  info on card  (#89b2dc on #252320, min 4.5)
pass   3.63  border on background  (#726f64 on #161512, min 3)
pass   3.11  border on card  (#726f64 on #252320, min 3)
pass   4.29  input on background  (#7b7b75 on #161512, min 3)
pass   3.68  input on card  (#7b7b75 on #252320, min 3)
pass   9.53  ring on background  (#e8ada6 on #161512, min 3)
pass   8.18  ring on card  (#e8ada6 on #252320, min 3)
pass   3.11  sidebar-border on sidebar  (#726f64 on #252320, min 3)
pass   8.18  sidebar-ring on sidebar  (#e8ada6 on #252320, min 3)
pass   5.29  chart-1 on background  (#d76960 on #161512, min 3)
pass   4.54  chart-1 on card  (#d76960 on #252320, min 3)
pass   4.89  chart-2 on background  (#7a8c34 on #161512, min 3)
pass   4.20  chart-2 on card  (#7a8c34 on #252320, min 3)
pass   5.69  chart-3 on background  (#5c94ca on #161512, min 3)
pass   4.88  chart-3 on card  (#5c94ca on #252320, min 3)
pass   5.42  chart-4 on background  (#a68758 on #161512, min 3)
pass   4.65  chart-4 on card  (#a68758 on #252320, min 3)
pass   3.68  chart-5 on background  (#b65229 on #161512, min 3)
pass   3.16  chart-5 on card  (#b65229 on #252320, min 3)
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

## parliament.gov.sg baseline

The parliament.gov.sg stylesheet was the starting palette. What happened to each part:

- Purple primary (#6037b3): dropped. It appears nowhere in the building, the robes or the insignia; it is a website brand colour. The gown red takes the primary role.
- Navy footer and nav (#1b3342): dropped. The footer will use a stone surface. The only navy in the sources is the Parliament logo, and the sign lettering blue already covers blue.
- Maroon hover accent (#7d1211): kept in spirit. The sampled gown red (#8d0f14) sits next to it, so the site's red accent survives with a source behind it.
- Link blue (#0070f2) and bottom nav blue (#3e69be): dropped. Links use the primary red.
- Status set (#d0021b danger, #008649 success, #f5a623 warning, #008196 info): replaced by source colours. The crest red is close to the old danger red; success, warning and info now come from the lawn, the gown's gold lace and the sign lettering.
- Near-black text on white (#323232 on #fff): kept as an approach, with the gown's black cloth and the painted railing white as the values.
- Lato: dropped. Decision 14 sets Inter for the interface.

## Identity marks

The palette takes colours only. The crest red and crest gold are hex values read from the crest's published SVG; the crest itself, the Lion Head symbol, the mace image, the Parliament logo and the "A Singapore Government Agency Website" masthead never appear in the app or in the preview. The header is a plain wordmark set in Source Serif 4. Every page footer reads "Unofficial. Independent of the Parliament of Singapore." See `docs/adr/0002-no-government-identity-marks.md`.

## Gate decisions (2026-10-13)

1. Primary and destructive both stay red as drafted. They are told apart by lightness; a read-only archive rarely shows the two side by side.
2. `border` and `input` keep 3:1 because they mark controls. Decorative lines (card edges, table rules, dividers) use the lighter `separator` token, which has no minimum. The earlier draft said the brief asked for 3:1 on every border; it asks for WCAG 2.2 AA, which sets that ratio only for control boundaries.
3. The former-chamber wood and seat samples are accepted with the caveat above. Royce may add his own photos later. Only images with a known licence are used.
4. The unused former-chamber leather maroon (#863427) is dropped from consideration.
5. Opacity tints from the shadcn template (`outline-ring/50`, `bg-primary/90` hovers and the like) are removed in component work. The hover and active tokens above replace them; the dialog scrim uses `bg-overlay/60`, the one case the colour rule allows.
