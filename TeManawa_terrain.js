// ============================================================================
// LOOK — the terrain look-development control surface (bake-time)
// md/TEMANAWA_34VIEW_PLAN.md §7
// ============================================================================
// Every knob for the "pixel topo map → cartoon illustration" ground, in ONE place.
// All of it is applied during the season bake, never per frame.
//
// FAST ITERATION — no page reload:
//   1. Tweak in the browser console, e.g.
//        LOOK.shadeStrength = 12          // gentler shading
//        LOOK.outlines = false            // turn a whole move OFF to see it
//        LOOK.hazeColor = '#101820'
//        Projection.K = 0.8               // the 3/4 tilt lives on Projection
//   2. Press  B   (or run  game.rebakeTerrain()  ) to re-bake in place — no reload,
//      no ecosystem reset, same land.
//   LOOK.dump() prints the current settings. Each on/off toggle ISOLATES one move,
//   so you can see exactly what each contributes and dial them one at a time.
const LOOK = {
  // ---- on / off — flip a move off to see what it does ----
  posterize: true,   // flat cel tones (vs a smooth gradient ramp)
  wobble:    true,   // biome borders wander like a brush (vs clean elevation bands)
  outlines:  true,   // ink stroke along biome boundaries (replaces contour lines)
  shore:     true,   // pale stroke at the water's edge
  shade:     true,   // slope shading of the lit tops
  haze:      true,   // atmospheric fade in the sky above the far ridge
  quiet:     true,   // desaturate the ground so the outlined sprites read first
  reliefEdge: true,  // bold dark outline along relief steps/cliff tops (like the sprite outlines)

  // ---- amounts (used only when the matching toggle is on) ----
  wobbleAmp:     0.025,  // border wander, in elevation units
  wobbleFreq:    0.18,   // spatial frequency of the wander
  quietSat:      0.16,   // 0 = full colour ground, 1 = greyscale
  quietContrast: 0.92,   // <1 compresses ground contrast toward mid-grey
  shadeStrength: 50.0,   // slope-shading gain (feeds the cel bands below)
  shadeSteps:    3,      // CEL bands: 0/1 = smooth gradient, 2–4 = flat toon steps (match the sprites)
  shadeShadow:   0.68,   // darkest cel band (shadow side) — multiplier on the ground colour
  shadeHigh:     1.22,   // lightest cel band (NW-lit highlight) — multiplier
  bakeScale:     2,      // PAINT resolution vs the sim grid: 2 = free 2× (same memory);
                         //   3–4 = sharper, but slower to bake + more memory. Press B to apply.
  hazeStrength:  100000.5,    // north-atmosphere overlay opacity at the top edge (0..1)
  hazeHeight:    0.45,   // how far down the map the atmosphere fades (fraction of height)
  outlineJitter: .35,   // hand-inked lineweight variation on the boundary ink (0 = uniform)

  // ---- colours ----
  hazeColor:    '#20303a', // uniform tone the sky fades to (keeps the top streak-free)
  outlineColor: '#16210f', // fallback boundary ink (a biome's own `outlineColor` wins)
  shoreColor:   '#dfe9ef', // shoreline stroke
  reliefEdgeColor: '#0e1712', // bold dark outline on relief steps (matches the sprite ink)

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
    
    // Pre-baked seasonal buffers (created once at generation)
    this.seasonBuffers = {
      summer: null,
      autumn: null,
      winter: null,
      spring: null
    };
    
    // Snow line per season (pre-defined)
    this.seasonSnowLines = {
      summer: 0.92,
      autumn: 0.85,
      winter: 0.77,
      spring: 0.82
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
    
    this._initBiomeIndex();
    this._colorCache = new Map();
    this._snowColorsRGB = null;
    
    // Base cell colors (computed once, reused for all seasons)
    this._baseCellColors = null;
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
    
    for (const biome of this.biomeList) {
      // Water: the lowest non-walkable biome, or anything flagged isWater
      if (biome.isWater || (!biome.walkable && biome.maxElevation <= 0.15)) {
        if (!this._waterBiome || biome.minElevation < this._waterBiome.minElevation) {
          this._waterBiome = biome;
        }
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
      falloff = 0.13 + Math.pow(landProgress, 0.7) * 0.87;
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
    return Math.max(0, Math.min(1, elevation));
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
    const gridCols = this.gridCols;
    const gridRows = this.gridRows;
    const totalCells = gridCols * gridRows;
    const scale = this.scale;
    
    this.heightMap = new Float32Array(totalCells);
    this.biomeIndexMap = new Uint8Array(totalCells);
    
    // Generate height map
    let idx = 0;
    for (let row = 0; row < gridRows; row++) {
      const y = row * scale;
      for (let col = 0; col < gridCols; col++) {
        this.heightMap[idx] = this.getElevation(col * scale, y);
        idx++;
      }
    }
    
    // Generate biome map
    idx = 0;
    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        const elevation = this.heightMap[idx];
        // Wobble the band threshold with high-frequency noise so biome borders
        // wander like a brush line instead of following clean elevation contours.
        // Only the COLOUR classification wobbles; the height map (walkability and
        // relief) is left exactly as generated.
        const w = LOOK.wobble ? LOOK.wobbleAmp : 0;
        const eClass = w > 0
          ? elevation + (noise(col * LOOK.wobbleFreq + this.seed * 5,
                               row * LOOK.wobbleFreq + this.seed * 7) * 2 - 1) * w
          : elevation;
        let biome = this.getBiomeFromElevation(eClass);
        // water type handling (lake or sea)
        if (biome === this.biomeList[1] && this._waterBiome) {
          if (!this.hasAdjacentWater(row, col)) {
            biome = this._fallbackBiome;
          }
        }

        this.biomeIndexMap[idx] = this.biomeIndexByKey[biome.key];
        idx++;
      }
    }
    
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
  
  /**
   * Compute base terrain colors once (reused for all seasons)
   */
  _computeBaseCellColors() {
    const gridCols = this.gridCols;
    const gridRows = this.gridRows;
    const totalCells = gridCols * gridRows;
    
    // Store RGB + contour flag for each cell
    this._baseCellColors = new Uint8Array(totalCells * 4); // R, G, B, isContour
    
    const showContours = this.config.showContours;
    const contourInterval = this.config.contourInterval;
    
    let idx = 0;
    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        const cellIdx = row * gridCols + col;
        const elevation = this.heightMap[cellIdx];
        const biomeIdx = this.biomeIndexMap[cellIdx];
        const biome = this.biomeArray[biomeIdx];
        
        const c = this.getColor(elevation, biome);
        const colorIdx = cellIdx * 4;

        // Quieter ground: desaturate toward grey and compress contrast so the
        // outlined, saturated sprites read first ("illustration reads sprite-
        // first", md/TEMANAWA_34VIEW_PLAN.md §7).
        let cr = red(c), cg = green(c), cb = blue(c);
        if (LOOK.quiet) {
          const gray = cr * 0.3 + cg * 0.59 + cb * 0.11;
          const qs = LOOK.quietSat, qc = LOOK.quietContrast;
          cr = 128 + ((cr + (gray - cr) * qs) - 128) * qc;
          cg = 128 + ((cg + (gray - cg) * qs) - 128) * qc;
          cb = 128 + ((cb + (gray - cb) * qs) - 128) * qc;
        }
        this._baseCellColors[colorIdx]     = cr < 0 ? 0 : cr > 255 ? 255 : cr;
        this._baseCellColors[colorIdx + 1] = cg < 0 ? 0 : cg > 255 ? 255 : cg;
        this._baseCellColors[colorIdx + 2] = cb < 0 ? 0 : cb > 255 ? 255 : cb;

        // Check if this is a contour line
        if (showContours) {
          const mod = elevation % contourInterval;
          this._baseCellColors[colorIdx + 3] = (mod < 0.008 || mod > contourInterval - 0.008) ? 1 : 0;
        } else {
          this._baseCellColors[colorIdx + 3] = 0;
        }
      }
    }
  }

  // Mark biome-boundary cells for the ink / shoreline strokes drawn in the bake.
  //   0 = interior · 1 = ink outline (biome ≠ neighbour) · 2 = shoreline (water
  //   meets land, and it wins over ink). This is what replaces contour lines as
  //   the ground's linework (md/TEMANAWA_34VIEW_PLAN.md §7).
  _computeEdgeFlags() {
    const gridCols = this.gridCols, gridRows = this.gridRows;
    const bmap = this.biomeIndexMap, arr = this.biomeArray;
    const isWater = (bi) => { const b = arr[bi]; return b.isWater || b === this._waterBiome; };
    this._edgeFlags = new Uint8Array(gridCols * gridRows);

    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        const i = row * gridCols + col;
        const bi = bmap[i];
        const wi = isWater(bi);
        let edge = 0;
        // 4-neighbourhood; a water/land seam becomes a shoreline (2), any other
        // biome change becomes ink (1). Shore wins.
        const test = (ni) => {
          const bn = bmap[ni];
          if (bn === bi) return;
          if (isWater(bn) !== wi) edge = 2;
          else if (edge === 0) edge = 1;
        };
        if (col > 0) test(i - 1);
        if (col < gridCols - 1) test(i + 1);
        if (row > 0) test(i - gridCols);
        if (row < gridRows - 1) test(i + gridCols);
        this._edgeFlags[i] = edge;
      }
    }
  }

  /**
   * Pre-bake all 4 seasonal terrain buffers
   */
  _bakeAllSeasonBuffers() {
    const seasons = ['summer', 'autumn', 'winter', 'spring'];

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
  _computePaintGrid() {
    const _P = (typeof Projection !== 'undefined') ? Projection : null;
    this._paintK = _P ? _P.K : 1;
    this._paintLIFT = _P ? _P.LIFT : 0;
    this._paintWorldH = Math.max(1, Math.ceil(this.mapHeight * this._paintK + this._paintLIFT));

    const S = Math.max(1, Math.round((typeof LOOK !== 'undefined' ? LOOK.bakeScale : 2) || 2));
    this._paintScale = S;
    const PW = this._paintW = Math.max(1, Math.round(this.mapWidth * S));
    const PH = this._paintH = Math.max(1, Math.round(this.mapHeight * S));

    const n = PW * PH;
    const elevA  = this._paintElev  = new Float32Array(n);
    const colR   = this._paintR     = new Uint8Array(n);
    const colG   = this._paintG     = new Uint8Array(n);
    const colB   = this._paintB     = new Uint8Array(n);
    const waterA = this._paintWater = new Uint8Array(n);
    const biomeA = this._paintBiome = new Uint8Array(n);
    const edgeA  = this._paintEdge  = new Uint8Array(n);

    const invS = 1 / S;
    const wob = LOOK.wobble ? LOOK.wobbleAmp : 0;
    const wobFreq = LOOK.wobbleFreq;
    const quiet = LOOK.quiet, qs = LOOK.quietSat, qc = LOOK.quietContrast;

    // Elevation is a smooth field the sim already sampled into heightMap. The
    // paint grid BILINEARLY INTERPOLATES that instead of re-evaluating getElevation
    // per fine cell — biome thresholds and relief then cross between samples as
    // smooth curves rather than grid-cell steps (the "higher resolution" win),
    // for a fraction of the cost. (Re-sampling getElevation here was ~10× slower
    // and blew the init budget.)
    const heightMap = this.heightMap;
    const GC = this.gridCols, GR = this.gridRows;

    // Pass 1 — interpolated elevation, biome, base colour (posterized + quieted), water.
    for (let pr = 0; pr < PH; pr++) {
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

        const eClass = wob > 0
          ? e + (noise(wx * wobFreq + this.seed * 5, wy * wobFreq + this.seed * 7) * 2 - 1) * wob
          : e;
        const biome = this.getBiomeFromElevation(eClass);
        biomeA[i] = this.biomeIndexByKey[biome.key];
        waterA[i] = (biome.isWater || biome === this._waterBiome) ? 1 : 0;

        const c = this.getColor(eClass, biome);
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

    // Pass 2 — boundary edges: 0 none, 1 biome-ink, 2 shoreline (water≠land, wins).
    for (let pr = 0; pr < PH; pr++) {
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
   */
  _bakeSeasonBuffer(seasonKey) {
    const K = this._paintK, LIFT = this._paintLIFT, S = this._paintScale;
    const PW = this._paintW, PH = this._paintH;
    const bufWorldH = this._paintWorldH;

    const buf = createGraphics(this.mapWidth * S, bufWorldH * S);
    buf.pixelDensity(1);
    buf.loadPixels();
    const px = buf.pixels;
    const fullWidth = PW;
    const fullHeight = bufWorldH * S;

    const elevA = this._paintElev, colR = this._paintR, colG = this._paintG, colB = this._paintB;
    const waterA = this._paintWater, edgeA = this._paintEdge, biomeA = this._paintBiome;

    const snowColorsRGB = this._snowColorsRGB;
    const hasSnow = this._snowBiome && snowColorsRGB;
    const snowLine = this.seasonSnowLines[seasonKey];
    const permanentSnowLine = hasSnow ? this._snowBiome.minElevation : 1.0;

    const shoreC = this._getCachedColor(LOOK.shoreColor);
    const shoreR = red(shoreC), shoreG = green(shoreC), shoreB = blue(shoreC);
    const hazeC = this._getCachedColor(LOOK.hazeColor);
    const hazeR = red(hazeC), hazeG = green(hazeC), hazeB = blue(hazeC);

    const invS = 1 / S;
    const SHADE = LOOK.shade ? LOOK.shadeStrength : 0;
    const STEPS = LOOK.shade ? (LOOK.shadeSteps | 0) : 0;   // cel bands (>= 2 = flat toon steps)
    const SHLO = LOOK.shadeShadow, SHHI = LOOK.shadeHigh;
    const TOPBAND = Math.max(1, Math.round(1.5 * S));   // lit top-surface thickness, px
    const CLIFF = 3 * S;
    const reliefEdgeOn = LOOK.reliefEdge;
    const reC = this._getCachedColor(LOOK.reliefEdgeColor);
    const reR = red(reC), reG = green(reC), reB = blue(reC);
    const EDGEW = Math.max(1, Math.round(1.3 * S));     // relief outline thickness, px
    const jit = LOOK.outlines ? LOOK.outlineJitter : 0;

    for (let pc = 0; pc < PW; pc++) {
      let ceiling = fullHeight;
      let farR = 0, farG = 0, farB = 0, painted = false;

      for (let pr = PH - 1; pr >= 0; pr--) {             // near → far
        const i = pr * PW + pc;
        const e = elevA[i];
        const liftE = waterA[i] ? 0 : e;

        let yTop = ((pr * invS) * K - liftE * LIFT + LIFT) * S | 0;   // physical buffer px
        if (yTop < 0) yTop = 0;
        if (yTop >= ceiling) continue;                   // occluded by nearer terrain

        // ---- season colour for this paint cell ----
        let cr = colR[i], cg = colG[i], cb = colB[i];

        if (hasSnow && e >= snowLine) {
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

    buf.updatePixels();
    return buf;
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
  }
  
  /**
   * Render terrain - just draws pre-baked buffers with crossfade
   * This is EXTREMELY fast - no computation, just image drawing
   */
  render() {
    if (!this.seasonManager) {
      // No season manager - just draw summer. The buffer is bakeScale× the world
      // footprint, so draw it at (mapWidth × paintWorldH) — p5 downsamples the S×
      // detail into the footprint, then the view zoom scales it up (higher-res).
      image(this.seasonBuffers.summer, 0, 0, this.mapWidth, this._paintWorldH || this.mapHeight);
      return;
    }
    
    const currentKey = this.seasonManager.currentKey;
    const transitionProgress = this.seasonManager.transitionProgress;
    
    if (transitionProgress < 0.01) {
      // No transition - just draw current season
      image(this.seasonBuffers[currentKey], 0, 0, this.mapWidth, this._paintWorldH || this.mapHeight);
    } else {
      // Crossfade between current and next season
      const nextKey = this.seasonManager.nextKey;
      
      // Draw current season
      image(this.seasonBuffers[currentKey], 0, 0, this.mapWidth, this._paintWorldH || this.mapHeight);
      
      // Draw next season with alpha
      push();
      tint(255, transitionProgress * 255);
      image(this.seasonBuffers[nextKey], 0, 0, this.mapWidth, this._paintWorldH || this.mapHeight);
      noTint();
      pop();
    }
  }
  
  // ============================================
  // MINIMAP SUPPORT
  // ============================================
  
  getTerrainBuffer() {
    if (!this.seasonManager) return this.seasonBuffers.summer;
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