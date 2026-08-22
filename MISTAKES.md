# Te Manawa — mistakes worth not repeating

A plain record of things that were tried and went wrong, so the reasoning that
now looks arbitrary in the code has somewhere to live. **Newest first** — put new
entries at the top.

Each entry: what happened · root cause · consequence · the rule that prevents a
repeat. The rule is the part that also lives at the call site (as a short guard
comment) and, where general, in `CLAUDE.md`.

---

## The harrier re-picked its prey every frame, so it swerved instead of chasing

- **What happened.** Hunting harriers would "swoop towards something like the goose then rubber-band
  away pretty frequently" — a distracting jitter, made worse because the grazers flee cleanly and fast.
- **Root cause.** Three compounding things in `EylesHarrier.hunt`. (1) No target COMMITMENT: every
  frame it re-scanned all nearby prey and locked onto the current best-`eff` bird, so in a gaggle or
  herd the "best" flipped between near-equal targets frame to frame — the harrier swerved between
  them. The per-frame `random()` eagleResistance/camouflage rolls added flicker to the eligible set.
  (2) A fixed 12-frame velocity lead with no proximity scaling: at close range it aimed at a point
  well beyond a fleeing prey, so it sailed past and had to wheel back. (3) huntSpeed 0.6 only shades
  the goose (fleeSpeed 0.55) / takahē (0.5), so a stern chase trailed at parity — it could neither
  close nor pull away, and tiny prediction errors made the gap wobble until the chase timed out.
- **Consequence.** Chases read as a nervous back-and-forth swoop rather than a committed dive, and
  most ended in a fruitless break-off rather than a catch.
- **Rule.** Commit to one target until it is caught, dies, is floor-protected, reaches cover, or
  opens past `eagleLoseRange`; only THEN scan for a new one (so floor/surplus weighting and the
  resistance/camo rolls decide ACQUISITION, not every frame of the chase). Shorten the aim lead as
  the bird closes (`min(12, dist×0.35)`). Steer with extra turn authority (`eagleHuntTurn`, seek
  urgency — it clamps to `maxForce×urgency`, NOT to top speed, so it corners without going faster).
  And add a final STOOP (`eagleStoopSpeed`/`eagleStoopRange`) so the last stretch closes decisively
  instead of trailing at parity. `TeManawa_eagle.js` hunt(); knobs in the scaffold ECOLOGY FEEDBACK
  block. General: a steering agent that re-selects its goal every frame will chatter between
  near-equal goals — commit, and re-select only on a clear exit condition. (This is the same
  rubber-band class as the moa foraging deadband already documented in `TeManawa_moa.js`.) Verified:
  target-switches → 0, average chase-distance swing ~2 px, most hunts resolve in a catch, and
  bootcheck fauna-stability still shows no extinction and 0 refounds.

## The surplus-only predation gate starved the harrier — it hunted nothing

- **What happened.** The Eyles' harrier (kērangi) never caught anything. Hunger climbed past its
  hunt threshold, it went into search/relocate, but kills stayed at 0 indefinitely. (Probed
  headlessly: 0 kills across 2000 frames, three hungry eagles finding no prey.)
- **Root cause.** `EylesHarrier.hunt` had TWO stacked over-hunt guards: the FLOOR
  (`isPreyProtected` — never crop a species at/below its protected minimum) *and* a much stricter
  TARGET gate (`if (surplus <= 0) continue`, surplus = count − target). The intent of the target
  gate was "only ever crop a booming species". But the whole grazer/flyer cast breeds to a taper
  that brakes *at* its target, so every species equilibrates at or below target — `surplus` is
  essentially always ≤ 0. With the target gate on, `getHuntablePrey` yielded nothing edible on
  every frame, so the harrier could never feed. The probe showed TOTAL over-target prey = 0 for
  the entire run.
- **Consequence.** A functionally starving apex predator: it patrolled and searched forever but
  never hunted. The one guard meant to "stop over-hunting" stopped *all* hunting.
- **Rule.** The FLOOR is the anti-overhunt guarantee, not the target. The target now only *weights*
  prey selection: a prey animal is huntable whenever it is above its floor (`headroom = count −
  floor > 0`), and a species booming over target gets an extra `eagleSurplusBonus × surplus` pull
  so booms are still cropped first. Scarce-but-above-floor prey is taken only when nothing better
  is near. `TeManawa_eagle.js` hunt(). General: don't stack a second, stricter population guard on
  top of the floor when the breeding system already pins the population near the level that second
  guard keys off — they cancel and the behaviour vanishes. (Verified with a headless probe on the
  bootcheck bootstrap — three harriers feed across species over 8k frames, populations stay healthy
  and none is driven to its floor — and by the bootcheck fauna-stability section: no extinction over
  a 16k-tick warm↔cold sweep, refound backstop still 0.)

## Kahikatea answered to two habitat systems at once, so the river mouth fought itself

- **What happened.** A wetland kahikatea would "sprout up while a force simultaneously tried to
  shrink it" — the recruitment/warp system growing it while another force dragged it back down,
  most visibly at the low river reaches.
- **Root cause.** Kahikatea had TWO habitat models layered on the same tree. Its intended one is
  DISTURBANCE-driven: the wetland biome (assigned by river proximity, not elevation) places it, and
  `disturbanceRecruit` senescence/recruitment governs its lifecycle. But it was also in
  `FOREST_TREES`, so `Plant.update`'s forest-band CONTRACTION applied too — and that band is an
  ELEVATION mechanism whose `min` is ~0.14 even in the interglacial. The wetland reaches down to
  the river mouth at elevation < 0.14, so kahikatea recruited (and warp-grown) there were
  simultaneously judged "below the forest band" and SUPPRESSED → died back. The disturbance system
  kept planting/growing them; the band system kept killing them. Two systems, one tree, opposite
  verdicts. (The `_growPulse` button skip fixed earlier was a *different*, additive cause — the
  visitor's boost also pumping growth; this one bites with no button pressed at all.)
- **Consequence.** Kahikatea churning grow/shrink at the low wetland — recruited, warp-grown, then
  band-suppressed back to nothing.
- **Rule.** Kahikatea is now EXEMPT from forest-band contraction (`!this._kahikatea` in the gate,
  mirroring beech's `!this._coldRefuge`). One habitat model per tree: kahikatea answers to the
  RIVER (wetland biome + disturbance senescence), not the montane elevation band. It stays a
  `_forestTree` only for the fast recovery-growth rate; its climate response is the wetland seasonal
  modifier. `TeManawa_plant.js`. General: never let two independent habitat/suppression systems
  both own the same entity — pick one. (Verified: a river-mouth kahikatea at elev 0.087 now grows
  instead of dying back; 0 kahikatea suppressed or oscillating in a natural run.)

## The sprite flip was decided off raw velocity, so it flip-flapped

- **What happened.** A perched kōkako, and a grazer briefly rubber-banding at the river's sand
  band, flipped their sprite left/right many times a second — "an annoying continual sprite flip".
- **Root cause.** `Boid.updateFacing` committed the lateral facing `_faceDir` straight off the
  instantaneous `vel.x` (gate ±0.03). A perched bird's velocity jitter and a foraging grazer's
  few-frame back-and-forth both cross that gate repeatedly, and `_flip` animates THROUGH 0
  (edge-on) each time, so the sprite visibly flips. The flip commit also wasn't gated on the
  bird actually moving, so a near-stationary perched bird flipped on pure noise.
- **Consequence.** Constant sprite flipping on perched flyers (kōkako/huia/kererū) and on grazers
  jittering near water.
- **Rule.** The flip now decides off a LOW-PASSED horizontal velocity (`_flipVx`, τ≈16 frames)
  and only re-commits when that smoothed value clears a slightly wider gate AND the bird's speed
  is above the "moving" threshold. Sustained travel still turns the sprite within a fraction of a
  second; jitter and brief reversals hold the last facing. One place, so it covers moa/goose/
  takahē and every kererū-family flyer. `TeManawa_boid.js`. (Verified: kōkako perched flips 4→0,
  grazer-near-water flips 9→≤1 over 90 frames.)

## Moa fixated on food across the river and nosed into the shore chasing it

- **What happened.** Grazers on the sand/coast band around the river "weren't finding food" and
  rubber-banded — reported alongside the sprite flip above.
- **Root cause.** `Moa.findPlant` scored candidate plants by distance/nutrition with NO
  reachability test, so a moa on the bank would pick a plant on the FAR side of the river as its
  nearest food, seek toward it, hit the water, get turned back by `avoidUnwalkable`, re-seek the
  same plant, and oscillate — while its actual hunger climbed because it never reached anything.
- **Consequence.** Starving grazers stuck on the riverbank, oscillating instead of moving to
  reachable food.
- **Rule.** `findPlant` now samples the water type at the path MIDPOINT and applies a ×6 score
  penalty to any plant whose straight line to the moa crosses water — a soft deprioritisation, not
  a hard skip, so a moa in a genuine one-sided food desert can still fall back to it rather than
  starve. It prefers same-bank food, so it stops nosing into the shore. `TeManawa_moa.js`.
  (Verified: across-water targets among riverbank grazers dropped to a last-resort handful, and
  bootcheck fauna-stability still shows no extinction over 16000 ticks.)

## The growth button fought the habitat, so boosted trees flickered grown/ungrown

- **What happened.** Holding FOREST/TUSSOCK over a tree whose habitat was working AGAINST
  it — a kahikatea stand senescing for want of a river disturbance, a canopy tree dying back
  outside the (glacially shrinking) forest band, a cold-dormant plant — made it flicker
  grown/ungrown. Reported in "wetland / changing habitats".
- **Root cause.** `InstallHUD._growPulse` added to `growth` every frame the button was held,
  keyed ONLY on `coldTolerance`. `Plant.update` was subtracting from the SAME `growth` the same
  frame (die-back / senescence). The two nearly cancelled, so the plant's `growth` crossed the
  growing↔mature/wilting sprite thresholds frame to frame. Kahikatea was the worst offender: it
  is `disturbanceRecruit` (it establishes only on a river flood / eruption pulse / channel
  shift) and was never meant to grow on the FOREST button — `seedGrowth`/`disperseSeed` already
  gate it out, but `_growPulse` did not, so the button pumped growth into a stand `Plant.update`
  was actively senescing.
- **Consequence.** Visible sprite flicker on boosted trees along the river and at forest-band edges.
- **Rule.** `_growPulse` now skips any plant the habitat is already moving — `dormant ||
  suppressed || _senescent` — and any `def.disturbanceRecruit` type, the same gate the other
  grow paths use. Don't let a one-shot interaction write a field a per-frame system is
  simultaneously driving. `TeManawa_hud.js`.
- **Refinement (later).** Kahikatea (disturbanceRecruit) is not merely *skipped* by the button —
  the FOREST boost instead ACCELERATES its lifecycle (`g._kahiBoost` → `Plant.update`'s `accel`,
  scaling grow/age/senesce together). So a press hurries a kahikatea through whatever it is doing:
  a growing stand grows in faster, an aging one senesces sooner, a shrinking one dies out faster —
  never forcing growth onto a stand that is meant to shrink. `TeManawa_plant.js` /
  `TeManawa_simulation.js` / `TeManawa_hud.js`.

## Centre-anchored moa sorted behind trees they stood in front of

- **What happened.** A moa clearly in front of (south of) a tree rendered occluded by it, and
  near a tree the two flickered which-is-in-front ("moa z-fight … render behind trees they are
  in front of").
- **Root cause.** The 3/4 painter's pass (`Simulation.render`) sorts ground entities by `pos.y`
  (depth). Trees are BASE-anchored — their ground contact IS `pos.y` — but the moa was
  CENTRE-anchored: its sprite straddled `groundY(pos.y)`, so the body hung a half-sprite SOUTH
  of the sort key. A moa whose feet were in front of a tree still sorted by a `pos.y` that sat
  behind the tree's base, so it drew first (behind) while its body overlapped the trunk/canopy.
- **Consequence.** Systematic wrong occlusion, plus z-fighting at the crossover.
- **Rule.** The moa is now FOOT-anchored (image drawn with its base on `groundY(pos.y)`), the
  same convention trees use, so its depth sort key matches its drawn ground contact. The Moa/
  art fills its frame with no bottom padding, so the feet land exactly on the point.
  `TeManawa_moa.js`. General: at 3/4, an entity's depth sort key and its drawn ground-contact
  must be the SAME point.

## Shore avoidance was a step function, so grazers rubber-banded off the coast

- **What happened.** Ground birds "rubber-banded a lot" at the coast/water threshold — approach
  the shore, get flung inland, drift back, repeat.
- **Root cause.** `Boid.avoidUnwalkable` Case 2 was binary: nothing until water sat exactly
  `lookAhead` (12 px) ahead, then a full-strength swerve (`maxForce×2`, or a `×3` reversal when
  boxed in — the moa caller then doubled it again). The bird reached the brink carrying momentum,
  took a hard kick straight back, and its own drive (wander / home-range / migration) re-aimed it
  at the shore — so it oscillated across the threshold.
- **Consequence.** Visible rubber-banding of moa / goose / takahē along the water.
- **Rule.** Case 2 is now graduated: the detection distance scales with speed (it banks earlier),
  the steering RAMPS with proximity (gentle at range, firm only at the brink — no last-moment
  kick), and an outward push sized to cancel the least-turn diagonal brakes the into-water
  momentum, so the bird eases up to the edge and turns ALONG the shore instead of ramming it.
  Verified the force ramps 0→~0.03 and flips net-outward as it nears. `TeManawa_boid.js`.
  (Case 1 — the strong eject for a bird already ON water — is unchanged.)

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
