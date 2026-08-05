#!/usr/bin/env node
// tools/svg2geo.js — convert a geography SVG into the sim's geo-data file.
// Author-time ONLY (Node). The kiosk never parses SVG: it loads the emitted
// classic-script JS. Rerun this whenever you edit the SVG.
//
//   node tools/svg2geo.js geo/manawatu.svg geo/manawatu.geo.js
//
// SVG conventions (see md/TEMANAWA_GEOGRAPHY.md):
//   viewBox="0 0 W H"   the world extent + aspect (points are normalised to it)
//   class/id "river"    an open path/polyline  = the river centreline
//   class/id "range"    a filled polygon/path  = a mountain massif
//   class/id "coast"    an open path/polyline  = the coastline            (future)
//   class/id "dune"     a filled polygon/path  = a dune field             (future)
//   optional attrs:     data-width data-depth (river/coast),
//                       data-height data-spread (range/dune)
// Geometry: <polyline>/<polygon> points, and <path d> with M L H V C S Q T Z
// (absolute + relative); curves are flattened to line segments. Anything with
// no matching class/id is ignored, so a frame rect / labels are harmless.

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
  if (/\briver\b/.test(c)) return 'river';
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
const counts = { river: 0, range: 0, coast: 0, dune: 0 };

const tagRe = /<(polyline|polygon|path)\b[^>]*?\/?>/g;
let m;
while ((m = tagRe.exec(svg))) {
  const tag = m[0], kind = m[1], type = classify(tag);
  if (!type) continue;
  let pts = kind === 'path' ? flattenPath(attr(tag, 'd')) : parsePoints(attr(tag, 'points'));
  if (pts.length < 2) continue;
  pts = norm(pts);
  if (type === 'river')      out.rivers.push({ width: numAttr(tag, 'data-width', 0.045), depth: numAttr(tag, 'data-depth', 1.0), pts });
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
console.log(`  viewBox ${VW}x${VH}  rivers ${counts.river}  ranges ${counts.range}  coasts ${counts.coast}  dunes ${counts.dune}`);
