// ============================================================
// TE MANAWA: LIVE FAUNA OUTLINE (prototype: bush moa + kererū)
// ------------------------------------------------------------
// Every fauna PNG carries a baked off-white "sticker" border outside its dark ink line. This
// RECOLOURS that border live, so the cast's outline can follow the climate and the visitor's
// interactions, for ONE extra quad per creature (the boost highlight's ring stamps 16):
//
//   build()  setup, BEFORE SpriteAtlas.build: pull each prototype frame's border out into a white
//            MASK (alpha = how much of the pixel is border). Computed at the atlas pack scale (it is
//            only ever sampled at that size) and registered so the atlas packs every mask right
//            beside its sprite: same page, so the mask quad joins the batch with no texture switch.
//   link()   setup, right AFTER SpriteAtlas.build: map each packed sprite frame to its mask frame.
//   draw()   from the render, right after the sprite: image() the mask over the sprite at the same
//            place and size, tinted. GL only, where a per-quad colour is free (no tint bake). The 2D
//            fallback skips it and shows the baked border, unchanged.
//
// Colour: the baked border colour, leaning `climateMix` toward the ambient edge band (the eased
// climate hue, desaturated by habitat health: InstallHUD.renderEdgeGlow); while a boost highlights
// the species, the boost colour instead (white → climate for a goal answer, grey when wrong:
// EntitySprites.outlineStyle). Identical to the baked border → no quad at all.
//
// Extraction: grow inward from the transparent edge through border-coloured pixels and stop at the
// ink line, so cream INSIDE the ink (moa legs and beak, the kererū's white breast) is never taken; a
// depth cap means a gap in the ink can't leak far. Setup cost is logged ([outline] …). For the whole
// cast, precompute the masks offline instead (a hard reload must stay inside 1.5–2.5 s).
// ============================================================

const FAUNA_OUTLINE = {
  on: true,
  // PROTOTYPE: which sprite sets get a live outline (keys of EntitySprites.moaVariants / flyer sets).
  sets: { moa: ['bush'], flyer: ['kereru'] },
  climateMix: 0.35,          // how far a resting outline leans from the baked off-white toward the climate band
  replaceBoostRing: true,    // an outlined creature shows a boost by recolouring its border, not the 16-stamp ring
  // Masks are stored at this fraction of the sprite's atlas size. A mask is one flat colour, so half
  // resolution still out-resolves a bird on the 4K raster, at a quarter of the texture memory (~100 MB
  // → ~25 MB for the whole cast). Extraction always runs at the full atlas size, then downsamples, so
  // thin ink lines still stop the growth.
  maskScale: 0.5,
  // Extraction, in NATIVE source px (500×500 art) / 0–255 colour units:
  maxDepth: 20,              // how far in from the transparent edge the border may run (it is ~12 px)
  inkLum: 95,                // edge pixels darker than this are ink, ignored when reading the border colour
  colTol: 40,                // within this RGB distance of the border colour: fully border
  colSoft: 75,               // … easing to not-border by this distance (anti-aliased seams)
  fringeAlpha: 64            // below this alpha a pixel is the outer anti-aliased fringe: border, whatever its RGB
};
try { if (typeof window !== 'undefined') window.FAUNA_OUTLINE = FAUNA_OUTLINE; } catch (_) {}

const FaunaOutline = {
  _pairs: [],          // { sprite, mask, base:[r,g,b] } — the atlas rebinds sprite + mask in place
  _byFrame: null,      // sprite (frame) → pair, after link()
  _col: [0, 0, 0],     // scratch colour (no allocation per draw)
  stats: null,         // { masks, ms, scale } from the last build

  // ---- pure extraction (p5-free; bootcheck tests it on a synthetic sprite) ---------------------
  // px: RGBA (un-premultiplied, as getImageData returns), w×h. depthPx/the colour knobs default to
  // FAUNA_OUTLINE. Returns { alpha: Uint8ClampedArray(w*h), base: [r,g,b], count } or null.
  extract(px, w, h, depthPx) {
    const O = FAUNA_OUTLINE, n = w * h;
    const maxD = Math.max(1, Math.round(depthPx != null ? depthPx : O.maxDepth));
    const lum = (i) => 0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2];
    const opaque = (i) => px[i * 4 + 3] >= 24;
    // 1. Seeds: opaque pixels touching transparency (or the frame edge).
    const seeds = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (!opaque(i)) continue;
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1 ||
          !opaque(i - 1) || !opaque(i + 1) || !opaque(i - w) || !opaque(i + w)) seeds.push(i);
    }
    if (!seeds.length) return null;
    // 2. The border colour: the mean of the solid, light seeds (the fringe's RGB is unreliable).
    let sr = 0, sg = 0, sb = 0, sn = 0;
    for (const i of seeds) {
      if (px[i * 4 + 3] < 200 || lum(i) <= O.inkLum) continue;
      sr += px[i * 4]; sg += px[i * 4 + 1]; sb += px[i * 4 + 2]; sn++;
    }
    if (!sn) return null;
    const base = [sr / sn, sg / sn, sb / sn];
    const dist = (i) => {
      const dr = px[i * 4] - base[0], dg = px[i * 4 + 1] - base[1], db = px[i * 4 + 2] - base[2];
      return Math.sqrt(dr * dr + dg * dg + db * db);
    };
    // Border weight of a pixel: 1 within colTol, easing to 0 at colSoft; the faint outer fringe is
    // border regardless. The ink line is far outside colSoft of the off-white, so growth stops there.
    const weight = (i) => {
      if (px[i * 4 + 3] < O.fringeAlpha) return 1;
      const d = dist(i);
      return d <= O.colTol ? 1 : (d >= O.colSoft ? 0 : (O.colSoft - d) / (O.colSoft - O.colTol));
    };
    // 3. Breadth-first inward from the seeds, through border-weighted pixels, to the depth cap.
    const depth = new Int16Array(n).fill(-1);
    const q = new Int32Array(n);
    let qh = 0, qt = 0;
    for (const i of seeds) if (weight(i) > 0) { depth[i] = 0; q[qt++] = i; }
    const alpha = new Uint8ClampedArray(n);
    let count = 0;
    const visit = (j, d) => {
      if (depth[j] !== -1 || !opaque(j) || weight(j) <= 0) return;
      depth[j] = d; q[qt++] = j;
    };
    while (qh < qt) {
      const i = q[qh++], d = depth[i];
      const wgt = weight(i);
      alpha[i] = px[i * 4 + 3] * wgt;
      count++;
      if (d >= maxD || wgt < 1) continue;              // a partial (seam) pixel is the last step inward
      const x = i % w, y = (i / w) | 0;
      if (x > 0) visit(i - 1, d + 1);
      if (x < w - 1) visit(i + 1, d + 1);
      if (y > 0) visit(i - w, d + 1);
      if (y < h - 1) visit(i + w, d + 1);
    }
    return { alpha, base, count };
  },

  // ---- setup: build masks for the prototype sets (BEFORE SpriteAtlas.build) ----------------------
  build() {
    this._pairs = []; this._byFrame = null; this.stats = null;
    if (!FAUNA_OUTLINE.on || typeof EntitySprites === 'undefined' || typeof createImage !== 'function') return;
    let cnv = null, cx = null;
    try {
      cnv = document.createElement('canvas');
      cx = cnv.getContext('2d', { willReadFrequently: true });
    } catch (_) { return; }
    if (!cx || typeof cx.getImageData !== 'function') return;     // headless harness: no pixels, no masks
    const f = (typeof SpriteAtlas !== 'undefined' && SpriteAtlas._effectiveScale) ? SpriteAtlas._effectiveScale() : 1;
    const t0 = (typeof performance !== 'undefined') ? performance.now() : 0;
    const seen = new Set();
    const frames = [];
    const take = (arr) => { if (!arr) return; for (const im of arr) if (im && !seen.has(im)) { seen.add(im); frames.push(im); } };
    const S = FAUNA_OUTLINE.sets || {};
    for (const k of (S.moa || [])) { const set = EntitySprites.moaVariants && EntitySprites.moaVariants[k]; if (set) { take(set.looking); take(set.eating); take(set.walking); } }
    for (const k of (S.flyer || [])) { const set = EntitySprites[k]; if (set) { take(set.flying); take(set.hopping); take(set.eating); } }
    for (const img of frames) {
      const src = img.canvas || img.elt || null;
      if (!src || !(img.width > 0) || !(img.height > 0)) continue;
      const w = Math.max(1, Math.round(img.width * f)), h = Math.max(1, Math.round(img.height * f));
      try {
        cnv.width = w; cnv.height = h;
        cx.clearRect(0, 0, w, h);
        cx.drawImage(src, 0, 0, w, h);
        const data = cx.getImageData(0, 0, w, h).data;
        const r = this.extract(data, w, h, FAUNA_OUTLINE.maxDepth * f);
        if (!r || !r.count) continue;
        // White + the border alpha at the extraction size, then box-downsampled to maskScale.
        const sc = Math.max(0.1, Math.min(1, FAUNA_OUTLINE.maskScale || 1));
        const mw = Math.max(1, Math.round(w * sc)), mh = Math.max(1, Math.round(h * sc));
        const mask = createImage(mw, mh);
        mask.loadPixels();
        const mp = mask.pixels;
        for (let my = 0; my < mh; my++) {
          const y0 = Math.floor(my * h / mh), y1 = Math.max(y0 + 1, Math.floor((my + 1) * h / mh));
          for (let mx = 0; mx < mw; mx++) {
            const x0 = Math.floor(mx * w / mw), x1 = Math.max(x0 + 1, Math.floor((mx + 1) * w / mw));
            let s = 0;
            for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) s += r.alpha[yy * w + xx];
            const j = (my * mw + mx) * 4;
            mp[j] = 255; mp[j + 1] = 255; mp[j + 2] = 255; mp[j + 3] = s / ((y1 - y0) * (x1 - x0));
          }
        }
        mask.updatePixels();
        mask.__nativeW = img.width; mask.__nativeH = img.height;   // the atlas stores it 1:1, frames report native size
        this._pairs.push({ sprite: img, mask, base: r.base });
      } catch (e) { console.warn('[outline] mask failed:', e && e.message); }
    }
    const ms = ((typeof performance !== 'undefined') ? performance.now() : 0) - t0;
    this.stats = { masks: this._pairs.length, ms: Math.round(ms), scale: f };
    console.log(`[outline] ${this._pairs.length} border masks in ${Math.round(ms)} ms (extracted at ${f}x, stored at ${f * (FAUNA_OUTLINE.maskScale || 1)}x)`);
  },

  // ---- setup: right AFTER SpriteAtlas.build (the atlas rebound pair.sprite + pair.mask in place) ---
  link() {
    this._byFrame = new Map();
    for (const p of this._pairs) if (p.sprite && p.mask) this._byFrame.set(p.sprite, p);
  },

  _glOpen() { return typeof GLBatch !== 'undefined' && GLBatch.enabled && GLBatch._open; },

  // Does this sprite frame get a live outline this frame? (EntitySprites.boostOutline asks, to skip its ring.)
  covers(sprite) {
    return !!(FAUNA_OUTLINE.on && this._byFrame && this._glOpen() && this._byFrame.has(sprite));
  },

  // The outline colour for an entity, or null when it would match the baked border (draw nothing).
  colorFor(entity, base, now) {
    const g = (typeof game !== 'undefined') ? game : null;
    const hi = g && g._boostHi;
    const key = entity && (entity.speciesKey || entity.type);
    let bc = null, k = 1;
    if (hi && now <= hi.until && key && hi.keys.has(key) && typeof EntitySprites !== 'undefined') {
      bc = EntitySprites.outlineStyle(hi, now);                      // the boost / goal colour
      k = EntitySprites._olFade;
      if (k >= 1) return bc;                                         // not fading out yet
    }
    // The un-boosted border: the climate tint, or the baked border itself.
    const m = FAUNA_OUTLINE.climateMix;
    const climate = (m > 0) && g && g._edgeR != null;
    if (!climate && !bc) return null;
    const c = this._col;
    if (climate) {
      c[0] = base[0] + (g._edgeR - base[0]) * m;
      c[1] = base[1] + (g._edgeG - base[1]) * m;
      c[2] = base[2] + (g._edgeB - base[2]) * m;
    } else { c[0] = base[0]; c[1] = base[1]; c[2] = base[2]; }
    if (bc) {                                                        // boost fading out: ease back to it
      c[0] += (bc[0] - c[0]) * k;
      c[1] += (bc[1] - c[1]) * k;
      c[2] += (bc[2] - c[2]) * k;
    }
    return c;
  },

  // Recolour the creature's border: the mask over the sprite, same place and size, tinted. Call
  // right after the sprite's image(), under the same transform and imageMode. One quad.
  draw(entity, sprite, x, y, w, h) {
    if (!FAUNA_OUTLINE.on || !this._byFrame || !this._glOpen()) return;
    if (typeof FaunaTrail !== 'undefined' && FaunaTrail._ghosting) return;   // ghosts keep the baked border
    const p = this._byFrame.get(sprite);
    if (!p) return;
    const now = (typeof millis === 'function') ? millis() : 0;
    const col = this.colorFor(entity, p.base, now);
    if (!col) return;
    tint(col[0], col[1], col[2]);
    image(p.mask, x, y, w, h);
    noTint();
  }
};
try { if (typeof window !== 'undefined') window.FaunaOutline = FaunaOutline; } catch (_) {}
