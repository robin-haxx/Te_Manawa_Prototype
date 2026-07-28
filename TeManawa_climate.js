// ============================================================
// TE MANAWA — PARAMETRIC CLIMATE
// ------------------------------------------------------------
// One pure function of yearsBP. No state, no dependencies, no p5.
//
//     Climate.at(yearsBP) -> { glacialIndex, seaLevel, snowLine,
//                              tempBias, stage, stageName, mis }
//
// This is the whole climate model. TEMANAWA_PLAN_V2.md §3.2:
// glacialIndex is a low-frequency oscillator over yearsBP, and
// everything else is a coefficient on it.
//
// Scheduled for Phase 4, landed in Phase 2 because the timeline has to
// draw era bands and cannot do that without knowing where the glacials
// are. Being a pure function it costs nothing to have early, and Phase
// 4 becomes wiring rather than invention:
//
//   Phase 4 consumes this for
//     · sea level -> coastline and dune extent
//     · snow line -> SeasonManager
//     · open      -> glacialIndex x topographic exposure
//
// ------------------------------------------------------------
// WHY THIS IS A TABLE AND NOT A SINE
//
// The first version of this file was a generic ~100 kyr oscillator.
// It produced three tidy cycles across the window and got two
// checkable facts wrong: it put MIS 5e (~125 ka) — the LAST
// INTERGLACIAL, and already a marker on our own timeline — in the
// middle of a glacial, and it never reached a glacial maximum at the
// end of the run, so the LGM went missing. Extending the window to
// 25.5 ka was done precisely to capture the LGM, so a curve that
// misses it defeats the decision.
//
// Late-Quaternary cycles are ~100 kyr but strongly asymmetric and
// genuinely irregular: MIS 7 has three separate warm peaks, MIS 5 has
// four substages, and terminations are abrupt. No closed-form curve
// gets that right, and there is no reason to guess when the record is
// well established.
//
// So: anchor points from the broad shape of the LR04 benthic stack,
// smoothstepped between. Everything the visitor sees now lands where
// it actually happened, and the anchors are auditable one line at a
// time. Ages are approximate and rounded — this is a cartoon, and the
// point is that the SHAPE and the ORDER are true.
// ============================================================

const Climate = {
  // ---- anchors: [yearsBP, glacialIndex]  (0 = interglacial, 1 = full glacial)
  // Ordered oldest -> youngest, matching the direction the run plays.
  ANCHORS: [
    [350000, 0.85],   // MIS 10 — glacial. Whakamaru erupts ~349 ka
    [335000, 0.15],   // MIS 9e — interglacial peak
    [320000, 0.45],
    [300000, 0.70],
    [270000, 0.90],   // MIS 8 — glacial maximum
    [245000, 0.25],   // MIS 7e — interglacial
    [230000, 0.50],   // MIS 7d — stadial
    [215000, 0.30],   // MIS 7c
    [195000, 0.35],   // MIS 7a
    [180000, 0.70],
    [160000, 0.85],
    [140000, 1.00],   // MIS 6 — Penultimate Glacial Maximum
    [128000, 0.10],   // Termination II — abrupt
    [122000, 0.05],   // MIS 5e — LAST INTERGLACIAL, sea level ~+6 m
    [110000, 0.35],   // MIS 5d
    [100000, 0.25],   // MIS 5c
    [ 87000, 0.40],   // MIS 5b
    [ 80000, 0.30],   // MIS 5a
    [ 65000, 0.60],   // MIS 4
    [ 50000, 0.55],   // MIS 3 — long, cool, unstable
    [ 40000, 0.60],
    [ 30000, 0.80],
    [ 21000, 1.00],   // MIS 2 — LAST GLACIAL MAXIMUM
    [ 18000, 0.95]
  ],

  // Named intervals, for the timeline and the debug overlay.
  MIS: [
    [350000, 340000, 'MIS 10'], [340000, 300000, 'MIS 9'],
    [300000, 245000, 'MIS 8'],  [245000, 190000, 'MIS 7'],
    [190000, 130000, 'MIS 6'],  [130000,  80000, 'MIS 5'],
    [ 80000,  57000, 'MIS 4'],  [ 57000,  29000, 'MIS 3'],
    [ 29000,  14000, 'MIS 2']
  ],

  // ---- coefficients on glacialIndex ------------------------
  seaLevelWarm:   6,      // metres rel. present. MIS 5e stood ~+6 m
  seaLevelCold: -125,     // LGM lowstand
  snowLineWarm:   0.92,   // normalised elevation, matches SeasonManager
  snowLineCold:   0.55,
  tempWarm:       0,      // degrees C rel. present
  tempCold:      -5,

  // ==========================================================
  // THE CURVE
  // ==========================================================
  glacialIndexAt(yearsBP) {
    const a = this.ANCHORS;

    // Outside the table, hold the end values rather than extrapolating.
    if (yearsBP >= a[0][0]) return a[0][1];
    if (yearsBP <= a[a.length - 1][0]) return a[a.length - 1][1];

    for (let i = 0; i < a.length - 1; i++) {
      const [y0, g0] = a[i], [y1, g1] = a[i + 1];
      if (yearsBP <= y0 && yearsBP >= y1) {
        const t = (y0 - yearsBP) / (y0 - y1);
        const s = t * t * (3 - 2 * t);           // smoothstep
        return g0 + (g1 - g0) * s;
      }
    }
    return a[a.length - 1][1];
  },

  // ==========================================================
  // THE FULL STATE
  // ==========================================================
  at(yearsBP) {
    const g = this.glacialIndexAt(yearsBP);
    return {
      glacialIndex: g,
      seaLevel:  this.seaLevelWarm + (this.seaLevelCold - this.seaLevelWarm) * g,
      snowLine:  this.snowLineWarm + (this.snowLineCold - this.snowLineWarm) * g,
      tempBias:  this.tempWarm     + (this.tempCold     - this.tempWarm)     * g,
      stage:     this.stageOf(g),
      stageName: this.stageNameOf(g),
      mis:       this.misAt(yearsBP)
    };
  },

  // Four readable bands. Used by the timeline shading and the debug overlay;
  // the sim itself reads glacialIndex directly and never these.
  stageOf(g) {
    if (g < 0.25) return 0;   // interglacial
    if (g < 0.50) return 1;   // cooling
    if (g < 0.75) return 2;   // glacial
    return 3;                 // full glacial
  },

  stageNameOf(g) {
    return ['interglacial', 'cooling', 'glacial', 'full glacial'][this.stageOf(g)];
  },

  misAt(yearsBP) {
    for (const [y0, y1, name] of this.MIS) {
      if (yearsBP <= y0 && yearsBP > y1) return name;
    }
    return '';
  },

  // ==========================================================
  // ANALYSIS — for the timeline and for tuning
  // ==========================================================
  // Samples the curve across the run so the timeline can draw the wave and
  // shade the cold bands. Cheap, but call it once and keep the result: the
  // curve is fixed for the life of the page.
  sample(yearsStart, yearsEnd, n = 240) {
    const out = new Array(n);
    for (let i = 0; i < n; i++) {
      const yr = yearsStart + (yearsEnd - yearsStart) * (i / (n - 1));
      out[i] = { yearsBP: yr, g: this.glacialIndexAt(yr) };
    }
    return out;
  },

  // Glacial maxima inside a window — so the timeline can mark them and so the
  // tuning can be checked against "about three breaths".
  maxima(yearsStart, yearsEnd, n = 800) {
    const s = this.sample(yearsStart, yearsEnd, n);
    const peaks = [];
    for (let i = 1; i < s.length - 1; i++) {
      if (s[i].g > s[i - 1].g && s[i].g >= s[i + 1].g && s[i].g > 0.6) {
        peaks.push({ yearsBP: s[i].yearsBP, g: s[i].g });
      }
    }
    return peaks;
  }
};

// Node/bootcheck can require this file directly to test the curve without p5.
if (typeof module !== 'undefined' && module.exports) module.exports = { Climate };
