// ============================================================
// KERERŪ — the large-seed disperser
// ------------------------------------------------------------
// Hemiphaga novaeseelandiae. The only bird large enough to swallow and pass big
// podocarp/tawa fruit, so the FOREST only recruits where kererū go
// (md/TEMANAWA_ECOLOGY_FAUNA.md §3.3; moa were seed *destroyers*, not dispersers).
// The cast reference is md/TEMANAWA_FAUNA_IMPL.md.
//
// A flyer, like the eagle, but a different animal to watch: it makes SHORT flights
// between trees and PERCHES a great deal — to feed, to digest when full, and to lay.
// The behaviour is a frugivore loop, not the eagle's hunt loop:
//
//   FLYING (hungry) → find a fruiting forest tree, short hop to it
//        → FEEDING (perched) → fill its crop with fruit (the tree is NOT consumed —
//          a kererū eats fruit, it doesn't browse the plant)
//        → PERCHED (digest a beat, maybe lay an egg)
//        → FLYING (full) → short hops away from the source, DROPPING a seed on each
//          (Simulation.disperseSeed plants a forest seedling — cap-guarded, the only
//          runtime path that grows the plant population) → perch between hops
//        → when the crop is empty it is hungry again → back to FLYING (hungry).
//
// So dispersal is *earned by eating*, and it happens AWAY from the parent tree —
// the ecological point. Reproduction is emergent and sexual, mirroring the eagle:
// a mature, well-fed female with a mate nearby lays a kererū egg (offspringType
// 'kereru'; Simulation._hatchKereruEgg). Numbers ebb with the forest — abundant in
// the interglacial when fruiting trees are everywhere, thinning in the glacial when
// the forest contracts and the birds cannot feed (a population floor prevents a
// stuck, un-recruitable forest). A storm grounds them, so dispersal pauses; overuse
// of STORM keeps them grounded and the scene desaturates via the recruitment term
// of habitat health (Game._recruitment). See md/TEMANAWA_INTERACTION_HEALTH_PLAN.md §3.
//
// Placeholder art (a drawn glyph — green-grey back, pale breast, wings folded when
// perched); the 5-frame flight sprite + perched frame (BUILD_V3 §4 / SPRITE_BRIEF)
// drop in later via EntitySprites.
// ============================================================

const KERERU_STATE = {
  FLYING:  'flying',      // in the air — hopping to a tree (hungry) or dispersing (full)
  FEEDING: 'feeding',     // perched at a fruiting tree, filling the crop
  PERCHED: 'perched',     // perched — digesting, resting between hops, or laying
  SHELTER: 'sheltering'   // storm-grounded: hunkered low, no feeding/dispersal/laying
};

const KERERU_SPECIES = {
  displayName:    'Kererū',
  scientificName: 'Hemiphaga novaeseelandiae',
  description:    'The forest pigeon — the only bird that disperses large podocarp and tawa fruit.',
  rarity:         'common',

  // Movement / render
  baseSpeed:        .6,
  maxForce:         0.06,
  size:             6,
  perceptionRadius: 60,
  cruiseAlt:        24,     // flight height above the 3/4 ground, px (shadow sells the height)
  perchAlt:         8,      // sits low on the canopy when perched

  // Flight character — SHORT legs. The eagle patrols wide circles and relocates
  // across the whole map; the kererū only ever hops to the next tree.
  hopRadius:        50,    // length of a dispersal hop
  feedRadius:       100,    // how far it will look for a fruiting tree

  // Frugivore crop / dispersal (all times in seconds; the class converts to frames)
  cropCapacity:     1,      // fruit carried per full crop → it stops carrying quickly
                            // after feeding (one drop, then it feeds again)
  feedSec:          5,      // perched feeding time to fill the crop
  disperseEverySec: 20,      // cadence of seed drops while carrying (LIFE clock → fast-forward fills in)
  restSec:          8,      // perched digest/rest between hops (this is why it perches so much)

  // Survival — abundant in the forested interglacial, thin in the glacial.
  // Feeding relieves hunger; a bird that cannot find fruiting forest slowly starves.
  maxHunger:        100,
  hungerRatePerSec: 1.2,    // ≈ per second of life clock (feeding pays it back)
  feedRelief:       70,     // hunger removed by a full feed
  starveSec:        18,     // sustained max-hunger before death (life clock)

  // Reproduction — sexual, emergent (mirrors the eagle). A mature, well-fed
  // (carrying fruit) female with a mate nearby lays.
  maturitySec:      20,
  eggCooldownSec:   35,
  mateRadius:       200,
  reproCheckSec:    3.5
};

class Kereru extends Boid {
  constructor(x, y, terrain, config, speciesData) {
    super(x, y, terrain);
    this.config = config || {};
    this.speciesData = speciesData || null;
    const sp = (speciesData && speciesData.config) ? speciesData.config : KERERU_SPECIES;
    this.speciesKey = (speciesData && speciesData.key) || 'kereru';

    this.alive = true;
    this.maxSpeed = sp.baseSpeed || 1.4;
    this.maxForce = sp.maxForce || 0.06;
    this.size = sp.size || 12;
    this.perceptionRadius = sp.perceptionRadius || 60;
    this.perceptionRadiusSq = this.perceptionRadius * this.perceptionRadius;
    // A pigeon steers loosely and banks fairly fast between its short hops.
    this._turnMax = 0.20;
    this._turnEase = 0.14;
    this.animTime = random(1000);

    // Altitudes (eased in update so take-off/landing never pops)
    this._cruiseAlt = sp.cruiseAlt ?? 24;
    this._perchAlt  = sp.perchAlt ?? 5;
    this._altitude  = this._cruiseAlt;

    // Flight legs
    this._hopRadius  = sp.hopRadius ?? 120;
    this._feedRadius = sp.feedRadius ?? 170;

    // Crop / dispersal (seconds → frames on the sim clock)
    const F = 60;
    this._cropCapacity   = sp.cropCapacity ?? 3;
    this._feedFrames     = (sp.feedSec ?? 5) * F;
    this._disperseFrames = (sp.disperseEverySec ?? 5) * F;
    this._restFrames     = (sp.restSec ?? 4) * F;
    this.crop = 0;                                   // fruit currently carried (seeds to drop)

    // Survival
    this.maxHunger   = sp.maxHunger ?? 100;
    this.hunger      = random(10, 30);
    this.hungerRate  = (sp.hungerRatePerSec ?? 1.2) / F;
    this._feedRelief = sp.feedRelief ?? 70;
    this._starveFrames = (sp.starveSec ?? 18) * F;
    this._starveTimer = 0;

    // Reproduction
    this.isFemale = random() < 0.5;
    this.age = 0;
    this.mature = true;                              // spawned founders are already adults
    this._maturityFrames = (sp.maturitySec ?? 20) * F;
    this._eggCooldownFrames = (sp.eggCooldownSec ?? 35) * F;
    this._eggCooldown = random(0, this._eggCooldownFrames);
    this._mateRadius = sp.mateRadius ?? 200;
    this._reproCheckFrames = (sp.reproCheckSec ?? 3.5) * F;
    this._reproCheckTimer = random(0, this._reproCheckFrames);

    // State machine
    this.state = KERERU_STATE.FLYING;
    this._targetTree = null;                         // the plant being fed at / flown to
    this._treeSearchTimer = 0;                       // throttles the food search
    this._feedTimer = 0;
    this._restTimer = 0;
    this._disperseTimer = random(this._disperseFrames);
    this._hopActive = false;
    this._grounded = false;

    // Reusable vectors (never allocate in behave/update/render — CLAUDE.md)
    this._target = createVector(x, y);              // current fly-to point (tree or hop)
  }

  // ============================================================
  // LIFE CLOCK (warped dt): the frugivore loop, aging, breeding, survival.
  // ============================================================
  behave(sim, seasonManager, dt) {
    // A storm grounds the bird (it shelters): either an ACTIVE storm window, or sustained
    // storm OVERUSE (g._stormOveruse — pressure above the line keeps the flock grounded BETWEEN
    // storms too). While grounded it does nothing but hunker — no feeding, dispersal or laying
    // — so overusing STORM stalls recruitment (file header + INTERACTION_HEALTH_PLAN §4).
    const g = (typeof game !== 'undefined') ? game : (sim && sim.game) || null;
    const stormWindow = !!(g && g._tmStormUntil && (typeof millis === 'function') && millis() < g._tmStormUntil);
    this._grounded = !!(g && (stormWindow || g._stormOveruse));
    if (this._grounded) {
      this.state = KERERU_STATE.SHELTER;
      this.maxSpeed = (this.speciesData?.config?.baseSpeed || 1.4) * 0.4;
      this.vel.mult(Math.pow(0.9, dt));              // ease to a low hover
      return;
    }

    // Age → maturity, and hunger (feeding pays it back below).
    this.age += dt;
    if (!this.mature && this.age >= this._maturityFrames) this.mature = true;
    this.hunger = Math.min(this.hunger + this.hungerRate * dt, this.maxHunger);
    if (this._eggCooldown > 0) this._eggCooldown = Math.max(0, this._eggCooldown - dt);

    switch (this.state) {
      case KERERU_STATE.FLYING:  this._flying(sim, dt); break;
      case KERERU_STATE.FEEDING: this._feeding(sim, dt); break;
      case KERERU_STATE.PERCHED: this._perched(sim, dt); break;
      default:                   this.state = KERERU_STATE.FLYING; break;
    }

    // Survival: sustained max-hunger kills, but never below the population floor,
    // so a long glacial thins the flock without ever stranding the forest with no
    // disperser to recruit it back (recruitment keys off kererū being ALIVE).
    if (this.hunger >= this.maxHunger) {
      this._starveTimer += dt;
      if (this._starveTimer >= this._starveFrames) {
        const floor = (typeof LEVEL_MECHANICS !== 'undefined' && LEVEL_MECHANICS.kereruPopulationFloor) ?? 2;
        if (sim.getSpeciesCount && sim.getSpeciesCount('kereru') > floor) {
          this.alive = false;
          if (sim.game) sim.game.addNotification('A kererū is lost as the forest thins.', 'info');
          return;
        }
        this.hunger = this.maxHunger * 0.85;         // protected floor bird — clings on
        this._starveTimer = 0;
      }
    } else if (this._starveTimer > 0) {
      this._starveTimer = Math.max(0, this._starveTimer - dt * 2);
    }

    this.edges();
  }

  // FLYING — hungry (crop == 0): find a fruiting tree and hop to it. Full
  // (crop > 0): hop away from the source, dropping a seed each leg.
  _flying(sim, dt) {
    this.maxSpeed = this.speciesData?.config?.baseSpeed || 1.4;

    if (this.crop <= 0) {
      // --- Seeking food ---------------------------------------------------
      if (!this._treeValid(this._targetTree)) {
        this._treeSearchTimer -= dt;
        if (this._treeSearchTimer <= 0) {
          this._treeSearchTimer = 30;
          this._targetTree = this._findFruitTree(sim);
          if (this._targetTree) this._target.set(this._targetTree.pos.x, this._targetTree.pos.y);
        }
      }
      if (this._treeValid(this._targetTree)) {
        this._target.set(this._targetTree.pos.x, this._targetTree.pos.y);
        const dx = this._target.x - this.pos.x, dy = this._target.y - this.pos.y;
        if (dx * dx + dy * dy < 14 * 14) {           // reached the tree → perch and feed
          this.state = KERERU_STATE.FEEDING;
          this._feedTimer = this._feedFrames;
          return;
        }
        this.applyForce(this.seek(this._target, 1, 24));
      } else {
        // No fruiting forest within reach (a glacial-thinned canopy): drift and
        // let hunger climb. This is the food-driven climate coupling.
        this.applyForce(this.wander(dt));
      }
    } else {
      // --- Full: dispersing away from the source --------------------------
      const dx = this._target.x - this.pos.x, dy = this._target.y - this.pos.y;
      const arrived = dx * dx + dy * dy < 16 * 16;
      this._disperseTimer -= dt;
      if (arrived || this._disperseTimer <= 0) {
        // Drop a seed HERE (away from the parent tree) and perch to digest.
        if (sim.disperseSeed) sim.disperseSeed(this.pos.x, this.pos.y);
        this.crop -= 1;
        this._disperseTimer = this._disperseFrames;
        this.state = KERERU_STATE.PERCHED;
        this._restTimer = this._restFrames;
        return;
      }
      this.applyForce(this.seek(this._target, 1, 20));
    }
  }

  // FEEDING — perched at the tree, filling the crop. The plant is not consumed.
  _feeding(sim, dt) {
    this.maxSpeed = 0.15;
    this.vel.mult(Math.pow(0.8, dt));                // settle onto the perch
    if (!this._treeValid(this._targetTree)) {        // fruit gone / tree died → move on
      this.state = KERERU_STATE.FLYING;
      this._targetTree = null;
      return;
    }
    this._feedTimer -= dt;
    if (this._feedTimer <= 0) {
      this.crop = this._cropCapacity;                // a full crop of fruit
      this.hunger = Math.max(0, this.hunger - this._feedRelief);
      this._targetTree = null;
      this.state = KERERU_STATE.PERCHED;             // rest a beat before dispersing
      this._restTimer = this._restFrames;
    }
  }

  // PERCHED — digesting / resting between hops, and where a ready female lays.
  _perched(sim, dt) {
    this.maxSpeed = 0.15;
    this.vel.mult(Math.pow(0.8, dt));

    // Breeding check (throttled). Perched + carrying fruit = well-fed and settled.
    this._reproCheckTimer -= dt;
    if (this._reproCheckTimer <= 0) {
      this._reproCheckTimer = this._reproCheckFrames;
      this._tryReproduce(sim);
    }

    this._restTimer -= dt;
    if (this._restTimer <= 0) {
      if (this.crop > 0) {
        // Take off on a short hop to disperse the next seed elsewhere.
        this._pickHop();
        this.state = KERERU_STATE.FLYING;
      } else {
        this.state = KERERU_STATE.FLYING;            // hungry again → seek a tree
        this._targetTree = null;
      }
    }
  }

  // Choose a short fly-to point for the next dispersal leg (kept on the map).
  _pickHop() {
    const a = random(TWO_PI), r = random(this._hopRadius * 0.5, this._hopRadius);
    const w = this.terrain.mapWidth, h = this.terrain.mapHeight;
    this._target.set(
      constrain(this.pos.x + Math.cos(a) * r, 8, w - 8),
      constrain(this.pos.y + Math.sin(a) * r, 8, h - 8)
    );
  }

  _treeValid(p) {
    return !!(p && p.alive && !p.dormant && p.growth > 0.4);
  }

  // Nearest fruiting FOREST tree: alive, grown, warm/large-fruited (the types the
  // kererū can actually swallow — coldTolerance ≤ TM_GROW.warmMax, the same set
  // Simulation.disperseSeed recruits). Uses the plant spatial grid.
  _findFruitTree(sim) {
    if (!sim.getNearbyPlants) return null;
    const plants = sim.getNearbyPlants(this.pos.x, this.pos.y, this._feedRadius);
    const warmMax = (typeof TM_GROW !== 'undefined') ? TM_GROW.warmMax : 0.65;
    let best = null, bestSq = Infinity;
    const px = this.pos.x, py = this.pos.y;
    for (let i = 0; i < plants.length; i++) {
      const p = plants[i];
      if (!p.alive || p.dormant || p.growth < 0.5) continue;
      if ((p.coldTolerance ?? 0.5) > warmMax) continue;   // only large-fruited forest
      const dx = p.pos.x - px, dy = p.pos.y - py;
      const dSq = dx * dx + dy * dy;
      if (dSq < bestSq) { bestSq = dSq; best = p; }
    }
    return best;
  }

  // Emergent reproduction: a mature, well-fed (carrying fruit) female that is
  // perched, off cooldown, below the flock cap and with a mature mate nearby lays
  // a kererū egg. Cheap and throttled by the caller.
  _tryReproduce(sim) {
    if (!this.mature || !this.isFemale || this._eggCooldown > 0) return;
    if (this.crop <= 0) return;                             // must be well-fed
    const cap = (typeof LEVEL_MECHANICS !== 'undefined' && LEVEL_MECHANICS.kereruMaxPopulation) ?? 16;
    if (!sim.getSpeciesCount || sim.getSpeciesCount('kereru') >= cap) return;
    if (!this._hasMateNear(sim)) return;

    const egg = sim.addEgg(this.pos.x, this.pos.y);
    egg.offspringType = 'kereru';
    egg.parentSpecies = 'kereru';
    this._eggCooldown = this._eggCooldownFrames;
    this.crop = Math.max(0, this.crop - 1);                 // laying spends a fruit's energy
    if (sim.game) sim.game.addNotification('A kererū nests — an egg is laid.', 'info');
  }

  _hasMateNear(sim) {
    const list = sim.otherEntities && sim.otherEntities.kereru;
    if (!list) return false;
    const rSq = this._mateRadius * this._mateRadius;
    const px = this.pos.x, py = this.pos.y;
    for (let i = 0; i < list.length; i++) {
      const o = list[i];
      if (o === this || !o.alive || !o.mature || o.isFemale === this.isFemale) continue;
      const dx = o.pos.x - px, dy = o.pos.y - py;
      if (dx * dx + dy * dy <= rSq) return true;
    }
    return false;
  }

  // ============================================================
  // MOTION/ANIM CLOCK (real dt): altitude easing + integration.
  // ============================================================
  update(dt = 1) {
    const perched = this.state === KERERU_STATE.FEEDING ||
                    this.state === KERERU_STATE.PERCHED ||
                    this.state === KERERU_STATE.SHELTER;
    const targetAlt = perched ? this._perchAlt : this._cruiseAlt;
    this._altitude += (targetAlt - this._altitude) * Math.min(1, 0.08 * dt);
    super.update(dt);
  }

  render() {
    const s = this.size * (this.mature ? 1 : 0.7);   // juveniles smaller
    const gy = (typeof Projection !== 'undefined' && Projection.groundY)
      ? Projection.groundY(this.pos.y, this.terrain.getElevationAt(this.pos.x, this.pos.y))
      : this.pos.y;
    const alt = this._altitude || 0;
    const perched = this.state === KERERU_STATE.FEEDING ||
                    this.state === KERERU_STATE.PERCHED ||
                    this.state === KERERU_STATE.SHELTER;

    push();
    translate(this.pos.x, gy);
    // Shadow stays on the ground while the body lifts — reads as height at 3/4.
    // Higher bird → smaller, fainter shadow.
    const sf = 1 - Math.min(0.5, alt / 60);
    noStroke();
    fill(0, 0, 0, 26 * sf);
    ellipse(3 * sf, 3 * sf, s * 1.5 * sf, s * 0.55 * sf);
    translate(0, -alt);

    const sprite = (typeof EntitySprites !== 'undefined' && EntitySprites.getKereruSprite)
      ? EntitySprites.getKereruSprite() : null;
    if (sprite) {
      // The art faces up-and-right; mirror horizontally for leftward travel using
      // the eased lateral flip (+1 right, -1 left), passing through 0 edge-on with a
      // small vertical bounce — the same turn-around idiom as the moa.
      const flip = (this._flip !== undefined) ? this._flip : 1;
      const drawW = s * 2.8;
      const drawH = sprite.width > 0 ? drawW * (sprite.height / sprite.width) : drawW;
      noTint();
      imageMode(CENTER);
      scale(flip, 1 + (1 - Math.abs(flip)) * 0.15);
      image(sprite, 0, 0, drawW, drawH);
    } else {
      // Fallback glyph: green-grey back, pale breast, small head. Perched → wings
      // folded (a narrower, rounder body); flying → wings a touch broader.
      const dir = (this._flip >= 0) ? 1 : -1;
      const wing = perched ? 1.45 : 1.75;
      fill(66, 90, 76);
      ellipse(0, 0, s * wing, s * 1.05);                               // body / wings
      fill(236, 239, 233);
      ellipse(dir * s * 0.30, s * 0.22, s * 0.85, s * 0.72);          // white waistcoat
      fill(58, 80, 68);
      ellipse(dir * s * 0.55, -s * 0.30, s * 0.62, s * 0.56);         // head
    }
    pop();

    // Debug-only instrumentation (never in the ambient diorama — CLAUDE.md).
    if (typeof CONFIG !== 'undefined' && CONFIG.showEntityUI) this._renderDebug(gy, s, alt);
  }

  _renderDebug(gy, s, alt) {
    push();
    translate(this.pos.x, gy - alt - s - 4);
    textAlign(CENTER, BOTTOM);
    textSize(6);
    noStroke();
    // carried-fruit pips
    fill(150, 90, 170, 220);
    for (let i = 0; i < this.crop; i++) ellipse((i - (this.crop - 1) * 0.5) * 3, -6, 2, 2);
    // sex / juvenile marker
    fill(200, 200, 200, 150);
    text(!this.mature ? '◆' : (this.isFemale ? '♀' : '♂'), 0, 0);
    pop();
  }
}

if (typeof window !== 'undefined') {
  window.Kereru = Kereru;
  window.KERERU_SPECIES = KERERU_SPECIES;
  window.KERERU_STATE = KERERU_STATE;
}
