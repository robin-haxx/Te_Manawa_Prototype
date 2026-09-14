// ============================================================
// NORTH ISLAND BROWN KIWI — the forest-floor gardener
// ------------------------------------------------------------
// Apteryx mantelli. The fourth flightless bird of the cast, and the only one that
// belongs to the FOREST floor rather than the open plains. Unlike the takahē and the
// harrier, its identity carries NO "wrong place / wrong time" trap: the NI brown kiwi
// genuinely lives across the lower North Island, so the Manawatū bird is simply itself.
// (The little spotted kiwi, Apteryx owenii, is the smaller lowland alternative also
// recorded from the southern NI — swap the species data if that read is preferred.)
//
// It "acts like a moa" and so it IS one, mechanically: registered under the `moa` base
// type with this dedicated class, so it lives in the moa list and reuses the whole
// grazer engine (foraging, fleeing the harrier, security/egg-laying, health, the
// population caps). Eggs carry the parent species, so a kiwi hatches a kiwi. Same wiring
// as the goose (TeManawa_goose.js) and the mōho (TeManawa_takahe.js).
//
// HABITAT & CLIMATE — the mirror of the open-country grazers. The goose and mōho are
// cold-phase birds that fill the plains when a GLACIAL opens the country up; the kiwi is
// the WARM-phase forest bird. It favours the closed lowland-to-montane forest band
// (podocarp + montane), is deliberately NOT flagged `openCountry` (it gets no tussock
// lift), and its seasonalModifiers make it thrive in the interglacial canopy and struggle
// as the glacial contracts the forest around it (see KIWI_SPECIES). A strong
// `forestAffinity` biases its migration toward dense tree cover, and a high `camouflage`
// (a cryptic, near-nocturnal bird) means the diurnal harrier seldom takes one.
//
// THE QUIRK — its unique role in the sim: SOIL-TURNING. Every other ground bird is a
// grazer that only ever CONSUMES; the kererū is a flyer that DISPERSES new seedlings into
// gaps. The kiwi is the one bird that HEALS the forest floor in place. As it probes the
// leaf litter for its food it aerates and recycles the ground — modelled by stamping a
// gentle, short-lived warp (the PLAN_V3 §9 disturbance clock, the same machinery the storm
// and the eruption-bloom use) around where it feeds, which speeds the nearby plants'
// regrowth. It is net-POSITIVE: its browse prunes a plant a little, its gardening regrows
// the patch a lot, so over time the forest floor a kiwi works stays visibly lusher. This
// pairs with the kererū to close the forest loop — the kererū spreads the forest OUTWARD,
// the kiwi tends it in PLACE — and it reinforces the warm-phase reading: the interglacial
// forest is not just larger, it is healthier where the kiwi work. Opt-in and tunable via
// LEVEL_MECHANICS.kiwiSoilTurning / kiwiWarpRadius / kiwiWarpStrength / kiwiProbeInterval.
//
// Art: dedicated multi-state sprite (sprites/Moa/Kiwi/{Looking,Eating,Walking}/Kiwi_*.png),
// wired as the `kiwi` entry in EntitySprites.MOA_VARIANT_SETS and selected via
// `spriteSet: 'kiwi'` — it renders untinted through the same path as the moa illustrations.
// ============================================================

// Forest floor the kiwi tends, self-contained rather than leaning on the global
// FOREST_BIOMES set (that is built from LEVEL_MECHANICS.forestBiomes, which the scaffold
// leaves unset, so it is empty). Podocarp + montane are the closed forest of the kiwi's
// band; wetland is the kahikatea swamp-forest margin it also works. Subalpine (scrub /
// tussock) is deliberately excluded — that is open-country grazer ground.
const KIWI_FOREST_BIOMES = new Set(['podocarp', 'montane', 'wetland']);

class Kiwi extends Moa {
  constructor(x, y, terrain, config, speciesData = null) {
    super(x, y, terrain, config, speciesData);
    this.isKiwi = true;

    // A burrow-holding forest bird, not a roamer: a home range between the mōho's tight
    // territory (28–44) and the moa's wandering one (50–90). It still does the moa's
    // seasonal migration when the forest band moves under it, but from a smaller base.
    this.homeRangeRadius = random(34, 52);
    this.homeRangeRadiusSq = this.homeRangeRadius * this.homeRangeRadius;

    // Soil-turning probe clock, in sim-dt. Seeded random per bird so a founding group
    // does not stamp its warps in lockstep. Reset with a jittered interval after each stamp.
    const M = (typeof LEVEL_MECHANICS !== 'undefined') ? LEVEL_MECHANICS : null;
    this._probeTimer = random(0, (M && M.kiwiProbeInterval) || 150);
  }

  // The quirk. Run the full moa grazer contract first, then — only while actually working
  // the ground (foraging / feeding) and standing on forest floor — stamp a gentle,
  // decaying warp that speeds the nearby plants' regrowth. Throttled by a probe clock so
  // the active-disturbance list stays tiny (a few at most) and the effect reads as a
  // steady tending, not a storm-sized surge. Allocation-free (disturb() just pushes a
  // small record); safe under deep-time fast-forward because the warp decays on the REAL
  // frame clock (Simulation.updateDisturbance), so a faster clock does not make it stronger.
  behave(simulation, seasonManager, dt = 1) {
    super.behave(simulation, seasonManager, dt);
    if (!this.alive) return;

    const M = (typeof LEVEL_MECHANICS !== 'undefined') ? LEVEL_MECHANICS : null;
    if (!M || !M.kiwiSoilTurning || typeof simulation.disturb !== 'function') return;

    const working = this.isFeeding ||
      this.currentState === MOA_STATE.FEEDING || this.currentState === MOA_STATE.FORAGING;
    if (!working) return;

    this._probeTimer -= dt;
    if (this._probeTimer > 0) return;
    this._probeTimer = ((M.kiwiProbeInterval || 150) + random(60));

    // Forest floor only — a kiwi turns leaf litter, not open ground.
    const terrain = this.terrain;
    if (terrain && typeof terrain.getBiomeAt === 'function') {
      const biome = terrain.getBiomeAt(this.pos.x, this.pos.y);
      if (biome && !KIWI_FOREST_BIOMES.has(biome.key)) return;
    }

    simulation.disturb(
      this.pos.x, this.pos.y,
      M.kiwiWarpRadius || 34,
      'kiwi',
      M.kiwiWarpStrength || 0.22
    );
  }
}

// ------------------------------------------------------------
// SPECIES DATA — the North Island brown kiwi (Apteryx mantelli). Registered under the
// `moa` base type in initializeRegistry (sketch.js), carrying `class: Kiwi`.
// ------------------------------------------------------------
const KIWI_SPECIES = {
  north_island_brown_kiwi: {
    displayName:    "North Island Brown Kiwi",
    scientificName: "Apteryx mantelli",
    class:          (typeof Kiwi !== 'undefined') ? Kiwi : undefined,  // per-species behaviour class
    spriteSet:      'kiwi',               // dedicated multi-state art — sprites/Moa/Kiwi/ (renders untinted)
    tint:           [110, 84, 60],        // earthy russet-brown (unused while spriteSet is set — kept per convention)
    highlightColor: [170, 128, 92],       // warm brown — player highlight (pulse + UI border)
    description:    "Cryptic forest-floor kiwi — probes the leaf litter and, working the ground, keeps the forest floor lush.",
    rarity:         'common',

    // NOT open-country: the kiwi is the forest bird, so it gets NO tussock-in-glacial lift.
    // This is the deliberate mirror of the goose/mōho — see the file header.
    // openCountry: (absent)

    // Physical — small, among the smallest of the cast (near the little bush moa).
    size: { min: 7, max: 9 },
    bodyColor: { r: [95, 120], g: [72, 92], b: [50, 66] },

    // Movement — an unhurried prober that can still scurry into cover when flushed.
    baseSpeed: 0.14,
    fleeSpeed: 0.5,
    maxForce: 0.026,      // nimble in the undergrowth

    // Survival — small body, modest appetite. Like the mōho it kept getting pinned at
    // its floor and reading as absent, so it depletes more slowly and wins more per bite
    // (eatGainMult, applied in Moa.forage) — enough to hold a small standing population.
    maxHunger: 70,
    baseHungerRate: 0.022,   // was 0.028 — gentler depletion so the forest kiwi isn't always critical
    eatGainMult: 1.3,        // +30% food per bite (paired with the reduced rate)
    hungerThreshold: 30,
    criticalHunger: 58,

    // Reproduction — famously SLOW: one enormous egg, long incubation, few young. A
    // K-selected forest bird, so it stays uncommon rather than filling the canopy (paired
    // with the per-species carrying target in the scaffold).
    eggCooldownTime: 1300,
    securityTimeBase: 1000,
    securityTimeVariation: 450,

    // Habitat — closed lowland-to-montane forest floor (podocarp 0.30–0.40 up through
    // montane 0.40–0.60). Above the coast-hugging goose and the mōho's grassland band.
    preferredElevation: { min: 0.28, max: 0.55 },
    temperatureTolerance: { cold: 0.55, heat: 0.55 },

    // Behaviour — solitary/pair territorial, heads-down and cryptic. Low flock tendency
    // strengthens separation so pairs space out; low curiosity (a heads-down prober);
    // wary but relies on crypsis more than flushing.
    flockTendency: 0.3,
    curiosity: 0.3,
    flightiness: 0.5,

    // Cryptic and near-nocturnal: the diurnal harrier seldom finds one (highest camouflage
    // of the cast). A little heft on top of that.
    camouflage: 0.6,
    eagleResistance: 0.1,

    // Forest-seeker: bias migration targets toward dense tree cover (even more than the
    // little bush moa's 0.8), so it tracks the forest as the band shifts with the climate.
    forestAffinity: 0.9,

    // Cold is HARDER for the kiwi — the exact opposite of the open-country grazers. Keyed
    // by GLACIAL PHASE (interglacial/cooling/glacial/fullGlacial), the deep-time clock's
    // key (NOT summer/winter, which read undefined→1 and did nothing — see the memory
    // seasonal-modifiers-key-mismatch). hungerRate <1 = thrives, >1 = struggles; it rides
    // on the shared per-phase modifier, so the glacial stays globally hard and this only
    // decides that the forest kiwi feels it MORE as its canopy contracts.
    seasonalModifiers: {
      interglacial: { hungerRate: 0.9,  speed: 1.0  },   // thrives in the full interglacial forest
      cooling:      { hungerRate: 1.0,  speed: 1.0  },
      glacial:      { hungerRate: 1.1,  speed: 0.92 },
      fullGlacial:  { hungerRate: 1.18, speed: 0.88 }    // the forest is a low refuge; the kiwi is pinched
    }
  }
};

if (typeof window !== 'undefined') {
  window.Kiwi = Kiwi;
  window.KIWI_SPECIES = KIWI_SPECIES;
}
