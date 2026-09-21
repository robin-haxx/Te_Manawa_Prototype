// lets goooo

// Fonts. These were implicit globals (assigned in preload() with no
// declaration), which works only in sloppy mode and breaks the moment anything
// here is loaded as a module. Declared properly so the HUD and UI can rely on them.
let OpenDyslexic = null;
let FreckleFace = null;

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
//   single        provisional stand-in: the exact filename within `folder` to load
//                 ONCE and draw for every seasonal state (Mature/Thriving/Wilting/
//                 Dormant all resolve to it). For dedicated-folder art that has
//                 arrived as one frame; per-state art replaces it later. Mutually
//                 exclusive with prefix's per-state loading. Not for sizeOnly plants.
//   growingFrames if set, loads <prefix>_Growing_01..NN.png as a growth sequence
//   matureVariants if set, loads <prefix>_Size_00..NN-1.png; a mature plant picks
//                 one at random (per instance) instead of the Mature/Thriving art
//   growFromVariant index into the loaded Size variants to reuse as the (single)
//                 growth frame, for a plant that grows in one of its size looks
//                 rather than a dedicated Growing_ sequence
//   sizeOnly      if set, the plant has NO seasonal state art: the Mature/Thriving/
//                 Wilting/Dormant frames are never loaded and never shown — it plays
//                 its growth sequence while immature, then holds its size variant for
//                 good (no sprite-switching on dormancy/wilt/thrive). Needs matureVariants.
//   anchor        'center' (default) or 'base' — 'base' plants the sprite's
//                 bottom edge on the ground point, for art taller than it is wide
//   scale         multiplier on the drawn footprint width
//
// Art-move status: the dedicated per-species folders (sprites/<Species>/) are the
// incoming look. As each lands it is wired here `single` — one frame for every
// state — until its full state set is drawn. See md/TEMANAWA_BUILD_V3.md §4.1.
// Species with a folder but no sim plant type yet (Manuka, Kahikatea, Nikau, Tawa,
// CabbageTree, Epiphytes) are art-in-hand only; they wire up when the type does.
const PLANT_SPRITE_SETS = {
  // Dedicated-folder art, one frame standing in for every state (single). The
  // old root Tussock_/Flax_/Fern_ state files are superseded and left in place.
  // Tussock — 6 mature-size variants (Tussocks_Sprite_00001..00006); a grown clump renders one at
  // random and grows in from the first. The `single` covers the wilting/dormant states for now.
  tussock:   { folder: 'Tussock/',  single: 'Tussocks_Sprite_00001.png', growFromVariant: 0,
               variantFiles: ['Tussocks_Sprite_00001.png', 'Tussocks_Sprite_00002.png', 'Tussocks_Sprite_00003.png',
                              'Tussocks_Sprite_00004.png', 'Tussocks_Sprite_00005.png', 'Tussocks_Sprite_00006.png'] },
  // Harakeke — wired like tōtara: a dedicated Growing_01 frame plus three size
  // variations (Flax_Size_00..02), a mature plant picks one at random per instance.
  // sizeOnly, so it plays the growth frame while immature then holds its size
  // variant — no seasonal state art (Flax_Mature is superseded; dormancy still dims).
  flax:      { prefix: 'Flax', folder: 'Flax/', growingFrames: 1,
               matureVariants: 3, sizeOnly: true, anchor: 'base' },
  // fern is the mamaku/ponga tree-fern stand-in; its art has a trunk, so base-anchor.
  // Grows through three Growing frames (TreeFern_Growing_01..03), then holds one of two
  // variant sprites (TreeFern_Sprite_00001..00002). sizeOnly: no seasonal state art.
  fern:      { prefix: 'TreeFern', folder: 'TreeFern/', growingFrames: 3, sizeOnly: true, anchor: 'base',
               variantFiles: ['TreeFern_Sprite_00001.png', 'TreeFern_Sprite_00002.png'] },
  // PROTOTYPE: Totara renders with Tōtara art. Art swap only — the 'Totara' key
  // still drives nutrition, seasonality, forest banding and level data.
  // Tōtara has only size variants + a growth sequence (no seasonal state art), so
  // sizeOnly keeps it on its size variant instead of switching frames.
  Totara:      { prefix: 'Totara', folder: 'Totara/', growingFrames: 2,
               matureVariants: 3, sizeOnly: true, anchor: 'base', scale: 1.0 },
  // beech (black beech, tawhai) — dedicated-folder art has a trunk, so base-anchor.
  // Grows through two Grow frames (Beech_Grow_01..02), then holds one of three variant
  // sprites (Beech_Sprite_00001..00003). sizeOnly: no seasonal state art.
  beech:     { folder: 'Beech/', sizeOnly: true, anchor: 'base',
               growingFiles: ['Beech_Grow_01.png', 'Beech_Grow_02.png'],
               variantFiles: ['Beech_Sprite_00001.png', 'Beech_Sprite_00002.png', 'Beech_Sprite_00003.png'] },
  // kōwhai — small flowering tree, base-anchor. Lives in Lowland + Podocarp
  // (level scaffold). Grows through one Growing frame, then holds one of three
  // Size variants (Kowhai_Size_01..03) picked per instance. sizeOnly: no seasonal
  // state art, so it plays the growth frame while immature then holds its variant.
  kowhai:    { folder: 'Kowhai/', sizeOnly: true, anchor: 'base',
               growingFiles: ['Kowhai_Growing.png'],
               variantFiles: ['Kowhai_Size_01.png', 'Kowhai_Size_02.png', 'Kowhai_Size_03.png'] },
  // Kahikatea — grows through two dedicated Growing frames (Kahikatea_Growing_01..02),
  // then holds one of three Size variants (Kahikatea_Size_01..03) picked per instance.
  // sizeOnly (like tōtara): no seasonal state art. As it senesces (disturbanceRecruit
  // aging), growth falls back below 1 and it plays the growth frames in reverse.
  kahikatea:   { prefix: 'Kahikatea', folder: 'Kahikatea/', growingFrames: 2, sizeOnly: true, anchor: 'base',
                 variantFiles: ['Kahikatea_Size_01.png', 'Kahikatea_Size_02.png', 'Kahikatea_Size_03.png'] },
  // Dedicated-folder species below — all upright, so base-anchor. Single-asset
  // stand-ins; habitats are set in the level scaffold biomes. (Epiphytes are NOT
  // wired — they go into individual trees' art by hand.)
  // Nīkau — the palm grows through 3 dedicated Grow frames whose ARTWORK carries the
  // size progression, so fixedGrowthSize holds the footprint at adult width the whole
  // way (no scale-up) and the frames themselves show it filling out. Mature is a 50/50
  // pick between two size forms (Size_01/02). sizeOnly — no seasonal state art.
  nikau:       { folder: 'Nikau/', sizeOnly: true, fixedGrowthSize: true, anchor: 'base',
                 growingFiles: ['Nikau_Grow_01.png', 'Nikau_Grow_02.png', 'Nikau_Grow_03.png'],
                 variantFiles: ['Nikau_Size_01.png', 'Nikau_Size_02.png'] },
  // Tawa — grows through two Growing frames (Tawa_Growing_01..02), then holds one of three
  // variant sprites (Tawa_Sprite_00001..00003). sizeOnly: no seasonal state art.
  tawa:        { prefix: 'Tawa', folder: 'Tawa/', growingFrames: 2, sizeOnly: true, anchor: 'base',
                 variantFiles: ['Tawa_Sprite_00001.png', 'Tawa_Sprite_00002.png', 'Tawa_Sprite_00003.png'] },
  // Mānuka — grows through two Grow frames (Manuka_Grow_01..02), then holds one of three
  // variant sprites (Manuka_Sprite_00001..00003). sizeOnly: no seasonal state art.
  manuka:      { folder: 'Manuka/', sizeOnly: true, anchor: 'base',
                 growingFiles: ['Manuka_Grow_01.png', 'Manuka_Grow_02.png'],
                 variantFiles: ['Manuka_Sprite_00001.png', 'Manuka_Sprite_00002.png', 'Manuka_Sprite_00003.png'] },
  // Tī kōuka / cabbage tree — grows through two Growing frames (CabbageTree_Growing_01..02),
  // then holds one of two variant sprites (CabbageTree_Sprite_00001..00002). sizeOnly: no state art.
  cabbagetree: { prefix: 'CabbageTree', folder: 'CabbageTree/', growingFrames: 2, sizeOnly: true, anchor: 'base',
                 variantFiles: ['CabbageTree_Sprite_00001.png', 'CabbageTree_Sprite_00002.png'] },
  // GREY SCRUB — code key `coprosma`, but a VISUAL UMBRELLA for the glacial-mosaic grey-scrub taxa
  // (Coprosma, pōhuehue/Muehlenbeckia, …) drawn under the `Shrub/` folder. Grows through two dedicated
  // Growing frames, then holds one of six variant sprites (Coprosma_Sprite_00001..00006) picked per
  // instance. Append variant filenames as more grey-scrub taxa land. sizeOnly: no seasonal state art.
  // Low divaricate shrub of dry, frosty, exposed open ground — the woody element of the cold shrubland.
  coprosma:     { folder: 'Shrub/', sizeOnly: true, anchor: 'base',
                  growingFiles: ['Coprosma_Growing_01.png', 'Coprosma_Growing_02.png'],
                  variantFiles: ['Coprosma_Sprite_00001.png', 'Coprosma_Sprite_00002.png', 'Coprosma_Sprite_00003.png',
                                 'Coprosma_Sprite_00004.png', 'Coprosma_Sprite_00005.png', 'Coprosma_Sprite_00006.png'] },
  // Dracophyllum (inaka / grass-tree) — subalpine + heath cold shrub. Grows through one Grow frame
  // (Dracophyllum_Grow_01), then holds one of three variant sprites (Dracophyllum_Sprite_00001..00003)
  // picked per instance. sizeOnly: no seasonal state art.
  dracophyllum: { folder: 'Dracophyllum/', sizeOnly: true, anchor: 'base',
                  growingFiles: ['Dracophyllum_Grow_01.png'],
                  variantFiles: ['Dracophyllum_Sprite_00001.png', 'Dracophyllum_Sprite_00002.png', 'Dracophyllum_Sprite_00003.png'] }
};

const PLANT_SPRITE_STATES = ['Mature', 'Thriving', 'Wilting', 'Dormant'];

function preload(){
  OpenDyslexic = loadFont('typefaces/OpenDyslexic.ttf');
  FreckleFace = loadFont('typefaces/NF-Nadira-Pro-Regular.ttf');

  for (const [key, def] of Object.entries(PLANT_SPRITE_SETS)) {
    const dir = `sprites/${def.folder || ''}`;
    const set = {};

    // Provisional single-asset stand-in: load one frame and alias every seasonal
    // state to it (loadImage is not deduped, so alias — do not reload four times).
    // State selection in _getSpriteState still runs; every state just resolves to
    // this one image until the full state set is drawn.
    if (def.single) {
      const img = loadImage(
        `${dir}${def.single}`,
        () => {},
        () => console.warn(`Could not load ${def.single}`)
      );
      for (const state of PLANT_SPRITE_STATES) set[state.toLowerCase()] = img;

    // Seasonal state art (Mature/Thriving/Wilting/Dormant). Skipped for sizeOnly
    // plants (tōtara), which never switch to a state frame — they hold their size
    // variant — so those PNGs are neither loaded nor referenced.
    } else if (!def.sizeOnly) {
      for (const state of PLANT_SPRITE_STATES) {
        set[state.toLowerCase()] = loadImage(`${dir}${def.prefix}_${state}.png`);
      }
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

    // Explicit growth-frame file LIST — for growth art whose filenames don't follow the
    // prefix_Growing_NN pattern (e.g. nīkau's Nikau_Grow_0N). Plays in order over 0..1
    // growth exactly like growingFrames.
    if (def.growingFiles && def.growingFiles.length) {
      set.growing = [];
      for (let i = 0; i < def.growingFiles.length; i++) {
        const f = def.growingFiles[i];
        set.growing.push(loadImage(`${dir}${f}`, () => {}, () => console.warn(`Could not load ${f}`)));
      }
    }

    // Mature-size variants: a grown plant renders one of these (chosen per
    // instance) instead of the Mature/Thriving frame, for visual variety.
    if (def.matureVariants) {
      set.variants = [];
      for (let i = 0; i < def.matureVariants; i++) {
        const n = String(i).padStart(2, '0');
        set.variants.push(loadImage(
          `${dir}${def.prefix}_Size_${n}.png`,
          () => {},
          () => console.warn(`Could not load ${def.prefix}_Size_${n}.png`)
        ));
      }
    }

    // Explicit variant file LIST — for art whose filenames don't follow the prefix_Size_NN
    // pattern (e.g. Tussocks_Sprite_0000N, 5-digit) or a MIXED umbrella set (grey scrub: the one
    // code key `coprosma`, drawn as Coprosma / Muehlenbeckia / … under the `Shrub/` folder). A
    // grown plant renders one at random, exactly like matureVariants; append files as they land.
    if (def.variantFiles && def.variantFiles.length) {
      set.variants = [];
      for (let i = 0; i < def.variantFiles.length; i++) {
        const f = def.variantFiles[i];
        set.variants.push(loadImage(`${dir}${f}`, () => {}, () => console.warn(`Could not load ${f}`)));
      }
    }

    // Growing look sourced from a mature-size variant, for a plant with no
    // dedicated Growing_ sequence: it grows in its OWN assigned variant (shrunk by
    // `growth`), then holds that same variant once mature. Aliases the loaded
    // variant `def.growFromVariant` as the fallback single growth frame (no reload);
    // the per-instance variant is selected at render (see meta.growFromVariant below),
    // so a growing clump is not stuck on variant 0 — otherwise every regrowing tussock
    // shows the same frame and the variant spread vanishes.
    if (def.growFromVariant != null && set.variants && set.variants[def.growFromVariant]) {
      set.growing = [set.variants[def.growFromVariant]];
    }

    // All plant art is now side-on (upright billboards), so it stands on its
    // ground point — base-anchored by default. `anchor:'center'` is only for the
    // legacy top-down crowns, of which none remain. See Plant.render offsetY.
    // `growFromVariant` flags a variant-grown set so _renderSprite grows the plant in
    // its assigned variant instead of the fixed fallback frame.
    set.meta = { anchor: def.anchor || 'base', scale: def.scale || 1.0, sizeOnly: !!def.sizeOnly,
                 fixedGrowthSize: !!def.fixedGrowthSize,
                 growFromVariant: def.growFromVariant != null };
    plantSprites[key] = set;
  }

  loadPlaceableSprites();
  loadEntitySprites();

  // The nest egg's shell art (Egg.render draws the coded crack lines on top). Real failure
  // callback — never a silent () => {} (a missing sprite must be logged, CLAUDE.md §conventions).
  eggSprite = loadImage('sprites/Egg_Sprite.png', () => {}, () => console.warn('Could not load Egg_Sprite.png'));

  // Environmental animation strips (loose per-frame PNGs → SpriteStrips.loadFrames).
  // Registered here so real art wins over SpriteStrips.ensurePlaceholders() (which
  // only fills gaps) when WaterLayer.build() runs after setup. Names are the ones
  // the water layer + HUD already draw by; the '2' variants are alternated per slot.
  const ENV = 'sprites/Environmental/';
  // River currents — two channel variants, drawn along the river polylines.
  SpriteStrips.loadFrames('water_current',  ENV + 'Currents/Flowing 1/', 'River1_Flowing_', 11);
  SpriteStrips.loadFrames('water_current2', ENV + 'Currents/Flowing 2/', 'River2_Flowing_', 11);
  // Sea waves — two variants, stamped across the open-sea grid.
  SpriteStrips.loadFrames('sea_shimmer',  ENV + 'Waves/Waves 1/', 'Sea1_Waves_', 13);
  SpriteStrips.loadFrames('sea_shimmer2', ENV + 'Waves/Waves 2/', 'Sea2_Waves_', 13);
  // River swimmers — tuna (the freshwater eel; the engine's existing 'eel_swim'
  // path) and a school of smaller fish.
  SpriteStrips.loadFrames('eel_swim',  ENV + 'Tuna/',          'Tuna_Swimming_', 8);
  SpriteStrips.loadFrames('fish_swim', ENV + 'Fish/Swimming/', 'Fish_Swimming_', 8);
  // Winds — animated gusts blown W→E by the HUD wind system (warm = interglacial /
  // FOREST, cold = glacial / TUSSOCK). These supersede the old single-frame
  // windWarm/windCold placeables (the warm one pointed at a file that never shipped).
  SpriteStrips.loadFrames('wind_warm', ENV + 'Wind_Interglacial/Blowing 1/', 'Wind1_Blowing_',  11);
  SpriteStrips.loadFrames('wind_cold', ENV + 'Wind_Glacial/Blowing 1/',      'Chill1_Blowing_', 11);
  // Storm — three animated thunderhead cells + three lightning-bolt variants (one
  // frame each; the bolt object picks a variant per strike).
  SpriteStrips.loadFrames('storm_cloud1', ENV + 'Storm/Idle 1/', 'Storm1_Idle_', 13);
  SpriteStrips.loadFrames('storm_cloud2', ENV + 'Storm/Idle 2/', 'Storm2_Idle_', 13);
  SpriteStrips.loadFrames('storm_cloud3', ENV + 'Storm/Idle 3/', 'Storm3_Idle_', 13);
  SpriteStrips.registerFrames('storm_bolt', [
    loadImage(encodeURI(ENV + 'Storm/Lightning 1/Storm1_Lightning_00000.png'), () => {}, () => console.warn('[strips] storm_bolt 1')),
    loadImage(encodeURI(ENV + 'Storm/Lightning 2/Storm2_Lightning_00000.png'), () => {}, () => console.warn('[strips] storm_bolt 2')),
    loadImage(encodeURI(ENV + 'Storm/Lightning 3/Storm3_Lightning_00000.png'), () => {}, () => console.warn('[strips] storm_bolt 3'))
  ]);

  // Timeline UI art (sprites/UI/): the deep-time bar/track, the playhead, and one marker per
  // eruption event (4 markers → the 4 eruptions, in chronological order). Handed to the HUD,
  // which stretches the bar across the axis, centres the playhead on the current year, and
  // stamps a marker at each eruption — falling back to the drawn line/dot/tick if any is
  // missing. Real failure callbacks — never a silent () => {} (CLAUDE.md §conventions).
  if (typeof InstallHUD !== 'undefined') {
    const UID = 'sprites/UI/';
    InstallHUD._tlBar      = loadImage(UID + 'Timeline_Bar.png',      () => {}, () => console.warn('Could not load Timeline_Bar.png'));
    InstallHUD._tlPlayhead = loadImage(UID + 'Timeline_Playhead.png', () => {}, () => console.warn('Could not load Timeline_Playhead.png'));
    InstallHUD._tlMarkers  = [1, 2, 3, 4].map(n =>
      loadImage(`${UID}Timeline_Marker_${n}.png`, () => {}, () => console.warn(`Could not load Timeline_Marker_${n}.png`)));
  }

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
  version: '0.3',

  // Reference height is always 1080; width is computed from window aspect ratio
  referenceHeight: 1080,

  // Canvas dimensions (set by recalculateLayout, defaults to 16:9). These are the
  // LOGICAL 1080-space dimensions everything is authored in (viewZoom, HUD, gallery).
  canvasWidth: 1920,
  canvasHeight: 1080,

  // ===== SPLIT-RESOLUTION PIPELINE =====
  // The backing canvas is spriteSupersample× the logical size, and a single global
  // scale(SS) in draw() renders sprites + HUD at that higher resolution (the source
  // PNGs carry 2-4× the detail — see the plant gallery). The TERRAIN, by contrast, is
  // composited into a 1080 offscreen buffer (Game._terrainLayer) and blitted up as one
  // quad, so its per-pixel cost — the season blit, water decals, washes and the
  // saturate() health filter — stays pinned at 1080. See draw()/Game.render().
  //   SS = 1 → exactly the old single-1080-canvas behaviour (safe fallback).
  //   SS = 2 → 4K-native sprites. ?sprites=1|2|3 overrides at startup.
  spriteSupersample: 2,

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

  pixelScale: 1, //dont fw
  zoom: 1,
  debugMode: false,

  // Elliptical drop shadows under entities (moa, eagle, kererū, egg, plants).
  // Off by default. The flight shadows (eagle, kererū) also sell height at 3/4 —
  // with this off, flying birds read flatter against the ground.
  drawShadows: false,

  // ===== PLAY AREA =====
  // mapGrid is the CELL BUDGET, not the width: the grid holds mapGrid² cells in
  // both terrain modes. This is the single most expensive number in the project —
  // the terrain bake is one pixel per cell, and each per-cell ecology field is one
  // float per cell.
  //
  // 512 preserves the existing plant/moa density tuning (the old portrait map was
  // ~432×768 = 332k cells; 512² = 262k). TEMANAWA_BUILD_V3.md §5.2 sets the
  // long-term limit at 256 — it can now drop to 256, retuning plantDensity and
  // spawn counts at the same time.
  mapGrid:256,

  // ===== TERRAIN FOOTPRINT MODE =====
  //   'square'  a mapGrid × mapGrid world, letterboxed into the panel. Predictable
  //             and matches square authored art, but on the 9:16 kiosk it leaves
  //             ~44% of the screen as background.
  //   'fit'     the world takes the screen's aspect at the SAME cell count, so it
  //             fills the panel edge to edge for the same simulation cost.
  //             1080×1920 -> 384×682 cells. See TerrainGenerator.gridFor().
  //
  // Switching costs a full terrain rebuild (~1 s), so it is a startup/authoring
  // decision, not something to toggle mid-run. `?terrain=fit` on the URL and
  // SHIFT+F both go through Game.setTerrainFit().
  terrainFit: 'fit',

  // Past this aspect ratio 'fit' stops stretching the world and letterboxes the
  // remainder. The coastline banding in getIslandFalloff() runs along X and stops
  // reading much past 2:1.
  terrainFitMaxStretch: 2.0,

  // Debounce on resize-triggered refits, ms. A refit is a full init(), so this
  // must outlast a drag-resize; the kiosk never resizes at all.
  terrainFitResizeDelay: 400,

  // ===== VIEW TRANSFORM =====
  // The transform the world actually renders through. Normal mode mirrors
  // gameAreaX/Y + zoom; fullscreen mode scales the map to fill the canvas.
  // Written by Game._updateViewTransform() — read, never set, elsewhere.
  fullscreen: true,   // the installation has no windowed mode
  viewX: 0,
  viewY: 180,
  viewZoom: 2.5,

  // Terrain morph (deep-time land change). The driver in Game.update re-bakes the
  // land as yearsBP advances so ranges rise and the gorge deepens. The re-bake is
  // INCREMENTAL (TerrainGenerator.morphBegin/morphStep): each frame spends at most
  // morphBudgetMs on it, into back buffers that swap in when finished, so the
  // visitor path never hitches. At the default budget a morph completes in
  // ~30-60 frames — well inside morphMinMs before the next one can start.
  morphEnabled: true,
  morphIntervalYears: 12000,   // re-bake once yearsBP has drifted this far from the baked land
  morphMinMs: 1100,           // ...and at least this long since the last morph re-bake (throttle)
  morphBakeScale: 2,          // supersample for morph re-bakes (the original baseline). Baked below the
                              //   camera zoom (~3), so a re-bake buffer is MAGNIFIED on screen — terrain.render()
                              //   now draws a magnified buffer NEAREST-NEIGHBOUR (crisp), never smoothed (which
                              //   is what made it blurry). This is the SAME resolution the land already dropped
                              //   to on the first morph before, so no new detail loss and no extra bake cost.
                              //   Going lower (1) magnifies harder → chunky; matching LOOK.bakeScale (3) keeps
                              //   full detail but makes each morph bake ~2.25x pricier (MORE stutter). Neither
                              //   the machine-independent transfer cost changes here. The zero-compromise
                              //   stutter cut is structural: bake only the visible glacial phase per morph, not
                              //   all four — see md/TEMANAWA_TERRAIN_PLAN.md.
  morphBudgetMs: 3,           // per-frame time slice for the incremental re-bake (60fps frame = 16.6ms)
  morphFadeMs: 600,           // crossfade for the on-screen buffer swap (floored at 500ms — photosensitivity)

  col_UI: [40, 70, 30, 180],
  col_panelBg: [25, 35, 30, 240],
  col_panelBorder: [60, 90, 70],
  col_panelHeader: [45, 75, 55],

  showContours: false,   // retired: biome-boundary ink (levelDef.biomes[].outlineColor) replaces topo contours (34VIEW §7)
  contourInterval: 0.5,
  showLabels: false,
  showDebug: false,

  // PER-ENTITY UI
  // OFF by default
  //
  // Renamed showEntityUI from showHungerBars
  showEntityUI: false,

  // CLIMATE-AFFINITY AUTHORING TINT. When on, flora and fauna are washed by which phase
  // favours them — amber = interglacial-boosted (warm), blue = glacial-boosted (cold),
  // untinted = neutral (see ClimateAffinity / CLIMATE_TINT in TeManawa_entity_sprites.js).
  // OFF on the wall (kiosk input is locked to 1-5); toggled with the C key. The tint is
  // BAKED once per frame+colour (TintBaker), so it costs nothing per frame once warm and
  // nothing at all while off — the classify + swap is skipped entirely when this is false.
  showClimateAffinity: false,

  // ===== FAUNA MOTION / ANIMATION / DIET =====
  // Three independent global knobs on the cast, all read in the entity code (Boid.update / Moa /
  // Kereru). Deep-time life events (aging, breeding) ride their own warped clock and are unaffected.
  //
  //   faunaTimeScale — multiplier on TRAVEL speed (position integration in Boid.update). 1 = wall-
  //     clock, 0.5 = half-speed. The calm-diorama pace knob; the cast read ~2x too fast at 1.0.
  //
  //   faunaAnimScale — multiplier on the CEL ANIMATION cadence (animTime in Boid.update). 1 = the
  //     authored rate, 0.5 = each walk/eat/wingbeat cycle takes 2x longer. Kept separate from
  //     travel so the two can be tuned apart; at 0.5 the animation slows to match the slowed body
  //     (no "fast legs on a slow shuffle"). The cel index is floor(animTime*rate), so slowing this
  //     still plays through EVERY frame in order — it never skips or drops frames.
  //
  //   faunaNutritionScale — multiplier on the hunger relief PER feeding (Moa grazing + feeders,
  //     Kereru fruit). 2.5 = eating is 2.5x more nourishing, so a bird that now spends a full
  //     (longer) eating cycle planted per meal still stays fed.
  faunaTimeScale: 0.5,
  faunaAnimScale: 0.5,
  faunaNutritionScale: 2.5,

  // ===== LEVEL-VARIABLE PARAMS (written by loadLevel) =====
  noiseScale: 0.005,
  octaves: 3,
  persistence: 0.3,
  lacunarity: 3.0,
  ridgeInfluence: 1.3,
  elevationPower: 1.5,
  islandFalloff: 0.6,
  plantDensity: 0.001,
  // Zoom the GENERATED WORLD out so more terrain area is visible on screen (the camera
  // cover-fit is unchanged). 1 = off; 1.25 shows ~25% more area on all sides. The geo
  // skeleton + coast + noise all scale down together (no stretching), and plant density
  // scales by this so the world stays as lush. See TerrainGenerator (_viewF) / spawnPlants.
  viewAreaGain: 1,

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
  // Renders full-bleed at ANY aspect.
  // SHORT side of the canvas is pinned to referenceHeight and the long side follows the
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
// LEVEL MECHANICS 
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
  // A level may prefer one footprint mode, but a mode already chosen by URL or by
  // hand wins — otherwise loadLevel would silently undo it.
  if (levelDef.terrainFit != null && !CONFIG._terrainFitPinned) {
    CONFIG.terrainFit = levelDef.terrainFit;
  }
  // Glacial phases warm→cold. The manager re-derives its phase from the deep-time
  // glacial index every frame, so this only sets the pre-first-update seed.
  const _phaseOrder = ['interglacial', 'cooling', 'glacial', 'fullGlacial'];
  CONFIG.startSeasonIndex = levelDef.startSeason ? Math.max(0, _phaseOrder.indexOf(levelDef.startSeason)) : 0;

  const t = levelDef.terrain;
  CONFIG.noiseScale = t.noiseScale;
  CONFIG.octaves = t.octaves;
  CONFIG.persistence = t.persistence;
  CONFIG.lacunarity = t.lacunarity;
  CONFIG.ridgeInfluence = t.ridgeInfluence;
  CONFIG.elevationPower = t.elevationPower;
  CONFIG.islandFalloff = t.islandFalloff;
  if (t.geoBaseCeil != null) CONFIG.geoBaseCeil = t.geoBaseCeil;   // skeleton: procedural base ceiling (see terrain.js)
  if (t.geoEdgeMargin != null) CONFIG.geoEdgeMargin = t.geoEdgeMargin;   // skeleton: N/S edge falloff (see terrain.js)
  CONFIG.geoTopMargin = (t.geoTopMargin != null) ? t.geoTopMargin : t.geoEdgeMargin;   // skeleton: TOP (far) edge falloff — thin so the north up-ramp fills the far edge (see terrain.js)
  CONFIG.viewAreaGain = (t.viewAreaGain != null) ? t.viewAreaGain : 1;   // zoom the generated world out to show more area (see terrain.js _viewF)

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
// PRE-CACHED COLORS (UI Palette)
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
    description: "Food with seasonal boost",
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
    description: "Distracts hunting eagles (10s cooldown)",
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
    description: "Slows hunger rate and provides security",
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
    description: "Year-round food and light cover",
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
// HABITAT HEALTH — the "quiet saturation" health readout
// ============================================
// A single scene-wide scalar (Game._habitatHealth, 0..1) drives how saturated the GROUND
// looks: a healthy habitat shows its full authored colour; a mismanaged one quietly drains
// toward SAT_FLOOR (never full grey — museum-ambient, not alarming). See
// md/TEMANAWA_INTERACTION_HEALTH_PLAN.md. Authored here so weights live in ONE place.
//
// The health target combines an ASH-disturbance term (1 − _ashCover; an eruption greys the
// ground, it recovers as the ash decays) with a REGIME-FIT term (step 2 — the split FOREST /
// TUSSOCK growth buttons; forcing the wrong cover for the current climate drains it). Steps
// 3–4 add a recruitment term (kererū seed dispersal). An undisturbed, well-managed map reads
// full health, so the default look is untouched.
const HEALTH = {
  satFloor:         0.35,  // H=0 → saturate(0.35). Ground desaturates but keeps some colour.
  healthEase:       0.02,  // per-frame ease of _habitatHealth toward its target (dt=1). Slow = calm.
  satSlewPerFrame:  0.01,  // HARD cap on the saturate() change per frame — the photosensitivity
                           //   backstop. 0.01/frame ≈ 0.6/s → a full 1.0→floor swing takes ~1.1 s
                           //   (>500 ms, ≤3 luminance transitions/s; CLAUDE.md, BUILD_V3 §5.2).
  groundOnly:       true,  // desaturate only the baked ground blit, not water/entities.

  // Step 2 — regime fit: is the growth the visitor is forcing right for the current climate?
  // Warm (FOREST) growth suits the interglacial, cold (TUSSOCK) growth suits the glacial. A
  // mismatched press drains fit toward the floor; a matched press restores it; idle relaxes it
  // back. Fit multiplies into the health target, so a wrong press quietly desaturates the land.
  regimeFitFloor:     0.20,   // how far a sustained wrong-climate press can drain regime fit
  regimeMismatchRate: 0.012,  // per-frame ease of fit toward the floor while mis-pressing
  regimeMatchRate:    0.010,  // per-frame ease of fit toward 1 while pressing the right one
  regimeRelaxRate:    0.004,  // per-frame ease of fit back toward 1 when no growth button is held

  // Step 3 — recruitment: in the interglacial the forest should be regenerating via kererū
  // seed dispersal. If there are no kererū to do it, recruitment stalls and the forest thins,
  // so R falls; in the glacial the forest isn't recruiting anyway, so R relaxes back (no
  // penalty). The STORM-overuse coupling that also stalls it lands in step 4.
  recruitFloor:       0.35,   // how far stalled recruitment can drain the term
  recruitDrainRate:   0.006,  // per-frame ease toward the floor while recruitment is stalled
  recruitRecoverRate: 0.010   // per-frame ease back toward 1 while recruitment can proceed
};
if (typeof window !== 'undefined') window.HEALTH = HEALTH;   // live-tunable in the console, like LOOK / TM_TIME

// ============================================
// SAND FLUX — the coastal dune engine (TEMANAWA_ECOLOGY_COAST.md §10)
// ============================================
// "Wind is not an event, it's the background field." The NW wind is ALWAYS on and never changes
// direction; its STRENGTH rises non-linearly into a glacial (§10D). sandFlux = windStrength ×
// exposedSandFraction, and the whole dune system is one feedback line: vegetation cover REDUCES
// sand flux, sand flux BURIES vegetation (§10A). We express that with the machinery already here:
//   • windStrength   ← the glacial index (seasonManager.getWinterness()).
//   • exposedSand     ← climate openness (cold = thin cover) + the disturbance the visitor drives
//                       (wrong FOREST/TUSSOCK regime, eruption ash, storm spam).
//   • burial          ← wind × the DISTURBANCE part only, drained from habitat health. Keying it to
//                       disturbance (not the climate baseline) keeps "well-managed + undisturbed =
//                       full health" intact, while mismanagement bites hardest when the wind is up.
// Game._sandFlux (0..1) is the physical quantity, eased slowly and mirrored onto terrain._sandFlux
// for a future bake-reach hook (an active field surging the sand colour further inland).
const SANDFLUX = {
  windBase:     0.35,   // baseline NW wind strength (always on) — even a warm interglacial has some flux
  windGamma:    1.6,    // wind rises NON-linearly into a glacial: windStrength = windBase + (1−windBase)·winterness^γ
  openBase:     0.55,   // bare-sand exposure from CLIMATE alone at full glacial (thin cold cover); 0 in the interglacial
  wRegime:      0.60,   // extra exposure when the WRONG cover is forced for the climate (× (1 − regimeFit))
  wAsh:         0.50,   // extra exposure from eruption ash stripping the cover (× ashCover)
  wStorm:      0.50,   // transient exposure spike from storm pressure — "advance the dune a step" (§10B; × _stormPressure)
  ease:         0.03,   // per-frame ease of _sandFlux toward its target (dt=1). Slow = a calm, deep-time drift.
  burialWeight: 0.18    // how hard an ACTIVE, mismanaged dunefield drains habitat health (sand burying coastal veg, §10C)
};
if (typeof window !== 'undefined') window.SANDFLUX = SANDFLUX;

// ============================================
// STORM habitat effects (TEMANAWA_ECOLOGY_COAST.md §10B–C)
// ============================================
// "A storm winds the succession clock backwards, and it does so unevenly." One button, a
// different effect by HABITAT and SPECIES (Game.applyStormToPlants, fired once per press):
//   • snap the inland EMERGENTS — tall canopy podocarps/beech catch the wind and are thrown;
//   • salt-burn + bury the seaward margin — low coastal plants, ASYMMETRIC by species (§10C):
//       soft, non-rhizomatous species are knocked back; hardy open/dune binders ride it out.
// (The dune "advance a step" + blow-out exposure land through the sand-flux surge, already wired
// to _stormPressure; foredune binders like spinifex/pīngao are colour, not entities, so §10C's
// "thrives on burial" maps onto the hardy open species that DO exist.) Scaled by wind strength,
// so a glacial gale bites hardest (§10D). Live-tunable, like HEALTH / SANDFLUX.
const STORM_EMERGENT = new Set(['Totara', 'kahikatea', 'tawa', 'beech']);                 // killed when tall (leave gaps)
const STORM_HARDY    = new Set(['tussock', 'flax', 'manuka', 'matagouri', 'speargrass', // ride it out / thrive (§10C)
                                'patotara', 'coprosma', 'dracophyllum']);
const STORM_SOFT     = new Set(['cabbagetree', 'kowhai', 'nikau', 'fern', 'kawakawa', 'lancewood']); // buried out (§10C)
const STORMFX = {
  coastalHi:         0.24,  // elevation below which a plant sits in the salt-burn / dune-slack seaward zone
  coastalDmg:        0.85,  // peak coastal storm damage (salt-burn + lee burial) right at the waterline
  emergentDmg:       0.60,  // peak windthrow damage to a fully-grown inland emergent (the 1936 gale "halved" them)
  emergentMinGrowth: 0.50,  // only trees taller than this catch the wind; short ones ride it out
  killThresh:        0.50,  // windthrow damage above this UPROOTS an emergent (alive=false → regrows) vs a growth knockback
  softVuln:          1.00,  // salt/burial vulnerability of soft, non-rhizomatous species (§10C buried out)
  midVuln:           0.50,  // default species vulnerability
  hardyVuln:         0.12,  // rhizomatous binders / cold-hardy open species — ride out the storm (§10C thrive/tolerate)
  minGrowth:         0.08,  // growth floor after a knockback (never fully to zero unless an emergent is uprooted)
  // Gradual delivery (beginStorm / _stormStepPlants): the damage a press USED to do
  // in one jarring frame is now scheduled across the storm window, and softened, so
  // the storm reads as rising wind that thins the canopy over its course.
  throwScale:        0.38,  // an exposed emergent's windthrow chance is scaled by this (fewer trees actually snap — a few over the storm, not the whole canopy at once)
  knockScale:        0.55,  // a non-thrown plant's growth knock = growth × (1 − dmg×knockScale) (a gentler wilt)
  spreadFrac:        0.85,  // hits are scattered uniformly across this fraction of the storm window
  swayBoost:         2.4,   // extra leaf sway while the storm blows (× the base sway amplitude)
  warpRadius:        55     // world-radius of the warp §9 stamped at each thrown/knocked plant, so the storm gap grows back over the ~2 s aftermath beat
};
if (typeof window !== 'undefined') window.STORMFX = STORMFX;

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
    this.water = null;        // animated water overlay (TeManawa_water.js); built with the terrain
    this._bakedYearsBP = 0;   // yearsBP the terrain was last (re)baked at — drives the morph
    this._lastMorphMs = 0;
    this.simulation = null;
    this.ui = null;
    this.seasonManager = null;

    this.playTime = 0;
    this.timeScale = 1;

    this.notifications = [];

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

    // Register the biomes that are actually about to render, so REGISTRY and
    // TerrainGenerator cannot disagree. Then check the bands, because an
    // unreachable band is the other way a colour edit does nothing.
    for (const [key, def] of Object.entries(this.activeBiomes)) {
      REGISTRY.registerBiome(key, def);
    }
    validateBiomeBands(this.activeBiomes);

    this.init();
  }

  // Full build: new terrain (noise + season bakes) AND a new ecosystem.
  // Expensive; 200ms+ @ mapGrid 512
  // TerrainGenerator.generate() runs the noise over every cell and then bakes
  // four season buffers. Call this on first load and on a deliberate reseed;
  // attract loop uses soft regen, resetEcosystem()
  init() {
    
    if (!this.currentLevel) return;

    // Free the outgoing generator's season buffers. 
    // Without this, every reseed and every refit leaks four canvases. See TerrainGenerator.disposeBuffers()
    if (this.terrain && this.terrain.disposeBuffers) this.terrain.disposeBuffers();

    this.terrain = new TerrainGenerator(CONFIG, this.activeBiomes);
    this.seasonManager = new SeasonManager(CONFIG);
    this.terrain.setSeasonManager(this.seasonManager);

    // Configure the 3/4 projection from the level's authored K / liftFrac BEFORE
    // the bake — _bakeSeasonBuffer reads Projection.K / LIFT to displace the
    // relief. The terrain object already exists, so map dimensions are known.
    // Held on Projection, never on CONFIG (same rule as noiseScale).
    if (typeof Projection !== 'undefined') {
      const _proj = (this.currentLevel && this.currentLevel.projection) || {};
      Projection.configure({
        K: _proj.K,
        liftFrac: _proj.liftFrac,
        mapWidth: this.terrain.mapWidth,
        mapHeight: this.terrain.mapHeight
      });
      Projection.relief = true;   // the season bake below produces baked relief
    }

    this.terrain.generate();

    // Stamp the animated water overlay from the fresh geometry (river flow, eels,
    // sea shimmer). A full build only — never on the cheap resetEcosystem() path,
    // so the soft reset stays in its ~20 ms tier (§5.1).
    if (!this.water) this.water = new WaterLayer();
    this.water.build(this.terrain, (typeof DeepTime !== 'undefined') ? DeepTime.yearsBP : undefined);

    this._bakedYearsBP = (typeof DeepTime !== 'undefined') ? DeepTime.yearsBP : 0;

    this._updateViewTransform();

    this._buildSimulation();

    if (audioManager) audioManager.playBackground();
  }

  // ============================================
  // TERRAIN FOOTPRINT
  // ============================================
  // Switch between 'square' and 'fit' (see CONFIG.terrainFit). Pinned, so a
  // later loadLevel() cannot quietly override a mode chosen by hand.
  setTerrainFit(mode, pin = true) {
    if (mode !== 'square' && mode !== 'fit') return false;
    if (pin) CONFIG._terrainFitPinned = true;
    if (CONFIG.terrainFit === mode) return false;
    CONFIG.terrainFit = mode;
    return this.refitTerrain(true);
  }

  // Re-derive the grid from the current canvas and rebuild if it has moved.
  //
  // This is a full init(): new noise over every cell, four fresh season bakes,
  // and a new Simulation, because the spatial grids are sized from the terrain
  // dimensions. ~1 s, and the current ecosystem does not survive it. That is
  // acceptable precisely because the kiosk panel never changes size — this path
  // exists for authoring on a desktop window and for the startup derivation.
  // It must never be reachable from the attract loop.
  //
  // Returns true if it rebuilt.
  refitTerrain(force = false) {
    if (!this.currentLevel) return false;

    const want = TerrainGenerator.gridFor(CONFIG);
    const t = this.terrain;
    if (!force && t && t.mapWidth === want.cols && t.mapHeight === want.rows) {
      return false;               // same footprint — the view transform is enough
    }

    const from = t ? `${t.mapWidth}x${t.mapHeight}` : 'none';
    const t0 = (typeof performance !== 'undefined') ? performance.now() : 0;

    this.init();

    // A full init can block the main thread for several seconds (the terrain bake).
    // Stamp the kiosk heartbeat so a LEGITIMATE long rebuild is never mistaken for
    // a stall — otherwise a desktop resize (DevTools opening counts) triggers the
    // watchdog's hard reload right after the rebuild finishes.
    if (typeof Kiosk !== 'undefined' && Kiosk.beat) Kiosk.beat();

    const ms = ((typeof performance !== 'undefined') ? performance.now() : 0) - t0;
    console.log(`[Terrain] refit ${CONFIG.terrainFit}: ${from} -> ` +
                `${want.cols}x${want.rows} (${(want.cols * want.rows).toLocaleString()} cells, ` +
                `noiseScale ${want.noiseScale.toFixed(5)}) in ${ms.toFixed(0)}ms`);

    // Borrow the kiosk crossfade so the rebuild reads as a transition rather
    // than a hitch.
    if (typeof Kiosk !== 'undefined' && typeof millis === 'function') {
      Kiosk._fadeUntil = millis() + Kiosk.crossfadeMillis;
    }
    return true;
  }

  // Cheap rebuild: 
  // Retains terrain, baked buffers. Regenerates living entities.
  // see TEMANAWA_BUILD_V3.md §5.1. The land does not need to change
  // between visitors; only the ecosystem and the clock do.
  //
  // Fun fact: Terrain generation is ~95% of a full init()
  resetEcosystem() {
    if (!this.currentLevel || !this.terrain) { this.init(); return; }
    this._buildSimulation();
  }

  // Re-bake the terrain in place from the CURRENT look values (LOOK) and camera
  // tilt (Projection), keeping the same land (no reseed) and the same living
  // world (no ecosystem reset). This is the look-development path — bound to the
  // B key — so tuning LOOK in the browser console and pressing B shows the result
  // with no page reload. Authoring only; never reachable on the visitor path.
  rebakeTerrain() {
    if (!this.terrain) return;
    const t0 = (typeof performance !== 'undefined') ? performance.now() : 0;
    if (typeof Projection !== 'undefined') {
      Projection.configure({
        K: Projection.K, liftFrac: Projection.liftFrac,
        mapWidth: this.terrain.mapWidth, mapHeight: this.terrain.mapHeight
      });
    }
    this.terrain.generate();          // same seed → same land; re-applies all of LOOK + relief
    if (this.water) this.water.build(this.terrain, (typeof DeepTime !== 'undefined') ? DeepTime.yearsBP : undefined);   // re-stamp water for the re-baked land
    this._updateViewTransform();
    const ms = ((typeof performance !== 'undefined') ? performance.now() : 0) - t0;
    console.log(`[look] terrain re-baked in ${ms.toFixed(0)}ms — tune LOOK / Projection, press B again`);
    if (typeof LOOK !== 'undefined' && LOOK.dump) LOOK.dump();
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

    // Eruption ash state (disturb/regen, plan §2.1). A fresh living world carries no ash;
    // applyAsh() arms it after a rebuild when an eruption is being shown.
    this._ashCover = 0; this._ashFromYear = 0; this._ashDecayYears = 1; this._ashTier = null;
    this._ashCloudUntil = 0; this._ashCloudMode = 'tap';   // eruption sprite cover (InstallHUD.renderAshCloud)

    // Habitat-health readout (md/TEMANAWA_INTERACTION_HEALTH_PLAN.md). A fresh world starts
    // healthy and fully saturated; the signal follows ash + regime-fit, so an undisturbed,
    // well-managed world stays at full colour. Soft resets keep these (they ease on their
    // own), so only the full init() reseeds them.
    this._habitatHealth = 1; this._sceneSat = 1; this._regimeFit = 1; this._recruitment = 1;
    this._tussockFlush = false;   // TUSSOCK-in-glacial flush → open-country grazer lift (set in _updateHabitatHealth)
    this._stormPressure = 0; this._stormOveruse = false;
    this._sandFlux = 0; this._sandBurial = 0; this._duneSurge = 0;   // coastal dune engine (SANDFLUX / _updateSandFlux)

    // Which eruption years have already fired this cycle — so an eruption fires ONCE as the
    // clock crosses its checkpoint (auto), and again only after a rebuild repositions the
    // clock. Cleared here (every rebuild); applyAsh() adds a year when it fires.
    this._firedEruptions = new Set();
    // Previous frame's yearsBP, for crossing detection. Seed AT the current year (not above it)
    // so an eruption sitting exactly on the (re)start year does NOT auto-fire on boot — the run
    // opens on the calm ~1 Ma scene rather than an unbidden Kidnappers takeover (the sim self-
    // runs, so a forced opening eruption is unnecessary — user request). The mid-timeline events
    // (Kaukatea, Whakamaru) still fire as the clock crosses them; Kidnappers is still reachable
    // by a manual hold-wrap. applyEruptionAt overrides this to the target so a jump does not re-fire.
    this._autoPrevYear = (typeof DeepTime !== 'undefined') ? DeepTime.yearsBP : Infinity;
  }

  isInGameArea(mx, my) {
    if (CONFIG.fullscreen && this.terrain) {
      // Drawn height is the projected height (matches Game.render / view transform).
      const projH = (typeof Projection !== 'undefined')
        ? Projection.projectedWorldHeight() : this.terrain.mapHeight;
      return mx >= CONFIG.viewX &&
             mx < CONFIG.viewX + this.terrain.mapWidth * CONFIG.viewZoom &&
             my >= CONFIG.viewY &&
             my < CONFIG.viewY + projH * CONFIG.viewZoom;
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
      // Fill the screen with the terrain. Its on-screen size is
      // mapWidth × projectedWorldHeight (mapHeight·K + LIFT). Use a COVER fit
      // (max) so there is no letterbox; the modest overflow on the long axis is
      // clipped. Centred.
      //   The top `reliefCrop` of the buffer is empty relief headroom above the far
      //   ridge (the top rows are eased to plains) — sky/haze, not terrain. Cover-fit
      //   the REMAINING height and shift the view up by the crop so that headroom sits
      //   above the frame: the terrain then fills to the top instead of leaving a streak.
      //   `reliefCropBottom` is the near counterpart: the front rows are eased to plains
      //   and the front apron fills below them, which otherwise reads as a flat strip just
      //   above the HUD bottom bar. Subtract it too so that band sits BELOW the frame — the
      //   visible front edge becomes a normal terrain row. (Top shift stays `crop·z`; the
      //   bottom band falls off-frame because the fit height loses `cropB`.)
      const projH = (typeof Projection !== 'undefined')
        ? Projection.projectedWorldHeight() : this.terrain.mapHeight;
      const crop  = (typeof Projection !== 'undefined') ? Projection.reliefCrop() : 0;
      const cropB = (typeof Projection !== 'undefined')
        ? Projection.reliefCropBottom(CONFIG.geoEdgeMargin || 0) : 0;
      const fitH = Math.max(1, projH - crop - cropB);
      const z = Math.max(CONFIG.canvasWidth / this.terrain.mapWidth,
                         CONFIG.canvasHeight / fitH);
      CONFIG.viewZoom = z;
      CONFIG.viewX = Math.round((CONFIG.canvasWidth - this.terrain.mapWidth * z) / 2);
      CONFIG.viewY = Math.round((CONFIG.canvasHeight - fitH * z) / 2 - crop * z);
      // World-space width of the off-screen overflow on EACH horizontal side. The COVER fit
      // (max) above scales the map up to fill the canvas, so when the projected height drives
      // the zoom the map runs wider than the screen and its left/right edges sit off-frame.
      // Flyers read this to turn back at the VISIBLE edge instead of the map edge — otherwise a
      // bird at a valid map-x near 0 / mapWidth is simply off-screen ("clips out of view"). 0
      // when the map is letterboxed (viewX ≥ 0 → no horizontal overflow).
      CONFIG.viewInsetX = (z > 0) ? Math.max(0, -CONFIG.viewX / z) : 0;
      // Vertical counterpart: the world-Y band that stays on-screen. On a portrait/tall
      // wall the cover fit crops the map top and bottom too, and the 3/4 relief LIFT
      // raises high ground (the northern ranges) off the TOP — so a spawn or target keyed
      // to the map rectangle lands off-frame (moa off the sides, the harrier off the top).
      // Worst-cased for elevation: viewInsetY keeps even a peak (which draws vz·LIFT higher
      // than flat ground) clear of the top margin; viewInsetYBottom keeps flat/coastal
      // ground clear of the bottom. Both in WORLD-Y, so the visible band is
      // [viewInsetY, mapHeight − viewInsetYBottom]. Consumers: findWalkablePosition (spawns)
      // and Eagle._visibleY (patrol/hunt/relocate targets).
      const H = CONFIG.canvasHeight;
      const K = (typeof Projection !== 'undefined' && Projection.K) ? Projection.K : 1;
      const LIFT = (typeof Projection !== 'undefined' && Projection.relief) ? Projection.LIFT : 0;
      const mh = this.terrain.mapHeight;
      if (z > 0) {
        const topM = 120, botM = 90;                                   // screen px kept clear of each edge
        const loY = (topM - CONFIG.viewY) / (z * K);                   // peak-safe top boundary (world-y)
        const hiY = ((H - botM - CONFIG.viewY) / z - LIFT) / K;        // flat-ground-safe bottom boundary
        CONFIG.viewInsetY       = Math.max(0, Math.min(loY, mh * 0.45));
        CONFIG.viewInsetYBottom = Math.max(0, Math.min(mh - hiY, mh * 0.45));
      } else {
        CONFIG.viewInsetY = 0; CONFIG.viewInsetYBottom = 0;
      }
    } else {
      CONFIG.viewZoom = CONFIG.zoom;
      CONFIG.viewX = CONFIG.gameAreaX;
      CONFIG.viewY = CONFIG.gameAreaY;
      CONFIG.viewInsetX = 0;
      CONFIG.viewInsetY = 0;
      CONFIG.viewInsetYBottom = 0;
    }
  }
  
  // Single source of truth: the Simulation caches population once per frame
  // (Simulation._ensurePopulationCache). Game used to walk moas+eggs a SECOND
  // time every frame in updateCachedCounts() — that duplicate walk is gone (#13);
  // this delegates to the one cache. _cachedThrivingCount/_cachedEggCount were
  // write-only (nothing read them), so they're gone too.
  getMoaPopulation() {
    return this.simulation.getMoaPopulation();
  }
  
  // Deep-time land morph: as yearsBP advances, re-bake the terrain so ranges rise and
  // the gorge deepens. The heightMap re-shape is cheap (geo cache); the bake is the
  // cost, so it is SLICED: morphBegin() stages a resumable job and each frame runs
  // morphStep(morphBudgetMs) until the back buffers swap in — no frame ever pays
  // more than the budget. The interval + throttle gate when a NEW job may start;
  // an in-flight job just keeps stepping. _bakedYearsBP is recorded at job START
  // (the job bakes toward that year regardless of where the clock drifts meanwhile).
  _morphTick() {
    if (!CONFIG.morphEnabled || !this.terrain || !this.terrain.geo || typeof DeepTime === 'undefined') return;
    if (this.terrain.morphInProgress) {
      if (this.terrain.morphStep(CONFIG.morphBudgetMs)) this._onMorphComplete();
      return;
    }
    const yb = DeepTime.yearsBP;
    const now = (typeof millis === 'function') ? millis() : Date.now();
    if (TerrainGenerator.shouldMorphBake(yb, this._bakedYearsBP, now, this._lastMorphMs,
                                         CONFIG.morphIntervalYears, CONFIG.morphMinMs)) {
      this.terrain.morphBegin(yb, CONFIG.morphBakeScale);
      this._bakedYearsBP = yb;
      this._lastMorphMs = now;
      if (this.terrain.morphStep(CONFIG.morphBudgetMs)) this._onMorphComplete();
    }
  }

  // A deep-time morph re-bake just finished: the coastline has moved (the marine embayment
  // receded, or a strait pulse flooded) and the gorge deepened, so both the living world and
  // the animated water overlay must follow the NEW land. Runs at most once per CONFIG.morphMinMs
  // (a completed job — never per frame) and always trails a full 4-buffer season bake, so it is
  // far from the frame budget; update()/render() stay allocation-free.
  //   · cullSubmergedPlants — drop plants the morph just put underwater
  //   · water.reconcile     — ADD/REMOVE sea/river decals against the morphed water map so sea
  //                           shimmer no longer lingers on cells that have emerged as dry land
  //                           (and freshly-drowned cells from a strait pulse gain shimmer), while
  //                           leaving every surviving decal exactly where it is. A full build()
  //                           (which re-scatters positions) is reserved for hard scene changes —
  //                           init / look re-bake / eruption.
  _onMorphComplete() {
    if (this.simulation) this.simulation.cullSubmergedPlants();
    if (this.water) this.water.reconcile(this.terrain, (typeof DeepTime !== 'undefined') ? DeepTime.yearsBP : undefined);
  }

  // ============================================
  // ERUPTION DISTURBANCE — ash clear + slow regen
  // ============================================
  // Land on an eruption event: rebuild the living world (soft regen — which resets the
  // clock, so re-seek AFTER), morph the terrain to that year under the ash flash,
  // then apply the ash clearing. The clock plays on and the land greens back as ash decays.
  // Used by the Eruption button for BOTH revert (previous event) and skip (next event).
  applyEruptionAt(targetYear, eruption) {
    // ORDER MATTERS. Reshape the terrain to the target year BEFORE spawning the living
    // world, so plants (and moa) seed against the RIGHT biome map. Spawning first and
    // morphing after seeded them on the old land and stranded them in the NEW sea when a
    // skip/wrap jumped to a high-sea year like 1 Ma — the reported bug. spawnPlants()
    // already honours biome.canHavePlants; it just needs the correct map underneath it.
    if (typeof DeepTime !== 'undefined') DeepTime.seekTo(targetYear);
    if (this.terrain && this.terrain.morphTo) {                  // SYNCHRONOUS — finished before the spawn; the ash flash hides the hitch
      this.terrain.morphTo(targetYear, CONFIG.morphBakeScale);
      this._bakedYearsBP = targetYear;
      this._lastMorphMs = (typeof millis === 'function') ? millis() : Date.now();
    }
    if (this.water) this.water.build(this.terrain, targetYear);  // re-stamp water to the morphed sea/river (eels gated by targetYear)
    this.resetEcosystem();                                       // spawns against the morphed (target-year) biome map (also DeepTime.reset())
    if (typeof DeepTime !== 'undefined') DeepTime.seekTo(targetYear);   // ...so re-seek after the rebuild (§3.4)
    this.applyAsh(eruption);
    this._autoPrevYear = targetYear;                             // the auto-check must not re-fire the event we just placed
  }

  applyAsh(eruption) {
    const T = (typeof DeepTime !== 'undefined' && DeepTime.TIERS) || null;
    const tier = (T && eruption && T[eruption.tier]) || (T && T.major) || { clearFraction: 0.6, decayYears: 18000 };
    this._ashCover = 1;
    this._ashFromYear = (typeof DeepTime !== 'undefined') ? DeepTime.yearsBP : 0;
    this._ashDecayYears = tier.decayYears || 18000;
    this._ashTier = eruption ? eruption.tier : 'major';
    const plants = this.simulation && this.simulation.plants;
    if (plants) {
      const PT = (typeof PLANT_TYPES !== 'undefined') ? PLANT_TYPES : null;
      const M = (typeof LEVEL_MECHANICS !== 'undefined') ? LEVEL_MECHANICS : null;
      const floorFrac = (M && M.eruptionPlantFloor != null) ? M.eruptionPlantFloor : 0.15;

      let aliveCount = 0;
      for (let i = 0; i < plants.length; i++) {
        if (plants[i] && plants[i].alive) aliveCount++;
      }
      const floor = Math.ceil(aliveCount * floorFrac);
      let killed = 0;
      const maxKills = aliveCount - floor;

      for (let i = 0; i < plants.length; i++) {
        const p = plants[i];
        if (!p || !p.alive) continue;
        if (killed >= maxKills) break;
        const def = PT ? PT[p.type] : null;
        let vuln = (def && def.ashVulnerability != null) ? def.ashVulnerability : 0.5;
        // The WETLAND is fertilised, not cleared (§6): tephra makes the swamps BLOOM, so the ash
        // spares most of the standing swamp while the forest above it is knocked back.
        if (p.biomeKey === 'wetland') vuln *= (M && M.wetlandAshSpare != null ? M.wetlandAshSpare : 0.25);
        if (Math.random() < tier.clearFraction * vuln) {
          p.alive = false; p.growth = 0; p.regrowthTimer = 0;
          killed++;
        }
      }
    }
    // WETLAND BLOOM (finding #4 — "ash makes the swamps bloom"): the tephra fertilises the wetland,
    // so as the ash clears the swamps SURGE with new growth (seedling burst + a local warp so they
    // grow in over the aftermath beat) rather than only dying back (§8/§6). The wetland biome now
    // exists, so the long-deferred bloom finally has a habitat to land on.
    const M2 = (typeof LEVEL_MECHANICS !== 'undefined') ? LEVEL_MECHANICS : null;
    if (this.simulation && this.simulation.bloomWetland)
      this.simulation.bloomWetland((M2 && M2.wetlandBloomCount) || 14);
    // §6 stage 5 — the SEDIMENT PULSE: ash-loaded catchments aggrade the river and lay fresh raw
    // alluvium, opening a kahikatea recruitment window (like the storm flood; wetland doc §4.1). So
    // the eruption ENDS by handing the river the material to make new swamp forest.
    if (this.simulation && this.simulation.recruitKahikatea)
      this.simulation.recruitKahikatea((M2 && M2.kahiRecruitEruption) || 8);
    if (eruption && this._firedEruptions) this._firedEruptions.add(eruption.yearsBP);
  }

  // Fire an eruption IN PLACE — the ambient-timeline path. No seek, no soft-regen (the
  // living world carries on): just the ash clearing on the current cast plus a gentle,
  // photosensitivity-safe ramped flash. Used by _checkAutoEruptions as the clock crosses
  // each checkpoint, so the visitor sees the eruptions happen without touching the button.
  // The full takeover — screen-shake rumble + the rolling ash-cloud sprite — fires here
  // too (same _ashCloudUntil window the button arms), so a timeline eruption reads as an
  // event, not just a quiet ground wash. The cover STARTS full and fades — no roll-in.
  _fireEruptionInPlace(eruption) {
    if (typeof TM_TIME !== 'undefined' && typeof millis === 'function') {
      const now = millis();
      this._tmAshUntil = now + TM_TIME.ashMillis;
      this._tmAshMode  = 'tap';                    // a single rise-and-fall, no charge, no strobe
      this._ashCloudUntil = now + TM_TIME.cloudMillis;   // rumble (shake) + ash-cloud sprite takeover
      this._ashCloudMode  = 'tap';
    }
    this.applyAsh(eruption);                        // ashCover + tiered knock-back; marks it fired
  }

  // Fire each eruption once, the frame the clock CROSSES its year while playing forward.
  // Crossing (not "clock is past it") is the point: `e in [y, prev)` only catches events the
  // clock stepped over THIS frame, so events already behind the playhead are not re-fired.
  // A backward jump (revert) or pause is skipped; the fired-set is the once-per-cycle guard.
  _checkAutoEruptions() {
    if (typeof DeepTime === 'undefined' || !this._firedEruptions || !DeepTime.ERUPTIONS) return;
    const y = DeepTime.yearsBP;
    const prev = (this._autoPrevYear != null) ? this._autoPrevYear : y;
    this._autoPrevYear = y;                          // always advance, even when we skip below
    if (!(y < prev)) return;                          // clock did not move forward this frame
    const ER = DeepTime.ERUPTIONS;
    for (let i = 0; i < ER.length; i++) {
      const e = ER[i].yearsBP;
      if (e < prev && e >= y && !this._firedEruptions.has(e)) {
        // Give the timeline eruption the SAME ~5 s charge ramp as holding the button — arm
        // _tmAutoErAt (INDEPENDENT of the button's _tmErDownAt) so the flash builds, the ash
        // cloud rolls down and the ground rumbles over erLongPressMs, then InstallHUD.update()
        // rings it out and fires IN PLACE (no seek/reseed). Mark it fired NOW so the crossing
        // guard can't re-trigger it mid-ramp. If a charge is already running (a manual hold, or
        // two events cross close together under fast-forward), fire this one instantly instead.
        this._firedEruptions.add(e);
        if (!this._tmAutoErAt && !this._tmErDownAt) {
          this._tmAutoErAt = millis(); this._tmAutoErupt = ER[i];
        } else {
          this._fireEruptionInPlace(ER[i]);   // a charge (auto or manual) already running → fire instantly, don't stack
        }
      }
    }
  }

  // Ash clears over decayYears of SIM time (yearsBP falls as the run plays), so the land
  // greens back on its own. Called each frame from update().
  updateAshCover() {
    if (this._ashCover > 0 && typeof DeepTime !== 'undefined' && this._ashDecayYears > 0) {
      const elapsed = this._ashFromYear - DeepTime.yearsBP;      // yearsBP decreases as time runs
      const t = elapsed / this._ashDecayYears;
      this._ashCover = t >= 1 ? 0 : (t < 0 ? this._ashCover : 1 - t);
    }
  }

  // SAND FLUX model (TEMANAWA_ECOLOGY_COAST.md §10A/§10D) — pure, so tools/bootcheck.js can
  // assert its monotonicities. windStrength rises non-linearly with the glacial index; exposed
  // sand = climate openness + visitor-driven disturbance; flux = wind × exposed; `excess` is the
  // DISTURBANCE-only exposure (what the visitor is responsible for), used for the burial drain so
  // a well-managed, undisturbed map is never penalised regardless of climate.
  // Fixed NW wind (TEMANAWA_ECOLOGY_COAST.md §1) — always on, strength rising non-linearly with
  // the glacial index. Shared by the sand-flux model and the storm's habitat effects. Pure.
  static _windStrength(winterness, cfg) {
    let w = winterness; if (w < 0) w = 0; else if (w > 1) w = 1;
    return cfg.windBase + (1 - cfg.windBase) * Math.pow(w, cfg.windGamma);
  }

  static _sandFluxModel(winterness, regimeFit, ashCover, stormPressure, cfg) {
    let w = winterness; if (w < 0) w = 0; else if (w > 1) w = 1;
    const wind = Game._windStrength(w, cfg);
    const fit = (regimeFit == null) ? 1 : (regimeFit < 0 ? 0 : regimeFit > 1 ? 1 : regimeFit);
    let excess = cfg.wRegime * (1 - fit) + cfg.wAsh * (ashCover || 0) + cfg.wStorm * (stormPressure || 0);
    if (excess < 0) excess = 0; else if (excess > 1) excess = 1;
    let exposed = cfg.openBase * w + excess;
    if (exposed < 0) exposed = 0; else if (exposed > 1) exposed = 1;
    let flux = wind * exposed;
    if (flux < 0) flux = 0; else if (flux > 1) flux = 1;
    return { wind, exposed, excess, flux };
  }

  // Ease _sandFlux toward the model target and compute the burial drain that closes the
  // sand↔vegetation loop into the habitat-health readout. Runs AFTER updateAshCover (reads
  // _ashCover) and BEFORE _updateHabitatHealth (which reads _sandBurial). Allocation-free.
  _updateSandFlux(dt) {
    const C = (typeof SANDFLUX !== 'undefined') ? SANDFLUX : null;
    if (!C) return;
    if (this._sandFlux == null) this._sandFlux = 0;
    if (this._duneSurge == null) this._duneSurge = 0;
    const wint = (this.seasonManager && this.seasonManager.getWinterness) ? this.seasonManager.getWinterness() : 0;
    const m = Game._sandFluxModel(wint, this._regimeFit, this._ashCover, this._stormPressure, C);
    const e = C.ease * (dt || 1); const k = e > 1 ? 1 : e;
    this._sandFlux += (m.flux - this._sandFlux) * k;
    if (this._sandFlux < 0) this._sandFlux = 0; else if (this._sandFlux > 1) this._sandFlux = 1;
    // Disturbance-driven, wind-scaled sand mobilisation — the quantity that BOTH buries coastal
    // vegetation (drained from health) AND surges the sand-colour reach inland at the next re-bake.
    // Eased so a re-bake samples a calm value; 0 on a managed, undisturbed coast (any climate).
    const surge = m.wind * m.excess;
    this._duneSurge += (surge - this._duneSurge) * k;
    if (this._duneSurge < 0) this._duneSurge = 0; else if (this._duneSurge > 1) this._duneSurge = 1;
    this._sandBurial = C.burialWeight * surge;
    // Mirror onto the terrain: _sandFlux (debug readout) + _duneSurge (read at bake time to extend the reach).
    if (this.terrain) { this.terrain._sandFlux = this._sandFlux; this.terrain._duneSurge = this._duneSurge; }
  }

  // STORM damage to ONE plant (0..1), by habitat + species (TEMANAWA_ECOLOGY_COAST.md §10B–C).
  // Two channels, the worse one wins: (A) snap inland EMERGENTS — tall canopy trees catch the wind;
  // (B) salt-burn + lee burial on the low seaward margin, asymmetric by species (soft buried out,
  // hardy binders ride it out). Scaled by wind strength, so a glacial gale bites hardest. Pure, so
  // tools/bootcheck.js can assert the asymmetry (emergent-tall > soft-coastal > hardy > inland/short).
  static _stormPlantDamage(type, growth, elevation, wind, cfg) {
    let dmg = 0;
    // (A) snap the inland emergents — only trees taller than emergentMinGrowth catch the wind.
    if (STORM_EMERGENT.has(type) && growth > cfg.emergentMinGrowth) {
      const tall = (growth - cfg.emergentMinGrowth) / (1 - cfg.emergentMinGrowth);
      const d = cfg.emergentDmg * tall * wind;
      if (d > dmg) dmg = d;
    }
    // (B) coastal salt-burn + lee burial — strongest at the waterline, fading up/inland; by species.
    if (elevation < cfg.coastalHi) {
      let zone = 1 - elevation / cfg.coastalHi; if (zone < 0) zone = 0;
      const vuln = STORM_HARDY.has(type) ? cfg.hardyVuln : (STORM_SOFT.has(type) ? cfg.softVuln : cfg.midVuln);
      const d = cfg.coastalDmg * zone * vuln * wind;
      if (d > dmg) dmg = d;
    }
    return dmg > 1 ? 1 : dmg;
  }

  // Apply one storm's habitat effects across the plant field (fired once per STORM press, from the
  // HUD button). Emergents past killThresh are windthrown (alive=false → they regrow, leaving a
  // canopy gap); everything else is knocked back down the succession clock. Allocation-free; uses
  // random() for the windthrow roll (a one-shot impulse, never on the morph/determinism path).
  // Gradual storm (the visitor button). Rather than snapping every exposed tree in
  // one frame (the old instant applyStormToPlants), roll each plant's fate ONCE at
  // press — softened (fewer windthrows, gentler knockbacks) — then SCHEDULE it at a
  // random moment across the storm window. _stormStepPlants applies the due hits and
  // drives the sway envelope, so the storm reads as rising wind thinning the canopy
  // over its course instead of a jarring instantaneous break.
  beginStorm() {
    const C = (typeof STORMFX !== 'undefined') ? STORMFX : null;
    if (!C || !this.simulation || !this.simulation.plants) return;
    const wint = (this.seasonManager && this.seasonManager.getWinterness) ? this.seasonManager.getWinterness() : 0;
    const wind = Game._windStrength(wint, (typeof SANDFLUX !== 'undefined') ? SANDFLUX : { windBase: 0.35, windGamma: 1.6 });
    const now = (typeof millis === 'function') ? millis() : 0;
    const dur = ((typeof TM_TIME !== 'undefined' ? TM_TIME.stormSeconds : 20) * 1000) * (C.spreadFrac ?? 0.85);
    const hits = this._stormHits || (this._stormHits = []);
    hits.length = 0;
    const plants = this.simulation.plants;
    for (let i = 0; i < plants.length; i++) {
      const p = plants[i];
      if (!p || !p.alive) continue;
      const dmg = Game._stormPlantDamage(p.type, p.growth, p.elevation, wind, C);
      if (dmg <= 0.02) continue;
      let kind = null, mul = 1;
      if (STORM_EMERGENT.has(p.type) && dmg > C.killThresh && Math.random() < dmg * (C.throwScale ?? 0.30)) {
        kind = 'throw';                                   // this emergent will be windthrown — later, not now
      } else if (Math.random() < dmg) {                   // only SOME plants are knocked (not the whole canopy)
        kind = 'knock'; mul = 1 - dmg * (C.knockScale ?? 0.55);
      }
      if (kind) hits.push({ p, at: now + Math.random() * dur, kind, mul });
    }
    // §7: inland the storm is a FLOOD — it scours the river and lays fresh silt, opening raw
    // recruitment ground for kahikatea (the swamp-forest disturbance coloniser, wetland doc §4.1).
    const M = (typeof LEVEL_MECHANICS !== 'undefined') ? LEVEL_MECHANICS : null;
    if (this.simulation.recruitKahikatea) this.simulation.recruitKahikatea((M && M.kahiRecruitStorm) || 8);
  }

  // Per-frame: apply any storm hits now due, and ease the leaf-sway envelope up while
  // the storm blows / down after. _stormSway (0..1) is read by Plant render for the
  // extra sway. Called from update(); cheap (a short scheduled list + one lerp).
  _stormStepPlants(dt = 1) {
    const now = (typeof millis === 'function') ? millis() : 0;
    const active = this._tmStormUntil && now < this._tmStormUntil;
    const target = active ? 1 : 0;
    this._stormSway = (this._stormSway || 0) + (target - (this._stormSway || 0)) * Math.min(1, 0.04 * dt);
    if (this._stormSway < 0.001) this._stormSway = 0;

    const hits = this._stormHits;
    if (!hits || !hits.length) return;
    const C = (typeof STORMFX !== 'undefined') ? STORMFX : { minGrowth: 0.08 };
    let w = 0;
    for (let i = 0; i < hits.length; i++) {
      const hIt = hits[i];
      if (now < hIt.at) { hits[w++] = hIt; continue; }    // not due yet — keep it queued
      const p = hIt.p;
      if (p && p.alive && !p._consumed) {
        if (hIt.kind === 'throw') { p.alive = false; p.growth = 0; p.regrowthTimer = 0; }   // windthrown — regrows from bare
        else { const g = p.growth * hIt.mul; p.growth = g < C.minGrowth ? C.minGrowth : g; }
        if (this.simulation && this.simulation.disturb)                                     // warp §9: the thrown/knocked spot grows back into the storm over the aftermath beat
          this.simulation.disturb(p.pos.x, p.pos.y, C.warpRadius || 55, 'gale', 1);
      }
      // applied (or the plant is already gone) → drop it by not copying forward
    }
    hits.length = w;
  }

  applyStormToPlants(strength = 1) {
    const C = (typeof STORMFX !== 'undefined') ? STORMFX : null;
    if (!C || !this.simulation || !this.simulation.plants) return 0;
    const wint = (this.seasonManager && this.seasonManager.getWinterness) ? this.seasonManager.getWinterness() : 0;
    const wind = Game._windStrength(wint, (typeof SANDFLUX !== 'undefined') ? SANDFLUX : { windBase: 0.35, windGamma: 1.6 });
    const plants = this.simulation.plants;
    let thrown = 0, knocked = 0;
    for (let i = 0; i < plants.length; i++) {
      const p = plants[i];
      if (!p || !p.alive) continue;
      const dmg = Game._stormPlantDamage(p.type, p.growth, p.elevation, wind, C) * strength;
      if (dmg <= 0.001) continue;
      if (STORM_EMERGENT.has(p.type) && dmg > C.killThresh && Math.random() < dmg) {
        p.alive = false; p.growth = 0; p.regrowthTimer = 0; thrown++;   // windthrown — regrows from bare
      } else {
        const g = p.growth * (1 - dmg);
        p.growth = g < C.minGrowth ? C.minGrowth : g;
        knocked++;
      }
    }
    return thrown + knocked;
  }

  // Habitat health → the "quiet saturation" readout. Eases _habitatHealth toward a target,
  // then slews _sceneSat (the live saturate() factor) toward the mapped target with a hard
  // per-frame cap so a whole-scene colour change can never land as a cut (photosensitivity).
  // md/TEMANAWA_INTERACTION_HEALTH_PLAN.md §1, §5. Allocation-free (hot path).
  //
  // Health = ash disturbance × regime fit × recruitment. The ash term is grazing-
  // independent and reads exactly 0 on an undisturbed map, so the DEFAULT look is
  // untouched (health=1 → saturate(1) → the filter is never even set). An eruption
  // greys the land (ashCover→1 → health→0 → the ground desaturates) and it recovers
  // as the ash decays. Health is NOT a living-cover ratio — that was tried and
  // desaturated healthy maps as moa grazed; see MISTAKES.md.
  _updateHabitatHealth(dt) {
    const H = (typeof HEALTH !== 'undefined') ? HEALTH : null;
    if (!H) return;

    // --- Regime fit: the split-growth lesson. FOREST (warm) growth suits the
    // interglacial, TUSSOCK (cold) growth suits the glacial. A mismatched press drains fit
    // toward the floor; a matched press restores it; idle relaxes it back toward 1. ---
    const nowMs = (typeof millis === 'function') ? millis() : 0;
    const warmOn = this._tmGrowWarmUntil && nowMs < this._tmGrowWarmUntil;
    const coldOn = this._tmGrowColdUntil && nowMs < this._tmGrowColdUntil;
    const glacial = (this.seasonManager && this.seasonManager.getWinterness)
      ? this.seasonManager.getWinterness() >= 0.5 : false;
    if (this._regimeFit == null) this._regimeFit = 1;
    const mismatched = (warmOn && glacial) || (coldOn && !glacial);
    const matched    = (warmOn && !glacial) || (coldOn && glacial);
    // Open-country tussock flush: TUSSOCK grown in a glacial (the matched cold
    // regime). Shared once per frame so the grazer code (Moa.behave) doesn't
    // recompute the regime/millis per bird — the goose and the plains/coastal moa
    // read it for a small population lift ("cold is busier"; ECOLOGY_FAUNA).
    this._tussockFlush = !!(coldOn && glacial);
    let rfTarget = 1, rfRate = H.regimeRelaxRate;
    if (mismatched)   { rfTarget = H.regimeFitFloor; rfRate = H.regimeMismatchRate; }
    else if (matched) { rfTarget = 1;                rfRate = H.regimeMatchRate; }
    const rfStep = rfRate * (dt || 1);
    this._regimeFit += (rfTarget - this._regimeFit) * (rfStep > 1 ? 1 : rfStep);
    if (this._regimeFit < 0) this._regimeFit = 0; else if (this._regimeFit > 1) this._regimeFit = 1;

    // --- Recruitment: in the interglacial the forest should be regenerating via
    // kererū seed dispersal. It stalls (R falls, forest thins) when there is NO kererū to carry
    // the large fruit, OR when sustained STORM overuse (this._stormOveruse) keeps the flock
    // grounded so they cannot disperse. In the glacial the forest isn't recruiting anyway, so R
    // relaxes back. A single storm doesn't cross the overuse line, so it stays cheap. ---
    if (this._recruitment == null) this._recruitment = 1;
    let kereruAlive = 0;
    const sim = this.simulation;
    if (sim && sim.otherEntities && sim.otherEntities.kereru) {
      const ks = sim.otherEntities.kereru;
      for (let i = 0; i < ks.length; i++) if (ks[i] && ks[i].alive) kereruAlive++;
    }
    const recStalled = !glacial && (kereruAlive === 0 || this._stormOveruse);
    const recTarget = recStalled ? H.recruitFloor : 1;
    const recRate = recStalled ? H.recruitDrainRate : H.recruitRecoverRate;
    const recStep = recRate * (dt || 1);
    this._recruitment += (recTarget - this._recruitment) * (recStep > 1 ? 1 : recStep);
    if (this._recruitment < 0) this._recruitment = 0; else if (this._recruitment > 1) this._recruitment = 1;

    // Health target: ash disturbance × regime fit × recruitment (all must be healthy for full colour).
    let target = (1 - (this._ashCover || 0)) * this._regimeFit * this._recruitment;
    // Dune BURIAL (COAST §10A/§10C): an ACTIVE, mismanaged dunefield buries coastal vegetation,
    // draining the readout — the "sand flux buries vegetation" half of the feedback. Keyed to the
    // disturbance-driven flux only (see _updateSandFlux), so a well-managed map is never penalised.
    if (this._sandBurial) target *= (1 - this._sandBurial);
    target = target < 0 ? 0 : (target > 1 ? 1 : target);

    // Ease the health scalar (slow, calm), then map to a saturation factor.
    const ease = H.healthEase * (dt || 1);
    this._habitatHealth += (target - this._habitatHealth) * (ease > 1 ? 1 : ease);
    const wantSat = H.satFloor + (1 - H.satFloor) * this._habitatHealth;

    // Slew _sceneSat toward wantSat, capped per frame — the hard photosensitivity backstop.
    const cap = H.satSlewPerFrame * (dt || 1);
    const d = wantSat - this._sceneSat;
    this._sceneSat += (d > cap) ? cap : (d < -cap ? -cap : d);
  }

  update(dt = 1) {
    // The HUD owns the deep-time multiplier and the transient button effects,
    // and returns the timeScale this frame should run at.
    const scale = (typeof InstallHUD !== 'undefined') ? InstallHUD.update(this, dt) : 1;
    const sdt = dt * (scale || 1);

    this.playTime += sdt;

    if (this.seasonManager.update(sdt)) this.onSeasonChange();

    // sdt = deep-time-warped life clock; dt = real frame clock. The sim runs life
    // events (aging, breeding, growth) on sdt but fauna motion + animation on dt,
    // so a 10x fast-forward morphs the world without turning the animals into a
    // sped-up cartoon. Same decoupling the water and habitat-health already use.
    this.simulation.update(sdt, dt);
    if (this.water) this.water.update(dt);   // real-time flow, decoupled from the deep-time speed
    this._morphTick();
    this.updateAshCover();
    this._updateSandFlux(dt);        // coastal dune engine — reads ash, feeds the burial drain below
    this._updateHabitatHealth(dt);   // real dt, not sdt — the saturation ramp is a wall-clock effect
    this._stormStepPlants(dt);        // deliver scheduled storm damage over the window + drive the leaf-sway envelope
    this._checkAutoEruptions();
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
    const phase = this.seasonManager.current;
    const phaseKey = this.seasonManager.currentKey;

    this.addNotification(`Entering the ${phase.name}`, 'info');   // drawn glyphs only — no emoji icon
    if (audioManager) audioManager.playSeasonChange(phaseKey);

    // Deep cold drives an extra hungry eagle to hunt (opt-in via LEVEL_MECHANICS).
    if (typeof LEVEL_MECHANICS !== 'undefined' && LEVEL_MECHANICS.winterPredation && phaseKey === 'fullGlacial') {
      this.simulation.spawnEagle();
      this.addNotification("The full glacial drives a hungry eagle to hunt.", 'error');
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
    // Full-screen takeover: the plant sprite gallery replaces the world view.
    // Uses the live CONFIG.viewZoom, so it reads whatever the last frame set.
    if (typeof PlantGallery !== 'undefined' && PlantGallery.active) {
      PlantGallery.render(CONFIG.canvasWidth, CONFIG.canvasHeight);
      return;
    }

    // In DOM-stack GL mode the main canvas is the TOP layer (indicators + HUD only)
    // and must be transparent so the terrain (bottom DOM layer) and GL sprites
    // (middle) show through; clear() instead of an opaque background(). The letterbox
    // shows the page background (body '#19231e'), matching the 2D fill closely.
    const _domGL = (typeof GLBatch !== 'undefined' && GLBatch.domStack);
    if (_domGL) clear(); else background(20, 30, 25);

    // Eruption screen-shake: jitter the WHOLE frame (ground blit + world + HUD) by a few
    // 1080-space px while the eruption button is held / firing. background() above already
    // cleared, so the few px of dark edge this bares reads as nothing; the full-screen ash
    // cover + flash are drawn with overscan so the shake never opens a gap in them.
    const _shake = (typeof InstallHUD !== 'undefined') ? InstallHUD.eruptionShakeOffset(this) : null;
    if (_shake) translate(_shake.x, _shake.y);

    // ---- GROUND TIER (1080) --------------------------------------------------
    // The terrain is rasterised into a 1080 offscreen buffer and blitted up as one
    // quad, so the season-buffer fill and the ground-only saturate() health filter
    // stay at 1080 however large the backing canvas is (CONFIG.spriteSupersample).
    // Everything ABOVE the ground — water, washes, sprites, HUD — is drawn straight
    // onto the supersampled canvas. The saturate() filter and the terrain clip now
    // live in _composeTerrainLayer().
    const projH = (typeof Projection !== 'undefined')
      ? Projection.projectedWorldHeight() : this.terrain.mapHeight;
    const tg = this._ensureTerrainLayer();
    this._composeTerrainLayer(tg, projH);
    if (_domGL) {
      // The terrain buffer IS the bottom DOM layer (it also carries water + washes,
      // drawn into it by _composeTerrainLayer in this mode) — no blit to main.
      GLBatch.setBottom(tg.canvas || (tg.elt));
    } else {
      push();
      // Soft upscale of the 1080 ground — the same bilinear enlargement the browser
      // used to do when it CSS-scaled the whole 1080 canvas up to the panel.
      if ('imageSmoothingEnabled' in drawingContext) drawingContext.imageSmoothingEnabled = true;
      image(tg, 0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);
      pop();
    }

    // ---- ABOVE THE GROUND (supersampled) -------------------------------------
    // Water, seasonal washes and every entity — clipped to the terrain footprint and
    // drawn in the same camera transform, straight onto the high-res backing so the
    // sprites resolve at full resolution.
    push();
    drawingContext.save();
    drawingContext.beginPath();
    const _clipW = this.terrain.mapWidth * CONFIG.viewZoom;
    const _clipH = projH * CONFIG.viewZoom;
    drawingContext.rect(CONFIG.viewX, CONFIG.viewY, _clipW, _clipH);
    drawingContext.clip();

    translate(CONFIG.viewX, CONFIG.viewY);
    scale(CONFIG.viewZoom);

    // Animated water + seasonal washes (frost/ash/haze), over the baked ground and
    // under the animals, in the camera transform. In DOM-stack GL mode these are
    // drawn into the terrain buffer (the bottom layer) by _composeTerrainLayer, so
    // the main canvas stays a transparent top layer — skip them on main here.
    if (!_domGL) this._drawGroundOverlays(null, projH);

    // WebGL entity layer (?render=gl): open a batch span so the sprite image()
    // calls inside simulation.render() enqueue GPU quads. It composites itself back
    // into this 2D context at the seam before the indicator over-pass (see
    // Simulation.render). The fallback below closes the span if that seam was missed.
    if (typeof GLBatch !== 'undefined' && GLBatch.enabled) GLBatch.begin();

    // River swimmers (eels + fish) ride the SUPERSAMPLED sprite layer, not the 1080 ground
    // buffer their currents/shimmer sit in. Drawn HERE, inside the batch span and before the
    // animals, so in GL mode the batch captures them at backing resolution (and the 2D path
    // draws them straight onto the high-res canvas) — crisp like the cast, swimming under it.
    if (this.water) this.water.renderSwimmers();

    this.simulation.render();

    // Safety: if the batch span is somehow still open (e.g. an early return before
    // the composite seam), flush it here so an open span can never swallow the
    // HUD's own image() draws on the next frame.
    if (typeof GLBatch !== 'undefined' && GLBatch.enabled && GLBatch._open) GLBatch.composite(drawingContext);

    // Range-authoring overlay (GEO.show() / key R). Drawn in the terrain transform so the
    // footprints + spine axes sit on the lifted ground. Authoring only — off by default.
    if (typeof GEO !== 'undefined' && GEO._overlay) GEO._draw(this.terrain);

    drawingContext.restore();
    pop();

    this.ui.renderFullscreenOverlay();
  }

  // ---- split-resolution ground tier ---------------------------------------
  // The 1080 offscreen buffer the terrain is composited into. Lazily (re)allocated
  // to the LOGICAL canvas size (never × SS) so terrain work stays at 1080. A p5
  // createGraphics is a real canvas — remove() the old one on resize (the leak rule
  // in CLAUDE.md / BUILD_V3 §2.3).
  _ensureTerrainLayer() {
    const w = CONFIG.canvasWidth, h = CONFIG.canvasHeight;
    let tg = this._terrainLayer;
    if (!tg || tg.width !== w || tg.height !== h) {
      if (tg && tg.remove) tg.remove();
      tg = this._terrainLayer = createGraphics(w, h);
      if (tg.pixelDensity) tg.pixelDensity(.5);    // manual supersample lives on the MAIN canvas only
    }
    return this._terrainLayer;
  }

  // Drop the buffer on resize; _ensureTerrainLayer rebuilds it next frame at the new
  // logical size.
  _resizeTerrainLayer() {
    if (this._terrainLayer && this._terrainLayer.remove) this._terrainLayer.remove();
    this._terrainLayer = null;
  }

  // Paint the ground into the 1080 buffer `tg`: the terrain blit under the same
  // camera transform the entities use, clipped to the footprint, with the ground-only
  // saturate() health filter — all at 1080. The buffer is cleared each frame (its
  // letterbox stays transparent, so the canvas background shows through when blitted).
  _composeTerrainLayer(tg, projH) {
    tg.clear();
    tg.push();
    const _dc = tg.drawingContext;
    _dc.save();
    _dc.beginPath();
    const _clipW = this.terrain.mapWidth * CONFIG.viewZoom;
    const _clipH = projH * CONFIG.viewZoom;
    _dc.rect(CONFIG.viewX, CONFIG.viewY, _clipW, _clipH);
    _dc.clip();

    tg.translate(CONFIG.viewX, CONFIG.viewY);
    tg.scale(CONFIG.viewZoom);

    // Habitat-health "quiet saturation" (ground-only): desaturate the baked ground when
    // _sceneSat has drained. The filter is a full-canvas Canvas2D op — now run at 1080
    // inside this buffer, not at the backing resolution. Set only when sat < ~1 (never in
    // the healthy common case); the string is cached on a 0.01 quantum so a transition
    // allocates at most once per step ("never allocate in draw()", CLAUDE.md).
    const _sat = this._sceneSat;
    const _desat = (typeof HEALTH !== 'undefined') && HEALTH.groundOnly &&
                   _sat != null && _sat < 0.999 && _dc && ('filter' in _dc);
    if (_desat) {
      const _q = Math.round(_sat * 100);
      if (this._satFilterQ !== _q) { this._satFilterQ = _q; this._satFilterStr = 'saturate(' + (_q / 100) + ')'; }
      _dc.filter = this._satFilterStr;
    }
    this.terrain.render(tg);
    if (_desat) _dc.filter = 'none';

    // DOM-stack GL mode: the terrain buffer is the bottom layer, so water and the
    // seasonal washes are drawn into it here (in the same camera transform, outside
    // the ground-only saturate filter) instead of onto the main canvas. At 1080 —
    // consistent with the buffer's resolution and the documented ground-tier design.
    if (typeof GLBatch !== 'undefined' && GLBatch.domStack) {
      this._drawGroundOverlays(tg, projH);
    }

    _dc.restore();
    tg.pop();
  }

  // Animated water + the frost / ash / haze washes, drawn into target `g` (a p5
  // graphics buffer in DOM-stack mode, or null for the global main-canvas draw).
  // The camera transform is assumed already applied on the target. Shared so the 2D
  // and GL paths draw identical overlays; the haze gradient cache is per-session
  // (the render mode never changes mid-run) so one context owns it.
  _drawGroundOverlays(g, projH) {
    const R = g || (typeof window !== 'undefined' ? window : this);

    // Animated water: river flow / eels / sea shimmer.
    if (this.water) this.water.render(g || null);

    // ORDER MATTERS: ash first, then frost ON TOP. The eruption's warm-grey ash and the
    // ground-only saturate() both wash the scene toward neutral grey, which used to bury
    // the glacial cue so an eruption in the ice age read the same as one in the warm. The
    // cold frost is drawn AFTER the ash so its blue punches back through the aftermath —
    // the glacial state stays legible while the land is greyed. (Alt. considered: cool-
    // shifting the ash tint by winterness instead — kept the frost-over-ash reorder.)

    // Volcanic ash — one warm-grey rect while ashCover decays.
    const _ash = this._ashCover || 0;
    if (_ash > 0.001) {
      R.push(); R.noStroke(); R.rectMode(CORNER);
      R.fill(120, 116, 110, 105 * _ash);
      R.rect(0, 0, this.terrain.mapWidth, projH);
      R.pop();
    }

    // Glacial frost — one cool rect scaled by the winter index. Over the ash (above) so
    // the cold reads even during the eruption grey. While ash is settling, punch the frost
    // up toward opacity in proportion to the ash so it isn't swamped by the denser grey;
    // with no ash this is the plain winterness wash, unchanged.
    const _frost = this.seasonManager.getWinterness ? this.seasonManager.getWinterness() : 0;
    if (_frost > 0.001) {
      const _frostA = 72 * _frost * (1 + 0.9 * _ash);   // 1× normally; up to ~1.9× under full ash
      R.push(); R.noStroke(); R.rectMode(CORNER);
      R.fill(216, 232, 245, _frostA);
      R.rect(0, 0, this.terrain.mapWidth, projH);
      R.pop();
    }

    // North atmosphere haze — one cached static gradient rect fading down from the top.
    const _rdc = R.drawingContext;
    if (typeof LOOK !== 'undefined' && LOOK.haze && LOOK.hazeStrength > 0 && _rdc && _rdc.createLinearGradient) {
      const _bandH = projH * LOOK.hazeHeight;
      const _mw = this.terrain.mapWidth;
      let _hc = this._hazeCache;
      if (!_hc || _hc.col !== LOOK.hazeColor || _hc.str !== LOOK.hazeStrength ||
          _hc.bandH !== _bandH || _hc.w !== _mw) {
        const _hz = color(LOOK.hazeColor);
        const _hr = red(_hz) | 0, _hg = green(_hz) | 0, _hb = blue(_hz) | 0;
        const _grad = _rdc.createLinearGradient(0, 0, 0, _bandH);
        _grad.addColorStop(0, `rgba(${_hr},${_hg},${_hb},${LOOK.hazeStrength})`);
        _grad.addColorStop(1, `rgba(${_hr},${_hg},${_hb},0)`);
        _hc = this._hazeCache = { grad: _grad, col: LOOK.hazeColor, str: LOOK.hazeStrength, bandH: _bandH, w: _mw };
      }
      _rdc.save();
      _rdc.fillStyle = _hc.grad;
      _rdc.fillRect(0, 0, _mw, _bandH);
      _rdc.restore();
    }
  }


  
  



  
  
  handleClick(mx, my) {
    if (typeof Kiosk !== 'undefined') Kiosk.noteInput();
    // The plant gallery overlays the whole screen — let it claim the pointer (its
    // SAVE PNG button) before the sim UI sees the click.
    if (typeof PlantGallery !== 'undefined' && PlantGallery.handleClick(mx, my)) return;
    if (this.ui && this.ui.handleFullscreenClick(mx, my)) return;
  }

  // Release halves of the two handlers above. The Eruption button is
  // press-and-hold (tap erupts, hold reseeds), so it needs the key/pointer UP;
  // the other three buttons ignore it.
  handleClickUp(mx, my) {
    if (typeof InstallHUD !== 'undefined' && this.ui) InstallHUD.handleClickUp(this.ui);
  }

  handleKeyUp(k) {
    // Plant gallery owns the D key: a short tap here is replayed to Debug.
    if (typeof PlantGallery !== 'undefined' && PlantGallery.onKeyUp(k)) return;
    if (typeof InstallHUD !== 'undefined') InstallHUD.handleKeyUp(this, k);
  }

  handleKey(k) {
    if (typeof Kiosk !== 'undefined') Kiosk.noteInput();
    // Swallow D so tap-vs-hold resolves on release/tick (see TeManawa_plant_debug.js).
    if (typeof PlantGallery !== 'undefined' && PlantGallery.onKeyDown(k)) return;
    if (typeof InstallHUD !== 'undefined' && InstallHUD.handleKey(this, k)) return;
    if (typeof Debug !== 'undefined' && Debug.handleKey(k)) return;

    // Heavy AUTHORING keys (footprint / LOOK / GEN) each cost a full SYNCHRONOUS terrain bake
    // (~5 s — a visible freeze) and are dev-only (the wall is locked to 1-5). They are gated behind
    // the debug overlay so a stray press during normal use never freezes the sim — and so 'b' no
    // longer collides with the second screen's boost key (secondscreen/input.js). Press D to author,
    // then b / g / n / SHIFT+F. See md/TEMANAWA_DEVTOOLS.md.
    const authoring = (typeof Debug !== 'undefined') && Debug.enabled;

    // SHIFT+F toggles the terrain footprint (full rebuild, same cost as ?terrain=).
    if (k === 'F') { if (authoring) this.setTerrainFit(CONFIG.terrainFit === 'fit' ? 'square' : 'fit'); return; }

    // B re-bakes the terrain in place with the current LOOK / Projection values (look-dev loop).
    if (k === 'b' || k === 'B') { if (authoring) this.rebakeTerrain(); return; }

    // G applies the current GEN landform params (regenerate + re-bake); N draws a NEW random landform.
    if ((k === 'g' || k === 'G') && typeof GEN !== 'undefined') { if (authoring) GEN.apply(); return; }
    if ((k === 'n' || k === 'N') && typeof GEN !== 'undefined') { if (authoring) GEN.reseed(); return; }

    // R toggles the range-authoring overlay (footprints + spine axes). Authoring only.
    if ((k === 'r' || k === 'R') && typeof GEO !== 'undefined') { GEO.toggle(); return; }

    // C toggles the climate-affinity tint on the cast (warm=amber, cold=blue). Authoring
    // only — the wall is locked to 1-5. Free while off; the baked tints warm up lazily on
    // first enable (TintBaker), so the first C-on frame does a one-time bake, then nothing.
    if (k === 'c' || k === 'C') { CONFIG.showClimateAffinity = !CONFIG.showClimateAffinity; return; }
  }

}



// ============================================
// MAIN SKETCH
// ============================================
let game;

let _needsInitialResize = true;
// The p5 main canvas element. Stored because DOM-stack GL mode inserts extra
// canvases (terrain, GL) ahead of it, so document.querySelector('canvas') no longer
// reliably returns the main one — scaleCanvasToFit must style THIS one.
let _mainCanvasEl = null;

function setup() {
  //filter(POSTERIZE,2);
  if (!audioManager) audioManager = initAudioManager();

  CONFIG.recalculateLayout(windowWidth, windowHeight);
  applySpriteSupersampleFromURL();   // sets CONFIG.spriteSupersample before the canvas is made
  // Decide the renderer BEFORE sizing the main canvas: in GL mode the main canvas is the
  // 1080 HUD-only layer, in the 2D path it carries the supersampled sprites too.
  if (typeof GLBatch !== 'undefined') GLBatch.applyURLFlag();

  pixelDensity(1); // must run BEFORE scaleCanvasToFit: it resets the canvas's inline CSS size.
                   // pixelDensity stays 1 — we supersample MANUALLY (backing = logical × SS)
                   // instead, so the terrain can opt out of it via the 1080 offscreen layer.
                   // A p5 pixelDensity of 2 would 4×-back the WHOLE frame, terrain included.
  // GL is the default, so size the main canvas for it (logical 1080) up front and only
  // resize on a GL init failure below. `requested` is a good proxy for the final mode:
  // it's wrong only when GL was asked for but the context can't be created — handled by
  // the resize after init().
  const _wantGL = !!(typeof GLBatch !== 'undefined' && GLBatch.requested);
  let _ss = _wantGL ? 1 : spriteSS();
  let cnv = createCanvas(CONFIG.canvasWidth * _ss, CONFIG.canvasHeight * _ss);
  _mainCanvasEl = (cnv && cnv.elt) ? cnv.elt : document.querySelector('canvas');
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

  // Consolidate every loaded sprite PNG into shared GPU atlas pages now that
  // preload() has resolved them all and the canvas exists. Transparent to the
  // render code (see TeManawa_spriteatlas.js); a no-op if nothing packed.
  if (typeof SpriteAtlas !== 'undefined') SpriteAtlas.build();

  // WebGL entity layer (DEFAULT; opt out ?render=2d). Init at the SPRITE resolution
  // (logical × spriteSS) so the cast stays crisp even though the main canvas is now the
  // 1080 HUD layer; disables cleanly on any failure. Mount stacks the GL canvas between
  // the terrain (bottom) and main (top) canvases.
  if (typeof GLBatch !== 'undefined') {
    if (GLBatch.requested && GLBatch.init(CONFIG.canvasWidth * spriteSS(), CONFIG.canvasHeight * spriteSS())) {
      GLBatch.mount((cnv && cnv.elt) ? cnv.elt : document.querySelector('canvas'));
    }
    // GL was expected but did not come up (no WebGL / software rasterizer / lax context):
    // the main canvas must carry the sprites after all, so bump it up to the supersampled
    // backing to keep the 2D-fallback cast crisp. (No-op in the common GL-active case.)
    const _finalSs = mainCanvasSS();
    if (_finalSs !== _ss) {
      _ss = _finalSs;
      resizeCanvas(CONFIG.canvasWidth * _ss, CONFIG.canvasHeight * _ss);
      scaleCanvasToFit();
    }
  }

  // ?terrain=fit | ?terrain=square overrides the CONFIG default without editing
  // this file. Read BEFORE loadLevel so the first terrain is built at the right
  // footprint rather than built square and then rebuilt.
  applyTerrainFitFromURL();

  game = new Game();
  // Te Manawa: standalone installation - autoload scene, skip menu/level-select
  game.loadLevel('temanawa_scaffold');

  if (typeof Kiosk !== 'undefined') { Kiosk.attach(game); Kiosk.install(); }
  if (typeof Debug !== 'undefined') Debug.applyVisibility();

  // Dev tools: mirror the live landform params into GEN so the console shows the
  // real values (md/TEMANAWA_DEVTOOLS.md). Authoring only; no effect on the kiosk.
  if (typeof GEN !== 'undefined' && GEN.sync) GEN.sync();
  if (typeof GEO !== 'undefined' && GEO.sync) GEO.sync();
}

function windowResized() {
  // Recalculate layout for actual window dimensions
  CONFIG.recalculateLayout(windowWidth, windowHeight);

  // Resize the MAIN p5 canvas: logical 1080 in GL mode (HUD only), logical × spriteSS in
  // the 2D path (it carries the sprites). The GL entity layer is resized separately below.
  const _ss = mainCanvasSS();
  resizeCanvas(CONFIG.canvasWidth * _ss, CONFIG.canvasHeight * _ss);

  // Apply CSS scaling to fill the window (uses the LOGICAL size, so the on-screen
  // footprint is unchanged; the extra backing pixels are the crispness).
  scaleCanvasToFit();

  // Keep the WebGL entity canvas at the SPRITE backing resolution (independent of the
  // main canvas). GLBatch.resize re-reads the main backing into coordW/coordH.
  if (typeof GLBatch !== 'undefined' && GLBatch.enabled) {
    GLBatch.resize(CONFIG.canvasWidth * spriteSS(), CONFIG.canvasHeight * spriteSS());
  }

  // Update UI panel positions if game is running
  if (game && game.ui) {
    game.ui.recalculate();
    game._updateViewTransform();
    game._resizeTerrainLayer();   // the 1080 terrain buffer follows the logical size
  }

  // In 'fit' mode the terrain footprint itself follows the screen, so a resize
  // may need a rebuild. Debounced, because a drag-resize fires this dozens of
  // times and each rebuild is ~1 s. The view transform above already keeps the
  // frame correct in the meantime; the refit only sharpens the footprint.
  scheduleTerrainRefit();
}

// Startup override, same pattern as ArtMode's ?art= flag in entity_sprites.js.
function applyTerrainFitFromURL() {
  if (typeof window === 'undefined' || !window.location) return;
  const q = new URLSearchParams(window.location.search).get('terrain');
  if (q === 'fit' || q === 'square') {
    CONFIG.terrainFit = q;
    CONFIG._terrainFitPinned = true;
    console.log(`[Terrain] footprint mode '${q}' from URL`);
  }
}

// Backing-canvas supersample factor, clamped. 1 = logical 1080 (old behaviour);
// 2 = 4K-native sprites. The one place SS is read, so the clamp lives here. This is the
// SPRITE resolution — it always sizes the GL entity layer (and, in the 2D path, the
// whole main canvas).
function spriteSS() {
  const s = Math.round((typeof CONFIG !== 'undefined' && CONFIG.spriteSupersample) || 1);
  return Math.max(1, Math.min(3, s));
}

// The supersample applied to the MAIN p5 canvas specifically. In DOM-stacked GL mode
// the sprite cast lives on the GL layer (kept at spriteSS×), so the main canvas carries
// ONLY the HUD + indicators and drops to logical 1080 — Chrome then re-uploads and
// composites a 1080 surface each frame instead of a 4K one, which is the single biggest
// resting-frame win (the HUD's year / timeline / edge glow dirty essentially the whole
// canvas every frame). The trade is 4K crispness on HUD text — the same trade the terrain
// already makes via its 1080 layer. In the 2D path (opt-out or GL init failure) the main
// canvas still carries the sprites, so it stays at spriteSS× to keep them crisp.
function mainCanvasSS() {
  if (typeof GLBatch !== 'undefined' && GLBatch.domStack) return 1;
  return spriteSS();
}

// ?sprites=1|2|3 startup override, same pattern as ?terrain / ?art. Must run
// BEFORE createCanvas, since it sets the backing resolution.
function applySpriteSupersampleFromURL() {
  if (typeof window === 'undefined' || !window.location) return;
  const q = new URLSearchParams(window.location.search).get('sprites');
  if (q == null) return;
  const n = parseInt(q, 10);
  if (n >= 1 && n <= 3) {
    CONFIG.spriteSupersample = n;
    console.log(`[Render] sprite supersample ${n}× from URL`);
  }
}

// ---- resize-triggered refit (fit mode only) ----------------------
let _refitTimer = null;

function scheduleTerrainRefit() {
  if (CONFIG.terrainFit !== 'fit') return;
  if (typeof setTimeout !== 'function') return;
  if (_refitTimer) clearTimeout(_refitTimer);
  _refitTimer = setTimeout(() => {
    _refitTimer = null;
    if (game) game.refitTerrain();
  }, CONFIG.terrainFitResizeDelay);
}

function scaleCanvasToFit() {
  const cnv = _mainCanvasEl || document.querySelector('canvas');
  if (!cnv || !cnv.style) return;   // headless harness stub has no .style

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

  // Keep the DOM-stacked GL + terrain layers registered on the main canvas box.
  if (typeof GLBatch !== 'undefined' && GLBatch.domStack) GLBatch.layout();
}

function initializeRegistry() {
  REGISTRY.registerAnimalType('moa', {}, Moa);
  REGISTRY.registerAnimalType('eagle', {}, EylesHarrier);
  // Kererū — the large-seed disperser. Registered as its own base type + a single species,
  // spawned via level.initialEntityCounts. Guarded so a missing kereru.js degrades gracefully.
  if (typeof Kereru !== 'undefined') REGISTRY.registerAnimalType('kereru', {}, Kereru);
  // Kōkako + huia — the other flighted forest birds (extend Kereru; own base type + list,
  // like the kererū). Guarded so a missing file degrades gracefully.
  if (typeof Kokako !== 'undefined') REGISTRY.registerAnimalType('kokako', {}, Kokako);
  if (typeof Huia   !== 'undefined') REGISTRY.registerAnimalType('huia',   {}, Huia);
  // Tūī — a singing nectar-feeder, its own base type + list like the kererū (extends Kokako).
  if (typeof Tui    !== 'undefined') REGISTRY.registerAnimalType('tui',    {}, Tui);

  for (const [key, config] of Object.entries(MOA_SPECIES)) REGISTRY.registerSpecies(key, 'moa', config);
  for (const [key, config] of Object.entries(EAGLE_SPECIES)) REGISTRY.registerSpecies(key, 'eagle', config);
  // North Island goose — a moa-guild grazer. Registered under the `moa` base type
  // (so it lives in the moa list and reuses mating/breeding/health) but carries its
  // own `class: Goose` in the config. Guarded so a missing goose.js degrades gracefully.
  if (typeof Goose !== 'undefined' && typeof GOOSE_SPECIES !== 'undefined')
    for (const [key, config] of Object.entries(GOOSE_SPECIES)) REGISTRY.registerSpecies(key, 'moa', config);
  // Mōho / North Island takahē — same moa-guild pattern (own `class: Takahe`). Guarded.
  if (typeof Takahe !== 'undefined' && typeof TAKAHE_SPECIES !== 'undefined')
    for (const [key, config] of Object.entries(TAKAHE_SPECIES)) REGISTRY.registerSpecies(key, 'moa', config);
  // North Island brown kiwi — the forest-floor bird, same moa-guild pattern (own `class:
  // Kiwi`). Its soil-turning quirk lives in the class; registered here like the others. Guarded.
  if (typeof Kiwi !== 'undefined' && typeof KIWI_SPECIES !== 'undefined')
    for (const [key, config] of Object.entries(KIWI_SPECIES)) REGISTRY.registerSpecies(key, 'moa', config);
  // Finsch's duck — a moa-guild open-country grazer (own `class: FinschDuck`), same pattern
  // as the goose. Guarded so a missing finsch_duck.js degrades gracefully.
  if (typeof FinschDuck !== 'undefined' && typeof FINSCH_DUCK_SPECIES !== 'undefined')
    for (const [key, config] of Object.entries(FINSCH_DUCK_SPECIES)) REGISTRY.registerSpecies(key, 'moa', config);
  if (typeof Kereru !== 'undefined' && typeof KERERU_SPECIES !== 'undefined')
    REGISTRY.registerSpecies('kereru', 'kereru', KERERU_SPECIES);
  // Kōkako (singing, territorial) + huia (pair-bonded) — each its own species of its
  // own base type, breeding true via the shared flyer egg path (_hatchFlyerEgg).
  if (typeof Kokako !== 'undefined' && typeof KOKAKO_SPECIES !== 'undefined')
    REGISTRY.registerSpecies('kokako', 'kokako', KOKAKO_SPECIES);
  if (typeof Huia !== 'undefined' && typeof HUIA_SPECIES !== 'undefined')
    REGISTRY.registerSpecies('huia', 'huia', HUIA_SPECIES);
  // Tūī — its own species of its own base type, breeding true via the shared flyer egg path.
  if (typeof Tui !== 'undefined' && typeof TUI_SPECIES !== 'undefined')
    REGISTRY.registerSpecies('tui', 'tui', TUI_SPECIES);
  for (const [key, config] of Object.entries(PLANT_TYPES)) REGISTRY.registerPlant(key, config);
  for (const [key, config] of Object.entries(PLACEABLES)) REGISTRY.registerPlaceable(key, config);

  // Biomes are NOT registered here. They are level data, and registering an
  // engine-side copy is what let the registry and the renderer disagree.
  // Game.loadLevel() registers levelDef.biomes instead.

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

  // Poll the held D key (toggles the plant sprite gallery at the 3 s mark).
  if (typeof PlantGallery !== 'undefined') PlantGallery.tick();

  const _t0 = performance.now();
  game.update(deltaMultiplier);
  const _t1 = performance.now();

  // Split-resolution pipeline: the main canvas is mainCanvasSS× the logical 1080 size, so a
  // single scale here lets every main-canvas drawer keep authoring in 1080-space and land on
  // the backing. In GL mode mainCanvasSS is 1 (the main canvas IS 1080 — the HUD layer) so
  // this is a no-op; in the 2D path it scales the sprites + HUD onto the supersampled backing.
  // The terrain opts out inside Game.render() by compositing at 1080 and blitting up.
  // background() in Game.render() ignores the transform, so it still clears the whole canvas.
  const _ss = mainCanvasSS();
  push();
  if (_ss !== 1) scale(_ss);
  game.render();
  if (typeof Kiosk !== 'undefined') Kiosk.renderCrossfade(CONFIG.canvasWidth, CONFIG.canvasHeight);
  pop();

  const _t2 = performance.now();
  if (typeof Debug !== 'undefined') Debug.sample(_t1 - _t0, _t2 - _t1);
}

function updateFPS() {
  fpsHistory.push(1000 / deltaTime);
  if (fpsHistory.length > FPS_HISTORY_SIZE) fpsHistory.shift();
  
  let sum = 0;
  for (let i = 0; i < fpsHistory.length; i++) sum += fpsHistory[i];
  currentFPS = sum / fpsHistory.length;
}


// mouseX/mouseY are in the MAIN canvas's backing pixels (logical × mainCanvasSS); all
// hit-testing is in 1080-space, so divide back before handing coordinates to the game.
// In GL mode mainCanvasSS is 1 (main canvas is already 1080), so this is a no-op there.
function mousePressed() { const s = mainCanvasSS(); game.handleClick(mouseX / s, mouseY / s); }
function mouseReleased() { const s = mainCanvasSS(); game.handleClickUp(mouseX / s, mouseY / s); }
function keyPressed() { game.handleKey(key); }
function keyReleased() { game.handleKeyUp(key); }

// Mouse wheel pans the plant gallery when it's up (its true-scale content can run
// taller than the screen). Returning false stops the page itself from scrolling.
// The sim never reads the wheel, so it's a no-op otherwise.
function mouseWheel(e) {
  if (typeof PlantGallery !== 'undefined' && PlantGallery.active) {
    PlantGallery.scroll(e.deltaY);
    return false;
  }
}