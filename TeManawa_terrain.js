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

  // ---- amounts (used only when the matching toggle is on) ----
  wobbleAmp:     0.025,  // border wander, in elevation units
  wobbleFreq:    0.18,   // spatial frequency of the wander
  quietSat:      0.16,   // 0 = full colour ground, 1 = greyscale
  quietContrast: 0.92,   // <1 compresses ground contrast toward mid-grey
  shadeStrength: 50.0,   // slope-shading gain (high = hard/binary; ~6–12 is gentle)
  hazeStrength:  0.5,    // north-atmosphere overlay opacity at the top edge (0..1)
  hazeHeight:    0.35,   // how far down the map the atmosphere fades (fraction of height)
  outlineJitter: 0.35,   // hand-inked lineweight variation on the boundary ink (0 = uniform)

  // ---- colours ----
  hazeColor:    '#20303a', // uniform tone the sky fades to (keeps the top streak-free)
  outlineColor: '#16210f', // fallback boundary ink (a biome's own `outlineColor` wins)
  shoreColor:   '#dfe9ef', // shoreline stroke

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
    
    // Compute base cell colors (without snow)
    this._computeBaseCellColors();

    // Mark biome-boundary cells for the ink / shoreline strokes (illustration).
    this._computeEdgeFlags();

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
  
  /**
   * Bake a single season's terrain buffer using direct pixel manipulation
   */
  _bakeSeasonBuffer(seasonKey) {
    // 3/4 relief: bake in PAINT SPACE — each cell displaced up by its elevation
    // (Projection). The buffer is the projected world height (mapHeight·K + LIFT)
    // tall; K/LIFT come from Projection, which Game.init configures before this
    // runs. Falls back to a flat top-down bake if Projection is somehow absent.
    const _P = (typeof Projection !== 'undefined') ? Projection : null;
    const K = _P ? _P.K : 1;
    const LIFT = _P ? _P.LIFT : 0;
    const bufWorldH = Math.max(1, Math.ceil(this.mapHeight * K + LIFT));

    const buf = createGraphics(this.mapWidth, bufWorldH);
    buf.loadPixels();

    const d = buf.pixelDensity();
    const gridCols = this.gridCols;
    const gridRows = this.gridRows;
    const heightMap = this.heightMap;
    const baseCellColors = this._baseCellColors;
    const snowColorsRGB = this._snowColorsRGB;
    const hasSnow = this._snowBiome && snowColorsRGB;
    
    const snowLine = this.seasonSnowLines[seasonKey];
    const permanentSnowLine = hasSnow ? this._snowBiome.minElevation : 1.0;
    
    let snowContourRGB = [176, 176, 176]; // default grey
    if (hasSnow) {
      const snowContourColor = this._getCachedColor(this._snowBiome.contourColor);
      snowContourRGB = [red(snowContourColor), green(snowContourColor), blue(snowContourColor)];
    }
    
    // Pre-compute cell colors with snow for this season
    const cellColors = new Uint8Array(gridCols * gridRows * 3);

    // Illustration linework: biome-boundary ink + shoreline stroke (see
    // _computeEdgeFlags). Applied over the season colour, below.
    const edgeFlags = this._edgeFlags;
    const shoreC = this._getCachedColor(LOOK.shoreColor);
    const shoreRGB = [red(shoreC), green(shoreC), blue(shoreC)];
    const hazeC = this._getCachedColor(LOOK.hazeColor);
    const hazeR = red(hazeC), hazeG = green(hazeC), hazeB = blue(hazeC);

    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        const cellIdx = row * gridCols + col;
        const elevation = heightMap[cellIdx];
        const baseIdx = cellIdx * 4;
        const outIdx = cellIdx * 3;
        
        const isContour = baseCellColors[baseIdx + 3] === 1;
        
        // Check if this cell has snow in this season
        if (hasSnow && elevation >= snowLine) {
          // Calculate snow coverage
          let snowCoverage;
          if (elevation >= permanentSnowLine) {
            snowCoverage = 1.0;
          } else {
            const range = permanentSnowLine - snowLine;
            snowCoverage = range > 0 ? 0.4 + ((elevation - snowLine) / range) * 0.6 : 1.0;
          }
          
          // Add subtle noise for natural look
          const noiseVal = (Math.sin(elevation * 847 + col * 0.13 + row * 0.17) * 0.5 + 0.5) * 0.12;
          snowCoverage = Math.min(1, snowCoverage + noiseVal);
          
          if (isContour) {
            // Use snow contour color
            cellColors[outIdx] = snowContourRGB[0];
            cellColors[outIdx + 1] = snowContourRGB[1];
            cellColors[outIdx + 2] = snowContourRGB[2];
          } else {
            // Blend base color with snow
            const snowIdx = Math.min(snowColorsRGB.length - 1, (snowCoverage * snowColorsRGB.length) | 0);
            const snowRGB = snowColorsRGB[snowIdx];
            
            const baseR = baseCellColors[baseIdx];
            const baseG = baseCellColors[baseIdx + 1];
            const baseB = baseCellColors[baseIdx + 2];
            
            cellColors[outIdx] = baseR + (snowRGB[0] - baseR) * snowCoverage;
            cellColors[outIdx + 1] = baseG + (snowRGB[1] - baseG) * snowCoverage;
            cellColors[outIdx + 2] = baseB + (snowRGB[2] - baseB) * snowCoverage;
          }
        } else {
          // No snow - use base color
          if (isContour) {
            // Get biome contour color
            const biomeIdx = this.biomeIndexMap[cellIdx];
            const biome = this.biomeArray[biomeIdx];
            const contourC = this._getCachedColor(biome.contourColor);
            cellColors[outIdx] = red(contourC);
            cellColors[outIdx + 1] = green(contourC);
            cellColors[outIdx + 2] = blue(contourC);
          } else {
            cellColors[outIdx] = baseCellColors[baseIdx];
            cellColors[outIdx + 1] = baseCellColors[baseIdx + 1];
            cellColors[outIdx + 2] = baseCellColors[baseIdx + 2];
          }
        }

        // Illustration: stroke biome boundaries as ink, the water's edge as shore.
        const edge = edgeFlags ? edgeFlags[cellIdx] : 0;
        if (edge === 1 && LOOK.outlines) {
          const oc = this._getCachedColor(this.biomeArray[this.biomeIndexMap[cellIdx]].outlineColor || LOOK.outlineColor);
          let orr = red(oc), ogg = green(oc), obb = blue(oc);
          // Hand-inked weight: where a smooth noise dips, let the ground show
          // through so the line thins/breaks; where it peaks, full ink. Gives the
          // uniform 1px boundary some lineweight variation. (Full variation comes
          // with the higher-res bake.) cellColors[outIdx..] still hold the base here.
          const jit = LOOK.outlineJitter;
          if (jit > 0) {
            const ink = 1 - jit * (1 - noise(col * 0.5 + this.seed, row * 0.5 + this.seed));
            orr = cellColors[outIdx]     + (orr - cellColors[outIdx])     * ink;
            ogg = cellColors[outIdx + 1] + (ogg - cellColors[outIdx + 1]) * ink;
            obb = cellColors[outIdx + 2] + (obb - cellColors[outIdx + 2]) * ink;
          }
          cellColors[outIdx] = orr; cellColors[outIdx + 1] = ogg; cellColors[outIdx + 2] = obb;
        } else if (edge === 2 && LOOK.shore) {
          cellColors[outIdx] = shoreRGB[0]; cellColors[outIdx + 1] = shoreRGB[1]; cellColors[outIdx + 2] = shoreRGB[2];
        }
      }
    }

    // ---- Relief fill: near-to-far ceiling painter -----------------------------
    // Paint each column front (near/south, screen bottom) to back (far/north,
    // screen top), keeping `ceiling` = the highest pixel filled so far. Each cell
    // fills only the band from its projected top up to the ceiling, so nearer
    // terrain occludes farther terrain, cliffs get a tall side face, and there
    // are no gaps. One pass at generate() (~1s budget), never per frame.
    // md/TEMANAWA_34VIEW_PLAN.md §3.
    const fullWidth = this.mapWidth * d;
    const fullHeight = bufWorldH * d;
    const cellScale = this.scale;

    // Water never lifts: the sea/river stay on the flat plane, so every shore
    // gets a small bank face for free.
    const waterFlag = new Uint8Array(this.biomeArray.length);
    for (let i = 0; i < this.biomeArray.length; i++) {
      const b = this.biomeArray[i];
      waterFlag[i] = (b.isWater || b === this._waterBiome) ? 1 : 0;
    }

    const TOPBAND = Math.max(1, Math.round(1.5 * d));   // lit top-surface thickness, px
    // Simple directional shading: a slope that rises toward the viewer (south-
    // facing) is turned away from the top light, so it darkens; a north-facing
    // slope brightens. Cheap (one neighbour diff per cell) and it is what makes
    // the relief read as form rather than flat colour steps. (LOOK.shadeStrength)
    const SHADE = LOOK.shade ? LOOK.shadeStrength : 0;

    for (let c = 0; c < gridCols; c++) {
      const pxStart = c * d;                            // pixelScale 1 → gridCols === mapWidth
      let ceiling = fullHeight;                         // nothing filled yet in this column
      let farR = 0, farG = 0, farB = 0, painted = false;// farthest painted top colour → sky fade

      for (let r = gridRows - 1; r >= 0; r--) {         // near → far
        const idx = r * gridCols + c;
        const e = heightMap[idx];
        const liftE = waterFlag[this.biomeIndexMap[idx]] ? 0 : e;

        // Projected top of this cell in buffer pixels (paint space, +LIFT offset).
        let yTop = ((r * cellScale * K - liftE * LIFT + LIFT) * d) | 0;
        if (yTop < 0) yTop = 0;
        if (yTop >= ceiling) continue;                  // fully occluded by nearer terrain

        const cidx = idx * 3;
        // Shade the lit top by the north-neighbour slope.
        const eN = (r > 0) ? heightMap[idx - gridCols] : e;
        let sh = 1 - (e - eN) * SHADE;
        if (sh < 0.72) sh = 0.72; else if (sh > 1.2) sh = 1.2;
        let tr = (cellColors[cidx] * sh) | 0, tg = (cellColors[cidx + 1] * sh) | 0, tb = (cellColors[cidx + 2] * sh) | 0;
        if (tr > 255) tr = 255; if (tg > 255) tg = 255; if (tb > 255) tb = 255;
        const sr = (tr * 0.6) | 0, sg = (tg * 0.6) | 0, sb = (tb * 0.6) | 0;   // side / cliff face

        const isFront = (r === gridRows - 1);           // nearest row = foreground ground
        const lip = (!isFront && (ceiling - yTop) > (3 * d)) ? TOPBAND : 0;   // dark ink lip on a real cliff

        for (let y = yTop; y < ceiling; y++) {
          const band = y - yTop;
          let rr, gg, bb;
          if (isFront) { rr = tr; gg = tg; bb = tb; }            // foreground ground, no dark front wall
          else if (band < lip) { rr = (tr * 0.32) | 0; gg = (tg * 0.32) | 0; bb = (tb * 0.32) | 0; }
          else if (band < TOPBAND) { rr = tr; gg = tg; bb = tb; }
          else { rr = sr; gg = sg; bb = sb; }
          const rowBase = (y * fullWidth + pxStart) * 4;
          for (let k = 0; k < d; k++) {
            const pi = rowBase + k * 4;
            buf.pixels[pi] = rr; buf.pixels[pi + 1] = gg; buf.pixels[pi + 2] = bb; buf.pixels[pi + 3] = 255;
          }
        }
        ceiling = yTop;
        farR = tr; farG = tg; farB = tb; painted = true;
      }

      // Sky above the far ridge. Blend the ridge colour DOWN into a single uniform
      // haze tone at the very top (quadratic, so the haze dominates and only the
      // band right at the ridge carries terrain colour). The uniform top is what
      // keeps it streak-free — per-column ridge colours used to smear vertically
      // here, which is the top-edge artifact. (LOOK.haze / LOOK.hazeColor)
      if (ceiling > 0) {
        for (let y = 0; y < ceiling; y++) {
          let rr, gg, bb;
          if (LOOK.haze && painted) {
            const t = y / ceiling;            // 0 at the top → 1 at the ridge
            const tt = t * t;                 // haze-weighted
            const inv = 1 - tt;
            rr = (hazeR * inv + farR * tt) | 0;
            gg = (hazeG * inv + farG * tt) | 0;
            bb = (hazeB * inv + farB * tt) | 0;
          } else {
            rr = hazeR; gg = hazeG; bb = hazeB;  // flat uniform sky (haze off, or empty column)
          }
          const rowBase = (y * fullWidth + pxStart) * 4;
          for (let k = 0; k < d; k++) {
            const pi = rowBase + k * 4;
            buf.pixels[pi] = rr; buf.pixels[pi + 1] = gg; buf.pixels[pi + 2] = bb; buf.pixels[pi + 3] = 255;
          }
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
      // No season manager - just draw summer
      image(this.seasonBuffers.summer, 0, 0);
      return;
    }
    
    const currentKey = this.seasonManager.currentKey;
    const transitionProgress = this.seasonManager.transitionProgress;
    
    if (transitionProgress < 0.01) {
      // No transition - just draw current season
      image(this.seasonBuffers[currentKey], 0, 0);
    } else {
      // Crossfade between current and next season
      const nextKey = this.seasonManager.nextKey;
      
      // Draw current season
      image(this.seasonBuffers[currentKey], 0, 0);
      
      // Draw next season with alpha
      push();
      tint(255, transitionProgress * 255);
      image(this.seasonBuffers[nextKey], 0, 0);
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