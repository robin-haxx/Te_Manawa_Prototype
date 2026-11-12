// ============================================================
// TE MANAWA: terrain snapshot exporter (dev only, browser)
// ------------------------------------------------------------
// Serve with the export endpoint, open the page at 1920×1080, then in the console:
//
//   const s = document.createElement('script'); s.src = '/tools/export_frames.js'; document.head.appendChild(s);
//   TM_EXPORT.run(TM_EXPORT.peaks(), 'terrain_geology_timeline/peak')   // glacial + interglacial peaks
//   TM_EXPORT.run([[122000, 'dir/name.png', 'label']])                 // explicit list
//   TM_EXPORT.scanNames()   then   TM_EXPORT.runNames('terrain_river_names/names')
//                           // the river names as the wall letters them, one frame per change in which
//                           // names are on screen (see scanNames); run(list, prefix, { names: true }) for any list
//   TM_EXPORT.run(TM_EXPORT.palaeo(), 'palaeo_attract/palaeo', { palaeo: true })
//                           // the land before the window (TeManawa_palaeo.js): 4 Ma → 1 Ma at the attract
//                           // sequence's keyframes and the strait's turns, lettered with the names of the time
//
// node tools/serve.js 8093 --export   (or the temanawa-export launch config) accepts the POSTs.
// Frames are the GROUND layer only (terrain, water, frost, haze; plus the river names with { names: true },
// placed clear of where the HUD would stand, so the bottom of the frame stays unnamed), stamped with date, MIS, eustatic and
// relative sea level and the deep-time factors when a label is given. Snapshot at the PEAKS of the
// glacial cycle, not at the mid-swing boost stops: those hide the coast's breathing.
// Runs in the background; poll TM_EXPORT.done / TM_EXPORT.finished. Each frame takes a few seconds
// with the browser pane visible (much longer hidden). Never shipped: index.html does not load it.
// ============================================================
(function () {
  const X = {
    done: [], finished: false, _buf: null,

    // Morph to `y` (the land, its water and the river lines), as frame() does, without composing.
    _seat(y) {
      const g = game, T = g.terrain;
      DeepTime.yearsBP = y;
      T._morphFade = null; T.morphTo(y); T._morphFade = null;
      if (g.seasonManager && g.seasonManager.update) g.seasonManager.update(0);
      if (g.water && g.water.reconcile) g.water.reconcile(T, y);
    },

    // Morph to `y`, compose the ground into a 1920×1080 buffer, stamp it, POST it under exports/.
    // opts.names: letter the river names over the ground as the wall does (RiverNames.drawStill, with
    // the HUD's keep-out; opts.prevOf, a Map yearsBP → the layout before it, as scanNames keeps); the
    // names drawn are left in X.lastNames.
    async frame(y, path, label, opts) {
      const g = game, T = g.terrain;
      X._seat(y);
      const projH = (typeof Projection !== 'undefined') ? Projection.projectedWorldHeight() : T.mapHeight;
      // The 1080-space frame (CONFIG.canvasWidth × canvasHeight): the ground tier composes in 1080 space,
      // whatever the backing canvas's sprite supersample (width/height are the backing size).
      if (!X._buf) { X._buf = createGraphics(CONFIG.canvasWidth, CONFIG.canvasHeight); X._buf.pixelDensity(1); }
      const b = X._buf;
      g._composeTerrainLayer(b, projH);
      X.lastNames = (opts && opts.names && typeof RiverNames !== 'undefined')
        ? RiverNames.drawStill(b, T, CONFIG.canvasWidth, CONFIG.canvasHeight, opts.prevOf ? opts.prevOf.get(y) : null) : null;
      // The land before the window: the river names as the sequence letters them (through RiverNames'
      // Palaeo hook, so the sequence must read as active while they lay out) and the region names +
      // caption of the date (Palaeo.drawStill).
      if (opts && opts.palaeo && typeof Palaeo !== 'undefined' && Palaeo.drawStill) {
        if (typeof RiverNames !== 'undefined') {
          const keep = { active: Palaeo.active, yearsBP: Palaeo.yearsBP };
          Palaeo.active = true; Palaeo.yearsBP = y;
          try { X.lastNames = RiverNames.drawStill(b, T, CONFIG.canvasWidth, CONFIG.canvasHeight, null); }
          finally { Palaeo.active = keep.active; Palaeo.yearsBP = keep.yearsBP; }
        }
        X.lastRegions = Palaeo.drawStill(b, T, CONFIG.canvasWidth, CONFIG.canvasHeight, y);
      }
      if (label) {
        const c = Climate.at(y), eu = Climate.seaLevelAt(y), rsl = TerrainGenerator.relativeSeaLevel(y), f = TerrainGenerator.geoTimeFactors(y);
        const ka = (y / 1000).toFixed(y % 1000 ? 1 : 0);
        b.push(); b.noStroke(); b.fill(0, 0, 0, 170); b.rect(16, 16, 1040, 78, 8);
        b.fill(255); b.textSize(30); b.textAlign(LEFT, TOP); b.text(ka + ' ka · ' + (c.mis || '') + ' · ' + label, 32, 24);
        b.textSize(19); b.fill(225);
        b.text('glacial index ' + c.glacialIndex.toFixed(2) + ' · sea ' + Math.round(eu) + ' m (relative ' + Math.round(rsl) + ' m) · uplift ' + f.uplift.toFixed(2) + ' · fan spread ' + f.tribSpread.toFixed(2) + ' · lake ' + f.lake.toFixed(2), 32, 62);
        b.pop();
      }
      const blob = await new Promise(r => b.elt.toBlob(r, 'image/png'));
      for (let k = 0; k < 4; k++) {
        const res = await fetch('/__export?path=' + encodeURIComponent(path), { method: 'POST', body: blob });
        if (res.status === 200) return 200;
        await new Promise(r => setTimeout(r, 1500));   // Windows can briefly lock a file being re-written
      }
      return 500;
    },

    // The glacial and interglacial PEAKS of the window: local extremes of relative sea level, scanned
    // every 1 kyr, plus the window's ends. Returns [[yearsBP, label], …], oldest first.
    // Sub-stage wiggles (MIS 5a–d, 7a–e …) are pruned: an extreme is kept only if the sea swings at
    // least `minSwing` m to the next kept extreme of the other kind.
    peaks(from = 1000000, to = 25500, minSwing = 30) {
      const R = (y) => TerrainGenerator.relativeSeaLevel(y), ex = [];
      for (let y = from - 1000; y > to + 1000; y -= 1000) {
        const a = R(y + 1000), m = R(y), b = R(y - 1000);
        if (m > a && m >= b) ex.push({ y, r: m, hi: true });
        else if (m < a && m <= b) ex.push({ y, r: m, hi: false });
      }
      // merge runs of the same kind (keep the more extreme), then drop pairs with a small swing
      let changed = true;
      while (changed) {
        changed = false;
        for (let i = 0; i + 1 < ex.length; i++) {
          const p = ex[i], q = ex[i + 1];
          if (p.hi === q.hi) { ex.splice((p.hi ? p.r >= q.r : p.r <= q.r) ? i + 1 : i, 1); changed = true; break; }
          if (Math.abs(p.r - q.r) < minSwing) {
            // drop the pair member that is the weaker extreme of its kind relative to its neighbours
            const drop = (i + 2 < ex.length) ? i + 1 : i;
            ex.splice(drop, 1); changed = true; break;
          }
        }
      }
      const out = [[from, 'opening']];
      for (const e of ex) out.push([e.y, (Climate.at(e.y).mis || '') + (e.hi ? ' interglacial peak' : ' glacial peak')]);
      out.push([to, 'window end; LGM']);
      return out;
    },

    // The land before the window: the attract sequence's keyframes (TM_PALAEO.keyframes) and the
    // strait's turns (md/TEMANAWA_PALAEO_ATTRACT.md §1), oldest first. Export with { palaeo: true }.
    palaeo() {
      return [
        [4000000, 'low coastal plain round the axis; the Tararua the lasting land; deep water off the south-east (T&B 4A)'],
        [3450000, 'the sea onlaps the plain toward the axis (Young-1: west of the gorge ~3.6 Ma)'],
        [3300000, 'the first marine breach across the gorge area (late Waipipian)'],
        [3000000, 'a narrow seaway across the southern Ruahine: the Manawatū Strait; a shelf sea (T&B 4B)'],
        [2750000, 'the strait closed: the gorge area land, planed (Mangapanian)'],
        [2400000, 'the Manawatū Strait at its most extensive; the Ruahine shoals; the Tararua low hills (T&B 4C)'],
        [2000000, 'the strait still open; the northern Tararua under the sea'],
        [1630000, 'the strait closes for good (Castlecliffian)'],
        [1500000, 'Mount Bruce uplift closes the Ruataniwha Strait; the basin shelf to marginal marine'],
        [1300000, 'the east is land; the west still marginal; some uplift under way'],
        [1150000, 'the river turning west; the plain emerging'],
        [1000000, 'the window opens: rapid uplift begins (T&B 4D)']
      ];
    },

    // Export a list in the background. Items are [y, path, label] or, with `prefix`, [y, label]
    // (named prefix_NN_<ka>ka.png). `opts` goes to frame(); X.done gets [path, status, names].
    run(list, prefix, opts) {
      X.done = []; X.finished = false;
      const items = prefix
        ? list.map(([y, label], i) => [y, prefix + '_' + String(i + 1).padStart(2, '0') + '_' + (y / 1000).toFixed(y % 1000 ? 1 : 0).replace('.', 'p') + 'ka.png', label])
        : list;
      X._bg(async () => {
        for (const [y, p, l] of items) {
          try { X.done.push([p, await X.frame(y, p, l, opts), X.lastNames]); } catch (e) { X.done.push([p, String(e && e.stack || e)]); }
        }
      });
      return 'started ' + items.length;
    },

    // Wait for the game, hold off the watchdog (a synchronous morph would trip the hard reload), stop
    // the loop, run `job`, set X.finished.
    _bg(job) {
      X.finished = false;
      (async () => {
        while (typeof game === 'undefined' || !game || !game.terrain || !game.terrain._geoCache) await new Promise(r => setTimeout(r, 500));
        if (typeof Kiosk !== 'undefined') Kiosk.watchdogSeconds = 1e9;
        noLoop();
        await job();
        X.finished = true;
      })();
    },

    // WHICH river names are on screen, through the window: morph every `step` years from `from` to
    // `to`, lay the names out as the wall would (RiverNames.layout, HUD keep-out, each date remembering
    // the one before, as the live wall remembers its last layout), and keep the dates where the set
    // changes. A set that lasts a single step is a flicker at that sampling, not a stage: it is reported
    // in X.flickers and folded into its neighbours (minRun steps to count). In the background; poll
    // X.finished, then X.changes = [[yearsBP, [names…], label], …], oldest first, ready for runNames().
    // ~3–4 s a step.
    scanNames(from = 1000000, to = 25500, step = 10000, minRun = 2) {
      X.scan = []; X.changes = null; X.flickers = []; X.scanPrev = new Map();
      const ys = []; for (let y = from; y > to; y -= step) ys.push(y); ys.push(to);
      X._bg(async () => {
        const W = CONFIG.canvasWidth, H = CONFIG.canvasHeight;
        // A renamed river (TM_RIVER_NAMES.rename) is reported with its authored name: 'MANAWATŪ (upper Manawatū)'.
        const nameOf = (L) => {
          const rv = game.terrain.getRivers()[parseInt(L.key, 10)], a = rv && rv.src && rv.src.name;
          return (a && a.normalize('NFC').toUpperCase() !== L.text) ? L.text + ' (' + a + ')' : L.text;
        };
        let prev = null;
        for (const y of ys) {
          X._seat(y);
          X.scanPrev.set(y, prev);
          const labs = RiverNames.layout(game.terrain, W, H, RiverNames.keepOut(W, H), prev);
          prev = new Map(labs.map(L => [L.key, L]));
          X.scan.push([y, labs.map(nameOf).sort()]);
          await new Promise(r => setTimeout(r, 0));
        }
        // runs of the same set; a run shorter than minRun steps (not at the ends) is a flicker
        const key = (n) => n.join('|'), runs = [];
        for (const [y, n] of X.scan) {
          const last = runs[runs.length - 1];
          if (last && key(last.names) === key(n)) last.n++; else runs.push({ y, names: n, n: 1 });
        }
        const kept = [];
        runs.forEach((r, i) => {
          if (r.n < minRun && i > 0 && i < runs.length - 1) { X.flickers.push([r.y, r.names]); return; }
          const last = kept[kept.length - 1];
          if (last && key(last.names) === key(r.names)) return;
          kept.push(r);
        });
        X.changes = kept.map((r, i) => {
          const before = i ? kept[i - 1].names : [];
          const add = r.names.filter(n => !before.includes(n)), gone = before.filter(n => !r.names.includes(n));
          const label = i === 0 ? 'river names at the opening'
            : [add.length ? '+ ' + add.join(', ') : '', gone.length ? '− ' + gone.join(', ') : ''].filter(Boolean).join('  ');
          return [r.y, r.names, label];
        });
      });
      return 'scanning ' + ys.length + ' dates';
    },

    // Export one named frame per scanNames() change (prefix_NN_<ka>ka.png), stamped with what changed,
    // each laid out from the scan's layout just before it so it shows the names the scan found.
    runNames(prefix, changes) {
      return X.run((changes || X.changes).map(([y, , label]) => [y, label]), prefix, { names: true, prevOf: X.scanPrev });
    }
  };
  window.TM_EXPORT = X;
})();
