# Te Manawa — The prologue: the run opens at 2 Ma

*The run used to open at 1 Ma. It now opens a million years earlier, on the sea strait across the gap,
and a visitor's first three boosts carry the land's assembly: the strait closes, a river crosses the low
land, the ranges start to rise across it. **The river is older than the mountains, and the visitor
watches it happen.** From 1 Ma the run is the old window, unchanged. Planned and built 2026-11-13 on
branch `claude/sound-effects-bird-audio-52bb80`, on top of the geography overhaul merged from
`hud-wall-readability` (`TEMANAWA_PALAEO_ATTRACT.md` §2, "checked against the maps"). The prologue's
climate was rebuilt on the record on 2026-11-17 (§3).*

Reads with `TEMANAWA_PLAN_V3.md` §2–3 (the land, the climate), `TEMANAWA_SECOND_SCREEN.md` (the boost),
`TEMANAWA_PALAEO_ATTRACT.md` (the pre-window land model this plays) and `TEMANAWA_NATURAL_HISTORY.md` §I.
Vocabulary: **the prologue** is 2 Ma → 1 Ma; **the cycles** are 1 Ma → 25.5 ka; **the run** is both.

---

## 0. The brief

- Extend the timeline back somewhat, to show a more dramatic change in the landscape over time.
- Teach that the Manawatū River is older than the mountains.
- A more dynamic and informative terrain sequence, playing out in the sim (not in an attract reel).
- A visitor may sit down for only 6–10 glacial/interglacial cycles: long enough to boost the ecosystem's
  health to full and see the milestone. The sequence has to land inside that.

## 1. The problem, measured

Inside the cycles a boost plays the clock to the next glacial turn (`Climate.nextRegimeBoundary`). There
are 21 turns between 1 Ma and 25.5 ka:

```
969 937 902 859 818 794 764 713 673 617 563 519 481 429 382 342 314 256 188 134 71 ka
```

So a 6–10 boost visit that opened at 1 Ma ended between 794 and 617 ka, with the ranges' uplift at
0.23–0.37 of its full height (0.15 at the opening). The land that visitor saw barely moved. Everything
that made the Manawatū (a sea strait across the axis, its closure, a river on low land, then the ranges)
happened before the window, and was only ever shown in the attract reel that came off the wall on
2026-11-08.

The land model for those dates already existed and had just been checked against Trewick & Bland's
maps (`geoTimeFactors().palaeo`, 4 Ma → 1 Ma). What was missing was a clock, a climate and an
interaction that could play it with the living world on it.

## 2. The design: three boosts of land, then the cycles

The run opens at **2 Ma** (`DeepTime.yearsStart`). "Two million years ago" is a round number a visitor
can hold, the strait is still fully open (`palaeoAxisStrait` 0.88), and there is enough land for the
whole cast (the Ruahine as a broad low shoal, the Tararua as low green hills). 2.4 Ma, the strait's
widest, leaves the Ruahine as scattered sandbanks and too little ground to live on.

| # | The clock rests at | Climate (LR04) | The land (what the wall shows) | Caption |
|--:|---|---|---|---|
| 0 | **2.0 Ma** (the opening) | MIS 76, a weak glacial under the cut: the interglacial regime | Two low lands in a shelf sea; **the sea runs through where the gorge is**. Named: *Manawatū Strait*, *Whanganui Basin*, *Ruataniwha Strait* | A sea strait |
| 1 | **1,582,655 BP** | the turn into MIS 54, glacial | The strait has closed (1.63 Ma): one low land, north to south. No river. *proto-Ruahine Range* | The strait closes |
| 2 | **1,286,020 BP** | the turn out of MIS 40, interglacial | The east has emerged; **a river crosses the low land** (*proto-Manawatū*), uplift 0.10, under the 0.15 the rapid uplift starts from | A river crosses the land |
| 3 | **1.0 Ma** | interglacial | The boost stops 300 years short of **Kidnappers**, which fires: the prologue hands over to the cycles on an eruption, as the run used to open on one | (the eruption's own) |
| 4 | 969 ka | glacial | The cycles: one boost per glacial turn, as before | The ranges start to rise |
| 6 | 902 ka | glacial | | Older than the mountains |

Each of the first three boosts crosses 7–10 of the record's 41-kyr cycles on the way (§3).

A six-boost visit sees every row. A ten-boost visit ends at 794 ka (the Kaukatea eruption at 900 ka takes one of the ten). Nothing inside the cycles changed:
the climate table from 1 Ma, the geology, one boost per turn, the health ledger, the goals.

The intro already crossfades from the present-day map into the opening land. That is now the strongest
frame of the piece: the map names the ranges, the gorge and the river, and the land it dissolves into
has none of them. The intro's card says so before it does.

## 3. The climate in the prologue is the record (LR04)

**The record.** From 2.1 Ma to 1 Ma the climate is the LR04 benthic δ¹⁸O stack (Lisiecki & Raymo 2005):
the 41-kyr world before the Mid-Pleistocene Transition, 26 glacials and 26 interglacials (MIS 79 → 28).
`Climate.ANCHORS` carries one anchor per stage, at the stage's δ¹⁸O extreme inside LR04's own stage
boundaries, smoothstepped between, as the window's table is. The stack and the boundaries are saved
verbatim in `research/lr04/`, and `tools/lr04_prologue.js --write` emits the anchors, the sea anchors and
the stage names between `<lr04:…>` markers in `TeManawa_climate.js` (the harness asserts the file matches).

| | |
|---|---|
| glacial index | `(δ¹⁸O − 3.15) / 1.85`: calibrated so the window's own table reads the same way (MIS 12 ≈ 1, MIS 11, 19, 21 at 0.03–0.19). The regime cut, 0.5, falls at δ¹⁸O ≈ 4.08 ‰ |
| sea level | `−70.4 m/‰ × (δ¹⁸O − 3.23)`: LR04's own range (today 3.23 ‰ at 0 m, the LGM 5.02 ‰ at −126 m). δ¹⁸O also carries deep-water temperature, so this is a scaling, not a sea-level reconstruction. Interglacials +1 to −31 m, glacials −40 to −92 m |
| what it gives | 40 regime turns between 2.0 and 1.0 Ma; 20 glacials cross the cut, one every ~50 kyr on average, because the weak ones (MIS 76, 72, 68, 66, 56) stay under it, as they did |
| before 2.15 Ma | held at the dev sequence's reference state (0.30, −20 m), on which the 4 → 2.4 Ma land was fitted to Trewick & Bland's maps |
| after 1 Ma | the window's table, untouched. It is rounded hard at its start: LR04 has MIS 28–26 between 1014 and 959 ka, and the table joins the record's MIS 28 at 1 Ma and calls that "MIS 25" (§10) |

**A boost crosses several cycles and lands on a real turn** (`DeepTime.nextStop`, `PROLOGUE_STOPS`). Inside
the cycles a boost plays to the next turn; in the prologue that would be ~48 boosts of sea before the
river. So a boost there plays to the first real turn past the next stop (1.62 Ma: the strait has closed
for good; 1.30 Ma: the east has emerged and the river runs; then 1 Ma), **into the climate opposite the
one it was pressed in**, so the boost's lesson holds (a forest plant in the warm, tussock in the cold) and
every landing is a chapter. The console's goal and the HUD's objective read the same function.

**While the land races, the wall shows the cycles' mean** (`Climate.CYCLE_BLUR`, `Climate.TRAVEL.blend`).
Drawn as they are at 25,000 years a second, the cycles would come by every 1.6 s, and the land re-bakes
about once a second, so the coast and the ground would jump between whatever stage each bake caught.
Through a prologue boost (and under the dial or a deep burst above 7,500 yr/s, from 2,500) the land shows
the running mean over one 41-kyr period: index 0.23–0.42 and sea −24 to −50 m on the first leg, where
the record swings 0.10–0.57. The HUD's climate line says **"Ice ages come and go, every 41,000 years"**
instead of naming a regime that turns every second, and the goals hold the regime the clock left in
(`TMGoals.climateNow`), so a leg that crosses ten turns flips the goal's climate once, on landing, as a
turn inside the cycles does. When the clock stops the blur eases out (0.8 s time constant) and the land
**settles on the record**: one re-bake at the exact date, ~5 s after the landing (`Game._morphTick`).
The blur never reaches a decision: the regime boundaries, the stops, the boost's verdict, the ribbon and
the river's courses read the record (`rawIndexAt`, `rawSeaLevelAt`); only what the land shows is blurred.

**The ribbon** draws the record: the prologue's third of the bar is ~25 thin stripes, ~20 px each.

**Until 2026-11-17 this was authored**: one cold spell of ~313 kyr (1.595 → 1.282 Ma) between two warm
stretches, placed to land the boosts, with a faint 41-kyr stripe on the ribbon as an apology. The record
has no such spell, the cold was in an arbitrary place, and it flattened exactly the cycles the Whanganui
Basin, named on the wall, is known for (`MISTAKES.md`). Its stated reason, that real cycles would
flicker, was half right: the problem was the re-bake rate, which the blur answers.

The synthetic 41-kyr sea the dev `P` sequence breathes when its dial crawls (`Climate.PRE_WINDOW_SEA`)
lives before the table, 2.15 Ma. From there the sequence reads the record, and blurs it by the same rate
rule (`Palaeo._setCycleBlur`).

## 4. The clock (`TeManawa_time.js`)

| | |
|---|---|
| `yearsStart` 2,000,000 · `prologueEnd` 1,000,000 | The opening, and where the cycles begin (= `GEO_EPOCHS.upliftFrom`) |
| `prologueShare` 0.3 | The prologue's share of the timeline bar (`timeFrac` / `yearAtFrac`, piecewise linear). Half the run's years in under a third of the bar, so the cycles keep their room and their pins. `yearToX`, `progress()` and the ribbon all read it |
| `tlMaxSeconds` 24 | A boost never plays longer. A leg the ramp covers in time is untouched: every one of the cycles' 21 turns is (the longest, 256 → 188 ka, takes 22.6 s). A longer leg has the whole ramp scaled by one factor (`_tlScale`, ×3.8–5.4 for the prologue's three), so it lands on 24 s |
| `lifeScaleFor` | Life never runs past the time-lapse's own top (×10), however fast the land goes. The cast lives through a 400-kyr leg at the pace it lives through a glacial turn's fastest stretch |
| `prologueGear` 5 · `prologueGearEase` 150 kyr | The time dial and a deep burst run ×5 in the prologue, easing to ×1 as the clock comes up to 1 Ma. The top detent plays the whole run in about 4 minutes (the cycles alone in 3¼, as before) |
| `PROLOGUE_STOPS` [1.62, 1.30 Ma] · `nextStop` | Where a boost lands in the prologue: the first real turn past the next stop, into the other climate (§3) |
| `cycleBlurFrom` 2,500 · `cycleBlurTo` 7,500 yr/s · `cycleBlurEase` 0.8 s | The cycles' blur (§3): 1 through a prologue boost, by the rate under the dial or a deep burst, eased both ways; 0 inside the cycles |
| `CHAPTERS`, `chapterIndexAt` | The land's five chapters and their copy (§5) |

**A window with no prologue is the old clock exactly.** If `yearsStart ≤ prologueEnd` (a debug zoom, the
harness's inert check) the bar is linear, the gear is ×1, and no leg is scaled.

Kidnappers (1 Ma) used to sit on the opening, where it was drawn on the bar's end and never auto-fired.
It is mid-run now: an ordinary pin at 30 % of the bar, fired by the clock crossing it, and the stop a
visitor's third boost runs into.

## 5. What the wall says

- **The names of the time, over the living sim** (`Palaeo.renderEraNames`, drawn after the river names
  while the clock is in the prologue): *Manawatū Strait*, *Whanganui Basin*, *Ruataniwha Strait*, then
  *proto-Ruahine Range*; the river is *proto-Manawatū* while its arm still flows east (≥ 1.25 Ma) and its
  streams are unnamed (`RiverNames._name` reads the land's own date, `T._geoT.age`, so the present-day
  map keeps today's names). They are the attract sequence's labels and windows, with a `play` placement
  where the sim's HUD would cover the sequence's (`TM_PALAEO.LABELS`), and a name the HUD would still
  cover is left off (`InstallHUD.labelKeepOut`): *proto-Tararua Range* does not show in play at 16:9.
  `TM_PALAEO.eraNamesInPlay = false` turns them off.
- **One caption per chapter** (`InstallHUD.renderLandCaption`, `DeepTime.CHAPTERS`): when the clock
  comes to rest in a chapter it has not named yet this run, a title and one line fade into the
  top-centre slot (the eruption caption's format), hold 11 s and fade; time moving on takes them off.
  An eruption's caption has the slot first and the speed readout must have cleared. The attract starts
  the chapters again for a new visitor. `TM_LAND.captions = false` turns them off.

  | Chapter | From | Title | Line |
  |--:|---|---|---|
  | 0 | the opening | A sea strait | The sea runs where the gorge is today. No river yet, and no ranges. |
  | 1 | 1.64 Ma | The strait closes | Low land joins north and south. Still no river, and no ranges. |
  | 2 | 1.40 Ma | A river crosses the land | The young Manawatū is here before the ranges are. |
  | 3 | 1.00 Ma | The ranges start to rise | They rise across the river's path. The river cuts down as fast. |
  | 4 | 910 ka | Older than the mountains | The ranges keep rising, and the river keeps its course through them. |

- **The uplift wedge** on the timeline is the land's own uplift now (`InstallHUD._upliftWedge`,
  sampled once from `geoTimeFactors`), not the bar's progress: all but flat through the prologue, then
  climbing from 1 Ma. The river is on the land before the wedge lifts.
- **The climate line** reads "Ice ages come and go, every 41,000 years" while the land races through
  the prologue's cycles, and "The climate is GLACIAL / INTERGLACIAL" at rest (§3).
- **The climate ribbon** draws the record: the prologue's ~25 cycles as thin stripes.
- **The speed readout** names the prologue's rates (steps to 30,000 years per second).
- **The intro** (`TM_ATTRACT.copy`): "You are about to see this land two million years ago. There is no
  river yet, and no ranges: the sea runs through where the gorge is. Watch the land take shape as ice
  age after ice age sweeps across it." Then, over the land: "The Manawatū, two million years ago". The
  outro is unchanged; it already ends on the river being older than the mountains it crosses.
- **The console** shows the chapter's title on its clock line in the prologue, in place of the MIS
  stage (there is one every ~20 kyr there): `clock.land` on the bus, sent in the prologue only.

## 6. Conflicts with the existing systems, and what was done

| # | System | Conflict | Resolution |
|--:|---|---|---|
| 1 | `Climate` | No anchors before 1 Ma, so no regime turn for a boost to play to | The record, LR04, one anchor per stage (§3). Held at the old reference state before 2.15 Ma, so the 4 → 2.4 Ma land is unchanged. (2026-11-13 to 11-17: an authored swing) |
| 2 | `DeepTime` time-lapse | 5,000 yr/s tops out at 75 kyr in 24 s; a 405-kyr leg would take 86 s | `tlMaxSeconds`: the ramp scaled per leg. The cycles' legs all scale ×1 (harness-asserted) |
| 3 | Life's clock | Life rode the land's rate (`rate / yrPerSec`): ×54 on a prologue leg | `lifeScaleFor` caps it at the time-lapse's top (×10) |
| 4 | The timeline bar | Linear in years, the prologue would take half the bar and crush the cycles' pins | `timeFrac` / `yearAtFrac`, `prologueShare`; the ribbon is baked through `yearAtFrac` |
| 5 | Kidnappers at the opening | `_erLabels` drew it on the bar's end; the auto-fire seeded past it; tests called 1 Ma "the first event, nothing older" | Nothing special-cased it by date, only by `≥ yearsStart`, so it became an ordinary mid-run eruption with no code change. The harness asserts it fires on crossing |
| 6 | The dev `P` sequence's landing | It lands on its last keyframe, 1 Ma, which "MUST be the window's start"; `resetEcosystem()` now puts the clock at 2 Ma over a land baked at 1 Ma | `Palaeo._land` seeks the clock to the landing year after the reset. The sequence overlaps the run's first three boosts and lands past them; it is a dev tool |
| 7 | The far edge at the opening | A Ruahine shoal standing only in the far margin's rows painted as a sand-coloured bar hanging from the top of the wall (the relief bake carries the far row's colour up to the buffer edge). The window's far rows are all land, so it never showed; the attract holds the opening frame all day | In the far margin, before the window, each column is rooted in the margin's inner row: land over a sea root takes the sea's floor, sea over a land root takes the land's level, so the coast runs straight up through the margin (`_applyGeoToHeightMap`, under `palaeoOn`) |
| 8 | Era names vs the HUD | The sequence drew them on a bare frame; the sim's HUD stands over the lower third and the top corners | `play` placements, and a keep-out test against `InstallHUD.labelKeepOut` |
| 9 | `RiverNames` | Modern names would letter the prologue's streams | `_name` reads the land's date in the prologue (as it reads `Palaeo.active` in the sequence) |
| 10 | The harness | Its sections assumed the boot land was the 1 Ma land (a river, a plain, hills) | `homeLand()` (the opening, what ships) and `cyclesLand()` (1 Ma) at the top of `tools/bootcheck.js`; the sections that need ground stage it and put the opening back |
| 11 | A boost per turn (2026-11-17) | With the record's cycles, the next turn is ~20 kyr away: ~48 boosts of sea before the river | `DeepTime.nextStop`: in the prologue, the turn past the next stop, into the other climate. The bus, the console's goal, the HUD's objective and the chained-boost check all read it |
| 12 | The morph's re-bake rate | Cycles every 1.6 s under a re-bake every ~1.1 s: the coast and ground would alias between stages | The blur (§3) while the land races; the blur off at rest |
| 13 | The land at a landing | It was baked in the blur, up to a morph step before the date, so it showed the mean, not the stage the visitor landed on | The settle: one re-bake at the exact date once the blur is gone (`Game._blurBakedAt`); the ordinary drift bake waits for it at rest, so a landing costs one re-bake, not two |
| 14 | The goals and the climate line | The record's regime turns ~10 times in a prologue leg: the goal line would redraw and the line flip every second | The goals hold the regime while the clock races the prologue (`TMGoals.climateNow`, `_racingPrologue`); the line says the 41-kyr world |
| 15 | The river's courses | `TerrainGenerator.terminations()` scanned from 1.1 Ma, so the record's three terminations before 1 Ma would have renumbered every course of the cycles, and the prologue's ~20 would swing the young channel every second | The scan starts at the window's opening (`GEO_EPOCHS.upliftFrom`), on the record: the cycles' courses are unchanged and the prologue's river keeps one course |

Not changed, deliberately: the cycles' climate table, `GEO_EPOCHS`, the boost's judging and seeding,
the health ledger, the goals' book, the milestones, the outro, the audio.

## 7. Files

`TeManawa_climate.js` (the prologue's LR04 anchors, `rawIndexAt`/`rawSeaLevelAt`, `CYCLE_BLUR`, `TRAVEL`) ·
`research/lr04/` + `tools/lr04_prologue.js` (the record and its emitter) · `TeManawa_time.js` (the
opening, `prologue*`, `PROLOGUE_STOPS`, `nextStop`, `cycleBlur*`, `tlMaxSeconds`, `tlScaleFor`, `gearAt`,
`lifeScaleFor`, `timeFrac`, `yearAtFrac`, `CHAPTERS`) · `TeManawa_goals.js` (`climateNow`) ·
`TeManawa_sketch.js` (the settle) · `TeManawa_hud.js` (`TM_LAND`, the land caption, the climate line,
the uplift wedge, the ribbon's axis, the speed steps) · `TeManawa_palaeo.js` (`renderEraNames`, `riverNameAt`, `play` placements, the landing's seek) ·
`TeManawa_rivernames.js` (`_name`) · `TeManawa_UI.js` (the two new draws) · `TeManawa_terrain.js` (the
far-edge rooting, the terminations' scan, the meander key) · `TeManawa_attract.js` (copy) · `TeManawa_bus.js` + `secondscreen/app.js`
(`clock.land`) · `tools/bootcheck.js` ("prologue", and the sections that assumed a 1 Ma opening).

## 8. Harness (`tools/bootcheck.js`, "prologue")

The clock's shape and that it is inert with no prologue; the climate is LR04's, stage by stage, as the
tool emits it, with the 41-kyr rhythm, held before 2.15 Ma and the window's table untouched; where a
boost lands (`nextStop`) and that inside the cycles it is still the next turn; the blur (it hides the
cycles, never reaches the cycles or a decision, and the clock drives it); river before uplift in the factors; every cycles leg on the unscaled ramp and the
prologue's three in `tlMaxSeconds`; the chapters at the stops; the land at the stops (the gap sea, then
land; the land growing at every stop; the far margin rooted); **three real boosts from the opening**
through the bus, the clock, the morph driver and the sim: the goals' climate held through each leg, the
climate line's 41-kyr text mid-leg, the settle (one re-bake, at the date, on the record), and Kidnappers
held and then fired;
the names by date; the caption's state machine; the wedge and the speed steps. Elsewhere: Kidnappers
auto-fires on crossing; a deep burst and the dial are geared in the prologue and unchanged in the cycles;
the river names at 2 Ma (none), 1.28 Ma (proto-Manawatū) and 1 Ma.

**2026-11-17 (the record).** Four full runs of the final code: three clean; one failed a single river check
("each tributary has drawn together at the window end"), the random-land flake that also failed on the
untouched branch on 11-13. It is not this change: the cycles' climate (every 250 years from 1 Ma) and the
river's 12 terminations are bit-identical before and after. Earlier the same day the full run caught three
real slips in the rebuild (a stale goal climate after a seek, a check left with the dial running, the
chained-boost check walking the old way), all fixed.

**Where the harness stood (2026-11-13).** "prologue" and "palaeo attract" pass on every run of the final
code. Of three full runs, two were clean and one failed a single river-geometry check. Those checks
("geography", "land/water discipline") flake on the harness's random land: the untouched branch head
failed one in 2 of 3 runs, the plain merge in 2 of 4. One of them, *at 1000 ka every tributary is joined*
(always the Mangahao), failed 3 of 7 runs on this tree and none of the 7 baseline runs, which is not
enough to call but is worth knowing. It is not the land's history: in Chrome the 1 Ma heightmap, water
map, tributary ends and river lines are bit-identical whether 1 Ma is reached from 2 Ma, 1.3 Ma or
300 ka. Unexplained; re-run before treating a river check as real (`TEMANAWA_PLAN_V3.md` §13).

## 9. Checked in the browser (Chrome, 1920×1080, 2026-11-13; the record, 2026-11-17)

Frames were driven by hand at a fixed 60 fps step with the bus heartbeat pumped (the preview pane was
hidden, which throttles the real loop to ~1 fps), so the sequence and its states are verified and
**real-time smoothness is not**: watch one prologue leg on the wall.

- The opening: 75–88 plants and 24–26 ground birds on the two lands, the flyers and the harrier over
  them; the caption and three names clear of the HUD.
- (2026-11-13, the authored climate) Boost 1 → 1,594,856 BP, cold, the land closed; boost 2 → 1,281,776 BP, warm, the river named
  *proto-Manawatū*, ~350 plants spreading onto the new east; boost 3 → 1,000,300 BP, Kidnappers fires
  with its caption and serves the post-eruption goal; then 969 ka and 902 ka with their captions. No
  errors, the morph within one step of the clock at every landing.
- The attract (the opening land, no UI) and the intro (the present-day map into the 2 Ma land).
- **2026-11-17, the record:** boost 1 → 1,582,655 BP (MIS 54); boost 2 → 1,286,020 BP; boost 3 →
  1,000,300 BP and Kidnappers; then 969 and 902 ka. Through the first leg the land showed index 0.23–0.42
  and sea −24 to −50 m while the record swung 0.10–0.57, the line read the 41-kyr text, and the goals'
  climate flipped once, on landing; ~5 s later the land settled on the record (−59 m), with one re-bake
  after each landing. No errors. The frames in `exports/prologue/` were retaken on this run.
- Seven frames of that run, HUD and cast included, are in `exports/prologue/` (its README says how they
  were taken).
- **Known compromise:** at the opening and the first stop the top of the land carries a pale box about
  100 px tall. It is the far edge's own treatment (the far rows eased to plains, carried up to the
  buffer's edge) meeting a coast; inside the cycles the far rows are land from side to side and it reads
  as haze. The far margin's columns are now rooted, so its sides are straight rather than ragged bars.
- A morph's first slice is one long frame (130–330 ms here, unsliced, known: `BUILD_V3.md`). A prologue
  leg re-bakes back to back for its whole 24 s, where most glacial turns are over in 13–18 s, so a visitor
  meets that hitch more often in the first three boosts than anywhere else.

## 10. Open decisions (co-design)

- **The opening date.** 2 Ma is authored. 1.8 Ma would open on more land and a strait half shut;
  2.4 Ma on the strait's widest and very little ground.
- **The captions' copy**, and whether the wall wants them at all (the attract sequence's notes were cut
  on 2026-11-05; these are shorter and only ever one at a time).
- **The ranges' rise is still slow where visitors are.** `geoTimeFactors` eases the uplift in
  (`pow(t, 1.5)`): 0.15 at 1 Ma, 0.23 at 794 ka (a tenth boost). A steady rate (`pow` 1, which the
  ~1.3 mm/yr figure supports as well) gives 0.33 there. It is one number, but it moves every frame of
  the cycles (the habitat bands, the `fromYearsBP` goal gates, the snapshots), so it was left alone.
- **The Tararua sits under the HUD.** At the opening the lasting land is in the bottom third, behind the
  year, the goal and the timeline. It reads, but the forest is there.
- **The milestone.** A visitor who fills the health bar sees the thriving land and the bird counts; the
  card could carry one line of the land's story.
- **The Mangakino eruptions** of the prologue (Ngaroma ~1.55 Ma, Ongatiti ~1.21 Ma) crossed the line
  of the ranges (`TEMANAWA_PALAEO_ATTRACT.md` §9). None is shown: each would stop a boost short and cost
  the visitor a turn.
- **The cycles' first 100 kyr are rounded.** The window's table (1 Ma → 350 ka) predates the record's
  rebuild: it calls 1 Ma "MIS 25" (LR04: the end of MIS 28) and folds LR04's MIS 28–24 into two stages.
  Rebuilding it on LR04 would move every turn of the cycles a visitor boosts through, and every goal and
  test tuned on them; it is the same tool's job if wanted.
- **Stage resolution.** The prologue anchors each stage at its extreme and smoothsteps between; the
  stack's within-stage wiggles (a double peak, MIS 56's two crests) are not drawn. The same rule as the
  window's table.

## Sources

As `TEMANAWA_PALAEO_ATTRACT.md`: Trewick & Bland 2012 (Fig. 4A–D; pp. 160–171; "the river was already
flowing across the site of the gorge to the west coast before uplift occurred", p. 171); Rees, Palmer &
Palmer 2017/2018 (the strait's closure from ~1.63 Ma; the c. 1 Ma east–west drainage). The climate:
Lisiecki, L. E. & Raymo, M. E. 2005. A Pliocene–Pleistocene stack of 57 globally distributed benthic
δ¹⁸O records. *Paleoceanography* 20, PA1003. doi:10.1029/2004PA001071. The stack and its stage
boundaries as published at lorraine-lisiecki.com, retrieved 2026-11-17 (`research/lr04/`).
