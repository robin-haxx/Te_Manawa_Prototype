# Te Manawa — Geography skeleton (SVG-driven terrain)

Give the sim a **vector skeleton** — where the ranges sit and where the river
runs — and let procedure build the elevation *around* it. The features are
recognisable and consistent every run; the noise (and a per-run seed) varies
everything else. You tune the general look from a handful of knobs.

This **updates `TEMANAWA_PLAN_V3.md` §2 and revives `TEMANAWA_TERRAIN_PLAN.md`**
(§3–5), which were cut on the grounds that the 345→25 ka window barely moves the
topography. The run now opens at **~1 Ma** (`yearsStart` = 1.0 Ma; 1.1 Ma is the
eventual target — §7), over which the axial ranges rise from almost nothing to
full height — so the morph is re-earned, but with a *lighter* authoring model than
§7's two painted heightmaps: one SVG of lines and blobs, not grayscale rasters.

---

## 1. Pipeline

```
 geo/manawatu.svg  ──(author-time)──►  tools/svg2geo.js  ──►  geo/manawatu.geo.js
   ranges + river                        parse + flatten          normalised 0..1
   (vector, editable)                    + normalise              (classic script)
                                                                      │
                          generate():  build distance fields  ◄───────┘
                          river carve  +  range uplift  +  base plains noise
                                          │            │
                                    tIncision(yBP)   tUplift(yBP)     ← 1.1 Ma time ramp
                                          ▼
                                   ELEVATION field → biome bands → baked buffers
```

The kiosk **never parses SVG**. `svg2geo.js` runs at author-time and commits a
plain-JS data file; the sim loads it like a level. This keeps the runtime with
no DOM/parse dependency and honours "no network, no build step" on the wall.

---

## 2. SVG authoring convention

- `viewBox="0 0 W H"` sets the world extent and aspect. Author landscape (the
  play area is adaptive; 16:9 is the current target). Points are normalised to
  the viewBox, so absolute size doesn't matter — only proportions.
- Features are tagged by **`class` (or `id`)**; untagged elements (a frame,
  labels) are ignored:

  | class   | geometry            | drives                                   |
  |---------|---------------------|------------------------------------------|
  | `river` | open path/polyline  | a carved channel following the line      |
  | `range` | filled polygon/path | uplift inside/near the blob → alpine      |
  | `coast` | open path/polyline  | the coastline (future)                    |
  | `dune`  | filled polygon/path | dune-field relief (future)                |

- Optional per-feature knobs as `data-*` (else the converter's defaults):
  - river/coast: `data-width` (channel half-width, world frac), `data-depth`
  - range/dune: `data-height` (MATURE peak elevation 0..1), `data-spread` (falloff width)

Geometry supported: `<polyline>`/`<polygon>` `points`, and `<path d>` with
`M L H V C S Q T Z` (absolute + relative; curves flattened). Illustrator/Inkscape
exports work; so do hand-authored polylines.

---

## 3. Geo-data format (emitted)

```jsonc
const TE_MANAWA_GEO = {
  source: "manawatu.svg",
  viewBox: { w: 1600, h: 900 },        // aspect the features were drawn in
  rivers: [ { width: 0.05, depth: 1.0, pts: [[x,y], ...] } ],   // x,y normalised 0..1
  ranges: [ { height: 0.86, spread: 0.17, poly: [[x,y], ...] }, ... ],
  coasts: [], dunes: [ { height: 0.2, spread: 0.06, poly: [...] } ]
};
```

---

## 4. Terrain integration (the elevation seam)

`getElevation(x,y)` is where procedure lives today (fractal + ridge noise +
coastal falloff). The skeleton enters here as an **additive influence on top of
the base plains noise**, so the base still gives rolling detail everywhere:

1. **Map** world (x,y) → normalised (u,v) over the terrain footprint, then into
   viewBox space. (Fit mode changes aspect; features stretch to the footprint —
   authoring at the target aspect keeps them true.)
2. **River carve.** `dRiver` = distance to the nearest river segment, with a
   per-seed meander wobble added so the channel wanders off the exact SVG line.
   Inside `width`, pull elevation down to a **river bed below 0.10** (the `sea`
   band → reads as water). `depth`/`width` tune it.
3. **Range uplift.** For each range, `inRange`/`dRange` → a `0..1` mass that
   pulls elevation **up toward `height` (~0.85, under the 0.90 snow line so the
   ranges "don't get as snowy")**, textured by the existing `ridgeNoise` for
   crags. Multiple ranges take the max.
4. **Blend + clamp.** `e = base;  e = lerp(e, riverBed, riverMask);
   e = lerp(e, max(e, rangePeak), rangeMass);  clamp 0..1`. Biome bands then map
   high→subalpine/alpine, channel→water, automatically — no new biome table.

**Consistency vs. variation:** the SVG fixes *where*; the seed varies the
meander, the ridge texture and the plains. Every run differs; the river always
runs its course and the ranges always sit put.

Distance fields are built **once per `generate()`** (rasterise the river into the
grid + a cheap distance pass; point-in-polygon + edge distance for ranges) — not
per frame — so this rides the existing bake, not the draw.

---

## 5. Time axis — ~1.1 Ma (the morph)

The clock already runs `yearsStart` → `yearsEnd` (currently 1,000,000 →
25,500); bump `yearsStart` to **1,100,000**. `DeepTime.progress()` gives 0 at the
start → 1 at the end, driving two curves (the two-curve idea from §7, art of a
*skeleton* not a raster):

- **`tUplift(yBP)`** scales range `height`: ranges start near-flat at 1.1 Ma and
  grow to full height (ease-in — most uplift is late-Quaternary).
- **`tIncision(yBP)`** scales river carve depth, run **slightly ahead** of uplift
  so the gorge floor drops faster than the ridges rise — *the river outpaces the
  uplift* (the antecedence takeaway), visible where the river crosses a range.

The world re-bakes **on an interval** (Δ `yearsBP`, cross-faded like seasons) via
the buffers we already have — never per frame. This is also the hook for the
**secondary events** you'll add across the 1.1 Ma (coast curving north into
Whanganui, dune fields, and their dynamics).

---

## 6. Config knobs (level-authored, live-tunable)

Proposed `levelDef.geography` block, mirrored onto a `GEO` dev surface like
`LOOK`/`GEN` so it re-bakes in place on `B`:

| knob | default | effect |
|---|---|---|
| `riverWidth` | from SVG (0.05) | channel half-width |
| `riverDepth` | from SVG (1.0) | carve strength |
| `riverWobble` | 0.02 | per-seed meander off the SVG line |
| `rangeHeightMax` | from SVG (~0.85) | mature peak (keep <0.90 for less snow) |
| `rangeSpread` | from SVG (~0.15) | how far uplift reaches past the blob |
| `rangeCrag` | 0.25 | ridge-noise texture on the massif |
| `upliftEase` | 2.0 | ease-in exponent for tUplift |
| `incisionLead` | 0.1 | how far tIncision runs ahead of tUplift |
| `rebakeYears` | ~9000 (`morphIntervalYears`) | Δ yearsBP between morph re-bakes |

---

## 7. Build order & status

1. ✅ **Foundation:** this doc, `tools/svg2geo.js`, `geo/manawatu.svg`,
   `geo/manawatu.geo.js`.
2. ✅ **Static integration:** the geo data loads; river/range distance fields build
   once per bake and blend into `getElevation`; harness assertions in place. Terrain
   generates around the skeleton. *(Geo tuning landed in `LOOK` — `rangeRelief`,
   `riverWobble` — not a separate `GEO` surface; landform noise stays in `GEN`.)*
3. ✅ **Time ramp:** `tUplift`/`tIncision` off `yearsBP`; interval re-bake
   (`morphIntervalYears`, ~9 ky) cross-faded and amortised across frames.
   **`yearsStart` is still 1.0 Ma — the bump to 1.1 Ma is not yet made.**
4. 🟡 **Dune field — the Manawatū transgressive dunefield.** Sourced from
   `TEMANAWA_ECOLOGY_COAST.md` §1,§10. Three pieces built, harness-locked:
   - ✅ **Colour** — a bake-time SAND TINT on the western coastal plain (`LOOK.dune*` in
     `TeManawa_terrain.js`, static `_duneIntensity`, blended in `_bakeSeasonColumns`). Densest
     at the shore, thinning inland toward the ESE, windowed to the coastal-plain elevation band,
     and capped by a coast-relative inland REACH that GROWS with the glacial index
     (`duneReachByPhase`) — the Koputaroa surge. The reach stays well short of the range spine,
     so the belt can never bleed east onto the trans-range land.
   - ✅ **Relief** — low wind-aligned (NW→SE) sand ridges added to the coastal-plain ELEVATION
     (static `_duneRidge`/`_duneRelief`, injected in `_applyGeoToHeightMap` off the river channel).
     Added ONCE at the GLACIAL (max) reach — relict topography that persists across phases while
     the colour surges/greens over it, as the stabilised Koputaroa/Foxton belts do. In the single
     `heightMap`, so it participates in the morph (sliced==sync) and entities ride the bumps.
   - ✅ **Sand flux** — the wind↔vegetation engine (`SANDFLUX` config + `Game._sandFluxModel` +
     `_updateSandFlux` in `TeManawa_sketch.js`). Fixed NW wind, strength rising non-linearly with
     the glacial index; `sandFlux = wind × exposedSand` (climate openness + the visitor's
     FOREST/TUSSOCK regime, ash, storm); a DISTURBANCE-only BURIAL term drains habitat health
     (sand burying coastal veg, §10C) while sparing a well-managed coast. Shown live on the debug
     overlay (`sand flux` / `dune burial`).
   - ✅ **Flux → colour (§10B(1)).** The disturbance-driven surge (`Game._duneSurge`, eased, mirrored
     to `terrain._duneSurge`) both EXTENDS the sand-colour reach inland (static `_duneEffReach`,
     toward the glacial relict reach — never past the relief) and BRIGHTENS the blend (static
     `_duneEffAmt` — bare mobile sand vs stabilised dune). Snapshotted PER MORPH so the sliced
     re-bake can't tear (sliced==sync held); crossfaded, so it never lands as a cut. A managed
     coast has surge 0 → the bake is byte-identical to before. **The storm button drives this for
     free** (`wStorm × _stormPressure` → surge): a storm advances the dune a step. Verified live —
     mismanagement brightens the belt core (+6.6) and advances sand inland (+3.2), zero elsewhere.
   - ✅ **Storm habitat effects (§10B(3–5) + §10C).** `Game.applyStormToPlants` (fired once per STORM
     press) rewinds the succession clock UNEVENLY across `simulation.plants`: pure static
     `_stormPlantDamage(type, growth, elevation, wind, cfg)` with two channels — **snap inland
     emergents** (tall `Totara/kahikatea/tawa/beech` windthrown → regrow) and **salt-burn + lee burial**
     on the low seaward margin, ASYMMETRIC by species (soft non-rhizomatous knocked back; hardy
     open/dune binders ride it out — `STORM_EMERGENT/HARDY/SOFT` sets + `STORMFX` config). Scaled by
     `_windStrength(glacial index)`, so a glacial gale bites hardest (§10D). Verified live: one press
     at wind 0.63 → emergents 1.0→0.62, soft →0.94, hardy →0.99; windthrows engage at full-glacial wind.
   - ✅ **Blow-outs (§10B(2)).** Surge-gated DEFLATION HOLLOWS scoured into the belt's elevation
     (static `_duneBlowout` sparse mask + the deflation in `_applyGeoToHeightMap`). A STABLE belt keeps
     its ridges; an ACTIVE/mobile one (surge past `duneBlowoutOnset` — mismanaged, glacial, or storm-hit
     via the storm→surge chain) scours sparse bare-sand bowls down to the water table (`duneWaterTable`),
     which heal as it re-stabilises. Intensity gates belt membership; the sparse mask × surge drives
     depth (so a bowl bottoms out at the floor, not a shallow dimple). Snapshotted per morph (sliced==sync).
     Verified live: 0 hollows stable → 480 hollows / 0.18 deep at high surge. Depth is land-shape-dependent
     (belt height above the water table) — tune `duneWaterTable`/`duneBlowout` with the land re-tune.
   ⬜ **Still to build:** the SVG `dune` authoring class (`dunes:[]` empty).
5. ✅ **Glacial eustatic sea (the sea rise/fall of the glacial cycle).** The fast glacio-eustatic
   ripple from `Climate.seaLevel` (+6 m interglacial ↔ −125 m LGM), wired into the coast as a SIGNED
   term in `_combineGeo` (`TerrainGenerator.glacialSeaShift` → `_geoT.glacialSea`), composed on top of
   the slow tectonic emergence. A glacial LOWSTAND raises the low western shelf so it emerges as land
   (coast marches seaward — **MORE land in a glacial**); an interglacial HIGHSTAND sinks it (the sea
   creeps inland — **less land, the intuition-defying but correct direction**). Elevation-attenuated
   (`glacialSeaCeil`) and WEST-gated (`glacialSeaEastU`) so only the western coast moves, never the
   trans-range eastern lowland or the ranges. The **dune shoreline tracks it** (`duneCoastTrack`) so
   the belt marches onto the bared shelf in a glacial (true Koputaroa mode). Breathes over the cycle
   via the morph re-bakes, crossfaded. Harness-locked; verified live (west land 0.41→0.47 glacial;
   dune west edge 0.26→0.10 glacial). **Rebuilt 2026-10-19 (`TEMANAWA_COAST_PLAN.md` §5):** the
   shift now reads RELATIVE sea level in metres (`Climate.SEA_ANCHORS` + the plain's uplift since),
   not the glacial index, over a baked shelf profile (`_bakeShelf`), so the coast marches steadily
   instead of holding and flipping; the main river's mouth reaches offshore to meet it. **Requires the plant-site reconcile** (`cullSubmergedPlants`
   now refreshes `elevation`/`biomeKey`) so cover tracks the moving coast — see `MISTAKES.md`.

   > **Habitat composition over the cycle (the payoff).** Land area and its makeup swing opposite
   > ways. **Glacial:** more land, but it is the exposed western shelf — cold, windy, OPEN country:
   > coastal / dune / tussock / subalpine expand, the dune belt surges seaward *and* inland, forest
   > contracts to refugia. **Interglacial:** less land (the sea drowns the lowest western ground),
   > but what remains is forested — the forest band lifts, dunes green and lock to a narrow strip. So
   > the cycle is not "more/less of the same map" — it trades **open coastal/dune area (glacial) for
   > forest area (interglacial)**, with the coastline as the pivot. Plants now follow this (bug fix).
6. ✅ **Drowned-valley estuary — the interglacial highstand extreme (§8/§12-6).** The far pole of the
   glacial sea: at a warm interglacial the sea BACKS UP THE RIVER VALLEY as an estuary reaching inland
   (toward Shannon/Opiki), so the "coast" stops being an edge strip and fingers into the middle of the
   map. `TerrainGenerator.estuaryStrength` (relative-sea-level-gated since 2026-10-19: empty below +5 m,
   full by +35 m, so it fills at highstands, more readily early in the run, and drains in the cold) → `_geoT.estuary`, applied in `_applyGeoToHeightMap`: positional up the cached
   MAIN stem (`wMDist`/`wMPos`, out to `estuaryReach × highstand`), spreading `estuaryWidth` off the
   channel, elevation-gated to the valley FLOOR (`estuaryCeil`) so terraces and ranges stay dry. Drowned
   cells classify as sea → the plant-reconcile clears their vegetation. Verified live: inland valley water
   2,818 → **7,483** cells at the highstand (~2.7×), drained in a glacial.
7. ⬜ **Later:** coast curve to Whanganui; ranges' reduced snow; secondary events across the window.
8. ✅ **Re-dated to the real ~1 Ma palaeogeography (2026-10-18).** The opening had shown the ~2.4 Ma
   Manawatū Strait (a sea across a flat, drowned axis). The strait had closed by ~1.6 Ma, so now: the
   SW strait and the central patch are range-protected (`_rangeProtect`, `LOOK.seaRangeProtect`); the
   ranges start as low hills (`GEO_EPOCHS.upliftStart` 0.15); the wide early main stem is pinched to
   river width in the range gap (`_gorgeOpen`, `LOOK.straitGorge*`), leaving an estuary arm west and the
   Woodville lake east; the river flows west from the opening (`mainArmFrom` 1.02 Ma → `To` 0.6 Ma); and
   the south drains one way, 1 → 0.5 Ma, instead of a pulse peaking at 0.5 Ma. Harness-locked
   ("geography"). Step 6 then softened the opening water: `straitWidthMult` 6 → 3 and
   `patchSubFeatherE` 3.0 → 1.2. Sources and before/after are in `TEMANAWA_NATURAL_HISTORY.md` §I.
9. ✅ **The east is land at 1 Ma; tributaries are fans (2026-10-19).** Against Trewick & Bland Fig. 4D:
   the central patch is off (`patchSubRX` 0), the Woodville lake is its own body east of the gap on
   its own clock (`GEO_EPOCHS.lake*`, `LOOK.lake*`), the NE arm is dry at the opening (`mainArm*`
   1.25 → 1.0 Ma), and the main narrows upstream (`LOOK.mainTaper`). Tributaries no longer emerge at
   0.4 Ma: each is a trunk plus hill streams, thin and spread at 1 Ma, drawing together into one
   channel by ~0.3 Ma (`GEO_EPOCHS.tribConverge*`, `LOOK.tribFan*`, `_makeThreads`/`_tribThreads`).
   Authored tributary polylines are Chaikin-rounded at prep (`_chaikin`) so the offset streams do not
   fold at sharp vertices. The river field is two unioned layers now (main, tributary fan). Details in
   `TEMANAWA_NATURAL_HISTORY.md` §I step 8.
10. ✅ **One sea-level rule for the whole window (2026-10-19).** Relative sea level counts the plain's
   uplift from 800 ka (`TerrainGenerator.upliftSinceM`, `LOOK.plainUpliftOnset`), highstands flood by
   contour (`_seaShift`), and `seaRise`/`seaSWReach` are retired; the south strait stays as the
   Levin–Foxton depocentre (`LOOK.southSinkAmt`). The early coast now breathes: highstands reach the
   range foot, lowstands bare the plain. `TEMANAWA_COAST_PLAN.md` §5b; frames in
   `exports/terrain_geology_timeline/`.
11. ✅ **Second-order detail: rugged ranges, migrating meanders, Te Āpiti (2026-10-19).**
   - **Ranges.** The relief field is a ridged fBm (`TerrainGenerator._rangeFbm`, `LOOK.rangeFbm*`):
     5 octaves, each ×2.03 in frequency, rotated 37° and halved in amplitude (gain G 0.5, Hurst H 1,
     per Quilez's "fBM" article). Ridged octaves are weighted by the one before, so crests stay sharp
     and valleys branch. A second fBm (`rangeCrestTex`) is added after the soft ceiling, which
     otherwise squeezes every crest into one smooth cap.
   - **Meanders.** Every channel's centre line is offset sideways by a 2-octave fBm along it
     (`_meanderLUT`, `LOOK.meander*`, `tribMeanderAmp`). It drifts downstream one wavelength per
     60 kyr and is straighter in glacials (gravel braid plain).
     - The envelope (`_prepMeanders`): free on the low plain, zero in the gorge, damped east of it,
       pinned at every confluence; tributaries move on their lower reaches only.
     - The cache keeps signed distances (`wMS`, `tS0`) and `_applyMeanders` re-derives `wMDist`/`tS`
       per morph, so the carve, classify, paint and estuary read the moved channels unchanged.
     - `getRivers()` returns densely resampled moved lines, so the water decals, eels and fish follow
       (`WaterLayer._repathSwimmers`).
     - The main stem's static wobble is retired (`mainRiverWobble` 0), and its bank noise scales with
       its width.
   - **Te Āpiti.** A range saddle (`_gorgeSaddle`, `LOOK.gorge*`) joins the Ruahine and Tararua across
     the gap, so they slope down to meet the river. The river cuts it with a narrower valley and
     channel and an extra incision that deepens with the incision clock. It has shingle banks and no
     swamp.
   - The main stem also narrows upstream more strongly (`mainTaper` 0.55).
   - Harness: the meanders are deterministic, migrate with time, and are pinned in the gorge and at
     confluences; the drawn line is dense; the saddle puts range mass on the channel in the gap; the
     gorge factors are confined to it. The range-lift probe pins noise flat, because the harness's
     white-noise stub makes any ridged fBm average far lower than real noise.
   - Frames at every glacial and interglacial peak are in `exports/terrain_geology_timeline/`.
12. ✅ **The whole catchment; channels that move and meet; the Opiki cycle (2026-10-20).**
   - **svg2geo applies transforms** (element `transform` about its `transform-origin`, and `<g>`
     transforms) and carries `data-name`. It used to drop them, so the editor's rotated Ōroua reached the
     sim un-rotated (`MISTAKES.md`). Its attribute lookup no longer matches `d=` inside `id=`.
   - **Twelve named tributaries** in `geo/manawatu.svg`, drawn source → mouth, sources past the map edge
     or in a range. Widths 0.013 (minor) to 0.018 (major), `LOOK.tribWidthMult` 0.7, each trunk widening
     from `tribHeadWidth` (0.55) at the source to full at the mouth, floored at `tribMinCells` (3.2) sim
     cells so a thin channel never beads. Fan of `tribFanStreams` 3; a fan stream's head moves up toward
     the source until it lies off the map or on range ground (`_makeThreads`).
   - **Junctions** (`_prepJunctions`): each tributary's parent is the river nearest its mouth (main or
     tributary). Its line runs on past the mouth by `tribMouthStub`; its last `tribMouthBlend` slides
     sideways with the parent's offset, and `_refineJunctionEnds` ends it where its moved line crosses
     the parent's (`_tribEndJ`). No channel is pinned at a confluence.
   - **Two tributary slots per cell** (`tJ`/`tJ2` …, unioned in the carve, classify and paint): with
     channels moving, a cell nearest one trunk's authored line can hold another's water. A spatial
     index (`_buildTribBins`) and a Douglas–Peucker pass over the rounded lines keep the cache build
     cheaper than before.
   - **Movement.** Bends `meanderAmp` 0.05 (was 0.034), `tribMeanderAmp` 0.035 (was 0.02), glacial
     straightening 0.3; tributaries move wherever they are off a range proper. Course shifts
     (`meanderBelt*`): a long-wavelength offset fresh for each glacial cycle, eased in after each
     termination (`TerrainGenerator.terminations`, `beltPhase`). The corridor (`corridor*`) soft-clamps
     every offset to where the ground climbs into a range.
   - **Sea cut** (`_tribSeaCut`, `_tribEndW`): a tributary's water ends where its line and two bank
     points are under the sea for two samples running; the drawn line (decals, eels) stops there too.
   - **The Opiki cycle** (`LOOK.estuary*`, `_estState`): tributaries joining the main inside the drowned
     reach drown their lower valleys (estuary branches). The fill clock is the stillstand age
     (`TerrainGenerator.stillstandAge`); the drowned floor fills from margins and heads toward the mouth,
     up to `estuaryFillMax`; filled ground is swamp, then a swamp + forest mosaic. The region is the
     episode's largest estuary (`estuaryMax`, `estuaryMemoryYears`), so the filled plain outlasts the
     sea's fall. The classify and paint give it the wetland and `estuaryForestBiome` biomes.
   - Harness: svg2geo transforms; the named network and its confluence order; sources and fan heads off
     the plain; every mouth on its parent's moved channel; swings, corridor and course shifts; the sea
     cut; the drowned lower Ōroua; the fill's clock and biomes; every tributary joined to the main or
     the sea. Frames in `exports/terrain_rivers_opiki/`.

---

## 8. Notes / limits

- `svg2geo.js` flattens curves at a fixed step and assumes well-formed path data;
  it's a dev tool, not a full SVG parser. Keep features to paths/polylines/polygons.
- A dedicated `river`/`riparian` biome is a later refinement; v1 carves the river
  into the `sea` band, so it reads as a water ribbon.
- Fit-mode aspect stretch: author at the target aspect (16:9 now) to avoid it.
