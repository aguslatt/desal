# «El mensaje que borraste» — Reel Equipo ADIP · Día Mundial de la Salud Mental (10/10)

Reel vertical **1080 × 1920 · 30 fps · 38 s (1140 f)**, hecho con [Remotion](https://www.remotion.dev) 4.0.533.
Ilustración editorial animada: alguien le escribe a una amiga que no está bien, escribe y borra porque le cuesta decirlo, y el cursor naranja
se vuelve un trazo que sale del chat y conecta a otras personas hasta llegar a Equipo ADIP.

> **Estado: versión de REVISIÓN.** No hay locución ni música licenciada: el audio está **sintetizado por código** (ver `docs/AUDIO.md`) y
> el video se entiende por completo sin sonido. Todo está preparado para reemplazar el audio sin tocar la animación.

## Entregables (`entrega/`)
| Archivo | Qué es |
|---|---|
| `el-mensaje-que-borraste.mp4` | Video de revisión: audio provisional sintetizado y sin locución (H.264 yuv420p BT.709 + AAC 48 kHz estéreo) |
| `portada.png` | Portada independiente 1080 × 1920 (misma dirección visual) |
| `locucion.txt` | Texto de locución listo para grabar |

## Abrir la previsualización
Requiere **Node ≥ 22.18** (los scripts `npm run audio`, `npm run audio:verify` y `scripts/check-script.mjs` ejecutan `.ts` directamente, sin compilar) y **ffmpeg/ffprobe** en el PATH para `npm run audio:verify` y `scripts/extract-frames.sh`.
```bash
cd adip-reel
npm install
npm run studio          # abre Remotion Studio (http://localhost:3000)
```
Composiciones: **`Reel`** (video completo), **`Cover`** (portada) y, en la carpeta **Piezas**, `Chat` (el chat de celular a pantalla completa)
y `Personajes` (galería del kit de ilustración).

> Si Remotion no puede descargar su Chrome (red restringida) apuntá a un Chromium local:
> `export REMOTION_BROWSER_EXECUTABLE=/ruta/a/chrome` (p. ej. `/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell`).

## Volver a exportar
```bash
npm run render          # → entrega/el-mensaje-que-borraste.mp4
npm run still:cover     # → entrega/portada.png
npm run audio           # regenera los 4 stems sintetizados (¡pisa public/audio/*.wav!)
npm run audio:verify    # mide sincronía tecla↔imagen, niveles y mezcla
npm run typecheck && node scripts/check-script.mjs   # tipos + guion literal contra los briefs
scripts/shots.sh Reel /tmp/shots 0,96,300,409,548,740,1139   # fotogramas PNG para revisar (frames absolutos)
```

## Cómo está armado
Un único **mundo ilustrado con cámara continua**: la persona con el celular → la cámara se acerca hasta que el chat llena la pantalla →
vuelve a alejarse → se abre para mostrar a los demás → encuadre final con el logo. Los textos Montserrat van en una capa de pantalla estable.
```
src/config/      ← CONFIGURACIÓN CENTRAL
  script.ts        guion literal (único lugar donde viven los textos)
  timeline.ts      tiempos (fotogramas), cámara, hitos de sonido, rutas de audio y VOICEOVER
  layout.ts        zona segura, franjas de texto, composición final (logo, fecha)
  brand.ts         paleta oficial (manual), tipografía Montserrat, logo
  typing.ts        cronograma de tipeo/borrado (lo usan el chat, las manos de la protagonista Y el audio de teclado)
src/chat/        ← el chat de celular (Amiga, «¿Cómo estás?», campo de escritura, teclado, enviar, borrar)
src/illustration/← kit de ilustración (trazo de tinta, garabato, crayón, rig de figuras) + personajes (docs: src/illustration/README.md)
src/world/       ← World (cámara, papel, personajes, celular, hilo naranja), Overlays (textos), Logo, thread/ (curvas del hilo)
src/Cover.tsx, src/cover/   ← portada
scripts/         ← build-audio.ts, verify-audio.ts, check-script.mjs, shots.sh (fotogramas desde el código), extract-frames.sh (fotogramas exactos del MP4: `scripts/extract-frames.sh entrega/el-mensaje-que-borraste.mp4 /tmp/f 0,1139`)
entrega/         ← MP4, portada.png, locucion.txt
public/          ← fonts/Montserrat-VF.ttf (OFL), brand/logo-equipo-adip.png, audio/*.wav (stems de 38 s)
docs/            ← briefs (original y v2), dirección de arte/contrato, notas de audio
```
Todas las animaciones dependen de los fotogramas de Remotion (`useCurrentFrame`); no hay CSS `transition/animation`. Todo es determinista
(PRNG sembrado): el mismo fotograma renderiza igual en el Studio y en el render.

## Cambiar cosas
- **Textos:** solo en `src/config/script.ts` (después `node scripts/check-script.mjs`).
- **Tiempos de escritura/borrado:** `MESSAGE_SPECS` en `src/config/timeline.ts`; el chat, las manos y el audio de teclado los siguen solos (corré `npm run audio` después).
- **Cámara:** `CAMERA_TIMING` en `timeline.ts` y los encuadres en `src/world/stage.ts` / `camera.ts`.
- **Personas, ropa y poses:** `src/illustration/` (ver su README) y `src/illustration/characters/`; posiciones del reparto en `src/world/stage.ts`.
- **Locución real:** grabar `entrega/locucion.txt`, exportar un stem de 38,000 s (48 kHz, estéreo, con silencio fuera de las frases: f488, f548 y f764) como `public/audio/locucion.wav`, poner `VOICEOVER.enabled = true` en `timeline.ts` y
  alinear `TURN_TIMING` / `SIGNATURE_TIMING` a la duración real (no acelerar la voz: se mueven los cortes). Para que la música baje bajo la voz hay que agregar el ducking en `Reel.tsx` (≈ −6 dB mientras habla).
- **Música:** reemplazar `public/audio/musica.wav` por la pista licenciada (38 s, 48 kHz). **No** correr `npm run audio` después (sobrescribe los stems).

## Pendientes antes de publicar
1. **Locución** (grabación real; no se clonó ninguna voz y no había síntesis autorizada). **Confirmar la pronunciación de «ADIP»** con el equipo.
2. **Música** instrumental con permiso de uso (la actual es original y sintetizada, provisoria). Ningún stem se escuchó con auriculares/parlante de celular: revisar a oído.
3. **Logo:** se usa el PNG transparente aportado (734 × 326, «ADIP» coral con textura acuarela), que difiere del logo que dibuja el manual (todo gris, raster chico). Confirmar con ADIP cuál es el vigente y pedir SVG; para cambiarlo, reemplazar `public/brand/logo-equipo-adip.png` manteniendo la relación 734:326 (`LOGO` en `src/config/brand.ts`).
4. **Referencia de estilo:** la imagen de referencia del cliente se interpretó (figuras mínimas de trazo fino, curvas de crayón que conectan, mucho aire) con la paleta de ADIP; todas las personas son ilustraciones propias dibujadas por código.
