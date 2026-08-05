// ============================================================
// TE MANAWA — headless screenshot capture
// ------------------------------------------------------------
// Renders the kiosk offscreen and saves a PNG of chosen eras, so terrain
// tweaks can be eyeballed without babysitting a browser.
//
//   npm i puppeteer          # one-time; downloads its own Chromium
//   node tools/shot.js out 1000000 700000 550000 300000
//
//   arg 1  : output directory (created if missing)
//   args 2+: yearsBP to capture (default: 1.0 Ma, 700 ka, 550 ka, 300 ka)
//
// For each era it writes  <out>/era_<ka>ka.png  (full 1920×1080 frame) and
// <out>/era_<ka>ka_coast.png (left-third crop, for the coastline).
//
// It jumps time by calling terrain.morphTo() directly (the same synchronous
// bake the harness uses) and freezes DeepTime so the frame is stable. No
// dependency on the kiosk's 1–4 input lock.
// ============================================================
const http = require('http');
const fs = require('fs');
const path = require('path');
let puppeteer;
try { puppeteer = require('puppeteer'); }
catch (e) { console.error('Install Puppeteer first:  npm i puppeteer'); process.exit(1); }

const ROOT = path.resolve(__dirname, '..');
const OUT = process.argv[2] || path.join(ROOT, 'shots');
let TIMES = process.argv.slice(3).map(Number).filter(n => !isNaN(n));
if (!TIMES.length) TIMES = [1000000, 700000, 550000, 300000];

const TYPES = { '.html':'text/html','.js':'text/javascript','.json':'application/json',
  '.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.mp3':'audio/mpeg',
  '.wav':'audio/wav','.ttf':'font/ttf','.otf':'font/otf','.woff':'font/woff',
  '.woff2':'font/woff2','.css':'text/css' };

function serve() {
  return new Promise(res => {
    const s = http.createServer((req, rq) => {
      let rel = decodeURIComponent(req.url.split('?')[0]); if (rel === '/') rel = '/index.html';
      const f = path.join(ROOT, rel);
      if (!f.startsWith(ROOT)) { rq.writeHead(403); return rq.end('no'); }
      fs.readFile(f, (e, d) => {
        if (e) { rq.writeHead(404); return rq.end('404 ' + rel); }
        rq.writeHead(200, { 'Content-Type': TYPES[path.extname(f).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
        rq.end(d);
      });
    });
    s.listen(0, '127.0.0.1', () => res(s));
  });
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const server = await serve();
  const port = server.address().port;
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage',
           '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--mute-audio']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  const errs = [];
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
  page.on('pageerror', e => errs.push('PAGEERR ' + e.message.slice(0, 200)));
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'load', timeout: 60000 });

  await page.waitForFunction(
    () => window.game && game.terrain && game.terrain.heightMap && game.terrain._paintR,
    { timeout: 60000 }).catch(() => {});
  await sleep(1500);
  await page.evaluate(() => { if (window.DeepTime) { DeepTime.yrPerSec = 0; DeepTime._deepUntil = 0; DeepTime._ended = false; } });

  fs.mkdirSync(OUT, { recursive: true });
  for (const t of TIMES) {
    const r = await page.evaluate((T) => {
      try {
        if (window.DeepTime) DeepTime.yearsBP = T;
        if (window.game && game.terrain && game.terrain.morphTo) game.terrain.morphTo(T);
        return 'ok';
      } catch (e) { return 'ERR ' + e.message; }
    }, t);
    await page.waitForFunction(() => !window.game.terrain.morphInProgress, { timeout: 20000 }).catch(() => {});
    await sleep(900);
    const ka = Math.round(t / 1000);
    await page.screenshot({ path: path.join(OUT, `era_${ka}ka.png`) });
    await page.screenshot({ path: path.join(OUT, `era_${ka}ka_coast.png`), clip: { x: 0, y: 40, width: 720, height: 1000 } });
    console.log(`shot era_${ka}ka (${r})`);
  }
  await browser.close(); server.close();
  console.log(errs.length ? ('CONSOLE ERRORS (first 8):\n' + errs.slice(0, 8).join('\n')) : 'no console errors');
})().catch(e => { console.error('FATAL', e); process.exit(1); });
