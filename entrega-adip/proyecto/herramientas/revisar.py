#!/usr/bin/env python3
"""Revisión de diseño: compone cuadros sueltos (video + gráficos) en instantes del VIDEO ORIGINAL.
Uso: revisar.py VIDEO t1,t2,...  [carpeta_salida]   -> salida/revision/rev_XXX.XX.png + hoja.png"""
import sys, json, subprocess, shutil, os
from pathlib import Path
AQUI = Path(__file__).resolve().parent.parent
PLAN = json.loads((AQUI / "plan.json").read_text()); FPS = PLAN["fps"]
def s2o(ts):
    for s in PLAN["segs"]:
        if s["src_in"] - 1e-4 <= ts <= s["src_out"] + 1e-4: return (s["out_start_f"] + (ts - s["src_in"]) * FPS) / FPS
    for s in PLAN["segs"]:
        if ts < s["src_in"]: return s["out_start_f"] / FPS
    return PLAN["video_frames"] / FPS
src, crudos = sys.argv[1], sys.argv[2].split(",")
sal = Path(sys.argv[3]) if len(sys.argv) > 3 else AQUI / "salida" / "revision"
shutil.rmtree(sal, ignore_errors=True); (sal / "capas" / "frente").mkdir(parents=True)
outs = [round(float(x[1:]), 4) if x.startswith("o") else round(s2o(float(x)), 4) for x in crudos]   # "o50.2" = tiempo de la pieza final
# 1) capas gráficas en los cuadros pedidos
import importlib.util
spec = importlib.util.spec_from_file_location("ro", AQUI / "render_overlay.py"); ro = importlib.util.module_from_spec(spec); spec.loader.exec_module(ro)
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b, pg = ro.abrir(p)
    for to in outs:
        i = int(round(to * FPS))
        res = pg.evaluate("t => renderAt(t)", i / FPS)
        for capa in ("fondo", "frente"):
            if res[capa]:
                (sal / "capas" / capa).mkdir(parents=True, exist_ok=True)
                pg.evaluate("c => document.body.dataset.capa = c", capa)
                pg.screenshot(path=str(sal / "capas" / capa / f"f_{i:05d}.png"), omit_background=True)
    b.close()
# 2) video + capas
subprocess.run(["python3", str(AQUI / "herramientas" / "compositor.py"), "--src", src, "--capas", str(sal / "capas"),
                "--cuadros", ",".join(str(o) for o in outs), "--salida", str(sal)], check=True)
from PIL import Image
fs = sorted(sal.glob("cuadro_*.png"), key=lambda f: float(f.stem.split("_")[1]))
cols = min(6, len(fs)); rows = (len(fs) + cols - 1) // cols
W, H = 360, 640
hoja = Image.new("RGB", (cols * W, rows * H), "white")
for k, f in enumerate(fs): hoja.paste(Image.open(f).convert("RGB").resize((W, H)), ((k % cols) * W, (k // cols) * H))
hoja.save(sal / "hoja.png"); print("ok", len(fs), "cuadros ->", sal / "hoja.png")
