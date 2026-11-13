// ============================================================
// TE MANAWA: UI HOST
// ------------------------------------------------------------
// Thin host: delegates the on-screen HUD to InstallHUD (deep-time timeline +
// the five buttons) and owns only the debug message strip. Keep it thin: if
// something here grows past a screen it probably belongs in InstallHUD or Debug.
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

    const debug = (typeof Debug !== 'undefined' && Debug.enabled);

    InstallHUD.renderWorldLayer(g, W, H);   // storm cells, under the strips
    InstallHUD.renderWind(g, W, H);         // W-E climate/boost gusts, an atmospheric wash over the scene

    // A HEALTH MILESTONE (TeManawa_milestone.js) takes every piece of UI off the wall while the land
    // plays, and fades it back after: one globalAlpha over all of it (each piece multiplies into it).
    // The weather above is the world's, so it stays.
    // The attract (TeManawa_attract.js) takes it off the same way: the idle land and the map carry none.
    const msA = (typeof Milestone !== 'undefined') ? Milestone.uiAlpha() : 1;
    const atA = (typeof Attract !== 'undefined') ? Attract.uiAlpha() : 1;
    const uiA = msA < atA ? msA : atA;
    if (uiA <= 0.002) { this._tmButtons = []; if (debug) Debug.render(g, W, H); return; }
    const _dc = drawingContext, _a0 = _dc.globalAlpha;
    if (uiA < 1) _dc.globalAlpha = _a0 * uiA;

    // The ambient LED colour band frames the scene at all times, drawn UNDER the HUD so the
    // timeline (axis / markers / playhead) and the year read cleanly OVER the band rather
    // than being washed out by it.
    InstallHUD.renderEdgeGlow(g, W, H);

    // River names: over the whole world (ground, water, cast, weather, the edge band) and under the
    // HUD, clear of the HUD's pieces (TeManawa_rivernames.js).
    if (typeof RiverNames !== 'undefined') RiverNames.render(g, W, H);
    // …and, while the clock is in the prologue (2 Ma → 1 Ma), the names of the time: the strait, the
    // basin, the proto-ranges (TeManawa_palaeo.js renderEraNames). Nothing past it.
    if (typeof Palaeo !== 'undefined' && Palaeo.renderEraNames) Palaeo.renderEraNames(g, W, H);

    // The on-screen buttons are a DEBUG twin of the wall's physical buttons, so they only
    // show with the overlay. Visitors get the clean layout: the deep-time axis on a thin
    // strip at the bottom (where the buttons used to be) and the year floated large and
    // high (see the InstallHUD renderVisitor* comments).
    if (debug) {
      InstallHUD.renderTimeline(this, g, W, H);
      InstallHUD.renderButtons(this, g, W, H);
    } else {
      this._tmButtons = [];                 // nothing clickable off-debug
      InstallHUD.renderVisitorTimeline(g, W, H);
      InstallHUD.renderVisitorYear(g, W, H);   // the year, the climate line and the speed readout
      InstallHUD.renderVisitorGoal(g, W, H);   // the interglacial/glacial objective, above the timeline
      InstallHUD.renderVisitorTopBand(g, W, H);   // the tallies (top-left) + ecosystem health (top-right)
    }

    if (debug) this.renderMessages(W, H);
    InstallHUD.renderAshFlash(g, W, H);     // white wash over everything
    InstallHUD.renderAshCloud(g, W, H);     // rolling ash cover rides on top of it
    // The eruption caption rides OVER the ash cloud, so an eruption is named while it covers the wall.
    if (!debug) InstallHUD.renderEruptionCaption(g, W, H);
    // The land's chapter, in the same slot, once the clock rests in a new one (after the eruption's, which wins).
    if (!debug && InstallHUD.renderLandCaption) InstallHUD.renderLandCaption(g, W, H);
    _dc.globalAlpha = _a0;

    if (debug) Debug.render(g, W, H);
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
