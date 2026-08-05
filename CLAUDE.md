# Te Manawa — working notes

**Avian Age: Te Manawa** — a standalone museum installation. An ambient top-down diorama
of the Manawatū across ~1 Ma to 25.5 ka, on one screen, unattended, no operator, no
network. Vanilla JavaScript on p5.js, classic scripts, no build step.

> **Governing principle** (`md/TEMANAWA_PLAN_V2.md` §0.1):
> *This is a cartoon seen from above, not a survey of the Manawatū.*

A fork of the Mauri engine, stripped of its economy. If something in the code looks like
it belongs to a game — currency, goals, win states, a toolbar — it is residue, not
design. See `md/TEMANAWA_REORG.md` §5.

---

## Run it

`loadImage` from `file://` is blocked by Chrome's CORS policy, so it must be served:

```
node tools/serve.js          # then open the printed 127.0.0.1 URL
```

## Test it — before every commit

```
node tools/bootcheck.js
```

A headless harness: stubs p5 and the DOM, loads every script in `index.html` order, runs
`preload`/`setup`/120 `draw` frames, presses all four buttons, cycles the debug overlay,
times six soft resets against a full `init()`, checks the climate curve against five
dated facts, and sweeps the terrain footprint across six aspect ratios.

**It has caught two production bugs that reading the code did not.** Extend it rather
than adding a test framework. If a section prints `FAILURES`, that is a real regression.

---

## Which document is authoritative

| Order | Document | Role |
|---|---|---|
| 1 | `md/TEMANAWA_PLAN_V2.md` | **The design spine.** Where anything disagrees with it, it wins |
| 2 | `md/TEMANAWA_BUILD_V3.md` | Architecture, performance budgets, the 158-asset manifest |
| 3 | `md/TEMANAWA_TERRAIN_PLAN.md` | Terrain and morph pipeline detail |
| 4 | `md/TEMANAWA_REORG.md` | Structural proposal — what to reorganise and in what order |

`md/TEMANAWA_PLAN.md` (no V2) is **superseded**. `md/README.md` indexes the rest.

---

## Layout

```
index.html                 script load order — it is hand-ordered and it matters
TeManawa_kiosk.js          watchdog, idle/attract, soft reset, error ring buffer
TeManawa_audio.js          ambient bed + event sounds
TeManawa_registry.js       species/plant/biome/placeable registry + validation
TeManawa_spatial.js        spatial hash grids
TeManawa_simulation.js     the world: entity lists, update/render loops, spawning
TeManawa_species_data.js   MOA_SPECIES, EAGLE_SPECIES
TeManawa_entity_sprites.js SpriteAngle, ArtMode, ART_SETS, EntitySprites
geo/manawatu.geo.js        SVG-authored geography skeleton (ranges + river) — see TEMANAWA_GEOGRAPHY.md
TeManawa_terrain.js        TerrainGenerator — geo skeleton, noise, biome classify, 3/4 relief bake, LOOK look-dev
TeManawa_projection.js     plan-oblique 3/4 projection — pure, p5-free (like climate.js)
TeManawa_seasons.js        SeasonManager
TeManawa_boid.js           steering base class
TeManawa_moa.js  _eagle.js  _egg.js  _plant.js  _placeable.js
TeManawa_climate.js        Climate.at(yearsBP) — pure, p5-free, LR04-anchored
TeManawa_time.js           DeepTime — yearsBP is the authoritative clock
TeManawa_hud.js            InstallHUD: timeline, four buttons, storm/ash FX
TeManawa_debug.js          six-panel overlay. D cycles, SHIFT+D dumps JSON
TeManawa_UI.js             thin host; delegates to InstallHUD
TeManawa_level_format.js   level schema + resolution
levels/                    level definitions
TeManawa_devtools.js       LOOK / GEN console dev tools (B/G/N) — see TEMANAWA_DEVTOOLS.md
TeManawa_sketch.js         CONFIG, Game, and the p5 entry points (see REORG §4)
tools/                     serve.js, bootcheck.js, svg2geo.js
geo/                       manawatu.svg (authored) + manawatu.geo.js (emitted)
md/                         design, build and research docs — start at md/README.md
sprites/  audio/  typefaces/  research/
```

### Load order constraints

`index.html` is hand-ordered and the comments in it explain why. The ones that will bite:

- `kiosk.js` **first** — its error handlers must be armed before anything else loads
- `climate.js` and `time.js` **before** `hud.js` — the HUD renders from them
- `hud.js` **before** `UI.js` — `UI.js` reads `InstallHUD.TOP_H`
- `sketch.js` **last** — it owns `setup()` and `draw()`

`tools/bootcheck.js` derives its load order by parsing `index.html`, so a wrong order
fails the harness immediately rather than in a browser.

---

## Conventions

**Sprite filenames** — one rule, and `_<nn>` is always present even for a single frame:

```
sprites/<group>/<subject>/<subject>_<state>_<nn>.png
group = plants | fauna | terrain | fx | ui
```

Existing files predate this and are mixed (`Beech_Mature.png`, `moa_walk_1.png`,
`LB_moa_walk_01.png`). New art follows the rule; see `md/TEMANAWA_REORG.md` §3.2.
Retired art goes to `sprites/_retired/`, it is not deleted.

**Never pass `() => {}` as a `loadImage` failure callback.** A silent failure to load
`moa_juvenile.png` meant juveniles rendered as adults for months.

**Modulate on the instance, never write back to `CONFIG`.** Level parameters in `CONFIG`
are authored values. A per-run or per-screen adjustment that writes back to `CONFIG`
compounds across regenerations — `TerrainGenerator.noiseScale` is the worked example.

**The ground look is authored in exactly one place: `levelDef.biomes`**, in
`levels/level_temanawa_scaffold.js`, which carries a header explaining what each field
draws. There is no engine-side biome table — there was, it rendered nothing, and editing it
silently did nothing for as long as anyone tried. Do not add a second one; `Game.loadLevel()`
registers the level's biomes so `REGISTRY` and `TerrainGenerator` cannot diverge, and the
harness asserts it.

**Biome elevation bands are first-match, not blended.** `getBiomeFromElevation` scans
ascending by `minElevation` and takes the first hit, so a lower band shadows an overlapping
higher one and a fully shadowed band never draws. `validateBiomeBands()` reports declared
versus effective range at load — **check the console after editing bands.** The scaffold has
a live example: `alpine` declares 0.77–0.90 and renders 0.80–0.90.

**Terrain colours are baked, not read per frame.** Four season buffers, built in
`generate()`. A colour change needs a page reload. Snow, winter frost and contour lines are
not authored per biome — see the level file header.

**`createGraphics` buffers must be `remove()`d when replaced.** This has already leaked
once, ~4 MB per terrain reseed. See `md/TEMANAWA_BUILD_V3.md` §2.3.

**Never allocate in `draw()`, and never in a reset.** `p5.Vector` churn in boid code is a
known GC source.

**No emoji in visitor-facing UI** — drawn glyphs only. Emoji render differently per
platform and carry no colourblind-safe guarantee.

---

## The numbers that constrain everything

From `md/TEMANAWA_BUILD_V3.md` §5.2, and shown live in the debug overlay:

| Limit | Value |
|---|---|
| Sim grid | **256²** long-term; **currently 512²** (`CONFIG.mapGrid`), still to drop |
| Live plant entities | ≤ 1,000 |
| Live fauna | ≤ 300 |
| `image()` calls per frame | ≤ 1,500 |
| `pixelDensity` | **1** — non-negotiable on a 4K panel |
| Soft reset | **10–25 ms** (measured 17–31). A reset must never touch the network |
| Photosensitivity | ≤ 3 luminance transitions/sec; large changes ramped ≥ 500 ms |

`CONFIG.mapGrid` is a **cell budget**, not a width — both terrain footprint modes spend
`mapGrid²` cells. It is the single most expensive number in the project.

---

## Two kinds of reset — do not conflate them

| | Soft reset | Hard reload |
|---|---|---|
| Trigger | idle, end-of-window, error recovery | watchdog stall, crash, nightly 03:00 |
| Path | `Kiosk.resetToAttract()` → `Game.resetEcosystem()` | `location.reload()` |
| Cost | **17–31 ms** | 1.5–2.5 s |
| Frequency | hundreds a day | ideally once a day |

`Game.init()` is the expensive one (~1.8 s now — the Phase 3 terrain bake is heavy) because
it regenerates terrain noise over every cell and bakes four season buffers.
`resetEcosystem()` keeps the terrain and replaces only the living world. Every 12th reset reseeds the land via `init()` so it varies across a
day. **Nothing on the visitor path may call `init()`.**

---

## Authoring keys

Not reachable on the wall — the kiosk lockdown limits input to `1`–`4`.

| Key | |
|---|---|
| `1`–`4` | The four visitor buttons (deep time, growth, storm, eruption) |
| `D` / `SHIFT+D` | Cycle the debug overlay / dump state as JSON |
| `SHIFT+F` | Toggle the terrain footprint between `square` and `fit` |
| `B` / `G` / `N` | Dev tools: re-bake paint (`LOOK`) / apply landform (`GEN`) / new seed. See `md/TEMANAWA_DEVTOOLS.md` |
| `?art=low\|high` | Sprite resolution, startup only |
| `?terrain=square\|fit` | Terrain footprint, startup only |

## Current phase

Phases 0–2 are done and **Phase 3 (terrain) is substantially built** — the 3/4 view, the
SVG geography skeleton (`md/TEMANAWA_GEOGRAPHY.md`), the deep-time morph and the cel
illustration look are all running. Currently tuning the terrain look; `CONFIG.mapGrid` is
still 512. The `md/TEMANAWA_REORG.md` §8 structural steps (asset pipeline, `sketch.js`
split) are still pending.

**Critical path is Phase 5 art: ~113 new assets, not "twenty sprites."**
