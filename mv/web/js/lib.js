// Shared constants, easing, deterministic randomness and drawing helpers.
export const W = 1920, H = 1080, FPS = 24;

// Beat grid measured from the track: 130 BPM, first beat at 0.21 s.
export const BPM = 130, BEAT = 60 / BPM, B0 = 0.21;
export const beat = k => B0 + k * BEAT;

export const C = {
  ink: '#05050b', night: '#0a0c22', navy: '#121640', deep: '#1b1f5c',
  cobalt: '#4d5ee0', blue: '#5c69ca', violet: '#7a55f0', lilac: '#a58cff',
  ice: '#a9c6ff', hair: '#8aa3dd', paper: '#ecebf3', mist: '#bfc1cc',
  dim: '#3a3f78', comment: '#8088cc', red: '#ff5470',
};

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const inv = (a, b, x) => clamp((x - a) / (b - a));
export const E = {
  lin: t => t,
  inQuad: t => t * t,
  outQuad: t => 1 - (1 - t) * (1 - t),
  inCubic: t => t * t * t,
  outCubic: t => 1 - Math.pow(1 - t, 3),
  inOutCubic: t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outQuart: t => 1 - Math.pow(1 - t, 4),
  outExpo: t => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  inExpo: t => (t <= 0 ? 0 : Math.pow(2, 10 * t - 10)),
  inOutExpo: t => t <= 0 ? 0 : t >= 1 ? 1 : t < .5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2,
  outBack: t => { const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
};

// Deterministic hash noise — every frame must render identically on re-render.
export function hash(n) {
  let x = Math.imul((n | 0) ^ 0x9e3779b9, 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
}
export const hash2 = (a, b) => hash(Math.imul(a | 0, 73856093) ^ Math.imul(b | 0, 19349663));
export function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// Limited animation: hold poses "on twos" (12 fps) like hand-drawn anime.
export const onTwos = t => Math.floor(t * 12 + 1e-6) / 12;
export const onThrees = t => Math.floor(t * 8 + 1e-6) / 8;

// Exponential flash after the most recent trigger time.
export function pulse(t, times, decay = 8) {
  let v = 0;
  for (const b of times) if (t >= b) v = Math.max(v, Math.exp(-(t - b) * decay));
  return v;
}

export function canvas(w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; return c;
}

// Silhouette tinting cache: fill an alpha mask with a flat colour.
const tintCache = new Map();
export function tinted(img, color, key) {
  const k = (key || img.src) + color;
  if (tintCache.has(k)) return tintCache.get(k);
  const c = canvas(img.width, img.height), x = c.getContext('2d');
  x.drawImage(img, 0, 0); x.globalCompositeOperation = 'source-in';
  x.fillStyle = color; x.fillRect(0, 0, c.width, c.height);
  tintCache.set(k, c); return c;
}

// Four-point sparkle, the motif stitched on her dress and shoes.
export function sparkle(ctx, x, y, r, rot = 0, thin = 0.18) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2;
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    ctx.lineTo(Math.cos(a + Math.PI / 4) * r * thin, Math.sin(a + Math.PI / 4) * r * thin);
  }
  ctx.closePath(); ctx.fill(); ctx.restore();
}

// Manga focus lines (集中線) around the frame edge.
export function focusLines(ctx, cx, cy, n, inner, color, seed, alpha = 1) {
  const r = rng(seed); ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = color;
  const outer = 2400;
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2, w = 0.002 + r() * 0.012, ri = inner * (0.85 + r() * 0.5);
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * ri, cy + Math.sin(a) * ri);
    ctx.lineTo(cx + Math.cos(a - w) * outer, cy + Math.sin(a - w) * outer);
    ctx.lineTo(cx + Math.cos(a + w) * outer, cy + Math.sin(a + w) * outer);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

// Halftone dot field whose dot size follows a linear ramp — cel-shade texture.
export function halftone(ctx, x0, y0, w, h, step, color, fn) {
  ctx.save(); ctx.fillStyle = color;
  for (let y = y0; y < y0 + h; y += step) {
    const odd = Math.round((y - y0) / step) & 1;
    for (let x = x0 + (odd ? step / 2 : 0); x < x0 + w; x += step) {
      const r = fn(x, y) * step * 0.62;
      if (r > 0.4) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
    }
  }
  ctx.restore();
}

// Hazard stripes across a rect, scrolling with `off`.
export function stripes(ctx, x, y, w, h, band, colA, colB, off = 0, angle = -0.6) {
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.fillStyle = colA; ctx.fillRect(x, y, w, h);
  ctx.translate(x + w / 2, y + h / 2); ctx.rotate(angle); ctx.fillStyle = colB;
  const L = Math.hypot(w, h);
  for (let i = -L; i < L; i += band * 2) ctx.fillRect(i + (off % (band * 2)), -L, band, L * 2);
  ctx.restore();
}

// Retro OS window (System-7 stripes meets Win95 bevel), recoloured to the MV palette.
export function windowFrame(ctx, x, y, w, h, title, o = {}) {
  const bar = o.bar || 34, fg = o.fg || C.ice, bg = o.bg || 'rgba(10,12,34,0.92)';
  ctx.save();
  if (o.shadow !== false) { ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(x + 10, y + 10, w, h); }
  ctx.fillStyle = bg; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = fg; ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  ctx.fillStyle = o.barBg || fg; ctx.fillRect(x, y, w, bar);
  ctx.fillStyle = o.barFg || C.navy;
  for (let i = 7; i < bar - 5; i += 5) ctx.fillRect(x + 44, y + i, w - 88, 2);
  ctx.fillStyle = o.barBg || fg; ctx.font = `700 ${Math.round(bar * 0.56)}px "JetBrains Mono", "Noto Sans SC"`;
  const tw = ctx.measureText(title).width;
  ctx.fillRect(x + w / 2 - tw / 2 - 14, y + 3, tw + 28, bar - 6);
  ctx.fillStyle = o.barFg || C.navy; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(title, x + w / 2, y + bar / 2 + 1);
  ctx.strokeStyle = o.barFg || C.navy; ctx.lineWidth = 2;
  ctx.strokeRect(x + 12, y + 8, bar - 16, bar - 16);
  ctx.strokeRect(x + w - bar + 4, y + 8, bar - 16, bar - 16);
  ctx.restore();
  return { x: x + 2, y: y + bar, w: w - 4, h: h - bar - 2 };
}

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
