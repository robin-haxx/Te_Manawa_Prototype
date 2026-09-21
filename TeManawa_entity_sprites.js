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
// Every set here is now MULTI-STATE: the final per-species art, three cel cycles apiece
// in their own subfolders: LOOKING (idle), EATING (graze cycle) and WALKING (movement).
// `base` is the species folder; each state names its subfolder, prefix, and frame count
// (files are zero-padded <prefix><nnnnn>.png, first..first+count-1). A species opts in by
// setting `spriteSet: '<key>'` in its registry config; the three moa keys (bush/northGiant/
// stoutLegged) are shared by the nine moa species (see TeManawa_species_data.js). The
// moa-GUILD birds share this mechanism too — goose, mōho/takahē and the kiwi each render
// through the same path from their own dedicated art. (A flat single-'Running'-frame schema
// used to coexist here for the goose/takahē placeholders; both now carry full art.)
// CoastalMoa art is the stout-legged genus family (Euryapteryx/Pachyornis stocky build);
// GiantMoa is the Dinornis giants (files carry the NorthMoa_ prefix); the goose art carries
// the NorthGoose_ prefix.
const MOA_VARIANT_SETS = {
  bush: { base: 'Moa/BushMoa/', faceSign: 1, states: {
    looking: { dir: 'Looking/', prefix: 'BushMoa_Looking_', pad: 5, first: 0, count: 11 },
    eating:  { dir: 'Eating/',  prefix: 'BushMoa_Eating_',  pad: 5, first: 0, count: 11 },
    walking: { dir: 'Walking/', prefix: 'BushMoa_Walking_', pad: 5, first: 0, count: 8  }
  } },
  northGiant: { base: 'Moa/GiantMoa/', faceSign: 1, states: {
    looking: { dir: 'Looking/', prefix: 'NorthMoa_Looking_', pad: 5, first: 0, count: 11 },
    eating:  { dir: 'Eating/',  prefix: 'NorthMoa_Eating_',  pad: 5, first: 0, count: 11 },
    walking: { dir: 'Walking/', prefix: 'NorthMoa_Walking_', pad: 5, first: 0, count: 8  }
  } },
  stoutLegged: { base: 'Moa/CoastalMoa/', faceSign: 1, states: {
    looking: { dir: 'Looking/', prefix: 'CoastalMoa_Looking_', pad: 5, first: 0, count: 11 },
    eating:  { dir: 'Eating/',  prefix: 'CoastalMoa_Eating_',  pad: 5, first: 0, count: 11 },
    walking: { dir: 'Walking/', prefix: 'CoastalMoa_Walking_', pad: 5, first: 0, count: 8  }
  } },
  // North Island goose (Cnemiornis gracilis) — moa-guild open-country grazer. NorthGoose_ prefix.
  goose: { base: 'Moa/Goose/', faceSign: 1, states: {
    looking: { dir: 'Looking/', prefix: 'NorthGoose_Looking_', pad: 5, first: 0, count: 11 },
    eating:  { dir: 'Eating/',  prefix: 'NorthGoose_Eating_',  pad: 5, first: 0, count: 11 },
    walking: { dir: 'Walking/', prefix: 'NorthGoose_Walking_', pad: 5, first: 0, count: 8  }
  } },
  // Mōho / NI takahē (Porphyrio mantelli) — moa-guild territorial rail.
  takahe: { base: 'Moa/Takahe/', faceSign: 1, states: {
    looking: { dir: 'Looking/', prefix: 'Takahe_Looking_', pad: 5, first: 0, count: 11 },
    eating:  { dir: 'Eating/',  prefix: 'Takahe_Eating_',  pad: 5, first: 0, count: 11 },
    walking: { dir: 'Walking/', prefix: 'Takahe_Walking_', pad: 5, first: 0, count: 8  }
  } },
  // North Island brown kiwi (Apteryx mantelli) — the forest-floor litter-prober. A moa-guild
  // grazer mechanically; its unique role is soil-turning (see TeManawa_kiwi.js).
  kiwi: { base: 'Moa/Kiwi/', faceSign: 1, states: {
    looking: { dir: 'Looking/', prefix: 'Kiwi_Looking_', pad: 5, first: 0, count: 11 },
    eating:  { dir: 'Eating/',  prefix: 'Kiwi_Eating_',  pad: 5, first: 0, count: 11 },
    walking: { dir: 'Walking/', prefix: 'Kiwi_Walking_', pad: 5, first: 0, count: 8  }
  } },
  // Finsch's duck (Chenonetta finschi) — moa-guild open-country grazing duck (own FinschDuck class).
  finschDuck: { base: 'Moa/FinschsDuck/', faceSign: 1, states: {
    looking: { dir: 'Looking/', prefix: 'FinschsDuck_Looking_', pad: 5, first: 0, count: 11 },
    eating:  { dir: 'Eating/',  prefix: 'FinschsDuck_Eating_',  pad: 5, first: 0, count: 11 },
    walking: { dir: 'Walking/', prefix: 'FinschsDuck_Walking_', pad: 5, first: 0, count: 8  }
  } }
};

// Per-species FLIGHTED-BIRD art, in sprites/Flighted/. Same multi-state shape as
// MOA_VARIANT_SETS: three cel cycles apiece — FLYING (wingbeat), HOPPING (the perch
// idle) and EATING (the feed cycle) — each in its own subfolder, files zero-padded
// <prefix><nnnnn>.png. The kererū + kōkako share one set each; the huia is sexed
// (male/female were strongly dimorphic) so it carries two. EntitySprites.load()
// loads these into the matching sets, and the Kereru render path indexes them by
// the bird's animation state (Kereru._flyerState → flying/eating/hopping).
const FLYER_VARIANT_SETS = {
  kereru:     { base: 'Flighted/Kereru/',      states: {
    flying:  { dir: 'Flying/',  prefix: 'Kereru_Flying_',  pad: 5, first: 0, count: 15 },
    hopping: { dir: 'Hopping/', prefix: 'Kereru_Hopping_', pad: 5, first: 0, count: 10 },
    eating:  { dir: 'Eating/',  prefix: 'Kereru_Eating_',  pad: 5, first: 0, count: 8  }
  } },
  kokako:     { base: 'Flighted/Kokako/',      states: {
    flying:  { dir: 'Flying/',  prefix: 'Kokako_Flying_',  pad: 5, first: 0, count: 15 },
    hopping: { dir: 'Hopping/', prefix: 'Kokako_Hopping_', pad: 5, first: 0, count: 10 },
    eating:  { dir: 'Eating/',  prefix: 'Kokako_Eating_',  pad: 5, first: 0, count: 8  }
  } },
  huiaMale:   { base: 'Flighted/Huia_Male/',   states: {
    flying:  { dir: 'Flying/',  prefix: 'HuiaMale_Flying_',  pad: 5, first: 0, count: 15 },
    hopping: { dir: 'Hopping/', prefix: 'HuiaMale_Hopping_', pad: 5, first: 0, count: 10 },
    eating:  { dir: 'Eating/',  prefix: 'HuiaMale_Eating_',  pad: 5, first: 0, count: 8  }
  } },
  huiaFemale: { base: 'Flighted/Huia_Female/', states: {
    flying:  { dir: 'Flying/',  prefix: 'HuiaFemale_Flying_',  pad: 5, first: 0, count: 15 },
    hopping: { dir: 'Hopping/', prefix: 'HuiaFemale_Hopping_', pad: 5, first: 0, count: 10 },
    eating:  { dir: 'Eating/',  prefix: 'HuiaFemale_Eating_',  pad: 5, first: 0, count: 8  }
  } },
  // Tūī (Prosthemadera novaeseelandiae) — the singing nectar-feeder (own Tui class, extends
  // Kokako). NB: the Hopping/ folder ships 240 PNGs but they are a 10-frame loop exported 24×
  // (00010==00000, …) — only the first 10 UNIQUE frames are referenced so the atlas stays lean.
  tui: { base: 'Flighted/Tui/', states: {
    flying:  { dir: 'Flying/',  prefix: 'Tui_Flying_',  pad: 5, first: 0, count: 15 },
    hopping: { dir: 'Hopping/', prefix: 'Tui_Hopping_', pad: 5, first: 0, count: 10 },
    eating:  { dir: 'Eating/',  prefix: 'Tui_Eating_',  pad: 5, first: 0, count: 8  }
  } }
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
      huntCount: 8,
      // Perched clip (sprites/EylesHarrier/Perched/, 19 frames, same top-down view
      // and facing as the wingbeat). It is a full land → idle → takeoff sequence, so
      // it plays back in three windows (see the eagle 'resting'/'takeoff' render):
      //   LAND    0–6  — played once as the bird drops onto the perch,
      //   IDLE    7–14 — looped while it sits (the perched idle),
      //   TAKEOFF 15–18 — played once as it launches back into flight.
      perchedDir: 'EylesHarrier/Perched/',
      perchedPrefix: 'EylesHarrier_Perched_',
      perchedFirst: 0,
      perchedCount: 19,
      perchLandEnd: 6,
      perchIdleStart: 7,
      perchIdleEnd: 14,
      perchTakeoffStart: 15
    }
    // (The old EylesHarrier_HiRes 'high' set was retired with those PNGs; ArtMode
    // falls back to 'low', so ?art=high now just loads this set.)
  }
};

// ============================================
// ENTITY SPRITE MANAGER
// ============================================

const EntitySprites = {
  // ============================================================
  // BOOST OUTLINE — a coloured silhouette ring under a boosted sprite.
  // ------------------------------------------------------------
  // The second-screen boost (md/TEMANAWA_SECOND_SCREEN.md) rings the chosen plant + its linked
  // birds. Ported from Mauri's field-guide outline: in GL mode a ring of pure-colour SILHOUETTE
  // quads (GLBatch._silhouette) is stamped UNDER the sprite, into the SAME entity batch — so an
  // outline adds NO draw call and NO extra pass, only a handful of quads for the few boosted
  // entities. 2D mode (?render=2d) has no silhouette shader, so the ring is simply skipped.
  // ============================================================

  // Stamp a sprite-shaped colour ring around the CURRENT origin (caller centres the sprite at 0,0,
  // or boostOutline wraps a translate). `thickness` is in source-sprite px so the ring keeps a
  // constant proportion at any zoom. `col` is [r,g,b]; alpha gently pulses unless given.
  drawSpriteOutline(baseSprite, drawW, drawH, col, thickness = 6, alpha = null) {
    if (!baseSprite || !col) return;
    if (!(typeof GLBatch !== 'undefined' && GLBatch.enabled && GLBatch._open)) return;   // GL-only (see header)
    const a = (alpha != null) ? alpha : 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(frameCount * 0.12));
    const off = thickness * (drawW / (baseSprite.width || drawW));
    const steps = 16;
    push();
    imageMode(CENTER);
    tint(col[0], col[1], col[2], 255 * a);      // per-quad colour — free on GL, never a bake
    GLBatch._silhouette = true;
    for (let i = 0; i < steps; i++) {
      const ang = (i / steps) * TWO_PI;
      image(baseSprite, Math.cos(ang) * off, Math.sin(ang) * off, drawW, drawH);
    }
    GLBatch._silhouette = false;
    noTint();
    pop();
  },

  // Gate + stamp for the boost highlight. Called from an entity render() just before it draws its
  // own sprite: outlines this entity iff its species key is in the live boost set (`game._boostHi`)
  // and the window is open. (cx,cy) is the sprite centre in the current transform (default 0,0, for
  // fauna that draw imageMode(CENTER) at the origin). Allocation-free and push-free on the common
  // no-boost path — it returns before touching the matrix.
  boostOutline(entity, sprite, drawW, drawH, cx, cy) {
    const g = (typeof game !== 'undefined') ? game : null;
    const hi = g && g._boostHi;
    if (!hi || !sprite) return;
    if (typeof millis === 'function' && millis() > hi.until) return;
    const key = entity && (entity.speciesKey || entity.type);
    if (!key || !hi.keys.has(key)) return;
    push();
    if (cx !== undefined) translate(cx, cy || 0);
    this.drawSpriteOutline(sprite, drawW, drawH, hi.color);
    pop();
  },

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
  // looking/eating/walking hold the multi-state cel cycles; walk/idle/mate are the
  // legacy aliases the generic tint path and the fallback selection still read (walk
  // aliases walking, idle/mate the first looking frame — set in load()).
  moaVariants: {
    bush:        { looking: [], eating: [], walking: [], walk: [], idle: null, mate: null, faceSign: 1 },
    northGiant:  { looking: [], eating: [], walking: [], walk: [], idle: null, mate: null, faceSign: 1 },
    stoutLegged: { looking: [], eating: [], walking: [], walk: [], idle: null, mate: null, faceSign: 1 },
    goose:       { looking: [], eating: [], walking: [], walk: [], idle: null, mate: null, faceSign: 1 },   // North Island goose (moa-guild grazer)
    takahe:      { looking: [], eating: [], walking: [], walk: [], idle: null, mate: null, faceSign: 1 },   // mōho / NI takahē (moa-guild grazer)
    kiwi:        { looking: [], eating: [], walking: [], walk: [], idle: null, mate: null, faceSign: 1 },   // NI brown kiwi (moa-guild; forest-floor prober)
    finschDuck:  { looking: [], eating: [], walking: [], walk: [], idle: null, mate: null, faceSign: 1 }    // Finsch's duck (moa-guild; open-country grazing duck)
  },
  eagle: {
    fly: [],
    hunt: [],   // dedicated hunting/dive cycle (low set); empty → falls back to `dive`
    perched: [],   // land→idle→takeoff clip (see ART_SETS.eagle.low perched*); windows in perchCfg
    perchCfg: null,   // { landEnd, idleStart, idleEnd, takeoffStart, last } — set in load()
    dive: null,
    glide: null,
    // Direction the artwork itself faces, in image space, in radians.
    // 0 = pointing right, positive = clockwise (screen y is down), so
    // -HALF_PI = pointing up. Measured from the harrier frames: the beak sits
    // down-and-right of the body centroid at a consistent ~42° in BOTH the
    // low- and hi-res sets. Overwritten from ART_SETS at load time.
    artAngle: 0.74
  },
  // Flighted forest birds — the full multi-state cel cycles (FLYING / HOPPING /
  // EATING), one set per key in FLYER_VARIANT_SETS, populated in load(). The
  // Kereru render path indexes them by the bird's animation state (getKereruSprite
  // / getKokakoSprite / getHuiaSprite → _flyerFrame). The huia is sexed (the sexes
  // were strongly dimorphic), so it carries a male and a female set.
  kereru:     { flying: [], hopping: [], eating: [] },
  kokako:     { flying: [], hopping: [], eating: [] },
  huiaMale:   { flying: [], hopping: [], eating: [] },
  huiaFemale: { flying: [], hopping: [], eating: [] },
  tui:        { flying: [], hopping: [], eating: [] },
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
    // Flighted forest birds (kererū/kōkako/huia). One wall-clock cadence for all
    // three cel cycles — a touch quicker than the moa's plod for a lighter wingbeat.
    flyerSpeed: 0.16,
    // Harrier perched clip — the land/idle cadence (the takeoff window is paced by
    // the eagle's own takeoff timer instead, so it always finishes before flight).
    eaglePerchSpeed: 0.12,
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

    // Per-species dedicated moa art (sprites/Moa/). Each set is loaded from
    // MOA_VARIANT_SETS. A multi-state set (base + states{looking,eating,walking})
    // loads three cel cycles into those arrays; every set is multi-state now, but the
    // flat-set path (a bare dir/prefix/count, loaded into walk) is kept for robustness.
    // In both cases walk/idle/mate are aliased so the tint path and the state fallbacks
    // always have a valid frame. Juveniles share the adult frames, drawn smaller (see
    // TeManawa_moa.js updateAge).
    const loadFrames = (into, base, spec) => {
      for (let i = 0; i < spec.count; i++) {
        const n = String(spec.first + i).padStart(spec.pad, '0');
        const file = `${spec.prefix}${n}.png`;
        into.push(loadImage(
          `${spritePath}${base}${spec.dir || ''}${file}`,
          () => {},
          () => console.warn(`Could not load ${file}`)
        ));
      }
    };
    for (const [key, art] of Object.entries(MOA_VARIANT_SETS)) {
      const set = this.moaVariants[key];
      if (art.states) {
        loadFrames(set.looking, art.base, art.states.looking);
        loadFrames(set.eating,  art.base, art.states.eating);
        loadFrames(set.walking, art.base, art.states.walking);
        set.walk = set.walking;                              // generic/tint alias
        set.idle = set.looking[0] || set.walking[0];
        set.mate = set.looking[0] || set.walking[0];
      } else {
        loadFrames(set.walk, '', art);                       // flat set: art carries dir/prefix/… directly
        set.idle = set.walk[0];
        set.mate = set.walk[0];
      }
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

    // Perched clip (land→idle→takeoff), where the active set declares one (the low
    // set: EylesHarrier_Perched_00000..00018). Played in the 'resting'/'takeoff' render
    // states; absent (the fallback set) → resting holds the glide frame.
    if (eagleArt.perchedPrefix && eagleArt.perchedCount) {
      const perchedDir = eagleArt.perchedDir || eagleArt.dir;
      for (let i = 0; i < eagleArt.perchedCount; i++) {
        const n = String((eagleArt.perchedFirst || 0) + i).padStart(eagleArt.pad, '0');
        const file = `${eagleArt.perchedPrefix}${n}.png`;
        this.eagle.perched.push(loadImage(
          `${spritePath}${perchedDir}${file}`,
          () => {},
          () => console.warn(`Could not load ${file}`)
        ));
      }
      this.eagle.perchCfg = {
        landEnd:      eagleArt.perchLandEnd ?? 6,
        idleStart:    eagleArt.perchIdleStart ?? 7,
        idleEnd:      eagleArt.perchIdleEnd ?? 14,
        takeoffStart: eagleArt.perchTakeoffStart ?? 15,
        last:         eagleArt.perchedCount - 1
      };
    }

    // Resting/gliding holds a single frame; `dive` is the single-frame hunting
    // fallback used when no dedicated hunt cycle is loaded.
    this.eagle.dive = this.eagle.fly[eagleArt.huntFrame];
    this.eagle.glide = this.eagle.fly[eagleArt.glideFrame];
    this.eagle.artAngle = eagleArt.artAngle;

    // Flighted forest birds (kererū / kōkako / huia) — the full multi-state cel
    // cycles from FLYER_VARIANT_SETS, loaded into the matching sets exactly like the
    // moa. Each frame carries a real failure callback (never a silent () => {} —
    // CLAUDE.md); a set that fails to load falls back to the drawn glyph in the class.
    for (const [key, art] of Object.entries(FLYER_VARIANT_SETS)) {
      const set = this[key];
      if (!set || !art.states) continue;
      loadFrames(set.flying,  art.base, art.states.flying);
      loadFrames(set.hopping, art.base, art.states.hopping);
      loadFrames(set.eating,  art.base, art.states.eating);
    }

    this.loaded = true;
  },

  isValid(sprite) {
    return sprite && sprite.width > 0 && sprite.height > 0;
  },

  // The 15-frame flighted-bird FLYING clip is a takeoff → in-flight → landing sequence:
  //   TAKEOFF 0–2   played once as the bird leaves a perch,
  //   CRUISE  3–11  looped in sustained flight,
  //   LAND    12–14 played once as it settles onto the next perch.
  // The three windows are driven by the bird's altitude (Kereru._flyerAnim): rising off
  // a perch = takeoff, at cruise = the loop, descending = landing — so the transition
  // frames play exactly over the take-off / touch-down, no separate clock needed.
  flightWindow: { takeoff: [0, 2], cruise: [3, 11], land: [12, 14], minFrames: 15 },

  // One frame from [a..b] of `list` by progress t (0..1), clamped (a → b).
  _windowFrame(list, a, b, t) {
    const n = b - a + 1;
    const k = a + Math.min(n - 1, Math.max(0, Math.floor((t || 0) * n)));
    return list[Math.max(0, Math.min(list.length - 1, k))];
  },
  // Loop [a..b] of `list` on the wall-clock cel cadence.
  _loopWindow(list, a, b, animTime) {
    const n = b - a + 1;
    return list[a + (Math.floor(animTime * this.animation.flyerSpeed) % Math.max(1, n))];
  },

  // Pick the frame for a flighted bird's animation STATE:
  //   'takeoff' | 'cruise' | 'land' — windows of the flying clip (t = phase progress),
  //   'eating' | 'hopping'          — the perched cel cycles (looped on animTime).
  // Graceful fallbacks so a set missing a cycle still draws. null → the drawn glyph.
  _flyerFrame(set, animTime, state, t) {
    if (!set) return null;
    const F = set.flying, W = this.flightWindow;
    let list = null;
    if (state === 'takeoff' || state === 'cruise' || state === 'land' || state === 'flying') {
      if (F && F.length >= W.minFrames) {
        if (state === 'takeoff') { const s = this._windowFrame(F, W.takeoff[0], W.takeoff[1], t); if (this.isValid(s)) return s; }
        else if (state === 'land') { const s = this._windowFrame(F, W.land[0], W.land[1], t); if (this.isValid(s)) return s; }
        else { const s = this._loopWindow(F, W.cruise[0], W.cruise[1], animTime); if (this.isValid(s)) return s; }
      }
      list = (F && F.length) ? F : set.hopping;                 // short/absent clip → loop the whole thing
    } else if (state === 'eating') {
      list = (set.eating && set.eating.length) ? set.eating
        : ((set.hopping && set.hopping.length) ? set.hopping : F);
    } else {                                                    // hopping / perch idle
      list = (set.hopping && set.hopping.length) ? set.hopping : F;
    }
    if (list && list.length > 0) {
      const fi = Math.floor(animTime * this.animation.flyerSpeed) % list.length;
      if (this.isValid(list[fi])) return list[fi];
    }
    // Last resort: the first valid frame of any cycle this set actually loaded.
    const all = [set.flying, set.hopping, set.eating];
    for (let i = 0; i < all.length; i++) {
      const l = all[i];
      if (l && l.length > 0 && this.isValid(l[0])) return l[0];
    }
    return null;
  },

  // Kererū / kōkako / tūī frame for an animation state (+ phase progress t for takeoff/land).
  getKereruSprite(animTime, state, t) { return this._flyerFrame(this.kereru, animTime, state, t); },
  getKokakoSprite(animTime, state, t) { return this._flyerFrame(this.kokako, animTime, state, t); },
  getTuiSprite(animTime, state, t)    { return this._flyerFrame(this.tui, animTime, state, t); },

  // Huia frame for the bird's sex (the sexes are drawn differently — male short-
  // billed, female long-billed). Falls back to the other sex's set if one failed
  // to load, then to null (drawn-glyph fallback).
  getHuiaSprite(animTime, state, isFemale, t) {
    const set = isFemale ? this.huiaFemale : this.huiaMale;
    const s = this._flyerFrame(set, animTime, state, t);
    if (s) return s;
    return this._flyerFrame(isFemale ? this.huiaMale : this.huiaFemale, animTime, state, t);
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

  // The frame list for an animation state, with graceful fallbacks so a set that
  // has no art for the requested state (e.g. a flat set that only has `walk`, or the
  // generic tint set) still returns something: eating → walking → walk; walking → walk;
  // looking → its own frames or null (→ set.idle in getMoaSprite).
  _framesForState(set, state) {
    if (state === 'walking') return (set.walking && set.walking.length) ? set.walking : set.walk;
    if (state === 'eating') return (set.eating && set.eating.length) ? set.eating
      : ((set.walking && set.walking.length) ? set.walking : set.walk);
    return (set.looking && set.looking.length) ? set.looking : null;   // looking / idle
  },

  // Pick the frame for a moa's animation STATE ('walking' | 'eating' | 'looking').
  // animTime advances on the real frame clock (Boid.update), so the cel cadence is
  // wall-clock steady at any deep-time multiplier (see the animation block).
  getMoaSprite(animTime, state, variant = null) {
    const set = this._resolveMoaSet(variant);
    const list = this._framesForState(set, state);
    if (list && list.length > 0) {
      const frameIndex = Math.floor(animTime * this.animation.moaWalkSpeed) % list.length;
      if (this.isValid(list[frameIndex])) return list[frameIndex];
    }
    if (this.isValid(set.idle)) return set.idle;
    if (list && list.length > 0 && this.isValid(list[0])) return list[0];
    return null;
  },

  // Horizontal mirror sign for a variant's art (see TeManawa_moa.js render()).
  // Resolves through the same fallback as getMoaSprite so it tracks the set that
  // actually draws: generic art faces left (-1), the Moa/ illustrations right (+1).
  getMoaFaceSign(variant = null) {
    return this._resolveMoaSet(variant).faceSign;
  },

  // animTime span of ONE full cel cycle of a STATE for a variant (frames ÷ cadence).
  // Measured in animTime — the same clock the renderer indexes frames from — so it is
  // exactly one cycle at any pace, and it resolves through the same fallback as
  // getMoaSprite so it matches the art that actually plays. Used to hold a full eating
  // cycle before moving on (executeState) and to latch the walk pose to a clean cycle
  // instead of strobing when speed dithers across the gate (Boid.update walk latch).
  moaCyclePeriod(state, variant = null) {
    const set = this._resolveMoaSet(variant);
    const list = this._framesForState(set, state);
    const n = (list && list.length) ? list.length : 1;
    return n / this.animation.moaWalkSpeed;
  },
  moaEatCyclePeriod(variant = null) { return this.moaCyclePeriod('eating', variant); },

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
    const _state = isMoving ? 'walking' : 'looking';
    if (!tint) return this.getMoaSprite(animTime, _state, null);
    const set = this._ensureTintSet(tint);
    if (isMating && this.isValid(set.mate)) return set.mate;
    if (isMoving && set.walk.length > 0) {
      const fi = Math.floor(animTime * this.animation.moaWalkSpeed) % set.walk.length;
      if (this.isValid(set.walk[fi])) return set.walk[fi];
    }
    if (this.isValid(set.idle)) return set.idle;
    return this.getMoaSprite(animTime, _state, null);
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

  // Frame of the harrier's perched clip. mode 'perch': a land→idle cycle driven by a
  // perch clock `t` (animTime − perchStart) — the land window (0..landEnd) plays ONCE,
  // then the idle window (idleStart..idleEnd) LOOPS. mode 'takeoff': the launch window
  // (takeoffStart..last) played straight through by progress `t` (0..1). Falls back to
  // the glide frame when the perched art is absent (the fallback set / a load miss).
  getEaglePerchedFrame(mode, t) {
    const p = this.eagle.perched, cfg = this.eagle.perchCfg;
    if (!p || p.length === 0 || !cfg) {
      return this.isValid(this.eagle.glide) ? this.eagle.glide : (this.eagle.fly[0] || null);
    }
    let idx;
    if (mode === 'takeoff') {
      const n = cfg.last - cfg.takeoffStart + 1;
      const k = Math.floor(Math.max(0, Math.min(1, t)) * n);
      idx = cfg.takeoffStart + Math.min(n - 1, k);
    } else {
      const step = Math.floor(Math.max(0, t) * this.animation.eaglePerchSpeed);
      const landCount = cfg.landEnd + 1;                 // frames 0..landEnd (played once)
      if (step < landCount) {
        idx = step;
      } else {
        const idleLen = cfg.idleEnd - cfg.idleStart + 1;
        idx = cfg.idleStart + ((step - landCount) % Math.max(1, idleLen));
      }
    }
    const s = p[Math.max(0, Math.min(p.length - 1, idx))];
    return this.isValid(s) ? s : (this.isValid(this.eagle.glide) ? this.eagle.glide : p[0] || null);
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

// ============================================
// CLIMATE AFFINITY  —  which phase a species/plant is boosted in
// ============================================
// A single derived tag — 'warm' (interglacial-boosted), 'cold' (glacial-boosted) or
// 'neutral' — read from the SAME authored fields the sim already keys off, so there is no
// second table to keep in sync (CLAUDE.md: the ground/ecology look has one source of truth):
//   · flora → coldTolerance vs TM_GROW.warmMax(0.65)/coldMin(0.75), the exact split the
//     FOREST/TUSSOCK buttons and kererū dispersal already use (see TeManawa_hud.js TM_GROW).
//   · fauna → seasonalModifiers.interglacial vs .fullGlacial hungerRate. hungerRate <1 means
//     "thrives", so the phase with the LOWER rate is the favoured one; the delta's sign is
//     the affinity, and a small dead-band keeps the truly balanced species neutral.
// Computing the tag is free; the only cost is the optional BAKED render tint below, which is
// gated behind the CONFIG.showClimateAffinity authoring toggle (C key) and off on the wall.
const CLIMATE_TINT = {
  warm:    [255, 198, 120],   // amber multiply-tint — interglacial-favoured
  cold:    [150, 194, 255],   // blue  multiply-tint — glacial-favoured
  neutral: null               // no wash — favoured by neither extreme
};

const ClimateAffinity = {
  faunaEps: 0.02,   // |interglacial − fullGlacial| hungerRate inside this reads as neutral

  // 'warm' | 'cold' | 'neutral' for a plant TYPE key (e.g. 'tussock', 'Totara').
  ofPlantType(type) {
    const d = (typeof PLANT_TYPES !== 'undefined') ? PLANT_TYPES[type] : null;
    if (!d) return 'neutral';
    const ct = (d.coldTolerance != null) ? d.coldTolerance : 0.5;
    const G = (typeof TM_GROW !== 'undefined') ? TM_GROW : { warmMax: 0.65, coldMin: 0.75 };
    if (ct <= G.warmMax) return 'warm';
    if (ct >= G.coldMin) return 'cold';
    return 'neutral';
  },

  // 'warm' | 'cold' | 'neutral' for a fauna species CONFIG (the registry config with
  // seasonalModifiers — moa, goose, mōho/takahē, kiwi; anything without the field is neutral).
  ofSpeciesConfig(cfg) {
    const sm = cfg && cfg.seasonalModifiers;
    if (!sm) return 'neutral';
    const warm = (sm.interglacial && sm.interglacial.hungerRate != null) ? sm.interglacial.hungerRate : 1;
    const cold = (sm.fullGlacial  && sm.fullGlacial.hungerRate  != null) ? sm.fullGlacial.hungerRate  : 1;
    const diff = warm - cold;                 // >0: struggles LESS in the cold → cold-favoured
    if (diff >  this.faunaEps) return 'cold';
    if (diff < -this.faunaEps) return 'warm';
    return 'neutral';
  },

  // The [r,g,b] multiply-tint for an affinity string, or null for neutral / unknown.
  tintFor(affinity) { return CLIMATE_TINT[affinity] || null; }
};

// ============================================
// TINT BAKER  —  general "bake a tinted frame once, reuse it every frame" cache
// ============================================
// TintBaker.get(srcImage, [r,g,b]) returns a tint-baked copy of a loaded frame, baked ONCE
// per (frame, colour) and then reused — the same rule the terrain buffers and the moa genus
// tint already follow ("colours baked, not read per frame"; never tint() on the hot path).
// Keyed off the frame OBJECT via a WeakMap, so it needs no ids and never leaks: when a frame
// is dropped (art swap, terrain reseed) its tinted copies are collected with it. Fully lazy —
// nothing bakes until CONFIG.showClimateAffinity is first switched on and a tinted frame is
// actually asked for, so the disabled (kiosk) path allocates nothing.
const TintBaker = {
  _cache: (typeof WeakMap !== 'undefined') ? new WeakMap() : null,

  get(src, col) {
    if (!src || !col || !this._cache) return src;
    let byColour = this._cache.get(src);
    if (!byColour) { byColour = new Map(); this._cache.set(src, byColour); }
    const key = col[0] + ',' + col[1] + ',' + col[2];
    let baked = byColour.get(key);
    if (baked === undefined) {
      baked = (typeof EntitySprites !== 'undefined' && EntitySprites._bakeTintedFrame)
        ? EntitySprites._bakeTintedFrame(src, col[0], col[1], col[2])
        : src;
      byColour.set(key, baked);
    }
    return baked || src;
  }
};