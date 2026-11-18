"""Safe-zone audit on the green pass: per frame, bbox of everything that is not the green background.
Zone: y 260-1580, x 80-1000; plus x <= 960 below y 1000 (Instagram's button column)."""
import subprocess, sys, numpy as np
pr = subprocess.Popen(["ffmpeg", "-v", "error", "-i", sys.argv[1], "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
def frames():
    while True:
        b = pr.stdout.read(960 * 540 * 3)
        if len(b) < 960 * 540 * 3: return
        yield np.frombuffer(b, np.uint8).reshape(960, 540, 3)
runs = {}; total = 0
TOP = int(sys.argv[2]) if len(sys.argv) > 2 else 260
for n, im in enumerate(frames()):
    total += 1
    fg = ~((im[..., 1] > 200) & (im[..., 0] < 90) & (im[..., 2] < 90))
    fg[:2] = fg[-2:] = False
    if not fg.any(): continue
    ys = np.where(fg.any(1))[0]; xs = np.where(fg.any(0))[0]
    L, R, T, B = xs[0] * 2, (xs[-1] + 1) * 2, ys[0] * 2, (ys[-1] + 1) * 2
    low = fg[500:]; Rlow = (np.where(low.any(0))[0][-1] + 1) * 2 if low.any() else 0
    bad = []
    if L < 78: bad.append(f"izq x={L}")
    if R > 1002: bad.append(f"der x={R}")
    if T < TOP - 2: bad.append(f"arriba y={T}")
    if B > 1582: bad.append(f"abajo y={B}")
    if Rlow > 962: bad.append(f"zona botones x={Rlow}")
    for b in bad:
        k = b.split(" ")[0] + (" botones" if "botones" in b else "")
        runs.setdefault(k, []).append((n, b))
if not runs: print("OK: nada fuera de la zona segura en", total, "cuadros")
for k, v in runs.items():
    # group consecutive frames
    seg = []; a = v[0][0]; p = a; worst = v[0][1]
    for n, b in v[1:] + [(10**9, "")]:
        if n != p + 1:
            seg.append((a, p, worst)); a = n; worst = b
        elif b and int(b.split('=')[1]) != int(worst.split('=')[1]):
            worst = max([worst, b], key=lambda z: abs(int(z.split('=')[1]) - 540 if 'x=' in z else int(z.split('=')[1]) - 920))
        p = n
    for a, p, w in seg: print(f"{k:16s} {a/30:5.2f}-{p/30:5.2f} s  ({w})")
