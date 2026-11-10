// ============================================================
// TE MANAWA: AUDIO
// ------------------------------------------------------------
// Interaction feedback, weather and eruption sound, and the voices of the birds — played into a
// REAL ROOM from the wall's speakers, so the whole design is about restraint:
//
//   · ONE limiter on the output (a DynamicsCompressor), so no pile-up can clip or jump out.
//   · FOUR BUSES (ui / world / birds / event), each with a voice cap; a global cap over them all.
//     A full bus steals its oldest lower-priority voice with a short fade, or drops the newcomer.
//   · A COOLDOWN per cue, on the real clock. A press inside its cue's cooldown is not silent: it
//     plays the cue's `fallback` (a soft tick), so every press is acknowledged without a second
//     thunderclap on top of the first.
//   · FATIGUE: the same cue repeated in quick succession gets quieter, and recovers when left alone.
//   · DUCKING: an eruption or a thunderclap pulls the birds down for its length.
//   · The BIRDS call one at a time, no species twice in a row, panned to where the bird stands,
//     and less often once nobody has touched the console for a while.
//   · Two LOOPS (storm rain, eruption rumble) follow the game's own state every frame, so no reset
//     path can strand one playing.
//
// Web Audio directly (not p5.sound): the clips are fetched and decoded in the background after
// boot, never in preload(), and a reset never touches the network. Everything is inert when
// TM_AUDIO.enabled is false, when the browser has no AudioContext, or in the headless harness.
// The piece must stay legible with no audio at all (md/TEMANAWA_BUILD_V3.md §3).
//
// Sources and licences for every clip: audio/CREDITS.md. Tunables: TM_AUDIO and AUDIO_CUES below
// (console-tunable, like TM_TIME). `?audio=0` turns it off for a session, `?vol=0.5` sets the level.
// ============================================================

const TM_AUDIO = {
  enabled:      true,    // the one switch: false = nothing is fetched, decoded or played
  master:       0.8,     // overall level into the room (0–1). Set it on site, with the room empty and full
  path:         'audio/',

  // ---- the buses: level, and how many voices each may hold at once ----
  bus: {
    ui:    { gain: 0.55, voices: 4 },   // console + button acknowledgements
    world: { gain: 0.70, voices: 3 },   // wind, rustle, whoosh, wingbeats
    birds: { gain: 0.60, voices: 2 },   // the cast's calls
    event: { gain: 0.90, voices: 3 }    // thunder, eruption
  },
  maxVoices:    8,       // across every bus (the two loops are extra)
  stealFadeMs:  45,      // a stolen voice fades over this, never cuts

  // ---- the limiter (a compressor set hard) ----
  limiter: { threshold: -12, knee: 6, ratio: 14, attack: 0.003, release: 0.25 },

  // ---- fatigue: a repeated cue loses level, down to a floor, and recovers on its own ----
  fatigueStep:     0.82,   // each recent repeat multiplies the level by this
  fatigueFloor:    0.40,
  fatigueHalfMs:   6000,   // the count of recent repeats halves every this-many ms

  // ---- the birds ----
  birdGapMs:        3500,  // never two bird calls closer together than this
  birdSpeciesMs:   16000,  // one species does not call again inside this
  birdEveryMs:     [7000, 15000],    // the ambient cadence while someone is at the console
  birdIdleEveryMs: [20000, 40000],   // ...and once the room has been left alone
  birdIdleAfterMs:  60000, // no input for this long = the room is idle
  birdIdleGain:     0.6,   // idle calls are quieter too
  birdPan:          0.7,   // how far a bird at the edge of the map pans (0 = mono)
  birdStandIns:     true,  // false silences the species voiced by a living relative (see audio/CREDITS.md)

  // ---- the loops ----
  rainGain:     0.5,
  rumbleGain:   0.9
};
try { if (typeof window !== 'undefined') window.TM_AUDIO = TM_AUDIO; } catch (_) {}

// ------------------------------------------------------------
// THE CUES. files: variants (never the same one twice running). bus + prio (higher survives a full
// bus). cooldownMs on the real clock, shared by a `group` when set. fallback: the cue played
// INSTEAD when this one is still cooling (interaction cues only, so a press is never silent).
// steps: a short sequence of the same clip ({ at seconds, rate, gain }). duck: [bus, level, ms].
// ------------------------------------------------------------
const AUDIO_CUES = {
  // ---- acknowledgements (the console's cards, the dial, a press inside another cue's cooldown) ----
  ui_tick:    { files: ['ui/ui_tick'],  bus: 'ui', prio: 1, gain: 0.55, cooldownMs: 60,  rateVar: 0.04, noFatigue: true },
  ui_select:  { files: ['ui/ui_tick'],  bus: 'ui', prio: 1, gain: 0.60, cooldownMs: 90,  rate: 0.78, rateVar: 0.03, noFatigue: true },
  ui_habitat: { files: ['ui/ui_tick'],  bus: 'ui', prio: 1, gain: 0.70, cooldownMs: 140, rate: 0.6,  noFatigue: true },
  ui_dial:    { files: ['ui/ui_tick'],  bus: 'ui', prio: 1, gain: 0.45, cooldownMs: 40,  noFatigue: true },   // rate follows the detent
  // ---- the boost verdicts: one soft struck note, rising for a right answer ----
  boost_ok:     { files: ['ui/ui_note'], bus: 'ui', prio: 3, gain: 0.60, cooldownMs: 700, fallback: 'ui_tick',
                  steps: [{ at: 0, rate: 1.0 }, { at: 0.13, rate: 1.335, gain: 0.85 }] },
  boost_answer: { files: ['ui/ui_note'], bus: 'ui', prio: 3, gain: 0.65, cooldownMs: 700, fallback: 'ui_tick',
                  steps: [{ at: 0, rate: 1.0 }, { at: 0.12, rate: 1.26, gain: 0.9 }, { at: 0.24, rate: 1.5, gain: 0.9 }] },
  boost_wrong:  { files: ['ui/ui_note'], bus: 'ui', prio: 3, gain: 0.50, cooldownMs: 700, fallback: 'ui_tick', rate: 0.5 },
  // ---- the world answering a press ----
  deep:       { files: ['sfx/sfx_whoosh_deep'], bus: 'world', prio: 2, gain: 0.70, cooldownMs: 900,  rateVar: 0.05, fallback: 'ui_tick' },
  timelapse:  { files: ['sfx/sfx_whoosh_long'], bus: 'world', prio: 2, gain: 0.55, cooldownMs: 4000 },
  wind_warm:  { files: ['sfx/sfx_wind_a'],      bus: 'world', prio: 2, gain: 0.60, cooldownMs: 3500, group: 'wind', rateVar: 0.05 },
  wind_cold:  { files: ['sfx/sfx_wind_b'],      bus: 'world', prio: 2, gain: 0.65, cooldownMs: 3500, group: 'wind', rateVar: 0.05 },
  rustle:     { files: ['sfx/sfx_rustle_01', 'sfx/sfx_rustle_02', 'sfx/sfx_rustle_03'], bus: 'world', prio: 1, gain: 0.55, cooldownMs: 500, rateVar: 0.08, fallback: 'ui_tick' },
  wingflap:   { files: ['sfx/sfx_wingflap_01'], bus: 'world', prio: 1, gain: 0.50, cooldownMs: 2500, rateVar: 0.08 },
  // ---- storm and eruption ----
  storm_press:{ files: ['sfx/sfx_thunder_far_01'], bus: 'event', prio: 3, gain: 0.80, cooldownMs: 7000, rateVar: 0.05, fallback: 'ui_tick' },
  thunder:    { files: ['sfx/sfx_thunder_01', 'sfx/sfx_thunder_02', 'sfx/sfx_thunder_03'], bus: 'event', prio: 4, gain: 0.75,
                cooldownMs: 4500, rateVar: 0.06, duck: ['birds', 0.45, 3500] },
  eruption:   { files: ['sfx/sfx_eruption_01'], bus: 'event', prio: 5, gain: 1.0, cooldownMs: 1800, duck: ['birds', 0.2, 7000], noFatigue: true }
};

// The two state-driven loops.
const AUDIO_LOOPS = {
  rain:   { file: 'sfx/sfx_rain_loop',   bus: 'world' },
  rumble: { file: 'sfx/sfx_rumble_loop', bus: 'event' }
};

// ------------------------------------------------------------
// THE VOICES OF THE CAST. Keyed by species key. `standIn` marks a species that is extinct and
// voiced by its closest living relative (audio/CREDITS.md says which, and why); TM_AUDIO.
// birdStandIns = false silences those. The moa, the huia and Finsch's duck have NO voice here:
// nothing recorded, and nothing honest to stand in for them.
// ------------------------------------------------------------
const AUDIO_BIRD_VOICES = {
  north_island_brown_kiwi: { files: ['birds/bird_kiwi_male_01', 'birds/bird_kiwi_female_01'], gain: 0.75 },
  kereru:                  { files: ['birds/bird_kereru_01'], gain: 0.70 },
  kokako:                  { files: ['birds/bird_kokako_01', 'birds/bird_kokako_02', 'birds/bird_kokako_03'], gain: 0.85 },
  tui:                     { files: ['birds/bird_tui_01', 'birds/bird_tui_02', 'birds/bird_tui_03', 'birds/bird_tui_04'], gain: 0.80 },
  north_island_takahe:     { files: ['birds/bird_takahe_01', 'birds/bird_takahe_02'], gain: 0.70, standIn: true },   // South Island takahē
  giant_goose:             { files: ['birds/bird_goose_01', 'birds/bird_goose_02'], gain: 0.60, standIn: true },     // Cape Barren goose
  eyles_harrier:           { files: ['birds/bird_harrier_01', 'birds/bird_harrier_02'], gain: 0.65, standIn: true }  // a living harrier (Circus)
};
AUDIO_BIRD_VOICES.young_eyles_harrier = AUDIO_BIRD_VOICES.eyles_harrier;

class AudioManager {
  // opts (the harness): { ctx: a stand-in AudioContext, now: () => ms }
  constructor(opts) {
    const o = opts || {};
    this.enabled = !!TM_AUDIO.enabled;
    this.loaded  = false;          // true once every clip has been fetched and decoded (or failed, logged)
    this._ctx    = o.ctx || null;
    this._clock  = o.now || (() => (typeof performance !== 'undefined' ? performance.now() : Date.now()));
    this._graph  = null;           // { master, limiter, bus: { name: GainNode } }
    this._buffers = {};            // file → AudioBuffer
    this._voices  = [];            // live one-shots: { src, gain, bus, prio, startAt, endAt }
    this._loops   = {};            // name → { src, gain, level, zeroAt }
    this._last    = {};            // cue group → ms last played
    this._fat     = {};            // cue group → { n, t } recent-repeat count
    this._lastFile = {};           // cue → index last used (no immediate repeat)
    this._birdLastAt = -1e9; this._birdLastKey = null; this._birdSpeciesAt = {};
    this._birdNextAt = 0;
    this._seenAsh = 0; this._seenDial = -1; this._seenTimelapse = false;
    this.stats = { played: 0, cooled: 0, fallback: 0, stolen: 0, dropped: 0, birds: 0 };
    this._applyURLFlags();
  }

  _applyURLFlags() {
    try {
      const q = new URLSearchParams(window.location.search);
      const a = q.get('audio');
      if (a === '0' || a === 'off') this.enabled = false;
      if (a === '1' || a === 'on')  this.enabled = true;
      const v = parseFloat(q.get('vol'));
      if (isFinite(v)) this._urlMaster = Math.max(0, Math.min(1, v));
    } catch (_) {}
  }

  _master() { return (this._urlMaster != null) ? this._urlMaster : TM_AUDIO.master; }

  // ============================================
  // GRAPH: buses → limiter → master → the room
  // ============================================
  _ensureGraph() {
    if (this._graph) return this._graph;
    if (!this.enabled) return null;
    try {
      if (!this._ctx) {
        const AC = (typeof window !== 'undefined') ? (window.AudioContext || window.webkitAudioContext) : null;
        if (!AC) return null;
        this._ctx = new AC({ latencyHint: 'interactive' });
      }
      const c = this._ctx, L = TM_AUDIO.limiter;
      const master = c.createGain(); master.gain.value = this._master();
      const limiter = c.createDynamicsCompressor();
      limiter.threshold.value = L.threshold; limiter.knee.value = L.knee; limiter.ratio.value = L.ratio;
      limiter.attack.value = L.attack; limiter.release.value = L.release;
      limiter.connect(master); master.connect(c.destination);
      const bus = {};
      for (const k in TM_AUDIO.bus) {
        const g = c.createGain(); g.gain.value = TM_AUDIO.bus[k].gain; g.connect(limiter); bus[k] = g;
      }
      this._graph = { master, limiter, bus };
    } catch (e) {
      console.warn('[Audio] no audio graph:', e && e.message);
      this._graph = null;
    }
    return this._graph;
  }

  // Web Audio starts suspended without a gesture unless Chrome carries the autoplay flag
  // (md/TEMANAWA_OPERATIONS.md). Kiosk calls this on every local input; cue() tries it too.
  resume() {
    try { if (this._ctx && this._ctx.state === 'suspended' && this._ctx.resume) this._ctx.resume(); } catch (_) {}
  }

  // ============================================
  // LOADING — in the background, after boot. Never from a reset.
  // ============================================
  _allFiles() {
    const set = {};
    for (const k in AUDIO_CUES) for (const f of AUDIO_CUES[k].files) set[f] = 1;
    for (const k in AUDIO_LOOPS) set[AUDIO_LOOPS[k].file] = 1;
    for (const k in AUDIO_BIRD_VOICES) for (const f of AUDIO_BIRD_VOICES[k].files) set[f] = 1;
    return Object.keys(set);
  }

  loadAll() {
    if (!this.enabled) { this.loaded = false; return; }   // off = nothing is fetched or decoded
    if (this._loading || this.loaded) return;
    if (typeof fetch !== 'function' || !this._ensureGraph()) { this.loaded = false; return; }
    this._loading = true;
    const files = this._allFiles(), ctx = this._ctx;
    let i = 0;
    // One at a time: a decode is off the main thread, but twenty at once is a burst of memory the
    // boot does not need.
    const next = () => {
      if (i >= files.length) { this._loading = false; this.loaded = true; return; }
      const f = files[i++];
      fetch(TM_AUDIO.path + f + '.wav')
        .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.arrayBuffer(); })
        .then(ab => new Promise((res, rej) => ctx.decodeAudioData(ab, res, rej)))
        .then(buf => { this._buffers[f] = buf; })
        .catch(e => console.warn('[Audio] could not load ' + f + '.wav:', e && e.message))   // never silent: see MISTAKES.md
        .then(next);
    };
    next();
  }

  // ============================================
  // ONE-SHOTS
  // ============================================
  // Play a cue. Returns true when the cue itself sounded, false when it was cooling (its fallback
  // may have sounded instead), unknown, off, or not loaded yet.
  // opts: { rate, gain, pan (-1..1) }
  cue(name, opts) {
    if (!this.enabled) return false;
    const c = AUDIO_CUES[name];
    if (!c) return false;
    const now = this._clock(), grp = c.group || name;
    const last = this._last[grp];
    if (last != null && now - last < c.cooldownMs) {
      this.stats.cooled++;
      if (c.fallback && c.fallback !== name) { this.stats.fallback++; this.cue(c.fallback); }
      return false;
    }
    if (!this._ensureGraph()) return false;
    this.resume();

    let idx = 0;
    if (c.files.length > 1) {
      idx = Math.floor(Math.random() * c.files.length);
      if (idx === this._lastFile[name]) idx = (idx + 1) % c.files.length;
    }
    const buf = this._buffers[c.files[idx]];
    if (!buf) return false;                       // still loading: no cooldown is spent
    this._lastFile[name] = idx;
    this._last[grp] = now;

    const o = opts || null;
    let gain = c.gain * ((o && o.gain != null) ? o.gain : 1);
    if (!c.noFatigue) gain *= this._fatigue(grp, now);
    const rv = c.rateVar ? 1 + (Math.random() * 2 - 1) * c.rateVar : 1;
    const baseRate = ((o && o.rate) || c.rate || 1) * rv;
    const pan = (o && o.pan) || 0;

    let ok = false;
    if (c.steps) {
      for (let s = 0; s < c.steps.length; s++) {
        const st = c.steps[s];
        if (this._start(buf, c.bus, gain * (st.gain != null ? st.gain : 1), baseRate * (st.rate || 1), pan, st.at || 0, c.prio, now)) ok = true;
      }
    } else {
      ok = !!this._start(buf, c.bus, gain, baseRate, pan, 0, c.prio, now);
    }
    if (ok) {
      this.stats.played++;
      if (c.duck) this.duck(c.duck[0], c.duck[1], c.duck[2]);
    }
    return ok;
  }

  // The level multiplier for a cue repeated in quick succession; also counts this play.
  _fatigue(grp, now) {
    let f = this._fat[grp];
    if (!f) f = this._fat[grp] = { n: 0, t: now };
    f.n *= Math.pow(0.5, (now - f.t) / TM_AUDIO.fatigueHalfMs);
    f.t = now;
    const m = Math.max(TM_AUDIO.fatigueFloor, Math.pow(TM_AUDIO.fatigueStep, f.n));
    f.n += 1;
    return m;
  }

  _prune(now) {
    const v = this._voices;
    for (let i = v.length - 1; i >= 0; i--) if (v[i].endAt <= now) v.splice(i, 1);
  }

  // Make room in `bus` (and under the global cap) for a voice of priority `prio`: steal the oldest
  // voice of equal-or-lower priority, or report there is none. Returns false = drop the newcomer.
  _makeRoom(bus, prio, now) {
    this._prune(now);
    const v = this._voices, cap = TM_AUDIO.bus[bus].voices;
    let inBus = 0;
    for (let i = 0; i < v.length; i++) if (v[i].bus === bus) inBus++;
    for (let pass = 0; pass < 2; pass++) {
      const over = pass === 0 ? inBus >= cap : v.length >= TM_AUDIO.maxVoices;
      if (!over) continue;
      let victim = -1;
      for (let i = 0; i < v.length; i++) {          // voices are in start order: the first match is the oldest
        if (pass === 0 && v[i].bus !== bus) continue;
        if (v[i].prio <= prio && (victim < 0 || v[i].prio < v[victim].prio)) victim = i;
      }
      if (victim < 0) { this.stats.dropped++; return false; }
      this._stopVoice(v[victim], TM_AUDIO.stealFadeMs);
      v.splice(victim, 1);
      this.stats.stolen++;
    }
    return true;
  }

  _stopVoice(voice, fadeMs) {
    try {
      const t = this._ctx.currentTime, f = Math.max(0.005, fadeMs / 1000);
      voice.gain.gain.cancelScheduledValues(t);
      voice.gain.gain.setTargetAtTime(0, t, f / 3);
      voice.src.stop(t + f * 2);
    } catch (_) {}
  }

  _start(buf, bus, gain, rate, pan, delaySec, prio, now) {
    const G = this._graph;
    if (!G || !G.bus[bus]) return null;
    if (!this._makeRoom(bus, prio, now)) return null;
    try {
      const c = this._ctx;
      const src = c.createBufferSource(); src.buffer = buf; src.playbackRate.value = rate;
      const g = c.createGain(); g.gain.value = gain;
      src.connect(g);
      if (pan && c.createStereoPanner) {
        const p = c.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan));
        g.connect(p); p.connect(G.bus[bus]);
      } else g.connect(G.bus[bus]);
      src.start(c.currentTime + delaySec);
      const voice = { src: src, gain: g, bus: bus, prio: prio, startAt: now,
                      endAt: now + (delaySec + buf.duration / rate) * 1000 + 50 };
      this._voices.push(voice);
      return voice;
    } catch (e) {
      console.warn('[Audio] play failed:', e && e.message);
      return null;
    }
  }

  // Pull a bus down to `level` (× its own gain) now, and let it back up after `ms`.
  duck(bus, level, ms) {
    const G = this._graph;
    if (!G || !G.bus[bus]) return;
    try {
      const p = G.bus[bus].gain, t = this._ctx.currentTime, base = TM_AUDIO.bus[bus].gain;
      p.cancelScheduledValues(t);
      p.setTargetAtTime(base * level, t, 0.08);
      p.setTargetAtTime(base, t + ms / 1000, 0.7);
    } catch (_) {}
  }

  // ============================================
  // LOOPS — a level (0–1) set every frame from the game's state
  // ============================================
  setLoop(name, level) {
    const def = AUDIO_LOOPS[name];
    if (!def || !this.enabled) return;
    let L = this._loops[name];
    if (!L) L = this._loops[name] = { src: null, gain: null, level: 0, zeroAt: 0 };
    const now = this._clock();
    if (level > 0.001 && !L.src) {
      const G = this._ensureGraph(), buf = this._buffers[def.file];
      if (!G || !buf) return;
      try {
        const c = this._ctx;
        L.src = c.createBufferSource(); L.src.buffer = buf; L.src.loop = true;
        L.gain = c.createGain(); L.gain.gain.value = 0;
        L.src.connect(L.gain); L.gain.connect(G.bus[def.bus]);
        L.src.start();
        L.level = 0;
      } catch (e) { L.src = null; return; }
    }
    if (!L.src) return;
    if (Math.abs(level - L.level) > 0.02 || (level <= 0.001 && L.level > 0)) {
      L.level = level <= 0.001 ? 0 : level;
      try { L.gain.gain.setTargetAtTime(L.level, this._ctx.currentTime, 0.25); } catch (_) {}
      if (L.level === 0) L.zeroAt = now;
    }
    if (L.level === 0 && now - L.zeroAt > 2500) {     // faded right out: let the source go
      try { L.src.stop(); } catch (_) {}
      L.src = null; L.gain = null;
    }
  }

  // ============================================
  // THE BIRDS
  // ============================================
  // One call from `speciesKey`, panned to map-x fraction `fx` (0–1). Gated so the room never hears
  // two calls close together, nor one species over and over. Returns true when it sounded.
  birdCall(speciesKey, fx, gainMul) {
    if (!this.enabled) return false;
    const v = AUDIO_BIRD_VOICES[speciesKey];
    if (!v || (v.standIn && !TM_AUDIO.birdStandIns)) return false;
    const now = this._clock();
    if (now - this._birdLastAt < TM_AUDIO.birdGapMs) return false;
    const sp = this._birdSpeciesAt[speciesKey];
    if (sp != null && now - sp < TM_AUDIO.birdSpeciesMs) return false;
    if (!this._ensureGraph()) return false;
    let idx = Math.floor(Math.random() * v.files.length);
    const lk = 'bird:' + speciesKey;
    if (v.files.length > 1 && idx === this._lastFile[lk]) idx = (idx + 1) % v.files.length;
    const buf = this._buffers[v.files[idx]];
    if (!buf) return false;
    const pan = (fx != null && isFinite(fx)) ? (fx * 2 - 1) * TM_AUDIO.birdPan : 0;
    const rate = 1 + (Math.random() * 2 - 1) * 0.02;
    if (!this._start(buf, 'birds', v.gain * (gainMul != null ? gainMul : 1), rate, pan, 0, 2, now)) return false;
    this._lastFile[lk] = idx;
    this._birdLastAt = now; this._birdSpeciesAt[speciesKey] = now; this._birdLastKey = speciesKey;
    this.stats.birds++; this.stats.played++;
    return true;
  }

  // A call from a live bird: where it stands on the map sets the pan.
  birdCallFrom(bird, gainMul) {
    if (!bird || !bird.speciesKey) return false;
    const t = bird.terrain, w = (t && t.mapWidth) || 0;
    return this.birdCall(bird.speciesKey, (w > 0 && bird.pos) ? bird.pos.x / w : 0.5, gainMul);
  }

  // The ambient cadence: every so often, one of the birds on the map that has a voice calls.
  // Allocation-free; two passes over the lists (count, then pick) only when a call is due.
  _ambientBirds(g, now) {
    if (now < this._birdNextAt) return;
    const idle = (typeof Kiosk !== 'undefined' && Kiosk.lastInputAt)
      ? (Date.now() - Kiosk.lastInputAt) > TM_AUDIO.birdIdleAfterMs : false;
    const r = idle ? TM_AUDIO.birdIdleEveryMs : TM_AUDIO.birdEveryMs;
    this._birdNextAt = now + r[0] + Math.random() * (r[1] - r[0]);
    const sim = g && g.simulation;
    if (!sim) return;
    const pick = this._pickVoiced(sim, -1);
    if (pick < 0) return;
    const bird = this._pickVoiced(sim, Math.floor(Math.random() * (pick + 1)));
    if (bird && typeof bird === 'object') this.birdCallFrom(bird, idle ? TM_AUDIO.birdIdleGain : 1);
  }

  // want < 0: return (count − 1) of live voiced birds whose species is free to call. Otherwise
  // return the want-th such bird.
  _pickVoiced(sim, want) {
    let n = -1;
    const now = this._clock();
    for (let pass = 0; pass < 2; pass++) {
      const list = pass === 0 ? sim.moas : sim.eagles;
      if (!list) continue;
      for (let i = 0; i < list.length; i++) {
        const b = list[i];
        if (!b || !b.alive) continue;
        const v = AUDIO_BIRD_VOICES[b.speciesKey];
        if (!v || (v.standIn && !TM_AUDIO.birdStandIns)) continue;
        if (b.speciesKey === this._birdLastKey) continue;                 // not the same species twice running
        const sp = this._birdSpeciesAt[b.speciesKey];
        if (sp != null && now - sp < TM_AUDIO.birdSpeciesMs) continue;
        n++;
        if (n === want) return b;
      }
    }
    return want < 0 ? n : null;
  }

  // ============================================
  // PER FRAME — follow the game's own state, so every path that arms an effect is heard and no
  // reset can strand a loop. Called from draw(); allocation-free.
  // ============================================
  update(g) {
    if (!this.enabled || !g) return;
    if (!this._graph && !this._ensureGraph()) return;
    const now = this._clock();
    const ms = (typeof millis === 'function') ? millis() : 0;
    const m = this._master();
    if (m !== this._masterSet) { this._masterSet = m; try { this._graph.master.gain.value = m; } catch (_) {} }

    // The storm's rain, for as long as its window is open.
    const storm = !!(g._tmStormUntil && ms < g._tmStormUntil);
    this.setLoop('rain', storm ? TM_AUDIO.rainGain : 0);

    // The eruption: the rumble follows the same 0–1 charge the screen shake reads (a held button,
    // a timeline eruption, the attract landing, then the decay under the ash cloud); the blast
    // sounds once each time an ash cover is armed, whoever armed it.
    let s = 0;
    if (typeof TM_TIME !== 'undefined') {
      const LP = TM_TIME.erLongPressMs;
      if (g._tmErDownAt && !g._tmErFired) s = Math.max(s, Math.min(1, (ms - g._tmErDownAt) / LP));
      if (g._tmAutoErAt)    s = Math.max(s, Math.min(1, (ms - g._tmAutoErAt) / LP));
      if (g._tmAttractErAt) s = Math.max(s, Math.min(1, (ms - g._tmAttractErAt) / LP));
      if (g._tmPalaeoErAt)  s = Math.max(s, Math.min(1, (ms - g._tmPalaeoErAt) / LP));
      if (g._ashCloudUntil && ms < g._ashCloudUntil) s = Math.max(s, (g._ashCloudUntil - ms) / TM_TIME.cloudMillis);
    }
    this.setLoop('rumble', s > 0 ? TM_AUDIO.rumbleGain * (0.15 + 0.85 * s * s) : 0);
    const ash = g._ashCloudUntil || 0;
    if (ash !== this._seenAsh) {
      if (ash > ms) this.cue('eruption');
      this._seenAsh = ash;
    }

    // The time dial: one tick per detent, pitched by where the dial stands. Read off DeepTime, so
    // the keys, the wheel and the console's relay all sound the same.
    if (typeof DeepTime !== 'undefined') {
      const d = DeepTime.dialStep | 0;
      if (this._seenDial < 0) this._seenDial = d;
      else if (d !== this._seenDial) {
        this._seenDial = d;
        this.cue('ui_dial', this._dialOpts(d / (DeepTime.dialSteps || 30)));
      }
      const tl = DeepTime.isTimelapsing ? DeepTime.isTimelapsing() : false;
      if (tl && !this._seenTimelapse) this.cue('timelapse');
      this._seenTimelapse = tl;
    }

    // The birds: silent while the land before the window plays (nothing lives there).
    if (!(typeof Palaeo !== 'undefined' && Palaeo.active)) this._ambientBirds(g, now);
  }

  _dialOpts(f) {
    const o = this._dialO || (this._dialO = { rate: 1 });
    o.rate = 0.8 + 0.9 * f;
    return o;
  }
}

// Global audio manager instance
let audioManager = null;

/**
 * Initialize audio manager - call in setup()
 */
function initAudioManager() {
  audioManager = new AudioManager();
  return audioManager;
}

/**
 * Start loading the audio - called from preload(), but nothing here holds preload up: the clips
 * arrive in the background and each cue is simply silent until its clip has.
 */
function preloadAudio() {
  if (!audioManager) {
    audioManager = new AudioManager();
  }
  audioManager.loadAll();
}
