// ============================================================
// HUIA — the pair-bonded forest wattlebird
// ------------------------------------------------------------
// Heteralocha acutirostris. A poor flier of tall forest that bounds through the
// canopy and glides only short distances — the kererū's short-flight frugivore
// loop again, so it IS a kererū mechanically (its own base type + list, extends
// Kereru). It moves forest seed like the kererū but far less (a smaller gape;
// _disperseChance well under half — HUIA_SPECIES).
//
// The huia's signature is the PAIR. Male and female foraged together for life and
// were famously dimorphic — the male a short stout bill, the female a long
// decurved one (the two worked the same rotten wood between them). So the huia
// founds as MALE+FEMALE pairs (Simulation._spawnHuiaPairs) that keep to the same
// tree:
//   · each bird anchors to its mate (Kereru._anchorPoint → mate position), so the
//     flying loop drifts and hops around the partner rather than ranging off;
//   · the male forages WITH the female — he adopts whatever tree she is working
//     (_findFruitTree), so the pair stays on one tree instead of splitting.
// A hatchling with no mate bonds to the nearest free opposite-sex huia (_ensureMate).
//
// Art: sprites/Flighted/HuiaMale_Flying_00001.png + HuiaFemale_Flying_00001.png
// (sex-specific; a single flight frame each, perched falls back to it). Glyph
// fallback: glossy-black body, white tail tip, orange wattle, sexed bill.
// ============================================================

class Huia extends Kereru {
  constructor(x, y, terrain, config, speciesData) {
    super(x, y, terrain, config, speciesData);
    this._mate = null;              // bonded partner (set by the pair spawn; else lazily)
    this._mateSearchTimer = 0;      // throttles the lazy mate search for hatchlings
  }

  // Bonded partner is home: the flying loop stays around it (kererū is free-ranging).
  _anchorPoint() {
    return (this._mate && this._mate.alive) ? this._mate.pos : null;
  }

  // The male works the female's tree so the pair forages together; the female (or
  // an unpaired bird) searches for herself and he follows. Anchoring keeps the
  // search local to the partner, so "her tree" is always close by.
  _findFruitTree(sim) {
    this._ensureMate(sim);
    const mate = this._mate;
    if (!this.isFemale && mate && mate.alive && this._treeValid(mate._targetTree)) {
      return mate._targetTree;
    }
    return super._findFruitTree(sim);
  }

  // Bond a mateless bird (a hatchling) to the nearest free opposite-sex huia.
  // Throttled — this only matters for the occasional new bird, not every frame.
  _ensureMate(sim) {
    if (this._mate && this._mate.alive) return;
    if (this._mateSearchTimer > 0) { this._mateSearchTimer--; return; }
    this._mateSearchTimer = 45;
    this._mate = null;
    const list = sim.otherEntities && sim.otherEntities[this.speciesKey];
    if (!list) return;
    let best = null, bestSq = Infinity;
    const px = this.pos.x, py = this.pos.y;
    for (let i = 0; i < list.length; i++) {
      const o = list[i];
      if (o === this || !o.alive || o.isFemale === this.isFemale) continue;
      if (o._mate && o._mate.alive && o._mate !== this) continue;   // already partnered
      const dx = o.pos.x - px, dy = o.pos.y - py, d = dx * dx + dy * dy;
      if (d < bestSq) { bestSq = d; best = o; }
    }
    if (best) { this._mate = best; if (!best._mate || !best._mate.alive) best._mate = this; }
  }

  // Sprite: the sex-specific huia cel cycle for the current animation state.
  _getSprite(perched) {
    if (typeof EntitySprites === 'undefined' || !EntitySprites.getHuiaSprite) return null;
    const a = this._flyerAnim();
    return EntitySprites.getHuiaSprite(this.animTime, a.state, this.isFemale, a.t);
  }

  // Glyph fallback: glossy black body, white tail tip, orange wattle. The bill is
  // the sex tell — short and stout on the male, long and decurved on the female.
  _renderGlyph(s, perched) {
    const dir = (this._flip >= 0) ? 1 : -1;
    const wing = perched ? 1.4 : 1.7;
    fill(30, 28, 34);
    ellipse(0, 0, s * wing, s * 1.0);                                // glossy black body
    fill(232, 232, 226);
    ellipse(-dir * s * 0.68, s * 0.06, s * 0.5, s * 0.32);           // white tail band (trailing)
    fill(20, 18, 24);
    ellipse(dir * s * 0.55, -s * 0.28, s * 0.6, s * 0.54);           // head
    fill(232, 148, 46);
    ellipse(dir * s * 0.46, s * 0.06, s * 0.22, s * 0.22);           // orange wattle
    fill(96, 78, 56);
    if (this.isFemale) {
      ellipse(dir * s * 0.98, -s * 0.10, s * 0.9, s * 0.16);         // long, slender, decurved
    } else {
      ellipse(dir * s * 0.9, -s * 0.26, s * 0.44, s * 0.2);          // short, stout
    }
  }
}

// ------------------------------------------------------------
// SPECIES DATA — huia. Registered as its own base type + species in
// initializeRegistry (sketch.js), carrying `class: Huia`. Founded as pairs.
// ------------------------------------------------------------
const HUIA_SPECIES = {
  displayName:    'Huia',
  scientificName: 'Heteralocha acutirostris',
  label:          'huia',   // lower-case, for the notification strip
  class:          (typeof Huia !== 'undefined') ? Huia : undefined,
  description:    'A black, orange-wattled wattlebird that forages for life as a male–female pair.',
  rarity:         'uncommon',

  // Movement / render — a weak flier like the kōkako: slow, short hops, low cruise.
  baseSpeed:        0.24,
  maxForce:         0.05,
  size:             8,
  perceptionRadius: 60,
  cruiseAlt:        16,
  perchAlt:         8,

  // Short flight legs, kept close to the partner.
  hopRadius:        36,
  feedRadius:       90,
  homeLeash:        105,     // how far it strays from its mate before drifting back — loose enough the pair reads as two birds, not one

  // Frugivore crop / dispersal — dispersal well under half the kererū's.
  cropCapacity:     1,
  feedSec:          5,
  disperseEverySec: 22,
  restSec:          9,
  disperseChance:   0.4,     // >50% fewer established seeds than the kererū (1.0)

  // Survival.
  maxHunger:        100,
  hungerRatePerSec: 1.0,
  feedRelief:       70,
  starveSec:        18,

  // Reproduction — breeds true; the partner is always at hand (mateRadius small).
  maturitySec:      22,
  eggCooldownSec:   44,
  mateRadius:       120,
  reproCheckSec:    3.5,
  maxPopulation:    12,      // ~6 pairs
  populationFloor:  2
};

if (typeof window !== 'undefined') {
  window.Huia = Huia;
  window.HUIA_SPECIES = HUIA_SPECIES;
}
