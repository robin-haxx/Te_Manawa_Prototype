// ============================================================
// TE MANAWA SECOND SCREEN: THE ENCYCLOPEDIA (DATA)
// ------------------------------------------------------------
// The whole touchscreen renders from this file. Nothing in app.js changes when
// you edit content here. See md/TEMANAWA_SECOND_SCREEN.md §4, §5, §8.
//
//   · Names/scientific names are REAL for the four species shown on the mockup
//     cards (Tōtara, Mānuka, Tī kōuka, Red beech). Everything else is a
//     PLACEHOLDER (`desc: 'TODO …'`, best-guess `fauna: []`) marked to fill.
//   · Plant `key` matches PLANT_TYPES in ../TeManawa_plant_defs.js, so a boost
//     names a species the sim already knows (that key is sent over the bus).
//   · Positions (cx, cy, h) are on the 1920×1080 stage, sprite CENTRED at
//     (cx, cy), rendered `h` px tall. They are my reading of the mockups,
//     tune freely.
//   · sprite/highlight paths are relative to secondscreen/ (so '../sprites/…').
// ============================================================

// ---- FAUNA the plants support (the teaching link on the card) --------------
// Each plant lists fauna KEYS; the card draws every sprite in each fauna's
// `sprites` array (so ['kereru'] with two frames shows two birds, and
// ['huia_male','huia_female'] shows the pair). `key` matches the sim's fauna
// registry (MOA_SPECIES / EAGLE_SPECIES / the flighted-bird lists) so a future
// per-species fauna coupling can read it straight off the boost.
const TM_FAUNA = {
  eyles_harrier: { key: 'eyles_harrier', name: "Eyles' Harrier", sci: 'Circus teauteensis',
    sprites: ['../sprites/EylesHarrier/Flying/EylesHarrier_Flying_00001.png'] },
  kokako: { key: 'kokako', name: 'Kōkako', sci: 'Callaeas wilsoni',
    sprites: ['../sprites/Flighted/Kokako/Flying/Kokako_Flying_00001.png'] },
  kereru: { key: 'kereru', name: 'Kererū', sci: 'Hemiphaga novaeseelandiae',
    sprites: ['../sprites/Flighted/Kereru/Flying/Kereru_Flying_00000.png',
              '../sprites/Flighted/Kereru/Eating/Kereru_Eating_00000.png'] },
  huia_male:   { key: 'huia', name: 'Huia (male)',   sci: 'Heteralocha acutirostris',
    sprites: ['../sprites/Flighted/Huia_Male/Flying/HuiaMale_Flying_00000.png'] },
  huia_female: { key: 'huia', name: 'Huia (female)', sci: 'Heteralocha acutirostris',
    sprites: ['../sprites/Flighted/Huia_Female/Flying/HuiaFemale_Flying_00000.png'] },
  tui: { key: 'tui', name: 'Tūī', sci: 'Prosthemadera novaeseelandiae',
    sprites: ['../sprites/Flighted/Tui/Flying/Tui_Flying_00000.png'] }
};

// A stand-in body-copy block matching the mockups (which are Lorem). Replace per
// species with authored museum copy, see §8. Kept as a constant so the four real
// entries below read cleanly and it's obvious what still needs writing.
const TM_LOREM = "TODO: authored copy pending (mockups show Lorem ipsum). This is where the " +
  "plant's story goes: what it is, where in the Manawatū it grew, and how it fared across the " +
  "glacial cycle.";

// ---- HABITATS --------------------------------------------------------------
// order is TOP → BOTTOM on the physical switch; 'select' is the centre rest
// (the "Select a Habitat" attract screen). See §1.2.
const TM_SCREEN_ORDER = ['forest', 'wetland', 'select', 'lowland', 'alpine'];

// The shared background shown on every screen. A habitat's own `bg` (below) overrides
// it when set: drop e.g. assets/bg_alpine.png in and point that habitat's bg at it.
const TM_BG_DEFAULT = 'assets/Background_Base.png';

const TM_HABITATS = {
  // ============================ FOREST (up ×2) ============================
  forest: {
    title: 'Forest Habitat',
    theme: 'forest',                 // drives the bg tint (see secondscreen.css)
    bg: null,                        // null → shared TM_BG_DEFAULT; set a path for a per-habitat background
    plants: [
      { key: 'Totara', name: 'Tōtara', sci: 'Podocarpus totara',   // ✓ card-confirmed
        desc: "A great podocarp of the lowland–montane forest, slow-growing and long-lived, "
            + "its bright red arils carried by birds. Its dense stands anchor the closed canopy the "
            + "forest cast depends on.",
        fauna: ['eyles_harrier'],
        cx: 250, cy: 600, h: 560 },
      { key: 'nikau', name: 'Nīkau', sci: 'Rhopalostylis sapida',
        desc: TM_LOREM, fauna: [] /* TODO */, cx: 560, cy: 430, h: 340 },
      { key: 'tawa', name: 'Tawa', sci: 'Beilschmiedia tawa',
        desc: TM_LOREM, fauna: [] /* TODO: kererū disperse tawa */, cx: 830, cy: 470, h: 380 },
      { key: 'fern', name: 'Ponga / Tree Fern', sci: 'Cyathea dealbata',
        desc: TM_LOREM, fauna: [] /* TODO */, cx: 830, cy: 830, h: 260 },
      { key: 'beech', name: 'Beech', sci: 'Fuscospora / Lophozonia',
        desc: TM_LOREM, fauna: [] /* TODO */, cx: 540, cy: 800, h: 320 }
    ]
  },

  // ============================ WETLAND (up ×1) ===========================
  wetland: {
    title: 'Wetland Habitat',
    theme: 'wetland',
    bg: null,
    plants: [
      { key: 'cabbagetree', name: 'Tī kōuka', sci: 'Cordyline australis',   // ✓ card-confirmed
        desc: "The cabbage tree of open, wet ground and swamp margins, hardy and frost-tolerant "
            + "but light-demanding. Its dense flower and fruit heads feed many birds.",
        fauna: ['kereru', 'kereru'],   // two kererū, as the card shows
        cx: 560, cy: 380, h: 360 },
      { key: 'kahikatea', name: 'Kahikatea', sci: 'Dacrycarpus dacrydioides',
        desc: TM_LOREM, fauna: [] /* TODO */, cx: 250, cy: 600, h: 560 },
      { key: 'flax', name: 'Harakeke / Flax', sci: 'Phormium tenax',
        desc: TM_LOREM, fauna: [] /* TODO */, cx: 560, cy: 720, h: 240 },
      { key: 'Totara', name: 'Podocarp', sci: 'Podocarpus / Prumnopitys',
        desc: TM_LOREM, fauna: [] /* TODO: confirm which tall tree */, cx: 840, cy: 560, h: 620 },
      { key: 'tussock', name: 'Sedge / Tussock', sci: 'Carex / Chionochloa',
        desc: TM_LOREM, fauna: [] /* TODO */, cx: 560, cy: 900, h: 170 }
    ]
  },

  // ============================ LOWLAND (down ×1) =========================
  lowland: {
    title: 'Lowland Habitat',
    theme: 'lowland',
    bg: null,
    plants: [
      { key: 'manuka', name: 'Mānuka', sci: 'Leptospermum scoparium',   // ✓ card-confirmed
        desc: "A hardy, light-demanding pioneer scrub of open lowland to subalpine ground, "
            + "quick to colonise after disturbance. Its white tea-tree flowers are a nectar source.",
        fauna: ['kokako'],
        cx: 700, cy: 720, h: 380 },
      { key: 'nikau', name: 'Nīkau', sci: 'Rhopalostylis sapida',
        desc: TM_LOREM, fauna: [] /* TODO */, cx: 500, cy: 400, h: 330 },
      { key: 'tussock', name: 'Tussock', sci: 'Chionochloa / Poa',
        desc: TM_LOREM, fauna: [] /* TODO */, cx: 780, cy: 420, h: 170 },
      { key: 'kowhai', name: 'Kōwhai', sci: 'Sophora microphylla',
        desc: TM_LOREM, fauna: [] /* TODO */, cx: 230, cy: 640, h: 380 },
      { key: 'cabbagetree', name: 'Tī kōuka', sci: 'Cordyline australis',
        desc: TM_LOREM, fauna: [] /* TODO */, cx: 460, cy: 780, h: 320 }
    ]
  },

  // ============================ ALPINE (down ×2) ==========================
  alpine: {
    title: 'Alpine Habitat',
    theme: 'alpine',
    bg: null,
    plants: [
      { key: 'beech', name: 'Red beech', sci: 'Nothofagus fusca',   // ✓ card-confirmed
        desc: "A tall southern beech of the montane–subalpine forest, marking the treeline. Its "
            + "mast seed years ripple through the whole forest food web.",
        fauna: ['huia_male', 'huia_female'],   // the huia pair, as the card shows
        cx: 300, cy: 720, h: 460 },
      { key: 'fern', name: 'Tree Fern', sci: 'Cyathea / Dicksonia',
        desc: TM_LOREM, fauna: [] /* TODO */, cx: 250, cy: 380, h: 300 },
      { key: 'tussock', name: 'Tussock', sci: 'Chionochloa',
        desc: TM_LOREM, fauna: [] /* TODO */, cx: 500, cy: 470, h: 170 },
      { key: 'dracophyllum', name: 'Dracophyllum', sci: 'Dracophyllum',
        desc: TM_LOREM, fauna: [] /* TODO */, cx: 760, cy: 420, h: 340 },
      { key: 'coprosma', name: 'Grey Scrub', sci: 'Coprosma / Muehlenbeckia',
        desc: TM_LOREM, fauna: [] /* TODO */, cx: 640, cy: 760, h: 360 }
    ]
  }
};

// Plant "sticker" sprites: the mature form shown in the cluster and on the card.
// Keyed by PLANT_TYPES key. Data-only so app.js stays generic; swap freely.
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
  coprosma:     '../sprites/Shrub/Coprosma_Sprite_00001.png'
};

// Optional per-plant highlight loops (alpha WebM). If a key is present and the
// file exists, app.js swaps the still for the loop while that plant is highlighted
// (§2.3). Absent → the still gets a soft CSS pulse instead. Fill as loops are made.
const TM_PLANT_HIGHLIGHT = {
  // Totara: 'assets/highlight_totara.webm',
};
