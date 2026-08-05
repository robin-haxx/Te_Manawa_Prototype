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
  noiseScale: 0.035,
  octaves: 6,           // detail layers (more = busier)
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

// ---- GEO: the geography skeleton's shaping of the land (the RANGES) ---------
// GEN authors the procedural noise; GEO authors how the SVG skeleton
// (geo/manawatu.geo.js) reshapes it into the ranges — crest relief, the NE–SW
// spine, the N/S edge ease, and each range's authored height / spread / footprint.
// Edit → GEO.apply() (or press G) regenerates the same land with the change.
//   GEO.show()  overlays the range footprints + spine axes on the map (key R), so you
//               can see exactly what each range affects while you tune it.
//   GEO.uplift(v)  previews the ranges at any maturity 0..1 without moving the clock.
const GEO = {
  relief: 0.50,        // → LOOK.rangeRelief — valley depth vs crest (0 = flat plateau)
  spine: 0.45,         // → LOOK.rangeSpine  — crest concentration on the range's long axis
  edgeMargin: 0.10,    // → terrain._geoEdgeMargin — ease the N/S edges down to plains

  _overlay: false,

  _terrain() { return (typeof game !== 'undefined' && game) ? game.terrain : null; },
  _bake() { if (typeof game !== 'undefined' && game && game.rebakeTerrain) game.rebakeTerrain(); return this; },

  // Pull the live values in (do this first, or just read GEO.dump()).
  sync() {
    if (typeof LOOK !== 'undefined') {
      if (LOOK.rangeRelief != null) this.relief = LOOK.rangeRelief;
      if (LOOK.rangeSpine  != null) this.spine  = LOOK.rangeSpine;
    }
    const t = this._terrain();
    if (t && t._geoEdgeMargin != null) this.edgeMargin = t._geoEdgeMargin;
    return this;
  },

  // Write GEO → LOOK + terrain, regenerate the SAME land, re-bake (key G).
  apply() {
    if (typeof LOOK !== 'undefined') { LOOK.rangeRelief = this.relief; LOOK.rangeSpine = this.spine; }
    const t = this._terrain(); if (t) t._geoEdgeMargin = this.edgeMargin;
    if (typeof CONFIG !== 'undefined') CONFIG.geoEdgeMargin = this.edgeMargin;
    return this._bake();
  },

  // Batch-edit the shaping params + regenerate, e.g. GEO.set({ spine: 0.6, relief: 0.4 }).
  set(obj) {
    if (obj) {
      if (obj.relief != null) this.relief = obj.relief;
      if (obj.spine != null) this.spine = obj.spine;
      if (obj.edgeMargin != null) this.edgeMargin = obj.edgeMargin;
    }
    return this.apply();
  },

  // Per-range editing — writes the geo SOURCE (geo.ranges[i]) so _prepGeo picks it up on
  // the regenerate. i indexes GEO.list().
  range(i, opts) {
    const t = this._terrain();
    if (!t || !t.geo || !t.geo.ranges || !t.geo.ranges[i]) { console.warn('[GEO] no range', i); return this; }
    if (opts) {
      if (opts.height != null) t.geo.ranges[i].height = opts.height;
      if (opts.spread != null) t.geo.ranges[i].spread = opts.spread;
    }
    return this._bake();
  },
  height(i, v) { return this.range(i, { height: v }); },
  spread(i, v) { return this.range(i, { spread: v }); },

  // Preview the ranges at any maturity (0..1) WITHOUT moving the clock — isolates uplift,
  // so the river/emergence stay where the current date puts them. null = date-driven again.
  uplift(v) {
    const t = this._terrain(); if (!t) return this;
    t._geoUpliftOverride = (v == null) ? null : (v < 0 ? 0 : v > 1 ? 1 : v);
    return this._bake();
  },

  // The visual overlay (also toggled by the R key). No re-bake — drawn each frame.
  show()   { this._overlay = true;  console.log('[GEO] range overlay ON — footprints (gold) + spine axes (red). GEO.hide() to clear'); return this; },
  hide()   { this._overlay = false; return this; },
  toggle() { this._overlay = !this._overlay; return this; },

  // Print each range as authored + its derived spine axis.
  list() {
    const t = this._terrain();
    if (!t || !t._geoRanges) { console.warn('[GEO] no terrain yet'); return this; }
    console.log('[GEO] ranges  (i:  height  spread  centroid(u,v)  spine°):');
    t._geoRanges.forEach((r, i) => {
      const ang = (Math.atan2(-r.perpX, r.perpY) * 180 / Math.PI).toFixed(0);
      console.log(`  #${i}   h=${r.height.toFixed(2)}   spread=${r.spread.toFixed(2)}   c=(${r.cx.toFixed(2)}, ${r.cy.toFixed(2)})   spine=${ang}°   (${r.poly.length} pts)`);
    });
    if (t._geoRivers && t._geoRivers.length) console.log(`  + ${t._geoRivers.length} river(s) — shaping knobs live in LOOK (riverIncise, riverWaterT, riverBankT, …)`);
    return this;
  },

  dump() {
    const t = this._terrain();
    console.log('[GEO]', { relief: this.relief, spine: this.spine, edgeMargin: this.edgeMargin,
      upliftOverride: t ? (t._geoUpliftOverride != null ? t._geoUpliftOverride : 'date-driven') : null,
      overlay: this._overlay });
    return this;
  },

  reset() {
    if (typeof LOOK !== 'undefined' && LOOK._defaults) {
      if (LOOK._defaults.rangeRelief != null) this.relief = LOOK._defaults.rangeRelief;
      if (LOOK._defaults.rangeSpine  != null) this.spine  = LOOK._defaults.rangeSpine;
    }
    if (typeof game !== 'undefined' && game && game.currentLevel && game.currentLevel.terrain
        && game.currentLevel.terrain.geoEdgeMargin != null) this.edgeMargin = game.currentLevel.terrain.geoEdgeMargin;
    const t = this._terrain(); if (t) t._geoUpliftOverride = null;
    return this.apply();
  },

  // Drawn by Game.render when _overlay is on, INSIDE the terrain transform (local space
  // [0,mapW]×[0,projH]). Schematic: each range's footprint at crest height + its spine
  // axis + an index label, and the river line for context. Aligns with the lifted ground.
  _draw(t) {
    if (!t || !t._geoRanges || typeof Projection === 'undefined') return;
    const mapW = t.mapWidth, mapH = t.mapHeight, K = Projection.K, LIFT = Projection.LIFT;
    const up = (t._geoT && t._geoT.uplift != null) ? t._geoT.uplift : 1;
    const iz = 1 / ((typeof CONFIG !== 'undefined' && CONFIG.viewZoom) ? CONFIG.viewZoom : 1);
    push();
    if (t._geoRivers) for (const rv of t._geoRivers) {
      stroke(90, 175, 225, 170); strokeWeight(2 * iz); noFill();
      beginShape();
      for (const p of rv.pts) vertex(p[0] * mapW, (p[1] * mapH) * K - 0.06 * LIFT + LIFT);
      endShape();
    }
    for (let i = 0; i < t._geoRanges.length; i++) {
      const r = t._geoRanges[i];
      const crest = (r.height || 0.85) * up;
      const yOf = (v) => (v * mapH) * K - crest * LIFT + LIFT;   // paint y at the crest height
      stroke(255, 205, 70); strokeWeight(2.5 * iz); noFill();
      beginShape();
      for (const p of r.poly) vertex(p[0] * mapW, yOf(p[1]));
      endShape(CLOSE);
      const axX = r.perpY, axY = -r.perpX;                       // long axis ⟂ crest-falloff perp
      let half = 0;
      for (const p of r.poly) { const d = Math.abs((p[0] - r.cx) * axX + (p[1] - r.cy) * axY); if (d > half) half = d; }
      stroke(255, 80, 80); strokeWeight(3 * iz);
      line((r.cx - axX * half) * mapW, yOf(r.cy - axY * half), (r.cx + axX * half) * mapW, yOf(r.cy + axY * half));
      const lx = r.cx * mapW, ly = yOf(r.cy);
      textSize(14 * iz); textAlign(CENTER, CENTER);
      noStroke(); fill(20, 20, 20, 200); text('#' + i, lx + 1.2 * iz, ly + 1.2 * iz);
      fill(255, 235, 130); text('#' + i, lx, ly);
    }
    pop();
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
  RANGES — GEO.*        the SVG skeleton's shaping of the land, then press  G
    GEO.show()          overlay the range footprints + spine axes  (key: R)
    GEO.list()          print each range (height, spread, spine axis)
    GEO.set({spine:0.6}) crest on the NE–SW axis · {relief:0.4} valley depth
    GEO.height(0,0.95)  edit one range's crest · GEO.spread(0,0.2) its reach
    GEO.uplift(1)       preview mature ranges now · GEO.uplift(null) date-driven
    GEO.reset()         back to the authored range shaping
  KEYS   B re-bake paint · G apply land · N new seed · R range overlay · D debug · SHIFT+F footprint
  Everything re-bakes in place — no page reload, same ecosystem.`);
    return DEV;
  },
  dump()  { if (typeof LOOK !== 'undefined' && LOOK.dump) LOOK.dump(); GEN.dump(); if (typeof GEO !== 'undefined') GEO.dump(); return DEV; },
  reset() { if (typeof LOOK !== 'undefined' && LOOK.reset) LOOK.reset(); GEN.reset(); if (typeof GEO !== 'undefined') GEO.reset(); return DEV; }
};
