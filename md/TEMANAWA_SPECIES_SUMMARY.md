# Te Manawa — Species and Asset Summary

**One page for the whole cast.** A join across `TEMANAWA_PLAN_V2.md` §2 and §5 (what's
in) and `TEMANAWA_BUILD_V3.md` §4 (what it costs), with the **ecological role** column
added — that's the one thing scattered across the five deep dives and consolidated
nowhere.

Asset counts are taken from `..._BUILD_V3.md` §4 and are not restated independently. If
they diverge, that document wins.

---

## 1. At a glance

| | Count |
|---|:--:|
| **Plant species drawn** | **10** |
| **Plant species as ground palette** | **7** |
| **Animal species** | **7** (+2 dimorphism partners, +1 conditional) |
| **Total assets** | **158** |
| **In hand** | **45** |
| **New** | **113** |

Coastal moa, if built: **163 / 118 new**.

---

## 2. Flora — the ten drawn species

`bare✓` = colonises raw ground, so it appears immediately after a disturbance rather
than waiting for `bare` to decay.

| # | Species | Ecological role | Field range | Tier / assets |
|---|---|---|---|:--:|
| 1 | **Mamaku** *(tree fern)* | **Era signal #1.** Tree-fern pollen is **0.7%** at the LGM, so its presence/absence is the cleanest warm/cold readout on the map. Ecologically a sub-canopy tree fern of moist forest; joins the canopy in the late mānuka succession | `open ≤0.15` · h3 | **S / 5** |
| 2 | **Kahikatea** | **The swamp forest, and the disturbance recruiter.** Spongy roots oxygenate in waterlogged ground; buttressed trunk; pneumatophores. Critically it is *not* a climax tree — it colonises raw wet alluvium exposed when the river moves | `wet .70–.95` · `bare✓` · h4 | **S / 5** |
| 3 | **Tōtara** | **Dry-ground podocarp.** Levées and free-draining terraces, out to the climatic forest/grassland margin on the droughty NW downlands. Strong light response in gaps, so it leads recovery in large openings | `wet .15–.50` · `bare✓` · h4 | **S / 5** |
| 4 | **Tawa** | **The default state the map decays toward.** In every forest type except beech; takes over wherever podocarps fail to recruit. Gives every disturbance button something to interrupt | `open ≤0.35` · h3 | **S / 5** |
| 5 | **Tī kōuka** | **The swamp-scrub band** between flax and swamp forest in the Moutoa zonation; also stable dunes and forest margin. The most readable native silhouette there is | `wet .30–.90` · h3 | **S / 5** |
| 6 | **Harakeke** | Swamp zonation, the band above raupō. **Caveat:** it expanded *after* European drainage, so keep it modest — toetoe held the wetter ground pre-human | `wet .60–.90` · h2 | **M / 3** |
| 7 | **Nīkau** | **Era signal #2.** Understorey palm of warm lowland forest — Esler records it at Himatangi Bush and beneath the gorge tawa canopy | `open ≤0.15` · h2 | **M / 3** |
| 8 | **Mānuka** | Shrubland, in **two settings**: permanent on infertile, dry, exposed or poorly drained ground, and seral for 30–70 years after disturbance. Pioneer | `bare✓` · h2 | **M / 3** |
| 9 | **Black beech** | **The glacial refugium tree.** *Fuscospora* dominates LGM tree pollen; survives the cold in sheltered pockets. The only beech in Esler's survey area (Aokautere, ~526 ha, leached terrace soils) | `elev .25–.60` · h3 | **M / 3** |
| 10 | **Kōwhai** | Forest margin, and **the seasonal colour beat** — the flowering state is the entire reason it's on the list. Also a documented moa food | `open ≤0.60` · h3 | **K / 4** |

**41 sprites**, plus 4 shared micro-textures = **45 plant assets. 11 in hand, 34 new.**

---

## 3. Flora — the seven ground-palette species

Ground colour plus a shared tiling micro-texture in the terrain bake. No entities, no
per-frame draws. From directly overhead, ground cover *is* colour.

| Species | Ecological role | Field range |
|---|---|---|
| **Spinifex** | **Primary foredune binder.** Builds smooth even dunes ~6 m at **14–16°**; rhizomes run downslope to the dune base and prevent wave erosion. **Thrives on burial** — this is finding #5, the sand greening over after a storm | `wet .00–.30` · `bare✓` |
| **Pīngao** | Secondary binder. Low convex dunes **under 3 m at 8–14°**; only partially traps sand, so the dune **stays mobile**. The coast's colour accent | `wet .00–.40` · `bare✓` |
| **Toetoe** | Wet ground, riverbank and dune slack. **The pre-European wet-ground dominant** | `wet .40–.90` |
| **Raupō** | Open-water margin. Carries **finding #4** — the ash-fertilised swamp bloom | `wet .85–1.0` |
| **Bracken** | Post-disturbance coloniser; **the visible face of `bare` decaying.** As *landscape* cover it is fire-induced and post-1280 CE, but as a coloniser of raw ash and windthrow it belongs in this window | `bare✓` |
| **Short tussock** | **The glacial ground layer. Cold-only.** *Microlaena*, *Rytidosperma*, *Poa anceps* — confirmed on the Manawatū sand plains, though the fire-induced version is out of period; this is the glacial-mosaic one | **`open ≥0.35`** |
| **Grey scrub** | **The cold-phase shrub layer**, absorbing mingimingi and tauhinu. A genuinely natural type — dry ground, frosty river terraces, exposed hill country | **`open ≥0.25`** |

> **The symmetry that does the era work:** mamaku and nīkau have an `open` **ceiling**;
> tussock and grey scrub have an `open` **floor**. Turn the climate cold and the tree fern
> and palm sprites drop out while a straw-pale wash spreads across the map. No
> special-casing, no scripted transition.

---

## 4. Fauna — the cast

| # | Animal | Ecological role | Peaks | Assets |
|---|---|---|---|:--:|
| 1 | **NI giant moa ♀** *Dinornis novaezealandiae* | Tall wet-forest browser. **The headline** — the tallest bird that ever lived | **warm** | 5 |
| 2 | **NI giant moa ♂** | **The dimorphism pair.** Females were so much larger the sexes were first described as separate species. Must be a different *build*, not a scaled copy | warm | 5 |
| 3 | **Little bush moa** *Anomalopteryx didiformis* | Closed-forest understorey browser; **ground ferns are an important part of the diet**, and it may have dispersed fern *spores*. Not a seed disperser — gizzards destroy anything over 3.3 mm | **warm** | 6 ✓ |
| 4 | **Mantell's moa** *Pachyornis geranoides* | **Dry forest and shrubland — the cold-phase marker.** Ancient DNA has its populations holding the same ground for hundreds of thousands of years | **cold** | 5 |
| 5 | **Juvenile moa** | Recruitment made visible — **and the harrier's actual prey class** | both | 5 |
| 6 | **Kērangi** *Circus teauteensis* | **Sole apex predator of the North Island.** Goshawk-build forest and forest-edge hunter with a **40 kg prey ceiling**, so it constrains moa *recruitment*, not adult survival. **At home in the open phases** — its habitat is dry forest and shrubland, sea level to subalpine | **all** | 20 |
| 7 | **NI goose** *Cnemiornis gracilis* | Large flightless open-ground grazer. **In the Te Ahu a Tūranga bones held in this building** | **cold** | 5 |
| 8 | **Kererū** | Three jobs: **the only large-seed disperser** (then and now), **the harrier's favoured prey**, and the recognition anchor | warm | 5 |
| 9 | **Huia ♀/♂** | Hill-forest insectivore; **the Manawatū's own bird**. The second free dimorphism pair — female's long curved bill against the male's chisel | warm | 6 |
| 10 | **Egg / nest** | The recruitment step the harrier acts on | — | 2 |
| — | **Coastal moa** *Euryapteryx* *(conditional)* | Coast and dune band; follows the shoreline as sea level moves | all | +5 |

**64 assets, 31 in hand, 33 new.** (Harrier 16, little bush moa 6, juvenile 4, generic
moa 5 are the ones drawn.)

> **Cold is busier, not emptier.** Mantell's moa, the NI goose and the harrier all peak
> or hold in the glacial. The art has to support that or the whole cold-phase reading
> collapses into "landscape empties out," which every document in this repo contradicts.

---

## 5. Everything that isn't a species

| Group | Assets | What it covers |
|---|:--:|---|
| **Terrain and landform** | **21** | 2 authored heightmaps · 3 spinifex dune forms · 3 pīngao dune forms · 3 buried logs · 2 shingle bars · ash mantle · 2 water-edge · 5 ground textures |
| **Disturbance FX** | **12** | 3 ash · 2 sand drift *(always ESE)* · 2 flood/silt · 2 fallen emergent · 3 storm cloud + bolt ✓ |
| **UI** | **16** | 8 button glyphs · playhead · 3 era bands · 2 eruption markers · 2 attract prompt |

**Terrain and UI are both at zero.** That's 37 of the 113 new assets that nobody has
started and — per `..._BUILD_V3.md` §4.6 — nobody is currently thinking of as art.

---

## 6. The full asset ledger

| Group | Total | In hand | **New** |
|---|:--:|:--:|:--:|
| Plants | 45 | 11 | **34** |
| Fauna | 64 | 31 | **33** |
| Terrain / landform | 21 | 0 | **21** |
| Disturbance FX | 12 | 3 | **9** |
| UI | 16 | 0 | **16** |
| **Total** | **158** | **45** | **113** |

**Three constraints that apply to every asset in the set:**

1. **Drawn from directly overhead.** Silhouette from above beats silhouette from the
   side — a cabbage tree is a starburst, a nīkau is a radial crown, a tree fern is a
   frond star.
2. **The wind never changes direction.** Every asymmetric silhouette, every shadow and
   every dune form leans the same way, in all eras. Cheap, but not free — it has to be
   in the brief before anything is drawn.
3. **Footprint rule.** `h2` at 64², `h3` at 96², `h4` at 234×500 with `anchor: 'base'`;
   `h4` sorts above `h3`. This is what produces the two-layer canopy — scattered
   emergents over a continuous 9–15 m canopy — without simulating it.

---

## 7. Cut, in one line each

**Plants (20).** Rimu *(duplicates tōtara from above)* · kawakawa *(occluded under
canopy)* · rewarewa *(a spire is a dot from above)* · mingimingi *(folded into grey
scrub)* · pukatea, mātai, ngaio, akeake, māhoe, oioi, *Dracophyllum*, tutu, pōhuehue,
tauhinu, rangiora, tūpari, mountain flax, pūrei, *Raoulia*, kānuka *(absorbed into
mānuka)*.

**Animals.** Haast's eagle *(South Island only)* · swamp harrier and pūkeko *(arrived
after 1280 CE — and the harrier would have been **competitively excluded** by kērangi
anyway)* · tuatara, long-tailed bat, adzebill, whēkau, kiwi, kākāpō, matuku, Finsch's
duck *(all pass the filters; all are pool, not cast)*.

The full pool, with visual hooks, is in `TEMANAWA_FAUNA_POOL.md` §2–3 if the
illustrator wants more.

---

**Reference:** `TEMANAWA_PLAN_V2.md` §2, §5 · `TEMANAWA_BUILD_V3.md` §4 ·
`TEMANAWA_SPRITE_BRIEF.md` · `TEMANAWA_FAUNA_POOL.md` · `TEMANAWA_SPECIES_KERANGI.md` ·
the five deep dives.
