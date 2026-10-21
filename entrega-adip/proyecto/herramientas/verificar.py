#!/usr/bin/env python3
"""Verificación del video final: especificaciones, secuencias en movimiento de los momentos clave y consistencia de color.
Uso: verificar.py VIDEO.mp4 [carpeta_salida]"""
import sys, io, json, subprocess
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont

V = sys.argv[1]; AQUI = Path(__file__).resolve().parent.parent
OUT = Path(sys.argv[2]) if len(sys.argv) > 2 else AQUI / "salida" / "verificacion"; OUT.mkdir(parents=True, exist_ok=True)
PLAN = json.loads((AQUI / "plan.json").read_text()); FPS = PLAN["fps"]
def s2o(ts):
    for s in PLAN["segs"]:
        if s["src_in"] - 1e-4 <= ts <= s["src_out"] + 1e-4: return (s["out_start_f"] + (ts - s["src_in"]) * FPS) / FPS
    for s in PLAN["segs"]:
        if ts < s["src_in"]: return s["out_start_f"] / FPS
    return PLAN["video_frames"] / FPS
font = ImageFont.load_default(size=24)

info = subprocess.run(["ffprobe", "-v", "error", "-count_frames", "-show_entries", "stream=codec_name,width,height,r_frame_rate,pix_fmt,nb_read_frames,duration,bit_rate,color_space:format=size,duration",
                       "-of", "json", V], capture_output=True, text=True).stdout
print(info)

def cuadro(t, w=300):
    b = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{t:.4f}", "-i", V, "-frames:v", "1", "-vf", f"scale={w}:-2", "-f", "image2pipe", "-vcodec", "png", "-"], capture_output=True).stdout
    return Image.open(io.BytesIO(b)).convert("RGB")

def hoja(nombre, tiempos, cols=6, w=300):
    tiles = []
    for t in tiempos:
        im = cuadro(t, w); d = ImageDraw.Draw(im); d.rectangle((0, 0, 96, 30), fill=(0, 0, 0)); d.text((5, 3), f"{t:5.2f}s", fill=(255, 255, 0), font=font); tiles.append(im)
    W, H = tiles[0].size; rows = (len(tiles) + cols - 1) // cols
    sh = Image.new("RGB", (cols * W, rows * H), "white")
    for k, im in enumerate(tiles): sh.paste(im, ((k % cols) * W, (k // cols) * H))
    sh.save(OUT / nombre); print(nombre, len(tiles))

rng = lambda a, b, p: [round(a + i * p, 3) for i in range(int((b - a) / p) + 1)]
hoja("01_apertura.png", rng(0.0, 3.9, 0.2), cols=7)
hoja("02_presentacion_terapias.png", [s2o(x) for x in (8.4, 9.3, 17.6, 18.4, 19.4, 20.3, 21.3, 22.0, 22.4, 23.1, 23.95, 25.0, 25.9, 26.3, 27.0, 27.6)], cols=8)
hoja("03_contacto_detalle.png", [s2o(x) for x in (35.0, 35.45, 36.3, 37.6, 38.3, 40.0, 40.5, 41.0, 41.6)], cols=9)
hoja("04_cierre.png", [PLAN["video_frames"] / FPS - 1.0 + i * 0.25 for i in range(0, 16)], cols=8)

# ---- consistencia de color: paredes neutras y tono de piel de Andy (exterior vs interior)
caras = json.loads((AQUI / "caras.json").read_text())
def medir(t_out, src_t):
    b = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{t_out:.4f}", "-i", V, "-frames:v", "1", "-vf", "scale=540:960", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
    img = np.frombuffer(b, np.uint8).reshape(960, 540, 3).astype(np.float32)
    mx, mn = img.max(2), img.min(2); m = (mx > 150) & ((mx - mn) / np.maximum(mx, 1) < .22)
    n = img[m].mean(0) if m.any() else np.array([np.nan] * 3)
    return n[0] / n[1], n[2] / n[1]
print("\nparedes neutras (R/G, B/G) — objetivo ≈ 1,00 / 1,00:")
for ts in (1.5, 6.0, 18.0, 20.0, 31.0, 40.0, 47.0):
    to = s2o(ts); r, b = medir(to, ts); print(f"  fuente {ts:5.1f}s  ->  R/G {r:.3f}   B/G {b:.3f}")
