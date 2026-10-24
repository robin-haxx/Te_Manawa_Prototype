// ============================================================
// TE MANAWA: bake outlined copies of the second-screen plant sprites
// ------------------------------------------------------------
// The second screen swaps a plant to an outlined copy while it is highlighted
// (instead of a CSS box behind it). This writes those copies: the plant with an
// off-white "sticker" border, matching the birds' baked border colour, that is
// solid near the plant and falls off softly outward.
//
//   node tools/outline_plants.js                 # bake every plant in TM_PLANT_SPRITE
//   node tools/outline_plants.js --probe <png>   # print a sprite's baked border colour
//
// Reads TM_PLANT_SPRITE + TM_HABITATS from secondscreen/encyclopedia.js and writes
// secondscreen/assets/plants_outlined/<same filename>.png. The art is cropped tight,
// so each copy is padded by OPT.pad (a FRACTION of the source width/height) on every
// side; secondscreen.css `.sticker .lit` lays it over the original with the matching
// -pad offset and (1 + 2·pad) size. Change one, change the other. Re-run after changing art.
//
// The border is sized in DISPLAYED pixels: each plant is drawn at its cluster
// height (smallest `h` among the habitats that show it), so a 1292-px kahikatea
// and a 258-px tussock get the same on-screen border. No dependencies: PNGs are
// decoded/encoded with zlib (8-bit RGB/RGBA, non-interlaced, which all the art is).
// ============================================================
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const SS = path.join(ROOT, 'secondscreen');
const OUT = path.join(SS, 'assets', 'plants_outlined');

const OPT = {
  color: [235, 229, 213],   // the birds' baked border: --probe on kererū, kiwi, goose all give #ebe5d5
  solidPx: 5,               // displayed px of solid border outside the plant
  softPx: 9,                // displayed px over which it then fades to nothing
  softShape: 1.6,           // falloff curve: >1 fades faster near the solid edge (a glow, not a ramp)
  pad: 0.10                 // canvas padding per side, fraction of W/H. MUST match `.sticker .lit` in secondscreen.css
};

// Grow the canvas by `pad`×W / `pad`×H transparent px on each side, plant centred.
function padImage(img, pad) {
  const px0 = Math.round(img.w * pad), py0 = Math.round(img.h * pad);
  const w = img.w + 2 * px0, h = img.h + 2 * py0, px = Buffer.alloc(w * h * 4);
  for (let y = 0; y < img.h; y++) img.px.copy(px, ((y + py0) * w + px0) * 4, y * img.w * 4, (y + 1) * img.w * 4);
  return { w, h, px };
}

// ---------------- PNG codec ----------------
const SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function decodePNG(buf) {
  if (!buf.subarray(0, 8).equals(SIG)) throw new Error('not a PNG');
  let off = 8, w = 0, h = 0, depth = 0, ct = 0, il = 0; const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off), type = buf.toString('latin1', off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); depth = data[8]; ct = data[9]; il = data[12]; }
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    off += 12 + len;
  }
  if (depth !== 8 || (ct !== 6 && ct !== 2) || il) throw new Error(`unsupported PNG (depth ${depth}, colour type ${ct}, interlace ${il})`);
  const bpp = ct === 6 ? 4 : 3, stride = w * bpp;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const px = Buffer.alloc(w * h * bpp);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], src = y * (stride + 1) + 1, dst = y * stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? px[dst + x - bpp] : 0;
      const b = y ? px[dst - stride + x] : 0;
      const c = (x >= bpp && y) ? px[dst - stride + x - bpp] : 0;
      let v = raw[src + x];
      if (f === 1) v += a;
      else if (f === 2) v += b;
      else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c); }
      px[dst + x] = v & 255;
    }
  }
  if (bpp === 4) return { w, h, px };
  const rgba = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) { rgba[i * 4] = px[i * 3]; rgba[i * 4 + 1] = px[i * 3 + 1]; rgba[i * 4 + 2] = px[i * 3 + 2]; rgba[i * 4 + 3] = 255; }
  return { w, h, px: rgba };
}

const CRC = (() => { const t = new Int32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c; } return t; })();
function crc32(b) { let c = -1; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; }
function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0); out.write(type, 4, 'latin1'); data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}
function encodePNG({ w, h, px }) {
  const stride = w * 4, raw = Buffer.alloc(h * (stride + 1));
  for (let y = 0; y < h; y++) {   // Sub filter on every row: cheap and compresses this art well
    const o = y * (stride + 1); raw[o] = 1;
    for (let x = 0; x < stride; x++) raw[o + 1 + x] = (px[y * stride + x] - (x >= 4 ? px[y * stride + x - 4] : 0)) & 255;
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([SIG, chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

// ---------------- distance transform ----------------
// Exact Euclidean distance (Felzenszwalb & Huttenlocher) from every pixel to the nearest plant pixel.
function edt1d(f, n, d, v, z) {
  let k = 0; v[0] = 0; z[0] = -Infinity; z[1] = Infinity;
  for (let q = 1; q < n; q++) {
    let s;
    while ((s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k])) <= z[k]) k--;
    k++; v[k] = q; z[k] = s; z[k + 1] = Infinity;
  }
  k = 0;
  for (let q = 0; q < n; q++) { while (z[k + 1] < q) k++; d[q] = (q - v[k]) * (q - v[k]) + f[v[k]]; }
}
function distanceField(inside, w, h) {
  const INF = 1e20, g = new Float64Array(w * h), n = Math.max(w, h);
  const f = new Float64Array(n), d = new Float64Array(n), v = new Int32Array(n), z = new Float64Array(n + 1);
  for (let i = 0; i < w * h; i++) g[i] = inside[i] ? 0 : INF;
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) f[y] = g[y * w + x];
    edt1d(f, h, d, v, z);
    for (let y = 0; y < h; y++) g[y * w + x] = d[y];
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) f[x] = g[y * w + x];
    edt1d(f, w, d, v, z);
    for (let x = 0; x < w; x++) g[y * w + x] = Math.sqrt(d[x]);
  }
  return g;
}

// ---------------- the outline ----------------
// solid/soft in SOURCE px. Border alpha: 1 out to `solid` (1 px anti-aliased), then (1-t)^shape to `solid+soft`.
// The plant is then composited over the border, so its own anti-aliased edge blends onto the off-white.
function outline(img, solid, soft) {
  const { w, h, px } = img, inside = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) inside[i] = px[i * 4 + 3] >= 128;
  const dist = distanceField(inside, w, h);
  const out = Buffer.alloc(px.length);
  const [cr, cg, cb] = OPT.color;
  let clipped = 0;
  for (let i = 0; i < w * h; i++) {
    const dd = dist[i];
    let ba;
    if (dd <= solid) ba = 1;
    else if (dd <= solid + 1) ba = 1 - (dd - solid) * (1 - Math.pow(1 - 1 / Math.max(1, soft), OPT.softShape));
    else { const t = Math.min(1, (dd - solid) / Math.max(1e-6, soft)); ba = Math.pow(1 - t, OPT.softShape); }
    // edge-of-canvas pixels with border still showing → the sprite's margin is too tight
    const x = i % w, y = (i / w) | 0;
    if (ba > 0.05 && (x === 0 || y === 0 || x === w - 1 || y === h - 1) && !inside[i]) clipped++;
    const sa = px[i * 4 + 3] / 255, oa = sa + ba * (1 - sa);
    out[i * 4 + 3] = Math.round(oa * 255);
    if (oa > 0) {
      out[i * 4]     = Math.round((px[i * 4] * sa + cr * ba * (1 - sa)) / oa);
      out[i * 4 + 1] = Math.round((px[i * 4 + 1] * sa + cg * ba * (1 - sa)) / oa);
      out[i * 4 + 2] = Math.round((px[i * 4 + 2] * sa + cb * ba * (1 - sa)) / oa);
    }
  }
  return { img: { w, h, px: out }, clipped };
}

// ---------------- probe: a sprite's baked border colour ----------------
function probe(file) {
  const img = decodePNG(fs.readFileSync(file)), { w, h, px } = img;
  let r = 0, g = 0, b = 0, n = 0;
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x;
    if (px[i * 4 + 3] < 220) continue;
    // a solid pixel touching transparency is the outermost border ring
    if (px[(i - 1) * 4 + 3] > 32 && px[(i + 1) * 4 + 3] > 32 && px[(i - w) * 4 + 3] > 32 && px[(i + w) * 4 + 3] > 32) continue;
    const lum = 0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2];
    if (lum < 150) continue;
    r += px[i * 4]; g += px[i * 4 + 1]; b += px[i * 4 + 2]; n++;
  }
  const c = [r / n, g / n, b / n].map(Math.round);
  console.log(`${path.basename(file)}: border ~ rgb(${c.join(', ')}) #${c.map(v => v.toString(16).padStart(2, '0')).join('')} from ${n} edge px`);
}

// ---------------- main ----------------
function loadEncyclopedia() {
  const code = fs.readFileSync(path.join(SS, 'encyclopedia.js'), 'utf8');
  const ctx = vm.createContext({ console });
  return vm.runInContext(code + '\n;({ TM_PLANT_SPRITE, TM_HABITATS });', ctx);
}

function main() {
  if (process.argv[2] === '--probe') { process.argv.slice(3).forEach(probe); return; }
  const { TM_PLANT_SPRITE, TM_HABITATS } = loadEncyclopedia();
  // Displayed height per plant key: the smallest cluster `h` it appears at (the border reads thinnest there).
  const shownH = {};
  for (const hab of Object.values(TM_HABITATS)) for (const p of (hab.plants || [])) {
    if (p.key && p.h) shownH[p.key] = Math.min(shownH[p.key] || Infinity, p.h);
  }
  fs.mkdirSync(OUT, { recursive: true });
  const done = new Set();
  for (const [key, rel] of Object.entries(TM_PLANT_SPRITE)) {
    const src = path.resolve(SS, rel), name = path.basename(src);
    if (done.has(name)) continue;   // two keys can share one sprite file
    done.add(name);
    const img = decodePNG(fs.readFileSync(src));
    const k = img.h / (shownH[key] || img.h);   // source px per displayed px
    const { img: outImg, clipped } = outline(padImage(img, OPT.pad), OPT.solidPx * k, OPT.softPx * k);
    fs.writeFileSync(path.join(OUT, name), encodePNG(outImg));
    console.log(`${key.padEnd(13)} ${name.padEnd(32)} ${img.w}x${img.h} shown@${shownH[key] || '?'}px  border ${(OPT.solidPx * k).toFixed(1)}+${(OPT.softPx * k).toFixed(1)} src px` +
      (clipped ? `  WARNING: border clipped at the canvas edge on ${clipped} px` : ''));
  }
  console.log(`wrote ${done.size} outlined sprites to ${path.relative(ROOT, OUT)}`);
}

main();
