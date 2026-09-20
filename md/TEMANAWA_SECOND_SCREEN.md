# Te Manawa — the second screen and the interaction overhaul

**Status:** design spec, ready to build against. Authored 2026-09-20.
Supersedes the "five buttons" model in `TEMANAWA_PLAN_V3.md` §6 (which now points here).

> This document is the spine for the **second touchscreen** — a 1080p, touch, no-network
> control surface that sits beside the 4K diorama — and for the **interaction overhaul** it
> drives on the sim. Where it disagrees with older docs about the *interaction model*, it
> wins; where it disagrees about the *land, climate or ecology*, `TEMANAWA_PLAN_V3.md` wins.

---

## 0. The governing change — geology no longer runs on its own

Today the clock (`DeepTime`) decrements `yearsBP` every frame: the run plays 1 Ma → 25.5 ka
by itself and the visitor only nudges the speed. **That is reversed here.**

> **The geology timeline is PAUSED by default.** The diorama lives at a fixed date — animals
> forage, seasons turn, plants grow and get browsed — but `yearsBP` does not move until the
> visitor spends a **timelapse** (the boost, station 3) or an **eruption skip** (station 3).

Everything the deep-time clock used to do on its own — climate drift, forest contraction,
the terrain morph — now happens *only while a timelapse is playing*. Between timelapses the
world is a living still of one moment. This is what makes the boost legible: you set up a
habitat, choose a species, press boost, and *watch* those ~1–20 kyr play out with your
change in them, instead of the land sliding past unattended.

See §6 for the model and §7 for the sim work it needs.

---

## 1. The physical install

Three stations along the touchscreen, left → right, matching the wireframe:

```
 STATION 1              STATION 2                         STATION 3
 habitat switch         encyclopedia / boost-select       activate

   FOREST   ┐                                              ( ERUPTION )
   WETLAND  │  up          [ STORM ]                        skip ahead
  ─CENTER─  ┤ (Select)     ┌───────────────────────┐
   LOWLAND  │  down        │  species card /        │      ( BOOST >> )
   ALPINE   ┘              │  encyclopedia entry    │       timelapse to the
                           └───────────────────────┘       next glacial/interglacial
```

- **One PC, two displays.** The 4K diorama runs the existing `index.html`; the touchscreen
  runs `secondscreen/index.html`. Both are served same-origin by `tools/serve.js`
  (`http://127.0.0.1:8080/` and `…/secondscreen/`), so they talk over `BroadcastChannel`
  with no server, no polling, and no network — the "a reset must never touch the network"
  invariant stays literally true.
- **The touchscreen owns all physical input** — the habitat switch, the plant-select
  control, the storm button, the boost button, the eruption button — updates its own
  display, and *relays* signals to the sim over the bus. Two browser windows share one
  keyboard focus, so letting the touch console own input and fan out avoids the "keystrokes
  only reach the focused window" trap.

### 1.1 The physical controls (analog → the page)

The page treats each control as a named **action**, bound to a key (HID) and/or a touch
target, so the exact wiring can change without touching app logic (`secondscreen/input.js`).

| Station | Control | Action(s) | Default key binding |
|---|---|---|---|
| 1 | Habitat switch | `habitatUp`, `habitatDown` (momentary) *or* `habitat:<pos>` (absolute) | `ArrowUp`/`ArrowDown`, or `q w e r t` for the 5 positions |
| 2 | Plant select | `plantPrev`, `plantNext`, `plantSelect` | `a`, `d`, `Enter` (and touch on the sprites) |
| 2 | Storm | `storm` | `s` |
| 3 | Boost | `boost` | `b` |
| 3 | Eruption | `eruption` | `e` |

> The switch is described centre-resting with two detents each way. The page supports both a
> **momentary up/down** switch (it steps through the positions) and an **absolute 5-position**
> switch (each position emits its own key). Pick one at install time in `input.js`.

### 1.2 The habitat switch positions

From the centre "Select a Habitat" rest, top → bottom:

| Switch position | Habitat | Reads as |
|---|---|---|
| up ×2 | **Forest** | closed podocarp–broadleaf forest (warm, interglacial) |
| up ×1 | **Wetland** | swamp forest and flax on wet alluvium |
| centre | *(Select a Habitat)* | neutral / attract |
| down ×1 | **Lowland** | open lowland — grass, scrub, pioneer trees |
| down ×2 | **Alpine** | subalpine tops — tussock, grass-trees, beech line |

(Order is exactly as specified: *"above it is wetland, then forest; below it is lowland then
alpine."* The vertical axis reads loosely as climate/topography, not a strict elevation
gradient.)

---

## 2. The touchscreen page

**Framework: none.** Plain static HTML/CSS/vanilla JS, classic scripts, no build step —
same rule as the diorama. The page is a document layout (title, a cluster of sprite images,
a species card with taxonomy and prose), which is what HTML/CSS does natively and a p5
canvas does badly. Served by the same `tools/serve.js`; reuses `../typefaces/` and
`../sprites/` directly.

### 2.1 File layout

```
secondscreen/
  index.html        the page shell (background slot, station panels, card, readout)
  secondscreen.css  styling — matches the mockups (cream serif titles, orange subtitles, dark cards)
  encyclopedia.js   DATA: habitats → plants → { names, scientific, description, fauna[], sprite, pos }
  bus.js            BroadcastChannel wrapper + the typed vocabulary (§3), shared shape with the sim
  input.js          physical/touch input abstraction (the §1.1 bindings live here)
  app.js            state machine: switch position, highlighted plant, clock/goal readout; renders
  README.md         how to run both screens, the bindings, the bus vocabulary
  assets/           per-habitat 1080p backgrounds + (optional) highlight loops — SUPPLIED BY ARTIST
```

### 2.2 Run

```
node tools/serve.js
# diorama:     http://127.0.0.1:8080/
# touchscreen: http://127.0.0.1:8080/secondscreen/
```

Launch both windows from one Chrome instance, same origin, one per display
(`--window-position` / `--kiosk`) — that is what lets `BroadcastChannel` connect and fills
each screen. Kiosk hardening (cursor hidden, no context menu, no pinch-zoom, `touch-action`
locked, large tap targets) is on the touch page, mirroring `TeManawa_kiosk.js`.

### 2.3 Highlight animation (when a plant is highlighted)

Use a looping **alpha WebM** (VP9, `yuva420p`), not a GIF and not JS-swapped PNG frames:
Chrome hardware-decodes it on the GPU, so a highlight loop costs almost nothing. Keep each
loop 2–4 s, muted, `autoplay loop playsinline`, and only play the *highlighted* species'
clip while the rest are paused/hidden, so at most one decodes at a time. GIF is wrong for
this art (256 colours band the painterly sprites; 1-bit alpha hard-edges the soft shadow).
Static PNG stickers are the fallback and are what the page ships with until the loops exist.
Author with e.g. `ffmpeg -i in.mov -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 0 -crf 30 out.webm`.

`tools/serve.js` serves `.webm`/`.mp4` (added alongside the existing types).

---

## 3. The bus — BroadcastChannel vocabulary

One channel, `'temanawa'`. Small **typed** messages `{ type, … }` with a dispatcher on each
side, so new signals slot in cleanly. Bidirectional: the touchscreen sends *intents*; the
sim sends *telemetry* so the readout tracks the clock.

### 3.1 Touchscreen → sim (intents)

| `type` | fields | sim effect |
|---|---|---|
| `hello` | — | handshake; sim replies with current `clock` + `goal` |
| `habitat` | `habitat` (`forest`/`wetland`/`lowland`/`alpine`/`null`) | optional: focus/hint the camera or highlight; safe to ignore at first |
| `plant` | `habitat`, `plantKey` | the highlighted species (station 2). Optional: preview highlight in the sim |
| `boost` | `plantKey`, `habitat` | **the main event** — regime-fit gate → per-species seed → begin timelapse to the next boundary (§6) |
| `storm` | — | `InstallHUD.press(game,'storm')` — works today, unchanged |
| `eruption` | `phase` (`down`/`up`) | eruption skip; maps to `InstallHUD.erDown/erUp` (tap = revert, hold = skip) |
| `deep` | — | legacy plain deep-time press (kept for parity; the boost replaces it on the wall) |

### 3.2 Sim → touchscreen (telemetry)

| `type` | fields | drives |
|---|---|---|
| `clock` | `yearsBP`, `glacialIndex`, `stage`, `stageName`, `mis` | the KYA date + glacial/interglacial label (sent ~4/s) |
| `goal` | `targetYearsBP`, `targetStage`, `targetStageName` | the goal readout (the next glacial/interglacial) |
| `timelapse` | `active`, `progress` (0..1), `yrPerSec`, `achieved` (bool/null) | the timelapse progress bar + goal-met indicator |
| `boostResult` | `plantKey`, `matched` (bool) | the immediate regime-fit verdict (right species for the climate?) |
| `eruptionSoon` | `name`, `yearsBP` | when a timelapse will stop early at a looming eruption (§6.3) |

The screen never assumes the sim is up: it renders from its own state and simply reflects
telemetry when it arrives. The sim never assumes the screen is up: the diorama is fully
operable from its own keys (`1`–`5`) as today.

---

## 4. Station 1 — the habitat screens

The switch chooses one of five screens. Each habitat screen (mockups) is:

- a per-habitat **1080p background** (topographic texture, tinted: forest green, wetland
  teal, lowland olive, alpine blue) — *artist-supplied* into `secondscreen/assets/`;
- the habitat **title**, top-left, in the cream serif display face;
- a **cluster of plant sprites** (positioned, each a selectable "sticker");
- the **card** on the right: "Select a Plant" prompt until a plant is highlighted, then the
  species card (§5).

The centre position is the **"Select a Habitat"** attract screen (mockup 1): centred card,
hand-tap glyph, title, orange subtitle, flanking trees.

### 4.1 Habitat → plant palettes

Drawn from the mockups and cross-checked against the biome palettes in
`levels/level_temanawa_scaffold.js`. **The four species shown on the mockup cards are
confirmed; the rest are my reading of the sprite clusters and are marked `TODO` for you to
confirm.** All live data-driven in `secondscreen/encyclopedia.js`.

| Habitat | Plants (mockup reading) | Card-confirmed |
|---|---|---|
| **Forest** | **Tōtara**, Nīkau, Tawa, (tree)Fern, Beech | Tōtara → Eyles' harrier |
| **Wetland** | Kahikatea, **Tī kōuka**, Flax, (tall podocarp), Tussock/sedge | Tī kōuka → kererū |
| **Lowland** | Nīkau, Tussock, (broadleaf), Tī kōuka, **Mānuka** | Mānuka → kōkako |
| **Alpine** | (tree)Fern, Tussock, Dracophyllum, **Red beech**, (beech/broadleaf) | Red beech → huia |

Plant keys map to `PLANT_TYPES` in `TeManawa_plant_defs.js` (`Totara`, `cabbagetree`,
`manuka`, `beech`, `nikau`, `tawa`, `fern`, `tussock`, `flax`, `kahikatea`, `dracophyllum`,
`coprosma`, `kowhai`), so a boost names a type the sim already knows.

---

## 5. Station 2 — the species card and the fauna link

Highlighting a plant (plant-select control, or touch) fills the card:

- the plant's **large sprite** (right of the card);
- its **common name** (serif) and **scientific name** (orange italic);
- its **description** (prose — Lorem in the mockups, so authored copy is *pending*, §8);
- the **fauna it supports** — one or two animated sprites, top-left of the card. This is the
  teaching link: *boosting this plant helps these animals*. The sim reads the same link when
  the boost fires (a Tōtara boost is also a harrier boost, downstream).

**Plant ↔ fauna links (confirmed from the mockup cards):**

| Plant | Fauna shown | Sprite source |
|---|---|---|
| Tōtara | Eyles' harrier (kērangi) | `sprites/EylesHarrier/…` |
| Mānuka | Kōkako | `sprites/Flighted/Kokako…` |
| Tī kōuka | Kererū (×2) | `sprites/Kereru_*.png`, `sprites/Flighted/Kereru/` |
| Red beech | Huia (×2) | `sprites/Flighted/HuiaMale…`, `HuiaFemale…` |

Every other plant's fauna list is `TODO` in the data file. The full fauna roster the links
can point at: the moa guild (`upland_moa`, `little_bush_moa`, `stout_legged_moa`,
`mantells_moa`, `heavy_footed_moa`, + the giants/eastern/crested), `giant_goose`,
`north_island_takahe` (mōho), `north_island_brown_kiwi`, `finschs_duck`, and the flighted
birds `kereru`, `kokako`, `huia`, `tui`, plus the raptor `eyles_harrier`.

The **storm** button lives at this station (one, maybe two non-deep-time interaction buttons;
only storm for now). It sends `{type:'storm'}` — already wired on the sim to
`InstallHUD.press(game,'storm')`.

---

## 6. Station 3 — the boost, the timelapse, the goal

### 6.1 The boost

Pressing **boost** sends `{type:'boost', plantKey, habitat}`. On the sim:

1. **Regime-fit gate.** A species suits either the *interglacial* (warm) or the *glacial*
   (cold), read from its `coldTolerance` against the current `Climate.glacialIndexAt(yearsBP)`
   — the same idea as today's FOREST/TUSSOCK match (`InstallHUD._growMatches`,
   `Simulation.seedGrowth`'s `warmMax`/`coldMin` split), but *per named species* rather than
   the whole warm/cold set. Reply `{type:'boostResult', plantKey, matched}`.
2. **Populate.** Seed the sim *especially with the chosen species* — a new
   `Simulation.seedSpecies(plantKey, count)` entry point (§7.3). A matched boost seeds
   generously; a mismatched boost seeds little or nothing and the scene desaturates (the
   existing habitat-health regime-fit lesson, `Game._updateHabitatHealth`).
3. **Timelapse.** Begin the fast-forward to the next boundary (§6.2).

The associated fauna (§5) ride the plant: a matched plant boost should also lift its linked
species' recruitment/refound weighting so the visitor sees the animals respond. Exact
coupling is a §7 tuning task.

### 6.2 The timelapse — ramped, to the next glacial/interglacial

Not a fixed 50 kyr jump. The timelapse **always advances to the start of the next regime**,
so successive boosts alternate glacial ↔ interglacial:

- **Rate ramp:** start at **500 yr/s**, ease up to **5000 yr/s**, over **~20 s**. (Today's
  `DeepTime` runs a flat 500 yr/s × a 10× deep multiplier; this replaces that with an eased
  ramp between two absolute rates. See §7.2.)
- **Destination:** the nearest **regime boundary** ahead — the year where the glacial index
  crosses out of the current stage into its opposite (interglacial ↔ glacial). Computed from
  the `Climate` anchor curve (§7.1). This is the **goal**: "reach the next interglacial /
  glacial."
- **Goal indicator:** during the timelapse the screen shows progress and, at the end,
  whether the **goal was achieved** — i.e. the boosted species was the right regime for where
  the clock landed, and it established rather than desaturating. Sent as
  `timelapse.achieved`.

Because the geology is otherwise paused (§0), the timelapse is the *only* time climate
drifts, the forest contracts/expands, and the terrain morphs — so all of that plays out
inside the ~20 s with the visitor's chosen species living through it.

### 6.3 Eruption-aware ending

If a boost is initiated **near an eruption** (an entry in `DeepTime.ERUPTIONS` falls between
`yearsBP` and the computed boundary), the timelapse instead **plays out only the years up to
the eruption date**, so the visitor sees the boost result first. Then, **a couple of seconds
after the timelapse ends, the eruption fires** (the existing ash/clearing beat,
`Game.applyEruptionAt`). Send `{type:'eruptionSoon', name, yearsBP}` when this path is taken
so the screen can foreshadow it.

### 6.4 The eruption button

Still present at station 3, unchanged in spirit: **skip way ahead** to the next volcanic
event. Maps to the existing eruption navigation (`InstallHUD.erDown/erUp` →
`Game.applyEruptionAt`, tap = revert to the previous event, hold = skip to the next). It is
the "jump the geology forward hard" control, distinct from the boost's measured timelapse.

---

## 7. What the sim needs (the "proceed with the build" work)

This is the sim-side change list. The screen and the bus receiver are built; these are the
behaviours the bus intents drive. Each is scoped to a file so the build can proceed piece by
piece. **None of this is wired blind — the risky parts (the paused clock, the rate ramp, the
boundary engine) are called out because they ripple into climate, the terrain morph, the
eruptions and the "readable in a short dwell" pedagogy, so they want deliberate tuning.**

### 7.1 A regime-boundary finder — `TeManawa_climate.js`

Add a pure helper: given `yearsBP` and the play direction (younger), return the next year at
which `glacialIndexAt` crosses the interglacial/glacial threshold (reuse `stageOf`, or a
single 0.5 cut). Scans the `ANCHORS`/samples the curve. Pure, testable in `bootcheck.js`
against known terminations (e.g. Termination II ≈ 128 ka, MIS 5e ≈ 122 ka).

### 7.2 The paused clock + the ramp — `TeManawa_time.js`

- **Pause by default.** `DeepTime.update()` holds `yearsBP` unless a timelapse (or an
  eruption seek) is active. Add `paused`/`_timelapse` state; the ambient sim keeps running at
  the fixed date.
- **Ramped timelapse.** Replace the flat `yrPerSec × deepMult` with
  `beginTimelapse(targetYearsBP)` that eases the *rate* from 500 → 5000 yr/s over ~20 s and
  stops at `targetYearsBP` (or the eruption cutoff, §6.3). Keep it photosensitivity-safe
  (ramp ≥ 500 ms, ≤ 3 luminance transitions/s — `TEMANAWA_BUILD_V3.md` §3).
- The morph is heavy and synchronous (`terrain.morphTo`), so during a timelapse the
  *cheap* per-frame changes (climate, forest-band contraction) carry the motion and the
  terrain morphs at the destination — matching how eruption jumps already morph once at the
  target. Continuous morphing is out of scope.

### 7.3 Per-species seeding — `TeManawa_simulation.js`

Add `seedSpecies(plantKey, count)` beside `seedGrowth`: seeds the *named* type into any biome
whose palette contains it, on land, with the same density gate. The boost calls this instead
of the warm/cold-set-wide `seedGrowth`. (Fauna coupling — lifting the linked animals'
recruitment — is a follow-on in the fauna files.)

### 7.4 The bus receiver + dispatcher — `TeManawa_bus.js` (new; wired from `setup()`)

A small classic-script module: opens the `'temanawa'` channel, dispatches §3.1 intents to
`InstallHUD.press` / the new entry points, and pushes §3.2 telemetry (a `clock`/`goal` tick
each frame-ish, plus event replies). Added to `index.html` load order **after** `sketch.js`
(it needs `game`, `InstallHUD`, `DeepTime`). Guarded so the diorama runs identically with no
second screen present. **Shipped in this pass as: storm/eruption/deep wired to existing
seams; habitat/plant/boost as marked stubs pointing here.**

### 7.5 Telemetry emit — `TeManawa_sketch.js` (`Game.update` tail)

Once per few frames, `TMBus.emitClock()` and, while a timelapse runs, `emitTimelapse()`.
Cheap; never allocates in `draw()`.

---

## 8. Encyclopedia content status

The mockups' body copy is **Lorem ipsum**, so authored museum copy does not exist yet. The
data file ships with:

- **Real** for the four card species: common + scientific names and the fauna link
  (Tōtara/*Podocarpus totara*→harrier; Mānuka/*Leptospermum scoparium*→kōkako;
  Tī kōuka/*Cordyline australis*→kererū; Red beech/*Nothofagus fusca*→huia).
- **Placeholder** (`description: 'TODO …'`, best-guess `fauna: []`) for every other plant.

Fill `secondscreen/encyclopedia.js` with final names, prose and fauna links; nothing in the
page logic changes when you do.

---

## 9. Open decisions / assumptions to confirm

1. **The 5 plants per habitat** (§4.1) and their on-screen positions are my reading of the
   mockups — confirm the exact roster and swap the placeholders.
2. **Boost seeding strength** — how many of the chosen species a matched boost seeds, and
   whether a mismatched boost seeds *nothing* or a token few that then wilt.
3. **Fauna coupling** — does a plant boost actively spawn/refound its linked fauna, or only
   improve their odds? (§7.3 follow-on.)
4. **Switch hardware** — momentary up/down vs absolute 5-position (§1.1); set in `input.js`.
5. **The readout placement** — the KYA + glacial/interglacial + goal strip is not in the
   mockups; it is a bottom strip that is part of **debug mode** (off by default; `?debug=1` or
   the backtick key toggles it, alongside the on-screen test buttons). Decide whether the
   glacial/interglacial goal readout belongs on the kiosk screen proper (the spec §0/§2 calls for
   it) or stays debug-only / moves into the background art.
6. **Ramp numbers** — 500→5000 yr/s over ~20 s is the spec; final feel is a tuning pass
   against the photosensitivity budget.

---

## 10. Build order

1. ✅ This spec + the plan/doc updates.
2. ✅ The touchscreen page (`secondscreen/`) — renders from data, sends intents, shows
   telemetry; static-sprite highlights (WebM loops drop in later).
3. ✅ The bus receiver (`TeManawa_bus.js`) — storm/eruption/deep live; habitat/plant/boost
   stubbed.
4. ⏳ The sim overhaul (§7) — the boundary finder, the paused clock + ramp, `seedSpecies`,
   the telemetry emit, and the tuning pass. **This is "proceed with the build."**
