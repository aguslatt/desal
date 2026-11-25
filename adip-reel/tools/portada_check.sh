#!/bin/sh
# renders the cover and a sheet: full cover + 3:4 grid crop
npx remotion still src/index.ts EstimPortada estimulacion/salida/ADIP_estimulacion_portada.png --browser-executable=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell --log=error 2>&1 | tail -1
python3 -I -c "
from PIL import Image
im=Image.open('estimulacion/salida/ADIP_estimulacion_portada.png').convert('RGB')
g=im.crop((0,240,1080,1680)); s=Image.new('RGB',(975,960),(255,255,255))
s.paste(im.resize((540,960)),(0,0)); s.paste(g.resize((405,540)),(570,210)); s.save('out/portada_check.jpg',quality=92)"
