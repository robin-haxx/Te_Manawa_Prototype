// ============================================================
// TŪĪ: the singing nectar-feeder
// ------------------------------------------------------------
// Prosthemadera novaeseelandiae. A honeyeater of the native forest and its edge: it
// works flowering trees (flax, kōwhai, rātā) for nectar and takes fruit besides, so
// it belongs to the flighted forest guild: mechanically a kererū (its own base type
// + list, the short-flight frugivore loop). It moves forest seed, but with a smaller
// gape than the kererū it passes only the smaller-to-middling fruit, not the largest
// podocarp drupes, so _disperseChance sits BETWEEN the weak-gaped kōkako/huia (0.4)
// and the kererū (1.0).
//
// Two things set the tūī apart from the OTHER two forest wattlebirds it shares code with:
//   · IT IS A STRONG FLIER. The kōkako and huia are poor fliers that bound and glide
//     between neighbouring trees; the tūī is fast, agile and NOISY, ranging widely to
//     chase the flowering, so it takes a higher cruise, a quicker wingbeat and much
//     longer flight legs (see TUI_SPECIES), and a loose, roomy territory rather than the
//     kōkako's tight sedentary patch.
//   · IT SINGS, and it is AGGRESSIVE at a nectar source. That is exactly the kōkako's
//     behaviour (hold a patch, sing from it, answer a neighbour and shove crowded-in
//     rivals off to new ground), so the tūī EXTENDS Kokako and inherits the whole song /
//     territory machinery (it MUST load after kokako.js). The larger hear/territory radii
//     and long home leash below make its territory a big, loosely-held nectar range that
//     it defends with song rather than the kōkako's small forest patch.
//
// Reproduction is the shared emergent flyer path (a mature, well-fed female with a mate
// near lays a tūī egg; Simulation._hatchFlyerEgg), breeding true. A forest bird, so it
// is a WARM-phase presence: abundant when the interglacial forest is in flower, thinner
// as a glacial contracts it (the shared flyer population floor keeps a few alive).
//
// Art: dedicated multi-state sprite (sprites/Flighted/Tui/{Flying,Hopping,Eating}/
// Tui_*.png), wired as the `tui` entry in EntitySprites.FLYER_VARIANT_SETS and drawn via
// EntitySprites.getTuiSprite. Glyph fallback: blue-black iridescent body + the white
// throat tuft.
// ============================================================

class Tui extends Kokako {
  constructor(x, y, terrain, config, speciesData) {
    super(x, y, terrain, config, speciesData);
    this.isTui = true;
  }

  // Sprite: the tūī cel cycle for the current animation state (its own art, not the
  // kōkako's). SINGING resolves through _isPerched → the hopping perch-idle, as for the kōkako.
  _getSprite(perched) {
    if (typeof EntitySprites === 'undefined' || !EntitySprites.getTuiSprite) return null;
    const a = this._flyerAnim();
    return EntitySprites.getTuiSprite(this.animTime, a.state, a.t);
  }

  // Glyph fallback: blue-black iridescent body with the tūī's signature white throat
  // tuft. (Only drawn if the sprite set fails to load; keeps the species legible.)
  _renderGlyph(s, perched) {
    const dir = (this._flip >= 0) ? 1 : -1;
    const wing = perched ? 1.4 : 1.75;
    fill(26, 30, 44);
    ellipse(0, 0, s * wing, s * 1.02);                                // blue-black body
    fill(40, 52, 70);
    ellipse(dir * s * 0.30, s * 0.20, s * 0.78, s * 0.64);           // faint steel sheen underside
    fill(20, 22, 34);
    ellipse(dir * s * 0.55, -s * 0.28, s * 0.6, s * 0.54);           // head
    fill(238, 240, 236);
    ellipse(dir * s * 0.44, s * 0.14, s * 0.26, s * 0.30);           // white throat tuft
  }
}

// ------------------------------------------------------------
// SPECIES DATA: tūī. Registered as its own base type + species in initializeRegistry
// (sketch.js), carrying `class: Tui`. Breeds true via the shared flyer egg path.
// Carries BOTH the flighted-bird fields (read by the Kereru base) AND the song/territory
// fields (read by the Kokako base): the tūī is a strong-flying kōkako.
// ------------------------------------------------------------
const TUI_SPECIES = {
  displayName:    'Tūī',
  scientificName: 'Prosthemadera novaeseelandiae',
  label:          'tūī',   // lower-case, for the notification strip
  class:          (typeof Tui !== 'undefined') ? Tui : undefined,
  description:    'A white-tufted honeyeater, a strong, noisy flier that sings and defends flowering trees for their nectar.',
  rarity:         'common',

  // Movement / render, a STRONG flier, the opposite of the weak kōkako/huia: fast, high
  // cruise, quick wingbeat. Kept at (not above) the harrier's hunt speed so a chase still
  // resolves rather than the bird outrunning it forever (see Kereru._fleeHarrier).
  baseSpeed:        0.34,
  maxForce:         0.06,
  size:             7,
  perceptionRadius: 70,
  cruiseAlt:        26,     // clears the canopy, higher than the kōkako's 16
  perchAlt:         8,

  // Long flight legs: it RANGES to follow the flowering, unlike the tree-to-tree kōkako.
  hopRadius:        60,
  feedRadius:       130,
  homeLeash:        200,    // a big, loosely-held nectar range (kōkako holds 120)

  // Frugivore/nectar crop: a quick feeder. Dispersal sits BETWEEN the kōkako/huia (0.4)
  // and the kererū (1.0): a middling gape passes smaller fruit but not the largest drupe.
  cropCapacity:     1,
  feedSec:          4,
  disperseEverySec: 18,
  restSec:          7,
  disperseChance:   0.5,

  // Survival.
  maxHunger:        100,
  hungerRatePerSec: 1.1,
  feedRelief:       70,
  starveSec:        18,

  // Reproduction: breeds true (a tūī lays a tūī).
  maturitySec:      20,
  eggCooldownSec:   34,
  mateRadius:       200,
  reproCheckSec:    3.5,
  maxPopulation:    12,
  populationFloor:  2,

  // Song / territory (read by the Kokako base). Shorter, more frequent songs than the
  // kōkako's (the tūī is a near-constant singer) and a bigger range it defends by voice.
  singSec:          6,       // a burst of song
  singCooldownSec:  10,      // quiet spell after a song (bounds the call/response ripple)
  songEverySec:     12,      // spontaneous song cadence when secure (sings often)
  singHearRadius:   260,     // a loud voice carries far: the nearest tūī within this answers
  territoryRadius:  120,     // rivals closer than this are shoved off (aggressive at nectar)
  secureHungerFrac: 0.6      // "secure enough to sing": hunger below 60% of max
};

if (typeof window !== 'undefined') {
  window.Tui = Tui;
  window.TUI_SPECIES = TUI_SPECIES;
}
