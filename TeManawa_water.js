// ============================================
// WATER LAYER — animated river flow, eels, sea shimmer
// ============================================
// A per-frame overlay of small looping sprite decals stamped onto the water. It
// exists because the terrain is BAKED: TerrainGenerator.render() is a pure blit
// of four pre-baked season buffers (md/TEMANAWA_BUILD_V3.md §5), so nothing in
// the bake can animate. Animated water therefore has to be an overlay drawn each
// frame over the baked ground — and the cheapest, most on-brand way is the
// engine's own pooled-sprite animation model, not a full-surface shader (the
// renderer is 2D, and a large animated luminance plane would fight the ≤3
// luminance-transitions/sec photosensitivity budget). The decals are small,
// sparse and low-contrast, so they never trip that budget.
//
// WHERE the water is, and WHICH WAY it flows, is already in the terrain data:
//   terrain.waterTypeAt(x,y)  0 land · 1 sea (flat) · 2 river (rides terrain)
//   terrain.getRivers()       the authored river polylines, normalised 0..1
// A decal sits on the water surface via the SAME projection every entity uses —
// Projection.groundY(y, elev) — so it lines up with the baked ground for free.
// Sea is drawn flat (elev 0, matching the bake's liftE=0 for sea); river decals
// and eels ride the terrain elevation like the moa do.
//
// Lifecycle: build() does a FULL (re)stamp on a hard scene change — init, look re-bake,
// eruption. Each deep-time morph re-bake instead calls reconcile() (Game._onMorphComplete),
// which only ADDS/REMOVES decals as the coastline moves and leaves every surviving decal in
// place — so the sea shimmer follows the receding/advancing shore without twitching. Both work
// off fixed, deterministic candidate slots (positions are geometry, never random). NEITHER runs
// on the cheap keep-terrain soft reset, so that path stays in its ~20 ms tier (§5.1). reconcile()
// is throttled to at most one call per CONFIG.morphMinMs and trails a full season bake, so it is
// off the frame hot path; update()/render() allocate nothing.

class WaterLayer {
  constructor() {
    this.terrain = null;
    this.enabled = true;
    this.decals = [];        // sea shimmer + river current + glints (mixed, drawn in order)
    this.eels = [];          // tuna/eels travelling the main-river polylines (deep-time feature)
    this.fish = [];          // a school of smaller fish on every river (always present)
    this._capped = false;    // true if a placement hit the maxDecals cap (logged, never silent)
    this._probe = { _x: 0, _y: 0, _angle: 0 };   // scratch for path sampling — no per-call alloc

    // Deterministic candidate SLOTS: every possible decal position (sea-grid points + river-step
    // points), computed from GEOMETRY alone — never random() — so a given slot always maps to the
    // same world point. reconcile() toggles a decal on/off per slot as the coastline moves without
    // ever shifting a surviving decal. Cached per footprint (see _slotsKey).
    this._slots = null;
    this._slotsKey = '';
    this._flowRev = false;    // last-seen main-stem flow direction (flips seaward at ~0.6 Ma) — drives eel re-orient

    // Tuning; held on the INSTANCE, never written back to CONFIG (same rule as
    // TerrainGenerator.noiseScale / Projection.K). All world-pixel units.
    this.cfg = {
      riverStep:        46,     // spacing of current decals along a river polyline
      riverJitter:      0.35,   // lateral scatter, as a fraction of riverStep
      currentSize:      36,     // river-current decal size (50% larger than the first pass, per request)
      currentAlpha:     0.8,    // extra global multiplier on top of the strip's own alpha
      currentAnimSpeed: 0.09,
      glintChance:      0.15,   // chance a current decal also drops a sparkle
      glintAlpha:       0.7,
      seaSpacing:       100,    // grid spacing of sea-shimmer samples
      seaSize:          46,
      seaAlpha:         0.7,
      seaAnimSpeed:     0.05,   // slower than the river — the sea is calmer
      eelCount:         1,
      eelsFromYear:     500000,  // eels are a deep-time feature: absent until the clock reaches 500 ka (yearsBP <= this)
      eelSize:          24,
      eelAlpha:         0.9,
      eelSpeed:         0.4,    // world px per update tick (real time, not sim time)
      eelAnimSpeed:     0.06,
      // Fish — a small school travelling every river polyline (main + tributaries),
      // always present (no deep-time gate). A calm school: gentler than the tuna/eels
      // so the swim cycle actually reads (at the old 0.7 px/tick they streaked past
      // too fast to see the tail wag). 50% larger than the first pass.
      fishCount:        5,
      fishSize:         22,
      fishAlpha:        0.85,
      fishSpeed:        0.3,
      fishAnimSpeed:    0.14,
      maxDecals:        420,    // hard cap; counts toward the ≤1500 image()/frame budget
    };
  }

  _on() { return this.enabled && !(typeof LOOK !== 'undefined' && LOOK.water === false); }

  // Is a named strip registered? (Used to pick the '2' art variants only when they
  // actually loaded, so the placeholder path stays on the single strip.)
  _hasStrip(name) { return typeof SpriteStrips !== 'undefined' && SpriteStrips.has && SpriteStrips.has(name); }

  // Deep-time year in effect for eel presence. build()/reconcile() pass it explicitly (the year
  // the terrain was just baked to); when omitted, fall back to the live clock. eels appear only
  // once the clock has reached eelsFromYear (yearsBP <= 500 ka) — see _buildEels/reconcile.
  _resolveYear(year) {
    if (typeof year === 'number' && isFinite(year)) return year;
    if (typeof DeepTime !== 'undefined' && typeof DeepTime.yearsBP === 'number') return DeepTime.yearsBP;
    return -Infinity;   // no clock available — do not suppress eels
  }
  _eelsAllowed(year) { return this._resolveYear(year) <= (this.cfg.eelsFromYear ?? 500000); }

  // FULL (re)build — a hard scene change (init, look re-bake, eruption). Stamps a decal on
  // every slot that is water NOW, and re-seeds the eels. Decals get a fresh animation phase,
  // which is fine here: the whole scene is being replaced. For the gentle deep-time coastline
  // retreat use reconcile() instead, so surviving decals do not jump.
  build(terrain, year) {
    this.terrain = terrain;
    this.decals.length = 0;
    this.eels.length = 0;
    this._capped = false;
    if (!terrain || typeof terrain.waterTypeAt !== 'function') return;
    if (typeof SpriteStrips !== 'undefined') SpriteStrips.ensurePlaceholders();

    const slots = this._computeSlots(terrain);   // force-recompute: geometry may have changed
    for (let i = 0; i < slots.length; i++) {
      if (this.decals.length >= this.cfg.maxDecals) { this._capped = true; break; }
      const s = slots[i];
      if (terrain.waterTypeAt(s.x, s.y) === s.needs) this.decals.push(this._mkDecal(s));
    }
    this._buildEels(terrain, year);   // gated: no eels before 500 ka
    this._buildFish(terrain);         // always present (every river)
    this._flowRev = !!(terrain.mainFlowReversed && terrain.mainFlowReversed());
    if (this._capped) console.warn(`[water] hit maxDecals ${this.cfg.maxDecals} — some water left un-stamped`);
  }

  // INCREMENTAL update for a deep-time morph: the coastline has moved, so a slot that is no
  // longer water loses its decal and a slot that has BECOME water gains one — but every decal
  // that is still over water stays exactly where it is, keeping its position AND its animation
  // phase (no random re-scatter, which is what made the sea shimmer twitch every re-bake). Only
  // river/eel decals ride the terrain, so their elevation is refreshed to the new bed; sea is
  // always flat. Eels travel the always-present main river and are never stranded, so they are
  // left running. Allocation is limited to the add/remove delta.
  reconcile(terrain, year) {
    this.terrain = terrain;
    if (!terrain || typeof terrain.waterTypeAt !== 'function') return;
    const slots = this._ensureSlots(terrain);

    // Eels are a deep-time feature. reconcile() runs on every morph, so this is where eels wink IN
    // as the clock crosses 500 ka (yearsBP <= eelsFromYear), and back OUT if a skip/reset jumps to
    // an older year before it. Also re-orients on the ~0.6 Ma flow flip while eels are present.
    const rev = !!(terrain.mainFlowReversed && terrain.mainFlowReversed());
    if (!this._eelsAllowed(year)) {
      this.eels.length = 0;
    } else if (this.eels.length === 0 || rev !== this._flowRev) {
      this._buildEels(terrain, year);   // appear on crossing 500 ka, or re-seed swimming the flipped flow
    }
    // Fish are always present and never stranded (they bounce off any dried stretch),
    // so a morph leaves the running school alone — only re-seed if it flipped flow or
    // somehow emptied (e.g. a footprint change dropped every path).
    if (this.fish.length === 0 || rev !== this._flowRev) this._buildFish(terrain);
    this._flowRev = rev;

    // Index the live decals by their slot id so survivors can be reused in place.
    const have = new Map();
    for (let i = 0; i < this.decals.length; i++) { const d = this.decals[i]; if (d.slot != null) have.set(d.slot, d); }

    const next = [];
    let capped = false;
    for (let i = 0; i < slots.length; i++) {
      const s = slots[i];
      if (terrain.waterTypeAt(s.x, s.y) !== s.needs) continue;   // no water here now → no decal (drop any survivor)
      if (next.length >= this.cfg.maxDecals) { capped = true; break; }
      const keep = have.get(s.id);
      if (keep) {
        if (s.needs === 2) keep.elev = terrain.getElevationAt(s.x, s.y);   // ride the (slowly deepening) bed; sea stays flat
        next.push(keep);                                                   // survivor: same x/y, same animTime — no jump
      } else {
        next.push(this._mkDecal(s));                                       // newly-watered slot: place a fresh decal
      }
    }
    this.decals = next;
    this._capped = capped;
    if (capped) console.warn(`[water] hit maxDecals ${this.cfg.maxDecals} — some water left un-stamped`);
  }

  update(dt) {
    if (!this._on()) return;
    const D = this.decals;
    for (let i = 0; i < D.length; i++) D[i].animTime += dt;
    this._stepSwimmers(this.eels, this.cfg.eelSpeed, dt);
    this._stepSwimmers(this.fish, this.cfg.fishSpeed, dt);
  }

  // Advance a list of swimmers (tuna/eels, fish) along their polylines at `sp` world
  // px per tick. Shared by both — identical motion: bounce off both ends (the far end
  // may now be dry, so no wrap) and off any stretch that has dried to LAND. Writes
  // e._x/_y/_angle via _samplePath; allocation-free.
  _stepSwimmers(E, sp, dt) {
    const t = this.terrain;
    for (let i = 0; i < E.length; i++) {
      const e = E[i];
      e.animTime += dt;
      const prevD = e.d;
      e.d += sp * dt * e.dir;
      if (e.d <= 0) { e.d = 0; e.dir = 1; }
      else if (e.d >= e.path.len) { e.d = e.path.len; e.dir = -1; }
      this._samplePath(e.path, e.d, e);           // -> e._x, e._y, e._angle
      if (t && t.waterTypeAt(e._x, e._y) === 0) { // dried to bank → turn back
        e.d = prevD; e.dir = -e.dir;
        this._samplePath(e.path, e.d, e);
      }
    }
  }

  // Drawn inside Game.render()'s camera transform, right after terrain.render() and under the
  // seasonal frost/ash washes. Same space and the same Projection every entity uses, so decals
  // sit on the lifted ground. This draws the STILL water — river current + glint + sea shimmer
  // decals; the eels and fish are drawn separately by renderSwimmers() on the supersampled
  // sprite layer (see Game.render). `g` optionally targets a p5 graphics buffer (DOM-stack GL
  // mode draws these decals into the 1080 terrain layer); null/undefined draws on the global
  // main canvas.
  render(g) {
    if (!this._on() || !this.terrain || typeof Projection === 'undefined') return;
    const R = g || (typeof window !== 'undefined' ? window : null);
    if (!R) return;
    const K = Projection.K;
    const dc = R.drawingContext, ga0 = dc.globalAlpha;

    R.push();
    R.imageMode(CENTER);        // saved/restored by this push()/pop()

    const D = this.decals;
    for (let i = 0; i < D.length; i++) {
      const d = D[i];
      const fr = Math.floor(d.animTime * d.animSpeed + d.phase);
      dc.globalAlpha = d.alpha;
      R.push();
      R.translate(Projection.projX(d.x), Projection.groundY(d.y, d.elev));
      R.scale(1, K);            // squash vertically so the mark lies flat on the surface
      if (d.angle) R.rotate(d.angle);
      SpriteStrips.draw(d.strip, fr, 0, 0, d.size, d.size, g);
      R.pop();
    }

    dc.globalAlpha = ga0;     // p5 push/pop does not restore the raw context alpha
    R.pop();
  }

  // The river swimmers — tuna/eels (longer, slower) then the fish school (smaller, quicker) —
  // drawn on the SUPERSAMPLED sprite layer, NOT the 1080 ground buffer the current/shimmer
  // decals live in. Game.render() calls this inside the entity pass (after GLBatch.begin, before
  // simulation.render), so in GL mode the batch captures them at backing resolution and in the
  // 2D path they land straight on the high-res canvas — so a swimming tuna resolves as crisply
  // as the animals above it. Same camera transform + Projection as the decals; both ride the
  // river bed and face the way they are travelling. Drawn on the global main canvas (no `g`).
  renderSwimmers() {
    if (!this._on() || !this.terrain || typeof Projection === 'undefined') return;
    const R = (typeof window !== 'undefined') ? window : null;
    if (!R) return;
    const K = Projection.K;
    const dc = R.drawingContext, ga0 = dc.globalAlpha;

    R.push();
    R.imageMode(CENTER);
    this._drawSwimmers(R, null, dc, this.eels, 'eel_swim',  this.cfg.eelAnimSpeed,  1.6, 0.8, K);
    this._drawSwimmers(R, null, dc, this.fish, 'fish_swim', this.cfg.fishAnimSpeed, 1.5, 0.9, K);
    dc.globalAlpha = ga0;
    R.pop();
  }

  // Draw a swimmer list with `strip` at `animSpeed`, sized e.size·(wMul × hMul).
  // Shared by the tuna/eels and the fish. Never paints on land (a safety net for the
  // one frame before update()'s bounce catches a newly-dried cell).
  _drawSwimmers(R, g, dc, E, strip, animSpeed, wMul, hMul, K) {
    const t = this.terrain;
    for (let i = 0; i < E.length; i++) {
      const e = E[i];
      if (t.waterTypeAt(e._x, e._y) === 0) continue;
      const elev = t.getElevationAt(e._x, e._y);
      const fr = Math.floor(e.animTime * animSpeed);
      dc.globalAlpha = e.alpha;
      R.push();
      R.translate(Projection.projX(e._x), Projection.groundY(e._y, elev));
      R.scale(1, K);
      R.rotate(e._angle + (e.dir < 0 ? Math.PI : 0));
      SpriteStrips.draw(strip, fr, 0, 0, e.size * wMul, e.size * hMul, g);
      R.pop();
    }
  }

  stats() { return { decals: this.decals.length, eels: this.eels.length, fish: this.fish.length, capped: this._capped }; }

  // ---- helpers -----------------------------------------------------------
  // A live decal for a slot. Position/size/look come from the (stable) slot; only the animation
  // phase is randomised, and only at creation — a survivor keeps the object it was born with.
  _mkDecal(s) {
    const elev = (s.needs === 2 && this.terrain) ? this.terrain.getElevationAt(s.x, s.y) : 0;   // river rides the bed; sea is flat
    return { slot: s.id, strip: s.strip, x: s.x, y: s.y, elev, angle: s.angle,
             size: s.size, alpha: s.alpha, animSpeed: s.animSpeed,
             animTime: random(1000), phase: random(100) };
  }

  // Return the cached candidate slots, rebuilding only if the footprint changed (map size,
  // river count, or the view zoom-out). reconcile() uses this; build() force-recomputes.
  _ensureSlots(terrain) {
    const rivers = terrain.getRivers ? terrain.getRivers() : (terrain._geoRivers || []);
    const flowRev = !!(terrain.mainFlowReversed && terrain.mainFlowReversed());
    const key = terrain.mapWidth + 'x' + terrain.mapHeight + '|' + rivers.length + '|' + (terrain._viewF || 1) + '|' + (flowRev ? 1 : 0);
    if (this._slots && this._slotsKey === key) return this._slots;
    return this._computeSlots(terrain);
  }

  // Build (and cache) the deterministic candidate slots: river-step points first (so they win
  // the maxDecals budget, as before), then the sea grid. Positions use a hash-based jitter of the
  // integer grid/step index — NOT random() — so they are identical every call. Each slot records
  // the water type it NEEDS (2 = open river, 1 = flat sea); a decal exists there iff waterTypeAt
  // matches. Geometry only — independent of the current coastline, which reconcile()/build() test.
  _computeSlots(terrain) {
    const mapW = terrain.mapWidth, mapH = terrain.mapHeight, cfg = this.cfg;
    const rivers = terrain.getRivers ? terrain.getRivers() : (terrain._geoRivers || []);
    const flowRev = !!(terrain.mainFlowReversed && terrain.mainFlowReversed());   // main flow flipped seaward (~0.6 Ma)
    // Deterministic pseudo-random in [-1,1] from two integers (a cheap integer hash).
    const jit = (a, b) => { let h = (Math.imul(a | 0, 73856093) ^ Math.imul(b | 0, 19349663)) >>> 0; h ^= h >>> 13; return ((h >>> 0) / 0xffffffff) * 2 - 1; };
    const slots = [];

    // ---- river current + glint slots, along each river polyline ----
    for (let r = 0; r < rivers.length; r++) {
      const rv = rivers[r];
      if (!rv.pts || rv.pts.length < 2) continue;
      const isMain = rv.type !== 'tributary';
      const path = this._buildPath(rv.pts, mapW, mapH, isMain, isMain && flowRev);
      let si = 0;
      for (let d = cfg.riverStep * 0.5; d < path.len; d += cfg.riverStep, si++) {
        this._samplePath(path, d, this._probe);
        const ang = this._probe._angle;
        const nx = -Math.sin(ang), ny = Math.cos(ang);
        const j = jit(r * 131 + si, si) * cfg.riverStep * cfg.riverJitter;   // stable lateral scatter across the channel
        const x = this._probe._x + nx * j, y = this._probe._y + ny * j;
        // Alternate the two authored current variants along the channel for visual
        // variety; fall back to the single strip when the '2' variant is absent
        // (the placeholder path, or missing art).
        const curStrip = (((r + si) & 1) && this._hasStrip('water_current2')) ? 'water_current2' : 'water_current';
        // Currents render axis-aligned (angle 0). The authored Flowing strips already read
        // as upright flow, so rotating them to the winding channel skewed the art; the
        // lateral scatter above still uses `ang`, only the decal's own render rotation is
        // dropped. Glints and sea shimmer were already angle 0; swimmers still face travel.
        slots.push({ id: 'r' + r + '_' + si, needs: 2, x, y, angle: 0,
                     strip: curStrip, size: cfg.currentSize, alpha: cfg.currentAlpha, animSpeed: cfg.currentAnimSpeed });
        if (Math.abs(jit(si * 3 + 7, r * 17 + 1)) < cfg.glintChance) {       // ~glintChance of steps also sparkle
          // Glint stays its original absolute size (was currentSize 24 × 0.6); the 0.4 factor
          // holds 36 × 0.4 = 14.4 so only the CURRENTS grew, not the sparkles.
          slots.push({ id: 'r' + r + '_' + si + 'g', needs: 2, x, y, angle: 0,
                       strip: 'water_glint', size: cfg.currentSize * 0.4, alpha: cfg.glintAlpha, animSpeed: cfg.currentAnimSpeed * 1.7 });
        }
      }
    }

    // ---- sea shimmer slots, a coarse grid ----
    let gi = 0;
    for (let y = cfg.seaSpacing * 0.5; y < mapH; y += cfg.seaSpacing, gi++) {
      let gj = 0;
      for (let x = cfg.seaSpacing * 0.5; x < mapW; x += cfg.seaSpacing, gj++) {
        const jx = x + jit(gi, gj) * cfg.seaSpacing * 0.3;
        const jy = y + jit(gj + 1000, gi) * cfg.seaSpacing * 0.3;
        const seaStrip = (((gi + gj) & 1) && this._hasStrip('sea_shimmer2')) ? 'sea_shimmer2' : 'sea_shimmer';
        slots.push({ id: 's' + gi + '_' + gj, needs: 1, x: jx, y: jy, angle: 0,
                     strip: seaStrip, size: cfg.seaSize, alpha: cfg.seaAlpha, animSpeed: cfg.seaAnimSpeed });
      }
    }

    this._slots = slots;
    this._slotsKey = terrain.mapWidth + 'x' + terrain.mapHeight + '|' + rivers.length + '|' + (terrain._viewF || 1) + '|' + (flowRev ? 1 : 0);
    return slots;
  }

  // (Re)seed the eels on the MAIN river(s). Separated from build() so reconcile() can leave the
  // running eels alone — the main river is always present, so an eel is never stranded on land.
  _buildEels(terrain, year) {
    this.eels.length = 0;
    if (!this._eelsAllowed(year)) return;   // eels are a post-500 ka feature — none before then
    const mapW = terrain.mapWidth, mapH = terrain.mapHeight, cfg = this.cfg;
    const rivers = terrain.getRivers ? terrain.getRivers() : (terrain._geoRivers || []);
    const flowRev = !!(terrain.mainFlowReversed && terrain.mainFlowReversed());   // eels swim with the flipped flow
    const mainPaths = [];
    for (let r = 0; r < rivers.length; r++) {
      const rv = rivers[r];
      if (!rv.pts || rv.pts.length < 2) continue;
      const isMain = rv.type !== 'tributary';
      const path = this._buildPath(rv.pts, mapW, mapH, isMain, isMain && flowRev);
      if (path.isMain && path.len > 0) mainPaths.push(path);
    }
    for (let i = 0; i < cfg.eelCount && mainPaths.length; i++) {
      const path = mainPaths[i % mainPaths.length];
      const e = { path, d: random() * path.len, dir: 1, animTime: random(1000),
                  size: cfg.eelSize, alpha: cfg.eelAlpha, _x: 0, _y: 0, _angle: 0 };
      // Seed on a WET stretch: with the NE arm receded, a reversed main path
      // starts at the drying inland end, so a raw random d can land on the bank.
      // Resample a few times, then walk toward the mouth (d→0) as a last resort.
      this._samplePath(path, e.d, e);
      for (let tries = 0; tries < 8 && terrain.waterTypeAt(e._x, e._y) === 0; tries++) {
        e.d = random() * path.len;
        this._samplePath(path, e.d, e);
      }
      while (e.d > 0 && terrain.waterTypeAt(e._x, e._y) === 0) {
        e.d = Math.max(0, e.d - cfg.riverStep);
        this._samplePath(path, e.d, e);
      }
      this.eels.push(e);
    }
  }

  // (Re)seed the fish school across EVERY river polyline (main + tributaries),
  // spread over the available paths. Unlike the tuna/eels there is no deep-time gate
  // — fish are always in the water — and no flow orientation matters (they mill both
  // ways along the channel, bouncing off dried stretches like the eels). Seeded onto
  // a wet stretch so a fish never starts on a dry bank.
  _buildFish(terrain) {
    this.fish.length = 0;
    const mapW = terrain.mapWidth, mapH = terrain.mapHeight, cfg = this.cfg;
    const rivers = terrain.getRivers ? terrain.getRivers() : (terrain._geoRivers || []);
    const flowRev = !!(terrain.mainFlowReversed && terrain.mainFlowReversed());
    const paths = [];
    for (let r = 0; r < rivers.length; r++) {
      const rv = rivers[r];
      if (!rv.pts || rv.pts.length < 2) continue;
      const isMain = rv.type !== 'tributary';
      const path = this._buildPath(rv.pts, mapW, mapH, isMain, isMain && flowRev);
      if (path.len > 0) paths.push(path);
    }
    for (let i = 0; i < cfg.fishCount && paths.length; i++) {
      const path = paths[i % paths.length];
      const e = { path, d: random() * path.len, dir: random() < 0.5 ? 1 : -1, animTime: random(1000),
                  size: cfg.fishSize, alpha: cfg.fishAlpha, _x: 0, _y: 0, _angle: 0 };
      // Land on a wet stretch (a tributary can have a dry head): resample, then walk
      // toward the mouth (d→0) as a last resort.
      this._samplePath(path, e.d, e);
      for (let tries = 0; tries < 8 && terrain.waterTypeAt(e._x, e._y) === 0; tries++) {
        e.d = random() * path.len;
        this._samplePath(path, e.d, e);
      }
      while (e.d > 0 && terrain.waterTypeAt(e._x, e._y) === 0) {
        e.d = Math.max(0, e.d - cfg.riverStep);
        this._samplePath(path, e.d, e);
      }
      this.fish.push(e);
    }
  }

  // Normalised polyline (pts in 0..1) -> world path with cumulative arc lengths. `reversed` walks the
  // polyline backwards (NE-source → SW-mouth for the main), which flips every downstream tangent — so
  // the current decals and eels read as flowing SEAWARD once the main's flow has flipped (~0.6 Ma).
  _buildPath(pts, mapW, mapH, isMain, reversed) {
    const P = [], cum = [0], n = pts.length;
    for (let i = 0; i < n; i++) { const s = reversed ? pts[n - 1 - i] : pts[i]; P.push({ x: s[0] * mapW, y: s[1] * mapH }); }
    let len = 0;
    for (let i = 0; i + 1 < P.length; i++) {
      len += Math.hypot(P[i + 1].x - P[i].x, P[i + 1].y - P[i].y);
      cum.push(len);
    }
    return { pts: P, cum, len, isMain: !!isMain };
  }

  // Position + downstream tangent at arc-distance d along a path. Writes into
  // out._x/_y/_angle (no allocation). Paths are a dozen points, so the linear
  // segment scan is cheap.
  _samplePath(path, d, out) {
    const P = path.pts, cum = path.cum;
    if (P.length < 2 || path.len <= 0) {
      out._x = P.length ? P[0].x : 0; out._y = P.length ? P[0].y : 0; out._angle = 0; return;
    }
    let dd = d < 0 ? 0 : (d > path.len ? path.len : d);
    let i = 0; while (i + 2 < P.length && cum[i + 1] < dd) i++;
    const segLen = (cum[i + 1] - cum[i]) || 1;
    const tt = (dd - cum[i]) / segLen;
    const a = P[i], b = P[i + 1];
    out._x = a.x + (b.x - a.x) * tt;
    out._y = a.y + (b.y - a.y) * tt;
    out._angle = Math.atan2(b.y - a.y, b.x - a.x);
  }
}

if (typeof module !== 'undefined' && module.exports) module.exports = WaterLayer;
