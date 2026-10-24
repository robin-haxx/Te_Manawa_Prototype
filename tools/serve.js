// ============================================================
// TE MANAWA: local static server
// ------------------------------------------------------------
//   node tools/serve.js        then open http://127.0.0.1:8080
//
// Opening index.html directly as file:// does not work: Chrome's CORS
// policy blocks p5's loadImage/loadFont/loadSound from a file origin,
// so the sprites, fonts and audio all fail silently and you get a black
// screen. This is also the server the kiosk deployment should run;
// see TEMANAWA_BUILD_V3.md §3.
//
// No dependencies, no network access, no caching (so a reload always
// picks up edits).
// ============================================================

const http = require('http');
const fs   = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.argv[2]) || Number(process.env.PORT) || 8080;
// --export (dev only, never on the wall): accept POST /__export?path=<dir>/<file>.png|.md with the
// file as the body, written under exports/. This is how the terrain snapshots in
// exports/terrain_boost_stops/ are regenerated from the browser build (see its README).
const EXPORT = process.argv.includes('--export');
const EXPORT_ROOT = path.join(ROOT, 'exports');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.mp3':  'audio/mpeg',
  '.wav':  'audio/wav',
  '.webm': 'video/webm',                 // second-screen highlight loops (alpha VP9)
  '.mp4':  'video/mp4',
  '.ttf':  'font/ttf',
  '.otf':  'font/otf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

http.createServer((req, res) => {
  if (EXPORT && req.method === 'POST' && req.url.startsWith('/__export?')) {
    const q = new URLSearchParams(req.url.slice(req.url.indexOf('?') + 1));
    const rel = q.get('path') || '';
    const out = path.join(EXPORT_ROOT, rel);
    if (!/^[\w\-./]+\.(png|md)$/.test(rel) || !out.startsWith(EXPORT_ROOT + path.sep)) { res.writeHead(400); return res.end('bad path'); }
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFile(out, Buffer.concat(chunks), err => {
        if (err) { res.writeHead(500); return res.end(String(err)); }
        console.log('export', rel);
        res.writeHead(200); res.end('ok');
      });
    });
    return;
  }
  let rel = decodeURIComponent(req.url.split('?')[0]);
  if (rel === '/') rel = '/index.html';
  else if (rel.endsWith('/')) rel += 'index.html';   // a directory URL (e.g. /secondscreen/) → its index.html

  const file = path.join(ROOT, rel);
  // Never serve outside the project directory.
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end('forbidden'); }

  fs.readFile(file, (err, data) => {
    if (err) {
      console.log('404', rel);
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('not found: ' + rel);
    }
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    res.end(data);
  });
}).listen(PORT, '127.0.0.1', () => {
  console.log(`Te Manawa serving ${ROOT}`);
  console.log(`  http://127.0.0.1:${PORT}`);
  if (EXPORT) console.log('  --export: POST /__export?path=… writes under exports/');
  console.log('  ctrl-c to stop');
});
