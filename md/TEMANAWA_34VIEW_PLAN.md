# Te Manawa — 3/4 View & Illustration Restyle

Status: proposal. Sits under `TEMANAWA_PLAN_V2.md`; where they disagree, V2 wins.
Reshapes Phase 3 (terrain) — it does not add a phase.

Two changes, one plan:

1. Terrain rendered at a 3/4 angle — higher (closer to top-down) than Terra Nil's.
2. The ground restyled from *pixel topo map* to *cartoon illustration of a landscape*.

Landscape orientation. Governing constraint throughout: **the simulation stays
top-down.** Positions, walkability, spawning, the spatial hash — all remain on the
existing 2D grid. Only the *paint* is 3/4.

---

## 1. The decision that shapes everything

Three ways to get a 3/4 view; one survives the budgets:

| Option | How | Verdict |
|---|---|---|
| A. Squash-only | draw the bake with `scale(1, K)`; art carries all the depth | Not enough relief for two ranges and a gorge — but it is step 1 of C |
| B. WEBGL heightmap mesh | true 3D, orthographic camera | **Rejected.** Rewrites the whole render path, p5 WEBGL text/2D pain, 4K fill cost at `pixelDensity` 1, kiosk risk |
| C. Baked oblique relief | project the height map into the season bake itself | **Recommended** |

C preserves the load-bearing property of the current renderer: terrain is four
pre-baked buffers and one `image()` per frame (`TerrainGenerator.render()`).
Season crossfade, winter frost tint, soft-reset cost (still zero terrain work on
the visitor path), photosensitivity ramps — all untouched.

---

## 2. The projection

Plan-oblique — "top-down 3/4" in the Zelda sense, **not isometric**: no x-shear,
no rotation. One formula:

```
screenX = worldX
screenY = worldY · K  −  elev(worldX, worldY) · LIFT
```

- `K` — pitch squash. 1.0 is top-down; Terra Nil sits around 0.5–0.6. Start at
  **0.8** and author in the 0.72–0.85 range for the "slightly higher" angle.
- `LIFT` — relief height in world px at elevation 1.0. Start around 12–15% of
  `mapHeight`: enough for the ranges to stand up, not enough to self-occlude
  the playfield.

New file `TeManawa_projection.js` — **pure and p5-free**, like
`TeManawa_climate.js`, so `tools/bootcheck.js` can assert on it without booting
the sketch. It owns `worldToScreen(x, y, elev)`, `screenToWorld` (iterative
inverse using the `heightMap` — authoring-only, the kiosk has no pointer), and
the two constants. `K`/`LIFT` are authored in the level def and held on the
instance — never written back to `CONFIG` (existing convention; see
`noiseScale`).

Load order: after `terrain.js`, before `simulation.js` and `hud.js`.

---

## 3. Relief goes into the bake

`_bakeSeasonBuffer()` changes; `render()` barely does.

1. Buffer becomes `mapWidth × (mapHeight·K + LIFT + margin)`.
2. Paint rows **back to front** (row 0, the far north, first). Each cell paints
   at its projected y; nearer rows overwrite — a painter's algorithm inside the
   bake, run once at generate time.
3. Where a cell stands higher than its southern neighbour by more than a
   threshold, fill the vertical gap with the biome's **side-face colour**
   (darkened ramp + a dark ink line on the lip). This is the cartoon "cake
   layer" cliff, and the whole reason the Ruahine and Tararua read as ranges.
4. Water never lifts. Sea and river sit in the water band, so every shoreline
   gets a small bank face for free.

Bake cost rises, but it is all inside `generate()` / `init()` (the ~1 s budget;
nothing on the visitor path calls it). `disposeBuffers()` already handles
replacement — the buffers are just taller now; keep the `remove()` discipline
(`TEMANAWA_BUILD_V3.md` §2.3).

Knock-ons in `TeManawa_sketch.js`: the clip rect and view-centering math
(`Game.render()` ~line 908, `setTerrainFit()` ~line 790) currently use
`mapHeight · viewZoom`; both switch to the projected height from the projection
module. `TerrainGenerator.gridFor()` itself does not change — the *cell budget*
logic is untouched; only the on-screen footprint math learns about `K` and
`LIFT`.

---

## 4. Decouple bake resolution from the sim grid

Most of the "pixel topo" look is simply this: the bake is 1 px per world unit
(a ~512-wide buffer) blown up ~2.5× at draw time. Illustration needs smooth
ink lines, so bake at `BAKE_SCALE ×` world resolution (start at 2; bound by
memory — four buffers × w·h·4 bytes; at 2× on a 512 grid that is ~4 × 15 MB,
fine).

`CONFIG.mapGrid` — the cell budget, §5.2 of BUILD_V3, still headed for 256 —
**does not move.** Only the paint gets denser. Simulation cost and bake
resolution become independent knobs, which they should have been anyway.

---

## 5. Entities in the projected world

Sim positions stay world x/y. Render-side:

- Every entity draws at `Projection.worldToScreen(x, y, terrain.getElevationAt(x, y))`,
  sprite anchored at the **feet**, drawn upright and unsquashed — a billboard.
  One shared helper in the boid/plant render path, one line per class.
- **Draw order must become y-sorted.** The current layer-by-type scheme
  (`Simulation.render()` layers 1–8) breaks at 3/4: a moa *south of* a tree must
  draw over it, and today trees always beat moas. Replace ground layers 1–5
  with a single painter pass sorted by projected screenY. Persistent array +
  insertion sort — mostly-sorted between frames, **no allocation in `draw()`**.
  ≤ 1,300 live entities sorts well inside the frame budget.
- **Flying birds** (eagles, kea): a per-entity altitude term added to the lift,
  plus a soft shadow blob drawn at the unlifted ground position. At 3/4 the
  shadow is what tells the eye a bird is airborne, not floating. They stay in
  the top layers, as now. Storms/ash stay above everything, unchanged.
- Culling: `updateViewport()`'s `inView` test compares world coords — extend the
  y margin by `LIFT` and it is done.
- `isMouseOver` and any picking go through `screenToWorld`. Authoring-only.

---

## 6. Authored geography replaces the noise island

`getIslandFalloff()` (coastline banded along X) was never the Manawatū. The
restyle is the moment to author the real composition, because relief now has a
direction: **high terrain belongs toward the top of the screen** (far side), or
its lift occludes the playfield behind it.

Landscape composition, matching the mock-up:

- **Tasman Sea** — left / lower-left. Lowest thing in the scene, safest at the front.
- **Manawatū plains + river** — the middle ground.
- **Ruahine Range** — upper right, running NE. **Tararua Range** — right /
  lower-right of the gorge, running SW. The gorge is the authored notch between them.
- **The river** — an authored spline (east of the Ruahine → through the gorge →
  snaking across the plains → the sea), *carved* into the height map: depress
  elevation below the water band along the spline with a falloff. Not left to noise.
- **The ranges** — authored ridge-guide polylines. Elevation becomes
  `noise × domain-warped distance-to-ridge field`: noise still supplies texture
  and per-seed variation, the guides supply the geography.

All of this lands in `getElevation()` / a new authoring pass inside
`generate()`. The every-12th-reset reseed still works — the seed varies the
noise, the guides hold the geography still.

---

## 7. From topo map to illustration

Every move here is **bake-time**. Nothing per-frame changes; the
photosensitivity budget is untouched.

| Move | Replaces | How |
|---|---|---|
| Cel-quantized ramps | smooth 3-stop lerp per band | 2–3 flat tones per biome from the illustrator's palette; posterize `getColor()` at bake |
| Wobbly ink boundaries | contour-shaped band edges | dither the band thresholds with high-frequency noise so borders wander like a brush; detect biome-boundary cells and stroke them 2–3 px in an authored outline colour |
| Texture stamps | contour lines (retire `showContours`) | small PNG stamps — tussock ticks, scrub dots, koru / kōwhaiwhai water swirls per the concept sheet — stamped into the bake, seeded, density authored per biome. Named per the sprite rule: `sprites/terrain/<biome>/<biome>_stamp_<nn>.png` |
| Cliff cake-faces | — | §3 side faces: darker flat tone + dark lip line; a light rim on north (sun-facing) top edges |
| Water | flat ramp | flat colour + a lighter hand-wobble shoreline stroke + sparse swirl stamps; river banks come from §3 for free |
| Paper grain | — | one multiply texture over the finished bake |
| Quieter ground | — | compress the ground's value/saturation range so the outlined sprites pop — illustration reads sprite-first |

Authoring stays where it is: **`levelDef.biomes` remains the single source of
the ground look.** Add `sideColor`, `outlineColor`, `stamps[]` per biome and
update the level-file header. `validateBiomeBands()` is unchanged.

Seasons: same four bakes. Swap palette + stamp sets per season (snow stamps in
winter) — the existing per-pixel snow blend can stay underneath or retire.

---

## 8. Order of work

1. **Projection + squash-only** — `TeManawa_projection.js`, draw the *existing*
   bake with `scale(1, K)`, entity y-sort, feet anchors, bird shadows. Proves
   the entire pipeline with zero new art.
2. **Relief bake** (§3) + bake-resolution decouple (§4).
3. **Illustration pass** (§7) with placeholder stamps.
4. **Authored geography** (§6) — river, ranges, gorge.
5. Real stamps and palette from the illustrator.

Fits `TEMANAWA_REORG.md` §8: this *is* Phase 3, reshaped. The asset pipeline
still lands first — §7's stamps are new manifest entries.

---

## 9. What bootcheck must grow

- Projection: round-trip asserts on the pure module; `K`/`LIFT` in range; no
  `CONFIG` writeback after six soft resets.
- Bake: buffer dimensions match the §3 formula across the six-aspect sweep;
  `disposeBuffers()` still frees the taller buffers (leak check).
- Sort: painter order stable and allocation-free across the 120 draw frames.
- Budgets: `init()` still ~1 s with stamps and 2× bake; soft reset still never
  touches the bake.
