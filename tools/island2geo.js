// ============================================================
// TE MANAWA: the island inset's data (author-time, like svg2geo.js)
// ------------------------------------------------------------
//   node tools/island2geo.js
//
// Reads research/palaeogeography/slices.json (the lower North Island at nine dates, 4 Ma → today:
// Trewick & Bland's maps registered to today's coast, in km on an NZTM grid; see build_maps.js there)
// and writes geo/island_maps.js: each date's shelf / low / land / high outlines, clipped to one square
// view of the lower North Island and the top of the South Island (Taupō to Kaikōura, Farewell Spit to
// Hawke Bay), simplified to ~0.5 km and stored as integers 0..Q across the view. TeManawa_island.js
// draws them as the inset beside the present-day map (the intro and the outro) and the attract
// sequence: what happens beyond the sim's frame (no Cook Strait at 1 Ma, the land bridge to Nelson at
// the last glacial maximum). The kiosk never reads slices.json; it loads the emitted file.
// ============================================================
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'research', 'palaeogeography', 'slices.json');
const OUT = path.join(ROOT, 'geo', 'island_maps.js');

const VIEW = { x: 150, y: 525, size: 360 };   // km on the slices' grid (x east, y south): the inset's square
const Q = 1000;                                // integer steps across the view (0.36 km)
const TOL = 0.5;                               // Douglas–Peucker tolerance, km
const MARGIN = 4;                              // clip a little outside the view, so no edge shows
// The sim's map on the same grid: the gorge is the anchor (map u 0.505, v 0.51), 115 km across
// (LOOK.frameKm) and the skeleton's aspect down (900/1600). The same reading the research page and
// md/TEMANAWA_PALAEO_ATTRACT.md §2 use.
const SIM = { gu: 0.505, gv: 0.51, kmU: 115, kmV: 115 * 900 / 1600, gorge: [175.80, -40.31] };
const TOWNS = [['Wellington', 174.78, -41.29], ['Nelson', 173.28, -41.27]];
const ORDER = ['m4000', 'm3000', 'm2400', 'm1500', 'm1000', 'm0450', 'm0125', 'm0020', 'm0000'];

const data = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const G = data.grid;

function nztm(lon, lat) {
  const a = 6378137, f = 1 / 298.257222101, k0 = 0.9996, lon0 = 173 * Math.PI / 180, FE = 1600000, FN = 10000000;
  const e2 = 2 * f - f * f, ep2 = e2 / (1 - e2), phi = lat * Math.PI / 180, lam = lon * Math.PI / 180;
  const A0 = 1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 ** 3 / 256, A2 = 3 / 8 * (e2 + e2 * e2 / 4 + 15 * e2 ** 3 / 128), A4 = 15 / 256 * (e2 * e2 + 3 * e2 ** 3 / 4), A6 = 35 * e2 ** 3 / 3072;
  const m = a * (A0 * phi - A2 * Math.sin(2 * phi) + A4 * Math.sin(4 * phi) - A6 * Math.sin(6 * phi));
  const s = Math.sin(phi), c = Math.cos(phi), t = Math.tan(phi), nu = a / Math.sqrt(1 - e2 * s * s), psi = 1 + ep2 * c * c, w = lam - lon0;
  const E = FE + k0 * nu * w * c * (1 + w * w / 6 * c * c * (psi - t * t));
  const N = FN + k0 * (m + nu * s * w * w / 2 * c + nu * s * w ** 4 / 24 * c ** 3 * (4 * psi * psi + psi - t * t));
  return [E, N];
}
const km = (lon, lat) => { const [E, N] = nztm(lon, lat); return [(E - G.E0) / 1000, (G.N1 - N) / 1000]; };

function parse(d) {
  const rings = []; let cur = null; const re = /([MLZ])([^MLZ]*)/g; let m;
  while ((m = re.exec(d))) {
    if (m[1] === 'M') { cur = []; rings.push(cur); }
    if (m[1] === 'Z') continue;
    const n = m[2].trim().split(/[ ,]+/).map(Number);
    for (let i = 0; i + 1 < n.length; i += 2) cur.push([n[i], n[i + 1]]);
  }
  return rings;
}

// Sutherland–Hodgman against an axis-aligned box. Each ring clipped on its own keeps the even-odd fill
// right inside the box (a point in the box lies in a clipped ring exactly when it lies in the original).
function clip(ring, x0, y0, x1, y1) {
  const edges = [
    (p) => p[0] >= x0, (p) => p[0] <= x1, (p) => p[1] >= y0, (p) => p[1] <= y1
  ];
  const cut = [
    (a, b) => { const t = (x0 - a[0]) / (b[0] - a[0]); return [x0, a[1] + t * (b[1] - a[1])]; },
    (a, b) => { const t = (x1 - a[0]) / (b[0] - a[0]); return [x1, a[1] + t * (b[1] - a[1])]; },
    (a, b) => { const t = (y0 - a[1]) / (b[1] - a[1]); return [a[0] + t * (b[0] - a[0]), y0]; },
    (a, b) => { const t = (y1 - a[1]) / (b[1] - a[1]); return [a[0] + t * (b[0] - a[0]), y1]; }
  ];
  let out = ring;
  for (let e = 0; e < 4 && out.length; e++) {
    const inp = out; out = [];
    for (let i = 0; i < inp.length; i++) {
      const a = inp[(i + inp.length - 1) % inp.length], b = inp[i], ia = edges[e](a), ib = edges[e](b);
      if (ib) { if (!ia) out.push(cut[e](a, b)); out.push(b); }
      else if (ia) out.push(cut[e](a, b));
    }
  }
  return out;
}

function dp(pts, tol) {
  if (pts.length < 3) return pts.slice();
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [i, j] = stack.pop(); const [ax, ay] = pts[i], [bx, by] = pts[j];
    const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1;
    let best = -1, bd = tol;
    for (let k = i + 1; k < j; k++) { const d = Math.abs((pts[k][0] - ax) * dy - (pts[k][1] - ay) * dx) / L; if (d > bd) { bd = d; best = k; } }
    if (best >= 0) { keep[best] = 1; stack.push([i, best], [best, j]); }
  }
  return pts.filter((_, k) => keep[k]);
}

const area = (r) => { let s = 0; for (let i = 0, j = r.length - 1; i < r.length; j = i++) s += (r[j][0] + r[i][0]) * (r[j][1] - r[i][1]); return Math.abs(s) / 2; };
const qx = (x) => Math.round((x - VIEW.x) / VIEW.size * Q), qy = (y) => Math.round((y - VIEW.y) / VIEW.size * Q);

const out = { view: VIEW, q: Q, slices: {} };
let pts = 0;
for (const id of ORDER) {
  const s = data.slices[id];
  if (!s) throw new Error('missing slice ' + id);
  const layers = [];
  for (let L = 1; L <= 4; L++) {
    const rings = [];
    for (const r of parse(s[L])) {
      const c = clip(r, VIEW.x - MARGIN, VIEW.y - MARGIN, VIEW.x + VIEW.size + MARGIN, VIEW.y + VIEW.size + MARGIN);
      if (c.length < 3 || area(c) < 1) continue;                 // < 1 km²: an islet the inset cannot show
      // A closed ring's first and last points coincide (a zero-length baseline), so simplify the two
      // halves either side of the point farthest from the start.
      let far = 0, fd = -1;
      for (let k = 1; k < c.length; k++) { const d = Math.hypot(c[k][0] - c[0][0], c[k][1] - c[0][1]); if (d > fd) { fd = d; far = k; } }
      const closed = dp(c.slice(0, far + 1), TOL).concat(dp(c.slice(far).concat([c[0]]), TOL).slice(1, -1));
      if (closed.length < 3) continue;
      const flat = [];
      for (const p of closed) flat.push(qx(p[0]), qy(p[1]));
      rings.push(flat); pts += closed.length;
    }
    layers.push(rings);
  }
  out.slices[id] = layers;
}
const g = km(SIM.gorge[0], SIM.gorge[1]);
out.sim = { gu: SIM.gu, gv: SIM.gv, gx: +((g[0] - VIEW.x) / VIEW.size).toFixed(5), gy: +((g[1] - VIEW.y) / VIEW.size).toFixed(5),
            ku: +(SIM.kmU / VIEW.size).toFixed(5), kv: +(SIM.kmV / VIEW.size).toFixed(5) };
out.towns = TOWNS.map(([n, lo, la]) => { const p = km(lo, la); return [n, +((p[0] - VIEW.x) / VIEW.size).toFixed(4), +((p[1] - VIEW.y) / VIEW.size).toFixed(4)]; });

const header = '// AUTO-GENERATED by tools/island2geo.js from research/palaeogeography/slices.json: do not edit by hand.\n' +
  '// Regenerate: node tools/island2geo.js\n' +
  '// The lower North Island at nine dates (TeManawa_island.js draws it): view = a ' + VIEW.size + ' km square on the slices\' km grid;\n' +
  '// slices[id] = [shelf, low, land, high], each a list of rings, each ring x0,y0,x1,y1… in 0..q across the view (even-odd fill);\n' +
  '// sim = where the sim\'s map sits on it (the gorge at gx,gy; one map width = ku, one map height = kv, in view units).\n';
fs.writeFileSync(OUT, header + 'const TE_MANAWA_ISLAND = ' + JSON.stringify(out) + ';\n' +
  "try { if (typeof window !== 'undefined') window.TE_MANAWA_ISLAND = TE_MANAWA_ISLAND; } catch (_) {}\n");
console.log(`wrote ${path.relative(ROOT, OUT)}: ${ORDER.length} dates, ${pts} points, ${(fs.statSync(OUT).size / 1024).toFixed(0)} KB`);
