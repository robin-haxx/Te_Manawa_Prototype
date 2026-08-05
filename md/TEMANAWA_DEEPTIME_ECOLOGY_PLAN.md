# Te Manawa — Deep-Time Habitat & Eruption Plan

Implementation plan for populating the 1 Ma → 25.5 ka window with **year-bound habitat
change** and **four year-bound TVZ eruptions** that clear the cast and let the visitor
watch it recover. Builds on the geology-is-year-bound work already landed in
`TerrainGenerator.GEO_EPOCHS` / `geoTimeFactors()`.

Reads against, and defers to, `md/TEMANAWA_PLAN_V2.md` (the spine), `md/TEMANAWA_ECOLOGY_WETLAND.md`
§6 (the eruption sequence), and `md/TEMANAWA_CONCEPT_ECOLOGY_FIRST.md` §3 ("three breaths").

> **Governing principle, unchanged:** *a cartoon seen from above, not a survey.* Everything
> below is a handful of scalars keyed to `yearsBP`. The test of each mechanic is not accuracy
> — it is *legibility at arm's length in forty seconds.*

---

## 0. What already exists (so we don't rebuild it)

| System | File | State |
|---|---|---|
| Authoritative clock `yearsBP` (1 Ma → 25.5 ka) | `TeManawa_time.js` | Done |
| Year-bound geology (uplift / incision / emergence) | `TeManawa_terrain.js` `geoTimeFactors()`, `_combineGeo()` | Done — the piece just finished |
| Sliced, hitchless terrain morph | `_morphTick()` (sketch), `morphBegin/Step` | Done |
| Parametric climate `Climate.at(yearsBP)` → glacialIndex, seaLevel, snowLine, **stage 0–3, MIS** | `TeManawa_climate.js` | Done, but **table stops at 350 ka** |
| Biome = elevation band, first-match, baked per "season" | `levels/level_temanawa_scaffold.js` `biomes`, `_rebuildBiomeMap()` | Done |
| Plant death + dormancy + regrowth timers | `TeManawa_plant.js` | Done — reuse for regen |
| Eruption button (tap = soft reset, hold = reseed) + seizure-safe ash flash | `TeManawa_hud.js` | Done — **to be repurposed** |
| Timeline eruption markers | `DEEP_TIME_MARKERS` | 2 of 4, one wrong date |
| **`SeasonManager` — a 4-season timer cycle** driving snow, plant/moa modifiers, frost, 4 baked buffers | `TeManawa_seasons.js` | **Parent-game residue — to be rebound to the glacial clock (§1.1)** |

The habitat is driven by **elevation bands classified off a heightMap that morphs over deep
time.** So "habitat change" = move the bands and the shoreline over `yearsBP`, plus clear-and-
regrow on eruptions. Three axes do the former; one event system does the latter — but all of it
rides on one reframing first.

---

## 1. The habitat timeline

Landform is nearly constant; the **living cover is the moving part** (CONCEPT §3.1). But before
any axis is visible we have to fix what drives the cold/warm state.

### 1.1 The reframing: **"seasons" are glacial periods** *(do this first)*

`SeasonManager` is a direct lift from the parent game: a four-season cycle (summer→autumn→
winter→spring) advanced by a **short timer** (`economy.seasonDuration: 2100` frames). It is the
CLAUDE.md "looks like a game → it is residue" case exactly, and it is already half-aware of it —
the season table carries `glacialFlats` / `shrubland` / `forestRefuge` modifiers and
`getForestBand()`'s own comment says *"treeline retreats in the glacial."* It is standing in for
the glacial cycle on the wrong clock.

**In Te Manawa there are no seasons. There is only the glacial cycle, and it is keyed to
`yearsBP`.** The whole apparatus stays — it is the render + behaviour substrate — but its
**driver changes from the 2100-frame timer to `Climate.glacialIndexAt(yearsBP)`.**

Concretely:

- **`winterness` becomes the glacial index.** `getWinterness()` is already the smooth 0..1
  "how cold does it look / behave" scalar that the frost tint and every moa cold-response read
  (`_seasonCache.winterness`: habitat stress, breeding cooldown, forest competition). Re-source
  it from `glacialIndex` (smoothstepped) instead of the autumn→winter timer ramp. Every
  cold-keyed behaviour then tracks deep time for free — no per-call rewrite.
- **The four buffers become four glacial stages, not four seasons.** `Climate.stageOf(g)`
  already returns 0–3 = *interglacial / cooling / glacial / full-glacial*, with `stageName`
  and `mis`. Re-key the four baked terrain buffers (`seasonBuffers`) and the snow lines
  (`seasonSnowLines`) to those four stages, and **blend by `glacialIndex`** the way the timer
  currently blends `transitionProgress`. Snow line already spans the right range
  (`Climate.snowLineWarm 0.92 → snowLineCold 0.55`).
- **Retire the season timer.** Drop `seasonDuration` from the driver; `update()` reads
  `glacialIndex(yearsBP)`. `onSeasonChange()` fires on **stage transitions**, not timer ticks.
- **Terminology + UI.** Debug overlay shows `season` / `winterness` — relabel to
  glacial *stage* / *MIS* (Climate already supplies both). Migration copy keyed to
  summer/autumn/winter/spring (`MIGRATION_PATTERNS`, `MIGRATION_HINTS`) is co-design label text —
  reframe to interglacial↔glacial movement (moa up into forested highs when warm, down onto the
  outwash flats when cold) or shelve it; it is not load-bearing.

This is the keystone: it is what makes Axes B and C *visible* rather than merely computed, and
it is the honest version of "one place, three breaths." (There are really ~a dozen breaths
across the window — see §1.4 — but the principle holds.)

> **Naming note for whoever builds this:** you will see `season`, `winter`, `summer` all over
> the moa/plant/terrain code. Read them as *glacial phase / full-glacial / interglacial*. Rename
> where cheap; where the churn is risky (buffer keys the harness asserts), leave the identifier
> and fix the label. Do **not** reintroduce a real seasonal cycle.

### 1.2 Axis A — Emergence: sea → coast → land (≈1.0 → 0.5 Ma)

**The fact.** The Pohangina/Rangitikei is the eastern Whanganui Basin — a shallow-marine basin
that shoaled and emerged through the Quaternary by uplift + offlap. The sea began retreating
~1.6 Ma (shallow-marine → fluvio-estuarine), so at the window's open (~1 Ma) the coast still
"curves inward": much of the frame is sea/estuary, and land assembles over the first half of the
run. The user's marine markers (Waitapu Shell Conglomerate, Kaimatira Pumice Sand) are exactly
this marginal-marine phase.

**Today.** `emergence` in `GEO_EPOCHS` (1 Ma → 500 ka) only controls the **river's**
coast-to-source connection front. The *shoreline* is static — `sea` is purely `elevation < 0.10`
— so at 1 Ma the map already reads as fully-emerged land. That's the gap.

**Change.** Add a deep-time **relative sea-level** term — a slow monotonic backdrop distinct from
the fast glacio-eustatic ripple (Axis C):

- Extend `geoTimeFactors(yearsBP)` to return `submergence` — 1.0 at `emergeFrom` (1 Ma), easing
  to 0.0 by `emergeTo` (~0.5 Ma), smoothstepped; driven off the same epoch so it stays in
  lockstep with the river assembling.
- In `_combineGeo()`, before the sea clamp, **lift the effective sea plane**: subtract
  `submergence * SEA_RISE` from each cell's elevation (never raise — mirror `_nsEdgeFalloff`'s
  "only lowers" discipline).
- **`SEA_RISE` is a named, dev-tunable parameter** (in `LOOK`, not `CONFIG`; adjustable live via
  the B re-bake). **Default ≈ 0.14**, tuned so **~1/3 of the frame classifies as sea/coast at
  1 Ma**, retreating to the present shoreline by ~0.5 Ma. Exposed so the sea fraction can be
  dialled up or down without touching the combine.
- Visitor readout: **the run opens as a bay with a thin emerging shore and grows land out of the
  sea over the first few breaths**, while the ranges begin to lift behind it.

Rides the morph re-bake (no per-frame cost). Keep it inside the shared static `_combineGeo` so
the cached-morph path stays bit-identical and `bootcheck`'s morph-identity sweep stays green.

### 1.3 Axis B — Treeline: forest ⇄ open, driven by the glacial index

**The fact (now grounded for accuracy).** At full glacial the lower/central North Island was
**mostly grassland, shrubland and herbfield, with tall podocarp-broadleaf + beech forest reduced
to sheltered valley and coastal refugia and the treeline hundreds of metres lower**; at
interglacial, forest returns to **>80% cover**, climbing toward the subalpine. That swing — tree
ferns gone, tussock and grey scrub over the flats, forest in pockets → full bush — is the single
most legible thing on the screen and is meant to be read off the land, not a graph.

**Today.** Biome bands are fixed in elevation; only snow moves. A forest-contraction mechanic
**already exists but is opt-in and currently OFF**: `SeasonManager.getForestBand()` +
`LEVEL_MECHANICS.forestContraction` / `forestBandBySeason` (the scaffold defines no
`LEVEL_MECHANICS`, so every guard falls through). So Axis B is largely *enable + rekey + make
accurate*, not build-from-scratch.

**Change.**

- **Enable forest contraction and rekey it to glacial stage.** Author `LEVEL_MECHANICS` in the
  level with `forestContraction: true` and a `forestBandByStage` (interglacial / cooling /
  glacial / full-glacial) instead of `…BySeason`. Drive `getForestBand()` off the glacial stage
  from §1.1.
- **Make the magnitude accurate.** Full-glacial band should contract *hard* — forest ceiling
  drops well downslope and the lowland flats hand over to grassland/subalpine/shrubland (a
  treeline depression of ~0.12–0.18 in normalised elevation reads as "hundreds of metres");
  interglacial band climbs to ~0.80. This is the accurate-glacials ask, expressed as two
  authored bands and a blend.
- **Classify hook, for the baked look.** In `_rebuildBiomeMap()` at the
  `getBiomeFromElevation(eClass)` call (terrain.js ~1029), offset the forest lookup by
  `treelineShift = TREELINE_DROP * glacialIndex`, so on each morph re-bake the painted forest/
  open boundary matches the live band. Stash `this._climT = Climate.at(yearsBP)` in `morphBegin`
  and read it here (same pattern as `this._geoT`). Cheap — only on re-bake.
- **Live cast response.** `getForestBand()` already lerps per-frame with no reclassification, so
  the forest **contracts smoothly as the glacial deepens** without stutter. Plants spawn from
  `biome.plantTypes`, so post-rebuild the cast follows; for the immediate "tree ferns vanish,"
  the `winterness`=glacialIndex rebind already lets the existing dormancy path push
  `FOREST_TREES` (`beech, rimu, fern`) dormant as `glacialIndex` climbs — no new art.

**Optional, cheap, PLAN_V2 §3.4:** a frost scalar off `glacialIndex` applied *topographically*
(pools in basins/valley floors first, spares slopes). Nice accuracy touch; deferred behind the
band swing.

### 1.4 Axis C — Extend the climate table back to 1 Ma (accurate glacials)

**The gap (verified).** `Climate.ANCHORS` starts at **350 ka**; older than that
`glacialIndexAt()` holds a **flat 0.85** (checked: 1 Ma, 800 ka, 600 ka, 400 ka all read 0.85).
That freezes Axes A-adjacent glacial ripple and Axis B for **~62% of the run**.

**Change — prepend accurate anchors 1 Ma → 350 ka.** The window spans **~11 one-hundred-kyr
glacial cycles** after the Mid-Pleistocene Transition, with **lower-amplitude ~41-kyr cycles
before ~0.9 Ma**. Reflect both:

- Anchor the post-MPT cycles (≈MIS 22 → 12) at full amplitude (interglacial ≈0.10, glacial peaks
  ≈0.9–1.0), matching the existing 350 ka-onward density.
- Damp the pre-~0.9 Ma cycles (≈MIS 25 → 22): shorter period, glacial peaks only ≈0.6–0.75,
  interglacials ≈0.25 — the MPT is a real, legible change in the *character* of the cold, worth
  showing.
- Ages rounded; *shape and order are what's true* (the file's own rule). Keep `tempCold = -5 °C`
  — it sits mid-range of the -1 to -9.5 °C MAT-depression estimates for NZ glacials, so no change.

**Safe.** All five `bootcheck` climate facts sit **younger than 350 ka**, bracketed by unchanged
anchors, so prepending older ones cannot move them (verified). Add 2–3 new facts for the extended
range (a pre-MPT damped glacial high; a post-MPT interglacial low).

**A and C compose, don't merge.** `Climate.seaLevel` is the *fast* glacio-eustatic ripple (±,
~100 kyr). Axis A `submergence` is the *slow* tectonic emergence (monotonic). Early glacials
nudge the shoreline seaward on a still-drowned basin; late in the run the tectonic term is spent
and only the glacial ripple moves the coast (the LGM "coast walks west"). **Two terms, kept
separate.**

---

## 2. The four eruptions — year-bound events

All four are **skip-targets**, differentiated by clearing severity. The drama differs by two
things at once — the eruption's magnitude **and the habitat standing when it hits** — which is
both truer and more watchable than four copies of the same flash.

| # | Event / source | yearsBP | Scale | Landscape *then* | Clearing | Recovery |
|---|---|---|---|---|---|---|
| 1 | **Potaka / Kidnappers**, Mangakino | **1,000,000** | VEI-8, ~1200 km³ DRE; one of Earth's most widespread ignimbrites. = the Kaimatira Pumice Sand overthickening | **Marine/estuarine** basin, land only just emerging (Axis A near max) | Little standing forest to wipe → **moderate**: strips the thin emerging coastal cover; the spectacle is **pumice + ash over the sea** | Quick — fertile ash + sea → estuarine/dune green-up |
| 2 | **Kaukatea Pumice**, TVZ | **900,000** | **Minor** pulse, small / under-characterised; within the Waitapu Shell Conglomerate | Still marginal-marine, a little more land than #1 | **Minor** — light dusting, little killed | Fast — the "it barely happened" beat |
| 3 | **Rangitawa / Whakamaru**, Whakamaru caldera | **349,000** | VEI-8, **>1500 km³ ignimbrite + ~700 km³ fallout — the biggest**; key marker at the base of the terrace cover beds | Fully emergent; glacial (MIS 10), so cover already forest-limited, but the whole landscape is present | **Catastrophic** — near-total clearing across the frame, thickest ash sheet | **Longest** — "bigger and longer" (**inference, not measurement** — no pollen record at 349 ka; scaled from Ōruanui, per WETLAND §6 caveat) |
| 4 | **Kawakawa / Oruanui**, Taupō | **25,500** | VEI-8, ~530 km³ | **Near-LGM full glacial** — cover already sparse grassland / scrub / herbfield | **Severe on a sparse cover** — ash over open ground, not forest | **Not shown — terminal.** Its fallout sits too close to the present, outside the deep-time story; the run/skip **wraps** here (§3.5) |

Age note for #4: cited ~25.5 ka (¹⁴C, the window's close) vs ~19–25.4 ka (luminescence). Keep
**25.5 ka** as the anchor (matches `yearsEnd`); expose the dispute only in label text.

### 2.1 Destruction + regeneration mechanic

Follow the **five-stage sequence** in WETLAND §6, but **simplified to clear-then-regrow and
parameterised by severity** — one code path for all four, reusing the existing plant
death/regrowth rather than a disturbance ECS.

> **Scope cut (per direction): no wetland bloom.** Wetland is **not a functional biome yet**, so
> WETLAND §6's stage-3 "wetland/aquatic surge" and the peat-fertility flush are **out of scope**.
> The cartoon is **Fall → Clear → Regrow.** Leave a hook/comment where the bloom would attach so
> it can be added once a wetland biome exists — do not implement it now.

One field — **`ashCover`** (0→1, set at eruption, **decaying to 0 over a sim-year window**) —
does three legible things:

1. **Fall (visual).** The existing seizure-safe ash flash (`renderAshFlash`) + a ground ash tint
   ∝ `ashCover` (grey wash that fades as it decays).
2. **Clear.** On trigger, knock back plants weighted by severity across the affected elevation
   range: `FOREST_TREES` → dormant/dead; a `clearFraction` of entities removed.
3. **Regrow (soft).** While `ashCover` decays it **suppresses new spawn**, then releases it — the
   map repopulates from the existing `spawnPlants` + regrowth timers as the ash clears. This *is*
   "the current soft regen."

**Three severity tiers** (not five bespoke scripts):

| Tier | Events | `clearFraction` | ash decay (sim-yrs) | notes |
|---|---|---|---|---|
| Minor | Kaukatea (#2) | ~0.15 | short | barely a pause |
| Major | Kidnappers (#1), Oruanui (#4) | ~0.6 | medium | #1 masked by sea (little to clear); #4 clears then **wraps** before regrow is shown |
| Catastrophic | Rangitawa (#3) | ~0.95 | long | the set-piece |

Severity is thus **magnitude × standing cover**: #1 and #4 share a tier but read differently
because Axis A leaves #1 mostly sea and Axis C leaves #4 mostly frozen — and #4's regrow is never
shown. Author all tier numbers in one table (`ERUPTIONS[i].tier`), never inline.

---

## 3. The interaction — long-press skips, single-press reverts

### 3.1 Today

`TeManawa_hud.js`, button 4 / key `4`: **tap** → soft reset (living world only), 2 s cooldown;
**hold ≥ `erLongPressMs` (3 s)** → `init()` (new land seed). The ash flash **charges** across the
hold so the reseed hitch lands under a bright frame.

### 3.2 Target

Repurpose the same button into **navigation between eruption events** — gesture stays,
destination changes:

- **Single press (tap) → revert to the *last* (older) eruption**, and play its **soft regen** from
  the cleared state. The visitor drops onto the moment after that eruption and watches the habitat
  come back.
- **Long press (hold) → skip forward to the *next* (younger) eruption**, firing its clearing. The
  existing charge-ramp flash covers the seek/morph hitch exactly as it now covers reseed.

Both are **seeks on `yearsBP`** → morph terrain to the target year → clear/regen for that event.
The 2 s cooldown and ramped flash stay (anti-spam + photosensitivity).

### 3.3 Code touchpoints

**`TeManawa_time.js` (DeepTime)** — the event list + seek helpers (single source of truth; markers
and HUD both read it):

```
ERUPTIONS: [1000000, 900000, 349000, 25500]   // sorted old→young
seekTo(y)        // yearsBP = clamp(y); clear _ended; reset the deep ramp
prevEruption(y)  // largest ERUPTION strictly older than y   (single-press target)
nextEruption(y)  // smallest ERUPTION strictly younger than y (long-press target); wraps — see §3.5
```

**`DEEP_TIME_MARKERS`** — add Kidnappers (1,000,000) and Kaukatea (900,000); **fix Whakamaru
345000 → 349000**. Four markers will render instead of two.

**`TeManawa_hud.js`** — repoint the two handlers: `erUp()` (tap) → `seekTo(prevEruption)` → morph →
**soft regen** (`resetEcosystem`) → cleared-then-recovering state; keep the cooldown.
`fireEruptionReseed()` (hold) → `seekTo(nextEruption)` → morph → that event's **clearing**; keep
the charge ramp. Rename the internal intent reseed/reset → skip/revert; label stays `ERUPTION`.

**`TeManawa_sketch.js`** — the seek forces an immediate `terrain.morphBegin(targetYear)` so the cut
is crisp under the flash rather than waiting for `_morphTick`'s interval.

### 3.4 The gotcha to get right

`resetEcosystem()` → `_buildSimulation()` **calls `DeepTime.reset()`**, snapping `yearsBP` back to
**1 Ma**. A naive "revert = soft reset" would fling the clock to the start. Fix: add a `keepClock`
option that skips `DeepTime.reset()`, **or** do the `seekTo(target)` + morph **after** the rebuild.
Seek last.

### 3.5 Edge / wrap behaviour *(confirmed)*

- **Long-press that would reach Oruanui, or any long-press at/after it → wrap to #1 (1 Ma).**
  Oruanui's fallout is too close to the present to show; it is the **terminal/wrap point**, which
  also doubles as the natural restart and matches the existing end-of-window attract cue. So
  `nextEruption()` from Rangitawa (349 ka) returns **1 Ma**, not 25.5 ka. (Oruanui still exists as
  the run's closing ash beat when the clock plays through normally; you just cannot *skip into* its
  recovery.)
- **Single-press before the first eruption (older than 1 Ma is impossible; at 1 Ma there is no
  older event) → no-op** (a soft "already at the first").
- Between events, taps walk backward 4→3→2→1 and holds walk forward 1→2→3→(wrap)→1.

---

## 4. Build order

> **Status — implemented + harness-green (EXIT 0).** All of steps **1–7** are in: season→
> glacial rebind, climate table to 1 Ma, forest contraction, Axis A emergence sea-level,
> eruption data/seek/markers, eruption clear/regen (`ashCover`), and the button skip/revert
> navigation — plus the **3/4 bottom-crop** terrain fix (front eased band pushed off-frame).
> Eruptions also **auto-fire as the clock crosses each checkpoint** during normal play (once
per cycle, via a crossing test + fired-set), so the ambient timeline shows them without the
button; the **attract/idle reset returns to the previous eruption** (`applyEruptionAt`), not
1 Ma, except a periodic reseed (every 12th) which is a full restart. That makes the attract
reset heavier than the bare ecosystem swap (it morphs the terrain) — crossfaded and
infrequent, but above the old 10–25 ms soft-reset budget.
Deferred: the per-phase baked treeline (§1.3) and the wetland bloom (needs a wetland biome).
> **Confirm/tune in-browser** (geometry-reasoned, not eyeballed here): `LOOK.seaRise` (~1/3
> sea at 1 Ma) and `Projection.reliefCropBottomFrac` (0.30 — the bottom crop amount).
> `winterness` is the glacial index; the four terrain buffers are the four glacial phases
> (`interglacial/cooling/glacial/fullGlacial`); `economy.seasonDuration` is vestigial.

Each step is independently testable and leaves the kiosk shippable.

1. **Rebind seasons → glacial clock (§1.1).** `winterness` = `glacialIndex`; 4 buffers rekeyed to
   the 4 climate stages; retire the season timer; relabel debug. *Foundational — makes B and C
   visible; touches the most code, so do it first and lean on the harness.*
2. **Climate back to 1 Ma (Axis C).** Pure function; prepend accurate MPT-aware anchors; add facts.
3. **Enable + rekey forest contraction (Axis B).** `LEVEL_MECHANICS.forestContraction` +
   `forestBandByStage`; classify offset in `_rebuildBiomeMap`; accurate full-glacial magnitude.
4. **Emergence sea-level (Axis A).** `submergence` in `geoTimeFactors`; sea-plane lift in
   `_combineGeo`; `SEA_RISE` in `LOOK` (~1/3 default); keep morph-identity green.
5. **Eruption data + markers.** `ERUPTIONS`, `seekTo/prev/next` (with the Oruanui wrap); add the two
   markers, fix the Whakamaru date. *(unblocks step 7)*
6. **Eruption clear/regen** (`ashCover` scalar + tiered severity + decay; **no bloom** — leave the
   hook).
7. **Repurpose the button** to seek-navigation (§3); handle the `DeepTime.reset()` gotcha and the
   wrap cases.
8. **Verify** (§5).

Steps 1–4 (habitat substrate) and 5–7 (eruptions) are largely independent once step 1 lands; step 5
blocks step 7.

---

## 5. Test / verification impact

Run `node tools/bootcheck.js` before every commit (it has caught two bugs reading the code didn't).
Expect to touch:

- **Season → glacial rebind.** The harness asserts the four `seasonBuffers` keys
  (`summer/autumn/winter/spring`) are built and re-baked (`bootcheck` ~819, ~873) and reads
  `getWinterness()`. If buffer keys are renamed to stage names, **update those references**; if the
  keys are kept, assert instead that `winterness` now tracks `glacialIndex(yearsBP)` (drive the
  clock, read winterness, check it rises into a glacial). Debug snapshot (`TeManawa_debug.js` ~121)
  reads `season`/`winterness` — update to stage/MIS.
- **Climate section (~209–219).** Keep the five facts; **add** facts for the extended range (a
  pre-MPT damped glacial high, a post-MPT interglacial low).
- **Eruption section (~116–177).** Currently asserts the *old* semantics (tap = one soft reset
  terrain-kept; hold = reseed new terrain). **Rewrite** for the new contract: a tap lands the clock
  on `prevEruption`; a hold lands it on `nextEruption` **and wraps to 1 Ma past Rangitawa**; the 2 s
  cooldown still guards; the flash still ramps on hold. Terrain identity is no longer the signal —
  **`yearsBP` after the gesture is.**
- **Morph identity.** Axis A changes `_combineGeo`; keep sync-vs-sliced bit-identical (harness
  sweeps this). New terms live in the shared static combine, not the caller.
- **Add:** `seekTo/prev/next` unit checks (monotonic; clamps; wraps at Oruanui; no-op below 1 Ma).
- **Visual pass** (`node tools/serve.js`): (1) opens as sea, grows land; (2) forest breathes down to
  refugia and back with the cold cycles; (3) the four eruptions grey-then-green at their dates,
  differently, and a forward-skip past Rangitawa wraps to 1 Ma.

Respect the budgets: soft reset **10–25 ms** (the revert path must stay soft regen, never
`init()`), **no allocation in `draw()` or resets**, ash ramps **≥ 500 ms / ≤ 3 luminance
transitions per second**, `createGraphics` buffers `remove()`d when replaced.

---

## 6. Decisions

Resolved by the last round of direction:

- **Oruanui wraps** the timeline; its fallout is not shown (§2 row 4, §3.5). ✔
- **Sea at 1 Ma ≈ 1/3 of the frame**, exposed as the tunable `SEA_RISE` (§1.2). ✔
- **No wetland bloom** — wetland is not a functional biome; ship Fall→Clear→Regrow, leave a hook
  (§2.1). ✔
- **Seasons are glacial periods** — rebind to `glacialIndex(yearsBP)`, no seasonal mechanic (§1.1). ✔
- **Accurate glacials** — MPT-aware climate anchors + hard, grounded full-glacial forest contraction
  to refugia (§1.3–1.4). ✔

Still open — worth a call before coding the affected step:

1. **How far to take the season *rename*** (step 1): rename the buffer keys and migration copy to
   glacial-stage terms (cleaner, more harness churn), or keep the identifiers and fix only the
   visible labels (less churn, lingering "winter" in the code)?
2. **Live glacial dormancy strength** (Axis B): how hard should `FOREST_TREES` flip dormant as the
   glacial deepens — a full "tree ferns vanish" at `glacialIndex > ~0.7`, or a gentler thinning?
3. **Frost topography** (§1.3 optional): include the basin-pooling frost scalar now, or defer behind
   the forest-band swing?

---

## Sources

Eruptions & tephrostratigraphy (user-supplied + verified):
- GSNZ FT4 Whanganui Basin — Kaimatira Pumice Sand overthickened by the Potaka (Unit E) eruption,
  ~1 Ma, Mangakino.
- *Quaternary sedimentology and tephrostratigraphy of the lower Pohangina Valley* (2018) —
  https://www.tandfonline.com/doi/full/10.1080/00288306.2018.1547321
- *Plio-Pleistocene geology of the Lower Pohangina Valley* (2017) — sea retreat ~1.6 Ma,
  marine → fluvio-estuarine — https://www.tandfonline.com/doi/full/10.1080/00288306.2017.1408023
- Kaukatea Pumice ~0.9 Ma, Rangitikei succession —
  https://rsnz.onlinelibrary.wiley.com/doi/10.1080/00288306.2019.1587475
- Rangitawa Tephra / Whakamaru 349 ka, >1500 km³ ignimbrite + ~700 km³ fallout —
  https://www.sciencedirect.com/science/article/pii/S0377027326000922
- Kidnappers/Potaka ~1200 km³ DRE, VEI-8, Mangakino supereruption —
  https://en.wikipedia.org/wiki/Mangakino_caldera_complex
- Kawakawa/Oruanui ~25.5 ka (¹⁴C) vs luminescence dispute —
  https://www.sciencedirect.com/science/article/abs/pii/S0277379112004775

Glacials & vegetation:
- *The vegetation cover of New Zealand at the Last Glacial Maximum* (Newnham et al.) — central/
  southern North Island mostly shrubland/grassland/herbfield, forest in refugia, treeline hundreds
  of metres lower — https://www.sciencedirect.com/science/article/abs/pii/S0277379112003356
- `md/TEMANAWA_ECOLOGY_OPEN.md` — pre-human forest >80%; treeline; induced shrubland.

Habitat & disturbance (internal):
- `md/TEMANAWA_ECOLOGY_WETLAND.md` §6 — the five-stage eruption sequence, Ōruanui pollen timings,
  the Whakamaru "inference not measurement" caveat (bloom stage deferred here — no wetland biome).
- `md/TEMANAWA_CONCEPT_ECOLOGY_FIRST.md` §3 — "three breaths," cold → forest-retreat/tussock.
- `md/TEMANAWA_PLAN_V2.md` — climate rationale (§8.2), disturbance-per-habitat findings, topographic
  frost (§3.4).
