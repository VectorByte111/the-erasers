import { GAME_W, GAME_H, HUD_H, COLORS, FONT } from '../config.js';
import { sketchRect, wobbleLine, rng } from '../art/sketch.js';
import { sfx } from '../audio/sfx.js';

export const css = (hex) => '#' + hex.toString(16).padStart(6, '0');

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
  zone.on('pointerup', () => { sfx.click(); onClick(); });
  return { parts: [c], destroy: () => { c.destroy(); zone.destroy(); } };
}

/** In-game top bar: level name, Ink Stability meter, pause + restart buttons, control hints. */
export function createHud(scene, level, { onRestart, onPause }) {
  const D = 80;
  const bar = scene.add.graphics().setDepth(D);
  bar.fillStyle(COLORS.paper, 0.95).fillRect(0, 0, GAME_W, HUD_H);
  bar.lineStyle(2.5, COLORS.ink, 1);
  wobbleLine(bar, 0, HUD_H - 1, GAME_W, HUD_H - 1, rng(3), 1.2);

  scene.add.text(24, HUD_H / 2, level.name, { fontFamily: FONT, fontSize: '20px', color: css(COLORS.ink) })
    .setOrigin(0, 0.5).setDepth(D + 1);

  const MX = 330, MY = 16, MW = 260, MH = 20;
  scene.add.text(MX - 14, HUD_H / 2, 'INK', { fontFamily: FONT, fontSize: '18px', color: css(COLORS.ink), fontStyle: 'bold' })
    .setOrigin(1, 0.5).setDepth(D + 1);
  const frame = scene.add.graphics().setDepth(D + 1);
  sketchRect(frame, MX, MY, MW, MH, { seed: 11, fill: 0xfbf6e6, hatch: false, width: 2.2 });
  const fill = scene.add.graphics().setDepth(D + 1);
  const pct = scene.add.text(MX + MW + 12, HUD_H / 2, '100%', { fontFamily: FONT, fontSize: '20px', color: css(COLORS.ink), fontStyle: 'bold' })
    .setOrigin(0, 0.5).setDepth(D + 1);

  const pause = createButton(scene, 742, HUD_H / 2, 'Pause (Esc)', onPause, { w: 138, h: 34, size: 18, depth: D + 2 });
  const restart = createButton(scene, 884, HUD_H / 2, 'Restart (R)', onRestart, { w: 130, h: 34, size: 18, depth: D + 2 });

  scene.add.text(GAME_W / 2, GAME_H - 14, 'A/D move  ·  Space jump  ·  hold left mouse & drag to erase  ·  R restart  ·  Esc pause', {
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
    destroy() { pause.destroy(); restart.destroy(); },
  };
}

function fadeIn(scene, objs) {
  objs.forEach((o) => o.setAlpha(0));
  scene.tweens.add({ targets: objs, alpha: 1, duration: 200 });
}

/**
 * Centered dim-and-panel overlay with buttons.
 * layout 'row'    : up to 2 wide buttons side by side (level complete / game over)
 * layout 'column' : stacked buttons (pause menu)
 */
export function showPanel(scene, { title, subtitle = '', buttons, titleColor = COLORS.ink, layout = 'row' }) {
  const D = 100;
  const column = layout === 'column';
  const n = buttons.length;
  const btnOffset = column ? (subtitle ? 165 : 125) : 210;
  const panelH = column ? btnOffset + (n - 1) * 54 + 50 : 270;
  const top = GAME_H / 2 - panelH / 2;

  const dim = scene.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x20180a, 0.38).setDepth(D).setInteractive();
  const g = scene.add.graphics().setDepth(D + 1);
  sketchRect(g, GAME_W / 2 - 240, top, 480, panelH, { seed: 5, hatch: false, width: 3.5 });
  const ttl = scene.add.text(GAME_W / 2, top + 58, title, { fontFamily: FONT, fontSize: '40px', color: css(titleColor), fontStyle: 'bold' })
    .setOrigin(0.5).setDepth(D + 2);
  const parts = [g, ttl];
  if (subtitle) {
    parts.push(scene.add.text(GAME_W / 2, top + 120, subtitle, { fontFamily: FONT, fontSize: '20px', color: '#3d3d46', align: 'center' })
      .setOrigin(0.5).setDepth(D + 2));
  }

  const btns = buttons.map((b, i) => {
    const x = column ? GAME_W / 2 : GAME_W / 2 + (i - (n - 1) / 2) * 190;
    const y = column ? top + btnOffset + i * 54 : top + btnOffset;
    return createButton(scene, x, y, b.label, b.onClick, { depth: D + 3, primary: !!b.primary, w: column ? 230 : 170 });
  });
  fadeIn(scene, [...parts, ...btns.flatMap((b) => b.parts)]);
  dim.setAlpha(0);
  scene.tweens.add({ targets: dim, alpha: 1, duration: 200 });

  return { destroy() { dim.destroy(); parts.forEach((o) => o.destroy()); btns.forEach((b) => b.destroy()); } };
}

/** How to Play screen. onClose is called by the "Got it" button. */
export function showHowTo(scene, { onClose }) {
  const D = 110;
  const W = 640, H = 470, top = (GAME_H - H) / 2, left = GAME_W / 2 - W / 2;
  const dim = scene.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x20180a, 0.45).setDepth(D).setInteractive();
  const g = scene.add.graphics().setDepth(D + 1);
  sketchRect(g, left, top, W, H, { seed: 8, hatch: false, width: 3.5 });
  const parts = [g];

  parts.push(scene.add.text(GAME_W / 2, top + 38, 'How to Play', { fontFamily: FONT, fontSize: '38px', color: css(COLORS.ink), fontStyle: 'bold' })
    .setOrigin(0.5).setDepth(D + 2));

  const rows = [
    ['A / D   or   ← →', 'move'],
    ['Space / W / ↑', 'jump'],
    ['Hold left mouse + drag', 'erase pencil'],
    ['R', 'restart the level'],
    ['Esc', 'pause / resume'],
  ];
  rows.forEach(([key, what], i) => {
    const y = top + 92 + i * 34;
    parts.push(scene.add.text(left + 40, y, key, { fontFamily: FONT, fontSize: '20px', color: css(COLORS.red), fontStyle: 'bold' }).setOrigin(0, 0.5).setDepth(D + 2));
    parts.push(scene.add.text(left + W - 40, y, what, { fontFamily: FONT, fontSize: '20px', color: css(COLORS.ink) }).setOrigin(1, 0.5).setDepth(D + 2));
  });

  const divider = scene.add.graphics().setDepth(D + 2);
  divider.lineStyle(2, COLORS.pencil, 0.6);
  wobbleLine(divider, left + 40, top + 274, left + W - 40, top + 274, rng(2), 1);
  parts.push(divider);

  const rules = [
    'Pencil sketches can be erased — black ink cannot.',
    'Erasing spends Ink Stability. At 0% the page falls apart.',
    'Erase a support and whatever rests on it will fall.',
    'A box on the plate unlocks the door. Spikes send you back.',
  ];
  parts.push(scene.add.text(GAME_W / 2, top + 292, rules.join('\n'), {
    fontFamily: FONT, fontSize: '18px', color: '#3d3d46', align: 'center', lineSpacing: 7,
  }).setOrigin(0.5, 0).setDepth(D + 2));

  const ok = createButton(scene, GAME_W / 2, top + H - 38, 'Got it', onClose, { depth: D + 3, primary: true, h: 40 });
  fadeIn(scene, [...parts, ...ok.parts]);
  dim.setAlpha(0);
  scene.tweens.add({ targets: dim, alpha: 1, duration: 200 });

  return { destroy() { dim.destroy(); parts.forEach((o) => o.destroy()); ok.destroy(); } };
}
