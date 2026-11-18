"""Person cut-outs (alpha webp) for a frame range of public/estim/base.mp4 -> public/estim/subj/sNNNN.webp
usage: estim_matte.py <first> <last>"""
import sys, subprocess, numpy as np
from PIL import Image, ImageFilter
from rembg import remove, new_session
a, b = int(sys.argv[1]), int(sys.argv[2])
ses = new_session("u2net_human_seg")
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", "public/estim/base.mp4", "-vf", f"select='between(n,{a},{b})'", "-vsync", "0", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, 1920, 1080, 3)
prev = None
for i, f in enumerate(fr):
    m = np.asarray(remove(Image.fromarray(f), session=ses, only_mask=True), np.float32)
    m = m if prev is None else 0.65 * m + 0.35 * prev  # light temporal smoothing against flicker
    prev = m
    al = Image.fromarray(np.clip((m - 60) * 255 / 150, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.5))
    im = Image.fromarray(f).convert("RGBA"); im.putalpha(al)
    im.save(f"public/estim/subj/s{a+i:04d}.webp", quality=90)
    if i == 0 or i == len(fr) - 1:
        ys = np.where(np.asarray(al).max(1) > 128)[0]; xs = np.where(np.asarray(al)[ys[0]:ys[0]+60].max(0) > 128)[0]
        print(a + i, "head top y", ys[0], "x", xs[0], xs[-1])
