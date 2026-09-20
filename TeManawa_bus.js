// ============================================================
// TE MANAWA: SECOND-SCREEN BUS (sim side)
// ------------------------------------------------------------
// The diorama's half of the BroadcastChannel link to the 1080p touchscreen
// console (secondscreen/). Receives INTENTS and drives the sim; emits TELEMETRY
// so the console's KYA / glacial-interglacial / goal readout tracks the clock.
// The message vocabulary is md/TEMANAWA_SECOND_SCREEN.md §3, kept identical to
// secondscreen/bus.js.
//
// LOAD LAST in index.html (after sketch.js): it reaches for `game`, `InstallHUD`,
// `DeepTime`, `Climate`, `PLANT_TYPES`. Guarded throughout so the diorama runs
// IDENTICALLY with no console present: every handler no-ops until `game` exists,
// and if BroadcastChannel is unavailable the whole module is inert.
//
// STATUS (see §7):
//   · storm / eruption / deep  : wired to the EXISTING seams. Live today.
//   · boost                    : INTERIM, drives the existing climate-appropriate
//                                growth (InstallHUD.press growWarm/growCold) so the
//                                boost visibly works now, and upgrades to per-species
//                                seeding automatically once Simulation.seedSpecies (§7.3)
//                                lands. The timelapse-to-next-boundary + eruption-aware
//                                ending (§6.2–6.3) are NOT wired here yet.
//   · habitat / plant          : accepted and ignored (optional sim-side highlight, §3.1).
//   · goal / clock telemetry   : live, from an interim boundary finder (moves to
//                                Climate.nextRegimeBoundary in §7.1).
// ============================================================

const TMBus = (function () {
  const CHANNEL = 'temanawa';
  let ch = null;

  try { ch = new BroadcastChannel(CHANNEL); } catch (_) { ch = null; }

  const G = () => (typeof game !== 'undefined' && game) ? game : null;
  function reply(msg) { try { if (ch) ch.postMessage(msg); } catch (_) {} }

  // ---- interim regime-boundary finder ----------------------
  // Scans forward (younger, toward yearsEnd) for the first year at which the
  // glacial index crosses the interglacial/glacial line, i.e. the start of the
  // NEXT regime. Interim: §7.1 makes this a pure Climate.nextRegimeBoundary the
  // timelapse also uses. Returns { targetYearsBP, targetStageName } or null.
  function nextRegimeBoundary(yearsBP) {
    if (typeof Climate === 'undefined' || typeof DeepTime === 'undefined') return null;
    const end = DeepTime.yearsEnd;
    const cold0 = Climate.glacialIndexAt(yearsBP) >= 0.5;
    const step = 1000;
    for (let y = yearsBP - step; y >= end; y -= step) {
      const cold = Climate.glacialIndexAt(y) >= 0.5;
      if (cold !== cold0) {
        return { targetYearsBP: y, targetStageName: cold ? 'glacial' : 'interglacial' };
      }
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

  // INTERIM boost: see the STATUS note at the top of the file.
  function onBoost(m) {
    const g = G();
    if (!g || typeof InstallHUD === 'undefined') return;
    const key = m.plantKey;
    const defs = (typeof PLANT_TYPES !== 'undefined') ? PLANT_TYPES : null;
    const def = defs ? defs[key] : null;
    const warmMax = (typeof TM_GROW !== 'undefined' && TM_GROW.warmMax != null) ? TM_GROW.warmMax : 0.65;
    const ct = (def && def.coldTolerance != null) ? def.coldTolerance : 0.5;
    const warm = ct <= warmMax;   // low cold-tolerance → an interglacial (warm) species

    const matched = InstallHUD._growMatches ? InstallHUD._growMatches(g, warm) : null;

    // Forward-compat: once a per-species seeder exists (§7.3), prefer it on a matched
    // boost; otherwise the growth press below does the set-wide seeding as it does today.
    const seeder = (g.simulation && typeof g.simulation.seedSpecies === 'function') ? g.simulation.seedSpecies.bind(g.simulation) : null;
    if (seeder && matched) {
      const n = (typeof TM_GROW !== 'undefined' && TM_GROW.seedCount) ? TM_GROW.seedCount : 6;
      seeder(key, n);
    }
    // Light the button + run the regime-fit lesson (and, absent a per-species seeder, seed the set).
    InstallHUD.press(g, warm ? 'growWarm' : 'growCold');

    reply({ type: 'boostResult', plantKey: key, matched: matched });
    // TODO §6.2–6.3: begin the ramped timelapse to nextRegimeBoundary(), stopping early at a
    // looming eruption and firing it a beat later. Needs the paused clock + ramp (§7.2).
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
    if (goal) reply({ type: 'goal', targetYearsBP: goal.targetYearsBP, targetStageName: goal.targetStageName });
  }

  // Interim timelapse telemetry off the EXISTING deep-time press, so the console's
  // progress bar moves today. §7.2 replaces this with the real 500→5000 ramp state.
  function emitTimelapse() {
    if (!ch || typeof DeepTime === 'undefined') return;
    const active = DeepTime.isDeep && DeepTime.isDeep();
    reply({ type: 'timelapse', active: !!active,
            progress: active ? 0.5 : 0, yrPerSec: active ? DeepTime.yrPerSec * DeepTime.deepMult : 0,
            achieved: null });
  }

  // Own heartbeat: not the frame loop, so this never allocates in draw() and runs
  // even before setup(). ~4/s clock, goal recomputed alongside it.
  let started = false;
  function start() {
    if (started || !ch) return;
    started = true;
    ch.onmessage = (e) => { const m = e && e.data; if (m && typeof m === 'object') { try { onMessage(m); } catch (_) {} } };
    setInterval(() => { emitClock(); emitGoal(); emitTimelapse(); }, 250);
  }

  start();
  return { available() { return !!ch; }, emitClock, emitGoal, emitTimelapse, nextRegimeBoundary };
})();
