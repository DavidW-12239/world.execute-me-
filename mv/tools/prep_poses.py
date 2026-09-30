"""Cut the character sheet and the white-dress illustrations into MV layers.

Usage: python3 tools/prep_poses.py tools web/assets/poses [job ...]
(each job runs in its own process: the two ONNX models together exceed 14 GB)
Writes one PNG per pose (cutouts are RGBA, face panels are RGB) + poses.json
with each image's size and the bounding box of the figure (for anchoring).
"""
import json, os, sys
import numpy as np, cv2
from PIL import Image

SRC, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, '..', '.cache')
_sess = {}

def esrgan(im, scale):
    """Real-ESRGAN anime x4, then resample to the wanted scale."""
    import onnxruntime as ort
    if 'sr' not in _sess: _sess['sr'] = ort.InferenceSession(os.path.join(CACHE, 'anime6b.onnx'), providers=['CPUExecutionProvider'])
    a = np.asarray(im.convert('RGB')).astype(np.float32) / 255; H, W, _ = a.shape
    T, P = 192, 12; out = np.zeros((H * 4, W * 4, 3), np.float32)
    for y in range(0, H, T):
        for x in range(0, W, T):
            y0, x0, y1, x1 = max(0, y - P), max(0, x - P), min(H, y + T + P), min(W, x + T + P)
            r = _sess['sr'].run(None, {'input': a[y0:y1, x0:x1].transpose(2, 0, 1)[None]})[0][0].transpose(1, 2, 0)
            h, w = min(T, H - y) * 4, min(T, W - x) * 4
            out[y*4:y*4+h, x*4:x*4+w] = r[(y-y0)*4:(y-y0)*4+h, (x-x0)*4:(x-x0)*4+w]
    big = Image.fromarray((np.clip(out, 0, 1) * 255 + .5).astype(np.uint8))
    return big if scale == 4 else big.resize((round(W * scale), round(H * scale)), Image.LANCZOS)

def cutout_mask(im):
    from rembg import remove, new_session
    if 'seg' not in _sess: _sess['seg'] = new_session('birefnet-general')
    m = np.array(remove(im.convert('RGB'), session=_sess['seg'], only_mask=True).convert('L'))
    n, lab, st, _ = cv2.connectedComponentsWithStats((m > 128).astype(np.uint8))
    keep = lab == 1 + np.argmax(st[1:, 4])
    keep = cv2.dilate(keep.astype(np.uint8), np.ones((5, 5))) > 0
    m = np.where(keep, m, 0).astype(np.uint8)
    return np.clip((m.astype(np.float32) - 20) * 1.1, 0, 255).astype(np.uint8)

sheet = Image.open(f'{SRC}/sheet_src.jpg').convert('RGB')
MP = f'{OUT}/poses.json'
meta = json.load(open(MP)) if os.path.exists(MP) else {}
def save(name, rgba_or_rgb, bbox=None):
    rgba_or_rgb.save(f'{OUT}/{name}.png', optimize=True)
    w, h = rgba_or_rgb.size
    if bbox is None and rgba_or_rgb.mode == 'RGBA':
        a = np.array(rgba_or_rgb)[..., 3]; ys, xs = np.nonzero(a > 60); bbox = [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())]
    meta[name] = {'w': w, 'h': h, 'bbox': bbox or [0, 0, w, h]}
    print(name, w, h, meta[name]['bbox'], flush=True)

def cut(name, img, box=None, scale=1, max_h=1700):
    crop = img.crop(box) if box else img
    m = cutout_mask(crop); _sess.pop('seg', None)
    big = esrgan(crop, scale) if scale > 1 else crop
    mb = cv2.resize(m, big.size, interpolation=cv2.INTER_CUBIC)
    rgba = Image.fromarray(np.dstack([np.asarray(big), mb]))
    if rgba.height > max_h: rgba = rgba.resize((round(rgba.width * max_h / rgba.height), max_h), Image.LANCZOS)
    save(name, rgba)


EXPR = {'calm': (37, 836, 165, 1002), 'smile': (181, 836, 309, 1002), 'sad': (325, 836, 453, 1002),
        'angry': (37, 1051, 165, 1221), 'surprised': (181, 1051, 309, 1221), 'closed': (325, 1051, 453, 1221)}
def faces():
    for k, b in EXPR.items():
        save('face_' + k, esrgan(sheet.crop((b[0] + 3, b[1] + 3, b[2] - 3, b[3] - 3)), 4))
    save('face_detail', esrgan(sheet.crop((1054, 20, 1325, 348)), 4))
def white():
    wf = Image.open(f'{SRC}/white_full_src.jpg').convert('RGB'); wu = Image.open(f'{SRC}/white_up_src.jpg').convert('RGB')
    cut('white_full', wf, None, 1, 1920); cut('white_up', wu, None, 1, 1540)
    for n, im in (('white_full_plate', wf), ('white_up_plate', wu)):
        im.save(f'{OUT}/{n}.jpg', quality=92); meta[n] = {'w': im.width, 'h': im.height, 'bbox': [0, 0, im.width, im.height]}
JOBS = {
    'faces': faces, 'white': white,
    'view_front': lambda: cut('view_front', sheet, (262, 60, 556, 692), 4),
    'view_side': lambda: cut('view_side', sheet, (556, 60, 766, 692), 4),
    'view_back': lambda: cut('view_back', sheet, (768, 60, 1032, 692), 4),
    'pose_sit': lambda: cut('pose_sit', sheet, (912, 770, 1212, 1255), 4),
    'pose_back': lambda: cut('pose_back', sheet, (1188, 760, 1498, 1160), 4),
    'pose_hug': lambda: cut('pose_hug', sheet, (1075, 1148, 1500, 1500), 4),
}
if len(sys.argv) > 3:
    for j in sys.argv[3:]: JOBS[j]()
    json.dump(meta, open(MP, 'w'), indent=1)
else:
    import subprocess
    for j in JOBS: subprocess.run([sys.executable, __file__, SRC, OUT, j], check=True)
