import Phaser from 'phaser';
import { COLORS, ERASER } from '../config.js';
import { sfx } from '../audio/sfx.js';

// Circle vs axis-aligned rectangle overlap.
function circleHitsRect(cx, cy, r, rc) {
  const nx = Phaser.Math.Clamp(cx, rc.x, rc.x + rc.w);
  const ny = Phaser.Math.Clamp(cy, rc.y, rc.y + rc.h);
  return (cx - nx) ** 2 + (cy - ny) ** 2 <= r * r;
}

/**
 * Hold the left mouse button and drag over an erasable object to rub it out.
 *  - each object has a progress value (0..1) that fills while the cursor overlaps it
 *  - Ink Stability is spent in proportion to progress (cost * delta)
 *  - at 1.0 the object is destroyed: its physics body is removed, so it stops colliding
 *  - ink objects, or anything beyond reach, give "denied" feedback instead
 */
export default class Eraser {
  constructor(scene) {
    this.scene = scene;
    this.radius = ERASER.radius;
    this.reach = ERASER.reach;
    this.items = [];
    this.drawing = false; // true only if the press started inside the play area
    this.cursor = scene.add.graphics().setDepth(60);
    this.lastFx = 0;
    this.lastScratch = 0;
    this.lastDeny = 0;

    scene.input.on('pointerdown', (p) => {
      sfx.unlock();
      this.drawing = p.leftButtonDown() && !scene.isOverUI(p);
    });
    scene.input.on('pointerup', () => { this.drawing = false; });
  }

  register(item) {
    this.items.push({ ...item, progress: 0, alive: true, cx: item.sprite.x, cy: item.sprite.y });
  }

  update(time, delta) {
    const sc = this.scene;
    const p = sc.input.activePointer;
    const overUI = sc.isOverUI(p);
    sc.game.canvas.style.cursor = overUI ? 'default' : 'none';
    this.cursor.clear();
    if (overUI || sc.state !== 'playing') return;

    const { x: wx, y: wy } = p;
    const pl = sc.player.sprite;
    const inReach = Phaser.Math.Distance.Between(pl.x, pl.y, wx, wy) <= this.reach;
    let status = 'idle';

    if (this.drawing && p.isDown) {
      const hits = this.items.filter((it) => it.alive && circleHitsRect(wx, wy, this.radius, it.rect));
      const hitsInk = sc.solidRects.some((rc) => circleHitsRect(wx, wy, this.radius, rc));
      if (hits.length && inReach) {
        status = 'erasing';
        for (const it of hits) {
          if (sc.state !== 'playing') break;
          this.rub(it, delta, wx, wy, time);
        }
      } else if (hits.length || hitsInk) {
        status = 'denied';
        this.deny(time, wx, wy);
      } else {
        status = 'scribble';
      }
    }
    this.drawCursor(wx, wy, status, inReach, time);
  }

  // One frame of rubbing on one object.
  rub(it, delta, wx, wy, time) {
    const sc = this.scene;
    const d = Math.min(1 - it.progress, delta / 1000 / it.eraseTime);
    it.progress += d;
    sc.stability.spend(it.cost * d);

    it.sprite.setAlpha(1 - 0.85 * it.progress).setTint(0xffa595);
    it.sprite.setPosition(it.cx + (Math.random() - 0.5) * 2.4, it.cy + (Math.random() - 0.5) * 2.4);

    if (time - this.lastFx > 55) {
      this.lastFx = time;
      const nx = Phaser.Math.Clamp(wx, it.rect.x, it.rect.x + it.rect.w);
      const ny = Phaser.Math.Clamp(wy, it.rect.y, it.rect.y + it.rect.h);
      sc.inkFx.emitParticleAt(nx, ny, 3);
      sc.dustFx.emitParticleAt(nx, ny, 2);
    }
    if (time - this.lastScratch > 110) {
      this.lastScratch = time;
      sfx.scratch();
    }
    if (it.progress >= 0.999) this.remove(it);
  }

  remove(it) {
    const sc = this.scene;
    it.alive = false;
    it.sprite.body.enable = false; // stop colliding right now
    it.sprite.destroy(); // also removes the body from the physics world and the static group

    const { x, y, w, h } = it.rect;
    for (let i = 0; i < 10; i++) {
      sc.inkFx.emitParticleAt(x + Math.random() * w, y + Math.random() * h, 2);
      sc.dustFx.emitParticleAt(x + Math.random() * w, y + Math.random() * h, 2);
    }
    sc.cameras.main.shake(90, 0.004);
    sfx.pop();

    const label = sc.add.text(x + w / 2, y + h / 2, `-${Math.round(it.cost)}%`, {
      fontFamily: sc.fontFamily, fontSize: '26px', color: '#d8262f', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(70);
    sc.tweens.add({ targets: label, y: label.y - 50, alpha: 0, duration: 900, onComplete: () => label.destroy() });
  }

  deny(time, wx, wy) {
    if (time - this.lastDeny < 200) return;
    this.lastDeny = time;
    sfx.deny();
    this.scene.dustFx.emitParticleAt(wx, wy, 3);
  }

  drawCursor(x, y, status, inReach, time) {
    const g = this.cursor, r = this.radius;
    const denied = status === 'denied';
    const col = denied ? 0x555560 : COLORS.red;
    const shake = denied ? (Math.random() - 0.5) * 3 : 0;
    const cx = x + shake;

    g.fillStyle(col, status === 'erasing' ? 0.3 : 0.1).fillCircle(cx, y, r);
    g.lineStyle(2.5, col, inReach ? 1 : 0.5).strokeCircle(cx, y, r);
    g.lineStyle(1.2, col, 0.4).strokeCircle(cx + 1.2, y - 1, r - 3); // second loose stroke

    if (denied) {
      g.lineStyle(3, col, 1);
      g.lineBetween(cx - 9, y - 9, cx + 9, y + 9);
      g.lineBetween(cx - 9, y + 9, cx + 9, y - 9);
    } else {
      g.fillStyle(col, 0.9).fillCircle(cx, y, 2);
    }

    // too far? show the doodle's reach as a dashed ring
    if (denied && !inReach) {
      const pl = this.scene.player.sprite;
      g.lineStyle(2, COLORS.red, 0.35);
      for (let a = 0; a < Math.PI * 2; a += 0.22) {
        g.beginPath();
        g.arc(pl.x, pl.y, this.reach, a, a + 0.11);
        g.strokePath();
      }
    }
  }
}
