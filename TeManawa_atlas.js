// ============================================
// SPRITE STRIPS — the animated-texture loader
// ============================================
// One horizontal strip PNG per animation: N frames laid left-to-right. ONE
// loadImage per animation (not N separate files — see md/TEMANAWA_BUILD_V3.md
// §2.4, the 158-request cold-boot problem the loose-file convention creates),
// then each frame is blitted with the 9-arg image(img, dx,dy,dw,dh, sx,0,sw,sh)
// sub-rectangle form. That 9-arg form appears nowhere else in the engine yet;
// this is the atlas module the build plan deferred (§2.1), landing with the
// water layer as its first client. Plants/fauna can migrate onto it later, or it
// can grow into a packed multi-animation atlas + JSON frame map.
//
// The decoded image stays GPU-resident for the life of the page, so a soft reset
// never re-decodes it (§5.1) — animated water costs nothing on the reset path.
//
// A strip is registered either from a loaded p5.Image (loadStrip, real art in
// preload) or from a p5.Graphics baked ONCE (makePlaceholder, until the art
// lands). The water layer calls frame()/draw() and never cares which it got.
//
// Pure-ish: p5 image/loadImage/createGraphics at runtime only. No per-frame
// allocation — frame() returns into a shared scratch object.

const SpriteStrips = {
  _strips: Object.create(null),       // name -> { img, frameW, frameH, count }
  _scratch: { img: null, sx: 0, sy: 0, sw: 0, sh: 0 },
  _placeholdersBuilt: false,

  // Register a strip from an already-loaded image/graphics. `count` frames are
  // assumed laid out horizontally, each (img.width / count) wide × img.height.
  register(name, img, count) {
    if (!img || !count) return null;
    const fw = Math.max(1, Math.floor((img.width || count) / count));
    const e = { img, frameW: fw, frameH: img.height || fw, count };
    this._strips[name] = e;
    return e;
  },

  // Preload path (real art): loadImage the strip PNG, register on success. NEVER
  // pass an empty failure callback — a silent miss is how moa juveniles rendered
  // as adults for months (§2.4). Call from preload() once the strips exist.
  loadStrip(name, pathStr, count, onFail) {
    const self = this;
    return loadImage(pathStr,
      (im) => self.register(name, im, count),
      () => { console.warn(`[strips] could not load ${pathStr}`); if (onFail) onFail(); });
  },

  has(name) { return !!this._strips[name]; },
  count(name) { const e = this._strips[name]; return e ? e.count : 0; },

  // Frame sub-rectangle for `name` at frame index i (wrapped). Returns a shared
  // scratch object (no allocation) or null if the strip is not registered, so
  // callers can no-op cleanly on a missing strip.
  frame(name, i) {
    const e = this._strips[name];
    if (!e) return null;
    const k = ((i % e.count) + e.count) % e.count;
    const s = this._scratch;
    s.img = e.img; s.sx = k * e.frameW; s.sy = 0; s.sw = e.frameW; s.sh = e.frameH;
    return s;
  },

  // Blit frame i of `name` into the dest rect, honouring the current imageMode
  // (callers set imageMode(CENTER) and pass the centre). Returns false — a clean
  // no-op — if the strip is not registered.
  draw(name, i, dx, dy, dw, dh) {
    const f = this.frame(name, i);
    if (!f) return false;
    image(f.img, dx, dy, dw, dh, f.sx, f.sy, f.sw, f.sh);
    return true;
  },

  // ---- placeholder art (THROWAWAY) ---------------------------------------
  // Bakes crude N-frame strips into createGraphics ONCE, so the whole water
  // pipeline (blit + animation + placement + projection) is visible and testable
  // before any real PNG exists. Replace a placeholder by loadStrip()-ing a real
  // strip of the SAME name in preload() (real art wins — see ensurePlaceholders):
  // the water layer needs no change. Delete this block once the art is in.
  ensurePlaceholders() {
    if (this._placeholdersBuilt) return;
    this._placeholdersBuilt = true;
    // Only fill gaps: if real art already registered a name, leave it alone.
    if (!this.has('water_current')) this.register('water_current', this._bakeStrip('current', 8, 48), 8);
    if (!this.has('water_glint'))   this.register('water_glint',   this._bakeStrip('glint',   6, 32), 6);
    if (!this.has('sea_shimmer'))   this.register('sea_shimmer',   this._bakeStrip('sea',     8, 56), 8);
    if (!this.has('eel_swim'))      this.register('eel_swim',      this._bakeStrip('eel',     8, 64), 8);
  },

  // Draw one placeholder strip (frameW·count × frameW) frame by frame. Local
  // coordinates per frame are 0..sz. Kept deliberately crude — real art replaces
  // it. Uses only p5.Graphics ops the headless harness stubs (no-ops there).
  _bakeStrip(kind, count, sz) {
    const g = createGraphics(sz * count, sz);
    g.clear();
    g.noStroke();
    for (let f = 0; f < count; f++) {
      const ox = f * sz, ph = f / count;   // ph = 0..1 animation phase
      g.push();
      g.translate(ox, 0);
      if (kind === 'current') {
        // Cyan dashes flowing left→right; the phase slides them along.
        g.fill(150, 220, 240, 120);
        for (let d = 0; d < 3; d++) {
          let x = ((ph + d / 3) % 1) * sz;
          g.rect(x - sz * 0.18, sz * (0.30 + 0.20 * d), sz * 0.36, sz * 0.10, sz * 0.05);
        }
      } else if (kind === 'glint') {
        // A small white sparkle that swells then fades (0→peak→0 across frames).
        const s = Math.sin(ph * Math.PI);          // 0..1..0
        g.fill(255, 255, 255, 40 + 150 * s);
        const r = sz * (0.10 + 0.16 * s);
        g.ellipse(sz * 0.5, sz * 0.5, r, r * 0.5);
        g.ellipse(sz * 0.5, sz * 0.5, r * 0.4, r);
      } else if (kind === 'sea') {
        // Faint horizontal wavelets that drift sideways with the phase.
        g.fill(210, 230, 240, 70);
        for (let r = 0; r < 3; r++) {
          const yy = sz * (0.30 + 0.20 * r);
          const x = ((ph + r * 0.33) % 1) * sz;
          g.ellipse(x, yy, sz * 0.5, sz * 0.10);
          g.ellipse(x - sz, yy, sz * 0.5, sz * 0.10);
        }
      } else if (kind === 'eel') {
        // A dark sinuous body: overlapping blobs along a travelling sine wave,
        // with a lighter head. Reads as an undulating swim from above.
        const mid = sz * 0.5, amp = sz * 0.16, coils = 2.2;
        for (let s = 0; s <= 10; s++) {
          const t = s / 10;
          const x = sz * (0.10 + 0.80 * t);
          const y = mid + Math.sin((t * coils + ph) * Math.PI * 2) * amp;
          g.fill(46, 64, 42, 210);
          const w = sz * (0.20 - 0.10 * t);   // taper toward the tail
          g.ellipse(x, y, w, w * 0.7);
          if (s === 0) { g.fill(70, 92, 60, 230); g.ellipse(x, y, w * 1.1, w * 0.8); }
        }
      }
      g.pop();
    }
    return g;
  }
};

if (typeof module !== 'undefined' && module.exports) module.exports = SpriteStrips;
