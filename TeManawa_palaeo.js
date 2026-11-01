// ============================================================
// TE MANAWA: THE LAND BEFORE THE WINDOW — the palaeogeography attract sequence
// ------------------------------------------------------------
// The sim's window (1 Ma → 25.5 ka) barely moves the land. The emergence that made the Manawatū — a
// deep sea basin, a low finger of basement across it, a strait that opened and closed over that
// finger, then the ranges — happens BEFORE the window. This module plays it: an animated, land-only
// pre-roll from 4 Ma to 1 Ma, as the idle attract and at every end-of-window reset, with nothing
// alive on screen and the names on the map those of the time (Trewick & Bland 2012, Fig. 4A–D).
// md/TEMANAWA_PALAEO_ATTRACT.md is the design spine; §5 there lists every system this touches.
//
// ONE LAND MODEL. The sequence is not a second map: it drives the same TerrainGenerator through the
// same morph path, at dates older than the window (GEO_EPOCHS.palaeo*, geoTimeFactors().palaeo).
// The 1 Ma it lands on IS the sim's opening state, so the hand-off is continuous.
//
// ITS OWN CLOCK. DeepTime cannot represent 4 Ma (every clock op clamps to the window and the timeline
// would draw off-left), so the sequence keeps Palaeo.yearsBP and leaves DeepTime parked; the HUD's
// visitor pieces are replaced by one caption while it runs.
//
//   idle / end-of-window
//     ▼
//   dipIn   fade to dark (≥ 500 ms) · every reseedEvery-th cycle: Game.init() under the dark
//   bake0   the first re-bake, to the oldest date, ALL FOUR season buffers, under the dark
//   rise    fade up on the 4 Ma sea
//   play    the keyframes: hold · travel · hold …; a re-bake is issued only when no job is in
//           flight, the last swap's crossfade has ENDED (never a cut — TerrainGenerator._morphCuts
//           stays 0) and the clock has moved ≥ minYears (or sits on a hold not yet baked); the last
//           re-bake (1 Ma) is all four buffers again, so the landing is consistent
//   dipOut  fade to dark · the landing: Kiosk.landAttract → Game.resetEcosystem (DeepTime.reset → 1 Ma)
//   rise2   fade up on the living 1 Ma world; the sim is already running under the veil
//
// Any input skips: the remaining legs run at skipMult with no holds, then the landing is the same.
// Photosensitivity (TEMANAWA_BUILD_V3.md §3): both dips ≥ 500 ms, every terrain swap the existing
// ≥ 500 ms crossfade, the caption and the names crossfade (≥ 500 ms). No per-frame allocation on
// the draw path: the labels are built once, the caption strings are quantised.
// ============================================================

// Console-tunable like TM_TIME / TM_RIVER_NAMES. Sizes in 1080-space px; dates in yearsBP.
const TM_PALAEO = {
  enabled:     true,
  // The sequence's keyframes, oldest first: [yearsBP, holdSeconds]. The four dated maps of Trewick &
  // Bland (4, 3, 2.4, 1 Ma) plus the strait's final closure (1.6 Ma). The last one is the landing and
  // MUST be the window's start (DeepTime.yearsStart): the sim resumes on exactly that land.
  keyframes:   [[4000000, 4], [3000000, 3], [2400000, 4], [1600000, 3], [1000000, 3]],
  kyrPerSec:   60,        // travel rate between keyframes (3 Myr ≈ 50 s at 60)
  minYears:    20000,     // the smallest clock move that earns a re-bake (paced by the crossfade anyway)
  budgetMs:    8,         // per-frame morph slice while the sequence runs (nothing lives, so it can be generous)
  firstBudgetMs: 14,      // … and under the opening dark, where nothing at all is on screen
  dipMs:       700,       // fade to dark / up, each way (≥ 500: photosensitivity)
  skipMult:    12,        // an input plays the rest at this × kyrPerSec, with no holds
  dateQuant:   50000,     // the travelling date is rounded to this (a few strings for the text cache, ~1 change/s)
  notes:       true,      // the one-line note under the date (co-design placeholder copy; EPOCHS[].note)
  spelling:    'Whanganui',   // the basin's spelling on the wall: the district's (and the blog's). Trewick & Bland write 'Wanganui'
  riverProtoUntil: 1250000,   // the main stem is 'proto-Manawatū' while its arm still flows east (GEO_EPOCHS.mainArmFrom)
  labelSize:   24,        // the region names' lettering (the river names' mainSize is 26)
  labelFadeMs: 700,       // a name's fade in / out (≥ 500)
  captionSize: 42,        // the date (InstallHUD.VIS_YEAR_SIZE)
  noteSize:    26,        // the note under it
  noteFadeMs:  800,       // the note's crossfade on change
  // The epochs' one-line notes, keyed by the OLDER bound (the first whose `from` ≥ the date wins).
  // Co-design placeholder copy — sourced in md/TEMANAWA_PALAEO_ATTRACT.md §1; cut with notes:false.
  EPOCHS: [
    { from: 4000000, note: 'The Manawatū is deep sea. A low finger of basement rock stands where the ranges will rise.' },
    { from: 3350000, note: 'The sea breaks across the gorge: the Manawatū Strait opens as a narrow seaway.' },
    { from: 2950000, note: 'The strait closes. The sea planes the low basement flat.' },
    { from: 2500000, note: 'The strait at its widest: a shallow sea where the southern Ruahine and northern Tararua now stand.' },
    { from: 1650000, note: 'The strait closes for good. The basin begins to shoal into land.' },
    { from: 1300000, note: 'The ranges begin their rapid rise. The river, older than the mountains, holds its course west.' }
  ],
  // The names on the map, each for its dated window (from = older bound, to = younger), anchored at a
  // map fraction (u 0 west → 1 east, v 0 north → 1 south) and lettered at `deg` on screen (−90 … 90 so it
  // reads left to right / bottom to top). `on` is the surface the anchor must sit on at the date, read off
  // the painted classification (sea / land); a name whose anchor is not on it stays hidden. Only names
  // Trewick & Bland use (Fig. 4A–D, pp. 160–171); the axis is unnamed until 1.6 Ma, then their 'proto-'.
  // (The wall's cover fit runs the map wider than the screen, so u ≈ 0.16 … 0.9 is what shows.)
  LABELS: [
    { text: '{basin} Basin',   from: 4000000, to: 1050000, u: 0.27, v: 0.42, deg: -18, on: 'sea'  },
    { text: 'Ruataniwha Strait', from: 4000000, to: 1550000, u: 0.80, v: 0.64, deg: -40, on: 'sea'  },
    { text: 'Manawatū Strait',   from: 3330000, to: 2950000, u: 0.505, v: 0.56, deg: 30, on: 'sea' },
    { text: 'Manawatū Strait',   from: 2480000, to: 1680000, u: 0.505, v: 0.56, deg: 30, on: 'sea' },
    { text: 'proto-Ruahine Range', from: 1600000, to: 1020000, u: 0.62, v: 0.26, deg: -80, on: 'land' },
    { text: 'proto-Tararua Range', from: 1600000, to: 1020000, u: 0.45, v: 0.66, deg: -50, on: 'land' }
  ]
};
try { if (typeof window !== 'undefined') window.TM_PALAEO = TM_PALAEO; } catch (_) {}

const Palaeo = {
  // ---- state -------------------------------------------------
  active:   false,     // the sequence owns the world (dipIn … dipOut); the sim neither updates nor renders
  state:    'idle',    // idle | dipIn | bake0 | rise | play | dipOut | rise2
  yearsBP:  0,         // the sequence's own clock
  reason:   '',
  game:     null,
  bakes:    0,         // re-bakes landed this sequence
  runs:     0,         // sequences played (the harness reads it)
  _t0:      0,         // millis() the current state began
  _leg:     0,         // index into keyframes
  _holdUntil: 0,
  _skipping: false,
  _veil:    0,         // 0..1 dark overlay
  _bakedYear: NaN, _bakedAll: false,
  _reseed:  false,
  _labels:  null,      // built label instances (lazily, needs p5)
  _labelKey: '',
  _cap:     null,      // caption state { date, note slots }
  _anchorSig: '',

  // ---- the two cues ------------------------------------------
  // Start the sequence. `reason` is 'idle' | 'end-of-window' | 'manual'. Refused (false) while one is
  // running, when disabled, or before the world exists; the error-recovery path never calls this.
  begin(g, reason) {
    if (!TM_PALAEO.enabled || this.active || !g || !g.terrain || !g.currentLevel) return false;
    if (typeof TerrainGenerator === 'undefined' || !g.terrain.morphBegin) return false;
    const now = this._now();
    this.active = true; this.state = 'dipIn'; this.reason = reason || 'manual'; this.game = g;
    this._t0 = now; this._leg = 0; this._holdUntil = 0; this._holdPending = false; this._skipping = false; this._veil = 0;
    this.bakes = 0; this._bakedYear = NaN; this._bakedAll = false;
    this.yearsBP = this._kf(0)[0];
    // The reseed-every-Nth of the attract loop: decided here, done under the opening dark.
    this._reseed = (typeof Kiosk !== 'undefined' && Kiosk.takeReseed) ? Kiosk.takeReseed() : false;
    // Nothing of the old world's volcanic state may fire on the fresh one: a charge armed at the window
    // end (the terminal Oruanui) would otherwise be seen as 'past its crest' by the new HUD and erupt at
    // 1 Ma. A LIVE ash-cloud window is kept: it finishes dissipating over the sequence (Oruanui's cover
    // becomes the end-of-window's). The ground's health filter and ash wash are the old world's too.
    g._tmAttractErAt = 0; g._tmAutoErAt = 0; g._tmAutoErupt = null; g._tmErDownAt = 0; g._tmErFired = false;
    g._tmAshUntil = 0; g._ashCover = 0; g._sceneSat = 1; g._habitatHealth = 1;
    g._tmStormUntil = 0; g._tmGrowWarmUntil = 0; g._tmGrowColdUntil = 0; g._tmBolt = null;
    if (typeof Kiosk !== 'undefined') Kiosk.lastInputAt = Date.now();   // the idle timer restarts; landAttract restarts it again
    if (typeof console !== 'undefined') console.log('[Palaeo] begin (' + this.reason + ')' + (this._reseed ? ' + reseed' : ''));
    return true;
  },

  // Visitor presence: play the rest fast (no holds), then land normally. Never a cut.
  skip() {
    if (!this.active) return false;
    if (this.state === 'dipOut' || this.state === 'rise2') return false;
    this._skipping = true; this._holdUntil = 0; this._holdPending = false;
    return true;
  },

  // ---- per frame, from Game.update (always; cheap when idle) ---
  tick(dt) {
    if (this.state === 'idle') return;
    const g = this.game, T = g && g.terrain, now = this._now();
    if (!T) { this._abort('no terrain'); return; }
    const sec = Math.max(0, (dt == null ? 1 : dt)) / ((typeof DeepTime !== 'undefined' && DeepTime.fps) ? DeepTime.fps : 60);
    const dip = Math.max(500, TM_PALAEO.dipMs);
    switch (this.state) {
      case 'dipIn': {
        this._veil = this._ease((now - this._t0) / dip);
        if (this._veil >= 1) {
          if (this._reseed && typeof g.init === 'function') {        // the deliberate reseed, under the dark
            g.init();
            if (typeof Kiosk !== 'undefined' && Kiosk.beat) Kiosk.beat();   // a legitimate long rebuild is not a stall
          }
          T.morphBegin(this.yearsBP, this._bakeScale(), true);        // all four buffers: a hard scene change
          this._bakedAll = true;
          this.state = 'bake0';
        }
        break;
      }
      case 'bake0': {
        if (!T.morphInProgress || T.morphStep(TM_PALAEO.firstBudgetMs)) {
          this._clearRiverNames();                                    // the modern names never linger into the 4 Ma hold
          this._onBaked(this.yearsBP, true);
          this._retireFade(T);                                        // the old land never ghosts into the rise
          this.state = 'rise'; this._t0 = now;
        }
        break;
      }
      case 'rise': {
        this._veil = 1 - this._ease((now - this._t0) / dip);
        if (this._veil <= 0) {
          this._veil = 0; this.state = 'play'; this._leg = 0;
          this._armHold(now);                                           // the 4 Ma land is already on screen
        }
        break;
      }
      case 'play': {
        this._advanceClock(now, sec);
        this._paceBakes(T, now, false);
        break;
      }
      case 'dipOut': {
        this._veil = this._ease((now - this._t0) / dip);
        // The landing bake: the last keyframe, all four buffers. Issued here if play left it undone
        // (a skip can reach 1 Ma with a travel bake still in flight), and always waited for.
        if (T.morphInProgress) { if (T.morphStep(TM_PALAEO.firstBudgetMs)) this._onBaked(this._pendingYear, this._pendingAll); }
        else if (!(this._bakedYear === this._last()[0] && this._bakedAll)) this._issueBake(T, this._last()[0], true);
        if (this._veil >= 1 && !T.morphInProgress && this._bakedYear === this._last()[0] && this._bakedAll) {
          this._land(g, T, now);
          this.state = 'rise2'; this._t0 = now;
        }
        break;
      }
      case 'rise2': {
        this._veil = 1 - this._ease((now - this._t0) / dip);
        if (this._veil <= 0) { this._veil = 0; this.state = 'idle'; this.game = null; }
        break;
      }
    }
  },

  // The clock: holds on a keyframe, travels to the next; the last hold ends in the landing dip.
  // A hold is PENDING (the clock waits) until the keyframe's own re-bake is on screen, so the time
  // the visitor gets to read a dated map is counted from when the land shows it, not from when the
  // clock got there (on a slow bake the hold would otherwise be spent still morphing). A skip waits
  // for nothing.
  _advanceClock(now, sec) {
    const K = TM_PALAEO.keyframes, last = K.length - 1;
    if (this._holdPending) {                                   // on a keyframe, its land not yet shown
      this.yearsBP = K[this._leg][0];
      if (this._skipping) this._holdPending = false; else return;
    }
    if (now < this._holdUntil) { this.yearsBP = K[this._leg][0]; return; }
    if (this._leg >= last) {                                   // the last hold is over → land
      this.yearsBP = K[last][0];
      this.state = 'dipOut'; this._t0 = now;
      return;
    }
    const next = K[this._leg + 1];
    const rate = TM_PALAEO.kyrPerSec * 1000 * (this._skipping ? TM_PALAEO.skipMult : 1);
    this.yearsBP -= rate * sec;
    if (this.yearsBP <= next[0]) {
      this.yearsBP = next[0]; this._leg++;
      this._holdPending = true; this._holdUntil = 0;           // armed by _onBaked once this keyframe's land shows
    }
  },

  // The keyframe's land is on screen: start its hold (0 while skipping).
  _armHold(now) {
    this._holdPending = false;
    this._holdUntil = this._skipping ? 0 : now + this._kf(this._leg)[1] * 1000;
  },

  // A re-bake only when nothing is in flight, the last visible swap's crossfade has ended (a swap under
  // a live fade is a cut) and the clock has moved enough — or sits on a hold the land has not reached.
  _paceBakes(T, now) {
    if (T.morphInProgress) {
      if (T.morphStep(TM_PALAEO.budgetMs)) this._onBaked(this._pendingYear, this._pendingAll);
      return;
    }
    if (T._morphFade) return;
    const want = this.yearsBP, onHold = this._holdPending || now < this._holdUntil || this._leg >= TM_PALAEO.keyframes.length - 1;
    const moved = Math.abs(want - this._bakedYear) >= TM_PALAEO.minYears;
    if (moved || (onHold && this._bakedYear !== want)) {
      const isLast = want === this._last()[0];
      this._issueBake(T, want, isLast);
    }
  },

  _issueBake(T, year, allPhases) {
    T.morphBegin(year, this._bakeScale(), !!allPhases);
    this._pendingYear = year; this._pendingAll = !!allPhases;
  },

  _onBaked(year, allPhases) {
    const g = this.game, now = this._now();
    this._bakedYear = year; this._bakedAll = !!allPhases; this.bakes++;
    if (g) {
      if (g.water && g.water.reconcile) g.water.reconcile(g.terrain, year);   // the shimmer follows the sea; names re-letter on rev
      g._bakedYearsBP = year;
      g._lastMorphMs = now;
    }
    this._anchorSig = '';   // the land moved under the names: re-seat them
    // A pending hold starts now that its keyframe's land is on screen.
    if (this.state === 'play' && this._holdPending && year === this._kf(this._leg)[0]) this._armHold(now);
  },

  _retireFade(T) {
    const mf = T._morphFade;
    if (!mf) return;
    if (mf.buf && T._releaseBakeBuffer) T._releaseBakeBuffer(mf.buf);
    T._morphFade = null;
  },

  // The landing: the terrain is already the window's opening land; only the living world is rebuilt.
  // RiverNames keeps a lost name on screen for one more layout (holdLayouts), so that a name does not
  // blink; across the sequence's two dips that hold would carry the wrong era's names through a whole
  // keyframe. Both dips clear the live names under the dark, so the next layout starts fresh.
  _clearRiverNames() {
    const RN = (typeof RiverNames !== 'undefined') ? RiverNames : null;
    if (RN && RN.clear) RN.clear();
  },

  _land(g, T, now) {
    this._retireFade(T);
    this._clearRiverNames();                                    // the time's names never linger into the living world
    const y = this._last()[0];
    if (g.water && g.water.build) g.water.build(T, y);          // a clean stamp for the new world (as an eruption does)
    if (typeof Kiosk !== 'undefined' && Kiosk.landAttract) Kiosk.landAttract(g, this.reason);
    else if (g.resetEcosystem) g.resetEcosystem();
    g._bakedYearsBP = y; g._lastMorphMs = now;
    this.runs++;
    this.active = false;                                        // the sim runs (and renders) under the lifting veil
    if (typeof console !== 'undefined') console.log('[Palaeo] landed at ' + y + ' after ' + this.bakes + ' re-bakes');
  },

  _abort(why) {
    if (typeof console !== 'undefined') console.warn('[Palaeo] aborted: ' + why);
    this.active = false; this.state = 'idle'; this._veil = 0; this.game = null;
  },

  // ---- render --------------------------------------------------
  // Over the ground tier (Game.render draws the terrain, water decals and washes, nothing alive): the
  // river names (the palaeo names, through RiverNames), the region names, the caption, a live ash cloud,
  // the debug overlay. Called in place of GameUI.renderFullscreenOverlay while active.
  renderOverlay(g, W, H) {
    if (typeof InstallHUD !== 'undefined') {
      if (InstallHUD.renderEdgeGlow) InstallHUD.renderEdgeGlow(g, W, H);
    }
    if (typeof RiverNames !== 'undefined' && RiverNames.render) RiverNames.render(g, W, H);
    this._renderLabels(g, W, H);
    this._renderCaption(W, H);
    if (typeof InstallHUD !== 'undefined' && InstallHUD.renderAshCloud) InstallHUD.renderAshCloud(g, W, H);
    if (typeof Debug !== 'undefined' && Debug.enabled && Debug.render) Debug.render(g, W, H);
  },

  // The dark veil, over everything (drawn from draw() after Game.render, like Kiosk.renderCrossfade).
  renderVeil(W, H) {
    if (this._veil <= 0.002) return;
    push(); noStroke(); fill(14, 21, 19, 255 * Math.min(1, this._veil)); rect(0, 0, W, H); pop();
  },

  // ---- names ---------------------------------------------------
  // What RiverNames letters along a channel while the sequence runs: no tributary names (no source
  // names those streams for the time), the main stem by date.
  riverName(rv) {
    if (!rv || rv.type === 'tributary') return null;
    return this.yearsBP >= TM_PALAEO.riverProtoUntil ? 'proto-Manawatū' : 'Manawatū';
  },

  // The note for a date (the first epoch whose `from` ≥ it), or null.
  epochNote(y) {
    const E = TM_PALAEO.EPOCHS;
    let best = null;
    for (let i = 0; i < E.length; i++) if (E[i].from >= y && (best === null || E[i].from < best.from)) best = E[i];
    return best ? best.note : null;
  },

  // The names showing at date `y` on their surfaces (text → the surface check runs on the live land).
  labelsAt(y) {
    return TM_PALAEO.LABELS.filter(L => y <= L.from && y >= L.to).map(L => this._labelText(L));
  },

  // The date as the HUD writes it (~ 2,400,000 years ago), quantised while travelling.
  dateLabel() {
    const onHold = this.state !== 'play' || this._now() < this._holdUntil;
    const q = TM_PALAEO.dateQuant || 1;
    const y = onHold ? this.yearsBP : Math.round(this.yearsBP / q) * q;
    return '~ ' + Math.round(y).toLocaleString() + ' years ago';
  },

  // For the second screen's clock telemetry.
  telemetry() {
    return this.active ? { active: true, yearsBP: Math.round(this.yearsBP), state: this.state, label: this.dateLabel() }
                       : { active: false };
  },

  _labelText(L) { return L.text.replace('{basin}', TM_PALAEO.spelling || 'Whanganui'); },

  // Build the letter sprites once (the river names' glyph cache: the same halo + fill lettering).
  _buildLabels() {
    const C = TM_PALAEO, RN = (typeof RiverNames !== 'undefined') ? RiverNames : null;
    const key = C.LABELS.length + '|' + C.labelSize + '|' + C.spelling;
    if (this._labels && this._labelKey === key) return this._labels;
    if (!RN || !RN._glyph || typeof TM_RIVER_NAMES === 'undefined') return null;
    const size = C.labelSize, tr = TM_RIVER_NAMES.tracking * size, out = [];
    for (const L of C.LABELS) {
      const text = this._labelText(L).normalize('NFC').toUpperCase(), chars = Array.from(text);
      const gs = chars.map(ch => RN._glyph(ch, size));
      let len = tr * (chars.length - 1); for (const gl of gs) len += gl.adv;
      const n = chars.length;
      out.push({ def: L, text, gs, n, len, tr,
                 x: new Float32Array(n), y: new Float32Array(n), a: new Float32Array(n),
                 ok: false, shown: false, alpha: 0, aFrom: 0, aT0: -1e9 });
    }
    this._labels = out; this._labelKey = key;
    return out;
  },

  // Seat every name on the land as it stands: its anchor's painted position (the relief lift under it)
  // and its surface check. Runs when the land, the view or the canvas changed, never per frame.
  _seatLabels(g, W, H) {
    const T = g.terrain, labels = this._labels;
    if (!T || !labels || typeof Projection === 'undefined' || typeof CONFIG === 'undefined') return;
    const sig = this.bakes + '|' + W + 'x' + H + '|' + CONFIG.viewX + ',' + CONFIG.viewY + ',' + CONFIG.viewZoom;
    if (sig === this._anchorSig) return;
    this._anchorSig = sig;
    const vx = CONFIG.viewX, vy = CONFIG.viewY, vz = CONFIG.viewZoom, mw = T.mapWidth, mh = T.mapHeight;
    for (const L of labels) {
      const D = L.def, x = D.u * mw, y = D.v * mh;
      const wt = T.waterTypeAt ? T.waterTypeAt(x, y) : 0;
      L.ok = (D.on === 'sea') ? wt === 1 : (D.on === 'land') ? wt === 0 : true;
      const lift = T.paintLiftAt ? T.paintLiftAt(x, y) : T.getElevationAt(x, y);
      const cx = vx + vz * Projection.projX(x), cy = vy + vz * Projection.groundY(y, lift);
      const ang = (D.deg || 0) * Math.PI / 180, ca = Math.cos(ang), sa = Math.sin(ang);
      let cum = 0;
      for (let j = 0; j < L.n; j++) {
        const s = cum + L.gs[j].adv / 2 - L.len / 2;
        L.x[j] = cx + s * ca; L.y[j] = cy + s * sa; L.a[j] = ang;
        cum += L.gs[j].adv + L.tr;
      }
    }
  },

  _renderLabels(g, W, H) {
    const labels = this._buildLabels();
    if (!labels) return;
    this._seatLabels(g, W, H);
    const dc = (typeof drawingContext !== 'undefined') ? drawingContext : null, RN = RiverNames;
    const now = this._now(), fade = Math.max(500, TM_PALAEO.labelFadeMs), y = this.yearsBP;
    // Window + surface decide the target; the alpha eases toward it over fade ms (a flip mid-fade
    // starts from where it was, so a name never jumps).
    for (const L of labels) {
      const want = this.active && L.ok && y <= L.def.from && y >= L.def.to;
      if (want !== L.shown) { L.shown = want; L.aFrom = L.alpha; L.aT0 = now; }
      const t = Math.min(1, (now - L.aT0) / fade);
      L.alpha = L.aFrom + ((want ? 1 : 0) - L.aFrom) * t;
    }
    if (!dc || !dc.drawImage || !RN._drawLabel) return;
    const ga0 = dc.globalAlpha;
    for (let pass = 0; pass < 2; pass++) {
      for (const L of labels) {
        if (L.alpha <= 0.004) continue;
        dc.globalAlpha = ga0 * L.alpha;
        RN._drawLabel(dc, L.gs, L.n, L.x, L.y, L.a, L.x, L.y, L.a, 1, pass);
      }
    }
    dc.globalAlpha = ga0;
  },

  // The date where the HUD puts its year, and the epoch's note under it (crossfaded on change).
  _renderCaption(W, H) {
    const HUD = (typeof InstallHUD !== 'undefined') ? InstallHUD : null;
    if (!HUD || !HUD._blitText || typeof FreckleFace === 'undefined') return;
    const cx = W / 2, cy = (HUD._visAxisY ? HUD._visAxisY(H) : H - 232) + (HUD.VIS_YEAR_BELOW || 46);
    const halo = [8, 14, 12, 170], ink = [236, 244, 240], size = TM_PALAEO.captionSize;
    const date = this.dateLabel();
    HUD._blitText(date, FreckleFace, 'freckle', size, CENTER, CENTER, cx + 2, cy + 3, halo);
    HUD._blitText(date, FreckleFace, 'freckle', size, CENTER, CENTER, cx, cy, ink);
    if (!TM_PALAEO.notes) return;
    const note = this.epochNote(this.yearsBP), now = this._now(), fade = Math.max(500, TM_PALAEO.noteFadeMs);
    let c = this._cap;
    if (!c) c = this._cap = { cur: { text: null, t0: -1e9 }, out: { text: null, t0: -1e9, a0: 0 } };
    if (note !== c.cur.text) {
      const shown = Math.min(1, (now - c.cur.t0) / fade);
      const o = c.out; c.out = c.cur; c.cur = o;
      c.out.a0 = shown; c.out.t0 = now;
      c.cur.text = note; c.cur.t0 = now;
    }
    const ny = cy + (HUD.VIS_CLIMATE_BELOW || 42), ns = TM_PALAEO.noteSize;
    const dc = (typeof drawingContext !== 'undefined') ? drawingContext : null, ga0 = dc ? dc.globalAlpha : 1;
    const aOut = c.out.a0 * (1 - Math.min(1, (now - c.out.t0) / fade)), aIn = Math.min(1, (now - c.cur.t0) / fade);
    if (c.out.text && aOut > 0.004) {
      if (dc) dc.globalAlpha = ga0 * aOut;
      HUD._blitText(c.out.text, FreckleFace, 'freckle', ns, CENTER, CENTER, cx + 2, ny + 2, halo);
      HUD._blitText(c.out.text, FreckleFace, 'freckle', ns, CENTER, CENTER, cx, ny, ink);
    }
    if (c.cur.text && aIn > 0.004) {
      if (dc) dc.globalAlpha = ga0 * aIn;
      HUD._blitText(c.cur.text, FreckleFace, 'freckle', ns, CENTER, CENTER, cx + 2, ny + 2, halo);
      HUD._blitText(c.cur.text, FreckleFace, 'freckle', ns, CENTER, CENTER, cx, ny, ink);
    }
    if (dc) dc.globalAlpha = ga0;
  },

  // A still frame (tools/export_frames.js): the names of date `y` on terrain `T` as it stands (seated
  // and surface-checked afresh, drawn at full strength) and the caption, into graphics `buf`. The
  // sequence's live state is untouched. Returns the region names drawn.
  drawStill(buf, T, W, H, y) {
    const g = { terrain: T };
    const labels = this._buildLabels();
    const keep = { active: this.active, yearsBP: this.yearsBP, state: this.state, sig: this._anchorSig, game: this.game };
    this.active = true; this.yearsBP = y; this.state = 'play'; this._holdUntil = Infinity; this.game = g;
    this._anchorSig = '';
    const drawn = [];
    try {
      if (labels) {
        this._seatLabels(g, W, H);
        const dc = buf && buf.drawingContext;
        if (dc && dc.drawImage && typeof RiverNames !== 'undefined' && RiverNames._drawLabel) {
          for (let pass = 0; pass < 2; pass++) for (const L of labels) {
            if (!(L.ok && y <= L.def.from && y >= L.def.to)) continue;
            RiverNames._drawLabel(dc, L.gs, L.n, L.x, L.y, L.a, L.x, L.y, L.a, 1, pass);
            if (pass === 1) drawn.push(L.text);
          }
        }
      }
      if (buf && buf.push && typeof FreckleFace !== 'undefined') {
        const HUD = (typeof InstallHUD !== 'undefined') ? InstallHUD : null;
        const cx = W / 2, cy = (HUD && HUD._visAxisY ? HUD._visAxisY(H) : H - 232) + ((HUD && HUD.VIS_YEAR_BELOW) || 46);
        buf.push(); buf.textFont(FreckleFace); buf.textAlign(CENTER, CENTER); buf.noStroke();
        buf.textSize(TM_PALAEO.captionSize); buf.fill(8, 14, 12, 170); buf.text(this.dateLabel(), cx + 2, cy + 3);
        buf.fill(236, 244, 240); buf.text(this.dateLabel(), cx, cy);
        const note = TM_PALAEO.notes ? this.epochNote(y) : null;
        if (note) {
          const ny = cy + ((HUD && HUD.VIS_CLIMATE_BELOW) || 42);
          buf.textSize(TM_PALAEO.noteSize); buf.fill(8, 14, 12, 170); buf.text(note, cx + 2, ny + 2);
          buf.fill(236, 244, 240); buf.text(note, cx, ny);
        }
        buf.pop();
      }
    } finally {
      this.active = keep.active; this.yearsBP = keep.yearsBP; this.state = keep.state; this._anchorSig = keep.sig; this.game = keep.game;
      this._holdUntil = 0;
    }
    return drawn;
  },

  // ---- helpers --------------------------------------------------
  _kf(i) { return TM_PALAEO.keyframes[i]; },
  _last() { return TM_PALAEO.keyframes[TM_PALAEO.keyframes.length - 1]; },
  _now() { return (typeof millis === 'function') ? millis() : Date.now(); },
  _ease(t) { t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); },
  _bakeScale() { return (typeof CONFIG !== 'undefined' && CONFIG.morphBakeScale != null) ? CONFIG.morphBakeScale : undefined; }
};
try { if (typeof window !== 'undefined') window.Palaeo = Palaeo; } catch (_) {}
