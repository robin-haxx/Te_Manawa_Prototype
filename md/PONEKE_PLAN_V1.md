# Avian Age: Ancient Pōneke — Build Plan v1

**A fork of Te Manawa for the Wellington region**, for the CubaDupa commission (Te Aro). Written
2026-11-04 from Robbie Kinnaird's pre-design outline (07/10/26) and the notebook pages, against the
Te Manawa code as it stands (`main` at `bf8c3bf`). **Nothing in this document is built.** It says what
carries over, what changes, what is new, and how much of each there is.

> **Governing principle, inherited** (`TEMANAWA_PLAN_V3.md` §0): *a cartoon seen from above, not a
> survey.* **Added for Pōneke: the room is the controller.** There is nothing a visitor has to learn.
> Being there, coming closer and reaching toward the wall are the inputs; everything else is a bonus
> that must never be required. The wall answers every input within a tenth of a second, so people
> discover what they did.

**Reads with** the Te Manawa spine, which this plan assumes you know: `TEMANAWA_PLAN_V3.md` (the
design), `TEMANAWA_BUILD_V3.md` (budgets), `TEMANAWA_SECOND_SCREEN.md` (the interaction model this
one replaces), `TEMANAWA_GEOGRAPHY.md` + `TEMANAWA_COAST_PLAN.md` + `TEMANAWA_PALAEO_ATTRACT.md` (the
land), `TEMANAWA_NATURAL_HISTORY.md` §I (which already carries the Cook Strait dates this piece
turns on), `../CLAUDE.md` and `../MISTAKES.md`.

---

## Contents

0. The brief, as received
1. The reuse ledger: what carries over, what changes, what is new
2. The land: two frames, one engine
3. Time: the clock runs on presence
4. The sensor: the Kinect bridge and the presence model
5. Gestures: the vocabulary, and what each one does
6. The zoom: proximity → view, and the handoff between frames
7. The cast and the art pipeline
8. The soundscape
9. Environment events: wind and tectonics
10. The attract: the land before the window, again
11. The install: the room, the gear, the numbers
12. Testing, iteration and what can only be tuned in the room
13. Phases and the extent
14. Scope tiers (the proposal's reductions, costed)
15. Risks, ranked
16. Open decisions
17. Setting up the repository

---

## 0. The brief, as received

From the outline and the notebook, in the order the client's questions came:

| # | Question | The outline's answer | What it means for the build |
|---|---|---|---|
| 1 | **Place** | The harbour, the sea inlet, the Tararua; the Whātaitai and Ngake story; the ranges rising and the Hutt | A Wellington land model, authored like the Manawatū one (§2); the harbour's formation as dated events; a cultural layer that is **co-design, not code** (§16) |
| 2 | **History and process** | 2–1 Ma most of the lower North Island submerged; the Wellington greywacke block an island between the northern and southern landmasses; strips of land, the "land bridge", across which species crossed; shown **zoomed out**; **zooms in** to the city area when people stand closer | **Two frames** (a wide geological one and a close living one) and a **proximity-driven zoom** between them (§2, §6). The land-bridge story is largely already researched in this repo (§2.1) |
| 3 | **What people shape** | Te Manawa's habitat boost, now **pointed** at flora and fauna; effects and the **timeline's speed scaled by how many people and how close**; storm → **wind**; eruption → **terrain change / uplift**, interaction-driven | Presence drives the clock (§3); reach/point is the boost (§5); wind and tectonics replace storm and eruption (§9) |
| 4 | **Personifiable fauna** | Keep moa, harrier, kererū, tūī, kōkako, huia, kiwi; **add kākā and marine life** (penguins, whales) | Three new species and a shoreline/sea habitat (§7) |
| 5 | **Media** | **Photo-based** sprites from video; stylised 3D image sequences for extinct species; an **immersive field-recording soundscape** is the main thing that brings the fauna to life | A second art pipeline and a new audio engine; Te Manawa's audio is off and is a game-sfx manager (§7, §8) |
| 6 | **Testing** | With Byron / James / the Te Aro designers; Kinect prototyping at home with a basic projector | A presence simulator so the build runs without the sensor, and a replay corpus from the home rig (§4.5, §12) |

**Gear:** projector, surround speakers, a Kinect (Robbie supplies), a laptop, bean bags. **Room:** a
4 m × 2 m wall with 2–3 m clear in front; the notebook sketches 3–5 m of floor each way and a wall
1.5–2.5 m high.

**The notebook's interaction vocabulary**: hands up · hands out · standing left / right · approach
(a gradual ramp of proximity) · hug / cross · slow arm raise · point · clap · crouch · sit · jump; a
"ripple" on an area if projected on the floor. Its two notes on the room: *ambient effect of presence
in space (scales effect factor, gradual ramp of proximity)* and *habitat-specific (not pixel-perfect)
effects when close to the sim*. §5 keeps the ones a room full of strangers will actually do.

**The proposal's own scope reductions** (touchscreen instead of projector + Kinect; a smaller screen;
one fixed view; fewer species; present Te Manawa itself) are costed as tiers in §14.

---

## 1. The reuse ledger

Everything in `index.html` order. *Keep* = runs as is. *Adapt* = the module stays, some of it
changes. *Replace* = a new module takes its role. *New* = does not exist in any form. Size is code
effort only, one developer: S ≤ 2 days · M ≤ 1 week · L 1–3 weeks · XL more, or research-bound.

| Module | Te Manawa role | In Pōneke | Verdict | Size |
|---|---|---|---|---|
| `TeManawa_kiosk.js` | watchdog, idle, soft reset, error log, key lockdown | the same, plus: presence from the bridge restarts the idle timer; a lost bridge is a kiosk event (fall to the attract, keep running, never crash) | adapt | S |
| `TeManawa_audio.js` | an off, game-era sfx manager | **the soundscape engine** (§8): beds per frame and habitat, event calls, panning, the zoom mix | replace | L |
| `registry`, `spatial` | species/plant/biome registry; spatial hashes | unchanged | keep | — |
| `TeManawa_simulation.js` | the living world | the same, plus a **positional boost** (`seedSpeciesNear`, `boostFaunaNear`: today's `seedSpecies` scatters by habitat, not place), a sea-entity list for the whales, spawn bands that follow a moving camera | adapt | M |
| `TeManawa_plant_defs.js` | the Manawatū flora table | a Wellington table: the beech quartet for the Tararua/Remutaka (silver, red, hard, black), leatherwood and herbfield for the tops, coastal scrub, the Wairarapa wetland set; the ten drawn species carry over | adapt | S + art |
| `TeManawa_species_data.js` | MOA_SPECIES, EAGLE_SPECIES | the two moa the story needs (*Dinornis* and *Pachyornis*, "split as species crossing"), the harrier; **kākā, penguin, whale** added | adapt | S + art |
| `TeManawa_entity_sprites.js` | SpriteAngle, ArtMode, ART_SETS | a **photo-derived art set per species** beside the drawn one (`ART_SETS` already carries sets per species); atlas budget re-checked | adapt | M + art |
| `geo/manawatu.svg` → `.geo.js` | the SVG skeleton | **two new skeletons**: `geo/poneke_wide.svg`, `geo/poneke_close.svg` (§2) | replace | L (the drawing) |
| `TeManawa_terrain.js` | generator, noise, classify, relief bake, LOOK, the dated `GEO_EPOCHS` | the engine is kept whole; **the Manawatū term set is replaced** (`palaeo*`, `southSink*`, `strait*`, `lake*`, `mainArm*` are all that river's story) by a Wellington set; **two instances** (one per frame) | adapt | **XL** (research-bound, §2.4) |
| `TeManawa_projection.js` | plan-oblique 3/4 | unchanged; `screenToWorld` is what pointing needs | keep | — |
| `seasons`, `climate` | glacial clock, LR04 curve, sea anchors | unchanged: the climate is global; the coast is authored per frame as shelf bathymetry | keep | — |
| `atlas`, `water` | strips; river decals, eels, sea shimmer | unchanged (the harbour and strait are big sea areas; shimmer cost scales with sea cells, check) | keep | S |
| `boid`, `moa`, `eagle`, `kereru`, `kokako`, `huia`, `tui`, `kiwi`, `goose`, `takahe`, `finsch_duck`, `egg`, `plant`, `placeable` | the cast | kept; the goose, mōho and duck stay defined (their art exists) and founding them is a level decision; `placeable` stays the dead path it is | keep | — |
| `TeManawa_outline.js` | live outline prototype | kept as is (on for two species); the pointed-at outline reuses the boost outline instead | keep | — |
| `spriteatlas`, `glbatch` | runtime atlas; the WebGL entity layer | unchanged in kind; the GL layer captures the live 2D transform, so a **camera is free there**; the atlas pages must fit the photo art (§7.3) | keep | S |
| `TeManawa_time.js` | DeepTime: window, dial, timelapse, eruptions, aftermath | the **dial becomes the presence rate** (§3); the window is Wellington's; `ERUPTIONS` becomes dated **tectonic events** | adapt | M |
| `TeManawa_goals.js` | plant goals, boost verdicts | parked: there is no card to read a question on. Its judging stays available for a caption later | park | — |
| `TeManawa_hud.js` | timeline, year, goal line, five buttons, storm/ash/wind FX | timeline + one caption; no buttons; **wind FX kept and extended**, the eruption charge/flash/shake re-used as the **quake**, the ash cover dormant | adapt | M |
| `TeManawa_rivernames.js` | names along channels | kept; Wellington names, per frame, the names of the time | keep | data |
| `TeManawa_palaeo.js` | the 4 Ma → 1 Ma attract | **becomes the wide frame itself** (the far band and the empty room), not just an attract: its own clock, its captions, the dial-as-speed, reversible | adapt | L |
| `debug`, `plant_debug`, `devtools` | overlays and LOOK/GEN tools | kept; a **presence panel** (bodies, bands, reach targets, gesture state) added | adapt | S |
| `TeManawa_UI.js`, `level_format`, `levels/` | host; level schema; the scaffold | **two level definitions** (wide, close), each with its own biomes, caps and knobs | adapt | M |
| `TeManawa_sketch.js` | CONFIG, Game, setup/draw | the **camera** (`_updateViewTransform` becomes per-frame and animated), the **frame switch** and its crossfade, presence hooks | adapt | L |
| `TeManawa_bus.js`, `secondscreen/` | the console over BroadcastChannel | the bus is kept as the dev and debug driver (the Te Manawa console still works against it); the console is not shipped | keep | — |
| **`kinect-bridge/`** | — | a separate process: the sensor SDK → skeletons over a localhost WebSocket (§4.2) | **new** | L (+ spike) |
| **`Poneke_presence.js`** | — | the page's presence field: bodies → bands, lateral focus, reach targets, dwell (§4.4) | **new** | M |
| **`Poneke_gestures.js`** | — | the detectors, with hysteresis, debounce, cooldowns and arbitration (§5) | **new** | M, then room-tuned |
| **`Poneke_camera.js`** | — | proximity → view, the eased camera, the LOD rules, the two-frame handoff (§6) | **new** | L |
| **`presence-sim/`** | — | a page that fakes bodies with the mouse and replays recordings into the same socket (§4.5) | **new** | M |
| `tools/bootcheck.js` | the harness | new sections: presence, gestures (from recordings), camera handoff, the second frame's geography, the soundscape's silence invariants (§12) | adapt | M, ongoing |

Te Manawa debt that comes along with the fork and should be decided early rather than inherited by
accident: `CONFIG.mapGrid` still 512 (the fork's **two** grids make this twice as expensive);
the dead placeable path; the 586 MB git history (§17); the unused assets (`PLAN_V3` §14.4).

---

## 2. The land: two frames, one engine

### 2.1 The story, with what the repo already knows

The geological story the outline wants told is the southern half of the one Te Manawa already tells.
`TEMANAWA_NATURAL_HISTORY.md` §I and `TEMANAWA_COAST_PLAN.md` carry these, dated and sourced, and
`research/` holds Trewick & Bland 2012 in full:

| Beat | Date | Source in the repo | Where it shows |
|---|---|---|---|
| The lower North Island a scatter of low islands in a shallow sea; the axial basement a low finger; the Manawatū Strait across it, widest at 2.4 Ma, closed by ~1.63 Ma | 4 → 1.6 Ma | `NATURAL_HISTORY` §I.1, `PALAEO_ATTRACT` §1–2 (built for the Manawatū frame) | wide frame, the north half |
| The Wellington block joined to Marlborough by a low, narrow land bridge; the two islands' freshwater faunas still linked | until ~1 Ma (genetics: separation ~0.7–1 Ma, Craw et al. 2019) | `NATURAL_HISTORY` §I.1, §I.8 | wide frame, the south |
| **Cook Strait forms** | ~500 ka (Trewick & Bland after Lewis et al. 1994; the notebook's "opens + deepens 0.5 Ma") | `NATURAL_HISTORY` §I.1, §I.4 | wide frame, the turn of the piece |
| The strait **re-bridged at glacial lowstands**, Cook Strait last breached ~16 ka after the ~120 m LGM fall; the extent of the bridge is uncertain | each glacial, last at the LGM | `COAST_PLAN` §0, §2.1 (NIWA) | both frames: the sea-level coast model already does this if the shelf is authored shallow enough |
| The wave of uplift travelling south: the Marlborough Sounds sinking, the Wellington coast rising in steps (the Turakirae Head raised beaches, the notebook's "staircase of uplifted beach") | last ~1 Ma; each step a great earthquake | `NATURAL_HISTORY` §I.1b | close frame, the south coast |
| The harbour: a fault-angle basin on the Wellington Fault; at times a lake or floodplain rather than sea (the notebook cites Hector / Crawford 1874, "likely intermittent"); the Hutt building its delta | late (hundreds of ka → Holocene) **[verify]** | not yet in the repo: research | close frame, the centre |
| Whātaitai and Ngake: Ngake's escape opens the harbour to the sea; Whātaitai stranded, lifted by an earthquake into land (the notebook: "accurate to how mountains form", the 1460 Haowhenua uplift of the Miramar isthmus) | the story's own time | not in the repo: **co-design with Taranaki Whānui ki te Upoko o te Ika and Ngāti Toa Rangatira** before anything is drawn | close frame, if it is told at all |

Two things the Manawatū build learned that apply directly: **one land model** (the pre-window land
is the same generator at older dates, never a second map), and **a moving coast is a ceiling, not a
lerp** (`MISTAKES.md`, the spiky half-drowned shelf). Both are rules the Wellington terms inherit.

### 2.2 The wide frame: the geological story, land only

- **Extent:** roughly the Kāpiti coast and the southern Whanganui Basin in the north-west, the
  Wairarapa basin in the east, the Wellington block in the middle, Cook Strait and the Marlborough
  shore across the bottom. About 150–200 km across. The notebook's three thumbnails (Manawatū basin /
  N. Isl · the block · the Wairarapa basin · S. Isl) are this frame.
- **What it shows:** the block as an island; the strips of land north (the Tararua finger, which is
  Te Manawa's own "N–S land bridge" seen from the other end) and south (the Marlborough bridge); the
  basins filling out; Cook Strait opening and deepening; then the glacial coast breathing, with the
  strait closing and opening on the sea-level curve; the Wellington Fault's line.
- **Nothing lives in it.** This is the `TeManawa_palaeo.js` idiom: a land-only sequence with its own
  clock, captions and the names of the time, every swap crossfaded. It is both the empty-room attract
  (§10) and the **far band** of the zoom (§6). Its cost model is the attract's: a generous morph slice,
  about one bake a second.
- **Its window:** 4 Ma → the present (the attract today stops at 1 Ma because the living world takes
  over there; here the wide frame plays on through the glacial cycles so the Cook Strait bridges show).

### 2.3 The close frame: the living world

- **Extent:** the harbour, Te Awa Kairangi / the Hutt valley, the city hills, the south coast to
  Turakirae, the Remutaka foot; about 30–40 km across. The notebook's "harbour" thumbnail.
- **What lives in it:** the cast (§7), the habitats (beech-heavy ranges, lowland podocarp, the
  Wairarapa-side wetland if the frame reaches it, the coast and the sea with its whales and penguins),
  the wind and the quakes (§9).
- **Its window:** proposed **~500 ka → ~1 ka** (Cook Strait is open; the glacial cycles sweep the
  coast; the harbour forms; the raised-beach steps accumulate; nobody has arrived). Whether it runs
  into the human era (Haowhenua, 1460) is a co-design decision (§16), not a technical one.
- **The sea is a real place here, not an edge.** Te Manawa's coast is where the land stops. Pōneke's
  close frame has a harbour in its middle and a strait along its bottom, so the sea needs its own
  habitat entries (penguins on the shore cells, whales on deep-sea cells; `_paintGridPass1` already
  classifies sea first by elevation) and the shimmer's cost over a large sea area needs measuring.

### 2.4 What has to change in the engine

1. **Two `TerrainGenerator` instances** behind a `Frame` object (`{ terrain, level, geo, names,
   window }`), each with its own SVG skeleton, biome table (the one place the ground look is
   authored), `GEO_EPOCHS` term set and river names. `Game.init()` bakes both; the close frame's four
   season buffers are the expensive ones and bake under the attract's dark as today. Memory is the
   check: two sets of season buffers at the paint supersample, plus the morph back buffers.
2. **A Wellington term set.** `TerrainGenerator.GEO_EPOCHS` and the `palaeo`/`southSink`/`strait`
   terms in `geoTimeFactors` and `_combineGeo` are the Manawatū's story, named and shaped for it. The
   mechanism (dated anchor curves → smoothstepped factors → positional ceilings and masks → one
   combine) is exactly what Wellington needs, but every term is new: the block's island core, the
   north and south bridges as dated land levels, the Cook Strait trench deepening, the basins' shelves,
   the harbour's subsidence, the raised-beach steps. **This is the research-bound part of the whole
   project.** The Manawatū set took about six weeks of calendar time across October–November and left
   eight entries in `MISTAKES.md`; expect the same shape of work with a head start on the rules.
3. **The term set is per frame but the dates are shared.** A date must read the same in both frames
   (the strait open in the wide frame is open in the close one), so the anchors live in one dated table
   both frames' factor functions read, and the harness asserts the agreement at the handoff dates.
4. **The shelf is authored, per frame, for the bridges.** The sea-level coast floods a baked shelf by
   contour (`COAST_PLAN` §5). Whether Cook Strait closes at the LGM in the wide frame is therefore a
   question of what depth the strait's sill is drawn at. NIWA has it closed; the extent is uncertain
   (`COAST_PLAN` §0). Draw it so the bridge appears at the deepest lowstands and nowhere else, and
   write down the depth chosen.
5. **`mapGrid`.** Two grids at 512² is twice the single most expensive number in the project. The
   wide frame has nothing alive on it and can run at 256² today; the close frame inherits the 512 → 256
   decision (`PLAN_V3` §16.5) and should take it, because the camera (§6) will magnify its cells.

---

## 3. Time: the clock runs on presence

Te Manawa's governing interaction change was that geology is paused until a visitor spends a boost.
Pōneke's is its mirror: **geology runs at the pace of the room.**

| Room | Rate | What the visitor sees |
|---|---|---|
| Empty | the attract pace (the wide sequence at `kyrPerSec`) | the land before the window, looping |
| One person, far | a slow drift (≈ dial detent 5–8: a few hundred years a second) | the close frame's living world, the coast breathing slowly, the forest cycling |
| Several people, or anyone near | faster (detent 15–25), capped at `tlMaxRate` 5,000 yr/s | the land changes while you watch; the window's 500 ka plays in about two minutes at the cap |
| A reach / point (§5) | a local boost, and a short timelapse step as today's boost gives | the pointed-at habitat livens and the clock surges briefly |

- **Mechanism:** the existing time dial is the whole of it. `DeepTime.dialSet(step)` already maps a
  detent 0–30 onto a power curve to 5,000 yr/s with a 0.6 s exponential ease, survives resets and
  never slows a timelapse. Presence writes the detent (`presence → step`, a smooth function of count
  and the nearest body's proximity, with hysteresis); raise `dialEaseSeconds` to about 2 s so arrivals
  and departures read as a swell, not a gear change.
- **The end of the window** → the wide sequence (§10), as end-of-window does today → back to the
  close frame when someone is there.
- **Photosensitivity is unchanged in kind and tighter in practice:** a room that empties and fills
  swings the rate, and the rate sweeps the coast. The sea-breath cut-off (`seaBreathOff`, a cycle
  every 4 s would flicker) and the morph crossfade rules carry over; add a rate-of-change limit on the
  detent itself (no more than N detents per second) and keep the ≤ 3 luminance transitions/s audit
  (§12).
- **The plant goals are parked.** They were a question on a card; there is no card. The boost's
  regime-fit lesson (the wrong plant for the climate desaturates the scene) survives in a softer form:
  a reach livens what *is* there, and what is there is already right for the climate.

---

## 4. The sensor: the Kinect bridge and the presence model

### 4.1 Which Kinect

The outline says "Kinect (I can supply)" without the model. It decides the first two weeks:

| Sensor | Status | Bodies / joints | Range, field | Path to the page | Verdict |
|---|---|---|---|---|---|
| **Kinect v2** (Xbox One + USB adapter) | SDK 2.0, Windows only, USB 3; discontinued but works | 6 bodies, 25 joints, hand open/closed, 30 fps; depth 512×424 | 0.5–4.5 m; 70° × 60° | Node binding (`kinect2`, a native module built against SDK 2.0) or a small C# console app; either way skeletons out over a socket | **the default if this is what is in hand**: the best-trodden body-tracking path for an installation. The native build is the risk: spike it first |
| Kinect v1 (Xbox 360) | SDK 1.8 / OpenNI; old | 2 full skeletons, 20 joints | 0.8–4 m; 57° × 43° | as above, older bindings | fall-back only: two tracked bodies is too few for a crowd, and the field is narrow for a 4 m wall |
| Azure Kinect DK | discontinued (2023); the Body Tracking SDK needs a capable GPU (NVIDIA, or DirectML on 1.1+) | many bodies, 32 joints | 0.5–5.5 m, wide field | Body Tracking SDK via Node (`kinect-azure`) or Python | fine if owned; do not buy one |
| Orbbec Femto Bolt | the Azure Kinect's successor in practice: runs Microsoft's Body Tracking SDK through Orbbec's wrapper, same GPU need | as Azure | as Azure | as Azure | the thing to buy if a new sensor is needed and the laptop has the GPU |
| A webcam + in-page pose estimation (MoveNet MultiPose in TensorFlow.js) | no SDK, no native module, no depth | up to 6 bodies, 17 2D joints | the camera's field; proximity only from apparent size and floor position | runs in the page itself, no bridge | **the de-risking fall-back** if the Kinect path stalls; weaker proximity, no hand state, but it ships |

Whatever the sensor, **the page never knows which.** It sees one JSON vocabulary from one socket.

### 4.2 The bridge

```
 sensor SDK  →  kinect-bridge (its own process)  →  ws://127.0.0.1:8081  →  Poneke_presence.js (the page)
                  · 30 Hz body frames                 JSON frames             · bands, focus, reach, gestures
                  · a heartbeat                                               · the kiosk's presence
                  · a recorder (→ JSON clips)                                 · BroadcastChannel out, so the
                  · reconnect, never exits                                      bus and the console still drive the sim
```

- **A frame:** `{ t, bodies: [{ id, tracked, joints: { head, neck, spineBase, shoulderL/R, elbowL/R,
  handL/R, hipL/R, kneeL/R, ankleL/R: [x, y, z, confidence] }, handL, handR }] }` in sensor metres.
  The wall-plane and floor transforms are applied page-side from the calibration file, so a sensor
  swap changes nothing downstream.
- **Invariants, inherited from the console:** the page runs identically with no bridge (as it does
  today with no console: presence falls to "empty", the attract plays); a reset never touches the
  socket; the bridge reconnects with backoff; a bridge heartbeat older than a few seconds is a kiosk
  event (log, fall to the attract, keep the frame loop alive); a supervisor restarts the bridge as it
  does the server and the browser (`TEMANAWA_OPERATIONS.md` §2.5).
- **Localhost is not the network.** "A reset must never touch the network" stays literally true: the
  socket is on `127.0.0.1`, and nothing on the visitor path waits on it.

### 4.3 Calibration

A one-off routine, saved as JSON beside the level: stand on four marked floor spots (the sensor's
pose relative to the floor and the wall), then point at four marked wall spots (the wall plane for
reach). The debug overlay's presence panel draws the bodies, the bands and the reach rays over the
world, so a drift is seen at a glance. **Re-run it whenever the projector or sensor is moved**, and
put that in the operator guide.

### 4.4 The presence field

`Poneke_presence.js` turns bodies into the few numbers the rest of the build reads:

| Field | From | Smoothing |
|---|---|---|
| `count` | tracked bodies that have persisted ≥ 500 ms | a lost body decays over 1 s, so a passer-by never flickers the room |
| `nearest` (m) and its **band** (far / mid / near) | the closest body's head or spine-base to the wall plane | an exponential ease, and **hysteresis** on the band edges (≈ 0.3 m), with a 2 s minimum dwell in a band |
| `focusX` (0..1 along the wall) | the lateral position of the nearest body, or the centroid of the near ones | eased; this is "standing left / right" and it is free |
| per body: `reach` (a screen point or null) | the ray shoulder → hand, where the hand is ahead of the shoulder by > 0.35 m toward the wall, intersected with the wall plane, then `Projection.screenToWorld` | eased; a reach must hold ≥ 300 ms before it is a reach |
| `gestures` (events) | §5 | each with its own debounce and cooldown |
| `kioskPresence` | any of the above | restarts the idle timer, skips a running attract |

The whole field is one small object updated at 30 Hz, allocation-free, and it is what the harness
and the simulator feed.

### 4.5 The presence simulator and the recordings

Non-negotiable, and the first thing to build after the bridge spike: a `presence-sim/` page that
emits the same JSON over the same socket (and over the bus, so no bridge process is needed at a
desk). It drives fake bodies with the mouse (drag to walk, a key to raise hands, scroll for distance),
and it **replays recordings** the bridge makes of real sessions. The recordings are the corpus the
gesture thresholds are tuned against and the harness runs (§12). Without this, every gesture change is
tested by standing up, and the build cannot run on a machine without the sensor.

---

## 5. Gestures: the vocabulary, and what each one does

Principles, in order: **ambient first** (presence and proximity do most of the work, and they cannot
be done wrong); **one explicit act** (reaching toward a place), which the sketches already have as the
habitat boost; **two or three whole-body gestures** with large, slow, unambiguous signatures; **feedback
inside 100 ms** on every input, so the room teaches itself; **cooldowns**, so a group cannot strobe
the wall; **arbitration**: effects sum with caps, and where two people point at once both places get
the effect.

| Gesture (notebook) | Detector | Effect | Feedback | Cooldown | Verdict |
|---|---|---|---|---|---|
| **Approach** | the `nearest` band and its ease | the zoom (§6), the clock rate (§3), the ambient mix (§8) | continuous: the view and the sound move with you | — | **core** |
| **Standing left / right** | `focusX` | where the camera centres in the near band; which habitat is "yours" | continuous | — | **core** (free) |
| **Point / reach** | the reach ray (§4.4) held 300 ms | **the habitat boost, at a place:** the plants in a radius of the cell liven (`warpAt`-style growth pulse + `seedSpeciesNear`), the linked birds come (`boostFauna` near the point), the boost outline rings them, a short timelapse step | the outline appears as the reach lands; the plants visibly perk | 3 s per body, 1 s global | **core** |
| **Hands up** | both hands above the head for 600 ms | **wind** (§9): a gust front crosses the frame from the prevailing quarter; exposed scrub and tussock scour | the gust layer answers at once; the trees lean | 8 s global | v1 |
| **Clap** | hands' separation falls below 0.1 m with closing speed above a threshold | a **flush**: the flighted birds near `focusX` take off and resettle | the birds lift | 4 s | v1 if the home-rig recordings show few false positives; else cut |
| **Jump** | both ankles above the calibrated floor by > 0.15 m, with the head rising | a **quake** (§9): the shake, a raised-beach step on the south coast, a nudge to the uplift factor | the shake | 20 s global | v1, if floor calibration holds; the notebook's "shaping the landscape" |
| **Crouch** | head below 60 % of standing height for 1 s | the quiet version of the quake, or nothing | — | — | later: one tectonic gesture is enough to learn |
| Hands out, hug/cross, slow arm raise, sit | — | — | — | — | **cut** for v1; sit only matters as presence (bean bags, §11) |
| "Ripple on an area" on the floor | needs a second projector on the floor | — | — | — | **cut** for v1 |

Every detector is a pure function of the presence field, so each one is unit-tested against the
recordings. The thresholds above are starting points; §12 says which of them can only be set in the
room.

---

## 6. The zoom: proximity → view, and the handoff between frames

### 6.1 What the visitor sees

```
 far  (≥ ~3 m, or nobody)   WIDE FRAME, land only, the geological story. The camera drifts.
   │  someone walks in       the camera eases toward the harbour: wide 1× → ~2×, over ~3 s
 mid (~1.5–3 m)             the HANDOFF: the close frame crossfades in at the matched scale (≥ 500 ms),
   │                         the living world is simply there at 1×
 near (< ~1.5 m)            CLOSE FRAME at 1 → ~1.6×, centred on focusX; the habitat under you is
                             "yours": reach livens it, the sound detail layer comes up
```

Hysteresis and dwell (§4.4) keep a visitor standing on a band edge from ping-ponging. Leaving reverses
the ladder, slower (people drift out; the wide frame need not snap back).

### 6.2 What has to be built

1. **A camera.** `Game._updateViewTransform()` sets `CONFIG.viewX / viewY / viewZoom` once, as a
   cover-fit. It becomes a per-frame function of a camera state (`{ cx, cy, zoom }` in world space)
   with the same cover-fit as its 1× case. The WebGL entity layer captures the live 2D transform, so
   the cast follows for free; the terrain layer is one blit in the same transform. The things that read
   the fit once must read it per frame: `viewInsetX/Y` (where spawns and the harrier's targets stay
   on-screen), the flyers' turn-back edges, the river-name keep-outs, the HUD's label placement.
2. **The terrain's resolution under magnification.** The ground is baked at the paint supersample and
   blitted nearest-neighbour when magnified (crisp by design, blocky past ~1.5×). Two answers, both
   cheap: cap the wide frame's zoom at ~2× (the handoff takes over) and the close frame's at ~1.6×; and
   let a frame **re-bake its paint at a higher supersample for the visible sub-rectangle** when the
   camera settles in the near band (the sliced morph job can do this on its budget). Measure before
   choosing.
3. **The handoff.** The close frame's footprint is a known rectangle in the wide frame's world. At the
   handoff zoom the two draw the same metres per pixel over that rectangle, so the crossfade is between
   two renders of the same land at the same scale and date. This is `Kiosk.renderCrossfade`'s idiom.
   The harness asserts the scale match and that the coast line agrees at the handoff dates (§2.4.3).
4. **LOD rules.** Names and captions: the wide frame's names of the time; the close frame's river and
   place names appear past the handoff. Sprites: the art is 2–4× the 1080 detail, consumed by
   `spriteSupersample` 2 at 4K; on a WUXGA/1080p projection (§11) the same art has 2× headroom, which
   is the close frame's zoom range. Plants: the close frame's `plantDensity` is tuned at 1×; at 1.6× a
   third of the world is on screen, so the cast's spawn and the flyers' targets follow the visible band.
5. **Cost.** Two frames are never both *alive*; the wide one is land only. During the handoff both are
   drawn for one crossfade. The per-frame budget is unchanged; the init cost roughly doubles and is
   hidden under the attract's dark as today.

### 6.3 Why not one continuous zoom from 200 km to 30 km

Because it is a 6× magnification of a 512² grid: a cell about 350 m across in the wide frame becomes
twenty-odd screen pixels in the close one, and the living world's density, sprite scale and spawn
rules are all authored for one scale. A single 1024² grid would be four times the cost of a number
the project already calls too expensive. Two frames at two authored scales, with a matched-scale
crossfade, is what map tiles do and it is what the budgets allow. The notebook's "focus area moves
with timeline" can still be had: the close frame's rectangle in the wide frame is a level knob and may
be dated.

---

## 7. The cast and the art pipeline

### 7.1 The cast

| Bird | From Te Manawa | Pōneke note |
|---|---|---|
| Giant moa *Dinornis* and Mantell's moa *Pachyornis* | founded, dedicated art | the two the notebook names ("that split as species crossing"); the little bush and stout-legged moa stay available |
| Eyles' harrier | founded, 1,257 lines of behaviour | unchanged |
| Kererū, kōkako, huia, tūī | founded, the flighted engine | unchanged; tūī and kōkako carry the song machinery the soundscape will key off |
| North Island brown kiwi | founded | unchanged; the forest-floor presence for the near band |
| Goose, mōho, Finsch's duck | founded, art exists | optional; they make the cold phase busier, which still holds here |
| **Kākā** | — | **new**, small: extends `Kokako` (song + territory) tuned as a strong, noisy canopy flier like the tūī; needs art and calls. 2–3 days of code |
| **Penguin** (little penguin / kororā, or the extinct Waitaha penguin for deep time) | — | **new**, small: a shoreline walker on coast cells with a sea-return loop; extends the moa guild's base for walking and avoidance, never browses. 2–3 days of code, plus the shore habitat |
| **Whale** (southern right whale in the strait; humpback on passage) | — | **new**, medium: a `Whale` on deep-sea cells, a slow surfacing loop (blow, back, fluke), one or two at a time, in the close frame near the coast. Its own class over `Boid` with a sea mask; the first entity that lives in the water. About a week |
| Seals | — | later, if the shore is lively enough to want them |

Species that were split by the seaway (the notebook's wētā, galaxiids, kōura, the kōkako and tīeke
mitogenomes in `NATURAL_HISTORY` §I.1, §I.8) are the *caption* of the wide frame, not entities.

### 7.2 The flora

The ten drawn species carry over. The Wellington table wants: the **beech quartet** for the Tararua
and Remutaka (the notebook's "far more beech: silver, red/hard, black": the Manawatū has a beech gap,
Wellington's ranges do not), **leatherwood** and herbfield for the tops, **coastal scrub** and the
raised-beach turf for the south coast, and the **Wairarapa wetland** set (the existing harakeke, tī
kōuka, kahikatea, pūrei) if the frame reaches that far. Three or four new sprites, drawn to the
read-from-above rule.

### 7.3 Photo-based art: the pipeline change

The outline's media plan is photo-based sprites from video for living species and stylised 3D image
sequences for the extinct ones, to save time. The engine is ready for it in one sense: `ART_SETS`
carries alternative sets per species and the atlas packs whatever loads. Three cautions:

1. **The view angle.** Everything on the wall is seen from above at the 3/4 pitch (`K` 0.76). Video
   of a bird in flight is side-on. A photo cutout that reads as pasted on will undo the cartoon more
   than a plainer drawn sprite does. Shoot or render **from above**, or accept side-on cutouts only
   for the *flighted* cast at cruise height (where Te Manawa's own art is already closest to side-on)
   and keep drawn art for the ground cast. Decide with one test species on the wall before cutting out
   twelve.
2. **The budget.** Five 2048² atlas pages, about 80 MB of VRAM. Photo frames want more pixels and more
   frames per state than the drawn art. Count before committing: a 12-species cast at 8–16 frames per
   state and 256–384 px frames fits; at 512 px it does not. The naming rule
   (`sprites/<group>/<subject>/<subject>_<state>_<nn>.png`) and the failure-callback rule apply.
3. **The outline.** The boost and pointed-at outline is a silhouette ring from the sprite's alpha.
   Photo cutouts with soft or noisy alpha ring badly; cut hard, then feather inside the ring.

---

## 8. The soundscape

The outline calls this the main thing that brings the fauna to life, and Te Manawa has nothing to
offer it: `AudioManager` is a game-era sfx manager that is off, unloaded, and keyed to events (win,
loss, tutorial tip) that do not exist. Replace it:

- **A Web Audio engine** (`Poneke_soundscape.js`): a few **beds** (the wide frame's wind and sea; the
  close frame's forest, wetland, coast) crossfaded by the zoom band and the climate stage; **event
  calls** per species on sim events the cast already emits (spawn, take-off, song territory, the
  harrier's stoop, the whale's blow), each with its own cooldown and a global polyphony cap; **panning**
  by screen x so a call comes from where the bird is; a **detail layer** that comes up in the near band
  (the forest floor, the kiwi, the understorey).
- **Proximity is the mixer.** The far band is a wide, quiet, windy space; the near band is close and
  particular. This is the audio half of the zoom and it is what the bean bags are for.
- **Surround through a browser** is a spike, not a plan: Chrome drives more than two channels only
  when the output device exposes them and `channelCount` is raised; it is flaky across devices. The
  fall-back that always works is stereo from the page into a hardware upmix. Decide in week two with
  the actual speakers.
- **Loading** follows the cold-boot lesson: nothing decodes in `preload()`; beds stream, calls decode
  lazily after the first frame, Opus or mp3 at modest bitrates.
- **The recordings**: Zealandia and Ōtari-Wilton's for most of it, kōkako song at Maungatautari in
  November. Each call needs a clean onset, a tail, and a note of what state it belongs to.
- **Loudness has a photosensitivity cousin.** No bed or call steps in; everything ramps ≥ 500 ms, and
  the room's rate changes (§3) never jump the mix.

---

## 9. Environment events: wind and tectonics

| Te Manawa | Pōneke | What exists | What is new |
|---|---|---|---|
| **Storm** (lightning strikes, windthrow, dune burial) | **Wind** | the W→E gust layer (`TM_WIND`), `disturb()` with kinds, the storm's windthrow | a gust *front* on a trigger, a `'wind'` disturb kind that scours exposed open habitats (the notebook: alpine leatherwood, herb and tussock, the lowland strips) and leaves the forest interior alone; the prevailing quarter is Wellington's |
| **Eruption** (ash cover, clearing, the aftermath cycle) | **Quake / uplift** | the eruption charge, flash and `eruptionShakeOffset`; the morph's `uplift` factor; the sea-level coast | a **quake pulse**: the shake, a step in a dated **raised-beach** term on the south coast (the Turakirae staircase: each great quake lifts the shore a few metres), a short-lived nudge to the uplift factor so the ranges visibly take a step; the ash machinery stays dormant (the Taupō ashes did reach Wellington, and an Ōruanui beat is cheap to keep as an option) |

Both are triggered by gestures (§5) and both also fire on their own clocks when the room is quiet, so
the wall never depends on a gesture to be alive. The Whātaitai beat, if it is told, is a dated quake
in the close frame's window: the technical shape is the same as any other step, and the decision is
§16's.

---

## 10. The attract: the land before the window, again

The empty room shows the wide frame on its own clock (§2.2): the Manawatū attract's idiom, extended
to the present so the glacial Cook Strait bridges play, with the dial-as-speed and the reversibility
it already has. Someone arriving does not *skip* it as in Te Manawa; they **zoom into it** (§6). Its
landing on the living world is a quake rather than an eruption, under which `resetEcosystem()` runs
exactly as today. The every-12th reseed happens under its dark.

---

## 11. The install: the room, the gear, the numbers

| Item | Spec to pin down | Why it matters |
|---|---|---|
| **Wall** | 4 m × 2 m → **2:1**, not 16:9 | `terrainFitMaxStretch` is 2.0, exactly at the limit; either author the frames at 2:1 (the fit then stretches nothing) or letterbox. Author at 2:1 |
| **Projector** | resolution (WUXGA 1920×1200, or 1080p), brightness, throw, mount | 1920 px over 4 m is about 2 mm a pixel, fine at the bean bags; the pixel budget is ~4× lighter than Te Manawa's 4K, which is what makes a laptop plausible; keep the WebGL entity layer anyway |
| **Kinect mount** | above the projector, 2–2.5 m high, tilted to see the floor from ~0.5 m to the back of the space; the v2's 70° field covers ~4.2 m wide at 3 m | people at the wall's edges and anyone very close are the first to be lost; the bean bags must sit inside the field; projector light is fine for a time-of-flight sensor, direct sun is not |
| **Laptop** | the GPU (integrated is probably enough at WUXGA with the GL layer; Azure/Orbbec body tracking needs more), USB 3 for a v2, Windows for the SDK | the single hardware question that decides the sensor (§4.1) |
| **Speakers** | how many channels the interface exposes to the browser | §8's spike |
| **Boot order** | server → bridge → browser (two windows, one profile, as today), a supervisor restarting each | `TEMANAWA_OPERATIONS.md` §2, with the bridge added |
| **The space** | bean bags inside the field; a clear lane to the wall for the near band; what happens when the festival crowd is ten deep | the presence model caps `count`'s effect; a wall of people is "many, mid" |

No network, as before. Calibration (§4.3) is an operator task and is redone after any bump.

---

## 12. Testing, iteration and what can only be tuned in the room

### 12.1 The harness (`tools/bootcheck.js`), extended

New sections, in the order they become possible:

| Section | Asserts |
|---|---|
| **presence** | fake bodies → the field: count persistence and decay, band hysteresis and dwell, `focusX` easing, reach ray → world cell; no allocation in the update |
| **gestures** | each detector against the **recorded clips**: true positives in the labelled clips, zero positives in the "people milling" clips; cooldowns hold |
| **geography, wide** and **geography, close** | the Wellington terms at the dated anchors: the block is an island at 2 Ma, the south bridge dry before ~1 Ma and sea after ~0.5 Ma, the strait's sill bare at −120 m and drowned at 0 m; a moving coast is a ceiling (no islets proud of a half-drowned shelf); crest heights rise with time |
| **frames agree** | at every handoff date the two frames' coast lines coincide over the close frame's rectangle; the metres per pixel match at the handoff zoom |
| **camera** | the cover-fit at zoom 1 is bit-identical to today's; `viewInset*` follow the camera; nothing spawns off-screen at 1.6× |
| **time by presence** | the detent follows the field with the ease and the rate-of-change cap; an empty room reaches the attract; the window's end lands on the wide frame |
| **soundscape** | with audio disabled nothing loads (the cold-boot rule); with it enabled no call exceeds the polyphony cap; every ramp ≥ 500 ms |
| **kiosk, bridge** | a stale heartbeat falls to the attract without a reload; a reconnect resumes; a reset never opens a socket |

The existing sections keep running on the fork: the two frames must not break the eruption, cold
cover, kiosk hardening, palaeo attract and soft-reset timing checks, which are the regression net
the terrain work needs most. The harness's terrain is still white noise (`MISTAKES.md`): stage the
landforms the new checks need.

### 12.2 The replay corpus

Record on the home rig from week two: solo approach and retreat; two people; a group of five; a seated
person; children; people milling with no intent; each gesture performed by three different people.
Label them. This corpus is what every threshold in §5 is tuned against before the room, and what
protects a threshold once it is set.

### 12.3 What can only be tuned in the room

These are the knobs with no desk answer, in the order the sessions should take them:

1. **Calibration** and the sensor's field against the actual bean-bag layout.
2. **The bands** (far / mid / near edges and hysteresis) against where people actually stand, which
   depends on the bean bags, the crowd and the projector's brightness.
3. **The zoom curve**: the handoff distance, the ease times, the near-band maximum zoom.
4. **The rate curve** (presence → detent): how fast the land should change with three people in the
   room. Watch the coast; it is the photosensitivity meter.
5. **Gesture thresholds** and cooldowns, with strangers, not the team.
6. **The reach radius and strength**: how much of the forest livens under one hand.
7. **The mix**: bed levels per band, call density, the surround question.
8. **The close frame's density** at 1× and 1.6× (plants, the flyer caps), which were tuned on a
   screen you cannot walk up to.
9. **The photosensitivity sign-off** on the real projector: the quake, the gust front, the handoff
   crossfade, the rate swings.
10. **A 24-hour soak** with the recordings replayed, for leaks and the watchdog.

Plan three room sessions at least: one early with the bridge and a placeholder land (bands, calibration,
the zoom feel), one mid-build with the real land and gestures, one commissioning.

---

## 13. Phases and the extent

Effort is **one developer, full time, code only**; art and audio are parallel tracks below. The
ranges are honest: the low end assumes the Kinect path and the research go cleanly, the high end that
each takes one more iteration than hoped, which is what the Manawatū build's record suggests.

| # | Phase | What is done | Depends on | Weeks | Room? |
|---|---|---|---|---|---|
| 0 | **Fork and strip** | the new repo (§17); page title, level ids and docs renamed; the console made optional; `Poneke_*` module slots; the harness green on the fork | — | 0.5 | |
| 1 | **Sensor spike and bridge** | the SDK talking; the bridge process, socket, heartbeat, recorder; the **presence simulator**; calibration v0 | the sensor model (§4.1) | 1–2 | the home rig |
| 2 | **Presence → time and kiosk** | `Poneke_presence.js`, the field; the detent driven by presence; the kiosk's bridge events; harness "presence", "time by presence" | 1 | 1 | |
| 3 | **The land, wide frame** | research pass (Trewick & Bland's southern maps, Lewis et al. 1994, the harbour's history, Turakirae); `poneke_wide.svg`; the Wellington term set; the names of the time; the sequence extended to the present | 0 | **4–6** | |
| 4 | **The land, close frame, and its living world** | `poneke_close.svg`; the shared dated table; the shelf and the harbour; the Wellington biomes and flora table; spawning retuned; the sea as a habitat | 3 | 2–3 | |
| 5 | **The camera and the handoff** | `Poneke_camera.js`; the per-frame view transform; the LOD rules; the matched-scale crossfade; the focus re-bake if needed; harness "camera", "frames agree" | 2, 4 | 2–3 | one early session |
| 6 | **Gestures** | `Poneke_gestures.js`: reach → the positional boost; hands-up wind; jump quake; clap flush; feedback, cooldowns, arbitration; harness "gestures" on the corpus | 2, 4 | 2–3 | **yes**, iterative |
| 7 | **The cast** | kākā, penguin, whale; the photo-derived `ART_SETS` for one test species, then the rest as art arrives; atlas budget check | 4 | 2–3 | |
| 8 | **The soundscape** | `Poneke_soundscape.js`; beds, calls, panning, the band mix; the surround spike; harness "soundscape" | 2, 5 | 1–2 | the speakers |
| 9 | **Kiosk and operations** | the supervisor with the bridge; the 2:1 frames; the operator guide and calibration procedure; deploy copy | 1–8 | 1 | |
| 10 | **Commissioning** | §12.3, in three sessions across the build, the last with the public | all | 1–2 | **yes** |
| | **Total** | | | **16–26 weeks** | |

**The critical path** is 3 → 4 → 5 (the land, then the camera over it): about 8–12 weeks before the
two-frame zoom can be felt in a room. Phases 1–2 and 6–8 run alongside it on the Te Manawa land, which
is the point of keeping the bus and the simulator: the gestures, the sound and the camera can all be
built and tested on the Manawatū frame while Wellington is being drawn.

**Parallel tracks, not in the weeks above:** the photo and 3D art (capture, cutting out, sequencing,
the extinct species' renders: weeks of someone's time, and the long pole for §7); the field recordings
(§8); the co-design conversations (§16); the hardware purchase and the room booking.

**Calendar.** CubaDupa usually runs in late March. From this document's date that is about twenty
weeks, with the summer break inside it. The full tier is possible in that window only if the sensor
spike succeeds in the first fortnight and the land takes the low end of its range; §14 is what to do
if either slips.

---

## 14. Scope tiers (the proposal's reductions, costed)

| Tier | What it is | Drops | Code weeks | What the visitor loses |
|---|---|---|---|---|
| **A — the brief** | two frames, proximity zoom, Kinect presence and gestures, the new cast, the soundscape | — | 16–26 | — |
| **B — one frame, Kinect** | the **close frame only** (the harbour, the living world), with presence driving time and the zoom reduced to the near-band 1 → 1.6× over that frame; or the **wide frame only** (the geological story) with presence driving the sequence's speed and reach lighting up the land bridges | phase 5's handoff, one of the two land models (3 or 4) | 10–16 | the "zoom out to see how the land came together" moment, or the living forest |
| **C — Te Manawa re-skinned** | Te Manawa as it stands on a touchscreen console, with the Wellington close frame as its land and the Wellington flora on its cards; no sensor | phases 1, 2, 5, 6, 8 | 6–10 | everything the room does; it is a different piece, and a finished one |
| **C′ — C plus a Kinect** | C with presence replacing the idle timer and driving the dial, no gestures | 1, 5, 6, 8 (keep the bridge) | 8–12 | the gestures and the zoom; keeps "the room is the controller" in its simplest form |

The proposal's other reductions sit inside these: a smaller screen only changes §11; fewer species
changes §7's weeks and the art track, not the architecture. **If a tier must be chosen before the
sensor spike, choose B with the close frame**: it keeps the living forest and the presence model, and
A is an addition to it rather than a rewrite.

---

## 15. Risks, ranked

1. **The sensor path.** A native Node module against a discontinued SDK on a particular laptop is the
   kind of thing that costs a week or nothing. Spike it first; the webcam fall-back (§4.1) exists so
   the project cannot be stopped by it.
2. **The land's research and iteration.** The Manawatū terms took six weeks and eight incident entries.
   The Wellington set has the rules in hand but new geography, two frames and a shared dated table.
   This is where the range in §13 lives.
3. **The zoom's feel.** Camera eases, band edges and the handoff are a feel, not a spec; they will be
   wrong at a desk. Budget the early room session and expect to revisit after the public session.
4. **Gestures in a festival crowd.** Occlusion, ten bodies, children, bean bags. The ambient-first
   principle is the mitigation: the piece is complete with no gesture ever recognised.
5. **Photo art at the 3/4 angle** (§7.3). Test one species on the wall before cutting out twelve.
6. **Audio in the browser**: multichannel output and autoplay policy. Both are spikes in week two.
7. **Performance with two grids** and a large sea area. Drop the wide frame to 256² from the start and
   measure the shimmer.
8. **Co-design timing.** The Whātaitai and Ngake story and the names are not the developer's to
   decide, and conversations have their own calendar. Build so that everything cultural is data
   (captions, names, dated events) and the piece is complete without it.

---

## 16. Open decisions

1. **The sensor model** (§4.1), and with it the laptop.
2. **The projector**: resolution and whether the wall is truly 2:1.
3. **The close frame's window and extent**: 500 ka → 1 ka proposed; whether the Wairarapa side is in
   it; whether it runs into the human era.
4. **Which stories are told and in whose words**: Whātaitai and Ngake, the Haowhenua uplift, the names
   of places and of the time. Taranaki Whānui ki te Upoko o te Ika and Ngāti Toa Rangatira, per the
   notebook. Everything here is draft until then, as it is in Te Manawa (`PLAN_V3` §16.10).
5. **The harbour's deep-time state** (lake, floodplain, sea, and when) **[verify]** before it is drawn.
6. **Cook Strait at the LGM**: closed (NIWA) or a narrow strait; the sill depth to author.
7. **Photo-based or drawn** for the ground cast (§7.3), decided by one test on the wall.
8. **Marine life scope**: penguins and whales for v1; seals later.
9. **Surround or stereo** (§8).
10. **The console**: ship a hidden operator page (the Te Manawa console still works over the bus) or
    nothing but the debug overlay.
11. **The title**: *Avian Age: Ancient Pōneke* is the outline's; the file set says CubaDupa.
12. **`mapGrid`**: 256 for the wide frame from day one; the close frame's drop with its density retune.

---

## 17. Setting up the repository

The fork could not be created from the cloud session (the GitHub App may not fork repositories). Two
ways, either takes a minute:

**On GitHub:** open `robin-haxx/Te_Manawa_Prototype` → *Fork* → owner `robin-haxx`, repository name
`Ancient_Poneke` (GitHub allows forking your own repository under a new name) → *Create fork*. The
fork keeps the full history (586 MB, mostly sprite churn and the export sets).

**Or a fresh repository from a snapshot**, if the history is not wanted on the new project (the deploy
copy is ~95 MB; `PLAN_V3` §14.4):

```bash
gh repo create robin-haxx/Ancient_Poneke --public --description "Avian Age: Ancient Pōneke — a Kinect-driven fork of Te Manawa for the Wellington region"
```

```bash
git clone --depth 1 https://github.com/robin-haxx/Te_Manawa_Prototype.git Ancient_Poneke && cd Ancient_Poneke && rm -rf .git && git init -b main && git add -A && git commit -m "Ancient Pōneke: forked from Te Manawa at bf8c3bf" && git remote add origin https://github.com/robin-haxx/Ancient_Poneke.git && git push -u origin main
```

Then, in the new repository, phase 0: this document moves to `md/PONEKE_PLAN_V1.md` as the design
spine beside the Te Manawa documents (which stay, as the record of the engine), `CLAUDE.md` gets a
Pōneke header, `index.html`'s title and `levels/` get their names, `exports/` and the unused assets go,
and `node tools/bootcheck.js` must be green before the first new line of code.
