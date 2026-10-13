# Track B asset research

Track B looked past the first palette round for more colours, page furniture and texture ideas that fit a Hansard reader. It had three scouts (the chamber and building, printed records, the civic district around the Old Parliament House) and three fetch passes that sampled the photos. This note records what was found. The proposals that came out of it are in `docs/palette.md`, section "Proposed v2 changes". Nothing here changes an approved v1 token.

Three rules applied throughout.

1. Political neutrality. No proposed colour sits near a party colour in a primary role. The party table below lists what to stay clear of, and every candidate says whether it is near one. The v1 primary, the gown red `#8d0f14`, is Royce's decision and is not re-opened here.
2. ADR 0002 (`docs/adr/0002-no-government-identity-marks.md`). Colours and patterns only. No crest, lion head, Merlion, Parliament logo or Mace image was committed or sampled. Whole-building photos that show the facade are accepted, as in v1. Some committed photos show a crest, logo, flag, sign or people incidentally (noted per photo below). None of those were cropped or sampled.
3. Licence and traceability. Every photo cited here has a row in `docs/palette/sources/SOURCES.md` under "Track B research photos (2026-10-13)". Only images with a known open licence (CC BY, CC BY-SA, public domain) were kept. Photos that no finding cites were removed. The repo is private; recheck each licence on its source page before it is ever made public.

Method as in v1: PIL k-means on a crop box (fractions of the image: left, top, right, bottom), recording hex, share of the crop and lighting. The fetch workers' values are listed as reported. Where a value looked wrong or was needed for a proposal, it was re-sampled during writing and the new value is marked "resample". All photos were viewed before being cited.

## Party colours to stay clear of

These are the colours as given in the brief. They were not checked against the parties' own materials.

| Party | Colours | What to avoid |
|---|---|---|
| PAP | White, with a red lightning bolt in a blue circle | White plus red plus blue as a set; a blue disc with a red mark |
| WP | Light blue and white | Light blue as a primary or large fill |
| PSP | Red and white | Red with white as a brand pair |
| SDP | Red and blue | Red beside blue as a brand pair |

Rules that follow:

- No primary-role colour (primary, ring, brand fills, large headers) comes from this research.
- Reds and blues from the sources stay in state and chart roles only (v1 already does this).
- A candidate is "near" a party colour if its hue is within about 30 degrees of that party's red or blue and it is saturated enough to read as that colour. Pale tints and neutrals are not near.
- Observation on v1, not re-opened: `info` (`#175082` light, `#89b2dc` dark) and `chart-3` are blues in the neighbourhood of the PAP, SDP and WP blues. They are state and chart colours, not brand colours. If a reviewer raises this, the choice is Royce's.

Reference hues (OKLCH degrees): gown red 26.5, crest red 22.3, sign blue 249.4, dropped website purple 292.8.

## Findings by source

### `pc-parlconnect-main-hall.jpg`

The ParlConnect exhibition hall in Parliament House: a charcoal graphic wall with a cherry-veneer end, a ceiling cove, ochre walls, brown flecked carpet, track lights, a case holding the Mace and the Speaker's gown on a mannequin. Smuconlaw, CC BY-SA 4.0. Citation: SOURCES row `pc-parlconnect-main-hall.jpg`; https://commons.wikimedia.org/wiki/File:ParlConnect,_Parliament_House,_Singapore_-_20150306-01.jpg

| Hex | What | Crop | Share | Lighting |
|---|---|---|---|---|
| `#4f3821` | Ochre wall, left | 0.00,0.45,0.22,0.62 | 63.3% | Tungsten and spotlights; darker than the bare wall |
| `#5b2e19` | Cherry veneer pillar, mid-shade | 0.58,0.30,0.61,0.55 | 23.8% | Indoor, shaded side |
| `#5a2e1c` | Same pillar (resample) | 0.52,0.30,0.60,0.80 | 29.5% | As above |

Use: the veneer is a warm reddish brown at OKLCH hue 42 to 45. It sets the hue for the `tag` token in the proposals. The ochre wall is too dark under tungsten light to give a reliable surface colour, so nothing is proposed from it. The carpet (brown-olive, flecked) was viewed but not sampled; it is a texture idea only.

Near a party colour: no. The wall crop also caught a magenta screen (`#682f4d`, 9.6% of the box), which was excluded. Those screens sit near the dropped website purple.

Incidental marks: the photo shows the Mace in its case, a figure holding it, a small logo on the kiosk and logo discs on the picture frames. None was cropped or sampled.

### `pc-parlconnect-sign.jpg`

Close view of the exhibition's "Parliament of Singapore" sign: capital letters in a wide humanist sans on a cherry-veneer strip, inside a satin aluminium box frame, set against a charcoal wall printed with a line drawing of the building. Smuconlaw, CC BY-SA 4.0. Citation: SOURCES row `pc-parlconnect-sign.jpg`; https://commons.wikimedia.org/wiki/File:ParlConnect,_Parliament_House,_Singapore_-_20150306-05.jpg

| Hex | What | Crop | Share | Lighting |
|---|---|---|---|---|
| `#be6123` | Veneer strip, lit (resample) | 0.20,0.45,0.23,0.58 | 33.4% | Spotlit, backlit by the frame; OKLCH L 0.59, C 0.139, h 49.9 |
| `#9f501c` | Same strip, mid (resample) | same | 33.5% | Same |
| `#5d4e4c` | Satin aluminium frame, mid | 0.40,0.31,0.75,0.34 | n/a | Fetch value |
| `#b1a2a1` | Satin aluminium frame, highlight | same | n/a | Fetch value |
| `#86806e` | Frame, resample of a nearby box | 0.40,0.37,0.60,0.40 | 18.3% | Reads grey-olive here; the frame colour changes a lot with the box, so it is not used |

That resample box mostly fell on the shadowed part of the veneer (`#311d14`, 44.8%), which shows how much the strip varies under the light. The lit orange is a lighting peak, not a wood colour you would put on a wall.

Use: the veneer hue (about 50) and its satin metal frame suggest a small label chip: warm wood tint, thin satin border. This becomes the `tag` proposal. The lettering style (wide caps) is a sign, not something to imitate.

Near a party colour: no. The maroon band with a green outline at the lower left (part of a "How Parliament is formed" graphic) is near the PSP and SDP reds and was not sampled.

### `pc-parliament-house-night.jpg`

Parliament House from above at night, floodlit: the terracotta pyramid roof and hip roofs lit from below, uplit palms, a brick forecourt, a white gate, towers behind. The crest on the central block and the flags are visible. Erwin Soo, CC BY 3.0. Citation: SOURCES row `pc-parliament-house-night.jpg`; https://commons.wikimedia.org/wiki/File:Parliament_House,_Singapore,_at_night_-_20120926.jpg

| Hex | What | Crop | Share | Lighting |
|---|---|---|---|---|
| `#7a462e` | Pyramid roof, shadow side | 0.44,0.27,0.53,0.30 | 23.4% | Floodlit; fetch also reports lit face `#bb8870` and shadow `#410e03` |
| `#b78665` | Hip roof, lit | 0.05,0.37,0.30,0.39 | 31.7% | Resample; OKLCH L 0.66, C 0.076, h 54.9 |
| `#cca180` | Hip roof, brightest | same | 24.4% | Resample; L 0.74, C 0.068, h 59.0 |
| `#eacdb6` | Pyramid roof, highlight | 0.42,0.22,0.52,0.30 | 17.6% | Resample; near blown out |

Use: this was the candidate for a lighter dark-theme `chart-5`. The floodlit roof is a pale, low-chroma peach (C about 0.07) against the daylight clay of S15 (`#b65229`, C 0.141); the difference is the lighting, not the tile. A derived terracotta at L 0.68 passes easily (6.14:1 on the dark background) but sits closer to dark `chart-1` and `chart-4` than v1 does (OKLab distance 0.07 and 0.066, against 0.098 and 0.124). v1's `#b65229` already passes 3:1 on both dark surfaces, so the change is not proposed.

Near a party colour: no. The crest block and flags were not cropped or sampled.

### `pc-front-facade-2025.jpg`

Front of Parliament House at midday under a blue sky: the pyramid roof, tall window slits on the centre block, a white painted gate and fence, red-brown brick forecourt, royal palms, clipped hedges. The crest and flag show on the facade; a stop sign and a closed umbrella are in the foreground. Chainwit., CC BY 4.0. Citation: SOURCES row `pc-front-facade-2025.jpg`; https://commons.wikimedia.org/wiki/File:Downtown_Core,_Singapore_-_Parliament_House_of_Singapore_(MAR_2025)_-_img_05.jpg

| Hex | What | Crop | Share | Lighting |
|---|---|---|---|---|
| `#949eaa` | Granite wing wall | 0.10,0.57,0.30,0.70 | 39.5% | Midday; sky reflection makes pale stone read blue-grey (OKLCH C 0.021, h 253) |
| `#b8c5d6`, `#929ca9` | White fence bars | 0.05,0.74,0.25,0.79 | 29.8%, 32.7% | Resample; the paint reads blue-grey for the same reason |
| `#7f7274`, `#6b6260` | Brick forecourt | 0.58,0.86,0.76,0.97 | 35.7%, 37.6% | Resample; reads dusty rose-grey, not the red-brown the scout expected. The fetch crop (0.52,0.90,0.66,0.98) gave `#6d6169` and `#7d7078` |

Use: no colour is proposed. v1 already has the warm sunlit cladding (S7, S8). This photo shows how much sky colour the stone and paint pick up at midday, so its blue-greys are not used. It is the best source for patterns: the vertical window slits, the evenly spaced white fence bars and the running-bond brick (see "Visual language ideas").

Near a party colour: the pale blue-grey granite is a neutral but sits in the light-blue neighbourhood of the WP. Another reason not to use it.

### `pc-vanda-miss-joaquim.jpg`

Close-up of a Vanda Miss Joaquim orchid, in daylight in a shaded garden: lilac petals, a magenta lip, an orange-brown throat. A flower photo with no marks. 蕭裕, CC BY-SA 4.0. Citation: SOURCES row `pc-vanda-miss-joaquim.jpg`; https://commons.wikimedia.org/wiki/File:Papilionanthe_Miss_Joaquim_taken_at_Botanic_Gardens.jpg

| Hex | What | Crop | Share | OKLCH |
|---|---|---|---|---|
| `#d9a6f4` | Petal lilac | 0.70,0.33,0.80,0.45 | 36.2% | L 0.80, C 0.120, h 313.5 |
| `#bb3eca` | Lip magenta | 0.50,0.65,0.65,0.85 | 27.9% | L 0.60, C 0.225, h 323.2 |

Use: the lilac gives a pale highlight surface for search matches that is not red, gold or blue. Pale and low in chroma, it works behind dark text. The magenta is too loud and is not used. This becomes the `highlight` proposal.

Near a party colour: the lilac is clear of all four parties. Purple sits between red and blue, so it should never be paired with a red and a blue in one component (that would read as the SDP pair). The magenta shares a family with the dropped website purple (`#6037b3`, h 292.8) and is not used for that reason.

### `pc-parlconnect-functions-panels.jpg`

Six upright exhibition panels with charcoal header blocks carrying white sans titles ("Functions of Parliament", "From Bill to Law", "Who's Who in Parliament"), photo panels below, ochre walls, a light cove, brown carpet. One panel shows the current chamber's red seating in a printed photo. Smuconlaw, CC BY-SA 4.0. Citation: SOURCES row `pc-parlconnect-functions-panels.jpg`; https://commons.wikimedia.org/wiki/File:ParlConnect,_Parliament_House,_Singapore_-_20150306-02.jpg

| Hex | What | Crop | Share | Lighting |
|---|---|---|---|---|
| `#181715` | Panel header, charcoal | 0.115,0.10,0.26,0.22 | 41.6% | Resample; track light gradient. Almost the v1 dark background (`#161512`) |
| `#47423a` | Same header, lit part | same | 25.4% | Resample; L 0.381, C 0.015, h 79.7 |
| `#7a432d` | Printed chamber photo, seating and wood | 0.31,0.35,0.44,0.65 | 29.9% | A print under track light; rough |
| `#7a2320` | Red leather chair on the "Who's Who" panel | 0.70,0.52,0.76,0.62 | 20.0% | Indoor, shadowed; L 0.393, C 0.121, h 26.3 |

Use: the header blocks are a dark band above a lighter body with white sans text. As a reading-view idea this becomes the `heading-band` proposal. The band's lit tone `#47423a` is within one step of v1 `secondary-active` dark (`#4b4742`, OKLab distance 0.019), so the dark half could reuse that token. The chamber seating is second-hand (a photo of a print) and is the only open view of the current chamber's red seating. The leather red is at the gown red's hue, so it is not proposed.

Near a party colour: the leather reds (`#7a2320`, `#7a432d`) are at or near the PSP and SDP red hue and match the gown red. Not used. The charcoal is neutral.

### `print-gazette-1871-issue1-text.jpg`

Page 5 of the 1871 Straits Settlements Government Gazette PDF (printed page 1 of No. 1, 6 January 1871), cropped below the masthead: a notification, a dateline block, an Executive Council meeting with a centred "PRESENT:" list, and a "WHEREAS" order in justified text. Straits Settlements Government, public domain (Commons tag, 1871). Citation: SOURCES row `print-gazette-1871-issue1-text.jpg`; https://commons.wikimedia.org/wiki/File:Straits_Settlements_Government_Gazette_(1871).pdf

| Hex | What | Crop | Share | Note |
|---|---|---|---|---|
| `#d7bea2` | Paper margin | 0.93,0.5,1.0,0.9 | 62.5% | Fetch value; OKLCH L 0.815, C 0.047, h 70.3 |
| `#d5bb9f`, `#d9c0a4` | Paper, bottom strip | 0.0,0.82,1.0,1.0 | 56.3%, 33.5% | Resample |
| `#8a7864` | Darkest text cluster | 0.1,0.1,0.9,0.4 | 3.3% | Anti-aliased edge, not ink |
| `#2c1a06` | Ink estimate | text block | darkest 0.2% of pixels | Resample by percentile: L 0.24, C 0.043, h 66 |

Use: paper tone (see the three-scan agreement below) and typography. The ink estimate is a brown-black at about the lightness of v1's `#252320`, but it carries the paper's warm cast, so it is the same colour as the paper darkened rather than a separate ink. No ink change is proposed.

How much to trust the paper: low to moderate. These are library microfilm scans (the file carries "micro-filmed on 16 Sep 1958" and "fumigated" stamps and a library barcode on other pages), and paper foxes and scanners add a cast. Three pages from two volumes agree on hue (67 to 70 degrees), which says the cast is consistent, not that the paper was that orange. The lightness (0.82 to 0.86) is far below a clean sheet, so only the hue is used.

Near a party colour: no.

### `print-gazette-1871-p16.jpg`

Printed page 16 of the 13 January 1871 Gazette: a running head, a double rule, a single justified text column of numbered paragraphs (sections 81 to 95 of an ordinance), and italic side heads in a left margin column ("Registrar's books.", "Audit.", "Release of trustee."). Same source and licence as above. Citation: SOURCES row `print-gazette-1871-p16.jpg`; same Commons PDF page.

| Hex | What | Crop | Share |
|---|---|---|---|
| `#dac0a5` | Paper, left margin | 0,0.3,0.06,0.7 | 46.2% (resample agrees) |
| `#dbc1a6` | Paper, inner margin | 0.12,0.45,0.14,0.60 | 48.1% (resample) |
| `#3f2d18` | Ink estimate, darkest 1% | text column | L 0.31, C 0.043, h 69 (resample) |

Use: paper tone and the page furniture described under "Typography and page furniture". Near a party colour: no.

### `print-gazette-1889-p14.jpg`

Printed page 14 of the 4 January 1889 Gazette: a running head in capitals with an old-style folio, a double rule, a centred title "MUNICIPAL ESTIMATES", a ruled table with a rotated "Item No." column head, roman numerals, small-caps sub-heads, dot leaders, right-aligned figures with comma thousands, and a "Carried forward" line. Straits Settlements Government, public domain (Commons tag, 1889). Citation: SOURCES row `print-gazette-1889-p14.jpg`; https://commons.wikimedia.org/wiki/File:Straits_Settlements_Government_Gazette_(1889,_Jan-Mar).pdf

| Hex | What | Crop | Share |
|---|---|---|---|
| `#e9caab` | Paper, left margin | 0,0.2,0.1,0.8 | 48.0% (resample 48.6%); L 0.857, C 0.054, h 67.0 |
| `#513921` | Ink estimate, darkest 1% | table | L 0.37, C 0.050, h 65 (resample) |

Use: the lightest and pinkest of the three paper readings, which fits a newer, thinner stock or a different scan. It agrees with the others on hue. Page furniture below. Near a party colour: no.

### `print-gazette-1889-cover.jpg`

The 1889 volume's binding: dark green cloth boards with a brown leather spine strip at the left edge, no label. Same source and licence as the 1889 page. Citation: SOURCES row `print-gazette-1889-cover.jpg`; same Commons PDF.

| Hex | What | Crop | Share | Note |
|---|---|---|---|---|
| `#364c40` | Green binding cloth | 0.25,0.3,0.75,0.7 | 53.4% | Flat photo; resample `#364c40` at 53.1%. OKLCH L 0.394, C 0.034, h 160.5 |

Use: a muted, cool green that no other source has (the lawn greens are olive at h 120 to 127). It is a candidate for a sixth chart colour (`chart-6` proposal). It is too dark for dark-theme marks and needs a lighter derived value there. It is not proposed for `success`: its hue reads teal-green, and `success` is tied to the lawn.

Near a party colour: no. None of the four parties uses green.

### `civic-arts-house-dusk.jpg`

The Arts House at the Old Parliament (the former Parliament House) at dusk, front on: buff render, white paired fluted pilasters, a dentil cornice, two arched ground-floor openings glowing amber, the bronze-painted elephant on a white plinth, terracotta paving, clipped hedges, a lettered frieze with the building's name. Small red banners show at the far right edge. Diego Delso, CC BY-SA 4.0. Citation: SOURCES row `civic-arts-house-dusk.jpg`; https://commons.wikimedia.org/wiki/File:Antiguo_parlamento,_Singapur,_2023-08-18,_DD_24-26_HDR.jpg

| Hex | What | Crop | Share | Lighting |
|---|---|---|---|---|
| `#af816e` | Terracotta paving | 0.40,0.92,0.70,0.99 | 57.0% | Dusk, warm lamp light |
| `#a08d7d` | Buff render (resample) | 0.27,0.30,0.45,0.40 | 53.6% | Dusk; 25% of the crop is sky reflection `#a0acb4` |
| `#d1b6a7` / `#e1e0e4` | Plinth, uplit and in daylight | per the fetch notes | n/a | Warm under uplights, cool white in daylight |

Use: colours are dusk-dependent (the render reads grey-brown, `#8e8176`, not buff) and nothing is proposed. The photo is a pattern source: paired fluted pilasters, a cornice with a dentil row, a regular window grid. Near a party colour: no; the red banners at the edge are outside every crop.

### `civic-arts-house-daylight.jpg`

The Old Parliament House portico and arches from a low corner, daylight: white arch piers and window surrounds, a pale-yellow wall, white quoins, paved forecourt. A tree trunk and a café sign are in frame. Bjoertvedt, CC BY-SA 4.0. Citation: SOURCES row `civic-arts-house-daylight.jpg`; https://commons.wikimedia.org/wiki/File:Singapore_-_The_Arts_House_former_parliament_IMG_9274.jpg

| Hex | What | Crop | Share | Lighting |
|---|---|---|---|---|
| `#aaaba9` | White trim on arch pier | 0.665,0.52,0.735,0.92 | 54.0% | Overcast, cool; reads grey (lit side `#cfcecf`) |
| `#a49d87` | "Pale yellow" wall | per the fetch notes | n/a | Reads grey-olive under overcast |

Use: no colour is proposed; white trim reads grey in the shade and the wall is not yellow. The photo supports one idea: white trim around a warm surface, which the cream card with an off-white edge already does. Near a party colour: no.

### `civic-chamber-benches.jpg`

The former chamber in the Old Parliament House: tiered teak bench fronts, white columns, a coffered ceiling, maroon leather seats, a timber floor, a chandelier. Visitors and one staff member are in the frame, some with faces visible; the sample crops avoid them. Smuconlaw, CC BY-SA 4.0. Citation: SOURCES row `civic-chamber-benches.jpg`; https://commons.wikimedia.org/wiki/File:Former_Parliamentary_Chamber,_The_Arts_House_at_the_Old_Parliament,_Singapore_-_20110407-09.JPG

| Hex | What | Crop | Share | Lighting |
|---|---|---|---|---|
| `#7d3815` | Teak bench fronts | 0.25,0.50,0.75,0.55 | 73.4% | Mixed interior light, warm cast |
| `#843d17`, `#733111` | Same crop (resample) | same | 44.9%, 28.6% | Same |
| `#521f09` | Floor | per the fetch notes | n/a | Same |

Use: the teak (OKLCH L 0.45, C 0.11, h 45.6) lands within one step of v1's S16 (`#75300f`, from a different photo of the same chamber), so two photos now agree on this colour. It gives the proposed `tag-border` its light value, `#843d17`. The leather was measured near-black in shadow (`#1e0705`) and is not used (gate decision 4 in v1). This is still the former chamber, not the current one.

Near a party colour: no. The maroon leather beside white is mildly near the PSP and PAP pair, which is another reason the seats are skipped.

### `civic-victoria-theatre.jpg`

Front of the Victoria Theatre: grey rusticated render in horizontal bands, a white moulded arch with a keystone, a swag frieze, a grey wrought-iron gate with a scroll pattern, a white balustrade above. A small armorial medallion is in the frieze and is excluded from every crop. Jacklee, CC BY-SA 4.0. Citation: SOURCES row `civic-victoria-theatre.jpg`; https://commons.wikimedia.org/wiki/File:Front_of_Victoria_Theatre,_Singapore_-_20141101-02.JPG

| Hex | What | Crop | Share | Lighting |
|---|---|---|---|---|
| `#99989d` | Grey painted render and arch pier | 0.10,0.60,0.20,0.85 | 41.8% | Overcast, flat |
| `#9e9d9a`, `#c5c3c3` | Rusticated wall (resample) | 0.50,0.30,0.90,0.45 | 46.2%, 30.6% | Same |

Use: neutral grey, close to the stone family v1 already has (S7 to S10), so no colour is proposed. Pattern source: horizontal banding and the scroll gate. Near a party colour: no.

### `civic-anderson-girder.jpg`

Close view of the Anderson Bridge's painted steel side plates with rows of rivets, a handrail and a paved deck, overcast. Orderinchaos, CC BY-SA 4.0. Citation: SOURCES row `civic-anderson-girder.jpg`; https://commons.wikimedia.org/wiki/File:Anderson_Bridge_closeup_looking_E.jpg

| Hex | What | Crop | Share |
|---|---|---|---|
| `#959798` | Light grey painted steel | 0.05,0.25,0.30,0.75 | 58.0% (resample) |

Use: a neutral light grey; no colour proposed. Pattern source: the rivet grid. Near a party colour: no.

### `civic-cavenagh-pylon.jpg`

Cavenagh Bridge: a granite pylon, cream-painted steel stay rods fanning from it, a lamp, and red-tan paving, with people crossing the frame and a red sign on the pylon. Marcin Konsek, CC BY-SA 4.0. Citation: SOURCES row `civic-cavenagh-pylon.jpg`; https://commons.wikimedia.org/wiki/File:2016_Singapur,_Downtown_Core,_Most_Cavenagha_(03).jpg

| Hex | What | Crop | Share | Lighting |
|---|---|---|---|---|
| `#6c6359` | Granite pylon, shaded face | 0.21,0.25,0.30,0.75 | 57.7% | Midday overcast; lit face `#aea193` |
| `#98816f` | Paving (resample) | 0.40,0.85,0.65,1.0 | 71.7% | Same |

Use: the granite is a warm grey, not blue-grey, which supports the v1 stone family (S9 `#908d82`, S10 `#868680`, S11 `#595855`). No colour proposed. Pattern source: the stay-rod fan. Near a party colour: no; the red sign and a plaque are outside the crops.

### `civic-padang-turf.jpg`

The Padang's turf with faint white chalk lines, a white goal frame and a road behind, diffuse light with sun patches. Orderinchaos, CC BY-SA 4.0. Citation: SOURCES row `civic-padang-turf.jpg`; https://commons.wikimedia.org/wiki/File:Rugby_goal_and_markings_at_Padang.jpg

| Hex | What | Crop | Share | OKLCH |
|---|---|---|---|---|
| `#81a24e` | Turf | 0.05,0.80,0.45,0.98 | 44.2% | L 0.668, C 0.118, h 127.1 |
| `#84a552` | Turf (resample) | same | 39.8% | L 0.678, C 0.117, h 127.1 |
| `#8cab5b` | Lit patch | per the fetch notes | n/a | L 0.699, C 0.113, h 126.5 |

Use: candidate for `chart-2` or `success`. It is a cleaner, more saturated green than the Parliament lawn (hue 127 against 120 to 124), but the hue is within a few degrees and the lightness is the same as v1's dark `chart-2`. A derived light value (`#526e20`) differs from v1 `chart-2` by an OKLab distance of 0.017, which is not visible. Not proposed; the reasons are in `docs/palette.md`.

Near a party colour: no.

### `civic-elephant-statue.jpg`

The elephant statue at the Old Parliament House from a low angle: a near-black elephant with white tusks on a white plinth, fluted white pilasters and cream render behind, a high-rise with a CapitaLand sign at the left edge. Mike Peel, CC BY-SA 4.0. Citation: SOURCES row `civic-elephant-statue.jpg`; https://commons.wikimedia.org/wiki/File:At_Singapore_2023_083_-_Elephant_statue_at_the_Old_Parliament_House,_Singapore.jpg

| Hex | What | Crop | Share | Lighting |
|---|---|---|---|---|
| `#28292d` | Statue, painted near-black with slate sheen | 0.46,0.30,0.66,0.75 | 54.1% | Overcast; mid `#525356`, highlight `#989b9c` |
| `#222327`, `#3f3f43` | Same (resample) | same | 36.9%, 34.2% | Same |
| `#d5c7b6` | Cream render in shade | 0.72,0.35,0.78,0.85 | 82.2% | Overcast, shade |

Use: the statue is a cool neutral (OKLCH h 275, C 0.007), not bronze brown as the scout expected. Candidate for a dark surface. v1's warm `#161512` already comes from the gown cloth and reads as one family with the other warm surfaces, so replacing it with a cool slate would split the dark theme. Not proposed. The sign at the left edge is a corporate mark and was not sampled.

Near a party colour: no.

## Text sources (nothing committed)

These gave findings only. No image from any of them is in the repo.

- The Mace. The parliament.gov.sg history page describes the head as a winged lion carrying a trident and the shaft as embossed with lion heads and junks (https://www.parliament.gov.sg/history/history-of-the-mace). The metal is not named in what was read. The description is recorded only to say that the Mace is a heraldic object and is not reproduced (ADR 0002). The 1953 City Council mace in the National Museum is silver-gilt (roots.gov.sg) but is not Parliament's mace.
- Architecture. Wikipedia describes the Arts House as a Neo-Palladian mansion by George Drumgoole Coleman, with arches at the porch and Palladian windows in the original design. The louvred-window motif belongs to Empress Place, not the Old Parliament House, which has sash windows. The elephant was cast in bronze in Bangkok (the colour measured is a painted near-black). Cavenagh Bridge has granite turrets and Glasgow steel.
- Printed Hansards elsewhere. The Ontario Hansard 1958 (Internet Archive `hansard1958ontauoft`) and the Indian Legislative Council debates of 30 July 1868 (`eparlib.nic.in.763636`) were read as OCR text only, for layout patterns. The Ontario volume's licence allows non-commercial reproduction only, so no text or image was copied. The Indian debates are marked public domain on the Internet Archive; the page image that was tried is a pure-white title page with nothing to sample.
- Official record families. parliament.gov.sg lists Official Reports (Parliamentary Debates), Select Committee Reports, Bills Introduced, Votes and Proceedings, Order Paper, Papers Presented to Parliament, Standing Orders and a Glossary. That list is a navigation model for the document types the app might one day hold.
- sprs.parl.gov.sg is an Angular shell with stock Bootstrap and gave nothing to sample.

Not used and why: the 1955 Legislative Council seating-chart SVG on Commons (its fills are party colours); the 1905 UK parliamentary debates index (no rights field); a Blue Book appendix on the Internet Archive (no licence field, greyscale pages); photos tagged with crests in their descriptions; parliament.gov.sg photos and Flickr (licence not checked, official marks).

## Typography and page furniture

From the Gazette scans (1871 and 1889) and the OCR text of other legislatures' records. These are observations about layout, not a proposal to copy a period look.

- Running heads. 1871: folio at the left, then the title in capitals, then the date, all on one line above a double rule. 1889: the same in small capitals with an old-style folio. For the app: a running head above a long report (report title left, sitting date right, a double hairline rule) is a documented pattern. Source Serif 4 has no old-style figures from Google Fonts (see the Serif section of `palette.md`), so the folio stays lining.
- Italic side heads in the margin. 1871 p.16 sets a short italic note ("Audit.", "Registrar's books.") in a left column, right-aligned to the text edge, level with the first line of the paragraph it names. Fits marginal labels in a reading view (the topic of a paragraph, a procedural tag) on wide screens, with the label above the paragraph on narrow ones.
- Small-caps labels. Offices and lead-ins are in small capitals: the dateline, "COLONIAL SECRETARY'S OFFICE", "WHEREAS", sub-heads such as "Salaries". Whether the served Source Serif 4 files carry a small-caps feature was not checked. The fallback is letter-spaced uppercase at a smaller size.
- "PRESENT:" blocks. A meeting record opens with a centred "PRESENT:" and a list with the presiding officer first, one name or office per line, and the full style of each person (honorifics and post-nominals stay attached in the 1868 Indian record). Matches the collapsible "present" block idea for sittings: presiding officer first, honorifics kept.
- Numbered paragraphs. Section and paragraph numbers run into the text at the start of the line (1871 p.16, numbers 81 to 95) with no hanging indent. A reading view with clause numbers can set them in tabular figures at the line start.
- Tabular estimates. 1889 p.14 uses a ruled table: right-aligned figures, comma thousands, a "$" sign at the head of the column, roman numerals for item numbers, a rotated column head, dot leaders to the figures, and a carried-forward line in italic. For the app: right-aligned `tnum` figures for vote counts and estimates, a heavier rule under the head, and light rules between groups.
- Speech labels and procedure lines. The Ontario OCR shows the speaker label as title, name, parenthetical office, colon, then a run-on speech ("Hon. L. M. Frost (Prime Minister):"). Procedure sits on its own line ("The Motion was put and agreed to."). The Indian record is an abstract in indirect narration with no speaker colon, so older sittings may need that case handled. Both are visible in the app's existing sample paragraph, which already sets the label in bold and the procedure in italic.
- Measure. The 1871 page runs full width, about 90 characters a line, justified with hyphenation, in a single column. That is a print page with a wide trim, and these sources do not support a narrow screen measure either way. The preview keeps about 66 characters (`66ch`), which is the usual guidance for screen text. Do not read the Gazette as evidence for full-width lines.
- The blackletter masthead on the 1871 first page ("Straits Settlements", "Published by Authority") is a period display face. We will not imitate it. It was cropped out of the committed image together with the royal arms.

## Visual language ideas

All of these are pattern or texture only. None reproduces an object, a mark or a drawing; any shape would be drawn from scratch and kept abstract. None should carry a party colour.

From the building and exhibition:

- Floodlit roof: a thin terracotta rule along the top of the dark theme's header, using the existing `chart-5` (`pc-parliament-house-night.jpg`).
- Brick forecourt: a running-bond hairline texture for empty states and the footer (`pc-front-facade-2025.jpg`). The brick reads rose-grey in that photo, so the texture should be neutral, not red.
- White fence bars: a rule of evenly spaced thin vertical bars between speeches or sections (`pc-front-facade-2025.jpg`, also visible in `pc-parliament-house-night.jpg`).
- Window slits: the tall paired slits of the centre block as a column rhythm for tables and attendance lists (`pc-front-facade-2025.jpg`).
- Veneer strip with a satin frame: an inline label chip with a warm wood tint and a thin metal-grey border. Developed as `tag` (`pc-parlconnect-sign.jpg`, `pc-parlconnect-main-hall.jpg`).
- Charcoal header bands with white sans titles: report headers in dark mode. Developed as `heading-band` (`pc-parlconnect-functions-panels.jpg`).
- Carpet flecks: a very low-contrast speckle on large empty areas only. It would add noise behind text, so it stays off the reading column (`pc-parlconnect-main-hall.jpg`).
- Orchid lilac: a rare match-highlight tint. Developed as `highlight` (`pc-vanda-miss-joaquim.jpg`).

From the civic district:

- White trim on warm render: cream cards with a thin off-white rule (`civic-arts-house-daylight.jpg`, `civic-arts-house-dusk.jpg`).
- Paired pilasters: an uneven pair-and-single rhythm for row dividers, a short double rule followed by a single one (`civic-arts-house-dusk.jpg`).
- Fluted vertical lines: a fine 1 to 2 px vertical hatch on section headers (`civic-elephant-statue.jpg`, `civic-arts-house-dusk.jpg`).
- Rivet grid: a dotted rule for context changes, such as a change of sitting or day (`civic-anderson-girder.jpg`).
- Rusticated horizontals: stacked alternating grey bands as a timeline background (`civic-victoria-theatre.jpg`).
- Scrollwork: a repeating scroll drawn from scratch for loading or empty states. It must not copy the gate's pattern (`civic-victoria-theatre.jpg`).
- Chalk lines on turf: thin white rules on a green panel for chart areas (`civic-padang-turf.jpg`).
- Stay-rod fan: a repeating diagonal for empty states, abstract only (`civic-cavenagh-pylon.jpg`).

From print:

- Double hairline rule under a running head and above a dateline (`print-gazette-1871-p16.jpg`, `print-gazette-1889-p14.jpg`).
- Bound volume: a dark green cloth tone with a tan edge strip as a motif for volume or session index cards. Developed as `chart-6` for the colour (`print-gazette-1889-cover.jpg`).
- Italic marginal notes and a collapsible "Present" block, as in the typography section (`print-gazette-1871-p16.jpg`, `print-gazette-1871-issue1-text.jpg`).
- A seat map as a secondary view with a single neutral fill, never party fills. The only open seating chart found (the 1955 Legislative Council SVG) uses party colours and is not committed.

## Gaps

No open photo exists, as far as the scouts could find on Commons and the Internet Archive, of:

- The current chamber interior. Every open chamber photo is the former chamber, apart from the printed photo on an exhibition panel.
- The chamber carpet.
- The Speaker's chair.
- The Mace as an object.
- Bound Singapore Hansard volumes.
- Order Papers, Votes and Proceedings, or Legislative Assembly records. Singapore government works are protected for 70 years from publication, so only pre-1956 items count as public domain, and none turned up.

Where to look next:

- NLB BookSG and NewspaperSG, which were not queried. They may hold pre-1956 Legislative Council papers and photographs; check the licence per item.
- Parliament's own media, with written permission. This is the only route to the current chamber, the chair and the Mace, and it would need a licence that allows the repo to hold copies.
- Royce's own photos. These are the cleanest option (no licence question) and the best chance of a true current-chamber and carpet sample.
- HathiTrust, also not queried.
