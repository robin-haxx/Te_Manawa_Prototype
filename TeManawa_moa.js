// ============================================
// MOA CLASS
// ============================================

const MOA_STATE = {
  IDLE: 'idle',
  FORAGING: 'foraging',
  FLEEING: 'fleeing',
  MIGRATING: 'migrating',
  FEEDING: 'feeding',
  SEEKING_MATE: 'seeking_mate',
  MATING: 'mating'
};

// Fallback species-highlight halo colour. Hoisted to module scope so the render
// path doesn't allocate a fresh [r,g,b] every frame for highlighted species that
// have no configured highlightColor. Read-only — never mutated.
const MOA_HL_DEFAULT = [255, 235, 120];

// Native facing of the moa art is per sprite set, not global: the mirror sign
// is read from the resolved set via EntitySprites.getMoaFaceSign(variant) in
// render() (see the entity-sprites header). The Moa/ illustrations all face
// RIGHT and return +1 (no mirror when flip=+1); a future left-facing set would
// return -1 so flip=+1 renders it mirrored.

const MOA_AGE = {
  JUVENILE_MAX: 600,
  ADULT_MIN: 900,
  MATING_AGE: 900,
  SIZE_JUVENILE: 0.6,
  SIZE_ADOLESCENT: 0.9,
  SIZE_ADULT: 1.0
};

class Moa extends Boid {
  static DEFAULTS = {
    size: { min: 8, max: 11 },
    baseSpeed: 0.1,
    fleeSpeed: 0.3,
    maxForce: 0.025,
    flockTendency: 0.8,
    flightiness: 0.7,
    eagleResistance: 0,
    foragingBonus: 1.0,
    camouflage: 0,
    maxHunger: 100,
    baseHungerRate: 0.02,
    hungerThreshold: 35,
    criticalHunger: 80,
    eggCooldownTime: 600,
    preferredElevation: { min: 0.35, max: 0.85 },
    matingHungerThreshold: 40,
    matingRange: 15,
    matingDuration: 60,
    pregnancyDuration: 90,
    matingSearchRadius: 100
  };

  constructor(x, y, terrain, config, speciesData = null) {
    super(x, y, terrain);
    this.config = config;
    
    const species = speciesData || (typeof REGISTRY !== 'undefined' && REGISTRY.getSpecies('upland_moa')) || { config: {} };
    const s = { ...Moa.DEFAULTS, ...(species.config || {}) };
    this.speciesConfig = s;
    
    // Store species key for offspring
    this.speciesKey = species.key || null;

    this.isFemale = random() < 0.5;

    // Size & age
    this.baseSize = typeof s.size === 'object' ? random(s.size.min, s.size.max) : (s.size || random(8, 11));
    this.size = this.baseSize * MOA_AGE.SIZE_JUVENILE;
    this.age = 0;
    this.ageStage = 'juvenile';
    this.animTime = random(1000);

    
    // Movement
    this.baseSpeed = s.baseSpeed;
    this.fleeSpeed = s.fleeSpeed;
    this.maxSpeed = this.baseSpeed;
    this.maxForce = s.maxForce;
    // A ground bird pivots deliberately: facing eases slowly (Boid.updateFacing).
    this._turnMax = 0.12;
    this._turnEase = 0.10;
    this.flockTendency = s.flockTendency;
    this.flightiness = s.flightiness;
    
    // Perception
    this.separationDistSq = 2500;
    this.fleeRadius = 85 * this.flightiness;
    this.fleeRadiusSq = this.fleeRadius * this.fleeRadius;
    this.eatRadiusSq = 196;
    
    // Abilities
    this.eagleResistance = s.eagleResistance;
    this.foragingBonus = s.foragingBonus;
    this.camouflage = s.camouflage;
    
    // Home range
    this.homeRange = createVector(x, y);
    this.homeRangeRadius = random(50, 90);
    this.homeRangeRadiusSq = this.homeRangeRadius * this.homeRangeRadius;
    
    // State
    this.alive = true;
    this.currentState = MOA_STATE.IDLE;
    this.panicLevel = 0;
    this.inShelter = false;
    
    // Hunger
    this.hunger = random(15, 35);
    this.maxHunger = s.maxHunger;
    this.baseHungerRate = s.baseHungerRate;
    this.hungerRate = this.baseHungerRate;
    this.hungerThreshold = s.hungerThreshold;
    this.criticalHunger = s.criticalHunger;
    
    // Foraging
    this.targetPlant = null;
    this.isFeeding = false;
    this.feedingAt = null;
    
    // Security & reproduction
    this.securityTime = 0;
    this.securityTimeRequired = (s.securityTimeBase || config.securityTimeToLay) + random(s.securityTimeVariation || config.securityTimeVariation);
    this.securityBonus = 1;
    this.eggSpeedBonus = 1;
    
    // Mating
    this.canMate = true;
    this.mateCooldown = 0;
    this.mateCooldownTime = s.eggCooldownTime;

    // Focal (the level's protected founders) vs non-focal (competitors). When a
    // level names its focalSpecies, the OTHER moa sustain themselves better: they
    // breed a bit faster and favour their own kind more strongly. With no focal
    // list set, every moa behaves as focal (unchanged).
    const _focal = (typeof LEVEL_MECHANICS !== 'undefined' && LEVEL_MECHANICS.focalSpecies) || null;
    this.isFocal = _focal ? _focal.indexOf(this.speciesKey) !== -1 : true;
    this.mateCrossPenalty = this.isFocal ? 40 : 80;
    this.reproCooldownMult = this.isFocal ? 1 : 0.7;

    // When the level forbids speciation, same-species pairing is mandatory:
    // cross-species is not a fallback but forbidden (see findPotentialMate).
    this._noSpeciation = (typeof LEVEL_MECHANICS !== 'undefined' && LEVEL_MECHANICS.noSpeciation) || false;
    // Later maturity (measured reproduction): a level may raise the age at which
    // a moa can first breed. Defaults to the global MOA_AGE.MATING_AGE.
    this._matingAge = (typeof LEVEL_MECHANICS !== 'undefined' && LEVEL_MECHANICS.matingAge) || MOA_AGE.MATING_AGE;
    // Soft carrying-capacity breeding gate, recomputed each tick in behave().
    // 1 = unsuppressed; <1 = probability the moa initiates courtship this tick.
    this._breedDensityFactor = 1;

    // Vulnerable-founder highlight: while this species sits at/below its threshold
    // it pulses in a highlight colour so the player can find and protect it.
    this._vhl = (typeof LEVEL_MECHANICS !== 'undefined' && LEVEL_MECHANICS.vulnerableHighlight &&
                 LEVEL_MECHANICS.vulnerableHighlight[this.speciesKey]) || null;
    this._highlightActive = false;
    this.matingHungerThreshold = s.matingHungerThreshold;
    this.matingRangeSq = s.matingRange * s.matingRange;
    this.matingDuration = s.matingDuration;
    this.pregnancyDuration = s.pregnancyDuration;
    this.matingSearchRadius = s.matingSearchRadius;
    this.matingPartner = null;
    this.matingTimer = 0;
    this.isPregnant = false;
    this.pregnancyTimer = 0;
    this.targetMate = null;
    this.heartTimer = 0;
    
    // Migration
    this.isMigrating = false;
    this.migrationTarget = null;
    this.migrationCooldown = 0;
    this.localFoodScore = 1.0;
    this.foodCheckTimer = 0;
    this._nearFavouredPlant = false;  // near a plant favoured by this species
    this.preferredElevation = s.preferredElevation;
    
    // Reusable vectors
    this._tempForce = createVector();
    this._returnForce = createVector();
    this._homeForce = createVector();
    this._migrationTargetVec = null;
    
    // Cached per-frame: threatening eagles (avoids double iteration)
    this._threateningEagles = [];
    
    // Season cache
    this._seasonCache = { key: null, hungerMod: 1, migrationStrength: 0, winterness: 0, preferredElevation: { min: 0.25, max: 0.70 } };
  }

  // Called from simulation's updateEggs when hatching new moa
  _cacheSizeMultipliers() {}

  _updateSeasonCache(sm) {
    const c = this._seasonCache;
    c.key = sm.currentKey;
    c.hungerMod = sm.getHungerModifier();
    c.migrationStrength = sm.getMigrationStrength();
    // Smooth 0..1 "winterness": ramps up across late autumn, holds at 1 through
    // winter, fades across the winter->spring thaw. Winter penalties scale by
    // this instead of snapping on at the hard season boundary.
    c.winterness = sm.getWinterness ? sm.getWinterness() : (c.key === 'fullGlacial' ? 1 : 0);
    const sp = sm.getPreferredElevation();
    const pp = this.speciesConfig.preferredElevation || sp;
    c.preferredElevation.min = (pp.min + sp.min) * 0.5;
    c.preferredElevation.max = (pp.max + sp.max) * 0.5;
  }

  // ============================================
  // AGE SYSTEM
  // ============================================

  updateAge(dt) {
    this.age += dt;
    
    let sizeMult;
    if (this.age >= MOA_AGE.ADULT_MIN) {
      this.ageStage = 'adult';
      // Adult females ~10% larger than males (sexual dimorphism)
      sizeMult = this.isFemale ? MOA_AGE.SIZE_ADULT : MOA_AGE.SIZE_ADULT * 0.9;
    } else if (this.age >= MOA_AGE.JUVENILE_MAX) {
      this.ageStage = 'adolescent';
      const adultSize = this.isFemale ? MOA_AGE.SIZE_ADULT : MOA_AGE.SIZE_ADULT * 0.9;
      sizeMult = lerp(MOA_AGE.SIZE_ADOLESCENT, adultSize, 
        (this.age - MOA_AGE.JUVENILE_MAX) / (MOA_AGE.ADULT_MIN - MOA_AGE.JUVENILE_MAX));
    } else {
      this.ageStage = 'juvenile';
      sizeMult = lerp(MOA_AGE.SIZE_JUVENILE, MOA_AGE.SIZE_ADOLESCENT, this.age / MOA_AGE.JUVENILE_MAX);
    }
    
    const newSize = this.baseSize * sizeMult;
    if (Math.abs(this.size - newSize) > 0.1) this.size = newSize;
  }

  isJuvenile() { return this.age < MOA_AGE.JUVENILE_MAX; }
  canMateByAge() { return this.age >= this._matingAge; }

  // ============================================
  // MATING READINESS
  // ============================================

  isReadyToMate() {
    return this.canMate && this.mateCooldown <= 0 && this.canMateByAge() &&
      !this.isPregnant && !this.matingPartner &&
      this.hunger < (this._effMatingHunger ?? this.matingHungerThreshold) &&
      this.securityTime >= this.securityTimeRequired * 0.5;
  }

  canBeMate() {
    return this.alive && this.canMate && this.mateCooldown <= 0 && this.canMateByAge() &&
      !this.isPregnant && !this.matingPartner &&
      this.hunger < (this._effMatingHunger ?? this.matingHungerThreshold) * 1.5;
  }

  // Soft carrying-capacity taper (opt-in via LEVEL_MECHANICS.breedingSoftCap).
  // Returns 1 while the total moa population is at/below the soft cap, then
  // falls linearly to breedingSuppressFloor as it climbs toward the carrying
  // cap. Used as a per-tick probability that a ready moa starts courtship, so
  // the unprompted spring boom flattens into a measured climb, and — because it
  // keys off live population — breeding rebounds automatically after a crash.
  _computeBreedDensityFactor(simulation) {
    const M = (typeof LEVEL_MECHANICS !== 'undefined') ? LEVEL_MECHANICS : null;

    // Per-species carrying target (opt-in): breed freely while this species is
    // below its comfortable level, then taper to a trickle as it reaches target.
    // Keyed off the LIVE species count, so a fast breeder can't fill the shared
    // moa cap and starve the slow species (mōho, goose) out of room — and a
    // crashed species rebounds on its own. Multiplies with the global soft cap.
    let speciesFactor = 1;
    if (M && M.speciesCarryingTargets && simulation._speciesTarget) {
      const target = simulation._speciesTarget(this.speciesKey);
      const n = simulation.getCachedSpeciesCount(this.speciesKey);
      const floorF = M.speciesSuppressFloor ?? 0.1;
      const knee = M.speciesBreedKnee ?? 0.7;         // breed freely below knee×target
      if (n >= target) speciesFactor = floorF;
      else if (n > target * knee) {
        const t = (n - target * knee) / (target * (1 - knee));   // 0..1 across the taper
        speciesFactor = 1 - t * (1 - floorF);
      }
    }

    const soft = M ? M.breedingSoftCap : undefined;
    if (soft == null) return speciesFactor;           // only the per-species gate active
    const carry = M.breedingCarryingCap ?? (soft * 3);
    const floor = M.breedingSuppressFloor ?? 0.15;
    const P = simulation.getMoaPopulation();
    let globalFactor;
    if (P <= soft) globalFactor = 1;
    else if (P >= carry) globalFactor = floor;
    else globalFactor = 1 - ((P - soft) / (carry - soft)) * (1 - floor);
    return speciesFactor * globalFactor;
  }

  // ============================================
  // MAIN BEHAVIOR
  // ============================================

  behave(simulation, seasonManager, dt = 1) {
    this.updateAge(dt);
    // animTime is NOT advanced here: the walk cadence must not fast-forward with
    // the deep-time clock. It advances in Boid.update() on the real frame dt.
    this._updateSeasonCache(seasonManager);
    
    const sc = this._seasonCache;
    
    // Hunger (juveniles 30% faster)
    const hungerMod = this.speciesConfig.seasonalModifiers?.[sc.key]?.hungerRate || 1;
    this.hungerRate = this.baseHungerRate * sc.hungerMod * hungerMod * (this.isJuvenile() ? 1.3 : 1);
    this.hunger = Math.min(this.hunger + this.hungerRate * dt, this.maxHunger);

    // Vulnerable-founder highlight flag (drawn in render): active while the
    // species is still below its threshold.
    if (this._vhl) {
      this._highlightActive = simulation.getCachedSpeciesCount(this.speciesKey) < this._vhl.until;
    }

    // Habitat stress (opt-in per level): a moa sitting far outside its
    // species' preferred elevation band burns extra energy. This keeps each
    // species genuinely tethered to its habitat rather than roaming freely.
    if (typeof LEVEL_MECHANICS !== 'undefined' && LEVEL_MECHANICS.habitatStress) {
      const niche = this.speciesConfig.preferredElevation;
      if (niche) {
        const elev = this.terrain.getElevationAt(this.pos.x, this.pos.y);
        const margin = LEVEL_MECHANICS.habitatStressMargin ?? 0.10;
        const lo = niche.min - margin, hi = niche.max + margin;
        const err = elev < lo ? lo - elev : (elev > hi ? elev - hi : 0);
        if (err > 0) {
          let penalty = LEVEL_MECHANICS.habitatStressPenalty ?? 0.45;
          // Ramp the cold-season surcharge in smoothly rather than at the winter boundary.
          penalty *= 1 + ((LEVEL_MECHANICS.winterStressMult ?? 1.4) - 1) * sc.winterness;
          this.hunger = Math.min(this.hunger + err * penalty * dt, this.maxHunger);
        }
      }
    }

    // Open-country tussock subsidy. Lowland grassland/scrub/coast grazers (the goose
    // and the plains/coastal moa, flagged `openCountry`) feed on the flush of new
    // tussock the visitor grows in a GLACIAL — the matched cold regime. A mild hunger
    // relief keeps them in breeding condition, and _resetAfterMating shortens their egg
    // cooldown while it holds: a small population lift, so the cold phase is busier, not
    // emptier (md/TEMANAWA_ECOLOGY_FAUNA.md). Reads the shared per-frame flag
    // (Game._tussockFlush) so the regime/millis isn't recomputed per bird. Runs before
    // the mating early-return so completeMating sees a fresh flag this frame.
    this._openCountryBoost = false;
    if (this.speciesConfig.openCountry &&
        typeof LEVEL_MECHANICS !== 'undefined' && LEVEL_MECHANICS.openCountryTussockBoost) {
      const g = simulation.game || (typeof game !== 'undefined' ? game : null);
      if (g && g._tussockFlush) {
        this._openCountryBoost = true;
        const relief = LEVEL_MECHANICS.openCountryBoostHungerRelief ?? 0.04;
        this.hunger = Math.max(0, this.hunger - relief * dt);
      }
    }

    // Cooldowns
    if (this.mateCooldown > 0) {
      this.mateCooldown -= dt;
      if (this.mateCooldown <= 0) this.canMate = true;
    }
    if (this.heartTimer > 0) this.heartTimer -= dt;
    
    // Food assessment (throttled)
    this.foodCheckTimer += dt;
    if (this.foodCheckTimer >= 60) {
      this.foodCheckTimer -= 60;
      const plants = simulation.getNearbyPlants(this.pos.x, this.pos.y, 60);
      let edible = 0, nearFav = false;
      for (let i = 0; i < plants.length; i++) {
        const p = plants[i];
        if (!p.alive || p._consumed) continue;
        if (p.favouredSpecies === this.speciesKey) nearFav = true;
        if (!p.dormant && p.growth > 0.5 && edible < 8) edible++;
      }
      this.localFoodScore = edible * 0.125;
      this._nearFavouredPlant = nearFav;
    }
    
    // Get nearby entities
    const px = this.pos.x, py = this.pos.y;
    const placeables = simulation.getNearbyPlaceables(px, py, 80);
    const eagles = simulation.getNearbyEagles(px, py, this.fleeRadius * 1.5);
    // Widen the neighbour query when the favoured-plant bonus is active, so
    // the doubled mating radius actually has candidates to search over.
    const moas = simulation.getNearbyMoas(px, py, Math.max(100, this.effectiveMatingRadius()));
    
    // Cache threatening eagles once (used by both determineState and executeState)
    this._cacheThreateningEagles(eagles);
    
    this.applyPlaceableEffects(placeables, dt);
    this.preferredElevation = sc.preferredElevation;
    
    // Mating takes priority
    if (this.matingPartner || this.matingTimer > 0) {
      this.executeMating(simulation, dt);
      return;
    }
    
    if (this.isPregnant) this.executePregnancy(simulation, placeables, dt);

    // Density-dependent breeding gate (recomputed here so determineState can
    // read it without threading simulation through its signature).
    this._breedDensityFactor = this._computeBreedDensityFactor(simulation);

    // Allee support: a species well BELOW its target breeds at a relaxed hunger
    // gate so the last few can climb back instead of hovering at the floor (grazers
    // are food-limited without the visitor planting, so they seldom dip under the
    // normal gate). At/above the fraction it's the normal gate, so healthy or
    // over-target populations are unaffected — this only ever helps recovery.
    this._mateHungerGate = this.hungerThreshold;
    this._effMatingHunger = this.matingHungerThreshold;
    if (typeof LEVEL_MECHANICS !== 'undefined' && LEVEL_MECHANICS.speciesCarryingTargets && simulation._speciesTarget) {
      const n = simulation.getCachedSpeciesCount(this.speciesKey);
      if (n < simulation._speciesTarget(this.speciesKey) * (LEVEL_MECHANICS.recoveryBreedFrac ?? 0.6)) {
        const mult = LEVEL_MECHANICS.recoveryMatingHungerMult ?? 1.6;
        this._mateHungerGate = this.hungerThreshold * mult;
        this._effMatingHunger = this.matingHungerThreshold * mult;
      }
    }

    // Determine and execute state
    this.currentState = this.determineState(placeables, sc, moas);
    this.executeState(simulation, sc, moas, placeables, dt);
    
    // Common behaviors
    this.applySeparation(moas);
    const avoid = this.avoidUnwalkable();
    avoid.mult(2);
    this.applyForce(avoid);
    this.edges();
    this.updateSecurity(eagles, dt);
    
    if (this.hunger >= this.maxHunger) {
      // Protected floor species (e.g. the last Dinornis) don't starve to death.
      if (simulation.isSpeciesProtected && simulation.isSpeciesProtected(this.speciesKey)) {
        this.hunger = this.maxHunger * 0.9;
      } else {
        this.alive = false;
      }
    }
    
    const terrainMult = this.getTerrainSpeedMultiplier();
    this.maxSpeed *= terrainMult;
    if (terrainMult < 0.7) this.vel.mult(0.95);
  }

  // Cache which eagles are threatening (hunting + in flee range)
  _cacheThreateningEagles(eagles) {
    const threats = this._threateningEagles;
    threats.length = 0;
    
    for (let i = 0; i < eagles.length; i++) {
      const e = eagles[i];
      if (this.inShelter && !e.isHunting()) continue;
      if (!e.isHunting()) continue;
      
      const dx = e.pos.x - this.pos.x, dy = e.pos.y - this.pos.y;
      const dSq = dx * dx + dy * dy;
      if (dSq < this.fleeRadiusSq) {
        threats.push({ eagle: e, distSq: dSq });
      }
    }
  }

  determineState(placeables, seasonCache, moas) {
    // Flee check (uses cached threats)
    if (this._threateningEagles.length > 0) {
      this.targetMate = null;
      return MOA_STATE.FLEEING;
    }
    
    if (this.matingTimer > 0 || this.matingPartner) return MOA_STATE.MATING;
    
    const _mateGate = this._mateHungerGate ?? this.hungerThreshold;

    if (this.canBeMate() && !this.targetMate && this.hunger < _mateGate) {
      for (let i = 0; i < moas.length; i++) {
        if (moas[i] !== this && moas[i].targetMate === this && moas[i].alive) {
          this.targetMate = moas[i];
          return MOA_STATE.SEEKING_MATE;
        }
      }
    }

    if (this.targetMate?.alive && this.canBeMate() && this.hunger < _mateGate)
      return MOA_STATE.SEEKING_MATE;

    if (this.isReadyToMate() && this.hunger < _mateGate &&
        (this._breedDensityFactor >= 1 || random() < this._breedDensityFactor)) {
      const mate = this.findPotentialMate(moas);
      if (mate) { this.targetMate = mate; return MOA_STATE.SEEKING_MATE; }
    }
    
    this.targetMate = null;
    
    // Actively eating at a placeable: stay on the food. (This used to rank
    // below MIGRATING, so a seasonal elevation shift pulled moa off feeders
    // mid-meal — a classic "starved out of nowhere".)
    if (this.isFeeding) return MOA_STATE.FEEDING;

    // Hunger deadband: start foraging above the threshold but keep foraging
    // until comfortably below it. Without it, one bite dropped hunger just
    // under the threshold → IDLE → home-range spring yanked the moa back →
    // hunger re-crossed → out again (rubber-banding).
    const _wasForaging = this.currentState === MOA_STATE.FORAGING || this.currentState === MOA_STATE.FEEDING;
    const _forageExit = Math.max(this.hungerThreshold - 10, 5);
    const _hungry = this.hunger > (_wasForaging ? _forageExit : this.hungerThreshold);

    // Food outranks migration when urgent or actually available: a starving
    // moa always eats first; a merely-hungry one eats first unless local food
    // is scarce (in which case migrating IS the path to food — and it still
    // forages opportunistically while travelling).
    if (_hungry && (this.hunger > this.criticalHunger || this.localFoodScore >= 0.3)) {
      return MOA_STATE.FORAGING;
    }

    if (this.isMigrating || this.shouldMigrate(seasonCache)) return MOA_STATE.MIGRATING;
    if (_hungry) return MOA_STATE.FORAGING;
    
    for (let i = 0; i < placeables.length; i++) {
      if (placeables[i].alive && placeables[i].getAttractionStrength(this) > 0) return MOA_STATE.FORAGING;
    }
    
    return MOA_STATE.IDLE;
  }

  executeState(simulation, seasonCache, moas, placeables, dt) {
    this.panicLevel = 0;
    const starving = this.hunger > this.criticalHunger;
    const speedMod = starving ? 0.6 : 1;
    
    switch (this.currentState) {
      case MOA_STATE.FLEEING:
        this.isMigrating = false;
        this.targetPlant = null;
        this.targetMate = null;
        this.maxSpeed = this.fleeSpeed * speedMod;
        // Use cached threatening eagles
        for (let i = 0; i < this._threateningEagles.length; i++) {
          const { eagle, distSq } = this._threateningEagles[i];
          const flee = this.fleeFrom(eagle.pos.x, eagle.pos.y);
          flee.mult(2.5 * this.flightiness);
          this.applyForce(flee);
          this.panicLevel = Math.max(this.panicLevel, 1 - Math.sqrt(distSq) / this.fleeRadius);
        }
        break;
        
      case MOA_STATE.SEEKING_MATE:
        this.maxSpeed = this.baseSpeed * 1.2;
        this.seekMate(moas, dt);
        break;
        
      case MOA_STATE.MIGRATING:
        this.targetMate = null;
        this.maxSpeed = this.baseSpeed * speedMod;
        this.executeMigration(simulation, seasonCache, dt);
        if (this.hunger > this.hungerThreshold) this.forage(simulation);
        break;
        
      case MOA_STATE.FORAGING:
        this.maxSpeed = this.baseSpeed * speedMod;
        if (!this.seekAttractions(placeables)) this.forage(simulation);
        break;
        
      case MOA_STATE.FEEDING:
        this.maxSpeed = this.baseSpeed * 0.7;
        if (this.feedingAt) {
          const dx = this.feedingAt.pos.x - this.pos.x, dy = this.feedingAt.pos.y - this.pos.y;
          const r = this.feedingAt.radius;
          // Graze across the stand rather than sliding to its centre: only steer
          // back when near the outer edge (and gently, with arrival so it eases
          // in instead of oscillating across the middle). Inside that band the
          // moa just wanders/grazes, so a herd spreads over the patch and can
          // still drift on through a corridor of feeders.
          if (dx * dx + dy * dy > r * r * 0.64) {
            this.applyForce(this.seek(this.feedingAt.pos, 0.3, r * 0.8));
          } else {
            const w = this.wander(); w.mult(0.2); this.applyForce(w);
          }
        }
        break;
        
      default: // IDLE
        this.maxSpeed = this.baseSpeed;
        this.targetPlant = null;
        if (!this.seekAttractions(placeables)) {
          const w = this.wander(); w.mult(0.4); this.applyForce(w);
          this.applyForce(this.stayInHomeRange());
        }
    }
  }

  // ============================================
  // TERRAIN-BASED SPEED
  // ============================================

  getTerrainSpeedMultiplier() {
    const velMagSq = this.vel.magSq();
    if (velMagSq < 0.0001) return 1.0;
    
    const velMag = Math.sqrt(velMagSq);
    const lookAhead = 3;
    const dirX = this.vel.x / velMag;
    const dirY = this.vel.y / velMag;
    
    const currentElev = this.terrain.getElevationAt(this.pos.x, this.pos.y);
    const aheadElev = this.terrain.getElevationAt(this.pos.x + dirX * lookAhead, this.pos.y + dirY * lookAhead);
    const slope = (aheadElev - currentElev) / lookAhead;
    
    // Uphill: significant slowdown; Downhill: slight boost
    return slope > 0
      ? Math.max(0.35, 1 - slope * 6)
      : Math.min(1.2, 1 - slope * 2);
  }

  // ============================================
  // MATING
  // ============================================

  // Mating search radius — doubled while standing near a plant favoured by
  // this species (a well-fed spot is a good place to pair up from).
  effectiveMatingRadius() {
    return this._nearFavouredPlant ? this.matingSearchRadius * 2 : this.matingSearchRadius;
  }

  findPotentialMate(moas) {
    // Two buckets: any same-species mate always beats a cross-species one, so a
    // small founder population reliably pairs within itself instead of being
    // forced to hybridise when both members happen to share a sex nearby.
    let best = null, bestScore = Infinity;            // same species
    let bestCross = null, bestCrossScore = Infinity;  // other species
    const _mateR = this.effectiveMatingRadius();
    const maxDistSq = _mateR * _mateR;
    const px = this.pos.x, py = this.pos.y;

    for (let i = 0; i < moas.length; i++) {
      const o = moas[i];
      if (o === this || !o.canBeMate()) continue;
      if (o.matingPartner && o.matingPartner !== this) continue;

      const dx = o.pos.x - px, dy = o.pos.y - py;
      const distSq = dx * dx + dy * dy;
      if (distSq > maxDistSq) continue;

      let score = distSq;
      if (o.targetMate === this) score *= 0.1;
      else if (o.currentState === MOA_STATE.SEEKING_MATE && !o.targetMate) score *= 0.5;
      else if (o.isReadyToMate()) score *= 0.7;
      else if (o.currentState === MOA_STATE.FORAGING) score *= 1.5;

      if (o.speciesKey === this.speciesKey) {
        if (score < bestScore) { bestScore = score; best = o; }
      } else {
        const cs = score * this.mateCrossPenalty; // cross-species is heavily discouraged
        if (cs < bestCrossScore) { bestCrossScore = cs; bestCross = o; }
      }
    }

    if (best) return best;              // prefer own kind whenever one is available
    if (this._noSpeciation) return null; // level forbids hybridising — pause instead
    return bestCross;                   // otherwise cross-species is a last resort
  }

  seekMate(moas, dt) {
    if (!this.targetMate?.alive || !this.targetMate.canBeMate()) {
      this.targetMate = this.findPotentialMate(moas);
      if (!this.targetMate) { this.currentState = MOA_STATE.IDLE; return; }
    }
    
    const t = this.targetMate;
    const dx = t.pos.x - this.pos.x, dy = t.pos.y - this.pos.y;
    const distSq = dx * dx + dy * dy;
    
    if (distSq < this.matingRangeSq) {
      this.initiateMating(t);
      return;
    }
    
    const dist = Math.sqrt(distSq);
    const predictTime = constrain(dist / max(this.maxSpeed - t.vel.mag() * 0.5, 0.1), 0, 40);
    this._tempForce.set(t.pos.x + t.vel.x * predictTime, t.pos.y + t.vel.y * predictTime);
    this.applyForce(this.seek(this._tempForce, map(dist, 0, this.matingSearchRadius, 1.5, 0.8), 12));
    
    if (distSq < this.matingSearchRadius * this.matingSearchRadius * 0.25) this.heartTimer = 20;
  }

  initiateMating(partner) {
    this._setMatingState(this, partner);
    this._setMatingState(partner, this);
    this.vel.mult(0.2);
    partner.vel.mult(0.2);
    if (audioManager) audioManager.playMateCheep();
  }

  _setMatingState(moa, partner) {
    moa.matingPartner = partner;
    moa.matingTimer = this.matingDuration;
    moa.currentState = MOA_STATE.MATING;
    moa.heartTimer = this.matingDuration;
    moa.targetMate = null;
  }

  executeMating(simulation, dt) {
    this.matingTimer -= dt;
    this.maxSpeed = this.baseSpeed * 0.15;
    
    if (this.matingPartner?.alive) {
      const dx = this.matingPartner.pos.x - this.pos.x;
      const dy = this.matingPartner.pos.y - this.pos.y;
      const distSq = dx * dx + dy * dy;
      
      if (distSq > this.matingRangeSq * 2) {
        this.applyForce(this.seek(this.matingPartner.pos, 0.5));
      } else if (distSq > 25) {
        this._tempForce.set(dx, dy);
        this._tempForce.setMag(this.maxForce * 0.3);
        this.applyForce(this._tempForce);
      }
      const w = this.wander(); w.mult(0.1); this.applyForce(w);
    } else {
      this.matingTimer = 0;
    }
    
    if (this.matingTimer <= 0) this.completeMating(simulation);
  }

  completeMating(simulation) {
    const partner = this.matingPartner;
    
    const bearer = this.alive ? this : partner;
    if (bearer?.alive) {
      bearer.isPregnant = true;
      bearer.pregnancyTimer = bearer.pregnancyDuration;
    }
    
    // Reset both
    this._resetAfterMating(this);
    if (partner?.alive) this._resetAfterMating(partner);
  }

  _resetAfterMating(moa) {
    moa.canMate = false;
    let _cd = moa.mateCooldownTime;
    if (typeof LEVEL_MECHANICS !== 'undefined') {
      // Cold-season breeding slowdown ramps in with winterness instead of snapping
      // on at the winter boundary.
      const _wm = LEVEL_MECHANICS.winterBreedingCooldownMult ?? 1;
      _cd *= 1 + (_wm - 1) * ((moa._seasonCache && moa._seasonCache.winterness) || 0);
      // Global "more measured" breeding: a flat lengthening of every cooldown.
      _cd *= (LEVEL_MECHANICS.breedingCooldownMult ?? 1);
    }
    _cd *= (moa.reproCooldownMult || 1);   // non-focal competitors breed a little faster
    // Open-country grazers breed a little faster during a matched TUSSOCK-in-glacial
    // flush (flag set each tick in behave) — the population lift that fills the cold plains.
    if (moa._openCountryBoost && typeof LEVEL_MECHANICS !== 'undefined' && LEVEL_MECHANICS.openCountryBoostCooldownMult)
      _cd *= LEVEL_MECHANICS.openCountryBoostCooldownMult;
    moa.mateCooldown = _cd;
    moa.matingPartner = null;
    moa.matingTimer = 0;
    moa.currentState = MOA_STATE.IDLE;
    moa.hunger += 10;
  }

  executePregnancy(simulation, placeables, dt) {
    this.pregnancyTimer -= dt;
    
    for (let i = 0; i < placeables.length; i++) {
      const p = placeables[i];
      if (p.alive && p.type === 'nest' && p.isInRange(this.pos)) {
        this.pregnancyTimer -= dt * 0.5;
        break;
      }
    }
    
    if (this.pregnancyTimer <= 0) this.layEgg(simulation);
  }

  layEgg(simulation) {
    const _cap = (typeof LEVEL_MECHANICS !== 'undefined' && LEVEL_MECHANICS.maxPerSpecies) || Infinity;
    if (simulation.getMoaPopulation() >= this.config.maxMoaPopulation ||
        (this.speciesKey && simulation.getSpeciesCount(this.speciesKey) >= _cap)) {
      this.isPregnant = false;
      this.pregnancyTimer = 0;
      return;
    }

    // Per-species carrying target: an over-target species mostly reabsorbs the
    // clutch instead of laying (a short retry cooldown, not a full cycle), so a
    // fast breeder like the goose settles NEAR its target instead of booming to
    // the shared cap and crowding the slow species out. The birth-step brake that
    // actually bites — the per-tick courtship gate only delays a ready pair a few
    // ticks. Mirrors the flyer taper in Kereru._tryReproduce.
    if (typeof LEVEL_MECHANICS !== 'undefined' && LEVEL_MECHANICS.speciesCarryingTargets && simulation._speciesTarget) {
      const target = simulation._speciesTarget(this.speciesKey);
      const n = simulation.getCachedSpeciesCount(this.speciesKey);
      const knee = LEVEL_MECHANICS.speciesBreedKnee ?? 0.7;
      let skip = 0;
      if (n >= target) skip = 1 - (LEVEL_MECHANICS.speciesOverTargetLay ?? 0.12);
      else if (n > target * knee) skip = (n - target * knee) / (target * (1 - knee));
      if (skip > 0 && random() < skip) {
        this.isPregnant = false;
        this.pregnancyTimer = 0;
        this.mateCooldown = this.mateCooldownTime * 0.4;   // short retry, not a full cycle
        return;
      }
    }

    const egg = simulation.addEgg(this.pos.x, this.pos.y);
    egg.speedBonus = this.eggSpeedBonus;
    if (this.speciesKey) egg.parentSpecies = this.speciesKey;
    
    
    this.isPregnant = false;
    this.pregnancyTimer = 0;
    this.hunger += 15;
    this.homeRange.set(this.pos.x, this.pos.y);
    this.securityTime = 0;
    this.securityTimeRequired = (this.speciesConfig.securityTimeBase || this.config.securityTimeToLay) +
      random(this.speciesConfig.securityTimeVariation || this.config.securityTimeVariation);
  }

  // ============================================
  // MOVEMENT
  // ============================================

  fleeFrom(tx, ty) {
    const f = this._returnForce;
    const dx = this.pos.x - tx, dy = this.pos.y - ty;
    const dSq = dx * dx + dy * dy;
    
    if (dSq < this.fleeRadiusSq && dSq > 0.0001) {
      const urgency = 1 - Math.sqrt(dSq) / this.fleeRadius;
      f.set(dx, dy);
      f.setMag(this.maxSpeed * (1 + urgency));
      f.sub(this.vel);
      f.limit(this.maxForce * 2);
    } else {
      f.set(0, 0);
    }
    return f;
  }

  stayInHomeRange() {
    const dx = this.homeRange.x - this.pos.x, dy = this.homeRange.y - this.pos.y;
    const dSq = dx * dx + dy * dy;
    const f = this._homeForce;
    
    if (dSq > this.homeRangeRadiusSq) {
      f.set(dx, dy);
      f.setMag(this.maxForce * 0.12);
      f.mult(1 + (Math.sqrt(dSq) - this.homeRangeRadius) * 0.02);
    } else {
      f.set(0, 0);
    }
    return f;
  }

  applySeparation(moas) {
    const f = this._tempForce;
    f.set(0, 0);
    let count = 0;
    
    const isMating = this.currentState === MOA_STATE.MATING || this.currentState === MOA_STATE.SEEKING_MATE;
    const sepDist = isMating ? this.separationDistSq * 0.15 : this.separationDistSq;
    
    for (let i = 0; i < moas.length; i++) {
      const o = moas[i];
      if (!o.alive || o === this || o === this.matingPartner || o === this.targetMate || o.targetMate === this) continue;
      
      const dx = this.pos.x - o.pos.x, dy = this.pos.y - o.pos.y;
      const dSq = dx * dx + dy * dy;
      
      if (dSq < sepDist && dSq > 0.0001) {
        f.x += dx / dSq;
        f.y += dy / dSq;
        count++;
      }
    }
    
    if (count > 0) {
      f.mult(1 / count);
      f.setMag(this.maxSpeed);
      f.sub(this.vel);
      f.limit(this.maxForce);
      
      const mult = isMating ? 0.2 : 
        (this.currentState === MOA_STATE.FLEEING ? 0.5 * this.flockTendency : 0.8 * (2 - this.flockTendency));
      f.mult(mult);
      this.applyForce(f);
    }
  }

  // ============================================
  // FORAGING
  // ============================================

  applyPlaceableEffects(placeables, dt) {
    this.inShelter = false;
    this.securityBonus = 1;
    this.eggSpeedBonus = 1;
    this.isFeeding = false;
    this.feedingAt = null;
    let hungerMod = 1, feedTotal = 0;
    
    for (let i = 0; i < placeables.length; i++) {
      const p = placeables[i];
      if (!p.alive || !p.isInRange(this.pos)) continue;
      
      const d = p.def;
      if (d.blocksEagleVision) this.inShelter = true;
      if (d.securityBonus) this.securityBonus = Math.max(this.securityBonus, d.securityBonus * p.seasonalMultiplier);
      if (d.eggSpeedBonus) this.eggSpeedBonus = Math.max(this.eggSpeedBonus, d.eggSpeedBonus * p.seasonalMultiplier);
      if (d.hungerSlowdown) hungerMod = Math.min(hungerMod, d.hungerSlowdown);
      if (d.feedingRate) {
        const fed = p.feedMoa(this, dt);
        if (fed > 0) {          // a species-exclusive feeder returns 0 to the wrong moa
          feedTotal += fed;
          this.isFeeding = true;
          this.feedingAt = p;
        }
      }
    }
    
    this.hungerRate = this.baseHungerRate * hungerMod;
    if (feedTotal > 0) this.hunger = Math.max(0, this.hunger - feedTotal);
  }

  seekAttractions(placeables) {
    let best = null, bestScore = 10;
    
    for (let i = 0; i < placeables.length; i++) {
      const p = placeables[i];
      if (!p.alive) continue;
      
      const strength = p.getAttractionStrength(this);
      if (strength <= 0) continue;
      
      const dx = p.pos.x - this.pos.x, dy = p.pos.y - this.pos.y;
      let score = strength * 50 - Math.sqrt(dx * dx + dy * dy) * 0.3;
      if (this.hunger > 30 && p.def.feedingRate) score += this.hunger * 0.3 * p.seasonalMultiplier;
      score *= p.seasonalMultiplier;
      
      if (score > bestScore) { bestScore = score; best = p; }
    }
    
    if (best) {
      const r = best.radius || 15;
      const dx = best.pos.x - this.pos.x, dy = best.pos.y - this.pos.y;
      const distSq = dx * dx + dy * dy;
      if (distSq > r * r) {
        // GUIDE phase: steer toward the patch at cruising speed with NO arrival
        // braking, so the moa reaches it carrying momentum instead of
        // decelerating onto the centre point. The old arrive-vs-attract tug (and
        // the vel*0.9 brake once in range) is what rubber-banded big, fast movers
        // like the giant moa as they hit a stand.
        this.applyForce(this.seek(best.pos, 0.8));
      } else {
        // ACROSS phase: once inside the patch, stop pulling the moa to the
        // centre. Preserve its heading so it grazes straight across and out the
        // far side — a *line* of favoured plants then behaves like a corridor
        // that conveys the herd along, letting the player steer where moa go
        // rather than trapping each one sliding to a centre point.
        const vMagSq = this.vel.x * this.vel.x + this.vel.y * this.vel.y;
        if (vMagSq > 0.0001) {
          const s = (this.maxForce * 0.6) / Math.sqrt(vMagSq);
          this._tempForce.set(this.vel.x * s, this.vel.y * s);
          this.applyForce(this._tempForce);
        } else {
          // Stalled dead inside a patch — nudge it back into motion through the
          // stand instead of letting it park on the centre.
          this.applyForce(this.seek(best.pos, 0.5));
        }
      }
      return true;
    }
    return false;
  }

  forage(simulation) {
    if (!this.targetPlant?.alive || this.targetPlant._consumed || this.targetPlant.growth < 0.5) {
      this.targetPlant = this.findPlant(simulation);
    }
    
    if (this.targetPlant) {
      const dx = this.targetPlant.pos.x - this.pos.x, dy = this.targetPlant.pos.y - this.pos.y;
      const dSq = dx * dx + dy * dy;
      
      if (dSq < this.eatRadiusSq) {
        let gain = this.targetPlant.consume();

        // Forest competition (opt-in per level): when the forest is crowded,
        // each moa wins less from a given plant (interference competition).
        // Combined with a glacially-scarce forest this makes habitat contested.
        if (typeof LEVEL_MECHANICS !== 'undefined' && LEVEL_MECHANICS.forestCompetition
            && FOREST_BIOMES.has(this.targetPlant.biomeKey)) {
          const radius = LEVEL_MECHANICS.forestCompetitionRadius ?? 45;
          const neighbours = simulation.getNearbyMoas(this.pos.x, this.pos.y, radius);
          let competitors = 0;
          for (let n = 0; n < neighbours.length; n++) {
            const m = neighbours[n];
            if (m !== this && m.alive) competitors++;
          }
          const tolerance = LEVEL_MECHANICS.forestCompetitionTolerance ?? 2;
          if (competitors > tolerance) {
            const over = competitors - tolerance;
            let per = LEVEL_MECHANICS.forestCompetitionPenalty ?? 0.18;
            // Cold-season competition ramps in with winterness (smooth, not a cliff).
            per *= 1 + ((LEVEL_MECHANICS.winterCompetitionMult ?? 1.6) - 1) * this._seasonCache.winterness;
            gain *= Math.max(0.25, 1 - over * per);
          }
        }

        // Diet breadth. A species-specific planted resource (lancewood, speargrass)
        // yields little to species it isn't favoured by, so it stays a targeted
        // founder subsidy (aggregation model of coexistence). Meanwhile the
        // non-focal competitors are dietary generalists: they win MORE from the
        // wild background flora than the specialist founders do, which is their
        // niche edge rather than nibbling the founders' planted food.
        if (this.targetPlant.favouredSpecies) {
          if (this.targetPlant.favouredSpecies !== this.speciesKey) {
            gain *= (typeof LEVEL_MECHANICS !== 'undefined' ? (LEVEL_MECHANICS.unfavouredBrowsePenalty ?? 0.25) : 0.25);
          }
          // else: browsing its own favoured plant — full gain.
        } else if (!this.isFocal && typeof LEVEL_MECHANICS !== 'undefined') {
          gain *= (LEVEL_MECHANICS.nonFocalGeneralistBonus ?? 1); // wild plant + generalist
        }

        this.hunger = Math.max(0, this.hunger - gain);
        this.targetPlant = null;
        this.vel.mult(0.3);
      } else {
        this.applyForce(this.seek(this.targetPlant.pos, map(this.hunger, this.hungerThreshold, this.maxHunger, 0.5, 0.9), 10));
      }
    } else {
      const w = this.wander(); w.mult(0.6); this.applyForce(w);
    }
  }

  findPlant(simulation) {
    // Starving moa cast a wider net rather than dying next to just-out-of-range food
    const _range = (this.hunger > this.criticalHunger ? 150 : 100) * this.foragingBonus;
    const plants = simulation.getNearbyPlants(this.pos.x, this.pos.y, _range);
    let best = null, bestScore = Infinity;
    
    for (let i = 0; i < plants.length; i++) {
      const p = plants[i];
      if (!p.alive || p._consumed || p.growth < 0.5) continue;
      if (p.seasonalModifier < 0.3 && this.hunger < 70) continue;
      
      const dx = p.pos.x - this.pos.x, dy = p.pos.y - this.pos.y;
      let score = Math.sqrt(dx * dx + dy * dy) / this.foragingBonus / p.seasonalModifier / (p.nutrition * 0.033);
      
      const hx = this.homeRange.x - p.pos.x, hy = this.homeRange.y - p.pos.y;
      if (hx * hx + hy * hy < this.homeRangeRadiusSq) score *= 0.7;
      if (p.isSpawned) score *= 0.6;
      if (p.favouredSpecies) {
        if (p.favouredSpecies === this.speciesKey) score *= 0.6;  // prefer own resource
        else score *= 4.0;                                        // largely ignore others'
      }

      // Deprioritise food on the FAR side of water: the straight path crosses the river/sea,
      // so a moa can't graze it without a detour — chasing it just noses into the shore and
      // rubber-bands (the "sand band around the river, not finding food" report). A soft
      // penalty, not a hard skip, so a moa in a genuine one-sided food desert can still fall
      // back to it rather than starve. Cheap: one water-type sample at the path midpoint.
      const mx = (this.pos.x + p.pos.x) * 0.5, my = (this.pos.y + p.pos.y) * 0.5;
      const midWater = (typeof this.terrain.waterTypeAt === 'function')
        ? this.terrain.waterTypeAt(mx, my) !== 0
        : !this.terrain.isWalkable(mx, my);
      if (midWater) score *= 6.0;

      if (score < bestScore) { bestScore = score; best = p; }
    }
    return best;
  }

  // ============================================
  // MIGRATION
  // ============================================

  shouldMigrate(sc) {
    const elev = this.terrain.getElevationAt(this.pos.x, this.pos.y);
    const p = this.preferredElevation;
    const err = elev < p.min ? p.min - elev : (elev > p.max ? elev - p.max : 0);
    
    return err > 0.08 || (this.localFoodScore < 0.3 && this.hunger > 30) || (err > 0.03 && sc.migrationStrength > 0.7);
  }

  executeMigration(simulation, sc, dt) {
    if (this.migrationCooldown > 0) {
      this.migrationCooldown -= dt;
      if (this.migrationTarget) this.moveToMigrationTarget(sc);
      return;
    }

    if (!this.isMigrating && this.shouldMigrate(sc)) {
      this.migrationTarget = this.findMigrationTarget(simulation);
      this.isMigrating = !!this.migrationTarget;
    }

    if (this.isMigrating && this.migrationTarget) this.moveToMigrationTarget(sc);
  }

  findMigrationTarget(simulation) {
    const target = (this.preferredElevation.min + this.preferredElevation.max) * 0.5;
    const current = this.terrain.getElevationAt(this.pos.x, this.pos.y);
    let bestX = 0, bestY = 0, bestScore = -Infinity, found = false;
    const mapW = this.terrain.mapWidth - 20, mapH = this.terrain.mapHeight - 20;

    // Forest-seeking species (e.g. little bush moa) bias candidate scoring
    // toward dense tree cover (beech/Totara/fern).
    const forestAffinity =
      (simulation && typeof FOREST_TREES !== 'undefined' &&
       this.speciesConfig.forestAffinity) || 0;

    for (let i = 0; i < 20; i++) {
      const angle = random(TWO_PI), dist = random(50, 150);
      const x = constrain(this.pos.x + cos(angle) * dist, 20, mapW);
      const y = constrain(this.pos.y + sin(angle) * dist, 20, mapH);

      if (!this.terrain.isWalkable(x, y)) continue;

      const elev = this.terrain.getElevationAt(x, y);
      let score = 1 - abs(elev - target) * 5;
      if (elev >= this.preferredElevation.min && elev <= this.preferredElevation.max) score += 0.5;
      if ((current < target && elev > current) || (current > target && elev < current)) score += 0.3;

      if (forestAffinity > 0) {
        const plants = simulation.getNearbyPlants(x, y, 60);
        let trees = 0;
        for (let j = 0; j < plants.length && trees < 8; j++) {
          const p = plants[j];
          if (p.alive && FOREST_TREES.has(p.type)) trees++;
        }
        score += (trees / 8) * forestAffinity;  // up to +forestAffinity at full cover
      }

      if (score > bestScore) { bestScore = score; bestX = x; bestY = y; found = true; }
    }
    
    if (found) {
      if (!this._migrationTargetVec) this._migrationTargetVec = createVector(bestX, bestY);
      else this._migrationTargetVec.set(bestX, bestY);
      return this._migrationTargetVec;
    }
    return null;
  }

  moveToMigrationTarget(sc) {
    const dx = this.migrationTarget.x - this.pos.x, dy = this.migrationTarget.y - this.pos.y;
    
    if (dx * dx + dy * dy < 400) {
      this.homeRange.set(this.migrationTarget.x, this.migrationTarget.y);
      this.homeRangeRadiusSq = this.homeRangeRadius * this.homeRangeRadius;
      this.isMigrating = false;
      this.migrationTarget = null;
      this.migrationCooldown = 300;
      return;
    }
    
    let urgency = 0.5 + sc.migrationStrength * 0.5;
    if (this.hunger > 50 && this.localFoodScore < 0.3) urgency *= 1.5;
    
    const seek = this.seek(this.migrationTarget, urgency, 25);
    seek.mult(sc.migrationStrength);
    this.applyForce(seek);
  }

  // ============================================
  // SECURITY
  // ============================================

  updateSecurity(eagles, dt) {
    const safeDist = this.fleeRadiusSq * 0.64;
    let nearest = Infinity;
    
    for (let i = 0; i < eagles.length; i++) {
      const dx = eagles[i].pos.x - this.pos.x, dy = eagles[i].pos.y - this.pos.y;
      nearest = Math.min(nearest, dx * dx + dy * dy);
    }
    
    if (nearest > safeDist) this.securityTime += this.securityBonus * dt;
    else this.securityTime = Math.max(0, this.securityTime - dt * 2);
  }

  resistEagleAttack() {
    return this.eagleResistance > 0 && random() < this.eagleResistance;
  }

  // ============================================
  // RENDERING
  // ============================================

  render() {
    // A dead moa keeps rendering while its death fade runs (_fade > 0); the sim's
    // render layer composites the alpha. Only skip once fully faded / never-set.
    if (!this.alive && !(this._fade > 0)) return;

    const variant = this.speciesConfig.spriteSet;
    // Per-species tint (by genus), baked into the sprite once (EntitySprites
    // caches the tinted frames) instead of a tint() composite every frame (#6).
    // Skip it for species with their own dedicated sprite set (e.g. bush moa).
    const _tint = variant ? null : this.speciesConfig.tint;
    const _moving = this.vel.magSq() > 0.01;
    // Mating holds a dedicated pose (frame 05) regardless of movement.
    const _mating = this.currentState === MOA_STATE.MATING;
    const sprite = _tint
      ? EntitySprites.getMoaSpriteTinted(this.animTime, _moving, _tint, _mating)
      : EntitySprites.getMoaSprite(this.animTime, _moving, variant, _mating);
    if (!sprite) return;
    
    push();
    // Sit on the 3/4 ground: the anchor y is projected (Projection.groundY, which
    // now lifts with terrain elevation), so the sprite rides the relief while
    // staying undistorted. x is unchanged. FOOT-ANCHORED (the image is drawn with its
    // base on this point below) — the moa's ground-contact is now pos.y, the SAME
    // convention base-anchored trees use, so the painter's y-sort (Simulation.render)
    // orders a moa against a tree by where they actually stand. Centre-anchoring hung
    // the lower body a half-sprite SOUTH of pos.y, so a moa clearly in front of a tree
    // sorted behind it and drew occluded (the "moa render behind trees they're in
    // front of" report). The Moa/ art fills its frame with no bottom padding, so the
    // feet land exactly on the ground point.
    translate(this.pos.x, Projection.groundY(this.pos.y, this.terrain.getElevationAt(this.pos.x, this.pos.y)));

    // Species highlight: a soft pulsing halo under the moa, driven purely by
    // the player toggle (population panel / fullscreen focus buttons; focus
    // species start toggled on). The low-population warning is a separate red
    // ring drawn in renderIndicators so it sits above trees.
    if (typeof SPECIES_HIGHLIGHT !== 'undefined' && SPECIES_HIGHLIGHT.has(this.speciesKey)) {
      const _hc = this.speciesConfig.highlightColor ||
                  (this._vhl && this._vhl.color) || MOA_HL_DEFAULT;
      const _pulse = 0.5 + 0.5 * Math.sin(frameCount * 0.12);
      noStroke();
      fill(_hc[0], _hc[1], _hc[2], 55 + _pulse * 95);
      ellipse(0, 0, this.size * (2.8 + _pulse * 1.4), this.size * (2.8 + _pulse * 1.4));
    }

    // Shadow
    if (CONFIG.drawShadows) {
      noStroke();
      fill(0, 0, 0, 25);
      ellipse(1.5, 1.5, this.size * 1.0, this.size * 0.5);
    }

    // Lateral flip instead of top-down rotation (a walking animal turns around,
    // it doesn't spin). _flip is the eased horizontal facing (updateFacing, Boid):
    // +1 faces right, -1 faces left, and it animates THROUGH 0, where the sprite
    // is edge-on (scaleX → 0) and squashes before opening out mirrored. The small
    // vertical stretch at |flip| → 0 is the bounce that makes the turn fun.
    const flip = (this._flip !== undefined) ? this._flip : 1;
    // The resolved set's faceSign corrects for its native facing so +1 always
    // faces right, whatever direction the sprite set is drawn in (generic art
    // faces left, the dedicated Moa/ art faces right).
    const faceSign = EntitySprites.getMoaFaceSign(variant);
    scale(flip * faceSign, 1 + (1 - Math.abs(flip)) * 0.18);

    noTint();   // the sprite is already tinted (baked once); avoid a stray double-tint
    imageMode(CENTER);
    // Draw at the sprite's own aspect ratio: width anchors to the size budget,
    // height follows. The generic frame is square (unchanged), but the dedicated
    // Moa/ art is landscape and would stretch tall if forced into a square box.
    const _drawW = this.size * 2.5 * (this.speciesConfig.spriteScale || 1);
    const _drawH = (sprite.width > 0) ? _drawW * (sprite.height / sprite.width) : _drawW;
    // Foot-anchored: centre the image a half-height ABOVE the ground point so its base
    // sits on it (see the translate note). The vertical squash-stretch above scales about
    // the feet, so the turn-around bounce now springs from planted feet rather than the belly.
    image(sprite, 0, -_drawH * 0.5, _drawW, _drawH);
    pop();
  }

  // Pulsing red vulnerable-founder ring. Called from renderIndicators, and
  // re-drawn above the tutorial overlay for tips flagged ringsAboveUI.
  renderLowPopRing() {
    if (!this._highlightActive) return;
    const _pulse = 0.5 + 0.5 * Math.sin(frameCount * 0.12);
    const _d = this.size * (2.8 + _pulse * 1.4);
    noFill();
    stroke(255, 70, 60, 120 + _pulse * 120);
    strokeWeight(1.5);
    ellipse(this.pos.x, this.pos.y, _d, _d);
  }

  renderIndicators() {
    const px = this.pos.x, py = this.pos.y, s = this.size;

    // Mating heart — the ONE breeding cue kept for visitors (user-facing), so it draws
    // whether or not the debug entity-UI layer is on. Drawn first, in the top indicator
    // pass, so it floats above trees.
    this._renderMatingHeart(px, py, s);

    // Everything below is debug-only instrumentation (CONFIG.showEntityUI): pregnancy dots,
    // low-population rings, hunger/age bars and state glyphs — the "this is a video game"
    // layer that has no place in an ambient diorama.
    if (!CONFIG.showEntityUI) return;

    const yOff = -s * 0.8 - 4;

    // Low-population warning: a pulsing red ring. Drawn here (the indicator
    // pass, top render layer) rather than under the body, so it stays visible
    // over trees and other plants.
    this.renderLowPopRing();
    
    // (The mating heart is drawn user-facing above, ahead of the debug gate.)

    // Pregnancy indicator (females only now)
    if (this.isPregnant) {
      const prog = 1 - this.pregnancyTimer / this.pregnancyDuration;
      fill(245, 238, 220, 220);
      stroke(200, 195, 180, 200);
      strokeWeight(0.5);
      ellipse(px, py - s - 3, 4 * (0.5 + prog * 0.5), 5 * (0.5 + prog * 0.5));
    }
    
    
    noStroke();
    
    // Hunger bar
    this._drawBar(px, py + yOff, 14, 2, 1 - this.hunger / this.maxHunger, 
      [120 + (this.hunger / this.maxHunger) * 120, 260 - (this.hunger / this.maxHunger) * 120, 120]);
    
    // Secondary bar (age/mating/pregnancy)
    if (!this.canMateByAge()) {
      this._drawBar(px, py + yOff - 3, 14, 2, this.age / MOA_AGE.MATING_AGE, [150, 200, 255]);
    } else if (this.isPregnant) {
      this._drawBar(px, py + yOff - 3, 14, 2, 1 - this.pregnancyTimer / this.pregnancyDuration, [220, 200, 100]);
    } else if (this.isReadyToMate()) {
      this._drawBar(px, py + yOff - 3, 14, 2, 1, [255, 150, 180]);
    } else if (this.canMate && this.mateCooldown <= 0) {
      const prog = this.securityTime / (this.securityTimeRequired * 0.5);
      if (prog > 0.1) this._drawBar(px, py + yOff - 3, 14, 2, Math.min(prog, 1), [220, 180, 200]);
    }
    
    // State icon
    textAlign(CENTER, BOTTOM);
    textSize(6);
    if (this.isJuvenile()) { fill(150, 200, 255, 220); text("◆", px, py + yOff - 5); }
    else if (this.isMigrating) { fill(100, 150, 255, 220); text("↗", px, py + yOff - 5); }
    else if (this.currentState === MOA_STATE.SEEKING_MATE) { fill(255, 150, 180, 220); text("♥", px, py + yOff - 5); }
    else if (this.localFoodScore < 0.3 && !this.isFeeding) { fill(255, 180, 80, 220); text("!", px, py + yOff - 5); }
    // Sex indicator for adults
    else if (this.canMateByAge()) { 
      fill(200, 200, 200, 140); 
      text(this.isFemale ? "♀" : "♂", px, py + yOff - 5); 
    }
  }

  // The mating heart — user-facing (see renderIndicators): a small soft-pink heart that
  // rises and fades over a breeding pair. The one breeding cue kept in the ambient diorama;
  // gentle and non-flashing (photosensitivity). Anchored in world space, like the rest of
  // the indicator pass, so it stays above trees.
  _renderMatingHeart(px, py, s) {
    if (!(this.heartTimer > 0)) return;
    const a = Math.min(255, this.heartTimer * 8);
    push();
    noStroke();
    fill(255, 120, 140, a);
    translate(px, py - s - 5 + Math.sin(this.animTime * 0.15) * 2);
    scale(0.5);
    beginShape(); vertex(0, -3); bezierVertex(-5, -8, -10, -3, 0, 5); endShape();
    beginShape(); vertex(0, -3); bezierVertex(5, -8, 10, -3, 0, 5); endShape();
    pop();
  }

  // Small two-tone progress bar used by the indicators above.
  _drawBar(x, y, w, h, pct, col) {
    fill(40, 40, 40, 150);
    rect(x - w/2, y, w, h, 1);
    fill(col[0], col[1], col[2]);
    rect(x - w/2, y, w * Math.max(0, Math.min(1, pct)), h, 1);
  }
}