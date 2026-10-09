# Audio del reel v3 — «El mensaje que borraste» (53 s)

> **Estado: PROVISORIO (versión de revisión, sintetizado por código).** Los cuatro stems de `public/audio/` se generan con
> `scripts/build-audio.ts` y sirven para cerrar la edición con sonido sincronizado. Se pueden reemplazar, uno por uno, por
> **música licenciada** y/o **grabación real** (teclado, ambiente de consultorio, locución) sin tocar la animación (ver
> «Reemplazar»). Sin locución (`VOICEOVER.enabled = false`): el sentido completo se entiende sin sonido.
> **El audio NO fue escuchado por ninguna persona** (ni el de esta revisión ni el de las anteriores): todo lo de abajo son
> comprobaciones objetivas —números, detectores y espectrogramas—, no un juicio de oído. Antes de publicar hace falta una escucha
> humana, con auriculares y en un parlante de celular real (ver «Parlante de celular» y «Pendiente»).
> Última pasada: **S1–S7** (verificación final independiente del MP4 entregable: sincronía del swoosh del envío, del soplo del reveal y del swell de la transición, aviso del gancho,
> huecos de la música, 2.ª frase en celular): ver «Pasada S1–S7». Todas sus cifras son **mediciones sobre los stems y la mezcla simulada** (y fotogramas renderizados para ubicar el
> movimiento); **ninguna persona escuchó el resultado**.

## Origen y licencias

- **100 % sintetizado por código** en `scripts/build-audio.ts`: ruido pseudoaleatorio sembrado, osciladores (aditivos y FM),
  filtros biquad, envolventes y reverb de Schroeder/Freeverb. **Sin samples, sin bancos de sonidos, sin librerías ni dependencias
  de audio de terceros.** No queda ningún permiso de terceros pendiente.
- **Determinista:** PRNG `mulberry32` con semilla fija por stem (`src/lib/rng.ts`). Regenerar produce archivos idénticos byte a
  byte (comprobado con `md5sum` en dos corridas).
- Los tiempos salen de `src/config/timeline.ts` (`SFX_CUES`, `SEND_TIMING`, `HOOK_TIMING`, `COMPANION_TIMING`, `MESSAGE_SPECS`) y las teclas de
  `src/config/typing.ts` (`KEY_EVENTS`): si cambia el cronograma, se regenera y el audio sigue alineado. El aviso del gancho no tiene hito propio en
  `SFX_CUES`: se coloca en `HOOK_TIMING.settle + 9` = **f15** (0,5 s; `HOOK_AUDIO_DELAY` en `build-audio.ts`, copiado en `verify-audio.ts`). Las notas de la música atadas
  a un evento (la suspensión de la llegada de la amiga y su resolución con el gesto, la nota de la ilustración) se calculan desde
  `SFX_CUES`; los cambios de armonía cada 105 f desde `musicIn` son independientes de los hitos. Los números de fotograma de los comentarios y de
  las tablas de este documento son los de `timeline.ts` actual (frase 1 en f935 = `firstIn` + 5, gesto en f1180 = `gestureAt` + 8, soplo del envío en f715 = `flyFrom` + 3, soplo del reveal en f1076 = `wipeOutFrom` + 8; el swell de la transición, en f893 =
  `TRANSITION_TIMING.from` + 1, no sale de `SFX_CUES` sino de esa constante, copiada en `verify-audio.ts`): si se mueve un hito, hay que revisarlos. Dependencias fuera
  de `src/config`: el período de rebote de los tres puntos (21 f, `THREAD_FX.dotsPeriod` en `src/chat/geometry.ts`), copiado en
  `build-audio.ts` y `verify-audio.ts` (si el chat lo cambia, actualizar ambos), y la curva del vuelo de la burbuja (`EASE_IO = Easing.bezier(0.5, 0, 0.2, 1)` en `src/chat/state.ts`), copiada solo en
  `verify-audio.ts` (`FLY_EASE`) para comprobar la sincronía del swoosh sin renderizar.
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
| 0 – 118 | 0 – 3,9 s | aire de habitación (audible desde el f0) y, en **f15** (`HOOK_TIMING.settle` + 9, 0,5 s: a los 0,2 s varios reproductores todavía no arrancaron el audio), un **aviso suave de «mensaje recibido»** (dos notas cortas, La5 → Re6); se apaga hacia f77, 41 f antes de la primera tecla (f118) |
| 118 – 612 | 3,9 – 20,4 s | **teclado** sincronizado con la escritura de M1 y M2 (se sostienen ≈ 3 s: teclado en silencio digital) y los **dos borrados** (ráfagas de 27 y 25 retrocesos en f272–312 y f478–518), luego M3 (f534–612) |
| **612 – 702** | **20,4 – 23,4 s** | **PAUSA de la duda**: ni una tecla, ni sfx, ni música. Solo aire; el aire «se abre» (apenas). El teclado **no vuelve a sonar** hasta el final |
| 702 – 756 | 23,4 – 25,2 s | ENVIAR (clic suave, f702), la burbuja enviada (**soplo f715–f733, centrado en f724 = la velocidad máxima de la burbuja**; asentamiento en f742): los tres, más presentes que en la versión anterior (QA A3), todos bajo la gota de la respuesta |
| 756 – 790 | 25,2 – 26,3 s | «Amiga escribe»: pop + tics suaves de los tres puntos |
| **790** | **26,33 s** | **llega «Estoy acá. Te escucho.»**: nota cálida tipo gota (Fa#5) y **entra la música** (swell de 1,4 s + rampa de 18 f de `Reel.tsx`: a pleno entre f820 y f835); el aire se aquieta |
| 790 – 1590 | | música en compases de 105 f (cambios armónicos en 790, 895, 1000, 1105, 1210, 1315, 1420, 1525) con los acentos de `SFX_CUES`; solo **las frases del giro (f935, f998), la firma con el logo (f1240–f1254) y el bloque 2 (f1304)** abren un hueco de ≈ −2 dB en la música |
| 893 – 965 | 29,8 – 32,2 s | **swell de la transición** (Fa#5 · Si5 · Re6): nace con la salida del chat (f893), llega a su nivel en f907 mientras el naranja de la burbuja se expande y se relaja desde f929, bajo la frase 1 |
| 1076 – 1112 | 35,9 – 37,1 s | **soplo brillante del reveal** (700 → 3600 Hz): nace con el primer cambio visible del retiro del naranja (f1078), pico en f1091, muere al terminar el barrido (f1108) |
| 1525 – 1590 | 50,8 – 53 s | resolución calma (Re mayor 9) que se desvanece sin corte hasta el último fotograma |

## Stems

Valores medidos sobre los archivos (ya con `MASTER_TRIM_DB`):

| Stem | Qué es | Pico | RMS | Sonoridad (stem solo) |
|---|---|---|---|---|
| `ambiente.wav` | Aire de habitación: ruido marrón/rosa filtrado + banda de «aire» (≈1–3 kHz, sin siseo agudo); nivelado a ±0,5 dB; entra en 30 ms (anti-clic) y sale en 0,6 s | −14,7 dBFS | **−29,5 dBFS** | −27,5 LUFS |
| `teclado.wav` | 128 pulsaciones exactas (una por `KEY_EVENTS`) + «arrastre» del borrado; silencio digital entre ellas y **desde f616 hasta el final** | −2,8 dBFS | −31,5 dBFS | −22,3 LUFS |
| `musica.wav` | Piano eléctrico/felt suave + pad + bajo + sub, con reverb sintética y un hueco de −1,3 … −2 dB bajo cuatro acentos (cinco con el logo); **silencio digital hasta f790** | **−5,5 dBFS** (antes −5,5) | −18,5 dBFS (antes −18,8) | −13,4 LUFS (antes −13,7) |
| `sfx-hilo.wav` | Acentos en los hitos de `SFX_CUES` y `HOOK_CUE` (tabla de abajo); **silencio digital hasta f15, y de f77 a f702** (solo suena el aviso del gancho antes de ENVIAR) | −9,7 dBFS (antes −10,1) | −31,4 dBFS (antes −32,0) | −23,2 LUFS (antes −24,0) |

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
| 2 | 895–1000 | Bm7 (Si) | La3 · Re4 · Fa#4 | salida del chat y swell (893), barrido del naranja (900) y 1.ª frase (935) |
| 3 | 1000–1105 | Gmaj7(9) (Sol) | Si3 · Re4 · Fa#4 · La4 | 2.ª frase (998): «se abre»; el naranja se retira y entra la ilustración (soplo 1076; primer cambio visible 1078) |
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
  respire su acento; Fa#4 y La4 de la ilustración a 4 y 20 f del `reveal` (f1080 y f1096: **siguen en los mismos fotogramas de antes** al pasar el soplo de f1068 a f1076 —el Fa#4 de f1080 ya era la marca audible del
  retiro del naranja, 2 f después de su primer cambio visible; a 12 f del hito nuevo, f1088, habría llegado ≈ 10 f tarde— y el La4 cae a mitad del barrido); la suspensión Re4 del compás 4 con la llegada de la amiga
  (1152; el Re4 del pad dura hasta el gesto) y su resolución Do#4 con el gesto (pad: 1180; piano: 1184, de 3,9 s para apagarse antes del «pip» de f1304),
  seguida de un arpegio de La mayor (Mi4 1198, La4 1206); el Fa#4 posterior al logo (1272); el Fa#4 posterior a la fecha (1470);
  la melodía final desde el 1492 (la composición final está completa desde `CLOSING_TIMING.allVisible` = 1498). Al pasar el gesto de f1172 a f1180 (QA A6)
  todo esto se movió 8 f solo (se calcula desde `SFX_CUES.gesture`); medido: en f1172 domina el Re4 (+47,3 dB sobre el Do#4) y en f1194 el Do#4 (+20,9 dB sobre el Re4).
- Capas: piano (arpegios lentos y escasos, 3–6 notas por compás, humanización ±6 ms / ±8 % de velocidad; las notas de cabecera
  de compás quedan exactas, con un «tic» de fieltro de 3–6 kHz que le da definición en parlantes de celular), pad (3 voces
  desafinadas con vibrato lento, una octava más grave que en la v1), bajo (octava sobre el sub, 2.º armónico mínimo) y sub.
  Reverb Freeverb (RT ≈ 2 s, amortiguada, envío sin graves). Limitador de picos a −8,5 dBFS de diseño (−5,5 ya con el ajuste general; reducción máxima 2,6 dB).
- **Huecos bajo los acentos (QA R3, ajustados en la pasada S7):** la música concentra casi toda su energía en graves y tapaba los acentos. Después del limitador, el stem baja bajo los acentos
  que más lo necesitan: 80 ms antes (llega ya abajo), **250 ms sostenido** y vuelta de 350 ms con coseno; dos acentos seguidos (firma f1240 y logo f1254) se funden en un solo hueco (nunca más hondo que
  el mayor de los dos). Va en el stem, no en `Reel.tsx` (parámetros `DUCK_*` y `DUCK_CUES` de `build-audio.ts`). No cambia el pico del stem.
  **Antes (R3 → A7):** −3 dB bajo 11 acentos (frases, soplo de la ilustración, pip del texto, gesto, firma, logo, bloque 2, mensaje final, fecha y eco del cierre; uno cada ≈ 2 s). **La verificación final
  (S7) midió 3,4–5,2 dB de caída real a 100 ms** (3,0–4,7 con la métrica de `verify-audio.ts`): el hueco SUMA la variación natural de la música (cambio de acorde, notas del piano que se apagan: de −0,9 a +1,7 dB)
  → riesgo de bombeo. **Ahora:** `DUCK_DB = −2` dB y hueco solo bajo **las dos frases del giro, la firma (con el carillón del logo fundido en el mismo hueco, de f1238 a f1273) y el bloque 2**: 4 huecos
  independientes en vez de 11. Profundidad por hueco: −1,7 dB en f935 y −2 dB en la firma y el logo (la música baja sola 1,0–1,1 dB), −1,3 dB en f998 y f1304 (baja sola 1,7 dB). Se quitó donde el acento ya
  sobresale ≥ +15 dB en su banda o vive donde la música no tiene energía: el soplo de la ilustración (ahora en 2–4 kHz), el pip del texto, el gesto (su propia resolución re → do# ya baja la música 1,5 dB),
  el mensaje final (el cambio a Em9 SUBE la música 0,9 dB), la fecha y el eco del cierre; lo que quedó justo en sonoridad K sin hueco subió de nivel (ver la tabla de hitos). **Caída medida a 100 ms** (RMS de
  100 ms antes del hueco, f−0,25…−0,15 s, contra la ventana de 100 ms más baja entre −0,05 y +0,35 s; incluye la variación natural), antes → ahora, en dB: f935 4,1 → **2,8** · f998 4,5 → **2,9** ·
  reveal (f1068 → f1076) 3,9 → 2,3 (**sin hueco**: es solo la caída natural del compás 3) · pip del texto f1114 3,0 → 0,1 · gesto f1180 4,5 → 1,5 · firma f1240 3,5 → 2,6 · logo f1254 1,2 → 1,2 ·
  bloque 2 f1304 4,7 → **3,0** · mensaje final f1420 1,8 → −0,9 · fecha f1458 3,5 → 0,5 · eco del cierre f1525 2,4 → −0,3. Máximo con hueco: 3,0 dB (verificado ≤ 3,2); sin hueco, el máximo es la variación
  natural de 2,3 dB (≤ 2,5). El swell de la transición (f893) no lleva hueco (dura 2,4 s y se mezcla sin taparse) y la respuesta (790) suena antes de la música.
  **La llegada de la amiga (1154) ya no abre hueco (QA A7):** su «tic» de madera vive en 1–3 kHz, donde la música casi no tiene energía, así que el hueco no le daba
  nada y solo se oía como un bajón de la música sin causa.
- **Entrada (QA A4):** swell de 1,4 s (antes 1,8 s; pad/bajo/sub desde el silencio, piano desde 35 %); `Reel.tsx` suma su rampa de 18 f (790 → 808; antes 75 f, 790 → 865).
  RMS del stem: −30,1 dBFS en f790–805, −14,8 dBFS en f835–850. **En la mezcla** (stem × volumen de `Reel.tsx`), respecto del RMS del compás 2 (−16,1 dBFS):
  f798–805 −13,3 dB · f805–815 −4,5 dB · f815–820 −2,5 dB · **f820–835 −0,3 dB** (antes: −27,1 · −17,5 · −13,4 · −7,3 dB, y recién a pleno en f850–865). Sonoridad momentánea de la mezcla
  (K, 400 ms) entre f796 y f870: mínimo **−17,4 LUFS** (antes −23,6 LUFS en f808, el «valle» tras la gota); a f820 −14,2 LUFS (antes −21,2). La gota (Fa#5, la tercera de Re) es
  consonante con el acorde que entra (Dmaj7) y suena sola solo unos 8 f; sigue siendo la cima (+12,8 dB de sonoridad K sobre su entorno).
- **Nivel por compás:** parejo (RMS −16,0 … −14,8 dBFS entre el 2.º y el 7.º: rango 1,2 dB; antes −16,3 … −15,2, 1,1 dB: menos huecos, algo más de nivel medio).
- **Cierre:** fundido propio de coseno desde f1530 que termina en 0 exacto en la última muestra; `Reel.tsx` suma el suyo (lineal)
  desde `musicOutFrom` (f1530). RMS por tramo: −14,1 (f1525–45; antes −15,9, sin el hueco del eco) → −17,8 → −23,7 → −38,4 dBFS: monótono, sin corte seco.

### sfx-hilo.wav — hitos (`SFX_CUES` y `HOOK_TIMING.settle`)

Acentos cálidos (sin whooshes de meme). Los tonales llevan una reverb corta para que «florezcan». Los **picos de diseño** de la tabla son
**antes de `MASTER_TRIM_DB`** (+3 dB); la última columna es lo que cambió en la pasada **S1–S7** (verificación final del MP4 entregable; los ajustes de las pasadas anteriores —R2/R3 y A2–A7—
están en «Revisión del QA»). Los frames y segundos son los de `timeline.ts` actual. Solo las frases del giro, la firma con el logo y el bloque 2 llevan además un hueco de la música (ver arriba).

| Hito | Fotograma | Tiempo | Sonido | Pico de diseño | Pasada S1–S7 (antes → ahora) |
|---|---|---|---|---|---|
| `hook` (`HOOK_TIMING.settle` + 9) | **15** | **0,50 s** | **aviso de «mensaje recibido»** (A2): dos notas cortas y redondas, La5 → Re6 (la 2.ª, 0,115 s después), de seno con ascenso de afinación de 5 % en 20 ms, 2.º armónico leve y decaimiento de 85 ms; sin ruido ni transitorio duro; reverb mínima | **−15 / −16,5 dBFS** | S4: f6 (0,20 s) → **f15**; +2,5 dB (pico del stem −14,1 → −11,6 dBFS) |
| `sendPress` | 702 | 23,40 s | **clic suave** al pulsar ENVIAR (cuerpo ≈300 Hz que baja + «tac» de 1,25 kHz + hálito de ruido) | −15 dBFS | — |
| `sendFly` (`flyFrom` + 3) | **715** | **23,83 s** | **soplo del vuelo de la burbuja** (0,62 s, 450 → 2300 Hz, máximo a mitad: f724,3); suena f719–f731 y muere con la burbuja ya asentada | −19 dBFS | S1: f712 → **f715**; 0,42 s → **0,62 s**; pico f716 → **f724**; centroide de energía f717,8 → **f724,6** (burbuja: f724,3) |
| (`SEND_TIMING.flyTo`) | 742 | 24,73 s | asentamiento de la burbuja al llegar al hilo (Re5) | −22 dBFS | — |
| `indicator` | 756 | 25,20 s | **tics suaves**: «pop» de la burbuja de puntos (La5) y un tic por rebote de punto (Re6 · Mi6 · Fa#6) en f761,3 · 764,4 · 767,6 · 782,3 · 785,4 (el rebote que cae sobre la respuesta se omite) | −26 / −28,5 dBFS | — |
| `reply` | 790 | 26,33 s | **LLEGADA DE LA RESPUESTA (momento emocional):** una sola nota cálida tipo gota — Fa#5 (tercera de Re mayor), ataque inmediato, ascenso de afinación de 9 % en ≈25 ms, cuerpo una octava abajo y cola de ≈1,5 s. Breve y discreta: la música nace bajo ella | −14 dBFS (la cima del envío) | — |
| `musicIn` | 790 | 26,33 s | entra la música (no suena en `sfx-hilo`) | | |
| transición (`TRANSITION_TIMING.from` + 1; `SFX_CUES.transition` = 900 ya no se usa en el audio) | **893** | **29,77 s** | **swell suave** de Si menor, **una octava arriba** (Fa#5 · Si5 · Re6; ataque 0,5 s con los tonos a 0 / 0,10 / 0,22 s; 2,4 s; aire 760 → 3000 Hz) mientras la interfaz del chat sale y el naranja de la burbuja se expande: fuera del registro del pad y del piano del Bm7 (A7) | −19 dBFS | S2: f900 → **f893**; ataque 0,95 → **0,5 s**; 3,2 → **2,4 s**; llega a su nivel en f907 (antes f927) y se apaga hacia f965 (antes f996) |
| `phraseOne` | 935 | 31,17 s | tono grave cálido y breve, Re3 (armónicos 1–3 de 1 · 0,65 · 0,3, ataque suave, no campana); entra con el rodillo de la 1.ª frase (`firstIn` + 5 f; A5) | **−15 dBFS** | **+1,5 dB** (−16,5): el hueco de la música bajó de −3 a −1,7 dB y el swell ya no la cubre tanto |
| `phraseTwo` | 998 | 33,27 s | ídem, Fa#3 (tercera mayor arriba: «abre»; **3.er armónico, 555 Hz, 0,6 en vez de 0,3**); entra con el rodillo de la 2.ª frase (`secondIn` + 4 f) | **−15,5 dBFS** | S6: 3.er armónico **+6 dB** (parcial propio > 500 Hz) y nota **+2 dB** (−17,5) |
| `reveal` (`wipeOutFrom` + 8) | **1076** | **35,87 s** | **soplo brillante** (1,2 s, 700 → 3600 Hz, pasa-bajos en 4,4 kHz; máximo a 0,45: f1091) al retirarse el naranja / entrar la ilustración; su cuerpo cae en 2–4 kHz, donde la música no tiene energía | **−17 dBFS** | S3: f1068 → **f1076**; 1,5 → 1,2 s; −22 → **−17 dBFS** (+5 dB); 480–2600 → 700–3600 Hz; **sin hueco** de la música |
| `companionText` | 1114 | 37,13 s | «pip» redondo Si5 | **−18,5 dBFS** | +1,5 dB (sin hueco de la música) |
| `friendArrive` | 1154 | 38,47 s | **la silla que rueda** (leve): ruido 150–700 Hz modulado por el giro de las ruedas (4,4 → 1,2 vueltas/s, desacelera) de f1104 (`friendEnterFrom`) a f1154 (−29) + asentamiento de madera al detenerse (golpe grave + «tic» de ruido de 1,8 kHz de 9 ms —antes 5—, que se oye aunque el bajo de la música tape los graves y un parlante de celular no los reproduzca). Sin hueco en la música | −29 / **−18** dBFS | +2 dB al asentamiento (el pico del tic de ruido ya no depende del PRNG; ver «Pasada S1–S7») |
| `gesture` | 1180 | 39,33 s | cuerda / campanita mínima, dos notas Mi5 → La5 (+0,16 s); coincide con el tramo más veloz del gesto (A6) y con la resolución re → do# de la música | **−17,5 / −19,5** dBFS | +1,5 dB (sin hueco de la música) |
| `signatureOne` | 1240 | 41,33 s | quinta cálida Fa#4 + Do#5 (la tercera de Re, libre en el pad) | −16,5 dBFS | — (hueco de −3 → −2 dB) |
| `logoReveal` | 1254 | 41,80 s | **carillón cálido** discreto, arpegio de La mayor La5–Do#6–Mi6–La6 (aditivo, decaimiento ≈ 2 s, sin ataque metálico) | −17,5 … −23 dBFS (−10,4 con el ajuste general: uno de los picos del stem) | — (hueco de −3 → −2 dB, fundido con el de la firma) |
| `signatureTwo` | 1304 | 43,47 s | «pip» Re5 | **−17,5 dBFS** | +1 dB (el hueco baja de −3 a −1,3 dB) |
| `finalMessage` | 1420 | 47,33 s | eco de los tonos del giro una octava y media arriba: Re5 + La5 (quinta abierta, decaimiento ≈ 2,4 s) | **−14 dBFS** | +1,5 dB (sin hueco de la música) |
| `finalDate` | 1458 | 48,60 s | «pip» Si5 | **−18,5 dBFS** | +1,5 dB (sin hueco de la música) |
| cierre (compás 8) | 1525 | 50,83 s | eco muy suave del carillón del logo: La5 + Mi6 (quinta y novena de Re mayor 9); no figura en `SFX_CUES` | −24 / −28 dBFS | — (sin hueco de la música) |
| `musicOutFrom` | 1530 | 51,00 s | marca para la música (no suena en `sfx-hilo`) | | |

El pico del stem (−9,7 dBFS con el ajuste general; antes −10,1) cae en f935 (el Re3 de la 1.ª frase, ahora +1,5 dB, sobre el swell que aún suena); la gota de la respuesta (−10,3) y el carillón del
logo (−10,4) quedan a menos de 0,7 dB. La respuesta sigue siendo la cima del chat (f0–f892: la envía todo bajo ella) y la nota que más emerge de su entorno (sube la sonoridad K de la mezcla +12,8 dB, porque la música
todavía no llegó). Los más delicados (silla, tics, pips) quedan por debajo de −16 dBFS en su banda propia.

## Espacio para la voz futura (locución desactivada)

`VOICEOVER.enabled = false`: no hay voz. Para que una voz posterior (frases del giro, firma, mensaje final) no tenga que competir:
- el **pad está una octava más grave** que en la v1, en terceras apiladas, y el piano es escaso y suave en registro medio-grave;
- hay un **«hueco» de ecualización** (campana −4 dB en ≈1,15 kHz, Q 0,6) durante todo el texto en pantalla (se abre recién en el
  último compás, sin texto nuevo);
- la música va **pareja entre compases** (rango 1,2 dB): sin picos de nivel que tapen la voz.

Medido (música sola, f900–f1500): la banda de voz **300–3000 Hz es el 17 % de la energía** (v1: 38 %) y queda en **−23,1 dBFS RMS**
(con el ajuste general de +3 dB y el volumen 1,0 de `Reel.tsx`; −23,4 antes de la pasada S1–S7, −26,6 antes del ajuste general): ≈ 3 dB bajo una voz a −20 dBFS RMS, por lo que **con locución
real hay que bajar la música ≈ 6 dB mientras habla** (en `Reel.tsx`); 100–300 Hz concentra el 77 %.

### Parlante de celular (QA A1, informativo: no se tocó el timbre de la música)

Por debajo de ~300 Hz un parlante de celular casi no reproduce. Con un pasa-altos de 300 Hz la mezcla completa queda en **−19,7 LUFS**
(−5,1 LU respecto del rango completo; −20,1 antes de la pasada S1–S7, −20,3 antes de A1–A7) según `verify-audio.ts` (pasa-altos de 2.º orden); el QA midió −22,1 LUFS sobre el MP4 con uno de 4.º orden, y un tramo del chat
(f118–612) en −27,6 LUFS. Es el costo, buscado, de dejar la banda de voz libre: la música se siente más baja y «de campanitas» en un celular (el 77 % de su energía está bajo 300 Hz), y los acentos
(pips, carillón, gota de la respuesta; casi todos > 500 Hz) pasan al frente.

- **Pasada S1–S7, S5 (informativo; no se cambió nada, queda documentado):** la primera mitad (el chat) queda muy por debajo de la segunda en un celular. Medido sobre la mezcla simulada (pasa-altos de
  300 Hz, 2.º orden), sonoridad integrada: **tipeo y borrado (3,9–20,4 s) −26,7 LUFS · duda, envío y respuesta (23,4–26,4 s) −27,9 LUFS · desde la música (30–50 s) −17,9 LUFS** (8,8–10 LU más; con el rango
  completo: −22,8 / −25,7 / −12,9 LUFS, 9,9 LU). El salto entra con la música en f790 y con la gota de la respuesta (sube la sonoridad K +12,8 dB): es el contraste buscado (el chat es aire y teclas, la respuesta
  es el centro emocional), pero en un celular el chat queda bajo. **Qué haría falta para subirlo:** +3…+4 dB al tipeo y al aire de la primera mitad, y eso exige antes un **limitador de master a −1 dBTP** (la mezcla la
  hace Remotion y hoy el pico de las teclas fija −2,2 dBTP); sin él, `MASTER_TRIM_DB` no se sube. Alternativa sin limitador: un compresor suave solo sobre el stem de teclado (baja los picos de 28,7 dB de cresta)
  para poder subir su RMS. Ninguna de las dos se aplicó a ciegas; queda para la escucha en un celular real.
- **Pasada S1–S7, S6 (2.ª frase en celular):** la 2.ª frase (f998, Fa#3) casi no se oía en un celular: su fundamental (185 Hz) no se reproduce y su único parcial claro, el 2.º armónico (370 Hz), duplica el Fa#4 del
  pad del compás 3 (**−5,5 dB** sobre la música en su banda: tapado), mientras el 3.er armónico (555 Hz, libre en el pad) llegaba a solo **+6,1 dB**. Ahora el 3.er armónico de la nota pasa de 0,3 a 0,6 (+6 dB) y la nota
  sube +2 dB: **el parcial de 555 Hz queda +11,4 dB sobre la música** en su banda (verificado ≥ +10). La sonoridad K en celular de esa ventana apenas se mueve (+0,92 → +1,06 dB: un parcial que se apaga en 0,15 s pesa
  poco en 400 ms), así que la medida que vale es la del parcial en su banda. Se descartó el «tic de fieltro» de 3–6 kHz del piano (la otra opción propuesta) por no agregar un timbre nuevo sin poder escucharlo; queda como
  recurso si la escucha en celular lo pide. La 1.ª frase (Re3: 147 / 294 / 441 Hz) conserva su parcial de 294 Hz a +11,5 dB y sube +1,5 dB para no perder presencia en celular al acortarse el swell que la cubría
  (sonoridad K en celular +5,45 → +3,22 dB; mínimo exigido +3).
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
| Reel.tsx tras A1–A7 | ambiente 0,8 desde el f0 → 0,5 (790 + 60 f) → 0 (últimos 45 f) · teclado 1 · música 0 → 1,0 (790 → 808) → 0 (desde 1530) · sfx 1; stems con +3 dB | −15,0 LUFS (LRA 13,6 LU) | −2,2 dBTP (pico de muestra −2,36 dBFS) |
| **Reel.tsx actual (pasada S1–S7; sin cambios en `Reel.tsx`)** | los mismos volúmenes; stems con +3 dB, 4 huecos de música en vez de 11 y acentos algo más fuertes | **−14,6 LUFS** (LRA 13,7 LU) | **−2,2 dBTP** (pico de muestra −2,36 dBFS) |

- Dentro del objetivo (**−17 … −14 LUFS** integrados; hoy −14,6, a 0,6 LU del borde: con menos huecos la música recuperó ≈ 0,3 LU y los acentos que subieron suman el resto; si hiciera falta bajar,
  la música en `Reel.tsx` pasa de 1,0 a 0,95) con 2,2 dB de margen de pico real bajo 0 dBFS (1,2 dB bajo −1 dBTP). El pico lo fijan las pulsaciones del
  teclado (f180–f520); en la parte con música el pico de la mezcla queda en ≈ −4,2 dBFS (1,8 dB más abajo). Tras el códec AAC de `npm run render` (Remotion usa 320 kbps por defecto):
  −2,2 dBTP; a 192 kbps (caso pesimista de la verificación) −2,5 dBTP (en la versión anterior una única muestra del «.» de M1 llegaba a −0,6 dBTP), siempre bajo 0 dBFS.
- Por qué +3 dB y música a 1,0: el QA midió la mezcla en −18,5 LUFS con el 82 % de la energía bajo 350 Hz (entre 30 y 50 s): sonaba baja y sin cuerpo en parlantes de celular. El
  ajuste general sube los cuatro stems parejo (balance relativo intacto). La música pasó de 0,9 a 1,0 porque los huecos de −3 dB bajo los acentos le quitaban ≈ 0,6 LU de sonoridad integrada
  (sin ese cambio quedaría en ≈ −16,1 LUFS; con los 4 huecos de ≈ −2 dB de la pasada S7 esa pérdida es de ≈ 0,3 LU) y en la parte con música el pico de la mezcla tiene ≈ 1,8 dB de margen bajo el del teclado, que es el que fija el pico real.
- Sonoridad a corto plazo (S, ventanas de 3 s): ≈ −22…−26 durante el tipeo, −27 en la duda, −23 con el envío y la respuesta (antes −24), −14 al entrar la música (antes −16) y −12…−14 hasta el cierre (antes −13/−14) (el contraste
  aire/teclado ↔ música es intencional).
- Los volúmenes > 1 no existen en `<Audio>`: por eso la música ya está en su máximo (1,0) y cualquier ganancia extra tiene que ir en `MASTER_TRIM_DB` (ver «Parlante de celular»).

## Verificación (resultado de la última corrida: `npm run audio:verify` → **VERIFICACIÓN OK, 123 comprobaciones**)

Los umbrales absolutos de pico y RMS de la verificación incluyen el ajuste general (`TRIM = 3`). La corrida anterior (pasada A1–A7) daba 111 comprobaciones; las 12 nuevas de la pasada S1–S7 cubren: el aviso del
gancho entre f12 y f15 (1), la sincronía del swoosh con la burbuja (3: centroide, tramo activo y cola), la del swell con la salida del chat (1), la del soplo con el barrido del naranja (2: arranque y pico), las frases del giro
en celular (3: parcial de la 2.ª frase, parcial de la 1.ª y sonoridad K con pasa-altos) y los huecos de la música (2: caída máxima y número de huecos). Además se adaptaron las existentes al cronograma nuevo (aviso en f15,
swoosh en f715, swell en f893, soplo en f1076 medido en 2–4 kHz, tic de la silla).

- **(a) Formato:** los 4 archivos `pcm_s16le · 48 000 Hz · 2 canales · 16 bit · 53,000000 s · 2 544 000 muestras` (ffprobe); `TOTAL_FRAMES = 1590`.
- **(b) Teclado:** detección **ciega** de onsets (máximo móvil de |HP 1,8 kHz| contra el piso previo, robusta al «arrastre» del borrado):
  128 esperados, **128 detectados, 0 espurios, 0 faltantes**; desvío máximo **0,21 ms** (medio 0,06 ms), muy por debajo de ±1 ms. Silencio
  digital exacto fuera de las ventanas de evento y **desde f616 hasta el final (sin teclado entre f612 y el final)**. ⌫: 1 retroceso por
  fotograma (27 y 25 en 41 f), RMS de la ráfaga a −2,1/−2,3 dB del tipeo, ticks con mediana −7,4/−7,8 dBFS, tecla hundida −3,6/−2,8 dBFS
  (≥ 3 dB sobre los ticks), sin saturar (pico de la ráfaga ≤ −2,5 dBFS). Tipos distinguibles por centroide espectral (espacio < letras < puntuación < ⌫;
  mayúsculas +2 dB de pico). Variación: 1732 pares de pulsaciones aisladas del mismo tipo, correlación máxima 0,92 (ninguna repetida). El desfase de la 1.ª tecla (f118) no cambió.
- **(c) Picos / clipping / continuidad:** ningún stem toca 0 dBFS (picos: ambiente −14,7, teclado −2,8, música −5,5, sfx −9,7 dBFS; rangos objetivo por stem
  actualizados con el ajuste general), 0 muestras al extremo, sin continua, **compatibles con mono** (la suma L+R pierde 0,06–0,9 dB; el ambiente, ruido
  descorrelacionado, 2,0 dB). Sin clics ni discontinuidades en ambiente, música y sfx (detector de 2.ª diferencia; los tics son transitorios de diseño: 11,0× < 14×;
  los huecos de la música son rampas de coseno). Todos terminan en 0 exacto. **Música: silencio digital hasta f790; sfx: primera muestra en f15 (aviso del gancho, a 0,02 ms del hito),
  nada desde f77 y hasta f702 (ENVIAR).** Ambiente: RMS −29,5 dBFS (> −40 desde el primer segundo), «se abre» +1,64 dB en la duda y se aquieta −1,5 dB con la respuesta. Cierre de la música monótono hasta f1590.
- **(d) Alineación de sfx:** los 19 hitos (17 + el aviso del gancho y el tic de la silla) arrancan en su fotograma (tonos, pips, tics, clic, carillón y aviso: 0,1–5,6 ms de latencia del detector;
  el soplo del reveal y el swoosh, de ataque lento, nacen en el hito: 84 y 88 ms al 3 % del máximo; el swell de la transición, una octava arriba, alcanza el 10 % del máximo a 0,11 s y el 90 % a
  0,84 s). La frase 1 arranca 5,6 ms después de f935 y el gesto 1,1 ms después de f1180. La silla que rueda queda a −30,2 dBFS en su banda (leve), el tic de madera a −20,6 dBFS en 1,8 kHz
  (antes −25,9: ver «Pasada S1–S7»), los tics de los puntos a −26,6 dBFS, los pips a −16,5 / −15,9 / −16,8 dBFS (texto / firma / fecha) y el aviso del gancho a −14,2 dBFS en su banda (antes −16,7).
  **Sincronía con la imagen (pasada S1–S7):** el sonido llega ≈ 1 f ANTES del primer cambio visible (correcto); ahora también se vigila que el CUERPO del sonido acompañe el del movimiento.
  (S1) **swoosh vs burbuja**: la curva del vuelo es `Easing.bezier(0.5, 0, 0.2, 1)` entre f712 y f742 (copiada en `verify-audio.ts` como `FLY_EASE`): 3 % del recorrido en f716, 53 % en f724, 92 % en f732;
  velocidad máxima en f722,5; **centroide de la velocidad f724,30**. Antes: centroide del swoosh f717,8 (6,5 f por delante), activo f713–f723; ahora **f724,5** (Δ 0,2 f), activo (≥ −13 dB) **f719–f731** contra
  f717–f732 de la burbuja, y < 0,1 % de la energía después de que la burbuja llegó. (S2) **swell vs salida del chat**: nace en f893 (la interfaz sale desde f892; antes f900), el 10 % de su energía llega en f910,5
  y el 50 % en f920 (≤ f934, fin del barrido del naranja); su nivel pleno se alcanza en f907 (antes f927). (S3) **soplo vs retiro del naranja**: el primer cambio visible es **f1078** (medido sobre los fotogramas
  renderizados: 0 px grises hasta f1077, 5 en f1078, 169 en f1079, 905 en f1080, 2194 en f1081); el soplo nace en f1076 (≤ 3 f antes, por su subida suave), con el 10 % de su energía en f1086,8, pico en f1091
  (mitad del barrido f1078–f1108) y el 90 % en f1100,6 (antes nacía en f1068, 10 f antes de que se viera algo). (S4) el aviso del gancho cae en f15 (verificado entre f12 y f15).
- **(e) Música:** raíz del bajo por compás **D – B – G – A – D – G – E – D** como se diseñó; el cruce entre raíz saliente y entrante cae a +2…+13 f
  del inicio de cada compás; la novedad del croma grave (90–260 Hz) centra los 7 cambios a −4…+4,5 f del compás (el pad entra ≈0,4 s antes por
  fundido cruzado; el del 1000 queda a +4,5 f porque la nota de cabecera del piano espera 12 f a la 2.ª frase), 35–53× la mediana estable. **La suspensión resuelve con el gesto (A6):** en f1172 domina el Re4
  (+47,3 dB sobre el Do#4) y en f1194 el Do#4 (+20,7 dB sobre el Re4). **A pleno hacia f820–835 (A4):** RMS de la música en la mezcla a −0,5 dB del compás 2 (y a −13,5 dB en f798–805: sigue entrando de a poco, la gota suena primero).
  Banda de voz 300–3000 Hz: 17 % de la energía, −23,1 dBFS (ver arriba).
- **(f) Mezcla simulada:** **−14,6 LUFS** integrados (antes −15,0; rango objetivo −17…−14), LRA 13,7 LU (antes 13,6), **−2,2 dBTP** (igual; límite −1,5), pico de muestra −2,36 dBFS, con los volúmenes de `Reel.tsx`
  (sin cambios en esta pasada); tras AAC a 320 kbps −2,2 dBTP y a 192 kbps −2,5 dBTP (< 0); celular (pasa-altos 300 Hz) **−19,7 LUFS** (antes −20,1; ≥ −20,5: se vigila que no empeore). Sonoridad por stem (solo,
  volumen 1,0): ambiente −27,5 · teclado −22,3 · música −13,7 → **−13,4** · sfx −24,0 → **−23,2** LUFS. El render de audio de Remotion (prueba de una vez, arriba) NO se repitió en esta pasada: `Reel.tsx` no cambió y los
  cuatro stems conservan formato y duración exactos (53,000 s, 2 544 000 muestras); el desfase 0 y la suma por fotograma ya estaban comprobados.
- **(h) Audibilidad:** dos medidas por hito. **En su banda** (1/3 de octava del acento, ventana de 170 ms, sfx vs música × volumen de `Reel.tsx`): todos los tonales superan
  a la música entre +8,5 dB (el pip y la quinta de la firma, que quedaron más justos al aflojar el hueco) y +34 dB (Fa#3), mínimo exigido +8 dB; el soplo del reveal (en 2–4 kHz) queda +26,3 dB sobre la música (mínimo +15; antes,
  en 1,1 kHz, +2,8 dB), el swell de la transición +16,1 dB en su meseta (740 Hz) y el aviso del gancho y la respuesta suenan antes de que la música llegue. **En sonoridad ponderada K** (BS.1770, 400 ms desde el hito,
  cama = ambiente + teclado + música): cuánto sube la sonoridad al sumar el acento. Tabla antes (stems de la pasada A1–A7) → ahora (pasada S1–S7), en dB:

  | Hito | En banda antes → ahora | Sonoridad K antes → ahora | Con pasa-altos de celular antes → ahora |
  |---|---|---|---|
  | `hook` 6 → 15 (aviso; solo aire debajo) | +171,9 → +174,4 (sin música) | +7,11 → **+9,53** | +10,8 → +13,4 |
  | `reply` 790 (sin música) | (sin música) → (sin música) | +12,83 → +12,83 | +16,1 → +16,1 |
  | `transition` 900 → 893 | +16,4 → +16,1 (740 Hz, en la meseta: a +0,9 s → +0,8 s del hito) | +0,01 → +0,07 (mide solo los primeros 400 ms del swell) | +0,06 → +0,42 |
  | `phraseOne` 935 | +29,5 → +29,7 | +2,09 → +1,63 (mín 1,5) | +5,5 → +3,2 (mín +3) |
  | `phraseTwo` 998 | +34,6 → +33,8 (185 Hz); **parcial de 555 Hz +6,1 → +11,4** | +1,35 → +1,29 (mín 1,2) | +0,9 → +1,1 |
  | `reveal` 1068 → 1076 | +2,8 (1,1 kHz) → **+26,3** (2–4 kHz) | +0,07 → +0,23 | +0,2 → +0,5 |
  | `companionText` 1114 | +18,5 → +16,9 | +0,21 → +0,17 | +1,3 → +1,0 |
  | `friendArrive` 1154 (tic 1,8 kHz) | +20,2 → +20,0 | +0,02 → +0,03 | +0,04 → +0,09 |
  | `gesture` 1180 | +21,7 → +20,2 | +1,41 → +1,11 | +3,8 → +3,2 |
  | `signatureOne` 1240 | +9,5 → +8,5 | +0,64 → +0,53 | +2,0 → +1,7 |
  | `logoReveal` 1254 | +25,9 → +24,9 | +2,07 → +1,74 | +6,3 → +5,6 |
  | `signatureTwo` 1304 | +9,8 → +9,1 | +0,48 → +0,42 | +1,1 → +1,0 |
  | `finalMessage` 1420 | +19,0 → +17,5 | +0,82 → +0,62 | +2,9 → +2,3 |
  | `finalDate` 1458 | +19,4 → +17,9 | +0,22 → +0,17 | +1,0 → +0,7 |
  | `cierre` 1525 | +15,5 → +12,5 | +0,31 → +0,17 | +0,9 → +0,5 |

  **Lectura de la tabla:** al aflojar el hueco de la música (S7) los acentos pierden 1–3 dB de margen en su banda —el costo directo de no hundir la música—; todos siguen sobre sus mínimos. La firma (`signatureOne`, +8,5
  dB, mínimo +8) es el más justo: por eso conserva su hueco, con la profundidad más alta (−2 dB). La sonoridad K de los acentos que ya no tienen hueco (pip del texto, gesto, mensaje final, fecha) se sostuvo subiéndolos
  1–1,5 dB de nivel propio (ver la tabla de hitos); sin eso habrían bajado de su mínimo (el mensaje final habría quedado en +0,44 contra un mínimo de +0,5; la fecha, en el borde de +0,12; el gesto, en +0,82 contra +0,8). La sonoridad K de la 1.ª frase
  incluía antes la meseta del swell de la transición (que ahora se relaja desde f929 y no llega a la 2.ª frase): por eso el celular de la 1.ª frase pasó de +5,5 a +3,2 dB.
  La sonoridad K de un «pip» de 75 ms en una ventana de 400 ms sube poco por naturaleza (por eso la medida decisiva para los pips es la de su banda); la respuesta sigue siendo, por lejos,
  el acento que más emerge. Los pasos de la amiga (los graves de la silla caen bajo el bajo de la música) quedan **leves por diseño**: se distingue sobre todo el tic de 1,8 kHz.
  **Huecos de la música (S7):** ver «musica.wav». Caída a 100 ms bajo cada acento (antes → ahora): máximo 4,7 → **3,0 dB** (bloque 2), 11 huecos → **4**; sin hueco, la caída natural máxima es 2,3 dB (el compás 3 bajo el soplo).
  **Secuencia de envío (QA A3 + S1):** picos del stem por tramo, antes → ahora: clic −12,0 → **−12,0** · swoosh −16,1 → **−16,2** · asentamiento −19,0 → **−19,0** · puntos −23,0 → **−23,1** · respuesta −10,3 → **−10,3** dBFS
  (todo el envío bajo la gota, con 1,7 dB de margen); letras del teclado: mediana −5,8 dBFS. Sonoridad momentánea máxima (K, 400 ms): tecleo −18,8 LUFS, envío −24,5 → **−23,4 LUFS** (Δ respecto del tecleo −5,7 → −4,6 dB:
  el soplo ahora dura 0,62 s y cae sobre la parte más ruidosa del vuelo): lo que suena en el envío sigue siendo un aire con acentos, no una ráfaga de teclas.
  **Gancho (QA A2 + S4):** el aviso de «mensaje recibido» tiene un pico de **−11,6 dBFS** en el stem (antes −14,1) y sube la sonoridad momentánea de la mezcla de **−28,4 LUFS (solo aire) a −19,6 LUFS** (antes −21,6) en f0–f118 (el tecleo
  llega a −18,8 LUFS): sigue por debajo de un tecleo suave (verificado ≤ tecleo + 0,5 dB), no es una notificación fuerte; en celular +13,4 dB sobre el aire (antes +10,8).
- **(g) Espectrogramas** (`ffmpeg showspectrumpic`, incluidos acercamientos del tipeo/borrado, de la duda + envío + respuesta, de los acentos
  de 29,5 a 47,5 s y del cierre) revisados a ojo: sin ruido de banda ancha extraño ni siseo agudo, glissandos y swells limpios, teclas como
  impulsos bien separados, ráfaga de borrado con el arrastre visible entre 0,5 y 1 kHz, pausa de la duda y del envío sin nada salvo aire, swoosh y asentamiento visibles en
  el envío, entrada de la música desde f790, cierre sin cortes. En la pasada S1–S7 se compararon además a ojo, antes y después, los espectrogramas del sfx (100 Hz – 12 kHz, escala logarítmica) de f0–f75 (el aviso del gancho: dos notas limpias, ahora en f15), de f696–f756 (clic,
  swoosh, asentamiento: el soplo nuevo es más ancho y limpio, sin bandas ni cortes, y termina antes del asentamiento), de f885–f990 (el swell de la transición: nace en f893, meseta, se apaga hacia f965 y la reverb lo deja
  sin cola brusca) y de f1050–f1150 (el soplo brillante del reveal: ruido de banda ancha con el cuerpo en 2–4 kHz, sin siseo sobre 4,5 kHz, que se apaga antes del «pip» de f1114).
- **Límite de la verificación:** son comprobaciones objetivas; **el audio NO fue escuchado por ninguna persona** (ni con auriculares ni en un parlante de celular).

## Reemplazar por material real o licenciado

1. **Música licenciada:** pasarla a un WAV de 53 s, 48 kHz, estéreo, con silencio hasta el f790 y cierre suave:
   ```bash
   ffmpeg -i musica-licenciada.wav -af "adelay=26333|26333,apad,atrim=0:53,afade=t=in:st=26.333:d=1.8,afade=t=out:st=51:d=2" \
     -ar 48000 -ac 2 -c:a pcm_s16le public/audio/musica.wav
   ```
   (`26333` ms = f790; el resultado dura exactamente 53,000 s). Si la música entra en otro momento, cambiar `SEND_TIMING.replyIn` en `timeline.ts`.
   Ajustar el volumen en `Reel.tsx` según la sonoridad (objetivo −17 … −14 LUFS integrados; la rampa de entrada de 18 f de `Reel.tsx` convive con el swell propio del stem sintetizado: con una pista
   licenciada que ya entre con su propio fundido, alargarla); un stem reemplazado **no** lleva el +3 dB de `MASTER_TRIM_DB` ni los huecos de ≈ −2 dB bajo las frases del giro, la firma y su bloque 2
   (habría que aplicarlos en la edición).
2. **Teclado real:** grabar o editar un teclado a los tiempos de `KEY_EVENTS` (`node -e "import('./src/config/typing.ts').then(m=>console.log(m.KEY_EVENTS))"`)
   y exportarlo con el mismo formato/duración, **con silencio desde f612 hasta el final** (pausa de la duda y del envío). Mantener `public/audio/teclado.wav`.
3. **Ambiente de consultorio / sfx:** reemplazar `ambiente.wav` o `sfx-hilo.wav` con el mismo formato (53 s alineados; sfx: el aviso del gancho en f15 y nada más hasta f702).
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

### Pasada S1–S7 (verificación final independiente del MP4 entregable)

La verificación final midió el audio del MP4 entregable (`scratchpad/qa3/final.mp4`: AAC, −15,0 LUFS, −2,3 dBTP, desfase 0 respecto de la suma de los stems): sin bloqueantes ni mayores; **nadie escuchó el audio**.
El coordinador movió `TURN_TIMING.exitFrom` 1096 → 1100 (no afecta a ningún hito de audio) y autorizó editar en `timeline.ts` solo `SFX_CUES.sendFly` y `SFX_CUES.reveal`. Qué se hizo con cada hallazgo:

| Hallazgo | Qué se hizo | Resultado medido (antes → ahora) |
|---|---|---|
| **S1** — el swoosh del envío va ≈ 7 f por delante de la burbuja (suena f713–f723, pico f716; la burbuja se mueve f717–f732, velocidad máxima f722–724) y quedan 0,5 s de silencio hasta el asentamiento | `timeline.ts`: `SFX_CUES.sendFly = flyFrom + 3` (f715); `build-audio.ts`: soplo de 0,42 → 0,62 s, 450 → 2300 Hz, máximo a 0,5 (no a 0,38); mismo pico (−19 dBFS de diseño); `verify-audio.ts`: comprueba el centroide y el tramo activo contra la curva del vuelo | centroide de energía f717,8 → **f724,5** (burbuja f724,3); tramo activo f713–f723 → **f719–f731** (burbuja f717–f732); pico del stem −16,1 → −16,2 dBFS; < 0,1 % de energía después de que la burbuja llegó |
| **S2** (informativo) — el swell de la transición llega ≈ 21 f detrás del movimiento | **Hecho (salió gratis):** el swell nace en `TRANSITION_TIMING.from + 1` = f893 (antes f900), ataque 0,95 → 0,5 s (tonos a 0 / 0,10 / 0,22 s), 3,2 → 2,4 s, aire con el máximo en 0,3; mismo pico. No toca la gota de la respuesta (su cola de 2,4 s se apagó en f862) y sigue sonando −0,6 dB bajo la frase 1 (f935), que conserva su presencia en celular | nivel pleno f927 → **f907**; el 50 % de la energía hasta la frase 1 llega en f920 (≤ f934); se apaga hacia f965 (antes f996); margen en 740 Hz +16,4 → +16,1 dB |
| **S3** — el soplo del reveal (f1068) arranca ≈ 10 f antes del primer cambio visible (f1078) y casi no se oye; la marca real es el piano de f1080 | `timeline.ts`: `SFX_CUES.reveal = wipeOutFrom + 8` (f1076); soplo −22 → **−17 dBFS** (+5 dB), 1,5 → 1,2 s, 480–2600 → 700–3600 Hz con pasa-bajos en 4,4 kHz (cuerpo en 2–4 kHz, donde la música no tiene energía; ya sin hueco de la música). Piano atado al hito: Fa#4 y La4 a +4 y +20 f (**siguen en f1080 y f1096**: el Fa#4 ya era la marca audible, 2 f después del primer cambio visible; a +12 f habría llegado f1088) | arranque f1068 → **f1076** (visible f1078); pico f1091 (mitad del barrido), 90 % en f1100,6 (barrido hasta f1108); margen sobre la música en 2–4 kHz **+26,3 dB** (antes en 1,1 kHz: +2,8 dB) |
| **S4** — el único evento del gancho (aviso de f6) cae a 0,2 s, cuando varios reproductores todavía no arrancaron el audio | aviso en `HOOK_TIMING.settle + 9` = **f15** (0,5 s); +2,5 dB (−17,5 / −19 → −15 / −16,5 dBFS de diseño) | pico del stem −14,1 → −11,6 dBFS; sonoridad momentánea de f0–f118 −21,6 → −19,6 LUFS (tecleo −18,8: sigue ≤ tecleo + 0,5); se apaga hacia f77 (antes f63), 41 f antes de la 1.ª tecla |
| **S5** (informativo) — la primera mitad queda 7–11 LU bajo la segunda en celular | **Solo documentado** (no se sube `MASTER_TRIM_DB` sin limitador de master a −1 dBTP): ver «Parlante de celular» | celular: tipeo −26,7 · duda/envío −27,9 · desde la música −17,9 LUFS |
| **S6** (informativo) — el acento de la 2.ª frase (f998, 185 Hz) casi no se reproduce en un celular | 3.er armónico (555 Hz) de la nota 0,3 → 0,6 (+6 dB) y la nota +2 dB (−17,5 → −15,5); la 1.ª frase +1,5 dB (−16,5 → −15) | parcial de 555 Hz sobre la música **+6,1 → +11,4 dB**; K en celular de la 2.ª frase +0,92 → +1,06; de la 1.ª +5,45 → +3,22 (ya no la cubre el swell); `verify-audio.ts` vigila ambos |
| **S7** — el ducking mide 3,4–5,2 dB reales a 100 ms en 11 huecos | `DUCK_DB` −3 → **−2 dB**; hueco solo bajo las frases del giro (−1,7 y −1,3), la firma con el logo (−2) y el bloque 2 (−1,3); quitado en soplo del reveal, pip del texto, gesto, mensaje final, fecha y cierre; los que quedaron justos en sonoridad K suben +1–1,5 dB de nivel propio; `verify-audio.ts` mide la caída | máximo 4,7 → **3,0 dB** (bloque 2); 11 → **4** huecos independientes; sin hueco, la caída natural máxima es 2,3 dB; ningún acento bajo su mínimo (ver (h)) |
| efecto colateral | el tic de madera de la llegada de la amiga bajó de −25,9 a −28,9 dBFS en su banda al alargarse el swoosh: el ruido de `woodThump` salía de una realización del PRNG que consumía `rnd` en el mismo orden → ahora el pico de su ruido se fija (`TOK_PEAK`) y el asentamiento sube +2 dB (−20 → −18) | pico del tic en 1,8 kHz: −25,9 (antes de la pasada) → −28,9 (realización distinta del ruido) → **−20,6 dBFS** (pico del ruido fijado y +2 dB; más picudo que el original); margen sobre la música en la ventana de 21 ms: +20,2 → +18,1 → **+20,0 dB** (lo que cuenta para oírlo) |
| mezcla | sin cambios en `Reel.tsx` | −15,0 → **−14,6 LUFS**, −2,2 dBTP igual, celular −20,1 → **−19,7 LUFS** |

Regenerar da archivos idénticos byte a byte (`md5sum` en dos corridas: ambiente `40abce56…` y teclado `3d37e461…` no cambiaron respecto de la pasada A1–A7; música y sfx sí). Los números de arriba están medidos sobre los stems y sobre la mezcla simulada
con los volúmenes de `Reel.tsx`; para ubicar el movimiento visual se renderizaron fotogramas con `scripts/shots.sh` (burbuja f712–f742, salida del chat f893–f924, retiro del naranja f1074–f1108): son la referencia de «dónde está la imagen».
**Ninguna persona escuchó el resultado.**

## Pendiente

- **Escucha humana** (auriculares y parlante de celular real): **el audio NO fue escuchado por ninguna persona** y ninguna comprobación de este documento reemplaza el oído. Lo más importante de escuchar: que el aviso del gancho (ahora en
  f15) suene a «mensaje recibido» y no a una notificación ajena al reel; que el swoosh del envío (f719–f731) se sienta pegado a la burbuja y el soplo brillante del reveal no suene a siseo; que la gota de la respuesta con la música
  entrando 8 f después se sienta como un solo gesto; que el swell de la transición, ahora más corto (0,5 s de ataque), no suene a destello; que la 2.ª frase se distinga en un celular (parcial de 555 Hz); que los 4 huecos de la
  música no se noten como bombeo; y el nivel de la música y del chat en celular (A1, S5).
- **Chat bajo en celular (S5):** si la escucha lo confirma, hace falta un limitador de master a −1 dBTP antes de subir el tipeo y el aire de la primera mitad (ver «Parlante de celular»).
- Si habrá **locución**: ver «Espacio para la voz futura» (bajar la música ≈ 6 dB mientras habla).
- Hito propio para el aviso del gancho y para el swell de la transición: hoy salen de `HOOK_TIMING.settle + 9` y de `TRANSITION_TIMING.from + 1` (constantes copiadas en `build-audio.ts` y `verify-audio.ts`); si se prefieren
  `SFX_CUES.hook` y `SFX_CUES.transitionSwell` en `timeline.ts` (archivo del coordinador), el cambio en ambos scripts es de una línea cada uno.

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
  audibilidad de los acentos sobre la música (en su banda y en sonoridad K), secuencia de envío, aviso del gancho, música a pleno hacia f820–835, resolución re → do# con el gesto, compatibilidad mono, parlante de celular, AAC a 320 y 192 kbps, 123 comprobaciones (v2: 75).
