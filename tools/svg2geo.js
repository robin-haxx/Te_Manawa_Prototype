#!/usr/bin/env node
// tools/svg2geo.js — convert a geography SVG into the sim's geo-data file.
// Author-time ONLY (Node). The kiosk never parses SVG: it loads the emitted
// classic-script JS. Rerun this whenever you edit the SVG.
//
//   node tools/svg2geo.js geo/manawatu.svg geo/manawatu.geo.js
//
// SVG conventions (see md/TEMANAWA_GEOGRAPHY.md):
//   viewBox="0 0 W H"     the world extent + aspect (points are normalised to it)
//   class/id "river"      an open path/polyline  = the MAIN stem centreline
//   class/id "tributary"  an open path/polyline  = a feeder stream (also "trib")
//   class/id "range"      a filled polygon/path  = a mountain massif
//   class/id "coast"      an open path/polyline  = the coastline            (future)
//   class/id "dune"       a filled polygon/path  = a dune field             (future)
//   optional attrs:       data-width data-depth (river/tributary/coast),
//                         data-height data-spread (range/dune)
//
// DEFAULT: an UNTAGGED open stroke — a <polyline>, or a <path> that isn't a closed
// shape — is treated as a TRIBUTARY. So you can just DRAW A LINE in the editor and it
// becomes a feeder stream; only the main stem needs the explicit class="river" (and a
// massif its class="range"). This is why a plain drawn polyline now yields tributary
// data where before it was silently dropped. A <rect> frame and <text> labels are never
// matched by the tag scanner, so they stay harmless; an untagged <polygon> is still
// skipped (a closed massif must say class="range").
// Geometry: <polyline>/<polygon> points, and <path d> with M L H V C S Q T Z
// (absolute + relative); curves are flattened to line segments.

const fs = require('fs');
const path = require('path');

// Defaults so it runs with NO arguments — double-click convert-geo.bat, or run
// `node tools/svg2geo.js` from the repo root. Paths resolve from the SCRIPT
// location, so the working directory doesn't matter. Pass args to override.
const REPO = path.resolve(__dirname, '..');
const SRC = process.argv[2] ? path.resolve(process.argv[2]) : path.join(REPO, 'geo', 'manawatu.svg');
const OUT = process.argv[3] ? path.resolve(process.argv[3]) : path.join(REPO, 'geo', 'manawatu.geo.js');
if (!fs.existsSync(SRC)) { console.error('svg2geo: cannot find', SRC); process.exit(1); }
const svg = fs.readFileSync(SRC, 'utf8');

const vb = (svg.match(/viewBox\s*=\s*"([^"]+)"/) || [])[1];
if (!vb) { console.error('svg2geo: the <svg> needs a viewBox'); process.exit(1); }
const p = vb.trim().split(/[\s,]+/).map(Number);
const VW = p[2], VH = p[3];
if (!(VW > 0 && VH > 0)) { console.error('svg2geo: bad viewBox', vb); process.exit(1); }

const CURVE_STEPS = 16;
const round = (n) => Math.round(n * 100000) / 100000;
const attr = (tag, name) => { const m = tag.match(new RegExp(name + '\\s*=\\s*"([^"]*)"')); return m ? m[1] : null; };
const numAttr = (tag, name, dflt) => { const v = attr(tag, name); const n = v == null ? NaN : parseFloat(v); return Number.isNaN(n) ? dflt : n; };

function classify(tag) {
  const c = ((attr(tag, 'class') || '') + ' ' + (attr(tag, 'id') || '')).toLowerCase();
  if (/\btrib/.test(c))            return 'tributary';   // tributary / trib / trib2 / tributary-oroua
  if (/\briver\b|\bmain\b/.test(c)) return 'river';       // the main stem
  if (/\brange\b/.test(c)) return 'range';
  if (/\bcoast\b/.test(c)) return 'coast';
  if (/\bdune\b/.test(c))  return 'dune';
  return null;
}
function parsePoints(str) {
  const n = (str || '').trim().split(/[\s,]+/).map(Number).filter(v => !Number.isNaN(v));
  const pts = [];
  for (let i = 0; i + 1 < n.length; i += 2) pts.push([n[i], n[i + 1]]);
  return pts;
}
// Minimal SVG path flattener: M L H V C S Q T Z, absolute + relative.
function flattenPath(d) {
  const toks = (d || '').match(/[a-zA-Z]|-?\.?\d[\d.]*(?:[eE]-?\d+)?/g) || [];
  let i = 0; const pts = []; let cx = 0, cy = 0, sx = 0, sy = 0, cmd = null, prevC = null, prevQ = null;
  const num = () => parseFloat(toks[i++]);
  const push = (x, y) => pts.push([x, y]);
  const cube = (x0,y0,x1,y1,x2,y2,x3,y3) => { for (let s=1;s<=CURVE_STEPS;s++){const t=s/CURVE_STEPS,u=1-t;
    push(u*u*u*x0+3*u*u*t*x1+3*u*t*t*x2+t*t*t*x3, u*u*u*y0+3*u*u*t*y1+3*u*t*t*y2+t*t*t*y3);} };
  const quad = (x0,y0,x1,y1,x2,y2) => { for (let s=1;s<=CURVE_STEPS;s++){const t=s/CURVE_STEPS,u=1-t;
    push(u*u*x0+2*u*t*x1+t*t*x2, u*u*y0+2*u*t*y1+t*t*y2);} };
  while (i < toks.length) {
    if (/[a-zA-Z]/.test(toks[i])) cmd = toks[i++];
    if (!cmd) { i++; continue; }
    const rel = cmd === cmd.toLowerCase(), C = cmd.toUpperCase();
    if (C === 'M')      { let x=num(),y=num(); if(rel){x+=cx;y+=cy;} cx=x;cy=y;sx=x;sy=y; push(cx,cy); cmd = rel?'l':'L'; prevC=prevQ=null; }
    else if (C === 'L') { let x=num(),y=num(); if(rel){x+=cx;y+=cy;} cx=x;cy=y; push(cx,cy); prevC=prevQ=null; }
    else if (C === 'H') { let x=num(); if(rel)x+=cx; cx=x; push(cx,cy); prevC=prevQ=null; }
    else if (C === 'V') { let y=num(); if(rel)y+=cy; cy=y; push(cx,cy); prevC=prevQ=null; }
    else if (C === 'C') { let x1=num(),y1=num(),x2=num(),y2=num(),x=num(),y=num(); if(rel){x1+=cx;y1+=cy;x2+=cx;y2+=cy;x+=cx;y+=cy;} cube(cx,cy,x1,y1,x2,y2,x,y); prevC=[x2,y2];prevQ=null; cx=x;cy=y; }
    else if (C === 'S') { let x2=num(),y2=num(),x=num(),y=num(); if(rel){x2+=cx;y2+=cy;x+=cx;y+=cy;} const px=prevC?2*cx-prevC[0]:cx, py=prevC?2*cy-prevC[1]:cy; cube(cx,cy,px,py,x2,y2,x,y); prevC=[x2,y2];prevQ=null; cx=x;cy=y; }
    else if (C === 'Q') { let x1=num(),y1=num(),x=num(),y=num(); if(rel){x1+=cx;y1+=cy;x+=cx;y+=cy;} quad(cx,cy,x1,y1,x,y); prevQ=[x1,y1];prevC=null; cx=x;cy=y; }
    else if (C === 'T') { let x=num(),y=num(); if(rel){x+=cx;y+=cy;} const px=prevQ?2*cx-prevQ[0]:cx, py=prevQ?2*cy-prevQ[1]:cy; quad(cx,cy,px,py,x,y); prevQ=[px,py];prevC=null; cx=x;cy=y; }
    else if (C === 'Z') { push(sx,sy); cx=sx;cy=sy; prevC=prevQ=null; }
    else { i++; }   // skip anything unsupported
  }
  return pts;
}

const out = { source: path.basename(SRC), viewBox: { w: VW, h: VH }, rivers: [], ranges: [], coasts: [], dunes: [] };
const norm = (pts) => pts.map(([x, y]) => [round(x / VW), round(y / VH)]);

// Douglas–Peucker simplification (in normalised 0..1 space). Curve-flattening emits ~16
// points per Bézier — hundreds per drawn tributary — but the terrain bake walks EVERY river
// segment for EVERY cell (a per-cell distance field), so a 193-point stream would wreck the
// init budget. Decimate to the coarsest polyline that stays within SIMPLIFY_EPS of the
// original (sub-cell detail is invisible on a ~400-cell grid). Endpoints are always kept.
const SIMPLIFY_EPS = 0.004;   // ~1.5 cells at mapGrid 384; raise to thin further
function segDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
  let t = l2 > 0 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}
function simplify(pts, eps) {
  if (pts.length < 3) return pts.slice();
  let maxD = -1, idx = 0;
  const a = pts[0], b = pts[pts.length - 1];
  for (let i = 1; i < pts.length - 1; i++) {
    const d = segDist(pts[i][0], pts[i][1], a[0], a[1], b[0], b[1]);
    if (d > maxD) { maxD = d; idx = i; }
  }
  if (maxD > eps) {
    const left = simplify(pts.slice(0, idx + 1), eps);
    const right = simplify(pts.slice(idx), eps);
    return left.slice(0, -1).concat(right);
  }
  return [a, b];
}
const counts = { river: 0, tributary: 0, range: 0, coast: 0, dune: 0, autoTrib: 0 };

// A path counts as CLOSED (a filled shape, not a stroke) if its data ends in Z/z. Only
// OPEN strokes default to tributary; a closed untagged path is skipped like a polygon.
const pathIsClosed = (tag) => /z\s*"?\s*$/i.test((attr(tag, 'd') || '').trim());

const tagRe = /<(polyline|polygon|path)\b[^>]*?\/?>/g;
let m;
while ((m = tagRe.exec(svg))) {
  const tag = m[0], kind = m[1];
  let type = classify(tag);
  // Default an untagged OPEN stroke (polyline, or a non-closed path) to a tributary, so a
  // plainly-drawn line becomes a feeder stream. Untagged polygons / closed paths are skipped.
  let autoTrib = false;
  if (!type) {
    const isOpen = (kind === 'polyline') || (kind === 'path' && !pathIsClosed(tag));
    if (isOpen) { type = 'tributary'; autoTrib = true; }
  }
  if (!type) continue;
  let pts = kind === 'path' ? flattenPath(attr(tag, 'd')) : parsePoints(attr(tag, 'points'));
  if (pts.length < 2) continue;
  pts = norm(pts);
  // Simplify open strokes (rivers/tributaries/coasts). Ranges/dunes are closed few-point
  // polygons authored by hand — leave them exact.
  if (type === 'river' || type === 'tributary' || type === 'coast') pts = simplify(pts, SIMPLIFY_EPS);
  if (type === 'river')           out.rivers.push({ type: 'main',      width: numAttr(tag, 'data-width', 0.045), depth: numAttr(tag, 'data-depth', 1.0), pts });
  else if (type === 'tributary') { out.rivers.push({ type: 'tributary', width: numAttr(tag, 'data-width', 0.02),  depth: numAttr(tag, 'data-depth', 1.0), pts }); if (autoTrib) counts.autoTrib++; }
  else if (type === 'range') out.ranges.push({ height: numAttr(tag, 'data-height', 0.85), spread: numAttr(tag, 'data-spread', 0.14), poly: pts });
  else if (type === 'coast') out.coasts.push({ width: numAttr(tag, 'data-width', 0.04), pts });
  else if (type === 'dune')  out.dunes.push({ height: numAttr(tag, 'data-height', 0.18), spread: numAttr(tag, 'data-spread', 0.07), poly: pts });
  counts[type]++;
}

const banner =
  `// AUTO-GENERATED by tools/svg2geo.js from ${out.source} — do not edit by hand.\n` +
  `// Regenerate:  double-click convert-geo.bat  (or run: node tools/svg2geo.js)\n` +
  `// Points are normalised 0..1 in the SVG viewBox; the terrain maps them to the world footprint.\n`;
const body =
  `const TE_MANAWA_GEO = ${JSON.stringify(out)};\n` +
  `if (typeof module !== 'undefined' && module.exports) module.exports = TE_MANAWA_GEO;\n`;
fs.writeFileSync(OUT, banner + body);
console.log(`svg2geo: wrote ${OUT}`);
console.log(`  viewBox ${VW}x${VH}  main ${counts.river}  tributaries ${counts.tributary}  ranges ${counts.range}  coasts ${counts.coast}  dunes ${counts.dune}`);
if (counts.autoTrib) console.log(`  (${counts.autoTrib} untagged open path${counts.autoTrib > 1 ? 's' : ''} treated as tributaries — tag class="river"/"range" to reclassify)`);
if (counts.river === 0) console.log('  ! no main stem: tag one polyline class="river" (tributaries alone have no trunk to join)');
