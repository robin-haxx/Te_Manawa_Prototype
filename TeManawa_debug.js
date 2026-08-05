// ============================================================
// TE MANAWA — DEBUG OVERLAY  (press D)
// ------------------------------------------------------------
// A read-only instrument panel for the ecosystem. Nothing in here
// mutates the sim; it exists so the deep-time and ecology work in
// Phases 2-7 can be tuned against real numbers instead of guesses.
//
//   D          cycle: off -> compact -> full -> off
//   SHIFT+D    dump a JSON snapshot to the console
//
// Pages (full mode, laid out in two columns):
//   TIME       yearsBP, timeScale, season, snow/forest bands
//   FAUNA      per-species moa counts, age/sex split, hunger, eagles
//   FLORA      per-type plant counts, growth, dormant/suppressed
//   TERRAIN    grid, elevation histogram, biome areas
//   PERF       frame budget breakdown, entity/draw counts vs the caps
//   KIOSK      reset count and duration, idle countdown, error log
//
// Caps shown in PERF are the hard limits from TEMANAWA_BUILD_V3.md §5.2.
// A red value means the piece will not hold 60 fps on kiosk hardware.
// ============================================================

const Debug = {
  MODES: ['off', 'compact', 'full'],
  mode: 'off',

  get enabled() { return this.mode !== 'off'; },

  // ==========================================================
  // WHAT DEBUG MODE OWNS ON SCREEN
  // ----------------------------------------------------------
  // Three things used to be visible to visitors and are now debug-only,
  // because each was instrumentation wearing the costume of interpretation:
  //
  //   · the climate wave      a temperature graph. Nobody reads a curve at
  //                           arm's length in forty seconds, and it was the
  //                           busiest object in the frame. The climate is
  //                           supposed to be read off the LAND and the CAST
  //                           (findings #2 and #3) — a chart undercuts both
  //   · notification messages "A moa has hatched!" — engine chatter from the
  //                           game this used to be. An ambient diorama does
  //                           not narrate itself
  //   · the entity UI layer   hunger and breeding bars, hearts, pregnancy
  //                           dots, low-population rings, state glyphs. The
  //                           single strongest "this is a video game" signal
  //                           on screen, and most of it was never gated
  //
  // applyVisibility() is called whenever the mode changes and drives the
  // engine flags the renderers already check.
  // ==========================================================
  applyVisibility() {
    if (typeof CONFIG !== 'undefined') CONFIG.showEntityUI = this.enabled;
  },

  // Hard limits from TEMANAWA_BUILD_V3.md §5.2
  CAPS: {
    livePlants: 1000,
    liveFauna: 300,
    drawCalls: 1500,
    gridCells: 512 * 512,
    frameMs: 16.6
  },

  // rolling perf samples
  _updateMs: 0,
  _renderMs: 0,
  _updateAvg: 0,
  _renderAvg: 0,
  _sampleAlpha: 0.1,

  // cached aggregates — recomputed on an interval, not per frame, so the
  // overlay itself never becomes the thing that costs a frame
  _cache: null,
  _cacheAt: 0,
  _cacheEveryMs: 250,

  // ==========================================================
  // INPUT
  // ==========================================================
  handleKey(k) {
    if (k !== 'd' && k !== 'D') return false;
    if (k === 'D') { this.dump(); return true; }   // shift+d
    const i = this.MODES.indexOf(this.mode);
    this.mode = this.MODES[(i + 1) % this.MODES.length];
    this.applyVisibility();
    console.log('[Debug] mode:', this.mode);
    return true;
  },

  sample(updateMs, renderMs) {
    this._updateMs = updateMs;
    this._renderMs = renderMs;
    const a = this._sampleAlpha;
    this._updateAvg = this._updateAvg * (1 - a) + updateMs * a;
    this._renderAvg = this._renderAvg * (1 - a) + renderMs * a;
  },

  // ==========================================================
  // AGGREGATION
  // ==========================================================
  stats(g) {
    const now = millis();
    if (this._cache && now - this._cacheAt < this._cacheEveryMs) return this._cache;

    const sim = g.simulation, sm = g.seasonManager, t = g.terrain;
    const s = {
      time: {}, climate: {}, fauna: {}, flora: {}, terrain: {}, perf: {}, kiosk: {}
    };

    // ---- TIME + CLIMATE ------------------------------------
    const yr = (typeof DeepTime !== 'undefined') ? DeepTime.yearsBP : 0;
    const cl = (typeof Climate !== 'undefined') ? Climate.at(yr) : {};
    s.time = {
      yearsBP: yr,
      progress: DeepTime.progress(),
      playTime: g.playTime,
      timeScale: g.timeScale || 1,
      yrPerSec: (g.timeScale || 1) * DeepTime.yrPerSec,
      deep: DeepTime.isDeep(),
      windowSecs: DeepTime.windowSeconds(),
      season: sm ? (sm.currentKey || '?') : '?',
      snowLineSeason: sm && sm.getSnowLineElevation ? sm.getSnowLineElevation() : null,
      winterness: sm && sm.getWinterness ? sm.getWinterness() : 0,
      hungerMod: sm && sm.getHungerModifier ? sm.getHungerModifier() : 1
    };
    s.climate = {
      glacialIndex: cl.glacialIndex,
      stage: cl.stageName,
      mis: cl.mis,
      seaLevel: cl.seaLevel,
      snowLine: cl.snowLine,
      tempBias: cl.tempBias
    };

    // ---- FAUNA ---------------------------------------------
    const bySpecies = {};
    let alive = 0, juv = 0, adult = 0, female = 0, hungerSum = 0, pregnant = 0;
    const moas = (sim && sim.moas) || [];
    for (let i = 0; i < moas.length; i++) {
      const m = moas[i];
      if (!m || !m.alive) continue;
      alive++;
      const k = m.speciesKey || 'unknown';
      const rec = bySpecies[k] || (bySpecies[k] = { n: 0, juv: 0, f: 0, hunger: 0 });
      rec.n++;
      if (m.ageStage === 'adult') { adult++; } else { juv++; rec.juv++; }
      if (m.isFemale) { female++; rec.f++; }
      const h = m.hunger || 0;
      hungerSum += h; rec.hunger += h;
      if (m.isPregnant) pregnant++;
    }
    for (const k in bySpecies) {
      bySpecies[k].hunger = bySpecies[k].hunger / Math.max(1, bySpecies[k].n);
    }

    let eaglesAlive = 0, eaglesHunting = 0, eaglesDistracted = 0;
    const eagles = (sim && sim.eagles) || [];
    for (let i = 0; i < eagles.length; i++) {
      const e = eagles[i];
      if (!e || !e.alive) continue;
      eaglesAlive++;
      if (e.hunting) eaglesHunting++;
      if (e.distractedTimer > 0) eaglesDistracted++;
    }

    let eggsAlive = 0, eggsHatched = 0;
    const eggs = (sim && sim.eggs) || [];
    for (let i = 0; i < eggs.length; i++) {
      if (!eggs[i]) continue;
      if (eggs[i].alive) eggsAlive++;
      if (eggs[i].hatched) eggsHatched++;
    }

    s.fauna = {
      moa: alive, adult, juv, female, male: alive - female, pregnant,
      avgHunger: alive ? hungerSum / alive : 0,
      bySpecies,
      eagles: eaglesAlive, eaglesHunting, eaglesDistracted,
      eggs: eggsAlive, eggsHatched,
      predatorRatio: eaglesAlive ? (alive / eaglesAlive) : Infinity,
      stats: (sim && sim.stats) || {}
    };

    // ---- FLORA ---------------------------------------------
    const byType = {};
    let pAlive = 0, pDormant = 0, pSuppressed = 0, growthSum = 0, nutritionSum = 0;
    const plants = (sim && sim.plants) || [];
    for (let i = 0; i < plants.length; i++) {
      const p = plants[i];
      if (!p) continue;
      const k = p.type || 'unknown';
      const rec = byType[k] || (byType[k] = { n: 0, dormant: 0, suppressed: 0, growth: 0 });
      if (p.alive) {
        pAlive++; rec.n++;
        growthSum += p.growth || 0;
        rec.growth += p.growth || 0;
        nutritionSum += p.nutrition || 0;
      }
      if (p.dormant) { pDormant++; rec.dormant++; }
      if (p.suppressed) { pSuppressed++; rec.suppressed++; }
    }
    for (const k in byType) {
      byType[k].growth = byType[k].growth / Math.max(1, byType[k].n);
    }
    s.flora = {
      total: plants.length,
      alive: pAlive, dormant: pDormant, suppressed: pSuppressed,
      avgGrowth: pAlive ? growthSum / pAlive : 0,
      totalNutrition: nutritionSum,
      byType
    };

    // ---- TERRAIN -------------------------------------------
    const biomeArea = {};
    let elevMin = 1, elevMax = 0, elevSum = 0, cells = 0;
    if (t && t.heightMap) {
      const hm = t.heightMap, step = Math.max(1, (hm.length / 20000) | 0);
      for (let i = 0; i < hm.length; i += step) {
        const h = hm[i];
        if (h < elevMin) elevMin = h;
        if (h > elevMax) elevMax = h;
        elevSum += h; cells++;
      }
      if (t.biomeIndexMap && t.biomeList) {
        const bm = t.biomeIndexMap;
        for (let i = 0; i < bm.length; i += step) {
          const b = t.biomeList[bm[i]];
          const k = (b && (b.name || b.key)) || ('#' + bm[i]);
          biomeArea[k] = (biomeArea[k] || 0) + 1;
        }
      }
    }
    const sampled = Math.max(1, cells);
    for (const k in biomeArea) biomeArea[k] = biomeArea[k] / sampled;
    s.terrain = {
      grid: t ? `${t.mapWidth}x${t.mapHeight}` : '-',
      cells: t ? t.mapWidth * t.mapHeight : 0,
      elevMin, elevMax,
      elevMean: elevSum / sampled,
      biomeArea,
      viewZoom: CONFIG.viewZoom,
      // Footprint mode, and the share of the canvas the world actually covers.
      // 'square' on a 9:16 panel reads ~56% — that number is the whole argument
      // for 'fit'.
      fit: (t && t.fitMode) || CONFIG.terrainFit || 'square',
      noiseScale: t ? t.noiseScale : CONFIG.noiseScale,
      screenFill: (t && CONFIG.canvasWidth && CONFIG.canvasHeight)
        ? (t.mapWidth * CONFIG.viewZoom * t.mapHeight * CONFIG.viewZoom) /
          (CONFIG.canvasWidth * CONFIG.canvasHeight)
        : 1
    };

    // ---- PERF ----------------------------------------------
    const liveFauna = alive + eaglesAlive + eggsAlive;
    s.perf = {
      fps: (typeof currentFPS !== 'undefined') ? currentFPS : 0,
      updateMs: this._updateAvg,
      renderMs: this._renderAvg,
      totalMs: this._updateAvg + this._renderAvg,
      livePlants: pAlive,
      liveFauna,
      drawEstimate: pAlive + liveFauna,
      pixelDensity: (typeof pixelDensity === 'function') ? pixelDensity() : 1,
      canvas: `${CONFIG.canvasWidth}x${CONFIG.canvasHeight}`
    };

    // ---- KIOSK ---------------------------------------------
    if (typeof Kiosk !== 'undefined') {
      s.kiosk = {
        resets: Kiosk.resetCount,
        lastResetMs: Kiosk.lastResetMs_duration || 0,
        idleIn: Kiosk.idleSecondsRemaining(),
        errors: Kiosk.getErrorLog().length
      };
    }

    this._cache = s;
    this._cacheAt = now;
    return s;
  },

  dump() {
    const g = (typeof Kiosk !== 'undefined' && Kiosk.game) || null;
    if (!g) return;
    const s = this.stats(g);
    console.log('=== TE MANAWA ECOSYSTEM SNAPSHOT ===');
    console.log(JSON.stringify(s, null, 2));
    if (typeof Kiosk !== 'undefined') console.log('errors:', Kiosk.getErrorLog());
    return s;
  },

  // ==========================================================
  // RENDER
  // ==========================================================
  render(g, W, H) {
    if (!g || !g.simulation) return;
    const s = this.stats(g);
    this.renderClimateStrip(W);
    push();
    textFont('monospace');
    textAlign(LEFT, TOP);
    if (this.mode === 'compact') this._renderCompact(s, W, H);
    else this._renderFull(s, W, H);
    pop();
  },

  // ---- the climate wave, formerly on the visitor timeline ----
  // Drawn as a thin band just under the HUD strip so it lines up with the
  // timeline's x-axis and can be read against the playhead.
  // The curve is fixed for the life of the page, so it is sampled once.
  _wave: null,

  _waveCache(x0, w) {
    if (this._wave && this._wave.x0 === x0 && this._wave.w === w) return this._wave;
    const n = Math.max(64, Math.min(320, Math.round(w / 3)));
    this._wave = { x0, w, pts: Climate.sample(DeepTime.yearsStart, DeepTime.yearsEnd, n) };
    return this._wave;
  },

  renderClimateStrip(W) {
    const x0 = 48, w = W - 96;
    const top = InstallHUD.TOP_H + 4, h = 34;
    const wave = this._waveCache(x0, w);
    const yOf = (gi) => top + h - gi * h;
    const c = DeepTime.climate();

    push();
    noStroke(); fill(8, 14, 12, 210); rect(x0 - 8, top - 6, w + 16, h + 22, 5);

    // cold shading under the curve
    for (let i = 0; i < wave.pts.length - 1; i++) {
      const p = wave.pts[i];
      if (p.g < 0.5) continue;
      const a = (p.g - 0.5) * 2;
      const px1 = DeepTime.yearToX(p.yearsBP, x0, w);
      const px2 = DeepTime.yearToX(wave.pts[i + 1].yearsBP, x0, w);
      fill(120, 165, 210, 60 * a);
      rect(px1, yOf(p.g), Math.max(1, px2 - px1), top + h - yOf(p.g));
    }

    noFill(); stroke(150, 185, 205, 220); strokeWeight(1.5);
    beginShape();
    for (const p of wave.pts) vertex(DeepTime.yearToX(p.yearsBP, x0, w), yOf(p.g));
    endShape();

    // glacial markers — climate instrumentation, so they live here now
    textFont('monospace'); textSize(9); textAlign(CENTER, TOP);
    for (const m of DEEP_TIME_MARKERS) {
      if (m.kind === 'eruption') continue;
      const mx = DeepTime.yearToX(m.yearsBP, x0, w);
      stroke(130, 175, 215, 150); strokeWeight(1); line(mx, top, mx, top + h);
      noStroke(); fill(130, 175, 215, 190); text(m.label, mx, top + h + 2);
    }

    // playhead riding the curve, plus the stage readout
    const px = DeepTime.yearToX(DeepTime.yearsBP, x0, w);
    stroke(255, 210, 120, 150); strokeWeight(1); line(px, top, px, top + h);
    noStroke(); fill(255, 210, 120); circle(px, yOf(c.glacialIndex), 5);

    const col = this._climateColour(c.glacialIndex);
    fill(col[0], col[1], col[2]); textAlign(LEFT, TOP); textSize(10);
    text(c.stageName + (c.mis ? '  ' + c.mis : '') + '   g=' + c.glacialIndex.toFixed(2),
         x0, top + h + 2);
    fill(110, 135, 125); textAlign(RIGHT, TOP);
    text('sea ' + c.seaLevel.toFixed(0) + 'm', x0 + w, top + h + 2);
    pop();
  },

  _panel(x, y, w, h) {
    noStroke(); fill(8, 14, 12, 232);
    rect(x, y, w, h, 6);
    noFill(); stroke(60, 110, 90, 180); strokeWeight(1);
    rect(x, y, w, h, 6);
    noStroke();
  },

  _renderCompact(s, W, H) {
    const w = 300, h = 146, x = 12, y = InstallHUD.TOP_H + 68;  // under the climate strip
    this._panel(x, y, w, h);
    let ty = y + 8;
    const line = (label, val, col) => {
      fill(120, 150, 135); textSize(10); text(label, x + 10, ty);
      fill(col || [225, 240, 232]); textAlign(RIGHT, TOP);
      text(val, x + w - 10, ty); textAlign(LEFT, TOP);
      ty += 14;
    };
    fill(255, 210, 120); textSize(11);
    text('DEBUG — compact   [D] more', x + 10, ty); ty += 18;
    line('yearsBP', Math.round(s.time.yearsBP).toLocaleString());
    line('climate', `${s.climate.stage}  ${s.climate.glacialIndex.toFixed(2)}`,
         this._climateColour(s.climate.glacialIndex));
    line('season / scale', `${s.time.season}  x${s.time.timeScale.toFixed(1)}`);
    line('moa / eagles', `${s.fauna.moa} / ${s.fauna.eagles}`);
    line('plants alive', `${s.flora.alive}`, this._capColour(s.flora.alive, this.CAPS.livePlants));
    line('fps / frame', `${s.perf.fps.toFixed(0)} / ${s.perf.totalMs.toFixed(1)}ms`,
         this._capColour(s.perf.totalMs, this.CAPS.frameMs));
  },

  _renderFull(s, W, H) {
    const colW = Math.min(330, (W - 48) / 2);
    const x1 = 12, x2 = W - colW - 12;
    const top = InstallHUD.TOP_H + 68;   // under the climate strip

    const y1 = this._section(x1, top, colW, 'TIME', [
      ['yearsBP',      Math.round(s.time.yearsBP).toLocaleString()],
      ['progress',     (s.time.progress * 100).toFixed(1) + '%'],
      ['timeScale',    'x' + s.time.timeScale.toFixed(2),
                       s.time.deep ? [255, 210, 120] : null],
      ['sim yr/sec',   Math.round(s.time.yrPerSec).toLocaleString()],
      ['window',       (s.time.windowSecs / 60).toFixed(1) + ' min'],
      ['glacial phase', s.time.season],
      ['glacial idx',   s.time.winterness.toFixed(2)],
      ['hungerMod',     s.time.hungerMod.toFixed(2)]
    ]);

    this._section(x1, y1 + 10, colW, 'CLIMATE', [
      ['glacialIndex', s.climate.glacialIndex.toFixed(3),
                       this._climateColour(s.climate.glacialIndex)],
      ['stage',        s.climate.stage, this._climateColour(s.climate.glacialIndex)],
      ['MIS',          s.climate.mis || '-'],
      ['sea level',    s.climate.seaLevel.toFixed(0) + ' m'],
      ['snow line',    s.climate.snowLine.toFixed(3)],
      ['temp bias',    s.climate.tempBias.toFixed(1) + ' C']
    ]);

    const faunaRows = [
      ['moa alive',    String(s.fauna.moa)],
      ['adult / juv',  `${s.fauna.adult} / ${s.fauna.juv}`],
      ['F / M',        `${s.fauna.female} / ${s.fauna.male}`],
      ['pregnant',     String(s.fauna.pregnant)],
      ['avg hunger',   s.fauna.avgHunger.toFixed(1)],
      ['eggs',         `${s.fauna.eggs} (${s.fauna.eggsHatched} hatched)`],
      ['eagles',       `${s.fauna.eagles}  hunt ${s.fauna.eaglesHunting}  dis ${s.fauna.eaglesDistracted}`],
      ['prey:pred',    isFinite(s.fauna.predatorRatio) ? s.fauna.predatorRatio.toFixed(1) + ':1' : '-'],
      ['births/deaths', `${s.fauna.stats.births || 0} / ${s.fauna.stats.deaths || 0}`],
      ['starvations',  String(s.fauna.stats.starvations || 0)]
    ];
    for (const k in s.fauna.bySpecies) {
      const r = s.fauna.bySpecies[k];
      faunaRows.push(['· ' + this._short(k), `${r.n}  j${r.juv} f${r.f}  h${r.hunger.toFixed(0)}`]);
    }
    const y2 = this._section(x1, top + 262, colW, 'FAUNA', faunaRows);

    const floraRows = [
      ['alive / total',  `${s.flora.alive} / ${s.flora.total}`],
      ['dormant',        String(s.flora.dormant)],
      ['suppressed',     String(s.flora.suppressed)],
      ['avg growth',     s.flora.avgGrowth.toFixed(2)],
      ['nutrition',      Math.round(s.flora.totalNutrition).toLocaleString()]
    ];
    for (const k in s.flora.byType) {
      const r = s.flora.byType[k];
      floraRows.push(['· ' + this._short(k),
        `${r.n}  g${r.growth.toFixed(2)}${r.dormant ? '  d' + r.dormant : ''}${r.suppressed ? '  s' + r.suppressed : ''}`]);
    }
    this._section(x2, top, colW, 'FLORA', floraRows);

    const terrRows = [
      ['fit mode',    s.terrain.fit + '  (SHIFT+F)'],
      ['grid',        s.terrain.grid],
      ['cells',       s.terrain.cells.toLocaleString(),
                      this._capColour(s.terrain.cells, this.CAPS.gridCells)],
      ['screen fill', (s.terrain.screenFill * 100).toFixed(0) + '%'],
      ['noiseScale',  s.terrain.noiseScale.toFixed(5)],
      ['elev min/max', `${s.terrain.elevMin.toFixed(2)} / ${s.terrain.elevMax.toFixed(2)}`],
      ['elev mean',   s.terrain.elevMean.toFixed(3)],
      ['viewZoom',    s.terrain.viewZoom ? s.terrain.viewZoom.toFixed(3) : '-']
    ];
    for (const k in s.terrain.biomeArea) {
      terrRows.push(['· ' + this._short(k), (s.terrain.biomeArea[k] * 100).toFixed(1) + '%']);
    }
    const y3 = this._section(x2, top + 12 + (floraRows.length + 1) * 14 + 14, colW, 'TERRAIN', terrRows);

    this._section(x1, y2 + 12, colW, 'PERF', [
      ['fps',          s.perf.fps.toFixed(1),
                       this._capColour(this.CAPS.frameMs, 1000 / Math.max(1, s.perf.fps))],
      ['update',       s.perf.updateMs.toFixed(2) + 'ms'],
      ['render',       s.perf.renderMs.toFixed(2) + 'ms'],
      ['frame total',  s.perf.totalMs.toFixed(2) + ' / 16.6ms',
                       this._capColour(s.perf.totalMs, this.CAPS.frameMs)],
      ['live plants',  `${s.perf.livePlants} / ${this.CAPS.livePlants}`,
                       this._capColour(s.perf.livePlants, this.CAPS.livePlants)],
      ['live fauna',   `${s.perf.liveFauna} / ${this.CAPS.liveFauna}`,
                       this._capColour(s.perf.liveFauna, this.CAPS.liveFauna)],
      ['draws (est)',  `${s.perf.drawEstimate} / ${this.CAPS.drawCalls}`,
                       this._capColour(s.perf.drawEstimate, this.CAPS.drawCalls)],
      ['grid cells',   `${s.terrain.cells.toLocaleString()} / ${this.CAPS.gridCells.toLocaleString()}`,
                       this._capColour(s.terrain.cells, this.CAPS.gridCells)],
      ['pixelDensity', String(s.perf.pixelDensity),
                       s.perf.pixelDensity > 1 ? [255, 120, 110] : [150, 230, 170]],
      ['canvas',       s.perf.canvas]
    ]);

    if (s.kiosk && s.kiosk.resets !== undefined) {
      this._section(x2, y3 + 12, colW, 'KIOSK', [
        ['soft resets',  String(s.kiosk.resets)],
        ['last reset',   s.kiosk.lastResetMs.toFixed(1) + 'ms',
                         this._capColour(s.kiosk.lastResetMs, 25)],
        ['attract in',   s.kiosk.idleIn.toFixed(0) + 's'],
        ['errors logged', String(s.kiosk.errors),
                         s.kiosk.errors ? [255, 120, 110] : [150, 230, 170]]
      ]);
    }

    fill(90, 120, 105); textSize(9); textAlign(LEFT, BOTTOM);
    text('[D] cycle  ·  [SHIFT+D] console snapshot', 14, H - InstallHUD.BOT_H - 8);
  },

  // Draws a titled key/value block; returns the y coordinate of its bottom edge.
  _section(x, y, w, title, rows) {
    const h = 26 + rows.length * 14 + 8;
    this._panel(x, y, w, h);
    fill(255, 210, 120); textSize(11);
    text(title, x + 10, y + 8);
    let ty = y + 26;
    for (const r of rows) {
      fill(115, 145, 130); textSize(10);
      text(r[0], x + 10, ty);
      fill(r[2] || [225, 240, 232]);
      textAlign(RIGHT, TOP);
      text(r[1], x + w - 10, ty);
      textAlign(LEFT, TOP);
      ty += 14;
    }
    return y + h;
  },

  // green under half the cap, amber approaching it, red over.
  _capColour(value, cap) {
    const r = value / cap;
    if (r > 1)   return [255, 110, 100];
    if (r > 0.7) return [255, 200, 110];
    return [150, 230, 170];
  },

  // warm -> cold. Lightness carries it as well as hue, so it survives
  // colourblindness — same rule the timeline uses.
  _climateColour(gi) {
    if (gi < 0.25) return [170, 215, 160];
    if (gi < 0.50) return [215, 215, 165];
    if (gi < 0.75) return [155, 195, 225];
    return [125, 180, 240];
  },

  _short(k) {
    return String(k).replace(/_/g, ' ').slice(0, 18);
  }
};
