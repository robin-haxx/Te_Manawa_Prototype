// ============================================================
// TE MANAWA — TEMPORARY BOOT SHIMS   (delete in Phase 1)
// ------------------------------------------------------------
// Te Manawa forks the Mauri engine but DROPS four subsystems:
// tutorial, menu_art, progress, benchmark. TeManawa_sketch.js is
// an exact copy and still *calls into* them, and simulation/moa
// call game.tutorial.fireEvent(...) unguarded. This file supplies
// inert no-op stand-ins so the fork BOOTS while the ambient scene
// is built. When Phase 1 rebuilds the HUD and removes those call-
// sites (see TEMANAWA_PLAN.md), DELETE THIS FILE and its <script>
// tag. Must load FIRST.
// ============================================================

// --- Progress: localStorage unlock/scores → no-op -----------
const PROGRESS = {
  bestScores: {},
  init() {},
  completeLevel() {},
  isUnlocked() { return true; },
  isCompleted() { return false; }
};

// --- Benchmark: dev perf harness → inert --------------------
const BENCHMARK = {
  pending: false, active: false, finished: false,
  tick() {}, start() {}, cancel() {}, update() {},
  recordPlacement() {}, finish() {}, arm() {}, armBatch() {}
};

// --- Tutorial trigger/event enums (referenced at runtime) ----
const TRIGGER_TYPE = {
  IMMEDIATE: 'immediate', TIME: 'time', EVENT: 'event',
  CONDITION: 'condition', MANUAL: 'manual'
};
const TUTORIAL_EVENTS = {
  GAME_START: 'game_start', EAGLE_HUNTING: 'eagle_hunting',
  MOA_KILLED: 'moa_killed', FIRST_PLACEMENT: 'first_placement',
  SEASON_CHANGE: 'season_change', EAGLE_SPAWNED: 'eagle_spawned',
  POPULATION_MILESTONE: 'population_milestone', MOA_HUNGRY: 'moa_hungry',
  EGG_LAID: 'egg_laid', EGG_HATCHED: 'egg_hatched',
  LOW_MAURI: 'low_mauri', PLACEABLE_EXPIRED: 'placeable_expired',
  FIRST_EGG: 'first_egg'
};

// --- Tutorial manager → inert LIVE instance -----------------
// Kept as an object (not null): simulation/moa call
// game.tutorial.fireEvent(...) without a null guard.
class TutorialManager {
  constructor(game) {
    this.game = game;
    this.enabled = false;
    this.active = false;
    this.currentTip = null;
  }
  setGuideSprite() {}
  setLevelTips() {}
  init() {}
  update() {}
  render() {}
  fireEvent() {}
  handleClick() { return false; }
  toggle() {}
}

// --- Menu / start-screen art → inert ------------------------
class MenuArtManager {
  constructor() {}
  loadForLevel() {}
  render() {}
}
