// ============================================================
// TE MANAWA: THE KIOSK SHELL
// ------------------------------------------------------------
// The museum runs ONE executable. It starts the project's own static server
// (web/tools/serve.js) on 127.0.0.1, opens the diorama full-screen on the
// largest display and the console full-screen on the other, keeps the console
// focused so the macro pad's keys always land on it, reloads a crashed or hung
// page, blocks display sleep, writes what the pages log to a file, and
// relaunches itself once a night. Nothing in web/ knows it is inside Electron:
// the same files run under Chrome + `node tools/serve.js`
// (TEMANAWA_OPERATIONS.md §2), which stays the authoring path and the fallback.
//
//   TeManawa.exe                   the wall (kiosk)
//   TeManawa.exe --dev             windowed, DevTools on F12, ?dev=1 on the wall, ?debug=1 on the console
//   TeManawa.exe --config x.json   a config other than temanawa.config.json beside the exe
//   TeManawa.exe --web <dir>       serve another web root (default: web/ beside this file, else the repo)
//   TeManawa.exe --displays        print the displays with their indexes and exit
//
// Ctrl+Shift+Q quits (an operator with a keyboard; the macro pad never sends it).
// Log: <userData>/temanawa-shell.log  (Windows: %APPDATA%\TeManawa\temanawa-shell.log)
// ============================================================
'use strict';
const { app, BrowserWindow, screen, powerSaveBlocker, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');

const DEFAULTS = {
  port: 8080,                 // the server's port; a taken port falls back to any free one
  wall:    { display: 'largest', query: '' },   // 'largest' | 'smallest' | 'primary' | an index (see --displays)
  console: { display: 'other',   query: '' },   // 'other' = the display the wall is not on | an index | 'none'
  kiosk: true,                // full screen, frameless, no menu. --dev overrides
  relaunchHour: 3,            // the whole process relaunches at HH:05 (the pages reload themselves at HH:00); null disables
  ignoreGpuBlocklist: false,  // true forces GPU WebGL on a blocklisted GPU; try it before accepting the 2D fallback
  unresponsiveSeconds: 20     // a page hung this long is crashed and reloaded
};

// ---- arguments ---------------------------------------------
const argv = process.argv.slice(1);
const has = (n) => argv.includes('--' + n);
const arg = (n) => { const i = argv.indexOf('--' + n); return i >= 0 ? argv[i + 1] : undefined; };
const DEV = has('dev');

// ---- the web root ------------------------------------------
const WEB = (() => {
  if (arg('web')) return path.resolve(arg('web'));
  const beside = path.join(__dirname, 'web');
  if (fs.existsSync(path.join(beside, 'index.html'))) return beside;
  return path.resolve(__dirname, '..');                // running from the repo: electron/ sits in it
})();

// ---- config: --config, beside the exe, beside main.js, userData -----
function loadConfig() {
  const cands = [];
  if (arg('config')) cands.push(path.resolve(arg('config')));
  if (app.isPackaged) cands.push(path.join(path.dirname(process.execPath), 'temanawa.config.json'));
  cands.push(path.join(__dirname, 'temanawa.config.json'));
  cands.push(path.join(app.getPath('userData'), 'temanawa.config.json'));
  const cfg = JSON.parse(JSON.stringify(DEFAULTS));
  for (const c of cands) {
    if (!fs.existsSync(c)) continue;
    try {
      const j = JSON.parse(fs.readFileSync(c, 'utf8'));
      for (const k of Object.keys(j)) {
        if (k.startsWith('_')) continue;                                  // "_comment" keys
        if ((k === 'wall' || k === 'console') && j[k] && typeof j[k] === 'object') Object.assign(cfg[k], j[k]);
        else cfg[k] = j[k];
      }
      cfg._file = c;
      return cfg;
    } catch (e) { console.error('config unreadable, ignored:', c, e.message); }
  }
  return cfg;
}

// ---- log file ----------------------------------------------
let LOG_FILE = null;
function log(...parts) {
  const line = new Date().toISOString() + ' ' + parts.map(String).join(' ');
  console.log(line);
  if (!LOG_FILE) return;
  try {
    try { if (fs.statSync(LOG_FILE).size > 2 * 1024 * 1024) fs.renameSync(LOG_FILE, LOG_FILE + '.1'); } catch (_) { /* no file yet */ }
    fs.appendFileSync(LOG_FILE, line + '\n');
  } catch (_) { /* a full disk must not take the shell down */ }
}
// The pages' console lines worth keeping: warnings/errors, and the kiosk/attract/render tags.
const TAGGED = /^\[(Kiosk|ConsoleKiosk|Palaeo|Render|GL|GLBatch|Atlas|Bus|TMBus)\]/;
function consoleRelay(name) {
  return (ev, a, b) => {
    // Electron ≥ 32 passes one details object (ev.level is a string); older builds pass (event, level, message)
    let level = a, message = b;
    if (ev && typeof ev === 'object' && 'message' in ev && b === undefined) { level = ev.level; message = ev.message; }
    const bad = level === 'error' || level === 'warning' || level === 2 || level === 3;
    const text = String(message);
    if (bad || TAGGED.test(text)) log(`[${name}] ${text.slice(0, 400)}`);
  };
}

// ---- displays ----------------------------------------------
function describeDisplays(all) {
  return all.map((d, i) => `  [${i}] ${d.size.width}x${d.size.height} @${d.scaleFactor}x at ${d.bounds.x},${d.bounds.y}${d.id === screen.getPrimaryDisplay().id ? ' (primary)' : ''}`).join('\n');
}
function pickDisplays(cfg) {
  const all = screen.getAllDisplays();
  const area = (d) => d.size.width * d.size.height * d.scaleFactor * d.scaleFactor;   // physical pixels
  const byArea = all.slice().sort((p, q) => area(q) - area(p));
  const pick = (sel, fallback) => {
    if (typeof sel === 'number') return all[sel] || fallback;
    if (sel === 'largest') return byArea[0];
    if (sel === 'smallest') return byArea[byArea.length - 1];
    if (sel === 'primary') return screen.getPrimaryDisplay();
    return fallback;
  };
  const wall = pick(cfg.wall.display, byArea[0]);
  let con = null;
  const cs = cfg.console.display;
  if (cs === 'other') con = all.find(d => d.id !== wall.id) || null;
  else if (cs !== 'none') con = pick(cs, null);
  return { all, wall, console: con };
}

// ---- windows -----------------------------------------------
let quitting = false;
let cfg = null;
let origin = '';

function openWindow(name, display, url, kiosk, offset) {
  const b = display.bounds;
  const geom = kiosk ? { x: b.x, y: b.y, width: b.width, height: b.height }
                     : { x: b.x + 40 + offset, y: b.y + 40 + offset, width: Math.min(1600, b.width - 80), height: Math.min(900, b.height - 80) };
  const win = new BrowserWindow({
    ...geom, kiosk, fullscreen: kiosk, frame: !kiosk, autoHideMenuBar: true, title: name,
    backgroundColor: '#0e1513', show: false,
    webPreferences: {
      contextIsolation: true, nodeIntegration: false, sandbox: true,
      backgroundThrottling: false,            // the wall must keep drawing while the console holds focus
      devTools: !kiosk
    }
  });
  win.setMenuBarVisibility(false);
  win.once('ready-to-show', () => { if (!win.isDestroyed()) win.show(); });
  win.on('close', (e) => { if (!quitting && kiosk) e.preventDefault(); });   // nothing closes a kiosk window but us
  win.on('page-title-updated', (e) => e.preventDefault());                 // keep our names (the operator and tests find windows by them)
  const wc = win.webContents;
  wc.on('console-message', consoleRelay(name));
  wc.on('render-process-gone', (e, details) => {
    if (quitting) return;
    log(`[${name}] renderer gone (${details && details.reason}); reloading in 1.5 s`);
    setTimeout(() => { if (!win.isDestroyed()) win.webContents.reload(); }, 1500);
  });
  let hang = null;
  wc.on('unresponsive', () => {
    log(`[${name}] unresponsive; crashing the renderer in ${cfg.unresponsiveSeconds} s unless it recovers`);
    hang = setTimeout(() => { hang = null; if (!win.isDestroyed()) wc.forcefullyCrashRenderer(); }, cfg.unresponsiveSeconds * 1000);
  });
  wc.on('responsive', () => { if (hang) { clearTimeout(hang); hang = null; log(`[${name}] responsive again`); } });
  wc.on('did-fail-load', (e, code, desc, failedUrl, isMainFrame) => {
    if (!isMainFrame || code === -3 || quitting) return;                    // -3 = aborted (a reload superseded it)
    log(`[${name}] load failed (${code} ${desc}); retrying in 3 s`);
    setTimeout(() => { if (!win.isDestroyed()) win.loadURL(url); }, 3000);
  });
  wc.setWindowOpenHandler(() => ({ action: 'deny' }));
  wc.on('will-navigate', (e, to) => { if (!to.startsWith(origin)) e.preventDefault(); });   // nothing leaves 127.0.0.1
  if (!kiosk) wc.on('before-input-event', (e, input) => { if (input.type === 'keyDown' && input.key === 'F12') { wc.toggleDevTools(); e.preventDefault(); } });
  win.loadURL(url);
  return win;
}

// ---- the server --------------------------------------------
async function startServer(port) {
  const serve = require(path.join(WEB, 'tools', 'serve.js'));
  const onMiss = (rel) => log('404', rel);
  try { return await serve.start({ port, root: WEB, onMiss }); }
  catch (err) {
    if (err && err.code === 'EADDRINUSE') { log(`port ${port} is taken; using any free port`); return serve.start({ port: 0, root: WEB, onMiss }); }
    throw err;
  }
}

// ---- nightly relaunch --------------------------------------
// Pure, so it can be tested: relaunch at HH:05 on the configured hour, once the process has been
// up ten minutes (a relaunch that boots inside the same minute must not relaunch again).
function shouldRelaunch(now, bootAt, hour) {
  if (hour == null) return false;
  const d = new Date(now);
  return d.getHours() === hour && d.getMinutes() === 5 && now - bootAt > 10 * 60 * 1000;
}

// ---- main --------------------------------------------------
app.setName('TeManawa');
if (process.platform === 'win32') app.setAppUserModelId('nz.temanawa.avianage');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.commandLine.appendSwitch('overscroll-history-navigation', '0');
app.commandLine.appendSwitch('disable-pinch');
// Windows judges a window covered by another as occluded and stops its frames; a notification or
// the other kiosk window must never freeze the wall.
if (process.platform === 'win32') app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion');

if (!app.requestSingleInstanceLock()) { app.quit(); }
else {
  cfg = loadConfig();
  if (cfg.ignoreGpuBlocklist) app.commandLine.appendSwitch('ignore-gpu-blocklist');
  LOG_FILE = path.join(app.getPath('userData'), 'temanawa-shell.log');
  const bootAt = Date.now();
  let server = null, wallWin = null, conWin = null;

  app.on('second-instance', () => { if (conWin && !conWin.isDestroyed()) conWin.focus(); else if (wallWin && !wallWin.isDestroyed()) wallWin.focus(); });
  app.on('before-quit', () => { quitting = true; });
  app.on('window-all-closed', () => { quitting = true; app.quit(); });
  app.on('will-quit', () => { globalShortcut.unregisterAll(); if (server) server.close(); });
  app.on('child-process-gone', (e, d) => log(`child process gone: ${d.type} ${d.reason}`));   // a lost GPU process shows here; the page's own watchdog reloads

  app.whenReady().then(async () => {
    const kiosk = cfg.kiosk !== false && !DEV;
    const picked = pickDisplays(cfg);
    log(`Te Manawa shell ${app.getVersion()} (Electron ${process.versions.electron}, Chromium ${process.versions.chrome}) ${DEV ? 'DEV' : kiosk ? 'kiosk' : 'windowed'}`);
    log(`web root ${WEB}; config ${cfg._file || 'defaults'}`);
    log(`displays:\n${describeDisplays(picked.all)}`);
    if (has('displays')) { app.exit(0); return; }

    try { server = await startServer(cfg.port); }
    catch (err) { log('server failed to start: ' + (err && err.message)); app.exit(1); return; }
    origin = `http://127.0.0.1:${server.port}`;
    log(`serving ${origin}`);

    const q = (s, extra) => { const parts = [s, extra].filter(Boolean); return parts.length ? '?' + parts.join('&') : ''; };
    const wallUrl = `${origin}/${q(cfg.wall.query, DEV ? 'dev=1' : '')}`;
    const conUrl = `${origin}/secondscreen/${q(cfg.console.query, DEV ? 'debug=1' : '')}`;

    let conDisplay = picked.console;
    if (!conDisplay && cfg.console.display === 'other' && !kiosk) conDisplay = picked.wall;   // windowed on one display: both here
    if (!conDisplay && cfg.console.display !== 'none') log('only one display: the console is not opened (the wall runs on its own)');

    wallWin = openWindow('Te Manawa — wall', picked.wall, wallUrl, kiosk, 0);
    log(`wall → display ${picked.all.indexOf(picked.wall)} ${wallUrl}`);
    if (conDisplay) {
      conWin = openWindow('Te Manawa — console', conDisplay, conUrl, kiosk, 120);
      log(`console → display ${picked.all.indexOf(conDisplay)} ${conUrl}`);
      // The console holds keyboard focus: the macro pad is a keyboard, and its keys must land on the
      // console whichever window was last touched. The wall never needs focus.
      wallWin.on('focus', () => { if (conWin && !conWin.isDestroyed()) conWin.focus(); });
      conWin.once('ready-to-show', () => setTimeout(() => { if (conWin && !conWin.isDestroyed()) conWin.focus(); }, 500));
      conWin.on('closed', () => { conWin = null; });
    }
    wallWin.on('closed', () => { wallWin = null; });

    const psb = powerSaveBlocker.start('prevent-display-sleep');
    log(`display sleep blocked (${powerSaveBlocker.isStarted(psb)})`);
    globalShortcut.register('CommandOrControl+Shift+Q', () => { log('quit: Ctrl+Shift+Q'); quitting = true; app.quit(); });
    setInterval(() => {
      if (shouldRelaunch(Date.now(), bootAt, cfg.relaunchHour)) { log('nightly relaunch'); quitting = true; app.relaunch(); app.exit(0); }
    }, 20000);
  });
}

module.exports = { shouldRelaunch, DEFAULTS };
