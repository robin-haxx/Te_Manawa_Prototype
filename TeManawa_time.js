// ============================================================
// TE MANAWA — DEEP TIME
// ------------------------------------------------------------
// Owns the run's clock: yearsBP, the time multiplier, the Deep-time
// button's ramp, and what happens when the window runs out.
//
// yearsBP is AUTHORITATIVE. Geology and climate are keyed to it, not to
// wall-clock or frame count, so events land in the right place at any
// speed — which is the entire point of having a fast-forward button.
//
// TEMANAWA_PLAN_V2.md §8 Phase 2.
// ============================================================

const DeepTime = {
  // ---- the window ------------------------------------------
  yearsStart: 345000,   // opens just after the Whakamaru eruption (~349 ka)
  yearsEnd:    25500,   // closes on Oruanui, heading into the LGM

  // ---- rates -----------------------------------------------
  yrPerSec:   500,      // baseline sim-years per real second at scale 1
  fps:         60,

  // Deep-time button. TEMANAWA_PLAN.md §5: ~50,000 years in ~10 seconds.
  deepMult:    10,
  deepSeconds: 10,

  // The ramp. A hard step to 10x visibly jolts — the terrain, the season
  // cross-fade and every boid all change speed on one frame. Easing in and out
  // over ~1.2 s costs nothing and reads as the piece accelerating rather than
  // as a glitch. rampSeconds is counted INSIDE deepSeconds, not added to it.
  rampSeconds: 1.2,

  // ---- state -----------------------------------------------
  yearsBP:     345000,
  timeScale:   1,
  _deepUntil:  0,
  _deepFrom:   0,
  _ended:      false,

  // ==========================================================
  reset() {
    this.yearsBP   = this.yearsStart;
    this.timeScale = 1;
    this._deepUntil = 0;
    this._deepFrom  = 0;
    this._ended     = false;
  },

  // ---- the Deep-time button --------------------------------
  pressDeep() {
    const now = millis();
    this._deepFrom  = now;
    this._deepUntil = now + this.deepSeconds * 1000;
  },

  isDeep() {
    return this._deepUntil && millis() < this._deepUntil;
  },

  // Eased multiplier: ramp up over rampSeconds, hold, ramp back down.
  currentScale() {
    if (!this.isDeep()) return 1;
    const now = millis();
    const ramp = this.rampSeconds * 1000;
    const since  = now - this._deepFrom;
    const remain = this._deepUntil - now;
    const t = Math.max(0, Math.min(1, Math.min(since / ramp, remain / ramp)));
    const eased = t * t * (3 - 2 * t);                  // smoothstep
    return 1 + (this.deepMult - 1) * eased;
  },

  // ==========================================================
  // UPDATE — called once per frame from Game.update()
  // Returns the multiplier the rest of the sim should run at.
  // ==========================================================
  update(dt) {
    this.timeScale = this.currentScale();

    const years = (dt / this.fps) * this.yrPerSec * this.timeScale;
    this.yearsBP -= years;

    if (this.yearsBP <= this.yearsEnd) {
      this.yearsBP = this.yearsEnd;
      this._ended = true;
    }

    return this.timeScale;
  },

  // The run reaching Oruanui is not a fail state and not a pause — it is the
  // attract loop's cue. Without this the kiosk sits frozen at 25.5 ka until
  // somebody touches it, which on an unattended screen means most of the day.
  // Game.update() checks this and hands off to Kiosk.resetToAttract().
  hasEnded() {
    return this._ended;
  },

  // ---- readouts --------------------------------------------
  progress() {
    return (this.yearsStart - this.yearsBP) / (this.yearsStart - this.yearsEnd);
  },

  // Real seconds for the whole window at the baseline rate — the number that
  // decides how long an unattended cycle takes. At 500 yr/s that is ~10.6 min.
  windowSeconds() {
    return (this.yearsStart - this.yearsEnd) / this.yrPerSec;
  },

  climate() {
    return Climate.at(this.yearsBP);
  },

  // Map a year to an x position on a timeline of width w starting at x0.
  yearToX(yr, x0, w) {
    return x0 + ((this.yearsStart - yr) / (this.yearsStart - this.yearsEnd)) * w;
  },

  label() {
    return '~ ' + (Math.round(this.yearsBP / 1000) * 1000).toLocaleString() + ' years ago';
  }
};

// Timeline markers. Content is a co-design hook — these are placeholders with
// correct dates, not final label text.
const DEEP_TIME_MARKERS = [
  { yearsBP: 345000, label: 'Whakamaru',  kind: 'eruption' },
  { yearsBP: 270000, label: 'MIS 8',      kind: 'glacial'  },
  { yearsBP: 140000, label: 'MIS 6',      kind: 'glacial'  },
  { yearsBP: 122000, label: 'MIS 5e',     kind: 'warm'     },
  { yearsBP:  30000, label: 'LGM',        kind: 'glacial'  },
  { yearsBP:  25500, label: 'Oruanui',    kind: 'eruption' }
];

if (typeof module !== 'undefined' && module.exports) module.exports = { DeepTime, DEEP_TIME_MARKERS };
