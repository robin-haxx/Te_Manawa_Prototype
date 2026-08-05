// TeManawa_seasons.js
//
// GLACIAL CYCLE — not seasons.
// =============================================================================
// This module is parent-game residue. It began life as a four-SEASON cycle on a
// short frame timer. In Te Manawa there are no seasons — there is only the
// glacial cycle, and it is keyed to DEEP TIME.
//
// The class name (SeasonManager) and its method/field names are KEPT so the ~8
// files that call into it keep working unchanged. But everything it MODELS is now
// a point on the interglacial → full-glacial gradient, and its DRIVER is
// Climate.glacialIndexAt(DeepTime.yearsBP), NOT a timer. Nothing here cycles on
// its own any more; scrub the deep-time clock and the cold state follows.
//
//   phase   = interglacial | cooling | glacial | fullGlacial   (warm → cold)
//   winterness (kept name) == the glacial index, 0..1
//
// The four phases also key the four baked terrain buffers and their snow lines
// (TerrainGenerator.seasonBuffers / seasonSnowLines). See
// md/TEMANAWA_DEEPTIME_ECOLOGY_PLAN.md §1.1.
// =============================================================================

// ============================================
// GLACIAL PHASE DEFINITIONS  (warmest → coldest)
// ============================================
// These are the anchors the deep-time glacial index blends between. Modifiers
// use REAL biome keys (sea/coastal/grassland/podocarp/montane/subalpine/…) and
// REAL plant types (tussock/flax/fern/rimu/beech); anything missing falls back
// to 1.0. No `icon` field — visitor-facing UI is drawn glyphs only, no emoji.
const GLACIAL_PHASES = {
  interglacial: {
    name: "Interglacial",
    color: '#6ba36b',
    plantModifiers: { coastal: 1.0, grassland: 1.0, podocarp: 1.2, montane: 1.2, subalpine: 0.9 },
    plantTypeModifiers: { rimu: 1.4, beech: 1.3, fern: 1.4, tussock: 0.7, flax: 0.9 },
    preferredElevation: { min: 0.40, max: 0.72 },   // moa range high into forest / subalpine
    migrationStrength: 0.5,
    hungerModifier: 0.9,
    snowLine: 0.92,
    description: "Forest climbs high; the ranges green to the treeline.",
    dormancyElevation: null,
    dormancyChance: 0
  },

  cooling: {
    name: "Cooling",
    color: '#8a9a5b',
    plantModifiers: { coastal: 0.9, grassland: 1.1, podocarp: 1.0, montane: 0.8, subalpine: 0.8 },
    plantTypeModifiers: { rimu: 1.0, beech: 1.0, fern: 0.9, tussock: 1.0, flax: 1.0 },
    preferredElevation: { min: 0.32, max: 0.60 },
    migrationStrength: 0.6,
    hungerModifier: 1.0,
    snowLine: 0.80,
    description: "The treeline eases downslope; scrub gains the tops.",
    dormancyElevation: 0.62,
    dormancyChance: 0.3,
    dormancyAbove: true
  },

  glacial: {
    name: "Glacial",
    color: '#b7b393',
    plantModifiers: { coastal: 0.8, grassland: 1.2, podocarp: 0.6, montane: 0.4, subalpine: 0.6 },
    plantTypeModifiers: { rimu: 0.6, beech: 0.6, fern: 0.4, tussock: 1.3, flax: 1.1 },
    preferredElevation: { min: 0.22, max: 0.48 },
    migrationStrength: 0.8,
    hungerModifier: 1.15,
    snowLine: 0.67,
    description: "Forest falls back to sheltered pockets; tussock takes the flats.",
    dormancyElevation: 0.50,
    dormancyChance: 0.5,
    dormancyAbove: true
  },

  fullGlacial: {
    name: "Full glacial",
    color: '#cfd3d6',
    plantModifiers: { coastal: 0.7, grassland: 1.0, podocarp: 0.3, montane: 0.15, subalpine: 0.4 },
    plantTypeModifiers: { rimu: 0.3, beech: 0.3, fern: 0.15, tussock: 1.4, flax: 1.0 },
    preferredElevation: { min: 0.15, max: 0.40 },   // moa forced onto the low outwash flats
    migrationStrength: 1.0,
    hungerModifier: 1.3,
    snowLine: 0.55,
    description: "Grassland and herbfield; forest only in the refugia. Tree ferns gone.",
    dormancyElevation: 0.38,
    dormancyChance: 0.65,
    dormancyAbove: true
  }
};

// Back-compat alias in case any older reference still reads SEASONS.
const SEASONS = GLACIAL_PHASES;

// ============================================
// MIGRATION COPY — keyed by glacial phase (co-design placeholder text)
// ============================================
const MIGRATION_PATTERNS = {
  upland_moa: {
    interglacial: { current: "Upland Moa graze the high subalpine meadows.",  upcoming: "As the cold comes on, they will move downhill." },
    cooling:      { current: "Upland Moa are moving down off the tops.",      upcoming: "They will shelter in the forest as the glacial deepens." },
    glacial:      { current: "Upland Moa hold in the forest pockets.",        upcoming: "If it warms, they will climb back to the meadows." },
    fullGlacial:  { current: "Upland Moa crowd the last forest refugia.",     upcoming: "They wait out the ice on the sheltered ground." }
  }
};

const MIGRATION_HINTS = {
  upland_moa: {
    interglacial: { direction: '↑', text: 'High meadows',   detail: 'Ranging into subalpine and forest' },
    cooling:      { direction: '↓', text: 'Moving downhill', detail: 'Descending as the treeline drops' },
    glacial:      { direction: '↓', text: 'Forest pockets',  detail: 'Holding in sheltered refugia' },
    fullGlacial:  { direction: '·', text: 'On the flats',    detail: 'Forced onto the low outwash country' }
  },
  little_bush_moa: {
    interglacial: { direction: '·', text: 'In the forest', detail: 'Closed-forest bird, broad canopy' },
    cooling:      { direction: '·', text: 'Forest holds',  detail: 'Canopy still broad' },
    glacial:      { direction: '·', text: 'Forest shrinks', detail: 'Crowding the refugia' },
    fullGlacial:  { direction: '·', text: 'Refugia only',  detail: 'Confined to sheltered pockets' }
  },
  stout_legged_moa: {
    interglacial: { direction: '↓', text: 'Open ground', detail: 'Grazing flats and margins' },
    cooling:      { direction: '↓', text: 'Open ground', detail: 'Browsing spreading shrubland' },
    glacial:      { direction: '↓', text: 'Grassland',   detail: 'The open country suits it' },
    fullGlacial:  { direction: '↓', text: 'Grassland',   detail: 'At home on the glacial flats' }
  }
};

// ============================================
// GLACIAL-PHASE MANAGER  (named SeasonManager for call-site compatibility)
// ============================================
class SeasonManager {
  constructor(config) {
    this.config = config;
    // Warm → cold. Field kept as `seasonOrder` because TeManawa_placeable.js reads
    // it directly; it now holds GLACIAL PHASE keys, not seasons.
    this.seasonOrder = ['interglacial', 'cooling', 'glacial', 'fullGlacial'];
    this.currentSeasonIndex = (config && config.startSeasonIndex) ? config.startSeasonIndex : 0;
    this.transitionProgress = 0;
    this.justChanged = false;
    this.glacialIndex = 0;              // the driver, sampled each update from deep time

    // Reusable elevation object (avoid allocation per call)
    this._elevationResult = { min: 0, max: 0 };

    // Forest-band cache (recomputed at most once per frame)
    this._fbFrame = -1;
    this._fbCache = null;
  }

  get current()    { return GLACIAL_PHASES[this.seasonOrder[this.currentSeasonIndex]]; }
  get currentKey() { return this.seasonOrder[this.currentSeasonIndex]; }
  // Next COLDER phase, clamped (full glacial has no colder neighbour — no wrap).
  get next()       { return GLACIAL_PHASES[this.seasonOrder[Math.min(this.currentSeasonIndex + 1, this.seasonOrder.length - 1)]]; }
  get nextKey()    { return this.seasonOrder[Math.min(this.currentSeasonIndex + 1, this.seasonOrder.length - 1)]; }
  get progress()   { return this.glacialIndex || 0; }   // repurposed: how deep into the cold

  // 0..1 "winterness" — KEPT NAME, now == the glacial index (0 interglacial, 1 full
  // glacial). Every cold response (frost haze, moa habitat stress, breeding, forest
  // competition) reads this, so re-sourcing it here rebinds the whole sim to deep
  // time at one point.
  getWinterness() {
    return this.glacialIndex != null ? this.glacialIndex : 0;
  }

  _sampleGlacialIndex() {
    if (typeof Climate === 'undefined') return this.glacialIndex || 0;
    const yr = (typeof DeepTime !== 'undefined') ? DeepTime.yearsBP : this.config.yearsStart;
    return Climate.glacialIndexAt(yr);
  }

  // Driven by the deep-time glacial index, NOT dt. Maps g∈[0,1] onto the four
  // phases (p = g·3): the floor is the current phase, the next colder phase is the
  // blend target, and the fraction is transitionProgress — so the snow line, the
  // baked-buffer crossfade and every modifier glide continuously across the cycle.
  // Returns true when the discrete phase index changes (a phase boundary crossed),
  // which Game/Simulation use to fire onSeasonChange().
  update(dt = 1) {
    this.justChanged = false;
    const g = this._sampleGlacialIndex();
    this.glacialIndex = g;

    const n = this.seasonOrder.length;                 // 4
    const p = g * (n - 1);                              // 0..3
    let idx = Math.floor(p);
    if (idx < 0) idx = 0; else if (idx > n - 1) idx = n - 1;
    this.transitionProgress = (idx >= n - 1) ? 0 : (p - idx);

    if (idx !== this.currentSeasonIndex) {
      this.currentSeasonIndex = idx;
      this.justChanged = true;
      return true;
    }
    return false;
  }

  // ============================================
  // UNIFIED LERP HELPER
  // ============================================

  /** Value from the current phase, blended toward the next colder phase. */
  _lerpSeasonal(getCurrentVal, getNextVal) {
    const current = getCurrentVal();
    if (this.transitionProgress > 0) {
      return lerp(current, getNextVal(), this.transitionProgress);
    }
    return current;
  }

  // ============================================
  // SNOW & WEATHER
  // ============================================

  getSnowLineElevation() {
    return this._lerpSeasonal(
      () => this.current.snowLine,
      () => this.next.snowLine
    );
  }

  isSeasonalSnow(elevation) {
    return elevation >= this.getSnowLineElevation();
  }

  getSnowCoverage(elevation) {
    const snowLine = this.getSnowLineElevation();
    const fullSnowLine = 0.9;

    if (elevation >= fullSnowLine) return 1.0;
    if (elevation >= snowLine) return map(elevation, snowLine, fullSnowLine, 0.3, 1.0);
    return 0;
  }

  // Forest productive band — contracts as the glacial deepens (treeline drops,
  // forest falls back to refugia). Lerped smoothly per frame like the snow line, so
  // no biome reclassification is needed (avoids stutter). Cached per frame. Returns
  // null unless the level opts in via LEVEL_MECHANICS.forestContraction +
  // forestBandByStage (keyed by the four glacial phases). See plan §1.3.
  getForestBand() {
    const M = (typeof LEVEL_MECHANICS !== 'undefined') ? LEVEL_MECHANICS : null;
    const bands = M && M.forestContraction && (M.forestBandByStage || M.forestBandBySeason);
    if (!bands) return null;
    if (this._fbFrame === frameCount) return this._fbCache;
    const cur = bands[this.currentKey] || M.forestBand;
    let band;
    if (this.transitionProgress > 0) {
      const nxt = bands[this.nextKey] || cur;
      band = {
        min: lerp(cur.min, nxt.min, this.transitionProgress),
        max: lerp(cur.max, nxt.max, this.transitionProgress)
      };
    } else {
      band = { min: cur.min, max: cur.max };
    }
    this._fbFrame = frameCount;
    this._fbCache = band;
    return band;
  }

  // ============================================
  // PLANT MODIFIERS
  // ============================================

  getPlantTypeModifier(plantType) {
    return this._lerpSeasonal(
      () => this.current.plantTypeModifiers?.[plantType] || 1.0,
      () => this.next.plantTypeModifiers?.[plantType] || 1.0
    );
  }

  getPlantModifier(biomeKey) {
    return this._lerpSeasonal(
      () => this.current.plantModifiers[biomeKey] || 1.0,
      () => this.next.plantModifiers[biomeKey] || 1.0
    );
  }

  // ============================================
  // MOA MODIFIERS
  // ============================================

  getHungerModifier() {
    return this._lerpSeasonal(
      () => this.current.hungerModifier,
      () => this.next.hungerModifier
    );
  }

  getMigrationStrength() {
    return this._lerpSeasonal(
      () => this.current.migrationStrength,
      () => this.next.migrationStrength
    );
  }

  getPreferredElevation() {
    const cur = this.current.preferredElevation;
    const result = this._elevationResult;

    if (this.transitionProgress > 0) {
      const nxt = this.next.preferredElevation;
      result.min = lerp(cur.min, nxt.min, this.transitionProgress);
      result.max = lerp(cur.max, nxt.max, this.transitionProgress);
    } else {
      result.min = cur.min;
      result.max = cur.max;
    }

    return result;
  }

  // ============================================
  // DORMANCY
  // ============================================

  shouldPlantBeDormant(elevation, biomeKey) {
    const phase = this.current;
    if (!phase.dormancyElevation || phase.dormancyChance <= 0) return false;

    return phase.dormancyAbove
      ? elevation > phase.dormancyElevation
      : elevation < phase.dormancyElevation;
  }

  getDormancyChance() {
    return this.current.dormancyChance || 0;
  }

  // ============================================
  // MIGRATION MESSAGING
  // ============================================

  _getSpeciesPresent(moas) {
    const species = new Set();
    for (const moa of moas) {
      if (moa.alive && moa.speciesKey) species.add(moa.speciesKey);
    }
    return species;
  }

  getMigrationMessages(moas) {
    const messages = { current: null, upcoming: null };

    for (const speciesKey of this._getSpeciesPresent(moas)) {
      const pattern = MIGRATION_PATTERNS[speciesKey];
      if (!pattern) continue;

      const phaseData = pattern[this.currentKey];
      if (phaseData) {
        if (phaseData.current) messages.current = phaseData.current;
        if (phaseData.upcoming) messages.upcoming = phaseData.upcoming;
      }
    }

    return messages;
  }

  getMigrationHint(moas) {
    for (const speciesKey of this._getSpeciesPresent(moas)) {
      const speciesHints = MIGRATION_HINTS[speciesKey];
      if (speciesHints) return speciesHints[this.currentKey] || null;
    }
    return null;
  }
}
