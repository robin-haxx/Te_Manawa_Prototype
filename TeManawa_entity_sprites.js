// my game is top down but the sprites are designed to look angled to show one side more to the camera.
// this needs some altering as just rotation means they look "upside down" half the time.
// the eagle sprite is oriented upward (and designed to show more of its left side) and the moa oriented to the right with its right side shown more.
// when the eagle sprite is being rotated between 45 and 225 degrees clockwise I would like to mirror the sprite horizontally
// for the moa sprite angles between 45 and 225 degrees clockwise I would like to mirror the sprite vertically.
// I think this will fix how they look so as to be angled for more typical game rendering.


// ============================================
// ANGLE SNAPPING FOR PIXEL ART SPRITES
// ============================================

const SpriteAngle = {
  DIVISIONS: 12,
  INCREMENT: (Math.PI * 2) / 12,
  
  snap(angle) {
    return Math.round(angle / this.INCREMENT) * this.INCREMENT;
  },
  
  snapWithHysteresis(currentDisplayAngle, targetAngle, threshold = 0.4) {
    const snappedTarget = this.snap(targetAngle);
    
    if (currentDisplayAngle === undefined) return snappedTarget;
    
    let diff = snappedTarget - currentDisplayAngle;
    const PI = Math.PI;
    if (diff > PI) diff -= PI * 2;
    if (diff < -PI) diff += PI * 2;
    
    if (Math.abs(diff) > this.INCREMENT * threshold) {
      return snappedTarget;
    }
    
    return currentDisplayAngle;
  },
  
  // The art is drawn slightly three-quarters-on, so one flank shows more than
  // the other. For the axonometric read to hold, that flank must stay angled
  // toward the BOTTOM of the screen no matter which way the bird is travelling
  // — otherwise it looks like it has rolled upside down.
  //
  // Mirroring across the travel axis is what swaps which flank shows. With the
  // exposed flank sitting to the sprite's own right, it points downward on
  // screen exactly while cos(heading) > 0, so mirror whenever the bird is
  // heading leftward. The flip therefore only ever fires as the heading passes
  // straight up or straight down, where the flank is edge-on and the swap is
  // invisible. Pass the direction of travel, not the sprite's display angle.
  shouldMirrorHeading(heading) {
    return Math.cos(heading) < 0;
  },

  // Legacy fixed-window rule, still used by the moa renderer.
  shouldMirror(angle) {
    const TWO_PI = Math.PI * 2;
    // Normalize to 0-2π range
    const normalized = ((angle % TWO_PI) + TWO_PI) % TWO_PI;
    // 45° = π/4 ≈ 0.785,  225° = 5π/4 ≈ 3.927
    const START = Math.PI / 4;
    const END = 5 * Math.PI / 4;
    return normalized >= START && normalized <= END;
  }
};

// ============================================
// ART MODE
// ============================================
// Selects which resolution of artwork gets loaded. Read once during preload()
// — changing it after that has no effect until the page is reloaded, since p5
// resolves loadImage() calls during the preload phase.
//
// Only the harrier (Haast's eagle) is wired up so far. Species without a
// 'high' entry silently fall back to their 'low' art, so adding a new hi-res
// set is a matter of dropping another block into ART_SETS below.

const ArtMode = {
  current: 'low',             // 'low' | 'high'

  isHigh() { return this.current === 'high'; },

  // Resolve a species' sprite set for the active mode, falling back to 'low'
  // when that species has no artwork at the requested resolution.
  setFor(species) {
    const sets = ART_SETS[species];
    if (!sets) return null;
    return sets[this.current] || sets.low;
  }
};

// Convenience for testing: ?art=low or ?art=high on the URL overrides the
// default without editing this file. Still startup-only — it is read before
// preload() and ignored thereafter.
(function () {
  if (typeof window === 'undefined' || !window.location) return;
  const requested = new URLSearchParams(window.location.search).get('art');
  if (requested === 'low' || requested === 'high') ArtMode.current = requested;
})();

// Declarative description of each species' artwork per mode.
//   dir/prefix/pad/first/count → how the frame filenames are built
//   huntFrame / glideFrame     → indices into the loaded frame list
//   artAngle                   → direction the art faces, radians (see SpriteAngle)
const ART_SETS = {
  eagle: {
    low: {
      // 8-frame wingbeat, filenames zero-padded to 5 digits
      // (EylesHarrier_Flying_00000..00007.png).
      dir: 'EylesHarrier/',
      prefix: 'EylesHarrier_Flying_',
      pad: 5,
      first: 0,
      count: 8,
      huntFrame: 4,
      glideFrame: 0,
      artAngle: 0.74
    },
    high: {
      // 16-frame wingbeat at 500x500. Same pose cycle at double the frame
      // density, so the hunting pose is the phase-equivalent of low's frame 4.
      dir: 'EylesHarrier_HiRes/',
      prefix: 'EylesHarrier_State_',
      pad: 5,
      first: 0,
      count: 16,
      huntFrame: 8,
      glideFrame: 0,
      artAngle: 0.74
    }
  }
};

// ============================================
// ENTITY SPRITE MANAGER
// ============================================

const EntitySprites = {
  moa: {
    walk: [],
    idle: null,
    mate: null
  },
  // Dedicated per-species sprite sets. A species whose registry config sets
  // e.g. `spriteSet: 'bush'` renders from here instead of the generic moa art.
  moaVariants: {
    bush: { walk: [], idle: null, mate: null }
  },
  eagle: {
    fly: [],
    dive: null,
    glide: null,
    // Direction the artwork itself faces, in image space, in radians.
    // 0 = pointing right, positive = clockwise (screen y is down), so
    // -HALF_PI = pointing up. Measured from the harrier frames: the beak sits
    // down-and-right of the body centroid at a consistent ~42° in BOTH the
    // low- and hi-res sets. Overwritten from ART_SETS at load time.
    artAngle: 0.74
  },
  // Kererū — a single placeholder frame (sprites/kereru0.png, faces up-and-right).
  // Mirrored for leftward travel in Kereru.render; the 5-frame flight set lands later.
  kereru: { sprite: null },
  loaded: false,
  loadAttempted: false,

  // Per-species tinted sprite variants, baked ONCE per unique tint (keyed
  // "r,g,b") the first time that species renders, then reused every frame —
  // replacing the per-moa, per-frame tint() composite in moa.render (#6). Same
  // idiom as the terrain: colours baked, not read per frame. This is a one-time
  // cache warm, not per-frame allocation; it survives soft resets (sprites are
  // not reloaded) and a hard reload re-bakes it lazily.
  _tintCache: {},
  _lastTintRef: null,   // single-slot ref fast path for _ensureTintSet (see there)
  _lastTintSet: null,

  // Fixed cel cadence. A frame index is floor(animTime * speed) % frameCount, and
  // animTime advances on the REAL frame clock (Boid.update, not the warped behave()),
  // so these speeds are a wall-clock cadence — moaWalkSpeed 0.12 ≈ a new frame every
  // ~8 rendered frames (~7 fps) at any deep-time multiplier. A deliberately low,
  // stepped cadence that reads as the cel look and never scrambles in fast-forward.
  animation: {
    moaWalkSpeed: 0.12,
    eagleFlySpeed: 0.15,
    eagleDiveSpeed: 0.08,
    // The eagle speeds above were tuned against an 8-frame cycle. Both are
    // scaled by (frames / this) at playback so a longer cycle plays through
    // faster rather than halving the wingbeat frequency.
    eagleFrameReference: 8
  },

  load() {
    if (this.loadAttempted) return;
    this.loadAttempted = true;
    
    const spritePath = 'sprites/';
    
    // PROTOTYPE ART SWAP: the generic moa set renders with the Side_Moa_Walk art —
    // a 10-frame side walk cycle (Side_Moa_Walk_00..09). Art only: every species
    // key, its nutrition, size, tint and behaviour are untouched.
    //
    // Frame count is read from set.walk.length, so a 10-frame cycle needs no other
    // change. The non-moving/idle pose is frame 02 and the mating pose is frame 05,
    // both ALIASED from the walk array below — loadImage is not deduped, so alias
    // rather than reload.
    for (let i = 0; i <= 9; i++) {
      const n = String(i).padStart(2, '0');
      this.moa.walk.push(loadImage(
        `${spritePath}Side_Moa_Walk/Side_Moa_Walk_${n}.png`,
        () => {},
        () => console.warn(`Could not load Side_Moa_Walk_${n}.png`)
      ));
    }

    // Non-moving pose = frame 02; mating pose = frame 05. Same p5.Image objects
    // as the walk cycle above, not a second load.
    this.moa.idle = this.moa.walk[2];
    this.moa.mate = this.moa.walk[5];

    // Juveniles share the adult walk cycle — they are simply drawn smaller (moa
    // size scales with age; see TeManawa_moa.js updateSize). There is no separate
    // juvenile sprite state.

    // Bush moa (Anomalopteryx) — 5-frame walk + idle. While the generic set is
    // swapped to this same art (above), the variant ALIASES it rather than
    // loading the six files a second time: p5 does not dedupe loadImage, and
    // every duplicate request blocks the first frame. `spriteSet: 'bush'` keeps
    // working unchanged. Restore the loop when the generic art comes back.
    this.moaVariants.bush.walk = this.moa.walk;
    this.moaVariants.bush.idle = this.moa.idle;
    this.moaVariants.bush.mate = this.moa.mate;

    // Haast's eagle (Pouākai) — harrier wingbeat, frame count and resolution
    // depend on the active art mode.
    const eagleArt = ArtMode.setFor('eagle');
    console.log(`Art mode '${ArtMode.current}': loading ${eagleArt.count} eagle frames from ${eagleArt.dir}`);

    for (let i = 0; i < eagleArt.count; i++) {
      const n = String(eagleArt.first + i).padStart(eagleArt.pad, '0');
      const file = `${eagleArt.prefix}${n}.png`;
      this.eagle.fly.push(loadImage(
        `${spritePath}${eagleArt.dir}${file}`,
        () => {},
        () => console.warn(`Could not load ${file}`)
      ));
    }

    // Hunting/diving and resting/gliding hold a single frame of the cycle.
    this.eagle.dive = this.eagle.fly[eagleArt.huntFrame];
    this.eagle.glide = this.eagle.fly[eagleArt.glideFrame];
    this.eagle.artAngle = eagleArt.artAngle;

    // Kererū placeholder frame. The drawn-glyph fallback in Kereru.render covers a
    // load failure (never a silent () => {} FAILURE handler — CLAUDE.md).
    this.kereru.sprite = loadImage(
      `${spritePath}kereru0.png`,
      () => {},
      () => console.warn('Could not load kereru0.png')
    );

    this.loaded = true;
  },

  isValid(sprite) {
    return sprite && sprite.width > 0 && sprite.height > 0;
  },

  // Kererū placeholder frame, or null if it hasn't loaded (drawn-glyph fallback).
  getKereruSprite() {
    return this.isValid(this.kereru.sprite) ? this.kereru.sprite : null;
  },

  getMoaSprite(animTime, isMoving, variant = null, isMating = false) {
    const set = (variant && this.moaVariants[variant]) || this.moa;

    // Mating holds a single dedicated pose (frame 05), overriding the walk cycle.
    if (isMating && this.isValid(set.mate)) return set.mate;

    if (isMoving && set.walk.length > 0) {
      const frameIndex = Math.floor(animTime * this.animation.moaWalkSpeed) % set.walk.length;
      if (this.isValid(set.walk[frameIndex])) return set.walk[frameIndex];
    }

    if (this.isValid(set.idle)) return set.idle;

    // Variant art missing/not loaded yet → fall back to the generic moa set.
    if (set !== this.moa) return this.getMoaSprite(animTime, isMoving, null, isMating);

    return null;
  },

  // Bake one tinted copy of a loaded frame into an offscreen buffer, so the tint
  // is applied once here instead of per draw. Falls back to the untinted frame if
  // it hasn't loaded yet (so a not-yet-loaded frame is never cached as tinted).
  _bakeTintedFrame(img, r, g, b) {
    if (!this.isValid(img)) return img;
    const gph = createGraphics(img.width, img.height);
    gph.pixelDensity(1);
    gph.clear();
    gph.tint(r, g, b);
    gph.image(img, 0, 0);
    gph.noTint();
    return gph;
  },

  // Get (baking on first use) the tinted mirror of the generic moa set for a tint.
  _ensureTintSet(tint) {
    // Fast path: a species renders with the SAME tint array reference every
    // frame, so remember the last resolved (reference -> set) and skip rebuilding
    // the "r,g,b" key string on the hot path while the reference is unchanged
    // (this was ~300 short-lived strings/frame). A new/changed reference falls
    // through to the keyed object cache below — which is also what the boot
    // harness inspects (_tintCache['r,g,b'] and Object.keys), so the structure
    // and "baked once per colour" guarantee are unchanged.
    if (tint === this._lastTintRef && this._lastTintSet) return this._lastTintSet;
    const key = tint[0] + ',' + tint[1] + ',' + tint[2];
    let set = this._tintCache[key];
    if (!set) {
      const r = tint[0], g = tint[1], b = tint[2];
      set = { walk: [], idle: null, mate: null };
      for (const f of this.moa.walk) set.walk.push(this._bakeTintedFrame(f, r, g, b));
      // idle (02) and mate (05) alias baked walk frames — no duplicate buffers.
      set.idle = set.walk[2] || this._bakeTintedFrame(this.moa.idle, r, g, b);
      set.mate = set.walk[5] || this._bakeTintedFrame(this.moa.mate, r, g, b);
      this._tintCache[key] = set;
    }
    this._lastTintRef = tint;
    this._lastTintSet = set;
    return set;
  },

  // Like getMoaSprite, but returns a PRE-TINTED frame for `tint` ([r,g,b]). Frame
  // selection mirrors getMoaSprite exactly so the animation is identical; only the
  // source is the baked tinted mirror — no tint() call per frame (#6).
  getMoaSpriteTinted(animTime, isMoving, tint, isMating = false) {
    if (!tint) return this.getMoaSprite(animTime, isMoving, null, isMating);
    const set = this._ensureTintSet(tint);
    if (isMating && this.isValid(set.mate)) return set.mate;
    if (isMoving && set.walk.length > 0) {
      const fi = Math.floor(animTime * this.animation.moaWalkSpeed) % set.walk.length;
      if (this.isValid(set.walk[fi])) return set.walk[fi];
    }
    if (this.isValid(set.idle)) return set.idle;
    return this.getMoaSprite(animTime, isMoving, null, isMating);
  },

  getEagleSprite(animTime, state) {
    if ((state === 'hunting' || state === 'diving') && this.isValid(this.eagle.dive)) {
      return this.eagle.dive;
    }
    
    if (state === 'resting' && this.isValid(this.eagle.glide)) {
      return this.eagle.glide;
    }
    
    if (this.eagle.fly.length > 0) {
      const base = state === 'hunting' ? this.animation.eagleDiveSpeed : this.animation.eagleFlySpeed;
      // Keep the wingbeat frequency constant across art modes: a 16-frame
      // cycle steps twice as fast as the 8-frame cycle it was tuned against.
      const speed = base * (this.eagle.fly.length / this.animation.eagleFrameReference);
      const frameIndex = Math.floor(animTime * speed) % this.eagle.fly.length;
      const sprite = this.eagle.fly[frameIndex];
      if (this.isValid(sprite)) return sprite;
    }
    
    return null;
  }
};

function loadEntitySprites() {
  EntitySprites.load();
}