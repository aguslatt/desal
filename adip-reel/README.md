# «El mensaje que borraste» — Reel Equipo ADIP · Día Mundial de la Salud Mental (10/10)

Reel vertical **1080 × 1920 · 30 fps · 35 s (1050 f)**, hecho con [Remotion](https://www.remotion.dev) 4.0.533.
Concepto: los mensajes que escribimos cuando necesitamos compañía… y borramos. En ADIP se puede empezar justo por ese «no sé por dónde empezar».

> **Estado: versión de REVISIÓN.** Falta material real (ver «Pendientes» abajo). Escena 3 = tipografía animada, escena 4 = composiciones gráficas de marca,
> audio = sintetizado por código, sin locución. Todo está preparado para reemplazarlo sin tocar el código de animación.

## Entregables (`entrega/`)
| Archivo | Qué es |
|---|---|
| `el-mensaje-que-borraste.mp4` | Video final (H.264 yuv420p + AAC 48 kHz estéreo) |
| `portada.png` | Portada independiente 1080 × 1920 |
| `locucion.txt` | Texto de locución listo para grabar |

## Abrir la previsualización
```bash
cd adip-reel
npm install
npm run studio          # abre Remotion Studio (http://localhost:3000)
```
Composiciones: `Reel` (video completo), `Cover` (portada) y, en la carpeta **Escenas**, cada escena por separado
(`Chat`, `Escena1-Inicio`, `Escena2-Mensajes`, `Escena3-Giro`, `Escena4-Acompanamiento`, `Escena5-Cierre`, `Hilo`).

> Si Remotion no puede descargar su Chrome (red restringida) apuntá a un Chromium local:
> `export REMOTION_BROWSER_EXECUTABLE=/ruta/a/chrome` (p. ej. `/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell`).

## Volver a exportar
```bash
npm run render          # → out/el-mensaje-que-borraste.mp4
npm run still:cover     # → out/portada.png
npm run audio           # regenera los 4 stems sintetizados (¡pisa public/audio/*.wav!)
npm run audio:verify    # mide sincronía tecla↔imagen, niveles y mezcla
npm run typecheck && node scripts/check-script.mjs   # tipos + guion literal contra el brief
scripts/shots.sh Reel /tmp/shots 0,150,380,700,1049   # fotogramas PNG para revisar
```

## Estructura
```
src/config/      ← CONFIGURACIÓN CENTRAL
  script.ts        guion literal (textos del brief) — único lugar donde viven los textos
  timeline.ts      tiempos (fotogramas), hitos de sonido, rutas de audio, MEDIA (videos/fotos reales) y VOICEOVER
  layout.ts        zona segura, campo de redacción, carriles del hilo gráfico
  brand.ts         paleta oficial (manual), tipografía Montserrat, logo
  typing.ts        cronograma de tipeo/borrado (lo usan la animación Y el audio de teclado)
src/scenes/      ← una escena por archivo (componentes editables en el Studio)
src/components/  ← piezas por escena (chat, turn, companion, closing, cover, thread, MediaSlot)
src/lib/         ← fuentes locales, ancla del cursor, helpers
public/          ← fonts/Montserrat-VF.ttf (OFL), brand/logo-equipo-adip.png, audio/*.wav (stems de 35 s), media/ (para videos/fotos)
docs/            ← brief original, dirección de arte/contrato, notas de audio
```
Todas las animaciones dependen de los fotogramas de Remotion (`useCurrentFrame`); no hay CSS `transition/animation`.
Fuente Montserrat cargada desde archivo local antes de renderizar.

## Cambiar recursos
- **Escena 3 con la grabación real** de una persona del equipo: copiá el video a `public/media/` y en `src/config/timeline.ts`
  poné `MEDIA.turnVideo = "media/mi-video.mp4"` (o pasá la prop `videoSrc` a `Scene3Turn`). Los subtítulos de la misma frase se muestran solos; ajustá `TURN_TIMING` a la grabación.
- **Escena 4 con planos reales** (2–3 videos/fotos autorizados): `MEDIA.companionClips = ["media/a.mp4", "media/b.mp4", "media/c.jpg"]`. Cada `null` deja la composición gráfica de marca.
- **Locución**: grabar `entrega/locucion.txt`, guardarla como `public/audio/locucion.wav`, poner `VOICEOVER.enabled = true` en `timeline.ts` y alinear los hitos (`TURN_TIMING`, `COMPANION_TIMING`) a la duración real del audio. No acelerar las voces: se mueven los cortes.
- **Música**: reemplazar `public/audio/musica.wav` por la pista licenciada (35 s, 48 kHz). **No** correr `npm run audio` después (sobrescribe los stems).
- **Textos**: solo en `src/config/script.ts` (después correr `node scripts/check-script.mjs`).

## Pendientes antes de publicar
1. Grabación real de una persona del equipo para la escena 3 (frase exacta, a cámara) y 2–3 planos reales/autorizados del equipo o consultorios para la escena 4.
2. Locución (grabación real; no se clonó ninguna voz y no había síntesis autorizada). **Confirmar la pronunciación de «ADIP»** con el equipo antes de grabar.
3. Música instrumental con permiso de uso (la actual es una pista original sintetizada, provisoria). Los stems no se escucharon con auriculares/parlante de celular: revisar a oído.
4. Logo: se usa el PNG transparente aportado (734 × 326). Si existe SVG/PNG de mayor resolución, reemplazar `public/brand/logo-equipo-adip.png` (mismas proporciones).
