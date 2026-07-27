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
  current: 'high',            // 'low' | 'high'

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
      dir: 'EylesHarrier/',
      prefix: 'EylesHarrier_Flying_',
      pad: 2,
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
    juvenileWalk: []
  },
  // Dedicated per-species sprite sets. A species whose registry config sets
  // e.g. `spriteSet: 'bush'` renders from here instead of the generic moa art.
  moaVariants: {
    bush: { walk: [], idle: null }
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
  loaded: false,
  loadAttempted: false,
  
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
    
    // Moa walk cycle (4 frames)
    for (let i = 1; i <= 4; i++) {
      this.moa.walk.push(loadImage(
        `${spritePath}moa_walk_${i}.png`,
        () => console.log(`Loaded moa_walk_${i}.png`),
        () => console.warn(`Could not load moa_walk_${i}.png`)
      ));
    }
    
    this.moa.idle = loadImage(
      `${spritePath}moa_idle.png`,
      () => console.log('Loaded moa_idle.png'),
      () => console.warn('Could not load moa_idle.png')
    );
    
    // There is no moa_juvenile.png — the art is a 4-frame walk cycle. This used
    // to load a non-existent file with an empty failure callback, so it failed
    // silently and juveniles rendered as adults (TEMANAWA_BUILD_V3.md §2.4).
    for (let i = 1; i <= 4; i++) {
      this.moa.juvenileWalk.push(loadImage(
        `${spritePath}moa_juvenile_walk_${i}.png`,
        () => {},
        () => console.warn(`Could not load moa_juvenile_walk_${i}.png`)
      ));
    }
    
    // Bush moa (Anomalopteryx) — its own art, 5-frame walk + idle
    for (let i = 1; i <= 5; i++) {
      const n = String(i).padStart(2, '0');
      this.moaVariants.bush.walk.push(loadImage(
        `${spritePath}LB_moa_walk_${n}.png`,
        () => console.log(`Loaded LB_moa_walk_${n}.png`),
        () => console.warn(`Could not load LB_moa_walk_${n}.png`)
      ));
    }
    this.moaVariants.bush.idle = loadImage(
      `${spritePath}LB_moa_idle.png`,
      () => console.log('Loaded LB_moa_idle.png'),
      () => console.warn('Could not load LB_moa_idle.png')
    );

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

    this.loaded = true;
  },

  isValid(sprite) {
    return sprite && sprite.width > 0 && sprite.height > 0;
  },

  getMoaSprite(animTime, isMoving, isJuvenile = false, variant = null) {
    const set = (variant && this.moaVariants[variant]) || this.moa;

    // Juveniles have their own walk cycle and no idle frame of their own.
    if (isJuvenile && this.moa.juvenileWalk.length > 0) {
      const jf = Math.floor(animTime * this.animation.moaWalkSpeed) % this.moa.juvenileWalk.length;
      if (this.isValid(this.moa.juvenileWalk[jf])) return this.moa.juvenileWalk[jf];
    }

    if (isMoving && set.walk.length > 0) {
      const frameIndex = Math.floor(animTime * this.animation.moaWalkSpeed) % set.walk.length;
      if (this.isValid(set.walk[frameIndex])) return set.walk[frameIndex];
    }

    if (this.isValid(set.idle)) return set.idle;

    // Variant art missing/not loaded yet → fall back to the generic moa set.
    if (set !== this.moa) return this.getMoaSprite(animTime, isMoving, isJuvenile);

    return null;
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