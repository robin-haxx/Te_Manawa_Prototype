// ============================================
// ENTITY REGISTRY
// Central registration and factory for all entities.
// ============================================

class EntityRegistry {
  constructor() {
    this.species = new Map();        // animal species (moa/eagle variants)
    this.animalTypes = new Map();    // base animal types (moa, eagle, …)
    this.plantTypes = new Map();     // plant definitions
    this.placeables = new Map();     // placeable items
    this.biomes = new Map();         // biome definitions
    this.levels = new Map();         // level/scenario definitions
    this.speciesByType = new Map();  // base type -> [speciesKey, …]
  }

  // ---- animal types: base 'moa'/'eagle' — the class + shared config ----------
  registerAnimalType(typeKey, config, behaviorClass) {
    this.animalTypes.set(typeKey, {
      key: typeKey,
      config: config,
      class: behaviorClass,
      baseConfig: { ...config }  // original, for reference
    });
    if (!this.speciesByType.has(typeKey)) this.speciesByType.set(typeKey, []);
  }

  getAnimalType(typeKey) { return this.animalTypes.get(typeKey); }

  // ---- species: variants of a base type, e.g. 'upland_moa' of 'moa' ----------
  registerSpecies(speciesKey, baseType, speciesConfig) {
    const baseAnimal = this.animalTypes.get(baseType);
    if (!baseAnimal) {
      console.error(`Cannot register species '${speciesKey}': base type '${baseType}' not found`);
      return;
    }

    const mergedConfig = this.mergeConfigs(baseAnimal.config, speciesConfig);

    this.species.set(speciesKey, {
      key: speciesKey,
      baseType: baseType,
      config: mergedConfig,
      class: speciesConfig.class || baseAnimal.class,
      displayName: speciesConfig.displayName || speciesKey,
      description: speciesConfig.description || '',
      rarity: speciesConfig.rarity || 'common',
      overrides: Object.keys(speciesConfig)   // what this variant changed
    });

    const typeSpecies = this.speciesByType.get(baseType);
    if (typeSpecies && !typeSpecies.includes(speciesKey)) typeSpecies.push(speciesKey);
  }

  // Deep-merge two configs; source overrides base.
  mergeConfigs(base, source) {
    const result = { ...base };
    for (const key in source) {
      if (source[key] !== undefined) {
        if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
          result[key] = this.mergeConfigs(result[key] || {}, source[key]);
        } else {
          result[key] = source[key];
        }
      }
    }
    return result;
  }

  getSpecies(speciesKey) { return this.species.get(speciesKey); }

  getSpeciesOfType(baseType) {
    const speciesKeys = this.speciesByType.get(baseType) || [];
    return speciesKeys.map(key => this.species.get(key));
  }

  createAnimal(speciesKey, x, y, terrain, gameConfig) {
    const species = this.species.get(speciesKey);
    if (!species) {
      console.error(`Unknown species: ${speciesKey}`);
      return null;
    }
    const finalConfig = this.mergeConfigs(gameConfig, species.config);
    const instance = new species.class(x, y, terrain, finalConfig, species);
    instance.speciesKey = speciesKey;
    instance.speciesData = species;
    return instance;
  }

  // Random species of a type, weighted by rarity.
  createRandomOfType(baseType, x, y, terrain, gameConfig, rarityWeights = null) {
    const speciesList = this.getSpeciesOfType(baseType);
    if (speciesList.length === 0) {
      console.error(`No species registered for type: ${baseType}`);
      return null;
    }

    const weights = rarityWeights || { common: 1.0, uncommon: 0.5, rare: 0.2 };

    let totalWeight = 0;
    const weightedSpecies = speciesList.map(species => {
      totalWeight += weights[species.rarity] || 1.0;
      return { species, cumulative: totalWeight };
    });

    const roll = Math.random() * totalWeight;
    const selected = weightedSpecies.find(ws => roll <= ws.cumulative);
    return this.createAnimal(selected.species.key, x, y, terrain, gameConfig);
  }

  // ---- plants / placeables / biomes / levels ---------------------------------
  registerPlant(key, config)     { this.plantTypes.set(key, { key, ...config }); }
  getPlant(key)                  { return this.plantTypes.get(key); }
  registerPlaceable(key, config) { this.placeables.set(key, { key, ...config }); }
  getPlaceable(key)              { return this.placeables.get(key); }
  registerBiome(key, config)     { config.key = key; this.biomes.set(key, config); }
  getBiome(key)                  { return this.biomes.get(key); }
  registerLevel(key, config)     { this.levels.set(key, { key, ...config }); }
  getLevel(key)                  { return this.levels.get(key); }

  getSummary() {
    return {
      animalTypes: Array.from(this.animalTypes.keys()),
      species: Array.from(this.species.keys()),
      speciesByType: Object.fromEntries(this.speciesByType),
      plants: Array.from(this.plantTypes.keys()),
      placeables: Array.from(this.placeables.keys()),
      biomes: Array.from(this.biomes.keys()),
      levels: Array.from(this.levels.keys())
    };
  }

  // Report species with an unknown base type and biomes with unknown plants.
  validate() {
    const issues = [];
    for (const [key, species] of this.species) {
      if (!this.animalTypes.has(species.baseType)) {
        issues.push(`Species '${key}' references unknown base type '${species.baseType}'`);
      }
    }
    for (const [key, biome] of this.biomes) {
      if (biome.plantTypes) {
        for (const plantType of biome.plantTypes) {
          if (!this.plantTypes.has(plantType)) {
            issues.push(`Biome '${key}' references unknown plant type '${plantType}'`);
          }
        }
      }
    }
    if (issues.length > 0) console.warn('Registry validation issues:', issues);
    return issues;
  }
}

const REGISTRY = new EntityRegistry();
