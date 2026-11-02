// ============================================================
// TE MANAWA SECOND SCREEN: THE CONSOLE'S KIOSK LAYER
// ------------------------------------------------------------
// The touchscreen's share of what TeManawa_kiosk.js does for the wall: errors go to a
// localStorage ring buffer (a post-mortem that survives the reload), a burst of errors reloads
// the page, and the page reloads at 03:00 like the wall does. Loads first, so its handlers are
// armed before the rest of the page runs.
//
// No watchdog: the console is a DOM page with no frame loop to stall, and an error in one
// handler leaves the page standing. The diorama's own log is a different key
// (Kiosk.getErrorLog() in that window); this one is TMConsoleKiosk.getErrorLog() in this one.
// ============================================================

const TMConsoleKiosk = {
  errorLogKey:       'tm_console_errors',
  errorLogMax:       20,
  errorBurstMax:     5,        // errors inside errorBurstMs before the page reloads
  errorBurstMs:      30000,
  nightlyReloadHour: 3,        // the wall's hour; null disables

  _bootAt:     Date.now(),
  _burstAt:    0,
  _burstCount: 0,
  _installed:  false,

  install() {
    if (this._installed) return;
    this._installed = true;
    window.addEventListener('error', (e) =>
      this._onError('error', e.message + ' @' + (e.filename || '?') + ':' + (e.lineno || 0)));
    window.addEventListener('unhandledrejection', (e) => this._onError('promise', String(e.reason)));
    setInterval(() => this.tick(), 10000);
  },

  _onError(kind, message) {
    this.logError(kind, message);
    const now = Date.now();
    if (now - this._burstAt > this.errorBurstMs) { this._burstAt = now; this._burstCount = 0; }
    if (++this._burstCount > this.errorBurstMax) this.reload('error-burst');
  },

  // The 03:00 reload. The page must have been up two minutes, or the page this reload boots
  // (still inside 03:00) would reload again, and again, until the minute ran out — the bug the
  // wall had (MISTAKES.md).
  tick() {
    if (this.nightlyReloadHour === null) return;
    const now = Date.now(), d = new Date();
    if (d.getHours() === this.nightlyReloadHour && d.getMinutes() === 0 && now - this._bootAt > 120000) {
      this.reload('nightly');
    }
  },

  reload(reason) {
    if (reason !== 'nightly') this.logError('reload', reason);
    try { console.warn('[ConsoleKiosk] reload:', reason); } catch (e) { /* ignore */ }
    location.reload();
  },

  logError(kind, message) {
    const entry = { t: new Date().toISOString(), kind, message: String(message).slice(0, 400) };
    try { console.error('[ConsoleKiosk]', kind, message); } catch (e) { /* ignore */ }
    try {
      const raw = localStorage.getItem(this.errorLogKey);
      const log = raw ? JSON.parse(raw) : [];
      log.push(entry);
      while (log.length > this.errorLogMax) log.shift();
      localStorage.setItem(this.errorLogKey, JSON.stringify(log));
    } catch (e) { /* storage unavailable; the console entry above still stands */ }
  },

  getErrorLog() {
    try { const raw = localStorage.getItem(this.errorLogKey); return raw ? JSON.parse(raw) : []; }
    catch (e) { return []; }
  },

  clearErrorLog() {
    try { localStorage.removeItem(this.errorLogKey); } catch (e) { /* ignore */ }
  }
};

TMConsoleKiosk.install();
