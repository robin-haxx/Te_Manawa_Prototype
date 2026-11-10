# Te Manawa — encyclopedia card trims (proposal)

**Not applied.** This is a proposal for `secondscreen/encyclopedia.js`. Bold marks the words a live plant goal rests on, as the cards show them.

The card body holds **454 px**, about **95 words** of the 24 px text, before it has to scroll. Today **15 of the 20 cards scroll**; with these trims **12** do. Across all cards: 2506 words → 2122.

Every goal term, live or `off`, survives word for word (checked by script), so nothing here breaks a goal or the harness. Screens are measured in Chrome at 1920×1080: 1.00 means it fits, 1.80 means 80% more than one view.

A card at 1.01 has no hidden text: only the last paragraph's 14 px margin overflows, and that is enough to show "Scroll for more" (Harakeke does this today). `#cardBody p:last-child { margin-bottom: 0; }` in `secondscreen.css` would clear those.

| Card | Words now → trimmed | Screens now → trimmed |
|---|--:|--:|
| Dracophyllum | 181 → 120 | 1.89 → 1.31 |
| Tōtara (both cards) | 190 → 141 | 1.81 → 1.39 |
| Mountain Beech | 180 → 131 | 1.81 → 1.39 |
| Subalpine Scrub (alpine) | 166 → 138 | 1.65 → 1.46 |
| Kahikatea | 156 → 141 | 1.54 → 1.46 |
| Grey Scrub (lowland) | 154 → 132 | 1.54 → 1.39 |
| Tussock (lowland) | 115 → 97 | 1.28 → 1.12 |
| Tawa | 114 → 95 | 1.20 → 1.12 |
| Wharariki | 110 → 87 | 1.15 → 1.00 |
| Snow Tussock (alpine) | 112 → 104 | 1.15 → 1.07 |
| Mamaku & Ponga | 106 → 96 | 1.09 → 1.01 |
| Mānuka | 98 → 87 | 1.09 → 1.01 |
| Tī kōuka (wetland) | 104 → 96 | 1.04 → 1.00 |
| Harakeke | 96 → 82 | 1.01 → 1.00 |
| Pūrei | 83 → — | 1.00 → 1.00 |
| Nīkau | 93 → — | 1.00 → 1.00 |
| Kōwhai (both cards) | 84 → — | 1.00 → 1.00 |
| Tī kōuka (lowland) | 90 → — | 1.00 → 1.00 |

---

## Dracophyllum

181 → 120 words. **What goes:** Colenso and the naming of the species (28 words of botanical history). The treeline sentence, which the Subalpine Scrub card already tells. Small tightening elsewhere.

Aotearoa has **more kinds of Dracophyllum than anywhere else in the world**! Most appeared in the last few million years, as the mountains rose and the ice ages began.

Stiff, needle-leaved and wind-proof, it rides out storms that can blow down tall trees. It could only live here once the Ruahine and Tararua ranges grew cold, windswept tops.

In glacial times, the Manawatū may have looked like Campbell Island today, where Dracophyllum is the main woody plant.

*Boosting dracophyllum helps:*

The North Island giant moa roamed from the coast up to the herbfields and grasslands above the trees.

Did giant moa eat Dracophyllum's stiff leaves? Nobody knows for sure! Scientists study fossil droppings and the food left in moa gizzards to find out.

## Tōtara (both cards)

190 → 141 words. **What goes:** The last harrier paragraph (kererū as favourite prey folds into the one before; the food-chain line goes). The drowned-forest story is tightened. **The Rangitāne kōrero is untouched**: its wording is waiting on Rangitāne o Manawatū.

Tōtara is a massive podocarp tree that can **live for around 1,000 years**!

Where rising water drowned tōtara forest, the wood was so tough that the dead stumps didn't rot away. They still lie buried in the peat thousands of years later.

In Rangitāne tradition, the Manawatū Gorge, **Te Āpiti**, was formed by **Ōkatia**, a spirit who took the form of a **giant tōtara tree** and forced his way through the ranges to reach the sea.

*Boosting tōtara helps:*

Eyles' harrier was a giant bird of prey, the biggest harrier that ever lived. The North Island had no Haast's eagle, so here the harrier was the **top predator**.

It hunted kererū (its favourite), kōkako, kākā and ducks, and the biggest may even have caught some of the smaller moa! It is now extinct, and the kāhu (swamp harrier) fills part of its place today.

## Mountain Beech

180 → 131 words. **What goes:** Black beech at Aokautere (a good local detail, but it is a different species from the one on this card). "Pairs foraged side by side". The huia's range wording is tightened.

There are **five Beech species** in Aotearoa. In the Ruahine Range, Mountain beech climbs **right up to the "treeline,"** where forest ends and tussock-land begins.

In the ice ages, cold pushed whole forests downhill, but **Beech held in harsh soil** while other trees died away.

Beech has 'mast' years, when every tree floods the forest with seed at once!

*Boosting mountain beech helps:*

A ghost of the forest, the huia lived only in the North Island. The Ruahine and Tararua ranges were among its last homes. It is now extinct: the last confirmed sighting was in 1907.

Male and female huia had **completely different beaks**: his was short and strong, hers long and curved. They hunted **huhu grubs**, fat beetle larvae in rotting wood: he probably chiselled in while she probed deep into the tunnels.

## Subalpine Scrub

166 → 138 words. **What goes:** The first giant-moa paragraph folds into the last. "They lived everywhere from the coast to the mountaintops" goes, as the Dracophyllum card says it. Fixes the stray "that" and the trailing "..." in the pōhuehue line.

At the "bushline," tough shrubs take over from trees: leatherwood, coprosma and many others grow in a dense thicket.

The southern Ruahine has New Zealand's biggest unbroken stretch of leatherwood. It's so thick that **trampers once had to crawl underneath it**, or walk across the top!

Downhill, scrub plants "pioneer" the forest's **regrowth after a super-volcanic eruption**: pōhuehue scrambles over the bare, broken ground, then coprosma follows, making better ground for the forest.

*Boosting subalpine scrub helps:*

The North Island giant moa was one of the tallest birds that ever lived. The females were far bigger than the males: about one and a half times as tall, and nearly three times as heavy!

It browsed coprosma, even up in the rising ranges, and could reach branches three metres up. There were more giant moa in patchy, shrubby country than in thick forest.

## Grey Scrub

154 → 132 words. **What goes:** "Coast to the mountaintops" (said on two other cards). Tightens the shrub description. Fixes the stray "that" and the ".." typo. Keeps "could a moa get its beak in there?", which sends the eye to the art.

Many native shrubs have tiny leaves on wide, criss-crossed branches. Did they grow that way to fend off the moa, or to survive ice-age frost and wind? Scientists still argue.

Scrub plants "pioneer" the forest's **regrowth after a super-volcanic eruption**: pōhuehue scrambles over the bare, broken ground, then coprosma follows, making better ground for the forest.

*Boosting grey scrub helps:*

The North Island giant moa was one of the tallest birds that ever lived. The females were far bigger than the males: about one and a half times as tall, and nearly three times as heavy!

Giant moa browsed leaves, twigs and fruit, and could reach branches three metres up. There were more of them in patchy, shrubby country than in thick forest.

Look at those tangled branches: could a moa get its beak in there?

## Kahikatea

156 → 141 words. **What goes:** Tightens the butter-box line and both bush moa paragraphs. No facts go, apart from "over many generations they evolved". Restore that if the evolution point matters here (`TEMANAWA_GOALS.md` §3 corrected it to "evolved" on purpose).

Kahikatea is **New Zealand's tallest tree**, growing up to 60 metres! Long stands of kahikatea lined the ancient wetlands along the Manawatū River.

You might see kahikatea die and grow back as the river shifts: its **seedlings need fresh, wet silt** at the water's edge. At Round Bush near Foxton, people crossed the flooded forest by **stepping along its raised roots**. Birds eat its **red berries** and spread the seeds.

Kahikatea wood went into butter boxes, the wetlands were drained, and almost all of it is gone.

*Boosting kahikatea helps:*

Bush moa lived in thick forest, with a strong beak for snipping twigs and leaves. They ate lots of fern fronds, and may have helped spread fern spores!

They browsed the young plants of the swamp forest floor, trimming seedlings back but rarely killing them: forest and moa lived together for millions of years.

## Tussock

115 → 97 words. **What goes:** The goose sentence in the plant section, which the bird section repeats. "Glacial ice ages" is redundant. The goose is called "Giant Goose" here and "North Island goose" everywhere else, and this removes the odd one out.

In the ice ages, **grass covered the open plains**. Much of the Manawatū lowland was cold, windswept flats, and they grew as it got colder.

*Boosting tussock helps:*

The North Island goose was a big, heavy goose that couldn't fly. It walked the open country and forest edges, grazing grass and herbs.

It was never common, because in warm times forest covered most of the land. In the ice ages, when tussock spread across the plains, the goose spread with it.

Tussock **regrows from its base** after it's grazed or burned: fresh, tender shoots, the best food in open country.

## Wharariki

110 → 87 words. **What goes:** Aruwaru as a named summit. The pollen line, which the tūī paragraph says again. Bellbirds.

Mountain flax is the smaller, drooping cousin of harakeke, at home on the cold, windswept tops of the Tararua and Ruahine ranges.

It moves in where old leatherwood dies, and it **crosses with harakeke** where the two meet.

Its **yellow-green flowers** are full of nectar, and its **seeds blow away on the wind**.

*Boosting wharariki helps:*

Tūī follow the flowers, even up into the mountains. They drink wharariki's nectar and **carry its pollen from plant to plant**.

Tūī have two voice boxes, so they can sing two notes at once!

## Tawa

114 → 95 words. **What goes:** "Under tall trees like tōtara, rimu and kahikatea". Light tightening otherwise: both sections carry a real idea.

Tawa forms the thick middle layer of the podocarp forest, so dense that young nīkau underneath struggle for light.

How much tawa grew in the ancient Manawatū is a mystery: its pollen doesn't preserve, and pollen is how scientists rebuild past forests.

*Boosting tawa helps:*

Tawa has the **biggest seeds of any plant here**, and it needs kererū: today they're the only bird big enough to swallow and spread them!

Moa didn't spread it: the stones in their gizzards (gastroliths) ground up seeds. So kererū don't just sit around eating – they're working hard to plant the forest!

## Snow Tussock

112 → 104 words. **What goes:** "From the coast to the mountaintops" in the goose paragraph, which the first paragraph already says of the tussock.

The grass of the high tops. In the ice ages, **tussock grassland ran from the coast to the summits**.

Alpine country itself is young: permanent for only a million years. Can you see the ranges forming when time is boosted forward?

Tussock **regrows from its base** after it's grazed or burned, sending up fresh, nutritious shoots.

*Boosting snow tussock helps:*

The North Island goose was a big, heavy goose that couldn't fly. It grazed on grass and herbs in the open country and forest edge.

It was rare in warm times, when forest covered most of the land. In the ice ages, the goose spread with the tussock.

## Mamaku & Ponga

106 → 96 words. **What goes:** "Faster than trees" and "have been reported" in your new tree-fern line. "Mixes in fallen leaves".

Mamaku is Aotearoa's tallest tree fern, growing up to 20 metres tall! Ponga's fronds are green on top and brilliant silver underneath.

Tree ferns **need a warm climate**: when an ice age came around, **about 90% of them died back**. Thankfully, they grow back fast: dense stands of mamaku can grow in about 50 years.

*Boosting mamaku & ponga helps:*

Kiwi love ferns, because a **ferny forest floor is damp** and sheltered, full of bugs and rich soil – perfect for **probing with their long beaks** at night! All that probing turns over the soil and keeps the forest floor rich.

## Mānuka

98 → 87 words. **What goes:** "The stout-legged moa browsed this open, dry scrub": the heading and the bird section say it. "Leached terraces", a hard term for 8–14-year-olds.

The **tough pioneer** of poor ground, holding the dry sand plains. New Zealand mānuka has evolved apart from Australia's for about ten million years.

*Boosting mānuka helps:*

The stout-legged moa was short and heavy, with thick, powerful legs. It lived in the drier, more open lowlands and along the coast, eating leaves and fruit.

Stout-legged moa came in very different sizes: the smallest lived in the far north, and they **grew bigger the further south they lived**. Around the Manawatū, they were some of the biggest in the North Island!

## Tī kōuka

104 → 96 words. **What goes:** "Land duck" and "unlike most ducks it lived on land" say the same thing.

The cabbage tree can **regrow from its base** if it's damaged!

Tī kōuka loves wet ground, but it's **hardy enough to survive glacial climates**.

*Boosting tī kōuka helps:*

Finsch's duck was a land duck about the size of a mallard, with thick legs and small wings. It grazed the drier ground around the swamps, and it was slowly losing the power to fly.

Tī kōuka stands on the damp, open ground at the swamp's edge, just the kind of country Finsch's duck grazed. When the ice ages opened up the forest into grassland, there was more of it to roam.

## Harakeke

96 → 82 words. **What goes:** The Moutoa swamp survey, an archival detail.

Harakeke grows to about 3 metres tall, and its **flower stalks can reach 5 metres – taller than a ceiling**! **Tūī carry pollen between its flowers** as they drink the nectar.

Harakeke was actually less common in ancient times. It spread through the Manawatū after the swamps were drained and the rivers stopbanked, and it fed a huge flax-milling industry.

*Boosting harakeke helps:*

Mantell's moa was a stocky moa of lowland swamps and dunes, with a strong bill suited to tough, fibrous plants like harakeke.
