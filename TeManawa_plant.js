// ============================================
// PLANT CLASS 
// ============================================

// Plant type constants (avoid string comparisons)
const PLANT_TYPE_ID = {
  tussock: 0,
  flax: 1,
  fern: 2,
  kawakawa: 3,
  Totara: 4,
  beech: 5,
  patotara: 6,
  coprosma: 7,
  dracophyllum: 8,
  matagouri: 9,
  lancewood: 10,
  speargrass: 11,
  kowhai: 12,
  kahikatea: 13,
  nikau: 14,
  tawa: 15,
  manuka: 16,
  cabbagetree: 17
};

// Plants that use sprite rendering
const SPRITE_PLANTS = new Set(['tussock', 'flax', 'fern', 'Totara', 'beech', 'patotara', 'lancewood',
  'kowhai', 'kahikatea', 'nikau', 'tawa', 'manuka', 'cabbagetree', 'coprosma', 'dracophyllum']);

// Forest canopy trees subject to seasonal forest-band contraction. Kahikatea and
// tawa are canopy trees that retreat with the glacial forest; mānuka (open-ground
// pioneer), nīkau (its low coldTolerance already sinks it in glacials) and cabbage
// tree (open wetland margin) are deliberately NOT here.
const FOREST_TREES = new Set(['beech', 'Totara', 'fern', 'kahikatea', 'tawa']);

// Cold-refuge canopy — black beech (Fuscospora), the GLACIAL REFUGIUM tree. It dominates LGM
// tree pollen and holds in sheltered pockets while the warm podocarp-broadleaf forest retreats
// (TEMANAWA_ECOLOGY.md §3.3; memory beech-glacial-refuge). It stays a FOREST_TREE — canopy
// die-back still applies where it genuinely can't live — but the glacial forest-CONTRACTION does
// NOT suppress it, so as the band shrinks it HOLDS where the warm trees fall back: "the forest
// that survives the ice is the beech." This realises the intent already stated in
// TeManawa_plant_defs.js ("a glacial produces … beech holding mature, fern wilting").
const COLD_REFUGE = new Set(['beech']);

// Sprite reference - initialized from mauri_sketch.js
let PLANT_SPRITES = null;

function initPlantSprites(sprites) {
  PLANT_SPRITES = sprites;
}

// Pre-computed values shared across all plants
const PlantStatics = {
  kawakawaAngles: null,
  kawakawaBuffer: null,
  kawakawaBufferDormant: null,
  swayTable: null,
  initialized: false,
  
  SWAY_TABLE_SIZE: 256,
  
  init() {
    if (this.initialized) return;
    
    // Pre-compute kawakawa angles
    this.kawakawaAngles = [];
    const kawaStep = TWO_PI / 5;
    for (let i = 0; i < 5; i++) {
      this.kawakawaAngles.push(i * kawaStep + 0.2);
    }
    
    // Pre-compute sway lookup table
    this.swayTable = new Float32Array(this.SWAY_TABLE_SIZE);
    for (let i = 0; i < this.SWAY_TABLE_SIZE; i++) {
      this.swayTable[i] = Math.sin((i / this.SWAY_TABLE_SIZE) * TWO_PI);
    }
    
    // Pre-render kawakawa buffers
    this._renderKawakawaBuffers();
    
    this.initialized = true;
  },
  
  _renderKawakawaBuffers() {
    const size = 64;
    
    // Normal state
    this.kawakawaBuffer = createGraphics(size, size);
    this._drawKawakawaToBuffer(this.kawakawaBuffer, size, false);
    
    // Dormant state (brownish/wilted)
    this.kawakawaBufferDormant = createGraphics(size, size);
    this._drawKawakawaToBuffer(this.kawakawaBufferDormant, size, true);
  },
  
  _drawKawakawaToBuffer(buffer, size, dormant) {
    const displaySize = size * 0.8;
    const cx = size / 2;
    const cy = size / 2;
    
    buffer.push();
    buffer.translate(cx, cy);
    
    const angles = this.kawakawaAngles;
    const stemLen = displaySize * 0.3;
    const leafPosOffset = stemLen + displaySize * 0.15;
    const alpha = dormant ? 150 : 255;
    
    // Color adjustments for dormant state
    const leafFillR = dormant ? 110 : 85;
    const leafFillG = dormant ? 115 : 155;
    const leafFillB = dormant ? 80 : 55;
    
    const stemR = dormant ? 90 : 75;
    const stemG = dormant ? 95 : 110;
    const stemB = dormant ? 60 : 50;
    
    for (let i = 0; i < 5; i++) {
      buffer.push();
      buffer.rotate(angles[i]);
      
      // Stem
      buffer.stroke(stemR, stemG, stemB, alpha);
      buffer.strokeWeight(displaySize * 0.03);
      buffer.line(0, 0, stemLen, 0);
      
      buffer.translate(leafPosOffset, 0);
      buffer.rotate(HALF_PI);
      
      const lw = displaySize * 0.32;
      const lh = displaySize * 0.38;
      const lw2 = lw * 0.2;
      const lw45 = lw * 0.45;
      const lw5 = lw * 0.5;
      const lw55 = lw * 0.55;
      const lw15 = lw * 0.15;
      const lh5 = lh * 0.5;
      const lh35 = lh * 0.35;
      const lh2 = lh * 0.2;
      const lh4 = lh * 0.4;
      const lh05 = lh * 0.05;
      
      // Heart-shaped leaf
      buffer.fill(leafFillR, leafFillG, leafFillB, alpha);
      buffer.stroke(dormant ? 70 : 60, dormant ? 100 : 120, dormant ? 55 : 45, alpha);
      buffer.strokeWeight(1);
      
      buffer.beginShape();
      buffer.vertex(0, -lh5);
      buffer.bezierVertex(-lw2, -lh5, -lw45, -lh35, -lw5, -lh05);
      buffer.bezierVertex(-lw55, lh2, -lw15, lh4, 0, lh5);
      buffer.bezierVertex(lw15, lh4, lw55, lh2, lw5, -lh05);
      buffer.bezierVertex(lw45, -lh35, lw2, -lh5, 0, -lh5);
      buffer.endShape(CLOSE);
      
      // Central vein
      buffer.stroke(dormant ? 70 : 55, dormant ? 90 : 110, dormant ? 50 : 40, alpha);
      buffer.strokeWeight(displaySize * 0.015);
      buffer.line(0, -lh * 0.4, 0, lh * 0.45);
      
      // Side veins
      buffer.strokeWeight(displaySize * 0.008);
      const veinX0 = lw * 0.3;
      const veinX1 = lw * 0.25;
      const veinX2 = lw * 0.2;
      const veinYStart = -lh * 0.2;
      const veinYStep = lh * 0.22;
      const veinYOffset = lh * 0.1;
      
      buffer.line(0, veinYStart, -veinX0, veinYStart + veinYOffset);
      buffer.line(0, veinYStart, veinX0, veinYStart + veinYOffset);
      buffer.line(0, veinYStart + veinYStep, -veinX1, veinYStart + veinYStep + veinYOffset);
      buffer.line(0, veinYStart + veinYStep, veinX1, veinYStart + veinYStep + veinYOffset);
      buffer.line(0, veinYStart + veinYStep * 2, -veinX2, veinYStart + veinYStep * 2 + veinYOffset);
      buffer.line(0, veinYStart + veinYStep * 2, veinX2, veinYStart + veinYStep * 2 + veinYOffset);
      
      // Holes (characteristic of kawakawa)
      buffer.fill(dormant ? 50 : 35, dormant ? 70 : 80, dormant ? 40 : 30, dormant ? 120 : 180);
      buffer.noStroke();
      buffer.ellipse(-lw * 0.2, lh * 0.1, lw * 0.15, lw * 0.12);
      buffer.ellipse(lw * 0.15, -lh * 0.1, lw * 0.1, lw * 0.1);
      
      buffer.pop();
    }
    
    // Center node
    buffer.fill(dormant ? 100 : 90, dormant ? 85 : 75, dormant ? 65 : 55, alpha);
    buffer.noStroke();
    buffer.ellipse(0, 0, displaySize * 0.12, displaySize * 0.12);
    
    buffer.pop();
  },
  
  getSway(frameCount, phase, modifier) {
    const index = ((frameCount * 0.02 + phase) * (this.SWAY_TABLE_SIZE / TWO_PI)) % this.SWAY_TABLE_SIZE;
    return this.swayTable[index | 0] * 0.028 * modifier;
  }
};

class Plant {
  constructor(x, y, type, terrain, biomeKey) {
    // Initialize statics if needed
    PlantStatics.init();
    
    this.pos = createVector(x, y);
    this.type = type;
    this.typeId = PLANT_TYPE_ID[type] ?? 4;
    this.terrain = terrain;
    this.biomeKey = biomeKey;
    this.elevation = terrain.getElevationAt(x, y);
    
    // Check if this plant uses sprites
    this.usesSprites = SPRITE_PLANTS.has(type);
    
    const plantDef = PLANT_TYPES[type];
    this.baseNutrition = plantDef.nutrition;
    this.nutrition = plantDef.nutrition;
    this.maxNutrition = plantDef.nutrition;
    this.size = plantDef.size;
    this.baseGrowthTime = plantDef.growthTime;
    this.growthTime = plantDef.growthTime;
    this.coldTolerance = plantDef.coldTolerance ?? 0.5;

    // Parse color once and cache RGB values (for procedural rendering)
    const c = color(plantDef.color);
    this.baseR = red(c);
    this.baseG = green(c);
    this.baseB = blue(c);

    this.alive = true;
    // Vestigial browse-fade flags. Browsing now PRUNES in place (see consume()) and
    // never removes a plant, so nothing sets these anymore; they remain only because
    // a few call sites still read `_consumed` defensively (moa/kererū foraging skips).
    this._consumed = false;
    this._fade = undefined;
    // Canopy tree subject to glacial forest-band die-back (see update()). Cached once;
    // also grants the faster recovery-regrowth rate so a cut-back forest bounces back.
    this._forestTree = FOREST_TREES.has(type);
    this._coldRefuge = COLD_REFUGE.has(type);   // beech holds through the glacial (exempt from band contraction)
    this._kahikatea = (type === 'kahikatea');   // the swamp-forest disturbance coloniser — ages out without renewal
    this._kahiAge = 0;                           // sim-time since this stand last saw fresh river disturbance
    this._senescent = false;                     // an aged-out kahikatea: inert, does not regrow, culled next morph
    this.dormant = false;
    this.dormantTimer = 0;
    this.regrowthTimer = 0;
    this.growth = 1.0;
    this.seasonalModifier = 1.0;
    this.plantTypeModifier = 1.0;
    this.effectiveModifier = 1.0;   // combined biome + type, drives sprite state
    
    this.isSpawned = false;
    this.parentPlaceable = null;
    this.favouredSpecies = null;   // set by a placeable that plants a species-specific resource
    this.suppressed = false;       // true when a forest tree is outside the contracted forest band

    // Glacial-onset death animation (see update() die-back + _renderSprite). A canopy tree the
    // contracting forest band has pushed onto unsuitable ground FALLS OVER and fades away rather
    // than shrinking in place. _toppling arms it, _toppleStart anchors the fall to the REAL clock
    // (so it plays smoothly in render() regardless of the strided update batch), _toppleDir is the
    // random side it topples toward. It still ends as invisible rootstock (growth 0) and regrows
    // upright when suitable habitat returns, so the ecology is unchanged — only the visual differs.
    this._toppling = false;
    this._toppleStart = 0;
    this._toppleDir = 1;
    
    // Pre-calculate visual variation
    this.visualOffset = random(-1, 1);
    this.swayPhase = random(TWO_PI);
    // Stable index into a plant's mature-size variants (see _renderSprite).
    // Assigned once so a tree keeps the same variant for its whole life; taken
    // modulo the loaded variant count at render, so it survives an art swap.
    this._spriteVariant = Math.floor(random(1024));
    
    // Track sprite state to avoid recalculating
    this._lastSpriteState = 'mature';
  }
  
  update(seasonManager, dt = 1, warp = 0, kahiBoost = 1) {
    if (this._senescent) return;                 // an aged-out kahikatea is inert until the next morph cull removes it
    // FOREST-boost lifecycle accelerator, kahikatea only (set by Simulation.updatePlantsBatched from
    // the held FOREST button). >1 speeds up whatever this kahikatea is DOING — growing, aging toward
    // senescence, or senescing/shrinking — instead of the button force-growing it (the button skips
    // kahikatea in _growPulse). 1 for every other plant and when no boost is held.
    const accel = (this._kahikatea && kahiBoost > 1) ? kahiBoost : 1;
    if (this.isSpawned && this.parentPlaceable) {
      if (!this.parentPlaceable.alive) {
        this.alive = false;
        return;
      }
      this.seasonalModifier = 1.2;
      this.plantTypeModifier = 1.0;
      this.handleGrowth(warp, accel);
      return;
    }
    
    // Forest contraction: canopy trees outside the (seasonally shrinking) forest
    // band stand on habitat the climate no longer supports. O(1) per plant against a
    // per-frame lerped band — no biome reclassification, so no stutter.
    //
    // KAHIKATEA IS EXEMPT. It is a wetland/riparian tree whose distribution is governed by
    // RIVER DISTURBANCE (the wetland biome + disturbanceRecruit senescence/recruitment), NOT by
    // the montane elevation band. Its wetland reaches down to the river mouth (elevation well
    // below band.min, ~0.14 even in the interglacial), so applying band contraction to it as
    // well made TWO systems fight over the same tree: the disturbance model recruits and warps a
    // kahikatea up while band contraction suppresses and dies it BACK — the reported "a wetland
    // kahikatea sprouts up while a force simultaneously shrinks it". One habitat model per tree:
    // kahikatea answers to the river, so it is left out of the band here (like beech's COLD_REFUGE
    // exemption). It stays a _forestTree for the fast recovery-growth rate; only the band
    // SUPPRESSION is skipped. Its climate response is the wetland seasonal modifier + senescence.
    if (typeof LEVEL_MECHANICS !== 'undefined' && LEVEL_MECHANICS.forestContraction
        && this._forestTree && !this._coldRefuge && !this._kahikatea) {
      const band = seasonManager.getForestBand();
      if (band && (this.elevation < band.min || this.elevation > band.max)) {
        this.suppressed = true;
        this.dormant = false;
        this.nutrition = 0;
        // HABITAT DEATH, not mere wilting. A canopy tree the glacial has pushed out
        // of the forest band dies BACK — it loses size until it disappears — so the
        // forest visibly RETREATS to open ground rather than standing as a field of
        // wilted sprites. It persists in place as unseen rootstock (still alive, not
        // culled) and regrows where it stood when the band climbs back over it in the
        // interglacial, so the retreat is reversible with the climate and never needs
        // re-dispersal (kiosk-safe). This is the "unsuitable habitat removes cover"
        // lesson — distinct from browsing, which only prunes.
        if (LEVEL_MECHANICS.forestDieback) {
          if (LEVEL_MECHANICS.forestDiebackFall !== false) {
            // FALL OVER AND FADE (the default). The tree keeps its full size while it topples —
            // the animation is drawn in _renderSprite off the REAL clock (millis), so it plays
            // smoothly whatever the deep-time pace or plant-batch stride. update() only ARMS it
            // and, once the fall has fully played out, drops it to rootstock (growth 0). The end
            // state is identical to the old shrink; only the transition is a fall, not a shrink.
            const fallMs = LEVEL_MECHANICS.forestDiebackFallMs ?? 800;
            const now = (typeof millis === 'function') ? millis() : 0;
            if (!this._toppling) {
              if (this.growth > 0.05) {
                this._toppling = true;
                this._toppleStart = now;
                this._toppleDir = random() < 0.5 ? -1 : 1;
              } else {
                this.growth = 0;                          // already a stub — just become rootstock
              }
            } else if (now - this._toppleStart >= fallMs) {
              this.growth = 0;                            // the fall has finished — hold as invisible rootstock
            }
          } else {
            // Legacy shrink-in-place (set forestDiebackFall:false to restore). Knob: forestDiebackRate.
            this.growth -= (LEVEL_MECHANICS.forestDiebackRate ?? 0.045);
            if (this.growth < 0) this.growth = 0;
          }
        }
        return;
      }
      this.suppressed = false;
      // Suitable habitat has returned over this tree — cancel any fall so it stands back up
      // and regrows upright in place (handleGrowth climbs it from the rootstock growth).
      if (this._toppling) { this._toppling = false; this._toppleStart = 0; }
    }

    const newModifier = seasonManager.getPlantModifier(this.biomeKey);
    if (Math.abs(newModifier - this.seasonalModifier) > 0.01) {
      this.seasonalModifier = newModifier;
    }

    // Get plant-type specific modifier (for patotara berries, etc.)
    this.plantTypeModifier = seasonManager.getPlantTypeModifier(this.type);

    // Combined modifier drives sprite state selection so species within the
    // same biome show different visual states during glacials. Clamped so the
    // thriving threshold (>1.1) is reachable for cold-hardy types even when
    // the biome modifier is depressed.
    this.effectiveModifier = this.seasonalModifier * this.plantTypeModifier;

    this.checkDormancy(seasonManager);
    
    if (this.dormant) {
      this.handleDormancy(seasonManager);
      return;
    }

    // Kahikatea AGES OUT without fresh river disturbance (wetland doc §4.1) — it is a coloniser of raw
    // alluvium, not a climax tree. A warp (a storm flood or an eruption's sediment pulse laying new wet
    // ground) rejuvenates the site and resets the clock; otherwise the stand senesces — it wilts back
    // and, past the wilt, dies WITHOUT regrowing (culled next morph). This couples the swamp forest to
    // the moving river: disturb the river and kahikatea colonises; leave it static and the stand fades.
    if (this._kahikatea) {
      if (warp > 0) {
        this._kahiAge = 0;
      } else {
        const KM = (typeof LEVEL_MECHANICS !== 'undefined') ? LEVEL_MECHANICS : null;
        this._kahiAge += dt * accel;                               // FOREST boost ages the stand faster toward senescence
        if (this._kahiAge > ((KM && KM.kahiMaxAge) || 900)) {
          this.growth -= ((KM && KM.kahiSenesceRate) || 0.02) * accel;   // senescing — boost wilts it back FASTER, not slower
          if (this.growth <= 0.05) { this.alive = false; this._senescent = true; this.nutrition = 0; }
          else this.nutrition = this.maxNutrition * this.growth * 0.5;
          return;                                                   // skip normal growth while senescing
        }
      }
    }

    this.handleGrowth(warp, accel);
  }

  checkDormancy(seasonManager) {
    if (this.dormant || !this.alive) return;

    // The interglacial (warmest phase) has no dormancy — plants stay in leaf.
    if (seasonManager.currentKey === 'interglacial') return;

    if (seasonManager.shouldPlantBeDormant(this.elevation, this.biomeKey)) {
      // Cold-tolerant species (tussock 1.0, matagouri 0.95) resist dormancy;
      // sensitive ones (fern 0.1, kawakawa 0.15) succumb easily. The base
      // dormancy chance from the phase is scaled by (1 - coldTolerance), so a
      // tussock at coldTolerance 1.0 multiplies the chance by 0, never going
      // dormant from cold alone.
      const baseDormancyChance = seasonManager.getDormancyChance();
      const speciesChance = baseDormancyChance * (1 - this.coldTolerance);

      if (seasonManager.justChanged && random() < speciesChance) {
        this.goDormant();
      } else if (this.effectiveModifier < 0.2 && this.growth > 0.5 && random() < 0.008 * (1 - this.coldTolerance)) {
        this.goDormant();
      }
    }
  }
  
  goDormant() {
    this.dormant = true;
    this.dormantTimer = 0;
    this.growth = this.growth * 0.3;
    if (this.growth < 0.1) this.growth = 0.1;
  }
  
  handleDormancy(seasonManager) {
    this.dormantTimer++;
    
    const shouldBeDormant = seasonManager.shouldPlantBeDormant(this.elevation, this.biomeKey);
    
    if (!shouldBeDormant && this.seasonalModifier > 0.5) {
      if (random() < 0.02) {
        this.dormant = false;
        this.growth = 0.2;
      }
    }
    
    this.nutrition = 0;
  }
  
  // accel (>1) is the kahikatea FOREST-boost lifecycle multiplier (see update()): it speeds a
  // GROWING kahikatea's recovery in step with the faster aging/senescence, so the button hurries
  // the stand through its process. 1 for every other plant and when no boost is held.
  handleGrowth(warp = 0, accel = 1) {
    const typeModifier = this.plantTypeModifier || 1.0;
    // Disturbance warp (PLAN_V3 §9): a storm/eruption aftermath accelerates LOCAL recovery so the
    // regrowth reads as a visible ~2 s beat rather than an instant snap. 0 = undisturbed (normal
    // rate); it decays back to 0 on real time in Simulation.updateDisturbance. Knob: warpRecoverBoost.
    const warpBoost = (warp > 0)
      ? 1 + warp * ((typeof LEVEL_MECHANICS !== 'undefined' && LEVEL_MECHANICS.warpRecoverBoost) || 6)
      : 1;

    if (!this.alive) {
      const regrowthRate = this.seasonalModifier;
      this.regrowthTimer += regrowthRate * warpBoost * accel;

      const divisor = this.seasonalModifier > 0.3 ? this.seasonalModifier : 0.3;
      this.growthTime = this.baseGrowthTime / divisor;

      if (this.regrowthTimer >= this.growthTime) {
        this.alive = true;
        this.growth = 0.3;
        this.regrowthTimer = 0;
      }
    } else if (this.growth < 1.0) {
      // Canopy trees regrow FAST (forestRecoverRate) so an interglacial forest sprouts
      // back within a cycle after the glacial cut it back, and kererū-established
      // saplings fill in at a readable pace. Other plants keep the slow ambient rate.
      // Gated on forestDieback so turning the die-back off restores the old behaviour.
      const fastForest = this._forestTree && typeof LEVEL_MECHANICS !== 'undefined'
                         && LEVEL_MECHANICS.forestDieback;
      const baseRate = fastForest ? (LEVEL_MECHANICS.forestRecoverRate ?? 0.02) : 0.002;
      const growthRate = baseRate * this.seasonalModifier;
      this.growth += growthRate * warpBoost * accel;
      if (this.growth > 1.0) this.growth = 1.0;
      this.nutrition = this.maxNutrition * this.growth * this.seasonalModifier * typeModifier;
    } else {
      this.nutrition = this.maxNutrition * this.seasonalModifier * typeModifier;
    }
    
    this.maxNutrition = this.baseNutrition * this.seasonalModifier;
  }
  
  // BROWSING PRUNES; IT NEVER CLEARS. A grazer's bite takes a slice of the plant's
  // foliage: the plant gets visibly smaller (growth drops by a bite, down to a stub
  // it cannot be cropped past) and yields food in proportion to the biomass removed,
  // then it regrows in place via handleGrowth. A plant is NEVER pulled from the world
  // by a bite — only unsuitable HABITAT removes cover (see update(): forest die-back).
  // Two visibly different fates teach the two ideas: herbivory crops the bush, the
  // climate and ground decide where the forest can live. Knobs: browseBite/browseFloor.
  consume() {
    if (this.dormant || !this.alive || this.growth <= 0) return 0;

    const M = (typeof LEVEL_MECHANICS !== 'undefined') ? LEVEL_MECHANICS : null;
    const biteMax = (M && M.browseBite  != null) ? M.browseBite  : 0.3;
    const floor   = (M && M.browseFloor != null) ? M.browseFloor : 0.3;

    // Available biomass for this bite: what sits above the un-croppable stub.
    const bite = Math.min(biteMax, this.growth - floor);
    if (bite <= 0) return 0;                        // already cropped to the stub — nothing to take

    const typeMod = this.plantTypeModifier || 1.0;
    const gained = this.maxNutrition * bite * typeMod;    // food gained = the foliage removed

    this.growth -= bite;
    // Nutrition tracks the new, smaller size; handleGrowth refills it as the plant regrows.
    this.nutrition = this.maxNutrition * this.growth * typeMod;
    return gained;
  }
  
  // ============================================
  // SPRITE STATE DETERMINATION
  // ============================================
  
  _getSpriteState(sprites) {
    // Size-only plants (tōtara) have no seasonal state art: they never switch to a
    // Dormant/Wilting/Thriving/Mature frame. They play their growth sequence while
    // immature, then hold their assigned size variant (via the 'mature' path in
    // _renderSprite). No sprite-switching on dormancy, wilt, thrive or suppression.
    if (sprites && sprites.meta && sprites.meta.sizeOnly) {
      if (this.growth < 1.0 && sprites.growing && sprites.growing.length) {
        return 'growing';
      }
      return 'mature';
    }

    // Trees suppressed by forest contraction show as wilted
    if (this.suppressed) {
      return 'wilting';
    }
    // Dormant plants use wilting sprite
    if (this.dormant) {
      return 'dormant';
    }

    // effectiveModifier combines the biome modifier (same for all plants in a
    // zone) with the per-species type modifier, so a glacial podocarp forest
    // can show fern wilting, beech holding mature, and tussock thriving — all
    // in adjacent cells.
    const eff = this.effectiveModifier;

    if (eff < 0.5) {
      return 'wilting';
    }

    // Immature plants play their growth sequence, where one exists. Checked
    // after the distress states so wilting/dormancy still reads through.
    if (this.growth < 1.0 && sprites && sprites.growing && sprites.growing.length) {
      return 'growing';
    }

    if (eff > 1.1 && this.growth > 0.7) {
      return 'thriving';
    }

    return 'mature';
  }

  // Picks the growth frame for the current progress. growth runs 0..1, so with
  // four frames each covers a quarter of the plant's development.
  _getGrowingFrame(frames) {
    const i = Math.floor(this.growth * frames.length);
    const clamped = i < 0 ? 0 : (i >= frames.length ? frames.length - 1 : i);
    return frames[clamped];
  }
  
  // Sway amplitude modifier. Normally the seasonal modifier; while a storm blows it
  // is boosted (game._stormSway ramps 0→1 over the storm) so the canopy whips in the
  // wind — the visible half of the storm, paired with the gradual damage.
  _swayMod() {
    let mod = this.seasonalModifier;
    const ss = (typeof game !== 'undefined' && game && game._stormSway) ? game._stormSway : 0;
    if (ss > 0) mod *= 1 + ss * ((typeof STORMFX !== 'undefined' && STORMFX.swayBoost != null) ? STORMFX.swayBoost : 2.4);
    return mod;
  }

  // Glacial-onset fall progress, 0..1, or -1 when the tree isn't toppling. Driven by the
  // REAL clock (millis, set when update() armed the fall) so the animation is smooth every
  // frame regardless of the strided plant-update batch. _renderSprite reads it to rotate the
  // tree over onto its side and fade it out. Clamped 0..1.
  _toppleProgress() {
    if (!this._toppling) return -1;
    const dur = (typeof LEVEL_MECHANICS !== 'undefined' && LEVEL_MECHANICS.forestDiebackFallMs) || 800;
    const now = (typeof millis === 'function') ? millis() : 0;
    const p = (now - this._toppleStart) / dur;
    return p < 0 ? 0 : (p > 1 ? 1 : p);
  }

  // ============================================
  // MAIN RENDER METHOD
  // ============================================

  render() {
    if (!this.alive && !this.dormant) return;
    
    const px = this.pos.x;
    // Sit on the 3/4 ground (rides terrain relief via the cached spawn
    // elevation). Everything below keys off py, so this one projection stands
    // base-anchored trees up on the lifted ground, undistorted (§5).
    const py = Projection.groundY(this.pos.y, this.elevation);
    const dormant = this.dormant;
    const dormantMult = dormant ? 0.5 : 1;
    const displaySize = this.size * this.growth * dormantMult;
    
    if (displaySize < 2) return;
    
    // Route to appropriate rendering method
    if (this.typeId === PLANT_TYPE_ID.kawakawa) {
      this._renderKawakawa(px, py, displaySize, dormant);
    } else if (this.usesSprites && PLANT_SPRITES && PLANT_SPRITES[this.type]) {
      this._renderSprite(px, py, displaySize, dormant);
    } else {
      this._renderGenericPlant(px, py, displaySize, dormant);
    }
  }
  
  // ============================================
  // SPRITE RENDERING (No tint - fast!)
  // ============================================
  
  _renderSprite(px, py, displaySize, dormant) {
    const sprites = PLANT_SPRITES[this.type];
    const spriteState = this._getSpriteState(sprites);

    let sprite = sprites ? sprites[spriteState] : null;
    if (spriteState === 'growing') {
      // Variant-grown plants (tussock/coprosma/dracophyllum) grow in their OWN
      // assigned variant, so a growing clump matches the mature one it becomes and the
      // spread stays visible during regrowth — not every sapling stuck on variant 0.
      // Falls back to the growth-frame sequence for real Growing_ art (tōtara/flax).
      if (sprites.meta && sprites.meta.growFromVariant && sprites.variants && sprites.variants.length) {
        sprite = sprites.variants[this._spriteVariant % sprites.variants.length];
      } else {
        sprite = this._getGrowingFrame(sprites.growing);
      }
    } else if ((spriteState === 'mature' || spriteState === 'thriving') &&
               sprites && sprites.variants && sprites.variants.length) {
      // A grown, healthy plant shows its assigned size variant instead of the
      // shared Mature/Thriving frame. Falls through to that frame if the chosen
      // variant hasn't loaded.
      const v = sprites.variants[this._spriteVariant % sprites.variants.length];
      if (v && v.width) sprite = v;
    }

    if (!sprite || !sprite.width) {
      this._renderGenericPlant(px, py, displaySize, dormant);
      return;
    }

    // Climate-affinity authoring tint (warm=amber, cold=blue; see ClimateAffinity /
    // TintBaker in TeManawa_entity_sprites.js). Off on the wall; when on, swap the chosen
    // frame for a BAKED tinted copy — no per-frame tint(). Affinity is fixed by plant type,
    // so classify once and cache on the instance (null = neutral → never tinted).
    if (typeof CONFIG !== 'undefined' && CONFIG.showClimateAffinity && typeof ClimateAffinity !== 'undefined') {
      if (this._climateTint === undefined) this._climateTint = ClimateAffinity.tintFor(ClimateAffinity.ofPlantType(this.type));
      if (this._climateTint) sprite = TintBaker.get(sprite, this._climateTint);
    }

    const meta = (sprites && sprites.meta) || null;
    const anchorBase = meta ? meta.anchor === 'base' : false;
    const setScale = meta ? meta.scale : 1.0;

    // Glacial-onset fall (see update() die-back). -1 = standing normally; 0..1 = toppling.
    const tprog = this._toppleProgress();

    // Shadow - draw directly without transform. It stays flat on the ground and fades out
    // with the falling tree (a felled trunk casts less and less shadow as it goes over).
    if (CONFIG.drawShadows) {
      const shA = (dormant ? 10 : 20) * (tprog >= 0 ? (1 - tprog) : 1);
      if (shA > 0.5) {
        noStroke();
        fill(0, 0, 0, shA);
        ellipse(px + 1, py + 1, displaySize * 1.2, displaySize * 0.6);
      }
    }

    // Footprint width. Where a dedicated growth sequence exists the artwork
    // already carries the size progression, so compounding it with `growth`
    // shrinks saplings to a few pixels — ease over a narrower range instead.
    let spriteSize;
    if (spriteState === 'growing' && meta && meta.fixedGrowthSize) {
      // Fixed-footprint growth (nīkau): the Grow frames' ARTWORK carries the size
      // progression, so hold the footprint at adult width the whole way — no scale-up.
      spriteSize = this.size * (dormant ? 0.5 : 1);
    } else if (spriteState === 'growing') {
      spriteSize = this.size * (0.55 + 0.45 * this.growth) * (dormant ? 0.5 : 1);
    } else if (this.growth < 0.5) {
      spriteSize = displaySize * (0.5 + this.growth);
    } else {
      spriteSize = displaySize;
    }
    spriteSize *= setScale;

    // Preserve the artwork's aspect ratio: width drives the footprint, height
    // follows. Square art is unaffected (drawH === drawW, as before).
    const drawW = spriteSize;
    const drawH = spriteSize * (sprite.height / sprite.width);
    const halfW = drawW * 0.5;

    // 'base' art stands on the ground point; centred art straddles it.
    const offsetY = anchorBase ? -drawH : -drawH * 0.5;

    // TOPPLING — the tree falls over and fades away (glacial-onset habitat death). It pivots
    // about the ground point (px,py) like a felled trunk, swinging from upright to nearly flat,
    // and fades out near the end. Fade via drawingContext.globalAlpha (NOT per-frame tint — that
    // rebakes the tint cache each frame and stutters; see memory per-frame-tint-stutter); push()
    // saved the alpha and pop() restores it. Drawn instead of the normal sway/direct path.
    if (tprog >= 0) {
      const ease = tprog * tprog * Math.sqrt(tprog);          // ~tprog^2.5 — slow start, accelerating fall
      const angle = this._toppleDir * 1.45 * ease;            // upright → ~83° over onto its side
      push();
      translate(px, py);
      rotate(angle);
      drawingContext.globalAlpha = Math.max(0, 1 - tprog * tprog * tprog);   // opaque through the fall, fades at the end
      image(sprite, -halfW, offsetY, drawW, drawH);
      pop();
      return;
    }

    // Only use push/pop if we need rotation (sway). The storm boost lifts _swayMod
    // above the threshold even for low-modifier plants, so the whole canopy whips.
    const swayMod = this._swayMod();
    if (!dormant && swayMod > 0.1) {
      const sway = PlantStatics.getSway(frameCount, this.swayPhase, swayMod);
      push();
      translate(px, py);
      rotate(sway);
      image(sprite, -halfW, offsetY, drawW, drawH);
      pop();
    } else {
      // No rotation needed - direct draw (faster)
      image(sprite, px - halfW, py + offsetY, drawW, drawH);
    }

    // Dormant indicator
    if (dormant) {
      this._drawDormantIndicator(px, py + offsetY - 4);
    }
  }
  
  // ============================================
  // KAWAKAWA RENDERING (Pre-rendered buffer)
  // ============================================
  
  _renderKawakawa(px, py, displaySize, dormant) {
    let buffer = dormant ? PlantStatics.kawakawaBufferDormant : PlantStatics.kawakawaBuffer;

    // Climate-affinity authoring tint — same baked path as the sprite plants above.
    if (typeof CONFIG !== 'undefined' && CONFIG.showClimateAffinity && typeof ClimateAffinity !== 'undefined') {
      if (this._climateTint === undefined) this._climateTint = ClimateAffinity.tintFor(ClimateAffinity.ofPlantType(this.type));
      if (this._climateTint) buffer = TintBaker.get(buffer, this._climateTint);
    }

    // Shadow
    if (CONFIG.drawShadows) {
      noStroke();
      fill(0, 0, 0, dormant ? 10 : 20);
      ellipse(px + 1, py + 1, displaySize * 1.2, displaySize * 0.6);
    }

    const halfSize = displaySize * 0.5;
    
    // Only use push/pop if we need rotation (sway)
    const swayMod = this._swayMod();
    if (!dormant && swayMod > 0.1) {
      const sway = PlantStatics.getSway(frameCount, this.swayPhase, swayMod);
      push();
      translate(px, py);
      rotate(sway);
      image(buffer, -halfSize, -halfSize, displaySize, displaySize);
      pop();
    } else {
      // No rotation needed - direct draw (faster)
      image(buffer, px - halfSize, py - halfSize, displaySize, displaySize);
    }
    
    // Dormant indicator
    if (dormant) {
      this._drawDormantIndicator(px, py - displaySize * 0.5);
    }
  }
  
  // ============================================
  // GENERIC FALLBACK (simple circle plant)
  // ============================================
  
  _renderGenericPlant(px, py, displaySize, dormant) {
    const alpha = dormant ? 150 : 255;
    let r, g, b;
    if (dormant) {
      r = this.baseR * 0.5 + 80;
      g = this.baseG * 0.5 + 70;
      b = this.baseB * 0.5 + 50;
    } else {
      r = this.baseR;
      g = this.baseG;
      b = this.baseB;
    }
    noStroke();
    if (CONFIG.drawShadows) {
      fill(0, 0, 0, dormant ? 10 : 20);
      ellipse(px + 1, py + 1, displaySize * 1.2, displaySize * 0.6);
    }
    fill(r, g, b, alpha);
    ellipse(px, py, displaySize, displaySize * 0.9);
    fill(r + 30, g + 30, b + 20, alpha * 0.5);
    ellipse(px - displaySize * 0.15, py - displaySize * 0.15, displaySize * 0.4, displaySize * 0.35);
    fill(r - 30, g - 25, b - 20, alpha * 0.6);
    ellipse(px + displaySize * 0.05, py + displaySize * 0.05, displaySize * 0.5, displaySize * 0.45);
    if (dormant) {
      this._drawDormantIndicator(px, py - displaySize * 0.6);
    }
  }
  
  // ============================================
  // DORMANT INDICATOR 
  // ============================================
  
  _drawDormantIndicator(x, y) {
    stroke(160, 160, 160, 180);
    strokeWeight(0.8);
    const s = 3;
    line(x - s, y, x + s, y);
    line(x, y - s, x, y + s);
    line(x - s * 0.7, y - s * 0.7, x + s * 0.7, y + s * 0.7);
    line(x - s * 0.7, y + s * 0.7, x + s * 0.7, y - s * 0.7);
  }
}