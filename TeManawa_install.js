// ============================================================
// SUPERSEDED IN PHASE 1.5 — this file is a tombstone.
// ------------------------------------------------------------
// This was the monkey-patch layer: it overrode Game.update,
// Game.handleKey, GameUI.renderFullscreenOverlay and
// CONFIG.recalculateLayout at load time so the ambient museum piece
// could be built without editing the large engine files.
//
// The economy it was patching around is gone, so the patching is no
// longer needed. Its contents now live in:
//
//   TeManawa_hud.js     timeline, the four buttons, storm + ash effects,
//                       the time model (window.TM_TIME)
//   TeManawa_kiosk.js   watchdog, idle/attract, resetToAttract(),
//                       error capture, input lockdown
//   TeManawa_sketch.js  CONFIG.recalculateLayout (full-bleed, portrait-capable)
//
// Nothing loads this file any more — it has been removed from
// index.html. The file itself could not be deleted from this
// environment; delete it by hand.
// ============================================================
