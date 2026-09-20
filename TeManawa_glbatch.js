// ============================================
// GL BATCH: DOM-stacked WebGL entity layer  (DEFAULT; opt OUT with ?render=2d)
// ============================================
// The world is drawn on p5's 2D canvas. At 4K (spriteSupersample 2) the frame is
// fill-rate bound and every sprite is a separate Canvas2D drawImage with real
// per-call overhead: the ~20fps cap the perf review found. This module draws the
// ENTITY SPRITES (and their shadow/halo ellipses) as batched textured quads on a
// WebGL canvas that is STACKED in the DOM between two 2D canvases, so the browser's
// compositor blends the three layers on the GPU with no per-frame readback:
//
//   bottom  (p5 _terrainLayer canvas) : terrain + water + seasonal washes
//   middle  (this GL canvas)          : entity sprites + shadows/halos
//   top     (p5 main canvas)          : hearts/rings indicators + GEO + HUD
//
// An earlier build composited the GL canvas into the 2D frame with drawImage; that
// worked and was pixel-correct but the GL→2D blit forced a context sync each frame
// that gave the batch win back (measured ≈break-even). DOM-stacking removes the
// drawImage entirely (the compositor does the blend) which is what captures the
// batch's speed. See md / the perf memory.
//
// DEFAULT and reversible: ?render=2d (or =canvas / =off) opts out, and the engine falls
// back to the unchanged single-canvas 2D atlas path automatically whenever GL cannot be a
// win: no WebGL context, a SOFTWARE (SwiftShader) rasterizer, or the context later lost
// (see applyURLFlag / init's renderer guard / _fallbackTo2D). GL on a CPU rasterizer would
// be SLOWER than the 2D path with no context-lost event to recover, so it is refused up front.
//
// How entity code stays untouched:
//   • The atlas already wrapped global image() (TeManawa_spriteatlas.js); in GL mode
//     that wrapper calls tryCapture() first, reading the live 2D transform, image
//     mode, tint and alpha, so a sprite draw becomes a quad with no code change.
//   • ellipse()/circle() are wrapped here so the per-entity shadow and species-halo
//     draws in render() are captured to the GL layer too (a baked soft-disc texture,
//     tinted by the live fill), keeping them correctly UNDER the sprites.
//   • The capture span is open only across the sprite passes; Simulation.render()
//     ends it (GLBatch.composite → endSpan) before the indicator over-pass, so
//     hearts/rings and the HUD draw on the top 2D canvas, above everything.

const GLBatch = {
  enabled: false,        // ?render=gl asked for it AND init succeeded
  requested: false,      // ?render=gl was on the URL
  domStack: false,       // layered-canvas mode active
  _open: false,          // a capture span is active (image()/ellipse() should batch)
  _mounted: false,
  gl: null,
  canvas: null,          // the GL (middle) canvas
  W: 0, H: 0,            // this GL canvas's backing (raster) resolution, spriteSS× logical

  // The coordinate space the captured image()/ellipse() calls live in: the MAIN p5
  // canvas backing (its device pixels), which the CTM maps into. In DOM-stack GL mode
  // the main canvas drops to logical 1080 (HUD only) while this GL layer stays
  // spriteSS× (4K) for crisp sprites, so the two differ. Clip mapping + the edge
  // fade use coordW/coordH (the CTM's space); the GL VIEWPORT uses W/H (the raster
  // space). Kept equal to W/H until mount()/resize() sync them, so any lone-init path
  // behaves exactly as before this split.
  coordW: 0, coordH: 0,

  // ---- edge fade --------------------------------------------------------------
  // Sprites (and their shadow/halo discs) fade toward transparent as they approach
  // the canvas edge, so the cast dissolves off-screen instead of hard-clipping at
  // the frame. Computed PER VERTEX from the vertex's distance to the nearest edge,
  // so a large sprite straddling the edge gradates smoothly across its own quad.
  // marginFrac is the share of the SHORTER canvas dimension the fade spans (so the
  // band is the same pixel width top/bottom as left/right). Console-tunable.
  edgeFade: { on: true, marginFrac: 0.08 },
  _edgeMarginPx: 0,      // marginFrac × min(W,H), recomputed each begin()

  // GL objects
  _prog: null, _aPos: 0, _aUV: 1, _aCol: 2, _uSampler: null,
  _vbo: null,
  _tex: new Map(),       // source HTMLCanvasElement -> { tex, w, h }
  _discTex: null,        // baked soft-disc texture for captured ellipses (shadows/halos)

  // Batch buffer: interleaved [x, y, u, v, r, g, b, a] per vertex, 6 verts / quad.
  FLOATS_PER_VERT: 8,
  _cap: 0, _verts: null, _n: 0,
  _curTex: null,

  // ---- URL flag + init --------------------------------------------------------
  // GL is the DEFAULT renderer. Opt OUT with ?render=2d (or =canvas / =off); any
  // other value (including ?render=gl) leaves it on. If the context can't be created,
  // or only a software rasterizer is available, init() returns false and the engine
  // falls back to the 2D path automatically.
  applyURLFlag() {
    if (typeof window === 'undefined' || !window.location) { this.requested = true; return; }
    const q = new URLSearchParams(window.location.search).get('render');
    this.requested = !(q === '2d' || q === 'canvas' || q === 'off');
  },

  // Drop to the 2D path for the rest of the session. Used by the WebGL
  // context-lost handler: an unattended kiosk must degrade, not go black. The 2D
  // render() paints an opaque background over the now-stale GL/terrain DOM layers,
  // so nothing more is needed than flipping these flags.
  _fallbackTo2D(reason) {
    if (!this.enabled && !this.domStack) return;
    this.enabled = false; this.domStack = false; this._open = false;
    console.warn('[glbatch] falling back to 2D renderer:', reason);
  },

  // The unmasked GL renderer string (via WEBGL_debug_renderer_info), or '' when that
  // extension isn't exposed. A kiosk Chrome exposes it; a privacy-hardened browser may
  // strip it, and then we can't tell and don't reject (init() proceeds).
  _rendererName(gl) {
    try {
      const ext = gl.getExtension && gl.getExtension('WEBGL_debug_renderer_info');
      const s = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
      return (s || '').toString();
    } catch (_) { return ''; }
  },

  // True when the context is a CPU rasterizer (Chrome/ANGLE SwiftShader, Mesa llvmpipe /
  // softpipe, the Windows "Basic Render Driver") rather than a real GPU. On these the
  // batch is slower than the 2D path, so init() refuses it. An unknown/empty string ⇒
  // false: never reject on a renderer we couldn't read.
  _isSoftwareRenderer(gl) {
    const n = this._rendererName(gl).toLowerCase();
    if (!n) return false;
    return n.indexOf('swiftshader') >= 0 || n.indexOf('llvmpipe') >= 0 ||
           n.indexOf('softpipe') >= 0 || n.indexOf('software') >= 0 ||
           n.indexOf('basic render') >= 0;
  },

  init(width, height) {
    if (!this.requested) return false;
    try {
      const cnv = (typeof document !== 'undefined' && document.createElement)
        ? document.createElement('canvas') : null;
      if (!cnv) return false;
      cnv.width = width; cnv.height = height;
      const opts = { premultipliedAlpha: false, antialias: false, alpha: true, depth: false };
      // Prefer a HARDWARE context. failIfMajorPerformanceCaveat makes Chrome refuse a
      // software rasterizer (SwiftShader) outright: that would shade the whole batch on
      // the CPU, slower than the 2D path, and with no context-lost event to trip
      // _fallbackTo2D it would never recover. If the strict request yields nothing we
      // still take a lax one, purely to read its renderer string below, so a driver that
      // ignores the hint is caught too, and the log says "software" rather than "none".
      const mk = (o) => cnv.getContext('webgl', o) || cnv.getContext('experimental-webgl', o);
      let gl = mk(Object.assign({}, opts, { failIfMajorPerformanceCaveat: true })) || mk(opts);
      if (!gl) { console.warn('[glbatch] no WebGL context; staying on 2D'); return false; }
      if (this._isSoftwareRenderer(gl)) {
        console.warn('[glbatch] software WebGL renderer (' + this._rendererName(gl) +
                     '); staying on 2D, a CPU rasterizer is slower than the canvas path');
        return false;
      }

      this.canvas = cnv; this.gl = gl; this.W = width; this.H = height;
      this.coordW = width; this.coordH = height;   // default: mount()/resize() reset to the MAIN backing
      this._buildProgram();
      this._buildDiscTexture();
      this._cap = 8192 * 6;
      this._verts = new Float32Array(this._cap * this.FLOATS_PER_VERT);
      this._vbo = gl.createBuffer();
      // Pre-size the buffer store ONCE, then bufferSubData into it each flush (below).
      // The old per-flush bufferData reallocated the whole store every time (cheap now)
      // but it scales with the flush count, which climbs as the fauna cast turns on.
      gl.bindBuffer(gl.ARRAY_BUFFER, this._vbo);
      gl.bufferData(gl.ARRAY_BUFFER, this._verts.byteLength, gl.DYNAMIC_DRAW);

      gl.disable(gl.DEPTH_TEST);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);

      // Unattended-kiosk safety: if the GPU drops the context, degrade to 2D for the
      // rest of the session rather than going black (the nightly reload recovers it).
      if (cnv.addEventListener) {
        cnv.addEventListener('webglcontextlost', (e) => { e.preventDefault(); this._fallbackTo2D('context lost'); }, false);
      }

      this.enabled = true;
      this.domStack = true;
      this._wrapShapes();
      console.log(`[glbatch] DOM-stacked WebGL entity layer active (${width}x${height})`);
      return true;
    } catch (e) {
      console.warn('[glbatch] init failed, staying on 2D:', e && e.message);
      this.enabled = false; this.gl = null; this.canvas = null;
      return false;
    }
  },

  // Stack the three canvases: bottom (terrain), middle (this GL canvas), top (main).
  // Called once the p5 main canvas and the terrain buffer exist. Positions are set
  // to match the p5 main canvas each layout (see layout()).
  mount(mainEl, bottomEl) {
    if (!this.enabled || !mainEl) return;
    this._mainEl = mainEl; this._bottomEl = bottomEl || this._bottomEl;
    const gc = this.canvas;
    for (const el of [this._bottomEl, gc, mainEl]) {
      if (!el) continue;
      el.style.position = 'absolute';
      el.style.margin = '0';
    }
    // z-order: bottom terrain < GL sprites < main (indicators + HUD)
    if (this._bottomEl) this._bottomEl.style.zIndex = '0';
    gc.style.zIndex = '1';
    mainEl.style.zIndex = '2';
    // Insert the GL canvas into the DOM next to the main canvas.
    if (gc.parentNode == null && mainEl.parentNode) mainEl.parentNode.insertBefore(gc, mainEl);
    this._mounted = true;
    this._syncCoord();
    this.layout();
  },

  // Read the MAIN canvas backing into coordW/coordH: the pixel space the captured
  // draw calls' CTM lives in. In GL mode that is the logical 1080 (HUD-only) canvas,
  // NOT this GL layer's 4K backing, so they must be tracked separately. Falls back to
  // W/H when the main element has no numeric size (the headless harness stub).
  _syncCoord() {
    const el = this._mainEl;
    this.coordW = (el && el.width) ? el.width : this.W;
    this.coordH = (el && el.height) ? el.height : this.H;
  },

  // Point the bottom layer at the terrain buffer's canvas. The buffer is a detached
  // p5.Graphics, so its canvas is inserted into the DOM ahead of the GL canvas; when
  // the buffer is rebuilt on resize this is called with the new canvas and the old
  // one is removed. A no-op when the canvas is unchanged (called every frame).
  setBottom(bottomEl) {
    if (!this.enabled || !bottomEl || bottomEl === this._bottomEl) return;
    const prev = this._bottomEl;
    if (prev && prev.parentNode) prev.parentNode.removeChild(prev);
    this._bottomEl = bottomEl;
    bottomEl.style.position = 'absolute';
    bottomEl.style.margin = '0';
    bottomEl.style.display = 'block';
    bottomEl.style.zIndex = '0';
    const glc = this.canvas;
    if (glc && glc.parentNode) glc.parentNode.insertBefore(bottomEl, glc);
    this.layout();
  },

  // Copy the main canvas's on-screen CSS box onto the other two layers so they
  // register pixel-for-pixel. Called from scaleCanvasToFit / on resize.
  layout() {
    if (!this._mounted || !this._mainEl) return;
    const s = this._mainEl.style;
    for (const el of [this._bottomEl, this.canvas]) {
      if (!el) continue;
      el.style.left = s.left; el.style.top = s.top;
      el.style.width = s.width; el.style.height = s.height;
    }
  },

  resize(width, height) {
    if (!this.enabled || !this.canvas) return;
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width; this.canvas.height = height;
      this.W = width; this.H = height;
      this.gl.viewport(0, 0, width, height);
    }
    this._syncCoord();   // the main canvas was resized just before this, re-read its backing
    this.layout();
  },

  _buildProgram() {
    const gl = this.gl;
    const vs = 'attribute vec2 aPos;attribute vec2 aUV;attribute vec4 aCol;' +
      'varying vec2 vUV;varying vec4 vCol;void main(){vUV=aUV;vCol=aCol;gl_Position=vec4(aPos,0.0,1.0);}';
    const fs = 'precision mediump float;varying vec2 vUV;varying vec4 vCol;uniform sampler2D uTex;' +
      'void main(){vec4 t=texture2D(uTex,vUV);gl_FragColor=vec4(t.rgb*vCol.rgb,t.a*vCol.a);}';
    const co = (ty, src) => { const s = gl.createShader(ty); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    const p = gl.createProgram();
    gl.attachShader(p, co(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, co(gl.FRAGMENT_SHADER, fs));
    gl.bindAttribLocation(p, 0, 'aPos'); gl.bindAttribLocation(p, 1, 'aUV'); gl.bindAttribLocation(p, 2, 'aCol');
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    this._prog = p; this._uSampler = gl.getUniformLocation(p, 'uTex');
  },

  // A white filled disc with a 1px-soft edge: the stand-in for a p5 ellipse().
  // Tinted per-quad by the captured fill, it reproduces the soft shadow / halo look.
  _buildDiscTexture() {
    const S = 128, c = document.createElement('canvas'); c.width = c.height = S;
    const x = c.getContext('2d');
    x.clearRect(0, 0, S, S);
    x.fillStyle = '#fff';
    x.beginPath(); x.arc(S / 2, S / 2, S / 2 - 1, 0, Math.PI * 2); x.fill();
    const gl = this.gl, tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
    this._discTex = { tex, w: S, h: S };
  },

  _textureFor(src) {
    if (!src) return null;
    let e = this._tex.get(src);
    if (e) return e;
    const gl = this.gl, tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src); }
    catch (err) { console.warn('[glbatch] texImage2D failed:', err && err.message); return null; }
    e = { tex, w: src.width, h: src.height };
    this._tex.set(src, e);
    return e;
  },

  _canvasOf(o) {
    if (!o) return null;
    if (o.canvas) return o.canvas;
    if (o.drawingContext && o.drawingContext.canvas) return o.drawingContext.canvas;
    if (o.elt && o.elt.getContext) return o.elt;
    return null;
  },

  // ---- capture span -----------------------------------------------------------
  begin() {
    if (!this.enabled) return;
    const gl = this.gl;
    gl.viewport(0, 0, this.W, this.H);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(this._prog);
    this._n = 0; this._curTex = null;
    this._open = true;
    // Recompute the edge-fade band each frame so a live tweak to edgeFade takes hold.
    this._edgeMarginPx = (this.edgeFade && this.edgeFade.on)
      ? this.edgeFade.marginFrac * Math.min(this.coordW || this.W, this.coordH || this.H) : 0;
  },

  // Renderer state, read live each capture (push/pop restore _imageMode/_tint
  // internally, so a wrapper would go stale; read from the renderer instead).
  _renderer: null,
  _R() { return this._renderer || (this._renderer =
    (typeof window !== 'undefined' && window._renderer) ? window._renderer : null); },
  _ctx() { const R = this._R(); return (R && R.drawingContext) ? R.drawingContext
    : (typeof drawingContext !== 'undefined' ? drawingContext : null); },
  _ctm(ctx) { const m = (ctx && ctx.getTransform) ? ctx.getTransform() : null;
    return m ? m : { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }; },

  // Capture one image() call. Returns true if consumed.
  tryCapture(img, a, b, c, d) {
    if (!this.enabled || !this._open || !img) return false;
    let src, sx, sy, sw, sh, iw, ih;
    if (img.__atlas) {
      src = this._canvasOf(img.__page);
      sx = img.sx; sy = img.sy; sw = img.sw; sh = img.sh; iw = img.width; ih = img.height;
    } else {
      src = this._canvasOf(img);
      if (!src) return false;
      sx = 0; sy = 0; sw = src.width; sh = src.height; iw = img.width || src.width; ih = img.height || src.height;
    }
    const te = this._textureFor(src);
    if (!te) return false;

    const R = this._R(), ctx = this._ctx(), im = R ? R._imageMode : undefined;
    const CEN = (typeof CENTER !== 'undefined') ? CENTER : 'center';
    const CRS = (typeof CORNERS !== 'undefined') ? CORNERS : 'corners';
    const dw = (c === undefined) ? iw : c, dh = (d === undefined) ? ih : d;
    let lx0, ly0, lx1, ly1;
    if (im === CRS) { lx0 = a; ly0 = b; lx1 = c; ly1 = d; }
    else if (im === CEN) { lx0 = a - dw * 0.5; ly0 = b - dh * 0.5; lx1 = lx0 + dw; ly1 = ly0 + dh; }
    else { lx0 = a; ly0 = b; lx1 = a + dw; ly1 = b + dh; }

    const tn = R ? R._tint : null;
    const r = tn ? tn[0] / 255 : 1, g = tn ? tn[1] / 255 : 1, bl = tn ? tn[2] / 255 : 1;
    const ta = (tn && tn.length > 3) ? tn[3] / 255 : 1;
    const alpha = (ctx ? ctx.globalAlpha : 1) * ta;

    const u0 = sx / te.w, v0 = sy / te.h, u1 = (sx + sw) / te.w, v1 = (sy + sh) / te.h;
    this._emit(te, this._ctm(ctx), lx0, ly0, lx1, ly1, u0, v0, u1, v1, r, g, bl, alpha);
    return true;
  },

  // Capture one ellipse()/circle() as a tinted disc quad. (x,y) is the centre in
  // the default ellipseMode(CENTER); w,h the diameters. Returns true if consumed.
  tryCaptureEllipse(x, y, w, h) {
    if (!this.enabled || !this._open || !this._discTex) return false;
    const ctx = this._ctx();
    const col = this._parseFill(ctx ? ctx.fillStyle : null);
    const ga = ctx ? ctx.globalAlpha : 1;
    const lx0 = x - w * 0.5, ly0 = y - h * 0.5, lx1 = x + w * 0.5, ly1 = y + h * 0.5;
    this._emit(this._discTex, this._ctm(ctx), lx0, ly0, lx1, ly1, 0, 0, 1, 1,
      col.r, col.g, col.b, col.a * ga);
    return true;
  },

  // Map a local rect through the CTM to clip space and push two triangles.
  _emit(te, m, lx0, ly0, lx1, ly1, u0, v0, u1, v1, r, g, b, a) {
    if (te.tex !== this._curTex) { this._flush(); this._curTex = te.tex; }
    if (this._n + 6 > this._cap) this._flush();
    // Map through the MAIN-canvas coordinate space (coordW/H), not this layer's raster
    // size (W/H): in GL mode the sprite draw calls are authored on the 1080 main canvas
    // while the GL viewport rasterises at 4K, so the clip divisor is the CTM's space.
    const W = this.coordW || this.W, H = this.coordH || this.H;
    const ma = m.a, mb = m.b, mc = m.c, md = m.d, me = m.e, mf = m.f;
    // Each corner: map local → screen pixels (for both the clip position and the
    // per-vertex edge-fade alpha), then pixels → clip space.
    const SX = (lx, ly) => ma * lx + mc * ly + me;
    const SY = (lx, ly) => mb * lx + md * ly + mf;
    const mp = this._edgeMarginPx;
    // Edge fade: 1 in the interior, smoothstep down to 0 at the very edge across the
    // outer mp px. Nearest of the four edges wins, so a corner near two edges is dimmest.
    const edgeA = (sx, sy) => {
      if (mp <= 0) return a;
      let d = sx; const rr = W - sx; if (rr < d) d = rr;
      if (sy < d) d = sy; const bb = H - sy; if (bb < d) d = bb;
      if (d >= mp) return a;
      if (d <= 0) return 0;
      const t = d / mp;
      return a * t * t * (3 - 2 * t);
    };
    const sxTL = SX(lx0, ly0), syTL = SY(lx0, ly0);
    const sxTR = SX(lx1, ly0), syTR = SY(lx1, ly0);
    const sxBR = SX(lx1, ly1), syBR = SY(lx1, ly1);
    const sxBL = SX(lx0, ly1), syBL = SY(lx0, ly1);
    const V = this._verts; let o = this._n * this.FLOATS_PER_VERT;
    const put = (sx, sy, u, v) => {
      const x = (sx / W) * 2 - 1, y = 1 - (sy / H) * 2, va = edgeA(sx, sy);
      V[o]=x; V[o+1]=y; V[o+2]=u; V[o+3]=v; V[o+4]=r; V[o+5]=g; V[o+6]=b; V[o+7]=va; o+=8;
    };
    put(sxTL, syTL, u0, v0); put(sxTR, syTR, u1, v0); put(sxBR, syBR, u1, v1);
    put(sxTL, syTL, u0, v0); put(sxBR, syBR, u1, v1); put(sxBL, syBL, u0, v1);
    this._n += 6;
  },

  _flush() {
    const gl = this.gl;
    if (!this._n || !this._curTex) { this._n = 0; return; }
    gl.bindBuffer(gl.ARRAY_BUFFER, this._vbo);
    // bufferSubData into the pre-sized store (see init): no per-flush reallocation.
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this._verts.subarray(0, this._n * this.FLOATS_PER_VERT));
    const F = 4, stride = this.FLOATS_PER_VERT * F;
    gl.enableVertexAttribArray(this._aPos); gl.vertexAttribPointer(this._aPos, 2, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(this._aUV);  gl.vertexAttribPointer(this._aUV,  2, gl.FLOAT, false, stride, 2 * F);
    gl.enableVertexAttribArray(this._aCol); gl.vertexAttribPointer(this._aCol, 4, gl.FLOAT, false, stride, 4 * F);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this._curTex);
    gl.uniform1i(this._uSampler, 0);
    gl.drawArrays(gl.TRIANGLES, 0, this._n);
    this._n = 0;
  },

  // End the capture span. In DOM-stack mode the GL canvas IS a layer, so there is
  // no drawImage, just flush the batch to it. Named composite() for the call site
  // in Simulation.render() shared with the old blit build. ctx2d is ignored here.
  composite(/* ctx2d */) {
    if (!this.enabled || !this._open) return;
    this._flush();
    this._open = false;
  },
  endSpan() { this.composite(); },

  // ---- fill parsing -----------------------------------------------------------
  // Read the disc colour from the live fillStyle p5 set with fill(). p5 emits
  // 'rgba(r,g,b,a)' / 'rgb(r,g,b)' / '#rrggbb'. Cached on the exact string.
  _fillCacheKey: null, _fillCacheVal: { r: 0, g: 0, b: 0, a: 1 },
  _parseFill(style) {
    if (typeof style !== 'string') return this._fillCacheVal;
    if (style === this._fillCacheKey) return this._fillCacheVal;
    let r = 0, g = 0, b = 0, a = 1;
    const m = style.match(/rgba?\(([^)]+)\)/i);
    if (m) { const p = m[1].split(',').map(s => parseFloat(s));
      r = (p[0] || 0) / 255; g = (p[1] || 0) / 255; b = (p[2] || 0) / 255; a = (p.length > 3) ? p[3] : 1; }
    else if (style[0] === '#') {
      let h = style.slice(1); if (h.length === 3) h = h.split('').map(c => c + c).join('');
      r = parseInt(h.slice(0, 2), 16) / 255; g = parseInt(h.slice(2, 4), 16) / 255; b = parseInt(h.slice(4, 6), 16) / 255;
    }
    this._fillCacheKey = style;
    this._fillCacheVal = { r, g, b, a };
    return this._fillCacheVal;
  },

  // Wrap ellipse()/circle() so a captured shadow/halo becomes a disc quad while the
  // span is open; otherwise pass through to normal 2D drawing.
  _wrapShapes() {
    const self = this;
    if (typeof ellipse === 'function') {
      const orig = ellipse;
      const wrap = function (x, y, w, h) {
        if (self._open && self.tryCaptureEllipse(x, y, (w === undefined ? 0 : w), (h === undefined ? w : h))) return;
        return orig.apply(this, arguments);
      };
      if (typeof window !== 'undefined') window.ellipse = wrap;
      try { ellipse = wrap; } catch (_) {}
    }
    if (typeof circle === 'function') {
      const orig = circle;
      const wrap = function (x, y, d) {
        if (self._open && self.tryCaptureEllipse(x, y, d, d)) return;
        return orig.apply(this, arguments);
      };
      if (typeof window !== 'undefined') window.circle = wrap;
      try { circle = wrap; } catch (_) {}
    }
  }
};

if (typeof module !== 'undefined' && module.exports) module.exports = GLBatch;
