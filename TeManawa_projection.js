// ============================================
// PLAN-OBLIQUE PROJECTION  ("top-down 3/4")
// ============================================
// The simulation stays TOP-DOWN. Positions, walkability, spawning and the
// spatial hash all live on the flat world grid — nothing here moves them. This
// module owns only the *paint*: the one mapping from a world point (plus the
// terrain elevation under it) to where it lands on screen, so the terrain bake
// and every entity agree on a single 3/4 projection.
//
// Plan-oblique, NOT isometric: no x-shear, no rotation. One formula —
//
//     screenX = worldX
//     screenY = worldY · K  −  elev · LIFT
//
//   K     Pitch squash. 1.0 = straight top-down; lower tips the camera forward.
//         Terra Nil sits ~0.5–0.6; Te Manawa wants a higher (closer to top-down)
//         angle — author 0.72–0.85, default 0.8.
//   LIFT  Relief height in WORLD PIXELS at elevation 1.0. Authored as a fraction
//         of mapHeight (liftFrac) so it is resolution-independent; ~0.12–0.15
//         stands the ranges up without the far terrain occluding the playfield.
//
// Pure and p5-free — like TeManawa_climate.js — so tools/bootcheck.js can assert
// on it without booting the sketch. K and liftFrac are authored in the level def
// and held HERE, never written back to CONFIG: same discipline as
// TerrainGenerator.noiseScale, where a per-run value must not mutate authored
// config (it would compound across regenerations).
//
// STAGING (md/TEMANAWA_34VIEW_PLAN.md §8). Step 1 — the current step — applies K
// as a global scale(1, K) squash in Game.render(), which is exactly projY() with
// elev = 0. LIFT is authored and exposed now, but the relief bake (§3) and the
// unsquashed entity billboards + y-sort (§5) that consume elevation land in the
// next step. projY(y, elev) already takes elevation so those steps drop in
// without changing this contract.

const Projection = {
  // Authoring bounds. configure() clamps into these rather than trusting input;
  // bootcheck asserts a live K stays inside them.
  K_MIN: 0.5,
  K_MAX: 1.0,
  LIFT_FRAC_MIN: 0.0,
  LIFT_FRAC_MAX: 0.35,

  // Defaults, so the module is usable before any level configures it and a
  // headless boot never divides by an undefined dimension.
  K: 0.8,
  liftFrac: 0.14,
  LIFT: 0.14 * 512,     // world px at elevation 1.0 — recomputed in configure()
  mapWidth: 512,
  mapHeight: 512,

  // Whether elevation currently lifts things off the flat plane. FALSE until the
  // relief bake (step 2) exists — while the ground bake is flat, lifting entities
  // by elevation would float them above a ground that has not risen to meet them.
  // The relief step sets this true; groundY() and the bake then agree.
  relief: false,

  _clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); },

  // Called once per terrain build (Game.init), AFTER the terrain exists so the
  // map dimensions are known. Reads the level's authored K / liftFrac; anything
  // missing keeps the current value, anything out of range is clamped.
  configure(opts) {
    const o = opts || {};
    if (Number.isFinite(o.K))        this.K = this._clamp(o.K, this.K_MIN, this.K_MAX);
    if (Number.isFinite(o.liftFrac)) this.liftFrac = this._clamp(o.liftFrac, this.LIFT_FRAC_MIN, this.LIFT_FRAC_MAX);
    if (o.mapWidth  > 0) this.mapWidth  = o.mapWidth;
    if (o.mapHeight > 0) this.mapHeight = o.mapHeight;
    this.LIFT = this.liftFrac * this.mapHeight;
    return this;
  },

  // ---- the projection (allocation-free scalars for the render hot path) ------
  // screenX is unchanged in plan-oblique; kept as a call so every renderer reads
  // symmetrically and a future shear would have exactly one home.
  projX(worldX) { return worldX; },

  // World y and the cell's elevation (0–1) → screen y, in WORLD units (i.e.
  // before the view zoom). elev defaults to 0 → the flat squash plane, which is
  // what step 1's global squash uses.
  projY(worldY, elev) { return worldY * this.K - (elev || 0) * this.LIFT; },

  // The render-facing vertical mapping every entity and the terrain share: the
  // PAINT-SPACE y (before the view zoom) where a thing standing on the ground at
  // (·, worldY) of elevation `elev` is drawn. The relief buffer is baked in this
  // exact space, so a sprite and the ground cell under it always line up.
  //
  // The +LIFT offset keeps paint y ≥ 0: the highest possible peak (elev 1) sits
  // at worldY·K, and flat ground (elev 0) sits LIFT below it. Higher ground is
  // therefore drawn higher on screen. While relief is off it is the flat squash
  // plane (worldY·K, elevation ignored) — undistorted sprites on squashed ground.
  groundY(worldY, elev) {
    return this.relief
      ? worldY * this.K - (elev || 0) * this.LIFT + this.LIFT
      : worldY * this.K;
  },

  // The world's on-screen vertical extent, in world units. squashedHeight() is
  // the flat plane (what step 1 uses for fit + centering); projectedWorldHeight()
  // adds the relief headroom the taller relief bake needs (step 2).
  squashedHeight() { return this.mapHeight * this.K; },
  projectedWorldHeight() { return this.mapHeight * this.K + this.LIFT; },

  // ---- inverse: screen → world (authoring only; the kiosk has no pointer) ----
  // screenY couples y and elevation, so invert by iteration: assume flat, sample
  // the height there, correct, repeat. elevAt(x, y) returns elevation 0–1. A
  // handful of steps converge for any sane LIFT. Allocates a result object,
  // which is fine off the per-frame path.
  screenToWorld(screenX, screenY, elevAt) {
    const x = screenX;                 // projX is the identity
    let y = screenY / this.K;          // flat first guess
    if (typeof elevAt === 'function' && this.LIFT !== 0) {
      for (let i = 0; i < 6; i++) {
        const e = elevAt(x, y) || 0;
        y = (screenY + e * this.LIFT) / this.K;
      }
    }
    return { x, y };
  },

  // Restore module defaults. Not needed on the visitor path — configure() is
  // idempotent and re-run on every terrain build — but handy for tests.
  reset() {
    this.K = 0.8;
    this.liftFrac = 0.14;
    this.mapWidth = 512;
    this.mapHeight = 512;
    this.LIFT = 0.14 * 512;
    this.relief = false;
    return this;
  }
};
