# Te Manawa — The Natural History of the Manawatū

**What makes this place's deep past unusual, how the river made it, and how the installation
carries it.** Three parts: the land (I), the predator at the top of the food web (II), and the
forest that swung back and forth with the ice ages (III). Each part gives the natural history
first, then **In Te Manawa** (where the build carries it, with code pointers), then **Where the build
takes licence** (the places the sim compresses, simplifies or departs from the evidence).

**Status: research synthesis, 2026-10-18.** It draws on the five ecology deep dives,
`TEMANAWA_SPECIES_KERANGI.md`, `TEMANAWA_ENCYCLOPEDIA_FLORA.md`, `TEMANAWA_DEEPTIME_ECOLOGY_PLAN.md`
and `TEMANAWA_GEOGRAPHY.md`. The key claims were checked again this pass against primary or
first-hand sources (listed at the end). Where something is inference rather than measurement, the
text says so. `TEMANAWA_PLAN_V3.md` stays the design spine; this document decides nothing about the
build.

> **In one sentence.** The Manawatū River held its line while mountains rose across it, the sea
> came and went at its mouth, and the forest on its banks swung between tall podocarp and open
> tussock about a dozen times, while a giant harrier hunted over all of it.

---

## New findings from this pass

Five results that other documents should pick up. **Items 1 and 2 were applied on 2026-10-18** to
`TEMANAWA_SPECIES_KERANGI.md` §9, `TEMANAWA_ECOLOGY_FAUNA.md` §2/§8/§9, `TEMANAWA_RESEARCH.md`,
`TEMANAWA_FAUNA.md` (§1.1, §1.3, §3, §4; the adzebill's Local score rose from 3 to 5) and
`TEMANAWA_SPECIES_SUMMARY.md` (goose row). Item 4 is fixed in code. Items 3 and 5 live only here
so far.

1. **The "extinct predator" in the Te Ahu a Tūranga bones is the North Island adzebill, not the
   harrier.** Holdaway's 2022 Birds New Zealand conference abstract lists several individuals of
   two moa genera, *Euryapteryx* and *Pachyornis* (both sexes of *Euryapteryx*), at least one North
   Island adzebill (*Aptornis otidiformis*), at least one North Island goose (*Cnemiornis gracilis*)
   and an unidentified moa hatchling. It lists no raptor. That answers the "highest-value open
   question" in `TEMANAWA_SPECIES_KERANGI.md` §9.1 and `TEMANAWA_ECOLOGY_FAUNA.md` §9.1. The good
   news for the cast: *Euryapteryx* is the stout-legged moa and *Pachyornis* the Mantell's moa.
   Both are founded in the sim, and so is the goose. Also: the original bones were **returned to
   the Ruahine maunga**. Te Manawa and Te Papa hold **replicas** made from 3D scans, so
   `TEMANAWA_RESEARCH.md`'s "held at Te Manawa" should say replicas.
2. **The Manawatū Strait had closed by ~1.6 Ma**, before the window opens (Rees, Palmer & Palmer).
   It was widest at ~2.4 Ma, when a sea lay right where the Ruahine and northern Tararua stand
   (Trewick & Bland 2012). At 1 Ma the axis was a low emergent finger of basement, the ranges were
   just beginning their rapid rise, and a lake had ponded at the gorge. The sim's opening showed the
   2.4 Ma picture. **Steps 1–5 of the re-dating were built on 2026-10-18**; steps 6–7 (soften the
   opening water, copy) remain. See §I "Where the build takes licence".
3. **There is a dated challenge to pure antecedence.** Fish genetics (Craw et al. 2019) put a
   tectonic river capture at **~500 ka**, after which the "apparently antecedent" gorge formed
   (§I.2).
4. ~~**The harrier's 40 kg prey ceiling is not in the code.**~~ ✅ **Fixed 2026-10-18**
   (`EylesHarrier.withinPreyCeiling`; §II, In Te Manawa). Adult giant moa are no longer prey.
5. **Harrier mass figures disagree between sources**: NZ Birds Online gives 3.0–3.5 kg, Wikipedia
   gives an adult female 2.5–3 kg, and other estimates run two to four times a swamp harrier. Use
   **about 2.5–3.5 kg** and say it is an estimate.

---

## I. A river older than mountains

> **The frame.** Te Manawa shows the lower Manawatū as it sits on Trewick & Bland's (2012) 1 Ma map
> (their Fig. 4D). From west to east: the eastern edge of the Whanganui Basin (open sea, then the
> pale band that was land at lowstands and marginal-marine at highstands), the proto-Ruahine and
> proto-Tararua along the axis, the young Manawatū crossing between them, and the Mount Bruce drainage
> divide to the south-east. The tectonic and biogeographic story below is about exactly this patch.

### I.1 The seaway came first (Pliocene to ~1.6 Ma)

Five to six million years ago the Manawatū plain was seabed. For most of the Pliocene the lower
North Island was a scatter of low islands in a shallow sea, and a seaway, the **Manawatū Strait**,
ran across the line the axial ranges now occupy. It linked the Whanganui Basin in the west with the
Ruataniwha Strait on the east coast, over the low point now called the Manawatū Saddle. The whole
area sits on the same greywacke basement block. The strait was a structural low in it, draped with
younger marine sediment (Milner 2017). Its oldest rocks record a regional subsidence (the "Tangahoe
pull-down"); its youngest (Castlecliffian) record its final uplift and emergence.

Trewick & Bland (2012) map it in three stages:

| When | The axis |
|---|---|
| **~3 Ma** | A narrow peninsula of low land where the Tararua now stands, separated by a narrow seaway at the gorge from a finger of low land and shoals over the future Ruahine |
| **~2.4 Ma** | **The strait at its widest.** A shallow sea ran right across the southern Ruahine and northern Tararua. It left shallow-marine limestone lying directly on wave-planed greywacke all along the now-uplifted Ruahine: **the ranges carry the old sea floor on their backs** |
| **~1.5 Ma** | Uplift of the Mount Bruce block in the Wairarapa closed the Ruataniwha Strait at its south end and raised a drainage divide. The Manawatū river system grew up north of it. Most of the Whanganui–Manawatū area was still shelf to marginal-marine |

Sediments in the lower Pohangina Valley show marine conditions across part of the main range from
about **3 Ma to 1.6 Ma**, with closure under way from ~1.63 Ma (Rees, Palmer & Palmer). **So a sea
basin really did lie where the ranges later formed, but it had closed by the time the Te Manawa run
opens.**

That seaway left marks on living things. A mitogenome study of the wattlebirds suggests Pliocene
seaways, the Manawatū Strait among them, helped split the North and South Island kōkako and tīeke.
Freshwater fish and crayfish genetics show the river systems either side of Cook Strait were linked
until roughly 1 Ma, and the two islands' freshwater faunas separated ~0.7–1 Ma (Craw et al. 2019).
Trewick & Bland date the formation of Cook Strait itself to ~500 ka (after Lewis et al. 1994);
until then a low, narrow land bridge joined Wellington to Marlborough.

**Why the seaways were short-lived.** Older reconstructions drew one long-lived seaway across the
central North Island for much of the last 20 million years. That idea leaned on large sideways
(strike-slip) fault movement, as in the South Island. Modern fault mapping puts total strike-slip in
the North Island's Plio-Pleistocene fault system at under ~20 km. So the seaways were a series of
brief, shallow straits across a low basement axis (Kuripapango, then the Manawatū Strait), each
closed by uplift, not one channel that slid shut (Trewick & Bland 2012).

### I.1b The wave: why the lower North Island is so young

The Manawatū sits on the seam where the plate boundary changes character: Pacific Plate subduction
under the North Island gives way southward to the great strike-slip faults of the South Island.
Along the western North Island margin, a **wave of subsidence, basin-building, uplift and basin
inversion has travelled south** through the last ~20 million years (Trewick & Bland 2012, citing
Stern, Kamp, Pulford & Stern, Proust and others). Its mechanism is still debated, but its
expression is plain:

| Part of the wave | Where | What it does |
|---|---|---|
| **Back** (uplift) | Whanganui and the King Country | Old sea floor rising into land, cut into flights of marine terraces |
| **Trough** (subsidence) | Marlborough Sounds | Mountains up to ~1,400 m of relief sinking; their river valleys drowned into the Sounds |
| **Front** | Kaikōura–Nelson today | Where the next round is starting |

**The Whanganui Basin is that wave in the frame's west.** It formed as its own depocentre at
~4.8 Ma, when a lithospheric "pull-down" dragged the crust down, and has since filled with up to
5 km of mostly marine rock. About a third of it has been uplifted into land, **much of that only in
the last million years**. By ~1 Ma the Whanganui area had stopped sinking and begun to rise, while
the deepest, still-subsiding part had stepped south to lie off Levin and Foxton. The paper
concludes that large parts of the southern North Island have emerged from the sea only in the
past 1.5 Ma.

So the Te Manawa run opens on a landscape caught mid-wave. The axis is beginning its rapid rise.
The western basin is turning from sinking to rising. The sea off the future Foxton coast is still
the deepest part of a sinking basin. **The land the visitor watches assemble is some of the
youngest land in New Zealand.**

### I.2 The race: ranges rising across a river

As the Pacific Plate dives under the Australian Plate, a wedge of greywacke basement has been
squeezed up between major faults to form the Ruahine and Tararua ranges. The Wellington (Mohaka)
Fault runs along the foot of the Ruahine, and it is one of the North Island's most active. The
axis had been a low emergent finger of basement for millions of years. But **the ranges in their
present form are young: rapid uplift began at about 1 Ma**, with some uplift under way by
~1.5 Ma, as the Wellington, Wairarapa and Ruahine faults took on large displacements (Trewick &
Bland 2012). Popular accounts that date the uplift to ~3 Ma mean this slow early phase. The uplift
has probably sped up since: the gorge's lower walls are vertical while its upper walls are
progressively gentler (Te Ara).

**The river turned west.** The proto-Manawatū flowed **east**, toward Hawke's Bay. Early
Quaternary uplift in southern Hawke's Bay and the northern Wairarapa turned it to drain westwards
through what would become the gorge. Then, from ~1 Ma, uplift on the western side of the
Wellington Fault near the gorge **ponded a lake**, which later drained toward the Tasman Sea. The
ranges never rose fast enough to defeat the river, which held its westward course and cut the
gorge (Trewick & Bland 2012, citing Shane 1991 and Lee & Begg 2002).

The river kept pace. It rises on the **eastern** (Hawke's Bay) slopes of the Ruahine, north-west
of Norsewood, and flows **west through the main divide** at Te Āpiti, the Manawatū Gorge. It runs
about 180 km and drains a 5,899 km² catchment. Te Āpiti is one of the few places in New Zealand
where a major river cuts straight through the main mountain divide. Measurements at Barney's Point
put present uplift and river erosion **both at about 1.5 mm a year**, and the mean Ruahine rate at
~1.3 mm a year. The gorge is about 300 m deep. At the present rate that depth is ~200,000 years of
cutting (simple arithmetic, assuming a constant rate). The river won because its large catchment
gave it the flow to keep cutting. Smaller rivers that could not keep pace were diverted into it.

**Two readings of how the gorge began.**

| Reading | Claim | Evidence |
|---|---|---|
| **Antecedence** (preferred; Te Ara) | The river was there first. The ranges rose on either side and it cut down as they rose | Gorge-wall profile; regional geology |
| **Post-capture antecedence** (Craw et al. 2019) | A tectonically driven river capture **~500 ka** set the river on its present line, and the "apparently antecedent" gorge formed after it | Genetic divergences in the riverine fish *Galaxias divergens*, which date North Island captures to 700–100 ka |

Both readings keep the headline: **once on its line, the river cut as fast as the rock rose.** They
differ on how it first got there. Present this as a live question, not a settled one.

**Rangitāne kōrero.** Rangitāne say the gorge was formed when the giant tōtara Ōkatia forced its
way through the Ruahine and Tararua ranges to the sea (Te Ara). The wording is for co-design with
Rangitāne o Manawatū (see the `okatia` goal below).

### I.3 The basin to the west: a world-class sea-level archive

West of the river, the **Whanganui Basin** holds a ~5 km thick pile of Pliocene–Pleistocene
shallow-marine sediments. They are laid down in cycles that track global sea level glacial by
glacial: ~41,000-year obliquity cycles in the early Pleistocene, then the long ~100,000-year
cycles after the Mid-Pleistocene Transition. The Castlecliff coast section is a Southern Hemisphere
reference for the middle Pleistocene, and one of the best places in the world to see sea level,
tectonics and sediment interacting.

At ~1 Ma, when the Te Manawa run opens, the Whanganui–Manawatū area is **low-lying land and
marginal-marine estuaries**, not open ocean. The basin's depocentre, its deepest and most
subsiding part, had stepped south and lay **off the coast of Levin and Foxton**. The Whanganui
area had stopped sinking and begun to rise, cutting flights of marine terraces (Trewick & Bland
2012). The Kaimatira Pumice Sand of the Pohangina is overthickened by the ~1 Ma Potaka
(Kidnappers) eruption, and the sea had been withdrawing from the Pohangina since ~1.6 Ma. Land
assembled out of this sea by uplift and offlap, the north first and the south last. To the east,
much of Hawke's Bay was already land. To the south, Cook Strait did not yet exist: until ~500 ka a
low land bridge joined Wellington to Marlborough.

### I.4 The breathing coast, the terraces and the folds

Each glacial cycle moved the coast. At glacial lowstands the sea fell 100–130 m. Trewick & Bland
approximate the Last Glacial Maximum shoreline by today's 120 m depth contour, which makes the North
Island probably joined to the South across the South Taranaki Bight. They flag two caveats: tidal
channels may have persisted through the "land bridge", and its extent is uncertain. They also
conclude that **the lowstands did not always expose this much land**. A substantial connection
through the Whanganui Basin is unlikely before ~1 Ma. Before the late Pleistocene, links between the
islands were tenuous or absent, because the same sea-level fall only bared that much land once
uplift had raised the basin floor to meet it. At interglacial highstands the sea rose higher than now
(~+6 m at MIS 5e, ~125 ka), lapping the foot of the ranges along what is now the Tokomaru Marine
Terrace. In the early Holocene it pushed up the lower valley as an **estuary reaching east to
Shannon and north to Opiki**.

The deep lowstand was also brief. The sea stood below about −100 m for roughly ten thousand years
around 29–19 ka, while peak MIS 3 (~50–37 ka) is put at about −40 m, and the Manawatū record has it
25–50 m down. A map of the LGM coast is true of one short moment, not of a whole glacial age.
`TEMANAWA_COAST_PLAN.md` has the evidence and how the sim shows it.

Inland, the cycle built the river terraces. Cold periods stripped the ranges and choked the river
with gravel, so it aggraded. Warm periods clothed the ranges in forest, starved the river of gravel,
and it cut down. **Four terraces** between the gorge and Palmerston North record that rhythm. The
higher terraces are mantled in loess blown off the bare riverbeds in the last glaciation, so the
cold phases literally made the soil.

The plain itself is buckling. **Five low anticlines** run parallel to the ranges and turn the
Manawatū, Ōroua and Rangitīkei south-west instead of straight to the sea. The Mt Stewart–Halcombe
anticline is rising at just over 1 cm a year. Esler argues another fold, the **Whirokino
anticline**, may have restricted the river's outfall and raised the water table until it drowned a
tōtara forest. Its rooted stumps still stand under 1.8 m of peat at Go-to-Hell Swamp.

**The river makes its own wetlands.** Uplift steepens the catchment and feeds sediment down the
gorge: shingle as far as Palmerston North, fine silt below. The river builds levées along its
banks, swamps pond behind them, peat accumulates, the ground subsides, and the river eventually
avulses to a new course. The Taonui basin is a basin formed inside the levées of the Manawatū and
the Ōroua. Before drainage, the region held 264,511 ha of wetland. Under 3% remains
(`TEMANAWA_ECOLOGY_WETLAND.md` §1, §5).

### I.5 The sand machine and the wind that never turns

The Manawatū dunefield is the **largest transgressive dunefield in New Zealand (~900 km²)**. Its
sand comes from the Rangitīkei, Whangaehu and Whanganui rivers, carried south by longshore drift
and blown inland. The glacial-age Koputaroa dune sand carries the same coastal, volcanic-derived
magnetic minerals as today's beach sand. So the **north-westerly blew in the last glaciation exactly
as it blows now** (Hawke & McConchie 2005). Koputaroa dunes formed at or before 40–50 ka and were
remobilised ~24–10 ka, across the Ōruanui ash. Sea level, forest and coastline all oscillate. The
wind is the one constant across the whole window (`TEMANAWA_ECOLOGY_COAST.md` §1–2).

### I.6 Four super-eruptions

| Event | yearsBP | What it did here |
|---|---|---|
| **Potaka / Kidnappers** (Mangakino) | ~1,000,000 | VEI-8; pumice into a basin that was still largely sea |
| **Kaukatea Pumice** (TVZ) | ~900,000 | A minor, poorly characterised pulse |
| **Rangitawa / Whakamaru** | ~349,000 | The largest: >1,500 km³ of ignimbrite and ~700 km³ of fallout; a marker bed across the southern North Island |
| **Kawakawa / Ōruanui** (Taupō) | ~25,500 | VEI-8, near the Last Glacial Maximum; its ash lies just above the Koputaroa sand |

### I.7 The macro-habitat states

| State | Land | Coast and river | Living cover |
|---|---|---|---|
| **~1 Ma** | Low basement hills along the axis, about to rise fast; Hawke's Bay mostly land | Low land and marginal-marine estuaries in the west, deepest sea in the south-west (off Levin–Foxton); the river newly turned west; a lake ponded at the gorge | Thin coastal cover; alpine habitat itself barely exists (§III.3) |
| **~0.5 Ma** | Ranges well risen; basin assembled | River continuous from source to sea; tributaries reaching it | The full mosaic, cycling |
| **Any interglacial** | *Less* land: the sea drowns the low west and backs up the valley | Estuary inland; lagoons; dunes greened and locked | >80% forest: podocarp–broadleaf |
| **Any glacial** | *More* land: the shelf is exposed, more of it in later glacials as uplift adds to the sea-level fall | The coast marches west across the inner shelf; only at the brief deepest lowstands does the South Taranaki Bight become land; gravel aggrading; dunes marching inland | Two-thirds open: grass, grey scrub, beech in shelter |
| **~25.5 ka** | Ranges at full height | LGM coast; Koputaroa dunes moving | Sparse glacial cover under Ōruanui ash |

### I.8 Young land, few endemics: geography decides where life can be

The southern North Island has **unusually few species found nowhere else**. Endemism is highest in
the South Island and the northern North Island, and low here (Rogers 1989). Trewick & Bland's
explanation is the simplest one the geology allows: **until the late Pleistocene there was very
little land here to live on, let alone to evolve on.** The southern North Island was sea, shoals and
short-lived islands for most of the last few million years. The late Pleistocene, which is the
second half of the Te Manawa run, is when it had the most land available for colonisation. So its
plants and animals mostly arrived by spreading south from the older North Island, and they kept a
North Island character.

The living record agrees:

- **Recent occupation.** Stick insects show shallow, recent population history across the region.
  Tree wētā, galaxiid fish and kōura freshwater crayfish show recent crossings of Cook Strait.
- **Young mountains, young alpine fauna.** The Ruahine and Tararua carry most of the North Island's
  alpine habitat, yet their alpine species (*Sigaus* grasshoppers, *Kikihia* cicadas) show shallow
  diversity, and North Island alpine endemism is low even beside the South Island's. Their tops are
  only about a million years old. Permanent alpine habitat in New Zealand dates from only ~0.95 Ma
  (Heenan & McGlone 2013, §III.3).
- **Old pockets of difference.** In the late Pliocene–early Pleistocene the Te Aute limestones of
  Hawke's Bay and the Wairarapa stood as an archipelago, a possible source of the few local endemics
  (the Hawke's Bay tree wētā). The Wellington area was part of Marlborough until Cook Strait opened
  ~500 ka, and some of its endemics, such as the ground wētā *Hemiandrus bilobatus*, are closer to
  Marlborough–Nelson species than to North Island ones.
- **Ash as a reset.** The Taupō Volcanic Zone has repeatedly cleared local biota. Trewick & Bland
  link the last Taupō eruption to the North Island's beech gap between Ruapehu and Taranaki, and to
  low freshwater-fish diversity around the lake.

**The honest caveat**, also theirs: the climatic and geological drivers coincide in time, so they
are hard to tell apart. More land appears just as the glacial cycles grow strongest. And vegetation
types persisted through cold periods more widely than once thought (Shepherd et al. 2007, §III).

**Why this matters for Te Manawa.** The installation is, in effect, a model of how habitat
availability follows geography. Land, and the habitat bands on it, appear as the basin emerges and
the ranges rise. The alpine plants (*Dracophyllum*, wharariki) cannot appear until the ranges have
tops, and every bird has to find room on whatever land exists at the moment. The low-endemism
question is a good thing to put to a visitor: *why are there so few species found only here?*
Because, until recently, there was hardly a "here".

### I.9 Why it is unusual, in five lines

- **Some of New Zealand's youngest land**, raised from a sinking basin within the last million years
  by a wave of uplift that is still travelling south.
- **A river older than the mountains it crosses**, flowing west through the main divide.
- **It sits at a plate-boundary seam**, so in one million years a sea became land, ranges rose, and
  the folds of the plain are still growing.
- **Next door is one of the world's best sea-level archives**, so the glacial rhythm is documented
  in the rocks around it.
- **The river manufactures its own habitats**: terraces in the cold, swamps and drowned forests in
  the warm, and the largest dunefield in the country at its mouth.

### In Te Manawa

| Natural history | Where the build carries it |
|---|---|
| The river was there first | `geo/manawatu.svg` authors the river **once** and builds elevation around it, so antecedence falls out of the art (`TEMANAWA_GEOGRAPHY.md`) |
| The axis was already land; the ranges rise | `TerrainGenerator.GEO_EPOCHS` uplift 1 Ma → 25 ka from a head start (`upliftStart` 0.15: low basement hills at 1 Ma), eased (`pow 1.5`) so the ranges climb across the whole window. The SW strait and the central patch are range-protected (`_rangeProtect`, `LOOK.seaRangeProtect`), as the south strait always was, so the sea laps the axis instead of drowning it (`TeManawa_terrain.js`) |
| The river cuts as fast as they rise | Incision runs **ahead** of uplift: it starts at 20% depth (`0.2 + 0.8·t^1.2`), so the gorge floor drops faster than the ridges climb. This is plan finding #7, *live* |
| Sea becomes land, south last | `submergence` (1 Ma → 0.5 Ma) lifts the sea plane via `LOOK.seaRise`. The south opens as sea and drains one way, east-first, by ~0.5 Ma (`southSink*`). The wide early main stem thins to a river (`straitClose*` 0.7 → 0.25 Ma) but is **pinched to river width in the range gap** (`_gorgeOpen`, `LOOK.straitGorge*`), so it reads as an estuary arm to the west, never a seaway across the axis. East of the gap the **Woodville lake** has its own clock (`lake*`: ponds from ~1 Ma, full by ~0.9 Ma, drained west through the gorge by ~0.6 Ma) and is confined near the gap (`LOOK.lakeLenU`), so the rest of the east is land, as Fig. 4D shows. The main narrows upstream (`LOOK.mainTaper`). **Tributaries are there from 1 Ma** as fans of thin hill streams that draw together into one channel as the ranges steepen (`tribConverge*` 1 → 0.3 Ma, `LOOK.tribFan*`), because the east-side flow is what cut the gorge (since 2026-10-19; see below) |
| The river turns west | `mainArm*`: the old east-flowing NE arm is already dry at the 1 Ma opening (1.25 → 1.0 Ma) and the flow runs seaward; the upper Manawatū is the eastern tributary |
| The glacial rhythm | `Climate.at(yearsBP)` (`TeManawa_climate.js`): LR04-anchored, damped ~41-kyr cycles before ~0.86 Ma, full ~100-kyr cycles after. MIS 11 is long and warm; MIS 12, 16 and 6 are severe |
| The breathing coast | A real sea-level curve (`Climate.SEA_ANCHORS`, Spratt & Lisiecki 2016 with the MIS 3 field evidence), kept apart from the cold index, plus the plain's uplift since, gives relative sea level. `glacialSeaShift` moves the western coast across a baked shelf profile by it, so the shore marches out and back, the LGM bares far more than MIS 3, and a later glacial bares more than an earlier one. The main river follows the sea out. At highstands `estuaryStrength` drowns the valley floor up the main stem |
| The constant NW wind and the dunefield | Dune tint, relict ridges, blow-outs and the `SANDFLUX` model, all on a fixed NW vector; the reach surges with the glacial index (Koputaroa mode) |
| Four eruptions | `DeepTime.ERUPTIONS` at their dates, three severity tiers via `ashCover` (`TEMANAWA_DEEPTIME_ECOLOGY_PLAN.md` §2) |
| Deep time as something you drive | The geology is **paused** until a second-screen boost, which runs a 500 → 5,000 yr/s time-lapse to the next glacial/interglacial (`Climate.nextRegimeBoundary`, `TEMANAWA_SECOND_SCREEN.md`) |
| Rangitāne kōrero | The `okatia` goal (`TeManawa_goals.js`) asks the visitor to boost tōtara, "the tree of Ōkatia". It is delivered only after ~400 ka, once the river has taken shape. Flagged in the code for confirmation with Rangitāne o Manawatū |

### Where the build takes licence

**Steps 1–5 of the re-dating are built (2026-10-18).** Before that, the first ~600,000 years
showed the **~2.4 Ma Manawatū Strait**: a sea across the axis with no ranges, though the strait was
gone by ~1.6 Ma. The source check: Trewick & Bland (2012) is a peer-reviewed synthesis with a GNS
co-author. Later independent work from the Pohangina confirms its 1 Ma picture: the strait closed
by ~1.6 Ma (Rees, Palmer & Palmer 2017), and an east–west river, ponding near Woodville, cut an
antecedent path west from ~1 Ma (Rees, Palmer & Palmer 2018). The only dissent is about timing
details: a possible earlier uplift pulse in the northern Ruahine at ~2.4 Ma (a 2017 fan-delta
study), and Craw et al.'s genetically dated ~500 ka capture. Both are kept as hedges.

| Year | Before | After |
|---|---|---|
| 1 Ma | uplift 0 · a 6× main stem straight across the axis · the SW strait **drowning the Tararua** (no range protection) · the south dry · the flow running inland | The axis stands as a low land finger from the Ruahine to the Tararua (uplift 0.15, range-protected); the main stem is river-width in the gap; the south is sea; the flow runs west. Land rises from 44% to 54% of the browser view |
| 750 ka | uplift 0.13 · a broad seaway still across the axis | A continuous axis; the river crosses the gap at river width |
| 500 ka | the south flooding to its peak | The south has drained; the remaining wide water is the estuary arm and the eastern lake |
| 300 ka | land assembled | Unchanged: the new terms have all run out by then |

What was built, with its knobs:

1. **The sea keeps off the ranges.** `_rangeProtect` applies `1 − LOOK.seaRangeProtect·rMask` to the
   SW strait and the central patch, in both the cached and on-the-fly geo paths.
2. **The ranges have a head start.** `GEO_EPOCHS.upliftStart` = 0.15, below incision's 0.2 start,
   so the gorge still leads (the harness checks this at every date in the window).
3. **The wide water is pinched at the gorge.** `_gorgeOpen` runs inside `_straitWide`, so the carve,
   classify and paint all agree. `LOOK.straitGorgeU` is 0.505 (measured: the main stem crosses
   between the ranges at u ≈ 0.48–0.53), `straitGorgeHalfW` 0.04, `straitGorgeFeather` 0.05. The
   eastern body is the Woodville lake. Since 2026-10-19 it has its own clock (`lake*`, below); the
   dates are inferred, not sourced.
4. **The river turns west at the opening.** `mainArmFrom` 1.02 Ma, `mainArmTo` 0.6 Ma (re-dated
   2026-10-19 to 1.25 → 1.0 Ma: the arm is already dry at the opening).
5. **The south drains one way.** `southSink`: From 1.1 Ma, Full = Hold 1.0 Ma, To 0.5 Ma.

Harness ("geography") checks: the head start; incision leading uplift at every date; a seaward
flow at 1 Ma; the one-way south; the gorge pinch; the protection helper; and an integration probe
in which the Tararua stands as land under the full 1 Ma flood (0.31 protected vs 0.06
unprotected). The gorge check is mutation-tested. The storm-effects windthrow test now seats its
tree inside the forest band; it had been inheriting whatever the terrain was at a fixed spot.

**Still to do:**

- ~~**Step 6, soften the opening flood.**~~ ✅ **Done 2026-10-18.** `LOOK.straitWidthMult` 6 → 3
  (the early water is now an estuary arm and a lake, not open sea across the map) and
  `patchSubFeatherE` 3.0 → 1.2 (the Woodville lake no longer spreads over most of the east). The
  south-west stays open sea, where the basin was deepest. Judged on before/after screenshots at
  1 Ma and 750 ka (same seed, 16:9, terrain only). At 1.2 the lake's east shore reads ragged with a
  few islets rather than a cliff; ~1.6 gives a gentler grade if it looks too broken on the wall.
  Lowering `seaRise` and `seaSWReach` barely changes the look; they are not the lever.
- **Step 7, copy.** "The sea retreats; the young ranges begin to rise; a lake behind them drains
  through the gorge; the river turns west." The strait itself is backstory: *the Ruahine carry
  2.4-million-year-old sea floor on their backs*.
- ~~**A fauna finding the change surfaced.**~~ ✅ **Resolved 2026-10-18.** The re-dated 1 Ma has
  more, and more connected, land. The fauna-stability sweep's quiet refound top-up rose from ~4–9 to
  10–22 per run, so about one run in six failed the bound of 20. The same overshoot happened at
  300 ka with the old code: the old 1 Ma had only passed because it was the most land-poor state in
  the run. The cause was not breeding. Grazers were **starving beside food**: herd separation held a
  bird off its chosen plant, and it never re-picked. The fix is a forage give-up
  (`Moa._forageStalled`, `LEVEL_MECHANICS.forageGiveUpFrames` 180). The harness now sweeps 1 Ma *and*
  300 ka and stages the standoff. Verified across four full runs: 9–11 adds at 1 Ma and 10–13 at
  300 ka. See MISTAKES.md.

**Not recommended now:** opening the run at ~2.4 Ma to *show* the strait. It is the only way to put
the real seaway on screen. It needs climate anchors back to 2.4 Ma (~35 more 41-kyr cycles), the
1.6–1 Ma Mangakino eruptions, a rescaled timeline, and new second-screen and goal windows.

**Also:**
- **Step 8: the east at 1 Ma and the tributary fans (2026-10-19).** Read against Trewick & Bland
  Fig. 4C/4D, the snapshots in `exports/terrain_boost_stops/` had the layout right and the order
  wrong. Hawke's Bay and the northern Wairarapa were largely land by 1 Ma (their uplift is what
  turned the river west), but the central patch drowned the Pahiatua–Woodville country and the
  strait factor widened the main stem right across the east. And the tributaries only appeared at
  0.5–0.2 Ma, although T&B's explanation for the gorge is the combined flow of the rivers draining
  the northern Tararua and southern Ruahine, so they must be there from the start. Built:
  - **The east is land at 1 Ma.** `LOOK.patchSubRX` 0.17 → 0 (the patch helper is kept, and the
    harness still checks range protection with it switched back on).
  - **The Woodville lake** is a widening of the main east of the gap only (`_lakeWindow`,
    `LOOK.lakeLenU` 0.14, `lakeWidthMult` 2.6) on its own clock (`GEO_EPOCHS.lake*`: 1.05 → 0.92 Ma
    filling, held to 0.8 Ma, drained by 0.6 Ma). T&B give the sequence (ponding from ~1 Ma on the
    Wellington Fault, then drained to the Tasman); the dates are ours.
  - **The NE arm is dry at the opening** (`mainArm*` 1.25 → 1.0 Ma).
  - **Tributary fans.** Each tributary is a trunk plus four hill streams set off to either side
    (`_makeThreads`), each a line offset from the trunk that draws in to it downstream
    (`_tribThreads`). At 1 Ma they are thin streams spread across the flanks; the spread closes
    over `tribConverge*` (1 → 0.3 Ma) as the ranges steepen, through a braided stage around
    600 ka, into the one defined channel the present has. The trunk grows from a thin thread to its
    full width as the fan closes. Licence: real drainage integrates by capture, one stream at a time;
    the build draws it as streams pulling together. The stream geometry is procedural (per seed),
    not mapped. The ~500 ka capture of Craw et al. now falls mid-convergence rather than at a
    tributary's first appearance.
  - **The river field was rebuilt to do this.** Each cell used to keep one river chosen by margin,
    with tributary emergence and an NE-arm hand-over patched on top. It is now two layers, the main
    stem and the tributary fan, unioned in the carve, classify and paint (`_buildGeoCache`).
  - Harness: the lake and fan clocks, the stream geometry, a trunk carving at 1 Ma, every tributary
    joined to the main at 1 Ma, 600, 300 ka and the window end, more than one stream across a fan
    at 1 Ma and one channel at the end.
- **Step 9: the early coast follows sea level (2026-10-19).** Assessed against T&B Fig. 4D and the
  c. 0.88 Ma map of Rees, Palmer & Palmer 2019 (Fig. 10), the 1.0–0.8 Ma coast did not move: the
  north-west plain was dry at every sea level. Both sources say the same thing: the plain then stood
  low enough for each glacial cycle to flood and bare it.
  - **What changed.**
    - Relative sea level is the eustatic curve plus a land offset that is the plain's uplift near the
      present (Pillans 1986's 0.3 m/ka at the coast) and saturates at 70 m further back. The basin kept
      building its surface up to sea level, so the early coastal plain always sat near the sea, and each
      glacial cycle swept the shore right across it.
    - Highstands flood by contour, so early interglacials reach the range foot and early glacials
      bare the plain.
    - The positional floods (`seaRise`, the SW strait) are retired. The south strait stays, as the
      still-sinking Levin–Foxton depocentre.
  - **Reading the map.** Rees et al. place the Waitapu Shell Conglomerate in the **transgression** of
    cycle 36, so their map matches the sim at ~860–850 ka, as the sea comes back in.
  - **What the run now shows.** The coast breathes every cycle from the start: interglacials return the
    sea to the plain's inland edge, through MIS 5e. The westward trend is in the glacials, each baring
    more than the last. An earlier version (uplift-since ramped to 120 m) kept even the early glacials
    over the whole plain, so the early coast barely moved and the run read as a coast expanding west.
  - **Licence.** One uniform offset where Pillans maps faster uplift near the ranges; the saturation
    (70 m) is calibrated to the landmarks, not measured.
  - Details in `TEMANAWA_COAST_PLAN.md` §5b; assessment in
    `exports/terrain_geology_timeline/README.md`.
- **Step 10: a river that wanders, ranges that are rugged, a gorge the ranges close around
  (2026-10-19).**
  - **Meanders.** The lower Manawatū's course migrates: bends grow and travel downstream, and the
    course at one interglacial is not the course at the next (Knight: abandoned meanders, and young
    terraces that "represent variations in the river route"). The tributaries' lower reaches do the
    same.
    - Straighter in glacials, when the river was a gravel braid plain.
    - Still in the gorge, and pinned at the confluences so the network stays joined (superseded by
      step 11: no pins).
    - Licence: smooth migration, not discrete avulsions or cut-off oxbow lakes.
- **Step 11: the whole catchment, rivers that move, and the Opiki cycle (2026-10-20).**
  - **The tributaries, redrawn.** The Ōroua the sim had drawn was not the one in the SVG: the converter
    dropped the editor's 180° rotation (`MISTAKES.md`), and the authored line ran in from the coastal
    plain. `geo/manawatu.svg` now carries twelve named tributaries in the real confluence order down
    the main (Wikipedia: Mangatewainui, Tīraumea, Mangatainoka, Mangahao, Pohangina, Ōroua, Tokomaru),
    plus the Tamaki and Mangatoro into the upper Manawatū, the Kiwitea into the Ōroua and the Mākākahi
    into the Mangatainoka. The Ōroua runs south-south-west across the plain past Feilding to join below
    Palmerston North; the Pohangina runs down the Ruahine's western foot to the gorge mouth; the
    Tararua-side rivers run north to the Woodville basin.
  - **Sources.** Every tributary rises off the map or in a range. Fan streams that would have started
    on the open plain start further up instead (Jackson et al. 1998: the region's consequent streams
    head on the crests of the rising folds; Hesp & Shepherd 1978: the small ones rise on the Tokomaru
    marine terrace).
  - **Rivers that move.** Bends now swing about twice as far, and every channel also takes a new course
    at each glacial termination (a long-wavelength shift, eased over 3 kyr). Hesp & Shepherd have the
    lower Manawatū's meanders cutting the Tokomaru terrace margin, i.e. sweeping the whole floodplain,
    and the Manawatū and Ōroua building coalescing gravel fans in each glacial. Channels stay still
    inside a range (incised) and swing inside a corridor that the ranges bound. No channel is pinned
    at a confluence any more: a tributary's mouth slides with its parent.
  - **The sea cuts a river.** Where the sea has drowned a tributary's course, its water ends at the
    shore: no stretch of river rises from a beach.
  - **The Opiki cycle.** The rising sea drowns the lower Manawatū valley and, now, the lower valleys of
    the tributaries that join it there (the Ōroua, the Tokomaru, the Pohangina): Hesp & Shepherd's
    "lower Manawatu and Oroua valleys became estuaries", sheltered behind the coastal barriers. Once the
    sea stands still the estuary fills from its margins and heads toward the mouth, which stays open
    (the Holocene estuary reached Opiki ~6.5 ka and is now the Foxton mouth). The fill is swamp first;
    swamp forest takes about half of it over the next few thousand years, the rest stays back-swamp
    (Makerua, Moutoa). When the sea falls the filled plain stays, until the next glacial. Wetland and
    forest plants follow it through the habitat homeostasis, and kahikatea recruit on the shifting
    channels.
  - **Licence.** The course shift is a smooth swing at each termination, not a discrete avulsion
    with an abandoned channel left behind; the fill is a clock, not a sediment budget; the coastal
    barriers (Himatangi anticline, Poroutawhao High) are not landforms.
  - **Te Āpiti.** The Ruahine and Tararua now slope in to meet the river, which cuts a narrow, steep,
    shingle-banked gorge that deepens with time, rather than crossing an open lowland gap.
  - **The ranges** carry a ridged fBm, so they read as dissected country rather than smooth swells.
- **The coast (rebuilt 2026-10-19, `TEMANAWA_COAST_PLAN.md` §5).** Licence still taken: one uniform
  uplift rate stands in for one that rises north and toward the ranges; the shelf slopes are published
  figures, not measured transects; MIS 16 and MIS 12 hold below −100 m for ~24 kyr, longer than the
  real ~10–15, because the anchors are sparse there; and at the deepest lowstands the coast leaves the
  wall to the west, so the visible sea becomes plain for a few seconds of time-lapse.
- **Not built:** the coast curving north to Whanganui; the anticlines as landforms; terrace
  aggradation and incision as a visible cycle; abandoned channels left as swamp after a course shift.

---

## II. The lost hunter

### II.1 The bird

**Eyles' harrier, kērangi** (*Circus teauteensis*), was the largest harrier known and the **apex
avian predator of the North Island**. Haast's eagle lived only in the South Island. The North
Island form was markedly larger than the South Island one, about the size and weight of the
smallest living golden eagle subspecies.

| | |
|---|---|
| **Mass** | ~2.5–3.5 kg, an estimate. NZ Birds Online gives 3.0–3.5 kg (up to four times a swamp harrier); Wikipedia gives an adult female 2.5–3 kg (over twice a swamp harrier) |
| **Build** | Compact wings; long, powerful legs; feet and talons ~50% larger than a swamp harrier's. So unlike a harrier that it was first taken for a giant *Accipiter* |
| **Senses** | Skull structure suggests highly directional, owl-like hearing: the harrier's facial-disc trait carried to an extreme, suited to finding prey in dense vegetation |
| **Range** | North Island **from the Wairarapa to the Coromandel**, which takes in the Manawatū; South Island from Canterbury north. Sea level to the subalpine zone |
| **Habitat** | Dry forest and shrubland |
| **Nesting** | Prey remains in rock shelters and cave entrances suggest it nested there where it could, unlike ground-nesting harriers. No nesting study exists |

The type material is local. In the 1800s Augustus Hamilton collected the bones Henry Forbes named
in 1892, and they are thought to come from the **Te Aute** district of Hawke's Bay, just over the
ranges from the gorge.

### II.2 Where it came from: an Australian colonist that grew

Ancient mitogenomes (Knapp et al. 2019) overturned the obvious guess. Eyles' harrier is **not**
closest to the swamp harrier, New Zealand's living open-country harrier. Its sister species is the
**spotted harrier** (*Circus assimilis*) of Australia, and the two split **~2.4 Ma**. Haast's eagle
shows the same pattern: its closest relatives are small Australian eagles. Both giants look like
late-Pliocene to early-Pleistocene **colonists from Australia that enlarged in place**, not relicts
of an older Zealandian lineage. Knapp et al. tie their arrival to New Zealand's shift from dense
forest to more open habitat as the Pleistocene climate changed. **The same glacial opening-up that
section III describes is what these small raptors arrived into.**

The ancestry fits the forest build better than the swamp harrier would. The spotted harrier is the
most arboreal harrier: unlike other harriers it nests mostly in trees, a habit Baker-Gabb (1984)
argued was derived secondarily from ground-nesting. A forest-adapted giant from that lineage is
plausible.

**The island pattern.** Hawaii had its own forest harrier, the extinct wood harrier (*Circus
dossenus*). It also evolved short, *Accipiter*-like wings for hunting birds in closed forest, but
it became **small**, presumably because its prey was small. So the convergent target on islands
looks like *Accipiter* proportions, with body size set by the prey on offer. New Zealand had large
prey, and its harrier grew. *(Long legs are reported for kērangi. In the sources checked here they
were not confirmed for the wood harrier.)*

### II.3 What it hunted, and who it lived among

It filled the niche that large *Accipiter* hawks fill on continents: a fast pursuit hunter of
flighted birds in forest. It sat between the New Zealand falcon (smaller, agile prey) and, in the
South Island only, Haast's eagle (large moa). In the North Island nothing sat above it.

| Animal | Relationship | Evidence |
|---|---|---|
| **Kererū** | **Favoured prey** | NZ Birds Online |
| **North Island kōkako, kākā, Finsch's duck** | Prey | Bones recovered at a North Island midden site (NZ Birds Online) |
| **Smaller moa** | Prey **up to ~40 kg**: chicks, juveniles, and small species such as Mantell's moa, with little bush moa (26–64 kg) on the boundary | NZ Birds Online (the 40 kg figure is for North Island birds) |
| **Adult giant moa** | **Not prey.** A female *Dinornis* ran to well over 100 kg | Size alone |
| **NZ falcon / kārearea** | The smaller raptor below it in the guild | Ecology |
| **Swamp harrier / kāhu** | **Competitive exclusion.** Every New Zealand swamp harrier fossil studied in detail is under ~1,000 years old; it appears as kērangi disappears | NZ Birds Online; Worthy & Holdaway 2002 |

**A three-link chain.** The harrier's favourite prey, the kererū, is the only bird able to swallow
and disperse the large fruit of tawa, miro and their kin. Moa could not do it, because their
gizzards destroyed every seed larger than ~3.3 mm. So **predator → pigeon → large-seeded forest**
is a real, sourced chain (§III.4).

### II.4 How it was lost

It became extinct soon after Polynesian arrival. The causes were burning of its dry forest and
shrubland, collapse of its prey (partly through kiore predation), hunting, and probably kiore and
kurī taking its chicks. **The irony is exact:** its ancestors were open-country birds. It became a
compact-winged forest hunter, and when people turned the land back into open grassland it was too
heavy and small-winged to soar over it. The swamp harrier took that country instead.

Its reliance on mid-sized forest birds may have made it hardier than Haast's eagle. That is one
reason some writers prefer it as the identity of the two very large raptors the explorer Charles
Douglas said he shot and ate in the Landsborough valley, probably in the 1870s. The identification
is speculative and there is no specimen.

### II.5 The name

Forbes named the Te Aute bones *Circus teauteensis* and *C. hamiltoni* in 1892, but with so little
description that both were long treated as **nomina nuda**. Ron Scarlett described *Circus eylesi*
in 1953 from Pyramid Valley (South Island), naming it for Jim Eyles, and that name was used for
decades. The OSNZ Checklist now uses ***C. teauteensis*** (adopted in the 2010 checklist per the
research notes supplied, and current; `TEMANAWA_SPECIES_KERANGI.md` dates it to 2022, so confirm the
year). The North Island material carries the senior name, so if the two island forms are ever split,
*teauteensis* stays with ours. **Kērangi** is the te reo name NZ Birds Online carries. Display
naming is for co-design.

### II.6 Gaps in what is known

- No dietary isotope study and no nesting-site study.
- North–South Island size difference and sexual dimorphism mentioned but poorly quantified.
- No good last-occurrence date.
- Worthy & Holdaway (2002) remains the main synthesis.
- **Not (yet) in the local bones.** The Te Ahu a Tūranga assemblage holds an adzebill, not a
  harrier (New findings, item 1). The case for a Manawatū harrier rests on its range (Wairarapa to
  Coromandel) and the nearby Te Aute type material, not on a bone from this ground.

### In Te Manawa

| Natural history | Where the build carries it |
|---|---|
| Identity | `EylesHarrier` (`TeManawa_eagle.js`), `EAGLE_SPECIES.eyles_harrier` / `young_eyles_harrier` (`TeManawa_species_data.js`), art in `sprites/EylesHarrier/`. The base type key stays `'eagle'` (mechanical, not visitor-facing). Notifications say *kērangi* |
| Goshawk flight, not a soaring circle | `patrol()` flies **bursts**: a fast committed dash (`dashSpeed`), then a slow glide (`coastSpeed`), sweeping back and forth low over the territory |
| A hunter of **flighted** birds | `Simulation.getHuntablePrey` returns grazers **and every flyer list**, so kererū, kōkako, huia and tūī are on the menu alongside moa, goose, duck and mōho |
| Pressure falls on the abundant | The hunt scan weights prey by headroom above the species floor, plus a pull toward any species over its target (`eagleSurplusBonus`). Nothing is hunted at or below its floor. The harrier crops booms and spares the scarce |
| Ambush and strike | Target lock (`eagleMaxChase`, `eagleLoseRange`), a pursuit turn (`eagleHuntTurn`) and a final **stoop** (`eagleStoopRange`, `eagleStoopSpeed`) |
| **The 40 kg prey ceiling** | `EylesHarrier.withinPreyCeiling` gates the hunt scan and the locked target: an adult is prey only if its own mass is under `maxPreyKg` (40, in `EAGLE_SPECIES`). Each bird keeps a size percentile of its sex's `adultMassKg` range (NZ Birds Online). So **no adult female giant moa (76–242 kg) and few males (34–85 kg)** are taken; stout-legged males (12–34 kg) are prey and females (49–109 kg) are not; every Mantell's moa (17–36 kg) is; little bush moa (26–64 kg) straddles the line; **chicks and juveniles always** are. Harness: "harrier prey ceiling", mutation-tested |
| Cover and crypsis matter | Prey `camouflage` hides it from being *spotted*: little bush moa 0.5, kiwi 0.6 (a near-nocturnal bird the diurnal harrier seldom takes). `inShelter` moa are skipped |
| Storms take it out of the air | `checkStorms` breaks off the hunt for 180 ticks (the moa reprieve). The brief notes this is better justified for a heavy, compact-winged forest hunter than for an eagle |
| Rock-shelter nests | Only in the emergent model: its founding egg is laid at a crag eyrie, the highest walkable spot nearby (`_findCragEyrie`). That model is off in the scaffold (next row), so on the wall the harrier has no nest |
| Sparse | Three founders (`initialEntityCounts.eagle`) under a hard cap of 12 (`eagleMaxPopulation`), plus any a tōtara boost recruits. The emergent breeding and starvation model exists but is off in the scaffold (`emergentEagles` unset), so numbers are set rather than earned |
| The three-link chain | The second-screen **tōtara** card carries the harrier. The harrier goal group sits second in the visitor sequence (moa → harrier → lowland → forest): `okatia`, and `seed-spreaders` ("when kererū and kōkako numbers grow, so does Eyles' harrier"). `owl-hearing` and `harrier-scrub` are drafted but off |
| Never a swamp harrier | No `kāhu` in the cast; the encyclopedia card names it only as today's partial replacement |

### Where the build takes licence

- ~~**The 40 kg ceiling is missing.**~~ ✅ **Enforced 2026-10-18.** See the "40 kg prey ceiling"
  row above and the harness section "harrier prey ceiling". The dead `preferredPreySize` /
  `largePenalty` fields are gone.
- **The patrol is still open-country.** The species description now reads "a fast, compact-winged
  hunter of birds in dry forest and shrubland" (2026-10-18), but the quartering patrol is still a
  harrier's open-country search. The evidence favours dashes from cover. A perch-and-dash rhythm
  at forest edges would be truer.
- **No cold response is authored.** The brief asks that the harrier hold or rise as the glacial
  opens the land. It has no `seasonalModifiers`; its numbers are fixed. Its prey mix does shift in
  the cold, because the open-country grazers it hunts thrive then.
- **No size dimorphism and no North–South Island contrast.** Fine: neither is well quantified.

---

## III. The shifting forest

### III.1 Two poles, one place

The Manawatū Esler reconstructed (c. 1840–1970) is an **interglacial** snapshot. The Last Glacial
Maximum (~29–19 ka) is the other pole. Across the window, the land swung between them about a dozen
times: damped ~41-kyr cycles before ~0.86 Ma, strong ~100-kyr cycles after.

| | **Interglacial** | **Glacial (LGM pollen)** |
|---|---|---|
| Forest | **>80%** of the land. Mātai–kahikatea–tōtara on the plains, kahikatea–pukatea in the swamps, tawa throughout | Forest-tree pollen **~15%** on average; grass **~41%**; southern North Island conifer shrubs **~26%** |
| Structure | Emergent podocarps over 30 m (rimu, mātai) above a **9–15 m** tawa–māhoe canopy | A **forest–shrub–grass mosaic**, about two-thirds open |
| The trees | Podocarps (~44% of pre-human Holocene pollen) and broadleaves | **Beech**: ~88% of LGM forest pollen is *Nothofagus*, with *Libocedrus*. Podocarps ~2.8% |
| Zonation | Lowland → montane → subalpine | **None.** Sites from sea level to 800 m record much the same vegetation. Treeline **~800 m lower** |
| Era signal | Tree-fern spores ~7% | Tree ferns **0.7%** |
| Nearest modern analogue | Today's lowland bush, with its emergents restored | Subantarctic **Campbell Island**: two-thirds herbaceous, *Dracophyllum* the main woody plant |

**Why the glacial land was open.** Not mean temperature alone, and not low CO₂: forest held in the
far north through the LGM, and forest pollen rose around 18 ka, before CO₂ did. Forest was kept out
by **frequent, brief, severe frosts**, **persistent wind** and **heavy ground disturbance**,
affecting sites differently by topography. The trees did not all retreat north and march back. They
survived in **micro-refugia**, small sheltered patches, which is why forest returned so fast after
each glacial (McGlone, Newnham & Moar 2010).

### III.2 How a cycle unfolds

1. **Warm peak.** Podocarp forest climbs toward the subalpine. Tree ferns and nīkau crowd the
   gaps. The sea stands high, drowning the low west and backing up the valley, and dunes green and
   lock. Kererū are abundant and carry tawa and miro outward.
2. **Cooling.** The treeline drops and the warm-tender plants (tree ferns, nīkau) thin first. The
   shelf starts to emerge. Gravel begins to choke the river again.
3. **Glacial.** Forest breaks into refugia in sheltered gullies. Grey scrub (mingimingi,
   pōhuehue, *Myrsine*), short tussock and conifer shrubs take the flats. Beech holds the poorer,
   sheltered pockets. Open-country grazers (the North Island goose, Finsch's duck, Mantell's moa)
   are at their most abundant. Cold is a **different, busier world, not an empty one**.
4. **Full glacial.** The coast lies ~30 km west, the dunes march inland on the constant NW wind,
   frost pools in the basins, and the forest-floor birds (little bush moa, kiwi) are pinched into
   the refugia.
5. **Termination.** Forest re-expands quickly from the refugia. Rising sea and water tables
   **drown lowland forest**, as at Waverley, where mid-Holocene tōtara stumps stand in place (sea
   level reached today's height ~6,500 years ago), and at Go-to-Hell Swamp.

The animals followed the same rule as the plants. Ancient DNA shows several moa species held the
**same ground for hundreds of thousands of years**, and that glacial cycles split populations into
refugia. **Contract to shelter in the cold, re-expand in the warm** applies to both kingdoms
(`TEMANAWA_ECOLOGY_FAUNA.md` §4).

### III.3 What existed then that doesn't today

**Plants and landscapes**

- **A native wattle.** *Acacia*-type pollen occurs in North Island Middle Pleistocene sediments.
  Mildenhall (1972) suggested the plant may have died out in the last glaciation.
- **A shrubland with no modern analogue.** On the Rapanui Terrace at Whanganui, the
  last-interglacial podocarp–hardwood forest (~120 ka) gave way by ~110 ka to a **low Myrtaceae
  shrubland with *Libocedrus* and an extinct *Acacia*-type** (Bussell 1992). The past was not just
  today's vegetation moved about.
- **Extinct spores and pollen** in the Middle and Late Pleistocene sediments of the South Wanganui
  Basin itself (Bussell & Mildenhall 1990), among them a moss-type spore whose last record is
  ~90 ka (per a secondary database; check the paper before citing).
- **Lowland beech and conifer-shrub country.** The plains carried beech, *Libocedrus*, bog pine
  (*Halocarpus*) and mountain toatoa. Today these are mountain plants, and beech is almost absent
  from the Manawatū lowlands (Esler records one ~526 ha stand, at Aokautere). This is a local
  absence, not the North Island "beech gap" between Ruapehu and Taranaki, which Trewick & Bland
  tie to the last Taupō eruption (§I.8).
- **Alpine habitat was new.** Permanent alpine habitat in New Zealand dates from only ~0.95 Ma, and
  some North Island ranges are under ~200,000 years old, with an alpine flora borrowed from the
  south (Heenan & McGlone 2013). **The habitat on the tops was being made during the window.**

**Animals** (all of the Manawatū's large native animals were birds; the only land mammals were bats)

| Animal | Status | Local evidence | In the sim |
|---|---|---|---|
| NI giant moa *Dinornis novaezealandiae* | Extinct | — | ✅ |
| Little bush moa *Anomalopteryx didiformis* | Extinct | — | ✅ |
| Mantell's moa *Pachyornis geranoides* | Extinct | ***Pachyornis* at Te Ahu a Tūranga** | ✅ |
| Stout-legged moa *Euryapteryx curtus* | Extinct | ***Euryapteryx* (both sexes) at Te Ahu a Tūranga** | ✅ |
| North Island goose *Cnemiornis gracilis* | Extinct | **At Te Ahu a Tūranga** | ✅ |
| North Island adzebill *Aptornis otidiformis* | Extinct | **At Te Ahu a Tūranga** | ❌ cut (`TEMANAWA_ECOLOGY_FAUNA.md` §8) |
| Finsch's duck *Chenonetta finschi* | Extinct | — | ✅ |
| Mōho / NI takahē *Porphyrio mantelli* | Extinct | — | ✅ |
| Eyles' harrier | Extinct | Te Aute type material, over the range | ✅ |
| Huia | Extinct (last confirmed sighting in the Tararua, 1907) | Ruahine, Tararua and Rimutaka | ✅ |

**And what is here now that was not then:** marram, gorse, the swamp harrier, pūkeko, the
fire-made lowland grassland and most mānuka and bracken scrub (post ~1280 CE), harakeke-dominated
swamps (partly a drainage artefact), and every browsing mammal.

### III.4 The relationships that made the forest work

| Relationship | What happens | Why it matters |
|---|---|---|
| **Kererū ↔ large-fruited trees** | Kererū is the only bird that disperses the large fruit of tawa, miro, mātai, pūriri and karaka | Each post-glacial return of tawa rode on kererū. Today 79–88% of seeds land within 100 m of the parent |
| **Moa ↔ seeds** | Moa ate large seeds but **destroyed** every one larger than ~3.3 mm | The megaherbivore and the pigeon did opposite jobs on the same fruit |
| **Moa ↔ divaricating shrubs** | ~10% of the woody flora is divaricate | **Open debate**: defence against moa browse (Greenwood & Atkinson 1977, a botanist who worked alongside Esler), shield against glacial frost and wind (McGlone & Webb 1981), or light-harvesting. All three are about exactly what Te Manawa shows |
| **Moa browse ↔ the canopy** | Moa snipped from the ground to ~3 m; nothing browsed the canopy from above | Possums collapsed the Tararua rātā–kāmahi forest in three decades. Moa never could |
| **River ↔ kahikatea** | Kahikatea colonises raw wet alluvium that a shifting channel clears | If the river stops moving, the swamp forest ages out |
| **Disturbance ↔ podocarps** | Podocarps recruit in **pulses** after eruption, flood, windthrow or landslide (the "lozenge" model) | Between pulses: ageing giants over a self-replacing tawa canopy, the Keebles Bush structure |
| **Eruption ↔ wetland** | After Ōruanui: canopy part-defoliated under 10 years; wetland and aquatic plants expanded for ~60 years; tephra raised peat carbon accumulation about fourfold | Ash makes the swamps bloom; the forest clears but recovers |
| **Beech ↔ the cold** | The tree of the ice ages; holds poor soils and sheltered pockets; recolonises slowly | Explains why lowland beech is so rare here: tawa grows in every Manawatū forest type except beech |
| **Kōwhai ↔ the ice** | DNA shows *Sophora* survived the LGM widely, not only in warm refuges; Godley's kōwhai was named from a Pohangina Valley holotype | A bridge plant between the warm and cold screens |
| **Tree ferns ↔ climate** | ~7% of spores warm, 0.7% cold | The cheapest era signal there is |
| **Harrier ↔ kererū** | Favoured prey | Links the apex predator to forest regeneration (§II.3) |

### In Te Manawa

| Natural history | Where the build carries it |
|---|---|
| "Seasons" are the glacial cycle | `SeasonManager` reads `winterness` = the glacial index; the four terrain buffers are four glacial stages (`interglacial / cooling / glacial / fullGlacial`) |
| Forest retreats downhill and returns | `forestBandByStage`: 0.12–0.80 of the slope in the interglacial → 0.18–0.34 at full glacial (`levels/level_temanawa_scaffold.js`). Trees outside the band **topple and fade** (`forestDiebackFall`) but survive as rootstock and stand back up when it returns, so the cycle is reversible |
| Cold-tender vs cold-hardy | `coldTolerance` per plant (`TeManawa_plant_defs.js`) drives dormancy, the FOREST/TUSSOCK growth split and the boost gate (≤ 0.65 warm, ≥ 0.75 cold, neutral between) |
| Beech is the ice-age tree | `COLD_REFUGE` exempts beech from contraction; `coldTolerance` 0.8; its glacial-stage modifier *rises* into the cold (1.0 → 1.6, `TeManawa_seasons.js`). A scattered minority in the montane palette (the beech gap) |
| The glacial mosaic | Subalpine palette = tussock, grey scrub (`coprosma` umbrella incl. pōhuehue), *Dracophyllum*, mānuka, wharariki. *Dracophyllum* and wharariki appear only once the ranges rise |
| Browse prunes, habitat removes | `Plant.consume`: a bite shrinks a plant (`browseBite`) but never below `browseFloor`. Only unsuitable habitat removes trees. Herbivory and climate read as separate forces |
| Kererū grows the forest | `disperseSeed`: the one runtime mechanic that *adds* forest. Seeds drop away from the source. Storms ground the flock; storm **overuse** stalls recruitment and drains the scene's colour (habitat health `R`) |
| River ↔ kahikatea | `disturbanceRecruit`: kahikatea recruits only on fresh alluvium (storm flood, eruption sediment pulse, deep-time channel shift) and ages out without it (`kahiMaxAge`) |
| Eruption ↔ wetland | `applyAsh` spares the wetland (`wetlandAshSpare`) and `bloomWetland` seeds swamp growth. Verified: forest 93 → 26 plants while the wetland grew 98 → 104 |
| Aftermath at a visible pace | The `warp` clock (`disturb` / `warpAt`) speeds local regrowth on **real** time, so recovery plays as a ~2 s beat under fast-forward |
| Kiwi tends the floor | `kiwiSoilTurning`: probing stamps a gentle regrowth warp, closing the forest loop with the kererū |
| Cold is busier | Per-species `seasonalModifiers`: forest moa and kiwi get hungrier in the cold (little bush moa ×1.12, kiwi ×1.18 at full glacial), while the goose (×0.85), Mantell's and stout-legged moa (×0.9) and Finsch's duck (×0.92) thrive. TUSSOCK in a glacial gives open-country grazers a further lift |
| The wetland | A riparian `wetland` biome assigned by river proximity, planted on the Moutoa zonation (pūrei, harakeke, tī kōuka, kahikatea, grey scrub) |
| The two poles, for the visitor | The second screen's four era-framed habitats (interglacial wetland and forest above the switch's centre, glacial alpine and flats below), one bird per plant, each card fact-checked (`TEMANAWA_ENCYCLOPEDIA_FLORA.md`, `TEMANAWA_GOALS.md`). A matched boost greens the scene; a mismatched one desaturates it |

### Where the build takes licence

- **The glacial's biggest plant group is missing.** Conifer shrubs (bog pine, mountain toatoa, snow
  tōtara) were ~26% of southern North Island LGM pollen, more than all trees combined. No sprite
  exists. Next in line: **rimu** (the emergent that gives the interglacial forest its two layers),
  ***Libocedrus*** and **raupō** (`TEMANAWA_ENCYCLOPEDIA_FLORA.md` §5).
- **The painted treeline does not move.** The live cast follows the contracting forest band, but
  the baked ground colour still reads static elevation bands (`TEMANAWA_PLAN_V3.md` §3, deferred).
- **Frost is uniform.** The mechanism that opened the glacial land was patchy, topographic frost.
  The sim has a frost tint but no basin-pooling frost field (`TEMANAWA_ECOLOGY_OPEN.md` §4.3).
- **Only kahikatea recruits in pulses.** Tōtara and other podocarps recruit continuously through
  kererū and the FOREST button, not in disturbance cohorts (`TEMANAWA_ECOLOGY_LOWLAND.md` §4).
- **Zonation persists in the cold.** The LGM had none from sea level to 800 m; the sim keeps its
  elevation bands through a glacial and only moves the forest band.
- **Interglacials are all the same.** The ~110 ka no-analogue shrubland and the extinct *Acacia*
  have no place yet. A single "no modern analogue" card would carry the point that the past was not
  just today rearranged.

---

## Sources

**Checked this pass**

*Section I*
- [Te Ara — Manawatū and Horowhenua: features of the landscape](https://teara.govt.nz/en/manawatu-and-horowhenua-region/page-2) and [Manawatū River and Gorge](https://teara.govt.nz/en/manawatu-and-horowhenua-places/page-6): antecedence as the preferred reading, accelerating uplift, the eastern source, the Mt Stewart–Halcombe anticline, the Rangitāne account of Ōkatia (via search summary; the pages refused direct fetch)
- [Te Āpiti — Geology and formation](https://www.teapiti.co.nz/about-the-place/geology-and-formation): ~1.5 mm/yr uplift and erosion at Barney's Point; ~300 m gorge; the Wellington (Mohaka) Fault
- [Manawatū River — Wikipedia](https://en.wikipedia.org/wiki/Manawat%C5%AB_River): uplift from ~3 Ma; four terraces; five anticlines; source, length, catchment
- Rees, C., Palmer, J. & Palmer, A. Plio-Pleistocene geology of the Lower Pohangina Valley. *NZ J. Geology and Geophysics* ([doi:10.1080/00288306.2017.1408023](https://www.tandfonline.com/doi/full/10.1080/00288306.2017.1408023); [figshare](https://figshare.com/articles/Plio-Pleistocene_geology_of_the_Lower_Pohangina_Valley_New_Zealand/5696263)): marine conditions across the axial range ~3–1.6 Ma; closure from ~1.63 Ma; Ruahine ~1.3 mm/yr
- Rees, C., Palmer, A. & Palmer, J. 2018. [Quaternary sedimentology and tephrostratigraphy of the lower Pohangina Valley, New Zealand](https://www.tandfonline.com/doi/full/10.1080/00288306.2018.1547321). *NZ J. Geology and Geophysics* ([abstract](https://ref.coastalrestorationtrust.org.nz/documents/quaternary-sedimentology-and-tephrostratigraphy-of-the-lower-pohangina-valley-new-zealand/)): sea retreat from ~1.6 Ma; an east–west drainage c. 1 Ma, ponding near Woodville, an antecedent path across the rising axis. The independent confirmation of Trewick & Bland's 1 Ma picture
- [Gilbert-style Pleistocene fan delta reveals tectonic development of North Island axial ranges](https://www.tandfonline.com/doi/full/10.1080/00288306.2017.1406377). *NZ J. Geology and Geophysics* 2017: a possible early uplift phase in the northern Ruahine at ~2.4 Ma
- Milner 2017. [*The Pliocene-Pleistocene development, uplift and emergence history of the Manawatu Strait*](https://ref.coastalrestorationtrust.org.nz/documents/the-pliocene-pleistocene-development-uplift-and-emergence-history-of-the-manawatu-strait-new-zealand/). MSc thesis, Victoria University of Wellington
- Craw, D., King, T. M., McCulloch, G. A., Upton, P. & Waters, J. M. 2019. [Biological evidence constraining river drainage evolution across a subduction-transcurrent plate boundary transition, New Zealand](https://ourarchive.otago.ac.nz/esploro/outputs/journalArticle/Biological-evidence-constraining-river-drainage-evolution/9926515007101891). *Geomorphology* 336: 119–132
- [Mitogenomes resolve the phylogeography and divergence times of the Callaeidae](https://ourarchive.otago.ac.nz/esploro/outputs/journalArticle/Mitogenomes-resolve-the-phylogeography-and-divergence/9926514719601891): Pliocene seaways and the kōkako/tīeke split
- Trewick, S. A. & Bland, K. J. 2012. [Fire and slice: palaeogeography for biogeography at New Zealand's North Island/South Island juncture](https://www.massey.ac.nz/~strewick/PDFs/Trewick%20&%20Bland%20(print)2012.pdf). *J. Royal Society of NZ* 42(3): 153–183 ([doi:10.1080/03036758.2010.549493](https://doi.org/10.1080/03036758.2010.549493)). Palaeogeographic maps at 4, 3, 2.4 and 1 Ma: the strait at its widest ~2.4 Ma with limestone on the Ruahine greywacke; the Mount Bruce divide ~1.5 Ma; ranges in present form since ~1 Ma; the river's reversal to the west; the fault-ponded lake at the gorge; the depocentre off Levin–Foxton at 1 Ma; Cook Strait ~500 ka (read in full this pass)
  Also, from the full text (supplied 2026-10-19): the southward-migrating wave of uplift and subsidence (Whanganui = back, Marlborough Sounds = trough, Kaikōura–Nelson = front); the Whanganui Basin pull-down at ~4.8 Ma, its up to 5 km of fill and its emergence mostly within the last 1 Ma; strike-slip in the North Island under ~20 km; Cook Strait ~500 ka; the LGM shoreline approximated by the 120 m contour with tidal channels possibly persisting, and little connection through the Whanganui Basin before ~1 Ma; and the low-endemism argument (young land, colonisation from the north, young alpine fauna, Te Aute archipelago, Wellington–Marlborough affinities), citing Rogers 1989, Buckley et al. 2009, Morgan-Richards et al. 2010, Wallis & Trewick 2009, Trewick & Morris 2008, Marshall et al. 2009, Pratt et al. 2008 and Shepherd et al. 2007.
- Whanganui Basin cyclothems: [Abbott, Naish, Carter & Pillans — Nukumaruan stratotype](https://researchonline.jcu.edu.au/6710/); [Castlecliffian type section](https://ref.coastalrestorationtrust.org.nz/site/assets/files/5399/stratigraphy_of_the_castlecliffian_type_section_10_mid_pleistocene_sequences_from_the_wanganui_coast_new_zealand.pdf)

*Section II*
- [NZ Birds Online — Eyles' harrier](https://www.nzbirdsonline.org.nz/species/eyles-harrier): mass, build, hearing, range, habitat, nesting, prey incl. the 40 kg limit, NI/SI size, extinction, the swamp harrier
- [Eyles's harrier — Wikipedia](https://en.wikipedia.org/wiki/Eyles%27s_harrier): female mass, the ~2.4 Ma split (citing Knapp et al.), nomina nuda, competitive exclusion
- Knapp, M. et al. 2019. Mitogenomic evidence of close relationships between New Zealand's extinct giant raptors and small-sized Australian sister-taxa. *Molecular Phylogenetics and Evolution* 134: 122–128. [doi:10.1016/j.ympev.2019.01.026](https://doi.org/10.1016/j.ympev.2019.01.026) ([record](https://research.bangor.ac.uk/en/publications/mitogenomic-evidence-of-close-relationships-between-new-zealands-/))
- [Peregrine Fund — Spotted harrier](https://peregrinefund.org/index.php/explore-raptors-species/hawks/spotted-harrier) and [Baker-Gabb 1984, *Corella* 8](https://absa.asn.au/wp-content/uploads/2015/02/C8367.pdf): tree-nesting, probably derived
- [Wood harrier — Wikipedia](https://en.wikipedia.org/wiki/Wood_harrier) and [Recently Extinct Species — *Circus dossenus*](https://recentlyextinctspecies.com/accipitriformes-caracaras-falcons-kestrels-etc/circus-dossenus)
- Charles Douglas's Landsborough raptors: secondary accounts only ([NZ Geographic — Terror of the forest](https://www.nzgeo.com/stories/terror-of-the-forest); [Popular Science](https://www.popsci.com/science/article/2012-12/these-massive-extinct-eagles-could-have-carried-toddlers-dad/))
- Names: [Wikispecies — *Circus eylesi*](https://species.wikimedia.org/wiki/Circus_eylesi); [NZOR — *C. teauteensis*](https://nzor.org.nz/names/1c3034a6-dea5-4ffa-a88f-72b5e0e91419) (cites Gill et al. 2010)
- [Recently Extinct Species — *Circus teauteensis*](https://recentlyextinctspecies.com/accipitriformes-caracaras-falcons-kestrels-etc/circus-teauteensis); [Wingspan — Eyles' harrier](https://www.wingspan.co.nz/page/extinct-birds-of-prey-new-zealand-eyles-harrier) (from the supplied notes)

*Section III and the local bones*
- Holdaway, R. N. 2022. [The Manawatu-Tararua Highway fossil avifauna: a unique window into the late Pleistocene of North Island](https://www.birdsnz.org.nz/?p=21593). Birds New Zealand conference abstract: *Euryapteryx*, *Pachyornis*, NI adzebill, NI goose, a moa hatchling
- [RNZ — Unearthed moa bones at least 180,000 years old](https://www.rnz.co.nz/news/national/464677/unearthed-moa-bones-at-least-180-000-years-old): ≥180 ka, possibly ~345 ka; returned to the Ruahine maunga; replicas at Te Papa and Te Manawa
- [NZTA — Moa bones at Te Ahu a Turanga undergo scientific analysis](https://nzta.govt.nz/media-releases/moa-bones-at-te-ahu-a-turanga-manawatu-tararua-highway-site-undergo-scientific-analysis)
- Mildenhall, D. C. 1972. [Fossil pollen of *Acacia* type from New Zealand](https://www.tandfonline.com/doi/abs/10.1080/0028825X.1972.10428619). *NZ J. Botany* 10(3) (abstract via search)
- Bussell, M. R. & Mildenhall, D. C. 1990. Extinct palynomorphs from Middle and Late Pleistocene terrestrial sediments, South Wanganui Basin. *NZ J. Geology and Geophysics* 33(3): 439–447 (bibliographic record only; [Palynodata](https://paleobotany.ru/palynodata/publication/970))

**Carried over from the repo's deep dives** (checked in earlier passes; links there)

- McGlone, Newnham & Moar 2010, the LGM vegetation cover ([PDF](https://press-files.anu.edu.au/downloads/press/p18701/pdf/ch0417.pdf)): pollen percentages, no zonation, ~800 m treeline drop, Campbell Island, frost and wind
- Bussell 1988 (Waverley drowned forest; unrecorded tawa pollen) and 1992 (Rapanui no-analogue shrubland): `TEMANAWA_ENCYCLOPEDIA_FLORA.md` §6
- Heenan & McGlone 2013 (alpine habitat ~0.95 Ma); Shepherd et al. 2017 (kōwhai through the LGM); Piva et al. 2023 (Ōruanui recovery)
- Hawke & McConchie 2005, Shepherd & Price 1990, Duller 1996 (Koputaroa dunes, the constant NW wind): `TEMANAWA_ECOLOGY_COAST.md`
- Carpenter et al. 2018 (moa gizzards and the 3.3 mm seed limit); Wood et al. 2021 (little bush moa diet); moa aDNA population structure: `TEMANAWA_ECOLOGY_FAUNA.md`
- Greenwood & Atkinson 1977; McGlone & Webb 1981; Ogden & Stewart's lozenge model; kererū dispersal distances: `TEMANAWA_ECOLOGY_LOWLAND.md`
- Eruption dates and volumes: `TEMANAWA_DEEPTIME_ECOLOGY_PLAN.md` §2
- Esler, A. E. 1978. *Botany of the Manawatu District, New Zealand.* DSIR Information Series 127 (`research/*.pdf`)
- Worthy, T. H. & Holdaway, R. N. 2002. *The Lost World of the Moa.* Canterbury University Press

**Companion documents:** `TEMANAWA_PLAN_V3.md` (the spine) · `TEMANAWA_GEOGRAPHY.md` (the land
morph) · `TEMANAWA_SPECIES_KERANGI.md` (the harrier in depth) · `TEMANAWA_ENCYCLOPEDIA_FLORA.md`
(the plant roster) · `TEMANAWA_ECOLOGY_*.md` (the regional deep dives).
