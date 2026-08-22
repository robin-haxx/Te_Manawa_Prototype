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
// Only the harrier (Eyles' harrier / kērangi) is wired up so far. Species without a
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

// Per-species moa art, in sprites/Moa/. Every moa species renders from one of
// these full-colour illustrations (the old Side_Moa_Walk placeholder is gone).
// They are drawn untinted and face RIGHT, so each carries its own faceSign (+1)
// for the render mirror (TeManawa_moa.js render()); the mechanism is per-set so
// a future set that faces the other way can just declare -1.
// Currently a single 'Running' frame per species; add frames by bumping `count`
// (files are zero-padded <prefix><nnnnn>.png, numbered first..first+count-1).
// A species opts in by setting `spriteSet: '<key>'` in its registry config; the
// three keys below are shared by the nine species (see TeManawa_species_data.js).
// The moa-GUILD grazers (goose, mōho/takahē) share this mechanism too — they are
// registered under the `moa` base type and render through the same path, so their
// dedicated art drops in here exactly like a moa variant.
const MOA_VARIANT_SETS = {
  bush:        { dir: 'Moa/', prefix: 'BushMoa_Running_',             pad: 5, first: 1, count: 1, faceSign: 1 },
  northGiant:  { dir: 'Moa/', prefix: 'NorthIslandGiantMoa_Running_', pad: 5, first: 1, count: 1, faceSign: 1 },
  stoutLegged: { dir: 'Moa/', prefix: 'StoutLeggedMoa_Running_',      pad: 5, first: 1, count: 1, faceSign: 1 },
  goose:       { dir: 'Moa/', prefix: 'Goose_Running_',              pad: 5, first: 1, count: 1, faceSign: 1 },
  takahe:      { dir: 'Moa/', prefix: 'Takahe_Running_',             pad: 5, first: 1, count: 1, faceSign: 1 }
};

// Declarative description of each species' artwork per mode.
//   dir/prefix/pad/first/count → how the frame filenames are built
//   huntFrame / glideFrame     → indices into the loaded frame list
//   artAngle                   → direction the art faces, radians (see SpriteAngle)
const ART_SETS = {
  eagle: {
    low: {
      // 8-frame wingbeat, filenames zero-padded to 5 digits, in the Flying/ subfolder
      // (sprites/EylesHarrier/Flying/EylesHarrier_Flying_00000..00007.png).
      dir: 'EylesHarrier/Flying/',
      prefix: 'EylesHarrier_Flying_',
      pad: 5,
      first: 0,
      count: 8,
      huntFrame: 4,
      glideFrame: 0,
      artAngle: 0.74,
      // Dedicated 8-frame hunting/dive cycle in its own Hunting/ subfolder
      // (sprites/EylesHarrier/Hunting/EylesHarrier_Hunting_00000..00007.png). Played
      // through in the hunting state; huntFrame above stays the single-frame fallback
      // for when this cycle is absent (e.g. the hi-res set).
      huntDir: 'EylesHarrier/Hunting/',
      huntPrefix: 'EylesHarrier_Hunting_',
      huntFirst: 0,
      huntCount: 8
    },
    high: {
      // 16-frame wingbeat at 500x500. Same pose cycle at double the frame
      // density, so the hunting pose is the phase-equivalent of low's frame 4.
      // No dedicated hunting cycle at hi-res — hunting holds huntFrame (frame 8).
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
  // Generic moa set. No longer authored art — load() aliases it to the
  // stout-legged illustration so the per-genus tint path (getMoaSpriteTinted,
  // exercised by the boot harness) has valid source frames. In-game every
  // species declares a spriteSet, so nothing renders this. faceSign is fixed up
  // to +1 in load() to match the aliased right-facing art.
  moa: {
    walk: [],
    idle: null,
    mate: null,
    faceSign: 1
  },
  // Dedicated per-species sprite sets, one per key in MOA_VARIANT_SETS above. A
  // species whose registry config sets e.g. `spriteSet: 'bush'` renders from
  // here (untinted) instead of the generic moa art. Populated in load().
  moaVariants: {
    bush:        { walk: [], idle: null, mate: null, faceSign: 1 },
    northGiant:  { walk: [], idle: null, mate: null, faceSign: 1 },
    stoutLegged: { walk: [], idle: null, mate: null, faceSign: 1 },
    goose:       { walk: [], idle: null, mate: null, faceSign: 1 },   // North Island goose (moa-guild grazer)
    takahe:      { walk: [], idle: null, mate: null, faceSign: 1 }    // mōho / NI takahē (moa-guild grazer)
  },
  eagle: {
    fly: [],
    hunt: [],   // dedicated hunting/dive cycle (low set); empty → falls back to `dive`
    dive: null,
    glide: null,
    // Direction the artwork itself faces, in image space, in radians.
    // 0 = pointing right, positive = clockwise (screen y is down), so
    // -HALF_PI = pointing up. Measured from the harrier frames: the beak sits
    // down-and-right of the body centroid at a consistent ~42° in BOTH the
    // low- and hi-res sets. Overwritten from ART_SETS at load time.
    artAngle: 0.74
  },
  // Kererū — two fallback frames: perched (side view, faces right) and flying
  // (top-down, wings spread). Kereru.render picks by state and mirrors for
  // leftward travel; the full flight cycle lands later.
  kereru: { perched: null, flying: null },
  // Kōkako — a single flight frame (sprites/Flighted); perched reuses it. Extends
  // the kererū render path (short-flight forest bird).
  kokako: { perched: null, flying: null },
  // Huia — sex-specific flight frames (the sexes were strongly dimorphic). Perched
  // reuses the flying frame.
  huia:   { male: null, female: null },
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
    // Cadence of the dedicated hunting/dive cycle. A touch faster than the
    // wingbeat so the strike reads as a committed, quickening stoop.
    eagleHuntSpeed: 0.18,
    // The eagle speeds above were tuned against an 8-frame cycle. All are
    // scaled by (frames / this) at playback so a longer cycle plays through
    // faster rather than halving the wingbeat frequency.
    eagleFrameReference: 8
  },

  load() {
    if (this.loadAttempted) return;
    this.loadAttempted = true;
    
    const spritePath = 'sprites/';

    // Per-species dedicated moa art (sprites/Moa/). Every moa species now renders
    // from one of these full-colour illustrations (the old Side_Moa_Walk generic
    // placeholder is gone). Each set is loaded from MOA_VARIANT_SETS; currently one
    // 'Running' frame apiece, so idle and mate alias that single frame — when a
    // walk cycle lands, bump `count` and the frame selection picks it up.
    // Juveniles share the adult frame, drawn smaller (see TeManawa_moa.js updateSize).
    for (const [key, art] of Object.entries(MOA_VARIANT_SETS)) {
      const set = this.moaVariants[key];
      for (let i = 0; i < art.count; i++) {
        const n = String(art.first + i).padStart(art.pad, '0');
        const file = `${art.prefix}${n}.png`;
        set.walk.push(loadImage(
          `${spritePath}${art.dir}${file}`,
          () => {},
          () => console.warn(`Could not load ${file}`)
        ));
      }
      set.idle = set.walk[0];
      set.mate = set.walk[0];
    }

    // The generic set is no longer authored art — it ALIASES the stout-legged
    // illustration purely so the per-genus tint path (getMoaSpriteTinted, which
    // the boot harness exercises) still has valid source frames to bake from.
    // In-game every species declares a spriteSet, so nothing renders the tinted
    // generic; faceSign matches the aliased right-facing art (+1).
    this.moa.walk = this.moaVariants.stoutLegged.walk;
    this.moa.idle = this.moaVariants.stoutLegged.idle;
    this.moa.mate = this.moaVariants.stoutLegged.mate;
    this.moa.faceSign = 1;

    // Eyles' harrier (kērangi) — harrier wingbeat, frame count and resolution
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

    // Dedicated hunting/dive cycle, where the active art set declares one (the low
    // set: EylesHarrier_Hunting_00000..). Played through in the hunting state. The
    // hi-res set has no hunt art, so this stays empty and hunting holds `dive`.
    if (eagleArt.huntPrefix && eagleArt.huntCount) {
      const huntDir = eagleArt.huntDir || eagleArt.dir;
      for (let i = 0; i < eagleArt.huntCount; i++) {
        const n = String((eagleArt.huntFirst || 0) + i).padStart(eagleArt.pad, '0');
        const file = `${eagleArt.huntPrefix}${n}.png`;
        this.eagle.hunt.push(loadImage(
          `${spritePath}${huntDir}${file}`,
          () => {},
          () => console.warn(`Could not load ${file}`)
        ));
      }
    }

    // Resting/gliding holds a single frame; `dive` is the single-frame hunting
    // fallback used when no dedicated hunt cycle is loaded.
    this.eagle.dive = this.eagle.fly[eagleArt.huntFrame];
    this.eagle.glide = this.eagle.fly[eagleArt.glideFrame];
    this.eagle.artAngle = eagleArt.artAngle;

    // Kererū fallback frames — perched (side) and flying (top-down). The drawn-glyph
    // fallback in Kereru.render covers a load failure (never a silent () => {}
    // FAILURE handler — CLAUDE.md).
    this.kereru.perched = loadImage(
      `${spritePath}Kereru_Perched.png`,
      () => {},
      () => console.warn('Could not load Kereru_Perched.png')
    );
    this.kereru.flying = loadImage(
      `${spritePath}Kereru_Flying.png`,
      () => {},
      () => console.warn('Could not load Kereru_Flying.png')
    );

    // Kōkako + huia — the flighted forest wattlebirds (sprites/Flighted). A single
    // flight frame each (huia sexed); perched falls back to the flight frame, and a
    // drawn-glyph fallback in the classes covers a load failure (never a silent
    // () => {} FAILURE handler — CLAUDE.md).
    this.kokako.flying = loadImage(
      `${spritePath}Flighted/Kokako_Flying_00001.png`,
      () => {},
      () => console.warn('Could not load Kokako_Flying_00001.png')
    );
    this.huia.male = loadImage(
      `${spritePath}Flighted/HuiaMale_Flying_00001.png`,
      () => {},
      () => console.warn('Could not load HuiaMale_Flying_00001.png')
    );
    this.huia.female = loadImage(
      `${spritePath}Flighted/HuiaFemale_Flying_00001.png`,
      () => {},
      () => console.warn('Could not load HuiaFemale_Flying_00001.png')
    );

    this.loaded = true;
  },

  isValid(sprite) {
    return sprite && sprite.width > 0 && sprite.height > 0;
  },

  // Kererū frame for the current pose: perched (true) or flying (false). Falls
  // back to whichever frame did load, then to null (drawn-glyph fallback).
  getKereruSprite(perched) {
    const k = this.kereru;
    const want = perched ? k.perched : k.flying;
    if (this.isValid(want)) return want;
    const other = perched ? k.flying : k.perched;
    return this.isValid(other) ? other : null;
  },

  // Kōkako frame. Only a flying frame exists, so perched reuses it; null → glyph.
  getKokakoSprite(perched) {
    const k = this.kokako;
    const want = perched ? (k.perched || k.flying) : (k.flying || k.perched);
    return this.isValid(want) ? want : null;
  },

  // Huia frame for the bird's sex (the sexes are drawn differently). Falls back to
  // the other sex's frame if one failed to load, then to null (drawn-glyph fallback).
  getHuiaSprite(perched, isFemale) {
    const h = this.huia;
    const want = isFemale ? h.female : h.male;
    if (this.isValid(want)) return want;
    const other = isFemale ? h.male : h.female;
    return this.isValid(other) ? other : null;
  },

  // Resolve the sprite set for a variant, falling back to the generic set when
  // the variant has no usable art loaded. Both getMoaSprite and getMoaFaceSign
  // go through here so the mirror sign always matches the set that actually
  // rendered (they must not diverge, or the fallback moa faces backwards).
  _resolveMoaSet(variant) {
    const set = variant && this.moaVariants[variant];
    if (set && set.walk.length > 0 && this.isValid(set.walk[0])) return set;
    return this.moa;
  },

  getMoaSprite(animTime, isMoving, variant = null, isMating = false) {
    const set = this._resolveMoaSet(variant);

    // Mating holds a dedicated pose, overriding the walk cycle.
    if (isMating && this.isValid(set.mate)) return set.mate;

    if (isMoving && set.walk.length > 0) {
      const frameIndex = Math.floor(animTime * this.animation.moaWalkSpeed) % set.walk.length;
      if (this.isValid(set.walk[frameIndex])) return set.walk[frameIndex];
    }

    if (this.isValid(set.idle)) return set.idle;

    return null;
  },

  // Horizontal mirror sign for a variant's art (see TeManawa_moa.js render()).
  // Resolves through the same fallback as getMoaSprite so it tracks the set that
  // actually draws: generic art faces left (-1), the Moa/ illustrations right (+1).
  getMoaFaceSign(variant = null) {
    return this._resolveMoaSet(variant).faceSign;
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
    // `img` may be an AtlasFrame once the sprites are packed — the global image()
    // wrap does not cover the graphics-method draw, so route through drawTo().
    if (typeof SpriteAtlas !== 'undefined' && SpriteAtlas.isFrame(img)) {
      SpriteAtlas.drawTo(gph, img, 0, 0);
    } else {
      gph.image(img, 0, 0);
    }
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

  // How many complete wingbeat cycles the fly clock has run through by `animTime`.
  // Increments exactly when the displayed fly frame wraps 7→0, so the eagle can hold
  // a hunt entry until the current flap finishes. Frame-count-agnostic by design (the
  // wingbeat frequency is held constant across art modes).
  eagleFlapCycle(animTime) {
    const n = this.eagle.fly.length;
    if (!n) return 0;
    const speed = this.animation.eagleFlySpeed * (n / this.animation.eagleFrameReference);
    return Math.floor(Math.floor(animTime * speed) / n);
  },

  // Return one EXPLICIT hunting/dive frame by index (0-based). The harrier drives the
  // talon grab by prey proximity and by a retraction timer, not by a cadence, so it
  // asks for a specific frame rather than a phase. Clamped to the loaded set; falls
  // back to the single held dive pose (hi-res set, or a load failure).
  getEagleHuntFrame(index) {
    const hunt = this.eagle.hunt;
    if (hunt && hunt.length > 0) {
      const i = Math.max(0, Math.min(hunt.length - 1, index | 0));
      const sprite = hunt[i];
      if (this.isValid(sprite)) return sprite;
    }
    return this.isValid(this.eagle.dive) ? this.eagle.dive : null;
  },

  getEagleSprite(animTime, state) {
    if (state === 'hunting' || state === 'diving') {
      // Dedicated hunting/dive cycle where one is loaded (low set). animTime is
      // passed hunt-relative by the caller, so the cycle begins on its first frame.
      if (this.eagle.hunt.length > 0) {
        const speed = this.animation.eagleHuntSpeed * (this.eagle.hunt.length / this.animation.eagleFrameReference);
        const frameIndex = Math.floor(animTime * speed) % this.eagle.hunt.length;
        const sprite = this.eagle.hunt[frameIndex];
        if (this.isValid(sprite)) return sprite;
      }
      // Fallback: single held hunting frame (hi-res set, or a load failure).
      if (this.isValid(this.eagle.dive)) return this.eagle.dive;
    }

    if (state === 'resting' && this.isValid(this.eagle.glide)) {
      return this.eagle.glide;
    }

    if (this.eagle.fly.length > 0) {
      // Keep the wingbeat frequency constant across art modes: a 16-frame
      // cycle steps twice as fast as the 8-frame cycle it was tuned against.
      const speed = this.animation.eagleFlySpeed * (this.eagle.fly.length / this.animation.eagleFrameReference);
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