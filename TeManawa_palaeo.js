// ============================================================
// TE MANAWA: THE LAND BEFORE THE WINDOW — the palaeogeography attract sequence
// ------------------------------------------------------------
// The sim's window (1 Ma → 25.5 ka) barely moves the land. The emergence that made the Manawatū — a
// deep sea basin, a low finger of basement across it, a strait that opened and closed over that
// finger, then the ranges — happens BEFORE the window. This module plays it: an animated, land-only
// pre-roll from 4 Ma to 1 Ma, as the idle attract and at every end-of-window reset, with nothing
// alive on screen and the names on the map those of the time (Trewick & Bland 2012, Fig. 4A–D).
// md/TEMANAWA_PALAEO_ATTRACT.md is the design spine; §5 there lists every system this touches.
//
// ONE LAND MODEL. The sequence is not a second map: it drives the same TerrainGenerator through the
// same morph path, at dates older than the window (GEO_EPOCHS.palaeo*, geoTimeFactors().palaeo).
// The 1 Ma it lands on IS the sim's opening state, so the hand-off is continuous.
//
// ITS OWN CLOCK. DeepTime cannot represent 4 Ma (every clock op clamps to the window and the timeline
// would draw off-left), so the sequence keeps Palaeo.yearsBP and leaves DeepTime parked; the HUD's
// visitor pieces are replaced by one caption while it runs.
//
//   idle / end-of-window
//     ▼
//   dipIn   fade to dark (≥ 500 ms) · every reseedEvery-th cycle: Game.init() under the dark
//   bake0   the first re-bake, to the oldest date, ALL FOUR season buffers, under the dark
//   rise    fade up on the 4 Ma sea
//   play    the keyframes: hold · travel · hold …; a re-bake is issued only when no job is in
//           flight, the last swap's crossfade has ENDED (never a cut — TerrainGenerator._morphCuts
//           stays 0) and the clock has moved ≥ minYears (or sits on a hold not yet baked); the last
//           re-bake (1 Ma) is all four buffers again, so the landing is consistent
//   erupt   the Kidnappers eruption opens the window: the ground rumbles and the ash flash builds (the
//           eruption charge, TM_TIME.erLongPressMs), the ash cloud rolls over, and under its opaque
//           cover the landing: Kiosk.landAttract → Game.resetEcosystem (DeepTime.reset → 1 Ma). The
//           cloud then clears over the living 1 Ma world, drawn by the HUD (the sequence is over)
//   (eruptLanding false: dipOut — fade to dark · the same landing — then rise2, fade up on the world)
//
// Any input skips: the remaining legs run at skipMult with no holds, then the landing is the same.
// THE WARP (authoring): in a run started by P, the first turn of the dial hands the clock over. No holds,
// no landing of its own: it parks at 1 Ma and goes back as far as 4 Ma until a key lands it. A wall run
// (idle, end-of-window) always lands by itself, because nobody is there to land it.
// Photosensitivity (TEMANAWA_BUILD_V3.md §3): the dips ≥ 500 ms, every terrain swap the existing
// ≥ 500 ms crossfade, the names crossfade (≥ 500 ms), the eruption's flash a 4.5 s ramp and a 1.6 s
// fall, its cover a 500 ms ramp. No per-frame allocation on the draw path: the labels are built once,
// the date string is quantised.
// ============================================================

// Console-tunable like TM_TIME / TM_RIVER_NAMES. Sizes in 1080-space px; dates in yearsBP.
const TM_PALAEO = {
  enabled:     true,
  // The sequence's keyframes, oldest first: [yearsBP, holdSeconds]. The four dated maps of Trewick &
  // Bland (4, 3, 2.4, 1 Ma) plus the strait's final closure (1.6 Ma). The last one is the landing and
  // MUST be the window's start (DeepTime.yearsStart): the sim resumes on exactly that land.
  keyframes:   [[4000000, 10], [3000000, 8], [2400000, 10], [1600000, 8], [1000000, 8]],
  kyrPerSec:   15,        // travel rate between keyframes at ×1 (3 Myr ≈ 200 s; with the holds ≈ 4 min)
  // THE DIAL while the sequence runs (the same keys / wheel / console message as DeepTime's time dial,
  // routed here): a detent −6 … 6. 0 pauses; ±1…±6 play at SPEEDS[|detent|−1] × kyrPerSec, forward
  // (+) or in REVERSE (−). Holds count in sequence time (an 8 s hold is 2 s at ×4, never ends paused).
  dialSpeeds:  [0.25, 0.5, 1, 2, 4, 8],
  dialStart:   3,         // the detent a sequence opens at (×1 forward); the dial's push returns here
  dialWheelStep: 100,     // wheel deltaY per detent (as DeepTime.dialWheelStep)
  // THE SEA'S BREATH before the window: a synthetic 41-kyr glacial–interglacial cycle
  // (Climate.PRE_WINDOW_SEA) blended in only when the land moves slowly enough for a cycle to read —
  // full at ≤ seaBreathBelow kyr/s (a cycle ≥ 8 s), gone by seaBreathOff (a cycle every 4 s would be
  // a flicker). It shows where there is a coast to move: on the plain as the basin shoals (1.65 → 1 Ma).
  seaBreathBelow: 5,
  seaBreathOff:  10,
  minYears:    20000,     // the smallest clock move that earns a re-bake (paced by the crossfade anyway)
  budgetMs:    8,         // per-frame morph slice while the sequence runs (nothing lives, so it can be generous)
  firstBudgetMs: 14,      // … and under the opening dark, where nothing at all is on screen
  dipMs:       700,       // fade to dark / up, each way (≥ 500: photosensitivity)
  // THE LANDING is the Kidnappers eruption (~1.0 Ma, Mangakino; DeepTime's first event): after the 1 Ma
  // hold, the eruption charge (rumble + building flash), then the ash cloud, and the living world swapped
  // in under its cover. false = the older dip to dark and back.
  eruptLanding: true,
  coverLeadMs: 900,       // the cloud opens this long before the swap (its backdrop is opaque from 500 ms on)
  skipMult:    12,        // an input plays the rest at this × kyrPerSec, with no holds
  dateQuant:   50000,     // the travelling date is rounded to this (a few strings for the text cache, ~1 change/s)
  spelling:    'Whanganui',   // the basin's spelling on the wall: the district's (and the blog's). Trewick & Bland write 'Wanganui'
  riverProtoUntil: 1250000,   // the main stem is 'proto-Manawatū' while its arm still flows east (GEO_EPOCHS.mainArmFrom)
  labelSize:   24,        // the region names' lettering (the river names' mainSize is 26)
  labelFadeMs: 700,       // a name's fade in / out (≥ 500)
  captionSize: 42,        // the date (InstallHUD.VIS_YEAR_SIZE)
  captionUp:   186,       // px from the bottom edge up to the date's centre (the sequence draws no timeline, so it keeps its own spot)
  // The names on the map, each for its dated window (from = older bound, to = younger), anchored at a
  // map fraction (u 0 west → 1 east, v 0 north → 1 south) and lettered at `deg` on screen (−90 … 90 so it
  // reads left to right / bottom to top). `on` is the surface the anchor must sit on at the date, read off
  // the painted classification (sea / land); a name whose anchor is not on it stays hidden. Only names
  // Trewick & Bland use (Fig. 4A–D, pp. 160–171); the axis is unnamed until 1.6 Ma, then their 'proto-'.
  // (The wall's cover fit runs the map wider than the screen, so u ≈ 0.16 … 0.9 is what shows.)
  LABELS: [
    { text: '{basin} Basin',   from: 4000000, to: 1050000, u: 0.23, v: 0.27, deg: -18, on: 'sea'  },   // north-west, off the 4 Ma plain (the basin's deep water lay off Whanganui; research/palaeogeography)
    { text: 'Ruataniwha Strait', from: 4000000, to: 1550000, u: 0.80, v: 0.64, deg: -40, on: 'sea'  },
    { text: 'Manawatū Strait',   from: 3330000, to: 2950000, u: 0.505, v: 0.56, deg: 30, on: 'sea' },
    { text: 'Manawatū Strait',   from: 2480000, to: 1680000, u: 0.505, v: 0.56, deg: 30, on: 'sea' },
    { text: 'proto-Ruahine Range', from: 1600000, to: 1020000, u: 0.62, v: 0.26, deg: -80, on: 'land' },
    { text: 'proto-Tararua Range', from: 1600000, to: 1020000, u: 0.45, v: 0.66, deg: -50, on: 'land' }
  ]
};
try { if (typeof window !== 'undefined') window.TM_PALAEO = TM_PALAEO; } catch (_) {}

const Palaeo = {
  // ---- state -------------------------------------------------
  active:   false,     // the sequence owns the world (dipIn … the landing); the sim neither updates nor renders
  state:    'idle',    // idle | dipIn | bake0 | rise | play | erupt (or dipOut | rise2)
  yearsBP:  0,         // the sequence's own clock
  reason:   '',
  game:     null,
  bakes:    0,         // re-bakes landed this sequence
  runs:     0,         // sequences played (the harness reads it)
  _t0:      0,         // millis() the current state began
  _leg:     0,         // index into keyframes: the one last reached (forward) or returned to (reverse)
  _holdLeft: 0,        // seconds of the current hold still to run, in sequence time
  _holdPending: false, // on a keyframe whose land is not yet on screen
  _skipping: false,
  dialStep: 3,         // the dial's detent while the sequence runs (TM_PALAEO.dialSpeeds; 0 = paused, − = reverse)
  _wheelAcc: 0,
  _warp:    false,     // a P run whose dial has been touched: the dial alone drives the clock (_warpClock)
  _veil:    0,         // 0..1 dark overlay
  _bakedYear: NaN, _bakedAll: false,
  _reseed:  false,
  _labels:  null,      // built label instances (lazily, needs p5)
  _labelKey: '',
  _anchorSig: '',
  _coverAt: 0,         // millis() the landing eruption's cloud opened (0 = not yet)
  lastCoverMs: 0,      // how long the cloud had been up when the world was swapped (the harness reads it)

  // ---- the two cues ------------------------------------------
  // Start the sequence. `reason` is 'idle' | 'end-of-window' | 'manual'. Refused (false) while one is
  // running, when disabled, or before the world exists; the error-recovery path never calls this.
  begin(g, reason) {
    if (!TM_PALAEO.enabled || this.active || !g || !g.terrain || !g.currentLevel) return false;
    if (typeof TerrainGenerator === 'undefined' || !g.terrain.morphBegin) return false;
    const now = this._now();
    this.active = true; this.state = 'dipIn'; this.reason = reason || 'manual'; this.game = g;
    this._t0 = now; this._leg = 0; this._holdLeft = 0; this._holdPending = false; this._skipping = false; this._veil = 0;
    this.bakes = 0; this._bakedYear = NaN; this._bakedAll = false;
    this.dialStep = TM_PALAEO.dialStart; this._wheelAcc = 0; this._warp = false;
    this._setSeaBreath(0);
    this.yearsBP = this._kf(0)[0];
    // The reseed-every-Nth of the attract loop: decided here, done under the opening dark.
    this._reseed = (typeof Kiosk !== 'undefined' && Kiosk.takeReseed) ? Kiosk.takeReseed() : false;
    // Nothing of the old world's volcanic state may fire on the fresh one: a charge armed at the window
    // end (the terminal Oruanui) would otherwise be seen as 'past its crest' by the new HUD and erupt at
    // 1 Ma. A LIVE ash-cloud window is kept: it finishes dissipating over the sequence (Oruanui's cover
    // becomes the end-of-window's). The ground's health filter and ash wash are the old world's too.
    g._tmAttractErAt = 0; g._tmAutoErAt = 0; g._tmAutoErupt = null; g._tmErDownAt = 0; g._tmErFired = false; g._tmPalaeoErAt = 0;
    this._coverAt = 0;
    g._tmAshUntil = 0; g._ashCover = 0; g._sceneSat = 1; g._habitatHealth = 1;
    g._tmStormUntil = 0; g._tmGrowWarmUntil = 0; g._tmGrowColdUntil = 0; g._tmBolt = null;
    if (typeof Kiosk !== 'undefined') Kiosk.lastInputAt = Date.now();   // the idle timer restarts; landAttract restarts it again
    if (typeof IslandInset !== 'undefined' && typeof TM_ISLAND !== 'undefined') IslandInset.prepare(TM_ISLAND.palaeoDates.map(d => d[0]));   // the dated island maps, before the dip ends
    if (typeof console !== 'undefined') console.log('[Palaeo] begin (' + this.reason + ')' + (this._reseed ? ' + reseed' : ''));
    return true;
  },

  // Visitor presence: play the rest fast (no holds), then land normally. Never a cut.
  skip() {
    if (!this.active) return false;
    if (this.state === 'erupt' || this.state === 'dipOut' || this.state === 'rise2') return false;
    this._skipping = true; this._holdLeft = 0; this._holdPending = false;
    return true;
  },

  // ---- the dial while the sequence runs ------------------------
  // One detent per call (± a fast spin), clamped to ±dialSpeeds.length; 0 pauses, below 0 reverses.
  dialTurn(delta) { return this.dialSet(this.dialStep + (delta | 0)); },
  dialSet(step) {
    const n = TM_PALAEO.dialSpeeds.length;
    this.dialStep = Math.max(-n, Math.min(n, step | 0));
    if (this.active && this.reason === 'manual') this._warp = true;
    return this.dialStep;
  },
  dialReset() { return this.dialSet(TM_PALAEO.dialStart); },
  // The time dial's keys (DeepTime.DIAL_KEYS: CW / CCW / push), while the sequence runs. True when taken.
  dialKey(k) {
    if (!this.active) return false;
    const K = (typeof DeepTime !== 'undefined' && DeepTime.DIAL_KEYS) ? DeepTime.DIAL_KEYS : { faster: [']'], slower: ['['], reset: ['\\'] };
    if (K.faster.indexOf(k) !== -1) { this.dialTurn(1);  return true; }
    if (K.slower.indexOf(k) !== -1) { this.dialTurn(-1); return true; }
    if (K.reset.indexOf(k)  !== -1) { this.dialReset();  return true; }
    return false;
  },
  dialWheel(deltaY) {
    this._wheelAcc += deltaY;
    const n = Math.trunc(this._wheelAcc / (TM_PALAEO.dialWheelStep || 100));
    if (n !== 0) { this._wheelAcc -= n * (TM_PALAEO.dialWheelStep || 100); this.dialTurn(-n); }
    return n;
  },
  // The signed rate multiplier the clock plays at: 0 paused, − reverse; a skip overrides it forward.
  rateMult() {
    if (this._skipping) return TM_PALAEO.skipMult;
    const S = TM_PALAEO.dialSpeeds, d = this.dialStep;
    if (!d) return 0;
    return (d > 0 ? 1 : -1) * S[Math.min(S.length, Math.abs(d)) - 1];
  },
  // "paused" / ">> × 2" / "<< × 0.5" / ">> skip" / the warp parked at the end, for the caption.
  speedLabel() {
    if (this._skipping) return '>> skip';
    const m = this.rateMult();
    if (m === 0) return 'paused';
    if (this._warp && m > 0 && this.yearsBP === this._last()[0]) return 'any key lands';
    const a = Math.abs(m), s = a >= 1 ? String(a) : a.toFixed(2).replace(/0+$/, '');
    return (m > 0 ? '>> × ' : '<< × ') + s;
  },

  // The sea's breath before the window (Climate.PRE_WINDOW_SEA.scale): 1 when the land crawls
  // (≤ seaBreathBelow kyr/s), 0 when it moves too fast for a cycle to read (≥ seaBreathOff).
  _seaScale() {
    const rate = TM_PALAEO.kyrPerSec * Math.abs(this.rateMult());
    const lo = TM_PALAEO.seaBreathBelow, hi = Math.max(lo + 1e-6, TM_PALAEO.seaBreathOff);
    const t = (hi - rate) / (hi - lo);
    return t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
  },
  _setSeaBreath(scale) {
    if (typeof Climate !== 'undefined' && Climate.PRE_WINDOW_SEA) Climate.PRE_WINDOW_SEA.scale = scale;
  },

  // ---- per frame, from Game.update (always; cheap when idle) ---
  tick(dt) {
    if (this.state === 'idle') return;
    const g = this.game, T = g && g.terrain, now = this._now();
    if (!T) { this._abort('no terrain'); return; }
    // The landing eruption's 42 cloud frames warm in one at a time from InstallHUD.update, which does not
    // run while the sequence owns the world: keep warming them here, or a sequence started soon after
    // boot (P) lands with no cover. A no-op once they are in.
    if (typeof InstallHUD !== 'undefined' && InstallHUD._ashWarmupTick) InstallHUD._ashWarmupTick();
    const sec = Math.max(0, (dt == null ? 1 : dt)) / ((typeof DeepTime !== 'undefined' && DeepTime.fps) ? DeepTime.fps : 60);
    const dip = Math.max(500, TM_PALAEO.dipMs);
    switch (this.state) {
      case 'dipIn': {
        this._veil = this._ease((now - this._t0) / dip);
        if (this._veil >= 1) {
          if (this._reseed && typeof g.init === 'function') {        // the deliberate reseed, under the dark
            g.init();
            if (typeof Kiosk !== 'undefined' && Kiosk.beat) Kiosk.beat();   // a legitimate long rebuild is not a stall
          }
          T.morphBegin(this.yearsBP, this._bakeScale(), true);        // all four buffers: a hard scene change
          this._bakedAll = true;
          this.state = 'bake0';
        }
        break;
      }
      case 'bake0': {
        if (!T.morphInProgress || T.morphStep(TM_PALAEO.firstBudgetMs)) {
          this._clearRiverNames();                                    // the modern names never linger into the 4 Ma hold
          this._onBaked(this.yearsBP, true);
          this._retireFade(T);                                        // the old land never ghosts into the rise
          this.state = 'rise'; this._t0 = now;
        }
        break;
      }
      case 'rise': {
        this._veil = 1 - this._ease((now - this._t0) / dip);
        if (this._veil <= 0) {
          this._veil = 0; this.state = 'play'; this._leg = 0;
          this._armHold();                                              // the 4 Ma land is already on screen
        }
        break;
      }
      case 'play': {
        this._advanceClock(now, sec);
        this._paceBakes(T, now, false);
        break;
      }
      case 'erupt': {
        // The charge runs from _t0 (g._tmPalaeoErAt: the HUD's flash + shake read it). Once the landing
        // bake is in, the cloud opens coverLeadMs before the charge's crest; at the crest its backdrop
        // is opaque, and the living world is swapped in under it. The cloud and the falling flash then
        // play out over the 1 Ma world through the HUD, which draws them once the sequence is over.
        const ready = this._landingBake(T);
        const TT = (typeof TM_TIME !== 'undefined') ? TM_TIME : { erLongPressMs: 4500, cloudMillis: 5250, ashMillis: 1600 };
        const lead = Math.max(600, TM_PALAEO.coverLeadMs || 0);
        if (!this._coverAt) {
          if (ready && now - this._t0 >= TT.erLongPressMs - lead) {
            g._ashCloudUntil = now + TT.cloudMillis; g._ashCloudMode = 'hold';
            this._coverAt = now;
          }
        } else if (now - this._coverAt >= lead) {
          const cloudUntil = g._ashCloudUntil;
          this.lastCoverMs = now - this._coverAt;
          g._tmPalaeoErAt = 0;
          this._land(g, T, now);
          g._ashCloudUntil = cloudUntil; g._ashCloudMode = 'hold';                          // a reset never cuts the cover short
          g._tmAshUntil = now + TT.ashMillis; g._tmAshMode = 'hold';                        // the charged flash falls
          this._coverAt = 0; this._veil = 0; this.state = 'idle'; this.game = null;
        }
        break;
      }
      case 'dipOut': {
        this._veil = this._ease((now - this._t0) / dip);
        if (this._landingBake(T) && this._veil >= 1) {
          this._land(g, T, now);
          this.state = 'rise2'; this._t0 = now;
        }
        break;
      }
      case 'rise2': {
        this._veil = 1 - this._ease((now - this._t0) / dip);
        if (this._veil <= 0) { this._veil = 0; this.state = 'idle'; this.game = null; }
        break;
      }
    }
  },

  // The landing bake: the last keyframe, all four buffers. Issued here if play left it undone (a skip
  // can reach 1 Ma with a travel bake still in flight), stepped, and waited for. True once it is in.
  // Like _paceBakes, it waits out a live crossfade before issuing: a travel bake that lands just before
  // the landing arms a fade, and a quick landing bake (a fast machine, a small paint grid) would swap the
  // visible buffer under it, which is a cut (TerrainGenerator._morphCuts; harness "palaeo attract").
  _landingBake(T) {
    const y = this._last()[0];
    if (T.morphInProgress) { if (T.morphStep(TM_PALAEO.firstBudgetMs)) this._onBaked(this._pendingYear, this._pendingAll); }
    else if (!(this._bakedYear === y && this._bakedAll) && !T._morphFade) this._issueBake(T, y, true);
    return !T.morphInProgress && this._bakedYear === y && this._bakedAll;
  },

  // The landing begins: the eruption charge (eruptLanding) or the dip to dark.
  _beginLanding(g, now) {
    this._t0 = now; this._coverAt = 0;
    if (TM_PALAEO.eruptLanding) { this.state = 'erupt'; if (g) g._tmPalaeoErAt = now; }
    else this.state = 'dipOut';
  },

  // The clock: holds on a keyframe, travels to the next at the dial's rate — forward, paused, or in
  // reverse; the last hold, reached forward, ends in the landing dip. A hold is PENDING (the clock
  // waits) until the keyframe's own re-bake is on screen, so the time the visitor gets to read a
  // dated map is counted from when the land shows it, not from when the clock got there (on a slow
  // bake the hold would otherwise be spent still morphing); it then runs in SEQUENCE time (×|rate|),
  // so a fast dial shortens it and a pause never ends it. A skip waits for nothing. In reverse the
  // target is the keyframe just left (or, from a keyframe, the older one), and the oldest date holds.
  _advanceClock(now, sec) {
    const K = TM_PALAEO.keyframes, last = K.length - 1, mult = this.rateMult();
    if (this._warp && !this._skipping) { this._warpClock(mult, sec); return; }
    if (this._holdPending) {                                 // on a keyframe, its land not yet shown
      this.yearsBP = K[this._leg][0];
      if (this._skipping) this._holdPending = false; else return;
    }
    if (this._holdLeft > 0) {                                  // the hold, in sequence time
      this.yearsBP = K[this._leg][0];
      this._holdLeft -= sec * Math.abs(mult);
      if (this._holdLeft > 0) return;
      this._holdLeft = 0;
    }
    if (mult === 0) return;                                    // paused
    const yrs = TM_PALAEO.kyrPerSec * 1000 * Math.abs(mult) * sec;
    if (mult > 0) {
      // Turned back off a keyframe and forward again: that keyframe is next, not the one after it.
      const ti = (this.yearsBP > K[this._leg][0]) ? this._leg : this._leg + 1;
      if (ti > last) {                                         // the last hold is over → land
        this.yearsBP = K[last][0];
        this._beginLanding(this.game, now);
        return;
      }
      this.yearsBP -= yrs;
      if (this.yearsBP <= K[ti][0]) { this.yearsBP = K[ti][0]; this._leg = ti; this._holdPending = true; }   // armed by _onBaked once the land shows
    } else {
      const ti = (this.yearsBP < K[this._leg][0]) ? this._leg : this._leg - 1;
      if (ti < 0) { this.yearsBP = K[0][0]; return; }          // the oldest date: nothing further back
      this.yearsBP += yrs;
      if (this.yearsBP >= K[ti][0]) { this.yearsBP = K[ti][0]; this._leg = ti; this._holdPending = true; }
    }
  },

  // The warp's clock: the dial alone, clamped to the sequence's ends. _leg stays the newest keyframe
  // reached, so a key mid-warp skips on from the right leg (and from 1 Ma, straight to the landing).
  _warpClock(mult, sec) {
    const K = TM_PALAEO.keyframes, last = K.length - 1;
    this._holdPending = false; this._holdLeft = 0;
    const y = this.yearsBP - TM_PALAEO.kyrPerSec * 1000 * mult * sec;
    this.yearsBP = Math.max(K[last][0], Math.min(K[0][0], y));
    let leg = 0;
    while (leg < last && this.yearsBP <= K[leg + 1][0]) leg++;
    this._leg = leg;
  },

  // The keyframe's land is on screen: start its hold (none while skipping).
  _armHold() {
    this._holdPending = false;
    this._holdLeft = this._skipping ? 0 : this._kf(this._leg)[1];
  },

  // A re-bake only when nothing is in flight, the last visible swap's crossfade has ended (a swap under
  // a live fade is a cut) and the clock has moved enough — or sits on a hold the land has not reached.
  _paceBakes(T, now) {
    if (T.morphInProgress) {
      if (T.morphStep(TM_PALAEO.budgetMs)) this._onBaked(this._pendingYear, this._pendingAll);
      return;
    }
    if (T._morphFade) return;
    const want = this.yearsBP;
    // A warp stopped anywhere (paused, or parked at the oldest date) settles on exactly that date.
    const onHold = this._holdPending || this._holdLeft > 0 || this._leg >= TM_PALAEO.keyframes.length - 1 ||
                   (this._warp && (this.rateMult() === 0 || want === this._kf(0)[0]));
    const moved = Math.abs(want - this._bakedYear) >= TM_PALAEO.minYears;
    // The sea's breath can change the land at a fixed date too (the dial slowed): re-bake for it.
    const breath = this._seaScale(), breathMoved = Math.abs(breath - (this._bakedBreath || 0)) > 0.05;
    if (moved || breathMoved || (onHold && this._bakedYear !== want)) {
      const isLast = want === this._last()[0];
      this._issueBake(T, want, isLast);
    }
  },

  _issueBake(T, year, allPhases) {
    const breath = this._seaScale();
    this._setSeaBreath(breath); this._bakedBreath = breath;   // read by the morph through Climate.seaLevelAt
    T.morphBegin(year, this._bakeScale(), !!allPhases);
    this._pendingYear = year; this._pendingAll = !!allPhases;
  },

  _onBaked(year, allPhases) {
    const g = this.game, now = this._now();
    this._bakedYear = year; this._bakedAll = !!allPhases; this.bakes++;
    if (g) {
      if (g.water && g.water.reconcile) g.water.reconcile(g.terrain, year);   // the shimmer follows the sea; names re-letter on rev
      g._bakedYearsBP = year;
      g._lastMorphMs = now;
    }
    this._anchorSig = '';   // the land moved under the names: re-seat them
    // A pending hold starts now that its keyframe's land is on screen.
    if (this.state === 'play' && this._holdPending && year === this._kf(this._leg)[0]) this._armHold();
  },

  _retireFade(T) {
    const mf = T._morphFade;
    if (!mf) return;
    if (mf.buf && T._releaseBakeBuffer) T._releaseBakeBuffer(mf.buf);
    T._morphFade = null;
  },

  // The landing: the terrain is already the window's opening land; only the living world is rebuilt.
  // RiverNames keeps a lost name on screen for one more layout (holdLayouts), so that a name does not
  // blink; across the sequence's two dips that hold would carry the wrong era's names through a whole
  // keyframe. Both dips clear the live names under the dark, so the next layout starts fresh.
  _clearRiverNames() {
    const RN = (typeof RiverNames !== 'undefined') ? RiverNames : null;
    if (RN && RN.clear) RN.clear();
  },

  _land(g, T, now) {
    this._retireFade(T);
    this._clearRiverNames();                                    // the time's names never linger into the living world
    this._setSeaBreath(0); this._bakedBreath = 0;               // the window never reads it; left clean
    const y = this._last()[0];
    if (g.water && g.water.build) g.water.build(T, y);          // a clean stamp for the new world (as an eruption does)
    if (typeof Kiosk !== 'undefined' && Kiosk.landAttract) Kiosk.landAttract(g, this.reason);
    else if (g.resetEcosystem) g.resetEcosystem();
    g._bakedYearsBP = y; g._lastMorphMs = now;
    this.runs++;
    this.active = false;                                        // the sim runs (and renders) under the lifting veil
    if (typeof console !== 'undefined') console.log('[Palaeo] landed at ' + y + ' after ' + this.bakes + ' re-bakes');
  },

  _abort(why) {
    if (typeof console !== 'undefined') console.warn('[Palaeo] aborted: ' + why);
    this._setSeaBreath(0);                                      // as the landing does: never leave the pre-window cycle on
    if (this.game) this.game._tmPalaeoErAt = 0;                 // nor a landing eruption's rumble
    this._coverAt = 0;
    this.active = false; this.state = 'idle'; this._veil = 0; this.game = null;
  },

  // ---- render --------------------------------------------------
  // Over the ground tier (Game.render draws the terrain, water decals and washes, nothing alive): the
  // river names (the palaeo names, through RiverNames), the region names, the caption, the eruption's
  // flash and a live ash cloud, the debug overlay. Called in place of GameUI.renderFullscreenOverlay while active.
  renderOverlay(g, W, H) {
    if (typeof InstallHUD !== 'undefined') {
      if (InstallHUD.renderEdgeGlow) InstallHUD.renderEdgeGlow(g, W, H);
    }
    if (typeof RiverNames !== 'undefined' && RiverNames.render) RiverNames.render(g, W, H);
    this._renderLabels(g, W, H);
    this._renderCaption(W, H);
    if (typeof IslandInset !== 'undefined') {                         // the island at the date (TeManawa_island.js)
      const p = IslandInset.palaeoPair(this.yearsBP);
      IslandInset.draw(null, p.a, p.b, p.mix, 1, W, H, 'palaeo');
    }
    if (typeof InstallHUD !== 'undefined' && InstallHUD.renderAshFlash) InstallHUD.renderAshFlash(g, W, H);
    if (typeof InstallHUD !== 'undefined' && InstallHUD.renderAshCloud) InstallHUD.renderAshCloud(g, W, H);
    if (typeof Debug !== 'undefined' && Debug.enabled && Debug.render) Debug.render(g, W, H);
  },

  // The dark veil, over everything (drawn from draw() after Game.render, like Kiosk.renderCrossfade).
  renderVeil(W, H) {
    if (this._veil <= 0.002) return;
    push(); noStroke(); fill(14, 21, 19, 255 * Math.min(1, this._veil)); rect(0, 0, W, H); pop();
  },

  // ---- names ---------------------------------------------------
  // What RiverNames letters along a channel while the sequence runs: no tributary names (no source
  // names those streams for the time), the main stem by date.
  riverName(rv) {
    if (!rv || rv.type === 'tributary') return null;
    return this.yearsBP >= TM_PALAEO.riverProtoUntil ? 'proto-Manawatū' : 'Manawatū';
  },

  // The names showing at date `y` on their surfaces (text → the surface check runs on the live land).
  labelsAt(y) {
    return TM_PALAEO.LABELS.filter(L => y <= L.from && y >= L.to).map(L => this._labelText(L));
  },

  // The date as the HUD writes it (~ 2,400,000 years ago), quantised while travelling.
  dateLabel() {
    const onHold = this.state !== 'play' || this._holdPending || this._holdLeft > 0 || this.rateMult() === 0;
    const q = TM_PALAEO.dateQuant || 1;
    const y = onHold ? this.yearsBP : Math.round(this.yearsBP / q) * q;
    return '~ ' + Math.round(y).toLocaleString() + ' years ago';
  },

  // For the second screen's clock telemetry.
  telemetry() {
    return this.active ? { active: true, yearsBP: Math.round(this.yearsBP), state: this.state, label: this.dateLabel(),
                           dialStep: this.dialStep, speed: this.speedLabel() }
                       : { active: false };
  },

  _labelText(L) { return L.text.replace('{basin}', TM_PALAEO.spelling || 'Whanganui'); },

  // Build the letter sprites once (the river names' glyph cache: the same halo + fill lettering).
  _buildLabels() {
    const C = TM_PALAEO, RN = (typeof RiverNames !== 'undefined') ? RiverNames : null;
    const key = C.LABELS.length + '|' + C.labelSize + '|' + C.spelling;
    if (this._labels && this._labelKey === key) return this._labels;
    if (!RN || !RN._glyph || typeof TM_RIVER_NAMES === 'undefined') return null;
    const size = C.labelSize, tr = TM_RIVER_NAMES.tracking * size, out = [];
    for (const L of C.LABELS) {
      const text = this._labelText(L).normalize('NFC').toUpperCase(), chars = Array.from(text);
      const gs = chars.map(ch => RN._glyph(ch, size));
      let len = tr * (chars.length - 1); for (const gl of gs) len += gl.adv;
      const n = chars.length;
      out.push({ def: L, text, gs, n, len, tr,
                 x: new Float32Array(n), y: new Float32Array(n), a: new Float32Array(n),
                 ok: false, shown: false, alpha: 0, aFrom: 0, aT0: -1e9 });
    }
    this._labels = out; this._labelKey = key;
    return out;
  },

  // Seat every name on the land as it stands: its anchor's painted position (the relief lift under it)
  // and its surface check. Runs when the land, the view or the canvas changed, never per frame.
  _seatLabels(g, W, H) {
    const T = g.terrain, labels = this._labels;
    if (!T || !labels || typeof Projection === 'undefined' || typeof CONFIG === 'undefined') return;
    const sig = this.bakes + '|' + W + 'x' + H + '|' + CONFIG.viewX + ',' + CONFIG.viewY + ',' + CONFIG.viewZoom;
    if (sig === this._anchorSig) return;
    this._anchorSig = sig;
    const vx = CONFIG.viewX, vy = CONFIG.viewY, vz = CONFIG.viewZoom, mw = T.mapWidth, mh = T.mapHeight;
    for (const L of labels) {
      const D = L.def, x = D.u * mw, y = D.v * mh;
      L.ok = this._onSurface(T, D, x, y);
      const lift = T.paintLiftAt ? T.paintLiftAt(x, y) : T.getElevationAt(x, y);
      let cx = vx + vz * Projection.projX(x), cy = vy + vz * Projection.groundY(y, lift);
      const ang = (D.deg || 0) * Math.PI / 180, ca = Math.cos(ang), sa = Math.sin(ang);
      // Keep the whole tilted name on screen: the anchor is a map fraction, and the cover fit crops the
      // map's sides differently per aspect (Ruataniwha Strait, near the east edge, ran off the right).
      const m = (typeof TM_RIVER_NAMES !== 'undefined' ? TM_RIVER_NAMES.marginX : 28), hh = TM_PALAEO.labelSize * 0.7;
      const ex = L.len / 2 * Math.abs(ca) + hh * Math.abs(sa) + m, ey = L.len / 2 * Math.abs(sa) + hh * Math.abs(ca) + m;
      if (2 * ex < W) cx = Math.min(W - ex, Math.max(ex, cx));
      if (2 * ey < H) cy = Math.min(H - ey, Math.max(ey, cy));
      let cum = 0;
      for (let j = 0; j < L.n; j++) {
        const s = cum + L.gs[j].adv / 2 - L.len / 2;
        L.x[j] = cx + s * ca; L.y[j] = cy + s * sa; L.a[j] = ang;
        cum += L.gs[j].adv + L.tr;
      }
    }
  },

  _renderLabels(g, W, H) {
    const labels = this._buildLabels();
    if (!labels) return;
    this._seatLabels(g, W, H);
    const dc = (typeof drawingContext !== 'undefined') ? drawingContext : null, RN = RiverNames;
    const now = this._now(), fade = Math.max(500, TM_PALAEO.labelFadeMs), y = this.yearsBP;
    // Window + surface decide the target; the alpha eases toward it over fade ms (a flip mid-fade
    // starts from where it was, so a name never jumps).
    for (const L of labels) {
      const want = this.active && L.ok && y <= L.def.from && y >= L.def.to;
      if (want !== L.shown) { L.shown = want; L.aFrom = L.alpha; L.aT0 = now; }
      const t = Math.min(1, (now - L.aT0) / fade);
      L.alpha = L.aFrom + ((want ? 1 : 0) - L.aFrom) * t;
    }
    if (!dc || !dc.drawImage || !RN._drawLabel) return;
    const ga0 = dc.globalAlpha;
    for (let pass = 0; pass < 2; pass++) {
      for (const L of labels) {
        if (L.alpha <= 0.004) continue;
        dc.globalAlpha = ga0 * L.alpha;
        RN._drawLabel(dc, L.gs, L.n, L.x, L.y, L.a, L.x, L.y, L.a, 1, pass);
      }
    }
    dc.globalAlpha = ga0;
  },

  // The date where the HUD puts its year.
  _renderCaption(W, H) {
    const HUD = (typeof InstallHUD !== 'undefined') ? InstallHUD : null;
    if (!HUD || !HUD._blitText || typeof FreckleFace === 'undefined') return;
    const cx = W / 2, cy = H - TM_PALAEO.captionUp;
    const halo = [8, 14, 12, 170], ink = [236, 244, 240], size = TM_PALAEO.captionSize;
    const date = this.dateLabel();
    HUD._blitText(date, FreckleFace, 'freckle', size, CENTER, CENTER, cx + 2, cy + 3, halo);
    HUD._blitText(date, FreckleFace, 'freckle', size, CENTER, CENTER, cx, cy, ink);
    // The dial's reading, where the HUD puts its own dial badge (a dozen possible strings: cached).
    if (this.state === 'play') {
      const xEnd = W - Math.round(W * (HUD.VIS_INSET || 0.10)), by = H - (HUD.VIS_STRIP_H || 64) + 16;
      HUD._blitText(this.speedLabel(), FreckleFace, 'freckle', 15, RIGHT, BOTTOM, xEnd, by, [240, 240, 240]);
    }
  },

  // Whether a name's anchor (world x, y) is on its surface, read off the painted classification: 'land' is
  // anything but open sea (a stream crossing the anchor is still land under the name: a hill stream on the
  // proto-Ruahine used to hide its name whenever the fan's geometry put one there). The anchor and four
  // cells round it vote, so one stray cell (a shelf cell the border wobble paints as beach) cannot hide a
  // name over open water (2026-11-13: the pre-window sea is shelf, near the waterline).
  _onSurface(T, D, x, y) {
    if (D.on !== 'sea' && D.on !== 'land') return true;
    if (!T.waterTypeAt) return false;
    let hits = 0;
    for (let k = 0; k < 5; k++) {
      const dx = k === 1 ? -3 : k === 2 ? 3 : 0, dy = k === 3 ? -3 : k === 4 ? 3 : 0;
      const sea = T.waterTypeAt(x + dx, y + dy) === 1;
      if (sea === (D.on === 'sea')) hits++;
    }
    return hits >= 3;
  },

  // A still frame (tools/export_frames.js): the names of date `y` on terrain `T` as it stands (seated
  // and surface-checked afresh, drawn at full strength) and the caption, into graphics `buf`. The
  // sequence's live state is untouched. Returns the region names drawn.
  drawStill(buf, T, W, H, y) {
    const g = { terrain: T };
    const labels = this._buildLabels();
    const keep = { active: this.active, yearsBP: this.yearsBP, state: this.state, sig: this._anchorSig, game: this.game, hold: this._holdLeft };
    this.active = true; this.yearsBP = y; this.state = 'play'; this._holdLeft = Infinity; this.game = g;
    this._anchorSig = '';
    const drawn = [];
    try {
      if (labels) {
        this._seatLabels(g, W, H);
        const dc = buf && buf.drawingContext;
        if (dc && dc.drawImage && typeof RiverNames !== 'undefined' && RiverNames._drawLabel) {
          for (let pass = 0; pass < 2; pass++) for (const L of labels) {
            if (!(L.ok && y <= L.def.from && y >= L.def.to)) continue;
            RiverNames._drawLabel(dc, L.gs, L.n, L.x, L.y, L.a, L.x, L.y, L.a, 1, pass);
            if (pass === 1) drawn.push(L.text);
          }
        }
      }
      if (buf && buf.push && typeof FreckleFace !== 'undefined') {
        const HUD = (typeof InstallHUD !== 'undefined') ? InstallHUD : null;
        const cx = W / 2, cy = H - TM_PALAEO.captionUp;
        buf.push(); buf.textFont(FreckleFace); buf.textAlign(CENTER, CENTER); buf.noStroke();
        buf.textSize(TM_PALAEO.captionSize); buf.fill(8, 14, 12, 170); buf.text(this.dateLabel(), cx + 2, cy + 3);
        buf.fill(236, 244, 240); buf.text(this.dateLabel(), cx, cy);
        buf.pop();
      }
      if (buf && typeof IslandInset !== 'undefined') {                  // the island at the date, as the sequence draws it
        const p = IslandInset.palaeoPair(y);
        IslandInset.draw(buf, p.a, p.b, p.mix, 1, W, H, 'palaeo');
      }
    } finally {
      this.active = keep.active; this.yearsBP = keep.yearsBP; this.state = keep.state; this._anchorSig = keep.sig; this.game = keep.game;
      this._holdLeft = keep.hold;
    }
    return drawn;
  },

  // ---- helpers --------------------------------------------------
  _kf(i) { return TM_PALAEO.keyframes[i]; },
  _last() { return TM_PALAEO.keyframes[TM_PALAEO.keyframes.length - 1]; },
  _now() { return (typeof millis === 'function') ? millis() : Date.now(); },
  _ease(t) { t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); },
  _bakeScale() { return (typeof CONFIG !== 'undefined' && CONFIG.morphBakeScale != null) ? CONFIG.morphBakeScale : undefined; }
};
try { if (typeof window !== 'undefined') window.Palaeo = Palaeo; } catch (_) {}
