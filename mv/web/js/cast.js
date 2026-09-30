// The cast of poses cut from the character sheet and the white-dress illustrations.
//   pose(ctx, name, x, y, h)  — figure standing with its feet (bbox bottom) at (x, y), h px tall
//   face(ctx, name, x, y, w, h) — an expression panel, cover-cropped into a framed box
// White dress = the days "you" were here (0:21 → 1:50); black = the prologue and after you leave.
import { C, clamp, tinted } from './lib.js';

let P = null;
export const setPoses = p => { P = p; };
// Body centre (x) in source pixels where it differs from the bbox centre (flowing trains).
const AX = { white_full: 900, pose_sit: 560, pose_back: 600, pose_hug: 820 };

export function poseImg(name) { return P[name].img; }
export function pose(ctx, name, x, y, h, o = {}) {
  const { img, meta } = P[name], [x0, y0, x1, y1] = meta.bbox, s = h / (y1 - y0);
  const ax = AX[name] ?? (x0 + x1) / 2;
  const dx = x - ax * s, dy = y - y1 * s, w = meta.w * s, hh = meta.h * s;
  ctx.save();
  if (o.alpha !== undefined) ctx.globalAlpha = o.alpha;
  if (o.flip) { ctx.translate(x, 0); ctx.scale(-1, 1); ctx.translate(-x, 0); }
  if (o.rim) {                                   // paper-cut outline, like a sticker
    const t = tinted(img, o.rim, 'pose' + name);
    for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; ctx.drawImage(t, dx + Math.cos(a) * (o.rimW || 6), dy + Math.sin(a) * (o.rimW || 6), w, hh); }
  }
  if (o.glow) { ctx.save(); ctx.globalAlpha *= 0.7; ctx.drawImage(tinted(img, o.glow, 'pose' + name), dx - 5, dy - 4, w, hh); ctx.restore(); }
  ctx.drawImage(o.tint ? tinted(img, o.tint, 'pose' + name) : img, dx, dy, w, hh);
  if (o.reflect) {
    ctx.save(); ctx.globalAlpha *= o.reflect; ctx.translate(0, 2 * y); ctx.scale(1, -1);
    ctx.beginPath(); ctx.rect(-400, y - h * 0.22, 3000, h * 0.22); ctx.clip(); ctx.drawImage(img, dx, dy, w, hh); ctx.restore();
  }
  ctx.restore();
  return { x: dx, y: dy, w, h: hh, s };
}
// Expression panel: cover-fit, optional frame and caption (the sheet's labels).
export function face(ctx, name, x, y, w, h, o = {}) {
  const { img } = P['face_' + name];
  const s = Math.max(w / img.width, h / img.height), sw = w / s, sh = h / s;
  const sx = (img.width - sw) / 2, sy = (img.height - sh) * (o.fy ?? 0.35);
  ctx.save(); if (o.alpha !== undefined) ctx.globalAlpha = o.alpha;
  if (o.frame !== false) { ctx.fillStyle = C.ink; ctx.fillRect(x - 8 + 8, y - 8 + 8, w + 16, h + 16); ctx.fillStyle = o.frame || C.ice; ctx.fillRect(x - 5, y - 5, w + 10, h + 10); }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  if (o.tint) { ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = o.tint; ctx.fillRect(x, y, w, h); }
  ctx.restore();
}
// Round avatar for notifications / dialogs.
export function avatar(ctx, name, cx, cy, r, o = {}) {
  const { img } = P['face_' + name], cw = img.width, cr = cw * 0.36;
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.clip();
  ctx.drawImage(img, cw / 2 - cr, img.height * 0.42 - cr, cr * 2, cr * 2, cx - r, cy - r, 2 * r, 2 * r); ctx.restore();
  ctx.strokeStyle = o.ring || C.ice; ctx.lineWidth = o.lw || 3; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.stroke();
}
export const era = t => (t >= 21 && t < 111.5 ? 'white' : 'black');
export { clamp };
