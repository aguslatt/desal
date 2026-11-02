"""Per-frame person matte (RGBA PNG, white + alpha) for the graded proxy.
usage: python3 -I taller_matte.py PROXY MODEL OUT_DIR START_FRAME END_FRAME"""
import sys, subprocess, numpy as np, cv2
import mediapipe as mp
from mediapipe.tasks import python as mpp
from mediapipe.tasks.python import vision

proxy, model, out, a, b = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4]), int(sys.argv[5])
W, H = 1080, 1920
CUTS = {round(t * 30) for t in (2.77, 5.7, 6.57, 9.67, 16.37, 23.6, 29.5, 33.07, 37.47, 38.2, 39.33, 42.87, 51.83)}
seg = vision.ImageSegmenter.create_from_options(vision.ImageSegmenterOptions(
    base_options=mpp.BaseOptions(model_asset_path=model), output_confidence_masks=True, running_mode=vision.RunningMode.IMAGE))
cmd = ['ffmpeg', '-v', 'error', '-ss', f'{a/30:.4f}', '-i', proxy, '-vf', f'scale={W}:{H}', '-frames:v', str(b - a + 1), '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-']
p = subprocess.Popen(cmd, stdout=subprocess.PIPE)
prev = None
for n in range(a, b + 1):
    buf = p.stdout.read(W * H * 3)
    if len(buf) < W * H * 3: break
    im = np.frombuffer(buf, np.uint8).reshape(H, W, 3)
    rgb = cv2.cvtColor(im, cv2.COLOR_BGR2RGB)
    r = seg.segment(mp.Image(image_format=mp.ImageFormat.SRGB, data=np.ascontiguousarray(rgb)))
    m = r.confidence_masks[0].numpy_view().astype(np.float32)[..., 0] if r.confidence_masks[0].numpy_view().ndim == 3 else r.confidence_masks[0].numpy_view().astype(np.float32)
    m = cv2.resize(m, (W, H), interpolation=cv2.INTER_CUBIC)
    m = cv2.ximgproc.guidedFilter(cv2.GaussianBlur(im, (0, 0), 1), m, 22, 1e-3)
    m = np.clip((m - 0.35) / 0.3, 0, 1)
    # remove protrusions / blocky leftovers: keep only what survives an opening of the solid core
    core = (m > 0.6).astype(np.uint8)
    core = cv2.morphologyEx(core, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (43, 43)))
    region = cv2.dilate(core, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (33, 33))).astype(np.float32)
    m = m * cv2.GaussianBlur(region, (0, 0), 3)
    # colour clean-up on the rim: wall pixels are bright and almost unsaturated
    hsv = cv2.cvtColor(im, cv2.COLOR_BGR2HSV).astype(np.float32)
    host_only = n < 290 or 1180 <= n < 1286  # black sweater: we can be stricter
    wallish = ((hsv[..., 2] > (105 if host_only else 135)) & (hsv[..., 1] < (45 if host_only else 22))).astype(np.float32)
    b = (m > 0.5).astype(np.uint8)
    band = (cv2.dilate(b, np.ones((65 if host_only else 45,) * 2, np.uint8)) - cv2.erode(b, np.ones((65 if host_only else 45,) * 2, np.uint8))).astype(np.float32)
    kill = cv2.GaussianBlur(wallish * band, (0, 0), 2.0)
    m = m * (1 - np.clip(kill * 1.6, 0, 1))
    m = cv2.erode(m, np.ones((3, 3), np.uint8))
    # drop stray blobs (keep components > 1.2% of the frame)
    bw = (m > 0.5).astype(np.uint8)
    k, lab, st, _ = cv2.connectedComponentsWithStats(bw, connectivity=8)
    keep = np.zeros(k, bool)
    for i in range(1, k):
        keep[i] = st[i, cv2.CC_STAT_AREA] > 0.012 * W * H
    near = cv2.dilate(keep[lab].astype(np.uint8), np.ones((9, 9), np.uint8)).astype(np.float32)
    m = m * near
    if prev is not None and n not in CUTS:
        m = 0.7 * m + 0.3 * prev
    prev = m
    al = (np.clip(m, 0, 1) * 255).astype(np.uint8)
    rgba = np.dstack([np.full((H, W), 255, np.uint8)] * 3 + [al])
    cv2.imwrite(f'{out}/m{n:04d}.png', rgba, [cv2.IMWRITE_PNG_COMPRESSION, 3])
print('done', a, b)
