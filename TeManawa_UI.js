// ============================================================
// TE MANAWA — UI HOST
// ------------------------------------------------------------
// Phase 1.5 replacement for the 44 kB Mauri GameUI.
//
// The Mauri UI was built for a game: a mauri counter, a placeable
// toolbar, a goals panel, an event log, a species sidebar, pause
// and fullscreen buttons, a minimap. None of that exists in the
// installation — there is no economy, no goals, no win state and
// no operator. All of it is gone.
//
// What is left is a host: it owns the notification strip (the
// simulation still narrates ecological events) and delegates the
// on-screen HUD to InstallHUD, which draws the deep-time timeline
// and the four buttons.
//
// Kept deliberately thin. If something here grows past a screen it
// probably belongs in InstallHUD or Debug instead.
// ============================================================

class GameUI {
  constructor(config, terrain, simulation, game, seasonManager) {
    this.config = config;
    this.terrain = terrain;
    this.simulation = simulation;
    this.game = game;
    this.seasonManager = seasonManager;

    // Ecological events narrated by the simulation ("A Pouākai eaglet
    // hatches"). Kept because they are useful while tuning, but only drawn
    // in debug mode — see renderFullscreenOverlay.
    this.messages = [];
    this.maxMessages = 4;
    this.messageLife = 300;       // frames

    this.recalculate();
  }

  // Layout is trivial now: two full-width strips over a letterboxed
  // square map. Kept as a method because windowResized() calls it.
  recalculate() {
    this.layout = {
      topStripH: InstallHUD.TOP_H,
      bottomStripH: InstallHUD.BOT_H,
      cw: this.config.canvasWidth,
      ch: this.config.canvasHeight
    };
  }

  addMessage(text, type = 'info') {
    this.messages.push({ text, type, life: this.messageLife });
    while (this.messages.length > this.maxMessages) this.messages.shift();
  }

  update(dt = 1) {
    for (let i = this.messages.length - 1; i >= 0; i--) {
      this.messages[i].life -= dt;
      if (this.messages[i].life <= 0) this.messages.splice(i, 1);
    }
  }

  // ---- render ------------------------------------------------
  // Name kept from the engine because Game.render() calls it.
  renderFullscreenOverlay() {
    const g = this.game;
    const W = this.config.canvasWidth;
    const H = this.config.canvasHeight;

    InstallHUD.renderWorldLayer(g, W, H);   // storm cells — under the strips
    InstallHUD.renderTimeline(this, g, W, H);
    InstallHUD.renderButtons(this, g, W, H);
    // Notifications are debug-only. "A moa has hatched!" is engine chatter
    // from the game this used to be; an ambient diorama does not narrate
    // itself, and the strip sat directly over the play area.
    if (typeof Debug !== 'undefined' && Debug.enabled) this.renderMessages(W, H);
    InstallHUD.renderAshFlash(g, W, H);     // over everything

    if (typeof Debug !== 'undefined' && Debug.enabled) Debug.render(g, W, H);
  }

  renderMessages(W, H) {
    if (!this.messages.length) return;
    // Sits below the debug climate strip so the two don't overlap.
    const y0 = InstallHUD.TOP_H + 62;
    const tw = 460;
    push();
    textAlign(CENTER, TOP);
    for (let i = 0; i < this.messages.length; i++) {
      const m = this.messages[i];
      const a = Math.min(1, m.life / 60);
      noStroke();
      fill(14, 21, 19, 175 * a);
      rect(W / 2 - tw / 2, y0 + i * 26, tw, 22, 6);
      fill(210, 228, 218, 235 * a);
      push();
      textFont(OpenDyslexic);
      textSize(13);
      text(m.text, W / 2, y0 + i * 26 + 4);
      pop();
    }
    pop();
  }

  // ---- input -------------------------------------------------
  handleFullscreenClick(mx, my) {
    return InstallHUD.handleClick(this, mx, my);
  }
}
