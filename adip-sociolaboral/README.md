# Video Andy + Victoria · Programa de Inclusión Sociolaboral y Vida Independiente (Equipo ADIP)

Proyecto Remotion editable, 1080×1920 (9:16), 30 fps.

- `src/cuts.json`: cortes del video original (tiempos en segundos) · `src/timeline.ts`: subtítulos y tiempos clave
- `src/Video.tsx`: escenas · `src/parts.tsx`: ventanas/arcos, trazo, cabezas, subtítulos · `src/ui.ts`: colores del manual
- `scripts/make_audio.py`: música y efectos originales sintetizados + mezcla con la voz
- `public/media/speaker.mp4` NO se versiona (159 MB): se regenera cortando "VIDEO ANDY 4" según `cuts.json` a 1620×2880, 30 fps.

```bash
npm install
npm run studio
npx remotion render src/index.ts Video out/video-silent.mp4 --codec h264 --crf 16
```
