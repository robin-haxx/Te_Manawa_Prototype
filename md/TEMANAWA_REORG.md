# Te Manawa — Codebase Reorganisation Proposal

Written before Phases 3–7 and before the ~113 new art assets land. Scope: **structure
only**. No design decisions — where this disagrees with `TEMANAWA_PLAN_V2.md`, the plan
wins; where it disagrees with `TEMANAWA_BUILD_V3.md`, the build companion wins.

The codebase is in good shape. 11k lines across 23 files, every module has a header
explaining *why* it exists, the harness catches real bugs, and Phase 1.5 already did the
hard cleanup. What follows is not a rescue — it is the set of seams that will hurt
specifically because of what comes next: **many more sprites, and per-cell ecology
fields**.

The test applied throughout: *does this get worse when there are 158 sprites and four
Float32Array fields instead of 45 sprites and one heightMap?* Anything that doesn't get
worse is left alone.

---

## 1. Contents

| § | |
|---|---|
| **2** | What was found — ranked by what Phase 5 will cost if it stays |
| **3** | The asset pipeline — the one that actually blocks the art |
| **4** | Splitting `sketch.js` |
| **5** | Dead economy residue |
| **6** | Repo hygiene and docs |
| **7** | Two live bugs |
| **8** | Suggested order, and what was already done |

---

## 2. What was found

Ranked by cost-if-left, not by size of diff.

| # | Finding | Bites when | §  |
|---|---|---|---|
| 1 | **Sprite loading lives in three files with three conventions** | The moment asset #46 arrives | 3 |
| 2 | **`sprites/` is flat, and filenames follow four different rules** | Same | 3.2 |
| 3 | **`TeManawa_sketch.js` is 1,038 lines and holds five unrelated things** | Phase 4 edits the middle of it | 4 |
| 4 | **`BIOMES` is level data living in engine code** | Phase 3 swaps the scaffold biomes | 4.2 |
| 5 | **Economy residue in `CONFIG`, `PLACEABLES`, `GAME_STATE`** | Next person reads `CONFIG.width` and guesses wrong | 5 |
| 6 | **17 md files, several superseded, no index** | Next contributor builds from `TEMANAWA_PLAN.md` | 6.2 |
| 7 | **No `CLAUDE.md`, no README** | Every new session re-derives the load order | 6.1 |
| 8 | **`createGraphics` buffers never freed** | Already live — leaks ~4 MB every 12th reset | 7.1 |
| 9 | **Stale duplicates committed at the repo root** | Already live | 6.3 |

---

## 3. The asset pipeline

**This is the one worth doing first**, because it is the only item on the list that
blocks other people's work rather than yours.

### 3.1 Three loaders, three conventions

Sprite loading is currently spread across three files, each with its own idea of how a
sprite set is described:

| Where | What it loads | How it's described |
|---|---|---|
| `sketch.js` `preload()` | 5 plant sets, 24 files | `PLANT_SPRITE_SETS` — declarative: `prefix`, `folder`, `growingFrames`, `anchor`, `scale` |
| `entity_sprites.js` `EntitySprites.load()` | moa, juvenile, bush moa, eagle | `ART_SETS` for the eagle only — declarative: `dir`, `prefix`, `pad`, `first`, `count`. Everything else is a hand-rolled `for` loop |
| `placeable.js` `loadPlaceableSprites()` | cloud1, cloud2, bolt | three bare `loadImage()` calls |

Two of the three are already the right shape — `BUILD_V3.md` §2.4 says so. The problem is
that there are three of them, and that only one species (the eagle) can express
"resolution variants" while only plants can express `anchor` and `scale`. Those
capabilities are not species-specific; they were just added wherever the need first
appeared.

**Proposal: `TeManawa_assets.js`** — one manifest, one loader, one lookup.

```js
const ASSETS = {
  plants: {
    totara: { dir: 'plants/totara/', states: ['mature','thriving','wilting'],
              growing: 2, anchor: 'base', footprint: [234, 500], tier: 'h4' },
    ...
  },
  fauna: {
    kerangi: { dir: 'fauna/kerangi/', variants: {
                 low:  { seq: 'flying', pad: 2, count: 8  },
                 high: { seq: 'state',  pad: 5, count: 16 } },
               artAngle: 0.74, mirror: 'heading' },
    ...
  },
  fx: { ... }, terrain: { ... }, ui: { ... }
};
```

with a single accessor:

```js
Assets.frame('fauna.kerangi', 'flying', 3)   // -> p5.Image | atlas frame
Assets.meta('plants.totara')                 // -> { anchor, footprint, tier }
```

Four things this buys, all of which are otherwise paid 113 times:

1. **The atlas swap becomes one file's problem.** `BUILD_V3.md` §2.4 wants five atlases
   with a JSON frame map. If every consumer already goes through `Assets.frame()`, the
   atlas lands behind that call and nothing above it changes. If they don't, the atlas
   touches every renderer.
2. **`anchor` / `scale` / `footprint` become available to fauna**, which they will need —
   §4.2 of the manifest has a 234×500 `h4` tier and a dimorphism pair that differ in
   *build*, not scale.
3. **The manifest is checkable.** One pass over `ASSETS` can assert every declared file
   exists, in `tools/bootcheck.js`, before a browser is involved. The
   `moa_juvenile.png` bug (§7.2) was exactly this class and it survived for months
   because the failure callback was `() => {}`.
4. **The lazy-load split gets somewhere to live.** `BUILD_V3.md` §5.3 calls preloading
   only the ambient audio bed the single highest-value cold-boot change. Same argument
   applies to art: `h4` emergents and the four button glyphs are first-frame; huia
   sprites are not.

`ArtMode` generalises to `variants` and stays as-is otherwise. `SpriteAngle` is a
rendering concern and stays in `entity_sprites.js`.

### 3.2 Naming, and the folder

`sprites/` is flat, holds ~90 files heading for 158, and follows four conventions at
once:

```
Beech_Mature.png            PascalCase subject, PascalCase state
moa_walk_1.png              snake_case, unpadded index
LB_moa_walk_01.png          initialism prefix, zero-padded index
EylesHarrier_State_00000.png   PascalCase, 5-pad
```

Plus `mantis_talk.png`, left over from the deleted tutorial, and `_retired/` doing the
right thing already.

**Proposal — one rule, written into `TEMANAWA_SPRITE_BRIEF.md` so the artist gets it
rather than inferring it:**

```
sprites/<group>/<subject>/<subject>_<state>_<nn>.png

group    plants | fauna | terrain | fx | ui
subject  lowercase snake_case, te reo where the plan uses te reo (kerangi, not eagle)
state    lowercase; mature|thriving|wilting|dormant|flowering|growing for plants,
         idle|walk|flying|dash|perched for fauna
nn       zero-padded 2, always present even for single frames (_00)
```

Two reasons this is worth the rename churn now rather than at 158 files: the atlas packer
wants a predictable path, and `_<nn>` always present removes the "is it `_1` or `_01`"
branch from every loader — which is the branch the juvenile bug hid in.

`_retired/` stays. `mantis_talk.png` joins it.

---

## 4. Splitting `sketch.js`

1,038 lines holding five unrelated things: p5 entry points, `CONFIG`, three big data
tables, the `Game` class, and colour utilities. `BUILD_V3.md` §2.1 already calls for the
split; this is the concrete cut.

### 4.1 The cut

| New file | From `sketch.js` | Lines | Why now |
|---|---|--:|---|
| `TeManawa_config.js` | `CONFIG`, `recalculateLayout`, `applyLevelToConfig` | ~180 | Phase 4 adds field coefficients here. Everything reads it; it should not sit inside the file that owns `draw()` |
| `TeManawa_flora.js` | `PLANT_TYPES`, `PLANT_SPRITE_SETS` | ~120 | **The plan names this file.** Phase 5 replaces the table wholesale (`PLAN_V2.md` §2.4) — much easier as its own file |
| `TeManawa_palette.js` | `fillColor`, `strokeColor`, `CACHED_COLORS`, `initCachedColors` | ~70 | Half of `CACHED_COLORS` is dead economy UI (§5) |
| `TeManawa_game.js` | the `Game` class | ~340 | The thing Phase 4 and 6 actually edit |
| `TeManawa_main.js` | `preload`, `setup`, `draw`, `windowResized`, `scaleCanvasToFit`, `initializeRegistry`, input handlers, FPS | ~200 | What's left is a proper entry point, and small enough to read in one go |

`sketch.js` disappears. `index.html` gains five lines and loses one.

Mechanical, no behaviour change, and verifiable: `tools/bootcheck.js` loads scripts by
parsing `index.html`, so if the order is wrong the harness fails immediately rather than
in a browser.

### 4.2 `BIOMES` and `PLACEABLES` are data, not engine

**`BIOMES` — done, and it was worse than "misplaced".** It was a full *second copy* of the
biome table, elevation bands and ground colours included, and it never reached the screen:
`TerrainGenerator` is constructed with `Game.activeBiomes`, which is `levelDef.biomes`. The
engine-side copy was only ever handed to `REGISTRY.registerBiome()`. See §7.3.

Deleted. `levelDef.biomes` is the single source of truth, registration moved into
`Game.loadLevel()` so the registry cannot hold anything the terrain isn't rendering, and
the table in `levels/level_temanawa_scaffold.js` now carries a header documenting what each
field controls visually — since it is now the one place the ground look is authored.

`PLACEABLES` (~215 lines, nine entries) is the awkward one. The economy is gone, so
`cost` and `icon` are dead, but the *effects* are the Button 2–4 substrate for Phase 6 —
`disturb()` will want feeding radii, storm distraction and shelter. **Proposal:** move it
to `TeManawa_placeable.js`, next to the class that consumes it, and strip the dead fields
in the same commit so nobody has to guess which half is live.

---

## 5. Economy residue

Phase 1.5 stripped the economy well — `MauriManager`, the toolbar, goals, win/lose and
level select are all genuinely gone. What is left is the *shape* of it in the config, and
it misleads:

| Residue | Where | Why it matters |
|---|---|---|
| `gameAreaX/Y/Width/Height`, `get width()`, `get height()` | `CONFIG` | Now always equal to the canvas. But simulation code reads `CONFIG.width` — is that the canvas or the play area? It used to be a real distinction. Collapse to `canvasWidth`/`canvasHeight` |
| `rightSidebarWidth/X`, `minSidebarWidth`, `maxSidebarWidth`, `sidebarWidthRatio` | `CONFIG` | Written by `recalculateLayout`, read by nothing |
| `topBarHeight`, `bottomBarHeight` | `CONFIG` | Superseded by `InstallHUD.TOP_H` / `BOT_H` |
| `minAspectRatio`, `maxAspectRatio` | `CONFIG` | Landscape-only clamps; `recalculateLayout` no longer uses them |
| `zoom` (2.5) | `CONFIG` | Superseded by `viewZoom`. Still feeds `terrain.worldWidth`, which nothing reads — `Simulation` uses `mapWidth` |
| `fullscreen: true` | `CONFIG` | Permanently true. Guards a dead branch in `Game.isInGameArea` and `_updateViewTransform` |
| `targetPopulation`, `survivalTimeGoal` | `CONFIG` | Win conditions. No win state exists |
| `cost`, `icon` (emoji) | `PLACEABLES` × 9 | No economy; `BUILD_V3.md` §3 rules out emoji for accessibility |
| `LEVEL_SELECT`, `MENU`, `PAUSED`, `WON`, `LOST` | `GAME_STATE` | Only `PLAYING` is ever set |
| `placementValid`, `spacingValid`, `menuBg`, `btnHover`, `notifSuccess`… | `CACHED_COLORS` | ~20 of 28 entries are toolbar/menu/placement-preview colours |

Roughly 120 lines. The reason to do it is not the line count — it is that `CONFIG` is the
first file anyone opens, and about a third of it currently describes a game that no
longer exists.

**One caveat:** `Game.isInGameArea` and the non-fullscreen branch of
`_updateViewTransform` should be simplified but not deleted blind — `isInGameArea` is
still called on click. Do it with the harness running.

---

## 6. Hygiene and docs

### 6.1 `CLAUDE.md` — done

Added at the repo root. Load-order constraints, how to run, the naming rule, which doc is
authoritative, and "run `node tools/bootcheck.js` before every commit". The information
existed; it was spread across four md files and three code comments.

### 6.2 `md/` needs an index — done

17 files, 5,793 lines, with real overlap and no statement of what supersedes what:

- `TEMANAWA_PLAN.md` (281 lines) is superseded by `TEMANAWA_PLAN_V2.md` (596) but says so
  nowhere
- `TEMANAWA_ECOLOGY.md` (536) overlaps five `TEMANAWA_ECOLOGY_*.md` regional files (2,150)
- `TEMANAWA_FAUNA.md` and `TEMANAWA_FAUNA_POOL.md` overlap
- `TEMANAWA_CONCEPT_ECOLOGY_FIRST.md` reads as a superseded pitch

Nothing should be deleted — the research is the value, and `BUILD_V3.md` §4.2 leans on
`FAUNA_POOL.md`. But a contributor who opens `md/` and reads `TEMANAWA_PLAN.md` will build
the wrong thing. `md/README.md` now states the spine (`PLAN_V2` → `BUILD_V3` →
`TERRAIN_PLAN`), marks the superseded documents, and groups the research.

### 6.3 Committed junk — done

- **`tools_bootcheck.js`** at the root: a stale copy of `tools/bootcheck.js`, differing by
  97 lines, with an absolute path hard-coded to a machine that no longer exists. Deleted.
  `tools/bootcheck.js` (which resolves its own path) is the live one.
- **`.fuse_hidden0000000700000001`**: 73 kB, **tracked in git**, and an old copy of
  `sketch.js` — it still contains `tutorialMantisSprite` and `splashScreenMoa`, both
  deleted in Phase 1.5. A FUSE artifact that got committed. Untracked, deleted,
  gitignored.
- `.gitignore` gained `.fuse_hidden*`, art working files (`*.pxo` — one is currently
  committed), and the usual OS noise.
- `Avian_Age_TeManawa_Proposal.docx` at the root is fine but would read better in `md/`
  or a `docs/` folder. Not moved — it may be a shared link target.

---

## 7. Three live bugs

### 7.1 The `createGraphics` leak — fixed

`_bakeAllSeasonBuffers()` assigned four fresh `createGraphics` buffers over the previous
four without calling `remove()`. A p5 graphics buffer is a real canvas element with
GPU-backed storage; dropping the JS reference does not release it.

At 512² that is ~4 MB per terrain regeneration. `Kiosk.reseedEvery = 12` fires a full
`Game.init()` on every 12th attract reset, so on a normal museum day this leaked
continuously, and the nightly 03:00 reload was the only thing containing it.

`BUILD_V3.md` §2.3 predicted this exactly — *"createGraphics buffers must be remove()d
when replaced. An interval re-bake is a leak by construction, and an installation that
runs for months will find it."* It was already live, before the interval re-bake landed.

Fixed: `TerrainGenerator.disposeBuffers()`, called before each re-bake and before
`Game.init()` replaces the generator. `tools/bootcheck.js` now asserts all four are
freed. **Worth re-reading §2.3's warning when the Phase 3 interval re-bake lands** — the
same mistake will be available again in the vegetation buffer.

### 7.2 `noiseScale` would have drifted

Not yet a bug, but one move away. `CONFIG.noiseScale` is authored per level and read
directly by `TerrainGenerator.fractalNoise`. The obvious way to implement the adaptive
terrain mode was to rescale `CONFIG.noiseScale` on the way in — which compounds across
regenerations, so the terrain would drift smoother every reseed and nobody would connect
it to the resize. The effective value now lives on the generator instance
(`this.noiseScale`) and `CONFIG` keeps the authored number untouched. Flagged because the
same trap exists for every other level parameter Phase 4 wants to modulate: **modulate on
the instance, never write back to `CONFIG`.**

### 7.3 Editing a biome's colours did nothing — fixed

Reported symptom: changing `colors` in a biome definition had no effect on screen.

Two independent causes, and the first is the interesting one.

**A duplicate biome table.** `const BIOMES` in `sketch.js` and `levelDef.biomes` in
`levels/level_temanawa_scaffold.js` were near-identical copies. `TerrainGenerator` is
constructed with `Game.activeBiomes` = `levelDef.biomes`, so **the level's table is the one
that renders** and the engine-side one drew nothing.

What made it costly rather than merely untidy is that the dead copy looked *more*
canonical than the live one: it sat in the engine file next to `PLANT_TYPES` and
`PLACEABLES`, it was registered into `REGISTRY`, and `level_format.js`'s `validate()`
checked against it. Editing it produced no error, no warning, and no change. The two had
already drifted — the dead copy's `montane` and `subalpine` listed `patotara`, retired in
Phase 1.5.

Deleted, with a comment in its place explaining why there is no engine-side biome table.
`Game.loadLevel()` now registers `levelDef.biomes`, so the registry cannot disagree with
the renderer again, and `tools/bootcheck.js` asserts both that no global `BIOMES` exists
and that `terrain.biomes === currentLevel.biomes` by identity.

**Unreachable elevation bands.** The second, quieter cause. `getBiomeFromElevation` scans
bands in ascending `minElevation` order and takes the **first** match, so overlapping bands
do not blend — the lower one shadows the higher one, and a fully shadowed band never draws
at all. Nothing in the data looks wrong; each band reads fine on its own.

The scaffold has a live instance: `alpine` declares `0.77–0.90`, but `subalpine` runs to
`0.80`, so alpine only ever renders `0.80–0.90`. Edit alpine's lowest ramp colour and about
a quarter of the band you were aiming at belongs to something else.

`validateBiomeBands()` in `level_format.js` now runs at level load and reports declared
versus effective range per biome, plus fully shadowed bands, uncovered gaps, and bands too
narrow to see. It sweeps the elevation range using the renderer's own first-match rule
rather than deriving intervals by hand, so it cannot drift from the behaviour it describes.
It warns; it does not correct. Band boundaries are an art-direction decision.

**Not changed:** the alpine/subalpine overlap itself, and the near-black `subalpine` ramp
found in the dead table — that read as a probe to see whether *anything* would change
rather than an intended palette. Both are yours to set, now that setting them works.

**Still worth knowing when retuning the ground:** colours are baked into four season
buffers at `generate()` time, not read per frame, so a change needs a page reload. Three
things are also not authored per biome — snow blends in from the snow biome's ramp above
`TerrainGenerator.seasonSnowLines`, winter frost is a hardcoded live tint in
`Game.render()`, and contour lines hard-replace the ramp on `CONFIG.contourInterval`
multiples rather than blending. All three are documented in the level file's new header,
and all three are candidates for the palette split in §8 step 6 if the current model
starts to fight you.

---

## 8. Suggested order

Sequenced so each step is verifiable by the harness on its own, and so the art is
unblocked first.

| | Step | Risk | Unblocks |
|---|---|---|---|
| 1 | **Asset manifest + naming convention** (§3) | Low — mechanical, harness-checkable | The 113 new assets, and the atlas |
| 2 | **Economy residue strip** (§5) | Low, with one caveat on `isInGameArea` | Reading `CONFIG` without archaeology |
| 3 | **Split `sketch.js`** (§4.1) | Low — pure file moves | Phase 4 landing in small files |
| 4 | **`PLACEABLES` → `placeable.js`**, dead fields stripped (§4.2) | Low | Reading the file without guessing which half is live |
| 5 | **One base terrain buffer instead of four** (`TERRAIN_PLAN.md` §7) | Medium — real rendering change | Phase 3's interval re-bake, at 4× less bake cost |
| 6 | **Ground palette split from biome mechanics** — *only if the current model fights you* | Medium | Retuning the whole ground look from one place |

Steps 1–3 are structure and should land before Phase 3. Step 5 is already specified in
`TERRAIN_PLAN.md` §7 and `BUILD_V3.md` §2.3 and is listed here only because the adaptive
terrain mode makes its cost visible: a refit currently re-bakes four buffers where one
would do.

**Step 6 is deliberately conditional.** It was considered and declined as premature (§7.3):
lift `colors` / `contourColor` / the season snow lines / the frost tint out of the biome
definitions into one palette table, so biome defs keep only mechanics — which is also
`BUILD_V3.md` §2.2's decoupling (*"`getBiomeAt` survives as a rendering concern only"*)
arriving early. The argument for waiting is that the current model has exactly one problem
and it was the duplicate table, now fixed. The signals that would make it worth doing:

- retuning the ground means editing more than a handful of hex values in more than one file
- two biomes want to share a ramp, or one biome wants to change ramp by climate state
- the four-buffer bake becomes the reason you can't iterate (step 5 fixes that more cheaply)

The natural time is alongside step 5, since both touch `_bakeSeasonBuffer`. A useful
companion either way is a **re-bake path that skips noise regeneration** — colours only
affect `_computeBaseCellColors` and the season bakes, not `heightMap` or `biomeIndexMap`, so
re-colouring is ~15 ms rather than the ~1 s of a full `init()`. That turns palette work into
a live loop instead of a page reload per attempt.

### Already done in this pass

- Adaptive terrain footprint mode — `CONFIG.terrainFit`, see §9
- The `createGraphics` leak (§7.1)
- The duplicate biome table deleted, and biome band validation added (§7.3, §4.2)
- `CLAUDE.md`, `md/README.md`, `.gitignore` (§6)
- `tools_bootcheck.js` and the committed FUSE artifact deleted (§6.3)
- `tools/bootcheck.js` gained two sections: **terrain footprint** (aspect sweep against the
  §5.2 cell budget, feature-size invariance, a live refit round-trip, buffer disposal) and
  **biomes** (no global `BIOMES`, registry/renderer identity, shadowed bands, gaps, clean
  partitions). It also takes `TERRAIN=fit|square` and `ART=low|high` so a whole boot can be
  exercised in either mode

### Explicitly not proposed

- **A bundler or ES modules.** `BUILD_V3.md` §5.3 wants a single bundled file for cold
  boot, and that is right eventually, but classic scripts with a hand-ordered
  `index.html` are working, the harness reads that order, and there is no build step to
  break. Bundle at Phase 8 with the rest of the kiosk hardening.
- **A test framework.** `tools/bootcheck.js` is better suited to this codebase than Jest
  would be: it boots the real thing headless and it has already caught two production
  bugs. Keep extending it.
- **Renaming the `TeManawa_` prefix.** It's verbose, and it makes every file
  unambiguous in an editor tab strip and in `index.html`. Leave it.
- **Touching `simulation.js`, `moa.js`, `eagle.js`, `boid.js`.** They're large, but they
  are cohesive and Phase 7 will rework them against the fields anyway. Splitting them now
  would be churn against a moving target.

---

## 9. The adaptive terrain mode, as built

`CONFIG.terrainFit`, `'square' | 'fit'`.

**`'square'`** is the Phase 1.5 behaviour, unchanged and still the default: a
`mapGrid × mapGrid` world letterboxed into the panel. On the 9:16 kiosk the world covers
about 56% of the screen.

**`'fit'`** takes the screen's aspect at the **same cell count**:

```
cols = grid·√a     rows = grid/√a      a = canvasWidth / canvasHeight
```

so `cols·rows ≈ grid²` at every aspect. On 1080×1920 that is 384×682 = 261,888 cells
against 512² = 262,144 — the same simulation cost, and no letterbox.

Holding the *count* rather than the *cell size* is the important part. `mapGrid` is the
number every per-cell system scales on — the pixel bake today, Phase 4's four
`Float32Array` fields next — so a fill mode that grew the grid with the aspect would
silently blow the `BUILD_V3.md` §5.2 budget on a tall panel and pass on a landscape dev
monitor. The harness now sweeps six aspect ratios and asserts the cell count stays within
2% of budget on all of them; the worst case is 100.3%.

Two consequences worth knowing:

- **`noiseScale` is rescaled** by the ratio of the two view zooms, so a landform keeps
  the same apparent size on screen. Without it, `'fit'` reads as a different level rather
  than the same level shaped to the screen. The rescaled value lives on the generator
  instance, not in `CONFIG` — see §7.2.
- **Beyond `terrainFitMaxStretch` (2.0) the aspect clamps** and the remainder letterboxes
  again. A 3:1 video wall should not get a 3:1 world: the coastline banding in
  `getIslandFalloff()` runs along the X axis and stops reading much past 2:1.

**Switching costs a full `Game.init()`** — new noise over every cell, four season bakes,
and a new `Simulation`, because the spatial grids are sized from the terrain dimensions.
~1 s, and the running ecosystem does not survive it. Three entry points, all of them
authoring-side:

| | |
|---|---|
| `?terrain=fit` on the URL | Read before `loadLevel()`, so the first terrain is built at the right footprint rather than built square and rebuilt |
| `SHIFT+F` | Toggle. Not reachable on the wall — the kiosk lockdown limits input to `1`–`4` |
| Window resize | Debounced 400 ms, `'fit'` mode only, and a no-op if the derived grid hasn't moved. Borrows the kiosk crossfade so the rebuild reads as a transition |

**It is deliberately not reachable from the attract loop.** `Kiosk.resetToAttract()` keeps
using `resetEcosystem()` at 17–31 ms. A refit is ~1 s and belongs nowhere near a visitor
walking up.

**Open question for you, not for the code.** `'fit'` and the Phase 3 authored heightmaps
pull in opposite directions: `TERRAIN_PLAN.md` §9 wants two hand-authored square
heightmaps rasterised into the grid, and a non-square grid means either authoring at the
panel's aspect or sampling a square source non-uniformly. The mode is built so that
choice can be deferred — a level can declare `terrainFit: 'square'` and pin itself — but
it should be made before the heightmaps are drawn, not after. Sampling a square authored
source into a 384×682 grid is straightforward if the source is drawn with margin; it is
not if it is drawn tight.
