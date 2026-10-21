#!/usr/bin/env python3
"""Detecta caras a 10 cuadros/s (YuNet) y arma pistas suavizadas para Andi y Lu.
Salida: caras.json  ->  {"andi": [[t, cx, cy, ancho], ...], "lu": [...]}   (coordenadas normalizadas 0-1 del cuadro original)
Uso: python3 analisis_caras.py VIDEO MODELO_YUNET SALIDA.json"""
import sys, json, subprocess
import numpy as np, cv2

src, modelo, salida = sys.argv[1:4]
W, H, FPS = 540, 960, 10
cmd = ["ffmpeg", "-v", "error", "-i", src, "-vf", f"fps={FPS},scale={W}:{H}:flags=area,format=bgr24", "-f", "rawvideo", "-"]
p = subprocess.Popen(cmd, stdout=subprocess.PIPE)
det = cv2.FaceDetectorYN.create(modelo, "", (W, H), 0.55, 0.3, 5000)
filas = []
i = 0
while True:
    b = p.stdout.read(W * H * 3)
    if len(b) < W * H * 3: break
    img = np.frombuffer(b, np.uint8).reshape(H, W, 3)
    _, f = det.detect(img)
    caras = []
    if f is not None:
        for r in f:
            x, y, w, h = r[:4]; sc = r[-1]
            caras.append([float((x + w / 2) / W), float((y + h / 2) / H), float(w / W), float(sc)])
    filas.append((i / FPS, caras)); i += 1
json.dump({"fps": FPS, "cuadros": filas}, open(salida.replace(".json", "_crudo.json"), "w"))

# Asignación: dos caras -> izquierda = Lu, derecha = Andi (pasillo). Una cara -> la más cercana a la última pista.
andi, lu = [], []
for t, cs in filas:
    cs = sorted(cs, key=lambda c: c[0])
    if t < 9.7:                         # exterior / hall: solo Andi
        if cs: andi.append([t, *max(cs, key=lambda c: c[2])[:3]])
        continue
    if len(cs) >= 2:
        l, a = cs[0], cs[-1]
        if a[0] - l[0] > 0.25:
            lu.append([t, *l[:3]]); andi.append([t, *a[:3]])
    elif len(cs) == 1:
        c = cs[0]
        la = andi[-1] if andi else None; ll = lu[-1] if lu else None
        da = abs(c[0] - la[1]) if la else 9; dl = abs(c[0] - ll[1]) if ll else 9
        (andi if da < dl else lu).append([t, *c[:3]])

def suave(pista, ventana=9):
    if len(pista) < 3: return pista
    a = np.array(pista); t = a[:, 0]
    g = np.arange(0, t[-1] + 0.05, 0.1)
    out = [g]
    for k in (1, 2, 3):
        y = np.interp(g, t, a[:, k])
        y = np.convolve(np.pad(y, ventana // 2, mode="edge"), np.ones(ventana) / ventana, mode="valid")
        out.append(y)
    return np.stack(out, 1).round(4).tolist()

json.dump({"andi": suave(andi), "lu": suave(lu), "crudo_andi": andi, "crudo_lu": lu}, open(salida, "w"))
print("cuadros", len(filas), "| detecciones Andi", len(andi), "Lu", len(lu))
