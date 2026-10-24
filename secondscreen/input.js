// ============================================================
// TE MANAWA SECOND SCREEN: INPUT
// ------------------------------------------------------------
// The physical controls (habitat switch, plant-select, storm, boost, eruption)
// reach the page as HID key events and/or touch. This layer turns them into
// named ACTIONS so app.js never hard-codes a key. Set the bindings to match how
// the console is wired at install time. See TEMANAWA_SECOND_SCREEN.md §1.1.
//
// Actions app.js listens for:
//   habitatUp, habitatDown            : momentary switch (steps through positions)
//   habitat:wetland|forest|select|alpine|lowland  : absolute 5-position switch
//   plantPrev, plantNext, plantSelect : station 2 select
//   storm                             : station 2 storm button
//   boost                             : station 3 boost button
//   eruptionDown, eruptionUp          : station 3 eruption (press/release → tap vs hold)
//   dialTurn (payload ±detents), dialReset : the macro pad's TIME DIAL (relayed to the sim's DeepTime)
// ============================================================

const TMInput = (function () {
  // ---- CHOOSE ONE switch mode at install time --------------
  //   'momentary' : a centre-sprung up/down toggle; ArrowUp/ArrowDown step the position.
  //   'absolute'  : a 5-position switch; each detent sends its own key (KEY_HABITAT below).
  const SWITCH_MODE = 'momentary';

  // ---- key bindings (edit to match the wiring) -------------
  const KEYS = {
    habitatUp:    ['ArrowUp'],
    habitatDown:  ['ArrowDown'],
    plantPrev:    ['ArrowLeft', 'a', 'A'],
    plantNext:    ['ArrowRight', 'd', 'D'],
    plantSelect:  ['Enter', ' '],
    storm:        ['s', 'S'],
    boost:        ['b', 'B'],
    eruption:     ['e', 'E'],       // keydown → eruptionDown, keyup → eruptionUp
    // The TIME DIAL — program the macro pad's encoder to send these (CW / CCW / push). Keep in step
    // with DeepTime.DIAL_KEYS (TeManawa_time.js), which takes the same keys when the sim has focus.
    dialFaster:   [']'],
    dialSlower:   ['['],
    dialReset:    ['\\']
  };
  const DIAL_WHEEL_STEP = 100;      // wheel deltaY per detent, for a dial set to send scroll
  // For SWITCH_MODE 'absolute': one key per detent, top → bottom (matches TM_SCREEN_ORDER).
  const KEY_HABITAT = { q: 'wetland', w: 'forest', e: 'select', r: 'alpine', t: 'lowland' };

  // ---- TEMPORARY: 3-key macro pad (ArrowUp / ArrowDown / B) ----------------
  // With no separate eruption key, B is overloaded: a short press = boost (sent on RELEASE, so a
  // long press never also boosts); holding past BOOST_HOLD_MS = eruption. The hold LATCHES: it
  // sends eruptionDown and keeps the sim's eruption "held" for ERUPT_LATCH_MS (> the sim's
  // TM_TIME.erLongPressMs, 4500) whether or not B is still down, so the full build-up always runs
  // and fires the NEXT eruption (the long-press path) — an early release can't turn it into a tap
  // (which would revert to the previous one). Set to false to restore B = instant boost.
  const B_LONG_PRESS_ERUPTS = true;
  const BOOST_HOLD_MS  = 700;
  const ERUPT_LATCH_MS = 5000;
  let bHoldTimer = 0, bErupted = false, eruptLatched = false;

  function bDown() {
    if (!B_LONG_PRESS_ERUPTS) { emit('boost'); return; }
    if (bHoldTimer || eruptLatched) return;   // already holding / an eruption is mid-build
    bErupted = false;
    bHoldTimer = setTimeout(() => {
      bHoldTimer = 0; bErupted = true; eruptLatched = true;
      emit('eruptionDown');
      setTimeout(() => { eruptLatched = false; emit('eruptionUp'); }, ERUPT_LATCH_MS);
    }, BOOST_HOLD_MS);
  }
  function bUp() {
    if (!B_LONG_PRESS_ERUPTS) return;
    if (bHoldTimer) { clearTimeout(bHoldTimer); bHoldTimer = 0; if (!bErupted) emit('boost'); }
  }

  const listeners = [];
  function emit(action, payload) {
    for (const fn of listeners) { try { fn(action, payload); } catch (_) {} }
  }
  function matches(map, key) {
    for (const k in map) if (map[k].indexOf(key) !== -1) return k;
    return null;
  }

  function onKeyDown(e) {
    const k = e.key;
    // The dial first, and BEFORE the repeat guard: holding a dial key may ramp it like a fast spin.
    if (KEYS.dialFaster.indexOf(k) !== -1) { emit('dialTurn', 1);  e.preventDefault(); return; }
    if (KEYS.dialSlower.indexOf(k) !== -1) { emit('dialTurn', -1); e.preventDefault(); return; }
    if (KEYS.dialReset.indexOf(k) !== -1)  { emit('dialReset');    e.preventDefault(); return; }
    if (e.repeat) return;   // OS key-repeat: one action per physical press

    if (SWITCH_MODE === 'absolute' && KEY_HABITAT[k]) { emit('habitat:' + KEY_HABITAT[k]); e.preventDefault(); return; }
    if (SWITCH_MODE === 'momentary') {
      if (KEYS.habitatUp.indexOf(k) !== -1)   { emit('habitatUp');   e.preventDefault(); return; }
      if (KEYS.habitatDown.indexOf(k) !== -1) { emit('habitatDown'); e.preventDefault(); return; }
    }
    if (KEYS.boost.indexOf(k) !== -1) { bDown(); e.preventDefault(); return; }
    const hit = matches({ plantPrev: KEYS.plantPrev, plantNext: KEYS.plantNext,
                          plantSelect: KEYS.plantSelect, storm: KEYS.storm }, k);
    if (hit) { emit(hit); e.preventDefault(); return; }
    if (KEYS.eruption.indexOf(k) !== -1) { emit('eruptionDown'); e.preventDefault(); return; }
  }

  function onKeyUp(e) {
    if (KEYS.boost.indexOf(e.key) !== -1) { bUp(); e.preventDefault(); return; }
    if (KEYS.eruption.indexOf(e.key) !== -1) { emit('eruptionUp'); e.preventDefault(); }
  }

  // A dial set to send scroll: whole detents from the accumulated deltaY (wheel up = faster).
  let wheelAcc = 0;
  function onWheel(e) {
    wheelAcc += e.deltaY;
    const n = Math.trunc(wheelAcc / DIAL_WHEEL_STEP);
    if (n !== 0) { wheelAcc -= n * DIAL_WHEEL_STEP; emit('dialTurn', -n); }
    e.preventDefault();
  }

  return {
    // app.js registers one handler: (action, payload) => { … }
    on(fn) { if (typeof fn === 'function') listeners.push(fn); },
    // let app.js/touch surfaces raise actions too (a tapped sprite, an on-screen test button)
    fire(action, payload) { emit(action, payload); },
    start() {
      window.addEventListener('keydown', onKeyDown);
      window.addEventListener('keyup', onKeyUp);
      window.addEventListener('wheel', onWheel, { passive: false });
    },
    switchMode() { return SWITCH_MODE; }
  };
})();
