// Entry point: loads assets and fonts, then exposes MV.render(t) for the frame grabber.
import { W, H, C, FPS, BEAT, B0, canvas, clamp } from './lib.js';
import { lyricEditor, LYRICS, lyricAt, mono } from './type.js';
import { SHOTS, setAssets } from './shots.js';
import { Post } from './post.js';

const img = src => new Promise((ok, err) => { const i = new Image(); i.onload = () => ok(i); i.onerror = err; i.src = src; });

async function load() {
  const meta = await (await fetch('assets/meta.json')).json();
  const [char, full, sil, lines, upper, inset, ...flats] = await Promise.all([
    'char_2k.png', 'full_2k.jpg', 'sil_2k.png', 'lines_2k.png', 'upper_x4.png', 'inset_x4.jpg',
    ...meta.groups.map(g => g.file),
  ].map(f => img('assets/' + f)));
  // Pull in every glyph subset the frames will use before the first frame is drawn.
  const zh = LYRICS.map(l => l.zh).join('') + '装备黑纱手套颈环捧花绝缘护体让我们开始模拟游戏×「」';
  await Promise.all([
    '400 40px "JetBrains Mono"', '500 40px "JetBrains Mono"', '700 40px "JetBrains Mono"', '800 40px "JetBrains Mono"',
    '400 40px VT323',
  ].map(f => document.fonts.load(f, 'ABCabc012✓▸●')));
  await Promise.all(['400 40px "Noto Sans SC"', '500 40px "Noto Sans SC"', '700 40px "Noto Sans SC"', '900 40px "Noto Serif SC"'].map(f => document.fonts.load(f, zh)));
  await document.fonts.ready;
  return { meta, char, full, sil, lines, upper, inset, flats };
}

function hud(ctx, t, shot) {
  const light = shot.theme === 'light';
  const col = light ? C.navy : C.ice;
  ctx.save(); ctx.globalAlpha = 0.62;
  ctx.strokeStyle = col; ctx.lineWidth = 2;
  const m = 44, L = 34;
  for (const [x, y, dx, dy] of [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m - 34, 1, -1], [W - m, H - m - 34, -1, -1]]) {
    ctx.beginPath(); ctx.moveTo(x + dx * L, y); ctx.lineTo(x, y); ctx.lineTo(x, y + dy * L); ctx.stroke();
  }
  ctx.font = '26px VT323'; ctx.fillStyle = col; ctx.textAlign = 'left';
  ctx.fillText('world.execute(me);   PID 0001', m + 14, m + 30);
  const f = Math.round(t * FPS), sec = Math.floor(f / FPS), fr = f % FPS;
  ctx.textAlign = 'right';
  ctx.fillText(`TC 00:00:${String(sec).padStart(2, '0')}:${String(fr).padStart(2, '0')}   130 BPM`, W - m - 120, m + 30);
  const b = Math.floor((t - B0) / BEAT);
  for (let i = 0; i < 4; i++) { ctx.fillStyle = (t >= B0 && ((b % 4) + 4) % 4 === i) ? (light ? C.cobalt : C.paper) : col; ctx.globalAlpha = (t >= B0 && ((b % 4) + 4) % 4 === i) ? 0.95 : 0.3; ctx.fillRect(W - m - 108 + i * 24, m + 12, 16, 16); }
  ctx.restore();
  // editor status bar
  const L2 = lyricAt(t), ln = L2 ? L2.n : 0;
  ctx.save();
  ctx.fillStyle = light ? 'rgba(18,22,64,0.92)' : 'rgba(9,11,32,0.88)'; ctx.fillRect(0, H - 36, W, 36);
  ctx.fillStyle = C.ice; ctx.fillRect(0, H - 36, 118, 36);
  mono(ctx, 'EXEC', 22, H - 11, 22, { color: C.ink, weight: 800 });
  mono(ctx, `world.execute(me).js   ▸ ${shot.name}`, 140, H - 11, 20, { color: C.mist, weight: 400 });
  const col2 = L2 ? [...L2.en].length + 1 : 1;
  const right = `Ln ${String(ln).padStart(2, '0')}, Col ${String(col2).padStart(2, '0')}    UTF-8    LF    130 BPM`;
  mono(ctx, right, W - 24 - right.length * 12, H - 11, 20, { color: C.mist, weight: 400 });
  ctx.restore();
}

const scene = canvas(W, H), ctx = scene.getContext('2d');
const bloom = canvas(480, 270), bctx = bloom.getContext('2d');
// Soft dark panel behind the lyric editor so the code stays legible on busy frames.
const scrim = canvas(1100, 330);
{
  const x = scrim.getContext('2d');
  const g = x.createLinearGradient(0, 0, 1100, 0);
  g.addColorStop(0, 'rgba(4,4,14,0.66)'); g.addColorStop(0.55, 'rgba(4,4,14,0.4)'); g.addColorStop(1, 'rgba(4,4,14,0)');
  x.fillStyle = g; x.fillRect(0, 0, 1100, 330);
  x.globalCompositeOperation = 'destination-in';
  const v = x.createLinearGradient(0, 0, 0, 330);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(0.3, 'rgba(0,0,0,1)'); v.addColorStop(0.85, 'rgba(0,0,0,1)'); v.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = v; x.fillRect(0, 0, 1100, 330);
}
let post, ready = false;

function render(t) {
  const fx = { aberr: 1.2, curve: 0.3, scan: 0.07, grain: 0.045, vig: 0.6, glitch: 0, invert: 0, flash: 0, bloom: 0.6, pixel: 0, mask: 0, lift: 0, tint: [1, 1, 1] };
  const shot = SHOTS.find(s => t >= s.t0 && t < s.t1) || SHOTS[SHOTS.length - 1];
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
  ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H);
  shot.draw(ctx, t - shot.t0, t, fx);
  ctx.restore();
  if (shot.lyric && !fx.noLyric) {
    ctx.save();
    if (shot.lyric.theme !== 'light') ctx.drawImage(scrim, 0, (shot.lyric.y ?? 930) - 200);
    lyricEditor(ctx, t, shot.lyric); ctx.restore();
  }
  if (!fx.noHud) hud(ctx, t, shot);
  bctx.clearRect(0, 0, 480, 270);
  bctx.filter = 'brightness(0.62) contrast(3) blur(5px)'; bctx.drawImage(scene, 0, 0, 480, 270);
  bctx.globalCompositeOperation = 'lighter'; bctx.filter = 'brightness(0.6) contrast(2.6) blur(16px)'; bctx.drawImage(scene, 0, 0, 480, 270);
  bctx.globalCompositeOperation = 'source-over'; bctx.filter = 'none';
  post.render(scene, bloom, fx, Math.round(t * FPS) + 1);
}

window.MV = {
  duration: 20, fps: FPS,
  get ready() { return ready; },
  render,
  debugScene: () => scene.toDataURL('image/png'),   // pre-post-processing frame, for debugging
};

load().then(A => {
  setAssets(A);
  post = new Post(document.getElementById('out'));
  ready = true;
  const q = new URLSearchParams(location.search);
  if (q.has('t')) render(parseFloat(q.get('t')));
  else if (q.has('play')) {                       // live preview in a browser
    const t0 = performance.now();
    const loop = () => { render(((performance.now() - t0) / 1000) % 20); requestAnimationFrame(loop); };
    loop();
  }
}).catch(e => { window.MV.error = String(e && e.stack || e); console.error(e); });
