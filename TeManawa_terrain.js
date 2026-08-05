// ============================================================================
// LOOK — the terrain look-development control surface (bake-time)
// md/TEMANAWA_34VIEW_PLAN.md §7
// ============================================================================
// Every knob for the "pixel topo map → cartoon illustration" ground, in ONE place.
// All of it is applied during the season bake, never per frame.
//
// FAST ITERATION — no page reload: tweak a knob in the console (e.g. LOOK.shadeStrength,
// LOOK.outlines = false, Projection.K for the 3/4 tilt), then press B to re-bake in place
// (same land, no ecosystem reset). LOOK.dump() prints current settings; each toggle
// isolates one move. Full workflow: md/TEMANAWA_DEVTOOLS.md.
const LOOK = {
  // ---- on / off — flip a move off to see what it does ----
  posterize: true,   // flat cel tones (vs a smooth gradient ramp)
  wobble:    true,   // biome borders wander like a brush (vs clean elevation bands)
  outlines:  true,   // ink stroke along biome boundaries (replaces contour lines)
  shore:     true,   // pale stroke at the water's edge
  shade:     true,   // slope shading of the lit tops
  haze:      true,   // atmospheric fade in the sky above the far ridge
  quiet:     true,   // desaturate the ground so the outlined sprites read first
  reliefEdge: false,  // bold dark outline along relief steps/cliff tops (like the sprite outlines)
  smoothScale: true, // display-time: anti-alias the baked ground as it scales to the panel.
                     //   true  = the supersampled bake is minified WITH smoothing, so ink AND
                     //           fill anti-alias together into edges that follow curves
                     //   false = crisp nearest-neighbour = the chunky pixel look (pair w/ bakeScale 2)

  // ---- amounts (used only when the matching toggle is on) ----
  wobbleAmp:     0.05,  // border wander, in elevation units
  wobbleFreq:    0.12,   // spatial frequency of the wander
  quietSat:      0.16,   // 0 = full colour ground, 1 = greyscale
  quietContrast: 0.92,   // <1 compresses ground contrast toward mid-grey
  shadeStrength: 50.0,   // slope-shading gain (feeds the cel bands below)
  shadeSteps:    3,      // CEL bands: 0/1 = smooth gradient, 2–4 = flat toon steps (match the sprites)
  shadeShadow:   0.68,   // darkest cel band (shadow side) — multiplier on the ground colour
  shadeHigh:     1.22,   // lightest cel band (NW-lit highlight) — multiplier
  bakeScale:     3,      // SUPERSAMPLE factor: bake the ground at N× the sim grid. render() draws
                         //   it under the 2.5× camera, so N>2.5 MINIFIES it — that downsample is
                         //   what anti-aliases ink+fill into curves (needs smoothScale). 3 is the
                         //   sweet spot. Higher is sharper but memory grows as N² and is HARD-CAPPED
                         //   by bakeMaxPixels below (a kiosk must never OOM), so raising it may no-op.
  bakeMaxPixels: 2200000,// per-season-buffer pixel cap: bakeScale auto-reduces so a bake buffer never
                         //   exceeds this (there are 4 of them). Guards the OOM at large grids / high
                         //   bakeScale — esp. Firefox, which is stricter than the Chrome kiosk. Press B.
  hazeStrength:  1,         // north-atmosphere overlay opacity at the top edge (0..1) — tune live, press B
  hazeHeight:    0.45,   // how far down the map the atmosphere fades (fraction of height)
  outlineJitter: .25,   // hand-inked lineweight variation on the boundary ink (0 = uniform)
  rangeRelief:   0.50,  // geo ranges: valley depth vs crest (0 = flat plateau; ~0.5 = deep forested valleys = mountain variation). Regenerate to apply.
  rangeSpine:    0.45,  // geo ranges: crest concentration along the range's long (NE–SW) axis (0 = flat poly plateau; 1 = sharp central spine, flanks fall to foothills). Regenerate to apply.
  riverWobble:   0.02,  // geo river: per-seed lateral meander off the SVG path (0 = follow it exactly)
  riverIncise:   0.06,  // geo river: bed sits this far below the LOCAL ground (0..1 elevation), not down to sea level. Bounds the plunge crossing it. Regenerate (G/N) to apply.
  riverSeaLevel: 0.04,  // geo river: the bed only sinks to this (the sea band) where the land is already near it — the coast. Upstream it rides the terrain. Regenerate to apply.
  riverWaterT:   0.55,  // geo river: mask ≥ this reads as open WATER — the (narrow) blue thread. Raise = narrower water. Regenerate to apply (paint + walkability).
  riverBankT:    0.22,  // geo river: mask in [riverBankT, riverWaterT) reads as exposed RIVERBED / bank (sandy shingle, walkable) framing the water. Lower = wider bed. Regenerate to apply.
  coastEase:     1.4,   // coast: land-rise exponent off the shore (>1 = gentle shelf/beach; <1 = the old steep cliff). Tames harsh coastal drops. Higher is gentler but widens the near-sea-level zone (softer waterline); pull toward ~1.1 if the coastline reads mushy. Regenerate to apply.
  coastSmooth:   1,     // coast: light smoothing passes over the low-elevation shelf ONLY (0 = off) — clears waterline speckle and blocky relief steps without touching plains or ranges. Regenerate to apply.
  riverFrontJitter: 0.07, // geo river: low-freq wander of the emerging tip so the growing river tapers off naturally instead of ending on a straight line. Regenerate to apply.
  riverEdgeNoise: 0.007,  // geo river: HIGH-frequency wobble on the channel edge (world frac) — breaks the authored polyline's smooth banks into a natural ragged waterline. Cached with the distance field, so it costs nothing per frame. 0 = off. Regenerate to apply.
  riverEdgeFreq:  26,     // geo river: spatial frequency of the edge noise. Higher = choppier banks.
  tribHighlandThin: 1.6,  // tributaries: how fast the painted WATER/BED thins with elevation above the lowland (0.30). High ground carries only a thread (or bare gully) — a stream running downhill — instead of band-water and beaches perched on a ridge. 0 = off.
  straitWidthMult: 3.0,   // main river is this many times wider at ~1 Ma (the Manawatū Strait). Narrows to 1× by straitCloseTo. Regenerate to apply.
  seaRise:       0.20,  // EMERGENCE (deep time): at ~1 Ma the basin is a shallow-marine embayment. The flood is water RISING (attenuated by elevation, see seaFloodCeil), not the ground sinking, scaled by submergence and easing to 0 (present shoreline) by GEO_EPOCHS.emergeTo (~0.5 Ma). Tune live (press B/G/N).
  seaFloodCeil:  0.42,  // EMERGENCE reach: the flood's lowering fades to nothing at this elevation — ground above it never submerges, so the eastern uplands stay legible land at 1 Ma instead of the whole map reading as a grey flood. Lower = flood hugs the coast; higher = deeper inundation. Tune live (press B/G/N).

  // ---- colours ----
  hazeColor:    '#20303a', // uniform tone the sky fades to (keeps the top streak-free)
  outlineColor: '#16210f', // fallback boundary ink (a biome's own `outlineColor` wins)
  shoreColor:   '#eee9b9', // shoreline stroke
  reliefEdgeColor: '#d9b525', // bold dark outline on relief steps (matches the sprite ink)

  dump() { const o = {}; for (const k in this) if (typeof this[k] !== 'function') o[k] = this[k]; console.log('[LOOK]', o); return o; }
};

// ============================================
// TERRAIN GENERATOR - Pre-baked seasonal buffers
// Zero computation during season transitions
// ============================================
class TerrainGenerator {
  constructor(config, biomes) {
    this.config = config;
    this.biomes = biomes;
    this.biomeList = Object.values(biomes).sort((a, b) => a.minElevation - b.minElevation);
    this.seed = random(10000);
    
    // Typed arrays
    this.heightMap = null;
    this.biomeIndexMap = null;
    this.biomeArray = null;
    
    // Pre-baked buffers, one per GLACIAL PHASE (created once at generation). These
    // are the four points the deep-time glacial index blends between — not seasons.
    this.seasonBuffers = {
      interglacial: null,
      cooling:      null,
      glacial:      null,
      fullGlacial:  null
    };

    // Snow line per glacial phase. Spans the full glacial range (Climate.snowLineWarm
    // 0.92 → snowLineCold 0.55): snow only caps the peaks in an interglacial and
    // reaches well down the ranges at full glacial.
    this.seasonSnowLines = {
      interglacial: 0.92,
      cooling:      0.80,
      glacial:      0.67,
      fullGlacial:  0.55
    };

    // Allow level-specific snow lines
    if (config.seasonSnowLines) {
      Object.assign(this.seasonSnowLines, config.seasonSnowLines);
    }
      
    // Season manager reference
    this.seasonManager = null;
    
    // Dimensions — see TerrainGenerator.gridFor(). Two modes:
    //   'square'  Phase 1.5 behaviour. A fixed CONFIG.mapGrid square, letterboxed
    //             into the screen via CONFIG.viewX/viewY/viewZoom.
    //   'fit'     the grid takes the screen's aspect at a constant cell COUNT, so
    //             it fills the panel edge to edge and costs the same either way.
    // CONFIG.mapGrid is the one number that governs simulation cost — see
    // TEMANAWA_BUILD_V3.md §5.2 (hard limit: 256).
    const zoom = config.zoom || 1;
    const fit = TerrainGenerator.gridFor(config);

    this.mapWidth = fit.cols;
    this.mapHeight = fit.rows;
    this.worldWidth = fit.cols * zoom;
    this.worldHeight = fit.rows * zoom;
    this.zoom = zoom;

    // Effective noise frequency. Held on the instance rather than written back
    // to CONFIG so the authored value never drifts across regenerations — 'fit'
    // rescales it so a landform keeps the same apparent size on screen.
    this.noiseScale = fit.noiseScale;
    this.fitMode = fit.mode;
    this.fitAspect = fit.aspect;

    this.scale = config.pixelScale;
    this.invScale = 1 / config.pixelScale;
    this.gridCols = Math.ceil(this.mapWidth * this.invScale);
    this.gridRows = Math.ceil(this.mapHeight * this.invScale);

    // Geography skeleton (SVG-authored via tools/svg2geo.js). Optional: if present,
    // the base noise field is reshaped by it — ranges lift, the river carves — and
    // both scale with deep time. md/TEMANAWA_GEOGRAPHY.md.
    this.geo = config.geo || (typeof TE_MANAWA_GEO !== 'undefined' ? TE_MANAWA_GEO : null);
    this._geoRanges = []; this._geoRivers = [];
    this._geoT = { uplift: 1, incision: 1, emergence: 1, submergence: 0 };   // 1 = mature (present); set from yearsBP in generate()
    this._baseNoise = null;                     // seed field, cached so morphTo() need not re-run noise
    this._geoBaseCeil = (config.geoBaseCeil != null) ? config.geoBaseCeil : 0.5;  // with a skeleton, compress the procedural base below this so RANGES own the highs
    this._geoEdgeMargin = (config.geoEdgeMargin != null) ? config.geoEdgeMargin : 0.10;  // ease terrain down to plains within this fraction of the N/S edges (kills the 3/4 edge smear); 0 disables
    this._geoCache = null;                      // per-footprint distance/noise field; morphTo() re-applies only the time factors
    this._bakeScaleOverride = null;             // morph re-bakes use a reduced bakeScale (set transiently)

    // Incremental morph (see morphBegin/morphStep). The job spreads a morph
    // re-bake across frames so the visitor path never hitches; the pool holds
    // retired back buffers for reuse (created once, recycled every morph); the
    // fade crossfades the freshly baked land in over >=500 ms (photosensitivity
    // budget, TEMANAWA_BUILD_V3.md §5.2).
    this._morphJob = null;
    this._morphFade = null;
    this._bufPool = [];

    // Time-INDEPENDENT wobble noise fields (biome-border wander). The wobble
    // depends only on seed / frequency / footprint, never on yearsBP, so the
    // morph path re-reads these caches instead of re-running ~1M+ noise()
    // calls per re-bake for identical results.
    this._simWob = null;   this._simWobKey = '';
    this._paintWob = null; this._paintWobKey = '';
    
    this._initBiomeIndex();
    this._colorCache = new Map();
    this._snowColorsRGB = null;
  }

  // ============================================
  // GRID FOOTPRINT — 'square' | 'fit'
  // ============================================
  // Pure, static and p5-free, so tools/bootcheck.js can assert against it
  // directly without booting the sketch.
  //
  // 'square' is the Phase 1.5 behaviour: a CONFIG.mapGrid square letterboxed
  // into whatever the panel happens to be. On the 9:16 kiosk that throws away
  // ~44% of the screen.
  //
  // 'fit' keeps the CELL COUNT constant and spends it on the screen's aspect
  // instead:
  //
  //     cols = grid·√a     rows = grid/√a      a = canvasWidth / canvasHeight
  //
  // so cols·rows ≈ grid² at every aspect. On 1080×1920 that is 384×682 =
  // 261,888 cells against 512² = 262,144 — the same simulation cost, no
  // letterbox. This matters because mapGrid is the number every per-cell
  // system scales on (the pixel bake now, Phase 4's four Float32Array fields
  // next), so a fill mode that grew the grid with the aspect would silently
  // blow the §5.2 budget on a tall panel.
  //
  // Two consequences worth knowing:
  //   · Cells are smaller in screen terms on the short axis, so noiseScale is
  //     rescaled by the zoom ratio to hold apparent landform size constant.
  //     Without this, 'fit' looks like a different level rather than the same
  //     level shaped to the screen.
  //   · Beyond terrainFitMaxStretch the aspect is clamped and the remainder
  //     letterboxes again. A 3:1 video wall should not get a 3:1 world — the
  //     coastline banding in getIslandFalloff() runs along the X axis and
  //     stops reading past about 2:1.
  static gridFor(config) {
    const grid = config.mapGrid || 256;
    const ns = config.noiseScale;

    if (config.terrainFit !== 'fit') {
      return { cols: grid, rows: grid, noiseScale: ns, aspect: 1, mode: 'square' };
    }

    const cw = config.canvasWidth || grid;
    const ch = config.canvasHeight || grid;
    const maxStretch = config.terrainFitMaxStretch || 2.0;

    let aspect = cw / Math.max(1, ch);
    aspect = Math.max(1 / maxStretch, Math.min(maxStretch, aspect));

    // Even dimensions keep the pixel bake's row strides tidy.
    const r = Math.sqrt(aspect);
    const cols = Math.max(64, Math.round(grid * r / 2) * 2);
    const rows = Math.max(64, Math.round(grid / r / 2) * 2);

    // Hold apparent feature size on screen constant against the square
    // reference: featurePx = (1/noiseScale) · viewZoom, so noiseScale scales
    // by the ratio of the two view zooms.
    const zFit = Math.min(cw / cols, ch / rows);
    const zSquare = Math.min(cw, ch) / grid;
    const noiseScale = (zSquare > 0) ? ns * (zFit / zSquare) : ns;

    return { cols, rows, noiseScale, aspect, mode: 'fit' };
  }

  _initBiomeIndex() {
    this.biomeArray = this.biomeList.slice();
    this.biomeIndexByKey = {};
    for (let i = 0; i < this.biomeArray.length; i++) {
      this.biomeIndexByKey[this.biomeArray[i].key] = i;
    }
    
    // Cache commonly-needed biome roles by scanning properties
    // instead of assuming fixed keys exist
    this._waterBiome = null;
    this._snowBiome = null;
    this._fallbackBiome = null;
    this._bedBiome = null;

    for (const biome of this.biomeList) {
      // Water: the lowest non-walkable biome, or anything flagged isWater
      if (biome.isWater || (!biome.walkable && biome.maxElevation <= 0.15)) {
        if (!this._waterBiome || biome.minElevation < this._waterBiome.minElevation) {
          this._waterBiome = biome;
        }
      }
      // Riverbed / bank: the lowest WALKABLE band (the sandy coast) — reused to frame the
      // river with exposed shingle so the water reads narrower and sits in a bed.
      if (biome.walkable && (!this._bedBiome || biome.minElevation < this._bedBiome.minElevation)) {
        this._bedBiome = biome;
      }
      // Snow: highest biome
      if (biome.key === 'snow' || biome.minElevation >= 0.85) {
        this._snowBiome = biome;
      }
      // Fallback: first walkable biome with plants
      if (!this._fallbackBiome && biome.walkable && biome.canHavePlants) {
        this._fallbackBiome = biome;
      }
    }
    
    // If no water biome found, use the lowest biome
    if (!this._waterBiome) {
      this._waterBiome = this.biomeList[0];
    }
    // If no snow biome, disable snow features
    // _snowBiome can stay null — we'll check before using
    // If no fallback, use the middle biome
    if (!this._fallbackBiome) {
      this._fallbackBiome = this.biomeList[Math.floor(this.biomeList.length / 2)];
    }
  }
  
  setSeasonManager(manager) {
    this.seasonManager = manager;
  }
  
  _initSnowColors() {
    if (!this._snowBiome) return;
    this._snowColorsRGB = this._snowBiome.colors.map(hex => {
      const c = this._getCachedColor(hex);
      return [red(c), green(c), blue(c)];
    });
  }
  
  getSnowLineElevation() {
    if (!this._snowBiome) return 1.0; // No snow in this level
    if (!this.seasonManager) {
      return this._snowBiome.minElevation;
    }
    
    const currentLine = this.seasonSnowLines[this.seasonManager.currentKey];
    const progress = this.seasonManager.transitionProgress;
    
    if (progress > 0) {
      const nextLine = this.seasonSnowLines[this.seasonManager.nextKey];
      return lerp(currentLine, nextLine, progress);
    }
    
    return currentLine;
  }
  
  isSeasonalSnow(elevation) {
    return elevation >= this.getSnowLineElevation();
  }
  
  getSnowCoverage(elevation) {
    if (!this._snowBiome) return 0;
    const snowLine = this.getSnowLineElevation();
    const permanentSnowLine = this._snowBiome.minElevation;
    
    if (elevation >= permanentSnowLine) return 1.0;
    if (elevation >= snowLine) {
      const range = permanentSnowLine - snowLine;
      if (range <= 0) return 1.0;
      return 0.4 + ((elevation - snowLine) / range) * 0.6;
    }
    return 0;
  }
  
  // ============================================
  // COORDINATE HELPERS
  // ============================================
  
  isInBounds(x, y) {
    return x >= 0 && x < this.mapWidth && y >= 0 && y < this.mapHeight;
  }
  
  clampToBounds(x, y) {
    return {
      x: Math.max(0, Math.min(this.mapWidth - 1, x)),
      y: Math.max(0, Math.min(this.mapHeight - 1, y))
    };
  }
  
  getRandomPosition(padding = 0) {
    return {
      x: padding + random() * (this.mapWidth - padding * 2),
      y: padding + random() * (this.mapHeight - padding * 2)
    };
  }
  
  // ============================================
  // NOISE GENERATION (unchanged)
  // ============================================
  
  fractalNoise(x, y) {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;
    
    // Instance value, not this.config.noiseScale — 'fit' mode rescales it.
    const noiseScale = this.noiseScale;
    const seed = this.seed;
    const persistence = this.config.persistence;
    const lacunarity = this.config.lacunarity;
    const octaves = this.config.octaves;
    
    for (let i = 0; i < octaves; i++) {
      total += noise(x * frequency * noiseScale + seed,
                     y * frequency * noiseScale + seed) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }
    return total / maxValue;
  }
  
  ridgeNoise(x, y) {
    const n = this.fractalNoise(x * 0.5, y * 0.5);
    return 1 - Math.abs(n * 2 - 1);
  }
  
  getIslandFalloff(x, y) {
    const nx = x / this.mapWidth;
    const ny = y / this.mapHeight;
    
    const warpX = noise(x * 0.01 + this.seed, y * 0.01) * 0.2;
    const warpY = noise(x * 0.01 + this.seed * 2, y * 0.01 + this.seed) * 0.2;
    
    const warpedNx = nx + warpX - 0.1;
    const warpedNy = ny + warpY - 0.1;
    
    let coastNoise = 0;
    coastNoise += noise(warpedNy * 1.5 + this.seed, this.seed * 0.5) * 0.4;
    coastNoise += noise(warpedNy * 3 + this.seed * 1.5, warpedNx * 0.5) * 0.2;
    coastNoise += noise(x * 0.02 + this.seed * 2, y * 0.02 + this.seed * 2) * 0.1;
    
    const coastlinePosition = 0.02 + coastNoise * 0.4;
    
    let falloff;
    if (warpedNx < coastlinePosition) {
      const seaDepth = (coastlinePosition - warpedNx) / coastlinePosition;
      falloff = (1 - seaDepth) * 0.12;
    } else {
      const landProgress = (warpedNx - coastlinePosition) / (1 - coastlinePosition);
      // Ease the land UP off the shore. Exponent > 1 is convex — flat beach/shelf at the
      // waterline rising gradually inland — so the coast no longer drops as a cliff (the
      // old 0.7 was concave: a steep wall right at the shore). LOOK.coastEase tunes it.
      const coastEase = (typeof LOOK !== 'undefined' && LOOK.coastEase != null) ? LOOK.coastEase : 1.4;
      falloff = 0.13 + Math.pow(landProgress, coastEase) * 0.87;
      const ridgeNoise = noise(x * 0.012 + this.seed * 4, y * 0.012) * 0.2;
      falloff += ridgeNoise * landProgress;
    }
    
    const edgeSoftness = Math.pow(Math.sin(ny * Math.PI), 0.3);
    falloff *= 0.6 + edgeSoftness * 0.4;
    
    return Math.max(0, Math.min(1, falloff));
  }
  
  getElevation(x, y) {

    // changing falloff
    const base = this.fractalNoise(x, y);
    const ridge = this.ridgeNoise(x, y);
    let elevation = base * (1 - this.config.ridgeInfluence) + ridge * this.config.ridgeInfluence;
    // ridgeInfluence > 1 EXTRAPOLATES (the scaffold authors 1.4), so this blend
    // can dip below zero where the ridge term is small — and pow(negative,
    // fractional) is NaN. The Math.max(0, Math.min(1, NaN)) clamp below stays
    // NaN, and a NaN cell silently falls through getBiomeFromElevation to the
    // LAST band. Clamp before the pow. (Found by the harness's morph identity
    // check: NaN !== NaN flagged the cells.)
    if (elevation < 0) elevation = 0;
    elevation = Math.pow(elevation, this.config.elevationPower);
      
    if (this.config.useLakes) {
      // Inland terrain: no coastal falloff
      // Instead, create lake basins by depressing low areas further
      elevation = this._applyLakeBasins(x, y, elevation);
    } else {
      // Original coastal island behavior
      const falloff = this.getIslandFalloff(x, y);
      elevation *= falloff;
    }
    // With a geography skeleton, the RANGES own the high ground: soft-compress the
    // procedural base above a lowland/forest ceiling so noise no longer throws
    // alpine across the whole east. Ranges lift above this in _applyGeo.
    if (this.geo) elevation = TerrainGenerator._compressBase(elevation, this._geoBaseCeil);
    return Math.max(0, Math.min(1, elevation));
  }

  // One-time light smoothing of the coastal SHELF in the base field: blend each low cell
  // toward its 3×3 neighbourhood, strongest at sea level and fading to nothing by ~0.28
  // (grassland), so the waterline/beach loses its speckle and blocky relief steps while the
  // plains and ranges stay crisp. Runs once per generate on the CACHED base field, so it
  // never diverges the sync vs sliced morph. LOOK.coastSmooth = pass count (0 = off).
  _smoothCoast(arr, gc, gr) {
    const strength = (typeof LOOK !== 'undefined' && LOOK.coastSmooth != null) ? LOOK.coastSmooth : 0;
    if (!(strength > 0)) return;
    const hi = 0.28;
    if (!this._coastTmp || this._coastTmp.length !== arr.length) this._coastTmp = new Float32Array(arr.length);
    const tmp = this._coastTmp;
    const passes = Math.max(1, Math.round(strength));
    for (let p = 0; p < passes; p++) {
      tmp.set(arr);
      for (let row = 0; row < gr; row++) {
        for (let col = 0; col < gc; col++) {
          const i = row * gc + col, e = tmp[i];
          if (e >= hi) continue;                       // plains + ranges untouched
          let wgt = 1 - e / hi; if (wgt < 0) wgt = 0;  // full at the waterline, fading out by `hi`
          let sum = 0, n = 0;
          for (let dr = -1; dr <= 1; dr++) {
            const r = row + dr; if (r < 0 || r >= gr) continue;
            for (let dc = -1; dc <= 1; dc++) {
              const c = col + dc; if (c < 0 || c >= gc) continue;
              sum += tmp[r * gc + c]; n++;
            }
          }
          arr[i] = e + (sum / n - e) * wgt;
        }
      }
    }
  }

  _applyLakeBasins(x, y, elevation) {
    const lakeNoiseScale = this.config.lakeNoiseScale || 0.008;
    const lakeThreshold = this.config.lakeThreshold || 0.12;
    
    // Secondary noise determines where lakes form
    const lakeNoise = noise(
      x * lakeNoiseScale + this.seed * 3,
      y * lakeNoiseScale + this.seed * 3.7
    );
    
    // Lakes form where both the terrain is low AND lake noise is high
    // This creates distinct basins rather than flooding all low ground
    if (elevation < 0.25 && lakeNoise > 0.5) {
      // How deep into the lake zone
      const basinStrength = (0.25 - elevation) * (lakeNoise - 0.5) * 4;
      elevation -= basinStrength * 0.3;
      
      // Clamp to create flat lake floors
      if (elevation < lakeThreshold * 0.5) {
        elevation = lakeThreshold * 0.3 + 
          noise(x * 0.05, y * 0.05) * lakeThreshold * 0.15;
      }
    }
    
    // Soft edge falloff at map borders (not ocean, just prevents
    // entities walking off the edge)
    const nx = x / this.mapWidth;
    const ny = y / this.mapHeight;
    const edgeDist = Math.min(nx, 1 - nx, ny, 1 - ny);
    const edgeFalloff = Math.min(1, edgeDist * 12);
    elevation *= 0.3 + edgeFalloff * 0.7;
    
    return elevation;
  }
  
  // ============================================
  // LOOKUPS
  // ============================================
  
  getElevationAt(x, y) {
    const col = (x * this.invScale) | 0;
    const row = (y * this.invScale) | 0;
    if (col < 0 || row < 0 || col >= this.gridCols || row >= this.gridRows) return 0.5;
    return this.heightMap[row * this.gridCols + col];
  }
  
  getBiomeFromElevation(elevation) {
    // Guard the floor: marine emergence (seaLift) clamps large areas to exactly 0, and the
    // biome-border wobble then pushes those cells NEGATIVE — which matches no band and fell
    // through to the LAST biome (snow), painting the submerged basin as a grey-white speckle
    // (the "grey screen at 1 Ma"). Negative or NaN reads as the lowest band (sea).
    if (!(elevation >= 0)) elevation = 0;
    for (let i = 0; i < this.biomeList.length; i++) {
      const biome = this.biomeList[i];
      if (elevation >= biome.minElevation && elevation < biome.maxElevation) {
        return biome;
      }
    }
    return this.biomeList[this.biomeList.length - 1];
  }
  

  getBiomeAt(x, y) {
    const col = (x * this.invScale) | 0;
    const row = (y * this.invScale) | 0;
    if (col < 0 || row < 0 || col >= this.gridCols || row >= this.gridRows) {
      return this._fallbackBiome;
    }
    return this.biomeArray[this.biomeIndexMap[row * this.gridCols + col]];
  }
  
  getEffectiveBiomeAt(x, y) {
    if (this._snowBiome) {
      const elevation = this.getElevationAt(x, y);
      if (this.isSeasonalSnow(elevation)) return this._snowBiome;
    }
    return this.getBiomeAt(x, y);
  }
  
  isWalkable(x, y) {
    return this.getEffectiveBiomeAt(x, y).walkable;
  }
  
  canPlace(x, y) {
    if (!this.isInBounds(x, y)) return false;
    return this.getEffectiveBiomeAt(x, y).canPlace;
  }
  
  _getCachedColor(hexColor) {
    let c = this._colorCache.get(hexColor);
    if (!c) {
      c = color(hexColor);
      this._colorCache.set(hexColor, c);
    }
    return c;
  }
  
  getColor(elevation, biome) {
    const colors = biome.colors;
    const range = biome.maxElevation - biome.minElevation;
    const position = (elevation - biome.minElevation) / range;
    const clampedPos = Math.max(0, Math.min(1, position));

    // Cel look: snap to the nearest authored ramp stop → 2-3 flat tones per biome
    // instead of a smooth gradient (md/TEMANAWA_34VIEW_PLAN.md §7).
    if (LOOK.posterize) {
      return this._getCachedColor(colors[Math.round(clampedPos * (colors.length - 1))]);
    }

    const colorIndex = clampedPos * (colors.length - 1);
    const lowerIndex = colorIndex | 0;
    const upperIndex = Math.min(lowerIndex + 1, colors.length - 1);
    const t = colorIndex - lowerIndex;
    
    if (t < 0.01) return this._getCachedColor(colors[lowerIndex]);
    if (t > 0.99) return this._getCachedColor(colors[upperIndex]);
    
    return lerpColor(
      this._getCachedColor(colors[lowerIndex]),
      this._getCachedColor(colors[upperIndex]),
      t
    );
  }
  
  hasAdjacentWater(row, col) {
    if (!this._waterBiome) return false;
    const gridCols = this.gridCols;
    const gridRows = this.gridRows;
    const waterMax = this._waterBiome.maxElevation;
    
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = row + dr;
        const nc = col + dc;
        if (nr >= 0 && nr < gridRows && nc >= 0 && nc < gridCols) {
          if (this.heightMap[nr * gridCols + nc] < waterMax) return true;
        }
      }
    }
    return false;
  }
  
  // ============================================
  // GENERATION
  // ============================================
  
  generate() {
    // A full (re)generate supersedes any in-flight incremental morph: the job's
    // partial paint state is about to be rebuilt from scratch anyway. Its
    // half-painted back buffer goes back to the pool (or is freed) — not dropped.
    if (this._morphJob) {
      const st = this._morphJob.st;
      if (st && st.buf) this._releaseBakeBuffer(st.buf);
      this._morphJob = null;
    }

    const gridCols = this.gridCols;
    const gridRows = this.gridRows;
    const totalCells = gridCols * gridRows;
    const scale = this.scale;
    
    this.heightMap = new Float32Array(totalCells);
    this.biomeIndexMap = new Uint8Array(totalCells);

    // Base elevation field: seed-dependent noise + coastal falloff, INDEPENDENT of
    // deep time. Cached so morphTo() can reshape the land without re-running noise.
    if (!this._baseNoise || this._baseNoise.length !== totalCells) {
      this._baseNoise = new Float32Array(totalCells);
    }
    let idx = 0;
    for (let row = 0; row < gridRows; row++) {
      const y = row * scale;
      for (let col = 0; col < gridCols; col++) {
        this._baseNoise[idx] = this.getElevation(col * scale, y);
        idx++;
      }
    }
    this._smoothCoast(this._baseNoise, gridCols, gridRows);

    // Deep-time factors for the CURRENT yearsBP (ranges grow, gorge incises), then
    // reshape the base field with the geography skeleton and classify biomes.
    this._geoT = TerrainGenerator.geoTimeFactors(
      (typeof DeepTime !== 'undefined') ? DeepTime.yearsBP : null);
    if (this._geoUpliftOverride != null) this._geoT.uplift = this._geoUpliftOverride;   // GEO.uplift() authoring preview
    this._prepGeo();
    this._buildGeoCache();
    this._applyGeoToHeightMap();
    this._rebuildBiomeMap();
    
    this._initSnowColors();
    
    // Build the high-resolution PAINT grid: the continuous elevation sampled at
    // LOOK.bakeScale× the sim grid, with biome, colour, water and edge per fine
    // cell. This is what the season bakes render from, decoupling PAINT resolution
    // from the sim's cell budget so the ground reads as smooth curves, not grid
    // cells. The sim's heightMap/biomeIndexMap (built above) are untouched.
    // md/TEMANAWA_34VIEW_PLAN.md §4.
    this._computePaintGrid();

    // Pre-bake all 4 seasonal buffers
    this._bakeAllSeasonBuffers();
  }

  // ============================================
  // GEOGRAPHY SKELETON (SVG-driven) — md/TEMANAWA_GEOGRAPHY.md
  // The base noise is reshaped by an optional vector skeleton: ranges lift the land
  // toward alpine, the river carves a channel to the water band, both scaling with
  // deep time (ranges grow; the gorge incises AHEAD of the uplift = antecedence).
  // ============================================

  // Dated anchors (yearsBP) for the geological state. The geology is keyed to ABSOLUTE
  // dates, NOT to progress through the DeepTime window — so you can resize the timeline
  // (DeepTime.yearsStart/yearsEnd) or jump yearsBP to any date and the ranges/river read
  // TRUE for that year, with no fast-forward. Move an event in time by editing its dates.
  //   Real geology: axial uplift began ~3 Ma, mostly late Quaternary; the Manawatū Strait
  //   closed to a through-flowing river ~1 Ma, assembling coast-first, continuous by the
  //   mid-Pleistocene; antecedent incision leads the uplift and deepens late.
  // (Defaults reproduce the original 1 Ma → 25.5 ka window look exactly.)
  static get GEO_EPOCHS() {
    return {
      upliftFrom:   1000000, upliftTo:    25000,   // ranges: nascent → mature
      incisionFrom: 1000000, incisionTo:  25000,   // river depth/banks: leads uplift, deepens late
      emergeFrom:   1000000, emergeTo:   500000,   // river: seaward strait → continuous source-to-sea
      straitCloseFrom: 1000000, straitCloseTo: 600000,  // strait narrows to normal river width
      tribEmergeFrom:   900000, tribEmergeTo:  500000    // tributaries appear source → main channel
    };
  }

  // Deep-time SHAPE factors for an absolute yearsBP. All 0..1; yearsBP null → mature
  // present (1,1,1). Pure — a function of yearsBP + GEO_EPOCHS only, independent of the
  // window, so a date always maps to the same geological state.
  //  · uplift    — range growth, eases in late (most axial uplift is late Quaternary).
  //  · incision  — river DEPTH + bank sharpness; leads uplift (antecedent down-cutting) and accelerates late.
  //  · emergence — the CONNECTION front: at the emergeFrom date the Manawatū is only a
  //                seaward embayment (the strait closing over); the channel assembles from
  //                the coast inland, continuous by emergeTo.
  static geoTimeFactors(yearsBP) {
    if (yearsBP == null) return { uplift: 1, incision: 1, emergence: 1, submergence: 0 };
    const E = TerrainGenerator.GEO_EPOCHS;
    const ramp = (from, to) => {                                    // 0 at/older than `from` → 1 at/younger than `to`
      const t = (from - yearsBP) / ((from - to) || 1);
      return t < 0 ? 0 : t > 1 ? 1 : t;
    };
    const up = ramp(E.upliftFrom, E.upliftTo);
    const inc = ramp(E.incisionFrom, E.incisionTo);
    const emg = ramp(E.emergeFrom, E.emergeTo);
    const sub = 1 - emg;                                            // inverse of the emerge ramp
    const sc = ramp(E.straitCloseFrom, E.straitCloseTo);
    const te = ramp(E.tribEmergeFrom, E.tribEmergeTo);
    return {
      uplift:    up * up,                                           // eases in (most range growth is late)
      incision:  Math.min(1, 0.2 + 0.8 * Math.pow(inc, 1.2)),       // leads uplift, accelerates late
      emergence: emg * emg * (3 - 2 * emg),                         // smoothstep connection front (coast → source)
      // MARINE EMERGENCE (Axis A): shallow-sea basin at 1 Ma → land by ~emergeTo. Smoothstep
      // 1 → 0 over the same epoch; scaled by LOOK.seaRise in _combineGeo to lower the ground
      // (raise the sea) early. Distinct from the fast glacio-eustatic ripple in Climate.seaLevel.
      submergence: sub * sub * (3 - 2 * sub),
      // STRAIT → RIVER: 1 at the old wide strait (1 Ma), 0 when closed to normal river width.
      // Scales the main stem's effective width via LOOK.straitWidthMult.
      straitFactor: 1 - sc * sc * (3 - 2 * sc),
      // TRIBUTARY emergence: 0 at tribEmergeFrom → 1 at tribEmergeTo. Tributaries appear from
      // their sources toward the main channel over this ramp (reversed wPos direction).
      tribEmergence: te * te * (3 - 2 * te)
    };
  }

  // Combine the geo field for one cell with the deep-time factors. Pure/static so
  // the cached morph path and the direct _applyGeo share it (no divergence), and
  // tools/bootcheck.js can assert it.
  static _combineGeo(e, rMask, rH, ridge, detail, wMask, wDepth, uplift, incision, relief, incise, sea, wPos, emergence, seaLift, floodCeil) {
    const e0 = e;                                  // pre-range LOCAL ground — the level the river follows
    if (rMask > 0) {
      const crest = rH * uplift;                   // rH already carries the spine falloff (built per cell)
      let massif = crest * (1 - relief * (1 - ridge)) + detail;
      if (massif > 1) massif = 1;
      if (massif > e) e += (massif - e) * rMask;   // ranges lift; never dig below the base
    }
    if (wMask > 0) {
      // Emergence: the channel connects from the coast (wPos 0) inland (wPos 1) as the
      // drainage assembles — at ~1.1 Ma only a seaward embayment reads as water and the
      // upstream is still land (the Manawatū Strait closing over), continuous by mid-window.
      // `conn` is the connection front; `incision` then deepens/sharpens the incised channel.
      const FEATHER = 0.15;                        // soft width of the advancing front, in downstream units
      let conn = (emergence - wPos + FEATHER) / FEATHER;
      if (conn < 0) conn = 0; else if (conn > 1) conn = 1;
      conn = conn * conn * (3 - 2 * conn);
      if (conn > 0) {
        // Bed rides the LOCAL ground: it sits `incise` (deepening with time) below the
        // pre-range ground, and only sinks to the sea band where the land is already near
        // it — the coast. The gorge's DEPTH comes from the flanking ranges rising around
        // this channel (antecedence), so a cell crossing the water drops at most ~incise.
        let surf = e0 - incise * wDepth * (0.4 + 0.6 * incision);
        if (surf < sea) surf = sea;
        const bed = Math.min(1, wMask * (1.35 + 0.35 * incision)) * conn;
        if (surf < e) e += (surf - e) * bed;       // only ever lower — cut through any range lift
      }
    }
    // MARINE EMERGENCE (Axis A): water RISING into the basin, not the ground sinking.
    // A uniform `e -= seaLift` drowned the whole map at 1 Ma — with the real p5 noise
    // distribution nearly all land sits below ~0.47, so subtracting 0.2 flat left a
    // grey, featureless flood (the "grey screen"). Instead the lowering attenuates
    // with elevation: full near the shore, fading to NOTHING by floodCeil
    // (LOOK.seaFloodCeil) — the low basin floods, the eastern uplands stay dry land.
    // Only ever lowers — never raises. Guarded so a caller that omits it
    // (older/harness paths) is a clean no-op.
    if (seaLift > 0) {
      const fc = (floodCeil > 0) ? floodCeil : 0.42;
      if (e < fc) {
        const f = 1 - e / fc;
        e -= seaLift * f * f * (3 - 2 * f);
      }
    }
    return e < 0 ? 0 : e > 1 ? 1 : e;
  }

  // N/S edge falloff: within `margin` of the top/bottom edge, ease high terrain DOWN to
  // plains (~0.22). The 3/4 relief bake paints the far row's side-face and the front
  // row's apron to the buffer edge, so a range truncated at the map edge (our ranges'
  // polys run off-frame to v<0 and v>1) smears vertically. Bringing the edge rows down
  // to plains gives those rows nothing tall to smear. Only ever lowers — plains and the
  // carved river channel pass through untouched. Pure/static; margin 0 disables it.
  static _nsEdgeFalloff(e, v, margin) {
    if (!(margin > 0)) return e;
    const d = v < 1 - v ? v : 1 - v;              // distance to nearest N/S edge, 0..0.5
    if (d >= margin) return e;
    const f0 = 1 - d / margin, f = f0 * f0 * (3 - 2 * f0);   // smoothstep, 1 at edge
    const target = e < 0.22 ? e : 0.22;           // never raises (river/plains unchanged)
    return e + (target - e) * f;
  }

  // Should the morph driver re-bake now? True once yearsBP has drifted past the
  // interval AND the real-time throttle has elapsed. Pure/static.
  static shouldMorphBake(yearsBP, bakedYearsBP, nowMs, lastMs, intervalYears, minMs) {
    return Math.abs(yearsBP - bakedYearsBP) >= intervalYears && (nowMs - lastMs) >= minMs;
  }

  // Precompute the time-INDEPENDENT geo field per cell (range mass + which range's
  // height, ridge/detail noise, river mask + depth) once per footprint. morphTo()
  // then only re-applies the deep-time factors over this — no distance/noise recompute.
  _buildGeoCache() {
    if (!this.geo || (this._geoRanges.length === 0 && this._geoRivers.length === 0)) { this._geoCache = null; return; }
    const gc = this.gridCols, gr = this.gridRows, n = gc * gr, scale = this.scale;
    const invc = 1 / gc, invr = 1 / gr;
    const rMask = new Float32Array(n), rH = new Float32Array(n), ridge = new Float32Array(n),
          detail = new Float32Array(n), wDist = new Float32Array(n), wBaseW = new Float32Array(n),
          wDepth = new Float32Array(n), wPos = new Float32Array(n);
    const wType = new Uint8Array(n);
    // Second candidate: the nearest MAIN-stem river, regardless of which river won
    // the margin. Where a TRIBUTARY owns a cell but its paint is gated off (not yet
    // emerged / highland-thinned), the classify passes fall back to this so the
    // strait's water/banks aren't cut along the selection seam. ~3 extra MB at sim res.
    const wMDist = new Float32Array(n), wMBaseW = new Float32Array(n), wMPos = new Float32Array(n);
    // Default wDist to Infinity so cells with no nearby river have no influence.
    wDist.fill(1e6);
    wMDist.fill(1e6);
    const R = this._geoRanges, Rv = this._geoRivers;
    const spine = (typeof LOOK !== 'undefined' && LOOK.rangeSpine != null) ? LOOK.rangeSpine : 0.45;
    const jitter = (typeof LOOK !== 'undefined' && LOOK.riverFrontJitter != null) ? LOOK.riverFrontJitter : 0.07;
    const wob = (typeof LOOK !== 'undefined' && LOOK.riverWobble != null) ? LOOK.riverWobble : 0.02;
    const eAmp = (typeof LOOK !== 'undefined' && LOOK.riverEdgeNoise != null) ? LOOK.riverEdgeNoise : 0;
    const eFreq = (typeof LOOK !== 'undefined' && LOOK.riverEdgeFreq != null) ? LOOK.riverEdgeFreq : 26;
    let idx = 0;
    for (let row = 0; row < gr; row++) {
      const v = row * invr, wy = row * scale;
      for (let col = 0; col < gc; col++) {
        const u = col * invc, wx = col * scale;
        let bm = 0, bh = 0, br = null;
        for (let i = 0; i < R.length; i++) { const m = this._rangeMass(R[i], u, v); if (m > bm) { bm = m; bh = R[i].height; br = R[i]; } }
        rMask[idx] = bm;
        rH[idx] = (bm > 0 && br) ? bh * TerrainGenerator._spineHeight(br, u, v, spine) : bh;
        if (bm > 0) { ridge[idx] = this.ridgeNoise(wx, wy); detail[idx] = (this.fractalNoise(wx, wy) - 0.5) * 0.12; }
        // Rivers: find strongest by margin (dist / baseWidth). Stores raw distance
        // so the mask can be recomputed at combine time with a time-varying width
        // (strait → river narrowing). wPos is parametric position along the polyline
        // (0 = first authored point, 1 = last) so tributaries authored source-first
        // emerge correctly.
        let bestMargin = Infinity, bestMainMargin = Infinity;
        for (let i = 0; i < Rv.length; i++) {
          const rv = Rv[i], pts = rv.pts;
          // Distance + parametric position along the polyline (inline to avoid alloc)
          let md = Infinity, cumLen = 0, bestCumLen = 0;
          for (let s = 0; s + 1 < pts.length; s++) {
            const ax = pts[s][0], ay = pts[s][1], bx = pts[s+1][0], by = pts[s+1][1];
            const dx = bx - ax, dy = by - ay, segLen = Math.hypot(dx, dy);
            const sd = TerrainGenerator._distToSeg(u, v, ax, ay, bx, by);
            if (sd < md) {
              md = sd;
              const l2 = dx * dx + dy * dy;
              let t = l2 > 0 ? ((u - ax) * dx + (v - ay) * dy) / l2 : 0;
              if (t < 0) t = 0; else if (t > 1) t = 1;
              bestCumLen = cumLen + t * segLen;
            }
            cumLen += segLen;
          }
          let d = md;
          if (wob > 0) d += (noise(u * 7 + this.seed * 3, v * 7 + this.seed * 4) * 2 - 1) * wob;
          // High-frequency edge noise: rags the waterline so banks don't trace the
          // authored polyline as smooth curves. Cached — free at combine/paint time.
          if (eAmp > 0) d += (noise(u * eFreq + this.seed * 17, v * eFreq + this.seed * 19) * 2 - 1) * eAmp;
          if (d < 0) d = 0;
          const w = rv.width || 0.045;
          const margin = d / w;
          const isTrib = (rv.type === 'tributary');
          if (margin < bestMargin) {
            bestMargin = margin;
            wDist[idx] = d;
            wBaseW[idx] = w;
            wType[idx] = isTrib ? 1 : 0;
            wDepth[idx] = rv.depth != null ? rv.depth : 1;
            wPos[idx] = cumLen > 0 ? bestCumLen / cumLen : 0;
          }
          if (!isTrib && margin < bestMainMargin) {
            bestMainMargin = margin;
            wMDist[idx] = d;
            wMBaseW[idx] = w;
            wMPos[idx] = cumLen > 0 ? bestCumLen / cumLen : 0;
          }
        }
        if (bestMargin < Infinity && jitter > 0) {
          let p = wPos[idx] + (noise(u * 4 + this.seed * 11, v * 4 + this.seed * 13) * 2 - 1) * jitter;
          wPos[idx] = p < 0 ? 0 : p > 1 ? 1 : p;
        }
        idx++;
      }
    }
    this._geoCache = { rMask, rH, ridge, detail, wDist, wBaseW, wType, wDepth, wPos, wMDist, wMBaseW, wMPos };
  }

  // Normalise the geo data into the per-generate working form (filtered, defaulted).
  // Ranges also get a PCA-derived long axis (the spine); rivers get their u-range so a
  // cell's downstream position (0 = coast, 1 = source) is a cheap normalise of u.
  _prepGeo() {
    const g = this.geo;
    if (!g) { this._geoRanges = []; this._geoRivers = []; return; }
    this._geoRanges = (g.ranges || []).filter(r => r.poly && r.poly.length >= 3)
      .map(r => TerrainGenerator._prepRange(r.height != null ? r.height : 0.85, r.spread || 0.14, r.poly));
    this._geoRivers = (g.rivers || []).filter(rv => rv.pts && rv.pts.length >= 2)
      .map(rv => {
        let u0 = Infinity, u1 = -Infinity;
        for (const p of rv.pts) { if (p[0] < u0) u0 = p[0]; if (p[0] > u1) u1 = p[0]; }
        // Arc length for parametric position (wPos as distance along the polyline)
        let arcLen = 0;
        for (let i = 0; i + 1 < rv.pts.length; i++) arcLen += Math.hypot(rv.pts[i+1][0] - rv.pts[i][0], rv.pts[i+1][1] - rv.pts[i][1]);
        return { width: rv.width || 0.045, depth: rv.depth != null ? rv.depth : 1.0, pts: rv.pts,
                 type: rv.type || 'main', arcLen,
                 u0, uSpan: (u1 - u0) > 1e-6 ? (u1 - u0) : 1e-6 };
      });
  }

  // Precompute a range's long axis via PCA over its polygon vertices. The principal
  // eigenvector of the vertex covariance IS the range's elongation (NE–SW here), so the
  // spine crest runs along it and height falls off across `perp` out to `halfW`. Pure/static.
  static _prepRange(height, spread, poly) {
    let cx = 0, cy = 0;
    for (const p of poly) { cx += p[0]; cy += p[1]; }
    cx /= poly.length; cy /= poly.length;
    let a = 0, b = 0, d = 0;
    for (const p of poly) { const dx = p[0] - cx, dy = p[1] - cy; a += dx * dx; b += dx * dy; d += dy * dy; }
    const tr = a + d, det = a * d - b * b;
    const disc = Math.sqrt(Math.max(0, tr * tr / 4 - det));
    const l1 = tr / 2 + disc;                       // larger eigenvalue → long axis
    let axX, axY;
    if (Math.abs(b) > 1e-9) { axX = l1 - d; axY = b; }
    else { axX = (a >= d) ? 1 : 0; axY = (a >= d) ? 0 : 1; }
    const al = Math.hypot(axX, axY) || 1; axX /= al; axY /= al;
    const perpX = -axY, perpY = axX;                // crest falls off along the perpendicular
    let halfW = 1e-6;
    for (const p of poly) { const t = Math.abs((p[0] - cx) * perpX + (p[1] - cy) * perpY); if (t > halfW) halfW = t; }
    return { height, spread, poly, cx, cy, perpX, perpY, halfW };
  }

  // Crest height multiplier for a cell: 1 on the range's spine axis, falling to
  // (1 − spine) at the flanks (halfW away), so the range reads as a ridge, not a plateau.
  // spine 0 → flat plateau (old behaviour). Pure/static.
  static _spineHeight(r, u, v, spine) {
    if (!(spine > 0) || !(r.halfW > 0)) return 1;
    let t = ((u - r.cx) * r.perpX + (v - r.cy) * r.perpY) / r.halfW;
    if (t < 0) t = -t; if (t > 1) t = 1;
    const sp = 1 - t * t * (3 - 2 * t);             // 1 on the axis → 0 at the flank
    return 1 - spine * (1 - sp);
  }

  // heightMap = base noise reshaped by the skeleton at the current deep-time factors.
  // heightMap = base noise reshaped by the CACHED geo field at the current deep-time
  // factors. The hot morph path: no distance/noise recompute, just a cheap per-cell
  // combine — so morphTo() pays only the bake, not the field build.
  _applyGeoToHeightMap() {
    const base = this._baseNoise, hm = this.heightMap, c = this._geoCache;
    if (!c) { hm.set(base); return; }             // no skeleton → base field unchanged
    const t = this._geoT, up = t.uplift, inc = t.incision;
    const relief = (typeof LOOK !== 'undefined' && LOOK.rangeRelief != null) ? LOOK.rangeRelief : 0.45;
    const incise = (typeof LOOK !== 'undefined' && LOOK.riverIncise != null) ? LOOK.riverIncise : 0.06;
    const sea = (typeof LOOK !== 'undefined' && LOOK.riverSeaLevel != null) ? LOOK.riverSeaLevel : 0.04;
    const seaRise = (typeof LOOK !== 'undefined' && LOOK.seaRise != null) ? LOOK.seaRise : 0;
    const seaLift = (t.submergence > 0 ? t.submergence : 0) * seaRise;   // Axis A: marine emergence
    const floodCeil = (typeof LOOK !== 'undefined' && LOOK.seaFloodCeil != null) ? LOOK.seaFloodCeil : 0.42;
    // Strait: main stem widens by straitWidthMult at full straitFactor (1 Ma)
    const straitW = (typeof LOOK !== 'undefined' && LOOK.straitWidthMult != null) ? LOOK.straitWidthMult : 3.0;
    const straitF = (t.straitFactor != null) ? t.straitFactor : 0;
    const tribEmg = (t.tribEmergence != null) ? t.tribEmergence : 1;
    const rMask = c.rMask, rH = c.rH, ridge = c.ridge, detail = c.detail;
    const wDistArr = c.wDist, wBaseWArr = c.wBaseW, wTypeArr = c.wType, wDepthArr = c.wDepth, wPosArr = c.wPos;
    const gr = this.gridRows, gc = this.gridCols, invr = 1 / gr, edgeMargin = this._geoEdgeMargin;
    let i = 0;
    for (let row = 0; row < gr; row++) {
      const v = row * invr;
      for (let col = 0; col < gc; col++, i++) {
        // Compute time-varying river mask from cached distance
        const dist = wDistArr[i];
        let wMask = 0, cellEmg = 1;
        if (dist < 1) {                             // rough early-out (max baseW ~ 0.15 at strait)
          let effW = wBaseWArr[i];
          if (wTypeArr[i] === 0) effW *= (1 + (straitW - 1) * straitF);   // main stem → strait
          if (dist < effW) { const tt = 1 - dist / effW; wMask = tt * tt * (3 - 2 * tt); }
          cellEmg = (wTypeArr[i] === 1) ? tribEmg : 1.0;                   // tributaries use their own emergence
        }
        const e = TerrainGenerator._combineGeo(base[i], rMask[i], rH[i], ridge[i], detail[i], wMask, wDepthArr[i], up, inc, relief, incise, sea, wPosArr[i], cellEmg, seaLift, floodCeil);
        hm[i] = TerrainGenerator._nsEdgeFalloff(e, v, edgeMargin);
      }
    }
  }

  // Reshape one cell directly (samples the field on the fly, off the cache — e.g.
  // the harness). (u,v) normalised 0..1; (wx,wy) world for the ridge/detail noise.
  // Uses the same _combineGeo as the cached path, so the two never diverge.
  _applyGeo(e, u, v, wx, wy) {
    const t = this._geoT;
    const relief = (typeof LOOK !== 'undefined' && LOOK.rangeRelief != null) ? LOOK.rangeRelief : 0.45;
    const incise = (typeof LOOK !== 'undefined' && LOOK.riverIncise != null) ? LOOK.riverIncise : 0.06;
    const sea = (typeof LOOK !== 'undefined' && LOOK.riverSeaLevel != null) ? LOOK.riverSeaLevel : 0.04;
    const spine = (typeof LOOK !== 'undefined' && LOOK.rangeSpine != null) ? LOOK.rangeSpine : 0.45;
    let rMask = 0, rH = 0;
    const R = this._geoRanges;
    for (let i = 0; i < R.length; i++) { const m = this._rangeMass(R[i], u, v); if (m > rMask) { rMask = m; rH = R[i].height * TerrainGenerator._spineHeight(R[i], u, v, spine); } }
    let ridge = 0, detail = 0;
    if (rMask > 0) { ridge = this.ridgeNoise(wx, wy); detail = (this.fractalNoise(wx, wy) - 0.5) * 0.12; }
    // Rivers: find strongest by margin, compute mask with time-varying width (matches _buildGeoCache path)
    const wob = (typeof LOOK !== 'undefined' && LOOK.riverWobble != null) ? LOOK.riverWobble : 0.02;
    const jitter = (typeof LOOK !== 'undefined' && LOOK.riverFrontJitter != null) ? LOOK.riverFrontJitter : 0.07;
    const straitW = (typeof LOOK !== 'undefined' && LOOK.straitWidthMult != null) ? LOOK.straitWidthMult : 3.0;
    const straitF = (t.straitFactor != null) ? t.straitFactor : 0;
    const tribEmg = (t.tribEmergence != null) ? t.tribEmergence : 1;
    let wMask = 0, wDepth = 0, wPos = 0, cellEmg = 1;
    const Rv = this._geoRivers;
    let bestMargin = Infinity;
    for (let i = 0; i < Rv.length; i++) {
      const rv = Rv[i], pts = rv.pts;
      let md = Infinity, cumLen = 0, bestCumLen = 0;
      for (let s = 0; s + 1 < pts.length; s++) {
        const ax = pts[s][0], ay = pts[s][1], bx = pts[s+1][0], by = pts[s+1][1];
        const dx = bx - ax, dy = by - ay, segLen = Math.hypot(dx, dy);
        const sd = TerrainGenerator._distToSeg(u, v, ax, ay, bx, by);
        if (sd < md) { md = sd; const l2 = dx*dx+dy*dy; let tt = l2 > 0 ? ((u-ax)*dx+(v-ay)*dy)/l2 : 0; if (tt < 0) tt = 0; else if (tt > 1) tt = 1; bestCumLen = cumLen + tt * segLen; }
        cumLen += segLen;
      }
      let d = md;
      if (wob > 0) d += (noise(u * 7 + this.seed * 3, v * 7 + this.seed * 4) * 2 - 1) * wob;
      const eAmp = (typeof LOOK !== 'undefined' && LOOK.riverEdgeNoise != null) ? LOOK.riverEdgeNoise : 0;
      const eFreq = (typeof LOOK !== 'undefined' && LOOK.riverEdgeFreq != null) ? LOOK.riverEdgeFreq : 26;
      if (eAmp > 0) d += (noise(u * eFreq + this.seed * 17, v * eFreq + this.seed * 19) * 2 - 1) * eAmp;
      if (d < 0) d = 0;
      const w = rv.width || 0.045, margin = d / w;
      if (margin < bestMargin) {
        bestMargin = margin;
        const isTrib = (rv.type === 'tributary');
        let effW = isTrib ? w : w * (1 + (straitW - 1) * straitF);
        wMask = d < effW ? (1 - d / effW) : 0;
        if (wMask > 0) wMask = wMask * wMask * (3 - 2 * wMask);
        wDepth = rv.depth != null ? rv.depth : 1;
        wPos = cumLen > 0 ? bestCumLen / cumLen : 0;
        if (jitter > 0) wPos += (noise(u * 4 + this.seed * 11, v * 4 + this.seed * 13) * 2 - 1) * jitter;
        if (wPos < 0) wPos = 0; else if (wPos > 1) wPos = 1;
        cellEmg = isTrib ? tribEmg : 1.0;
      }
    }
    const seaRise = (typeof LOOK !== 'undefined' && LOOK.seaRise != null) ? LOOK.seaRise : 0;
    const seaLift = (t.submergence > 0 ? t.submergence : 0) * seaRise;
    const floodCeil = (typeof LOOK !== 'undefined' && LOOK.seaFloodCeil != null) ? LOOK.seaFloodCeil : 0.42;
    const out = TerrainGenerator._combineGeo(e, rMask, rH, ridge, detail, wMask, wDepth, t.uplift, t.incision, relief, incise, sea, wPos, cellEmg, seaLift, floodCeil);
    return TerrainGenerator._nsEdgeFalloff(out, v, this._geoEdgeMargin);
  }

  // 1 inside a range, smooth falloff to 0 across `spread` outside it.
  _rangeMass(r, u, v) {
    if (TerrainGenerator._pointInPoly(r.poly, u, v)) return 1;
    const s = r.spread || 0.14;
    const d = TerrainGenerator._distToPolyEdges(r.poly, u, v);
    if (d >= s) return 0;
    const tt = 1 - d / s;
    return tt * tt * (3 - 2 * tt);
  }

  // 1 on the river line, smooth falloff to 0 at `width`; a per-seed wobble lets the
  // channel wander off the exact SVG path so it varies run to run.
  _riverMask(rv, u, v) {
    let d = TerrainGenerator._distToPolyline(rv.pts, u, v);
    const wob = (typeof LOOK !== 'undefined' && LOOK.riverWobble != null) ? LOOK.riverWobble : 0.02;
    if (wob > 0) d += (noise(u * 7 + this.seed * 3, v * 7 + this.seed * 4) * 2 - 1) * wob;
    const w = rv.width || 0.045;
    if (d >= w) return 0;
    const tt = 1 - d / w;
    return tt * tt * (3 - 2 * tt);
  }

  // ---- wobble caches -------------------------------------------------------
  // The biome-border wobble is noise over (cell position, seed, wobbleFreq) —
  // nothing in it moves with deep time — yet it used to be re-evaluated per cell
  // on every morph re-bake (262k calls at sim res + up to ~2M at paint res, for
  // byte-identical answers). Cache the centred field (noise·2−1) per footprint;
  // a seed / frequency / footprint change invalidates via the key. This is also
  // what makes a sliced morph bit-identical to a synchronous one — the harness
  // asserts exactly that.
  _simWobbleField() {
    const key = this.seed + '|' + LOOK.wobbleFreq + '|' + this.gridCols + 'x' + this.gridRows;
    if (this._simWobKey !== key) {
      const gc = this.gridCols, gr = this.gridRows, f = LOOK.wobbleFreq, s = this.seed;
      const arr = new Float32Array(gc * gr);
      let idx = 0;
      for (let row = 0; row < gr; row++)
        for (let col = 0; col < gc; col++, idx++)
          arr[idx] = noise(col * f + s * 5, row * f + s * 7) * 2 - 1;
      this._simWob = arr; this._simWobKey = key;
    }
    return this._simWob;
  }

  // Paint-resolution twin: sampled at fractional cell coords (pc/S, pr/S), so it
  // is keyed on the supersample factor too. One slot — init and morph both bake
  // at the capped S, so in practice the cache stays warm across every morph.
  _paintWobbleField(PW, PH, S) {
    const key = this.seed + '|' + LOOK.wobbleFreq + '|' + PW + 'x' + PH + '@' + S;
    if (this._paintWobKey !== key) {
      const f = LOOK.wobbleFreq, s = this.seed, invS = 1 / S;
      const arr = new Float32Array(PW * PH);
      let i = 0;
      for (let pr = 0; pr < PH; pr++) {
        const wy = pr * invS;
        for (let pc = 0; pc < PW; pc++, i++)
          arr[i] = noise((pc * invS) * f + s * 5, wy * f + s * 7) * 2 - 1;
      }
      this._paintWob = arr; this._paintWobKey = key;
    }
    return this._paintWob;
  }

  // Paint-resolution river mask: the strongest _riverMask over the geo rivers at each
  // fine cell's (u,v) = (pc/PW, pr/PH). This is what makes the channel read as WATER at
  // any bed height — decoupled from elevation — so a river riding the plains (well above
  // the sea band) still paints blue. Time-independent (seed + width + wobble only), so it
  // is cached per footprint and reused across the 4 season bakes and every morph; that
  // also keeps a sliced morph bit-identical to a synchronous one (the wobble noise is
  // sampled once into the cache, never live on the bake path).
  _paintRiverField(PW, PH) {
    const Rv = this._geoRivers || [];
    const wob = (typeof LOOK !== 'undefined' && LOOK.riverWobble != null) ? LOOK.riverWobble : 0.02;
    const jitter = (typeof LOOK !== 'undefined' && LOOK.riverFrontJitter != null) ? LOOK.riverFrontJitter : 0.07;
    const key = this.seed + '|' + wob + '|' + jitter + '|' + Rv.length + '|' + PW + 'x' + PH;
    if (this._paintRiverKey !== key) {
      const arr = new Float32Array(PW * PH), pos = new Float32Array(PW * PH);
      if (Rv.length) {
        const invW = 1 / PW, invH = 1 / PH;
        let i = 0;
        for (let pr = 0; pr < PH; pr++) {
          const v = pr * invH;
          for (let pc = 0; pc < PW; pc++, i++) {
            const u = pc * invW;
            let m = 0, p = 0;
            for (let r = 0; r < Rv.length; r++) { const c = this._riverMask(Rv[r], u, v); if (c > m) { m = c; p = (u - Rv[r].u0) / Rv[r].uSpan; } }
            if (m > 0 && jitter > 0) p += (noise(u * 4 + this.seed * 11, v * 4 + this.seed * 13) * 2 - 1) * jitter;   // matches the sim cache
            arr[i] = m; pos[i] = p < 0 ? 0 : p > 1 ? 1 : p;   // downstream: 0 = coast, 1 = source
          }
        }
      }
      this._paintRiver = arr; this._paintRiverPos = pos; this._paintRiverKey = key;
    }
    return this._paintRiver;
  }

  // Classify biomes from the current heightMap (extracted so morphTo() can reuse it).
  _rebuildBiomeMap() {
    const gridCols = this.gridCols, gridRows = this.gridRows;
    // Wobble the band threshold so biome borders wander like a brush line.
    const w = LOOK.wobble ? LOOK.wobbleAmp : 0;
    const wob = w > 0 ? this._simWobbleField() : null;
    // River cells read as water in the SIM map too (via the geo mask, not elevation), so
    // walkability and entity queries match the painted channel at any bed height.
    const C = this._geoCache;
    const wDistArr = C ? C.wDist : null;
    const wBaseWArr = C ? C.wBaseW : null;
    const wTypeArr = C ? C.wType : null;
    const wPosArr = C ? C.wPos : null;
    const wMDistArr = C ? C.wMDist : null;
    const wMBaseWArr = C ? C.wMBaseW : null;
    const riverT = (typeof LOOK !== 'undefined' && LOOK.riverWaterT != null) ? LOOK.riverWaterT : 0.55;
    const riverBankT = (typeof LOOK !== 'undefined' && LOOK.riverBankT != null) ? LOOK.riverBankT : 0.30;
    const _gt = this._geoT || {};
    const riverTeff = riverT + (1 - (_gt.incision != null ? _gt.incision : 1)) * 0.25;
    const straitW = (typeof LOOK !== 'undefined' && LOOK.straitWidthMult != null) ? LOOK.straitWidthMult : 3.0;
    const straitF = (_gt.straitFactor != null) ? _gt.straitFactor : 0;
    const tribEmg = (_gt.tribEmergence != null) ? _gt.tribEmergence : 1;
    const thin = (typeof LOOK !== 'undefined' && LOOK.tribHighlandThin != null) ? LOOK.tribHighlandThin : 1.6;
    const R_FEATHER = 0.15;
    let idx = 0;
    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        const elevation = this.heightMap[idx];
        const eClass = wob ? elevation + wob[idx] * w : elevation;
        let biome = this.getBiomeFromElevation(eClass);
        let waterHit = false, bedHit = false;
        if (wDistArr && this._waterBiome) {
          const dist = wDistArr[idx];
          let effW = wBaseWArr[idx];
          if (wTypeArr[idx] === 0) effW *= (1 + (straitW - 1) * straitF);
          let m = 0;
          if (dist < effW) { const tt = 1 - dist / effW; m = tt * tt * (3 - 2 * tt); }
          if (m > 0) {
            const cellEmg = (wTypeArr[idx] === 1) ? tribEmg : 1.0;
            const d = wPosArr ? wPosArr[idx] : 0;
            const front = (cellEmg - d + R_FEATHER) / R_FEATHER;
            if (front > 0) {
              const fs = front >= 1 ? 1 : front * front * (3 - 2 * front);
              let wT = riverTeff + (1 - fs) * (1 - riverTeff);
              let bT = riverBankT + (1 - fs) * (1 - riverBankT);
              // Highland thinning: a tributary on high ground is a STREAM cutting a
              // gully, not band-water with beaches. Raise the thresholds with elevation
              // so water narrows to a thread (then bare gully) upslope — no perched
              // ponds or sand rings on ridge lines.
              if (wTypeArr[idx] === 1 && thin > 0 && eClass > 0.30) {
                const hi = (eClass - 0.30) * thin;
                wT += hi; bT += hi * 0.8;
              }
              if (m >= wT) waterHit = true; else if (m >= bT) bedHit = true;
            }
          }
          // Seam fallback: a TRIBUTARY-owned cell whose paint was gated off may still
          // sit inside the (strait-widened) MAIN channel — without this the strait's
          // water/banks cut off along the straight margin-selection boundary.
          if (!waterHit && !bedHit && wTypeArr[idx] === 1 && wMDistArr) {
            const dM = wMDistArr[idx];
            const effWM = wMBaseWArr[idx] * (1 + (straitW - 1) * straitF);
            if (dM < effWM) {
              const tt = 1 - dM / effWM;
              const mM = tt * tt * (3 - 2 * tt);
              if (mM >= riverTeff) waterHit = true; else if (mM >= riverBankT) bedHit = true;
            }
          }
        }
        if (waterHit) {
          biome = this._waterBiome;
        } else if (bedHit && this._bedBiome) {
          biome = this._bedBiome;
        } else if (biome === this.biomeList[1] && this._waterBiome) {
          if (!this.hasAdjacentWater(row, col)) biome = this._fallbackBiome;
        }
        this.biomeIndexMap[idx] = this.biomeIndexByKey[biome.key];
        idx++;
      }
    }
  }

  // Reshape the land for a new yearsBP WITHOUT re-seeding: reuse the cached base
  // noise, re-apply the geography at the new factors, re-classify, re-bake.
  // SYNCHRONOUS — the whole cost lands in one call. Dev/harness path; the
  // visitor path uses morphBegin()/morphStep() below, which produce an
  // identical result spread across frames (the harness asserts the identity).
  morphTo(yearsBP, bakeScaleOverride) {
    this.morphBegin(yearsBP, bakeScaleOverride);
    while (this._morphJob) this.morphStep(Infinity);
  }

  // ============================================
  // INCREMENTAL MORPH — the hitchless visitor path
  // ============================================
  // morphTo() above re-baked everything in one call: fine at authoring time,
  // but a 100+ ms stall every morphIntervalYears on the wall. morphBegin()
  // stages the same work as a resumable job; morphStep(budgetMs) runs slices
  // of it inside a per-frame budget (CONFIG.morphBudgetMs, ~3 ms):
  //
  //   phase 0  heightMap + biomes + snow ramp     (one slice — cheap, geo cache)
  //   phase 1  paint-grid allocation               (one slice)
  //   phase 2  paint pass 1 (elev/biome/colour)    (row bands)
  //   phase 3  paint pass 2 (boundary edges)       (row bands)
  //   phase 4  season bakes, CURRENT season first  (column bands — the pc loop
  //            in _bakeSeasonColumns is independent per column, so it slices
  //            cleanly), each into a BACK buffer that swaps in atomically when
  //            finished. The visible season's swap arms a >=500 ms crossfade
  //            (photosensitivity budget) in render().
  //
  // The sim-facing state (heightMap / biomeIndexMap) updates in phase 0, same
  // as the synchronous path; only the painted buffers lag by a few frames.
  // A generate()/reseed/refit cancels the job (the new land supersedes it).
  morphBegin(yearsBP, bakeScaleOverride) {
    if (!this._baseNoise) return this.generate();   // parity with morphTo()
    this._morphJob = {
      yearsBP,
      bakeScale: (bakeScaleOverride != null) ? bakeScaleOverride : null,
      phase: 0, row: 0, col: 0,
      seasonIdx: 0, seasons: this._seasonBakeOrder(), st: null
    };
  }

  get morphInProgress() { return !!this._morphJob; }

  // Bake the season on screen first so the visible land updates soonest; the
  // other three swap invisibly behind it.
  _seasonBakeOrder() {
    const all = ['interglacial', 'cooling', 'glacial', 'fullGlacial'];
    const cur = this.seasonManager ? this.seasonManager.currentKey : 'interglacial';
    return [cur, ...all.filter(s => s !== cur)];
  }

  // Run the morph job for up to budgetMs. Returns true when the job is done
  // (or when there is none). Chunk sizes are small enough that the budget
  // overshoot is bounded by one chunk, not one phase.
  morphStep(budgetMs = 3) {
    const job = this._morphJob;
    if (!job) return true;
    const nowFn = (typeof performance !== 'undefined' && performance.now)
      ? () => performance.now() : () => Date.now();
    const deadline = nowFn() + budgetMs;
    const ROWS = 32, COLS = 48;   // per-slice chunk sizes (time re-checked between chunks)

    do {
      if (job.phase === 0) {
        // Reshape the sim-facing land: cheap per-cell combines over the geo
        // cache, biome classify off the cached wobble. Same calls as morphTo().
        this._geoT = TerrainGenerator.geoTimeFactors(job.yearsBP);
        if (this._geoUpliftOverride != null) this._geoT.uplift = this._geoUpliftOverride;   // GEO.uplift() authoring preview
        if (!this._geoCache) { this._prepGeo(); this._buildGeoCache(); }
        this._applyGeoToHeightMap();
        this._rebuildBiomeMap();
        this._initSnowColors();
        job.phase = 1;
      } else if (job.phase === 1) {
        this._bakeScaleOverride = job.bakeScale;
        this._paintGridBegin();
        this._bakeScaleOverride = null;
        job.phase = 2; job.row = 0;
      } else if (job.phase === 2) {
        const r1 = Math.min(this._paintH, job.row + ROWS);
        this._paintGridPass1(job.row, r1);
        job.row = r1;
        if (job.row >= this._paintH) { job.phase = 3; job.row = 0; }
      } else if (job.phase === 3) {
        const r1 = Math.min(this._paintH, job.row + ROWS);
        this._paintGridPass2(job.row, r1);
        job.row = r1;
        if (job.row >= this._paintH) { job.phase = 4; job.col = 0; }
      } else if (job.phase === 4) {
        if (!job.st) {
          job.st = this._bakeSeasonBegin(job.seasons[job.seasonIdx]);
          job.col = 0;
        }
        const c1 = Math.min(this._paintW, job.col + COLS);
        this._bakeSeasonColumns(job.st, job.col, c1);
        job.col = c1;
        if (job.col >= this._paintW) {
          this._swapSeasonBuffer(job.seasons[job.seasonIdx], this._bakeSeasonEnd(job.st));
          job.st = null;
          job.seasonIdx++;
          if (job.seasonIdx >= job.seasons.length) {
            this._morphJob = null;
            return true;
          }
        }
      }
    } while (nowFn() < deadline);
    return !this._morphJob;
  }

  // Swap a finished back buffer in. If the outgoing buffer is the one on
  // screen, hand it to the render crossfade (released when the fade ends);
  // otherwise recycle it into the pool immediately.
  _swapSeasonBuffer(seasonKey, newBuf) {
    const old = this.seasonBuffers[seasonKey];
    this.seasonBuffers[seasonKey] = newBuf;
    if (!old) return;
    const visible = this.seasonManager
      ? (seasonKey === this.seasonManager.currentKey || seasonKey === this.seasonManager.nextKey)
      : seasonKey === 'interglacial';
    if (visible && !this._morphFade) {
      const fadeMs = (typeof CONFIG !== 'undefined' && CONFIG.morphFadeMs) || 600;
      this._morphFade = {
        buf: old,
        t0: (typeof millis === 'function') ? millis() : Date.now(),
        ms: Math.max(500, fadeMs)   // photosensitivity: large changes ramp >= 500 ms
      };
    } else {
      this._releaseBakeBuffer(old);
    }
  }

  // ---- back-buffer pool ----------------------------------------------------
  // createGraphics is a real canvas: allocating one per morph churns GPU memory
  // and risks the §2.3 leak. Acquire an exact-size buffer from the pool or
  // create one; release returns it for the next season/morph. disposeBuffers()
  // drains the pool.
  _acquireBakeBuffer(w, h) {
    for (let i = 0; i < this._bufPool.length; i++) {
      const b = this._bufPool[i];
      if (b.width === w && b.height === h) { this._bufPool.splice(i, 1); return b; }
    }
    const buf = createGraphics(w, h);
    buf.pixelDensity(1);
    return buf;
  }

  _releaseBakeBuffer(buf) {
    if (!buf) return;
    // Pool only buffers that match the CURRENT bake size — anything else (e.g.
    // the higher-res init bakes retired by the first reduced-scale morph) is
    // freed, so the pool never hoards stale allocations.
    const S = this._paintScale || 1;
    const w = Math.max(1, Math.round(this.mapWidth * S));
    const h = Math.max(1, (this._paintWorldH || this.mapHeight) * S);
    if (buf.width === w && buf.height === h && this._bufPool.length < 3) {
      this._bufPool.push(buf);
    } else if (typeof buf.remove === 'function') {
      buf.remove();
    }
  }

  // --- pure geometry helpers (static, p5-free → tools/bootcheck.js can assert) ----
  static _distToSeg(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
    let t = l2 > 0 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const cx = ax + t * dx, cy = ay + t * dy;
    return Math.hypot(px - cx, py - cy);
  }
  static _distToPolyline(pts, x, y) {
    let m = Infinity;
    for (let i = 0; i + 1 < pts.length; i++) {
      const d = this._distToSeg(x, y, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
      if (d < m) m = d;
    }
    return m;
  }
  static _distToPolyEdges(poly, x, y) {
    let m = Infinity; const n = poly.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const d = this._distToSeg(x, y, poly[i][0], poly[i][1], poly[j][0], poly[j][1]);
      if (d < m) m = d;
    }
    return m;
  }
  // With a skeleton present, soft-compress procedural base elevation above `ceil`
  // so the noise alone can't reach alpine — the ranges do. Pure/static.
  static _compressBase(e, ceil) {
    return e > ceil ? ceil + (e - ceil) * 0.2 : e;
  }

  static _pointInPoly(poly, x, y) {
    let inside = false; const n = poly.length;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / ((yj - yi) || 1e-12) + xi)) inside = !inside;
    }
    return inside;
  }

  /**
   * Pre-bake all 4 seasonal terrain buffers
   */
  _bakeAllSeasonBuffers() {
    const seasons = ['interglacial', 'cooling', 'glacial', 'fullGlacial'];

    // Free the previous bake FIRST. A createGraphics buffer is a real canvas
    // element with GPU-backed storage; dropping the reference does not release
    // it, so re-baking without remove() leaks ~4 MB at 512² every time.
    //
    // This is not theoretical: Kiosk.reseedEvery fires a full Game.init() every
    // 12th attract reset, and 'fit' mode adds one per screen resize. An
    // installation that runs for months will find it — TEMANAWA_BUILD_V3.md
    // §2.3 flags exactly this failure and it was live.
    this.disposeBuffers();

    for (const season of seasons) {
      this.seasonBuffers[season] = this._bakeSeasonBuffer(season);
    }

    if (CONFIG.debugMode) {
      console.log('Pre-baked all 4 seasonal terrain buffers');
    }
  }
  
  // High-resolution PAINT grid — see generate(). Samples the CONTINUOUS terrain
  // (getElevation) at LOOK.bakeScale× the sim grid, with biome, colour, water
  // flag and boundary-edge flag per fine cell. The season bakes render from this,
  // so PAINT resolution is decoupled from the sim's cell budget and the ground
  // reads as smooth curves rather than square grid cells. 34VIEW §4.
  // Largest integer supersample factor whose bake buffer (mapWidth·S × paintWorldH·S)
  // stays within maxPx. Pure + p5-free so tools/bootcheck.js can assert the OOM guard
  // (the harness can't allocate real pixels). Never returns < 1.
  static bakeScaleFor(cellW, cellH, requested, maxPx) {
    const req = Math.max(1, Math.round(requested || 1));
    const cells = Math.max(1, cellW * cellH);
    const maxS = Math.max(1, Math.floor(Math.sqrt(maxPx / cells)));
    return Math.min(req, maxS);
  }

  // The synchronous path (generate / rebake): allocate, then both passes in full.
  // The morph job calls the same three pieces in row bands — one implementation,
  // two schedules, so the sliced result cannot diverge from this one.
  _computePaintGrid() {
    this._paintGridBegin();
    this._paintGridPass1(0, this._paintH);
    this._paintGridPass2(0, this._paintH);
  }

  // Dimensions + allocation. Arrays are REUSED when the size is unchanged
  // (every steady-state morph), so a morph allocates nothing on the sim path.
  _paintGridBegin() {
    const _P = (typeof Projection !== 'undefined') ? Projection : null;
    this._paintK = _P ? _P.K : 1;
    this._paintLIFT = _P ? _P.LIFT : 0;
    this._paintWorldH = Math.max(1, Math.ceil(this.mapHeight * this._paintK + this._paintLIFT));

    // Choose the supersample factor, then HARD-CAP it so the bake buffer can never
    // exceed bakeMaxPixels — createGraphics(...).loadPixels() throws OOM otherwise
    // (Firefox: NS_ERROR_OUT_OF_MEMORY) and takes the whole sim down. A kiosk must not crash.
    const _req = (this._bakeScaleOverride != null) ? this._bakeScaleOverride : ((typeof LOOK !== 'undefined' ? LOOK.bakeScale : 2) || 2);
    const _maxPx = (typeof LOOK !== 'undefined' && LOOK.bakeMaxPixels) || 2200000;
    const S = TerrainGenerator.bakeScaleFor(this.mapWidth, this._paintWorldH, _req, _maxPx);
    if (S < Math.max(1, Math.round(_req))) {
      console.warn(`[terrain] bakeScale ${Math.round(_req)} -> ${S}: capped at ${_maxPx}px/buffer for the ${this.mapWidth}x${this._paintWorldH} grid`);
    }
    this._paintScale = S;
    const PW = this._paintW = Math.max(1, Math.round(this.mapWidth * S));
    const PH = this._paintH = Math.max(1, Math.round(this.mapHeight * S));

    const n = PW * PH;
    if (!this._paintElev || this._paintElev.length !== n) {
      this._paintElev  = new Float32Array(n);
      this._paintR     = new Uint8Array(n);
      this._paintG     = new Uint8Array(n);
      this._paintB     = new Uint8Array(n);
      this._paintWater = new Uint8Array(n);
      this._paintBiome = new Uint8Array(n);
      this._paintEdge  = new Uint8Array(n);
    }
  }

  // Pass 1 — interpolated elevation, biome, base colour (posterized + quieted),
  // water — for paint rows [r0, r1).
  //
  // Elevation is a smooth field the sim already sampled into heightMap. The
  // paint grid BILINEARLY INTERPOLATES that instead of re-evaluating getElevation
  // per fine cell — biome thresholds and relief then cross between samples as
  // smooth curves rather than grid-cell steps (the "higher resolution" win),
  // for a fraction of the cost. (Re-sampling getElevation here was ~10× slower
  // and blew the init budget.)
  _paintGridPass1(r0, r1) {
    const PW = this._paintW, PH = this._paintH, S = this._paintScale;
    const elevA = this._paintElev, colR = this._paintR, colG = this._paintG, colB = this._paintB;
    const waterA = this._paintWater, biomeA = this._paintBiome;

    const invS = 1 / S;
    const wob = LOOK.wobble ? LOOK.wobbleAmp : 0;
    const wobA = wob > 0 ? this._paintWobbleField(PW, PH, S) : null;
    const quiet = LOOK.quiet, qs = LOOK.quietSat, qc = LOOK.quietContrast;

    // River water is flagged by MASK, not elevation, so the channel reads as water at any
    // bed height. The mask is computed from the sim-resolution geo cache (wDist/wBaseW/wType)
    // via bilinear interpolation of distance — no paint-resolution river arrays, so morphs
    // allocate nothing extra and the time-varying strait width comes for free.
    const C = this._geoCache;
    const C_wDist = C ? C.wDist : null;
    const C_wBaseW = C ? C.wBaseW : null;
    const C_wType = C ? C.wType : null;
    const C_wPos = C ? C.wPos : null;
    const C_wMDist = C ? C.wMDist : null;
    const C_wMBaseW = C ? C.wMBaseW : null;
    const riverT = (typeof LOOK !== 'undefined' && LOOK.riverWaterT != null) ? LOOK.riverWaterT : 0.55;
    const riverBankT = (typeof LOOK !== 'undefined' && LOOK.riverBankT != null) ? LOOK.riverBankT : 0.30;
    const riverColorElev = this._waterBiome
      ? this._waterBiome.minElevation + (this._waterBiome.maxElevation - this._waterBiome.minElevation) * 0.5 : 0.05;
    const bedColorElev = this._bedBiome
      ? this._bedBiome.minElevation + (this._bedBiome.maxElevation - this._bedBiome.minElevation) * 0.5 : 0.12;
    const _gt = this._geoT || {};
    const riverTeff = riverT + (1 - (_gt.incision != null ? _gt.incision : 1)) * 0.25;
    const straitW = (typeof LOOK !== 'undefined' && LOOK.straitWidthMult != null) ? LOOK.straitWidthMult : 3.0;
    const straitF = (_gt.straitFactor != null) ? _gt.straitFactor : 0;
    const tribEmg = (_gt.tribEmergence != null) ? _gt.tribEmergence : 1;
    const thin = (typeof LOOK !== 'undefined' && LOOK.tribHighlandThin != null) ? LOOK.tribHighlandThin : 1.6;
    const R_FEATHER = 0.15;

    const heightMap = this.heightMap;
    const GC = this.gridCols, GR = this.gridRows;

    for (let pr = r0; pr < r1; pr++) {
      const wy = pr * invS;
      let y0 = wy | 0; if (y0 > GR - 2) y0 = GR - 2 < 0 ? 0 : GR - 2; if (y0 < 0) y0 = 0;
      let fy = wy - y0; if (fy < 0) fy = 0; else if (fy > 1) fy = 1;
      const rowA = y0 * GC, rowB = (y0 + (GR > 1 ? 1 : 0)) * GC;
      for (let pc = 0; pc < PW; pc++) {
        const i = pr * PW + pc;
        const wx = pc * invS;
        let x0 = wx | 0; if (x0 > GC - 2) x0 = GC - 2 < 0 ? 0 : GC - 2; if (x0 < 0) x0 = 0;
        let fx = wx - x0; if (fx < 0) fx = 0; else if (fx > 1) fx = 1;
        const x1 = x0 + (GC > 1 ? 1 : 0);
        const h00 = heightMap[rowA + x0], h10 = heightMap[rowA + x1];
        const h01 = heightMap[rowB + x0], h11 = heightMap[rowB + x1];
        const e = (h00 * (1 - fx) + h10 * fx) * (1 - fy) + (h01 * (1 - fx) + h11 * fx) * fy;
        elevA[i] = e;

        const eClass = wobA ? e + wobA[i] * wob : e;
        let biome = this.getBiomeFromElevation(eClass);
        let wa = (biome.isWater || biome === this._waterBiome) ? 1 : 0;   // true sea → rendered flat
        let colorElev = eClass;
        if (wa === 0 && C_wDist && this._waterBiome) {
          // Bilinear distance from sim-resolution geo cache
          const d00 = C_wDist[rowA + x0], d10 = C_wDist[rowA + x1];
          const d01 = C_wDist[rowB + x0], d11 = C_wDist[rowB + x1];
          const dist = (d00 * (1 - fx) + d10 * fx) * (1 - fy) + (d01 * (1 - fx) + d11 * fx) * fy;
          // Nearest-neighbor for discrete type / base width
          const ni = (fy < 0.5 ? rowA : rowB) + (fx < 0.5 ? x0 : x1);
          const wt = C_wType[ni];          // 0 = main, 1 = tributary
          let effW = C_wBaseW[ni];
          if (wt === 0) effW *= (1 + (straitW - 1) * straitF);
          if (dist < effW) {
            const tt = 1 - dist / effW;
            const m = tt * tt * (3 - 2 * tt);                                  // smoothstep mask
            // Bilinear position along polyline
            const p00 = C_wPos[rowA + x0], p10 = C_wPos[rowA + x1];
            const p01 = C_wPos[rowB + x0], p11 = C_wPos[rowB + x1];
            const pos = (p00 * (1 - fx) + p10 * fx) * (1 - fy) + (p01 * (1 - fx) + p11 * fx) * fy;
            const cellEmg = (wt === 1) ? tribEmg : 1.0;
            const front = (cellEmg - pos + R_FEATHER) / R_FEATHER;
            if (front > 0) {
              const fs = front >= 1 ? 1 : front * front * (3 - 2 * front);
              let wT = riverTeff + (1 - fs) * (1 - riverTeff);
              let bT = riverBankT + (1 - fs) * (1 - riverBankT);
              // Highland thinning — same rule as _rebuildBiomeMap: tributary water
              // narrows to a thread with elevation; no perched water/beach on ridges.
              if (wt === 1 && thin > 0 && eClass > 0.30) {
                const hi = (eClass - 0.30) * thin;
                wT += hi; bT += hi * 0.8;
              }
              if (m >= wT) { biome = this._waterBiome; colorElev = riverColorElev; wa = 2; }
              else if (m >= bT && this._bedBiome) { biome = this._bedBiome; colorElev = bedColorElev; }
            }
          }
          // Seam fallback (same rule as _rebuildBiomeMap): a gated tributary cell inside
          // the strait-widened MAIN channel takes the main's paint, so the strait's
          // water/banks don't cut off along the margin-selection seam.
          if (wa === 0 && biome !== this._bedBiome && C_wType[ni] === 1 && C_wMDist) {
            const dM00 = C_wMDist[rowA + x0], dM10 = C_wMDist[rowA + x1];
            const dM01 = C_wMDist[rowB + x0], dM11 = C_wMDist[rowB + x1];
            const dM = (dM00 * (1 - fx) + dM10 * fx) * (1 - fy) + (dM01 * (1 - fx) + dM11 * fx) * fy;
            const effWM = C_wMBaseW[ni] * (1 + (straitW - 1) * straitF);
            if (dM < effWM) {
              const tt2 = 1 - dM / effWM;
              const mM = tt2 * tt2 * (3 - 2 * tt2);
              if (mM >= riverTeff) { biome = this._waterBiome; colorElev = riverColorElev; wa = 2; }
              else if (mM >= riverBankT && this._bedBiome) { biome = this._bedBiome; colorElev = bedColorElev; }
            }
          }
        }
        biomeA[i] = this.biomeIndexByKey[biome.key];
        waterA[i] = wa;

        const c = this.getColor(colorElev, biome);
        let cr = red(c), cg = green(c), cb = blue(c);
        if (quiet) {
          const gray = cr * 0.3 + cg * 0.59 + cb * 0.11;
          cr = 128 + ((cr + (gray - cr) * qs) - 128) * qc;
          cg = 128 + ((cg + (gray - cg) * qs) - 128) * qc;
          cb = 128 + ((cb + (gray - cb) * qs) - 128) * qc;
        }
        colR[i] = cr < 0 ? 0 : cr > 255 ? 255 : cr;
        colG[i] = cg < 0 ? 0 : cg > 255 ? 255 : cg;
        colB[i] = cb < 0 ? 0 : cb > 255 ? 255 : cb;
      }
    }
  }

  // Pass 2 — boundary edges: 0 none, 1 biome-ink, 2 shoreline (water≠land, wins)
  // — for paint rows [r0, r1). Reads one row above/below, so the morph job runs
  // it only after pass 1 has finished the WHOLE grid.
  _paintGridPass2(r0, r1) {
    const PW = this._paintW, PH = this._paintH;
    const biomeA = this._paintBiome, waterA = this._paintWater, edgeA = this._paintEdge;
    for (let pr = r0; pr < r1; pr++) {
      for (let pc = 0; pc < PW; pc++) {
        const i = pr * PW + pc;
        const bi = biomeA[i], wi = waterA[i];
        let edge = 0;
        if (pc > 0)                    { const j = i - 1;  if (biomeA[j] !== bi) edge = (waterA[j] !== wi) ? 2 : (edge || 1); }
        if (edge !== 2 && pc < PW - 1) { const j = i + 1;  if (biomeA[j] !== bi) edge = (waterA[j] !== wi) ? 2 : (edge || 1); }
        if (edge !== 2 && pr > 0)      { const j = i - PW; if (biomeA[j] !== bi) edge = (waterA[j] !== wi) ? 2 : (edge || 1); }
        if (edge !== 2 && pr < PH - 1) { const j = i + PW; if (biomeA[j] !== bi) edge = (waterA[j] !== wi) ? 2 : (edge || 1); }
        edgeA[i] = edge;
      }
    }
  }

  /**
   * Bake one season's terrain buffer at PAINT resolution (bakeScale×): one
   * physical pixel per paint cell, via a near-to-far ceiling painter that
   * projects the relief, blends snow, strokes ink/shore, shades slopes and fades
   * the sky. The buffer is S× the world footprint (drawn back down in render()),
   * so nothing per-frame changes.
   *
   * Split into begin / columns / end so the morph job can run it in column
   * bands (each pc column is independent). This synchronous wrapper is the
   * generate()/rebake path — same pieces, one schedule.
   */
  _bakeSeasonBuffer(seasonKey) {
    const st = this._bakeSeasonBegin(seasonKey);
    this._bakeSeasonColumns(st, 0, this._paintW);
    return this._bakeSeasonEnd(st);
  }

  // Snapshot every constant the column painter needs, acquire the target buffer
  // (pooled when a same-size one was retired), and open its pixel array.
  _bakeSeasonBegin(seasonKey) {
    const K = this._paintK, LIFT = this._paintLIFT, S = this._paintScale;
    const PW = this._paintW, PH = this._paintH;
    const bufWorldH = this._paintWorldH;

    const buf = this._acquireBakeBuffer(this.mapWidth * S, bufWorldH * S);
    buf.loadPixels();

    const snowColorsRGB = this._snowColorsRGB;
    const hasSnow = this._snowBiome && snowColorsRGB;

    const shoreC = this._getCachedColor(LOOK.shoreColor);
    const hazeC = this._getCachedColor(LOOK.hazeColor);
    const reC = this._getCachedColor(LOOK.reliefEdgeColor);

    return {
      seasonKey, buf, px: buf.pixels,
      K, LIFT, S, PW, PH,
      fullWidth: PW,
      fullHeight: bufWorldH * S,
      elevA: this._paintElev, colR: this._paintR, colG: this._paintG, colB: this._paintB,
      waterA: this._paintWater, edgeA: this._paintEdge, biomeA: this._paintBiome,
      snowColorsRGB, hasSnow,
      snowLine: this.seasonSnowLines[seasonKey],
      permanentSnowLine: hasSnow ? this._snowBiome.minElevation : 1.0,
      shoreR: red(shoreC), shoreG: green(shoreC), shoreB: blue(shoreC),
      hazeR: red(hazeC), hazeG: green(hazeC), hazeB: blue(hazeC),
      invS: 1 / S,
      SHADE: LOOK.shade ? LOOK.shadeStrength : 0,
      STEPS: LOOK.shade ? (LOOK.shadeSteps | 0) : 0,   // cel bands (>= 2 = flat toon steps)
      SHLO: LOOK.shadeShadow, SHHI: LOOK.shadeHigh,
      TOPBAND: Math.max(1, Math.round(1.5 * S)),       // lit top-surface thickness, px
      CLIFF: 3 * S,
      reliefEdgeOn: LOOK.reliefEdge,
      reR: red(reC), reG: green(reC), reB: blue(reC),
      EDGEW: Math.max(1, Math.round(1.3 * S)),         // relief outline thickness, px
      jit: LOOK.outlines ? LOOK.outlineJitter : 0
    };
  }

  _bakeSeasonEnd(st) {
    // The job painted into st.px — the pixels array snapshotted at begin. A sliced
    // bake holds it across MANY frames, and in real p5 any intervening loadPixels
    // (or canvas resize) on this graphics replaces buf.pixels with a fresh blank
    // snapshot; updatePixels would then push the blank one and the season swaps in
    // TRANSPARENT (seen in the browser as terrain vanishing after a morph). If the
    // array was swapped out from under us, copy the painted data back in first.
    if (st.buf.pixels !== st.px && st.buf.pixels && st.buf.pixels.length === st.px.length) {
      st.buf.pixels.set(st.px);
    }
    st.buf.updatePixels();
    return st.buf;
  }

  // Paint columns [c0, c1). Every pixel of a column is written exactly once
  // (terrain bands, then the sky above the far ridge), so a pooled buffer needs
  // no clearing and a resumed job leaves no seams.
  _bakeSeasonColumns(st, c0, c1) {
    const { K, LIFT, S, PW, PH, px, fullWidth, fullHeight,
            elevA, colR, colG, colB, waterA, edgeA, biomeA,
            snowColorsRGB, hasSnow, snowLine, permanentSnowLine,
            shoreR, shoreG, shoreB, hazeR, hazeG, hazeB,
            invS, SHADE, STEPS, SHLO, SHHI, TOPBAND, CLIFF,
            reliefEdgeOn, reR, reG, reB, EDGEW, jit } = st;

    for (let pc = c0; pc < c1; pc++) {
      let ceiling = fullHeight;
      let farR = 0, farG = 0, farB = 0, painted = false;

      for (let pr = PH - 1; pr >= 0; pr--) {             // near → far
        const i = pr * PW + pc;
        const e = elevA[i];
        let liftE = (waterA[i] === 1) ? 0 : e;   // only true sea is flat; river (2) rides the terrain so entities sit on it
        // Taper relief toward zero near the coast so the ceiling painter doesn't
        // render blocky cliff faces at the water's edge. Cells below COAST_LO get
        // no lift (flat like sea); cells above COAST_HI get full relief; between
        // them it ramps linearly. Paint-only — terrain shape / biomes unchanged.
        if (liftE > 0 && liftE < 0.25) {
          const ct = (liftE - 0.10) / 0.15;   // 0 at sea threshold, 1 at grassland
          liftE *= ct < 0 ? 0 : ct > 1 ? 1 : ct;
        }

        let yTop = ((pr * invS) * K - liftE * LIFT + LIFT) * S | 0;   // physical buffer px
        if (yTop < 0) yTop = 0;
        if (yTop >= ceiling) continue;                   // occluded by nearer terrain

        // ---- season colour for this paint cell ----
        let cr = colR[i], cg = colG[i], cb = colB[i];

        if (hasSnow && e >= snowLine && waterA[i] !== 2) {   // no snow cap on a river riding high ground
          let cov;
          if (e >= permanentSnowLine) cov = 1.0;
          else { const range = permanentSnowLine - snowLine; cov = range > 0 ? 0.4 + ((e - snowLine) / range) * 0.6 : 1.0; }
          cov = Math.min(1, cov + (Math.sin(e * 847 + pc * invS * 0.13 + pr * invS * 0.17) * 0.5 + 0.5) * 0.12);
          const sRGB = snowColorsRGB[Math.min(snowColorsRGB.length - 1, (cov * snowColorsRGB.length) | 0)];
          cr = cr + (sRGB[0] - cr) * cov; cg = cg + (sRGB[1] - cg) * cov; cb = cb + (sRGB[2] - cb) * cov;
        }

        const edge = edgeA[i];
        if (edge === 1 && LOOK.outlines) {
          const oc = this._getCachedColor(this.biomeArray[biomeA[i]].outlineColor || LOOK.outlineColor);
          let orr = red(oc), ogg = green(oc), obb = blue(oc);
          if (jit > 0) {
            const ink = 1 - jit * (1 - noise(pc * invS * 0.5 + this.seed, pr * invS * 0.5 + this.seed));
            orr = cr + (orr - cr) * ink; ogg = cg + (ogg - cg) * ink; obb = cb + (obb - cb) * ink;
          }
          cr = orr; cg = ogg; cb = obb;
        } else if (edge === 2 && LOOK.shore) {
          cr = shoreR; cg = shoreG; cb = shoreB;
        }

        // Cel / toon shading: a directional (NW-lit) slope term, QUANTIZED into a
        // few flat bands so the ground shades in light/mid/shadow STEPS like the
        // tree sprites — not a smooth gradient. Light from the NW (the fixed wind
        // and sprite light axis, SPRITE_BRIEF §1.1). Per world-unit slope (× S) so
        // it is bakeScale-independent.
        const eN = (pr > 0) ? elevA[i - PW] : e;
        const eW = (pc > 0) ? elevA[i - 1] : e;
        let sh = 1 - ((e - eN) + (e - eW)) * 0.5 * S * SHADE;
        if (sh < SHLO) sh = SHLO; else if (sh > SHHI) sh = SHHI;
        if (STEPS >= 2) {
          const b = Math.min(STEPS - 1, ((sh - SHLO) / (SHHI - SHLO)) * STEPS | 0);
          sh = SHLO + (SHHI - SHLO) * (b / (STEPS - 1));
        }
        let tr = (cr * sh) | 0, tg = (cg * sh) | 0, tb = (cb * sh) | 0;
        if (tr > 255) tr = 255; if (tg > 255) tg = 255; if (tb > 255) tb = 255;
        const fr = (tr * 0.6) | 0, fg = (tg * 0.6) | 0, fb = (tb * 0.6) | 0;   // side / cliff face

        const isFront = (pr === PH - 1);
        // A prominent rise (its top pokes well above the nearer terrain) gets a
        // bold dark OUTLINE along its top silhouette — the terrain equivalent of
        // the tree sprites' ink line, so relief forms read the same way.
        const isEdge = reliefEdgeOn && !isFront && (ceiling - yTop) > CLIFF;
        const lip = isEdge ? EDGEW : 0;

        for (let y = yTop; y < ceiling; y++) {
          const band = y - yTop;
          let rr, gg, bb;
          if (band < lip) { rr = reR; gg = reG; bb = reB; }        // bold dark relief outline (silhouette)
          else if (isFront) { rr = tr; gg = tg; bb = tb; }
          else if (band < TOPBAND) { rr = tr; gg = tg; bb = tb; }
          else { rr = fr; gg = fg; bb = fb; }
          const pi = (y * fullWidth + pc) * 4;
          px[pi] = rr; px[pi + 1] = gg; px[pi + 2] = bb; px[pi + 3] = 255;
        }
        ceiling = yTop;
        farR = tr; farG = tg; farB = tb; painted = true;
      }

      // Sky above the far ridge → blend the ridge colour up to a uniform haze.
      if (ceiling > 0) {
        for (let y = 0; y < ceiling; y++) {
          let rr, gg, bb;
          if (LOOK.haze && painted) {
            const t = y / ceiling, tt = t * t, inv = 1 - tt;
            rr = (hazeR * inv + farR * tt) | 0;
            gg = (hazeG * inv + farG * tt) | 0;
            bb = (hazeB * inv + farB * tt) | 0;
          } else { rr = hazeR; gg = hazeG; bb = hazeB; }
          const pi = (y * fullWidth + pc) * 4;
          px[pi] = rr; px[pi + 1] = gg; px[pi + 2] = bb; px[pi + 3] = 255;
        }
      }
    }
  }

  regenerate() {
    this.seed = random(10000);
    this._colorCache.clear();
    this.generate();
  }

  // Release every GPU-backed buffer this generator owns. Safe to call twice.
  // _bakeAllSeasonBuffers() calls it before re-baking; Game.refitTerrain()
  // calls it before throwing the whole generator away.
  disposeBuffers() {
    for (const key in this.seasonBuffers) {
      const buf = this.seasonBuffers[key];
      if (buf && typeof buf.remove === 'function') buf.remove();
      this.seasonBuffers[key] = null;
    }
    // The morph machinery's canvases are just as GPU-backed as the fronts:
    // drain the back-buffer pool, drop the crossfade's retired buffer, and
    // cancel any job mid-bake (its unfinished back buffer is in job.st).
    for (const b of this._bufPool) {
      if (b && typeof b.remove === 'function') b.remove();
    }
    this._bufPool.length = 0;
    if (this._morphFade) {
      const fb = this._morphFade.buf;
      if (fb && typeof fb.remove === 'function') fb.remove();
      this._morphFade = null;
    }
    if (this._morphJob) {
      const st = this._morphJob.st;
      if (st && st.buf && typeof st.buf.remove === 'function') st.buf.remove();
      this._morphJob = null;
    }
  }
  
  /**
   * Render terrain - just draws pre-baked buffers with crossfade
   * This is EXTREMELY fast - no computation, just image drawing
   */
  render() {
    // Anti-alias the baked ground as it scales to the panel. The buffer is baked
    // at bakeScale× and drawn under the 2.5× camera, so bakeScale>2.5 minifies it;
    // with smoothing that downsample turns the raster ink+fill into curved edges.
    // smoothScale=false → crisp nearest-neighbour (the pixel look). Saved/restored
    // so sprites and HUD keep whatever the frame set.
    const _dc = drawingContext, _ps = _dc.imageSmoothingEnabled, _pq = _dc.imageSmoothingQuality;
    const _sm = (typeof LOOK === 'undefined') ? true : LOOK.smoothScale !== false;
    _dc.imageSmoothingEnabled = _sm;
    if (_sm && 'imageSmoothingQuality' in _dc) _dc.imageSmoothingQuality = 'high';

    // Morph crossfade: when the incremental morph swapped the on-screen bake,
    // draw the retired buffer underneath and ease the fresh land in on top over
    // >= 500 ms (smoothstepped), so a whole-frame luminance change never lands
    // as a cut — the photosensitivity budget, TEMANAWA_BUILD_V3.md §5.2. When
    // the fade ends the retired buffer is recycled into the bake pool.
    const drawW = this.mapWidth, drawH = this._paintWorldH || this.mapHeight;
    let fadeAlpha = 1;
    const mf = this._morphFade;
    if (mf) {
      const nowMs = (typeof millis === 'function') ? millis() : Date.now();
      const t = (nowMs - mf.t0) / mf.ms;
      if (t >= 1) {
        this._releaseBakeBuffer(mf.buf);
        this._morphFade = null;
      } else {
        image(mf.buf, 0, 0, drawW, drawH);
        const tt = t < 0 ? 0 : t;
        fadeAlpha = tt * tt * (3 - 2 * tt);   // eased ramp, no step
      }
    }
    const _ga = _dc.globalAlpha;
    if (fadeAlpha < 1) _dc.globalAlpha = fadeAlpha;

    if (!this.seasonManager) {
      // No phase manager - just draw the interglacial. The buffer is bakeScale× the world
      // footprint, so draw it at (mapWidth × paintWorldH) — p5 downsamples the S×
      // detail into the footprint, then the view zoom scales it up (higher-res).
      image(this.seasonBuffers.interglacial, 0, 0, drawW, drawH);
      _dc.globalAlpha = _ga;
      _dc.imageSmoothingEnabled = _ps; if ('imageSmoothingQuality' in _dc) _dc.imageSmoothingQuality = _pq;
      return;
    }

    const currentKey = this.seasonManager.currentKey;
    const transitionProgress = this.seasonManager.transitionProgress;

    if (transitionProgress < 0.01) {
      // No transition - just draw current season
      image(this.seasonBuffers[currentKey], 0, 0, drawW, drawH);
    } else {
      // Crossfade between current and next season
      const nextKey = this.seasonManager.nextKey;

      // Draw current season
      image(this.seasonBuffers[currentKey], 0, 0, drawW, drawH);

      // Draw next season with alpha — globalAlpha, not tint(), so p5 skips the
      // per-call tinted-canvas composite (#7). The buffers are opaque, so the
      // crossfade is identical at a fraction of the cost. (Multiplied by the
      // morph fade so a mid-fade season transition composites sensibly.)
      _dc.globalAlpha = transitionProgress * fadeAlpha;
      image(this.seasonBuffers[nextKey], 0, 0, drawW, drawH);
    }
    _dc.globalAlpha = _ga;
    _dc.imageSmoothingEnabled = _ps; if ('imageSmoothingQuality' in _dc) _dc.imageSmoothingQuality = _pq;
  }
  
  // ============================================
  // MINIMAP SUPPORT
  // ============================================
  
  getTerrainBuffer() {
    if (!this.seasonManager) return this.seasonBuffers.interglacial;
    return this.seasonBuffers[this.seasonManager.currentKey];
  }
  
  getDimensions() {
    return {
      width: this.mapWidth,
      height: this.mapHeight,
      worldWidth: this.worldWidth,
      worldHeight: this.worldHeight
    };
  }
}