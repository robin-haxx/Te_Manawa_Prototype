# Te Manawa — Encyclopedia cards (draft)

Draft card text for every plant on the second screen. Each card has three parts:

1. **Fun facts.** Several candidates are given where there are several; ★ marks the suggested lead.
2. **Role in the ecosystem, and in the Manawatū.**
3. **Boost it.** What a boost does in the sim, and how its bird connects.

The research behind each line is in `TEMANAWA_ENCYCLOPEDIA_FLORA.md` (Esler 1978 and the deep-time
studies) and its §2.6 (the bird for each plant). Each "Boost it" section was **measured**: every
plant was boosted headlessly through a full time-lapse (§ "What the trials showed", at the end). The
figures are from the re-run of 2026-10-14, after the four sim gaps the first trials found (and a
fifth they led to) were fixed; see "Sim gaps" at the end.

**Status: draft for review, not yet on screen.** The live cards (`secondscreen/encyclopedia.js`)
show a single ~30-word paragraph, so these three-part cards need either a longer card or a layout
change, for example three short blocks or a tap-to-turn card. Māori names, uses and kōrero are left
out on purpose: they are for co-design with Rangitāne o Manawatū (`TEMANAWA_RESEARCH.md`, cultural
grounding).

---

## How a boost works (shared by every card)

- **Right climate, it grows.** The plant gets **12 seedlings** wherever its habitat is on the map.
  **Two of its bird** join the cast. The plant and its bird are ringed with an outline for ~20 s:
  green in a warm period, blue in a cold one. Then the **time-lapse** runs to the next climate swing:
  warm to cold, or cold to warm.
- **Warm plants** (forest trees) also fire an **8-second forest growth pulse**: every warm plant on
  the map grows a little. A warm gust blows across the scene.
- **Cold plants** (tussock, scrub, beech, *Dracophyllum*) fire the **tussock growth pulse** and a
  cold gust. In a glacial they also fire the **tussock flush**: while it runs, the open-country
  grazers (North Island goose, Finsch's duck, mōho, Mantell's and stout-legged moa) feed more easily
  and breed sooner.
- **"Both-worlds" plants** (kōwhai, tī kōuka, harakeke, mānuka, pūrei, wharariki) succeed in either
  climate but fire no growth pulse.
- **Wrong climate, nothing grows.** No seedlings, no birds, a grey outline, and the colour drains
  from the scene. This is the lesson.

---

## Interglacial forest

### Tōtara · *Podocarpus totara*
*Cards: Forest, Wetland · Bird: Eyles' harrier · Warm*

**Fun facts**
- ★ **Tōtara barely rots.** Logs dug out of Manawatū swamps still had their bark and pink wood, and
  the fence posts split from them lasted for decades in wet ground.
- **Forests that drowned standing.** Rising water tables have killed whole tōtara forests where they
  stood. Rooted stumps stand under nearly two metres of peat near Himatangi. At Waverley Beach, a
  tōtara forest drowned as the sea rose after the last ice age, about 6,500 years ago.
- The Manawatū's finest tōtara grew on the dry Rongotea–Ohakea terraces, right at the edge where
  forest gives way to grassland.
- Unlike most podocarps, tōtara can pioneer open ground and grows back fast in gaps opened by storms.

**Role in the ecosystem, and in the Manawatū.** Tōtara is a giant podocarp of free-draining ground:
river levées, terraces and dry downlands. Birds eat the fleshy red stalks that hold its seeds and
spread them. Along the Manawatū and Ōroua rivers, tōtara held the higher, coarser levées while
kahikatea took the wet silt beside them. Almost all of this forest was milled. Its stumps, buried
logs and place names are most of what is left to read it by.

**Boost it.** It works in a **warm period**. Tōtara saplings sprout in the lowland and hill forest,
and the forest growth pulse pushes every warm plant along. **Two Eyles' harriers** join (measured
3 → 5). The harrier hunts whichever grazer has grown beyond its comfortable number and spares the
scarce ones, so more harriers keep the cast in balance. As the time-lapse carries the land into the
cold, the forest shrinks downhill. Tōtara caught outside it topples and fades to rootstock, then
regrows when the warmth returns. Storms can throw tall tōtara, leaving gaps. *Measured: 12 seeded;
4–11 still standing when the climate reached the glacial threshold (it varies run to run with where
the shrinking forest leaves them).*

### Tawa · *Beilschmiedia tawa*
*Card: Forest · Bird: kererū · Warm*

**Fun facts**
- ★ **One bird holds its future.** The kererū is the only living bird big enough to swallow tawa's
  large, plum-like fruit and carry its seed away.
- Tawa grew in every kind of Manawatū forest except one: beech forest.
- **Almost invisible in the fossil record.** Tawa pollen doesn't preserve, so scientists have to
  infer where tawa forests stood.
- In the Manawatū Gorge, tawa forms a pure canopy over 30 m tall, so dark that the plants beneath it
  struggle for light.

**Role in the ecosystem, and in the Manawatū.** Tawa is the shade-tolerant broadleaf canopy that
grows beneath the giant podocarps, and the forest the land returns to when the podocarps stop
regenerating. The best-preserved forest of any kind in the district is the tawa of the Tiritea
catchment, sheltered from the westerly gales.

**Boost it.** It works in a **warm period**. Tawa sprouts in the lowland and hill forest, with the
forest growth pulse. **Two kererū** join (measured 1 → 3, still 3 at the end). In the sim the kererū is the forest's
engine. It feeds at warm fruit trees and drops their seed away from the parent, planting new tawa,
tōtara, nīkau and tree ferns. With no kererū, the forest stops regenerating and the scene greys.
Into the cold, tawa retreats with the rest of the forest, and storms can throw it. *Measured: 12
seeded; 9–10 standing at the glacial threshold.*

### Mamaku & ponga (tree ferns) · *Cyathea medullaris, C. dealbata*
*Card: Forest · Bird: kiwi · Warm (the most cold-sensitive plant in the sim)*

**Fun facts**
- ★ **A climate thermometer.** Tree-fern spores are about 7% of the pollen in warm-period forest, but
  only 0.7% at the height of the last ice age. If you can see tree ferns, it's warm.
- Mamaku is New Zealand's tallest tree fern, up to about 20 m.
- Ponga's frond undersides are silver: it is the silver fern.
- **Fast healers.** Within 50 years of the Kahuterawa valley being cleared, mamaku lined its streams
  in dense, elegant stands.

**Role in the ecosystem, and in the Manawatū.** Tree ferns are fast-growing fillers of stream banks
and light gaps in the warm forest. They come early in the forest's regrowth, soon after the first
shrubs. Whekī covered the floodable stream terraces of Keebles Bush, and mamaku and ponga stand
above the shrubs of the Tiritea tawa forest. They are frost-tender.

**Boost it.** It works in a **warm period**. Tree ferns sprout in the lowland and hill forest, with
the forest growth pulse. **Two kiwi** join (measured 3 → 5, still 5 at the end). In the sim a kiwi probing the leaf
litter speeds the regrowth of the plants around it, so the forest floor stays lusher wherever kiwi
work. As the cold deepens, tree ferns are the first to go, to cold dormancy and the shrinking
forest. An eruption hits them harder than any other plant. *Measured: 12 seeded; 8–10 standing at
the glacial threshold.*

### Nīkau · *Rhopalostylis sapida*
*Card: Forest · Bird: kōkako · Warm*

**Fun facts**
- ★ **The world's southernmost palm**, reaching the Chatham Islands at about 44° S.
- **Frost-tender.** A few degrees of frost damages it, so a nīkau is a sign of a warm period.
- Esler, whose 1978 survey this encyclopedia draws on, studied how nīkau flower and fruit in the
  Kahuterawa valley.

**Role in the ecosystem, and in the Manawatū.** Nīkau is an understorey palm of the lowland forest.
It grows under tawa in the Tiritea and the Manawatū Gorge, and in the swamp forest at Himatangi
Bush. It arrives late in the forest's regrowth, alongside tawa. Birds eat its red fruit.

**Boost it.** It works in a **warm period**. Nīkau sprouts in the lowland forest and the swamp
margin, with the forest growth pulse. **Two kōkako** join (measured 1 → 3, still 3 at the end). In the sim the kōkako
sings, holds a territory and feeds at the warm forest's fruit trees, nīkau among them. It carries
some of their seed, at about 40% of the kererū's rate. As the cold arrives, nīkau sinks into
dormancy, and eruptions hit it hard. *Measured: 12 seeded; 3–10 standing at the glacial threshold
(it varies run to run).*

### Kōwhai · *Sophora microphylla, S. godleyi*
*Cards: Forest, Lowland · Bird: tūī · Both worlds*

**Fun facts**
- ★ **Its seeds float.** Buoyant seed is how the kōwhai's family spread across the southern Pacific.
- **An ice-age survivor.** DNA shows kōwhai lived through the last ice age across much of New
  Zealand, not just in warm northern pockets.
- **A local species.** Godley's kōwhai was named in 2001 from a tree in the Pohangina Valley, and
  grows on the papa (mudstone) hill country.
- The Kōwhai swamp of the Taonui basin carries its name.

**Role in the ecosystem, and in the Manawatū.** Kōwhai is a flowering tree of forest edges and
riverbanks, and a spring nectar source for tūī. Esler records it among the smaller trees of the
Rongotea tōtara forest and the forests on the sand dunes.

**Boost it.** It works in **either climate**: kōwhai straddles the warm and cold worlds. Kōwhai
sprouts on the lowland and in the forest; there is no growth pulse. **Two tūī** join (measured
2 → 4, still 4 at the end). In the sim the tūī sings, defends a large territory and flies strongly.
It feeds at kōwhai, harakeke and wharariki flowers, and at the forest's fruit trees. Nectar carries
no seed, so only its fruit meals plant new forest. *Measured: 12 seeded; 10 standing at the
threshold. Left to feed after a kōwhai boost, every tūī visit was to kōwhai or harakeke.*

---

## Interglacial wetland

### Kahikatea · *Dacrycarpus dacrydioides*
*Card: Wetland · Bird: little bush moa · Warm*

**Fun facts**
- ★ **New Zealand's tallest tree**, up to about 60 m.
- **A tree that stands in water.** At Round Bush near Foxton, people crossed the flooded forest by
  stepping along its giant raised roots.
- Its pale, odourless timber made butter boxes. One Kōpane sawmill alone cut about a million super
  feet of it.
- **A pioneer, not a climax tree.** Kahikatea colonises fresh silt laid down by a wandering river.
  If the river stops moving, the stand grows old and is not replaced.

**Role in the ecosystem, and in the Manawatū.** With pukatea, kahikatea formed the swamp forest on
the wettest, finest silt behind the river levées. It was most extensive in the Taonui basin, where
the Manawatū and Ōroua meet. Remnants stand at Round Bush and Himatangi Bush. Birds eat its fruit.

**Boost it.** It works in a **warm period**. Kahikatea sprouts in the wetland and lowland forest,
and **two little bush moa** join (measured 3 → 5, 4 at the end). The moa browse prunes plants but
never removes them. The forest growth pulse doesn't force kahikatea to grow; it hurries its life
cycle along instead. Kahikatea needs the river to keep moving. A boost plants it only on the river
wetland, as if on fresh flood silt, and while the time-lapse runs the river is working its whole
floodplain, so the stand stays young. At rest the river is still: a stand then ages out unless a
storm flood or an eruption's sediment pulse renews it. *Measured: 12 seeded; all 12 standing at the
threshold.*

### Harakeke · *Phormium tenax*
*Card: Wetland · Bird: Mantell's moa · Both worlds*

**Fun facts**
- ★ **Harakeke built a local industry.** Flax mills worked both banks of the Manawatū, and the 1949
  survey that mapped the Moutoa swamp was done to manage the flax crop.
- Much of the famous Manawatū flax spread only after the swamps were drained. Before that, toetoe and
  raupō held the wettest ground.
- Harakeke and mountain flax cross. Botanists Allan and Zotov bred a hybrid from local Manawatū
  plants.

**Role in the ecosystem, and in the Manawatū.** Harakeke grows in the band just above the raupō in
the swamp sequence: from sedge in open water, through raupō and flax, to cabbage-tree scrub and
kahikatea forest, all within about 1.8 m of height. Its flowers feed nectar-eating birds. Flax
flats now cover peat that buried older forests.

**Boost it.** It works in **either climate**. Harakeke sprouts on the lowland and in the wetland,
and **two Mantell's moa** join (measured 4 → 6, 5 at the end). Mantell's moa is an open-country grazer of lowland
swamps and dunes, so in a glacial it also shares the tussock flush when a cold plant is boosted.
Harakeke rides out storms, and an eruption's ash makes the swamp bloom rather than die. *Measured:
12 seeded; 10–12 standing.*

### Tī kōuka · *Cordyline australis*
*Cards: Wetland, Lowland · Bird: Finsch's duck · Both worlds*

**Fun facts**
- ★ **Cold tolerance runs in its genes.** Cabbage trees grown from southern seed are hardier than
  those from the north.
- Esler studied wild hybrids between the cabbage tree and the forest cabbage tree
  (*C. banksii*).
- Cabbage trees can regrow from their base after fire or damage.

**Role in the ecosystem, and in the Manawatū.** Tī kōuka forms the swamp scrub, with coprosma,
between the flax and the kahikatea. It stands around the coastal lagoons, and it arrives on the wet
hollows between dunes after about 50 years. Its flower and fruit heads feed many birds.

**Boost it.** It works in **either climate**. Tī kōuka sprouts on the lowland and in the wetland,
and **two Finsch's ducks** join (measured 5 → 7, 6 at the end). Finsch's duck was a grazing duck of
open country, so in a glacial it also shares the tussock flush. Near the coast, storms can bury young
tī kōuka. *Measured: 12 seeded; 11–12 standing.*

### Pūrei · *Carex secta*
*Card: Wetland · Bird: mōho (North Island takahē) · Both worlds*

**Fun facts**
- ★ **It builds its own pedestal.** Pūrei stands in open water on a trunk-like column of its own old
  roots.
- When Lake Horowhenua was lowered, its pūrei was stranded on dry ground and kept growing happily,
  until it was burnt for farmland.
- **Sedges love an eruption.** After the Ōruanui supereruption 25,500 years ago, sedges spread for
  about 60 years as ash-silt widened the lake edges.

**Role in the ecosystem, and in the Manawatū.** Pūrei is the first plant at the deep, open-water
edge of the swamp. It grows at Moutoa, and with raupō around Pukepuke Lagoon.

**Boost it.** It works in **either climate**. Pūrei sprouts in the wetland, and **two mōho** join
(measured 3 → 5, still 5 at the end). The mōho is a grazer of open country, so in a glacial it also
shares the tussock flush. *Measured: 12 seeded; all 12 standing.*

---

## Glacial alpine

### Mountain beech · *Fuscospora cliffortioides* (was black beech, *F. solandri*)
*Renamed 2026-10-15: the Alpine screen shows the ranges, whose beech is mountain beech; see
`TEMANAWA_ENCYCLOPEDIA_FLORA.md`, black beech section. The Aokautere facts below are black beech.*
*Card: Alpine · Bird: huia · Cold*

**Fun facts**
- ★ **The tree of the ice ages.** About 88% of the forest pollen from the last glacial maximum is
  beech.
- In the warm Manawatū, beech forest covered just one patch: about 526 ha at Aokautere, on
  very infertile soil.
- **Mast years.** In some years every beech floods the forest with seed at once.
- **Beech moves slowly.** New Zealand's beeches have gaps in their range that today's climate
  doesn't explain, likely a legacy of the ice ages.

**Role in the ecosystem, and in the Manawatū.** Black beech holds poor soils and sheltered pockets
other trees can't keep. In the cold it is the forest that survives. Esler saw it regrowing through
mānuka at Aokautere. Inland of Whanganui it still forms forest along the ridges on poor soil.

**Boost it.** It works in a **cold period**. Beech sprouts in the hill forest, with the tussock
growth pulse and flush. **Huia** join in pairs (measured 2 → 6, still 6 at the end), and each pair
forages together at one tree. Huia work beech for huhu grubs in dead wood, as well as the warm
forest's fruit trees, taking whichever is nearer. Grubs carry no seed. Beech is exempt from the
forest's retreat in the cold: it holds through the glacial. Storms can throw tall beech. *Measured:
12 seeded; 7–9 standing as the climate warmed to the threshold.*

### Snow tussock · *Chionochloa*
*Card: Alpine (the Lowland "Tussock" card shares this plant; see below) · Bird: North Island goose ·
Cold*

**Fun facts**
- ★ **Alpine country is young.** Permanent alpine habitat appeared in New Zealand only about a
  million years ago, as the mountains rose and the climate cooled.
- **In the ice ages, tussock grassland ran from the coast to the summits.** The same open grassland
  covered everything from sea level to 800 m.
- The tall tussocks now in the Tiritea catchment spread only after the forest canopy there opened in
  the 20th century.

**Role, and Boost it.** See *Tussock* below; it is the same plant in the sim.

### *Dracophyllum* · *Dracophyllum filifolium*
*Card: Alpine · Bird: none · Cold*

**Fun facts**
- ★ **The ice-age Manawatū may have looked like Campbell Island** today, where *Dracophyllum* is the
  main woody plant.
- **Born with the mountains.** New Zealand has more *Dracophyllum* species than anywhere else, and
  most arose in the last 3–6 million years, as the mountains rose and the ice ages began.
- Esler found *D. filifolium* on the Arawaru summit, the Manawatū's one subalpine pocket.

**Role in the ecosystem, and in the Manawatū.** *Dracophyllum* is a stiff, needle-leaved shrub of
cold, windswept, infertile ground, often with mānuka in heath. On Arawaru it grows in the leatherwood
cap with plants found nowhere else in the district.

**Boost it.** It works in a **cold period**. *Dracophyllum* sprouts on the subalpine tops, which only
exist once the ranges have risen, with the tussock growth pulse and flush. **Two North Island giant moa** join (shared with grey
scrub, 2026-10-15; the obvious subalpine browser, the upland moa, was South Island only). *Measured: 12 seeded at 150 ka and at
30 ka; 10 standing.* Before the ranges rise (around 1 Ma) there are no subalpine tops, so a boost
then plants nothing.

### Subalpine scrub · *Olearia colensoi, Coprosma*
*Card: Alpine (shares the grey-scrub plant; see Grey scrub below) · Bird: North Island giant moa ·
Cold*

**Fun facts**
- ★ **A summit like no other.** Leatherwood caps the Arawaru summit, with at least 11 plants found
  nowhere else in the Manawatū.
- Leatherwood stands die back and return in waves; on Arawaru, new seedlings refill the gaps.

**Role, and Boost it.** See *Grey scrub* below.

### Wharariki (mountain flax) · *Phormium cookianum*
*Card: Alpine · Bird: none · Both worlds*

**Fun facts**
- ★ **Harakeke's mountain cousin.** Smaller and drooping, it crosses with harakeke where the two
  meet.
- On the Arawaru summit it moves into the gaps where old leatherwood dies.
- Birds carry its pollen from flower to flower.

**Role in the ecosystem, and in the Manawatū.** Wharariki fills gaps on cold, windswept tops and
cliffs.

**Boost it.** It works in **either climate**. Wharariki sprouts on the subalpine tops, and **two tūī** join
(shared with kōwhai, 2026-10-15; tūī already feed at its flowers). *Measured: 12 seeded at 150 ka and at 30 ka; 9–12 standing, still small (it grows slowly).*
Like *Dracophyllum*, it has nowhere to go before the ranges rise.

---

## Glacial flats

### Tussock · *Poa, Festuca, Rytidosperma* (and snow tussock, *Chionochloa*)
*Cards: Lowland ("Tussock"), Alpine ("Snow tussock") · Bird: North Island goose · Cold*

**Fun facts**
- ★ **The ice-age Manawatū was grassland.** Grass made up about 41% of the pollen at the height of
  the last ice age.
- **The goose followed the grass.** The North Island goose was most widespread in the ice ages and
  shrank back as the forests returned.
- The lowland grassland the first Europeans saw was mostly made by fire after people arrived. In
  warm periods before people, it didn't exist.

**Role in the ecosystem, and in the Manawatū.** Tussock is the ground layer of the cold-period
mosaic of grass and grey scrub, food for the big grazing birds. The same grassland ran from the
coast to the tops, because the ice-age landscape had no tidy bands by altitude.

**Boost it.** It works in a **cold period**. Tussock sprouts on the lowland, in the wetland and on
the tops. The tussock growth pulse grows every cold-hardy plant, and the tussock flush lets the
open-country grazers feed and breed more easily while it runs. **Two North Island geese** join
(measured 5 → 7, and still 7 when the time-lapse ended: the flush keeps them going). Tussock is
hardy in storms and ash. *Measured: 12 seeded; all 12 standing as the climate warmed.*

### Grey scrub · *Coprosma, Muehlenbeckia*
*Cards: Lowland ("Grey scrub"), Alpine ("Subalpine scrub") · Bird: North Island giant moa · Cold*

**Fun facts**
- ★ **A tangle on purpose?** About 60 New Zealand shrubs grow in this criss-crossed, tiny-leaved way.
  Whether they evolved to fend off moa beaks, or to survive ice-age frost and wind, is still argued.
  One of the scientists who first proposed the moa idea, R. M. Greenwood, worked alongside Esler in
  the Manawatū.
- **The giant moa could browse three metres up**, the height at the centre of that argument.
- "Miki" (mingimingi) once covered the wetlands around the Manawatū's coastal lagoons. It was cleared
  only decades before Esler wrote.
- Coprosma was among the commonest shrubs of the last ice age, and it surged after the Ōruanui
  eruption. Lizards are major spreaders of its seed.

**Role in the ecosystem, and in the Manawatū.** Grey scrub is the woody body of the cold-period
mosaic. It grows on frosty river terraces, dry ground and the tops, and is woven through with
pōhuehue vine. Its berries feed birds and lizards, and its twigs fed moa.

**Boost it.** It works in a **cold period**. Grey scrub sprouts on the lowland, in the wetland and on
the tops, with the tussock growth pulse and flush. **Two North Island giant moa** join (measured
3 → 5, still 5 at the end). Moa browse makes grey scrub smaller but never removes it. *Measured: 12
seeded; all 12 standing.*

### Mānuka · *Leptospermum scoparium*
*Card: Lowland · Bird: stout-legged moa · Both worlds*

**Fun facts**
- ★ **Fire opens its seed capsules**, releasing thousands of tiny seeds. That is why so much of
  today's mānuka scrub is a product of human fire.
- New Zealand mānuka has been evolving apart from its Australian relatives for 9–12 million years,
  and has distinct regional gene pools.
- Esler worked out mānuka's life story at Aokautere: pioneer, building, mature, degenerate. He also
  saw black beech regrowing through it.

**Role in the ecosystem, and in the Manawatū.** Mānuka is the pioneer of poor, dry or wet ground,
such as the leached Aokautere terraces and the dry sand plains. It shades out grass, then thins to
let the next forest in.

**Boost it.** It works in **either climate**. Mānuka sprouts on the lowland, in the wetland and on
the tops, and **two stout-legged moa** join (measured 3 → 5, still 5 at the end). The stout-legged
moa was a grazer of dry, open lowland country, so in a glacial it also shares the tussock flush.
Mānuka rides out storms, and it grows slowly. *Measured: 12 seeded; all 12 standing, at about
half-grown by the end.*

### Kōwhai (Lowland card)
*Same plant as the Forest card above.* Suggested lead fact for the cold card: **an ice-age
survivor** (DNA shows it lived through the last glacial across much of New Zealand).

### Tī kōuka (Lowland card)
*Same plant as the Wetland card above.* Suggested lead fact for the cold card: **cold tolerance runs
in its genes**.

---

## What the trials showed

Each plant was boosted headlessly (`tools/bootcheck.js`'s boot, then `TMBus.boost` and the full
time-lapse played frame by frame). Warm and both-worlds plants were boosted at 122 ka (an
interglacial); cold plants at 150 ka (a glacial). The time-lapse ran to the next climate swing.
Figures are from the re-run after the fixes below (2026-10-14); where the first run differed, it is
in brackets.

| Plant | Seeded (of 12) | Standing at end | Its bird: before → after boost → end of time-lapse |
|---|---|---|---|
| Tōtara | 12 | 4–11 | harriers 3 → 5 → 5 |
| Tawa | 12 | 9–10 | kererū 1 → 3 → 3 (was → 2) |
| Tree fern | 12 | 8–10 | kiwi 3 → 5 → 5 (was → 3) |
| Nīkau | 12 | 3–10 | kōkako 1 → 3 → 3 (was → 2) |
| Kōwhai | 12 | 10 | tūī 2 → 4 → 4 (was → 2) |
| Kahikatea | 12 | **12** (was 0: all aged out) | little bush moa 3 → 5 → 4 (was → 2) |
| Harakeke | 12 | 10–12 | Mantell's moa 4 → 6 → 5 (was → 2) |
| Tī kōuka | 12 | 11–12 | Finsch's duck 5 → 7 → 6 (was → 2) |
| Pūrei | **12** (was 1–2) | 12 | mōho 3 → 5 → 5 (was → 2) |
| Tussock | 12 | 12 | goose 5 → 7 → 7 |
| Grey scrub | 12 | 12 | NI giant moa 3 → 5 → 5 (was → 2) |
| Beech | 12 | 7–9 | huia 2 → 6 → 6 (was → 5) |
| *Dracophyllum* | **12** (was 0–2) | 10 | — |
| Mānuka | 12 | 12 | stout-legged moa 3 → 5 → 5 (was → 2) |
| Wharariki | **12** (was 0–4) | 9–12 | — |
| Tawa in a glacial (wrong climate) | 0 | — | kererū 1 → 1 → 1, grey outline |

*Dracophyllum* and wharariki were also boosted at 30 ka, with the same result. Standing counts for
the warm trees vary run to run: the time-lapse carries the land into the cold, and the forest shrinks
around wherever the seedlings happened to land.

**About the birds:** a boost founds two birds immediately, and they now stay through the
time-lapse. In the first trials nearly every grazer fell back to its floor of 2 during the
fast-forward (Finsch's duck 5 → 7 → 2), so the boost's "the birds answer the plant" ended with fewer
birds than it began. That was a sim bug (gap 5 below), not ecology.

## Sim gaps these cards exposed (fixed 2026-10-14)

The first trials found four places where the sim didn't deliver the story the cards tell. Fixing
them exposed a fifth. All five are fixed, and `tools/bootcheck.js` ("boost follow-through")
asserts each one; every check was mutation-tested against the bug it guards.

1. **Plants of small habitats barely seeded.** Pūrei got 1–2 of 12 seedlings, *Dracophyllum* 0–2
   and wharariki 0–4. `Simulation.seedSpecies` tried random points across the whole map, and the
   wetland strip and subalpine tops are small. **Fixed:** the boost now samples only cells of the
   biomes whose palette lists the plant, so every plant seeds 12 of 12 where its habitat exists.
   The density gate is unchanged.
2. **A kahikatea boost died out.** All 12 seedlings aged past `kahiMaxAge` inside the time-lapse.
   **Fixed:** a kahikatea boost seeds only on the river wetland, as a fresh flood (age 0, plus a
   `disturb()` flood). While deep time is moving (a time-lapse or deep burst), wetland kahikatea
   don't age, because the river is working its floodplain. At rest the old rule holds: a stand ages
   out unless a storm or eruption renews it. All 12 now stand at the threshold.
3. **Tūī didn't feed at flowers.** **Fixed:** species can list `extraForage` plants that they feed
   at without carrying seed. The tūī lists kōwhai, harakeke and wharariki. A feed at one of these
   leaves a seedless crop, so the dispersal legs that follow plant nothing.
4. **Huia didn't feed in beech.** **Fixed:** huia list beech as `extraForage` (huhu grubs in dead
   wood, so no seed). They still take a warm fruit tree when it is nearer, so in a mixed forest most
   visits stay with tawa and kahikatea.
5. **Every time-lapse starved the grazers.** Found while measuring the birds above. Hunger burned on
   the sped-up life clock, but birds find and eat food at real walking pace, so up to ten times the
   hunger met the same meals. **Fixed:** all bird metabolism (moa guild, forest flyers, harrier) now
   runs on the real clock: hunger, habitat stress and starvation. Ageing, breeding and plant
   succession still run on the life clock. At rest nothing changes. In a time-lapse, birds now hold
   or breed up (to the existing per-species targets) instead of crashing to their floor. See
   `MISTAKES.md`.

**Still open (not bugs, but worth knowing for the cards):**

- *Dracophyllum* and wharariki have no habitat before the ranges rise (around 1 Ma, at the start of
  the timeline). A matched boost then plants nothing, though the outline still shows blue.
- *Dracophyllum* (giant moa) and wharariki (tūī) gained birds on 2026-10-15, under the bird policy
  (one bird per plant, each bird on one or two plants). Not yet re-measured.
- Rimu, mountain toatoa and raupō may join the roster later (`TEMANAWA_ENCYCLOPEDIA_FLORA.md` §5).
