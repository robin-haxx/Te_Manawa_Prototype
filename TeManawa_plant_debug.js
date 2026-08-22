// ============================================================
// TE MANAWA — PLANT SPRITE GALLERY  (hold D for 3 s)
// ------------------------------------------------------------
// A stripped-back debug view, separate from the Debug overlay. It takes
// over the whole screen and lays out every LOADED plant sprite at the
// exact size it renders in-world, grouped by plant with a plant's
// variants sitting side by side, so relative scale and the art itself
// can be eyeballed at a glance. Background is a flat neutral (no terrain).
//
//   hold D for 3 s   toggle the gallery on/off
//   scroll / ↑↓      pan (true scale can run taller than the screen)
//   SAVE PNG / S     export the WHOLE page (all rows) as one PNG
//
// It reads `plantSprites` (built in preload) for the art and PLANT_TYPES
// for each plant's footprint size, and multiplies by the LIVE
// CONFIG.viewZoom — the same world→screen scale the sim draws with — so a
// sprite here is the size it would actually be on the wall. It never
// touches the sim.
//
// HELD-KEY HANDLING lives here (Game routes keydown / keyup / a per-frame
// tick to it). The D key already cycles the Debug overlay on a tap; a HOLD
// is disambiguated by swallowing the keydown and resolving on release:
//   · tap  (< 3 s) → replayed to Debug.handleKey → cycles the overlay
//   · hold (≥ 3 s) → toggles this gallery, and the overlay is left alone
// This also stops an OS key-repeat from spamming the overlay's mode cycle
// while D is held, which the old direct keydown path did.
//
// ------------------------------------------------------------
// UNUSED PLANT SPRITE AUDIT  (2026-08-13)
// ------------------------------------------------------------
// This gallery draws only the sprites the code actually LOADS (via
// PLANT_SPRITE_SETS in TeManawa_sketch.js). Every plant set now points at a
// sprites/<Species>/ folder, so nothing loads from the sprites/ root any more.
// The files below sit in sprites/ but are referenced nowhere in the JS — the
// old root state-frames superseded by folder art, plus a few unwired folder
// frames. Per CLAUDE.md, retired art moves to sprites/_retired/ (not deleted);
// these are candidates for that move. Confirm against a fresh grep before
// touching any — art wiring changes often.
//
//   Superseded root state-frames (folder art replaced them):
//     Beech_{Mature,Thriving,Wilting,Dormant}.png     -> Beech/
//     Fern_{Mature,Thriving,Wilting,Dormant}.png      -> TreeFern/ (fern)
//     Flax_{Mature,Thriving,Wilting,Dormant}.png      -> Flax/
//     Totara_{Mature,Thriving,Wilting,Dormant}.png      -> Totara/ (Totara proto)
//     Tussock_{Mature,Thriving,Wilting,Dormant}.png   -> Tussock/
//   Unwired folder frames:
//     Totara/Totara_Mature.png, Totara/Totara_Dormant.png
//       (Totara is sizeOnly — it never loads state frames, only Growing_/Size_)
//     Epiphytes/Epiphytes.png  (comment in sketch.js: hand-composited into
//       tree art, never wired as a plant type)
//   Already parked in sprites/_retired/ (also unused): Lancewood*, Patotara*
//       — the lancewood/patotara plant TYPES still exist but render procedurally
//       (not in PLANT_SPRITE_SETS), so their old art stays retired.
// ============================================================
const PlantGallery = {
  active: false,

  HOLD_MS: 3000,     // how long D must be held to toggle
  KEY_D: 68,         // keyCode for 'd'/'D' (keyIsDown polling)

  // Flat background — a mid neutral that reads against both light and dark art.
  BG: [74, 82, 78],

  // Layout constants shared by the on-screen render and the full-page PNG export,
  // so both lay the gallery out identically (only scroll/clip differ).
  LAYOUT: { marginX: 40, top: 92, frameGap: 12, groupGap: 34, rowGap: 28, labelH: 34 },

  // hold-tracking state
  _downAt: null,        // millis() when D first went down, or null
  _holdConsumed: false, // true once this hold has toggled (ignore until release)

  // scroll state — the gallery keeps true on-screen scale, so at large viewZoom
  // the content runs taller than the screen; scrollY pans it. Clamped to the
  // content height each render (see _maxScroll, set there).
  scrollY: 0,
  _maxScroll: 0,

  // ==========================================================
  // INPUT
  // ----------------------------------------------------------
  // keydown: swallow D so the tap-vs-hold decision resolves on keyup / tick,
  // instead of the overlay cycling immediately (and repeating on autorepeat).
  onKeyDown(k) {
    // While the gallery is up, the arrow / page keys pan it — swallow them so
    // they never reach the sim. Home/End jump to the ends.
    if (this.active) {
      if (k === 'ArrowDown')  { this.scroll( this._pageStep(0.15)); return true; }
      if (k === 'ArrowUp')    { this.scroll(-this._pageStep(0.15)); return true; }
      if (k === 'PageDown' || k === ' ') { this.scroll( this._pageStep(0.9)); return true; }
      if (k === 'PageUp')     { this.scroll(-this._pageStep(0.9)); return true; }
      if (k === 'Home')       { this.scrollY = 0; return true; }
      if (k === 'End')        { this.scrollY = this._maxScroll; return true; }
      if (k === 's' || k === 'S') { this.saveImage(); return true; }
    }
    if (k !== 'd' && k !== 'D') return false;
    if (this._downAt == null) { this._downAt = millis(); this._holdConsumed = false; }
    return true;
  },

  // A scroll step as a fraction of the viewport height (used by the key pans).
  _pageStep(frac) {
    const H = (typeof CONFIG !== 'undefined' && CONFIG.canvasHeight) ? CONFIG.canvasHeight : 1080;
    return H * frac;
  },

  // Pan by dy pixels, clamped to the content. Positive dy scrolls down.
  // _maxScroll is refreshed each render() once the true content height is known.
  scroll(dy) {
    if (!this.active) return false;
    this.scrollY = Math.max(0, Math.min(this._maxScroll, this.scrollY + dy));
    return true;
  },

  // keyup: a short tap never crossed the hold threshold, so it was meant as a
  // normal Debug-overlay action — replay it. A completed hold already toggled.
  onKeyUp(k) {
    if (k !== 'd' && k !== 'D') return false;
    const wasTap = !this._holdConsumed &&
      (this._downAt == null || millis() - this._downAt < this.HOLD_MS);
    this._downAt = null;
    this._holdConsumed = false;
    if (wasTap && typeof Debug !== 'undefined') Debug.handleKey(k);
    return true;
  },

  // Once per frame from draw(). Polls the physical key so a missed keyup
  // (window blur mid-hold) can't strand the timer, and so the toggle fires
  // exactly when the 3 s mark is crossed rather than on release.
  tick() {
    const down = (typeof keyIsDown === 'function') && keyIsDown(this.KEY_D);
    if (!down) { this._downAt = null; this._holdConsumed = false; return; }
    if (this._downAt == null) { this._downAt = millis(); this._holdConsumed = false; }
    if (!this._holdConsumed && millis() - this._downAt >= this.HOLD_MS) {
      this.active = !this.active;
      if (this.active) this.scrollY = 0;   // always open at the top
      this._holdConsumed = true;
      if (typeof console !== 'undefined') console.log('[PlantGallery]', this.active ? 'ON' : 'OFF');
    }
  },

  // ==========================================================
  // FRAME COLLECTION
  // ----------------------------------------------------------
  // Every distinct sprite a plant type can render, de-duplicated. Single-asset
  // stand-ins alias one image across all four seasonal states, so identity
  // de-dup collapses them to a single 'mature' frame. sizeOnly plants (tōtara/
  // Totara) never load state frames — they show their growth sequence and size
  // variants instead. `sizeFactor` reproduces the sim's per-state footprint
  // scaling (growth frames render smaller); states and variants are drawn at
  // the full mature footprint, matching _renderSprite in TeManawa_plant.js.
  // ==========================================================
  _collectFrames(set) {
    const frames = [];
    const seen = new Set();
    const add = (img, label, sizeFactor) => {
      if (!img || !img.width) return;   // never loaded / failed — skip
      if (seen.has(img)) return;        // single-asset alias already shown
      seen.add(img);
      frames.push({ img, label, sizeFactor: sizeFactor || 1 });
    };

    const sizeOnly = set.meta && set.meta.sizeOnly;
    if (!sizeOnly) {
      add(set.mature,   'mature',   1);
      add(set.thriving, 'thriving', 1);
      add(set.wilting,  'wilting',  1);
      add(set.dormant,  'dormant',  1);
    }
    if (set.growing && set.growing.length) {
      const n = set.growing.length;
      // Growth frames render at size·(0.55 + 0.45·growth). Use each frame's
      // mid-band growth so the ramp reads at true on-screen scale.
      set.growing.forEach((img, i) =>
        add(img, 'grow ' + (i + 1), 0.55 + 0.45 * ((i + 0.5) / n)));
    }
    if (set.variants && set.variants.length) {
      set.variants.forEach((img, i) => add(img, 'size ' + i, 1));
    }
    return frames;
  },

  // Build the per-plant groups with each frame sized to on-screen pixels.
  _buildGroups(zoom) {
    const out = [];
    if (typeof plantSprites === 'undefined' || !plantSprites) return out;

    for (const type of Object.keys(plantSprites)) {
      const set = plantSprites[type];
      if (!set) continue;
      const def = (typeof PLANT_TYPES !== 'undefined') ? PLANT_TYPES[type] : null;
      const scale = (set.meta && set.meta.scale) || 1;
      const worldW = (def ? def.size : 12) * scale;   // footprint width, world units

      const frames = this._collectFrames(set).map(fr => {
        const drawW = worldW * fr.sizeFactor * zoom;
        const ar = (fr.img.height && fr.img.width) ? fr.img.height / fr.img.width : 1;
        return { img: fr.img, label: fr.label, drawW, drawH: drawW * ar };
      });
      if (!frames.length) continue;

      out.push({ type, name: def ? def.name : type, worldW, frames });
    }
    return out;
  },

  // ==========================================================
  // LAYOUT  (target-agnostic geometry)
  // ----------------------------------------------------------
  // Flow the plant groups into wrapping rows for a page `W` wide, measuring text
  // on the render target `g` (the main canvas for the screen, an offscreen buffer
  // for the PNG export) so both lay out identically. Each row is stamped with the
  // baselineY its frames stand on, so painting is pure — no geometry there.
  // Returns { groups, rows, contentH } where contentH is the rows' total height
  // below `LAYOUT.top`.
  // ==========================================================
  _measure(g, zoom, W) {
    const L = this.LAYOUT;
    const groups = this._buildGroups(zoom);

    const rows = [];
    let row = { groups: [], maxH: 0 };
    let x = L.marginX;
    g.textSize(12);
    for (const grp of groups) {
      grp.contentW = grp.frames.reduce((s, f) => s + f.drawW, 0) + (grp.frames.length - 1) * L.frameGap;
      grp.labelW = g.textWidth(grp.name + '  (' + grp.worldW + ')');
      grp.w = Math.max(grp.contentW, grp.labelW);
      grp.h = grp.frames.reduce((m, f) => Math.max(m, f.drawH), 0);

      if (x + grp.w > W - L.marginX && row.groups.length) {   // wrap
        rows.push(row);
        row = { groups: [], maxH: 0 };
        x = L.marginX;
      }
      grp.x = x;
      row.groups.push(grp);
      row.maxH = Math.max(row.maxH, grp.h);
      x += grp.w + L.groupGap;
    }
    if (row.groups.length) rows.push(row);

    let rowY = L.top;
    for (const r of rows) {
      r.baselineY = rowY + r.maxH;                 // every frame in the row stands here
      rowY = r.baselineY + L.labelH + L.rowGap;
    }
    return { groups, rows, contentH: rowY - L.top };
  },

  // ==========================================================
  // PAINT  (target-agnostic — `g` is the main canvas OR an offscreen buffer)
  // ==========================================================
  // Backdrop + header. Fills the whole target so a saved PNG is self-contained.
  _paintBackdrop(g, zoom, W, H) {
    g.noStroke();
    g.fill(this.BG[0], this.BG[1], this.BG[2]);
    g.rect(0, 0, W, H);

    g.fill(240, 245, 240);
    g.textAlign(LEFT, TOP);
    g.textSize(20);
    g.text('PLANT SPRITE GALLERY', 40, 30);
    g.fill(190, 205, 195);
    g.textSize(12);
    g.text('On-screen scale · viewZoom ×' + zoom.toFixed(2) + ' · All art by Rafaela Martins Gaspar', 40, 58);
  },

  // Rows at absolute coordinates (baselineY set by _measure). No scroll or clip —
  // the caller handles those for the screen; the export draws every row in full.
  _paintRows(g, rows) {
    const L = this.LAYOUT;
    for (const r of rows) {
      const baselineY = r.baselineY;

      // subtle ground line spanning the row's groups
      const first = r.groups[0], last = r.groups[r.groups.length - 1];
      g.stroke(255, 255, 255, 28);
      g.strokeWeight(1);
      g.line(first.x, baselineY + 0.5, last.x + last.w, baselineY + 0.5);
      g.noStroke();

      for (const grp of r.groups) {
        // frames, baseline-aligned, centred within the group's reserved width
        let fx = grp.x + (grp.w - grp.contentW) / 2;
        for (const f of grp.frames) {
          // f.img may be an AtlasFrame (packed sprites) — the global image() wrap
          // does not see graphics-method draws, so route through drawTo().
          if (typeof SpriteAtlas !== 'undefined' && SpriteAtlas.isFrame(f.img)) {
            SpriteAtlas.drawTo(g, f.img, fx, baselineY - f.drawH, f.drawW, f.drawH);
          } else {
            g.image(f.img, fx, baselineY - f.drawH, f.drawW, f.drawH);
          }
          if (grp.frames.length > 1) {   // label each frame only when there's variation
            g.fill(150, 165, 155);
            g.textSize(9);
            g.textAlign(CENTER, TOP);
            g.text(f.label, fx + f.drawW / 2, baselineY + 18);
          }
          fx += f.drawW + L.frameGap;
        }

        // plant name + footprint width, centred under the group
        g.fill(225, 235, 228);
        g.textSize(12);
        g.textAlign(CENTER, TOP);
        g.text(grp.name + '  (' + grp.worldW + ')', grp.x + grp.w / 2, baselineY + 4);
      }
    }
  },

  // SAVE PNG button geometry (screen space), so draw and hit-test agree.
  _saveBtn(W) { return { x: W - 168, y: 22, w: 128, h: 34 }; },

  // ==========================================================
  // RENDER  (screen space — no viewZoom transform is active here)
  // ==========================================================
  render(W, H) {
    const zoom = (typeof CONFIG !== 'undefined' && CONFIG.viewZoom) ? CONFIG.viewZoom : 1;
    const L = this.LAYOUT;

    push();
    textFont('monospace');
    this._paintBackdrop(window, zoom, W, H);

    const { rows, contentH } = this._measure(window, zoom, W);
    if (!rows.length) {
      fill(240, 210, 150);
      textSize(16);
      textAlign(CENTER, CENTER);
      text('no plant sprites loaded', W / 2, H / 2);
      pop();
      return;
    }

    // ---- clamp scroll to the measured content --------------
    const viewTop = L.top - 14;          // clip a touch above the first row's art
    const viewH = H - viewTop;
    this._maxScroll = Math.max(0, contentH - viewH);
    if (this.scrollY > this._maxScroll) this.scrollY = this._maxScroll;

    // ---- rows, clipped to the viewport and panned by scrollY ----
    const ctx = (typeof drawingContext !== 'undefined') ? drawingContext : null;
    if (ctx) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, viewTop, W, viewH);
      ctx.clip();
    }
    translate(0, -this.scrollY);
    this._paintRows(window, rows);
    translate(0, this.scrollY);          // undo the pan before the clip is released
    if (ctx) ctx.restore();

    // ---- scrollbar: only when the content overflows the viewport ----
    if (this._maxScroll > 0) {
      const trackX = W - 10, trackW = 4;
      const trackY = viewTop + 4, trackH = viewH - 8;
      fill(255, 255, 255, 24);
      rect(trackX, trackY, trackW, trackH, 2);

      const thumbH = Math.max(24, trackH * (viewH / contentH));
      const thumbY = trackY + (trackH - thumbH) * (this.scrollY / this._maxScroll);
      fill(230, 240, 233, 150);
      rect(trackX, thumbY, trackW, thumbH, 2);

      // hint, only while there's more below to reveal
      if (this.scrollY < this._maxScroll - 1) {
        fill(210, 220, 214, 170);
        textAlign(RIGHT, BOTTOM);
        textSize(11);
        text('scroll / ↑↓ for more ▾', W - 20, H - 10);
      }
    }

    // ---- SAVE PNG button (drawn last, over everything; not baked into the export) ----
    const b = this._saveBtn(W);
    noStroke();
    fill(58, 118, 88);
    rect(b.x, b.y, b.w, b.h, 6);
    fill(235, 245, 238);
    textAlign(CENTER, CENTER);
    textSize(12);
    text('SAVE PNG  (S)', b.x + b.w / 2, b.y + b.h / 2 + 1);

    pop();
  },

  // ==========================================================
  // EXPORT
  // ----------------------------------------------------------
  // Save the WHOLE page — every row at true on-screen scale, not just the visible
  // viewport — as one PNG. Layout is measured in the gallery's 1920×1080 LOGICAL
  // space, but the buffer is allocated (and scaled) by the live sprite supersample
  // so the export lands at the wall's real backing resolution — 4K at the default
  // ×2, matching what's on screen — rather than 1080p. Frees the buffer after
  // (the createGraphics leak rule, CLAUDE.md / BUILD_V3 §2.3). One-shot on a
  // click / the S key; never on the visitor path.
  // ==========================================================
  saveImage() {
    if (typeof createGraphics !== 'function' || typeof saveCanvas !== 'function') return;
    const zoom = (typeof CONFIG !== 'undefined' && CONFIG.viewZoom) ? CONFIG.viewZoom : 1;
    const W = (typeof CONFIG !== 'undefined' && CONFIG.canvasWidth) ? CONFIG.canvasWidth : 1920;
    const L = this.LAYOUT;

    // Supersample factor the wall renders sprites+HUD at (×2 default → 4K backing).
    const ss = (typeof spriteSS === 'function' && spriteSS()) ||
               (typeof CONFIG !== 'undefined' && CONFIG.spriteSupersample) || 2;

    // Measure on the main canvas (same monospace metrics as the buffer will use).
    const { rows, contentH } = this._measure(window, zoom, W);
    if (!rows.length) { console.warn('[PlantGallery] nothing to save — no sprites loaded'); return; }
    const H = Math.ceil(L.top + contentH + 24);

    let pg = null;
    try {
      pg = createGraphics(W * ss, H * ss);   // buffer at the full backing resolution
      if (pg.pixelDensity) pg.pixelDensity(1);
      pg.push();
      pg.scale(ss);                          // author in logical space, land on 4K pixels
      pg.textFont('monospace');
      this._paintBackdrop(pg, zoom, W, H);
      this._paintRows(pg, rows);
      pg.pop();
      const name = 'temanawa_plant_gallery_z' + zoom.toFixed(2);
      saveCanvas(pg, name, 'png');
      if (typeof console !== 'undefined') console.log('[PlantGallery] saved', name + '.png', (W * ss) + '×' + (H * ss));
    } catch (e) {
      if (typeof console !== 'undefined') console.warn('[PlantGallery] save failed', e);
    } finally {
      if (pg && pg.remove) pg.remove();
    }
  },

  // Click routing (from Game.handleClick, in logical/1080 space). While the
  // gallery is up it owns the pointer: the SAVE button fires the export, and any
  // other click is swallowed so it can't reach the sim UI underneath.
  handleClick(mx, my) {
    if (!this.active) return false;
    const W = (typeof CONFIG !== 'undefined' && CONFIG.canvasWidth) ? CONFIG.canvasWidth : 1920;
    const b = this._saveBtn(W);
    if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) this.saveImage();
    return true;
  }
};
