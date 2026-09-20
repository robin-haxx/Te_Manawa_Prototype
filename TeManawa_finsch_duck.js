// ============================================================
// FINSCH'S DUCK — the open-country grazing duck
// ------------------------------------------------------------
// Chenonetta finschi. An extinct, large, mostly TERRESTRIAL grazing duck — a poor
// flier that walked and grazed the lowlands rather than swimming them. It was one of
// the MOST ABUNDANT birds of pre-human New Zealand, especially in the drier open
// shrubland and forest margins of the lowlands, so its ecological job here is to make
// the open country FULL: a common, sociable grazer moving in loose groups across the
// flats alongside the goose and the plains/coastal moa.
//
// It "acts like a moa" and so it IS one, mechanically: registered under the `moa` base
// type with this dedicated class, so it lives in the moa list and reuses the whole
// grazer engine (foraging, elevation migration, fleeing the harrier, security/egg-
// laying, habitat health, the population caps). Eggs carry the parent species, so a
// duck hatches a duck. Same wiring as the goose (TeManawa_goose.js) and the mōho
// (TeManawa_takahe.js). No hybridising — the level's noSpeciation flag holds the whole
// ground-bird guild to same-species pairing, so a duck never courts a moa.
//
// Its habits sit BETWEEN the goose and a plain moa — a distinct third open-country read:
//   · LOOSE FLOCK. A duck moves in sociable but loose groups, not the goose's packed
//     gaggle. On top of the data-driven flocking this class adds a GENTLE cohesion pull
//     toward nearby ducks (applySeparation override) — lighter than the goose's, so the
//     birds drift together in an open, ragged flock rather than clumping onto one point;
//   · lowland generalist — an `openCountry` grazer over a slightly BROADER, lower band
//     than the mōho, sharing the small TUSSOCK-in-glacial population lift (Moa.behave);
//   · a MILD cold lean — busier as the glacial opens the country up, but less extremely
//     than the coast-hugging goose, because the duck also worked the drier forest margin.
//
// Art: dedicated multi-state sprite (sprites/Moa/FinschsDuck/{Looking,Eating,Walking}/
// FinschsDuck_*.png), wired as the `finschDuck` entry in EntitySprites.MOA_VARIANT_SETS
// and selected via `spriteSet: 'finschDuck'` — it renders untinted through the same path
// as the moa illustrations.
// ============================================================

class FinschDuck extends Moa {
  constructor(x, y, terrain, config, speciesData = null) {
    super(x, y, terrain, config, speciesData);
    this.isFinschDuck = true;

    // Loose-flock cohesion (see applySeparation). A gentler version of the goose's
    // gaggle: a WIDER comfortable radius and a WEAKER pull, so ducks gather into an
    // open, drifting group instead of packing tight. Kept well under the separation
    // force so it can never pile the birds onto one point.
    this._flockRadius = 96;
    this._flockRadiusSq = this._flockRadius * this._flockRadius;
    this._flockUrgency = 0.16;   // a soft seek — limits the force to ~⅙·maxForce (goose is 0.25)
    this._flockWeight = 0.7;     // and lighter again (goose is 1.0)
  }

  // Moa separation, then a light same-species cohesion so the flock travels as a loose
  // group. Skipped while fleeing/mating/pairing so it never competes with those stronger
  // drives, and while escaping barren ground so the escape wins. Allocation-free: seekPoint
  // returns a reusable temp vector and the centroid is accumulated into locals (CLAUDE.md —
  // no churn in behave). Same shape as Goose.applySeparation, softened.
  applySeparation(moas) {
    super.applySeparation(moas);

    const st = this.currentState;
    if (st === MOA_STATE.FLEEING || st === MOA_STATE.MATING || st === MOA_STATE.SEEKING_MATE) return;
    if (this._onBarrenGround()) return;

    let cx = 0, cy = 0, n = 0;
    const px = this.pos.x, py = this.pos.y, rSq = this._flockRadiusSq;
    for (let i = 0; i < moas.length; i++) {
      const o = moas[i];
      if (o === this || !o.alive || o.speciesKey !== this.speciesKey) continue;
      const dx = o.pos.x - px, dy = o.pos.y - py;
      if (dx * dx + dy * dy < rSq) { cx += o.pos.x; cy += o.pos.y; n++; }
    }
    if (n === 0) return;

    const f = this.seekPoint(cx / n, cy / n, this._flockUrgency);
    f.mult(this._flockWeight);
    this.applyForce(f);
  }
}

// ------------------------------------------------------------
// SPECIES DATA — Finsch's duck (Chenonetta finschi). Registered under the `moa` base
// type in initializeRegistry (sketch.js), carrying `class: FinschDuck`.
// ------------------------------------------------------------
const FINSCH_DUCK_SPECIES = {
  finschs_duck: {
    displayName:    "Finsch's Duck",
    scientificName: "Chenonetta finschi",
    class:          (typeof FinschDuck !== 'undefined') ? FinschDuck : undefined,  // per-species behaviour class
    spriteSet:      'finschDuck',          // dedicated multi-state art — sprites/Moa/FinschsDuck/ (renders untinted)
    tint:           [120, 96, 70],         // warm earth-brown (unused while spriteSet is set — kept per convention)
    highlightColor: [180, 140, 96],        // warm tan — player highlight (pulse + UI border)
    description:    "A big terrestrial grazing duck of the open lowlands — once among the commonest birds in the land.",
    rarity:         'common',

    // Open-country grazer: favours lowland grassland/scrub/coast, and gets the small
    // TUSSOCK-in-glacial population lift shared with the goose and the plains/coastal moa (Moa.behave).
    openCountry: true,

    // Physical — a stout duck, smaller than the goose and the moa.
    size: { min: 6, max: 8 },
    bodyColor: { r: [110, 135], g: [85, 105], b: [55, 72] },

    // Movement — an unhurried walker that can put on a quick waddling burst to flee.
    baseSpeed: 0.18,
    fleeSpeed: 0.5,
    maxForce: 0.024,

    // Survival — a smaller body and modest appetite. A strong breeder (below) means it
    // holds a solid standing flock rather than needing the mōho/kiwi eatGainMult crutch.
    maxHunger: 85,
    baseHungerRate: 0.028,
    hungerThreshold: 32,
    criticalHunger: 70,

    // Reproduction — a productive r-leaning waterfowl: it breeds a shade quicker than the
    // goose, which is part of why the open country reads as FULL of ducks (it was the most
    // abundant of the guild). The shared carrying target in the scaffold caps the flock.
    eggCooldownTime: 760,
    securityTimeBase: 460,
    securityTimeVariation: 220,

    // Habitat — lowland grassland/scrub, a touch broader and lower than the mōho's band
    // (0.16–0.44) and overlapping the goose's coastal flats (0.15–0.28). The floor is the
    // lowest PLANT-BEARING band (grassland 0.15), never the barren coastal beach.
    preferredElevation: { min: 0.15, max: 0.34 },
    temperatureTolerance: { cold: 0.7, heat: 0.55 },

    // Behaviour habits — sociable but not the goose's tight gaggle (loose flock, see the
    // class), heads-down and grazing, and wary in the open.
    flockTendency: 0.7,    // gregarious — but below the goose's 0.95 (a looser group)
    curiosity: 0.4,
    flightiness: 0.7,      // exposed on the flats — flushes fairly readily

    eagleResistance: 0.1,

    // A MILD cold lean — the open glacial country suits it, but less than the goose,
    // since the duck also worked the drier forest margin. Keyed by GLACIAL PHASE
    // (interglacial/cooling/glacial/fullGlacial) — the deep-time clock's key, NOT summer/
    // winter (which read undefined→1 and did nothing; see seasonal-modifiers-key-mismatch).
    seasonalModifiers: {
      interglacial: { hungerRate: 1.08, speed: 1.0  },
      cooling:      { hungerRate: 1.0,  speed: 1.0  },
      glacial:      { hungerRate: 0.95, speed: 1.0  },
      fullGlacial:  { hungerRate: 0.92, speed: 0.96 }
    }
  }
};

if (typeof window !== 'undefined') {
  window.FinschDuck = FinschDuck;
  window.FINSCH_DUCK_SPECIES = FINSCH_DUCK_SPECIES;
}
