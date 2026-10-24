// ============================================================
// TE MANAWA: terrain snapshot exporter (dev only, browser)
// ------------------------------------------------------------
// Serve with the export endpoint, open the page at 1920×1080, then in the console:
//
//   const s = document.createElement('script'); s.src = '/tools/export_frames.js'; document.head.appendChild(s);
//   TM_EXPORT.run(TM_EXPORT.peaks(), 'terrain_geology_timeline/peak')   // glacial + interglacial peaks
//   TM_EXPORT.run([[122000, 'dir/name.png', 'label']])                 // explicit list
//
// node tools/serve.js 8093 --export   (or the temanawa-export launch config) accepts the POSTs.
// Frames are the GROUND layer only (terrain, water, frost, haze), stamped with date, MIS, eustatic and
// relative sea level and the deep-time factors when a label is given. Snapshot at the PEAKS of the
// glacial cycle, not at the mid-swing boost stops: those hide the coast's breathing.
// Runs in the background; poll TM_EXPORT.done / TM_EXPORT.finished. Each frame takes a few seconds
// with the browser pane visible (much longer hidden). Never shipped: index.html does not load it.
// ============================================================
(function () {
  const X = {
    done: [], finished: false, _buf: null,

    // Morph to `y`, compose the ground into a 1920×1080 buffer, stamp it, POST it under exports/.
    async frame(y, path, label) {
      const g = game, T = g.terrain;
      DeepTime.yearsBP = y;
      T._morphFade = null; T.morphTo(y); T._morphFade = null;
      if (g.seasonManager && g.seasonManager.update) g.seasonManager.update(0);
      if (g.water && g.water.reconcile) g.water.reconcile(T, y);
      const projH = (typeof Projection !== 'undefined') ? Projection.projectedWorldHeight() : T.mapHeight;
      if (!X._buf) { X._buf = createGraphics(width, height); X._buf.pixelDensity(1); }
      const b = X._buf;
      g._composeTerrainLayer(b, projH);
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

    // Export a list in the background. Items are [y, path, label] or, with `prefix`, [y, label]
    // (named prefix_NN_<ka>ka.png).
    run(list, prefix) {
      X.done = []; X.finished = false;
      const items = prefix
        ? list.map(([y, label], i) => [y, prefix + '_' + String(i + 1).padStart(2, '0') + '_' + (y / 1000).toFixed(y % 1000 ? 1 : 0).replace('.', 'p') + 'ka.png', label])
        : list;
      (async () => {
        while (typeof game === 'undefined' || !game || !game.terrain || !game.terrain._geoCache) await new Promise(r => setTimeout(r, 500));
        if (typeof Kiosk !== 'undefined') Kiosk.watchdogSeconds = 1e9;   // a synchronous morph would trip the hard reload
        noLoop();
        for (const [y, p, l] of items) {
          try { X.done.push([p, await X.frame(y, p, l)]); } catch (e) { X.done.push([p, String(e && e.stack || e)]); }
        }
        X.finished = true;
      })();
      return 'started ' + items.length;
    }
  };
  window.TM_EXPORT = X;
})();
