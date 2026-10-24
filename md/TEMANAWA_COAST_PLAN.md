# Te Manawa — The breathing coast: a sea-level plan

**How the shoreline should rise and fall across the glacial cycles, checked against the science and
against what the sim does now.** Status: **built** (2026-10-19), except the copy (step 6) and
the transect calibration (step 1, done from published slopes, not measured); see §5 for what was
built and how it differs from the plan. It replaces the "breathing coast" mechanics in
`TEMANAWA_GEOGRAPHY.md` §7 step 5–6, and reads alongside
`TEMANAWA_NATURAL_HISTORY.md` §I and `TEMANAWA_DEEPTIME_ECOLOGY_PLAN.md` (Axis A emergence, Axis C
climate).

---

## 0. The short answer

**The popular LGM maps are right about one moment and wrong about the rest of the cycle.** They draw
the shoreline along today's −100 to −130 m depth contour. Trewick & Bland (2012) use the same
approximation (the 120 m contour) for the LGM, with two caveats: tidal channels may have persisted
through the "land bridge", and its extent is uncertain. NIWA has Cook Strait closed by a land bridge
then, until the sea broke through about 16,000 years ago. So the peak picture is defensible. The
overstatement is in time and in history:

- **Time.** The sea stood that low for roughly ten thousand years around 29–19 ka. For most of each
  ~100,000-year cycle it stood far higher: peak MIS 3 (~50–37 ka) is now put at about −40 m, and the
  Manawatū's own record has it 25–50 m below present. A map captioned "the last glaciation" shows
  the extreme as if it were typical.
- **History.** The same sea-level fall did not always bare the same land. Trewick & Bland conclude
  that a substantial connection through the Whanganui Basin is unlikely before ~1 Ma, and that the
  islands were only weakly linked, or not at all, until the late Pleistocene glacials, when **uplift
  of the southern North Island added to the sea-level fall**. An LGM map projected back onto earlier
  glacials overstates their land.

**The sim has the right structure but the wrong numbers.** It already has the two layers your reading
of Trewick & Bland describes, a slow tectonic trend plus a fast glacial swing. Measured on
2026-10-19:

- **Sea level is a straight line from the cold index** (`Climate.seaLevel`), so MIS 3 sits at about
  −73 m instead of about −40.
- **The coast does not track it smoothly.** From the present to −73 m the shore barely moves on most
  rows. Between −73 and −125 m the whole western sea flips to land at once. The procedural sea floor
  is noise, not a shelf profile.
- **The slow layer stops at 0.5 Ma.** After that, every interglacial floods to the same line and
  every glacial drains to the same line, so the plain never "fills out" the way the terrace flight
  says it did.

**Measured coast positions** (first non-sea cell from the west edge, as a fraction of map width, on
five rows; one seed). These were taken in a session where the hidden browser pane gave the map a
portrait footprint, so treat them as skeleton-relative; step 1 re-measures at the wall's 16:9.

| State | Sim sea level | Row 0.25 | Row 0.40 | Row 0.52 (river) | Row 0.60 | Row 0.70 |
|---|---:|---:|---:|---:|---:|---:|
| Interglacial + estuary (122 ka) | −1 m | 0.354 | 0.284 | 0.276 | 0.254 | 0.230 |
| "Present" (estuary off) | −1 m | 0.354 | 0.284 | 0.234 | 0.224 | 0.230 |
| MIS 5b (87 ka) | −46 m | 0.352 | 0.210 | 0.224 | 0.192 | 0.226 |
| MIS 3 (40 ka) | −73 m | 0.352 | 0.164 | 0.222 | 0.184 | 0.224 |
| Full glacial (140 ka) | −125 m | 0.008 | 0.114 | 0.072 | 0.088 | 0.112 |

At about 120 km across the 16:9 frame, the last row's jump is 12–42 km in one step.

---

## 1. Reading Trewick & Bland's maps

The four panels you shared (4 Ma, 3 Ma, 2.4 Ma, 1 Ma) support your reading: a slow trend with the sea
rising and falling on top. Two refinements make it directly usable:

- **Each panel is a composite, not one glacial state.** Green is land at every sea level. Cream is
  the band the shoreline swept across: land at lowstands, sea or estuary at highstands. The labels
  say so. At 1 Ma the cream west of the ranges reads *"Shallow-marine. Probable land and marginal
  marine environments during sea-level lowstand."* At 3 Ma the shelf note says the shoreline
  shifted by tens of kilometres with each glacial rise and fall of the sea.
- **Cream is not arid ground.** It is low coastal plain and marginal-marine flats. "The coast filling
  out" between the panels is that swing band rising out of the highstands' reach as the ranges and
  basin margin uplift and the rivers fill it with sediment. It turns green: permanent land.
- **The shrinking western fingers are the trough of a travelling wave.** The paper describes a wave
  of uplift and subsidence moving south along the western North Island margin: Whanganui rising at
  its back, the Marlborough Sounds' mountains sinking in its trough (their valleys drowned into the
  Sounds), its front now near Kaikōura–Nelson. The fingers are outside the Te Manawa frame; the
  frame sits on the wave's rising back.

**The frame is the red box on Fig. 4D (1 Ma).** West to east: open sea; the cream band of the
eastern Whanganui Basin (land at lowstands, marginal-marine at highstands); the proto-Ruahine and
proto-Tararua; the Manawatū crossing between them; the Mount Bruce drainage divide in the south-east.
At 1 Ma the basin's deepest, still-sinking part lay off Levin and Foxton, at the frame's south-west,
while the Whanganui side to the north had already turned to uplift.

So the model is: **slow layer** = the swing band narrows and moves seaward over the run, and the
offshore basin floor rises toward the lowstands; **fast layer** = the shoreline sweeps across
whatever band remains, once per cycle. The local rocks record exactly this: each interglacial left a
marine terrace a little lower and further seaward than the one before. **The consequence for the
build: the glacial swing should grow through the run.** Early glacials expose a modest strip; the
late-Pleistocene glacials (MIS 6, MIS 2) expose the most, because uplift and sea-level fall add up.

---

## 2. What the evidence says

### 2.1 The sea-level curve

| Interval | Sea level vs present | Source |
|---|---|---|
| MIS 11 (~400 ka) | above present (estimates scatter widely) | Spratt & Lisiecki 2016 stack agrees with corals to within 5 m |
| MIS 5e (~125 ka) | ~+6 m | Stack within 5 m of corals; locally the Tokomaru Marine Terrace |
| MIS 5a, 5c, MIS 3 at ~37 ka | within ~30 m of present | Sloss 2006, citing Chappell, Cutler and others |
| MIS 3 (50–40 ka) | −25 to −50 m in the Manawatū; global peak ~−40 m (−38 ± 7) | Sloss 2006; Pico et al. 2016, 2017 |
| Onset of the LGM (~30 ka) | a fall of ~40 m in under 2,000 years | Lambeck et al. 2014 |
| LGM (~29–21 ka) | ~−120 m locally; −134 m ice-volume equivalent | NIWA; Lambeck et al. 2014 |
| Termination (after ~19 ka) | fast rise; Cook Strait reopens ~16 ka | NIWA |
| Holocene highstand | North Island up to +2.75 m, reached 8.1–7.2 ka | Clement et al. 2016 |

Two shape rules matter as much as the numbers:

1. **Sea level is not a straight line from the cold index.** On the way into a glaciation the oxygen
   isotopes (and so the index) lead sea level; at terminations sea level moves faster. A cold MIS 3
   can sit at a high sea level.
2. **The deep lowstand is brief.** Below about −100 m for roughly 10 kyr per cycle. Under the
   500 → 5,000 yr/s time-lapse that is a few seconds on the wall, and it should stay that way.

### 2.2 The Manawatū coast

- **Last interglacial shoreline: the Tokomaru Marine Terrace**, the broad bench along the foot of the
  Tararua and Ruahine. It now stands ~30 m near Levin and ~90 m near Palmerston North, because the
  uplift rate rises northward. At ~125 ka the sea lapped the range front (Sloss 2006).
- **Uplift and subsidence.** Wanganui coastal terraces rise ~0.4–0.9 mm/yr. Parts of the southern
  Wanganui Basin have subsided ~1 mm/yr, and Trewick & Bland put the depocentre off Levin–Foxton.
  The plain has been lifted while the offshore basin sinks.
- **MIS 3 coast.** With sea 25–50 m down, the Koputaroa dunes near Levin were only 5–10 km from the
  shore (Sloss 2006). That is close to today's coast, a few kilometres seaward at most.
- **LGM.** The rivers cut valleys into the terraces between Palmerston North and Levin, valley
  gradients steepened, and braided gravel built the Ohakean (Ashhurst) terrace upstream. Offshore,
  the South Taranaki Bight shelf was dry land joining the South Island (NIWA). The repo's "coast
  ~30 km west of today" (`TEMANAWA_ECOLOGY_COAST.md` §2) has no source; step 1 measures it.
- **Shelf shape.** Off the west coast the inner-to-mid shelf slopes ~0.5° (~9 m per km) and the outer
  shelf under 0.1°; the shelf reaches 220 km wide in western Cook Strait, and its edge lies ~250 m
  deep off Taranaki–Manawatū. So the coast should **march** steadily across the inner shelf and then
  **leap** once the sea drops onto the flat outer shelf. A late jump is real; the sim's is just
  uncalibrated.
- **Holocene highstand.** About 6,500 years ago the coast stood ~4 km inland of today's. The sea
  filled the incised lower Manawatū and Ōroua valleys behind the Himatangi and Marton anticlines and
  the Poroutawhao High, which kept the estuary sheltered.
- **Why today's depth contour is not the LGM coast.** The Manawatū–Kāpiti shelf is mud-dominated, and
  rivers south of Taranaki deliver up to 6.8 Mt of sediment a year. That post-glacial drape makes
  today's seabed shallower than the LGM surface, so the modern contour overstates LGM land. Basin
  subsidence works the other way. In this region the two partly cancel; expect several kilometres of
  uncertainty in any LGM shoreline.

---

## 3. The model to build

**Relative sea level at a cell = eustatic sea level(t) − tectonic uplift since t.** Three parts:

1. **A real sea-level curve**, kept separate from the vegetation's cold index.
   `Climate.SEA_ANCHORS` ([yearsBP, metres]) taken at the turning points of the Spratt & Lisiecki
   (2016) stack, in the same auditable style as `ANCHORS`. `Climate.at().seaLevel` reads it;
   `glacialIndex` keeps driving forest, frost and fauna. MIS 3 then sits near −40 m while the land
   stays cold and open, which is the point of the separation.
2. **A calibrated shelf profile.** Map metres to sim elevation from measured transects, so a given sea
   level puts the coast where the real one stood. The western sea floor becomes a shelf ramp
   (inner ~0.5°, outer flat) under the existing mottle, instead of free noise.
3. **The tectonic staircase.** The plain stood lower in the past by its uplift since (`U(x)·t`, rising
   toward the ranges and northward, ~0.4–0.9 mm/yr). Run this as a continuous term from 1 Ma to the
   window end rather than the current 1 → 0.5 Ma ramp. At 125 ka the +6 m sea then reaches the
   Tokomaru terrace at the range front; at 410 ka it reaches further; each highstand strands a lower
   bench. The cream band of Trewick & Bland narrows and moves seaward as the run plays. Offshore,
   the same term must lift the basin floor too, from a deeper start (the depocentre off Levin–Foxton
   at 1 Ma), so that **a given lowstand bares more shelf late in the run than early**: the
   late-Pleistocene connection Trewick & Bland describe, which was absent before ~1 Ma.

And three consequences that must come with it:

4. **The river follows the sea.** At lowstands the main stem extends across the exposed shelf to the
   new shore (an offshore reach on the authored polyline, live only where there is land) and incises
   near the coast. At highstands the drowned-valley estuary (built) fills the valleys behind the
   anticlines. Tributaries already join the main at every stage (fixed 2026-10-19), so they ride
   along.
5. **The frame edge.** The frame shows only ~10–15 km of sea west of the present coast. If the
   measured LGM shore lies beyond that, the sea leaves the frame at the deepest lowstands (MIS 16,
   12, 6, 2). Recommended: let it, briefly, because that is true. It only lasts a few seconds of
   time-lapse, and the label can say "the sea is beyond the horizon". Widening the view west instead
   costs `mapGrid` cells.
6. **What grows on new land.** The exposed shelf is cold, windy and sandy: the dune belt marches onto
   it (built: `duneCoastTrack`), with tussock and grey-scrub mosaic, braided channels and dune-dammed
   wetlands behind. No forest on the shelf in a glacial. `cullSubmergedPlants` already clears plants
   the sea re-takes.

---

## 4. Build steps

Each step is harness-verifiable and leaves the kiosk shippable.

1. **Calibrate.** Measure, along three transects (off the Rangitīkei mouth, Foxton, Waitārere), the
   distance from today's coast to the −20, −50, −80 and −125 m isobaths (NIWA NZ bathymetry grid),
   and onshore the distance to the 10, 30 and 60 m contours and the Tokomaru terrace edge (LINZ DEM).
   Confirm the frame's width in km and the present coast's u at the wall's 16:9. Output: a target
   table of coast u per sea level.
2. **`Climate.SEA_ANCHORS`.** Add the table and point `seaLevel` at it. Harness facts: MIS 3 above
   −60 m, LGM below −115 m, MIS 5e above 0, and the lowstand below −100 m for no more than ~15 kyr
   per cycle.
3. **Drive the coast by metres.** Replace `glacialSeaAmp·(g − glacialSeaMid)` with the calibrated
   metres→elevation profile, and shape the western sea floor as a shelf ramp. Harness: coast u at
   MIS 3, LGM and the present within the step 1 targets on all five rows, and monotonic in sea level
   (no row that holds still and then flips).
4. **The tectonic staircase.** Replace the 1 → 0.5 Ma `submergence` ramp on the plain with a
   continuous uplift backstep; keep the 1 Ma opening unchanged (the fork's re-dating). Harness: the
   1 Ma picture is byte-identical; each successive interglacial floods less far inland; the 125 ka
   shore lies at the range foot in the south; and the full-glacial coast lies further west at MIS 6
   and MIS 2 than at MIS 16 and MIS 12, at the same sea level.
5. **The river's offshore reach.** Extend the main stem to the frame's west edge, gated to land, so
   it always meets the sea; add lowstand incision. Harness: at every sampled year the main's mouth
   cell is adjacent to sea.
6. **Copy.** "The sea stood this low for only a few thousand years." "The sea is beyond the horizon."
   "Each warm age left a beach a little further out."
7. **Look and tune.** Screenshots at 1 Ma, 410 ka, 125 ka, 87 ka, 40 ka, 25.5 ka (same seed, 16:9);
   then the fauna-stability sweep, since land-rich years raise the refound top-up (MISTAKES.md).

---

## 5. As built (2026-10-19)

**Sea level.** `Climate.SEA_ANCHORS` holds 42 [yearsBP, m] turning points from 1 Ma to 18 ka, on
the same dates as `ANCHORS`, interpolated with smoothstep by `Climate.seaLevelAt`. Values follow the
Spratt & Lisiecki (2016) stack (NOAA `noaa-ocean-19982`) with three deliberate departures: the
corals for MIS 5e and MIS 11 (above present), the Pico/Sloss field evidence for MIS 3 (−45 to −55 m,
not the stack's ~−70), and modest values before 798 ka where the stack is sparse. Checked values:
45 ka −50 m, LGM −126 m, MIS 6 −124 m, MIS 5e +6 m, MIS 11 +10 m. Below −100 m the last two cycles
spend 12 and 16 kyr; MIS 16 and MIS 12 spend ~24 kyr, longer than the plan's ~10 kyr because the
anchors are sparse there (the harness bound is 25 kyr, with 15 kyr for the LGM).

**Relative sea level.** `TerrainGenerator.relativeSeaLevel(y)` = eustatic + `upliftSinceM(y)`, the
plain's uplift since that date. **Rebuilt 2026-10-19 to cover the whole window** (§5b below). Before
that it was `LOOK.plainUplift` (0.3 m/kyr) × min(age, `plainUpliftSince` 400 kyr) × (1 − submergence):
the cap and the fade-in left 1.0–0.8 Ma at eustatic, so the early coast never breathed and the
north-west plain was dry at every sea level. Its results were LGM −114 m, MIS 6 −82 m, MIS 3 −37 m,
MIS 12 0 m, MIS 5e +43 m, MIS 11 +130 m.

**The shelf.** `_bakeShelf`, run once per generate right after `_smoothCoast`, rebuilds the western
sea floor as a metres profile instead of free noise: inner shelf 8.7 m/km to 50 m (~0.5°), outer shelf
3.0 m/km in the north steepening to 4.5 m/km in the south (`shelfInnerSlope`, `shelfInnerDepth`,
`shelfOuterSlopeN/S`, over `frameKm` 115). Each cell's floor is solved (`shelfFloorE`, bisection, a
LUT) so that a sea fall equal to its depth lifts it exactly to the waterline. That makes the coast
march across the shelf steadily, with no hold-and-flip. A 10 m two-octave mottle (`shelfMottle`)
keeps the shore from running ruler-straight.

**The coast reference.** On each row the coast is the first column where 85% of the next `span`
cells (≥ 10, 3% of the width) are land, so an offshore islet cluster is shelf, not coast. A median-9
then ±10-row mean smooths the reference, and rows with land at the map edge borrow the nearest row's
coast.

**The shift.** `glacialSeaShift(y)` turns relative sea level into a signed elevation shift: lowstand
`−rsl × seaShelfK` (0.00075/m, matched to the floor solve), highstand `−rsl × seaLandK` (0.0016/m).
It is attenuated above `glacialSeaCeil`, so the ranges never move, and west-gated, so the
trans-range eastern lowland is untouched: full for u ≤ `glacialSeaFullU` 0.36, gone by
`glacialSeaEastU` 0.48. In `_combineGeo` it now applies after the range lift and before the river
carve, so a river keeps its channel across new land.

**Measured coast** (median over the middle rows, map u; the wall shows u 0.163–0.837):

| Date | Relative sea | Coast u |
|---|---:|---:|
| 25.5 ka (LGM) | −114 m | 0.123 (off the wall's west edge) |
| 140 ka (MIS 6) | −82 m | 0.186 |
| 45 ka (MIS 3) | −37 m | 0.255 |
| 450 ka (MIS 12) | 0 m | 0.273 |
| 122 ka (MIS 5e) | +43 m | 0.289 |
| 410 ka (MIS 11) | +130 m | 0.314 |

**The frame edge (§3.5).** As recommended: at the deepest lowstands the visible sea becomes a sand
plain and the coast leaves the wall to the west, for a few seconds of time-lapse.

**Consequences.**

- **River.** The main's mouth is carried offshore to u −0.03 (`riverOffshoreU`), so at every sea
  level it runs to the coast or the map edge. `wPos` is still measured from the authored mouth
  (`_authoredPos` subtracts the extension), so emergence, the strait and the estuary don't move. No
  separate lowstand incision was added; the existing carve rides the shifted land.
- **Estuary** is driven by relative sea level: empty below +5 m, full by +35 m.
- **Dunes** follow the coast through `coastShiftU` (`duneCoastTrack`).
- **Waterline speckle.** The biome-border wobble (0.05) on a gentle shelf scattered islets along the
  shore, so `_seaWobbleFade` fades it to 0 within `wobbleSeaFade` 0.04 of sea level.
- **NE arm.** Once the coast moved, the arm's recession had to be re-measured: `mainArmKeep` 0.625 on
  the un-jittered main position, feather 0.05. The eastern tributary's last reach runs along the arm,
  so `_tribTakesArmCell` gives it back the cells the wider main had won, or the drying arm cut it off
  just above its mouth. (Superseded 2026-10-19: the main and the tributaries are now separate layers,
  unioned, so no hand-over is needed; `TEMANAWA_NATURAL_HISTORY.md` §I step 8.)

**Habitat check (browser, after a soft reset at the date).** At 25.5 ka the exposed shelf carried
145 plants, nearly all open country (tussock, grey scrub, flax, mānuka, kōwhai, cabbage tree, sedge; 4 forest
plants), and its 6 grazers were goose, mōho and Finsch's duck. At 45 ka it carried 29, all open
country. At 122 ka it is drowned (6 plants on the margin). No plant stood on painted water at any
date.

**Harness.** "deep time": the sea-level facts, lowstand durations and a rate bound. "geography":
relative sea level ascends 25.5 → 140 → 45 → 122 → 410 ka, the coast moves inland monotonically
through them, the LGM bares far more than MIS 3, MIS 6 bares more than MIS 12, and the main runs
unbroken from the lowstand sea at 25.5 and 140 ka. "land/water" (b3) catches the NE-arm tributary
cut.

**Not built.** Step 6 copy. The per-cell `U(x)` (one rate stands in). Measured NIWA/LINZ transects
(step 1); the slopes are §2.2's published figures.

---

## 6. Open questions

1. **MIS 4, 6, 12 and 16 depths.** Take them from the stack in step 2; I found no source here for
   MIS 4 specifically.
2. **How far inland the older highstands reached.** The staircase needs a terrace age–height pair or
   two beyond the Tokomaru terrace (Heerdegen & Shepherd 1992 map Waitotaran to Castlecliffian
   benches along the range flank).
3. **Holocene sediment thickness on the shelf.** It decides how much the modern contour overstates
   the LGM coast. NIWA seismic work on the Manawatū–Kāpiti shelf would settle it.

---

## Sources

- Trewick, S. A. & Bland, K. J. 2012. Fire and slice: palaeogeography for biogeography at New
  Zealand's North Island/South Island juncture. *J. R. Soc. NZ* 42(3): 153–183 (`research/`; the
  Fig. 4 panels and the full-text passages supplied 2026-10-19: the travelling wave, the Whanganui
  Basin's emergence, the 120 m LGM contour and its caveats, little connection before ~1 Ma)
- Sloss, C. 2006. The Late Quaternary geomorphology of the Manawatu coastal plain. GSNZ
  Miscellaneous Publication 122B, field trip 1
  ([PDF](https://gsnz.org.nz/assets/Uploads/Shop/Products/GSNZ_annual_conference/MP122_2006_Palmerston_North/MP122B_2006_GSNZ_conference_Palmerston_North_FT1_Manawatu_coastal_plain_geomorph.pdf)):
  Tokomaru terrace, MIS 3 sea levels and dune distance, LGM incision, the Holocene estuaries and the
  ~4 km landward coast
- [NIWA — Currents of change](https://niwa.co.nz/water-atmosphere/vol9-no4-december-2001/currents-change-ocean-flow-changing-world):
  ~120 m LGM fall; Cook and Foveaux land bridges; Cook Strait breached ~16 ka
- Lambeck, K. et al. 2014. Sea level and global ice volumes from the Last Glacial Maximum to the
  Holocene. *PNAS* 111: 15296–15303 ([record](https://sealevel.nasa.gov/publications/204/sea-level-and-global-ice-volumes-from-the-last-glacial-maximum-to-the-holocene))
- Pico, T., Creveling, J. R. & Mitrovica, J. X. 2017. Sea-level records from the U.S. mid-Atlantic
  constrain Laurentide Ice Sheet extent during MIS 3. *Nature Communications* 8: 15612
  ([PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC5459986/)); Weiss et al. 2022 summarising Pico et al.
  2016 ([PDF](https://marine.rutgers.edu/wp-content/uploads/2022/09/Paleoceanog-and-Paleoclimatol-2022-Weiss-Constraints-on-Marine-Isotope-Stage-3-and-5-Sea-Level-From-the-Flooding1.pdf))
- Spratt, R. M. & Lisiecki, L. E. 2016. A Late Pleistocene sea level stack. *Climate of the Past* 12:
  1079–1092 ([article](https://cp.copernicus.org/articles/12/1079/2016/); data: NOAA noaa-ocean-19982)
- Clement, A. J. H., Whitehouse, P. L. & Sloss, C. R. 2016. An examination of spatial variability in
  the timing and magnitude of Holocene relative sea-level changes in the New Zealand archipelago.
  *Quaternary Science Reviews* 131: 73–101 ([record](https://dro.dur.ac.uk/16674))
- Shelf geometry: [NZ J. Geology & Geophysics 1980, Kaipara–Jacksons Head shelf](https://www.tandfonline.com/doi/pdf/10.1080/00288306.1980.10424116);
  [Distribution of surficial sediments, Part B: continental shelf (2018)](https://www.tandfonline.com/doi/full/10.1080/00288306.2018.1523199)
- Uplift and subsidence: Pillans terrace studies and the southern Wanganui Basin work surfaced via
  [Late Pleistocene sea-level oscillations (MIS 10–2), southern Wanganui Basin](https://ref.coastalrestorationtrust.org.nz/documents/late-pleistocene-sea-level-oscillations-mis-10-2-recorded-in-shallow-marine-and-coastal-plain-sediments-of-the-southern/)
  (rates quoted from abstracts; confirm in step 1)
- Isotope–sea-level non-linearity: as summarised in the [MIS 3 review literature](https://pmc.ncbi.nlm.nih.gov/articles/PMC5459986/)

---

## 5b. One sea-level rule for the whole window (2026-10-19)

**Why.** The geology timeline (`exports/terrain_geology_timeline/`) showed the 1.0–0.8 Ma coast
standing still. The north-west plain was dry at every sea level, against both Trewick & Bland Fig. 4D
(its pale band: land at lowstands, marginal-marine at highstands) and the c. 0.88 Ma Waitapu map
(Rees, Palmer & Palmer 2019, Fig. 10: the Feilding and Halcombe highs under inner shelf during the
MIS 22 transgression). The two maps agree: in the early window the plain stood low enough for each
glacial cycle to flood and bare it. The early sea had come from positional stand-ins on fixed clocks
(`seaRise`, the SW strait, the central patch), which ignore sea level.

**What changed.**
- **One land offset for the whole window** (since 2026-10-19 the channels this coast meets also meander; `TEMANAWA_GEOGRAPHY.md` item 11). `relativeSeaLevel(y)` = eustatic + `landOffsetM(y)`, where
  `landOffsetM` = M·tanh(R·age/M):
  - R is `LOOK.plainUplift` (0.3 m/kyr, Pillans 1986's present rate at the coast, quoted by Rees et
    al. 2019), so near the present it is the plain's uplift.
  - M is `LOOK.plainOffsetMax` (70 m), so further back it saturates. The offset is uplift since, net
    of the sediment that kept building the basin's surface up to sea level. Today's plain lowered by
    a million years of uplift never existed.
  - Results:

    | Date | Relative sea |
    |---|---|
    | 1 Ma | +50 m |
    | MIS 23 | +45 m |
    | MIS 22 | −20 m |
    | MIS 21 | +55 m |
    | MIS 16 | −46 m |
    | MIS 15 | +59 m |
    | MIS 12 | −53 m |
    | MIS 11 | +76 m |
    | MIS 6 | −86 m |
    | MIS 5e | +40 m |
    | LGM | −114 m |

  - Every interglacial floods the plain to its inland edge, and every glacial bares it, the later
    ones further.
  - **Two earlier versions failed.** An uplift-since ramp from 800 ka reached +120 m and kept even
    the early glacials +30 m over the whole plain. Measured north of the river, the early coast swung
    only 0.39 ↔ 0.42 of the map width (~4 km), so the run read as a coast steadily expanding west. It
    now swings 0.26 ↔ 0.32 early, with lowstands at 0.24 (MIS 16), 0.23 (MIS 12), 0.14 (MIS 6) and
    0.08 (LGM). Before that, a 400 kyr cap ran the early window at eustatic.
- **Highstands lower the plain** (`_seaShift`). The sea rises over the land surface:
  - Everything below the height the relative sea reaches (`seaLandK` per metre above the waterline)
    drowns, squashed into a shallow floor so the 3/4 relief bake paints no ghost cliffs under the water.
  - The land above that contour drops by the full rise up to `seaHighstandHold` (0.40), so the new shore
    sits at the waterline and climbs inland at the plain's own slope.
  - The drop fades out over `seaHighstandFade` (0.15) on the range flanks, so the ranges never sink.
  - Two earlier rules failed. Attenuating the drop by elevation capped any highstand at ~+60 m of
    flooding. Dropping only the drowned ground (the first §5b build, the same day) left a step the
    height of the whole rise at every highstand shore, drawn as sheer cliffs along the west in every
    interglacial to 410 ka.
- **The stand-ins are retired:** `seaRise` 0.10 → 0 and `seaSWReach` 1.60 → 0, with the central patch
  already off. **The south-half strait is kept** (`southSinkAmt` 1). It is the one term sea level cannot
  produce: T&B's still-subsiding depocentre off Levin–Foxton at ~1 Ma.

**Calibration, honestly stated.**
- The sim's elevations are cartoon units, not metres (`seaLandK` maps 1 m to 0.0016).
- So the onset and rate were set against landmarks, not fitted to measured shorelines:
  - the c. 0.88 Ma transgression floods the Feilding–Halcombe plain;
  - the MIS 22 lowstand bares it;
  - MIS 15 reaches the range foot (the Onepuhi Fossil Beds, ~570 ka, mark the sea's return to the
    eastern margin, Rees et al. 2019);
  - MIS 5e sits on the low plain.
- Still licence:
  - one uniform rate instead of Pillans's map, which rises toward the ranges and the north;
  - the south sink's dates.
- **Not sourced:** the present elevation of the Waitapu Shell Conglomerate. The paper puts it in the
  early transgression of cycle 36 (MIS 22) but doesn't give the elevation, so the rate is not yet tied
  to that deposit's height.

**Harness ("geography"):**
- the uplift ramp (0 today, growing with age, flat before onset);
- the early coast breathing (MIS 23 high, MIS 22 low, MIS 21 high);
- an early highstand above MIS 5e;
- `_seaShift` is monotonic, floods by contour, flattens the drowned ground and leaves the ranges alone;
- integration: west-of-ranges land at the MIS 22 lowstand exceeds the MIS 23 highstand by 15%+, and
  MIS 23 drowns more than MIS 5e.
