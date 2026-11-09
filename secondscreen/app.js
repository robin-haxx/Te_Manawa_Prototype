// ============================================================
// TE MANAWA SECOND SCREEN: APP
// ------------------------------------------------------------
// The state machine and the renderer. Reads content from encyclopedia.js,
// takes physical/touch input from input.js, and talks to the diorama over
// bus.js. See md/TEMANAWA_SECOND_SCREEN.md.
//
// The page is a fixed 1920×1080 stage scaled to fit the panel, so layout is
// authored in absolute px and never reflows.
// ============================================================

(function () {
  'use strict';

  // ---- element handles -------------------------------------
  const $ = (id) => document.getElementById(id);
  const stage = $('stage');
  const bg = $('bg');
  const habitatScreen = $('habitatScreen');
  const selectScreen = $('selectScreen');
  const habitatTitle = $('habitatTitle');
  const cluster = $('plantCluster');
  const card = $('card');
  const cardPrompt = $('cardPrompt');
  const cardSpecies = $('cardSpecies');
  const cardFauna = $('cardFauna');
  const cardPlant = $('cardPlant');
  const cardSceneBox = $('cardSceneBox');
  const cardName = $('cardName');
  const cardAlt = $('cardAlt');
  const cardSci = $('cardSci');
  const cardBody = $('cardBody');
  const clockLabel = $('clockLabel');
  const stagePill = $('stagePill');
  const goalLabel = $('goalLabel');
  const tlWrap = $('timelapse');
  const tlFill = $('timelapseFill');
  const tlMsg = $('timelapseMsg');
  const goalStrip = $('goalStrip');
  const goalNow = $('goalNow');
  const goalNowText = $('goalNowText');
  const goalPips = $('goalPips');
  const goalPrev = $('goalPrev');
  const goalPrevLabel = $('goalPrevLabel');
  const goalPrevImg = $('goalPrevImg');
  const goalPrevName = $('goalPrevName');
  const landingBirds = $('landingBirds');
  const climateRail = $('climateRail');
  const railTrack = $('railTrack');

  // ---- state -----------------------------------------------
  const state = {
    pos: TM_SCREEN_ORDER.indexOf('select'),   // start centred on "Select a Habitat"
    plantIndex: -1,                            // -1 = nothing highlighted (prompt showing)
    clock: null,                               // {yearsBP, glacialIndex, stage, stageName, mis}
    goal: null,                                // {targetYearsBP, targetStageName}
    timelapse: { active: false, progress: 0, achieved: null },
    hintUntil: 0                               // a transient hint holds the message area until this time
  };

  const screenKey = () => TM_SCREEN_ORDER[state.pos];
  const isHabitat = () => screenKey() !== 'select';
  const currentHabitat = () => (isHabitat() ? TM_HABITATS[screenKey()] : null);
  const currentPlant = () => {
    const h = currentHabitat();
    return (h && state.plantIndex >= 0) ? h.plants[state.plantIndex] : null;
  };

  // ==========================================================
  // RENDER
  // ==========================================================
  function render() {
    const habitat = currentHabitat();
    // top-level screen swap
    selectScreen.classList.toggle('hidden', !!habitat);
    habitatScreen.classList.toggle('hidden', !habitat);
    // background: the shared base, or a habitat's own override (tint class stays behind as a fallback)
    bg.className = habitat ? ('theme-' + habitat.theme) : 'theme-select';
    const bgSrc = (habitat && habitat.bg) || (typeof TM_BG_DEFAULT !== 'undefined' ? TM_BG_DEFAULT : '');
    bg.style.backgroundImage = bgSrc ? `url("${bgSrc}")` : '';
    if (habitat) habitatTitle.textContent = habitat.title;
    applyClimateTint();
    renderRail();
    renderCard();
    renderReadout();
  }

  // ---- the climate gradient: the background colour-shifted by switch position -------------
  // TM_SCREEN_CLIMATE (encyclopedia.js) says how glacial each position looks, 0 → 1. At 0 the
  // texture is as drawn (the interglacial forest); toward 1 its green turns icy blue and a little
  // paler. #bg eases the filter over SCROLL_MS (secondscreen.css), so a move along the switch reads as
  // walking down a gradient from the warm habitats to the cold ones.
  const CLIMATE_TINT = { hue: 70, desat: 0.32, lift: 0.10 };   // at full glacial: hue-rotate°, saturation lost, brightness gained
  const COL_WARM = [84, 210, 96], COL_COLD = [150, 205, 236];  // the wall's interglacial / glacial colours (TM_BOOST.outline*)
  function climateOf(key) {
    if (typeof TM_SCREEN_CLIMATE !== 'undefined' && TM_SCREEN_CLIMATE[key] != null) return TM_SCREEN_CLIMATE[key];
    const h = TM_HABITATS[key];
    return h ? (h.era === 'glacial' ? 1 : 0) : 0.5;
  }
  function applyClimateTint() {
    const g = Math.max(0, Math.min(1, climateOf(screenKey())));
    bg.style.filter = 'hue-rotate(' + (CLIMATE_TINT.hue * g).toFixed(1) + 'deg) saturate(' +
      (1 - CLIMATE_TINT.desat * g).toFixed(3) + ') brightness(' + (1 + CLIMATE_TINT.lift * g).toFixed(3) + ')';
  }
  function climateCol(g) {
    const c = (i) => Math.round(COL_WARM[i] + (COL_COLD[i] - COL_WARM[i]) * g);
    return 'rgb(' + c(0) + ',' + c(1) + ',' + c(2) + ')';
  }

  // ---- the climate rail: up = interglacial, down = glacial -------------------------------
  // One stop per switch position, coloured by its climate, the current one large. A HINT (the H key,
  // in either window) makes it point: the end toward the screen holding the goal's answer bobs and
  // that screen's stop swells, until the visitor gets there or the hint runs out (showHint).
  const railHint = { target: -1, timer: 0 };
  function buildRail() {
    railTrack.textContent = '';
    TM_SCREEN_ORDER.forEach((k) => {
      const s = document.createElement('span');
      s.className = 'railStop' + (k === 'select' ? ' centre' : '');
      s.style.background = climateCol(Math.max(0, Math.min(1, climateOf(k))));
      railTrack.appendChild(s);
    });
  }
  function renderRail() {
    const stops = railTrack.children, t = railHint.target;
    for (let i = 0; i < stops.length; i++) {
      stops[i].classList.toggle('here', i === state.pos);
      stops[i].classList.toggle('target', i === t);
    }
    climateRail.classList.toggle('hint-up', t >= 0 && t < state.pos);
    climateRail.classList.toggle('hint-down', t >= 0 && t > state.pos);
  }
  // Where the hint points: a screen with one of the answer plants, in the climate the wall is in
  // (a both-worlds plant sits on screens of both), the nearest one. No answers (no plant goal up):
  // the nearest screen of the wall's climate.
  function hintTarget(keys, glacial) {
    const era = glacial ? 'glacial' : 'interglacial';
    let cands = [];
    TM_SCREEN_ORDER.forEach((k, pos) => {
      const h = TM_HABITATS[k];
      if (h && (!keys.length || h.plants.some((p) => keys.indexOf(p.key) !== -1))) cands.push({ pos, era: h.era });
    });
    const inEra = cands.filter((c) => c.era === era);
    if (inEra.length) cands = inEra;
    if (!cands.length) return -1;
    cands.sort((a, b) => Math.abs(a.pos - state.pos) - Math.abs(b.pos - state.pos));
    return cands[0].pos;
  }
  function showHint(m) {
    clearTimeout(railHint.timer);
    railHint.target = hintTarget((m && m.keys) || [], !!(m && m.glacial));
    renderRail();
    railHint.timer = setTimeout(() => { railHint.target = -1; renderRail(); }, (m && m.ms) || 6000);
  }

  // ---- the landing page's birds ------------------------------------------------------------
  // TM_LANDING_BIRDS round the card; a tap scrolls the switch, one position at a time like a visitor
  // moving it, to a screen with a plant that helps the bird, then highlights that plant (goToBird).
  function renderLandingBirds() {
    landingBirds.textContent = '';
    (typeof TM_LANDING_BIRDS !== 'undefined' ? TM_LANDING_BIRDS : []).forEach((b) => {
      const f = TM_FAUNA[b.fauna];
      const src = f && f.sprites && f.sprites[0];
      if (!src) { console.warn('[secondscreen] landing bird ' + b.fauna + ' has no sprite'); return; }
      const btn = document.createElement('button');
      btn.className = 'landBird' + (b.flip ? ' flip' : '');
      btn.style.left = b.cx + 'px';
      btn.style.top = b.cy + 'px';
      btn.style.height = b.h + 'px';
      btn.setAttribute('aria-label', f.name);
      const img = document.createElement('img');
      img.src = src; img.alt = f.name; img.draggable = false;
      img.onerror = () => { console.warn('[secondscreen] could not load ' + src); btn.remove(); };
      btn.appendChild(img);
      btn.addEventListener('click', () => onAction('bird', { fauna: b.fauna, el: btn }));
      landingBirds.appendChild(btn);
    });
  }
  // Every (screen position, plant index) whose card carries this bird.
  function birdPlants(fauna) {
    const out = [];
    TM_SCREEN_ORDER.forEach((k, pos) => {
      const h = TM_HABITATS[k];
      if (h) h.plants.forEach((p, index) => { if ((p.fauna || []).indexOf(fauna) !== -1) out.push({ pos, index, era: h.era }); });
    });
    return out;
  }
  const NAV_STEP_MS = 650;         // between switch positions on the way (each one's scroll is SCROLL_MS)
  const NAV_POP_MS = 240;          // the tapped bird's pop, before the first step
  let navToken = 0;                // a new tap or any visitor input cancels a navigation on its way
  function goToBird(fauna, el) {
    const all = birdPlants(fauna);
    if (!all.length) return;
    const c = state.clock;
    const glacialNow = (c && c.glacialIndex != null) ? c.glacialIndex >= 0.5 : null;
    let pool = all;
    if (glacialNow !== null) {
      const fit = all.filter((t) => (t.era === 'glacial') === glacialNow);
      if (fit.length) pool = fit;
    }
    pool.sort((a, b) => Math.abs(a.pos - state.pos) - Math.abs(b.pos - state.pos));
    const dest = pool[0], token = ++navToken;
    if (el) { el.classList.add('tapped'); setTimeout(() => el.classList.remove('tapped'), NAV_POP_MS + 120); }
    const step = () => {
      if (token !== navToken) return;
      if (state.pos === dest.pos) {
        setTimeout(() => { if (token === navToken) selectPlant(dest.index); }, SCROLL_MS);   // once the last scroll lands
        return;
      }
      setPos(state.pos + (dest.pos > state.pos ? 1 : -1));
      setTimeout(step, NAV_STEP_MS);
    };
    setTimeout(step, NAV_POP_MS);
  }

  // Build the plant cluster for a habitat (called on habitat change).
  function renderCluster() {
    cluster.innerHTML = '';
    const habitat = currentHabitat();
    if (!habitat) return;
    habitat.plants.forEach((p, i) => {
      const btn = document.createElement('button');
      btn.className = 'sticker';
      btn.style.left = p.cx + 'px';
      btn.style.top = p.cy + 'px';
      btn.style.height = p.h + 'px';
      btn.setAttribute('aria-label', p.name);
      const src = TM_PLANT_SPRITE[p.key] || '';
      const img = document.createElement('img');
      img.src = src;
      img.alt = p.name;
      img.draggable = false;
      btn.appendChild(img);
      // The highlight: an outlined copy laid over the plant, shown while selected (CSS `.sticker .lit`).
      // Baked by tools/outline_plants.js; missing → no outline, but say so.
      if (src) {
        const lit = document.createElement('img');
        lit.className = 'lit';
        lit.alt = '';
        lit.draggable = false;
        lit.onerror = () => { console.warn('[secondscreen] no outlined sprite for ' + p.key + ' — run node tools/outline_plants.js'); lit.remove(); };
        lit.src = 'assets/plants_outlined/' + src.split('/').pop();
        btn.appendChild(lit);
      }
      btn.addEventListener('click', () => selectPlant(i));
      cluster.appendChild(btn);
    });
    applyHighlight();
  }

  // Mark the highlighted sticker; CSS fades its outlined copy in.
  function applyHighlight() {
    const kids = cluster.children;
    for (let i = 0; i < kids.length; i++) {
      kids[i].classList.toggle('selected', i === state.plantIndex);
    }
  }

  function renderCard() {
    const p = currentPlant();
    if (!p) {
      cardPrompt.classList.remove('hidden');
      cardSpecies.classList.add('hidden');
      card.classList.remove('matched', 'mismatched');
      return;
    }
    cardPrompt.classList.add('hidden');
    cardSpecies.classList.remove('hidden');
    cardName.textContent = p.name;
    // Te reo, English and Latin: the headline is one of them, so this adds what it doesn't already say.
    cardAlt.textContent = [p.reo, p.en].filter(Boolean).join(' · ');
    cardAlt.classList.toggle('hidden', !cardAlt.textContent);
    cardSci.textContent = p.sci;
    renderBody(p);
    // The scene: the plant, sized from its cluster height so a tree still stands a little taller than
    // a tussock, with the birds it feeds placed on it: flyers in the canopy, the moa guild at its foot,
    // alternating left and right (a right-hand bird is mirrored to face the plant).
    // A cropped plant fills the head (its kept half shows enlarged); otherwise sized from the cluster,
    // × the card's optional `sceneScale`, never past the head.
    const t = Math.max(0, Math.min(1, ((p.h || 300) - SCENE_FROM[0]) / (SCENE_FROM[1] - SCENE_FROM[0])));
    const plantH = p.crop ? SCENE_TO[1] : (SCENE_TO[0] + t * (SCENE_TO[1] - SCENE_TO[0])) * (p.sceneScale || 1);
    setScenePlant(TM_PLANT_SPRITE[p.key] || '', p.crop, Math.round(Math.min(SCENE_TO[1], plantH)), p.cropKeep);
    cardFauna.innerHTML = '';
    cardSceneBox.style.transform = '';
    if (p.sceneShift) cardSceneBox.style.transform = 'translateX(' + p.sceneShift + 'px)';   // room for a big staged bird
    if (p.birdStage) { stageBirds(p.birdStage, p.crop ? 1 : (p.sceneScale || 1)); return; }
    let side = 0;
    (p.fauna || []).forEach((fkey) => {
      const f = TM_FAUNA[fkey];
      if (!f) return;
      (f.sprites || []).forEach((src) => {
        const right = f.side ? f.side === 'right' : (side % 2 === 1);
        side++;
        const im = document.createElement('img');
        im.src = src; im.alt = f.name; im.title = f.name + ', ' + f.sci;
        im.className = 'faunaImg ' + (f.pose === 'canopy' ? 'canopy' : 'ground') + (right ? ' right' : ' left');
        im.draggable = false;
        cardFauna.appendChild(im);
        const scale = (f.scale || 1) * (p.birdScale || 1);   // the bird's own size × this card's
        const h = parseFloat(getComputedStyle(im).height) * scale;
        if (scale !== 1) im.style.height = h + 'px';
        // The art has an empty margin under the feet (it differs per sprite, and grows with the bird):
        // sink a ground bird by it so its feet meet the plant's base line instead of floating above it.
        if (f.pose !== 'canopy') footPad(src, (pad) => { im.style.bottom = Math.round(-pad * h) + 'px'; });
        // An enlarged ground bird would cover its plant from the usual foot position: stand it
        // BESIDE the plant instead, and slide the plant toward the other side to make room.
        if (f.scale > 1 && f.pose !== 'canopy') {
          if (right) { im.style.left = BESIDE_AT; im.style.right = 'auto'; }
          else { im.style.right = BESIDE_AT; im.style.left = 'auto'; }
          cardSceneBox.style.transform = 'translateX(' + (right ? -BESIDE_SHIFT : BESIDE_SHIFT) + 'px)';
        }
      });
    });
  }
  // An enlarged ground bird's near edge sits this far across the plant's box; the plant shifts this many px.
  const BESIDE_AT = '45%', BESIDE_SHIFT = 110;

  // The fraction of a sprite's height that is empty below its lowest opaque pixel: measured once per
  // sprite on a canvas, cached (the images are preloaded, so this lands at once after the first load).
  const footPads = new Map();
  function footPad(src, apply) {
    if (footPads.has(src)) { apply(footPads.get(src)); return; }
    const im = new Image();
    im.onload = () => {
      let pad = 0;
      try {
        const w = im.naturalWidth, h = im.naturalHeight;
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        const cx = c.getContext('2d', { willReadFrequently: true });
        cx.drawImage(im, 0, 0);
        const a = cx.getImageData(0, 0, w, h).data;
        let y = h - 1;
        rows: for (; y >= 0; y--) for (let x = 0; x < w; x++) if (a[(y * w + x) * 4 + 3] > 8) break rows;
        pad = (h - 1 - y) / h;
      } catch (e) { console.warn('[secondscreen] could not measure ' + src + ': ' + e.message); }
      footPads.set(src, pad);
      apply(pad);
    };
    im.onerror = () => console.warn('[secondscreen] could not load ' + src);
    im.src = src;
  }

  // A hand-staged scene (a card's `birdStage`, encyclopedia.js): each bird placed by its own box
  // relative to the plant's (left/right/top/bottom, any CSS length), at `h` px tall, optionally
  // mirrored (`flip`), tilted (`rotate`, deg) or tucked `behind` the plant. `k` scales the heights
  // along with the plant (a card's sceneScale).
  function stageBirds(stage, k) {
    stage.forEach((s) => {
      const f = TM_FAUNA[s.fauna] || {};
      const im = document.createElement('img');
      im.src = s.sprite; im.alt = f.name || ''; im.title = f.name ? f.name + ', ' + f.sci : '';
      im.className = 'faunaImg';
      im.draggable = false;
      im.style.height = Math.round(s.h * (k || 1)) + 'px';
      ['left', 'right', 'top', 'bottom'].forEach((k) => { if (s[k] != null) im.style[k] = s[k]; });
      im.style.transform = (s.flip ? 'scaleX(-1) ' : '') + (s.rotate ? 'rotate(' + s.rotate + 'deg)' : '');
      if (s.behind) im.style.zIndex = '-1';
      cardFauna.appendChild(im);
    });
  }

  // The card's scene plant height: the cluster heights (SCENE_FROM, px) mapped onto a compressed range
  // (SCENE_TO) that fills the 262-px card head. Not to scale on purpose: a small plant still reads big.
  const SCENE_FROM = [150, 550], SCENE_TO = [190, 250];

  // The sprite PNGs carry wide transparent margins, so the <img> box is much bigger than the plant
  // and a bird placed "in the canopy" would float beside it. So the plant is shown through a clipping
  // box (#cardPlantClip) cropped to its opaque pixels, measured once per sprite on a canvas, cached.
  // The box is the plant's height `H` tall and as wide as the crop's aspect allows, capped at
  // SCENE_MAX_W; the crop is scaled to fit and sits bottom-centre (what object-fit: contain did).
  // Plain CSS on purpose: object-view-box did this in Chrome only, and Firefox drew the whole sprite.
  // A card's `crop` ('top' | 'bottom') keeps only that CROP_KEEP share of the plant, so it shows
  // enlarged in the same head, fading out at the cut edge (secondscreen.css #cardPlantClip.crop-*).
  // A card's `cropKeep` overrides that share (more kept = less enlarged).
  const CROP_KEEP = 0.55;
  const SCENE_MAX_W = { none: 230, crop: 320 };
  const cardPlantClip = $('cardPlantClip');
  const plantBox = new Map();   // src → { t, r, b, l, w, h } opaque-box insets + natural size, px
  const scene = { src: '', crop: '', H: 200, keep: CROP_KEEP };
  function layoutScenePlant() {
    const m = plantBox.get(scene.src);
    cardPlantClip.style.visibility = m ? '' : 'hidden';   // a moment, until the first measure lands
    if (!m) return;
    let { t, b } = m;
    const cut = (m.h - t - b) * (1 - scene.keep);
    if (scene.crop === 'top') b += cut; else if (scene.crop === 'bottom') t += cut;
    const vw = m.w - m.l - m.r, vh = m.h - t - b, H = scene.H;
    const boxW = Math.min(H * vw / vh, scene.crop ? SCENE_MAX_W.crop : SCENE_MAX_W.none);
    const s = Math.min(H / vh, boxW / vw);
    cardPlantClip.style.width = Math.round(boxW) + 'px';
    cardPlantClip.style.height = H + 'px';
    cardPlant.style.height = (m.h * s) + 'px';
    cardPlant.style.left = ((boxW - vw * s) / 2 - m.l * s) + 'px';
    cardPlant.style.top = (H - vh * s - t * s) + 'px';
  }
  function setScenePlant(src, crop, H, keep) {
    cardPlantClip.classList.toggle('crop-top', crop === 'top');
    cardPlantClip.classList.toggle('crop-bottom', crop === 'bottom');
    Object.assign(scene, { src, crop: crop || '', H, keep: keep || CROP_KEEP });
    if (cardPlant.getAttribute('src') !== src) cardPlant.src = src;
    layoutScenePlant();
    if (!src || plantBox.has(src)) return;
    const im = new Image();
    im.onload = () => {
      try {
        const w = im.naturalWidth, h = im.naturalHeight;
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        const cx = c.getContext('2d', { willReadFrequently: true });
        cx.drawImage(im, 0, 0);
        const a = cx.getImageData(0, 0, w, h).data;
        let x0 = w, y0 = h, x1 = -1, y1 = -1;
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          if (a[(y * w + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
        }
        if (x1 < 0) x0 = y0 = 0, x1 = w - 1, y1 = h - 1;   // fully transparent: show the whole canvas
        plantBox.set(src, { t: y0, r: w - 1 - x1, b: h - 1 - y1, l: x0, w, h });
      } catch (e) {
        // a tainted or failed canvas: show it uncropped rather than not at all
        console.warn('[secondscreen] could not measure ' + src + ': ' + e.message);
        plantBox.set(src, { t: 0, r: 0, b: 0, l: 0, w: im.naturalWidth, h: im.naturalHeight });
      }
      if (scene.src === src) layoutScenePlant();
    };
    im.onerror = () => console.warn('[secondscreen] could not load ' + src);
    im.src = src;
  }

  // The write-up: the plant's paragraphs, then (if the card has a bird) "Boosting <plant> helps:
  // <bird>" and the bird's paragraphs. Built as text nodes, never HTML. Scrolled back to the top.
  // Words a plant goal rests on are bold: each goal names its own (`terms`, ../TeManawa_goals.js).
  function paras(v) { return v == null ? [] : (Array.isArray(v) ? v : [v]); }
  function addPara(text, key) {
    const el = document.createElement('p');
    // A goal book that failed to load costs the bold, never the card.
    const runs = (typeof TMGoals !== 'undefined') ? TMGoals.termRuns(text, key) : [{ text, bold: false }];
    runs.forEach((r) => {
      if (!r.bold) { el.appendChild(document.createTextNode(r.text)); return; }
      const b = document.createElement('strong');
      b.textContent = r.text;
      el.appendChild(b);
    });
    cardBody.appendChild(el);
  }
  function birdNames(p) {
    const names = [];
    (p.fauna || []).forEach((fkey) => {
      const f = TM_FAUNA[fkey];
      if (!f) return;
      const n = f.name.replace(/ \((male|female)\)$/, '');   // the huia pair reads as one bird
      if (names.indexOf(n) === -1) names.push(n);
    });
    return names.join(' and ');
  }
  function renderBody(p) {
    cardBody.textContent = '';
    paras(p.desc).forEach((t) => addPara(t, p.key));
    const birds = paras(p.birdDesc);
    if (birds.length) {
      const h = document.createElement('h3');
      h.textContent = 'Boosting ' + p.name.toLowerCase() + ' helps: ' + birdNames(p);
      h.className = 'card-boost';
      cardBody.appendChild(h);
      birds.forEach((t) => addPara(t, p.key));
    }
    cardBody.scrollTop = 0;
    updateMore();
  }
  // The bottom fade and the "Scroll for more" pill show only while there is more text below.
  const cardMore = $('cardMore');
  function updateMore() {
    const more = cardBody.scrollTop + cardBody.clientHeight < cardBody.scrollHeight - 4;
    cardBody.classList.toggle('more', more);
    cardMore.classList.toggle('show', more);
  }
  cardBody.addEventListener('scroll', updateMore, { passive: true });
  // A tap on the pill reads on: most of a page down.
  cardMore.addEventListener('click', () => cardBody.scrollBy({ top: cardBody.clientHeight * 0.8, behavior: 'smooth' }));

  // ---- the KYA / glacial-interglacial / goal readout -------
  function fmtYears(y) {
    if (y == null) return '—';
    if (y >= 1e6) return '~' + (y / 1e6).toFixed(2) + ' Ma';
    return '~' + Math.round(y / 1000).toLocaleString() + ' kya';
  }
  function stageClass(name) {
    if (!name) return '';
    if (name.indexOf('glacial') !== -1) return 'cold';   // 'glacial' / 'full glacial'
    if (name === 'interglacial') return 'warm';
    return 'cool';                                        // 'cooling'
  }
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  function renderReadout() {
    const c = state.clock;
    if (!c) {
      clockLabel.textContent = 'waiting for the diorama…';
      stagePill.textContent = '—';
      stagePill.className = 'pill';
      goalLabel.textContent = '';
    } else if (c.palaeo && c.palaeo.active) {
      // The land before the window (TeManawa_palaeo.js): the diorama is replaying 4 Ma → 1 Ma with
      // nothing alive; its own clock rides the clock message. Any touch here skips it to the landing.
      clockLabel.textContent = fmtYears(c.palaeo.yearsBP) + '  ·  the land before the river';
      stagePill.textContent = 'Before the window';
      stagePill.className = 'pill';
      goalLabel.textContent = 'Watch the land form. Touch anything to begin.';
    } else {
      clockLabel.textContent = fmtYears(c.yearsBP) + (c.mis ? '  ·  ' + c.mis : '');
      stagePill.textContent = cap(c.stageName || '');
      stagePill.className = 'pill ' + stageClass(c.stageName);
      if (state.goal && state.goal.prompt) {
        // The live plant goal (TeManawa_goals.js): the same line the diorama shows above its timeline.
        goalLabel.textContent = state.goal.prompt;
      } else if (state.goal && state.goal.targetStageName) {
        // The boost gate grades a plant against the CURRENT climate (glacial index ≥ 0.5 = glacial,
        // Climate.regimeThreshold), so the hint names the climate now and the swing it leads to.
        // (It used to read a `stageName` the goal message never carries: "Boost a  undefinedplant!")
        const now = (c.glacialIndex != null && c.glacialIndex >= 0.5) ? 'glacial' : 'interglacial';
        goalLabel.textContent = 'Boost ' + (now === 'interglacial' ? 'an ' : 'a ') + now + ' plant to reach the ' +
          state.goal.targetStageName +
          (state.goal.targetYearsBP != null ? '  (' + fmtYears(state.goal.targetYearsBP) + ')' : '');
      } else {
        goalLabel.textContent = '';
      }
    }
    // timelapse bar
    const tl = state.timelapse;
    tlWrap.classList.toggle('active', !!tl.active);
    tlFill.style.width = Math.round((tl.progress || 0) * 100) + '%';
    if (tl.active) {
      tlMsg.textContent = 'Time-lapse… ' + (tl.yrPerSec ? Math.round(tl.yrPerSec).toLocaleString() + ' yr/s' : '');
    } else if (tl.achieved === true) {
      tlMsg.textContent = 'Goal reached: the habitat held.';
    } else if (tl.achieved === false) {
      tlMsg.textContent = 'The habitat could not hold here.';
    } else if (Date.now() >= state.hintUntil) {
      tlMsg.textContent = '';                  // hold a transient hint (boost/storm) until it expires
    }
  }

  // ---- the goal strip, under the plants ---------------------
  // The wall's question with its chances (left, under the plants) and how the last goal ended (right, under the card). Fed by the goal
  // telemetry (m.plant, TMGoals.telemetry in ../TeManawa_goals.js) about four times a second. Visitors
  // who miss come back here to hunt for the answer, so this is where a change of goal has to show:
  //   reveal    the old question (its pips empty) under "The answer was <plant>", in white like the
  //             ring round those plants on the wall
  //   new goal  the question slides up; the old answer stays beside it for a while
  //   answered  a solve, or a late answer to the goal that just left: "Answered! <plant>" in green
  const PREV_HOLD_MS = 20000;              // how long the last goal's ending stays up under a new goal
  const goalUI = { serial: 0, prevSig: '', prevSince: 0, pipsN: -1 };
  function cardFor(key) {
    for (const h of Object.values(TM_HABITATS)) for (const p of h.plants) if (p.key === key) return p;
    return null;
  }
  function setPips(n, left) {
    if (goalUI.pipsN !== n) {
      goalUI.pipsN = n;
      goalPips.textContent = '';
      for (let i = 0; i < n; i++) { const s = document.createElement('span'); s.className = 'pip'; goalPips.appendChild(s); }
    }
    Array.prototype.forEach.call(goalPips.children, (s, i) => s.classList.toggle('used', i >= left));
    goalPips.classList.toggle('hidden', !(n > 0 && left >= 0));
  }
  function renderGoalStrip() {
    const c = state.clock, P = state.goal && state.goal.plant;
    if (!c || (c.palaeo && c.palaeo.active) || !P || !P.prompt) {
      goalStrip.classList.add('hidden');
      goalUI.serial = 0;
      return;
    }
    goalStrip.classList.remove('hidden');
    if (P.serial !== goalUI.serial) {
      const fresh = goalUI.serial !== 0 && !P.revealing;    // a new goal (not the old one coming back for its reveal)
      goalUI.serial = P.serial;
      goalNowText.textContent = P.prompt;
      if (fresh && goalNow.animate) {
        goalNow.animate([{ transform: 'translateY(28px)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }],
                        { duration: 650, easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)' });
      }
    } else if (goalNowText.textContent !== P.prompt) {
      goalNowText.textContent = P.prompt;
    }
    setPips(P.missLimit || 0, P.chances);

    // the right-hand chip: the reveal, else the last goal's ending for PREV_HOLD_MS
    let kind = null, key = null;
    if (P.revealing) { kind = 'reveal'; key = P.revealKey; }
    else if (P.last && P.last.outcome && P.last.serial !== P.serial) {
      kind = (P.last.outcome === 'missed') ? 'reveal' : 'answered';
      key = P.last.key;
    }
    const sig = kind ? (kind + '|' + key + '|' + (P.last ? P.last.serial : P.serial)) : '';
    if (sig !== goalUI.prevSig) { goalUI.prevSig = sig; goalUI.prevSince = Date.now(); }
    const show = !!(kind && key && (P.revealing || Date.now() - goalUI.prevSince < PREV_HOLD_MS));
    goalPrev.classList.toggle('hidden', !show);
    if (!show) return;
    const p = cardFor(key);
    goalPrev.classList.toggle('reveal', kind === 'reveal');
    goalPrev.classList.toggle('answered', kind === 'answered');
    goalPrevLabel.textContent = kind === 'reveal' ? 'The answer was' : 'Answered!';
    const src = (typeof TM_PLANT_SPRITE !== 'undefined' && TM_PLANT_SPRITE[key]) || '';
    if (goalPrevImg.getAttribute('src') !== src) { goalPrevImg.style.visibility = ''; goalPrevImg.setAttribute('src', src); }
    goalPrevImg.classList.toggle('hidden', !src);
    goalPrevName.textContent = p ? p.name : key;
  }

  // ==========================================================
  // TRANSITIONS
  // ==========================================================
  function setPos(p) {
    p = Math.max(0, Math.min(TM_SCREEN_ORDER.length - 1, p));
    if (p === state.pos) return;
    const dir = p > state.pos ? 1 : -1;            // down the switch → the plants scroll up
    const live = visibleScreen();
    const wasHabitat = isHabitat(), wasPrompt = state.plantIndex < 0;
    // where each part is right now (mid-scroll if the switch was flicked), for the snapshot to start from
    const from = screenParts(live).map(([el]) => {
      const cs = getComputedStyle(el);
      return { transform: cs.transform === 'none' ? 'translateY(0)' : cs.transform, opacity: +cs.opacity };
    });
    const outgoing = live.cloneNode(true);         // snapshot before the re-render
    state.pos = p;
    state.plantIndex = -1;
    renderCluster();
    render();
    // habitat → habitat: the card box stays put; its contents crossfade only if they change
    // (a highlighted plant's card → the prompt). Otherwise the whole card fades.
    const card = !(wasHabitat && isHabitat()) ? 'fade' : (wasPrompt ? 'keep' : 'contents');
    scrollScreens(outgoing, from, visibleScreen(), dir, card);
    TMBus.habitat(isHabitat() ? screenKey() : null);
  }

  // The habitat switch "scrolls" the page: the plant cluster slides out (up when moving down the
  // switch) and fades while the new one slides in from the other side. The titles and cards land in
  // the same place on every screen, so they only fade in place; #bg sits outside the screens and
  // holds still. The outgoing screen is a static clone (no listeners, never re-rendered) laid over
  // the live one; a fast flick cancels the running scroll and starts from where things are.
  const SCROLL_PX = 140, SCROLL_MS = 800, SCROLL_EASE = 'cubic-bezier(0.22, 0.61, 0.36, 1)';
  let scrollGhost = null;
  function visibleScreen() { return selectScreen.classList.contains('hidden') ? habitatScreen : selectScreen; }
  // A screen's moving parts, [element, 'slide' | 'fade' | 'card'], found by id inside the live screen or its clone.
  function screenParts(root) {
    const q = (s) => root.querySelector(s);
    return root.id === 'selectScreen' ? [[q('#selectCard'), 'fade'], [q('#landingBirds'), 'slide']]
      : [[q('#habitatTitle'), 'fade'], [q('#plantCluster'), 'slide'], [q('#card'), 'card']];
  }
  function scrollScreens(outgoing, from, incoming, dir, cardMode) {
    if (scrollGhost) scrollGhost.remove();
    incoming.getAnimations({ subtree: true }).forEach((a) => a.cancel());
    if (!incoming.animate) return;                 // no Web Animations: plain swap
    outgoing.classList.remove('hidden');
    outgoing.classList.add('scrollGhost');
    outgoing.setAttribute('aria-hidden', 'true');
    incoming.after(outgoing);                      // after the live screen, so getElementById still finds the live one
    scrollGhost = outgoing;
    const opts = { duration: SCROLL_MS, easing: SCROLL_EASE };
    const away = `translateY(${-dir * SCROLL_PX}px)`, toward = `translateY(${dir * SCROLL_PX}px)`;
    const outs = [];
    screenParts(outgoing).forEach(([el, kind], i) => {
      const f = from[i];
      if (kind === 'card' && cardMode === 'keep') { el.style.visibility = 'hidden'; return; }
      if (kind === 'card' && cardMode === 'contents') el.classList.add('bare');   // box stays on the live card
      outs.push(kind === 'slide'
        ? el.animate([f, { transform: away, opacity: 0 }], opts)
        : el.animate([{ opacity: f.opacity }, { opacity: 0 }], opts));
    });
    Promise.all(outs.map((a) => a.finished))
      .then(() => { outgoing.remove(); if (scrollGhost === outgoing) scrollGhost = null; }, () => {});
    screenParts(incoming).forEach(([el, kind]) => {
      if (kind === 'slide') el.animate([{ transform: toward, opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }], opts);
      else if (kind !== 'card' || cardMode === 'fade') el.animate([{ opacity: 0 }, { opacity: 1 }], opts);
      else if (cardMode === 'contents') [cardPrompt, cardSpecies].forEach((c) => c.animate([{ opacity: 0 }, { opacity: 1 }], opts));
    });
  }

  // Decode every image the screens can show up front, so a screen never pops in piece by piece.
  const preloaded = [];
  function preloadImages() {
    const srcs = new Set([TM_BG_DEFAULT, 'assets/hand.png']);
    Object.values(TM_PLANT_SPRITE).forEach((s) => { srcs.add(s); srcs.add('assets/plants_outlined/' + s.split('/').pop()); });
    Object.values(TM_FAUNA).forEach((f) => (f.sprites || []).forEach((s) => srcs.add(s)));
    Object.values(TM_HABITATS).forEach((h) => {
      if (h.bg) srcs.add(h.bg);
      h.plants.forEach((p) => (p.birdStage || []).forEach((s) => srcs.add(s.sprite)));
    });
    srcs.forEach((src) => {
      if (!src) return;
      const im = new Image();
      im.src = src;
      if (im.decode) im.decode().catch(() => console.warn('[secondscreen] could not preload ' + src));
      preloaded.push(im);
    });
  }

  function selectPlant(i) {
    const h = currentHabitat();
    if (!h) return;
    const n = h.plants.length;
    if (n === 0) return;
    state.plantIndex = ((i % n) + n) % n;
    applyHighlight();
    renderCard();
    TMBus.plant(screenKey(), currentPlant().key);
  }

  function stepPlant(dir) {
    const h = currentHabitat();
    if (!h || h.plants.length === 0) return;
    if (state.plantIndex < 0) selectPlant(dir > 0 ? 0 : h.plants.length - 1);
    else selectPlant(state.plantIndex + dir);
  }

  function doBoost() {
    const p = currentPlant();
    if (!p) { flashHint('Select a plant first'); return; }
    TMBus.boost(screenKey(), p.key, faunaSimKeys(p), p.name);
    flashHint('Boosting ' + p.name + '…', 2600);
  }

  // The sim species keys behind this card's fauna (deduped), so the diorama recruits and
  // outlines exactly the birds the visitor sees on the card. Empty → the sim's own fallback.
  function faunaSimKeys(p) {
    const out = [];
    (p.fauna || []).forEach((fkey) => {
      const f = TM_FAUNA[fkey];
      if (!f) return;
      [f.key].concat(f.alsoKeys || []).forEach((k) => { if (k && out.indexOf(k) === -1) out.push(k); });
    });
    return out;
  }

  function flashHint(text, ms) {
    state.hintUntil = Date.now() + (ms || 1800);
    tlMsg.textContent = text;
  }

  // ==========================================================
  // INPUT
  // ==========================================================
  // A visitor's own move (the switch, a plant, a boost, another bird) cancels a bird's navigation on its way.
  const NAV_KEEPS = { dialTurn: 1, dialReset: 1, hint: 1, storm: 1, eruptionDown: 1, eruptionUp: 1 };
  function onAction(action, payload) {
    if (!NAV_KEEPS[action]) navToken++;
    if (action.indexOf('habitat:') === 0) { setPos(TM_SCREEN_ORDER.indexOf(action.slice(8))); return; }
    switch (action) {
      case 'bird':         if (payload) goToBird(payload.fauna, payload.el); break;
      case 'hint':         TMBus.hint(); break;
      case 'habitatUp':    setPos(state.pos - 1); break;
      case 'habitatDown':  setPos(state.pos + 1); break;
      case 'plantPrev':    stepPlant(-1); break;
      case 'plantNext':    stepPlant(1); break;
      case 'plantSelect':  if (state.plantIndex < 0) stepPlant(1); break;
      case 'storm':        TMBus.storm(); flashHint('Storm'); break;
      case 'boost':        doBoost(); break;
      case 'eruptionDown': TMBus.eruption('down'); break;
      case 'eruptionUp':   TMBus.eruption('up'); break;
      case 'dialTurn':     TMBus.dial(payload | 0); break;
      case 'dialReset':    TMBus.dialReset(); break;
    }
  }

  // ==========================================================
  // TELEMETRY (sim → screen)
  // ==========================================================
  function onBus(m) {
    switch (m.type) {
      case 'clock':
        state.clock = m; renderReadout(); renderGoalStrip(); break;
      case 'goal':
        state.goal = m; renderReadout(); renderGoalStrip(); break;
      case 'timelapse':
        state.timelapse = { active: !!m.active, progress: m.progress || 0,
                            yrPerSec: m.yrPerSec, achieved: m.achieved };
        renderReadout(); break;
      case 'boostResult':
        if (m.topUp) break;                                      // a press during the time-lapse: the boost's own verdict stands
        // a late answer to the goal that just left (TMGoals.judgeLate): green, like its line on the wall
        card.classList.toggle('matched', m.matched === true || m.late === true);
        card.classList.toggle('mismatched', m.matched === false);
        card.classList.toggle('answer', m.goal === 'answer');   // the live plant goal's answer: a white glow
        if (m.text) flashHint(m.text, 7000);                     // the sim's goal verdict (debug readout)
        break;
      case 'eruptionSoon':
        flashHint('Eruption ahead: ' + (m.name || '') + '. Watch the boost, then the ash');
        break;
      case 'hint':                                               // the H key, here or on the wall (TMGoals.hint)
        showHint(m); break;
    }
  }

  // ==========================================================
  // KIOSK + STAGE FIT
  // ==========================================================
  function fitStage() {
    const s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    stage.style.transform = 'translate(-50%, -50%) scale(' + s + ')';
  }

  function setDebug(on) { document.body.classList.toggle('debug', !!on); }

  function hardenKiosk() {
    window.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('gesturestart', (e) => e.preventDefault());   // pinch-zoom (Safari)
    document.addEventListener('dblclick', (e) => e.preventDefault());

    // Wire the on-screen test buttons once (only reachable while debug mode is on).
    document.querySelectorAll('[data-action]').forEach((el) => {
      const a = el.getAttribute('data-action');
      el.addEventListener('pointerdown', () => onAction(a === 'eruption' ? 'eruptionDown' : a));
      if (a === 'eruption') el.addEventListener('pointerup', () => onAction('eruptionUp'));
    });

    // DEBUG MODE: gates the "extra stuff": the timeline/goal readout AND the test buttons.
    // Off by default (a clean kiosk screen); `?debug=1` starts it on; backtick (`) toggles it live.
    const q = new URLSearchParams(location.search);
    setDebug(q.get('debug') === '1' || q.get('controls') === '1');
    window.addEventListener('keydown', (e) => {
      if (e.key === '`' || e.key === '~') { e.preventDefault(); setDebug(!document.body.classList.contains('debug')); }
    });
  }

  // ==========================================================
  // BOOT
  // ==========================================================
  function boot() {
    hardenKiosk();
    fitStage();
    window.addEventListener('resize', fitStage);
    TMInput.on(onAction);
    TMInput.start();
    TMBus.on(onBus);
    preloadImages();
    buildRail();
    renderLandingBirds();
    renderCluster();
    render();
    TMBus.hello();   // ask the diorama for its current clock/goal
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
