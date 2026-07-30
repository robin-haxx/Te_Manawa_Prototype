// ============================================================================
// TE MANAWA — dev console tools
// ============================================================================
// A console-first workflow for developing the piece live, with NO page reload.
// Two editable globals plus an umbrella:
//
//   LOOK  paint / illustration (colour, cel shading, ink, haze …). Data lives in
//         TeManawa_terrain.js; the helpers below are added here.
//   GEN   landform generation (the noise: octaves, ridges, coastline …).
//   DEV   umbrella — DEV.help() prints the cheatsheet.
//
// The loop is always: edit a value in the console → press a key (or call apply)
// → it re-bakes in place, same land, same ecosystem, no reload. Full reference:
// md/TEMANAWA_DEVTOOLS.md.
//
// Authoring only. The kiosk wall is locked to keys 1–4 and never reaches B/G/N.

// ---- LOOK: extend the paint knobs ------------------------------------------
// (LOOK's *data* is defined in TeManawa_terrain.js so the bake can read it; this
//  block just bolts convenience methods onto that same object.)
(function () {
  if (typeof LOOK === 'undefined') return;

  // The on/off illustration moves (for solo()/all()).
  LOOK._toggles = ['posterize', 'wobble', 'outlines', 'shore', 'shade', 'haze', 'quiet', 'reliefEdge'];

  // Snapshot the authored (source) values now, for reset().
  LOOK._defaults = (function () {
    const o = {};
    for (const k in LOOK) { const v = LOOK[k]; if (typeof v !== 'function' && k[0] !== '_') o[k] = v; }
    return o;
  })();

  const bake = function () {
    if (typeof game !== 'undefined' && game && game.rebakeTerrain) game.rebakeTerrain();
    return LOOK;
  };

  LOOK.bake  = bake;                                              // apply current LOOK, re-bake
  LOOK.set   = function (obj) { if (obj) Object.assign(LOOK, obj); return bake(); };   // batch edit + bake
  LOOK.all   = function (v)   { for (const k of LOOK._toggles) LOOK[k] = !!v; return bake(); };
  LOOK.solo  = function (name){ for (const k of LOOK._toggles) LOOK[k] = (k === name); return bake(); };
  LOOK.reset = function ()    { Object.assign(LOOK, LOOK._defaults); return bake(); };
})();

// ---- GEN: landform generation (the noise) ----------------------------------
// The terrain reads octaves/persistence/lacunarity/ridgeInfluence/elevationPower/
// lakes from CONFIG, and the *effective* noiseScale from the terrain instance
// (fit mode rescales it). GEN is a live editor over those: GEN.sync() pulls the
// running values in, you edit, GEN.apply() writes them back and regenerates the
// SAME land, GEN.reseed() draws a NEW one.
const GEN = {
  // Feature size. This is the EFFECTIVE value the noise uses (fit mode has already
  // rescaled the level's authored noiseScale into it); tune it directly here.
  noiseScale: 0.005,
  octaves: 3,           // detail layers (more = busier)
  persistence: 0.3,     // how much each finer octave contributes (roughness)
  lacunarity: 3.0,      // frequency step between octaves
  ridgeInfluence: 1.3,  // blend of ridged vs smooth noise (sharper ranges)
  elevationPower: 1.5,  // contrast: >1 pushes lowlands down, peaks up
  useLakes: false,      // inland lake basins instead of a coastal island
  lakeThreshold: 0.12,
  lakeNoiseScale: 0.008,

  // CONFIG-backed params (noiseScale is handled on its own — it is per-instance).
  _keys: ['octaves', 'persistence', 'lacunarity', 'ridgeInfluence', 'elevationPower',
          'useLakes', 'lakeThreshold', 'lakeNoiseScale'],

  // Pull the values the game is actually running with into GEN.
  sync() {
    if (typeof CONFIG !== 'undefined') for (const k of this._keys) if (k in CONFIG) this[k] = CONFIG[k];
    if (typeof game !== 'undefined' && game && game.terrain) this.noiseScale = game.terrain.noiseScale;
    else if (typeof CONFIG !== 'undefined') this.noiseScale = CONFIG.noiseScale;
    return this;
  },

  // Write GEN → the running config + terrain, regenerate the SAME land, re-bake.
  apply() {
    if (typeof CONFIG !== 'undefined') {
      for (const k of this._keys) CONFIG[k] = this[k];
      CONFIG.noiseScale = this.noiseScale;
    }
    if (typeof game !== 'undefined' && game && game.terrain) {
      game.terrain.noiseScale = this.noiseScale;   // effective value (bypasses the fit rescale while tuning)
      if (game.rebakeTerrain) game.rebakeTerrain();
    }
    return this;
  },

  // New random landform (fresh seed) with the current params.
  reseed() {
    if (typeof game !== 'undefined' && game && game.terrain) {
      game.terrain.seed = Math.random() * 10000;
      this.apply();
    }
    return this;
  },

  // Restore the level's authored terrain params, then apply.
  reset() {
    if (typeof game !== 'undefined' && game && game.currentLevel && game.currentLevel.terrain) {
      Object.assign(this, game.currentLevel.terrain);
    }
    return this.apply();
  },

  dump() {
    const o = {};
    for (const k in this) { const v = this[k]; if (typeof v !== 'function' && k[0] !== '_') o[k] = v; }
    console.log('[GEN]', o);
    return o;
  }
};

// ---- DEV: umbrella + cheatsheet --------------------------------------------
const DEV = {
  help() {
    console.log(
`Te Manawa dev console — md/TEMANAWA_DEVTOOLS.md
  PAINT — LOOK.*        edit a value, then press  B  (or LOOK.bake())
    LOOK.dump()         print current settings
    LOOK.solo('shade')  isolate one move (every other illustration toggle off)
    LOOK.all(false)     all moves off   ·   LOOK.all(true) all on
    LOOK.set({shadeSteps:4, bakeScale:3})    batch edit + bake
    LOOK.reset()        back to the authored defaults
  LAND — GEN.*          edit a value, then press  G  (or GEN.apply())
    GEN.sync()          load the values the game is running with
    GEN.dump()          print current settings
    GEN.reseed()        new random landform      (key: N)
    GEN.reset()         back to the level's authored terrain
  KEYS   B re-bake paint · G apply land · N new seed · D debug · SHIFT+F footprint
  Everything re-bakes in place — no page reload, same ecosystem.`);
    return DEV;
  },
  dump()  { if (typeof LOOK !== 'undefined' && LOOK.dump) LOOK.dump(); GEN.dump(); return DEV; },
  reset() { if (typeof LOOK !== 'undefined' && LOOK.reset) LOOK.reset(); GEN.reset(); return DEV; }
};
