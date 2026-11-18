"""Builds public/base.mp4 from the camera original: HLG->SDR tonemap, grade, wall clock painted out, 1296x2304.
usage: python3 scripts/prep_video.py source/video.mp4 [--keep-clock]"""
import json, subprocess, sys
import numpy as np
src = sys.argv[1]
W, H = 1296, 2304
cuts = [0, 4.4333, 5.7333, 9.6, 12.5333, 13.1667, 16.2, 17.8667, 23.6, 25.3667, 30.2333, 32.3667, 35.8, 40.9333, 42.1333, 44.9667, 48.6]
boxes = json.load(open('scripts/clock.json'))  # per-shot clock bbox measured on a 540x960 proxy
keep = '--keep-clock' in sys.argv
k = W / 540
M = 30  # margin (proxy px) so the drop shadow goes too
vf = ("zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=tonemap=hable:desat=0,"
      f"zscale=t=bt709:m=bt709:r=tv,format=yuv420p,scale={W}:{H}:flags=lanczos,"
      # grade: gentle contrast + a touch of warmth; first shot (other room) lifted to match
      "eq=contrast=1.06:saturation=1.10:gamma=1.02,colorbalance=rm=0.02:bm=-0.02:rh=0.01:bh=-0.015,"
      "eq=brightness=0.035:gamma=1.05:enable='lt(t,4.416)'")
dec = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', src, '-an', '-vf', vf, '-r', '30', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', '30', '-i', '-',
                        '-c:v', 'libx264', '-preset', 'fast', '-crf', '15', '-g', '15', '-pix_fmt', 'yuv420p',
                        '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', 'public/base.mp4'], stdin=subprocess.PIPE)
rng = np.random.default_rng(1)
def smooth(a, n):  # box blur along axis 0
    pad = np.pad(a, ((n, n), (0, 0)), mode='edge'); c = np.cumsum(pad, 0)
    return (c[2 * n:] - c[:-2 * n]) / (2 * n)
n = 0
while True:
    buf = dec.stdout.read(W * H * 3)
    if len(buf) < W * H * 3: break
    t = n / 30; n += 1
    s = max(i for i, c in enumerate(cuts[:-1]) if t >= c - 1e-3)
    if not keep and str(s) in boxes:
        f = np.frombuffer(buf, np.uint8).reshape(H, W, 3).copy()
        x0, y0, x1, y1 = boxes[str(s)]
        X0, X1 = int((x0 - M) * k), int((x1 + M) * k); Y0, Y1 = max(0, int((y0 - M) * k)), int((y1 + M) * k)
        reg = f[Y0:Y1, X0:X1].astype(np.float32)
        # the wall is a smooth gradient: rebuild each row from the wall just left and right of the box
        L = smooth(f[Y0:Y1, X0 - 28:X0 - 4].astype(np.float32).mean(1), 24)
        R = smooth(f[Y0:Y1, X1 + 4:X1 + 28].astype(np.float32).mean(1), 24)
        a = np.linspace(0, 1, X1 - X0, dtype=np.float32)[None, :, None]
        fill = L[:, None, :] * (1 - a) + R[:, None, :] * a + rng.normal(0, 0.9, reg.shape).astype(np.float32)
        yy = np.arange(Y1 - Y0, dtype=np.float32)[:, None]; xx = np.arange(X1 - X0, dtype=np.float32)[None, :]
        fe = 16.0
        m = np.clip(np.minimum(xx, X1 - X0 - 1 - xx) / fe, 0, 1) * np.clip((Y1 - Y0 - 1 - yy) / fe, 0, 1)
        if Y0 > 0: m = m * np.clip(yy / fe, 0, 1)
        m = m[:, :, None]
        f[Y0:Y1, X0:X1] = np.clip(reg * (1 - m) + fill * m, 0, 255).astype(np.uint8)
        buf = f.tobytes()
    enc.stdin.write(buf)
enc.stdin.close(); enc.wait(); print('frames', n)
