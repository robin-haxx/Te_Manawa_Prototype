// ============================================================
// TE MANAWA SECOND SCREEN: THE ENCYCLOPEDIA (DATA)
// ------------------------------------------------------------
// The whole touchscreen renders from this file. Nothing in app.js changes when
// you edit content here. See md/TEMANAWA_SECOND_SCREEN.md §4, §5, §8.
//
//   · The roster and copy follow md/TEMANAWA_ENCYCLOPEDIA_FLORA.md: two WARM
//     (interglacial) habitats above the centre rest, two COLD (glacial) below.
//     Every plant on a warm screen must pass the sim's boost gate in an
//     interglacial, every plant on a cold screen in a glacial (coldTolerance in
//     ../TeManawa_plant_defs.js; tools/bootcheck.js "encyclopedia roster" checks it).
//   · Plant `key` matches PLANT_TYPES in ../TeManawa_plant_defs.js, so a boost
//     names a species the sim already knows (that key is sent over the bus).
//     A plant can sit on two screens with different copy and fauna per card.
//   · Positions (cx, cy, h) are on the 1920×1080 stage, sprite CENTRED at
//     (cx, cy), rendered `h` px tall. Tune freely.
//   · sprite/highlight paths are relative to secondscreen/ (so '../sprites/…').
// ============================================================

// ---- FAUNA the plants support (the teaching link on the card) --------------
// Each plant lists fauna KEYS; the card draws every sprite in each fauna's
// `sprites` array (so ['kereru'] with two frames shows two birds, and
// ['huia_male','huia_female'] shows the pair). `key` is the sim's species key
// (MOA_SPECIES / EAGLE_SPECIES / the flighted-bird lists): the card's list is
// sent with the boost (m.fauna), so the sim recruits and outlines exactly these
// birds. `alsoKeys` adds outline-only sim keys (the juvenile harrier variant).
// `pose` places the bird in the card's scene with its plant: 'canopy' (in the foliage: the flyers)
// or 'ground' (at the plant's foot: the moa guild). Optional `scale` multiplies the pose's
// default height (secondscreen.css .canopy/.ground), for a bird that should dwarf the rest; an
// enlarged ground bird stands BESIDE its plant (app.js BESIDE_*). Optional `side` ('left'|'right')
// fixes which side it stands on (else birds alternate left, right, …); a right-hand bird is mirrored.
// THE BIRD POLICY: ONE BIRD PER PLANT, the one its `fauna` adds to the sim (a plant on two screens
// carries the same bird on both cards; `birdDesc` may still MENTION other relevant birds). FULL
// REPRESENTATION: every founder-cast bird is on at least one plant. NO HOGGING: a bird may sit on
// several plants, but on at most two. tools/bootcheck.js ("encyclopedia roster") enforces it.
const TM_FAUNA = {
  eyles_harrier: { pose: 'canopy', key: 'eyles_harrier', alsoKeys: ['young_eyles_harrier'],
    name: "Eyles' Harrier", sci: 'Circus teauteensis',
    sprites: ['../sprites/EylesHarrier/Flying/EylesHarrier_Flying_00001.png'] },
  kokako: { pose: 'canopy', key: 'kokako', name: 'Kōkako', sci: 'Callaeas wilsoni',
    sprites: ['../sprites/Flighted/Kokako/Flying/Kokako_Flying_00001.png'] },
  kereru: { pose: 'canopy', key: 'kereru', name: 'Kererū', sci: 'Hemiphaga novaeseelandiae',
    sprites: ['../sprites/Flighted/Kereru/Flying/Kereru_Flying_00000.png',
              '../sprites/Flighted/Kereru/Eating/Kereru_Eating_00000.png'] },
  huia_male:   { pose: 'canopy', key: 'huia', name: 'Huia (male)',   sci: 'Heteralocha acutirostris',
    sprites: ['../sprites/Flighted/Huia_Male/Flying/HuiaMale_Flying_00000.png'] },
  huia_female: { pose: 'canopy', key: 'huia', name: 'Huia (female)', sci: 'Heteralocha acutirostris',
    sprites: ['../sprites/Flighted/Huia_Female/Flying/HuiaFemale_Flying_00000.png'] },
  tui: { pose: 'canopy', key: 'tui', name: 'Tūī', sci: 'Prosthemadera novaeseelandiae',
    sprites: ['../sprites/Flighted/Tui/Flying/Tui_Flying_00000.png'] },
  kiwi: { pose: 'ground', key: 'north_island_brown_kiwi', name: 'North Island Brown Kiwi', sci: 'Apteryx mantelli',
    sprites: ['../sprites/Moa/Kiwi/Walking/Kiwi_Walking_00000.png'] },
  giant_goose: { pose: 'ground', key: 'giant_goose', name: 'North Island Goose', sci: 'Cnemiornis gracilis',
    sprites: ['../sprites/Moa/Goose/Walking/NorthGoose_Walking_00000.png'] },
  finschs_duck: { pose: 'ground', key: 'finschs_duck', name: "Finsch's Duck", sci: 'Chenonetta finschi',
    sprites: ['../sprites/Moa/FinschsDuck/Walking/FinschsDuck_Walking_00000.png'] },
  takahe: { pose: 'ground', key: 'north_island_takahe', name: 'Mōho (NI Takahē)', sci: 'Porphyrio mantelli',
    sprites: ['../sprites/Moa/Takahe/Walking/Takahe_Walking_00000.png'] },
  // The four North Island moa on the three moa sprites (species_data spriteSet): giant (Dinornis),
  // bush (Anomalopteryx), and the Pachyornis art shared by Mantell's moa and its stocky emeid
  // relative the stout-legged moa. No South Island moa: upland and heavy-footed are not in the cast.
  north_island_giant_moa: { pose: 'ground', scale: 3, side: 'right', key: 'north_island_giant_moa', name: 'North Island Giant Moa', sci: 'Dinornis novaezealandiae',
    sprites: ['../sprites/Moa/GiantMoa/Walking/NorthMoa_Walking_00000.png'] },
  little_bush_moa: { pose: 'ground', key: 'little_bush_moa', name: 'Little Bush Moa', sci: 'Anomalopteryx didiformis',
    sprites: ['../sprites/Moa/BushMoa/Walking/BushMoa_Walking_00000.png'] },
  mantells_moa: { pose: 'ground', key: 'mantells_moa', name: "Mantell's Moa", sci: 'Pachyornis geranoides',
    sprites: ['../sprites/Moa/CoastalMoa/Walking/CoastalMoa_Walking_00000.png'] },
  stout_legged_moa: { pose: 'ground', key: 'stout_legged_moa', name: 'Stout-legged Moa', sci: 'Euryapteryx curtus',
    sprites: ['../sprites/Moa/CoastalMoa/Walking/CoastalMoa_Walking_00000.png'] }
};

// ---- HABITATS --------------------------------------------------------------
// Order is TOP → BOTTOM on the physical switch; 'select' is the centre rest
// (the "Select a Habitat" attract screen). See §1.2. Warm habitats above the
// rest, cold below; FOREST and ALPINE sit next to the centre, one detent away,
// with WETLAND and LOWLAND at the far ends.
const TM_SCREEN_ORDER = ['wetland', 'forest', 'select', 'alpine', 'lowland'];

// The shared background shown on every screen. A habitat's own `bg` (below) overrides
// it when set: drop e.g. assets/bg_alpine.png in and point that habitat's bg at it.
const TM_BG_DEFAULT = 'assets/Background_Base.png';

// `era` is the climate the habitat belongs to ('interglacial' | 'glacial'): data for the
// harness gate check (and any future era label), not rendered today.
const TM_HABITATS = {
  // ======================= WETLAND (up ×2) · interglacial =======================
  // The Moutoa zonation: pūrei in open water → raupō → harakeke → swamp scrub of tī kōuka →
  // kahikatea forest, with tōtara on the levée (Esler p. 59).
  wetland: {
    title: 'Wetland Habitat',
    theme: 'wetland',
    era: 'interglacial',
    bg: null,
    plants: [
      { key: 'cabbagetree', name: 'Tī kōuka', sci: 'Cordyline australis',   // ✓ mockup card (its kererū link moved to tawa)
        desc: [
          "The cabbage tree can regrow from its base if it's damaged!",
          "Tī kōuka loves wet ground, but it's hardy enough to survive glacial climates."
        ],
        birdDesc: [
          "Finsch's duck was a land duck about the size of a mallard, with thick legs for walking and small wings. Unlike most ducks it lived on land, grazing the drier ground around the swamps, and it was slowly losing the power to fly.",
          "Tī kōuka stands on the damp, open ground at the swamp's edge, just the kind of country Finsch's duck grazed. When the ice ages opened up the forest into grassland, there was more of it to roam."
        ],
        sceneScale: 1.16, birdScale: 1.45, fauna: ['finschs_duck'],
        cx: 495, cy: 380, h: 317 },
      { key: 'kahikatea', name: 'Kahikatea', sci: 'Dacrycarpus dacrydioides',
        desc: [
          "Kahikatea is New Zealand's tallest tree, growing up to 60 metres! Long stands of kahikatea lined the ancient wetlands along the Manawatū River.",
          "You might see kahikatea die and grow back as the river shifts: its seedlings need fresh, wet silt at the water's edge. At Round Bush near Foxton, people crossed the flooded forest by stepping along its raised roots. Birds eat its red berries and spread the seeds.",
          "Kahikatea wood was used to make butter boxes, and since the wetlands were drained, almost all of it is gone."
        ],
        birdDesc: [
          "Bush moa lived in thick forest. Over many generations they evolved a strong beak for snipping twigs and leaves. They ate lots of fern fronds, and may have helped spread fern spores through the forest!",
          "Bush moa browsed the young plants of the swamp forest floor. Their nibbling trimmed seedlings back but rarely killed them: the forest and the moa lived together for millions of years."
        ],
        crop: 'bottom', sceneShift: -60, fauna: ['little_bush_moa'],
        // a bush moa browsing the seedlings at its foot
        birdStage: [
          { fauna: 'little_bush_moa', sprite: '../sprites/Moa/BushMoa/Eating/BushMoa_Eating_00005.png', h: 110, left: '-34%', bottom: '-6%' }
        ], cx: 250, cy: 600, h: 493 },
      { key: 'flax', name: 'Harakeke', sci: 'Phormium tenax',
        desc: [
          "Harakeke grows to about 3 metres tall, and its flower stalks can reach 5 metres – taller than a ceiling! Tūī carry pollen between its flowers as they drink the nectar.",
          "Harakeke was actually less common in ancient times. It spread through the Manawatū after the swamps were drained and the rivers stopbanked, and it fed a huge flax-milling industry. The Moutoa swamp plant survey was carried out to help manage the flax crop."
        ],
        birdDesc: [
          "Mantell's moa was a stocky moa of lowland swamps and dunes, with a strong bill suited to tough, fibrous plants like harakeke."
        ],
        fauna: ['mantells_moa'],
        // Mantell's moa tugging at the tough leaves
        birdStage: [
          { fauna: 'mantells_moa', sprite: '../sprites/Moa/CoastalMoa/Eating/CoastalMoa_Eating_00001.png', h: 135, left: '-38%', bottom: '-5%' }
        ], cx: 510, cy: 700, h: 211 },
      { key: 'Totara', name: 'Tōtara', sci: 'Podocarpus totara',
        desc: [
          "Tōtara is a massive podocarp tree that can live for around 1,000 years!",
          "Tōtara forest grew right up to the edge of the wetlands. Where the water rose, the trees died, but their wood is so tough that the dead stumps didn't rot away. They still lie buried in the peat thousands of years later.",
          // CONFIRM with Rangitāne o Manawatū before it goes on the wall (md/TEMANAWA_GOALS.md §3).
          "In Rangitāne tradition, the Manawatū Gorge, Te Āpiti, was formed by Ōkatia, a spirit who took the form of a giant tōtara tree and forced his way through the ranges to reach the sea."
        ],
        birdDesc: [
          "Eyles' harrier was a giant bird of prey, the biggest harrier that ever lived. The North Island had no Haast's eagle, so here the harrier was the top predator.",
          "It wasn't as huge as the pouakai (Haast's eagle), but it was big enough to hunt kererū, kōkako, kākā and ducks, and the biggest North Island harriers may even have caught some of the smaller moa! It is now extinct, and the kāhu (swamp harrier) fills part of its place today.",
          "Kererū were its favourite prey. When kererū and kōkako thrived on the forest's fruit, the harrier had more to eat too."
        ],
        crop: 'top', sceneShift: -70, birdScale: 1.45, fauna: ['eyles_harrier'],
        // the harrier swooping low over the crown, wings out
        birdStage: [
          { fauna: 'eyles_harrier', sprite: '../sprites/EylesHarrier/Flying/EylesHarrier_Flying_00001.png', h: 200, left: '24%', top: '-17%' }
        ], cx: 795, cy: 560, h: 546 },
      { key: 'sedge', name: 'Pūrei', sci: 'Carex secta',
        desc: "Pūrei stands in open water on a trunk-like pedestal of its own old roots, the first "
            + "plant at the swamp's deep edge. After a big eruption, ash-silted swamp margins "
            + "widen and sedges spread.",
        birdDesc: [
          "The mōho was the North Island's takahē, a big flightless rail that grazed grass and swamp plants. It is extinct; its South Island cousin, the takahē, survives.",
          "Mōho grazed the soft, juicy bases of swamp plants and grasses, much as takahē pull up the shoots of tussock and sedge today."
        ],
        sceneShift: -80, fauna: ['takahe'],
        // a mōho pulling at the soft sedge bases
        birdStage: [
          { fauna: 'takahe', sprite: '../sprites/Moa/Takahe/Eating/Takahe_Eating_00005.png', h: 240, left: '62%', bottom: '-12%', flip: true }
        ], cx: 525, cy: 920, h: 150 }
    ]
  },

  // ======================= FOREST (up ×1) · interglacial ========================
  forest: {
    title: 'Forest Habitat',
    theme: 'forest',                 // drives the bg tint (see secondscreen.css)
    era: 'interglacial',
    bg: null,                        // null → shared TM_BG_DEFAULT; set a path for a per-habitat background
    plants: [
      { key: 'Totara', name: 'Tōtara', sci: 'Podocarpus totara',   // ✓ card-confirmed
        desc: [
          "Tōtara is a massive podocarp tree that can live for around 1,000 years!",
          "Tōtara forest grew right up to the edge of the wetlands. Where the water rose, the trees died, but their wood is so tough that the dead stumps didn't rot away. They still lie buried in the peat thousands of years later.",
          // CONFIRM with Rangitāne o Manawatū before it goes on the wall (md/TEMANAWA_GOALS.md §3).
          "In Rangitāne tradition, the Manawatū Gorge, Te Āpiti, was formed by Ōkatia, a spirit who took the form of a giant tōtara tree and forced his way through the ranges to reach the sea."
        ],
        birdDesc: [
          "Eyles' harrier was a giant bird of prey, the biggest harrier that ever lived. The North Island had no Haast's eagle, so here the harrier was the top predator.",
          "It wasn't as huge as the pouakai (Haast's eagle), but it was big enough to hunt kererū, kōkako, kākā and ducks, and the biggest North Island harriers may even have caught some of the smaller moa! It is now extinct, and the kāhu (swamp harrier) fills part of its place today.",
          "Kererū were its favourite prey. When kererū and kōkako thrived on the forest's fruit, the harrier had more to eat too."
        ],
        crop: 'top', sceneShift: -70, birdScale: 1.45, fauna: ['eyles_harrier'],
        // the harrier swooping low over the crown, wings out
        birdStage: [
          { fauna: 'eyles_harrier', sprite: '../sprites/EylesHarrier/Flying/EylesHarrier_Flying_00001.png', h: 200, left: '24%', top: '-17%' }
        ],
        cx: 240, cy: 600, h: 493 },
      { key: 'nikau', name: 'Nīkau', sci: 'Rhopalostylis sapida',
        desc: [
          "Nīkau is the world's southernmost palm! It can grow in Aotearoa because it's tougher in the cold than other palms, but it still can't survive hard frost, so it retreated in the ice ages.",
          "It grows in the Manawatū's lowland forest, and in ancient times at the edges of wetlands. Its red berries feed forest birds."
        ],
        birdDesc: [
          "Kōkako filled the forest with song in the warm interglacials, eating many kinds of forest fruit and leaves.",
          "As kōkako feed on nīkau's red berries, they carry some of the seeds away and help plant new forest.",
        ],
        crop: 'top', birdScale: 1.45, fauna: ['kokako'],
        // a kōkako reaching for the red berries under the fronds
        birdStage: [
          { fauna: 'kokako', sprite: '../sprites/Flighted/Kokako/Eating/Kokako_Eating_00004.png', h: 180, left: '-20%', top: '23%' }
        ], cx: 560, cy: 430, h: 299 },
      { key: 'tawa', name: 'Tawa', sci: 'Beilschmiedia tawa',
        desc: [
          "Tawa forms the thick middle layer of the podocarp forest, under tall trees like tōtara, rimu and kahikatea. Its canopy can be so dense that young nīkau underneath struggle for light.",
          "But how much tawa grew in the ancient Manawatū is a mystery: its pollen doesn't preserve, and scientists need pollen to reconstruct the forests of the past."
        ],
        birdDesc: [
          "Tawa has the biggest seeds of any plant here, and it needs kererū: today they're the only bird big enough to swallow and spread them!",
          "Moa didn't spread tawa, because the stones they swallowed (gastroliths) ground up seeds in their gizzards. So kererū don't just sit around eating – they're working hard to plant the forest!"
        ],
        crop: 'top', cropKeep: 0.72, fauna: ['kereru'],
        // two kererū in the canopy: one swallowing fruit, one flying in
        birdStage: [
          { fauna: 'kereru', sprite: '../sprites/Flighted/Kereru/Eating/Kereru_Eating_00003.png', h: 170, right: '-16%', top: '6%', flip: true },
          { fauna: 'kereru', sprite: '../sprites/Flighted/Kereru/Flying/Kereru_Flying_00007.png', h: 170, left: '-46%', top: '-14%', rotate: 6 }
        ], cx: 830, cy: 470, h: 334 },
      { key: 'fern', name: 'Mamaku & Ponga', sci: 'Cyathea medullaris, C. dealbata',
        desc: [
          "Mamaku is Aotearoa's tallest tree fern, growing up to 20 metres tall! Ponga's fronds are green on top and brilliant silver underneath.",
          "Tree ferns need a warm climate: in the ice ages, the amount of tree-fern pollen fell by about 90%. Good thing they grow back fast – the botanist Alan Esler saw thick stands of mamaku grow up in about 50 years."
        ],
        birdDesc: [
          "Kiwi love ferns, because a ferny forest floor is damp and sheltered, full of bugs and rich soil – perfect for probing with their long beaks at night! All that probing turns over the soil and mixes in fallen leaves, keeping the forest floor rich."
        ],
        birdScale: 1.45, fauna: ['kiwi'], cx: 830, cy: 830, h: 229 },
      { key: 'kowhai', name: 'Kōwhai', sci: 'Sophora microphylla, S. godleyi',
        desc: [
          "There are eight kinds of kōwhai in Aotearoa, and their seeds float: kōwhai's ancestors reached these islands across the ocean!",
          "Though it's a small tree, kōwhai lived through the ice ages! DNA shows that even in glacial times, it persisted across much of the country."
        ],
        birdDesc: [
          "Tūī love the nectar of kōwhai's yellow flowers, an important food for many native birds in early spring. As they feed, they carry pollen from flower to flower.",
          "Can you count how many colours are in a tūī's feathers?"
        ],
        crop: 'top', birdScale: 1.45, fauna: ['tui'],
        // a tūī feeding in the flowers
        birdStage: [
          { fauna: 'tui', sprite: '../sprites/Flighted/Tui/Eating/Tui_Eating_00003.png', h: 180, right: '-14%', top: '-2%', flip: true }
        ], cx: 550, cy: 800, h: 282 }
    ]
  },

  // ======================= ALPINE (down ×1) · glacial ===========================
  // The plants of the Ruahine and Tararua ranges. With treeline ~800 m lower, the range tops were
  // treeless and their subalpine scrub and tussock came down the flanks; beech held the sheltered pockets.
  alpine: {
    title: 'Alpine Habitat',
    theme: 'alpine',
    era: 'glacial',
    bg: null,
    plants: [
      // Mountain beech, not black beech (2026-10-15): black beech is the lowland Aokautere patch; the
      // beech of the ranges is mountain beech (Ruahine treeline; Tararua has silver beech instead).
      // LGM "Fuscospora-type" pollen can't separate the two, so the ice-age claim holds for either.
      { key: 'beech', name: 'Mountain Beech', sci: 'Fuscospora cliffortioides',
        desc: [
          "There are five Beech species in Aotearoa, and Mountain beech claims the high country. In the Ruahine Range it climbs right up to the \"treeline,\" where forest ends and tussock-land begins.",
          "In glacial times, beech filled forests. Cold pushed whole forests downhill, but Beech held in harsh soil while other trees died away.",
          "Today, beech is rare on the Manawatū lowlands. Its close cousin, black beech, grows in just one patch at Aokautere.",
          "Beech has 'mast' years, when every tree floods the forest with seed at once!",
        ],
        birdDesc: [
          "A ghost of the forest, the huia was found only in the North Island, and the Ruahine and Tararua ranges, at the edge of the Manawatū, were among its last homes. It is now extinct: the last confirmed Huia sighting was in 1907.",
          "Male and female huia had completely different beaks: his was short and strong, hers long and curved. They hunted huhu grubs, fat beetle larvae that live in rotting wood. The male probably chiselled into the wood while the female probed deep into the tunnels, and pairs foraged side by side.",
        ],
        crop: 'top', fauna: ['huia_male', 'huia_female'],   // the huia pair, as the card shows
        // the huia pair working the branches for grubs
        birdStage: [
          { fauna: 'huia_male', sprite: '../sprites/Flighted/Huia_Male/Eating/HuiaMale_Eating_00004.png', h: 160, left: '-8%', top: '40%' },
          { fauna: 'huia_female', sprite: '../sprites/Flighted/Huia_Female/Eating/HuiaFemale_Eating_00004.png', h: 160, right: '-6%', top: '16%', flip: true }
        ],
        cx: 275, cy: 725, h: 405 },
      { key: 'wharariki', name: 'Wharariki', sci: 'Phormium cookianum',
        desc: [
          "Mountain flax is the smaller, drooping cousin of harakeke, at home on the cold, windswept tops of the Tararua and Ruahine ranges.",
          "On Aruwaru, a summit of the northern Tararua, it moves in where old leatherwood dies, and it crosses with harakeke where the two meet.",
          "Its yellow-green flowers are full of nectar, and birds carry their pollen from plant to plant. Its seeds blow away on the wind."
        ],
        birdDesc: [
          "Tūī follow the flowers, even up into the mountains. They drink wharariki's nectar and carry its pollen from plant to plant, and bellbirds join them at the feast.",
          "Tūī have two voice boxes, so they can sing two notes at once!"
        ],
        sceneScale: 1.15, fauna: ['tui'],
        // a tūī drinking at the flowers while a second flies in
        birdStage: [
          { fauna: 'tui', sprite: '../sprites/Flighted/Tui/Eating/Tui_Eating_00003.png', h: 180, left: '26%', top: '13%', flip: true, rotate: -10 },
          { fauna: 'tui', sprite: '../sprites/Flighted/Tui/Flying/Tui_Flying_00011.png', h: 165, left: '-78%', top: '-20%', rotate: 8 }
        ], cx: 250, cy: 375, h: 229 },
      { key: 'tussock', name: 'Snow Tussock', sci: 'Chionochloa',
        desc: [
          "The grass of the high tops. In the ice ages, tussock grassland ran from the coast to the summits.",
            "Alpine country itself is young: permanent for only a million years. Can you see the ranges forming when time is boosted forward?",
            "Tussock regrows from its base after it's grazed or burned, sending up fresh, nutritious shoots."
                  ],
        birdDesc: [
          "The North Island goose was a big, heavy goose that couldn't fly. It grazed on grass and herbs in the open country and forest edge.",
          "It was rare in warm times, since forest covered most of the land. In the ice ages, when tussock spread from the coast to the mountaintops, the goose spread with it.",
        ],
        fauna: ['giant_goose'],
        // a goose grazing into the tussock, its mate on watch behind
        birdStage: [
          { fauna: 'giant_goose', sprite: '../sprites/Moa/Goose/Eating/NorthGoose_Eating_00005.png', h: 230, left: '-62%', bottom: '-16%' },
          { fauna: 'giant_goose', sprite: '../sprites/Moa/Goose/Looking/NorthGoose_Looking_00004.png', h: 190, right: '-52%', bottom: '14%', flip: true, behind: true }
        ], cx: 515, cy: 470, h: 150 },
      // Shares the giant moa with Subalpine Scrub (the one shared bird; tools/bootcheck.js allows this
      // pair). No moa diet record names Dracophyllum, so the copy says so rather than claiming it.
      { key: 'dracophyllum', name: 'Dracophyllum', sci: 'Dracophyllum filifolium',
        desc: [
          "Aotearoa has more kinds of Dracophyllum than anywhere else in the world! Most of them appeared in the last few million years, as the mountains rose and the ice ages began.",
          "Stiff, needle-leaved and wind-proof, it rides out storms that can blow down tall trees. It could only make a home here once the Ruahine and Tararua ranges rose high enough to have cold, windswept tops.",
          "In glacial times, the Manawatū may have looked like Campbell Island today, where Dracophyllum is the main woody plant. As the cold pushed the treeline down, scrub like this spread down the slopes.",
          "This species was named from plants that William Colenso collected in the Ruahine Range. Today it grows in the leatherwood scrub of the Tararua tops, even on Aruwaru."
        ],
        birdDesc: [
          "The North Island giant moa roamed all the way from the coast up to the mountaintops, into the herbfields and grasslands above the trees.",
          "Did giant moa eat Dracophyllum's stiff, needle-like leaves? Nobody knows for sure! Scientists find out what moa ate by studying their fossil droppings and the food left in their gizzards."
        ],
        fauna: ['north_island_giant_moa'],
        sceneShift: -100,   // slide the plant left to make room for the moa
        // a giant moa browsing the stiff leaves
        birdStage: [
          { fauna: 'north_island_giant_moa', sprite: '../sprites/Moa/GiantMoa/Eating/NorthMoa_Eating_00009.png', h: 300, left: '30%', bottom: '-8%', flip: true }
        ], cx: 760, cy: 420, h: 299 },
      { key: 'coprosma', name: 'Subalpine Scrub', sci: 'Olearia colensoi, Coprosma',
        desc: [
          "At the \"bushline,\" tough shrubs take over from trees: leatherwood, coprosma and many others grow together in a dense thicket.",
          "The southern Ruahine has the biggest unbroken stretch of leatherwood scrub in New Zealand. It's so thick that trampers once had to crawl underneath it, or walk across the top!",
          "Downhill, scrub plants \"pioneer\" the forest's regrowth after a super-volcanic eruption: that tangled pōhuehue scrambles over the bare, broken ground, and coprosma follows, creating better ground for the forest to regenerate..."
        ],
        birdDesc: [
          "The giant moa browsed on coprosma, even up in the rising ranges!",
          "The North Island giant moa was one of the tallest birds that ever lived. The females were far bigger than the males: about one and a half times as tall, and nearly three times as heavy!",
          "Giant moa browsed leaves, twigs and fruit, and could reach branches three metres up. They lived everywhere from the coast to the mountaintops, and there were more of them in patchy, shrubby country than in thick forest.",
        ],
        fauna: ['north_island_giant_moa'], cx: 650, cy: 760, h: 317 }
    ]
  },

  // ======================= LOWLAND (down ×2) · glacial ==========================
  // The glacial flats: an open shrub–grassland mosaic (~41% grass pollen at the LGM).
  lowland: {
    title: 'Lowland Habitat',
    theme: 'lowland',
    era: 'glacial',
    bg: null,
    plants: [
      { key: 'manuka', name: 'Mānuka', sci: 'Leptospermum scoparium',   // ✓ mockup card (its kōkako link moved to nīkau)
        desc: "The tough pioneer of poor ground, holding the dry sand plains and leached terraces. "
            + "The stout-legged moa browsed this open, dry scrub. New Zealand mānuka has evolved "
            + "apart from Australia's for about ten million years.",
        birdDesc: [
          "The stout-legged moa was short and heavy, with thick, powerful legs. It lived in the drier, more open lowlands and along the coast, eating leaves and fruit.",
          "Stout-legged moa came in very different sizes, and the biggest lived in the south of the North Island, around places like the Manawatū!"
        ],
        crop: 'bottom', fauna: ['stout_legged_moa'],
        // a stout-legged moa browsing under the scrub
        birdStage: [
          { fauna: 'stout_legged_moa', sprite: '../sprites/Moa/CoastalMoa/Eating/CoastalMoa_Eating_00005.png', h: 190, left: '-30%', bottom: '-10%' }
        ],
        cx: 795, cy: 725, h: 334 },
      { key: 'coprosma', name: 'Grey Scrub', sci: 'Coprosma, Muehlenbeckia',
        desc: [
          "Many native shrub plants have tiny leaves, on branches that grow out wide to form a criss-crossed net. Did they grow that way to fend off the moa, or to survive ice-age frost and wind? Scientists still argue.",
          "Scrub plants \"pioneer\" the forest's regrowth after a super-volcanic eruption: that tangled pōhuehue scrambles over the bare, broken ground, and coprosma follows, creating better ground for the forest to regenerate.."
        ],
        birdDesc: [
          "The North Island giant moa was one of the tallest birds that ever lived. The females were far bigger than the males: about one and a half times as tall, and nearly three times as heavy!",
          "Giant moa browsed leaves, twigs and fruit, and could reach branches three metres up. They lived everywhere from the coast to the mountaintops, and there were more of them in patchy, shrubby country than in thick forest.",
          "Look at those tangled branches: could a moa get its beak in there?"
        ],
        fauna: ['north_island_giant_moa'], cx: 495, cy: 350, h: 264 },
      { key: 'tussock', name: 'Tussock', sci: 'Poa, Festuca, Rytidosperma',
        desc: "In the glacial ice ages, grass covered the open plains. "
                   +"Much of the Manawatū lowland was cold, windswept flats, which grew as it became colder. "
                   +"The North Island Giant Goose ventured far inland, thriving among tussock country!",
        birdDesc: [
          "The North Island goose was a big, heavy goose that couldn't fly. It walked the open country and forest edges, grazing grass and herbs.",
          "It was never common, because in warm times forest covered most of the land. In the ice ages, when tussock spread across the plains, the goose spread with it.",
          "Tussock regrows from its base after it's grazed or burned, sending up fresh, tender shoots, the best food in open country for a grazing bird."
        ],
        birdScale: 1.6, fauna: ['giant_goose'], cx: 785, cy: 420, h: 150 },
      { key: 'kowhai', name: 'Kōwhai', sci: 'Sophora microphylla, S. godleyi',
        desc: [
          "There are eight kinds of kōwhai in Aotearoa, and their seeds float: kōwhai's ancestors reached these islands across the ocean!",
          "Though it's a small tree, kōwhai lived through the ice ages! DNA shows that even in glacial times, it persisted across much of the country."
        ],
        birdDesc: [
          "Tūī love the nectar of kōwhai's yellow flowers, an important food for many native birds in early spring. As they feed, they carry pollen from flower to flower.",
          "Can you count how many colours are in a tūī's feathers?"
        ],
        crop: 'top', birdScale: 1.45, fauna: ['tui'],
        // a tūī feeding in the flowers
        birdStage: [
          { fauna: 'tui', sprite: '../sprites/Flighted/Tui/Eating/Tui_Eating_00003.png', h: 180, right: '-14%', top: '-2%', flip: true }
        ], cx: 230, cy: 685, h: 334 },
      { key: 'cabbagetree', name: 'Tī kōuka', sci: 'Cordyline australis',
        desc: [
          "The cabbage tree can regrow from its base if it's damaged!",
          "Tī kōuka loves wet ground, but it's hardy enough to survive glacial climates."
        ],
        birdDesc: [
          "Finsch's duck was a land duck about the size of a mallard, with thick legs for walking and small wings. It grazed the open plains, grassland and scrub, and it was slowly losing the power to fly.",
          "Tī kōuka grows scattered across damp, open flats, the open country Finsch's duck needed. When the ice ages turned the plains to grassland, there was more room for them."
        ],
        sceneScale: 1.16, birdScale: 1.45, fauna: ['finschs_duck'], cx: 515, cy: 780, h: 282 }
    ]
  }
};

// Plant "sticker" sprites: the mature form shown in the cluster and on the card.
// Keyed by PLANT_TYPES key. Data-only so app.js stays generic; swap freely.
// sedge/wharariki share tussock/flax art in the sim too (PLANT_SPRITE_ALIASES in ../TeManawa_sketch.js).
const TM_PLANT_SPRITE = {
  Totara:       '../sprites/Totara/Totara_Mature.png',
  nikau:        '../sprites/Nikau/Nikau_Size_02.png',
  tawa:         '../sprites/Tawa/Tawa_Sprite_00001.png',
  fern:         '../sprites/TreeFern/TreeFern_Sprite_00001.png',
  beech:        '../sprites/Beech/Beech_Sprite_00001.png',
  cabbagetree:  '../sprites/CabbageTree/CabbageTree_Sprite_00001.png',
  kahikatea:    '../sprites/Kahikatea/Kahikatea_Size_02.png',
  flax:         '../sprites/Flax/Flax_Mature.png',
  tussock:      '../sprites/Tussock/Tussocks_Sprite_00001.png',
  manuka:       '../sprites/Manuka/Manuka_Sprite_00003.png',
  kowhai:       '../sprites/Kowhai/Kowhai_Size_02.png',
  dracophyllum: '../sprites/Dracophyllum/Dracophyllum_Sprite_00001.png',
  coprosma:     '../sprites/Shrub/Coprosma_Sprite_00001.png',
  sedge:        '../sprites/Tussock/Tussocks_Sprite_00004.png',
  wharariki:    '../sprites/Flax/Flax_Size_01.png'
};

// Optional per-plant highlight loops (alpha WebM). If a key is present and the
// file exists, app.js swaps the still for the loop while that plant is highlighted
// (§2.3). Absent → the still gets a soft CSS pulse instead. Fill as loops are made.
const TM_PLANT_HIGHLIGHT = {
  // Totara: 'assets/highlight_totara.webm',
};
