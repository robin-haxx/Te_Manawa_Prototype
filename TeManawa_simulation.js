// ============================================
// SIMULATION CLASS
// All coordinates are in WORLD space (game area, not canvas)
// ============================================

// Death fade: how long (real ms) a removed bird or a browsed plant takes to ease
// out. Advanced on the REAL frame clock (not the deep-time sim clock) so a death
// reads as a soft dissolve at wall-clock rate even in 10x fast-forward. Composited
// via drawingContext.globalAlpha at the render layer (the same technique the HUD
// clouds use), so nothing in an entity's own render() needs to know about it.
const TM_FADE_MS = 380;

class Simulation {
  constructor(terrain, config, game, seasonManager) {
    this.terrain = terrain;
    this.config = config;
    this.game = game;
    this.seasonManager = seasonManager;
    this.moas = [];
    this.eagles = [];
    this.plants = [];
    this.eggs = [];
    this.placeables = [];

    this.stats = {
      births: 0,
      deaths: 0,
      starvations: 0,
      birthsBySpecies: {},
      deathsBySpecies: {},
      anySpeciesExtinct: false,
      eagleBirths: 0,
      eagleDeaths: 0,
      refounds: 0,       // times a near-extinct (≤1) species had a founder added
      sexRebalances: 0   // times a same-sex floored pair was flipped to break the deadlock

    };

    this.activeSpecies = { moa: [], eagle: [] };
    this.otherEntities = {};
    this._speciesStableTimes = {};
    this._speciesLastAlive = {};

    const worldWidth = terrain.mapWidth;
    const worldHeight = terrain.mapHeight;
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;

    // Spatial grids with appropriate cell sizes
    this.moaGrid = new SpatialGrid(worldWidth, worldHeight, 60);
    this.eagleGrid = new SpatialGrid(worldWidth, worldHeight, 100);
    this.plantGrid = new SpatialGrid(worldWidth, worldHeight, 50);
    this.placeableGrid = new SpatialGrid(worldWidth, worldHeight, 80);
    this.eggGrid = new SpatialGrid(worldWidth, worldHeight, 40);

    // All grids + entity lists for batch operations
    this._gridEntityPairs = [
      { grid: this.moaGrid, list: this.moas },
      { grid: this.eagleGrid, list: this.eagles },
      { grid: this.plantGrid, list: this.plants },
      { grid: this.placeableGrid, list: this.placeables },
      { grid: this.eggGrid, list: this.eggs }
    ];

    this._dynamicGrids = {};   // underscore matters: updateSpatialGrids()/getNearbyOfType() read this._dynamicGrids

    // Population cache
    this._cachedAliveMoas = 0;
    this._cachedAliveEggs = 0;
    this._cacheFrame = -1;
    
    // Plant update batching
    this._plantBatchIndex = 0;
    this._plantBatchSize = 50;
    
    // Reusable position vector
    this._tempPos = null;
    
    this.spawnPadding = 30;
    
    // Viewport bounds (updated each frame for culling)
    this._viewLeft = 0;
    this._viewTop = 0;
    this._viewRight = worldWidth;
    this._viewBottom = worldHeight;
    this._viewMargin = 60;
    
    // Cached summary
    this._cachedSummary = {
      moaCount: 0,
      aliveMoas: [],
      migratingCount: 0,
      eggCount: 0,
      eagleCount: 0,
      plantCount: 0,
      dormantPlantCount: 0,
      births: 0,
      deaths: 0
    };
    this._summaryFrame = -1;
    
    // Timers for throttled updates
    this._placeableTimer = 0;
    this._cleanupTimer = 0;
    this._eagleRegTimer = 0;
    
    // Nest lookup cache
    this._nestCache = [];
    this._nestCacheValid = false;
  }

  init() {
    this._tempPos = createVector(0, 0);
    this.spawnPlants();
    
    // Check if the level defines a species distribution
    const level = this.game.currentLevel;
    
    if (level && level.initialSpeciesDistribution) {
      // Multi-species spawn: distribute according to weights
      this._spawnDistributedMoas(level.initialSpeciesDistribution);
    } else {
      // Single-species spawn (level 1 style)
      this.spawnMoas(this.config.initialMoaCount, this.config.startingSpecies || null);
    }

    // Founder sexing bias: the two same-species moa that spawn closest together
    // get a 50% higher chance of being opposite sex (0.5 → 0.75 under random
    // sexing), so the most likely first encounter can lead to a breeding pair.
    this._biasClosestPairSexes();

    this.spawnEagles(this.config.eagleCount);

    // Emergent eagles start as a breeding PAIR: the spawned founder plus one egg
    // of the opposite sex, laid at a crag eyrie and hatching after ~30s.
    if (typeof LEVEL_MECHANICS !== 'undefined' && LEVEL_MECHANICS.emergentEagles) {
      this._spawnFounderEagleEgg();
    }

    // Spawn other entity types if the level defines them
    if (level && level.initialEntityCounts) {
      for (const [type, count] of Object.entries(level.initialEntityCounts)) {
        if (type === 'moa' || type === 'eagle') continue; // Already handled
        this._spawnOtherEntities(type, count);
      }
    }
  }

  _spawnDistributedMoas(distribution) {
    const pref = this.seasonManager.getPreferredElevation();
    
    for (const [speciesKey, count] of Object.entries(distribution)) {
      // Habitat source: the MOA_SPECIES literal for the moa, else the registry —
      // moa-guild species defined elsewhere (e.g. the goose in GOOSE_SPECIES) are
      // registered under the `moa` base type but are not in the MOA_SPECIES object.
      const species = MOA_SPECIES[speciesKey] ||
        (typeof REGISTRY !== 'undefined' && REGISTRY.getSpecies(speciesKey) && REGISTRY.getSpecies(speciesKey).config);
      if (!species) {
        console.warn(`Unknown moa species in distribution: ${speciesKey}`);
        continue;
      }
      
      // Use the species' preferred elevation if available, 
      // otherwise fall back to season default
      const minElev = species.preferredElevation?.min || pref.min;
      const maxElev = species.preferredElevation?.max || pref.max;
      
      for (let i = 0; i < count; i++) {
        const pos = this.findWalkablePosition(minElev, maxElev);
        const moa = this._createFromRegistry('moa', speciesKey, pos.x, pos.y, Moa);
        if (moa) {
          // Deterministic founder sexing: alternate F/M within each species so a
          // 2-count seeds 1+1 (not a 50% same-sex pair that forces outcrossing).
          moa.isFemale = (i % 2 === 0);
          this.moas.push(moa);
        }
      }
    }
  }

  // For each species, find the closest pair of founders; if they're same-sex,
  // make them opposite-sex with 50% probability. That takes P(opposite) from
  // p to p + (1-p)/2 — for the random-sexing baseline p = 0.5 that's 0.75,
  // i.e. a 50% higher chance. Sexes are swapped with another founder where
  // possible so the species' overall sex balance is unchanged.
  _biasClosestPairSexes() {
    const bySpecies = {};
    for (let i = 0; i < this.moas.length; i++) {
      const m = this.moas[i];
      if (!m.alive) continue;
      (bySpecies[m.speciesKey] || (bySpecies[m.speciesKey] = [])).push(m);
    }

    for (const key in bySpecies) {
      const list = bySpecies[key];
      if (list.length < 2) continue;

      // Closest pair — founder counts are tiny, O(n²) is fine here.
      let a = null, b = null, bestD2 = Infinity;
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          const dx = list[i].pos.x - list[j].pos.x;
          const dy = list[i].pos.y - list[j].pos.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < bestD2) { bestD2 = d2; a = list[i]; b = list[j]; }
        }
      }

      if (!a || a.isFemale !== b.isFemale) continue;  // already opposite
      if (random() >= 0.5) continue;                  // upgrade half the same-sex cases

      // Swap with an opposite-sex founder to keep the balance; flip if none.
      let donor = null;
      for (let i = 0; i < list.length; i++) {
        const m = list[i];
        if (m !== a && m !== b && m.isFemale !== a.isFemale) { donor = m; break; }
      }
      if (donor) {
        const s = donor.isFemale;
        donor.isFemale = b.isFemale;
        b.isFemale = s;
      } else {
        b.isFemale = !b.isFemale;
      }
    }
  }

  _spawnOtherEntities(type, count) {
    // This is a hook for weka, kea, etc.
    // For now, create the list and spawn using registry
    if (!this.otherEntities[type]) {
      this.otherEntities[type] = [];
    }

    // Huia found as bonded male+female pairs at one tree (see TeManawa_huia.js).
    if (type === 'huia') { this._spawnHuiaPairs(count); return; }

    for (let i = 0; i < count; i++) {
      const pos = this.findWalkablePosition(0.15, 0.65, true);   // flyer → spawn on-screen
      const entity = this._createFromRegistry(type, type, pos.x, pos.y, null);

      if (entity) {
        this.otherEntities[type].push(entity);
      } else {
        console.warn(`Could not create entity of type: ${type}. ` +
          `Register it in REGISTRY before the level loads.`);
      }
    }
  }

  // Found huia as male+female pairs: each pair drops on one walkable forest-ish
  // spot, the two birds a few px apart and bonded, so they start on the same tree
  // and forage together (Huia._anchorPoint / _findFruitTree keep them there).
  _spawnHuiaPairs(count) {
    const list = this.otherEntities.huia || (this.otherEntities.huia = []);
    const pairs = Math.max(1, Math.floor(count / 2));   // whole pairs (an odd count rounds down)
    for (let p = 0; p < pairs; p++) {
      const base = this.findWalkablePosition(0.2, 0.6, true);   // huia pair → found on-screen
      const bx = base.x, by = base.y;                 // copy now — findWalkablePosition reuses _tempPos
      const male = this._createFromRegistry('huia', 'huia',
        bx + random(-8, 8), by + random(-8, 8), null);
      const female = this._createFromRegistry('huia', 'huia',
        bx + random(-8, 8), by + random(-8, 8), null);
      if (!male && !female) {
        console.warn('Could not create huia. Register it in REGISTRY before the level loads.');
        return;                                       // creation failing once will fail every time
      }
      if (male)   { male.isFemale = false;  list.push(male); }
      if (female) { female.isFemale = true; list.push(female); }
      if (male && female) { male._mate = female; female._mate = male; }
    }
  }
  
  // ============================================
  // REGISTRY HELPER (eliminates 3x duplication)
  // ============================================
  
  _createFromRegistry(type, speciesKey, x, y, FallbackClass) {
    if (typeof REGISTRY !== 'undefined') {
      if (speciesKey) {
        const entity = REGISTRY.createAnimal(speciesKey, x, y, this.terrain, this.config);
        if (entity) return entity;
      }
      const entity = REGISTRY.createRandomOfType(type, x, y, this.terrain, this.config);
      if (entity) return entity;
    }
    return new FallbackClass(x, y, this.terrain, this.config);
  }
  
  // ============================================
  // VIEWPORT MANAGEMENT
  // ============================================
  
  updateViewport() {
    // Cull box in WORLD coords. Use the LIVE view zoom the renderer draws with
    // (CONFIG.viewZoom), not the authored CONFIG.zoom — when viewZoom < zoom (a
    // wider view) a box sized to zoom comes out too SMALL and on-screen entities
    // near the edge get culled (a visible pop-out). Falls back to zoom if unset.
    const invZoom = 1 / (this.config.viewZoom || this.config.zoom || 1);
    // The 3/4 squash (Projection.K ≤ 1) packs more world rows onto the screen
    // vertically, so widen the bottom bound by 1/K — an over-inclusive box only
    // ever costs a few off-screen draws, never a visible pop-out. (LIFT headroom
    // joins this once relief lands — md/TEMANAWA_34VIEW_PLAN.md §5 culling note.)
    const K = (typeof Projection !== 'undefined' && Projection.K) ? Projection.K : 1;
    this._viewLeft = 0;
    this._viewTop = 0;
    this._viewRight = this.config.gameAreaWidth * invZoom;
    this._viewBottom = this.config.gameAreaHeight * invZoom / K;
  }
  
  // ============================================
  // SPAWNING
  // ============================================
  
  setActiveSpecies(species) {
    this.activeSpecies = species;
  
    // Initialize entity lists for non-moa/eagle types
    if (species.other) {
      for (const type of species.other) {
        if (!this.otherEntities[type]) {
          this.otherEntities[type] = [];
        }
      }
    }
    
    // Initialize per-species stats
    for (const key of (species.moa || [])) {
      this.stats.birthsBySpecies[key] = 0;
      this.stats.deathsBySpecies[key] = 0;
      this._speciesStableTimes[key] = 0;
      this._speciesLastAlive[key] = false;
    }
    if (species.other) {
      for (const key of species.other) {
        this._speciesStableTimes[key] = 0;
        this._speciesLastAlive[key] = false;
      }
    }
  }
  
  // A plant site is valid only on LAND. The biome grid (getBiomeAt) is coarse, so a
  // canHavePlants cell (e.g. the riverbank WETLAND) can still overlap a finer PAINT-water
  // cell right at the channel — which is how trees ended up standing in the river after the
  // wetland biome landed. waterTypeAt (0 land · 1 sea · 2 river) is the authoritative fine
  // test, the same one cullSubmergedPlants uses. Returns true (allow) before the first bake,
  // where waterTypeAt reads 0 — cullSubmergedPlants still sweeps afterwards as the backstop.
  _plantSiteIsLand(x, y) {
    const t = this.terrain;
    return !(t && typeof t.waterTypeAt === 'function' && t.waterTypeAt(x, y) !== 0);
  }

  spawnPlants() {
    const spawnScale = 2;
    const spawnCols = Math.ceil(this.worldWidth / spawnScale);
    const spawnRows = Math.ceil(this.worldHeight / spawnScale);
    // Scale plant density by the view zoom-out (config.viewAreaGain): the world extent for
    // spawning is unchanged, but it now DEPICTS ~this-much-more terrain, so bumping density by
    // the same factor keeps the on-screen plant density (plants per screen) constant instead of
    // looking sparse after zooming out. 1 = off. Well under the ≤1000 live-plant budget.
    const density = this.config.plantDensity * ((this.config.viewAreaGain > 0) ? this.config.viewAreaGain : 1);
    const terrain = this.terrain;
    
    for (let row = 0; row < spawnRows; row++) {
      for (let col = 0; col < spawnCols; col++) {
        const x = col * spawnScale + random(-1, 1);
        const y = row * spawnScale + random(-1, 1);
        const biome = terrain.getBiomeAt(x, y);
        
        // Per-biome density multiplier: a thin-corridor habitat (the riverbank WETLAND) reads
        // sparse at the uniform global density, so it can ask for more via biome.plantDensityMult.
        if (biome.canHavePlants && random() < density * (biome.plantDensityMult || 1) && this._plantSiteIsLand(x, y)) {
          const plantTypes = biome.plantTypes;
          const plantType = plantTypes[(random() * plantTypes.length) | 0];
          this.plants.push(new Plant(x, y, plantType, terrain, biome.key));
        }
      }
    }
  }

  // KERERŪ SEED DISPERSAL. The only runtime path that GROWS the plant population, so it is the
  // single place the live-plant cap is enforced (nothing else adds plants — spawnPlants runs once
  // at init, and browsed plants regrow in place). Plants a FOREST seedling (a warm, large-fruited
  // type the biome supports) near (x,y) at low growth so it visibly grows in. Returns the new
  // plant, or null if capped / no forest-capable spot found. See TeManawa_kereru.js.
  disperseSeed(x, y) {
    const M = (typeof LEVEL_MECHANICS !== 'undefined') ? LEVEL_MECHANICS : null;
    const cap = (M && M.maxLivePlants) || 900;
    if (this.plants.length >= cap) return null;
    const terrain = this.terrain;
    const warmMax = (typeof TM_GROW !== 'undefined') ? TM_GROW.warmMax : 0.65;
    // Density gate: a large seed dropped into an already-dense stand rarely
    // establishes, so dispersal only SUCCEEDS where the canopy is sparse. This is
    // what stops a kererū carpeting one patch with seedlings.
    const densR = (M && M.disperseDensityRadius) ?? 26;
    const densMax = (M && M.disperseDensityMax) ?? 3;
    for (let tries = 0; tries < 6; tries++) {
      const a = random(TWO_PI), r = random(46);
      const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
      const biome = terrain.getBiomeAt(px, py);
      if (!biome || !biome.canHavePlants || !biome.plantTypes) continue;
      if (!this._plantSiteIsLand(px, py)) continue;   // never disperse onto river/sea water
      // kererū disperse LARGE forest fruit → only warm (low coldTolerance) types recruit
      const warm = [];
      for (let i = 0; i < biome.plantTypes.length; i++) {
        const t = biome.plantTypes[i], d = PLANT_TYPES[t];
        if (d && d.coldTolerance <= warmMax && !d.disturbanceRecruit) warm.push(t);   // kahikatea needs a river disturbance, not a kererū
      }
      if (!warm.length) continue;
      // Skip this site if the neighbourhood already holds enough live plants.
      let live = 0;
      const near = this.getNearbyPlants(px, py, densR);
      for (let i = 0; i < near.length; i++) { if (near[i].alive && ++live >= densMax) break; }
      if (live >= densMax) continue;
      const type = warm[(random() * warm.length) | 0];
      const p = new Plant(px, py, type, terrain, biome.key);
      p.growth = 0.06;               // a fresh seedling — grows in over time
      this.plants.push(p);
      return p;
    }
    return null;
  }

  // GROWTH-BUTTON SEEDING. A FOREST / TUSSOCK press doesn't only mature standing cover (InstallHUD.
  // _growPulse) — it also SEEDS a few new seedlings of that set into the habitat that suits them, so
  // the boost visibly starts new plants, not just fattens existing ones. warm=true → FOREST (low
  // coldTolerance) into forest-capable biomes; warm=false → TUSSOCK (cold-hardy) into open biomes.
  // Only biomes whose own plantTypes include the set take a seed, so forest lands in forest ground
  // and tussock in open ground; a press against the climate seeds plants the forest-band / dormancy
  // machinery then suppresses (the same lesson _growPulse teaches). Cap- and density-gated. Returns
  // how many established. Fired from the button ACTION (a burst per press), off the per-frame path.
  seedGrowth(warm, count = 6) {
    const M = (typeof LEVEL_MECHANICS !== 'undefined') ? LEVEL_MECHANICS : null;
    const cap = (M && M.maxLivePlants) || 900;
    const G = (typeof TM_GROW !== 'undefined') ? TM_GROW : { warmMax: 0.65, coldMin: 0.75 };
    const TYPES = (typeof PLANT_TYPES !== 'undefined') ? PLANT_TYPES : null;
    const terrain = this.terrain;
    if (!TYPES || !terrain) return 0;
    let seeded = 0;
    for (let tries = 0; tries < count * 10 && seeded < count; tries++) {
      if (this.plants.length >= cap) break;
      const px = random(this.worldWidth), py = random(this.worldHeight);
      const biome = terrain.getBiomeAt(px, py);
      if (!biome || !biome.canHavePlants || !biome.plantTypes) continue;
      if (!this._plantSiteIsLand(px, py)) continue;   // never seed onto river/sea water
      // Only the requested set from THIS biome's palette — so the seed lands in matching habitat.
      const set = [];
      for (let i = 0; i < biome.plantTypes.length; i++) {
        const t = biome.plantTypes[i], d = TYPES[t];
        if (!d || d.disturbanceRecruit) continue;   // kahikatea recruits only on a river disturbance, not the FOREST button
        const ct = d.coldTolerance ?? 0.5;
        if (warm ? (ct <= G.warmMax) : (ct >= G.coldMin)) set.push(t);
      }
      if (!set.length) continue;
      // Density gate: don't carpet an already-dense stand (mirrors disperseSeed).
      let live = 0;
      const near = this.getNearbyPlants(px, py, 26);
      for (let i = 0; i < near.length; i++) { if (near[i].alive && ++live >= 3) break; }
      if (live >= 3) continue;
      const type = set[(random() * set.length) | 0];
      const p = new Plant(px, py, type, terrain, biome.key);
      p.growth = 0.08;               // a fresh seedling — grows in visibly
      this.plants.push(p);
      seeded++;
    }
    return seeded;
  }

  // ============================================================
  // DISTURBANCE / WARP CLOCK (PLAN_V3 §9). A storm or eruption stamps a local `disturb()` — a warp
  // bump that DECAYS ON REAL TIME, so the aftermath (plants regrowing into the cleared/buried/
  // fertilised ground) plays out as a visible ~2 s beat REGARDLESS of how fast the deep-time clock
  // runs. Implemented as a small list of active disturbances (usually 0–3), not a per-cell
  // Float32Array: same `warpAt(x,y)` query, but allocation-free and deterministic — no field to
  // tear across the sliced terrain morph. Read by Plant.handleGrowth via updatePlantsBatched.
  // ============================================================
  disturb(x, y, radius, kind = 'gale', strength = 1) {
    const D = this._disturbances || (this._disturbances = []);
    if (D.length >= 64) D.shift();                  // bound the list (spam-safe)
    D.push({ x, y, r2: radius * radius, kind, strength, life: 1 });
    this._disturbActive = true;
  }

  // Warp multiplier at (x,y): 0 undisturbed → up to `strength` at a fresh disturbance, fading to 0
  // as it decays. Max over the covering disturbances. O(active disturbances), usually 0–3.
  warpAt(x, y) {
    const D = this._disturbances;
    if (!D) return 0;
    let w = 0;
    for (let i = 0; i < D.length; i++) {
      const d = D[i];
      const dx = x - d.x, dy = y - d.y;
      if (dx * dx + dy * dy < d.r2) { const v = d.strength * d.life; if (v > w) w = v; }
    }
    return w;
  }

  // Decay every active disturbance on the REAL frame clock (rdt) so the aftermath beat is a fixed
  // wall-time length even under 10× deep-time fast-forward. Compacts expired entries in place.
  updateDisturbance(rdt) {
    const D = this._disturbances;
    if (!D || !D.length) { this._disturbActive = false; return; }
    const M = (typeof LEVEL_MECHANICS !== 'undefined') ? LEVEL_MECHANICS : null;
    const frames = (M && M.warpFrames) || 130;      // ~2.2 s at 60 fps
    const dec = rdt / frames;
    let w = 0;
    for (let i = 0; i < D.length; i++) {
      D[i].life -= dec;
      if (D[i].life > 0) D[w++] = D[i];
    }
    D.length = w;
    this._disturbActive = w > 0;
  }

  // WETLAND BLOOM (PLAN_V3 §8, finding #4 — "ash makes the swamps bloom"). After an eruption the
  // tephra fertilises the wetland: seed a burst of swamp seedlings into wetland ground and warp
  // their neighbourhood so they grow in over the aftermath beat — the swamps visibly SURGE as the
  // ash clears, rather than everything simply dying (the truer, more watchable read). Cap- and
  // water-guarded, same as the other spawn paths. Returns how many established.
  bloomWetland(count = 14) {
    const terrain = this.terrain;
    if (!terrain || typeof terrain.getBiomeAt !== 'function') return 0;
    const M = (typeof LEVEL_MECHANICS !== 'undefined') ? LEVEL_MECHANICS : null;
    const cap = (M && M.maxLivePlants) || 900;
    const R = (M && M.warpBloomRadius) || 60;
    // Anchor the bloom on the STANDING wetland — gather the live swamp plants (the eruption spares
    // most of them, see Game.applyAsh); seeding NEAR them reliably lands in the thin corridor, and
    // warping the survivors makes them surge in too, so the swamps visibly fill in after the ash.
    const anchors = [];
    for (let i = 0; i < this.plants.length; i++) {
      const p = this.plants[i];
      if (p.alive && p.biomeKey === 'wetland') anchors.push(p);
    }
    if (!anchors.length) return 0;
    let seeded = 0;
    for (let tries = 0; tries < count * 6 && seeded < count; tries++) {
      if (this.plants.length >= cap) break;
      const a = anchors[(random() * anchors.length) | 0];
      const ang = random(TWO_PI), r = random(44);
      const px = a.pos.x + Math.cos(ang) * r, py = a.pos.y + Math.sin(ang) * r;
      const biome = terrain.getBiomeAt(px, py);
      if (!biome || biome.key !== 'wetland' || !biome.plantTypes) continue;
      if (!this._plantSiteIsLand(px, py)) continue;
      const type = biome.plantTypes[(random() * biome.plantTypes.length) | 0];
      const p = new Plant(px, py, type, terrain, biome.key);
      p.growth = 0.06;
      this.plants.push(p);
      this.disturb(px, py, R, 'bloom', 1);          // warp so the new growth surges in fast
      seeded++;
    }
    // Surge the survivors too — a spread of large warp stamps over the standing swamp (a sample,
    // not one per plant, so the active-disturbance list stays small).
    const step = Math.max(1, (anchors.length / 12) | 0);
    for (let i = 0; i < anchors.length; i += step) this.disturb(anchors[i].pos.x, anchors[i].pos.y, R, 'bloom', 1);
    return seeded;
  }

  // KAHIKATEA RECRUITMENT (wetland doc §4.1). Kahikatea colonises raw river alluvium, so it recruits
  // ONLY on a disturbance — a storm flood, an eruption's sediment pulse, or the deep-time channel
  // shift — never through the free kererū/FOREST-button paths (gated by `disturbanceRecruit`). Seeds
  // young kahikatea on the wetland ground near the standing swamp and warps them in.
  recruitKahikatea(count = 6) {
    const terrain = this.terrain;
    if (!terrain || typeof terrain.getBiomeAt !== 'function') return 0;
    const M = (typeof LEVEL_MECHANICS !== 'undefined') ? LEVEL_MECHANICS : null;
    const cap = (M && M.maxLivePlants) || 900;
    const R = (M && M.warpBloomRadius) || 60;
    const anchors = [];
    for (let i = 0; i < this.plants.length; i++) {
      const p = this.plants[i];
      if (p.alive && p.biomeKey === 'wetland') anchors.push(p);
    }
    if (!anchors.length) return 0;
    let seeded = 0;
    for (let tries = 0; tries < count * 8 && seeded < count; tries++) {
      if (this.plants.length >= cap) break;
      const a = anchors[(random() * anchors.length) | 0];
      const ang = random(TWO_PI), r = random(52);
      const px = a.pos.x + Math.cos(ang) * r, py = a.pos.y + Math.sin(ang) * r;
      const biome = terrain.getBiomeAt(px, py);
      if (!biome || biome.key !== 'wetland' || !biome.plantTypes) continue;
      if (!this._plantSiteIsLand(px, py)) continue;
      const p = new Plant(px, py, 'kahikatea', terrain, biome.key);
      p.growth = 0.06; p._kahiAge = 0;
      this.plants.push(p);
      this.disturb(px, py, R, 'flood', 1);
      seeded++;
    }
    return seeded;
  }

  // The river MOVED (once per morph re-bake, called from cullSubmergedPlants): a small kahikatea pulse
  // — the ambient equivalent of the storm flood — keeps the swamp forest at a modest baseline as the
  // channel shifts, so a storm/eruption reads as a SURGE above it rather than the only thing keeping
  // kahikatea alive. Gated by a target so it stays a trickle.
  _recruitKahikateaOnMorph() {
    const M = (typeof LEVEL_MECHANICS !== 'undefined') ? LEVEL_MECHANICS : null;
    const target = (M && M.kahiRecruitTarget) || 30;
    let n = 0;
    for (let i = 0; i < this.plants.length; i++) { const p = this.plants[i]; if (p.alive && p._kahikatea) n++; }
    if (n >= target) return 0;
    return this.recruitKahikatea((M && M.kahiRecruitMorph) || 4);
  }

  spawnMoas(count, speciesKey = null) {
    const pref = this.seasonManager.getPreferredElevation();
    
    for (let i = 0; i < count; i++) {
      const pos = this.findWalkablePosition(pref.min, pref.max);
      const moa = this._createFromRegistry('moa', speciesKey, pos.x, pos.y, Moa);
      if (moa) this.moas.push(moa);
    }
  }

  spawnEagles(count) {
    for (let i = 0; i < count; i++) {
      this.spawnEagle();
    }
    
    // Give non-first eagles a rest period
    for (let i = 1; i < this.eagles.length; i++) {
      const eagle = this.eagles[i];
      eagle.hunger = 0;
      eagle.hunting = false;
      eagle.state = 'patrolling';
      eagle.restTimer = eagle.restDuration || 200;
    }
  }

  spawnEagle(speciesKey = null) {
    let pos = this.findWalkablePosition(0.25, 0.7, true);   // flyer → spawn on-screen
    const eagles = this.eagles;
    const minDistSq = 6400;

    for (let attempts = 0; attempts < 20; attempts++) {
      let tooClose = false;
      for (let i = 0, len = eagles.length; i < len; i++) {
        const dx = pos.x - eagles[i].pos.x;
        const dy = pos.y - eagles[i].pos.y;
        if (dx * dx + dy * dy < minDistSq) { tooClose = true; break; }
      }
      if (!tooClose) break;
      pos = this.findWalkablePosition(0.25, 0.7, true);
    }
    
    // Pick from active eagle species if no specific key given
    if (!speciesKey && this.activeSpecies.eagle.length > 0) {
      const eagleSpecies = this.activeSpecies.eagle;
      speciesKey = eagleSpecies[Math.floor(Math.random() * eagleSpecies.length)];
    }
    
    const eagle = this._createFromRegistry('eagle', speciesKey, pos.x, pos.y, EylesHarrier);
    if (eagle) {
      if (eagle.emergent) this._assignEagleNest(eagle, pos.x, pos.y);
      this.eagles.push(eagle);
    }
  }

  // Choose a fixed nest site for an emergent eagle: the highest, rockiest walkable
  // spot in a small neighbourhood (a crag eyrie) near the given point. Falls back
  // to the point itself. Also seeds patrolCenter so the bird orbits its nest.
  _assignEagleNest(eagle, x, y) {
    // Home near prey rather than on the barren high crags, so winter glaciation
    // doesn't strand eagles in the empty alps with nothing to hunt. Falls back to
    // the spawn point when no moa are nearby.
    let cx = x, cy = y;
    const prey = this.getClosestMoa(x, y, 600);
    if (prey) {
      const near = this.findWalkablePositionNear(prey.pos.x, prey.pos.y, 70);
      if (near) { cx = near.x; cy = near.y; }   // null after 30 failed attempts — keep the spawn point
    }
    eagle.nest.set(cx, cy);
    eagle.patrolCenter.set(cx, cy);
  }

  // Highest, rockiest walkable spot near (x,y): a crag/cliff-edge eyrie. Samples
  // several walkable candidates and keeps the one with the greatest elevation, so
  // the site sits at the alpine edge without stranding an egg on impassable ice.
  _findCragEyrie(x, y, radius = 240) {
    let bx = x, by = y, bestE = this.terrain.getElevationAt(x, y);
    for (let i = 0; i < 12; i++) {
      const p = this.findWalkablePositionNear(x, y, radius);
      if (!p) continue;                         // no walkable spot found; keep the best so far
      const e = this.terrain.getElevationAt(p.x, p.y);
      if (e > bestE) { bestE = e; bx = p.x; by = p.y; }
    }
    return { x: bx, y: by };
  }

  // Seed the founding eagle pair: one egg of the opposite sex to the spawned
  // founder, at a crag eyrie near it, hatching after ~30s.
  _spawnFounderEagleEgg() {
    const founder = this.eagles.find(e => e.alive);
    if (!founder) return;
    const site = this._findCragEyrie(founder.nest.x, founder.nest.y);
    const egg = this.addEgg(site.x, site.y);
    egg.offspringType = 'eagle';
    egg.parentSpecies = founder.speciesKey || null;
    egg.forcedSex = !founder.isFemale;            // opposite sex to the founder
    const M = (typeof LEVEL_MECHANICS !== 'undefined' && LEVEL_MECHANICS) ? LEVEL_MECHANICS : {};
    egg.incubationTime = M.startingEagleEggHatchTime ?? 1800;   // ~30s at 60fps
  }

  countAliveEagles() {
    const eagles = this.eagles;
    let n = 0;
    for (let i = 0, len = eagles.length; i < len; i++) {
      if (eagles[i].alive) n++;
    }
    return n;
  }

  // Called by an emergent eagle when it starves. Keeps bookkeeping and player
  // feedback in one place; the dead bird is compacted out in cleanup().
  onEagleDeath(eagle) {
    if (this.stats && this.stats.eagleDeaths !== undefined) this.stats.eagleDeaths++;
    this._invalidateCache();
    if (this.game) {
      this.game.addNotification('A kērangi starves as prey grows scarce.', 'info');
    }
  }

  // Hatch an eagle egg into a juvenile eagle at the nest (emergent reproduction).
  _hatchEagleEgg(egg) {
    const M = (typeof LEVEL_MECHANICS !== 'undefined' && LEVEL_MECHANICS) ? LEVEL_MECHANICS : {};
    const cap = M.eagleMaxPopulation ?? 12;
    if (this.countAliveEagles() >= cap) return;

    const eaglet = this._createFromRegistry('eagle', egg.parentSpecies, egg.pos.x, egg.pos.y, EylesHarrier);
    if (!eaglet) return;

    eaglet.emergent = true;
    eaglet.age = 0;
    eaglet.mature = false;
    eaglet.hunger = 30;
    eaglet.wingspan *= 0.6;              // juveniles are smaller until they mature
    eaglet.bodyLength = eaglet.wingspan * 0.45;

    // Sex: honour a forced sex (founding pair), else take the minority sex among
    // living eagles so the population keeps both sexes and stays able to breed.
    if (egg.forcedSex === true || egg.forcedSex === false) {
      eaglet.isFemale = egg.forcedSex;
    } else {
      let _f = 0, _m = 0;
      for (let i = 0; i < this.eagles.length; i++) {
        const e = this.eagles[i];
        if (e.alive) { e.isFemale ? _f++ : _m++; }
      }
      eaglet.isFemale = (_f < _m) ? true : (_m < _f ? false : random() < 0.5);
    }

    this._assignEagleNest(eaglet, egg.pos.x, egg.pos.y);
    this.eagles.push(eaglet);

    if (this.stats && this.stats.eagleBirths !== undefined) this.stats.eagleBirths++;
    if (this.game) this.game.addNotification('A kērangi chick hatches.', 'success');
  }

  // Hatch a flyer egg (kererū / kōkako / huia) into a juvenile in that species'
  // flock — emergent frugivore reproduction, mirrors _hatchEagleEgg. Cap-guarded
  // by the species' own maxPopulation (falling back to the kererū knob).
  _hatchFlyerEgg(egg, type) {
    if (this.getSpeciesCount(type) >= this._flyerCap(type)) return;

    const chick = this._createFromRegistry(type, type, egg.pos.x, egg.pos.y, null);
    if (!chick) return;

    chick.age = 0;
    chick.mature = false;
    chick.hunger = 30;
    chick.crop = 0;

    const list = this.otherEntities[type] || (this.otherEntities[type] = []);
    // Minority-sex balance: take the rarer sex among the living flock so a small
    // population keeps both sexes and stays able to pair (like the moa/eagle path).
    let f = 0, m = 0;
    for (let i = 0; i < list.length; i++) { const o = list[i]; if (o.alive) { o.isFemale ? f++ : m++; } }
    chick.isFemale = (f < m) ? true : (m < f ? false : random() < 0.5);

    list.push(chick);
    const label = (chick && chick._label) || type;
    if (this.game) this.game.addNotification(`A ${label} chick hatches.`, 'success');
  }

  // Flock cap for a flyer type: the registered species config first (kōkako, huia
  // carry their own maxPopulation), else the kererū LEVEL_MECHANICS knob.
  _flyerCap(type) {
    const sp = (typeof REGISTRY !== 'undefined') ? REGISTRY.getSpecies(type) : null;
    if (sp && sp.config && sp.config.maxPopulation != null) return sp.config.maxPopulation;
    return (typeof LEVEL_MECHANICS !== 'undefined' && LEVEL_MECHANICS.kereruMaxPopulation) ?? 16;
  }

  // clampView: keep the picked X inside the VISIBLE screen band. The cover-fit view runs the map
  // wider than the canvas (CONFIG.viewInsetX px off-frame each side), so a FLYER spawned in that
  // off-screen L/R overflow reads as "missing" — and its bolt-hole (Kereru._lastLand) can trap it
  // there. Flyers pass true; ground animals leave it false and use the full map width.
  findWalkablePosition(minElev, maxElev, clampView = false) {
    const terrain = this.terrain;
    const padding = this.spawnPadding;
    const ins = (clampView && typeof CONFIG !== 'undefined' && CONFIG.viewInsetX) ? CONFIG.viewInsetX : 0;
    const minX = padding + ins;
    const maxX = this.worldWidth - padding - ins;
    const maxY = this.worldHeight - padding;

    for (let attempts = 0; attempts < 100; attempts++) {
      const x = minX + random() * Math.max(1, maxX - minX);
      const y = padding + random() * (maxY - padding);
      const elev = terrain.getElevationAt(x, y);

      if (elev > minElev && elev < maxElev && terrain.isWalkable(x, y)) {
        this._tempPos.set(x, y);
        return this._tempPos;
      }
    }

    this._tempPos.set(this.worldWidth * 0.5, this.worldHeight * 0.5);   // centre — always on-screen
    return this._tempPos;
  }
  
  findWalkablePositionNear(x, y, radius) {
    for (let attempts = 0; attempts < 30; attempts++) {
      const angle = random(TWO_PI);
      const dist = random(radius * 0.3, radius);
      const px = x + cos(angle) * dist;
      const py = y + sin(angle) * dist;
      
      if (px < 0 || px >= this.worldWidth || py < 0 || py >= this.worldHeight) continue;
      
      if (this.terrain.isWalkable(px, py)) {
        this._tempPos.set(px, py);
        return this._tempPos;
      }
    }
    return null;
  }

  // A harrier takes a prey animal — either a grazer (moa/goose/mōho) or a forest
  // flyer (kererū/kōkako/huia). Prey-generic: the death fade arms automatically
  // when `.alive` flips, and cleanup drops the body once faded.
  handleEagleCatch(eagle, prey) {
    // Floor-protected species can't be taken — the strike fails and the bird
    // breaks off. (Belt-and-braces: the hunt scan already skips protected prey.)
    if (this.isPreyProtected(prey)) {
      eagle.hunting = false;
      eagle.target = null;
      eagle.huntSearchTimer = 0;
      return;
    }
    prey.alive = false;
    if (audioManager) audioManager.playEagleCatch();

    eagle.kills++;
    eagle.hunger = Math.max(0, eagle.hunger - 90);
    eagle.vel.mult(0.1);
    eagle.hunting = false;
    eagle.target = null;
    eagle.huntSearchTimer = 0;
    eagle.state = 'resting';
    eagle.restTimer = eagle.restDuration;
    // Emergent birds keep their fixed nest and drift home to digest; the classic
    // controller-driven eagles recentre on the kill so they follow the prey.
    if (!eagle.emergent) {
      eagle.patrolCenter.set(eagle.pos.x, eagle.pos.y);
    } else {
      eagle.patrolCenter.set(eagle.nest.x, eagle.nest.y);
    }

    // Track per-species death (only grazer species carry a deathsBySpecies slot).
    const speciesKey = prey.speciesKey || 'unknown';
    if (this.stats.deathsBySpecies[speciesKey] !== undefined) {
      this.stats.deathsBySpecies[speciesKey]++;
    }

    this.stats.deaths++;
    this._invalidateCache();

    // Instrumentation only — the visitor wall hides the message strip.
    if (this.game) {
      const label = prey._label || (prey.speciesConfig && prey.speciesConfig.displayName) || 'bird';
      this.game.addNotification(`A harrier takes a ${label}.`, 'info');
    }
  }
  // ============================================
  // ENTITY CREATION
  // ============================================
  
  addEgg(x, y, parentSpecies = null) {
    const egg = new Egg(x, y, this.terrain, this.config, parentSpecies);
    this.eggs.push(egg);
    return egg;
  }
  
  addPlaceable(x, y, type) {
    const placeable = new PlaceableObject(x, y, type, this.terrain, this, this.seasonManager);
    this.placeables.push(placeable);
    if (type === 'nest') this._nestCacheValid = false;
    return placeable;
  }
  
  // ============================================
  // POPULATION COUNTING (Cached)
  // ============================================
  
  _ensurePopulationCache() {
    if (this._cacheFrame === frameCount) return;
    
    let moaCount = 0, eggCount = 0;
    const sc = this._speciesCountCache || (this._speciesCountCache = {});
    for (const key in sc) sc[key] = 0;   // reset counts (keep the object)
    const moas = this.moas;
    for (let i = 0, len = moas.length; i < len; i++) {
      const m = moas[i];
      if (m.alive) {
        moaCount++;
        const k = m.speciesKey;
        if (k) sc[k] = (sc[k] || 0) + 1;
      }
    }
    // Fold flyer / other species into the SAME per-frame count cache, so
    // getCachedSpeciesCount serves kererū/kōkako/huia too (surplus-aware predation
    // and the per-species breeding gate both read it). A moa key and an
    // otherEntities type never collide, so this can't double-count.
    for (const type in this.otherEntities) {
      const list = this.otherEntities[type];
      let c = 0;
      for (let i = 0, l = list.length; i < l; i++) if (list[i].alive) c++;
      sc[type] = (sc[type] || 0) + c;
    }

    const eggs = this.eggs;
    for (let i = 0, len = eggs.length; i < len; i++) {
      if (eggs[i].alive && !eggs[i].hatched) eggCount++;
    }

    this._cachedAliveMoas = moaCount;
    this._cachedAliveEggs = eggCount;
    this._cacheFrame = frameCount;
  }

  // Per-species alive moa count, cached once per frame (cheap for hot paths like
  // eagle prey selection). Accurate to the last cache rebuild.
  getCachedSpeciesCount(speciesKey) {
    this._ensurePopulationCache();
    return (this._speciesCountCache && this._speciesCountCache[speciesKey]) || 0;
  }

  isSpeciesProtected(speciesKey) {
    const M = (typeof LEVEL_MECHANICS !== 'undefined') ? LEVEL_MECHANICS : null;
    if (!M) return false;
    const explicit = M.populationFloors;
    if (explicit && explicit[speciesKey] !== undefined) {
      return this.getCachedSpeciesCount(speciesKey) <= explicit[speciesKey];
    }
    if (M.moaPopulationFloor != null && this.activeSpecies.moa.indexOf(speciesKey) !== -1) {
      return this.getCachedSpeciesCount(speciesKey) <= M.moaPopulationFloor;
    }
    return false;
  }

  // ============================================
  // PER-SPECIES CARRYING TARGET / FLOOR
  // ----------------------------------------------
  // The comfortable population for a species (target) and the protected minimum
  // (floor). Drive the surplus-aware harrier (crop the abundant, spare the rare)
  // and the grazer breeding gate (breed up to target, then trickle). Both are
  // static, so resolve once and cache.
  // ============================================

  _speciesTarget(key) {
    const cache = this._targetCache || (this._targetCache = {});
    if (cache[key] !== undefined) return cache[key];
    const M = (typeof LEVEL_MECHANICS !== 'undefined') ? LEVEL_MECHANICS : null;
    let t = null;
    const st = M && M.speciesTargets && M.speciesTargets[key];
    if (st && st.target != null) t = st.target;
    if (t == null && typeof REGISTRY !== 'undefined') {
      const sp = REGISTRY.getSpecies(key);
      const cap = sp && sp.config && sp.config.maxPopulation;
      if (cap != null) t = Math.max(2, Math.round(cap * ((M && M.flyerTargetFrac) ?? 0.65)));
    }
    if (t == null) t = (M && M.defaultSpeciesTarget) ?? 6;
    return (cache[key] = t);
  }

  _speciesFloor(key) {
    const cache = this._floorCache || (this._floorCache = {});
    if (cache[key] !== undefined) return cache[key];
    const M = (typeof LEVEL_MECHANICS !== 'undefined') ? LEVEL_MECHANICS : null;
    let f = null;
    const st = M && M.speciesTargets && M.speciesTargets[key];
    if (st && st.floor != null) f = st.floor;
    if (f == null && M && M.populationFloors && M.populationFloors[key] != null) f = M.populationFloors[key];
    if (f == null && typeof REGISTRY !== 'undefined') {
      const sp = REGISTRY.getSpecies(key);
      if (sp && sp.config && sp.config.populationFloor != null) f = sp.config.populationFloor;
    }
    if (f == null && M && M.moaPopulationFloor != null && this.activeSpecies.moa.indexOf(key) !== -1) f = M.moaPopulationFloor;
    if (f == null) f = 2;
    return (cache[key] = f);
  }

  // Population above (positive) or below (negative) the comfortable target.
  getSpeciesSurplus(key) { return this.getCachedSpeciesCount(key) - this._speciesTarget(key); }

  // A prey animal is untouchable while its species sits at/below its floor — the
  // hard guarantee that predation can never take the last few of a kind. Works for
  // both grazers and flyers (the count cache covers both).
  isPreyProtected(prey) {
    const key = prey.speciesKey;
    return this.getCachedSpeciesCount(key) <= this._speciesFloor(key);
  }

  // Alive prey (grazers + forest flyers) within radius, into a REUSED scratch
  // array — the surplus-aware harrier hunts moa AND kererū/kōkako/huia. No
  // allocation on the hot path; safe because each eagle drains the array within
  // its own hunt() before the next eagle queries.
  getHuntablePrey(x, y, radius) {
    const out = this._preyScratch || (this._preyScratch = []);
    out.length = 0;
    const moas = this.moaGrid.getInRadius(x, y, radius);
    for (let i = 0; i < moas.length; i++) out.push(moas[i]);
    for (const type in this._dynamicGrids) {
      const list = this.otherEntities[type];
      if (!list || !list.length || !list[0].isFlyer) continue;   // flyers only
      const near = this._dynamicGrids[type].getInRadius(x, y, radius);
      for (let i = 0; i < near.length; i++) out.push(near[i]);
    }
    return out;
  }

  // Convenience getters for level 2 goal conditions
  get wekaStableTime() {
    return this._speciesStableTimes['weka'] || 0;
  }

  get keaStableTime() {
    return this._speciesStableTimes['kea'] || 0;
  }

  getSpeciesCount(speciesKey) {
    let count = 0;
    // Check moas
    for (let i = 0; i < this.moas.length; i++) {
      if (this.moas[i].alive && this.moas[i].speciesKey === speciesKey) count++;
    }
    // Check other entities
    if (this.otherEntities[speciesKey]) {
      for (let i = 0; i < this.otherEntities[speciesKey].length; i++) {
        if (this.otherEntities[speciesKey][i].alive) count++;
      }
    }
    return count;
  }
  
  getMoaPopulation() {
    this._ensurePopulationCache();
    return this._cachedAliveMoas;
  }
  
  getAliveEggsCount() {
    this._ensurePopulationCache();
    return this._cachedAliveEggs;
  }
  
  _invalidateCache() {
    this._cacheFrame = -1;
    this._summaryFrame = -1;
  }

  // ============================================
  // SPATIAL GRID UPDATES 
  // ============================================
  
  updateSpatialGrids() {
    // Existing grid updates
    for (const pair of this._gridEntityPairs) {
      pair.grid.clear();
      const list = pair.list;
      for (let i = 0, len = list.length; i < len; i++) {
        const entity = list[i];
        // Every entity now carries `.alive` (emergent eagles included), so a
        // starved eagle awaiting cleanup is never inserted as a phantom threat.
        if (entity.alive) {
          pair.grid.insert(entity);
        }
      }
    }
    
    // Dynamic grids for other entity types
    for (const [type, list] of Object.entries(this.otherEntities)) {
      if (!this._dynamicGrids[type]) {
        this._dynamicGrids[type] = new SpatialGrid(
          this.worldWidth, this.worldHeight, 60
        );
      }
      const grid = this._dynamicGrids[type];
      grid.clear();
      for (let i = 0; i < list.length; i++) {
        if (list[i].alive) grid.insert(list[i]);
      }
    }
  }
  
  // ============================================
  // SPATIAL QUERY METHODS
  // ============================================
  
  getNearbyMoas(x, y, radius) { return this.moaGrid.getInRadius(x, y, radius); }
  getNearbyEagles(x, y, radius) { return this.eagleGrid.getInRadius(x, y, radius); }
  getNearbyPlants(x, y, radius) { return this.plantGrid.getInRadius(x, y, radius); }
  getNearbyPlaceables(x, y, radius) { return this.placeableGrid.getInRadius(x, y, radius); }
  getNearbyEggs(x, y, radius) { return this.eggGrid.getInRadius(x, y, radius); }
  getClosestPlant(x, y, radius, filter = null) { return this.plantGrid.getClosest(x, y, radius, filter); }
  getClosestMoa(x, y, radius, filter = null) { return this.moaGrid.getClosest(x, y, radius, filter); }
  // Query method for any entity type
  getNearbyOfType(type, x, y, radius) {
    const grid = this._dynamicGrids[type];
    if (!grid) return [];
    return grid.getInRadius(x, y, radius);
  }
  // ============================================
  // NEST CACHE
  // ============================================
  
  _updateNestCache() {
    this._nestCache.length = 0;
    const placeables = this.placeables;
    for (let i = 0, len = placeables.length; i < len; i++) {
      const p = placeables[i];
      if (p.alive && p.type === 'nest') this._nestCache.push(p);
    }
    this._nestCacheValid = true;
  }
  
  // ============================================
  // BOUNDS CHECKING
  // ============================================
  
  isInBounds(x, y, padding = 0) {
    return x >= padding && x < this.worldWidth - padding && 
           y >= padding && y < this.worldHeight - padding;
  }
  
  constrainToBounds(pos, padding = 5) {
    pos.x = constrain(pos.x, padding, this.worldWidth - padding);
    pos.y = constrain(pos.y, padding, this.worldHeight - padding);
    return pos;
  }
  
  // ============================================
  // MAIN UPDATE LOOP
  // ============================================
  
  // Two clocks. `dt` is the sim/life clock (deep-time-warped: aging, hunger,
  // breeding, growth, spawn cadence). `rdt` is the real frame clock, threaded to
  // fauna MOTION and ANIMATION so a moa walks and a harrier beats its wings at
  // wall-clock rate even in 10x fast-forward. Defaults to `dt`, so any single-arg
  // caller keeps the old fully-warped behaviour.
  update(dt = 1, rdt = dt) {
    this.updateSpatialGrids();
    this.updateDisturbance(rdt);        // decay the warp clock on REAL time, before the plants read it
    this.updatePlantsBatched(dt);
    
    if (this.seasonManager.justChanged) this.onSeasonChange();
    
    this._placeableTimer += dt;
    if (this._placeableTimer >= 2) {
      this._placeableTimer -= 2;
      this.updatePlaceables(dt);
    }
    
    this.updateEggs(dt);
    
    const aliveBeforeUpdate = this.getMoaPopulation();
    this.updateMoas(dt, rdt);
    
    this._invalidateCache();
    const aliveAfterUpdate = this.getMoaPopulation();
    const newDeaths = aliveBeforeUpdate - aliveAfterUpdate;
    if (newDeaths > 0) {
      this.stats.starvations += newDeaths;
      this.stats.deaths += newDeaths;
    }
    
    this.updateEagles(dt, rdt);

    // Update other entity types
    this._updateOtherEntities(dt, rdt);
    
    this._updateSpeciesStability(dt);
    this._updateRefounding(dt);

    // Predator-prey coupling: eagle numbers track the moa population, thinning
    // in the cold seasons and rebuilding in the warm ones. This is the top-down
    // controller — skipped entirely when emergentEagles is on, because then the
    // population arises from individual births (nests) and deaths (starvation).
    if (typeof LEVEL_MECHANICS !== 'undefined' && LEVEL_MECHANICS.eaglePreyCoupling
        && !LEVEL_MECHANICS.emergentEagles) {
      this._eagleRegTimer += dt;
      const interval = LEVEL_MECHANICS.eagleAdjustInterval ?? 240;
      if (this._eagleRegTimer >= interval) {
        this._eagleRegTimer -= interval;
        this.regulateEagles();
      }
    }

    this._cleanupTimer += dt;
    if (this._cleanupTimer >= 512) {
      this._cleanupTimer -= 512;
      this.cleanup();
    }
  }

  _updateOtherEntities(dt, rdt = dt) {
    for (const [type, list] of Object.entries(this.otherEntities)) {
      for (let i = 0; i < list.length; i++) {
        const entity = list[i];
        if (!entity.alive) continue;

        // Each entity type must implement behave() and update()
        // just like moa and eagle do
        if (entity.behave) entity.behave(this, this.seasonManager, dt);   // life (warped)
        if (entity.update) entity.update(rdt);                            // motion/anim (real)
        this.constrainToBounds(entity.pos);
      }
    }
  }

  // ============================================
  // AUTO-REFOUND — the rare last-resort safety net (opt-in: LEVEL_MECHANICS.autoRefound)
  // ----------------------------------------------
  // A tracked species that has sat at/below its floor AND cannot self-recover
  // (down to one bird, or every survivor the same sex) for a sustained spell gets
  // ONE fresh adult of the missing sex, dropped near an existing bird so a breeding
  // pair can re-form. This is a backstop, not the mechanism: it is instrumented
  // (stats.refounds + a debug log) precisely so we can tell if species survival is
  // leaning on it — if it fires often, the base dynamics are too harsh and the
  // model should move to rate-based regulation.
  // ============================================
  _updateRefounding(dt) {
    const M = (typeof LEVEL_MECHANICS !== 'undefined') ? LEVEL_MECHANICS : null;
    if (!M || !M.autoRefound) return;
    const interval = M.refoundCheckInterval ?? 300;
    this._refoundTimer = (this._refoundTimer || 0) + dt;
    if (this._refoundTimer < interval) return;
    this._refoundTimer -= interval;

    const timers = this._refoundStuck || (this._refoundStuck = {});
    const delay = M.refoundDelay ?? 2400;

    for (const key of (this.activeSpecies.moa || [])) this._refoundCheckSpecies(key, false, timers, delay, interval);
    for (const type in this.otherEntities) {
      const list = this.otherEntities[type];
      if (list.length && list[0].isFlyer) this._refoundCheckSpecies(type, true, timers, delay, interval);
    }
  }

  _refoundCheckSpecies(key, isFlyer, timers, delay, incr) {
    let count = 0, males = 0, females = 0, sample = null;
    if (isFlyer) {
      const list = this.otherEntities[key] || [];
      for (let i = 0; i < list.length; i++) { const o = list[i]; if (o.alive) { count++; sample = o; o.isFemale ? females++ : males++; } }
    } else {
      const moas = this.moas;
      for (let i = 0; i < moas.length; i++) { const m = moas[i]; if (m.alive && m.speciesKey === key) { count++; sample = m; m.isFemale ? females++ : males++; } }
    }
    const floor = this._speciesFloor(key);
    // Stuck = it can't produce a pair: a lone bird, or all survivors one sex while
    // pinned at/below the floor. A healthy-but-small species is NOT stuck.
    const stuck = count <= 1 || (count <= floor && (males === 0 || females === 0));
    if (!stuck) { timers[key] = 0; return; }
    timers[key] = (timers[key] || 0) + incr;
    if (timers[key] < delay) return;
    timers[key] = 0;
    // Two survivors of the same sex is a breeding DEADLOCK, not a survival crisis
    // (the floor already guarantees they live). Resolve it invisibly by flipping
    // one bird's sex — no animal conjured from nowhere, no population bump. Only a
    // genuine near-extinction (down to one bird, which the floor makes very rare)
    // actually adds a founder.
    if (count >= 2 && (males === 0 || females === 0)) this._sexRebalance(key, isFlyer, females === 0);
    else this._refound(key, isFlyer, sample, males, females);
  }

  // Flip one member of a same-sex floored species to the missing sex so the pair
  // can breed again. Invisible (sex is barely dimorphic in the art) and adds no
  // individual — the honest way to break the deadlock without magicking in a bird.
  _sexRebalance(key, isFlyer, makeFemale) {
    const list = isFlyer ? (this.otherEntities[key] || []) : this.moas;
    for (let i = 0; i < list.length; i++) {
      const o = list[i];
      if (!o.alive || (!isFlyer && o.speciesKey !== key)) continue;
      o.isFemale = makeFemale;
      if (isFlyer) o._mate = null;              // let it re-pair (huia)
      this.stats.sexRebalances = (this.stats.sexRebalances || 0) + 1;
      if (typeof CONFIG !== 'undefined' && CONFIG.debugMode) {
        console.log(`sex-rebalance: ${key} → one ${makeFemale ? 'female' : 'male'} (total ${this.stats.sexRebalances})`);
      }
      return;
    }
  }

  _refound(key, isFlyer, sample, males, females) {
    // Add the missing sex so a pair can form (coin-flip only if somehow both 0).
    const addFemale = (females === 0) ? true : (males === 0 ? false : random() < 0.5);
    let x, y;
    if (sample) {
      const p = this.findWalkablePositionNear(sample.pos.x, sample.pos.y, 60) || sample.pos;
      x = p.x; y = p.y;
    } else {
      const pref = this.seasonManager.getPreferredElevation();
      const p = this.findWalkablePosition(pref.min, pref.max, isFlyer);   // flyers refound on-screen
      x = p.x; y = p.y;
    }

    const entity = this._createFromRegistry(isFlyer ? key : 'moa', key, x, y, isFlyer ? null : Moa);
    if (!entity) return;
    entity.isFemale = addFemale;
    entity.mature = true;                      // a ready adult, so recovery is quick
    if (isFlyer) {
      entity.age = entity._maturityFrames || 1200;
      entity.hunger = 20;
      (this.otherEntities[key] || (this.otherEntities[key] = [])).push(entity);
    } else {
      entity.age = MOA_AGE.ADULT_MIN;
      if (entity.updateAge) entity.updateAge(0);  // size up to adult now (no one-frame juvenile pop)
      entity.hunger = 25;
      this.moas.push(entity);
    }

    this.stats.refounds = (this.stats.refounds || 0) + 1;
    this._invalidateCache();
    if (typeof CONFIG !== 'undefined' && CONFIG.debugMode) {
      console.log(`refound: ${key} (+1 ${addFemale ? 'F' : 'M'}) — total refounds ${this.stats.refounds}`);
    }
  }

  _updateSpeciesStability(dt) {
    // Only needed if the level tracks species stability
    if (Object.keys(this._speciesStableTimes).length === 0) return;
    
    // Count alive moa by species
    const speciesCounts = {};
    const moas = this.moas;
    for (let i = 0, len = moas.length; i < len; i++) {
      const m = moas[i];
      if (!m.alive) continue;
      const key = m.speciesKey || 'unknown';
      speciesCounts[key] = (speciesCounts[key] || 0) + 1;
    }
    
    // Count other entities
    for (const [type, list] of Object.entries(this.otherEntities)) {
      let count = 0;
      for (let i = 0; i < list.length; i++) {
        if (list[i].alive) count++;
      }
      speciesCounts[type] = count;
    }
    
    // Update stability timers
    let anyExtinct = false;
    for (const key of Object.keys(this._speciesStableTimes)) {
      const count = speciesCounts[key] || 0;
      const wasAlive = this._speciesLastAlive[key];
      
      if (count >= 2) {
        // Species is stable (2+ individuals)
        this._speciesStableTimes[key] += dt;
        this._speciesLastAlive[key] = true;
      } else if (count === 0) {
        // Species extinct
        this._speciesStableTimes[key] = 0;
        this._speciesLastAlive[key] = false;
        if (wasAlive) anyExtinct = true;
      } else {
        // Only 1 — not stable but not extinct
        this._speciesLastAlive[key] = true;
        // Don't increment stability timer
      }
    }
    
    this.stats.anySpeciesExtinct = anyExtinct || this.stats.anySpeciesExtinct;
  }

  updatePlantsBatched(dt = 1) {
    const plants = this.plants;
    const len = plants.length;
    if (len === 0) return;
    
    const batchSize = Math.ceil(this._plantBatchSize * Math.min(dt, 2));
    const endIdx = Math.min(this._plantBatchIndex + batchSize, len);
    
    const warpActive = this._disturbActive;
    // Lifecycle accelerator for kahikatea while a matched FOREST boost is held (set in
    // InstallHUD.update). 1 = normal; >1 hurries a kahikatea through its CURRENT process
    // (grow/age/senesce), rather than force-growing it. Ignored by every other plant type.
    const kahiBoost = (this.game && this.game._kahiBoost) || 1;
    for (let i = this._plantBatchIndex; i < endIdx; i++) {
      const p = plants[i];
      p.update(this.seasonManager, dt, warpActive ? this.warpAt(p.pos.x, p.pos.y) : 0, kahiBoost);
    }
    
    this._plantBatchIndex = endIdx >= len ? 0 : endIdx;
  }

  // Reconcile the plant field to the morphed land: DROP the plants the morph stranded (drowned or
  // pushed onto ice), and REFRESH the survivors' cached site so their climate/biome logic responds
  // to the new landscape. The deep-time land morph re-bakes the terrain WITHOUT rebuilding the
  // living world (only the eruption path does a full respawn), so as the southern strait floods a
  // cell, any plant standing on it was left stranded in the sea (the "tree in the water" bug).
  //
  // A plant also caches its `elevation`/`biomeKey` at SPAWN, so before this reconcile they went
  // stale as the land rose or the coast moved — a podocarp kept reading forest elevation while the
  // Ruahine uplifted into the subalpine band under it, and so "survived fine" where it should wilt.
  // Refreshing both here (once per re-bake) feeds the current ground to the forest-contraction,
  // dormancy and biome-modifier checks in Plant.update(), so the cover tracks the changing land.
  // Game calls this once each time a morph re-bake completes — cheap (≤1000 plants, a few lookups
  // each) and off the per-frame path. Compacts the list.
  //
  // Two water tests, because the visitor sees the PAINTED ground, not the sim grid:
  //   · waterTypeAt (paint resolution) is exactly what the season bake coloured as sea/river and
  //     what the overlay stamps decals on. It is the finer, authoritative "is this pixel water".
  //   · getBiomeAt (sim-grid resolution) is coarser; on its own it left plants standing on painted
  //     water at the margin cells where the two classifications disagree (hundreds of such cells
  //     every year — the stragglers that "persisted in the water" at the window end).
  // The biome test also catches non-water-but-unwalkable ground (a plant stranded on the ice cap),
  // which waterTypeAt does not, so keep both.
  cullSubmergedPlants() {
    const plants = this.plants, terrain = this.terrain;
    if (!plants.length || !terrain) return 0;
    const hasWaterType = typeof terrain.waterTypeAt === 'function';
    let writeIdx = 0, culled = 0;
    for (let i = 0, len = plants.length; i < len; i++) {
      const p = plants[i];
      if (!p.alive) { culled++; continue; }                 // also drop any already-dead
      // Painted-water test first: the pixel the visitor actually sees under the plant.
      if (hasWaterType && terrain.waterTypeAt(p.pos.x, p.pos.y) !== 0) {
        p.alive = false; culled++; continue;
      }
      const biome = terrain.getBiomeAt(p.pos.x, p.pos.y);
      if (biome && (biome.isWater || !biome.walkable)) {     // open water / ice — strand it no longer
        p.alive = false; culled++; continue;
      }
      // Survivor: refresh the cached site to the just-morphed ground so forest contraction,
      // dormancy and the biome modifier in Plant.update() key off where the plant NOW sits
      // (uplift into subalpine, a coast that moved, etc.) rather than its spawn-time reading.
      p.elevation = terrain.getElevationAt(p.pos.x, p.pos.y);
      if (biome) p.biomeKey = biome.key;
      plants[writeIdx++] = p;
    }
    if (writeIdx !== plants.length) plants.length = writeIdx;
    if (culled && CONFIG.debugMode) console.log(`cullSubmergedPlants: removed ${culled} plant(s) now in water`);
    // The channel just shifted (this runs once per morph re-bake) → a small kahikatea recruitment
    // pulse on the freshly-worked alluvium, so the swamp forest tracks the moving river ambiently.
    this._recruitKahikateaOnMorph();
    return culled;
  }

  updatePlaceables(dt = 1) {
    const placeables = this.placeables;
    let writeIdx = 0;
    let nestRemoved = false;
    
    for (let i = 0, len = placeables.length; i < len; i++) {
      const p = placeables[i];
      p.update(dt);
      if (p.alive) {
        placeables[writeIdx++] = p;
      } else if (p.type === 'nest') {
        nestRemoved = true;
      }
    }
    
    if (placeables.length !== writeIdx) {
      placeables.length = writeIdx;
      if (nestRemoved) this._nestCacheValid = false;
    }
  }

  updateEggs(dt = 1) {
    const eggs = this.eggs;
    if (eggs.length === 0) return;
    
    if (!this._nestCacheValid) this._updateNestCache();
    
    const nests = this._nestCache;
    const config = this.config;
    let writeIdx = 0;
    
    for (let i = 0, len = eggs.length; i < len; i++) {
      const egg = eggs[i];
      
      // Apply nest bonus
      for (let j = 0, nLen = nests.length; j < nLen; j++) {
        const nest = nests[j];
        if (nest.isInRange(egg.pos)) {
          const bonus = nest.def.eggSpeedBonus;
          if (bonus > egg.speedBonus) egg.speedBonus = bonus;
          break;
        }
      }
      
      egg.update(dt);
      
      if (egg.hatched && egg.alive) {
        if (egg.offspringType === 'eagle') {
          // Emergent eagle reproduction: hatch a juvenile kērangi, then consume
          // the egg (over-cap eggs are simply lost rather than lingering).
          this._hatchEagleEgg(egg);
          egg.alive = false;
        } else if (egg.offspringType === 'kereru' || egg.offspringType === 'kokako' || egg.offspringType === 'huia') {
          // Emergent flyer reproduction (kererū / kōkako / huia): hatch a juvenile
          // into that species' flock, then consume the egg (cap-guarded).
          this._hatchFlyerEgg(egg, egg.offspringType);
          egg.alive = false;
        } else if (this.getMoaPopulation() < config.maxMoaPopulation) {
          const offspringSpecies = egg.getOffspringSpecies();
          const _perSpeciesCap = (typeof LEVEL_MECHANICS !== 'undefined' && LEVEL_MECHANICS.maxPerSpecies) || Infinity;
          if (this.getSpeciesCount(offspringSpecies) >= _perSpeciesCap) {
            eggs[writeIdx++] = egg;   // species at its hard cap — hold this egg until there's room
            continue;
          }
          const newMoa = this._createFromRegistry('moa', offspringSpecies, egg.pos.x, egg.pos.y, Moa);

          if (newMoa) {
            // Sex-balance the hatchling: take the minority sex of its own living
            // species so small populations keep both sexes and stay able to pair
            // within themselves (only fall back to the constructor's coin flip
            // when the species is already balanced).
            let _sf = 0, _sm = 0;
            for (let mi = 0; mi < this.moas.length; mi++) {
              const _m = this.moas[mi];
              if (_m.alive && _m.speciesKey === newMoa.speciesKey) { _m.isFemale ? _sf++ : _sm++; }
            }
            if (_sf < _sm) newMoa.isFemale = true;
            else if (_sm < _sf) newMoa.isFemale = false;

            newMoa.hunger = 35;
            newMoa.size *= 0.6;
            newMoa._cacheSizeMultipliers();
            newMoa.homeRange.set(egg.pos.x, egg.pos.y);
            this.moas.push(newMoa);
            this.stats.births++;
            // Track per-species birth
            const offspringKey = newMoa.speciesKey || offspringSpecies || 'unknown';
            if (this.stats.birthsBySpecies[offspringKey] !== undefined) {
              this.stats.birthsBySpecies[offspringKey]++;
            }
            this._invalidateCache();
            // Diminishing hatch reward: based on the parent species' population
            
            const speciesName = newMoa.species?.displayName || 'moa';
            this.game.addNotification(`A ${speciesName} has hatched!`, 'success');
          }
          
          egg.alive = false;
        }
      }
      
      if (egg.alive) eggs[writeIdx++] = egg;
    }
    
    eggs.length = writeIdx;
  }

  updateMoas(dt = 1, rdt = dt) {
    const moas = this.moas;
    const seasonManager = this.seasonManager;

    for (let i = 0, len = moas.length; i < len; i++) {
      const moa = moas[i];
      if (moa.alive) {
        moa.behave(this, seasonManager, dt);   // life clock (warped)
        moa.update(rdt);                        // motion + animation (real)
        this.constrainToBounds(moa.pos);
      }
    }
  }

  updateEagles(dt = 1, rdt = dt) {
    const eagles = this.eagles;
    for (let i = 0, len = eagles.length; i < len; i++) {
      const eagle = eagles[i];
      if (!eagle.alive) continue;   // starved emergent birds await cleanup()
      eagle.behave(this, dt);       // life clock (warped)
      eagle.update(rdt);            // motion + animation (real)
      this.constrainToBounds(eagle.pos);
    }
  }
  
  cleanup() {
    // Keep condition holds a dead entity in its list until its death fade has
    // fully run out (_fade === 0). A just-dead bird has _fade === undefined (the
    // fade is armed on the next render), a fading one has _fade in (0,1); only a
    // fully-faded one (_fade === 0) is compacted out. `_kept(e)` centralises it.
    const moas = this.moas;
    let writeIdx = 0;
    for (let i = 0, len = moas.length; i < len; i++) {
      if (this._kept(moas[i])) moas[writeIdx++] = moas[i];
    }
    if (writeIdx !== moas.length) {
      moas.length = writeIdx;
      this._invalidateCache();
    }

    // Emergent eagles can starve — compact the list just like the moa list so
    // dead birds stop being drawn, queried, and counted.
    const eagles = this.eagles;
    let eWrite = 0;
    for (let i = 0, len = eagles.length; i < len; i++) {
      if (this._kept(eagles[i])) eagles[eWrite++] = eagles[i];
    }
    if (eWrite !== eagles.length) {
      eagles.length = eWrite;
      this._invalidateCache();
    }

    // Other entity cleanup
    for (const [type, list] of Object.entries(this.otherEntities)) {
      let wi = 0;
      for (let i = 0; i < list.length; i++) {
        if (this._kept(list[i])) list[wi++] = list[i];
      }
      list.length = wi;
    }
  }

  // Keep a list entry unless it is dead AND its death fade has run out. Live
  // entities carry _fade === undefined, so they are always kept.
  _kept(e) { return e.alive || e._fade !== 0; }

  // ============================================
  // PREDATOR-PREY COUPLING (opt-in per level)
  // ============================================

  regulateEagles() {
    const M = LEVEL_MECHANICS;
    const moa = this.getMoaPopulation();
    const perMoa = M.eaglesPerMoa ?? 0.09;
    const minE = M.minEagles ?? 1, maxE = M.maxEagles ?? 6;
    let target = Math.round(moa * perMoa);
    if (target < minE) target = minE;
    if (target > maxE) target = maxE;

    const phase = this.seasonManager.currentKey;
    const n = this.eagles.length;
    // Prey scarce + cold (glacial) -> an eagle starves or leaves.
    if (n > target && (phase === 'glacial' || phase === 'fullGlacial')) {
      this._removeWeakestEagle();
    // Prey plentiful + warm (interglacial) -> an eagle establishes / breeds.
    } else if (n < target && (phase === 'interglacial' || phase === 'cooling')) {
      this.spawnEagle();
    }
  }

  _removeWeakestEagle() {
    const eagles = this.eagles;
    if (eagles.length <= 1) return;
    // Prefer a resting / non-hunting eagle so we never cut off a live swoop.
    let idx = -1;
    for (let i = 0; i < eagles.length; i++) {
      const e = eagles[i];
      if (!e.hunting && e.state !== 'hunting') { idx = i; break; }
    }
    if (idx < 0) {
      let worst = -Infinity;
      for (let i = 0; i < eagles.length; i++) {
        const h = eagles[i].hunger || 0;
        if (h > worst) { worst = h; idx = i; }
      }
    }
    if (idx >= 0) {
      eagles.splice(idx, 1);
      if (this.game) this.game.addNotification("An eagle leaves as prey grows scarce.", 'info');
    }
  }

  onEagleStartHunt(eagle, target) {
  }
  
  onSeasonChange() {
    const plants = this.plants;
    const seasonManager = this.seasonManager;
    const dormancyChance = seasonManager.getDormancyChance();
    
    let dormantCount = 0, wokeCount = 0;
    
    for (let i = 0, len = plants.length; i < len; i++) {
      const plant = plants[i];
      if (plant.isSpawned) continue;
      
      const shouldBeDormant = seasonManager.shouldPlantBeDormant(plant.elevation, plant.biomeKey);
      
      if (shouldBeDormant && !plant.dormant && plant.alive) {
        if (random() < dormancyChance) { plant.goDormant(); dormantCount++; }
      } else if (!shouldBeDormant && plant.dormant) {
        if (random() < 0.5) { plant.dormant = false; plant.growth = 0.3; wokeCount++; }
      }
    }
    
    if (CONFIG.debugMode) {
      console.log(`Season change: ${dormantCount} plants went dormant, ${wokeCount} plants woke up`);
    }
  }

  // ============================================
  // RENDER (unified viewport culling)
  // ============================================

  // Advance the death fade on every dying BIRD once per REAL frame (called at the top
  // of render, so it ticks at wall-clock rate regardless of the deep-time warp). Birds
  // fade out on death (!alive) before cleanup() compacts them. Plants no longer fade:
  // browsing prunes them in place (Plant.consume) and habitat die-back shrinks them
  // away (Plant.update), so neither needs a removal fade. Off the hot sim path —
  // O(birds) once a frame, no allocation.
  _advanceFades() {
    const step = ((typeof deltaTime === 'number' && deltaTime > 0) ? deltaTime : 16.7) / TM_FADE_MS;
    this._fadeDeadList(this.moas, step);
    this._fadeDeadList(this.eagles, step);
    for (const type in this.otherEntities) this._fadeDeadList(this.otherEntities[type], step);
  }

  // Arm and advance the fade on dead birds in `list`. A freshly-dead entity has
  // _fade === undefined → arm it at 1; thereafter ease to 0, where cleanup() drops it.
  _fadeDeadList(list, step) {
    for (let i = 0, len = list.length; i < len; i++) {
      const e = list[i];
      if (e.alive) continue;
      if (e._fade === undefined) e._fade = 1;
      else if (e._fade > 0) { e._fade -= step; if (e._fade < 0) e._fade = 0; }
    }
  }

  // Render one entity, compositing it at its death-fade alpha when it is fading.
  // A live entity (_fade === undefined) draws at full alpha with no context churn.
  _renderWithFade(e, method) {
    const f = e._fade;
    if (f === undefined || f >= 1) { e[method](); return; }
    const dc = drawingContext, a = dc.globalAlpha;
    dc.globalAlpha = a * (f > 0 ? f : 0);
    e[method]();
    dc.globalAlpha = a;
  }

  render() {
    this._advanceFades();
    this.updateViewport();

    const vl = this._viewLeft;
    const vt = this._viewTop;
    const vr = this._viewRight;
    const vb = this._viewBottom;
    const m = this._viewMargin;
    
    const inView = (px, py, extra) => 
      px >= vl - m - extra && px <= vr + m + extra &&
      py >= vt - m - extra && py <= vb + m + extra;
    
    const plants = this.plants;
    const placeables = this.placeables;
    const eggs = this.eggs;
    const moas = this.moas;
    const eagles = this.eagles;

    // ---- Ground layer: one depth-sorted (painter) pass -----------------------
    // At the 3/4 angle, draw order must follow DEPTH (world y), not entity type:
    // a moa south of a tree has to draw in FRONT of it (the old fixed layers
    // always drew trees over moas). Collect every ground entity, insertion-sort
    // by pos.y ascending (far/north first), render in that order. The list is a
    // persistent array cleared each frame (never reallocated) and insertion sort
    // is ~O(n) on the near-sorted order frame to frame — no allocation in
    // draw(). md/TEMANAWA_34VIEW_PLAN.md §5.
    const GM = 60;   // uniform cull margin (covers sprite extent + lift)
    const list = this._sortList || (this._sortList = []);
    list.length = 0;

    // A canopy tree that has died back to a sub-pixel stub (habitat die-back,
    // Plant.update) is still .alive as rootstock but draws nothing, so skip it here
    // rather than sorting an invisible into the depth pass; it re-enters as it regrows.
    for (let i = 0; i < plants.length; i++) { const e = plants[i]; if (e.alive && e.growth > 0.03 && inView(e.pos.x, e.pos.y, GM)) list.push(e); }
    for (let i = 0; i < placeables.length; i++) { const e = placeables[i]; if (e.alive && e.type !== 'Storm' && inView(e.pos.x, e.pos.y, GM)) list.push(e); }
    for (let i = 0; i < eggs.length; i++) { const e = eggs[i]; if (e.alive && inView(e.pos.x, e.pos.y, GM)) list.push(e); }
    // Dead-but-fading birds (_fade > 0) keep drawing until the fade runs out.
    for (let i = 0; i < moas.length; i++) { const e = moas[i]; if ((e.alive || e._fade > 0) && inView(e.pos.x, e.pos.y, GM)) list.push(e); }
    for (const [type, arr] of Object.entries(this.otherEntities)) {
      for (let i = 0; i < arr.length; i++) {
        const e = arr[i];
        // Flyers (kererū, kōkako, huia — isFlyer) are drawn above with the eagles.
        if ((e.alive || e._fade > 0) && !e.isFlyer && type !== 'kea' && inView(e.pos.x, e.pos.y, GM)) list.push(e);
      }
    }

    for (let i = 1; i < list.length; i++) {            // insertion sort by depth (pos.y)
      const e = list[i], key = e.pos.y;
      let j = i - 1;
      while (j >= 0 && list[j].pos.y > key) { list[j + 1] = list[j]; j--; }
      list[j + 1] = e;
    }
    for (let i = 0; i < list.length; i++) this._renderWithFade(list[i], 'render');

    // ---- Above the ground plane (flyers, storms, indicators) -----------------
    // Eagles (aliveCheck true so a just-starved bird stops drawing immediately).
    this._renderFiltered(eagles, 30, null, true, inView);
    // Flying others (kea, kererū, kōkako, huia) fly over the canopy — render above
    // the ground plane, like the eagles. Keyed off the entity's isFlyer flag so a
    // new flighted species drops in without touching this loop.
    for (const [type, arr] of Object.entries(this.otherEntities)) {
      if (!arr.length) continue;
      const sample = arr[0];
      if (type === 'kea' || (sample && sample.isFlyer)) {
        this._renderFiltered(arr, 30, null, true, inView);
      }
    }
    // Storms sit above everything.
    this._renderFiltered(placeables, 80, p => p.type === 'Storm', true, inView);

    // WebGL entity layer (?render=gl): every sprite draw above landed in the GPU
    // batch. Composite it into the 2D frame HERE — after all sprites, before the
    // indicator over-pass — so hearts/rings (and the HUD, later) stay on top. A
    // no-op when GL is off; when on, it also drew the shadows/halos underneath on
    // the 2D canvas during the passes above.
    if (typeof GLBatch !== 'undefined' && GLBatch.enabled && GLBatch._open) {
      GLBatch.composite(drawingContext);
    }

    // Moa indicators (debug-only layer).
    this._renderFiltered(moas, 0, null, true, inView, 'renderIndicators');

    if (CONFIG.debugMode && CONFIG.showGridStats) this.renderGridStats();
  }
  
  /**
   * Render entities that pass filter and viewport check.
   * @param {Array} list - entity array
   * @param {number} extraMargin - additional viewport margin
   * @param {Function|null} filter - optional type filter (null = all)
   * @param {boolean} aliveCheck - whether to check .alive
   * @param {Function} inView - viewport test function
   * @param {string} method - render method name (default: 'render')
   */
  _renderFiltered(list, extraMargin, filter, aliveCheck, inView, method = 'render') {
    for (let i = 0, len = list.length; i < len; i++) {
      const e = list[i];
      // A dead-but-fading bird (_fade > 0) is still drawn, so a swooped kererū or a
      // caught moa eases out rather than blinking off the instant it dies.
      if (aliveCheck && !e.alive && !(e._fade > 0)) continue;
      if (filter && !filter(e)) continue;
      if (inView(e.pos.x, e.pos.y, extraMargin)) {
        this._renderWithFade(e, method);
      }
    }
  }
  
  renderGridStats() {
    const grids = {
      Moas: this.moaGrid, Eagles: this.eagleGrid,
      Plants: this.plantGrid, Placeables: this.placeableGrid
    };
    
    push();
    fill(0, 0, 0, 150);
    noStroke();
    rect(5, 100, 140, 100, 5);
    
    fill(255);
    textSize(8);
    textAlign(LEFT, TOP);
    let y = 105;
    
    text(`World: ${this.worldWidth}x${this.worldHeight}`, 10, y); y += 12;
    
    let maxInCell = 0;
    for (const [name, grid] of Object.entries(grids)) {
      const s = grid.getStats();
      text(`${name}: ${s.totalEntities} in ${s.nonEmptyCells} cells`, 10, y); y += 12;
      maxInCell = Math.max(maxInCell, s.maxInCell);
    }
    text(`Max/cell: ${maxInCell}`, 10, y);
    pop();
  }
  
  // ============================================
  // DATA FOR UI (Cached)
  // ============================================
  
  getSummary() {
    if (this._summaryFrame === frameCount) return this._cachedSummary;
    
    const summary = this._cachedSummary;
    const moas = this.moas;
    const plants = this.plants;
    
    summary.aliveMoas.length = 0;
    let migratingCount = 0;
    
    for (let i = 0, len = moas.length; i < len; i++) {
      const m = moas[i];
      if (m.alive) {
        summary.aliveMoas.push(m);
        if (m.isMigrating) migratingCount++;
      }
    }
    
    summary.moaCount = summary.aliveMoas.length;
    summary.migratingCount = migratingCount;
    
    let activePlants = 0, dormantPlants = 0;
    for (let i = 0, len = plants.length; i < len; i++) {
      const p = plants[i];
      if (p.dormant) dormantPlants++;
      else if (p.alive) activePlants++;
    }
    
    summary.plantCount = activePlants;
    summary.dormantPlantCount = dormantPlants;
    summary.eggCount = this.getAliveEggsCount();
    summary.eagleCount = this.countAliveEagles();
    summary.births = this.stats.births;
    summary.deaths = this.stats.deaths;
    
    // Other entity counts
    if (!summary.otherCounts) summary.otherCounts = {};
    for (const [type, list] of Object.entries(this.otherEntities)) {
      let count = 0;
      for (let i = 0; i < list.length; i++) {
        if (list[i].alive) count++;
      }
      summary.otherCounts[type] = count;
    }
    
    // Per-species moa breakdown
    if (!summary.moaBySpecies) summary.moaBySpecies = {};
    for (const key of (this.activeSpecies.moa || [])) {
      summary.moaBySpecies[key] = 0;
    }
    for (let i = 0; i < summary.aliveMoas.length; i++) {
      const key = summary.aliveMoas[i].speciesKey;
      if (key && summary.moaBySpecies[key] !== undefined) {
        summary.moaBySpecies[key]++;
      }
    }
    
    this._summaryFrame = frameCount;
    return summary;
  }
}