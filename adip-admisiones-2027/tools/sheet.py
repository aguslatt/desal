"""uso: python3 -I tools/sheet.py salida.png ancho_tile archivo1 archivo2 ... → contact sheet con la hora en cada tile"""
import sys, os
from PIL import Image, ImageDraw
out, tw, files = sys.argv[1], int(sys.argv[2]), sys.argv[3:]
th = tw * 16 // 9
cols = min(len(files), max(1, 2400 // tw))
rows = (len(files) + cols - 1) // cols
s = Image.new("RGB", (cols * tw, rows * th), (30, 30, 30))
for i, f in enumerate(files):
    im = Image.open(f).convert("RGB").resize((tw, th), Image.LANCZOS)
    ImageDraw.Draw(im).text((8, 8), os.path.basename(f).replace(".png", ""), fill=(255, 0, 0))
    s.paste(im, ((i % cols) * tw, (i // cols) * th))
s.save(out)
