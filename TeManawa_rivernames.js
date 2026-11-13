// ============================================================
// TE MANAWA: RIVER NAMES — map lettering along the rivers
// ------------------------------------------------------------
// The Manawatū and its named tributaries are lettered ALONG their channels in white block
// capitals, each letter turned to the river's curve and centred on the water, the way an atlas
// letters its rivers. Drawn over the whole world (ground, water, the cast, the weather and the
// edge band) and under the HUD, clear of everything the HUD puts on screen (InstallHUD.labelKeepOut),
// so a name never runs into the goal, the timeline or the year.
//
// WHERE: each river's drawn line (terrain.getRivers(): meanders applied, a tributary cut where its
// water ends) is walked in world space, each step moved onto the middle of the nearest RIVER water
// (waterTypeAt === 2, within snapReach, so a fan of hill streams still counts), and kept where there
// is such water and the step lands on screen clear of the HUD. A name takes the straightest stretch of
// that which fits it, nearest the middle (and, once placed, nearest where it was), on a lightly
// smoothed baseline. A river with no such stretch goes unnamed, so the names follow the land: a reach
// the sea drowns or an arm that dries loses its name, and a river that comes into view gains one. A
// tributary is named only once its deep-time fan has closed into one channel (tribNameSpread).
// Larger rivers are placed first; a name never overlaps another.
//
// WHEN: laid out only when the water is re-stamped (WaterLayer.rev: init, each morph, an eruption),
// the view moves or the HUD's layout changes (labelSig), and then sliced over a few frames (budgetMs a
// frame, like the terrain's morphStep). When it lands a name glides to its new place (tweenMs), or
// crossfades if it moved far or flipped (fadeMs, ≥ 500 ms: photosensitivity). Per frame it is
// drawImage calls from a glyph cache (a halo and a fill sprite per letter and size): no text(), no
// allocation.
// ============================================================

// Console-tunable like TM_EDGE / LOOK. Sizes and margins are 1080-space px.
const TM_RIVER_NAMES = {
  enabled:   true,
  mainName:  'Manawatū',   // the geo skeleton names only the tributaries
  // Shown instead of an authored name. The eastern tributary is the Manawatū's own upper course, so it
  // carries the river's name, as an atlas repeats a long river's name along it (and a 14-letter name
  // rarely fits its meanders). Delete the entry to letter it 'UPPER MANAWATŪ'.
  rename:    { 'upper Manawatū': 'Manawatū' },
  // A tributary is lettered only once its fan of hill streams has drawn into one channel: the land's
  // fan spread (terrain._geoT.tribSpread, 1 at 1 Ma → 0 at 300 ka, GEO_EPOCHS.tribConverge*) at or
  // below this. 0.05 ≈ 395 ka. Before that the streams are a proto-drainage on low proto-ranges and a
  // still-emerging plain, and no source names its rivers for the time; the Ōroua's course is steered
  // by mid–late Pleistocene folds (TEMANAWA_NATURAL_HISTORY.md §I.3–I.4). The main stem keeps its
  // name from the opening (Trewick & Bland Fig. 4D). 1 names every tributary throughout.
  tribNameSpread: 0.05,
  mainSize:  26,           // the main stem's lettering
  tribSize:  19,           // the tributaries'
  minScale:  0.8,          // a name that fits nowhere at full size tries once more at this scale
  tracking:  0.16,         // letter spacing, em (open atlas capitals)
  capH:      0.645,        // the font's cap height, em (Nadira OS/2 645/1000): centres the capitals on the channel
  fill:      [255, 255, 255],
  halo:      [8, 14, 12],  // the dark halo that keeps white legible on sand, snow and open sea
  haloAlpha: 0.72,
  haloWidth: 0.22,         // halo stroke, em
  haloBlur:  0.2,          // halo softness, em
  marginX:   28,           // kept clear of the canvas sides
  marginY:   10,           // kept clear of the HUD's pieces, above and below
  snapReach: 6,            // world px either side of the line searched for its water (a fan's streams, a ragged bank)
  snapJump:  3.5,          // world px: a step whose water centre moves sideways further has jumped streams (a fan's are ~20 apart): split. Less is a widening bank; the smoothing takes it
  gapHop:    10,           // world px of dry line bridged (an islet, a pinch); a longer dry stretch splits the run
  smooth:    2.5,          // baseline smoothing window, × the font size (shorter, and a gorge's uneven bed reads as bends)
  maxTurn:   1.0,          // rad of total bend allowed under a name
  minRadius: 1.4,          // × the font size: a tighter bend crowds the inner letters
  stick:     0.5,          // pull toward the previous placement, so a name holds its place as its river moves
  holdGap:   2,            // HYSTERESIS: a name on screen bridges gaps this × longer …
  holdScale: 0.7,          // … and may shrink to this scale, before it is let go (fewer names blinking in and out)
  holdLayouts: 1,          // … and a name a re-layout cannot place stays where it was for this many more before it fades
  budgetMs:  2,            // per-frame slice for a live re-layout (a whole one is ~5–10 ms)
  tweenMs:   700,          // glide to the new place after a re-layout
  fadeMs:    700           // crossfade in / out
};
window.TM_RIVER_NAMES = TM_RIVER_NAMES;

// Where across a channel's wet span (0 one bank … 1 the other) a step is tried for a painted spot:
// the middle first, then outward (RiverNames._runs).
const SPAN_TRY = [0.5, 0.35, 0.65, 0.2, 0.8, 0.05, 0.95];

const RiverNames = {
  _live: [],             // label instances being drawn (incl. ones fading out)
  _job: null,            // a re-layout in progress (_layoutBegin / _layoutStep)
  _glyphs: new Map(),    // 'size|char' → { halo, fill, w, h, ox, oy, adv } (a space has no sprites)
  _seen: { rev: -1, terrain: null, W: 0, H: 0, vx: 0, vy: 0, vz: 0, sig: -1 },
  layouts: 0,            // re-layouts landed so far (the harness checks they stay off the per-frame path)

  // Where the HUD stands (InstallHUD.labelKeepOut): { top, bottom, rects }. Names keep marginX/marginY
  // clear of the canvas sides and of all of it.
  keepOut(W, H) {
    return (typeof InstallHUD !== 'undefined' && InstallHUD.labelKeepOut) ? InstallHUD.labelKeepOut(W, H)
                                                                          : { top: 0, bottom: H, rects: [] };
  },

  // Per frame, from GameUI.renderFullscreenOverlay (main canvas, 1080-space).
  render(g, W, H) {
    const C = TM_RIVER_NAMES;
    if (!C.enabled) { this._live.length = 0; this._job = null; this._seen.rev = -1; return; }
    const T = g && g.terrain, wl = g && g.water;
    if (!T || !wl || typeof CONFIG === 'undefined' || typeof Projection === 'undefined') return;
    const sig = (typeof InstallHUD !== 'undefined' && InstallHUD.labelSig) ? InstallHUD.labelSig() : 0, s = this._seen;
    if (s.rev !== wl.rev || s.terrain !== T || s.W !== W || s.H !== H || s.vx !== CONFIG.viewX || s.vy !== CONFIG.viewY ||
        s.vz !== CONFIG.viewZoom || s.sig !== sig) {
      s.rev = wl.rev; s.terrain = T; s.W = W; s.H = H; s.vx = CONFIG.viewX; s.vy = CONFIG.viewY; s.vz = CONFIG.viewZoom; s.sig = sig;
      this._job = this._layoutBegin(T, W, H, this.keepOut(W, H), this._liveMap());   // a newer change restarts the job
    }
    if (this._job && this._layoutStep(this._job, C.budgetMs)) { this._apply(this._job.out); this._job = null; }
    this._draw(drawingContext, millis());
  },

  // Drop every live name and any layout in progress, so the next render lays out fresh with no
  // hysteresis (holdLayouts) carrying a name over. For a hard scene change under a cover — the attract
  // sequence's dips (TeManawa_palaeo.js) — never on the visitor's open screen, where a name should glide.
  clear() {
    this._live.length = 0;
    this._job = null;
    this._seen.rev = -1;
  },

  // A still frame (tools/export_frames.js): a layout of `T` as it stands, drawn at full strength into
  // graphics `buf`, with no glide or fade. `prev` (key → label, e.g. the frame before's layout()) stands
  // in for the live memory; null lays it out fresh. Returns the names drawn.
  drawStill(buf, T, W, H, prev) {
    const labels = this.layout(T, W, H, this.keepOut(W, H), prev || null);
    const dc = buf && buf.drawingContext;
    if (dc && dc.drawImage) for (let pass = 0; pass < 2; pass++)
      for (const L of labels) this._drawLabel(dc, L.gs, L.n, L.x, L.y, L.a, L.x, L.y, L.a, 1, pass);
    return labels.map(L => L.text);
  },

  // ---- layout (pure but for the glyph cache; allocates, so only on a re-layout) -------------------
  // → [{ key, text, size, rev, n, gs, x, y, a, len, cx, cy }]: per letter its glyph and screen centre
  // and angle. `ko` is keepOut(); `prev` (key → the live label) steers each name toward where it was.
  // The live path runs the same work as a job, a river or two a frame (_layoutStep, budgetMs).
  layout(T, W, H, ko, prev) {
    const job = this._layoutBegin(T, W, H, ko, prev);
    this._layoutStep(job, Infinity);
    return job.out;
  },

  _layoutBegin(T, W, H, ko, prev) {
    const rivers = (T && T.getRivers) ? T.getRivers() : [], order = [];
    for (let i = 0; i < rivers.length; i++) if (this._name(rivers[i], T)) order.push(i);
    this._prewarm(rivers, T);
    order.sort((a, b) => this._rank(rivers[b]) - this._rank(rivers[a]));   // the main, then the larger tributaries
    return { T, W, ko, prev, rivers, order, k: 0, placed: [], out: [] };
  },

  // Name rivers until all are done (→ true) or budgetMs has passed (→ false; call again next frame).
  _layoutStep(job, budgetMs) {
    const t0 = performance.now();
    while (job.k < job.order.length) {
      this._layoutRiver(job, job.order[job.k++]);
      if (performance.now() - t0 >= budgetMs) break;
    }
    return job.k >= job.order.length;
  },

  _layoutRiver(job, i) {
    const C = TM_RIVER_NAMES, rv = job.rivers[i], nm = this._name(rv, job.T);
    if (!nm) return;   // the name set can change between a job's slices (the attract sequence starting or landing): an unnamed river is skipped, never a crash
    const text = nm.normalize('NFC').toUpperCase(), chars = Array.from(text);
    const key = i + '|' + text, pl = job.prev ? job.prev.get(key) : null;
    const size0 = (rv.type !== 'tributary') ? C.mainSize : C.tribSize;
    const runs = this._runs(job.T, rv, job.W, job.ko, size0, !!pl);
    if (!runs.length) return;
    let maxRun = 0; for (const r of runs) if (r.len > maxRun) maxRun = r.len;
    for (const sc of (pl ? [1, C.minScale, C.holdScale] : [1, C.minScale])) {   // a name on screen may shrink once more to stay
      const size = Math.round(size0 * sc), tr = C.tracking * size;
      const gs = chars.map(ch => this._glyph(ch, size));
      let L = tr * (chars.length - 1); for (const gl of gs) L += gl.adv;
      let best = null;
      for (const run of runs) {
        const c = this._bestWindow(run, L, size, job.placed, pl, maxRun);
        if (c && (!best || c.score < best.score)) { best = c; best.run = run; }
      }
      if (!best) continue;
      job.out.push(this._letter(key, text, gs, tr, L, size, best, pl, job.placed));
      return;
    }
  },

  // `T` (optional) is the land the name is for: a tributary on a land whose fan is still spread goes
  // unnamed (tribNameSpread). Without a land, or one with no geo time, the present's names.
  _name(rv, T) {
    // THE LAND BEFORE THE WINDOW: while the attract sequence runs the names are the time's (no
    // tributary names; the main 'proto-Manawatū' while its arm still flows east). TeManawa_palaeo.js.
    if (typeof Palaeo !== 'undefined' && Palaeo.active && Palaeo.riverName) return Palaeo.riverName(rv);
    // THE PROLOGUE (2 Ma → 1 Ma, in play): the same names of the time, read off the date the land was
    // baked for (T._geoT.age), so the present-day map's snapshot, a land at 0 BP, keeps today's names.
    if (typeof Palaeo !== 'undefined' && Palaeo.riverNameAt && typeof DeepTime !== 'undefined' &&
        T && T._geoT && T._geoT.age > DeepTime.prologueEnd) return Palaeo.riverNameAt(rv, T._geoT.age);
    const C = TM_RIVER_NAMES;
    if (rv && rv.type === 'tributary' && T && T._geoT && T._geoT.tribSpread > C.tribNameSpread) return null;
    const n = (rv && rv.src && rv.src.name) || (rv && rv.name);
    if (n) return (C.rename && C.rename[n]) || n;
    return (rv && rv.type !== 'tributary') ? C.mainName : null;
  },
  _rank(rv) { return (rv.type !== 'tributary' ? 1e3 : 0) + (rv.width || 0) * 1e3 + ((rv.src && rv.src.arcLen) || 0); },

  // The river's wet, HUD-clear stretches in SCREEN space, each resampled, smoothed and measured:
  // [{ X, Y, S (arc px), A (tangent), turnP (prefix of |bend|), n, len }]. Each step of the line is
  // moved sideways onto the middle of the nearest river water (_snap), so a name sits IN the channel
  // as painted, even where the line runs between a fan's streams or off a ragged bank; a step whose
  // water jumps to another stream ends the stretch. `hold` (the name is on screen now) bridges longer
  // gaps (holdGap), so a name already shown is harder to lose than a new one is to gain.
  _runs(T, rv, W, ko, size, hold) {
    const C = TM_RIVER_NAMES, P = rv.pts, runs = [], gap = C.gapHop * (hold ? C.holdGap : 1);
    if (!P || P.length < 2 || !T.waterTypeAt) return runs;
    const mw = T.mapWidth, mh = T.mapHeight, vx = CONFIG.viewX, vy = CONFIG.viewY, vz = CONFIG.viewZoom;
    const mx = C.marginX + size * 0.5, my = C.marginY + size * 0.7, R = ko.rects;   // a letter's reach past its centre, plus the margin
    const x0 = mx, x1 = W - mx, y0 = ko.top + my, y1 = ko.bottom - my;
    const clear = (sx, sy) => {
      if (sx < x0 || sx > x1 || sy < y0 || sy > y1) return false;
      for (let i = 0; i < R.length; i++) { const r = R[i]; if (sx > r[0] - mx && sx < r[2] + mx && sy > r[1] - my && sy < r[3] + my) return false; }
      return true;
    };
    let cur = null, pend = null, dry = 0, lastC = 0;
    const close = () => { if (cur && cur.length >= 4) runs.push(cur); cur = null; pend = null; dry = 0; };
    for (let s = 0; s + 1 < P.length; s++) {
      const ax = P[s][0] * mw, ay = P[s][1] * mh, dx = P[s + 1][0] * mw - ax, dy = P[s + 1][1] * mh - ay;
      const len = Math.hypot(dx, dy);
      if (len < 1e-6) continue;                          // the folded tail past a tributary's end
      const nx = -dy / len, ny = dx / len, steps = Math.max(1, Math.ceil(len)), sl = len / steps;   // ~1 world px a step
      for (let k = 0; k < steps; k++) {
        const lx = ax + dx * k / steps, ly = ay + dy * k / steps;
        const c = this._snap(T, lx, ly, nx, ny), wet = c === c;
        // On screen where the bake paints it; NaN where nearer ground hides it in the 3/4 view. An
        // incised channel's near bank can hide its middle and leave the far side showing, so the
        // span is tried from the middle outward and the name centres on what shows. A step with no
        // water showing (dry, or all hidden) is bridged like a pinch, at where it would paint.
        let o = wet ? c : lastC, py = NaN, raw = NaN;
        for (let f = 0; f < SPAN_TRY.length && py !== py; f++) {
          if (f > 0 && !wet) break;
          const of = wet ? this._spanA + (this._spanB - this._spanA) * SPAN_TRY[f] : o;
          py = this._paintY(T, lx + nx * of, ly + ny * of);
          if (f === 0) raw = (py === py) ? py : this._rawY;
          if (py === py) o = of;
        }
        const shown = wet && py === py, x = lx + nx * o, sx = vx + vz * Projection.projX(x), sy = vy + vz * (py === py ? py : raw);
        if (sy !== sy || !clear(sx, sy)) { close(); continue; }
        if (shown) {
          if (cur && Math.abs(c - lastC) > C.snapJump) close();   // the water jumped to another stream
          lastC = c;
          if (!cur) cur = [];
          if (pend) { for (const q of pend) cur.push(q); pend = null; }
          dry = 0;
          cur.push(sx, sy);
        } else if (cur) {
          dry += sl;
          if (dry > gap) close();
          else (pend || (pend = [])).push(sx, sy);
        }
      }
    }
    close();
    return runs.map(F => this._smoothRun(F, size));
  },

  // Where the relief bake paints world point (x, y), as a y in world units before the view transform,
  // or NaN where the bake hides it. Mirrors TerrainGenerator._bakeSeasonColumns: the paint cell's lift
  // (TerrainGenerator.bakeLift, as terrain.paintLiftAt: sea flat, low ground eased flat toward the coast,
  // which groundY() of the raw elevation leaves out), and the ceiling test, which hides a cell when a nearer one in its
  // column paints at or above it (a river in a valley behind a ridge): here, when less than half a
  // row of it would show. Only rows near enough to rise above it are read (≤ LIFT·S/K).
  _paintY(T, x, y) {
    const E = T._paintElev, Wt = T._paintWater, S = T._paintScale, PW = T._paintW, PH = T._paintH;
    if (!E || !Wt || !(S > 0)) return Projection.groundY(y, T.getElevationAt(x, y));
    const K = Projection.K, LIFT = Projection.LIFT;
    let pc = Math.round(x * S), pr = Math.round(y * S);
    if (pc < 0) pc = 0; else if (pc >= PW) pc = PW - 1;
    if (pr < 0) pr = 0; else if (pr >= PH) pr = PH - 1;
    const i0 = pr * PW + pc, le0 = TerrainGenerator.bakeLift(E[i0], Wt[i0]), y0 = pr / S * K - le0 * LIFT + LIFT, seen = y0 + 0.5 * K / S;
    // A nearer row r can paint above `seen` only while (r − pr)·K/S < (1 − le0)·LIFT: past that even a
    // summit stays below. Row by row for the first world px, then a world px at a time (a ridge is wider).
    const reach = Math.min(PH - 1, pr + Math.ceil((1 - le0) * LIFT * S / K));
    this._rawY = y0;                                   // where it would paint, for bridging a short hidden stretch
    for (let r = pr + 1; r <= reach; r += (r - pr < S ? 1 : S)) {
      const i = r * PW + pc;
      if (r / S * K - TerrainGenerator.bakeLift(E[i], Wt[i]) * LIFT + LIFT < seen) return NaN;
    }
    return y0;
  },

  // The middle of the river water (waterTypeAt === 2) nearest the line at (x, y), as an offset along
  // the normal (nx, ny) within ±snapReach world px; NaN if there is none. The nearest wet span wins
  // (one the line crosses is at 0), so a channel's middle, or the nearest of a fan's streams. The
  // span's ends are left in _spanA/_spanB.
  _spanA: 0, _spanB: 0,
  _snap(T, x, y, nx, ny) {
    const R = TM_RIVER_NAMES.snapReach, st = 0.5;
    let best = NaN, bestD = Infinity, a = NaN;
    for (let o = -R; o <= R + 1e-6; o += st) {
      const w = T.waterTypeAt(x + nx * o, y + ny * o) === 2;
      if (w && a !== a) a = o;                             // a wet span opens
      if (a === a && (!w || o + st > R + 1e-6)) {          // … and closes (or meets the reach)
        const b = w ? o : o - st, d = (a <= 0 && b >= 0) ? 0 : Math.min(Math.abs(a), Math.abs(b));
        if (d < bestD) { bestD = d; best = (a + b) / 2; this._spanA = a; this._spanB = b; }
        a = NaN;
      }
    }
    return best;
  },

  // Resample a flat [x,y,…] screen line every 2 px, smooth it (two centred moving averages, the window
  // shrinking at the ends so they stay put), and measure arc, tangent and accumulated bend.
  _smoothRun(F, size) {
    const step = 2, X = [F[0]], Y = [F[1]];
    let acc = 0;
    for (let i = 2; i + 1 < F.length; i += 2) {
      let px = F[i - 2], py = F[i - 1];
      const qx = F[i], qy = F[i + 1];
      let d = Math.hypot(qx - px, qy - py);
      while (d > 0 && acc + d >= step) {
        const t = (step - acc) / d;
        px += (qx - px) * t; py += (qy - py) * t;
        X.push(px); Y.push(py);
        d = Math.hypot(qx - px, qy - py); acc = 0;
      }
      acc += d;
    }
    const n = X.length, h = Math.max(1, Math.round(TM_RIVER_NAMES.smooth * size / step / 2));
    let ax = Float32Array.from(X), ay = Float32Array.from(Y);
    for (let pass = 0; pass < 2; pass++) {
      const px = new Float64Array(n + 1), py = new Float64Array(n + 1), bx = new Float32Array(n), by = new Float32Array(n);
      for (let i = 0; i < n; i++) { px[i + 1] = px[i] + ax[i]; py[i + 1] = py[i] + ay[i]; }
      for (let i = 0; i < n; i++) {
        const w = Math.min(h, i, n - 1 - i);
        bx[i] = (px[i + w + 1] - px[i - w]) / (2 * w + 1); by[i] = (py[i + w + 1] - py[i - w]) / (2 * w + 1);
      }
      ax = bx; ay = by;
    }
    const S = new Float32Array(n), A = new Float32Array(n), turnP = new Float32Array(n);
    for (let i = 1; i < n; i++) S[i] = S[i - 1] + Math.hypot(ax[i] - ax[i - 1], ay[i] - ay[i - 1]);
    for (let i = 0; i < n; i++) {
      const a = i > 0 ? i - 1 : i, b = i + 1 < n ? i + 1 : i;
      A[i] = Math.atan2(ay[b] - ay[a], ax[b] - ax[a]);
      if (i > 0) turnP[i] = turnP[i - 1] + Math.abs(RiverNames._wrap(A[i] - A[i - 1]));
    }
    return { X: ax, Y: ay, S, A, turnP, n, len: n > 1 ? S[n - 1] : 0 };
  },

  // The best stretch of `run` for a name `L` px long: not too bent overall or anywhere, clear of the
  // names already placed; scored by bend, distance from the run's middle, steepness, the run's share
  // of the river, and (with `pl`) distance from where the name was. → { i0, i1, score, cx, cy } | null.
  _bestWindow(run, L, size, placed, pl, maxRun) {
    const C = TM_RIVER_NAMES, X = run.X, Y = run.Y, S = run.S, A = run.A, n = run.n;
    if (run.len < L) return null;
    const hk = Math.max(1, Math.round(size * 0.25)), kMax = 1 / (C.minRadius * size);   // local bend over ±size/2
    const kap = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const a = Math.max(0, i - hk), b = Math.min(n - 1, i + hk);
      kap[i] = (b > a) ? Math.abs(this._wrap(A[b] - A[a])) / ((S[b] - S[a]) || 1) : 0;
    }
    const stride = Math.max(1, Math.round(size / 8)), probe = Math.max(1, Math.round(size / 4)), mid = run.len / 2;
    let best = null, i1 = 0;
    for (let i0 = 0; i0 < n; i0 += stride) {
      while (i1 < n && S[i1] - S[i0] < L) i1++;
      if (i1 >= n) break;
      const turn = run.turnP[i1] - run.turnP[i0];
      if (turn > C.maxTurn) continue;
      let ok = true;
      for (let i = i0; i <= i1 && ok; i++) if (kap[i] > kMax) ok = false;
      for (let i = i0; ok; i = (i < i1 && i + probe > i1) ? i1 : i + probe) {   // every probe-th sample, and the end
        for (const p of placed) { const dx = X[i] - p.x, dy = Y[i] - p.y, rr = p.r + size * 0.6; if (dx * dx + dy * dy < rr * rr) { ok = false; break; } }
        if (i >= i1) break;
      }
      if (!ok) continue;
      const ic = (i0 + i1) >> 1, cx = X[ic], cy = Y[ic];
      let score = turn / C.maxTurn
                + 0.6 * Math.abs((S[i0] + S[i1]) / 2 - mid) / Math.max(L, mid)
                + 0.3 * Math.abs(Math.sin(Math.atan2(Y[i1] - Y[i0], X[i1] - X[i0])))
                + 0.3 * (1 - run.len / maxRun);
      if (pl) score += C.stick * Math.min(2, Math.hypot(cx - pl.cx, cy - pl.cy) / L);
      if (!best || score < best.score) best = { i0, i1, score, cx, cy };
    }
    return best;
  },

  // Set the letters of the chosen stretch: centred in it, each at its arc position and turned to the
  // curve, reading left to right (or bottom to top on a near-vertical reach; a near-vertical name keeps
  // the side it read from before). Records the letters in `placed`.
  _letter(key, text, gs, tr, L, size, best, pl, placed) {
    const run = best.run, X = run.X, Y = run.Y, S = run.S, i0 = best.i0, i1 = best.i1, m = gs.length;
    const dx = X[i1] - X[i0], dy = Y[i1] - Y[i0], ch = Math.hypot(dx, dy) || 1;
    let rev = dx < 0 || (Math.abs(dx) < 0.17 * ch && dy > 0);
    if (pl && Math.abs(dx) < 0.35 * ch) rev = pl.rev;
    const s0 = S[i0] + (S[i1] - S[i0] - L) / 2;
    const x = new Float32Array(m), y = new Float32Array(m), a = new Float32Array(m), p = [0, 0], q = [0, 0];
    let cum = 0;
    for (let j = 0; j < m; j++) {
      const adv = gs[j].adv, sc = rev ? s0 + L - (cum + adv / 2) : s0 + cum + adv / 2, hw = Math.max(2, adv / 2);
      cum += adv + tr;
      this._at(run, sc, p); x[j] = p[0]; y[j] = p[1];
      this._at(run, sc - hw, p); this._at(run, sc + hw, q);
      a[j] = this._wrap(Math.atan2(q[1] - p[1], q[0] - p[0]) + (rev ? Math.PI : 0));
      placed.push({ x: x[j], y: y[j], r: Math.max(adv, size * 0.7) / 2 });
    }
    return { key, text, size, rev, n: m, gs, x, y, a, len: L, cx: best.cx, cy: best.cy };
  },

  // The point at arc `s` along a run (clamped), into `out`.
  _at(run, s, out) {
    const S = run.S, n = run.n;
    if (s <= 0 || n < 2) { out[0] = run.X[0]; out[1] = run.Y[0]; return out; }
    if (s >= S[n - 1]) { out[0] = run.X[n - 1]; out[1] = run.Y[n - 1]; return out; }
    let lo = 0, hi = n - 1;
    while (hi - lo > 1) { const md = (lo + hi) >> 1; if (S[md] <= s) lo = md; else hi = md; }
    const t = (s - S[lo]) / ((S[hi] - S[lo]) || 1);
    out[0] = run.X[lo] + (run.X[hi] - run.X[lo]) * t; out[1] = run.Y[lo] + (run.Y[hi] - run.Y[lo]) * t;
    return out;
  },

  _wrap(a) { while (a > Math.PI) a -= 2 * Math.PI; while (a <= -Math.PI) a += 2 * Math.PI; return a; },

  // ---- glyphs ------------------------------------------------------------------------------------
  // Every letter of every name at each size, made on the first layout (at boot, behind init), so a
  // live re-layout never pays for a new sprite (~1 ms each). Again only if the set of names changes.
  _prewarm(rivers, T) {
    const C = TM_RIVER_NAMES, names = rivers.map(rv => this._name(rv, T)).filter(Boolean).join('|');
    const key = names + '|' + C.mainSize + '|' + C.tribSize + '|' + C.minScale + '|' + C.holdScale;
    if (this._warmKey === key) return;
    this._warmKey = key;
    for (const rv of rivers) {
      const nm = this._name(rv, T);
      if (!nm) continue;
      const size0 = (rv.type !== 'tributary') ? C.mainSize : C.tribSize;
      for (const sc of [1, C.minScale, C.holdScale]) for (const ch of nm.normalize('NFC').toUpperCase()) this._glyph(ch, Math.round(size0 * sc));
    }
  },

  // A letter's halo and fill sprites, made once per size and kept (a bounded set: the letters of a
  // dozen names at two or four sizes). Drawn at the main canvas's supersample so they stay crisp on
  // the 2D path. The capitals' middle sits on the sprite's centre, so a letter centres on the water.
  _glyph(ch, size) {
    const key = size + '|' + ch;
    let gl = this._glyphs.get(key);
    if (gl) return gl;
    const C = TM_RIVER_NAMES, font = (typeof FreckleFace !== 'undefined') ? FreckleFace : null;
    push(); if (font) textFont(font); textSize(size); const adv = textWidth(ch); pop();
    if (ch.trim() === '') { gl = { halo: null, fill: null, w: 0, h: 0, ox: 0, oy: 0, adv }; this._glyphs.set(key, gl); return gl; }
    const pad = Math.ceil(size * (C.haloWidth / 2 + C.haloBlur) + 2);
    const w = Math.ceil(adv + 2 * pad), h = Math.ceil(size * 1.3 + 2 * pad), base = h / 2 + C.capH * size / 2;
    const ss = (typeof mainCanvasSS === 'function') ? mainCanvasSS() : 1;
    const mk = (halo) => {
      const b = createGraphics(w, h);
      if (b.pixelDensity) b.pixelDensity(ss);
      b.clear();
      if (font) b.textFont(font);
      b.textSize(size); b.textAlign(LEFT, BASELINE);
      if (halo) {
        const c = C.halo, dc = b.drawingContext;
        b.noFill(); b.stroke(c[0], c[1], c[2], 255 * C.haloAlpha); b.strokeWeight(size * C.haloWidth); b.strokeJoin(ROUND);
        if (dc) { dc.shadowColor = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + C.haloAlpha + ')'; dc.shadowBlur = size * C.haloBlur * ss; }
        b.text(ch, pad, base);
        if (dc) dc.shadowBlur = 0;
      } else {
        b.noStroke(); b.fill(C.fill[0], C.fill[1], C.fill[2]); b.text(ch, pad, base);
      }
      return b.elt || b.canvas;
    };
    gl = { halo: mk(true), fill: mk(false), w, h, ox: pad + adv / 2, oy: h / 2, adv };
    this._glyphs.set(key, gl);
    return gl;
  },

  // ---- live labels: glide, fade, draw --------------------------------------------------------------
  _liveMap() {
    const m = new Map();
    for (const L of this._live) if (!L.out) m.set(L.key, L);
    return m;
  },

  // Take a finished layout: a name still there glides to its new letters (or crossfades, if it moved
  // far or flipped), a new one fades in, a lost one stays put for holdLayouts more layouts, then fades.
  _apply(labels) {
    const now = millis(), prev = this._liveMap(), next = [];
    for (const L of this._live) if (L.out && this._alpha(L, now) > 0.004) next.push(L);   // still fading out
    for (const lb of labels) {
      const old = prev.get(lb.key);
      if (old) prev.delete(lb.key);
      if (old && old.text === lb.text && old.size === lb.size && old.rev === lb.rev &&
          Math.hypot(old.cx - lb.cx, old.cy - lb.cy) < 0.6 * lb.len) {
        this._glide(old, lb, now);
        old.miss = 0;
        next.push(old);
      } else {
        if (old) { this._fadeOut(old, now); next.push(old); }
        next.push(this._instance(lb, now));
      }
    }
    for (const old of prev.values()) {
      if ((old.miss || 0) < TM_RIVER_NAMES.holdLayouts && !this._overlaps(old, labels)) old.miss = (old.miss || 0) + 1;   // a one-layout gap does not blink
      else this._fadeOut(old, now);
      next.push(old);
    }
    this._live = next;
    this.layouts++;
  },

  // Would held label L (at its glide target) touch any of `labels`' letters?
  _overlaps(L, labels) {
    for (const lb of labels) for (let j = 0; j < L.n; j++) for (let k = 0; k < lb.n; k++) {
      const r = 0.6 * (L.size + lb.size);
      if (Math.abs(L.tx[j] - lb.x[k]) < r && Math.abs(L.ty[j] - lb.y[k]) < r) return true;
    }
    return false;
  },

  _instance(lb, now) {
    return { key: lb.key, text: lb.text, size: lb.size, rev: lb.rev, n: lb.n, gs: lb.gs, len: lb.len, cx: lb.cx, cy: lb.cy,
             fx: Float32Array.from(lb.x), fy: Float32Array.from(lb.y), fa: Float32Array.from(lb.a),
             tx: lb.x, ty: lb.y, ta: lb.a, t0: now - TM_RIVER_NAMES.tweenMs, inAt: now, out: false, outAt: 0, a0: 1, miss: 0 };
  },

  // Start a glide from wherever the label is drawn now to its new letters.
  _glide(L, lb, now) {
    const k = this._tweenK(L, now);
    for (let j = 0; j < L.n; j++) {
      L.fx[j] += (L.tx[j] - L.fx[j]) * k; L.fy[j] += (L.ty[j] - L.fy[j]) * k;
      L.fa[j] = this._wrap(L.fa[j] + this._wrap(L.ta[j] - L.fa[j]) * k);
    }
    L.tx = lb.x; L.ty = lb.y; L.ta = lb.a; L.t0 = now; L.cx = lb.cx; L.cy = lb.cy;
  },

  _fadeOut(L, now) { L.a0 = this._alpha(L, now); L.out = true; L.outAt = now; },

  _alpha(L, now) {
    const f = TM_RIVER_NAMES.fadeMs;
    if (L.out) return L.a0 * Math.max(0, 1 - (now - L.outAt) / f);
    return Math.min(1, Math.max(0, (now - L.inAt) / f));
  },

  _tweenK(L, now) {
    let k = (now - L.t0) / TM_RIVER_NAMES.tweenMs;
    k = k < 0 ? 0 : k > 1 ? 1 : k;
    return k * k * (3 - 2 * k);
  },

  // Every live label: all the halos, then all the fills, so a halo never darkens a neighbour's letter.
  _draw(dc, now) {
    if (!dc || !dc.drawImage || !this._live.length) return;
    const ga0 = dc.globalAlpha, Lv = this._live;
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < Lv.length; i++) {
        const L = Lv[i], al = this._alpha(L, now);
        if (al <= 0.004) continue;
        dc.globalAlpha = ga0 * al;
        this._drawLabel(dc, L.gs, L.n, L.fx, L.fy, L.fa, L.tx, L.ty, L.ta, this._tweenK(L, now), pass);
      }
    }
    dc.globalAlpha = ga0;
  },

  _drawLabel(dc, gs, n, fx, fy, fa, tx, ty, ta, k, pass) {
    for (let j = 0; j < n; j++) {
      const gl = gs[j], img = pass === 0 ? gl.halo : gl.fill;
      if (!img) continue;                                  // a space
      dc.save();
      dc.translate(fx[j] + (tx[j] - fx[j]) * k, fy[j] + (ty[j] - fy[j]) * k);
      dc.rotate(fa[j] + this._wrap(ta[j] - fa[j]) * k);
      dc.drawImage(img, -gl.ox, -gl.oy, gl.w, gl.h);
      dc.restore();
    }
  }
};
window.RiverNames = RiverNames;
