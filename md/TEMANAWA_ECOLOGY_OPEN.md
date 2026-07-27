# Te Manawa — Deep Dive 4: Shrubland and Grassland

Companion to `TEMANAWA_ECOLOGY.md` §3.4–3.5. Ecology first; build implications marked
`[BUILD]`. **§3 contains a design correction that changes what we should build.**

**Headline:** this is the weakest evidence in Esler and the sharpest correction from
modern work. He asks — twice — why the sand country carried grassland rather than
scrub, and says he can't answer it. Modern research answers it: **fire**. And that
answer has a hard consequence for us, because our window has no ignition source. **The
grassland Esler describes should largely not appear in the installation.** But the same
body of work hands us a better open-country state — the glacial one, which is real,
dated, far more extensive, and driven by frost and wind rather than burning.

---

## 1. What Esler had, and the question he left open

He is unusually direct about the limits here:

> **"There were grasslands in the Manawatū in Māori times but we know nothing of their
> composition."**

> **"The question of why this land supported grassland rather than scrub is
> unanswered."**

His species list is labelled **"pure conjecture."** The primary evidence is three
sentences from travellers:

- **Wakefield, 1840:** *"We travelled all day through open pasture land, the path
  apparently avoiding the timber parts."*
- **Taylor, 1849:** a level grass plain extending as far as the eye could see.
- **Buick, 1903:** *"a succession of sand-hills, which rose in long undulating ridges,
  like great billows of the sea… grass-covered dunes… there grew in great abundance the
  manuka, toetoe, and tussock, while between the sandy ridges there would sometimes
  nestle acres of rich soil, or perhaps a swampy marsh fringed with green rushes and
  raupo."*

On shrubland he is equally clear that most of it is secondary: it *"developed where
fire or other factors prevented woody vegetation running the full course of succession
to forest,"* and only three cases could **arguably** be called natural — **the wet sand
plains, the river margins, and the Arawaru summit**. Even Arawaru he hedges, noting
that Māori sent smoke signals from it, so the summit may have been cleared.

---

## 2. Modern answer #1 — his conjecture was right

Rogers (1994), surveying North Island seral tussock grasslands, records that
**"*Microlaena stipoides*, *Rytidosperma* spp., and *Poa anceps* were prominent on the
sand plains of Manawatū in early European times."**

Those are **exactly the three genera Esler guessed** — arrived at independently, from
the historical and ecological literature rather than from his own inference.

And it wasn't a local oddity. Lowland native grassland was a documented regional
pattern:

| Place | Extent |
|---|---|
| Heretaunga / Ahuriri Plains, Hawke's Bay | *Microlaena stipoides* grasslands |
| Central Wairarapa alluvial plain | **~80,000 ha** of lowland grassland, mid-19th century |
| Manawatū sand plains | *Microlaena*, *Rytidosperma*, *Poa anceps* |

`[BUILD]` Upgrade Esler's grassland from *"pure conjecture"* to **"consistent with a
documented regional pattern."** We can build it with confidence — **for the period it
actually belongs to**, which is the next section's problem.

---

## 3. Modern answer #2 — it was fire, and that changes what we build

### 3.1 The finding

**Rogers (1994): forest clearance by early Māori fires and recurrent burning of the
resulting secondary vegetation induced 660,000 ha of seral tussock grassland** in three
areas of the central North Island — short tussock (*Poa cita*, *Festuca
novae-zelandiae*) around Taupō, and tall tussock (*Chionochloa rubra*) on the Tongariro
flanks and the Moawhango plateaus.

This sits inside a broader consensus:

- **McGlone: 3,000 years ago forest covered virtually the entire land surface below the
  alpine treeline.** Predictive mapping puts pre-human forest above 80%.
- Te Ara on the dry eastern South Island and Central Otago — the archetypal "natural"
  New Zealand tussock country: **"Before humans arrived, these areas were clothed in
  forests and tall scrub. They have been frequently burnt and heavily grazed."**
- Forest cover had fallen to ~68% by the time Europeans arrived.

### 3.2 Esler half-saw it

His own evidence pointed this way and he kept noting it without naming it:

- The Rongotea "scrub country" of mānuka, toetoe, koromiko, tutu and bracken **stands
  over stumps**.
- Of the sand country: *"This suggests that forests were removed from some parts not
  very long before European settlement began."*
- The Mt Stewart downlands: *"in a climate marginal for forest, had been cleared by
  Māori fires."*
- A fire through the Tiritea catchment about **1760**.

He simply had no way to date any of it. Modern palynology can: the Initial Burning
Period after Polynesian arrival (~1280 CE) converted dry lowland vegetation to bracken
**within decades**.

### 3.3 `[BUILD]` The correction

> **In a window of 345 ka → 50 ka there is no ignition source.** New Zealand has
> essentially no natural lightning-fire regime — pre-human fire return intervals ran to
> centuries or millennia, and the main natural ignition was volcanic. So:
>
> - **The lowland tussock grassland Esler describes did not exist in our period.**
> - **Most of the mānuka and bracken shrubland he describes did not either** — those are
>   the seral stages that recurrent burning maintains.
> - **Fire should not be a routine process in the sim.** The only pre-human fire worth
>   modelling is volcanic, and it belongs inside the Eruption sequence (Dive 2 §6), not
>   as its own recurring event.

This is a real loss of a habitat — and §4 more than replaces it.

---

## 4. What actually *was* open, and when — the glacial state

The LGM pollen record for the southern North Island is unambiguous, and it is far more
dramatic than anything Esler describes.

### 4.1 The picture

LGM pollen shows **extensive non-forest communities — scablands, grassland, shrublands
— across the southern North Island and the South Island**, with continuous forest
tracts mostly confined to the North Island north of 38° S.

| Measure (across all LGM sites) | Value |
|---|---|
| Forest tree pollen, mean | **15.1 ± 18%** |
| Sites exceeding 25% forest tree pollen | **only 23%** |
| Grass pollen, mean | **40.8 ± 26.4%** |
| Conifer *trees* | 2.8 ± 7.2% |
| **Tree ferns** | **0.7 ± 1.1%** |

- Tree pollen is dominated by **Fuscospora, silver beech and *Libocedrus*** — **not**
  the podocarps of the interglacial forest.
- Lowland Taranaki sites **at present-day sea level** were repeatedly shrub- and
  grass-dominated through the last glaciation.
- **There is no clear altitudinal zonation.** Sites from sea level to 800 m record much
  the same open shrub–grassland vegetation. The tidy lowland → montane → subalpine
  sequence of today simply isn't there.
- Treeline was lowered by about **800 ± 100 m**.

### 4.2 It was a mosaic, not a tundra

New Zealand palynologists were the first anywhere to propose **micro-refugia** for
trees during glacial times, and the standing interpretation is a **forest–shrub–grassland
mosaic with local survival of core regional species in small patches** — not wholesale
extirpation and postglacial recolonisation from the north.

**The offered modern analogue is subantarctic Campbell Island:** about two-thirds
herbaceous cover, with *Dracophyllum* as the dominant woody element, grading through
*Dracophyllum*/*Myrsine*/*Coprosma* shrubland to tussockland and herbfield. Its modern
pollen rain — grass ~37 ± 26%, shrubs ~27 ± 26% — matches the LGM spectra closely.

`[BUILD]` **That's the visual target for a glacial phase.** Low, wind-shorn, grey-green,
two-thirds open, with scattered dark stands of beech in shelter — and essentially **no
tree ferns**, which is a cheap and very legible way to signal the era.

### 4.3 Why it was open — and this is the useful part

Explicitly **not** mean annual temperature alone, and **not** low CO₂ (forest persisted
in the north through the LGM, and forest pollen rose sharply around 18 ka, thousands of
years before CO₂ did). On the present-day landscape, forest is excluded below the
regional treeline by:

1. **Frequent disturbance** — river channel activity, landslides, storms, fire
2. **Low precipitation** (under ~450 mm/yr)
3. **Intense frost** — which can exclude even *Nothofagus*, the main montane tree
4. **Persistent wind**

The LGM evidence points to **frequent, brief, severe frost events** affecting sites
differently by topography and latitude — with the July 1996 Southland frost offered as
a present-day analogue — plus wind and heavy ground disturbance.

> ### `[BUILD]` The two levers are already yours
>
> - **Wind** is fixed north-westerly for the whole run (Dive 1 §1) and already drives
>   the dunefield. Now it also **suppresses forest**.
> - **Frost** is a new parameter, but it is cheap — a scalar off the glacial index —
>   and it is the *mechanism* that opens the landscape. Make it **event-like and
>   topographically selective** (pooling in basins and valley floors, sparing sheltered
>   slopes), not a uniform temperature drop. That produces the patchy mosaic the pollen
>   records show, for almost nothing.
>
> Note the elegance: **the same two forces that build the Koputaroa dunefield also open
> the forest.** One climate signal, two visible consequences, at opposite ends of the map.

---

## 5. The shrubland types, and which era each belongs to

| Type | Composition | Natural? | Era |
|---|---|---|---|
| **Grey scrub** | **always mingimingi** (*Coprosma propinqua*); up to 25 *Coprosma* spp.; small-leaved *Pittosporum* and *Olearia*; **always climbers** — pōhuehue (*Muehlenbeckia complexa*), *Parsonsia*, *Clematis* — winding through the twigs | **yes** | **both** — dry ground, **frosty river terraces**, exposed hill country |
| **Coastal / tauhinu** | tauhinu (*Ozothamnus leptophyllus*), 15–20 yr stands; near forest reverts to broadleaf scrub, **away from forest becomes grey scrub** | yes | both |
| **Mānuka / kānuka** | **two settings** — permanent on infertile, dry, exposed or poorly drained soils; temporary as a 30–70 yr seral stage | permanent yes, seral no | restricted in our window |
| **Broadleaf seral scrub** | wineberry, rangiora, māhoe, five-finger, tree ferns; ngaio and taupata near the coast; pigeonwood, kāmahi, *Griselinia* higher | seral | interglacial, post-disturbance |
| **Leatherwood** | tūpari (*Olearia colensoi*) | yes | both, above ~670 m |
| **Heathland** | mānuka + *Dracophyllum* over sedges and restiads, on very infertile soils | yes, where soils are genuinely poor | both |

**Three Manawatū specifics worth carrying:**

- **Esler's "miki" shrubland is grey scrub.** *Coprosma propinqua*, *C. robusta* and
  their hybrid plus *Olearia virgata*, on the black sands of the second dune phase,
  running inland from the coastal lagoons — cleared only 30–50 years before he wrote.
  This is the district's own version of a genuinely natural type.
- **Mānuka is fire-adapted, not fire-dependent, and the distinction matters.** Fire
  kills the shrub but **splits its unopened capsules and releases thousands of tiny
  seeds** — so burning hands mānuka the ground. `[BUILD]` **Without fire, restrict
  mānuka to its permanent settings** — the leached Aokautere terraces, the wet sand
  plains — instead of letting it blanket the map.
- **Arawaru is corroborated.** In the Ruahine, *Brachyglottis elaeagnifolia* commonly
  grows with tūpari in the leatherwood band — and Esler records *Senecio
  elaeagnifolius* (the same plant, older name) on the Arawaru summit, among **11
  species that occur nowhere else in the district**. His one "arguably natural"
  shrubland checks out against the regional pattern.

---

## 6. The two succession models — worth lifting almost verbatim

These are the cleanest rulesets in the whole handbook.

### 6.1 Regeneration through bracken

```
pasture → bracken invades the margin → (stock still entering) native shrub seedlings
appear UNDER the fern canopy → pūtaputawētā, kaikōmako, māhoe, Coprosma robusta,
rangiora [+ five-finger where possums are absent] → Dicksonia squarrosa →
hīnau, rewarewa, mamaku, nīkau → TAWA LAST
```

**Esler's paradox, and it's a good one:** regeneration is **faster under light grazing
than under none.** Ungrazed bracken grows tall and dense, accumulates fronds, and shades
out seedlings almost indefinitely; grazed bracken is shorter, its litter doesn't
accumulate, and seedlings get enough light to establish. *"Ardent conservationists
seldom realise that in many situations poor farming with sheep will hasten regeneration
much faster than fencing will encourage it."*

`[BUILD]` **Moderate disturbance beats zero disturbance.** That's a genuinely
counter-intuitive rule and it's exactly the kind of thing an ambient sim can show
without a word of text.

### 6.2 Regeneration through mānuka

Esler applies Watt's four stages — **pioneering, building, mature, degenerate** — with
**light at ground level as the controlling variable**:

| Stage | What happens |
|---|---|
| **Pioneering** | mānuka establishes on denuded but stable soil; widely spaced plants spread, later ones grow erect |
| **Building** | canopy closes; **the degraded-pasture flora is excluded**; further mānuka establishment ceases; dead stems and twigs keep ground light low even as stems self-thin |
| **Mature** | stem borer weakens stems, lower branches fall, canopy opens and thins; more direct sunlight reaches the ground; **a new shade-tolerant flora enters** — māhoe, rangiora, heketara, *Geniostoma*, lancewood, *Coprosma* spp. |
| **Degenerate** | flat-topped shallow canopy dying back branch by branch; other species take the canopy; vines enter after the woody pioneer declines; mamaku joins the canopy; *Carex* and *Uncinia* typical of the floor |

Esler also records **black beech regenerating through mānuka** near beech stands — the
mechanism by which the Aokautere beech patch could have re-established after
disturbance.

`[BUILD]` **Light at ground level is the controlling variable.** It is the same
variable the eruption defoliation stage moves (Dive 2 §6), the same one governing
understorey richness in swamp forest, and the same one that decides what fills a
podocarp gap (Dive 3 §4). **One derived field, four systems.** Worth building properly.

---

## 7. Grassland — three kinds, and which is ours

| Kind | Composition | In our window? |
|---|---|---|
| **Fire-induced lowland grassland (~1840)** | *Microlaena stipoides*, *Rytidosperma* spp., *Poa anceps*; with *Acaena*, *Geranium*, *Carex*, *Pimelea prostrata*, *Ficinia nodosa*, *Muehlenbeckia complexa* | **no** — post-1280 CE |
| **Glacial shrub–grassland mosaic** | Poaceae-dominated with Asteraceae and forbs; woody component of *Coprosma*, *Muehlenbeckia*, *Myrsine*, *Veronica*, *Dracophyllum*; scattered *Fuscospora* | **yes, and extensive** |
| **Montane tussock in the water reserves** | *Chionochloa conspicua*, *C. cheesemanii*, *Cortaderia toetoe*, *C. fulvida* — four tall species, only above 395 m | **no** — Esler demonstrates these were **minor elements that spread after the canopy opened** in the 1940s–50s |

That third row is worth dwelling on. Esler explicitly shows the Tiritea tussock
grasslands to be **decades old**, using F. G. Hayes' observation that there was very
little tussock in 1927 where it was abundant by the 1960s. It is the same lesson as §3
at a smaller scale and with an eyewitness: **New Zealand grassland is almost always
younger than it looks.**

---

## 8. Fauna of the open country

Shrubland is far richer than it looks, and this feeds `TEMANAWA_FAUNA.md`:

- In one small grazed Central Otago reserve, **280 invertebrate species** were found on
  and under **30 plants** of *Olearia bullata* and mingimingi.
- Small-leaved *Olearia* twigs carry a complex community of lichens, mosses and algae —
  food for the larvae of **41 moth species known only from New Zealand**.
- Open shrubland is nesting habitat for **banded dotterel** and **NZ pipit**; **kārearea
  hunts** in shrub country; **lizards are major dispersers of *Coprosma* seed**.

`[BUILD]` Two consequences. **Kārearea and the skinks/geckos earn their place in the
glacial state** rather than being generic filler. And **Finsch's duck and the North
Island goose** — both open-country grazers, both scoring 4 on wonder in the fauna
longlist — belong here, at their most abundant in the cold phases. The glacial map
should be *busier* with large grazing birds than the interglacial one, not emptier.

---

## 9. Then and now

| | Then | Now |
|---|---|---|
| Shrubland extent | mostly forest below treeline | **7.5 million ha — 28% of New Zealand**, most of it induced |
| Native shrub species | — | **445** — more than twice the number of native trees; 230 small-leaved; **~60 divaricate** |
| Threatened shrubs | — | 155 of 445 uncommon or threatened; *Logania depressa* presumed extinct |
| Gorse and broom | absent | **800,000 ha** |
| Native shrubland cleared 1997–2002 | — | **12,415 ha**, with no national protection outside the RMA |
| Carbon | — | shrubland ~15.5 t C/ha, rising to ~212 t C/ha as it becomes mature forest |

**Gorse deserves a note.** Unlike most native shrubs, **gorse resprouts after fire** —
so frequent burning hands it the ground outright. It also fixes nitrogen. Esler
documents it becoming troublesome east of the Manawatū River around 245 m, alongside
horopito above 500 m and tree lupin on the sand and shingle.

**The sentence to be able to say:** *most of what looks like "natural scrubby New
Zealand" is a fire artefact, and the Manawatū's version is roughly 700 years old — the
installation's landscape has no equivalent to it at all.*

---

## 10. `[BUILD]` Flora shortlist — open-country group

> ℹ️ **Input, not commitment.** The built plant list is `TEMANAWA_PLAN_V2.md` §2. Black
> beech and mānuka are built as sprites; **short tussock and a single "grey scrub"
> entry — absorbing mingimingi, pōhuehue and tauhinu — are ground palette**, which is
> how the glacial mosaic is rendered. *Dracophyllum*, rangiora, māhoe, tūpari and
> mountain flax are not built. This shortlist remains the reference for what the cold
> phase is made of and what colour it should be.

Nine new assets; five shared. Note this group carries the **glacial state**, so it does
more work than its size suggests.

| Habitat | Species | Read at distance | Shared? |
|---|---|---|---|
| **Grey scrub** | **Mingimingi** (*Coprosma propinqua*) | grey divaricate tangle, pale blue berries | ✓ wetland |
| | **Pōhuehue** (*Muehlenbeckia complexa*) | wiry climbing mat scrambling over everything — the connective tissue of grey scrub | — |
| | **Tauhinu** (*Ozothamnus leptophyllus*) | bluish-grey, soft-looking mound | — |
| **Glacial mosaic** | **Short tussock** (*Poa* / *Rytidosperma*) | pale straw clumps; the ground layer of the cold phases | — |
| | ***Dracophyllum*** | stiff needle-leaved rosettes; the Campbell Island signature | — |
| | **Black beech** (*Fuscospora solandri*) | dark, dense, small-leaved — scattered stands in shelter | — |
| **Broadleaf seral scrub** | **Rangiora** | huge leaves, white-felted undersides that flash in wind | — |
| | **Māhoe** | pale-blotched bark, light green | — |
| | **Mamaku** | | ✓ lowland |
| | **Bracken** | | ✓ lowland |
| **Leatherwood / subalpine** | **Tūpari** (*Olearia colensoi*) | chest-high, leathery, semi-prostrate, impenetrable | — |
| | **Mountain flax** (*Phormium cookianum*) | smaller, arching version of harakeke | — |
| **Permanent mānuka** | **Mānuka**, **kānuka** | | ✓ lowland, coast |

**Ground texture, not entities:** the herbfield and forb component of the glacial
mosaic (Asteraceae, *Acaena*, *Geranium*), *Pimelea prostrata*, *Ficinia nodosa*.

**Deliberately excluded:** gorse, broom, sweet briar, heather, tree lupin — all
introduced, all conspicuous in the modern Manawatū, none of them ours.

---

## 11. `[BUILD]` Six things to change or add

1. **Drop fire as a routine process.** No ignition source in our window; fire belongs
   inside the Eruption sequence only (§3.3).
2. **Add frost as a topographically selective event** driven off the glacial index —
   pooling in basins and valley floors, sparing sheltered slopes (§4.3). This is the
   mechanism that opens the landscape, and it's cheap.
3. **Let wind suppress forest as well as move sand** (§4.3). Same fixed NW vector, a
   second consequence.
4. **Build the glacial state as a two-thirds-open mosaic** — grass and forb ground
   layer, grey scrub and *Dracophyllum*, scattered beech in shelter, **and no tree
   ferns** (§4.1–4.2). Tree ferns present/absent is a single legible era signal.
5. **Make "light at ground level" a real derived field** (§6.2). It already governs
   four separate systems across these four dives.
6. **Restrict mānuka to permanent settings** — leached terraces, wet sand plains —
   rather than letting it blanket cleared ground the way it does today (§5).

---

## Sources

**Primary:** Esler, A. E. 1978. *Botany of the Manawatu District, New Zealand.* DSIR
Information Series 127 — shrubland and grassland sections
(`research/02_forests_2.pdf`, `research/03_forests_2_grasslands_dunes.pdf`). Within it:
Watt (1947) on pattern and process; Grant (1966) on mānuka; Zotov et al. (1939) on the
Tararua; Esler (1963, 1969c) on the Tiritea.

**Origins of New Zealand grassland and shrubland**

- [Rogers, G. M. 1994. North Island seral tussock grasslands 1. Origins and land-use history. *NZ J. Botany* 32: 271–286](https://www.tandfonline.com/doi/abs/10.1080/0028825X.1994.10410471) — **660,000 ha induced by Māori fire**; *Microlaena*, *Rytidosperma*, *Poa anceps* on the Manawatū sand plains
- [Mark & McLennan 2005. The conservation status of New Zealand's indigenous grasslands. *NZ J. Botany*](https://ref.coastalrestorationtrust.org.nz/site/assets/files/7247/0028825x_2005_9512953.pdf)
- [Te Ara — Shrublands](https://teara.govt.nz/en/shrublands/print) (Maggy Wassilieff) — grey scrub, mānuka's two settings, leatherwood, heathland, shrubland fauna and statistics
- [Manaaki Whenua — Grey scrub with kānuka](https://www.landcareresearch.co.nz/publications/woody-ecosystem-types/shrubland-alliances/grey-scrub-with-kanuka) and [Grey scrub with cabbage trees](https://www.landcareresearch.co.nz/publications/woody-ecosystem-types/shrubland-alliances/grey-scrub-with-cabbage-trees/)
- [McGlone 1989 and successors — Past and future trajectories of forest loss in New Zealand](https://www.sciencedirect.com/science/article/abs/pii/S0006320706002886)
- [McWethy et al. — A high-resolution chronology of rapid forest transitions following Polynesian arrival](https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0111328)

**Glacial vegetation**

- [McGlone, Newnham & Moar — The vegetation cover of New Zealand during the Last Glacial Maximum (ANU Press)](https://press-files.anu.edu.au/downloads/press/p18701/pdf/ch0417.pdf) — full text; all pollen percentages, the Campbell Island analogue, and the frost/wind/disturbance argument
- Pillans, B., McGlone, M., Palmer, A., Mildenhall, D., Alloway, B. & Berger, G. 1993. The Last Glacial Maximum in central and southern North Island, New Zealand — a palaeoenvironmental reconstruction using the Kawakawa Tephra Formation as a chronostratigraphic marker. *Palaeogeography, Palaeoclimatology, Palaeoecology* 101: 283–304
- [A revised age for the Kawakawa/Ōruanui tephra, key marker for the LGM in New Zealand](https://www.sciencedirect.com/science/article/abs/pii/S0277379112004775) — 25,360 ± 160 cal yr BP

**Divaricates and shrubland fauna**

- [Greenwood & Atkinson 1977](https://www.nzes.org.nz/nzje/free_issues/ProNZES24_21.pdf); [McGlone & Webb 1981 reply](https://newzealandecology.org/nzje/1499); [Howell et al. 2002](https://besjournals.onlinelibrary.wiley.com/doi/10.1046/j.1365-2435.2002.00613.x) — see also Dive 3 §7
- [New Zealand divaricate plant species: tensile strength and remote island occurrence. *Austral Ecology* 2022](https://onlinelibrary.wiley.com/doi/10.1111/aec.13198)
- [Bird abundance in grey shrubland, Wakatipu Basin](https://www.birdsnz.org.nz/wp-content/uploads/2021/12/Lawrence_et_al._2016.pdf)
