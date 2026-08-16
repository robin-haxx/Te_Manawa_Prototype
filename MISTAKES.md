# Te Manawa — mistakes worth not repeating

A plain record of things that were tried and went wrong, so the reasoning that
now looks arbitrary in the code has somewhere to live. **Newest first** — put new
entries at the top.

Each entry: what happened · root cause · consequence · the rule that prevents a
repeat. The rule is the part that also lives at the call site (as a short guard
comment) and, where general, in `CLAUDE.md`.

---

## Animals walked onto the river because walkability was biome-band only

- **What happened.** `terrain.isWalkable(x,y)` returned only `getEffectiveBiomeAt(x,y).walkable`
  — the coarse, elevation-band biome grid. Animals ran out onto the water "quite a lot."
- **Root cause.** The RIVER (and its tributaries) rides THROUGH the walkable lowland at
  grassland elevation, so those cells classify as walkable grassland in the biome grid — the
  river is not represented there as water at all. It is only in the paint layer
  (`waterTypeAt`: 0 land · 1 sea · 2 river). So the boid avoidance (`avoidUnwalkable`), spawn
  placement and migration-target scoring, all of which key off `isWalkable`, treated the river
  as solid ground. `cullSubmergedPlants` had already hit the same coarse-grid gap and fixed it
  for PLANTS by adding a `waterTypeAt` test — but animal walkability was never given the same.
- **Consequence.** Grazers pathed straight onto the river and the sea-margin cells where the
  two classifications disagree; with the new coast-favouring goose it was very visible.
- **Rule.** `isWalkable` now also requires `waterTypeAt(x,y) === 0` (guarded: it returns 0
  before the first bake, so it is a no-op until the ground is painted). One walkability test,
  consulted by every animal path, so painted river/sea is off-limits uniformly — the same
  reasoning as `cullSubmergedPlants`. `TeManawa_terrain.js`; harness asserts no painted river
  cell is walkable. (Residual: the moving coastline can briefly flood a shore-hugging bird,
  which then self-ejects via `avoidUnwalkable` — measured ~0.5 of 25 at any instant.)

## Plants cached their site and never updated as the land morphed

- **What happened.** A plant read `elevation` and `biomeKey` once, in its constructor,
  from the terrain at its spawn point. The deep-time morph re-bakes the land but does
  not rebuild the living world, so those cached values went stale — a podocarp kept
  reading forest elevation while the Ruahine uplifted into the subalpine band under it,
  and so "survived fine" where it should have wilted.
- **Root cause.** Nothing refreshed the cached site after a morph. `cullSubmergedPlants`
  ran at morph-complete but only dropped plants that had gone under water / onto ice.
- **Consequence.** Forest contraction, dormancy and the biome modifier all keyed off the
  spawn-time ground, so cover did not track the changing landscape (uplift, moving coast).
  The harness measured 116 of 117 survivors carrying stale elevation after a full-window morph.
- **Rule.** `cullSubmergedPlants` now also REFRESHES each survivor's `elevation`/`biomeKey`
  from the current terrain (it already computes the biome per plant), so `Plant.update()`
  responds to where the plant now sits. Anything cached from the terrain at spawn must be
  refreshed at morph-complete. `TeManawa_simulation.js`; harness asserts no stale survivors.

## Habitat health as a living-cover ratio

- **What happened.** The habitat-health readout (which desaturates the scene when
  the ecosystem is unwell) was first driven by the ratio of living plant cover.
- **Root cause.** Moa grazing continuously lowers standing cover — that is normal
  churn, not ill health — so the ratio never sits at 1 on a healthy map.
- **Consequence.** A healthy, undisturbed map read as unwell and stayed visibly
  desaturated.
- **Rule.** Health is `ash disturbance × regime fit × recruitment`, all of which
  read exactly 1 on an undisturbed map. Don't reintroduce a raw living-cover term.
  `Game._updateHabitatHealth` in `TeManawa_sketch.js`.

## Climate as a sine wave

- **What happened.** The glacial cycle was first modelled as a generic ~100 kyr
  sinusoidal oscillator over `yearsBP`.
- **Root cause.** Real late-Quaternary cycles are ~100 kyr but strongly
  asymmetric and irregular (MIS 7 has three warm peaks, MIS 5 four substages,
  terminations are abrupt). No closed form reproduces that.
- **Consequence.** Two checkable facts came out wrong: MIS 5e (the last
  interglacial) landed mid-glacial, and the LGM at the end of the run was missed.
- **Rule.** The curve is anchor points from the LR04 benthic stack, smoothstepped
  between and auditable one line at a time. Don't replace it with a parametric
  wave. `Climate.ANCHORS` in `TeManawa_climate.js`.

## A second biome table that rendered nothing

- **What happened.** There was an engine-side biome table (in `sketch.js`)
  alongside the level's `levelDef.biomes`.
- **Root cause.** Only the level's biomes are read by the renderer; the second
  table was authoritative-looking but wired to nothing.
- **Consequence.** Editing it changed nothing on screen — silently — for as long
  as anyone tried.
- **Rule.** The ground look is authored in exactly one place: `levelDef.biomes`.
  There is no engine-side biome table. `Game.loadLevel()` registers the level's
  biomes so `REGISTRY` and `TerrainGenerator` cannot diverge.

## Biome bands read fine but don't draw

- **What happened.** A biome band was authored with a sensible elevation range
  but never appeared.
- **Root cause.** `getBiomeFromElevation` scans ascending by `minElevation` and
  takes the FIRST hit, so a lower band shadows an overlapping higher one; a fully
  shadowed band never draws. Invisible in the data — each band reads fine alone.
- **Consequence.** The second way a biome-colour edit can appear to do nothing.
- **Rule.** Bands are first-match, not blended. Check the console after editing
  bands: `validateBiomeBands()` reports declared vs. effective range at load.

## createGraphics buffers leaked ~4 MB per reseed

- **What happened.** Terrain reseed replaced its `createGraphics` season buffers
  without freeing the old ones.
- **Root cause.** p5 `createGraphics` allocates a GPU-backed buffer that is not
  garbage-collected on reference drop; it must be `remove()`d.
- **Consequence.** ~4 MB leaked per reseed — invisible per reset, fatal to an
  installation that runs for months.
- **Rule.** `remove()` a `createGraphics` buffer before replacing it. See the
  HUD eviction path and `TeManawa_terrain.js`.

## Per-run values written back to CONFIG compounded

- **What happened.** A per-run terrain adjustment (`noiseScale`) was written back
  onto `CONFIG`.
- **Root cause.** `CONFIG` holds authored level values; a run/screen adjustment
  that mutates it is not reset between regenerations.
- **Consequence.** The adjustment compounded every regeneration, drifting the
  terrain away from its authored look.
- **Rule.** Modulate on the instance, never write back to `CONFIG`. Same
  discipline in `TeManawa_projection.js` and `TeManawa_water.js`.

## Season lerp helper allocated ~1,400 closures/frame

- **What happened.** `SeasonManager`'s current→next blends routed through a
  `_lerpSeasonal(thunk, thunk)` helper.
- **Root cause.** Two arrow closures were allocated per call, and the getters run
  per entity per frame (moa hunger/migration, plant modifiers).
- **Consequence.** ~1,400 short-lived functions per frame — the sim's single
  largest GC source.
- **Rule.** Inline the current→next blend in the seasonal getters; don't route
  through a closure-taking helper. `TeManawa_seasons.js`.

## Sprite angle set straight from velocity snapped

- **What happened.** The renderer set a boid's facing angle directly from its
  velocity each frame.
- **Root cause.** Velocity direction can change abruptly; copying it to the
  sprite angle copies the discontinuity.
- **Consequence.** Birds whipped/popped around on direction change instead of
  turning.
- **Rule.** Ease heading toward the target and never rotate past it in a single
  step. Scalar-only, allocation-free. `TeManawa_boid.js`.

## A silent loadImage failure ran for months

- **What happened.** `loadImage` was given `() => {}` as its failure callback. A
  failed load of the moa-juvenile art was swallowed.
- **Root cause.** An empty failure callback turns a missing/failed asset into a
  no-op; the fallback then drew adult art.
- **Consequence.** Juveniles rendered as adults for months before anyone noticed.
- **Rule.** Never pass `() => {}` as a `loadImage` failure callback. Use a real
  handler that surfaces or logs the failure.

## A global guarded via window silently no-opped

- **What happened.** Code guarded a classic-script global through `window.X` /
  `typeof window.X`.
- **Root cause.** A `const`/`class` at the top of a classic script is a lexical
  global — it never becomes a property of `window`.
- **Consequence.** The guard was always false and the branch silently no-opped.
  Found by the headless boot harness, not by testing in a browser.
- **Rule.** Reference classic-script globals by bare name (with `typeof X`), not
  via `window`. `TeManawa_kiosk.js`; `tools/bootcheck.js` guards against it.
