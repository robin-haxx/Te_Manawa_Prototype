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
    this._wanderHeading = Math.atan2(this.vel.y, this.vel.x); // last real heading, for relative wander
    this._speedCap = null; // smoothed effective max speed (ramps toward maxSpeed)

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
    this._faceGateX = 0.03;     // min |vel.x| to commit a new direction (hysteresis)

    // Reusable vectors
    this._steeringVec = createVector();
    this._tempVec1 = createVector();
    this._tempVec2 = createVector();
    this._tempVec3 = createVector();
    
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
  
  // Optimized alignment
  align(nearbyBoids) {
    const result = this._tempVec1;
    result.set(0, 0);
    
    let count = 0;
    const perceptionSq = this.perceptionRadiusSq;
    const px = this.pos.x;
    const py = this.pos.y;
    
    for (let i = 0, len = nearbyBoids.length; i < len; i++) {
      const other = nearbyBoids[i];
      if (!other.alive || other === this) continue;
      
      const dx = other.pos.x - px;
      const dy = other.pos.y - py;
      const distSq = dx * dx + dy * dy;
      
      if (distSq < perceptionSq) {
        result.x += other.vel.x;
        result.y += other.vel.y;
        count++;
      }
    }
    
    if (count > 0) {
      const invCount = 1 / count;
      result.x *= invCount;
      result.y *= invCount;
      result.setMag(this.maxSpeed);
      result.sub(this.vel);
      result.limit(this.maxForce);
    }
    
    return result;
  }
  
  // Optimized cohesion
  cohesion(nearbyBoids) {
    const result = this._tempVec2;
    result.set(0, 0);
    
    let count = 0;
    const perceptionSq = this.perceptionRadiusSq;
    const px = this.pos.x;
    const py = this.pos.y;
    
    for (let i = 0, len = nearbyBoids.length; i < len; i++) {
      const other = nearbyBoids[i];
      if (!other.alive || other === this) continue;
      
      const dx = other.pos.x - px;
      const dy = other.pos.y - py;
      const distSq = dx * dx + dy * dy;
      
      if (distSq < perceptionSq) {
        result.x += other.pos.x;
        result.y += other.pos.y;
        count++;
      }
    }
    
    if (count > 0) {
      const invCount = 1 / count;
      result.x *= invCount;
      result.y *= invCount;
      return this.seekPoint(result.x, result.y, 1);
    }
    
    result.set(0, 0);
    return result;
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
  
  // Optimized flee
  fleePoint(tx, ty, radius = 100) {
    const result = this._tempVec1;
    const dx = this.pos.x - tx;
    const dy = this.pos.y - ty;
    const distSq = dx * dx + dy * dy;
    const radiusSq = radius * radius;
    
    if (distSq < radiusSq && distSq > 0.0001) {
      const d = Math.sqrt(distSq);
      const urgency = 1 - (d / radius);
      const speed = this.maxSpeed * (1 + urgency);
      
      result.set(dx, dy);
      result.setMag(speed);
      result.sub(this.vel);
      result.limit(this.maxForce * 2);
      
      return result;
    }
    
    result.set(0, 0);
    return result;
  }
  
  flee(target, radius = 100) {
    return this.fleePoint(target.x, target.y, radius);
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
    const velX = this.vel.x;
    const velY = this.vel.y;
    const velMagSq = velX * velX + velY * velY;
    
    if (velMagSq < 0.0001) return result;
    
    const velMag = Math.sqrt(velMagSq);
    const invVelMag = 1 / velMag;
    const futureX = this.pos.x + velX * invVelMag * lookAhead;
    const futureY = this.pos.y + velY * invVelMag * lookAhead;
    
    if (!this.terrain.isWalkable(futureX, futureY)) {
      let bestDot = -2;
      let bestAngle = 0;
      const currentHeading = Math.atan2(velY, velX);
      const px = this.pos.x;
      const py = this.pos.y;
      
      const angles = this._avoidAngles;
      for (let i = 0; i < 12; i++) {
        const a = angles[i];
        const testAngle = currentHeading + a;
        const testX = px + Math.cos(testAngle) * lookAhead;
        const testY = py + Math.sin(testAngle) * lookAhead;
        
        if (this.terrain.isWalkable(testX, testY)) {
          const dot = Math.cos(a);
          if (dot > bestDot) {
            bestDot = dot;
            bestAngle = testAngle;
          }
        }
      }
      
      if (bestDot > -2) {
        result.set(
          Math.cos(bestAngle) * this.maxForce * 2,
          Math.sin(bestAngle) * this.maxForce * 2
        );
      } else {
        result.set(
          -velX * invVelMag * this.maxForce * 3,
          -velY * invVelMag * this.maxForce * 3
        );
      }
    }
    
    return result;
  }
  
  // Edge avoidance (force is already frame-independent)
  edges() {
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
  
  applyForce(force) {
    this.acc.x += force.x;
    this.acc.y += force.y;
  }
  
  update(dt = 1) {
    // Apply acceleration (scaled by dt)
    this.vel.x += this.acc.x * dt;
    this.vel.y += this.acc.y * dt;

    // Speed ramp: the effective cap eases toward the state's maxSpeed instead
    // of snapping, so state changes (idle→flee, flee→idle, terrain slowdowns)
    // accelerate/decelerate over ~10-20 frames rather than teleport-clamping.
    const targetMax = this.maxSpeed * this.personality.speedVariation;
    if (this._speedCap === null) this._speedCap = targetMax;
    this._speedCap += (targetMax - this._speedCap) * Math.min(1, 0.12 * dt);

    // Limit speed (inline for performance)
    const maxSpd = this._speedCap;
    const maxSpdSq = maxSpd * maxSpd;
    const spdSq = this.vel.x * this.vel.x + this.vel.y * this.vel.y;
    
    if (spdSq > maxSpdSq) {
      const invSpd = maxSpd / Math.sqrt(spdSq);
      this.vel.x *= invSpd;
      this.vel.y *= invSpd;
    }
    
    // Apply velocity (scaled by dt)
    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;
    
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

    // Velocity is final for the frame here (behave() set the forces, the lines
    // above integrated and clamped them), so ease the sprite's facing now,
    // using the same dt — which carries the deep-time multiplier — so the turn
    // keeps pace when the clock fast-forwards.
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

    // ---- Lateral flip (moa renderer) --------------------------------------
    // Commit a new horizontal facing only when the sideways movement is clear
    // (the gate is hysteresis, so a near-vertical path or x-jitter does not
    // flip-flap), then ease the animated flip toward it — passing through 0 is
    // the little turn-around pop.
    if (vx > this._faceGateX) this._faceDir = 1;
    else if (vx < -this._faceGateX) this._faceDir = -1;
    const fk = this._flipSpeed * dt;
    this._flip += (this._faceDir - this._flip) * (fk > 1 ? 1 : fk);
  }
}