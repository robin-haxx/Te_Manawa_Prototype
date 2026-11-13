// ============================================================
// TE MANAWA: THE ATTRACT, THE INTRO AND THE OUTRO (2026-11-08)
// ------------------------------------------------------------
// Replaces the deep-time attract sequence (TeManawa_palaeo.js, now only the dev P key) on every wall
// path: the idle timer, the end of the window and the boot.
//   · THE ATTRACT ('idle'): the live 1 Ma world with every piece of UI hidden and the clock held: the
//     birds and the plants live on in real time, nothing ages through deep time. Entered through a dip
//     to black ('enter'), under which the world is reset to a fresh 1 Ma land for a new visitor (every
//     Kiosk.reseedEvery-th a new land, as before). Left alone for refreshMinutes it re-enters.
//   · THE INTRO, when a visitor breaks the attract: black, then the PRESENT-DAY MAP fades in (the
//     sim's own land baked at 0 BP, toned to read as today's, with names), with a short orientation;
//     the map crossfades into the live 1 Ma land it lines up with, still without UI; one line fades in
//     and out; then the UI fades in and the visitor has the wall.
//   · THE OUTRO, when the clock reaches the end of the window: the UI and the land go to black, the
//     same map fades in with what changed from the last ice age to today, then black again, and the
//     attract comes back on a fresh 1 Ma world.
// Beside the map, the ISLAND INSET (TeManawa_island.js, TM_ATTRACT.inset): the lower North Island with
// the sim's frame boxed on it, for what the frame cannot show. Today with the intro's map, 1 Ma as the
// map crosses into the land (no Cook Strait); the outro's last glacial maximum (dry land to Nelson), then today.
// The present-day map is TerrainGenerator.snapshotYear(0): the same land, projection and view as the
// sim, so its rivers sit where the sim's do; built under a black cover and kept until the land or the
// view changes. While any of this runs a visitor's input is presence (Kiosk.noteInput) and drives the
// sequence (breaks the attract, skips the map after skipAfterMs), never a button on the world. Every
// luminance change ramps ≥ 500 ms. Text is rasterised once per card and freed on a resize.
// Authoring: Attract.enter() / Attract.outro(game) / Attract.onInput(game) in the console; ?attract=1
// boots a ?dev page into the attract too.
// ============================================================

const TM_ATTRACT = {
  enabled: true,
  bootInAttract: true,     // the wall boots into the attract; a ?dev page boots into play unless ?attract=1
  refreshMinutes: 20,      // an attract left alone this long re-enters on a fresh world
  dipMs: 1200,             // to black (the land and the UI together)
  upMs: 1400,              // up from black onto the attract land
  mapInMs: 1100,           // the map up out of black
  mapMs: 9500,             // the intro's map, from the moment it is up
  cardInAt: 1300,          // the card starts this long after the black is up…
  cardFadeMs: 900,         // …fades in over this, and out over the same before the map leaves
  crossMs: 1700,           // the map into the live land it lines up with
  lineInAt: 600,           // into the land, the one line starts…
  lineFadeMs: 1000,        // …fades over this…
  lineHoldMs: 4800,        // …holds this long (the island inset's 1 Ma caption is read with it; was 3600 before the inset)
  uiInMs: 1200,            // the UI's fade in at the end of the intro
  skipAfterMs: 3000,       // the map can be skipped by input once it has been up this long
  outroMapMs: 15000,
  outroSkipAfterMs: 4000,
  // THE ISLAND INSET (TeManawa_island.js, 2026-11-13): the lower North Island beside the map, the sim's
  // frame boxed on it: what the frame cannot show. The intro shows today with the map and turns to 1 Ma
  // as the map crosses into the live land (no Cook Strait), and leaves with the line; the outro shows the
  // last glacial maximum (dry land to Nelson), then today. Captions in TM_ISLAND.copy.
  inset: { intro: ['m0000', 'm1000'], outro: ['m0020', 'm0000'], outroSwitchMs: 7000, crossMs: 1700 },
  mapYearsBP: 0,           // the map's date: today
  mapFilter: 'saturate(0.6) brightness(1.06)',   // toned to read as today's map, not the sim
  mapWash: [246, 240, 226, 30],                  // a light paper wash over it
  cardY: { intro: 0.82, outro: 0.78, line: 0.58 },   // the line sits below the island inset's caption (top right; it was 0.36, where they ran together)
  colInk: [30, 42, 36],
  colWaterInk: [26, 70, 104],
  colInkHalo: [252, 250, 242, 215],
  colText: [236, 244, 240],
  colTitle: [255, 226, 168],
  colHalo: [8, 14, 12, 170],
  copy: {
    intro: {
      title: 'The Manawatū, today',
      body: 'You are about to see this land a million years ago. Over that time the climate swung through ice age after ice age: the sea rose and fell across the plains, and the forest came and went with it.'
    },
    line: 'The Manawatū, a million years ago',
    outro: {
      title: 'From the last ice age to today',
      // habitats, species, the river: one sentence each. The cast's thirteen: the four moa, the goose, the
      // mōho, Finsch's duck, Eyles' harrier and the huia are extinct; kererū, tūī, kōkako and kiwi survive.
      body: 'The ice melted, the sea rose to today\'s coast, and forest spread back over the plains; most of it is farmland now. ' +
            'Nine of the thirteen birds you saw are gone, the moa and the huia among them. ' +
            'The river still cuts through the ranges at Te Āpiti, older than the mountains it crosses.'
    }
  },
  // The map's names, in the geography skeleton's coordinates (geo/manawatu.svg, 0..1 of its 1600×900
  // frame, the frame the terrain maps onto the world). kind: range | feature | town (a dot). dx/dy nudge
  // the text off its anchor in screen px. A name whose anchor is not on the right ground at 0 BP (a town
  // in the water) or is off the screen is left off. Three are placed off the land at 0 BP itself, since
  // the sim's coast and channels move: the river's name along its lower reach, the town at its mouth
  // (mouthTown) and the sea's name in the widest stretch of sea on screen (seaName).
  riverName: 'Manawatū River',
  mouthTown: 'Foxton',
  seaName: 'Tasman Sea',
  labels: [
    { text: 'RUAHINE RANGE', kind: 'range', u: 0.64, v: 0.16 },
    { text: 'TARARUA RANGE', kind: 'range', u: 0.43, v: 0.645 },
    { text: 'Te Āpiti, the Manawatū Gorge', kind: 'feature', u: 0.502, v: 0.505, dy: 30 },
    { text: 'Palmerston North', kind: 'town', u: 0.40, v: 0.495 },
    { text: 'Feilding', kind: 'town', u: 0.435, v: 0.37 },
    { text: 'Ashhurst', kind: 'town', u: 0.462, v: 0.448 },
    { text: 'Woodville', kind: 'town', u: 0.565, v: 0.515 }
  ]
};
try { if (typeof window !== 'undefined') window.TM_ATTRACT = TM_ATTRACT; } catch (_) {}

const Attract = {
  mode: 'off',             // off | enter | idle | intro | outro
  reason: null,
  _t0: 0,                  // the mode's start (millis), re-anchored over a hitch hidden under black
  _v0: 0,                  // the veil the mode started from (the intro can begin mid-fade)
  _resetAt: null,          // enter/outro: when the world was reset under the black (t, ms into the mode)
  _noReset: false,         // enter at boot: the world is already fresh
  _mapEnd: 0,              // intro/outro: when the map starts to leave (a skip brings it forward)
  _lineOut: 0,             // intro: when the line starts to fade out (a skip brings it forward)
  _idleSince: 0,
  _map: null, _mapKey: null,
  _cards: {}, _cardsW: 0,

  get active() { return this.mode !== 'off'; },
  // The attract proper: the land with no UI, waiting for a visitor.
  get idle() { return this.mode === 'idle'; },

  _now() { return (typeof millis === 'function') ? millis() : 0; },
  _ease(u) { u = u < 0 ? 0 : (u > 1 ? 1 : u); return u * u * (3 - 2 * u); },
  _t() { return this._now() - this._t0; },
  _wallOn() { return !!TM_ATTRACT.enabled; },

  // ---- entry points ---------------------------------------------------------------------------------
  // The wall's boot: straight into the attract, up out of black (the world is fresh at 1 Ma). A ?dev
  // page boots into play (the harness, authoring) unless ?attract=1.
  boot(g) {
    if (!this._wallOn() || !TM_ATTRACT.bootInAttract || !g || !g.terrain) return false;
    let want = !(typeof Kiosk !== 'undefined' && Kiosk.devMode);
    try { const q = new URLSearchParams(location.search); if (q.get('attract') === '1') want = true; if (q.get('attract') === '0') want = false; } catch (_) {}
    if (!want) return false;
    return this.enter(g, 'boot', { startBlack: true, noReset: true });
  },

  // The idle timer (Kiosk.tick): the land goes to black, a fresh 1 Ma world comes up with no UI.
  // Refused while any of this, or the dev attract sequence, is already running.
  enter(g, reason = 'idle', opts = null) {
    g = g || this._game();
    if (!this._wallOn() || !g || !g.terrain || this.mode === 'enter' || this.mode === 'outro' || this.mode === 'idle') return false;
    if (typeof Palaeo !== 'undefined' && Palaeo.active) return false;
    const start = opts && opts.startBlack;
    this._v0 = start ? 1 : this.veilAlpha();
    this._uiFrom = start ? 0 : 1;                                    // from play the UI goes down with the land
    this.mode = 'enter'; this.reason = reason; this._t0 = this._now();
    this._resetAt = null; this._noReset = !!(opts && opts.noReset); this._pendingBreak = false;
    return true;
  },

  // The end of the window (Game.update, every frame until it takes): the outro over the present-day map,
  // then the attract. It waits for an eruption to play out first: the window ends on Ōruanui, whose charge
  // and ash cloud the visitor should see, and whose white flash must not fight the dip to black.
  outro(g) {
    g = g || this._game();
    if (!this._wallOn() || !g || !g.terrain || this.active) return false;
    if (typeof Palaeo !== 'undefined' && Palaeo.active) return false;
    const now = this._now();
    if (g._tmAutoErAt || g._tmErDownAt || g._tmAttractErAt || (g._ashCloudUntil || 0) > now || (g._tmAshUntil || 0) > now) return false;
    this.mode = 'outro'; this.reason = 'end-of-window'; this._t0 = this._now(); this._v0 = 0; this._pendingBreak = false;
    this._resetAt = null; this._mapChecked = false; this._mapEnd = this._outroMarks().mapUp + TM_ATTRACT.outroMapMs;
    return true;
  },

  // A visitor's input while any of this runs (Game.handleKey/handleClick, mouseWheel, TMBus). Returns true:
  // it is always consumed (presence), never a button on the world.
  onInput(g) {
    const T = TM_ATTRACT, t = this._t();
    if (this.mode === 'idle') { this._beginIntro(); return true; }
    if (this.mode === 'enter') {
      if (this._resetAt != null) this._beginIntro();   // fading up onto the fresh world: go straight in
      else this._pendingBreak = true;                  // still going down: the intro starts once the world is reset
      return true;
    }
    if (this.mode === 'intro') {
      const M = this._introMarks();
      if (t >= M.mapUp + T.skipAfterMs && t < this._mapEnd - T.cardFadeMs) this._mapEnd = t + T.cardFadeMs;   // the card out, then the land
      else if (t >= M.landIn && t < this._lineOut) this._lineOut = t;                                       // the line out, then the UI
      return true;
    }
    if (this.mode === 'outro') {
      const M = this._outroMarks();
      if (t >= M.mapUp + T.outroSkipAfterMs && t < this._mapEnd - T.cardFadeMs) this._mapEnd = t + T.cardFadeMs;
      this._pendingBreak = true;                       // someone is here: after the outro, the intro rather than the idle land
      return true;
    }
    return false;
  },

  _beginIntro() {
    const T = TM_ATTRACT;
    this._v0 = this.veilAlpha();
    this.mode = 'intro'; this.reason = 'intro'; this._t0 = this._now(); this._mapChecked = false;
    this._lineOut = Infinity;   // a skip brings it forward; otherwise the marks' own (_introMarks)
    this._mapEnd = T.dipMs + T.mapInMs + T.mapMs;
  },

  _game() { return (typeof game !== 'undefined') ? game : null; },

  // ---- the timelines (ms from the mode's start) -----------------------------------------------------
  _introMarks() {
    const T = TM_ATTRACT, black = T.dipMs, mapUp = black + T.mapInMs;
    const landIn = this._mapEnd + T.crossMs;
    const lineOut = Math.min(this._lineOut, landIn + T.lineInAt + T.lineFadeMs + T.lineHoldMs);
    const uiIn = lineOut + T.lineFadeMs;
    return { black, mapUp, landIn, lineOut, uiIn, done: uiIn + T.uiInMs };
  },
  _outroMarks() {
    const T = TM_ATTRACT, black = T.dipMs, mapUp = black + T.mapInMs;
    return { black, mapUp, mapGone: this._mapEnd + T.dipMs };
  },

  // ---- per frame (Game.update, after Milestone.update) ----------------------------------------------
  update(g) {
    if (this.mode === 'off') return;
    if ((typeof Palaeo !== 'undefined' && Palaeo.active) || !g) { this._stop(); return; }   // the dev sequence took the wall
    if (typeof DeepTime !== 'undefined') DeepTime.held = true;      // real time: geology still, life at 1×
    const T = TM_ATTRACT, now = this._now();
    let t = now - this._t0;
    if (this.mode === 'enter') {
      const D = this._v0 >= 1 ? 0 : T.dipMs;
      if (this._resetAt == null && t >= D) {                        // full black: the new visitor's world, under it
        const before = this._now();
        this._resetUnderBlack(g, this._noReset);
        this._t0 += this._now() - before;                            // the hitch never eats the fade up
        this._resetAt = this._now() - this._t0;
        if (this._pendingBreak) { this._pendingBreak = false; this._beginIntro(); return; }   // pressed on the way down
      }
      if (this._resetAt != null && this._now() - this._t0 >= this._resetAt + T.upMs) { this.mode = 'idle'; this._idleSince = this._now(); }
    } else if (this.mode === 'idle') {
      // Left alone a while, a fresh world; and if the world was swapped under it (an error recovery lands
      // on an eruption checkpoint, not the opening), back to the opening so the intro's line stays true.
      const moved = (typeof DeepTime !== 'undefined') && DeepTime.yearsBP !== DeepTime.yearsStart;
      if (moved || (T.refreshMinutes > 0 && now - this._idleSince > T.refreshMinutes * 60000)) { this.mode = 'off'; this.enter(g, moved ? 'recover' : 'refresh'); }
    } else if (this.mode === 'intro' || this.mode === 'outro') {
      // Under the black, before the map comes up: (re)build it if the land or the view has changed since.
      // The attract built it for the intro, so this is a no-op there unless the wall was resized.
      if (!this._mapChecked && t >= T.dipMs) {
        this._mapChecked = true;
        const before = this._now(); this._ensureMap(g); this._t0 += this._now() - before; t = this._now() - this._t0;
      }
    }
    if (this.mode === 'intro') {
      if (t >= this._introMarks().done) this._finish();
    } else if (this.mode === 'outro') {
      const M = this._outroMarks();
      if (this._resetAt == null && t >= M.mapGone) {
        const before = this._now();
        this._resetUnderBlack(g, false);
        this._t0 += this._now() - before;
        this._resetAt = this._now() - this._t0;
        if (this._pendingBreak) { this._pendingBreak = false; this._beginIntro(); return; }   // someone pressed during it
      }
      if (this._resetAt != null && this._now() - this._t0 >= this._resetAt + T.upMs) { this.mode = 'idle'; this._idleSince = this._now(); }
    }
  },

  _finish() {
    this.mode = 'off'; this.reason = null;
    if (typeof DeepTime !== 'undefined') DeepTime.held = false;
  },
  _stop() { this._finish(); this._resetAt = null; },

  // A new visitor's world at the window's opening, under the black: the land back to 1 Ma (or, every
  // Kiosk.reseedEvery-th time, a new land), a fresh Simulation (Kiosk.landAttract: the reset bookkeeping
  // and the idle timer), the run's transient state cleared, and the present-day map rebuilt if the land
  // changed. Synchronous and heavy only in the rare reseed; the black hides it and the heartbeat is stamped.
  _resetUnderBlack(g, noReset) {
    const DT = (typeof DeepTime !== 'undefined') ? DeepTime : null;
    if (!noReset) {
      const K = (typeof Kiosk !== 'undefined') ? Kiosk : null;
      const reseed = !!(K && K.takeReseed && K.takeReseed());
      if (reseed) g.init();                                          // a new land at 1 Ma (DeepTime.reset inside)
      else if (DT) {
        const y0 = DT.yearsStart;
        if (g.terrain && (g._bakedYearsBP !== y0 || g.terrain.morphInProgress)) {
          DT.seekTo(y0);
          g.terrain.morphTo(y0, (typeof CONFIG !== 'undefined') ? CONFIG.morphBakeScale : undefined);
          g._bakedYearsBP = y0; g._lastMorphMs = this._now();
          if (g.water) g.water.build(g.terrain, y0);
        }
      }
      g._tmAshUntil = 0; g._tmErDownAt = 0; g._tmErFired = false; g._tmAutoErAt = 0; g._tmAutoErupt = null;
      g._boostHi = null; g._tmEdgePulse = null;
      if (K && K.landAttract) K.landAttract(g, this.reason || 'idle');
      else if (g.resetEcosystem) g.resetEcosystem();
    }
    this._ensureMap(g);
    if (DT) DT.held = true;
    if (typeof Kiosk !== 'undefined' && Kiosk.beat) Kiosk.beat();   // a legitimate long rebuild is not a stall
  },

  // ---- what the frame reads -------------------------------------------------------------------------
  // The HUD's opacity (GameUI): it goes with the land under the black, stays off through the attract and
  // the map, and fades in at the end of the intro.
  uiAlpha() {
    if (this.mode === 'off') return 1;
    const T = TM_ATTRACT, t = this._t();
    if (this.mode === 'enter') { const D = this._v0 >= 1 ? 0 : T.dipMs; return (D > 0 && t < D) ? (this._uiFrom || 0) * (1 - this._ease(t / D)) : 0; }
    if (this.mode === 'outro') return t < T.dipMs ? 1 - this._ease(t / T.dipMs) : 0;
    if (this.mode === 'intro') { const M = this._introMarks(); return t < M.uiIn ? 0 : this._ease((t - M.uiIn) / T.uiInMs); }
    return 0;
  },

  // The black over the world (under the map).
  veilAlpha() {
    if (this.mode === 'off' || this.mode === 'idle') return 0;
    const T = TM_ATTRACT, t = this._t(), v0 = this._v0 || 0;
    if (this.mode === 'enter') {
      const D = v0 >= 1 ? 0 : T.dipMs;
      if (this._resetAt == null) return D > 0 ? v0 + (1 - v0) * this._ease(t / D) : 1;
      return 1 - this._ease((t - this._resetAt) / T.upMs);
    }
    if (this.mode === 'intro') {
      const M = this._introMarks();
      if (t < M.black) return v0 + (1 - v0) * this._ease(t / M.black);
      return t < M.mapUp ? 1 : 0;                                    // the map is opaque from mapUp; it crossfades into the land itself
    }
    if (this.mode === 'outro') {
      if (t < T.dipMs) return this._ease(t / T.dipMs);
      if (this._resetAt == null) return 1;
      return 1 - this._ease((t - this._resetAt) / T.upMs);
    }
    return 0;
  },

  mapAlpha() {
    const T = TM_ATTRACT, t = this._t();
    if (this.mode === 'intro') {
      const M = this._introMarks();
      if (t < M.black) return 0;
      if (t < M.mapUp) return this._ease((t - M.black) / T.mapInMs);
      if (t < this._mapEnd) return 1;
      return 1 - this._ease((t - this._mapEnd) / T.crossMs);
    }
    if (this.mode === 'outro') {
      const M = this._outroMarks();
      if (t < M.black || this._resetAt != null) return 0;
      if (t < M.mapUp) return this._ease((t - M.black) / T.mapInMs);
      if (t < this._mapEnd) return 1;
      return 1 - this._ease((t - this._mapEnd) / T.dipMs);
    }
    return 0;
  },

  // The card over the map (intro / outro): in after cardInAt, out before the map leaves.
  cardAlpha() {
    if (this.mode !== 'intro' && this.mode !== 'outro') return 0;
    const T = TM_ATTRACT, t = this._t();
    if (this.mode === 'outro' && this._resetAt != null) return 0;
    const a = this._ease((t - T.dipMs - T.cardInAt) / T.cardFadeMs);
    const b = this._ease((this._mapEnd - t) / T.cardFadeMs);
    return a < b ? a : b;
  },

  // The island inset (TM_ATTRACT.inset): which two dates, how far from the first to the second, and how
  // strongly. Intro: up with the card, today → 1 Ma in step with the map's cross into the land, out with
  // the line (before the UI). Outro: with the card, the LGM → today at outroSwitchMs (earlier if the map
  // was skipped, so the change is seen before the card leaves). Returns a reused object, or null.
  insetState() {
    if (this.mode !== 'intro' && this.mode !== 'outro') return null;
    const T = TM_ATTRACT, I = T.inset, t = this._t(), s = this._inset || (this._inset = { a: null, b: null, mix: 0, alpha: 0, ctx: '' });
    if (!I) return null;
    if (this.mode === 'intro') {
      const M = this._introMarks();
      const inA = this._ease((t - T.dipMs - T.cardInAt) / T.cardFadeMs);
      const outA = this._ease((M.lineOut + T.lineFadeMs - t) / T.lineFadeMs);
      s.a = I.intro[0]; s.b = I.intro[1]; s.ctx = 'intro';
      s.alpha = inA < outA ? inA : outA;
      s.mix = t < this._mapEnd ? 0 : this._ease((t - this._mapEnd) / T.crossMs);
    } else {
      const M = this._outroMarks();
      let sw = M.mapUp + I.outroSwitchMs;
      const late = this._mapEnd - T.cardFadeMs - I.crossMs;            // a skip: still change before the card leaves
      if (sw > late) sw = late;
      s.a = I.outro[0]; s.b = I.outro[1]; s.ctx = 'outro';
      s.alpha = this.cardAlpha();
      s.mix = this._ease((t - sw) / I.crossMs);
    }
    return s.alpha > 0.004 ? s : null;
  },

  // The one line over the live land, after the intro's map.
  lineAlpha() {
    if (this.mode !== 'intro') return 0;
    const T = TM_ATTRACT, t = this._t(), M = this._introMarks();
    const a = this._ease((t - M.landIn - T.lineInAt) / T.lineFadeMs);
    const b = this._ease((M.lineOut + T.lineFadeMs - t) / T.lineFadeMs);
    return a < b ? a : b;
  },

  // ---- drawing (end of _drawFrame, over everything but the milestone's own) --------------------------
  render(W, H) {
    if (this.mode === 'off') return;
    const va = this.veilAlpha(), ma = this.mapAlpha();
    if (va > 0.002) { push(); noStroke(); fill(0, 0, 0, 255 * va); rect(-60, -60, W + 120, H + 120); pop(); }
    const dc = (typeof drawingContext !== 'undefined') ? drawingContext : null, a0 = dc ? dc.globalAlpha : 1;
    if (ma > 0.002 && this._map) {
      if (dc) dc.globalAlpha = a0 * ma;                              // the fades ride globalAlpha, never a per-frame tint
      imageMode(CORNER); noTint(); image(this._map, 0, 0, W, H);
      if (dc) dc.globalAlpha = a0;
    }
    const ca = this.cardAlpha();
    if (ca > 0.004) this._blitCard(this.mode, ca, W, H);
    const la = this.lineAlpha();
    if (la > 0.004) this._blitCard('line', la, W, H);
    const ins = (typeof IslandInset !== 'undefined') ? this.insetState() : null;
    if (ins) IslandInset.draw(null, ins.a, ins.b, ins.mix, ins.alpha, W, H, ins.ctx);
  },

  _blitCard(key, alpha, W, H) {
    const c = this._card(key, W);
    if (!c) return;
    const dc = (typeof drawingContext !== 'undefined') ? drawingContext : null, a0 = dc ? dc.globalAlpha : 1;
    if (dc) dc.globalAlpha = a0 * alpha;
    imageMode(CORNER); noTint();
    image(c.buf, Math.round((W - c.w) / 2), Math.round(H * TM_ATTRACT.cardY[key] - c.h / 2), c.w, c.h);
    if (dc) dc.globalAlpha = a0;
  },

  // ---- the cards: rasterised once per width -----------------------------------------------------------
  _card(key, W) {
    if (this._cardsW !== W) { this._freeCards(); this._cardsW = W; }
    if (this._cards[key]) return this._cards[key];
    const T = TM_ATTRACT, C = T.copy;
    const spec = key === 'line' ? { title: C.line, body: null, ts: 64 }
               : { title: C[key].title, body: C[key].body, ts: 64 };
    return (this._cards[key] = this._buildCard(spec, W));
  },

  _wrap(str, maxW) {
    const words = String(str).split(' '), lines = [];
    let line = '';
    for (const w of words) {
      const tryLine = line ? line + ' ' + w : w;
      if (line && textWidth(tryLine) > maxW) { lines.push(line); line = w; } else line = tryLine;
    }
    if (line) lines.push(line);
    return lines;
  },

  // Halo text on a soft dark backdrop that fades out beyond it (the milestone card's look).
  _buildCard(spec, W) {
    const T = TM_ATTRACT, font = (typeof FreckleFace !== 'undefined') ? FreckleFace : null;
    const TS = spec.ts, BS = 34, PAD = 50, PADX = 120, GAP = 18;
    const maxW = Math.min(W * 0.72, 1320);
    push(); if (font) textFont(font);
    textSize(TS); const titleW = textWidth(spec.title);
    textSize(BS); const lines = spec.body ? this._wrap(spec.body, maxW) : [];
    let bodyW = 0; for (const l of lines) bodyW = Math.max(bodyW, textWidth(l));
    pop();
    const w = Math.ceil(Math.max(titleW, bodyW) + 2 * PADX);
    const h = Math.ceil(PAD + TS * 1.1 + (lines.length ? GAP + lines.length * BS * 1.32 : 0) + PAD);
    const b = createGraphics(w, h);
    if (b.pixelDensity && typeof mainCanvasSS === 'function' && mainCanvasSS() > 1) b.pixelDensity(mainCanvasSS());
    b.clear();
    const dc = b.drawingContext;
    if (dc && dc.createRadialGradient) {
      dc.save(); dc.translate(w / 2, h / 2); dc.scale(w / 2, h / 2);
      const gr = dc.createRadialGradient(0, 0, 0, 0, 0, 1);
      gr.addColorStop(0, 'rgba(8,14,12,0.9)'); gr.addColorStop(0.8, 'rgba(8,14,12,0.82)'); gr.addColorStop(1, 'rgba(8,14,12,0)');   // dense enough that a map name under it does not read through
      dc.fillStyle = gr; dc.fillRect(-1, -1, 2, 2); dc.restore();
    }
    const Hh = T.colHalo;
    const say = (str, size, y, col) => {
      if (font) b.textFont(font);
      b.textSize(size); b.textAlign(CENTER, CENTER); b.noStroke();
      b.fill(Hh[0], Hh[1], Hh[2], Hh[3]); b.text(str, w / 2 + 2, y + 3);
      b.fill(col[0], col[1], col[2]); b.text(str, w / 2, y);
    };
    let y = PAD + TS * 0.55;
    say(spec.title, TS, y, lines.length ? T.colTitle : T.colText);
    y += TS * 0.55 + GAP + BS * 0.66;
    for (const l of lines) { say(l, BS, y, T.colText); y += BS * 1.32; }
    return { buf: b, w, h };
  },

  _freeCards() {
    for (const k in this._cards) { const c = this._cards[k]; if (c && c.buf && c.buf.remove) c.buf.remove(); }   // createGraphics is a real canvas (CLAUDE.md)
    this._cards = {};
  },

  // ---- the present-day map ----------------------------------------------------------------------------
  // Keyed to the land (its seed) and the view: a reseed, a refit or a resize rebuilds it, under black.
  _mapKeyFor(g) {
    const t = g && g.terrain;
    if (!t || typeof CONFIG === 'undefined') return null;
    return t.seed + '|' + CONFIG.canvasWidth + 'x' + CONFIG.canvasHeight + '|' + CONFIG.viewX + ',' + CONFIG.viewY + ',' + (+CONFIG.viewZoom).toFixed(5) + '|' + t.mapWidth + 'x' + t.mapHeight;
  },

  _ensureMap(g) {
    const key = this._mapKeyFor(g);
    if (!key) return false;
    // The island inset's maps for the intro and the outro, built here because this runs under black (a
    // no-op once built for this view)
    if (typeof IslandInset !== 'undefined' && TM_ATTRACT.inset) IslandInset.prepare(TM_ATTRACT.inset.intro.concat(TM_ATTRACT.inset.outro));
    if (this._map && this._mapKey === key) return true;
    return this._buildMap(g, key);
  },

  // The land at 0 BP from the sim's own terrain (TerrainGenerator.snapshotYear), drawn in the view the
  // world is drawn in, toned and washed so it reads as today's map, then the names. Synchronous (about
  // one morph), so only ever under black. A running morph is finished first (snapshotYear needs the live
  // land to be the one baked at Game._bakedYearsBP).
  _buildMap(g, key) {
    const T = TM_ATTRACT, terr = g.terrain;
    if (!terr || !terr.snapshotYear || typeof CONFIG === 'undefined') return false;
    if (terr.morphInProgress) { while (terr.morphInProgress) terr.morphStep(Infinity); if (g._onMorphComplete) g._onMorphComplete(); }
    const restore = (g._bakedYearsBP != null) ? g._bakedYearsBP : ((typeof DeepTime !== 'undefined') ? DeepTime.yearsBP : 1000000);
    const W = CONFIG.canvasWidth, H = CONFIG.canvasHeight, z = CONFIG.viewZoom, vx = CONFIG.viewX, vy = CONFIG.viewY;
    const placed = [];
    const P = (typeof Projection !== 'undefined') ? Projection : null;
    const toScreen = (t, u, v) => {
      const x = u * t.mapWidth, y = v * t.mapHeight;
      const lift = t.paintLiftAt ? t.paintLiftAt(x, y) : 0;
      return { x: vx + x * z, y: vy + (P ? P.groundY(y, lift) : y) * z, water: t.waterTypeAt ? t.waterTypeAt(x, y) : 0 };
    };
    const onScreen = (p) => p.x > 70 && p.x < W - 70 && p.y > 40 && p.y < H - 40;
    const bb = terr.snapshotYear(T.mapYearsBP, restore, 'interglacial', (t) => {
      for (const L of T.labels) {
        const a = toScreen(t, L.u, L.v);
        if (L.kind === 'town' && a.water !== 0) continue;            // never a town in the water
        if (!onScreen(a)) continue;
        placed.push({ L, x: a.x, y: a.y, ang: 0 });
      }
      this._placeRiverAndMouth(t, toScreen, onScreen, placed);
      this._placeSea(t, W, H, vx, vy, z, P, placed);
    });
    if (!bb) return false;
    if (this._map && this._map.remove) this._map.remove();
    const m = createGraphics(W, H);
    if (m.pixelDensity) m.pixelDensity(1);
    m.background(18, 40, 56);                                        // the letterbox, if the view ever leaves one
    const mdc = m.drawingContext;
    if (mdc && 'filter' in mdc && T.mapFilter) mdc.filter = T.mapFilter;
    if (mdc && 'imageSmoothingEnabled' in mdc) mdc.imageSmoothingEnabled = true;
    m.image(bb, vx, vy, terr.mapWidth * z, (terr._paintWorldH || terr.mapHeight) * z);
    if (mdc && 'filter' in mdc) mdc.filter = 'none';
    terr._releaseBakeBuffer(bb);
    const Wa = T.mapWash;
    if (Wa && Wa[3] > 0) { m.noStroke(); m.fill(Wa[0], Wa[1], Wa[2], Wa[3]); m.rect(0, 0, W, H); }
    this._drawLabels(m, placed);
    this._map = m; this._mapKey = key; this.mapLabels = placed;   // mapLabels: what was named, and where (read by the harness)
    return true;
  },

  // Off the land at 0 BP: walk the main channel (as drawn at that date, meanders and all) up from its
  // seaward end; where it leaves the sea is the mouth. The town goes on the nearest dry ground north of
  // it, and the river's name along the reach a third of the way from the mouth to the gorge.
  _placeRiverAndMouth(t, toScreen, onScreen, placed) {
    const T = TM_ATTRACT, R = t.getRivers ? t.getRivers() : null;
    const main = R && R.find ? R.find(r => r && r.type === 'main') : null;
    const pts = main && main.pts;
    if (!pts || pts.length < 4) return;
    const typeAt = (p) => t.waterTypeAt ? t.waterTypeAt(p[0] * t.mapWidth, p[1] * t.mapHeight) : 0;
    let c = -1;
    for (let k = 0; k < pts.length; k++) if (typeAt(pts[k]) !== 1) { c = k; break; }   // the first point off the sea
    if (c < 0) return;
    let gi = c, gd = Infinity;                                       // the point nearest the gorge
    for (let k = c; k < pts.length; k++) { const d = Math.abs(pts[k][0] - 0.497) + Math.abs(pts[k][1] - 0.53); if (d < gd) { gd = d; gi = k; } }
    if (T.mouthTown) {
      const m0 = pts[c];
      for (const d of [0.02, 0.03, 0.045, 0.06, 0.08]) {
        const s = toScreen(t, m0[0] + d * 0.3, m0[1] - d);
        if (s.water === 0 && onScreen(s)) { placed.push({ L: { text: T.mouthTown, kind: 'town' }, x: s.x, y: s.y, ang: 0 }); break; }
      }
    }
    if (T.riverName && gi - c >= 6) {
      const i = c + Math.round((gi - c) * 0.35), j0 = Math.max(c, i - 4), j1 = Math.min(pts.length - 1, i + 4);
      const a = toScreen(t, pts[i][0], pts[i][1]), p0 = toScreen(t, pts[j0][0], pts[j0][1]), p1 = toScreen(t, pts[j1][0], pts[j1][1]);
      let ang = Math.atan2(p1.y - p0.y, p1.x - p0.x);
      if (ang > Math.PI / 2) ang -= Math.PI; else if (ang < -Math.PI / 2) ang += Math.PI;   // never upside down
      if (onScreen(a)) placed.push({ L: { text: T.riverName, kind: 'river', dy: 26 }, x: a.x, y: a.y, ang });
    }
  },

  // The sea's name in the widest run of open sea along a few screen rows (the sea is drawn flat, so a
  // row maps straight back to the world).
  _placeSea(t, W, H, vx, vy, z, P, placed) {
    const T = TM_ATTRACT;
    if (!T.seaName || !t.waterTypeAt) return;
    const K = P ? P.K : 1, LIFT = (P && P.relief) ? P.LIFT : 0;
    let best = null;
    for (const fy of [0.3, 0.45, 0.6, 0.18]) {
      const sy = H * fy, wy = ((sy - vy) / z - LIFT) / K;
      let run = 0, start = 0;
      for (let sx = 40; sx < W - 40; sx += 8) {
        const sea = t.waterTypeAt((sx - vx) / z, wy) === 1;
        if (sea) { if (!run) start = sx; run += 8; }
        if ((!sea || sx + 8 >= W - 40) && run) {
          if (!best || run > best.run) best = { run, x: start + run / 2, y: sy };
          run = 0;
        }
      }
    }
    if (best && best.run >= 230) placed.push({ L: { text: T.seaName, kind: 'sea' }, x: best.x, y: best.y, ang: 0 });
  },

  _drawLabels(m, placed) {
    const T = TM_ATTRACT, font = (typeof FreckleFace !== 'undefined') ? FreckleFace : null;
    const ink = T.colInk, wink = T.colWaterInk, halo = T.colInkHalo;
    const say = (str, size, x, y, col, spacing) => {
      if (font) m.textFont(font);
      m.textSize(size); m.textAlign(CENTER, CENTER); m.noStroke();
      if (spacing) str = str.split('').join(' ');                  // a range's spaced capitals
      for (let k = 0; k < 8; k++) {                                 // a soft light halo, like a printed map
        const a = k * Math.PI / 4;
        m.fill(halo[0], halo[1], halo[2], halo[3] * 0.55);
        m.text(str, x + Math.cos(a) * 2.2, y + Math.sin(a) * 2.2);
      }
      m.fill(col[0], col[1], col[2]); m.text(str, x, y);
    };
    for (const p of placed) {
      const L = p.L, x = p.x + (L.dx || 0), y = p.y + (L.dy || 0);
      if (L.kind === 'town') {
        m.stroke(halo[0], halo[1], halo[2]); m.strokeWeight(3); m.fill(ink[0], ink[1], ink[2]);
        m.circle(p.x, p.y, 13); m.noStroke();
        say(L.text, 30, x, y - 24, ink);
      } else if (L.kind === 'river') {
        m.push(); m.translate(p.x, p.y); m.rotate(p.ang); say(L.text, 30, L.dx || 0, L.dy || 0, wink); m.pop();   // its offset is across the channel
      } else if (L.kind === 'sea') {
        say(L.text, 34, x, y, wink);
      } else if (L.kind === 'range') {
        say(L.text, 28, x, y, ink, true);
      } else {
        say(L.text, 26, x, y, ink);
      }
    }
  }
};
try { if (typeof window !== 'undefined') window.Attract = Attract; } catch (_) {}
