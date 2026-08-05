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
  // These bound the RUN (and the timeline UI), not the geology: the ranges/river state is
  // keyed to absolute dates in TerrainGenerator.GEO_EPOCHS, so you can shrink or shift this
  // window to zoom into any era for debugging and the terrain still reads true for the date.
  yearsStart: 1000000,  // opens at ~1 Ma — the ranges' earliest stages; they rise across the run (1.1 Ma is the eventual target)
  yearsEnd:    25500,   // closes on Oruanui, heading into the LGM

  // ---- eruptions -------------------------------------------
  // The four TVZ events inside the window, oldest → youngest. This is the single
  // source of truth: DEEP_TIME_MARKERS (below) and the Eruption button both read it.
  //   tier      — clearing severity for the disturb/regen mechanic (see the plan).
  //   skip      — a forward-SKIP target (long press). Oruanui is `false`: its fallout
  //               sits too close to the present to show, so a forward skip past
  //               Whakamaru WRAPS to Kidnappers rather than landing on it.
  //   terminal  — the run's closing ash beat; reached by the clock, never by a skip.
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

  // TIMELAPSE, see TEMANAWA_PLAN.md §5: ~50,000 years in ~10 seconds.
  deepMult:    10,
  deepSeconds: 10,

  // ACCESSIBILITY: make sure this is suitable for photosensitivity
  rampSeconds: 1.2,

  // ---- state -----------------------------------------------
  yearsBP:     1000000,
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
    return this.yearsBP;
  },

  // The years a forward skip may land on — every eruption except the terminal one.
  skipTargets() {
    return this.ERUPTIONS.filter(e => e.skip !== false).map(e => e.yearsBP);
  },

  // LONG PRESS — the next eruption forward in playback (younger, smaller yearsBP).
  // Wraps to the oldest target when there is nothing younger (i.e. once past
  // Whakamaru), so a forward skip loops 1 Ma → 0.9 Ma → 349 ka → (wrap) 1 Ma and
  // never lands on the terminal Oruanui.
  nextEruption(yearsBP) {
    const t = this.skipTargets();
    let best = null;
    for (const e of t) if (e < yearsBP && (best === null || e > best)) best = e;
    return best !== null ? best : Math.max.apply(null, t);   // wrap → oldest
  },

  // SINGLE PRESS — the last eruption backward in playback (older, larger yearsBP):
  // the most recent one already passed. null when nothing is older (at/older than
  // Kidnappers), which the caller treats as a no-op.
  prevEruption(yearsBP) {
    const t = this.skipTargets();
    let best = null;
    for (const e of t) if (e > yearsBP && (best === null || e < best)) best = e;
    return best;
  },

  // The full eruption record for a year (or null) — lets the button read an event's
  // tier after prev/nextEruption has chosen the year.
  eruptionByYear(yearsBP) {
    for (const e of this.ERUPTIONS) if (e.yearsBP === yearsBP) return e;
    return null;
  },

  // Clearing / recovery per tier, for the disturb mechanic (plan §2.1). clearFraction
  // = share of plants knocked out at the eruption; decayYears = sim-years for the ash
  // to clear and the land to green back. One table, keyed by ERUPTIONS[i].tier, so all
  // four events stay in sync. Severity is magnitude × standing cover: Kidnappers (#1)
  // and Oruanui (#4) are both 'major' but read differently (sea vs frozen ground).
  TIERS: {
    minor:        { clearFraction: 0.15, decayYears:  6000 },
    major:        { clearFraction: 0.60, decayYears: 18000 },
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
// correct dates, not final label text. The eruption markers are DERIVED from
// DeepTime.ERUPTIONS so the timeline and the button can never disagree on a date
// (all four now show, and Whakamaru reads its true 349 ka, not the old 345 ka).
// The glacial/warm markers are climate instrumentation and live in the debug
// overlay; the visitor timeline only draws kind === 'eruption'.
const DEEP_TIME_MARKERS = [
  ...DeepTime.ERUPTIONS.map(e => ({ yearsBP: e.yearsBP, label: e.name, kind: 'eruption' })),
  { yearsBP: 270000, label: 'MIS 8',  kind: 'glacial' },
  { yearsBP: 140000, label: 'MIS 6',  kind: 'glacial' },
  { yearsBP: 122000, label: 'MIS 5e', kind: 'warm'    },
  { yearsBP:  30000, label: 'LGM',    kind: 'glacial' }
];

if (typeof module !== 'undefined' && module.exports) module.exports = { DeepTime, DEEP_TIME_MARKERS };
