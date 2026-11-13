// ============================================================
// TE MANAWA: THE ISLAND INSET — what the frame cannot show (2026-11-13)
// ------------------------------------------------------------
// The sim's frame is ~80 km of the Manawatū. Three things that change what it means happen beyond it
// (research/palaeogeography/, the "suggested changes" there): at 1 Ma there is no Cook Strait and the
// lower North Island is one land with Wellington and Marlborough; the strait first breaks through about
// 450,000 years ago, inside the window; and at the window's end, the last glacial maximum, the sea is
// ~120 m lower and dry land runs from the Manawatū to Nelson. This module draws the lower North Island
// at a date as a small printed-map INSET in the top-right corner, with the sim's frame boxed on it and
// one caption, crossfading from one date to the next:
//   · the intro (TeManawa_attract.js): today beside the present-day map, then 1 Ma as the map crosses
//     into the live 1 Ma land; gone with the line, before the UI;
//   · the outro: 20 ka (where the visitor has just been), then today;
//   · the dev attract sequence (TeManawa_palaeo.js, the P key): the date's map, 4 Ma → 1 Ma.
// The outlines are geo/island_maps.js (tools/island2geo.js from research/palaeogeography/slices.json:
// Trewick & Bland's maps registered to today's coast, plus today's and the LGM coast). Each date's map
// is drawn once into a buffer (keyed to the view and the canvas density, freed when either changes);
// captions are rasterised once. Every fade rides globalAlpha (never a per-frame tint) and is ≥ 500 ms.
// ============================================================

const TM_ISLAND = {
  enabled:    true,
  size:       330,        // px (1080 space): the inset's square
  margin:     34,         // from the top and right edges
  border:     7,          // the paper margin round the map
  captionGap: 10,         // the caption's top under the inset
  captionW:   370,        // the caption's text width (kept narrow: the intro's line is centred below it)
  titleSize:  30,
  bodySize:   22,
  townSize:   17,
  // The research maps' classes, toned to sit beside the present-day map (TM_ATTRACT.mapFilter)
  colors: {
    deep:  [29, 70, 96],     shelf: [62, 120, 146],
    low:   [214, 205, 160],  land:  [143, 170, 118],  high: [122, 150, 103],   // high ground a deeper green (the research maps' sketched ranges)
    paper: [242, 238, 224],  ink:   [30, 42, 36],     box:  [255, 251, 238],
    title: [255, 226, 168],  text:  [236, 244, 240],  halo: [8, 14, 12, 170]
  },
  // The dev attract sequence's dates (TeManawa_palaeo.js), oldest first, and how much of each leg the
  // crossfade takes (centred on the leg, so each map holds on its own date)
  palaeoDates: [['m4000', 4000000], ['m3000', 3000000], ['m2400', 2400000], ['m1500', 1500000], ['m1000', 1000000]],
  palaeoCross: 0.2,
  // The captions, by where the inset is shown and the date (Trewick & Bland 2012 pp. 160–173; Lewis &
  // Carter 1994 for the first breach of Cook Strait; the research page's notes)
  copy: {
    intro: {
      m0000: { title: 'The lower North Island today', body: 'The box marks the land on this wall.' },
      m1000: { title: 'The island, a million years ago', body: 'No Cook Strait yet: the North and South Islands are one land. The strait first breaks through about 450,000 years ago.' }
    },
    outro: {
      m0020: { title: '20,000 years ago', body: 'The sea stood about 120 m lower. Dry land ran from the Manawatū across to Nelson.' },
      m0000: { title: 'Today', body: 'The sea rose again. Cook Strait reopened about 15,000 years ago.' }
    },
    palaeo: {
      m4000: { body: 'Wellington belongs to a southern land, joined to Marlborough.' },
      m3000: { body: 'A narrow seaway, the Manawatū Strait, cuts the land in two.' },
      m2400: { body: 'The strait at its widest: a northern land and a southern one.' },
      m1500: { body: 'The strait has closed, and the east is filling with land.' },
      m1000: { body: 'One island, with Wellington and Marlborough. No Cook Strait.' }
    }
  }
};
try { if (typeof window !== 'undefined') window.TM_ISLAND = TM_ISLAND; } catch (_) {}

const IslandInset = {
  _maps: {}, _key: null,   // date id → its map buffer, for one view and density
  _caps: {},               // 'context|id' → its caption card
  _pair: { a: null, b: null, mix: 0 },   // palaeoPair's answer, reused (no per-frame allocation)
  lastBox: null,           // the frame box drawn last (view units), for the harness

  data() { return (typeof TE_MANAWA_ISLAND !== 'undefined') ? TE_MANAWA_ISLAND : null; },
  ok() { return !!(TM_ISLAND.enabled && this.data() && typeof createGraphics === 'function'); },
  _density() { return (typeof mainCanvasSS === 'function' && mainCanvasSS() > 1) ? mainCanvasSS() : 1; },

  // The view the sim's frame is drawn in, as a key: the box on the map follows it.
  _viewKey() {
    const C = (typeof CONFIG !== 'undefined') ? CONFIG : {}, g = (typeof game !== 'undefined') ? game : null, t = g && g.terrain;
    return TM_ISLAND.size + '|' + this._density() + '|' + C.canvasWidth + 'x' + C.canvasHeight + '|' + C.viewX + ',' + C.viewY + ',' + (+C.viewZoom).toFixed(4) + '|' + (t ? t.mapWidth + 'x' + t.mapHeight : '-');
  },

  // The part of the sim's map on screen (u, v 0..1), then where that sits on the inset (view units):
  // the gorge is the anchor, one map width is sim.ku of the view and one map height sim.kv.
  frameBox() {
    const D = this.data(), C = (typeof CONFIG !== 'undefined') ? CONFIG : null, g = (typeof game !== 'undefined') ? game : null, t = g && g.terrain;
    if (!D || !D.sim) return null;
    let u0 = 0.163, u1 = 0.837, v0 = 0.11, v1 = 0.78;          // the wall's cover-fit view, if the live one cannot be read
    if (C && t && C.viewZoom > 0 && t.mapWidth > 0) {
      const z = C.viewZoom, P = (typeof Projection !== 'undefined') ? Projection : null;
      const K = (P && P.K > 0) ? P.K : 1, LIFT = (P && P.relief) ? (P.LIFT || 0) : 0;
      u0 = -C.viewX / (z * t.mapWidth); u1 = (C.canvasWidth - C.viewX) / (z * t.mapWidth);
      v0 = ((-C.viewY) / z - LIFT) / K / t.mapHeight; v1 = ((C.canvasHeight - C.viewY) / z - LIFT) / K / t.mapHeight;
      const cl = (x) => x < 0 ? 0 : x > 1 ? 1 : x;
      u0 = cl(u0); u1 = cl(u1); v0 = cl(v0); v1 = cl(v1);
    }
    const S = D.sim;
    return { x: S.gx + (u0 - S.gu) * S.ku, y: S.gy + (v0 - S.gv) * S.kv, w: (u1 - u0) * S.ku, h: (v1 - v0) * S.kv };
  },

  // Build the maps for these dates now (call under a cover: a few ms each).
  prepare(ids) {
    if (!this.ok()) return false;
    for (const id of ids) this.map(id);
    return true;
  },

  map(id) {
    if (!id || !this.ok()) return null;
    const key = this._viewKey();
    if (key !== this._key) { this._freeMaps(); this._freeCaps(); this._key = key; }   // a new view or density: nothing old is kept
    if (this._maps[id] !== undefined) return this._maps[id];
    return (this._maps[id] = this._build(id));
  },

  _build(id) {
    const D = this.data(), L = D && D.slices && D.slices[id];
    if (!L) return null;
    const T = TM_ISLAND, C = T.colors, S = T.size, B = T.border, M = S - 2 * B, k = M / D.q;
    const g = createGraphics(S, S);
    if (g.pixelDensity && this._density() > 1) g.pixelDensity(this._density());
    g.noStroke(); g.fill(C.paper[0], C.paper[1], C.paper[2]); g.rect(0, 0, S, S);
    g.fill(C.deep[0], C.deep[1], C.deep[2]); g.rect(B, B, M, M);
    const dc = g.drawingContext;
    if (dc && typeof dc.moveTo === 'function' && typeof dc.lineTo === 'function' && typeof dc.fill === 'function') {
      dc.save(); dc.beginPath(); dc.rect(B, B, M, M); dc.clip();
      const cols = [C.shelf, C.low, C.land, C.high];
      for (let li = 0; li < 4; li++) {
        const rings = L[li];
        if (!rings || !rings.length) continue;
        dc.beginPath();
        for (const r of rings) {
          dc.moveTo(B + r[0] * k, B + r[1] * k);
          for (let p = 2; p + 1 < r.length; p += 2) dc.lineTo(B + r[p] * k, B + r[p + 1] * k);
          dc.closePath();
        }
        const c = cols[li];
        dc.fillStyle = 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')';
        dc.fill('evenodd');
      }
      dc.restore();
    }
    // The sim's frame: a white box with a dark keyline, so it reads on sea and on land alike.
    const fb = this.frameBox();
    if (fb) {
      this.lastBox = fb;
      const x = B + fb.x * M, y = B + fb.y * M, w = fb.w * M, h = fb.h * M;
      g.noFill(); g.stroke(C.ink[0], C.ink[1], C.ink[2], 210); g.strokeWeight(4.5); g.rect(x, y, w, h);
      g.stroke(C.box[0], C.box[1], C.box[2]); g.strokeWeight(2.2); g.rect(x, y, w, h);
    }
    // The two towns the captions name.
    const font = (typeof FreckleFace !== 'undefined') ? FreckleFace : null;
    for (const [name, tx, ty] of (D.towns || [])) {
      const x = B + tx * M, y = B + ty * M;
      g.stroke(C.paper[0], C.paper[1], C.paper[2]); g.strokeWeight(2); g.fill(C.ink[0], C.ink[1], C.ink[2]); g.circle(x, y, 8);
      g.noStroke(); if (font) g.textFont(font); g.textSize(T.townSize); g.textAlign(LEFT, CENTER);
      const tx2 = x + 8, ty2 = y - 11;
      g.fill(C.paper[0], C.paper[1], C.paper[2], 220);
      for (let a = 0; a < 8; a++) g.text(name, tx2 + Math.cos(a * Math.PI / 4) * 1.8, ty2 + Math.sin(a * Math.PI / 4) * 1.8);
      g.fill(C.ink[0], C.ink[1], C.ink[2]); g.text(name, tx2, ty2);
    }
    g.noFill(); g.stroke(C.ink[0], C.ink[1], C.ink[2], 170); g.strokeWeight(1.5); g.rect(B, B, M, M);
    return g;
  },

  _freeMaps() {
    for (const id in this._maps) { const b = this._maps[id]; if (b && b.remove) b.remove(); }   // createGraphics is a real canvas (CLAUDE.md)
    this._maps = {};
  },
  _freeCaps() {
    for (const k in this._caps) { const c = this._caps[k]; if (c && c.buf && c.buf.remove) c.buf.remove(); }
    this._caps = {};
  },
  free() { this._freeMaps(); this._freeCaps(); this._key = null; },

  // ---- captions ---------------------------------------------------------------------------------------
  caption(ctxKey, id) {
    const C = TM_ISLAND.copy[ctxKey], spec = C && C[id];
    if (!spec || typeof createGraphics !== 'function') return null;
    const key = ctxKey + '|' + id + '|' + this._density();
    if (this._caps[key] !== undefined) return this._caps[key];
    return (this._caps[key] = this._buildCaption(spec));
  },

  _wrap(str, maxW) {
    const words = String(str).split(' '), lines = [];
    let line = '';
    for (const w of words) {
      const t = line ? line + ' ' + w : w;
      if (line && textWidth(t) > maxW) { lines.push(line); line = w; } else line = t;
    }
    if (line) lines.push(line);
    return lines;
  },

  _buildCaption(spec) {
    const T = TM_ISLAND, C = T.colors, font = (typeof FreckleFace !== 'undefined') ? FreckleFace : null;
    const TS = T.titleSize, BS = T.bodySize, PAD = 16, PADX = 34, GAP = 8;
    push(); if (font) textFont(font);
    textSize(BS); const lines = spec.body ? this._wrap(spec.body, T.captionW) : [];
    let w0 = 0; for (const l of lines) w0 = Math.max(w0, textWidth(l));
    if (spec.title) { textSize(TS); w0 = Math.max(w0, textWidth(spec.title)); }
    pop();
    const w = Math.ceil(w0 + 2 * PADX);
    const h = Math.ceil(PAD + (spec.title ? TS * 1.15 : 0) + (spec.title && lines.length ? GAP : 0) + lines.length * BS * 1.3 + PAD);
    const b = createGraphics(w, h);
    if (b.pixelDensity && this._density() > 1) b.pixelDensity(this._density());
    b.clear();
    const dc = b.drawingContext;
    if (dc && dc.createRadialGradient) {                                // the cards' soft dark backdrop
      dc.save(); dc.translate(w / 2, h / 2); dc.scale(w / 2, h / 2);
      const gr = dc.createRadialGradient(0, 0, 0, 0, 0, 1);
      gr.addColorStop(0, 'rgba(8,14,12,0.86)'); gr.addColorStop(0.75, 'rgba(8,14,12,0.78)'); gr.addColorStop(1, 'rgba(8,14,12,0)');
      dc.fillStyle = gr; dc.fillRect(-1, -1, 2, 2); dc.restore();
    }
    const say = (str, size, y, col) => {
      if (font) b.textFont(font);
      b.textSize(size); b.textAlign(CENTER, CENTER); b.noStroke();
      b.fill(C.halo[0], C.halo[1], C.halo[2], C.halo[3]); b.text(str, w / 2 + 2, y + 2);
      b.fill(col[0], col[1], col[2]); b.text(str, w / 2, y);
    };
    let y = PAD;
    if (spec.title) { say(spec.title, TS, y + TS * 0.55, C.title); y += TS * 1.15 + (lines.length ? GAP : 0); }
    for (const l of lines) { say(l, BS, y + BS * 0.62, C.text); y += BS * 1.3; }
    return { buf: b, w, h };
  },

  // ---- drawing ----------------------------------------------------------------------------------------
  // Date a, and date b over it by `mix`, at `alpha`, into the top-right corner of a W × H frame; the
  // captions of the same context crossfade with them. target: a p5.Graphics, or null for the canvas.
  draw(target, a, b, mix, alpha, W, H, ctxKey) {
    if (!(alpha > 0.004) || !this.ok()) return;
    const T = TM_ISLAND, S = T.size, x = W - T.margin - S, y = T.margin;
    const dc = target ? target.drawingContext : ((typeof drawingContext !== 'undefined') ? drawingContext : null);
    const a0 = dc ? dc.globalAlpha : 1;
    const mA = this.map(a), mB = (b && mix > 0.002) ? this.map(b) : null;
    if (mA) this._blit(target, dc, a0, mA, x, y, S, S, alpha);
    if (mB) this._blit(target, dc, a0, mB, x, y, S, S, alpha * mix);
    const cy = y + S + T.captionGap;
    this._putCaption(target, dc, a0, this.caption(ctxKey, a), x + S / 2, cy, W, alpha * (b ? 1 - mix : 1));
    if (b) this._putCaption(target, dc, a0, this.caption(ctxKey, b), x + S / 2, cy, W, alpha * mix);
    if (dc) dc.globalAlpha = a0;
  },

  _blit(target, dc, a0, buf, x, y, w, h, al) {
    if (dc) dc.globalAlpha = a0 * al;
    if (target) { target.imageMode(CORNER); target.noTint(); target.image(buf, x, y, w, h); }
    else { imageMode(CORNER); noTint(); image(buf, x, y, w, h); }
  },

  _putCaption(target, dc, a0, cap, cx, cy, W, al) {
    if (!cap || !(al > 0.004)) return;
    let x = cx - cap.w / 2;
    if (x + cap.w > W - 6) x = W - 6 - cap.w;                           // never off the right edge
    this._blit(target, dc, a0, cap.buf, Math.round(x), Math.round(cy), cap.w, cap.h, al);
  },

  // The dev attract sequence: the two dated maps either side of yearsBP and how far across, holding each
  // date and crossfading over the middle palaeoCross of every leg. Returns a reused object.
  palaeoPair(yearsBP) {
    const P = TM_ISLAND.palaeoDates, out = this._pair;
    out.a = P[0][0]; out.b = null; out.mix = 0;
    if (!(yearsBP < P[0][1])) return out;
    for (let k = 0; k + 1 < P.length; k++) {
      if (yearsBP >= P[k + 1][1]) {
        const t = (P[k][1] - yearsBP) / (P[k][1] - P[k + 1][1]), c = TM_ISLAND.palaeoCross;
        let m = (t - (0.5 - c / 2)) / c;
        m = m <= 0 ? 0 : m >= 1 ? 1 : m * m * (3 - 2 * m);
        out.a = P[k][0]; out.b = P[k + 1][0]; out.mix = m;
        return out;
      }
    }
    out.a = P[P.length - 1][0];
    return out;
  }
};
try { if (typeof window !== 'undefined') window.IslandInset = IslandInset; } catch (_) {}
