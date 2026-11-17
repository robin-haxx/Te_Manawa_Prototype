#!/usr/bin/env node
// ============================================================
// TE MANAWA: THE PROLOGUE'S CLIMATE, FROM THE RECORD
// ------------------------------------------------------------
// Builds the prologue's climate anchors (2.1 Ma → 1.0 Ma) from the LR04 benthic δ18O stack
// (Lisiecki & Raymo 2005), saved verbatim in research/lr04/. One anchor per Marine Isotope Stage,
// at the stage's δ18O extreme: the maximum in a glacial (even) stage, the minimum in an interglacial
// (odd) one, inside LR04's own stage boundaries. Climate smoothsteps between anchors, as it does for
// the window (TeManawa_climate.js), so this is the record's shape and order at stage resolution.
//
//   glacial index  gi  = (δ18O − GI_D0) / GI_SPAN, clamped 0..1. Calibrated so the window's own table
//                        reads the same way: MIS 12 (≈5.0 ‰) at ~1, MIS 11 / MIS 19 / MIS 21 (3.2–3.5 ‰)
//                        at 0.03–0.19. The regime cut (0.5) falls at δ18O ≈ 4.08 ‰.
//   sea level (m)  sea = −SEA_M_PER_PERMIL · (δ18O − D_TODAY): LR04's full glacial–interglacial range
//                        (today ≈ 3.23 ‰, the LGM ≈ 5.02 ‰) over the LGM's −126 m. δ18O also carries deep-
//                        water temperature, so this is a scaling, not a sea-level reconstruction.
//
// Usage:
//   node tools/lr04_prologue.js            print the three blocks
//   node tools/lr04_prologue.js --write    rewrite them between the <lr04:…> markers in TeManawa_climate.js
// tools/bootcheck.js ("prologue") requires this module and asserts the climate file matches build().
// ============================================================
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const STACK = path.join(ROOT, 'research', 'lr04', 'LR04stack_940-2160ka.txt');
const BOUNDS = path.join(ROOT, 'research', 'lr04', 'LR04_MISboundaries_900-2200ka.txt');
const CLIMATE = path.join(ROOT, 'TeManawa_climate.js');

const OLDEST_MIS = 79;        // MIS 79 (2103–2088 ka): the first stage the run's smoothing window can reach
const YOUNGEST_MIS = 28;      // MIS 28 (1014–982 ka), cut at…
const JOIN_KA = 1000;         // …1.0 Ma, where the window's own (rounded) table takes over
const GI_D0 = 3.15, GI_SPAN = 1.85;
const D_TODAY = 3.23, SEA_M_PER_PERMIL = 126 / (5.02 - 3.23);

function readRows(file) {
  return fs.readFileSync(file, 'utf8').split(/\r?\n/).filter(l => l && l[0] !== '#');
}

function build() {
  const stack = readRows(STACK).map(l => { const [a, d] = l.trim().split(/\s+/).map(Number); return { ka: a, d }; });
  const bounds = {};                                        // stage n → its older edge (the n/(n+1) boundary), ka
  for (const l of readRows(BOUNDS)) { const [nm, ka] = l.trim().split(/\s+/); bounds[Number(nm.split('/')[0])] = Number(ka); }
  const anchors = [];
  for (let n = OLDEST_MIS; n >= YOUNGEST_MIS; n--) {
    const old = bounds[n], young = bounds[n - 1];
    if (old == null || young == null) throw new Error('LR04 boundaries missing for MIS ' + n);
    const lo = n === YOUNGEST_MIS ? Math.max(young, JOIN_KA + 0.5) : young;
    const glacial = n % 2 === 0;
    let best = null;
    for (const r of stack) {
      if (r.ka < lo || r.ka > old) continue;
      if (!best || (glacial ? r.d > best.d : r.d < best.d)) best = r;
    }
    if (!best) throw new Error('no LR04 sample inside MIS ' + n);
    const gi = Math.max(0, Math.min(1, (best.d - GI_D0) / GI_SPAN));
    const sea = -SEA_M_PER_PERMIL * (best.d - D_TODAY);
    anchors.push({ mis: n, glacial, ka: best.ka, d: best.d, yearsBP: Math.round(best.ka * 1000),
                   gi: Math.round(gi * 1000) / 1000, sea: Math.round(sea), old: old * 1000, young: Math.max(young, JOIN_KA) * 1000 });
  }
  return anchors;
}

const pad = (s, n) => (s + ' '.repeat(n)).slice(0, Math.max(n, s.length));
function blocks(A) {
  const gi = A.map(a => '    ' + pad('[' + pad(String(a.yearsBP) + ',', 8) + ' ' + a.gi.toFixed(3) + '],', 20) +
    '// MIS ' + a.mis + ' ' + (a.glacial ? 'glacial' : 'interglacial') + ', δ18O ' + a.d.toFixed(2) + ' ‰ at ' + a.ka + ' ka').join('\n');
  const sea = A.map(a => '    ' + pad('[' + pad(String(a.yearsBP) + ',', 8) + ' ' + pad(String(a.sea), 4) + '],', 18) +
    '// MIS ' + a.mis).join('\n');
  const mis = [];
  for (let i = 0; i < A.length; i += 3) {
    mis.push('    ' + A.slice(i, i + 3).map(a => "[" + a.old + ", " + a.young + ", 'MIS " + a.mis + "']").join(', ') + ',');
  }
  return { gi, sea, mis: mis.join('\n') };
}

function write(A) {
  const B = blocks(A);
  let src = fs.readFileSync(CLIMATE, 'utf8');
  const crlf = src.includes('\r\n');
  src = src.replace(/\r\n/g, '\n');
  const put = (tag, body) => {
    // the opening marker's line, then anything (the old block, or nothing), then the closing marker's line
    const re = new RegExp('(// <lr04:' + tag + '>[^\\n]*\\n)[\\s\\S]*?([ \\t]*// </lr04:' + tag + '>)');
    if (!re.test(src)) throw new Error('marker <lr04:' + tag + '> not found in TeManawa_climate.js');
    src = src.replace(re, (m, a, b) => a + body + '\n' + b);
  };
  put('anchors', B.gi); put('sea', B.sea); put('mis', B.mis);
  fs.writeFileSync(CLIMATE, crlf ? src.replace(/\n/g, '\r\n') : src);
  console.log('wrote ' + A.length + ' LR04 stages into TeManawa_climate.js');
}

module.exports = { build, blocks, GI_D0, GI_SPAN, D_TODAY, SEA_M_PER_PERMIL, JOIN_KA };

if (require.main === module) {
  const A = build();
  if (process.argv.includes('--write')) write(A);
  else { const B = blocks(A); console.log(B.gi + '\n\n' + B.sea + '\n\n' + B.mis); }
}
