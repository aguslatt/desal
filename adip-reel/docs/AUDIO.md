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
  `src/config/typing.ts` (`KEY_EVENTS`): si cambia el cronograma, se regenera y el audio sigue alineado. Las notas de la música atadas
  a un evento (la suspensión de la llegada de la amiga y su resolución con el gesto, la nota de la ilustración) se calculan desde
  `SFX_CUES`; los cambios de armonía cada 105 f desde `musicIn` son independientes de los hitos. Única dependencia fuera
  de `src/config`: el período de rebote de los tres puntos (21 f, `THREAD_FX.dotsPeriod` en `src/chat/geometry.ts`), copiado en
  `build-audio.ts` y `verify-audio.ts` (si el chat lo cambia, actualizar ambos).
- **Niveles:** los picos de diseño que figuran en los comentarios de `build-audio.ts` y en la tabla de hitos de abajo son **antes** del
  ajuste general `MASTER_TRIM_DB = 3` (+3 dB a los cuatro stems al escribirlos). Los picos y RMS medidos de los archivos ya lo incluyen.
  `verify-audio.ts` copia la constante (`TRIM`): si se cambia en uno, cambiarla en el otro.

## Cómo regenerar y verificar

```bash
npm run audio          # = node scripts/build-audio.ts   (≈20 s) → public/audio/*.wav
npm run audio:verify   # = node scripts/verify-audio.ts  (≈30 s; requiere ffmpeg/ffprobe en el PATH)
```

Variables opcionales: `AUDIO_CHECK_DIR=<carpeta>` (espectrogramas y mezcla de prueba de la verificación; por defecto
`<tmp>/adip-audio-check`), `AUDIO_VERBOSE=1` (tabla de las 128 pulsaciones y curvas de novedad armónica),
`AUDIO_DUMP_LAYERS=<carpeta>` (en `npm run audio`: escribe además las capas de la música —piano, pad, bajo, sub, reverb—).

Formato de salida (los 4 archivos): **WAV PCM 16-bit, 48 kHz, estéreo, exactamente 53,000 s (2 544 000 muestras = 1590 f)**.
El fotograma `f` del reel cae en la muestra `f·1600`: los stems entran en `Reel.tsx` tal cual, sin `trimBefore` ni desfasajes.
Comprobado de punta a punta con Remotion 4.0.533: un render solo de audio (réplica privada de las pistas de `Reel.tsx` con los mismos
volúmenes, en `dev/audio/`, no versionada; `npx remotion render <entrada> AudioTest out.wav --codec=wav`) dura 53,000 s, **desfase 0
muestras**, y la mezcla coincide con la simulada de `verify-audio.ts` a −43 dB de pico (Remotion aplica el volumen por fotograma y la
simulación por muestra); medido sobre ese render real: **−15,1 LUFS integrados, −2,2 dBTP**, igual que la simulación. Si se vuelve a usar
esa réplica privada, actualizar su volumen de la música a 1 (como `Reel.tsx`).

## Línea de tiempo sonora

| Fotogramas | Tiempo | Qué suena |
|---|---|---|
| 0 – 118 | 0 – 3,9 s | **solo ambiente** (aire de habitación, audible desde el f0); primer plano del chat, nada más |
| 118 – 612 | 3,9 – 20,4 s | **teclado** sincronizado con la escritura de M1 y M2 (se sostienen ≈ 3 s: teclado en silencio digital) y los **dos borrados** (ráfagas de 27 y 25 retrocesos en f272–312 y f478–518), luego M3 (f534–612) |
| **612 – 702** | **20,4 – 23,4 s** | **PAUSA de la duda**: ni una tecla, ni sfx, ni música. Solo aire; el aire «se abre» (apenas). El teclado **no vuelve a sonar** hasta el final |
| 702 – 756 | 23,4 – 25,2 s | ENVIAR (clic suave, f702), la burbuja enviada (swoosh, f712; asentamiento en f742) |
| 756 – 790 | 25,2 – 26,3 s | «Amiga escribe»: pop + tics suaves de los tres puntos |
| **790** | **26,33 s** | **llega «Estoy acá. Te escucho.»**: nota cálida tipo gota (Fa#5) y **entra la música** (swell de 1,8 s); el aire se aquieta |
| 790 – 1590 | | música en compases de 105 f (cambios armónicos en 790, 895, 1000, 1105, 1210, 1315, 1420, 1525) con los acentos de `SFX_CUES`, cada uno con su hueco en la música |
| 1525 – 1590 | 50,8 – 53 s | resolución calma (Re mayor 9) que se desvanece sin corte hasta el último fotograma |

## Stems

Valores medidos sobre los archivos (ya con `MASTER_TRIM_DB`):

| Stem | Qué es | Pico | RMS | Sonoridad (stem solo) |
|---|---|---|---|---|
| `ambiente.wav` | Aire de habitación: ruido marrón/rosa filtrado + banda de «aire» (≈1–3 kHz, sin siseo agudo); nivelado a ±0,5 dB; entra en 30 ms (anti-clic) y sale en 0,6 s | −14,7 dBFS | **−29,5 dBFS** | −27,5 LUFS |
| `teclado.wav` | 128 pulsaciones exactas (una por `KEY_EVENTS`) + «arrastre» del borrado; silencio digital entre ellas y **desde f616 hasta el final** | −2,8 dBFS | −31,5 dBFS | −22,3 LUFS |
| `musica.wav` | Piano eléctrico/felt suave + pad + bajo + sub, con reverb sintética y un hueco de −3 dB bajo cada acento; **silencio digital hasta f790** | **−5,5 dBFS** | −18,9 dBFS | −13,8 LUFS |
| `sfx-hilo.wav` | Acentos en los hitos de `SFX_CUES` (tabla de abajo); **silencio digital hasta f702** | −10,4 dBFS | −33,2 dBFS | −24,8 LUFS |

### ambiente.wav
- Fuente: ruido marrón (común a ambos canales: «una sola sala») + marrón/rosa independientes por canal, pasa-bajos que respira
  lento (cutoff 400–760 Hz), sin graves < 80 Hz, más una banda de «aire» (BP 1,5 kHz, LP 2,6 kHz; > 3 kHz queda < −62 dBFS).
- **Nivel:** −29,5 dBFS RMS (diseño −32,5 + 3 de ajuste general; en la mezcla ×0,8 → −31,5). El RMS de cualquier ventana de 1 s queda
  entre −30,8 y −27,3 dBFS: nunca hay zonas «muertas».
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
- **Letras:** tap suave (picos −7,3 … −3,0 dBFS, mediana −5,5). El **paneo sigue la columna de la tecla en el QWERTY**; la **fuerza depende de
  la velocidad de tipeo**; la **mayúscula** pesa +1,4 dB; la **última tecla de cada mensaje** cae más asentada.
- **Espacio:** más grave y largo (centroide 159 Hz vs 286 Hz de las letras). **Puntuación** (¿ . ? …): más seca y aguda, con un
  «ting» mínimo (440 Hz).
- **BORRAR (⌫ sostenida) — acción clave del relato, claramente perceptible y sin saturar.** Cada borrado quita 1 carácter por
  fotograma como máximo (≈ 20 retrocesos por segundo, 27 y 25 en 41 f):
  1. primer evento = **tecla hundida**: golpe pesado y claro (≈100–116 Hz, −3,6 / −2,8 dBFS);
  2. los siguientes = **repeticiones** secas con cuerpo, **más graves a medida que avanza el borrado** (mediana −7,4 / −7,8 dBFS);
  3. un **«arrastre»** de fricción suave (ruido de banda 0,5 → 1 kHz) cuya envolvente sigue la densidad de la ráfaga;
  4. último evento = **suelta**: golpe de cierre asentado.
  Medido: RMS de la ráfaga a −2,1 / −2,3 dB del RMS del tipeo del mismo mensaje (ni floja ni saturada: pico de la ráfaga ≤ −2,8 dBFS).
- **Pausa de la duda y del envío:** la última tecla es el «…» del f612; desde ahí hasta el final hay **silencio digital exacto**
  (32,6 s). ENVIAR no suena en el teclado: es un acento de `sfx-hilo`.
- Es el stem que fija el pico real de la mezcla (−2,8 dBFS de pico de muestra); por eso el ajuste general se limita a +3 dB.

### musica.wav
Instrumental cálida y sutil, **silencio digital hasta f790** (primera muestra no nula a 55 ms: el swell parte de cero).
Compás de 105 f (3,5 s); los cambios armónicos caen en **790, 895, 1000, 1105, 1210, 1315, 1420, 1525**. Re mayor, sobria
(I – vi – IV(9) – V(sus→) – I – IV(9) – ii – I):

| Compás | Fotogramas | Acorde (bajo) | Voces del pad | Intención / hito |
|---|---|---|---|---|
| 1 | 790–895 | Dmaj7 (Re) | La2 · Fa#3 · Do#4 | llega la respuesta (790); la música entra suave y escasa |
| 2 | 895–1000 | Bm7 (Si) | La3 · Re4 · Fa#4 | transición del naranja (900) y 1.ª frase (930) |
| 3 | 1000–1105 | Gmaj7(9) (Sol) | Si3 · Re4 · Fa#4 · La4 | 2.ª frase (998): «se abre»; el naranja se retira y entra la ilustración (1068) |
| 4 | 1105–1210 | Asus4 → A (La) | Mi3 · La3 · Re4 → Do#4 | escena de escucha: entra la amiga (1104), texto (1114), llega (1154); **la suspensión resuelve en el gesto (1172)** |
| 5 | 1210–1315 | Dmaj9 (Re) | Fa#3 · La3 · Do#4 · Mi4 | firma (1240) y logo (1254): el acorde más pleno |
| 6 | 1315–1420 | Gmaj7(9) (Sol) | Si3 · Re4 · Fa#4 · La4 | bloque 2 de la firma (1304) |
| 7 | 1420–1525 | Em9 (Mi) | Sol3 · Si3 · Re4 · Fa#4 | mensaje final (1420: cae con el cambio de acorde), fecha (1458) y composición final estática (1498): melodía sencilla (Re5 → Si4 → Do#5 → La4) |
| 8 | 1525–1590 | Dmaj9 (Re) | Fa#3 · La3 · Do#4 · Mi4 | resolución calma (ii → I) que se desvanece hasta f1590 |

- **Armonía sin batidos:** el pad va en **terceras apiladas** (sin segundas sostenidas en el registro grave: en cada acorde, con
  el bajo y el sub, el par de fundamentales más cercano por debajo de 400 Hz está a ≥ 31 Hz —una tercera menor—; la única segunda,
  la suspensión re → do# del compás 4, se cruza en ≈0,3 s) y el bajo/sub llevan las raíces; el piano solo toca notas del acorde en curso y las del
  final de cada compás pertenecen también al siguiente (o son cortas). Las notas tonales de `sfx-hilo` quedan **libres en el
  pad y el piano de su momento** (Re3 y Fa#3 de las frases, Fa#4+Do#5 de la firma, Re5+La5 del final).
- **Notas atadas a un evento** (se calculan desde `SFX_CUES`): el Re3 de cabecera del compás 3 espera 12 f a la 2.ª frase (998 → 1010) para que
  respire su acento; Fa#4 y La4 de la ilustración a 12 y 28 f del `reveal` (1080, 1096); la suspensión Re4 del compás 4 con la llegada de la amiga
  (1152) y su resolución Do#4 con el gesto (1176), seguida de un arpegio de La mayor (Mi4 1192, La4 1202); el Fa#4 posterior al logo (1272); el Fa#4 posterior a la fecha (1470);
  la melodía final desde el 1492 (la composición final está completa desde `CLOSING_TIMING.allVisible` = 1498).
- Capas: piano (arpegios lentos y escasos, 3–6 notas por compás, humanización ±6 ms / ±8 % de velocidad; las notas de cabecera
  de compás quedan exactas, con un «tic» de fieltro de 3–6 kHz que le da definición en parlantes de celular), pad (3 voces
  desafinadas con vibrato lento, una octava más grave que en la v1), bajo (octava sobre el sub, 2.º armónico mínimo) y sub.
  Reverb Freeverb (RT ≈ 2 s, amortiguada, envío sin graves). Limitador de picos a −8,5 dBFS de diseño (−5,5 ya con el ajuste general; reducción máxima 2,6 dB).
- **Huecos bajo los acentos (QA R3):** la música concentra casi toda su energía en graves y tapaba los acentos. Después del limitador, el stem baja
  **3 dB** bajo cada acento posterior a su entrada —frases (930, 998), soplo de la ilustración (1068), pip del texto (1114), pasos de la amiga (1154), gesto (1172),
  firma (1240), logo (1254), bloque 2 (1304), mensaje final (1420), fecha (1458) y eco del cierre (1525)—: 80 ms antes (llega ya abajo), **250 ms sostenido** y
  vuelta de 350 ms con coseno; dos acentos seguidos se funden en un solo hueco (nunca más hondo que −3 dB). Va en el stem, no en `Reel.tsx` (parámetros `DUCK_*`
  de `build-audio.ts`). El swell de la transición (900) no lleva hueco (dura 3 s) y la respuesta (790) suena antes de la música. No cambia el pico del stem.
- **Entrada:** swell de 1,8 s (pad/bajo/sub desde el silencio, piano desde 35 %); `Reel.tsx` suma su rampa de 75 f (790 → 865).
  RMS de la música: −31,5 dBFS en f790–805, −14,8 dBFS en f835–850: ya suena durante la sostenida de la respuesta.
- **Nivel por compás:** parejo (RMS −16,3 … −15,2 dBFS entre el 2.º y el 7.º: rango 1,1 dB).
- **Cierre:** fundido propio de coseno desde f1530 que termina en 0 exacto en la última muestra; `Reel.tsx` suma el suyo (lineal)
  desde `musicOutFrom` (f1530). RMS por tramo: −15,9 (f1525–45) → −17,8 → −23,7 → −38,3 dBFS: monótono, sin corte seco.

### sfx-hilo.wav — hitos (`SFX_CUES`)

Acentos cálidos (sin whooshes de meme). Los tonales llevan una reverb corta para que «florezcan». Los **picos de diseño** de la tabla son
**antes de `MASTER_TRIM_DB`** (+3 dB); la columna «Δ QA» es lo que se subió respecto de la versión anterior (QA R2/R3). Los que suenan sobre la
música llevan además el hueco de −3 dB del stem de música.

| Hito | Fotograma | Tiempo | Sonido | Pico de diseño | Δ QA |
|---|---|---|---|---|---|
| `sendPress` | 702 | 23,40 s | **clic suave** al pulsar ENVIAR (cuerpo ≈300 Hz que baja + «tac» de 1,25 kHz + hálito de ruido) | −21 dBFS | — |
| `sendFly` | 712 | 23,73 s | **swoosh corto y suave** (soplo de 0,42 s, 450 → 2100 Hz) | −23 dBFS | +4 |
| (`SEND_TIMING.flyTo`) | 742 | 24,73 s | asentamiento de la burbuja al llegar al hilo (Re5) | −26 dBFS | +7 |
| `indicator` | 756 | 25,20 s | **tics suaves**: «pop» de la burbuja de puntos (La5) y un tic por rebote de punto (Re6 · Mi6 · Fa#6) en f761,3 · 764,4 · 767,6 · 782,3 · 785,4 (el rebote que cae sobre la respuesta se omite) | −29 / −31,5 dBFS | — |
| `reply` | 790 | 26,33 s | **LLEGADA DE LA RESPUESTA (momento emocional):** una sola nota cálida tipo gota — Fa#5 (tercera de Re mayor), ataque inmediato, ascenso de afinación de 9 % en ≈25 ms, cuerpo una octava abajo y cola de ≈1,5 s. Breve y discreta: la música recién nace bajo ella | −17 dBFS (la cima del envío) | — |
| `musicIn` | 790 | | entra la música (no suena en `sfx-hilo`) | | |
| `transition` | 900 | 30,00 s | **swell suave** de Si menor (Fa#4 · Si4 · Re5, ataque 0,95 s) mientras el naranja se expande | −21 dBFS | +3 |
| `phraseOne` | 930 | 31,00 s | tono grave cálido y breve, Re3 (armónicos 1–3 de 1 · 0,65 · 0,3, ataque suave, no campana) | −16,5 dBFS | +2 |
| `phraseTwo` | 998 | 33,27 s | ídem, Fa#3 (tercera mayor arriba: «abre»); entra con el rodillo de la 2.ª frase (`secondIn` + 4 f) | −17,5 dBFS | +2 |
| `reveal` | 1068 | 35,60 s | **soplo suave** (1,5 s, 480 → 2600 Hz) al retirarse el naranja / entrar la ilustración | −22 dBFS | +4 |
| `companionText` | 1114 | 37,13 s | «pip» redondo Si5 | −20 dBFS | +5 |
| `friendArrive` | 1154 | 38,47 s | **la silla que rueda** (muy leve): ruido 150–700 Hz modulado por el giro de las ruedas (4,4 → 1,2 vueltas/s, desacelera) de f1104 (`friendEnterFrom`) a f1154 (−33) + asentamiento de madera al detenerse (golpe grave + «tic» de ruido de 1,8 kHz de 5 ms, que se oye aunque el bajo de la música tape los graves) | −33 / −28 dBFS | +2 / +4 |
| `gesture` | 1172 | 39,07 s | cuerda / campanita mínima, dos notas Mi5 → La5 (+0,16 s); coincide con la resolución re → do# de la música | −19 / −21 dBFS | +5 |
| `signatureOne` | 1240 | 41,33 s | quinta cálida Fa#4 + Do#5 (la tercera de Re, libre en el pad) | −16,5 dBFS | +6 |
| `logoReveal` | 1254 | 41,80 s | **carillón cálido** discreto, arpegio de La mayor La5–Do#6–Mi6–La6 (aditivo, decaimiento ≈ 2 s, sin ataque metálico) | −17,5 … −23 dBFS (pico del stem: −10,4 con el ajuste general) | — |
| `signatureTwo` | 1304 | 43,47 s | «pip» Re5 | −20 dBFS | +5 |
| `finalMessage` | 1420 | 47,33 s | eco de los tonos del giro una octava y media arriba: Re5 + La5 (quinta abierta, decaimiento ≈ 2,4 s) | −15,5 dBFS | +5,5 |
| `finalDate` | 1458 | 48,60 s | «pip» Si5 | −20 dBFS | +5 |
| cierre (compás 8) | 1525 | 50,83 s | eco muy suave del carillón del logo: La5 + Mi6 (quinta y novena de Re mayor 9); no figura en `SFX_CUES` | −24 / −28 dBFS | +3 |
| `musicOutFrom` | 1530 | | marca para la música (no suena en `sfx-hilo`) | | |

El carillón del logo es el pico del stem (−10,4 dBFS con el ajuste general); la llegada de la respuesta (gota) es el acento más presente del envío y
la nota que más emerge de su entorno (sube la sonoridad K de la mezcla +10 dB, porque la música todavía no llegó). Los más delicados
(silla, tics, pips) quedan por debajo de −17 dBFS en su banda propia.

## Espacio para la voz futura (locución desactivada)

`VOICEOVER.enabled = false`: no hay voz. Para que una voz posterior (frases del giro, firma, mensaje final) no tenga que competir:
- el **pad está una octava más grave** que en la v1, en terceras apiladas, y el piano es escaso y suave en registro medio-grave;
- hay un **«hueco» de ecualización** (campana −4 dB en ≈1,15 kHz, Q 0,6) durante todo el texto en pantalla (se abre recién en el
  último compás, sin texto nuevo);
- la música va **pareja entre compases** (rango 1,1 dB): sin picos de nivel que tapen la voz.

Medido (música sola, f900–f1500): la banda de voz **300–3000 Hz es el 17 % de la energía** (v1: 38 %) y queda en **−23,5 dBFS RMS**
(con el ajuste general de +3 dB y el volumen 1,0 de `Reel.tsx`; antes −26,6): ≈ 3 dB bajo una voz a −20 dBFS RMS, por lo que **con locución
real hay que bajar la música ≈ 6 dB mientras habla** (en `Reel.tsx`); 100–300 Hz concentra el 77 %.

**Traducción a parlantes de celular:** por debajo de ~300 Hz un parlante casi no reproduce. Con un pasa-altos de 300 Hz la mezcla
completa queda en −20,3 LUFS (−5,2 LU respecto del rango completo). Es el costo, buscado, de dejar la banda de voz libre: la música
se siente más baja y «de campanitas» en un celular, y los acentos (pips, carillón, gota de la respuesta; casi todos > 500 Hz) pasan al frente.
El ajuste general de +3 dB sube todo parejo; la energía de la música sigue concentrada en graves (el 77 % bajo 300 Hz): una escucha real en un
celular es la prueba que falta.

## Mezcla y volúmenes

La mezcla final la define `Reel.tsx` (solo cambió el volumen de la música de 0,9 a 1,0). `verify-audio.ts` **lee los `volume={…}` de `src/Reel.tsx`** (los evalúa) y
simula la mezcla; mide con `ffmpeg ebur128` (pico real = true peak):

| Escenario | Volúmenes | Sonoridad integrada | Pico real |
|---|---|---|---|
| Antes de la revisión (QA del MP4) | ambiente 0,8 → 0,5 → 0 · teclado 1 · música 0 → 0,9 → 0 · sfx 1, stems sin ajuste | −18,5 LUFS (LRA 13,8 LU) | −5,2 dBTP |
| **Reel.tsx actual** | ambiente 0,8 desde el f0 → 0,5 (790 + 60 f) → 0 (últimos 45 f) · teclado 1 · música 0 → **1,0** (790 → 865) → 0 (desde 1530) · sfx 1; stems con +3 dB | **−15,1 LUFS** (LRA 14,1 LU) | **−2,2 dBTP** (pico de muestra −2,36 dBFS) |

- Dentro del objetivo (**−17 … −14 LUFS** integrados; antes −20 … −16) con 2,2 dB de margen de pico real bajo 0 dBFS (1,2 dB bajo −1 dBTP). El pico lo fijan las pulsaciones del
  teclado (f180–f520); en la parte con música el pico de la mezcla queda en ≈ −4,2 dBFS (1,8 dB más abajo). Tras el códec AAC de `npm run render` (Remotion usa 320 kbps por defecto):
  −2,2 dBTP; a 192 kbps (caso pesimista de la verificación) una única muestra del «.» de M1 sobrepasa a −0,6 dBTP, siempre bajo 0 dBFS.
- Por qué +3 dB y música a 1,0: el QA midió la mezcla en −18,5 LUFS con el 82 % de la energía bajo 350 Hz (entre 30 y 50 s): sonaba baja y sin cuerpo en parlantes de celular. El
  ajuste general sube los cuatro stems parejo (balance relativo intacto). La música pasa de 0,9 a 1,0 porque los huecos de −3 dB bajo los acentos le quitan ≈ 0,6 LU de sonoridad integrada
  (sin ese cambio quedaría en ≈ −16,1 LUFS) y en la parte con música el pico de la mezcla tiene ≈ 1,8 dB de margen bajo el del teclado, que es el que fija el pico real.
- Sonoridad a corto plazo (S): ≈ −22…−26 durante el tipeo y la duda (−27 en el envío), −16 al entrar la música y −13/−14 hasta el cierre (el contraste
  aire/teclado ↔ música es intencional).
- Los volúmenes > 1 no existen en `<Audio>`: por eso la música ya está en su máximo (1,0) y cualquier ganancia extra tiene que ir en `MASTER_TRIM_DB`.

## Verificación (resultado de la última corrida: `npm run audio:verify` → **VERIFICACIÓN OK, 100 comprobaciones**)

Los umbrales absolutos de pico y RMS de la verificación incluyen el ajuste general (`TRIM = 3`).

- **(a) Formato:** los 4 archivos `pcm_s16le · 48 000 Hz · 2 canales · 16 bit · 53,000000 s · 2 544 000 muestras` (ffprobe); `TOTAL_FRAMES = 1590`.
- **(b) Teclado:** detección **ciega** de onsets (máximo móvil de |HP 1,8 kHz| contra el piso previo, robusta al «arrastre» del borrado):
  128 esperados, **128 detectados, 0 espurios, 0 faltantes**; desvío máximo **0,21 ms** (medio 0,06 ms), muy por debajo de ±1 ms. Silencio
  digital exacto fuera de las ventanas de evento y **desde f616 hasta el final (sin teclado entre f612 y el final)**. ⌫: 1 retroceso por
  fotograma (27 y 25 en 41 f), RMS de la ráfaga a −2,1/−2,3 dB del tipeo, ticks con mediana −7,4/−7,8 dBFS, tecla hundida −3,6/−2,8 dBFS
  (≥ 3 dB sobre los ticks), sin saturar (pico de la ráfaga ≤ −2,5 dBFS). Tipos distinguibles por centroide espectral (espacio < letras < puntuación < ⌫;
  mayúsculas +2 dB de pico). Variación: 1732 pares de pulsaciones aisladas del mismo tipo, correlación máxima 0,92 (ninguna repetida).
- **(c) Picos / clipping / continuidad:** ningún stem toca 0 dBFS (picos: ambiente −14,7, teclado −2,8, música −5,5, sfx −10,4 dBFS; rangos objetivo por stem
  actualizados con el ajuste general), 0 muestras al extremo, sin continua, **compatibles con mono** (la suma L+R pierde 0,06–0,8 dB; el ambiente, ruido
  descorrelacionado, 2,0 dB). Sin clics ni discontinuidades en ambiente, música y sfx (detector de 2.ª diferencia; los tics son transitorios de diseño: 12,4× < 14×;
  los huecos de la música son rampas de coseno). Todos terminan en 0 exacto. **Música: silencio digital hasta f790; sfx: hasta f702 (ENVIAR).** Ambiente: RMS −29,5 dBFS
  (> −40 desde el primer segundo), «se abre» +1,64 dB en la duda y se aquieta −1,5 dB con la respuesta. Cierre de la música monótono hasta f1590.
- **(d) Alineación de sfx:** los 17 hitos arrancan en su fotograma (tonos, pips, tics, clic y carillón: 0,1–5,5 ms de latencia del detector;
  el soplo de la ilustración y el swoosh, de ataque lento, nacen en el hito: 85 y 54 ms al 3 % del máximo; el swell de la transición alcanza el 10 % del máximo a 0,21 s y el 90 % a
  1,02 s como se diseñó). La silla que rueda queda a −35,3 dBFS en su banda (muy leve), los tics a −29,8 dBFS, los pips a −18 dBFS.
- **(e) Música:** raíz del bajo por compás **D – B – G – A – D – G – E – D** como se diseñó; el cruce entre raíz saliente y entrante cae a +2…+13 f
  del inicio de cada compás; la novedad del croma grave (90–260 Hz) centra los 7 cambios a −4…+4,5 f del compás (el pad entra ≈0,4 s antes por
  fundido cruzado; el del 1000 queda a +4,5 f porque la nota de cabecera del piano espera 10 f a la 2.ª frase), 36–52× la mediana estable. Banda de voz 300–3000 Hz: 17 % de la energía, −23,5 dBFS (ver arriba).
- **(f) Mezcla simulada:** −15,1 LUFS integrados (rango objetivo −17…−14), −2,2 dBTP (límite −1,5), con los volúmenes de `Reel.tsx`; tras AAC a 320 kbps −2,2 dBTP
  y a 192 kbps −0,6 dBTP (< 0). Confirmado con el render de audio de Remotion (arriba).
- **(h) Audibilidad:** dos medidas por hito. **En su banda** (1/3 de octava del acento, ventana de 170 ms, sfx vs música × volumen de `Reel.tsx`): todos los tonales superan
  a la música entre +10 dB (quinta de la firma) y +35 dB (Fa#3), mínimo exigido +8 dB; el swell de la transición queda +1 dB sobre la música (se mezcla sin taparse) y la respuesta
  suena antes de que la música llegue. **En sonoridad ponderada K** (BS.1770, 400 ms desde el hito, cama = ambiente + teclado + música): cuánto sube la sonoridad al sumar el acento.
  Tabla antes (stems sin la revisión, mismo cronograma) → ahora, en dB:

  | Hito | En banda antes → ahora | Sonoridad K antes → ahora | Con pasa-altos de celular (ahora) |
  |---|---|---|---|
  | `phraseOne` 930 | +23,3 → +25,8 | +0,99 → +1,96 | +4,4 |
  | `phraseTwo` 998 | +32,0 → +34,6 | +0,74 → +1,34 | +0,9 |
  | `reveal` 1068 | (ancho) | +0,01 → +0,07 | +0,2 |
  | `companionText` 1114 | +11,3 → +18,4 | +0,04 → +0,20 | +1,2 |
  | `friendArrive` 1154 | (graves tapados por el bajo) → tic 1,8 kHz +9,9 | +0,00 → +0,00 | +0,0 |
  | `gesture` 1172 | +17,1 → +24,2 | +0,28 → +1,19 | +3,5 |
  | `signatureOne` 1240 | +3,6 → +10,3 | +0,14 → +0,65 | +2,4 |
  | `logoReveal` 1254 | +26,5 → +28,6 | +1,46 → +2,12 | +7,0 |
  | `signatureTwo` 1304 | +7,0 → +14,0 | +0,08 → +0,37 | +0,9 |
  | `finalMessage` 1420 | +12,7 → +19,0 | +0,17 → +0,81 | +2,9 |
  | `finalDate` 1458 | +12,3 → +19,3 | +0,04 → +0,22 | +1,0 |
  | `cierre` 1525 | +10,3 → +15,4 | +0,11 → +0,31 | +0,9 |
  | `reply` 790 (sin música) | — | +10,05 | +13,2 |

  La sonoridad K de un «pip» de 75 ms en una ventana de 400 ms sube poco por naturaleza (por eso la medida decisiva para los pips es la de su banda); la respuesta sigue siendo, por lejos,
  el acento que más emerge. Los pasos de la amiga (los graves de la silla caen bajo el bajo de la música) quedan **muy leves por diseño**: solo el tic de 1,8 kHz se distingue.
  **Secuencia de envío (QA R2):** picos del stem por tramo: clic −18,0 · swoosh −20,1 (antes −24,1) · asentamiento −23,0 · puntos −26,0 · respuesta −13,3 dBFS (todo el envío bajo la gota); la sonoridad K que sube
  el swoosh pasa de +0,62 a +1,38 dB y la del asentamiento de +0,08 a +0,45 dB; sonoridad momentánea máxima (K, 400 ms): tecleo −18,8 LUFS, envío −25,9 LUFS (el envío sigue unos 7 dB bajo el tecleo: lo que
  suena en el envío es un aire con acentos, no una ráfaga de teclas).
- **(g) Espectrogramas** (`ffmpeg showspectrumpic`, incluidos acercamientos del tipeo/borrado, de la duda + envío + respuesta, de los acentos
  de 29,5 a 47,5 s y del cierre) revisados a ojo: sin ruido de banda ancha extraño ni siseo agudo, glissandos y swells limpios, teclas como
  impulsos bien separados, ráfaga de borrado con el arrastre visible entre 0,5 y 1 kHz, pausa de la duda y del envío sin nada salvo aire, swoosh y asentamiento visibles en
  el envío, entrada de la música desde f790, cierre sin cortes.
- **Límite de la verificación:** son comprobaciones objetivas; **nadie escuchó todavía** estos stems.

## Reemplazar por material real o licenciado

1. **Música licenciada:** pasarla a un WAV de 53 s, 48 kHz, estéreo, con silencio hasta el f790 y cierre suave:
   ```bash
   ffmpeg -i musica-licenciada.wav -af "adelay=26333|26333,apad,atrim=0:53,afade=t=in:st=26.333:d=1.8,afade=t=out:st=51:d=2" \
     -ar 48000 -ac 2 -c:a pcm_s16le public/audio/musica.wav
   ```
   (`26333` ms = f790; el resultado dura exactamente 53,000 s). Si la música entra en otro momento, cambiar `SEND_TIMING.replyIn` en `timeline.ts`.
   Ajustar el volumen en `Reel.tsx` según la sonoridad (objetivo −17 … −14 LUFS integrados); un stem reemplazado **no** lleva el +3 dB de `MASTER_TRIM_DB` ni los huecos de −3 dB bajo los acentos
   (habría que aplicarlos en la edición).
2. **Teclado real:** grabar o editar un teclado a los tiempos de `KEY_EVENTS` (`node -e "import('./src/config/typing.ts').then(m=>console.log(m.KEY_EVENTS))"`)
   y exportarlo con el mismo formato/duración, **con silencio desde f612 hasta el final** (pausa de la duda y del envío). Mantener `public/audio/teclado.wav`.
3. **Ambiente de consultorio / sfx:** reemplazar `ambiente.wav` o `sfx-hilo.wav` con el mismo formato (53 s alineados; sfx en silencio hasta f702).
4. **Locución:** exportar un stem de 53,000 s (2 544 000 muestras, 48 kHz, estéreo) con las frases en f930 (31,0 s), f994 (33,1 s) y la firma en f1240 (41,3 s)
   y silencio en el resto (referencia: `VOICEOVER.cues`), guardarlo como `public/audio/locucion.wav` y poner `VOICEOVER.enabled = true` en
   `src/config/timeline.ts` (`Reel.tsx` lo monta desde el f0). Texto en `src/config/script.ts`; la pronunciación de «ADIP» queda a confirmar con el equipo.
   Ver «Espacio para la voz futura» para el ducking recomendado.
5. Después de reemplazar, `npm run audio:verify` sigue sirviendo para (a), (c), (d) y (g) (los chequeos (b) de onsets, (e) y (h) fallarán si el teclado/la
   música ya no son los sintetizados: es esperable).

No volver a ejecutar `npm run audio` si ya se reemplazó algún stem: **sobrescribe los cuatro** archivos.

## Revisión del QA sobre el MP4 (hallazgos R1–R3) y cronograma ajustado

El coordinador reajustó los tiempos de `timeline.ts` (la 2.ª frase suena en f998 = `secondIn` + 4; el soplo de la ilustración en f1068; la amiga entra en f1104, llega en f1154 y hace el gesto
en f1172; el texto en f1114; la firma en f1240, el logo en f1254; el mensaje final en f1420 y la fecha en f1458). Los stems se regeneraron con esos hitos y se actualizaron
los comentarios y las notas de la música atadas a un evento. Además:

| Hallazgo | Qué se hizo | Resultado medido |
|---|---|---|
| **R1** — mezcla baja (−18,5 LUFS, −5,3 dBTP; 82 % de la energía bajo 350 Hz) | `MASTER_TRIM_DB = 3` en `writeStem()` (los cuatro stems, balance relativo intacto); música de 0,9 a 1,0 en `Reel.tsx` (compensa los huecos de −3 dB); umbrales de pico/RMS por stem y rango objetivo de `verify-audio.ts` ahora −17…−14 LUFS | −15,1 LUFS, −2,2 dBTP; celular (pasa-altos 300 Hz) −20,3 LUFS (antes −23,8) |
| **R2** — el envío (clic f702, swoosh f712, asentamiento f742, puntos f756–790) casi no se oía | swoosh −27 → −23 dBFS y asentamiento (Re5) −33 → −26 dBFS; clic (−21) y tics del indicador sin tocar; todo el envío bajo la gota (−17) | swoosh −20,1 dBFS, asentamiento −23,0 dBFS (con el ajuste general), respuesta −13,3 dBFS; la gota sube la sonoridad K +10 dB |
| **R3** — acentos tapados por la música | +2…+6 dB a cada acento (ver «Δ QA») y hueco de −3 dB / 250 ms bajo cada uno en el stem de música; el soplo y los pasos de la amiga, apenas más presentes; los armónicos 2.º y 3.º de los tonos cálidos suben (0,65 y 0,3) para que se lean en un parlante de celular | todos los acentos ≥ +10 dB sobre la música en su banda y suben la sonoridad K de la mezcla (tabla (h)) |

## Cambios respecto de la v2 (38 s)

- Duración 38 → **53 s** (1590 f) en los 4 stems; hitos de `SFX_CUES` v3 (`threadBorn`, `cameraPullOut`, `widen`, `friendSits`, `subtitleUnits` y `CURSOR_HANDOFF` ya
  no existen; entran `sendPress`, `sendFly`, `indicator`, `reply`, `transition`, `reveal`, `friendArrive`, `gesture`, `signatureOne/Two`, `finalDate`).
- Teclado: tres mensajes (M3 no se borra: se envía); borrado de 1 carácter por fotograma (27 y 25 retrocesos), sin teclado desde f612; ENVIAR pasa a ser un acento de sfx.
- Ambiente: −32,5 dBFS de diseño (v2: −34,5); se abre en la duda de f612–f702 y se aquieta con la respuesta (v2: se abría antes de la música).
- Música: entra en f790 con la respuesta (v2: f410), 8 compases con cambios en 790, 895, …, 1525, pad en terceras apiladas sin pedal (sin segundas graves), resolución
  ii → I con fundido propio desde f1530; banda 300–3000 Hz: 17 % de la energía (v2: 23 %).
- Acentos nuevos: clic de ENVIAR, swoosh de la burbuja, tics de «Amiga escribe», gota de la respuesta, soplo de la ilustración, silla que rueda, quinta de la firma,
  eco del carillón en el cierre; todos medidos contra la música (tabla (h)).
- Verificación: onsets de teclado con 1 evento por fotograma, ráfaga de borrado sin saturar, pausa hasta el final, cambios armónicos (croma grave + cruce de raíces),
  audibilidad de los acentos sobre la música (en su banda y en sonoridad K), secuencia de envío, compatibilidad mono, parlante de celular, AAC a 320 y 192 kbps, 100 comprobaciones (v2: 75).
