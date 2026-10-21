#!/usr/bin/env python3
"""Lee montaje.json + caras.json y genera plan.json:
   - cortes ajustados al silencio más cercano (sin pisar sílabas)
   - trayectoria de cámara (reencuadre digital sobre el 4K) cuadro a cuadro
   - posiciones de las caras en pantalla (para que los gráficos acompañen a las personas)
Uso: python3 plan_montaje.py VIDEO_ORIGINAL"""
import sys, json, subprocess
from pathlib import Path
import numpy as np

AQUI = Path(__file__).resolve().parent.parent
SRC = sys.argv[1]
M = json.loads((AQUI / "montaje.json").read_text(encoding="utf-8"))
C = json.loads((AQUI / "caras.json").read_text())
FPS = M["fps"]

# ---------- audio: envolvente RMS para ajustar los cortes ----------
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", SRC, "-vn", "-ac", "1", "-ar", "16000", "-f", "s16le", "-"], capture_output=True).stdout
a = np.frombuffer(raw, np.int16).astype(np.float32) / 32768
hop = 160                                            # 10 ms
env = np.sqrt(np.convolve(a[: len(a) // hop * hop].reshape(-1, hop).__pow__(2).mean(1), np.ones(3) / 3, mode="same"))

def snap(t, ventana=0.09):
    i0, i1 = int((t - ventana) * 100), int((t + ventana) * 100)
    seg = env[max(i0, 0): i1 + 1]
    pen = np.abs(np.arange(len(seg)) - (t * 100 - max(i0, 0))) * 0.00006      # preferir lo cercano
    return round((max(i0, 0) + int(np.argmin(seg + pen))) / 100, 3)

# ---------- segmentos ----------
segs = []
out_f = 0
for s in M["segmentos"]:
    ti, to = s["in"], s["out"]
    n = round((to - ti) * FPS)
    segs.append({"id": s["id"], "src_in": ti, "src_out": round(ti + n / FPS, 3), "out_start_f": out_f, "n": n, "cam": s["cam"], "audio_adelanto": s.get("audio_adelanto", 0.0)})
    out_f += n
video_frames = out_f
cierre_frames = round(M["cierre_dur"] * FPS)

# ---------- pistas de cara ----------
def pista(nombre):
    a_ = np.array(C[nombre]); return a_[:, 0], a_[:, 1], a_[:, 2], a_[:, 3]
P = {k: pista(k) for k in ("andi", "lu")}
def en(nombre, t):
    tt, cx, cy, w = P[nombre]
    return np.array([np.interp(t, tt, cx), np.interp(t, tt, cy), np.interp(t, tt, w)])

def suavizar(x, tau, dt):
    """suavizado de fase cero (adelante + atrás) para movimientos de operador, sin retraso"""
    k = dt / (tau + dt)
    y = np.copy(x)
    for i in range(1, len(y)): y[i] = y[i - 1] + k * (x[i] - y[i - 1])
    z = np.copy(y)
    for i in range(len(z) - 2, -1, -1): z[i] = z[i + 1] + k * (y[i] - z[i + 1])
    return z

def ease(u): return u * u * (3 - 2 * u)

frames = []
for s in segs:
    n = s["n"]; cam = s["cam"]; ts = s["src_in"] + np.arange(n) / FPS
    z0, z1 = cam["z"]
    u = np.arange(n) / max(n - 1, 1)
    z = z0 + (z1 - z0) * ease(u)
    if cam["modo"] == "fijo":
        sx = np.full(n, cam["cx"]); sy = np.full(n, cam["cy"]); hy = 0.5
    else:
        pts = []
        for t in ts:
            if cam["modo"] == "andi": p = en("andi", t)
            elif cam["modo"] == "lu": p = en("lu", t)
            else: p = (en("andi", t) + en("lu", t)) / 2
            pts.append(p)
        pts = np.array(pts); sx = suavizar(pts[:, 0], 0.45, 1 / FPS); sy = suavizar(pts[:, 1], 0.6, 1 / FPS); hy = cam["hy"]
    for k in range(n):
        ww = hh = 1 / z[k]
        cxw = float(np.clip(sx[k], ww / 2, 1 - ww / 2))
        if cam["modo"] == "fijo": top = float(np.clip(sy[k] - hh / 2, 0, 1 - hh))
        else: top = float(np.clip(sy[k] - hy * hh, 0, 1 - hh))
        x0 = cxw - ww / 2
        t = ts[k]; fr = {"z": round(float(z[k]), 5), "x0": round(x0, 5), "y0": round(top, 5), "ww": round(ww, 5), "hh": round(hh, 5), "t": round(float(t), 3)}
        for nombre in ("andi", "lu"):
            if t < 7.85 and nombre == "lu": fr[nombre] = None; continue
            if 7.85 <= t < 9.917: fr[nombre] = None; continue
            cx, cy, w = en(nombre, t)
            ax, ay, aw = (cx - x0) / ww * 1080, (cy - top) / hh * 1920, w / ww * 1080
            fr[nombre] = [round(float(ax), 1), round(float(ay), 1), round(float(aw), 1)] if -50 < ax < 1130 else None
        frames.append(fr)

plan = {"fps": FPS, "video_frames": video_frames, "cierre_frames": cierre_frames, "total_frames": video_frames + cierre_frames,
        "segs": segs, "frames": frames}
(AQUI / "plan.json").write_text(json.dumps(plan))
print("segmentos:", len(segs), "| cuadros de video:", video_frames, f"({video_frames/FPS:.2f} s) + cierre {cierre_frames/FPS:.1f} s = {plan['total_frames']/FPS:.2f} s")
for s in segs: print(f"  {s['id']:>3}  src {s['src_in']:6.2f}-{s['src_out']:6.2f}  -> salida {s['out_start_f']/FPS:6.2f} s  ({s['n']} cuadros)  {s['cam']['modo']} z{s['cam']['z']}")
