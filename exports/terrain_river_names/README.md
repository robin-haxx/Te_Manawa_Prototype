# River names across the timeline

27 frames of the ground layer at 1920×1080 (terrain, water, frost, haze; no sprites, no ash), with the
river names lettered as the wall letters them (`TeManawa_rivernames.js`): white block capitals along each
channel, each letter turned to the curve and centred on the painted water, kept clear of where the HUD
stands. **One frame for each change in which names are on screen.** All from one page load (one seed,
6643) in the wall's cover-fit view, exported 2026-11-01. Each frame is stamped with its date, MIS and
what changed (`+` a name appears, `−` one goes).

**To regenerate:** serve with `node tools/serve.js 8093 --export` (the `temanawa-export` launch config),
open the page at 1920×1080 and load `/tools/export_frames.js` (see its header), then
`TM_EXPORT.scanNames()`, wait for `TM_EXPORT.finished`, then `TM_EXPORT.runNames('terrain_river_names/names')`.
A new page load is a new seed, so the dates of the changes will differ.

## How the frames were chosen

- The whole window was scanned every 10 kyr, 1 Ma to 25.5 ka (99 dates). Each date's layout remembers the
  one before it, as the live wall remembers its last layout (a name on screen has a little more slack to
  stay than a new one has to appear).
- A set of names that lasts a single sample (15 of them) is a flicker at that sampling, not a stage, and
  is folded into its neighbours. On the wall the same gap does not blink: a name the next re-layout cannot
  place is held where it was for one more (`TM_RIVER_NAMES.holdLayouts`).
- That leaves 27 stages; each frame is the first date of its stage. The last stage runs to 25.5 ka.

## Why the bottom of every frame is unnamed

That is where the visitor HUD stands: the goal line, the timeline with its eruption pins, and the year,
climate line and boost count. Names keep clear of all of it (`InstallHUD.labelKeepOut`), and of the top
strip where the debug timeline appears (the date stamp sits there). Below the timeline they may use the
map either side of the year block, which is how TOKOMARU and MĀKĀKAHI get named.

## How often each name is on screen (of the 99 dates)

| Name | Dates | Why it comes and goes |
|---|---:|---|
| MANAWATŪ (main stem) | 99 | |
| MANAWATŪ (the `upper Manawatū` tributary) | 99 | |
| ŌROUA, KIWITEA, POHANGINA, TAMAKI | 99 | |
| TĪRAUMEA | 87 | runs off the right edge; only its lower reach is on screen |
| MĀKĀKAHI | 83 | mostly under the goal band; named in the gap beside the year block |
| MANGATORO | 50 | named to 510 ka, then its valley is hidden behind nearer high ground in the 3/4 view |
| TOKOMARU | 44 | under the year block or the goal band unless its course swings west |
| MANGATAINOKA | 26 | mostly under the HUD |
| MANGATEWAINUI | 26 | a short stretch in the top-right corner, at the screen edge |
| MANGAHAO | 0 | entirely under the HUD in this view |

A name needs a stretch of visible river water at least as long as itself and gently bent (under ~1 rad
of turning, no bend tighter than 1.4 letter heights). The always-named rivers have long open courses; the
others are short pieces between the HUD, the screen edge and the ridges, so the land's slow changes (sea
level, the meanders, the course shifts at each termination) take them in and out of reach.

## Names as shown

- The main stem has no name in `geo/manawatu.svg`; it is lettered **MANAWATŪ** (`TM_RIVER_NAMES.mainName`).
- The `upper Manawatū` tributary is the Manawatū's own upper course, so it is lettered **MANAWATŪ** too,
  as an atlas repeats a long river's name (the reference map repeats "Yellow" three times). The full
  `UPPER MANAWATŪ` is 14 letters and fitted its meanders only 71% of the time in an earlier scan. Delete its
  entry in `TM_RIVER_NAMES.rename` to show the authored name.
- Every other name is the authored one in capitals, macrons kept (Nadira has Ā Ē Ī Ō Ū).

## Frames

| # | Date | MIS | Names | Change |
|---|---:|---|---:|---|
| 01 | 1,000 ka | 25 | 10 | the opening: both MANAWATŪ, ŌROUA, KIWITEA, POHANGINA, TAMAKI, TĪRAUMEA, MANGATORO, MĀKĀKAHI, MANGATEWAINUI |
| 02 | 960 ka | 24 | 9 | − MANGATEWAINUI |
| 03 | 890 ka | 22 | 10 | + MANGATEWAINUI, TOKOMARU − MĀKĀKAHI |
| 04 | 860 ka | 21 | 10 | + MĀKĀKAHI − TOKOMARU |
| 05 | 830 ka | 21 | 9 | − MANGATEWAINUI |
| 06 | 810 ka | 20 | 10 | + TOKOMARU |
| 07 | 770 ka | 19 | 10 | + MANGATAINOKA, MANGATEWAINUI − MĀKĀKAHI, TOKOMARU |
| 08 | 710 ka | 17 | 8 | + MĀKĀKAHI − MANGATAINOKA, MANGATEWAINUI, TĪRAUMEA |
| 09 | 690 ka | 17 | 9 | + TĪRAUMEA |
| 10 | 670 ka | 16 | 10 | + TOKOMARU |
| 11 | 620 ka | 15 | 9 | − TOKOMARU |
| 12 | 580 ka | 15 | 8 | − TĪRAUMEA |
| 13 | 530 ka | 13 | 9 | + TĪRAUMEA |
| 14 | 500 ka | 13 | 9 | + MANGATEWAINUI − MANGATORO |
| 15 | 470 ka | 12 | 10 | + TOKOMARU |
| 16 | 420 ka | 11 | 8 | − MANGATEWAINUI, TOKOMARU |
| 17 | 390 ka | 11 | 7 | + MANGATAINOKA − MĀKĀKAHI, TĪRAUMEA |
| 18 | 360 ka | 10 | 9 | + TOKOMARU, TĪRAUMEA |
| 19 | 340 ka | 9 | 9 | + MĀKĀKAHI − TOKOMARU |
| 20 | 320 ka | 9 | 8 | − TĪRAUMEA |
| 21 | 290 ka | 8 | 9 | + TOKOMARU, TĪRAUMEA − MANGATAINOKA |
| 22 | 250 ka | 8 | 7 | − MĀKĀKAHI, TOKOMARU |
| 23 | 220 ka | 7 | 9 | + MANGATAINOKA, MĀKĀKAHI |
| 24 | 190 ka | 6 | 10 | + TOKOMARU |
| 25 | 110 ka | 5 | 9 | − MANGATAINOKA |
| 26 | 90 ka | 5 | 10 | + MANGATAINOKA |
| 27 | 40 ka | 3 | 9 | − MANGATAINOKA (holds to 25.5 ka) |

MANGATORO is named at every date down to 510 ka and at none after (frame 14 on): as the ranges rise
through the window, nearer high ground hides most of its valley in the 3/4 view.
