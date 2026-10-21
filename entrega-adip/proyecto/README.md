# EQUIPO ADIP · "Admisiones 2027" — proyecto editable

Pieza vertical 9:16 (1080 × 1920, 30 fps, H.264 + AAC, 43,0 s) editada a partir de `andy1.mov` (4K HDR, 50 s).
Video final: `salida/EquipoADIP_Admisiones2027_9x16.mp4` · versión liviana para WhatsApp: `salida/EquipoADIP_Admisiones2027_9x16_liviano.mp4`.
Todo el montaje es código y texto: se puede cambiar un título, un tiempo o un color y volver a renderizar.

## Dónde se edita cada cosa

| Quiero cambiar… | Archivo |
|---|---|
| Cortes, reencuadres (planos abiertos / medios / cercanos) y movimiento de cámara | `montaje.json` → `segmentos` |
| Subtítulos (texto y tiempos; `*así*` marca palabra clave) | `montaje.json` → `subtitulos` |
| Textos, íconos y tiempos de títulos, etiquetas, panel de terapias / orientación / contacto / detalle y cierre | `montaje.json` → `graficos` |
| Efectos de sonido (tipo y momento: impacto, toque, barrido, deslizar, acento, lavado, transicion, campana) | `montaje.json` → `sfx` |
| Diseño y animación de los gráficos (tipografía, colores, formas, easing) | `overlay.html` |
| Corrección de color (balance de blancos, saturación, curva) | `herramientas/compositor.py` (constantes `GAINS`, `LUT`, `SAT_*`) |
| Música, mezcla, niveles | `herramientas/audio.py` |

Todos los tiempos de `montaje.json` están en **segundos del video original**; el sistema los convierte solo a la línea de tiempo final.

## Cómo volver a generar el video

```bash
pip install numpy scipy opencv-python-headless onnxruntime playwright pillow
# necesita ffmpeg (con zscale), Chromium (Playwright) y dos modelos pequeños:
#   MODNet  (recorte de personas, Apache-2.0)  -> MODELO_RECORTE=/ruta/modnet.onnx
#   YuNet   (detección de caras, MIT)           -> MODELO_CARAS=/ruta/yunet.onnx
SRC=/ruta/andy1.mov MODELO_CARAS=/ruta/yunet.onnx MODELO_RECORTE=/ruta/modnet.onnx ./build.sh
```

Etapas (cada una se puede repetir sola): `analisis_caras.py` → `plan_montaje.py` → `render_overlay.py` → `compositor.py` → `audio.py` → unión.
`herramientas/revisar.py` compone cuadros sueltos para revisar el diseño; `herramientas/verificar.py` mide el resultado final.

## Identidad ADIP aplicada

- **Tipografía:** Montserrat (Regular 400, Medium 500, SemiBold 600, Bold 700), incluida en `assets/fonts/` (licencia SIL OFL).
- **Colores:** exactamente los del Manual de Identidad Visual (pág. 6): `#FE801C` naranja · `#ED2995` magenta · `#8A00B7` violeta · `#FFCB01` amarillo · `#94C920` verde · `#EFEFEF` gris · `#000000` negro.
  Protagonista por composición: naranja (apertura y cierre), magenta (panel de terapias y etiqueta de Luciana), violeta ("Orientación a padres" y WhatsApp), verde (contacto), amarillo (detalle y palabras clave).
- **Logo:** el PNG original entregado, sin modificar, solo recortado al área útil + espacio de protección (altura de la "E" de EQUIPO). Se usa únicamente sobre fondo gris claro.
- **Formas:** puntos (las "cabezas" del logo) y trazos gruesos de terminación redonda; la cinta usa el degradé del logo en su orden (violeta → magenta → naranja → amarillo → verde).

## Decisiones técnicas

- El original es HLG/HDR (BT.2020): se convierte a SDR BT.709 para que se vea bien en todos los celulares.
- Balance de blancos **medido**: paredes y techos tenían la misma dominante (R/G ≈ 1,06 · B/G ≈ 0,935) en exterior e interior, así que una sola corrección unifica ambos ambientes. Las pieles se doman con un control selectivo de naranjas.
- Reencuadres digitales sobre el 4K (hasta ~1,5×) sin perder resolución; cada reencuadre queda dentro de un único plano del material original.
- Cortes propios solo en pausas reales de la voz (detectadas por energía de audio, no por la transcripción).
- Texto detrás de la persona (recorte de retrato) solo donde el recorte es limpio (Andy sola, en el exterior). En el pasillo el recorte falla y no se usa.
- Audio en tres capas: voz limpia y protagonista; música con pulso e intensidad por escena (más presente en apertura y cierre, contenida mientras se habla) con acentos de acorde en algunos cambios visuales; efectos cortos ligados a movimientos concretos (impacto de apertura, deslizamiento de panel, acento por grupo de servicios, transición de la expansión naranja). Música y efectos bajan solos bajo la voz (sidechain). La base musical es **original, sintetizada por código** (sin muestras ni licencias de terceros).

## Para confirmar con el equipo

1. Subtítulos con dudas de audición: *"¡Bienvenidas!"* y *"Y una consulta, Lu,"*. Los subtítulos transcriben lo que se dice ("Lu"); la etiqueta en pantalla dice "Luciana".
2. Rol de Andy (solo se muestra su nombre porque el audio no lo dice). Ortografía **Andy**: surge del nombre del archivo (`andy1.mov`), del título en Drive y de lo indicado por el equipo; la transcripción automática escribe "Andi" por fonética.
3. Datos de contacto mostrados (confirmados por el equipo): rehabilitacion@equipoadip.com.ar · +54 9 11 2658-7671 · fijos 4326-4141 / 4326-2960 / 4326-3409. El video muestra solo WhatsApp (principal), mail y web/redes; los teléfonos fijos conviene dejarlos en la descripción. La web y las redes (`equipoadip.com.ar`, `@equipoadip`) salen del Manual de Identidad.
4. Si hay logo vectorial (SVG/AI/PDF) o versión negativa, reemplazar `assets/logo-equipo-adip.png`.

## Créditos y licencias

Montserrat (SIL OFL) · Feather Icons (MIT) · MODNet (Apache-2.0) · YuNet/OpenCV (MIT) · Whisper (MIT, solo para la transcripción de trabajo).

## Estructura de la pieza (43 s)

0–7,6 s apertura "Admisiones 2027" con Andy · 8,6 s primeros servicios · panel compartido que cambia de color (magenta terapias → violeta orientación a padres → verde contacto → amarillo detalle) · expansión naranja y placa final: Agendá tu admisión 2027 · logo · WhatsApp · mail y web.
