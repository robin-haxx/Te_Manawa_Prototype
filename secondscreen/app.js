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
  const cardName = $('cardName');
  const cardSci = $('cardSci');
  const cardDesc = $('cardDesc');
  const clockLabel = $('clockLabel');
  const stagePill = $('stagePill');
  const goalLabel = $('goalLabel');
  const tlWrap = $('timelapse');
  const tlFill = $('timelapseFill');
  const tlMsg = $('timelapseMsg');

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
    renderCard();
    renderReadout();
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
      const img = document.createElement('img');
      img.src = TM_PLANT_SPRITE[p.key] || '';
      img.alt = p.name;
      img.draggable = false;
      btn.appendChild(img);
      btn.addEventListener('click', () => selectPlant(i));
      cluster.appendChild(btn);
    });
    applyHighlight();
  }

  // Ring the highlighted sticker; swap in the highlight loop if one exists.
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
    cardSci.textContent = p.sci;
    cardDesc.textContent = p.desc;
    cardPlant.src = TM_PLANT_SPRITE[p.key] || '';
    // fauna the plant supports
    cardFauna.innerHTML = '';
    (p.fauna || []).forEach((fkey) => {
      const f = TM_FAUNA[fkey];
      if (!f) return;
      (f.sprites || []).forEach((src) => {
        const im = document.createElement('img');
        im.src = src; im.alt = f.name; im.className = 'faunaImg'; im.title = f.name + ', ' + f.sci;
        im.draggable = false;
        cardFauna.appendChild(im);
      });
    });
  }

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
    } else {
      clockLabel.textContent = fmtYears(c.yearsBP) + (c.mis ? '  ·  ' + c.mis : '');
      stagePill.textContent = cap(c.stageName || '');
      stagePill.className = 'pill ' + stageClass(c.stageName);
      if (state.goal && state.goal.targetStageName) {
        goalLabel.textContent = 'Boost a  ' + state.goal.stageName + 'plant!' +
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

  // ==========================================================
  // TRANSITIONS
  // ==========================================================
  function setPos(p) {
    p = Math.max(0, Math.min(TM_SCREEN_ORDER.length - 1, p));
    if (p === state.pos) return;
    state.pos = p;
    state.plantIndex = -1;
    renderCluster();
    render();
    TMBus.habitat(isHabitat() ? screenKey() : null);
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
    TMBus.boost(screenKey(), p.key);
    flashHint('Boosting ' + p.name + '…', 2600);
  }

  function flashHint(text, ms) {
    state.hintUntil = Date.now() + (ms || 1800);
    tlMsg.textContent = text;
  }

  // ==========================================================
  // INPUT
  // ==========================================================
  function onAction(action) {
    if (action.indexOf('habitat:') === 0) { setPos(TM_SCREEN_ORDER.indexOf(action.slice(8))); return; }
    switch (action) {
      case 'habitatUp':    setPos(state.pos - 1); break;
      case 'habitatDown':  setPos(state.pos + 1); break;
      case 'plantPrev':    stepPlant(-1); break;
      case 'plantNext':    stepPlant(1); break;
      case 'plantSelect':  if (state.plantIndex < 0) stepPlant(1); break;
      case 'storm':        TMBus.storm(); flashHint('Storm'); break;
      case 'boost':        doBoost(); break;
      case 'eruptionDown': TMBus.eruption('down'); break;
      case 'eruptionUp':   TMBus.eruption('up'); break;
    }
  }

  // ==========================================================
  // TELEMETRY (sim → screen)
  // ==========================================================
  function onBus(m) {
    switch (m.type) {
      case 'clock':
        state.clock = m; renderReadout(); break;
      case 'goal':
        state.goal = m; renderReadout(); break;
      case 'timelapse':
        state.timelapse = { active: !!m.active, progress: m.progress || 0,
                            yrPerSec: m.yrPerSec, achieved: m.achieved };
        renderReadout(); break;
      case 'boostResult':
        card.classList.toggle('matched', m.matched === true);
        card.classList.toggle('mismatched', m.matched === false);
        break;
      case 'eruptionSoon':
        flashHint('Eruption ahead: ' + (m.name || '') + '. Watch the boost, then the ash');
        break;
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
    renderCluster();
    render();
    TMBus.hello();   // ask the diorama for its current clock/goal
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
