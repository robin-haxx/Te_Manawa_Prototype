// ============================================================
// TE MANAWA: PLANT GOALS — the visitor objective above the timeline
// ------------------------------------------------------------
// The line floated above the timeline (InstallHUD.renderVisitorGoal) asks a question that a plant
// answers, e.g. "Boost a plant that was rarer in ancient times than today" → harakeke. A boost from
// the touchscreen (TeManawa_bus.js onBoost) is judged against the live goal, and the line turns into
// a verdict until the boost's time-lapse is over:
//
//   right plant, right climate   "Harakeke was an interglacial plant, and was rarer in …!"
//                                 · in the climate boost colour (green/blue), a BIGGER boost (more
//                                   seedlings, more birds), and a white outline easing to green/blue.
//                                   When it fades, a NEW goal comes up.
//   other plant, right climate   "Tōtara was in interglacial habitats, but is not rarer in …..."
//                                 · the normal matched boost (outline, rim pulse, trails). Same goal after.
//   wrong climate                "Tawa was not glacial, and was not rarer in …"
//                                 · grey, nothing grows (the regime-fit lesson). Same goal after.
//
// WHICH GOAL IS UP. Every goal that is LIVE right now (below) is a candidate, and one is drawn at
// random, so two visitors at the same point in the timeline can get different goals. The draw leans
// on the BIRD SEQUENCE (TM_GOALS.sequence: moa → harrier → lowland animals → forest birds): most of
// the time (sequenceBias) it takes a goal from the current stage, otherwise any live goal, for
// variety. Solving a goal moves the sequence on a stage. The last few goals shown are skipped while
// there is any other choice. A goal stays up across a climate flip as long as it is still live.
//
// HOW TO ADD A GOAL — append to TM_GOALS.list below:
//   id      unique key (bootcheck checks it)
//   group   'moa' | 'harrier' | 'lowland' | 'forest' — the bird its main answer feeds (the plant's
//           paired bird, md/TEMANAWA_ENCYCLOPEDIA_FLORA.md §2.6); places it in the bird sequence
//   prompt  the line shown while the goal is live (te reo with macrons; bootcheck checks the common words)
//   cond    the condition, worded to slot into the verdict lines ("rarer in ancient times than today")
//   answer  [sim plant keys] that solve it (flax = harakeke; see PLANT_TYPES / the encyclopedia cards).
//           Several answers are fine (goals overlap). Every answer must be on a touchscreen card.
//   text    optional: this goal's own wording for any verdict line, by kind (answer / matched / wrong /
//           answerWrongClimate), same {tokens}. Lines it leaves out use TM_GOALS.text.
//   WHEN IT IS LIVE. Three gates are AUTOMATIC, so most goals need nothing more:
//     · climate: one of its answers must FIT the current climate (a warm answer only in an
//       interglacial, a cold one only in a glacial; both-worlds plants always), so it can be met;
//     · habitat: … and have room to grow on the current land (Simulation.hasHabitat, at least
//       minHabitatCells). A Dracophyllum goal stays dark until the ranges carry subalpine tops.
//   Optional extra gates:
//     fromYearsBP / untilYearsBP   live only once the clock is at/younger than, or while at/older than
//     requires: { plants: { Totara: 10 } }    at least this many GROWN plants of a kind on the land
//               { birds:  { kereru: 1 } }     at least this many of a bird alive
//               { eruption: true }            only after an eruption has happened this session
//     off: true                    keep it in the book but never deliver it (a draft)
//   When no goal is live, the line falls back to the regime objective (InstallHUD.GOAL_OBJECTIVE).
//
// Pure and p5-free (like climate.js): reads DeepTime / Climate / PLANT_TYPES / TM_GROW / TM_BOOST at
// call time only. Load before hud.js and bus.js (index.html). Console-tunable as window.TM_GOALS.
// The goal book, the facts behind it and its open questions: md/TEMANAWA_GOALS.md.
// ============================================================

const TM_GOALS = {
  // The bird sequence the draw leans on, and how strongly (1 = always the current stage when it has a
  // live goal; 0 = no sequence at all).
  sequence: ['moa', 'harrier', 'lowland', 'forest'],
  sequenceBias: 0.75,
  recentMemory: 3,              // skip the last N goals shown while there is another choice

  list: [
    // ---- MOA: kahikatea (little bush moa), harakeke (Mantell's moa), mānuka (stout-legged moa) ----
    // Esler: harakeke spread after drainage and stopbanking, onto ground that had been too wet for it,
    // so the flax-filled Manawatū of the old photographs is partly a product of drainage
    // (md/TEMANAWA_ECOLOGY_WETLAND.md §3). Both-worlds (coldTolerance 0.7): live in either climate.
    { id: 'harakeke-rarer', group: 'moa',
      prompt: 'Boost a plant that was rarer in ancient times than today',
      cond:   'rarer in ancient times than today',
      answer: ['flax'] },
    // Kahikatea forest is ~2% of what it was: milled for butter boxes, its swamps drained.
    { id: 'kahikatea-rarer-today', group: 'moa',
      prompt: 'Boost a plant that is much rarer today than in ancient times!',
      cond:   'much more common in ancient times than today',
      answer: ['kahikatea'] },
    { id: 'tallest', group: 'moa',
      prompt: 'Boost the tallest plant!',
      cond:   "New Zealand's tallest tree",
      answer: ['kahikatea'] },
    // Grey scrub (Coprosma, pōhuehue) → North Island giant moa. Scrub fills back in after an eruption:
    // pōhuehue scrambles over disturbed open ground, and Coprosma comes in as an early-to-mid colonist
    // of fresh volcanic ground (Rangitoto). NOT "first": the true post-eruption pioneers are bracken,
    // toetoe and tutu (Taupō, Tarawera), none of them on the cards. Cold, so glacial; only after an
    // eruption has happened this session (Kaukatea, Whakamaru and Ōruanui all fall in glacials).
    { id: 'scrub-after-volcano', group: 'moa',
      prompt: 'Boost a scrub that grows back after a volcano!',
      cond:   'a scrub that grows back after a volcano',
      answer: ['coprosma'],
      requires: { eruption: true } },
    // ---- From the cards (2026-10-19). Each fact below is on its answer's touchscreen card
    // (secondscreen/encyclopedia.js), quoted in the comment, so a visitor can find the answer there.
    // Harakeke: "its flower stalks can reach 5 metres – taller than a ceiling!"
    { id: 'tall-flower-stalks', group: 'moa',
      prompt: 'Boost a plant with flower stalks taller than a ceiling!',
      cond:   'a plant with flower stalks taller than a ceiling',
      answer: ['flax'] },
    // Kahikatea: "At Round Bush near Foxton, people crossed the flooded forest by stepping along its raised roots."
    { id: 'stepping-roots', group: 'moa',
      prompt: 'Boost a tree whose roots were stepping stones in a flooded forest!',
      cond:   'a tree whose roots were stepping stones in a flooded forest',
      answer: ['kahikatea'] },
    // Kahikatea: "Kahikatea wood was used to make butter boxes."
    { id: 'butter-boxes', group: 'moa',
      prompt: 'Boost a tree that was cut down to make butter boxes!',
      cond:   'a tree cut down to make butter boxes',
      answer: ['kahikatea'] },
    // Subalpine scrub: "It's so thick that trampers once had to crawl underneath it, or walk across the top!"
    { id: 'crawl-under-scrub', group: 'moa',
      prompt: 'Boost a scrub so thick that trampers had to crawl under it!',
      cond:   'a scrub so thick that trampers had to crawl under it',
      answer: ['coprosma'] },
    // Both scrub cards (giant moa): "The females were far bigger than the males … nearly three times as heavy!"
    { id: 'giant-moa-females', group: 'moa',
      prompt: 'Boost a scrub that fed a moa whose females were far bigger than males!',
      cond:   'food for a moa whose females were far bigger than the males',
      answer: ['coprosma'],
      text:   { answer: '{plant} fed the giant moa, whose females were nearly three times as heavy as the males!' } },
    // Mānuka: "New Zealand mānuka has evolved apart from Australia's for about ten million years."
    { id: 'manuka-apart', group: 'moa',
      prompt: "Boost a plant that has evolved apart from Australia's for 10 million years!",
      cond:   "evolving apart from Australia's for about ten million years",
      answer: ['manuka'] },
    // Mānuka (stout-legged moa): "the biggest lived in the south of the North Island, around places like the Manawatū!"
    { id: 'manawatu-moa', group: 'moa',
      prompt: 'Boost a plant for the moa whose biggest kind lived around the Manawatū!',
      cond:   'food for the moa whose biggest kind lived around the Manawatū',
      answer: ['manuka'],
      text:   { answer: '{plant} fed the stout-legged moa, and the biggest ones lived around places like the Manawatū!' } },
    // Dracophyllum: "Aotearoa has more kinds of Dracophyllum than anywhere else in the world!" Cold, and only
    // once the ranges carry subalpine tops (the habitat gate).
    { id: 'most-kinds-here', group: 'moa',
      prompt: 'Boost a plant with more kinds here than anywhere else on Earth!',
      cond:   'a plant with more kinds in Aotearoa than anywhere else on Earth',
      answer: ['dracophyllum'] },

    // ---- HARRIER: tōtara (Eyles' harrier) ---------------------------------------------------------
    // Rangitāne kōrero: the spirit Ōkatia, in a giant tōtara, forced its way through the ranges to the
    // sea and formed Te Āpiti, the Manawatū Gorge. CONFIRM the wording with Rangitāne o Manawatū.
    // Delivered once the river has taken shape (continuous source-to-sea by ~0.5 Ma, a narrow river by
    // ~0.25 Ma: TerrainGenerator.GEO_EPOCHS emergeTo / straitCloseTo) and tōtara forest stands on the land.
    { id: 'okatia', group: 'harrier',
      prompt: 'Boost the tree of Ōkatia, the atua who formed Te Āpiti!',
      cond:   "Ōkatia's tree form",
      answer: ['Totara'],
      fromYearsBP: 400000,
      requires: { plants: { Totara: 10 } } },
    // Kererū were the harrier's favourite prey; kōkako bones are in its middens too (NZ Birds Online).
    { id: 'seed-spreaders', group: 'harrier',
      prompt: 'Boost a tree that has seeds kererū and kōkako spread!',
      cond:   'a tree whose seeds kererū and kōkako spread',
      answer: ['Totara', 'nikau'],
      requires: { birds: { kereru: 1, kokako: 1 } },
      text:   { answer: "{plant}'s seeds were spread by kererū and kōkako! When their numbers grow, so does Eyles' harrier..." } },
    // Tōtara: "Tōtara is a massive podocarp tree that can live for around 1,000 years!"
    { id: 'thousand-years', group: 'harrier',
      prompt: 'Boost a tree that can live for 1,000 years!',
      cond:   'a tree that can live for 1,000 years',
      answer: ['Totara'] },
    // Tōtara: "the dead stumps didn't rot away. They still lie buried in the peat thousands of years later."
    { id: 'buried-stumps', group: 'harrier',
      prompt: 'Boost a tree whose stumps still lie buried in ancient peatlands!',
      cond:   'a tree whose stumps still lie buried in the peat',
      answer: ['Totara'] },
    // Tōtara (Eyles' harrier): "The North Island had no Haast's eagle, so here the harrier was the top predator."
    { id: 'top-predator', group: 'harrier',
      prompt: "Boost a tree for the North Island's top predator!",
      cond:   "home to the North Island's top predator",
      answer: ['Totara'],
      text:   { answer: "{plant} was home to Eyles' harrier, the top predator of the North Island!" } },

    // ---- LOWLAND ANIMALS: pūrei (mōho/takahē), tussock (goose), tī kōuka (Finsch's duck) -----------
    // The both-worlds plants: the cards' neutral coldTolerance (0.65 < ct < 0.75), the ones the boost
    // gate matches in EITHER climate. Bootcheck holds this list to exactly those card plants.
    { id: 'both-worlds', group: 'lowland',
      prompt: 'Boost a plant that is suited to cold and warm habitats!',
      cond:   'suited to cold and warm habitats',
      answer: ['kowhai', 'cabbagetree', 'flax', 'manuka', 'sedge', 'wharariki'],
      text:   { answer: '{plant} was suited to both glacial and interglacial habitats!' } },
    // Switched on 2026-10-19: each fact is on its answer's card (was a draft, md/TEMANAWA_GOALS.md §4).
    // Pūrei: "stands in open water on a trunk-like pedestal of its own old roots".
    { id: 'purei-island', group: 'lowland',                  // pūrei → mōho (NI takahē)
      prompt: 'Boost a plant that builds its own little island in the swamp!',
      cond:   'a plant that builds its own little island',
      answer: ['sedge'] },
    // Tī kōuka: "can regrow from its base if it's damaged!"; both tussock cards: "Tussock regrows from its base".
    { id: 'regrow-from-base', group: 'lowland',              // tī kōuka → Finsch's duck; tussock → goose
      prompt: 'Boost a plant that can regrow from its base!',
      cond:   'a plant that can regrow from its base',
      answer: ['cabbagetree', 'tussock'] },
    // Tussock (flats): "In the glacial ice ages, grass covered the open plains."
    { id: 'ice-age-grass', group: 'lowland',                 // tussock → North Island goose (glacial only)
      prompt: 'Boost the grass that covered the ice-age plains!',
      cond:   'the grass that covered the ice-age plains',
      answer: ['tussock'] },
    // Pūrei (mōho): "The mōho was the North Island's takahē, a big flightless rail that grazed grass and swamp plants."
    { id: 'moho-food', group: 'lowland',
      prompt: "Boost a swamp plant that fed the North Island's takahē!",
      cond:   "food for the mōho, the North Island's takahē",
      answer: ['sedge'] },
    // Snow tussock: "Alpine country itself is young: permanent for only a million years."
    { id: 'young-tops', group: 'lowland',
      prompt: 'Boost the grass of the high tops, which are only a million years old!',
      cond:   'the grass of high tops that are only a million years old',
      answer: ['tussock'] },

    // ---- FOREST BIRDS: tawa (kererū), tree ferns (kiwi), nīkau (kōkako), kōwhai (tūī) --------------
    { id: 'largest-seeds', group: 'forest',
      prompt: 'Boost the plant with the largest seeds!',
      cond:   'the plant with the largest seeds',
      answer: ['tawa'] },
    // Esler (p. 46): nīkau starved of light under the closed tawa canopy at the Gorge.
    { id: 'outgrow-nikau', group: 'forest',
      prompt: 'Boost a plant that can out-compete nīkau!',
      cond:   'able to out-compete nīkau',
      answer: ['tawa'],
      requires: { plants: { nikau: 3, tawa: 3 } } },
    { id: 'shelters-kiwi', group: 'forest',
      prompt: 'Boost a plant that shelters kiwi!',
      cond:   'a shelter for kiwi',
      answer: ['fern'],
      requires: { birds: { north_island_brown_kiwi: 1 } } },
    // Cards that stand for a group of close relatives: tree ferns (mamaku, ponga), beech, Dracophyllum,
    // kōwhai (8 species), Coprosma, tussock. Live in either climate.
    { id: 'similar-species', group: 'forest',
      prompt: 'Boost a plant that comes in several similar species!',
      cond:   'a plant with several similar species',
      answer: ['fern', 'beech', 'dracophyllum', 'kowhai', 'coprosma', 'tussock'] },
    // The most frost-tender plants: tree-fern pollen fell ~90% at the last ice age (7% → 0.7%).
    { id: 'dies-back-cold', group: 'forest',
      prompt: 'Boost a plant that dies back when it gets colder!',
      cond:   'a plant that dies back when it gets colder',
      answer: ['fern', 'nikau', 'tawa'] },
    // Tōtara and kahikatea "berries" are fleshy red stalks under the seed; nīkau's are true fruit.
    { id: 'red-berries', group: 'forest',
      prompt: 'Boost a plant with red berries!',
      cond:   'a plant with red berries',
      answer: ['nikau', 'Totara', 'kahikatea'] },
    { id: 'yellow-flowers', group: 'forest',
      prompt: 'Boost a plant with yellow flowers!',
      cond:   'a plant with yellow flowers',
      answer: ['kowhai', 'wharariki'] },
    { id: 'tui-flowers', group: 'forest',
      prompt: 'Boost a flower that tūī pollinate!',
      cond:   'a flower that tūī pollinate',
      answer: ['kowhai', 'flax', 'wharariki'],
      requires: { birds: { tui: 1 } } },
    // Mountain beech → huia. It forms the Ruahine treeline; in the ice ages ~88% of forest pollen was
    // beech. Cold, so these are live in glacials. (Was 'beech-rare', true of the lowland black beech
    // at Aokautere but not of the mountain beech the card now shows.)
    { id: 'beech-treeline', group: 'forest',
      prompt: 'Boost a tree that grows right up to the treeline!',
      cond:   'a tree that grows right up to the treeline',
      answer: ['beech'],
      text:   { answer: '{plant} grows right up to the treeline, and in the ice ages beech was the main forest tree!' } },
    { id: 'mast-years', group: 'forest',
      prompt: 'Boost a tree that has mast years!',
      cond:   'a tree that has mast years',
      answer: ['beech'],
      text:   { answer: '{plant} has mast years, when every tree floods the forest with seed at once!' } },
    // ---- From the cards (2026-10-19), forest birds. Each fact quoted from its answer's card.
    // Nīkau: "Nīkau is the world's southernmost palm!"
    { id: 'southernmost-palm', group: 'forest',
      prompt: "Boost the world's southernmost palm!",
      cond:   "the world's southernmost palm",
      answer: ['nikau'] },
    // Mamaku & ponga: "Mamaku is Aotearoa's tallest tree fern, growing up to 20 metres tall!"
    { id: 'tallest-tree-fern', group: 'forest',
      prompt: "Boost Aotearoa's tallest tree fern!",
      cond:   "Aotearoa's tallest tree fern",
      answer: ['fern'] },
    // Mamaku & ponga: "Ponga's fronds are green on top and brilliant silver underneath."
    { id: 'silver-fronds', group: 'forest',
      prompt: 'Boost a plant whose fronds are silver underneath!',
      cond:   'a plant whose fronds are silver underneath',
      answer: ['fern'] },
    // Tawa: "how much tawa grew in the ancient Manawatū is a mystery: its pollen doesn't preserve".
    { id: 'pollen-mystery', group: 'forest',
      prompt: "Boost a tree whose pollen doesn't last in the ground!",
      cond:   "a tree whose pollen doesn't last in the ground",
      answer: ['tawa'] },
    // Kōwhai: "their seeds float: kōwhai's ancestors reached these islands across the ocean!"
    { id: 'floating-seeds', group: 'forest',
      prompt: 'Boost a plant whose seeds floated here across the ocean!',
      cond:   'a plant whose seeds floated here across the ocean',
      answer: ['kowhai'] },
    // Kōwhai: "Though it's a small tree, kōwhai lived through the ice ages!"
    { id: 'small-survivor', group: 'forest',
      prompt: 'Boost a small tree that lived through the ice ages!',
      cond:   'a small tree that lived through the ice ages',
      answer: ['kowhai'] },
    // Mountain beech: "Cold pushed whole forests downhill, but Beech held in harsh soil while other trees died away."
    { id: 'held-in-cold', group: 'forest',
      prompt: 'Boost a tree that held on when the cold pushed forests downhill!',
      cond:   'a tree that held on when the cold pushed forests downhill',
      answer: ['beech'] },
    // Mountain beech (huia): "They hunted huhu grubs, fat beetle larvae that live in rotting wood."
    { id: 'huhu-grubs', group: 'forest',
      prompt: 'Boost a tree where huia hunted fat huhu grubs!',
      cond:   'a tree where huia hunted huhu grubs',
      answer: ['beech'] },
    // Wharariki: "Its seeds blow away on the wind."
    { id: 'wind-seeds', group: 'forest',
      prompt: 'Boost a plant whose seeds blow away on the wind!',
      cond:   'a plant whose seeds blow away on the wind',
      answer: ['wharariki'] },
    // Wharariki: "it crosses with harakeke where the two meet."
    { id: 'flax-cousin', group: 'forest',
      prompt: 'Boost a plant that crosses with harakeke where the two meet!',
      cond:   'a plant that crosses with harakeke where the two meet',
      answer: ['wharariki'] },

    // ---- SUGGESTED — sim mechanics and bird traits to fill the timeline. Each one's facts and the gap
    // it fills: md/TEMANAWA_GOALS.md §4. Those whose fact is on the answer's card were switched on
    // 2026-10-19. Five stay drafts (off: true) because no card says it yet: no wings, owl-like
    // hearing, harrier scrub, blue wattles, kiwi nostrils. Add the line to the card, then switch on.
    // Moa
    { id: 'flood-tree', group: 'moa',              // sim: kahikatea recruits only on flood silt
      prompt: 'Boost a tree that needs a flood to grow!',
      cond:   'a tree that needs a flood to grow',
      answer: ['kahikatea'] },
    { id: 'no-wings', group: 'moa', off: true,                // trait: moa had no wings at all
      prompt: 'Boost a plant that fed a bird with no wings at all!',
      cond:   'food for a bird with no wings at all',
      answer: ['kahikatea', 'flax', 'coprosma', 'manuka'],
      text:   { answer: '{plant} fed a moa, a bird with no wings at all!' } },
    { id: 'tangled-shrub', group: 'moa',           // trait: divaricating shrubs vs moa browsing
      prompt: 'Boost a tangled shrub that may have grown that way to keep moa off!',
      cond:   'a tangled shrub that may have kept moa off',
      answer: ['coprosma'],
      text:   { answer: '{plant} grows in a tangle of twigs that may have kept hungry moa away!' } },
    { id: 'sand-plains', group: 'moa',             // Esler: mānuka held the dry sand plains
      prompt: 'Boost a plant can hold dry sand plains!',
      cond:   'a plant of the dry sand plains',
      answer: ['manuka'] },
    // Harrier
    { id: 'owl-hearing', group: 'harrier', off: true,         // trait: owl-like directional hearing
      prompt: 'Boost a tree for a hunter that could hear like an owl!',
      cond:   'a tree for a hunter that could hear like an owl',
      answer: ['Totara'],
      text:   { answer: "{plant} was home to Eyles' harrier, a hunter that could hear like an owl!" } },
    { id: 'harrier-scrub', group: 'harrier', off: true,       // habitat: forest edge and shrubland; glacial too
      prompt: "Boost a scrub where Eyles' harrier hunted!",
      cond:   "a scrub where Eyles' harrier hunted",
      answer: ['coprosma', 'manuka'] },
    // Lowland animals
    { id: 'ash-bloom', group: 'lowland',           // sim: an eruption blooms the wetland
      prompt: 'Boost a plant that spreads after volcanic ash falls!',
      cond:   'a plant that spreads after volcanic ash falls',
      answer: ['sedge'],
      requires: { eruption: true },
      text:   { answer: '{plant} spreads after volcanic ash falls, as the ash widens the swamp edges!' } },
    { id: 'flightless-goose', group: 'lowland',    // trait: the North Island goose couldn't fly
      prompt: "Boost the grass that fed a goose that couldn't fly!",
      cond:   "the grass that fed a goose that couldn't fly",
      answer: ['tussock'],
      text:   { answer: "{plant} fed the North Island goose, which couldn't fly!" } },
    { id: 'walking-duck', group: 'lowland',        // trait: Finsch's duck had nearly stopped flying
      prompt: 'Boost a plant from the land of a duck that had almost stopped flying!',
      cond:   'from the land of a duck that had almost stopped flying',
      answer: ['cabbagetree'],
      text:   { answer: "{plant} grew where Finsch's duck lived, a duck that walked more than it flew!" } },
    { id: 'storm-riders', group: 'lowland',        // sim: STORM_HARDY plants ride a storm out
      prompt: 'Boost a plant that rides out storms!',
      cond:   'a plant that rides out storms',
      answer: ['tussock', 'flax', 'manuka', 'coprosma', 'dracophyllum', 'sedge', 'wharariki'] },
    // Forest birds
    { id: 'huia-beaks', group: 'forest',           // trait: male and female huia beaks differed
      prompt: 'Boost a tree for the bird whose male and female had different beaks!',
      cond:   'a tree for the bird whose male and female had different beaks',
      answer: ['beech'],
      text:   { answer: "{plant} was home to the huia: the male's beak was short and strong, the female's long and curved!" } },
    { id: 'two-voice-boxes', group: 'forest',      // trait: tūī sing with two voice boxes
      prompt: 'Boost a flower for the bird with two voice boxes!',
      cond:   'a flower for the bird with two voice boxes',
      answer: ['wharariki', 'kowhai'],
      requires: { birds: { tui: 1 } },
      text:   { answer: '{plant} feeds the tūī, a bird with two voice boxes!' } },
    { id: 'blue-wattles', group: 'forest', off: true,         // trait: the North Island kōkako's blue wattles
      prompt: 'Boost a plant for the bird with bright blue wattles!',
      cond:   'a plant for the bird with bright blue wattles',
      answer: ['nikau'],
      text:   { answer: '{plant} feeds the kōkako, the bird with bright blue wattles!' } },
    { id: 'beak-tip-nose', group: 'forest', off: true,        // trait: kiwi nostrils at the tip of the beak
      prompt: 'Boost a plant for the bird that smells with the tip of its beak!',
      cond:   'a plant for the bird that smells with the tip of its beak',
      answer: ['fern'],
      text:   { answer: '{plant} shelters the kiwi, the bird that smells with the tip of its beak!' } }
  ],

  // Verdict lines. {plant} = the card's name, {regime} = 'glacial' / 'interglacial' (the climate NOW),
  // {a} = 'a' / 'an' for {regime}, {cond} = the goal's condition.
  text: {
    answer:       '{plant} was {a} {regime} plant, and was {cond}!',
    matched:      '{plant} was in {regime} habitats, but is not {cond}...',
    wrong:        '{plant} was not {regime}, and was not {cond}',
    // The right plant boosted in the wrong climate (only possible for a warm or cold answer).
    answerWrongClimate: '{plant} was {cond}, but was not {regime}...'
  },

  colPrompt: [236, 244, 240],   // the goal line and a matched-but-not-the-answer verdict (the year's colour)
  colWrong:  [150, 155, 152],   // a wrong-climate verdict: grey, like the rim pulse, a shade lighter to read
  // The answer verdict takes the climate boost colour: TM_BOOST.outlineInterglacial / outlineGlacial.

  holdMs: 7000,                 // a verdict stays at least this long, and until its time-lapse ends
  minHabitatCells: 200,         // the habitat gate: an answer needs at least this many cells of its biomes
                                // (of the 512² map; the subalpine tops are ~4,500 once the ranges rise)

  // The answer's bigger boost (TeManawa_bus.js onBoost), in place of TM_BOOST.matchedSeed / faunaRecruit.
  answerSeed:  24,
  answerFauna: 4,
  answerOutlineFrom: [255, 255, 255],   // the answer's outline starts solid white…
  answerOutlineMs:   6000,              // …and eases to the climate colour over this long
  answerOutlinePx:   8,                 // a slightly heavier ring than a normal boost's 6

  // Names in the verdict lines. `verdictNames` wins over the card's own name where that reads badly
  // in a sentence (the "Mamaku & Ponga" card would say "Mamaku & Ponga was …"). `names` covers a
  // boost that arrives without the card's name (m.plantName), where the sim's PLANT_TYPES name isn't
  // the one visitors see; everything else falls back to PLANT_TYPES[key].name.
  verdictNames: { fern: 'The tree fern' },
  names: { flax: 'Harakeke', Totara: 'Tōtara', fern: 'The tree fern', coprosma: 'Scrub', beech: 'Mountain beech',
           cabbagetree: 'Tī kōuka' }
};
try { if (typeof window !== 'undefined') window.TM_GOALS = TM_GOALS; } catch (_) {}

const TMGoals = {
  _live: null,        // the live goal object, or null → the regime objective shows instead
  _stage: 0,          // where the bird sequence is up to (TM_GOALS.sequence index)
  _recent: [],        // ids of the last few goals shown (TM_GOALS.recentMemory)
  _dirty: true,       // re-check on the next update(), KEEPING the live goal if it is still live
  _force: true,       // … or draw a NEW goal (after a solve, and after a reset)
  _glacial: null,     // the regime the live goal was checked under
  _baked: undefined,  // the land (Game._bakedYearsBP) it was checked on
  _rand: Math.random, // the draw's random source (bootcheck swaps in a fixed sequence)
  // The current verdict. ONE reused object (no allocation on the frame path); kind null = none.
  _verdict: { kind: null, text: null, col: null, t0: 0, goalId: null },

  // ---- the boost gate's climate fit, shared with TeManawa_bus.js onBoost -----------------------
  // A warm species (low coldTolerance) wants the interglacial, a cold one the glacial; a mid-tolerance
  // plant (harakeke, mānuka, tī kōuka …) is neutral and fits either. TM_GROW lives in hud.js.
  fitOf(key) {
    const def = (typeof PLANT_TYPES !== 'undefined') ? PLANT_TYPES[key] : null;
    const ct = (def && def.coldTolerance != null) ? def.coldTolerance : 0.5;
    const warmMax = (typeof TM_GROW !== 'undefined' && TM_GROW.warmMax != null) ? TM_GROW.warmMax : 0.65;
    const coldMin = (typeof TM_GROW !== 'undefined' && TM_GROW.coldMin != null) ? TM_GROW.coldMin : 0.75;
    return ct <= warmMax ? 'warm' : (ct >= coldMin ? 'cold' : 'neutral');
  },
  fits(key, glacial) {
    const f = this.fitOf(key);
    return f === 'neutral' || (f === 'warm' ? !glacial : glacial);
  },
  glacialNow() {
    if (typeof Climate === 'undefined' || typeof DeepTime === 'undefined') return false;
    const thr = (Climate.regimeThreshold != null) ? Climate.regimeThreshold : 0.5;
    return Climate.glacialIndexAt(DeepTime.yearsBP) >= thr;
  },

  // ---- which goals are live ----------------------------------------------------------------------
  // GROWN plants by kind on the land now (growth ≥ 0.5), for `requires.plants`. Built once per draw.
  _plantCounts(sim) {
    const c = {};
    const P = sim && sim.plants;
    if (P) for (let i = 0; i < P.length; i++) {
      const p = P[i];
      if (p.alive && p.growth >= 0.5) c[p.type] = (c[p.type] || 0) + 1;
    }
    return c;
  },
  _birdCount(sim, key) {
    if (!sim) return 0;
    if (key === 'eyles_harrier') return sim.countAliveEagles ? sim.countAliveEagles() : 0;
    return sim.getSpeciesCount ? sim.getSpeciesCount(key) : 0;
  },

  // Live = not a draft, inside its window, its `requires` met, and at least one answer can be boosted
  // SUCCESSFULLY right now: it fits the climate and has habitat on the land. `counts` from _plantCounts.
  eligible(goal, g, glacial, yearsBP, counts) {
    if (!goal || goal.off || !goal.answer || !goal.answer.length) return false;
    if (goal.fromYearsBP != null && yearsBP > goal.fromYearsBP) return false;
    if (goal.untilYearsBP != null && yearsBP < goal.untilYearsBP) return false;
    const sim = g ? g.simulation : null;
    const R = goal.requires;
    if (R) {
      if (R.plants) {
        const c = counts || this._plantCounts(sim);
        for (const k in R.plants) if ((c[k] || 0) < R.plants[k]) return false;
      }
      if (R.birds) for (const k in R.birds) if (this._birdCount(sim, k) < R.birds[k]) return false;
      if (R.eruption && !(g && g._firedEruptions && g._firedEruptions.size > 0)) return false;
    }
    for (let i = 0; i < goal.answer.length; i++) {
      const key = goal.answer[i];
      if (!this.fits(key, glacial)) continue;
      if (sim && typeof sim.hasHabitat === 'function' && !sim.hasHabitat(key, TM_GOALS.minHabitatCells)) continue;
      return true;
    }
    return false;
  },

  // The live goals right now (allocates; event-driven only).
  liveGoals(g, glacial, yearsBP) {
    const counts = this._plantCounts(g ? g.simulation : null);
    const out = [];
    for (const gl of TM_GOALS.list) if (this.eligible(gl, g, glacial, yearsBP, counts)) out.push(gl);
    return out;
  },

  // Choose the goal to show. `keep`: hold the live goal if it is still live (a climate flip or a land
  // morph shouldn't churn the line). Otherwise draw: skip the recent few if there's another choice,
  // then usually (sequenceBias) take one from the current bird-sequence stage, else any live goal.
  // Event-driven (a solve, a regime flip, a land morph, a reset), never per frame: it scans the plants
  // and hasHabitat scans the biome map.
  _pick(g, glacial, yearsBP, keep) {
    const counts = this._plantCounts(g ? g.simulation : null);
    if (keep && this._live && TM_GOALS.list.indexOf(this._live) >= 0 &&
        this.eligible(this._live, g, glacial, yearsBP, counts)) return;
    const live = [];
    for (const gl of TM_GOALS.list) if (this.eligible(gl, g, glacial, yearsBP, counts)) live.push(gl);
    this._live = null;
    if (!live.length) return;
    let pool = live.filter(gl => this._recent.indexOf(gl.id) < 0);
    if (!pool.length) pool = live;
    const seq = TM_GOALS.sequence || [];
    const stage = seq.length ? seq[this._stage % seq.length] : null;
    const inStage = stage ? pool.filter(gl => gl.group === stage) : [];
    if (inStage.length && this._rand() < (TM_GOALS.sequenceBias != null ? TM_GOALS.sequenceBias : 0.75)) pool = inStage;
    const pick = pool[Math.min(pool.length - 1, Math.floor(this._rand() * pool.length))];
    this._live = pick;
    this._recent.push(pick.id);
    while (this._recent.length > (TM_GOALS.recentMemory || 0)) this._recent.shift();
  },

  // Per frame (InstallHUD.update). Releases a verdict once it has been read AND its time-lapse is
  // over (a solve moves the bird sequence on and draws a new goal), and re-checks the live goal when
  // the world it depends on has changed. Allocation-free on the common path.
  update(g, now) {
    const v = this._verdict;
    if (v.kind && now - v.t0 >= TM_GOALS.holdMs && !this._timeMoving()) {
      if (v.kind === 'answer') { this._stage++; this._force = true; }
      v.kind = null; v.text = null; v.col = null;
    }
    if (typeof DeepTime === 'undefined') return;
    const glacial = this.glacialNow();
    const baked = g ? g._bakedYearsBP : undefined;
    if (this._force || this._dirty || glacial !== this._glacial || baked !== this._baked) {
      const keep = !this._force;
      this._force = false; this._dirty = false; this._glacial = glacial; this._baked = baked;
      this._pick(g, glacial, DeepTime.yearsBP, keep);
    }
  },
  _timeMoving() {
    if (typeof DeepTime === 'undefined') return false;
    return !!((DeepTime.isTimelapsing && DeepTime.isTimelapsing()) || (DeepTime.isDeep && DeepTime.isDeep()));
  },

  // ---- the verdict -------------------------------------------------------------------------------
  // Judge a boost against the live goal (TeManawa_bus.js onBoost, BEFORE it seeds, so an answer gets
  // the bigger boost). `matched` is the boost gate's climate verdict. Returns the verdict
  // ({kind, text, col}), or null when no goal is live (the regime objective line just stays).
  judge(key, plantName, matched, glacial, now) {
    const goal = this._live;
    if (!goal || !key) return null;
    const isAnswer = goal.answer.indexOf(key) !== -1;
    const kind = isAnswer ? (matched ? 'answer' : 'answerWrongClimate') : (matched ? 'matched' : 'wrong');
    const regime = glacial ? 'glacial' : 'interglacial';
    const v = this._verdict;
    v.kind = kind;
    const tpl = (goal.text && goal.text[kind]) || TM_GOALS.text[kind];   // the goal's own line, else the book's
    const name = (TM_GOALS.verdictNames && TM_GOALS.verdictNames[key]) || plantName || this.nameOf(key);
    v.text = this.format(tpl, name, regime, goal.cond);
    v.col = (kind === 'answer') ? this.climateColor(glacial)
          : (kind === 'matched' ? TM_GOALS.colPrompt : TM_GOALS.colWrong);
    v.t0 = now || 0;
    v.goalId = goal.id;
    return v;
  },

  climateColor(glacial) {
    const B = (typeof TM_BOOST !== 'undefined') ? TM_BOOST : null;
    return glacial ? ((B && B.outlineGlacial) || [150, 205, 236])
                   : ((B && B.outlineInterglacial) || [84, 210, 96]);
  },

  nameOf(key) {
    if (TM_GOALS.names && TM_GOALS.names[key]) return TM_GOALS.names[key];
    const def = (typeof PLANT_TYPES !== 'undefined') ? PLANT_TYPES[key] : null;
    return (def && def.name) || key;
  },

  format(tpl, plant, regime, cond) {
    return String(tpl || '')
      .split('{plant}').join(plant)
      .split('{a}').join(/^[aeiou]/i.test(regime) ? 'an' : 'a')
      .split('{regime}').join(regime)
      .split('{cond}').join(cond || '');
  },

  // ---- read by the HUD and the bus ---------------------------------------------------------------
  // The line to show: the verdict while one holds, else the live goal's prompt; null → the HUD's
  // regime objective. color() pairs with text(); both return stable references (the HUD compares them).
  text()  { return this._verdict.kind ? this._verdict.text : (this._live ? this._live.prompt : null); },
  color() { return this._verdict.kind ? this._verdict.col : TM_GOALS.colPrompt; },
  live()  { return this._live; },
  verdict() { return this._verdict.kind ? this._verdict : null; },
  promptText() { return this._live ? this._live.prompt : null; },

  // Soft reset (Game.resetEcosystem → a new visitor): drop any verdict, restart the bird sequence and
  // draw afresh on the next update. Allocation-free (the recent list is emptied in place).
  reset() {
    this._live = null; this._stage = 0; this._recent.length = 0;
    this._force = true; this._dirty = true;
    const v = this._verdict; v.kind = null; v.text = null; v.col = null; v.goalId = null;
  }
};
try { if (typeof window !== 'undefined') window.TMGoals = TMGoals; } catch (_) {}
