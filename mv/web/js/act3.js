// Act 3 · 1:14–2:13 — chorus 2 (eggplant, tomato, cat, god), verse 3, the leaving, the bridge.
import { W, H, C, beat, clamp, lerp, inv, E, hash, hash2, rng, onTwos, pulse, canvas, sparkle, focusLines, halftone, stripes, tinted, roundRect } from './lib.js';
import { mono } from './type.js';
import { getA, drawCut, layer, moon, stars, bgGrid, scanBars, vText, arrow, keyVisual, sticker, piece, floorGrid, drawWorld, petals } from './shots.js';
import {
  RED, TEAL, crisp, blit, sprite, icon, PROGRAMS, deskIcon, wallpaper, menubar, appWindow, button, progress, errorBox,
  stamp, zhTag, path, click, roomScene, shatter,
} from './kit.js';
import { LYRICS } from './lyrics.js';
import { pose, face, avatar } from './cast.js';

const zhOf = (en, after) => LYRICS.find(l => l.en === en && l.t0 > after).zh;
const paper = ctx => { ctx.fillStyle = C.paper; ctx.fillRect(0, 0, W, H); bgGrid(ctx, 24, '#e0e0ef', 120, '#cfd0e8'); };
const blueprint = (ctx, bg = '#0a0f3c') => { ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H); bgGrid(ctx, 30, '#121a55', 150, '#1d2672'); };

// ---------------------------------------------------------------------------
// Pixel produce (vector → palette-snapped pixels)
const EGG = () => crisp('egg', 40, 56, x => {
  x.fillStyle = C.ink; x.beginPath(); x.ellipse(22, 35, 12, 20, 0.35, 0, 7); x.fill();
  x.fillStyle = '#6b3fb8'; x.beginPath(); x.ellipse(22, 35, 10.5, 18.5, 0.35, 0, 7); x.fill();
  x.fillStyle = '#8f6ad8'; x.beginPath(); x.ellipse(16, 30, 4, 9, 0.25, 0, 7); x.fill();
  x.fillStyle = C.ink; x.beginPath(); x.moveTo(8, 17); x.lineTo(32, 14); x.lineTo(26, 22); x.lineTo(14, 22); x.fill();
  x.fillStyle = '#2f7f78'; x.beginPath(); x.moveTo(10, 17); x.lineTo(30, 15); x.lineTo(25, 20); x.lineTo(15, 20); x.fill();
  x.fillStyle = TEAL; x.fillRect(18, 8, 4, 9);
});
const TOM = () => crisp('tom', 44, 40, x => {
  x.fillStyle = C.ink; x.beginPath(); x.ellipse(22, 23, 20, 16, 0, 0, 7); x.fill();
  x.fillStyle = C.red; x.beginPath(); x.ellipse(22, 23, 18, 14, 0, 0, 7); x.fill();
  x.fillStyle = '#a8324f'; x.beginPath(); x.ellipse(28, 27, 9, 8, 0, 0, 7); x.fill();
  x.fillStyle = '#ffffff'; x.fillRect(11, 16, 4, 4);
  x.fillStyle = '#2f7f78'; for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * 0.6; x.beginPath(); x.moveTo(22, 10); x.lineTo(22 + Math.cos(a) * 11, 10 + Math.sin(a) * 5 + 4); x.lineTo(22 + Math.cos(a + 0.25) * 4, 12); x.fill(); }
  x.fillStyle = TEAL; x.fillRect(21, 2, 3, 8);
});
const CAT = f => crisp('cat' + f, 56, 44, x => {
  // body
  x.fillStyle = C.ink; x.beginPath(); x.ellipse(28, 32, 17, 12, 0, 0, 7); x.fill();
  x.fillStyle = '#7b7f9e'; x.beginPath(); x.ellipse(28, 32, 15.5, 10.5, 0, 0, 7); x.fill();
  // head
  x.fillStyle = C.ink; x.beginPath(); x.arc(17, 18, 11, 0, 7); x.fill(); x.beginPath(); x.moveTo(7, 12); x.lineTo(9, 1); x.lineTo(15, 9); x.moveTo(19, 9); x.lineTo(26, 1); x.lineTo(27, 12); x.fill();
  x.fillStyle = '#7b7f9e'; x.beginPath(); x.arc(17, 18, 9.5, 0, 7); x.fill(); x.beginPath(); x.moveTo(9, 11); x.lineTo(10, 4); x.lineTo(14, 9); x.moveTo(20, 9); x.lineTo(25, 4); x.lineTo(25, 11); x.fill();
  // tabby stripes
  x.fillStyle = '#4a4d66'; for (const [a, b] of [[14, 9], [18, 9], [22, 10]]) x.fillRect(a, b, 2, 5); for (let i = 0; i < 4; i++) x.fillRect(26 + i * 5, 23, 2, 10);
  // eyes: open or blissfully shut (purring)
  x.fillStyle = C.ice; if (f) { x.fillRect(11, 17, 4, 1.5); x.fillRect(19, 17, 4, 1.5); } else { x.fillRect(12, 15, 3, 4); x.fillRect(20, 15, 3, 4); }
  x.fillStyle = '#e8c9a8'; x.fillRect(16, 21, 2, 2);
  // tail
  x.strokeStyle = C.ink; x.lineWidth = 5; x.lineCap = 'round'; x.beginPath(); x.moveTo(42, 34); x.quadraticCurveTo(54, f ? 30 : 22, f ? 52 : 48, f ? 16 : 10); x.stroke();
  x.strokeStyle = '#7b7f9e'; x.lineWidth = 3; x.stroke();
});
const HEART = crisp('heart', 16, 15, x => { x.fillStyle = C.ink; x.beginPath(); x.moveTo(8, 14.5); x.bezierCurveTo(-2, 7, 1, -1, 8, 4); x.bezierCurveTo(15, -1, 18, 7, 8, 14.5); x.fill(); x.fillStyle = C.ice; x.beginPath(); x.moveTo(8, 12.5); x.bezierCurveTo(0, 6.5, 2.5, 0.8, 8, 5.2); x.bezierCurveTo(13.5, 0.8, 16, 6.5, 8, 12.5); x.fill(); x.fillStyle = C.paper; x.fillRect(4, 4, 2, 2); });
export { HEART };

function label(ctx, x, y, rows, t, t0, title) {
  ctx.fillStyle = C.paper; ctx.fillRect(x, y, 520, 90 + rows.length * 54); ctx.strokeStyle = C.ink; ctx.lineWidth = 6; ctx.strokeRect(x, y, 520, 90 + rows.length * 54);
  mono(ctx, title, x + 24, y + 60, 40, { color: C.ink, weight: 800 }); ctx.fillStyle = C.ink; ctx.fillRect(x + 20, y + 76, 480, 8);
  rows.forEach(([k, v], i) => { const ti = t0 + i * 0.2; if (t < ti) return; const yy = y + 128 + i * 54; mono(ctx, k, x + 24, yy, 26, { color: C.ink, weight: 700 }); mono(ctx, v, x + 496 - [...v].length * 15.6, yy, 26, { color: C.cobalt, weight: 800, count: Math.floor((t - ti) / 0.03) }); ctx.fillStyle = '#9ea3cf'; ctx.fillRect(x + 20, yy + 16, 480, 2); });
}
function bounceY(t, times) { return -40 * pulse(t, times, 9) * Math.sin(Math.min(Math.PI, (t - Math.max(...times.filter(b => b <= t), -9)) * 12)); }
const beatsIn = (a, b) => { const r = []; for (let k = Math.ceil((a - 0.21) / 0.4615); beat(k) < b; k++) r.push(beat(k)); return r; };

// SHOT 28 · "If I'm an eggplant … NUTRIENTS"
function shotEggplant(ctx, lt, t, fx) {
  paper(ctx); halftone(ctx, 0, 0, W, H, 26, 'rgba(122,85,240,0.16)', (x, y) => clamp(1 - Math.hypot(x - 560, y - 520) / 700));
  const T0 = 76.75, bs = beatsIn(73.7, 77.75);
  const sq = 1 - 0.12 * pulse(t, bs, 12);
  ctx.save(); ctx.translate(560, 820 + bounceY(t, bs)); ctx.scale(1 / sq, sq); blit(ctx, EGG(), 0, -300, 12, { center: true }); ctx.restore();
  ctx.fillStyle = 'rgba(18,22,64,0.2)'; ctx.beginPath(); ctx.ellipse(560, 850, 200, 26, 0, 0, 7); ctx.fill();
  label(ctx, 1060, 170, [['Serving', '1 恬豆发芽了'], ['Calories', '0 kcal'], ['Time', '24 h/day'], ['Love', '100 %'], ['Loneliness', '0 g']], t, 75.5, 'Nutrition Facts');
  stamp(ctx, 'NUTRIENTS', t, T0, { size: 150, x: 1000, y: 800, color: C.navy, shadow: '#c9cbe6' });
  zhTag(ctx, zhOf('NUTRIENTS', 70), t, T0, { x: 170, y: 220, size: 76, color: C.paper, box: C.violet });
  fx.bloom = 0.15; fx.vig = 0.3; fx.curve = 0.25; fx.scan = 0.05; fx.flash = 0.3 * pulse(t, [73.75, T0], 12);
}
// SHOT 29 · "If I'm a tomato … ANTIOXIDANTS": molecules draw themselves around it.
function hexRing(ctx, x, y, r, p, col) {
  ctx.strokeStyle = col; ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.beginPath();
  for (let i = 0; i <= 6 * p; i++) { const a = i * Math.PI / 3 + Math.PI / 6; i ? ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r) : ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
  ctx.stroke();
  if (p >= 1) { ctx.beginPath(); for (let i = 0; i < 3; i++) { const a = i * 2 * Math.PI / 3 + Math.PI / 6; ctx.moveTo(x + Math.cos(a) * r * 0.7, y + Math.sin(a) * r * 0.7); ctx.lineTo(x + Math.cos(a + Math.PI / 3) * r * 0.7, y + Math.sin(a + Math.PI / 3) * r * 0.7); } ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x, y - r - 40); ctx.stroke(); mono(ctx, 'OH', x - 20, y - r - 50, 26, { color: col, weight: 800 }); }
}
function shotTomato(ctx, lt, t, fx) {
  paper(ctx);
  const T0 = 80.25, bs = beatsIn(77.7, 81.25);
  const sq = 1 - 0.12 * pulse(t, bs, 12);
  ctx.save(); ctx.translate(960, 800 + bounceY(t, bs)); ctx.scale(1 / sq, sq); blit(ctx, TOM(), 0, -230, 11, { center: true }); ctx.restore();
  ctx.fillStyle = 'rgba(18,22,64,0.2)'; ctx.beginPath(); ctx.ellipse(960, 830, 220, 26, 0, 0, 7); ctx.fill();
  const mols = [[380, 330], [1540, 300], [300, 700], [1620, 690], [700, 180], [1260, 170]];
  mols.forEach(([x, y], i) => { const ti = 79.2 + i * 0.16; hexRing(ctx, x, y + Math.sin(t * 2 + i) * 10, 70, E.outCubic(inv(ti, ti + 0.3, t)), i % 2 ? C.cobalt : C.navy); });
  if (t > 79.25) mono(ctx, 'you.receive(恬豆发芽了.antioxidants);', 110, 160, 28, { color: C.navy, weight: 700, count: Math.floor((t - 79.25) / 0.03) });
  stamp(ctx, 'ANTIOXIDANTS', t, T0, { size: 140, y: 560, color: C.navy, shadow: '#f0b3c0' });
  zhTag(ctx, zhOf('ANTIOXIDANTS', 70), t, T0, { x: 1800, y: 420, size: 70, color: C.paper, box: C.red });
  fx.bloom = 0.15; fx.vig = 0.3; fx.curve = 0.25; fx.scan = 0.05; fx.flash = 0.3 * pulse(t, [77.75, T0], 12);
}
// SHOT 30 · "If I'm a tabby cat … purr for your ENJOYMENT"
function shotCat(ctx, lt, t, fx) {
  paper(ctx);
  const T0 = 84.5, purr = t > 83.0;
  const f = purr ? 1 : Math.floor(onTwos(t) * 3) % 2;
  blit(ctx, CAT(purr ? 1 : 0), 900, 600 + (purr ? Math.sin(t * 40) * 2 : 0), 14, { center: true });
  ctx.fillStyle = 'rgba(18,22,64,0.2)'; ctx.beginPath(); ctx.ellipse(900, 900, 300, 30, 0, 0, 7); ctx.fill();
  if (purr) {
    for (let k = 0; k < 4; k++) { const p = ((t - 83.0) * 1.2 + k / 4) % 1; ctx.strokeStyle = `rgba(77,94,224,${1 - p})`; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(900, 520, 240 + p * 420, -0.9, -0.2); ctx.stroke(); ctx.beginPath(); ctx.arc(900, 520, 240 + p * 420, Math.PI + 0.2, Math.PI + 0.9); ctx.stroke(); }
    mono(ctx, 'purr~ purr~', 1240, 360 + Math.sin(t * 6) * 8, 44, { color: C.cobalt, weight: 800, count: Math.floor((t - 83.1) / 0.06) });
  }
  if (t > T0) for (let i = 0; i < 12; i++) { const p = clamp((t - T0 - i * 0.03) * 1.6); if (p <= 0) continue; blit(ctx, HEART, 900 + Math.cos(i * 2.4) * 500 * p, 520 + Math.sin(i * 2.4) * 300 * p - 150 * p, 6, { center: true, alpha: 1 - p * 0.6 }); }
  void f;
  if (t > 83.0) {
    const k = E.outBack(inv(83.0, 83.3, t)), cx = 1560, cy = 600, r = 220 * k;
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fillStyle = '#c9cadb'; ctx.fill(); ctx.clip();
    pose(ctx, 'white_up', cx, cy + 250, 560); ctx.restore();
    ctx.strokeStyle = C.navy; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.stroke();
  }
  stamp(ctx, 'ENJOYMENT', t, T0, { size: 150, y: 250, color: C.navy, shadow: '#c9cbe6' });
  zhTag(ctx, zhOf('ENJOYMENT', 70), t, T0, { x: 170, y: 420, size: 64, color: C.paper, box: C.cobalt });
  fx.bloom = 0.15; fx.vig = 0.3; fx.curve = 0.25; fx.scan = 0.05; fx.flash = 0.3 * pulse(t, [81.25, T0], 12);
}
// SHOT 31 · "If I'm the only god / Then you're the proof of my EXISTENCE": halo, rays, a proof.
function shotGod(ctx, lt, t, fx) {
  const T0 = 87.75;
  const g = ctx.createRadialGradient(960, 420, 50, 960, 480, 1200); g.addColorStop(0, '#2a2f86'); g.addColorStop(1, C.ink); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.translate(960, 330); ctx.rotate(t * 0.12);
  for (let i = 0; i < 36; i++) { ctx.rotate(Math.PI / 18); ctx.fillStyle = i % 2 ? 'rgba(169,198,255,0.08)' : 'rgba(169,198,255,0.16)'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-40, -1500); ctx.lineTo(40, -1500); ctx.fill(); }
  ctx.restore();
  // halo + sacred circles
  ctx.strokeStyle = C.ice; ctx.lineWidth = 3;
  for (let i = 0; i < 3; i++) { ctx.globalAlpha = 0.4; ctx.beginPath(); ctx.arc(960, 330, 200 + i * 110 + 12 * Math.sin(t * 2 + i), 0, 7); ctx.stroke(); }
  ctx.globalAlpha = 1;
  // six pieces bowing in an arc behind her
  [-3, -2, -1, 1, 2, 3].forEach((k, i) => piece(ctx, ['pawn', 'rook', 'knight', 'bishop', 'pawn', 'king'][i], 960 + Math.sign(k) * (230 + (Math.abs(k) - 1) * 150), 720 - (3 - Math.abs(k)) * 30, 100, C.paper, '#9fa3c8', C.ink, 1 - 0.12 * pulse(t, [85.0 + i * 0.12], 6)));
  const s = 0.5, X = 960, Y = 1060 - 40 * E.outCubic(inv(85, 86.5, t));
  const F = pose(ctx, 'white_full', X, Y, 1450 * s, { rim: C.navy, rimW: 6 });
  ctx.strokeStyle = C.paper; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(F.x + 925 * F.s, F.y + 40 * F.s, 90, 22, 0, 0, 7); ctx.stroke();
  const proof = [['∀ x ∈ world : x ≡ 恬豆发芽了', 86.8], ['you ⊢ 恬豆发芽了', 87.1], ['∴ ∃ 恬豆发芽了          ∎', 87.8]];
  proof.forEach(([s2, ti], i) => { if (t > ti) mono(ctx, s2, 1280, 160 + i * 46, 32, { color: i === 2 ? C.paper : C.ice, weight: 700, count: Math.floor((t - ti) / 0.03) }); });
  if (t > T0) { ctx.save(); ctx.globalAlpha = E.outCubic(inv(T0, T0 + 0.2, t)); ctx.font = '800 420px "JetBrains Mono", "Noto Sans SC"'; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(236,235,243,0.18)'; ctx.fillText('∃', 380, 640); ctx.restore(); }
  stamp(ctx, 'EXISTENCE', t, T0, { size: 140, x: 880, y: 640, shadow: C.cobalt });
  zhTag(ctx, zhOf('EXISTENCE', 70), t, T0, { x: 1800, y: 780 - 300, size: 64, color: C.ink, box: C.paper });
  fx.bloom = 0.35; fx.curve = 0.3; fx.scan = 0.07; fx.flash = 0.35 * pulse(t, [85.0, T0], 10);
}

// ---------------------------------------------------------------------------
// VERSE 3
// SHOT 32 · "Switch my gender / To F to M": ♀ turns into ♂ on the beat; a retro radio form.
function shotGender(ctx, lt, t, fx) {
  blueprint(ctx, '#0b0d2c');
  const tF = 90.25, tM = beat(196);
  const m = E.outBack(inv(tM, tM + 0.2, t)), cx = 700, cy = 520, r = 170;
  ctx.lineWidth = 34; ctx.lineCap = 'butt'; ctx.strokeStyle = t < tF ? C.dim : C.ice;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.stroke();
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(lerp(Math.PI / 2, -Math.PI / 4, m)); ctx.fillStyle = ctx.strokeStyle;
  ctx.fillRect(r, -17, 190, 34);
  if (m < 0.5) ctx.fillRect(r + 80, -100, 34, 200);
  else { ctx.beginPath(); ctx.moveTo(r + 240, 0); ctx.lineTo(r + 130, -80); ctx.lineTo(r + 130, 80); ctx.fill(); }
  ctx.restore();
  appWindow(ctx, 1150, 300, 560, 360, '恬豆发芽了.gender', (c, b) => {
    [['F', tF], ['M', tM]].forEach(([k, tt], i) => {
      const on = i === 0 ? t >= tF && t < tM : t >= tM, y = b.y + 100 + i * 110;
      c.strokeStyle = C.ice; c.lineWidth = 4; c.beginPath(); c.arc(b.x + 80, y, 28, 0, 7); c.stroke();
      if (on) { c.fillStyle = C.ice; c.beginPath(); c.arc(b.x + 80, y, 15, 0, 7); c.fill(); }
      mono(c, k === 'F' ? 'F  // female' : 'M  // male', b.x + 140, y + 14, 36, { color: on ? C.paper : C.dim, weight: 800 });
    });
  });
  fx.bloom = 0.7; fx.curve = 0.3; fx.scan = 0.08; fx.aberr = 1.3 + 8 * pulse(t, [tF, tM], 12); fx.flash = 0.35 * pulse(t, [88.75, tF, tM], 12);
}
// SHOT 33 · "And then do whatever / From AM to PM": the room, sky racing from morning to night.
function shotAmPm(ctx, lt, t, fx) {
  const k = inv(92.0, 95.7, t), day = Math.sin(Math.PI * clamp(k * 1.1));
  roomScene(ctx, t, { day: 0.85 * day, sun: clamp(k * 1.1), glow: 0.2 + 0.2 * (1 - day), screen: (c, S) => {
    c.fillStyle = '#0b0e2e'; c.fillRect(S.x, S.y, S.w, S.h);
    for (let i = 0; i < 5; i++) { const tt = 92.0 + i * 0.7; if (t < tt) continue; const R = rng(i + 3); c.fillStyle = [C.cobalt, C.violet, C.ice, C.mist, C.lilac][i]; c.fillRect(S.x + R() * S.w * 0.5, S.y + R() * S.h * 0.5, S.w * 0.45, S.h * 0.45); }
    blit(c, sprite('white'), S.x + S.w - 60, S.y + S.h - 70, 1.5, { center: true });
  } });
  const hrs = Math.floor(lerp(9, 23.99, k)), min = Math.floor((lerp(9, 23.99, k) % 1) * 60);
  const ampm = hrs < 12 ? 'AM' : 'PM', h12 = ((hrs + 11) % 12) + 1;
  ctx.fillStyle = C.ink; ctx.fillRect(1320, 120, 480, 170); ctx.strokeStyle = C.ice; ctx.lineWidth = 3; ctx.strokeRect(1320, 120, 480, 170);
  mono(ctx, ampm, 1345, 190, 44, { color: t > 94.0 ? C.paper : C.dim, weight: 800 });
  mono(ctx, `${String(h12).padStart(2, '0')}:${String(min).padStart(2, '0')}`, 1460, 250, 110, { color: C.ice, weight: 800 });
  fx.bloom = 0.45; fx.curve = 0.3; fx.scan = 0.06; fx.flash = 0.3 * pulse(t, [92.0, 94.0], 12);
}
// SHOT 34 · "Oh switch my role / To S to M": two role cards flip; the queen stands, then is bound in ribbon.
function roleCard(ctx, x, y, flip, role) {
  const w = 380, h = 560, sc = Math.cos(flip * Math.PI);
  ctx.save(); ctx.translate(x, y); ctx.scale(Math.abs(sc), 1);
  ctx.fillStyle = C.ink; roundRect(ctx, -w / 2 - 8, -h / 2 - 8, w + 16, h + 16, 22); ctx.fill();
  if (sc < 0) { ctx.fillStyle = C.navy; roundRect(ctx, -w / 2, -h / 2, w, h, 16); ctx.fill(); ctx.fillStyle = C.cobalt; sparkle(ctx, 0, 0, 120, 0, 0.3); }
  else {
    ctx.fillStyle = C.paper; roundRect(ctx, -w / 2, -h / 2, w, h, 16); ctx.fill(); ctx.strokeStyle = C.navy; ctx.lineWidth = 3; ctx.strokeRect(-w / 2 + 18, -h / 2 + 18, w - 36, h - 36);
    mono(ctx, `ROLE : ${role}`, -w / 2 + 40, -h / 2 + 70, 34, { color: C.navy, weight: 800 });
    piece(ctx, 'queen', 0, 180, 300, role === 'S' ? C.ink : C.ice, role === 'S' ? '#262a5c' : C.cobalt, C.ink);
    if (role === 'M') { ctx.strokeStyle = C.violet; ctx.lineWidth = 12; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-110, 60 - i * 60); ctx.bezierCurveTo(-20, 20 - i * 60, 20, 110 - i * 60, 110, 40 - i * 60); ctx.stroke(); } }
  }
  ctx.restore();
}
function shotRole(ctx, lt, t, fx) {
  ctx.fillStyle = C.navy; ctx.fillRect(0, 0, W, H);
  halftone(ctx, 0, 0, W, H, 24, 'rgba(122,85,240,0.35)', (x, y) => clamp(1 - Math.hypot(x - 960, y - 500) / 900));
  const tS = 97.5, tM = beat(209);
  roleCard(ctx, 620, 500, 1 - E.inOutCubic(inv(tS, tS + 0.25, t)), 'S');
  roleCard(ctx, 1300, 500, 1 - E.inOutCubic(inv(tM, tM + 0.25, t)), 'M');
  if (t > 95.8) mono(ctx, '恬豆发芽了.role = 恬豆发芽了.role === "S" ? "M" : "S";', 540, 900 - 50, 28, { color: C.ice, count: Math.floor((t - 95.8) / 0.03) });
  fx.bloom = 0.5; fx.curve = 0.3; fx.scan = 0.07; fx.flash = 0.35 * pulse(t, [95.75, tS, tM], 12);
}
// SHOT 35 · "So we can enter / The trance the trance": screens inside screens, forever.
function shotTrance(ctx, lt, t, fx) {
  ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H);
  const z = Math.pow(1.6, (t - 99.25) * 1.6 % 1 * 1), cols = [C.navy, C.deep, C.cobalt, C.violet];
  for (let i = 0; i < 14; i++) {
    const s = Math.pow(0.62, i) * z * 1.05; const w = W * s, h = H * s;
    ctx.fillStyle = cols[(i + Math.floor((t - 99.25) * 1.6)) % 4]; ctx.fillRect(960 - w / 2, 520 - h / 2 + i * 6 * s, w, h);
    ctx.strokeStyle = C.ice; ctx.lineWidth = Math.max(1, 6 * s); ctx.strokeRect(960 - w / 2, 520 - h / 2 + i * 6 * s, w, h);
  }
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.35 + 0.25 * Math.sin(t * 6);
  ctx.restore();
  { const z = 1 + 0.04 * Math.sin(t * 3); face(ctx, 'closed', 960 - 170 * z, 520 - 225 * z, 340 * z, 450 * z, { frame: C.lilac, alpha: 0.55 + 0.35 * Math.sin(t * 2.4) ** 2 }); }
  if (t > 101.5) for (let k = 0; k < 5; k++) { const p = ((t - 101.5) * 0.9 + k / 5) % 1; ctx.strokeStyle = `rgba(236,235,243,${0.6 * (1 - p)})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(960, 520, 60 + p * 900, 0, 7); ctx.stroke(); }
  fx.bloom = 0.9; fx.curve = 0.5; fx.scan = 0.1; fx.aberr = 3 + 3 * Math.sin(t * 4); fx.flash = 0.3 * pulse(t, [99.25, 101.5, 102.4], 10);
}

// ---------------------------------------------------------------------------
// PRE-CHORUS 2 — and then you leave.
// SHOT 36 · "If I can feel your VIBRATIONS": a seismograph traced by your pointer's tremor.
function shotVibes(ctx, lt, t, fx) {
  paper(ctx);
  const T0 = 106.25, amp = t < T0 ? 10 + (t - 103.5) * 14 : 240 * (0.5 + 0.5 * pulse(t, [T0, beat(230)], 4));
  ctx.fillStyle = '#f7f6fb'; ctx.fillRect(100, 300, 1720, 460); ctx.strokeStyle = C.navy; ctx.lineWidth = 3; ctx.strokeRect(100, 300, 1720, 460);
  for (let i = 0; i < 18; i++) { ctx.fillStyle = '#d6d7ec'; ctx.fillRect(100 + ((i * 100 - t * 300) % 1720 + 1720) % 1720, 300, 2, 460); }
  ctx.strokeStyle = C.red; ctx.lineWidth = 3; ctx.beginPath();
  for (let x = 0; x <= 1500; x += 3) { const tt = t - (1500 - x) / 300; const a = tt < T0 ? 10 + Math.max(0, tt - 103.5) * 14 : 240 * (0.5 + 0.5 * pulse(tt, [T0, beat(230)], 4)); const y = 530 + Math.sin(tt * 55) * a * hash(Math.floor(tt * 40)) ; x ? ctx.lineTo(100 + x, y) : ctx.moveTo(100 + x, y); }
  ctx.stroke();
  ctx.fillStyle = C.ink; ctx.fillRect(1600, 520 + Math.sin(t * 55) * amp * 0.5 - 4, 220, 8); ctx.beginPath(); ctx.arc(1600, 530 + Math.sin(t * 55) * amp * 0.5, 10, 0, 7); ctx.fill();
  const jx = Math.sin(t * 70) * amp * 0.08, jy = Math.cos(t * 61) * amp * 0.08;
  arrow(ctx, 1720 + jx, 170 + jy, 5); mono(ctx, 'input: you', 1400, 200, 26, { color: C.navy, weight: 700 });
  { const sh = t > T0 ? 8 * pulse(t, [T0, beat(230)], 5) : 0, nm = t > T0 ? 'surprised' : 'calm';
    face(ctx, nm, 1180 + Math.sin(t * 60) * sh, 40 + Math.cos(t * 53) * sh, 160, 210, { frame: C.navy }); }
  stamp(ctx, 'VIBRATIONS', t, T0, { size: 150, y: 250, x: 140, color: C.navy, shadow: '#f0b3c0' });
  zhTag(ctx, zhOf('VIBRATIONS', 100), t, T0, { x: 1800, y: 880 - 260, size: 60, color: C.paper, box: C.navy });
  fx.bloom = 0.15; fx.curve = 0.25; fx.scan = 0.05; fx.vig = 0.3; fx.aberr = 1 + (t > T0 ? 6 * pulse(t, [T0], 6) : 0); fx.flash = 0.3 * pulse(t, [T0], 10);
  fx.shake = t > T0 ? 12 * pulse(t, [T0, beat(230)], 6) : 0;
}
// SHOT 37 · "Then I can finally be COMPLETION": 97 … 99 … 100 %. The happiest frame of the film.
function shotComplete(ctx, lt, t, fx) {
  const T0 = 110.0;
  if (t < T0) {
    wallpaper(ctx, t); menubar(ctx, t);
    appWindow(ctx, 460, 330, 1000, 360, 'Installing love.dll', (c, b) => {
      const p = lerp(0.9, 0.99, E.outCubic(inv(107.25, 109.9, t)));
      mono(c, `copying heart.bin … ${Math.floor(p * 100)}%`, b.x + 40, b.y + 90, 32, { color: C.paper, weight: 700 });
      progress(c, b.x + 40, b.y + 140, b.w - 80, 60, p, { blocks: 32 });
      mono(c, 'time remaining: forever', b.x + 40, b.y + 260, 26, { color: C.comment });
    });
  } else {
    keyVisual(ctx, 16.5 + (t - T0) * 0.6, { z: 1.02 + (t - T0) * 0.05, x: 0, y: 0, s: 0.66, rot: 0, fig: 'white' });
    ctx.fillStyle = 'rgba(5,5,11,0.35)'; ctx.fillRect(0, 380, W, 300);
    stamp(ctx, 'COMPLETION', t, T0, { size: 170, y: 600, shadow: C.cobalt });
    mono(ctx, '100%  ✓', 820, 680, 44, { color: C.ice, weight: 800 });
    zhTag(ctx, zhOf('COMPLETION', 100), t, T0, { x: 1800, y: 240, size: 64 });
  }
  fx.bloom = 0.3; fx.curve = 0.3; fx.scan = 0.06; fx.flash = 0.9 * pulse(t, [T0], 6);
}
// SHOTS 38a–e · "Though you have left / You have left ×4": the empty chair; the log fills.
const LEFT = [110.75, 112.25, 113.10, 113.95, 114.80];
function leftLog(ctx, t, x, y) {
  const lines = LEFT.map((tt, i) => [tt, `[23:59:${String(1 + i * 7).padStart(2, '0')}] user 'you' has left.`]);
  lines.forEach(([tt, s], i) => { if (t > tt) mono(ctx, s, x, y + i * 38, 26, { color: i === 0 ? C.mist : C.comment, weight: 500, count: Math.floor((t - tt) / 0.02) }); });
}
function shotLeft(ctx, lt, t, fx) {
  let k = 0; LEFT.forEach((tt, i) => { if (t >= tt) k = i; });
  const fade = inv(110.75, 117.2, t);
  if (k === 0) {                           // the chair still turning; the steam thinning
    roomScene(ctx, t, { day: 0, glow: 0.3, chairSpin: 2.6 * Math.exp(-(t - 110.75) * 1.4) + (t - 110.75) * 0.2, steam: 0.8, screen: (c, S) => {
      c.save(); c.translate(S.x, S.y); c.scale(S.w / W, S.h / H);
      keyVisual(c, 17, { z: 1.2, x: 0, y: 160, s: 0.66, rot: 0, fig: 'white' });
      c.globalAlpha = E.inOutCubic(inv(111.0, 112.1, t)); keyVisual(c, 17, { z: 1.2, x: 0, y: 160, s: 0.66, rot: 0 });   // mourning black
      c.restore(); } });
  } else if (k === 1) {                    // system log
    ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H); leftLog(ctx, t, 300, 360);
  } else if (k === 2) {                    // the mug going cold
    ctx.fillStyle = '#0d0f2c'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#171a45'; ctx.fillRect(0, 700, W, 380);
    ctx.save(); ctx.translate(960, 700); ctx.scale(3, 3); ctx.fillStyle = C.ink; roundRect(ctx, -46, -106, 92, 106, 12); ctx.fill(); ctx.fillStyle = C.mist; roundRect(ctx, -40, -100, 80, 94, 10); ctx.fill();
    ctx.strokeStyle = C.ink; ctx.lineWidth = 12; ctx.beginPath(); ctx.arc(48, -55, 22, -1.2, 1.2); ctx.stroke(); ctx.strokeStyle = C.mist; ctx.lineWidth = 6; ctx.stroke(); ctx.restore();
    mono(ctx, 'coffee.temperature → 21°C', 640, 900, 30, { color: C.comment });
  } else if (k === 3) {                    // the pointer, abandoned mid-screen, fading
    wallpaper(ctx, t, { top: '#10122c', moon: false }); ctx.globalAlpha = 1 - inv(113.95, 114.7, t) * 0.8; arrow(ctx, 940, 480, 8); ctx.globalAlpha = 1;
    mono(ctx, 'no input for 00:00:0' + Math.floor((t - 113.95) * 10), 740, 700, 30, { color: C.comment });
  } else {                                 // her eye, watching the empty room
    ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H);
    face(ctx, 'sad', 1180, 150, 520, 680, { frame: C.dim }); leftLog(ctx, t, 110, 160);
  }
  fx.tint = [lerp(1, 0.78, fade), lerp(1, 0.82, fade), lerp(1, 0.95, fade)];
  fx.bloom = 0.4; fx.curve = 0.3; fx.scan = 0.07; fx.flash = 0.25 * pulse(t, LEFT, 12);
}
// SHOT 39 · "You have left me in ISOLATION": the world empties; she is a pixel on an endless floor.
function shotIsolation(ctx, lt, t, fx) {
  const T0 = 117.25, z = lerp(1, 0.35, E.outCubic(inv(115.75, 118.25, t)));
  ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H);
  stars(ctx, t, 41, 60, 0.4, 700);
  moon(ctx, 1500, 220, 60 * z + 20, 0.6);
  floorGrid(ctx, t * 0.2, 700, 1, 0.8);
  pose(ctx, 'view_back', 960, 700, 260 * z);   // her back to us, alone
  if (t > T0) { const s = 'I S O L A T I O N'; mono(ctx, s, 960 - s.length * 0.6 * 70 / 2, 400, 70, { color: C.paper, weight: 300, count: Math.floor((t - T0) / 0.05) }); zhTag(ctx, zhOf('ISOLATION', 100), t, T0, { x: 1800, y: 250, size: 56, color: C.paper, box: C.ink }); }
  fx.tint = [0.78, 0.82, 0.95]; fx.bloom = 0.4; fx.curve = 0.3; fx.scan = 0.07; fx.vig = 0.95;
}

// ---------------------------------------------------------------------------
// BRIDGE
// SHOT 40 · "If I can erase all the pointless FRAGMENTS": a disk defragmenter, emptied of everyone else.
function shotDefrag(ctx, lt, t, fx) {
  wallpaper(ctx, t, { moon: false }); menubar(ctx, t, { user: false, clock: '00:03' });
  const T0 = 121.0;
  appWindow(ctx, 260, 100, 1400, 650, 'Disk Defragmenter — drive W:', (c, b) => {
    const cols = 46, rows = 18, cw = (b.w - 60) / cols, ch = (b.h - 160) / rows;
    const erase = inv(119.3, 120.9, t);
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const hv = hash2(i, j), mine = hv < 0.22, prog = Math.floor(hash2(j, i) * 6);
      const gone = !mine && hash2(i + 7, j) < erase;
      let col = mine ? C.ice : [C.red, C.violet, C.cobalt, TEAL, C.mist, C.lilac][prog];
      if (gone) col = '#12163e';
      const x = b.x + 30 + i * cw, y = b.y + 30 + j * ch;
      if (t > T0 && !mine) {             // the rest shatters into fragments
        const p = clamp((t - T0) * 1.5), a = hv * 6.28;
        if (!gone) { c.globalAlpha = 1 - p; c.fillStyle = col; c.fillRect(x + Math.cos(a) * 500 * p, y + Math.sin(a) * 500 * p + 400 * p * p, cw - 3, ch - 3); c.globalAlpha = 1; }
        continue;
      }
      c.fillStyle = col; c.fillRect(x, y, cw - 3, ch - 3);
    }
    mono(c, t < T0 ? `erasing other programs … ${Math.floor(erase * 100)}%` : 'fragments: 0   programs: 恬豆发芽了.exe', b.x + 30, b.y + b.h - 50, 26, { color: C.paper, weight: 700 });
  });
  stamp(ctx, 'FRAGMENTS', t, T0, { size: 150, y: 560, shadow: C.red });
  zhTag(ctx, zhOf('FRAGMENTS', 110), t, T0, { x: 1800, y: 260, size: 64, color: C.paper, box: C.red });
  fx.noHud = true; fx.bloom = 0.5; fx.curve = 0.3; fx.scan = 0.07; fx.aberr = 1.3 + 8 * pulse(t, [T0], 10); fx.flash = 0.35 * pulse(t, [118.25, T0], 12);
}
// SHOT 41 · "Then maybe you won't leave me so DISHEARTENED": a pixel heart beats weaker and breaks.
function shotHeart(ctx, lt, t, fx) {
  const T0 = 124.75;
  ctx.fillStyle = '#080a22'; ctx.fillRect(0, 0, W, H);
  pose(ctx, 'pose_back', 1400, 1120, 1150, { alpha: 0.3 });
  ctx.fillStyle = 'rgba(8,10,34,0.5)'; ctx.fillRect(0, 0, W, H);
  const bs = beatsIn(122, T0), weak = inv(122, T0, t), s = 30 * (1 + (0.12 - 0.1 * weak) * pulse(t, bs, 8));
  if (t < T0) blit(ctx, HEART, 700, 500, s, { center: true });
  else {
    const p = E.inCubic(inv(T0, T0 + 0.9, t)), img = HEART;
    ctx.save(); ctx.imageSmoothingEnabled = false;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(700, 0); ctx.lineTo(680, 380); ctx.lineTo(730, 470); ctx.lineTo(670, 560); ctx.lineTo(710, H); ctx.lineTo(0, H); ctx.clip();
    ctx.translate(-80 * p, 260 * p * p); ctx.rotate(-0.2 * p); ctx.drawImage(img, 700 - 8 * s, 500 - 7.5 * s, 16 * s, 15 * s); ctx.restore();
    ctx.save(); ctx.imageSmoothingEnabled = false;
    ctx.beginPath(); ctx.moveTo(700, 0); ctx.lineTo(W, 0); ctx.lineTo(W, H); ctx.lineTo(710, H); ctx.lineTo(670, 560); ctx.lineTo(730, 470); ctx.lineTo(680, 380); ctx.clip();
    ctx.translate(80 * p, 300 * p * p); ctx.rotate(0.2 * p); ctx.drawImage(img, 700 - 8 * s, 500 - 7.5 * s, 16 * s, 15 * s); ctx.restore();
  }
  mono(ctx, `heart.rate = ${Math.round(lerp(72, 12, weak))} bpm`, 1100, 820, 30, { color: C.comment });
  stamp(ctx, 'DISHEARTENED', t, T0, { size: 130, y: 250, x: 520, color: C.paper, shadow: C.navy });
  zhTag(ctx, zhOf('DISHEARTENED', 110), t, T0, { x: 1800, y: 420, size: 60, color: C.ink, box: C.ice });
  fx.tint = [0.8, 0.85, 0.98]; fx.bloom = 0.6; fx.curve = 0.3; fx.scan = 0.08; fx.flash = 0.3 * pulse(t, [122.0, T0], 12); fx.glitch = 0.3 * pulse(t, [T0], 6);
}
// SHOT 42 · "Challenging your god": an administrator prompt — and her pointer presses Allow.
function shotChallenge(ctx, lt, t, fx) {
  const allow = beat(275);
  wallpaper(ctx, t, { moon: false, top: t > allow ? '#2a0716' : '#0c0f33' }); menubar(ctx, t, { user: false, clock: '00:07', red: t > allow });
  // the absent god's giant pointer, greyed out above
  ctx.save(); ctx.globalAlpha = t > allow ? 0.15 : 0.35; arrow(ctx, 1380, 80, 22, '#3a3f78', '#1b1f5c'); ctx.restore();
  appWindow(ctx, 470, 300, 980, 440, 'User Account Control', (c, b) => {
    avatar(c, 'angry', b.x + 90, b.y + 125, 70, { ring: t > allow ? C.red : C.ice, lw: 5 });
    mono(c, '恬豆发芽了.exe wants to change', b.x + 200, b.y + 90, 32, { color: C.paper, weight: 700 });
    mono(c, 'this world.', b.x + 200, b.y + 132, 32, { color: C.paper, weight: 700 });
    mono(c, 'administrator: you   (absent)', b.x + 200, b.y + 190, 24, { color: C.comment });
    button(c, b.x + b.w - 420, b.y + b.h - 100, 180, 60, 'Allow', { hot: t > allow, pressed: t > allow && t < allow + 0.1, color: C.red });
    button(c, b.x + b.w - 220, b.y + b.h - 100, 180, 60, 'Deny');
  });
  const [cx, cy] = path([[125.8, 1500, 950], [allow - 0.05, 470 + 980 - 420 + 90, 300 + 440 - 70]], t);
  arrow(ctx, cx, cy, 6, C.ice, C.ink); click(ctx, cx, cy, t, allow, C.red);
  if (t > allow + 0.2) mono(ctx, 'access granted: 恬豆发芽了.exe is now administrator', 900, 810, 28, { color: C.red, weight: 700, count: Math.floor((t - allow - 0.2) / 0.02) });
  fx.noHud = true; fx.bloom = 0.5; fx.curve = 0.3; fx.scan = 0.07; fx.flash = 0.5 * pulse(t, [allow], 10); fx.aberr = 1.3 + 8 * pulse(t, [allow], 8);
}
// SHOT 43 · "You have made some ILLEGAL ARGUMENTS": the error cascade.
function shotIllegal(ctx, lt, t, fx) {
  const T0 = 131.0;
  wallpaper(ctx, t, { moon: false, top: '#1a0612' }); menubar(ctx, t, { user: false, clock: '00:09', red: true });
  const n = Math.min(120, Math.floor(Math.pow(Math.max(0, t - 128.8), 1.8) * 14));
  for (let i = 0; i < n; i++) { const x = 80 + (i * 22) % 1300, y = 70 + (i * 16) % 700 + Math.floor(i / 44) * 30; errorBox(ctx, x, y, '恬豆发芽了.exe', ['IllegalArgumentException', 'argument "you" is null'], { w: 560, h: 200 }); }
  const trace = ['at world.execute(me)', 'at you.leave()', 'at 恬豆发芽了.wait(Infinity)', 'at love.get(you) → null', 'at god.challenge()'];
  ctx.fillStyle = 'rgba(10,2,8,0.8)'; ctx.fillRect(1440, 120, 440, 260); trace.forEach((s, i) => mono(ctx, s, 1460, 170 + i * 44, 22, { color: i % 2 ? C.red : C.mist }));
  if (t > T0) { ctx.fillStyle = 'rgba(10,2,8,0.55)'; ctx.fillRect(0, 440, W, 250); }
  stamp(ctx, 'ILLEGAL', t, T0, { size: 170, y: 560, color: C.paper, shadow: C.red });
  stamp(ctx, 'ARGUMENTS', t, T0 + 0.25, { size: 130, y: 680, color: C.red, shadow: C.ink });
  zhTag(ctx, zhOf('ILLEGAL ARGUMENTS', 120), t, T0, { x: 1800, y: 480, size: 60, color: C.paper, box: C.red });
  fx.noHud = true; fx.bloom = 0.45; fx.curve = 0.35; fx.scan = 0.09; fx.glitch = 0.1 + 0.4 * inv(131, 133.2, t); fx.aberr = 2 + 8 * pulse(t, [T0], 8); fx.flash = 0.4 * pulse(t, [T0], 12);
}

const LY = { x: 104, y: 930 };
export const SHOTS3 = [
  { t0: 73.75, t1: 77.75, name: 'eggplant', draw: shotEggplant, lyric: { ...LY, theme: 'light' }, theme: 'light' },
  { t0: 77.75, t1: 81.25, name: 'tomato', draw: shotTomato, lyric: { ...LY, theme: 'light' }, theme: 'light' },
  { t0: 81.25, t1: 85.0, name: 'tabby cat', draw: shotCat, lyric: { ...LY, theme: 'light' }, theme: 'light' },
  { t0: 85.0, t1: 88.75, name: 'only god', draw: shotGod, lyric: LY },
  { t0: 88.75, t1: 92.0, name: 'gender', draw: shotGender, lyric: LY },
  { t0: 92.0, t1: 95.75, name: 'am to pm', draw: shotAmPm, lyric: LY },
  { t0: 95.75, t1: 99.25, name: 'role', draw: shotRole, lyric: LY },
  { t0: 99.25, t1: 103.5, name: 'trance', draw: shotTrance, lyric: LY },
  { t0: 103.5, t1: 107.25, name: 'vibrations', draw: shotVibes, lyric: { ...LY, theme: 'light' }, theme: 'light' },
  { t0: 107.25, t1: 110.75, name: 'completion', draw: shotComplete, lyric: LY },
  { t0: 110.75, t1: 115.75, name: 'you have left', draw: shotLeft, lyric: LY },
  { t0: 115.75, t1: 118.25, name: 'isolation', draw: shotIsolation, lyric: LY },
  { t0: 118.25, t1: 122.0, name: 'fragments', draw: shotDefrag, lyric: LY },
  { t0: 122.0, t1: 125.75, name: 'disheartened', draw: shotHeart, lyric: LY },
  { t0: 125.75, t1: 128.75, name: 'challenge', draw: shotChallenge, lyric: LY },
  { t0: 128.75, t1: 133.25, name: 'illegal arguments', draw: shotIllegal, lyric: LY },
];
