# «El mensaje que borraste» — Reel Equipo ADIP · Día Mundial de la Salud Mental (10/10)

Reel vertical **1080 × 1920 · 30 fps · 53 s (1590 f)**, hecho con [Remotion](https://www.remotion.dev) 4.0.533 (versión **v3**, corregida a partir
de las observaciones sobre la versión anterior; brief completo en `docs/brief-v3.txt`).

Alguien le escribe a una amiga que no está bien, escribe y borra dos veces porque le cuesta decirlo, y finalmente **envía**
«No sé por dónde empezar…». Recibe «Estoy acá. Te escucho.». Ese texto se transforma en «Podés empezar por ahí. / Por no saber cómo empezar.»
mientras el naranja se retira y aparece una situación de escucha entre dos personas, que llega a la firma de Equipo ADIP.

> **Estado: versión de REVISIÓN.** No hay locución ni música licenciada: el audio está **sintetizado por código** (ver `docs/AUDIO.md`) y
> el video se entiende por completo sin sonido. Todo está preparado para reemplazar el audio sin tocar la animación.

## Entregables (`entrega/`)
| Archivo | Qué es |
|---|---|
| `el-mensaje-que-borraste.mp4` | Video de revisión: audio provisional sintetizado y sin locución (H.264 yuv420p BT.709 + AAC 48 kHz estéreo) |
| `portada.png` | Portada independiente 1080 × 1920 (misma dirección visual; lo importante queda en la franja 4:5 central) |
| `locucion.txt` | Texto de locución listo para grabar, con las marcas de tiempo del video |

## Abrir la previsualización
Requiere **Node ≥ 22.18** (los scripts `npm run audio`, `npm run audio:verify` y `scripts/check-*.mjs` ejecutan `.ts`/`.mjs` directamente, sin compilar) y **ffmpeg/ffprobe** en el PATH para `npm run audio:verify` y `scripts/extract-frames.sh`.
```bash
cd adip-reel
npm install
npm run studio          # abre Remotion Studio (http://localhost:3000)
```
Composiciones: **`Reel`** (video completo con audio), **`Historia`** (solo imagen, más rápida de revisar), **`Cover`** (portada) y piezas sueltas:
`Chat` (el chat a pantalla completa), `Escucha` (la pareja de escucha sola) y `Textos` (capa de textos y logo).

> Si Remotion no puede descargar su Chrome (red restringida) apuntá a un Chromium local:
> `export REMOTION_BROWSER_EXECUTABLE=/ruta/a/chrome` (p. ej. `/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell`).

## Volver a exportar
```bash
npm run render          # → entrega/el-mensaje-que-borraste.mp4
npm run still:cover     # → entrega/portada.png
npm run audio           # regenera los 4 stems sintetizados (¡pisa public/audio/*.wav!)
npm run audio:verify    # mide sincronía tecla↔imagen, niveles y mezcla
npm run typecheck       # tipos
node scripts/check-script.mjs && node scripts/check-palette.mjs && node scripts/check-fonts.mjs   # guion literal, paleta ADIP, Montserrat real
scripts/shots.sh Reel /tmp/shots 0,182,612,712,892,1140,1494,1589   # fotogramas PNG para revisar (frames absolutos)
scripts/extract-frames.sh entrega/el-mensaje-que-borraste.mp4 /tmp/f 0,1589   # fotogramas exactos del MP4
```

## Cómo está armado
Escenas planas sobre fondo gris del manual (#EFEFEF) y naranja ADIP (#FE801C) en la transición: chat a pantalla completa → naranja que nace de la
burbuja de respuesta → frases del giro → ilustración de escucha → firma con el logo → cierre. Los textos Montserrat van en capas estables, a la izquierda (x = 120).
```
src/config/      ← CONFIGURACIÓN CENTRAL (fuente única)
  script.ts        guion literal (único lugar donde viven los textos)
  timeline.ts      tiempos (fotogramas) de todas las escenas, hitos de sonido, rutas de audio y VOICEOVER
  layout.ts        zona segura, franjas de texto, ancla de la transición
  brand.ts         paleta oficial (manual), jerarquía tipográfica Montserrat (TYPE), logo
  typing.ts        cronograma de tipeo/borrado carácter por carácter (lo usan el chat y el audio de teclado)
src/chat/        ← el chat de celular (Amiga, «¿Cómo estás?», campo de tamaño fijo, teclado, enviar, borrar, respuesta)
src/illustration/← kit de ilustración liviano (trazo fino de tinta, curvas de crayón abiertas, personas sentadas) y la escena de escucha (README propio)
src/text/        ← textos de las escenas 3–6 (sin adornos: solo tamaño, peso y cortes), logo oficial (layout medido con Montserrat real)
src/story/       ← montaje: transición (naranja + texto que conserva su posición), giro, hilo naranja y cámara vertical de S5→S6
src/Cover.tsx    ← portada
scripts/         ← build-audio.ts, verify-audio.ts, check-script/palette/fonts.mjs, shots.sh, extract-frames.sh
entrega/         ← MP4, portada.png, locucion.txt
public/          ← fonts/Montserrat-VF.ttf (OFL), brand/logo-equipo-adip.png, audio/*.wav (stems de 53 s)
docs/            ← briefs (original, v2, v3), dirección de arte/contrato (DIRECCION-DE-ARTE.md), notas de audio (AUDIO.md)
```
Todas las animaciones dependen de los fotogramas de Remotion (`useCurrentFrame`); no hay CSS `transition/animation`. Todo es determinista
(PRNG sembrado): el mismo fotograma renderiza igual en el Studio y en el render.

## Cambiar cosas
- **Textos:** el contenido vive en `src/config/script.ts` (después `node scripts/check-script.mjs`). Si cambia el largo o el sentido de la firma, el cierre o el texto de acompañamiento, revisá también en `src/text/layout.ts` los cortes de línea (`SIGNATURE_WORD_BREAKS`, `CLOSING_LINES`) y los anchos medidos (`MEASURED`), que se usan para ubicar el logo y verificar márgenes.
- **Tiempos de escritura/borrado:** `MESSAGE_SPECS` en `src/config/timeline.ts`; el chat y el audio de teclado los siguen solos (corré `npm run audio` después).
- **Tiempos de escenas:** `SEND_TIMING`, `TRANSITION_TIMING`, `TURN_TIMING`, `COMPANION_TIMING`, `SIGNATURE_TIMING`, `CLOSING_TIMING` en `timeline.ts` (corré `npm run audio && npm run audio:verify` si cambian los hitos).
- **Personas, ropa y poses:** `src/illustration/` (ver su README); colocación de la pareja en `src/story/geometry.ts`.
- **Locución real:** grabar `entrega/locucion.txt`, exportar un stem de 53,000 s (48 kHz, estéreo, con silencio fuera de las frases: f930, f994 y f1234) como `public/audio/locucion.wav`, poner `VOICEOVER.enabled = true` en `timeline.ts` y
  alinear `TURN_TIMING` / `SIGNATURE_TIMING` a la duración real (no acelerar la voz: se mueven los cortes). Para que la música baje bajo la voz hay que agregar el ducking en `Reel.tsx` (≈ −6 dB mientras habla).
- **Música:** reemplazar `public/audio/musica.wav` por la pista licenciada (53 s, 48 kHz). **No** correr `npm run audio` después (sobrescribe los stems).

## Pendientes antes de publicar
1. **Locución** (grabación real; no se clonó ninguna voz y no había síntesis autorizada). **Confirmar la pronunciación de «ADIP»** con el equipo.
2. **Música** instrumental con permiso de uso (la actual es original y sintetizada, provisoria). Ningún stem se escuchó con auriculares/parlante de celular: revisar a oído.
3. **Logo:** se usa el PNG transparente aportado (734 × 326, «ADIP» coral con textura acuarela), a 734 px como máximo (no se amplía), sin recolorear. Confirmar con ADIP cuál es el vigente y pedir SVG; para cambiarlo, reemplazar `public/brand/logo-equipo-adip.png` manteniendo la relación 734:326 (`LOGO` en `src/config/brand.ts`).
4. **«No tenés que pasar por esto en soledad.»** (escena 4) viene del brief anterior y no figura en el último guion: si el equipo no la quiere, se quita en `COMPANION_TEXT` (`script.ts`).
5. **Referencia de estilo:** la imagen de referencia del cliente se interpretó (figuras mínimas de trazo fino, curvas de crayón abiertas, mucho aire) con la paleta de ADIP; todas las personas son ilustraciones propias dibujadas por código.
