// ============================================================
// TE MANAWA — INSTALLATION HUD
// ------------------------------------------------------------
// The deep-time timeline (top), the four buttons (bottom), and the
// world-space effects the buttons produce.
//
// Phase 1.5: this was TeManawa_install.js, a monkey-patch layer that
// overrode Game.update / Game.handleKey / GameUI.renderFullscreenOverlay
// at load time. The economy strip it was patching around is gone, so it
// is now a normal module that Game and GameUI call into directly.
//
// Buttons respond to touch/mouse AND keys 1-4, so physical arcade
// microswitches can be mapped onto those keys without touching this file.
//
// Time model tunables live on window.TM_TIME.
// ============================================================

// The clock lives in TeManawa_time.js (DeepTime). What is left here is the
// timing of the transient button effects.
const TM_TIME = {
  stormSeconds:  20,
  growthSeconds:  8,
  ashMillis:   1600,      // ramped ash flash — seizure-safe, see renderAshFlash
  // read-through to DeepTime so older references keep working
  get yearsStart() { return DeepTime.yearsStart; },
  get yearsEnd()   { return DeepTime.yearsEnd; },
  get yrPerSec()   { return DeepTime.yrPerSec; },
  get deepMult()   { return DeepTime.deepMult; },
  get deepSeconds(){ return DeepTime.deepSeconds; },
  get fps()        { return DeepTime.fps; }
};
window.TM_TIME = TM_TIME;

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
    { id: 'growth', key: '2', label: 'GROWTH',
      action: (g) => { g._tmGrowthUntil = millis() + TM_TIME.growthSeconds * 1000; },
      isActive: (g) => g._tmGrowthUntil && millis() < g._tmGrowthUntil },
    { id: 'storm',  key: '3', label: 'STORM',
      action: (g) => { g._tmStormUntil  = millis() + TM_TIME.stormSeconds  * 1000;
                       InstallHUD.initStormCells(g); },
      isActive: (g) => g._tmStormUntil  && millis() < g._tmStormUntil },
    { id: 'reset',  key: '4', label: 'ERUPTION',
      action: (g) => { g._tmAshUntil    = millis() + TM_TIME.ashMillis;
                       // Phase 6 replaces this with disturb('ash') + a wetland-
                       // weighted growth pulse (PLAN_V2 §4). Until the fields
                       // exist, fall back to the kiosk's soft reset — which is the
                       // same code path the attract loop uses, so it gets exercised.
                       if (typeof Kiosk !== "undefined") Kiosk.resetToAttract(g, "eruption"); },
      isActive: (g) => g._tmAshUntil    && millis() < g._tmAshUntil }
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

  // ==========================================================
  // PER-FRAME UPDATE — called from Game.update()
  // ==========================================================
  update(g, dt) {
    // DeepTime owns the clock and the eased multiplier; advance it and take
    // back the scale the rest of the frame should run at.
    g.timeScale = DeepTime.update(dt);

    // Growth pulse: nudge living plants toward full while active.
    // Phase 6 repoints this at a per-cell growthPulse weighted by `wet`, so it
    // does something different in every habitat (PLAN_V2 §4, finding #6).
    if (g._tmGrowthUntil && millis() < g._tmGrowthUntil && g.simulation) {
      const plants = g.simulation.plants;
      if (plants) {
        for (let i = 0; i < plants.length; i++) {
          const p = plants[i];
          if (p && p.alive && p.growth < 1) p.growth = Math.min(1, p.growth + 0.02);
        }
      }
    }

    // Storm: map-wide hunt-breaker + drifting thunderheads while the window is open.
    if (g._tmStormUntil && millis() < g._tmStormUntil) {
      this.applyStormDistraction(g);
      this.updateStormCells(g, dt);
    }

    return g.timeScale;
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
      line(x, y, x - 6, y + 14);
    }

    if (cells && typeof placeableSprites !== 'undefined' && placeableSprites.loaded) {
      noStroke();
      imageMode(CENTER);
      for (let i = 0; i < cells.length; i++) {
        const c = cells[i];
        const sp = placeableSprites[c.sprite];
        if (!sp) continue;
        const size = 64 * c.scale * z;
        tint(255, c.alpha * env);
        image(sp, zx + c.x * z, zy + (c.y + Math.sin(c.bobPhase) * 2) * z, size, size);
      }
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
  // A visitor gets forty seconds. They need three things: what year it is,
  // where that sits in the span, and the two events that bookend the run.
  // Nothing else.
  //
  // The climate wave, the cold shading, the stage/MIS readout and the
  // glacial markers were all here and have moved to the debug overlay
  // (Debug.renderClimateStrip). They are instrumentation, not
  // interpretation — a visitor cannot read a temperature curve at arm's
  // length in forty seconds, and while it was on screen it was the busiest
  // thing in the frame.
  //
  // What the climate DOES is still fully visible; it is meant to be read off
  // the land and the cast — tree ferns vanishing, tussock spreading, the moa
  // changing — not off a graph. That is finding #2 and finding #3, and a
  // chart on the wall undercuts both.
  //
  // The uplift wedge stays: uplift is the takeaway (the river is older than
  // the mountains) and it is monotonic, so it needs no reading.
  // ==========================================================
  renderTimeline(ui, g, W, H) {
    const yr = DeepTime.yearsBP;
    const x0 = 48, w = W - 96;
    const ay = this.TOP_H - 30;
    push();
    noStroke(); fill(14, 21, 19, 205); rect(0, 0, W, this.TOP_H);
    // ---- the year ------------------------------------------
    fill(232, 240, 236); textAlign(CENTER, TOP);
    push(); textFont(FreckleFace); textSize(26);
    text(DeepTime.label(), W / 2, 10); pop();
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
    textSize(11);
    for (const m of DEEP_TIME_MARKERS) {
      if (m.kind !== 'eruption') continue;
      const mx = DeepTime.yearToX(m.yearsBP, x0, w);
      stroke(224, 138, 92, 210); strokeWeight(2);
      line(mx, ay - 5, mx, ay + 5);
      noStroke(); fill(224, 138, 92, 225);
      // Anchor the end labels inward so they don't clip off the strip.
      const atStart = mx < x0 + 40, atEnd = mx > x0 + w - 40;
      textAlign(atStart ? LEFT : atEnd ? RIGHT : CENTER, BOTTOM);
      push(); textFont(OpenDyslexic); text(m.label, mx, ay - 8); pop();
    }
    // ---- playhead ------------------------------------------
    const px = DeepTime.yearToX(yr, x0, w);
    stroke(255, 210, 120, 130); strokeWeight(1); line(px, ay - 14, px, upY + upH + 2);
    noStroke(); fill(255, 210, 120); circle(px, ay, 9);
    // ---- fast-forward --------------------------------------
    if (DeepTime.isDeep()) {
      noStroke(); fill(255, 210, 120); textAlign(RIGHT, TOP); textSize(15);
      push(); textFont(FreckleFace);
      text('>> x' + DeepTime.timeScale.toFixed(1), x0 + w, 12); pop();
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
      noStroke(); fill(on ? color(255, 226, 160) : color(220, 235, 225));
      textAlign(CENTER, CENTER);
      push(); textFont(FreckleFace); textSize(20);
      text(b.label, bx + bw / 2, by + bh - 24); pop();
      fill(120, 140, 130); textAlign(LEFT, TOP); textSize(12);
      push(); textFont(OpenDyslexic); text(b.key, bx + 8, by + 6); pop();
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
    } else if (id === 'growth') {
      noFill(); stroke(c); strokeWeight(3); line(cx, cy + 10, cx, cy - 8);
      fill(c); noStroke();
      ellipse(cx - 6, cy, 10, 6); ellipse(cx + 6, cy - 4, 10, 6); circle(cx, cy - 10, 6);
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

  // Photosensitivity: a single sine ramp up and back down over ashMillis.
  // No hard cut, no strobe. TEMANAWA_BUILD_V3.md §3 sets the rule this must
  // satisfy — max 3 luminance transitions per second, large-area changes
  // ramped over >=500 ms. At ashMillis 1600 this is one transition per press.
  renderAshFlash(g, W, H) {
    if (!(g._tmAshUntil && millis() < g._tmAshUntil)) return;
    const p = 1 - (g._tmAshUntil - millis()) / TM_TIME.ashMillis;
    const a = Math.sin(Math.max(0, Math.min(1, p)) * Math.PI) * 205;
    push(); noStroke(); fill(205, 202, 196, a); rect(0, 0, W, H); pop();
  }
};