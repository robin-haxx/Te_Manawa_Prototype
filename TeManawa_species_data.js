// ============================================
// SPECIES DATA DEFINITIONS
// All moa species and their characteristics
// ============================================

const MOA_SPECIES = {
  // ==========================================
  // UPLAND MOA (Megalapteryx didinus)
  // Small, forest-dwelling, cold-adapted
  // ==========================================
  upland_moa: {
    displayName: "Upland Moa",
    scientificName: "Megalapteryx didinus",
    spriteSet: 'bush',         // borrows the small BushMoa art (no dedicated art yet)
    tint: null,                // Megalapteryx — rendered as-is
    highlightColor: [235, 238, 242],  // white — player highlight (pulse + UI border)
    description: "Small, hardy moa adapted to high-altitude forests",
    rarity: 'common',
    
    // Physical characteristics
    size: { min: 7, max: 9 },
    bodyColor: { r: [90, 110], g: [60, 75], b: [28, 40] },
    
    // Movement
    baseSpeed: 0.16,
    fleeSpeed: 0.3,
    maxForce: 0.02,
    
    // Survival
    maxHunger: 100,
    baseHungerRate: 0.02,
    hungerThreshold: 35,
    criticalHunger: 80,
    
    // Reproduction
    eggCooldownTime: 900,
    securityTimeBase: 450,
    securityTimeVariation: 300,
    
    // Habitat preferences
    preferredElevation: { min: 0.35, max: 0.70 },
    temperatureTolerance: { cold: 0.8, heat: 0.5 },  // Good in cold
    
    // Behavior modifiers
    flockTendency: 0.8,    // How much they stick together
    curiosity: 0.6,        // Tendency to investigate new things
    flightiness: 0.7,      // How easily spooked
    
    // Seasonal adaptations — keyed by GLACIAL PHASE (interglacial/cooling/glacial/
    // fullGlacial), the deep-time clock's SeasonManager.currentKey. NOT summer/
    // winter: those keys read undefined→1, which left every species' innate cold/
    // warm differentiation inert (see memory seasonal-modifiers-key-mismatch).
    // hungerRate <1 = thrives, >1 = struggles; it rides on top of the shared
    // per-phase hungerModifier (0.9 interglacial → 1.3 fullGlacial), so the cold
    // stays globally harder — this only decides WHO holds on.
    // Upland Moa (Megalapteryx) — cold-hardy subalpine grazer, displaced onto the
    // flats but not starved by the ice, so only a mild cold advantage.
    seasonalModifiers: {
      interglacial: { hungerRate: 1.0,  speed: 1.0  },
      cooling:      { hungerRate: 0.98, speed: 1.0  },
      glacial:      { hungerRate: 0.95, speed: 0.98 },
      fullGlacial:  { hungerRate: 0.93, speed: 0.95 }
    }
  },
  
  // ==========================================
  // SOUTH ISLAND GIANT MOA (Dinornis robustus)
  // Largest moa species, plains dweller
  // ==========================================
  south_island_giant_moa: {
    displayName: "South Island Giant Moa",
    scientificName: "Dinornis robustus",
    spriteSet: 'northGiant',   // borrows the NorthIslandGiantMoa art (both Dinornis giants)
    tint: [170, 150, 130],     // Dinornis — desaturated brown (unused while spriteSet is set)
    highlightColor: [190, 140, 90],   // brown — player highlight (pulse + UI border)
    description: "Massive moa of the lowland plains, up to 3.6m tall",
    rarity: 'uncommon',
    
    size: { min: 12, max: 16 },
    bodyColor: { r: [100, 120], g: [75, 90], b: [45, 60] },
    
    baseSpeed: 0.15,      // Slower due to size
    fleeSpeed: 0.3,
    maxForce: 0.02,
    
    maxHunger: 140,       // Needs more food
    baseHungerRate: 0.03,
    hungerThreshold: 45,
    criticalHunger: 110,
    
    eggCooldownTime: 1200,  // Longer between eggs
    securityTimeBase: 1100,
    securityTimeVariation: 500,
    
    openCountry: true,   // lowland-plains grazer — shares the TUSSOCK-in-glacial lift (see TeManawa_goose.js / Moa.behave)
    preferredElevation: { min: 0.15, max: 0.40 },
    temperatureTolerance: { cold: 0.4, heat: 0.7 },
    
    flockTendency: 0.5,    // More solitary
    curiosity: 0.4,
    flightiness: 0.5,      // Harder to scare due to size
    
    // Special: harder for eagles to catch
    eagleResistance: 0.3,  // 30% chance to resist attack
    
    // South Island Giant (Dinornis) — large mixed grazer, a shade better on the
    // open glacial flats than under closed interglacial forest.
    seasonalModifiers: {
      interglacial: { hungerRate: 1.0,  speed: 1.0  },
      cooling:      { hungerRate: 1.0,  speed: 1.0  },
      glacial:      { hungerRate: 0.98, speed: 0.95 },
      fullGlacial:  { hungerRate: 0.97, speed: 0.92 }
    }
  },
  
  // ==========================================
  // NORTH ISLAND GIANT MOA (Dinornis novaezealandiae)
  // ==========================================
  north_island_giant_moa: {
    displayName: "North Island Giant Moa",
    scientificName: "Dinornis novaezealandiae",
    spriteSet: 'northGiant',   // dedicated Moa/ art — renders untinted (see EntitySprites)
    tint: [170, 150, 130],     // Dinornis — desaturated brown (unused while spriteSet is set)
    highlightColor: [190, 140, 90],   // brown — player highlight (pulse + UI border)
    description: "Large moa of northern forests",
    rarity: 'uncommon',
    
    size: { min: 11, max: 14 },
    bodyColor: { r: [95, 115], g: [70, 85], b: [40, 55] },
    
    baseSpeed: 0.14,
    fleeSpeed: 0.45,
    maxForce: 0.02,
    
    maxHunger: 120,
    baseHungerRate: 0.05,
    hungerThreshold: 40,
    criticalHunger: 95,
    
    preferredElevation: { min: 0.18, max: 0.45 },
    temperatureTolerance: { cold: 0.5, heat: 0.6 },
    
    flockTendency: 0.6,
    curiosity: 0.5,
    flightiness: 0.55,
    
    eagleResistance: 0.2,
    
    // North Island Giant (Dinornis) — lowland forest/shrubland; leans warm, so the
    // glacial pinches it as the forest falls back.
    seasonalModifiers: {
      interglacial: { hungerRate: 0.95, speed: 1.0  },
      cooling:      { hungerRate: 1.0,  speed: 1.0  },
      glacial:      { hungerRate: 1.06, speed: 0.9  },
      fullGlacial:  { hungerRate: 1.1,  speed: 0.85 }
    }
  },
  
  // ==========================================
  // EASTERN MOA (Emeus crassus)
  // Medium-sized, adaptable
  // ==========================================
  eastern_moa: {
    displayName: "Eastern Moa",
    scientificName: "Emeus crassus",
    spriteSet: 'stoutLegged',  // borrows the stocky StoutLeggedMoa art (emeid build)
    tint: [190, 120, 60],      // emeid — saturated brown (unused while spriteSet is set)
    highlightColor: [205, 195, 120],  // wheat — player highlight (pulse + UI border)
    description: "Adaptable medium-sized moa of varied habitats",
    rarity: 'common',
    
    size: { min: 8, max: 11 },
    bodyColor: { r: [85, 105], g: [65, 80], b: [35, 50] },
    
    baseSpeed: 0.2,
    fleeSpeed: 0.5,
    maxForce: 0.02,
    
    maxHunger: 95,
    baseHungerRate: 0.038,
    hungerThreshold: 32,
    criticalHunger: 75,
    
    preferredElevation: { min: 0.20, max: 0.55 },
    temperatureTolerance: { cold: 0.6, heat: 0.6 },  // Balanced
    
    flockTendency: 0.75,
    curiosity: 0.7,
    flightiness: 0.65,
    
    // Special: finds food more efficiently
    foragingBonus: 1.2,
    
    // Eastern Moa (Emeus) — lowland/eastern dry country; mildly warm-leaning.
    seasonalModifiers: {
      interglacial: { hungerRate: 0.97, speed: 1.0  },
      cooling:      { hungerRate: 1.0,  speed: 1.0  },
      glacial:      { hungerRate: 1.03, speed: 0.95 },
      fullGlacial:  { hungerRate: 1.05, speed: 0.92 }
    }
  },
  
  // ==========================================
  // STOUT-LEGGED MOA (Euryapteryx curtus)
  // ==========================================
  stout_legged_moa: {
    displayName: "Stout-legged Moa",
    scientificName: "Euryapteryx curtus",
    spriteSet: 'stoutLegged',  // dedicated Moa/ art — renders untinted (see EntitySprites)
    tint: [205, 170, 80],      // yellow-brown (unused while spriteSet is set)
    highlightColor: [235, 165, 70],   // orange — player highlight (pulse + UI border)
    description: "Stocky moa with powerful legs, coastal to lowland",
    rarity: 'common',
    
    size: { min: 7, max: 10 },
    bodyColor: { r: [88, 108], g: [58, 73], b: [32, 45] },
    
    baseSpeed: 0.18,
    fleeSpeed: 0.6,  // Fast runner despite stocky build
    maxForce: 0.024,  // More agile
    
    maxHunger: 90,
    baseHungerRate: 0.042,
    hungerThreshold: 33,
    criticalHunger: 72,
    
    openCountry: true,   // coastal-to-lowland grazer — shares the TUSSOCK-in-glacial lift (see TeManawa_goose.js / Moa.behave)
    preferredElevation: { min: 0.12, max: 0.35 },
    temperatureTolerance: { cold: 0.5, heat: 0.7 },
    
    flockTendency: 0.85,
    curiosity: 0.5,
    flightiness: 0.75,
    
    // Stout-legged Moa (Euryapteryx) — open-country coastal/lowland grazer; the
    // glacial's expanding tussock flats suit it (openCountry).
    seasonalModifiers: {
      interglacial: { hungerRate: 1.06, speed: 1.0  },
      cooling:      { hungerRate: 1.0,  speed: 1.0  },
      glacial:      { hungerRate: 0.93, speed: 1.0  },
      fullGlacial:  { hungerRate: 0.9,  speed: 0.98 }
    }
  },
  
  // ==========================================
  // HEAVY-FOOTED MOA (Pachyornis elephantopus)
  // ==========================================
  heavy_footed_moa: {
    displayName: "Heavy-footed Moa",
    scientificName: "Pachyornis elephantopus",
    spriteSet: 'stoutLegged',  // borrows the stocky StoutLeggedMoa art (Pachyornis build)
    tint: [165, 168, 172],     // Pachyornis — grey (unused while spriteSet is set)
    highlightColor: [178, 184, 194],  // grey — player highlight (pulse + UI border)
    description: "Robust moa with massive legs, lowland specialist",
    rarity: 'uncommon',
    
    size: { min: 10, max: 13 },
    bodyColor: { r: [105, 125], g: [78, 93], b: [50, 65] },
    
    baseSpeed: 0.14,
    fleeSpeed: 0.4,
    maxForce: 0.018,
    
    maxHunger: 130,
    baseHungerRate: 0.05,
    hungerThreshold: 42,
    criticalHunger: 100,
    
    openCountry: true,   // lowland specialist on the open flats — shares the TUSSOCK-in-glacial lift (Moa.behave)
    preferredElevation: { min: 0.30, max: 0.44 },  // forest-edge competitor (lower forest band + top of flats)
    temperatureTolerance: { cold: 0.45, heat: 0.65 },
    
    flockTendency: 0.55,
    curiosity: 0.35,
    flightiness: 0.45,
    
    eagleResistance: 0.15,
    
    // Heavy-footed Moa (Pachyornis elephantopus) — grassland/shrubland flats
    // specialist; at home on the glacial outwash (openCountry).
    seasonalModifiers: {
      interglacial: { hungerRate: 1.07, speed: 1.0  },
      cooling:      { hungerRate: 1.0,  speed: 1.0  },
      glacial:      { hungerRate: 0.92, speed: 1.0  },
      fullGlacial:  { hungerRate: 0.9,  speed: 0.98 }
    }
  },
  
  // ==========================================
  // CRESTED MOA (Pachyornis australis)  
  // ==========================================
  crested_moa: {
    displayName: "Crested Moa",
    scientificName: "Pachyornis australis",
    spriteSet: 'stoutLegged',  // borrows the stocky StoutLeggedMoa art (Pachyornis build)
    tint: [165, 168, 172],     // Pachyornis — grey (unused while spriteSet is set)
    highlightColor: [178, 184, 194],  // grey — player highlight (pulse + UI border)
    description: "Southern moa with distinctive head crest",
    rarity: 'rare',
    
    size: { min: 9, max: 12 },
    bodyColor: { r: [92, 112], g: [62, 77], b: [38, 52] },
    hasCrest: true,  // Visual flag for rendering
    crestColor: { r: [140, 160], g: [100, 120], b: [60, 80] },
    
    baseSpeed: 0.21,
    fleeSpeed: 0.52,
    maxForce: 0.02,
    
    maxHunger: 105,
    baseHungerRate: 0.044,
    hungerThreshold: 36,
    criticalHunger: 82,
    
    preferredElevation: { min: 0.25, max: 0.50 },
    temperatureTolerance: { cold: 0.7, heat: 0.5 },
    
    flockTendency: 0.7,
    curiosity: 0.8,  // More curious
    flightiness: 0.6,
    
    // Crested Moa (Pachyornis australis) — subalpine/alpine cold specialist; the
    // strongest cold-thriver of the roster.
    seasonalModifiers: {
      interglacial: { hungerRate: 1.06, speed: 1.0  },
      cooling:      { hungerRate: 1.0,  speed: 1.0  },
      glacial:      { hungerRate: 0.9,  speed: 1.0  },
      fullGlacial:  { hungerRate: 0.86, speed: 0.98 }
    }
  },
  
  // ==========================================
  // MANTELL'S MOA (Pachyornis geranoides)
  // ==========================================
  mantells_moa: {
    displayName: "Mantell's Moa",
    scientificName: "Pachyornis geranoides",
    spriteSet: 'stoutLegged',  // borrows the stocky StoutLeggedMoa art (Pachyornis build)
    tint: [165, 168, 172],     // Pachyornis — grey (unused while spriteSet is set)
    highlightColor: [178, 184, 194],  // grey — player highlight (pulse + UI border)
    description: "North Island relative of the heavy-footed moa",
    rarity: 'uncommon',
    
    size: { min: 9, max: 11 },
    bodyColor: { r: [98, 118], g: [72, 87], b: [42, 57] },
    
    baseSpeed: 0.19,
    fleeSpeed: 0.48,
    maxForce: 0.021,
    
    maxHunger: 110,
    baseHungerRate: 0.046,
    hungerThreshold: 38,
    criticalHunger: 88,
    
    openCountry: true,   // North Island lowland grazer — shares the TUSSOCK-in-glacial lift (Moa.behave)
    preferredElevation: { min: 0.18, max: 0.42 },
    temperatureTolerance: { cold: 0.55, heat: 0.6 },
    
    flockTendency: 0.65,
    curiosity: 0.55,
    flightiness: 0.55,
    
    // Mantell's Moa (Pachyornis geranoides) — NI lowland open-country grazer; the
    // glacial flats suit it (openCountry).
    seasonalModifiers: {
      interglacial: { hungerRate: 1.06, speed: 1.0  },
      cooling:      { hungerRate: 1.0,  speed: 1.0  },
      glacial:      { hungerRate: 0.93, speed: 1.0  },
      fullGlacial:  { hungerRate: 0.9,  speed: 0.98 }
    }
  },
  
  // ==========================================
  // LITTLE BUSH MOA (Anomalopteryx didiformis)
  // ==========================================
  little_bush_moa: {
    displayName: "Little Bush Moa",
    scientificName: "Anomalopteryx didiformis",
    spriteSet: 'bush',         // dedicated BushMoa art (Moa/) — renders untinted
    tint: [190, 120, 60],      // emeid — saturated brown (unused while spriteSet is set)
    highlightColor: [255, 215, 70],   // yellow — player highlight (pulse + UI border)
    description: "Smallest moa, nimble forest dweller",
    rarity: 'common',
    
    size: { min: 5, max: 7 },
    bodyColor: { r: [82, 100], g: [55, 68], b: [25, 38] },
    
    baseSpeed: 0.15,       // Fastest moa
    fleeSpeed: 0.6,
    maxForce: 0.028,
    
    maxHunger: 70,        // Smallest needs least food
    baseHungerRate: 0.03,
    hungerThreshold: 28,
    criticalHunger: 58,
    
    eggCooldownTime: 690,  // Breeds faster
    securityTimeBase: 600,
    securityTimeVariation: 200,
    
    preferredElevation: { min: 0.22, max: 0.48 },
    temperatureTolerance: { cold: 0.65, heat: 0.55 },
    
    flockTendency: 0.9,    // Very social
    curiosity: 0.75,
    flightiness: 0.6,     // skittish
    
    // Fudged: harder to spot by eagles
    camouflage: 0.5,       // 50% chance eagle doesn't see

    // Unique: when migrating, passively biases toward dense forest
    // (beech/Totara/fern cover). 0..1 — weight added to migration target scoring.
    forestAffinity: 0.8,
    
    // Little Bush Moa (Anomalopteryx) — dense closed-forest bird; thrives in the
    // interglacial canopy, crowds the refugia as the glacial shrinks the forest.
    seasonalModifiers: {
      interglacial: { hungerRate: 0.92, speed: 1.0  },
      cooling:      { hungerRate: 1.0,  speed: 1.0  },
      glacial:      { hungerRate: 1.08, speed: 0.9  },
      fullGlacial:  { hungerRate: 1.12, speed: 0.85 }
    }
  }
};

// ==========================================
// RAPTOR SPECIES — Eyles' harrier / kērangi
// ------------------------------------------------------------
// The North Island apex avian predator in this window is the giant Eyles'
// harrier (kērangi), NOT Haast's eagle — Haast's was South-Island-only and a
// soaring ambush hunter, whereas the kērangi quartered low over open country
// and forest edge. The internal base type stays 'eagle' (a mechanical list
// name, not visitor-facing); only the identity is the harrier's. Behaviour
// tuning (low quartering flight vs the inherited soaring approach) is a
// separate follow-up — see md/TEMANAWA_PLAN_V3.md §14.1 and the memory
// raptor-identity-conflation.
// ==========================================
const EAGLE_SPECIES = {
  eyles_harrier: {
    displayName: "Eyles' Harrier",
    scientificName: "Circus teauteensis",
    description: "Kērangi — the largest harrier known; hunted birds low over open country and forest edge",
    rarity: 'common',
    
    wingspan: { min: 10, max: 14 },
    
    baseSpeed: 0.4,
    huntSpeed: 1.2,
    maxForce: 0.05,
    
    maxHunger: 100,
    hungerRate: 0.02,
    huntThreshold: 5,
    
    huntRadius: 130,
    catchRadius: 12,
    
    patrolRadius: { min: 70, max: 100 },
    
    // Hunting preferences
    preferredPreySize: { min: 5, max: 12 },  // Optimal moa size
    largePenalty: 0.7,  // Multiplier for attacking larger moa
    
    restDuration: 180
  },
  
  // Juvenile variant — faster, less accurate
  young_eyles_harrier: {
    displayName: "Young Eyles' Harrier",
    scientificName: "Circus teauteensis (juvenile)",
    description: "A juvenile kērangi — quick, but still learning to hunt",
    rarity: 'uncommon',
    
    wingspan: { min: 8, max: 10 },
    
    baseSpeed: 0.5,
    huntSpeed: 1.3,    // Faster but less accurate
    maxForce: 0.045,
    
    maxHunger: 90,
    hungerRate: 0.024, // Higher metabolism
    huntThreshold: 45, // Hunts when less hungry
    
    huntRadius: 100,   // Less experienced at spotting
    catchRadius: 10,   // Less accurate
    
    patrolRadius: { min: 50, max: 70 },
    
    preferredPreySize: { min: 5, max: 9 },
    largePenalty: 0.5,
    
    restDuration: 120  // Recovers faster
  }
};

// ==========================================
// REGISTRATION FUNCTION
// Call this during game initialization
// ==========================================
function registerAllSpecies() {
  // Register base animal types first
  REGISTRY.registerAnimalType('moa', {
    // Default moa config (can be empty, species will override)
  }, Moa);
  
  REGISTRY.registerAnimalType('eagle', {}, EylesHarrier);

  // Register all moa species
  for (const [key, config] of Object.entries(MOA_SPECIES)) {
    REGISTRY.registerSpecies(key, 'moa', config);
  }
  
  // Register all eagle species
  for (const [key, config] of Object.entries(EAGLE_SPECIES)) {
    REGISTRY.registerSpecies(key, 'eagle', config);
  }
}