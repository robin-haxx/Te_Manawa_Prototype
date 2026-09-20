// ============================================================
// TE MANAWA: KIOSK LAYER
// ------------------------------------------------------------
// Everything that makes this survive being an unattended museum
// installation with no operator: the soft reset, the idle/attract
// cycle, the frame-loop watchdog, error capture, and input lockdown.
//
// The governing rule (TEMANAWA_BUILD_V3.md §5.1):
//
//     A RESET MUST NEVER TOUCH THE NETWORK.
//
// resetToAttract() rebuilds the world from memory. It is the same code
// path used by the idle timeout, the end of the timeline, the Eruption
// button and the onerror handler, so it gets exercised constantly and
// is the one thing in the build that cannot be allowed to rot.
//
// A hard reload (location.reload) re-decodes every asset and is the
// expensive path. It is reserved for a stalled frame loop and the
// nightly refresh.
// ============================================================

const Kiosk = {
  // ---- tunables --------------------------------------------
  idleSeconds:        180,      // no input for this long -> attract reset
  watchdogSeconds:    10,      // no draw() heartbeat for this long -> hard reload
  nightlyReloadHour:  3,       // local hour for the scheduled refresh (null disables)
  crossfadeMillis:    400,     // covers the soft reset
  errorLogKey:        'tm_errors',
  errorLogMax:        20,

  // ---- state -----------------------------------------------
  lastInputAt:   0,
  lastHeartbeat: 0,
  resetCount:    0,
  lastResetMs:   0,
  _fadeUntil:    0,
  _watchdogTimer: null,
  _installed:    false,
  // Set by attach() from setup(): NOT window.game, which is permanently
  // undefined here (a classic-script `let` is a lexical global, not a window
  // property), so every recovery path would silently no-op. See MISTAKES.md.
  game:          null,

  // ==========================================================
  // INSTALL: called once from setup()
  // ==========================================================
  attach(g) {
    this.game = g;
  },

  install() {
    if (this._installed) return;
    this._installed = true;

    this.lastInputAt = this.lastHeartbeat = Date.now();

    // --- error capture -> ring buffer -> soft reset ----------
    window.addEventListener('error', (e) => {
      this.logError('error', e.message + ' @' + (e.filename || '?') + ':' + (e.lineno || 0));
      this.recover();
    });
    window.addEventListener('unhandledrejection', (e) => {
      this.logError('promise', String(e.reason));
      this.recover();
    });

    // --- watchdog: runs OUTSIDE the p5 loop -----------------
    // If draw() has thrown or the WebGL context is gone, the heartbeat
    // stops but this interval keeps running. That is the whole point.
    this._watchdogTimer = setInterval(() => this.tick(), 2000);

    // --- input lockdown -------------------------------------
    const stop = (e) => e.preventDefault();
    document.addEventListener('contextmenu', stop);
    document.addEventListener('gesturestart', stop);
    document.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches.length > 1) e.preventDefault();
    }, { passive: false });
    document.addEventListener('dblclick', stop);

    const css = document.createElement('style');
    css.textContent =
      'html,body{margin:0;padding:0;overflow:hidden;background:#0e1513;' +
      'touch-action:none;-webkit-user-select:none;user-select:none;' +
      '-webkit-tap-highlight-color:transparent;cursor:none;}' +
      'canvas{display:block;touch-action:none;}';
    document.head.appendChild(css);

    // --- audio: Web Audio starts suspended without a gesture -
    // The Chromium autoplay flag is not enough on its own, so resume on
    // the first input of any kind. The piece must stay legible with no
    // audio at all, so a permanently-suspended context is a degradation
    // and never a failure.
    const resume = () => {
      try {
        if (typeof getAudioContext === 'function') {
          const ctx = getAudioContext();
          if (ctx && ctx.state !== 'running') ctx.resume();
        }
      } catch (err) { /* audio is optional, never let this throw */ }
    };
    ['pointerdown', 'keydown', 'touchstart'].forEach(
      ev => document.addEventListener(ev, resume, { once: false })
    );

    console.log('[Kiosk] installed: idle ' + this.idleSeconds + 's, watchdog ' +
                this.watchdogSeconds + 's, nightly reload ' +
                (this.nightlyReloadHour === null ? 'off' : this.nightlyReloadHour + ':00'));
  },

  // ==========================================================
  // HEARTBEAT: called every frame from draw()
  // ==========================================================
  beat() {
    this.lastHeartbeat = Date.now();
  },

  noteInput() {
    this.lastInputAt = Date.now();
    // A returning visitor cancels a pending attract-loop buildup, so the world is never reset out
    // from under them mid-charge; the rumble/flash just eases back down as the flag clears.
    const g = this.game;
    if (g && g._tmAttractErAt) g._tmAttractErAt = 0;
  },

  // Arm the attract-loop reset as a volcanic buildup (idle path only). The eruption-charge
  // visuals (renderAshFlash / eruptionShakeOffset in TeManawa_hud.js) read _tmAttractErAt
  // exactly like the timeline eruption's _tmAutoErAt, ramping the rumble + flash over
  // erLongPressMs; InstallHUD.update() then calls resetToAttract at the crest (under the flash)
  // and arms the ash-cloud window (renderAshCloud plays the reveal). Refused while a charge or
  // ash window is already live, so it never stacks on a real eruption. millis() is a p5 global,
  // available in this setInterval tick.
  beginAttractEruption(g) {
    if (!g) return false;
    const now = (typeof millis === 'function') ? millis() : 0;
    const busy = g._tmAttractErAt || g._tmAutoErAt || g._tmErDownAt ||
                 (g._ashCloudUntil && now < g._ashCloudUntil);
    if (busy) return false;
    g._tmAttractErAt = now;
    return true;
  },

  // ==========================================================
  // WATCHDOG TICK: called from setInterval, never from draw()
  // ==========================================================
  tick() {
    const now = Date.now();

    // 0. Hidden tab -> the browser throttles/pauses requestAnimationFrame, so the
    //    heartbeat stops WITHOUT anything being wrong. That is a dev-environment
    //    state (tab switch, DevTools, screenshots); the kiosk panel is never
    //    hidden. Treat it as time-not-passing rather than a stall, otherwise
    //    authoring sessions live in a reload loop.
    if (typeof document !== 'undefined' && document.hidden) {
      this.lastHeartbeat = now;
      return;
    }

    // 1. Frame loop stalled -> hard reload. Catches a thrown draw() and a
    //    lost graphics context, neither of which the p5 loop can recover from.
    if (now - this.lastHeartbeat > this.watchdogSeconds * 1000) {
      this.logError('stall', 'no heartbeat for ' +
                    ((now - this.lastHeartbeat) / 1000).toFixed(1) + 's');
      this.hardReload('watchdog');
      return;
    }

    // 2. Idle -> attract reset, STAGED AS A VOLCANIC EVENT. Rather than swapping the world
    //    silently, arm the same charge the timeline/button eruptions use (rumble + ash-cloud
    //    roll-down); InstallHUD.update() performs the actual reset at the crest, hidden under the
    //    ash cover, then plays the reveal. The reset itself stays synchronous (resetToAttract is
    //    untouched); only this idle TRIGGER pre-rolls. If a charge/ash window is already live the
    //    arm is refused and we retry on the next tick (lastInputAt only advances once it takes).
    if (now - this.lastInputAt > this.idleSeconds * 1000) {
      const g = this.game;
      if (g && g.terrain && this.beginAttractEruption(g)) {
        this.lastInputAt = now;
      }
    }

    // 3. Nightly refresh: blunt, and it defeats every slow leak we didn't find.
    if (this.nightlyReloadHour !== null) {
      const d = new Date();
      if (d.getHours() === this.nightlyReloadHour && d.getMinutes() === 0 &&
          now - this.lastResetMs > 120000) {
        this.hardReload('nightly');
      }
    }
  },

  // ==========================================================
  // SOFT RESET: the important one
  // ----------------------------------------------------------
  // Target: 10-25 ms, hidden behind a crossfade. It must not call
  // loadImage, loadSound, fetch, or anything else that touches the
  // network or re-decodes an asset. If this ever needs to, the design
  // has gone wrong; see TEMANAWA_BUILD_V3.md §5.1.
  // ==========================================================
  // reseedEvery: every Nth reset also regenerates the terrain, so the landscape
  // isn't identical all day. That one is expensive (see Game.init), which is
  // exactly why it is occasional rather than every time.
  reseedEvery: 12,

  // opts.reseed (optional) forces the terrain rebuild on or off for this call.
  // Left undefined, the every-Nth counter below decides (the attract/idle/error
  // path), so the land still varies across an unattended day. The Eruption button
  // overrides it: a tap passes reseed:false (cheap, terrain kept) and a long
  // press passes reseed:true (the deliberate reseed). See TeManawa_hud.js.
  resetToAttract(g, reason = 'manual', opts = null) {
    if (!g || !g.currentLevel) return 0;
    const t0 = (typeof performance !== 'undefined') ? performance.now() : 0;

    try {
      g.playTime = 0;
      g.timeScale = 1;
      g._tmDeepUntil = g._tmGrowWarmUntil = g._tmGrowColdUntil = g._tmStormUntil = 0;
      g._tmAttractErAt = 0;   // clear any pending attract-loop buildup (the completion clears it too)
      g._regimeFit = 1; g._recruitment = 1;
      g._stormPressure = 0; g._stormOveruse = false;
      g._tmStormCells = null;
      g._tmBolt = null;
      if (g.notifications) g.notifications.length = 0;
      if (g.ui && g.ui.messages) g.ui.messages.length = 0;

      // Rebuild from memory: no loadImage, no loadSound, no network.
      let reseed = (this.resetCount + 1) % this.reseedEvery === 0;
      if (opts && typeof opts.reseed === 'boolean') reseed = opts.reseed;

      // Return to the LAST ERUPTION rather than the far start (user request): an idle or
      // end-of-window reset seeks back to the previous eruption checkpoint and replays it
      // (Game.applyEruptionAt), so the ambient loop cycles on the eruptions instead of
      // restarting the whole 1 Ma every time. Exceptions:
      //   · a periodic reseed (every reseedEvery) is a deliberate FULL restart at 1 Ma: it
      //     also varies the land, and lets the whole cycle (emergence onward) replay;
      //   · before the first eruption (no prior), a plain rebuild at the current start.
      // NOTE: applyEruptionAt morphs the terrain to the eruption year, so this reset is
      // heavier than the bare resetEcosystem() swap, but it is crossfaded and infrequent
      // (idle / once per cycle), well short of the watchdog. See TEMANAWA_BUILD_V3.md §5.1.
      const beforeYear = (typeof DeepTime !== 'undefined') ? DeepTime.yearsBP : null;
      const lastEr = (typeof DeepTime !== 'undefined' && beforeYear != null) ? DeepTime.prevEruption(beforeYear) : null;
      if (!reseed && lastEr != null && typeof g.applyEruptionAt === 'function') {
        g.applyEruptionAt(lastEr, DeepTime.eruptionByYear(lastEr));   // back to the last eruption
      } else if (reseed) {
        g.init();                                                     // full restart at 1 Ma (+ reseed the land)
      } else {
        g.resetEcosystem();                                          // before the first eruption → rebuild at start
      }

      this.resetCount++;
      this.lastResetMs = Date.now();
      this._fadeUntil = millis() + this.crossfadeMillis;
    } catch (err) {
      this.logError('reset', String(err && err.message || err));
      this.hardReload('reset-failed');
      return -1;
    }

    const ms = ((typeof performance !== 'undefined') ? performance.now() : 0) - t0;
    this.lastResetMs_duration = ms;
    console.log(`[Kiosk] soft reset (${reason}) in ${ms.toFixed(1)}ms, #${this.resetCount}`);
    return ms;
  },

  // Draw over the top of everything while the reset settles.
  renderCrossfade(W, H) {
    if (millis() >= this._fadeUntil) return;
    const a = ((this._fadeUntil - millis()) / this.crossfadeMillis) * 255;
    push(); noStroke(); fill(14, 21, 19, a); rect(0, 0, W, H); pop();
  },

  // ==========================================================
  // RECOVERY / HARD RELOAD
  // ==========================================================
  recover() {
    const g = this.game;
    if (g && g.terrain && g.currentLevel) {
      const ms = this.resetToAttract(g, 'error');
      if (ms >= 0) return;
    }
    this.hardReload('unrecoverable');
  },

  hardReload(reason) {
    console.warn('[Kiosk] hard reload:', reason);
    try { clearInterval(this._watchdogTimer); } catch (e) { /* ignore */ }
    if (typeof location !== 'undefined' && location.reload) location.reload();
  },

  // ==========================================================
  // ERROR RING BUFFER: survives the reload, so there's a post-mortem
  // ==========================================================
  logError(kind, message) {
    const entry = { t: new Date().toISOString(), kind, message: String(message).slice(0, 400) };
    console.error('[Kiosk]', kind, message);
    try {
      const raw = localStorage.getItem(this.errorLogKey);
      const log = raw ? JSON.parse(raw) : [];
      log.push(entry);
      while (log.length > this.errorLogMax) log.shift();
      localStorage.setItem(this.errorLogKey, JSON.stringify(log));
    } catch (e) { /* storage unavailable; the console entry above still stands */ }
  },

  getErrorLog() {
    try {
      const raw = localStorage.getItem(this.errorLogKey);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  },

  clearErrorLog() {
    try { localStorage.removeItem(this.errorLogKey); } catch (e) { /* ignore */ }
  },

  // ---- readouts for the debug overlay ----------------------
  idleSecondsRemaining() {
    return Math.max(0, this.idleSeconds - (Date.now() - this.lastInputAt) / 1000);
  }
};
