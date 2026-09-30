// Monospace "source code" typography: every glyph sits on a fixed cell grid,
// CJK glyphs take two cells, so English and Chinese lines align like an editor.
import { C, clamp, inv, E, hash, hash2, BEAT, B0 } from './lib.js';

const WIDE = /[⺀-鿿　-〿＀-￯「」]/;
export const isWide = ch => WIDE.test(ch);
export const cols = s => [...s].reduce((n, ch) => n + (isWide(ch) ? 2 : 1), 0);
const GLITCH = '!<>-_\\/[]{}=+*^?#%&01ABCDEFXZ';

// Draw `str` on the grid. o.count limits visible glyphs, o.scramble decodes
// glyphs from noise, o.bg paints a highlight block behind the text.
export function mono(ctx, str, x, y, size, o = {}) {
  const cell = size * (o.cell || 0.6), chars = [...str];
  const count = o.count === undefined ? chars.length : o.count;
  const weight = o.weight || 500;
  if (o.bg && count > 0) {
    let c = 0; for (let i = 0; i < Math.min(count, chars.length); i++) c += isWide(chars[i]) ? 2 : 1;
    ctx.fillStyle = o.bg;
    ctx.fillRect(x - cell * 0.35, y - size * 0.86, c * cell + cell * 0.7, size * 1.16);
  }
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  let col = 0;
  for (let i = 0; i < chars.length && i < count; i++) {
    let ch = chars[i]; const wide = isWide(ch), w = wide ? 2 : 1;
    if (o.scramble && ch !== ' ' && hash2(i, o.seed || 0) < o.scramble) ch = GLITCH[Math.floor(hash2(i * 7 + 3, o.seed || 0) * GLITCH.length)];
    ctx.fillStyle = (o.colorAt && o.colorAt(i)) || o.color || C.paper;
    ctx.font = wide ? `${Math.min(weight, 700)} ${size * 0.96}px "Noto Sans SC"` : `${weight} ${size}px "JetBrains Mono", "Noto Sans SC"`;
    ctx.fillText(ch, x + (col + w / 2) * cell, y);
    col += w;
  }
  return { cols: col, x1: x + col * cell, cell };
}

export function cursor(ctx, x, y, size, t, color, solid) {
  const on = solid || Math.floor((t - B0) / BEAT * 2) % 2 === 0;   // blinks on the eighth notes
  if (!on) return;
  ctx.fillStyle = color || C.ice;
  ctx.fillRect(x + size * 0.06, y - size * 0.82, size * 0.5, size * 1.02);
}

import { LYRICS } from './lyrics.js';
export { LYRICS };
export const lyricAt = t => { let cur = null; for (const L of LYRICS) if (t >= L.t0) cur = L; return cur && t < cur.t1 + 1.6 ? cur : null; };

const THEMES = {
  dark: { num: '#40467f', bar: '#2b3068', en: C.paper, kw: C.paper, kwBg: C.violet, zh: '#c3c8f4', cur: C.ice },
  light: { num: '#9ea3cf', bar: '#b9bce0', en: C.navy, kw: C.paper, kwBg: C.cobalt, zh: '#3a4096', cur: C.cobalt },
};

// One lyric as two editor rows:  07 │ English line▌
//                                    │ // 中文注释
export function lyricBlock(ctx, L, t, o = {}) {
  const size = o.size || 34, th = THEMES[o.theme || 'dark'], cell = size * 0.6;
  const x = o.x ?? 104, y = o.y ?? 930, rowH = size * 1.42;
  const gx = x + cell * 4.2;
  const lt = t - L.t0, dur = L.t1 - L.t0;
  const enChars = [...L.en].length;
  const enDur = L.kw ? 0.14 : Math.min(dur * 0.62, enChars * 0.05);
  const pEn = clamp(lt / enDur);
  const zhStart = L.kw ? 0.12 : enDur * 0.55, zhDur = Math.min(dur * 0.4, [...L.zh].length * 0.06 + 0.1);
  const pZh = inv(zhStart, zhStart + zhDur, lt);
  const a = (o.alpha ?? 1) * (L.t0 <= t ? 1 : 0);
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a;
  // gutter
  mono(ctx, String(L.n).padStart(2, '0'), x, y, size * 0.8, { color: th.num, weight: 400 });
  ctx.fillStyle = th.bar; ctx.fillRect(gx - cell * 0.9, y - size * 1.0, 2, rowH + size * 1.3);
  // English (keywords decode out of noise and sit on a highlight block)
  const frame = Math.round(t * 24);
  let r;
  if (L.kw) {
    r = mono(ctx, L.en, gx, y, size, { color: th.kw, weight: 800, bg: th.kwBg, count: Math.ceil(pEn * enChars), scramble: clamp(1 - lt / 0.22) * 0.9, seed: frame });
  } else {
    r = mono(ctx, L.en, gx, y, size, { color: th.en, weight: 500, count: Math.floor(pEn * enChars) });
  }
  // Chinese as a code comment
  const zhText = '// ' + L.zh, zhN = [...zhText].length;
  const r2 = mono(ctx, zhText, gx, y + rowH, size * 0.84, { color: th.zh, weight: 400, count: Math.floor(pZh * zhN) });
  const typingEn = pEn < 1, typingZh = pZh > 0 && pZh < 1;
  if (o.noCursor) { /* history rows carry no caret */ }
  else if (pZh > 0) cursor(ctx, r2.x1, y + rowH, size * 0.84, t, th.cur, typingZh);
  else cursor(ctx, r.x1 + (L.kw ? cell * 0.4 : 0), y, size, t, th.cur, typingEn);
  ctx.restore();
}

// Editor view with the previous lines scrolling upward, dimmed.
export function lyricEditor(ctx, t, o = {}) {
  const L = lyricAt(t); if (!L) return;
  const size = o.size || 34, rowH = size * 1.42, step = rowH * 2 + size * 0.5;
  const idx = L.n - 1, scroll = (1 - E.outCubic(inv(L.t0, L.t0 + 0.16, t))) * step;
  const hist = o.history ?? 1;
  const LY = LYRICS;
  for (let k = hist; k >= 1; k--) {
    const P = LY[idx - k]; if (!P || P.t1 < L.t0 - 3) continue;   // no stale lines across instrumentals
    lyricBlock(ctx, P, P.t1 + 5, { ...o, y: (o.y ?? 930) - step * k + scroll, alpha: (o.alpha ?? 1) * (k === 1 ? 0.45 : 0.18), noCursor: true });
  }
  lyricBlock(ctx, L, t, { ...o, y: (o.y ?? 930) + scroll });
}
