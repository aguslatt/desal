#!/usr/bin/env python3
"""Renderiza las capas gráficas (overlay.html) como PNG con transparencia, cuadro a cuadro.
  render_overlay.py                          -> todas las capas en salida/capas/{fondo,frente}
  render_overlay.py --desde 0 --hasta 14.5   -> solo ese tramo (tiempos de la pieza final)
  render_overlay.py --stills 1.0,12.0 --src  -> cuadros sueltos (tiempos del video original) sobre gris, para revisar diseño"""
import argparse, json, os, sys
from multiprocessing import Process
from pathlib import Path
from playwright.sync_api import sync_playwright

AQUI = Path(__file__).resolve().parent
CHROME = os.environ.get("CHROME_BIN", "/opt/pw-browsers/chromium-1194/chrome-linux/chrome")
MON = json.loads((AQUI / "montaje.json").read_text(encoding="utf-8"))
PLAN = json.loads((AQUI / "plan.json").read_text())
FPS = PLAN["fps"]
FUENTES = ["400 20px Montserrat", "500 20px Montserrat", "600 20px Montserrat", "700 20px Montserrat"]

def s2o(ts):
    for s in PLAN["segs"]:
        if s["src_in"] - 1e-4 <= ts <= s["src_out"] + 1e-4: return (s["out_start_f"] + (ts - s["src_in"]) * FPS) / FPS
    for s in PLAN["segs"]:
        if ts < s["src_in"]: return s["out_start_f"] / FPS
    return PLAN["video_frames"] / FPS

def abrir(p):
    b = p.chromium.launch(executable_path=CHROME, args=["--no-sandbox", "--font-render-hinting=none"])
    pg = b.new_page(viewport={"width": 1080, "height": 1920}, device_scale_factor=1)
    pg.goto((AQUI / "overlay.html").as_uri())
    pg.evaluate("async (f) => { await Promise.all(f.map(x => document.fonts.load(x, 'áéíóúñ¿¡ 0123456789 Aa'))); await document.fonts.ready; }", FUENTES)
    pg.evaluate("([m, p]) => setup(m, p)", [MON, PLAN])
    pg.wait_for_timeout(250)
    return b, pg

def trabajo(f0, f1, out):
    with sync_playwright() as p:
        b, pg = abrir(p)
        for i in range(f0, f1):
            res = pg.evaluate("t => renderAt(t)", i / FPS)
            for capa in ("fondo", "frente"):
                dst = out.parent / capa / f"f_{i:05d}.png"
                if dst.exists(): dst.unlink()
                if res[capa]:
                    pg.evaluate("c => document.body.dataset.capa = c", capa)
                    pg.screenshot(path=str(dst), omit_background=True)
        b.close()

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--desde", type=float, default=0.0); ap.add_argument("--hasta", type=float, default=None)
    ap.add_argument("--stills", default=None); ap.add_argument("--src", action="store_true")
    ap.add_argument("--salida", default=str(AQUI / "salida" / "capas")); ap.add_argument("--gris", action="store_true")
    ap.add_argument("--procesos", type=int, default=4)
    a = ap.parse_args()
    out = Path(a.salida)
    if a.stills:
        out.mkdir(parents=True, exist_ok=True)
        with sync_playwright() as p:
            b, pg = abrir(p)
            if a.gris: pg.add_style_tag(content="html{background:#9a9a9a!important}")
            for t in [float(x) for x in a.stills.split(",")]:
                to = s2o(t) if a.src else t
                pg.evaluate("t => renderAt(t)", to)
                pg.screenshot(path=str(out / f"g_{t:06.2f}.png"), omit_background=not a.gris)
            b.close()
        return
    frente = out / "frente"; frente.mkdir(parents=True, exist_ok=True); (out / "fondo").mkdir(parents=True, exist_ok=True)
    f0 = int(round(a.desde * FPS)); f1 = PLAN["total_frames"] if a.hasta is None else min(int(round(a.hasta * FPS)), PLAN["total_frames"])
    paso = (f1 - f0 + a.procesos - 1) // a.procesos
    ps = [Process(target=trabajo, args=(f0 + k * paso, min(f1, f0 + (k + 1) * paso), frente)) for k in range(a.procesos)]
    [q.start() for q in ps]; [q.join() for q in ps]
    print("capas frente:", len(list(frente.glob("f_*.png"))), "| fondo:", len(list((out / "fondo").glob("f_*.png"))), "| de", f1 - f0, "cuadros")

if __name__ == "__main__":
    main()
