# Te Manawa — Technical Build Companion

Architecture, performance budget and the full sprite manifest for
**`TEMANAWA_PLAN_V2.md` (v2.1)**, which is the design spine. This document does not
make design decisions — where the two disagree, the plan wins.

**Constraints assumed throughout:** vanilla JavaScript on p5.js, one portrait screen,
**unattended kiosk**, no operator, no network.

**Governing principle**, from `TEMANAWA_PLAN_V2.md` §0.1 and repeated here because it
decides most of what follows:

> **This is a cartoon seen from above, not a survey of the Manawatū.**

---

## 1. Contents

| § | |
|---|---|
| **2** | Architecture — modules, fields, instancing, atlases |
| **3** | Kiosk self-run |
| **4** | The sprite manifest |
| **5** | **Performance and load budget** — hard limits, and why reset is nearly free |
| **6** | **Terrain — how the morph reads** |
| **7** | Appendix: the v2 → v2.1 assessment trail |

---

## 2. Architecture

### 2.1 Stop patching — done

Phase 1 monkey-patched `Game`/`GameUI` via `TeManawa_install.js` to prove the ambient
mode without touching 76 kB of `sketch.js`. **Phase 1.5 folded that back in** (details in
`TEMANAWA_PLAN_V2.md` §8.1): the shims and their four dead call-sites (tutorial, menu_art,
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

`TeManawa_climate.js` and `TeManawa_kiosk.js` already exist. The `sketch.js` split itself
is scoped in `TEMANAWA_REORG.md` §4.

### 2.2 The data model

Keep `heightMap` exactly as it is. Add four parallel `Float32Array`s on the same grid
with the same indexing:

| Field | Range | Written by | Read by |
|---|---|---|---|
| `wet` | 0 dry → 1 standing water | re-bake, from distance-to-water and height above the river corridor | plants, moa habitat, ash growth weighting |
| `open` | 0 closed forest → 1 fully open | `glacialIndex × exposure`, on the re-bake interval | plants, moa habitat, **harrier carrying capacity** |
| `bare` | 0 vegetated → 1 freshly disturbed | `disturb()`, decays toward 0 | establishment gate, ground palette blend |
| `warp` | 1 → N | `disturb()`, decays toward 1 | multiplies local `bare` decay and growth |

At 256²: 4 × 65,536 × 4 B ≈ **1 MB**. Free.

**The actual change, stated plainly:** plants stop reading `biome` and start reading
`(wet, elev, open, bare)`. `getBiomeAt` survives as a *rendering* concern only — it
picks the ground colour. That decoupling is small, and it is the whole of Phases 4–5.

### 2.3 Vegetation: three populations, not one

This is the real performance risk and neither plan version addressed it. Twenty species
scattered across a 256² grid is plausibly **tens of thousands of `Plant` objects**, each
with an `update()` call and a per-frame `image()` draw. `TeManawa_simulation.js` already
iterates plants linearly (`plants[i].update(...)` at L874). Under the Deep-time button's
10× that loop runs at ten times the sim rate. It will not hold 60 fps, and the failure
mode is the worst one: fine in the studio, dead on the wall.

The plan's sprite/palette split (`..._PLAN_V2.md` §2.2) mostly solves this by itself.
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
- **Clean the asset directory first.** It currently ships:
  - `sprites/2026-07-28 08-02-06.mp4` and `…(online-video-cutter.com).mp4` — **53 MB of
    video** in the sprite folder
  - `sprites/OneDrive_2026-07-27`, ` (1)`, ` (2)` — ~1.3 MB of duplicate downloads
    shadowing `EylesHarrier_HiRes/` and `Totara/`
  - `sprites/moa_walk_4 (Copy 1).png`, `sprites/trees.pxo`, `.fuse_hidden…` in the root
- **Live bug:** `TeManawa_entity_sprites.js` L190 loads `sprites/moa_juvenile.png`,
  which **does not exist** — the folder has `moa_juvenile_walk_1..4.png`. The failure
  callback is `() => {}`, so it fails silently and juveniles fall through to adult art.

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
any kind, start silent and fade in, and — per `TEMANAWA_PLAN.md` §2 — make sure
**nothing essential is conveyed by audio alone**, so a permanently-suspended context is
a degradation rather than a failure.

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
menu suppressed, pinch-zoom disabled, keys limited to `1`–`4` so physical arcade
microswitches map straight onto the existing handlers (`TeManawa_kiosk.js` does this).

**Display.** Call `pixelDensity(1)` explicitly. On a 4K portrait panel p5 defaults to 2
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

Per `..._PLAN_V2.md` §2. Ten species get sprites; seven are ground palette; three are
cut.

**Sprite tiers**

| Tier | States | Assets | Species |
|---|---|:--:|---|
| **S** | mature, thriving, wilting + 2 growing | **5** | mamaku, kahikatea, tōtara, tawa, tī kōuka |
| **M** | mature, thriving, wilting | **3** | harakeke, nīkau, mānuka, black beech |
| **K** | mature, thriving, wilting, **flowering** | **4** | kōwhai |

5 × 5 + 4 × 3 + 4 = **41 sprites**, plus **4 shared micro-textures** for the palette
species (mat, reed, tussock, scrub) = **45**.

**Footprint rule** (`..._PLAN_V2.md` §6.1): `h2` at 64², `h3` at 96², `h4` at 234×500
with `anchor: 'base'`. `h4` sorts above `h3`.

**In hand: 11.** `Totara` is complete (4 states + 4 growing at 234×500 — covers its 5).
`Beech` (4 states at 96²) covers its 3. `Flax` = harakeke (4 states at 64²) covers its
3. **New plant assets: 34.**

`Fern`, `Patotara` and `Lancewood` are drawn but are not on the list. `Fern` is the
closest thing to a mamaku placeholder and is worth keeping wired until mamaku arrives;
`Patotara` and `Lancewood` should be retired from `PLANT_SPRITE_SETS`. `Rimu` (4 states
at 96²) is now cut — retire it too, and note it is currently *aliased to Tōtara art*
anyway, so nothing on screen changes.

### 4.2 Fauna — 64 assets

The seven, plus the dimorphism pair, per `..._PLAN_V2.md` §5.1. Frame counts follow the
existing conventions in `TeManawa_entity_sprites.js` and are cut to cartoon minimums —
4-frame walks, not 5.

| Animal | Frames | Assets | Have | Notes |
|---|---|:--:|:--:|---|
| **NI giant moa — female** | 4 walk + 1 idle | 5 | partial | Generic `moa_walk_1..4` + `moa_idle` at 72² is the base |
| **NI giant moa — male** | 4 walk + 1 idle | 5 | — | **The dimorphism pair.** Different *build*, not a scaled copy |
| **Little bush moa** | 5 walk + 1 idle | 6 | **✓ complete, 48²** | Warm-phase marker. Wired as `moaVariants.bush` |
| **Mantell's moa** | 4 walk + 1 idle | 5 | — | **Cold-phase marker.** Smallest NI moa, stocky |
| **Juvenile moa** | 4 walk + 1 idle | 5 | 4 of 5 | `moa_juvenile.png` referenced and **missing** (§2.4) |
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

### 4.5 UI — 16 assets

| Asset | Count | Notes |
|---|:--:|---|
| Four button glyphs, 2 states each | 8 | **Drawn glyphs, not emoji** |
| Timeline playhead | 1 | |
| Era band fills | 3 | Arrow or wave — `..._PLAN_V2.md` §10.1, **still open and blocking this** |
| Eruption markers | 2 | Whakamaru (~349 ka), Ōruanui (~25.5 ka) |
| Attract-loop prompt | 2 | Hand / touch icon, animated |

**None exist.** Bilingual labels are text and are a **content hook for mana whenua
co-design** — not art, and not ours to fill in.

### 4.6 Total

| Group | Assets | Exist | **New** |
|---|:--:|:--:|:--:|
| Plants | 45 | 11 | **34** |
| Fauna | 64 | 31 | **33** |
| Terrain / landform | 21 | 0 | **21** |
| Disturbance FX | 12 | 3 | **9** |
| UI | 16 | 0 | **16** |
| **Total** | **158** | **45** | **113** |

Coastal moa, if built, takes it to 163 / 118 new.

**113 new assets** against v2's stated "twenty sprites." That is the number the schedule
has to be built on. It doesn't change *what* to build — it changes *when the art starts*,
which is now, and it means Phase 5 runs in parallel with Phases 2–4.

The 45 in hand are also unevenly spread: the harrier, the little bush moa and tōtara are
finished; **terrain, FX and UI are at zero.** That's 49 assets nobody has started and
nobody is currently thinking of as art.

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
| Cost | **~10–25 ms** | **1.5–2.5 s** (see §5.3) |

`resetToAttract()` (`..._PLAN_V2.md` §4.2) is the soft path, built in Phase 1.5. The
whole point is that it stays in memory:

| Step | Work | Estimate |
|---|---|---|
| Re-seed RNG, zero `yearsBP` / `playTime` | scalar writes | <0.1 ms |
| Rebuild 4 fields at 256² | 4 × 65,536 float writes | **1–3 ms** |
| Return entities to pools | pointer work **if pooled**; ~20 ms if reallocating | **~1 ms** |
| Re-bake terrain base buffer | 65,536 writes into `pixels[]`, one pixel per cell | **5–15 ms** |
| Re-bake vegetation layer | see §5.4 | **5–10 ms amortised** |
| **Total** | | **~10–25 ms** |

> ✅ **Measured.** `tools/bootcheck.js` times six consecutive soft resets: **17–31 ms**,
> against **~950 ms** for a full `Game.init()` at Phase 1.5 — about 50× cheaper. *(Since
> Phase 3 the terrain bake is much heavier — supersampled paint, geography fields, relief
> — so `init()` is now ~1.8 s in the harness and a soft reset is ~100× cheaper. The soft
> path is unchanged; this only sharpens the rule.)*
>
> Getting there required splitting the two operations, because the first attempt simply
> called `init()` and cost the full 950 ms. `Game.init()` regenerates terrain noise over
> every cell *and* bakes four season buffers; `Game.resetEcosystem()` keeps the terrain
> and its baked buffers and replaces only the living world. **Terrain generation is ~95%
> of a reset that doesn't need to regenerate terrain** — and the land has no reason to
> change between visitors. `Kiosk.reseedEvery` fires a full rebuild every 12th reset so
> the landscape still varies across a day.

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
| **Sim grid** | **256² (65,536 cells)** | 512² quadruples every field op *and* the bake. The single most expensive number in the project. **Currently 512** (`CONFIG.mapGrid`) to preserve the existing plant/moa density tuning — the pre-Phase-1.5 portrait map was ~432×768. Drop to 256 in Phase 3 when the interval re-bake lands, and retune `plantDensity` and spawn counts in the same commit |
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
| `p5.js` | 5.4 MB unminified | ✅ **shipped:** `p5.min.js`, ~1 MB — saved ~4.4 MB and ~200–400 ms of parse |
| `p5.sound.min.js` | 200 kB | unchanged |
| Engine JS | 448 kB across 18 files | ~250 kB after the economy strip; bundle to 1 file |
| Sprites | 2.0 MB across ~90 loose PNGs, heading for 158 | **5 atlases** |
| Audio | **6.5 MB across 17 mp3s, all in `preload()`** | preload the ambient bed only; lazy-load the rest |
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

**The cliff is the re-bake, not the frame.** `TEMANAWA_TERRAIN_PLAN.md` §7 sets the
interval at ~400 sim-years: ≈1.3 bakes/s at the 500 yr/s baseline, but **≈13 bakes/s
under the Deep-time button's 10×**. At 13/s a bake gets ~5 ms before it starts eating
the frame — and a full 256² pixel write plus a vegetation pass is 10–25 ms.

`[BUILD]` **Three fixes, use all three:**

1. **Amortise.** Split the bake into 4 horizontal strips, one per frame. Cost per frame
   drops ~4×; the seam is invisible behind the existing cross-fade.
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

The terrain model is now the **SVG geography skeleton** (`TEMANAWA_GEOGRAPHY.md`,
`TEMANAWA_PLAN_V2.md` §7), not the two-heightmap lerp this section originally analysed.
Three conclusions from that analysis carried over and still hold:

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

## 7. Appendix — the v2 → v2.1 assessment trail

Kept so the reasoning is recoverable. All of these are now folded into
`TEMANAWA_PLAN_V2.md`; none of them is live guidance here.

| # | Finding | Resolved in |
|---|---|---|
| 1 | The art estimate was 4–8× low — "twenty sprites" against an engine contract of four-plus states per species | `..._PLAN_V2.md` §2, §8; §4 above |
| 2 | The predator was left "unchanged, tracking total prey biomass," discarding three sourced `[BUILD]` corrections — one of which inverts the cold-phase readout | `..._PLAN_V2.md` §5.2 |
| 3 | The cast silently lost kererū and huia and never mentioned the *Dinornis* dimorphism pair | `..._PLAN_V2.md` §5.1; notes added to both fauna docs |
| 4 | The two fauna documents contradicted each other on huia | `..._ECOLOGY_FAUNA.md` §8 and `..._FAUNA_POOL.md` §1, both annotated |
| 5 | Three of the four measured recovery times were invisible at any speed the kiosk runs at | `..._PLAN_V2.md` §3.4 — the `warp` field |
| 6 | The attract-loop reset was a single clause, on a product that is mostly attract loop | `..._PLAN_V2.md` §4.2; §5.1 above |
| 7 | Phase 3 kept the expensive half of the terrain work | `..._PLAN_V2.md` §7; §6 above |
| 8 | The two-layer canopy was filed as "don't simulate" while already being simulated via the `h` column | `..._PLAN_V2.md` §6.1 — stated as a render rule |
| 9 | Plant instancing was unaddressed and is the main performance risk | §2.3, §5.2 above |

---

**Reference:** `TEMANAWA_PLAN_V2.md` (the spine) · `TEMANAWA_PLAN.md` (v1) ·
`TEMANAWA_TERRAIN_PLAN.md` · `TEMANAWA_ECOLOGY.md` and the four habitat dives ·
`TEMANAWA_ECOLOGY_FAUNA.md` · `TEMANAWA_FAUNA_POOL.md` ·
`TEMANAWA_CONCEPT_ECOLOGY_FIRST.md` · `TEMANAWA_RESEARCH.md`
