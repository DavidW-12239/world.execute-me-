// Act 2 · 0:21–1:14 — the desktop she lives on, the maths chorus, verse 2, pre-chorus 1.
import { W, H, C, beat, clamp, lerp, inv, E, hash, hash2, rng, onTwos, pulse, canvas, sparkle, focusLines, windowFrame, halftone, stripes, tinted } from './lib.js';
import { mono } from './type.js';
import { getA, drawCut, layer, moon, stars, bgGrid, scanBars, vText, arrow, keyVisual, sticker } from './shots.js';
import {
  RED, TEAL, crisp, blit, sprite, icon, PROGRAMS, deskIcon, wallpaper, menubar, appWindow, button, progress,
  stamp, zhTag, path, click, roomScene,
} from './kit.js';
import { LYRICS } from './lyrics.js';
import { pose, face, avatar } from './cast.js';

const L = en => LYRICS.find(l => l.en === en && l.t0 > 20);
const zhOf = (en, after = 20) => LYRICS.find(l => l.en === en && l.t0 > after).zh;

// ---------------------------------------------------------------------------
// Desktop layout shared by several scenes: six programs + me.exe down the right side.
export const ICONS = [...PROGRAMS.map(p => ({ key: p.key, label: p.name })), { key: 'MEW', label: '恬豆发芽了.exe' }];
export const iconPos = i => [1790, 120 + i * 128];

// Little app contents so each program reads at a glance.
export const APP = {
  EIN(ctx, b, t) {                      // browser
    ctx.fillStyle = '#161a4a'; ctx.fillRect(b.x, b.y, b.w, 40); ctx.fillStyle = C.paper; ctx.fillRect(b.x + 12, b.y + 8, b.w - 24, 24);
    mono(ctx, 'http://world.net/news', b.x + 22, b.y + 27, 17, { color: C.navy, weight: 700 });
    ctx.fillStyle = C.cobalt; ctx.fillRect(b.x + 20, b.y + 60, b.w * 0.42, b.h * 0.42);
    for (let i = 0; i < 9; i++) { ctx.fillStyle = i === 0 ? C.paper : '#3a3f78'; ctx.fillRect(b.x + b.w * 0.48, b.y + 64 + i * 26, (b.w * 0.46) * (0.5 + 0.5 * hash(i)), 12); }
  },
  DOS(ctx, b, t) {                      // music player
    mono(ctx, '♪ now playing', b.x + 24, b.y + 40, 22, { color: C.ice, weight: 700 });
    for (let i = 0; i < 18; i++) { const v = 0.2 + 0.8 * Math.abs(Math.sin(onTwos(t) * 7 + i * 1.3)) * (0.5 + 0.5 * hash(i)); ctx.fillStyle = i % 3 ? C.violet : C.lilac; ctx.fillRect(b.x + 24 + i * ((b.w - 48) / 18), b.y + b.h - 30 - v * (b.h - 110), (b.w - 48) / 18 - 5, v * (b.h - 110)); }
  },
  TROIS(ctx, b, t) {                    // brick game
    ctx.fillStyle = C.ink; ctx.fillRect(b.x, b.y, b.w, b.h);
    for (let j = 0; j < 4; j++) for (let i = 0; i < 8; i++) if (hash2(i, j) > 0.2) { ctx.fillStyle = [C.red, C.violet, C.cobalt, TEAL][j]; ctx.fillRect(b.x + 16 + i * ((b.w - 32) / 8), b.y + 20 + j * 22, (b.w - 32) / 8 - 5, 16); }
    const bx = b.x + b.w / 2 + Math.sin(t * 3) * b.w * 0.35, by = b.y + b.h * 0.6 + Math.cos(t * 4.2) * b.h * 0.2;
    ctx.fillStyle = C.paper; ctx.fillRect(bx, by, 10, 10); ctx.fillRect(bx - 50, b.y + b.h - 26, 110, 10);
  },
  NE(ctx, b) {                          // mail
    for (let i = 0; i < 6; i++) { ctx.fillStyle = i === 0 ? C.cobalt : (i % 2 ? '#141848' : '#10133c'); ctx.fillRect(b.x, b.y + i * 44, b.w, 44); mono(ctx, ['✉ you: re: tomorrow', '✉ bank: statement', '✉ friend: movie?', '✉ work: deadline', '✉ shop: 20% off', '✉ you: ...'][i], b.x + 18, b.y + 29 + i * 44, 19, { color: C.paper, weight: i ? 400 : 700 }); }
  },
  FEM(ctx, b, t) {                      // chat
    [['hey', 0], ['are you there?', 1], ['lol', 0], ['brb', 1]].forEach(([s, r], i) => { const w = s.length * 14 + 40; ctx.fillStyle = r ? C.ice : '#262b6a'; ctx.fillRect(r ? b.x + b.w - w - 20 : b.x + 20, b.y + 24 + i * 56, w, 40); mono(ctx, s, (r ? b.x + b.w - w - 20 : b.x + 20) + 18, b.y + 51 + i * 56, 20, { color: r ? C.ink : C.paper }); });
  },
  LIU(ctx, b, t) {                      // paint
    ctx.fillStyle = C.paper; ctx.fillRect(b.x, b.y, b.w, b.h); ctx.strokeStyle = C.cobalt; ctx.lineWidth = 8; ctx.lineCap = 'round';
    ctx.beginPath(); for (let i = 0; i < 60; i++) { const x = b.x + 30 + i * (b.w - 60) / 60, y = b.y + b.h / 2 + Math.sin(i * 0.3 + t) * 50; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
  },
};

// SHOT 13 · 0:21 instrumental — the user's day: other programs open, me.exe idles in the corner.
function shotDesktop(ctx, lt, t, fx) {
  wallpaper(ctx, t); menubar(ctx, t);
  const t0 = beat(45);
  ICONS.forEach((ic, i) => { const [x, y] = iconPos(i); deskIcon(ctx, ic.key, ic.label, x, y, { k: inv(t0 + i * 0.23, t0 + i * 0.23 + 0.25, t), sel: false }); });
  // me.exe waits: an idle timer bubble
  const [mx, my] = iconPos(6);
  if (t > 22.6) { ctx.fillStyle = 'rgba(10,12,34,0.92)'; ctx.fillRect(mx - 290, my - 30, 220, 60); ctx.strokeStyle = C.ice; ctx.strokeRect(mx - 290, my - 30, 220, 60); mono(ctx, 'idle ' + String(Math.floor(3 * 3600 + 12 * 60 + t * 7) % 60).padStart(2, '0') + 's …', mx - 272, my + 9, 22, { color: C.ice }); }
  const opens = [[23.05, 'EIN', 180, 110, 780, 500], [24.45, 'DOS', 520, 330, 640, 420], [25.85, 'TROIS', 980, 150, 560, 440]];
  for (const [to, key, x, y, w, h] of opens) appWindow(ctx, x, y, w, h, `${key}.exe`, (c, b) => APP[key](c, b, t), { k: inv(to, to + 0.25, t) });
  const [cx, cy] = path([[22.3, 1300, 1180], [22.85, iconPos(0)[0], iconPos(0)[1]], [23.9, 700, 500], [24.25, iconPos(1)[0], iconPos(1)[1]], [25.3, 900, 650], [25.65, iconPos(2)[0], iconPos(2)[1]], [26.6, 1250, 500]], t);
  for (const to of [22.95, 24.35, 25.75]) { click(ctx, cx, cy, t, to); click(ctx, cx, cy, t, to + 0.1); }
  arrow(ctx, cx, cy, 5);
  fx.noHud = true; fx.curve = 0.3; fx.scan = 0.07; fx.bloom = 0.45; fx.flash = 0.3 * pulse(t, [t0], 9);
}
// SHOT 14 · 0:27 — the windows close; at last the user opens me.exe.
function shotOpenMe(ctx, lt, t, fx) {
  wallpaper(ctx, t); menubar(ctx, t);
  ICONS.forEach((ic, i) => { const [x, y] = iconPos(i); deskIcon(ctx, ic.key, ic.label, x, y, { sel: i === 6 && t > 28.1 }); });
  const closes = [[beat(58), 'TROIS', 980, 150, 560, 440], [beat(59), 'DOS', 520, 330, 640, 420], [beat(60), 'EIN', 180, 110, 780, 500]];
  for (const [tc, key, x, y, w, h] of closes.slice().reverse()) if (t < tc + 0.25) appWindow(ctx, x, y, w, h, `${key}.exe`, (c, b) => APP[key](c, b, t), { closing: inv(tc, tc + 0.25, t) });
  const [mx, my] = iconPos(6), open = beat(61) + 0.1;
  const [cx, cy] = path([[26.98, 1250, 500], [27.9, 1500, 700], [28.3, mx, my]], t);
  click(ctx, cx, cy, t, beat(61) - 0.12); click(ctx, cx, cy, t, beat(61));
  if (t > open) {                        // her window zooms out of the icon to fill the screen
    const k = E.inOutCubic(inv(open, 29.7, t));
    const x = lerp(mx - 60, 0, k), y = lerp(my - 60, 0, k), w = lerp(120, W, k), h = lerp(120, H, k);
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.translate(x, y); ctx.scale(w / W, h / H);
    keyVisual(ctx, 15.4 + (t - open) * 0.5, { z: 1, x: 0, y: 0, s: 0.66, rot: 0, fig: 'white' });
    ctx.restore();
    ctx.strokeStyle = C.ice; ctx.lineWidth = 3; ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = C.ice; ctx.fillRect(x, y, w, 30 * (1 - k));
    if (k > 0.85) { ctx.save(); ctx.globalAlpha = inv(0.85, 1, k); ctx.fillStyle = C.ink; ctx.fillRect(1440, 120, 360, 110); ctx.strokeStyle = C.ice; ctx.lineWidth = 2; ctx.strokeRect(1440, 120, 360, 110);
      ctx.fillStyle = C.paper; ctx.font = '900 50px "Noto Sans SC"'; ctx.textAlign = 'left'; ctx.fillText('恬豆发芽了', 1464, 180); mono(ctx, 'status: RUNNING', 1466, 214, 18, { color: C.ice }); ctx.restore(); }
  }
  arrow(ctx, cx, cy, 5);
  fx.noHud = t < open + 0.4; fx.curve = 0.3; fx.scan = 0.07; fx.bloom = 0.25;
  fx.flash = 0.35 * pulse(t, [26.98], 9) + 0.8 * E.inExpo(inv(29.5, 29.75, t));
}

// ---------------------------------------------------------------------------
// CHORUS 1 — maths, drawn on blueprint paper.
function blueprint(ctx, t, o = {}) {
  ctx.fillStyle = o.bg || '#0a0f3c'; ctx.fillRect(0, 0, W, H);
  bgGrid(ctx, 30, o.minor || '#121a55', 150, o.major || '#1d2672', o.ox || 0, o.oy || 0);
}
function paper(ctx, t) {
  ctx.fillStyle = C.paper; ctx.fillRect(0, 0, W, H);
  bgGrid(ctx, 24, '#e0e0ef', 120, '#cfd0e8', 0, 0);
}
function axes(ctx, cx, cy, w, h, col, label = true) {
  ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - w, cy); ctx.lineTo(cx + w, cy); ctx.moveTo(cx, cy + h); ctx.lineTo(cx, cy - h); ctx.stroke();
  ctx.fillStyle = col; for (let i = -10; i <= 10; i++) { ctx.fillRect(cx + i * w / 10 - 1, cy - 6, 2, 12); ctx.fillRect(cx - 6, cy + i * h / 10 - 1, 12, 2); }
  if (label) { mono(ctx, 'x', cx + w - 20, cy - 16, 22, { color: col }); mono(ctx, 'y', cx + 14, cy - h + 20, 22, { color: col }); }
}
// SHOT 15 · "If I'm a set of points … DIMENSION": scattered points become her, then gain depth.
function shotPoints(ctx, lt, t, fx) {
  blueprint(ctx, t);
  const cx = 1150, cy = 540;
  const pts = getA().meta.points, n = pts.length;
  const form = E.inOutCubic(inv(31.1, 32.0, t)), dim = E.outCubic(inv(32.6, 33.25, t));
  const rot = (t > 31.6 ? (t - 31.6) * 0.9 : 0) + dim * 0.6;
  axes(ctx, cx, cy, 600, 460, '#2c3690');
  if (dim > 0) { ctx.strokeStyle = C.ice; ctx.globalAlpha = dim; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx - 420 * dim, cy + 300 * dim); ctx.stroke(); mono(ctx, 'z', cx - 440 * dim, cy + 330 * dim, 24, { color: C.ice }); ctx.globalAlpha = 1; }
  const s = 0.6;
  for (let i = 0; i < n; i++) {
    if (t < 29.75 + hash(i * 3) * 1.0) continue;
    const [px, py] = pts[i];
    const rx = (hash(i * 11) - 0.5) * 1500, ry = (hash(i * 17) - 0.5) * 900;
    let x = lerp(rx, (px - 512) * s, form), y = lerp(ry, (py - 768) * s, form);
    const z = (hash(i * 29) - 0.5) * 380 * dim + Math.sin(py * 0.01) * 60 * dim;
    const ca = Math.cos(rot * form), sa = Math.sin(rot * form);
    const X = x * ca + z * sa, Z = -x * sa + z * ca, f = 1400 / (1400 + Z);
    ctx.fillStyle = Z < 0 ? C.paper : C.ice; ctx.globalAlpha = clamp(0.5 + 0.5 * f);
    ctx.fillRect(cx + X * f - 1.2, cy + y * f - 1.2, 2.6 * f, 2.6 * f);
  }
  ctx.globalAlpha = 1;
  mono(ctx, `恬豆发芽了 = new PointSet(${String(Math.min(n, Math.floor(inv(29.75, 30.8, t) * n))).padStart(4, '0')});`, 110, 180, 28, { color: C.ice, weight: 700 });
  if (t > 31.2) mono(ctx, '恬豆发芽了.giveTo(you, 恬豆发芽了.getDimension());', 110, 222, 28, { color: C.ice, count: Math.floor((t - 31.2) / 0.03) });
  if (t > 32.65) mono(ctx, `// dimension: 2 → 3`, 110, 264, 28, { color: C.lilac });
  stamp(ctx, 'DIMENSION', t, 32.65, { size: 150, x: 110, y: 460, shadow: C.deep });
  zhTag(ctx, zhOf('DIMENSION'), t, 32.65, { x: 1800, y: 260, size: 72, color: C.paper, box: C.cobalt });
  fx.bloom = 0.9; fx.curve = 0.3; fx.scan = 0.08; fx.aberr = 1.4 + 8 * pulse(t, [32.65], 10); fx.flash = 0.4 * pulse(t, [29.75, 32.65], 12);
}
// SHOT 16 · "If I'm a circle … CIRCUMFERENCE": compass, moon, then the circle rolls out 2πr.
function shotCircle(ctx, lt, t, fx) {
  paper(ctx, t);
  const r = 150, cx0 = 420, cy = 540, roll = E.inOutCubic(inv(36.25, 36.95, t));
  const draw = E.inOutCubic(inv(33.35, 34.6, t));
  const cx = cx0 + 2 * Math.PI * r * roll, ang = roll * Math.PI * 2;
  // ground line and the unrolled circumference
  ctx.fillStyle = '#b9bce0'; ctx.fillRect(100, cy + r, W - 200, 2);
  if (roll > 0) { ctx.fillStyle = C.cobalt; ctx.fillRect(cx0, cy + r - 4, 2 * Math.PI * r * roll, 8); for (let i = 0; i <= 6; i++) if (i / 6.283 <= roll) { ctx.fillRect(cx0 + i * r - 1, cy + r - 16, 3, 24); mono(ctx, `${i}r`, cx0 + i * r - 10, cy + r + 44, 20, { color: C.navy }); } }
  // filled disc (the moon) with her cameo after "Then I will give you"
  const fill = E.outCubic(inv(35.0, 35.6, t));
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang);
  if (fill > 0) {
    ctx.fillStyle = C.navy; ctx.globalAlpha = fill; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(0, 0, r - 6, 0, 7); ctx.clip();
    ctx.fillStyle = '#c9cadb'; ctx.fillRect(-r, -r, 2 * r, 2 * r);
    pose(ctx, 'white_up', 0, r + 10, 330);   // her smile, rolling along with the circle
  }
  ctx.restore();
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang);
  ctx.strokeStyle = C.navy; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(0, 0, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * draw * (1 - roll) + 0.0001); ctx.stroke();
  ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(r, 0); ctx.stroke(); ctx.fillStyle = C.navy; ctx.beginPath(); ctx.arc(0, 0, 6, 0, 7); ctx.fill();
  ctx.restore();
  // the compass while drawing
  if (draw < 1 && t > 33.3) {
    const a = -Math.PI / 2 + Math.PI * 2 * draw, px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r, hx = (cx + px) / 2, hy = Math.min(cy, py) - 230;
    ctx.lineCap = 'round'; for (const [w, c] of [[14, C.ink], [7, C.mist]]) { ctx.lineWidth = w; ctx.strokeStyle = c; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(hx, hy); ctx.lineTo(px, py); ctx.stroke(); }
    ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(hx, hy, 14, 0, 7); ctx.fill();
  }
  mono(ctx, 'r = 1', cx0 + 40, cy - 12, 24, { color: C.navy, weight: 700 });
  mono(ctx, 'if (恬豆发芽了 instanceof Circle)', 110, 160, 28, { color: C.navy, weight: 700, count: Math.floor((t - 33.3) / 0.03) });
  if (t > 35.0) mono(ctx, '  you.receive(恬豆发芽了.circumference);', 110, 202, 28, { color: C.navy, count: Math.floor((t - 35.0) / 0.03) });
  if (t > 36.3) mono(ctx, `C = 2πr = ${(6.2831 * roll).toFixed(4)}`, 110, 244, 28, { color: C.cobalt, weight: 800 });
  stamp(ctx, 'CIRCUMFERENCE', t, 36.25, { size: 116, x: 830, y: 230, color: C.navy, shadow: '#c9cbe6' });
  zhTag(ctx, zhOf('CIRCUMFERENCE'), t, 36.25, { x: 1790, y: 380, size: 80, color: C.paper, box: C.navy });
  fx.curve = 0.25; fx.scan = 0.05; fx.bloom = 0.2; fx.vig = 0.3; fx.flash = 0.3 * pulse(t, [33.25, 36.25], 12);
}
// SHOT 17 · "If I'm a sine wave … sit on all my TANGENTS": oscilloscope; your cursor rides a tangent.
function shotSine(ctx, lt, t, fx) {
  ctx.fillStyle = '#060a24'; ctx.fillRect(0, 0, W, H);
  const x0 = 140, x1 = 1780, cy = 520, A = 190, k = 2 * Math.PI / 520;
  // graticule
  ctx.strokeStyle = '#18215e'; ctx.lineWidth = 1.5; for (let i = 0; i <= 10; i++) { ctx.beginPath(); ctx.moveTo(x0 + i * (x1 - x0) / 10, 200); ctx.lineTo(x0 + i * (x1 - x0) / 10, 840); ctx.stroke(); }
  for (let j = 0; j <= 8; j++) { ctx.beginPath(); ctx.moveTo(x0, 200 + j * 80); ctx.lineTo(x1, 200 + j * 80); ctx.stroke(); }
  ctx.strokeStyle = '#2a3690'; ctx.beginPath(); ctx.moveTo(x0, cy); ctx.lineTo(x1, cy); ctx.stroke();
  const ph = t * 2.2, reveal = E.outCubic(inv(37.0, 37.9, t));
  const f = x => cy - A * Math.sin(k * (x - x0) + ph), df = x => -A * k * Math.cos(k * (x - x0) + ph);
  ctx.lineWidth = 5; ctx.strokeStyle = C.ice; ctx.beginPath();
  for (let x = x0; x <= x0 + (x1 - x0) * reveal; x += 4) x === x0 ? ctx.moveTo(x, f(x)) : ctx.lineTo(x, f(x)); ctx.stroke();
  const tan = (x, len, col, w) => { const m = df(x), d = len / Math.hypot(1, m); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x - d, f(x) - m * d); ctx.lineTo(x + d, f(x) + m * d); ctx.stroke(); };
  // the tangent fan at TANGENTS
  const T0 = 39.75;
  if (t > T0) for (let i = 0; i < 14; i++) { const ti = T0 + i * 0.05; if (t < ti) break; tan(x0 + 60 + i * 115, 140, i % 2 ? C.lilac : C.paper, 2.5); }
  // you, sitting on a tangent that slides along the wave
  if (t > 38.45) {
    const x = lerp(x0 + 100, x1 - 200, E.inOutCubic(inv(38.45, 40.7, t)));
    tan(x, 200, C.paper, 4);
    const m = df(x), a = Math.atan(m);
    ctx.save(); ctx.translate(x, f(x)); ctx.rotate(a); arrow(ctx, -12, -100, 5); ctx.restore();
    ctx.fillStyle = C.red; ctx.beginPath(); ctx.arc(x, f(x), 7, 0, 7); ctx.fill();
  }
  mono(ctx, 'CH1  1V/div  ~  恬豆发芽了(x) = sin x', x0, 170, 26, { color: C.ice, weight: 700 });
  if (t > 38.5) mono(ctx, "you.sitOn( me'(x) = cos x );", 900, 170, 26, { color: C.paper, count: Math.floor((t - 38.5) / 0.03) });
  stamp(ctx, 'TANGENTS', t, T0, { size: 170, x: 520, y: 340, shadow: C.deep });
  zhTag(ctx, zhOf('TANGENTS'), t, T0, { x: 1760, y: 330, size: 76, color: C.ink, box: C.ice });
  fx.bloom = 1.0; fx.curve = 0.45; fx.scan = 0.14; fx.mask = 0.25; fx.aberr = 1.6 + 6 * pulse(t, [T0], 10); fx.flash = 0.3 * pulse(t, [37.0, T0], 12);
}
// SHOT 18 · "If I approach infinity … LIMITATIONS": ∞ race, an asymptote named you, then the walls.
function shotInfinity(ctx, lt, t, fx) {
  blueprint(ctx, t);
  // endless zoom: the grid scale keeps doubling
  const z = Math.pow(2, (t - 40.75) * 2.2) % 2 + 1;
  ctx.save(); ctx.translate(960, 500); ctx.scale(z, z); ctx.translate(-960, -500);
  ctx.strokeStyle = 'rgba(77,94,224,0.25)'; ctx.lineWidth = 1 / z; for (let i = -20; i <= 20; i++) { ctx.beginPath(); ctx.moveTo(960 + i * 60, 0); ctx.lineTo(960 + i * 60, H); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, 500 + i * 60); ctx.lineTo(W, 500 + i * 60); ctx.stroke(); }
  ctx.restore();
  const cx = 960, cy = 480, a = 430;
  const lem = u => { const s = Math.sin(u), c = Math.cos(u), d = 1 + s * s; return [cx + a * c / d, cy + a * s * c / d]; };
  const drawP = E.inOutCubic(inv(40.8, 41.5, t));
  ctx.lineWidth = 12; ctx.strokeStyle = C.ice; ctx.lineCap = 'round'; ctx.beginPath();
  for (let i = 0; i <= 200 * drawP; i++) { const [x, y] = lem(i / 200 * Math.PI * 2); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
  // she races the loop faster and faster
  const u = Math.pow(Math.max(0, t - 40.9), 2) * 7, [px, py] = lem(u);
  for (let k = 1; k < 10; k++) { const [qx, qy] = lem(u - k * 0.05 * (1 + u * 0.05)); ctx.fillStyle = `rgba(236,235,243,${0.5 - k * 0.05})`; ctx.beginPath(); ctx.arc(qx, qy, 12 - k, 0, 7); ctx.fill(); }
  ctx.fillStyle = C.paper; sparkle(ctx, px, py, 26, u);
  const n = Math.floor(Math.pow(10, clamp((t - 40.75) / 1.5) * 24));
  mono(ctx, `n = ${t < 42.2 ? n.toExponential(2) : '∞'}`, 1250, 860, 30, { color: C.ice, weight: 700 });
  // the asymptote called "you"
  if (t > 42.2) {
    const k = E.outCubic(inv(42.2, 43.0, t));
    ctx.setLineDash([16, 12]); ctx.strokeStyle = C.paper; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(140, 760); ctx.lineTo(140 + 1640 * k, 760); ctx.stroke(); ctx.setLineDash([]);
    mono(ctx, 'y = you', 1600, 740, 26, { color: C.paper, weight: 700 });
    ctx.strokeStyle = C.lilac; ctx.lineWidth = 4; ctx.beginPath(); for (let i = 0; i <= 100 * k; i++) { const x = 140 + i * 16.4, y = 760 + 240 / (1 + i * 0.15); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
    mono(ctx, 'lim   恬豆发芽了(n) = you', 1250, 930, 30, { color: C.paper, weight: 700, count: Math.floor((t - 42.3) / 0.03) });
    mono(ctx, 'n→∞', 1250, 962, 20, { color: C.paper, count: t > 42.5 ? 3 : 0 });
  }
  // LIMITATIONS: four walls slam shut around the loop
  const T0 = 43.25;
  if (t > T0) {
    const k = E.outBack(inv(T0, T0 + 0.22, t)), m = 60;
    ctx.fillStyle = C.paper;
    const bx0 = cx - a - 60, bx1 = cx + a + 60, by0 = cy - 220, by1 = cy + 220;
    ctx.fillRect(lerp(0, bx0 - m, k), by0 - m, m, by1 - by0 + 2 * m); ctx.fillRect(lerp(W - m, bx1, k), by0 - m, m, by1 - by0 + 2 * m);
    ctx.fillRect(bx0 - m, lerp(0, by0 - m, k), bx1 - bx0 + 2 * m, m); ctx.fillRect(bx0 - m, lerp(H - m, by1, k), bx1 - bx0 + 2 * m, m);
    for (let i = 0; i < 9; i++) ctx.fillRect(bx0 + (bx1 - bx0) * (i + 0.5) / 9 - 3, by0, 6, (by1 - by0) * k);
  }
  stamp(ctx, 'LIMITATIONS', t, T0, { size: 150, y: 200, color: C.paper, shadow: C.cobalt });
  zhTag(ctx, zhOf('LIMITATIONS'), t, T0, { x: 1790, y: 250, size: 70, color: C.paper, box: C.navy });
  fx.bloom = 0.85; fx.curve = 0.3; fx.scan = 0.08; fx.aberr = 1.4 + 10 * pulse(t, [T0], 9); fx.flash = 0.3 * pulse(t, [40.75], 12) + 0.5 * pulse(t, [T0], 12);
}

// ---------------------------------------------------------------------------
// VERSE 2
// SHOT 19 · "Switch my current / To AC to DC": a lever switch and the scope trace it drives.
function shotCurrent(ctx, lt, t, fx) {
  blueprint(ctx, t, { bg: '#0b0d2c' });
  const fA = 46.0, fD = beat(101);                      // flips on "AC" and "DC"
  const state = t < fA ? 0 : t < fD ? -1 : 1;              // 0 off, -1 AC, 1 DC
  const flip = state === 0 ? 0 : state === -1 ? -E.outBack(inv(fA, fA + 0.14, t)) : lerp(-1, 1, E.outBack(inv(fD, fD + 0.14, t)));
  // switch plate
  const sx = 640, sy = 440;
  ctx.fillStyle = C.ink; ctx.fillRect(sx - 230, sy - 250, 460, 500); ctx.fillStyle = '#9ea3c9'; ctx.fillRect(sx - 220, sy - 240, 440, 480);
  ctx.fillStyle = '#8c91bb'; ctx.fillRect(sx - 220, sy + 200, 440, 40);
  mono(ctx, 'AC ~', sx - 200, sy - 170, 44, { color: state === -1 ? C.cobalt : '#6d72a8', weight: 800 });
  mono(ctx, 'DC ⎓', sx + 60, sy - 170, 44, { color: state === 1 ? C.cobalt : '#6d72a8', weight: 800 });
  ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(sx, sy + 80, 64, 0, 7); ctx.fill();
  ctx.save(); ctx.translate(sx, sy + 80); ctx.rotate(flip * 0.7);
  ctx.fillStyle = C.ink; ctx.fillRect(-26, -250, 52, 250); ctx.fillStyle = C.paper; ctx.fillRect(-18, -242, 36, 238); ctx.fillStyle = C.red; ctx.beginPath(); ctx.arc(0, -250, 40, 0, 7); ctx.fill(); ctx.fillStyle = '#ff9aac'; ctx.beginPath(); ctx.arc(-10, -262, 12, 0, 7); ctx.fill();
  ctx.restore();
  // sparks on each flip
  for (const tf of [fA, fD]) if (t > tf && t < tf + 0.3) { const p = (t - tf) / 0.3; ctx.strokeStyle = C.paper; ctx.lineWidth = 4; for (let i = 0; i < 10; i++) { const a = i / 10 * 6.28 + tf; ctx.globalAlpha = 1 - p; ctx.beginPath(); ctx.moveTo(sx + Math.cos(a) * (80 + 200 * p), sy - 120 + Math.sin(a) * (80 + 200 * p)); ctx.lineTo(sx + Math.cos(a) * (120 + 260 * p), sy - 120 + Math.sin(a) * (120 + 260 * p)); ctx.stroke(); } ctx.globalAlpha = 1; }
  // scope
  const ox = 1000, oy = 230, ow = 800, oh = 460;
  ctx.fillStyle = '#060a24'; ctx.fillRect(ox, oy, ow, oh); ctx.strokeStyle = C.ice; ctx.lineWidth = 2; ctx.strokeRect(ox, oy, ow, oh);
  ctx.strokeStyle = '#18215e'; for (let i = 1; i < 8; i++) { ctx.beginPath(); ctx.moveTo(ox + i * ow / 8, oy); ctx.lineTo(ox + i * ow / 8, oy + oh); ctx.stroke(); }
  ctx.lineWidth = 5; ctx.strokeStyle = state === 1 ? C.paper : C.ice; ctx.beginPath();
  const amp = state === 0 ? 20 : state === -1 ? 160 : 160 * (1 - E.outCubic(inv(fD, fD + 0.3, t)));
  for (let x = 0; x <= ow; x += 5) { const y = oy + oh / 2 - (state === 1 ? 140 * E.outCubic(inv(fD, fD + 0.3, t)) : 0) - amp * Math.sin(x * 0.03 + t * 12); x ? ctx.lineTo(ox + x, y) : ctx.moveTo(ox + x, y); }
  ctx.stroke();
  mono(ctx, `恬豆发芽了.current = ${state === 0 ? 'null' : state === -1 ? '"AC"' : '"DC"'};`, ox, oy + oh + 60, 32, { color: C.paper, weight: 700 });
  fx.bloom = 0.7; fx.curve = 0.3; fx.scan = 0.08; fx.aberr = 1.3 + 8 * pulse(t, [fA, fD], 12); fx.flash = 0.35 * pulse(t, [44.5, fA, fD], 12);
}
// SHOT 20 · "And then blind my vision": her eye; a redaction bar; NO SIGNAL.
function shotBlind(ctx, lt, t, fx) {
  ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H);
  const A = getA();
  const nos = beat(106);                                  // screen dies on the beat
  if (t < nos) {
    // eye close-up from the illustration's inset panel, framed as a camera feed
    // her face on the camera feed (calm) — then a redaction bar across the eyes
    const z = 1 + (t - 47.75) * 0.04, fw = 560 * z, fh = 740 * z;
    face(ctx, 'calm', 960 - fw / 2, 470 - fh / 2, fw, fh, { frame: C.ice });
    const bar = E.outExpo(inv(48.1, 48.4, t)), by = 470 - fh / 2 + fh * 0.36;
    ctx.fillStyle = C.ink; ctx.fillRect(960 - fw / 2 - 60, by, (fw + 120) * bar, 120); if (bar > 0.9) mono(ctx, '█ vision = null █', 960 - 17 * 15.6, by + 76, 26, { color: C.paper, weight: 800 });
    mono(ctx, '● REC  vision.cam  1024×1536', 110, 150, 26, { color: C.red, weight: 700 });
    scanBars(ctx, 0, 0, W, H, 0.25, 4);
  } else {
    // SMPTE-style bars in the MV palette, then snow
    const cols = [C.paper, C.ice, C.lilac, C.cobalt, C.violet, C.deep, C.navy];
    cols.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(i * W / 7, 0, W / 7 + 1, H * 0.7); });
    const R = rng(Math.round(t * 24)); for (let i = 0; i < 2500; i++) { ctx.fillStyle = R() > 0.5 ? C.paper : C.ink; ctx.fillRect(R() * W, H * 0.7 + R() * H * 0.3, 4, 3); }
    ctx.fillStyle = C.ink; ctx.fillRect(660, 380, 600, 110); mono(ctx, 'NO SIGNAL', 745, 460, 64, { color: C.paper, weight: 800 });
  }
  fx.bloom = 0.4; fx.curve = 0.45; fx.scan = 0.12; fx.mask = 0.2; fx.flash = 0.6 * pulse(t, [nos], 12); fx.glitch = 0.4 * pulse(t, [nos], 6);
}
// SHOT 21 · "So dizzy so dizzy": a hypnotic spiral, twice, spinning opposite ways.
function shotDizzy(ctx, lt, t, fx) {
  const second = t > 50.6, dir = second ? -1 : 1;
  ctx.fillStyle = second ? C.cobalt : C.navy; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.translate(960, 520); ctx.rotate(dir * t * 4);
  ctx.fillStyle = second ? C.ink : C.ice;
  for (let arm = 0; arm < 2; arm++) { ctx.beginPath(); for (let i = 0; i <= 200; i++) { const a = i * 0.12 + arm * Math.PI, r = i * 7; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } for (let i = 200; i >= 0; i--) { const a = i * 0.12 + arm * Math.PI + 0.9, r = i * 7; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.fill(); }
  ctx.restore();
  // she spins at the centre of the spiral (the sitting pose, hugging her knees)
  ctx.save(); ctx.translate(960, 520); ctx.beginPath(); ctx.arc(0, 0, 250, 0, 7); ctx.fillStyle = second ? C.ink : C.navy; ctx.fill(); ctx.clip();
  ctx.rotate(-dir * t * 2.2); pose(ctx, 'pose_sit', 0, 260, 520); ctx.restore();
  ctx.strokeStyle = second ? C.paper : C.ice; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(960, 520, 250, 0, 7); ctx.stroke();
  // double-vision text
  for (const [dx, a] of [[-14, 0.45], [14, 0.45], [0, 1]]) { ctx.globalAlpha = a; mono(ctx, 'so dizzy', 960 - 8 * 57.6 / 2 + dx + Math.sin(t * 9) * 20, 180, 96, { color: second ? C.paper : C.ink, weight: 800 }); }
  ctx.globalAlpha = 1;
  // loading pointer
  ctx.save(); ctx.translate(1500, 820); ctx.rotate(t * 10); for (let i = 0; i < 8; i++) { ctx.rotate(Math.PI / 4); ctx.fillStyle = `rgba(236,235,243,${(i + 1) / 8})`; ctx.fillRect(18, -5, 26, 10); } ctx.restore();
  fx.bloom = 0.5; fx.curve = 0.5; fx.scan = 0.1; fx.aberr = 10 + 8 * Math.sin(t * 5); fx.flash = 0.35 * pulse(t, [49.75, 50.6], 10);
}
// SHOT 22 · "Oh we can travel / To A.D to B.C": a timeline scrubbed backwards; the two of you ride the playhead.
function shotTravel(ctx, lt, t, fx) {
  blueprint(ctx, t, { bg: '#0b0d2c' });
  const k = E.inOutCubic(inv(51.6, 55.1, t));
  const year = Math.round(lerp(2026, -3000, Math.pow(k, 1.6)));
  // ruler scrolling with moon phases
  const off = k * 5000;
  ctx.fillStyle = '#10143f'; ctx.fillRect(0, 640, W, 180); ctx.fillStyle = C.ice; ctx.fillRect(0, 640, W, 2); ctx.fillRect(0, 818, W, 2);
  for (let i = -2; i < 26; i++) {
    const x = ((i * 90 + off) % (W + 180)) - 90, yv = 2026 - Math.round((i * 90 + off) / 90) * 50;
    ctx.fillStyle = C.dim; ctx.fillRect(x, 650, 2, i % 2 ? 20 : 40);
    ctx.fillStyle = '#c8c9df'; ctx.beginPath(); ctx.arc(x, 740, 16, 0, 7); ctx.fill();
    ctx.fillStyle = '#10143f'; ctx.beginPath(); ctx.arc(x + 16 * Math.cos(yv * 0.7), 740, 16, 0, 7); ctx.fill();
  }
  // playhead
  ctx.fillStyle = C.red; ctx.fillRect(958, 560, 4, 280); ctx.beginPath(); ctx.moveTo(940, 560); ctx.lineTo(980, 560); ctx.lineTo(960, 590); ctx.fill();
  avatar(ctx, 'smile', 900, 500, 62, { lw: 5 }); arrow(ctx, 985, 470, 5);
  mono(ctx, '恬豆发芽了', 848, 600, 22, { color: C.ice, weight: 700 });
  // big year counter
  const label = year > 0 ? `${String(year).padStart(4, '0')} A.D.` : `${String(1 - year).padStart(4, '0')} B.C.`;
  mono(ctx, label, 960 - label.length * 0.6 * 170 / 2, 400, 170, { color: year > 0 ? C.paper : C.ice, weight: 800 });
  // a clock spinning backwards
  ctx.save(); ctx.translate(250, 260); ctx.strokeStyle = C.ice; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, 0, 110, 0, 7); ctx.stroke();
  for (let i = 0; i < 12; i++) { ctx.save(); ctx.rotate(i * Math.PI / 6); ctx.fillStyle = C.ice; ctx.fillRect(-3, -100, 6, 18); ctx.restore(); }
  ctx.rotate(-t * 14); ctx.fillStyle = C.paper; ctx.fillRect(-4, -90, 8, 90); ctx.rotate(t * 13); ctx.fillRect(-5, -60, 10, 60); ctx.restore();
  mono(ctx, 'world.time.rewind();', 1300, 160, 28, { color: C.ice, weight: 700 });
  fx.bloom = 0.7; fx.curve = 0.3; fx.scan = 0.08; fx.aberr = 1.4 + 4 * (1 - Math.abs(k - 0.5) * 2); fx.flash = 0.35 * pulse(t, [51.5, 53.25], 12);
}
// SHOT 23 · "And we can unite / So deeply so deeply": two circles, me ∩ you → me ∪ you → a dive.
function shotUnite(ctx, lt, t, fx) {
  ctx.fillStyle = C.navy; ctx.fillRect(0, 0, W, H);
  const deep = inv(57.0, 59.2, t);
  if (deep <= 0) {
    const m = E.inOutCubic(inv(55.3, 56.5, t)), d = lerp(520, 0, m), r = 260;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = 'rgba(77,94,224,0.8)'; ctx.beginPath(); ctx.arc(960 - d / 2, 500, r, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(122,85,240,0.8)'; ctx.beginPath(); ctx.arc(960 + d / 2, 500, r, 0, 7); ctx.fill(); ctx.restore();
    ctx.strokeStyle = C.paper; ctx.lineWidth = 4; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(960 + s * d / 2, 500, r, 0, 7); ctx.stroke(); }
    mono(ctx, '恬豆发芽了', 960 - d / 2 - 60 - (d > 100 ? 80 : 0), 520, 56, { color: C.paper, weight: 800 });
    mono(ctx, 'you', 960 + d / 2 - 40 + (d > 100 ? 60 : 0), 520, 56, { color: C.paper, weight: 800 });
    mono(ctx, m < 0.5 ? '恬豆发芽了 ∩ you' : '恬豆发芽了 ∪ you  =  1', 110, 180, 34, { color: C.ice, weight: 800 });
  } else {
    // droste dive through nested rings
    const z = Math.pow(1.9, deep * 9), n = 18;
    for (let i = n; i >= 0; i--) {
      const r = 40 * Math.pow(1.9, i) / z * 8; if (r < 2 || r > 4000) continue;
      ctx.fillStyle = i % 2 ? C.cobalt : C.violet; ctx.beginPath(); ctx.arc(960, 520, r, 0, 7); ctx.fill();
      ctx.strokeStyle = C.paper; ctx.lineWidth = 2; ctx.stroke();
    }
    const pr = 120 + deep * 110;
    ctx.save(); ctx.beginPath(); ctx.arc(960, 520, pr, 0, 7); ctx.fillStyle = '#c9cadb'; ctx.fill(); ctx.clip();
    pose(ctx, 'white_up', 960, 520 + pr * 1.12, pr * 2.5); ctx.restore();
    ctx.strokeStyle = C.paper; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(960, 520, pr, 0, 7); ctx.stroke();
    arrow(ctx, 960 + pr * 0.8, 520 + pr * 0.55, 5);
    mono(ctx, `depth ${String(Math.floor(deep * 64)).padStart(2, '0')}`, 110, 180, 34, { color: C.paper, weight: 800 });
  }
  fx.bloom = 0.6; fx.curve = 0.35; fx.scan = 0.08; fx.aberr = 1.5; fx.flash = 0.35 * pulse(t, [55.25, 57.0, 58.1], 12);
}

// ---------------------------------------------------------------------------
// PRE-CHORUS 1
const NOTES = ['♥ 恬豆发芽了.exe: good morning!', '★ you levelled up', '✉ 恬豆发芽了.exe sent a song', '♪ playing: your favourite', '✦ +100 happiness', '♥ 恬豆发芽了.exe: look at the moon', '★ achievement unlocked', '✉ 3 new messages'];
// SHOT 24 · "If I can give you all the STIMULATIONS": notifications rain on the desktop.
function shotStim(ctx, lt, t, fx) {
  wallpaper(ctx, t); menubar(ctx, t);
  const T0 = 61.75, rate = t < T0 ? 4 + (t - 59.25) * 3 : 40;
  let count = 0; for (let tt = 59.3; tt < t; tt += 1 / rate) count++;
  count = Math.min(count, 90);
  for (let i = 0; i < count; i++) {
    const x = 120 + hash(i * 7) * 1300, y = 80 + hash(i * 13) * 760, k = clamp((t - 59.3 - i * 0.05) * 6);
    ctx.save(); ctx.globalAlpha = clamp(k); ctx.fillStyle = i % 5 === 0 ? C.ice : '#141848'; ctx.fillRect(x, y, 450, 64); ctx.strokeStyle = C.ice; ctx.lineWidth = 2; ctx.strokeRect(x, y, 450, 64);
    avatar(ctx, ['smile', 'surprised', 'calm'][i % 3], x + 32, y + 32, 24, { lw: 2 });
    mono(ctx, NOTES[i % NOTES.length], x + 66, y + 40, 20, { color: i % 5 === 0 ? C.ink : C.paper, weight: 700 }); ctx.restore();
  }
  // dopamine meter
  const lv = clamp((t - 59.25) / 2.5) * (0.85 + 0.15 * Math.sin(t * 20));
  ctx.fillStyle = C.ink; ctx.fillRect(1700, 160, 90, 700); for (let i = 0; i < 20; i++) { ctx.fillStyle = i / 20 < lv ? (i > 16 ? C.red : i > 11 ? C.lilac : C.cobalt) : '#161a45'; ctx.fillRect(1712, 840 - i * 34, 66, 26); }
  mono(ctx, 'STIM', 1705, 900, 26, { color: C.ice, weight: 800 });
  if (t > T0) focusLines(ctx, 960, 520, 120, 420, C.paper, 3 + Math.floor(t * 12), 0.6 * clamp(1 - (t - T0)));
  stamp(ctx, 'STIMULATIONS', t, T0, { size: 150, y: 580, shadow: C.violet });
  zhTag(ctx, zhOf('STIMULATIONS'), t, T0, { x: 1600, y: 250, size: 72 });
  fx.noHud = true; fx.bloom = 0.6; fx.curve = 0.3; fx.scan = 0.07; fx.aberr = 1.4 + 8 * pulse(t, [T0], 8); fx.flash = 0.4 * pulse(t, [T0], 10);
}
// SHOT 25 · "Then I can be your only SATISFACTION": everything closes but one survey; five stars.
function shotSatisfy(ctx, lt, t, fx) {
  wallpaper(ctx, t); menubar(ctx, t);
  const T0 = 65.75;
  const w = 900, h = 420, x = 510, y = 250;
  appWindow(ctx, x, y, w, h, '恬豆发芽了.exe — feedback', (c, b) => {
    mono(c, 'How satisfied are you with me?', b.x + 50, b.y + 80, 34, { color: C.paper, weight: 700 });
    avatar(c, t > 65.75 ? 'smile' : 'calm', b.x + b.w - 100, b.y + 290, 64);
    const stars = [beat(137), beat(138), beat(139), beat(140), beat(141)];
    stars.forEach((ts, i) => {
      const on = t > ts, sx = b.x + 130 + i * 140, sy = b.y + 200;
      c.fillStyle = on ? C.ice : '#262b6a'; sparkle(c, sx, sy, on ? 54 + 10 * pulse(t, [ts], 12) : 50, Math.PI / 4, 0.42);
    });
    mono(c, `satisfaction: ${String(Math.round(clamp((t - 63.75) / 2) * 100)).padStart(3, ' ')}%`, b.x + 50, b.y + 330, 28, { color: C.lilac, weight: 700 });
  }, { k: inv(62.75, 63.0, t) });
  // her pointer fills the stars herself
  const [cx, cy] = path([[63.6, 1400, 800], [beat(137), x + 132, y + 32 + 200], [beat(141), x + 132 + 560, y + 32 + 200]], t);
  arrow(ctx, cx, cy, 5, C.ice, C.ink);
  if (t > T0) { ctx.save(); ctx.translate(1230, 330); ctx.rotate(-0.25); const k = E.outBack(inv(T0, T0 + 0.18, t)); ctx.scale(2 - k, 2 - k); ctx.globalAlpha = clamp(k);
    ctx.strokeStyle = C.cobalt; ctx.lineWidth = 8; ctx.strokeRect(-190, -60, 380, 120); mono(ctx, '100%', -120, 30, 80, { color: C.cobalt, weight: 800 }); ctx.restore(); }
  stamp(ctx, 'SATISFACTION', t, T0, { size: 120, y: 860, x: 880, shadow: C.deep });
  zhTag(ctx, zhOf('SATISFACTION'), t, T0, { x: 190, y: 220, size: 72 });
  fx.noHud = true; fx.bloom = 0.55; fx.curve = 0.3; fx.scan = 0.07; fx.flash = 0.4 * pulse(t, [62.75, T0], 10);
}
// SHOT 26 · "If I can make you happy / I will run the EXECUTION": an LED smile, then the first red.
const SMILE = ['................', '....XXXXXXXX....', '..XX........XX..', '.X............X.', '.X..XX....XX..X.', 'X...XX....XX...X', 'X..............X', 'X..............X', 'X..X........X..X', 'X...X......X...X', '.X...XXXXXX...X.', '.X............X.', '..XX........XX..', '....XXXXXXXX....', '................', '................'];
function shotHappy(ctx, lt, t, fx) {
  const T0 = 69.25, red = t > T0;
  ctx.fillStyle = red ? '#12040c' : C.ink; ctx.fillRect(0, 0, W, H);
  const lit = inv(66.6, 67.8, t), s = 46, x0 = 960 - 8 * s, y0 = 100;
  for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) {
    const on = SMILE[j][i] === 'X' && hash2(i, j) < lit * 1.1;
    ctx.fillStyle = on ? (red ? C.red : C.ice) : (red ? '#2a0a18' : '#141848');
    ctx.beginPath(); ctx.arc(x0 + i * s + s / 2, y0 + j * s + s / 2, s * 0.36, 0, 7); ctx.fill();
  }
  if (t > 68.25) {
    ctx.fillStyle = 'rgba(5,5,11,0.85)'; ctx.fillRect(420, 830, 1080, 70);
    mono(ctx, 'C:\\WORLD> run execution.exe', 450, 878, 34, { color: red ? C.red : C.paper, weight: 700, count: Math.floor((t - 68.3) / 0.03) });
  }
  if (red) { stamp(ctx, 'EXECUTION', t, T0, { size: 200, y: 560, color: C.paper, shadow: C.red }); zhTag(ctx, zhOf('EXECUTION', 60), t, T0, { x: 1760, y: 250, size: 80, color: C.paper, box: C.red }); }
  fx.bloom = 0.9; fx.curve = 0.35; fx.scan = 0.1; fx.mask = 0.15; fx.aberr = 1.4 + 12 * pulse(t, [T0], 8); fx.flash = 0.8 * pulse(t, [T0], 14); fx.glitch = 0.5 * pulse(t, [T0], 8);
  fx.invert = (t >= T0 && t < T0 + 1 / 24) ? 1 : 0;
}
// SHOT 27 · "Though we are trapped / In this strange strange SIMULATION": she is behind the glass.
const warp = canvas(W, H), wctx = warp.getContext('2d');
function shotTrapped(ctx, lt, t, fx) {
  const T0 = 72.75;
  wctx.setTransform(1, 0, 0, 1, 0, 0);
  roomScene(wctx, t, { scr: { x: 560, y: 150, w: 800, h: 450 }, steam: 0.6, screen: (c, S) => {
    c.save(); c.translate(S.x, S.y); c.scale(S.w / W, S.h / H); keyVisual(c, 17.0, { z: 1.25, x: 0, y: 160, s: 0.66, rot: 0, fig: 'white' }); c.restore();
    c.fillStyle = C.ink; for (let i = 0; i < 12; i++) c.fillRect(S.x + i * S.w / 11 - 4, S.y, 8, S.h * E.outCubic(inv(70.35 + i * 0.03, 70.9 + i * 0.03, t)));
  } });
  const strange = inv(71.5, 72.7, t);
  if (strange > 0 && t < T0) {
    for (let y = 0; y < H; y += 12) { const dx = Math.sin(y * 0.02 + t * 8) * 40 * strange; ctx.drawImage(warp, 0, y, W, 12, dx, y, W, 12); }
  } else ctx.drawImage(warp, 0, 0);
  if (t > T0) { ctx.fillStyle = 'rgba(5,5,11,0.5)'; ctx.fillRect(0, 0, W, H); stamp(ctx, 'SIMULATION', t, T0, { size: 200, y: 620, shadow: C.cobalt }); zhTag(ctx, zhOf('SIMULATION', 60), t, T0, { x: 170, y: 240, size: 84 }); }
  fx.bloom = 0.5; fx.curve = 0.3; fx.scan = 0.07; fx.aberr = 1.3 + 6 * strange; fx.glitch = t > T0 ? 0.25 + 0.4 * inv(73.2, 73.75, t) : 0; fx.flash = 0.5 * pulse(t, [T0], 12);
}

const LY = { x: 104, y: 930 };
export const SHOTS2 = [
  { t0: beat(45), t1: beat(58), name: 'desktop', draw: shotDesktop, lyric: null },
  { t0: beat(58), t1: 29.75, name: 'open 恬豆发芽了.exe', draw: shotOpenMe, lyric: null },
  { t0: 29.75, t1: 33.25, name: 'points', draw: shotPoints, lyric: LY },
  { t0: 33.25, t1: 37.0, name: 'circle', draw: shotCircle, lyric: { ...LY, theme: 'light' }, theme: 'light' },
  { t0: 37.0, t1: 40.75, name: 'sine', draw: shotSine, lyric: LY },
  { t0: 40.75, t1: 44.5, name: 'infinity', draw: shotInfinity, lyric: LY },
  { t0: 44.5, t1: 47.75, name: 'current', draw: shotCurrent, lyric: LY },
  { t0: 47.75, t1: 49.75, name: 'blind', draw: shotBlind, lyric: LY },
  { t0: 49.75, t1: 51.5, name: 'dizzy', draw: shotDizzy, lyric: LY },
  { t0: 51.5, t1: 55.25, name: 'travel', draw: shotTravel, lyric: LY },
  { t0: 55.25, t1: 59.25, name: 'unite', draw: shotUnite, lyric: LY },
  { t0: 59.25, t1: 62.75, name: 'stimulations', draw: shotStim, lyric: LY },
  { t0: 62.75, t1: 66.5, name: 'satisfaction', draw: shotSatisfy, lyric: LY },
  { t0: 66.5, t1: 70.25, name: 'happy', draw: shotHappy, lyric: LY },
  { t0: 70.25, t1: 73.75, name: 'trapped', draw: shotTrapped, lyric: LY },
];
