// ============================================================
// TE MANAWA — SCAFFOLD SCENE  (systems-check placeholder)
// ------------------------------------------------------------
// Minimal VALID ambient level whose only job is to prove the fork
// BOOTS and the ecosystem runs. This is NOT the Manawatū design —
// the real scene (deep-time terrain morph, the four North Island
// moa, Eyles' harrier / kērangi, timeline + four buttons, square/
// portrait layout) is authored per TEMANAWA_PLAN.md. Species,
// biomes and placeables below reuse existing engine keys so the
// registry validates. No win/loss: one never-true goal keeps the
// run in PLAYING indefinitely.
// ============================================================

const LEVEL_TEMANAWA_SCAFFOLD = {
  id: 'temanawa_scaffold',
  name: 'Te Manawa (scaffold)',
  unlockCondition: null,

  terrain: {
    noiseScale: 0.005, octaves: 4, persistence: 0.40, lacunarity: 3.0,
    ridgeInfluence: 1.4, elevationPower: 1.3, islandFalloff: 0.2,
    plantDensity: 0.003, useLakes: false,
    // Geography skeleton present: compress the procedural base above this so the
    // RANGES own the highs. Raised from the 0.5 default to give the plains more
    // rolling relief (octaves/persistence bumped alongside for variation). GEN-tunable.
    geoBaseCeil: 0.58,
    // Ease terrain down to plains within this fraction of the top/bottom edges, so the
    // 3/4 relief bake has no truncated range to smear vertically (the ranges' SVG polys
    // run off-frame). 0 disables.
    geoEdgeMargin: 0.10
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
  projection: { K: 0.76, liftFrac: 0.15 },

  // ==========================================================
  // BIOMES — the single source of truth for the ground look.
  // ----------------------------------------------------------
  // TerrainGenerator is constructed with this table. It is the ONLY place
  // ground colour is authored; there is no engine-side copy to keep in sync
  // (there used to be one in sketch.js, and it silently won nothing).
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
  biomes: {
    //'#000000', '#000000', '#000000'
    sea:       { key:'sea',       name:"Sea",             minElevation:0,    maxElevation:0.10,
                 colors:['#1a3a52','#1e4d6b','#236384'], contourColor:'#0f2533', outlineColor:'#9aaab5',
                 walkable:false, canHavePlants:false, canPlace:false },
    coastal:   { key:'coastal',   name:"Coast",           minElevation:0.10, maxElevation:0.15,
                 colors:['#c2b280','#d4c794','#e6dca8'], contourColor:'#8a7d5a', outlineColor:'#d2c8af',
                 walkable:true,  canHavePlants:false, canPlace:true },
    grassland: { key:'grassland', name:"Lowland",         minElevation:0.15, maxElevation:0.30,
                 colors:['#e6dca8', '#c8d697', '#789762'], contourColor:'#5a7d4a', outlineColor:'#65845a',
                 walkable:true,  canHavePlants:true, plantTypes:['tussock','flax'], canPlace:true },
    podocarp:  { key:'podocarp',  name:"Podocarp Forest", minElevation:0.30, maxElevation:0.40,
                 colors:['#2d5a3d','#346644','#3b724b'], contourColor:'#1e3d29', outlineColor:'#28452e',
                 walkable:true,  canHavePlants:true, plantTypes:['fern','rimu'], canPlace:true },
    montane:   { key:'montane',   name:"Montane Forest",  minElevation:0.40, maxElevation:0.60,
                 colors:['#4a7c59','#528764','#5a926f'], contourColor:'#335740', outlineColor:'#54a26c',
                 walkable:true,  canHavePlants:true, plantTypes:['beech','fern'], canPlace:true },
    subalpine: { key:'subalpine', name:"Subalpine",       minElevation:0.60, maxElevation:0.80,
                 colors:['#809a59','#a4b56d','#85a15c'], contourColor:'#bfcda8', outlineColor:'#a3af8f',
                 walkable:true,  canHavePlants:true, plantTypes:['tussock'], canPlace:true },
    alpine:    { key:'alpine',    name:"Alpine",          minElevation:0.77, maxElevation:0.90,
                 colors:['#8b8b8b','#9a9a9a','#a9a9a9'], contourColor:'#5c5c5c', outlineColor:'#5c6b55',
                 walkable:false, canHavePlants:false, canPlace:false },
    snow:      { key:'snow',      name:"Snow",            minElevation:0.90, maxElevation:1.0,
                 colors:['#e8e8e8','#f0f0f0','#ffffff'], contourColor:'#b0b0b0', outlineColor:'#9aa6ad',
                 walkable:false, canHavePlants:false, canPlace:false }
  },

  species: {
    moa: ['upland_moa'],
    eagle: ['haasts_eagle']
  },
  startingSpecies: 'upland_moa',

  initialEntityCounts: { moa: 10, eagle: 2 },

  // Timings only — the economy is gone (Phase 1.5). startingMauri and
  // the placeable toolbar no longer exist. (`seasonDuration` is vestigial: the
  // cold cycle is driven by the deep-time glacial index now, not a frame timer.)
  economy: {
    seasonDuration: 2100, eggIncubationTime: 600,
    securityTimeToLay: 900, securityTimeVariation: 300,
    layingHungerThreshold: 28, eagleSpawnMilestones: [], maxPopulation: 60
  },

  // ==========================================================
  // MECHANICS — opt-in behaviours read via LEVEL_MECHANICS (sketch.js loadLevel).
  // ----------------------------------------------------------
  // FOREST CONTRACTION (plan §1.3). Canopy trees (beech/rimu/fern) whose elevation
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
  // baked treeline per phase is a follow-up (see plan §1.3 / build note).
  // ==========================================================
  mechanics: {
    forestContraction: true,
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
