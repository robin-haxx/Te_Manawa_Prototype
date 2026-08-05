# Te Manawa — Build Plan v2.1

**Land-first, deliberately simplified.** Keeps the geology as the spine and the takeaway
(*the river is older than the mountains*). Adds only the ecology a visitor will actually
perceive in forty seconds.

**Window: ~1 Ma → ~25.5 ka**, ending on the **Ōruanui eruption** (decided). It opens
near the axial ranges' earliest uplift — they rise from almost nothing to full height
across the run (`TEMANAWA_GEOGRAPHY.md`) — and closes cold, heading into the **Last
Glacial Maximum**. Whakamaru (~345 ka) and Ōruanui both fall inside it as eruption markers.

> The window was ~345 ka in v2.1, pushed back to ~1 Ma so the ranges rising is earned
> on-screen rather than assumed (`TEMANAWA_GEOGRAPHY.md`). The climate curve still begins
> at ~350 ka (§8.2), so the opening ~650 ky run under tectonic uplift with the glacial
> cycle held flat until Whakamaru.

Supersedes the ecology sections of `TEMANAWA_PLAN.md`; §§1–3, 5–8, 10 of that document
stand. The four deep dives remain the reference material — this is the subset we build.
Technical companion: **`TEMANAWA_BUILD_V3.md`** (architecture, performance budget,
full sprite manifest).

---

## 0. What changed in v2.1

v2 was right about the filter and right about the mechanical core. Six corrections,
all sourced from documents already in this repo, plus one governing principle.

| # | Change | Why |
|---|---|---|
| **1** | **The governing principle is stated up front (§0.1).** Cartoon, bird's-eye abstraction — illustrative over exhaustive | It was implied everywhere and written nowhere, and it silently decides most of the art |
| **2** | **Plants split into 10 sprite species + 7 palette entries; 3 cut** | From above, ground cover *is* colour. Sprites only for things with a crown or a fan. Fewer assets, better read |
| **3** | **The fauna cast is the seven from `TEMANAWA_FAUNA_POOL.md` §1** — huia in, *Dinornis* dimorphism pair in | v2 silently dropped kererū and huia and never mentioned the dimorphism, which the dives call the best value on the list |
| **4** | **Three predator corrections applied** (§5.2) | `..._ECOLOGY_FAUNA.md` §5 marks all three `[BUILD]`; v2 said "unchanged." One of them inverts the cold-phase readout |
| **5** | **Every disturbance gets a local clock** (§3.4) | Three of the four measured recovery times are invisible at any speed the kiosk runs at. This is the fix that makes the aftermath teach |
| **6** | **`resetToAttract()` is a first-class system** (§4.2) | On an unattended kiosk the reset *is* the product. v2 left it as one clause |
| **7** | **Terrain reduced to two authored heights + parametric sea level** (§7) — *since revised again to an SVG geography skeleton; see §7* | The topography barely moved across the old 345 ka window. The keyframe pipeline was the risky phase and most of it is deletable |

### 0.1 The governing principle

> **This is a cartoon seen from above, not a survey of the Manawatū.**

Every asset and every mechanic is judged on whether it is **legible and engaging at a
glance from directly overhead**, not on whether it is a complete account of the
ecology. The research decides *what is true*; this principle decides *what gets drawn*.

Three consequences that run through the whole document:

- **Silhouette from above beats silhouette from the side.** A cabbage tree is a
  starburst, a nīkau is a radial palm crown, a tree fern is a frond star. A rewarewa is
  a dot. Choose accordingly — and note this reverses several judgements made in the
  deep dives, which were written from a field-guide viewpoint.
- **Ground cover is colour, not sprites.** Spinifex spreading over fresh grey sand
  reads better as a colour wash than as hundreds of tiny plants, and costs nothing.
- **One clear thing beats three accurate things.** Where two species do the same
  visual job, cut one and say so in the interpretation instead.

---

## 1. The filter

The research produced roughly forty findings. Most are invisible on a small screen at
arm's length in under a minute. Each candidate got one test:

> **Would a visitor *see* it and *feel* it, without reading anything?**

**Seven passed.** Everything else is either art direction, a pop-up, or shelved.

| # | Insight | Why it survives |
|---|---|---|
| **1** | **The wind never changes direction** | Every dune in every era points the same way. Always on, and it's the visual anchor. |
| **2** | **Tree ferns vanish when it turns cold** | Binary, instant, unmistakable. Tree fern pollen is **0.7%** at the Last Glacial Maximum. |
| **3** | **The moa cast changes with the climate** | Moa with different habitats become the *legend* for the vegetation. |
| **4** | **Ash makes the swamps bloom** | Counter-intuitive and memorable. Wetland plants expanded for **~60 years** after Ōruanui; peat accumulation roughly **quadrupled**. |
| **5** | **Storms bury the dune plants — and they grow into it** | Immediate cause-and-effect inside one press. |
| **6** | **Growth does something different everywhere — and almost nothing on the dry downlands** | One press, four results, including a visible failure. |
| **7** | **The gorge deepens while the river stays put** | The existing takeaway. Unchanged. |

**Explicitly cut** (see §9): the fertility axis, the light-at-ground-level field, the
five wetland classes, the 1.8 m zonation, the dune-phase chronology as a mechanic, the
divaricate/moa-browse debate, and 20 plant species.

---

## 2. The plants

**Ten drawn species, seven palette entries.** Chosen for **read from above** first,
ecological correctness second, name recognition third.

### 2.1 The ten that get sprites

Every one has a crown, a fan or a rosette that reads from directly overhead.

| # | Species | Read from above | Habitat | Tier |
|---|---|---|---|:--:|
| 1 | **Mamaku** / tree fern | frond star — **THE ERA SIGNAL** | warm forest only | S |
| 2 | **Kahikatea** | tall narrow spire, tight dark crown | swamp forest | S |
| 3 | **Tōtara** | massive dark fluted dome | dry ground forest | S |
| 4 | **Tawa** | rounded canopy — the default forest | lowland and hill | S |
| 5 | **Tī kōuka** / cabbage tree | strap-leaf starburst; the most readable native there is | everywhere damp-ish | S |
| 6 | **Harakeke** / flax | stiff blue-green fan rosette | swamp | M |
| 7 | **Nīkau** | radial palm crown; second era signal | warm forest only | M |
| 8 | **Mānuka** | fine grey-green mound, white flowers | shrubland | M |
| 9 | **Black beech** | dark, dense, small-leaved | ranges; survives the cold | M |
| 10 | **Kōwhai** | golden flowers — the seasonal colour beat | forest margin | K |

**Tier S** = mature, thriving, wilting + 2 growing frames (**5 assets**) — the five that
must be seen *establishing* after a disturbance.
**Tier M** = mature, thriving, wilting (**3 assets**).
**Tier K** = kōwhai only: mature, thriving, wilting, **flowering** (**4 assets**). The
flowering state is the whole reason the plant is on the list.

**41 plant sprites total.** Tōtara, black beech and harakeke already have usable art.

### 2.2 The seven that are palette, not sprites

These get a **ground colour and a shared tiling micro-texture** in the terrain bake.
No per-plant entities, no per-frame draws, no sprite sheets.

| Species | What the visitor sees | Job |
|---|---|---|
| **Spinifex** / kōwhangatara | silver-green wash creeping over grey sand | finding #5 — the sand greens over |
| **Pīngao** | golden-orange wash | the coast's colour accent; the low convex dune |
| **Toetoe** | pale cream stipple on wet ground | wet ground and dune slack |
| **Raupō** | dark green-brown reed mass at the water's edge | finding #4 — the swamps bloom |
| **Bracken** | mid-green flush on raw ground | the visible face of `bare` decaying |
| **Short tussock** | pale straw field — **cold-only** | the `open` floor; the glacial ground layer |
| **Grey scrub** | grey-green tangle *(absorbs mingimingi and tauhinu)* | the cold-phase shrub layer |

**4 shared micro-textures** cover all seven (mat, reed, tussock, scrub). **45 plant
assets in total**, against 74 under v2's flat model.

`[NOTE]` **Bracken is correct here and should not be "corrected" out later.** As a
*landscape* cover it is post-1280 CE and fire-induced (`..._ECOLOGY_OPEN.md` §3.3), but
as a coloniser of raw ash and windthrow it belongs in this window.

### 2.3 Cut, and why

| Cut | Reason |
|---|---|
| **Rimu** | Duplicates tōtara's job — from above both are a large dark conifer mass, and tōtara is already fully drawn. The best-known podocarp *name* goes; put it in the interpretation |
| **Kawakawa** | A shrub-layer plant under a closed canopy. From directly above it is occluded almost everywhere it occurs. High ecological value, zero screen value |
| **Rewarewa** | The dives call it the most distinctive shape in the forest — **from the side.** From above a narrow spire is a dot. Cost: the palette loses its only crimson, and kōwhai now carries the flowering beat alone |
| **Mingimingi** | Folded into the *grey scrub* palette entry. With no browse mechanic (§9) a divaricate silhouette is a shape with no job |

### 2.4 The plant table — the whole ecology, in one data structure

Five columns. Nothing else. `tier` is the art contract, not ecology.

```js
// wet 0=dry sand → 1=standing water · elev 0=sea → 1=summit
// open 0=closed forest → 1=fully open (cold) · bare: does it colonise raw ground?
// h: 1 ground · 2 shrub · 3 canopy (9–15 m) · 4 emergent (30 m+)
// tier: S/M/K = sprite · G = ground palette
mamaku       wet .45–.90  elev .12–.45  open ≤0.15         h3  S   ← era signal
kahikatea    wet .70–.95  elev .12–.30  open ≤0.40  bare✓  h4  S
totara       wet .15–.50  elev .15–.45  open ≤0.50  bare✓  h4  S
tawa         wet .30–.80  elev .12–.40  open ≤0.35         h3  S
ti_kouka     wet .30–.90  elev .10–.35  open ≤0.90         h3  S
harakeke     wet .60–.90  elev .10–.30  open ≤0.80         h2  M
nikau        wet .40–.85  elev .12–.35  open ≤0.15         h2  M   ← era signal
manuka       wet .10–.85  elev .12–.55  open ≤0.85  bare✓  h2  M
black_beech  wet .20–.60  elev .25–.60  open ≤0.75         h3  M
kowhai       wet .20–.60  elev .12–.40  open ≤0.60         h3  K
spinifex     wet .00–.30  elev .10–.16  open ≤1.00  bare✓  h1  G
pingao       wet .00–.40  elev .10–.16  open ≤1.00  bare✓  h1  G
toetoe       wet .40–.90  elev .10–.35  open ≤1.00         h2  G
raupo        wet .85–1.0  elev .10–.25  open ≤0.80         h2  G
bracken      wet .15–.70  elev .12–.50  open ≤0.90  bare✓  h1  G
tussock      wet .05–.60  elev .12–.70  open ≥0.35         h1  G   ← cold-only
grey_scrub   wet .10–.70  elev .12–.55  open ≥0.25         h2  G
```

Note the symmetry that does the era work: **mamaku and nīkau have a low `open` ceiling;
tussock and grey scrub have an `open` floor.** Turn the climate cold and the tree fern
and palm sprites drop out while a straw-pale colour spreads across the map — no
special-casing, no scripted transition. **The palette split makes this read better than
v2's all-sprite version**, because a whole-field colour change is more legible at a
glance than a change in the density of small objects.

---

## 3. The mechanical core

Everything above runs on **four per-cell fields, one global scalar, and one function.**
That is the entire ecology expansion.

### 3.1 The fields (per cell, alongside the existing `heightMap`)

| Field | What | How it's computed |
|---|---|---|
| **`wet`** | 0 dry → 1 standing water | Once per re-bake, from distance-to-water and height above the river corridor |
| **`open`** | 0 closed forest → 1 fully open | `glacialIndex × exposure`, on the re-bake interval |
| **`bare`** | 0 vegetated → 1 freshly disturbed | Set by `disturb()`. **Decays toward 0.** This one number *is* the successional clock |
| **`warp`** | 1 → N, local time multiplier | Set by `disturb()`, decays to 1. Makes the aftermath visible (§3.4) |

Four `Float32Array`s at 256² = **1 MB.** Free.

### 3.2 One global scalar

**`glacialIndex`** — 0 warm, 1 cold. A low-frequency oscillator over `yearsBP` (≈ three
cycles across the window). It drives, all as simple coefficients:

- sea level → coastline and dune extent
- snowline → existing `SeasonManager` behaviour
- **`open`** per cell = `glacialIndex` × topographic exposure

**Exposure** is just `1 − shelter`, where shelter is high in valleys and gullies and low
on ridges and flats — which reproduces the patchy mosaic and the sheltered refugia the
pollen records show, for nothing.

### 3.3 One function

```js
disturb(x, y, radius, type)   // type: 'sand' | 'flood' | 'ash' | 'gale'
```

- Sets `bare` in the affected cells, and sets `warp` (§3.4).
- `'sand'` also **displaces material ESE** — the fixed north-westerly, always.
- `'ash'` also sets a temporary `growthPulse`, **weighted toward high-`wet` cells.**
  That single weighting is finding #4: the swamps bloom.
- Plants with `bare✓` establish immediately in bare cells. Everything else waits for
  `bare` to decay.

### 3.4 Local clocks — the fix that makes the aftermath teach

`..._CONCEPT_ECOLOGY_FIRST.md` §2.3 identifies four disturbances with four **measured**
recovery times. At the baseline 500 sim-years per second they land like this:

| Disturbance | Real recovery | Wall-clock at 500 yr/s | Wall-clock **with `warp`** |
|---|---|---|---|
| Gale / flood | years | 0.01 s | **~1 s** |
| Sand burial | ~50 years | 0.1 s | **~2 s** |
| Ashfall (wetland surge) | ~60 years | 0.12 s | **~6 s** |
| Forest return after ash | centuries | ~1 s | **~20 s** |
| Glacial | tens of millennia | 200 s | unchanged — that's Button 1's job |

**Three of the four are instantaneous and the fourth is longer than a visitor will
stay.** The best teaching structure in the whole body of research is invisible at every
speed the installation actually runs at.

`[BUILD]` `disturb()` raises `warp` in the affected cells; `warp` multiplies local
`bare` decay and local growth, and itself decays back to 1 over a few real seconds. Each
button is tuned to a visibly different recovery speed. **Same data, same curve, one
extra multiply — and it converts four invisible facts into the thing a visitor
remembers.**

---

## 4. The four buttons

| Button | Call | Instant | Aftermath (inside the press, via `warp`) |
|---|---|---|---|
| **① Deep time ▶▶** | advance `yearsBP` fast | timeline runs; `glacialIndex` swings | tree fern and palm sprites drop out and return; the tussock wash comes and goes; coast walks out and back; **gorge deepens** |
| **② Growth 🌱** | `growthPulse` scaled by cell `wet` | everything greens — **but by different amounts** | wet ground responds hard, the dry NW downlands barely at all |
| **③ Storm ⛈** | `disturb('sand')` at the coast + `disturb('flood')` on the river + `disturb('gale')` in the forest | sand jumps ESE, shingle goes bare, a few emergents fall, harrier is distracted | **the spinifex and pīngao wash creeps back over the new sand in ~2 s**; kahikatea seeds the fresh silt |
| **④ Eruption 🌋** | ramped ash sweep, then `disturb('ash')` map-wide | canopy greys and thins — looks like a disaster | **swamps bloom vivid green over ~6 s and stay that way**; forest returns over ~20 s |

**Storm is no longer just "stall the predator."** It's the same button doing three
habitat-appropriate things at once, which is what makes finding #5 visible. Predator
distraction stays as a side effect.

**Eruption is no longer a hard `loadLevel()` reset.** It's a big `disturb('ash')` with a
wetland-weighted growth pulse — cheaper *and* more accurate, and the visitor watches the
recovery instead of a scene change.

### 4.2 The reset — a first-class system, not a rare event

Removing the eruption reset removes the only mechanism that returns the scene to its
start state. On an unattended kiosk that mechanism **is the product**: it runs on every
idle timeout, at end-of-window, and after every watchdog reload.

`[BUILD]` **`resetToAttract()` must never touch the network.** Everything it needs is
already in memory. It re-seeds, zeroes `yearsBP` and `playTime`, returns pooled entities
to their pools, rebuilds the four fields and re-bakes the terrain buffer — **~10–25 ms
total**, hidden behind a 400 ms crossfade. It must be safe to call from a
`window.onerror` handler. Budget and measurements in `TEMANAWA_BUILD_V3.md` §5.

---

## 5. The fauna cast

### 5.1 The seven

Per `TEMANAWA_FAUNA_POOL.md` §1, which supersedes the six-animal shortlist in
`..._ECOLOGY_FAUNA.md` §8.

| # | Animal | Habitat / job | Visible when |
|---|---|---|---|
| 1 | **NI giant moa** *Dinornis novaezealandiae* | tall wet forest; **the headline** | warm |
| 2 | **Kērangi** / Eyles' harrier | apex predator | **all phases — see §5.2** |
| 3 | **Mantell's moa** *Pachyornis geranoides* | dry forest and shrubland | **cold** |
| 4 | **Little bush moa** *Anomalopteryx didiformis* | closed wet forest | warm |
| 5 | **North Island goose** *Cnemiornis gracilis* | open grazing; **in the local bones** | **cold** |
| 6 | **Kererū** | recognition anchor; harrier prey; large-seed disperser | warm |
| 7 | **Huia** | **the Manawatū's own bird**; hill forest | warm |

**The *Dinornis* dimorphism pair is in.** Females stood to 3.6 m and were vastly larger
than males — so much so that the sexes were originally described as separate species.
The dives call it *"a free gift: two sprites, one species, and a genuinely surprising
fact."* A towering female beside a much smaller male reads instantly and needs no
caption. It must be a different **build**, not a scaled copy, or the fact doesn't land.

**Huia is in, and the contradiction is resolved.** `..._ECOLOGY_FAUNA.md` §8 argued it
out of the sim on the grounds that it "will not read at sprite scale."
`TEMANAWA_FAUNA_POOL.md` §0 withdrew that filter — the sim is stylised and not to scale
— and reinstated it. **The pool document wins**, and §0.1 of this plan says why: a
stylised icon does not need to be a field-guide plate. Its bill dimorphism is the same
free-second-sprite trick as *Dinornis*.

**Coastal moa** *Euryapteryx* is the conditional eighth. `..._ECOLOGY_FAUNA.md` §8 says
it is only worth building *if the terrain gives the coast a distinct band*. Parametric
sea level does give it one — so it is a genuine option, at +5 assets, and it is the
first thing to add if the budget stretches.

### 5.2 The predator — three corrections

`..._ECOLOGY_FAUNA.md` §5 marks three changes `[BUILD]`. v2 said "unchanged." All three
are now in:

1. **It hunts *in* forest and forest edge with fast dashes** — goshawk build, compact
   wings, powerful legs. Not a soaring open-country hunter. The inherited Haast's eagle
   behaviour soars; it shouldn't.
2. **Its prey is birds, with small and juvenile moa a subset.** The 40 kg ceiling
   excludes an adult *Dinornis* entirely. Weight predation toward juveniles, kererū and
   the smaller moa.
3. **It is at home in the dry, open phases, not diminished by them.** "Dry forest and
   shrubland, sea level to subalpine" is its glacial-phase habitat.

`[BUILD]` Correction 3 is one line and it inverts the whole cold-phase readout. **Weight
the harrier's carrying capacity by prey biomass in cells above an `open` threshold, not
by total prey biomass.** Track total biomass and the harrier thins exactly when it
should be thriving, and the glacial reads as a landscape emptying out. Every other
document in this repo says the opposite:

> **Cold is not death. It is a different, busier assemblage of large grazing birds, with
> the same apex predator perfectly comfortable in it.** — `..._ECOLOGY_FAUNA.md` §7

### 5.3 The cast as the legend

This is how a visitor reads the vegetation without text.

| | **Warm (interglacial)** | **Cold (glacial / LGM)** |
|---|---|---|
| **NI giant moa** ♀/♂ | abundant — tall forest | contracted to sheltered forest |
| **Little bush moa** | abundant — closed forest | **scarce**; closed canopy is gone |
| **Mantell's moa** | present in dry patches | **abundant** |
| **NI goose** | scattered | **abundant** — open grazing |
| **Kererū** | abundant | scarce |
| **Huia** | present — hill forest | scarce |
| **Kērangi** | forest hunter | **at home** |

**Cold is busier, not emptier.** Make sure the art supports that rather than fighting it.

---

## 6. Art direction doing the work mechanics can't

1. **Two-layer canopy.** Scattered emergents at 30 m+ over a continuous canopy at only
   9–15 m. **This is already in the data** — the `h` column — so it needs a stated
   render rule, not just a look: **`h4` sorts above `h3` and draws at roughly double the
   footprint.** The existing art already does this by accident (Tōtara at 234×500, Beech
   and Rimu at 96×96). Make it a rule: `h2` at 64², `h3` at 96², `h4` at 234×500 with
   `anchor: 'base'`.
2. **Dune shape follows the plant.** Spinifex builds smooth 6 m dunes at 14–16°; pīngao
   builds low convex ones under 3 m. Dune sprites vary with the dominant binder, so the
   coast reads correctly with no extra system.
3. **Buried logs.** Dead trunks left behind when sand or water takes a forest. Three
   variants, not one — **sand-buried trunk**, **drowned stumps in peat**, **ash-killed
   snag**. It's the recurring motif in every dive and it makes the *history* of a cell
   visible.
4. **The wind never changes direction.** Finding #1, and a **constraint on every asset
   in the set**: every asymmetric silhouette, every shadow and every dune form leans the
   same way, in all eras. It is cheap, but it is not free, and it has to be in the brief
   before anything is drawn.

---

## 7. Terrain — the geography skeleton

**The history, briefly.** v1 specified a full keyframe morph pipeline
(`TEMANAWA_TERRAIN_PLAN.md` §3–5). v2.1 cut it — across the old ~345 ka window the ranges
gained a few hundred metres on a range already 1,500 m high, imperceptible — down to two
authored heightmaps blended by `yearsBP` plus parametric sea level.
`TEMANAWA_GEOGRAPHY.md` then pushed the window back to ~1 Ma, over which the ranges *do*
rise from almost nothing, and replaced the painted heightmaps with a lighter model: one
SVG of ranges and a river, elevation built procedurally around it.

**What is built (Phase 3):**

1. **An SVG skeleton, not raster heightmaps.** `geo/manawatu.svg` (ranges as blobs, the
   river as a line) is flattened at author-time by `tools/svg2geo.js` into
   `geo/manawatu.geo.js` — a plain data file the kiosk loads like a level, so the runtime
   never parses SVG. `getElevation()` builds distance fields once per bake: ranges lift
   the land toward alpine, the river carves a channel to the water band; noise and a
   per-run seed vary the rest. **The river is authored once**, so antecedence still falls
   out of the art for free.
2. **Two curves, not one.** `tUplift(yearsBP)` grows the ranges (eased — most uplift is
   late); `tIncision(yearsBP)` runs slightly *ahead*, so the gorge floor drops faster than
   the ridges rise and the visitor sees the river outpace the uplift. This was the
   load-bearing idea from the two-heightmap plan and it carried straight over.
3. **Parametric sea level** off `glacialIndex`. No art, a threshold comparison. *(Coast
   and dune skeleton features are stubbed for later — `TEMANAWA_GEOGRAPHY.md` §7.)*
4. **Interval re-bake, amortised.** The world re-bakes once `yearsBP` drifts past
   `morphIntervalYears` (~9 ky), cross-faded like the seasons, split across frames against
   a millisecond budget so fast-forward never drops a frame.

The 3/4 restyle on top is `TEMANAWA_34VIEW_PLAN.md`; the surviving parts of the old plan
are `TEMANAWA_BUILD_V3.md` §6 and `TEMANAWA_TERRAIN_PLAN.md` §7.

---

## 8. Build phases

Phases 0–2 are done; **Phase 3 is substantially built.**

| Phase | Work | Notes |
|---|---|---|
| **1.5 — Cleanup** | Delete shims, strip economy/toolbar/goals, **square play area**, split into modules, clean the asset directory | ✅ **Done** — see §8.1 |
| **2 — Deep time** | `timeScale` + `yearsBP` mapping, Button 1, timeline playhead and era bands | ✅ **Done** — see §8.2 |
| **3 — Terrain** | SVG geography skeleton + `tUplift`/`tIncision` morph + parametric `seaLevel`; the 3/4 relief bake and cel illustration look | ✅ **Substantially built** (§7). Window now ~1 Ma. See `TEMANAWA_GEOGRAPHY.md`, `TEMANAWA_34VIEW_PLAN.md`. Left: bump to 1.1 Ma, coast/dune features, real terrain stamps |
| **4 — The four fields** | `wet`, `open`, `bare`, `warp`; `glacialIndex` oscillator; hook to sea level and snowline | Mostly coefficients on `SeasonManager` |
| **5 — Flora** | The §2.4 table; plants read fields not biomes; **sprite/palette split**; atlas pipeline | **Start the art in parallel with Phase 2** |
| **6 — Disturbance** | `bare` + `warp` decay, `disturb()`, wire Buttons 2–4 | The heart of the ecology |
| **7 — Fauna** | Seven-species cast reading the same fields; **the three predator corrections**; dimorphism pair | |
| **8 — Kiosk** | Photosensitivity sign-off, accessibility, touch targets, lockdown, sustained + fast-forward performance, audio | |

**Critical path is Phase 5 art: ~113 new assets, not "twenty sprites."** Full manifest
and the count in `TEMANAWA_BUILD_V3.md` §4.

### 8.1 Phase 1.5 — what landed

| Change | Result |
|---|---|
| **Shims deleted** | `PROGRESS`, `BENCHMARK`, `TutorialManager`, `MenuArtManager`, `TUTORIAL_EVENTS` and every call-site gone from `sketch.js`, `moa.js`, `simulation.js` |
| **Economy stripped** | `MauriManager` deleted; the `mauri` parameter removed from ~25 signatures across moa / eagle / simulation; goals, phases, win/lose, score, toolbar, placement preview, level select and the menu screens all gone |
| **Install layer folded in** | The monkey-patch file is retired. `TeManawa_hud.js` (timeline, buttons, storm/ash) and `TeManawa_kiosk.js` (watchdog, attract, reset, lockdown) are normal modules |
| **Square play area** | `CONFIG.mapGrid` = 512, letterboxed into any aspect including portrait. `recalculateLayout` is no longer landscape-only |
| **Kiosk layer in early** | Watchdog, idle→attract, error ring buffer, input lockdown, `pixelDensity(1)`, audio-context resume |
| **Debug overlay** | `D` cycles off / compact / full; `SHIFT+D` dumps JSON. Six pages including live caps from `..._BUILD_V3.md` §5.2 |
| **Assets** | 53 MB of stray video and 1.3 MB of duplicate OneDrive folders removed; patotara and lancewood retired to `sprites/_retired/`; the silent `moa_juvenile.png` load failure fixed |

**Code size:** `sketch.js` 76 kB → 35 kB, `UI.js` 44 kB → 3.4 kB. The Game class went
from 33 methods to 14.

**Two bugs the work surfaced, both real:**

1. **`window.game` was always `undefined`.** `let game` in a classic script creates a
   lexical global, never a property of `window` — so every kiosk recovery path that
   reached for `window.game` would have silently no-opped in production. `Kiosk.attach()`
   now holds the reference.
2. **The soft reset was ~950 ms, not 25 ms.** `Game.init()` regenerates terrain noise
   over every cell *and* bakes four season buffers. Split into `init()` (full, for first
   load and the occasional reseed) and **`resetEcosystem()`** (keeps the terrain and its
   baked buffers, replaces only the living world). Measured **17–31 ms** — ~50× cheaper
   then, and ~100× now that Phase 3's heavier terrain bake has grown `init()` to ~1.8 s.
   Well inside the §5.1 budget, and the land does not need to change between visitors.

**`tools/bootcheck.js`** is a headless harness: it stubs p5 and the DOM, loads every
script in `index.html` order, runs `preload`/`setup`/120 `draw` frames, presses all four
buttons, cycles the debug overlay and times six soft resets against a full `init()`.
Both bugs above were found by it rather than by looking. Run it before every commit —
`node tools/bootcheck.js`.

### 8.2 Phase 2 — what landed

**Two new modules, both pure and both p5-free**, which means the harness can test them
directly and Phase 4 becomes wiring rather than invention.

**`TeManawa_climate.js` — `Climate.at(yearsBP)`.** Scheduled for Phase 4, brought
forward because the timeline cannot draw era bands without knowing where the glacials
are. Returns `glacialIndex`, `seaLevel`, `snowLine`, `tempBias`, `stage` and `MIS`.

> **It is a table of anchor points, not a sine wave, and that was a correction.** The
> first version was a generic ~100 kyr oscillator. It produced three tidy cycles and got
> two checkable facts wrong: it put **MIS 5e (~125 ka) — the last interglacial, and
> already a marker on our own timeline — in the middle of a glacial**, and it never
> reached a maximum at the end of the run, so **the LGM went missing entirely**.
> Extending the window to 25.5 ka was done precisely to capture the LGM, so a curve that
> misses it defeats the decision.
>
> Real cycles are ~100 kyr but strongly asymmetric and genuinely irregular — MIS 7 has
> three warm peaks, MIS 5 has four substages, terminations are abrupt. No closed form
> gets that right and there is no reason to guess. The curve interpolates 24 anchor
> points taken from the broad shape of the LR04 benthic stack, from MIS 10 (~350 ka, just
> after Whakamaru) to the LGM. It breathes three times and closes at **g ≈ 0.90 heading
> into the LGM as Ōruanui erupts** — cold, on an eruption. `tools/bootcheck.js` asserts
> five dated facts against the curve on every run. *(The deep-time run now opens earlier,
> at ~1 Ma — §7; the curve is held flat before its first anchor, so the opening ~650 ky
> are tectonic-only.)*

**`TeManawa_time.js` — `DeepTime`.** `yearsBP` is now the authoritative clock rather
than something derived from `playTime`, so geology and climate land correctly at any
speed. Three things beyond the v1 behaviour:

- **The Deep-time button eases.** It was a hard step to ×10, which changes the terrain
  cross-fade, the season lerp and every boid's speed on a single frame — it reads as a
  glitch. Now smoothsteps in and out over 1.2 s *inside* the 10 s window. One press
  covers **~46 ky**, measured.
- **End of window hands off.** The run reaching Ōruanui is the attract loop's cue, not a
  pause. Without this the kiosk sits frozen at 25.5 ka until somebody touches it, which
  unattended means most of the day.
- **Markers are dated and typed** (eruption / glacial / warm) so the timeline can colour
  them without a legend.

**The timeline now answers §10.1 rather than waiting on it.** The question was whether it
reads as an arrow or a wave. Both are true — uplift accumulates, climate oscillates — so
it draws both: **a monotonic uplift bar underneath an oscillating climate wave**, with
cold intervals shaded, the playhead riding the curve, and a stage/MIS readout. It is a
first pass built so the question can be *looked at* instead of argued. The decision is
still yours; what changed is that there's now something to decide against.

**Debug overlay** gained a CLIMATE panel: glacialIndex, stage, MIS, sea level, snow line,
temperature offset — all colour-coded warm-to-cold on lightness as well as hue, so the
read survives colourblindness.

### 8.3 The visitor screen is now clean

Seeing the first build running made the problem obvious: three separate layers of
**instrumentation wearing the costume of interpretation** were sitting on top of the
diorama. All three are now debug-only.

| Was on screen | Why it went |
|---|---|
| **The climate wave** | A temperature graph. Nobody reads a curve at arm's length in forty seconds, and it was the busiest object in the frame. Moved to `Debug.renderClimateStrip`, along with the glacial markers and the stage/MIS readout |
| **Notification messages** | *"A moa has hatched!"* — engine chatter left over from the game this used to be. An ambient diorama does not narrate itself, and the strip sat directly over the play area. Still queued, drawn only in debug |
| **The entity UI layer** | Hunger and breeding bars, hearts, pregnancy dots, low-population rings, state glyphs (♀ ♂ ♥ ↗ !), egg progress. The strongest "this is a video game" signal on screen |

`[NOTE]` **Only the bars were ever gated.** `CONFIG.showHungerBars` covered the bars and
the state glyphs; the hearts, pregnancy dots and low-population rings had no gate at all
and were on screen permanently. The flag is now `CONFIG.showEntityUI` and it gates the
whole `renderIndicators` pass — renamed because the old name described about half of what
it controlled, which is how the rest stayed visible unnoticed.

**The argument, not just the tidy-up.** The climate is *supposed* to be read off the land
and the cast — tree ferns vanishing, tussock spreading, the moa changing over (findings #2
and #3). A chart in the corner undercuts both: it answers the question the vegetation is
there to ask. Same for breeding, which should read as two moa together and then an egg on
the ground, not as a floating heart.

**What the visitor timeline keeps:** the year, the two eruptions that bookend the run,
the monotonic uplift wedge, and the playhead. That is the whole thing. It also fixes two
collisions visible in the build — `LGM` at 30 ka sat ~13 px from `Ōruanui` at 25.5 ka and
overlapped permanently, and the end labels clipped off the strip; end markers now anchor
inward.

`tools/bootcheck.js` asserts the visitor render stays clean: entity UI off with debug off,
back on with it, notifications queued but not drawn, and a frame rendered in both states.

**Harness** now asserts the five dated climate facts, the baseline rate (~500 yr/s), that
the ramp eases rather than steps, that it never exceeds ×10, that one press covers ~50 ky,
and that the end of the window actually triggers the attract reset. Three of those
initially failed and all three were faults in the harness rather than the code —
`millis()` was advancing per call instead of per frame, which closed the deep-time window
at double rate.

---

## 9. What we are deliberately not building

All of it is preserved in the deep dives.

| Cut | Why | Where it lives |
|---|---|---|
| **Fertility as a second axis** | Invisible as such. Folded into what Growth does | `..._WETLAND.md` §8 |
| **"Light at ground level" field** | Governs four systems, but a visitor sees none of them. Becomes art direction | `..._OPEN.md` §6.2 |
| **Five wetland classes** | Collapsed into the single `wet` axis | `..._WETLAND.md` §2 |
| **The 1.8 m zonation** | Real and beautiful; needs a height-above-water-table field the screen can't show | `..._WETLAND.md` §3 |
| **Frost as its own parameter** | Folded into `open`. Same result, one fewer field | `..._OPEN.md` §4.3 |
| **Podocarp cohort model** | Reduced to `bare✓` on the two remaining podocarps | `..._LOWLAND.md` §4 |
| **Dune phase chronology** | A timeline pop-up, not a mechanic | `..._COAST.md` §2 |
| **Divaricate / moa-browse debate** | No browse mechanic; mingimingi folded into the grey-scrub palette | `..._LOWLAND.md` §7 |
| **20 plant species** | Indistinguishable from above, redundant, or ground cover. Notably pukatea, mātai, ngaio, akeake, māhoe, oioi, *Dracophyllum* — **and now rimu, kawakawa and rewarewa** (§2.3) | all four dives |
| **Then-and-now** | Curator's context. Not on screen | `..._LOWLAND.md` §8 |
| **Fire** | **Not a cut — a correction.** No ignition source in this window. Volcanic only | `..._OPEN.md` §3.3 |

---

## 10. Open decisions

1. **Does the timeline read as an arrow or a wave?** Uplift accumulates; climate
   oscillates about three times. **A first pass is now built showing both** — a monotonic
   uplift bar under an oscillating climate wave (§8.2). Look at it and decide; it still
   blocks the UI art (`..._BUILD_V3.md` §4.6), but there is now something to judge.
2. ~~Window end — 50 ka or 25 ka?~~ **Decided: ~25.5 ka, ending on Ōruanui.**
3. ~~Huia — in the sim or in the interpretation?~~ **Decided: in the sim** (§5.1).
4. ~~Kererū and the *Dinornis* pair?~~ **Decided: both in** (§5.1).
5. **Coastal moa — build the conditional eighth?** +5 assets. Sea level gives the coast
   a distinct band, so the condition in `..._ECOLOGY_FAUNA.md` §8 is met.
6. **Do the absences get acknowledged?** A single quiet end-card would carry the
   strongest material in the research (97% of the wetland gone, under 5% of the plains
   vegetation) without depicting the transition. Curatorial call, not technical.
7. **Does the sibling landform screen already carry the geology?** If it does, this
   screen can lean further ecological — which would justify simplifying even the
   geography-skeleton morph, the most expensive part of Phase 3.
8. **Hardware.** Final portrait resolution; touchscreen only, or touchscreen plus
   physical arcade buttons. Sets the button zone, the input path and `pixelDensity`.
9. **Mana whenua co-design** — unchanged: naming, narration, story framing, and any use
   of the Te Ahu a Tūranga bone story.

---

**Reference:** `TEMANAWA_BUILD_V3.md` (technical companion) · `TEMANAWA_ECOLOGY.md`
(outline) · `TEMANAWA_ECOLOGY_COAST.md` · `TEMANAWA_ECOLOGY_WETLAND.md` ·
`TEMANAWA_ECOLOGY_LOWLAND.md` · `TEMANAWA_ECOLOGY_OPEN.md` ·
`TEMANAWA_ECOLOGY_FAUNA.md` · `TEMANAWA_FAUNA_POOL.md` · `TEMANAWA_TERRAIN_PLAN.md` ·
`TEMANAWA_RESEARCH.md` · `TEMANAWA_CONCEPT_ECOLOGY_FIRST.md` (the counterfactual) ·
`TEMANAWA_PLAN.md` (v1)
