import sys
from PIL import Image
out, fs = sys.argv[1], sys.argv[2:]; w, h = 405, 720
s = Image.new('RGB', (w * len(fs), h))
for i, f in enumerate(fs): s.paste(Image.open(f).convert('RGB').resize((w, h)), (i * w, 0))
s.save(out, quality=88)
