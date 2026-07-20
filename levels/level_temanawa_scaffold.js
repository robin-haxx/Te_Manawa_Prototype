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
    noiseScale: 0.005, octaves: 3, persistence: 0.3, lacunarity: 3.0,
    ridgeInfluence: 1.3, elevationPower: 1.5, islandFalloff: 0.6,
    plantDensity: 0.006, useLakes: false
  },

  biomes: {
    sea:       { key:'sea',       name:"Sea",             minElevation:0,    maxElevation:0.10,
                 colors:['#1a3a52','#1e4d6b','#236384'], contourColor:'#0f2533',
                 walkable:false, canHavePlants:false, canPlace:false },
    coastal:   { key:'coastal',   name:"Coast",           minElevation:0.10, maxElevation:0.15,
                 colors:['#c2b280','#d4c794','#e6dca8'], contourColor:'#8a7d5a',
                 walkable:true,  canHavePlants:false, canPlace:true },
    grassland: { key:'grassland', name:"Lowland",         minElevation:0.15, maxElevation:0.30,
                 colors:['#7fb069','#8fbc79','#9fc889'], contourColor:'#5a7d4a',
                 walkable:true,  canHavePlants:true, plantTypes:['tussock','flax'], canPlace:true },
    podocarp:  { key:'podocarp',  name:"Podocarp Forest", minElevation:0.30, maxElevation:0.40,
                 colors:['#2d5a3d','#346644','#3b724b'], contourColor:'#1e3d29',
                 walkable:true,  canHavePlants:true, plantTypes:['fern','rimu'], canPlace:true },
    montane:   { key:'montane',   name:"Montane Forest",  minElevation:0.40, maxElevation:0.60,
                 colors:['#4a7c59','#528764','#5a926f'], contourColor:'#335740',
                 walkable:true,  canHavePlants:true, plantTypes:['beech','fern','patotara'], canPlace:true },
    subalpine: { key:'subalpine', name:"Subalpine",       minElevation:0.60, maxElevation:0.80,
                 colors:['#a8a060','#b5ad6d','#c2ba7a'], contourColor:'#7a7445',
                 walkable:true,  canHavePlants:true, plantTypes:['tussock','patotara'], canPlace:true },
    alpine:    { key:'alpine',    name:"Alpine",          minElevation:0.77, maxElevation:0.90,
                 colors:['#8b8b8b','#9a9a9a','#a9a9a9'], contourColor:'#5c5c5c',
                 walkable:false, canHavePlants:false, canPlace:false },
    snow:      { key:'snow',      name:"Snow",            minElevation:0.90, maxElevation:1.0,
                 colors:['#e8e8e8','#f0f0f0','#ffffff'], contourColor:'#b0b0b0',
                 walkable:false, canHavePlants:false, canPlace:false }
  },

  species: {
    moa: ['upland_moa'],
    eagle: ['haasts_eagle']
  },
  startingSpecies: 'upland_moa',

  initialEntityCounts: { moa: 12, eagle: 2 },

  economy: {
    startingMauri: 60, seasonDuration: 2100, eggIncubationTime: 600,
    securityTimeToLay: 900, securityTimeVariation: 300, layingHungerThreshold: 28,
    eagleSpawnMilestones: [], maxPopulation: 60
  },

  // No toolbar in the final piece. One valid entry keeps the resolver/UI happy
  // for the boot check; the whole toolbar is removed when the HUD is rebuilt.
  availablePlaceables: { Storm: { cost: 0 } },

  // No win state: a single never-true goal keeps the run in PLAYING forever.
  goals: [
    { name: "Ambient — the ecosystem simply runs", condition: () => false, reward: 0 }
  ],

  menu: {
    title: "Avian Age: Te Manawa",
    subtitle: "Manawatū — deep time (scaffold)",
    areaLabel: "Te Manawa (systems check)",
    areaSubtitle: "placeholder scene",
    featuredSpecies: { key:'upland_moa', displayName:'Moa', localName:'', spriteKey:'moa_idle', spriteScale:2 },
    flavorText: [""],
    displayPlants: ['tussock','flax','fern','rimu','beech'],
    art: { coreWidth:1600, coreHeight:1080, bgColor:[25,35,30] }
  }
};

LEVEL_REGISTRY.register(LEVEL_TEMANAWA_SCAFFOLD);
