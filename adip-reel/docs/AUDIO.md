# Audio del reel v3 — «El mensaje que borraste» (53 s)

> **Estado: PROVISORIO (versión de revisión, sintetizado por código).** Los cuatro stems de `public/audio/` se generan con
> `scripts/build-audio.ts` y sirven para cerrar la edición con sonido sincronizado. Se pueden reemplazar, uno por uno, por
> **música licenciada** y/o **grabación real** (teclado, ambiente de consultorio, locución) sin tocar la animación (ver
> «Reemplazar»). Sin locución (`VOICEOVER.enabled = false`): el sentido completo se entiende sin sonido.
> **El audio NO fue escuchado por ninguna persona** (ni el de esta revisión ni el de las anteriores): todo lo de abajo son
> comprobaciones objetivas —números, detectores y espectrogramas—, no un juicio de oído. Antes de publicar hace falta una escucha
> humana, con auriculares y en un parlante de celular real (ver «Parlante de celular» y «Pendiente»).

## Origen y licencias

- **100 % sintetizado por código** en `scripts/build-audio.ts`: ruido pseudoaleatorio sembrado, osciladores (aditivos y FM),
  filtros biquad, envolventes y reverb de Schroeder/Freeverb. **Sin samples, sin bancos de sonidos, sin librerías ni dependencias
  de audio de terceros.** No queda ningún permiso de terceros pendiente.
- **Determinista:** PRNG `mulberry32` con semilla fija por stem (`src/lib/rng.ts`). Regenerar produce archivos idénticos byte a
  byte (comprobado con `md5sum` en dos corridas).
- Los tiempos salen de `src/config/timeline.ts` (`SFX_CUES`, `SEND_TIMING`, `HOOK_TIMING`, `COMPANION_TIMING`, `MESSAGE_SPECS`) y las teclas de
  `src/config/typing.ts` (`KEY_EVENTS`): si cambia el cronograma, se regenera y el audio sigue alineado. El aviso del gancho no tiene hito propio en
  `SFX_CUES`: usa `HOOK_TIMING.settle` (f6) directamente. Las notas de la música atadas
  a un evento (la suspensión de la llegada de la amiga y su resolución con el gesto, la nota de la ilustración) se calculan desde
  `SFX_CUES`; los cambios de armonía cada 105 f desde `musicIn` son independientes de los hitos. Los números de fotograma de los comentarios y de
  las tablas de este documento son los de `timeline.ts` actual (frase 1 en f935 = `firstIn` + 5, gesto en f1180 = `gestureAt` + 8): si se mueve un hito, hay que revisarlos. Única dependencia fuera
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
Comprobado de punta a punta con Remotion 4.0.533 (prueba de una sola vez, con los stems y los volúmenes de esta revisión): un render solo de
audio de una composición de prueba que monta las mismas cuatro pistas con los mismos `volume={…}` que `Reel.tsx` (no forma parte del repositorio
ni hace falta para verificar: `verify-audio.ts` simula la mezcla leyendo esos volúmenes de `Reel.tsx`) dura 53,000 s, **desfase 0 muestras**, y la
mezcla coincide con la simulada a −53,3 dB (Remotion aplica el volumen por fotograma y la simulación por muestra); medido sobre ese render real:
**−15,0 LUFS integrados, −2,2 dBTP**, igual que la simulación. Para repetirlo: registrar una composición de solo audio con esas pistas y
`npx remotion render <entrada> <composición> out.wav --codec=wav --config=<config sin crf>` (el `remotion.config.ts` del proyecto fija `crf`,
que el códec wav rechaza). Si cambian los volúmenes de `Reel.tsx`, la réplica hay que actualizarla igual.

## Línea de tiempo sonora

| Fotogramas | Tiempo | Qué suena |
|---|---|---|
| 0 – 118 | 0 – 3,9 s | aire de habitación (audible desde el f0) y, en **f6** (`HOOK_TIMING.settle`, cuando la pregunta termina de asentarse), un **aviso suave de «mensaje recibido»** (dos notas cortas, La5 → Re6); se apaga hacia f68, mucho antes de la primera tecla (f118) |
| 118 – 612 | 3,9 – 20,4 s | **teclado** sincronizado con la escritura de M1 y M2 (se sostienen ≈ 3 s: teclado en silencio digital) y los **dos borrados** (ráfagas de 27 y 25 retrocesos en f272–312 y f478–518), luego M3 (f534–612) |
| **612 – 702** | **20,4 – 23,4 s** | **PAUSA de la duda**: ni una tecla, ni sfx, ni música. Solo aire; el aire «se abre» (apenas). El teclado **no vuelve a sonar** hasta el final |
| 702 – 756 | 23,4 – 25,2 s | ENVIAR (clic suave, f702), la burbuja enviada (swoosh, f712; asentamiento en f742): los tres, más presentes que en la versión anterior (QA A3), todos bajo la gota de la respuesta |
| 756 – 790 | 25,2 – 26,3 s | «Amiga escribe»: pop + tics suaves de los tres puntos |
| **790** | **26,33 s** | **llega «Estoy acá. Te escucho.»**: nota cálida tipo gota (Fa#5) y **entra la música** (swell de 1,4 s + rampa de 18 f de `Reel.tsx`: a pleno entre f820 y f835); el aire se aquieta |
| 790 – 1590 | | música en compases de 105 f (cambios armónicos en 790, 895, 1000, 1105, 1210, 1315, 1420, 1525) con los acentos de `SFX_CUES`, casi todos con su hueco en la música (la llegada de la amiga, f1154, no) |
| 1525 – 1590 | 50,8 – 53 s | resolución calma (Re mayor 9) que se desvanece sin corte hasta el último fotograma |

## Stems

Valores medidos sobre los archivos (ya con `MASTER_TRIM_DB`):

| Stem | Qué es | Pico | RMS | Sonoridad (stem solo) |
|---|---|---|---|---|
| `ambiente.wav` | Aire de habitación: ruido marrón/rosa filtrado + banda de «aire» (≈1–3 kHz, sin siseo agudo); nivelado a ±0,5 dB; entra en 30 ms (anti-clic) y sale en 0,6 s | −14,7 dBFS | **−29,5 dBFS** | −27,5 LUFS |
| `teclado.wav` | 128 pulsaciones exactas (una por `KEY_EVENTS`) + «arrastre» del borrado; silencio digital entre ellas y **desde f616 hasta el final** | −2,8 dBFS | −31,5 dBFS | −22,3 LUFS |
| `musica.wav` | Piano eléctrico/felt suave + pad + bajo + sub, con reverb sintética y un hueco de −3 dB bajo cada acento; **silencio digital hasta f790** | **−5,5 dBFS** | −18,8 dBFS | −13,7 LUFS |
| `sfx-hilo.wav` | Acentos en los hitos de `SFX_CUES` y `HOOK_TIMING.settle` (tabla de abajo); **silencio digital hasta f6, y de f68 a f702** (solo suena el aviso del gancho antes de ENVIAR) | −10,1 dBFS | −32,0 dBFS | −24,0 LUFS |

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
Instrumental cálida y sutil, **silencio digital hasta f790** (primera muestra no nula a 42 ms: el swell parte de cero).
Compás de 105 f (3,5 s); los cambios armónicos caen en **790, 895, 1000, 1105, 1210, 1315, 1420, 1525**. Re mayor, sobria
(I – vi – IV(9) – V(sus→) – I – IV(9) – ii – I):

| Compás | Fotogramas | Acorde (bajo) | Voces del pad | Intención / hito |
|---|---|---|---|---|
| 1 | 790–895 | Dmaj7 (Re) | La2 · Fa#3 · Do#4 | llega la respuesta (790); la música entra con un swell corto y está a pleno hacia f825, escasa pero con cuerpo |
| 2 | 895–1000 | Bm7 (Si) | La3 · Re4 · Fa#4 | transición del naranja (900) y 1.ª frase (935) |
| 3 | 1000–1105 | Gmaj7(9) (Sol) | Si3 · Re4 · Fa#4 · La4 | 2.ª frase (998): «se abre»; el naranja se retira y entra la ilustración (1068) |
| 4 | 1105–1210 | Asus4 → A (La) | Mi3 · La3 · Re4 → Do#4 | escena de escucha: entra la amiga (1104), texto (1114), llega (1154); **la suspensión resuelve en el gesto (1180)** |
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
  (1152; el Re4 del pad dura hasta el gesto) y su resolución Do#4 con el gesto (pad: 1180; piano: 1184, de 3,9 s para apagarse antes del «pip» de f1304),
  seguida de un arpegio de La mayor (Mi4 1198, La4 1206); el Fa#4 posterior al logo (1272); el Fa#4 posterior a la fecha (1470);
  la melodía final desde el 1492 (la composición final está completa desde `CLOSING_TIMING.allVisible` = 1498). Al pasar el gesto de f1172 a f1180 (QA A6)
  todo esto se movió 8 f solo (se calcula desde `SFX_CUES.gesture`); medido: en f1172 domina el Re4 (+47,3 dB sobre el Do#4) y en f1194 el Do#4 (+20,9 dB sobre el Re4).
- Capas: piano (arpegios lentos y escasos, 3–6 notas por compás, humanización ±6 ms / ±8 % de velocidad; las notas de cabecera
  de compás quedan exactas, con un «tic» de fieltro de 3–6 kHz que le da definición en parlantes de celular), pad (3 voces
  desafinadas con vibrato lento, una octava más grave que en la v1), bajo (octava sobre el sub, 2.º armónico mínimo) y sub.
  Reverb Freeverb (RT ≈ 2 s, amortiguada, envío sin graves). Limitador de picos a −8,5 dBFS de diseño (−5,5 ya con el ajuste general; reducción máxima 2,6 dB).
- **Huecos bajo los acentos (QA R3):** la música concentra casi toda su energía en graves y tapaba los acentos. Después del limitador, el stem baja
  **3 dB** bajo cada acento posterior a su entrada —frases (935, 998), soplo de la ilustración (1068), pip del texto (1114), gesto (1180),
  firma (1240), logo (1254), bloque 2 (1304), mensaje final (1420), fecha (1458) y eco del cierre (1525): 11 acentos—: 80 ms antes (llega ya abajo), **250 ms sostenido** y
  vuelta de 350 ms con coseno; dos acentos seguidos se funden en un solo hueco (nunca más hondo que −3 dB). Va en el stem, no en `Reel.tsx` (parámetros `DUCK_*`
  de `build-audio.ts`). El swell de la transición (900) no lleva hueco (dura 3 s) y la respuesta (790) suena antes de la música. No cambia el pico del stem.
  **La llegada de la amiga (1154) ya no abre hueco (QA A7):** su «tic» de madera vive en 1–3 kHz, donde la música casi no tiene energía, así que el hueco no le daba
  nada y solo se oía como un bajón de la música sin causa (con el gesto 18 f después se encadenaban dos huecos: −3,6 dB en f1155 y −2,7 dB en f1170 respecto del compás).
  Ahora la música baja una sola vez, con el gesto (−4,4 dB en f1180, incluido el cambio de voz del pad), que sí es un acento audible; en f1155 queda a −0,7 dB.
- **Entrada (QA A4):** swell de 1,4 s (antes 1,8 s; pad/bajo/sub desde el silencio, piano desde 35 %); `Reel.tsx` suma su rampa de 18 f (790 → 808; antes 75 f, 790 → 865).
  RMS del stem: −30,1 dBFS en f790–805, −14,8 dBFS en f835–850. **En la mezcla** (stem × volumen de `Reel.tsx`), respecto del RMS del compás 2 (−16,1 dBFS):
  f798–805 −13,3 dB · f805–815 −4,5 dB · f815–820 −2,5 dB · **f820–835 −0,3 dB** (antes: −27,1 · −17,5 · −13,4 · −7,3 dB, y recién a pleno en f850–865). Sonoridad momentánea de la mezcla
  (K, 400 ms) entre f796 y f870: mínimo **−17,4 LUFS** (antes −23,6 LUFS en f808, el «valle» tras la gota); a f820 −14,2 LUFS (antes −21,2). La gota (Fa#5, la tercera de Re) es
  consonante con el acorde que entra (Dmaj7) y suena sola solo unos 8 f; sigue siendo la cima (+12,8 dB de sonoridad K sobre su entorno).
- **Nivel por compás:** parejo (RMS −16,3 … −15,2 dBFS entre el 2.º y el 7.º: rango 1,1 dB).
- **Cierre:** fundido propio de coseno desde f1530 que termina en 0 exacto en la última muestra; `Reel.tsx` suma el suyo (lineal)
  desde `musicOutFrom` (f1530). RMS por tramo: −15,9 (f1525–45) → −17,8 → −23,7 → −38,4 dBFS: monótono, sin corte seco.

### sfx-hilo.wav — hitos (`SFX_CUES` y `HOOK_TIMING.settle`)

Acentos cálidos (sin whooshes de meme). Los tonales llevan una reverb corta para que «florezcan». Los **picos de diseño** de la tabla son
**antes de `MASTER_TRIM_DB`** (+3 dB); la columna «Δ QA final» es lo que se subió (o cambió) en la última revisión (hallazgos A2–A7 del QA sobre el MP4
candidato; los ajustes de las pasadas R2/R3 están en «Revisión del QA»). Los que suenan sobre la música llevan además el hueco de −3 dB del stem de música
(salvo la llegada de la amiga, ver arriba).

| Hito | Fotograma | Tiempo | Sonido | Pico de diseño | Δ QA final |
|---|---|---|---|---|---|
| `hook` (`HOOK_TIMING.settle`) | 6 | 0,20 s | **aviso de «mensaje recibido»** (A2): dos notas cortas y redondas, La5 → Re6 (la 2.ª, 0,115 s después), de seno con ascenso de afinación de 5 % en 20 ms, 2.º armónico leve y decaimiento de 85 ms; sin ruido ni transitorio duro; reverb mínima | −17,5 / −19 dBFS | **nuevo** |
| `sendPress` | 702 | 23,40 s | **clic suave** al pulsar ENVIAR (cuerpo ≈300 Hz que baja + «tac» de 1,25 kHz + hálito de ruido) | −15 dBFS | +6 |
| `sendFly` | 712 | 23,73 s | **swoosh corto y suave** (soplo de 0,42 s, 450 → 2100 Hz) | −19 dBFS | +4 |
| (`SEND_TIMING.flyTo`) | 742 | 24,73 s | asentamiento de la burbuja al llegar al hilo (Re5) | −22 dBFS | +4 |
| `indicator` | 756 | 25,20 s | **tics suaves**: «pop» de la burbuja de puntos (La5) y un tic por rebote de punto (Re6 · Mi6 · Fa#6) en f761,3 · 764,4 · 767,6 · 782,3 · 785,4 (el rebote que cae sobre la respuesta se omite) | −26 / −28,5 dBFS | +3 |
| `reply` | 790 | 26,33 s | **LLEGADA DE LA RESPUESTA (momento emocional):** una sola nota cálida tipo gota — Fa#5 (tercera de Re mayor), ataque inmediato, ascenso de afinación de 9 % en ≈25 ms, cuerpo una octava abajo y cola de ≈1,5 s. Breve y discreta: la música nace bajo ella | −14 dBFS (la cima del envío) | +3 |
| `musicIn` | 790 | | entra la música (no suena en `sfx-hilo`) | | |
| `transition` | 900 | 30,00 s | **swell suave** de Si menor, **una octava arriba** (Fa#5 · Si5 · Re6, ataque 0,95 s; aire 760 → 3000 Hz) mientras el naranja se expande: fuera del registro del pad y del piano del Bm7 (A7) | −19 dBFS | +2 y octava arriba |
| `phraseOne` | 935 | 31,17 s | tono grave cálido y breve, Re3 (armónicos 1–3 de 1 · 0,65 · 0,3, ataque suave, no campana); entra con el rodillo de la 1.ª frase (`firstIn` + 5 f; A5) | −16,5 dBFS | f930 → f935 |
| `phraseTwo` | 998 | 33,27 s | ídem, Fa#3 (tercera mayor arriba: «abre»); entra con el rodillo de la 2.ª frase (`secondIn` + 4 f) | −17,5 dBFS | — |
| `reveal` | 1068 | 35,60 s | **soplo suave** (1,5 s, 480 → 2600 Hz) al retirarse el naranja / entrar la ilustración | −22 dBFS | — |
| `companionText` | 1114 | 37,13 s | «pip» redondo Si5 | −20 dBFS | — |
| `friendArrive` | 1154 | 38,47 s | **la silla que rueda** (leve): ruido 150–700 Hz modulado por el giro de las ruedas (4,4 → 1,2 vueltas/s, desacelera) de f1104 (`friendEnterFrom`) a f1154 (−29) + asentamiento de madera al detenerse (golpe grave + «tic» de ruido de 1,8 kHz de 9 ms —antes 5—, que se oye aunque el bajo de la música tape los graves y un parlante de celular no los reproduzca). Sin hueco en la música | −29 / −20 dBFS | +4 / +8 |
| `gesture` | 1180 | 39,33 s | cuerda / campanita mínima, dos notas Mi5 → La5 (+0,16 s); coincide con el tramo más veloz del gesto (A6) y con la resolución re → do# de la música | −19 / −21 dBFS | f1172 → f1180 |
| `signatureOne` | 1240 | 41,33 s | quinta cálida Fa#4 + Do#5 (la tercera de Re, libre en el pad) | −16,5 dBFS | — |
| `logoReveal` | 1254 | 41,80 s | **carillón cálido** discreto, arpegio de La mayor La5–Do#6–Mi6–La6 (aditivo, decaimiento ≈ 2 s, sin ataque metálico) | −17,5 … −23 dBFS (−10,4 con el ajuste general: uno de los picos del stem) | — |
| `signatureTwo` | 1304 | 43,47 s | «pip» Re5 | −18,5 dBFS | +1,5 (ver A6) |
| `finalMessage` | 1420 | 47,33 s | eco de los tonos del giro una octava y media arriba: Re5 + La5 (quinta abierta, decaimiento ≈ 2,4 s) | −15,5 dBFS | — |
| `finalDate` | 1458 | 48,60 s | «pip» Si5 | −20 dBFS | — |
| cierre (compás 8) | 1525 | 50,83 s | eco muy suave del carillón del logo: La5 + Mi6 (quinta y novena de Re mayor 9); no figura en `SFX_CUES` | −24 / −28 dBFS | — |
| `musicOutFrom` | 1530 | | marca para la música (no suena en `sfx-hilo`) | | |

El pico del stem (−10,1 dBFS con el ajuste general) cae en f936 (el Re3 de la 1.ª frase sobre la cola del swell de la transición); la gota de la respuesta (−10,3) y el carillón del
logo (−10,4) quedan a menos de 0,4 dB. La respuesta sigue siendo la cima del envío y la nota que más emerge de su entorno (sube la sonoridad K de la mezcla +12,8 dB, porque la música
todavía no llegó). Los más delicados (silla, tics, pips) quedan por debajo de −16 dBFS en su banda propia.

## Espacio para la voz futura (locución desactivada)

`VOICEOVER.enabled = false`: no hay voz. Para que una voz posterior (frases del giro, firma, mensaje final) no tenga que competir:
- el **pad está una octava más grave** que en la v1, en terceras apiladas, y el piano es escaso y suave en registro medio-grave;
- hay un **«hueco» de ecualización** (campana −4 dB en ≈1,15 kHz, Q 0,6) durante todo el texto en pantalla (se abre recién en el
  último compás, sin texto nuevo);
- la música va **pareja entre compases** (rango 1,1 dB): sin picos de nivel que tapen la voz.

Medido (música sola, f900–f1500): la banda de voz **300–3000 Hz es el 18 % de la energía** (v1: 38 %) y queda en **−23,4 dBFS RMS**
(con el ajuste general de +3 dB y el volumen 1,0 de `Reel.tsx`; antes −26,6): ≈ 3 dB bajo una voz a −20 dBFS RMS, por lo que **con locución
real hay que bajar la música ≈ 6 dB mientras habla** (en `Reel.tsx`); 100–300 Hz concentra el 77 %.

### Parlante de celular (QA A1, informativo: no se tocó el timbre de la música)

Por debajo de ~300 Hz un parlante de celular casi no reproduce. Con un pasa-altos de 300 Hz la mezcla completa queda en **−20,1 LUFS**
(−5,1 LU respecto del rango completo; antes −20,3 y −5,2) según `verify-audio.ts` (pasa-altos de 2.º orden); el QA midió −22,1 LUFS sobre el MP4 con uno de 4.º orden, y un tramo del chat
(f118–612) en −27,6 LUFS. Es el costo, buscado, de dejar la banda de voz libre: la música se siente más baja y «de campanitas» en un celular (el 77 % de su energía está bajo 300 Hz), y los acentos
(pips, carillón, gota de la respuesta; casi todos > 500 Hz) pasan al frente.

- **`MASTER_TRIM_DB` no se sube:** el teclado ya fija el pico de la mezcla en −2,8 dBFS (−2,36 dBFS de muestra, −2,2 dBTP) y no hay limitador de master (la mezcla la hace Remotion). Subirlo exigiría
  primero un limitador a −1 dBTP.
- **Qué se probó y por qué no se aplicó:** una campana ancha de +2,5 dB en 600 Hz (Q 0,7) sobre la música, antes de la normalización por RMS, regenerando todo y midiendo con `audio:verify`:
  celular −20,1 → **−19,4 LUFS (+0,7 LU)**, rango completo sin cambios (−15,0 LUFS), pero la banda 300–3000 Hz de la música pasaba del 18 al 23 % de la energía (−23,4 → −22,4 dBFS) y caía justo sobre la banda
  de los pips y del gesto: el pip de la firma (587 Hz) perdía 1,6 dB de margen sobre la música (+8,0 → +6,4 dB, bajo el mínimo exigido de +8) y la 2.ª frase subía menos la sonoridad K (+1,35 → +1,17 dB, bajo su
  mínimo de +1,2). Sin poder escucharlo (¿«cajoneado» en 600 Hz?), por una ganancia de +0,7 LU en un hallazgo informativo, se prefirió no cambiar el timbre de la música a ciegas.
- **Si la escucha en un celular real confirma que la música «desaparece»:** (1) una campana de +2…+2,5 dB en ≈ 600 Hz sobre el stem de música, antes del limitador y de la normalización por RMS de `buildMusic()`
  (así la sonoridad de la música no cambia: pasa energía de los graves al medio), y +1,5 dB al pip de la firma y a los de 587–659 Hz que queden bajo +8 dB; o (2) bajar el bajo y el sub ≈ 2 dB
  (`target(bass, …)` y `target(sub, …)`). Cualquiera de las dos hay que acompañarla con una escucha y con `npm run audio:verify` (ajustando en `verify-audio.ts` el umbral de la banda de voz,
  hoy ≤ −22 dBFS, si se quiere conservar la locución futura: habría que bajar la música ≈ 8 dB mientras habla).

## Mezcla y volúmenes

La mezcla final la define `Reel.tsx` (volumen de la música: rampa de entrada de 18 f desde la 3.ª revisión, QA A4). `verify-audio.ts` **lee los `volume={…}` de `src/Reel.tsx`** (los evalúa) y
simula la mezcla; mide con `ffmpeg ebur128` (pico real = true peak):

| Escenario | Volúmenes | Sonoridad integrada | Pico real |
|---|---|---|---|
| Antes de la 1.ª revisión (QA del MP4) | ambiente 0,8 → 0,5 → 0 · teclado 1 · música 0 → 0,9 → 0 · sfx 1, stems sin ajuste | −18,5 LUFS (LRA 13,8 LU) | −5,2 dBTP |
| MP4 candidato (antes de A1–A7) | ambiente 0,8 desde el f0 → 0,5 (790 + 60 f) → 0 (últimos 45 f) · teclado 1 · música 0 → 1,0 (790 → 865) → 0 (desde 1530) · sfx 1; stems con +3 dB | −15,1 LUFS (LRA 14,1 LU) | −2,2 dBTP (pico de muestra −2,36 dBFS) |
| **Reel.tsx actual** | ambiente 0,8 desde el f0 → 0,5 (790 + 60 f) → 0 (últimos 45 f) · teclado 1 · música 0 → **1,0** (790 → **808**) → 0 (desde 1530) · sfx 1; stems con +3 dB | **−15,0 LUFS** (LRA 13,6 LU) | **−2,2 dBTP** (pico de muestra −2,36 dBFS) |

- Dentro del objetivo (**−17 … −14 LUFS** integrados) con 2,2 dB de margen de pico real bajo 0 dBFS (1,2 dB bajo −1 dBTP). El pico lo fijan las pulsaciones del
  teclado (f180–f520); en la parte con música el pico de la mezcla queda en ≈ −4,2 dBFS (1,8 dB más abajo). Tras el códec AAC de `npm run render` (Remotion usa 320 kbps por defecto):
  −2,2 dBTP; a 192 kbps (caso pesimista de la verificación) −2,5 dBTP (en la versión anterior una única muestra del «.» de M1 llegaba a −0,6 dBTP), siempre bajo 0 dBFS.
- Por qué +3 dB y música a 1,0: el QA midió la mezcla en −18,5 LUFS con el 82 % de la energía bajo 350 Hz (entre 30 y 50 s): sonaba baja y sin cuerpo en parlantes de celular. El
  ajuste general sube los cuatro stems parejo (balance relativo intacto). La música pasa de 0,9 a 1,0 porque los huecos de −3 dB bajo los acentos le quitan ≈ 0,6 LU de sonoridad integrada
  (sin ese cambio quedaría en ≈ −16,1 LUFS) y en la parte con música el pico de la mezcla tiene ≈ 1,8 dB de margen bajo el del teclado, que es el que fija el pico real.
- Sonoridad a corto plazo (S, ventanas de 3 s): ≈ −22…−26 durante el tipeo, −27 en la duda, −24 con el envío y la respuesta, −14 al entrar la música (antes −16) y −13/−14 hasta el cierre (el contraste
  aire/teclado ↔ música es intencional).
- Los volúmenes > 1 no existen en `<Audio>`: por eso la música ya está en su máximo (1,0) y cualquier ganancia extra tiene que ir en `MASTER_TRIM_DB` (ver «Parlante de celular»).

## Verificación (resultado de la última corrida: `npm run audio:verify` → **VERIFICACIÓN OK, 111 comprobaciones**)

Los umbrales absolutos de pico y RMS de la verificación incluyen el ajuste general (`TRIM = 3`). La corrida anterior (MP4 candidato) daba 100 comprobaciones; las 11 nuevas cubren el aviso del
gancho (arranque, silencio posterior, nivel y sonoridad), la música a pleno hacia f820–835, la resolución re → do# con el gesto, el tic de la llegada de la amiga y el nuevo piso de la secuencia de envío.

- **(a) Formato:** los 4 archivos `pcm_s16le · 48 000 Hz · 2 canales · 16 bit · 53,000000 s · 2 544 000 muestras` (ffprobe); `TOTAL_FRAMES = 1590`.
- **(b) Teclado:** detección **ciega** de onsets (máximo móvil de |HP 1,8 kHz| contra el piso previo, robusta al «arrastre» del borrado):
  128 esperados, **128 detectados, 0 espurios, 0 faltantes**; desvío máximo **0,21 ms** (medio 0,06 ms), muy por debajo de ±1 ms. Silencio
  digital exacto fuera de las ventanas de evento y **desde f616 hasta el final (sin teclado entre f612 y el final)**. ⌫: 1 retroceso por
  fotograma (27 y 25 en 41 f), RMS de la ráfaga a −2,1/−2,3 dB del tipeo, ticks con mediana −7,4/−7,8 dBFS, tecla hundida −3,6/−2,8 dBFS
  (≥ 3 dB sobre los ticks), sin saturar (pico de la ráfaga ≤ −2,5 dBFS). Tipos distinguibles por centroide espectral (espacio < letras < puntuación < ⌫;
  mayúsculas +2 dB de pico). Variación: 1732 pares de pulsaciones aisladas del mismo tipo, correlación máxima 0,92 (ninguna repetida). El desfase de la 1.ª tecla (f118) no cambió.
- **(c) Picos / clipping / continuidad:** ningún stem toca 0 dBFS (picos: ambiente −14,7, teclado −2,8, música −5,5, sfx −10,1 dBFS; rangos objetivo por stem
  actualizados con el ajuste general), 0 muestras al extremo, sin continua, **compatibles con mono** (la suma L+R pierde 0,06–0,8 dB; el ambiente, ruido
  descorrelacionado, 2,0 dB). Sin clics ni discontinuidades en ambiente, música y sfx (detector de 2.ª diferencia; los tics son transitorios de diseño: 12,4× < 14×;
  los huecos de la música son rampas de coseno). Todos terminan en 0 exacto. **Música: silencio digital hasta f790; sfx: primera muestra en f6 (aviso del gancho, a 0,02 ms del hito),
  nada desde f68 y hasta f702 (ENVIAR).** Ambiente: RMS −29,5 dBFS (> −40 desde el primer segundo), «se abre» +1,64 dB en la duda y se aquieta −1,5 dB con la respuesta. Cierre de la música monótono hasta f1590.
- **(d) Alineación de sfx:** los 19 hitos (17 + el aviso del gancho y el tic de la silla) arrancan en su fotograma (tonos, pips, tics, clic, carillón y aviso: 0,1–5,5 ms de latencia del detector;
  el soplo de la ilustración y el swoosh, de ataque lento, nacen en el hito: 85 y 62 ms al 3 % del máximo; el swell de la transición, una octava arriba, alcanza el 10 % del máximo a 0,26 s y el 90 % a
  0,84 s). La frase 1 arranca 5,5 ms después de f935 y el gesto 1,1 ms después de f1180. La silla que rueda queda a −31,3 dBFS en su banda (leve; antes −35,3), el tic de madera a −25,9 dBFS en 1,8 kHz,
  los tics de los puntos a −26,8 dBFS (antes −29,8), los pips a −18 dBFS (−16,9 el de la firma) y el aviso del gancho a −16,7 dBFS en su banda.
- **(e) Música:** raíz del bajo por compás **D – B – G – A – D – G – E – D** como se diseñó; el cruce entre raíz saliente y entrante cae a +2…+13 f
  del inicio de cada compás; la novedad del croma grave (90–260 Hz) centra los 7 cambios a −4…+4,5 f del compás (el pad entra ≈0,4 s antes por
  fundido cruzado; el del 1000 queda a +4,5 f porque la nota de cabecera del piano espera 12 f a la 2.ª frase), 36–52× la mediana estable. **La suspensión resuelve con el gesto (A6):** en f1172 domina el Re4
  (+47,3 dB sobre el Do#4) y en f1194 el Do#4 (+20,9 dB sobre el Re4). **A pleno hacia f820–835 (A4):** RMS de la música en la mezcla a −0,3 dB del compás 2 (y a −13,3 dB en f798–805: sigue entrando de a poco, la gota suena primero).
  Banda de voz 300–3000 Hz: 18 % de la energía, −23,4 dBFS (ver arriba).
- **(f) Mezcla simulada:** −15,0 LUFS integrados (rango objetivo −17…−14), −2,2 dBTP (límite −1,5), con los volúmenes de `Reel.tsx`; tras AAC a 320 kbps −2,2 dBTP
  y a 192 kbps −2,5 dBTP (< 0); celular (pasa-altos 300 Hz) −20,1 LUFS (≥ −20,5: se vigila que no empeore). Confirmado con el render de audio de Remotion (arriba): −15,0 LUFS, −2,2 dBTP, desfase 0.
- **(h) Audibilidad:** dos medidas por hito. **En su banda** (1/3 de octava del acento, ventana de 170 ms, sfx vs música × volumen de `Reel.tsx`): todos los tonales superan
  a la música entre +8,3 dB (el pip de la firma antes del ajuste de A6; ahora +9,8) y +35 dB (Fa#3), mínimo exigido +8 dB; el swell de la transición queda +16,4 dB sobre la música en su banda (antes +1,1 dB) y el aviso del gancho
  y la respuesta suenan antes de que la música llegue. **En sonoridad ponderada K** (BS.1770, 400 ms desde el hito, cama = ambiente + teclado + música): cuánto sube la sonoridad al sumar el acento.
  Tabla antes (stems del MP4 candidato, cronograma anterior: frase 1 en f930, gesto en f1172) → ahora, en dB:

  | Hito | En banda antes → ahora | Sonoridad K antes → ahora | Con pasa-altos de celular antes → ahora |
  |---|---|---|---|
  | `hook` 6 (aviso; solo aire debajo) | — → +171,9 (sin música) | — → +7,11 | — → +10,8 |
  | `reply` 790 (sin música) | (sin música) → (sin música) | +10,05 → **+12,83** | +13,2 → +16,1 |
  | `transition` 900 | +1,1 → **+16,4** (banda de 494 a 740 Hz: una octava arriba) | +0,02 → +0,01 (mide solo los primeros 400 ms del swell de 0,95 s de ataque) | +0,14 → +0,06 |
  | `phraseOne` 930 → 935 | +25,8 → +29,5 | +1,96 → +2,09 | +4,4 → +5,5 |
  | `phraseTwo` 998 | +34,6 → +34,6 | +1,34 → +1,35 | +0,9 → +0,9 |
  | `reveal` 1068 | +2,8 → +2,8 (banda ancha) | +0,07 → +0,07 | +0,2 → +0,2 |
  | `companionText` 1114 | +18,4 → +18,5 | +0,20 → +0,21 | +1,2 → +1,3 |
  | `friendArrive` 1154 (tic 1,8 kHz) | +9,9 → **+20,2** | +0,00 → +0,02 | +0,01 → +0,04 |
  | `gesture` 1172 → 1180 | +24,2 → +21,7 | +1,19 → +1,41 | +3,5 → +3,8 |
  | `signatureOne` 1240 | +10,3 → +9,5 | +0,65 → +0,64 | +2,4 → +2,0 |
  | `logoReveal` 1254 | +28,6 → +25,9 | +2,12 → +2,07 | +7,0 → +6,3 |
  | `signatureTwo` 1304 | +14,0 → +9,8 (+8,3 sin el +1,5 dB al pip) | +0,37 → +0,48 | +0,9 → +1,1 |
  | `finalMessage` 1420 | +19,0 → +19,0 | +0,81 → +0,82 | +2,9 → +2,9 |
  | `finalDate` 1458 | +19,3 → +19,4 | +0,22 → +0,22 | +1,0 → +1,0 |
  | `cierre` 1525 | +15,4 → +15,5 | +0,31 → +0,31 | +0,9 → +0,9 |

  Los cambios de ±1…3 dB en `gesture`, `signatureOne`, `logoReveal` y `signatureTwo` no son un cambio de nivel de esos acentos: al mover 8 f la resolución del gesto, el vibrato lento del pad (3 voces desafinadas) cae
  en otra fase y cambia el contenido de la música en la banda de cada acento (el Do#4 del pad aporta un 2.º armónico de 554 Hz junto al Re5 del pip de la firma: de ahí el +1,5 dB al pip).
  La sonoridad K de un «pip» de 75 ms en una ventana de 400 ms sube poco por naturaleza (por eso la medida decisiva para los pips es la de su banda); la respuesta sigue siendo, por lejos,
  el acento que más emerge. Los pasos de la amiga (los graves de la silla caen bajo el bajo de la música) quedan **leves por diseño**: se distingue sobre todo el tic de 1,8 kHz.
  **Secuencia de envío (QA A3):** picos del stem por tramo, antes → ahora: clic −18,0 → **−12,0** · swoosh −20,1 → **−16,1** · asentamiento −23,0 → **−19,0** · puntos −26,0 → **−23,0** · respuesta −13,3 → **−10,3** dBFS
  (todo el envío bajo la gota, con 1,7 dB de margen); letras del teclado: mediana −5,8 dBFS (el clic queda 6,2 dB bajo una tecla; antes 12,2 dB). Sonoridad momentánea máxima (K, 400 ms): tecleo −18,8 LUFS,
  envío −25,9 → **−24,5 LUFS** (Δ respecto del tecleo −7,1 → −5,7 dB; en celular −28,2 → −26,0 LUFS): lo que suena en el envío sigue siendo un aire con acentos, no una ráfaga de teclas, pero ya se mueve el medidor.
  **Gancho (QA A2):** el aviso de «mensaje recibido» tiene un pico de −14,1 dBFS en el stem y sube la sonoridad momentánea de la mezcla de **−28,4 LUFS (solo aire) a −21,6 LUFS** en f0–f118 (el tecleo
  llega a −18,8 LUFS): de la sonoridad de un tecleo suave, no de una notificación fuerte; en celular +10,8 dB sobre el aire.
- **(g) Espectrogramas** (`ffmpeg showspectrumpic`, incluidos acercamientos del tipeo/borrado, de la duda + envío + respuesta, de los acentos
  de 29,5 a 47,5 s y del cierre) revisados a ojo: sin ruido de banda ancha extraño ni siseo agudo, glissandos y swells limpios, teclas como
  impulsos bien separados, ráfaga de borrado con el arrastre visible entre 0,5 y 1 kHz, pausa de la duda y del envío sin nada salvo aire, swoosh y asentamiento visibles en
  el envío, entrada de la música desde f790, cierre sin cortes. Para esta revisión se miraron además a ojo acercamientos de f0–f135 (las dos notas del aviso del gancho, limpias y sin nada más), de f675–f1035 (clic, swoosh, asentamiento,
  puntos, la gota y la entrada de la música) y de f870–f1110 (el swell de la transición).
- **Límite de la verificación:** son comprobaciones objetivas; **el audio NO fue escuchado por ninguna persona** (ni con auriculares ni en un parlante de celular).

## Reemplazar por material real o licenciado

1. **Música licenciada:** pasarla a un WAV de 53 s, 48 kHz, estéreo, con silencio hasta el f790 y cierre suave:
   ```bash
   ffmpeg -i musica-licenciada.wav -af "adelay=26333|26333,apad,atrim=0:53,afade=t=in:st=26.333:d=1.8,afade=t=out:st=51:d=2" \
     -ar 48000 -ac 2 -c:a pcm_s16le public/audio/musica.wav
   ```
   (`26333` ms = f790; el resultado dura exactamente 53,000 s). Si la música entra en otro momento, cambiar `SEND_TIMING.replyIn` en `timeline.ts`.
   Ajustar el volumen en `Reel.tsx` según la sonoridad (objetivo −17 … −14 LUFS integrados; la rampa de entrada de 18 f de `Reel.tsx` convive con el swell propio del stem sintetizado: con una pista
   licenciada que ya entre con su propio fundido, alargarla); un stem reemplazado **no** lleva el +3 dB de `MASTER_TRIM_DB` ni los huecos de −3 dB bajo los acentos
   (habría que aplicarlos en la edición).
2. **Teclado real:** grabar o editar un teclado a los tiempos de `KEY_EVENTS` (`node -e "import('./src/config/typing.ts').then(m=>console.log(m.KEY_EVENTS))"`)
   y exportarlo con el mismo formato/duración, **con silencio desde f612 hasta el final** (pausa de la duda y del envío). Mantener `public/audio/teclado.wav`.
3. **Ambiente de consultorio / sfx:** reemplazar `ambiente.wav` o `sfx-hilo.wav` con el mismo formato (53 s alineados; sfx: el aviso del gancho en f6 y nada más hasta f702).
4. **Locución:** exportar un stem de 53,000 s (2 544 000 muestras, 48 kHz, estéreo) con las frases en f930 (31,0 s), f994 (33,1 s) y la firma en f1240 (41,3 s)
   y silencio en el resto (referencia: `VOICEOVER.cues`), guardarlo como `public/audio/locucion.wav` y poner `VOICEOVER.enabled = true` en
   `src/config/timeline.ts` (`Reel.tsx` lo monta desde el f0). Texto en `src/config/script.ts`; la pronunciación de «ADIP» queda a confirmar con el equipo.
   Ver «Espacio para la voz futura» para el ducking recomendado.
5. Después de reemplazar, `npm run audio:verify` sigue sirviendo para (a), (c), (d) y (g) (los chequeos (b) de onsets, (e) y (h) fallarán si el teclado/la
   música ya no son los sintetizados: es esperable).

No volver a ejecutar `npm run audio` si ya se reemplazó algún stem: **sobrescribe los cuatro** archivos.

## Revisión del QA sobre el MP4 (hallazgos R1–R3 y A1–A7) y cronograma ajustado

### Pasada R1–R3 (historial)

El coordinador reajustó los tiempos de `timeline.ts` (la 2.ª frase suena en f998 = `secondIn` + 4; el soplo de la ilustración en f1068; la amiga entra en f1104, llega en f1154 y hace el gesto
en f1172; el texto en f1114; la firma en f1240, el logo en f1254; el mensaje final en f1420 y la fecha en f1458). Los stems se regeneraron con esos hitos y se actualizaron
los comentarios y las notas de la música atadas a un evento. Además (las cifras son las de aquella pasada; las vigentes están en «Mezcla y volúmenes» y en la tabla (h)):

| Hallazgo | Qué se hizo | Resultado medido entonces |
|---|---|---|
| **R1** — mezcla baja (−18,5 LUFS, −5,3 dBTP; 82 % de la energía bajo 350 Hz) | `MASTER_TRIM_DB = 3` en `writeStem()` (los cuatro stems, balance relativo intacto); música de 0,9 a 1,0 en `Reel.tsx` (compensa los huecos de −3 dB); umbrales de pico/RMS por stem y rango objetivo de `verify-audio.ts` ahora −17…−14 LUFS | −15,1 LUFS, −2,2 dBTP; celular (pasa-altos 300 Hz) −20,3 LUFS (antes −23,8) |
| **R2** — el envío (clic f702, swoosh f712, asentamiento f742, puntos f756–790) casi no se oía | swoosh −27 → −23 dBFS y asentamiento (Re5) −33 → −26 dBFS; clic (−21) y tics del indicador sin tocar; todo el envío bajo la gota (−17) | swoosh −20,1 dBFS, asentamiento −23,0 dBFS (con el ajuste general), respuesta −13,3 dBFS; la gota sube la sonoridad K +10 dB (el QA final volvió a medir el envío como el tramo más suave: ver A3) |
| **R3** — acentos tapados por la música | +2…+6 dB a cada acento y hueco de −3 dB / 250 ms bajo cada uno en el stem de música; el soplo y los pasos de la amiga, apenas más presentes; los armónicos 2.º y 3.º de los tonos cálidos suben (0,65 y 0,3) para que se lean en un parlante de celular | todos los acentos ≥ +10 dB sobre la música en su banda y suben la sonoridad K de la mezcla (tabla (h)) |

### QA final sobre el MP4 candidato (hallazgos A1–A7)

Un QA independiente midió el audio del MP4 candidato (el mismo del repositorio: desfase 0 muestras, residuo −57,9 dB respecto de la suma de los stems; **nadie escuchó el audio**). El coordinador ya había movido en `timeline.ts`
dos hitos: `SFX_CUES.phraseOne` = `TURN_TIMING.firstIn` + 5 (f935; A5) y `SFX_CUES.gesture` = `COMPANION_TIMING.gestureAt` + 8 (f1180; A6). Todo lo que depende de ellos se recalcula con `npm run audio`; lo
atado a mano (comentarios, notas del arpegio, tablas de este documento) se revisó. Qué se hizo con cada hallazgo:

| Hallazgo | Qué se hizo | Resultado medido (antes → ahora) |
|---|---|---|
| **A1** (informativo) — en celular el reel baja a −22 LUFS; la música concentra energía en graves | Sin cambios de timbre ni de `MASTER_TRIM_DB` (el teclado fija el pico en −2,8 dBFS y no hay limitador de master); se probó una campana de +2,5 dB en 600 Hz y se descartó; receta y números en «Parlante de celular» | celular −20,3 → −20,1 LUFS (pasa-altos de 2.º orden de `verify-audio.ts`); rango completo −15,1 → −15,0 LUFS; **pendiente de escucha real** |
| **A2** — el gancho (f0–f100) no tiene ningún evento sonoro audible | aviso de «mensaje recibido» en `sfx-hilo`: dos notas redondas (La5 → Re6) en f6 (`HOOK_TIMING.settle`, importado en `build-audio.ts`), −17,5 / −19 dBFS de diseño; el desfase de la 1.ª tecla (f118) no se toca | sonoridad momentánea de la mezcla en f0–f118: −28,4 (solo aire) → −21,6 LUFS (tecleo: −18,8); +10,8 dB en celular; sfx en silencio digital de f68 a f702 |
| **A3** — el envío (clic f702, swoosh f712–742, asentamiento f742, puntos f756–790) es el tramo más suave del chat | clic +6 dB (−21 → −15), swoosh +4 (−23 → −19), asentamiento +4 (−26 → −22), puntos +3, y la gota de la respuesta +3 (−17 → −14) para que siga siendo la cima: con el clic subido, todo el envío tenía que quedar bajo ella; el timbre no cambia | picos del stem: clic −18,0 → −12,0 · swoosh −20,1 → −16,1 · asentamiento −23,0 → −19,0 · puntos −26,0 → −23,0 · respuesta −13,3 → −10,3 dBFS; sonoridad momentánea del envío −25,9 → −24,5 LUFS (Δ vs. tecleo −7,1 → −5,7 dB) |
| **A4** — la música llega tarde y con un valle a «Estoy acá. Te escucho.» (f790–892) | `Reel.tsx`: rampa de entrada de la música de `musicIn` + 75 a `musicIn` + 18 f; `build-audio.ts`: swell del stem de 1,8 → 1,4 s (`MUSIC_SWELL_S`) | música en la mezcla (RMS re compás 2): f820–835 −7,3 → **−0,3 dB** (a pleno entre f820 y f835); sonoridad momentánea entre f796 y f870: mínimo −23,6 → −17,4 LUFS; la gota sigue +12,8 dB sobre su entorno y la música no toca el clic (f702) |
| **A5** — el sonido de la 1.ª frase (f930) adelantaba 5 f al primer texto visible | resuelto en `timeline.ts` (f935); regenerado | arranca +5,5 ms después de f935; SNR en banda +25,8 → +29,5 dB; hueco de la música movido a f935 |
| **A6** — el campanilleo del gesto (f1172) sonaba antes de que la mano se mueva | resuelto en `timeline.ts` (f1180); la resolución re → do# de la música (`SUS_RESOLVE`), el Do#4 / Mi4 / La4 del arpegio y el hueco del gesto se mueven solos; el Do#4 del piano dura 3,9 s (no pisa el pip de f1304); el pip de la firma +1,5 dB | arranca +1,1 ms después de f1180; en f1172 domina el Re4 (+47,3 dB) y en f1194 el Do#4 (+20,9 dB); pip de la firma +14,0 → +9,8 dB sobre la música (+8,3 sin el ajuste: el vibrato del pad cae distinto al mover la resolución) |
| **A7** — la llegada de la amiga (f1154) y la transición (f900) casi no se oyen, y la música hace un hueco sin causa | tic de madera de la silla +8 dB (−28 → −20; dura 9 ms en vez de 5) y rodar +4 dB; **`friendArrive` fuera de `DUCK_CUES`** (su tic vive en 1,8 kHz, donde la música no tiene energía); swell de la transición una octava arriba (Fa#5 · Si5 · Re6) y +2 dB | tic en su banda +9,9 → **+20,2 dB** sobre la música; swell +1,1 → **+16,4 dB**; la música a f1155: −3,6 → −0,7 dB (la única bajada que queda, −4,4 dB en f1180, coincide con el gesto, que sí se oye) |
| limpieza | se quitó la constante local sin uso `bump` de `build-audio.ts` | — |

## Pendiente

- **Escucha humana** (auriculares y parlante de celular real): ninguna comprobación de este documento reemplaza el oído. Lo más importante de escuchar: que el aviso del gancho suene a «mensaje recibido» y no a una
  notificación ajena al reel; que la gota de la respuesta con la música entrando 8 f después se sienta como un solo gesto; que el swell una octava arriba de la transición no suene a destello; y el nivel de la música en celular (A1).
- Si habrá **locución**: ver «Espacio para la voz futura» (bajar la música ≈ 6 dB mientras habla).
- Hito propio para el aviso del gancho: hoy usa `HOOK_TIMING.settle` directamente; si se prefiere un `SFX_CUES.hook` en `timeline.ts` (archivo del coordinador), el cambio en `build-audio.ts` es de una línea.

## Cambios respecto de la v2 (38 s)

- Duración 38 → **53 s** (1590 f) en los 4 stems; hitos de `SFX_CUES` v3 (`threadBorn`, `cameraPullOut`, `widen`, `friendSits`, `subtitleUnits` y `CURSOR_HANDOFF` ya
  no existen; entran `sendPress`, `sendFly`, `indicator`, `reply`, `transition`, `reveal`, `friendArrive`, `gesture`, `signatureOne/Two`, `finalDate`).
- Teclado: tres mensajes (M3 no se borra: se envía); borrado de 1 carácter por fotograma (27 y 25 retrocesos), sin teclado desde f612; ENVIAR pasa a ser un acento de sfx.
- Ambiente: −32,5 dBFS de diseño (v2: −34,5); se abre en la duda de f612–f702 y se aquieta con la respuesta (v2: se abría antes de la música).
- Música: entra en f790 con la respuesta (v2: f410), 8 compases con cambios en 790, 895, …, 1525, pad en terceras apiladas sin pedal (sin segundas graves), resolución
  ii → I con fundido propio desde f1530; banda 300–3000 Hz: 18 % de la energía (v2: 23 %).
- Acentos nuevos: aviso de «mensaje recibido» del gancho, clic de ENVIAR, swoosh de la burbuja, tics de «Amiga escribe», gota de la respuesta, soplo de la ilustración, silla que rueda, quinta de la firma,
  eco del carillón en el cierre; todos medidos contra la música (tabla (h)).
- Verificación: onsets de teclado con 1 evento por fotograma, ráfaga de borrado sin saturar, pausa hasta el final, cambios armónicos (croma grave + cruce de raíces),
  audibilidad de los acentos sobre la música (en su banda y en sonoridad K), secuencia de envío, aviso del gancho, música a pleno hacia f820–835, resolución re → do# con el gesto, compatibilidad mono, parlante de celular, AAC a 320 y 192 kbps, 111 comprobaciones (v2: 75).
