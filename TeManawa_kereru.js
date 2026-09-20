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
// 'kereru'; Simulation._hatchFlyerEgg — shared with the kōkako + huia, which
// subclass this file). Numbers ebb with the forest — abundant in
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
  label:          'kererū',   // lower-case, for the notification strip
  description:    'The forest pigeon — the only bird that disperses large podocarp and tawa fruit.',
  rarity:         'common',

  // Movement / render — an unhurried flap between trees (kept BELOW the harrier's
  // hunt speed so a chase resolves rather than the bird outrunning it forever).
  baseSpeed:        0.32,
  maxForce:         0.055,
  size:             7,
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
    this.isFlyer = true;                             // rendered above the ground plane (Simulation.render)
    this._clampToView = true;                        // stay inside the visible screen L/R, not just the map (base Boid.update)
    // Lower-case label for the notification strip ("A kererū is lost…"). Subclasses
    // (kōkako, huia) carry their own; falls back to the species key.
    this._label = sp.label || this.speciesKey;
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
    // Perch VARIETY: each time the bird lands it picks a fresh height up the tree and
    // a small offset off the trunk, so a flock (and a huia pair) doesn't stack on one
    // spot. Chosen on the land transition in update(); rendered as a draw offset.
    this._perchAltCur = this._perchAlt;
    this._perchDX = 0;
    this._perchDY = 0;
    this._wasPerched = false;
    // Last walkable ground the bird stood over — its bolt-hole. If it strays out to
    // sea (map geometry can push a bird over an inland channel or a corner where
    // "inward" leads across water), it beelines straight back here, which is
    // guaranteed land — see behave(). Seeded at the (walkable) spawn point.
    this._lastLand = { x, y };
    this._waterTicks = 0;

    // Flight legs
    this._hopRadius  = sp.hopRadius ?? 120;
    this._feedRadius = sp.feedRadius ?? 170;
    // How far an anchored bird strays from home before it heads back (see
    // _driftHome / _anchorPoint). 0 for the free-ranging kererū.
    this._homeLeash   = sp.homeLeash ?? 0;
    this._homeLeashSq = this._homeLeash * this._homeLeash;

    // Crop / dispersal (seconds → frames on the sim clock)
    const F = 60;
    this._cropCapacity   = sp.cropCapacity ?? 3;
    this._feedFrames     = (sp.feedSec ?? 5) * F;
    this._disperseFrames = (sp.disperseEverySec ?? 5) * F;
    this._restFrames     = (sp.restSec ?? 4) * F;
    // Dispersal effectiveness: probability that a drop actually establishes a
    // seedling. The kererū is THE large-seed disperser (1 = every drop counts);
    // smaller-gaped forest birds (kōkako, huia) set this < 0.5 → >50% fewer seeds.
    this._disperseChance = sp.disperseChance ?? 1;
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
    this._landForce = createVector();               // "stay over land" steer (see _landward)
    this._landPt = { x: 0, y: 0 };                  // scratch for _clampToLand
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

    // Flush from a hunting harrier before anything else — a raptor on the hunt
    // scatters the flock off the canopy, overriding the frugivore loop this tick.
    if (this._fleeHarrier(sim, dt)) return;

    this._runState(sim, dt);

    // Keep to land: a forest bird never crosses open water for long. Near the rim or
    // heading toward water, this nudges the bird back inward before it strands. The
    // HARD backstop (never ending a frame over water) is the land clamp in update().
    this.applyForce(this._landward());

    // Survival: sustained max-hunger kills, but never below the population floor,
    // so a long glacial thins the flock without ever stranding the forest with no
    // disperser to recruit it back (recruitment keys off kererū being ALIVE).
    if (this.hunger >= this.maxHunger) {
      this._starveTimer += dt;
      if (this._starveTimer >= this._starveFrames) {
        const floor = this._populationFloor();
        if (sim.getSpeciesCount && sim.getSpeciesCount(this.speciesKey) > floor) {
          this.alive = false;
          if (sim.game) sim.game.addNotification(`A ${this._label} is lost as the forest thins.`, 'info');
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

  // Away from any hunting harrier within range — returns true when it took over
  // the tick (steered the bird into a short flee). Cheap: only a handful of eagles,
  // and it only bites when one is actually on the hunt nearby.
  _fleeHarrier(sim, dt) {
    if (!sim.getNearbyEagles) return false;
    const R = 110, RSq = R * R;
    const eagles = sim.getNearbyEagles(this.pos.x, this.pos.y, R);
    let ex = 0, ey = 0, threat = false;
    for (let i = 0; i < eagles.length; i++) {
      const e = eagles[i];
      if (!e.isHunting || !e.isHunting()) continue;
      const dx = this.pos.x - e.pos.x, dy = this.pos.y - e.pos.y;
      if (dx * dx + dy * dy < RSq) { ex += dx; ey += dy; threat = true; }
    }
    if (!threat) return false;
    this.state = KERERU_STATE.FLYING;
    this._targetTree = null;
    const base = this.speciesData?.config?.baseSpeed || 0.42;
    // Flee is only a shade faster than cruise, and stays BELOW the harrier's hunt
    // speed so a chase actually resolves instead of the bird outrunning it forever.
    this.maxSpeed = base * ((typeof LEVEL_MECHANICS !== 'undefined' && LEVEL_MECHANICS.flyerFleeMult) ?? 1.15);
    // A short veer away from the threat — NOT a map-crossing dash — and clamped onto
    // land so a fright never flushes the bird out over the ocean.
    const m = Math.hypot(ex, ey) || 1;
    const land = this._clampToLand(this.pos.x + (ex / m) * 60, this.pos.y + (ey / m) * 60);
    this._target.set(land.x, land.y);
    this.applyForce(this.seek(this._target, 1.6));
    this.applyForce(this._landward());   // hard bounce off water even mid-flee
    this.edges();
    return true;
  }

  // A "stay in habitat" steering force — zero while the bird is comfortably over
  // land and away from the rim, otherwise a firm pull back inward. Two triggers:
  //   · WORLD EDGE — there is no food out at the perimeter, so a bird near the rim
  //     is always steered inward. This is what stops a harrier pinning a fleeing
  //     bird against the edge of the screen where it gets stuck.
  //   · WATER — a forest bird never crosses open sea/river for long, so straying
  //     over (or straight toward) water pulls it back to the nearest land.
  _landward() {
    const f = this._landForce; f.set(0, 0);
    const t = this.terrain;
    if (!t || typeof t.isWalkable !== 'function') return f;
    const w = t.mapWidth, h = t.mapHeight, m = 60;
    // Turn back at the VISIBLE screen edge, not the map edge: the cover-fit view runs the map
    // wider than the canvas, so the left/right map edges within CONFIG.viewInsetX sit off-frame
    // (a bird there is valid on the map but not on screen). Inset is 0 when the map letterboxes.
    const ins = (typeof CONFIG !== 'undefined' && CONFIG.viewInsetX) ? CONFIG.viewInsetX : 0;
    const px = this.pos.x, py = this.pos.y;
    const xlo = ins + m, xhi = w - ins - m;

    let ix = 0, iy = 0, edge = false;
    if (px < xlo)    { ix = 1;  edge = true; } else if (px > xhi) { ix = -1; edge = true; }
    if (py < m)      { iy = 1;  edge = true; } else if (py > h - m) { iy = -1; edge = true; }

    const spd = Math.hypot(this.vel.x, this.vel.y);
    const ux = spd > 0.001 ? this.vel.x / spd : 0, uy = spd > 0.001 ? this.vel.y / spd : 0;
    const overWater = !t.isWalkable(px, py);
    const waterAhead = !t.isWalkable(px + ux * 22, py + uy * 22);
    if (!edge && !overWater && !waterAhead) return f;        // clear — no correction

    let gx, gy, have = false;
    const anc = this._anchorPoint && this._anchorPoint();
    if (anc && t.isWalkable(anc.x, anc.y)) { gx = anc.x; gy = anc.y; have = true; }
    if (!have && edge) { gx = px + ix * 140; gy = py + iy * 140; have = true; }   // head straight inward
    if (!have) {
      for (let i = 0; i < 8; i++) {                          // sample a ring for the nearest land
        const a = i * (Math.PI / 4);
        const rx = px + Math.cos(a) * 45, ry = py + Math.sin(a) * 45;
        if (t.isWalkable(rx, ry)) { gx = rx; gy = ry; have = true; break; }
      }
    }
    if (!have) { gx = w * 0.5; gy = h * 0.5; }

    const s = this.seekPoint(gx, gy, overWater ? 2.5 : (edge ? 2.0 : 1.1));
    f.set(s.x, s.y);
    return f;
  }

  // Pull a fly-to point back onto land: if it is over water, step from the target
  // toward the bird until a walkable spot is found (else hold position). Writes and
  // returns the reused _landPt so it never allocates on the steering path.
  _clampToLand(x, y) {
    const t = this.terrain, p = this._landPt;
    if (!t || typeof t.isWalkable !== 'function' || t.isWalkable(x, y)) { p.x = x; p.y = y; return p; }
    const bx = this.pos.x, by = this.pos.y;
    for (let s = 0.75; s > 0; s -= 0.25) {
      const cx = bx + (x - bx) * s, cy = by + (y - by) * s;
      if (t.isWalkable(cx, cy)) { p.x = cx; p.y = cy; return p; }
    }
    p.x = bx; p.y = by; return p;                            // nowhere landward → hold
  }

  // State dispatch — split out so a subclass can add a state (kōkako SINGING)
  // by overriding this and delegating unknown states back to super.
  _runState(sim, dt) {
    switch (this.state) {
      case KERERU_STATE.FLYING:  this._flying(sim, dt); break;
      case KERERU_STATE.FEEDING: this._feeding(sim, dt); break;
      case KERERU_STATE.PERCHED: this._perched(sim, dt); break;
      default:                   this.state = KERERU_STATE.FLYING; break;
    }
  }

  // Flock cap / floor. Read live from the species config first (kōkako, huia carry
  // their own), falling back to the kererū LEVEL_MECHANICS knobs so the kererū is
  // unchanged. Cap: breeding stops at it. Floor: starvation never takes the last few.
  _maxPopulation() {
    const c = this.speciesData && this.speciesData.config;
    if (c && c.maxPopulation != null) return c.maxPopulation;
    return (typeof LEVEL_MECHANICS !== 'undefined' && LEVEL_MECHANICS.kereruMaxPopulation) ?? 16;
  }
  _populationFloor() {
    const c = this.speciesData && this.speciesData.config;
    if (c && c.populationFloor != null) return c.populationFloor;
    return (typeof LEVEL_MECHANICS !== 'undefined' && LEVEL_MECHANICS.kereruPopulationFloor) ?? 2;
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
        // let hunger climb. This is the food-driven climate coupling. An anchored
        // forest bird (kōkako territory, huia mate) drifts back toward home
        // instead, so it holds its patch of forest rather than wandering off.
        this._driftHome(sim, dt);
      }
    } else {
      // --- Full: dispersing away from the source --------------------------
      const dx = this._target.x - this.pos.x, dy = this._target.y - this.pos.y;
      const arrived = dx * dx + dy * dy < 16 * 16;
      this._disperseTimer -= dt;
      if (arrived || this._disperseTimer <= 0) {
        // Drop a seed HERE (away from the parent tree) and perch to digest. The
        // crop is always spent (the bird moved the fruit off the parent) but the
        // seed only ESTABLISHES with probability _disperseChance — how the smaller
        // forest birds disperse >50% less than the kererū (which is always 1).
        if (sim.disperseSeed && random() < this._disperseChance) sim.disperseSeed(this.pos.x, this.pos.y);
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
      // Global diet richness (CONFIG.faunaNutritionScale) applies to flyers too.
      const _relief = this._feedRelief * ((typeof CONFIG !== 'undefined' && CONFIG.faunaNutritionScale) ? CONFIG.faunaNutritionScale : 1);
      this.hunger = Math.max(0, this.hunger - _relief);
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

  // Choose a short fly-to point for the next dispersal leg (kept on the map). The
  // hop is thrown from a point pulled halfway toward the home anchor, so an
  // anchored bird's dispersal loop orbits its patch instead of walking off it; the
  // kererū has no anchor and hops from where it stands (unchanged).
  _pickHop() {
    const anchor = this._anchorPoint();
    let ox = this.pos.x, oy = this.pos.y;
    if (anchor) { ox = (ox + anchor.x) * 0.5; oy = (oy + anchor.y) * 0.5; }
    const a = random(TWO_PI), r = random(this._hopRadius * 0.5, this._hopRadius);
    const w = this.terrain.mapWidth, h = this.terrain.mapHeight;
    const ins = (typeof CONFIG !== 'undefined' && CONFIG.viewInsetX) ? CONFIG.viewInsetX : 0;
    const land = this._clampToLand(                 // never hop out over the water — or off-screen L/R
      constrain(ox + Math.cos(a) * r, ins + 8, w - ins - 8),
      constrain(oy + Math.sin(a) * r, 8, h - 8)
    );
    this._target.set(land.x, land.y);
  }

  // Home anchor for territory/pair fidelity. null = free-ranging (the kererū).
  // Subclasses return a point (kōkako territory, huia mate) — the flying loop
  // drifts and hops around it, keeping the bird on its patch of forest.
  _anchorPoint() { return null; }

  // Drift when no fruit tree is in reach. Base: idle wander (kererū). An anchored
  // bird beyond its leash seeks home; within the leash it wanders locally.
  _driftHome(sim, dt) {
    const anchor = this._anchorPoint();
    if (anchor) {
      const dx = anchor.x - this.pos.x, dy = anchor.y - this.pos.y;
      if (dx * dx + dy * dy > this._homeLeashSq) { this.applyForce(this.seek(anchor, 1, 30)); return; }
    }
    this.applyForce(this.wander(dt));
  }

  _treeValid(p) {
    return !!(p && p.alive && !p._consumed && !p.dormant && p.growth > 0.4);
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
      if (!p.alive || p._consumed || p.dormant || p.growth < 0.5) continue;
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
    if (!sim.getSpeciesCount || sim.getSpeciesCount(this.speciesKey) >= this._maxPopulation()) return;
    if (!this._hasMateNear(sim)) return;

    // Soft carrying target: breeds readily below the comfortable level, then tapers
    // as it approaches target, so the flock eases up to its cap instead of
    // rocketing there. The harrier crops any surplus over target on top of this.
    if (typeof LEVEL_MECHANICS !== 'undefined' && LEVEL_MECHANICS.speciesCarryingTargets && sim._speciesTarget) {
      const target = sim._speciesTarget(this.speciesKey);
      const n = sim.getSpeciesCount(this.speciesKey);
      const knee = LEVEL_MECHANICS.speciesBreedKnee ?? 0.7;
      if (n >= target) {
        if (random() > (LEVEL_MECHANICS.flyerOverTargetBreed ?? 0.15)) return;
      } else if (n > target * knee) {
        if (random() < (n - target * knee) / (target * (1 - knee))) return;   // skip more often as it nears target
      }
    }

    const egg = sim.addEgg(this.pos.x, this.pos.y);
    egg.offspringType = this.speciesKey;                   // breeds true (kererū / kōkako / huia)
    egg.parentSpecies = this.speciesKey;
    this._eggCooldown = this._eggCooldownFrames;
    this.crop = Math.max(0, this.crop - 1);                 // laying spends a fruit's energy
    if (sim.game) sim.game.addNotification(`A ${this._label} nests — an egg is laid.`, 'info');
  }

  _hasMateNear(sim) {
    const list = sim.otherEntities && sim.otherEntities[this.speciesKey];
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
  // Is the bird on a perch (low altitude, wings folded)? Feeding, resting and
  // sheltering all count; a subclass state that sits on the tree (kōkako SINGING)
  // overrides this to add itself, so altitude AND sprite pose track it.
  _isPerched() {
    return this.state === KERERU_STATE.FEEDING ||
           this.state === KERERU_STATE.PERCHED ||
           this.state === KERERU_STATE.SHELTER;
  }

  // Which animation window/pose to draw, and how far through it. Driven by the eased
  // flight ALTITUDE, so the flying clip's takeoff (0–2) and landing (12–14) frames play
  // exactly over lift-off and touch-down, its cruise loop (3–11) in between, and the
  // perched cycles once the bird has settled. Returns { state, t } where t is the 0..1
  // progress through a takeoff/land window (ignored for the looped states). Passed to
  // EntitySprites.getKereruSprite; the kōkako/huia subclasses reuse it verbatim.
  _flyerAnim() {
    const perched = this._isPerched();
    const perch = this._perchAltCur || this._perchAlt || 0;
    const fp = Math.max(0, Math.min(1, (this._altitude - perch) / Math.max(1, this._cruiseAlt - perch)));
    const KNEE = 0.6;                                    // fp above this = "at cruise"
    if (perched) {
      // Still riding high off the perch → the bird is descending: play the landing window.
      if (fp > 0.35) return { state: 'land', t: Math.min(1, (1 - fp) / 0.65) };
      return { state: (this.state === KERERU_STATE.FEEDING) ? 'eating' : 'hopping', t: 0 };
    }
    // Airborne: rising off the perch → the takeoff window; at cruise → the flap loop.
    if (fp < KNEE) return { state: 'takeoff', t: fp / KNEE };
    return { state: 'cruise', t: 0 };
  }

  update(dt = 1) {
    const perched = this._isPerched();
    if (perched && !this._wasPerched) {
      // Just landed — choose a fresh spot: a height anywhere between low and high in
      // the canopy, and a small sideways offset off the trunk. So birds settle at
      // varied heights across the tree instead of all at one perch point.
      const lo = this._perchAlt * 0.7, hi = Math.max(lo + 1, this._cruiseAlt * 0.8);
      this._perchAltCur = lo + Math.random() * (hi - lo);
      this._perchDX = (Math.random() * 2 - 1) * this.size * 1.1;
      this._perchDY = (Math.random() * 2 - 1) * this.size * 0.5;
    }
    this._wasPerched = perched;
    const targetAlt = perched ? this._perchAltCur : this._cruiseAlt;
    this._altitude += (targetAlt - this._altitude) * Math.min(1, 0.08 * dt);
    super.update(dt);

    // Hard land clamp: a forest bird may skim a coast but never ENDS a frame stranded
    // over open water. If the move put it over sea/river, snap it back to the last
    // walkable ground and kill the outward momentum. This is the definitive cure for
    // "stuck over the ocean" — the steering in behave just makes it look natural.
    const t = this.terrain;
    if (t && typeof t.isWalkable === 'function') {
      if (t.isWalkable(this.pos.x, this.pos.y)) {
        this._lastLand.x = this.pos.x; this._lastLand.y = this.pos.y;
      } else {
        this.pos.x = this._lastLand.x; this.pos.y = this._lastLand.y;
        this.vel.mult(0.3);
      }
    }
  }

  render() {
    const s = this.size * (this.mature ? 1 : 0.7);   // juveniles smaller
    const gy = (typeof Projection !== 'undefined' && Projection.groundY)
      ? Projection.groundY(this.pos.y, this.terrain.getElevationAt(this.pos.x, this.pos.y))
      : this.pos.y;
    const alt = this._altitude || 0;
    const perched = this._isPerched();
    // Off-trunk perch offset (varied per landing) so a flock / a huia pair spreads
    // across the tree rather than stacking on one point. Eased in with the altitude.
    const settle = perched ? Math.min(1, Math.max(0, (this._cruiseAlt - alt) / Math.max(1, this._cruiseAlt - this._perchAltCur))) : 0;
    const offX = perched ? this._perchDX * settle : 0;
    const offY = perched ? this._perchDY * settle : 0;

    push();
    translate(this.pos.x, gy);
    // Shadow stays on the ground while the body lifts — reads as height at 3/4.
    // Higher bird → smaller, fainter shadow.
    if (CONFIG.drawShadows) {
      const sf = 1 - Math.min(0.5, alt / 60);
      noStroke();
      fill(0, 0, 0, 26 * sf);
      ellipse(3 * sf, 3 * sf, s * 1.5 * sf, s * 0.55 * sf);
    }
    translate(offX, -alt + offY);   // body lifts to altitude + the varied perch offset (shadow stays at the base)

    const sprite = this._getSprite(perched);
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
      this._renderGlyph(s, perched);
    }
    this._renderExtra(s, perched);                                     // subclass diegetic cue (kōkako song)
    pop();

    // Debug-only instrumentation (never in the ambient diorama — CLAUDE.md).
    if (typeof CONFIG !== 'undefined' && CONFIG.showEntityUI) this._renderDebug(gy, s, alt);
  }

  // Sprite for the current animation state. Subclasses point this at their own art
  // (EntitySprites.getKokakoSprite / getHuiaSprite); null → the drawn glyph.
  _getSprite(perched) {
    if (typeof EntitySprites === 'undefined' || !EntitySprites.getKereruSprite) return null;
    const a = this._flyerAnim();
    return EntitySprites.getKereruSprite(this.animTime, a.state, a.t);
  }

  // Fallback glyph when the sprite has not loaded: green-grey back, pale breast,
  // small head. Perched → wings folded (a narrower, rounder body); flying → a
  // touch broader. Subclasses override with their own plumage.
  _renderGlyph(s, perched) {
    const dir = (this._flip >= 0) ? 1 : -1;
    const wing = perched ? 1.45 : 1.75;
    fill(66, 90, 76);
    ellipse(0, 0, s * wing, s * 1.05);                               // body / wings
    fill(236, 239, 233);
    ellipse(dir * s * 0.30, s * 0.22, s * 0.85, s * 0.72);          // white waistcoat
    fill(58, 80, 68);
    ellipse(dir * s * 0.55, -s * 0.30, s * 0.62, s * 0.56);         // head
  }

  // Extra diegetic overlay, drawn in the bird's local frame (origin at the body).
  // No-op for the kererū; the kōkako uses it for a soft song cue while singing.
  _renderExtra(s, perched) {}

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
