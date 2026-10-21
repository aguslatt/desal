#!/usr/bin/env python3
"""Compositor: decodifica el 4K HDR (HLG), lo pasa a SDR BT.709, reencuadra según plan.json,
aplica la corrección de color calibrada y compone las capas gráficas (fondo / frente).

Uso:
  compositor.py --src VIDEO --salida out.mp4 [--desde 0 --hasta 14.5] [--capas salida/capas] [--calidad prueba|final]
  compositor.py --src VIDEO --cuadros 1.0,2.5,12.0 --capas salida/capas --salida carpeta_png   (cuadros sueltos)
"""
import argparse, json, subprocess, sys, os
from pathlib import Path
import numpy as np, cv2

AQUI = Path(__file__).resolve().parent.parent
WW, HH = 1728, 3072           # resolución de trabajo (0,8 × 4K): permite hasta ~1,6× de reencuadre sin escalar hacia arriba
OW, OH = 1080, 1920
PLAN = json.loads((AQUI / "plan.json").read_text())
FPS = PLAN["fps"]

# ---------------- color (calibrado sobre mediciones reales del material) ----------------
# Las paredes/techos neutros salían con R/G≈1,06 y B/G≈0,935 en TODAS las escenas (exterior e interior):
# es un desvío de la cámara, no del lugar. Una sola corrección deja ambos ambientes consistentes.
GAINS = np.array([0.952, 1.0, 1.062], np.float32)        # R, G, B
_xs = np.array([0, .04, .25, .50, .75, .90, 1.0]); _ys = np.array([0, .034, .238, .492, .735, .862, .935])
LUT = np.interp(np.linspace(0, 1, 2048), _xs, _ys).astype(np.float32)        # curva suave: contiene brillos, base limpia
SAT_GLOBAL, SAT_PIEL = 0.93, 0.20                         # saturación general y control de naranjas (pieles / madera)

def peso_naranja(h):                                       # h en grados 0-360; ventana suave 6°-44° (pico ~24°)
    d = np.clip(1 - np.abs(h - 25.0) / 19.0, 0, 1)
    return d * d * (3 - 2 * d)

def grade(rgb):
    f = rgb.astype(np.float32) / 255.0
    f *= GAINS
    np.clip(f, 0, 1, out=f)
    f = LUT[(f * 2047).astype(np.int16)]
    hsv = cv2.cvtColor(f, cv2.COLOR_RGB2HSV)
    hsv[..., 1] *= SAT_GLOBAL * (1 - SAT_PIEL * peso_naranja(hsv[..., 0]))
    f = cv2.cvtColor(hsv, cv2.COLOR_HSV2RGB)
    f = f * 255.0 + (np.random.random(f.shape[:2] + (1,)).astype(np.float32) - 0.5) * 0.9      # leve dither (evita bandas)
    return np.clip(f, 0, 255).astype(np.uint8)

# ---------------- decodificación ----------------
VF = (f"fps={FPS},scale={WW}:{HH}:flags=bicubic,zscale=tin=arib-std-b67:t=linear:npl=100,format=gbrpf32le,"
      "zscale=p=bt709,tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=rgb24")

def decodificar(src, t0, n):
    cmd = ["ffmpeg", "-v", "error", "-ss", f"{t0:.4f}", "-i", src, "-vf", VF, "-frames:v", str(n), "-f", "rawvideo", "-"]
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE, bufsize=WW * HH * 3 * 3)
    try:
        for _ in range(n):
            b = p.stdout.read(WW * HH * 3)
            if len(b) < WW * HH * 3: break
            yield np.frombuffer(b, np.uint8).reshape(HH, WW, 3)
    finally:
        p.kill(); p.stdout.close(); p.wait()

# ---------------- reencuadre con precisión de subpíxel ----------------
def reencuadrar(img, fr):
    rx, ry, rw, rh = fr["x0"] * WW, fr["y0"] * HH, fr["ww"] * WW, fr["hh"] * HH
    s = OW / rw
    ix0, iy0 = int(np.floor(rx)), int(np.floor(ry))
    ix1, iy1 = min(int(np.ceil(rx + rw)) + 1, WW), min(int(np.ceil(ry + rh)) + 1, HH)
    roi = img[iy0:iy1, ix0:ix1]
    tw, th = max(int(round((ix1 - ix0) * s)), 1), max(int(round((iy1 - iy0) * s)), 1)
    r = cv2.resize(roi, (tw, th), interpolation=cv2.INTER_AREA if s < 1 else cv2.INTER_CUBIC)
    fx, fy = (rx - ix0) * (tw / (ix1 - ix0)), (ry - iy0) * (th / (iy1 - iy0))
    M = np.float32([[1, 0, -fx], [0, 1, -fy]])
    return cv2.warpAffine(r, M, (OW, OH), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)

# ---------------- capas gráficas ----------------
def capa(carpeta, i):
    p = os.path.join(carpeta, f"f_{i:05d}.png")
    if not os.path.exists(p): return None
    return cv2.imread(p, cv2.IMREAD_UNCHANGED)           # BGRA

_REC = None
MODELO = os.environ.get("MODELO_RECORTE", "/tmp/claude-0/-home-user-desal/a7a9560e-68e6-51ea-8c91-4f43b0a87a06/scratchpad/models/modnet.onnx")
def matte(base_rgb, previo):
    global _REC
    if _REC is None:
        sys.path.insert(0, str(Path(__file__).resolve().parent)); from recorte import Recorte; _REC = Recorte(MODELO)
    m = _REC.matte(base_rgb)
    if previo is not None: m = 0.55 * m + 0.45 * previo                 # suavizado temporal: evita parpadeo en bordes y pelo
    return m

def componer_fondo(base_rgb, bgra, m):
    """capa de fondo: se ve únicamente detrás de la persona (alfa × (1 − recorte))"""
    a = bgra[..., 3:4].astype(np.float32) / 255.0 * (1 - m[..., None])
    rgb = bgra[..., 2::-1].astype(np.float32)
    return (base_rgb.astype(np.float32) * (1 - a) + rgb * a + 0.5).astype(np.uint8)

def componer(base_rgb, bgra):
    if bgra is None: return base_rgb
    if bgra.ndim == 3 and bgra.shape[2] == 3: return np.ascontiguousarray(bgra[..., ::-1])      # capa totalmente opaca (sin canal alfa)
    a = bgra[..., 3:4].astype(np.float32) / 255.0
    rgb = bgra[..., 2::-1].astype(np.float32)
    return (base_rgb.astype(np.float32) * (1 - a) + rgb * a + 0.5).astype(np.uint8)

# ---------------- bucle principal ----------------
def segmento_de(i):
    for s in PLAN["segs"]:
        if s["out_start_f"] <= i < s["out_start_f"] + s["n"]: return s
    return None

def base_cuadro(src, i, cache={}):
    """cuadro base (ya reencuadrado y con color) de la línea de tiempo de salida i"""
    if i >= PLAN["video_frames"]: i = PLAN["video_frames"] - 1          # el cierre mantiene el último cuadro
    s = segmento_de(i); k = i - s["out_start_f"]
    return s, k

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", required=True); ap.add_argument("--salida", required=True)
    ap.add_argument("--desde", type=float, default=0.0); ap.add_argument("--hasta", type=float, default=None)
    ap.add_argument("--capas", default=str(AQUI / "salida" / "capas")); ap.add_argument("--calidad", default="prueba")
    ap.add_argument("--cuadros", default=None); ap.add_argument("--sin-capas", action="store_true")
    a = ap.parse_args()
    fondo, frente = os.path.join(a.capas, "fondo"), os.path.join(a.capas, "frente")

    if a.cuadros:                                                        # cuadros sueltos para revisar el diseño
        os.makedirs(a.salida, exist_ok=True)
        for t in [float(x) for x in a.cuadros.split(",")]:
            i = int(round(t * FPS)); j = min(i, PLAN["video_frames"] - 1)
            s, k = base_cuadro(a.src, j)
            img = next(decodificar(a.src, s["src_in"] + k / FPS, 1))
            out = grade(reencuadrar(img, PLAN["frames"][j]))
            if not a.sin_capas:
                cf = capa(fondo, i)
                if cf is not None and cf.ndim == 3 and cf.shape[2] == 4: out = componer_fondo(out, cf, matte(out, None))
                out = componer(out, capa(frente, i))
            cv2.imwrite(os.path.join(a.salida, f"cuadro_{t:06.2f}.png"), out[..., ::-1])
        return

    f0 = int(round(a.desde * FPS)); f1 = PLAN["total_frames"] if a.hasta is None else min(int(round(a.hasta * FPS)), PLAN["total_frames"])
    q = ["-crf", "15", "-preset", "medium", "-maxrate", "12M", "-bufsize", "24M"] if a.calidad == "final" else ["-crf", "19", "-preset", "veryfast"]
    enc = subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{OW}x{OH}", "-r", str(FPS), "-i", "-",
                            "-c:v", "libx264", *q, "-pix_fmt", "yuv420p", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
                            "-color_range", "tv", "-movflags", "+faststart", a.salida], stdin=subprocess.PIPE)
    ultimo = None; mprev = None
    for s in PLAN["segs"]:
        a0, a1 = s["out_start_f"], s["out_start_f"] + s["n"]
        lo, hi = max(a0, f0), min(a1, f1)
        if lo >= hi: continue
        fuente = decodificar(a.src, s["src_in"] + (lo - a0) / FPS, hi - lo + 4)
        img = None; faltantes = 0
        for j in range(lo, hi):
            nuevo = next(fuente, None)
            if nuevo is None: faltantes += 1                     # se mantiene el último cuadro decodificado
            else: img = nuevo
            base = grade(reencuadrar(img, PLAN["frames"][j]))
            ultimo = base
            out = base
            if not a.sin_capas:
                cf = capa(fondo, j)
                if cf is not None and cf.ndim == 3 and cf.shape[2] == 4:
                    mprev = matte(base, mprev); out = componer_fondo(base, cf, mprev)
                else: mprev = None
                out = componer(out, capa(frente, j))
            enc.stdin.write(out.tobytes())
        fuente.close()
        print(f"  {s['id']} listo" + (f" (se repitió {faltantes} cuadro)" if faltantes else ""), flush=True)
    for i in range(max(PLAN["video_frames"], f0), f1):                    # cierre institucional (sobre el último cuadro)
        out = ultimo if a.sin_capas else componer(componer(ultimo, capa(fondo, i)), capa(frente, i))
        enc.stdin.write(out.tobytes())
    enc.stdin.close(); enc.wait()
    print("ok", a.salida)

if __name__ == "__main__":
    main()
