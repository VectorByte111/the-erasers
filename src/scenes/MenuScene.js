import Phaser from 'phaser';
import { GAME_W, GAME_H, COLORS, FONT } from '../config.js';
import { ensureTextures } from '../art/textures.js';
import { wobbleLine, rng } from '../art/sketch.js';
import { createButton, showHowTo, css } from '../ui/ui.js';
import { sfx } from '../audio/sfx.js';
import Run from '../systems/Run.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    ensureTextures(this);
    this.game.canvas.style.cursor = 'default';
    this.howto = null;
    this.add.image(0, 0, 'paper').setOrigin(0).setDepth(-10);

    const title = this.add.text(GAME_W / 2, 140, 'THE ERASER', {
      fontFamily: FONT, fontSize: '96px', fontStyle: 'bold', color: css(COLORS.ink),
    }).setOrigin(0.5);
    this.tweens.add({ targets: title, y: title.y + 6, angle: 1, yoyo: true, repeat: -1, duration: 1900, ease: 'Sine.InOut' });

    const line = this.add.graphics();
    line.lineStyle(5, COLORS.red, 1);
    wobbleLine(line, 240, 204, 720, 204, rng(4), 1.6);
    line.lineStyle(2.5, COLORS.red, 0.6);
    wobbleLine(line, 260, 211, 700, 210, rng(9), 1.6);

    this.add.text(GAME_W / 2, 242, 'Erase the world. Rewrite your fate.', {
      fontFamily: FONT, fontSize: '26px', color: '#5b6070',
    }).setOrigin(0.5);

    createButton(this, GAME_W / 2, 320, 'Play', () => this.play(), { w: 250, h: 58, size: 32, primary: true });
    createButton(this, GAME_W / 2, 392, 'How to Play', () => this.openHowTo(), { w: 250, h: 50, size: 24 });

    this.buildEraserSweep();

    this.input.keyboard.on('keydown-ENTER', () => !this.howto && this.play());
    this.input.keyboard.on('keydown-SPACE', () => !this.howto && this.play());
    this.input.keyboard.on('keydown-ESC', () => this.howto && this.closeHowTo());
    this.input.on('pointerdown', () => sfx.unlock());
  }

  play() {
    sfx.unlock();
    Run.reset();
    this.scene.start('Game', { level: 0 });
  }

  openHowTo() {
    if (!this.howto) this.howto = showHowTo(this, { onClose: () => this.closeHowTo() });
  }

  closeHowTo() {
    this.howto?.destroy();
    this.howto = null;
  }

  // Background animation: a red eraser rubs out two rows of pencil squiggles, then they draw themselves back.
  buildEraserSweep() {
    const rows = [462, 480];
    const rand = rng(77);
    const x0 = 130, x1 = 830, step = 28;
    const segs = [];
    rows.forEach((y) => {
      for (let x = x0; x < x1; x += step) {
        const g = this.add.graphics().setDepth(4);
        g.lineStyle(2.2, COLORS.pencil, 0.8);
        g.beginPath();
        g.moveTo(x, y);
        for (let k = 1; k <= 4; k++) g.lineTo(x + k * 7, y + (k % 2 ? -1 : 1) * (3 + rand() * 4));
        g.strokePath();
        segs.push({ g, x });
      }
    });

    const eraser = this.add.image(x0 - 30, 471, 'eraser-big').setDepth(6).setAngle(-6).setAlpha(0);
    const dust = this.add.particles(0, 0, 'ink-dot', {
      speed: { min: 15, max: 60 }, angle: { min: 180, max: 360 }, gravityY: 40,
      lifespan: { min: 400, max: 800 }, scale: { start: 0.9, end: 0.2 }, alpha: { start: 0.7, end: 0 },
      tint: 0xcbb98f, emitting: false,
    }).setDepth(5);

    const sweep = () => {
      segs.forEach((s) => s.g.setAlpha(1));
      eraser.setAlpha(1);
      this.tweens.addCounter({
        from: 0, to: 1, duration: 3200, ease: 'Sine.InOut',
        onUpdate: (tw) => {
          const ex = x0 - 30 + tw.getValue() * (x1 - x0 + 60);
          eraser.setX(ex);
          segs.forEach((s) => { if (s.x + step < ex + 6) s.g.setAlpha(0); });
          dust.emitParticleAt(ex - 24, 476, 1);
        },
        onComplete: () => {
          this.tweens.add({ targets: eraser, alpha: 0, duration: 300 });
          this.tweens.add({ targets: segs.map((s) => s.g), alpha: 1, duration: 700, delay: 500 });
          this.time.delayedCall(1800, sweep);
        },
      });
    };
    sweep();
  }
}
