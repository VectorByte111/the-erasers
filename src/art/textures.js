// All artwork is generated in code — no image files, so nothing can 404.
import { GAME_W as W, GAME_H as H, COLORS } from '../config.js';
import { rng, wobbleLine, wobbleCircle } from './sketch.js';

const INK = COLORS.ink;

/** Draw a Graphics object into a texture of exactly w x h. */
export function makeTexture(scene, key, w, h, draw) {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  draw(g);
  g.generateTexture(key, w, h);
  g.destroy();
}

export function ensureTextures(scene) {
  createPaper(scene);
  createDoodle(scene);
  createDoor(scene);
  createDot(scene);
  createVignette(scene);
}

function createPaper(scene) {
  if (scene.textures.exists('paper')) return;
  const t = scene.textures.createCanvas('paper', W, H);
  const c = t.getContext();
  c.fillStyle = '#f4ecd8';
  c.fillRect(0, 0, W, H);

  // soft stains
  for (let i = 0; i < 16; i++) {
    const x = Math.random() * W, y = Math.random() * H, r = 60 + Math.random() * 140;
    const gr = c.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, 'rgba(150,120,70,0.05)');
    gr.addColorStop(1, 'rgba(150,120,70,0)');
    c.fillStyle = gr;
    c.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // paper grain
  for (let i = 0; i < 14000; i++) {
    const dark = Math.random() < 0.55;
    c.fillStyle = `rgba(${dark ? '110,90,60' : '255,255,255'},${0.03 + Math.random() * 0.07})`;
    c.fillRect(Math.random() * W, Math.random() * H, 1 + Math.random() * 1.5, 1 + Math.random() * 1.5);
  }
  // fibres
  c.lineWidth = 1;
  for (let i = 0; i < 160; i++) {
    const x = Math.random() * W, y = Math.random() * H, a = Math.random() * Math.PI;
    c.strokeStyle = `rgba(120,95,60,${0.04 + Math.random() * 0.05})`;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + Math.cos(a) * 10, y + Math.sin(a) * 10);
    c.stroke();
  }
  // notebook rules (aligned so the 380px ground line sits on a rule)
  c.strokeStyle = 'rgba(100,145,200,0.30)';
  for (let y = 20; y < H; y += 36) {
    c.beginPath();
    c.moveTo(0, y + 0.5);
    c.lineTo(W, y + 0.5);
    c.stroke();
  }
  // red margin line
  c.strokeStyle = 'rgba(214,92,92,0.38)';
  c.beginPath();
  c.moveTo(64.5, 0);
  c.lineTo(64.5, H);
  c.stroke();
  // punched holes
  [110, 270, 430].forEach((y) => {
    c.fillStyle = 'rgba(120,100,70,0.22)';
    c.beginPath();
    c.arc(28, y, 9, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = 'rgba(90,70,40,0.25)';
    c.stroke();
  });
  // darker page edges
  const edge = c.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, W * 0.65);
  edge.addColorStop(0, 'rgba(120,90,40,0)');
  edge.addColorStop(1, 'rgba(120,90,40,0.18)');
  c.fillStyle = edge;
  c.fillRect(0, 0, W, H);
  t.refresh();
}

function createDoodle(scene) {
  makeTexture(scene, 'doodle', 28, 36, (g) => {
    const rand = rng(7);
    g.lineStyle(2.4, INK, 1);
    wobbleLine(g, 11, 27, 9, 34, rand, 0.5); // legs
    wobbleLine(g, 17, 27, 19, 34, rand, 0.5);
    wobbleLine(g, 6, 34.5, 10.5, 34.5, rand, 0.4); // feet
    wobbleLine(g, 17.5, 34.5, 22, 34.5, rand, 0.4);
    wobbleCircle(g, 14, 16, 11, rand, { fill: 0xfffaf0, ink: INK, width: 2.4 }); // blob body
    g.fillStyle(INK, 1); // eyes, looking right (sprite is flipped to face left)
    g.fillCircle(12, 15, 1.9);
    g.fillCircle(19, 15, 1.9);
    g.lineStyle(1.8, INK, 1);
    wobbleLine(g, 13, 21, 16, 22.4, rand, 0.3); // mouth
    wobbleLine(g, 13, 5.5, 11, 1.8, rand, 0.3); // hair tuft
    wobbleLine(g, 15, 5.2, 17.5, 1.8, rand, 0.3);
  });
}

function createDoor(scene) {
  makeTexture(scene, 'door', 48, 64, (g) => {
    const rand = rng(21);
    const pts = [[4, 63], [4, 26]];
    for (let i = 1; i < 16; i++) {
      const a = Math.PI + (Math.PI * i) / 16;
      pts.push([24 + Math.cos(a) * 20, 26 + Math.sin(a) * 20]);
    }
    pts.push([44, 26], [44, 63]);
    g.fillStyle(0xfff3cf, 1);
    g.beginPath();
    pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.closePath();
    g.fillPath();
    g.lineStyle(3, INK, 1);
    g.strokePath();
    g.lineStyle(1.4, 0x6b6558, 0.45); // plank lines
    wobbleLine(g, 16, 10, 16, 62, rand, 0.5);
    wobbleLine(g, 32, 10, 32, 62, rand, 0.5);
    g.fillStyle(COLORS.red, 1); // knob
    g.fillCircle(37, 42, 3.4);
    g.lineStyle(1.5, INK, 1);
    g.strokeCircle(37, 42, 3.4);
  });
}

function createDot(scene) {
  makeTexture(scene, 'ink-dot', 8, 8, (g) => {
    g.fillStyle(0xffffff, 1);
    g.fillCircle(4, 4, 3.5);
  });
}

function createVignette(scene) {
  if (scene.textures.exists('vignette')) return;
  const t = scene.textures.createCanvas('vignette', W, H);
  const c = t.getContext();
  const gr = c.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.62);
  gr.addColorStop(0, 'rgba(200,30,40,0)');
  gr.addColorStop(1, 'rgba(200,30,40,0.85)');
  c.fillStyle = gr;
  c.fillRect(0, 0, W, H);
  t.refresh();
}
