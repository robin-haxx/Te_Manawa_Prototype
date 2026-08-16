# Te Manawa — what it teaches, and the road to a finished installation

**What a visitor actually learns about the natural history of the Manawatū from the
running build, and what is left to build to turn the prototype into an installed exhibit.**

This is a descriptive and forward-looking document, not a new authority. Where it meets a
design decision it reads *under* `TEMANAWA_PLAN_V3.md` (the spine); where it describes the
build it defers to the code. Its job is to hold, in one place, the answer to two questions
a curator will ask: *what does the wall teach today,* and *what is between here and opening
night.*

---

## 1. The teaching contract

The installation teaches under hard constraints, and they decide everything below:

- **Unattended.** No operator, no network, no attract screen, no "touch to begin." A
  visitor walks up to a living diorama already mid-simulation (`TeManawa_kiosk.js`).
- **Forty seconds, from a distance, at a glance.** The governing principle
  (`TEMANAWA_PLAN_V3.md` §0.1): *a cartoon seen from above, not a survey of the Manawatū.*
  Every fact must survive being read from across a gallery in under a minute.
- **No reading required.** This is a design rule the code states out loud. Three layers
  that "used to be visible to visitors are now debug-only, because each was instrumentation
  wearing the costume of interpretation" (`TeManawa_debug.js`): the climate graph, the
  engine notifications (*"A moa has hatched!"* — "an ambient diorama does not narrate
  itself"), and the entity UI (hunger bars, hearts, glyphs — "the strongest 'this is a
  video game' signal on screen"). The climate "is meant to be read off the land and the
  cast — tree ferns vanishing, tussock spreading, the moa changing — not off a graph"
  (`TeManawa_hud.js`).

**The consequence is a deliberately tiny explicit surface.** The *entire* visitor-facing
text in the running build is:

- the rolling year — `~ 1,000,000 years ago`, rounded (`TeManawa_time.js`);
- four eruption names on the timeline — **Kidnappers · Kaukatea · Whakamaru · Oruanui**;
- five button labels + their `1`–`5` key hints — **50,000 YEARS · FOREST · TUSSOCK · STORM
  · ERUPTION**;
- a `>> x10.0` readout, shown only while fast-forwarding.

Everything else is taught **implicitly** — a change in the land or the cast the visitor
infers — or is **authored but hidden** (see §4). The one sentence the whole piece exists to
land is the geological takeaway: **the river is older than the mountains.**

---

## 2. What the installation teaches today

A fact reaches the visitor **explicitly** (a label or number they read) or **implicitly**
(a visual change they infer). "Status" is how completely the mechanism is built *now* — the
prototype runs well ahead of the phase ledger in `TEMANAWA_PLAN_V3.md` §8 in some places and
behind its intent in others (§3, §4).

| Natural-history fact | How it reaches the visitor | Mode | Status |
|---|---|---|---|
| We are looking across ~1 Ma of deep time | Rolling `~ N years ago`; playhead on the timeline | Explicit | **Live** |
| The Manawatū sat inside the active volcanic zone | Four dated eruption markers bookend the run | Explicit | **Live** (names are co-design placeholders) |
| The axial ranges *rose* — they weren't always there | Uplift wedge grows monotonically; the land lifts toward alpine across the run | Both | **Live** |
| **The river is older than the mountains** | The gorge incises *ahead* of the uplift — the river holds its line while the ranges rise around it (antecedence) | Implicit | **Live** |
| The basin was once sea | At ~1 Ma the south is a marine strait/embayment; the river assembles coast-inland and is through-flowing by ~0.5 Ma; the Tararua footprint emerges as a N–S land bridge | Implicit | **Live** |
| Sea level moved with the ice | Coastline walks in and out with `glacialIndex`; drowned cells cull their plants | Implicit | **Live** (coast/dune detail stubbed) |
| The climate swung cold and warm, repeatedly | Frost haze deepens; snow line drops; forest contracts *downslope* then climbs back; plants wilt/go dormant; the ambient audio bed shifts at each phase | Implicit | **Live** |
| Cold is a *different* world, not an empty one | The cast and cover are meant to change over — "cold is busier, not emptier" (`PLAN_V3` §5) | Implicit | **Partial** — see §4 |
| An apex predator hunted the moa | A raptor patrols, dives, and catches moa; storms break off the hunt | Implicit | **Live** (identity unresolved — §4) |
| Eruptions reset the forest, then it returns | Ash greys the ground and kills canopy hardest; the land greens back over sim-years | Implicit | **Live** (wetland "bloom" deferred) |
| Your management helps or harms the land | Wrong growth button for the climate quietly desaturates the scene toward a tired floor | Implicit | **Live** (placeholder health target) |

### 2.1 Deep time is a clock you watch run

The timeline is deliberately sparse: the year, a monotonic amber **uplift wedge** ("uplift
is the takeaway, and it is monotonic, so it needs no reading"), the four eruption markers,
and a playhead. `yearsBP` is the authoritative clock — geology and climate are keyed to it,
not to frame count — so the run reads correctly at any speed. The window is **1 Ma →
25.5 ka**; left alone it cycles about every **10.6 minutes**. **Button ① (50,000 YEARS)**
eases into a 10× fast-forward so a visitor can *drive* the deep-time change instead of
waiting for it — one press covers ~46–50 ky.

### 2.2 The land has a history

This is the strongest teaching in the build, and it is entirely implicit. The geography is
not invented: `geo/manawatu.geo.js` is an author-time trace of the real Manawatū (one main
river, three tributaries, the Tararua and Ruahine ranges). On top of it, `geoTimeFactors()`
reshapes the land continuously as the clock runs — **uplift** (ranges rising ~1 Ma), **incision**
running slightly *ahead* of uplift (the antecedent river — the takeaway falls out of the art
for free), and **emergence** (marine embayment → through-flowing river). See
`TEMANAWA_GEOGRAPHY.md`.

### 2.3 Cold is a place, not an ending

`SeasonManager` keeps its old name but no longer models seasons — it models the **glacial
cycle**, four phases on the interglacial→full-glacial gradient, driven by the LR04-anchored
`Climate.at(yearsBP)`. The single most legible climate signal is **forest contraction**: the
canopy band shrinks from roughly 0.12–0.80 of the slope in the interglacial to 0.18–0.34 at
full glacial, so the forest visibly retreats downhill as the cold deepens and climbs back as
it eases. Frost haze, snow line, plant dormancy and the audio phase-shift all move with it.
Crucially, the **numbers** behind this (stage, MIS, glacial index, sea level) are *debug-only*
by design — the visitor reads cold off the land, never off a gauge.

### 2.4 The scene is alive

Predator and prey, breeding and death, growth and disturbance all run continuously with no
meters on screen: the raptor hunts and catches moa, moa graze and flee and lay eggs, plants
grow / thrive / wilt by combined climate-and-terrain response, and an eruption kills a
tier-based fraction of plants (canopy hardest, scaled to the real event's magnitude) before
the ground greens back. The visitor sees raw behaviour, not a game HUD.

### 2.5 Your choices have consequences

The wall has grown to **five buttons** (the plan and several docs still say four). The pair
that teaches most is the **FOREST / TUSSOCK** split: the *right* one for the current climate
matures the cover that belongs there, and the *wrong* one drains **habitat health**, which is
surfaced as a slow, photosensitivity-safe **desaturation** of the ground toward a tired floor
(never full grey — "museum-ambient, not alarming"). **ERUPTION** is a press-and-hold
time-navigation control between the volcanic events: a tap replays the previous eruption, a
hold skips to the next. The lesson is legible without text — *I helped / I harmed this place*
read off the colour of the scene.

### 2.6 The idle wall

With no one present the diorama simply keeps living. After 180 s it soft-resets to the last
eruption checkpoint and replays it (every 12th reset reseeds the whole land at 1 Ma so it
varies across a day); reaching Ōruanui is a cue to loop, not a pause. There is no title card
by design — the first thing a visitor perceives is a world already in motion.

---

## 3. Where the build stands versus the plan

The prototype runs ahead of the original phase ledger in some places and behind in others
(`PLAN_V3.md` §13 is the honest status). Two later tracks have landed work the ledger still
listed as pending:

- **`TEMANAWA_DEEPTIME_ECOLOGY_PLAN.md` §4 reports steps 1–7 built and harness-green:** the
  season→glacial rebind, the climate table extended to 1 Ma, forest contraction, emergence
  sea level, the four-eruption data/seek/markers, and eruption clear/regen. That is a large
  slice of the nominal Phase 4/6.
- **`TEMANAWA_INTERACTION_HEALTH_PLAN.md` step 1 is built** (habitat health + saturation
  readout) and its five-button split is wired in `TeManawa_hud.js`.

So the true frontier is narrower and more specific than "Phases 4–8": it is **the fauna cast,
the flora art, the disturbance clocks, and the back half of the interaction loop.** §5 orders
them.

---

## 4. What is authored but not yet teaching

Honest accounting of the gap between intent and the running scene — this is where most of the
remaining pedagogy lives.

- **The cast-as-legend is the core device, and it is not operational yet.** "The moa cast
  changes with the climate" is finding #3 and the intended way a visitor reads the vegetation
  without text (`PLAN_V3.md` §5). But only **Upland Moa** and **one raptor** are
  actually spawned; the other eight moa and the *Dinornis* dimorphism pair are fully defined
  in `TeManawa_species_data.js` and never instantiated. There is currently **no species
  turnover to read.** Turning this on (Phase 7) is the highest-leverage teaching work left.
- **"Tree ferns vanish when it turns cold" (finding #2) is only half-present.** Dormancy
  suppresses the fern, but the sprite/palette era-signal that makes it unmistakable is
  Phase 5 art.
- **The interpretive copy is mute.** Nine moa and twelve plants carry `displayName`,
  `scientificName` and a written `description` (with Māori names — *Harakeke*, *Ponga*,
  *Tawhai*, *Tūmatakuru*…); the four glacial-phase descriptions and the migration narration
  are authored too. **None of it renders**, or it renders only under debug. This is a
  reservoir of ready interpretation waiting on a decision about *whether and how* the piece
  ever names things (§5F).
- **The scene is a systems-check placeholder.** `levels/level_temanawa_scaffold.js` says so
  in its header: *"This is NOT the Manawatū design."*
- **Accuracy flag — RESOLVED.** The apex predator is now **Eyles' harrier / kērangi** (*Circus
  teauteensis*) consistently across species data, the `EylesHarrier` class, notification text
  (*kērangi*, not *Pouākai*) and art (`sprites/EylesHarrier/`). The installation no longer
  positions a South-Island eagle as the North Island's apex predator. **One piece remains:** the
  flight *behaviour* is still the inherited soaring model — retune it toward the harrier's low
  quartering dash when the (delicately balanced) predator model is next touched.

---

## 5. The road to a finished installation

Ordered by teaching leverage, not by phase number. Each item names the design doc that
specifies it.

### A. The art is the critical path (Phase 5)
~**113 new assets** (`TEMANAWA_BUILD_V3.md` §4; the newer `TEMANAWA_SPRITE_BRIEF.md` counts
132 with terrain stamps — the two need reconciling). Nothing in §4 below can *teach* until it
can be *drawn*: the cast can't become the legend and the flora can't carry the era signal
without art. Start now, in parallel with everything else, behind an asset manifest (§G).

### B. Turn the cast into the legend (Phase 7 — fauna)
Spawn the seven-species cast so it changes over with the climate (finding #3); build the
*Dinornis* dimorphism pair (two sprites, one species — "a genuinely surprising fact" that
needs no caption); apply the three predator corrections and, in the same pass, **resolve the
raptor identity** (§4). This is the work that makes the cold read as *busy and different*
rather than empty.

### C. Make the aftermath teach (Phase 6 — disturbance)
The best teaching structure in the research is invisible at kiosk speed: three of four
recovery times are instantaneous. `disturb()` plus the **`warp` local clock** stretches each
aftermath to a few visible seconds (`PLAN_V3.md` §9), and wires the buttons to
habitat-appropriate effects — storm buries dune plants ESE and they grow back into it (#5);
eruption blooms the swamps (#4, which still needs a wetland biome, deferred per
`DEEPTIME_ECOLOGY_PLAN.md` §4).

### D. Finish the interaction loop (`INTERACTION_HEALTH_PLAN.md` steps 2–5)
Wire the regime-fit signal `F` into the derived health `H`; add **kererū and a real
seed-dispersal loop** — the one genuinely new subsystem, and the first mechanic that ever
grows the plant population, so it needs the ≤1000-plant cap enforced at the spawn site; couple
**storm overuse** to dispersal collapse so the storm's hidden cost is legible; then tune the
feel and the photosensitivity slew.

### E. Kiosk hardening and audio (Phase 8)
Photosensitivity sign-off; accessibility and touch-target review; input lockdown across
`1`–`5`; sustained and fast-forward performance. **Audio is the highest-value cold-boot fix
outstanding:** 6.5 MB across 17 mp3s still load in `preload()` — preload only the ambient bed
and lazy-load the rest (`BUILD_V3.md` §5.3). Drop `CONFIG.mapGrid` 512 → 256 (its sliced-rebake
precondition has landed).

### F. Interpretation and mana whenua co-design
The timeline marker text, the phase and migration narration, and any naming are **explicit
placeholders** in the code awaiting co-design (`TeManawa_time.js`, `TeManawa_seasons.js`).
Decisions still open (`PLAN_V3.md` §16): whether to **acknowledge the absences** with a single
quiet end-card (the strongest material in the research — 97% of the wetland gone), the story
framing, and any use of the Te Ahu a Tūranga bone story. This is a curatorial track, and it is
what would let the mute interpretive layer (§4) finally speak.

### G. Structural debt that blocks the above (`REORG.md` §8)
The **asset manifest + naming convention** (step 1) unblocks all of §A and the atlas pack.
Then: strip the ~120 lines of economy residue, split the 1,038-line `sketch.js`, and build the
five sprite atlases (no frame map exists yet).

### H. Open decisions that gate work
Timeline **arrow-vs-wave** (a first pass is built; deciding it unblocks the UI art); the
**coastal moa** conditional eighth species (+5 assets); **hardware** — final portrait
resolution, touchscreen vs physical arcade buttons; whether a **sibling landform screen**
carries the geology (which would let this screen lean further ecological); and the
**eruption-checkpoint reset cost** (~1.2 s) against the old "reset is nearly free" invariant.

---

## 6. Suggested next sequence

A concrete ordering that keeps the kiosk shippable at every step and front-loads teaching value:

1. **Resolve the raptor identity** (§4) — cheap, and it is the one place the build currently
   risks teaching something false.
2. **Lock the asset manifest + naming** (§G, `REORG` step 1) — unblocks every sprite.
3. **Start the art** (§A) on the seven-species cast and the two era-signal plants (mamaku,
   nīkau) first — the assets that carry findings #2 and #3.
4. **Spawn the fauna cast** (§B), even behind placeholder art, so the cold-vs-warm turnover
   turns on and can be tuned against the climate curve.
5. **Wire disturbance + `warp`** (§C) so the buttons' aftermath becomes visible.
6. **Complete the interaction loop** (§D), then the **hardening + co-design** pass (§E, §F).

Steps 1–2 are days, not weeks, and they unblock the rest. The through-line of the whole
sequence is a single shift: moving natural-history facts out of the **authored-but-mute**
column (§4) and into the **land and the cast**, where — by the teaching contract in §1 — a
visitor can read them in forty seconds without being asked to read at all.

---

**Reference:** `TEMANAWA_PLAN_V3.md` (spine) · `TEMANAWA_BUILD_V3.md` (manifest, budgets) ·
`TEMANAWA_DEEPTIME_ECOLOGY_PLAN.md` (climate/eruption build) ·
`TEMANAWA_INTERACTION_HEALTH_PLAN.md` (buttons, health) · `TEMANAWA_GEOGRAPHY.md` (the land
morph) · `TEMANAWA_34VIEW_PLAN.md` (the look).
