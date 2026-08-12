// ============================================
// SPATIAL GRID 
// Uses numeric keys and pre-allocated arrays
// ============================================
class SpatialGrid {
  constructor(width, height, cellSize) {
    this.width = width;
    this.height = height;
    this.cellSize = cellSize;
    this.invCellSize = 1 / cellSize; // Pre-compute for faster division
    this.cols = Math.ceil(width * this.invCellSize);
    this.rows = Math.ceil(height * this.invCellSize);
    
    // Use a flat array instead of Map for O(1) access without hashing
    this.totalCells = this.cols * this.rows;
    this.cells = new Array(this.totalCells);
    
    // Pre-allocate cell arrays (object pool)
    for (let i = 0; i < this.totalCells; i++) {
      this.cells[i] = [];
    }
    
    // Track which cells have entities for faster clearing
    this.activeCells = [];
    
    // Reusable result array to reduce allocations
    this._resultBuffer = [];
    this._resultBuffer2 = [];
  }
  
  /**
   * Get grid dimensions
   */
  getDimensions() {
    return {
      width: this.width,
      height: this.height,
      cols: this.cols,
      rows: this.rows,
      cellSize: this.cellSize
    };
  }
  
  clear() {
    // Only clear cells that had entities
    const active = this.activeCells;
    for (let i = 0, len = active.length; i < len; i++) {
      this.cells[active[i]].length = 0;
    }
    this.activeCells.length = 0;
  }
  
  // Get cell index directly (no string keys!)
  getCellIndex(x, y) {
    const col = (x * this.invCellSize) | 0; // Bitwise floor
    const row = (y * this.invCellSize) | 0;
    
    // Bounds check
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
      return -1;
    }
    
    return row * this.cols + col;
  }
  
  /**
   * Get the cell coordinates for a given position
   */
  getCellCoords(x, y) {
    return {
      col: (x * this.invCellSize) | 0,
      row: (y * this.invCellSize) | 0
    };
  }
  
  insert(entity) {
    const idx = this.getCellIndex(entity.pos.x, entity.pos.y);
    if (idx === -1) return;
    
    const cell = this.cells[idx];
    if (cell.length === 0) {
      this.activeCells.push(idx);
    }
    cell.push(entity);
  }
  
  /**
   * Insert entity at specific position (useful for predictive queries)
   */
  insertAt(entity, x, y) {
    const idx = this.getCellIndex(x, y);
    if (idx === -1) return;
    
    const cell = this.cells[idx];
    if (cell.length === 0) {
      this.activeCells.push(idx);
    }
    cell.push(entity);
  }
  
  // Get all entities in nearby cells (fast, no distance check)
  getNearby(x, y, radius) {
    const result = this._resultBuffer;
    result.length = 0;
    
    const invCellSize = this.invCellSize;
    const cellRadius = Math.ceil(radius * invCellSize);
    const centerCol = (x * invCellSize) | 0;
    const centerRow = (y * invCellSize) | 0;
    
    const minCol = Math.max(0, centerCol - cellRadius);
    const maxCol = Math.min(this.cols - 1, centerCol + cellRadius);
    const minRow = Math.max(0, centerRow - cellRadius);
    const maxRow = Math.min(this.rows - 1, centerRow + cellRadius);
    
    const cols = this.cols;
    const cells = this.cells;
    
    for (let row = minRow; row <= maxRow; row++) {
      const rowOffset = row * cols;
      for (let col = minCol; col <= maxCol; col++) {
        const cell = cells[rowOffset + col];
        const len = cell.length;
        for (let i = 0; i < len; i++) {
          result.push(cell[i]);
        }
      }
    }
    
    return result;
  }
  
  // Get nearby entities with actual distance check (more precise)
  getInRadius(x, y, radius) {
    const result = this._resultBuffer;
    result.length = 0;
    
    const invCellSize = this.invCellSize;
    const cellRadius = Math.ceil(radius * invCellSize);
    const centerCol = (x * invCellSize) | 0;
    const centerRow = (y * invCellSize) | 0;
    const radiusSq = radius * radius;
    
    const minCol = Math.max(0, centerCol - cellRadius);
    const maxCol = Math.min(this.cols - 1, centerCol + cellRadius);
    const minRow = Math.max(0, centerRow - cellRadius);
    const maxRow = Math.min(this.rows - 1, centerRow + cellRadius);
    
    const cols = this.cols;
    const cells = this.cells;
    
    for (let row = minRow; row <= maxRow; row++) {
      const rowOffset = row * cols;
      for (let col = minCol; col <= maxCol; col++) {
        const cell = cells[rowOffset + col];
        const len = cell.length;
        
        for (let i = 0; i < len; i++) {
          const entity = cell[i];
          const dx = entity.pos.x - x;
          const dy = entity.pos.y - y;
          if (dx * dx + dy * dy <= radiusSq) {
            result.push(entity);
          }
        }
      }
    }
    
    return result;
  }
  
  // Find the closest entity within radius
  getClosest(x, y, radius, filter = null) {
    const invCellSize = this.invCellSize;
    const cellRadius = Math.ceil(radius * invCellSize);
    const centerCol = (x * invCellSize) | 0;
    const centerRow = (y * invCellSize) | 0;
    
    const minCol = Math.max(0, centerCol - cellRadius);
    const maxCol = Math.min(this.cols - 1, centerCol + cellRadius);
    const minRow = Math.max(0, centerRow - cellRadius);
    const maxRow = Math.min(this.rows - 1, centerRow + cellRadius);
    
    const cols = this.cols;
    const cells = this.cells;
    
    let closest = null;
    let closestDistSq = radius * radius;
    
    for (let row = minRow; row <= maxRow; row++) {
      const rowOffset = row * cols;
      for (let col = minCol; col <= maxCol; col++) {
        const cell = cells[rowOffset + col];
        const len = cell.length;
        
        for (let i = 0; i < len; i++) {
          const entity = cell[i];
          if (filter !== null && !filter(entity)) continue;
          
          const dx = entity.pos.x - x;
          const dy = entity.pos.y - y;
          const distSq = dx * dx + dy * dy;
          
          if (distSq < closestDistSq) {
            closestDistSq = distSq;
            closest = entity;
          }
        }
      }
    }
    
    return closest;
  }
  
  // Debug: get stats about grid usage
  getStats() {
    let totalEntities = 0;
    let maxInCell = 0;
    const nonEmptyCells = this.activeCells.length;
    
    for (let i = 0; i < nonEmptyCells; i++) {
      const len = this.cells[this.activeCells[i]].length;
      totalEntities += len;
      if (len > maxInCell) maxInCell = len;
    }
    
    return {
      totalEntities,
      nonEmptyCells,
      maxInCell,
      avgPerCell: nonEmptyCells > 0 ? (totalEntities / nonEmptyCells).toFixed(1) : 0,
      gridSize: `${this.cols}x${this.rows}`,
      worldSize: `${this.width}x${this.height}`
    };
  }
}