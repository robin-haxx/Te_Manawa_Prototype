// ============================================================
// NORTH ISLAND GOOSE — the open-country grazer
// ------------------------------------------------------------
// Cnemiornis gracilis. A heavy flightless goose of open grassland, scrub and
// coast — and it is IN THE BONES held in this building (the Te Ahu a Tūranga
// assemblage; md/TEMANAWA_ECOLOGY_FAUNA.md §, md/TEMANAWA_SPECIES_SUMMARY.md).
// Its ecological job here is to make the COLD phase busier, not emptier: when the
// forest contracts and the plains open out in a glacial, the large grazing birds
// (this goose, the plains/coastal moa) come into their own.
//
// It "acts like a moa" and so it IS one, mechanically: registered as a species of
// the `moa` base type but with this dedicated class, so it lives in the moa list
// and reuses the whole grazer engine — foraging, elevation migration, fleeing
// eagles, security/egg-laying, habitat health, the population caps. Eggs carry the
// parent species, so a goose lays a goose (Simulation.updateEggs → createAnimal).
//
// Its habits are tuned to be a little more DISTINCT than any moa (see GOOSE_SPECIES):
//   · intensely gregarious — it packs tighter than any moa (a gaggle) and, on top
//     of the data-driven flocking, this class adds a gentle cohesion pull toward
//     nearby geese (applySeparation override below);
//   · heads-down and incurious — it grazes, it doesn't investigate;
//   · a cold-phase bird — it feeds efficiently through winter and favours the
//     lowest open ground (coast + lowland grassland), below the moa forest bands.
//
// Open-country grazers (this goose + the plains/coastal moa, flagged `openCountry`)
// also get a small population lift while the visitor grows TUSSOCK in a glacial —
// the matched cold regime. That lift lives in the shared grazer code (Moa.behave /
// _resetAfterMating, gated on Game._tussockFlush), not here, so it applies to the
// flagged moa too. See md/TEMANAWA_ECOLOGY_FAUNA.md ("cold is busier").
//
// Art: dedicated sprite (sprites/Moa/Goose_Running_*.png), wired as the `goose`
// entry in EntitySprites.MOA_VARIANT_SETS and selected via `spriteSet: 'goose'` —
// it renders untinted through the same path as the moa illustrations.
// ============================================================

class Goose extends Moa {
  constructor(x, y, terrain, config, speciesData = null) {
    super(x, y, terrain, config, speciesData);
    this.isGoose = true;

    // Gaggle cohesion (see applySeparation). A goose is far more gregarious than a
    // moa: the high `flockTendency` already weakens its separation so it clusters,
    // and this adds a gentle pull toward the local group centroid so stragglers
    // drift back in and the flock reads as a moving gaggle. Kept well under the
    // separation force so it can never pile the birds onto one point.
    this._gaggleRadius = 72;
    this._gaggleRadiusSq = this._gaggleRadius * this._gaggleRadius;
    this._gaggleUrgency = 0.25;   // a soft seek — limits the force to ¼·maxForce
    this._gaggleWeight = 1.0;
  }

  // Moa separation, then a light same-species cohesion so the flock travels as a
  // gaggle. Skipped while fleeing/mating/pairing so it never competes with those
  // stronger drives. Allocation-free: seekPoint returns a reusable temp vector,
  // and the centroid is accumulated into locals (CLAUDE.md — no churn in behave).
  applySeparation(moas) {
    super.applySeparation(moas);

    const st = this.currentState;
    if (st === MOA_STATE.FLEEING || st === MOA_STATE.MATING || st === MOA_STATE.SEEKING_MATE) return;
    // Don't let the gaggle pull a goose escaping the barren coast back toward coastal
    // flockmates — the escape (Moa.executeState) must win over cohesion here.
    if (this._onBarrenGround()) return;

    let cx = 0, cy = 0, n = 0;
    const px = this.pos.x, py = this.pos.y, rSq = this._gaggleRadiusSq;
    for (let i = 0; i < moas.length; i++) {
      const o = moas[i];
      if (o === this || !o.alive || o.speciesKey !== this.speciesKey) continue;
      const dx = o.pos.x - px, dy = o.pos.y - py;
      if (dx * dx + dy * dy < rSq) { cx += o.pos.x; cy += o.pos.y; n++; }
    }
    if (n === 0) return;

    const f = this.seekPoint(cx / n, cy / n, this._gaggleUrgency);
    f.mult(this._gaggleWeight);
    this.applyForce(f);
  }
}

// ------------------------------------------------------------
// SPECIES DATA — one goose for now (Cnemiornis gracilis). Registered under the
// `moa` base type in initializeRegistry (sketch.js), carrying `class: Goose`.
// ------------------------------------------------------------
const GOOSE_SPECIES = {
  giant_goose: {
    displayName:    "North Island Goose",
    scientificName: "Cnemiornis gracilis",
    class:          (typeof Goose !== 'undefined') ? Goose : undefined,  // per-species behaviour class
    spriteSet:      'goose',              // dedicated art — sprites/Moa/Goose_Running_*.png (renders untinted)
    tint:           [130, 148, 170],      // cool slate-grey (unused while spriteSet is set — kept per convention)
    highlightColor: [150, 190, 210],      // cool blue-grey — player highlight (pulse + UI border)
    description:    "Heavy flightless goose of open grassland and coast — busiest in the cold.",
    rarity:         'common',

    // Open-country grazer: favours lowland grassland/scrub/coast, and gets the small
    // TUSSOCK-in-glacial population lift shared with the plains/coastal moa (Moa.behave).
    openCountry: true,

    // Physical — stocky, a touch smaller than the giant moa.
    size: { min: 7, max: 9 },
    bodyColor: { r: [120, 140], g: [125, 140], b: [110, 125] },

    // Movement — an unhurried grazer that can still put on a heavy burst to flee.
    baseSpeed: 0.17,
    fleeSpeed: 0.55,
    maxForce: 0.022,

    // Survival.
    maxHunger: 100,
    baseHungerRate: 0.03,
    hungerThreshold: 34,
    criticalHunger: 82,

    // Reproduction — breeds a little quicker than the giants, which is part of why
    // the cold-phase open country fills with geese rather than emptying.
    eggCooldownTime: 820,
    securityTimeBase: 500,
    securityTimeVariation: 250,

    // Habitat — lowland grassland/wetland, BELOW the moa forest bands. The floor is the lowest
    // PLANT-BEARING band (grassland starts at 0.15); it used to reach into the coastal beach
    // (0.10–0.15, canHavePlants:false), which drew the geese onto bare sand where nothing grows.
    preferredElevation: { min: 0.15, max: 0.28 },
    temperatureTolerance: { cold: 0.85, heat: 0.45 },   // a cold-phase bird

    // Behaviour habits — distinct from the moa: intensely gregarious, heads-down
    // and incurious, and wary (quick to flush from open ground).
    flockTendency: 0.95,   // packs tighter than any moa (weakens separation → a gaggle)
    curiosity: 0.25,       // grazes, doesn't investigate
    flightiness: 0.8,      // exposed in the open — flushes readily

    eagleResistance: 0.1,  // some heft, but open ground offers little cover

    // Cold is busier: it feeds efficiently on the glacial tussock and idles when
    // interglacial forest crowds out the open country. Keyed by GLACIAL PHASE
    // (interglacial/cooling/glacial/fullGlacial) — the deep-time clock's key, NOT
    // summer/winter, which read undefined→1 and left this inert (see memory
    // seasonal-modifiers-key-mismatch).
    seasonalModifiers: {
      interglacial: { hungerRate: 1.15, speed: 1.0  },
      cooling:      { hungerRate: 1.0,  speed: 1.0  },
      glacial:      { hungerRate: 0.9,  speed: 1.0  },
      fullGlacial:  { hungerRate: 0.85, speed: 0.95 }   // thrives in the cold open country
    }
  }
};

if (typeof window !== 'undefined') {
  window.Goose = Goose;
  window.GOOSE_SPECIES = GOOSE_SPECIES;
}
