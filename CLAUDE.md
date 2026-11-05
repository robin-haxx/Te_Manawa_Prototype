# Te Manawa — working notes

**Avian Age: Te Manawa** — a standalone museum installation. An ambient top-down diorama
of the Manawatū across ~1 Ma to 25.5 ka on a 4K wall, driven from a 1080p touchscreen
console beside it; unattended, no operator, no network. Vanilla JavaScript on p5.js,
classic scripts, no build step. Running the install: `md/TEMANAWA_OPERATIONS.md`.

> **Governing principle** (`md/TEMANAWA_PLAN_V3.md` §0):
> *This is a cartoon seen from above, not a survey of the Manawatū.*

A fork of the Mauri engine, stripped of its economy. If something in the code looks like
it belongs to a game — currency, win states, a toolbar, placeable items with costs — it is
residue, not design (`md/archive/TEMANAWA_REORG.md` §5; the placeable path is still wired
but nothing calls it). The plant goals (`TeManawa_goals.js`) are the exception: new design,
a question a plant answers, not a score.

---

## Run it

`loadImage` from `file://` is blocked by Chrome's CORS policy, so it must be served:

```
node tools/serve.js          # then open the printed 127.0.0.1 URL — add ?dev=1 to author
```

**`?dev=1` is the authoring switch.** Without it the page behaves as the wall: only `1`–`5` and the
time dial reach the game, and a `draw()` error is logged and recovered instead of thrown. With it,
every authoring key works and a `draw()` error throws as normal. The harness runs with `?dev=1`.

The touchscreen console is `/secondscreen/` on the same server; the two talk over
`BroadcastChannel`, so open both in one browser profile. The museum runs the **kiosk shell** instead
(`electron/`): `cd electron && npm ci && npm start` runs it on the repo, windowed, with `?dev=1`.
**The release build is `node tools/make_deploy.js --electron --platform win32 --smoke --zip`**
(`md/TEMANAWA_HANDOFF.md`): it copies only what the wall needs, fails on any missing asset reference,
stamps `VERSION.txt`, boots both pages headless, and wraps them in the shell. The install itself (windows, flags,
recovery, what to deploy) is `md/TEMANAWA_OPERATIONS.md`.

`node tools/serve.js 8093 --export` (dev only) also accepts `POST /__export?path=…` and writes the
body under `exports/`. Load `tools/export_frames.js` in the page and call
`TM_EXPORT.run(TM_EXPORT.peaks(), 'terrain_geology_timeline/peak')`. Take terrain snapshots at the
glacial and interglacial PEAKS, not at the mid-swing boost stops, which hide the coast's breathing; see
`exports/terrain_geology_timeline/README.md`. Stop the browser preview before you judge harness timings:
a running sim makes soft resets and `init()` read 3–10× slower.

## Test it — before every commit

```
node tools/bootcheck.js
```

A headless harness: stubs p5 and the DOM, loads every script in `index.html` order, runs
`preload`/`setup`/120 `draw` frames, presses all five buttons, cycles the debug overlay,
times six soft resets against a full `init()`, checks the climate curve against five
dated facts, and sweeps the terrain footprint across six aspect ratios.

**It has caught two production bugs that reading the code did not.** Extend it rather
than adding a test framework. If a section prints `FAILURES`, that is a real regression.

---

## Which document is authoritative

| Order | Document | Role |
|---|---|---|
| 1 | `md/TEMANAWA_PLAN_V3.md` | **The design spine.** Build Plan v3 — current design, phase status, road ahead. Where anything disagrees with it, it wins |
| 2 | `md/TEMANAWA_BUILD_V3.md` | Architecture, performance budgets, the asset manifest (technical companion) |
| 3 | `md/TEMANAWA_SECOND_SCREEN.md` | The interaction model: the console, the bus, the paused clock, the boost. Wins over the spine on interaction |
| 4 | `md/TEMANAWA_GEOGRAPHY.md` | The terrain: SVG skeleton, elevation, the deep-time morph (the sea is `TEMANAWA_COAST_PLAN.md`) |

`md/README.md` indexes the rest: live references in `md/`, the ecology research in
`md/ecology/`, built and superseded plans in `md/archive/`. `MISTAKES.md` (repo root) is the incident log
behind the rules below — what was tried, why it failed, and the rule that stops a
repeat. Newest first; add to it when a mistake is worth not repeating.

---

## Layout

```
index.html                 script load order — it is hand-ordered and it matters
TeManawa_kiosk.js          watchdog, idle/attract, soft reset, error ring buffer
TeManawa_audio.js          ambient bed + event sounds — off for opening: enabled=false gates loading and playback
TeManawa_registry.js       species/plant/biome/placeable registry + validation
TeManawa_spatial.js        spatial hash grids
TeManawa_simulation.js     the world: entity lists, update/render loops, spawning, disturb()/warpAt
TeManawa_plant_defs.js     the flora table (coldTolerance 0 = tree-fern-sensitive → 1 = tussock-hardy)
TeManawa_species_data.js   MOA_SPECIES, EAGLE_SPECIES
TeManawa_entity_sprites.js SpriteAngle, ArtMode, ART_SETS, EntitySprites
geo/manawatu.geo.js        SVG-authored geography skeleton (ranges + river) — see TEMANAWA_GEOGRAPHY.md
TeManawa_terrain.js        TerrainGenerator — geo skeleton, noise, biome classify, 3/4 relief bake, LOOK look-dev
TeManawa_projection.js     plan-oblique 3/4 projection — pure, p5-free (like climate.js)
TeManawa_seasons.js        SeasonManager — the glacial clock (four buffers = four glacial stages)
TeManawa_atlas.js          SpriteStrips: one strip PNG per animation (water decals, wind gusts)
TeManawa_water.js          WaterLayer: river flow decals, eels/fish, sea shimmer over the baked water
TeManawa_boid.js           steering base class
TeManawa_moa.js            Moa — the grazer guild's base class; these extend it:
  _goose.js  _takahe.js  _kiwi.js  _finsch_duck.js
TeManawa_eagle.js          EylesHarrier (kērangi); the base-type key stays 'eagle'
TeManawa_kereru.js         Kereru — the flighted engine and seed disperser; these extend it:
  _kokako.js  _huia.js  _tui.js (tūī extends kōkako)
TeManawa_egg.js  _plant.js  _placeable.js   (placeable: only placeableSprites is live)
TeManawa_outline.js        live fauna outline (PROTOTYPE: bush moa + kererū) — recolours the baked border, 1 quad/creature
TeManawa_spriteatlas.js    runtime texture atlas: packs every loaded sprite at setup(), wraps image()
TeManawa_glbatch.js        the default WebGL entity layer (DOM-stacked); falls back to 2D
TeManawa_climate.js        Climate.at(yearsBP) — pure, p5-free, LR04-anchored; SEA_ANCHORS
TeManawa_time.js           DeepTime — yearsBP is the authoritative clock; the time dial
TeManawa_goals.js          plant goals: the visitor line + boost verdicts (TM_GOALS book) — pure, p5-free
TeManawa_hud.js            InstallHUD: timeline, visitor year/goal, the five buttons (debug), storm/ash/wind FX
TeManawa_rivernames.js     river names in white capitals along the channels, over the world, clear of the HUD (labelKeepOut)
TeManawa_palaeo.js         the land before the window: the 4 Ma → 1 Ma land-only attract sequence (idle + end-of-window), its own clock, the names of the time — see TEMANAWA_PALAEO_ATTRACT.md
TeManawa_debug.js          six-panel overlay. D cycles, SHIFT+D dumps JSON
TeManawa_plant_debug.js    plant sprite gallery (hold D 3 s)
TeManawa_UI.js             thin host; delegates to InstallHUD
TeManawa_level_format.js   level schema + resolution
levels/                    level definitions — the scaffold carries the ground look, caps and ecology knobs
TeManawa_devtools.js       LOOK / GEN console dev tools (B/G/N) — see TEMANAWA_DEVTOOLS.md
TeManawa_sketch.js         CONFIG, Game, and the p5 entry points
TeManawa_bus.js            the console bus (BroadcastChannel 'temanawa'): intents in, telemetry out — loads after sketch.js
secondscreen/              the touchscreen console page (static DOM) — see secondscreen/README.md
tools/                     serve.js (also a module: start()), bootcheck.js, make_deploy.js (the release build), shell_check.js (drives the shell), svg2geo.js, export_frames.js, outline_plants.js, shot.js
electron/                  the kiosk shell: one executable = serve.js + wall window + console window (main.js) — see electron/README.md
deploy/                    what ships beside the executable: OPERATOR_QUICKSTART.md, temanawa.config.json, the Windows autostart scripts
geo/                       manawatu.svg (authored) + manawatu.geo.js (emitted)
md/                        live docs — start at md/README.md; md/ecology/ research, md/archive/ built plans
exports/                   terrain snapshot sets (dev reference, not needed on the wall)
sprites/  audio/  typefaces/  research/
```

### Load order constraints

`index.html` is hand-ordered and the comments in it explain why. The ones that will bite:

- `kiosk.js` **first** — its error handlers must be armed before anything else loads
- `climate.js` and `time.js` **before** `hud.js` — the HUD renders from them
- `goals.js` **before** `hud.js` and `bus.js` — the HUD draws its line, the bus judges each boost
- `hud.js` **before** `UI.js` — `UI.js` reads `InstallHUD.TOP_H`
- `outline.js` **before** `spriteatlas.js` — `setup()` builds the border masks before the atlas packs them beside their sprites
- `sketch.js` **last** of the engine — it owns `setup()` and `draw()`; only `bus.js` follows it,
  because it reaches for `game`, `InstallHUD` and `DeepTime`

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
`LB_moa_walk_01.png`). New art follows the rule; see `md/archive/TEMANAWA_REORG.md` §3.2.
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

**p5's Friendly Error System stays off.** `p5.min.js` 1.11.11 ships it live, and it roughly
doubled every terrain bake and cost ~1.5 ms a frame. `applyFriendlyErrorsFromURL()` (sketch.js)
disables it at script load; `?fes=1` turns it back on for authoring.

**A sliced job's chunks are sized in cells, not rows.** `morphStep` checks its deadline only
between chunks, so one chunk is the real per-frame floor (`TerrainGenerator.MORPH_CHUNK_CELLS`).
Boot and morphs bake at one scale (`LOOK.bakeScale`; `CONFIG.morphBakeScale: null`). A
mismatch rebuilds the paint grid and noise fields on the first morph after every boot.

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
| `pixelDensity` | **1** — never raise it; use `CONFIG.spriteSupersample` instead (below) |
| Soft reset | the attract landing (`resetEcosystem()`): **10–25 ms** budget (11–36 ms, Chrome, 2026-11-04). A reset must never touch the network |
| Photosensitivity | ≤ 3 luminance transitions/sec; large changes ramped ≥ 500 ms |

`CONFIG.mapGrid` is a **cell budget**, not a width — both terrain footprint modes spend
`mapGrid²` cells. It is the single most expensive number in the project.

**Split-resolution rendering (`CONFIG.spriteSupersample`, default 2; `?sprites=1|2|3`).**
The backing canvas is `spriteSupersample×` the logical 1080 size and a single `scale(SS)`
in `draw()` renders sprites + HUD at that higher resolution (the source PNGs carry 2–4×
the detail). The **terrain opts out**: it is composited into a 1080 offscreen buffer
(`Game._terrainLayer`; its `pixelDensity` is currently **.5**, so the backing is 960×540 at
16:9) — the season-buffer blit, water decals, the frost/ash/haze washes'
source, and the `saturate()` health filter all run at 1080 — then blitted up as one quad,
so the ground stays cheap while the cast is crisp. `pixelDensity` must stay **1** (a p5
density of 2 would 4×-back the *whole* frame, terrain included, defeating the split).
`SS = 1` reproduces the old single-1080-canvas path exactly. Mouse coords are in backing
pixels, so `mousePressed`/`mouseReleased` divide by `SS`. See `Game._composeTerrainLayer`.

---

## Two kinds of reset — do not conflate them

| | Soft reset | Hard reload |
|---|---|---|
| Trigger | the attract landing (idle, end-of-window); error recovery | watchdog stall, crash, nightly 03:00 |
| Path | landing: `Kiosk.landAttract()` → `Game.resetEcosystem()` · recovery: `Kiosk.resetToAttract()` → `Game.applyEruptionAt()` (a terrain morph) | `location.reload()` |
| Cost | landing **11–36 ms** · recovery **~1.3 s** (Chrome, 1920×1080, 2026-11-04) | several seconds: preload plus a full `init()` (~6.5 s, Chrome) |
| Frequency | hundreds a day | ideally once a day |

The harness's "soft resets" line times `resetToAttract()`, the recovery path, so it reads in seconds.

`Game.init()` is the expensive one (several seconds — 7.6–8.5 s in the harness on 2026-11-02; the
terrain bake is heavy) because it regenerates terrain noise over every cell and bakes four season buffers.
`resetEcosystem()` keeps the terrain and replaces only the living world. Every 12th reset reseeds the land via `init()` so it varies across a
day. **Nothing on the visitor path may call `init()`.**

**The attract itself is a sequence, not a swap** (`TeManawa_palaeo.js`, `md/TEMANAWA_PALAEO_ATTRACT.md`).
Idle and end-of-window call `Palaeo.begin()`: a ≥ 500 ms dip to dark, the land re-baked to 4 Ma under it
(the every-12th `init()` reseed happens here, under the dark, with the heartbeat stamped), then about
4 minutes of the land alone (`TM_PALAEO.kyrPerSec` plus the holds) — the Whanganui Basin, the basement finger, the Manawatū Strait opening and closing, the
east filling out, the ranges — through the terrain's own sliced morph at pre-window dates, paced so no swap
ever lands under a live crossfade (`terrain._morphCuts` must stay 0). It lands on the **Kidnappers
eruption**: the eruption charge's rumble and flash, then the ash cloud, and under its opaque backdrop
`Kiosk.landAttract()` → `resetEcosystem()` on the 1 Ma land (`TM_PALAEO.eruptLanding`; false = the
older dip to dark). DeepTime stays parked throughout (it cannot represent 4 Ma); the
sequence keeps its own clock and replaces the HUD with one caption. Any input, local or over the bus,
skips to the landing. The **error-recovery path never runs it**: a recovery is the synchronous
`resetToAttract()`. `TM_PALAEO.enabled = false` restores the older eruption-staged attract.

---

## Authoring keys

**Locked on the wall: open the page with `?dev=1` to use them.** Without it `Kiosk.keyAllowed` lets
through only `1`–`5` and the time dial; any other key is presence only (it restarts the idle timer and
skips a running attract). Anything that polls a key itself must ask `Kiosk.keyAllowed` too, as
`PlantGallery.tick` does (`MISTAKES.md`).

| Key | |
|---|---|
| `1`–`5` | The five baseline buttons (deep time, FOREST growth, TUSSOCK growth, storm, eruption) — FOREST helps in the interglacial, TUSSOCK in the glacial; the wrong one for the climate desaturates the scene. On the wall the console does this |
| `]` / `[` / `\` | **Time dial** (macro-pad encoder: CW / CCW / push) — a standing fast-forward over 30 detents, 0 (geology paused) → 5,000 yr/s (the whole window in ~3¼ min), power-curve so the low end is fine. The rate eases (0.6 s), a boost timelapse never runs slower than it, and the detent survives soft resets. The mouse wheel turns it too. Works in the sim window and the console (relayed over the bus as `{type:'dial'}`). Keys in `DeepTime.DIAL_KEYS` + `secondscreen/input.js` |
| `D` / `SHIFT+D` | Cycle the debug overlay / dump state as JSON. Hold `D` 3 s for the plant sprite gallery |
| `R` / `C` | The range-authoring overlay (footprints + spine axes) / the climate-affinity tint on the cast |
| `SHIFT+F` | Toggle the terrain footprint between `square` and `fit` — **debug overlay on only** (a full synchronous rebuild) |
| `P` | Play the attract sequence now (the land before the window, 4 Ma → 1 Ma), any time. While it runs the **time dial** (`]` / `[` / `\`, the wheel, the console's dial) is the sequence's: faster / slower through a pause into **reverse**, push = ×1 forward; any other key skips to the landing. Slowed to ≤ 5 kyr/s the pre-window sea breathes a 41-kyr cycle. On the wall the sequence comes from the idle timer and the end of the window |
| `B` / `G` / `N` | Dev tools **(debug overlay on only)**: re-bake paint (`LOOK`) / apply landform (`GEN`) / new seed. Each is a ~5 s synchronous terrain bake, so they are gated behind `Debug.enabled` — a stray `B` no longer freezes the sim (and no longer collides with the second screen's `b`=boost). See `md/TEMANAWA_DEVTOOLS.md` |
| `?art=low\|high` | Sprite artwork set (which PNGs load), startup only |
| `?terrain=square\|fit` | Terrain footprint, startup only |
| `?sprites=1\|2\|3` | Backing-canvas supersample for sprites+HUD (default 2); terrain stays 1080. Startup only |
| `?fes=1` | Turn p5's Friendly Error System back on (off by default because it roughly doubles every terrain bake). Authoring only, startup only |
| `?render=2d` | Opt OUT of the WebGL renderer (aliases: `canvas`, `off`). The DOM-stacked WebGL entity layer (`TeManawa_glbatch.js`) is the **default**: it draws the sprite cast + shadows as batched GPU quads from the atlas, on a canvas stacked between the terrain (bottom) and HUD (top) — ~7× faster render at 4K. It falls back to 2D automatically if WebGL is unavailable or the context is lost. The debug overlay's PERF panel shows the live `render mode` (WebGL / 2D canvas). Startup only. Known GL-mode look compromises: water/washes render at 1080, shadows/halos via a GL disc. See the perf notes |

## Current phase

**Final testing and handoff.** The honest status is `md/TEMANAWA_PLAN_V3.md` §13; what is left is §14.
Built: the terrain (SVG skeleton, uplift/incision morph, the sea-level coast, 3/4 cel look, water layer,
river names), the glacial-cycle climate to 1 Ma with cold cover, the four eruptions, habitat health, the
disturbance clocks (`disturb()` + `warpAt`, the wetland bloom, kahikatea river recruitment), the
**second-screen console** (`md/TEMANAWA_SECOND_SCREEN.md`), the plant goals, the time dial, and the
attract sequence (**the land before the window**, `md/TEMANAWA_PALAEO_ATTRACT.md`).

**The cast** — thirteen North Island birds on dedicated multi-state art: 4 North Island moa (giant
`Dinornis`, little bush `Anomalopteryx`, Mantell's `Pachyornis` and the stout-legged `Euryapteryx`,
on the three moa sprites; the South Island upland and heavy-footed moa are defined but not founded),
the North Island goose `Cnemiornis`, the mōho / NI takahē `Porphyrio mantelli`, the North Island
brown kiwi `Apteryx mantelli` and Finsch's duck `Chenonetta finschi` (all moa-guild birds); Eyles'
harrier; and four flighted forest birds — kererū, kōkako, huia and the tūī `Prosthemadera`. The
goose/mōho/duck make the cold phase busier; the kiwi is the warm-phase counterweight, and its
soil-turning gently heals the forest floor. Every second-screen plant adds one bird, and every founded
bird is on one or two plants (`md/TEMANAWA_ENCYCLOPEDIA_FLORA.md` §2.6).

**Kiosk fixes landed 2026-11-02** (PLAN §14.1, harness "kiosk hardening"): the 03:00 reload no longer
re-fires from its own boot; keys are locked to the wall set unless `?dev`; a `draw()` error is caught
and recovered, so the p5 loop survives; a recovery aborts a running attract; the console page has its
own layer (`secondscreen/kiosk.js`); `serve.js` survives a malformed URL; audio is not loaded.

**Built 2026-11-02** (PLAN §14.2): the eruption aftermath covers **one boost/goal cycle**
(`DeepTime.AFTERMATH` — the ash no longer waits on sim-years that never pass while geology is paused);
and a **fresh goal** is drawn when the dial or a deep burst carries the clock across a glacial turn.
The harness's plant-goals failure was its white-noise terrain (the ranges barely rise there); that test
now stages the habitat.

**The harness's terrain is not the real terrain.** `noise` is `Math.random()` there, so its ranges
peak near 0.65 at every date while the real build reaches ~0.88. Test logic that needs a landform
(a habitat, a band) by staging it, not by trusting the noise (`MISTAKES.md`).

Open co-design items: `TM_PALAEO` pacing and notes, the look of the pre-window land (`LOOK.palaeo*`),
the live outline prototype, `CONFIG.mapGrid` (still 512), and the interpretation layer (PLAN §16).
