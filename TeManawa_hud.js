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
  stormCloudAnim:  0.07,  // thunderhead cel cadence (frame = floor(animTime·this)); a slow, non-flashing churn
  // A lightning cloud FADES in, holds, and fades out (frames @ ~60 fps) instead of blinking on for a
  // handful of frames; the ramps keep it a slow luminance change (≥500 ms, the photosensitivity rule).
  stormBoltFadeIn:  30,
  stormBoltHold:    30,
  stormBoltFadeOut: 42,
  growWarmSeconds:  8,    // forest growth pulse (interglacial-suited) — button 2
  growColdSeconds:  8,    // open-country growth pulse (glacial-suited) — button 3
  ashMillis:   1600,      // ramped ash flash — seizure-safe, see renderAshFlash
  ashPeak:      205,      // flash alpha at the peak (kept < 255 for headroom)
  erCooldownMs: 2000,     // minimum gap between eruptions — the anti-spam limit
  erLongPressMs: 4500,    // hold the eruption button this long to reseed the land. Also paces
                          // the whole long-press build-up (the cloud roll-down, the charge
                          // flash and the shake), so this is deliberately slow — a 50% longer
                          // build than the original 3000 ms, per the design chat.
  // ---- eruption takeover: screen shake + the ash-cloud cover (see renderAshCloud /
  // eruptionShakeOffset). Armed by _ashCloudUntil from BOTH the button (fireEruption/
  // fireEruptionReseed) and an auto/timeline eruption (Game._fireEruptionInPlace), so a
  // volcanic event on the clock shows the same rumble + cloud. On the button it also hides
  // the soft-regen hitch; the auto path has no regen, so there it is pure spectacle.
  erShakeMaxPx:  5,       // peak screen-shake amplitude (1080-space px); ~×1.5 at the crest
  // Ash-cloud takeover: one 1080p frame sequence (sprites/Environmental/VolcanicAsh/
  // VolcanicAsh_Cloud_*) played once at cloudFps. The 42 frames ARE the effect — they
  // rise from clear, blanket the screen, then dissipate — so the window length is just
  // the sequence length: 42 / 8 fps = 5250 ms. See renderAshCloud.
  cloudFps:      8,       // ash-cloud playback rate (frames/sec) — bumped 6→8 for a smoother cloud
  cloudMillis: 5250,      // = ASH_CLOUD_FRAMES (42) / cloudFps · 1000; keep the two in step
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
// neither press is a universal win. See md/archive/TEMANAWA_INTERACTION_HEALTH_PLAN.md §2.
const TM_GROW = { warmMax: 0.65, coldMin: 0.75, step: 0.02, seedCount: 6,   // seedCount: seedlings a press starts (Simulation.seedGrowth)
  // Kahikatea is NOT force-grown by the FOREST button (it's disturbance-governed — see
  // Plant.update). Instead the button ACCELERATES its lifecycle by this factor: a growing stand
  // grows faster, an aging one ages faster, a senescing one senesces (shrinks) faster. So the
  // press hurries a swamp-forest stand through whatever it is doing, rather than forcing growth
  // onto a stand that is meant to be shrinking.
  kahiLifecycleBoost: 3 };
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
  warm: [84, 120, 50],      // interglacial peak — a warmer, yellower, slightly LESS bright green (was [40,140,74])
  cold: [150, 205, 236],    // glacial peak — light blue
  grey: [122, 130, 132],    // the neutral the band desaturates toward
  // Hue CONTRAST: bias the climate index toward the extremes so the band reads DECISIVELY green
  // (interglacial → FOREST helps) or blue (glacial → TUSSOCK helps), with only a narrow ambiguous
  // middle. Without it a cooler interglacial sits in a mid-teal that sends mixed signals about which
  // boost is right. The flip is at index 0.5 — the same getWinterness≥0.5 split the boosts use. 1 = off.
  hueContrast:   2.4,
  // ---- interaction PULSE: a quick rim flash laid over the ambient band on a button press or a
  // lightning strike. Its COLOUR names the interaction (green FOREST, blue TUSSOCK, white STORM,
  // grey = wrong boost for the climate). A single smooth rise+fall, rate-limited so repeat
  // lightning can't strobe (photosensitivity).
  pulseMs:       700,            // one pulse (default): quick rise, slower fall
  pulseStormMs:  320,           // STORM's pulse is SHORTER — a quick lightning blink, not a lingering wash
  pulseStrength: 0.70,          // peak opacity of the pulse rim over the base band
  pulseMinGapMs: 500,           // a new pulse can't start sooner than this → ≤2/s, under the ≤3/s budget
  pulseForest:  [84, 210, 96],  // FOREST boost (matched) — green
  pulseTussock: [150, 205, 236],// TUSSOCK boost (matched) — glacial blue
  pulseWrong:   [128, 132, 130],// wrong boost for the current climate — neutral grey (and no growth happens)
  pulseStorm:   [255, 255, 255] // STORM press + each lightning strike — pure white
};
window.TM_EDGE = TM_EDGE;

// WIND — scattered gust sprites that stream West→East across the screen as a climate cue.
// It blows the WARM gust (interglacial, WindGust art) when the world turns interglacial or the
// FOREST boost is pressed, and the COLD chill (glacial, GlacialChill art) when it turns glacial
// or TUSSOCK is pressed — i.e. the wind of whichever regime the boost is FOR. A soft, slow,
// semi-transparent drift (no flashing) so it stays inside the photosensitivity budget. Positions
// are stored as fractions of the canvas so a resize is a no-op. Console-tunable.
const TM_WIND = {
  count:      8,       // gust sprites per burst ("several scattered"; fewer now they read bigger)
  speed:      0.0045,  // horizontal travel, fraction of canvas WIDTH per frame. Slow: a gust that
                       // crosses in ~4 s lets the eye track it and read its animation, where the old
                       // ~2 s dash was too fast to see — it just flickered ("glitching out").
  speedJitter:0.4,     // ± share of speed, per gust
  sizeFrac:   0.17,    // gust HEIGHT as a fraction of canvas height (width follows the art aspect).
                       // Bumped up: the old 0.11 read as small specks, especially at the jitter floor.
  sizeJitter: 0.30,    // ± share of size, per gust (trimmed so no gust shrinks back to a speck)
  yTop:       0.10,    // gusts scatter vertically between these fractions of canvas height
  yBottom:    0.82,    // (kept clear of the top year and bottom timeline)
  peakAlpha:  0.55,    // strongest opacity of a gust mid-screen
  bobAmp:     0.012,   // vertical bob amplitude, fraction of height
  bobSpeed:   0.05,    // bob phase advance per frame
  startSpread:0.30,    // gusts start staggered across this fraction just off the left edge
  minGapMs:   600,     // a new burst of the SAME kind can't start sooner than this (debounce presses)
  animSpeed:  0.12,    // gust cel cadence (frame = floor(anim·this)); the 11-frame art boomerangs (0→10→0, ping-pong)
  animSpeedJitter: 0.25 // ± share of animSpeed, PER GUST — some variation, but not so wide a gust cycles too fast to read
};
window.TM_WIND = TM_WIND;

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
      action: (g) => { g._tmGrowWarmUntil = millis() + TM_TIME.growWarmSeconds * 1000;   // timer set either way: lights the button + drives the regime-fit desaturation lesson
                       InstallHUD.beginWind(g, 'warm');                                   // the interglacial gust blows W→E on the FOREST boost
                       if (InstallHUD._growMatches(g, true)) {                            // right for the climate → it actually grows
                         DeepTime.boostsOk++;                                             // the top band's boost tally
                         if (g.simulation && g.simulation.liftGrowSet) g.simulation.liftGrowSet(true);   // the forest habitats hold a busier stock (homeostasis)
                         if (g.simulation && g.simulation.seedGrowth) g.simulation.seedGrowth(true, TM_GROW.seedCount);   // seed a few forest seedlings, not just mature
                         InstallHUD.edgePulse(g, TM_EDGE.pulseForest);                    // green rim pulse
                       } else {
                         if (g.simulation && g.simulation.resetHabitatLift) g.simulation.resetHabitatLift();   // wrong guess → every habitat back to its floor
                         InstallHUD.edgePulse(g, TM_EDGE.pulseWrong);                     // wrong boost for the climate → grey pulse, and no growth (gated in update)
                       } },
      isActive: (g) => g._tmGrowWarmUntil && millis() < g._tmGrowWarmUntil },
    { id: 'growCold', key: '3', label: 'TUSSOCK',
      action: (g) => { g._tmGrowColdUntil = millis() + TM_TIME.growColdSeconds * 1000;
                       InstallHUD.beginWind(g, 'cold');                                   // the glacial chill blows W→E on the TUSSOCK boost
                       if (InstallHUD._growMatches(g, false)) {
                         DeepTime.boostsOk++;
                         if (g.simulation && g.simulation.liftGrowSet) g.simulation.liftGrowSet(false);  // the open-country habitats hold a busier stock
                         if (g.simulation && g.simulation.seedGrowth) g.simulation.seedGrowth(false, TM_GROW.seedCount);   // seed a few open-country seedlings
                         InstallHUD.edgePulse(g, TM_EDGE.pulseTussock);                   // glacial-blue rim pulse
                       } else {
                         if (g.simulation && g.simulation.resetHabitatLift) g.simulation.resetHabitatLift();   // wrong guess → every habitat back to its floor
                         InstallHUD.edgePulse(g, TM_EDGE.pulseWrong);                     // grey pulse, no growth
                       } },
      isActive: (g) => g._tmGrowColdUntil && millis() < g._tmGrowColdUntil },
    { id: 'storm',  key: '4', label: 'STORM',
      action: (g) => { g._tmStormUntil  = millis() + TM_TIME.stormSeconds  * 1000;
                       g._stormPressure = Math.min(1, (g._stormPressure || 0) + TM_TIME.stormPressureAdd);
                       if (g.beginStorm) g.beginStorm();   // §10B–C habitat effects, but spread OVER the storm (staggered windthrow + gradual knockback), not one instant snap
                       InstallHUD.initStormCells(g);
                       InstallHUD.edgePulse(g, TM_EDGE.pulseStorm, TM_EDGE.pulseStormMs); },   // one short white blink on press, then one per lightning strike
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
  //
  // applyEruptionAt runs a SYNCHRONOUS terrain morph (blocks for seconds), so the flash AND the
  // ash-cloud cover are armed AFTER it returns, off a fresh millis(): otherwise the blocking bake
  // eats the wall-clock windows and the cover never plays (it would start mid-sequence, or be
  // wholly skipped). The screen is frozen on the last pre-fire frame across the bake, then the
  // flash rises/falls and the cover plays out over the recovered land.
  fireEruption(g) {
    const now = millis();
    if (now < (g._tmErCooldownUntil || 0)) return false;
    const y = (typeof DeepTime !== 'undefined') ? DeepTime.prevEruption(DeepTime.yearsBP) : null;
    if (y == null) return false;                   // nothing older to revert to
    g._tmErCooldownUntil = now + TM_TIME.erCooldownMs;
    if (typeof g.applyEruptionAt === 'function') g.applyEruptionAt(y, DeepTime.eruptionByYear(y));
    else if (typeof Kiosk !== 'undefined') Kiosk.resetToAttract(g, 'eruption', { reseed: false });
    const after = millis();                        // AFTER the synchronous morph — windows start now
    g._tmAshUntil = after + TM_TIME.ashMillis;
    g._tmAshMode  = 'tap';                          // flash rises and falls
    g._ashCloudUntil = after + TM_TIME.cloudMillis; // the 42-frame cover plays out over the fresh land
    g._ashCloudMode  = 'tap';
    return true;
  },

  // A long press: SKIP forward to the next (younger) eruption and fire its clearing (plan
  // §3.2); wraps to Kidnappers past Whakamaru — Oruanui is terminal (§3.5). The charge ramp in
  // renderAshFlash drove the flash to full while held, so the SYNCHRONOUS morph/reseed hitch
  // lands under a bright frozen frame; the flash + ash-cloud cover are then armed AFTER the bake
  // returns (fresh millis()) so their windows are not consumed by the freeze — the flash falls
  // from the charged peak and the full 42-frame cover plays over the reseeded land. Fired from
  // update() at the threshold.
  fireEruptionReseed(g) {
    const now = millis();
    g._tmErFired = true;                           // release must not also revert
    g._tmErCooldownUntil = now + TM_TIME.erCooldownMs;
    const y = (typeof DeepTime !== 'undefined') ? DeepTime.nextEruption(DeepTime.yearsBP) : null;
    if (y != null && typeof g.applyEruptionAt === 'function') g.applyEruptionAt(y, DeepTime.eruptionByYear(y));
    else if (typeof Kiosk !== 'undefined') Kiosk.resetToAttract(g, 'eruption-reseed', { reseed: true });
    const after = millis();                        // AFTER the synchronous morph/reseed
    g._tmAshUntil = after + TM_TIME.ashMillis;
    g._tmAshMode  = 'hold';                         // flash falls from the charged peak
    g._ashCloudUntil = after + TM_TIME.cloudMillis;
    g._ashCloudMode  = 'hold';
  },

  // Is a FOREST/TUSSOCK boost climate-appropriate right now? FOREST (warm) suits the
  // interglacial, TUSSOCK (cold) suits the glacial — the SAME getWinterness ≥ 0.5 split the
  // habitat-health regime-fit lesson uses (Game._updateHabitatHealth). A mismatched press does
  // not grow anything (the grow effects below and seedGrowth on press are gated on this) and
  // pulses the rim grey instead of its colour, so a wrong boost reads as wrong.
  _growMatches(g, warm) {
    const sm = g && g.seasonManager;
    const glacial = (sm && sm.getWinterness) ? sm.getWinterness() >= 0.5 : false;
    return warm ? !glacial : glacial;
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
    // The plant goal (TeManawa_goals.js): release a verdict once its time-lapse is over, re-pick the
    // live goal when the climate or the land changes. Off the draw path, allocation-free.
    if (typeof TMGoals !== 'undefined') TMGoals.update(g, nowMs);
    // Only the climate-appropriate boost matures cover; a wrong-climate press still lights the
    // button and drains regime fit (the desaturation lesson), but grows nothing (user request).
    // Gated per frame on the current climate, so a boost held across a phase flip stops growing.
    const warmBoosting = g._tmGrowWarmUntil && nowMs < g._tmGrowWarmUntil && this._growMatches(g, true);
    if (warmBoosting) this._growPulse(g, true);
    if (g._tmGrowColdUntil && nowMs < g._tmGrowColdUntil && this._growMatches(g, false)) this._growPulse(g, false);
    // Kahikatea is disturbance-governed, so the FOREST button never force-grows it (_growPulse
    // skips it). Instead, while a matched FOREST boost is held, it ACCELERATES the kahikatea
    // lifecycle: this shared per-frame factor (read in Simulation.updatePlantsBatched → Plant.update)
    // scales a kahikatea's grow / age / senesce all together, so a growing stand grows in faster and
    // a shrinking one dies out faster — the press speeds the process along instead of fighting it.
    g._kahiBoost = warmBoosting ? (TM_GROW.kahiLifecycleBoost ?? 3) : 1;

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

    // AUTO/timeline eruption ramp — INDEPENDENT of the button state machine. Game.
    // _checkAutoEruptions arms _tmAutoErAt as the clock crosses an event; its own timer drives
    // the SAME charge visuals (flash + rumble — renderAshFlash / eruptionShakeOffset both read
    // it), then it fires the event IN PLACE (no seek/reseed) with the flash falling from the
    // charged peak and the ash-cloud window opening (renderAshCloud). No _tmErDownAt, so it
    // never touches erDown/erUp/hold behaviour.
    if (g._tmAutoErAt && millis() - g._tmAutoErAt >= TM_TIME.erLongPressMs) {
      const nowA = millis(), er = g._tmAutoErupt;
      g._tmAshUntil = nowA + TM_TIME.ashMillis;      g._tmAshMode    = 'hold';
      g._ashCloudUntil = nowA + TM_TIME.cloudMillis; g._ashCloudMode = 'hold';
      g._tmAutoErAt = 0; g._tmAutoErupt = null;
      if (typeof g.applyAsh === 'function') g.applyAsh(er);
    }

    // ATTRACT-LOOP reset staged as an eruption (Kiosk.beginAttractEruption armed _tmAttractErAt on
    // idle). The buildup rumbled + rolled the ash cloud down over erLongPressMs; now, at the crest,
    // do the actual reset UNDER the cover — the same hidden-hitch trick the long-press reseed uses
    // — then play the reveal (flash falls from the charged peak, cloud hangs + fades on the fresh
    // world). Clear the flag FIRST so the rebuilt world never inherits the charge.
    if (g._tmAttractErAt && millis() - g._tmAttractErAt >= TM_TIME.erLongPressMs) {
      g._tmAttractErAt = 0;
      if (typeof Kiosk !== 'undefined' && Kiosk.resetToAttract) Kiosk.resetToAttract(g, 'idle');
      const nowR = millis();
      g._tmAshUntil = nowR + TM_TIME.ashMillis;      g._tmAshMode    = 'hold';
      g._ashCloudUntil = nowR + TM_TIME.cloudMillis; g._ashCloudMode = 'hold';
    }

    // Wind: blow the regime's gust when the climate crosses the glacial↔interglacial line
    // (the boosts also fire it on press, in their button actions), then advance any live burst
    // on the real frame clock.
    this._updateClimateWind(g);
    this.updateWind(g, dt);

    // Eruption ash cover: warm the 42 cloud frames in one-at-a-time after setup so the
    // boot path never decodes them all at once (_ashWarmupTick). renderAshCloud just plays
    // the loaded sequence while a cover window is open — no per-element state to prime here.
    this._ashWarmupTick();

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
      // Don't fight a habitat that is itself moving this plant's growth THIS frame: a
      // forest tree dying back outside its band (suppressed), a cold-dormant plant, or an
      // aged-out kahikatea (senescent) are all being SHRUNK by Plant.update the same frame
      // this would grow them — the two cancel and the sprite flickers grown/ungrown (the
      // "boosted trees flicker in wetland / changing habitats" report). Leave them to the
      // habitat. The _growMatches climate gate already keeps FOREST out of the glacial, so a
      // healthy interglacial forest is unaffected. See MISTAKES.md.
      if (p.dormant || p.suppressed || p._senescent) continue;
      const def = TYPES ? TYPES[p.type] : null;
      // Kahikatea (disturbanceRecruit) establishes and fattens ONLY on a river disturbance
      // — a storm flood / eruption pulse / channel shift — never the FOREST button. Same
      // gate seedGrowth() and disperseSeed() already apply; without it the button pumps
      // growth into a stand Plant.update is senescing, which is the wetland flicker.
      if (def && def.disturbanceRecruit) continue;
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
        // One of the three animated thunderhead cells (Storm/Idle 1–3). The old
        // static cloud1/cloud2 stay the fallback in renderWorldLayer if the strips
        // are absent.
        sprite: 'storm_cloud' + (1 + ((Math.random() * 3) | 0)),
        animTime: Math.random() * 100,   // cel clock offset so cells don't churn in lockstep
        scale: 0.5 + Math.random() * 0.4,
        bobPhase: Math.random() * Math.PI * 2,
        bobSpeed: 0.02 + Math.random() * 0.02,
        alpha: 180 + Math.random() * 75
      });
    }
    g._tmStormCells = cells;
    // Bolts are spaced well apart (frames @ ~60fps → ~1.2–2.7 s to the first) so the white rim
    // blink stays occasional — one on press, then one per bolt — rather than a rapid strobe.
    // `variant` is the lightning-shape variant (0–2), rolled per strike in updateStormCells. `cell` is
    // the thunderhead it strikes from (the bolt drifts with it); `age` runs through the fade envelope.
    g._tmBolt = { active: false, timer: 70 + Math.random() * 90, age: 0, cell: 0, pulsed: false, x: 0, y: 0, scale: 1, rot: 0, variant: 0 };
  },

  // Lightning-cloud opacity 0..1 at bolt age (frames): smoothstep up, hold, smoothstep down.
  boltAlpha(age) {
    const fi = TM_TIME.stormBoltFadeIn, ho = TM_TIME.stormBoltHold, fo = TM_TIME.stormBoltFadeOut;
    let u;
    if (age < fi) u = age / fi;
    else if (age < fi + ho) return 1;
    else u = 1 - (age - fi - ho) / fo;
    u = u < 0 ? 0 : (u > 1 ? 1 : u);
    return u * u * (3 - 2 * u);
  },

  updateStormCells(g, dt) {
    const t = g.terrain, cells = g._tmStormCells;
    if (!t || !cells) return;
    const pad = 48;
    for (let i = 0; i < cells.length; i++) {
      const c = cells[i];
      c.x += c.vx * dt; c.y += c.vy * dt; c.bobPhase += c.bobSpeed * dt;
      c.animTime += dt;                    // advance the thunderhead's cel clock
      if (c.x < -pad) c.x = t.mapWidth + pad; else if (c.x > t.mapWidth + pad) c.x = -pad;
      if (c.y < -pad) c.y = t.mapHeight + pad; else if (c.y > t.mapHeight + pad) c.y = -pad;
    }
    const b = g._tmBolt;
    if (!b) return;
    if (b.active) {
      b.age += dt;
      const c = cells[b.cell];
      if (c) { b.x = c.x; b.y = c.y + 10; }   // ride the thunderhead it struck from while it fades
      if (!b.pulsed && b.age >= TM_TIME.stormBoltFadeIn) {
        b.pulsed = true;
        InstallHUD.edgePulse(g, TM_EDGE.pulseStorm, TM_EDGE.pulseStormMs);   // one short white blink per strike, at its brightest
      }
      if (b.age >=TM_TIME.stormBoltFadeIn + TM_TIME.stormBoltHold + TM_TIME.stormBoltFadeOut) {
        b.active = false; b.timer = 80 + Math.random() * 100;   // long gap to the next bolt → occasional flashes
      }
    } else {
      b.timer -= dt;
      if (b.timer <= 0) {
        b.cell = (Math.random() * cells.length) | 0;
        const c = cells[b.cell];
        b.active = true; b.age = 0; b.pulsed = false;
        b.x = c.x; b.y = c.y + 10;
        b.scale = 0.6 + Math.random() * 0.4;
        b.rot = (Math.random() - 0.5) * 0.6;
        b.variant = (Math.random() * 3) | 0;   // pick one of the three bolt shapes
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

    if (cells) {
      noStroke();
      imageMode(CENTER);
      noTint();                       // clouds fade via globalAlpha (#7), not tint()
      const _dc = drawingContext;
      const strips = typeof SpriteStrips !== 'undefined' && SpriteStrips.has;
      const haveWeather = typeof placeableSprites !== 'undefined' && placeableSprites.loaded;

      // ---- Lightning FIRST, so the strike flashes UNDER the thunderheads ----
      // The bolt is positioned at a random cloud cell (updateStormCells), so drawing it
      // before the cloud loop makes the flash read as coming from within the cloud rather
      // than sitting on top of the scene. Real art is the `storm_bolt` strip (three
      // variants, one per cloud shape); placeable lightning/bolt is a missing-art fallback.
      const b = g._tmBolt;
      const boltStrip = strips && SpriteStrips.has('storm_bolt');
      const lightning = haveWeather ? (placeableSprites.lightning || placeableSprites.bolt) : null;
      if (b && b.active && (boltStrip || lightning)) {
        push();
        translate(zx + b.x * z, zy + b.y * z);
        rotate(b.rot);
        // Fade the strike via globalAlpha, NOT a per-frame tint(): a tint value that changes
        // every frame makes p5 rebake the image's tint cache each frame — the strike stutter.
        noTint();
        const ba = this.boltAlpha(b.age);
        // Soft glow behind the cloud, riding the same fade (kept gentle for photosensitivity).
        noStroke();
        fill(255, 255, 200, 40 * ba * env);
        ellipse(0, 0, 150 * z, 150 * z);
        _dc.globalAlpha = ba * env;
        const asp = boltStrip ? SpriteStrips.aspect('storm_bolt', b.variant) : (lightning.width / lightning.height);
        const bh = 130 * b.scale * z, bw = bh * asp;
        if (boltStrip) SpriteStrips.draw('storm_bolt', b.variant, 0, 0, bw, bh);
        else image(lightning, 0, 0, bw, bh);
        _dc.globalAlpha = 1;
        pop();
      }
      _dc.globalAlpha = 1;

      // ---- Thunderheads OVER the lightning ----
      for (let i = 0; i < cells.length; i++) {
        const c = cells[i];
        const cy = zy + (c.y + Math.sin(c.bobPhase) * 2) * z;
        const cx = zx + c.x * z;
        _dc.globalAlpha = c.alpha * env;
        if (strips && SpriteStrips.has(c.sprite)) {
          // Animated thunderhead. Sized by height so the (possibly non-square) art
          // keeps its proportions; the cel churns slowly (photosensitivity-safe).
          const h = 64 * c.scale * z, w = h * SpriteStrips.aspect(c.sprite, 0);
          SpriteStrips.draw(c.sprite, Math.floor(c.animTime * TM_TIME.stormCloudAnim), cx, cy, w, h);
        } else if (haveWeather) {
          // Fallback: the old static cloud1/cloud2 glyph (stable per cell, not per frame).
          const sp = placeableSprites[(i & 1) ? 'cloud2' : 'cloud1'] || placeableSprites.cloud1;
          if (sp) { const size = 64 * c.scale * z; image(sp, cx, cy, size, size); }
        }
      }
      _dc.globalAlpha = 1;
      noTint();
    }
    pop();
  },

  // ==========================================================
  // WIND — W→E gust drift (see the TM_WIND config header)
  // ==========================================================
  // Start a burst. kind 'warm' (interglacial gust) or 'cold' (glacial chill). Debounced per
  // kind so a rapid double-press doesn't stack bursts; a press of the OTHER kind replaces it
  // (latest boost wins). Positions are stored as canvas fractions, so a resize is a no-op.
  beginWind(g, kind) {
    const E = (typeof TM_WIND !== 'undefined') ? TM_WIND : null;
    if (!g || !E) return;
    const now = (typeof millis === 'function') ? millis() : 0;
    if (g._tmWind && g._tmWind.kind === kind && (now - g._tmWind.t0) < (E.minGapMs || 500)) return;
    const parts = [];
    for (let i = 0; i < E.count; i++) {
      parts.push({
        fx: -Math.random() * E.startSpread,                       // staggered just off the left edge
        fy: E.yTop + Math.random() * (E.yBottom - E.yTop),
        sp: E.speed * (1 + (Math.random() * 2 - 1) * E.speedJitter),
        size: 1 + (Math.random() * 2 - 1) * E.sizeJitter,
        phase: Math.random() * Math.PI * 2,
        anim: Math.random() * 100,                               // cel clock offset so gusts don't beat in lockstep
        animSpeed: E.animSpeed * (1 + (Math.random() * 2 - 1) * E.animSpeedJitter)  // per-gust cadence (the "some variation")
      });
    }
    g._tmWind = { kind, t0: now, parts };
  },

  // Advance the live burst on the real frame clock; drop a gust once it clears the right edge,
  // clear the burst when the last one is gone. Allocation-free.
  updateWind(g, dt) {
    const w = g && g._tmWind;
    if (!w) return;
    const E = TM_WIND, parts = w.parts;
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.fx += p.sp * dt;
      p.phase += E.bobSpeed * dt;
      p.anim += dt;                       // advance the gust's cel clock
      if (p.fx > 1.15) parts.splice(i, 1);
    }
    if (parts.length === 0) g._tmWind = null;
  },

  // Blow the regime's wind as the climate crosses the glacial↔interglacial line (getWinterness
  // ≥ 0.5 — the boosts' own split). Hysteresis (0.45/0.55) stops a hovering climate re-firing;
  // the first frame just seeds the state so the boot doesn't blow a gust.
  _updateClimateWind(g) {
    const sm = g && g.seasonManager;
    if (!sm || !sm.getWinterness) return;
    const w = sm.getWinterness();
    if (g._tmLastGlacial === undefined) { g._tmLastGlacial = w >= 0.5; return; }
    if (!g._tmLastGlacial && w > 0.55) { g._tmLastGlacial = true;  this.beginWind(g, 'cold'); }
    else if (g._tmLastGlacial && w < 0.45) { g._tmLastGlacial = false; this.beginWind(g, 'warm'); }
  },

  // Draw the live burst — scattered gust sprites in screen space, faded in over the left edge
  // and out over the right so they enter and leave softly. No-op when idle or the art is absent.
  renderWind(g, W, H) {
    const w = g && g._tmWind;
    if (!w) return;
    const E = TM_WIND;
    // Animated gust strip (warm = interglacial, cold = glacial). Falls back to the
    // old single-frame placeable if the strip is absent, so a missing strip still
    // blows something rather than nothing.
    const strip = (w.kind === 'cold') ? 'wind_cold' : 'wind_warm';
    const hasStrip = typeof SpriteStrips !== 'undefined' && SpriteStrips.has && SpriteStrips.has(strip);
    let fallback = null, fbAsp = 1;
    if (!hasStrip) {
      if (typeof placeableSprites === 'undefined' || !placeableSprites.loaded) return;
      fallback = (w.kind === 'cold') ? placeableSprites.windCold : placeableSprites.windWarm;
      if (!fallback || !fallback.width) return;
      fbAsp = fallback.width / fallback.height;
    }
    const asp = hasStrip ? SpriteStrips.aspect(strip, 0) : fbAsp;
    push();
    imageMode(CENTER);
    noTint();
    const _dc = drawingContext;
    const oldA = _dc.globalAlpha;
    // Boomerang the cel index: play 0→last then back last→0 (ping-pong), so the gust
    // eases and reverses rather than snapping from the loop's last frame to its first.
    // Period is 2·(N-1); the triangle wave below folds the running step into 0..N-1.
    const N = hasStrip ? SpriteStrips.count(strip) : 1;
    const period = N > 1 ? 2 * (N - 1) : 1;
    for (let i = 0; i < w.parts.length; i++) {
      const p = w.parts[i];
      const a = E.peakAlpha * Math.min(1, (p.fx + 0.1) / 0.2) * Math.min(1, (1.1 - p.fx) / 0.2);
      if (a <= 0) continue;
      const h = H * E.sizeFrac * p.size;
      const dw = h * asp;
      const x = p.fx * W, y = (p.fy + Math.sin(p.phase) * E.bobAmp) * H;
      _dc.globalAlpha = a;
      // Each gust runs its own cadence (p.animSpeed) so they don't cycle in lockstep.
      if (hasStrip) {
        const m = Math.floor(p.anim * (p.animSpeed || E.animSpeed)) % period;
        SpriteStrips.draw(strip, m < N ? m : period - m, x, y, dw, h);
      } else image(fallback, x, y, dw, h);
    }
    _dc.globalAlpha = oldA;
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
  _txtCacheMax: 96,            // the top band, the end labels and the eruption captions add ~30 standing strings

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

  // ---- timeline sprite art (sprites/UI/, loaded in preload; assigned to these fields there).
  // Each draw helper returns true when it drew the sprite, so the timeline bodies fall back to
  // their original drawn line / tick / dot whenever a sprite is missing (kiosk-safe; also keeps
  // the boot harness — where loadImage is stubbed — on a valid path). Sizes are in px.
  TL_BAR_H: 14,          // stretched bar/track thickness
  TL_PLAYHEAD_H: 26,     // playhead token height (66×66 art, centred on the axis)
  TL_MARKER_H: 30,       // event-marker pin height (38×54 art; its tip rests on the bar)
  _tlOK(img) { return !!(img && img.width > 0 && img.height > 0); },

  // The bar/track sprite stretched across [x0, x0+w], centred on the axis at `ay`. → true if drawn.
  _tlBarSprite(x0, w, ay) {
    if (!this._tlOK(this._tlBar)) return false;
    const h = this.TL_BAR_H;
    noTint(); imageMode(CORNER);
    image(this._tlBar, x0, ay - h / 2, w, h);
    return true;
  },
  // The playhead token centred on the axis at (px, ay). → true if drawn.
  _tlPlayheadSprite(px, ay) {
    const ph = this._tlPlayhead;
    if (!this._tlOK(ph)) return false;
    const h = this.TL_PLAYHEAD_H, wd = h * (ph.width / ph.height);
    noTint(); imageMode(CENTER);
    image(ph, px, ay, wd, h);
    imageMode(CORNER);
    return true;
  },
  // The event-marker pin for eruption `idx` (0-based), its downward tip resting on the bar at
  // (mx, ay) so the pin body floats above the axis; `h` overrides the height (the visitor
  // timeline sizes pins by tier). → true if drawn.
  _tlMarkerSprite(idx, mx, ay, h) {
    const arr = this._tlMarkers, mk = arr && arr[idx % arr.length];
    if (!this._tlOK(mk)) return false;
    if (!(h > 0)) h = this.TL_MARKER_H;
    const wd = h * (mk.width / mk.height);
    noTint(); imageMode(CENTER);
    image(mk, mx, ay - h / 2, wd, h);   // centre half a pin-height up → its bottom tip sits on the axis
    imageMode(CORNER);
    return true;
  },

  // The shared timeline body — the deep-time axis, the monotonic uplift wedge, the four
  // eruption markers and the playhead — drawn relative to an axis line at `ay`. Both the
  // debug (top) and visitor (bottom) timelines call this, so the two can never drift apart;
  // each caller owns its own strip background, year and fast-forward badge. Assumes an
  // active push().
  _timelineBody(g, x0, w, ay) {
    const yr = DeepTime.yearsBP;
    // ---- axis (bar sprite, or the drawn line as fallback) --
    if (!this._tlBarSprite(x0, w, ay)) {
      stroke(96, 116, 106); strokeWeight(1.5); line(x0, ay, x0 + w, ay);
    }
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
    // ---- the eruptions (marker pins, or drawn ticks) -------
    // The run opens and closes on the same kind of event. Glacial markers are
    // climate instrumentation and live in the debug overlay now — and LGM at
    // 30 ka sat ~13 px from Oruanui at 25.5 ka, so they overlapped permanently.
    let ei = 0;
    for (const m of DEEP_TIME_MARKERS) {
      if (m.kind !== 'eruption') continue;
      const mx = DeepTime.yearToX(m.yearsBP, x0, w);
      const drewPin = this._tlMarkerSprite(ei, mx, ay);
      if (!drewPin) { stroke(224, 138, 92, 210); strokeWeight(2); line(mx, ay - 5, mx, ay + 5); }
      // Anchor the end labels inward so they don't clip off the strip; lift them above the pin.
      const atStart = mx < x0 + 40, atEnd = mx > x0 + w - 40;
      const labelY = drewPin ? ay - this.TL_MARKER_H - 4 : ay - 8;
      this._blitText(m.label, OpenDyslexic, 'dys', 11,
                     atStart ? LEFT : atEnd ? RIGHT : CENTER, BOTTOM, mx, labelY, [224, 138, 92, 225]);
      ei++;
    }
    // ---- playhead (token sprite, or the drawn dot) ---------
    const px = DeepTime.yearToX(yr, x0, w);
    stroke(255, 210, 120, 130); strokeWeight(1); line(px, ay - 14, px, upY + upH + 2);
    if (!this._tlPlayheadSprite(px, ay)) { noStroke(); fill(255, 210, 120); circle(px, ay, 9); }
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
    } else this._renderDialBadge(x0 + w, 12, TOP, [255, 210, 120]);
    pop();
  },

  // The TIME DIAL's readout (DeepTime.dialStep): the detent's rate, shown while the dial is off
  // zero, and "real time" for dialBadgeMs after it is turned back down. The text is the DETENT's
  // rate (quantised, so the _blitText cache sees ~30 strings, never a per-frame value) and the
  // fade rides drawingContext.globalAlpha, not the colour, for the same reason (per-frame tint).
  dialBadgeMs: 2500,
  _dialLabel(rate) {
    const r = rate < 100 ? Math.max(1, Math.round(rate)) : rate < 1000 ? Math.round(rate / 10) * 10 : Math.round(rate / 50) * 50;
    return '>> ' + r.toLocaleString() + ' yrs/s';
  },
  _renderDialBadge(x, y, av, col) {
    if (typeof DeepTime === 'undefined' || DeepTime.dialStep === undefined) return;
    let a = 1, str;
    if (DeepTime.dialStep > 0) str = this._dialLabel(DeepTime.dialTargetRate());
    else {
      const since = millis() - (DeepTime._dialAt || 0);
      if (!DeepTime._dialAt || since >= this.dialBadgeMs) return;
      a = 1 - since / this.dialBadgeMs;
      str = 'real time';
    }
    const ctx = drawingContext, a0 = ctx.globalAlpha;
    ctx.globalAlpha = a0 * a;
    this._blitText(str, FreckleFace, 'freckle', 15, RIGHT, av, x, y, col);
    ctx.globalAlpha = a0;
  },

  // VISITOR timeline — the deep-time axis relocated to a thin strip at the bottom (the top
  // of where the buttons used to sit), with the goal line above it and the year just below it
  // (renderVisitorGoal / renderVisitorYear), all three keyed off _visAxisY so they move as one.
  // On the wall the five buttons are physical, so their on-screen twins only appear in debug —
  // this is the clean, uncluttered visitor layout.
  VIS_STRIP_H: 64,
  VIS_AXIS_UP: 168,          // px from the top of the bottom strip up to the timeline axis (was 128)
  VIS_INSET: 0.10,           // horizontal inset each side, as a fraction of canvas width (compacted from the debug strip)
  _visAxisY(H) { return (H - this.VIS_STRIP_H) - this.VIS_AXIS_UP; },
  renderVisitorTimeline(g, W, H) {
    const inset = Math.round(W * this.VIS_INSET);
    const x0 = inset, w = W - 2 * inset;
    const stripH = this.VIS_STRIP_H, yTop = H - stripH, ay = this._visAxisY(H);
    push();
    // Light backing — kept low-alpha so the edge band glows THROUGH behind the axis while
    // the marks still have enough contrast to read (the band is now drawn under the HUD).
    //noStroke(); fill(14, 21, 19, 120); rect(0, yTop, W, stripH);
    this._visitorTimelineBody(g, x0, w, ay);
    // The speed readout lives under the year now (renderVisitorYear → _renderSpeed); the old 15 px
    // corner badge was too small for the wall and never named a boost's time-lapse.
    pop();
  },

  // The VISITOR timeline body: one bar, coloured as the CLIMATE RIBBON (green interglacial, blue
  // glacial, baked once from Climate), so a goal's "the next glacial" is visible ahead of the
  // playhead. Uplift stays a faint white wedge riding on it, so the "river older than the mountains"
  // takeaway survives. The two eruptions that open and close the window are carried by the bar's END
  // LABELS (date + eruption) instead of pins, which also keeps the start pin out from under the
  // playhead. The two mid-window eruptions are pins sized by tier, each with a volcano glyph and a
  // readable name; the pin of an eruption the caption is announcing grows. A trail streams behind the
  // playhead while geology moves. Assumes an active push().
  PIN_TIER_SCALE: { minor: 0.95, major: 1.2, catastrophic: 1.4 },
  PIN_GROW: 0.3,             // extra pin scale while its eruption's caption is fully up (VIS_GOAL_GAP clears the largest)
  TL_LABEL_SIZE: 22,         // the pin and end labels (were 11 px: unreadable past ~2 m)
  TL_END_BELOW: 20,          // px from the axis down to the top of the end labels
  TL_END_LINE_H: 30,         // between an end label's date and its eruption line
  TRAIL_MAX_PX: 110,         // the playhead's trail at DeepTime.tlMaxRate
  TRAIL_COL: [255, 214, 130],
  _TL_COL: [255, 255, 255, 235],
  _trailRate: 0,
  _visitorTimelineBody(g, x0, w, ay) {
    const yr = DeepTime.yearsBP;
    // ---- the bar/track (sprite, or the single white line as fallback), then the climate ribbon on it ----
    if (!this._tlBarSprite(x0, w, ay)) {
      stroke(255); strokeWeight(1.5); line(x0, ay, x0 + w, ay);
    }
    this._climateRibbon(x0, w, ay);
    // ---- uplift: a faint white wedge on the line (no backing bar) ----
    const upNow = DeepTime.yearToX(yr, x0, w);
    const upH = 6;
    noStroke(); fill(255, 90);
    beginShape();
    vertex(x0, ay);
    vertex(upNow, ay);
    vertex(upNow, ay - upH * DeepTime.progress());
    endShape(CLOSE);
    // ---- the eruptions: mid-window pins + the two end labels ----
    const ER = DeepTime.ERUPTIONS, labs = this._erLabels(), s = this.TL_LABEL_SIZE, C = this._cap;
    for (let i = 0; i < ER.length; i++) {
      const e = ER[i], L = labs[i];
      if (L.end) {
        const left = e.yearsBP >= DeepTime.yearsStart, xA = left ? x0 : x0 + w, al = left ? LEFT : RIGHT;
        const y1 = ay + this.TL_END_BELOW + s * 0.675;
        this._haloText(L.date, OpenDyslexic, 'dys', s, al, CENTER, xA, y1, this._TL_COL);
        this._glyphLabel(L.text, L.w, xA, y1 + this.TL_END_LINE_H, al);
        continue;
      }
      const mx = DeepTime.yearToX(e.yearsBP, x0, w);
      let sc = this.PIN_TIER_SCALE[e.tier] || 1;
      if (C.e === e) sc *= 1 + this.PIN_GROW * C.a;
      const ph = this.TL_MARKER_H * sc;
      const drewPin = this._tlMarkerSprite(i, mx, ay, ph);
      if (!drewPin) { stroke(255); strokeWeight(2); line(mx, ay - 5, mx, ay + 5); }
      const labelCy = (drewPin ? ay - ph - 6 : ay - 10) - s * 0.675;
      this._glyphLabel(L.text, L.w, mx, labelCy, CENTER);
    }
    // ---- the speed trail, behind (older than) the playhead ----
    const px = DeepTime.yearToX(yr, x0, w);
    const rate = DeepTime.geoRate > 0 ? DeepTime.geoRate : 0;
    this._trailRate += (rate - this._trailRate) * 0.08;
    if (rate === 0 && this._trailRate < 20) this._trailRate = 0;
    const len = Math.min(1, this._trailRate / (DeepTime.tlMaxRate || 5000)) * this.TRAIL_MAX_PX;
    if (len > 3) {
      const N = 8, seg = len / N, T = this.TRAIL_COL;
      noStroke();
      // taller than the ribbon (RIBBON_H) so it reads as a streak over it, not a tint of it
      for (let i = 0; i < N; i++) { fill(T[0], T[1], T[2], 190 * (1 - i / N)); rect(px - seg * (i + 1), ay - 8, seg + 0.5, 16, 3); }
    }
    // ---- playhead (token sprite, or the white dot fallback) ----
    if (!this._tlPlayheadSprite(px, ay)) {
      stroke(255); strokeWeight(1); line(px, ay - 12, px, ay + 2);
      stroke(0); strokeWeight(2); fill(255); circle(px, ay, 9);
    }
  },

  // The climate ribbon: the glacial index across the window, green → blue through the regime cut,
  // baked ONCE into a buffer (the curve is fixed and Climate is pure) and rebuilt only when the bar's
  // width changes, remove()ing the old buffer (the createGraphics-leak rule). → true if drawn.
  RIBBON_H: 10,
  RIBBON_SOFT: 0.12,          // ± glacial index over which the colour blends at the regime cut
  _ribbon: null,              // { buf, w }
  _climateRibbon(x0, w, ay) {
    if (typeof Climate === 'undefined' || !Climate.glacialIndexAt || typeof createGraphics !== 'function') return false;
    const wi = Math.max(1, Math.round(w));
    let R = this._ribbon;
    if (!R || R.w !== wi) {
      if (R && R.buf && R.buf.remove) R.buf.remove();
      const h = this.RIBBON_H, buf = createGraphics(wi, h);
      const TG = (typeof TMGoals !== 'undefined') ? TMGoals : null;
      const warm = TG ? TG.climateColor(false) : [84, 210, 96], cold = TG ? TG.climateColor(true) : [150, 205, 236];
      const thr = (Climate.regimeThreshold != null) ? Climate.regimeThreshold : 0.5, soft = this.RIBBON_SOFT;
      const span = DeepTime.yearsStart - DeepTime.yearsEnd;
      buf.clear(); buf.noStroke();
      for (let x = 0; x < wi; x++) {
        const gi = Climate.glacialIndexAt(DeepTime.yearsStart - ((x + 0.5) / wi) * span);
        let t = (gi - (thr - soft)) / (2 * soft); t = t < 0 ? 0 : t > 1 ? 1 : t; t = t * t * (3 - 2 * t);
        buf.fill(warm[0] + (cold[0] - warm[0]) * t, warm[1] + (cold[1] - warm[1]) * t, warm[2] + (cold[2] - warm[2]) * t, 235);
        buf.rect(x, 0, 1, h);
      }
      R = this._ribbon = { buf, w: wi };
    }
    imageMode(CORNER); noTint();
    image(R.buf, x0, ay - this.RIBBON_H / 2, w, this.RIBBON_H);
    return true;
  },

  // Per-eruption label records, built once: { end, text, w, date }. `end` marks the two that open and
  // close the window (drawn as the bar's end labels). Widths are measured here, not per frame.
  _erLabelCache: null,
  _erLabels() {
    if (this._erLabelCache) return this._erLabelCache;
    const s = this.TL_LABEL_SIZE;
    push(); textFont(OpenDyslexic); textSize(s);
    this._erLabelCache = DeepTime.ERUPTIONS.map(e => {
      const text = e.name + ' eruption';
      return { end: e.yearsBP >= DeepTime.yearsStart || !!e.terminal, text, w: textWidth(text), date: this._yearsAgo(e.yearsBP) };
    });
    pop();
    return this._erLabelCache;
  },
  _yearsAgo(yr) {
    if (yr >= 1e6) { const m = yr / 1e6; return (m === 1 ? '1 million' : m.toFixed(1) + ' million') + ' years ago'; }
    return Math.round(yr).toLocaleString() + ' years ago';
  },

  // A drawn volcano glyph (no emoji: CLAUDE.md) — a cone with an ash plume — left edge at x, centred
  // on cy, `h` tall; its width is h·GLYPH_ASPECT. Reads as "eruption" ahead of every eruption name.
  GLYPH_ASPECT: 1.1,
  _volcanoGlyph(x, cy, h) {
    const w = h * this.GLYPH_ASPECT, by = cy + h * 0.5, ty = cy + h * 0.02;
    noStroke();
    fill(8, 14, 12, 170);                                                     // halo
    quad(x + 2, by + 2, x + w * 0.36 + 2, ty + 2, x + w * 0.64 + 2, ty + 2, x + w + 2, by + 2);
    fill(224, 138, 92);                                                       // the cone
    quad(x, by, x + w * 0.36, ty, x + w * 0.64, ty, x + w, by);
    fill(214, 214, 206, 235);                                                 // the plume
    circle(x + w * 0.48, cy - h * 0.2, h * 0.38);
    circle(x + w * 0.66, cy - h * 0.38, h * 0.3);
    circle(x + w * 0.34, cy - h * 0.36, h * 0.24);
  },
  // Glyph + label as one unit, aligned (LEFT / CENTER / RIGHT) on x, centred on cy. tw = the text's width.
  _glyphLabel(str, tw, x, cy, align) {
    const s = this.TL_LABEL_SIZE, gw = s * this.GLYPH_ASPECT, gap = 7, total = gw + gap + tw;
    const sx = align === CENTER ? x - total / 2 : align === RIGHT ? x - total : x;
    this._volcanoGlyph(sx, cy, s);
    this._haloText(str, OpenDyslexic, 'dys', s, LEFT, CENTER, sx + gw + gap, cy, this._TL_COL);
  },
  // Text with the HUD's soft dark halo under it (the goal / year format).
  _haloText(str, font, tag, size, ah, av, x, y, col) {
    this._blitText(str, font, tag, size, ah, av, x + 2, y + 3, this._GOAL_HALO);
    this._blitText(str, font, tag, size, ah, av, x, y, col);
  },

  // VISITOR year — the one always-on readout, centred just BELOW the timeline axis, so the
  // timeline reads goal (above) → axis → date (below). Clears the playhead token (TL_PLAYHEAD_H).
  // A soft dark halo keeps it legible over the busy scene; no strip behind it.
  VIS_YEAR_SIZE: 42,
  VIS_YEAR_BELOW: 46,        // px from the timeline axis down to the year's centre
  renderVisitorYear(g, W, H) {
    const label = DeepTime.label();
    const cx = W / 2, cy = this._visAxisY(H) + this.VIS_YEAR_BELOW;
    push();
    this._blitText(label, FreckleFace, 'freckle', this.VIS_YEAR_SIZE, CENTER, CENTER, cx + 2, cy + 3, [8, 14, 12, 170]);
    this._blitText(label, FreckleFace, 'freckle', this.VIS_YEAR_SIZE, CENTER, CENTER, cx, cy, [236, 244, 240]);
    this._renderClimateLine(cx, cy + this.VIS_CLIMATE_BELOW);
    pop();
  },

  // "The climate is INTERGLACIAL / GLACIAL" under the year: the state in the climate boost colours
  // (green / blue, as the goal verdicts and boost outlines). The same regime cut as the boost gate
  // (TMGoals.glacialNow → Climate.regimeThreshold). Centred as one line, so the two parts' widths are
  // measured once per regime change, never per frame.
  VIS_CLIMATE_SIZE: 28,
  VIS_CLIMATE_BELOW: 42,     // px from the year's centre down to this line's centre
  CLIMATE_PREFIX: 'The climate is ',
  _climateLine: null,        // { glacial, word, col, prefixW, wordW }
  _renderClimateLine(cx, cy) {
    const glacial = (typeof TMGoals !== 'undefined') ? TMGoals.glacialNow() : false;
    let c = this._climateLine;
    if (!c || c.glacial !== glacial) {
      const word = glacial ? 'GLACIAL' : 'INTERGLACIAL';
      const col = (typeof TMGoals !== 'undefined') ? TMGoals.climateColor(glacial)
                : (glacial ? [150, 205, 236] : [84, 210, 96]);
      push(); textFont(FreckleFace); textSize(this.VIS_CLIMATE_SIZE);
      const prefixW = textWidth(this.CLIMATE_PREFIX), wordW = textWidth(word);
      pop();
      c = this._climateLine = { glacial, word, col, prefixW, wordW };
    }
    const x0 = cx - (c.prefixW + c.wordW) / 2, s = this.VIS_CLIMATE_SIZE;
    this._blitText(this.CLIMATE_PREFIX, FreckleFace, 'freckle', s, LEFT, CENTER, x0 + 2, cy + 2, this._GOAL_HALO);
    this._blitText(this.CLIMATE_PREFIX, FreckleFace, 'freckle', s, LEFT, CENTER, x0, cy, this._GOAL_COL);
    this._blitText(c.word, FreckleFace, 'freckle', s, LEFT, CENTER, x0 + c.prefixW + 2, cy + 2, this._GOAL_HALO);
    this._blitText(c.word, FreckleFace, 'freckle', s, LEFT, CENTER, x0 + c.prefixW, cy, c.col);
    this._renderSpeed(cx, cy + this.VIS_SPEED_BELOW);
  },

  // The SPEED readout under the climate line (the boost tally that sat here moved to the top band).
  // It reads the LIVE rate, DeepTime.geoRate: a boost's time-lapse, the dial or a deep burst, whichever
  // is playing. That way the biggest fast-forward in the experience, a boost's time-lapse at the dial's
  // rest, is named too. Drawn chevrons (1–4 by speed band) read without reading the number. The rate
  // snaps to a short list of round numbers and a new number holds SPEED_HOLD_MS, so the text cache
  // sees ~18 strings, never a per-frame value. At rest (geology paused, the default) it invites the dial.
  VIS_SPEED_SIZE: 36,
  VIS_SPEED_PAUSED_SIZE: 28,
  VIS_SPEED_BELOW: 46,        // px from the climate line's centre down to this line's centre
  SPEED_STEPS: [1, 2, 5, 10, 20, 50, 100, 200, 300, 500, 750, 1000, 1500, 2000, 2500, 3000, 4000, 5000],
  SPEED_HOLD_MS: 400,
  SPEED_PAUSED: 'Time is paused. Turn the dial to travel!',
  SPEED_COL: [255, 210, 120],
  _SPEED_PAUSED_COL: [236, 244, 240, 215],
  _speed: null,               // { step, label, w, size, at }
  _speedLabelFor(step) { return '1 second = ' + step.toLocaleString() + (step === 1 ? ' year' : ' years'); },
  _speedStep(rate) {
    const S = this.SPEED_STEPS, lr = Math.log(rate);
    let best = S[0], bd = Infinity;
    for (let i = 0; i < S.length; i++) { const d = Math.abs(Math.log(S[i]) - lr); if (d < bd) { bd = d; best = S[i]; } }
    return best;
  },
  _speedChevrons(step) { return step <= 20 ? 1 : step <= 300 ? 2 : step <= 2000 ? 3 : 4; },
  _renderSpeed(cx, cy) {
    if (typeof DeepTime === 'undefined') return;
    const rate = DeepTime.geoRate > 0 ? DeepTime.geoRate : 0, now = millis();
    const S = this._speed || (this._speed = { step: -1, label: null, w: 0, size: 0, at: -1e9 });
    const step = rate > 0.5 ? this._speedStep(rate) : 0;
    // a start or a stop shows at once; a change of speed waits out the hold (no number flicker on a ramp)
    if (step !== S.step && (S.step <= 0 || step === 0 || now - S.at >= this.SPEED_HOLD_MS)) {
      S.step = step; S.at = now;
      S.label = step ? this._speedLabelFor(step) : this.SPEED_PAUSED;
      S.size = step ? this.VIS_SPEED_SIZE : this.VIS_SPEED_PAUSED_SIZE;
      push(); textFont(FreckleFace); textSize(S.size); S.w = textWidth(S.label); pop();
    }
    const gh = S.size * 0.62, gap = 14;
    const n = S.step > 0 ? this._speedChevrons(S.step) : 0;
    const cw = gh * 0.62, cg = gh * 0.18;                             // one chevron's width, the gap between
    const gw = n ? n * cw + (n - 1) * cg : gh * 0.7;                  // chevrons, or the pause glyph
    const x = cx - (gw + gap + S.w) / 2, top = cy - gh / 2, bot = cy + gh / 2;
    noStroke();
    if (n) {
      const C = this.SPEED_COL, ph = now / 1000 * Math.PI * 2 * 1.2;   // a slow 1.2 Hz ripple, left to right
      for (let i = 0; i < n; i++) {
        const lx = x + i * (cw + cg);
        fill(8, 14, 12, 150); triangle(lx + 2, top + 3, lx + cw + 2, cy + 3, lx + 2, bot + 3);
        fill(C[0], C[1], C[2], 255 * (0.55 + 0.45 * (0.5 + 0.5 * Math.sin(ph - i * 1.1))));
        triangle(lx, top, lx + cw, cy, lx, bot);
      }
      this._haloText(S.label, FreckleFace, 'freckle', S.size, LEFT, CENTER, x + gw + gap, cy, C);
    } else {
      const bw = gh * 0.24, P = this._SPEED_PAUSED_COL;
      fill(8, 14, 12, 150); rect(x + 2, top + 3, bw, gh); rect(x + gh * 0.46 + 2, top + 3, bw, gh);
      fill(P[0], P[1], P[2], P[3]); rect(x, top, bw, gh); rect(x + gh * 0.46, top, bw, gh);
      this._haloText(S.label, FreckleFace, 'freckle', S.size, LEFT, CENTER, x + gw + gap, cy, P);
    }
  },

  // VISITOR goal — floated ABOVE the bottom timeline in the SAME format as the year (FreckleFace,
  // dark halo + light fill, centred). It shows the live PLANT GOAL and, after a boost, its verdict
  // (TeManawa_goals.js decides which line and colour). With no plant goal live it falls back to the
  // regime objective ("Boost a glacial plant!"), and it is blank once there is no crossing left
  // before the window end. Lines wrap to the screen and stack UPWARD from the anchor, so a long
  // verdict never runs into the timeline. A change of line CROSSFADES (GOAL_FADE_MS, above the
  // 500 ms photosensitivity floor) via globalAlpha, never a per-frame tint (see per-frame tint stutter).
  VIS_GOAL_SIZE: 50,          // the year's format (FreckleFace), a touch larger than the year itself
  VIS_GOAL_GAP: 124,          // px above the timeline axis — clears the largest eruption pin (a catastrophic one, grown) + its label
  GOAL_WRAP: 0.88,            // max line width, as a fraction of the canvas width
  GOAL_LINE_H: 1.12,          // line spacing, × VIS_GOAL_SIZE
  GOAL_FADE_MS: 800,          // crossfade between successive lines (goal → verdict → next goal)
  GOAL_OBJECTIVE: {           // per-regime objective text (edit here); falls back to a generated line
    interglacial: 'Boost a glacial plant!',
    glacial:      'Boost an interglacial plant!'
  },
  // Cache the next-boundary lookup: it scans the climate curve + allocates, so recompute ONLY when
  // the regime flips or the clock jumps back — never per frame (CLAUDE.md: no allocation in draw()).
  _goalCache: null,
  // Two text layers: `cur` fading in, `out` fading out. Swapped (not reallocated) on a change; the
  // wrapped lines are rebuilt only when the text changes.
  _goalFade: null,
  renderVisitorGoal(g, W, H) {
    if (typeof Climate === 'undefined' || typeof DeepTime === 'undefined' || !Climate.nextRegimeBoundary) return;
    const y = DeepTime.yearsBP;
    const cur = Climate.glacialIndexAt(y) >= (Climate.regimeThreshold != null ? Climate.regimeThreshold : 0.5);
    let c = this._goalCache;
    if (!c || c.regime !== cur || y > c.at + 1) {          // regime flip (incl. a boundary crossing) or a backward seek
      const goal = Climate.nextRegimeBoundary(y, DeepTime.yearsEnd);
      const label = goal ? (this.GOAL_OBJECTIVE[goal.stageName] ||
        ('Reach the next ' + goal.stageName.charAt(0).toUpperCase() + goal.stageName.slice(1) + '!')) : null;
      c = this._goalCache = { regime: cur, at: y, label };
    } else {
      c.at = y;                                            // track forward motion (mutate, no allocation)
    }

    // The plant goal (or its verdict) wins; otherwise the regime objective. Both colours are stable
    // references, so an identity test spots a change without allocating.
    const goals = (typeof TMGoals !== 'undefined') ? TMGoals : null;
    const gt = goals ? goals.text() : null;
    const want = gt || (c.label || null);
    const col = gt ? goals.color() : this._goalPromptCol();
    const now = millis();
    let F = this._goalFade;
    if (!F) F = this._goalFade = { cur: { text: null, col: null, lines: null, t0: -1e9, a0: 1 },
                                   out: { text: null, col: null, lines: null, t0: -1e9, a0: 0 } };
    if (want !== F.cur.text || col !== F.cur.col) {
      const fade = this.GOAL_FADE_MS;
      const shown = Math.min(1, (now - F.cur.t0) / fade);  // how far the old line had faded in
      const o = F.out; F.out = F.cur; F.cur = o;
      F.out.a0 = shown; F.out.t0 = now;
      F.cur.text = want; F.cur.col = col; F.cur.t0 = now;
      F.cur.lines = want ? this._wrapGoal(want, W) : null;
    }

    const ay = this._visAxisY(H);                         // the bottom timeline axis (see renderVisitorTimeline)
    const cx = W / 2, cy = ay - this.VIS_GOAL_GAP;
    const fade = this.GOAL_FADE_MS;
    const aOut = F.out.a0 * (1 - Math.min(1, (now - F.out.t0) / fade));
    const aIn  = Math.min(1, (now - F.cur.t0) / fade);
    push();
    if (aOut > 0.004 && F.out.lines) this._drawGoalLines(F.out.lines, F.out.col, aOut, cx, cy);
    if (aIn > 0.004 && F.cur.lines)  this._drawGoalLines(F.cur.lines, F.cur.col, aIn, cx, cy);
    pop();
  },

  // Where the HUD stands over the world, for overlays lettered over it (RiverNames) to keep clear of:
  // { top, bottom, rects: [[x0, y0, x1, y1], …] } in 1080-space px. The top strip's height is kept
  // clear in both modes. Visitor: the goal (held at LABEL_GOAL_LINES lines, or more while a longer one
  // shows) and the timeline with its pins as one full-width band, the year, climate line and speed
  // readout as a centred block, the bar's two end labels, and the two top-band panels at their largest
  // (a full row of solved plants), so the keep-out never changes as the tallies grow; the map shows
  // round the blocks. The eruption caption is transient and draws its own card, so it is not kept out.
  // Debug: its top strip and button bar. Allocates, so call it when labelSig() changes, not per frame.
  LABEL_GOAL_LINES: 2,
  LABEL_YEAR_HALF_W: 330,     // half the widest of the year / climate / speed lines (the paused invitation)
  LABEL_END_W: 300,           // the bar's end labels (date + glyph + eruption)
  _labelGoalLines() {
    const F = this._goalFade, cur = (F && F.cur.lines) ? F.cur.lines.length : 0;
    return Math.max(this.LABEL_GOAL_LINES, cur);
  },
  _labelDebug() { return typeof Debug !== 'undefined' && !!Debug.enabled; },
  labelSig() { return this._labelGoalLines() * 2 + (this._labelDebug() ? 1 : 0); },   // changes ⇒ labelKeepOut changed
  labelKeepOut(W, H) {
    if (this._labelDebug()) return { top: this.TOP_H, bottom: H - this.BOT_H, rects: [] };
    const ay = this._visAxisY(H), lines = this._labelGoalLines();
    const goalTop = ay - this.VIS_GOAL_GAP - (lines - 1) * this.VIS_GOAL_SIZE * this.GOAL_LINE_H
                  - this.VIS_GOAL_SIZE * 0.7;          // the top line's upper half (_blitText's box is 1.35 em)
    const yearBot = ay + this.VIS_YEAR_BELOW + this.VIS_CLIMATE_BELOW + this.VIS_SPEED_BELOW + this.VIS_SPEED_SIZE * 0.7;
    const inset = Math.round(W * this.VIS_INSET), xEnd = W - inset;
    const endBot = ay + this.TL_END_BELOW + this.TL_END_LINE_H + this.TL_LABEL_SIZE * 1.4;
    const G = this._tbGeom(W);
    return { top: this.TOP_H, bottom: H, rects: [
      [0, goalTop, W, ay + this.TL_PLAYHEAD_H / 2],                              // goal + timeline + pins
      [W / 2 - this.LABEL_YEAR_HALF_W, ay, W / 2 + this.LABEL_YEAR_HALF_W, yearBot],   // year, climate, speed
      [inset - 8, ay, inset + this.LABEL_END_W, endBot],                         // the bar's start label
      [xEnd - this.LABEL_END_W, ay, xEnd + 8, endBot],                           // …and its end label
      [0, 0, G.lx + G.lwMax, G.lyMax],                                           // the tallies, at their largest
      [G.rx, 0, W, G.ry1]                                                        // ecosystem health
    ] };
  },

  _goalPromptCol() {
    return (typeof TM_GOALS !== 'undefined' && TM_GOALS.colPrompt) || this._GOAL_COL;
  },
  _GOAL_COL: [236, 244, 240],
  _GOAL_HALO: [8, 14, 12, 170],

  // ---- the TOP BAND (visitor) ---------------------------------------------------------------------
  // The visitor's progress, in the top corners, where it reads from across the room and covers the
  // least map (the west edge is mostly sea). Top-left, the TALLIES: big numerals for successful boosts
  // and goals solved, with the solved goals' plants drawn as their own sprites. That keeps it a
  // collection, not a score (CLAUDE.md: a goal is "a question a plant answers"). Top-right, ECOSYSTEM
  // HEALTH: a bar filled by the plant stock the visitor has earned (Simulation.ecoRichness), dented and
  // greyed by habitat health (Game._habitatHealth: ash, a wrong-climate boost, storm overuse, dune
  // burial), a word for its state, and how many of the bird kinds are alive. Every change eases
  // (≥500 ms) or pops in SIZE, never in brightness (photosensitivity). The layout is computed once per
  // width (_tbGeom), so a frame allocates nothing; the strings are small integers and a few labels.
  TB_MARGIN: 36,             // px from the screen edge to each panel
  TB_PAD: 22,                // panel padding
  TB_PANEL_ALPHA: 120,       // the soft dark backing behind each panel (0 = none)
  TB_RADIUS: 18,
  TALLY_NUM_SIZE: 80,
  TALLY_LABEL_SIZE: 30,
  TALLY_NUM_COL_W: 96,       // the numerals right-align in this column, so 7 and 12 line up
  TALLY_ROW_H: 86,
  TALLY_ICON_H: 76,
  TALLY_ICON_MAX: 5,         // most solved plants drawn (the newest); keeps the panel clear of the caption card
  TALLY_POP_MS: 650,
  TALLY_POP: 0.2,            // extra numeral scale at the crest of a pop
  TALLY_SHOW_ZERO: true,     // false: the tallies stay hidden until the first boost
  TALLY_BOOSTS: 'successful boosts',
  TALLY_GOALS:  'goals solved',
  _TALLY_NUM_COL: [255, 236, 190],
  HEALTH_TITLE: 'Ecosystem health',
  HEALTH_W: 400,
  HEALTH_BAR_H: 30,
  HEALTH_TITLE_SIZE: 30,
  HEALTH_WORD_SIZE: 36,
  HEALTH_BIRD_SIZE: 26,
  HEALTH_ASH_FLOOR: 0.4,     // a fully grey habitat (health 0) still shows this share of the earned bar
  HEALTH_EASE: 0.02,         // per-frame ease of the bar toward its target (~0.8 s at 60 fps)
  HEALTH_COL_EASE: 0.04,     // per-frame ease of the bar colour (climate hue, greyed by health)
  HEALTH_WORDS: [[0.80, 'Thriving'], [0.62, 'Growing'], [0.42, 'Steady'], [0, 'Struggling']],
  HEALTH_HYST: 0.025,        // a word changes only once the bar is this far past its line
  _tally: null,              // { b, bAt, g, gAt, nb, ng, sB, sG }
  _eco: null,                // { v, r, g, b, word, bk, bt, bird }

  _tbG: null,
  _tbGeom(W) {
    let G = this._tbG;
    if (G && G.W === W) return G;
    G = this._tbG || (this._tbG = {});
    const M = this.TB_MARGIN, P = this.TB_PAD;
    push(); textFont(FreckleFace); textSize(this.TALLY_LABEL_SIZE);
    const lw = Math.max(textWidth(this.TALLY_BOOSTS), textWidth(this.TALLY_GOALS));
    pop();
    G.W = W;
    G.lx = M; G.ly = M;
    G.numR = M + P + this.TALLY_NUM_COL_W;           // the numerals' right edge
    G.labX = G.numR + 18;                            // the labels' left edge
    G.row1 = M + P + this.TALLY_NUM_SIZE * 0.55;     // the two rows' centres
    G.row2 = G.row1 + this.TALLY_ROW_H;
    G.iconBot = G.row2 + this.TALLY_NUM_SIZE * 0.5 + 6 + this.TALLY_ICON_H;
    G.slotW = this.TALLY_ICON_H * 1.1 + 10;          // one solved plant's slot
    G.lw = (G.labX + lw + P) - M;                    // panel width: numerals + labels
    G.lwMax = Math.max(G.lw, 2 * P + this.TALLY_ICON_MAX * G.slotW);
    G.lyNoIcons = G.row2 + this.TALLY_NUM_SIZE * 0.55 + P;
    G.lyMax = G.iconBot + P;
    G.rR = W - M;                                    // the health panel's right edge
    G.rx = G.rR - this.HEALTH_W - 2 * P;             // …and its left edge
    G.barX = G.rx + P;
    G.hTitle = M + P + this.HEALTH_TITLE_SIZE * 0.6;
    G.barTop = G.hTitle + this.HEALTH_TITLE_SIZE * 0.6 + 10;
    G.hWord = G.barTop + this.HEALTH_BAR_H + 12 + this.HEALTH_WORD_SIZE * 0.6;
    G.hBird = G.hWord + this.HEALTH_WORD_SIZE * 0.6 + 8 + this.HEALTH_BIRD_SIZE * 0.6;
    G.ry1 = G.hBird + this.HEALTH_BIRD_SIZE * 0.6 + P;
    return G;
  },

  renderVisitorTopBand(g, W, H) {
    if (typeof DeepTime === 'undefined') return;
    const G = this._tbGeom(W), now = millis();
    push();
    this._renderTallies(G, now);
    this._renderHealth(g, G);
    pop();
  },

  _popScale(t0, now) {
    const u = (now - t0) / this.TALLY_POP_MS;
    return (u >= 0 && u < 1) ? 1 + this.TALLY_POP * Math.sin(Math.PI * u) : 1;
  },
  _popText(str, font, tag, size, ah, av, x, y, col, s) {
    if (s === 1) { this._haloText(str, font, tag, size, ah, av, x, y, col); return; }
    push(); translate(x, y); scale(s); this._haloText(str, font, tag, size, ah, av, 0, 0, col); pop();
  },

  _renderTallies(G, now) {
    const nB = DeepTime.boostsOk | 0, nG = DeepTime.goalsSolved | 0, keys = DeepTime.solvedKeys || [];
    const T = this._tally || (this._tally = { b: nB, bAt: -1e9, g: nG, gAt: -1e9, nb: -1, ng: -1, sB: '', sG: '' });
    if (nB !== T.b) { if (nB > T.b) T.bAt = now; T.b = nB; }   // a rise pops; a reset to 0 does not
    if (nG !== T.g) { if (nG > T.g) T.gAt = now; T.g = nG; }
    if (!this.TALLY_SHOW_ZERO && !nB && !nG) return;
    if (T.nb !== nB) { T.nb = nB; T.sB = String(nB); }        // strings only on a change
    if (T.ng !== nG) { T.ng = nG; T.sG = String(nG); }
    const P = this.TB_PAD, nIcons = Math.min(keys.length, this.TALLY_ICON_MAX);
    if (this.TB_PANEL_ALPHA > 0) {
      const pw = nIcons ? Math.max(G.lw, 2 * P + nIcons * G.slotW) : G.lw;
      noStroke(); fill(8, 14, 12, this.TB_PANEL_ALPHA);
      rect(G.lx, G.ly, pw, (nIcons ? G.lyMax : G.lyNoIcons) - G.ly, this.TB_RADIUS);
    }
    const NS = this.TALLY_NUM_SIZE, LS = this.TALLY_LABEL_SIZE;
    this._popText(T.sB, FreckleFace, 'freckle', NS, RIGHT, CENTER, G.numR, G.row1, this._TALLY_NUM_COL, this._popScale(T.bAt, now));
    this._haloText(this.TALLY_BOOSTS, FreckleFace, 'freckle', LS, LEFT, CENTER, G.labX, G.row1 + NS * 0.06, this._GOAL_COL);
    this._popText(T.sG, FreckleFace, 'freckle', NS, RIGHT, CENTER, G.numR, G.row2, this._TALLY_NUM_COL, this._popScale(T.gAt, now));
    this._haloText(this.TALLY_GOALS, FreckleFace, 'freckle', LS, LEFT, CENTER, G.labX, G.row2 + NS * 0.06, this._GOAL_COL);
    // the solved goals' plants, newest on the right; the newest pops with its numeral
    const h = this.TALLY_ICON_H;
    let ix = G.lx + P;
    for (let i = keys.length - nIcons; i < keys.length; i++) {
      const im = this._plantIcon(keys[i]);
      if (!im) { ix += G.slotW; continue; }
      let k = Math.min(h / im.height, (h * 1.1) / im.width);
      if (i === keys.length - 1) k *= this._popScale(T.gAt, now);
      const dw = im.width * k, dh = im.height * k, slot = G.slotW - 10;
      imageMode(CORNER); noTint();
      image(im, ix + (slot - dw) / 2, G.iconBot - dh, dw, dh);
      ix += G.slotW;
    }
  },

  // A plant's representative sprite for the tally row: its mature state frame, else its first size
  // variant (tōtara and the variant-grown plants), else the last growth frame. null if none loaded.
  _plantIcon(key) {
    const S = (typeof plantSprites !== 'undefined') ? plantSprites : null;
    const s = S && S[key];
    if (!s) return null;
    if (this._tlOK(s.mature)) return s.mature;
    if (this._tlOK(s.thriving)) return s.thriving;
    if (s.variants && this._tlOK(s.variants[0])) return s.variants[0];
    if (s.growing && s.growing.length && this._tlOK(s.growing[s.growing.length - 1])) return s.growing[s.growing.length - 1];
    return null;
  },

  _renderHealth(g, G) {
    const sim = g && g.simulation;
    const rich = (sim && sim.ecoRichness != null) ? sim.ecoRichness : 0.5;
    let hh = (g && g._habitatHealth != null) ? g._habitatHealth : 1;
    hh = hh < 0 ? 0 : hh > 1 ? 1 : hh;
    const F = this.HEALTH_ASH_FLOOR, target = rich * (F + (1 - F) * hh);
    const TG = (typeof TMGoals !== 'undefined') ? TMGoals : null;
    const glacial = TG ? TG.glacialNow() : false;
    const base = TG ? TG.climateColor(glacial) : (glacial ? [150, 205, 236] : [84, 210, 96]);
    const EG = (typeof TM_EDGE !== 'undefined') ? TM_EDGE : null;
    const grey = EG ? EG.grey : [122, 130, 132], dz = (1 - hh) * (EG ? EG.desatMax : 0.8);
    const tr = base[0] + (grey[0] - base[0]) * dz, tg = base[1] + (grey[1] - base[1]) * dz, tb = base[2] + (grey[2] - base[2]) * dz;
    let E = this._eco;
    if (!E) E = this._eco = { v: target, r: tr, g: tg, b: tb, word: -1, bk: -1, bt: -1, bird: null };
    else {
      E.v += (target - E.v) * this.HEALTH_EASE;
      const ce = this.HEALTH_COL_EASE;
      E.r += (tr - E.r) * ce; E.g += (tg - E.g) * ce; E.b += (tb - E.b) * ce;
    }
    // the state word, with a hysteresis band so it never flickers on a line
    const WD = this.HEALTH_WORDS;
    let idx = WD.length - 1;
    for (let i = 0; i < WD.length; i++) if (E.v >= WD[i][0]) { idx = i; break; }
    if (E.word < 0) E.word = idx;
    else if (idx < E.word && E.v >= WD[idx][0] + this.HEALTH_HYST) E.word = idx;
    else if (idx > E.word && E.v < WD[E.word][0] - this.HEALTH_HYST) E.word = idx;
    const P = this.TB_PAD;
    if (this.TB_PANEL_ALPHA > 0) {
      noStroke(); fill(8, 14, 12, this.TB_PANEL_ALPHA);
      rect(G.rx, G.ly, G.rR - G.rx, G.ry1 - G.ly, this.TB_RADIUS);
    }
    this._haloText(this.HEALTH_TITLE, FreckleFace, 'freckle', this.HEALTH_TITLE_SIZE, LEFT, CENTER, G.barX, G.hTitle, this._GOAL_COL);
    const bw = this.HEALTH_W, bh = this.HEALTH_BAR_H;
    fill(8, 14, 12, 170); stroke(236, 244, 240, 150); strokeWeight(2);
    rect(G.barX, G.barTop, bw, bh, bh / 2);
    noStroke();
    const fw = (bw - 6) * (E.v < 0 ? 0 : E.v > 1 ? 1 : E.v);
    if (fw > 1) { fill(E.r, E.g, E.b); rect(G.barX + 3, G.barTop + 3, fw, bh - 6, (bh - 6) / 2); }
    const wcol = E.word <= 1 ? base : E.word === 2 ? this._GOAL_COL
               : ((typeof TM_GOALS !== 'undefined' && TM_GOALS.colWrong) || [150, 155, 152]);
    this._haloText(WD[E.word][1], FreckleFace, 'freckle', this.HEALTH_WORD_SIZE, LEFT, CENTER, G.barX, G.hWord, wcol);
    const bk = sim ? (sim.ecoBirdKinds | 0) : 0, bt = sim ? (sim.ecoBirdTotal | 0) : 0;
    if (bt > 0) {
      if (bk !== E.bk || bt !== E.bt) { E.bk = bk; E.bt = bt; E.bird = 'Birds: ' + Math.min(bk, bt) + ' of ' + bt + ' kinds'; }
      this._haloText(E.bird, FreckleFace, 'freckle', this.HEALTH_BIRD_SIZE, LEFT, CENTER, G.barX, G.hBird, this._GOAL_COL);
    }
  },

  // ---- the ERUPTION CAPTION -----------------------------------------------------------------------
  // Context for the timeline's eruptions as a story beat, not text that is always on screen: a card
  // top-centre, between the two top-band panels, naming the eruption, its date and what it did. It
  // fades in as the playhead approaches one (within CAPTION_LEAD_S real seconds at the live rate),
  // holds through the eruption's charge and ash cloud (GameUI draws it AFTER the cloud), and fades out.
  // A button eruption (which seeks onto the year) and the attract's landing on Kidnappers show it under
  // their ash cloud too. One card at a time: a new eruption waits for the old card to fade.
  // ERUPTION_NOTES is co-design placeholder copy; the names and dates come from DeepTime.ERUPTIONS.
  ERUPTION_NOTES: {
    Kidnappers: 'Ash from a supervolcano in the central North Island blankets the land.',
    Kaukatea:   'A smaller eruption dusts the land with ash.',
    Whakamaru:  'One of the largest eruptions in New Zealand’s history buries the land in ash.',
    Oruanui:    'Taupō’s Oruanui eruption: the most recent supereruption on Earth.'
  },
  CAPTION_LEAD_S: 7,
  CAPTION_FADE_MS: 700,
  CAPTION_W: 900,
  CAPTION_TOP: 36,
  CAPTION_PAD: 22,
  CAPTION_TITLE_SIZE: 46,
  CAPTION_DATE_SIZE: 28,
  CAPTION_NOTE_SIZE: 28,
  _CAP_TITLE_COL: [255, 214, 150],
  _cap: { e: null, a: 0, until: 0, last: 0, title: null, date: null, lines: null, W: 0 },

  _updateCaption(g, now, W) {
    const C = this._cap, ER = DeepTime.ERUPTIONS, y = DeepTime.yearsBP;
    const rate = DeepTime.geoRate > 0 ? DeepTime.geoRate : 0;
    let want = null, until = 0;
    // approaching: the nearest eruption ahead, within the lead time at the live rate
    if (rate > 0) {
      for (let i = 0; i < ER.length; i++) {
        const e = ER[i];
        if (e.yearsBP < y && (y - e.yearsBP) <= rate * this.CAPTION_LEAD_S && (!want || e.yearsBP > want.yearsBP)) want = e;
      }
      if (want) until = now + 400;
    }
    // firing: a timeline eruption's charge (Game._tmAutoErupt); the hold covers the ash cloud after it
    if (!want && g && g._tmAutoErAt && g._tmAutoErupt) {
      want = g._tmAutoErupt; until = now + TM_TIME.cloudMillis + 1500;
    }
    // an ash cloud over an eruption year: a button eruption (it seeks onto the year), the attract landing
    if (!want && g && g._ashCloudUntil && now < g._ashCloudUntil) {
      for (let i = 0; i < ER.length; i++) if (Math.abs(y - ER[i].yearsBP) <= 25000) { want = ER[i]; break; }
      if (want) until = g._ashCloudUntil + 1200;
    }
    if (want && C.e && want !== C.e) C.until = 0;                  // fade the old card out first
    else if (want) {
      if (!C.e || C.W !== W) this._captionLayout(want, W);
      C.until = Math.max(C.until, until);
    }
    let d = C.last ? (now - C.last) / this.CAPTION_FADE_MS : 0;
    if (d > 0.1) d = 0.1;                                           // a long frame gap never jumps the fade
    C.last = now;
    const on = !!C.e && now < C.until;
    C.a += on ? d : -d;
    if (C.a > 1) C.a = 1;
    if (C.a <= 0) { C.a = 0; if (!on) C.e = null; }
  },

  // Once per caption (not per frame): its title, date and the note wrapped to the card.
  _captionLayout(e, W) {
    const C = this._cap;
    C.e = e; C.W = W;
    C.title = 'The ' + e.name + ' eruption';
    C.date = this._yearsAgo(e.yearsBP);
    const note = this.ERUPTION_NOTES[e.name] || '';
    const maxW = Math.min(this.CAPTION_W, W * 0.5) - 2 * this.CAPTION_PAD;
    push(); textFont(FreckleFace); textSize(this.CAPTION_NOTE_SIZE);
    const lines = [];
    let line = '';
    for (const word of note.split(' ')) {
      const t = line ? line + ' ' + word : word;
      if (line && textWidth(t) > maxW) { lines.push(line); line = word; } else line = t;
    }
    if (line) lines.push(line);
    pop();
    C.lines = lines;
  },

  renderEruptionCaption(g, W, H) {
    if (typeof DeepTime === 'undefined' || !DeepTime.ERUPTIONS) return;
    const now = millis();
    this._updateCaption(g, now, W);
    const C = this._cap;
    if (!C.e || C.a <= 0.004 || !C.lines) return;
    const a = C.a * C.a * (3 - 2 * C.a);
    const P = this.CAPTION_PAD, TS = this.CAPTION_TITLE_SIZE, DS = this.CAPTION_DATE_SIZE, NS = this.CAPTION_NOTE_SIZE;
    const cw = Math.min(this.CAPTION_W, W * 0.5), cx = W / 2, top = this.CAPTION_TOP, lh = NS * 1.25;
    const h = P + TS * 1.15 + DS * 1.35 + C.lines.length * lh + P * 0.6;
    push();
    noStroke(); fill(8, 14, 12, 195 * a);
    rect(cx - cw / 2, top, cw, h, 20);
    const dc = drawingContext, a0 = dc.globalAlpha;
    dc.globalAlpha = a0 * a;
    let y = top + P + TS * 0.55;
    this._blitText(C.title, FreckleFace, 'freckle', TS, CENTER, CENTER, cx, y, this._CAP_TITLE_COL);
    y += TS * 0.6 + DS * 0.75;
    this._blitText(C.date, FreckleFace, 'freckle', DS, CENTER, CENTER, cx, y, this._GOAL_COL);
    y += DS * 0.6 + lh * 0.6;
    for (let i = 0; i < C.lines.length; i++, y += lh) {
      this._blitText(C.lines[i], FreckleFace, 'freckle', NS, CENTER, CENTER, cx, y, this._GOAL_COL);
    }
    dc.globalAlpha = a0;
    pop();
  },

  // Word-wrap to GOAL_WRAP of the width, BALANCED: as few lines as greedy wrapping needs, but at the
  // narrowest width that still fits in that many, so a two-line goal splits evenly instead of
  // stranding its last word ("…than" / "today"). Runs only when the line changes.
  _wrapGoal(str, W) {
    const words = String(str).split(' ');
    const wrapAt = (maxW) => {
      const lines = [];
      let line = '';
      for (let i = 0; i < words.length; i++) {
        const tryLine = line ? line + ' ' + words[i] : words[i];
        if (line && textWidth(tryLine) > maxW) { lines.push(line); line = words[i]; }
        else line = tryLine;
      }
      if (line) lines.push(line);
      return lines;
    };
    push(); textFont(FreckleFace); textSize(this.VIS_GOAL_SIZE);
    const maxW = W * this.GOAL_WRAP;
    let lines = wrapAt(maxW);
    if (lines.length > 1) {
      let lo = 0, hi = maxW;
      for (let it = 0; it < 12; it++) {
        const mid = (lo + hi) / 2;
        if (wrapAt(mid).length > lines.length) lo = mid; else hi = mid;
      }
      lines = wrapAt(hi);
    }
    pop();
    return lines;
  },

  // Bottom-anchored: the last line sits on the anchor and earlier lines stack above it.
  _drawGoalLines(lines, col, alpha, cx, cy) {
    const dc = (typeof drawingContext !== 'undefined') ? drawingContext : null;
    const a0 = dc ? dc.globalAlpha : 1;
    if (dc) dc.globalAlpha = a0 * alpha;
    const lh = this.VIS_GOAL_SIZE * this.GOAL_LINE_H, n = lines.length;
    for (let i = 0; i < n; i++) {
      const ly = cy - (n - 1 - i) * lh;
      this._blitText(lines[i], FreckleFace, 'freckle', this.VIS_GOAL_SIZE, CENTER, CENTER, cx + 2, ly + 3, this._GOAL_HALO);
      this._blitText(lines[i], FreckleFace, 'freckle', this.VIS_GOAL_SIZE, CENTER, CENTER, cx, ly, col || this._GOAL_COL);
    }
    if (dc) dc.globalAlpha = a0;
  },

  // The ambient colour band framing the scene at all times (TM_EDGE). Hue by climate,
  // saturation by habitat health, low-passed + breathing so it ebbs. The four edge
  // gradients are cached and rebuilt only when the quantised colour (or the canvas size)
  // changes, so the per-frame cost is a save + four fillRects — no allocation in draw().
  // Fire a quick edge-ring pulse in colour `col` ([r,g,b]) — a button press or a lightning
  // strike. Rate-limited (TM_EDGE.pulseMinGapMs) so repeated strikes can't strobe the rim.
  edgePulse(g, col, ms) {
    if (!g || !col) return;
    const E = (typeof TM_EDGE !== 'undefined') ? TM_EDGE : null; if (!E) return;
    const now = (typeof millis === 'function') ? millis() : 0;
    if (g._tmEdgePulse && (now - g._tmEdgePulse.t0) < (E.pulseMinGapMs || 400)) return;
    g._tmEdgePulse = { col, t0: now, ms: (ms != null ? ms : (E.pulseMs || 700)) };   // per-pulse duration (STORM passes a short one)
  },

  _edgeCache: null,
  renderEdgeGlow(g, W, H) {
    const E = (typeof TM_EDGE !== 'undefined') ? TM_EDGE : null;
    const dc = (typeof drawingContext !== 'undefined') ? drawingContext : null;
    if (!E || !dc || !dc.createLinearGradient) return;

    // --- target colour: hue by climate (glacial index), desaturation by habitat health ---
    let gi = (typeof DeepTime !== 'undefined' && DeepTime.climate)
      ? Math.max(0, Math.min(1, DeepTime.climate().glacialIndex || 0)) : 0;
    // Bias the hue toward the extremes so the band reads DECISIVELY green (interglacial → FOREST
    // is right) or blue (glacial → TUSSOCK is right), with only a narrow ambiguous middle —
    // otherwise a cooler interglacial sits in a mid-teal that sends mixed signals about which
    // boost helps. The flip stays at 0.5 (matching the getWinterness ≥ 0.5 boost split). Monotonic
    // + continuous, and gi drifts slowly over deep time, so the band never snaps (photosensitivity).
    const hc = (E.hueContrast != null) ? E.hueContrast : 1;
    if (hc > 1) gi = (gi < 0.5) ? 0.5 * Math.pow(gi / 0.5, hc)
                                : 1 - 0.5 * Math.pow((1 - gi) / 0.5, hc);
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

    // --- interaction pulse overlay: a quick rim flash in the pulse colour over the ambient band.
    // One smooth rise+fall (sin envelope); gradients built only while a pulse is live (<pulseMs). ---
    const P = g._tmEdgePulse;
    if (P) {
      const pt = (now - P.t0) / (P.ms || E.pulseMs || 700);
      if (pt >= 1) { g._tmEdgePulse = null; }
      else if (pt >= 0) {
        const pa = Math.sin(pt * Math.PI) * (E.pulseStrength != null ? E.pulseStrength : 0.7);
        const pr = P.col[0] | 0, pg = P.col[1] | 0, pb = P.col[2] | 0;
        const pmk = (x0, y0, x1, y1) => {
          const grd = dc.createLinearGradient(x0, y0, x1, y1);
          grd.addColorStop(0,    'rgba(' + pr + ',' + pg + ',' + pb + ',1)');
          grd.addColorStop(0.45, 'rgba(' + pr + ',' + pg + ',' + pb + ',0.55)');
          grd.addColorStop(1,    'rgba(' + pr + ',' + pg + ',' + pb + ',0)');
          return grd;
        };
        dc.globalAlpha = pa;
        dc.fillStyle = pmk(0, 0, 0, depth);       dc.fillRect(0, 0, W, depth);
        dc.fillStyle = pmk(0, H, 0, H - depth);   dc.fillRect(0, H - depth, W, depth);
        dc.fillStyle = pmk(0, 0, depth, 0);       dc.fillRect(0, 0, depth, H);
        dc.fillStyle = pmk(W, 0, W - depth, 0);   dc.fillRect(W - depth, 0, depth, H);
      }
    }
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
    if (g._tmAutoErAt) {                                    // auto/timeline eruption charge — same ramp
      const c = Math.max(0, Math.min(1, (now - g._tmAutoErAt) / TM_TIME.erLongPressMs));
      a = Math.max(a, c * c * TM_TIME.ashPeak);
    }
    if (g._tmAttractErAt) {                                 // attract-loop reset buildup — same ramp
      const c = Math.max(0, Math.min(1, (now - g._tmAttractErAt) / TM_TIME.erLongPressMs));
      a = Math.max(a, c * c * TM_TIME.ashPeak);
    }
    if (g._tmPalaeoErAt) {                                  // the attract sequence's landing eruption (Palaeo 'erupt') — same ramp
      const c = Math.max(0, Math.min(1, (now - g._tmPalaeoErAt) / TM_TIME.erLongPressMs));
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
    if (g._tmAutoErAt) {                                    // auto/timeline eruption rumble — same ramp
      s = Math.max(s, Math.min(1, (now - g._tmAutoErAt) / TM_TIME.erLongPressMs));
    }
    if (g._tmAttractErAt) {                                 // attract-loop reset rumble — same ramp
      s = Math.max(s, Math.min(1, (now - g._tmAttractErAt) / TM_TIME.erLongPressMs));
    }
    if (g._tmPalaeoErAt) {                                  // the attract sequence's landing eruption — same ramp
      s = Math.max(s, Math.min(1, (now - g._tmPalaeoErAt) / TM_TIME.erLongPressMs));
    }
    if (g._ashCloudUntil && now < g._ashCloudUntil) {
      s = Math.max(s, (g._ashCloudUntil - now) / TM_TIME.cloudMillis);   // 1 at the fire -> 0 at the end
    }
    if (s <= 0) return null;
    const amp = TM_TIME.erShakeMaxPx * s * s;
    return { x: Math.sin(now * 0.043) * amp + Math.sin(now * 0.101) * amp * 0.5,
             y: Math.cos(now * 0.055) * amp + Math.sin(now * 0.087) * amp * 0.5 };
  },

  // ==========================================================
  // ERUPTION ASH COVER — one 1080p frame sequence, played once at cloudFps
  // ----------------------------------------------------------
  // The cover is a single hand-drawn animation: VolcanicAsh_Cloud_00000..00041 (42 frames,
  // 1920×1080). The frames carry the WHOLE beat themselves — they rise from clear, blanket the
  // screen, then dissipate — so there is nothing to composite or animate here beyond stepping
  // the frame at cloudFps. They warm in ONE AT A TIME after setup (_ashWarmupTick) so the boot
  // path never decodes all 42 in one go; every draw guards on the frame existing, so the cover
  // degrades to just the white ash flash until the art has warmed in. (Was: edges + a
  // papercraft-flicker plume + 20 gathering puffs — all that per-element animation is gone.)
  // ==========================================================

  ASH_CLOUD_FRAMES: 42,   // VolcanicAsh_Cloud_00000..00041 — keep TM_TIME.cloudMillis = this / cloudFps · 1000 (42/8 = 5250 ms)

  // Guard against oversized art: downsample so the LONGEST side is <= maxDim. The shipped
  // frames are 1920×1080, so at the 1920 cap used below this is a no-op — native 1080p is kept —
  // and it only bites if larger art is ever dropped in. Returns the source unchanged when it is
  // already small enough or createGraphics is unavailable (the headless harness), so it degrades
  // cleanly. The CALLER drops the raw once it holds the copy.
  _shrinkImage(src, maxDim) {
    if (typeof createGraphics !== 'function' || !src || !src.width) return src;
    const longest = Math.max(src.width, src.height);
    if (longest <= maxDim) return src;
    const s = maxDim / longest;
    const w = Math.max(1, Math.round(src.width * s)), h = Math.max(1, Math.round(src.height * s));
    const gfx = createGraphics(w, h);
    if (gfx.pixelDensity) gfx.pixelDensity(1);
    if (gfx.clear) gfx.clear();
    gfx.image(src, 0, 0, w, h);                 // graphics-method draw of the raw (not atlas-packed)
    return gfx;
  },

  // Lazy, staggered warm-up: one frame loaded per call, so the 42 cloud PNGs never all decode in
  // a single boot frame. Called every frame from update(); a no-op once done. Frames land in
  // this._ash.frames[0..41]. NEVER a silent failure callback (a missed load must be logged).
  _ashWarmupTick() {
    if (this._ash && this._ash.ready) return;
    if (!this._ashWarm) {
      const V = 'sprites/Environmental/VolcanicAsh/', N = this.ASH_CLOUD_FRAMES, q = [];
      for (let i = 0; i < N; i++) q.push({ idx: i, path: V + 'VolcanicAsh_Cloud_' + String(i).padStart(5, '0') + '.png' });
      this._ash = { frames: new Array(N).fill(null), ready: false };
      this._ashWarm = { queue: q, loading: null };
    }
    const w = this._ashWarm;
    if (w.loading) {
      const L = w.loading, im = L.img;
      if (im && im.__failed) { w.loading = null; return; }        // skip a missing frame, keep going
      if (!im || !(im.width > 0)) return;                          // still decoding — wait a frame
      this._ash.frames[L.idx] = this._shrinkImage(im, 1920);       // native 1080p kept; only over-large art resamples
      L.img = null;                                                // release the load-callback's ref (lets a resampled raw GC)
      w.loading = null;
      return;
    }
    if (w.queue.length === 0) { this._ash.ready = true; this._ashWarm = null; return; }
    const next = w.queue.shift();
    next.img = (typeof loadImage === 'function')
      ? loadImage(next.path, () => {}, () => { if (next.img) next.img.__failed = true; console.warn('[ash] could not load ' + next.path); })
      : null;
    if (!next.img) { this._ash.ready = true; this._ashWarm = null; return; }   // no loader (harness w/o stub)
    w.loading = next;
  },

  // Draw the ash cover: an OPAQUE ashy-white backdrop with the cloud frame sequence over it.
  // The window (g._ashCloudUntil) is armed to now + cloudMillis by the button (fireEruption /
  // fireEruptionReseed), an auto/timeline eruption and the attract reset, so `now → _ashCloudUntil`
  // maps to frame 0 → last at exactly cloudFps (cloudMillis is 42/8 s).
  //
  // BACKDROP: the white FLASH only reaches ~80%, so the terrain morph / sim-state SWITCH that the
  // eruption is meant to hide used to read through the thin early cloud frames and the flash. So a
  // FULLY OPAQUE ash fill is held under the cloud while it rises and covers, then faded out as the
  // animation dissipates — the new land is revealed WITH the clearing ash, "mostly through" the
  // sequence, never before it. Ramped up over BACK_RAMP_MS (a tap has no charge flash behind it)
  // and faded over >500 ms to stay inside the photosensitivity budget.
  //
  // CLOUD: the frames mostly clear themselves, but the last still carries settling cloud, so the
  // final CLOUD_FADE_MS ramps its alpha to 0 — the cover DISSOLVES rather than popping off.
  renderAshCloud(g, W, H) {
    const until = g._ashCloudUntil;
    if (!until) return;
    const now = millis();
    const remaining = until - now;
    if (remaining <= 0) return;                                     // no cover / window closed
    const A = this._ash;
    if (!A || !A.frames) return;                                    // art not warming yet
    const N = A.frames.length;
    const start = until - TM_TIME.cloudMillis;                      // when the cover opened
    const elapsed = now - start;

    // Opaque ashy-white backdrop UNDER the cloud (see header). Ramp up → hold fully opaque →
    // fade out, timed off the window so the reveal lands as the animation finishes.
    const BACK_RAMP_MS  = 500;                                      // seizure-safe rise (esp. a tap, no charge behind it)
    const BACK_HOLD_MS  = TM_TIME.cloudMillis * 0.5;               // fully opaque for the first ~half, hiding the state switch
    const BACK_CLEAR_MS = TM_TIME.cloudMillis * 0.82;             // ...cleared by "mostly through", revealing the new land
    let back;
    if (elapsed < BACK_RAMP_MS)       back = elapsed / BACK_RAMP_MS;
    else if (elapsed < BACK_HOLD_MS)  back = 1;
    else if (elapsed < BACK_CLEAR_MS) back = 1 - (elapsed - BACK_HOLD_MS) / (BACK_CLEAR_MS - BACK_HOLD_MS);
    else                              back = 0;

    let idx = Math.floor(elapsed * TM_TIME.cloudFps / 1000);       // advance at cloudFps (8 fps)
    if (idx < 0) idx = 0; else if (idx >= N) idx = N - 1;          // hold the last frame if the window outruns the art
    const fr = A.frames[idx];

    const CLOUD_FADE_MS = 1000;                                     // dissolve the cloud tail so the cover never cuts off hard
    const cloudA = remaining < CLOUD_FADE_MS ? remaining / CLOUD_FADE_MS : 1;

    push();
    noTint();
    const _dc = drawingContext, oldA = _dc.globalAlpha;
    if (back > 0) {                                                 // opaque ash fill first, UNDER the cloud
      _dc.globalAlpha = back;
      noStroke(); rectMode(CORNER); fill(205, 202, 196);
      rect(-W * 0.03, -H * 0.03, W * 1.06, H * 1.06);              // overscan so the shake bares no edge
    }
    if (fr && fr.width) {                                           // the cloud frame on top
      _dc.globalAlpha = cloudA;
      imageMode(CENTER);
      image(fr, W / 2, H / 2, W * 1.06, H * 1.06);
    }
    _dc.globalAlpha = oldA;
    pop();
  }
};