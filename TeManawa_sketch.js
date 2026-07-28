// lets goooo

// Fonts. These were implicit globals (assigned in preload() with no
// declaration), which works only in sloppy mode and breaks the moment anything
// here is loaded as a module. Declared properly so the HUD and UI can rely on them.
let OpenDyslexic = null;
let GroceryRounded = null;

let plantSprites = {};
// Delta time management
let lastFrameTime = 0;
let deltaTime = 16.667;
let deltaMultiplier = 1.0;
const TARGET_FRAME_TIME = 16.667;

// FPS tracking
let fpsHistory = [];
const FPS_HISTORY_SIZE = 30;
let currentFPS = 60;

// ============================================
// PLANT SPRITE SETS
// ============================================
// Maps an ecology key (the string used everywhere in the sim) to the artwork
// that represents it. Keeping the two separate means art can be swapped for
// prototyping without touching species data, level scaffolds or seasons.
//
//   prefix        filename stem, e.g. 'Totara' -> Totara_Mature.png
//   folder        optional subfolder under sprites/ (include trailing slash)
//   growingFrames if set, loads <prefix>_Growing_01..NN.png as a growth sequence
//   anchor        'center' (default) or 'base' — 'base' plants the sprite's
//                 bottom edge on the ground point, for art taller than it is wide
//   scale         multiplier on the drawn footprint width
const PLANT_SPRITE_SETS = {
  tussock:   { prefix: 'Tussock' },
  flax:      { prefix: 'Flax' },
  fern:      { prefix: 'Fern' },
  // PROTOTYPE: rimu renders with Tōtara art. Art swap only — the 'rimu' key
  // still drives nutrition, seasonality, forest banding and level data.
  rimu:      { prefix: 'Totara', folder: 'Totara/', growingFrames: 4,
               anchor: 'base', scale: 1.0 },
  beech:     { prefix: 'Beech' }
};

const PLANT_SPRITE_STATES = ['Mature', 'Thriving', 'Wilting', 'Dormant'];

function preload(){
  OpenDyslexic = loadFont('typefaces/OpenDyslexic.ttf');
  GroceryRounded = loadFont('typefaces/GroceryRounded.ttf');

  for (const [key, def] of Object.entries(PLANT_SPRITE_SETS)) {
    const dir = `sprites/${def.folder || ''}`;
    const set = {};

    for (const state of PLANT_SPRITE_STATES) {
      set[state.toLowerCase()] = loadImage(`${dir}${def.prefix}_${state}.png`);
    }

    if (def.growingFrames) {
      set.growing = [];
      for (let i = 1; i <= def.growingFrames; i++) {
        const n = String(i).padStart(2, '0');
        set.growing.push(loadImage(
          `${dir}${def.prefix}_Growing_${n}.png`,
          () => {},
          () => console.warn(`Could not load ${def.prefix}_Growing_${n}.png`)
        ));
      }
    }

    set.meta = { anchor: def.anchor || 'center', scale: def.scale || 1.0 };
    plantSprites[key] = set;
  }

  loadPlaceableSprites();
  loadEntitySprites();
  preloadAudio();
}

// ============================================
// CONFIGURATION
// ============================================
// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
  // ===== ENGINE CONSTANTS (never change between levels) =====
  version: 'alpha 1.0.7 (TEST_BUILD_2_dev)',

  // Reference height is always 1080; width is computed from window aspect ratio
  referenceHeight: 1080,

  // Canvas dimensions (set by recalculateLayout, defaults to 16:9)
  canvasWidth: 1920,
  canvasHeight: 1080,

  // Game area (set by recalculateLayout)
  gameAreaX: 0,
  gameAreaY: 180,
  gameAreaWidth: 1360,
  gameAreaHeight: 760,

  // Panel heights (fixed)
  topBarHeight: 180,
  bottomBarHeight: 140,

  // Sidebar (set by recalculateLayout)
  rightSidebarWidth: 560,
  rightSidebarX: 1360,

  // Sidebar sizing constraints
  minSidebarWidth: 400,
  maxSidebarWidth: 600,
  sidebarWidthRatio: 0.2917,   // ≈560/1920, the 16:9 baseline proportion

  // Supported aspect ratio range
  minAspectRatio: 4 / 3,       // 1.333  (e.g. 1440×1080)
  maxAspectRatio: 21 / 9,      // 2.333  (e.g. 2520×1080)

  // Convenience getters (used throughout simulation code)
  get width() { return this.gameAreaWidth; },
  get height() { return this.gameAreaHeight; },

  pixelScale: 1,
  zoom: 2.5,
  debugMode: false,

  // ===== SQUARE PLAY AREA (Phase 1.5) =====
  // The terrain grid is now a fixed square instead of being derived from the
  // window aspect. This is the single most expensive number in the project: the
  // terrain bake is one pixel per cell, and Phase 4's four ecology fields are one
  // float per cell each.
  //
  // 512 is chosen to preserve the existing plant/moa density tuning (the old
  // portrait map was ~432x768 = 332k cells; 512^2 = 262k). TEMANAWA_BUILD_V3.md
  // §5.2 sets the long-term limit at 256 — drop to 256 in Phase 3, when the
  // interval re-bake lands, and retune plantDensity and spawn counts at the same
  // time. Until then there is no per-interval bake, so 512 costs nothing per frame.
  mapGrid: 512,

  // ===== VIEW TRANSFORM =====
  // The transform the world actually renders through. Normal mode mirrors
  // gameAreaX/Y + zoom; fullscreen mode scales the map to fill the canvas.
  // Written by Game._updateViewTransform() — read, never set, elsewhere.
  fullscreen: true,   // the installation has no windowed mode
  viewX: 0,
  viewY: 180,
  viewZoom: 2.5,

  col_UI: [40, 70, 30, 180],
  col_panelBg: [25, 35, 30, 240],
  col_panelBorder: [60, 90, 70],
  col_panelHeader: [45, 75, 55],

  showContours: true,
  contourInterval: 0.045,
  showLabels: false,
  showDebug: false,
  // The whole per-entity UI layer: hunger and breeding bars, heart and
  // pregnancy indicators, low-population rings, state glyphs, egg progress.
  // OFF by default — it is the strongest "this is a video game" signal on
  // screen and it distracts from the diorama. Breeding is meant to be read as
  // behaviour (two moa together, then an egg on the ground), not as a floating
  // heart. Debug.applyVisibility() turns it on with the debug overlay.
  //
  // Named showEntityUI rather than showHungerBars because bars were only ever
  // part of what it gates — the hearts, rings and glyphs were not gated at all
  // and stayed on screen permanently.
  showEntityUI: false,

  // ===== LEVEL-VARIABLE PARAMS (written by loadLevel) =====
  noiseScale: 0.005,
  octaves: 3,
  persistence: 0.3,
  lacunarity: 3.0,
  ridgeInfluence: 1.3,
  elevationPower: 1.5,
  islandFalloff: 0.6,
  plantDensity: 0.006,

  initialMoaCount: 7,
  maxMoaPopulation: 60,
  eagleCount: 2,
  startingSpecies: 'upland_moa',

  eggIncubationTime: 500,
  securityTimeToLay: 800,
  securityTimeVariation: 200,
  layingHungerThreshold: 28,
  seasonDuration: 2100,
  eagleSpawnMilestones: [12, 18, 25, 35, 45, 55],
  targetPopulation: 30,
  survivalTimeGoal: 3600,

  // ===== RESPONSIVE LAYOUT =====
  /**
   * Recomputes all layout dimensions from the current window size.
   * Canvas height is always referenceHeight (1080).
   * Canvas width varies with the window's aspect ratio, clamped to supported range.
   * Sidebar width is proportional to canvas width, clamped to min/max.
   * Game area fills the remaining horizontal space.
   *
   * Call once in setup() and again whenever the window dimensions change
   * (though during gameplay the canvas dimensions are locked and CSS-scaled).
   */
  // Full-bleed at ANY aspect, portrait included. The engine's original version
  // was landscape-only (aspect clamped to [4:3, 21:9]) and reserved space for a
  // sidebar and top/bottom bars. The installation has none of those: the SHORT
  // side of the canvas is pinned to referenceHeight and the long side follows the
  // window, so the square terrain letterboxes into it via _updateViewTransform().
  recalculateLayout(windowW, windowH) {
    const s = this.referenceHeight;
    let aspect = windowW / Math.max(1, windowH);
    aspect = Math.max(1 / 3, Math.min(3, aspect));   // sanity clamp only
    const w = aspect >= 1 ? Math.round(s * aspect) : s;
    const h = aspect >= 1 ? s : Math.round(s / aspect);

    this.canvasWidth = w;
    this.canvasHeight = h;
    this.gameAreaX = 0;
    this.gameAreaY = 0;
    this.gameAreaWidth = w;
    this.gameAreaHeight = h;
    this.rightSidebarWidth = 0;
    this.rightSidebarX = w;
  }
};

// ============================================
// LEVEL MECHANICS (optional, per-level, opt-in)
// Read by mauri_moa.js / mauri_simulation.js. Empty = disabled,
// so levels that don't set `mechanics` behave exactly as before.
// ============================================
let LEVEL_MECHANICS = {};
let FOREST_BIOMES = new Set();

// Player-toggled species highlights: speciesKeys whose moa pulse a halo in
// their species highlightColor. Toggled from the population panel (full UI)
// and the focus-species buttons (fullscreen). Cleared on level load.
let SPECIES_HIGHLIGHT = new Set();

// Applies level parameters onto CONFIG
function applyLevelToConfig(levelDef) {
  // Opt-in gameplay mechanics (habitat stress, forest competition, ...)
  LEVEL_MECHANICS = levelDef.mechanics || {};
  FOREST_BIOMES = new Set(LEVEL_MECHANICS.forestBiomes || []);

  // View & calendar (per-level, with engine defaults for levels that omit them)
  CONFIG.zoom = (levelDef.zoom != null) ? levelDef.zoom : 2.5;
  CONFIG.mapGrid = (levelDef.mapGrid != null) ? levelDef.mapGrid : 512;
  const _seasonOrder = ['summer', 'autumn', 'winter', 'spring'];
  CONFIG.startSeasonIndex = levelDef.startSeason ? Math.max(0, _seasonOrder.indexOf(levelDef.startSeason)) : 0;

  const t = levelDef.terrain;
  CONFIG.noiseScale = t.noiseScale;
  CONFIG.octaves = t.octaves;
  CONFIG.persistence = t.persistence;
  CONFIG.lacunarity = t.lacunarity;
  CONFIG.ridgeInfluence = t.ridgeInfluence;
  CONFIG.elevationPower = t.elevationPower;
  CONFIG.islandFalloff = t.islandFalloff;

  // Optional terrain features
  CONFIG.useLakes = levelDef.terrain.useLakes || false;
  CONFIG.lakeThreshold = levelDef.terrain.lakeThreshold || 0.12;
  CONFIG.lakeNoiseScale = levelDef.terrain.lakeNoiseScale || 0.008;
  
  if (levelDef.terrain.seasonSnowLines) {
    CONFIG.seasonSnowLines = levelDef.terrain.seasonSnowLines;
  } else {
    delete CONFIG.seasonSnowLines; // Use TerrainGenerator defaults
  }

  CONFIG.plantDensity = t.plantDensity;
  
  const e = levelDef.economy;
  CONFIG.seasonDuration = e.seasonDuration;
  CONFIG.eggIncubationTime = e.eggIncubationTime;
  CONFIG.securityTimeToLay = e.securityTimeToLay;
  CONFIG.securityTimeVariation = e.securityTimeVariation;
  CONFIG.layingHungerThreshold = e.layingHungerThreshold;
  CONFIG.eagleSpawnMilestones = [...e.eagleSpawnMilestones];
  CONFIG.maxMoaPopulation = e.maxPopulation;
  
  const c = levelDef.initialEntityCounts;
  CONFIG.initialMoaCount = c.moa;
  CONFIG.eagleCount = c.eagle;
  CONFIG.startingSpecies = levelDef.startingSpecies;
}

// ============================================
// COLOR UTILITIES 
// ============================================
function fillColor(colorArray, alphaOverride = null) {
  if (!colorArray) { fill(128); return; }
  const a = alphaOverride ?? colorArray[3];
  a !== undefined
    ? fill(colorArray[0], colorArray[1], colorArray[2], a)
    : fill(colorArray[0], colorArray[1], colorArray[2]);
}

function strokeColor(colorArray) {
  if (!colorArray) { stroke(128); return; }
  colorArray.length === 4
    ? stroke(colorArray[0], colorArray[1], colorArray[2], colorArray[3])
    : stroke(colorArray[0], colorArray[1], colorArray[2]);
}

// ============================================
// PRE-CACHED COLORS
// ============================================
const CACHED_COLORS = {};

function initCachedColors() {
  Object.assign(CACHED_COLORS, {
    placementValid: [100, 255, 100, 100],
    placementInvalid: [255, 100, 100, 100],
    placementValidStrong: [100, 255, 100, 200],
    placementInvalidStrong: [255, 100, 100, 200],
    spacingValid: [100, 200, 255, 60],
    spacingInvalid: [255, 150, 100, 80],
    blockerLine: [255, 100, 100, 150],
    blockerHighlight: [255, 100, 100, 200],
    floatingGreen: [100, 220, 100],
    menuBg: [25, 35, 30],
    menuTitle: [180, 220, 180],
    menuSubtitle: [140, 180, 140],
    menuText: [160, 180, 160],
    menuHint: [120, 150, 130],
    menuFooter: [100, 120, 100],
    btnNormal: [60, 120, 60],
    btnHover: [80, 140, 80],
    btnStroke: [100, 160, 100],
    notifSuccess: [60, 120, 60],
    notifSuccessText: [180, 255, 180],
    notifError: [120, 60, 60],
    notifErrorText: [255, 180, 180],
    notifInfo: [60, 80, 100],
    notifInfoText: [200, 220, 240],
    panelBg: CONFIG.col_panelBg,
    panelBorder: CONFIG.col_panelBorder,
    panelHeader: CONFIG.col_panelHeader,
    panelDivider: [50, 80, 60],
    sidebarBg: [30, 45, 35, 250],
  });
}

// ============================================
// GAME STATE
// ============================================
const GAME_STATE = {
  LEVEL_SELECT: 'level_select',
  MENU: 'menu',
  PLAYING: 'playing',
  PAUSED: 'paused',
  WON: 'won',
  LOST: 'lost'
};

// ============================================
// PLACEABLE ITEMS
// ============================================
const PLACEABLES = {
  kawakawa: {
    name: "Kawakawa Grove",
    description: "Rich feeding ground",
    cost: 25,
    icon: '🌿',
    color: '#2d8a4e',
    effect: 'feeding',
    radius: 40,
    duration: 1200, 
    minSpacing: 30,
    ignoresSpacing: false,
    feedingRate: 0.2,
    baseFeedingRate: 0.2,
    plantSpawnCount: 5,
    plantType: 'kawakawa',
    seasonalBonus: { summer: 1.2, autumn: 0.8, winter: 0.5, spring: 1.0 },
    attractsHungryMoa: true,
    attractionStrength: 1.3
  },
  
  shelter: {
    name: "Fern Shelter",
    description: "Eagles can't see moa here",
    cost: 40,
    icon: '🌴',
    color: '#1a5c32',
    effect: 'shelter',
    radius: 50,
    duration: 3200,
    securityBonus: 4.0,
    blocksEagleVision: true,
    minSpacing: 30,
    ignoresSpacing: false,
    feedingRate: 0.05,
    baseFeedingRate: 0.05,
    seasonalBonus: { summer: 1.0, autumn: 1.0, winter: 1.3, spring: 1.0 }
  },
  
  nest: {
    name: "Nesting Site",
    description: "Safe place to lay eggs",
    cost: 55,
    icon: '🪺',
    color: '#8b7355',
    effect: 'nesting',
    radius: 32,
    duration: 3600,
    securityBonus: 2.5,
    eggSpeedBonus: 2.0,
    attractsReadyMoa: true,
    attractionStrength: 2.0,
    minSpacing: 20,
    ignoresSpacing: false,
    seasonalBonus: { summer: 0.8, autumn: 1.0, winter: 0.6, spring: 1.5 }
  },
  
  Storm: {
    name: "Storm",
    description: "Distracts hunting eagles",
    cost: 40,
    icon: '🌩️',
    color: '#c4a35a',
    effect: 'Storm',
    radius: 70,
    duration: 600,
    distractsEagles: true,
    distractionStrength: 1.0,
    minSpacing: 0,
    ignoresSpacing: true,
    seasonalBonus: { summer: 1.0, autumn: 1.0, winter: 1.2, spring: 1.0 }
  },
  
  waterhole: {
    name: "Waterhole",
    description: "Rest and slow hunger",
    cost: 45,
    icon: '💧',
    color: '#4a90a4',
    effect: 'water',
    radius: 35,
    duration: 2400,
    hungerSlowdown: 0.4,
    feedingRate: 0.1,
    baseFeedingRate: 0.1,
    attractsMoa: true,
    attractionStrength: 1.2,
    minSpacing: 30,
    ignoresSpacing: false,
    seasonalBonus: { summer: 2.0, autumn: 1.0, winter: 0.5, spring: 1.2 }
  },
  
  harakeke: {
    name: "Harakeke Flax",
    description: "Food and light cover",
    cost: 30,
    icon: '🌾',
    color: '#5a8a3a',
    effect: 'feeding',
    radius: 36,
    duration: 1800,
    minSpacing: 30,
    ignoresSpacing: false,
    feedingRate: 0.15,
    baseFeedingRate: 0.15,
    plantSpawnCount: 3,
    plantType: 'flax',
    securityBonus: 1.4,
    seasonalBonus: { summer: 1.3, autumn: 1.5, winter: 0.7, spring: 1.0 },
    attractsHungryMoa: true,
    attractionStrength: 1.2
  },

  lancewood: {
    name: "Lancewood Stand",
    description: "Tough browse the bush moa favour",
    cost: 30,
    icon: '🌲',
    color: '#6a7a3a',
    effect: 'feeding',
    radius: 40,
    duration: 2400,
    minSpacing: 30,
    ignoresSpacing: false,
    feedingRate: 0.15,
    baseFeedingRate: 0.15,
    plantSpawnCount: 4,
    plantType: 'lancewood',
    favouredSpecies: 'little_bush_moa',
    // Plantable in tussock region too, to help if bush moa wander too far upslope.
    allowedBiomes: ['forestRefuge', 'shrubland', 'subalpine', 'glacialFlats'],
    seasonalBonus: { summer: 1.0, autumn: 1.2, winter: 1.1, spring: 1.0 },
    attractsHungryMoa: true,
    attractionStrength: 1.4
  },

  speargrass: {
    name: "Speargrass Patch",
    description: "Spiny herb the upland moa favour",
    cost: 30,
    icon: '🌵',
    color: '#8f9a55',
    effect: 'feeding',
    radius: 40,
    duration: 2400,
    minSpacing: 30,
    ignoresSpacing: false,
    feedingRate: 0.15,
    baseFeedingRate: 0.15,
    plantSpawnCount: 4,
    plantType: 'speargrass',
    favouredSpecies: 'upland_moa',
    allowedBiomes: ['subalpine', 'shrubland', 'glacialFlats'],
    seasonalBonus: { summer: 1.2, autumn: 1.0, winter: 0.9, spring: 1.1 },
    attractsHungryMoa: true,
    attractionStrength: 1.4
  }
};

function initPlaceableColors() {
  for (const key in PLACEABLES) {
    PLACEABLES[key]._parsedColor = color(PLACEABLES[key].color);
  }
}

// ============================================
// BIOME DEFINITIONS
// ============================================
const BIOMES = {
  sea: {
    key: 'sea', name: "Sea", minElevation: 0, maxElevation: 0.1,
    colors: ['#1a3a52', '#1e4d6b', '#236384'], contourColor: '#0f2533',
    walkable: false, canHavePlants: false, canPlace: false
  },
  coastal: {
    key: 'coastal', name: "Coastal/Beach", minElevation: 0.1, maxElevation: 0.15,
    colors: ['#c2b280', '#d4c794', '#e6dca8'], contourColor: '#8a7d5a',
    walkable: true, canHavePlants: false, canPlace: true
  },
  grassland: {
    key: 'grassland', name: "Lowland Grassland", minElevation: 0.15, maxElevation: 0.3,
    colors: ['#7fb069', '#8fbc79', '#9fc889'], contourColor: '#5a7d4a',
    walkable: true, canHavePlants: true, plantTypes: ['tussock', 'flax'], canPlace: true
  },
  podocarp: {
    key: 'podocarp', name: "Podocarp Forest", minElevation: 0.3, maxElevation: 0.4,
    colors: ['#2d5a3d', '#346644', '#3b724b'], contourColor: '#1e3d29',
    walkable: true, canHavePlants: true, plantTypes: ['fern', 'rimu'], canPlace: true
  },
  montane: {
    key: 'montane', name: "Montane Forest", minElevation: 0.4, maxElevation: 0.60,
    colors: ['#4a7c59', '#528764', '#5a926f'], contourColor: '#335740',
    walkable: true, canHavePlants: true, 
    plantTypes: ['beech', 'fern', 'patotara'],
    canPlace: true
  },
  subalpine: {
    key: 'subalpine', name: "Subalpine Tussock", minElevation: 0.60, maxElevation: 0.80,
    colors: ['#a8a060', '#b5ad6d', '#c2ba7a'], contourColor: '#7a7445',
    walkable: true, canHavePlants: true, 
    plantTypes: ['tussock', 'patotara'],
    canPlace: true
  },
  alpine: {
    key: 'alpine', name: "Alpine Rock", minElevation: 0.77, maxElevation: 0.9,
    colors: ['#8b8b8b', '#9a9a9a', '#a9a9a9'], contourColor: '#5c5c5c',
    walkable: false, canHavePlants: false, canPlace: false
  },
  snow: {
    key: 'snow', name: "Permanent Snow", minElevation: 0.9, maxElevation: 1.0,
    colors: ['#e8e8e8', '#f0f0f0', '#ffffff'], contourColor: '#b0b0b0',
    walkable: false, canHavePlants: false, canPlace: false
  }
};

// ============================================
// PLANT DEFINITIONS
// ============================================
const PLANT_TYPES = {
  tussock: { name: "Tussock", nutrition: 25, color: '#8ea040', size: 24, growthTime: 200,
    description: "Hardy grass that covers the high country" },
  flax: { name: "Flax", nutrition: 35, color: '#487020', size: 26, growthTime: 280,
    description: "Harakeke: versatile, with sweet nectar" },
  fern: { name: "Fern", nutrition: 30, color: '#228B22', size: 36, growthTime: 240,
    description: "The iconic Ponga's fronds populate forests" },
  rimu: { name: "Rimu", nutrition: 50, color: '#8B0000', size: 48, growthTime: 400,
    description: "Ancient podocarp with bright red fruit" },
  beech: { name: "Beech", nutrition: 40, color: '#8b430f', size: 52, growthTime: 350,
    description: "Tawhai: produces mast seed in good years" },
  kawakawa: { name: "Kawakawa", nutrition: 40, color: '#3d9a5e', size: 22, growthTime: 150,
    description: "Heart-shaped leaves with peppery fruit" },
  patotara: { name: "Patotara", nutrition: 35, color: '#c94c5a', size: 28, growthTime: 160,
    description: "Alpine shrub with summer berries" },

  // --- Glacial-flora (LGM) additions. Procedural blob-rendered (no sprites yet). ---
  coprosma: { name: "Coprosma", nutrition: 30, color: '#5c7d3e', size: 22, growthTime: 190,
    description: "Divaricating shrub; hardy glacial browse with orange berries" },
  dracophyllum: { name: "Dracophyllum", nutrition: 28, color: '#9a7b4f', size: 30, growthTime: 250,
    description: "Inaka grass-tree of the cold subalpine tops" },
  matagouri: { name: "Matagouri", nutrition: 26, color: '#7a6f4a', size: 24, growthTime: 210,
    description: "Tūmatakuru: thorny shrub of the glacial outwash flats" },

  // --- Favoured, browse-resistant plants (planted via the palette) ---
  lancewood: { name: "Juvenile Lancewood", nutrition: 34, color: '#6a5a33', size: 30, growthTime: 300,
    description: "Horoeka: tough and spiky when growing." },
  speargrass: { name: "Speargrass", nutrition: 30, color: '#8f9a55', size: 26, growthTime: 260,
    description: "Taramea: spiny herb of the hills" }
};

// ============================================
// MAURI MANAGER
// ============================================


// ============================================
// GAME MANAGER
// ============================================
class Game {
  constructor() {
    this.state = GAME_STATE.PLAYING;

    this.currentLevel = null;
    this.activeBiomes = null;
    this.activePlaceables = null;
    this.activeSpecies = null;

    this.terrain = null;
    this.simulation = null;
    this.ui = null;
    this.seasonManager = null;

    this.playTime = 0;
    this.timeScale = 1;

    this.notifications = [];

    this._cachedMoaCount = 0;
    this._cachedEggCount = 0;
    this._cachedThrivingCount = 0;
    this._tempVec = null;
  }

  loadLevel(levelId) {
    const rawDef = LEVEL_REGISTRY.get(levelId);
    if (!rawDef) {
      console.error(`Level not found: ${levelId}`);
      return;
    }

    const levelDef = resolveLevelDef(rawDef);
    this.currentLevel = levelDef;

    applyLevelToConfig(levelDef);

    this.activeBiomes = levelDef.biomes;
    this.activePlaceables = levelDef._resolvedPlaceables;
    this.activeSpecies = levelDef.species;

    this.init();
  }
  
  // Full build: new terrain (noise + season bakes) AND a new ecosystem.
  // Expensive — hundreds of milliseconds at mapGrid 512, because
  // TerrainGenerator.generate() runs the noise over every cell and then bakes
  // four season buffers. Call this on first load and on a deliberate reseed,
  // NOT on the attract loop. See resetEcosystem() below.
  init() {
    if (!this.currentLevel) return;

    this.terrain = new TerrainGenerator(CONFIG, this.activeBiomes);
    this.seasonManager = new SeasonManager(CONFIG);
    this.terrain.setSeasonManager(this.seasonManager);
    this.terrain.generate();
    this._updateViewTransform();

    this._buildSimulation();

    if (audioManager) audioManager.playBackground();
  }

  // Cheap rebuild: keep the terrain and its baked buffers, replace the living
  // world. This is the attract-loop path, and it is the one that has to stay
  // fast — see TEMANAWA_BUILD_V3.md §5.1. The land does not need to change
  // between visitors; only the ecosystem and the clock do.
  //
  // Terrain generation is ~95% of a full init(), so skipping it is the whole
  // difference between a reset the visitor notices and one they don't.
  resetEcosystem() {
    if (!this.currentLevel || !this.terrain) { this.init(); return; }
    this._buildSimulation();
  }

  _buildSimulation() {
    this.simulation = new Simulation(
      this.terrain, CONFIG, this, this.seasonManager
    );
    this.simulation.setActiveSpecies(this.activeSpecies);
    this.simulation.init();

    this.ui = new GameUI(CONFIG, this.terrain, this.simulation, this, this.seasonManager);

    this.playTime = 0;
    this.timeScale = 1;
    if (typeof DeepTime !== 'undefined') DeepTime.reset();
    SPECIES_HIGHLIGHT.clear();
    this.state = GAME_STATE.PLAYING;
    this._tempVec = createVector(0, 0);
  }

  isInGameArea(mx, my) {
    if (CONFIG.fullscreen && this.terrain) {
      return mx >= CONFIG.viewX &&
             mx < CONFIG.viewX + this.terrain.mapWidth * CONFIG.viewZoom &&
             my >= CONFIG.viewY &&
             my < CONFIG.viewY + this.terrain.mapHeight * CONFIG.viewZoom;
    }
    return mx >= CONFIG.gameAreaX &&
           mx < CONFIG.gameAreaX + CONFIG.gameAreaWidth &&
           my >= CONFIG.gameAreaY &&
           my < CONFIG.gameAreaY + CONFIG.gameAreaHeight;
  }


  // Recomputes the active render transform. Normal mode: the classic
  // game-area placement. Fullscreen: the map scaled to the largest size that
  // fits the whole canvas, centred, with the HUD drawn as an overlay.
  _updateViewTransform() {
    if (this.terrain) {
      const z = Math.min(CONFIG.canvasWidth / this.terrain.mapWidth,
                         CONFIG.canvasHeight / this.terrain.mapHeight);
      CONFIG.viewZoom = z;
      CONFIG.viewX = Math.round((CONFIG.canvasWidth - this.terrain.mapWidth * z) / 2);
      CONFIG.viewY = Math.round((CONFIG.canvasHeight - this.terrain.mapHeight * z) / 2);
    } else {
      CONFIG.viewZoom = CONFIG.zoom;
      CONFIG.viewX = CONFIG.gameAreaX;
      CONFIG.viewY = CONFIG.gameAreaY;
    }
  }
  
  updateCachedCounts() {
    const moas = this.simulation.moas;
    let moaCount = 0, thrivingCount = 0;
    
    for (let i = 0; i < moas.length; i++) {
      if (moas[i].alive) {
        moaCount++;
        if (moas[i].hunger < 20) thrivingCount++;
      }
    }
    
    let eggCount = 0;
    const eggs = this.simulation.eggs;
    for (let i = 0; i < eggs.length; i++) {
      if (eggs[i].alive) eggCount++;
    }
    
    this._cachedMoaCount = moaCount;
    this._cachedEggCount = eggCount;
    this._cachedThrivingCount = thrivingCount;
  }
  
  getMoaPopulation() {
    return this._cachedMoaCount;
  }
  
  update(dt = 1) {
    // The HUD owns the deep-time multiplier and the transient button effects,
    // and returns the timeScale this frame should run at.
    const scale = (typeof InstallHUD !== 'undefined') ? InstallHUD.update(this, dt) : 1;
    const sdt = dt * (scale || 1);

    this.playTime += sdt;

    if (this.seasonManager.update(sdt)) this.onSeasonChange();

    this.simulation.update(sdt);
    this.updateCachedCounts();
    this.updateNotifications(sdt);
    if (this.ui) this.ui.update(dt);

    // End of the window is not a fail state and not a pause — it is the
    // attract loop's cue. Without this the kiosk sits frozen at Oruanui
    // until somebody touches it, which unattended means most of the day.
    if (typeof DeepTime !== 'undefined' && DeepTime.hasEnded() &&
        typeof Kiosk !== 'undefined') {
      Kiosk.resetToAttract(this, 'end-of-window');
    }
  }

  updateNotifications(dt = 1) {
    const notifs = this.notifications;
    for (let i = notifs.length - 1; i >= 0; i--) {
      notifs[i].life -= dt;
      if (notifs[i].life <= 0) notifs.splice(i, 1);
    }
  }
  



  
  addNotification(text, type = 'info') {
    if (this.ui) this.ui.addMessage(text, type);
    this.notifications.push({
      text, type,
      life: 600,
      maxLife: 600,
      time: this.playTime,
      _cachedWidth: null
    });
    if (this.notifications.length > 8) this.notifications.shift();
  }
  
  onSeasonChange() {
    const season = this.seasonManager.current;
    const seasonKey = this.seasonManager.currentKey;

    this.addNotification(`Season changed to ${season.name} ${season.icon}`, 'info');
    if (audioManager) audioManager.playSeasonChange(seasonKey);

    // Glacial predation: winter drives an extra hungry eagle to hunt.
    if (typeof LEVEL_MECHANICS !== 'undefined' && LEVEL_MECHANICS.winterPredation && seasonKey === 'winter') {
      this.simulation.spawnEagle();
      this.addNotification("The glacial winter drives a hungry eagle to hunt.", 'error');
    }
    
    const aliveMoas = this.simulation.moas.filter(m => m.alive);
    const migrationMessages = this.seasonManager.getMigrationMessages(aliveMoas);
    
    if (migrationMessages.current) {
      setTimeout(() => this.addNotification(migrationMessages.current, 'info'), 500);
    }
    if (migrationMessages.upcoming) {
      setTimeout(() => this.addNotification(migrationMessages.upcoming, 'info'), 2000);
    }
  }
  
  
  
    
  
  render() {
    background(20, 30, 25);

    push();
    drawingContext.save();
    drawingContext.beginPath();
    const _clipW = this.terrain.mapWidth * CONFIG.viewZoom;
    const _clipH = this.terrain.mapHeight * CONFIG.viewZoom;
    drawingContext.rect(CONFIG.viewX, CONFIG.viewY, _clipW, _clipH);
    drawingContext.clip();

    translate(CONFIG.viewX, CONFIG.viewY);
    scale(CONFIG.viewZoom);

    this.terrain.render();

    // Winter frost: a single cool haze laid over the ground (under the animals),
    // fading in through late autumn and out into spring. One rect — no perf cost.
    const _frost = this.seasonManager.getWinterness ? this.seasonManager.getWinterness() : 0;
    if (_frost > 0.001) {
      push();
      noStroke();
      rectMode(CORNER);
      fill(216, 232, 245, 72 * _frost);
      rect(0, 0, this.terrain.mapWidth, this.terrain.mapHeight);
      pop();
    }

    this.simulation.render();

    drawingContext.restore();
    pop();

    this.ui.renderFullscreenOverlay();
  }





  
  



  
  
  handleClick(mx, my) {
    if (typeof Kiosk !== 'undefined') Kiosk.noteInput();
    if (this.ui && this.ui.handleFullscreenClick(mx, my)) return;
  }
  
  handleKey(k) {
    if (typeof Kiosk !== 'undefined') Kiosk.noteInput();
    if (typeof InstallHUD !== 'undefined' && InstallHUD.handleKey(this, k)) return;
    if (typeof Debug !== 'undefined' && Debug.handleKey(k)) return;
  }

}



// ============================================
// MAIN SKETCH
// ============================================
let game;

let _needsInitialResize = true;

function setup() {
  if (!audioManager) audioManager = initAudioManager();

  CONFIG.recalculateLayout(windowWidth, windowHeight);

  pixelDensity(1); // must run BEFORE scaleCanvasToFit: it resets the canvas's inline CSS size
  let cnv = createCanvas(CONFIG.canvasWidth, CONFIG.canvasHeight);
  cnv.style('display', 'block');
  document.body.style.margin = '0';
  document.body.style.overflow = 'hidden';
  document.body.style.background = '#19231e';

  scaleCanvasToFit();
  frameRate(60);
  textFont('OpenDyslexic');

  initCachedColors();
  initPlaceableColors();
  initPlantSprites(plantSprites);
  initializeRegistry();

  game = new Game();
  // Te Manawa: standalone installation - autoload scene, skip menu/level-select
  game.loadLevel('temanawa_scaffold');

  if (typeof Kiosk !== 'undefined') { Kiosk.attach(game); Kiosk.install(); }
  if (typeof Debug !== 'undefined') Debug.applyVisibility();
}

function windowResized() {
  // Recalculate layout for actual window dimensions
  CONFIG.recalculateLayout(windowWidth, windowHeight);

  // Resize the p5 canvas to the new computed dimensions
  resizeCanvas(CONFIG.canvasWidth, CONFIG.canvasHeight);

  // Apply CSS scaling to fill the window
  scaleCanvasToFit();

  // Update UI panel positions if game is running
  if (game && game.ui) {
    game.ui.recalculate();
    game._updateViewTransform();
  }
}

function scaleCanvasToFit() {
  const cnv = document.querySelector('canvas');
  if (!cnv) return;

  const cw = CONFIG.canvasWidth;
  const ch = CONFIG.canvasHeight;

  // Because we resize the canvas to match the window's aspect ratio,
  // the scale factor should be very close to uniform.
  // We use min() as a safety net against rounding.
  const scale = Math.min(windowWidth / cw, windowHeight / ch);

  cnv.style.width = (cw * scale) + 'px';
  cnv.style.height = (ch * scale) + 'px';
  cnv.style.position = 'absolute';
  cnv.style.left = ((windowWidth - cw * scale) / 2) + 'px';
  cnv.style.top = ((windowHeight - ch * scale) / 2) + 'px';
}

function initializeRegistry() {
  REGISTRY.registerAnimalType('moa', {}, Moa);
  REGISTRY.registerAnimalType('eagle', {}, HaastsEagle);
  
  for (const [key, config] of Object.entries(MOA_SPECIES)) REGISTRY.registerSpecies(key, 'moa', config);
  for (const [key, config] of Object.entries(EAGLE_SPECIES)) REGISTRY.registerSpecies(key, 'eagle', config);
  for (const [key, config] of Object.entries(PLANT_TYPES)) REGISTRY.registerPlant(key, config);
  for (const [key, config] of Object.entries(PLACEABLES)) REGISTRY.registerPlaceable(key, config);
  for (const [key, config] of Object.entries(BIOMES)) REGISTRY.registerBiome(key, config);
  
  const issues = REGISTRY.validate();
  if (issues.length > 0) console.warn('Registry validation found issues:', issues);
  if (CONFIG.debugMode) console.log('Registry initialized:', REGISTRY.getSummary());
}

function draw() {
  // On first frame, re-check dimensions in case setup() got stale values
  if (_needsInitialResize) {
    _needsInitialResize = false;
    // Must mirror CONFIG.recalculateLayout exactly, or the first frame
    // thrashes a resize it doesn't need.
    const _a = Math.max(1 / 3, Math.min(3, windowWidth / Math.max(1, windowHeight)));
    const expectedW = _a >= 1 ? Math.round(CONFIG.referenceHeight * _a) : CONFIG.referenceHeight;
    if (expectedW !== CONFIG.canvasWidth) {
      windowResized(); // forces recalculate + resizeCanvas
    } else {
      scaleCanvasToFit(); // dimensions fine, but CSS scaling may have been reset
    }
  }

  const currentTime = millis();
  deltaTime = constrain(currentTime - lastFrameTime, 1, 100);
  lastFrameTime = currentTime;
  deltaMultiplier = deltaTime / TARGET_FRAME_TIME;

  updateFPS();

  if (typeof Kiosk !== 'undefined') Kiosk.beat();

  const _t0 = performance.now();
  game.update(deltaMultiplier);
  const _t1 = performance.now();
  game.render();
  const _t2 = performance.now();
  if (typeof Debug !== 'undefined') Debug.sample(_t1 - _t0, _t2 - _t1);

  if (typeof Kiosk !== 'undefined') Kiosk.renderCrossfade(CONFIG.canvasWidth, CONFIG.canvasHeight);
}

function updateFPS() {
  fpsHistory.push(1000 / deltaTime);
  if (fpsHistory.length > FPS_HISTORY_SIZE) fpsHistory.shift();
  
  let sum = 0;
  for (let i = 0; i < fpsHistory.length; i++) sum += fpsHistory[i];
  currentFPS = sum / fpsHistory.length;
}


function mousePressed() { game.handleClick(mouseX, mouseY); }
function keyPressed() { game.handleKey(key); }