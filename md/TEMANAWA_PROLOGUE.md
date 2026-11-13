# Te Manawa — The prologue: the run opens at 2 Ma

*The run used to open at 1 Ma. It now opens a million years earlier, on the sea strait across the gap,
and a visitor's first three boosts carry the land's assembly: the strait closes, a river crosses the low
land, the ranges start to rise across it. **The river is older than the mountains, and the visitor
watches it happen.** From 1 Ma the run is the old window, unchanged. Planned and built 2026-11-13 on
branch `claude/sound-effects-bird-audio-52bb80`, on top of the geography overhaul merged from
`hud-wall-readability` (`TEMANAWA_PALAEO_ATTRACT.md` §2, "checked against the maps").*

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

| # | The clock rests at | Climate | The land (what the wall shows) | Caption |
|--:|---|---|---|---|
| 0 | **2.0 Ma** (the opening) | warm | Two low lands in a shelf sea; **the sea runs through where the gorge is**. Named: *Manawatū Strait*, *Whanganui Basin*, *Ruataniwha Strait* | A sea strait |
| 1 | **≈ 1.595 Ma** | cold | The strait has closed (1.63 Ma): one low land, north to south. No river. *proto-Ruahine Range* | The strait closes |
| 2 | **≈ 1.282 Ma** | warm | The east has emerged; **a river crosses the low land** (*proto-Manawatū*), uplift 0.10, under the 0.15 the rapid uplift starts from | A river crosses the land |
| 3 | **1.0 Ma** | warm | The boost stops 300 years short of **Kidnappers**, which fires: the prologue hands over to the cycles on an eruption, as the run used to open on one | (the eruption's own) |
| 4 | 969 ka | cold | The cycles: one boost per glacial turn, as before | The ranges start to rise |
| 6 | 902 ka | cold | | Older than the mountains |

A six-boost visit sees every row. A ten-boost visit ends at 794 ka (the Kaukatea eruption at 900 ka takes one of the ten). Nothing inside the cycles changed:
the climate table from 1 Ma, the geology, one boost per turn, the health ledger, the goals.

The intro already crossfades from the present-day map into the opening land. That is now the strongest
frame of the piece: the map names the ranges, the gorge and the river, and the land it dissolves into
has none of them. The intro's card says so before it does.

## 3. The climate in the prologue is authored, not LR04

The real record from 2 Ma to 1 Ma is about 24 low-amplitude 41-kyr cycles. The wall cannot play them. A
boost crosses 300–400 kyr of the prologue in 24 seconds; eight coast-and-colour swings in that time is
a flicker, the reason the attract sequence held its climate still (`TEMANAWA_PALAEO_ATTRACT.md` §1). And
a boost per 41-kyr turn would put twenty-four boosts of sea in front of the river.

So `Climate.ANCHORS` and `SEA_ANCHORS` carry **one long cold swing** through the prologue, standing in
for the cold halves of those cycles, on dates chosen so each boost lands on a chapter of the land:

| yearsBP | glacial index | sea (m) | |
|---|---|---|---|
| 2,000,000 | 0.30 | −20 | the opening, warm. The old first anchor's values, so every date before 2 Ma reads as it always did |
| 1,700,000 | 0.30 | −20 | |
| 1,520,000 | 0.62 | −70 | crosses the regime cut ≈ 1.595 Ma: the strait has just closed |
| 1,340,000 | 0.62 | −70 | |
| 1,200,000 | 0.30 | −20 | crosses ≈ 1.282 Ma: the river is on the land |
| 1,000,000 | 0.30 | −20 | MIS 25, unchanged: the join is exact |

The amplitude is the 41-kyr world's (0.30–0.62, as MIS 25/24). **This is the cartoon, not the survey**
(`TEMANAWA_PLAN_V3.md` §0), and the timeline says so: the prologue's bands on the climate ribbon are
shot through with a faint stripe of the other colour every 41 kyr (`InstallHUD.RIBBON_GRAIN`), so a band
reads as one climate to boost in, and the bar does not claim a 300-kyr ice age.

The synthetic 41-kyr sea the dev `P` sequence breathes when its dial crawls (`Climate.PRE_WINDOW_SEA`)
now lives before the table's first anchor, 2 Ma. Between 2 Ma and 1 Ma that sequence reads the authored
swing like everything else.

## 4. The clock (`TeManawa_time.js`)

| | |
|---|---|
| `yearsStart` 2,000,000 · `prologueEnd` 1,000,000 | The opening, and where the cycles begin (= `GEO_EPOCHS.upliftFrom`) |
| `prologueShare` 0.3 | The prologue's share of the timeline bar (`timeFrac` / `yearAtFrac`, piecewise linear). Half the run's years in under a third of the bar, so the cycles keep their room and their pins. `yearToX`, `progress()` and the ribbon all read it |
| `tlMaxSeconds` 24 | A boost never plays longer. A leg the ramp covers in time is untouched: every one of the cycles' 21 turns is (the longest, 256 → 188 ka, takes 22.6 s). A longer leg has the whole ramp scaled by one factor (`_tlScale`, ×3.8–5.4 for the prologue's three), so it lands on 24 s |
| `lifeScaleFor` | Life never runs past the time-lapse's own top (×10), however fast the land goes. The cast lives through a 400-kyr leg at the pace it lives through a glacial turn's fastest stretch |
| `prologueGear` 5 · `prologueGearEase` 150 kyr | The time dial and a deep burst run ×5 in the prologue, easing to ×1 as the clock comes up to 1 Ma. The top detent plays the whole run in about 4 minutes (the cycles alone in 3¼, as before) |
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
- **The speed readout** names the prologue's rates (steps to 30,000 years per second).
- **The intro** (`TM_ATTRACT.copy`): "You are about to see this land two million years ago. There is no
  river yet, and no ranges: the sea runs through where the gorge is. Watch the land take shape, then ice
  age after ice age sweep across it." Then, over the land: "The Manawatū, two million years ago". The
  outro is unchanged; it already ends on the river being older than the mountains it crosses.
- **The console** shows the chapter's title on its clock line in the prologue, where there is no MIS
  stage to name (`clock.land` on the bus).

## 6. Conflicts with the existing systems, and what was done

| # | System | Conflict | Resolution |
|--:|---|---|---|
| 1 | `Climate` | No anchors before 1 Ma, so no regime turn for a boost to play to | The authored swing (§3). First-anchor values kept, so dates ≥ 2 Ma are bit-identical |
| 2 | `DeepTime` time-lapse | 5,000 yr/s tops out at 75 kyr in 24 s; a 405-kyr leg would take 86 s | `tlMaxSeconds`: the ramp scaled per leg. The cycles' legs all scale ×1 (harness-asserted) |
| 3 | Life's clock | Life rode the land's rate (`rate / yrPerSec`): ×54 on a prologue leg | `lifeScaleFor` caps it at the time-lapse's top (×10) |
| 4 | The timeline bar | Linear in years, the prologue would take half the bar and crush the cycles' pins | `timeFrac` / `yearAtFrac`, `prologueShare`; the ribbon is baked through `yearAtFrac` |
| 5 | Kidnappers at the opening | `_erLabels` drew it on the bar's end; the auto-fire seeded past it; tests called 1 Ma "the first event, nothing older" | Nothing special-cased it by date, only by `≥ yearsStart`, so it became an ordinary mid-run eruption with no code change. The harness asserts it fires on crossing |
| 6 | The dev `P` sequence's landing | It lands on its last keyframe, 1 Ma, which "MUST be the window's start"; `resetEcosystem()` now puts the clock at 2 Ma over a land baked at 1 Ma | `Palaeo._land` seeks the clock to the landing year after the reset. The sequence overlaps the run's first three boosts and lands past them; it is a dev tool |
| 7 | The far edge at the opening | A Ruahine shoal standing only in the far margin's rows painted as a sand-coloured bar hanging from the top of the wall (the relief bake carries the far row's colour up to the buffer edge). The window's far rows are all land, so it never showed; the attract holds the opening frame all day | In the far margin, before the window, each column is rooted in the margin's inner row: land over a sea root takes the sea's floor, sea over a land root takes the land's level, so the coast runs straight up through the margin (`_applyGeoToHeightMap`, under `palaeoOn`) |
| 8 | Era names vs the HUD | The sequence drew them on a bare frame; the sim's HUD stands over the lower third and the top corners | `play` placements, and a keep-out test against `InstallHUD.labelKeepOut` |
| 9 | `RiverNames` | Modern names would letter the prologue's streams | `_name` reads the land's date in the prologue (as it reads `Palaeo.active` in the sequence) |
| 10 | The harness | Its sections assumed the boot land was the 1 Ma land (a river, a plain, hills) | `homeLand()` (the opening, what ships) and `cyclesLand()` (1 Ma) at the top of `tools/bootcheck.js`; the sections that need ground stage it and put the opening back |

Not changed, deliberately: the cycles' climate table, `GEO_EPOCHS`, the boost's judging and seeding,
the health ledger, the goals, the milestones, the outro, the audio.

## 7. Files

`TeManawa_climate.js` (the prologue's anchors) · `TeManawa_time.js` (the opening, `prologue*`,
`tlMaxSeconds`, `tlScaleFor`, `gearAt`, `lifeScaleFor`, `timeFrac`, `yearAtFrac`, `CHAPTERS`) ·
`TeManawa_hud.js` (`TM_LAND`, the land caption, the uplift wedge, the ribbon's axis and grain, the speed
steps) · `TeManawa_palaeo.js` (`renderEraNames`, `riverNameAt`, `play` placements, the landing's seek) ·
`TeManawa_rivernames.js` (`_name`) · `TeManawa_UI.js` (the two new draws) · `TeManawa_terrain.js` (the
far-edge rooting) · `TeManawa_attract.js` (copy) · `TeManawa_bus.js` + `secondscreen/app.js`
(`clock.land`) · `tools/bootcheck.js` ("prologue", and the sections that assumed a 1 Ma opening).

## 8. Harness (`tools/bootcheck.js`, "prologue")

The clock's shape and that it is inert with no prologue; the climate's swing, its amplitude and where it
lands a boost; river before uplift in the factors; every cycles leg on the unscaled ramp and the
prologue's three in `tlMaxSeconds`; the chapters at the stops; the land at the stops (the gap sea, then
land; the land growing at every stop; the far margin rooted); **three real boosts from the opening**
through the bus, the clock, the morph driver and the sim, ending with Kidnappers held and then fired;
the names by date; the caption's state machine; the wedge and the speed steps. Elsewhere: Kidnappers
auto-fires on crossing; a deep burst and the dial are geared in the prologue and unchanged in the cycles;
the river names at 2 Ma (none), 1.28 Ma (proto-Manawatū) and 1 Ma.

**Where the harness stands (2026-11-13).** "prologue" and "palaeo attract" pass on every run of the final
code. Of three full runs, two were clean and one failed a single river-geometry check. Those checks
("geography", "land/water discipline") flake on the harness's random land: the untouched branch head
failed one in 2 of 3 runs, the plain merge in 2 of 4. One of them, *at 1000 ka every tributary is joined*
(always the Mangahao), failed 3 of 7 runs on this tree and none of the 7 baseline runs, which is not
enough to call but is worth knowing. It is not the land's history: in Chrome the 1 Ma heightmap, water
map, tributary ends and river lines are bit-identical whether 1 Ma is reached from 2 Ma, 1.3 Ma or
300 ka. Unexplained; re-run before treating a river check as real (`TEMANAWA_PLAN_V3.md` §13).

## 9. Checked in the browser (Chrome, 1920×1080, 2026-11-13)

Frames were driven by hand at a fixed 60 fps step with the bus heartbeat pumped (the preview pane was
hidden, which throttles the real loop to ~1 fps), so the sequence and its states are verified and
**real-time smoothness is not**: watch one prologue leg on the wall.

- The opening: 75–88 plants and 24–26 ground birds on the two lands, the flyers and the harrier over
  them; the caption and three names clear of the HUD.
- Boost 1 → 1,594,856 BP, cold, the land closed; boost 2 → 1,281,776 BP, warm, the river named
  *proto-Manawatū*, ~350 plants spreading onto the new east; boost 3 → 1,000,300 BP, Kidnappers fires
  with its caption and serves the post-eruption goal; then 969 ka and 902 ka with their captions. No
  errors, the morph within one step of the clock at every landing.
- The attract (the opening land, no UI) and the intro (the present-day map into the 2 Ma land).
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
- **The prologue's climate** (§3): one cold swing. Two would add a boost and a chapter; none would open
  the run on three warm boosts and lose the tussock lesson until 969 ka.

## Sources

As `TEMANAWA_PALAEO_ATTRACT.md`: Trewick & Bland 2012 (Fig. 4A–D; pp. 160–171; "the river was already
flowing across the site of the gorge to the west coast before uplift occurred", p. 171); Rees, Palmer &
Palmer 2017/2018 (the strait's closure from ~1.63 Ma; the c. 1 Ma east–west drainage); Lisiecki & Raymo
2005 for the 41-kyr world the prologue's climate stands in for.
