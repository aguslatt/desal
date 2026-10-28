"""Control visual de un MP4 final: un cuadro cada N segundos en hojas de contacto (con zonas seguras de Instagram marcadas).
uso: python3 -I tools/qa_frames.py entrega/<archivo>.mp4 salida_prefijo [cada_s=1.0] [safe=1]"""
import subprocess, sys, os
from PIL import Image, ImageDraw
src, pref = sys.argv[1], sys.argv[2]
step = float(sys.argv[3]) if len(sys.argv) > 3 else 1.0
safe = (sys.argv[4] != "0") if len(sys.argv) > 4 else True
dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", src]))
tmp = f"{pref}_tmp"; os.makedirs(tmp, exist_ok=True)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-vf", f"fps=1/{step},scale=300:534", f"{tmp}/f%03d.png"], check=True)
fs = sorted(os.listdir(tmp))
per = 16
for k in range(0, len(fs), per):
    chunk = fs[k:k + per]
    cols = 8; rows = (len(chunk) + cols - 1) // cols
    s = Image.new("RGB", (cols * 300, rows * 534), (30, 30, 30))
    for i, f in enumerate(chunk):
        im = Image.open(f"{tmp}/{f}").convert("RGB"); d = ImageDraw.Draw(im)
        if safe:
            for y in (262, 1580): d.line([(0, y * 534 // 1920), (300, y * 534 // 1920)], fill=(0, 200, 255), width=1)
        d.text((6, 6), f"{(k + i) * step:.1f}s", fill=(255, 0, 0))
        s.paste(im, ((i % cols) * 300, (i // cols) * 534))
    s.save(f"{pref}_{k // per}.png")
print("hojas:", (len(fs) + per - 1) // per, "duración", dur)
