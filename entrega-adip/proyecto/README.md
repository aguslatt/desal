# EQUIPO ADIP · "Admisiones 2027" — proyecto editable

Pieza vertical 9:16 (1080 × 1920, 30 fps, H.264 + AAC) editada a partir de `andy1.mov` (4K HDR, 50 s).
Todo el montaje es código y texto: se puede cambiar un título, un tiempo o un color y volver a renderizar.

## Dónde se edita cada cosa

| Quiero cambiar… | Archivo |
|---|---|
| Cortes, reencuadres (planos abiertos / medios / cercanos) y movimiento de cámara | `montaje.json` → `segmentos` |
| Subtítulos (texto y tiempos; `*así*` marca palabra clave) | `montaje.json` → `subtitulos` |
| Textos y tiempos de títulos, etiquetas de personas, terapias, contacto y cierre | `montaje.json` → `graficos` |
| Efectos de sonido (qué y cuándo) | `montaje.json` → `sfx` |
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
  Protagonista por composición: naranja (apertura y cierre), magenta (Rehabilitación: etiquetas de terapias y de Lu), violeta (contacto y "orientación a padres"), amarillo (palabras clave).
- **Logo:** el PNG original entregado, sin modificar, solo recortado al área útil + espacio de protección (altura de la "E" de EQUIPO). Se usa únicamente sobre fondo gris claro.
- **Formas:** puntos (las "cabezas" del logo) y trazos gruesos de terminación redonda; la cinta usa el degradé del logo en su orden (violeta → magenta → naranja → amarillo → verde).

## Decisiones técnicas

- El original es HLG/HDR (BT.2020): se convierte a SDR BT.709 para que se vea bien en todos los celulares.
- Balance de blancos **medido**: paredes y techos tenían la misma dominante (R/G ≈ 1,06 · B/G ≈ 0,935) en exterior e interior, así que una sola corrección unifica ambos ambientes. Las pieles se doman con un control selectivo de naranjas.
- Reencuadres digitales sobre el 4K (hasta ~1,5×) sin perder resolución; cada reencuadre queda dentro de un único plano del material original.
- Cortes propios solo en pausas reales de la voz (detectadas por energía de audio, no por la transcripción).
- Texto detrás de la persona (recorte de retrato) solo donde el recorte es limpio (Andy sola, en el exterior). En el pasillo el recorte falla y no se usa.
- Audio: voz limpia y protagonista; la música queda ≈ 20 dB por debajo de la voz mientras se habla; efectos muy puntuales; mezcla a ≈ −16 LUFS. La base musical es **original, sintetizada por código** (sin muestras ni licencias de terceros).

## Para confirmar con el equipo

1. Subtítulos con dudas de audición: *"¡Bienvenidas!"* y *"Y una consulta, Lu,"*.
2. Rol de Andy (solo se muestra su nombre porque el audio no lo dice).
3. Datos de contacto: el cierre muestra solo `equipoadip.com.ar` y `@equipoadip` (tomados del Manual de Identidad). Mail, WhatsApp y teléfonos se muestran como **iconos** sin números porque el video indica que están en la descripción.
4. Si hay logo vectorial (SVG/AI/PDF) o versión negativa, reemplazar `assets/logo-equipo-adip.png`.

## Créditos y licencias

Montserrat (SIL OFL) · Feather Icons (MIT) · MODNet (Apache-2.0) · YuNet/OpenCV (MIT) · Whisper (MIT, solo para la transcripción de trabajo).
