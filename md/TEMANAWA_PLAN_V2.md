# Te Manawa — Build Plan v2

**Land-first, deliberately simplified.** Keeps the geology as the spine and the takeaway
(*the river is older than the mountains*). Adds only the ecology a visitor will actually
perceive in forty seconds. Hard cap: **20 plant species.**

**Window: ~345 ka → ~25.5 ka**, ending on the **Ōruanui eruption** (decided). This
takes in the **Last Glacial Maximum** and the **Koputaroa dunefield**, and gives the run
two eruption markers — Whakamaru at the start, Ōruanui at the end — so the timeline
opens and closes on the same kind of event. Fauna consequences in
`TEMANAWA_ECOLOGY_FAUNA.md` §4.

Supersedes the ecology sections of `TEMANAWA_PLAN.md`; §§1–3, 5–8, 10 of that document
stand. The four deep dives remain the reference material — this is the subset we build.

---

## 1. The filter

The research produced roughly forty findings. Most are invisible on a small screen at
arm's length in under a minute. Each candidate got one test:

> **Would a visitor *see* it and *feel* it, without reading anything?**

**Seven passed.** Everything else is either art direction, a pop-up, or shelved.

| # | Insight | Why it survives |
|---|---|---|
| **1** | **The wind never changes direction** | Every dune in every era points the same way. Free, always on, and it's the visual anchor. |
| **2** | **Tree ferns vanish when it turns cold** | Binary, instant, unmistakable. Tree fern pollen is **0.7%** at the Last Glacial Maximum. One number in a table. |
| **3** | **The moa cast changes with the climate** | Four moa with different habitats become the *legend* for the vegetation. |
| **4** | **Ash makes the swamps bloom** | Counter-intuitive and memorable. Wetland plants expanded for **~60 years** after Ōruanui; peat accumulation roughly **quadrupled**. |
| **5** | **Storms bury the dune plants — and they grow into it** | Immediate cause-and-effect inside one press. |
| **6** | **Growth does something different everywhere — and almost nothing on the dry downlands** | One press, four results, including a visible failure. |
| **7** | **The gorge deepens while the river stays put** | The existing takeaway. Unchanged. |

**Explicitly cut** (see §8 for the full list with reasons): the fertility axis, the
light-at-ground-level field, the five wetland classes, the 1.8 m zonation, the dune-phase
chronology as a mechanic, the divaricate/moa-browse debate, and 17 plant species.

---

## 2. The twenty plants

Chosen for **silhouette contrast at sprite scale** first, ecological correctness second,
name recognition third. Every one does a job.

| # | Species | Job on screen | Habitat |
|---|---|---|---|
| 1 | **Spinifex** / kōwhangatara | low silver sprawling mat | foredune |
| 2 | **Pīngao** | golden arching tuft — the coast's colour accent | foredune |
| 3 | **Toetoe** | tall cream plumes | wet ground, riverbank, dune slack |
| 4 | **Raupō** | dark strap leaves, brown spikes | open water margin |
| 5 | **Harakeke** / flax | stiff blue-green fans, black flower stalks | swamp |
| 6 | **Tī kōuka** / cabbage tree | the most readable native silhouette there is | everywhere damp-ish |
| 7 | **Kahikatea** | tall narrow spire | swamp forest |
| 8 | **Rimu** | weeping emergent | lowland forest |
| 9 | **Tōtara** | massive dark fluted crown | dry ground forest |
| 10 | **Tawa** | rounded canopy — the default forest | lowland and hill |
| 11 | **Rewarewa** | narrow upright spire, red flowers | lowland forest |
| 12 | **Mamaku** / tree fern | **THE ERA SIGNAL** | warm forest only |
| 13 | **Nīkau** | palm silhouette; second era signal | warm forest only |
| 14 | **Kōwhai** | golden flowers — the seasonal colour beat | forest margin |
| 15 | **Kawakawa** | heart leaves; the forest shrub layer | forest floor |
| 16 | **Mānuka** | fine grey-green, white flowers | shrubland |
| 17 | **Bracken** | the post-disturbance ground cover | anywhere bare |
| 18 | **Mingimingi** | grey divaricate tangle | grey scrub, both eras |
| 19 | **Short tussock** | pale straw clumps — **cold-only** | glacial open country |
| 20 | **Black beech** | dark, dense, small-leaved | ranges; survives the cold |

### 2.1 The plant table — the whole ecology, in one data structure

Five columns. Nothing else.

```js
// wet 0=dry sand → 1=standing water · elev 0=sea → 1=summit
// open 0=closed forest → 1=fully open (cold) · bare: does it colonise raw ground?
// h: 1 ground · 2 shrub · 3 canopy (9–15 m) · 4 emergent (30 m+)
spinifex     wet .00–.30  elev .10–.16  open ≤1.00  bare✓  h1
pingao       wet .00–.40  elev .10–.16  open ≤1.00  bare✓  h1
toetoe       wet .40–.90  elev .10–.35  open ≤1.00         h2
raupo        wet .85–1.0  elev .10–.25  open ≤0.80         h2
harakeke     wet .60–.90  elev .10–.30  open ≤0.80         h2
ti_kouka     wet .30–.90  elev .10–.35  open ≤0.90         h3
kahikatea    wet .70–.95  elev .12–.30  open ≤0.40  bare✓  h4
rimu         wet .35–.70  elev .15–.45  open ≤0.35  bare✓  h4
totara       wet .15–.50  elev .15–.45  open ≤0.50  bare✓  h4
tawa         wet .30–.80  elev .12–.40  open ≤0.35         h3
rewarewa     wet .25–.60  elev .15–.45  open ≤0.40         h3
mamaku       wet .45–.90  elev .12–.45  open ≤0.15         h3   ← era signal
nikau        wet .40–.85  elev .12–.35  open ≤0.15         h2   ← era signal
kowhai       wet .20–.60  elev .12–.40  open ≤0.60         h3
kawakawa     wet .35–.80  elev .12–.40  open ≤0.25         h2
manuka       wet .10–.85  elev .12–.55  open ≤0.85  bare✓  h2
bracken      wet .15–.70  elev .12–.50  open ≤0.90  bare✓  h1
mingimingi   wet .10–.70  elev .12–.55  open ≤1.00         h2
tussock      wet .05–.60  elev .12–.70  open ≥0.35         h1   ← cold-only
black_beech  wet .20–.60  elev .25–.60  open ≤0.75         h3
```

Note the symmetry that does the era work: **mamaku and nīkau have a low `open` ceiling;
tussock has an `open` floor.** Turn the climate cold and the tree ferns and palms drop
out while tussock appears — no special-casing, no scripted transition.

---

## 3. The mechanical core

Everything above runs on **two new per-cell fields, one global scalar, and one function.**
That is the entire ecology expansion.

### 3.1 Two new fields (per cell, alongside the existing `heightMap`)

| Field | What | How it's computed |
|---|---|---|
| **`wet`** | 0 dry → 1 standing water | Once per re-bake, from distance-to-water and height above the river corridor. Cheap, static between terrain updates. |
| **`bare`** | 0 vegetated → 1 freshly disturbed | Set by `disturb()`. **Decays toward 0** over sim-time. This one number *is* the successional clock. |

### 3.2 One global scalar

**`glacialIndex`** — 0 warm, 1 cold. A low-frequency oscillator over `yearsBP` (≈ three
cycles across the window). It drives, all as simple coefficients:

- sea level → coastline and dune extent
- snowline → existing `SeasonManager` behaviour
- **`open`** per cell = `glacialIndex` × topographic exposure

That last line is the whole "frost and wind open the landscape" finding, collapsed into
one multiply. **Exposure** is just `1 − shelter`, where shelter is high in valleys and
gullies and low on ridges and flats — which reproduces the patchy mosaic and the
sheltered refugia the pollen records show, for nothing.

### 3.3 One function

```js
disturb(x, y, radius, type)   // type: 'sand' | 'flood' | 'ash' | 'gale'
```

- Sets `bare` in the affected cells.
- `'sand'` also **displaces material ESE** — the fixed north-westerly, always.
- `'ash'` also sets a temporary `growthPulse`, **weighted toward high-`wet` cells.**
  That single weighting is finding #4: the swamps bloom.
- Plants with `bare✓` establish immediately in bare cells. Everything else waits for
  `bare` to decay.

That's it. Four disturbance types, one code path, and the four buttons are four calls
into it.

---

## 4. The four buttons

| Button | Call | Instant | Aftermath |
|---|---|---|---|
| **① Deep time ▶▶** | advance `yearsBP` fast | timeline runs; `glacialIndex` swings | tree ferns and palms drop out and return; tussock comes and goes; coast walks out and back; **gorge deepens** |
| **② Growth 🌱** | `growthPulse` scaled by cell `wet` | everything greens — **but by different amounts** | wet ground responds hard, the dry NW downlands barely at all |
| **③ Storm ⛈** | `disturb('sand')` at the coast + `disturb('flood')` on the river + `disturb('gale')` in the forest | sand jumps ESE, shingle goes bare, a few emergents fall, harrier is distracted | **spinifex and pīngao grow into the new sand**; kahikatea seeds the fresh silt |
| **④ Eruption 🌋** | ramped ash sweep, then `disturb('ash')` map-wide | canopy greys and thins — looks like a disaster | **swamps bloom vivid green and stay that way**; forest returns over the following minutes |

**Two changes from v1 worth flagging:**

- **Storm is no longer just "stall the predator."** It's the same button doing three
  habitat-appropriate things at once, which is what makes finding #5 visible. Predator
  distraction stays as a side effect.
- **Eruption is no longer a hard `loadLevel()` reset.** It's a big `disturb('ash')` with
  a wetland-weighted growth pulse. Cheaper *and* more accurate — and it means the
  visitor watches the recovery instead of a scene change. Keep the ramped flash and the
  attract-loop reset as a separate, rarer event.

---

## 5. The moa cast as the legend

Four moa, already planned. The change is what they're *for*: they make the vegetation
readable to someone who can't tell a podocarp from a beech.

| Species | Habitat preference | Visible when |
|---|---|---|
| **NI giant moa** *Dinornis novaezealandiae* | tall wet forest | warm |
| **Little bush moa** *Anomalopteryx didiformis* | closed wet forest | warm |
| **Mantell's moa** *Pachyornis geranoides* | dry forest and shrubland | **cold** |
| **Coastal moa** *Euryapteryx* | coast and dunes | follows the shoreline |

Habitat partitioning is sourced, not invented. Implementation is one line each — read
the same `wet` / `elev` / `open` fields the plants read.

**One counter-intuitive touch worth having:** add the **North Island goose** as
ambient-only, abundant in cold phases. Open-country grazer, present in the Te Ahu a
Tūranga bones held in this building. It makes the glacial map *busier* rather than
emptier — cold is not death.

**Predator:** Eyles' harrier / kērangi, unchanged, tracking total prey biomass.

---

## 6. Art direction doing the work mechanics can't

Three findings that are too slow or too subtle to mechanise, but free as look:

1. **Two-layer canopy.** Scattered emergents at 30 m+ over a continuous canopy at only
   9–15 m. Draw it; don't simulate it. It's the single most distinctive fact about this
   forest and modern remnants don't look like it.
2. **Dune shape follows the plant.** Spinifex builds smooth 6 m dunes at 14–16°; pīngao
   builds low convex ones under 3 m. If dune sprites vary with the dominant binder, the
   coast reads correctly with no extra system.
3. **Buried logs.** Dead trunks left behind when sand or water takes a forest. One
   sprite, high payoff — it's the recurring motif in every dive, and it makes the
   *history* of a cell visible.

---

## 7. Build phases

Phases 0 and 1 are done. Revised from here.

| Phase | Work | Notes |
|---|---|---|
| **2 — Deep time** | `timeScale` + `yearsBP` mapping, Button 1, timeline playhead and era bands | Unchanged from v1 |
| **3 — Terrain (simplified)** | Uplift field + antecedent gorge incision + `seaLevel(t)` on the square map; interval re-bake | **Cut from v1:** authored moisture keyframes. `wet` is derived, not painted. This was the risky phase and it's now much smaller. |
| **4 — The three fields** | `wet` derivation, `glacialIndex` oscillator, `open = glacialIndex × exposure`; hook `glacialIndex` to sea level and snowline | Small. Mostly coefficients on `SeasonManager`. |
| **5 — Twenty plants** | Art for 20 species; the §2.1 table; drive `spawnPlants()` off `wet`/`elev`/`open` instead of biome index | **The long pole is art, not code.** Start it in parallel with Phase 2. |
| **6 — Disturbance** | `bare` field + decay, `disturb()`, wire Buttons 2–4 | The heart of the ecology. One function. |
| **7 — Moa cast** | Four moa reading the same three fields; NI goose ambient; harrier tuning | |
| **8 — Kiosk hardening** | Photosensitivity sign-off, accessibility, touch targets, lockdown, performance under fast-forward, audio | Unchanged from v1 |

**Critical path is Phase 5 art.** Twenty sprites (plus seasonal and era variants) is the
only item here with a long lead time. Everything else is days, not weeks.

---

## 8. What we are deliberately not building

Listed so the cuts are visible and reversible. All of it is preserved in the deep dives.

| Cut | Why | Where it lives |
|---|---|---|
| **Fertility as a second axis** | Invisible as such. Folded into what Growth does. | `..._WETLAND.md` §8 |
| **"Light at ground level" field** | Governs four systems, but a visitor sees none of them. Becomes art direction. | `..._OPEN.md` §6.2 |
| **Five wetland classes** (bog/fen/swamp/marsh/seepage) | Collapsed into the single `wet` axis. | `..._WETLAND.md` §2 |
| **The 1.8 m zonation** | Real and beautiful; needs a height-above-water-table field the screen can't show. | `..._WETLAND.md` §3 |
| **Frost as its own parameter** | Folded into `open`. Same result, one fewer field. | `..._OPEN.md` §4.3 |
| **Podocarp cohort model** | Reduced to `bare✓` on the three podocarps — they seed on raw ground, and nowhere else. Same behaviour, no cohort bookkeeping. | `..._LOWLAND.md` §4 |
| **Dune phase chronology** (Koputaroa, Foxton, Motuiti, Waitārere) | A timeline pop-up, not a mechanic. | `..._COAST.md` §2 |
| **Divaricate / moa-browse debate** | One divaricate silhouette (mingimingi). No browse mechanic. | `..._LOWLAND.md` §7 |
| **17 plant species** | Silhouette-indistinguishable at sprite scale, or redundant. Notably pukatea, mātai, ngaio, akeake, māhoe, tūpari, *Dracophyllum*. | all four dives |
| **Then-and-now** | Curator's context. Not on screen — but see §9.3. | `..._LOWLAND.md` §8 |
| **Fire** | **Not a cut — a correction.** No ignition source in this window. Volcanic only. | `..._OPEN.md` §3.3 |

---

## 9. Open decisions

1. **Does the timeline read as an arrow or a wave?** Uplift accumulates; climate
   oscillates about three times. A thin monotonic uplift band under an oscillating
   climate band shows both, but it's a design choice and it affects the whole top zone.
2. ~~Window end — 50 ka or 25 ka?~~ **Decided: ~25.5 ka, ending on Ōruanui.**
3. **Do the absences get acknowledged?** The installation doesn't depict human
   occupation — agreed. But a single quiet end-card would carry the strongest material in
   the research (97% of the wetland gone, under 5% of the plains vegetation) without
   depicting the transition. Curatorial call, not technical.
4. **Does the sibling landform screen already carry the geology?** If it does, this
   screen can lean further ecological than v2 does. Worth confirming before Phase 3.
5. **Mana whenua co-design** — unchanged: naming, narration, story framing, and any use
   of the Te Ahu a Tūranga bone story.

---

**Reference:** `TEMANAWA_ECOLOGY.md` (outline) · `TEMANAWA_ECOLOGY_COAST.md` ·
`TEMANAWA_ECOLOGY_WETLAND.md` · `TEMANAWA_ECOLOGY_LOWLAND.md` ·
`TEMANAWA_ECOLOGY_OPEN.md` · `TEMANAWA_FAUNA.md` · `TEMANAWA_RESEARCH.md` ·
`TEMANAWA_CONCEPT_ECOLOGY_FIRST.md` (the counterfactual) · `TEMANAWA_PLAN.md` (v1)
