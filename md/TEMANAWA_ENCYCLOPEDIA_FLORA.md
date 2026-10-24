# Te Manawa — Encyclopedia flora: groupings and plant write-ups

Research companion to `secondscreen/encyclopedia.js`. It does two jobs:

1. **Checks the habitat groupings** on the second screen against the research: Esler's handbook
   and the post-1980 deep-time literature.
2. **Gives a short write-up per plant**: what Esler recorded for the Manawatū, what deep-time work
   adds, suggested card copy for the `desc` field, and a suggested fauna link.

**Status: applied 2026-10-13.** The §2.5 roster, the §4 card copy and the fauna links are live in
`secondscreen/encyclopedia.js`, the switch is reordered (§2.5), and the sim changes in §3 are made.
`node tools/bootcheck.js` ("encyclopedia roster") guards them. §5 weighs the plants still missing.

**How the sources were used.** Esler (1978) was read from the scans in `research/*.pdf`, which have
no text layer, so they were OCR'd for this pass. Page numbers are the book's own. Every modern figure
below was checked against the paper or its abstract (§6). Where a statement is inference rather than
measurement, it says so. Esler is paraphrased throughout, not quoted.

> ℹ️ **Rimu, restored (2026-10-14).** Commit `b0baa85` renamed the sim key `rimu` → `Totara`, and
> the find-and-replace also ran through the research docs, turning rimu facts into "Totara" ones
> (Keebles Bush's most conspicuous emergent, the ~50 m height and 600–800-year lifespan, the 1868
> Linton survey's "rimu and tawa bush"). Those 25 prose lines across seven docs now read rimu again,
> checked against Esler (pp. 39, 42); references to the sim's `Totara` code key were left alone.

---

## 1. The framing: switch up is warm, switch down is cold

The four-screen framing is sound, and it maps neatly onto the physical switch. As reordered
2026-10-13, with Forest and Alpine one detent from the centre:

| Switch | Title | Era framing |
|---|---|---|
| up ×2 | Wetland Habitat | **Interglacial wetland** |
| up ×1 | Forest Habitat | **Interglacial forest** |
| centre | Select a Habitat | — |
| down ×1 | Alpine Habitat | **Glacial alpine** |
| down ×2 | Lowland Habitat | **Glacial flats** |

The on-screen titles are unchanged. Each habitat carries an `era` field in `encyclopedia.js`
(not yet rendered), ready if you want an "Interglacial" / "Glacial" label under the title.

Esler's Manawatū (c. 1840–1970) is a snapshot of an interglacial: the Holocene, the one we are in.
The Last Glacial Maximum (LGM, ~29–19 ka) pollen record is the other pole. Three findings from that
record shape almost every verdict below (McGlone, Newnham & Moar 2010):

1. **The glacial Manawatū was mostly open country.** Across LGM sites, forest-tree pollen averages
   15.1%, against ~80% in pre-human Holocene samples. Grass pollen averages 40.8%. In the southern
   North Island the figures are ~15% tree pollen and **~26% conifer shrubs**, with roughly 55% of the
   land under any woody cover at all.
2. **The few trees were beech.** 88% of all LGM forest pollen is *Nothofagus*, alongside
   *Libocedrus*. Podocarp trees were ~2.8%.
3. **There was no altitudinal zonation.** Sites from sea level to 800 m record much the same open
   shrub–grassland, and treeline sat ~800 m lower. So the glacial flats and glacial alpine screens
   *should* share plants. Repeats across the two cold screens are the lesson, not a shortcut.

One more finding draws the warm/cold line for the visitor. **Tree-fern spores are ~7% of pre-human
Holocene samples and 0.7% of LGM samples.** Tree ferns present means warm; absent means cold. It is
the cheapest and most legible era signal in the cast.

A caution on "interglacial = today". Interglacials were similar to each other but not identical. On
the Rapanui Terrace at Whanganui, last-interglacial (~120 ka) podocarp–hardwood forest gives way by
~110 ka to a low Myrtaceae shrubland with *Libocedrus* and an **extinct *Acacia*-type**. That
vegetation has no modern analogue in New Zealand (Bussell 1992). The past was not just today's
forest or today's mountaintops moved about.

---

## 2. Verdict on the groupings

### 2.1 Interglacial forest: *tōtara, tawa, tree ferns, beech, nīkau*

| Plant | Verdict |
|---|---|
| Tōtara | ✅ Esler's signature tree of the free-draining levées and dry terraces. |
| Tawa | ✅ The background canopy of every Manawatū forest type except one: beech. |
| Tree fern | ✅ The best era signal on the screen (§1). |
| Nīkau | ✅ The most frost-tender plant in the cast, so an unambiguous warm-phase marker. |
| Beech | ❌ **Move it out.** Esler: "Tawa is a component of all forests except beech forest" (p. 45). In the interglacial Manawatū, beech was a single ~526 ha anomaly on leached soils at Aokautere (p. 48). In the glacials it was *the* tree. Showing it on both the forest and alpine screens blurs the warm/cold lesson. |
| ➕ **Kōwhai** (replacement) | Esler records kōwhai in both interglacial forest types he could reconstruct, tōtara forest (p. 35) and dune forest (p. 55). It is the forest-margin colour beat, and it has the strongest bird link in the cast (tūī). |

Alternative fifth plant: **rimu**, Esler's most conspicuous emergent at Keebles Bush and the main
timber of Browns Flat (pp. 40–42). Old art exists (`sprites/Rimu_*.png`), but `TEMANAWA_PLAN_V3.md`
§4 cut rimu for its read from above.

### 2.2 Interglacial wetland: *kahikatea, harakeke, tī kōuka, sedge, tōtara*

**All five are right.** This is the best-evidenced screen, because it is the Moutoa zonation Esler
reproduces from Poole & Boyce (1949): *Carex secta* in open water, then raupō, then harakeke, then
swamp scrub of tī kōuka and *Coprosma*, then kahikatea–pukatea forest on the levée. The whole
sequence spans about 1.8 m of height (p. 59). Three fixes:

- **Sedge.** The card reads "Sedge / Tussock, *Carex / Chionochloa*". *Chionochloa* is snow tussock
  and has no place in a swamp. Make it **pūrei / pūkio, *Carex secta***: the dark sedge standing in
  open water on its own root pedestal (pp. 59–61).
- **Tōtara.** The card reads "Podocarp, *Podocarpus / Prumnopitys*" with a TODO. Make it tōtara
  explicitly. Esler's relics show tōtara and kahikatea often growing side by side, tōtara on the
  higher, coarser levée and kahikatea on the wet silt behind it (p. 27). It also carries the screen's
  best story, the drowned forest (§4).
- **Harakeke caveat** for the card. Esler shows harakeke *spread* after drainage and stopbanking, and
  infers that toetoe held the wetter ground before that (pp. 57, 59). Pre-human, harakeke belongs in
  its band just above raupō, not everywhere.

### 2.3 Glacial flats: *mānuka, kōwhai, tī kōuka, tussock, coprosma (instead of nīkau)*

| Plant | Verdict |
|---|---|
| Tussock | ✅ Grass was ~41% of LGM pollen, the ground layer of the whole glacial. Use the **short** tussocks (*Poa*, *Festuca*, *Rytidosperma*) here, and snow tussock on the alpine screen. |
| Coprosma (grey scrub) | ✅ **Swap nīkau out, as you suggested.** Grey scrub (*Coprosma*, *Muehlenbeckia*, *Myrsine*) is the woody body of the glacial mosaic. *Coprosma* and mānuka-type were the commonest shrub pollen at LGM Onepoto, and both rose after the Ōruanui ash (Piva et al. 2023). Nīkau is the opposite: frost-tender and a warm-phase marker. |
| Mānuka | ✅ *Leptospermum*-type pollen is a main LGM shrub. Card caveat: most modern mānuka scrub is fire-made (Esler's downland scrub stood over stumps, p. 35). Before people, mānuka held infertile, wet or leached ground. |
| Tī kōuka | ✅ Defensible. Frost-hardy, a plant of wet margins, with genetically based cold tolerance that varies with latitude of origin (Harris, common-garden trials). There is no direct glacial pollen evidence, so say "probably". |
| Kōwhai | ✅ **Defensible.** DNA work shows *Sophora* survived the LGM across much of the country, not only in a few warm refuges (Shepherd et al. 2017). That makes kōwhai a good bridge between the forest and flats screens. **But** the sim currently treats it as warm-only (§3). |

**The biggest gap is conifer shrubs.** In the southern North Island they are **~26% of LGM pollen**:
bog pine (*Halocarpus*), mountain toatoa (*Phyllocladus*) and snow tōtara. *Halocarpus* alone was
12.5% at Onepoto. There is no sprite for any of them. If one more glacial asset gets drawn, make it
this one.

### 2.4 Glacial alpine: *beech, dracophyllum, tussock, ferns, scrub plants*

| Plant | Verdict |
|---|---|
| Beech | ✅ The glacial tree. **Rename red beech → black beech** (*Fuscospora solandri*, tawhai rauriki). It is the species Esler records, with rare hard beech and hybrids (p. 48). It is also the beech of the inland Whanganui ridges today (Bussell 1988). LGM pollen can't separate the *Fuscospora* species anyway. Card nuance: in a full glacial, with treeline ~800 m lower, much of the range crest stood above the trees, so beech held the sheltered pockets below it. |
| Dracophyllum | ✅ Doubly evidenced. Esler records *Dracophyllum filifolium* on the Arawaru summit (p. 69). The best modern analogue for LGM pollen is subantarctic Campbell Island, where *Dracophyllum* is the dominant woody plant. |
| Tussock | ✅ Snow tussock here. Esler records *Chionochloa conspicua* and *C. rubra × flavescens* on Arawaru (p. 84). |
| Scrub (coprosma) | ✅ Present it as the subalpine form. Leatherwood (tūpari, *Olearia colensoi*) caps Arawaru above ~670 m, with *Coprosma*, *Myrsine divaricata* and *Dracophyllum* in it (p. 69). |
| Tree fern | ❌ **Take it out.** It is the one plant that defines a glacial by its *absence* (0.7% vs ~7%). Ground ferns would be fine botanically, but there is no sprite for them, and the `fern` key is the tree fern. |
| ➕ **Wharariki / mountain flax** (replacement) | Esler records *Phormium cookianum* moving into the dying leatherwood on Arawaru (p. 69). It reuses the flax sprite. |

### 2.5 The roster (applied)

Listed top to bottom in the reordered switch:

| Switch | Screen | Five plants | Changes from your list |
|---|---|---|---|
| up ×2 | **Interglacial wetland** | Kahikatea · Harakeke · Tī kōuka · **Pūrei** (*Carex secta*) · **Tōtara** | sedge renamed; "podocarp" → tōtara |
| up ×1 | **Interglacial forest** | Tōtara · Tawa · Mamaku & ponga · Nīkau · **Kōwhai** | beech → kōwhai |
| down ×1 | **Glacial alpine** | **Mountain beech** · Dracophyllum · Snow tussock · Subalpine scrub · **Wharariki** | tree fern → mountain flax; red → black → mountain beech |
| down ×2 | **Glacial flats** | Tussock · Grey scrub · Mānuka · Tī kōuka · Kōwhai | as you proposed |

The roster uses all 13 original sprite keys plus two art-sharing keys (`sedge` on the tussock art,
`wharariki` on the flax art). Plants that repeat (tōtara, kōwhai, tī kōuka, coprosma, tussock) tell a
different habitat story on each card, with their own `desc`. Card positions are the original
mockup slots.

### 2.6 The bird policy (one bird per plant, 2026-10-13; revised 2026-10-15)

**One bird per plant, full representation, no hogging.** Every plant adds exactly one bird to the
sim; a card's copy may still mention other relevant birds. Every bird the sim founds is on at least
one plant, and a bird may sit on several plants, but on no more than two, so no species hogs the
encyclopedia. A plant shown on two screens carries the same bird on both cards. The touchscreen sends that bird with the boost, so boosting the plant
recruits and outlines it. The cast is **North Island only**. Upland moa (*Megalapteryx*) and
heavy-footed moa (*Pachyornis elephantopus*) are South Island birds (`TEMANAWA_FAUNA.md`: wrong
place, not wrong time), so they are out of the founder mix:

- the **North Island giant moa** takes upland moa's slot and its numbers;
- **Mantell's moa**, heavy-footed moa's North Island sister species, absorbs its share.

The four North Island moa sit on the three moa sprites. The **giant** art is *Dinornis*, the
**bush** art is *Anomalopteryx*, and the **Pachyornis** art is shared by Mantell's moa and its
stocky emeid relative, the stout-legged moa.

| Bird | Plant | Why (habitat notes from NZ Birds Online unless stated) |
|---|---|---|
| Eyles' harrier | Tōtara | Dry forest, forest-edge and shrubland hunter; tōtara grew at the forest–grassland margin (Esler p. 34). Mockup link, kept |
| Kererū | Tawa | Sole disperser of tawa's large fruit |
| Kōkako | Nīkau | Tawa forest under emergent podocarps; eats mostly fruit and leaves, often in the understorey where nīkau grows. Was the mockup's mānuka link |
| Tūī | Kōwhai, wharariki | Nectar. In the sim it feeds at kōwhai, harakeke and wharariki flowers (`extraForage`, no seed carried) as well as fruit trees |
| Kiwi | Tree fern | Forest-floor prober of litter and rotten logs |
| Little bush moa | Kahikatea | Closed-canopy, wet lowland forest; browsed twigs |
| Mantell's moa | Harakeke | Lowland wetlands and dunelands; a sturdy bill for a fibrous diet |
| Finsch's duck | Tī kōuka | Terrestrial grazer of grassland, scrub and open forest. Was the mockup's tī kōuka bird (kererū) |
| Mōho / NI takahē | Pūrei | Grassland, scrub and forest; bones from swamps, dunes and caves, sea level to ~1,000 m |
| North Island goose | Tussock | Open-country grazer, most widespread in the ice ages, shrinking as forest spread |
| NI giant moa | Grey / subalpine scrub, Dracophyllum | Browsed twigs and leaves to ~3 m, coast to subalpine herbfields; the divaricate debate. No moa diet record names Dracophyllum, so its card says so |
| Stout-legged moa | Mānuka | Drier lowland mosaic of grassland, shrubland and open forest; Esler's dry sand plains carry mānuka |
| Huia | Mountain beech | Ruahine, Tararua and Rimutaka ranges. Mockup link, kept. In the sim it works beech for huhu grubs (`extraForage`, no seed carried) |

Two mockup links changed, mānuka → kōkako and tī kōuka → kererū. Kererū had to go to tawa, its
strongest link, and kōkako fits the tawa-forest understorey better than glacial mānuka. The
harness asserts all of this ("encyclopedia roster"):

- the founder cast holds no South Island-only moa;
- every plant adds exactly one bird;
- every cast bird is on one or two plants;
- every card bird is in the cast;
- `TM_BOOST.faunaLinks` matches the cards.

With no visitor input, the founder mix holds every species above its floor through two full
warm↔cold sweeps. The giant moa sits at 2–4 birds, below its target of 6: a slow-breeding giant.
Raise its `speciesTargets` entry if more giants should show.

---

## 3. What the sim needed to match (applied 2026-10-13)

The boost gate (`TeManawa_bus.js`, `onBoost`) reads only `coldTolerance`:

- **≤ 0.65 = warm.** The boost succeeds only in an interglacial.
- **≥ 0.75 = cold.** The boost succeeds only in a glacial.
- **In between = neutral.** The boost always succeeds.

If the screens are labelled by era, every plant on a glacial screen must pass in a glacial, and every
plant on an interglacial screen must pass in an interglacial. Otherwise a visitor who picks the right
screen for the climate still gets the grey "wrong" pulse and a desaturated scene.

The conflicts found in the review, and what changed:

| Plant (key) | Was | Problem | Now |
|---|---|---|---|
| Black beech (`beech`) | 0.6, warm | A beech boost from the Alpine screen during a glacial failed and desaturated the scene, the opposite of its `COLD_REFUGE` role | **0.8, cold** |
| Kōwhai (`kowhai`) | 0.45, warm | failed on the glacial flats | **0.7, neutral** |
| Tī kōuka (`cabbagetree`) | 0.6, warm | failed on the glacial flats | **0.7, neutral** |
| Pūrei (was the `tussock` key) | 1.0, cold | a sedge boost in an interglacial failed | **new `sedge` key, 0.7, neutral** |
| Tree fern (`fern`) on Alpine, nīkau on Lowland | warm | failed in a glacial | removed from those screens |

Everything the sim changed (2026-10-13):

- **`TeManawa_plant_defs.js`**: the three tolerances above, and two **art-sharing types**, `sedge`
  (pūrei) and `wharariki` (mountain flax), both neutral 0.7.
- **Side effects of the tolerance moves, all intended.** Beech now joins the TUSSOCK/glacial growth
  set and is no longer a kererū fruit tree (beech seed is wind-dispersed). Kōwhai and tī kōuka leave
  the FOREST growth set and the kererū fruit set, like the other neutral plants (mānuka, harakeke).
  The beech-refuge assertion still passes, since `COLD_REFUGE` is separate.
- **`TeManawa_seasons.js`**: beech's glacial-stage type modifier now *rises* into the cold
  (1.0 → 1.6) instead of sinking with Tōtara (1.3 → 0.3). Beech's art is size-only, so this changes
  behaviour, not looks: it keeps its food value and stays above the cold-dormancy trigger in the full
  glacial (montane 0.15 × 1.6 = 0.24, against 0.045 before).
- **`TeManawa_sketch.js`**: `PLANT_SPRITE_ALIASES` gives the two new types the tussock and flax
  frames without loading them twice (the atlas still packs 449 frames), with wharariki drawn at
  0.8×. Both join `STORM_HARDY`.
- **`levels/level_temanawa_scaffold.js`**: pūrei replaces one of the wetland palette's two
  tussock entries; wharariki joins the subalpine palette, so a boost from the Alpine screen lands on
  the tops. Wharariki only appears once the ranges rise, like *Dracophyllum*.
- **`TeManawa_bus.js`**: `TM_BOOST.faunaLinks` covers every roster plant (the fallback).
- **The touchscreen now sends its card's fauna with the boost** (`m.fauna`, the sim species keys
  incl. the juvenile harrier), so the diorama recruits and outlines exactly the birds on the card.
  Verified end to end in the browser: Forest → Tōtara recruited its linked birds with a green
  outline; Alpine → Black beech at 150 ka (glacial) matched, outlined blue, seeded beech and
  recruited huia. The links themselves are now one bird per plant (§2.6).
- **`secondscreen/secondscreen.css`**: the card's plant sprite is capped at half the card width, so
  wide sprites (grey scrub, tussock, pūrei) no longer cover the description text.
- **`tools/bootcheck.js`**, new section "encyclopedia roster". It asserts:
  - the switch order (warm above the centre, cold below, Forest and Alpine adjacent to it);
  - every card passes the boost gate in its screen's era;
  - every card resolves to a real plant type, palette, sprite file, card copy and registered species;
  - the art aliases don't leak a scale override;
  - beech's stage modifier rises into the cold.

  Mutation-tested: restoring beech to 0.6 makes the section fail.

---

## 4. Plant write-ups

Each entry gives Esler's record, then the deep-time picture, then the card copy, then its bird
(§2.6). Plants on two screens get two cards. **The "Card." lines below are the earlier short drafts.**
Since 2026-10-15 the cards for tōtara, tawa, tree ferns, nīkau, kōwhai, kahikatea, harakeke, tī kōuka
and pūrei carry the longer, fact-checked write-ups in `TEMANAWA_GOALS.md` §3, and the cards can
scroll. `secondscreen/encyclopedia.js` is the source of truth for what visitors read.

### Tōtara: *Podocarpus totara*
**Screens:** forest, wetland (levée) · **Sim:** `Totara`, 0.3 warm

**Esler.** Tōtara was the tree the district was known for, and nothing of that forest survived
intact into his time (p. 34). It held the free-draining ground: the riparian levées of the Manawatū
and Ōroua, and the largest block on the Rongotea–Ohakea terraces. There, with under 914 mm of rain
and constant drying wind, it grew right at the climatic edge between forest and grassland (p. 34).
Settler Edgar Dear recalled this as the district's finest tōtara, with mātai, miro, rimu and huge
northern rātā (p. 35). Long before Europeans, shifts in the river's level destroyed whole tōtara
forests. At Go-to-Hell Swamp, rooted stumps 1.8–3.6 m apart stand under 1.8 m of peat, and Esler
argues a rising water table drowned them (pp. 34, 38). Decayed tōtara logs also lie behind the fore
dune along the whole coast (p. 38).

**Deep time.** The drowned forest has a dated twin up the coast. At Waverley Beach, a dense
mid-Holocene tōtara forest survives as stumps in place, killed as the water table rose with
post-glacial sea level, which reached today's height ~6,500 years ago (Bussell 1988). The end of an
ice age drowns lowland forest. Tōtara pioneers open ground and gaps (Bussell 1988), which fits the
pulse-driven podocarp recruitment in `TEMANAWA_ECOLOGY_LOWLAND.md` §4. In the glacials, podocarp
trees were scarce (~2.8% of LGM pollen) but survived in scattered patches. Forest returned so fast
afterwards that palynologists infer podocarp forest was never far from any site.

**Card (forest).** *A great podocarp of the dry river levées and terraces, growing right at the edge
where forest gives way to grass. Birds carry off its red fruit. The Manawatū was famous for its
tōtara forests.*

**Card (wetland).** *Tōtara holds the high, firm levée beside the swamp. When the sea rose after the
last ice age and the water table climbed, whole tōtara forests drowned where they stood. Their
stumps still lie under the peat.*

**Fauna (§2.6).** **Eyles' harrier**, kept from the mockup. The harrier hunted dry forest, forest
edge and shrubland, and tōtara grew right at the forest–grassland margin Esler describes.

### Tawa: *Beilschmiedia tawa*
**Screen:** forest · **Sim:** `tawa`, 0.4 warm

**Esler.** Tawa grew in every Manawatū forest type except beech. It rose to dominance in two phases:
first centuries in which the podocarps above it failed to replace themselves, then milling. So
remnants like Kitchener Park almost certainly hold more tawa now than before (p. 45). In the
Manawatū Gorge it forms a pure canopy over 30 m, so dark that the māhoe and nīkau beneath it
struggle (p. 46). The Tiritea reserve's tawa, sheltered from the westerlies, was the best-preserved
forest of any kind in the district (p. 46). In regenerating bush, tawa is typically a late arrival
(p. 74).

**Deep time.** Tawa is the ghost of the pollen record. Its pollen does not preserve, so even forests
it dominated show up only by inference (Bussell 1988). Its glacial history is therefore unseen. It
was almost certainly pushed out of the frost-swept southern North Island into sheltered or northern
refuges (inference: the LGM landscape had almost no broadleaf canopy). Its large fruit has one
disperser, the kererū, since moa gizzards destroyed large seeds. Each post-glacial return therefore
rode on kererū, which today carry tawa seed less than 100 m on average.

**Card.** *The broadleaf canopy of the lowland forest, found in every forest type here except beech.
Its plum-like fruit is too big for any bird but the kererū to swallow. Where kererū fly, tawa
follows.*

**Fauna (§2.6).** **Kererū**: the strongest link in the cast, as its sole disperser.

### Tree fern: mamaku *Cyathea medullaris*, ponga *C. dealbata*, whekī *Dicksonia squarrosa*
**Screen:** forest · **Sim:** `fern`, 0.1 warm

**Esler.** Tree ferns run through every forest account. Whekī covers the floodable stream terraces at
Keebles Bush (p. 42), and whekī with three *Cyathea* species tops the tawa forest's shrub layer
(p. 47). Fifty years of regrowth produced dense, elegant stands of mamaku along the Kahuterawa
streams (pp. 74–75). In regeneration from bracken, whekī follows soon after the first shrubs (p. 74).
In mānuka succession, mamaku is the only fern that reaches the canopy (p. 77).

**Deep time.** Tree ferns are the cleanest climate signal in New Zealand pollen: ~7% of pre-human
Holocene samples, 0.7% at the LGM (McGlone et al. 2010). At Auckland, *Cyathea* was scarce or absent
through the LGM and became common only afterwards. They are frost-tender, fast gap-fillers. In a warm
climate they flood back after any disturbance; in a cold one they all but vanish.

**Card.** *Tree ferns crowd the stream banks and light gaps of the warm forest, quick to fill any
hole in the canopy. In the ice ages they almost disappeared. If you see tree ferns, the climate is
warm.*

**Fauna (§2.6).** **Kiwi**: a forest-floor prober of leaf litter and rotten logs.

**Naming note.** The card says ponga, *C. dealbata*. Mamaku is the one Esler dwells on and the one
`TEMANAWA_PLAN_V3.md` calls the era signal. Either is right. The genus moves to *Alsophila* /
*Sphaeropteris* are recent and not universally adopted.

### Nīkau: *Rhopalostylis sapida*
**Screen:** forest · **Sim:** `nikau`, 0.2 warm

**Esler.** Nīkau is an understorey plant of the lowland forests. It grows in Himatangi Bush's
semi-swamp forest (p. 32), in small numbers in the Tiritea tawa forest (p. 47), and starved of light
under the closed tawa canopy at the Gorge (p. 46). In regenerating bush it arrives late, alongside
tawa (p. 74). Esler published a study of nīkau flowering and fruiting in the Kahuterawa valley
(Esler 1969a, cited p. 22).

**Deep time.** Nīkau is the world's southernmost palm, reaching the Chatham Islands at ~44°S. It is
also the most frost-tender plant in the cast: it survives only a few degrees of frost and is damaged
by sudden cold snaps. There was no place for it in the frost-swept glacial southern North Island. It
must have retreated to warm coastal or northern refuges (inference: there is no glacial pollen
record for it). Kererū eat the fruit; passing through the bird cleans the seed but is not needed for
germination.

**Card.** *The world's southernmost palm, growing slowly in the shade of the tawa forest, where
kōkako feed on fruit and leaves. Nīkau cannot survive hard frost, so it grows here only in the warm
interglacials.*

**Fauna (§2.6).** **Kōkako**. Its home is tawa forest under emergent podocarps, where it eats
mostly fruit and leaves and often feeds in the understorey (NZ Birds Online), the layer nīkau lives in.

### Kōwhai: *Sophora microphylla* and *S. godleyi*
**Screens:** forest, glacial flats · **Sim:** `kowhai`, 0.45 warm (see §3)

**Esler.** Kōwhai appears in both interglacial forest types he could reconstruct: among the smaller
trees of the Rongotea tōtara forest (p. 35) and in appreciable quantity in the dune forests (p. 55).
The Kōwhai swamp of the Taonui basin carries its name (p. 26).

**Deep time.** Three findings make kōwhai the bridge between the warm and cold screens:

- **It came through the ice age widely.** DNA shows *Sophora* survived the LGM across much of the
  country rather than retreating to a few warm refuges (Shepherd et al. 2017).
- **Its seeds float.** Buoyant seed is the leading explanation for how the group spread around the
  southern Pacific in the last few million years (Hurr et al. 1999; Heenan et al. 2001).
- **The local kōwhai may be its own species.** Godley's kōwhai (*S. godleyi*) was named in 2001 from
  a holotype collected in the Pohangina Valley. It grows on mudstone (papa) in the Whanganui and
  Manawatū hill country (Heenan, de Lange & Wilton 2001). The card should probably name both species.

**Card (forest).** *Kōwhai lights the forest edge and river banks with spring gold, and tūī come for
its nectar. Its seeds float, which is how kōwhai crossed oceans.*

**Card (flats).** *A survivor. DNA shows kōwhai lived through the last ice age across much of New
Zealand, not only in warm northern refuges. On the cold river flats it probably held on along
sheltered banks.*

**Fauna (§2.6).** **Tūī** (nectar), on both kōwhai cards.

### Kahikatea: *Dacrycarpus dacrydioides*
**Screen:** wetland · **Sim:** `kahikatea`, 0.35 warm, `disturbanceRecruit`

**Esler.** Kahikatea–pukatea "semi-swamp forest" was a conspicuous lowland feature, most extensive in
the Taonui basin inside the levées of the Manawatū and Ōroua. It grew on the fine sediments that
stayed wet all year (p. 27). Aston saw Round Bush near Foxton before 1920: tall white pine on sand,
the floor under standing water, crossable dry-shod only along the giant raised roots (p. 29). Older
Kairanga residents said kahikatea outnumbered every other tree there (p. 39). One Kōpane mill
reportedly cut a million super feet of it, and after drainage the ground sank until sheep could walk
under the roots (p. 30). What survives today is mostly pole stands that came up after milling
(p. 31).

**Deep time.** Kahikatea is a coloniser of raw, wet alluvium: a shifting river channel clears fresh
ground for it (`TEMANAWA_ECOLOGY_WETLAND.md` §4.1, already modelled as `disturbanceRecruit`). Big
eruptions feed the swamp rather than ending it. After the Ōruanui ash, the canopy was part-defoliated
for under 10 years, sedge and pondweed expanded for ~60 years, and the community that settled was
stable but altered (Piva et al. 2023). This confirms the ~60-year figure in the wetland doc.

**Card.** *New Zealand's tallest tree, standing in water on the wettest silt behind the river
levées. It needs a wandering river to clear ground for its seedlings. Little bush moa browsed the
dark swamp forest beneath.*

**Fauna (§2.6).** **Little bush moa**, the moa of closed-canopy wet lowland forest, which browsed
twigs and other tough material (NZ Birds Online).

### Harakeke: *Phormium tenax*
**Screen:** wetland · **Sim:** `flax`, 0.7 neutral

**Esler.** The surveyors marked the Moutoa as a great swamp of flax and raupō over deep soil with
buried timber (p. 57). In the Moutoa zonation, harakeke sits above raupō and below the swamp scrub
(p. 59). At both Makerua and Moutoa, harakeke reportedly increased after drainage, which implies
toetoe held the wetter sites first (p. 57). After stopbanking, flax stands spread onto ground that had
been too wet for them (p. 59). Flax mills worked both banks of the river (p. 58). The 1949 survey that
recorded the zonation was itself commissioned to manage the flax crop (p. 23). Allan and Zotov bred an
artificial harakeke × wharariki hybrid from local plants (p. 21).

**Deep time.** Harakeke is the plant that grows over drowned forest. Go-to-Hell Swamp was a flax flat
on 1.8 m of peat over tōtara stumps (p. 38): when the water table rises, swamp replaces forest. After
big eruptions wetlands widen (Piva et al. 2023). Harakeke's neutral rating in the sim is reasonable
for a hardy plant that grows up into the subalpine, though there is no direct glacial record for it.

**Card.** *Harakeke grows just above the raupō, where swamp meets firmer ground. Mantell's moa, a
stocky moa of lowland swamps and dunes, had a strong bill suited to tough, fibrous plants like
this.*

**Fauna (§2.6).** **Mantell's moa**: a North Island moa of lowland wetlands and dunelands, whose
sturdy bill suggests a fibrous diet (NZ Birds Online).

### Tī kōuka: *Cordyline australis*
**Screens:** wetland, glacial flats · **Sim:** `cabbagetree`, 0.6 warm (see §3)

**Esler.** Tī kōuka forms the swamp scrub with *Coprosma*, between the harakeke and the kahikatea
forest at Moutoa (p. 59). With raupō and harakeke, it is one of the three striking plants of the
coastal lagoon swamps (p. 60). It arrives on the dune-slack plains after about 50 years, with toetoe
and oioi (p. 91). It is more plentiful on the plains than on the dunes (p. 81), and plentiful on the
highest downland roadsides (p. 98). Esler himself published on wild *C. australis × banksii* hybrids
(p. 22).

**Deep time.** Common-garden trials grew seedlings from 29 wild stands spanning 12° of latitude. They
found genetically based differences in cold tolerance, growth and flowering, tied to where each stand
came from (Harris). Cabbage trees from colder places are hardier, so the species carries the range it
needs for a glacial. Northland holds the most genetic diversity, consistent with old lineages
persisting in the north. There is no Manawatū glacial pollen record for it, so its glacial role is
likely but inferred.

**Card (wetland).** *The cabbage tree of open, wet ground and swamp margins, hardy and
frost-tolerant but light-demanding. Its dense flower and fruit heads feed many birds.*

**Card (flats).** *Tough enough for the ice age: cabbage trees from colder places are genetically
hardier. On the cold, open plains tī kōuka probably stood above the grass where Finsch's duck
grazed.*

**Fauna (§2.6).** **Finsch's duck**, a terrestrial grazer of grassland, scrub and open forest. It
had little to do with wetlands, so it suits the flats card better than the wetland one. The mockup's
kererū link moved to tawa.

### Pūrei / pūkio: *Carex secta*
**Screen:** wetland · **Sim:** currently `tussock`, 1.0 cold (see §3)

**Esler.** Pūrei is the first plant of the Moutoa sequence, standing in open water (p. 59). At
Pukepuke Lagoon it is, with raupō, the most prominent plant (p. 60), and nettles grow on its
pedestals (p. 61). When Lake Horowhenua was lowered, its pūrei was left high and dry but stayed
healthy until it was burnt off for farmland (p. 61). On the dune slacks a related sedge, *Carex
pumila*, builds its own low mound about 0.3 m high (p. 90).

**Deep time.** Sedges are among the clearest responders to a supereruption. After the Ōruanui ash,
sedge and pondweed pollen rose for ~60 years as silt widened the lake margins (Piva et al. 2023).
Sedges and restiads were also part of the LGM wetland at Onepoto, so pūrei-type swamps persisted
through the cold.

**Card.** *Pūrei stands in open water on a trunk-like pedestal of its own old roots, the first plant
at the swamp's deep edge. After a big eruption, ash-silted swamp margins widen and sedges spread.*

**Fauna (§2.6).** **Mōho** / North Island takahē. Its bones come from swamps, dunes and caves, from
sea level to ~1,000 m (NZ Birds Online). Its diet is unrecorded, so the card copy makes no claim.

### Tussock: short tussock (flats) and snow tussock (alpine)
**Screens:** glacial flats, glacial alpine · **Sim:** `tussock`, 1.0 cold

**Esler.** In the lowlands, there were grasslands in Māori times but their composition is unknown
(p. 78). Buick's 1903 account describes grassy sand ridges with mānuka, toetoe and tussock between
swampy hollows (pp. 78–79). Esler guessed the grasses were *Microlaena*, *Rytidosperma* and *Poa anceps*,
and labelled the guess conjecture (p. 79); Rogers (1994) later corroborated it. In the uplands,
Arawaru (767 m) carries a small stand of *Chionochloa conspicua* and *C. rubra × flavescens* that
looks natural but may follow clearing (p. 84). The Tiritea's tall tussocks spread only after the
forest canopy opened in the 20th century, and grow only above 395 m (pp. 84–85).

**Deep time.** Most lowland grassland Esler saw was made by fire after people arrived (~1280 CE;
Rogers 1994), so it falls outside the pre-human window. The **glacial** grassland is in the window:
grass was ~41% of LGM pollen, on open ground from sea level to 800 m (McGlone et al. 2010). Snow
tussock's alpine habitat is young. Heenan & McGlone (2013) date permanent alpine habitat in New
Zealand from only ~0.95 Ma, right when the Te Manawa run opens. They also note the North Island
ranges are young, some under ~200,000 years old, with few alpine endemics: their alpine flora is
borrowed from the south.

**Card (flats).** *In the ice ages grass covered the open plains. The North Island goose spread with
it across the cold, windswept flats, then shrank back as the forests returned.*

**Card (alpine).** *The grass of the high tops. In the ice ages tussock grassland ran from the coast
to the summits, grazed by the North Island goose. Alpine country itself is young: permanent for only
a million years.*

**Fauna (§2.6).** **North Island goose**, on both tussock cards: an open-country grazer, most
widespread in the ice ages and shrinking as the forests spread (NZ Birds Online).

### Grey scrub: mingimingi *Coprosma propinqua*, pōhuehue *Muehlenbeckia complexa* (and leatherwood)
**Screens:** glacial flats, glacial alpine · **Sim:** `coprosma`, 0.85 cold

**Esler.** "Miki", mingimingi and its hybrid with *C. robusta*, once covered most of the wetlands
around the coastal lagoons inland to SH1, until it was cleared 40–45 years before he wrote (p. 68).
*Coprosma* species form the swamp scrub with tī kōuka at Moutoa (p. 59). On Arawaru, *Coprosma* and
*Myrsine divaricata* grow through the leatherwood above ~670 m (p. 69). Pōhuehue binds the stabilised
rear dunes (p. 93). In browsed bush, cattle remove the palatable plants and leave small-leaved shrubs
(p. 45).

**Deep time.** *Coprosma*, *Muehlenbeckia* and *Myrsine* are the well-represented shrubs of the
late-glacial landscape (McGlone et al. 2010). *Coprosma* and mānuka-type were the main shrub pollen
at LGM Onepoto, and both rose after the Ōruanui ash (Piva et al. 2023). Mingimingi is a divaricate:
tangled, tiny-leaved and wide-branched. Why New Zealand has so many divaricates (~10% of its woody
flora) is still argued. Greenwood & Atkinson (1977) proposed a defence against moa browsing; Greenwood
worked alongside Esler. McGlone & Webb (1981) proposed a shield against glacial frost and wind. Both
hypotheses are about exactly what this installation shows.

**Card (flats).** *A tangle of tiny-leaved, criss-crossed branches. Did it grow that way to fend off
the giant moa, which could browse three metres up, or to survive ice-age frost and wind? Scientists
still argue.*

**Card (alpine, as leatherwood).** *At the bushline, tough shrubs take over from trees: leatherwood,
coprosma and their kin make a dense, waist-high thicket. The giant moa browsed all the way up into
it, from the coast to the tops.*

**Fauna (§2.6).** **North Island giant moa**, on both scrub cards. It browsed twigs and leaves up
to ~3 m and ranged from coastal dunes to subalpine shrubland (NZ Birds Online), which is the browse
height at the heart of the divaricate debate.

### Mānuka: *Leptospermum scoparium*
**Screen:** glacial flats · **Sim:** `manuka`, 0.7 neutral

**Esler.** Kettle found mānuka very common upstream of Palmerston North in 1842 (p. 68). It held the
dry parts of the sand plains, grading into kānuka on the dunes (p. 68). The downland scrub of mānuka,
toetoe, koromiko, tutu and bracken stood over stumps: recently burnt forest (p. 35). Its densest
stands are on the strongly leached terraces that once carried the Aokautere black beech (p. 74).
There Esler worked out its life cycle through Watt's four stages (pioneering, building, mature,
degenerate), with light at ground level deciding what can establish beneath (pp. 75–77). He also saw
black beech regenerating through mānuka (p. 77).

**Deep time.** Mānuka is fire-adapted: fire opens its seed capsules. The mānuka blanket of the modern
Manawatū is largely a product of human fire. In the pre-human window, mānuka held the permanently
poor, wet or exposed ground. *Leptospermum*-type pollen is a main shrub type in LGM samples (Piva et
al. 2023), and New Zealand palynologists class it as a wetland shrub (McGlone et al. 2010).
Genomically, New Zealand mānuka split from Australian *L. scoparium* ~9–12 million years ago, with
five regional gene pools within New Zealand (Koot et al. 2022).

**Card.** *The tough pioneer of poor ground, holding the dry sand plains and leached terraces. The
stout-legged moa browsed this open, dry scrub. New Zealand mānuka has evolved apart from Australia's
for about ten million years.*

**Fauna (§2.6).** **Stout-legged moa** (*Euryapteryx curtus*). It lived in the drier lowland
mosaic of grassland, shrubland and open forest, often near the coast (NZ Birds Online), the dry sand
plains Esler gives to mānuka. The mockup's kōkako link moved to nīkau.

### Black beech / tawhai rauriki: *Fuscospora solandri*

> **2026-10-15: the card is now mountain beech** (*Fuscospora cliffortioides*). The Alpine screen
> shows the plants of the Ruahine and Tararua ranges, and black beech is a lowland–montane tree of
> dry, infertile ground. Mountain beech is the upper-montane–subalpine beech (nzflora): it forms the
> treeline in the central, eastern and northern Ruahine (Wellington Botanical Society 1945; DOC),
> while the Tararua treeline is silver beech and the fog-bound southern Ruahine has no beech at all.
> LGM *Fuscospora*-type pollen covers both, so "the tree of the ice ages" holds; mountain beech masts
> (Allen et al. 2014). The two hybridise where they meet. Esler's Aokautere patch stays on the card
> as "its close cousin, black beech". Esler's Arawaru is a northern Tararua summit, renamed
> **Aruwaru** in the 2017 Rangitāne o Manawatū settlement; the cards use the new name.
**Screen:** glacial alpine · **Sim:** `beech`, 0.6 (warm by the gate; see §3)

**Esler.** Pockets of black beech occur along the Manawatū and Pohangina rivers, but only one fell
inside his district: about 526 ha at Aokautere, at 90–275 m, on leached terraces just crossing onto
greywacke (p. 48). The soils there are very infertile (p. 13). Hard beech is rare, with some hybrids
(p. 48). Beech forest is the one forest type tawa is absent from (p. 45), and black beech regenerates
through mānuka (p. 77).

**Deep time.** Beech is the tree of the ice ages. About 88% of LGM forest pollen is *Nothofagus*,
from scattered stands at every altitude (McGlone et al. 2010). It is also the canopy that suffers
first under ash: *Fuscospora* fell ~13% after Ōruanui, then recovered (Piva et al. 2023). Inland of
Whanganui, black beech today forms ridgeline forest on the poorer soils above ~450 m (Bussell 1988),
the same poor-soil niche as Aokautere. New Zealand's beeches show distribution gaps that the
environment alone does not explain, likely of historic origin (Leathwick & Austin 2001). That fits
the usual reading: beech recolonises slowly after each glacial.

**Card.** *The tree of the ice ages: most forest pollen from the last glacial is beech. It holds
poor soils and sheltered pockets other trees cannot, and fruits heavily in 'mast' years that feed
the forest.*

**Fauna (§2.6).** **Huia** (mockup link, kept). Huia were recorded mostly from the Ruahine,
Tararua and Rimutaka ranges (NZ Birds Online).

### Dracophyllum: *D. filifolium* (Esler), inaka *D. longifolium*
**Screen:** glacial alpine · **Sim:** `dracophyllum`, 0.9 cold

**Esler.** *Dracophyllum filifolium* grows on the Arawaru summit (767 m), in the leatherwood stand
above ~670 m. That community holds at least 11 species found nowhere else in the district: the
Manawatū's one truly subalpine pocket (p. 69).

**Deep time.** The best modern analogue for LGM pollen is subantarctic Campbell Island: about
two-thirds herbaceous, with *Dracophyllum* the dominant woody plant (McGlone et al. 2010). The glacial
Manawatū may have looked more like Campbell Island than like anywhere on the mainland today.
*Dracophyllum* is under-represented in pollen, so its glacial abundance is probably understated. The
genus is most species-rich in New Zealand, from a rapid, recent radiation within the last 3–6 million
years that coincided with mountain uplift and Pleistocene glaciations (Wagstaff et al. 2010).

**Card.** *Stiff, needle-leaved and wind-proof. In the ice ages the Manawatū may have looked like
Campbell Island today, where Dracophyllum is the main woody plant. Its species multiplied as the
mountains rose.*

**Fauna (§2.6).** None. Upland moa, the obvious subalpine browser, was a South Island bird.

### Wharariki / mountain flax: *Phormium cookianum*
**Screen:** glacial alpine · **Sim:** reuses `flax`, 0.7 neutral

**Esler.** On Arawaru, about half the leatherwood stand has died back. *Coprosma*, wharariki, bush
tussock and ferns are invading the dead patches, while leatherwood seedlings return (p. 69). Allan and
Zotov's harakeke × wharariki hybrid was bred from local plants (p. 21).

**Deep time.** Wharariki shares the uplands story above. The two flaxes split the gradient between
them, harakeke in the swamp and wharariki on the cold tops, and they hybridise where they meet. As
treeline swung up and down ~800 m through each cycle, the boundary between their habitats would have
moved with it (inference). There is no direct LGM record for either flax.

**Card.** *Mountain flax is the smaller, drooping cousin of harakeke, at home on cold, windswept
ground. On the Arawaru summit it moves in where old leatherwood dies, and it crosses with harakeke
where the two meet.*

**Fauna (§2.6).** None (tūī belongs to kōwhai).

---

## 5. What's still missing: rimu, kāmahi and the rest

**Short answer: rimu is a major omission; kāmahi is not, for the encyclopedia.** The biggest gap is
one not yet named: the glacial screens have no conifer shrub.

Ranked by what each would add to *this* installation. That weighs the evidence, how it reads in the
side-on cartoon, and whether it fits a screen:

| Rank | Plant | Screen | Verdict |
|---|---|---|---|
| 1 | **Rimu** | Interglacial forest | Major omission |
| 2 | **Bog pine / mountain toatoa** (conifer shrubs) | Glacial flats + alpine | Major omission |
| 3 | **Kaikawaka** (*Libocedrus*) | Glacial alpine | Strong addition |
| 4 | **Raupō** | Interglacial wetland | Strong addition |
| 5 | Northern rātā | Interglacial forest | Good, secondary |
| 6 | Kāmahi | none (montane) | Moderate, and mostly a sim question |
| — | Mātai, pukatea, toetoe, silver beech, māhoe, Hall's tōtara | — | Covered by existing cards or ground palette |

**If three more assets get drawn: rimu, a glacial conifer shrub, raupō.**

### Rimu (*Dacrydium cupressinum*): yes, a major omission

- **Esler.** Rimu was the most conspicuous emergent at Keebles Bush, the district's reference
  podocarp–broadleaf stand (p. 42). The 1868 Linton survey describes rimu and tawa bush (p. 39),
  and Stewart's survey names rimu with tōtara, mātai and tawa across the plains (p. 39). Browns Flat
  was milled mostly for rimu (pp. 40–41). Old rimu still stand over the Tiritea tawa (p. 46), and
  with miro and northern rātā it formed the emergent layer of the Tararua forest (p. 49).
- **Deep time.** Rimu is the conifer of the warm phases. Conifer pollen falls from ~44% of
  pre-human Holocene samples to ~2.8% at the LGM (McGlone et al. 2010). At Waverley, rimu with tawa
  dominated the mid-Holocene forest (Bussell 1988). Even at LGM Onepoto, rimu pollen rose after the
  Ōruanui ash opened the canopy (Piva et al. 2023).
- **Why it matters on screen.** Rimu is the emergent of Esler's two-layer forest: giants over a
  9–15 m tawa canopy. The forest screen can't show that structure without it. It also carries the
  true version of the "Totara" facts that leaked into the research docs.
- **Cost.** It needs new art. The old `sprites/Rimu_*.png` are tiny top-down pixel placeholders from
  the Mauri fork, unusable in the illustrated style. Rimu's weeping, drooping foliage reads
  differently from tōtara's dense crown side-on.
- **Where it goes.** The forest screen, replacing kōwhai there; kōwhai keeps its glacial-flats card.
  It needs a new plant key with a warm tolerance (~0.3), a `PLANT_SPRITE_SETS` entry, and a place in
  the podocarp and montane palettes. Rimu would take nīkau's slot or share it; kōkako would stay with
nīkau unless rimu replaces it, in which case kōkako moves to rimu (its emergent podocarps).

### Glacial conifer shrubs: the biggest gap

In the southern North Island, conifer shrubs are ~26% of LGM pollen, more than all tree pollen
combined (~15%; McGlone et al. 2010). At LGM Onepoto, *Halocarpus*-type pollen alone was 12.5%. It
was also the taxon that thinned as the post-Ōruanui vegetation settled into a milder interstadial
(Piva et al. 2023). The candidates are bog pine (*Halocarpus bidwillii*), mountain toatoa
(*Phyllocladus alpinus*) and snow tōtara (*Podocarpus nivalis*). One sprite of a low, dark, dense
conifer shrub would serve both glacial screens. It would be the single most accurate addition to
the cold half of the encyclopedia, and to the glacial palettes in the sim.

### Kaikawaka / pāhautea (*Libocedrus bidwillii*): the other glacial tree

LGM tree pollen across the North Island was dominated by *Fuscospora*, silver beech and *Libocedrus*
(McGlone et al. 2010). *Libocedrus* pollen also turns up on the Whanganui lowlands around 110 ka,
where it does not grow today (Bussell 1992). Today it is a montane–subalpine tree of the ranges: a
clear story of the cold pushing it down and the warmth pushing it back up. Its narrow spire would
read well in the alpine cluster.

### Raupō (*Typha orientalis*): the missing band of the wetland

The wetland screen is built on the Moutoa sequence: pūrei, then raupō, then harakeke, then swamp
scrub, then kahikatea (p. 59). Raupō is the only band without a card. Esler watched it spread fast
across Pukepuke Lagoon in his own time (p. 60). In the sim it is ground palette, so a card would need
a sprite and a plant key.

### Northern rātā (*Metrosideros robusta*): good, secondary

Northern rātā was an emergent with rimu and miro in the Tararua forest (p. 49), and among the
largest trees around Rongotea (p. 35). *Metrosideros* was scarce or absent at the LGM and common only
afterwards (McGlone et al. 2010), so it is a warm-phase marker like tree ferns. It also has red
crowns and a tūī link. Its best-known story, the possum collapse after 1907, falls outside the
pre-human window.

### Kāmahi (*Pterophylla racemosa*): moderate, and mostly a sim question

Esler believed kāmahi was a major canopy tree of the Tararua rātā–kāmahi forest that the historical
record missed. Settlers did not count it among the timber trees, and its wood rots, so few stumps
survive (pp. 49–52). It replaces tawa with altitude (Bussell 1988). Its pollen disperses poorly, so
pollen records under-count it too (McGlone et al. 2010). It is still a low priority for the
encyclopedia:

- There is no montane screen, and it fits neither the lowland forest nor the glacial screens well.
- Side-on, it would not read as distinct from tawa.
- Its famous story, possums killing it between the 1940s and 1960s, is after the window.

Where kāmahi does matter is the sim's **montane** palette, currently tawa, tōtara, tree fern and
beech. The real Manawatū montane forest was rātā–kāmahi with Hall's tōtara above ~365 m (p. 49). If
montane art is ever drawn, kāmahi comes first.

### Already covered

- **Mātai** is cited in the LGM literature as a tree that survived the glacial maximum even in the
  south. It is also part of Leathwick's mataī–kahikatea–tōtara forest for the plains. It could be
  named in the tōtara card rather than drawn, since side-on it reads like the other podocarps.
- **Pukatea**, the semi-swamp co-dominant, could be named in the kahikatea card.
- **Toetoe** is ground palette, and on the harakeke card it is the plant of the pre-drainage wet
  ground.
- **Silver beech** (the Tararua treeline beech) is folded into the mountain beech card.
- **Māhoe** and **Hall's tōtara** add little visually.

---

## 6. Sources

**Primary**

- Esler, A. E. 1978. *Botany of the Manawatu District, New Zealand.* DSIR Information Series 127.
  Government Printer, Wellington. Read from `research/*.pdf` (OCR'd this pass). Within it: Poole &
  Boyce (1949); Esler (1961, 1969a); Allan & Zotov (1937); Grant (1966).

**Checked against the source this pass**

- McGlone, M. S., Newnham, R. M. & Moar, N. T. 2010. The vegetation cover of New Zealand during the
  Last Glacial Maximum: do pollen records under-represent woody vegetation? ANU E Press, pp. 49–68.
  [PDF](https://press-files.anu.edu.au/downloads/press/p18701/pdf/ch0417.pdf). Source of the LGM
  pollen percentages, the southern North Island figures, the no-zonation finding, the ~800 m treeline
  drop, the Campbell Island analogue and the frost explanation.
- Heenan, P. B. & McGlone, M. S. 2013. Evolution of New Zealand alpine and open-habitat plant species
  during the late Cenozoic. *NZ Journal of Ecology* 37(1): 105–113.
  [PDF](https://newzealandecology.org/nzje/3066_.pdf)
- Bussell, M. R. 1988. Mid and late Holocene pollen diagrams and Polynesian deforestation, Wanganui
  district. *NZ Journal of Botany* 26: 431–451.
  [PDF](https://ref.coastalrestorationtrust.org.nz/site/assets/files/4605/mid_and_late_holocene_pollen_diagrams_and_polynesian_deforestation_wanganui_district_new_zealand.pdf)
  Source of the Waverley drowned tōtara forest, the unrecorded tawa pollen, and black beech on poor
  ridge soils.
- Bussell, M. R. 1992. Late Pleistocene palynology of terrestrial cover beds at the type section of
  the Rapanui Terrace, Wanganui. *Journal of the Royal Society of NZ* 22: 77–90.
  [PDF](https://ref.coastalrestorationtrust.org.nz/site/assets/files/4486/late_pleistocene_palynology_of_terrestrial_cover_beds_at_the_type_section_of_the_rapanui_terrace_wanganui_new_zealand.pdf)
- Piva, S. B. et al. 2023. Millimetre-scale pollen analysis … following the ~25.5-ka Ōruanui
  supereruption. *Journal of Quaternary Science*.
  [doi:10.1002/jqs.3506](https://doi.org/10.1002/jqs.3506) (open access via
  [VUW](https://openaccess.wgtn.ac.nz/articles/journal_contribution/Millimetre_scale_pollen_analysis_of_non_varved_lacustrine_sediments_from_Onepoto_maar_palaeolake_Auckland_reveals_distal_vegetation_responses_and_landscape_recovery_following_the_25_5_ka_ruanui_supereruption_New_Zealand/22180048))
- Shepherd, L. et al. 2017. *Journal of Biogeography*,
  [doi:10.1111/jbi.12963](https://doi.org/10.1111/jbi.12963). Summarised in
  [Te Papa's blog](https://blog.tepapa.govt.nz/2017/03/14/what-can-kowhai-tell-us-about-the-location-of-new-zealands-forests-during-the-ice-ages/).
- Heenan, P. B., de Lange, P. J. & Wilton, A. D. 2001. *Sophora* (Fabaceae) in New Zealand: taxonomy,
  distribution, and biogeography. *NZ Journal of Botany* 39: 17–53.
  [record](https://ref.coastalrestorationtrust.org.nz/documents/sophora-fabaceae-in-new-zealand-taxonomy-distribution-and-biogeography/);
  *S. godleyi* holotype [CHR 517648](https://scd.landcareresearch.co.nz/Specimen/CHR%20517648),
  Pohangina Valley. Hurr et al. (1999) is cited from the 2017 *NZJB* review
  ([PDF](https://ref.coastalrestorationtrust.org.nz/site/assets/files/7508/0028825x_2017.pdf)).
- Koot, E. et al. 2022. Mānuka population genomics. *Horticulture Research*,
  [doi:10.1093/hr/uhab012](https://journal.hep.com.cn/hr/EN/10.1093/hr/uhab012).
- Wagstaff, S. J. et al. 2010. Origin, diversification and classification of the Australasian genus
  *Dracophyllum*. *Annals of the Missouri Botanical Garden* 97(2): 235–258.
  [record](https://researchonline.jcu.edu.au/16514/)
- Leathwick, J. R. & Austin, M. P. 2001. Competitive interactions between tree species in New
  Zealand's old-growth indigenous forests. *Ecology*.
  [record](https://agris.fao.org/search/en/records/65de1e730f3e94b9e5cabf39)
- Harris, W. Cabbage tree common-garden trials (29 stands, 12° of latitude).
  [RNZIH conference paper](https://www.rnzih.org.nz/pages/1999ConferenceWarwickHarris2.htm)
- Nīkau range and frost tolerance: [NZ Geographic](https://www.nzgeo.com/stories/nikau-the-kiwi-palm/);
  kererū and nīkau germination: [Auckland Botanical Society 1996](https://btsnew.nzpcn.org.nz/site/assets/files/20301/auck_1996_51_1_37.pdf).

**Bird habitats for the §2.6 map** (NZ Birds Online species accounts, checked this pass):
[kōkako](https://www.nzbirdsonline.org.nz/species/north-island-kokako),
[Finsch's duck](https://www.nzbirdsonline.org.nz/species/finschs-duck),
[Mantell's moa](https://www.nzbirdsonline.org.nz/species/mantells-moa),
[little bush moa](https://www.nzbirdsonline.org.nz/species/little-bush-moa),
[North Island giant moa](https://www.nzbirdsonline.org.nz/species/north-island-giant-moa),
[stout-legged moa](https://www.nzbirdsonline.org.nz/species/stout-legged-moa),
[North Island goose](https://www.nzbirdsonline.org.nz/species/north-island-goose),
[North Island takahē](https://www.nzbirdsonline.org.nz/species/north-island-takahe),
[North Island brown kiwi](https://www.nzbirdsonline.org.nz/species/north-island-brown-kiwi),
[huia](https://www.nzbirdsonline.org.nz/species/huia).

**Carried over from the repo's deep dives** (not re-checked this pass): Rogers (1994) on fire-induced
grassland; Greenwood & Atkinson (1977) and McGlone & Webb (1981) on divaricates; the kererū
dispersal distances; Ogden & Stewart's lozenge model. See `TEMANAWA_ECOLOGY_LOWLAND.md` and
`TEMANAWA_ECOLOGY_OPEN.md` for links.

**Searched for and not found:** a dated *Chionochloa* radiation study, and any glacial pollen record
for nīkau. Neither is relied on above.
