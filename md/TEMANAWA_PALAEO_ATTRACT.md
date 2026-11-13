# Te Manawa — The land before the window: the palaeogeography attract sequence

> **Off the wall since 2026-11-08.** The idle attract is now the live 1 Ma land with no UI, a press plays
> an intro over the present-day map, and the end of the window an outro (`TeManawa_attract.js`,
> `CLAUDE.md`). This sequence is kept, working and tested, behind the dev `P` key only. What follows
> records it as built.

*The sim's window (1 Ma → 25.5 ka) barely moves the land: the ranges rise, the river sharpens, the coast
breathes with the glacial cycle, the habitats turn over. The emergence that made the Manawatū — a deep
sea basin, a low finger of basement across it, a strait that opened and closed over that finger, then
the ranges — happens BEFORE the window. This document plans and records the sequence that shows it:
an animated land-only pre-roll from 4 Ma to 1 Ma, played as the idle attract and at every timeline
reset, with no flora or fauna rendered and the names on the map those of the time.*

Reads with `TEMANAWA_PLAN_V3.md` §2 (the land), `TEMANAWA_GEOGRAPHY.md` (the morph), `TEMANAWA_COAST_PLAN.md`
(the breathing coast) and `TEMANAWA_NATURAL_HISTORY.md` §I (the seaway came first). Where this document
and `TEMANAWA_PLAN_V3.md` disagree, the plan wins. Built on branch `claude/tender-faraday-fslxuy`.

---

## 0. The brief

- Show the Manawatū emerging from a predominantly marine basin with fingers of land crossing it,
  as an animated sequence of the land changing over time. No flora, no fauna.
- Play it as the idle attract, and when the timeline resets (end-of-window).
- The river and region names shown must be the names for that date (Trewick & Bland 2012).
- Identify every conflict with the existing systems. Plan, then build, on a branch.

**Governing principle, unchanged** (`TEMANAWA_PLAN_V3.md` §0): *a cartoon seen from above, not a survey.*
The sequence is the same cartoon, run backwards past its own opening and then forward again.

**One land model.** The sequence is NOT a second map. It drives the existing terrain generator with
dates older than the window, through the same `geoTimeFactors(yearsBP)` → `_combineGeo` path the
morph already uses, extended with dated pre-window anchors. The 1 Ma state the sequence lands on IS
the sim's opening state, so the hand-off is continuous and nothing new can diverge from the terrain
(`CLAUDE.md`: do not add a second table; `MISTAKES.md`: one rule for the whole window, dated against a
source, checked against the map as a whole).

---

## 1. The source: what the frame was, when (Trewick & Bland 2012, Fig. 4A–D and text)

The map frame spans Foxton (west edge) → the gorge (`LOOK.straitGorgeU` ≈ 0.505) → Woodville/Dannevirke
(east edge), ≈ 115 km across (`LOOK.frameKm`). Everything below is read INSIDE that frame.

| Date | NZ stage | West and north (the plain) | The axis (Ruahine–Tararua) | The gap (gorge) | East (Wairarapa/Hawke's Bay side) | Source |
|---|---|---|---|---|---|---|
| **4.0 Ma** | Wo–Wp (Opoitian–Waipipian) | **Wanganui Basin, deep marine** (200–600 m), the "Tangahoe pull-down" from c. 4.8 Ma — but off Whanganui, north-west of the frame. **Inside the frame Fig. 4A has about half of it low coastal plain** around the axis, widest at the gorge's latitude, from about Feilding to just east of the gorge; the Young-1 drillhole puts the sea on the basement west of the gorge only from ~3.6 Ma (p. 170). Shelf west of that coast | **An emergent finger of basement, at low elevation**; the lasting land is the **Tararua** side (tied to Wellington and Marlborough), the Ruahine low plain | **No seaway across the gorge area** | Low plain east of the Ruahine; **deep water in the south-east**, beyond the shelf — the SW end of the **Ruataniwha Strait** | Fig. 4A; p. 160 "Four million years ago"; registered on the frame 2026-11-13 (`research/palaeogeography/`) |
| **~3.3 Ma** | late Wp | shelf | low land + shoals | **First marine breach** across the gorge area (coarse Waipipian rocks at the southern end of the Ruahine) | Ruataniwha Strait | p. 170 |
| **3.0 Ma** | Wp–Wm boundary | Wanganui deep marine; **Manawatū region mostly shelf (0–200 m)** | "A narrow peninsula of low-lying land… in the region of the modern Tararua Range" / "a finger of low-lying land and shallow shoals… over the location of the Ruahine Range" | **A narrow seaway — the Manawatū Strait** | "Shelfal environments also covered much of the Wairarapa–Hawke's Bay area as part of the narrow but laterally extensive Ruataniwha Strait" | Fig. 4B; p. 163 |
| **3.0–2.4 Ma** | Wm (Mangapanian) | shelf | land, being planed | **Closed**: "the Manawatu Gorge area was subject to erosion, and was therefore probably land during the Mangapanian" | Ruataniwha Strait | p. 165 |
| **2.4 Ma** | Wm–Wn boundary | eastern Wanganui Basin, shelf | **"The Ruahine Range area was under the ocean, probably in the form of a narrow, shallow marine sill"**; north of the strait "an area of low-lying shoals and islands"; the Tararua a low southern landmass | **The Manawatū Strait at its most extensive**: "a seaway across the location of the modern southern Ruahine and northern Tararua ranges at shallow shelf depths… separated northern and southern land masses". Narrow: "< 20 km wide" | Ruataniwha Strait (central and southern Hawke's Bay) | Fig. 4C; pp. 165, 170 |
| **1.63 Ma** | base Wc (Castlecliffian) | shelf | low land | **Closed for good** (marine conditions across the axis 3–1.6 Ma; closure under way from ~1.63 Ma) | — | Rees, Palmer & Palmer 2017 (via `TEMANAWA_NATURAL_HISTORY.md` §I) |
| **~1.5 Ma** | Wc | "Most of the Wanganui–Manawatu area was at shelf to marginal-marine water depths"; the depocentre steps 50 km south | some uplift initiated | — | **Mount Bruce uplift closes the Ruataniwha Strait at its southern end** and raises the drainage divide the Manawatū system grows north of | p. 166 |
| **1.0 Ma** | mid-Wc | "low-lying land and marginal marine estuaries"; depocentre off Levin–Foxton; the western plain "probable land and marginal marine during lowstand" | **Rapid uplift in their current form commences**; the proto-Ruahine Range | the river, turned west, crossing the site of the gorge; a lake ponds on the Wellington Fault | Hawke's Bay largely land | Fig. 4D; pp. 166–167 |

The river: "At some point the proto-Manawatu River drained to the east, but due to progressive uplift
of the eastern margin of Hawke's Bay during the Late Pliocene it was diverted towards the west… the
river was already flowing across the site of the gorge to the west coast before uplift occurred" (p. 171).
The sim already carries this as the NE-arm recession (`GEO_EPOCHS.mainArm*`, 1.25 → 1.0 Ma, Rees et al.
2018's c. 1 Ma east–west drainage). The sequence shows the arm present (east-flowing) before 1.25 Ma.

Not in the frame, so not on the wall: the **Kuripapango Strait** (early–mid Pliocene, across the modern
Kaweka Range, closed by 3 Ma — Fig. 4A/B, p. 160), the **Mount Bruce divide** (SE, off-frame), the
Whanganui-City depocentre of 2.4 Ma (north).

**Climate.** The sequence holds the climate at the window's first anchor (MIS 25). Three million years
of 41-kyr cycles played in a minute would be ~70 coast swings — a flicker, and a photosensitivity
failure — and the pre-window land change is tectonic, not eustatic. `Climate.*At()` already clamp to
their first anchor for older dates, so this costs nothing and is the intended reading.

---

## 2. What the frame shows, epoch by epoch (the terms that draw it)

All terms are dated anchors in `TerrainGenerator.GEO_EPOCHS` (pure, keyed to absolute yearsBP) and are
**exactly their window values at ≤ 1 Ma** — the harness asserts it. The marine terms are positional
(the land itself was different, not just the sea higher; see `MISTAKES.md`, "the early coast ran on
stand-ins": keep a positional term only for what the physical driver cannot produce — here the whole
pre-window basin).

| Term | What it does in the frame | Dated anchors | Window value (≤ 1 Ma) |
|---|---|---|---|
| **basin, west** `basinW` | drowns the plain to the mottled sea floor everywhere outside the axis core — the range footprints and the gorge saddle between them (mass ≥ `LOOK.palaeoAxisCore`), their spread margin shelving under — the Wanganui Basin's shelf; smoothstep off | 1 at ≥ 1.65 Ma → 0 at 1.0 Ma | 0 |
| **the drainage** `river` | the main stem, the tributary fans **and the drowned-valley estuary with its infill** (which back up the river valley) all scale by this: before it there is no defined river on the low finger; the channel appears as a sandy bed, then a water thread, as the land emerges. T&B p. 166: the Mount Bruce uplift (~1.5 Ma) "initiated a drainage divide… that resulted in the Manawatu River system developing to the north of the divide" | 0 at ≥ 1.6 Ma → 1 at 1.25 Ma | 1 |
| **the finger's width** `narrow` | early (≥ 3 Ma) the finger is a strip along each range's crest line and the neck across the gap — T&B Fig. 4A's thin fingers of exposed basement (`LOOK.palaeoFingerNarrow` scales the mass by spine closeness); it broadens to the whole footprint by 1.65 Ma as the uplift starts | 1 at ≥ 3.0 Ma → 0 at 1.65 Ma | 0 |
| **the neck** (`LOOK.palaeoBridge*`) | the land across the gap is a broad, LOW neck on the straight line from the Tararua's crest tip to the Ruahine's (`TerrainGenerator._palaeoNeck`: where each spine axis leaves its polygon), `palaeoBridgeW` either side, its shores meandered (`palaeoBridgeWobble`), held under a ceiling just above the waterline (`palaeoNeckE` ± `palaeoNeckAmp`) across its whole dry width, shore included, off the fingers' own core (`palaeoBridgeFlat`). No river crosses it: the drainage is 0 while it stands. (Until 2026-11-02 it kept the saddle's base height, ~0.28, between two drowned flanks: a causeway. Until 2026-11-03 it rode the main stem's line, so the gap's land took the channel's dog-leg and a lobe where the river bends south past the gorge. Until the same day's second pass it was levelled to the finger's floor, 0.15, by a weight that faded out before the shore drowned: a rim of raw relief along the south shore, painted as a pale sheer face) | with `narrow` | 0 |
| **the finger** `basinW`/`basinE` × core | inside the core the land is cut toward lowland (`LOOK.palaeoAxisLow`/`LowE`, by how far the pre-window uplift still has to go — "albeit at low elevation") and stands at least `LOOK.palaeoAxisFloorE` (the one pre-window term that raises: the southern Tararua's footprint lies on today's shelf and was land then). Both fade to 0 at the opening | with the basin | 0 |
| **basin, east** `basinE` | east of `LOOK.palaeoBasinEastU` (the Ruataniwha Strait's SW end) the shelf is a **front**: a ceiling at the sea floor east of it, climbing off the land west of it (shaped like the strait's, below), that sweeps east from the axis (`LOOK.palaeoEastFront*`: from u 0.42 to past the edge, tilted NNE–SSW like the ranges, meandered), so the lower North Island fills out eastward toward the 1 Ma land; closes with Mount Bruce. (Until 2026-11-02 a uniform fade 1.65 → 1.3 Ma: the whole east surfaced at once, as spiky islets) | 1 at ≥ 1.75 Ma → 0 at 1.3 Ma | 0 |
| **south strait** `southSink` (existing) | the depocentre off Levin–Foxton; drains 1.0 → 0.5 Ma | **rise moved back**: 4.6 → 4.0 Ma (was 1.1 → 1.0 Ma), so the south is sea throughout the pre-roll | identical (1 at 1 Ma, 0 by 0.5 Ma) |
| **axis strait** `axisStrait` | the seaway across the gap, NOT range-protected, measured from the gap's centre (the neck's midpoint) **in km** — v scaled by the map's aspect — so it takes "the southern Ruahine and northern Tararua" alike (p. 165): a **ceiling** over the ground, applied last — the shelf floor inside, climbing its meandered shore (`palaeoStraitFeather`, `palaeoStraitWobble`) to `LOOK.palaeoShoreE` (lowland), then off the land over `palaeoShoreRise` without the wobble, so the land beside it is planed to a coastal plain that climbs gently inland. Its reach (`LOOK.palaeoStraitHalfW` 0.075, the land from ~0.10 ≈ 11 km) barely follows the factor (`palaeoStraitMinW` 0.85 of it at the first breach, all of it at 2.4 Ma): the registered maps end the Ruahine ~10 km north of the gorge and the Tararua near Palmerston North at 3 Ma and 2.4 Ma alike. Below `palaeoStraitShoal` (0.3) of the factor the floor rises instead, so the strait closes as a planed strip of low land and the ceiling then lifts off. (Until 2026-11-02 a lerp toward the floor: at partial strength every high cell stood proud of the water, and the closing strait painted as a column of spiky towers. Until 2026-11-13 a north–south column 0.085 either side of the gorge whose width scaled with the factor: a thread at 3 Ma, with the Ruahine running on south past the gorge's latitude) | 0 → 0.45 (3.35–3.2 Ma, the narrow seaway) → 0.45 (3.0) → 0 (2.9–2.55, closed) → 1 (2.4) → 1 (2.1) → 0 (1.63) | 0 |
| **the apron** `apron` (2026-11-13) | the 4 Ma **low coastal plain** round the axis (`LOOK.palaeoApron*`): its west and east coasts are `[v, u]` anchor lines read off Fig. 4A registered on the frame; inside them a FLOOR (a beach at the shore, `palaeoApronE`, climbing `palaeoApronRise` inland to pale lowland grass) over the drowned basin, and a CEILING (`palaeoApronCap`) over what stood on it (the Ruahine finger), so the coast is the floor's smooth contour, never a partial lerp. As it drowns both coasts sweep in onto the axis line (`palaeoApronAxis`), so the sea onlaps toward the finger; the neck's low ceiling gives way inside it | 1 at ≥ 3.6 Ma → 0 at 3.3 Ma (Young-1) | 0 |
| **the Tararua's hills** `hills` (2026-11-13) | the lasting land is the Tararua side (Fig. 4A–C): on its range-only core (`palaeoHillsMass`) south of the gap (`palaeoHillsV`) the ground is floored at `palaeoHillsE` rising to the crest line (`palaeoHillsCrest`) and cut toward `palaeoHillsLowE` instead of the axis's lowland: low green hills, forest on the crest. The Ruahine stays low (the apron's cap, then the thin finger and the shoals) | 1 at ≥ 1.65 Ma → 0 at 1.15 Ma | 0 |
| **the sea floor** `shelf` × `deep` (2026-11-13) | the pre-window sea is **shelf** (< 200 m; "shelf to marginal-marine" at 1.5 Ma): every drowning term's floor sits at `LOOK.palaeoShelfE` (0.084), which the posterized sea paints in its light tone; east of `palaeoDeepLine` while `deep` holds it stays the window's dark floor (0.02): the 4 Ma deep water off the south-east. The strait shares the shelf floor, never darker than the sea round it. Hands back to the window's own sea (the depocentre off Levin–Foxton) by the opening | `shelf` 1 at ≥ 1.4 Ma → 0 at 1.0 Ma · `deep` 1 at ≥ 3.6 Ma → 0 at 3.0 Ma | 0 |
| **Ruahine shoals** `axisStrait` × `LOOK.palaeoShoal` | north of the strait the Ruahine footprint is pulled to the waterline with the cached wobble, so it breaks into "low-lying shoals and islands" (full at 2.4 Ma, partial at 3.0) | same curve | 0 |
| **pre-window uplift** | the axis is a low basement finger: `uplift` 0.03 at 4 Ma → 0.07 at 1.5 Ma → 0.15 at 1.0 Ma (= `upliftStart`) | smoothstep between anchors | unchanged |
| river | the NE arm present and the flow east before 1.25 Ma (existing `mainArm`); fans spread (existing); tributaries cut where the sea drowns them (existing `_tribSeaCut`) | existing | unchanged |

The sea/river read: the paint pass classifies **sea first by elevation** (`_paintGridPass1`: any cell
below the waterline is true sea, drawn flat with shimmer) and only then consults the river mask, so a
strait drowned below 0.10 reads as sea, not as a wide river. No classify change.

**Checked against the maps (2026-11-13).** `research/palaeogeography/slices.json` holds Fig. 4A–D
registered to today's coast (~1 km). Rasterised onto the map's u/v with the gorge as the anchor (u 0.505,
v 0.51; 115 km across, the same scale down) and scored inside the wall's frame (u 0.163–0.837, v
0.11–0.78) against the heightmap on one page load. Land/sea agreement went from 54% to 90% at 4 Ma. At 3 Ma
and 2.4 Ma it stayed at 92–96% (most of the frame is sea either way), now with the strait in the paper's place. Deep/shelf agreement among sea
cells went from 8–25% to 91–97%. The 3 Ma tips: the Ruahine ends at v 0.42 (paper 0.38), the Tararua
begins at v 0.59 (paper 0.63). The 1.5 Ma map is an interpolation and 1 Ma is the sim's own opening;
neither was moved. Frames: `exports/palaeo_attract/`.

---

## 3. The sequence

```
 idle (180 s) / end-of-window
   │
   ▼
 DIP  — fade to dark (≥ 500 ms) · every 12th: full reseed init() under the dark (heartbeat stamped)
   │     first bake: morph to 4.0 Ma, ALL FOUR season buffers, sliced at the sequence budget
   ▼
 PLAY — the sequence clock runs the keyframes; DeepTime stays parked
   │     4.0 Ma  hold ─ travel ─ 3.0 Ma hold ─ travel ─ 2.4 Ma hold ─ travel ─ 1.6 Ma hold ─ travel ─ 1.0 Ma hold
   │     a morph re-bake is issued whenever: no job in flight · the last swap's crossfade has ENDED ·
   │     the clock has moved ≥ minYears (or sits on a hold the bake has not reached)
   │     the last bake (to 1.0 Ma) is ALL FOUR buffers again, so the landing is consistent
   ▼
 LAND — the Kidnappers eruption (TM_PALAEO.eruptLanding): the ground rumbles and the ash flash builds
         over the eruption charge (TM_TIME.erLongPressMs, 4.5 s); the ash cloud opens coverLeadMs before
         its crest; under its opaque backdrop resetEcosystem() (the cast spawns on the 1 Ma land,
         DeepTime.reset → 1 Ma, Kiosk bookkeeping); the cloud and the falling flash then clear over the
         living world (drawn by the HUD) · the sim resumes, geology paused as always until a boost
         (eruptLanding false: the older fade to dark · the same landing · fade up)
```

- **The dial is the sequence's while it runs** (2026-11-02): the time dial's keys, the wheel and the
  console's dial message turn a detent −6 … 6 (`TM_PALAEO.dialSpeeds`: ×0.25 … ×8 of `kyrPerSec`,
  0 = paused, negative = **reverse**; push = ×1 forward). Holds run in sequence time, so ×4 shortens
  them and a pause never ends one; in reverse the clock returns to the keyframe it left and holds
  there, and the oldest date holds. The caption shows the reading (`>> × 2`, `paused`, `<< × 0.5`).
  Default pacing: 15 kyr/s with 10 / 8 / 10 / 8 / 8 s holds ≈ 4 min at ×1.
- **The warp (authoring, 2026-11-06)**: in a run started by `P` (`reason === 'manual'`, so `?dev=1`), the
  first turn of the dial sets `Palaeo._warp` and hands it the clock (`_warpClock`): no holds and no landing
  of its own. Warped forward it parks at 1 Ma, on the landing bake, with the caption reading
  `any key lands`, and goes back as far as 4 Ma. Before this, a warp ran off the end into the eruption, where
  the wheel did nothing, and then onto `DeepTime`'s dial, which started the sim's fast-forward. Any
  other key is still the skip, which lands it. A `P` run left alone plays and lands like a wall run, and a
  wall run never warps: nobody is there to land it.
- **The sea's breath before the window**: slowed to ≤ `seaBreathBelow` (5 kyr/s — a 41-kyr cycle
  every ≥ 8 s) the pre-window sea breathes a synthetic pre-MPT cycle (`Climate.PRE_WINDOW_SEA`:
  41 kyr, −70 … 0 m, phased to join the window's first anchor; gone by `seaBreathOff` 10 kyr/s, where
  a cycle every 4 s would flicker). It costs nothing extra — the same re-bakes read it through
  `relativeSeaLevel` — and it shows where there is a coast to move: on the plain as the basin shoals
  (1.65 → 1 Ma); earlier the plain is shelf under the positional basin, which the eustatic shift
  cannot bare. The window never reads it (the scale is 0 there; harness-asserted).
- **Any other input skips**: a key, a click, or a console intent runs the remaining legs at
  `TM_PALAEO.skipMult` with no holds, then lands normally (never a cut).
- **The landing is an eruption** (2026-11-02): the window opens on Kidnappers (~1.0 Ma, Mangakino;
  `DeepTime`'s first event), with the same charge, flash, shake and 42-frame ash cloud the eruption
  button and the timeline eruptions use (`g._tmPalaeoErAt` drives the HUD's `renderAshFlash` /
  `eruptionShakeOffset` like `_tmAttractErAt`). Only the spectacle: the eruption's ash is not applied to the
  fresh world, which opens calm as before. A key or console intent during it is presence only.
- **Transitions are the kiosk's own idiom** (the dark crossfade, `Kiosk.renderCrossfade`), the dips
  ≥ 500 ms; every terrain swap is the existing ≥ 500 ms crossfade and the next one waits for it. Inside
  the photosensitivity budget (`TEMANAWA_BUILD_V3.md` §3).
- **Cost**: nothing lives during the sequence, so the morph gets a larger per-frame slice
  (`TM_PALAEO.budgetMs`); a re-bake is ~0.3–0.6 s at 60 fps, paced to the fade → ~1 bake/s → ~60 kyr a
  step at the default rate. Phase 0 of a morph (the sim heightMap) is one slice as it is in the dial
  fast-forward — a short hitch per step under a crossfade.
- The HUD's timeline, year, goal and climate line are replaced by one caption: the date (`~ 2,400,000
  years ago`, quantised to 50 kyr while travelling so the text cache sees few strings). The date stands
  alone: the one-line notes that sat under it were cut on 2026-11-05 (§8).

---

## 4. The names on the map, by date

Drawn in the river-name lettering (white capitals, dark halo, the same glyph cache), world-anchored and
projected, fading in and out with their windows. Only names Trewick & Bland use; the axis is unnamed
until 1.6 Ma, then takes their "proto-" convention (Fig. 4D: *proto-Ruahine Range*).

| Name | Shown | Where | Surface check | Basis |
|---|---|---|---|---|
| **WHANGANUI BASIN** | 4.0 → 1.05 Ma | the north-western sea (u 0.23, v 0.27: off the 4 Ma plain, toward the basin's deep water off Whanganui; was u 0.27, v 0.42 until 2026-11-13, which the apron put on land) | sea | Fig. 4A–D "Wanganui Basin"; spelling per the project's visitor text (`TM_PALAEO.spelling`) |
| **RUATANIWHA STRAIT** | 4.0 → 1.55 Ma | the eastern lowland | sea | Fig. 4A–C, p. 163 |
| **MANAWATŪ STRAIT** | 3.35 → 2.95 Ma (narrow) and 2.5 → 1.65 Ma (widest) | the gap | sea | Fig. 4B/4C, pp. 163–165 |
| **PROTO-RUAHINE RANGE** | 1.6 → 1.0 Ma | the Ruahine footprint | land | Fig. 4D |
| **PROTO-TARARUA RANGE** | 1.6 → 1.0 Ma | the Tararua footprint | land | the same convention (4D names only the Ruahine) |
| **PROTO-MANAWATŪ** (along the channel) | while the arm still flows east (≥ 1.25 Ma) and the channel is river water | the main stem | river | p. 171 "proto-Manawatu River" |
| **MANAWATŪ** (along the channel) | < 1.25 Ma | the main stem | river | Fig. 4D "Manawatu River" |

**The island inset (2026-11-13).** In the top-right corner the sequence draws the lower North Island at the
date (`TeManawa_island.js`, `TM_ISLAND.palaeoDates`: 4, 3, 2.4, 1.5 and 1 Ma from `research/palaeogeography/`),
the frame boxed on it and one line under it (Wellington part of a southern land; the strait cutting the land in
two; one island with no Cook Strait). Each map holds on its date and crossfades across the middle fifth of
each leg. The export stills carry it too.

The modern tributary names (Pohangina, Ōroua…) are **not** lettered during the sequence: those streams
exist in the model before 1 Ma (as the spread fans), but no source names them for the time. The
same holds inside the window until the fans close: `RiverNames._name` letters a tributary only once
`terrain._geoT.tribSpread` ≤ `TM_RIVER_NAMES.tribNameSpread` (≈ 395 ka).

---

## 5. Conflicts with existing systems, and what was done about each

| # | System | Conflict | Resolution |
|---|---|---|---|
| 1 | `DeepTime` | The window clamps every clock op (`seekTo`, `yearToX`, `label`, `progress`) to 1 Ma → 25.5 ka; a date of 4 Ma cannot be represented, and the timeline would draw its playhead off-left | The sequence keeps **its own clock** (`Palaeo.yearsBP`); DeepTime stays parked; the HUD's visitor pieces are replaced by the caption while it runs |
| 2 | `TerrainGenerator.geoTimeFactors` | Every ramp clamps older dates to the 1 Ma state, so the land at 4 Ma was the land at 1 Ma | Dated pre-window anchors (§2), pure, ≤ 1 Ma values bit-identical (harness) |
| 3 | `GEO_EPOCHS.southSink*` | The south strait's rise was authored 1.1 → 1.0 Ma "so the run opens fully sunk"; before 1.1 Ma it read as land — the depocentre would vanish going back in time | Rise moved to 4.6 → 4.0 Ma; the hold and drain unchanged |
| 4 | `_rangeProtect` + the `MISTAKES.md` rule "marine terms never cover the range footprints unless a source says the axis was under water at that date" | The strait across the axis is exactly that | The axis term is the one unprotected marine term, dated to Trewick & Bland's own words ("the Ruahine Range area was under the ocean"), and the harness asserts the gap is land at 2.75 Ma and at every date ≤ 1.63 Ma |
| 5 | `Climate` | No anchors before 1 Ma | Held (the clamp); deliberate — §1 |
| 6 | `Kiosk.tick` idle path | Staged as a volcanic event: rumble + ash cloud, the reset at the crest. An eruption before the TVZ existed (~2 Ma) would be the wrong cover for a 4 Ma opening | Idle and end-of-window go to `Palaeo.begin`; the eruption staging is kept behind `TM_PALAEO.enabled = false`; the **error-recovery path keeps the synchronous reset** (a recovery must not depend on a healthy frame loop). Since 2026-11-02 a recovery first **aborts a running sequence** (`Kiosk.recover` → `Palaeo._abort`, which also zeroes the sea breath), so the recovery's reset never runs under the sequence's veil |
| 7 | `Kiosk.resetToAttract` | Idle landed on a **random eruption checkpoint** ("a different chapter each time") | The sequence always lands at 1 Ma (its own end); the eruption button's tap/hold navigation still reaches every chapter; the reseed-every-12th survives, done at the sequence start |
| 8 | `RiverNames` | Letters the authored names along any river water, so 3 Ma streams would carry Pohangina / Ōroua | `RiverNames._name` consults `Palaeo.riverName(rv)` while active: tributaries unnamed, the main *proto-Manawatū* / *Manawatū* by date |
| 9 | `TMBus` (second screen) | Intents during the sequence (boost / storm / deep / eruption / dial) would act on the parked old world and be thrown away at the landing; the clock telemetry is DeepTime's | Every intent counts as presence and **skips**; `clock` telemetry carries `palaeo: { active, yearsBP, label }`; the console shows the sequence date and a "the land is forming" pill |
| 10 | `TerrainGenerator._swapSeasonBuffer` | A buffer swap that lands while a crossfade is still running is a **hard cut** (`!this._morphFade` gate) | The sequence never issues a morph while a fade is live; `_morphCuts` counts cuts (the harness asserts 0 across a whole sequence) |
| 11 | The visible-pair season bake | Only the current + next phase buffers are re-baked per morph; the other two would hold 4 Ma land into the sim | The first and last bakes of the sequence re-bake **all four** (`allPhases`) |
| 12 | `WaterLayer` | Eels and fish are fauna; the sea shimmer is water | Swimmers are not drawn during the sequence (decals are); `reconcile` after each morph; a full `build` at the landing |
| 13 | `GLBatch` DOM-stack mode | The GL canvas keeps its last quads unless a batch span runs | `begin()`/`composite()` still run with nothing enqueued → cleared each frame |
| 14 | `Game.init()` reseed (several seconds, synchronous) | Every 12th reset reseeds; mid-sequence it would freeze the morph | Done under the opening dip with `Kiosk.beat()` stamped (as `refitTerrain` does) |
| 15 | Input lockdown (keys 1–5) and `Kiosk.noteInput` | A press during the sequence would fire a button on the old world | All input while active → `noteInput` + `Palaeo.skip()`, swallowed, except the time dial, which drives the sequence. The dev keys `D`/`SHIFT+D`/`P` pass **only with `?dev=1`**: since the wall's key lockdown (2026-11-02, `Kiosk.keyAllowed`) they are presence on the wall like any other key, so they skip |
| 16 | `Game.update` end-of-window | Called `resetToAttract` every frame once `hasEnded()` | While active, `Game.update` yields to `Palaeo.update`; `begin()` refuses re-entry |
| 17 | `Game._bakedYearsBP` / `_morphTick` | After the landing the sim would see a stale baked year and start a morph | The sequence records each bake on the game; the landing leaves `_bakedYearsBP = 1 Ma = DeepTime.yearsBP` |
| 18 | Spelling | Trewick & Bland write *Wanganui Basin*; the project's visitor text and the blog write *Whanganui* | `TM_PALAEO.spelling` (`'Whanganui'` default); flagged for co-design (§8) |
| 19 | Frame | Kuripapango Strait, Mount Bruce divide, the 2.4 Ma depocentre are off-frame | Not labelled; in this document only |
| 20 | `RiverNames` hysteresis (`holdLayouts`) | A name a re-layout cannot place stays one more layout before it fades — right on the open screen, wrong across a cover: the modern tributary names carried through the whole 4 Ma hold (seen in the first live run) | `RiverNames.clear()` under both dips (the sequence's first bake and the landing), so each era's first layout starts fresh; never called on the open screen |
| 21 | The hold timer | A hold counted from the clock's *arrival* at a keyframe; on a slow bake (the harness, a cold kiosk) it was spent still morphing and the dated map was never on screen for its hold | A hold is *pending* until the keyframe's own re-bake lands (`_holdPending` → `_armHold` from `_onBaked`); a skip waits for nothing |
| 23 | `_nsEdgeFalloff` (the far-edge ease) | It eased the top rows *two-way* toward plains, raising a low far row to meet the relief crop — right on the window's land, but in the sequence it lifted the drowned basin into a strip of false land with a ruler-straight coast along the top | Raises **land** only (fading in over the first 0.05 above the waterline); sea stays sea. The down-easing of truncated ranges, which is what stops the vertical smear, is untouched |
| 24 | Class boundaries in the thin finger | Each branch on which range or saddle "owns" a cell (`rSad`) left a one-cell step at the polygon edge (the Ruahine's southern tip near the gorge, 2.4–2.0 Ma) — the de-cliff pass caps it at 0.12/cell, and the relief bake paints that as a striped tower | The finger is built from continuous fields only: the range-only mass thinned to its crest lines, the neck across the gap, the full footprint fading in as it broadens; the max of the three. Harness: no one-cell step > 0.1 inside the core off the strait at any pre-window date |
| 22 | The gorge saddle (`LOOK.gorgeSaddle`) | A crest-weighted "finger" (range mass × spine closeness) drowned the saddle between the two ranges at every pre-window date, cutting the finger where Trewick & Bland say there was no seaway at 4 Ma | The finger is the range *footprints* (mass ≥ `LOOK.palaeoAxisCore`, a wide shelving band — the polygons and the saddle), with the spread margin shelving under; the harness asserts the gap is land at 4, 2.75 and 1.6 Ma |
| 25 | The marine terms over high ground (2026-11-02) | Each lowered the ground by a fraction toward the sea floor; at partial strength high cells stood proud as islets with cliff faces — the closing strait painted as a column of spiky towers, and the early bridge across the gap kept the saddle's base height between drowned flanks, a causeway with the river along its crest | The strait and the east front are **ceilings** applied last (floor → `LOOK.palaeoShoreE` over a wobbled shore, then off the land over `palaeoShoreRise` un-wobbled); the strait shoals shut below `palaeoStraitShoal`; the isthmus is levelled to the finger's floor with the river cut into it. Harness: the isthmus check (bed under low banks), the east-front sweep, and the existing no-step check. `MISTAKES.md`, "A half-drowned shelf painted as spikes" |
| 26 | The landing (2026-11-02) | A dip to dark, then the living world: the swap from the sequence's last frame to the 1 Ma window read as a hard cut | The Kidnappers eruption covers it (`TM_PALAEO.eruptLanding`): the charge's rumble and flash (`g._tmPalaeoErAt`, read by `renderAshFlash` / `eruptionShakeOffset`), the cloud opened `coverLeadMs` before the crest, the swap under its opaque backdrop, the cloud and falling flash left to the HUD. The cloud frames warm from the sequence's own tick too, so a sequence started soon after boot still lands covered |
| 27 | The river and the estuary/infill (the "Opiki cycle") | Both ride the authored river line and ran at every pre-window date: a thin channel across the 4 Ma finger and, worse, the estuary at *full* strength — the relative sea level holds the opening's +50 m and the clamped climate reads as a 40-kyr stillstand, so it drowned a wide valley along the main stem and filled it to swamp and swamp-forest: a "riverbank" in the seaway between the proto-ranges | The dated drainage term (`GEO_EPOCHS.palaeoRiver`, §2) scales the main mask, the tributary masks and the estuary strength at the carve, the classify and the paint (one factor at all three, so they cannot disagree). Harness: no river px and no filled estuary at 4, 3, 2.4 Ma; a river at 1.3 Ma; the term is 1 inside the window |
| 28 | The neck across the gap (2026-11-03) | The early finger's land bridge was the main stem's line widened (`wMDist` < `palaeoBridgeW`, inside the gorge window): with no river drawn on it the gap's land still took the channel's shape — a dog-leg from the Tararua's tip under the Ruahine and a cliffed lobe south where the river bends past the gorge, 4–2.75 Ma | The neck is the straight segment from one range's crest tip to the other's (`_palaeoNeck`, cached as `palaeoNeck`), levelled only off the fingers' own core. Harness: the centre line between the fingers is low land with no sea; the river's line off the neck, in the gap, is sea |
| 29 | The neck's sheer face (2026-11-03) | Still a sheer, striped face where the neck met the Ruahine and along its south shore at 4 Ma. Two causes: the crest closeness `rSp` was the spine of the range with the MOST mass, so it flipped from the Ruahine's crest (0.68) to the Tararua's (0.16) in one cell where their spread margins meet in the gap — a step in the thin finger, and so in the neck's level; and the level faded out with the neck's core before its shore drowned, leaving a rim of raw relief | `rSp` is max(mass × spine) over the ranges ÷ the range mass, continuous; the neck is a ceiling just above the waterline (`palaeoNeckE`, where `bakeLift` is ~0.02) held over all its dry width. Harness: the thin finger's mass has no one-cell step > 0.12 in the gap at 4 Ma; ≤ 2% of the neck's dry cells stand above its ceiling. Both mutation-tested |

---

## 6. Build steps (file by file)

1. **`TeManawa_terrain.js`** — `GEO_EPOCHS` pre-window anchors; `geoTimeFactors` → `palaeo: { basinW,
   basinE, axis }` + the pre-window uplift ramp; `LOOK.palaeo*` knobs; `_applyGeoToHeightMap` computes
   `basinSub` / `axisSub` / `shoalSub` per cell and passes them to `_combineGeo` as guarded trailing
   arguments (omitted → no-op, so every older caller and the harness's short calls are untouched);
   `_morphCuts`.
2. **`TeManawa_palaeo.js`** (new; after `rivernames.js`, before `debug.js`) — `TM_PALAEO` tunables,
   `Palaeo` (state machine, clock, pacing, labels, caption, `riverName`, `skip`).
3. **`TeManawa_kiosk.js`** — idle → `Palaeo.begin('idle')`; `takeReseed()`; `landAttract(g, reason)`.
4. **`TeManawa_sketch.js`** — `Game.update` / `render` branches; input swallow + skip; `P` authoring key;
   end-of-window → `Palaeo.begin`.
5. **`TeManawa_rivernames.js`** — the `_name` hook.
6. **`TeManawa_bus.js`** — intents → skip; `clock` telemetry. **`secondscreen/app.js`** — the readout.
7. **`TeManawa_debug.js`** — KIOSK rows (state, year, bakes, cuts).
8. **`index.html`** — the script tag and its load-order comment.
9. **`tools/bootcheck.js`** — the "palaeo attract" section. **`tools/export_frames.js`** —
   `TM_EXPORT.palaeo()`.
10. Docs: this file, `md/README.md`, `CLAUDE.md`, `TEMANAWA_PLAN_V3.md` §13, `TEMANAWA_NATURAL_HISTORY.md` §I.

---

## 7. Harness (tools/bootcheck.js, "palaeo attract")

- Factor invariants: `southSink` 1 at 1 Ma and 0 at 500 ka; `uplift` 0.15 at 1 Ma; `palaeo.axis` 0 at
  every date ≤ 1.63 Ma; `palaeo.basinW` 0 at ≤ 1 Ma, `basinE` 0 at ≤ 1.3 Ma; monotone basin fade.
- Land states: 4.0 Ma ≥ 70 % of the frame is sea and the axis cores are land; 2.4 Ma the gap column is
  sea, the Ruahine core is mostly water, the Tararua core is land; 2.75 Ma and 1.6 Ma the gap is land;
  1.0 Ma byte-identical to a morph made before the change (the sequence's landing is the opening).
- The sequence: `begin('idle')` → frames → lands; DeepTime at 1 Ma; a fresh cast; all four buffers
  baked at 1 Ma; `_morphCuts` 0; every swap ≥ `morphFadeMs` apart; `skip()` lands within a bound.
- Labels: each name's anchor sits on its surface at its window's dates; river names during the
  sequence contain no tributary names; `proto-Manawatū` ≥ 1.25 Ma, `Manawatū` below.
- Paths: the idle tick starts the sequence when enabled and stages the eruption when disabled; the
  error path never starts a sequence; a bus intent while active skips.

---

## 8. Open decisions (co-design)

- ~~*Whanganui* or *Wanganui*~~ — **Whanganui** (decided 2026-11-02).
- ~~The one-line notes under the date~~ — **cut** (2026-11-05): the epoch notes and the Kidnappers note are gone, code and copy.
- The hold lengths and the rate (`TM_PALAEO.keyframes`, `kyrPerSec`): slowed to ~4 min on 2026-11-02;
  the dial now lets a reviewer pace it live.
- ~~The climate's swings before 1 Ma~~ — built as the sea's breath (§3), synthetic, shown only when the
  dial crawls. Authored anchors for 1.6–1.0 Ma would replace the synthetic cycle if wanted.
- **Eruptions before the window** (see the note in the as-built section): the Mangakino ignimbrites
  of 1.6–1.0 Ma crossed the line of the developing ranges; none is shown yet. Worth an ash beat at
  ~1.55 Ma (Ngaroma) and the window's own Kidnappers at 1 Ma if the sequence is to carry them.

---

## 9. As built (2026-11-01, branch `claude/tender-faraday-fslxuy`)

**Files.** `TeManawa_palaeo.js` (new: `TM_PALAEO`, `Palaeo`); `TeManawa_terrain.js` (`GEO_EPOCHS.palaeo*`,
`southSink*` rise moved back, `_anchorCurve`, `geoTimeFactors().palaeo` + the pre-window uplift,
`PALAEO_NONE`, `LOOK.palaeo*`, the basin / strait / shoal / axis-low terms in `_applyGeoToHeightMap` →
`_combineGeo` trailing args, `_morphCuts` / `_lastSwapMs`); `TeManawa_kiosk.js` (`_palaeoOn`,
`takeReseed`, `_clearRunState`, `landAttract`; the idle tick); `TeManawa_sketch.js` (`Game.update` /
`render` branches, the veil in `draw()`, input swallow + skip, `P`, end-of-window); `TeManawa_rivernames.js`
(`_name` hook, `clear()`, a null-name guard mid-job); `TeManawa_bus.js` (intents → skip; `clock.palaeo`);
`secondscreen/app.js` (the readout); `TeManawa_debug.js` (KIOSK rows); `index.html`; `tools/bootcheck.js`
("palaeo attract"); `tools/export_frames.js` (`palaeo()`, `{ palaeo: true }`, a 1080-space buffer).

**The land, as the real build draws it** (`exports/palaeo_attract/`, 11 stills from the browser build;
regenerate with `TM_EXPORT.run(TM_EXPORT.palaeo(), 'palaeo_attract/palaeo', { palaeo: true })`):
4 Ma all sea but a low green finger along the axis, continuous across the gorge, the proto-Manawatū on
it; 3 Ma a thread of sea at the gap and the Ruahine shelving; 2.75 Ma closed; 2.4 Ma the strip of sea
across the gap with the northern Tararua under it and the Ruahine a scatter of sandbanks; 1.63 Ma
closed; 1.5–1.3 Ma the east land, the west still sea, the proto-ranges named; 1 Ma the sim's own opening
(byte-for-byte the same terms: every `palaeo` term is the frozen zero object there).

**The sequence, measured.** Harness (white-noise base, 1× bake, harness pacing 240 kyr/s): a whole run
lands in ~1,800 frames with 15 re-bakes, every keyframe baked on its hold, visible swaps ≥ 1,440 ms
apart, 0 crossfade cuts, a fresh 1 Ma world, all four buffers. Headless Chromium (software GL, ~15 fps,
the wall's pacing): 23 re-bakes, 0 cuts, no page or kiosk errors, landed in ~95 s (the holds wait for
their bakes, so a slow machine stretches the run rather than skipping its maps). The ~60 kyr/s travel
rate gives ~67 s at 60 fps.

**Supervolcanic eruptions reaching the region, 4–1 Ma** (Trewick & Bland 2012, pp. 165–167; the
project's `TEMANAWA_DEEPTIME_ECOLOGY_PLAN.md` for the window's two). The Taupō Volcanic Zone did not
exist before c. 2 Ma; the arc then sat at the Tauranga–Kaimai centre (Coromandel), too far to reach the
Manawatū with anything but fine ash. Rhyolitic volcanism at the **Mangakino Volcanic Centre** began by
c. 1.7 Ma, and its ignimbrites are found in the Kidnappers Group of Hawke's Bay — "which must have been
able to flow across the position of the developing mountains" (p. 166, Fig. 4D's dashed paths) — so the
caldera-forming Mangakino eruptions of **~1.6–1.0 Ma** (Ngaroma c. 1.55 Ma, Ongatiti c. 1.21 Ma, Ahuroa
c. 1.18 Ma, then Kidnappers/Rocky Hill c. 1.0 Ma, the last already the window's opening beat) are the
ones that reached the frame, as ignimbrite over the low axis and as pumice into the basin (the Whanganui
Basin's Nukumaruan–Castlecliffian tephras record them). The Alexandra volcanics (Karioi, Pirongia,
2.74–1.6 Ma) were andesitic cones, not supereruptions. Nothing older than ~1.7 Ma reached the region as
an ignimbrite. Not shown yet (§8).

**Left for co-design** (§8): whether to add the Mangakino ash beats. **Known compromise:** the finger's interior is the base noise under the footprints cut
toward lowland (`LOOK.palaeoAxisLow`), so it reads as one low island per range rather than a chain of
islets; `LOOK.palaeoAxisCore` narrows or widens it live (`B` to re-bake).

---

## Sources

- Trewick, S. A. & Bland, K. J. 2012. Fire and slice: palaeogeography for biogeography at New Zealand's
  North Island/South Island juncture. *J. Royal Society of NZ* 42(3): 153–183.
  [doi:10.1080/03036758.2010.549493](https://doi.org/10.1080/03036758.2010.549493). Fig. 4A–D (4, 3, 2.4,
  1 Ma); pp. 160–171 (quoted above). `research/Fire and slice….pdf`.
- Rees, C., Palmer, J. & Palmer, A. 2017/2018. Plio-Pleistocene geology / Quaternary sedimentology of the
  lower Pohangina Valley. *NZ J. Geology and Geophysics* — marine conditions across the axis 3–1.6 Ma,
  closure from ~1.63 Ma; the c. 1 Ma east–west drainage (via `TEMANAWA_NATURAL_HISTORY.md` §I).
- Milner 2017. *The Pliocene–Pleistocene development, uplift and emergence history of the Manawatu Strait.*
  MSc, VUW.
- The blog drafts in `md/blog/` (the installation's own telling of the same story).
