// ============================================================
// TE MANAWA SECOND SCREEN: THE BUS
// ------------------------------------------------------------
// BroadcastChannel wrapper. Both screens are same-origin under tools/serve.js,
// so this connects with no server, no polling, no network. The message shapes
// are the vocabulary in md/TEMANAWA_SECOND_SCREEN.md §3, kept identical on the
// sim side (TeManawa_bus.js).
//
// Fails soft: if BroadcastChannel is unavailable (very old browser, or the page
// is opened file://), send() is a no-op and the screen still runs standalone.
// ============================================================

const TMBus = (function () {
  const CHANNEL = 'temanawa';
  let ch = null;
  const handlers = [];

  try {
    ch = new BroadcastChannel(CHANNEL);
    ch.onmessage = function (e) {
      const m = e && e.data;
      if (!m || typeof m !== 'object') return;   // ignore anything not a typed message
      for (const h of handlers) { try { h(m); } catch (_) {} }
    };
  } catch (_) {
    ch = null;
  }

  return {
    available() { return !!ch; },

    // Touchscreen → sim (intents). See §3.1.
    send(msg) {
      try { if (ch && msg && typeof msg === 'object') ch.postMessage(msg); } catch (_) {}
    },

    // Register a handler for sim → touchscreen telemetry (§3.2).
    on(fn) { if (typeof fn === 'function') handlers.push(fn); },

    // ---- intent helpers (thin, so app.js reads clearly) ----
    habitat(habitat)          { this.send({ type: 'habitat', habitat: habitat }); },
    plant(habitat, plantKey)  { this.send({ type: 'plant', habitat: habitat, plantKey: plantKey }); },
    // fauna: the card's sim species keys; the sim recruits/outlines these (else its faunaLinks fallback)
    // plantName: the card's name, so the sim's goal verdict says "Harakeke", not the sim's "Flax"
    boost(habitat, plantKey, fauna, plantName) {
      const m = { type: 'boost', habitat: habitat, plantKey: plantKey };
      if (Array.isArray(fauna) && fauna.length) m.fauna = fauna;
      if (plantName) m.plantName = plantName;
      this.send(m);
    },
    storm()                   { this.send({ type: 'storm' }); },
    eruption(phase)           { this.send({ type: 'eruption', phase: phase }); },   // 'down' | 'up'
    deep()                    { this.send({ type: 'deep' }); },
    dial(delta)               { this.send({ type: 'dial', delta: delta }); },   // time dial: ±detents
    dialReset()               { this.send({ type: 'dial', reset: true }); },    // time dial push: back to real time
    hello()                   { this.send({ type: 'hello' }); }
  };
})();
