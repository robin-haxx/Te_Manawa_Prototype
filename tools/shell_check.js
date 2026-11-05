#!/usr/bin/env node
// ============================================================
// TE MANAWA: check the kiosk shell end to end
// ------------------------------------------------------------
//   node tools/shell_check.js [web-dir]       (default dist/temanawa-web, from make_deploy.js)
//
// Drives electron/main.js with Playwright's Electron driver and checks what the museum relies
// on: two windows in kiosk mode, both pages booted, the bus both ways, the console holding focus
// when the wall is focused, a close request on a kiosk window refused, a crashed wall renderer
// reloaded and rebooted, the shell log written, no page errors. Both windows are put on display 0
// (a one-display dev machine; on Linux without a display: xvfb-run -a node tools/shell_check.js).
// Needs `npm ci` in electron/ and playwright (`npm i -D playwright`; no browser install needed, it
// drives Electron's own Chromium). Screenshots land in dist/smoke/shell_*.png. Exit 1 on a failure.
//
// NOTE `game`, `Kiosk`, `DeepTime` are classic-script lexical globals, never window properties
// (MISTAKES.md), so the page predicates test them bare; and a Playwright Page is dead for good
// after a renderer crash, so the recovery check asks the main process instead.
// ============================================================
'use strict';
const path = require('path'), fs = require('fs'), os = require('os');
const ROOT = path.resolve(__dirname, '..');
const WEB = path.resolve(process.argv[2] || path.join(ROOT, 'dist', 'temanawa-web'));
const SHOTS = path.join(ROOT, 'dist', 'smoke');
if (!fs.existsSync(path.join(WEB, 'index.html'))) { console.error('no web root at ' + WEB + ' (run node tools/make_deploy.js first)'); process.exit(2); }
let _electron, electronPath;
try { ({ _electron } = require('playwright')); } catch (e) { console.error('playwright is not installed (npm i -D playwright)'); process.exit(2); }
try { electronPath = require(path.join(ROOT, 'electron', 'node_modules', 'electron')); } catch (e) { console.error('electron is not installed (cd electron && npm ci)'); process.exit(2); }
fs.mkdirSync(SHOTS, { recursive: true });
const cfg = path.join(os.tmpdir(), 'temanawa-shell-check.config.json');
fs.writeFileSync(cfg, JSON.stringify({ wall: { display: 0 }, console: { display: 0 }, port: 8081 }));
const results = [];
const ok = (m) => { results.push('ok   ' + m); console.log('  ok   ' + m); };
const fail = (m) => { results.push('FAIL ' + m); console.log('  FAIL ' + m); };
(async () => {
  console.log('shell check\n  web ' + WEB);
  const t0 = Date.now();
  const extra = (process.platform === 'linux' && process.getuid && process.getuid() === 0) ? ['--no-sandbox'] : [];
  const app = await _electron.launch({
    executablePath: electronPath,
    args: [path.join(ROOT, 'electron'), '--web', WEB, '--config', cfg, ...extra],
    timeout: 90000
  });
  app.process().stderr.on('data', d => { const t = String(d); if (/FATAL|renderer gone/.test(t)) process.stdout.write('  [shell:err] ' + t); });
  while (app.windows().length < 2 && Date.now() - t0 < 90000) await app.waitForEvent('window', { timeout: 30000 }).catch(() => {});
  const wins = await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().map(w => ({ title: w.getTitle(), kiosk: w.isKiosk(), fullscreen: w.isFullScreen(), focused: w.isFocused(), bounds: w.getBounds(), url: w.webContents.getURL() })));
  console.log(JSON.stringify(wins));
  if (wins.length === 2 && wins.every(w => w.kiosk && w.fullscreen)) ok('two kiosk full-screen windows: ' + wins.map(w => w.title + ' ' + w.bounds.width + 'x' + w.bounds.height).join(' | ')); else fail('windows: ' + JSON.stringify(wins));
  const findPages = () => ({ wall: app.windows().find(p => !p.url().includes('secondscreen')), con: app.windows().find(p => p.url().includes('secondscreen')) });
  let { wall, con } = findPages();
  const errs = [];
  for (const p of [wall, con]) { p.on('pageerror', e => errs.push(p.url() + ' pageerror ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(p.url() + ' console.error ' + m.text().slice(0, 200)); }); }
  await wall.waitForFunction(() => typeof game !== 'undefined' && game && game.terrain && game.terrain.heightMap && typeof frameCount === 'number' && frameCount > 30, null, { timeout: 300000 });
  ok(`wall booted in the shell (${((Date.now() - t0) / 1000).toFixed(0)} s from launch, software GL)`);
  const k = await wall.evaluate(() => ({ installed: Kiosk._installed, dev: Kiosk.devMode, render: (typeof GLBatch !== 'undefined' && GLBatch.active) ? 'WebGL' : '2D', hidden: document.hidden, log: Kiosk.getErrorLog() }));
  if (k.installed && !k.dev && !k.hidden) ok(`kiosk layer installed, keys locked, page visible (render ${k.render})`); else fail('kiosk state ' + JSON.stringify(k));
  if (k.log.length) fail('Kiosk error log: ' + JSON.stringify(k.log).slice(0, 300));
  const heard = await con.waitForFunction(() => !/waiting/i.test(document.getElementById('clockLabel').textContent), null, { timeout: 20000 }).then(() => true).catch(() => false);
  const label = await con.$eval('#clockLabel', e => e.textContent);
  if (heard) ok(`console hears the wall over the bus ("${label}")`); else fail('console never heard the wall: ' + label);
  const before = await wall.evaluate(() => DeepTime.dialStep);
  await con.evaluate(() => TMBus.dial(1));
  const dialed = await wall.waitForFunction(b => DeepTime.dialStep > b, before, { timeout: 5000 }).then(() => true).catch(() => false);
  if (dialed) ok('wall hears the console over the bus (dial detent)'); else fail('dial intent did not reach the wall');
  await con.evaluate(() => TMBus.dialReset());
  // focus: the console holds it, and a wall focus bounces back
  const focused = () => app.evaluate(({ BrowserWindow }) => { const f = BrowserWindow.getFocusedWindow(); return f ? f.getTitle() : null; });
  const f1 = await focused();
  await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().find(w => w.getTitle().includes('wall')).focus());
  await new Promise(r => setTimeout(r, 800));
  const f2 = await focused();
  if (/console/.test(f1 || '') && /console/.test(f2 || '')) ok(`console holds focus (before: ${f1}; after focusing the wall: ${f2})`); else fail(`focus: before ${f1}, after focusing the wall ${f2}`);
  // kiosk windows refuse to close
  await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().find(w => w.getTitle().includes('wall')).close());
  await new Promise(r => setTimeout(r, 500));
  const n = await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().length);
  if (n === 2) ok('a close request on a kiosk window is refused'); else fail('window count after close(): ' + n);
  // crash recovery
  await wall.screenshot({ path: path.join(SHOTS, 'shell_wall.png') }).catch(() => {});
  await con.screenshot({ path: path.join(SHOTS, 'shell_console.png') }).catch(() => {});
  await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().find(w => w.getTitle().includes('wall')).webContents.forcefullyCrashRenderer());
  // Playwright's Page object is dead for good after a renderer crash ("ongoing and subsequent operations
  // will throw"), so ask the MAIN process about the reloaded WebContents instead.
  const tCrash = Date.now(); let back = false, state = '?';
  while (Date.now() - tCrash < 300000) {
    await new Promise(r => setTimeout(r, 2000));
    state = await app.evaluate(({ BrowserWindow }) => {
      const w = BrowserWindow.getAllWindows().find(w => w.getTitle().includes('wall'));
      if (!w || w.isDestroyed()) return 'no window';
      if (w.webContents.isCrashed()) return 'crashed';
      if (w.webContents.isLoading()) return 'loading';
      return w.webContents.executeJavaScript("(typeof game !== 'undefined' && !!game && !!game.terrain && !!game.terrain.heightMap && frameCount > 30) ? 'booted' : 'booting'").catch(e => 'eval: ' + e.message);
    }).catch(e => 'main: ' + e.message);
    if (state === 'booted') { back = true; break; }
  }
  if (back) ok(`wall reloaded and rebooted after its renderer was crashed (${((Date.now() - tCrash) / 1000).toFixed(0)} s)`); else fail('wall did not come back after a renderer crash (last state: ' + state + ')');
  const userData = await app.evaluate(({ app }) => app.getPath('userData'));
  const logFile = path.join(userData, 'temanawa-shell.log');
  const logText = fs.existsSync(logFile) ? fs.readFileSync(logFile, 'utf8') : '';
  if (/renderer gone/.test(logText) && /serving http:\/\/127\.0\.0\.1:8081/.test(logText)) ok('shell log written: ' + logFile); else fail('shell log missing expected lines: ' + logFile);
  console.log('--- log tail ---\n' + logText.trim().split('\n').slice(-14).join('\n'));
  const realErrs = errs.filter(e => !/Failed to load resource|net::ERR_ABORTED/.test(e));
  if (realErrs.length) fail(realErrs.length + ' page errors; first: ' + realErrs[0]); else ok('no page errors in either window');
  await app.close();
  console.log(results.some(r => r.startsWith('FAIL')) ? '\n' + results.filter(r => r.startsWith('FAIL')).length + ' FAILURES' : '\nOK');
  process.exit(results.some(r => r.startsWith('FAIL')) ? 1 : 0);
})().catch(e => { console.error('TEST CRASHED', e); process.exit(2); });
