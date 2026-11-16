// ============================================================
// TE MANAWA: local static server
// ------------------------------------------------------------
//   node tools/serve.js        then open http://127.0.0.1:8080
//
// Opening index.html directly as file:// does not work: Chrome's CORS
// policy blocks p5's loadImage/loadFont/loadSound from a file origin,
// so the sprites, fonts and audio all fail silently and you get a black
// screen. This is also the server the kiosk deployment runs: on its own
// under Chrome (TEMANAWA_OPERATIONS.md §2), or inside the kiosk shell
// (electron/main.js), which require()s this file and calls start().
//
// No dependencies, no network access, no caching (so a reload always
// picks up edits).
//
// As a module:  const { start } = require('./tools/serve.js');
//               const s = await start({ port: 8080, root: '/path/to/web' });
//               s.port, s.root, await s.close()
// The CLI below is the same start() on argv[2] / $PORT, with the same
// messages it always printed.
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
  '.woff2': 'font/woff2',
  '.txt':  'text/plain; charset=utf-8',
  '.md':   'text/plain; charset=utf-8'
};

// The request handler for one web root. exportDir (dev only) enables POST /__export; onMiss(rel) is
// told about every 404 (the CLI logs it; the deploy smoke test fails on it).
function handler({ root, exportDir, onMiss }) {
  return (req, res) => {
    if (exportDir && req.method === 'POST' && req.url.startsWith('/__export?')) {
      const q = new URLSearchParams(req.url.slice(req.url.indexOf('?') + 1));
      const rel = q.get('path') || '';
      const out = path.join(exportDir, rel);
      if (!/^[\w\-./]+\.(png|md)$/.test(rel) || !out.startsWith(exportDir + path.sep)) { res.writeHead(400); return res.end('bad path'); }
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
    // A malformed escape (e.g. /%E0%A4%A) makes decodeURIComponent throw, and an uncaught throw here
    // takes the whole server down with it. It is the wall's only server.
    let rel;
    try { rel = decodeURIComponent(req.url.split('?')[0]); }
    catch (e) { res.writeHead(400); return res.end('bad request'); }
    if (rel === '/') rel = '/index.html';
    else if (rel.endsWith('/')) rel += 'index.html';   // a directory URL (e.g. /secondscreen/) → its index.html

    const file = path.join(root, rel);
    // Never serve outside the web root (the separator matters: root + "_old" is outside).
    if (!file.startsWith(root + path.sep)) { res.writeHead(403); return res.end('forbidden'); }

    fs.readFile(file, (err, data) => {
      if (err) {
        onMiss(rel);
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        return res.end('not found: ' + rel);
      }
      res.writeHead(200, {
        'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': 'no-store'
      });
      res.end(data);
    });
  };
}

// start({ port, host, root, exportDir, onMiss }) → Promise<{ server, port, root, close() }>.
// port 0 takes any free port. Rejects with the listen error (err.code === 'EADDRINUSE' when the
// port is taken), so a caller can fall back; nothing here calls process.exit.
function start(opts = {}) {
  const root = path.resolve(opts.root || ROOT);
  const host = opts.host || '127.0.0.1';
  const onMiss = typeof opts.onMiss === 'function' ? opts.onMiss : (rel) => console.log('404', rel);
  const exportDir = opts.exportDir ? path.resolve(opts.exportDir) : null;
  return new Promise((resolve, reject) => {
    const server = http.createServer(handler({ root, exportDir, onMiss }));
    server.once('error', reject);
    server.listen(opts.port == null ? PORT : opts.port, host, () => {
      server.removeListener('error', reject);
      server.on('error', (err) => console.error('Te Manawa server error:', err && (err.code || err.message)));
      resolve({
        server, root, port: server.address().port,
        close: () => new Promise((r) => server.close(() => r()))
      });
    });
  });
}

module.exports = { start, TYPES };

if (require.main === module) {
  start({ port: PORT, exportDir: EXPORT ? EXPORT_ROOT : null }).then(({ port, root }) => {
    console.log(`Te Manawa serving ${root}`);
    console.log(`  http://127.0.0.1:${port}`);
    if (EXPORT) console.log('  --export: POST /__export?path=… writes under exports/');
    console.log('  ctrl-c to stop');
  }).catch((err) => {
    // Port taken (a second copy, or another app): say so and exit non-zero, so a supervisor logs a
    // clear reason rather than a stack trace.
    console.error(`Te Manawa server could not start on 127.0.0.1:${PORT}: ${err.code || err.message}`);
    process.exit(1);
  });
}
