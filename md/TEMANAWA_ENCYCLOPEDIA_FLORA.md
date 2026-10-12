# Te Manawa — Encyclopedia flora: groupings and plant write-ups

Research companion to `secondscreen/encyclopedia.js`. It does two jobs:

1. **Checks the habitat groupings** on the second screen against the research: Esler's handbook
   and the post-1980 deep-time literature.
2. **Gives a short write-up per plant**: what Esler recorded for the Manawatū, what deep-time work
   adds, suggested card copy for the `desc` field, and a suggested fauna link.

**Status: research and recommendations only.** `encyclopedia.js`, `TeManawa_plant_defs.js` and
`TeManawa_bus.js` are unchanged. §3 lists the code changes the recommendations imply.

**How the sources were used.** Esler (1978) was read from the scans in `research/*.pdf`, which have
no text layer, so they were OCR'd for this pass. Page numbers are the book's own. Every modern figure
below was checked against the paper or its abstract (§5). Where a statement is inference rather than
measurement, it says so. Esler is paraphrased throughout, not quoted.

> ⚠️ **Rimu caution, for anyone reusing the ecology docs.** Commit `b0baa85` renamed the sim key
> `rimu` → `Totara`, and the find-and-replace also ran through the research docs. Several "Totara"
> facts in `TEMANAWA_ECOLOGY*.md` are really about **rimu** (*Dacrydium cupressinum*). Examples: the
> most conspicuous emergent at Keebles Bush, the ~50 m height and 600–800-year lifespan, the 1868
> Linton survey's "rimu and tawa bush", and Norton's *Dacrydium* review. Esler's originals say
> rimu (pp. 39, 42). None of those facts are used for tōtara below.

---

## 1. The framing: switch up is warm, switch down is cold

The four-screen framing is sound, and it maps neatly onto the physical switch:

| Switch | Current title | Era framing |
|---|---|---|
| up ×2 | Forest Habitat | **Interglacial forest** |
| up ×1 | Wetland Habitat | **Interglacial wetland** |
| centre | Select a Habitat | — |
| down ×1 | Lowland Habitat | **Glacial flats** |
| down ×2 | Alpine Habitat | **Glacial alpine** |

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

### 2.5 Recommended roster

| Screen | Five plants | Changes from your list |
|---|---|---|
| **Interglacial forest** | Tōtara · Tawa · Tree fern (mamaku/ponga) · Nīkau · **Kōwhai** | beech → kōwhai |
| **Interglacial wetland** | Kahikatea · Harakeke · Tī kōuka · **Pūrei** (*Carex secta*) · **Tōtara** | sedge renamed; "podocarp" → tōtara |
| **Glacial flats** | Short tussock · Grey scrub (coprosma) · Mānuka · Tī kōuka · Kōwhai | as you proposed |
| **Glacial alpine** | **Black beech** · Dracophyllum · Snow tussock · Leatherwood/grey scrub · **Wharariki** | tree fern → mountain flax; red → black beech |

The roster uses all 13 sprite keys. The seven repeats (tōtara, kōwhai, tī kōuka, coprosma, flax, and
tussock three times including the sedge stand-in) each tell a different habitat story, written into
each card's `desc` separately.

---

## 3. What the sim needs to match (not changed)

The boost gate (`TeManawa_bus.js`, `onBoost`) reads only `coldTolerance`:

- **≤ 0.65 = warm.** The boost succeeds only in an interglacial.
- **≥ 0.75 = cold.** The boost succeeds only in a glacial.
- **In between = neutral.** The boost always succeeds.

If the screens are labelled by era, every plant on a glacial screen must pass in a glacial, and every
plant on an interglacial screen must pass in an interglacial. Otherwise a visitor who picks the right
screen for the climate still gets the grey "wrong" pulse and a desaturated scene.

| Plant (key) | coldTolerance | Gate | Recommended screen(s) | Conflict |
|---|---|---|---|---|
| Black beech (`beech`) | 0.6 | warm | glacial alpine | ❌ A beech boost during a glacial fails and desaturates the scene, the opposite of its `COLD_REFUGE` role. The **current** alpine screen already has this bug. |
| Kōwhai (`kowhai`) | 0.45 | warm | forest + glacial flats | ❌ fails on flats (also on the current lowland screen) |
| Tī kōuka (`cabbagetree`) | 0.6 | warm | wetland + glacial flats | ❌ fails on flats (also on the current lowland screen) |
| Pūrei (currently `tussock`) | 1.0 | cold | interglacial wetland | ❌ a sedge boost in an interglacial fails (also on the current wetland screen) |
| Tree fern (`fern`), current alpine | 0.1 | warm | removed | resolved by removal |
| Nīkau (`nikau`), current lowland | 0.2 | warm | removed | resolved by removal |
| Everything else | | | | ✅ |

Suggested fixes, for you to decide:

- **`beech` → ≥ 0.75 (cold).** Side effects to check: beech joins the TUSSOCK growth set, and kererū
  stop dispersing it. The second is correct, since beech seed is wind-dispersed. Its dormancy
  behaviour also shifts. The beech-refuge assertion in `tools/bootcheck.js` (~line 421) should still
  hold, because `COLD_REFUGE` is a separate set.
- **`kowhai`, `cabbagetree` → 0.7 (neutral, like flax and mānuka).** "Fits both worlds" is what both
  cards will say.
- **A `sedge` plant key for pūrei**, reusing the tussock art at a warm or neutral tolerance. The
  alternative is to accept that the wetland sedge counts as a cold plant in the sim.
- **`TM_BOOST.faunaLinks`** has only four entries. §4 suggests links for the rest.
- **Cosmetic:** a wharariki boost seeds the `flax` key, which lives only in the lowland and wetland
  palettes, so it grows harakeke on the plains.

---

## 4. Plant write-ups

Each entry gives Esler's record, then the deep-time picture, then suggested card copy (~40 words, in
the voice of the four existing cards), then a fauna link. Plants on two screens get two cards.

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
tōtara forests, and almost none survive.*

**Card (wetland).** *Tōtara holds the high, firm levée beside the swamp. When the sea rose after the
last ice age and the water table climbed, whole tōtara forests drowned where they stood. Their stumps
still lie under the Manawatū peat.*

**Fauna.** The mockup links Eyles' harrier, which is loose ecologically: the harrier hunted open and
edge country. Tōtara's real partner is the **kererū** (fruit). Suggest adding it.

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

**Fauna.** **Kererū**: a strong link, as its sole disperser.

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

**Card.** *Tree ferns crowd the stream banks and light gaps of the warm forest, quick to fill any hole
in the canopy. In the ice ages they almost disappeared. If you can see tree ferns, the climate is
warm.*

**Fauna.** None strong. **Kiwi** (forest-floor forager) if a link is wanted.

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

**Card.** *The world's southernmost palm, a slow-growing plant of the shady lowland forest. Its red
fruit feeds kererū. Nīkau cannot survive hard frost, so it grows here only in the warm
interglacials.*

**Fauna.** **Kererū** (fruit), **tūī** (flowers).

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

**Card (forest).** *Kōwhai lights the forest edge and river banks with spring gold. Tūī come for the
nectar and kererū for the leaves. Its seeds float, which is how kōwhai crossed oceans.*

**Card (flats).** *A survivor. DNA shows kōwhai lived through the last ice age across much of New
Zealand, not just in warm northern refuges. On the cold river flats it probably held on along
sheltered banks.*

**Fauna.** **Tūī** (nectar), **kererū** (leaves and flowers).

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

**Card.** *New Zealand's tallest tree, and one that stands in water. Kahikatea grows on the wettest
silt behind the river levées, its roots raised above the swamp. It needs a wandering river to clear
fresh ground for its seedlings.*

**Fauna.** **Kererū** (fruit).

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

**Card.** *Harakeke grows in the band just above the raupō, where swamp meets firmer ground. Its
nectar feeds tūī. Much of the Manawatū's famous flax spread only after the swamps were drained.
Before that, toetoe and raupō held the wettest ground.*

**Fauna.** **Tūī** (nectar).

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

**Card (wetland).** *Keep the existing card-confirmed copy:* "The cabbage tree of open, wet ground
and swamp margins, hardy and frost-tolerant but light-demanding. Its dense flower and fruit heads
feed many birds."

**Card (flats).** *Tough enough for the ice age. Cabbage trees from colder places are genetically
hardier than northern ones. On the wet margins of the cold, open plains, tī kōuka probably stood
above the tussock.*

**Fauna.** **Kererū** (card-confirmed).

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

**Fauna.** **Mōho** / North Island takahē (grazes sedge and tussock bases).

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

**Card (flats).** *In the ice ages grass covered the open plains. Short tussocks of Poa, Festuca and
their kin made the ground layer of a cold, windswept country, grazed by moa, geese and mōho.*

**Card (alpine).** *Snow tussock is the grass of the high tops. Alpine country is young in Aotearoa:
it became a permanent habitat only about a million years ago, as the mountains rose and the climate
cooled.*

**Fauna.** Flats: **North Island goose**, **Finsch's duck**, **mōho**. Alpine: **upland moa**,
**mōho**.

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

**Card (flats).** *Grey scrub is a tangle of tiny-leaved, criss-crossed branches, woven through with
pōhuehue vine. Did it grow that way to keep out moa beaks, or to survive ice-age frost and wind?
Scientists still argue.*

**Card (alpine, as leatherwood).** *At the bushline, tough shrubs take over from trees. Leatherwood,
coprosma and their kin form a dense, waist-high thicket that wind and snow cannot flatten.*

**Fauna.** **Moa** (browse; e.g. Mantell's or heavy-footed).

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

**Card.** *Mānuka is the tough pioneer of poor, wet or burnt ground. It shades out the grass, then
slowly thins to let the next forest in. New Zealand mānuka has been evolving apart from its
Australian relatives for about ten million years.*

**Fauna.** The mockup links kōkako, which is loose: kōkako are birds of tall forest. Keep it if the
design wants it, but it isn't a habitat link.

### Black beech / tawhai rauriki: *Fuscospora solandri*
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

**Card.** *Beech is the tree of the ice ages: most forest pollen from the last glacial is beech. It
holds poor soils and sheltered pockets that other trees cannot, and fruits heavily in "mast" years
that feed the whole forest.*

**Fauna.** **Huia** (card-confirmed). Reasonable: huia lived in the montane forest of the southern
North Island ranges.

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

**Card.** *Stiff, needle-leaved and wind-proof, Dracophyllum grows on the high tops. In the ice ages
the Manawatū may have looked like Campbell Island today, where Dracophyllum is the main woody plant.
Its species multiplied as the mountains rose.*

**Fauna.** **Upland moa** (the subalpine moa).

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
ground. On the Arawaru summit it moves in where old leatherwood dies. Tūī carry its pollen from flower
to flower.*

**Fauna.** **Tūī** (nectar).

---

## 5. Sources

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

**Carried over from the repo's deep dives** (not re-checked this pass): Rogers (1994) on fire-induced
grassland; Greenwood & Atkinson (1977) and McGlone & Webb (1981) on divaricates; the kererū
dispersal distances; Ogden & Stewart's lozenge model. See `TEMANAWA_ECOLOGY_LOWLAND.md` and
`TEMANAWA_ECOLOGY_OPEN.md` for links.

**Searched for and not found:** a dated *Chionochloa* radiation study, and any glacial pollen record
for nīkau. Neither is relied on above.
