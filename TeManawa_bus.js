// ============================================================
// TE MANAWA: SECOND-SCREEN BUS (sim side)
// ------------------------------------------------------------
// The diorama's half of the BroadcastChannel link to the 1080p touchscreen
// console (secondscreen/). Receives INTENTS and drives the sim; emits TELEMETRY
// so the console's KYA / glacial-interglacial / goal / timelapse readout tracks
// the clock. The message vocabulary is md/TEMANAWA_SECOND_SCREEN.md §3, kept
// identical to secondscreen/bus.js.
//
// LOAD LAST in index.html (after sketch.js): it reaches for `game`, `InstallHUD`,
// `DeepTime`, `Climate`, `PLANT_TYPES`. Guarded throughout so the diorama runs
// IDENTICALLY with no console present: every handler no-ops until `game` exists,
// and if BroadcastChannel is unavailable the whole module is inert.
//
// STATUS (md/TEMANAWA_SECOND_SCREEN.md §7 — the sim overhaul is now built):
//   · storm / eruption / deep  : wired to the existing seams. Live.
//   · boost                    : the REAL model — regime-fit gate → per-species seed
//                                (Simulation.seedSpecies) → ramped timelapse to the next
//                                regime boundary (DeepTime.beginTimelapse), eruption-aware
//                                (§6.3). Replaces the interim growth-press stub.
//   · habitat / plant          : accepted and ignored (optional sim-side highlight, §3.1).
//   · clock / goal / timelapse : live telemetry; goal from Climate.nextRegimeBoundary (§7.1).
// ============================================================

// Boost / timelapse tunables — console-tunable like TM_TIME / TM_GROW / TM_EDGE.
const TM_BOOST = {
  matchedSeed:        12,   // plants a climate-MATCHED boost seeds of the chosen species (generous)
  mismatchedSeed:      0,   // a wrong-for-the-climate boost seeds NOTHING — the scene desaturates (the lesson)
  faunaRecruit:        2,   // birds of EACH linked species a matched boost founds on-screen (the fauna coupling)
  eruptionLeadYears: 300,   // stop a timelapse this many years BEFORE an intervening eruption...
  eruptionFireDelayMs: 2000, // ...then fire it this long after the boost result settles (§6.3)
  outlineMs:        22000,  // how long a boost keeps its coloured sprite outline (≈ the timelapse length)
  // Matched-boost OUTLINE colours, climate-keyed to MATCH the ambient band + FOREST/TUSSOCK buttons
  // (blue = glacial everywhere, so a boost reads consistently with the scene): a successful
  // INTERGLACIAL boost rings GREEN, a successful GLACIAL boost rings BLUE. A wrong-for-the-climate
  // boost stays grey. Tunable here.
  outlineInterglacial: [ 84, 210,  96],   // green
  outlineGlacial:      [150, 205, 236],   // blue
  outlineWrong:        [128, 132, 130],   // grey
  // Confirmed plant → linked fauna (species keys) for the outline highlight, from spec §5: a boost
  // rings the chosen plant AND the birds it supports. A boost message may also carry m.fauna to
  // override/extend this per boost (the second screen's encyclopedia is the fuller source).
  faunaLinks: {
    Totara:      ['eyles_harrier', 'young_eyles_harrier'],
    manuka:      ['kokako'],
    cabbagetree: ['kereru'],
    beech:       ['huia']
  }
};
try { if (typeof window !== 'undefined') window.TM_BOOST = TM_BOOST; } catch (_) {}

const TMBus = (function () {
  const CHANNEL = 'temanawa';
  let ch = null;

  try { ch = new BroadcastChannel(CHANNEL); } catch (_) { ch = null; }

  const G = () => (typeof game !== 'undefined' && game) ? game : null;
  function reply(msg) { try { if (ch) ch.postMessage(msg); } catch (_) {} }

  // Per-boost state carried from onBoost() to the timelapse-end handler.
  let _boostMatched = null;      // the regime-fit verdict at boost time → the goal 'achieved' flag
  let _pendingEruption = null;   // an eruption the timelapse stopped short of, fired a beat after it ends
  let _wasTimelapsing = false;   // edge-detect the timelapse ending, in the heartbeat

  // ---- regime-boundary finder ------------------------------
  // Delegates to the pure Climate.nextRegimeBoundary (§7.1) so the goal readout and the timelapse
  // target can never disagree. Returns { targetYearsBP, targetStage, targetStageName } or null.
  function nextRegimeBoundary(yearsBP) {
    if (typeof Climate !== 'undefined' && typeof Climate.nextRegimeBoundary === 'function' &&
        typeof DeepTime !== 'undefined') {
      const b = Climate.nextRegimeBoundary(yearsBP, DeepTime.yearsEnd);
      return b ? { targetYearsBP: b.yearsBP, targetStage: b.stage, targetStageName: b.stageName } : null;
    }
    return null;
  }

  // ==========================================================
  // INTENTS  (console → sim)
  // ==========================================================
  function onMessage(m) {
    const g = G();
    switch (m.type) {
      case 'hello':
        emitClock(); emitGoal(); break;

      case 'storm':
        if (g && typeof InstallHUD !== 'undefined') InstallHUD.press(g, 'storm');
        break;

      case 'deep':
        if (g && typeof InstallHUD !== 'undefined') InstallHUD.press(g, 'deep');
        break;

      case 'eruption':
        if (g && typeof InstallHUD !== 'undefined') {
          if (m.phase === 'down') InstallHUD.erDown(g);
          else if (m.phase === 'up') InstallHUD.erUp(g);
        }
        break;

      case 'boost':
        onBoost(m); break;

      case 'habitat':
      case 'plant':
        // Accepted; no sim-side effect yet (optional highlight/focus, §3.1).
        break;
    }
  }

  // THE BOOST (md/TEMANAWA_SECOND_SCREEN.md §6.1). Regime-fit gate → seed especially the chosen
  // species → ramped timelapse to the next boundary. Exposed as TMBus.boost(msg) so it is testable.
  function onBoost(m) {
    const g = G();
    const key = m && m.plantKey;
    if (!key) return;
    const defs = (typeof PLANT_TYPES !== 'undefined') ? PLANT_TYPES : null;
    const def  = defs ? defs[key] : null;
    const warmMax = (typeof TM_GROW !== 'undefined' && TM_GROW.warmMax != null) ? TM_GROW.warmMax : 0.65;
    const coldMin = (typeof TM_GROW !== 'undefined' && TM_GROW.coldMin != null) ? TM_GROW.coldMin : 0.75;
    const ct  = (def && def.coldTolerance != null) ? def.coldTolerance : 0.5;
    const thr = (typeof Climate !== 'undefined' && Climate.regimeThreshold != null) ? Climate.regimeThreshold : 0.5;
    const glacial = (typeof Climate !== 'undefined' && typeof DeepTime !== 'undefined')
      ? Climate.glacialIndexAt(DeepTime.yearsBP) >= thr : false;

    // Regime fit: a warm species (low coldTolerance) wants the interglacial, a cold species the
    // glacial; a mid-tolerance pioneer (mānuka/flax) is NEUTRAL and establishes in either.
    const warmSpecies = ct <= warmMax, coldSpecies = ct >= coldMin;
    let matched;
    if (warmSpecies) matched = !glacial;
    else if (coldSpecies) matched = glacial;
    else matched = true;

    reply({ type: 'boostResult', plantKey: key, matched: matched });

    // Populate ESPECIALLY with the chosen species (§6.1 / §9.2): a matched boost seeds generously,
    // a mismatched boost seeds nothing and the scene desaturates (the regime-fit lesson below).
    const n = matched ? (TM_BOOST.matchedSeed || 12) : (TM_BOOST.mismatchedSeed || 0);
    const seeder = (g && g.simulation && typeof g.simulation.seedSpecies === 'function')
      ? g.simulation.seedSpecies.bind(g.simulation) : null;
    if (seeder && n > 0) seeder(key, n);

    // Fauna coupling (§6.1/§9.3): a MATCHED boost also RECRUITS a few of the birds this plant
    // supports — founded on-screen so the visitor sees the animals answer the plant. A mismatched
    // boost recruits nothing (the birds don't thrive in the wrong climate either). Same link map as
    // the outline; a boost message may also carry m.fauna. `young_*` variants are skipped by boostFauna.
    if (matched && g && g.simulation && typeof g.simulation.boostFauna === 'function') {
      const faunaKeys = (Array.isArray(m.fauna) && m.fauna.length) ? m.fauna
                      : (TM_BOOST.faunaLinks && TM_BOOST.faunaLinks[key]);
      if (faunaKeys) g.simulation.boostFauna(faunaKeys, TM_BOOST.faunaRecruit || 2);
    }

    if (g) {
      // Reuse the EXISTING regime-fit lesson (Game._updateHabitatHealth + the ambient rim): a
      // warm/cold species arms the matching grow timer so a WRONG-climate boost desaturates exactly
      // like a wrong FOREST/TUSSOCK press; a neutral pioneer arms neither (it fits either climate).
      const nowMs = (typeof millis === 'function') ? millis() : 0;
      if (typeof TM_TIME !== 'undefined') {
        if (warmSpecies) g._tmGrowWarmUntil = nowMs + TM_TIME.growWarmSeconds * 1000;
        else if (coldSpecies) g._tmGrowColdUntil = nowMs + TM_TIME.growColdSeconds * 1000;
      }
      if (typeof InstallHUD !== 'undefined') {
        if (InstallHUD.beginWind && (warmSpecies || coldSpecies)) InstallHUD.beginWind(g, warmSpecies ? 'warm' : 'cold');
        if (InstallHUD.edgePulse && typeof TM_EDGE !== 'undefined') {
          InstallHUD.edgePulse(g, matched ? (glacial ? TM_EDGE.pulseTussock : TM_EDGE.pulseForest) : TM_EDGE.pulseWrong);
        }
      }

      // Coloured OUTLINE on the boosted plants + their linked birds (EntitySprites.boostOutline).
      // Climate-keyed for a successful boost: INTERGLACIAL → green, GLACIAL → blue (matching the
      // ambient band + buttons, so blue = glacial everywhere); a wrong-for-the-climate boost stays
      // grey. GL-batched → no extra draw call. (Colours in TM_BOOST.outline*.)
      const hiKeys = new Set([key]);
      const linked = (Array.isArray(m.fauna) && m.fauna.length) ? m.fauna
                   : (TM_BOOST.faunaLinks && TM_BOOST.faunaLinks[key]);
      if (linked) for (let i = 0; i < linked.length; i++) hiKeys.add(linked[i]);
      const hiCol = matched ? (glacial ? TM_BOOST.outlineGlacial : TM_BOOST.outlineInterglacial)
                            : TM_BOOST.outlineWrong;
      g._boostHi = { keys: hiKeys, color: hiCol || [255, 220, 90],
                     until: nowMs + (TM_BOOST.outlineMs || 22000) };
    }

    beginBoostTimelapse(matched);
  }

  // Begin the ramped timelapse for a boost (§6.2). Target = the next regime boundary; if an eruption
  // falls before it, stop JUST before the eruption (so the clock's own crossing check won't fire it
  // mid-timelapse) and fire it a beat after the boost result settles (§6.3). Cheap climate/forest
  // drift carries the ~20 s; the terrain morphs along the way as it does under a deep burst.
  function beginBoostTimelapse(matched) {
    _boostMatched = matched;
    _pendingEruption = null;
    if (typeof DeepTime === 'undefined' || typeof DeepTime.beginTimelapse !== 'function') return;

    const from = DeepTime.yearsBP;
    const boundary = nextRegimeBoundary(from);
    let target = boundary ? boundary.targetYearsBP : DeepTime.yearsEnd;

    // Intervening eruption: the oldest (largest-year) not-yet-fired eruption between the target and
    // now — the first one the forward-playing clock would reach.
    const g = G();
    const fired = (g && g._firedEruptions) ? g._firedEruptions : null;
    const lead  = TM_BOOST.eruptionLeadYears || 300;
    if (DeepTime.ERUPTIONS) {
      let best = null;
      for (const e of DeepTime.ERUPTIONS) {
        if (e.yearsBP < from && e.yearsBP > target && !(fired && fired.has(e.yearsBP))) {
          if (best === null || e.yearsBP > best.yearsBP) best = e;
        }
      }
      if (best) {
        target = best.yearsBP + lead;
        _pendingEruption = best;
        reply({ type: 'eruptionSoon', name: best.name, yearsBP: best.yearsBP });
      }
    }

    const began = DeepTime.beginTimelapse(target);
    if (!began) {
      // Nothing to play (target not younger than now — e.g. a boost taken right on an eruption):
      // fire the pending eruption directly rather than stranding it.
      if (_pendingEruption) { const er = _pendingEruption; _pendingEruption = null; fireEruptionInPlace(er); }
      _boostMatched = null;
      return;
    }
    emitGoal(); emitTimelapse();
  }

  function fireEruptionInPlace(er) {
    const g = G();
    if (!g) return;
    if (typeof g._fireEruptionInPlace === 'function') g._fireEruptionInPlace(er);
    else if (typeof g.applyAsh === 'function') g.applyAsh(er);
    emitClock();
  }

  // The timelapse just ended (edge-detected in the heartbeat): send the goal verdict and, if the
  // timelapse stopped short of an eruption, fire it a couple seconds later (§6.3).
  function onTimelapseEnd() {
    reply({ type: 'timelapse', active: false, progress: 1, yrPerSec: 0, achieved: _boostMatched });
    emitClock(); emitGoal();
    if (_pendingEruption) {
      const er = _pendingEruption; _pendingEruption = null;
      const delay = TM_BOOST.eruptionFireDelayMs || 2000;
      try { setTimeout(() => fireEruptionInPlace(er), delay); } catch (_) { fireEruptionInPlace(er); }
    }
    _boostMatched = null;
  }

  // ==========================================================
  // TELEMETRY  (sim → console)
  // ==========================================================
  function emitClock() {
    if (!ch || typeof DeepTime === 'undefined' || typeof Climate === 'undefined') return;
    const y = DeepTime.yearsBP;
    const g = Climate.glacialIndexAt(y);
    reply({ type: 'clock', yearsBP: y, glacialIndex: g,
            stage: Climate.stageOf(g), stageName: Climate.stageNameOf(g), mis: Climate.misAt(y) });
  }

  function emitGoal() {
    if (!ch || typeof DeepTime === 'undefined') return;
    const goal = nextRegimeBoundary(DeepTime.yearsBP);
    if (goal) reply({ type: 'goal', targetYearsBP: goal.targetYearsBP,
                      targetStage: goal.targetStage, targetStageName: goal.targetStageName });
  }

  // Live timelapse state off the real ramp (DeepTime): progress + the current yr/s the ramp is at.
  function emitTimelapse() {
    if (!ch || typeof DeepTime === 'undefined') return;
    const active = DeepTime.isTimelapsing ? DeepTime.isTimelapsing() : false;
    reply({ type: 'timelapse', active: !!active,
            progress: (active && DeepTime.timelapseProgress) ? DeepTime.timelapseProgress() : 0,
            yrPerSec: (active && DeepTime._tlRate) ? Math.round(DeepTime._tlRate()) : 0,
            achieved: null });
  }

  // Own heartbeat: not the frame loop, so this never allocates in draw() and runs even before
  // setup(). ~4/s clock + goal; timelapse telemetry only while one is running, and the goal verdict
  // the moment it ends. (This realises §7.5 off the bus rather than Game.update, so telemetry never
  // rides the 60 fps draw path.)
  function tick() {
    emitClock();
    emitGoal();
    const now = (typeof DeepTime !== 'undefined' && DeepTime.isTimelapsing) ? DeepTime.isTimelapsing() : false;
    if (now) emitTimelapse();
    if (_wasTimelapsing && !now) onTimelapseEnd();
    _wasTimelapsing = now;
  }

  let started = false;
  function start() {
    if (started || !ch) return;
    started = true;
    ch.onmessage = (e) => { const m = e && e.data; if (m && typeof m === 'object') { try { onMessage(m); } catch (_) {} } };
    setInterval(tick, 250);
  }

  start();
  return {
    available() { return !!ch; },
    emitClock, emitGoal, emitTimelapse, nextRegimeBoundary,
    boost: onBoost   // testable entry point (also usable from the console)
  };
})();
