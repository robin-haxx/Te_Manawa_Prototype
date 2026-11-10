// ============================================================
// TE MANAWA: THE HEALTH MILESTONES (2026-11-08)
// ------------------------------------------------------------
// The ledger (Simulation.ecoHealth, the HUD's bar) has two beats of its own:
//   · FULL. The wall fades to WHITE and back onto the land with every piece of UI gone, the clock
//     held and the sim playing in real time for showMs. Under the white the land is grown in to what
//     the ledger holds (Simulation.settle), so the reveal is the thriving land the visitor earned, in
//     whichever climate it is: a forest in the interglacial, lush open country in the glacial. A
//     congratulations and the count of every bird kind fade in over it, then out, and the UI returns.
//   · WARNING, at or under warnAt. The same through BLACK, onto a desaturated land (the ground's
//     saturate() via satCap, the cast's layer via a CSS filter), with a warning and the counts.
// Each plays once per climb: full re-arms once the bar has fallen back to rearmFullBelow, the warning
// once the land has climbed back to rearmWarnAbove. The armed flags ride the Simulation
// (sim.milestones), so an eruption rebuild carries them and a new visitor starts fresh. A beat waits
// for the land to be AT REST (no boost time-lapse or deep burst, no eruption pending, charging or under
// its cloud, no storm, no crossfade) and for the bar to have arrived, then checks the land is still
// there. While one plays, a visitor's input is presence only (Kiosk.noteInput), from the wall's keys
// and the console alike (Game.handleKey/handleClick, mouseWheel, TMBus.onMessage); the attract sequence,
// or a rebuild under it (an error recovery), stands it down.
// Photosensitivity (CLAUDE.md): the veil ramps 1.2 s up and 1.4 s down, one rise and one fall; the
// desaturation rides the ground's HEALTH slew cap. Allocation: the card is rasterised ONCE into one
// buffer under the veil and remove()d at the end; a frame only blits it.
// Authoring: Milestone.play('thriving' | 'warning') in the console plays one now, at rest or not.
// ============================================================

const TM_MILESTONE = {
  enabled: true,
  warnAt: 0.25,            // the warning plays when the ledger reaches this or less (full plays at exactly 1)
  rearmFullBelow: 0.75,    // full plays again only after the bar has fallen back to here (healthMatchedCap)…
  rearmWarnAbove: 0.5,     // …the warning only after the land has climbed back to here (healthStart)
  stillFullAbove: 0.9,     // when a beat's turn comes, the land must still be this high, or this low,
  stillWarnBelow: 0.3,     // or the beat is dropped (and re-armed)
  settleMs: 1600,          // the bar's own ease to its new length (InstallHUD.HEALTH_EASE) comes first
  fadeInMs: 1200,          // the veil rises (≥ 500 ms)…
  holdMs: 500,             // …holds while the land is staged under it…
  fadeOutMs: 1400,         // …and falls, the first part of the show
  showMs: 15000,           // the land with no UI, real time, counted from the moment the veil starts to fall
  endMs: 1200,             // the UI's fade back in (and the warning's colour back)
  cardInMs: 1200,          // into the show the card fades in, starting here…
  cardFadeMs: 1000,        // …over this, and out over the same…
  cardOutMs: 1400,         // …ending this long before the show does
  warnSat: 0.15,           // the warning land's saturation, ground and cast
  cardY: 0.46,             // the card's centre, as a share of the height
  colText: [236, 244, 240],
  colNum: [255, 236, 190],   // the counts, in the HUD's tally numeral colour (InstallHUD._TALLY_NUM_COL): they read on green forest
  colHalo: [8, 14, 12, 170],
  colWarn: [238, 170, 108],
  thriving: {
    veil: [255, 255, 255],
    title: 'Congratulations!',
    line: { interglacial: 'You brought the forest back to full health.',
            glacial:      'You brought the ice-age land back to full health.' },
    head: 'Living on the land now'
  },
  warning: {
    veil: [0, 0, 0],
    title: 'The land is struggling',
    line: { interglacial: 'Its plants and birds are dying back. Plants that suit the climate, and fewer storms, will bring it back.',
            glacial:      'Its plants and birds are dying back. Plants that suit the cold, and fewer storms, will bring it back.' },
    head: 'Still living on the land'
  },
  // The cast in the card's order (ground birds, then the forest flyers, then the harrier), with the names
  // a visitor reads. A kind missing here falls back to its registry displayName.
  order: ['north_island_giant_moa', 'little_bush_moa', 'stout_legged_moa', 'mantells_moa',
          'giant_goose', 'north_island_takahe', 'north_island_brown_kiwi', 'finschs_duck',
          'kereru', 'kokako', 'huia', 'tui', 'eyles_harrier'],
  names: {
    north_island_giant_moa: 'Giant moa', little_bush_moa: 'Little bush moa', stout_legged_moa: 'Stout-legged moa',
    mantells_moa: "Mantell's moa", giant_goose: 'North Island goose', north_island_takahe: 'Mōho',
    north_island_brown_kiwi: 'Kiwi', finschs_duck: "Finsch's duck", kereru: 'Kererū', kokako: 'Kōkako',
    huia: 'Huia', tui: 'Tūī', eyles_harrier: "Eyles' harrier"
  }
};
try { if (typeof window !== 'undefined') window.TM_MILESTONE = TM_MILESTONE; } catch (_) {}

const Milestone = {
  _state: 'idle',          // idle | pending | in | hold | show | end
  _kind: null,             // 'thriving' | 'warning' while one plays
  _pendingKind: null, _pendingAt: 0, _force: false,
  _t0: 0,                  // the beat's start (millis), re-anchored past the staging hitches
  _sim: null,              // the Simulation it began on: a rebuild under it stands it down
  _staged: false, _carded: false,
  _card: null, _cardW: 0, _cardH: 0,
  _satQ: -1,               // the cast filter's last quantised saturation (-1 = no filter set)
  counts: null,            // the card's counts, [{ key, name, n }] (read by the harness)

  // Playing (the veil, the land with no UI, or the UI's return). Pending is not playing.
  get active() { return this._state === 'in' || this._state === 'hold' || this._state === 'show' || this._state === 'end'; },
  get kind() { return this.active ? this._kind : null; },

  // ---- per frame (Game.update, before the attract's early return) ----------------------------------
  update(g) {
    const T = TM_MILESTONE, now = (typeof millis === 'function') ? millis() : 0;
    if ((typeof Palaeo !== 'undefined' && Palaeo.active) ||         // the attract (or the dev sequence) owns the wall
        (typeof Attract !== 'undefined' && Attract.active)) {
      if (this.active) this._stop();
      this._pendingKind = null; if (this._state === 'pending') this._state = 'idle';
      return;
    }
    const sim = g && g.simulation;
    if (!sim) return;
    if (this.active) {
      if (sim !== this._sim) { this._stop(); return; }              // the world was rebuilt under it
      this._advance(g, now);
      return;
    }
    if (!T.enabled) return;
    this._watch(sim, now);
    if (this._pendingKind && (this._force || this._atRest(g, now))) this._begin(sim, now);
  },

  // Edge-detect the two thresholds, with the re-arm hysteresis. Allocation-free.
  _watch(sim, now) {
    const T = TM_MILESTONE, A = sim.milestones || (sim.milestones = { full: true, warn: true }), h = sim.ecoHealth;
    if (A.full) { if (h >= 1) { A.full = false; this._queue('thriving', now); } }
    else if (h <= T.rearmFullBelow) A.full = true;
    if (A.warn) { if (h <= T.warnAt + 1e-9) { A.warn = false; this._queue('warning', now); } }
    else if (h >= T.rearmWarnAbove) A.warn = true;
  },
  _queue(kind, now) { this._pendingKind = kind; this._pendingAt = now; this._force = false; this._state = 'pending'; },

  // The land at rest: nothing is playing the clock or covering the wall, and the bar has had its ease.
  _atRest(g, now) {
    if (now - this._pendingAt < TM_MILESTONE.settleMs) return false;
    if (typeof DeepTime !== 'undefined' && ((DeepTime.isTimelapsing && DeepTime.isTimelapsing()) || (DeepTime.isDeep && DeepTime.isDeep()))) return false;
    if (typeof TMBus !== 'undefined' && TMBus.busy && TMBus.busy()) return false;   // an eruption a boost stopped short of
    if (g._tmErDownAt || g._tmAutoErAt || g._tmAttractErAt) return false;            // an eruption charging
    if ((g._ashCloudUntil || 0) > now || (g._tmAshUntil || 0) > now || (g._tmStormUntil || 0) > now) return false;
    if (typeof Kiosk !== 'undefined' && (Kiosk._fadeUntil || 0) > now) return false;
    if (typeof PlantGallery !== 'undefined' && PlantGallery.active) return false;
    return true;
  },

  _begin(sim, now) {
    const T = TM_MILESTONE, kind = this._pendingKind, h = sim.ecoHealth, force = this._force;
    this._pendingKind = null; this._force = false; this._state = 'idle';
    const still = kind === 'thriving' ? h >= T.stillFullAbove : h <= T.stillWarnBelow;
    if (!still && !force) {                                         // the land moved on while it waited
      if (sim.milestones) sim.milestones[kind === 'thriving' ? 'full' : 'warn'] = true;
      return;
    }
    this._kind = kind; this._sim = sim; this._t0 = now;
    this._staged = false; this._carded = false; this._state = 'in';
  },

  // Authoring: play one now (the console), skipping the rest and still-there checks.
  play(kind = 'thriving') {
    if (kind !== 'thriving' && kind !== 'warning') return false;
    this._pendingKind = kind; this._pendingAt = -1e9; this._force = true; this._state = 'pending';
    return true;
  },

  // ---- the timeline ---------------------------------------------------------------------------------
  // t from the beat's start: [0, in) the veil rises; [in, show) it holds, the land is staged; from show
  // the veil falls and the land plays for showMs; then the UI fades back over endMs.
  _marks() {
    const T = TM_MILESTONE, hold = T.fadeInMs, show = hold + T.holdMs, end = show + T.showMs;
    return { hold, show, end, done: end + T.endMs };
  },

  _advance(g, now) {
    const T = TM_MILESTONE, K = this._marks();
    let t = now - this._t0;
    if (t >= K.hold && !this._staged) {                             // the veil is up: stage the land under it,
      const before = millis();                                      // and hold the timeline over the hitch so the
      this._stage(g);                                               // veil never starts down mid-settle
      this._t0 += millis() - before;
      t = millis() - this._t0;
    }
    if (this._staged && !this._carded && t >= K.hold + T.holdMs * 0.6) {
      // the counts, once the settle's birds have landed (the census ran on the frames since)
      const before = millis();
      this._buildCard(this._sim);
      this._t0 += millis() - before;
    }
    t = millis() - this._t0;
    this._state = t < K.hold ? 'in' : t < K.show ? 'hold' : t < K.end ? 'show' : t < K.done ? 'end' : 'idle';
    if (this._state === 'idle') { this._stop(); return; }
    this._applyCastFilter();
  },

  _stage(g) {
    this._staged = true;
    if (typeof DeepTime !== 'undefined') DeepTime.held = true;      // real time: geology still, life at 1×
    if (g) { g._boostHi = null; g._tmEdgePulse = null; }            // the last boost's outline is UI too
    if (this._kind === 'thriving' && this._sim && this._sim.settle) this._sim.settle(true);
  },

  _stop() {
    this._state = 'idle'; this._kind = null; this._sim = null;
    this._staged = false; this._carded = false;
    if (typeof DeepTime !== 'undefined') DeepTime.held = false;
    this._freeCard();
    if (this._satQ !== -1) { this._satQ = -1; this._setCastFilter(''); }
  },

  // ---- what the frame reads -------------------------------------------------------------------------
  _ease(u) { u = u < 0 ? 0 : (u > 1 ? 1 : u); return u * u * (3 - 2 * u); },
  _t() { return ((typeof millis === 'function') ? millis() : 0) - this._t0; },

  // The HUD's opacity (GameUI): 1 under the rising veil, gone while the land plays, back over endMs.
  uiAlpha() {
    if (!this.active) return 1;
    const K = this._marks(), t = this._t();
    if (t < K.hold) return 1;
    if (t < K.end) return 0;
    return this._ease((t - K.end) / TM_MILESTONE.endMs);
  },

  veilAlpha() {
    if (!this.active) return 0;
    const T = TM_MILESTONE, K = this._marks(), t = this._t();
    if (t < K.hold) return this._ease(t / T.fadeInMs);
    if (t < K.show) return 1;
    return 1 - this._ease((t - K.show) / T.fadeOutMs);
  },

  cardAlpha() {
    if (!this.active || !this._card) return 0;
    const T = TM_MILESTONE, K = this._marks(), t = this._t();
    const a = this._ease((t - K.show - T.cardInMs) / T.cardFadeMs);
    const b = this._ease((K.end - T.cardOutMs - t) / T.cardFadeMs);
    return a < b ? a : b;
  },

  // The most the land's saturation may be (Game._updateHabitatHealth caps the ground with it; the cast's
  // filter follows it): the warning drains it as the black rises and gives it back as the UI returns.
  satCap() {
    if (this._kind !== 'warning' || !this.active) return 1;
    const T = TM_MILESTONE, K = this._marks(), t = this._t();
    const u = t < K.hold ? this._ease(t / T.fadeInMs) : (t < K.end ? 1 : 1 - this._ease((t - K.end) / T.endMs));
    return 1 + (T.warnSat - 1) * u;
  },

  // The cast's layer: the GL canvas in DOM-stack mode, else the main canvas (the 2D path draws the
  // whole world there; the HUD is hidden while this is set, and the veil and card read the same grey).
  _castEl() {
    if (typeof GLBatch !== 'undefined' && GLBatch.enabled && GLBatch.domStack && GLBatch.canvas) return GLBatch.canvas;
    return (typeof drawingContext !== 'undefined' && drawingContext && drawingContext.canvas) || null;
  },
  _setCastFilter(str) {
    const el = this._castEl();
    if (el && el.style) el.style.filter = str;
  },
  _applyCastFilter() {
    const s = this.satCap();
    const q = s >= 0.999 ? -1 : Math.round(s * 50);               // 0.02 steps: a new string only on a step
    if (q === this._satQ) return;
    this._satQ = q;
    this._setCastFilter(q === -1 ? '' : 'saturate(' + (q / 50) + ')');
  },

  // ---- drawing (end of _drawFrame, over everything) -------------------------------------------------
  render(W, H) {
    if (!this.active) return;
    const ca = this.cardAlpha(), va = this.veilAlpha();
    if (ca > 0.004 && this._card) {
      const dc = (typeof drawingContext !== 'undefined') ? drawingContext : null, a0 = dc ? dc.globalAlpha : 1;
      if (dc) dc.globalAlpha = a0 * ca;                            // the fade rides globalAlpha, never a per-frame tint
      imageMode(CORNER); noTint();
      image(this._card, Math.round((W - this._cardW) / 2), Math.round(H * TM_MILESTONE.cardY - this._cardH / 2), this._cardW, this._cardH);
      if (dc) dc.globalAlpha = a0;
    }
    if (va > 0.002) {
      const c = TM_MILESTONE[this._kind].veil;
      push(); noStroke(); fill(c[0], c[1], c[2], 255 * va);
      rect(-60, -60, W + 120, H + 120);                             // overscan, like the ash cover
      pop();
    }
  },

  // The bird counts, in the cast's order: every kind the census tracks, or any kind on the land.
  _counts(sim) {
    const T = TM_MILESTONE, F = sim && sim._fauna, out = [];
    if (!sim || !sim._faunaCount) return out;
    for (const key of T.order) {
      const n = sim._faunaCount(key);
      if (!(F && F.kind && F.kind[key]) && n <= 0) continue;
      let name = T.names[key];
      if (!name && typeof REGISTRY !== 'undefined' && REGISTRY.getSpecies) {
        const sp = REGISTRY.getSpecies(key); name = (sp && (sp.displayName || (sp.config && sp.config.displayName))) || key;
      }
      out.push({ key, name: name || key, n });
    }
    return out;
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

  // The card, rasterised once: title, line, a heading and the counts in columns, halo text (the HUD's
  // style) on a soft dark backdrop that fades out at its edges, so it reads over any land.
  _buildCard(sim) {
    this._carded = true;
    this._freeCard();
    const T = TM_MILESTONE, K = T[this._kind];
    const W = (typeof CONFIG !== 'undefined' && CONFIG.canvasWidth) || 1920;
    const font = (typeof FreckleFace !== 'undefined') ? FreckleFace : null;
    const glacial = (typeof TMGoals !== 'undefined' && TMGoals.glacialNow) ? TMGoals.glacialNow() : false;
    const titleCol = this._kind === 'thriving'
      ? ((typeof TMGoals !== 'undefined' && TMGoals.climateColor) ? TMGoals.climateColor(glacial) : [84, 210, 96])
      : T.colWarn;
    const rows = this.counts = this._counts(sim);
    const TS = 84, LS = 38, HS = 32, RS = 32, ROW_H = 48, PAD = 70, PADX = 130, GAP = 26;   // PADX: the backdrop fades out beyond the text, not across it
    const cols = W >= 1500 ? 3 : 2, colW = W >= 1500 ? 380 : 360, gutter = 40;
    const gridW = cols * colW + (cols - 1) * gutter, nRows = Math.ceil(rows.length / cols);
    push(); if (font) textFont(font);
    textSize(TS); const titleW = textWidth(K.title);
    textSize(LS); const lines = this._wrap(K.line[glacial ? 'glacial' : 'interglacial'], Math.max(gridW, W * 0.6));
    let lineW = 0; for (const l of lines) lineW = Math.max(lineW, textWidth(l));
    pop();
    const bw = Math.ceil(Math.max(gridW, titleW, lineW) + 2 * PADX);
    const bh = Math.ceil(PAD + TS * 1.15 + GAP + lines.length * LS * 1.3 + GAP + HS * 1.4 + nRows * ROW_H + PAD);
    const b = createGraphics(bw, bh);
    if (b.pixelDensity && typeof mainCanvasSS === 'function' && mainCanvasSS() > 1) b.pixelDensity(mainCanvasSS());
    b.clear();
    const dc = b.drawingContext;
    if (dc && dc.createRadialGradient) {
      dc.save();
      dc.translate(bw / 2, bh / 2); dc.scale(bw / 2, bh / 2);
      const gr = dc.createRadialGradient(0, 0, 0, 0, 0, 1);
      gr.addColorStop(0, 'rgba(8,14,12,0.72)'); gr.addColorStop(0.78, 'rgba(8,14,12,0.6)'); gr.addColorStop(1, 'rgba(8,14,12,0)');
      dc.fillStyle = gr; dc.fillRect(-1, -1, 2, 2);
      dc.restore();
    }
    const H0 = T.colHalo, C = T.colText;
    const say = (str, size, x, y, ah, col) => {
      if (font) b.textFont(font);
      b.textSize(size); b.textAlign(ah, CENTER); b.noStroke();
      b.fill(H0[0], H0[1], H0[2], H0[3]); b.text(str, x + 2, y + 3);
      b.fill(col[0], col[1], col[2]); b.text(str, x, y);
    };
    const cx = bw / 2;
    let y = PAD + TS * 0.55;
    say(K.title, TS, cx, y, CENTER, titleCol);
    y += TS * 0.6 + GAP + LS * 0.65;
    for (const l of lines) { say(l, LS, cx, y, CENTER, C); y += LS * 1.3; }
    y += GAP - LS * 0.3 + HS * 0.7;
    say(K.head, HS, cx, y, CENTER, titleCol);
    y += HS * 0.7 + ROW_H * 0.6;
    const gx = cx - gridW / 2;
    for (let i = 0; i < rows.length; i++) {
      const c = i % cols, r = (i / cols) | 0;
      const x0 = gx + c * (colW + gutter), ry = y + r * ROW_H;
      say(rows[i].name, RS, x0, ry, LEFT, C);
      say(String(rows[i].n), RS, x0 + colW, ry, RIGHT, T.colNum);
    }
    this._card = b; this._cardW = bw; this._cardH = bh;
  },

  _freeCard() {
    if (this._card && this._card.remove) this._card.remove();      // a createGraphics is a real canvas (CLAUDE.md)
    this._card = null;
  }
};
try { if (typeof window !== 'undefined') window.Milestone = Milestone; } catch (_) {}
