// Storyboard for the 0:00–0:20 demo. Every shot is a pure function of time.
import {
  W, H, C, BEAT, beat, clamp, lerp, inv, E, hash, hash2, rng, onTwos, pulse, canvas,
  tinted, sparkle, focusLines, halftone, stripes, windowFrame, roundRect,
} from './lib.js';
import { mono, cursor, lyricEditor, LYRICS } from './type.js';

let A = null;
export const setAssets = a => { A = a; };

// ---------------------------------------------------------------------------
// Character placement. Source space is the 1024×1536 illustration; (sx, sy)
// lands on screen (x, y) at `s` screen px per source px.
const UP = [150, 0, 900, 700];                       // bounds of the x4 close-up plate
function drawCut(ctx, x, y, s, sx, sy) {
  ctx.drawImage(A.char, x - sx * s, y - sy * s, 1024 * s, 1536 * s);
  if (s > 1.25) ctx.drawImage(A.upper, x + (UP[0] - sx) * s, y + (UP[1] - sy) * s, (UP[2] - UP[0]) * s, (UP[3] - UP[1]) * s);
}
const layer = (ctx, img, x, y, s, sx, sy) => ctx.drawImage(img, x - sx * s, y - sy * s, 1024 * s, 1536 * s);
const toScreen = (x, y, s, sx, sy) => (px, py) => [x + (px - sx) * s, y + (py - sy) * s];

function sticker(ctx, x, y, s, sx, sy, width, color, n = 12) {
  const img = tinted(A.sil, color, 'sil');
  for (let k = 0; k < n; k++) {
    const a = k / n * Math.PI * 2;
    ctx.drawImage(img, x - sx * s + Math.cos(a) * width, y - sy * s + Math.sin(a) * width, 1024 * s, 1536 * s);
  }
}

// ---------------------------------------------------------------------------
// Shared scenery
function moon(ctx, x, y, r, a = 1) {
  ctx.save(); ctx.globalAlpha = a;
  let g = ctx.createRadialGradient(x, y, r * 0.85, x, y, r * 2.3);
  g.addColorStop(0, 'rgba(169,198,255,0.20)'); g.addColorStop(0.4, 'rgba(120,140,255,0.06)'); g.addColorStop(1, 'rgba(120,140,255,0)');
  ctx.fillStyle = g; ctx.fillRect(x - r * 2.3, y - r * 2.3, r * 4.6, r * 4.6);
  g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.05, x, y, r);
  g.addColorStop(0, '#e8e7f1'); g.addColorStop(0.7, '#d6d6e4'); g.addColorStop(1, '#babcd6');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  const R = rng(11); ctx.fillStyle = 'rgba(120,125,175,0.07)';
  for (let i = 0; i < 16; i++) {
    const a2 = R() * Math.PI * 2, d = Math.sqrt(R()) * r * 0.8, cr = r * (0.04 + R() * 0.12);
    ctx.beginPath(); ctx.arc(x + Math.cos(a2) * d, y + Math.sin(a2) * d, cr, 0, Math.PI * 2); ctx.fill();
  }
  ctx.strokeStyle = 'rgba(169,198,255,0.35)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(x, y, r + 16, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}

function stars(ctx, t, seed, n, a = 1, ymax = 760) {
  const R = rng(seed); ctx.save();
  for (let i = 0; i < n; i++) {
    const x = R() * W, y = R() * ymax, big = R() < 0.14, ph = R() * 6.28, sp = 1.5 + R() * 3;
    const tw = 0.5 + 0.5 * Math.sin(onTwos(t) * sp + ph);
    ctx.globalAlpha = a * (0.25 + 0.75 * tw);
    ctx.fillStyle = big ? C.paper : C.ice;
    if (big) sparkle(ctx, x, y, 7 + 9 * tw, 0);
    else ctx.fillRect(x, y, 2, 2);
  }
  ctx.restore();
}

// Rose petals from the bouquet — flat two-tone cel shapes tumbling on twos.
function petals(ctx, t, n, seed, layerMin = 0, layerMax = 2, alpha = 1) {
  const R = rng(seed), tt = onTwos(t);
  for (let i = 0; i < n; i++) {
    const depth = 0.45 + R() * 1.35, x0 = R() * (W + 400) - 200, ph = R() * 10, sw = 30 + R() * 90;
    const speed = 70 + 90 * depth, rotS = (R() - 0.5) * 4, flipS = 1.5 + R() * 3, col = R();
    if (depth < layerMin || depth >= layerMax) continue;
    const y = ((R() * 1400 + tt * speed) % 1400) - 160;
    const x = x0 + Math.sin(tt * 0.9 + ph) * sw;
    const size = 9 * depth + 4;
    const fl = Math.cos(tt * flipS + ph);
    ctx.save(); ctx.globalAlpha = alpha * clamp(0.35 + depth * 0.5);
    ctx.translate(x, y); ctx.rotate(tt * rotS + ph); ctx.scale(size * (0.25 + 0.75 * Math.abs(fl)), size * 1.35);
    ctx.beginPath(); ctx.moveTo(0, -1);
    ctx.bezierCurveTo(0.95, -0.8, 0.9, 0.7, 0, 1); ctx.bezierCurveTo(-0.9, 0.7, -0.95, -0.8, 0, -1); ctx.closePath();
    ctx.fillStyle = col < 0.55 ? C.paper : col < 0.85 ? C.ice : C.cobalt; ctx.fill();
    ctx.clip(); ctx.fillStyle = col < 0.55 ? '#b9bcd8' : col < 0.85 ? '#7f97d6' : '#3443a8';
    ctx.fillRect(fl > 0 ? 0 : -1, -1, 1, 2);
    ctx.restore();
  }
}

// Out-of-focus foreground petals: drawn at quarter resolution and upscaled (cheap bokeh blur).
const soft = canvas(W / 4, H / 4), sctx = soft.getContext('2d');
function softPetals(ctx, t, n, seed, a, b, alpha) {
  sctx.clearRect(0, 0, soft.width, soft.height);
  sctx.save(); sctx.scale(0.25, 0.25); petals(sctx, t, n, seed, a, b, alpha); sctx.restore();
  ctx.drawImage(soft, 0, 0, W, H);
}

function bgGrid(ctx, step, col, major, colMajor, ox = 0, oy = 0) {
  ctx.save(); ctx.fillStyle = col;
  for (let x = ((ox % step) + step) % step; x < W; x += step) ctx.fillRect(Math.round(x), 0, 1, H);
  for (let y = ((oy % step) + step) % step; y < H; y += step) ctx.fillRect(0, Math.round(y), W, 1);
  if (major) {
    ctx.fillStyle = colMajor;
    for (let x = ((ox % major) + major) % major; x < W; x += major) ctx.fillRect(Math.round(x), 0, 2, H);
    for (let y = ((oy % major) + major) % major; y < H; y += major) ctx.fillRect(0, Math.round(y), W, 2);
  }
  ctx.restore();
}

function scanBars(ctx, x, y, w, h, a = 0.14, gap = 3) {
  ctx.save(); ctx.fillStyle = `rgba(0,0,0,${a})`;
  for (let yy = y; yy < y + h; yy += gap) ctx.fillRect(x, yy, w, 1);
  ctx.restore();
}

function vText(ctx, str, x, y, size, color, box) {
  // vertical CJK setting, one glyph per row
  const chars = [...str];
  if (box) { ctx.fillStyle = box; ctx.fillRect(x - size * 0.62, y - size * 0.95, size * 1.24, chars.length * size * 1.08 + size * 0.3); }
  ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.font = `900 ${size}px "Noto Serif SC"`;
  chars.forEach((ch, i) => ctx.fillText(ch, x, y + i * size * 1.08));
}

// ---------------------------------------------------------------------------
// Chess pieces (6 programs + "ME"). Unit silhouettes: base at y=0, top at y=-1.
const BASE = [[0.46, 0], [0.46, -0.07], [0.36, -0.1], [0.38, -0.14], [0.26, -0.17]];
const PROFILES = {
  pawn: [...BASE, [0.15, -0.42], [0.26, -0.46], [0.26, -0.5], [0.13, -0.53]],
  rook: [...BASE, [0.24, -0.62], [0.33, -0.66], [0.33, -0.84]],
  bishop: [...BASE, [0.15, -0.5], [0.27, -0.54], [0.27, -0.57], [0.14, -0.6]],
  king: [...BASE, [0.16, -0.55], [0.31, -0.72], [0.22, -0.76], [0.28, -0.8], [0.12, -0.84]],
  queen: [...BASE, [0.15, -0.55], [0.33, -0.8], [0.24, -0.83]],
};
function piecePath(ctx, type) {
  ctx.beginPath();
  if (type === 'knight') {
    const P = [[0.46, 0], [0.46, -0.07], [0.36, -0.1], [0.38, -0.14], [0.28, -0.18], [0.3, -0.45], [0.2, -0.62], [0.26, -0.8],
      [0.12, -0.96], [0.02, -1.0], [-0.06, -0.92], [-0.22, -0.86], [-0.34, -0.72], [-0.36, -0.62], [-0.26, -0.6], [-0.1, -0.66],
      [-0.2, -0.45], [-0.3, -0.18], [-0.38, -0.14], [-0.36, -0.1], [-0.46, -0.07], [-0.46, 0]];
    P.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); return;
  }
  const P = PROFILES[type];
  P.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  const top = P[P.length - 1][1];
  if (type === 'pawn') { ctx.arc(0, -0.7, 0.19, Math.PI * 0.62, Math.PI * 2.38, false); }
  if (type === 'rook') { const c = [[0.33, -1], [0.2, -1], [0.2, -0.93], [0.07, -0.93], [0.07, -1], [-0.07, -1], [-0.07, -0.93], [-0.2, -0.93], [-0.2, -1], [-0.33, -1], [-0.33, -0.84]]; c.forEach(([x, y]) => ctx.lineTo(x, y)); }
  if (type === 'bishop') { ctx.bezierCurveTo(0.3, -0.72, 0.2, -0.9, 0, -1.0); ctx.bezierCurveTo(-0.2, -0.9, -0.3, -0.72, -0.14, -0.6); }
  if (type === 'king') { [[0.05, -0.84], [0.05, -0.9], [0.12, -0.9], [0.12, -0.95], [0.05, -0.95], [0.05, -1.04], [-0.05, -1.04], [-0.05, -0.95], [-0.12, -0.95], [-0.12, -0.9], [-0.05, -0.9], [-0.05, -0.84], [-0.12, -0.84]].forEach(([x, y]) => ctx.lineTo(x, y)); }
  if (type === 'queen') { const n = 5; for (let i = 0; i <= n; i++) { const x = 0.24 - i * 0.48 / n; ctx.lineTo(x, -0.97); if (i < n) ctx.lineTo(x - 0.048, -0.86); } }
  for (let i = P.length - 1; i >= 0; i--) if (!(type === 'queen' && i === P.length - 1 && false)) ctx.lineTo(-P[i][0], P[i][1]);
  ctx.closePath();
  void top;
}
function piece(ctx, type, x, y, h, fill, shade, line, squash = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(h / squash * 0.95, h * squash);
  ctx.lineJoin = 'round';
  piecePath(ctx, type); ctx.fillStyle = fill; ctx.fill();
  ctx.save(); ctx.clip(); ctx.fillStyle = shade; ctx.fillRect(0.06, -1.1, 1, 1.2); ctx.restore();
  piecePath(ctx, type); ctx.lineWidth = 3.2 / h; ctx.strokeStyle = line; ctx.stroke();
  ctx.restore();
}

// Simple look-at camera for the board.
function camera(theta, height, dist, fov = 0.72, cx = W / 2, cy = H / 2 + 40) {
  const eye = [Math.sin(theta) * dist, height, -Math.cos(theta) * dist];
  const f = [-eye[0], -eye[1], -eye[2]]; const fl = Math.hypot(...f); f.forEach((v, i) => f[i] = v / fl);
  let r = [f[2], 0, -f[0]]; const rl = Math.hypot(...r); r = r.map(v => v / rl);
  const u = [f[1] * r[2] - f[2] * r[1], f[2] * r[0] - f[0] * r[2], f[0] * r[1] - f[1] * r[0]];
  const foc = (H / 2) / Math.tan(fov / 2);
  return (x, y, z) => {
    const d = [x - eye[0], y - eye[1], z - eye[2]];
    const cz = d[0] * f[0] + d[1] * f[1] + d[2] * f[2];
    const cxv = d[0] * r[0] + d[1] * r[1] + d[2] * r[2];
    const cyv = d[0] * u[0] + d[1] * u[1] + d[2] * u[2];
    return [cx - cxv * foc / cz, cy - cyv * foc / cz, cz];
  };
}

// ---------------------------------------------------------------------------
// SHOT 1 · 0.00 — "Switch on the power line": CRT power-on, the power glyph and its cable.
function shotBoot(ctx, lt, t, fx) {
  ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H);
  if (t < 0.06) return;
  const g = ctx.createRadialGradient(W / 2, H / 2 - 40, 50, W / 2, H / 2, 1100);
  g.addColorStop(0, '#141a52'); g.addColorStop(0.55, '#0a0c26'); g.addColorStop(1, C.ink);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#1c2258';
  for (let y = 24; y < H; y += 48) for (let x = 24; x < W; x += 48) ctx.fillRect(x, y, 2, 2);

  const cx = 1180, cy = 470, R = 150, press = beat(2);
  const pk = pulse(t, [press], 9);
  const sc = 1 - 0.07 * pk;
  // cable (the "power line") snaking in from the lower-left
  const P0 = [W + 80, 980], P1 = [1500, 1060], P2 = [1180, 900], P3 = [cx, cy + R + 70];
  const bez = (u) => { const m = 1 - u; return [m * m * m * P0[0] + 3 * m * m * u * P1[0] + 3 * m * u * u * P2[0] + u * u * u * P3[0], m * m * m * P0[1] + 3 * m * m * u * P1[1] + 3 * m * u * u * P2[1] + u * u * u * P3[1]]; };
  const pc = E.inOutCubic(inv(0.12, 0.9, t));
  const drawCable = (w, col, dy = 0) => {
    ctx.beginPath(); for (let i = 0; i <= 80; i++) { const [x, y] = bez(i / 80 * pc); i ? ctx.lineTo(x, y + dy) : ctx.moveTo(x, y + dy); }
    ctx.lineWidth = w; ctx.strokeStyle = col; ctx.lineCap = 'round'; ctx.stroke();
  };
  drawCable(26, C.ink); drawCable(14, C.cobalt); drawCable(4, C.ice, -3);
  if (t > press) {                      // current running along the line
    for (let k = 0; k < 7; k++) {
      const u = ((t - press) * 1.6 + k / 7) % 1; const [x, y] = bez(u);
      ctx.fillStyle = C.paper; ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.arc(x, y - 2, 6, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
    }
  }
  // plug seated into the socket under the glyph
  const [px, py] = bez(pc);
  ctx.save(); ctx.translate(px, py); ctx.fillStyle = C.ink; ctx.fillRect(-26, -34, 52, 44);
  ctx.fillStyle = C.mist; ctx.fillRect(-20, -30, 40, 36); ctx.fillStyle = C.paper; ctx.fillRect(-14, -48, 8, 20); ctx.fillRect(6, -48, 8, 20);
  ctx.restore();

  // IEC power glyph
  ctx.save(); ctx.translate(cx, cy); ctx.scale(sc, sc);
  const pr = E.outCubic(inv(0.28, 1.0, t));
  if (t > press) {
    const gg = ctx.createRadialGradient(0, 0, 10, 0, 0, R * 1.9);
    gg.addColorStop(0, `rgba(169,198,255,${0.55 * pk + 0.18})`); gg.addColorStop(1, 'rgba(169,198,255,0)');
    ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(0, 0, R * 1.9, 0, 7); ctx.fill();
  }
  const a0 = -Math.PI / 2 + 0.62, a1 = a0 + (Math.PI * 2 - 1.24) * pr;
  for (const [w, col] of [[40, C.ink], [24, t > press ? C.paper : C.ice]]) {
    ctx.lineCap = 'round'; ctx.lineWidth = w; ctx.strokeStyle = col;
    ctx.beginPath(); ctx.arc(0, 0, R, a0, a1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -R - 34); ctx.lineTo(0, lerp(-R - 34, -34, E.outCubic(inv(0.5, 1.0, t)))); ctx.stroke();
  }
  ctx.restore();
  if (t > press) {
    const rr = (t - press) * 1300;
    ctx.strokeStyle = `rgba(169,198,255,${clamp(1 - (t - press) * 2.2)})`; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(cx, cy, R + rr, 0, 7); ctx.stroke();
    ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, R + rr * 0.6, 0, 7); ctx.stroke();
    focusLines(ctx, cx, cy, 90, 420, C.ice, 5, 0.35 * pk);
  }

  // BIOS POST text
  const lines = [
    [0.36, 'WORLD.SYS  BIOS REV 0.13', ''],
    [0.50, 'CPU   HEART-01 @ 130 BPM .......', 'OK'],
    [0.64, 'MEM   0640K  LOVE ..............', 'OK'],
    [0.78, 'PWR   LINE-IN ..................', press],
    [1.22, 'BOOT  /sys/me.exe', ''],
  ];
  ctx.font = '34px VT323'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  lines.forEach(([t0, s, st], i) => {
    if (t < t0) return;
    const n = Math.floor((t - t0) / 0.012);
    ctx.fillStyle = i === 0 ? C.paper : C.ice; ctx.fillText(s.slice(0, n), 110, 150 + i * 40);
    const w = 520;
    if (typeof st === 'number') { if (t > st) { ctx.fillStyle = C.paper; ctx.fillText('[ ON ]', 118 + w, 150 + i * 40); } else if (n >= s.length) { ctx.fillStyle = C.dim; ctx.fillText('[ -- ]', 118 + w, 150 + i * 40); } }
    else if (st && t > t0 + 0.1) { ctx.fillStyle = C.ice; ctx.fillText(`[ ${st} ]`, 118 + w, 150 + i * 40); }
  });
  // CRT warm-up: horizontal line, then the raster opens vertically
  const hx = E.outExpo(inv(0.06, 0.14, t)), vy = E.outExpo(inv(0.14, 0.46, t));
  const band = Math.max(4, H * vy);
  ctx.fillStyle = C.ink;
  ctx.fillRect(0, 0, W, (H - band) / 2); ctx.fillRect(0, (H + band) / 2, W, (H - band) / 2);
  if (vy < 1) {
    ctx.fillStyle = `rgba(215,228,255,${(1 - vy) * 0.9})`;
    ctx.fillRect(W / 2 - W * hx / 2, (H - band) / 2, W * hx, band);
  }
  fx.curve = 0.7; fx.scan = 0.16; fx.mask = 0.22; fx.bloom = 1.0; fx.aberr = 1.6 + 7 * pk; fx.flash = 0.25 * pk;
}

// SHOT 2 · "Remember to put on": design-sheet equipment checklist.
const EQUIP = [
  { t: 1.62, name: 'CHOKER', ext: '.obj', zh: '颈环', at: [515, 243] },
  { t: 1.85, name: 'VEIL', ext: '.obj', zh: '黑纱', at: [318, 305] },
  { t: 2.08, name: 'GLOVES', ext: '.obj', zh: '手套', at: [432, 455] },
  { t: 2.31, name: 'BOUQUET', ext: '.obj', zh: '捧花 ×6', at: [470, 560] },
  { t: 2.54, name: 'PROTECTION', ext: '.dll', zh: '绝缘护体', at: null },
];
function shotEquip(ctx, lt, t, fx) {
  ctx.fillStyle = C.paper; ctx.fillRect(0, 0, W, H);
  bgGrid(ctx, 24, '#e0e0ef', 120, '#cfd0e8', -lt * 20, 0);
  ctx.fillStyle = '#e1e2f1'; ctx.font = '900 360px "Noto Serif SC"'; ctx.textAlign = 'center';
  ctx.fillText('装', 1760, 400); ctx.fillText('备', 1760, 780);
  // header
  mono(ctx, 'CHARACTER SHEET', 110, 132, 30, { color: C.navy, weight: 800 });
  mono(ctx, 'me.obj  /  rev.01  /  EQUIPMENT', 110, 172, 20, { color: '#6d72b8', weight: 500 });
  ctx.fillStyle = C.navy; for (let i = 0; i < 38; i++) if (hash(i * 3) > 0.35) ctx.fillRect(560 + i * 7, 108, hash(i) > 0.5 ? 4 : 2, 30);
  ctx.fillRect(110, 190, 700, 3);

  const s = lerp(0.93, 0.99, E.inOutCubic(inv(0, 1.4, lt))), X = 1330, Y = 560, SX = 515, SY = 420;
  const bob = Math.sin(onTwos(lt) * 5) * 3;
  layer(ctx, tinted(A.sil, '#c4c6e4', 'sil'), X + 22, Y + 16 + bob, s, SX, SY);
  drawCut(ctx, X, Y + bob, s, SX, SY);
  const P = toScreen(X, Y + bob, s, SX, SY);
  // bracket around the figure for PROTECTION (pending)
  EQUIP.forEach((q, i) => {
    if (t < q.t) return;
    const y = 290 + i * 118, k = E.outCubic(inv(q.t, q.t + 0.12, t)), done = q.at && t > q.t + 0.1;
    ctx.save(); ctx.globalAlpha = k; ctx.translate((1 - k) * -30, 0);
    ctx.strokeStyle = C.navy; ctx.lineWidth = 3; ctx.strokeRect(110, y - 30, 34, 34);
    if (done) { ctx.lineWidth = 6; ctx.strokeStyle = C.cobalt; ctx.beginPath(); ctx.moveTo(116, y - 14); ctx.lineTo(126, y - 4); ctx.lineTo(150, y - 38); ctx.stroke(); }
    else if (!q.at) { if (Math.floor(t * 8) % 2) { ctx.fillStyle = C.violet; ctx.fillRect(117, y - 23, 20, 20); } }
    const r = mono(ctx, q.name, 170, y, 38, { color: q.at ? C.navy : C.violet, weight: 800 });
    mono(ctx, q.ext, r.x1, y, 38, { color: '#8d92cc', weight: 400 });
    ctx.font = '500 24px "Noto Sans SC"'; ctx.textAlign = 'left'; ctx.fillStyle = '#5b61ad';
    ctx.fillText(q.zh, 172, y + 34);
    if (!q.at) { mono(ctx, 'LOADING' + '.'.repeat(1 + Math.floor(t * 10) % 3), 470, y + 34, 22, { color: C.violet, weight: 700 }); }
    ctx.restore();
    if (q.at) {                         // leader line to the item on her
      const [ax, ay] = P(...q.at), lx = 560, ly = y - 12;
      const lp = E.outCubic(inv(q.t + 0.04, q.t + 0.22, t));
      const mx = lerp(lx, ax - 60, 0.5);
      ctx.strokeStyle = C.navy; ctx.lineWidth = 2.5; ctx.beginPath();
      ctx.moveTo(lx, ly); const ex = lerp(lx, ax, lp), ey = lerp(ly, ay, clamp((lp - 0.4) / 0.6));
      ctx.lineTo(Math.min(ex, mx), ly); if (lp > 0.4) ctx.lineTo(ex, ey); ctx.stroke();
      if (lp >= 1) {
        ctx.fillStyle = C.navy; ctx.beginPath(); ctx.arc(ax, ay, 7, 0, 7); ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = C.cobalt; ctx.beginPath(); ctx.arc(ax, ay, 16 + 40 * E.outCubic(inv(q.t + 0.22, q.t + 0.6, t)), 0, 7);
        ctx.globalAlpha = clamp(1 - inv(q.t + 0.22, q.t + 0.6, t)); ctx.stroke(); ctx.globalAlpha = 1;
      }
    }
  });
  if (t > 2.54) {                       // dashed bracket: protection not yet applied
    const [x0, y0] = P(150, 12), [x1, y1] = P(1010, 1100);
    ctx.save(); ctx.setLineDash([14, 10]); ctx.lineDashOffset = -t * 60; ctx.strokeStyle = C.violet; ctx.lineWidth = 3;
    ctx.strokeRect(x0, y0, x1 - x0, y1 - y0); ctx.restore();
  }
  fx.curve = 0.25; fx.scan = 0.05; fx.bloom = 0.22; fx.vig = 0.3; fx.grain = 0.06; fx.aberr = 1.0;
  fx.flash = 0.35 * pulse(t, [beat(3)], 14);
}

// SHOT 3 · "PROTECTION": impact frame, hazard stripes, shield rings, colour hold on the off-beat.
function shotProtect(ctx, lt, t, fx) {
  const hit = beat(6), swap = beat(7);
  const inv2 = t >= swap;
  const shake = pulse(t, [hit, swap], 10) * 14;
  const sx = (hash(Math.round(t * 24)) - 0.5) * shake, sy = (hash(Math.round(t * 24) + 9) - 0.5) * shake;
  ctx.save(); ctx.translate(sx, sy);
  stripes(ctx, -40, -40, W + 80, H + 80, 70, inv2 ? C.ink : C.cobalt, inv2 ? '#0e1236' : '#4457d2', t * 260, -0.62);
  const cx = 960, cy = 470;
  for (const [k, t0] of [[0, hit], [1, hit + 0.18], [2, swap], [3, swap + 0.2]].map(([k, v]) => [k, v])) {
    if (t < t0) continue;
    const p = E.outCubic(inv(t0, t0 + 0.7, t)), r = 260 + p * 900;
    ctx.save(); ctx.globalAlpha = 1 - p; ctx.strokeStyle = inv2 ? C.ice : C.paper; ctx.lineWidth = 10 - k * 1.5;
    ctx.beginPath(); for (let i = 0; i <= 6; i++) { const a = i / 6 * Math.PI * 2 + Math.PI / 6; ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } ctx.stroke(); ctx.restore();
  }
  // giant keyword behind the figure
  const word = 'PROTECTION', size = 212, cell = size * 0.6, wx = W / 2 - word.length * cell / 2;
  const dec = clamp((t - hit) / 0.2);
  mono(ctx, word, wx + 10, 640 + 10, size, { color: inv2 ? C.cobalt : C.navy, weight: 800, scramble: (1 - dec) * 0.8, seed: Math.round(t * 24) });
  mono(ctx, word, wx, 640, size, { color: inv2 ? C.ink : C.paper, weight: 800, scramble: (1 - dec) * 0.8, seed: Math.round(t * 24) });
  if (inv2) { ctx.save(); ctx.lineWidth = 3; ctx.strokeStyle = C.paper; ctx.font = `800 ${size}px "JetBrains Mono"`; ctx.textAlign = 'center';
    for (let i = 0; i < word.length; i++) ctx.strokeText(word[i], wx + (i + 0.5) * cell, 640); ctx.restore(); }
  // figure: black paper-cut silhouette, then the real figure after the colour swap
  const s = lerp(0.60, 0.635, E.outCubic(inv(hit, hit + 0.9, t))), X = 960, Y = 580, SX = 515, SY = 800;
  sticker(ctx, X, Y, s, SX, SY, 9, inv2 ? C.paper : C.ink);
  if (inv2) { layer(ctx, tinted(A.sil, C.cobalt, 'sil'), X + 16, Y + 12, s, SX, SY); drawCut(ctx, X, Y, s, SX, SY); }
  else { sticker(ctx, X, Y, s, SX, SY, 4, C.paper); layer(ctx, tinted(A.sil, C.ink, 'sil'), X, Y, s, SX, SY); }
  // outlined copy in front to weave the word through her
  ctx.save(); ctx.globalAlpha = 0.9; ctx.lineWidth = 2.5; ctx.strokeStyle = inv2 ? C.ice : C.paper; ctx.font = `800 ${size}px "JetBrains Mono"`; ctx.textAlign = 'center';
  for (let i = 0; i < word.length; i++) ctx.strokeText(word[i], wx + (i + 0.5) * cell, 640); ctx.restore();
  vText(ctx, '绝缘护体', 1730, 250, 118, inv2 ? C.ink : C.paper, inv2 ? C.paper : C.ink);
  mono(ctx, '[✓] PROTECTION.dll  loaded', 1300, 1000, 26, { color: inv2 ? C.ice : C.paper, weight: 700 });
  ctx.restore();
  const pk = pulse(t, [hit], 14), pk2 = pulse(t, [swap], 16);
  fx.flash = 0.55 * pk + 0.2 * pk2; fx.invert = (t - hit < 1 / 24 + 1e-3) ? 1 : 0;
  fx.aberr = 2 + 12 * Math.max(pk, pk2); fx.glitch = 0.5 * Math.max(pk, pk2); fx.bloom = 0.5; fx.curve = 0.3; fx.scan = 0.08;
}

// SHOT 4 · "Lay down your pieces": the chessboard; six program pieces + the queen "ME".
const PIECES = [
  { i: 1, t: 3.98, type: 'pawn', name: 'EIN', x: -2.5, z: -1.5 },
  { i: 2, t: 4.21, type: 'rook', name: 'DOS', x: 2.5, z: -2.5 },
  { i: 3, t: 4.44, type: 'knight', name: 'TROIS', x: -1.5, z: 1.5 },
  { i: 4, t: 4.67, type: 'bishop', name: 'NE', x: 1.5, z: 1.5 },
  { i: 5, t: 4.90, type: 'pawn', name: 'FEM', x: -3.5, z: 2.5 },
  { i: 6, t: 5.06, type: 'king', name: 'LIU', x: 3.5, z: 0.5 },
  { i: 0, t: beat(11), type: 'queen', name: 'ME', x: 0.5, z: -0.5, me: true },
];
function drawBoard(ctx, t, lt, theta) {
  const cam = camera(theta, 7.2, 9.6, 0.78);
  ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H);
  const sp = ctx.createRadialGradient(W / 2, H / 2 + 60, 60, W / 2, H / 2 + 60, 900);
  sp.addColorStop(0, 'rgba(60,70,170,0.45)'); sp.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = sp; ctx.fillRect(0, 0, W, H);
  // frame then tiles, far to near
  const quad = (pts, fill) => { ctx.beginPath(); pts.forEach((p, i) => { const q = cam(p[0], 0, p[1]); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); }); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); };
  // board thickness (front edge)
  const e = [[-4.4, -4.4], [4.4, -4.4], [4.4, 4.4], [-4.4, 4.4]];
  ctx.beginPath(); e.forEach((p, i) => { const q = cam(p[0], -0.35, p[1]); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); }); ctx.closePath(); ctx.fillStyle = '#07081a'; ctx.fill();
  quad(e, '#0d1030');
  const cells = [];
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) cells.push([i, j, cam(-4 + i + 0.5, 0, -4 + j + 0.5)[2]]);
  cells.sort((a, b) => b[2] - a[2]);
  for (const [i, j, d] of cells) {
    const light = (i + j) % 2 === 0, fog = clamp((d - 7) / 9);
    const x = -4 + i, z = -4 + j;
    const base = light ? [216, 217, 236] : [26, 31, 92];
    const c = base.map(v => Math.round(lerp(v, 12, fog * 0.85)));
    quad([[x, z], [x + 1, z], [x + 1, z + 1], [x, z + 1]], `rgb(${c})`);
  }
  // gloss band
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  const gq = ctx.createLinearGradient(0, 300, W, 900); const gp = 0.35 + 0.1 * Math.sin(lt);
  gq.addColorStop(gp - 0.1, 'rgba(255,255,255,0)'); gq.addColorStop(gp, 'rgba(160,180,255,0.16)'); gq.addColorStop(gp + 0.1, 'rgba(255,255,255,0)');
  quad(e, gq); ctx.restore();
  ctx.strokeStyle = C.cobalt; ctx.lineWidth = 2; ctx.beginPath(); e.forEach((p, i) => { const q = cam(p[0], 0, p[1]); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); }); ctx.closePath(); ctx.stroke();
  // rank/file labels
  ctx.font = '22px VT323'; ctx.fillStyle = C.dim; ctx.textAlign = 'center';
  for (let i = 0; i < 8; i++) { const q = cam(-4 + i + 0.5, 0, -4.2); ctx.fillText('ABCDEFGH'[i], q[0], q[1] + 20); }
  return cam;
}
function shotBoard(ctx, lt, t, fx) {
  const theta = lerp(-0.42, -0.14, E.inOutCubic(inv(3.9, 5.52, t)));
  const cam = drawBoard(ctx, t, lt, theta);
  const list = PIECES.map(p => ({ ...p, d: cam(p.x, 0, p.z)[2] })).sort((a, b) => b.d - a.d);
  for (const p of list) {
    if (t < p.t - 0.2) continue;
    const fall = inv(p.t - 0.2, p.t, t), h = (1 - E.inQuad(fall)) * 6;
    const land = inv(p.t, p.t + 0.16, t);
    const squash = t < p.t ? 1.08 : 1 - 0.22 * Math.sin(Math.PI * land) * (1 - land);
    const [bx, by] = cam(p.x, h, p.z), [, ty] = cam(p.x, h + (p.me ? 1.75 : p.type === 'pawn' ? 1.05 : 1.35), p.z);
    const hh = by - ty;
    // contact shadow + impact ring
    const [gx, gy] = cam(p.x, 0, p.z);
    ctx.save(); ctx.fillStyle = `rgba(0,0,8,${0.25 + 0.4 * fall})`; ctx.beginPath(); ctx.ellipse(gx, gy, hh * 0.38 * (0.6 + 0.4 * fall), hh * 0.1, 0, 0, 7); ctx.fill(); ctx.restore();
    if (t > p.t) {
      const rp = inv(p.t, p.t + 0.45, t);
      ctx.save(); ctx.globalAlpha = 1 - rp; ctx.strokeStyle = p.me ? C.ice : C.paper; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(gx, gy, hh * (0.4 + rp * 1.2), hh * (0.12 + rp * 0.36), 0, 0, 7); ctx.stroke(); ctx.restore();
    }
    if (p.me) {
      const gl = ctx.createRadialGradient(bx, by - hh * 0.5, 5, bx, by - hh * 0.5, hh * 1.4);
      gl.addColorStop(0, 'rgba(169,198,255,0.45)'); gl.addColorStop(1, 'rgba(169,198,255,0)'); ctx.fillStyle = gl; ctx.fillRect(bx - hh * 1.5, by - hh * 2, hh * 3, hh * 3);
      piece(ctx, 'queen', bx, by, hh, C.ice, C.cobalt, C.ink, squash);
      ctx.fillStyle = C.paper; sparkle(ctx, bx + hh * 0.05, by - hh * 1.08, hh * 0.16 * (1 + 0.4 * pulse(t, [p.t], 5)), 0);
    } else piece(ctx, p.type, bx, by, hh, C.paper, '#9fa3c8', C.ink, squash);
    if (t > p.t + 0.05) {               // process tag
      const k = E.outBack(inv(p.t + 0.05, p.t + 0.25, t));
      const label = `[${p.i}] ${p.name}.exe`;
      ctx.save(); ctx.globalAlpha = clamp(k); ctx.translate(bx, by - hh - 30 - 18 * k);
      ctx.font = '700 20px "JetBrains Mono"'; const w = ctx.measureText(label).width + 20;
      ctx.fillStyle = p.me ? C.ice : C.ink; ctx.fillRect(-w / 2, -26, w, 32);
      ctx.strokeStyle = p.me ? C.paper : C.ice; ctx.lineWidth = 1.5; ctx.strokeRect(-w / 2, -26, w, 32);
      ctx.fillStyle = p.me ? C.ink : C.ice; ctx.textAlign = 'center'; ctx.fillText(label, 0, -3);
      ctx.fillStyle = p.me ? C.ice : C.ink; ctx.fillRect(-1, 6, 2, 22);
      ctx.restore();
    }
  }
  const placed = PIECES.filter(p => t >= p.t).length;
  mono(ctx, `PLACE PIECES  ${placed}/7`, 110, 150, 30, { color: C.ice, weight: 700 });
  ctx.fillStyle = C.dim; for (let i = 0; i < 7; i++) { ctx.fillStyle = i < placed ? (i === 6 ? C.ice : C.paper) : '#252a66'; ctx.fillRect(110 + i * 34, 172, 26, 10); }
  fx.curve = 0.3; fx.scan = 0.07; fx.bloom = 0.65; fx.vig = 0.85;
  fx.aberr = 1.4 + 5 * pulse(t, PIECES.map(p => p.t), 12);
  fx.flash = 0.25 * pulse(t, [beat(11)], 10);
}

// SHOT 5 · "And let's begin": the RUN dialog, clicked by the user's cursor.
function arrow(ctx, x, y, s, fill = C.paper, line = C.ink) {
  const P = ['X', 'XX', 'X.X', 'X..X', 'X...X', 'X....X', 'X.....X', 'X......X', 'X.......X', 'X........X', 'X.....XXXXX', 'X..X..X', 'X.X X..X', 'XX  X..X', 'X    X..X', '     X..X', '      XX'];
  P.forEach((row, j) => [...row].forEach((c, i) => { if (c === ' ') return; ctx.fillStyle = c === 'X' ? line : fill; ctx.fillRect(x + i * s, y + j * s, s, s); }));
}
function shotBegin(ctx, lt, t, fx) {
  const click = beat(12);
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2a1d7a'); g.addColorStop(1, C.night);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  halftone(ctx, 0, 0, W, H, 22, 'rgba(122,85,240,0.55)', (x, y) => clamp(1 - Math.hypot(x - 960, y - 520) / 900) * 0.9);
  const pk = pulse(t, [click], 7);
  if (t > click) focusLines(ctx, 960, 520, 140, 520, C.paper, 21 + Math.floor(t * 12), 0.8 * clamp(1 - (t - click) * 2));
  const z = 1 + 0.04 * pk + (t > click ? E.inExpo(inv(click + 0.25, 6.21, t)) * 0.6 : 0);
  ctx.save(); ctx.translate(960, 520); ctx.scale(z, z); ctx.translate(-960, -520);
  const w = windowFrame(ctx, 520, 250, 880, 480, 'world.exe', { fg: C.paper, bg: '#0d1034', barFg: C.navy });
  mono(ctx, 'Begin simulation?', w.x + 60, w.y + 90, 40, { color: C.paper, weight: 700 });
  mono(ctx, '// 让我们开始', w.x + 60, w.y + 140, 28, { color: C.comment });
  const pressed = t > click && t < click + 0.12;
  const bx = w.x + 70, by = w.y + 200, bw = 420, bh = 150, d = pressed ? 6 : 0;
  ctx.fillStyle = C.ink; ctx.fillRect(bx + 8, by + 8, bw, bh);
  ctx.fillStyle = t > click ? C.ice : C.paper; ctx.fillRect(bx + d, by + d, bw, bh);
  ctx.fillStyle = pressed ? '#6d74b8' : '#ffffff'; ctx.fillRect(bx + d, by + d, bw, 6); ctx.fillRect(bx + d, by + d, 6, bh);
  ctx.fillStyle = pressed ? '#ffffff' : '#7c82bf'; ctx.fillRect(bx + d, by + d + bh - 6, bw, 6); ctx.fillRect(bx + d + bw - 6, by + d, 6, bh);
  ctx.fillStyle = C.ink; ctx.beginPath(); ctx.moveTo(bx + d + 90, by + d + 45); ctx.lineTo(bx + d + 150, by + d + 75); ctx.lineTo(bx + d + 90, by + d + 105); ctx.fill();
  mono(ctx, 'RUN', bx + d + 180, by + d + 100, 80, { color: C.ink, weight: 800 });
  const cbx = bx + bw + 60;
  ctx.strokeStyle = '#4b5099'; ctx.lineWidth = 3; ctx.strokeRect(cbx, by, 250, bh);
  mono(ctx, 'CANCEL', cbx + 36, by + 92, 40, { color: '#4b5099', weight: 700 });
  ctx.restore();
  // the user's pointer glides in and clicks
  const mp = E.outCubic(inv(5.5, click - 0.03, t));
  const ax = lerp(1500, bx + 300, mp), ay = lerp(1000, by + 110, mp);
  arrow(ctx, ax, ay, 6);
  if (t > click) { ctx.strokeStyle = C.paper; ctx.lineWidth = 4; const rp = inv(click, click + 0.35, t); ctx.globalAlpha = 1 - rp; ctx.beginPath(); ctx.arc(ax, ay, 20 + 120 * rp, 0, 7); ctx.stroke(); ctx.globalAlpha = 1; }
  fx.curve = 0.35; fx.scan = 0.09; fx.bloom = 0.55; fx.aberr = 1.5 + 9 * pk; fx.invert = (t >= click && t < click + 1 / 24) ? 1 : 0;
  fx.flash = 0.8 * E.inExpo(inv(5.95, 6.21, t));
}

// SHOT 6 · "OBJECT CREATION": a point cloud assembles her line art on a blueprint.
function shotCreate(ctx, lt, t, fx) {
  ctx.fillStyle = '#0a0f3c'; ctx.fillRect(0, 0, W, H);
  bgGrid(ctx, 30, '#121a55', 150, '#1d2672', 0, 0);
  ctx.fillStyle = '#2c3690'; ctx.font = '20px VT323'; ctx.textAlign = 'left';
  for (let x = 150; x < W; x += 150) ctx.fillText(String(x).padStart(4, '0'), x + 4, H - 60);
  for (let y = 150; y < H; y += 150) ctx.fillText(String(y).padStart(4, '0'), 8, y - 4);
  const s = 0.64, X = 1210, Y = 545, SX = 512, SY = 768;
  const pts = A.meta.points, n = pts.length, t0 = 6.21;
  let arrived = 0;
  ctx.fillStyle = C.ice;
  for (let i = 0; i < n; i++) {
    const [px, py] = pts[i];
    const d = hash(i * 13) * 0.32 + (py / 1536) * 0.18;
    const p = inv(t0 + d, t0 + d + 0.34, t); if (p <= 0) continue;
    const e = E.outExpo(p); if (p >= 1) arrived++;
    const a = hash(i * 7 + 1) * Math.PI * 2, r0 = 700 + hash(i * 5 + 2) * 900;
    const sx0 = X + Math.cos(a) * r0, sy0 = Y + Math.sin(a) * r0 * 0.7;
    const tx = X + (px - SX) * s, ty = Y + (py - SY) * s;
    const x = lerp(sx0, tx, e), y = lerp(sy0, ty, e);
    if (p < 1) { const e2 = E.outExpo(Math.max(0, p - 0.08)); ctx.globalAlpha = 0.35; ctx.fillRect(Math.min(x, lerp(sx0, tx, e2)), y, Math.abs(x - lerp(sx0, tx, e2)) + 1, 1); }
    ctx.globalAlpha = 1; ctx.fillRect(x - 1, y - 1, 2.4, 2.4);
  }
  const la = E.outCubic(inv(6.62, 7.0, t));
  if (la > 0) {
    ctx.save(); ctx.globalAlpha = la; ctx.globalCompositeOperation = 'lighter';
    layer(ctx, tinted(A.lines, C.ice, 'lines'), X, Y, s, SX, SY); ctx.restore();
  }
  // vertex selection handles
  if (t > 6.67) for (let k = 0; k < 6; k++) {
    const i = Math.floor(hash(k * 31 + Math.floor((t - 6.67) * 6)) * n), [px, py] = pts[i];
    const x = X + (px - SX) * s, y = Y + (py - SY) * s;
    ctx.strokeStyle = C.paper; ctx.lineWidth = 1.5; ctx.strokeRect(x - 7, y - 7, 14, 14);
    mono(ctx, `v${String(i).padStart(4, '0')} (${(px / 1024).toFixed(2)}, ${(py / 1536).toFixed(2)})`, x + 12, y - 10, 15, { color: C.ice, weight: 400 });
  }
  // title: outline then fill wipe
  const words = [['OBJECT', 330], ['CREATION', 480]];
  words.forEach(([wd, y], i) => {
    const size = 150, cell = size * 0.6, k = inv(6.21 + i * 0.08, 6.21 + i * 0.08 + 0.12, t);
    ctx.save(); ctx.font = `800 ${size}px "JetBrains Mono"`; ctx.textAlign = 'center'; ctx.lineWidth = 2.5; ctx.strokeStyle = C.ice;
    [...wd].forEach((ch, j) => { if (j < k * wd.length) ctx.strokeText(ch, 110 + (j + 0.5) * cell, y); });
    const fw = E.outCubic(inv(6.45 + i * 0.1, 6.9 + i * 0.1, t)) * wd.length * cell;
    ctx.beginPath(); ctx.rect(110, y - size, fw, size * 1.3); ctx.clip();
    ctx.fillStyle = C.paper; [...wd].forEach((ch, j) => ctx.fillText(ch, 110 + (j + 0.5) * cell, y));
    ctx.restore();
  });
  const code = [
    ['> me = new Object("ME");', 6.3],
    [`  vertices ....... ${String(arrived).padStart(4, '0')}`, 6.35],
    [`  edges .......... ${String(Math.floor(arrived * 2.61)).padStart(5, '0')}`, 6.4],
    ['  soul ........... null', 6.8],
  ];
  code.forEach(([s2, tt], i) => { if (t > tt) mono(ctx, s2, 116, 590 + i * 40, 26, { color: i === 3 ? C.lilac : C.ice, weight: i ? 400 : 700, count: Math.floor((t - tt) / 0.012) }); });
  fx.curve = 0.35; fx.scan = 0.1; fx.bloom = 1.0; fx.vig = 0.6; fx.aberr = 1.6;
  fx.flash = 0.5 * pulse(t, [6.21], 14);
}

// SHOT 7 · "Fill in my data parameters": properties dialog paints her in flat cel colours.
const PARAMS = [
  { t: 7.16, k: 'name', v: '"ME"' },
  { t: 7.26, k: 'type', v: 'AI  // bride.ver' },
  { t: 7.40, k: 'dress', v: '#1B1D27', groups: [0, 1] },
  { t: 7.70, k: 'legs', v: '#4C4A58', groups: [2] },
  { t: 7.98, k: 'ribbon', v: '#5C69CA', groups: [3, 4] },
  { t: 8.28, k: 'hair', v: '#879DC5', groups: [5] },
  { t: 8.58, k: 'skin', v: '#BFC1C8', groups: [6] },
  { t: 8.80, k: 'heart', v: 'null' },
];
function shotParams(ctx, lt, t, fx) {
  const R = beat(19);                   // render() on the big accent
  ctx.fillStyle = '#0a0f3c'; ctx.fillRect(0, 0, W, H);
  bgGrid(ctx, 30, '#111850', 150, '#1a2368', 0, -lt * 40);
  let s = lerp(1.36, 1.46, E.inOutCubic(inv(7.13, R, t))), X = 1370, Y = 450, SX = 528, SY = 250;
  if (t > R) { const k = E.outCubic(inv(R, 9.95, t)); s = lerp(1.62, 1.95, k); SY = lerp(250, 200, k); Y = lerp(430, 470, k); }
  // moon rim behind (continuity with the key visual)
  moon(ctx, X + (512 - SX) * s, Y + (250 - SY) * s, 258 * s, clamp((t - 7.13) * 2) * 0.9);
  if (t < R) {
    const lineK = inv(7.35, 7.8, t);
    layer(ctx, tinted(A.sil, '#0d1245', 'sil'), X, Y, s, SX, SY);
    for (const P of PARAMS) {
      if (!P.groups || t < P.t) continue;
      const wp = E.outCubic(inv(P.t, P.t + 0.22, t));
      for (const g of P.groups) {
        ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H * wp); ctx.clip();
        layer(ctx, A.flats[g], X, Y, s, SX, SY); ctx.restore();
      }
      if (wp < 1) { ctx.fillStyle = C.paper; ctx.fillRect(700, H * wp - 2, W, 3); }
    }
    ctx.save(); ctx.globalAlpha = 1 - lineK; ctx.globalCompositeOperation = 'lighter';
    layer(ctx, tinted(A.lines, C.ice, 'lines'), X, Y, s, SX, SY); ctx.restore();
    ctx.save(); ctx.globalAlpha = lineK * 0.85; layer(ctx, tinted(A.lines, '#0b0c1c', 'linesInk'), X, Y, s, SX, SY); ctx.restore();
  } else {
    const wp = E.outCubic(inv(R, R + 0.2, t));
    for (let g = 0; g < 7; g++) layer(ctx, A.flats[g], X, Y, s, SX, SY);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H * wp); ctx.clip(); drawCut(ctx, X, Y, s, SX, SY); ctx.restore();
    if (wp < 1) { ctx.fillStyle = C.paper; ctx.fillRect(0, H * wp - 3, W, 6); }
  }
  // properties window
  const w = windowFrame(ctx, 90, 130, 740, 610, 'me.obj — Properties', { fg: C.ice });
  PARAMS.forEach((P, i) => {
    if (t < P.t) return;
    const y = w.y + 66 + i * 58, n = Math.floor((t - P.t) / 0.03);
    mono(ctx, P.k.padEnd(8, ' ') + '.....', w.x + 34, y, 30, { color: C.comment, weight: 400 });
    const vx = w.x + 34 + 13 * 18;
    mono(ctx, P.v, vx, y, 30, { color: P.v === 'null' ? C.lilac : C.paper, weight: 700, count: n });
    if (P.groups && n > 2) { ctx.fillStyle = A.meta.groups[P.groups[P.groups.length - 1]] ? `rgb(${A.meta.groups[P.groups[P.groups.length - 1]].rgb})` : C.paper; ctx.fillRect(w.x + w.w - 90, y - 28, 50, 32); ctx.strokeStyle = C.ice; ctx.lineWidth = 2; ctx.strokeRect(w.x + w.w - 90, y - 28, 50, 32); }
  });
  // render() button
  const by = w.y + w.h - 78, pressed = t >= R && t < R + 0.1;
  ctx.fillStyle = t >= R ? C.ice : '#1d2366'; ctx.fillRect(w.x + 34, by, 280, 54);
  mono(ctx, 'render()', w.x + 62, by + 38, 30, { color: t >= R ? C.ink : C.ice, weight: 800 });
  if (pressed) { ctx.strokeStyle = C.paper; ctx.lineWidth = 3; ctx.strokeRect(w.x + 28, by - 6, 292, 66); }
  if (t > R + 0.15) mono(ctx, 'status: RENDERED ✓', w.x + 350, by + 36, 24, { color: C.ice, weight: 700 });
  // eye inset pops up after render
  if (t > beat(20)) {
    const k = E.outBack(inv(beat(20), beat(20) + 0.2, t));
    const ww = 250, wh = 470, wx = 760, wy = 420 + (1 - k) * 60;
    ctx.save(); ctx.globalAlpha = clamp(k);
    const ib = windowFrame(ctx, wx, wy, ww, wh, 'eye.bmp', { fg: C.paper, bar: 30 });
    const px = inv(beat(20), beat(20) + 0.35, t) < 1 ? 12 : 1;
    ctx.imageSmoothingEnabled = px === 1;
    if (px > 1) { const tmp = canvas(Math.ceil(ib.w / px), Math.ceil(ib.h / px)); tmp.getContext('2d').drawImage(A.inset, 0, 0, tmp.width, tmp.height); ctx.drawImage(tmp, ib.x, ib.y, ib.w, ib.h); }
    else ctx.drawImage(A.inset, ib.x, ib.y, ib.w, ib.h);
    ctx.imageSmoothingEnabled = true; ctx.restore();
  }
  fx.curve = 0.3; fx.scan = 0.08; fx.bloom = 0.6; fx.vig = 0.55; fx.aberr = 1.3 + 8 * pulse(t, [R], 10);
  fx.flash = 0.6 * pulse(t, [R], 12) + 0.25 * pulse(t, [7.13], 14);
}

// SHOT 8 · "INITIALIZATION": progressive raster load of the full illustration.
const STEPS = [[9.95, 96], [beat(22) - 0.23, 48], [beat(22), 24], [beat(22) + 0.23, 12], [beat(23), 6], [beat(23) + 0.23, 1]];
const pixCache = new Map();
function pixelated(img, w, h, block) {
  const k = block + 'x' + w; if (pixCache.has(k)) return pixCache.get(k);
  const c = canvas(Math.max(1, Math.round(w / block)), Math.max(1, Math.round(h / block)));
  const x = c.getContext('2d'); x.drawImage(img, 0, 0, c.width, c.height); pixCache.set(k, c); return c;
}
function shotInit(ctx, lt, t, fx) {
  ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H);
  const prog = clamp((t - 9.95) / (11.1 - 9.95));
  // giant outlined keyword behind the image window, filling with progress
  const word = 'INITIALIZATION', size = 196, cell = size * 0.6, wx = W / 2 - word.length * cell / 2, wy = 610;
  ctx.save(); ctx.font = `800 ${size}px "JetBrains Mono"`; ctx.textAlign = 'center'; ctx.lineWidth = 2; ctx.strokeStyle = '#2d3480';
  [...word].forEach((ch, i) => ctx.strokeText(ch, wx + (i + 0.5) * cell, wy));
  ctx.beginPath(); ctx.rect(wx, 0, word.length * cell * prog, H); ctx.clip(); ctx.fillStyle = C.cobalt;
  [...word].forEach((ch, i) => ctx.fillText(ch, wx + (i + 0.5) * cell, wy)); ctx.restore();
  // hex dump (left) and memory map (right)
  ctx.font = '26px VT323'; ctx.textAlign = 'left';
  const row0 = Math.floor((t - 9.95) * 40);
  for (let r = 0; r < 18; r++) {
    const addr = (0xA400 + (row0 + r) * 16).toString(16).toUpperCase().padStart(6, '0');
    let s = '0x' + addr + ' ';
    for (let b = 0; b < 8; b++) s += ' ' + Math.floor(hash2(row0 + r, b) * 256).toString(16).toUpperCase().padStart(2, '0');
    ctx.fillStyle = r === 17 ? C.ice : '#3a4290'; ctx.fillText(s, 100, 150 + r * 34);
  }
  const mx = 1440, my = 130, cw = 22, ch2 = 22;
  for (let j = 0; j < 22; j++) for (let i = 0; i < 16; i++) {
    const on = hash2(i, j) < prog * 1.05;
    ctx.fillStyle = on ? (hash2(j, i) < 0.2 ? C.ice : C.cobalt) : '#161a45';
    ctx.fillRect(mx + i * (cw + 4), my + j * (ch2 + 4), cw, ch2);
  }
  mono(ctx, 'MEM MAP  ' + String(Math.floor(prog * 640)).padStart(3, '0') + 'K', mx, my + 22 * 26 + 36, 22, { color: C.ice, weight: 700 });
  // the image window
  const ih = 780, iw = ih * 1024 / 1536, ix = W / 2 - iw / 2, iy = 140;
  const b = windowFrame(ctx, ix - 2, iy - 36, iw + 4, ih + 38, 'world.bmp  1024×1536', { fg: C.ice, bar: 34 });
  let k = 0; for (let i = 0; i < STEPS.length; i++) if (t >= STEPS[i][0]) k = i;
  const cur = STEPS[k], prev = STEPS[Math.max(0, k - 1)];
  const sweep = E.outCubic(inv(cur[0], cur[0] + 0.16, t));
  ctx.imageSmoothingEnabled = false;
  const draw = block => { if (block <= 1) { ctx.imageSmoothingEnabled = true; ctx.drawImage(A.full, b.x, b.y, b.w, b.h); ctx.imageSmoothingEnabled = false; } else ctx.drawImage(pixelated(A.full, b.w, b.h, block), b.x, b.y, b.w, b.h); };
  draw(k === 0 ? cur[1] : prev[1]);
  ctx.save(); ctx.beginPath(); ctx.rect(b.x, b.y, b.w, b.h * sweep); ctx.clip(); draw(cur[1]); ctx.restore();
  ctx.imageSmoothingEnabled = true;
  if (sweep < 1) { ctx.fillStyle = C.paper; ctx.fillRect(b.x, b.y + b.h * sweep - 2, b.w, 4); ctx.fillStyle = 'rgba(169,198,255,0.25)'; ctx.fillRect(b.x, b.y + b.h * sweep - 24, b.w, 22); }
  // progress bar
  const px = ix, py = iy + ih + 30, pw = iw;
  ctx.strokeStyle = C.ice; ctx.lineWidth = 2; ctx.strokeRect(px, py, pw, 30);
  const nb = 24; for (let i = 0; i < nb * prog; i++) { ctx.fillStyle = C.ice; ctx.fillRect(px + 5 + i * (pw - 10) / nb, py + 5, (pw - 10) / nb - 4, 20); }
  mono(ctx, String(Math.floor(prog * 100)).padStart(3, ' ') + '%', px + pw + 16, py + 26, 26, { color: C.paper, weight: 700 });
  fx.curve = 0.35; fx.scan = 0.1; fx.mask = 0.18; fx.bloom = 0.55; fx.aberr = 1.4 + 5 * pulse(t, STEPS.map(s => s[0]), 12);
  fx.flash = 0.4 * pulse(t, [9.95], 14) + 0.9 * E.inExpo(inv(11.02, 11.2, t));
}

// SHOT 9 · "Set up our new world": a wireframe globe becomes the moon; a grid floor unrolls.
function globe(ctx, cx, cy, r, rot, tilt, a) {
  const P = (la, lo) => {
    const X = r * Math.cos(la) * Math.sin(lo + rot), Y = r * Math.sin(la), Z = r * Math.cos(la) * Math.cos(lo + rot);
    return [cx + X, cy + Y * Math.cos(tilt) - Z * Math.sin(tilt), Y * Math.sin(tilt) + Z * Math.cos(tilt)];
  };
  ctx.save(); ctx.lineWidth = 2;
  const seg = (pts) => { for (let i = 1; i < pts.length; i++) { const f = pts[i][2] > 0; ctx.strokeStyle = f ? `rgba(169,198,255,${a})` : `rgba(90,110,220,${a * 0.35})`; ctx.beginPath(); ctx.moveTo(pts[i - 1][0], pts[i - 1][1]); ctx.lineTo(pts[i][0], pts[i][1]); ctx.stroke(); } };
  for (let la = -75; la <= 75; la += 15) { const pts = []; for (let lo = 0; lo <= 360; lo += 10) pts.push(P(la * Math.PI / 180, lo * Math.PI / 180)); seg(pts); }
  for (let lo = 0; lo < 360; lo += 20) { const pts = []; for (let la = -90; la <= 90; la += 10) pts.push(P(la * Math.PI / 180, lo * Math.PI / 180)); seg(pts); }
  ctx.restore();
}
function floorGrid(ctx, t, hz, reveal, a = 1) {
  ctx.save(); ctx.globalAlpha = a;
  const g = ctx.createLinearGradient(0, hz, 0, H); g.addColorStop(0, '#0d1140'); g.addColorStop(1, '#05050b');
  ctx.fillStyle = g; ctx.fillRect(0, hz, W, H - hz);
  ctx.strokeStyle = 'rgba(77,94,224,0.7)'; ctx.lineWidth = 1.5;
  const off = (t * 0.9) % 1;
  for (let i = 0; i < 26; i++) {
    const z = 1 + i - off; const y = hz + 380 / z; if (y > H) continue;
    if (i / 26 > reveal) break;
    ctx.globalAlpha = a * clamp(1 - i / 26) ; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  ctx.globalAlpha = a;
  for (let j = -14; j <= 14; j++) {
    if (Math.abs(j) / 14 > reveal) continue;
    ctx.beginPath(); ctx.moveTo(W / 2, hz); ctx.lineTo(W / 2 + j * 190, H); ctx.stroke();
  }
  ctx.restore();
}
function drawWorld(ctx, t, o = {}) {
  const hz = 720;
  const g = ctx.createLinearGradient(0, 0, 0, hz); g.addColorStop(0, C.ink); g.addColorStop(1, '#10144a');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, hz);
  stars(ctx, t, 3, 140, clamp((t - 11.2) * 2), hz - 20);
  const rise = E.outCubic(inv(11.2, 12.0, t)), cy = lerp(700, 360, rise), R = 300;
  const fill = E.outCubic(inv(beat(26) - 0.05, beat(26) + 0.3, t));
  if (fill > 0) moon(ctx, W / 2, cy, R, fill);
  globe(ctx, W / 2, cy, R, t * 0.9, 0.35, (1 - fill) * 0.9 + 0.1);
  floorGrid(ctx, t, hz, E.outCubic(inv(11.25, 11.9, t)));
  // moon reflection
  if (fill > 0) { ctx.save(); ctx.globalAlpha = 0.18 * fill; ctx.fillStyle = C.paper; for (let k = 0; k < 14; k++) { const yy = hz + 20 + k * 22, w2 = R * (1 - k / 16) * (0.8 + 0.2 * Math.sin(t * 6 + k)); ctx.fillRect(W / 2 - w2, yy, w2 * 2, 6); } ctx.restore(); }
  // she materialises on the horizon
  const ap = beat(25);
  if (t > ap - 0.12) {
    const s = 0.5, X = W / 2 + 10, Y = 1000, SX = 495, SY = 1490;
    const beam = clamp(1 - Math.abs(t - ap) / 0.25);
    ctx.save(); ctx.globalAlpha = beam * 0.8; const bg2 = ctx.createLinearGradient(X - 90, 0, X + 90, 0);
    bg2.addColorStop(0, 'rgba(169,198,255,0)'); bg2.addColorStop(0.5, 'rgba(236,235,243,0.95)'); bg2.addColorStop(1, 'rgba(169,198,255,0)');
    ctx.fillStyle = bg2; ctx.fillRect(X - 90, 0, 180, Y); ctx.restore();
    const up = E.outCubic(inv(ap, ap + 0.3, t));
    if (up > 0) {
      const top = Y - 1536 * s * up;
      ctx.save(); ctx.beginPath(); ctx.rect(0, top, W, H); ctx.clip();
      drawCut(ctx, X, Y, s, SX, SY); ctx.restore();
      ctx.save(); ctx.globalAlpha = 0.22 * up; ctx.translate(0, 2 * Y); ctx.scale(1, -1);   // reflection
      ctx.beginPath(); ctx.rect(0, Y - 260, W, 260); ctx.clip(); drawCut(ctx, X, Y, s, SX, SY); ctx.restore();
      if (up < 1) { ctx.fillStyle = C.paper; ctx.fillRect(X - 260, top - 2, 520, 3); }
    }
  }
  if (o.code !== false) {
    const lines = [['world = new World();', 11.24], ['world.moon  = new Circle(300);', 11.5], ['world.floor = new Grid(Infinity);', 11.72], ['world.add(me);', 11.8], ['world.add(you);   // pending...', 12.25]];
    lines.forEach(([s2, tt], i) => { if (t > tt) mono(ctx, s2, 110, 150 + i * 38, 26, { color: i === 4 ? C.lilac : C.ice, weight: i ? 400 : 700, count: Math.floor((t - tt) / 0.014) }); });
  }
}
function shotWorld(ctx, lt, t, fx) {
  const z = lerp(1, 1.05, E.inOutCubic(inv(11.2, 12.67, t)));
  ctx.save(); ctx.translate(W / 2, 600); ctx.scale(z, z); ctx.translate(-W / 2, -600);
  drawWorld(ctx, t); ctx.restore();
  fx.curve = 0.3; fx.scan = 0.07; fx.bloom = 0.9; fx.vig = 0.7; fx.aberr = 1.3;
  fx.flash = 0.7 * pulse(t, [11.2], 10) + 0.35 * pulse(t, [beat(25)], 9) + 0.3 * pulse(t, [beat(26)], 8);
}

// SHOT 10 · "And let's begin the": pull back — the world is running inside a CRT on a desk.
const inner = canvas(W, H), ictx = inner.getContext('2d');
function crt(ctx, x, y, w, h) {                   // monitor housing around screen rect
  const bx = x - 70, by = y - 60, bw = w + 140, bh = h + 170;
  ctx.fillStyle = '#10122e'; ctx.beginPath(); ctx.moveTo(bx + bw * 0.28, by + bh); ctx.lineTo(bx + bw * 0.72, by + bh); ctx.lineTo(bx + bw * 0.8, by + bh + 70); ctx.lineTo(bx + bw * 0.2, by + bh + 70); ctx.fill();
  ctx.fillStyle = '#3c4174'; roundRect(ctx, bx - 6, by - 6, bw + 12, bh + 12, 34); ctx.fill();
  ctx.fillStyle = '#5a5f97'; roundRect(ctx, bx, by, bw, bh, 30); ctx.fill();
  ctx.fillStyle = '#7d83bd'; roundRect(ctx, bx + 8, by + 6, bw - 16, 26, 14); ctx.fill();
  ctx.fillStyle = '#474c83'; roundRect(ctx, bx + 10, by + bh - 70, bw - 20, 60, 16); ctx.fill();
  ctx.lineWidth = 6; ctx.strokeStyle = C.ink; roundRect(ctx, bx - 6, by - 6, bw + 12, bh + 12, 34); ctx.stroke();
  ctx.fillStyle = '#23264d'; roundRect(ctx, x - 22, y - 22, w + 44, h + 44, 26); ctx.fill();
  ctx.fillStyle = '#2c3060'; for (let i = 0; i < 9; i++) ctx.fillRect(bx + bw - 160 + i * 14, by + bh - 48, 6, 26);
  ctx.fillStyle = C.ice; ctx.beginPath(); ctx.arc(bx + 60, by + bh - 36, 7, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(169,198,255,0.4)'; ctx.beginPath(); ctx.arc(bx + 60, by + bh - 36, 16, 0, 7); ctx.fill();
  ctx.font = '800 18px "JetBrains Mono"'; ctx.fillStyle = '#9ea4d8'; ctx.textAlign = 'left'; ctx.fillText('WORLD/98', bx + 90, by + bh - 29);
}
function screenGlass(ctx, x, y, w, h) {
  scanBars(ctx, x, y, w, h, 0.22, 3);
  const g = ctx.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, 'rgba(255,255,255,0.10)'); g.addColorStop(0.4, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  const v = ctx.createRadialGradient(x + w / 2, y + h / 2, h * 0.3, x + w / 2, y + h / 2, w * 0.62);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.55)'); ctx.fillStyle = v; ctx.fillRect(x, y, w, h);
}
const SCR = { x: 690, y: 250, w: 540, h: 304 };
function room(ctx, t) {
  ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H);
  const g = ctx.createLinearGradient(0, 760, 0, H); g.addColorStop(0, '#15183f'); g.addColorStop(1, '#07071a');
  ctx.fillStyle = g; ctx.fillRect(0, 760, W, H - 760);
  const glow = ctx.createRadialGradient(W / 2, 700, 40, W / 2, 800, 800); glow.addColorStop(0, 'rgba(120,150,255,0.35)'); glow.addColorStop(1, 'rgba(120,150,255,0)');
  ctx.fillStyle = glow; ctx.fillRect(0, 300, W, H - 300);
  // cable from the back of the monitor: the power line again
  ctx.lineCap = 'round'; ctx.lineWidth = 16; ctx.strokeStyle = C.ink; ctx.beginPath(); ctx.moveTo(1300, 700); ctx.bezierCurveTo(1560, 760, 1500, 980, 1920, 1000); ctx.stroke();
  ctx.lineWidth = 8; ctx.strokeStyle = C.deep; ctx.stroke();
  // pieces left on the desk
  piece(ctx, 'queen', 1470, 850, 150, C.ice, C.cobalt, C.ink);
  piece(ctx, 'pawn', 1580, 862, 96, C.paper, '#9fa3c8', C.ink);
  crt(ctx, SCR.x, SCR.y, SCR.w, SCR.h);
}
function shotMonitor(ctx, lt, t, fx) {
  drawWorld(ictx, t, { code: false });
  const k = E.outExpo(inv(12.67, 13.3, t));
  const rx = lerp(0, SCR.x, k), ry = lerp(0, SCR.y, k), rw = lerp(W, SCR.w, k), rh = lerp(H, SCR.h, k);
  const zs = rw / SCR.w;
  ctx.save();
  ctx.translate(rx, ry); ctx.scale(zs, zs); ctx.translate(-SCR.x, -SCR.y);
  room(ctx, t);
  ctx.restore();
  ctx.drawImage(inner, rx, ry, rw, rh);
  screenGlass(ctx, rx, ry, rw, rh);
  // the user's cursor hovering over the world
  if (k > 0.6) arrow(ctx, lerp(1320, 1000, E.outCubic(inv(13.05, 13.5, t))), lerp(700, 470, E.outCubic(inv(13.05, 13.5, t))), 4);
  fx.curve = 0.25; fx.scan = 0.05; fx.bloom = 0.5; fx.vig = 0.9; fx.aberr = 1.2;
}

// SHOT 11 · "SIMULATION": dive back through the glass into a glitch storm.
function shotSim(ctx, lt, t, fx) {
  const dive = E.inExpo(inv(13.59, 13.86, t));
  if (t < 13.86) {
    drawWorld(ictx, t, { code: false });
    const rx = lerp(SCR.x, -W * 0.1, dive), ry = lerp(SCR.y, -H * 0.1, dive), rw = lerp(SCR.w, W * 1.2, dive), rh = lerp(SCR.h, H * 1.2, dive);
    const zs = rw / SCR.w;
    ctx.save(); ctx.translate(rx, ry); ctx.scale(zs, zs); ctx.translate(-SCR.x, -SCR.y); room(ctx, t); ctx.restore();
    ctx.drawImage(inner, rx, ry, rw, rh);
    screenGlass(ctx, rx, ry, rw, rh);
    fx.mask = 0.8 * dive; fx.scan = 0.1 + 0.3 * dive; fx.aberr = 2 + 10 * dive; fx.curve = 0.3 + dive;
    return;
  }
  const holds = [[13.86, C.ink], [beat(30), C.cobalt], [beat(30) + 0.23, C.ink], [beat(31), C.paper], [beat(31) + 0.23, C.ink]];
  let bg = C.ink; for (const [tt, c] of holds) if (t >= tt) bg = c;
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  // her face, pushed in, duotone on the paper hold
  const s = lerp(2.4, 2.9, E.inCubic(inv(13.86, 14.98, t))), X = 960, Y = 520, SX = 528, SY = 178;
  ctx.save(); ctx.globalAlpha = bg === C.paper ? 1 : 0.85;
  if (bg === C.paper) { layer(ctx, tinted(A.sil, C.navy, 'sil'), X, Y, s, SX, SY); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.9; layer(ctx, tinted(A.lines, C.paper, 'lines'), X, Y, s, SX, SY); }
  else drawCut(ctx, X, Y, s, SX, SY);
  ctx.restore();
  scanBars(ctx, 0, 0, W, H, 0.25, 4);
  // letters crash in one by one
  const word = 'SIMULATION', size = 230, cell = size * 0.6, wx = W / 2 - word.length * cell / 2;
  [...word].forEach((ch, i) => {
    const ti = 13.9 + i * 0.055; if (t < ti) return;
    const k = E.outBack(inv(ti, ti + 0.12, t));
    const jy = (hash(i * 5 + Math.floor(t * 12)) - 0.5) * 30 * clamp((t - 14.4) * 2);
    const x = wx + (i + 0.5) * cell, y = 640 + (1 - k) * -120 + jy;
    ctx.save(); ctx.translate(x, y); ctx.scale(1, clamp(k, 0, 1.2));
    ctx.font = `800 ${size}px "JetBrains Mono"`; ctx.textAlign = 'center';
    const outline = i % 3 === 1;
    ctx.fillStyle = bg === C.paper ? C.ink : C.paper; ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 4;
    if (outline) ctx.strokeText(ch, 0, 0); else { ctx.fillStyle = bg === C.cobalt ? C.ink : C.cobalt; ctx.fillText(ch, 8, 8); ctx.fillStyle = bg === C.paper ? C.ink : C.paper; ctx.fillText(ch, 0, 0); }
    ctx.restore();
  });
  vText(ctx, '模拟游戏', 150, 250, 112, bg === C.paper ? C.paper : C.ink, bg === C.paper ? C.ink : C.paper);
  mono(ctx, 'world.run() ▸ SIMULATION_MODE = true', 1020, 960, 24, { color: bg === C.paper ? C.navy : C.ice, weight: 700 });
  const build = inv(14.3, 14.97, t);
  fx.glitch = 0.15 + 0.7 * build * build; fx.aberr = 3 + 10 * build; fx.curve = 0.4; fx.scan = 0.12; fx.bloom = 0.6;
  fx.invert = (Math.abs(t - beat(30)) < 1 / 48 || Math.abs(t - beat(31)) < 1 / 48) ? 1 : 0;
  fx.flash = E.inExpo(inv(14.8, 14.98, t)) * 0.9 + 0.3 * pulse(t, [13.86], 12);
  fx.pixel = (t > 14.6 && Math.floor(t * 24) % 3 === 0) ? 8 : 0;
}

// SHOT 12 · Title "world.execute(me);": the key visual after the lyric sheet's title line.
function keyVisual(ctx, t, cam) {
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0c0f33'); g.addColorStop(0.7, '#07081c'); g.addColorStop(1, C.ink);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  stars(ctx, t, 17, 110, 0.9, 900);
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(cam.rot || 0); ctx.scale(cam.z, cam.z); ctx.translate(-W / 2 + cam.x, -H / 2 + cam.y);
  const s = cam.s, X = 960, Y = 1045, SX = 495, SY = 1490;
  const P = toScreen(X, Y, s, SX, SY);
  const [mx, my] = P(515, 245);
  moon(ctx, mx - cam.x * 0.4, my - cam.y * 0.4 + lerp(40, 10, E.outCubic(inv(14.98, 17, t))), 285 * s / 0.66);
  // floor
  const hz = 960;
  ctx.fillStyle = '#0a0c26'; ctx.fillRect(-200, hz, W + 400, H - hz + 200);
  for (let i = -8; i < 9; i++) { ctx.fillStyle = i % 2 ? 'rgba(77,94,224,0.18)' : 'rgba(236,235,243,0.06)'; ctx.beginPath(); ctx.moveTo(W / 2 + i * 40, hz); ctx.lineTo(W / 2 + (i + 1) * 40, hz); ctx.lineTo(W / 2 + (i + 1) * 360, H + 200); ctx.lineTo(W / 2 + i * 360, H + 200); ctx.fill(); }
  petals(ctx, t, 60, 5, 0, 0.9, 0.9);
  // rim light + figure + reflection
  ctx.save(); ctx.globalAlpha = 0.7; layer(ctx, tinted(A.sil, C.ice, 'sil'), X - 5, Y - 4, s, SX, SY); ctx.restore();
  drawCut(ctx, X, Y, s, SX, SY);
  ctx.save(); ctx.globalAlpha = 0.2; ctx.translate(0, 2 * Y); ctx.scale(1, -1); ctx.beginPath(); ctx.rect(-200, Y - 300, W + 400, 300); ctx.clip(); drawCut(ctx, X, Y, s, SX, SY); ctx.restore();
  petals(ctx, t, 60, 5, 0.9, 1.4, 1);
  ctx.restore();
  // the illustration's cross and bars, redrawn as screen-space UI lines
  const cp = E.outCubic(inv(15.15, 15.7, t));
  ctx.fillStyle = C.paper; ctx.fillRect(290, 150, 3, 330 * cp); ctx.fillRect(170, 260, 250 * cp, 3);
  ctx.fillStyle = 'rgba(236,235,243,0.35)'; ctx.fillRect(170, 262, 250 * cp, 1);
  ctx.fillStyle = C.cobalt; ctx.fillRect(160, 800, 180 * cp, 10); ctx.fillStyle = C.paper; ctx.fillRect(160, 816, 110 * cp, 6);
}
function titleType(ctx, t) {
  const rows = [['world.', 15.05], ['execute', 15.35], ['(me);', 15.75]];
  let last = null;
  rows.forEach(([s, t0], i) => {
    if (t < t0) return;
    const n = Math.min(s.length, Math.floor((t - t0) / 0.045) + 1);
    last = mono(ctx, s, 150, 480 + i * 78, 66, { color: C.paper, weight: 400, count: n }); last.y = 480 + i * 78;
  });
  if (last) cursor(ctx, last.x1 + 6, last.y, 66, t, C.ice, t < 16.05);
  if (t > beat(35)) {
    const k = inv(beat(35), beat(35) + 0.3, t);
    mono(ctx, '// music : Mili', 154, 706, 24, { color: C.comment, count: Math.floor(k * 16) });
    mono(ctx, '// MV demo 00:00-00:20', 154, 742, 24, { color: C.comment, count: Math.floor(k * 24) });
  }
}
function insetPanel(ctx, t) {
  const t0 = beat(35) + 0.1; if (t < t0) return;
  const k = E.outCubic(inv(t0, t0 + 0.4, t)), x = 1560, y = 150, w = 160, h = 572;
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h * k); ctx.clip(); ctx.drawImage(A.inset, x, y, w, h); scanBars(ctx, x, y, w, h, 0.18, 3); ctx.restore();
  ctx.strokeStyle = C.paper; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h * k);
  ctx.fillStyle = C.paper; ctx.fillRect(x - 40, y + h * k + 30, 120 * k, 3); ctx.fillStyle = C.cobalt; ctx.fillRect(x + 20, y + h * k + 44, 160 * k, 8);
}
function hudStatus(ctx, t) {
  const rows = [['me.exe', ''], ['status', 'RUNNING'], ['user', 'you'], ['uptime', `00:00:${String(Math.floor(t)).padStart(2, '0')}`]];
  rows.forEach(([k, v], i) => mono(ctx, `${k.padEnd(7, ' ')}${v ? ': ' + v : ''}`, 1450, 820 + i * 34, 24, { color: i ? C.ice : C.paper, weight: i ? 400 : 800 }));
}
const off2 = canvas(W, H), octx = off2.getContext('2d');
function shotTitle(ctx, lt, t, fx) {
  const hit = 14.98, cut1 = beat(37), cut2 = beat(40), off = 1e9;   // (the demo ended with a CRT power-off here)
  const drawWide = (c, tt, variant) => {
    const k = inv(hit, cut1, tt);
    const cam = variant ? { z: lerp(1.0, 1.035, inv(cut2, off, tt)), x: -60, y: 250, s: 0.8, rot: -0.025 } : { z: lerp(1.0, 1.06, E.outCubic(k)), x: 0, y: 0, s: 0.66, rot: 0 };
    keyVisual(c, tt, cam);
    titleType(c, tt); insetPanel(c, tt);
    if (variant) hudStatus(c, tt);
  };
  if (t < cut1) drawWide(ctx, t, 0);
  else if (t < cut2) {                                // close-up insert
    const k = inv(cut1, cut2, t);
    const g = ctx.createLinearGradient(0, 0, W, 0); g.addColorStop(0, '#1a1f6a'); g.addColorStop(1, '#070818');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const s = lerp(2.25, 2.45, E.inOutCubic(k)), X = 1040, Y = lerp(560, 530, k), SX = 528, SY = 190;
    moon(ctx, X + (515 - SX) * s, Y + (245 - SY) * s, 258 * s, 0.72);   // dimmer: the face sits right on the disc
    petals(ctx, t, 30, 9, 0, 0.8, 0.7);
    ctx.save(); ctx.globalAlpha = 0.8; layer(ctx, tinted(A.sil, C.ice, 'sil'), X - 8, Y - 5, s, SX, SY); ctx.restore();
    drawCut(ctx, X, Y, s, SX, SY);
    softPetals(ctx, t, 26, 13, 1.1, 2, 1);
    mono(ctx, 'while (you.away) {', 110, 880, 30, { color: C.paper, weight: 700, count: Math.floor((t - cut1) / 0.03) });
    mono(ctx, '    me.wait();', 110, 924, 30, { color: C.ice, weight: 400, count: Math.floor((t - cut1 - 0.5) / 0.03) });
    mono(ctx, '}', 110, 968, 30, { color: C.paper, weight: 700, count: t > cut1 + 0.9 ? 1 : 0 });
  } else if (t < off) drawWide(ctx, t, 1);
  else {                                              // CRT power-off, bookending the opening
    drawWide(octx, off, 1);
    ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H);
    const v = E.inExpo(inv(off, off + 0.16, t)), h2 = E.inExpo(inv(off + 0.16, off + 0.28, t));
    const sh = Math.max(3, H * (1 - v)), sw = Math.max(4, W * (1 - h2));
    ctx.save(); ctx.globalAlpha = clamp(1 - inv(off + 0.28, 20.0, t));
    ctx.drawImage(off2, W / 2 - sw / 2, H / 2 - sh / 2, sw, sh);
    ctx.fillStyle = `rgba(230,238,255,${v})`; ctx.fillRect(W / 2 - sw / 2, H / 2 - sh / 2, sw, sh);
    ctx.restore();
    if (t > off + 0.28) { ctx.fillStyle = `rgba(230,238,255,${clamp(1 - inv(off + 0.28, 20, t))})`; ctx.beginPath(); ctx.arc(W / 2, H / 2, 5, 0, 7); ctx.fill(); }
    fx.noHud = true;
  }
  fx.curve = 0.3; fx.scan = 0.06; fx.bloom = (t >= cut1 && t < cut2) ? 0.22 : 0.45; fx.vig = 0.75; fx.aberr = 1.2 + 4 * pulse(t, [cut1, cut2], 10);
  fx.flash = 1.0 * pulse(t, [hit], 5) + 0.2 * pulse(t, [cut1, cut2], 12);
  fx.glitch = 0.4 * pulse(t, [cut1, cut2], 20);
  fx.noLyric = true;
}

export const SHOTS = [
  { t0: 0, t1: beat(3), name: 'boot', draw: shotBoot, lyric: { x: 104, y: 930 } },
  { t0: beat(3), t1: beat(6), name: 'equip', draw: shotEquip, lyric: { x: 104, y: 960, theme: 'light' }, theme: 'light' },
  { t0: beat(6), t1: beat(8), name: 'protection', draw: shotProtect, lyric: { x: 104, y: 930, history: 0 } },
  { t0: beat(8), t1: 5.52, name: 'board', draw: shotBoard, lyric: { x: 104, y: 930 } },
  { t0: 5.52, t1: beat(13), name: 'begin', draw: shotBegin, lyric: { x: 104, y: 930 } },
  { t0: beat(13), t1: beat(15), name: 'create', draw: shotCreate, lyric: { x: 104, y: 930 } },
  { t0: beat(15), t1: 9.95, name: 'params', draw: shotParams, lyric: { x: 104, y: 930 } },
  { t0: 9.95, t1: 11.2, name: 'init', draw: shotInit, lyric: { x: 104, y: 930 } },
  { t0: 11.2, t1: beat(27), name: 'world', draw: shotWorld, lyric: { x: 104, y: 930 } },
  { t0: beat(27), t1: beat(29), name: 'monitor', draw: shotMonitor, lyric: { x: 104, y: 930 } },
  { t0: beat(29), t1: 14.98, name: 'simulation', draw: shotSim, lyric: { x: 104, y: 930 } },
  { t0: 14.98, t1: beat(45), name: 'title', draw: shotTitle, lyric: null },
];

export const getA = () => A;
export {
  drawCut, layer, toScreen, sticker, moon, stars, petals, softPetals, bgGrid, scanBars, vText,
  piece, camera, drawBoard, arrow, globe, floorGrid, drawWorld, crt, screenGlass, room, SCR,
  keyVisual, PIECES, pixelated, shotTitle,
};
