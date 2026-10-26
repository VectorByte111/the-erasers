import { GAME_W, GAME_H, HUD_H, COLORS, FONT } from '../config.js';
import { sketchRect, wobbleLine, rng } from '../art/sketch.js';

const css = (hex) => '#' + hex.toString(16).padStart(6, '0');

/** A sketchy clickable button. Returns { parts, destroy }. */
export function createButton(scene, x, y, label, onClick, { w = 170, h = 44, size = 22, depth = 90, primary = false } = {}) {
  const c = scene.add.container(x, y).setDepth(depth);
  const g = scene.add.graphics();
  sketchRect(g, -w / 2, -h / 2, w, h, {
    seed: Math.round(x + y), fill: primary ? 0xf6d9d4 : COLORS.paper, hatch: false, width: 2.6,
  });
  const t = scene.add.text(0, 0, label, { fontFamily: FONT, fontSize: `${size}px`, color: css(COLORS.ink) }).setOrigin(0.5);
  c.add([g, t]);

  const zone = scene.add.zone(x, y, w, h).setDepth(depth).setInteractive({ useHandCursor: true });
  zone.on('pointerover', () => scene.tweens.add({ targets: c, scale: 1.06, duration: 90 }));
  zone.on('pointerout', () => scene.tweens.add({ targets: c, scale: 1, duration: 90 }));
  zone.on('pointerup', onClick);
  return { parts: [c], destroy: () => { c.destroy(); zone.destroy(); } };
}

/** In-game top bar: level name, Ink Stability meter, restart button, control hints. */
export function createHud(scene, level, onRestart) {
  const D = 80;
  const bar = scene.add.graphics().setDepth(D);
  bar.fillStyle(COLORS.paper, 0.95).fillRect(0, 0, GAME_W, HUD_H);
  bar.lineStyle(2.5, COLORS.ink, 1);
  wobbleLine(bar, 0, HUD_H - 1, GAME_W, HUD_H - 1, rng(3), 1.2);

  scene.add.text(24, HUD_H / 2, level.name, { fontFamily: FONT, fontSize: '20px', color: css(COLORS.ink) })
    .setOrigin(0, 0.5).setDepth(D + 1);
  scene.add.text(372, HUD_H / 2, 'INK', { fontFamily: FONT, fontSize: '18px', color: css(COLORS.ink), fontStyle: 'bold' })
    .setOrigin(1, 0.5).setDepth(D + 1);

  const MX = 386, MY = 16, MW = 260, MH = 20;
  const frame = scene.add.graphics().setDepth(D + 1);
  sketchRect(frame, MX, MY, MW, MH, { seed: 11, fill: 0xfbf6e6, hatch: false, width: 2.2 });
  const fill = scene.add.graphics().setDepth(D + 1);
  const pct = scene.add.text(MX + MW + 14, HUD_H / 2, '100%', { fontFamily: FONT, fontSize: '20px', color: css(COLORS.ink), fontStyle: 'bold' })
    .setOrigin(0, 0.5).setDepth(D + 1);

  const restart = createButton(scene, GAME_W - 92, HUD_H / 2, 'Restart (R)', onRestart, { w: 150, h: 34, size: 18, depth: D + 2 });

  scene.add.text(GAME_W / 2, GAME_H - 14, 'A/D move  ·  Space jump  ·  hold left mouse & drag to erase  ·  R restart', {
    fontFamily: FONT, fontSize: '15px', color: '#5b6070',
  }).setOrigin(0.5).setDepth(D);

  return {
    update(stability, time) {
      const r = stability.ratio;
      const col = stability.danger === 0 ? COLORS.ink : stability.danger === 1 ? COLORS.warn : COLORS.red;
      const blink = stability.danger === 2 && r < 0.15 ? 0.6 + 0.4 * Math.sin(time / 90) : 1;
      fill.clear().fillStyle(col, blink).fillRect(MX + 3, MY + 3, (MW - 6) * r, MH - 6);
      pct.setText(`${Math.ceil(stability.value)}%`).setColor(css(col));
    },
    destroy() { restart.destroy(); },
  };
}

/** Centered dim-and-panel overlay with buttons (level complete / game over). */
export function showPanel(scene, { title, subtitle, buttons, titleColor = COLORS.ink }) {
  const D = 100;
  const parts = [];
  const dim = scene.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x20180a, 0.38).setDepth(D).setInteractive();
  const g = scene.add.graphics().setDepth(D + 1);
  sketchRect(g, GAME_W / 2 - 240, GAME_H / 2 - 135, 480, 270, { seed: 5, hatch: false, width: 3.5 });
  const ttl = scene.add.text(GAME_W / 2, GAME_H / 2 - 70, title, { fontFamily: FONT, fontSize: '40px', color: css(titleColor), fontStyle: 'bold' })
    .setOrigin(0.5).setDepth(D + 2);
  const sub = scene.add.text(GAME_W / 2, GAME_H / 2 - 12, subtitle, { fontFamily: FONT, fontSize: '20px', color: '#3d3d46', align: 'center' })
    .setOrigin(0.5).setDepth(D + 2);
  parts.push(dim, g, ttl, sub);

  const btns = buttons.map((b, i) => {
    const x = GAME_W / 2 + (i - (buttons.length - 1) / 2) * 190;
    return createButton(scene, x, GAME_H / 2 + 75, b.label, b.onClick, { depth: D + 3, primary: !!b.primary });
  });
  const all = [...parts, ...btns.flatMap((b) => b.parts)];
  all.forEach((o) => o.setAlpha(0));
  scene.tweens.add({ targets: all, alpha: 1, duration: 220 });
  dim.setAlpha(0);
  scene.tweens.add({ targets: dim, alpha: 1, duration: 220 });

  return { destroy() { parts.forEach((o) => o.destroy()); btns.forEach((b) => b.destroy()); } };
}
