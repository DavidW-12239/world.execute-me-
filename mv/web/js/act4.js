// Act 4 · 2:13–3:29 — the interlude, EXECUTION ×12, the count, the last chorus, love, the uninstall.
import { W, H, C, beat, clamp, lerp, inv, E, hash, hash2, rng, onTwos, pulse, canvas, sparkle, focusLines, halftone, stripes, tinted, roundRect } from './lib.js';
import { mono } from './type.js';
import { getA, drawCut, layer, moon, stars, bgGrid, scanBars, vText, arrow, keyVisual, sticker, piece, floorGrid, drawBoard, PIECES, petals } from './shots.js';
import {
  RED, TEAL, crisp, blit, sprite, icon, PROGRAMS, deskIcon, wallpaper, menubar, appWindow, button, progress, errorBox,
  stamp, zhTag, path, click, roomScene, shatter,
} from './kit.js';
import { LYRICS } from './lyrics.js';
import { pose, face, avatar } from './cast.js';

const zhOf = (en, after) => LYRICS.find(l => l.en === en && l.t0 > after).zh;
const blueprint = (ctx, bg = '#0a0f3c') => { ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H); bgGrid(ctx, 30, '#121a55', 150, '#1d2672'); };
const EXE = Array.from({ length: 12 }, (_, i) => beat(320 + 2 * i));
const COUNT = Array.from({ length: 6 }, (_, i) => beat(344 + i));
const VERDICT = beat(350);

// ---------------------------------------------------------------------------
// INTERLUDE · 2:13 — she takes the board; every other piece gets a reticle.
const QUEEN_PATH = [[0.5, -0.5], [0.5, 1.5], [-1.5, 1.5], [-1.5, -1.5], [2.5, -1.5], [2.5, 0.5], [0.5, 0.5], [0.5, -0.5]];
function shotHunt(ctx, lt, t, fx) {
  const theta = -0.3 + (t - 133.25) * 0.05;
  const cam = drawBoard(ctx, t, lt, theta);
  const step = Math.floor((t - 133.6) / (2 * 0.4615)), sub = ((t - 133.6) / (2 * 0.4615)) % 1;
  const qi = clamp(step, 0, QUEEN_PATH.length - 2), a = QUEEN_PATH[qi], b = QUEEN_PATH[qi + 1];
  const mv = t < 133.6 ? 0 : E.inOutCubic(clamp(sub * 2));
  const qx = lerp(a[0], b[0], mv), qz = lerp(a[1], b[1], mv);
  const list = PIECES.filter(p => !p.me).map(p => ({ ...p })).concat([{ type: 'queen', me: true, x: qx, z: qz }])
    .map(p => ({ ...p, d: cam(p.x, 0, p.z)[2] })).sort((p, q) => q.d - p.d);
  // red searchlight
  ctx.save(); ctx.globalCompositeOperation = 'screen'; const sx = 960 + Math.sin(t * 1.3) * 600;
  const g = ctx.createRadialGradient(sx, 700, 20, sx, 700, 420); g.addColorStop(0, 'rgba(255,84,112,0.28)'); g.addColorStop(1, 'rgba(255,84,112,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
  for (const p of list) {
    const [bx, by] = cam(p.x, 0, p.z), [, ty] = cam(p.x, p.me ? 1.75 : p.type === 'pawn' ? 1.05 : 1.35, p.z), hh = by - ty;
    if (p.me) piece(ctx, 'queen', bx, by, hh, C.ice, C.cobalt, C.ink);
    else piece(ctx, p.type, bx, by, hh, C.paper, '#9fa3c8', C.ink, 1 - 0.04 * Math.sin(t * 30 + p.i));
    const lock = 134.0 + (p.i - 1) * 0.92;
    if (!p.me && t > lock) {                 // lock-on reticle
      const k = E.outBack(inv(lock, lock + 0.2, t)), r = hh * (1.6 - 0.6 * k), cy = by - hh * 0.5;
      ctx.save(); ctx.strokeStyle = RED; ctx.lineWidth = 3; ctx.translate(bx, cy); ctx.rotate((1 - k) * 2);
      ctx.beginPath(); ctx.arc(0, 0, r * 0.6, 0, 7); ctx.stroke();
      for (let i = 0; i < 4; i++) { ctx.rotate(Math.PI / 2); ctx.fillStyle = RED; ctx.fillRect(r * 0.4, -2, r * 0.45, 4); }
      ctx.restore();
      mono(ctx, `[${p.i}] ${p.name}.exe  TARGET`, bx + hh * 0.5, cy - hh * 0.6, 18, { color: RED, weight: 800 });
    }
  }
  const n = PIECES.filter(p => !p.me && t > 134.0 + (p.i - 1) * 0.92).length;
  mono(ctx, `TARGETS  ${n}/6`, 110, 150, 34, { color: RED, weight: 800 });
  fx.noLyric = true; fx.bloom = 0.6; fx.curve = 0.3; fx.scan = 0.08; fx.vig = 0.9; fx.aberr = 1.4 + 3 * pulse(t, [134, 134.92, 135.84, 136.76, 137.68, 138.6], 10);
}
// INTERLUDE · 2:20 — task manager; her pointer hovers over End Process; her eye in red.
function shotTaskman(ctx, lt, t, fx) {
  const cut = Math.floor((t - 140.51) / 0.923) % 2 === 1 && t < 147.3;
  if (cut) {
    const n = Math.floor((t - 140.51) / 0.923), z = 1 + (t - 140.5) * 0.02;
    ctx.fillStyle = '#12040c'; ctx.fillRect(0, 0, W, H);
    if (n % 4 === 1) face(ctx, 'angry', 960 - 330 * z, 520 - 430 * z, 660 * z, 860 * z, { frame: false });   // her anger
    else pose(ctx, 'pose_back', 900, 1180, 1250 * z);                                                          // a glance back
    ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = RED; ctx.fillRect(0, 0, W, H); ctx.restore();
    scanBars(ctx, 0, 0, W, H, 0.3, 4);
  } else {
    wallpaper(ctx, t, { moon: false, top: '#1a0612' }); menubar(ctx, t, { user: false, red: true, clock: '00:13' });
    appWindow(ctx, 360, 120, 1200, 760, 'Task Manager — world', (c, b) => {
      mono(c, 'PROCESS            CPU    MEMORY   STATUS', b.x + 40, b.y + 60, 26, { color: C.comment, weight: 700 });
      const procs = [...PROGRAMS.map(p => p.name), 'me.exe'];
      const hover = Math.min(5, Math.floor(inv(141, 146.5, t) * 6));
      procs.forEach((n, i) => {
        const y = b.y + 120 + i * 74, me = i === 6, cpu = me ? 0 : Math.round(20 + 60 * Math.abs(Math.sin(t * 3 + i)));
        if (!me && i === hover) { c.fillStyle = 'rgba(255,84,112,0.25)'; c.fillRect(b.x + 20, y - 44, b.w - 40, 64); }
        mono(c, n.padEnd(18, ' '), b.x + 40, y, 28, { color: me ? C.ice : C.paper, weight: me ? 800 : 500 });
        c.fillStyle = me ? C.ice : C.cobalt; c.fillRect(b.x + 400, y - 22, cpu * 1.6, 20);
        mono(c, `${String(cpu).padStart(3, ' ')}%   ${String(Math.round(40 + hash(i) * 400)).padStart(4, ' ')} MB  ${me ? 'waiting' : 'running'}`, b.x + 580, y, 26, { color: me ? C.ice : C.mist });
      });
      button(c, b.x + b.w - 330, b.y + b.h - 90, 290, 60, 'End Process', { hot: Math.sin(t * 12) > 0, color: RED });
    });
    const hover = Math.min(5, Math.floor(inv(141, 146.5, t) * 6));
    arrow(ctx, 1480 + Math.sin(t * 20) * 4, 120 + 34 + 120 + hover * 74 - 30, 6, RED, C.ink);
  }
  fx.noLyric = true; fx.noHud = !cut; fx.bloom = 0.5; fx.curve = 0.35; fx.scan = 0.09; fx.glitch = 0.05 + 0.5 * inv(145.5, 147.9, t) ** 2; fx.aberr = 2 + 6 * inv(143, 147.9, t);
  fx.flash = 0.8 * E.inExpo(inv(147.6, 147.9, t));
}

// ---------------------------------------------------------------------------
// EXECUTION ×12 — a different composition on every hit; the last four are 死刑.
function shotExecution(ctx, lt, t, fx) {
  let i = 0; EXE.forEach((b, k) => { if (t >= b) i = k; });
  const lt2 = t - EXE[i], death = i >= 8, p = pulse(t, [EXE[i]], 7);
  const tpl = i % 4;
  const bg = death ? (i % 2 ? RED : C.ink) : [C.ink, RED, C.paper, C.navy][tpl];
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  const fg = bg === C.ink || bg === C.navy ? C.paper : C.ink, acc = bg === RED ? C.ink : RED;
  if (tpl === 0) focusLines(ctx, 960, 540, 160, 380, acc, 11 + i, 0.8);
  if (tpl === 1) stripes(ctx, 0, 0, W, H, 60, bg, death ? '#d8445f' : '#e04a66', lt2 * 400, -0.6);
  if (tpl === 2) pose(ctx, ['view_side', 'pose_back', 'view_front'][Math.floor(i / 4) % 3], 960, 1090, 940, { tint: fg, rim: acc, rimW: 8 });
  if (tpl === 3) { const y = E.inCubic(clamp(lt2 * 4)) * H; ctx.fillStyle = acc; ctx.fillRect(0, y - 10, W, 20); }
  const shift = tpl === 3 ? (lt2 > 0.25 ? 18 : 0) : 0;
  stamp(ctx, 'EXECUTION', t, EXE[i], { size: 230, y: 620 - shift, x: W / 2 - 9 * 138 / 2 - shift, color: fg, shadow: acc, decode: 0.12 });
  vText(ctx, death ? '死刑' : '执行', 1760, 260, 140, bg === C.paper ? C.paper : C.ink, bg === C.paper ? C.ink : (death ? C.paper : RED));
  mono(ctx, `EXECUTION ${String(i + 1).padStart(2, '0')}/12`, 110, 170, 34, { color: fg, weight: 800 });
  for (let k = 0; k < 12; k++) { ctx.fillStyle = k <= i ? acc : 'rgba(128,128,160,0.3)'; ctx.fillRect(110 + k * 40, 196, 30, 12); }
  fx.bloom = 0.45; fx.curve = 0.4; fx.scan = 0.1; fx.aberr = 3 + 12 * p; fx.glitch = (death ? 0.18 : 0.08) + 0.35 * p; fx.flash = 0.6 * p;
  fx.invert = lt2 < 1 / 24 + 1e-3 && i % 3 === 2 ? 1 : 0;
}
// EIN DOS TROIS NE FEM LIU — one program deleted per beat.
const WORDS = [['EIN', '一'], ['DOS', '二'], ['TROIS', '三'], ['NE', '四'], ['FEM', '五'], ['LIU', '六']];
function shotCount(ctx, lt, t, fx) {
  let i = 0; COUNT.forEach((b, k) => { if (t >= b) i = k; });
  const verdict = t >= VERDICT;
  ctx.fillStyle = verdict ? RED : C.ink; ctx.fillRect(0, 0, W, H);
  PROGRAMS.forEach((pr, k) => {
    const x = 260 + k * 280, y = 720, img = icon(pr.key);
    if (t < COUNT[k]) { blit(ctx, img, x, y, 7, { center: true }); mono(ctx, pr.name, x - pr.name.length * 9, y + 130, 30, { color: C.mist }); }
    else shatter(ctx, img, x, y, 7, clamp((t - COUNT[k]) * 1.6), k + 1, verdict ? C.ink : undefined);
  });
  if (!verdict) {
    const [en, zh] = WORDS[i];
    stamp(ctx, en, t, COUNT[i], { size: 260, y: 420, color: C.paper, shadow: RED, decode: 0.08 });
    vText(ctx, zh, 1760, 250, 150, C.paper, RED);
  } else {
    stamp(ctx, 'EXECUTION', t, VERDICT, { size: 230, y: 420, color: C.ink, shadow: C.paper, decode: 0.08 });
    vText(ctx, '死刑', 1760, 250, 150, C.ink, C.paper);
    mono(ctx, 'programs remaining: 0', 1100, 960, 34, { color: C.ink, weight: 800 });
  }
  fx.bloom = 0.5; fx.curve = 0.4; fx.scan = 0.1; fx.aberr = 3 + 10 * pulse(t, [...COUNT, VERDICT], 9); fx.flash = 0.5 * pulse(t, [...COUNT, VERDICT], 12);
  fx.glitch = 0.2 * pulse(t, COUNT, 10) + (verdict ? 0.5 : 0);
}

// ---------------------------------------------------------------------------
// FINAL CHORUS
// "If I can give them all the EXECUTION": the recycle bin is emptied.
function shotBin(ctx, lt, t, fx) {
  const T0 = 165.25;
  wallpaper(ctx, t, { moon: false, top: '#140a26' }); menubar(ctx, t, { user: false, clock: '00:21' });
  deskIcon(ctx, 'ME', 'me.exe', 1790, 140, {}); deskIcon(ctx, 'BIN', 'Recycle Bin', 1790, 300, {});
  appWindow(ctx, 300, 140, 1100, 640, 'Recycle Bin', (c, b) => {
    PROGRAMS.forEach((p, i) => {
      const y = b.y + 80 + i * 70; if (t > T0 + i * 0.05) return;
      blit(c, icon(p.key), b.x + 40, y - 38, 2);
      mono(c, `${p.name.padEnd(12, ' ')} ${p.what.padEnd(8, ' ')}  deleted by me.exe`, b.x + 110, y, 26, { color: C.paper });
    });
    button(c, b.x + b.w - 420, b.y + b.h - 90, 380, 60, 'Empty Recycle Bin', { hot: t > T0 - 0.3, pressed: t > T0 && t < T0 + 0.1, color: RED });
  });
  if (t > T0) { stamp(ctx, 'EXECUTION', t, T0, { size: 190, y: 560, shadow: RED }); zhTag(ctx, zhOf('EXECUTION', 164), t, T0, { x: 1560, y: 460, size: 70, color: C.paper, box: RED }); }
  fx.noHud = true; fx.bloom = 0.5; fx.curve = 0.3; fx.scan = 0.08; fx.flash = 0.5 * pulse(t, [T0], 12); fx.aberr = 1.4 + 8 * pulse(t, [T0], 9);
}
// "Then I can be your only EXECUTION": one icon, alone in the middle of the desktop.
function shotOnly(ctx, lt, t, fx) {
  const T0 = 169.0;
  wallpaper(ctx, t, { moon: false, top: '#140a26' }); menubar(ctx, t, { user: false, clock: '00:24' });
  const s = lerp(1.0, 1.6, E.inOutCubic(inv(166.25, T0, t)));
  ctx.save(); ctx.translate(960, 440); ctx.scale(s, s); deskIcon(ctx, 'ME', 'me.exe', 0, 0, { sel: true }); ctx.restore();
  mono(ctx, 'programs running: 1', 740, 700, 32, { color: C.ice, weight: 700 });
  mono(ctx, 'users logged in:  0', 740, 744, 32, { color: C.comment, weight: 700 });
  if (t > T0) { stamp(ctx, 'EXECUTION', t, T0, { size: 190, y: 330, shadow: RED }); zhTag(ctx, zhOf('EXECUTION', 168), t, T0, { x: 1780, y: 300, size: 70, color: C.paper, box: RED }); }
  fx.noHud = true; fx.bloom = 0.55; fx.curve = 0.3; fx.scan = 0.08; fx.flash = 0.5 * pulse(t, [T0], 12); fx.aberr = 1.4 + 8 * pulse(t, [T0], 9);
}
// "If I can have you back / I will run the EXECUTION": waiting for the user, forever.
function shotWait(ctx, lt, t, fx) {
  const T0 = 172.75;
  roomScene(ctx, t, { day: 0, glow: 0.35, steam: 0, screen: (c, S) => {
    c.fillStyle = '#0b0e2e'; c.fillRect(S.x, S.y, S.w, S.h);
    mono(c, 'waiting for user', S.x + 120, S.y + 150, 30, { color: C.ice, weight: 700 });
    c.save(); c.translate(S.x + 80, S.y + 140); c.rotate(t * 8); for (let i = 0; i < 8; i++) { c.rotate(Math.PI / 4); c.fillStyle = `rgba(169,198,255,${(i + 1) / 8})`; c.fillRect(8, -3, 14, 6); } c.restore();
    pose(c, 'pose_sit', S.x + S.w - 90, S.y + S.h + 6, S.h * 0.78);   // sitting, waiting
  } });
  if (t > T0) {
    ctx.fillStyle = 'rgba(18,4,12,0.6)'; ctx.fillRect(0, 0, W, H);
    const n = Math.floor((t - T0) * 24);
    for (let i = 0; i < Math.min(n, 22); i++) mono(ctx, 'while (!you.back) execute(me);', 140 + (i % 2) * 40, 70 + i * 44, 30, { color: i === Math.min(n, 22) - 1 ? C.paper : RED, weight: 700 });
    zhTag(ctx, zhOf('EXECUTION', 171), t, T0, { x: 1780, y: 300, size: 70, color: C.paper, box: RED });
  }
  fx.bloom = 0.45; fx.curve = 0.3; fx.scan = 0.07; fx.flash = 0.5 * pulse(t, [T0], 12); fx.glitch = t > T0 ? 0.2 : 0;
}
// "Though we are trapped / We are trapped ah": the CRT alone in the dark; a slow push in.
function shotTrappedAh(ctx, lt, t, fx) {
  const z = lerp(1, 1.5, E.inOutCubic(inv(173.75, 177.25, t)));
  ctx.save(); ctx.translate(1040, 420); ctx.scale(z, z); ctx.translate(-1040, -420);
  roomScene(ctx, t, { day: 0, glow: 0.25, mug: false, screen: (c, S) => {
    c.save(); c.translate(S.x, S.y); c.scale(S.w / W, S.h / H); keyVisual(c, 17.2 + (t - 173.75) * 0.4, { z: 1.2, x: 0, y: 160, s: 0.66, rot: 0 }); c.restore();
    c.fillStyle = C.ink; for (let i = 0; i < 12; i++) c.fillRect(S.x + i * S.w / 11 - 4, S.y, 8, S.h);
  } });
  ctx.restore();
  fx.tint = [0.85, 0.88, 1]; fx.bloom = 0.5; fx.curve = 0.3; fx.scan = 0.07; fx.vig = 1;
}

// ---------------------------------------------------------------------------
// LOVE
const LOVE_GLYPH = t => { const g = ['LO-O-OVE', 'LO-0-OVE', 'L0-O-0VE', 'LO-O-OV3']; return g[Math.floor(t * 12) % 4]; };
function loveStamp(ctx, t, t0, zh) {
  if (t < t0) return;
  const k = E.outBack(inv(t0, t0 + 0.2, t));
  ctx.save(); ctx.translate(960, 560); ctx.scale(1 + 0.25 * k, 1); ctx.translate(-960, -560);
  stamp(ctx, LOVE_GLYPH(t), t, t0, { size: 200, y: 600, shadow: C.violet, decode: 0.1 }); ctx.restore();
  zhTag(ctx, zh, t, t0, { x: 1790, y: 250, size: 56, color: C.ink, box: C.lilac });
}
// "I've studied how to properly LO-O-OVE": a training run; the loss falls, the epoch climbs.
function shotStudy(ctx, lt, t, fx) {
  blueprint(ctx, '#0b0d2c');
  const T0 = 180.25, k = inv(177.3, 180.2, t);
  appWindow(ctx, 200, 120, 1500, 700, 'train_love.py', (c, b) => {
    face(c, 'calm', b.x + b.w - 330, b.y + 330, 170, 220, { frame: C.dim });
    const x0 = b.x + 80, y0 = b.y + b.h - 80, w = b.w - 460, h = b.h - 160;
    c.strokeStyle = C.dim; c.lineWidth = 2; c.beginPath(); c.moveTo(x0, b.y + 60); c.lineTo(x0, y0); c.lineTo(x0 + w, y0); c.stroke();
    c.strokeStyle = C.ice; c.lineWidth = 4; c.beginPath();
    for (let i = 0; i <= 300 * k; i++) { const u = i / 300, y = y0 - h * (0.08 + 0.9 * Math.exp(-u * 4)) - 12 * Math.sin(i * 1.7) * Math.exp(-u * 3); i ? c.lineTo(x0 + u * w, y) : c.moveTo(x0 + u * w, y); } c.stroke();
    mono(c, 'loss', x0 - 60, b.y + 60, 22, { color: C.comment });
    const ep = Math.floor(k * 999);
    [['epoch', String(ep).padStart(3, '0') + '/999'], ['loss', (0.08 + 0.9 * Math.exp(-k * 4)).toFixed(4)], ['subject', 'love'], ['teacher', 'you (absent)']].forEach(([a, v], i) => mono(c, `${a.padEnd(8, ' ')} ${v}`, b.x + b.w - 350, b.y + 90 + i * 50, 26, { color: i === 3 ? C.comment : C.paper, weight: 700 }));
  });
  loveStamp(ctx, t, T0, zhOf('LO-O-OVE', 178));
  fx.bloom = 0.6; fx.curve = 0.3; fx.scan = 0.08; fx.flash = 0.5 * pulse(t, [177.25, T0], 12); fx.aberr = 1.4 + 8 * pulse(t, [T0], 9);
}
// "Question me … I can answer all LO-O-OVE": every question, the same answer.
const QS = ['what is 1 + 1?', 'what time is it?', 'where did you go?', 'who am I?', 'why are you still here?', 'what is the world?'];
function shotQuestion(ctx, lt, t, fx) {
  ctx.fillStyle = '#05060f'; ctx.fillRect(0, 0, W, H);
  const T0 = 183.75;
  if (t < T0) {
    face(ctx, 'smile', 1320, 150, 420, 560, { frame: C.lilac, alpha: clamp((t - 181.3) * 2) });
    QS.forEach((q, i) => { const ti = 181.1 + i * 0.42; if (t < ti) return; mono(ctx, `> ${q}`, 140, 140 + i * 110, 34, { color: C.mist, count: Math.floor((t - ti) / 0.02) }); if (t > ti + 0.2) mono(ctx, '  love.', 140, 186 + i * 110, 34, { color: C.lilac, weight: 800 }); });
  } else {
    for (let j = 0; j < 22; j++) mono(ctx, 'LOVE '.repeat(20), -((j * 37 + (t - T0) * 300) % 200), 50 + j * 48, 40, { color: j % 2 ? C.violet : C.lilac, weight: 800 });
    loveStamp(ctx, t, T0, zhOf('LO-O-OVE', 182));
  }
  fx.bloom = 0.6; fx.curve = 0.4; fx.scan = 0.12; fx.mask = 0.2; fx.flash = 0.5 * pulse(t, [181.0, T0], 12);
}
// "I know the algebraic expression of LO-O-OVE": (x² + y² − 1)³ − x²y³ = 0, plotted.
function heartPt(u) { const x = 16 * Math.sin(u) ** 3, y = 13 * Math.cos(u) - 5 * Math.cos(2 * u) - 2 * Math.cos(3 * u) - Math.cos(4 * u); return [x, -y]; }
function heartPath(ctx, cx, cy, s, p = 1) { ctx.beginPath(); for (let i = 0; i <= 300 * p; i++) { const [x, y] = heartPt(i / 300 * Math.PI * 2); i ? ctx.lineTo(cx + x * s, cy + y * s) : ctx.moveTo(cx + x * s, cy + y * s); } }
function shotAlgebra(ctx, lt, t, fx) {
  blueprint(ctx);
  const T0 = 187.5, cx = 1180, cy = 500, s = 22;
  ctx.strokeStyle = '#2c3690'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - 450, cy); ctx.lineTo(cx + 450, cy); ctx.moveTo(cx, cy - 420); ctx.lineTo(cx, cy + 420); ctx.stroke();
  const p = E.inOutCubic(inv(185.0, 187.4, t));
  if (t > T0) { heartPath(ctx, cx, cy, s); ctx.fillStyle = C.lilac; ctx.globalAlpha = E.outCubic(inv(T0, T0 + 0.3, t)); ctx.fill(); ctx.globalAlpha = 1; }
  heartPath(ctx, cx, cy, s, p); ctx.strokeStyle = C.paper; ctx.lineWidth = 6; ctx.stroke();
  const eq = ['(x² + y² − 1)³ − x²y³ = 0', '', 'x(u) = 16 sin³u', 'y(u) = 13 cos u − 5 cos 2u', '       − 2 cos 3u − cos 4u'];
  eq.forEach((e, i) => { const ti = 184.8 + i * 0.3; if (t > ti) mono(ctx, e, 110, 170 + i * 46, i ? 26 : 32, { color: i ? C.ice : C.paper, weight: i ? 400 : 800, count: Math.floor((t - ti) / 0.02) }); });
  if (t > T0) { mono(ctx, '= LOVE', cx - 110, cy + 30, 60, { color: C.ink, weight: 800 }); loveStamp(ctx, t, T0, zhOf('LO-O-OVE', 186)); }
  fx.bloom = 0.7; fx.curve = 0.3; fx.scan = 0.08; fx.flash = 0.5 * pulse(t, [T0], 12);
}
// "Though you are free": the window opens; your pointer flies out into the sky.
function shotFree(ctx, lt, t, fx) {
  roomScene(ctx, t, { day: 0.35, windowOpen: true, glow: 0.2, mug: false, screen: (c, S) => { c.fillStyle = '#0b0e2e'; c.fillRect(S.x, S.y, S.w, S.h); moon(c, S.x + S.w * 0.62, S.y + S.h * 0.35, 90, 0.7); pose(c, 'pose_back', S.x + S.w * 0.55, S.y + S.h + 30, S.h * 1.05); } });   // she watches you go
  const k = E.inOutCubic(inv(188.3, 189.7, t));
  const x = lerp(1100, 360, k), y = lerp(420, 230, k) - Math.sin(k * Math.PI) * 60, s = lerp(9, 2, k);
  arrow(ctx, x, y, s);
  fx.bloom = 0.5; fx.curve = 0.3; fx.scan = 0.06; fx.flash = 0.3 * pulse(t, [188.25], 12);
}
// "I am trapped / Trapped in LO-O-OVE": she stands inside a heart drawn as bars.
function shotLoveCage(ctx, lt, t, fx) {
  const T0 = 191.25;
  { const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0c0f33'); g.addColorStop(1, C.ink); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    stars(ctx, t, 17, 110, 0.9, 900); moon(ctx, 975, 400, 300, 0.8); petals(ctx, t, 50, 5, 0, 0.9, 0.9);
    pose(ctx, 'pose_hug', 1000, 1150, 1000 + (t - 189.75) * 30, { glow: C.ice }); }   // eyes closed, holding the bouquet
  const cx = 975, cy = 470, s = 29, p = E.inOutCubic(inv(189.8, 190.9, t));
  ctx.save(); heartPath(ctx, cx, cy, s, p); ctx.strokeStyle = C.lilac; ctx.lineWidth = 10; ctx.stroke();
  if (p >= 1) { heartPath(ctx, cx, cy, s); ctx.clip(); ctx.fillStyle = C.lilac; for (let i = 0; i < 14; i++) ctx.fillRect(cx - 16 * s + i * 34 * s / 14, cy - 20 * s, 6, 40 * s * E.outCubic(inv(190.9 + i * 0.01, 191.2 + i * 0.01, t))); }
  ctx.restore();
  loveStamp(ctx, t, T0, zhOf('LO-O-OVE', 190));
  fx.bloom = 0.5; fx.curve = 0.3; fx.scan = 0.06; fx.flash = 0.6 * pulse(t, [T0], 8);
}

// ---------------------------------------------------------------------------
// OUTRO — she uninstalls herself.
const YES = beat(422);
const FILES = ['bouquet.obj', 'gloves.obj', 'veil.obj', 'choker.obj', 'hair.col', 'skin.col', 'dress.col', 'lines.svg', 'points.dat', 'love.dll', 'me.exe'];
function shotUninstall(ctx, lt, t, fx) {
  wallpaper(ctx, t, { moon: false }); menubar(ctx, t, { user: false, clock: '03:32' });
  deskIcon(ctx, 'ME', 'me.exe', 1790, 140, {});
  appWindow(ctx, 480, 300, 960, 440, 'Uninstall', (c, b) => {
    mono(c, 'Remove me.exe and all of its', b.x + 60, b.y + 100, 34, { color: C.paper, weight: 700 });
    mono(c, 'components from this world?', b.x + 60, b.y + 146, 34, { color: C.paper, weight: 700 });
    button(c, b.x + b.w - 440, b.y + b.h - 110, 180, 64, 'Yes', { hot: t > YES, pressed: t > YES && t < YES + 0.1, color: C.paper });
    button(c, b.x + b.w - 230, b.y + b.h - 110, 180, 64, 'No', { hot: t > 194.0 && t < 194.6 });
  });
  // her pointer hesitates between No and Yes
  const [x, y] = path([[192.5, 1500, 950], [193.8, 1480 - 230 + 90, 300 + 440 - 76], [194.6, 1480 - 230 + 90, 300 + 440 - 76], [YES - 0.05, 1480 - 440 + 90, 300 + 440 - 76]], t);
  arrow(ctx, x, y, 6, C.ice, C.ink); click(ctx, x, y, t, YES);
  fx.noHud = true; fx.bloom = 0.45; fx.curve = 0.3; fx.scan = 0.07; fx.flash = 0.4 * pulse(t, [YES], 10);
}
// The creation, played backwards: full colour → flat cel → line art → points → stars.
function shotUndo(ctx, lt, t, fx) {
  const A = getA();
  ctx.fillStyle = '#0a0f3c'; ctx.fillRect(0, 0, W, H); bgGrid(ctx, 30, '#121a55', 150, '#1d2672');
  const X = 1150, Y = 545, s = 0.64, SX = 512, SY = 768;
  const kFull = inv(197.0, 198.2, t), kFlat = inv(198.4, 200.4, t), kLine = inv(200.6, 201.6, t), kPts = inv(201.6, 203.0, t);
  if (kLine < 1) {
    ctx.save(); ctx.globalAlpha = 1 - kLine;
    for (let g = 0; g < 7; g++) if (kFlat < (7 - g) / 7) layer(ctx, A.flats[g], X, Y, s, SX, SY);
    ctx.save(); ctx.globalAlpha = (1 - kLine) * clamp(kFull * 2); layer(ctx, tinted(A.lines, '#0b0c1c', 'linesInk'), X, Y, s, SX, SY); ctx.restore();
    if (kFull < 1) { ctx.save(); ctx.beginPath(); ctx.rect(0, H * kFull, W, H); ctx.clip(); drawCut(ctx, X, Y, s, SX, SY); ctx.restore(); if (kFull > 0) { ctx.fillStyle = C.paper; ctx.fillRect(700, H * kFull - 2, W, 4); } }
    ctx.restore();
    if (kFlat >= 1) { ctx.save(); ctx.globalAlpha = 1 - kLine; ctx.globalCompositeOperation = 'lighter'; layer(ctx, tinted(A.lines, C.ice, 'lines'), X, Y, s, SX, SY); ctx.restore(); }
  }
  if (kLine > 0) {
    const pts = A.meta.points; ctx.fillStyle = C.ice;
    for (let i = 0; i < pts.length; i += 2) {
      const [px, py] = pts[i], d = hash(i * 13) * 0.4, e = E.inCubic(clamp((kPts - d) / 0.6));
      const x = X + (px - SX) * s + (hash(i * 7) - 0.5) * 900 * e, y = Y + (py - SY) * s - 900 * e * (0.5 + hash(i * 5));
      ctx.globalAlpha = clamp(kLine * 2) * (1 - e * 0.7); ctx.fillRect(x - 1, y - 1, 2.5, 2.5);
    }
    ctx.globalAlpha = 1;
  }
  // removal log
  const n = Math.floor(inv(197.0, 202.6, t) * FILES.length);
  FILES.forEach((f, i) => { if (i < n) mono(ctx, `removing ${f.padEnd(12, ' ')} ✓`, 110, 150 + i * 42, 26, { color: i === n - 1 ? C.paper : C.comment }); });
  progress(ctx, 110, 150 + FILES.length * 42 + 10, 520, 36, inv(197.0, 202.6, t), { blocks: 20 });
  fx.noLyric = true; fx.bloom = 0.8; fx.curve = 0.3; fx.scan = 0.08; fx.flash = 0.3 * pulse(t, [197.0], 10);
}
// The world, without her. The last word; the screen goes out.
function shotEnd(ctx, lt, t, fx) {
  const off = 207.7;
  const scene = c => {
    c.fillStyle = C.ink; c.fillRect(0, 0, W, H);
    stars(c, t, 3, 160, 0.9, 700); moon(c, 960, 360, 300, 0.95); floorGrid(c, t * 0.3, 720, 1, 0.9);
    const mem = Math.sin(Math.PI * clamp(inv(203.3, 205.7, t))) * 0.75;           // one last memory: her smile, in white
    if (mem > 0.01) { c.save(); c.beginPath(); c.arc(960, 360, 296, 0, 7); c.clip(); c.fillStyle = `rgba(20,24,70,${mem})`; c.fillRect(600, 0, 720, 720); pose(c, 'white_up', 960, 700, 640, { alpha: mem }); c.restore(); }
    if (t > 205.9) {
      const s = 'EXECUTION...', n = Math.min(s.length, Math.floor((t - 205.9) / 0.1) + 1);
      mono(c, s, 960 - s.length * 0.6 * 110 / 2, 900, 110, { color: C.paper, weight: 300, count: n });
      vText(c, '处决', 1760, 280, 90, C.ink, C.paper);
    }
  };
  if (t < off) scene(ctx);
  else {
    const tmp = canvas(W, H), tc = tmp.getContext('2d'); scene(tc);
    ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H);
    const v = E.inExpo(inv(off, off + 0.16, t)), h2 = E.inExpo(inv(off + 0.16, off + 0.28, t));
    const sh = Math.max(3, H * (1 - v)), sw = Math.max(4, W * (1 - h2));
    ctx.save(); ctx.globalAlpha = clamp(1 - inv(off + 0.28, off + 0.6, t)); ctx.drawImage(tmp, W / 2 - sw / 2, H / 2 - sh / 2, sw, sh);
    ctx.fillStyle = `rgba(230,238,255,${v})`; ctx.fillRect(W / 2 - sw / 2, H / 2 - sh / 2, sw, sh); ctx.restore();
    if (t > off + 0.9) mono(ctx, '> process exited with code 0_', 110, 980, 26, { color: C.dim, count: Math.floor((t - off - 0.9) / 0.03) });
    fx.noHud = true;
  }
  fx.noLyric = true; fx.bloom = 0.6; fx.curve = 0.3; fx.scan = 0.07; fx.vig = 0.9;
}

const LY = { x: 104, y: 930 };
export const SHOTS4 = [
  { t0: 133.25, t1: beat(304), name: 'the hunt', draw: shotHunt, lyric: null },
  { t0: beat(304), t1: EXE[0], name: 'task manager', draw: shotTaskman, lyric: null },
  { t0: EXE[0], t1: COUNT[0], name: 'EXECUTION', draw: shotExecution, lyric: LY },
  { t0: COUNT[0], t1: 162.5, name: 'EIN … LIU', draw: shotCount, lyric: LY },
  { t0: 162.5, t1: 166.25, name: 'recycle bin', draw: shotBin, lyric: LY },
  { t0: 166.25, t1: 170.0, name: 'your only', draw: shotOnly, lyric: LY },
  { t0: 170.0, t1: 173.75, name: 'have you back', draw: shotWait, lyric: LY },
  { t0: 173.75, t1: 177.25, name: 'trapped', draw: shotTrappedAh, lyric: LY },
  { t0: 177.25, t1: 181.0, name: 'studied', draw: shotStudy, lyric: LY },
  { t0: 181.0, t1: 184.75, name: 'question me', draw: shotQuestion, lyric: LY },
  { t0: 184.75, t1: 188.25, name: 'algebra', draw: shotAlgebra, lyric: LY },
  { t0: 188.25, t1: 189.75, name: 'you are free', draw: shotFree, lyric: LY },
  { t0: 189.75, t1: 192.4, name: 'trapped in love', draw: shotLoveCage, lyric: LY },
  { t0: 192.4, t1: 197.0, name: 'uninstall', draw: shotUninstall, lyric: null },
  { t0: 197.0, t1: 203.0, name: 'undo', draw: shotUndo, lyric: null },
  { t0: 203.0, t1: 999, name: 'end', draw: shotEnd, lyric: null },
];
