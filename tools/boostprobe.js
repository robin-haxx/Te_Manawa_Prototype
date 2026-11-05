// The health benchmark: how each kind of interaction moves the bar on the wall and the plants and birds
// actually on the land over a visitor session, and how far populations wander with nobody touching it.
// Boots the real scripts headless (the bootcheck stubs), with a p5-faithful Perlin noise() so the land
// has real habitats (the harness's noise is white), a BroadcastChannel stub and frame-clocked timers so
// the bus behaves as in the browser (its heartbeat ends timelapses and fires pending eruptions). One frame
// is 16 ms on the page's clock, so the "seconds" below are real seconds at ~60 fps.
//   node tools/boostprobe.js --bench <dir> [jobs]     the whole benchmark: every scenario below across seeds,
//                                                     one JSON each (a finished run is skipped), then --summary
//   node tools/boostprobe.js --summary <dir>          the tables for a finished --bench
//   node tools/boostprobe.js <scenario> [out.json]    one run. SEED=n picks the land
//   node tools/boostprobe.js --report a.json [...]    the per-boost table for saved runs
// Sessions: answers | matched | wrong | recover | alternate | typical | stormspam | stormwait | stormpaced |
//           eruption | eruptbutton | dialmax. No input: idle (1 Ma) | idleinter (122 ka) | idleglacial (150 ka) |
//           clock (the dial at the clock's own ~500 yr/s). Older: right | mixed | answer | same | dial | storm |
//           health | smoke. Sessions take 2–4 min of wall time, the no-input runs ~6.
const fs = require('fs'), path = require('path'), vm = require('vm');
const dir = path.resolve(__dirname, '..');
if (process.argv[2] === '--report') { for (const f of process.argv.slice(3)) report(JSON.parse(fs.readFileSync(f, 'utf8'))); process.exit(0); }
if (process.argv[2] === '--summary') { summary(process.argv[3]); process.exit(0); }
if (process.argv[2] === '--bench') { bench(process.argv[3], Number(process.argv[4]) || 5); return; }
const SCEN = process.argv[2] || 'right', OUT = process.argv[3] || path.join(require('os').tmpdir(), 'boostprobe_' + SCEN + '.json');
const files = fs.readFileSync(path.join(dir, 'index.html'), 'utf8')
  .match(/src="([^"]+\.js)"/g).map(s => s.slice(5, -1)).filter(f => !f.startsWith('p5'));

// ---- seeded RNG for Math.random (a fixed land per run) ------------------------------------------
let _seed = Number(process.env.SEED || 12345) >>> 0;
const rng = () => { _seed = (_seed + 0x6D2B79F5) >>> 0; let t = _seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const M2 = Object.create(Math); M2.random = rng;

// ---- p5's Perlin noise, verbatim in behaviour -----------------------------------------------------
const PY = 4, PYW = 1 << PY, PZ = 8, PZW = 1 << PZ, PS = 4095;
let oct = 4, fall = 0.5, perlin = null;
const sc = i => 0.5 * (1 - Math.cos(i * Math.PI));
function noise(x, y = 0, z = 0) {
  if (perlin == null) { perlin = new Array(PS + 1); for (let i = 0; i < PS + 1; i++) perlin[i] = rng(); }
  if (x < 0) x = -x; if (y < 0) y = -y; if (z < 0) z = -z;
  let xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi;
  let r = 0, a = 0.5, n1, n2, n3;
  for (let o = 0; o < oct; o++) {
    let of = xi + (yi << PY) + (zi << PZ);
    const rx = sc(xf), ry = sc(yf);
    n1 = perlin[of & PS]; n1 += rx * (perlin[(of + 1) & PS] - n1);
    n2 = perlin[(of + PYW) & PS]; n2 += rx * (perlin[(of + PYW + 1) & PS] - n2);
    n1 += ry * (n2 - n1);
    of += PZW;
    n2 = perlin[of & PS]; n2 += rx * (perlin[(of + 1) & PS] - n2);
    n3 = perlin[(of + PYW) & PS]; n3 += rx * (perlin[(of + PYW + 1) & PS] - n3);
    n2 += ry * (n3 - n2);
    n1 += sc(zf) * (n2 - n1);
    r += n1 * a; a *= fall;
    xi <<= 1; xf *= 2; yi <<= 1; yf *= 2; zi <<= 1; zf *= 2;
    if (xf >= 1) { xi++; xf--; } if (yf >= 1) { yi++; yf--; } if (zf >= 1) { zi++; zf--; }
  }
  return r;
}
function noiseSeed(s) {
  const m = 4294967296, A = 1664525, C = 1013904223;
  let z = (s == null ? rng() * m : s) >>> 0;
  perlin = new Array(PS + 1);
  for (let i = 0; i < PS + 1; i++) { z = (A * z + C) % m; perlin[i] = z / m; }
}
function noiseDetail(l, f) { if (l > 0) oct = l; if (f > 0) fall = f; }

// ---- the bootcheck stubs ---------------------------------------------------------------------------
const img = () => ({ width: 64, height: 64, loadPixels() {}, pixels: new Uint8Array(64 * 64 * 4) });
const DRAW = ['background','fill','noFill','stroke','noStroke','strokeWeight','rect','ellipse','circle','line','triangle','quad','text','textAlign','textSize','textFont','push','pop','translate','rotate','scale','image','imageMode','rectMode','tint','noTint','beginShape','endShape','vertex','curveVertex','arc','point','noSmooth','smooth','blendMode','strokeCap','strokeJoin','textLeading','textStyle','clear','erase','noErase','curveTightness','bezier','bezierVertex','quadraticVertex','curve','shearX','shearY','resetMatrix','applyMatrix','angleMode','ambientLight','noStroke2','noLoop','loop','cursor','noCursor','filter'];
const gfx = (w = 1, h = 1) => { const o = { width: w, height: h, pixels: new Uint8Array(Math.max(4, w * h * 4)) };
  for (const k of DRAW) o[k] = () => o;
  o.remove = () => {}; o.loadPixels = () => {}; o.updatePixels = () => {};
  o.pixelDensity = () => 1; o.get = () => img(); o.set = () => {}; o.resizeCanvas = () => {};
  o.elt = { getContext: () => ({}) }; o.drawingContext = { save() {}, restore() {}, beginPath() {}, rect() {}, clip() {},
    fillStyle: '', globalAlpha: 1, filter: '', imageSmoothingEnabled: true,
    createImageData: (a, b) => ({ data: new Uint8ClampedArray(Math.max(4, (a | 0) * (b | 0) * 4)), width: a | 0, height: b | 0 }),
    putImageData() {}, getImageData: (x, y, a, b) => ({ data: new Uint8ClampedArray(Math.max(4, (a | 0) * (b | 0) * 4)) }) };
  o.noSmooth = () => o; o.smooth = () => o; return o; };

let _t = 0;
const timers = [];
const ctx = { console: { log() {}, warn() {}, error() {} },
  Math: M2, JSON, Object, Array, String, Number, Boolean, Date, Set, Map, WeakMap, Symbol, RegExp, Error, Promise,
  Float32Array, Uint8Array, Uint16Array, Int32Array, Uint8ClampedArray, performance: { now: () => Date.now() },
  parseInt, parseFloat, isNaN, isFinite, Infinity, NaN, URLSearchParams,
  setTimeout: (f, ms) => { timers.push({ at: _t + (ms || 0), f, every: 0 }); return timers.length; }, clearTimeout() {},
  setInterval: (f, ms) => { timers.push({ at: _t + (ms || 0), f, every: ms || 16 }); return timers.length; }, clearInterval() {},
  BroadcastChannel: function () { this.postMessage = () => {}; this.close = () => {}; },
  localStorage: { _d: {}, getItem(k) { return this._d[k] ?? null; }, setItem(k, v) { this._d[k] = v; }, removeItem(k) { delete this._d[k]; } },
  location: { search: '?dev=1', reload() {} },
  navigator: { userAgent: 'node' },
  document: { body: { style: {} }, head: { appendChild() {} }, createElement: () => ({ style: {}, textContent: '' }),
    addEventListener() {}, documentElement: { style: {} },
    querySelector: () => ({ style: { setProperty() {} }, getBoundingClientRect: () => ({ width: 1080, height: 1920 }) }),
    querySelectorAll: () => [], getElementById: () => null, hidden: false },
};
ctx.window = ctx; ctx.globalThis = ctx; ctx.window.addEventListener = () => {};
Object.assign(ctx, {
  createCanvas: () => ({ style() {}, elt: {} }), resizeCanvas() {}, pixelDensity: () => 1, frameRate() {},
  loadImage: img, loadFont: () => ({}), loadSound: () => ({ isLoaded: () => false, play() {}, stop() {}, setVolume() {}, loop() {} }),
  createGraphics: gfx, createVector: (x = 0, y = 0) => ({ x, y, copy() { return ctx.createVector(this.x, this.y); },
    add(v) { this.x += v.x; this.y += v.y; return this; }, sub(v) { this.x -= v.x; this.y -= v.y; return this; },
    mult(n) { this.x *= n; this.y *= n; return this; }, div(n) { this.x /= n; this.y /= n; return this; },
    set(x, y) { this.x = x; this.y = y; return this; }, mag() { return Math.hypot(this.x, this.y); },
    magSq() { return this.x * this.x + this.y * this.y; },
    normalize() { const m = this.mag() || 1; this.x /= m; this.y /= m; return this; },
    limit(m) { const l = this.mag(); if (l > m) this.mult(m / l); return this; },
    setMag(m) { return this.normalize().mult(m); }, heading() { return Math.atan2(this.y, this.x); },
    dist(v) { return Math.hypot(this.x - v.x, this.y - v.y); } }),
  random: (a, b) => { if (a === undefined) return rng(); if (Array.isArray(a)) return a[(rng() * a.length) | 0];
    if (b === undefined) return rng() * a; return a + rng() * (b - a); },
  noise, noiseSeed, noiseDetail, randomSeed(s) { _seed = s >>> 0; },
  map: (v, a, b, c, d) => c + (d - c) * ((v - a) / ((b - a) || 1)),
  constrain: (v, a, b) => Math.min(b, Math.max(a, v)), lerp: (a, b, t) => a + (b - a) * t,
  dist: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1), millis: () => _t,
  color: (...a) => ({ levels: a, toString: () => 'c' }), red: () => 0, green: () => 0, blue: () => 0, alpha: () => 255,
  textWidth: () => 10, windowWidth: 1920, windowHeight: 1080, mouseX: 0, mouseY: 0, key: '', keyCode: 0,
  frameCount: 0, deltaTime: 16, drawingContext: { save() {}, restore() {}, beginPath() {}, rect() {}, clip() {},
    fillStyle: '', globalAlpha: 1, filter: '', shadowBlur: 0, shadowColor: '',
    createLinearGradient: () => ({ addColorStop() {} }), fillRect() {} },
  getAudioContext: () => ({ state: 'running', resume() {} }),
  LEFT: 'left', RIGHT: 'right', CENTER: 'center', TOP: 'top', BOTTOM: 'bottom', BASELINE: 'baseline',
  CORNER: 'corner', CORNERS: 'corners', RADIUS: 'radius', PI: Math.PI, TWO_PI: Math.PI * 2,
  HALF_PI: Math.PI / 2, QUARTER_PI: Math.PI / 4, BLEND: 'blend', ADD: 'add', MULTIPLY: 'multiply',
  ROUND: 'round', SQUARE: 'square', PROJECT: 'project', NORMAL: 'normal', BOLD: 'bold', ITALIC: 'italic',
  DEGREES: 'degrees', RADIANS: 'radians', CLOSE: 'close',
  abs: Math.abs, floor: Math.floor, ceil: Math.ceil, round: Math.round, min: Math.min, max: Math.max,
  sqrt: Math.sqrt, pow: Math.pow, sin: Math.sin, cos: Math.cos, atan2: Math.atan2, exp: Math.exp, sq: v => v * v,
  degrees: r => r * 180 / Math.PI, radians: d => d * Math.PI / 180, int: v => v | 0, shuffle: a => a,
  nf: (v, l, r) => Number(v).toFixed(r || 0), print() {},
  lerpColor: () => ({ levels: [0, 0, 0, 255], toString: () => 'c' }),
  hue: () => 0, saturation: () => 0, brightness: () => 0, lightness: () => 0,
  colorMode() {}, createImage: img,
  hypot: Math.hypot, tan: Math.tan, asin: Math.asin, acos: Math.acos, atan: Math.atan,
  log: Math.log, mag: (x, y) => Math.hypot(x, y), norm: (v, a, b) => (v - a) / ((b - a) || 1),
  textAscent: () => 10, textDescent: () => 4, year: () => 2026, month: () => 7, day: () => 28,
  hour: () => 12, minute: () => 0, second: () => 0, touches: [], pmouseX: 0, pmouseY: 0,
  mouseIsPressed: false, keyIsPressed: false, keyIsDown: () => false,
  fullscreen: () => false, displayWidth: 1920, displayHeight: 1080,
  saveTable() {}, save() {}, createWriter: () => ({ write() {}, close() {} }),
});
for (const k of DRAW) if (!ctx[k]) ctx[k] = () => {};
vm.createContext(ctx);
for (const f of files) vm.runInContext(fs.readFileSync(path.join(dir, f), 'utf8'), ctx, { filename: f });
try { vm.runInContext('LOOK', ctx).bakeScale = 1; } catch (e) {}
const t0 = Date.now();
ctx.preload(); ctx.setup();
const R = (s) => vm.runInContext(s, ctx);
const K = R('Kiosk'); K.watchdogSeconds = 1e9; K.idleSeconds = 1e9;
const FRAME = () => {
  _t += 16; ctx.frameCount++;
  for (let i = 0; i < timers.length; i++) { const T = timers[i]; if (T && T.at <= _t) { try { T.f(); } catch (e) {} if (T.every) T.at += T.every; else timers[i] = null; } }
  ctx.draw();
};
for (let i = 0; i < 120; i++) FRAME();
const G = R('game'), DT = R('DeepTime'), TG = R('TMGoals'), BUS = R('TMBus'), PT = R('PLANT_TYPES'), TB = R('TM_BOOST'), HUDK = R('InstallHUD');
const bootMs = Date.now() - t0;

// Start as a visitor would: the attract has landed on 1 Ma, a fresh ecosystem, the clock at rest.
G.resetEcosystem(); DT.reset(); DT.seekTo(DT.yearsStart);
for (let i = 0; i < 60; i++) FRAME();

// ---- sampling ----------------------------------------------------------------------------------
const cardKeys = Object.keys(TB.faunaLinks).filter(k => PT[k]);
const fitOf = k => TG.fitOf(k);
const samples = [], events = [];
function sample(tag) {
  const sim = G.simulation;
  const byType = {}, byBiome = {}, matureByType = {};
  let alive = 0, mature = 0, dormant = 0, growthSum = 0;
  for (const p of sim.plants) {
    if (!p || !p.alive) continue;
    alive++; growthSum += p.growth || 0;
    byType[p.type] = (byType[p.type] || 0) + 1;
    byBiome[p.biomeKey] = (byBiome[p.biomeKey] || 0) + 1;
    if ((p.growth || 0) >= 0.999) { mature++; matureByType[p.type] = (matureByType[p.type] || 0) + 1; }
    if (p.dormant) dormant++;
  }
  const fauna = {};
  for (const m of sim.moas) if (m.alive) fauna[m.speciesKey] = (fauna[m.speciesKey] || 0) + 1;
  for (const e of sim.eagles) if (e.alive) fauna[e.speciesKey || 'eagle'] = (fauna[e.speciesKey || 'eagle'] || 0) + 1;
  for (const k in sim.otherEntities) { const L = sim.otherEntities[k]; if (!Array.isArray(L)) continue;
    let n = 0; for (const x of L) if (x && x.alive) n++; fauna[k] = n; }
  // Shannon evenness of plants by type, and of fauna by kind
  const H = (o) => { let n = 0, h = 0, s = 0; for (const k in o) n += o[k]; for (const k in o) { if (!o[k]) continue; s++; const p = o[k] / n; h -= p * Math.log(p); } return { s, h, e: s > 1 ? h / Math.log(s) : 0, n }; };
  const Hp = H(byType), Hf = H(fauna);
  let warmN = 0, coldN = 0, neutN = 0;
  for (const k in byType) { const f = fitOf(k); if (f === 'warm') warmN += byType[k]; else if (f === 'cold') coldN += byType[k]; else neutN += byType[k]; }
  const homeo = sim._homeo, lift = {}, target = {};
  if (homeo) for (const k in homeo.dens) { lift[k] = homeo.lift[k] || 0; const t = sim.homeoTarget(k); if (t != null) target[k] = Math.round(t); }
  samples.push({ tag, f: ctx.frameCount, s: +(_t / 1000).toFixed(1), yr: Math.round(DT.yearsBP), glacial: TG.glacialNow(),
    rate: Math.round(DT.geoRate || 0), tl: DT.isTimelapsing(),
    plants: alive, mature, dormant, meanGrowth: +(growthSum / Math.max(1, alive)).toFixed(3),
    warmN, coldN, neutN, plantKinds: Hp.s, plantEven: +Hp.e.toFixed(3),
    faunaN: Hf.n, faunaKinds: Hf.s, faunaEven: +Hf.e.toFixed(3),
    rich: +(sim.ecoEarned || 0).toFixed(3),           // the ledger's upper half, 0..1 (Simulation.ecoEarned)
    hh: +(G._habitatHealth ?? 1).toFixed(3), fit: +(G._regimeFit ?? 1).toFixed(3), rec: +(G._recruitment ?? 1).toFixed(3),
    ash: +(G._ashCover || 0).toFixed(3), sat: +(G._sceneSat ?? 1).toFixed(3),
    hudBar: +sim.ecoHealth.toFixed(3),                // the ledger itself (Simulation.ecoHealth): where the bar is heading
    barDrawn: HUDK._eco ? +HUDK._eco.v.toFixed(3) : null, glow: +HUDK.healthGlow().toFixed(2),   // the bar as drawn, eased, and its glow
    shock: sim._fauna ? +sim._fauna.shock.toFixed(2) : 1, culls: sim.stats.homeoCulls || 0, recruits: sim.stats.homeoRecruits || 0,
    births: sim.stats.births || 0, deaths: sim.stats.deaths || 0, starved: sim.stats.starvations || 0, refounds: sim.stats.refounds || 0,
    faunaTarget: sim._fauna ? Object.values(sim._fauna.targets).reduce((a, b) => a + b, 0) : null,
    targets: sim._fauna ? Object.assign({}, sim._fauna.targets) : null, overuse: !!G._stormOveruse,
    boostsOk: DT.boostsOk | 0, goals: DT.goalsSolved | 0,
    byType, byBiome, matureByType, fauna, lift, target });
}
const run = (frames, every = 60, tag = '') => { for (let i = 0; i < frames; i++) { FRAME(); if (i % every === every - 1) sample(tag); } };
const waitTimelapse = (maxFrames = 3600) => { let n = 0; while (DT.isTimelapsing() && n < maxFrames) { FRAME(); n++; if (n % 60 === 0) sample('tl'); } return n; };

// pick a plant for the current climate: 'right' = fits (warm in an interglacial, cold in a glacial,
// never neutral so the verdict is unambiguous), 'wrong' = the opposite fit
let cyc = 0;
function pick(kind) {
  const glacial = TG.glacialNow();
  const want = kind === 'right' ? (glacial ? 'cold' : 'warm') : (glacial ? 'warm' : 'cold');
  const pool = cardKeys.filter(k => fitOf(k) === want);
  return pool[(cyc++) % pool.length];
}
function pickAnswer() {
  const L = TG.live && TG.live();
  const glacial = TG.glacialNow();
  if (L && L.answer) { const a = L.answer.find(k => TG.fits(k, glacial)); if (a) return a; }
  return pick('right');
}
// a boost that is wrong in every way: the wrong climate, and not the live goal's answer
function pickTotallyWrong() {
  const L = TG.live && TG.live();
  for (let i = 0; i < cardKeys.length; i++) { const k = pick('wrong'); if (!L || !L.answer || L.answer.indexOf(k) < 0) return k; }
  return pick('wrong');
}
// one row of the `health` scenario: what the ledger, the birds and the plants have done since the last
function line(label) {
  run(60 * 15, 60, 'settle');   // 15 s more for the census to show it
  const s = samples[samples.length - 1];
  console.log(pad(label, 30) + pad(s.hudBar.toFixed(3), 8) + pad(s.faunaN + '/' + s.faunaTarget, 9) + pad(s.plants, 8) + pad(s.sat.toFixed(2), 7) + (s.glacial ? 'G' : 'I') + ' ' + Math.round(s.yr / 1000) + 'k');
}
function stormPress() { HUDK.press(G, 'storm'); run(60 * 3, 60, 'storm'); }
// the right climate and not the live goal's answer
function pickMatched() {
  const L = TG.live && TG.live();
  for (let i = 0; i < cardKeys.length; i++) { const k = pick('right'); if (!L || !L.answer || L.answer.indexOf(k) < 0) return k; }
  return pick('right');
}
const hold = (seconds, tag = 'hold') => run(Math.round(seconds * 1000 / 16), 60, tag);   // real seconds, nobody touching it
const mark = (kind, key) => events.push({ f: ctx.frameCount, s: +(_t / 1000).toFixed(1), key, kind, fit: '-', yr: Math.round(DT.yearsBP), glacial: TG.glacialNow() });
const storm = (gapSeconds) => { mark('storm', 'STORM'); HUDK.press(G, 'storm'); sample('storm'); hold(gapSeconds, 'storm'); };
const eruptNext = () => { const er = DT.ERUPTIONS.find(e => e.yearsBP < DT.yearsBP); if (er) G._fireEruptionInPlace(er); sample('erupted'); return er; };
// A land at this date with a fresh world on it, the clock at rest there: where an unattended wall could be standing.
function standAt(yr) {
  DT.seekTo(yr); G.terrain.morphTo(yr, 1); G._bakedYearsBP = yr; G._lastMorphMs = _t;
  if (G.water) G.water.build(G.terrain, yr);
  G.resetEcosystem(); DT.seekTo(yr); G._autoPrevYear = yr; G.seasonManager.update(1);
  samples.length = 0; events.length = 0;
  run(60, 60, 'settle');
}
// Every eruption shows in the log, whatever fired it: a boost's time-lapse landing on one, the dial, the button.
const applyAshReal = G.applyAsh;
G.applyAsh = function (er) { mark('eruption', er ? er.name : 'eruption'); return applyAshReal.call(this, er); };
// A visitor's draw for `typical`, from its own stream so it cannot disturb the sim's.
let visitorSeed = (Number(process.env.SEED || 12345) >>> 0) || 1;
const visitorRoll = () => { visitorSeed = (Math.imul(visitorSeed, 1664525) + 1013904223) >>> 0; return visitorSeed / 4294967296; };
function boost(kind) {
  const key = kind === 'answer' ? pickAnswer() : kind === 'same' ? (TG.glacialNow() ? 'tussock' : 'tawa')
            : kind === 'totallyWrong' ? pickTotallyWrong() : kind === 'matched' ? pickMatched() : pick(kind);
  const before = { yr: Math.round(DT.yearsBP), glacial: TG.glacialNow() };
  const live = TG.live && TG.live();
  BUS.boost({ type: 'boost', plantKey: key, plantName: key });
  const v = TG.verdict && TG.verdict();
  events.push({ f: ctx.frameCount, s: +(_t / 1000).toFixed(1), key, kind, fit: fitOf(key), ...before,
                goal: live ? live.id : null, verdict: v ? v.kind : null });
  sample('boost:' + kind + ':' + key);
  const n = waitTimelapse();
  events[events.length - 1].tlFrames = n;
  events[events.length - 1].yrAfter = Math.round(DT.yearsBP);
  run(480, 60, 'settle');   // ~8 s for the next visitor to pick a card
}

sample('start');
const plans = {
  idle:   () => run(60 * 60 * 4, 120, 'idle'),
  right:  () => { for (let i = 0; i < 12; i++) boost('right'); },
  wrong:  () => { for (let i = 0; i < 12; i++) boost('wrong'); },
  mixed:  () => { for (const k of ['right','right','right','wrong','right','right','wrong','wrong','right','right','right','right']) boost(k); },
  answer: () => { for (let i = 0; i < 12; i++) boost('answer'); },
  same:   () => { for (let i = 0; i < 12; i++) boost('same'); },
  dial:   () => { DT.dialSet(20); run(60 * 60 * 4, 120, 'dial'); },
  // three right boosts, then the storm button spammed (overuse), a minute to settle, three right again
  storm:  () => { for (let i = 0; i < 3; i++) boost('right');
                  for (let i = 0; i < 6; i++) { HUDK.press(G, 'storm'); events.push({ f: ctx.frameCount, s: +(_t / 1000).toFixed(1), key: 'STORM', kind: 'storm', fit: '-', yr: Math.round(DT.yearsBP), glacial: TG.glacialNow() }); run(120, 60, 'storm'); }
                  run(60 * 60, 60, 'settle');
                  for (let i = 0; i < 3; i++) boost('right'); },
  // the targets on the health indicator, in one visitor's session: does the land follow the bar?
  health: () => {
    console.log(pad('step', 30) + pad('bar', 8) + pad('fa/tgt', 9) + pad('plants', 8) + pad('sat', 7) + 'clock');
    line('start');
    for (let i = 1; i <= 4; i++) { boost('answer'); line('right answer ' + i); }
    for (let i = 1; i <= 4; i++) { boost('totallyWrong'); line('totally wrong ' + i); }
    for (let i = 1; i <= 4; i++) { boost('answer'); line('right answer ' + i); }
    stormPress(); line('a storm alone, from full');
    for (let i = 2; i <= 5; i++) { stormPress(); line('storm ' + i + ' in succession'); }
    run(60 * 45, 60, 'calm');
    stormPress(); line('a storm after calm');
    for (let i = 1; i <= 3; i++) { boost('answer'); line('right answer ' + i); }
    const er = DT.ERUPTIONS.find(e => e.yearsBP < DT.yearsBP);
    if (er) { G._fireEruptionInPlace(er); line('an eruption'); line('…as the ash clears'); const lv = TG.live(); console.log('  the goal now: ' + (lv ? lv.id : 'none')); boost('answer'); line('the post-eruption answer'); }
  },
  smoke:  () => { boost('right'); boost('wrong'); },

  // ---- SESSIONS: one kind of play each. 30 s to settle first; the last hold is the most a visitor's state can
  // stand on a real wall (the idle timer lands the attract sequence at 180 s). ----
  answers:    () => { hold(30); for (let i = 0; i < 8; i++) boost('answer'); hold(180); },
  matched:    () => { hold(30); for (let i = 0; i < 8; i++) boost('matched'); hold(60); },
  wrong:      () => { hold(30); for (let i = 0; i < 8; i++) boost('totallyWrong'); hold(180); },
  recover:    () => { hold(30); for (let i = 0; i < 4; i++) boost('totallyWrong'); for (let i = 0; i < 4; i++) boost('answer'); hold(60); },
  alternate:  () => { hold(30); for (let i = 0; i < 6; i++) { boost('answer'); boost('totallyWrong'); } hold(60); },
  typical:    () => { hold(30); for (let i = 0; i < 12; i++) { const r = visitorRoll(); boost(r < 0.4 ? 'answer' : r < 0.8 ? 'matched' : 'totallyWrong'); } hold(60); },
  stormspam:  () => { hold(30); for (let i = 0; i < 5; i++) storm(3); hold(90); for (let i = 0; i < 4; i++) boost('answer'); hold(30); },
  stormwait:  () => { hold(30); for (let i = 0; i < 5; i++) storm(25); hold(90); },   // each left to all but play out (a storm is 20 s)
  stormpaced: () => { hold(30); for (let i = 0; i < 6; i++) storm(60); },             // a calm between: each one a first storm
  eruption:   () => { hold(30); boost('answer'); boost('answer'); eruptNext(); hold(60); boost('answer'); hold(30); boost('answer'); hold(60); },
  eruptbutton:() => { hold(30); for (let i = 0; i < 4; i++) boost('answer'); HUDK.fireEruptionReseed(G); sample('button'); hold(180); },
  // the dial wound right up and held there to the end of the window, wound up again after each eruption halts it
  dialmax:    () => { hold(30); windDial(DT.dialSteps, 20, 60 * 60 * 10); },

  // ---- NO INPUT: real time, the clock at rest, unless it says otherwise. 20 min: far longer than a wall stands
  // unattended (180 s), so a slow drift shows if there is one. ----
  idle:        () => hold(1200, 'idle'),
  idleinter:   () => { standAt(122000); hold(1200, 'idle'); },
  idleglacial: () => { standAt(150000); hold(1200, 'idle'); },
  // the clock running by itself at its own pace (~500 yr/s: 32 min for the window); eruptions halt it, as the dial
  clock:       () => { let s = 1; while (DT.dialTargetRate(s) < DT.yrPerSec && s < DT.dialSteps) s++; windDial(s, 30, 60 * 60 * 40, 120); },
};
// Turn the dial to `step` and let it run to the end of the window (the attract sequence starts) or maxFrames.
// An eruption halts the dial; the visitor (or whoever set it) waits `afterEruptionS`, then turns it back.
function windDial(step, afterEruptionS, maxFrames, every = 60) {
  const P = R('Palaeo');
  DT.dialSet(step);
  let waited = 0;
  for (let i = 0; i < maxFrames && !P.active; i++) {
    FRAME();
    if (i % every === every - 1) sample('dial');
    if (DT.dialStep === 0 && !G._tmAutoErAt) { if (++waited >= afterEruptionS * 62.5) { DT.dialSet(step); waited = 0; } }
  }
}
plans[SCEN]();
sample('end');
fs.writeFileSync(OUT, JSON.stringify({ scen: SCEN, seed: Number(process.env.SEED || 12345), bootMs, wallMs: Date.now() - t0, cardKeys: cardKeys.map(k => [k, fitOf(k)]),
  faunaClimate: G.simulation._fauna ? G.simulation._fauna.clim : null, faunaBase: G.simulation._fauna ? G.simulation._fauna.base : null, events, samples }));
report(JSON.parse(fs.readFileSync(OUT, 'utf8')));
console.log('\n' + SCEN, 'done', OUT, ((Date.now() - t0) / 1000).toFixed(0) + 's', samples.length, 'samples', events.length, 'boosts');

// ---- the whole benchmark ------------------------------------------------------------------------
function benchLists() {
  return { sessions: ['answers', 'matched', 'wrong', 'recover', 'alternate', 'typical', 'stormspam', 'stormwait', 'stormpaced', 'eruption', 'eruptbutton', 'dialmax'],
           idle: ['idle', 'idleinter', 'idleglacial'] };
}
function bench(outDir, jobs) {
  const { spawn } = require('child_process');
  fs.mkdirSync(outDir, { recursive: true });
  const L = benchLists(), list = [];
  for (const sc of L.idle) for (const seed of [12345, 777, 4242]) list.push([sc, seed]);
  for (const sc of L.sessions) for (const seed of [12345, 777]) list.push([sc, seed]);
  list.push(['clock', 12345]);
  const jsonOf = (sc, seed) => path.join(outDir, sc + '_' + seed + '.json');
  const todo = list.filter(([sc, seed]) => !fs.existsSync(jsonOf(sc, seed)));
  console.log(todo.length + ' runs to do of ' + list.length + ', ' + jobs + ' at a time');
  let running = 0, failed = 0;
  const startOne = () => {
    while (running < jobs && todo.length) {
      const [sc, seed, tries = 0] = todo.shift();
      running++;
      const t0 = Date.now();
      const log = fs.openSync(path.join(outDir, sc + '_' + seed + '.txt'), 'w');
      const p = spawn(process.execPath, [__filename, sc, jsonOf(sc, seed)], { env: Object.assign({}, process.env, { SEED: String(seed) }), stdio: ['ignore', log, log] });
      p.on('close', (code) => {
        running--; fs.closeSync(log);
        const ok = code === 0 && fs.existsSync(jsonOf(sc, seed));
        console.log((ok ? 'done ' : 'FAIL ') + sc + ' seed ' + seed + ' in ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s (' + todo.length + ' waiting, ' + running + ' running)');
        if (!ok) { if (tries < 1) todo.push([sc, seed, tries + 1]); else failed++; }   // a transient ENOSPC has killed a run before
        if (!todo.length && !running) { if (failed) console.log(failed + ' runs failed twice'); summary(outDir); }
        else startOne();
      });
    }
  };
  if (todo.length) startOne(); else summary(outDir);
}

// ---- the tables ----------------------------------------------------------------------------------
function statsOf(v) {
  const n = v.length, mean = n ? v.reduce((a, b) => a + b, 0) / n : 0;
  const sd = n ? Math.sqrt(v.reduce((a, b) => a + (b - mean) * (b - mean), 0) / n) : 0;
  return { n, mean, sd, min: n ? Math.min(...v) : 0, max: n ? Math.max(...v) : 0, cv: mean ? sd / mean : 0 };
}
function pearson(a, b) {
  const A = statsOf(a), B = statsOf(b);
  if (!A.sd || !B.sd) return 0;
  let c = 0; for (let i = 0; i < a.length; i++) c += (a[i] - A.mean) * (b[i] - B.mean);
  return c / a.length / A.sd / B.sd;
}
function slopePerMin(S, key) {   // least squares, per real minute
  const xs = S.map(x => x.s / 60), ys = S.map(key), X = statsOf(xs), Y = statsOf(ys);
  let c = 0; for (let i = 0; i < xs.length; i++) c += (xs[i] - X.mean) * (ys[i] - Y.mean);
  return X.sd ? c / xs.length / (X.sd * X.sd) : 0;
}
function summary(outDir) {
  const L = benchLists();
  const runs = fs.readdirSync(outDir).filter(f => f.endsWith('.json')).map(f => JSON.parse(fs.readFileSync(path.join(outDir, f), 'utf8')));
  const by = {}; for (const r of runs) (by[r.scen] = by[r.scen] || []).push(r);
  console.log('\n######## SESSIONS: what each interaction did. After each step: the bar as drawn, the birds on the land / their');
  console.log('target (lowest in the step), the plants alive / their target, the ground saturation. settled = seconds until the birds hold within 2 of target; ~ = not by the end of the step. E = an eruption fired in the step.');
  for (const sc of L.sessions) for (const r of (by[sc] || [])) sessionTable(r);
  console.log('\n######## SESSIONS AT A GLANCE (per run)');
  console.log(pad('scenario', 13) + pad('seed', 7) + pad('min', 5) + pad('bar start>end', 15) + pad('bar range', 12) + pad('birds s>e', 11) + pad('range', 8) + pad('plants s>e', 12) + pad('range', 10) + pad('r(bar,tgt)', 11) + pad('r(bar,birds)', 13) + pad('r(bar,plants)', 14) + 'eruptions');
  for (const sc of L.sessions) for (const r of (by[sc] || [])) {
    const S = r.samples.filter(x => x.barDrawn != null), a = S[0], b = S[S.length - 1];
    const bar = S.map(x => x.barDrawn), fa = S.map(x => x.faunaN), pl = S.map(x => x.plants), tg = S.map(x => x.faunaTarget ?? 0);
    console.log(pad(sc, 13) + pad(r.seed, 7) + pad((b.s / 60).toFixed(0), 5) + pad(a.barDrawn.toFixed(2) + '>' + b.barDrawn.toFixed(2), 15) + pad(Math.min(...bar).toFixed(2) + '-' + Math.max(...bar).toFixed(2), 12) +
      pad(a.faunaN + '>' + b.faunaN, 11) + pad(Math.min(...fa) + '-' + Math.max(...fa), 8) + pad(a.plants + '>' + b.plants, 12) + pad(Math.min(...pl) + '-' + Math.max(...pl), 10) +
      pad(pearson(bar, tg).toFixed(2), 11) + pad(pearson(bar, fa).toFixed(2), 13) + pad(pearson(bar, pl).toFixed(2), 14) + r.events.filter(e => e.kind === 'eruption').length);
  }
  console.log('\n######## NO INPUT: real time, the clock at rest. Birds and plants, across seeds.');
  for (const sc of L.idle) if (by[sc]) idleTable(sc, by[sc]);
  for (const sc of ['clock', 'dialmax']) for (const r of (by[sc] || [])) climateTable(r);
}
function sessionTable(r) {
  const S = r.samples, ev = r.events, plan = ev.filter(e => e.kind !== 'eruption');
  console.log('\n== ' + r.scen + '  seed ' + r.seed + '   (' + (S[S.length - 1].s / 60).toFixed(1) + ' min)');
  console.log(pad('#  did', 17) + pad('verdict', 10) + pad('clock', 10) + pad('bar', 7) + pad('glow', 6) + pad('birds/tgt', 11) + pad('low', 5) + pad('plants', 8) + pad('tgt', 6) + pad('sat', 6) + 'settled');
  const row = (label, verdict, from, to) => {
    const win = S.filter(x => x.f >= from && x.f <= to); if (!win.length) return;
    const z = win[win.length - 1];
    const ptgt = Object.values(z.target || {}).reduce((a, b) => a + b, 0);
    let settled = null; for (let i = win.length - 1; i >= 0; i--) { if (Math.abs(win[i].faunaN - win[i].faunaTarget) > 2) break; settled = win[i].s - win[0].s; }
    const erup = ev.some(x => x.kind === 'eruption' && x.f >= from && x.f <= to) ? ' E' : '';
    console.log(pad(label, 17) + pad(verdict || '', 10) + pad(Math.round(z.yr / 1000) + 'k ' + (z.glacial ? 'G' : 'I'), 10) + pad(z.barDrawn != null ? z.barDrawn.toFixed(2) : '-', 7) + pad(z.glow.toFixed(1), 6) +
      pad(z.faunaN + '/' + z.faunaTarget, 11) + pad(Math.min(...win.map(x => x.faunaN)), 5) + pad(z.plants, 8) + pad(ptgt, 6) + pad(z.sat.toFixed(2), 6) + (settled == null ? '~' : settled.toFixed(0) + ' s') + erup);
  };
  row('   start', '', 0, plan.length ? plan[0].f - 1 : S[S.length - 1].f);
  plan.forEach((e, i) => row(pad(i + 1, 3) + e.kind.slice(0, 12), e.verdict, e.f, plan[i + 1] ? plan[i + 1].f - 1 : S[S.length - 1].f));
}
function idleTable(sc, rs) {
  const WALL = 180;   // what a real wall stands for, unattended, before the attract sequence lands a fresh world
  const yr = rs[0].samples[0].yr, gla = rs[0].samples[0].glacial;
  console.log('\n== ' + sc + '  (' + Math.round(yr / 1000) + ' ka, ' + (gla ? 'glacial' : 'interglacial') + ', ' + rs.length + ' seeds, ' + (rs[0].samples[rs[0].samples.length - 1].s / 60 - rs[0].samples[0].s / 60).toFixed(0) + ' min each). Bar at the end: ' + rs.map(r => r.samples[r.samples.length - 1].barDrawn).join(' '));
  console.log(pad('', 30) + pad('start', 12) + pad('live tgt', 12) + '| first ' + WALL + ' s: ' + pad('mean', 7) + pad('sd', 6) + pad('range', 9) + '| whole run: ' + pad('mean', 7) + pad('sd', 6) + pad('cv', 6) + pad('range', 9) + 'drift/min');
  const line = (label, get, tgtOf) => {
    const per = rs.map(r => { const t0 = r.samples[0].s, S = r.samples; return { all: S.map(get), wall: S.filter(x => x.s - t0 <= WALL).map(get), drift: slopePerMin(S, get), tgt: tgtOf ? tgtOf(S[S.length - 1]) : null, start: get(S[0]) }; });
    const avg = f => per.reduce((a, p) => a + f(p), 0) / per.length, A = per.map(p => statsOf(p.all)), W = per.map(p => statsOf(p.wall));
    console.log(pad(label, 30) + pad(per.map(p => p.start).join('/'), 12) + pad(tgtOf ? per.map(p => p.tgt).join('/') : '', 12) + '|           ' +
      pad(avg(p => statsOf(p.wall).mean).toFixed(1), 7) + pad(avg(p => statsOf(p.wall).sd).toFixed(1), 6) + pad(Math.min(...W.map(x => x.min)) + '-' + Math.max(...W.map(x => x.max)), 9) + '|            ' +
      pad(avg(p => statsOf(p.all).mean).toFixed(1), 7) + pad(avg(p => statsOf(p.all).sd).toFixed(1), 6) + pad(avg(p => statsOf(p.all).cv).toFixed(2), 6) + pad(Math.min(...A.map(x => x.min)) + '-' + Math.max(...A.map(x => x.max)), 9) + avg(p => p.drift).toFixed(2));
  };
  line('ALL BIRDS', x => x.faunaN, x => x.faunaTarget);
  const kinds = [...new Set(rs.flatMap(r => Object.keys(r.samples[r.samples.length - 1].fauna)))].sort();
  for (const k of kinds) line('  ' + k + ' (' + ((rs[0].faunaClimate || {})[k] || '-').slice(0, 1) + ')', x => x.fauna[k] || 0, x => (x.targets || {})[k] ?? '-');
  line('ALL PLANTS', x => x.plants, x => Object.values(x.target || {}).reduce((a, b) => a + b, 0));
  const biomes = [...new Set(rs.flatMap(r => Object.keys(r.samples[r.samples.length - 1].byBiome)))].sort();
  for (const b of biomes) line('  ' + b, x => x.byBiome[b] || 0, x => (x.target || {})[b] ?? '-');
  const mins = r => (r.samples[r.samples.length - 1].s - r.samples[0].s) / 60;
  const flow = (k) => rs.map(r => ((r.samples[r.samples.length - 1][k] - r.samples[0][k]) / mins(r)).toFixed(1)).join('/');
  console.log('per minute, each seed:  births ' + flow('births') + '  deaths ' + flow('deaths') + '  starved ' + flow('starved') + '  census retired ' + flow('culls') + '  newcomers ' + flow('recruits') + '  refounds ' + flow('refounds'));
}
function climateTable(r) {
  const clim = r.faunaClimate || {}, S = r.samples.filter(x => x.tag === 'dial');
  if (!S.length) return;
  const bird = (x, want) => Object.keys(x.fauna).reduce((a, k) => a + (clim[k] === want ? x.fauna[k] : 0), 0);
  console.log('\n== ' + r.scen + '  seed ' + r.seed + ': the clock running with no boosts. ' + r.events.filter(e => e.kind === 'eruption').map(e => e.key + ' at ' + (e.s / 60).toFixed(1) + ' min').join(', '));
  console.log(pad('min', 6) + pad('clock', 11) + pad('bar', 6) + pad('birds/tgt', 11) + pad('warm', 6) + pad('cold', 6) + pad('plants', 8) + pad('warm', 6) + pad('cold', 6) + 'sat');
  const step = Math.max(1, Math.floor(S.length / 18));
  for (let i = 0; i < S.length; i += step) { const x = S[i];
    console.log(pad((x.s / 60).toFixed(1), 6) + pad(Math.round(x.yr / 1000) + 'k ' + (x.glacial ? 'G' : 'I'), 11) + pad(x.barDrawn.toFixed(2), 6) + pad(x.faunaN + '/' + x.faunaTarget, 11) + pad(bird(x, 'warm'), 6) + pad(bird(x, 'cold'), 6) + pad(x.plants, 8) + pad(x.warmN, 6) + pad(x.coldN, 6) + x.sat.toFixed(2)); }
  const reg = (g) => { const T = S.filter(x => x.glacial === g); return T.length ? 'birds ' + statsOf(T.map(x => x.faunaN)).mean.toFixed(0) + ' (warm ' + statsOf(T.map(x => bird(x, 'warm'))).mean.toFixed(0) + ', cold ' + statsOf(T.map(x => bird(x, 'cold'))).mean.toFixed(0) + '), plants ' + statsOf(T.map(x => x.plants)).mean.toFixed(0) + ' (warm ' + statsOf(T.map(x => x.warmN)).mean.toFixed(0) + ', cold ' + statsOf(T.map(x => x.coldN)).mean.toFixed(0) + ')' : 'none'; };
  console.log('interglacial means: ' + reg(false)); console.log('glacial means:      ' + reg(true));
}

// ---- the report: per boost, what the flora and fauna did, and the candidate health signals ----
function pad(s, n) { return String(s).padEnd(n); }
function num(v, d = 2) { return v == null ? '-' : (+v).toFixed(d); }
function report(d) {
  const S = d.samples, s = d.scen;
  console.log('\n==== ' + s + '  (' + (d.wallMs / 1000).toFixed(0) + ' s wall, ' + d.events.length + ' boosts)');
  // per-boost table: the sample right before the boost, and the last settle sample before the next
  const evs = d.events;
  const at = f => { let best = S[0]; for (const x of S) if (x.f <= f) best = x; return best; };
  const after = f => { let best = null; for (const x of S) if (x.f > f) { best = x; break; } return best; };
  console.log(pad('#', 3) + pad('kind', 7) + pad('key', 13) + pad('clim', 5) + pad('verd', 9) + pad('yr', 8) +
    pad('plants', 12) + pad('w/c', 13) + pad('fauna', 11) + pad('faMin', 7) + pad('fTarget', 10) + pad('shock', 7) +
    pad('earned', 12) + pad('hhMin', 6) + pad('bar', 12) + 'lift');
  for (let i = 0; i < evs.length; i++) {
    const e = evs[i], a = at(e.f - 1), next = evs[i + 1] ? evs[i + 1].f - 1 : S[S.length - 1].f, b = at(next);
    const win = S.filter(x => x.f >= e.f && x.f <= next);
    const hhMin = Math.min(...win.map(x => x.hh)), faMin = Math.min(...win.map(x => x.faunaN)), shMin = Math.min(...win.map(x => x.shock ?? 1));
    const lift = Object.values(b.lift).reduce((p, c) => p + c, 0);
    console.log(pad(i + 1, 3) + pad(e.kind.slice(0, 6), 7) + pad(e.key, 13) + pad(e.glacial ? 'G' : 'I', 5) + pad(e.verdict || '-', 9) + pad(Math.round(e.yr / 1000) + 'k', 8) +
      pad(a.plants + '→' + b.plants, 12) + pad(b.warmN + '/' + b.coldN, 13) +
      pad(a.faunaN + '→' + b.faunaN, 11) + pad(faMin, 7) + pad((a.faunaTarget ?? '-') + '→' + (b.faunaTarget ?? '-'), 10) + pad(num(shMin), 7) +
      pad(num(a.rich) + '→' + num(b.rich), 12) + pad(num(hhMin), 6) + pad(num(a.hudBar) + '→' + num(b.hudBar), 12) + lift);
  }
  const first = S[0], last = S[S.length - 1];
  if (d.faunaClimate) console.log('fauna leaning / unattended level: ' + Object.keys(d.faunaClimate).map(k => k + ' ' + d.faunaClimate[k] + '/' + d.faunaBase[k]).join(', '));
  console.log('start ' + JSON.stringify({ yr: first.yr, plants: first.plants, fauna: first.faunaN, byBiome: first.byBiome }));
  console.log('end   ' + JSON.stringify({ yr: last.yr, plants: last.plants, fauna: last.faunaN, byBiome: last.byBiome }));
  // species-level end vs start
  const types = new Set([...Object.keys(first.byType), ...Object.keys(last.byType)]);
  console.log('plants by type (start→end): ' + [...types].sort().map(k => k + ' ' + (first.byType[k] || 0) + '→' + (last.byType[k] || 0)).join(', '));
  const fk = new Set([...Object.keys(first.fauna), ...Object.keys(last.fauna)]);
  console.log('fauna by kind (start→end): ' + [...fk].sort().map(k => k + ' ' + (first.fauna[k] || 0) + '→' + (last.fauna[k] || 0)).join(', '));
  // ranges over the run
  const rng = k => { const v = S.map(x => x[k]).filter(x => x != null); return num(Math.min(...v)) + '..' + num(Math.max(...v)); };
  console.log('ranges  plants ' + rng('plants') + '  fauna ' + rng('faunaN') + '  rich ' + rng('rich') + '  hh ' + rng('hh') + '  bar ' + rng('hudBar') + '  fTarget ' + rng('faunaTarget') + '  culls ' + (last.culls ?? '-') + '  recruits ' + (last.recruits ?? '-') + '  plantKinds ' + rng('plantKinds') + '  faunaKinds ' + rng('faunaKinds'));
}
