# Te Manawa — Terrain Implementation Plan

How the deep-time landscape morphs: **author a few vector "snapshots," let the
sim interpolate between them, and let bounded procedural noise fill the detail** —
so the big moves are art-directed but every run is a little different, with
outliers curtailed.

---

## 1. What the engine gives us (the constraints)

From `TeManawa_terrain.js` / `TeManawa_simulation.js`:

- **`heightMap`** (a `Float32Array`, one elevation 0–1 per grid cell) is the single
  source of truth. `getElevationAt`, `getBiomeAt`, `isWalkable`, `canPlace` are all
  just cheap lookups into it and `biomeIndexMap`.
- **Biomes are currently derived from elevation** (`getBiomeFromElevation` = which
  band `[minElevation,maxElevation)` the cell falls in) plus a water-adjacency fix.
- **`getElevation(x,y)` is where procedure lives today** — fractal + ridge noise +
  island falloff. This is exactly the seam where an authored height replaces the
  base and noise becomes an *additive detail* term.
- **Rendering is pre-baked**: `generate()` bakes 4 season image buffers
  (`createGraphics`) and `render()` just cross-fades them. Nothing is computed per
  frame. A morphing world therefore means **re-baking on an interval**, not per frame.
- **Snow/season is already a smooth parametric system** (`getSnowLineElevation`,
  `seasonSnowLines`, transition lerps). The glacial cycle rides on top of this.
- **Plants** scatter uniformly per cell, gated by `biome.plantTypes` + `plantDensity`
  (`spawnPlants()`), with no gradients or clustering yet.
- **`regenerate()`** = new random seed + rebuild. Reuse it for per-run variation.

Design consequence: **drive everything off two interpolated fields — an elevation
field and (optionally) a moisture field — then classify biomes from those + climate.
Re-bake the image on an interval. Keep noise additive and clamped.**

---

## 2. The core idea: two independent time axes

Don't try to paint every moment. Split the change into two things that combine:

**A. Tectonics (slow, monotonic) — authored keyframes.** A handful of hand-drawn
height snapshots capture the *uplift* of the Ruahine/Tararua block and the
*deepening antecedent gorge*. Interpolated by absolute `yearsBP`. This is the part
you draw.

**B. Climate (oscillating) — parametric glacial index.** Sea level, snowline,
treeline and moisture swing on ~100-kyr glacial/interglacial cycles. This is a
*curve over `yearsBP`*, not art — cheap, smooth, and replayable. It modulates the
tectonic base: lowering sea level steps the coast seaward and grows dunefields;
raising the snow/tree line contracts the forest; etc.

So: `land(t) = tectonicHeight(t)` (keyframes) **combined with** `climate(t)`
(parametric) → effective elevation-vs-sea, snow, moisture → biomes. You paint the
slow bones; the fast weather is math. This keeps authoring light and cycling free.

```
 keyframes (SVG/PNG)          parametric
 345ka ── 185ka ── 25ka        glacial index(yearsBP): seaLevel, snowLine,
   │  height + moisture          treeLine, moisture bias, temperature
   ▼                                   │
 rasterize→grids  ──interpolate(t)──►  ▼
                    + clamped noise → ELEVATION field + MOISTURE field
                                          │
                              classify → BIOME map  ──► sim queries + baked image
```

---

## 3. Authoring format (what you draw)

**Vectors for editing, rasters at load.** Author in SVG (Illustrator/Inkscape) so
it's resolution-independent and easy to revise; the loader rasterizes each layer to
a pixel grid once at startup. If SVG-in-canvas is ever fiddly, exporting each layer
as a **PNG** is the zero-risk fallback — the pipeline treats both as pixel grids.

**Per tectonic keyframe, up to three layers (only Height is required):**

| Layer | Encoding | Drives |
|---|---|---|
| **Height** (required) | grayscale, 0=deep sea → 255=highest peak | elevation field (coast, ranges, gorge, dune relief) |
| **Moisture** (optional) | grayscale, dark=dry → light=wet | biome wetness (riparian/forest vs shrub/dune) |
| **Override** (optional) | flat indexed colours → biome legend | hard-authored features the classifier shouldn't guess (a dune belt, a wetland, the river ribbon) |

**Rules that keep interpolation valid (a `validate()` at load enforces them):**

- Every keyframe shares the **same canvas size, extent and registration**, so cell
  *(r,c)* means the same place in all of them. Reject mismatches loudly.
- Author on a **square canvas** (see §7) — this is also where we finally make the
  play area square as requested.
- A single **manifest** ties it together:

```jsonc
// keyframes/manifest.json
{
  "grid": 256,                       // square sim resolution
  "seaLevelByYearsBP": "parametric", // climate curve owns the waterline
  "biomeLegend": { "#3b6a50":"forestRefuge", "#b2c090":"glacialFlats", "#236384":"sea", ... },
  "noise": { "heightAmp": 0.06, "moistureAmp": 0.15, "edgeJitter": 0.5, "seedPerRun": true },
  "keyframes": [
    { "yearsBP": 345000, "height": "kf_345_h.png", "moisture": "kf_345_m.png", "override": "kf_345_o.png" },
    { "yearsBP": 185000, "height": "kf_185_h.png", "moisture": "kf_185_m.png" },
    { "yearsBP":  25000, "height": "kf_025_h.png", "moisture": "kf_025_m.png", "override": "kf_025_o.png" }
  ]
}
```

Start with **3 tectonic keyframes** (345 / 185 / 25 ka) — enough to read uplift +
incision. Add more only where a segment needs a specific mid-shape. Climate detail
comes free from the parametric index, not extra art.

---

## 4. Data model & interpolation

At load, rasterize each layer into `Float32Array` grids (`grid×grid`): `H_k`, `M_k`
per keyframe. Memory is trivial (3 keyframes × 2 fields × 256² × 4B ≈ 1.5 MB).

Each morph step, given `yearsBP` from the install layer's deep-time clock:

1. **Bracket** the two keyframes around `yearsBP`; compute `t∈[0,1]` (optionally
   eased so snapshots "hold" briefly and read as distinct eras).
2. **Elevation** per cell: `e = lerp(H_a, H_b, t) + clampedNoise(x,y)` (§5).
3. **Moisture** per cell: `m = lerp(M_a, M_b, t) + moistureNoise` (or, if no moisture
   layer, derive `m` from distance-to-river/coast + noise).
4. **Climate** from the glacial index at `yearsBP`: `seaLevel`, `snowLine`,
   `treeLine`, `tempBias`.
5. **Classify** biome per cell from `(e, m, climate)` (§6); apply **Override** where
   painted. Rebuild `biomeIndexMap`; write `heightMap = e`.
6. **Re-bake** the render image (§7) — on an interval, not every frame.

Because 2–5 are continuous, the world *morphs* smoothly (a forest edge slides, a
coast creeps) rather than popping. `getElevationAt/getBiomeAt` keep working
unchanged — the sim just sees a slowly-changing world and adapts on its own.

---

## 5. Where procedural noise enters — and the guardrails

Noise is what makes it emergent and replayable. It enters in four bounded places,
each with a weight in the manifest so you can dial procedural influence up or down:

- **Height detail** — fractal noise added to the interpolated elevation so the land
  isn't smooth between control points (reuse the existing `fractalNoise`).
- **Moisture variation** — noise on the moisture field → patchy habitats, not flat
  bands.
- **Biome-edge jitter** — small per-cell perturbation to the classifier inputs so
  boundaries wander naturally instead of following vector lines.
- **Plant scatter** — clustering + density gradients (§8).

**Curtailing outliers (the important half):**

- **Coast lock.** Apply height noise as `e*(1+k·n)` (multiplicative) and/or scale
  noise by distance from sea level, so noise can never flip sea↔land at the
  shoreline. The authored coastline stays put.
- **Override protection.** Cells painted in an Override layer are never touched by
  noise or the classifier.
- **Connectivity pass.** After building `biomeIndexMap`, flood-fill the walkable
  area and dissolve isolated pockets below a size threshold (no one-cell lakes on
  peaks, no unreachable traps that strand moa).
- **Amplitude caps + per-run seed.** Every noise term is bounded and seeded
  (`regenerate()` reseeds), so runs vary but nothing explodes; clamp `e,m∈[0,1]`,
  guard `t` and divisions against NaN.
- **Registration validation.** Reject keyframes whose dimensions don't match.

Existing population/`maxPerSpecies` caps already curtail *biological* outliers; these
curtail *geographic* ones.

---

## 6. Biome model (recommended vs. minimal)

**Minimal v1 (least code):** keep `getBiomeFromElevation` (elevation bands) exactly
as-is; the authored keyframe height + the glacial snow/tree line already move biomes
around (ranges rise → alpine appears; sea level drops → coastal band marches
seaward). Habitats are implicit in height + climate. This may be visually enough and
needs almost no new biome logic.

**Recommended v2 (richer, still cheap):** replace the band lookup with a small
**classifier(elevation, moisture, temperature)** — a Whittaker-style table mapping
(how high, how wet, how cold) → biome key, using the level's existing biome
definitions/colours. Then:

- You paint *drivers* (height, moisture) — intuitive — and hard-author only special
  features via Override.
- The habitat mosaic **emerges** from drivers + noise and **morphs** smoothly.
- "More plants by the river and in the ranges" falls out for free: river = low +
  wet → lush biome → richer `plantTypes` + higher plant density.

Recommendation: build v1 first (proves the morph end-to-end), then swap in the v2
classifier behind the same `getBiomeAt` — the sim never notices the change.

---

## 7. Rendering, square play area & performance

- **Square play area (finally):** set the terrain to a fixed square grid
  (`mapWidth = mapHeight = grid`, e.g. 256) in the constructor instead of deriving
  from window/zoom (`terrain.js` L42–47). Authored art is square; the existing
  fullscreen transform already centres/letterboxes it in the portrait screen.
- **One base buffer, live overlays.** Drop from 4 pre-baked season buffers to **one
  base-terrain buffer** re-baked per morph interval; apply **snow** and the existing
  **winter frost** as cheap live tints in `render()`. This makes interval re-bakes
  affordable (4× less bake work) and keeps fast seasons independent of slow tectonics.
- **Interval, not per-frame.** Re-bake only when `yearsBP` advances by Δ (e.g.
  ~400 sim-years). At 500 yr/s that's ~1.3 bakes/s; under the 10× button ~13/s.
  **Cross-fade the two most recent bakes** (same trick as seasons) so it looks
  continuous. Throttle Δ up while fast-forwarding if a weak kiosk GPU struggles.
- **Budget:** 256² ≈ 65k cells. Interpolate+noise and classify are ~sub-ms each;
  the pixel bake is the cost — keep the grid ≤256² and/or bake at reduced pixel
  density. Tune Δ and resolution together against the target hardware.

---

## 8. Plant distribution (procedural, morph-aware)

Upgrade `spawnPlants()` and add a light re-seed pass:

- **Density field, not uniform.** Scale `plantDensity` per cell by moisture and a
  riparian/valley bonus (distance-to-river), so growth concentrates along the river
  and lower ranges — with noise for patchiness.
- **Clustering.** Seed with a bit of blue-noise/clumping instead of independent
  per-cell rolls, so stands and groves form (reads far more natural).
- **Succession on morph.** When a cell's biome changes, don't teleport plants: cull
  those now out-of-biome over time and seed the newcomers gradually. This is exactly
  the **pioneer→canopy** opening after the Button-4 eruption, and what **Button 2
  (Growth)** accelerates (it already pushes `plant.growth`; here it can also raise
  the local seeding rate).
- **Per-run seed** → different stands each run (replayability), bounded by the same
  density caps.

---

## 9. Integration & code changes

- **New `TeManawa_keyframes.js`** — loads `manifest.json`, rasterizes layers to grids
  (via `loadImage` in `preload()` so they're ready before `generate()`), exposes
  `sampleHeight(t)`, `sampleMoisture(t)`, `override(cell)`, and `validate()`.
- **Extend `TerrainGenerator`** — add a `keyframeMode`; `generate()` builds fields at
  `t=0`; new `morphTo(yearsBP)` does §4 steps 1–6 with the interval guard; `getElevation`
  becomes `interp + clampedNoise`; classification swappable (v1 bands → v2 table).
  Reduce to one base buffer + live snow overlay.
- **Glacial index** — a small parametric module (`climateAt(yearsBP) → {seaLevel,
  snowLine, treeLine, tempBias}`), also feeding `SeasonManager`'s snow line so fast
  seasons and slow climate agree.
- **Hook to deep time** — the install layer already computes `yearsBP`; call
  `game.terrain.morphTo(yearsBP)` once per frame (it early-outs between intervals).
  Button 4 reset → `yearsBP` back to 345 ka → first keyframe + a fresh noise seed.
- **Square + scaffold retirement** — swap the scaffold biomes for the Manawatū set as
  part of v2; the shim can go once the HUD/economy cleanup lands (separate task).

---

## 10. Suggested build order

1. **Square, single-buffer terrain.** Fix the grid to square; collapse to one base
   buffer + live snow/frost. (Also delivers the deferred square play area.)
2. **Keyframe loader + height morph.** Manifest + rasterize + `morphTo` with height
   interpolation and clamped detail noise; wire to `yearsBP`. Author 3 quick test
   keyframes to see uplift + gorge on the timeline.
3. **Glacial index.** Parametric sea level / snow / tree line over `yearsBP`; couple
   to `SeasonManager`. Coast + forest now breathe on cycles.
4. **Biome classifier (v2).** (elevation, moisture, climate) → biome + Override;
   connectivity + coast-lock guardrails.
5. **Procedural plants.** Density field + clustering + succession-on-morph.
6. **Tune** noise weights, Δ/resolution for the kiosk, and easing so eras read.

---

## 11. Decisions for you

1. **Biome control:** paint explicit habitats everywhere (more control, more art), or
   paint drivers (height + moisture) and let the classifier emerge them (recommended,
   more emergent)? You can mix via the Override layer.
2. **Keyframe count/dates:** start with 345 / 185 / 25 ka, or do you want a specific
   mid-glacial shape in there?
3. **Authoring source:** SVG (I'll add the rasterize-on-load path) or PNG export
   (simplest)?
4. **Procedural strength:** rough starting weights for height/moisture/edge noise —
   subtle (art-led) or bold (emergence-led)? Easy to expose as live sliders while you
   tune.
