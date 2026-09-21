// ============================================================
// TE MANAWA: DEEP TIME
// ------------------------------------------------------------
// Owns the run's clock: yearsBP, the time multiplier, the Deep-time
// button's ramp, and what happens when the window runs out.
//
// yearsBP is authoritative. Geology and climate are keyed to it, not to
// wall-clock or frame count, so events land in the right place at any
// speed, which is the point of the fast-forward button.
//
// TEMANAWA_PLAN_V3.md §13.
// ============================================================

const DeepTime = {
  // ---- the window ------------------------------------------
  // These bound the run (and the timeline UI), not the geology: the ranges/river state is
  // keyed to absolute dates in TerrainGenerator.GEO_EPOCHS, so you can shrink or shift this
  // window to zoom into any era for debugging and the terrain still reads true for the date.
  yearsStart: 1000000,  // opens at ~1 Ma, the ranges' earliest stages; they rise across the run
  yearsEnd:    25500,   // closes on Oruanui, heading into the LGM

  // ---- eruptions -------------------------------------------
  // The four TVZ events inside the window, oldest to youngest. This is the single
  // source of truth: DEEP_TIME_MARKERS (below) and the Eruption button both read it.
  //   tier      clearing severity for the disturb/regen mechanic.
  //   skip      a forward-skip target (long press). Oruanui is `false`: its fallout
  //             sits too close to the present to show, so a forward skip past
  //             Whakamaru wraps to Kidnappers rather than landing on it.
  //   terminal  the run's closing ash beat; reached by the clock, never by a skip.
  // Ages: Kidnappers/Potaka ~1.0 Ma (Mangakino), Kaukatea ~0.9 Ma, Whakamaru/Rangitawa
  // 349 ka, Kawakawa/Oruanui ~25.5 ka. See md/TEMANAWA_DEEPTIME_ECOLOGY_PLAN.md.
  ERUPTIONS: [
    { yearsBP: 1000000, name: 'Kidnappers', tier: 'major',        skip: true  },
    { yearsBP:  900000, name: 'Kaukatea',   tier: 'minor',        skip: true  },
    { yearsBP:  349000, name: 'Whakamaru',  tier: 'catastrophic', skip: true  },
    { yearsBP:   25500, name: 'Oruanui',    tier: 'major',        skip: false, terminal: true }
  ],

  // ---- rates -----------------------------------------------
  yrPerSec:   500,      // baseline sim-years per real second at scale 1
  fps:         60,

  // DEEP BURST (legacy button 1), see TEMANAWA_PLAN_V3.md §3: ~50,000 years in ~10 seconds.
  deepMult:    10,
  deepSeconds: 10,

  // ACCESSIBILITY: make sure this is suitable for photosensitivity
  rampSeconds: 1.2,

  // ---- the second-screen timelapse (md/TEMANAWA_SECOND_SCREEN.md §0/§6.2/§7.2) ----
  // Geology is PAUSED BY DEFAULT: update() holds yearsBP (and, since the terrain morph keys off
  // yearsBP drift, the land too) unless a timelapse or a legacy deep burst is running. The AMBIENT
  // LIFE clock keeps running the whole time — update() returns a life scale that is 1× when paused
  // and speeds up under a timelapse, so animals forage and plants grow at a fixed date, then live
  // through the fast-forward when a boost is spent. A timelapse eases the RATE from tlStartRate →
  // tlMaxRate over tlRampSeconds and plays yearsBP down to a target year (the next regime boundary,
  // or an intervening eruption). The ramp is a slow ~20 s ease, well inside the photosensitivity
  // budget (≥500 ms, ≤3 luminance transitions/s — TEMANAWA_BUILD_V3.md §3).
  tlStartRate:   500,     // yr/s at the start of a timelapse ramp
  tlMaxRate:     5000,    // yr/s the ramp eases up to and holds
  tlRampSeconds: 20,      // real seconds to ease start → max

  // ---- state -----------------------------------------------
  yearsBP:     1000000,
  timeScale:   1,
  _deepUntil:  0,
  _deepFrom:   0,
  _ended:      false,
  _timelapse:  false,     // a boost timelapse is playing yearsBP toward _tlTarget
  _tlTarget:   0,
  _tlFrom:     0,         // millis() at begin, for the rate ramp
  _tlStartYear: 0,        // yearsBP at begin, for the progress readout

  // ==========================================================
  reset() {
    this.yearsBP   = this.yearsStart;
    this.timeScale = 1;
    this._deepUntil = 0;
    this._deepFrom  = 0;
    this._ended     = false;
    this._timelapse = false;
    this._tlTarget  = 0;
  },

  // ---- seek: jump the clock to a date ----------------------
  // Used by the Eruption button's skip/revert navigation. Sets yearsBP directly
  // (clamped to the window), cancels any deep-time ramp, and clears the ended
  // flag so a seek back from the close re-enables play. The terrain morph and the
  // living world are the caller's responsibility (HUD: morph to the year, then
  // soft-regen); this only owns the clock.
  seekTo(yearsBP) {
    this.yearsBP   = Math.max(this.yearsEnd, Math.min(this.yearsStart, yearsBP));
    this.timeScale = 1;
    this._deepUntil = 0;
    this._deepFrom  = 0;
    this._ended     = false;
    this._timelapse = false;   // a hard seek (eruption navigation) cancels any running timelapse
    this._tlTarget  = 0;
    return this.yearsBP;
  },

  // ---- the timelapse (second-screen boost) -----------------
  // Begin a ramped fast-forward from the current year to targetYearsBP (younger). The rate eases
  // tlStartRate → tlMaxRate over tlRampSeconds and update() plays yearsBP down until it lands on the
  // target (or the window end). Returns false if the target is not strictly younger (nothing to do).
  // The bus (TeManawa_bus.js) picks the target: the next regime boundary, or an intervening eruption.
  beginTimelapse(targetYearsBP) {
    const t = Math.max(this.yearsEnd, Math.min(this.yearsStart, targetYearsBP));
    if (t >= this.yearsBP) return false;
    this._timelapse   = true;
    this._tlTarget    = t;
    this._tlFrom      = (typeof millis === 'function') ? millis() : 0;
    this._tlStartYear = this.yearsBP;
    this._deepUntil   = 0;                 // a boost supersedes any lingering deep burst
    this._ended       = false;
    return true;
  },

  endTimelapse() {
    this._timelapse = false;
    this._tlTarget  = 0;
    this.timeScale  = 1;
  },

  isTimelapsing() { return !!this._timelapse; },

  // The current timelapse rate (yr/s): smoothstepped from tlStartRate to tlMaxRate over tlRampSeconds.
  _tlRate() {
    const ramp = this.tlRampSeconds * 1000;
    const now  = (typeof millis === 'function') ? millis() : 0;
    const t = Math.max(0, Math.min(1, ramp > 0 ? (now - this._tlFrom) / ramp : 1));
    const eased = t * t * (3 - 2 * t);                   // smoothstep
    return this.tlStartRate + (this.tlMaxRate - this.tlStartRate) * eased;
  },

  // 0..1 of the active timelapse (share of the year distance covered), for the console progress bar.
  timelapseProgress() {
    if (!this._timelapse) return 0;
    const span = this._tlStartYear - this._tlTarget;
    if (span <= 0) return 1;
    return Math.max(0, Math.min(1, (this._tlStartYear - this.yearsBP) / span));
  },

  // The years a forward skip may land on: every eruption except the terminal one.
  skipTargets() {
    return this.ERUPTIONS.filter(e => e.skip !== false).map(e => e.yearsBP);
  },

  // LONG PRESS: the next eruption forward in playback (younger, smaller yearsBP).
  // Wraps to the oldest target when there is nothing younger (i.e. once past
  // Whakamaru), so a forward skip loops 1 Ma -> 0.9 Ma -> 349 ka -> (wrap) 1 Ma and
  // never lands on the terminal Oruanui.
  nextEruption(yearsBP) {
    const t = this.skipTargets();
    let best = null;
    for (const e of t) if (e < yearsBP && (best === null || e > best)) best = e;
    return best !== null ? best : Math.max.apply(null, t);   // wrap to oldest
  },

  // SINGLE PRESS: the last eruption backward in playback (older, larger yearsBP):
  // the most recent one already passed. null when nothing is older (at/older than
  // Kidnappers), which the caller treats as a no-op.
  prevEruption(yearsBP) {
    const t = this.skipTargets();
    let best = null;
    for (const e of t) if (e > yearsBP && (best === null || e < best)) best = e;
    return best;
  },

  // The full eruption record for a year (or null); lets the button read an event's
  // tier after prev/nextEruption has chosen the year.
  eruptionByYear(yearsBP) {
    for (const e of this.ERUPTIONS) if (e.yearsBP === yearsBP) return e;
    return null;
  },

  // Clearing / recovery per tier, for the disturb mechanic. clearFraction
  // = share of plants knocked out at the eruption; decayYears = sim-years for the ash
  // to clear and the land to green back. One table, keyed by ERUPTIONS[i].tier, so all
  // four events stay in sync. Severity is magnitude × standing cover: Kidnappers (#1)
  // and Oruanui (#4) are both 'major' but read differently (sea vs frozen ground).
  TIERS: {
    minor:        { clearFraction: 0.35, decayYears:  6000 },
    major:        { clearFraction: 0.75, decayYears: 18000 },
    catastrophic: { clearFraction: 0.95, decayYears: 35000 }
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
  // UPDATE: called once per frame from Game.update().
  // Returns the multiplier the rest of the sim should run at.
  // ==========================================================
  update(dt) {
    // The GEOLOGY clock (yearsBP) and the LIFE clock are decoupled now (md/TEMANAWA_SECOND_SCREEN.md
    // §0). yearsBP moves only under a timelapse (a boost) or a legacy deep burst (button 1);
    // otherwise it is PAUSED — the land holds at one date. But the ambient world keeps living, so
    // this returns a LIFE scale (never 0): 1× when paused, and sped up to match the fast-forward
    // while a timelapse/deep runs, so the cast lives THROUGH the years the boost plays out.
    let lifeScale = 1;

    if (this._timelapse) {
      const rate = this._tlRate();                        // yr/s, eased 500 → 5000
      lifeScale = rate / this.yrPerSec;                   // life keeps pace with the fast-forward
      this.yearsBP -= (dt / this.fps) * rate;
      if (this.yearsBP <= this._tlTarget) {               // reached the boost's destination
        this.yearsBP = this._tlTarget;
        this.endTimelapse();
        lifeScale = 1;
      }
    } else if (this.isDeep()) {                           // legacy deep burst — unchanged: 1 → deepMult, eased
      lifeScale = this.currentScale();
      this.yearsBP -= (dt / this.fps) * this.yrPerSec * lifeScale;
    }
    // else: PAUSED — geology frozen, ambient life at 1× (lifeScale stays 1).

    // End-of-window floor, applied however the clock got here: the terminal Oruanui beat still
    // fires when a timelapse plays to the end. Game.update() reads hasEnded() and hands off to attract.
    if (this.yearsBP <= this.yearsEnd) {
      this.yearsBP = this.yearsEnd;
      this._ended  = true;
      if (this._timelapse) this.endTimelapse();
    }

    this.timeScale = lifeScale;
    return lifeScale;
  },

  // The run reaching Oruanui is not a fail state and not a pause; it is the
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

  // Real seconds for the whole window at the baseline rate: the number that
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

// Timeline markers. Label text is a co-design placeholder; the dates are correct.
// Eruption markers are DERIVED from DeepTime.ERUPTIONS so the timeline and the
// button can never disagree on a date. The glacial/warm markers are climate
// instrumentation for the debug overlay; the visitor timeline only draws
// kind === 'eruption'.
const DEEP_TIME_MARKERS = [
  ...DeepTime.ERUPTIONS.map(e => ({ yearsBP: e.yearsBP, label: e.name, kind: 'eruption' })),
  { yearsBP: 270000, label: 'MIS 8',  kind: 'glacial' },
  { yearsBP: 140000, label: 'MIS 6',  kind: 'glacial' },
  { yearsBP: 122000, label: 'MIS 5e', kind: 'warm'    },
  { yearsBP:  30000, label: 'LGM',    kind: 'glacial' }
];

if (typeof module !== 'undefined' && module.exports) module.exports = { DeepTime, DEEP_TIME_MARKERS };
