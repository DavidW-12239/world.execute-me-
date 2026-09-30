"""Cut the three "dark form" panels into 16:9 face crops for the 死刑 hits (2:35-2:39).
Each crop is upscaled x4 (Real-ESRGAN anime) and stored as a contrast-normalised greyscale
plate; the renderer gradient-maps it to the palette at draw time.
Usage: python3 tools/prep_dark.py tools/dark_forms_src.jpg web/assets/dark
"""
import os, sys, numpy as np, cv2
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
SRC, OUT = sys.argv[1], sys.argv[2]; os.makedirs(OUT, exist_ok=True)
import onnxruntime as ort
sess = ort.InferenceSession(os.path.join(os.path.dirname(__file__), '..', '.cache', 'anime6b.onnx'), providers=['CPUExecutionProvider'])
def esrgan(im):
    a = np.asarray(im).astype(np.float32) / 255; H, W, _ = a.shape; T, P = 192, 12; out = np.zeros((H * 4, W * 4, 3), np.float32)
    for y in range(0, H, T):
        for x in range(0, W, T):
            y0, x0, y1, x1 = max(0, y - P), max(0, x - P), min(H, y + T + P), min(W, x + T + P)
            r = sess.run(None, {'input': a[y0:y1, x0:x1].transpose(2, 0, 1)[None]})[0][0].transpose(1, 2, 0)
            h, w = min(T, H - y) * 4, min(T, W - x) * 4
            out[y*4:y*4+h, x*4:x*4+w] = r[(y-y0)*4:(y-y0)*4+h, (x-x0)*4:(x-x0)*4+w]
    return Image.fromarray((np.clip(out, 0, 1) * 255 + .5).astype(np.uint8))
src = Image.open(SRC).convert('RGB')
BOXES = [(20, 130, 660, 490), (600, 190, 1330, 601), (1320, 140, 1990, 517)]   # grin / knife / weeping eyes
for i, b in enumerate(BOXES):
    big = esrgan(src.crop(b)).resize((1920, 1080), Image.LANCZOS)
    g = cv2.cvtColor(np.asarray(big), cv2.COLOR_RGB2GRAY).astype(np.float32)
    lo, hi = np.percentile(g, 1), np.percentile(g, 99.5); g = np.clip((g - lo) / (hi - lo), 0, 1)
    Image.fromarray((g * 255).astype(np.uint8)).save(f'{OUT}/dark_{i}.png', optimize=True); print(i, flush=True)
