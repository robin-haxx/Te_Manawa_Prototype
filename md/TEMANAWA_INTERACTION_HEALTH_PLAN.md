# Te Manawa — Interaction & Habitat-Health Plan

A plan to make the visitor buttons *teach the ecology*, not just perturb it. Three changes,
one shared signal:

1. **Split "Growth" into two buttons** — one that helps in the **glacial**, one that helps
   in the **interglacial**. The same press does opposite things at opposite ends of the
   climate cycle, so pressing the *wrong* one for the current climate visibly harms the land.
2. **Surface the health of the habitat as the scene's saturation** — a "quiet" full-scene
   desaturation when the ecology is mismanaged, recovering to full colour when it is tended.
3. **Add kererū and a real seed-dispersal loop.** Overusing the **Storm** button keeps the
   kererū grounded, dispersal stalls, the forest cannot recruit, and the scene drains of
   colour — the storm's hidden cost.

Reads against, and defers to, `md/TEMANAWA_PLAN_V3.md` (the spine), `md/TEMANAWA_DEEPTIME_ECOLOGY_PLAN.md`
(the glacial-clock rebind this builds on), `md/TEMANAWA_ECOLOGY_FAUNA.md` §3.3 (the kererū
dispersal fact), and `md/TEMANAWA_34VIEW_PLAN.md` §7 (the "quiet ground" look this extends).

> **Governing principle, unchanged:** *a cartoon seen from above, not a survey.* Every
> mechanic below is a handful of scalars keyed to a legible ecological signal. The test of
> each is not accuracy — it is whether a passer-by can read *"I helped / I harmed this place"*
> off the **colour of the scene**, at arm's length, in forty seconds, with no text.

**Decided:** the wall expands to **five buttons** (keys `1`–`5`) — Deep Time · Grow-Warm ·
Grow-Cold · Storm · Eruption. Nothing is retired; the kiosk input lockdown widens from `1`–`4`
to `1`–`5`.

---

## 0. What already exists (so we don't rebuild it)

| System | Where | State / note |
|---|---|---|
| Button registry (no event bus) | `TeManawa_hud.js:47-71` `BUTTONS` array | Linear-scanned by `handleKey`/`handleClick`. Effects are **"until"-timestamp flags on `Game`** (`g._tmGrowthUntil`, `g._tmStormUntil`) read each frame |
| The per-frame effect pump | `TeManawa_hud.js:167-200` `InstallHUD.update(g,dt)` | The single place all pulses are applied. Called from `Game.update` (`sketch.js:1040`) |
| Growth effect (template) | `TeManawa_hud.js:175-183` | Nudges every **alive** plant `growth += 0.02`/frame. Does **not** spawn or change rates |
| Storm effect | `TeManawa_hud.js:204-225` `applyStormDistraction` | Distracts **only hunting eagles** for 20 s (moa reprieve). Touches nothing else |
| Timing tunables | `TeManawa_hud.js:20-35` `TM_TIME` | `stormSeconds:20`, `growthSeconds:8`, eruption timings, cooldowns |
| Authoritative glacial state | `Climate.glacialIndexAt(yearsBP)` → `0..1` | `0`=interglacial, `1`=full glacial. `SeasonManager.getWinterness()` returns the **same number**. Glacial cut at `g≥0.5` (`stage≥2`) — `climate.js:154-159` |
| Frame order | clock → climate → ecology | `DeepTime.update` → `SeasonManager.update` re-samples `glacialIndexAt` → sim update. So a button read at frame start sees the current climate |
| Scene colour | **baked into 4 season buffers, blitted with `image()`** | No per-frame saturation today. `render()` = pure blit (`terrain.js:2512`). "Quiet" desaturation is bake-time only: `LOOK.quietSat` (`terrain.js:26`), applied in `_paintGridPass1` (`terrain.js:2258-2268`) |
| Full-screen washes (the overlay precedent) | frost `sketch.js:1148-1155`, ash `1160-1168`, ash-flash `hud.js:504-523` | Alpha-driven `rect()` passes keyed off a `0..1` scalar (`getWinterness()`, `_ashCover`). The model for a scalar-driven overlay |
| Plants | `TeManawa_plant.js`, `new Plant(...)` → `simulation.plants` | **No seed / dispersal / germination anywhere.** Plants regrow **in place** (`plant.js:333-344`); the population only *falls* after `init()`. No plant count cap enforced |
| Radius scatter (dispersal template) | `TeManawa_placeable.js:197-218` `spawnPlantsInRadius` | Feeder placeables scatter flagged plants in a radius — the pattern kererū dispersal reuses |
| Aggregate metrics | `TeManawa_simulation.js:1257-1316` `getSummary()` | Cached once/frame: `plantCount`, `dormantPlantCount`, `moaCount`, `moaBySpecies`, `otherCounts`. **No biomass / diversity / forest-cover** — a health number must be derived |
| New-fauna hooks | `_spawnOtherEntities` `sim.js:214-232` ("for weka, kea…"); generic `otherEntities` update loop `sim.js:802-815` | A new bird class `extends Boid` (`boid.js:4`) with `behave()`+`update()`, registered via `REGISTRY.registerAnimalType/registerSpecies`, spawns from `level.initialEntityCounts`. Enforced pop caps are per-type in `LEVEL_MECHANICS` (eagle `12`, moa `60`) |
| Reset hygiene | `TeManawa_kiosk.js:192` | Clears the pulse flags on attract reset. **New persistent state must be cleared here too** |
| Headless harness | `tools/bootcheck.js:110-218` | Already drives `handleKey('1'..'4')` + eruption paths. Extend, don't replace |

**The upshot:** none of the three changes fights the architecture. The button pattern (flag +
per-frame read) generalises cleanly; the glacial index is already the authoritative warm/cold
signal; the overlay precedent already exists; and dispersal is the *only* genuinely new
subsystem — it is also the first mechanic that ever grows the plant population, so it is the
first place a real plant cap is needed.

---

## 1. The one number — **Habitat Health `H`**

A single scalar `H ∈ [0,1]` is the spine of the whole feature. It is **not a score the buttons
move directly** — it is a *readout of the sim*, eased toward a target computed from real
ecological signals, so that the colour on the wall is always an honest reflection of the world's
state. The buttons act on the **ecology**; `H` follows.

**Where it lives.** A field on `Game` (alongside `_ashCover`), updated once per frame in
`InstallHUD.update` (or a small `Game._updateHabitatHealth(dt)` called there — same site as the
existing pulses). Seeded at `init()`/`resetEcosystem()` from `getSummary()` so a soft reset lands
at a sensible value cheaply (respects the 10–25 ms budget).

**Two contributing signals**, each mapped to one visitor-legible lesson:

- **Regime fit** `F ∈ [0,1]` — *is the standing cover the right type for the current climate?*
  Warm (`g<0.5`) expects forest-dominant cover; cold (`g≥0.5`) expects open-country cover.
  Computed from `getSummary()` plant counts split by the warm/cold plant sets (§2) versus the
  climate expectation. **This is the split-growth teaching signal:** the right growth button
  raises `F`, the wrong one lowers it.
- **Recruitment health** `R ∈ [0,1]` — *can the forest regenerate?* Driven by the kererū
  dispersal loop (§3). In the interglacial the forest should be recruiting (kererū dispersing
  large-fruit seeds → new forest plants); if storms keep the kererū grounded (§4), recruitment
  stalls and `R` falls. In the glacial, kererū are scarce and the forest is not recruiting
  anyway, so `R` is dormant and does not penalise — the cold is not a failure.

```
H_target = clamp( F * R )          // both must be healthy; either one sick drains the scene
H        += (H_target - H) * kEase // slow ease, slew-capped (see §5 for the photosensitivity cap)
```

`H` eases on a **long** time constant (seconds, not frames) so the scene breathes rather than
flickers — a press's consequence arrives as a visible drift, which is what makes cause and effect
readable. All weights (`kEase`, the `F`/`R` blend, the floor) are authored in **one place**
(a small `HEALTH` block, sibling to `LOOK`/`TM_TIME`), never inlined — matching the single-source
discipline the project already enforces for biomes.

> **Why derive it rather than score it.** A derived `H` means the wall's colour is a *diagnostic*
> of the ecology the sim is already running — which is exactly the user's ask: interactions that
> are "more informative about the ecology systems baked into the sim." A press teaches because it
> changes the world and the world's colour answers back.

---

## 2. Split Growth → **Grow-Warm (2)** and **Grow-Cold (3)**

Two buttons, one lesson: **the right thing to grow depends on the climate.** This is the single
most legible thing on the screen (forest ⇄ open, three breaths — `CONCEPT §3.2`, "one button
visibly fails somewhere"), made into a side-by-side contrast the visitor controls.

**Author two plant sets** (in the level file, `levels/level_temanawa_scaffold.js`, the single
source of the ground look):

- `WARM_PLANTS` — the forest / podocarp-broadleaf / tree-fern types (beech, rimu, tawa, fern…).
- `COLD_PLANTS` — the open-country types (grassland, tussock, shrubland, herbfield) — the
  cold-tolerant end of `PLANT_TYPES.coldTolerance` (`sketch.js:581-622`).

Both buttons reuse the growth-loop template (`hud.js:175-183`) but **filtered by set**:

| Button | Matures | In its climate (right) | In the other climate (wrong) |
|---|---|---|---|
| **Grow-Warm** `2` | `WARM_PLANTS` toward `growth=1`; gives kererū a forage/breed boost | Interglacial → forest thickens, `F` ↑ → scene **re-saturates** | Glacial → the matured forest is immediately pushed dormant/suppressed by the existing glacial forest-band contraction (`plant.js:249-259`); the press is wasted **and** diverts from the open cover that should grow → `F` ↓ → **desaturates** |
| **Grow-Cold** `3` | `COLD_PLANTS` toward `growth=1`; favours glacial grazers (Mantell's moa, geese) | Glacial → tussock/scrub spread, `F` ↑ → **re-saturates** | Interglacial → promoting scrub while the forest is trying to return suppresses the recovery → `F` ↓ → **desaturates** |

The "wrong action" harm is **mostly emergent, not a bolt-on penalty**: matured but
climate-mismatched plants are suppressed by machinery that already exists (dormancy, forest-band
contraction), which lowers `F` on its own. To make the lesson land inside a 40-second visit, a
mismatched press *also* nudges `F` down a defined notch immediately (authored in `HEALTH`), so the
colour answers within a couple of seconds rather than a couple of glacial cycles.

**Button/plumbing changes:**
- Add two `BUTTONS` entries (`hud.js:47-71`), keys `2` and `3`; renumber Storm→`4`, Eruption→`5`.
- Add `growWarmSeconds` / `growColdSeconds` to `TM_TIME` (`hud.js:20-35`).
- Two flags `g._tmGrowWarmUntil` / `g._tmGrowColdUntil`; two filtered loops in
  `InstallHUD.update`. Clear both in `kiosk.js:192`.
- **Kiosk input:** widen the lockdown allow-list from `1`–`4` to `1`–`5` (and the button
  hit-test/labels). Update `CLAUDE.md`'s authoring-keys table.

---

## 3. Kererū and the dispersal loop *(the one new subsystem)*

The ecology is emphatic and load-bearing: **kererū is the *only* surviving bird large enough to
swallow and disperse big podocarp/tawa fruit — large-fruited trees only recruit where kererū go;
moa were seed *destroyers*, not dispersers** (`ECOLOGY_FAUNA §3.3`, `FAUNA §167-169`). So dispersal
is a *kererū* mechanic, and it is what couples the Storm button to the forest.

**Add kererū as fauna** — recommended path: its own `class Kereru extends Boid` (`boid.js:4`)
implementing `behave()`/`update()`/`render()`, registered with
`REGISTRY.registerAnimalType('kereru', {}, Kereru)` + `registerSpecies('kereru', …)`
(`species_data.js` style), spawned from `level.initialEntityCounts` → `_spawnOtherEntities`
(`sim.js:214-232`) → the generic `otherEntities` update loop. It counts toward the 300-fauna
budget and gets a `LEVEL_MECHANICS.kereruMaxPopulation` cap in the eagle style.

**Behaviour (cartoon, not survey):** prefer forest cells / mid elevation, perch, and periodically
**disperse a seed** — spawn one `new Plant()` of a `WARM_PLANTS` (large-fruited) type near the
perch via a radius scatter (template `placeable.spawnPlantsInRadius`, `placeable.js:197-218`).

> **This is the first mechanic that ever grows the plant population at runtime.** It **must** be
> guarded by a real `≤1000` live-plant cap at the spawn site (none exists today — `sim.js:308-309`
> notes the seed density stays under budget by construction). Allocation happens in `update`,
> never `draw`; if per-frame `new Plant` churn is a concern, disperse on a throttle and/or draw
> from a small free-list pool (the project bans allocation in `draw()`/resets).

**Gating (this is where the ecology shows through):**
- **Climate.** Kererū are abundant in the interglacial, scarce in the glacial (`ECOLOGY_FAUNA:213`).
  Tie spawn/survival to `g` the way eagle demography already switches on phase
  (`sim.js:1079-1086`). Consequence: in the glacial there is little dispersal — and that is
  *correct*, so `R` stays dormant rather than penalising.
- **Storm.** While a storm window is live (`g._tmStormUntil`) — and for a recovery tail after —
  kererū shelter and **stop dispersing**. One storm = a brief pause, negligible. See §4.

Keep the existing storm→eagle distraction (moa reprieve) unchanged: **Storm now does two things**
— shields moa *and* grounds the disperser. That double edge is the teaching.

*(Future, out of scope: kererū is also the harrier's favoured prey — eagle diet could prefer
kererū. Note the hook; don't build it now.)*

---

## 4. Storm overuse → dispersal collapse → desaturation

The chain the visitor should be able to feel: **storm spammed → kererū never fly → seeds never
move → the forest thins → the colour drains.**

**Add a storm-pressure accumulator** `g._tmStormPressure ∈ [0,1]` (none exists today):
- Each Storm press adds a fixed increment (in the button `action`, `hud.js:55`).
- It **decays exponentially** each frame in `InstallHUD.update`.
- While pressure is high, kererū stay grounded **between** storms too (chronic, not just during
  the 20 s window), so repeated presses hold dispersal off.

Effect on health: sustained high pressure → dispersal suppressed → in the interglacial the forest
cannot recruit → `WARM_PLANTS` slowly age out without replacement → `R` falls → `H` falls →
**the scene quietly desaturates.** A single press barely moves pressure; only *overuse* keeps it
high. That is the lesson — the tool is fine in moderation, harmful in excess — and it is emergent
from the dispersal loop, not a hard-coded "you pressed storm too much" counter.

Clear `_tmStormPressure` in `kiosk.js:192` on attract reset.

---

## 5. The readout — habitat health as scene saturation

**Add** `g._sceneSat`, eased toward `map(H)` and applied per frame as a real desaturation:

```
targetSat = SAT_FLOOR + (1 - SAT_FLOOR) * H        // H=1 → saturate(1.0) authored look; H=0 → floor
g._sceneSat += clamp(targetSat - g._sceneSat, -slewPerFrame, +slewPerFrame)   // photosensitivity slew
```

Applied via the Canvas2D filter in `Game.render()` (recommended hook from the render recon — no
re-bake, matches the existing `drawingContext` style in `terrain.render()`):

```js
drawingContext.filter = 'saturate(' + g._sceneSat + ')';   // before the world block
...   // terrain.render() … simulation.render()  (sketch.js:1138-1202)
drawingContext.filter = 'none';                            // before restore() at 1204
```

- **`SAT_FLOOR ≈ 0.35`, not 0** — *quiet* desaturation, never full grey. Museum-ambient: the
  land looks tired and washed-out when neglected, not alarming. Authored in `HEALTH`.
- **Photosensitivity is non-negotiable.** The slew cap must keep the change ≥500 ms / ≤3 luminance
  transitions per second — the same discipline the ash flash and morph crossfade already enforce
  (`hud.js:491-503`, `terrain.js:2527-2551`). Because `H` already eases slowly, `_sceneSat`
  mostly rides it; the slew cap is the hard backstop.
- **Do not double-count the glacial frost.** The frost haze (`sketch.js:1148-1155`) already cools
  the scene with `g`. Health saturation is orthogonal (driven by `H`, not `g`), so a *cold* scene
  and a *sick* scene read differently — cold-but-healthy stays colourful-under-blue; sick drains.

**Scope of the pass — one open call (see §8):**
- **Whole world block** (ground + entities), wrapping `sketch.js:1138-1202` — strongest reading of
  "the whole place is sick." **Recommended** for legibility of *overall* health.
- **Ground only** (wrap just the terrain blit `1138`) — cheaper on the 4K panel, and *more* on
  brand with `34VIEW §7`'s "quiet the ground so the outlined sprites pop." A good perf fallback.
- A full-canvas Canvas2D `filter` every frame at 4K may be costly — **profile via `Debug.sample`
  (`sketch.js:1432`)** and drop to ground-only (or the cheaper grey-wash `rect`, `sketch.js:1160`)
  if it bites the frame budget.

---

## 6. Integration map — every touch point

| Change | File · line | What |
|---|---|---|
| Two growth buttons; renumber Storm/Eruption | `TeManawa_hud.js:47-71` | new `BUTTONS` entries, keys `2`/`3`, filtered growth loops |
| Growth timings | `TeManawa_hud.js:20-35` `TM_TIME` | `growWarmSeconds`, `growColdSeconds` |
| Storm pressure + kererū grounding | `TeManawa_hud.js:55`, `:186-189`, `:167-200` | increment on press; decay + apply in the pump |
| Habitat health update | `TeManawa_hud.js:167-200` (or `Game._updateHabitatHealth`) | derive `F`, `R`; ease `H` |
| Warm/Cold plant sets + `HEALTH` block | `levels/level_temanawa_scaffold.js` | single source; `SAT_FLOOR`, `kEase`, notch sizes, weights |
| Health signals from counts | `TeManawa_simulation.js:1257-1316` `getSummary()` | add forest/open cover split (cheap, once/frame) |
| Kererū class | new `TeManawa_kereru.js` (+ `index.html` load order) | `extends Boid`; `behave/update/render` |
| Kererū species + cap | `TeManawa_species_data.js`, level `LEVEL_MECHANICS` | `registerSpecies`; `kereruMaxPopulation` |
| Dispersal spawn + **plant cap** | new code, template `TeManawa_placeable.js:197-218` | `new Plant` in a radius, guarded `≤1000` |
| Saturation pass | `TeManawa_sketch.js:1138-1204` `Game.render()` | `drawingContext.filter='saturate()'` + slew state |
| Reset hygiene | `TeManawa_kiosk.js:192` | clear `_tmGrowWarmUntil`, `_tmGrowColdUntil`, `_tmStormPressure`; reseed `H`/`_sceneSat` |
| Kiosk input 1–5 | kiosk lockdown + `CLAUDE.md` keys table | widen allow-list; document the fifth button |

---

## 7. Build order

Each step is independently testable and leaves the kiosk shippable. Run `node tools/bootcheck.js`
before every commit.

1. **Habitat Health `H` + saturation readout (foundational). — ✅ BUILT.** `Game._habitatHealth`
   + `Game._sceneSat`, eased/slewed in `_updateHabitatHealth(dt)` (real dt), applied as a
   **ground-only** `drawingContext.filter = 'saturate(_sceneSat)'` around the terrain blit in
   `Game.render()`, gated to `sat < 0.999` (no filter, zero cost, in the healthy steady state).
   Config in the `HEALTH` block (`satFloor 0.35`, `healthEase`, `satSlewPerFrame`, `groundOnly`).
   The step-1 target is a **placeholder = `1 − _ashCover`** (a living-cover ratio was tried first
   but dips with normal moa grazing, wrongly desaturating a healthy map). Verified in-browser:
   undisturbed → health 1 / sat 1 / filter off; the Kidnappers eruption at the 1 Ma open greys
   the ground and it greens as ash clears; forcing the filter cut real ground chroma ~67 %. Rough
   throttled profile (~2 MP): ~1.8 ms/frame filter overhead, **paid only during a disturbance**;
   a true on-panel 4K profile is the step-5 call. Steps 2–4 replace the placeholder target.
2. **Split Growth (buttons 2 & 3; wall → 5). — ✅ BUILT.** The `GROWTH` button became two —
   **FOREST** (key 2) and **TUSSOCK** (key 3) — with `STORM`→4 and `ERUPTION`→5; the button
   layout auto-reflows off `BUTTONS.length` and the kiosk lockdown is DOM-only, so no key
   allow-list change was needed (only docs). Each button matures its own plant set, classified
   by the authored `coldTolerance` (`TM_GROW.warmMax 0.65` / `coldMin 0.75`; mid-tolerance
   plants like flax are neutral to both — no universal-win press). Regime fit `_regimeFit` on
   `Game` eases toward the floor on a climate-mismatched press, toward 1 on a matched one, and
   relaxes back when idle (`HEALTH.regime*`); it multiplies into the health target, so a wrong
   press quietly desaturates and recovers. Climate gate is `getWinterness() ≥ 0.5`. Harness
   assertion added (§8): right growth holds fit, wrong growth drains it, in both climates.
   `F` is button-driven here (a fuller cover-derived `F` is a later refinement).
3. **Kererū + dispersal. — ✅ BUILT.** New `TeManawa_kereru.js` (`class Kereru extends Boid`;
   `behave`/`update`/`render`), registered in `initializeRegistry`, spawned via
   `initialEntityCounts.kereru: 8`, rendered as a flyer (above the ground plane, like the eagle).
   `Simulation.disperseSeed()` is the one runtime path that grows the plant population — it plants
   a low-growth **warm/forest** seedling near the bird and enforces the live-plant cap
   (`LEVEL_MECHANICS.maxLivePlants: 900`). Dispersal runs only in the interglacial and pauses when
   a storm grounds the bird. The recruitment term `R` (`Game._recruitment`) drains when the
   interglacial forest has no kererū to recruit it and relaxes back otherwise; it multiplies into
   the health target alongside ash and regime-fit. Placeholder art (drawn glyph — dark back, white
   waistcoat); the 5-frame flight sprite drops in later. Harness assertion added (§8): spawn,
   cap-guarded dispersal of a warm seedling, and recruitment stalling without kererū.
4. **Storm coupling. — ✅ BUILT.** A decaying **storm-pressure accumulator** (`Game._stormPressure`):
   each STORM press adds `TM_TIME.stormPressureAdd` (0.40); it decays every frame in
   `InstallHUD.update` (`stormPressureDecay` 0.999, τ≈17 s) and derives `Game._stormOveruse` above
   `stormOveruseAt` (0.55). While overused, `Kereru.behave` keeps the flock grounded **between**
   storms (not just the active window), and the recruitment term `recStalled` gains an overuse
   clause, so sustained spamming stalls dispersal → the scene desaturates. **A single press stays
   below the line — cheap.** The existing eagle distraction (moa reprieve) is unchanged, so STORM
   is now genuinely double-edged. Cleared on the attract reset; harness assertion added (§8): one
   press isn't overuse, spamming crosses the line and drains recruitment, pressure decays back.
5. **Tune + accessibility.** `SAT_FLOOR`, ease/slew rates, the mismatch notch, photosensitivity
   verification; decide whole-scene vs ground-only from the step-1 profile.
6. **Verify (§8).**

Steps 1–2 are independent of 3–4; **step 3 blocks step 4.**

---

## 8. Test / verification impact

- **Harness (`tools/bootcheck.js:110-218`).** Extend the key sweep to `'5'` and press the two
  growth buttons. Assert `H`/`_sceneSat` move the right way: drive the clock into an interglacial,
  press Grow-Warm → `H` rises; press Grow-Cold in the same interglacial → `H` falls. Mirror for a
  glacial year. This is a new, high-value assertion — the harness "has caught two bugs reading the
  code didn't."
- **Storm overuse.** Assert repeated Storm presses drive `H` down via suppressed dispersal, while a
  single press leaves `H` ~flat.
- **Plant cap.** Assert kererū dispersal never pushes `simulation.plants.length` over the cap
  (drive many dispersals against a near-full map).
- **Photosensitivity.** Assert `_sceneSat` never changes more than the slew cap per frame (no
  instantaneous jumps) — a static, cheap invariant check.
- **Reset hygiene.** Assert the new flags are cleared by the attract reset (`kiosk.js:192`) and that
  a soft reset stays inside the 10–25 ms budget (seed `H` from `getSummary`, don't recompute).
- **No allocation in `draw()`/reset.** Dispersal `new Plant` lives in `update`, cap-guarded; verify
  the reset path allocates nothing.
- **Visual pass (`node tools/serve.js`).** (1) Wrong growth button visibly drains colour, right one
  restores it. (2) Spamming Storm drains colour over ~tens of seconds; leaving it alone recovers.
  (3) The desaturation reads as "quiet/tired," never a seizure risk, and is distinguishable from the
  glacial frost.

---

## 9. Decisions

**Resolved**
- **Five buttons** — Deep Time · Grow-Warm · Grow-Cold · Storm · Eruption; kiosk input widens to
  `1`–`5`. (User direction.)
- **Health is global** — one scene-wide `H`/saturation, matching "the *overall* health of habitats"
  and the arm's-length legibility principle. (Per-region local health is richer but muddier at a
  glance and far heavier — deferred.)
- **Health is derived, not scored** — `H` reads the sim so the colour is an honest diagnostic (§1).
- **Wrong action actively harms** — desaturation on a climate-mismatched press, per the user's ask,
  realised mostly through existing dormancy/contraction plus a small authored notch for 40-s
  legibility (§2).

**Open — worth a call before coding the affected step**
1. **Saturation scope** (step 1): whole world block vs ground-only — decide from the 4K profile;
   ground-only is cheaper *and* arguably more on-brand (`34VIEW §7`).
2. **Kererū depth this pass** (step 3): ship the mechanic behind a placeholder sprite now and add
   the 5-frame flight art later (recommended), or hold the mechanic until the art lands.
3. **How hard the wrong press bites** — the mismatch notch and `SAT_FLOOR` are the main feel knobs;
   pick starting values, then tune in-browser (step 5).

---

## Sources (internal)

- `md/TEMANAWA_ECOLOGY_FAUNA.md` §3.3 — kererū the large-seed disperser; moa the seed destroyers;
  the modern collapse is a *kererū* problem. The mechanical spine of §3–4.
- `md/TEMANAWA_FAUNA.md` §167-169 — kererū the only surviving disperser of large podocarp/tawa
  fruit; "a real mechanic, not decoration."
- `md/TEMANAWA_DEEPTIME_ECOLOGY_PLAN.md` §1.1 — `winterness` == `glacialIndex(yearsBP)`; the world
  is a glacial cycle, which is what the split growth reads.
- `md/TEMANAWA_34VIEW_PLAN.md` §7 — "quiet the ground's saturation so the outlined sprites pop." The
  existing look this feature turns into a live health signal.
