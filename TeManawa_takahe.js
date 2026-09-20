// ============================================================
// MŌHO: the North Island takahē (the territorial rail)
// ------------------------------------------------------------
// Porphyrio mantelli. A big flightless rail of the North Island, known here from
// subfossil bones. It "borrows the living takahē's blue-green" for recognition
// (md/TEMANAWA_FAUNA_POOL.md, md/TEMANAWA_FAUNA.md): a museum visitor reads a takahē,
// and the label teaches that this was its extinct northern cousin.
//
// CORRECTNESS TRAP (the docs call it out explicitly): the LIVING takahē
// *Porphyrio hochstetteri* is SOUTH ISLAND ONLY: "wrong place, not wrong time."
// The right bird for the Manawatū is the mōho, *P. mantelli*. The Takahe_Running
// art borrows the living bird's look on purpose; the IDENTITY here is the mōho.
// (Same class of trap as the raptor; see the raptor-identity note.)
//
// It "acts like a moa" and so it IS one, mechanically: registered under the `moa`
// base type with this dedicated class, so it lives in the moa list and reuses the
// whole grazer engine (foraging, fleeing eagles, security/egg-laying, health, the
// population caps). Eggs carry the parent species, so a mōho lays a mōho. Same
// wiring as the goose (TeManawa_goose.js).
//
// Its habits are tuned to its natural history, and they are the OPPOSITE of the
// goose's roaming gaggle:
//   · TERRITORIAL and sedentary: a rail holds a small patch. It does not do the
//     moa's seasonal elevation migration (shouldMigrate is suppressed) and it is
//     pulled back to its home range more firmly (stayInHomeRange override);
//   · spaced, not flocking: pairs and family groups hold territories apart, so it
//     takes a low `flockTendency` (which strengthens separation) and no gaggle pull;
//   · a slow breeder: a big K-selected flightless bird lays few eggs (long egg
//     cooldown / security time);
//   · open grassland, scrub and forest margin: so it is an `openCountry` grazer and
//     shares the small TUSSOCK-in-glacial population lift (Moa.behave), but over a
//     broader, slightly higher band than the coast-hugging goose.
//
// Art: dedicated sprite (sprites/Moa/Takahe_Running_*.png), wired as the `takahe`
// entry in EntitySprites.MOA_VARIANT_SETS and selected via `spriteSet: 'takahe'`.
// ============================================================

class Takahe extends Moa {
  constructor(x, y, terrain, config, speciesData = null) {
    super(x, y, terrain, config, speciesData);
    this.isTakahe = true;

    // Tight territory: a rail defends a small patch, far smaller than the moa's
    // roaming home range (Moa seeds random(50,90)). This, the firmer tether below
    // and the suppressed migration are what make it read as sedentary.
    this.homeRangeRadius = random(28, 44);
    this.homeRangeRadiusSq = this.homeRangeRadius * this.homeRangeRadius;
  }

  // Territorial and sedentary: the mōho holds its patch and does NOT do the moa's
  // seasonal elevation migration. It only relocates as a genuine last resort
  // (starving with no food to hand) so it never strands itself when its territory
  // dries out under a deep-time morph.
  shouldMigrate(sc) {
    return this.hunger > this.criticalHunger && this.localFoodScore < 0.2;
  }

  // A firmer pull back to the defended patch than the roaming moa's (0.12). Same
  // shape as Moa.stayInHomeRange, allocation-free (writes the reused _homeForce).
  stayInHomeRange() {
    const dx = this.homeRange.x - this.pos.x, dy = this.homeRange.y - this.pos.y;
    const dSq = dx * dx + dy * dy;
    const f = this._homeForce;
    if (dSq > this.homeRangeRadiusSq) {
      f.set(dx, dy);
      f.setMag(this.maxForce * 0.28);
      f.mult(1 + (Math.sqrt(dSq) - this.homeRangeRadius) * 0.03);
    } else {
      f.set(0, 0);
    }
    return f;
  }
}

// ------------------------------------------------------------
// SPECIES DATA: the mōho (Porphyrio mantelli). Registered under the `moa` base
// type in initializeRegistry (sketch.js), carrying `class: Takahe`.
// ------------------------------------------------------------
const TAKAHE_SPECIES = {
  north_island_takahe: {
    displayName:    "Mōho (NI Takahē)",
    scientificName: "Porphyrio mantelli",
    class:          (typeof Takahe !== 'undefined') ? Takahe : undefined,  // per-species behaviour class
    spriteSet:      'takahe',             // dedicated art: sprites/Moa/Takahe_Running_*.png (renders untinted)
    tint:           [60, 150, 165],       // teal blue-green (unused while spriteSet is set, kept per convention)
    highlightColor: [70, 175, 190],       // takahē blue-green; player highlight (pulse + UI border)
    description:    "The North Island takahē, a big blue-green flightless rail of grassland, scrub and forest margin.",
    rarity:         'uncommon',

    // Open grassland/scrub/forest-margin grazer: shares the TUSSOCK-in-glacial lift
    // with the goose and the plains/coastal moa (Moa.behave), over a broader band.
    openCountry: true,

    // Physical: a stout rail, smaller than the moa and the goose.
    size: { min: 8, max: 9 },
    bodyColor: { r: [60, 85], g: [95, 125], b: [110, 140] },

    // Movement: a deliberate walker that can scurry into cover when flushed.
    baseSpeed: 0.15,
    fleeSpeed: 0.5,
    maxForce: 0.022,

    // Survival. A slow K-selected breeder that kept getting pinned at its floor and
    // reading as absent, so it depletes more slowly and wins more per bite (eatGainMult,
    // applied in Moa.forage), enough to hold a small standing population above the floor.
    maxHunger: 90,
    baseHungerRate: 0.024,   // was 0.03, gentler depletion so it isn't chronically at critical
    eatGainMult: 1.3,        // +30% food per bite (paired with the reduced rate)
    hungerThreshold: 32,
    criticalHunger: 74,

    // Reproduction: a big K-selected flightless bird that breeds SLOWLY (few eggs,
    // long between them). This is what keeps it uncommon rather than filling the map.
    eggCooldownTime: 1400,
    securityTimeBase: 1050,
    securityTimeVariation: 500,

    // Habitat: lowland grassland up through scrub to the montane forest margin.
    // Broader and a touch higher than the coast-hugging goose (0.10–0.28).
    preferredElevation: { min: 0.16, max: 0.44 },
    temperatureTolerance: { cold: 0.75, heat: 0.5 },   // cold-hardy open-country bird

    // Behaviour habits, distinct from goose AND moa: territorial and spaced (low
    // flock tendency strengthens separation, so pairs hold ground apart), wary but
    // more likely to hold its patch than to keep running.
    flockTendency: 0.35,   // territorial, NOT a flocker (stronger separation → spaced)
    curiosity: 0.4,
    flightiness: 0.55,     // wary, but stands its ground more than the flighty goose

    eagleResistance: 0.1,

    // Cold is busier: like the goose it feeds efficiently through the glacial and
    // idles in the interglacial, but less extremely (it also works forest margins).
    // Keyed by GLACIAL PHASE (interglacial/cooling/glacial/fullGlacial): the deep-
    // time clock's key, not summer/winter (which read undefined→1 and did nothing).
    seasonalModifiers: {
      interglacial: { hungerRate: 1.1,  speed: 1.0  },
      cooling:      { hungerRate: 1.0,  speed: 1.0  },
      glacial:      { hungerRate: 0.92, speed: 1.0  },
      fullGlacial:  { hungerRate: 0.9,  speed: 0.95 }
    }
  }
};

if (typeof window !== 'undefined') {
  window.Takahe = Takahe;
  window.TAKAHE_SPECIES = TAKAHE_SPECIES;
}
