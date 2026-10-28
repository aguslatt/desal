"""Control de calidad automático del entregable (python3 qc.py <mp4>)."""
import json, math, os, subprocess, sys
import numpy as np
import config as C
import render_video as R

mp4 = sys.argv[1]
WORK = R.WORK


def probe(path):
    r = subprocess.run(["ffprobe", "-v", "error", "-count_frames", "-show_entries",
                        "stream=codec_name,width,height,r_frame_rate,nb_read_frames,duration,sample_rate,channels",
                        "-show_entries", "format=duration", "-of", "json", path], capture_output=True, text=True)
    return json.loads(r.stdout)


print("== 1. Formato y duración ==")
o, s = probe(mp4), probe(R.SRC)
for st in o["streams"]:
    print(" salida:", {k: st.get(k) for k in ("codec_name", "width", "height", "r_frame_rate", "nb_read_frames", "duration", "sample_rate", "channels")})
print(" duración salida %.3f s | fuente %.3f s" % (float(o["format"]["duration"]), float(s["format"]["duration"])))
nf_out = [int(st["nb_read_frames"]) for st in o["streams"] if st.get("width")][0]
nf_src = [int(st["nb_read_frames"]) for st in s["streams"] if st.get("width")][0]
print(" fotogramas salida %d | fuente %d -> %s" % (nf_out, nf_src, "OK" if nf_out == nf_src else "DIFIERE"))

print("== 2. Gráficos vs caras (zona de cara + micrófono) ==")
boxes = json.load(open(os.path.join(WORK, "overlay_boxes.json")))
bad = []
for f, bl in boxes:
    t = f / C.FPS
    if R.cut_state(f) and R.cut_state(f)[1] > 0.0:
        continue                          # durante la transición manda la transición
    if t >= C.END_CARD_START or R.reveal_state(f):
        continue
    si = R.shot_at(t)
    sh = C.SHOTS[si]
    x0, y0, w = R.window(t)
    for who, (nx, ny) in (("L", sh[2]), ("R", sh[3])):
        cx, cy = (nx - x0) / w * C.W, (ny - y0) / w * C.H
        fx0, fx1 = cx - .095 / w * C.W, cx + .095 / w * C.W
        fy0, fy1 = cy - .085 / w * C.H, cy + .05 / w * C.H
        for (bx0, by0, bx1, by1) in bl:
            if bx0 < fx1 and bx1 > fx0 and by0 < fy1 and by1 > fy0:
                bad.append((round(t, 2), who, [round(v) for v in (bx0, by0, bx1, by1)]))
print(" fotogramas con solapamiento gráfico/cara:", len(bad))
for b in bad[:20]:
    print("  ", b)

print("== 3. Subtítulos: máximo 2 líneas y texto == transcripción ==")
import subs
bl = subs.build_blocks()
print(" bloques:", len(bl), "| máx líneas:", max(len(b["lines"]) for b in bl))
print(" ancho máx. de línea (px):", max(sum(subs.ImageFont.truetype(C.FONT['bold'], subs.SUB_FONT_PX).getlength(t + ' ') for t, _ in ln) for b in bl for ln in b["lines"]))
