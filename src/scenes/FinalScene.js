import Phaser from 'phaser';
import { GAME_W, GAME_H, COLORS, FONT } from '../config.js';
import { LEVELS } from '../levels/levels.js';
import { ensureTextures } from '../art/textures.js';
import { sketchRect } from '../art/sketch.js';
import { createButton, css } from '../ui/ui.js';
import { sfx } from '../audio/sfx.js';
import Run from '../systems/Run.js';

export default class FinalScene extends Phaser.Scene {
  constructor() {
    super('Final');
  }

  create() {
    ensureTextures(this);
    this.game.canvas.style.cursor = 'default';
    this.add.image(0, 0, 'paper').setOrigin(0).setDepth(-10);
    sfx.win();

    this.add.text(GAME_W / 2, 78, 'You rewrote your fate!', {
      fontFamily: FONT, fontSize: '54px', fontStyle: 'bold', color: css(COLORS.ink),
    }).setOrigin(0.5);
    this.add.text(GAME_W / 2, 128, 'The page is yours now.', { fontFamily: FONT, fontSize: '24px', color: '#5b6070' }).setOrigin(0.5);

    // two doodles celebrating
    [[150, false], [GAME_W - 150, true]].forEach(([x, flip], i) => {
      const d = this.add.image(x, 110, 'doodle').setScale(2.4).setFlipX(flip);
      this.tweens.add({ targets: d, y: 86, yoyo: true, repeat: -1, duration: 420, ease: 'Sine.Out', delay: i * 210 });
    });

    // stats card
    const g = this.add.graphics();
    sketchRect(g, GAME_W / 2 - 290, 168, 580, 220, { seed: 12, hatch: false, width: 3.5 });
    let totalSecs = 0, totalOops = 0, played = 0;
    LEVELS.forEach((lv, i) => {
      const r = Run.levels[i];
      const y = 205 + i * 36;
      this.add.text(GAME_W / 2 - 262, y, lv.name, { fontFamily: FONT, fontSize: '20px', color: css(COLORS.ink) }).setOrigin(0, 0.5);
      const stats = r ? `${r.secs.toFixed(1)}s  ·  ink ${r.ink}%  ·  ${r.deaths} oops` : '—';
      this.add.text(GAME_W / 2 + 262, y, stats, { fontFamily: FONT, fontSize: '19px', color: '#3d3d46' }).setOrigin(1, 0.5);
      if (r) { totalSecs += r.secs; totalOops += r.deaths; played++; }
    });
    this.add.text(GAME_W / 2, 205 + LEVELS.length * 36 + 18, played ? `Total  ${totalSecs.toFixed(1)}s  ·  ${totalOops} oops` : 'Thanks for playing!', {
      fontFamily: FONT, fontSize: '26px', fontStyle: 'bold', color: css(COLORS.red),
    }).setOrigin(0.5);

    createButton(this, GAME_W / 2 - 110, 450, 'Play again', () => { Run.reset(); this.scene.start('Game', { level: 0 }); }, { w: 190, h: 52, size: 24, primary: true });
    createButton(this, GAME_W / 2 + 110, 450, 'Main menu', () => this.scene.start('Menu'), { w: 190, h: 52, size: 24 });

    // paper confetti
    const dust = this.add.particles(0, 0, 'ink-dot', {
      x: { min: 0, max: GAME_W }, y: -10, speedY: { min: 40, max: 110 }, speedX: { min: -20, max: 20 },
      lifespan: 6000, scale: { start: 1.1, end: 0.8 }, alpha: { start: 0.9, end: 0.2 }, frequency: 120,
      tint: [COLORS.red, 0x1d1d24, 0xc9731d, 0x5b6070],
    }).setDepth(-5);
    dust.setActive(true);
  }
}
