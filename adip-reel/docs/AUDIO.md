# Audio del reel v3 — «El mensaje que borraste» (53 s)

> **Estado: PROVISORIO (versión de revisión, sintetizado por código).** Los cuatro stems de `public/audio/` se generan con
> `scripts/build-audio.ts` y sirven para cerrar la edición con sonido sincronizado. Se pueden reemplazar, uno por uno, por
> **música licenciada** y/o **grabación real** (teclado, ambiente de consultorio, locución) sin tocar la animación (ver
> «Reemplazar»). Sin locución (`VOICEOVER.enabled = false`): el sentido completo se entiende sin sonido. **Nadie escuchó
> todavía estos stems**: todo lo de abajo son comprobaciones objetivas (números y espectrogramas); conviene una escucha humana
> (auriculares y parlante de celular) antes de publicar.

## Origen y licencias

- **100 % sintetizado por código** en `scripts/build-audio.ts`: ruido pseudoaleatorio sembrado, osciladores (aditivos y FM),
  filtros biquad, envolventes y reverb de Schroeder/Freeverb. **Sin samples, sin bancos de sonidos, sin librerías ni dependencias
  de audio de terceros.** No queda ningún permiso de terceros pendiente.
- **Determinista:** PRNG `mulberry32` con semilla fija por stem (`src/lib/rng.ts`). Regenerar produce archivos idénticos byte a
  byte (comprobado con `md5sum` en dos corridas).
- Los tiempos salen de `src/config/timeline.ts` (`SFX_CUES`, `SEND_TIMING`, `COMPANION_TIMING`, `MESSAGE_SPECS`) y las teclas de
  `src/config/typing.ts` (`KEY_EVENTS`): si cambia el cronograma, se regenera y el audio sigue alineado. Única dependencia fuera
  de `src/config`: el período de rebote de los tres puntos (21 f, `THREAD_FX.dotsPeriod` en `src/chat/geometry.ts`), copiado en
  `build-audio.ts` y `verify-audio.ts` (si el chat lo cambia, actualizar ambos).

## Cómo regenerar y verificar

```bash
npm run audio          # = node scripts/build-audio.ts   (≈20 s) → public/audio/*.wav
npm run audio:verify   # = node scripts/verify-audio.ts  (≈25 s; requiere ffmpeg/ffprobe en el PATH)
```

Variables opcionales: `AUDIO_CHECK_DIR=<carpeta>` (espectrogramas y mezcla de prueba de la verificación; por defecto
`<tmp>/adip-audio-check`), `AUDIO_VERBOSE=1` (tabla de las 128 pulsaciones y curvas de novedad armónica),
`AUDIO_DUMP_LAYERS=<carpeta>` (en `npm run audio`: escribe además las capas de la música —piano, pad, bajo, sub, reverb—).

Formato de salida (los 4 archivos): **WAV PCM 16-bit, 48 kHz, estéreo, exactamente 53,000 s (2 544 000 muestras = 1590 f)**.
El fotograma `f` del reel cae en la muestra `f·1600`: los stems entran en `Reel.tsx` tal cual, sin `trimBefore` ni desfasajes.
Comprobado de punta a punta con Remotion 4.0.533: un render solo de audio (`dev/audio/entry.tsx`, mismos `<Audio>` y volúmenes
de `Reel.tsx`; `npx remotion render dev/audio/entry.tsx AudioTest out.wav --codec=wav --config=dev/audio/remotion.config.ts`)
dura 53,000 s, **desfase 0 muestras**, cada pista renderizada sola es idéntica al stem (diferencia < −200 dB) y la mezcla
coincide con la simulada de `verify-audio.ts` a −48…−75 dB (Remotion aplica el volumen por fotograma y la simulación por muestra).

## Línea de tiempo sonora

| Fotogramas | Tiempo | Qué suena |
|---|---|---|
| 0 – 118 | 0 – 3,9 s | **solo ambiente** (aire de habitación, audible desde el f0); primer plano del chat, nada más |
| 118 – 612 | 3,9 – 20,4 s | **teclado** sincronizado con la escritura de M1 y M2 (se sostienen ≈ 3 s: teclado en silencio digital) y los **dos borrados** (ráfagas de 27 y 25 retrocesos en f272–312 y f478–518), luego M3 (f534–612) |
| **612 – 702** | **20,4 – 23,4 s** | **PAUSA de la duda**: ni una tecla, ni sfx, ni música. Solo aire; el aire «se abre» (apenas). El teclado **no vuelve a sonar** hasta el final |
| 702 – 756 | 23,4 – 25,2 s | ENVIAR (clic suave, f702) y la burbuja enviada (swoosh corto, f712; asentamiento en f742) |
| 756 – 790 | 25,2 – 26,3 s | «Amiga escribe»: pop + tics suaves de los tres puntos |
| **790** | **26,33 s** | **llega «Estoy acá. Te escucho.»**: nota cálida tipo gota (Fa#5) y **entra la música** (swell de 1,8 s); el aire se aquieta |
| 790 – 1590 | | música en compases de 105 f (cambios armónicos en 790, 895, 1000, 1105, 1210, 1315, 1420, 1525) con los acentos de `SFX_CUES` |
| 1525 – 1590 | 50,8 – 53 s | resolución calma (Re mayor 9) que se desvanece sin corte hasta el último fotograma |

## Stems

| Stem | Qué es | Pico | RMS | Sonoridad (stem solo) |
|---|---|---|---|---|
| `ambiente.wav` | Aire de habitación: ruido marrón/rosa filtrado + banda de «aire» (≈1–3 kHz, sin siseo agudo); nivelado a ±0,5 dB; entra en 30 ms (anti-clic) y sale en 0,6 s | −17,7 dBFS | **−32,5 dBFS** | −30,5 LUFS |
| `teclado.wav` | 128 pulsaciones exactas (una por `KEY_EVENTS`) + «arrastre» del borrado; silencio digital entre ellas y **desde f616 hasta el final** | −5,8 dBFS | −34,5 dBFS | −25,3 LUFS |
| `musica.wav` | Piano eléctrico/felt suave + pad + bajo + sub, con reverb sintética; **silencio digital hasta f790** | **−8,5 dBFS** | −21,4 dBFS | −16,3 LUFS |
| `sfx-hilo.wav` | Acentos sutiles en los hitos de `SFX_CUES` (tabla de abajo); **silencio digital hasta f702** | −13,4 dBFS | −37,8 dBFS | −29,3 LUFS |

### ambiente.wav
- Fuente: ruido marrón (común a ambos canales: «una sola sala») + marrón/rosa independientes por canal, pasa-bajos que respira
  lento (cutoff 400–760 Hz), sin graves < 80 Hz, más una banda de «aire» (BP 1,5 kHz, LP 2,6 kHz; > 3 kHz queda < −65 dBFS).
- **Nivel:** −32,5 dBFS RMS (v2: −34,5; algo más presente para que el gancho no arranque «mudo» en parlantes de celular; en la
  mezcla ×0,8 → −34,5). El RMS de cualquier ventana de 1 s queda entre −33,8 y −30,3 dBFS: nunca hay zonas «muertas».
- **Evolución (única, apenas perceptible):**
  1. **Pausa de la duda (f612 → f702):** el aire se abre durante 2 s (cutoff +380 Hz, banda de aire más presente, la sala se
     ensancha un poco): **+1,64 dB** de nivel, +2,6 dB en 1–3 kHz, centroide 323 → 363 Hz.
  2. **Calma bajo la respuesta (f790 →):** el aire se aquieta mientras entra la música (cutoff −110 Hz, menos banda de aire, más
     centrado, −1 dB): −1,5 dB respecto de antes de la duda, centroide 279 Hz, 1–3 kHz −4,5 dB. Además `Reel.tsx` baja su volumen a 0,5.

### teclado.wav
- **128 eventos** = 57 letras + 3 mayúsculas + 12 espacios + 4 puntuación + 52 ⌫ (27 en M1 + 25 en M2). Cada evento cae en
  `frame/30 s` (máx. **0,21 ms** de desvío medido a ciegas) y hay **como máximo uno por fotograma**.
- Cada golpe se sintetiza con ruido distinto (nunca la misma muestra repetida): transitorio de ruido pasa-altos (2–3,8 kHz) +
  golpe grave (130–190 Hz con caída de afinación) + «tok» de carcasa (≈0,8–1,3 kHz, para que se oiga en parlantes de celular) +
  mini sala difusa. Nivel, tono y paneo varían por pulsación con el PRNG sembrado.
- **Letras:** tap suave (picos −10 … −6,6 dBFS). El **paneo sigue la columna de la tecla en el QWERTY**; la **fuerza depende de
  la velocidad de tipeo**; la **mayúscula** pesa +1,4 dB; la **última tecla de cada mensaje** cae más asentada.
- **Espacio:** más grave y largo (centroide 159 Hz vs 286 Hz de las letras). **Puntuación** (¿ . ? …): más seca y aguda, con un
  «ting» mínimo (440 Hz).
- **BORRAR (⌫ sostenida) — acción clave del relato, claramente perceptible y sin saturar.** Cada borrado quita 1 carácter por
  fotograma como máximo (≈ 20 retrocesos por segundo, 27 y 25 en 41 f):
  1. primer evento = **tecla hundida**: golpe pesado y claro (≈100–116 Hz, −6,6 / −5,8 dBFS);
  2. los siguientes = **repeticiones** secas con cuerpo, **más graves a medida que avanza el borrado** (mediana −10,4 / −10,8 dBFS);
  3. un **«arrastre»** de fricción suave (ruido de banda 0,5 → 1 kHz) cuya envolvente sigue la densidad de la ráfaga;
  4. último evento = **suelta**: golpe de cierre asentado.
  Medido: RMS de la ráfaga a −2,1 / −2,3 dB del RMS del tipeo del mismo mensaje (ni floja ni saturada: pico de la ráfaga ≤ −5,8 dBFS).
- **Pausa de la duda y del envío:** la última tecla es el «…» del f612; desde ahí hasta el final hay **silencio digital exacto**
  (32,6 s). ENVIAR no suena en el teclado: es un acento de `sfx-hilo`.

### musica.wav
Instrumental cálida y sutil, **silencio digital hasta f790** (primera muestra no nula a 65 ms: el swell parte de cero).
Compás de 105 f (3,5 s); los cambios armónicos caen en **790, 895, 1000, 1105, 1210, 1315, 1420, 1525**. Re mayor, sobria
(I – vi – IV(9) – V(sus→) – I – IV(9) – ii – I):

| Compás | Fotogramas | Acorde (bajo) | Voces del pad | Intención / hito |
|---|---|---|---|---|
| 1 | 790–895 | Dmaj7 (Re) | La2 · Fa#3 · Do#4 | llega la respuesta (790); la música entra suave y escasa |
| 2 | 895–1000 | Bm7 (Si) | La3 · Re4 · Fa#4 | transición del naranja (900) y 1.ª frase (930) |
| 3 | 1000–1105 | Gmaj7(9) (Sol) | Si3 · Re4 · Fa#4 · La4 | 2.ª frase (994): «se abre»; el naranja se retira y entra la ilustración (1056) |
| 4 | 1105–1210 | Asus4 → A (La) | Mi3 · La3 · Re4 → Do#4 | escena de escucha: texto (1100), llega la amiga (1140); **la suspensión resuelve en el gesto (1158)** |
| 5 | 1210–1315 | Dmaj9 (Re) | Fa#3 · La3 · Do#4 · Mi4 | firma (1238) y logo (1248): el acorde más pleno |
| 6 | 1315–1420 | Gmaj7(9) (Sol) | Si3 · Re4 · Fa#4 · La4 | bloque 2 de la firma (1304) y mensaje final (1402) |
| 7 | 1420–1525 | Em9 (Mi) | Sol3 · Si3 · Re4 · Fa#4 | fecha (1454) y composición final estática: melodía sencilla (Re5 → Si4 → Do#5 → La4) |
| 8 | 1525–1590 | Dmaj9 (Re) | Fa#3 · La3 · Do#4 · Mi4 | resolución calma (ii → I) que se desvanece hasta f1590 |

- **Armonía sin batidos:** el pad va en **terceras apiladas** (sin segundas sostenidas en el registro grave: en cada acorde, con
  el bajo y el sub, el par de fundamentales más cercano por debajo de 400 Hz está a ≥ 31 Hz —una tercera menor—; la única segunda,
  la suspensión re → do# del compás 4, se cruza en ≈0,3 s) y el bajo/sub llevan las raíces; el piano solo toca notas del acorde en curso y las del
  final de cada compás pertenecen también al siguiente (o son cortas). Las notas tonales de `sfx-hilo` quedan **libres en el
  pad y el piano de su momento** (Re3 y Fa#3 de las frases, Fa#4+Do#5 de la firma, Re5+La5 del final).
- Capas: piano (arpegios lentos y escasos, 3–6 notas por compás, humanización ±6 ms / ±8 % de velocidad; las notas de cabecera
  de compás quedan exactas, con un «tic» de fieltro de 3–6 kHz que le da definición en parlantes de celular), pad (3 voces
  desafinadas con vibrato lento, una octava más grave que en la v1), bajo (octava sobre el sub, 2.º armónico mínimo) y sub.
  Reverb Freeverb (RT ≈ 2 s, amortiguada, envío sin graves). Limitador de picos a −8,5 dBFS (reducción máxima 3,2 dB).
- **Entrada:** swell de 1,8 s (pad/bajo/sub desde el silencio, piano desde 35 %); `Reel.tsx` suma su rampa de 75 f (790 → 865).
  RMS de la música: −34,5 dBFS en f790–805, −18,0 dBFS en f835–850: ya suena durante la sostenida de la respuesta.
- **Nivel por compás:** parejo (RMS −19,0 … −17,4 dBFS entre el 2.º y el 7.º: rango 1,6 dB).
- **Cierre:** fundido propio de coseno desde f1530 que termina en 0 exacto en la última muestra; `Reel.tsx` suma el suyo (lineal)
  desde `musicOutFrom` (f1530). RMS por tramo: −16,8 (f1525–45) → −20,3 → −26,6 → −42,1 dBFS: monótono, sin corte seco.

### sfx-hilo.wav — hitos (`SFX_CUES`)

Acentos MUY sutiles y cálidos (sin whooshes de meme). Los tonales llevan una reverb corta para que «florezcan». Se oyen todos
sobre la música en su propia banda (tabla (h) de la verificación: ≥ +3 dB; la respuesta, sin música aún).

| Hito | Fotograma | Tiempo | Sonido | Pico de diseño |
|---|---|---|---|---|
| `sendPress` | 702 | 23,40 s | **clic suave** al pulsar ENVIAR (cuerpo ≈300 Hz que baja + «tac» de 1,25 kHz + hálito de ruido) | −21 dBFS |
| `sendFly` | 712 | 23,73 s | **swoosh corto muy suave** (soplo de 0,42 s, 450 → 2100 Hz) + asentamiento mínimo al llegar al hilo (f742, Re5) | −27 / −33 dBFS |
| `indicator` | 756 | 25,20 s | **tics suaves**: «pop» de la burbuja de puntos (La5) y un tic por rebote de punto (Re6 · Mi6 · Fa#6) en f761,3 · 764,4 · 767,6 · 782,3 · 785,4 (el rebote que cae sobre la respuesta se omite) | −29 / −31,5 dBFS |
| `reply` | 790 | 26,33 s | **LLEGADA DE LA RESPUESTA (momento emocional):** una sola nota cálida tipo gota — Fa#5 (tercera de Re mayor), ataque inmediato, ascenso de afinación de 9 % en ≈25 ms, cuerpo una octava abajo y cola de ≈1,5 s. Breve y discreta: la música recién nace bajo ella | −17 dBFS (el más presente) |
| `musicIn` | 790 | | entra la música (no suena en `sfx-hilo`) | |
| `transition` | 900 | 30,00 s | **swell suave** de Si menor (Fa#4 · Si4 · Re5, ataque 0,95 s) mientras el naranja se expande | −24 dBFS |
| `phraseOne` | 930 | 31,00 s | tono grave cálido y breve, Re3 (armónicos 1–3, ataque suave, no campana) | −18,5 dBFS |
| `phraseTwo` | 994 | 33,13 s | ídem, Fa#3 (tercera mayor arriba: «abre») | −19,5 dBFS |
| `reveal` | 1056 | 35,20 s | **soplo suave** (1,5 s, 480 → 2600 Hz) al retirarse el naranja / entrar la ilustración | −26 dBFS |
| `companionText` | 1100 | 36,67 s | «pip» redondo Si5, muy suave | −25 dBFS |
| `friendArrive` | 1140 | 38,00 s | **la silla que rueda** (muy leve, casi imperceptible): ruido 150–700 Hz modulado por el giro de las ruedas (4,4 → 1,2 vueltas/s, desacelera) de f1088 (`friendEnterFrom`) a f1140 + asentamiento de madera mínimo al detenerse | −35 / −32 dBFS |
| `gesture` | 1158 | 38,60 s | cuerda / campanita mínima, dos notas Mi5 → La5 (+0,16 s); coincide con la resolución re → do# de la música | −24 / −26 dBFS |
| `signatureOne` | 1238 | 41,27 s | quinta cálida Fa#4 + Do#5 (la tercera de Re, libre en el pad) | −22,5 dBFS |
| `logoReveal` | 1248 | 41,60 s | **carillón cálido** discreto, arpegio de La mayor La5–Do#6–Mi6–La6 (aditivo, decaimiento ≈ 2 s, sin ataque metálico) | −17,5 … −23 dBFS (pico del stem −13,4) |
| `signatureTwo` | 1304 | 43,47 s | «pip» Re5 | −25 dBFS |
| `finalMessage` | 1402 | 46,73 s | eco de los tonos del giro una octava y media arriba: Re5 + La5 (quinta abierta, decaimiento ≈ 2,4 s) | −21 dBFS |
| `finalDate` | 1454 | 48,47 s | «pip» Si5 | −25 dBFS |
| cierre (compás 8) | 1525 | 50,83 s | eco muy suave del carillón del logo: La5 + Mi6 (quinta y novena de Re mayor 9); no figura en `SFX_CUES` | −27 / −31 dBFS |
| `musicOutFrom` | 1530 | | marca para la música (no suena en `sfx-hilo`) | |

El carillón del logo es el pico del stem (−13,4 dBFS); los demás quedan 2–20 dB por debajo (los más presentes: la respuesta, el swell de la
transición y la 1.ª frase). Los más delicados (silla, tics, pips) quedan por debajo de −25 dBFS en su banda propia.

## Espacio para la voz futura (locución desactivada)

`VOICEOVER.enabled = false`: no hay voz. Para que una voz posterior (frases del giro, firma, mensaje final) no tenga que competir:
- el **pad está una octava más grave** que en la v1, en terceras apiladas, y el piano es escaso y suave en registro medio-grave;
- hay un **«hueco» de ecualización** (campana −4 dB en ≈1,15 kHz, Q 0,6) durante todo el texto en pantalla (se abre recién en el
  último compás, sin texto nuevo);
- la música va **pareja entre compases** (rango 1,6 dB): sin picos de nivel que tapen la voz.

Medido (música sola, f900–f1500): la banda de voz **300–3000 Hz es el 18 % de la energía** (v1: 38 %) y queda en **−25,7 dBFS RMS**
(v1: −24,2); 100–300 Hz concentra el 76 %. En la mezcla (×0,9) son ≈ −26,6 dBFS: ≥ 7 dB bajo una voz a −20 dBFS RMS. Con locución
real, además, se recomienda en `Reel.tsx` bajar la música ≈ 6 dB mientras habla.

**Traducción a parlantes de celular:** por debajo de ~300 Hz un parlante casi no reproduce. Con un pasa-altos de 300 Hz la mezcla
completa queda en −23,8 LUFS (−5,3 LU respecto del rango completo). Es el costo, buscado, de dejar la banda de voz libre: la música
se siente más baja y «de campanitas» en un celular, y los acentos (pips, carillón, gota de la respuesta; todos > 500 Hz) pasan al frente.

## Mezcla y volúmenes

La mezcla final la define `Reel.tsx` (no se tocó). `verify-audio.ts` **lee los `volume={…}` de `src/Reel.tsx`** (los evalúa) y
simula la mezcla; mide con `ffmpeg ebur128` (pico real = true peak; tras un códec AAC 192 kbps el pico no cambia):

| Escenario | Volúmenes | Sonoridad integrada | Pico real |
|---|---|---|---|
| **Reel.tsx actual** | ambiente 0,8 desde el f0 → 0,5 (790 + 60 f) → 0 (últimos 45 f) · teclado 1 · música 0 → 0,9 (790 → 865) → 0 (desde 1530) · sfx 1 | **−18,5 LUFS** (LRA 13,7 LU) | −5,2 dBTP (tras AAC −5,4) |

- Dentro del objetivo (−20 … −16 LUFS integrados) con ≈ 4 dB de margen de pico real sobre −1 dBTP. Sonoridad a corto plazo (S):
  ≈ −25 durante el tipeo, −30 en la ventana de la duda/envío (24 s), −20 al entrar la música y −16/−17 hasta el cierre (el contraste
  aire/teclado ↔ música es intencional).
- Los volúmenes > 1 no existen en `<Audio>`: por eso se usa ≤ 1,0 y no ganancia extra en los stems.

## Verificación (resultado de la última corrida: `npm run audio:verify` → **OK, 96 comprobaciones**)

- **(a) Formato:** los 4 archivos `pcm_s16le · 48 000 Hz · 2 canales · 16 bit · 53,000000 s · 2 544 000 muestras` (ffprobe); `TOTAL_FRAMES = 1590`.
- **(b) Teclado:** detección **ciega** de onsets (máximo móvil de |HP 1,8 kHz| contra el piso previo, robusta al «arrastre» del borrado):
  128 esperados, **128 detectados, 0 espurios, 0 faltantes**; desvío máximo **0,21 ms** (medio 0,06 ms), muy por debajo de ±1 ms. Silencio
  digital exacto fuera de las ventanas de evento y **desde f616 hasta el final (sin teclado entre f612 y el final)**. ⌫: 1 retroceso por
  fotograma (27 y 25 en 41 f), RMS de la ráfaga a −2,1/−2,3 dB del tipeo, ticks con mediana −10,4/−10,8 dBFS, tecla hundida −6,6/−5,8 dBFS
  (≥ 3 dB sobre los ticks), sin saturar. Tipos distinguibles por centroide espectral (espacio < letras < puntuación < ⌫; mayúsculas +2 dB de
  pico). Variación: 1732 pares de pulsaciones aisladas del mismo tipo, correlación máxima 0,92 (ninguna repetida).
- **(c) Picos / clipping / continuidad:** ningún stem toca 0 dBFS (pico máx. −5,8 dBFS en el teclado), 0 muestras al extremo, sin continua,
  **compatibles con mono** (la suma L+R pierde 0,06–0,8 dB; el ambiente, ruido descorrelacionado, 2,0 dB). Sin clics ni discontinuidades en
  ambiente, música y sfx (detector de 2.ª diferencia; los tics son transitorios de diseño: 12,4× < 14×). Todos terminan en 0 exacto.
  **Música: silencio digital hasta f790; sfx: hasta f702 (ENVIAR).** Ambiente: RMS −32,5 dBFS (> −40 desde el primer segundo), «se abre»
  +1,64 dB en la duda y se aquieta −1,5 dB con la respuesta. Cierre de la música monótono hasta f1590.
- **(d) Alineación de sfx:** los 17 hitos arrancan en su fotograma (tonos, pips, tics, clic y carillón: 0,1–5 ms de latencia del detector;
  los soplos y el swell, de ataque lento, nacen en el hito: 10 % del máximo a 0,21 s, 90 % a 1,56 s como se diseñó). La silla que rueda queda a
  −31,9 dBFS en su banda (casi imperceptible), los tics a −32,8 dBFS, los pips a −26 dBFS.
- **(e) Música:** raíz del bajo por compás **D – B – G – A – D – G – E – D** como se diseñó; el cruce entre raíz saliente y entrante cae a +2…+14 f
  del inicio de cada compás; la novedad del croma grave (90–260 Hz) centra los 7 cambios a −4…−1 f del compás (el pad entra ≈0,4 s antes por
  fundido cruzado), 29–57× la mediana estable. Banda de voz 300–3000 Hz: 18 % de la energía, −25,7 dBFS (ver arriba).
- **(f) Mezcla simulada:** −18,5 LUFS integrados, −5,2 dBTP, con los volúmenes de `Reel.tsx` (más el render de audio de Remotion de arriba).
- **(h) Audibilidad:** en su banda de 1/3 de octava, todos los acentos tonales superan a la música × volumen entre +5,5 dB (pip del texto) y +35 dB
  (Fa#3); el swell de la transición queda +2,3 dB sobre la música (se mezcla sin taparse) y la respuesta suena antes de que la música llegue.
- **(g) Espectrogramas** (`ffmpeg showspectrumpic`, incluidos acercamientos del tipeo/borrado, de la duda + envío + respuesta, de los acentos
  de 29,5 a 47,5 s y del cierre) revisados a ojo: sin ruido de banda ancha extraño ni siseo agudo, glissandos y swells limpios, teclas como
  impulsos bien separados, ráfaga de borrado con el arrastre visible entre 0,5 y 1 kHz, pausa de la duda y del envío sin nada salvo aire, entrada
  de la música desde f790, cierre sin cortes.
- **Límite de la verificación:** son comprobaciones objetivas; **nadie escuchó todavía** estos stems.

## Reemplazar por material real o licenciado

1. **Música licenciada:** pasarla a un WAV de 53 s, 48 kHz, estéreo, con silencio hasta el f790 y cierre suave:
   ```bash
   ffmpeg -i musica-licenciada.wav -af "adelay=26333|26333,apad,atrim=0:53,afade=t=in:st=26.333:d=1.8,afade=t=out:st=51:d=2" \
     -ar 48000 -ac 2 -c:a pcm_s16le public/audio/musica.wav
   ```
   (`26333` ms = f790; el resultado dura exactamente 53,000 s). Si la música entra en otro momento, cambiar `SEND_TIMING.replyIn` en `timeline.ts`.
   Ajustar volumen en `Reel.tsx` según la sonoridad (objetivo −20 … −16 LUFS).
2. **Teclado real:** grabar o editar un teclado a los tiempos de `KEY_EVENTS` (`node -e "import('./src/config/typing.ts').then(m=>console.log(m.KEY_EVENTS))"`)
   y exportarlo con el mismo formato/duración, **con silencio desde f612 hasta el final** (pausa de la duda y del envío). Mantener `public/audio/teclado.wav`.
3. **Ambiente de consultorio / sfx:** reemplazar `ambiente.wav` o `sfx-hilo.wav` con el mismo formato (53 s alineados; sfx en silencio hasta f702).
4. **Locución:** exportar un stem de 53,000 s (2 544 000 muestras, 48 kHz, estéreo) con las frases en f930 (31,0 s), f994 (33,1 s) y la firma en f1238 (41,3 s)
   y silencio en el resto (referencia: `VOICEOVER.cues`), guardarlo como `public/audio/locucion.wav` y poner `VOICEOVER.enabled = true` en
   `src/config/timeline.ts` (`Reel.tsx` lo monta desde el f0). Texto en `src/config/script.ts`; la pronunciación de «ADIP» queda a confirmar con el equipo.
   Ver «Espacio para la voz futura» para el ducking recomendado.
5. Después de reemplazar, `npm run audio:verify` sigue sirviendo para (a), (c), (d) y (g) (los chequeos (b) de onsets, (e) y (h) fallarán si el teclado/la
   música ya no son los sintetizados: es esperable).

No volver a ejecutar `npm run audio` si ya se reemplazó algún stem: **sobrescribe los cuatro** archivos.

## Cambios respecto de la v2 (38 s)

- Duración 38 → **53 s** (1590 f) en los 4 stems; hitos de `SFX_CUES` v3 (`threadBorn`, `cameraPullOut`, `widen`, `friendSits`, `subtitleUnits` y `CURSOR_HANDOFF` ya
  no existen; entran `sendPress`, `sendFly`, `indicator`, `reply`, `transition`, `reveal`, `friendArrive`, `gesture`, `signatureOne/Two`, `finalDate`).
- Teclado: tres mensajes (M3 no se borra: se envía); borrado de 1 carácter por fotograma (27 y 25 retrocesos), sin teclado desde f612; ENVIAR pasa a ser un acento de sfx.
- Ambiente: −32,5 dBFS (v2: −34,5); se abre en la duda de f612–f702 y se aquieta con la respuesta (v2: se abría antes de la música).
- Música: entra en f790 con la respuesta (v2: f410), 8 compases con cambios en 790, 895, …, 1525, pad en terceras apiladas sin pedal (sin segundas graves), resolución
  ii → I con fundido propio desde f1530; banda 300–3000 Hz: 18 % de la energía (v2: 23 %).
- Acentos nuevos: clic de ENVIAR, swoosh de la burbuja, tics de «Amiga escribe», gota de la respuesta, soplo de la ilustración, silla que rueda, quinta de la firma,
  eco del carillón en el cierre; todos medidos contra la música (tabla (h)).
- Verificación: onsets de teclado con 1 evento por fotograma, ráfaga de borrado sin saturar, pausa hasta el final, cambios armónicos (croma grave + cruce de raíces),
  audibilidad de los acentos sobre la música, compatibilidad mono, parlante de celular, 96 comprobaciones (v2: 75).
