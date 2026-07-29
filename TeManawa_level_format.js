// ============================================
// LEVEL FORMAT & REGISTRY
// ============================================

const LEVEL_REGISTRY = {
  _levels: {},
  _order: [],
  
  register(levelDef) {
    if (!levelDef.id) {
      console.error('Level missing id:', levelDef);
      return;
    }
    this._levels[levelDef.id] = levelDef;
    if (!this._order.includes(levelDef.id)) {
      this._order.push(levelDef.id);
    }
  },
  
  get(id) {
    return this._levels[id] || null;
  },
  
  getAll() {
    return this._order.map(id => this._levels[id]);
  },
  
  getUnlocked(progress) {
    return this.getAll().filter(level => {
      if (!level.unlockCondition) return true;
      return level.unlockCondition(progress);
    });
  },
  
  getFirst() {
    return this._levels[this._order[0]] || null;
  },
  
  getNext(currentId) {
    const idx = this._order.indexOf(currentId);
    if (idx === -1 || idx >= this._order.length - 1) return null;
    return this._levels[this._order[idx + 1]];
  },
  
  validate(levelDef) {
    const issues = [];
    const required = [
      'id', 'name', 'terrain', 'biomes', 'species',
      'startingSpecies', 'initialEntityCounts', 'economy',
      'goals', 'availablePlaceables', 'menu'
    ];
    
    for (const field of required) {
      if (!(field in levelDef)) {
        issues.push(`Missing required field: ${field}`);
      }
    }
    
    // Validate species references exist in MOA_SPECIES / EAGLE_SPECIES
    if (levelDef.species) {
      for (const key of (levelDef.species.moa || [])) {
        if (!MOA_SPECIES[key]) issues.push(`Unknown moa species: ${key}`);
      }
      for (const key of (levelDef.species.eagle || [])) {
        if (!EAGLE_SPECIES[key]) issues.push(`Unknown eagle species: ${key}`);
      }
    }
    
    // Validate biome plant references
    if (levelDef.biomes) {
      for (const [biomeKey, biome] of Object.entries(levelDef.biomes)) {
        if (biome.plantTypes) {
          for (const pt of biome.plantTypes) {
            if (!PLANT_TYPES[pt]) issues.push(`Biome ${biomeKey} references unknown plant: ${pt}`);
          }
        }
      }
    }
    
    // Validate placeable references
    if (levelDef.availablePlaceables) {
      for (const key of Object.keys(levelDef.availablePlaceables)) {
        if (!PLACEABLES[key]) issues.push(`Unknown placeable: ${key}`);
      }
    }
    
    if (issues.length > 0) {
      console.warn(`Level "${levelDef.id}" validation issues:`, issues);
    }
    return issues;
  }
};

// ============================================
// BIOME BAND VALIDATION
// ============================================
// Mirrors TerrainGenerator.getBiomeFromElevation exactly: bands are scanned in
// ascending minElevation order and the FIRST band containing the elevation wins.
//
// So overlapping bands do not blend — the lower band shadows the higher one, and
// a fully shadowed band never draws at all. That is the second way an edit to a
// biome's colours can appear to do nothing (the first was a duplicate BIOMES
// table in sketch.js, now deleted), and it is invisible in the data: the bands
// look fine read one at a time.
//
// Runs at level load and reports the EFFECTIVE range each biome actually gets
// alongside the declared one. Warnings only — the renderer is happy either way,
// and a deliberate overlap is a legitimate authoring choice.
function validateBiomeBands(biomes) {
  const list = Object.values(biomes || {})
    .filter(b => b && typeof b.minElevation === 'number')
    .sort((a, b) => a.minElevation - b.minElevation);
  if (!list.length) return [];

  // Sweep the elevation range and record who actually wins each sample. Cheap
  // (2000 iterations, once per level load) and it cannot drift from the
  // renderer's behaviour the way a hand-derived interval calculation would.
  const STEPS = 2000;
  const eff = new Map();          // key -> { n, lo, hi }
  let unclaimed = 0;

  for (let i = 0; i < STEPS; i++) {
    const e = i / STEPS;
    let hit = null;
    for (let j = 0; j < list.length; j++) {
      const b = list[j];
      if (e >= b.minElevation && e < b.maxElevation) { hit = b; break; }
    }
    if (!hit) { unclaimed++; continue; }
    const rec = eff.get(hit.key) || { n: 0, lo: e, hi: e };
    rec.n++;
    rec.hi = e;
    eff.set(hit.key, rec);
  }

  const issues = [];
  const EPS = 1.5 / STEPS;

  for (const b of list) {
    const rec = eff.get(b.key);
    const declared = `${b.minElevation}-${b.maxElevation}`;

    if (!rec) {
      const shadow = list.find(o => o !== b &&
        o.minElevation <= b.minElevation && o.maxElevation >= b.maxElevation);
      issues.push(`'${b.key}' (${declared}) NEVER renders` +
        (shadow ? ` — fully shadowed by '${shadow.key}' (${shadow.minElevation}-${shadow.maxElevation})` : '') +
        `. Editing its colours will do nothing.`);
      continue;
    }

    // Partially shadowed: it draws, but not over the band as written, so only
    // part of a colour edit shows up.
    if (rec.lo > b.minElevation + EPS) {
      const shadow = list.find(o => o !== b &&
        o.minElevation < b.minElevation && o.maxElevation > b.minElevation);
      issues.push(`'${b.key}' declares ${declared} but only renders ` +
        `${rec.lo.toFixed(3)}-${b.maxElevation}` +
        (shadow ? ` — '${shadow.key}' overlaps its lower edge (ends ${shadow.maxElevation})` : ''));
    }

    const share = rec.n / STEPS;
    if (share < 0.02) {
      issues.push(`'${b.key}' holds ${(share * 100).toFixed(1)}% of the elevation ` +
        `range — its colours will be hard to find on screen.`);
    }
  }

  if (unclaimed > 0) {
    issues.push(`${(unclaimed / STEPS * 100).toFixed(1)}% of elevation 0-1 is in no band; ` +
      `those cells fall through to '${list[list.length - 1].key}'.`);
  }

  if (issues.length > 0) {
    console.warn('[Biomes] band issues — see TeManawa_level_format.js ' +
                 'validateBiomeBands:\n  · ' + issues.join('\n  · '));
  }
  return issues;
}

// FINAL SCORE — removed in Phase 1.5. There is no score, no win state and
// no mauri to total, so defaultLevelScore/computeLevelScore are gone.

// Default values that levels can omit to use these
const LEVEL_DEFAULTS = {
  terrain: {
    noiseScale: 0.005,
    octaves: 3,
    persistence: 0.3,
    lacunarity: 3.0,
    ridgeInfluence: 1.3,
    elevationPower: 1.5,
    islandFalloff: 0.6,                             // potential bug/ new similar system per level
    plantDensity: 0.006                             // !
  },
  economy: {
    seasonDuration: 2100,
    eggIncubationTime: 500,
    securityTimeToLay: 800,
    securityTimeVariation: 200,
    layingHungerThreshold: 28,

    eagleSpawnMilestones: [12, 18, 25, 35, 45, 55], // !
    maxPopulation: 60                               // !
  },
  initialEntityCounts: {                            // !!
    moa: 7,
    eagle: 2
  }
};

// Merge a level definition with defaults (level values win)
function resolveLevelDef(levelDef) {
  // Only deep-clone the plain-data parts
  const resolved = {};
  
  // Copy all top-level properties by reference first
  // (this preserves functions, arrays of objects with functions, etc.)
  for (const key in levelDef) {
    resolved[key] = levelDef[key];
  }
  
  // Deep-merge only the plain-data objects that have no functions
  resolved.terrain = Object.assign(
    {}, LEVEL_DEFAULTS.terrain, levelDef.terrain || {}
  );
  resolved.economy = Object.assign(
    {}, LEVEL_DEFAULTS.economy, levelDef.economy || {}
  );
  resolved.initialEntityCounts = Object.assign(
    {}, LEVEL_DEFAULTS.initialEntityCounts, levelDef.initialEntityCounts || {}
  );

  // Goals array is kept by reference — functions intact
  // (already copied above, but being explicit)

  // Resolve placeable overrides onto base PLACEABLES
  if (resolved.availablePlaceables) {
    resolved._resolvedPlaceables = {};
    for (const [key, overrides] of Object.entries(resolved.availablePlaceables)) {
      if (PLACEABLES[key]) {
        resolved._resolvedPlaceables[key] = Object.assign(
          {}, PLACEABLES[key], overrides || {}
        );
      }
    }
  }

  return resolved;
}