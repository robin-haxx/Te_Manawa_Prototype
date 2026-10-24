# Te Manawa — the second screen and the interaction overhaul

**Status:** spec **and built implementation** — the touchscreen (`secondscreen/`), the
`BroadcastChannel` bus (`TeManawa_bus.js`) and the sim overhaul (§7: paused clock, per-species
boost, ramped timelapse, regime-boundary goal) are all built and harness-green. What remains is a
data-tunable feel pass and the encyclopedia content (§8–§9). Authored 2026-09-20, updated 2026-09-21.
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

   WETLAND  ┐                                              ( ERUPTION )
   FOREST   │  up          [ STORM ]                        skip ahead
  ─CENTER─  ┤ (Select)     ┌───────────────────────┐
   ALPINE   │  down        │  species card /        │      ( BOOST >> )
   LOWLAND  ┘              │  encyclopedia entry    │       timelapse to the
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

| Switch position | Habitat | Era | Reads as |
|---|---|---|---|
| up ×2 | **Wetland** | interglacial | the Moutoa zonation: pūrei in open water, harakeke, tī kōuka, kahikatea, tōtara on the levée |
| up ×1 | **Forest** | interglacial | podocarp–broadleaf forest: tōtara, tawa, tree ferns, nīkau, kōwhai |
| centre | *(Select a Habitat)* | — | neutral / attract |
| down ×1 | **Alpine** | glacial | the plants of the Ruahine and Tararua ranges, the treeless glacial tops: mountain beech in shelter, Dracophyllum, snow tussock, scrub, wharariki |
| down ×2 | **Lowland** | glacial | the glacial flats: tussock, grey scrub, mānuka, kōwhai, tī kōuka |

**Up is warm, down is cold.** The two interglacial habitats sit above the centre rest and the two
glacial habitats below it, with Forest and Alpine one detent from the centre (reordered
2026-10-13 from Forest/Wetland/·/Lowland/Alpine). Each habitat's `era` lives in
`secondscreen/encyclopedia.js`, and `tools/bootcheck.js` ("encyclopedia roster") asserts that every
plant on a screen passes the boost gate in that screen's era. Rosters and the evidence behind them:
`TEMANAWA_ENCYCLOPEDIA_FLORA.md`.

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
| `boost` | `plantKey`, `habitat`, `fauna` (the card's sim bird keys), `plantName` (the card's name) | **the main event** — regime-fit gate → plant-goal verdict (§6.5) → per-species seed → begin timelapse to the next boundary (§6) |
| `storm` | — | `InstallHUD.press(game,'storm')` — works today, unchanged |
| `eruption` | `phase` (`down`/`up`) | eruption skip; maps to `InstallHUD.erDown/erUp` (tap = revert, hold = skip) |
| `deep` | — | legacy plain deep-time press (kept for parity; the boost replaces it on the wall) |

### 3.2 Sim → touchscreen (telemetry)

| `type` | fields | drives |
|---|---|---|
| `clock` | `yearsBP`, `glacialIndex`, `stage`, `stageName`, `mis` | the KYA date + glacial/interglacial label (sent ~4/s) |
| `goal` | `targetYearsBP`, `targetStage`, `targetStageName`, `prompt` | the goal readout: the live plant goal's line (`prompt`, §6.5), else the next glacial/interglacial |
| `timelapse` | `active`, `progress` (0..1), `yrPerSec`, `achieved` (bool/null) | the timelapse progress bar + goal-met indicator |
| `boostResult` | `plantKey`, `matched` (bool), `goal` (`answer`/`matched`/`wrong`/`answerWrongClimate`/null), `text` | the immediate regime-fit verdict (right species for the climate?) and the plant-goal verdict line the diorama shows (§6.5) |
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

Reviewed against Esler (1978) and the deep-time pollen record in
`TEMANAWA_ENCYCLOPEDIA_FLORA.md` (2026-10-13), which replaced the first reading of the mockup
sprite clusters. The four mockup-card species are kept (red beech renamed black beech). All live
data-driven in `secondscreen/encyclopedia.js`.

| Habitat (era) | Plants | Card-confirmed |
|---|---|---|
| **Wetland** (interglacial) | Kahikatea, **Tī kōuka**, Harakeke, Tōtara (levée), Pūrei (*Carex secta*) | Tī kōuka → kererū |
| **Forest** (interglacial) | **Tōtara**, Nīkau, Tawa, Mamaku & ponga, Kōwhai | Tōtara → Eyles' harrier |
| **Alpine** (glacial) | **Mountain beech**, Wharariki, Snow tussock, Dracophyllum, Subalpine scrub | Mountain beech → huia |
| **Lowland** (glacial) | **Mānuka**, Grey scrub, Tussock, Kōwhai, Tī kōuka | Mānuka → kōkako |

Plant keys map to `PLANT_TYPES` in `TeManawa_plant_defs.js` (`Totara`, `cabbagetree`,
`manuka`, `beech`, `nikau`, `tawa`, `fern`, `tussock`, `flax`, `kahikatea`, `dracophyllum`,
`coprosma`, `kowhai`, and the art-sharing `sedge` and `wharariki`), so a boost names a type the
sim already knows. Every plant passes the boost gate in its screen's era: kōwhai and tī kōuka,
which sit on one warm and one cold screen, are neutral (coldTolerance 0.7); black beech is cold.

---

## 5. Station 2 — the species card and the fauna link

Highlighting a plant (plant-select control, or touch) fills the card:

- its **common name** (serif) and **scientific name** (orange italic), top left;
- a small **scene**, top right: the plant (its big sprite is already highlighted in the cluster)
  with the **fauna it supports** placed on it — flyers in the canopy, the moa guild at its foot
  (`TM_FAUNA[…].pose`). The plant's box is cropped to its visible pixels so the birds sit on it,
  and its height follows the cluster's, so a tree still stands taller than a tussock;
- the **write-up**, full width and touch-scrollable (a fade at the bottom while there is more):
  the plant's paragraphs (`desc`), then *"Boosting <plant> helps: <bird>"* and the bird's
  paragraphs (`birdDesc`). The copy is the fact-checked entries in `TEMANAWA_GOALS.md` §3.
  The card is 845 px wide (widened leftward from 690).
- The fauna is the teaching link: *boosting this plant helps these animals*. The card's list travels with the
  boost (`m.fauna`, the sim species keys), so the sim recruits and outlines exactly the birds the
  visitor sees; `TM_BOOST.faunaLinks` in `TeManawa_bus.js` is the fallback when no list is sent.

**Plant ↔ fauna links: the bird policy** (2026-10-13, revised 2026-10-15; map and evidence in
`TEMANAWA_ENCYCLOPEDIA_FLORA.md` §2.6). One bird per plant; each of the 13 birds the sim founds is on
one or two plants, so none hogs the cards: Tōtara → Eyles' harrier, tawa → kererū, nīkau → kōkako, kōwhai and wharariki → tūī, tree fern → kiwi,
kahikatea → little bush moa, harakeke → Mantell's moa, tī kōuka → Finsch's duck, pūrei → mōho,
tussock → North Island goose, grey/subalpine scrub and Dracophyllum → North Island giant moa, mānuka → stout-legged
moa, mountain beech → huia. The cast is North Island only:
`north_island_giant_moa`, `little_bush_moa`, `mantells_moa`, `stout_legged_moa` (the four on the
three moa sprites), `giant_goose`, `north_island_takahe`, `north_island_brown_kiwi`,
`finschs_duck`, `kereru`, `kokako`, `huia`, `tui`, `eyles_harrier`. The South Island upland and
heavy-footed moa remain defined in `MOA_SPECIES` but are not founded.

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

**Boost outline (built).** On a boost the chosen plant *and* its linked birds (the §5 map, in
`TM_BOOST.faunaLinks`; a boost message may also carry `m.fauna`) are ringed with a coloured
**silhouette outline** for `TM_BOOST.outlineMs` (≈ the timelapse). It is climate-keyed for a
**successful** boost — **interglacial → green, glacial → blue** (`TM_BOOST.outlineInterglacial` /
`outlineGlacial`, matching the ambient band + FOREST/TUSSOCK buttons, so blue = glacial everywhere) —
and **grey** when the species is wrong for the current climate (`outlineWrong`). Ported from Mauri's field-guide outline: in the default WebGL
renderer it is a ring of pure-colour silhouette quads stamped UNDER each sprite into the *same*
entity batch (`GLBatch._silhouette` + a `sil` vertex channel), so it adds **no draw call and no
extra pass** — only a handful of quads for the few boosted entities. `EntitySprites.boostOutline`
gates it per entity (keyed on `game._boostHi`); `?render=2d` simply shows no ring (no silhouette
shader on that path).

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

### 6.5 Plant goals (built)

The line above the diorama's timeline is a **question one plant answers**, e.g. *"Boost a plant that
was rarer in ancient times than today"* → harakeke (Esler: it spread after drainage and stopbanking).
Each boost is judged against the live goal, and the line becomes a **verdict** until the boost's
time-lapse is over:

| Boost | Line | What else happens |
|---|---|---|
| The answer, right climate | *"Harakeke was an interglacial plant, and was rarer in ancient times than today!"*, in the climate boost colour (green/blue) | A **bigger** boost (`answerSeed` 24 seedlings, `answerFauna` 4 birds), and a **solid white** outline on the plant + its bird that eases to green/blue over 6 s. When the verdict fades, the **next goal** in the book comes up. |
| Another plant, right climate | *"Tōtara was in interglacial habitats, but is not rarer in ancient times than today..."*, in the goal colour | The normal matched boost: outline, rim pulse, time-lapse trails. Same goal after. |
| Wrong climate | *"Tawa was not glacial, and was not rarer in ancient times than today"*, **grey** | The normal wrong boost: nothing grows, grey pulse, the scene desaturates. Same goal after. |
| The answer, wrong climate | *"… was rarer in …, but was not glacial..."*, grey | As a wrong boost. Only possible when a goal has both a warm and a cold answer. |

The verdict holds at least `holdMs` (7 s) and until the time-lapse ends, then crossfades back
(`InstallHUD.GOAL_FADE_MS`, 800 ms). Long lines wrap, balanced, and stack upward from the anchor.

**Where it lives.** `TeManawa_goals.js`: `TM_GOALS` (the goal book, the verdict templates, colours,
the answer's bigger boost) and `TMGoals` (which goal is live, `judge()`, release). The bus calls
`TMGoals.judge` in `onBoost` *before* seeding; the HUD only crossfades whatever `TMGoals.text()`
says. Soft reset (`Game.resetEcosystem`) starts the book again for the next visitor.

**The book.** Seventeen live goals and seventeen suggested drafts, grouped by the bird their main answer feeds and
drawn at random among the live ones along a moa → harrier → lowland animals → forest birds sequence.
Every goal, when it appears in the timeline, the fact-check behind it and the sim gaps it exposes:
**`TEMANAWA_GOALS.md`**. Under the year, *"The climate is INTERGLACIAL / GLACIAL"* names the climate
in the same green / blue as the verdicts. Under that, *"Successful boosts: N"* counts the boosts that
were right for the climate (second screen, or the FOREST / TUSSOCK keys) since the timeline last
restarted: `DeepTime.boostsOk`, zeroed by `DeepTime.reset()` on every soft reset and full restart.

**Adding a goal.** Append `{ id, prompt, cond, answer: [plantKeys] }` to `TM_GOALS.list`. `cond` is
worded to slot into the verdict templates; a goal can also word any verdict line itself with
`text: { answer: '…' }` (or `matched` / `wrong` / `answerWrongClimate`), and lines it leaves out use
`TM_GOALS.text`. Every answer must be on a touchscreen card (the harness checks). **Staging** is mostly automatic: a goal is live only while one of its answers *fits the
current climate* (a warm answer only in an interglacial) and *has habitat on the land*
(`Simulation.hasHabitat`, at least `minHabitatCells`). So a Dracophyllum goal stays dark until the
ranges have risen and carry subalpine tops, with nothing authored. For an explicit window add
`fromYearsBP` (opens once the clock is at or younger than it) or `untilYearsBP`, and a goal can
`require` grown plants, birds alive or an eruption this session. `off: true` keeps a draft undelivered. When no goal is live,
the line falls back to the regime objective (`InstallHUD.GOAL_OBJECTIVE`).

Bootcheck **"plant goals"** covers the book's shape, all four verdicts, the bigger boost, the white
outline, release timing, solving vs missing, staging (habitat, climate, window) and the soft reset.

---

## 7. The sim overhaul — built

Everything below is **built and harness-green** (`bootcheck.js`: `seedSpecies` · `bus boost` ·
`fauna trail`; the clock now reads a paused `1000000 BP` after 120 frames). What remains is a
data-tunable feel pass (§9), not new machinery. Where each piece lives:

| Piece | Where | What it does |
|---|---|---|
| **Regime-boundary finder** | `Climate.nextRegimeBoundary(yearsBP, endYearsBP)` (pure) | Scans younger, bisects the interglacial/glacial crossing to ~1 yr. The goal readout **and** the timelapse target both read it, so they can't disagree. `Climate.regimeThreshold` (0.5) is the cut. |
| **Paused clock + ramp** | `TeManawa_time.js` — `beginTimelapse` / `_tlRate` / `update` | Geology holds `yearsBP` by default; a timelapse eases 500→5000 yr/s over 20 s to a target. `update()` returns a **life scale** (never 0), so the cast lives on at 1× when paused and keeps pace during a timelapse (§9.7). The morph rides the existing throttled driver as the year drifts (same path a legacy deep burst uses). |
| **Per-species seed** | `Simulation.seedSpecies(plantKey, n)` | Seeds the *named* type only where its own biome palette supports it, land-only, density-gated. |
| **Fauna coupling** | `Simulation.boostFauna(keys, n)` | A matched boost also recruits a few of the birds the plant supports (§5 links), founded on-screen. |
| **The boost** | `TeManawa_bus.js` `onBoost` + `TM_BOOST` | Regime-fit gate → `boostResult` → seed (matched only) → fauna recruit → the existing regime-fit desaturation lesson → a climate-keyed coloured outline on the plant + its birds (`_boostHi` → `EntitySprites.boostOutline`, drawn by moa/eagle/kererū/plant) → ramped timelapse. |
| **Eruption-aware ending** | `TeManawa_bus.js` `beginBoostTimelapse` | If an unfired eruption falls before the boundary, the timelapse stops ~300 yr short (`eruptionLeadYears`) and the eruption fires ~2 s after the result settles (`_pendingEruption` → `Game._fireEruptionInPlace`, §6.3). |
| **Plant goals** | `TeManawa_goals.js` — `TM_GOALS` + `TMGoals` | The visitor line is a question one plant answers; each boost is judged (`TMGoals.judge`, from `onBoost`) into a verdict line, and the answer gets a bigger boost + a white-to-climate outline. Goals stage themselves by climate fit + habitat (§6.5). |
| **Telemetry** | `TeManawa_bus.js` heartbeat (250 ms `setInterval`) | Pushes `clock` + `goal` ~4/s, `timelapse` while one runs, and the `achieved` verdict the moment it ends — off the bus, never the 60 fps draw path. |

All boost/timelapse numbers are console-tunable: `TM_BOOST` (bus) and `DeepTime.tl*` (time).

---

## 8. Encyclopedia content status

The mockups' body copy was **Lorem ipsum**. As of 2026-10-13 every card in
`secondscreen/encyclopedia.js` carries **researched draft copy** (~25–35 words, sized to the card's
text column) and fauna links, from **`TEMANAWA_ENCYCLOPEDIA_FLORA.md`** §4, which also holds the
evidence behind each line. It is draft: names, narration and which stories are told remain for
co-design with mana whenua (`TEMANAWA_RESEARCH.md`, cultural grounding). Edit the data file freely;
nothing in the page logic changes, and the harness ("encyclopedia roster") rejects Lorem/TODO copy,
unknown keys, missing sprites and a plant that fails its screen's era. **Fuller three-part card drafts**
(fun facts · role · boost effect) are in `TEMANAWA_ENCYCLOPEDIA_CARDS.md`, which needs a longer card
or a layout change before it can go on screen.

---

## 9. Open decisions / assumptions to confirm

1. ✅ **The 5 plants per habitat** (§4.1) — RESOLVED 2026-10-13: rosters reviewed against the
   research (`TEMANAWA_ENCYCLOPEDIA_FLORA.md`) and the switch reordered so up = warm, down = cold.
   On-screen positions (`cx`/`cy`/`h`) are still the original mockup reading; tune by eye.
2. ✅ **Boost seeding strength** — RESOLVED: a matched boost seeds `TM_BOOST.matchedSeed` (12) of
   the chosen species; a mismatched boost seeds **nothing** (`mismatchedSeed: 0`) and the scene
   desaturates (the existing regime-fit lesson), consistent with today's wrong FOREST/TUSSOCK press.
   Neutral pioneers (mānuka/flax) count as matched in either climate. All in `TeManawa_bus.js`'s
   `TM_BOOST`, console-tunable.
3. ✅ **Fauna coupling** — RESOLVED: a matched boost recruits `TM_BOOST.faunaRecruit` (2) of each
   linked bird via `Simulation.boostFauna`, founded on-screen through the founder paths; a
   mismatched boost recruits none. Links in `TM_BOOST.faunaLinks` (a boost message may override with
   `m.fauna`). Open only as a *tuning* question: how many, and whether to top up vs hard-found.
4. **Switch hardware** — momentary up/down vs absolute 5-position (§1.1); set in `input.js`.
5. ✅ **The readout placement** — RESOLVED (partly): the **goal is now shown on the SIM/diorama
   screen**, floated **above the bottom timeline** in the same format as the year (FreckleFace, dark
   halo + light fill, centred) — the objective for the regime the run is heading toward: *"Reach the
   next Interglacial!"* / *"Reach the next Glacial!"* (`InstallHUD.renderVisitorGoal`, text in
   `GOAL_OBJECTIVE`). It reads `Climate.nextRegimeBoundary` and flips with the regime. The second
   screen still gets its own `goal` telemetry. (The KYA/glacial-index debug strip stays debug-only.)
6. **Ramp numbers** — IMPLEMENTED at 500→5000 yr/s over 20 s (`DeepTime.tlStartRate`/`tlMaxRate`/
   `tlRampSeconds`); final feel is a tuning pass against the photosensitivity budget.
7. ✅ **Pause semantics** — RESOLVED (user): only *time progression and the terrain morph* are
   static when paused; the ambient world (animals, seasons, plant growth/browse) keeps running at
   1× and speeds up during a timelapse. So `DeepTime.update()` returns a **life scale** (1× paused,
   `rate/yrPerSec` while a timelapse/deep burst runs) and moves `yearsBP` separately — the two clocks
   are decoupled. No standalone auto-play flag was added; the diorama holds at its date until a boost,
   a deep burst (button 1), or an eruption seek moves it.

---

## 10. Build order

1. ✅ This spec + the plan/doc updates.
2. ✅ The touchscreen page (`secondscreen/`) — renders from data, sends intents, shows
   telemetry; static-sprite highlights (WebM loops drop in later).
3. ✅ The bus receiver (`TeManawa_bus.js`) — storm/eruption/deep live; habitat/plant/boost
   stubbed.
4. ✅ **The sim overhaul (§7)** — `Climate.nextRegimeBoundary` (§7.1), the paused clock +
   `DeepTime.beginTimelapse` ramp (§7.2), `Simulation.seedSpecies` (§7.3), the real boost in
   `TeManawa_bus.js` (regime-fit gate → per-species seed → ramped timelapse → eruption-aware
   ending, §7.4), and live telemetry off the bus heartbeat (§7.5). Bootcheck extended and green;
   verified end-to-end in the browser (boost → `boostResult`, timelapse to the computed boundary,
   12 seeded, `hello` → `clock`/`goal`). What remains is the **tuning pass** — ramp feel, seeding
   strength, and the fauna coupling (§9.3), all data-tunable now.
