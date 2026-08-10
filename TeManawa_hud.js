// ============================================================
// TE MANAWA — INSTALLATION HUD
// ------------------------------------------------------------
// The deep-time timeline (top), the five buttons (bottom), and the
// world-space effects the buttons produce.
//
// Phase 1.5: this was TeManawa_install.js, a monkey-patch layer that
// overrode Game.update / Game.handleKey / GameUI.renderFullscreenOverlay
// at load time. The economy strip it was patching around is gone, so it
// is now a normal module that Game and GameUI call into directly.
//
// Buttons respond to touch/mouse AND keys 1-5, so physical arcade
// microswitches can be mapped onto those keys without touching this file.
//
// Time model tunables live on window.TM_TIME.
// ============================================================

// The clock lives in TeManawa_time.js (DeepTime). What is left here is the
// timing of the transient button effects.
const TM_TIME = {
  stormSeconds:    20,
  growWarmSeconds:  8,    // forest growth pulse (interglacial-suited) — button 2
  growColdSeconds:  8,    // open-country growth pulse (glacial-suited) — button 3
  ashMillis:   1600,      // ramped ash flash — seizure-safe, see renderAshFlash
  ashPeak:      205,      // flash alpha at the peak (kept < 255 for headroom)
  erCooldownMs: 2000,     // minimum gap between eruptions — the anti-spam limit
  erLongPressMs: 3000,    // hold the eruption button this long to reseed the land
  // read-through to DeepTime so older references keep working
  get yearsStart() { return DeepTime.yearsStart; },
  get yearsEnd()   { return DeepTime.yearsEnd; },
  get yrPerSec()   { return DeepTime.yrPerSec; },
  get deepMult()   { return DeepTime.deepMult; },
  get deepSeconds(){ return DeepTime.deepSeconds; },
  get fps()        { return DeepTime.fps; }
};
window.TM_TIME = TM_TIME;

// Which plants each growth button matures, classified by the authored `coldTolerance`
// (0 = tree fern, cold-sensitive → 1 = tussock, cold-hardy; PLANT_TYPES in sketch.js). The
// FOREST button grows warm/forest cover (low tolerance), the TUSSOCK button grows cold-hardy
// open country (high tolerance); mid-tolerance plants (e.g. flax 0.7) are neutral to both, so
// neither press is a universal win. See md/TEMANAWA_INTERACTION_HEALTH_PLAN.md §2.
const TM_GROW = { warmMax: 0.65, coldMin: 0.75, step: 0.02 };
window.TM_GROW = TM_GROW;

const InstallHUD = {
  TOP_H: 88,
  BOT_H: 132,
  STORM_CLOUDS: 14,

  // ---- time ------------------------------------------------
  yearsBP(g)          { return DeepTime.yearsBP; },
  yearToX(yr, x0, w)  { return DeepTime.yearToX(yr, x0, w); },

  // ---- buttons ---------------------------------------------
  BUTTONS: [
    { id: 'deep',   key: '1', label: '50,000 YEARS',
      action: () => DeepTime.pressDeep(),
      isActive: () => DeepTime.isDeep() },
    // GROWTH is split in two: the RIGHT one depends on the climate (plan §2). FOREST grows
    // warm/forest cover (suits the interglacial); TUSSOCK grows cold-hardy open country (suits
    // the glacial). Pressing the wrong one for the current climate drains habitat health and
    // the scene quietly desaturates (Game._updateHabitatHealth); the maturation itself is the
    // same per-set nudge (InstallHUD.update).
    { id: 'growWarm', key: '2', label: 'FOREST',
      action: (g) => { g._tmGrowWarmUntil = millis() + TM_TIME.growWarmSeconds * 1000; },
      isActive: (g) => g._tmGrowWarmUntil && millis() < g._tmGrowWarmUntil },
    { id: 'growCold', key: '3', label: 'TUSSOCK',
      action: (g) => { g._tmGrowColdUntil = millis() + TM_TIME.growColdSeconds * 1000; },
      isActive: (g) => g._tmGrowColdUntil && millis() < g._tmGrowColdUntil },
    { id: 'storm',  key: '4', label: 'STORM',
      action: (g) => { g._tmStormUntil  = millis() + TM_TIME.stormSeconds  * 1000;
                       InstallHUD.initStormCells(g); },
      isActive: (g) => g._tmStormUntil  && millis() < g._tmStormUntil },
    // Eruption is a press-and-hold TIME-NAVIGATION control between the volcanic events
    // (plan §3). A TAP reverts to the previous (older) eruption and replays it; a HOLD
    // (erLongPressMs) skips forward to the next (younger) one, wrapping to Kidnappers past
    // Whakamaru. Both do a soft regen + terrain morph to that year + the event's ash
    // clearing (Game.applyEruptionAt), so the visitor watches the land recover. A tap is
    // rate-limited by erCooldownMs and the flash ramps across a hold, keeping full-screen
    // luminance changes inside the photosensitivity budget (TEMANAWA_BUILD_V3.md §3). See
    // erDown/erUp/fireEruption/fireEruptionReseed/renderAshFlash.
    { id: 'reset',  key: '5', label: 'ERUPTION',
      action: (g) => InstallHUD.erDown(g),   // press-down only arms the interaction
      onUp:   (g) => InstallHUD.erUp(g),     // release taps unless the hold already reseeded
      isActive: (g) => (g._tmErDownAt && !g._tmErFired) ||
                       (g._tmAshUntil && millis() < g._tmAshUntil) }
  ],

  press(g, id) {
    const b = this.BUTTONS.find(x => x.id === id);
    if (b) b.action(g);
  },

  handleKey(g, k) {
    for (const b of this.BUTTONS) {
      if (k === b.key) { b.action(g); return true; }
    }
    return false;
  },

  handleKeyUp(g, k) {
    for (const b of this.BUTTONS) {
      if (k === b.key) { if (b.onUp) b.onUp(g); return true; }
    }
    return false;
  },

  handleClick(ui, mx, my) {
    for (const b of (ui._tmButtons || [])) {
      if (mx > b.x && mx < b.x + b.w && my > b.y && my < b.y + b.h) {
        b.def.action(ui.game);
        return true;
      }
          
    }
    const H = ui.config.canvasHeight;
    // Swallow clicks landing on either strip so they don't fall through to the map.
    return (my < this.TOP_H || my > H - this.BOT_H);
  },

  // A pointer release carries no button identity, so resolve every hold-capable
  // button. erUp() is a no-op unless that button is actually mid-hold, so this
  // is safe to fire on any release (incl. one that started off a button).
  handleClickUp(ui) {
    for (const b of this.BUTTONS) if (b.onUp) b.onUp(ui.game);
  },

  // ---- eruption: tap = revert to previous event, hold = skip to next ----
  // Press-down only arms the interaction; whether it becomes a tap or a long
  // press is decided later (on release, or by update() at the hold threshold),
  // so the one button can do two things. The guard makes OS key-repeat — which
  // fires keydown repeatedly while '4' is held — a no-op after the first.
  erDown(g) {
    if (!g._tmErDownAt) { g._tmErDownAt = millis(); g._tmErFired = false; }
  },

  // Release: if the hold never reached erLongPressMs (so update() didn't already
  // reseed) it counts as a tap — a normal eruption, subject to the cooldown.
  erUp(g) {
    if (!g._tmErDownAt) return;
    const fired = g._tmErFired;
    g._tmErDownAt = 0;
    g._tmErFired  = false;
    if (!fired) this.fireEruption(g);
  },

  // A tap: REVERT to the previous (older) eruption and replay it — soft regen from the
  // cleared state (plan §3.2). Ash flash + Game.applyEruptionAt does the seek/morph/clear.
  // No-op at/older than the first event (prevEruption null). Swallowed inside the cooldown
  // so the button cannot be spammed into a flash strobe.
  fireEruption(g) {
    const now = millis();
    if (now < (g._tmErCooldownUntil || 0)) return false;
    const y = (typeof DeepTime !== 'undefined') ? DeepTime.prevEruption(DeepTime.yearsBP) : null;
    if (y == null) return false;                   // nothing older to revert to
    g._tmAshUntil = now + TM_TIME.ashMillis;
    g._tmAshMode  = 'tap';                         // flash rises and falls
    g._tmErCooldownUntil = now + TM_TIME.erCooldownMs;
    if (typeof g.applyEruptionAt === 'function') g.applyEruptionAt(y, DeepTime.eruptionByYear(y));
    else if (typeof Kiosk !== 'undefined') Kiosk.resetToAttract(g, 'eruption', { reseed: false });
    return true;
  },

  // A long press: SKIP forward to the next (younger) eruption and fire its clearing (plan
  // §3.2); wraps to Kidnappers past Whakamaru — Oruanui is terminal (§3.5). The charge ramp
  // in renderAshFlash has driven the flash to full by the time this fires, so the morph hitch
  // lands under a bright frame and the flash falls from that peak. Fired from update() at the
  // threshold.
  fireEruptionReseed(g) {
    const now = millis();
    g._tmErFired = true;                           // release must not also revert
    g._tmAshUntil = now + TM_TIME.ashMillis;
    g._tmAshMode  = 'hold';                         // flash falls from the charged peak
    g._tmErCooldownUntil = now + TM_TIME.erCooldownMs;
    const y = (typeof DeepTime !== 'undefined') ? DeepTime.nextEruption(DeepTime.yearsBP) : null;
    if (y != null && typeof g.applyEruptionAt === 'function') g.applyEruptionAt(y, DeepTime.eruptionByYear(y));
    else if (typeof Kiosk !== 'undefined') Kiosk.resetToAttract(g, 'eruption-reseed', { reseed: true });
  },

  // ==========================================================
  // PER-FRAME UPDATE — called from Game.update()
  // ==========================================================
  update(g, dt) {
    // DeepTime owns the clock and the eased multiplier; advance it and take
    // back the scale the rest of the frame should run at.
    g.timeScale = DeepTime.update(dt);

    // Growth pulse, split by climate suitability: FOREST matures warm/forest cover, TUSSOCK
    // matures cold-hardy open country (classified by coldTolerance, TM_GROW). Both are the
    // same per-plant nudge; the RIGHT choice for the current climate is taught by the health
    // readout, not here (a wrong press desaturates via Game._updateHabitatHealth). The plants
    // it matures against the climate get suppressed anyway by the existing forest-band /
    // dormancy machinery, so a mismatched press is doubly futile.
    const nowMs = millis();
    if (g._tmGrowWarmUntil && nowMs < g._tmGrowWarmUntil) this._growPulse(g, true);
    if (g._tmGrowColdUntil && nowMs < g._tmGrowColdUntil) this._growPulse(g, false);

    // Storm: map-wide hunt-breaker + drifting thunderheads while the window is open.
    if (g._tmStormUntil && millis() < g._tmStormUntil) {
      this.applyStormDistraction(g);
      this.updateStormCells(g, dt);
    }

    // Eruption long-press: holding the button past erLongPressMs reseeds the
    // land. Fire once — erFired guards both this test and OS key-repeat — the
    // instant the threshold lands, by which point the flash has ramped to full.
    if (g._tmErDownAt && !g._tmErFired &&
        millis() - g._tmErDownAt >= TM_TIME.erLongPressMs) {
      this.fireEruptionReseed(g);
    }

    return g.timeScale;
  },

  // Mature the climate-appropriate plants toward full while a growth button is held.
  // warm=true → FOREST (coldTolerance <= TM_GROW.warmMax); warm=false → TUSSOCK
  // (coldTolerance >= TM_GROW.coldMin). Allocation-free; skips plants of the other set.
  _growPulse(g, warm) {
    const plants = g.simulation && g.simulation.plants;
    if (!plants) return;
    const TYPES = (typeof PLANT_TYPES !== 'undefined') ? PLANT_TYPES : null;
    const G = (typeof TM_GROW !== 'undefined') ? TM_GROW : { warmMax: 0.65, coldMin: 0.75, step: 0.02 };
    for (let i = 0; i < plants.length; i++) {
      const p = plants[i];
      if (!p || !p.alive || p.growth >= 1) continue;
      const def = TYPES ? TYPES[p.type] : null;
      const ct = def ? def.coldTolerance : 0.5;
      const inSet = warm ? (ct <= G.warmMax) : (ct >= G.coldMin);
      if (inSet) p.growth = Math.min(1, p.growth + G.step);
    }
  },

  // Mirrors HaastsEagle.checkStorms(): only eagles actually HUNTING get broken
  // off, and it re-applies every frame so hunts starting mid-storm are caught too.
  applyStormDistraction(g) {
    const eagles = g.simulation && g.simulation.eagles;
    if (!eagles) return;
    for (let i = 0; i < eagles.length; i++) {
      const e = eagles[i];
      if (!e || !e.alive) continue;
      if (e.distractedTimer > 0) continue;
      if (!e.hunting) continue;
      // beDistracted() zeroes the timer unless distractedBy is a LIVE object with
      // a pos, so hand it an invisible stand-in anchored just off each bird —
      // a shared centre would clump every eagle onto one point.
      const a = Math.random() * Math.PI * 2;
      e.distractedBy = {
        alive: true,
        pos: { x: e.pos.x + Math.cos(a) * 40, y: e.pos.y + Math.sin(a) * 40 }
      };
      e.distractedTimer = 180;
      e.hunting = false;
      e.target = null;
      e.huntSearchTimer = 0;
    }
  },

  initStormCells(g) {
    const t = g.terrain;
    if (!t) { g._tmStormCells = null; return; }
    const cells = [];
    for (let i = 0; i < this.STORM_CLOUDS; i++) {
      cells.push({
        x: Math.random() * t.mapWidth,
        y: Math.random() * t.mapHeight,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.4,
        sprite: Math.random() < 0.5 ? 'cloud1' : 'cloud2',
        scale: 0.5 + Math.random() * 0.4,
        bobPhase: Math.random() * Math.PI * 2,
        bobSpeed: 0.02 + Math.random() * 0.02,
        alpha: 180 + Math.random() * 75
      });
    }
    g._tmStormCells = cells;
    g._tmBolt = { active: false, timer: 20 + Math.random() * 40, duration: 0, x: 0, y: 0, scale: 1, rot: 0 };
  },

  updateStormCells(g, dt) {
    const t = g.terrain, cells = g._tmStormCells;
    if (!t || !cells) return;
    const pad = 48;
    for (let i = 0; i < cells.length; i++) {
      const c = cells[i];
      c.x += c.vx * dt; c.y += c.vy * dt; c.bobPhase += c.bobSpeed * dt;
      if (c.x < -pad) c.x = t.mapWidth + pad; else if (c.x > t.mapWidth + pad) c.x = -pad;
      if (c.y < -pad) c.y = t.mapHeight + pad; else if (c.y > t.mapHeight + pad) c.y = -pad;
    }
    const b = g._tmBolt;
    if (!b) return;
    if (b.active) {
      b.duration -= dt;
      if (b.duration <= 0) { b.active = false; b.timer = 25 + Math.random() * 45; }
    } else {
      b.timer -= dt;
      if (b.timer <= 0) {
        const c = cells[(Math.random() * cells.length) | 0];
        b.active = true; b.duration = 4 + Math.random() * 4;
        b.x = c.x; b.y = c.y + 10;
        b.scale = 0.6 + Math.random() * 0.4;
        b.rot = (Math.random() - 0.5) * 0.6;
      }
    }
  },

  stormEnvelope(g) {
    const remain = g._tmStormUntil - millis();
    if (remain <= 0) return 0;
    const elapsed = TM_TIME.stormSeconds * 1000 - remain;
    return Math.max(0, Math.min(1, Math.min(elapsed / 600, remain / 800)));
  },

  // ==========================================================
  // RENDER
  // ==========================================================
  renderWorldLayer(g, W, H) {
    if (!(g._tmStormUntil && millis() < g._tmStormUntil)) return;
    const t = g.terrain, cells = g._tmStormCells;
    if (!t) return;
    const env = this.stormEnvelope(g);
    if (env <= 0) return;

    const zx = CONFIG.viewX, zy = CONFIG.viewY, z = CONFIG.viewZoom;
    const mw = t.mapWidth * z, mh = t.mapHeight * z;
    if (mw <= 0 || mh <= 0) return;

    push();
    stroke(150, 170, 210, 90 * env);
    strokeWeight(2);
    const tt = millis() * 0.5;
    for (let i = 0; i < 70; i++) {
      const x = zx + ((i * 137 + tt) % mw);
      const y = zy + ((i * 83 + tt * 1.7) % mh);
      line(x, y, x + 6, y + 14);   // down-and-RIGHT: rain blown SE by the fixed NW wind (SPRITE_BRIEF §1.1)
    }

    if (cells && typeof placeableSprites !== 'undefined' && placeableSprites.loaded) {
      noStroke();
      imageMode(CENTER);
      noTint();                       // clouds fade via globalAlpha (#7), not tint()
      const _dc = drawingContext;
      for (let i = 0; i < cells.length; i++) {
        const c = cells[i];
        const sp = placeableSprites[c.sprite];
        if (!sp) continue;
        const size = 64 * c.scale * z;
        _dc.globalAlpha = c.alpha * env;
        image(sp, zx + c.x * z, zy + (c.y + Math.sin(c.bobPhase) * 2) * z, size, size);
      }
      _dc.globalAlpha = 1;
      const b = g._tmBolt;
      if (b && b.active && placeableSprites.bolt) {
        push();
        translate(zx + b.x * z, zy + b.y * z);
        rotate(b.rot);
        tint(255, 255, 200, Math.min(255, (b.duration / 8) * 255 + 150) * env);
        const bs = 64 * b.scale * z;
        image(placeableSprites.bolt, 0, 0, bs, bs);
        if (b.duration > 6) {   // brief, soft glow — kept gentle for photosensitivity
          noTint(); noStroke();
          fill(255, 255, 200, 50 * env);
          ellipse(0, 0, 150 * z, 150 * z);
        }
        pop();
      }
      noTint();
    }
    pop();
  },
  // ==========================================================
  // TIMELINE — visitor-facing, deliberately sparse
  // ----------------------------------------------------------
  // Visually geared towards a quick impression."What is the year shown?"
  // Where is this in the overall timeline?, What is this showing me about the Manawatu?
  // This could be geared better to show the geography at a glance.
  //
  // Most mechanics under the hood are not shown in UI.
  //
  // What the climate DOES is still fully visible; it is meant to be read off
  // the land and the cast — tree ferns vanishing, tussock spreading, the moa
  // changing — not off a graph. That is finding #2 and finding #3, and a
  // chart on the wall undercuts both.
  //
  // The uplift wedge stays: uplift is the takeaway (the river is older than
  // the mountains) and it is monotonic, so it needs no reading.
  // ==========================================================
  // ---- cached HUD text -----------------------------------------------------
  // p5 text() with the decorative fonts is the HUD's dominant per-frame cost —
  // ~1.2 ms per bar, ~85% of each method (TEMANAWA_BUILD_V3.md §5). Almost every
  // label is static (button names, key hints, eruption markers) or changes only
  // occasionally (the rounded year). So each distinct string is rasterised ONCE
  // into a small buffer and blitted thereafter. An LRU cap bounds memory and
  // remove()s the evicted GPU buffer (the §2.3 createGraphics-leak rule): the
  // rolling year string would otherwise accumulate a buffer every time it ticks.
  _txtCache: new Map(),        // key -> { buf, tw, th }; insertion order = LRU
  _txtCacheMax: 48,

  _blitText(str, fontObj, tag, size, ah, av, x, y, col) {
    const a = (col.length > 3) ? col[3] : 255;
    const key = tag + size + '|' + col[0] + ',' + col[1] + ',' + col[2] + ',' + a + '|' + str;
    let e = this._txtCache.get(key);
    if (e) { this._txtCache.delete(key); this._txtCache.set(key, e); }   // LRU touch
    else {
      push(); textFont(fontObj); textSize(size);
      const tw = Math.max(1, Math.ceil(textWidth(str))); pop();
      const th = Math.ceil(size * 1.35);
      const buf = createGraphics(tw + 4, th + 4);
      buf.clear(); buf.noStroke(); buf.fill(col[0], col[1], col[2], a);
      buf.textFont(fontObj); buf.textSize(size); buf.textAlign(LEFT, TOP);
      buf.text(str, 2, 2);
      e = { buf, tw, th };
      this._txtCache.set(key, e);
      while (this._txtCache.size > this._txtCacheMax) {          // evict oldest, free its buffer
        const k0 = this._txtCache.keys().next().value, old = this._txtCache.get(k0);
        this._txtCache.delete(k0);
        if (old && old.buf && old.buf.remove) old.buf.remove();
      }
    }
    let dx = x, dy = y;
    if (ah === CENTER) dx -= e.tw / 2; else if (ah === RIGHT) dx -= e.tw;
    if (av === CENTER) dy -= e.th / 2; else if (av === BOTTOM) dy -= e.th;
    else if (av === BASELINE) dy -= e.th * 0.8;
    imageMode(CORNER); noTint();
    image(e.buf, dx - 2, dy - 2);
  },

  renderTimeline(ui, g, W, H) {
    const yr = DeepTime.yearsBP;
    const x0 = 48, w = W - 96;
    const ay = this.TOP_H - 30;
    push();
    noStroke(); fill(14, 21, 19, 205); rect(0, 0, W, this.TOP_H);
    // ---- the year ------------------------------------------
    this._blitText(DeepTime.label(), FreckleFace, 'freckle', 26, CENTER, TOP, W / 2, 10, [232, 240, 236]);
    // ---- axis ----------------------------------------------
    stroke(96, 116, 106); strokeWeight(1.5); line(x0, ay, x0 + w, ay);
    // ---- uplift: monotonic, no reading required ------------
    const upY = ay + 7, upH = 6;
    noStroke(); fill(74, 66, 52, 160); rect(x0, upY, w, upH, 3);
    const upNow = DeepTime.yearToX(yr, x0, w);
    fill(168, 140, 96, 235);
    beginShape();
    vertex(x0, upY + upH);
    vertex(upNow, upY + upH);
    vertex(upNow, upY + upH - upH * DeepTime.progress());
    endShape(CLOSE);
    // ---- the two eruptions ---------------------------------
    // The run opens and closes on the same kind of event. Glacial markers are
    // climate instrumentation and live in the debug overlay now — and LGM at
    // 30 ka sat ~13 px from Oruanui at 25.5 ka, so they overlapped permanently.
    for (const m of DEEP_TIME_MARKERS) {
      if (m.kind !== 'eruption') continue;
      const mx = DeepTime.yearToX(m.yearsBP, x0, w);
      stroke(224, 138, 92, 210); strokeWeight(2);
      line(mx, ay - 5, mx, ay + 5);
      // Anchor the end labels inward so they don't clip off the strip.
      const atStart = mx < x0 + 40, atEnd = mx > x0 + w - 40;
      this._blitText(m.label, OpenDyslexic, 'dys', 11,
                     atStart ? LEFT : atEnd ? RIGHT : CENTER, BOTTOM, mx, ay - 8, [224, 138, 92, 225]);
    }
    // ---- playhead ------------------------------------------
    const px = DeepTime.yearToX(yr, x0, w);
    stroke(255, 210, 120, 130); strokeWeight(1); line(px, ay - 14, px, upY + upH + 2);
    noStroke(); fill(255, 210, 120); circle(px, ay, 9);
    // ---- fast-forward --------------------------------------
    if (DeepTime.isDeep()) {
      this._blitText('>> x' + DeepTime.timeScale.toFixed(1), FreckleFace, 'freckle', 15, RIGHT, TOP, x0 + w, 12, [255, 210, 120]);
    }
    pop();
  },

  renderButtons(ui, g, W, H) {
    const n = this.BUTTONS.length, m = 24, gap = 18;
    const bw = (W - 2 * m - (n - 1) * gap) / n;
    const bh = this.BOT_H - 30;
    const by = H - this.BOT_H + 16;
    push();
    noStroke(); fill(14, 21, 19, 210); rect(0, H - this.BOT_H, W, this.BOT_H);
    ui._tmButtons = [];
    for (let i = 0; i < n; i++) {
      const b = this.BUTTONS[i], bx = m + i * (bw + gap), on = b.isActive(g);
      if (on) { fill(58, 48, 24, 240); stroke(255, 210, 120); strokeWeight(3); }
      else    { fill(30, 44, 38, 225); stroke(70, 110, 80); strokeWeight(1.5); }
      rect(bx, by, bw, bh, 12);
      this.drawIcon(b.id, bx + bw / 2, by + 30, on);
      this._blitText(b.label, FreckleFace, 'freckle', 20, CENTER, CENTER, bx + bw / 2, by + bh - 24,
                     on ? [255, 226, 160] : [220, 235, 225]);
      this._blitText(b.key, OpenDyslexic, 'dys', 12, LEFT, TOP, bx + 8, by + 6, [120, 140, 130]);
      ui._tmButtons.push({ x: bx, y: by, w: bw, h: bh, def: b });
    }
    pop();
  },

  drawIcon(id, cx, cy, on) {
    push(); noFill();
    const c = on ? color(255, 226, 160) : color(210, 230, 220);
    stroke(c); strokeWeight(3); fill(c);
    if (id === 'deep') {
      triangle(cx - 10, cy - 9, cx - 10, cy + 9, cx - 1, cy);
      triangle(cx + 1, cy - 9, cx + 1, cy + 9, cx + 10, cy);
    } else if (id === 'growWarm') {          // FOREST — a little tree (trunk + canopy)
      stroke(c); strokeWeight(3); line(cx, cy + 11, cx, cy - 3);
      fill(c); noStroke();
      ellipse(cx, cy - 8, 17, 15);
    } else if (id === 'growCold') {          // TUSSOCK — a tuft of open-country grass
      stroke(c); strokeWeight(2); noFill();
      line(cx, cy + 11, cx - 9, cy - 8);
      line(cx, cy + 11, cx - 4, cy - 11);
      line(cx, cy + 11, cx + 2, cy - 11);
      line(cx, cy + 11, cx + 8, cy - 7);
    } else if (id === 'storm') {
      fill(c); noStroke();
      ellipse(cx - 6, cy - 2, 14, 10); ellipse(cx + 5, cy - 2, 14, 10); ellipse(cx, cy - 6, 14, 10);
      stroke(255, 220, 80); strokeWeight(3); noFill();
      beginShape();
      vertex(cx + 1, cy + 2); vertex(cx - 4, cy + 9);
      vertex(cx + 2, cy + 9); vertex(cx - 3, cy + 15);
      endShape();
    } else if (id === 'reset') {
      fill(150, 150, 150); noStroke();
      quad(cx - 12, cy + 10, cx - 5, cy - 8, cx + 5, cy - 8, cx + 12, cy + 10);
      fill(240, 120, 60); ellipse(cx, cy - 9, 14, 8);
      fill(200, 90, 50); circle(cx - 7, cy - 13, 4); circle(cx + 6, cy - 15, 5); circle(cx, cy - 19, 4);
    }
    pop();
  },

  // Photosensitivity: every rise here is a single monotonic ramp over >=500 ms,
  // with no hard cut and no strobe, and the cooldown caps how often one can
  // start. TEMANAWA_BUILD_V3.md §3 sets the rule — max 3 luminance transitions
  // per second, large-area changes ramped over >=500 ms.
  //
  // Two contributions, whichever is brighter wins:
  //  1. CHARGE — while the button is held for a long press, the flash ramps
  //     0 -> peak across erLongPressMs (3 s), so a hold visibly builds toward the
  //     reseed. Eased (squared) so a brief tap barely registers.
  //  2. FLASH — after an eruption fires. A tap has no charge behind it, so it
  //     rises AND falls (a sine bump). A long-press reseed hands off from the
  //     charge ramp already at peak, so it only falls (a cosine tail) — no dip,
  //     no second rise, and the init() hitch stays hidden under the bright frame.
  renderAshFlash(g, W, H) {
    const now = millis();
    let a = 0;

    if (g._tmErDownAt && !g._tmErFired) {
      const c = Math.max(0, Math.min(1, (now - g._tmErDownAt) / TM_TIME.erLongPressMs));
      a = Math.max(a, c * c * TM_TIME.ashPeak);
    }

    if (g._tmAshUntil && now < g._tmAshUntil) {
      const p = Math.max(0, Math.min(1, 1 - (g._tmAshUntil - now) / TM_TIME.ashMillis));
      const env = (g._tmAshMode === 'hold')
        ? Math.cos(p * (Math.PI / 2))   // 1 -> 0 : fall from the charged peak
        : Math.sin(p * Math.PI);        // 0 -> 1 -> 0 : a tap's rise and fall
      a = Math.max(a, env * TM_TIME.ashPeak);
    }

    if (a <= 0) return;
    push(); noStroke(); fill(205, 202, 196, a); rect(0, 0, W, H); pop();
  }
};