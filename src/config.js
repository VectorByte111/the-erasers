// Central place for tunable numbers. Tweak feel here, not inside gameplay code.
export const GAME_W = 960;
export const GAME_H = 540;
export const HUD_H = 52; // top bar height: the eraser is disabled inside it

export const COLORS = {
  paper: 0xf4ecd8,
  paperDark: 0xe6dcc0,
  ink: 0x1d1d24,
  pencil: 0x5b6070,
  red: 0xd8262f,
  warn: 0xc9731d,
};

export const FONT = '"Segoe Print","Bradley Hand","Chalkboard SE","Comic Sans MS",cursive';

export const PHYSICS = {
  gravity: 1300,
  moveSpeed: 230,
  groundAccel: 2400,
  airAccel: 1500,
  groundFriction: 2800,
  airFriction: 700,
  jumpVelocity: -540, // ~112px jump height with gravity 1300
  coyoteMs: 100, // can still jump this long after leaving a ledge
  bufferMs: 110, // jump pressed slightly early still counts
  fallDeathY: 620,
};

export const ERASER = {
  radius: 30, // cursor radius in px
  reach: 340, // max distance from the doodle that you can erase
};
