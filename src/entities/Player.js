import Phaser from 'phaser';
import { PHYSICS } from '../config.js';
import { sfx } from '../audio/sfx.js';

const approach = (v, target, step) => (v < target ? Math.min(v + step, target) : Math.max(v - step, target));

/**
 * The doodle. Handles input, acceleration, and a forgiving jump:
 *  - coyote time: you can still jump a moment after walking off a ledge
 *  - jump buffer: pressing jump slightly before landing still counts
 *  - variable height: release jump early for a shorter hop
 * Jump consumes both timers, so you can never jump while airborne.
 */
export default class Player {
  constructor(scene, x, y) {
    this.scene = scene;
    this.sprite = scene.physics.add.sprite(x, y, 'doodle').setDepth(10);
    const body = this.sprite.body;
    body.setSize(18, 30).setOffset(5, 6); // tighter than the art, feels fairer
    body.setMaxVelocity(400, 900);
    this.sprite.setCollideWorldBounds(true);

    this.keys = scene.input.keyboard.addKeys({
      a: 'A', d: 'D', left: 'LEFT', right: 'RIGHT', w: 'W', up: 'UP', space: 'SPACE',
    });
    this.lastGrounded = -Infinity;
    this.jumpPressedAt = -Infinity;
    this.cutJump = false;
  }

  get grounded() {
    const b = this.sprite.body;
    return b.blocked.down || b.touching.down;
  }

  update(time, delta) {
    const k = this.keys, b = this.sprite.body, dt = delta / 1000;
    const grounded = this.grounded;
    if (grounded) { this.lastGrounded = time; this.cutJump = false; }

    // horizontal movement
    const dir = (k.a.isDown || k.left.isDown ? -1 : 0) + (k.d.isDown || k.right.isDown ? 1 : 0);
    let vx = b.velocity.x;
    if (dir !== 0) {
      vx = approach(vx, dir * PHYSICS.moveSpeed, (grounded ? PHYSICS.groundAccel : PHYSICS.airAccel) * dt);
      this.sprite.setFlipX(dir < 0);
    } else {
      vx = approach(vx, 0, (grounded ? PHYSICS.groundFriction : PHYSICS.airFriction) * dt);
    }
    b.setVelocityX(vx);
    this.sprite.setRotation((vx / PHYSICS.moveSpeed) * 0.09); // lean into the run

    // jumping
    const jd = Phaser.Input.Keyboard.JustDown;
    if (jd(k.space) || jd(k.w) || jd(k.up)) this.jumpPressedAt = time;
    const wantsJump = time - this.jumpPressedAt <= PHYSICS.bufferMs;
    const canJump = time - this.lastGrounded <= PHYSICS.coyoteMs;
    if (wantsJump && canJump) {
      b.setVelocityY(PHYSICS.jumpVelocity);
      this.lastGrounded = -Infinity;
      this.jumpPressedAt = -Infinity;
      this.cutJump = false;
      sfx.jump();
    }
    const held = k.space.isDown || k.w.isDown || k.up.isDown;
    if (!held && !this.cutJump && b.velocity.y < -170) {
      b.setVelocityY(b.velocity.y * 0.5); // short hop
      this.cutJump = true;
    }
  }

  respawn(x, y) {
    this.sprite.body.reset(x, y);
    this.lastGrounded = -Infinity;
  }
}
