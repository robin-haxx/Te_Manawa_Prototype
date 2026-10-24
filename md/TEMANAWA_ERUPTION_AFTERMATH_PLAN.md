# Te Manawa — Eruption Aftermath Plan (post-supereruption regrowth)

Build plan for making what happens **after** each of the four TVZ supereruptions match the
evidence. It builds on the eruption system already in place (`TEMANAWA_DEEPTIME_ECOLOGY_PLAN.md`
§2, `TEMANAWA_PLAN_V3.md` §8–9) and the research it already drew on
(`TEMANAWA_ECOLOGY_WETLAND.md` §6, `TEMANAWA_ECOLOGY_LOWLAND.md` §4, `TEMANAWA_ECOLOGY_OPEN.md` §3.3).

> **Governing principle, unchanged:** *a cartoon seen from above, not a survey.* Every change
> below has to read at arm's length. The research mostly makes the aftermath **more watchable**,
> not less: trees standing bare instead of vanishing, the ranges greening before the flats, a rust
> flush of bracken, then a young forest growing outward from the survivors.

Evidence tags used throughout: **[measured]** is a TVZ record or deposit. **[analogue]** comes
from another volcano. **[inference]** is scaled or estimated by us and must be labelled that way
in any visitor copy.

---

## 0. Summary

**What is wrong today**

1. **The ash never clears while the geology clock is paused, and paused is the default.**
   `updateAshCover()` (`TeManawa_sketch.js:1443`) decays ash by sim-years elapsed
   (`_ashFromYear − yearsBP`). Since the second-screen overhaul, `yearsBP` only moves during a
   boost timelapse or a deep burst. Measured headless (§1.2): after ~60 s of frames, ash is still
   `1.000`, health `0`, scene saturation pinned at the `0.35` floor. The idle attract reset lands
   on the previous eruption (`TeManawa_kiosk.js:241`), so **11 of every 12 idle resets leave the
   unattended wall grey and desaturated until a visitor boosts.**
2. **The time scale is about 100× too slow.** Ash takes 6,000 / 18,000 / 35,000 sim-years to clear
   (`DeepTime.TIERS`). The records say canopy defoliation lasts **under 10 years** and revegetation
   is **complete within ~200 years, even on ignimbrite** (§2.4).
3. **The kill model is inverted for the fall zone.** It kills trees and spares grass: a uniform
   random roll on a per-species `ashVulnerability` (tawa 0.8, tree fern 0.95, tussock 0.25).
   At the Manawatū's distance from the vents, ash **defoliates** the canopy and **buries** what
   is shorter than it. Tree death needs tens of centimetres (§2.1–2.2). Ōruanui currently kills
   ~57% of tawa and ~49% of tōtara. The evidence suggests about 8% for a ~10 cm fall.
4. **The same species regrows in the same spot.** A killed plant respawns in place as itself.
   There is no pioneer stage, no podocarp cohort and no spread outward from survivors, which
   are the three most documented features of post-eruption recovery (§2.5–2.6).
5. **The ash is spatially uniform.** One grey rectangle over the whole map. In reality thickness
   falls off away from the source, slopes shed ash within years and valley floors collect it
   (§2.7).

**What the build does.** It turns each eruption into a staged **aftermath** that plays as a
roughly one-minute zoom into the century after, using five beats the evidence supports:

| Beat | Aftermath years | On screen |
|---|---|---|
| **Fall** | 0 | Ash blankets the land, heaviest in the north. Low cover is buried. |
| **Bare canopy** | 0 → ~10 | Surviving trees stand **bare (defoliated), not dead**. Light reaches the floor. |
| **Flush** | ~1 → ~30 | The ranges shed their ash first and the flats stay grey. A rust-green **bracken** flush follows, then pioneer scrub (mānuka, tutu) on the killed ground. Swamps bloom and the rivers run grey. |
| **Cohort** | ~20 → ~100 | An even-aged cohort of young **tōtara / kahikatea** rises, spreading outward from surviving stands. |
| **Converge** | → ~200 | The forest *type* is back, as the habitat dictates, but the individual stands are re-dealt. |

---

## 1. What exists today

### 1.1 The pipeline

| Piece | Where | Behaviour |
|---|---|---|
| Event table | `DeepTime.ERUPTIONS`, `DeepTime.TIERS` (`TeManawa_time.js:32`, `:182`) | 4 events; tier sets `clearFraction` 0.35/0.75/0.95 and `decayYears` 6k/18k/35k |
| Kill | `Game.applyAsh` (`TeManawa_sketch.js:1342`) | `P(kill) = clearFraction × ashVulnerability`, wetland × `wetlandAshSpare` 0.25, survivor floor `eruptionPlantFloor` 0.15 |
| Ash decay | `Game.updateAshCover` (`:1443`) | Linear in **sim-years** elapsed |
| Ground look | ash wash (`:1959`) | One warm-grey rect, alpha `105 × ashCover` |
| Health | `_updateHabitatHealth` (`:1672`) | `(1 − ashCover) × regimeFit × recruitment` → saturation |
| Regrowth | `Plant.handleGrowth` (`TeManawa_plant.js:488`) | Dead plant re-sprouts **as the same type, in place**, after `growthTime / seasonalModifier` |
| Wetland bloom | `Simulation.bloomWetland` (`TeManawa_simulation.js:736`) | 20 swamp seedlings + warp, **at t = 0** |
| Sediment pulse | `Simulation.recruitKahikatea` (`:778`) | 8 kahikatea + flood warp, **at t = 0** |
| Warp clock | `disturb` / `warpAt` / `updateDisturbance` (`:693–729`) | Real-time decay, ~2.2 s. This is the right pattern for a visible beat. |

### 1.2 Measured (headless probe, current HEAD)

Probe: the harness boot from `tools/bootcheck.js`, then `applyEruptionAt` for each event, then
3,600 frames with the clock paused.

| Event (tier) | Killed / total, selected types | Ash after ~60 s | Saturation | Still dead after ~60 s |
|---|---|---|---|---|
| Whakamaru (catastrophic) | tawa 65/89 · tree fern 59/67 · tōtara 41/60 · beech 16/32 · tussock 5/43 · sedge 0/5 | **1.000** | 0.35 (floor) | 247 / 604 |
| Ōruanui (major) | tawa 45/79 · tōtara 32/65 · tree fern 32/44 · tussock 6/29 · coprosma 4/26 | **1.000** | 0.35 | 222 / 546 |
| Kaukatea (minor) | tōtara 2/7 · nīkau 7/29 · coprosma 6/40 · tussock 2/41 | **1.000** | 0.35 | 12 / 331 |

The Ōruanui run reached the end of the window, so the end-of-window attract fired and seeked
back to Whakamaru, which re-armed the ash. That is the idle loop the wall runs all day.

Plants do regrow on the life clock while the ground stays grey. The scene ends up green sprites
on an ashen, desaturated ground indefinitely.

---

## 2. What the research says

### 2.1 Thickness decides almost everything, relative to plant height

- **Thresholds** (global review of forest-plant responses to tephra fall): measurable community
  change at **~2 cm**, loss of some plant groups at **10–25 cm**, significant **tree death above
  ~100 cm**. Even thin falls kill canopy epiphytes. **[analogue]**
- **Stature is the multiplier.** Impacts are much less obvious where tephra depth is less than
  plant height (33-year Mount St Helens study). At Mount St Helens, 15 cm of tephra
  "almost destroyed" the understory; 4.5 cm mainly hit low evergreen herbs and mosses. **[analogue]**
- **Canopy kill vs depth** (Chilean *Nothofagus* forest after Puyehue–Cordón Caulle 2011,
  Swanson et al. 2016): **~8% of stems killed by 10 cm, ~54% by 50 cm**. NZ beech (*Fuscospora*)
  was until recently classified in *Nothofagus*, so this analogue suits the Manawatū better than
  most. **[analogue]**
  - **Treat the curve as a floor for NZ.** The thickest plots were dominated by deciduous
    *N. pumilio*, which was leafless when the ash fell. The **evergreen *N. dombeyi* died far more**.
    Every NZ canopy tree is evergreen, so a held crown takes the full ash load. Tree size and
    re-sprouting ability also mattered.
- Pasture survival is severely limited **above ~100–150 mm**. **[analogue]**

### 2.2 Distal ash defoliates the canopy; it does not fell it

Ōruanui at Onepoto, ~240 km from source under an intact **3 cm** tephra layer: the dominant canopy
(*Fuscospora*) declines while **grasses, herbs, ferns and shrubs increase**. This is a **brief
part-defoliation** that lets light reach the floor. Piva's thesis puts it at **< 10 years**.
**[measured]**

> **Correction to `ECOLOGY_WETLAND.md` §6.** That section says wetland and aquatic plants
> increased for "**about 60 years**" after Ōruanui, citing Piva et al. 2023. The abstract and
> Piva's thesis, which are what could be reached, confirm only the **< 10 yr** defoliation and the
> grass/herb/fern/shrub rise. Neither mentions a 60-year wetland phase. **Check the full text
> before relying on the 60-year figure.** The wetland bloom itself is still well supported by
> the peat-fertility evidence in the same section.

### 2.3 How much fell on the Manawatū, event by event

The Manawatū sits ~175–220 km SSW of the calderas, off the **top (north) edge** of the map.

| Event | Fall on the Manawatū | Evidence | Implication |
|---|---|---|---|
| **Kidnappers** ~1 Ma (Mangakino) | Heavy, but the land was mostly **sea** | Large phreatomagmatic fall, then **the most widespread ignimbrite on Earth (> 45,000 km²)**. Reworked pumice over-thickened the Kaimatira Pumice Sand, and drainage networks shed "vast quantities of reworked pyroclastic debris" into the Whanganui Basin. **[measured]** Whether the ignimbrite reached the map is **unresolved**. | Little standing cover to clear. The real beat is **pumice and sediment building the coast**. |
| **Kaukatea** ~0.9 Ma | A dusting | Small and under-characterised **[inference]** | Ground-layer only. Nothing dies. |
| **Whakamaru / Rangitawa** ~349 ka | **Tens of cm** | Fall mainly to the **SE**, up to **~70 cm at ~200 km** (Wikipedia, citing Matthews et al. 2012; not verified against the primary). ~0.5 m near Hamilton. **[measured, distal]** | The **only** event in the tree-death range. Half or more of the canopy is plausible in the north of the frame. |
| **Ōruanui** ~25.5 ka | **~10 cm** | "About 10 cm blanketed the rest of the North Island". At Aokautere it is a "**thin white layer**" (Te Ara). **[measured]** | A **defoliation** event in the Manawatū: ~8% canopy kill, open LGM grass and scrub mostly resprouts. |

**Re-ranked by what happened *here*:** Whakamaru ≫ Kidnappers (on its little land) > Ōruanui >
Kaukatea. Today Ōruanui and Kidnappers share the `major` tier, and Ōruanui is over-killed by
roughly 6× on the canopy.

### 2.4 Recovery is measured in years and centuries, not millennia

- **Taupō 232 CE:** revegetation **complete within ~200 years, even where the ignimbrite buried
  the land**. Forest up to 170 km east was damaged to varying degrees by ashfall. **[measured]**
  (Wilmshurst & McGlone 1996)
- **Tarawera 1886** (primary succession on metres of fresh scoria): after **~10 years** of bare
  ground, toetoe, bracken and tree tutu appear. At **~30 years** there was young forest on the lower
  slopes. Kāmahi forest covered them by the 1990s. **[measured]**
- **Ōruanui at 240 km:** canopy recovers in **< 10 years**. **[measured]**

So `decayYears` of 6,000–35,000 is 30–175× too long. **Recovery time scales with thickness, and
~200 years is the ceiling even for the worst case.**

### 2.5 The order things come back in

1. **Bracken (*Pteridium esculentum*) and other seral taxa flourish immediately** (Taupō).
   **[measured]**
2. **Tree tutu (*Coriaria arborea*)**, a nitrogen-fixing shrub, is the textbook NZ pioneer on
   fresh volcanic ground. It acts as a nurse plant that builds soil and the seed bank, alongside
   toetoe and mānuka/kānuka (Tarawera, Clarkson). **[measured]**
3. **Podocarps recruit as a pulse after big disturbance.** That produces Ogden & Stewart's
   even-aged "lozenge" cohort, and **tōtara and kahikatea have the strongest height response to
   light** (`ECOLOGY_LOWLAND.md` §4, Ebbett & Ogden 1998). **[measured]**
4. **Shade-tolerant broadleaf (tawa, kāmahi)** follows and becomes the long-run canopy.
   **[measured]**

### 2.6 Survivors drive the recovery

Mount St Helens produced the **biological legacy** concept. Survivors of the disturbance act as
**nuclei for recolonisation**, survivor "hotspots" coalesce into larger patches, and recovery is
**highly variable and spatially heterogeneous**. Snow-covered understory survived and seeded the
recovery. **[analogue]** Damage after Taupō likewise **varied with ashfall thickness, local
topography and the vigour of the forest**. **[measured]**

### 2.7 Slopes shed the ash; valleys and rivers inherit it

Landscapes hit by explosive volcanism have some of the highest sediment yields on Earth.
Tephra strips off steep slopes within years, rivers aggrade, and drainage reorganises:
Ōruanui reorganised Waikato drainage (Manville & Wilson 2004). After Mount St Helens the Sandy
River bed rose **≥ 23 m within a decade**. **[measured + analogue]** That is the stage-5
"sediment pulse" in `ECOLOGY_WETLAND.md` §6. It belongs in the **first few decades**, not at t = 0.

### 2.8 Same habitat, re-dealt stands

The post-Taupō forests **resembled the pre-eruption ones** at the regional pollen scale
(Wilmshurst & McGlone). At the stand scale the buried Pureora forest (rimu-dominant, with tānekaha)
differs from the modern forest beside it, which has more tawa, kāmahi and māhoe. **[measured]**
This reconciles the wetland doc's "the forest that grows back is not the forest that left": **the
habitat decides the forest type, and the eruption re-deals which tree stands where.**

### 2.9 Fire

Fire burned **during the Taupō eruption and for decades after**. **[measured]** It is the only
pre-human fire worth modelling, and it belongs inside the eruption (`ECOLOGY_OPEN.md` §3.3). It is
strongest near the vent, so it is optional here (§3.9).

### 2.10 Fauna

- **Brown kiwi** (a founded species here): genomic and spatial modelling (Bemmels et al. 2022,
  *Current Biology*) finds the Taupō eruptions **killed most birds, isolated the survivors and
  restructured the species' genetics**, which persists today. Kiwi are low-dispersal forest-floor
  foragers, so they are hit hardest and return slowest. **[measured]**
- **Grazers:** ash buries and coats forage. Even 2 mm of fluoride-rich Ruapehu ash killed 2,000+
  ewes on short pasture in 1995. **[analogue]** Food loss and displacement are modelled. Fluorosis
  is not, because it is invisible from above.
- **Flighted birds** are mobile: they leave and return. Kererū are also the seed vector back into
  the gaps, and the existing density-gated dispersal already favours sparse ground.

### 2.11 No long volcanic winter

Even Toba's volcanic winter is now argued to have been **mild and short (years)**, with no
ecosystem disruption in the Lake Malawi record. Piva notes a possible short volcanogenic cooling
after Ōruanui that cannot be separated from the ash effects. **[analogue]** **Do not model a
multi-millennial cold.** The glacial clock already carries the climate.

---

## 3. The build

### 3.1 One new clock: aftermath years

Each eruption opens an **aftermath** with its own clock, measured in **years after the eruption**:

```
aftermathYears = max( realYears, deepYears )
  realYears += (real dt / fps) × AFTERMATH.yrPerSec     // the zoom-in: ~4 yr/s → 200 yr ≈ 50 s
  deepYears  = ashFromYear − DeepTime.yearsBP           // a boost timelapse jumps straight to the end
```

- With geology **paused** (the default), the century after plays out on real time as a visible
  ~1-minute beat. **This alone fixes the stuck-grey bug.**
- When a **boost timelapse** runs (500–5,000 yr/s), `deepYears` overtakes and the aftermath
  completes almost at once. That is correct, since thousands of years later the land has long
  recovered. Slew the ground-wash alpha so this jump still ramps for at least 500 ms
  (photosensitivity).
- It follows the existing **warp clock** pattern: a disturbance that must be *seen* decays on the
  life/real clock, not on `yearsBP`.

### 3.2 A pure tephra module

**`TeManawa_tephra.js`** is p5-free like `climate.js`, `projection.js` and `goals.js`, so the
harness can assert it directly:

```
Tephra.thicknessAt(ev, u, v, slope)   // cm at normalised map point (u,v), v = 0 at the north edge
Tephra.canopyKill(cm)                 // logistic through (10 cm, 0.08) and (50 cm, 0.54)
Tephra.burial(cm, statureCm)          // 0 untouched … 1 buried, by cm / height
Tephra.stageAt(years, ev)             // 'fall' | 'bare' | 'flush' | 'cohort' | 'converge' | 'done'
Tephra.groundLoad(years, ev, slope)   // ash left on the ground: steep slopes shed fast, flats slow
```

- **`thicknessAt`** = `ev.ashCm` × a **north→south gradient** (≈1.3× at the north edge → 0.7× at the
  south, as a knob) × low-frequency per-run noise. Steep cells hold less from the start. A cartoon
  of an isopach map, but enough to give the spatial heterogeneity §2.6 says matters.
- **`canopyKill`** with those anchors works out to `1 / (1 + exp(−(cm − 47.5) / 15.4))`. That gives
  ~6% at 5 cm, ~8% at 10 cm, ~54% at 50 cm, ~81% at 70 cm and ~97% at 100 cm.
- Load order: anywhere before `sketch.js` (it reads nothing global). `bootcheck` derives the order
  from `index.html`.

### 3.3 Per-event data (replaces `TIERS`)

Extend `DeepTime.ERUPTIONS` (one table, never inline). Keep `tier` as a label if anything reads it.

| Event | `ashCm` | `recoverYears` | Extra |
|---|---|---|---|
| Kidnappers | 50 | 150 | `pumiceCoast: true`. Heavy on the little land, and the beat is the coast (§3.8) |
| Kaukatea | 3 | 20 | — |
| Whakamaru | 45 (→ ~58 north / ~31 south) | 200 | `fire: true` if §3.9 is taken |
| Ōruanui | 10 | 80 | Terminal. Its aftermath only shows if the wrap rule changes |

Every number here is **[inference]** built on §2.3. Label them in code as estimates.

### 3.4 Stature-based response (replaces `ashVulnerability`)

Add to `PLANT_TYPES`: **`statureCm`** (nominal height), **`resprout`** (re-shoots from base
or rootstock) and **`seral`** (pioneer).

| Class | Types (statureCm) | Response at the plant's local `cm` |
|---|---|---|
| Low | patotara 20, speargrass 40, tussock 60, wharariki 80 | `burial ≥ 0.5` → killed. A resprouter (tussock, wharariki) becomes rootstock and re-shoots in the flush. Below that, the growth knock scales with burial. |
| Tall herb / swamp | sedge 100, flax 150 | Wetland stays spared (`wetlandAshSpare`, §6). Flax is knocked back and resprouts. |
| Shrub | coprosma 150, dracophyllum 200, mānuka 300, kawakawa 300, lancewood 400 | Broken (a growth knock) at moderate cm. Killed only when `burial ≥ 0.3`. |
| Sub-canopy | tree fern 500, nīkau 600, cabbage tree 600, kōwhai 800 | `canopyKill(cm × 1.3)`, since crowns load and snap. Survivors go bare. |
| Canopy | beech, tōtara, tawa, kahikatea (2000+) | `canopyKill(cm)`. **Survivors are defoliated** (§3.5). |

At Ōruanui's ~10 cm this gives few deaths, bare canopy and a buried ground layer. That ground
layer is mostly **palette colour, not entities** (`PLAN_V3.md` §4), so the ground wash carries it
(§3.6). At Whakamaru the north of the frame loses most of its forest while the south stands bare.
Keep `eruptionPlantFloor`.

### 3.5 Defoliation, the "bare canopy" beat

A surviving tree or sub-canopy plant gets `_bareUntil` (in aftermath years). That is
**3 + cm/10 years, capped at 10** (§2.2), jittered per tree so re-leafing ripples rather than
snapping. While bare:

- It draws with the **dormant dim** at its **full size**, not `goDormant()`'s growth crash. Most
  canopy art is `sizeOnly` with no `Dormant` frame, so the dim is the stand-in. **Art ask:** a
  bare / ash-laden frame per canopy type (tōtara, tawa, beech, kahikatea, kōwhai).
- `nutrition = 0`, so there is no fruit. Kererū move to canopy that still has fruit, the
  "flyers vacate" response, without new code.
- Re-leafing is aftermath-clocked, not climate-clocked, so `handleDormancy`'s random wake must not
  release it early.

### 3.6 The ground: ash → bracken, slopes first

Replace the single grey rect with a **low-resolution mask** (~128², one reused `ImageData`):

- **Built once at the eruption.** For each mask cell, store its thickness and a **clear time**:
  steep slopes clear in a few years, flats in decades, valley floors last (§2.7). Splat
  **projected** positions (`Projection.worldToScreen` with relief lift) so the mask sits on the 3/4
  relief, not offset from it. This is an eruption-time cost, never per frame.
- **Updated every N frames** by a threshold sweep over 16k bytes (no allocation), then **one
  `drawImage`** scaled up with smoothing. The result is a soft, blotchy blanket that peels off the
  ranges first.
- **Colour runs by stage:** ash grey (fall) → **bracken rust-green** where the ash has cleared
  but the canopy hasn't closed (flush) → fades as shrubs and canopy return. The bracken flush is a
  ground colour, per the palette rule.
- Keep frost drawn **over** the ash (the existing ordering), so the glacial cue survives.
- **Health:** the ash term becomes `1 − groundLoad`, so saturation recovers in step with the
  visible regrowth.

### 3.7 Re-sort and legacies: the forest comes back re-dealt

**Retype on regrowth, not a respawn.** When a killed plant's regrowth timer fires, it can come back
as a **successor** rather than as itself. This uses a `Plant.retype(type)` that resets the
def-derived fields from a per-type RGB/stat cache built at `setup()`. The plant count is unchanged,
so the cap is respected and nothing is allocated.

| Stage (aftermath yrs) | What a killed site comes back as |
|---|---|
| Flush (~1–30) | **Pioneer** from the biome's palette: mānuka, coprosma, tussock. Cabbage tree on wet ground. **Tutu** if added (decision 4). |
| Cohort (~20–100) | In podocarp and montane ground, a fraction of the pioneers retype to **tōtara** in **one synchronous batch**: same growth start, same size, the visible lozenge. Kahikatea on the wetland comes through the existing sediment-pulse recruit, now timed here. |
| Converge (→ `recoverYears`) | Remaining pioneers in forest biomes retype to the **biome's canopy palette** (tawa and the rest). The habitat decides the type; the positions are re-dealt (§2.8). |

- **Legacy weighting** (§2.6): at the eruption, each killed plant records the share of
  **survivors** within a radius (one `getNearbyPlants` pass, eruption-time only). Regrowth speed
  scales with it, so recovery spreads **outward from surviving stands** and the worst-hit patches
  stay open longest.
- **Climate still rules.** In a glacial, the forest band suppresses the cohort outside the band,
  so pioneers persist as shrubland. That is the correct LGM picture, and it falls out of the
  existing die-back. Beech's `COLD_REFUGE` exemption stays.

### 3.8 Staged release of what exists

The bloom, the kahikatea pulse and the water response stay. Each moves to its stage:

- **`bloomWetland`** fires across the flush stage (~0–30 yr) instead of all at t = 0.
- **`recruitKahikatea`** (the sediment pulse) fires in the flush and cohort stages (~5–60 yr),
  when the rivers are aggrading.
- **Rivers run turbid:** a grey tint on the water layer's river decals during the pulse.
  **Swimmers thinned** in the early aftermath, then they return. Cheap, optional, and ash-driven
  fish kills are reported widely but not checked for this plan.
- **Kidnappers' coast beat (optional):** a pumice-raft decal drifting on the sea and a pale
  pumice tint on the beach, standing for the reworked pumice that over-thickened the Kaimatira
  Pumice Sand. "This eruption built land." No new mechanic, decals only.

### 3.9 Fauna

- **Grazers** treat cells above an ash threshold as barren during the bare stage, reusing
  `grazerAvoidBarrenGround` with an `ashAt(x,y)` term. They drift south and upslope onto
  lighter-ash ground and return as the flush greens. No direct deaths. Hunger does the rest, and
  floors still hold.
- **Kiwi** get the biggest knock and the slowest return: forest-floor litter is buried, so heavy
  ash raises kiwi hunger locally. There is no immigration, so only survivors breed back. The
  species floor still guarantees ≥ 2 (§2.10).
- **Flyers** need nothing new. Bare trees carry no fruit, so they forage elsewhere, and their
  density-gated dispersal then reseeds the gaps. **Verify** this emerges; don't build it.
- **Fire (optional, Whakamaru only):** a charcoal ground tint in the bare stage and a few charred
  snags. No flame FX (photosensitivity). Decision 5.

### 3.10 Not doing

- **A long volcanic winter** (§2.11).
- **Fluorosis or direct ash deaths** for animals. They are invisible from above, and the
  starvation and displacement effects carry the idea.
- **Per-cell `Float32` fields** (`BUILD_V3.md` §2.2). This plan stays with the event list, one
  low-res mask and analytic `Tephra` queries.

---

## 4. Build order

Each step leaves the kiosk shippable and harness-green. Run `node tools/bootcheck.js` after each.

| # | Step | Size | Notes |
|---|---|---|---|
| **0** | **Aftermath clock** (§3.1) | Small | `max(realYears, deepYears)` replaces the sim-year decay. Ash and health now recover while paused. **Fixes the stuck-grey kiosk on its own. Do this first even if nothing else lands.** Add a `MISTAKES.md` entry: a decay keyed to `yearsBP` stalls when geology is paused. |
| 1 | **Tephra module + data** (§3.2–3.3) | Small | Pure functions, `ERUPTIONS` fields, `PLANT_TYPES.statureCm/resprout/seral`. No behaviour change until step 2. |
| 2 | **Stature response + defoliation** (§3.4–3.5) | Medium | Rewrite the `applyAsh` kill. `_bareUntil` and its render. Retire `ashVulnerability`. |
| 3 | **Stage scheduler + staged release** (§3.8) | Small | Bloom and kahikatea move onto stages. Turbid rivers and thinned swimmers. |
| 4 | **Ground mask, ash → bracken** (§3.6) | Medium | Projected splat, threshold sweep, one `drawImage`. Health reads `groundLoad`. Confirm alignment in-browser. |
| 5 | **Re-sort + legacies + cohort** (§3.7) | Medium | `Plant.retype`, legacy weighting, synchronous tōtara batch, convergence. |
| 6 | **Fauna** (§3.9) | Small | Ash-barren grazers, kiwi knock. Verify the flyer response. |
| 7 | **Optional beats** | Small | Kidnappers pumice coast, Whakamaru charcoal, tutu (needs art). |
| 8 | **Docs** | — | Fix `ECOLOGY_WETLAND.md` §6 (the 60-yr check, defoliate-not-kill). Update the `DEEPTIME_ECOLOGY_PLAN.md` §2 table (thickness, re-rank, `TIERS` retired), `PLAN_V3.md` §8 and `BUILD_V3.md` §2.5. |

---

## 5. Harness checks to add (`tools/bootcheck.js`, new section "eruption aftermath")

1. **Paused-clock recovery (the regression):** `applyEruptionAt(349000)`, then N frames with no
   timelapse. Ash and the ground load fall, and health rises above its floor, within the
   configured real-time window.
2. **Timelapse completes it:** with an aftermath under way, `beginTimelapse` past `recoverYears`
   leaves the stage at `done`.
3. **`Tephra` facts:** `canopyKill(10) ≈ 0.08`, `canopyKill(50) ≈ 0.54`. Monotone in cm. Thickness
   is higher at the north edge than the south. `groundLoad` clears steep before flat.
4. **Defoliate, not fell:** an Ōruanui-scale event kills **< 15%** of canopy trees and leaves
   **> 50%** of survivors bare. A Whakamaru-scale event kills more canopy than Ōruanui, and more in
   the north half than the south.
5. **Re-sort:** killed forest sites first regrow as `seral` types. By `recoverYears`, forest-biome
   plants are back to the biome palette. A tōtara cohort of ≥ K plants appears with a tight
   growth spread.
6. **Kiwi floor:** after Whakamaru, kiwi dip but never drop below the floor, and they recover.
7. **No allocation in the frame path:** the mask buffer and `ImageData` identity are stable
   across frames (the same idea as the existing buffer-identity checks).

---

## 6. Budgets and constraints

- **No allocation in `draw()` or a reset.** The mask `ImageData`, per-type stat cache and stage
  scheduler are built once at `setup()` or at the eruption. `retype` reuses the plant.
- **Eruption-time work is bounded:** one survivor-count pass (~900 plants × small neighbourhoods)
  and one mask splat. Both are dwarfed by the ~1.2 s terrain morph already on that path.
- **Photosensitivity:** every whole-scene change (ground wash, saturation, a boost jumping an
  aftermath to its end) ramps over at least 500 ms with at most 3 luminance transitions per second.
  The mask sweep moves gradually by construction.
- **`createGraphics` buffers are `remove()`d** if the mask uses one. A plain canvas or
  `ImageData` avoids the question.
- **Modulate on the instance:** aftermath state lives on `Game`, and knobs live in
  `LEVEL_MECHANICS.AFTERMATH`. Nothing writes back to `CONFIG`.
- **The ground look stays authored in `levelDef.biomes`.** The bracken and ash colours are
  aftermath FX knobs, not a second biome table.

---

## 7. Decisions for you

1. **Aftermath pace.** ~4 yr/s makes 200 years ≈ 50 s and Ōruanui's 80 years ≈ 20 s. Faster
   (more action) or slower (more ambient)?
2. **A visitor "years after" readout?** For example a small "**60 years after Whakamaru**" under
   the year line. It is the most direct way to teach "it came back within two centuries", but it
   adds HUD text. The alternative is to keep it debug-only.
3. **Ōruanui gets milder.** In the Manawatū it was a ~10 cm defoliating fall, not a forest
   clearing. Its terminal beat becomes "the trees go bare" rather than "the forest dies". Accept
   that, or keep a heavier closing beat as an acknowledged dramatisation?
4. **Tutu as a new pioneer.** Tree tutu is *the* NZ volcanic pioneer (§2.5) and would need art,
   or an art alias. Alternatively mānuka stands in.
5. **Whakamaru fire.** A charcoal tint plus snags: in, or out?

---

## Sources

Eruption recovery and vegetation:
- Wilmshurst, J.M. & McGlone, M.S. 1996. Forest disturbance in the central North Island following the 1850 BP Taupo eruption. *The Holocene* 6(4) — [doi](https://journals.sagepub.com/doi/10.1177/095968369600600402)
- Piva et al. 2023. Millimetre-scale pollen analysis … Onepoto maar … following the ~25.5 ka Ōruanui supereruption. *J. Quaternary Science* — [doi](https://onlinelibrary.wiley.com/doi/full/10.1002/jqs.3506) · [open-access record](https://openaccess.wgtn.ac.nz/articles/journal_contribution/Millimetre_scale_pollen_analysis_of_non_varved_lacustrine_sediments_from_Onepoto_maar_palaeolake_Auckland_reveals_distal_vegetation_responses_and_landscape_recovery_following_the_25_5_ka_ruanui_supereruption_New_Zealand/22180048) · [thesis](https://openaccess.wgtn.ac.nz/articles/thesis/Environmental_and_Climatic_Responses_to_Two_Large_Explosive_Eruptions_from_Taup_Volcano_New_Zealand/24848067)
- Tarawera succession — [Te Ara, forest succession](https://teara.govt.nz/en/forest-succession-and-regeneration/page-1) · Tarawera papers in *NZ J. Ecology* 6 (1983): [pp. 107–119](https://newzealandecology.org/nzje/1575), [pp. 99–105](https://newzealandecology.org/node/4233)
- Pureora / Benneydale buried forests vs the modern forest beside them — [*NZ J. Ecology* 11 (1988) abstract](https://newzealandecology.org/node/4453)

Tephra thresholds (analogues):
- Antos, Fischer & Zobel 2017, global review of forest-plant responses to tephra fall — [ESA abstract](https://eco.confex.com/eco/2017/webprogram/Paper63444.html)
- Zobel & Antos, 30 years after burial by Mount St Helens tephra — [ESA abstract](https://eco.confex.com/eco/2012/webprogram/Paper35385.html)
- Fischer et al. 2016, 33-year response to a thin tephra deposit — [AGRIS](https://agris.fao.org/search/en/providers/122535/records/65df2be063b8185d9cab36e7)
- Mount St Helens legacies: Dale, Swanson & Crisafulli 2005 — [USDA PNW](https://www.fs.usda.gov/pnw/pubs/journals/pnw_2005_dale003.pdf) · [Major et al. field guide](https://volcanoes.usgs.gov/vsc/file_mngr/file-71/After_the_Disaster_Major%20et%20al_Vines_to_Wines.pdf)
- Swanson et al. 2016. Puyehue–Cordón Caulle eruption of 2011: tephra fall and initial forest responses in the Chilean Andes. *Bosque* 37(1): 85–96 — [record](https://water.oregonstate.edu/biblio/puyehue-cordon-caulle-eruption-2011-tephra-fall-and-initial-forest-responses-chilean-andes) · [SciELO](https://busca.umc.cl/Record/oai:scielo:S0717-92002016000100009)
- Cordón Caulle ash remobilisation, Patagonian steppe — [CONICET](https://ri.conicet.gov.ar/handle/11336/54788)
- Livestock and ash — [USGS volcanic ash impacts: animals](https://volcanoes.usgs.gov/volcanic_ash/ash_toxicity_animals.html) · [Ruapehu 1995–96](https://volcanoes.usgs.gov/volcanic_ash/ruapehu_agriculture.html)

The four eruptions:
- [Ōruanui eruption](https://en.wikipedia.org/wiki/Oruanui_eruption) · [Te Ara: Oruanui ash at Aokautere](https://teara.govt.nz/mi/photograph/9466/loess-and-ash)
- [Whakamaru Caldera](https://en.wikipedia.org/wiki/Whakamaru_Caldera) (Rangitawa fall SE, up to ~70 cm at ~200 km, citing Matthews et al. 2012)
- [Mangakino caldera complex](https://en.wikipedia.org/wiki/Mangakino_caldera_complex) · [Kidnappers fall + ignimbrite (Cooper et al.)](https://orca.cardiff.ac.uk/id/eprint/93311/) · [Whanganui Basin distal sedimentation (ISC 2026 field trip)](https://confer.co.nz/isc2026/field-trips/pre-conference/distal-sedimentation-from-large-volume-silicic-eruptions-in-a-regression-dominated-marine-environment)
- Manville & Wilson 2004, Ōruanui post-eruptive sedimentary response — [record](https://www.mindat.org/reference.php?id=258609)
- Sandy River aggradation after Mount St Helens (Pierson et al. 2011) — [USGS](https://volcanoes.usgs.gov/vsc/file_mngr/file-61/Pierson%20et%20al%202011%20OM%20aggradation.pdf)

Fauna and climate:
- Bemmels et al. 2022. Legacy of supervolcanic eruptions on population genetic structure of brown kiwi. *Current Biology* 32(15) — [U of T summary](https://utoronto.ca/news/u-t-researcher-examines-how-two-volcanic-eruptions-forever-changed-flightless-brown-kiwi)
- Toba, mild volcanic winter in the Lake Malawi record — [EARTH](https://www.earthmagazine.org/article/lake-sediments-suggest-mild-volcanic-winter-after-massive-toba-eruption/) · [UMN](https://experts.umn.edu/en/publications/high-resolution-paleoecological-records-from-lake-malawi-show-no-/)

Internal: `TEMANAWA_ECOLOGY_WETLAND.md` §4.1, §6 · `TEMANAWA_ECOLOGY_LOWLAND.md` §4 ·
`TEMANAWA_ECOLOGY_OPEN.md` §3.3 · `TEMANAWA_DEEPTIME_ECOLOGY_PLAN.md` §2 · `TEMANAWA_PLAN_V3.md` §8–9 ·
`TEMANAWA_BUILD_V3.md` §2.2, §2.5.
