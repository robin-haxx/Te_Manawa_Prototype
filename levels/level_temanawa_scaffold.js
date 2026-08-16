// ============================================================
// TE MANAWA — SCAFFOLD SCENE  (systems-check placeholder)
// ------------------------------------------------------------
// Minimal VALID ambient level whose only job is to prove the fork
// BOOTS and the ecosystem runs. This is NOT the Manawatū design —
// the real scene (deep-time terrain morph, the four North Island
// moa, Eyles' harrier / kērangi, timeline + five buttons, square/
// portrait layout) is authored per TEMANAWA_PLAN_V3.md. Species,
// biomes and placeables below reuse existing engine keys so the
// registry validates. No win/loss: one never-true goal keeps the
// run in PLAYING indefinitely.
// ============================================================
const habitatCols = {
sea : ['#1a3a52','#1e4d6b','#236384'],
coastal: ['#c2b280','#d4c794','#e6dca8'],
grassland:['#e6dca8', '#c8d697', '#789762'],
podocarp: ['#2d5a3d','#346644','#3b724b'],
montane: ['#4a7c59','#528764','#5a926f'],
subalpine:['#809a59','#a4b56d','#85a15c'],
alpine: ['#8b8b8b','#9a9a9a','#a9a9a9'],
snow: ['#e8e8e8','#f0f0f0','#ffffff']
};

const LEVEL_TEMANAWA_SCAFFOLD = {
  id: 'temanawa_scaffold',
  name: 'Te Manawa (scaffold)',
  unlockCondition: null,

  terrain: {
    noiseScale: 0.007, octaves: 3, persistence: 0.35, lacunarity: 3.0,
    ridgeInfluence: 1.6, elevationPower: 1.2, islandFalloff: 0.1,
    plantDensity: 0.01, useLakes: false,
    // Geography skeleton present: compress the procedural base above this so the
    // RANGES own the highs. Raised from the 0.5 default to give the plains more
    // rolling relief (octaves/persistence bumped alongside for variation). GEN-tunable.
    geoBaseCeil: 0.48,
    // Ease terrain down to plains within this fraction of the top/bottom edges, so the
    // 3/4 relief bake has no truncated range to smear vertically (the ranges' SVG polys
    // run off-frame). 0 disables. geoTopMargin overrides it for the TOP (far) edge only —
    // kept THIN so the north up-ramp (LOOK.northLift*) fills the far edge with real, slightly
    // higher terrain instead of a wide flat eased-plains smear. Bottom stays 0.10 for the apron.
    geoEdgeMargin: 0.10,
    geoTopMargin: 0.04,
    // Zoom the GENERATED WORLD out so ~this-much-more terrain AREA is visible on screen
    // (1 = off; 1.25 = show 25% more area on all sides). The camera/cost are unchanged —
    // the geo skeleton, coast and noise all scale down together (nothing is stretched to
    // refill the screen), and plant density scales by this so the world stays lush.
    // Live-tunable: GEN.viewAreaGain = 1.4; press G. See terrain.js (_viewF) / spawnPlants.
    viewAreaGain: 1.25
  },

  // 3/4 plan-oblique paint (md/TEMANAWA_34VIEW_PLAN.md). The SIMULATION stays
  // top-down; this only tips the CAMERA.
  //   K        pitch squash — 1.0 is straight top-down, lower tilts further.
  //            Author 0.72-0.85 for the "slightly higher than Terra Nil" angle.
  //   liftFrac relief height at elevation 1.0, as a fraction of map height. It
  //            stands the ranges up; consumed by the relief bake + billboards in
  //            the next step, harmless now under the squash-only render.
  // Held on Projection (configured in Game.init), never written to CONFIG —
  // same rule as TerrainGenerator.noiseScale.
  projection: { K: 0.76, liftFrac: 0.14 },

  // ==========================================================
  // BIOMES — the single source of truth for the ground look.
  // ----------------------------------------------------------
  // TerrainGenerator is constructed with this table. It is the ONLY place
  // ground colour is authored; there is no engine-side copy to keep in sync — a
  // duplicate once existed and silently rendered nothing (see MISTAKES.md).
  //
  //   minElevation / maxElevation
  //       The band, over normalised elevation 0-1. Bands are scanned lowest
  //       first and the FIRST match wins, so an overlap is not a blend — the
  //       lower band shadows the higher one. validateBiomeBands() reports what
  //       each biome effectively gets at load; check the console after editing.
  //
  //   colors: [lowest, ..., highest]
  //       The ramp drawn across the band, lerped by position WITHIN the band.
  //       Two or more entries; three is the current convention. A band that is
  //       0.05 wide gets the whole ramp compressed into 5% of the elevation
  //       range, which is why narrow bands read as one flat colour.
  //
  //   contourColor
  //       Drawn on elevation multiples of CONFIG.contourInterval (0.045) when
  //       CONFIG.showContours is on. It is a hard replacement of the ramp
  //       colour on those cells, not a blend — a contour that reads as noise is
  //       usually one too close in value to its ramp.
  //
  //   walkable / canHavePlants / canPlace / plantTypes
  //       Simulation, not look. plantTypes must exist in PLANT_TYPES.
  //
  // Two colours here are NOT authored per biome:
  //   · Snow blends over any band above the season's snow line, from the snow
  //     biome's ramp — TerrainGenerator.seasonSnowLines (summer 0.92, autumn
  //     0.85, winter 0.77, spring 0.82).
  //   · Winter frost is a single live tint over the whole map, hardcoded in
  //     Game.render() as fill(216,232,245, 72 × winterness).
  //
  // Colours are baked into four season buffers at generate() time, so a change
  // needs a page reload to show up — it is not read per frame.
  // ==========================================================
  // `outlineColor` is the ink the illustration pass strokes along this biome's
  // boundaries (md/TEMANAWA_34VIEW_PLAN.md §7) — it replaces contour lines as the
  // ground's linework. `contourColor` is now unused (contours retired) but kept
  // so nothing downstream that still reads it breaks.
  //
  // plantTypes is picked UNIFORMLY per array entry at spawn (simulation.js
  // spawnPlants): a type's SHARE of the array is its spawn frequency, and
  // repeating a type weights it up. Habitats follow the research — Lowland is
  // open grass/scrub/wetland margin (tussock, flax, cabbage tree, mānuka scrub,
  // scattered kōwhai); Podocarp is closed lowland forest (rimu/kahikatea/tawa
  // canopy, nīkau + tree-fern understory, kōwhai on the margin). Kōwhai sits in
  // both but stays more common in the lowland — 1/5 of grassland vs 1/6 of the
  // richer podocarp mix, and the lowland band is wider so it holds more plants.

  biomes: {
    sea:       { key:'sea',       name:"Sea",             minElevation:0,    maxElevation:0.10,
                 colors:habitatCols.sea, contourColor:'#0f2533', outlineColor:habitatCols.sea[2],
                 walkable:false, canHavePlants:false, canPlace:false },
    coastal:   { key:'coastal',   name:"Coast",           minElevation:0.10, maxElevation:0.15,
                 colors:habitatCols.coastal, contourColor:'#8a7d5a', outlineColor:'#c2b280',
                 walkable:true,  canHavePlants:false, canPlace:true },
    grassland: { key:'grassland', name:"Lowland",         minElevation:0.15, maxElevation:0.30,
                 colors:habitatCols.grassland, contourColor:'#2d3a27', outlineColor:'#789762',
                 walkable:true,  canHavePlants:true, plantTypes:['tussock','flax','cabbagetree','manuka','kowhai'], canPlace:true },
    podocarp:  { key:'podocarp',  name:"Podocarp Forest", minElevation:0.30, maxElevation:0.40,
                 colors:habitatCols.podocarp, contourColor:'#1e3d29', outlineColor:'#3b724b',
                 walkable:true,  canHavePlants:true, plantTypes:['rimu','kahikatea','tawa','fern','nikau','kowhai'], canPlace:true },
    montane:   { key:'montane',   name:"Montane Forest",  minElevation:0.40, maxElevation:0.60,
                 colors:habitatCols.montane, contourColor:'#335740', outlineColor:'#5a926f',
                 walkable:true,  canHavePlants:true, plantTypes:['beech','fern','tawa'], canPlace:true },
    subalpine: { key:'subalpine', name:"Subalpine",       minElevation:0.60, maxElevation:0.80,
                 colors:habitatCols.subalpine, contourColor:'#bfcda8', outlineColor:'#85a15c',
                 walkable:true,  canHavePlants:true, plantTypes:['tussock','manuka'], canPlace:true },
    alpine:    { key:'alpine',    name:"Alpine",          minElevation:0.77, maxElevation:0.90,
                 colors:habitatCols.alpine, contourColor:'#5c5c5c', outlineColor:'#a9a9a9',
                 walkable:false, canHavePlants:false, canPlace:false },
    snow:      { key:'snow',      name:"Snow",            minElevation:0.90, maxElevation:1.0,
                 colors:habitatCols.snow, contourColor:'#b0b0b0', outlineColor:'#9aa6ad',
                 walkable:false, canHavePlants:false, canPlace:false }
  },

  species: {
    // The goose registers under the `moa` base type (own Goose class) so it lives in
    // the moa list and shares the grazer engine — hence it belongs in this list too.
    moa: ['upland_moa', 'little_bush_moa', 'stout_legged_moa', 'mantells_moa', 'heavy_footed_moa', 'giant_goose', 'north_island_takahe'],
    eagle: ['eyles_harrier']
  },
  startingSpecies: 'upland_moa',

  // Multi-species founder spawn (used instead of startingSpecies when present).
  // A mix of forest and OPEN-COUNTRY grazers so the cold-phase reading works: the
  // goose + plains/coastal moa (all `openCountry`) fill the lowland when the visitor
  // grows TUSSOCK in a glacial, while the forest moa hold the interglacial.
  initialSpeciesDistribution: {
    upland_moa:       3,   // small cold-forest moa (not open-country)
    little_bush_moa:  3,   // forest floor (not open-country)
    stout_legged_moa: 3,   // coastal-to-lowland grazer (open-country)
    mantells_moa:     2,   // lowland grazer (open-country)
    heavy_footed_moa: 2,   // lowland flats specialist (open-country)
    giant_goose:      5,   // North Island goose — open grassland/coast (open-country)
    north_island_takahe: 3 // mōho — territorial rail of grassland/scrub/forest margin (open-country)
  },

  // kōkako + huia are flighted forest birds (their own otherEntities lists, like the
  // kererū). Huia spawn as bonded pairs, so an even count = whole pairs.
  initialEntityCounts: { moa: 15, eagle: 3, kereru: 8, kokako: 6, huia: 4 },

  // Timings only — the economy is gone; startingMauri and the placeable toolbar
  // no longer exist. (`seasonDuration` is vestigial: the cold cycle is driven by
  // the deep-time glacial index now, not a frame timer.)
  economy: {
    seasonDuration: 2100, eggIncubationTime: 600,
    securityTimeToLay: 100, securityTimeVariation: 300,
    layingHungerThreshold: 28, eagleSpawnMilestones: [], maxPopulation: 60
  },

  // ==========================================================
  // MECHANICS — opt-in behaviours read via LEVEL_MECHANICS (sketch.js loadLevel).
  // ----------------------------------------------------------
  // FOREST CONTRACTION. Canopy trees (beech/rimu/fern/kahikatea/tawa;
  // FOREST_TREES in TeManawa_plant.js) whose elevation
  // falls outside the forest band are suppressed, so the forest visibly retreats
  // downslope as the GLACIAL deepens and climbs back through the interglacial. The
  // band is keyed by glacial phase and lerped smoothly by the deep-time glacial
  // index (TeManawa_seasons.js getForestBand) — no biome reclassification, so no
  // stutter. Elevations are normalised 0..1.
  //   interglacial — forest from the lowland up toward the subalpine (>80% cover)
  //   full glacial — a low, sheltered refuge only; treeline far lower, tree ferns
  //                  gone. Matches the LGM record for the lower North Island
  //                  (grassland/shrubland/herbfield, forest surviving in refugia).
  // The painted GROUND colour still reads the static elevation bands; shifting the
  // baked treeline per phase is a follow-up.
  // ==========================================================
  mechanics: {
    forestContraction: true,

    // NO HYBRIDISING. The whole ground-bird guild (all 5 moa + the goose + the mōho / NI
    // takahē) shares one grazer breeding engine on the same `moas` list, so without this a
    // bird with no same-species mate nearby would court ACROSS species — a goose × moa
    // pairing that reads as a bug on the wall. With it ON, findPotentialMate returns null
    // instead of falling back to a cross-species mate, and offspring never mutate species
    // (TeManawa_egg.js). Species stay separate; the population floors + autoRefound below
    // keep any one from dying out when it can't find its own kind.
    noSpeciation: true,

    // OPEN-COUNTRY TUSSOCK BOOST. The goose and the plains/coastal moa (species
    // flagged `openCountry`) favour lowland grassland/scrub/coast, and get a small
    // population lift while the visitor grows TUSSOCK in a GLACIAL — the matched cold
    // regime (Game._tussockFlush). It reads as "cold is busier, not emptier"
    // (md/TEMANAWA_ECOLOGY_FAUNA.md). Bounded by the population caps below, so it is
    // only ever a nudge. Wired in Moa.behave (hunger relief) + _resetAfterMating
    // (breeding cooldown); see TeManawa_goose.js.
    openCountryTussockBoost:      true,
    openCountryBoostHungerRelief: 0.04,   // per-tick hunger shaved while the flush holds (≈ offsets base hunger)
    openCountryBoostCooldownMult: 0.7,    // open-country grazers breed ~30% faster during the flush

    maxLivePlants: 900,                          // cap for kererū seed dispersal (≤1000 live-plant budget)
    disperseDensityRadius: 26,                   // a kererū seed only establishes where the canopy is
    disperseDensityMax: 3,                       // sparse: < this many live plants within the radius
    kereruMaxPopulation: 16,                     // flock cap (breeding stops at it); founders spawn 8
    kereruPopulationFloor: 2,                    // never starve below this — keeps a disperser alive so
                                                 // the interglacial forest can always recruit again
    moaPopulationFloor: 2,                         // per-species minimum — species at/below this can't
                                                   // be hunted or starved, so no moa species goes extinct

    // ==========================================================
    // ECOLOGY FEEDBACK — surplus-aware harrier + per-species carrying targets +
    // a rare last-resort safety net. The intent (per the design chat): this is an
    // ambient sim, so populations should INCREASE and DECLINE as interaction
    // feedback and never truly go extinct. Three levers work together:
    //   1. the harrier hunts whatever is most abundant (moa OR forest flyer),
    //      weighted by surplus over target, and never touches a species at its
    //      floor — so it crops booms and spares the scarce (TeManawa_eagle.js hunt);
    //   2. every species breeds up to its `target` then only trickles, so no fast
    //      breeder monopolises the shared moa cap (Moa._computeBreedDensityFactor /
    //      Kereru._tryReproduce);
    //   3. autoRefound re-seeds a species only if it gets STUCK (down to one bird,
    //      or all one sex, at/below floor) for a sustained spell — a backstop, not
    //      the mechanism. stats.refounds counts it; if it fires often the base
    //      dynamics are too harsh and we move to rate-based regulation.
    // ==========================================================
    speciesCarryingTargets: true,
    speciesBreedKnee:    0.7,    // breed freely below 0.7×target, taper to target
    speciesSuppressFloor: 0.1,   // courtship-start probability once at/over target (a trickle)
    speciesOverTargetLay: 0.12,  // grazer lay-through rate once at/over target (the brake that bites)
    recoveryBreedFrac:   0.6,    // a species below 0.6×target breeds at a relaxed hunger gate (Allee aid)
    recoveryMatingHungerMult: 1.6,// how much the hunger gate relaxes while recovering
    flyerTargetFrac:     0.6,    // fallback flyer target = 0.6×maxPopulation (when not listed below)
    flyerOverTargetBreed: 0.15,  // over-target flyers only lay 15% of the time
    eagleSurplusBonus:   4,      // how strongly the harrier prefers over-target prey
    eagleMaxChase:       420,    // ticks locked on one prey before the harrier gives up (less fruitless chasing)
    flyerFleeMult:       1.15,   // flee speed = baseSpeed×this — kept BELOW the harrier's 0.6 hunt speed so chases resolve

    // target = comfortable population (harrier crops above it, breeding tapers to it);
    // floor = protected minimum (never hunted/starved below it). Targets sum to ~38
    // grazers + ~22 flyers, well under the shared 60-moa cap and the flyer caps.
    speciesTargets: {
      upland_moa:          { target: 6, floor: 2 },
      little_bush_moa:     { target: 6, floor: 2 },
      stout_legged_moa:    { target: 5, floor: 2 },
      mantells_moa:        { target: 4, floor: 2 },
      heavy_footed_moa:    { target: 4, floor: 2 },
      giant_goose:         { target: 8, floor: 3 },
      north_island_takahe: { target: 5, floor: 2 },
      kereru:              { target: 10, floor: 3 },
      kokako:              { target: 6, floor: 2 },
      huia:                { target: 6, floor: 2 }
    },

    autoRefound:          true,
    refoundCheckInterval: 300,   // check cadence (sim-clock dt)
    refoundDelay:         2400,  // sustained "stuck" time before the safety net fires

    eruptionPlantFloor: 0.15,                      // at least 15% of plants survive any eruption
    forestBand: { min: 0.12, max: 0.80 },        // default / interglacial fallback
    forestBandByStage: {
      interglacial: { min: 0.12, max: 0.80 },
      cooling:      { min: 0.14, max: 0.62 },
      glacial:      { min: 0.16, max: 0.45 },
      fullGlacial:  { min: 0.18, max: 0.34 }
    }
  }

};

LEVEL_REGISTRY.register(LEVEL_TEMANAWA_SCAFFOLD);
