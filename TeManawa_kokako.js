// ============================================================
// KŌKAKO — the singing forest wattlebird
// ------------------------------------------------------------
// Callaeas wilsoni (North Island kōkako). A poor flier of tall native forest: it
// bounds and hops through the canopy and only ever makes short, laboured glides
// between trees — the same short-flight frugivore loop as the kererū, so it IS a
// kererū mechanically (its own base type + list, extends Kereru). It disperses
// forest seed like the kererū but far less: a smaller gape passes fewer large
// fruit, so _disperseChance is well under half (KOKAKO_SPECIES).
//
// Two things make it a kōkako, not a small kererū:
//   · TERRITORY. It holds a patch of forest and sings from it. The _territory
//     anchor pulls its foraging and hops back onto that patch (Kereru._anchorPoint
//     / _driftHome), so it stays put in the right forest rather than ranging.
//   · SONG. When it is secure on a perch (well fed, no storm) it settles in for a
//     SINGING state — it spends LONGER on the tree than a kererū would. A song
//     provokes the neighbours: the NEAREST kōkako within earshot answers (a duet),
//     while any others crowded inside the territory radius are pushed off to find a
//     new territory of their own (_displaceFrom). Over time the flock spaces itself
//     out across the forest — emergent territoriality from one rule.
//
// No audio asset ships for the song, so the cue is diegetic-visual only: a soft,
// slow pair of song ticks rising from the bird while it sings (_renderExtra),
// non-flashing (photosensitivity budget, CLAUDE.md). The observable is the bird
// sitting notably longer and its neighbours answering / moving off.
//
// Art: sprites/Flighted/Kokako_Flying_00001.png (a single flight frame; perched
// falls back to it). Blue-grey glyph fallback with a dark mask + blue wattle.
// ============================================================

const KOKAKO_STATE = {
  SINGING: 'singing'    // perched and holding a song — sits longer than a plain perch
};

class Kokako extends Kereru {
  constructor(x, y, terrain, config, speciesData) {
    super(x, y, terrain, config, speciesData);
    const sp = (speciesData && speciesData.config) ? speciesData.config : KOKAKO_SPECIES;
    const F = 60;

    // Song timing (seconds → frames on the sim clock).
    this._singFrames        = (sp.singSec ?? 9) * F;          // how long a song holds the perch
    this._singCooldownFrames = (sp.singCooldownSec ?? 14) * F; // quiet spell after a song (breaks call/response loops)
    this._songInterval      = (sp.songEverySec ?? 16) * F;    // spontaneous song cadence when secure
    this._singCooldown      = random(0, this._singCooldownFrames);
    this._songTimer         = this._songInterval * random(0.5, 1.2);
    this._singTimer         = 0;
    this._respondSing       = false;                          // set by a neighbour's song → answer it

    // Territory. Anchored to wherever it last sang; foraging/hops orbit it.
    this._singHearRadius = sp.singHearRadius ?? 220;          // a song reaches this far (nearest answers)
    this._territoryRadius = sp.territoryRadius ?? 140;        // rivals closer than this are pushed off
    this._secureHunger   = (sp.secureHungerFrac ?? 0.6);      // "secure" = hunger below this fraction of max
    this._relocating     = false;                             // travelling to a freshly-claimed territory
    this._territory = createVector(x, y);                     // reusable — never allocate per frame
  }

  // The song sits on the tree, so it reads as a perch for altitude + pose.
  _isPerched() {
    return this.state === KOKAKO_STATE.SINGING || super._isPerched();
  }

  // Add the SINGING state to the dispatch; everything else is the kererū loop.
  _runState(sim, dt) {
    if (this.state === KOKAKO_STATE.SINGING) { this._singing(sim, dt); return; }
    super._runState(sim, dt);
  }

  // Its patch of forest — the flying loop drifts and hops around this.
  _anchorPoint() { return this._territory; }

  // While relocating to a new territory, ignore trees and just travel there; on
  // arrival, resume the ordinary forage/disperse loop.
  _flying(sim, dt) {
    if (this._relocating) {
      const t = this._territory;
      const dx = t.x - this.pos.x, dy = t.y - this.pos.y;
      if (dx * dx + dy * dy < 26 * 26) {
        this._relocating = false;
      } else {
        this.maxSpeed = this.speciesData?.config?.baseSpeed || 0.5;
        this.applyForce(this.seek(t, 1, 30));
        return;
      }
    }
    super._flying(sim, dt);
  }

  // PERCHED — count down the song clocks, and break into a song when secure and
  // either answering a neighbour or due for a spontaneous one. Otherwise the
  // ordinary kererū perch (rest / breed).
  _perched(sim, dt) {
    if (this._singCooldown > 0) this._singCooldown = Math.max(0, this._singCooldown - dt);
    if (this._songTimer > 0)    this._songTimer    = Math.max(0, this._songTimer - dt);

    const secure = this.hunger < this.maxHunger * this._secureHunger;
    if (secure && this._singCooldown <= 0 && (this._respondSing || this._songTimer <= 0)) {
      this._enterSinging(sim);
      return;
    }
    super._perched(sim, dt);
  }

  // Begin a song: hold the perch, anchor the territory here, and provoke the
  // neighbours — nearest answers, the crowded rest move off.
  _enterSinging(sim) {
    this.state = KOKAKO_STATE.SINGING;
    this._singTimer = this._singFrames;
    this._respondSing = false;
    this._territory.set(this.pos.x, this.pos.y);   // claim this perch as the territory centre
    this._provokeNeighbours(sim);
  }

  _singing(sim, dt) {
    this.maxSpeed = 0.15;
    this.vel.mult(Math.pow(0.8, dt));              // hold still on the branch
    this._singTimer -= dt;
    if (this._singTimer <= 0) {
      this._singCooldown = this._singCooldownFrames;
      this._songTimer = this._songInterval * random(0.7, 1.3);
      this.state = KERERU_STATE.PERCHED;           // back to a normal perch beat
      this._restTimer = this._restFrames;
    }
  }

  // One rule drives the territoriality: the nearest kōkako within earshot answers
  // (a counter-song, next time it is secure on a perch); every other kōkako packed
  // inside the territory radius is displaced to claim ground of its own.
  _provokeNeighbours(sim) {
    const list = sim.otherEntities && sim.otherEntities[this.speciesKey];
    if (!list) return;
    const px = this.pos.x, py = this.pos.y;
    const hearSq = this._singHearRadius * this._singHearRadius;
    const terrSq = this._territoryRadius * this._territoryRadius;

    // Nearest audible neighbour → it will answer.
    let nearest = null, nearSq = Infinity;
    for (let i = 0; i < list.length; i++) {
      const o = list[i];
      if (o === this || !o.alive) continue;
      const dx = o.pos.x - px, dy = o.pos.y - py, dSq = dx * dx + dy * dy;
      if (dSq <= hearSq && dSq < nearSq) { nearSq = dSq; nearest = o; }
    }
    if (nearest && typeof nearest._answerSong === 'function') nearest._answerSong();

    // Everyone else too close → seek a different territory.
    for (let i = 0; i < list.length; i++) {
      const o = list[i];
      if (o === this || o === nearest || !o.alive) continue;
      const dx = o.pos.x - px, dy = o.pos.y - py;
      if (dx * dx + dy * dy <= terrSq && typeof o._displaceFrom === 'function') o._displaceFrom(px, py);
    }
  }

  // Queued a response to a neighbour's song (sing back when next secure on a perch).
  _answerSong() { this._respondSing = true; }

  // Pushed out of a rival's territory: claim a new patch away from the singer and
  // set off for it, dropping the current tree. Stays quiet until it arrives.
  _displaceFrom(sx, sy) {
    let ang = Math.atan2(this.pos.y - sy, this.pos.x - sx);
    if (!isFinite(ang) || (this.pos.x === sx && this.pos.y === sy)) ang = random(TWO_PI);
    const r = this._territoryRadius * random(1.0, 1.7);
    const w = this.terrain.mapWidth, h = this.terrain.mapHeight;
    const land = this._clampToLand(                 // a new territory is always on land, never at sea
      constrain(this.pos.x + Math.cos(ang) * r, 8, w - 8),
      constrain(this.pos.y + Math.sin(ang) * r, 8, h - 8)
    );
    this._territory.set(land.x, land.y);
    this._relocating = true;
    this._respondSing = false;
    this._singCooldown = Math.max(this._singCooldown, this._singFrames);  // don't answer mid-move
    if (this._isPerched()) {
      this.state = KERERU_STATE.FLYING;
      this._targetTree = null;
    }
  }

  // Sprite: the kōkako flight frame (perched reuses it — no perched art yet).
  _getSprite(perched) {
    return (typeof EntitySprites !== 'undefined' && EntitySprites.getKokakoSprite)
      ? EntitySprites.getKokakoSprite(perched) : null;
  }

  // Glyph fallback: blue-grey body, dark bandit mask, a dab of blue wattle.
  _renderGlyph(s, perched) {
    const dir = (this._flip >= 0) ? 1 : -1;
    const wing = perched ? 1.4 : 1.7;
    fill(120, 138, 146);
    ellipse(0, 0, s * wing, s * 1.02);                                // slate-grey body
    fill(150, 166, 172);
    ellipse(dir * s * 0.28, s * 0.20, s * 0.8, s * 0.66);             // paler underside
    fill(34, 40, 46);
    ellipse(dir * s * 0.55, -s * 0.28, s * 0.62, s * 0.56);           // head
    ellipse(dir * s * 0.66, -s * 0.16, s * 0.5, s * 0.34);            // dark facial mask
    fill(70, 120, 175);
    ellipse(dir * s * 0.5, s * 0.02, s * 0.22, s * 0.22);             // blue wattle
  }

  // Song cue — a small music note lifting from the singing bird. DEBUG-only now (gated on
  // CONFIG.showEntityUI like the rest of the entity-UI layer): the mating heart is the one
  // breeding cue kept for visitors, while the song note is a developer indicator. For
  // visitors the song stays observable behaviourally — the bird holds its perch notably
  // longer and neighbours answer / move off. Gentle bob on the real anim clock, non-
  // flashing (CLAUDE.md).
  _renderExtra(s, perched) {
    if (this.state !== KOKAKO_STATE.SINGING) return;
    if (typeof CONFIG !== 'undefined' && !CONFIG.showEntityUI) return;
    const dir = (this._flip >= 0) ? 1 : -1;
    const bob = Math.sin((this.animTime || 0) * 0.12) * s * 0.14;
    const hx = dir * s * 0.95, hy = -s * 1.05 + bob;                  // note-head centre, above the head
    push();
    noStroke();
    fill(70, 120, 175, 220);
    rectMode(CORNER);
    rect(hx + s * 0.16, hy - s * 0.72, s * 0.09, s * 0.72);          // stem, rising from the head
    triangle(hx + s * 0.25, hy - s * 0.72,                            // flag off the stem top
             hx + s * 0.25, hy - s * 0.40,
             hx + s * 0.52, hy - s * 0.52);
    ellipse(hx, hy, s * 0.46, s * 0.36);                             // filled note head (drawn last, on top)
    pop();
  }
}

// ------------------------------------------------------------
// SPECIES DATA — North Island kōkako. Registered as its own base type + species
// in initializeRegistry (sketch.js), carrying `class: Kokako`.
// ------------------------------------------------------------
const KOKAKO_SPECIES = {
  displayName:    'North Island Kōkako',
  scientificName: 'Callaeas wilsoni',
  label:          'kōkako',   // lower-case, for the notification strip
  class:          (typeof Kokako !== 'undefined') ? Kokako : undefined,
  description:    'A blue-wattled forest songbird — a weak flier that holds and sings a forest territory.',
  rarity:         'uncommon',

  // Movement / render — a poorer flier than the kererū: slower, shorter hops, and
  // it barely clears the canopy (low cruise altitude).
  baseSpeed:        0.34,
  maxForce:         0.05,
  size:             6,
  perceptionRadius: 60,
  cruiseAlt:        16,
  perchAlt:         8,

  // Short flight legs, kept on a home patch of forest.
  hopRadius:        38,
  feedRadius:       90,
  homeLeash:        120,     // strays this far from its territory before heading back

  // Frugivore crop / dispersal — dispersal well under half the kererū's.
  cropCapacity:     1,
  feedSec:          5,
  disperseEverySec: 22,
  restSec:          10,
  disperseChance:   0.4,     // >50% fewer established seeds than the kererū (1.0)

  // Survival.
  maxHunger:        100,
  hungerRatePerSec: 1.0,
  feedRelief:       70,
  starveSec:        18,

  // Reproduction — breeds true (a kōkako lays a kōkako egg).
  maturitySec:      22,
  eggCooldownSec:   42,
  mateRadius:       170,
  reproCheckSec:    3.5,
  maxPopulation:    10,      // flock cap; founders spawn fewer
  populationFloor:  2,       // never starve below this

  // Song / territory.
  singSec:          9,       // spends notably longer on the tree while singing
  singCooldownSec:  14,      // quiet after a song (bounds the call/response ripple)
  songEverySec:     16,      // spontaneous song cadence when secure
  singHearRadius:   220,     // the nearest kōkako within this answers
  territoryRadius:  140,     // rivals closer than this are pushed to new ground
  secureHungerFrac: 0.6      // "secure enough to sing" — hunger below 60% of max
};

if (typeof window !== 'undefined') {
  window.Kokako = Kokako;
  window.KOKAKO_SPECIES = KOKAKO_SPECIES;
  window.KOKAKO_STATE = KOKAKO_STATE;
}
