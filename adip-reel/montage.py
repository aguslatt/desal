import sys
from PIL import Image
fs=sys.argv[2:]; w=432; h=768
s=Image.new('RGB',(w*len(fs),h))
for i,f in enumerate(fs): s.paste(Image.open(f).convert('RGB').resize((w,h)),(i*w,0))
s.save(sys.argv[1])
