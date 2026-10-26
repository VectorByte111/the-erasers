// Hand-drawn line helpers. Everything is drawn with jittered polylines,
// using a seeded RNG so a given shape always looks the same.
import { COLORS } from '../config.js';

export function rng(seed = 1) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A slightly shaky line between two points. Set g.lineStyle() before calling. */
export function wobbleLine(g, x1, y1, x2, y2, rand, jitter = 1.2) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  const n = Math.max(2, Math.ceil(len / 18));
  g.beginPath();
  g.moveTo(x1 + (rand() - 0.5) * jitter, y1 + (rand() - 0.5) * jitter);
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    g.lineTo(
      x1 + (x2 - x1) * t + (rand() - 0.5) * jitter * 2,
      y1 + (y2 - y1) * t + (rand() - 0.5) * jitter * 2
    );
  }
  g.strokePath();
}

function poly(g, pts, close, fill) {
  g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  if (close) g.closePath();
  if (fill) g.fillPath();
  else g.strokePath();
}

/** Wobbly circle, optionally filled, drawn with two loose passes. */
export function wobbleCircle(g, cx, cy, r, rand, { fill = null, ink = COLORS.ink, width = 2.2, passes = 2, jitter = 0.7 } = {}) {
  const n = Math.max(16, Math.round(r * 2.2));
  const ring = (turns) => {
    const a0 = rand() * Math.PI * 2;
    const pts = [];
    const steps = Math.round(n * turns);
    for (let i = 0; i <= steps; i++) {
      const a = a0 + (i / n) * Math.PI * 2;
      const rr = r + (rand() - 0.5) * jitter * 2;
      pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
    }
    return pts;
  };
  if (fill !== null) {
    g.fillStyle(fill, 1);
    poly(g, ring(1), true, true);
  }
  for (let k = 0; k < passes; k++) {
    g.lineStyle(k ? width * 0.55 : width, ink, k ? 0.6 : 1);
    poly(g, ring(k ? 1.05 : 1.08), false, false);
  }
}

/**
 * A sketched rectangle: paper fill, light hatching, double-stroked wobbly outline.
 * The outline sits ~1.5px inside the box so the physics body matches what you see.
 */
export function sketchRect(g, x, y, w, h, { seed = 1, fill = COLORS.paper, ink = COLORS.ink, width = 3, hatch = true, hatchColor = 0x6b6558, hatchAlpha = 0.3, hatchGap = 11, jitter = 1 } = {}) {
  const rand = rng(seed);
  g.fillStyle(fill, 1);
  g.fillRect(x, y, w, h);

  if (hatch) {
    g.lineStyle(1.2, hatchColor, hatchAlpha);
    for (let k = -h; k < w; k += hatchGap) {
      let ax = x + k, ay = y + h, bx = x + k + h, by = y;
      if (ax < x) { ay -= x - ax; ax = x; }
      if (bx > x + w) { by += bx - (x + w); bx = x + w; }
      if (ax >= bx) continue;
      wobbleLine(g, ax, ay, bx, by, rand, 0.6);
    }
  }

  const i = 1.5;
  const l = x + i, r = x + w - i, t = y + i, b = y + h - i;
  for (let pass = 0; pass < 2; pass++) {
    g.lineStyle(pass ? width * 0.5 : width, ink, pass ? 0.65 : 1);
    const o = pass ? 1.2 : 0; // second pass overshoots a little, like a real sketch
    wobbleLine(g, l - o, t, r + o, t, rand, jitter);
    wobbleLine(g, r, t - o, r, b + o, rand, jitter);
    wobbleLine(g, r + o, b, l - o, b, rand, jitter);
    wobbleLine(g, l, b + o, l, t - o, rand, jitter);
  }
}
