# Te Manawa — plant goals: the book, the facts, the gaps

The line above the diorama's timeline asks a question a plant answers. The visitor boosts a plant on
the touchscreen, and the line becomes a verdict until the time-lapse ends. This doc is the goal book
as wired (`TeManawa_goals.js`), the fact-check of the encyclopedia entries the goals come from, and
the places where the sim doesn't yet show what a goal or entry says.

How a single boost is judged, and the verdict colours and outlines, are in
`TEMANAWA_SECOND_SCREEN.md` §6.5. This doc is about **which** goals exist and **when** they appear.

---

## 1. How a goal is chosen

At any moment some goals are **live**. A goal is live when all of these hold:

1. **The climate fits.** At least one of its answers can be boosted successfully right now: a warm
   plant in an interglacial, a cold plant in a glacial, a both-worlds plant in either. A goal that
   can't be met never shows.
2. **The plant has somewhere to grow.** The answer's habitat exists on the land now. A *Dracophyllum*
   goal stays hidden until the ranges have risen and have subalpine tops.
3. **Its own conditions are met** (only some goals have these):
   - a date window, e.g. Ōkatia only once the river has taken shape (from 400 ka);
   - enough grown plants, e.g. at least 10 tōtara standing;
   - birds present, e.g. kererū and kōkako both alive;
   - an eruption has happened this session (the scrub-after-a-volcano goal).

Among the live goals, **one is drawn at random**, so two visitors at the same point in the timeline
can get different goals. The draw follows the **bird sequence**:

> **moa → harrier → lowland animals → forest birds**, then round again.

Three out of four times the draw takes a goal from the current stage; the rest of the time it takes
any live goal, for variety (`TM_GOALS.sequenceBias`, 0.75). Solving a goal moves the sequence on one
stage. The last three goals shown are skipped while there is any other choice. A goal stays up across
a climate swing for as long as it is still live. A miss leaves it up. A new visitor (soft reset)
starts the sequence again at moa.

Each goal's **group** is the bird its main answer feeds (the plant's paired bird,
`TEMANAWA_ENCYCLOPEDIA_FLORA.md` §2.6): kahikatea, harakeke and mānuka feed moa; tōtara the harrier;
pūrei, tussock and tī kōuka the lowland birds; tawa, tree ferns, nīkau and kōwhai the forest birds.

---

## 2. The goal book

✅ = live (**52**, up from 17 on 2026-10-19). ⏸ = draft (`off: true`, 5), wired and checked but not
delivered until you switch it on; the drafts are listed in §4. The tables below are the original
seventeen; **§2.1 lists the 35 added from the encyclopedia cards.**

### Moa
| Goal | Answers | When | Success line |
|---|---|---|---|
| ✅ Boost a plant that was rarer in ancient times than today | harakeke | either climate | *Harakeke was an interglacial plant, and was rarer in ancient times than today!* |
| ✅ Boost a plant that is much rarer today than in ancient times! | kahikatea | interglacial | *…and was much more common in ancient times than today!* |
| ✅ Boost the tallest plant! | kahikatea | interglacial | *…and was New Zealand's tallest tree!* |
| ✅ Boost a scrub that grows back after a volcano! | grey/subalpine scrub | glacial, **after an eruption this session** | *Grey Scrub was a glacial plant, and was a scrub that grows back after a volcano!* |

### Harrier
| Goal | Answers | When | Success line |
|---|---|---|---|
| ✅ Boost the tree of Ōkatia, the atua who formed Te Āpiti! | tōtara | interglacial, **from 400 ka**, **≥10 grown tōtara** | *Tōtara was an interglacial plant, and was Ōkatia's tree form!* |
| ✅ Boost a tree that has seeds kererū and kōkako spread! | tōtara, nīkau | interglacial, **kererū and kōkako alive** | *Tōtara's seeds were spread by kererū and kōkako! When their numbers grow, so does Eyles' harrier...* |

### Lowland animals
| Goal | Answers | When | Success line |
|---|---|---|---|
| ✅ Boost a plant that is suited to cold and warm habitats! | kōwhai, tī kōuka, harakeke, mānuka, pūrei, wharariki | either | *Mānuka was suited to both glacial and interglacial habitats!* |

### Forest birds
| Goal | Answers | When | Success line |
|---|---|---|---|
| ✅ Boost the plant with the largest seeds! | tawa | interglacial | *…and was the plant with the largest seeds!* |
| ✅ Boost a plant that can out-compete nīkau! | tawa | interglacial, **≥3 grown nīkau and ≥3 grown tawa** | *…and was able to out-compete nīkau!* |
| ✅ Boost a plant that shelters kiwi! | tree ferns | interglacial, **kiwi alive** | *The tree fern was an interglacial plant, and was a shelter for kiwi!* |
| ✅ Boost a plant that comes in several similar species! | tree ferns, beech, *Dracophyllum*, kōwhai, scrub, tussock | either | *…and was a plant with several similar species!* |
| ✅ Boost a plant that dies back when it gets colder! | tree ferns, nīkau, tawa | interglacial | *…and was a plant that dies back when it gets colder!* |
| ✅ Boost a plant with red berries! | nīkau, tōtara, kahikatea | interglacial | *…and was a plant with red berries!* |
| ✅ Boost a plant with yellow flowers! | kōwhai, wharariki | either | *…and was a plant with yellow flowers!* |
| ✅ Boost a flower that tūī pollinate! | kōwhai, harakeke, wharariki | either, **tūī alive** | *…and was a flower that tūī pollinate!* |
| ✅ Boost a tree that grows right up to the treeline! | mountain beech | glacial | *Mountain Beech grows right up to the treeline, and in the ice ages beech was the main forest tree!* (was "a tree that is rare in the Manawatū": true of the lowland black beech, not of mountain beech) |
| ✅ Boost a tree that has mast years! | mountain beech | glacial | *Mountain Beech has mast years, when every tree floods the forest with seed at once!* |

### 2.1 Added 2026-10-19: goals from the encyclopedia cards

**The rule: a goal goes live only when its fact is on its answer's card**, so a visitor who reads the
card can find the answer. Each goal's code comment quotes the card line it rests on. Twelve were
drafts already backed by a card and are now switched on (marked *draft →*); twenty-three are new.

| Goal | Group | Answers | When | Card it comes from |
|---|---|---|---|---|
| Boost a plant with flower stalks taller than a ceiling! | moa | harakeke | either | Harakeke: flower stalks to 5 m |
| Boost a tree whose roots were stepping stones in a flooded forest! | moa | kahikatea | interglacial | Kahikatea: Round Bush raised roots |
| Boost a tree that was cut down to make butter boxes! | moa | kahikatea | interglacial | Kahikatea: butter boxes |
| Boost a scrub so thick that trampers had to crawl under it! | moa | scrub | glacial | Subalpine scrub: southern Ruahine leatherwood |
| Boost a scrub that fed a moa whose females were far bigger than males! | moa | scrub | glacial | Both scrub cards: giant moa females |
| Boost a plant that has evolved apart from Australia's for 10 million years! | moa | mānuka | either | Mānuka |
| Boost a plant for the moa whose biggest kind lived around the Manawatū! | moa | mānuka | either | Mānuka: stout-legged moa |
| Boost a plant with more kinds here than anywhere else on Earth! | moa | *Dracophyllum* | glacial, once the ranges have tops | *Dracophyllum* |
| *draft →* Boost a tree that needs a flood to grow! | moa | kahikatea | interglacial | Kahikatea: seedlings need fresh, wet silt |
| *draft →* Boost a tangled shrub that may have grown that way to keep moa off! | moa | scrub | glacial | Grey scrub |
| *draft →* Boost a plant that holds the dry sand plains! | moa | mānuka | either | Mānuka |
| Boost a tree that can live for 1,000 years! | harrier | tōtara | interglacial | Tōtara |
| Boost a tree whose stumps still lie buried in the peat! | harrier | tōtara | interglacial | Tōtara |
| Boost a tree for the North Island's top predator! | harrier | tōtara | interglacial | Tōtara: Eyles' harrier |
| *draft →* Boost a plant that builds its own little island in the swamp! | lowland | pūrei | either | Pūrei: root pedestal |
| *draft →* Boost a plant that can regrow from its base! | lowland | tī kōuka, **tussock** (added) | either | Tī kōuka; both tussock cards |
| *draft →* Boost the grass that covered the ice-age plains! | lowland | tussock | glacial | Tussock (flats) |
| Boost a swamp plant that fed the North Island's takahē! | lowland | pūrei | either | Pūrei: mōho |
| Boost the grass of the high tops, which are only a million years old! | lowland | tussock | glacial | Snow tussock |
| *draft →* Boost a plant that spreads after volcanic ash falls! | lowland | pūrei | either, after an eruption | Pūrei |
| *draft →* Boost the grass that fed a goose that couldn't fly! | lowland | tussock | glacial | Tussock: North Island goose |
| *draft →* Boost a plant from the land of a duck that had almost stopped flying! | lowland | tī kōuka | either | Tī kōuka: Finsch's duck |
| *draft →* Boost a plant that rides out storms! | lowland | tussock, harakeke, mānuka, scrub, *Dracophyllum*, pūrei, wharariki | either | *Dracophyllum* card (the others are true in the sim's storm, but not yet on their cards) |
| Boost the world's southernmost palm! | forest | nīkau | interglacial | Nīkau |
| Boost Aotearoa's tallest tree fern! | forest | tree ferns | interglacial | Mamaku & ponga |
| Boost a plant whose fronds are silver underneath! | forest | tree ferns | interglacial | Mamaku & ponga (check the art shows it, §5.10) |
| Boost a tree whose pollen doesn't last in the ground! | forest | tawa | interglacial | Tawa |
| Boost a plant whose seeds floated here across the ocean! | forest | kōwhai | either | Kōwhai |
| Boost a small tree that lived through the ice ages! | forest | kōwhai | either | Kōwhai |
| Boost a tree that held on when the cold pushed forests downhill! | forest | mountain beech | glacial | Mountain beech |
| Boost a tree where huia hunted fat huhu grubs! | forest | mountain beech | glacial | Mountain beech: huia |
| Boost a plant whose seeds blow away on the wind! | forest | wharariki | either, once the ranges have tops | Wharariki |
| Boost a plant that crosses with harakeke where the two meet! | forest | wharariki | either, once the ranges have tops | Wharariki |
| *draft →* Boost a tree for the bird whose male and female had different beaks! | forest | mountain beech | glacial | Mountain beech: huia |
| *draft →* Boost a flower for the bird with two voice boxes! | forest | wharariki, kōwhai | either, tūī alive | Wharariki: tūī (answer widened to the card that says it) |

### Through the timeline

Live goals by climate, each sample settled on its own land and cast (2026-10-19, browser):

| Sample | Live goals (moa / harrier / lowland / forest) | Before 2026-10-19 |
|---|---|---|
| Interglacials (787 ka, 335 ka, 122 ka) | **37–38** (10 / 4–5 / 6 / 17) | 12–14 (3 / 1–2 / 1 / 7–8) |
| Glacials (880 ka, 270 ka, 30 ka) | **28–31** (8–9 / 0 / 9 / 11–13) | 7–8 (1–2 / 0 / 1 / 5) |

The lowland stage, the thin one, now has 6–9 goals. **The harrier still has no glacial goal**: its
only plant is tōtara, a warm tree. A glacial harrier goal needs harrier copy on a cold card first,
for example "Eyles' harrier hunted the forest edge and shrubland" on a scrub card.

- **Glacials** carry the two beech goals, both-worlds, similar species, yellow flowers, tūī flowers and
  harakeke rarer. The scrub-after-a-volcano goal joins from the first glacial after an eruption
  (Kaukatea, 900 ka). There are no live harrier goals in the cold, because tōtara is a warm plant.
- **The lowland stage is the thin one**: only both-worlds is live in either climate. The drafts give
  it 4–7 goals.
- **Ōkatia** first appears in the 342–314 ka interglacial: the river has taken shape and tōtara forest
  is standing.
- **"Out-compete nīkau"** drops out of interglacials where nīkau is scarce (e.g. 859–818 ka).

---

## 3. Your entries, fact-checked

Corrected text first, then what changed and why. Macrons are added throughout. Where I couldn't
confirm a claim I've said so rather than guessed.

**These are now on the touchscreen cards** (`secondscreen/encyclopedia.js`: `desc` for the plant,
`birdDesc` under "Boosting … helps:"). Small differences from the text below: "Esler" became "the
botanist Alan Esler"; and every live goal's fact is on its answer's card, so a few lines were added —
tawa "has the biggest seeds of any plant here", kōwhai's "eight kinds" and tūī "carry pollen from
flower to flower", harakeke's tūī pollination line, red berries on nīkau and kahikatea, beech "rare
in the Manawatū, one patch at Aokautere", and the scrub "grows back after a volcano" (both scrub
cards). Tī kōuka's Finsch's duck line differs per card (around the swamps / on the open plains).
Cards you didn't write (mānuka, the glacial plants) keep their earlier text. The harness holds all
card copy to its macrons.

**Bird sections added 2026-10-15** (not in §3 below): `birdDesc` for the six cards that had none —
black beech (huia), both tussock cards (North Island goose), both scrub cards (giant moa) and mānuka
(stout-legged moa) — plus one "Boosting … brings two …" line appended to tī kōuka (both), kahikatea,
pūrei and nīkau, whose bird copy didn't say what the boost does. Sources: NZ Birds Online species
accounts (goose, giant moa, stout-legged moa), huia accounts, and the measured boosts in
`TEMANAWA_ENCYCLOPEDIA_CARDS.md`.

### Tōtara
> Tōtara is a massive podocarp tree that can live for around 1,000 years! Tōtara forest grew right up
> to the edge of the wetlands. Where the water rose, the trees died, but their wood is so tough that
> the dead stumps didn't rot away. They still lie buried in the peat thousands of years later.
> In Rangitāne tradition, the Manawatū Gorge, Te Āpiti, was formed by Ōkatia, a spirit who took the
> form of a giant tōtara tree and forced his way through the ranges to reach the sea.

- **"over 1000 years" → "around 1,000 years".** About 1,000 years is well supported; claims of 1,800
  have no solid evidence.
- **The stumps**: made concrete. Esler's Go-to-Hell Swamp is a flax flat on peat over tōtara stumps,
  and at Waverley Beach a whole mid-Holocene tōtara forest survives as stumps.
- **Ōkatia**: the Te Āpiti site spells it *Ōkatia*; Rangitāne's education site writes *Okatia*. The
  sources call Ōkatia a **spirit** living in a tōtara in the Puketoi Range. Your goal says **atua**.
  ⚠ **Check the wording, the spelling and the use of the kōrero with Rangitāne o Manawatū** before
  this goes on the wall (the cards were planned for co-design with them).

### Eyles' harrier
> Eyles' harrier was a giant bird of prey, the biggest harrier that ever lived. The North Island had no
> Haast's eagle, so here the harrier was the top predator. It wasn't as huge as the pouakai (Haast's
> eagle), but it was big enough to hunt kererū, kōkako, kākā and ducks, and the biggest North Island
> harriers may even have caught some of the smaller moa! It is now extinct, and the kāhu (swamp
> harrier) fills part of its place today. Kererū were its favourite prey: when kererū and kōkako
> thrived on the forest's fruit, the harrier had more to eat too.

- **"the North Island's equivalent to the Haast's eagle"**: it lived on both islands. In the North it
  was the top predator; in the South it came second to Haast's eagle.
- **"could hunt all the other forest birds"**: replaced with what's known. Kererū were a favourite
  prey, and kōkako, kākā and Finsch's duck bones are in a North Island harrier midden. North Island
  birds were big enough to take some smaller moa species.
- **kahu → kāhu.**

### Tawa
> Tawa forms the thick middle layer of the podocarp forest, under tall trees like tōtara, rimu and
> kahikatea. Its canopy can be so dense that young nīkau underneath struggle for light. But how much
> tawa grew in the ancient Manawatū is a mystery: its pollen doesn't preserve, and scientists need
> pollen to reconstruct the forests of the past.

- **Finished the cut-off sentence** ("It can form a dense canopy, even"). Esler (p. 46) saw nīkau
  "starved of light under the closed tawa canopy" at the Gorge, which also backs your "out-compete
  nīkau" goal.

### Kererū
> Tawa needs kererū: today they're the only bird big enough to swallow and spread its seeds! Moa didn't
> spread tawa, because the stones they swallowed (gastroliths) ground up seeds in their gizzards. So
> kererū don't just sit around eating – they're working hard to plant the forest!

- **"the only bird" → "today the only bird"**, with moa gone. Kererū are the sole or main disperser
  of over 60 trees and shrubs; studies of moa gizzards and droppings found large seeds were destroyed.

### Mamaku & ponga
> Mamaku is Aotearoa's tallest tree fern, growing up to 20 metres tall! Ponga's fronds are green on
> top and brilliant silver underneath. Tree ferns need a warm climate: in the ice ages, the amount of
> tree-fern pollen fell by about 90%. Good thing they grow back fast – Esler saw thick stands of
> mamaku grow up in about 50 years.

- **"90% died back"**: right size, now tied to the evidence. Tree-fern pollen is ~7% of warm-period
  samples and 0.7% in the last ice age.
- **"only take 50 years to grow back"**: Esler records 50 years of regrowth producing dense mamaku
  stands (pp. 74–75). Kept, with the source.

### Kiwi
> Kiwi love ferns, because a ferny forest floor is damp and sheltered, full of bugs and rich soil –
> perfect for probing with their long beaks at night! In the sim, kiwi foraging helps the plants
> around them grow.

- **"kiwi's foraging boosts the growth of the plants around them"** is the sim's idea (soil-turning),
  not an established fact, so it now says "In the sim".

### Nīkau
> Nīkau is the world's southernmost palm! It can grow in Aotearoa because it's tougher in the cold than
> other palms, but it still can't survive hard frost, so it retreated in the ice ages. It grows in the
> Manawatū's lowland forest, and in ancient times at the edges of wetlands.

- ✓ All supported (it reaches the Chatham Islands at ~44°S; Esler records it in Himatangi Bush's
  semi-swamp forest).

### Kōkako
> Kōkako filled the forest with song in the warm interglacials, eating many kinds of forest fruit and
> leaves. Tūī are amazing mimics that can copy other birds' songs!

- ⚠ **"love nīkau's red berries"**: I couldn't confirm kōkako eat nīkau fruit; Te Ara names kererū as
  nīkau's main disperser. Kōkako do eat a lot of fruit (44% of their diet in one study), about 14% of
  it from podocarps. This also affects the "seeds kererū and kōkako spread" goal (§5).
- ⚠ **"Tūī and kōkako … mimic each other"**: I found nothing on this. Tūī are well-known mimics of
  other birds, so the line now says that.

### Kōwhai
> Its seeds float: kōwhai's ancestors reached Aotearoa across the ocean! Though it's a small tree,
> kōwhai lived through the ice ages – DNA shows it survived across much of the country, not just in
> a few warm hideaways.

- **"as many living kōwhai as there are in people's back yards now"**: no evidence for a count. Replaced
  with the DNA finding (Shepherd et al. 2017).

### Tūī
> Tūī love the nectar of kōwhai's yellow flowers, an important food for many native birds in early
> spring. Can you count how many colours are in a tūī's feathers?

- ✓ Light wording only.

### Kahikatea
> Kahikatea is New Zealand's tallest tree, growing up to 60 metres! Long stands of kahikatea lined the
> ancient wetlands along the Manawatū River. You might see kahikatea die and grow back as the river
> shifts: its seedlings need fresh, wet silt at the water's edge. At Round Bush near Foxton, people
> crossed the flooded forest by stepping along its raised roots. Kahikatea wood was used to make
> butter boxes, and since the wetlands were drained, almost all of it is gone.

- **"wove a network of roots above the ground"**: made concrete with Esler's Round Bush account.
  Everything else ✓, and "die and grow back as the river shifts" is exactly what the sim models.

### Little bush moa
> Bush moa lived in thick forest. Over many generations they evolved a strong beak for snipping twigs
> and leaves. They ate lots of fern fronds, and may have helped spread fern spores through the forest!

- **"learning to eat … developing a beak"** → **evolved**. Animals don't learn their way into a new
  species.
- **"fern seeds" → "fern spores"**: ferns spread by spores, not seeds. With spores the fact stands, as a
  hypothesis: bush moa droppings from Fiordland held ground-fern DNA, frond fragments and high spore
  counts, and the researchers suggest bush moa may have spread ground-fern spores (Wood et al. 2021).
  It rests on one deposit, so "may have". The same droppings held almost no seeds: bush moa ground
  large seeds up in their gizzards rather than spreading them.

### Harakeke
> Harakeke grows to about 3 metres tall, and its flower stalks can reach 5 metres – taller than a
> ceiling! Harakeke was actually less common in ancient times. It spread through the Manawatū after
> the swamps were drained and the rivers stopbanked, and it fed a huge flax-milling industry. The
> Moutoa swamp plant survey was carried out to help manage the flax crop.

- **Cause and effect**: the mills didn't make harakeke common. Draining and stopbanking let it spread
  onto ground that had been too wet for it, and the mills harvested it (Esler pp. 57–59).
- **"matua swamp" → Moutoa.**
- ⚠ "Rarer in ancient times than **today**": strictly, it was rarer than in the **flax-mill era**.
  Much of that flax swamp has since been drained for farmland.
- **Its bird**: in the sim harakeke feeds Mantell's moa (one bird per plant). Mention tūī as a
  pollinator in the text; the "flower that tūī pollinate" goal does the rest.

### Tī kōuka
> The cabbage tree can regrow from its base if it's damaged! Tī kōuka loves wet ground, but it's hardy
> enough to survive glacial climates.

- ✓ Supported (cabbage trees from colder places are genetically hardier).

### Finsch's duck
> Finsch's duck was a land duck about the size of a mallard, with thick legs for walking and small
> wings. It grazed grassland, scrub and open forest, and it was slowly losing the power to fly: by the
> end of its time it walked far more than it flew.

- ⚠ **It wasn't a wetland bird.** NZ Birds Online describes it as terrestrial, with "little association
  with wetlands or lakes". It fits the Lowland card; on the **Wetland** card the tī kōuka → duck link is
  weak. Consider a different wetland bird, or one description that says the duck grazed the dry ground
  around the swamps.
- Its wings shrank between ~10–12,000 years ago and the late Holocene, so in most of the sim's timeline
  it could still fly better than it later did.
- Its bones are in an Eyles' harrier midden, which links nicely to the harrier entry.

### Pūrei and takahē (empty in your notes)
Draft lines from the existing research, for you to edit:
> **Pūrei** builds its own pedestal: it stands in open water on a column made of its own old roots.
> After big eruptions, sedges spread for decades as ash-silt widened the lake edges.

> **Mōho** was the North Island's takahē, a big flightless rail that grazed grass and swamp plants.
> It is extinct; its South Island cousin, the takahē, survives.

### The post-volcano goal (now the scrub)
- **Moved from mānuka to the grey/subalpine scrub**, as you asked, worded *"Boost a scrub that grows back
  after a volcano!"*. The evidence supports "grows back", not "first": pōhuehue (part of the grey-scrub
  art) scrambles over disturbed open ground, and *Coprosma* comes in as an early-to-mid colonist of fresh
  volcanic ground (Rangitoto). The real first colonists after Taupō and Tarawera were **bracken, toetoe
  and tree tutu**, none of them on the cards. If tutu is ever added, it is the textbook answer.
- The scrub is a cold plant, so the goal is **glacial-only**. That lines up with the ash: the three
  eruptions after the run opens (Kaukatea 900 ka, Whakamaru 349 ka, Ōruanui 25.5 ka) all fall in
  glacials.
- **Mānuka** keeps the both-worlds goal, and four drafts in §4 use it (sand plains, no wings, storms,
  harrier scrub).

---

## 4. Suggested goals (⏸ drafts)

> **2026-10-19: twelve of the drafts below are now live** (§2.1), the ones whose fact is on the
> answer's card. **Five stay drafts** because no card says it yet: *no wings at all* (moa), *owl-like
> hearing* and *harrier scrub* (harrier), *blue wattles* (kōkako) and *nostrils at the beak tip*
> (kiwi). Add the line to the card's bird section, then delete `off: true`. The tables below are the
> original proposal, kept for the reasoning.

Seventeen goals, wired with `off: true` so the harness already checks their answers, macrons and
line lengths. Delete `off: true` to switch one on. They lean on **things the sim really does** (so the
visitor can see the answer happen) and on **each bird's oddest trait** (so the success line teaches
something about the bird, not just the plant). The success lines name the bird where the trait is the
point.

### Lowland animals (the thinnest stage)
| Goal | Answer | Climate | Uses | Basis |
|---|---|---|---|---|
| Boost a plant that builds its own little island in the swamp! | pūrei | either | trait of the plant | Pūrei stands on a pedestal of its own old roots |
| Boost a plant that can regrow from its base! | tī kōuka | either | your fact | Harakeke and tussock also resprout: possible extra answers |
| Boost the grass that covered the ice-age plains! | tussock | glacial | sim: the tussock flush feeds the open-country grazers | Grass was ~41% of last-glacial pollen |
| Boost a plant that spreads after volcanic ash falls! | pūrei | either, after an eruption | sim: an eruption spares and blooms the wetland | Sedges spread for ~60 years after the Ōruanui ash (Piva et al. 2023) |
| Boost the grass that fed a goose that couldn't fly! | tussock | glacial | the goose's trait | The North Island goose was flightless |
| Boost a plant from the land of a duck that had almost stopped flying! | tī kōuka | either | the duck's trait | Finsch's duck was flightless or nearly so (see §3: its wetland link is weak) |
| Boost a plant that rides out storms! | tussock, harakeke, mānuka, scrub, *Dracophyllum*, pūrei, wharariki | either | sim: storm-hardy plants survive the STORM button; tall trees are thrown | Low, wind-firm plants; matches the sim's `STORM_HARDY` list |

### Moa
| Goal | Answer | Climate | Uses | Basis |
|---|---|---|---|---|
| Boost a tree that needs a flood to grow! | kahikatea | interglacial | sim: kahikatea only recruits on fresh flood silt (storm, eruption, river shift) | Wetland doc §4.1 |
| Boost a plant that fed a bird with no wings at all! | kahikatea, harakeke, scrub, mānuka | either | the moa's trait | Moa are the only birds with no wings at all |
| Boost a tangled shrub that may have grown that way to keep moa off! | scrub | glacial | the giant moa's browsing | Divaricating (zig-zag) shrubs may have evolved against moa browsing; still debated, hence "may" |
| Boost a plant that holds the dry sand plains! | mānuka | either | sim: the coastal dune field | Esler: mānuka held the dry sand plains |

### Harrier (no live goal in glacials yet)
| Goal | Answer | Climate | Uses | Basis |
|---|---|---|---|---|
| Boost a tree for a hunter that could hear like an owl! | tōtara | interglacial | the harrier's trait | NZ Birds Online: owl-like directional hearing |
| Boost a scrub where Eyles' harrier hunted! | scrub, mānuka | either (glacial via scrub) | the harrier's habitat | Forest edge and shrubland hunter; gives the cold climate a harrier goal |

### Forest birds
| Goal | Answer | Climate | Uses | Basis |
|---|---|---|---|---|
| Boost a tree for the bird whose male and female had different beaks! | mountain beech | glacial | sim: huia forage in male–female pairs | Male huia: short, strong beak; female: long and curved |
| Boost a flower for the bird with two voice boxes! | kōwhai | either, tūī alive | sim: tūī feed at kōwhai flowers | Tūī sing with two voice boxes |
| Boost a plant for the bird with bright blue wattles! | nīkau | interglacial | the kōkako's trait | North Island kōkako have blue wattles |
| Boost a plant for the bird that smells with the tip of its beak! | tree ferns | interglacial | sim: kiwi turn the forest-floor soil | Kiwi nostrils are at the tip of the beak |

**Ideas that need a sim change first:**
- **"Boost a tree that only kererū can plant!"** (tawa): true, but the sim lets kōkako and tūī plant
  tawa too (§5.2). Fix the dispersal first.
- **Beech mast years as a mechanic**: every few glacial years, every beech drops a burst of seedlings
  at once. Then the mast goal would show what it says.
- **"Boost a plant the harrier's prey ate"** for glacials, once the prey links are firmer.

---

## 5. Sim gaps

Places where a goal or entry says something the sim doesn't show, or shows differently.

1. **The sim has too much harakeke in ancient times.** The harakeke goal says it was rarer then, but
   the wetland palette lists harakeke twice at 3.8× density, so the broad 1 Ma estuary is full of it
   (counted: 68 grown harakeke at 1 Ma). Raupō and toetoe, which you may add, should hold those
   swamps instead.
2. **Any bird can "plant" any warm plant.** When a kererū, kōkako or tūī drops a seed, the sim plants
   a random warm plant from that habitat. So kōkako and tūī can spread tawa (only kererū can), and
   birds can plant tree ferns, which grow from spores, not seeds.
3. **Fruit birds "feed" at tree ferns.** Kererū and kōkako treat any warm plant as a fruit tree,
   tree ferns included.
4. **The harrier chain is loose.** "When kererū and kōkako grow, so does the harrier" isn't modelled
   as a chain. A tōtara boost adds two harriers directly, but a nīkau boost (also a right answer to
   that goal) adds kōkako and no harriers. The kererū and kōkako populations are small (1 each in
   every era I sampled), so a visitor won't see them "grow" much.
5. **No light competition.** Tawa shading out nīkau is true (Esler) but the sim doesn't model shade,
   so a visitor won't see it happen.
6. **Tree ferns don't visibly crash in the cold.** The 90% drop isn't calibrated: at reset, 122 ka
   had 6 grown tree ferns and 30 ka had 5.
7. **No post-eruption succession.** After an eruption the sim speeds the regrowth of whatever was
   there; scrub isn't favoured on cleared ground, so the scrub-after-a-volcano goal is true but not
   shown.
8. **Drowned tōtara forests** (stumps under peat) aren't shown.
9. **Mast years aren't modelled.** The new mast goal is true of beech, but the sim never shows a mast.
10. **Check the art** for what the goals ask children to look for: red berries on tōtara, kahikatea and
   nīkau; yellow flowers on kōwhai and wharariki; silver under ponga fronds. If the sprites don't show
   them, a child can only answer from the card.

---

## 6. Words and ideas an 8–14-year-old may need help with

- **atua** (spirit or god), **Te Āpiti** (the Manawatū Gorge): give both in the card, not only the goal.
- **glacial / interglacial**: the new line under the year ("The climate is GLACIAL") helps. The cards
  should still say "glacial = ice age".
- **podocarp** (an ancient family of conifer trees), **canopy**, **pollinate** (carry pollen from flower
  to flower), **pioneer** (the first plant to grow back on bare ground), **gastroliths**, **disperse**.
- **"Out-compete"**: "shade out" or "crowd out" is more concrete.
- **"Several similar species"**: "lots of close relatives" may land better.
- **"Largest seeds", "red berries", "yellow flowers"**: can only be answered from the cards unless
  the art shows them (§5.10). Tōtara and kahikatea "berries" are really fleshy red stalks under the
  seed, which is fine to call berries at this age.
- **The verdict lines** mix tenses: "Tōtara was in interglacial habitats, but **is** not…". That's
  your wording (kept in `TM_GOALS.text`); "but wasn't" would read more smoothly.

---

## 7. Sources

- Te Āpiti — Manawatū Gorge, *History of Māori and Te Āpiti* (Ōkatia). https://www.teapiti.co.nz/about-the-place/culture-and-history/history-of-maori-and-te-apiti
- Rangitāne education, *Okatia created Te Apiti*. https://rangitaneeducation.com/owahanga-river/
- NZ Birds Online, *Eyles' harrier / kērangi*. https://nzbirdsonline.org.nz/species/eyles-harrier
- NZ Journal of Ecology (1987), kōkako foods at Puketi. https://newzealandecology.org/nzje/1712
- Te Ara, *Tall broadleaf trees* (nīkau's main disperser). https://teara.govt.nz/en/tall-broadleaf-trees/page-6
- Te Ara, *Forest succession and regeneration* (mānuka as pioneer). https://teara.govt.nz/mi/forest-succession-and-regeneration/print
- Wilmshurst & McGlone 1996, post-Taupō revegetation. https://journals.sagepub.com/doi/10.1177/095968369600600402
- Landcare Research, little bush moa diet. https://www.landcareresearch.co.nz/news/reconstructing-the-past-from-poop-now-we-know-what-the-little-bush-moa-ate
- NZ Journal of Ecology (2012), moa seed dispersal. https://newzealandecology.org/nzje/3024
- The Gymnosperm Database, *Podocarpus totara*. https://conifers.org/po/Podocarpus_totara.php
- Science Learning Hub, tūī mimicry. https://www.sciencelearn.org.nz/images/5373-tui-koko
- Sci.News on Wood et al. 2021, little bush moa coprolites (fern spores). https://www.sci.news/paleontology/little-bush-moa-diet-09732.html
- NZ Birds Online, *Finsch's duck*. https://www.nzbirdsonline.org.nz/species/finschs-duck
- Worthy & Olson 2002, *Notornis* 49 (Finsch's duck losing flight). https://birdsnz.org.nz/?p=10513
- Clarkson et al., *Surtsey Research* 2015 (Rangitoto lava colonists). https://surtsey.is/wp-content/uploads/2019/08/5-Surtsey-2015_13-Clarkson-45_48_HRes_05.pdf
- Te Ara, pōhutukawa as the first lava colonist on Rangitoto. https://teara.govt.nz/node/6766
- Esler, McGlone et al. 2010, Shepherd et al. 2017 and the rest: `TEMANAWA_ENCYCLOPEDIA_FLORA.md` §6.
