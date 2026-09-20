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
//   habitat:forest|wetland|select|lowland|alpine  : absolute 5-position switch
//   plantPrev, plantNext, plantSelect : station 2 select
//   storm                             : station 2 storm button
//   boost                             : station 3 boost button
//   eruptionDown, eruptionUp          : station 3 eruption (press/release → tap vs hold)
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
    eruption:     ['e', 'E']        // keydown → eruptionDown, keyup → eruptionUp
  };
  // For SWITCH_MODE 'absolute': one key per detent, top → bottom.
  const KEY_HABITAT = { q: 'forest', w: 'wetland', e: 'select', r: 'lowland', t: 'alpine' };

  const listeners = [];
  function emit(action, payload) {
    for (const fn of listeners) { try { fn(action, payload); } catch (_) {} }
  }
  function matches(map, key) {
    for (const k in map) if (map[k].indexOf(key) !== -1) return k;
    return null;
  }

  function onKeyDown(e) {
    if (e.repeat) return;   // OS key-repeat: one action per physical press
    const k = e.key;

    if (SWITCH_MODE === 'absolute' && KEY_HABITAT[k]) { emit('habitat:' + KEY_HABITAT[k]); e.preventDefault(); return; }
    if (SWITCH_MODE === 'momentary') {
      if (KEYS.habitatUp.indexOf(k) !== -1)   { emit('habitatUp');   e.preventDefault(); return; }
      if (KEYS.habitatDown.indexOf(k) !== -1) { emit('habitatDown'); e.preventDefault(); return; }
    }
    const hit = matches({ plantPrev: KEYS.plantPrev, plantNext: KEYS.plantNext,
                          plantSelect: KEYS.plantSelect, storm: KEYS.storm, boost: KEYS.boost }, k);
    if (hit) { emit(hit); e.preventDefault(); return; }
    if (KEYS.eruption.indexOf(k) !== -1) { emit('eruptionDown'); e.preventDefault(); return; }
  }

  function onKeyUp(e) {
    if (KEYS.eruption.indexOf(e.key) !== -1) { emit('eruptionUp'); e.preventDefault(); }
  }

  return {
    // app.js registers one handler: (action, payload) => { … }
    on(fn) { if (typeof fn === 'function') listeners.push(fn); },
    // let app.js/touch surfaces raise actions too (a tapped sprite, an on-screen test button)
    fire(action, payload) { emit(action, payload); },
    start() {
      window.addEventListener('keydown', onKeyDown);
      window.addEventListener('keyup', onKeyUp);
    },
    switchMode() { return SWITCH_MODE; }
  };
})();
