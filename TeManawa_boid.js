// ============================================
// BASE BOID CLASS - Delta Time Optimized
// ============================================
class Boid {
  constructor(x, y, terrain) {
    this.pos = createVector(x, y);
    this.vel = createVector(random(-1, 1), random(-1, 1));
    this.vel.setMag(random(0.2, 0.5));
    this.acc = createVector(0, 0);
    this.terrain = terrain;
    
    this.maxSpeed = 1;
    this.maxForce = 0.05;
    this.perceptionRadius = 50;
    this.perceptionRadiusSq = 2500;
    this.separationDist = 25;
    this.separationDistSq = 625;
    
    this.personality = {
      wanderStrength: 0.8 + random() * 0.4,
      speedVariation: 0.9 + random() * 0.2,
      turniness: 0.8 + random() * 0.4
    };
    this.noiseOffset = random() * 1000;
    this.wanderTime = random() * 1000; // For delta-time compatible wander

    // Opt-in: keep this boid inside the VISIBLE screen bounds, not just the map. Flyers set
    // this true (Kereru / Eagle constructors) because the cover-fit view runs the map wider
    // than the canvas, so the map's left/right edges (within CONFIG.viewInsetX) sit off-screen
    // — a bird at a valid map-x there is simply not visible. Ground animals leave it false;
    // they stay on inland walkable land and never reach the horizontal overflow.
    this._clampToView = false;
    this.animTime = 0;                 // sprite animation clock; rides the REAL
                                       // frame dt in update() (subclasses reseed
                                       // it to random() for per-entity phase)
    this._wanderHeading = Math.atan2(this.vel.y, this.vel.x); // last real heading, for relative wander
    this._speedCap = null; // smoothed effective max speed (ramps toward maxSpeed)

    // Walk-gate (ground birds): a moa only TRANSLATES while it is moving fast enough to show the
    // walk animation. Below _walkGateSq (speed²) update() holds its position — the feet stay
    // planted under an idle/peck pose instead of the body sliding out from under it. The moa
    // renderer picks walk-vs-static off the SAME gate, so "moving" and "walking pose" are exactly
    // equivalent. Flyers leave _freezeWhenNotWalking false (they glide continuously, no walk cel).
    this._freezeWhenNotWalking = false;
    this._walkGateSq = 0.01;

    // ---- Smoothed facing (see updateFacing) --------------------------------
    // The direction the SPRITE points, eased toward the direction of travel so
    // rotation glides instead of snapping to a division, ramps up from rest,
    // and shrugs off a heading that flickers for a frame or two (state chatter)
    // rather than whipping around. Scalars only — never allocates, so it is
    // safe in update() and across a soft reset (CLAUDE.md).
    this._facing = undefined;   // radians, 0 = +x; undefined until the first update
    this._turnRate = 0;         // current angular velocity, radians per frame-unit
    this._faceGateSq = 0.0025;  // below this speed² the heading is noise → hold facing
    this._turnMax = 0.15;       // hard cap on turn per frame-unit (~8.6°/frame)
    this._turnEase = 0.12;      // how fast the turn rate ramps in/out (the "ramp-up")

    // Lateral flip — the moa renderer uses this INSTEAD of rotation, to read as a
    // walking animal that turns around rather than a top-down sprite that spins.
    // _faceDir is the committed horizontal facing (+1 right, -1 left); _flip eases
    // toward it and animates the turn (passing through 0 = edge-on). Eagles keep
    // the smoothed angle above (a soaring bird reads fine rotated).
    this._faceDir = (this.vel.x >= 0) ? 1 : -1;
    this._flip = this._faceDir;
    this._flipSpeed = 0.14;     // how fast the flip animates toward _faceDir
    this._faceGateX = 0.045;    // min |smoothed vel.x| to commit a new direction (hysteresis)
    // Low-passed horizontal velocity that DRIVES the flip decision. Deciding the facing off
    // the raw vel.x let a perched bird's jitter and a grazer's micro-oscillation at a shore
    // flip the sprite back and forth (reported "continual sprite flip"). Averaging over a few
    // frames rejects that while still following a genuine turn within a fraction of a second.
    this._flipVx = this.vel.x;
    this._flipVxEase = 0.06;    // low-pass rate (τ ≈ 16 frames) — long enough to reject flip-flap

    // Reusable vectors
    this._steeringVec = createVector();
    this._tempVec1 = createVector();
    this._tempVec2 = createVector();
    this._tempVec3 = createVector();
    this._screenEdgeVec = createVector();   // scratch for the screen-aware edge steer (edges())
    
    // Cache for terrain avoidance
    this._avoidAngles = [];
    for (let a = 0; a < 12; a++) {
      this._avoidAngles.push(a * (Math.PI / 6));
    }
  }
  
  // Optimized separation
  separate(nearbyBoids) {
    const force = this._steeringVec;
    force.set(0, 0);
    
    let count = 0;
    const sepDistSq = this.separationDistSq;
    const px = this.pos.x;
    const py = this.pos.y;
    
    for (let i = 0, len = nearbyBoids.length; i < len; i++) {
      const other = nearbyBoids[i];
      if (!other.alive || other === this) continue;
      
      const dx = px - other.pos.x;
      const dy = py - other.pos.y;
      const distSq = dx * dx + dy * dy;
      
      if (distSq < sepDistSq && distSq > 0.0001) {
        const invDistSq = 1 / distSq;
        force.x += dx * invDistSq;
        force.y += dy * invDistSq;
        count++;
      }
    }
    
    if (count > 0) {
      const invCount = 1 / count;
      force.x *= invCount;
      force.y *= invCount;
      force.setMag(this.maxSpeed);
      force.sub(this.vel);
      force.limit(this.maxForce);
    }
    
    return force;
  }
  
  // Optimized seek using coordinates.
  // arriveRadius > 0 enables arrival: desired speed ramps down inside the
  // radius so the boid settles on the target instead of overshooting and
  // oscillating across it (rubber-banding).
  seekPoint(tx, ty, urgency = 1, arriveRadius = 0) {
    const result = this._tempVec3;
    const dx = tx - this.pos.x;
    const dy = ty - this.pos.y;

    let speed = this.maxSpeed * urgency;
    if (arriveRadius > 0) {
      const distSq = dx * dx + dy * dy;
      if (distSq < arriveRadius * arriveRadius) {
        speed *= Math.sqrt(distSq) / arriveRadius;
      }
    }

    result.set(dx, dy);
    result.setMag(speed);
    result.sub(this.vel); // at speed 0 this becomes a pure braking force
    result.limit(this.maxForce * urgency);

    return result;
  }

  // Vector-accepting seek (for compatibility)
  seek(target, urgency = 1, arriveRadius = 0) {
    return this.seekPoint(target.x, target.y, urgency, arriveRadius);
  }
  
  // Delta-time compatible wander — steers RELATIVE to the current heading
  // (noise drifts the heading up to ~±100°) and is clamped to maxForce, so it
  // produces gentle meandering curves instead of overpowering every steered
  // force with a random absolute direction (which read as spinning in place).
  wander(dt = 1) {
    // Advance wander time based on delta
    this.wanderTime += 0.008 * dt;

    const result = this._tempVec1;

    // Remember the last real heading so a near-stationary boid resumes in a
    // sensible direction instead of one derived from velocity noise.
    if (this.vel.x * this.vel.x + this.vel.y * this.vel.y > 0.0001) {
      this._wanderHeading = Math.atan2(this.vel.y, this.vel.x);
    }

    const drift = noise(this.noiseOffset, this.wanderTime) * 2 - 1; // -1..1, smooth
    const angle = this._wanderHeading + drift * 1.75;
    const mag = this.maxForce * this.personality.wanderStrength;

    result.set(Math.cos(angle) * mag, Math.sin(angle) * mag);
    return result;
  }
  
  // Optimized terrain avoidance
  avoidUnwalkable() {
    const result = this._steeringVec;
    result.set(0, 0);

    const lookAhead = 12;
    const px = this.pos.x, py = this.pos.y;
    const angles = this._avoidAngles;

    // Case 1 — already standing OFF walkable ground. A look-ahead nudge can only
    // keep a moving animal from wading IN; it never rescues one that is already
    // on the water. That happens two ways: the coastline advances under a moa
    // during a deep-time morph, or a fast state (fleeing) carries it across the
    // shore. A stationary moa returns no velocity to steer, so without this it
    // renders stranded on the sea. Eject toward the nearest walkable direction
    // with a strong, velocity-independent force so even an idle moa wades back.
    if (!this.terrain.isWalkable(px, py)) {
      let bestAngle = 0, found = false;
      // Probe outward ring by ring and take the first walkable hit, so the moa
      // heads for the CLOSEST shore rather than a distant one.
      for (let ring = 1; ring <= 5 && !found; ring++) {
        const r = lookAhead * ring;
        for (let i = 0; i < 12; i++) {
          const a = angles[i];
          if (this.terrain.isWalkable(px + Math.cos(a) * r, py + Math.sin(a) * r)) {
            bestAngle = a; found = true; break;
          }
        }
      }
      if (!found) {   // no land within reach — head for the map interior
        bestAngle = Math.atan2(this.terrain.mapHeight * 0.5 - py, this.terrain.mapWidth * 0.5 - px);
      }
      result.set(Math.cos(bestAngle) * this.maxForce * 4, Math.sin(bestAngle) * this.maxForce * 4);
      return result;
    }

    // Case 2 — on land but approaching unwalkable water: turn along the shore and slow
    // as it nears, instead of ramming the edge and being kicked straight back inland (the
    // ground-bird "rubber-band at the coast/water threshold" report). The old version was
    // binary — nothing until water was 12 px ahead, then a full-strength swerve — so the
    // moa reached the brink carrying momentum, got flung back, its own drive re-aimed it at
    // the shore, and it bounced. Three changes kill the oscillation: look further ahead the
    // faster it moves (it banks earlier), RAMP the steering with proximity (gentle at range,
    // firm only at the brink — no last-moment kick), and BRAKE the momentum carrying it into
    // the water so it eases up to the edge rather than overshooting across it.
    const velX = this.vel.x, velY = this.vel.y;
    const velMagSq = velX * velX + velY * velY;
    if (velMagSq < 0.0001) return result;

    const velMag = Math.sqrt(velMagSq);
    const invVelMag = 1 / velMag;
    const dirX = velX * invVelMag, dirY = velY * invVelMag;
    // Detection distance grows with speed: a calm grazer looks ~14 px ahead, a fleeing one
    // up to ~34, so a fast approach starts turning sooner and never has to swerve hard.
    const maxLook = 14 + (velMag * 40 < 20 ? velMag * 40 : 20);

    // Nearest water hit along the heading (probe outward in a few even steps).
    let dHit = -1;
    for (let s = 1; s <= 5; s++) {
      const d = maxLook * s * 0.2;
      if (!this.terrain.isWalkable(px + dirX * d, py + dirY * d)) { dHit = d; break; }
    }
    if (dHit < 0) return result;                 // clear water-free path ahead — no steering

    const prox = 1 - dHit / maxLook;             // 0 far → ~1 right at the brink

    // Best walkable heading that preserves course the most — turn ALONG the shore, not away
    // from it, so the bird follows the coast instead of reversing into the map.
    let bestDot = -2, bestAngle = 0;
    const currentHeading = Math.atan2(velY, velX);
    for (let i = 0; i < 12; i++) {
      const a = angles[i];
      const testAngle = currentHeading + a;
      if (this.terrain.isWalkable(px + Math.cos(testAngle) * maxLook, py + Math.sin(testAngle) * maxLook)) {
        const dot = Math.cos(a);
        if (dot > bestDot) { bestDot = dot; bestAngle = testAngle; }
      }
    }

    // Steering ramps from a nudge at range to a firm turn at the brink. The course-preserving
    // heading keeps a little of the forward (into-water) direction, so it alone would let the
    // bird nose onto the shore; the outward push below is sized to cancel that and net
    // tangential-to-outward near the brink. If boxed in (no walkable heading within reach) fall
    // back to a straight reversal — also ramped.
    let sx, sy;
    if (bestDot > -2) {
      const steerMag = this.maxForce * (0.5 + 1.2 * prox);
      sx = Math.cos(bestAngle) * steerMag; sy = Math.sin(bestAngle) * steerMag;
    } else {
      const revMag = this.maxForce * (0.8 + 1.6 * prox);
      sx = -dirX * revMag; sy = -dirY * revMag;
    }

    // Push OUTWARD, away from the water ahead (i.e. against the heading), ramped by proximity.
    // This is both the brake on the into-water momentum AND the guarantee that the net force
    // near the brink points away from the shore rather than along the least-turn diagonal into
    // it — so the bird eases up to the edge and turns along it instead of wading across.
    const outward = this.maxForce * (0.2 + 2.4 * prox);
    sx -= dirX * outward; sy -= dirY * outward;

    result.set(sx, sy);
    return result;
  }
  
  // Edge avoidance (force is already frame-independent)
  edges() {
    // Screen-aware edge steer: keep the SPRITE inside the visible frame, not just the
    // map. The cover-fit view runs the map wider/taller than the canvas (viewInsetX
    // L/R, and on a portrait wall a vertical crop too), and the 3/4 relief LIFT raises
    // high ground / a flyer's altitude off the TOP — so a turn-back keyed to the map
    // rectangle lets the whole cast wander off-frame (moa off the sides, the harrier off
    // the top over the ranges). This works in projected screen space, so it accounts for
    // both. Flyers get a wider margin so they never reach the GL edge-fade band. Falls
    // back to the old map-edge turn when the camera isn't set up (headless boot).
    const mPx = this._clampToView ? 110 : 60;
    const f = this._screenEdgeForce(this._screenEdgeVec, mPx, this._altitude || 0);
    let steered = false;
    if (f.x !== 0 || f.y !== 0) { this.acc.x += f.x; this.acc.y += f.y; steered = true; }

    // Deep backstop at the actual MAP edge (also the sole path when the screen-aware
    // steer is inactive, e.g. the headless harness). Harmless when the screen steer
    // already turned the bird — both push inward.
    const margin = 25;
    const turnForce = 0.3 * this.personality.turniness;
    const w = this.terrain.mapWidth;
    const h = this.terrain.mapHeight;
    const px = this.pos.x;
    const py = this.pos.y;

    if (px < margin) this.acc.x += turnForce;
    else if (px > w - margin) this.acc.x -= turnForce;

    if (py < margin) this.acc.y += turnForce;
    else if (py > h - margin) this.acc.y -= turnForce;
  }

  // A steering force that keeps this entity's SPRITE inside the visible frame. Computes
  // where the sprite actually DRAWS (projected screen position, including the terrain
  // relief LIFT and, for a flyer, its altitude) and, if that is within `marginPx` of a
  // screen edge, returns a world-space force pushing it back in. `out` is a reused
  // vector; returns it (zeroed) when the sprite is comfortably in view or the camera is
  // not yet configured (headless). Allocation-free.
  _screenEdgeForce(out, marginPx, altitude) {
    out.set(0, 0);
    if (typeof CONFIG === 'undefined' || typeof Projection === 'undefined') return out;
    const vz = CONFIG.viewZoom || CONFIG.zoom;
    const W = CONFIG.gameAreaWidth, H = CONFIG.gameAreaHeight;
    if (!vz || !W || !H || !this.terrain) return out;
    const vx = CONFIG.viewX || 0, vy = CONFIG.viewY || 0;
    const px = this.pos.x, py = this.pos.y;
    const elev = (typeof this.terrain.getElevationAt === 'function') ? this.terrain.getElevationAt(px, py) : 0;
    const sX = vx + vz * Projection.projX(px);
    const sY = vy + vz * (Projection.groundY(py, elev) - (altitude || 0));
    let ex = 0, ey = 0;                                  // screen-px error past the inner margin
    if (sX < marginPx)          ex = marginPx - sX;
    else if (sX > W - marginPx) ex = (W - marginPx) - sX;
    if (sY < marginPx)          ey = marginPx - sY;
    else if (sY > H - marginPx) ey = (H - marginPx) - sY;
    if (ex === 0 && ey === 0) return out;
    // Screen-px error → world direction: screenX = vx + vz·x (so Δx = Δsx/vz), and
    // screenY = vy + vz·(y·K − …) (so Δy = Δsy/(vz·K)). Normalise, then scale by
    // maxForce with an urgency ramp on how far past the margin the sprite has drifted.
    const K = Projection.K || 1;
    const wx = ex / vz, wy = ey / (vz * K);
    const wmag = Math.hypot(wx, wy);
    if (wmag < 1e-6) return out;
    const overPx = Math.max(Math.abs(ex), Math.abs(ey));
    const mf = (this.maxForce || 0.05) * (1 + Math.min(2, overPx / marginPx));   // maxForce·(1..3)
    out.x = wx / wmag * mf;
    out.y = wy / wmag * mf;
    return out;
  }
  
  applyForce(force) {
    this.acc.x += force.x;
    this.acc.y += force.y;
  }
  
  update(dt = 1) {
    // Two clocks WITHIN motion+anim (both fed the REAL frame dt by the sim):
    //   • mdt — the MOTION clock, scaled by CONFIG.faunaTimeScale, so the cast TRAVELS at a
    //     calm diorama pace (position + velocity integration + the speed-cap ramp).
    //   • dt  — the ANIMATION clock, left at the real frame rate, so the walk/wingbeat cel
    //     cycles still play through EVERY frame at their authored cadence.
    // They are kept separate on purpose: scaling both together slowed the animation too, so
    // the cel cycles played "on twos" (choppy). The cadence was never speed-linked here — it
    // is a fixed floor(animTime*speed) — so running it at full rate just restores the original
    // look while the body moves slower. (Deep-time life events ride the warped clock in
    // behave(); water, storm-warp decay and habitat health ride real dt elsewhere.)
    const mdt = (typeof CONFIG !== 'undefined' && CONFIG.faunaTimeScale) ? dt * CONFIG.faunaTimeScale : dt;

    // Apply acceleration (motion clock)
    this.vel.x += this.acc.x * mdt;
    this.vel.y += this.acc.y * mdt;

    // Speed ramp: the effective cap eases toward the state's maxSpeed instead
    // of snapping, so state changes (idle→flee, flee→idle, terrain slowdowns)
    // accelerate/decelerate over ~10-20 frames rather than teleport-clamping.
    const targetMax = this.maxSpeed * this.personality.speedVariation;
    if (this._speedCap === null) this._speedCap = targetMax;
    this._speedCap += (targetMax - this._speedCap) * Math.min(1, 0.12 * mdt);

    // Limit speed (inline for performance)
    const maxSpd = this._speedCap;
    const maxSpdSq = maxSpd * maxSpd;
    const spdSq = this.vel.x * this.vel.x + this.vel.y * this.vel.y;

    if (spdSq > maxSpdSq) {
      const invSpd = maxSpd / Math.sqrt(spdSq);
      this.vel.x *= invSpd;
      this.vel.y *= invSpd;
    }

    // Apply velocity (motion clock). Ground birds only translate while going fast enough to be in
    // the WALK animation (_walkGateSq); below that they hold position so an idle/peck pose can't
    // slide. Velocity is kept (not zeroed), so accumulating drive ramps back over the gate and the
    // bird steps off again. Flyers (_freezeWhenNotWalking false) always integrate.
    const moveSq = this.vel.x * this.vel.x + this.vel.y * this.vel.y;
    if (!this._freezeWhenNotWalking || moveSq > this._walkGateSq) {
      this.pos.x += this.vel.x * mdt;
      this.pos.y += this.vel.y * mdt;
    }
    
    // Reset acceleration
    this.acc.x = 0;
    this.acc.y = 0;
    
    // Constrain to map (inline)
    const w = this.terrain.mapWidth - 5;
    const h = this.terrain.mapHeight - 5;
    
    if (this.pos.x < 5) this.pos.x = 5;
    else if (this.pos.x > w) this.pos.x = w;

    if (this.pos.y < 5) this.pos.y = 5;
    else if (this.pos.y > h) this.pos.y = h;

    // Keep flyers inside the visible screen horizontally (see _clampToView). The cover-fit view
    // runs the map wider than the canvas, so without this a bird can END a frame in the off-screen
    // left/right overflow. Steering (_landward / avoidEdges) turns it back before this backstop
    // bites; the clamp only guarantees it never actually leaves view.
    if (this._clampToView) {
      const ins = (typeof CONFIG !== 'undefined' && CONFIG.viewInsetX) ? CONFIG.viewInsetX : 0;
      if (ins > 0) {
        const xhi = this.terrain.mapWidth - ins;
        if (this.pos.x < ins) this.pos.x = ins;
        else if (this.pos.x > xhi) this.pos.x = xhi;
      }
    }

    // Animation clock — the real frame dt scaled by CONFIG.faunaAnimScale (NOT the paced motion
    // clock mdt, and never the deep-time-warped clock). At 0.5 each walk/eat/wingbeat cel cycle
    // takes 2x longer, matching the slowed body so the legs aren't racing a slow shuffle. The cel
    // index is floor(animTime*rate), so slowing animTime still steps through EVERY frame in order
    // (it never skips). Facing/flip easing stays on the real dt so turns keep their responsiveness.
    // Aging/hunger/breeding ride the warped clock in behave() (CLAUDE.md: water/habitat do the same).
    const adt = (typeof CONFIG !== 'undefined' && CONFIG.faunaAnimScale) ? dt * CONFIG.faunaAnimScale : dt;
    this.animTime += adt;
    this.updateFacing(dt);
  }

  // Ease the sprite's facing toward the direction of travel. Three problems,
  // one mechanism:
  //   • snapping — the renderer used to set the angle straight from velocity
  //     every frame. A rate-limited turn glides between headings instead.
  //   • no ramp-up — the turn RATE itself is eased toward its target, so a turn
  //     accelerates in from rest rather than starting at full speed.
  //   • rubber-banding — when state chatter flips the velocity for a frame or
  //     two, the eased rate cannot reverse instantly, so a brief flicker barely
  //     moves the sprite instead of whipping it around.
  //
  // Scalar-only and allocation-free (CLAUDE.md: never allocate in update()).
  updateFacing(dt = 1) {
    const TAU = Math.PI * 2;
    const vx = this.vel.x, vy = this.vel.y;
    const moving = (vx * vx + vy * vy) > this._faceGateSq;

    // First call for this boid: adopt the current heading with no turn, so a
    // freshly spawned or soft-reset bird does not spin to face its start vector.
    if (this._facing === undefined) {
      this._facing = moving ? Math.atan2(vy, vx) : 0;
      this._turnRate = 0;
      return;
    }

    // Shortest signed arc to the target heading, wrapped into (-PI, PI]. No trig.
    let d = 0;
    if (moving) {
      d = Math.atan2(vy, vx) - this._facing;
      d -= TAU * Math.floor((d + Math.PI) / TAU);
    }

    // Desired turn rate: proportional to the error but capped. Proportional
    // eases the turn OUT as the heading is reached; the cap stops a 180° flip
    // resolving in one frame. Stopped → 0, so an in-progress turn coasts to a
    // halt rather than freezing mid-swing.
    const m = this._turnMax;
    const desired = d > m ? m : (d < -m ? -m : d);

    // Ease the actual rate toward the desired rate — the ramp-up, and the
    // inertia that averages out flicker.
    const k = this._turnEase * dt;
    this._turnRate += (desired - this._turnRate) * (k > 1 ? 1 : k);

    // Integrate, but never rotate past the target in a single step — guards a
    // large deep-time dt against overshooting into a wobble.
    let step = this._turnRate * dt;
    if (moving && ((d >= 0 && step > d) || (d <= 0 && step < d))) step = d;
    this._facing += step;

    // Keep the angle bounded so it cannot drift over a day-long kiosk run.
    if (this._facing > Math.PI) this._facing -= TAU;
    else if (this._facing < -Math.PI) this._facing += TAU;

    // ---- Lateral flip (moa / kererū renderers) ----------------------------
    // Commit a new horizontal facing only from SUSTAINED sideways travel: low-pass the
    // horizontal velocity, then re-commit only when the SMOOTHED value clears the gate AND
    // the bird is actually moving. So a perched bird's jitter (its speed is below the moving
    // gate) and a grazer's brief back-and-forth at a shore (it averages out of the smoothed
    // value) both HOLD the last facing instead of flip-flapping the sprite through edge-on.
    // A real turn sustains one direction and commits within a fraction of a second.
    const fvk = this._flipVxEase * dt;
    this._flipVx += (vx - this._flipVx) * (fvk > 1 ? 1 : fvk);
    if (moving) {
      if (this._flipVx > this._faceGateX) this._faceDir = 1;
      else if (this._flipVx < -this._faceGateX) this._faceDir = -1;
    }
    const fk = this._flipSpeed * dt;
    this._flip += (this._faceDir - this._flip) * (fk > 1 ? 1 : fk);
  }
}