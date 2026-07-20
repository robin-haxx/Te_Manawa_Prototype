// ============================================================
// TE MANAWA — INSTALLATION LAYER (Phase 1: ambient mode + HUD)
// ------------------------------------------------------------
// Turns the forked Mauri game into the ambient museum piece WITHOUT
// editing the large engine files: it monkey-patches Game / GameUI.
// So this script MUST load AFTER TeManawa_sketch.js (Game/GameUI
// must already be defined).
//
// What it does:
//   * forces the full-bleed fullscreen map (no sidebar)
//   * replaces the Mauri HUD with a deep-time TIMELINE (top) and
//     FOUR BUTTONS (bottom); removes mauri/season/toolbar/goals
//   * no win/lose/pause — the ecosystem just runs
//   * time model: 500 sim-years per second (≈10.7 min for 345→25 ka);
//     the Deep-time button runs 10x for 10s (= 50,000 years / 10s)
//   * buttons work by touch/mouse AND keys 1-4 (so physical buttons
//     can be mapped to those keys later, freeing the screen)
//
// Tunables are on window.TM_TIME (e.g. set yrPerSec = 444 for exactly
// 12 minutes end to end).
// ============================================================

(function () {
  if (typeof Game === 'undefined' || typeof GameUI === 'undefined') {
    console.error('[TeManawa] install layer: Game/GameUI not defined — load this AFTER TeManawa_sketch.js');
    return;
  }

  // ---- time / sequence model -------------------------------
  const TM = {
    yearsStart: 345000,   // run opens just after the Whakamaru eruption
    yearsEnd:   25000,    // ...and closes near the Oruanui eruption
    yrPerSec:   500,      // baseline sim-years per real second (timeScale 1)
    deepMult:   10,       // Deep-time button multiplier
    deepSeconds: 10,      // ...held for this many real seconds (10x10s = 50 ky)
    stormSeconds: 20,     // predators stalled for ~this long
    growthSeconds: 8,     // growth pulse sustains for ~this long
    ashMillis: 1600,      // eruption ash flash (ramped, seizure-safe)
    fps: 60
  };
  window.TM_TIME = TM;

  const yearsBP = (g) => {
    const secs = (g.playTime || 0) / TM.fps;              // effective seconds
    return Math.max(TM.yearsEnd, Math.min(TM.yearsStart, TM.yearsStart - secs * TM.yrPerSec));
  };
  const yearToX = (yr, x0, w) =>
    x0 + ((TM.yearsStart - yr) / (TM.yearsStart - TM.yearsEnd)) * w;

  // ---- button actions --------------------------------------
  function pressDeep(g)   { g._tmDeepUntil   = millis() + TM.deepSeconds * 1000; }
  function pressGrowth(g) { g._tmGrowthUntil = millis() + TM.growthSeconds * 1000; }
  // Storm = a thunderstorm placeable whose radius covers the whole play area,
  // with no visual of its own. Mirrors HaastsEagle.checkStorms(): only eagles
  // that are actually HUNTING get broken off. Re-applied every frame while the
  // window is open, so hunts that start mid-storm are interrupted too.
  function pressStorm(g) {
    g._tmStormUntil = millis() + TM.stormSeconds * 1000;
    initStormCells(g);
  }

  function applyStormDistraction(g) {
    const eagles = g.simulation && g.simulation.eagles;
    if (!eagles) return;
    for (let i = 0; i < eagles.length; i++) {
      const e = eagles[i];
      if (!e || !e.alive) continue;
      if (e.distractedTimer > 0) continue;  // already distracted (as checkStorms does)
      if (!e.hunting) continue;             // storms only break an active hunt
      // beDistracted() zeroes the timer unless distractedBy is a LIVE object with
      // a pos, so hand it an invisible stand-in for the storm cell. Anchor it just
      // off each bird rather than a shared centre, which would clump every eagle.
      const a = Math.random() * Math.PI * 2;
      e.distractedBy = {
        alive: true,
        pos: { x: e.pos.x + Math.cos(a) * 40, y: e.pos.y + Math.sin(a) * 40 }
      };
      e.distractedTimer = 180;              // same dose the placeable gives
      e.hunting = false;
      e.target = null;
      e.huntSearchTimer = 0;
    }
  }

  // ---- storm visuals: thunderheads scattered across the whole play area ----
  // Same look as the Storm placeable (_initThunderstorm / _renderThunderstorm in
  // TeManawa_placeable.js), just spread over the map instead of one cluster.
  // These are purely cosmetic; the distraction above is driven separately.
  // Positions are MAP coords, projected through the view transform when drawn.
  const STORM_CLOUDS = 14;

  function initStormCells(g) {
    const t = g.terrain;
    if (!t) { g._tmStormCells = null; return; }
    const cells = [];
    for (let i = 0; i < STORM_CLOUDS; i++) {
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
  }

  function updateStormCells(g, dt) {
    const t = g.terrain, cells = g._tmStormCells;
    if (!t || !cells) return;
    const pad = 48;
    for (let i = 0; i < cells.length; i++) {
      const c = cells[i];
      c.x += c.vx * dt; c.y += c.vy * dt; c.bobPhase += c.bobSpeed * dt;
      // wrap, so the storm keeps covering the map for its whole duration
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
  }

  // Fade in/out so the storm doesn't pop on or off.
  function stormEnvelope(g) {
    const remain = g._tmStormUntil - millis();
    if (remain <= 0) return 0;
    const elapsed = TM.stormSeconds * 1000 - remain;
    return Math.max(0, Math.min(1, Math.min(elapsed / 600, remain / 800)));
  }

  function pressReset(g) {
    g._tmAshUntil = millis() + TM.ashMillis;
    if (g.currentLevel) g.loadLevel(g.currentLevel.id);   // re-inits, playTime -> 0
  }

  const BUTTONS = [
    { id: 'deep',   key: '1', label: '50,000 YEARS', sub: '',      action: pressDeep,
      isActive: (g) => g._tmDeepUntil   && millis() < g._tmDeepUntil },
    { id: 'growth', key: '2', label: 'GROWTH',    sub: '', action: pressGrowth,
      isActive: (g) => g._tmGrowthUntil && millis() < g._tmGrowthUntil },
    { id: 'storm',  key: '3', label: 'STORM',     sub: '',  action: pressStorm,
      isActive: (g) => g._tmStormUntil  && millis() < g._tmStormUntil },
    { id: 'reset',  key: '4', label: 'ERUPTION',  sub: '',     action: pressReset,
      isActive: (g) => g._tmAshUntil    && millis() < g._tmAshUntil }
  ];
  window.TM_BUTTONS = BUTTONS;

  // ==========================================================
  // UPDATE WRAP — ambient init, deep-time speed, growth pulse,
  // and "always playing" (no win/lose/pause screens).
  // ==========================================================
  const _origUpdate = Game.prototype.update;
  Game.prototype.update = function (dt) {
    if (dt === undefined) dt = 1;

    // One-time ambient setup once the level's terrain/sim exist.
    if (!this._tmReady && this.terrain && this.simulation) {
      CONFIG.fullscreen = true;
      this._updateViewTransform();
      this.timeScale = 1;
      this._tmReady = true;
    }

    // Deep-time fast-forward.
    const deep = this._tmDeepUntil && millis() < this._tmDeepUntil;
    this.timeScale = deep ? TM.deepMult : 1;

    // Growth pulse: nudge living plants toward full while active.
    if (this._tmGrowthUntil && millis() < this._tmGrowthUntil && this.simulation) {
      const plants = this.simulation.plants;
      if (plants) for (let i = 0; i < plants.length; i++) {
        const p = plants[i];
        if (p && p.alive && p.growth < 1) p.growth = Math.min(1, p.growth + 0.02);
      }
    }

    // Storm: map-wide hunt-breaker + drifting thunderheads while the window is open.
    if (this._tmStormUntil && millis() < this._tmStormUntil) {
      applyStormDistraction(this);
      updateStormCells(this, dt);
    }

    _origUpdate.call(this, dt * (this.timeScale || 1));

    // Ambient installation: never sit in a paused / won / lost state.
    if (this.state !== GAME_STATE.PLAYING) this.state = GAME_STATE.PLAYING;
  };

  // ==========================================================
  // KEY WRAP — keys 1..4 fire the four buttons (map physical
  // buttons to these later); everything else falls through.
  // ==========================================================
  const _origKey = Game.prototype.handleKey;
  Game.prototype.handleKey = function (k) {
    for (const b of BUTTONS) if (k === b.key) { b.action(this); return; }
    if (_origKey) return _origKey.call(this, k);
  };

  // ==========================================================
  // HUD — replaces renderFullscreenOverlay (the Mauri fullscreen HUD)
  // ==========================================================
  GameUI.prototype.renderFullscreenOverlay = function () {
    const g = this.game;
    const W = this.config.canvasWidth, H = this.config.canvasHeight;
    drawStorm(g, W, H);          // sits under the HUD strips
    drawTimeline(this, g, W, H);
    drawButtons(this, g, W, H);
    drawAshFlash(g, W, H);
  };

  const TOP_H = 88, BOT_H = 132;

  function drawTimeline(ui, g, W, H) {
    const yr = yearsBP(g);
    push();
    // strip
    noStroke(); fill(14, 21, 19, 205); rect(0, 0, W, TOP_H);
    // big current-year readout
    fill(232, 240, 236); textAlign(CENTER, TOP);
    push(); textFont(GroceryRounded); textSize(24);
    text('~ ' + (Math.round(yr / 1000) * 1000).toLocaleString() + ' years ago', W / 2, 8); pop();

    // axis
    const x0 = 48, w = W - 96, ay = TOP_H - 22;
    stroke(120, 140, 130); strokeWeight(2); line(x0, ay, x0 + w, ay);

    // event ticks
    const marks = [
      { yr: 345000, t: 'Whakamaru' },
      { yr: 125000, t: 'MIS 5e' },
      { yr: 25000,  t: 'Oruanui' }
    ];
    textAlign(CENTER, BOTTOM); textSize(11);
    for (const m of marks) {
      const mx = yearToX(m.yr, x0, w);
      stroke(120, 140, 130); strokeWeight(2); line(mx, ay - 5, mx, ay + 5);
      noStroke(); fill(150, 170, 160);
      push(); textFont(OpenDyslexic); text(m.t, mx, ay - 7); pop();
    }

    // playhead
    const px = yearToX(yr, x0, w);
    stroke(255, 210, 120); strokeWeight(2); line(px, 30, px, ay + 8);
    noStroke(); fill(255, 210, 120); circle(px, ay, 12);

    // fast-forward indicator
    if (g._tmDeepUntil && millis() < g._tmDeepUntil) {
      noStroke(); fill(255, 210, 120); textAlign(RIGHT, TOP); textSize(16);
      push(); textFont(GroceryRounded); text('>> x' + TM.deepMult, W - 16, 12); pop();
    }
    pop();
  }

  function drawButtons(ui, g, W, H) {
    const n = BUTTONS.length, m = 24, gap = 18;
    const bw = (W - 2 * m - (n - 1) * gap) / n, bh = BOT_H - 30, by = H - BOT_H + 16;
    push();
    noStroke(); fill(14, 21, 19, 210); rect(0, H - BOT_H, W, BOT_H);
    ui._tmButtons = [];
    for (let i = 0; i < n; i++) {
      const b = BUTTONS[i], bx = m + i * (bw + gap), on = b.isActive(g);
      // body
      if (on) { fill(58, 48, 24, 240); stroke(255, 210, 120); strokeWeight(3); }
      else    { fill(30, 44, 38, 225); stroke(70, 110, 80); strokeWeight(1.5); }
      rect(bx, by, bw, bh, 12);
      // icon + labels
      drawIcon(b.id, bx + bw / 2, by + 30, on);
      noStroke(); if (on) fill(255, 226, 160); else fill(220, 235, 225);
      textAlign(CENTER, CENTER);
      push(); textFont(GroceryRounded); textSize(20); text(b.label, bx + bw / 2, by + bh - 30); pop();
      fill(150, 170, 160); textSize(12);
      push(); textFont(OpenDyslexic); text(b.sub, bx + bw / 2, by + bh - 12); pop();
      // key hint
      fill(120, 140, 130); textAlign(LEFT, TOP); textSize(12);
      push(); textFont(OpenDyslexic); text(b.key, bx + 8, by + 6); pop();
      ui._tmButtons.push({ x: bx, y: by, w: bw, h: bh, def: b });
    }
    pop();
  }

  function drawIcon(id, cx, cy, on) {
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
      beginShape(); vertex(cx + 1, cy + 2); vertex(cx - 4, cy + 9); vertex(cx + 2, cy + 9); vertex(cx - 3, cy + 15); endShape();
    } else if (id === 'reset') {
      fill(150, 150, 150); noStroke();
      quad(cx - 12, cy + 10, cx - 5, cy - 8, cx + 5, cy - 8, cx + 12, cy + 10);
      fill(240, 120, 60); ellipse(cx, cy - 9, 14, 8);
      fill(200, 90, 50); circle(cx - 7, cy - 13, 4); circle(cx + 6, cy - 15, 5); circle(cx, cy - 19, 4);
    }
    pop();
  }

  function drawStorm(g, W, H) {
    if (!(g._tmStormUntil && millis() < g._tmStormUntil)) return;
    const t = g.terrain, cells = g._tmStormCells;
    if (!t) return;
    const env = stormEnvelope(g);
    if (env <= 0) return;

    // project map coords -> screen through the active view transform
    const zx = CONFIG.viewX, zy = CONFIG.viewY, z = CONFIG.viewZoom;
    const mw = t.mapWidth * z, mh = t.mapHeight * z;
    if (mw <= 0 || mh <= 0) return;

    push();
    // rain streaks, confined to the map rectangle
    stroke(150, 170, 210, 90 * env);
    strokeWeight(2);
    const tt = millis() * 0.5;
    for (let i = 0; i < 70; i++) {
      const x = zx + ((i * 137 + tt) % mw);
      const y = zy + ((i * 83 + tt * 1.7) % mh);
      line(x, y, x - 6, y + 14);
    }

    // thunderheads + occasional bolt (same treatment as the Storm placeable)
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
  }

  function drawAshFlash(g, W, H) {
    if (!(g._tmAshUntil && millis() < g._tmAshUntil)) return;
    const p = 1 - (g._tmAshUntil - millis()) / TM.ashMillis; // 0..1
    const a = Math.sin(Math.max(0, Math.min(1, p)) * Math.PI) * 205; // ramp up then down (no strobe)
    push(); noStroke(); fill(205, 202, 196, a); rect(0, 0, W, H); pop();
  }

  // ==========================================================
  // CLICK — the four buttons; consume clicks on the HUD strips.
  // ==========================================================
  GameUI.prototype.handleFullscreenClick = function (mx, my) {
    const btns = this._tmButtons || [];
    for (const b of btns) {
      if (mx > b.x && mx < b.x + b.w && my > b.y && my < b.y + b.h) { b.def.action(this.game); return true; }
    }
    const H = this.config.canvasHeight;
    if (my < TOP_H || my > H - BOT_H) return true; // swallow strip clicks
    return false;
  };

  console.log('[TeManawa] installation layer active — ambient mode, deep-time timeline, 4 buttons (keys 1-4).');
})();
