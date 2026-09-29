// Frame-accurate renderer: serves web/, drives MV.render(t) in headless Chromium,
// grabs each frame and muxes the result with the song via ffmpeg.
//
//   node render.mjs --audio <song.mp4|wav> --out out/demo.mp4      full demo
//   node render.mjs --stills 0.5,3.2,15.6                          single frames -> out/stills
//   node render.mjs --serve                                         open http://localhost:8123/web/?play
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, all) => {
  if (v.startsWith('--')) a.push([v.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : true]);
  return a;
}, []));
const FPS = 24, W = 1920, H = 1080;
const from = parseFloat(args.from ?? 0), to = parseFloat(args.to ?? 20);
const workers = parseInt(args.workers ?? 3, 10);
const outDir = path.join(ROOT, 'out');
const ffmpeg = args.ffmpeg || 'ffmpeg';

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.woff': 'font/woff' };
function serve(port) {
  const srv = http.createServer((req, res) => {
    const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) {
      const idx = path.join(p, 'index.html');
      if (fs.existsSync(idx)) { res.writeHead(200, { 'content-type': 'text/html' }); return fs.createReadStream(idx).pipe(res); }
      res.writeHead(404); return res.end();
    }
    res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' });
    fs.createReadStream(p).pipe(res);
  });
  return new Promise(ok => srv.listen(port, () => ok(srv)));
}

async function openPage(browser, port) {
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  page.on('console', m => { if (m.type() === 'error') console.error('[page]', m.text()); });
  page.on('pageerror', e => console.error('[pageerror]', e.message));
  await page.goto(`http://localhost:${port}/web/index.html`);
  await page.waitForFunction(() => window.MV && (window.MV.ready || window.MV.error), null, { timeout: 120000 });
  const err = await page.evaluate(() => window.MV.error);
  if (err) throw new Error(err);
  return page;
}

async function grab(page, t, file) {
  await page.evaluate(t => window.MV.render(t), t);
  const jpg = file.endsWith('.jpg');
  await page.screenshot({ path: file, clip: { x: 0, y: 0, width: W, height: H }, type: jpg ? 'jpeg' : 'png', ...(jpg ? { quality: 96 } : {}), timeout: 120000 });
}

const port = parseInt(args.port ?? 8123, 10);
const srv = await serve(port);
if (args.serve) { console.log(`preview: http://localhost:${port}/web/index.html?play`); }
else {
  // CPU raster for canvas 2D is faster here than GPU emulation; WebGL still runs on SwiftShader.
  const browser = await chromium.launch({ args: ['--disable-gpu', '--enable-unsafe-swiftshader'] });
  try {
    if (args.stills) {
      const dir = path.join(outDir, 'stills'); fs.mkdirSync(dir, { recursive: true });
      const page = await openPage(browser, port);
      for (const s of String(args.stills).split(',')) {
        const t = parseFloat(s), f = path.join(dir, `t_${t.toFixed(2).padStart(5, '0')}.png`);
        await grab(page, t, f); console.log(f);
      }
    } else {
      const dir = path.join(outDir, 'frames'); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
      const f0 = Math.round(from * FPS), f1 = Math.round(to * FPS);
      const pages = await Promise.all(Array.from({ length: workers }, () => openPage(browser, port)));
      let next = f0, done = 0; const t0 = Date.now();
      await Promise.all(pages.map(async page => {
        while (next < f1) {
          const f = next++;
          await grab(page, f / FPS, path.join(dir, `${String(f - f0).padStart(5, '0')}.jpg`));
          if (++done % 24 === 0) console.log(`${done}/${f1 - f0} frames  ${((Date.now() - t0) / done).toFixed(0)} ms/frame`);
        }
      }));
      const out = path.resolve(args.out || path.join(outDir, 'demo.mp4'));
      const enc = ['-y', '-framerate', String(FPS), '-i', path.join(dir, '%05d.jpg')];
      if (args.audio) {
        const wav = path.join(outDir, 'audio.wav');
        const fadeAt = Math.max(0, to - from - 0.45);
        spawnSync(ffmpeg, ['-y', '-loglevel', 'error', '-i', args.audio, '-vn', '-ss', String(from), '-t', String(to - from), '-af', `afade=t=out:st=${fadeAt}:d=0.45`, '-ar', '48000', wav], { stdio: 'inherit' });
        enc.push('-i', wav, '-map', '0:v', '-map', '1:a', '-c:a', 'aac', '-b:a', '256k');
      }
      enc.push('-c:v', 'libx264', '-preset', 'slow', '-crf', String(args.crf ?? 18), '-tune', 'animation', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-shortest', out);
      const r = spawnSync(ffmpeg, enc, { stdio: 'inherit' });
      if (r.status !== 0) throw new Error('ffmpeg failed');
      console.log('wrote', out);
    }
  } finally { await browser.close(); srv.close(); }
}
