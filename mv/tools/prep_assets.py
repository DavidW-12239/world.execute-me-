"""Derive every layer the MV renderer needs from the single character illustration.

Pipeline: BiRefNet cutout -> Real-ESRGAN (anime 6B) x4 upscale -> derived layers
(silhouette, line art, flat cel colour groups, close-up crops, point cloud).

Usage:  python3 tools/prep_assets.py tools/character_src.webp web/assets
Needs:  rembg onnxruntime opencv-python-headless pillow numpy scipy
        and .cache/anime6b.onnx (see tools/esrgan_to_onnx.py).
"""
import json, os, sys
import numpy as np, cv2
from PIL import Image

SRC, OUT = sys.argv[1], sys.argv[2]
HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, '..', '.cache'); os.makedirs(CACHE, exist_ok=True)
os.makedirs(OUT, exist_ok=True)
src = Image.open(SRC).convert('RGB'); W, H = src.size          # 1024 x 1536

# --- 1. cutout mask ---------------------------------------------------------
mpath = os.path.join(CACHE, 'mask.png')
if not os.path.exists(mpath):
    from rembg import remove, new_session
    m = np.array(remove(src, session=new_session('birefnet-general'), only_mask=True).convert('L'))
    n, lab, st, _ = cv2.connectedComponentsWithStats((m > 128).astype(np.uint8))
    keep = lab == 1 + np.argmax(st[1:, 4])
    keep = cv2.dilate(keep.astype(np.uint8), np.ones((5, 5))) > 0
    Image.fromarray(np.where(keep, m, 0).astype(np.uint8)).save(mpath)
mask = np.array(Image.open(mpath))

# --- 2. x4 upscale ----------------------------------------------------------
upath = os.path.join(CACHE, 'x4.png')
if not os.path.exists(upath):
    import onnxruntime as ort
    sess = ort.InferenceSession(os.path.join(CACHE, 'anime6b.onnx'), providers=['CPUExecutionProvider'])
    im = np.asarray(src).astype(np.float32) / 255
    T, P = 192, 12; out = np.zeros((H * 4, W * 4, 3), np.float32)
    for y in range(0, H, T):
        for x in range(0, W, T):
            y0, x0, y1, x1 = max(0, y - P), max(0, x - P), min(H, y + T + P), min(W, x + T + P)
            r = sess.run(None, {'input': im[y0:y1, x0:x1].transpose(2, 0, 1)[None]})[0][0].transpose(1, 2, 0)
            h, w = min(T, H - y) * 4, min(T, W - x) * 4
            out[y*4:y*4+h, x*4:x*4+w] = r[(y-y0)*4:(y-y0)*4+h, (x-x0)*4:(x-x0)*4+w]
    Image.fromarray((np.clip(out, 0, 1) * 255 + .5).astype(np.uint8)).save(upath)
x4 = Image.open(upath)

def alpha_at(scale):
    a = cv2.resize(mask, (W * scale, H * scale), interpolation=cv2.INTER_CUBIC)
    return np.clip((a.astype(np.float32) - 20) * 1.1, 0, 255).astype(np.uint8)

# --- 3. main layers at 2k (2048 x 3072) -------------------------------------
x2 = np.array(x4.resize((W * 2, H * 2), Image.LANCZOS))
a2 = alpha_at(2)
Image.fromarray(np.dstack([x2, a2])).save(f'{OUT}/char_2k.png', optimize=True)
Image.fromarray(x2).save(f'{OUT}/full_2k.jpg', quality=93)
sil = np.dstack([np.full_like(a2, 255)] * 3 + [a2])
Image.fromarray(sil).save(f'{OUT}/sil_2k.png', optimize=True)

# close-up plate: upper body at x4 (src x 150..900, y 0..700)
ux0, uy0, ux1, uy1 = 150, 0, 900, 700
a4 = alpha_at(4)[uy0*4:uy1*4, ux0*4:ux1*4]
up = np.array(x4)[uy0*4:uy1*4, ux0*4:ux1*4]
Image.fromarray(np.dstack([up, a4])).save(f'{OUT}/upper_x4.png', optimize=True)
# the eye inset panel from the illustration (right side), x4
Image.fromarray(np.array(x4)[52*4:470*4, 823*4:940*4]).save(f'{OUT}/inset_x4.jpg', quality=93)

# --- 4. line art (XDoG-ish on the 2k plate) ---------------------------------
g = cv2.cvtColor(x2, cv2.COLOR_RGB2GRAY).astype(np.float32) / 255
lab2 = cv2.cvtColor(x2, cv2.COLOR_RGB2LAB).astype(np.float32)
edges = np.zeros_like(g)
for ch in range(3):
    c = lab2[..., ch] / 255
    d = cv2.GaussianBlur(c, (0, 0), 1.0) - cv2.GaussianBlur(c, (0, 0), 1.8)
    edges = np.maximum(edges, np.abs(d))
lines = np.clip((edges - 0.006) * 60, 0, 1)
lines *= (a2 > 60)
lines = cv2.GaussianBlur(lines, (0, 0), 0.6)
la = (np.clip(lines * 1.4, 0, 1) * 255).astype(np.uint8)
Image.fromarray(np.dstack([np.full_like(la, 255)] * 3 + [la])).save(f'{OUT}/lines_2k.png', optimize=True)

# --- 5. flat cel colour groups (k-means inside the silhouette) --------------
inside = a2 > 128
pix = lab2[inside].reshape(-1, 3)
rng = np.random.default_rng(7)
sample = pix[rng.choice(len(pix), 60000, replace=False)]
K = 7
crit = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 50, 0.5)
_, _, centers = cv2.kmeans(sample, K, None, crit, 5, cv2.KMEANS_PP_CENTERS)
flat_img = cv2.medianBlur(x2, 5)
fl = cv2.cvtColor(flat_img, cv2.COLOR_RGB2LAB).astype(np.float32)
d = ((fl[..., None, :] - centers[None, None]) ** 2).sum(-1)
labels = d.argmin(-1)
rgb_centers = cv2.cvtColor(centers[None].astype(np.uint8), cv2.COLOR_LAB2RGB)[0]
order = np.argsort(centers[:, 0])            # dark -> light
groups = []
for rank, k in enumerate(order):
    m = ((labels == k) & inside).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3, 3)))
    col = rgb_centers[k]
    layer = np.zeros((H * 2, W * 2, 4), np.uint8); layer[..., :3] = col; layer[..., 3] = m * 255
    Image.fromarray(layer).save(f'{OUT}/flat_{rank}.png', optimize=True)
    groups.append({'file': f'flat_{rank}.png', 'rgb': [int(v) for v in col], 'share': float(m.mean())})

# --- 6. point cloud for "OBJECT CREATION" -----------------------------------
ys, xs = np.nonzero(la > 90)
idx = rng.choice(len(xs), min(5200, len(xs)), replace=False)
pts = [[int(xs[i] / 2), int(ys[i] / 2)] for i in idx]      # back in 1024-space
json.dump({'size': [W, H], 'groups': groups, 'upper': [ux0, uy0, ux1, uy1], 'points': pts},
          open(f'{OUT}/meta.json', 'w'))
print('groups', groups)
