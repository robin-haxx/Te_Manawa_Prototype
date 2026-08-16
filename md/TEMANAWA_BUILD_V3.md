# Te Manawa — Technical Build Companion

Architecture, performance budget and the full sprite manifest for
**`TEMANAWA_PLAN_V3.md`**, which is the design spine. This document does not make design
decisions — where the two disagree, the plan wins.

> **Reconciled 2026-08-14** against the current codebase (the build Plan v3 describes).
> Since the 2026-08-07 pass: re-pointed from v2.1 to v3; the module inventory is current
> (now **31 engine scripts, ~715 kB** — `water`, `atlas`, `plant_defs`, `kereru`,
> `plant_debug` added); §2 gains a survey of the runtime systems that actually shipped
> (§2.5); the manifest is reconciled against `SPRITE_BRIEF.md` (§4.6); the five-button /
> `1`–`5` lockdown and four eruption markers are corrected (§3, §4.5); and the v2→v2.1
> assessment appendix is retired (it lives in v2.1). Still forward-looking and correctly
> described: the four `Float32` disturbance fields (§2.2 — **not built**, the frontier),
> the packed-atlas frame map, the 512→256 grid drop, and audio preload.

**Constraints assumed throughout:** vanilla JavaScript on p5.js, one screen, **unattended
kiosk**, no operator, no network.

**Governing principle**, from `TEMANAWA_PLAN_V3.md` §0 and repeated here because it
decides most of what follows:

> **This is a cartoon seen from above, not a survey of the Manawatū.**

---

## 1. Contents

| § | |
|---|---|
| **2** | Architecture — modules, the runtime systems as built (§2.5), fields, instancing, atlases |
| **3** | Kiosk self-run |
| **4** | The sprite manifest |
| **5** | **Performance and load budget** — hard limits, and the two-tier reset cost |
| **6** | **Terrain — how the morph reads** |

---

## 2. Architecture

### 2.1 Stop patching — done

Phase 1 monkey-patched `Game`/`GameUI` via `TeManawa_install.js` to prove the ambient
mode without touching 76 kB of `sketch.js`. **Phase 1.5 folded that back in**: the shims and their four dead call-sites (tutorial, menu_art,
progress, benchmark) are gone, the economy (mauri, toolbar, costs, goals, win/lose,
notifications, rings) is stripped, the play area is a fixed square grid, and `install.js`
is now normal modules — `TeManawa_hud.js` and `TeManawa_kiosk.js`.

**Still to split, at Phase 4–5**, so ecology work lands in small files rather than inside
`sketch.js`:

```
TeManawa_fields.js      wet / open / bare / warp — the four Float32Arrays, and disturb()
TeManawa_flora.js       the plant table + establishment rules + the palette
TeManawa_atlas.js       sprite atlas load + frame lookup
```

`TeManawa_climate.js` and `TeManawa_kiosk.js` already exist, and the terrain/ecology work
added a further tier the original split did not anticipate: `TeManawa_terrain.js`,
`TeManawa_projection.js` (pure plan-oblique 3/4), `TeManawa_seasons.js` (now the glacial
clock — §2.5), `TeManawa_water.js` (the animated water layer), `TeManawa_atlas.js`
(sprite-strip loader — §2.4), `TeManawa_plant_defs.js` (the flora table, `coldTolerance`),
`TeManawa_kereru.js`, and `TeManawa_devtools.js` (LOOK/GEN/GEO console tools), alongside the
existing `registry` / `spatial` / `simulation` / `species_data` / `entity_sprites` /
`level_format` / `debug`. The engine is now **31 scripts, ~715 kB** — it *grew* with the
terrain, projection, ecology and dev-tooling work rather than shrinking to the ~250 kB the
economy strip projected. Of the split trio above, **`plant_defs` (≈ the flora table) and
`atlas` have landed**; the four-`Float32Array` `fields` / `disturb()` module (§2.2) has
**not** — it is the frontier; `sketch.js` itself is scoped in `TEMANAWA_REORG.md` §4.

### 2.2 The data model — the disturbance fields *(not built; the frontier)*

`heightMap` exists and morphs (§6). The four per-cell disturbance fields below are the
**biggest unbuilt system** and the substrate for the aftermath that teaches (`PLAN_V3.md`
§9). Keep `heightMap` exactly as it is; add four parallel `Float32Array`s on the same grid
with the same indexing:

| Field | Range | Written by | Read by |
|---|---|---|---|
| `wet` | 0 dry → 1 standing water | re-bake, from distance-to-water and height above the river corridor | plants, moa habitat, ash growth weighting |
| `open` | 0 closed forest → 1 fully open | `glacialIndex × exposure`, on the re-bake interval | plants, moa habitat, **harrier carrying capacity** |
| `bare` | 0 vegetated → 1 freshly disturbed | `disturb()`, decays toward 0 | establishment gate, ground palette blend |
| `warp` | 1 → N | `disturb()`, decays toward 1 | multiplies local `bare` decay and growth |

At 256²: 4 × 65,536 × 4 B ≈ **1 MB**. Free.

**The actual change, stated plainly:** plants would stop reading `biome` and start reading
`(wet, elev, open, bare)`. `getBiomeAt` survives as a *rendering* concern only — it picks
the ground colour. Today plants still read `biome.plantTypes` + the glacial forest band
(§2.5); the field decoupling is the Phase 6 work that makes `disturb()` and the `warp`
local clock (`PLAN_V3.md` §9) possible.

### 2.3 Vegetation: three populations, not one

This is the real performance risk and neither plan version addressed it. Twenty species
scattered across a 256² grid is plausibly **tens of thousands of `Plant` objects**, each
with an `update()` call and a per-frame `image()` draw. `TeManawa_simulation.js` already
iterates plants linearly (`plants[i].update(...)` at L874). Under the Deep-time button's
10× that loop runs at ten times the sim rate. It will not hold 60 fps, and the failure
mode is the worst one: fine in the studio, dead on the wall.

The plan's sprite/palette split (`PLAN_V3.md` §4) mostly solves this by itself.
Formally, three populations:

| Population | What | Cost per frame |
|---|---|---|
| **Palette** — the seven ground species | A colour contribution per cell, blended into the terrain pixel bake. Never an object, never a sprite | **zero** |
| **Baked sprites** — `h2`/`h3` stands | Blitted into a vegetation buffer on the re-bake interval, cross-faded like the seasons already are | **zero per frame**, cost lands on the bake |
| **Live entities** — `h4` emergents, plus any plant a moa is currently targeting | Real objects with `update()` and a per-frame draw | ~200–800 draws |

**Watch the leak.** `createGraphics` buffers must be `remove()`d when replaced. An
interval re-bake is a leak by construction, and an installation that runs for months
will find it. Collapsing from four season buffers to one base buffer (per
`TEMANAWA_TERRAIN_PLAN.md` §7) reduces both the bake cost and the leak surface by 4×.

### 2.4 Assets: atlas, not 158 loose files

§4 lands at roughly **158 individual sprites**. Loading those as 158 `loadImage()` calls
in p5's `preload()` means 158 near-sequential requests before the first frame — a slow,
visible black screen every time the watchdog reloads. And the watchdog *will* reload.

`[BUILD]`

- Pack into **five atlases** with a JSON frame map: `plants`, `fauna`, `terrain`, `fx`,
  `ui`. One `loadImage` each, then `image(atlas, dx,dy,dw,dh, sx,sy,sw,sh)`.
- Keep the existing declarative structure — `PLANT_SPRITE_SETS` in `sketch.js` and
  `ART_SETS` in `entity_sprites.js` are both already the right shape. They resolve to
  atlas frames instead of file paths; nothing above them changes.
- ✅ **Asset directory cleaned** (was "clean this first"). The ~53 MB of stray `.mp4`
  video, the `trees.pxo`, the `OneDrive_2026-07-27*` duplicate downloads and the
  `moa_walk_4 (Copy 1).png` / `.fuse_hidden…` cruft are gone. `sprites/` is now **91 loose
  PNGs**.
- ◑ **A sprite-*strip* loader has landed** (`TeManawa_atlas.js`): one horizontal strip PNG
  per animation, `N` frames left-to-right, **one `loadImage` per animation** — the boot-cost
  win at animation granularity. The *packed* five-atlas layout with a JSON frame map (one
  `loadImage` for a whole group) is the further step; no `sprites/*.json` frame map exists yet.
- ✅ **Juvenile-moa load bug fixed** (was a live bug here). `TeManawa_entity_sprites.js`
  now loads `moa_juvenile_walk_1..4.png` — which exist — with a real
  `console.warn` failure callback instead of the silent `() => {}`. Juveniles no longer
  fall through to adult art.

### 2.5 The runtime systems as built

The original §2 anticipated the fields and the atlas; the systems that actually shipped and
now define the frame are below. Each is thin — a handful of scalars keyed to a legible signal —
and each has a design doc.

| System | Where | What runs today |
|---|---|---|
| **Split-resolution render** | `Game._composeTerrainLayer`, `CONFIG.spriteSupersample` (2) | Backing canvas is `SS×` the logical 1080; sprites + HUD render at `SS`, the **terrain opts out** into a 1080 offscreen buffer (`_terrainLayer`) blitted up as one quad. `pixelDensity` stays 1; mouse coords divide by `SS` |
| **3/4 projection** | `TeManawa_projection.js` (pure) | `worldToScreen` / `groundY`; the sim stays top-down, only the paint tilts (`34VIEW_PLAN.md`) |
| **Animated water** | `TeManawa_water.js` | Per-frame overlay of looping flow decals / eels / sea shimmer over the *baked* water (the bake is a static blit, so motion is a decal layer) |
| **Glacial clock** | `TeManawa_seasons.js` | `SeasonManager` rebound off the season timer to `Climate.glacialIndexAt(yearsBP)`; `winterness` = glacial index; four buffers = four glacial stages; forest contraction (`forestBandByStage`) (`DEEPTIME_ECOLOGY_PLAN.md`) |
| **Habitat health → saturation** | `Game._updateHabitatHealth`, `HEALTH` block | Derived `H = F × R` eased slowly; a `saturate()` filter on the **ground blit only**, gated off when healthy, photosensitivity-slewed (`INTERACTION_HEALTH_PLAN.md`) |
| **Five buttons** | `TeManawa_hud.js` `BUTTONS` | Flag-plus-per-frame-read, no event bus: Deep Time · FOREST · TUSSOCK · STORM · ERUPTION |
| **Eruptions** | `DeepTime.ERUPTIONS`, `Game.applyEruptionAt`, `ashCover` | Four year-bound events; auto-fire on clock crossing; button ⑤ seeks/reverts between them; `ashCover` clears+regrows in three severity tiers (`PLAN_V3.md` §8) |
| **Fauna** | `Boid` subclasses `Moa` / `EylesHarrier` / `Kereru` | Two-clock split (`behave` = warped dt, `update` = real dt); one `Egg` type by `offspringType`; **kererū `disperseSeed` is the only runtime plant growth**, cap-guarded (`FAUNA_IMPL.md`) |

Everything here is keyed to `yearsBP` or the glacial index, reads at a glance, and is
debug-gated where it would otherwise narrate.

---

## 3. Kiosk self-run

Several items here constrain earlier decisions, so they belong in the build now rather
than in a hardening phase at the end.

**Serving.** p5's `loadImage` from `file://` is blocked by Chrome's CORS policy. Ship a
**local static server** on `127.0.0.1`, started by the same supervisor that starts the
browser. More robust than `--allow-file-access-from-files`, and it costs nothing.

**Browser.** Chromium in kiosk mode:

```
--kiosk --incognito --noerrdialogs --disable-infobars
--disable-session-crashed-bubble --disable-pinch --overscroll-history-navigation=0
--autoplay-policy=no-user-gesture-required --check-for-update-interval=31536000
```

**Audio.** Do **not** rely on the autoplay flag alone — p5.sound runs on Web Audio and
the `AudioContext` can still start suspended. Carry a `resume()` on the first input of
any kind, start silent and fade in, and make sure **nothing essential is conveyed by
audio alone** (an accessibility rule from the v1 plan, still standing), so a
permanently-suspended context is a degradation rather than a failure.

**Supervision.** Auto-launch at boot with a `Restart=always` supervisor (systemd unit on
Linux; shell replacement or Task Scheduler on Windows). Disable sleep, screensaver,
notifications and automatic updates. Assume the museum power-cycles the wall at close.

**In-page watchdog** — the one that saves you:

- A heartbeat written from `draw()`; a `setInterval` **outside** the p5 loop checks it
  and calls `location.reload()` if the frame loop has stalled beyond ~10 s. Catches lost
  WebGL contexts and a `draw()` that has thrown.
- `window.onerror` and `unhandledrejection` → append to a `localStorage` ring buffer (so
  there's a post-mortem), then `resetToAttract()`, then reload if that fails.
- A **scheduled reload at 03:00**. Blunt, and it defeats every slow leak you didn't find.

**Input lockdown.** `touch-action: none`, `user-select: none`, `cursor: none`, context
menu suppressed, pinch-zoom disabled, keys limited to `1`–`5` (the five buttons) so physical
arcade microswitches map straight onto the existing handlers (`TeManawa_kiosk.js` does this).

**Display.** Call `pixelDensity(1)` explicitly. On a 4K panel p5 defaults to 2
and **quadruples fill rate for no visible gain** — on its own this can be the difference
between 60 and 25 fps under the Deep-time button.

**Photosensitivity.** Give it a testable number rather than "ramp it": **no more than 3
luminance transitions per second, and any large-area luminance change ramped over
≥500 ms.** The current `ashMillis: 1600` in `TeManawa_hud.js` is compliant; write the
rule down so nobody "improves" it later.

**Accessibility.** Reachable button height for a child and a wheelchair user, one-finger
operation, colourblind-safe palette, and **drawn glyph icons rather than emoji** — emoji
render differently per platform and carry no colourblind-safe guarantee.

---

## 4. The sprite manifest

### 4.1 Plants — 45 assets

Per `TEMANAWA_PLAN_V3.md` §4. Ten species get sprites; seven are ground palette; three are
cut.

**Sprite tiers**

| Tier | States | Assets | Species |
|---|---|:--:|---|
| **S** | mature, thriving, wilting + 2 growing | **5** | mamaku, kahikatea, tōtara, tawa, tī kōuka |
| **M** | mature, thriving, wilting | **3** | harakeke, nīkau, mānuka, black beech |
| **K** | mature, thriving, wilting, **flowering** | **4** | kōwhai |

5 × 5 + 4 × 3 + 4 = **41 sprites**, plus **4 shared micro-textures** for the palette
species (mat, reed, tussock, scrub) = **45**.

**Footprint rule** (`TEMANAWA_PLAN_V3.md` §10): `h2` at 64², `h3` at 96², `h4` at 234×500
with `anchor: 'base'`. `h4` sorts above `h3`.

**Art move in progress — the dedicated-folder look.** The incoming art lands per
species in `sprites/<Species>/`, and is wired into `PLANT_SPRITE_SETS`
(`TeManawa_sketch.js`) as it arrives. **Policy while a folder holds one frame:** wire
it `single` — that one frame draws for every seasonal state (Mature/Thriving/Wilting/
Dormant all resolve to it) — until its full state set is drawn. `single` is not for
`sizeOnly` plants (tōtara has its own variant path). This is the "1 asset, all states"
stand-in, not the final look.

**Folder art in hand (12 folders):**

| Folder | Sim plant type | Native px | Wired | State |
|---|---|---|---|---|
| `Totara/` | `rimu` (tōtara art) | 526×920 | ✓ | complete — 4 growing + 3 size variants, `sizeOnly` |
| `Tussock/` | `tussock` | 143×82 | ✓ `single` | one frame, all states |
| `Flax/` | `flax` (harakeke) | 175×193 | ✓ `single` | one frame, all states |
| `TreeFern/` | `fern` (mamaku/ponga stand-in) | 183×227 | ✓ `single`, `anchor: base` | one frame, all states |
| `Beech/` | `beech` (black beech, tawhai) | 329×517 | ✓ `single`, `anchor: base` | one frame, all states |
| `Kowhai/` | `kowhai` (**new type** — Lowland + Podocarp) | 394×417 | ✓ `single`, `anchor: base` | one frame, all states |
| `Manuka/` | `manuka` (**new** — Lowland + Subalpine) | 439×503 | ✓ `single`, `anchor: base` | one frame, all states |
| `Kahikatea/` | `kahikatea` (**new** — Podocarp) | 359×968 | ✓ `single`, `anchor: base` | one frame, all states |
| `Nikau/` | `nikau` (**new** — Podocarp) | 143×359 | ✓ `single`, `anchor: base` | one frame, all states |
| `Tawa/` | `tawa` (**new** — Podocarp + Montane) | 372×545 | ✓ `single`, `anchor: base` | one frame, all states |
| `CabbageTree/` | `cabbagetree` (**new** — tī kōuka, Lowland) | 160×281 | ✓ `single`, `anchor: base` | one frame, all states |
| `Epiphytes/` | — (epiphytes) | 133×123 | **deferred** | going into individual trees' art by hand, not a plant type |

`Totara` is complete (covers tōtara's tier-S 5). **Eleven of the twelve folders are now
live plant types** — the six podocarp/lowland/subalpine species above joined `rimu`,
`tussock`, `flax`, `fern` and `beech`. Habitats follow the research and are set in the
level scaffold biomes (see the `plantTypes` comment there). `Epiphytes/` is intentionally
NOT a plant type — those go into individual trees' artwork by hand. **New plant assets
remaining: ~21** (per-state sets to replace the ten `single` stand-ins — Tussock, Flax,
TreeFern, Beech, Kōwhai, Mānuka, Kahikatea, Nīkau, Tawa, Cabbage tree — incl. kōwhai's
tier-K flowering frame, plus the palette micro-textures).

**Superseded root files.** The old root `Beech_*`, `Fern_*`, `Flax_*` and `Tussock_*`
state files (and `Rimu_*`, aliased to tōtara) are no longer referenced now those keys
point at their folders; they are left in `sprites/` for reference, not deleted.
`Patotara` and `Lancewood` were never in `PLANT_SPRITE_SETS` and render procedurally.

### 4.2 Fauna — 64 assets

The seven, plus the dimorphism pair, per `TEMANAWA_PLAN_V3.md` §5. Frame counts follow the
existing conventions in `TeManawa_entity_sprites.js` and are cut to cartoon minimums —
4-frame walks, not 5.

| Animal | Frames | Assets | Have | Notes |
|---|---|:--:|:--:|---|
| **NI giant moa — female** | 4 walk + 1 idle | 5 | partial | Generic `moa_walk_1..4` + `moa_idle` at 72² is the base |
| **NI giant moa — male** | 4 walk + 1 idle | 5 | — | **The dimorphism pair.** Different *build*, not a scaled copy |
| **Little bush moa** | 5 walk + 1 idle | 6 | **✓ complete, 48²** | Warm-phase marker. Wired as `moaVariants.bush` |
| **Mantell's moa** | 4 walk + 1 idle | 5 | — | **Cold-phase marker.** Smallest NI moa, stocky |
| **Juvenile moa** | 4 walk + 1 idle | 5 | 4 of 5 | 4-frame walk wired (`moa_juvenile_walk_1..4`); idle still to draw. The old silent-load bug is fixed (§2.4) |
| **Kērangi — flight** | 16 @500² | 16 | **✓ complete** | Plus an 8-frame 256² low set. Already atlas-ready via `ART_SETS` |
| **Kērangi — perched** | 2 | 2 | — | The dive puts it at rock shelters; there is no perched pose |
| **Kērangi — dash** | 2 | 2 | — | Goshawk, not soaring harrier. Frame 8 currently doubles as the hunt pose |
| **NI goose** | 4 walk + 1 idle | 5 | — | **In the local bones.** Makes the cold phase busier |
| **Kererū** | 4 flap + 1 perched | 5 | — | Recognition anchor, harrier prey, seed disperser |
| **Huia — pair** | 3 each | 6 | — | Female's long curved bill vs male's chisel — the second free dimorphism |
| **Egg / nest** | 2 | 2 | — | `TeManawa_egg.js` currently draws procedurally |

**64 assets, 31 in hand** (harrier 16, little bush moa 6, juvenile 4, generic moa 5).
**New: 33.** Coastal moa, if built, is **+5**.

`[BRIEF]` **These are seen from directly overhead.** The visual hooks in
`TEMANAWA_FAUNA_POOL.md` were written from a field-guide viewpoint. From above, a bird
is wing shape, back and crown markings, and the shape it makes as it moves — not a
profile. Huia's bill and kererū's white waistcoat both need bird's-eye equivalents.

### 4.3 Terrain and landform — 21 assets

| Asset | Count | Notes |
|---|:--:|---|
| **Geography SVG** | 1 | `geo/manawatu.svg` — ranges + river skeleton (§6, `TEMANAWA_GEOGRAPHY.md`). Source art, not a runtime sprite; replaced the two heightmaps |
| **Dune form — spinifex** | 3 | Smooth, even, ~6 m, 14–16°. Three sizes so the dune grows |
| **Dune form — pīngao** | 3 | Low convex, <3 m, 8–14° |
| **Buried logs** | 3 | Sand-buried trunk, drowned stumps in peat, ash-killed snag |
| **Shingle bar / braid** | 2 | Goes bare and grey under Storm |
| **Ash mantle overlay** | 1 | Tiling |
| **Water edge / lagoon** | 2 | Dune-dammed lakes appear and vanish |
| **Ground textures** | 5 | Sand, peat, alluvium, loess/downland, ash. Bake targets |

**None exist.** Snow and frost stay as live tints on the existing `SeasonManager` path.

### 4.4 Disturbance FX — 12 assets

| Asset | Count | Notes |
|---|:--:|---|
| Ash plume / fall particle | 3 | Ramped, seizure-safe (§3) |
| Sand drift particle | 2 | Always ESE |
| Flood / silt overlay | 2 | |
| Fallen emergent | 2 | Windthrow; doubles as a buried-log asset |
| Storm cloud + bolt | 3 | **✓ exist** — `cloud1`, `cloud2`, `bolt` at 64² |
| Growth pulse | 0 | Tint and scale, not art |

**3 exist. New: 9.**

### 4.5 UI — 18 assets

| Asset | Count | Notes |
|---|:--:|---|
| **Five** button glyphs, 2 states each | 10 | **Drawn glyphs, not emoji** — Deep Time · FOREST · TUSSOCK · STORM · ERUPTION |
| Timeline playhead | 1 | |
| Era band fills | 3 | Arrow or wave — `PLAN_V3.md` §16.1, **still open and blocking this** |
| Eruption markers | 4 | Kidnappers (~1 Ma), Kaukatea (~0.9 Ma), Whakamaru (~349 ka), Ōruanui (~25.5 ka) |
| Attract-loop prompt | 0 | **Retired** — there is no attract screen or title card; the diorama runs continuously |

**None exist** as art (button glyphs render as drawn shapes today). Bilingual labels are text
and a **content hook for mana whenua co-design** — not art, and not ours to fill in.

### 4.6 Total

| Group | Assets | Exist | **New** |
|---|:--:|:--:|:--:|
| Plants | 45 | 11 | **34** |
| Fauna | 64 | 31 | **33** |
| Terrain / landform | 20 | 0 | **20** |
| Disturbance FX | 12 | 3 | **9** |
| UI | 18 | 0 | **18** |
| **Total** | **~159** | **45** | **~114** |

Coastal moa, if built, adds **+5**. The count is a schedule estimate, not a spec — quote it
with the "~".

**Reconciled with `TEMANAWA_SPRITE_BRIEF.md`.** The brief counts **~177 total / ~132 to draw**;
the gap is entirely the **~19 terrain *illustration stamps*** (its §3.3 — tussock ticks, scrub
dots, water swirls, per biome) that this core manifest does not itemise. Add them: ~159 + ~19 ≈
**~178 total**, ~114 + ~19 ≈ **~133 to draw**. One number, counted two ways.

**All three fauna classes still run on placeholder or partial art**, and the flora folders are
`single` stand-ins (§4.1). The harrier is the only finished fauna set — and it is the *wrong bird*
pending the raptor-identity fix (`PLAN_V3.md` §5). **Nothing can *teach* until it can be *drawn***:
the seven-species cast, the *Dinornis* dimorphism pair and the two era-signal plants (mamaku, nīkau)
are the critical path, and the art starts now.

---

## 5. Performance and load budget

Everything below is an **estimate with its arithmetic shown**, not a measurement — the
kiosk hardware isn't specified yet. Treat the *limits* as design rules and the *timings*
as targets to profile against once there's a machine.

### 5.1 The rule that answers the reset question

> **A reset must never touch the network.**

Distinguish two very different operations that are easy to conflate:

| | **Soft reset** | **Hard reload** |
|---|---|---|
| Triggered by | idle timeout, end-of-window, attract loop, `onerror` recovery | watchdog stall, crash, nightly 03:00 |
| What happens | re-seed and rebuild in memory | full page load |
| Frequency | **hundreds of times a day** | ideally once a day |
| Cost | **~20 ms** keep-terrain · **~1.2 s** if it re-morphs to an eruption checkpoint or reseeds | **1.5–2.5 s** (see §5.3) |

`resetToAttract()` is the soft path, built in Phase 1.5. The
whole point is that it stays in memory:

| Step | Work | Estimate |
|---|---|---|
| Re-seed RNG, zero `yearsBP` / `playTime` | scalar writes | <0.1 ms |
| Rebuild 4 fields at 256² | 4 × 65,536 float writes | **1–3 ms** |
| Return entities to pools | pointer work **if pooled**; ~20 ms if reallocating | **~1 ms** |
| Re-bake terrain base buffer | 65,536 writes into `pixels[]`, one pixel per cell | **5–15 ms** |
| Re-bake vegetation layer | see §5.4 | **5–10 ms amortised** |
| **Total** | | **~10–25 ms** |

> ✅ **Measured — and now two-tier.** `tools/bootcheck.js` times six consecutive soft
> resets. When the reset **keeps the terrain**, it is still ~**20 ms**, against a full
> `Game.init()` that is now **~6.8 s** in the harness (up from ~950 ms at Phase 1.5 as the
> terrain bake grew: supersampled paint, geography fields, 3/4 relief). But the soft path
> is **no longer uniformly cheap.** `Kiosk.resetToAttract()` now **returns to the last
> eruption checkpoint** via `Game.applyEruptionAt()`, which re-morphs and re-bakes the
> terrain and costs **~1.2 s**. In the harness — where eruptions have fired before the
> reset loop runs — five of six resets take that path, so the measured series is
> `20, 1240, 1237, 1237, 1228, 1298 ms` and the harness reports soft as only **~5×**
> cheaper than `init()`, not the ~50–100× the pure keep-terrain path delivered.
>
> ⚠️ **This breaks the old "reset is nearly free" invariant** for any reset that lands on
> an eruption checkpoint, and pushes it past the ≤25 ms budget in §5.1. The original
> analysis assumed *the land has no reason to change between visitors*; the
> eruption-checkpoint return is a new reason for it to change, and it reintroduces exactly
> the terrain-regeneration cost the soft/hard split was built to avoid — on the visitor
> path. It hides behind the crossfade, but 1.2 s is a long crossfade.
> **Open question for the design spine:** is the eruption-checkpoint return worth ~1.2 s
> on the visitor path, or should each checkpoint's terrain be baked once and swapped in
> pointer-cheap? Flagged here rather than silently re-baselined.
>
> The cheap tier is otherwise unchanged: `Game.init()` regenerates terrain noise over
> every cell *and* bakes the season buffers, whereas `Game.resetEcosystem()` keeps the
> terrain and its baked buffers and replaces only the living world — **terrain generation
> is ~95% of a reset that doesn't need it.** `Kiosk.reseedEvery` (=12) still fires a full
> `init()` rebuild every 12th reset so the landscape varies across a day.

That is **under one frame at 60 fps**, and it can hide entirely behind a 400 ms
crossfade. Three conditions make it true, and all three are design constraints rather
than optimisations:

1. **Pool every entity.** Moa, birds, plants, particles. Never allocate in a reset, and
   never allocate in `draw()` — `p5.Vector` churn in boid code is a known GC source.
2. **Bake at cell resolution, not pixel resolution.** `TerrainGenerator` already does
   this — `createGraphics(this.mapWidth, this.mapHeight)` is one pixel per cell, then
   scaled on draw. Keep it. A 2048² bake would be 64× the writes.
3. **Never re-decode an image.** Atlases stay decoded on the GPU for the life of the
   page. If a reset triggers a `loadImage`, the design is wrong.

### 5.2 Hard limits

Exceed these and the piece stops holding 60 fps on integrated graphics.

| Limit | Value | Why |
|---|---|---|
| **Sim grid** | **256² (65,536 cells)** | 512² quadruples every field op *and* the bake. The single most expensive number in the project. **Still 512** (`CONFIG.mapGrid`) to preserve the existing plant/moa density tuning — the pre-Phase-1.5 portrait map was ~432×768. The interval/sliced re-bake this drop was waiting on **has since landed** (§5.4; the harness verifies `incremental morph: sliced == synchronous`), so the precondition is met — the outstanding commit is the drop to 256 itself, retuning `plantDensity` and spawn counts in the same change |
| **Live plant entities** | **≤ 1,000** | `h4` emergents plus moa food targets. Everything else is baked or palette |
| **Live fauna** | **≤ 300** | including juveniles and ambient birds |
| **Total `image()` calls per frame** | **≤ 1,500** | the practical ceiling for p5's 2D renderer on integrated graphics |
| **Atlas dimensions** | **≤ 2048² each, 5 atlases** | 5 × 2048² RGBA ≈ **80 MB** VRAM. Some integrated GPUs cap a single texture at 4096² |
| **Re-bake cost** | **≤ 5 ms** | see §5.4 |
| **`pixelDensity`** | **1** | non-negotiable on a 4K panel |

### 5.3 Cold boot

The load that actually costs, and the one the watchdog pays.

| Item | Now | After |
|---|---|---|
| `p5.js` | 5.4 MB unminified | ✅ **shipped:** `p5.min.js`, ~1.4 MB — saved ~4.0 MB and ~200–400 ms of parse |
| `p5.sound.min.js` | 200 kB | unchanged |
| Engine JS | **~715 kB across 31 scripts** — *grew* with the terrain/projection/ecology/dev-tools work, did not shrink to the projected ~250 kB | bundle to 1 file |
| Sprites | 2.0 MB across **91 loose PNGs**, heading for 158 | **5 atlases** (no frame map exists yet) |
| Audio | **6.5 MB across 17 mp3s, still all in `preload()`** | preload the ambient bed only; lazy-load the rest — **still outstanding** |
| Fonts | 360 kB, 2 files | unchanged |

**Estimated cold boot, local server, kiosk-class hardware:**

- **As it stands, at full asset count: ~4–8 s.** Dominated by unminified p5, 158
  sequential image requests, and 6.5 MB of audio decoded up front.
- **After the four changes above: ~1.5–2.5 s.**

`[BUILD]` The single highest-value change remaining is **preloading only the ambient
audio bed**. 6.5 MB of mp3 decoded in `preload()` blocks the first frame, and fifteen of
the seventeen clips are event sounds that aren't needed for several seconds. (The
`p5.min.js` swap — previously second on this list — has shipped.)

**Show something in the first 200 ms.** Draw a static title card from a single small
image before the main `preload()` resolves, so a watchdog reload reads as a transition
rather than a crash.

### 5.4 Steady state, and the fast-forward cliff

At 60 fps the whole frame is **16.6 ms**.

| Per frame | Estimate |
|---|---|
| Terrain blit (1 scaled `image()`) | <1 ms |
| Vegetation layer blit (1–2 `image()`, cross-faded) | <1 ms |
| Live plant entities, ≤1,000 draws | 2–4 ms |
| Fauna update + draw, ≤300 | 1–2 ms |
| Boid/flocking with the existing spatial grid | 1–3 ms |
| HUD, timeline, buttons | <1 ms |
| **Headroom** | **~5–9 ms** |

**The cliff is the re-bake, not the frame** — and it is now **amortised** (fix 1 below has
landed). The morph re-bakes once `yearsBP` drifts past `morphIntervalYears` (**~9,000
sim-years**, not the ~400 the old terrain plan guessed), sliced across frames against a
millisecond budget so a bake never lands whole in one frame; the harness asserts `incremental
morph: sliced == synchronous`. The watch item is still 10× fast-forward, where the interval is
crossed far more often.

`[BUILD]` **Three fixes:**

1. ✅ **Amortise — landed.** The bake is sliced across frames against a `morphBudgetMs`, its
   seam hidden behind the existing cross-fade (the harness verifies the sliced result is
   bit-identical to a synchronous bake).
2. **Throttle Δ under fast-forward.** The terrain plan already suggests this — widen the
   interval to ~1,600 sim-years at 10×, so the bake rate stays near 3/s instead of 13/s.
   Nobody can resolve 400-year steps at 10× anyway.
3. **Separate the layers.** Ground palette changes every bake; the vegetation sprite
   layer changes far more slowly. Re-bake them on different intervals.

`[BUILD]` **Re-fork the `benchmark` module temporarily.** v1 §8 suggested this and it
was dropped in the shim. Profiling fast-forward is the one measurement that decides the
grid size and the bake interval, and guessing at it is how installations die on the wall.

---

## 6. Terrain — how the morph reads

The terrain model is the **SVG geography skeleton** (`TEMANAWA_GEOGRAPHY.md`, `PLAN_V3.md`
§2), not the two-heightmap lerp this section originally analysed. It now morphs on **three**
deep-time curves — uplift, incision, and **emergence** (a monotonic sea-plane lift that opens
the run as a marine embayment; `DEEPTIME_ECOLOGY_PLAN.md` Axis A). Three conclusions from the
original analysis carried over and still hold:

1. **The river is authored once, so antecedence is free.** A morph that changes elevation
   *in place* — features don't migrate across the map — means the channel never drifts.
   Draw the river once and *the river is older than the mountains* falls out of the art,
   with no mask and no constraint solver. The skeleton keeps this: the river line is
   fixed; only its carve depth grows with `tIncision`.
2. **Two curves, not one.** A single blend factor moves uplift and incision in lockstep,
   so neither can outpace the other and the takeaway is unshowable. `tIncision` runs
   slightly ahead of `tUplift`; the gorge floor drops faster than the ridges rise, and the
   visitor watches the river win. **Built** — the load-bearing idea that survived the rewrite.
3. **The shading sells it, not the numbers.** A 0.2 change in a normalised elevation will
   not read as "mountains rising" from a bird's-eye cartoon; the read comes from the relief
   response — hillshade contrast and ridge highlights that strengthen with uplift, a dark
   gorge-shadow corridor keyed on `tIncision`, the snow line dropping onto the new peaks
   (`SeasonManager` already does this), colour banding tightening as the range widens.
   Budget roughly a quarter of the effort on the height field and three-quarters on the
   relief render — now the 3/4 relief bake (`TEMANAWA_34VIEW_PLAN.md` §3).

One caution that applies to any morph: **change should arrive in beats, not as a
gradient.** A constant-rate ramp is honest and dramatically dead — ease the curves and tie
visible jumps to events the visitor already sees (an eruption marker, a glacial turn).

---

---

**Reference:** `TEMANAWA_PLAN_V3.md` (the spine) · `TEMANAWA_PEDAGOGY.md` (what it teaches, the
road ahead) · `TEMANAWA_DEEPTIME_ECOLOGY_PLAN.md` · `TEMANAWA_INTERACTION_HEALTH_PLAN.md` ·
`TEMANAWA_FAUNA_IMPL.md` · `TEMANAWA_GEOGRAPHY.md` · `TEMANAWA_34VIEW_PLAN.md` · the ecology
dives and `research/*.pdf` (the evidence base).
