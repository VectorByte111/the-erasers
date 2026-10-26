# THE ERASER

> *Erase the world. Rewrite your fate.*

A hand-drawn 2D puzzle-platformer that runs in the browser. You are a tiny unfinished doodle trapped in a sketchbook. With a magical red eraser you can rub out parts of the page — walls, platforms, supports — to open paths and make things fall. But every stroke costs **Ink Stability**, and if it hits zero the page falls apart.

Built with **Phaser 3** (Arcade Physics), **Vite** and plain JavaScript. No backend, no React, no image files — all artwork and sound are generated in code.

---

## Status

| Day | Scope | State |
|---|---|---|
| 1–2 | Project setup, player, eraser, ink stability, prototype level | Done |
| 3 | Box, pressure plate, locked door, spikes, Levels 2 and 3 as data | Done |
| 4 | Start screen, pause menu, How to Play, level-complete / final screens | Planned |
| 5–8 | Art pass, juice, balancing, save data, full playtest, deploy | Planned |

Currently the game boots straight into Level 1 (no title screen yet). Three levels are playable.

---

## Quick start

Requires Node.js 18+.

```bash
npm install
npm run dev        # dev server, http://localhost:5173
npm run build      # production build into dist/
npm run preview    # serve the built dist/ locally
```

`vite.config.js` uses `base: './'`, so the contents of `dist/` can be dropped onto any static host (GitHub Pages, Netlify, Vercel, itch.io).

---

## Controls

| Action | Input |
|---|---|
| Move | `A` / `D` or `←` / `→` |
| Jump | `Space`, `W` or `↑` |
| Erase | Hold **left mouse button** and drag over pencil objects |
| Restart level | `R` or the Restart button |
| Jump to level (testing) | `1`, `2`, `3` |

Pause (`Esc`) arrives with the menus on Day 4.

---

## How it plays

**Ink vs. pencil.** Solid black-ink shapes are permanent. Lighter, hatched *pencil* shapes can be erased.

**Erasing.** Each erasable object has a progress value. While the eraser circle overlaps it, progress fills and the object fades; at 100% it is destroyed and its physics body is removed, so it stops colliding immediately. Anything resting on it falls.

**Reach.** You can only erase within 340 px of the doodle. Erasing ink, or anything out of reach, is *denied*: grey cursor with an X, a dull sound and (for out-of-reach) a dashed ring showing your range.

**Ink Stability.** Every level starts at 100%. Erasing spends it in proportion to progress, using each object's `cost`. Warnings escalate:

| Stability | Effect |
|---|---|
| above 60% | calm |
| 30–60% | orange meter, faint red vignette, light shake |
| below 30% | red meter, pulsing vignette, stronger shake (blinks under 15%) |
| 0% | game over |

Each level's total erasable cost is deliberately above 100, so you can run out of ink — you must plan, not just erase everything.

**Boxes and plates.** Boxes are pushable physics bodies. A pressure plate is pressed while a box sits on it (the doodle is too light). A `locked` exit stays greyed out until every plate in the level is pressed.

**Spikes.** Touching spikes, or falling off the page, sends you back to the spawn point. Anything you erased stays erased until you press `R`.

### Levels

| # | Name | Teaches | Ink needed |
|---|---|---|---|
| 1 | First Strokes | Moving, jumping, erasing a wall, erasing the floor to drop to the door | 65% |
| 2 | Support Act | Erase a box's support so it falls on a plate, unlocking the door | 60% |
| 3 | Ink Budget | Spikes, stepping stones, a high box on a shelf, a blocking wall, tight ink | 75% |

---

## Project structure

```
src/
  main.js                 Phaser game config and boot
  config.js               All tunable numbers (physics, eraser, colours, font)
  style.css               Page styling around the canvas
  levels/levels.js        Level data — add levels here
  scenes/GameScene.js     Builds a level, runs the game loop, win/lose, restart
  entities/Player.js      Movement, coyote time, jump buffer, variable jump height
  systems/Eraser.js       Cursor, rubbing, progress, denied feedback, removal
  systems/Stability.js    Ink Stability meter and danger levels
  ui/ui.js                HUD, sketchy buttons, win/lose panels
  art/sketch.js           Wobbly-line helpers (sketchRect, wobbleCircle, ...)
  art/textures.js         Paper, doodle, door, particle and vignette textures
  audio/sfx.js            Synthesized WebAudio sound effects
```

---

## Adding a level

Levels are plain objects appended to the array in `src/levels/levels.js`. The world is 960 × 540; positions are top-left `(x, y)` with size `(w, h)`.

```js
{
  name: 'Level 4 · Your Title',
  spawn: { x: 50, y: 330 },
  stability: 100,
  platforms: [{ x: 0, y: 380, w: 300, h: 160 }],          // permanent ink
  erasables: [{ id: 'wall', x: 300, y: 200, w: 40, h: 180,
                cost: 35, eraseTime: 1.0 }],               // pencil
  boxes:     [{ x: 100, y: 336, w: 44, h: 44 }],           // optional
  switches:  [{ x: 400, y: 472, w: 60 }],                  // optional; y = plate top
  spikes:    [{ x: 500, y: 480, w: 90 }],                  // optional; y = floor line
  exit:      { x: 880, y: 380, locked: true },             // x = centre, y = floor
  hints:     [{ x: 200, y: 150, text: 'hello', angle: -3, color: '#d8262f' }],
}
```

- `cost` is the % of stability spent for a full erase. If omitted it is derived from the object's area.
- `eraseTime` is seconds of scribbling for a full erase (default 1).
- Level-complete shows **Next level** automatically when another level exists.

### Design rules of thumb

- Jump height is about **112 px**, and about **190 px** across a flat gap. Keep pits shallower than ~100 px so the player can always climb out.
- Keep total erasable cost above the stability budget so players can fail; keep the cost *needed to win* comfortably below it.
- Leave at least ~15 px of headroom under ceilings above jump paths.
- Always assume the player can press `R`; avoid states that need more than a restart to escape.

---

## Tuning

Everything that affects feel is in `src/config.js`:

- `PHYSICS`: gravity, move speed, acceleration, jump velocity, coyote time (100 ms), jump buffer (110 ms), fall-death height.
- `ERASER`: cursor radius (30 px) and reach (340 px).
- `COLORS` and `FONT`: the paper-and-ink palette and handwriting font stack.

---

## Technical notes

- **Physics:** Arcade Physics. Solids and erasables share one static group; destroying an erasable's sprite removes its body. Boxes are dynamic bodies with high horizontal drag so they feel heavy.
- **Art:** Platforms, the doodle, door, spikes, boxes and paper are drawn procedurally with seeded jitter, so every shape looks hand-drawn but is identical on every restart. Textures are cached by key.
- **Audio:** Sound is synthesized with WebAudio; browsers start it on the first click or key press.
- **Fonts:** Uses a system handwriting stack (`Segoe Print`, `Bradley Hand`, `Comic Sans MS`...), so the look varies by OS.

---

## Known gaps / roadmap

- Title screen, How to Play, pause menu, and the final completion screen (Day 4).
- Best time and best remaining ink saved to `localStorage` (Day 7).
- Art polish, more particles, and bundled handwriting font (Day 5–6).
- Possible later: respawn for a box that leaves the page, more levels, gamepad or touch support.

---

