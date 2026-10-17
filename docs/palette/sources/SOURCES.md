# Palette source photos

One row per file in this directory. Every file was resized so its long edge is at most 1600 px. Only images with a known open licence are here. The repo is private; if it is ever made public, recheck each licence on its source page first. All files were fetched on 2026-10-13 from Wikimedia Commons.

Not committed: the State Crest, the Parliament logo and the national flag. Their colours come from published specifications and are cited in `docs/palette.md`. No openly licensed photo of the Serjeant-at-Arms, Parliament staff uniforms, the Mace, the Clerks' robes or a government official portrait was found, so those categories have no source photo.

| File | Source | Author | Licence | What was sampled |
|---|---|---|---|---|
| `parliament-house-2023-079.jpg` | https://commons.wikimedia.org/wiki/File:Parliament_House_Singapore_2023_079.jpg | Mike Peel | CC BY-SA 4.0 | Stone cladding in sun and shade, hip roof tiles in hazy daylight, perimeter fence bars, porte-cochere brick driveway, white kerb, clipped shrubs |
| `parliament-house-2013-02-25.jpg` | https://commons.wikimedia.org/wiki/File:Parliament_House,_Singapore_-_20130225.jpg | Haakon S. Krohn | CC BY-SA 3.0 | Granite sign plinth under overcast, front lawn under overcast, clipped box hedge |
| `parliament-house-2023-01.jpg` | https://commons.wikimedia.org/wiki/File:Parliament_House,_Singapore,_2023_(01).jpg | Bahnfrend | CC BY-SA 4.0 | Granite sign plate, sunlit lawn, ixora hedge foliage |
| `parliament-house-2010-08-03.jpg` | https://commons.wikimedia.org/wiki/File:Parliament_House,_Singapore_-_20100803-01.jpg | Smuconlaw | CC BY-SA 3.0 | Clay hip roof, sunlit and shaded slopes in evening light; tree foliage in evening shade; evening sky, upper left (sky-blue, decision 26) |
| `parliament-place-road.jpg` | https://commons.wikimedia.org/wiki/File:Parliament_Place.JPG | Terence Ong | CC BY 2.5 | Parliament Place asphalt and concrete kerb |
| `speaker-ceremonial-gown-01.jpg` | https://commons.wikimedia.org/wiki/File:Ceremonial_gown_of_the_Speaker_of_the_Parliament_of_Singapore,_ParlConnect,_Parliament_House,_Singapore_-_20150306-01.jpg | Smuconlaw | CC BY-SA 4.0 | Speaker's ceremonial gown on museum display: black cloth, red satin facing, gold lace on the front and on the cuff |
| `former-chamber-strangers-gallery.jpg` | https://commons.wikimedia.org/wiki/File:Strangers%27_Gallery,_former_Parliamentary_Chamber,_The_Arts_House_at_the_Old_Parliament,_Singapore_-_20110407-01.JPG | Smuconlaw | CC BY-SA 4.0 | Strangers' Gallery front timber panelling, lit face (teak) |
| `former-chamber-leather-seat.jpg` | https://commons.wikimedia.org/wiki/File:Former_Parliamentary_Chamber,_The_Arts_House_at_the_Old_Parliament,_Singapore_-_20110407-12.JPG | Smuconlaw | CC BY-SA 4.0 | Red-maroon leather seat upholstery, lit face and shadow; varnished timber floor. Sampled but no token uses it (see `docs/palette.md`, open points) |

## Removed

- `parliament-house-sign-close-up.jpg` (https://commons.wikimedia.org/wiki/File:Singapore_Parliament-House-02.jpg, CEphoto, Uwe Aranas, CC BY-SA 3.0) was removed on 2026-10-13 (decision 26) because it is a close-up of the Parliament sign with the State Crest and the Mace, which ADR 0002 keeps out of the repo. The two colours sampled from it, `granite-sign` #868680 and `sign-blue` #175082, were replaced by `granite-pylon` (from `civic-cavenagh-pylon.jpg`) and `sky-blue` (from `parliament-house-2010-08-03.jpg`).

## Official marks in frame (sweep of 2026-10-13)

Every photo was viewed. None of the remaining files is a close-up of a mark, and no thumbnail shown in the app includes one (those thumbnails are cropped; see `app/src/palette/palette.ts`). Marks that appear at small size inside a wider frame:

- `parliament-house-2023-01.jpg` and `parliament-house-2013-02-25.jpg`: the Parliament sign with the crest and mace is a main subject in the lower part of the frame; flag banners or a flag on the facade.
- `parliament-house-2023-079.jpg`: crest relief on the facade, national-flag banners between the windows, a flag on the mast.
- `parliament-house-2010-08-03.jpg`, `pc-parliament-house-night.jpg`, `pc-front-facade-2025.jpg`: crest relief on the facade and a flag on the mast, small.
- `speaker-ceremonial-gown-01.jpg` and `pc-parlconnect-main-hall.jpg`: the Mace in its display case at the edge of the frame.
- `civic-victoria-theatre.jpg`: the theatre's own shield ornament above the arch (not a state mark).
- Clean: `parliament-place-road.jpg`, `former-chamber-strangers-gallery.jpg`, `former-chamber-leather-seat.jpg`, `pc-parlconnect-sign.jpg`, `pc-parlconnect-functions-panels.jpg`, `pc-vanda-miss-joaquim.jpg`, the four `print-gazette-*` pages, `civic-arts-house-dusk.jpg`, `civic-arts-house-daylight.jpg`, `civic-chamber-benches.jpg`, `civic-anderson-girder.jpg`, `civic-cavenagh-pylon.jpg`, `civic-padang-turf.jpg`, `civic-elephant-statue.jpg`.

## Rejected on licence or provenance

- `File:Tan_Chuan_Jin.jpg`: tagged CC BY-SA 4.0 but credits the People's Action Party as author with no evidence of a release by the party.
- `File:Parliament_House,_Singapore_-_20050806.jpg`: CC BY-SA 3.0 but no author credited on the file page, so the attribution row could not be filled.
- `File:Singapore_parliamentarians_at_Double_Ten_Day_1997_function.jpg`: licence recorded only as "Attribution", not a recognised licence name.
- `File:Speaker_of_the_National_Assembly_Woo_Won-shik_meets_with_Speaker_of_the_Parliament_of_Singapore_Seah_Kian_Peng_20250220_(01)` to `(05)`: KOGL Type 1, not in the accepted set.

## Not used

Every photo of the chamber interior on Commons with an open licence shows the former chamber in the Old Parliament House (now The Arts House), not the current chamber. The timber and seat tokens are therefore sampled from the former chamber, and `docs/palette.md` says so.

## Track B research photos (2026-10-13)

Fetched from Wikimedia Commons and the files' own pages on 2026-10-13 for the wider asset research in `docs/palette/research.md`. Same rules as above: long edge at most 1600 px, known open licence only. The Gazette files are page images taken from the Commons PDFs. Colours only; some files show a crest, logo, flag or people incidentally, and none of those were cropped or sampled.

| File | Source | Author | Licence | What was sampled |
|---|---|---|---|---|
| `pc-parlconnect-main-hall.jpg` | https://commons.wikimedia.org/wiki/File:ParlConnect,_Parliament_House,_Singapore_-_20150306-01.jpg | Smuconlaw | CC BY-SA 4.0 | ParlConnect main hall: ochre-brown wall under track light (0.00,0.45,0.22,0.62) and cherry veneer pillar (0.58,0.30,0.61,0.55); carpet flecks viewed for texture only |
| `pc-parlconnect-sign.jpg` | https://commons.wikimedia.org/wiki/File:ParlConnect,_Parliament_House,_Singapore_-_20150306-05.jpg | Smuconlaw | CC BY-SA 4.0 | ParlConnect sign: satin aluminium frame (0.40,0.31,0.75,0.34), charcoal wall (0.6,0.05,0.8,0.2) and lit orange-cherry veneer behind the lettering (0.20,0.45,0.23,0.58); lettering not sampled |
| `pc-parliament-house-night.jpg` | https://commons.wikimedia.org/wiki/File:Parliament_House,_Singapore,_at_night_-_20120926.jpg | Erwin Soo | CC BY 3.0 | Floodlit terracotta pyramid roof (0.42,0.22,0.52,0.30) and hip roof (0.05,0.37,0.30,0.39); crest, flags and palms not sampled |
| `pc-front-facade-2025.jpg` | https://commons.wikimedia.org/wiki/File:Downtown_Core,_Singapore_-_Parliament_House_of_Singapore_(MAR_2025)_-_img_05.jpg | Chainwit. | CC BY 4.0 | Granite wing wall (0.10,0.57,0.30,0.70), roof top (0.45,0.40,0.56,0.43), white fence (0.05,0.74,0.25,0.79), forecourt brick (0.52,0.90,0.66,0.98 and 0.58,0.86,0.76,0.97); crest, sign and sky not sampled |
| `pc-vanda-miss-joaquim.jpg` | https://commons.wikimedia.org/wiki/File:Papilionanthe_Miss_Joaquim_taken_at_Botanic_Gardens.jpg | 蕭裕 | CC BY-SA 4.0 | Orchid petal lilac (0.70,0.33,0.80,0.45), lip magenta (0.50,0.65,0.65,0.85), throat (0.55,0.42,0.62,0.58) |
| `pc-parlconnect-functions-panels.jpg` | https://commons.wikimedia.org/wiki/File:ParlConnect,_Parliament_House,_Singapore_-_20150306-02.jpg | Smuconlaw | CC BY-SA 4.0 | Printed chamber photo (0.31,0.35,0.44,0.65), red leather chair (0.70,0.52,0.76,0.62), charcoal panel header (0.115,0.10,0.26,0.22) |
| `print-gazette-1871-issue1-text.jpg` | https://commons.wikimedia.org/wiki/File:Straits_Settlements_Government_Gazette_(1871).pdf | Straits Settlements Government | Public domain | PDF page 5 (printed p.1, No. 1, 6 Jan 1871), text area below the royal arms; paper margin and body-text ink |
| `print-gazette-1871-p16.jpg` | https://commons.wikimedia.org/wiki/File:Straits_Settlements_Government_Gazette_(1871).pdf | Straits Settlements Government | Public domain | PDF page 20 (printed p.16, 13 Jan 1871), full page; paper and ink, side heads and running head |
| `print-gazette-1889-p14.jpg` | https://commons.wikimedia.org/wiki/File:Straits_Settlements_Government_Gazette_(1889,_Jan-Mar).pdf | Straits Settlements Government | Public domain | PDF page 20 (printed p.14, 4 Jan 1889), full page; paper and table ink |
| `print-gazette-1889-cover.jpg` | https://commons.wikimedia.org/wiki/File:Straits_Settlements_Government_Gazette_(1889,_Jan-Mar).pdf | Straits Settlements Government | Public domain | PDF page 1, dark green cloth binding with brown leather spine and corners; cloth area only |
| `civic-arts-house-dusk.jpg` | https://commons.wikimedia.org/wiki/File:Antiguo_parlamento,_Singapur,_2023-08-18,_DD_24-26_HDR.jpg | Diego Delso | CC BY-SA 4.0 | Facade at dusk: render, bronze-elephant plinth, terracotta paving |
| `civic-arts-house-daylight.jpg` | https://commons.wikimedia.org/wiki/File:Singapore_-_The_Arts_House_former_parliament_IMG_9274.jpg | Bjoertvedt | CC BY-SA 4.0 | Portico arch pier white trim and pale wall, daylight |
| `civic-chamber-benches.jpg` | https://commons.wikimedia.org/wiki/File:Former_Parliamentary_Chamber,_The_Arts_House_at_the_Old_Parliament,_Singapore_-_20110407-09.JPG | Smuconlaw | CC BY-SA 4.0 | Teak bench fronts and floor, interior light; no people, no leather crop (visitors appear elsewhere in the frame) |
| `civic-victoria-theatre.jpg` | https://commons.wikimedia.org/wiki/File:Front_of_Victoria_Theatre,_Singapore_-_20141101-02.JPG | Jacklee | CC BY-SA 4.0 | Grey render, arch pier, grey iron gate; medallion excluded from crops |
| `civic-anderson-girder.jpg` | https://commons.wikimedia.org/wiki/File:Anderson_Bridge_closeup_looking_E.jpg | Orderinchaos | CC BY-SA 4.0 | Painted steel girder side plates with rivets, overcast |
| `civic-cavenagh-pylon.jpg` | https://commons.wikimedia.org/wiki/File:2016_Singapur,_Downtown_Core,_Most_Cavenagha_(03).jpg | Marcin Konsek | CC BY-SA 4.0 | Granite pylon face, shaded (granite-pylon, decision 26) and paving; red sign and plaque outside the crops |
| `civic-padang-turf.jpg` | https://commons.wikimedia.org/wiki/File:Rugby_goal_and_markings_at_Padang.jpg | Orderinchaos | CC BY-SA 4.0 | Turf at the Padang, crop clear of the chalk lines |
| `civic-elephant-statue.jpg` | https://commons.wikimedia.org/wiki/File:At_Singapore_2023_083_-_Elephant_statue_at_the_Old_Parliament_House,_Singapore.jpg | Mike Peel | CC BY-SA 4.0 | Elephant statue body, cream wall and white plinth |

## Chamber palette photos (17 Oct 2026), not committed

The current palette is sampled from photos of the debating chamber in Parliament House (ADR 0005). None has an open licence, so none is in this directory. Each is cited by URL in `docs/palette.md`, section "Sources", with its crop boxes.

| Photo | Page | Publisher | What was sampled |
|---|---|---|---|
| `TheChamber.png`, 670 by 377 px | https://www.parliament.gov.sg/about-us/facilities | Parliament of Singapore | Speaker's wall panelling, seat leather, table of the House, floor carpet, stone wall. Every token colour from the chamber comes from this photo |
| MDDI sitting broadcast frame, 1280 by 720 px | https://www.youtube.com/watch?v=vSzKCk0BCXk | Ministry of Digital Development and Information | Rechecks of the panelling, leather, table and carpet; side wall |
| CNA frame of the Speaker, 2022, 1280 by 720 px | https://www.youtube.com/watch?v=hCueuqgesEg | CNA | Recheck of the side panelling and the chair canopy, clear of the crest |

Since the switch, no token cites `parliament-house-2023-079.jpg`, `parliament-place-road.jpg`, `former-chamber-strangers-gallery.jpg`, `civic-chamber-benches.jpg` or `civic-cavenagh-pylon.jpg`. They stay here as the record behind the version 1 palette, and their `/palette` thumbnails were removed.
