// Shared scenery for the full cut: pixel art, the desktop OS, the room, dialogs,
// keyword stamps. Everything snaps to the same palette as the demo shots.
import { W, H, C, clamp, lerp, inv, E, hash, hash2, rng, onTwos, pulse, canvas, sparkle, focusLines, windowFrame, roundRect, tinted } from './lib.js';
import { mono } from './type.js';
import { getA, arrow, moon, piece, crt, screenGlass, scanBars, vText, floorGrid } from './shots.js';

export const RED = C.red, TEAL = '#5fc2b4';
const PAL = [C.ink, C.night, C.navy, C.deep, C.cobalt, C.blue, C.violet, C.lilac, C.ice, C.hair, C.paper, C.mist, C.dim,
  C.red, '#a8324f', TEAL, '#2f7f78', '#6b3fb8', '#8f6ad8', '#7b7f9e', '#4a4d66', '#e8c9a8'];
const PAL_RGB = PAL.map(h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)));

// Draw vector shapes small, then snap alpha and colours to the palette: honest pixel art.
const crispCache = new Map();
export function crisp(key, w, h, draw) {
  if (crispCache.has(key)) return crispCache.get(key);
  const c = canvas(w, h), x = c.getContext('2d'); draw(x, w, h);
  const im = x.getImageData(0, 0, w, h), d = im.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 110) { d[i + 3] = 0; continue; }
    let best = 0, bd = 1e9;
    for (let k = 0; k < PAL_RGB.length; k++) { const p = PAL_RGB[k]; const e = (p[0] - d[i]) ** 2 + (p[1] - d[i + 1]) ** 2 + (p[2] - d[i + 2]) ** 2; if (e < bd) { bd = e; best = k; } }
    d[i] = PAL_RGB[best][0]; d[i + 1] = PAL_RGB[best][1]; d[i + 2] = PAL_RGB[best][2]; d[i + 3] = 255;
  }
  x.putImageData(im, 0, 0); crispCache.set(key, c); return c;
}
export function blit(ctx, img, x, y, s, o = {}) {
  ctx.save(); ctx.imageSmoothingEnabled = false; if (o.alpha !== undefined) ctx.globalAlpha = o.alpha;
  const w = img.width * s, h = img.height * (o.sy || s);
  ctx.drawImage(img, o.center ? x - w / 2 : x, o.center ? y - h / 2 : y, w, h); ctx.restore();
}

// Her, as a 44×66 desktop sprite.
// Her, as a 44×66 desktop sprite — in white while you are here, in black once you've gone.
export const sprite = (v = 'black') => v === 'white'
  ? crisp('spriteW', 44, 66, x => x.drawImage(getA().poses.white_full.img, 180, 30, 1260, 1890, 0, 0, 44, 66))
  : crisp('sprite', 44, 66, x => x.drawImage(getA().char, 80, 0, 880, 1536, 0, 0, 44, 66));

// ---------------------------------------------------------------------------
// Program icons (24×24 before pixel snapping)
const ICON = {
  EIN(x) { x.fillStyle = C.cobalt; x.beginPath(); x.arc(12, 12, 10, 0, 7); x.fill(); x.strokeStyle = C.ice; x.lineWidth = 1.6; x.beginPath(); x.ellipse(12, 12, 4.5, 10, 0, 0, 7); x.moveTo(2, 12); x.lineTo(22, 12); x.moveTo(4, 7); x.lineTo(20, 7); x.moveTo(4, 17); x.lineTo(20, 17); x.stroke(); x.strokeStyle = C.ink; x.lineWidth = 1.5; x.beginPath(); x.arc(12, 12, 10.5, 0, 7); x.stroke(); },
  DOS(x) { x.fillStyle = C.ink; x.fillRect(1, 1, 22, 22); x.fillStyle = C.violet; x.fillRect(3, 3, 18, 18); x.fillStyle = C.paper; x.fillRect(13, 5, 2.5, 11); x.fillRect(13, 5, 6, 2.5); x.beginPath(); x.ellipse(11, 16, 3.6, 2.8, -0.4, 0, 7); x.fill(); },
  TROIS(x) { x.fillStyle = C.ink; roundRect(x, 1, 6, 22, 13, 5); x.fill(); x.fillStyle = C.mist; roundRect(x, 2.5, 7.5, 19, 10, 4); x.fill(); x.fillStyle = C.ink; x.fillRect(5, 11, 6, 2); x.fillRect(7, 9, 2, 6); x.fillStyle = C.red; x.beginPath(); x.arc(16, 10.5, 1.6, 0, 7); x.fill(); x.fillStyle = C.cobalt; x.beginPath(); x.arc(18.5, 13.5, 1.6, 0, 7); x.fill(); },
  NE(x) { x.fillStyle = C.ink; x.fillRect(1, 5, 22, 15); x.fillStyle = C.paper; x.fillRect(2.5, 6.5, 19, 12); x.strokeStyle = C.cobalt; x.lineWidth = 1.8; x.beginPath(); x.moveTo(3, 7); x.lineTo(12, 14); x.lineTo(21, 7); x.stroke(); },
  FEM(x) { x.fillStyle = C.ink; roundRect(x, 1, 2, 22, 15, 5); x.fill(); x.beginPath(); x.moveTo(5, 16); x.lineTo(4, 22); x.lineTo(11, 16); x.fill(); x.fillStyle = C.ice; roundRect(x, 2.5, 3.5, 19, 12, 4); x.fill(); x.fillStyle = C.navy; for (const cx of [7, 12, 17]) { x.beginPath(); x.arc(cx, 9.5, 1.5, 0, 7); x.fill(); } },
  LIU(x) { x.fillStyle = C.ink; x.beginPath(); x.ellipse(12, 13, 11, 9, 0, 0, 7); x.fill(); x.fillStyle = C.paper; x.beginPath(); x.ellipse(12, 13, 9.5, 7.5, 0, 0, 7); x.fill(); const cs = [C.red, C.cobalt, TEAL, C.violet]; [[7, 10], [11, 8], [16, 9], [17, 14]].forEach(([a, b], i) => { x.fillStyle = cs[i]; x.beginPath(); x.arc(a, b, 1.8, 0, 7); x.fill(); }); x.fillStyle = C.ink; x.beginPath(); x.arc(10, 16, 2, 0, 7); x.fill(); },
  BIN(x) { x.fillStyle = C.ink; x.fillRect(4, 5, 16, 3); x.fillRect(5, 8, 14, 15); x.fillStyle = C.mist; x.fillRect(6.5, 9, 11, 12.5); x.fillStyle = C.ink; for (const a of [9, 12, 15]) x.fillRect(a, 10, 1.4, 10); x.fillRect(9, 3, 6, 2); },
};
export const PROGRAMS = [
  { key: 'EIN', name: 'EIN.exe', what: 'browser' }, { key: 'DOS', name: 'DOS.exe', what: 'music' },
  { key: 'TROIS', name: 'TROIS.exe', what: 'game' }, { key: 'NE', name: 'NE.exe', what: 'mail' },
  { key: 'FEM', name: 'FEM.exe', what: 'chat' }, { key: 'LIU', name: 'LIU.exe', what: 'paint' },
];
export const icon = key => key === 'ME' ? sprite() : key === 'MEW' ? sprite('white') : crisp('icon' + key, 24, 24, ICON[key]);

// Desktop icon with label; k = pop-in progress, dead = deleted (collapsed to pixels).
export function deskIcon(ctx, key, label, x, y, o = {}) {
  const k = o.k ?? 1; if (k <= 0) return;
  const img = icon(key), s = key.startsWith('ME') ? 2.0 : 3.6, w = img.width * s, h = img.height * s;
  ctx.save(); ctx.translate(x, y); const sc = E.outBack(clamp(k)); ctx.scale(sc, sc);
  if (o.sel) { ctx.fillStyle = 'rgba(77,94,224,0.45)'; ctx.fillRect(-58, -52, 116, 132); ctx.strokeStyle = C.ice; ctx.setLineDash([4, 4]); ctx.strokeRect(-58, -52, 116, 132); ctx.setLineDash([]); }
  blit(ctx, img, 0, -8 + (key.startsWith('ME') ? -6 : 0), s, { center: true });
  ctx.font = '26px VT323'; ctx.textAlign = 'center';
  const tw = ctx.measureText(label).width;
  ctx.fillStyle = o.sel ? C.cobalt : 'rgba(5,5,11,0.55)'; ctx.fillRect(-tw / 2 - 5, 44, tw + 10, 26);
  ctx.fillStyle = C.paper; ctx.fillText(label, 0, 64);
  ctx.restore();
  void w; void h;
}

// Pixel shatter: an image breaking into its own pixels, flying outward.
export function shatter(ctx, img, x, y, s, p, seed = 1, color) {
  const tmp = img.getContext ? img : null; if (!tmp) return;
  const d = tmp.getContext('2d').getImageData(0, 0, img.width, img.height).data;
  const R = rng(seed);
  for (let j = 0; j < img.height; j++) for (let i = 0; i < img.width; i++) {
    const o = (j * img.width + i) * 4; if (d[o + 3] < 10) continue;
    const a = R() * Math.PI * 2, v = 200 + R() * 700, g = 900;
    const px = x + (i - img.width / 2) * s + Math.cos(a) * v * p, py = y + (j - img.height / 2) * s + Math.sin(a) * v * p + g * p * p;
    ctx.globalAlpha = clamp(1 - p * 1.1);
    ctx.fillStyle = color || `rgb(${d[o]},${d[o + 1]},${d[o + 2]})`; ctx.fillRect(px, py, s, s);
  }
  ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------------------
// Desktop OS
export function wallpaper(ctx, t, o = {}) {
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, o.top || '#0c0f33'); g.addColorStop(1, o.bottom || C.ink);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(58,63,120,0.35)'; for (let y = 60; y < H; y += 40) for (let x = 20; x < W; x += 40) ctx.fillRect(x, y, 2, 2);
  if (o.moon !== false) moon(ctx, 1180, 420, 190, 0.5);
  floorGrid(ctx, t, 760, 1, 0.55);
}
export function menubar(ctx, t, o = {}) {
  ctx.fillStyle = o.red ? '#3a0f22' : C.navy; ctx.fillRect(0, 0, W, 40);
  ctx.fillStyle = o.red ? C.red : C.ice; ctx.fillRect(0, 40, W, 2);
  mono(ctx, '◉ world', 26, 29, 22, { color: C.paper, weight: 800 });
  mono(ctx, 'File  Edit  View  Special', 190, 29, 20, { color: C.mist, weight: 400 });
  const clock = o.clock || '23:41';
  mono(ctx, `${o.user === false ? '○ no user' : '● you'}   ${clock}`, W - 300, 29, 20, { color: o.user === false ? C.dim : C.paper, weight: 500 });
}
// A program window with a content callback.
export function appWindow(ctx, x, y, w, h, title, content, o = {}) {
  const k = o.k ?? 1; if (k <= 0) return;
  ctx.save();
  const cx = x + w / 2, cy = y + h / 2, sc = o.closing ? 1 - E.inCubic(clamp(o.closing)) : E.outBack(clamp(k));
  ctx.translate(cx, cy); ctx.scale(sc, o.closing ? Math.max(0.02, sc) : sc); ctx.translate(-cx, -cy);
  const b = windowFrame(ctx, x, y, w, h, title, { fg: o.fg || C.ice, bg: o.bg || '#0b0e2e', bar: 32 });
  ctx.save(); ctx.beginPath(); ctx.rect(b.x, b.y, b.w, b.h); ctx.clip(); content(ctx, b); ctx.restore();
  ctx.restore();
}
export function button(ctx, x, y, w, h, label, o = {}) {
  const d = o.pressed ? 4 : 0;
  ctx.fillStyle = C.ink; ctx.fillRect(x + 5, y + 5, w, h);
  ctx.fillStyle = o.hot ? (o.color || C.ice) : '#1d2366'; ctx.fillRect(x + d, y + d, w, h);
  ctx.strokeStyle = o.hot ? C.paper : C.ice; ctx.lineWidth = 2; ctx.strokeRect(x + d, y + d, w, h);
  const size = o.size || 26; ctx.font = `800 ${size}px "JetBrains Mono"`; ctx.textAlign = 'center';
  ctx.fillStyle = o.hot ? C.ink : C.ice; ctx.fillText(label, x + d + w / 2, y + d + h / 2 + size * 0.35);
}
export function progress(ctx, x, y, w, h, p, o = {}) {
  ctx.strokeStyle = o.color || C.ice; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h);
  const n = o.blocks || 24, bw = (w - 8) / n;
  ctx.fillStyle = o.color || C.ice; for (let i = 0; i < Math.floor(n * clamp(p)); i++) ctx.fillRect(x + 4 + i * bw, y + 4, bw - 3, h - 8);
}
export function errorBox(ctx, x, y, title, lines, o = {}) {
  const w = o.w || 560, h = o.h || 210;
  const b = windowFrame(ctx, x, y, w, h, title, { fg: o.fg || C.red, bg: '#1a0612', bar: 30, barFg: '#1a0612' });
  ctx.fillStyle = o.fg || C.red; ctx.beginPath(); ctx.arc(b.x + 50, b.y + 62, 28, 0, 7); ctx.fill();
  ctx.strokeStyle = C.paper; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(b.x + 38, b.y + 50); ctx.lineTo(b.x + 62, b.y + 74); ctx.moveTo(b.x + 62, b.y + 50); ctx.lineTo(b.x + 38, b.y + 74); ctx.stroke();
  lines.forEach((s, i) => mono(ctx, s, b.x + 100, b.y + 50 + i * 30, 20, { color: i ? C.mist : C.paper, weight: i ? 400 : 700 }));
  if (o.ok !== false) button(ctx, b.x + b.w - 130, b.y + b.h - 58, 100, 40, 'OK', { size: 20 });
}

// ---------------------------------------------------------------------------
// Keyword stamp: the big typographic hit for a CAPS lyric.
export function stamp(ctx, word, t, t0, o = {}) {
  if (t < t0) return;
  const size = o.size || 190, cell = size * 0.6, n = [...word].length;
  const x = o.x ?? W / 2 - n * cell / 2, y = o.y ?? 600;
  const dec = clamp((t - t0) / (o.decode || 0.2)), seed = Math.round(t * 24);
  const pop = 1 + 0.08 * pulse(t, [t0], 10);
  ctx.save(); ctx.translate(x + n * cell / 2, y); ctx.scale(pop, pop); ctx.translate(-(x + n * cell / 2), -y);
  if (o.shadow !== false) mono(ctx, word, x + 10, y + 10, size, { color: o.shadow || C.navy, weight: 800, scramble: (1 - dec) * 0.8, seed });
  mono(ctx, word, x, y, size, { color: o.color || C.paper, weight: 800, scramble: (1 - dec) * 0.8, seed });
  if (o.outline) { ctx.lineWidth = 2.5; ctx.strokeStyle = o.outline; ctx.font = `800 ${size}px "JetBrains Mono"`; ctx.textAlign = 'center'; [...word].forEach((ch, i) => ctx.strokeText(ch, x + (i + 0.5) * cell, y)); }
  ctx.restore();
}
export function zhTag(ctx, zh, t, t0, o = {}) {
  if (t < t0) return;
  const size = o.size || 96;
  vText(ctx, zh.replace(/[「」［］\s]/g, ''), o.x ?? 1760, o.y ?? 220, size, o.color || C.ink, o.box || C.paper);
}

// ---------------------------------------------------------------------------
// The room: desk, chair, window to the sky, the CRT with a content callback.
export function sky(ctx, x, y, w, h, day) {        // day: 0 night … 1 noon
  const top = `rgb(${Math.round(lerp(8, 120, day))},${Math.round(lerp(10, 150, day))},${Math.round(lerp(38, 235, day))})`;
  const bot = `rgb(${Math.round(lerp(24, 200, day))},${Math.round(lerp(28, 210, day))},${Math.round(lerp(80, 245, day))})`;
  const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, top); g.addColorStop(1, bot);
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
}
export function roomScene(ctx, t, o = {}) {
  const day = o.day ?? 0;
  ctx.fillStyle = `rgb(${Math.round(lerp(10, 40, day))},${Math.round(lerp(11, 44, day))},${Math.round(lerp(30, 96, day))})`; ctx.fillRect(0, 0, W, H);
  // window
  const wx = 150, wy = 120, ww = 420, wh = 420;
  sky(ctx, wx, wy, ww, wh, day);
  if (o.sun !== undefined) { ctx.fillStyle = day > 0.4 ? '#fff6e0' : C.paper; ctx.beginPath(); ctx.arc(wx + ww * o.sun, wy + wh * (0.75 - 0.5 * Math.sin(Math.PI * o.sun)), 34, 0, 7); ctx.fill(); }
  else { moon(ctx, wx + 290, wy + 120, 50, 0.9); }
  ctx.fillStyle = '#23264d'; ctx.fillRect(wx - 16, wy - 16, ww + 32, 16); ctx.fillRect(wx - 16, wy + wh, ww + 32, 20); ctx.fillRect(wx - 16, wy, 16, wh); ctx.fillRect(wx + ww, wy, 16, wh); ctx.fillRect(wx + ww / 2 - 6, wy, 12, wh); ctx.fillRect(wx, wy + wh / 2 - 6, ww, 12);
  if (o.windowOpen) { ctx.fillStyle = 'rgba(169,198,255,0.12)'; ctx.fillRect(wx, wy, ww, wh); }
  // desk
  ctx.fillStyle = '#171a45'; ctx.fillRect(0, 760, W, H - 760); ctx.fillStyle = '#2b2f6b'; ctx.fillRect(0, 752, W, 12);
  const glow = ctx.createRadialGradient(1100, 640, 40, 1100, 760, 760); glow.addColorStop(0, `rgba(120,150,255,${o.glow ?? 0.32})`); glow.addColorStop(1, 'rgba(120,150,255,0)');
  ctx.fillStyle = glow; ctx.fillRect(0, 200, W, H - 200);
  // chair (empty), swivelling as if someone just stood up
  const sw = o.chairSpin ?? 0;
  ctx.save(); ctx.translate(1100, 860); ctx.scale(Math.cos(sw) * 0.6 + 0.4 * Math.sign(Math.cos(sw) || 1), 1);
  ctx.fillStyle = C.ink; roundRect(ctx, -170, -260, 340, 300, 40); ctx.fill(); ctx.fillStyle = '#262a5c'; roundRect(ctx, -150, -240, 300, 260, 30); ctx.fill();
  ctx.restore();
  // mug
  if (o.mug !== false) {
    const mx = 1560, my = 800; ctx.fillStyle = C.ink; roundRect(ctx, mx - 6, my - 96, 92, 106, 12); ctx.fill(); ctx.fillStyle = C.mist; roundRect(ctx, mx, my - 90, 80, 94, 10); ctx.fill();
    ctx.strokeStyle = C.ink; ctx.lineWidth = 12; ctx.beginPath(); ctx.arc(mx + 88, my - 45, 22, -1.2, 1.2); ctx.stroke(); ctx.strokeStyle = C.mist; ctx.lineWidth = 6; ctx.stroke();
    const steam = o.steam ?? 1;
    if (steam > 0) { ctx.strokeStyle = `rgba(236,235,243,${0.35 * steam})`; ctx.lineWidth = 4; for (let k = 0; k < 3; k++) { ctx.beginPath(); for (let i = 0; i < 20; i++) { const yy = my - 110 - i * 7, xx = mx + 20 + k * 20 + Math.sin(onTwos(t) * 4 + i * 0.5 + k) * 6; i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); } ctx.stroke(); } }
  }
  // monitor
  const S = o.scr || { x: 760, y: 250, w: 560, h: 315 };
  crt(ctx, S.x, S.y, S.w, S.h);
  if (o.screen) { ctx.save(); ctx.beginPath(); ctx.rect(S.x, S.y, S.w, S.h); ctx.clip(); o.screen(ctx, S); ctx.restore(); screenGlass(ctx, S.x, S.y, S.w, S.h); }
  return S;
}

// Cursor path helper: keyframes [[t, x, y], …] with ease-in-out between them.
export function path(keys, t) {
  if (t <= keys[0][0]) return keys[0].slice(1);
  for (let i = 1; i < keys.length; i++) if (t < keys[i][0]) {
    const [t0, x0, y0] = keys[i - 1], [t1, x1, y1] = keys[i], k = E.inOutCubic((t - t0) / (t1 - t0));
    return [lerp(x0, x1, k), lerp(y0, y1, k)];
  }
  return keys[keys.length - 1].slice(1);
}
export function click(ctx, x, y, t, t0, color = C.paper) {
  if (t < t0 || t > t0 + 0.35) return;
  const p = (t - t0) / 0.35; ctx.save(); ctx.globalAlpha = 1 - p; ctx.strokeStyle = color; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(x, y, 12 + 60 * p, 0, 7); ctx.stroke(); ctx.restore();
}
export { arrow, piece, focusLines, sparkle, scanBars, tinted, mono };
