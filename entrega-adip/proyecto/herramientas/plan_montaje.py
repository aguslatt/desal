#!/usr/bin/env python3
"""Lee montaje.json + caras.json y genera plan.json:
   - segmentos de montaje y línea de tiempo de salida
   - trayectoria de cámara (reencuadre digital sobre el 4K) cuadro a cuadro, calculada con las caras:
       · «sujeto»: encuadra a quien habla y deja a la otra persona COMPLETAMENTE fuera (o completamente dentro)
       · «ambos»: el plano más cerrado que contiene las dos caras enteras
     de modo que ninguna cara queda cortada por un borde
   - posiciones de las caras en pantalla (para que los gráficos acompañen a las personas)
   - informe de caras cortadas por segmento (debe dar 0)
Uso: python3 plan_montaje.py VIDEO_ORIGINAL"""
import sys, json
from pathlib import Path
import numpy as np

AQUI = Path(__file__).resolve().parent.parent
M = json.loads((AQUI / "montaje.json").read_text(encoding="utf-8"))
C = json.loads((AQUI / "caras.json").read_text())
FPS = M["fps"]
KC = 0.66      # semiancho de la cara (múltiplos del ancho detectado): cara + orejas
KO = 1.00      # semiancho de la «otra» persona al decidir qué se excluye: cara + pelo + hombro

# ---------- segmentos ----------
segs = []; out_f = 0
for s in M["segmentos"]:
    ti, to = s["in"], s["out"]; adel = s.get("audio_adelanto", 0.0)
    if segs and abs(ti - segs[-1]["src_out"]) <= 0.06:       # tramo contiguo del original: se encadena exacto (video y audio, sin huecos ni repeticiones)
        ti = segs[-1]["src_out"]; adel = segs[-1]["audio_adelanto"] if "audio_adelanto" not in s else adel
    n = round((to - ti) * FPS)
    segs.append({"id": s["id"], "src_in": ti, "src_out": round(ti + n / FPS, 4), "out_start_f": out_f, "n": n, "cam": s["cam"], "audio_adelanto": adel})
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
    k = dt / (tau + dt); y = np.copy(x)
    for i in range(1, len(y)): y[i] = y[i - 1] + k * (x[i] - y[i - 1])
    z = np.copy(y)
    for i in range(len(z) - 2, -1, -1): z[i] = z[i + 1] + k * (y[i] - z[i + 1])
    return z
def ease(u): return u * u * (3 - 2 * u)
CLAVE = {"andy": "andi", "lu": "lu"}          # los nombres internos de las pistas

def extremos(nombre, ts, k, pad_t=0.25):
    tt = np.arange(ts[0] - pad_t, ts[-1] + pad_t, 0.05)
    xs = np.array([en(nombre, t) for t in tt])
    return float((xs[:, 0] - k * xs[:, 2]).min()), float((xs[:, 0] + k * xs[:, 2]).max())

def ventana_x(cam, ts):
    """ventana horizontal estática (x0, x1) que respeta las caras; devuelve también la nota de lo resuelto"""
    modo = cam["modo"]
    if modo == "ambos":
        l0, l1 = extremos("lu", ts, KC); a0, a1 = extremos("andi", ts, KC)
        pad = cam.get("margen", 0.045)
        x0 = max(0.0, min(l0, a0) - pad); x1 = min(1.0, max(l1, a1) + pad)
        W = max(x1 - x0, 1 / cam.get("zmax", 1.5)); c = (x0 + x1) / 2
        x0, x1 = c - W / 2, c + W / 2
        if x0 < 0: x0, x1 = 0.0, W
        if x1 > 1: x0, x1 = 1 - W, 1.0
        return x0, x1
    s = CLAVE[cam["sujeto"]]; o = "lu" if s == "andi" else "andi"
    s0, s1 = extremos(s, ts, KC); o0, o1 = extremos(o, ts, KO)
    pad = cam.get("margen", 0.035)
    if o0 > s1:                                   # la otra persona queda a la derecha
        x1 = max((s1 + o0) / 2, o0 - 0.012); x0 = max(0.0, s0 - pad - cam.get("aire_izq", 0.0))
        if o0 - s1 < 0.03: raise SystemExit(f"{cam}: no hay espacio para excluir a la otra persona (hueco {o0 - s1:.3f})")
    elif o1 < s0:                                 # a la izquierda
        x0 = min((s0 + o1) / 2 if True else 0, s0 - 0.01); x0 = max(x0, o1 + 0.012) if o1 + 0.012 < s0 - 0.01 else (s0 + o1) / 2; x1 = min(1.0, s1 + pad + cam.get("aire_der", 0.0))
        if s0 - o1 < 0.03: raise SystemExit(f"{cam}: no hay espacio para excluir a la otra persona (hueco {s0 - o1:.3f})")
    else: raise SystemExit(f"{cam}: las caras se superponen en horizontal")
    # la exclusión manda: si pedir menos zoom obligaría a cortar a la otra persona, se expande solo del lado libre
    Wmin = 1 / cam.get("zmax", 1.8)
    if o0 > s1:   x0 = max(0.0, x1 - max(x1 - x0, Wmin))
    else:         x1 = min(1.0, x0 + max(x1 - x0, Wmin))
    if 1 / (x1 - x0) > cam.get("zduro", 2.3): raise SystemExit(f"{cam}: exige zoom {1/(x1-x0):.2f} (> {cam.get('zduro', 2.3)})")
    return x0, x1

frames = []; informe = []
for s in segs:
    n = s["n"]; cam = s["cam"]; ts = s["src_in"] + np.arange(n) / FPS
    u = np.arange(n) / max(n - 1, 1)
    hy = cam.get("hy", 0.5)
    if cam["modo"] in ("andy_solo", "fijo"):
        z0, z1 = cam["z"]; z = z0 + (z1 - z0) * ease(u)
        if cam["modo"] == "fijo": sx = np.full(n, cam["cx"]); sy = np.full(n, cam["cy"])
        else:
            pts = np.array([en("andi", t) for t in ts]); sx = suavizar(pts[:, 0], 0.45, 1 / FPS); sy = suavizar(pts[:, 1], 0.6, 1 / FPS)
        X0 = np.zeros(n); WW = 1 / z
        X0 = np.clip(sx - WW / 2, 0, 1 - WW)
    else:
        x0, x1 = ventana_x(cam, ts); W0 = x1 - x0
        # empuje lento hacia el centro del sujeto: más cerrado al final (o al inicio con «empuje0»)
        if cam["modo"] == "sujeto":
            s_ = CLAVE[cam["sujeto"]]; cs = float(np.mean([en(s_, t)[0] for t in ts]))
        else: cs = (x0 + x1) / 2
        e0, e1 = cam.get("empuje0", 0.0), cam.get("empuje", 0.05)
        ee = e0 + (e1 - e0) * ease(u)
        X0 = x0 + ee * (cs - x0); X1 = x1 - ee * (x1 - cs); WW = X1 - X0
        z = 1 / WW
        pts = np.array([((en("andi", t) + en("lu", t)) / 2) if cam["modo"] == "ambos" else en(CLAVE[cam["sujeto"]], t) for t in ts])
        sy = suavizar(pts[:, 1], 0.6, 1 / FPS)
    cortadas = 0
    for k in range(n):
        ww = hh = float(WW[k]) if hasattr(WW, "__len__") else float(WW)
        top = float(np.clip(sy[k] - hy * hh, 0, 1 - hh)) if cam["modo"] != "fijo" else float(np.clip(sy[k] - hh / 2, 0, 1 - hh))
        x0k = float(X0[k]); t = ts[k]
        fr = {"z": round(1 / ww, 5), "x0": round(x0k, 5), "y0": round(top, 5), "ww": round(ww, 5), "hh": round(hh, 5), "t": round(float(t), 3)}
        for nombre in ("andi", "lu"):
            ocultar = (nombre == "lu" and t < 9.8) or (7.85 <= t < 9.917)
            cx, cy, w = en(nombre, t)
            ax, ay, aw = (cx - x0k) / ww * 1080, (cy - top) / hh * 1920, w / ww * 1080
            fr[nombre] = None if ocultar else ([round(float(ax), 1), round(float(ay), 1), round(float(aw), 1)] if -50 < ax < 1130 else None)
            if not ocultar and 4.0 < t:               # control de caras cortadas por un borde lateral
                a0_, a1_ = cx - 0.7 * w, cx + 0.7 * w
                if (a0_ < x0k < a1_) or (a0_ < x0k + ww < a1_): cortadas += 1
        frames.append(fr)
    informe.append((s["id"], round(float(np.mean(1 / np.array(WW) if hasattr(WW, "__len__") else 1 / WW)), 2), cortadas))

plan = {"fps": FPS, "video_frames": video_frames, "cierre_frames": cierre_frames, "total_frames": video_frames + cierre_frames,
        "segs": segs, "frames": frames}
(AQUI / "plan.json").write_text(json.dumps(plan))
print("segmentos:", len(segs), "| video:", f"{video_frames/FPS:.2f} s", "+ cierre", f"{cierre_frames/FPS:.1f} s", "=", f"{plan['total_frames']/FPS:.2f} s")
for s, (sid, zm, cort) in zip(segs, informe):
    print(f"  {s['id']:>3}  src {s['src_in']:6.2f}-{s['src_out']:6.2f} -> salida {s['out_start_f']/FPS:6.2f} s ({s['n']:3d} cuadros)  {s['cam']['modo']:9s} zoom medio {zm:.2f}  caras cortadas: {cort}")
