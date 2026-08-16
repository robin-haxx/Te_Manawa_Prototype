// ============================================================
// TE MANAWA — INSTALLATION HUD
// ------------------------------------------------------------
// The deep-time timeline (top), the five buttons (bottom), and the
// world-space effects the buttons produce. Game and GameUI call into it directly.
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
  // STORM overuse. Each press adds pressure that decays every frame; while it sits
  // above the overuse line the kererū stay grounded BETWEEN storms and recruitment stalls, so
  // SPAMMING storm desaturates while a single press stays cheap.
  stormPressureAdd:   0.40,   // pressure a single press adds (0..1) — ~2 quick presses cross the line
  stormPressureDecay: 0.999,  // per-frame decay (τ ≈ 17 s at 60 fps): one press bleeds off, spamming stacks
  stormOveruseAt:     0.55,   // pressure above this = overuse (chronic grounding + recruitment stall)
  growWarmSeconds:  8,    // forest growth pulse (interglacial-suited) — button 2
  growColdSeconds:  8,    // open-country growth pulse (glacial-suited) — button 3
  ashMillis:   1600,      // ramped ash flash — seizure-safe, see renderAshFlash
  ashPeak:      205,      // flash alpha at the peak (kept < 255 for headroom)
  erCooldownMs: 2000,     // minimum gap between eruptions — the anti-spam limit
  erLongPressMs: 3000,    // hold the eruption button this long to reseed the land
  // ---- eruption takeover: screen shake + the ash-cloud cover (see renderAshCloud /
  // eruptionShakeOffset). Armed by _ashCloudUntil from BOTH the button (fireEruption/
  // fireEruptionReseed) and an auto/timeline eruption (Game._fireEruptionInPlace), so a
  // volcanic event on the clock shows the same rumble + cloud. On the button it also hides
  // the soft-regen hitch; the auto path has no regen, so there it is pure spectacle.
  erShakeMaxPx:  5,       // peak screen-shake amplitude (1080-space px); ~×1.5 at the crest
  cloudMillis: 1900,      // ash-cloud takeover length after the land regenerates (hang + fade)
  cloudRollFrac: 0.30,    // a tap's share of cloudMillis spent rolling the cloud DOWN (>=500ms)
  cloudHangFrac: 0.22,    // share spent HANGING at full cover before the fade begins
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

// The ambient colour band that frames the scene at all times — the on-screen twin of the
// physical button LEDs on the wall. HUE tracks the CLIMATE (deep green interglacial → light
// blue glacial), so the band always reads the "temperature" of the sim. SATURATION tracks
// HABITAT HEALTH — an eruption, a wrong FOREST/TUSSOCK press, or storm overuse all drain it
// toward grey (the same signal that quietly desaturates the ground, Game._habitatHealth).
// The colour is low-passed and breathes on a slow sine so it EBBS rather than snaps: the
// pulse is small and the slew gentle, keeping it inside the photosensitivity budget
// (CLAUDE.md — ≤3 luminance transitions/s, large changes ramped ≥500 ms). Console-tunable
// like TM_TIME / LOOK.
const TM_EDGE = {
  depth:      110,          // how far the glow reaches in from each edge (1080-space px)
  baseAlpha:  0.62,         // peak edge opacity, at mid-breath
  breatheAmp: 0.16,         // ± share of baseAlpha the breathing adds/removes
  breatheMs:  5200,         // one full breath, ms (slow — an ebb, not a flicker)
  colorEase:  0.010,        // per-frame low-pass of the band colour toward target (the latency)
  desatMax:   0.80,         // health=0 → colour blended this far toward neutral grey (keeps a little hue)
  warm: [40, 140, 74],      // interglacial peak — deep green
  cold: [150, 205, 236],    // glacial peak — light blue
  grey: [122, 130, 132]     // the neutral the band desaturates toward
};
window.TM_EDGE = TM_EDGE;

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
    // GROWTH is split in two: the RIGHT one depends on the climate. FOREST grows
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
                       g._stormPressure = Math.min(1, (g._stormPressure || 0) + TM_TIME.stormPressureAdd);
                       if (g.applyStormToPlants) g.applyStormToPlants(1);   // §10B–C habitat effects: snap emergents, salt-burn/bury the coast
                       InstallHUD.initStormCells(g); },
      isActive: (g) => g._tmStormUntil  && millis() < g._tmStormUntil },
    // Eruption is a press-and-hold TIME-NAVIGATION control between the volcanic events.
    // A TAP reverts to the previous (older) eruption and replays it; a HOLD
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
  // cleared state. Ash flash + Game.applyEruptionAt does the seek/morph/clear.
  // No-op at/older than the first event (prevEruption null). Swallowed inside the cooldown
  // so the button cannot be spammed into a flash strobe.
  fireEruption(g) {
    const now = millis();
    if (now < (g._tmErCooldownUntil || 0)) return false;
    const y = (typeof DeepTime !== 'undefined') ? DeepTime.prevEruption(DeepTime.yearsBP) : null;
    if (y == null) return false;                   // nothing older to revert to
    g._tmAshUntil = now + TM_TIME.ashMillis;
    g._tmAshMode  = 'tap';                         // flash rises and falls
    g._ashCloudUntil = now + TM_TIME.cloudMillis;  // the sprite cover: quick roll-in, hang, fade
    g._ashCloudMode  = 'tap';
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
    g._ashCloudUntil = now + TM_TIME.cloudMillis;   // cloud already rolled DOWN over the hold; now hang + fade
    g._ashCloudMode  = 'hold';
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

    // Storm-overuse pressure: each STORM press adds pressure (button action); it
    // decays here every frame on the REAL dt. Above the overuse line the kererū stay grounded
    // BETWEEN storms (Kereru.behave reads g._stormOveruse) and recruitment stalls
    // (Game._updateHabitatHealth), so SPAMMING storm desaturates while one press stays cheap.
    if (g._stormPressure > 0) {
      g._stormPressure *= Math.pow(TM_TIME.stormPressureDecay, dt);
      if (g._stormPressure < 1e-3) g._stormPressure = 0;
    }
    g._stormOveruse = (g._stormPressure || 0) > TM_TIME.stormOveruseAt;

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

  applyStormDistraction(g) {
    const eagles = g.simulation && g.simulation.eagles;
    if (!eagles) return;
    for (let i = 0; i < eagles.length; i++) {
      const e = eagles[i];
      if (!e || !e.alive) continue;
      if (e.distractedTimer > 0) continue;
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

  // The shared timeline body — the deep-time axis, the monotonic uplift wedge, the two
  // eruption markers and the playhead — drawn relative to an axis line at `ay`. Both the
  // debug (top) and visitor (bottom) timelines call this, so the two can never drift apart;
  // each caller owns its own strip background, year and fast-forward badge. Assumes an
  // active push().
  _timelineBody(g, x0, w, ay) {
    const yr = DeepTime.yearsBP;
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
  },

  // DEBUG timeline — the original top strip: dark bar, the small year, the shared body and
  // the fast-forward badge. Shown only with the debug overlay; visitors get the bottom
  // strip (renderVisitorTimeline) + the large lowered year (renderVisitorYear) instead.
  renderTimeline(ui, g, W, H) {
    const x0 = 48, w = W - 96;
    push();
    noStroke(); fill(14, 21, 19, 205); rect(0, 0, W, this.TOP_H);
    this._blitText(DeepTime.label(), FreckleFace, 'freckle', 26, CENTER, TOP, W / 2, 10, [232, 240, 236]);
    this._timelineBody(g, x0, w, this.TOP_H - 30);
    if (DeepTime.isDeep()) {
      this._blitText('>> x' + DeepTime.timeScale.toFixed(1), FreckleFace, 'freckle', 15, RIGHT, TOP, x0 + w, 12, [255, 210, 120]);
    }
    pop();
  },

  // VISITOR timeline — the deep-time axis relocated to a thin strip at the bottom (the top
  // of where the buttons used to sit). The year is NOT drawn here; it floats larger and
  // higher via renderVisitorYear. On the wall the five buttons are physical, so their
  // on-screen twins only appear in debug — this is the clean, uncluttered visitor layout.
  VIS_STRIP_H: 64,
  renderVisitorTimeline(g, W, H) {
    const x0 = 48, w = W - 96;
    const stripH = this.VIS_STRIP_H, yTop = H - stripH, ay = yTop + 34;
    push();
    noStroke(); fill(14, 21, 19, 165); rect(0, yTop, W, stripH);
    this._timelineBody(g, x0, w, ay);
    if (DeepTime.isDeep()) {
      this._blitText('>> x' + DeepTime.timeScale.toFixed(1), FreckleFace, 'freckle', 15, RIGHT, BOTTOM, x0 + w, yTop + 16, [255, 210, 120]);
    }
    pop();
  },

  // VISITOR year — the one always-on readout, large and lowered to float over the northern
  // forest (the spot the design brief marks). A soft dark halo keeps it legible over the
  // busy scene; no strip behind it, since the scene runs to the top edge in visitor mode.
  VIS_YEAR_SIZE: 50,
  VIS_YEAR_Y: 0.11,          // vertical centre, as a fraction of canvas height
  renderVisitorYear(g, W, H) {
    const label = DeepTime.label();
    const cx = W / 2, cy = Math.round(H * this.VIS_YEAR_Y);
    push();
    this._blitText(label, FreckleFace, 'freckle', this.VIS_YEAR_SIZE, CENTER, CENTER, cx + 2, cy + 3, [8, 14, 12, 170]);
    this._blitText(label, FreckleFace, 'freckle', this.VIS_YEAR_SIZE, CENTER, CENTER, cx, cy, [236, 244, 240]);
    pop();
  },

  // The ambient colour band framing the scene at all times (TM_EDGE). Hue by climate,
  // saturation by habitat health, low-passed + breathing so it ebbs. The four edge
  // gradients are cached and rebuilt only when the quantised colour (or the canvas size)
  // changes, so the per-frame cost is a save + four fillRects — no allocation in draw().
  _edgeCache: null,
  renderEdgeGlow(g, W, H) {
    const E = (typeof TM_EDGE !== 'undefined') ? TM_EDGE : null;
    const dc = (typeof drawingContext !== 'undefined') ? drawingContext : null;
    if (!E || !dc || !dc.createLinearGradient) return;

    // --- target colour: hue by climate (glacial index), desaturation by habitat health ---
    const gi = (typeof DeepTime !== 'undefined' && DeepTime.climate)
      ? Math.max(0, Math.min(1, DeepTime.climate().glacialIndex || 0)) : 0;
    const health = (g._habitatHealth == null) ? 1 : Math.max(0, Math.min(1, g._habitatHealth));
    let tr = E.warm[0] + (E.cold[0] - E.warm[0]) * gi;
    let tg = E.warm[1] + (E.cold[1] - E.warm[1]) * gi;
    let tb = E.warm[2] + (E.cold[2] - E.warm[2]) * gi;
    const blend = (1 - health) * E.desatMax;              // toward neutral grey as health falls
    tr += (E.grey[0] - tr) * blend;
    tg += (E.grey[1] - tg) * blend;
    tb += (E.grey[2] - tb) * blend;

    // --- low-pass the band colour on the game object → the latency / ebb the brief asks for ---
    if (g._edgeR == null) { g._edgeR = tr; g._edgeG = tg; g._edgeB = tb; }
    const k = E.colorEase;
    g._edgeR += (tr - g._edgeR) * k;
    g._edgeG += (tg - g._edgeG) * k;
    g._edgeB += (tb - g._edgeB) * k;
    const r = g._edgeR | 0, gg = g._edgeG | 0, b = g._edgeB | 0;

    // --- (re)build the four edge gradients only when the quantised colour / size changes ---
    const depth = E.depth;
    const key = r + ',' + gg + ',' + b;
    let c = this._edgeCache;
    if (!c || c.key !== key || c.W !== W || c.H !== H || c.depth !== depth) {
      // A hot inner rim (the base colour lightened) fades to the base colour and then to
      // nothing — reads like a lit LED bezel rather than a flat wash.
      const hotR = Math.min(255, r + 55), hotG = Math.min(255, gg + 55), hotB = Math.min(255, b + 55);
      const mk = (x0, y0, x1, y1) => {
        const grd = dc.createLinearGradient(x0, y0, x1, y1);
        grd.addColorStop(0,    'rgba(' + hotR + ',' + hotG + ',' + hotB + ',1)');
        grd.addColorStop(0.16, 'rgba(' + r + ',' + gg + ',' + b + ',0.88)');
        grd.addColorStop(1,    'rgba(' + r + ',' + gg + ',' + b + ',0)');
        return grd;
      };
      c = this._edgeCache = {
        key, W, H, depth,
        top:    mk(0, 0, 0, depth),
        bottom: mk(0, H, 0, H - depth),
        left:   mk(0, 0, depth, 0),
        right:  mk(W, 0, W - depth, 0)
      };
    }

    // --- breathing opacity: one slow sine, small amplitude (an ebb, never a flicker) ---
    const now = (typeof millis === 'function') ? millis() : 0;
    const breath = Math.sin((now / E.breatheMs) * Math.PI * 2);
    const alpha = Math.max(0, E.baseAlpha * (1 + E.breatheAmp * breath));

    dc.save();
    dc.globalAlpha = alpha;
    dc.fillStyle = c.top;    dc.fillRect(0, 0, W, depth);
    dc.fillStyle = c.bottom; dc.fillRect(0, H - depth, W, depth);
    dc.fillStyle = c.left;   dc.fillRect(0, 0, depth, H);
    dc.fillStyle = c.right;  dc.fillRect(W - depth, 0, depth, H);
    dc.restore();
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
  },

  // ==========================================================
  // ERUPTION TAKEOVER — screen shake + the rolling ash cover
  // ----------------------------------------------------------
  // Driven by the hold charge (_tmErDownAt) and the post-fire cover window
  // (_ashCloudUntil). The button arms _ashCloudUntil (fireEruption/fireEruptionReseed);
  // so does an auto/timeline eruption (Game._fireEruptionInPlace), so a volcanic event on
  // the clock gets the same rumble + ash-cloud sprite as a button press. Only the hold
  // CHARGE (the pre-fire roll-down) stays button-exclusive — the auto path has no gesture.
  // ==========================================================

  // Camera jitter for Game.render() to translate() the whole frame by. Builds as the
  // hold charges (so a press-and-hold visibly rumbles toward the reseed), peaks at the
  // fire, then decays through the takeover. Two out-of-phase sines per axis => an
  // organic rattle, not a buzz. Squared envelope: gentle until the hold really commits.
  // Returns null when idle (Game.render skips the translate). No allocation on the idle
  // path; one tiny literal only while an eruption is live.
  eruptionShakeOffset(g) {
    const now = millis();
    let s = 0;
    if (g._tmErDownAt && !g._tmErFired) {
      s = Math.max(s, Math.min(1, (now - g._tmErDownAt) / TM_TIME.erLongPressMs));
    }
    if (g._ashCloudUntil && now < g._ashCloudUntil) {
      s = Math.max(s, (g._ashCloudUntil - now) / TM_TIME.cloudMillis);   // 1 at the fire -> 0 at the end
    }
    if (s <= 0) return null;
    const amp = TM_TIME.erShakeMaxPx * s * s;
    return { x: Math.sin(now * 0.043) * amp + Math.sin(now * 0.101) * amp * 0.5,
             y: Math.cos(now * 0.055) * amp + Math.sin(now * 0.087) * amp * 0.5 };
  },

  // The cover's descent (0 = off the top, 1 = fully down) and opacity (0..1), or null
  // when there is no cover to draw. HOLD: the cloud rolls DOWN across the 3 s charge
  // (descend = charge progress), so it is already covering when the reseed hitch lands
  // at c=1 — the stutter is hidden. It then hangs and fades over cloudMillis. TAP: no
  // charge, so the whole roll-in + hang + fade plays inside cloudMillis.
  ashCoverState(g, now) {
    let descend = -1, alpha = 0;
    if (g._tmErDownAt && !g._tmErFired) {                 // rolling down while the hold charges
      const c = Math.max(0, Math.min(1, (now - g._tmErDownAt) / TM_TIME.erLongPressMs));
      descend = c; alpha = Math.min(1, c * 1.4);
    }
    if (g._ashCloudUntil && now < g._ashCloudUntil) {     // post-fire hang + fade (both gestures)
      const p = Math.max(0, Math.min(1, 1 - (g._ashCloudUntil - now) / TM_TIME.cloudMillis));
      const hang = TM_TIME.cloudHangFrac;
      if (g._ashCloudMode === 'hold') {                   // already down from the charge
        descend = 1;
        alpha = Math.max(alpha, p < hang ? 1 : 1 - (p - hang) / (1 - hang));
      } else {                                            // tap: roll in, hang, then fade
        const roll = TM_TIME.cloudRollFrac;
        descend = Math.max(descend, Math.min(1, p / roll));
        let a;
        if (p < roll)             a = p / roll;
        else if (p < roll + hang) a = 1;
        else                      a = 1 - (p - roll - hang) / Math.max(1e-3, 1 - roll - hang);
        alpha = Math.max(alpha, a);
      }
    }
    if (descend < 0 || alpha <= 0) return null;
    return { descend, alpha: Math.max(0, Math.min(1, alpha)) };
  },

  // The ash cloud itself: one sprite, screen-wide, scrolling down from above. At full
  // descent its TOP sits at the screen top and its (taller-than-screen) BOTTOM has run off
  // the bottom, so the view is totally covered — then it fades to reveal the new land.
  // No-op until the PNG has actually loaded (guards the not-yet-added asset and the harness).
  renderAshCloud(g, W, H) {
    const img = (typeof placeableSprites !== 'undefined') ? placeableSprites.ashCloud : null;
    if (!img || !img.width) return;
    const st = this.ashCoverState(g, millis());
    if (!st) return;
    const iw = W;
    let ih = W * (img.height / img.width);
    if (ih < H * 1.05) ih = H * 1.05;                     // guarantee the cover even if the art is short
    // easeOut the descent so the roll settles; iy runs -ih (above) -> 0 (top at screen top).
    const d = 1 - (1 - st.descend) * (1 - st.descend);
    const iy = ih * (d - 1);
    push();
    imageMode(CORNER);
    noTint();
    const _dc = drawingContext;
    const oldA = _dc.globalAlpha;
    _dc.globalAlpha = st.alpha;
    image(img, -8, iy, iw + 16, ih);                     // slight side overscan so the shake never bares an edge
    _dc.globalAlpha = oldA;
    pop();
  }
};