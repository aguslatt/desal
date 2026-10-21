#!/usr/bin/env python3
"""Mide la dominante de color de paredes/techos (neutros) y el tono de piel de Andi en distintos momentos."""
import sys, json, subprocess
import numpy as np, cv2

SRC, CARAS = sys.argv[1], sys.argv[2]
W, H = 864, 1536
caras = json.load(open(CARAS))
def cara(nombre, t):
    a = caras[nombre]; r = min(a, key=lambda r: abs(r[0] - t)); return r

def frame(t):
    cmd = ["ffmpeg", "-v", "error", "-ss", str(t), "-i", SRC, "-frames:v", "1",
           "-vf", f"scale={W}:{H}:flags=area,zscale=tin=arib-std-b67:t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,"
                  "tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=rgb24", "-f", "rawvideo", "-"]
    b = subprocess.run(cmd, capture_output=True).stdout
    return np.frombuffer(b, np.uint8).reshape(H, W, 3).astype(np.float32)

def neutro(img):
    """promedio RGB de los píxeles claros y poco saturados (paredes/techo)"""
    mx, mn = img.max(2), img.min(2)
    sat = (mx - mn) / np.maximum(mx, 1)
    m = (mx > 150) & (sat < 0.22)
    return img[m].mean(0), m.mean()

def piel(img, t):
    c = cara("andi", t); cx, cy, w = c[1], c[2], c[3]
    x0, x1 = int((cx - w * .22) * W), int((cx + w * .22) * W); y0, y1 = int((cy + w * .02) * H), int((cy + w * .22) * H)  # mejillas
    p = img[y0:y1, x0:x1].reshape(-1, 3)
    return p.mean(0)

print("t     | neutro RGB (R/G, B/G)             | piel Andi RGB (R/G, B/G)")
for t in [1, 3, 5, 12, 15, 20, 25, 30, 35, 40, 45, 49]:
    img = frame(t); n, frac = neutro(img); p = piel(img, t)
    print(f"{t:5.1f} | {n.round(0)} ({n[0]/n[1]:.3f}, {n[2]/n[1]:.3f}) frac={frac:.2f} | {p.round(0)} ({p[0]/p[1]:.3f}, {p[2]/p[1]:.3f})")
