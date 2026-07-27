# Te Manawa — Deep Dive 2: Wetlands, Lagoons and Swamp Forest

Companion to `TEMANAWA_ECOLOGY.md` §2.1, §2.5, §2.6 and §4.5. Ecology first; build
implications marked `[BUILD]`. The four interaction tie-ins you asked for are §5
(river/gorge), §6 (eruptions), §7 (storms) and §8 (Plant Growth).

**Headline:** the wetlands are not a habitat that sits *beside* the river — they are
what the river *makes*. Uplift feeds sediment down the gorge, the river builds levées,
the back-swamps behind the levées pond and drown their own forest, peat accumulates,
the ground subsides, and the cycle restarts. Every lever the installation already has
— river, growth, storm, eruption — plugs directly into that loop.

---

## 1. Scale — what was here

| Measure | Figure |
|---|---|
| Esler's survey area | **>8,000 ha of swamp, over 8% of the land surface** — and he flags it as an underestimate, because swamp margins were poorly mapped |
| Makerua Swamp alone | **~5,800 ha** |
| Manawatū–Whanganui region, pre-human | **264,511 ha of wetland** |
| Manawatū–Whanganui region, today | **6,983 ha — under 3% remaining** |

Named systems: **Makerua** (the Opiki plains, between the Manawatū and the
Linton–Tokomaru terraces), **Moutoa** (Stewart's survey note: *"The Great Swamp. Flax,
raupo, &c, deep soil with imbedded timber"*), the **Taonui basin** group (Taonui,
Kōwhai, Te Waiti, and a swamp Stewart recorded as **Te Pukakurau**), and the swamps
strung around the **coastal lagoons** (Pukepuke, Koputara, Kaikokopu).

`[BUILD]` A 97% loss is the strongest "then and now" figure in any of this research.
If the installation ever wants one contrast beat, this is it — and unlike most such
statistics, the *then* is what we're actually rendering.

---

## 2. The modern vocabulary — Esler's "swamp" is five things

Esler uses "swamp" for everything wet. Johnson & Gerbeaux (2004) is the standard
classification now, and it separates wetlands on **water source and nutrient status**,
not just wetness:

| Class | Water origin | Flow | Water table | Substrate | Nutrients | pH |
|---|---|---|---|---|---|---|
| **Bog** | **rain only** | almost nil | near surface | peat | very low | **3–4.8** |
| **Fen** | rain + groundwater | slow–moderate | near surface | mainly peat | low–moderate | 4–6 |
| **Swamp** | **surface water + groundwater** | moderate | **above surface in places** | peat and/or mineral | **moderate–high** | 4.8–6.3 |
| **Marsh** | groundwater + surface water | slow–moderate | usually below surface | usually mineral | moderate–high | **6–7** |
| **Seepage** | surface and/or groundwater | **moderate–fast** | just above to below | mineral to peat | low to high | varies |

**The Manawatū is overwhelmingly *swamp*** — fed by river flooding and groundwater,
moderately fertile, peat *and* mineral. That's why it grew kahikatea forest rather
than the low restiad bog vegetation of, say, the Waikato peat domes. Plus **marsh** on
the river margins, **seepage/flush** in the hill country (§9), **shallow water** in
the lagoons, and **saltmarsh** at the estuary.

> `[BUILD]` **Wetland is a two-axis space, not a wetness slider.** Water table
> position *and* fertility. That second axis is the one currently missing from the
> sim, and it is exactly what eruptions move (§6) and what the Growth button should
> control (§8).

---

## 3. The zonation — 1.8 metres decides everything

Poole & Boyce surveyed the Moutoa Estate in 1949 and recorded the full sequence. Esler
reproduces it, and it is the single most useful data structure in the source material:

| Elevation band | Vegetation | Reads as |
|---|---|---|
| free water | ***Carex secta*** (pūrei) standing in open water | dark tussock islands on water |
| water's edge | **raupō** | dense dark-green strap leaves, brown spikes |
| just above | **harakeke** (*Phormium tenax*) | fans of stiff blades, tall flower stalks |
| higher again | **swamp scrub** — *Cordyline australis* + *Coprosma* spp. (*propinqua*, *robusta*, *areolata*) | tī kōuka silhouettes over grey-green tangle |
| levée top | **kahikatea–pukatea semi-swamp forest** | canopy |

**The whole sequence spans about 1.8 m of elevation.** Poole & Boyce listed 66 native
species on the river bank, 55 of them in forest; the semi-swamp flora held about 40.

`[BUILD]` This is a **gift for a heightmap-driven sim**. You already classify biomes
from elevation. Here the entire wetland gradient is a 1.8 m band — so it needs a
*local* elevation reference (height above water table), not the global 0–1 elevation.
Get that one derived field and the zonation falls out for free.

**One correction to carry.** Esler notes harakeke **expanded after drainage and
stopbanking**, spreading onto ground previously too wet for it. Kettle's 1842 comment
implies toetoe held the wetter sites. So the flax-dominated Manawatū of the
photographs is partly an artefact of European drainage — **pre-European, put more
toetoe and raupō in and less harakeke.**

---

## 4. Kahikatea–pukatea swamp forest — trees that live in standing water

**How they do it.** Kahikatea has spongy roots that oxygenate the rootlets, buttressed
trunks for anchorage in saturated ground, and **pneumatophores** — Cockayne's
description of a Levin reserve, which Esler says would have fitted the Manawatū
semi-swamp forest, is of *"gigantic roots putting forth abundant pneumatophores"*, and
of Round Bush at Foxton:

> *"tall white-pine forest has developed, although the [ground] is completely covered
> with stagnant water. One can walk through the forest dryshod only by treading on the
> gigantic tree roots which raise themselves above the soil and water."*

**Structure** (Round Bush, the best-preserved example): pukatea to **~28 m at ~4.7
stems per 100 m²**, most 0.3–0.6 m diameter; **kiekie festooning to 18 m**; clumps of
*Astelia hastata* in the crowns *"looking like huge birds' nests"*; *Griselinia lucida*
prominent; four *Metrosideros* vines (*perforata*, *diffusa* high into the canopy;
*fulgens*, *colensoi* lower). At Himatangi Bush the understorey runs to māhoe,
pigeonwood, tītoki, mapou, tī kōuka, kaikōmako, *Dicksonia squarrosa* and **nīkau**,
interlaced with supplejack.

**Microtopography is the whole game.** The floor is mound-and-hollow. The wettest
hollows carry almost nothing — *Ranunculus rivularis* in the streamlets, *Callitriche*
and *Scirpus inundatus* across the wet mud. **Mounds standing above winter water level
support a wide range of species**, and **supplejack thickets act as browse refugia**,
physically protecting whole assemblages from grazing animals.

**Light, not just water.** Esler is explicit that understorey richness tracks *both*:
*"Wet and dark interiors limit the range of shrubs and small plants while drier and
better-lit environments are more favourable."*

### 4.1 The crucial point: kahikatea is a disturbance specialist

Modern ecology is clear that kahikatea dominates **fertile, silty floodplains and low
terraces** — and that **river channels changing course destroy the vegetation cover and
expose new ground for kahikatea to colonise.** It is not a climax species patiently
holding ground. It is a coloniser of raw wet alluvium that happens to live 500 years.

`[BUILD]` **Kahikatea should require river disturbance to recruit.** If the river
stops moving, kahikatea stops regenerating and the stand ages out. That single rule
ties the river system directly to the forest system and gives the meander/avulsion
model an ecological consequence instead of being scenery.

---

## 5. Tie-in — the river forming between the ranges

**The tectonic story** (already the installation's headline): the Manawatū initially
flowed west across a landscape with **no surface expression of the present ranges**.
The Tararua–Ruahine greywacke began rising ~3 Ma, but **most uplift has occurred in
the last one million years**, as a wedge of basement rock thrust up between two major
faults. The river cut down as fast as the rock rose. Te Āpiti's **bottom walls are
vertical while the upper walls are progressively less steep** — read as **uplift
accelerating**.

**The sediment loop this drives — and this is the part that makes wetlands:**

```
uplift → steeper gradients → more erosion → sediment down the gorge
      → shingle bed as far as Palmerston North, fine silt below
      → the river builds LEVÉES along its own banks
      → back-swamps pond BEHIND the levées (the Taonui basin is literally
        "a basin formed within the levées of the Manawatū and the Ōroua")
      → forest on the levée, swamp behind it
      → peat accumulates (~1 mm/yr order), ground subsides
      → the river avulses to a new course; the old swamp drowns or drains
      → repeat
```

**The drowned forest.** At "Go-to-Hell Swamp" between East Base trig and Himatangi
Bush, tōtara **stumps with roots *in situ***, spaced 1.8–3.6 m apart, stand under
1.8 m of peat, with mātai, rimu, kahikatea and maire identifiable among them. Esler
rejects the local "a gale snapped them" explanation and argues a **rising water table
killed the forest**, probably because the river's outfall was restricted — by sand at
the mouth, or by growth of the **Whirokino anticline**, a small fold running NNE which
shows up in the drainage pattern, the warped coastal plain, and seismic and gravity
data (Rich 1959; Te Punga 1957).

`[BUILD]` **Tectonics dam the river; the dammed river drowns its own forest; the
drowned forest becomes peat.** That is a complete causal chain from the uplift model
you're already building to a visible vegetation change, and it is local and evidenced
rather than invented. It also produces the buried-log motif that recurs at the coast
(Deep Dive 1 §7): **the landscape keeps eating forest and spitting out logs.**

**And the interglacial extreme:** during the Holocene transgression the sea pushed
*into* the lower valley, an estuary reaching **east to Shannon and north to Opiki**.
At a highstand, "wetland" isn't a patch on the plain — it's a drowned river valley
running most of the way across the map.

---

## 6. Tie-in — what a northern supervolcano actually does

This is the finding that should most change your current design. **An eruption is not
a reset to zero. In wetlands it is a fertility pulse.**

**The best-resolved case is Ōruanui itself** (~25.5 ka, >1,100 km³ — already in
`TEMANAWA_RESEARCH.md`). Millimetre-scale pollen analysis at Onepoto maar palaeolake,
~240 km from source, around an intact 3 cm layer of Kawakawa–Ōruanui Tephra, gives an
almost year-by-year picture:

1. **Immediately after:** dominant canopy pollen declines, grasses, herbs, ferns and
   shrubs increase. This is **brief part-defoliation of the canopy — under 10 years** —
   letting light to the floor and releasing the sub-canopy.
2. **Then:** **more wetland and aquatic plants at the site for about 60 years.**
3. **After ~60 years:** vegetation had recovered and returned to normal.

**Taupō 1850 BP** (30,000 km² of airfall, 20,000 km² of ignimbrite) adds the longer
view: species responded **individualistically**, and the modern altitudinal sequence of
forest types in the central North Island **was only assembled in the last 1,800 years
as a consequence of that eruption**. The forest that grows back is not the forest that
was there.

**And the peat responds hardest of all.** At Moanatuatua Bog, carbon accumulation
jumped from a background **23 g C m⁻² yr⁻¹ to 110 g C m⁻² yr⁻¹ following Taupō Tephra**,
and to 84 after Kaharoa. **Tephra fertilises peatlands, and the effect is roughly
fourfold.**

> **Honest caveat on Whakamaru.** There is no pollen record of this resolution for
> ~349 ka — nothing survives to be sampled that finely. Everything above is scaled up
> from Ōruanui and Taupō. Given Whakamaru is larger and closer to the range of the
> Rangitawa Tephra's known distribution, "bigger and longer" is a reasonable
> extrapolation, but it should be labelled as inference, not measurement.

### `[BUILD]` Redesigning the Eruption button

Current behaviour is a ramped ashfall into `loadLevel` — a reset. Replace with a
**five-stage sequence** that is more interesting *and* more accurate:

| Stage | Duration (sim-scaled) | Effect |
|---|---|---|
| **1. Fall** | days | Ash deposits. Visual only. |
| **2. Defoliation** | **<10 years** | Canopy species knocked back, **not killed**. Light reaches the floor. Ground layer, ferns and shrubs surge. |
| **3. Wetland surge** | **~60 years** | **Wetland and aquatic vegetation expands.** Fertility spike; peat accumulation up ~4×. The swamps *grow*. |
| **4. Re-sort** | centuries | Species return individualistically — the composition that comes back is **not** the composition that left. Randomise canopy composition within the habitat's species pool. |
| **5. Sediment pulse** | decades–centuries | Ash-loaded catchments aggrade the river → channel change → **new raw alluvium → kahikatea recruitment window** (§4.1). |

That last stage is the payoff: **the eruption ends by handing the river the material it
needs to make new swamp forest.** Eruption, river and forest close a loop instead of
running as three unrelated systems, and the visitor sees the wetlands *bloom* after the
ash rather than everything simply dying — which is both truer and more watchable.

---

## 7. Tie-in — storms in the lowland are floods

At the coast a storm moves sand (Deep Dive 1 §10). Inland, the same storm is a flood,
and floods are the wetland's routine disturbance.

- **Shingle beds:** **more than 70 species** establish on the shingle domes at low
  flow. *"These plants of open habitats usually have short occupancy, most being washed
  away by the next flood or dying due to submergence."* The only plant specific to the
  habitat is ***Raoulia tenuicaulis* var. *dimorpha***, a flat mat.
- **Levées and back-swamps:** floods spread silt across accretion areas; the levée gets
  higher, the back-swamp gets wetter. The zonation of §3 shifts.
- **Meander cut-offs:** the Foxton loop, cut off in the twentieth century, developed an
  assemblage found nowhere else in the district — slow water, deep silt, tidal but not
  saline.
- **Storm-generated floods in the Manawatū have a documented Holocene record**, so this
  is a real recurrence-interval process, not a hand-wave.

`[BUILD]` **One Storm button, three habitat-dependent effects:**

| Habitat | Storm does |
|---|---|
| **Coast** | advances the dunefield, opens blow-outs, buries the lee *(Deep Dive 1)* |
| **River / lowland** | raises water level, scours shingle bars to bare, deposits silt on levées, occasionally cuts a meander — **opens kahikatea recruitment ground** |
| **Forest / montane** | snaps emergents (the 1936 gale halved emergents in Keebles Bush) |

And the two ends connect: **sand driven inland by coastal storms dams the drainage off
the hinterland and creates the lagoon chain and its swamps.** Esler's lagoons exist
*because* of the dunefield. A long run of storms should therefore visibly *add*
wetland behind the coast while resetting the dune plains in front of it.

Distracting the harrier is fine as a secondary effect, but it is the least interesting
thing a storm does here.

---

## 8. Tie-in — fixing the Plant Growth button

Right now Growth pushes `plant.growth` uniformly. The wetland data gives it three real
axes, and one of them is the obvious candidate for the button.

**The three controls on wetland vegetation:**

1. **Height above the water table** — the §3 zonation. Primary, and it's terrain.
2. **Fertility / nutrient status** — the bog→fen→swamp→marsh gradient, pH 3 to 7. This
   is a genuinely independent axis, and it is **what tephra moves** (§6).
3. **Disturbance recency** — kahikatea and the shingle flora need raw ground; raupō,
   harakeke and toetoe fill in; forest needs decades of stability.

> ### `[BUILD]` Proposal: **Growth should push fertility, not growth rate.**

Same button, same gesture, but it now does something different in every habitat
because the *starting fertility* differs — which is exactly what made the Storm
redesign work at the coast:

| Ground | Baseline | What a fertility push does |
|---|---|---|
| **Peat / bog** | very low, pH 3–4.8 | low sedge and moss → **raupō and harakeke** → swamp scrub. Visible class change. |
| **Alluvium / swamp** | already moderate–high | accelerates the run to **kahikatea–pukatea forest** — the fastest, most dramatic response on the map |
| **Leached terrace** | low (Esler's mānuka country) | mānuka shrubland → broadleaf; **this is where mānuka gives way** |
| **Dune sand** | very low, free-draining | lets **kānuka** and then dune forest establish — Esler's unanswered question of why forest occupied only *some* suitable dunes |
| **Dry downland** | moisture-limited, not nutrient-limited | **little effect** — correctly, because there the constraint is the <914 mm rainfall, not fertility |

That last row matters: a button that visibly *doesn't* work everywhere teaches more
than one that always works.

**Two refinements worth having:**

- **Growth is not uniform within a habitat.** In semi-swamp forest, floor richness
  tracks light: wet-and-dark is nearly bare, drier-and-lit is rich. Modulate understorey
  density by canopy openness, which the eruption sequence (§6 stage 2) already changes.
- **Fertility should decay back.** A pushed fertility value drifting back to baseline
  over sim-decades gives the button consequence without permanence, and it makes the
  tephra pulse a genuinely special event rather than one more press of the same thing.

---

## 9. Hill-country wetlands — small, odd, easy to forget

Esler documents these carefully and nobody else does. In Johnson & Gerbeaux terms they
are **seepages and flushes**.

- **Browns Flat** — a 162 ha basin at the head of the Tiritea Stream with **more than
  32 km of streams in a dendritic pattern**. After the forest went, *Juncus articulatus*
  established in the creeks, **slowed the water, gathered silt, and created habitat for
  many other wetland plants** — a plant engineering its own wetland.
- **Kahuterawa Flat** — flushes containing **the only *Drosera binata* in the district**
  (a sundew), plus *Hypericum japonicum* and a sword-leaved rush, alongside **Sphagnum**
  on the basin floor.

`[BUILD]` These are too small to be their own biome but they give the montane zone a
wetland texture and they're where the rare things live. A **seepage decorator on
concave hillslopes below a break of slope** — which is where groundwater diffuses to
the surface — would be cheap and correct.

---

## 10. `[BUILD]` Flora shortlist — wetland group

> ℹ️ **Input, not commitment.** The built plant list is `TEMANAWA_PLAN_V2.md` §2.
> Kahikatea, harakeke, tī kōuka and nīkau are built as sprites; raupō and toetoe are
> **ground palette**, and pukatea, pūrei and *Raoulia* are not built. This shortlist
> remains the reference for composition and colour.

Ten for the group, two of them already built for the coast.

| Habitat | Species | Read at distance | Shared? |
|---|---|---|---|
| **Open water / lagoon** | **Raupō** | dense dark strap leaves, brown velvet spikes | ✓ coast |
| | **Pūrei (*Carex secta*)** | dark tussock on a pedestal, standing *in* water | — |
| **Swamp / reedland** | **Harakeke** | stiff blue-green fans, tall black flower stalks | — |
| | **Toetoe** | tall cream plumes | ✓ coast |
| **Swamp scrub (carr)** | **Tī kōuka** | the most readable native silhouette there is | ✓ coast, lowland |
| | **Mingimingi (*Coprosma propinqua*)** | grey divaricate tangle, pale blue berries | — |
| **Swamp forest** | **Kahikatea** | tall narrow spire — unmistakable, and it *is* the habitat | — |
| | **Pukatea** | buttressed base, spreading crown, plank roots | — |
| | **Nīkau** | palm silhouette; genuinely surprising in a swamp | — |
| **Shingle riverbed** | ***Raoulia tenuicaulis*** | flat silver mat on grey shingle | — |

**Ground texture, not entities:** kiekie and supplejack tangles (better as a canopy/
understorey overlay), *Sphagnum* and flush turf, the *Callitriche*/*Ranunculus* hollow
flora, floating *Azolla* and *Lemna* on open water.

**Excluded:** willow, *Glyceria maxima*, *Phalaris arundinacea*, gorse, *Spartina* —
all post-European and all dominant in the modern Manawatū wetland. As at the coast,
the honest pre-human wetland looks nothing like the one out the window.

---

## 11. `[BUILD]` Seven things to change or add

1. **Add a "height above water table" derived field**, separate from global elevation.
   The whole §3 zonation is a 1.8 m band; it can't be driven off the 0–1 heightmap.
2. **Add fertility as a second vegetation axis** (bog → fen → swamp → marsh, pH 3–7).
   Everything else in this document depends on it existing.
3. **Repoint the Growth button at fertility**, not growth rate (§8). Different visible
   result in every habitat, including one habitat where it correctly does very little.
4. **Rebuild Eruption as a five-stage sequence** (§6), not a reset — with a **~60-year
   wetland surge** and a **~4× peat/growth pulse** in the middle of it, and a sediment
   pulse at the end that feeds the river.
5. **Make kahikatea require river disturbance to recruit** (§4.1). This is the single
   rule that couples the river model to the forest model.
6. **Give Storm a lowland flood behaviour** — scour shingle to bare, silt the levées,
   occasionally cut a meander — and let coastal storms **create wetland** by damming
   drainage behind advancing dunes (§7).
7. **Add seepage decorators** on concave slopes below a break of slope (§9).

---

## Sources

**Primary:** Esler, A. E. 1978. *Botany of the Manawatu District, New Zealand.* DSIR
Information Series 127 — swamp, semi-swamp forest and stream sections
(`research/01_forests.pdf`, `research/02_forests_2.pdf`). Within it: Poole & Boyce
(1949) Moutoa Estate survey; Poole (1946); survey plans S.O. 10603, 10639, 10987;
Rich (1959) and Te Punga (1957) on the Whirokino anticline.

**Wetland classification and extent**

- [Johnson, P. & Gerbeaux, P. 2004. *Wetland Types in New Zealand*. DOC](https://www.doc.govt.nz/documents/science-and-technical/wetlandtypes.pdf) — Table 2, distinguishing features of wetland classes
- [Makerua Swamp — Wikipedia](https://en.wikipedia.org/wiki/Makerua_Swamp) — ~5,800 ha; drainage from 1884
- [Te Ara — Human impact on the environment, Manawatū and Horowhenua](https://teara.govt.nz/en/manawatu-and-horowhenua-region/page-3) — Moutoa floodway and sluice gates, 1959–62
- [Forest & Bird — extent of the wetlands crisis](https://www.forestandbird.org.nz/resources/world-wetlands-day-forest-bird-release-maps-showing-extent-wetlands-crisis) — 264,511 ha → 6,983 ha for Manawatū–Whanganui
- [Horizons — Revised Regional Wetland Inventory and Prioritisation](https://www.horizons.govt.nz/HRC/media/Media/Reserves%20and%20Projects/BioD2008Revised-Horizons-Region-Wetland-Inventory-and-PrioritisationHRC.pdf)

**River and tectonics**

- [Te Ara — Manawatū River and Gorge](https://teara.govt.nz/en/manawatu-and-horowhenua-places/page-6) and [Features of the landscape](https://teara.govt.nz/en/manawatu-and-horowhenua-region/page-2) — antecedent incision; most uplift within the last 1 Myr; gorge-wall profile as evidence of accelerating uplift
- [Te Āpiti — Manawatū Gorge, environment](https://www.teapiti.co.nz/environment/)
- [Page & Heerdegen 1985. Channel change on the lower Manawatu River. *NZ Geographer* 41: 35–38](https://onlinelibrary.wiley.com/doi/10.1111/j.1745-7939.1985.tb01067.x)
- [Storm-generated Holocene and historical floods in the Manawatu River](https://www.sciencedirect.com/science/article/abs/pii/S0169555X18301132)

**Eruptions and vegetation**

- [Piva et al. 2023. Millimetre-scale pollen analysis … following the ~25.5 ka Ōruanui supereruption. *J. Quaternary Science*](https://onlinelibrary.wiley.com/doi/full/10.1002/jqs.3506) — <10 yr defoliation; **~60 yr wetland/aquatic expansion**; full recovery
- [Wilmshurst & McGlone 1996. Forest disturbance in the central North Island following the 1850 BP Taupo eruption. *The Holocene*](https://journals.sagepub.com/doi/10.1177/095968369600600402) — individualistic species responses; the modern forest sequence assembled only in the last 1,800 yr
- [Rapid carbon accumulation in a peatland following Late Holocene tephra deposition](https://www.sciencedirect.com/science/article/pii/S0277379120304674) — 23 → 110 g C m⁻² yr⁻¹ after Taupō Tephra
- [The 26.5 ka Ōruanui eruption: post-eruptive sedimentary response](https://www.tandfonline.com/doi/abs/10.1080/00288306.2004.9515074)

**Swamp forest ecology**

- [Te Ara — Wetland forests and shrubs](https://teara.govt.nz/en/wetlands/page-3)
- [DOC — Wetland forests](https://www.doc.govt.nz/nature/native-plants/wetland-forests/)
- [Understanding vegetation patterns and processes of a regenerating swamp kahikatea forest, Westland](https://ir.canterbury.ac.nz/items/4cf1ffcf-7a5d-4aaa-be83-8d5643f7c4f1) — channel change as the recruitment mechanism
- [Waikato Regional Council — Kahikatea forest fragments](https://www.waikatoregion.govt.nz/assets/WRC/Forest-Fragment-factsheet-6.pdf)
