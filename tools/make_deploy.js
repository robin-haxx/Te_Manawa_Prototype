#!/usr/bin/env node
// ============================================================
// TE MANAWA: build the deploy package
// ------------------------------------------------------------
//   node tools/make_deploy.js                      → dist/temanawa-web/   the web root the wall needs (~95 MB)
//   node tools/make_deploy.js --smoke              → …then boot it in headless Chromium (needs playwright)
//   node tools/make_deploy.js --electron           → …then wrap it as the kiosk shell: dist/TeManawa-<platform>-x64/
//   node tools/make_deploy.js --electron --platform win32 --smoke --zip      the museum build
//
// Options: --out <dir> (default dist/temanawa-web; must lie under dist/, it is wiped first)
//          --platform win32|linux|darwin (default: this machine)   --arch x64|arm64 (default x64)
//          --zip   also write dist/<name>.zip (needs `zip` or a bsdtar `tar`)
//
// This is TEMANAWA_OPERATIONS.md §5 made executable. It copies: the page, p5, the engine, the level,
// the geography, the sprites (minus the unused 222 MB ash set and the retired art), the three fonts
// in use, the console page, the server, the licence and the operator notes — and nothing else: no
// md/, exports/, research/, node_modules/, .git/. Audio comes along only if TeManawa_audio.js has
// been switched on.
//
// Then it CHECKS the copy, because a sprite that silently fails to load is this project's oldest
// bug (CLAUDE.md): every <script src>, <img src>, <link href>, url(), and every asset path the code
// names as a string literal must exist in the copy, or the build fails. It writes VERSION.txt and
// manifest.json (sha256 of every file) so a museum can tell which build it has, and --smoke serves
// the copy and boots BOTH pages in one headless browser profile, failing on a page error, a 404, an
// entry in Kiosk's error log, or a console that never hears the wall over the bus.
// ============================================================
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync, spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const args = process.argv.slice(2);
const flag = (n) => args.includes('--' + n);
const opt = (n, d) => { const i = args.indexOf('--' + n); return i >= 0 && args[i + 1] ? args[i + 1] : d; };

const OUT = path.resolve(opt('out', path.join(DIST, 'temanawa-web')));
const PLATFORM = opt('platform', process.platform);
const ARCH = opt('arch', 'x64');

// ---------------------------------------------------------------------------
// 1. What ships (TEMANAWA_OPERATIONS.md §5)
// ---------------------------------------------------------------------------
const audioOn = /this\.enabled\s*=\s*true/.test(fs.readFileSync(path.join(ROOT, 'TeManawa_audio.js'), 'utf8'));
const ART_WORKING = /\.(pxo|psd|aseprite|xcf|kra)$/i;

function included(rel) {                        // rel: forward-slash path from ROOT
  if (/^(index\.html|style\.css|p5\.min\.js|p5\.sound\.min\.js|LICENSE)$/.test(rel)) return true;
  if (/^TeManawa_[\w]+\.js$/.test(rel)) return true;
  if (rel.startsWith('levels/')) return true;
  if (rel === 'geo/manawatu.geo.js') return true;
  if (rel.startsWith('sprites/')) {
    if (rel.startsWith('sprites/Environmental/AshCloud/')) return false;   // 86 frames, 222 MB, unused (the cover plays VolcanicAsh/)
    if (rel.startsWith('sprites/_retired/')) return false;
    if (ART_WORKING.test(rel)) return false;
    return true;
  }
  if (/^typefaces\/(OpenDyslexic\.ttf|NF-Nadira-Pro-Regular\.(ttf|otf))$/.test(rel)) return true;
  if (rel.startsWith('secondscreen/')) return !ART_WORKING.test(rel);
  if (rel === 'tools/serve.js') return true;
  if (audioOn && rel.startsWith('audio/')) return true;
  return false;
}

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== 'node_modules' && e.name !== '.git' && p !== DIST) walk(p, out); }
    else if (e.isFile()) out.push(p);
  }
  return out;
}

function rimraf(p) { fs.rmSync(p, { recursive: true, force: true }); }
function sha256(file) { return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'); }
function git(cmd) { try { return execSync('git ' + cmd, { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch (e) { return ''; } }
function fmtMB(b) { return (b / 1048576).toFixed(1) + ' MB'; }

const failures = [];
const fail = (m) => { failures.push(m); console.log('  FAIL ' + m); };
const ok = (m) => console.log('  ok   ' + m);

async function main() {
  if (!OUT.startsWith(DIST + path.sep)) throw new Error(`--out must lie under ${DIST} (it is wiped): ${OUT}`);
  console.log(`Te Manawa deploy build\n  root ${ROOT}\n  out  ${OUT}`);

  // --- copy --------------------------------------------------------------
  rimraf(OUT); fs.mkdirSync(OUT, { recursive: true });
  const files = walk(ROOT).map(p => path.relative(ROOT, p).split(path.sep).join('/')).filter(included).sort();
  let bytes = 0;
  for (const rel of files) {
    const src = path.join(ROOT, rel), dst = path.join(OUT, rel);
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
    bytes += fs.statSync(src).size;
  }
  const quick = path.join(ROOT, 'deploy', 'OPERATOR_QUICKSTART.md');
  if (fs.existsSync(quick)) { fs.copyFileSync(quick, path.join(OUT, 'OPERATOR_QUICKSTART.md')); files.push('OPERATOR_QUICKSTART.md'); }
  console.log(`\ncopied ${files.length} files, ${fmtMB(bytes)}${audioOn ? ' (audio is ON in TeManawa_audio.js: audio/ included)' : ' (audio off: audio/ not shipped)'}`);

  // --- version stamp -----------------------------------------------------
  const sketch = fs.readFileSync(path.join(ROOT, 'TeManawa_sketch.js'), 'utf8');
  const cfgVersion = (sketch.match(/version:\s*'([^']+)'/) || [])[1] || '?';
  const pkgVersion = (() => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'electron', 'package.json'), 'utf8')).version; } catch (e) { return '0.0.0'; } })();
  const commit = git('rev-parse HEAD'), describe = git('describe --tags --always --dirty'), branch = git('rev-parse --abbrev-ref HEAD');
  const commitDate = git('log -1 --format=%cI');
  const dirty = git('status --porcelain') ? ' (uncommitted changes present at build time)' : '';
  const build = { name: 'Avian Age: Te Manawa', release: pkgVersion, built: new Date().toISOString(), commit, describe, branch, commitDate, dirty: !!dirty, configVersion: cfgVersion, platformHint: PLATFORM };
  fs.writeFileSync(path.join(OUT, 'VERSION.txt'),
    `Avian Age: Te Manawa — deploy build\n` +
    `release:  ${pkgVersion}\n` +
    `built:    ${build.built}\n` +
    `commit:   ${commit || '(not a git checkout)'} ${describe ? '(' + describe + ')' : ''}${dirty}\n` +
    `branch:   ${branch}\n` +
    `committed:${commitDate}\n` +
    `engine:   CONFIG.version ${cfgVersion} (TeManawa_sketch.js)\n` +
    `files:    ${files.length + 2}, ${fmtMB(bytes)}\n` +
    `This folder is what tools/serve.js serves; the museum build wraps it in the kiosk shell (electron/).\n`);
  files.push('VERSION.txt');

  // --- reference audit ---------------------------------------------------
  console.log('\nreference audit');
  const copied = new Set(files);
  const exists = (rel) => copied.has(rel) || fs.existsSync(path.join(OUT, rel));
  const isDir = (rel) => { try { return fs.statSync(path.join(OUT, rel)).isDirectory(); } catch (e) { return false; } };
  const textFiles = files.filter(f => /\.(js|html|css)$/.test(f) && !/^p5(\.sound)?\.min\.js$/.test(f));
  const stripComments = (s) => s.replace(/<!--[\s\S]*?-->/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"\\])\/\/[^\n]*/g, '$1');
  const resolveRef = (fromRel, ref) => {           // → the copy-relative path, or null
    ref = ref.replace(/^\.\//, '');
    const fromDir = path.posix.dirname(fromRel);
    const cands = ref.startsWith('../') ? [path.posix.normalize(path.posix.join(fromDir, ref))]
                                       : [path.posix.join(fromDir, ref), ref];
    for (const c of cands) if (exists(c)) return c;
    return null;
  };
  let nRefs = 0, nDirs = 0, nAudio = 0;
  const missing = [];
  const FILE_RE = /(?:^|[^\w./\\-])((?:\.\.\/)*(?:sprites|typefaces|audio|levels|geo|secondscreen|assets)\/[\w\-./ ()]*?\.(?:png|jpg|svg|ttf|otf|woff2?|webm|mp4|mp3|wav|js|css|json))(?![\w.])/g;   // tools/ is dev tooling named in notes, never an asset (serve.js ships by the include rule)
  const DIR_RE = /['"`]((?:\.\.\/)*(?:sprites|secondscreen\/assets|assets)\/[\w\-/ ()]*\/)['"`]/g;
  for (const rel of textFiles) {
    const text = stripComments(fs.readFileSync(path.join(OUT, rel), 'utf8'));
    let m;
    while ((m = FILE_RE.exec(text))) {
      const ref = m[1];
      if (!audioOn && /(^|\/)audio\//.test(ref)) { nAudio++; continue; }
      nRefs++;
      if (!resolveRef(rel, ref)) missing.push(`${rel}: ${ref}`);
    }
    while ((m = DIR_RE.exec(text))) {
      nDirs++;
      const d = m[1];
      const fromDir = path.posix.dirname(rel);
      const cands = d.startsWith('../') ? [path.posix.normalize(path.posix.join(fromDir, d))] : [path.posix.join(fromDir, d), d];
      if (!cands.some(isDir)) missing.push(`${rel}: directory ${d}`);
    }
  }
  // the pages' own tags
  for (const page of ['index.html', 'secondscreen/index.html']) {
    const html = fs.readFileSync(path.join(OUT, page), 'utf8');
    const re = /<(?:script|img|link)\b[^>]*?(?:src|href)=["']([^"']+)["']/g;
    let m;
    while ((m = re.exec(html))) { nRefs++; if (!/^(https?:|data:|#)/.test(m[1]) && !resolveRef(page, m[1])) missing.push(`${page}: ${m[1]}`); }
  }
  for (const x of missing) fail('missing: ' + x);
  if (!missing.length) ok(`${nRefs} file references and ${nDirs} directory prefixes resolve in the copy${nAudio ? ` (${nAudio} audio refs skipped: audio off)` : ''}`);
  // the harness's own invariant, on the copy: index.html names every engine script that exists
  const scripted = new Set([...fs.readFileSync(path.join(OUT, 'index.html'), 'utf8').matchAll(/<script src="([^"]+)"/g)].map(m => m[1]));
  const orphan = files.filter(f => /^TeManawa_\w+\.js$/.test(f) && !scripted.has(f));
  if (orphan.length) console.log('  note orphan engine scripts not in index.html (shipped anyway): ' + orphan.join(', '));

  // --- manifest ----------------------------------------------------------
  const manifest = { ...build, files: [] };
  let total = 0;
  for (const rel of [...new Set(files)].sort()) {
    const p = path.join(OUT, rel); if (!fs.existsSync(p)) continue;
    const size = fs.statSync(p).size; total += size;
    manifest.files.push({ path: rel, bytes: size, sha256: sha256(p) });
  }
  manifest.totalBytes = total;
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 1));
  ok(`manifest.json: ${manifest.files.length} files, ${fmtMB(total)}; VERSION.txt: ${describe || commit || 'no git'}`);

  // --- smoke test --------------------------------------------------------
  if (flag('smoke')) await smoke(OUT);

  // --- electron shell ----------------------------------------------------
  let pkgDir = null;
  if (flag('electron')) pkgDir = await electronPackage(OUT, build);

  // --- zip ---------------------------------------------------------------
  if (flag('zip')) {
    const target = pkgDir || OUT;
    const zip = path.join(DIST, path.basename(target) + '.zip');
    rimraf(zip);
    const tryRun = (cmd, a) => spawnSync(cmd, a, { cwd: path.dirname(target), stdio: 'inherit' }).status === 0;
    const done = tryRun('zip', ['-qr', zip, path.basename(target)]) || tryRun('tar', ['-a', '-cf', zip, path.basename(target)]);
    if (done) ok(`zip: ${zip} (${fmtMB(fs.statSync(zip).size)})`); else fail('zip: neither `zip` nor a bsdtar `tar` is available; zip the folder by hand');
  }

  console.log(failures.length ? `\n${failures.length} FAILURES` : '\nOK');
  process.exit(failures.length ? 1 : 0);
}

// ---------------------------------------------------------------------------
// --smoke: serve the copy, boot the wall AND the console in one browser profile
// ---------------------------------------------------------------------------
async function smoke(web) {
  console.log('\nsmoke test (headless Chromium)');
  let playwright;
  try { playwright = require('playwright'); }
  catch (e) { fail('smoke: playwright is not installed (npm i -D playwright && npx playwright install chromium)'); return; }
  const misses = [];
  const { start } = require(path.join(web, 'tools', 'serve.js'));
  const srv = await start({ port: 0, root: web, onMiss: (rel) => misses.push(rel) });
  const base = `http://127.0.0.1:${srv.port}`;
  const shots = path.join(DIST, 'smoke'); fs.mkdirSync(shots, { recursive: true });
  let browser = null;
  try {
    browser = await playwright.chromium.launch({ args: ['--enable-unsafe-swiftshader', '--mute-audio'] });
    const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });   // ONE profile: BroadcastChannel needs it
    const errs = { wall: [], console: [] };
    const wall = await ctx.newPage(), con = await ctx.newPage();
    for (const [name, pg] of [['wall', wall], ['console', con]]) {
      pg.on('pageerror', e => errs[name].push('pageerror: ' + e.message));
      pg.on('console', m => { if (m.type() === 'error') errs[name].push('console.error: ' + m.text().slice(0, 300)); });
    }
    await wall.goto(base + '/', { waitUntil: 'load', timeout: 60000 });
    await con.goto(base + '/secondscreen/', { waitUntil: 'load', timeout: 60000 });
    // the wall boots: terrain baked, frames running. Software GL is slow; allow a while. NOTE: `game`, `Kiosk`,
    // `DeepTime` are classic-script lexical globals, never window properties (MISTAKES.md): test them bare.
    const tBoot = Date.now();
    const booted = await wall.waitForFunction(() => typeof game !== 'undefined' && game && game.terrain && game.terrain.heightMap && typeof frameCount === 'number' && frameCount > 30, null, { timeout: 240000 }).then(() => true).catch(() => false);
    if (booted) ok(`wall booted in ${((Date.now() - tBoot) / 1000).toFixed(0)} s (terrain baked, frames running)`); else fail('wall did not boot within 240 s');
    const kiosk = await wall.evaluate(() => ({ installed: typeof Kiosk !== 'undefined' && !!Kiosk._installed, dev: typeof Kiosk !== 'undefined' && !!Kiosk.devMode, log: typeof Kiosk !== 'undefined' ? Kiosk.getErrorLog() : null, render: (typeof GLBatch !== 'undefined' && GLBatch.active) ? 'WebGL' : '2D' })).catch(e => ({ err: String(e) }));
    if (kiosk.installed && !kiosk.dev) ok(`kiosk layer installed, keys locked (render path here: ${kiosk.render}; headless GL is software, so 2D is expected)`); else fail('kiosk layer not installed or in dev mode: ' + JSON.stringify(kiosk));
    if (kiosk.log && kiosk.log.length) fail('Kiosk error log is not empty: ' + JSON.stringify(kiosk.log).slice(0, 400));
    // the console hears the wall (telemetry over the bus) …
    const heard = await con.waitForFunction(() => { const el = document.getElementById('clockLabel'); return el && !/waiting/i.test(el.textContent); }, null, { timeout: 20000 }).then(() => true).catch(() => false);
    const label = await con.$eval('#clockLabel', el => el.textContent).catch(() => '?');
    if (heard) ok(`console hears the wall over the bus ("${label}")`); else fail(`console never heard the wall (clock label: "${label}")`);
    // … and the wall hears the console (an intent: one dial detent)
    const before = await wall.evaluate(() => (typeof DeepTime !== 'undefined' && DeepTime.dialStep) || 0);
    await con.evaluate(() => { TMBus.dial(1); });
    const dialed = await wall.waitForFunction((b) => typeof DeepTime !== 'undefined' && DeepTime.dialStep > b, before, { timeout: 5000 }).then(() => true).catch(() => false);
    if (dialed) ok('wall hears the console over the bus (a dial detent arrived)'); else fail('a console dial intent never reached the wall');
    await con.evaluate(() => { TMBus.dialReset(); });
    await wall.screenshot({ path: path.join(shots, 'wall.png') });
    await con.screenshot({ path: path.join(shots, 'console.png') });
    for (const name of ['wall', 'console']) { if (errs[name].length) fail(`${name}: ${errs[name].length} page/console errors; first: ${errs[name][0]}`); else ok(`${name}: no page errors, no console.error`); }
    if (misses.length) fail(`${misses.length} requests 404'd; first: ${misses.slice(0, 5).join(', ')}`); else ok('no 404s');
    console.log(`  screenshots in ${shots}`);
  } catch (e) {
    fail('smoke: ' + (e && e.message || e));
  } finally {
    if (browser) await browser.close().catch(() => {});
    await srv.close();
  }
}

// ---------------------------------------------------------------------------
// --electron: stage main.js + package.json + web/ and run @electron/packager
// ---------------------------------------------------------------------------
async function electronPackage(web, build) {
  console.log(`\nelectron shell (${PLATFORM}-${ARCH})`);
  const edir = path.join(ROOT, 'electron');
  let packager, electronVersion;
  try {
    // resolve from electron/ (its package.json may use an exports map, so no bare directory require)
    packager = require(require.resolve('@electron/packager', { paths: [edir] }));
    electronVersion = JSON.parse(fs.readFileSync(require.resolve('electron/package.json', { paths: [edir] }), 'utf8')).version;
  } catch (e) {
    fail('electron: run `npm ci` in electron/ first (it installs electron + @electron/packager): ' + e.message);
    return null;
  }
  const stage = path.join(DIST, 'electron-stage');
  rimraf(stage); fs.mkdirSync(stage, { recursive: true });
  fs.copyFileSync(path.join(edir, 'main.js'), path.join(stage, 'main.js'));
  const pkg = JSON.parse(fs.readFileSync(path.join(edir, 'package.json'), 'utf8'));
  fs.writeFileSync(path.join(stage, 'package.json'), JSON.stringify({ name: pkg.name, productName: pkg.productName, version: pkg.version, description: pkg.description, author: pkg.author || 'Te Manawa', main: 'main.js', private: true, license: pkg.license, build }, null, 2));
  fs.cpSync(web, path.join(stage, 'web'), { recursive: true });
  const pack = typeof packager === 'function' ? packager : packager.packager;
  const outs = await pack({
    dir: stage, out: DIST, name: pkg.productName, platform: PLATFORM, arch: ARCH, electronVersion,
    overwrite: true, asar: false, prune: false, derefSymlinks: true, quiet: true,
    appCopyright: 'MIT licence; see LICENSE', appVersion: pkg.version
  });
  const pkgDir = outs[0];
  // the operator files sit beside the executable, where the museum will look
  for (const f of ['OPERATOR_QUICKSTART.md', 'temanawa.config.json']) {
    const src = path.join(ROOT, 'deploy', f); if (fs.existsSync(src)) fs.copyFileSync(src, path.join(pkgDir, f));
  }
  const plat = path.join(ROOT, 'deploy', PLATFORM === 'win32' ? 'windows' : PLATFORM);
  if (fs.existsSync(plat)) for (const f of fs.readdirSync(plat)) fs.copyFileSync(path.join(plat, f), path.join(pkgDir, f));
  fs.copyFileSync(path.join(web, 'VERSION.txt'), path.join(pkgDir, 'VERSION.txt'));
  rimraf(stage);
  const size = walk(pkgDir).reduce((n, p) => n + fs.statSync(p).size, 0);
  ok(`packaged: ${pkgDir} (${fmtMB(size)}, Electron ${electronVersion})`);
  return pkgDir;
}

main().catch((e) => { console.error('FATAL', e); process.exit(2); });
