# Te Manawa — Implemented Fauna (engineering reference)

**One page for the cast that is actually in the code.** What each animal *is*, how it
behaves, how it breeds, how it draws, and where it is wired into the engine. This is a
build reference, not a design authority: it reads **under** `TEMANAWA_PLAN_V2.md` (the
spine) and **defers to the code** where they differ. For the *ecological* case for each
species see `TEMANAWA_FAUNA.md` (the scored longlist) and `TEMANAWA_ECOLOGY_FAUNA.md`;
for the sprite manifest see `TEMANAWA_BUILD_V3.md` §4 / `TEMANAWA_SPRITE_BRIEF.md`.

> Governing principle (`TEMANAWA_PLAN_V2.md` §0.1): *a cartoon seen from above, not a
> survey of the Manawatū.* Every behaviour below is tuned to read at a glance, from a
> distance, in an unattended loop — not to model an ecosystem faithfully.

---

## 1. The shared fauna contract

Every animal is a subclass of **`Boid`** (`TeManawa_boid.js`) — steering, the smoothed
facing/flip, the delta-time integrator, terrain avoidance, edges. Three classes exist:

| Class | File | List it lives in | Spawned from |
|---|---|---|---|
| `Moa` | `TeManawa_moa.js` | `Simulation.moas` | `initialMoaCount` / `initialSpeciesDistribution` |
| `HaastsEagle` | `TeManawa_eagle.js` | `Simulation.eagles` | `eagleCount` |
| `Kereru` | `TeManawa_kereru.js` | `Simulation.otherEntities.kereru` | `initialEntityCounts.kereru` |

**The two-clock split (do not conflate — `CLAUDE.md`).** The update loop calls each
animal twice per frame:

```
entity.behave(sim, seasonManager, dt)   // LIFE clock: deep-time-WARPED dt
entity.update(rdt)                        // MOTION/ANIM clock: REAL frame dt
```

So aging, hunger, breeding, feeding and dispersal ride the warped clock (a 10× fast-
forward morphs the world), while walk/wingbeat cadence, facing and integration ride the
real clock (the animals never turn into a sped-up cartoon). `moas`/`eagles` get dedicated
loops (`updateMoas`/`updateEagles`); every `otherEntities` type is driven by the generic
`_updateOtherEntities` loop, which requires **`behave()` + `update()`** (and `render()`).

**Registration** (`registerAllSpecies()` in `TeManawa_species_data.js`, plus the kererū
hook in `TeManawa_sketch.js`): `REGISTRY.registerAnimalType(type, {}, Class)` then
`registerSpecies(key, type, CONFIG)`. `Simulation._createFromRegistry` builds instances;
a level's `species`/`initialEntityCounts` decide which keys actually spawn.

**Reproduction** goes through one `Egg` type (`TeManawa_egg.js`). A parent calls
`simulation.addEgg(x, y)` and tags the egg with **`offspringType`** — `'moa'` (default),
`'eagle'`, or `'kereru'`. `Simulation.updateEggs` branches on it at hatch:
`_hatchEagleEgg` / `_hatchKereruEgg` / the inline moa path. All three balance hatchling
sex toward the flock minority so small populations keep both sexes.

**Rendering** — every animal anchors on the 3/4 ground via
`Projection.groundY(pos.y, elevationAt(pos))`, drops a shadow there, then lifts the body
by an altitude (flyers) or draws at ground level (moa). All per-entity UI (bars, hearts,
state glyphs) is **debug-only**, gated on `CONFIG.showEntityUI` — an ambient diorama does
not narrate itself. **Never allocate in `behave`/`update`/`render`/resets.**

**Population caps** live in `LEVEL_MECHANICS` (`levels/level_temanawa_scaffold.js`):

| Cap | Value | Meaning |
|---|---|---|
| `maxMoaPopulation` (`config`) | 60 | hard moa ceiling |
| `maxPerSpecies` | — | per-moa-species ceiling (optional) |
| `populationFloors` | — | per-moa-species protected floor (can't be hunted/starved below it) |
| `eagleMaxPopulation` | 12 | emergent eagle ceiling |
| `kereruMaxPopulation` | 16 | kererū flock ceiling (breeding stops at it) |
| `kereruPopulationFloor` | 2 | kererū never starve below it (keeps a disperser alive) |

---

## 2. Moa — the browsers (`TeManawa_moa.js`)

The core prey loop: a full state machine — **IDLE · FORAGING · FEEDING · FLEEING ·
MIGRATING · SEEKING_MATE · MATING** — driven by hunger, eagle threat, season, and
elevation preference. Moa **browse** (they consume plants), migrate up/down with the
seasonal preferred-elevation band, and breed sexually (courtship → mating → pregnancy →
`layEgg`), gated by a security timer (time spent safe from eagles) and cooldowns. Many
opt-in refinements live behind `LEVEL_MECHANICS` (habitat stress, forest competition,
soft breeding cap, focal vs non-focal diet breadth, vulnerable-founder highlight).

**Nine species are defined** in `MOA_SPECIES` (`TeManawa_species_data.js`); the scaffold
level currently spawns only `upland_moa`. Full pool:

| key | Display | Species | size | baseSpeed | maxHunger | pref. elev. | Special |
|---|---|---|:-:|:-:|:-:|:-:|---|
| `upland_moa` | Upland Moa | *Megalapteryx didinus* | 7–9 | 0.16 | 100 | .35–.70 | cold-hardy |
| `south_island_giant_moa` | SI Giant Moa | *Dinornis robustus* | 12–16 | 0.15 | 140 | .15–.40 | `eagleResistance` .3 |
| `north_island_giant_moa` | NI Giant Moa | *Dinornis novaezealandiae* | 11–14 | 0.14 | 120 | .18–.45 | `eagleResistance` .2 |
| `eastern_moa` | Eastern Moa | *Emeus crassus* | 8–11 | 0.20 | 95 | .20–.55 | `foragingBonus` 1.2 |
| `stout_legged_moa` | Stout-legged Moa | *Euryapteryx curtus* | 7–10 | 0.18 | 90 | .12–.35 | fast `fleeSpeed` .6 |
| `heavy_footed_moa` | Heavy-footed Moa | *Pachyornis elephantopus* | 10–13 | 0.14 | 130 | .30–.44 | `eagleResistance` .15 |
| `crested_moa` | Crested Moa | *Pachyornis australis* | 9–12 | 0.21 | 105 | .25–.50 | `hasCrest` (visual) |
| `mantells_moa` | Mantell's Moa | *Pachyornis geranoides* | 9–11 | 0.19 | 110 | .18–.42 | — |
| `little_bush_moa` | Little Bush Moa | *Anomalopteryx didiformis* | 5–7 | 0.15 | 70 | .22–.48 | `camouflage` .5, `forestAffinity` .8, `spriteSet:'bush'` |

**Age & size:** juvenile → adolescent → adult (`MOA_AGE`); adult females ~10% larger
(dimorphism). **Reproduction:** female becomes pregnant on mating, lays after a
`pregnancyDuration`; the egg inherits `parentSpecies` (5% mutation chance unless
`noSpeciation`). **Death:** starvation (`hunger ≥ maxHunger`) unless the species sits at
its protected floor. **Render:** `EntitySprites.getMoaSprite(...)` with per-genus tint
baked once, or a dedicated `spriteSet` (bush moa); lateral **flip** instead of top-down
rotation (`MOA_ART_FACE_SIGN` reconciles left-facing art).

---

## 3. Eagle — the apex predator (`TeManawa_eagle.js`)

States: **patrol · hunting · resting · relocating · distracted**. It patrols a wide
circle around a home point, and above `huntThreshold` hunger it hunts the nearest moa
(with prey prediction, camouflage/shelter/resistance checks, a catch radius, and a
`STORM`-placeable distraction that breaks off a hunt — the moa reprieve). After a kill it
rests at its nest. Flight **altitude** eases: it cruises aloft and drops to the deck to
dive or rest, so a swoop reads as a real descent at 3/4.

**Two population models:**
- **Top-down (default):** `regulateEagles` tracks eagle numbers to the moa population by
  season (`eaglePreyCoupling`).
- **Emergent (`LEVEL_MECHANICS.emergentEagles`):** each bird holds a fixed nest, feeds or
  **starves** on its own energy budget, and breeds sexually — a mature, well-fed female
  with a mate inside `eagleMateRadius` lays an egg (`offspringType:'eagle'`) at a
  probability pulled toward a target **eagle:moa ratio**. Includes Lotka-Volterra hunting
  restraint (surplus predators tolerate more hunger than they crop the last prey), a
  scarce-prey penalty that spares rare species, prey-following relocation, and pair bonds.

Config in `EAGLE_SPECIES` (`haasts_eagle`, `young_haasts_eagle`): `baseSpeed` 0.4,
`huntSpeed` 1.2, `huntRadius` 130, `catchRadius` 12, `maxHunger` 100, `restDuration` 180.

> ⚠ **Known identity caveat (do not cement — pre-Phase-7).** The apex predator is
> conflated three ways: the class/label is **Haast's eagle** (`scientificName
> "Hieraaetus moorei"`), the notifications call it **"Pouākai"**, and the art lives in
> `sprites/EylesHarrier/`. The *intended* Manawatū apex (per `TEMANAWA_FAUNA.md` §1.2/§3
> and `TEMANAWA_PEDAGOGY.md`) is **Eyles' harrier** *Circus teauteensis* — Haast's eagle
> was South Island only. The engineering is sound; the **identity needs reconciling** in
> data, text and art before Phase 7. Tracked in project memory (`raptor-identity-conflation`).

---

## 4. Kererū — the large-seed disperser (`TeManawa_kereru.js`)

*Hemiphaga novaeseelandiae.* The one bird large enough to swallow and pass big
podocarp/tawa fruit, so **the forest only recruits where kererū go** (moa were seed
*destroyers*, not dispersers). This is the only runtime path that grows the plant
population, and it is what couples the `STORM` button to the forest's health.

**The frugivore loop** — a different animal to watch than the eagle: **short** flights
between trees, and a lot of **perching**.

```
FLYING (hungry, crop == 0) ── find a fruiting FOREST tree, short hop to it
      └─> FEEDING (perched)  fill the crop with fruit — the tree is NOT consumed
      └─> PERCHED            digest a beat; a ready female may lay here
      └─> FLYING (full)      short hops away, DROPPING one seed per leg
                             (Simulation.disperseSeed → a new forest seedling, AWAY
                              from the parent) — perching between hops
      └─> crop empty ──────> hungry again, back to the top
SHELTER  a live storm grounds it: hunker low, no feeding / dispersal / laying
```

The point of the loop: **dispersal is earned by eating**, and it happens *away* from the
source tree — the ecological service. Because feeding needs a fruiting **warm/large-
fruited** tree (`coldTolerance ≤ TM_GROW.warmMax`, the same set `disperseSeed` recruits),
the whole loop follows the climate for free: abundant in the forested interglacial,
thinning in the glacial when the canopy contracts and the birds can't feed.

**A dropped seed only establishes where the canopy is sparse.** `disperseSeed` runs a
**density gate** — a candidate site is skipped if it already holds `disperseDensityMax`
live plants within `disperseDensityRadius` (defaults 3 / 26 px). With `cropCapacity` now
**1**, a kererū stops carrying almost immediately after feeding (one drop, then it feeds
again), so the two together keep the forest from being carpeted with seedlings.

**State machine:** `KERERU_STATE` = `FLYING · FEEDING · PERCHED · SHELTER`. Flight legs
are short by construction — it only ever seeks a nearby tree (`feedRadius`) or a short hop
(`hopRadius`), never the eagle's map-wide patrol/relocate.

**Reproduction** (emergent, sexual — mirrors the eagle): a **mature, well-fed** (carrying
fruit) female that is perched, off cooldown, below `kereruMaxPopulation`, with a mature
mate inside `mateRadius`, lays a kererū egg (`offspringType:'kereru'`). Aggregation at
shared fruiting trees provides the pairing opportunity. `Simulation._hatchKereruEgg` adds
a juvenile to the flock (minority-sex balanced).

**Survival / population ebb:** hunger climbs on the life clock and is paid back by
feeding; sustained max-hunger kills — but **never below `kereruPopulationFloor`**, so a
long glacial thins the flock without ever stranding the forest with no disperser (the
recruitment term keys off kererū being *alive*, not actively dispersing).

**Key config** (`KERERU_SPECIES`, all times in seconds → frames in the class):

| field | val | field | val |
|---|:-:|---|:-:|
| `baseSpeed` | 0.6 | `cropCapacity` | 1 |
| `size` | 6 | `feedSec` | 5 |
| `cruiseAlt` / `perchAlt` | 24 / 5 | `disperseEverySec` | 5 |
| `hopRadius` | 50 | `restSec` | 4 |
| `feedRadius` | 100 | `maturitySec` | 20 |
| `maxHunger` | 100 | `eggCooldownSec` | 35 |
| `starveSec` | 18 | `mateRadius` | 200 |

**Render:** `sprites/kereru0.png` (`EntitySprites.getKereruSprite`) — a single
placeholder frame that faces up-and-right, mirrored via the eased lateral flip for
leftward travel; falls back to a drawn glyph (green-grey back, pale breast) if the image
fails to load. Juveniles draw smaller, altitude eases so take-off/landing never pops.
Drawn in the flyer layer (above the ground plane, with the eagles). Debug-only pips show
carried fruit + sex/juvenile. The full 5-frame flight + perched set drops in later
(`TEMANAWA_SPRITE_BRIEF.md`).

**Coupling to habitat health** (`Game._updateHabitatHealth`, `TeManawa_sketch.js`): in a
non-glacial, **zero live kererū drains recruitment** → the scene desaturates; a storm
grounds the flock and pauses dispersal (overuse stalls recruitment — the `STORM` cost).
See `TEMANAWA_INTERACTION_HEALTH_PLAN.md` §3–4.

---

## 5. Integration cheat-sheet

| Concern | Where |
|---|---|
| Class + config | `TeManawa_{moa,eagle,kereru}.js`; `MOA_SPECIES`/`EAGLE_SPECIES`/`KERERU_SPECIES` |
| Registration | `registerAllSpecies()` (`species_data.js`); kererū in `sketch.js` `registerAnimalType/registerSpecies` |
| Spawn | `Simulation.init` → `spawnMoas` / `spawnEagles` / `_spawnOtherEntities` (from level `initialEntityCounts`) |
| Update | `_updateOtherEntities` (kererū); `updateMoas` / `updateEagles` |
| Reproduction | `Egg.offspringType` → `updateEggs` → `_hatchEagleEgg` / `_hatchKereruEgg` / moa inline |
| Seed dispersal | `Simulation.disperseSeed` (cap-guarded; the only runtime plant growth) |
| Caps / tuning | `LEVEL_MECHANICS` in `levels/level_temanawa_scaffold.js` |
| Render order | `Simulation.render` — moa depth-sorted into the ground layer; eagles + kererū in the flyer layer |
| Test harness | `tools/bootcheck.js` (kererū + dispersal section asserts the contract) |

---

## 6. Open items

- **Art.** All three still use placeholder/partial art; the Phase 5 manifest is
  ~113 new assets (`TEMANAWA_BUILD_V3.md` §4 / `TEMANAWA_SPRITE_BRIEF.md`).
- **Raptor identity** — reconcile Haast's/Pouākai/Eyles' harrier (§3 caveat).
- **Moa roster** — the scaffold spawns only `upland_moa`; the other eight species are
  defined but not yet placed in a level distribution.
- **Kererū flocking** — no explicit cohesion; the flock aggregates only via the shared
  fruiting-tree resource. Add gentle cohesion if a tighter flock read is wanted.
