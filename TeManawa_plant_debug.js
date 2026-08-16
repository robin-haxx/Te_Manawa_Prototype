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
//     Rimu_{Mature,Thriving,Wilting,Dormant}.png      -> Totara/ (rimu proto)
//     Tussock_{Mature,Thriving,Wilting,Dormant}.png   -> Tussock/
//   Unwired folder frames:
//     Totara/Totara_Mature.png, Totara/Totara_Dormant.png
//       (rimu is sizeOnly — it never loads state frames, only Growing_/Size_)
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

  // hold-tracking state
  _downAt: null,        // millis() when D first went down, or null
  _holdConsumed: false, // true once this hold has toggled (ignore until release)

  // ==========================================================
  // INPUT
  // ----------------------------------------------------------
  // keydown: swallow D so the tap-vs-hold decision resolves on keyup / tick,
  // instead of the overlay cycling immediately (and repeating on autorepeat).
  onKeyDown(k) {
    if (k !== 'd' && k !== 'D') return false;
    if (this._downAt == null) { this._downAt = millis(); this._holdConsumed = false; }
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
  // rimu) never load state frames — they show their growth sequence and size
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
  // RENDER  (screen space — no viewZoom transform is active here)
  // ==========================================================
  render(W, H) {
    const zoom = (typeof CONFIG !== 'undefined' && CONFIG.viewZoom) ? CONFIG.viewZoom : 1;

    push();
    noStroke();
    fill(this.BG[0], this.BG[1], this.BG[2]);
    rect(0, 0, W, H);

    textFont('monospace');

    // ---- header --------------------------------------------
    fill(240, 245, 240);
    textAlign(LEFT, TOP);
    textSize(20);
    text('PLANT SPRITE GALLERY', 40, 30);
    fill(190, 205, 195);
    textSize(12);
    text('all art at on-screen scale · viewZoom ×' + zoom.toFixed(2), 40, 58);

    const groups = this._buildGroups(zoom);
    if (!groups.length) {
      fill(240, 210, 150);
      textSize(16);
      textAlign(CENTER, CENTER);
      text('no plant sprites loaded', W / 2, H / 2);
      pop();
      return;
    }

    // ---- flow layout: assign groups to wrapping rows -------
    const marginX = 40, top = 92;
    const frameGap = 12, groupGap = 34, rowGap = 28;
    const labelH = 34;                 // reserved under each row for name + per-frame labels

    const rows = [];
    let row = { groups: [], maxH: 0 };
    let x = marginX;
    for (const g of groups) {
      g.contentW = g.frames.reduce((s, f) => s + f.drawW, 0) + (g.frames.length - 1) * frameGap;
      textSize(12);
      g.labelW = textWidth(g.name + '  (' + g.worldW + ')');
      g.w = Math.max(g.contentW, g.labelW);
      g.h = g.frames.reduce((m, f) => Math.max(m, f.drawH), 0);

      if (x + g.w > W - marginX && row.groups.length) {   // wrap
        rows.push(row);
        row = { groups: [], maxH: 0 };
        x = marginX;
      }
      g.x = x;
      row.groups.push(g);
      row.maxH = Math.max(row.maxH, g.h);
      x += g.w + groupGap;
    }
    if (row.groups.length) rows.push(row);

    // ---- render rows ---------------------------------------
    let rowY = top;
    for (const r of rows) {
      const baselineY = rowY + r.maxH;   // every frame in the row stands on this line

      // subtle ground line spanning the row's groups
      const first = r.groups[0], last = r.groups[r.groups.length - 1];
      stroke(255, 255, 255, 28);
      strokeWeight(1);
      line(first.x, baselineY + 0.5, last.x + last.w, baselineY + 0.5);
      noStroke();

      for (const g of r.groups) {
        // frames, baseline-aligned, centred within the group's reserved width
        let fx = g.x + (g.w - g.contentW) / 2;
        for (const f of g.frames) {
          image(f.img, fx, baselineY - f.drawH, f.drawW, f.drawH);
          if (g.frames.length > 1) {   // label each frame only when there's variation
            fill(150, 165, 155);
            textSize(9);
            textAlign(CENTER, TOP);
            text(f.label, fx + f.drawW / 2, baselineY + 18);
          }
          fx += f.drawW + frameGap;
        }

        // plant name + footprint width, centred under the group
        fill(225, 235, 228);
        textSize(12);
        textAlign(CENTER, TOP);
        text(g.name + '  (' + g.worldW + ')', g.x + g.w / 2, baselineY + 4);
      }

      rowY = baselineY + labelH + rowGap;
    }

    // ---- footer: flag overflow so it isn't mistaken for "all of them" ----
    if (rowY > H) {
      fill(240, 190, 150);
      textAlign(LEFT, BOTTOM);
      textSize(11);
      text('… content taller than screen at this viewZoom (true scale kept)', 40, H - 10);
    }

    pop();
  }
};
