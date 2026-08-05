// ============================================================
// TE MANAWA — UI HOST
// ------------------------------------------------------------
// Phase 1.5 replacement for the 44 kB Mauri GameUI.
//
// delegates on-screen HUD to InstallHUD, which draws the deep-time timeline
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

    // DEBUG MESSAGES.
    this.messages = [];
    this.maxMessages = 4;
    this.messageLife = 300;       // frames

    this.recalculate();
  }

  // Kept as a method because windowResized() calls it.
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
  // called by Game.render() 
  renderFullscreenOverlay() {
    const g = this.game;
    const W = this.config.canvasWidth;
    const H = this.config.canvasHeight;

    InstallHUD.renderWorldLayer(g, W, H);   // storm cells — under the strips
    InstallHUD.renderTimeline(this, g, W, H);
    InstallHUD.renderButtons(this, g, W, H);

    if (typeof Debug !== 'undefined' && Debug.enabled) this.renderMessages(W, H);
    InstallHUD.renderAshFlash(g, W, H);     // over everything

    if (typeof Debug !== 'undefined' && Debug.enabled) Debug.render(g, W, H);
  }

  renderMessages(W, H) {
    if (!this.messages.length) return;
    // Sits below the debug climate strip.
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
