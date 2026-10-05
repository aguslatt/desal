# Audio del reel v2 — "El mensaje que borraste" (38 s)

> **Estado: PROVISIONAL (versión de revisión).** Los cuatro stems de `public/audio/` se **sintetizan por código** y
> sirven para cerrar la edición con sonido sincronizado. Se pueden reemplazar, uno por uno, por **música licenciada**
> y/o **grabación real** (teclado, ambiente de consultorio, locución) sin tocar la animación (ver "Reemplazar").
> Sin locución (`VOICEOVER.enabled = false`): el sentido completo se entiende sin sonido. **Nadie escuchó todavía estos
> stems**: todo lo de abajo son comprobaciones objetivas (números y espectrogramas); conviene una escucha humana
> (auriculares y parlante de celular) antes de publicar.

## Origen y licencias

- **100 % sintetizado por código** en `scripts/build-audio.ts`: ruido pseudoaleatorio sembrado, osciladores
  (aditivos y FM), filtros biquad, envolventes y reverb de Schroeder/Freeverb. **Sin samples, sin bancos de sonidos,
  sin librerías ni dependencias de audio de terceros.** No queda ningún permiso de terceros pendiente.
- **Determinista:** PRNG `mulberry32` con semilla fija por stem (`src/lib/rng.ts`). Regenerar produce archivos
  idénticos byte a byte (comprobado con `md5sum` en dos corridas).
- Los tiempos salen de `src/config/timeline.ts` (`SFX_CUES`, `CURSOR_HANDOFF`, `MESSAGE_SPECS`) y las teclas de
  `src/config/typing.ts` (`KEY_EVENTS`): si cambia el cronograma, se regenera y el audio sigue alineado.

## Cómo regenerar y verificar

```bash
npm run audio          # = node scripts/build-audio.ts   (≈20 s) → public/audio/*.wav
npm run audio:verify   # = node scripts/verify-audio.ts  (≈20 s; requiere ffmpeg/ffprobe en el PATH)
```

Variables opcionales: `AUDIO_CHECK_DIR=<carpeta>` (espectrogramas y mezclas de prueba de la verificación; por defecto
`<tmp>/adip-audio-check`), `AUDIO_VERBOSE=1` (tabla completa de las 128 pulsaciones), `AUDIO_DUMP_LAYERS=<carpeta>`
(en `npm run audio`: escribe además las capas de la música —piano, pad, bajo, sub, reverb— para analizarlas).

Formato de salida (los 4 archivos): **WAV PCM 16-bit, 48 kHz, estéreo, exactamente 38,000 s (1 824 000 muestras = 1140 f)**.
El fotograma `f` del reel cae en la muestra `round(f/30·48000) = f·1600`: los stems entran en `Reel.tsx` tal cual,
sin `trimBefore` ni desfasajes. Se comprobó de punta a punta: un render de audio de Remotion con los mismos `<Audio>` y
volúmenes de `Reel.tsx` dura 38,000 s y coincide con la mezcla simulada con **desfase 0 muestras y diferencia −52 dB** (solo cuantización).

## Línea de tiempo sonora

| Fotogramas | Tiempo | Qué suena |
|---|---|---|
| 0 – 99 | 0 – 3,3 s | **solo ambiente** (aire de habitación, audible desde el f0) |
| 99 – 356 | 3,3 – 11,9 s | **teclado** sincronizado con la escritura y el borrado (128 pulsaciones) sobre el ambiente |
| 152 – 180 · 255 – 285 | | pausas de lectura (la frase queda escrita): teclado en silencio digital |
| **356 – 410** | **11,9 – 13,7 s** | **PAUSA de la duda**: ni una tecla, ni música, ni sfx. Solo aire; el aire «se abre» (apenas) |
| 410 → | 13,7 s → | entra la **música** (compás de 105 f) y nace el trazo (`threadBorn`) |
| 428 – 1065 | | hitos de sfx (tabla de abajo) sobre la música |
| 1065 – 1140 | 35,5 – 38 s | acorde sostenido (Re mayor 9) que se desvanece hasta el último fotograma |

## Stems

| Stem | Qué es | Pico | RMS | Sonoridad (stem solo) |
|---|---|---|---|---|
| `ambiente.wav` | Aire de habitación: ruido marrón/rosa filtrado + una banda de «aire» suave (≈1–3 kHz, sin siseo agudo); nivel nivelado a ±0,5 dB; entra en 30 ms (anti-clic) y sale en 0,6 s | −19,8 dBFS | **−34,5 dBFS** | −32,4 LUFS |
| `teclado.wav` | 128 pulsaciones exactas (una por `KEY_EVENTS`) + «arrastre» del borrado; silencio digital entre ellas y desde f356 hasta el final | −6,5 dBFS | −34,0 dBFS | −24,6 LUFS |
| `musica.wav` | Piano eléctrico/felt suave + pad + bajo + sub, con reverb sintética; silencio digital hasta el f410 | **−9,0 dBFS** | −21,4 dBFS | −17,2 LUFS |
| `sfx-hilo.wav` | Acentos sutiles en los hitos (tabla de abajo); silencio digital hasta el f410 | −11,5 dBFS | −35,5 dBFS | −27,5 LUFS |

### ambiente.wav
- Fuente: ruido marrón (común a ambos canales: «una sola sala») + marrón/rosa independientes por canal, filtrado
  pasa-bajos que respira lento (cutoff 400–760 Hz), sin graves < 80 Hz, más una banda de «aire» (BP 1,5 kHz, LP 2,6 kHz;
  por encima de 3 kHz queda < −65 dBFS: no hay siseo).
- **Nivelación lenta** (envolvente de ≈1,2 s): el RMS de cualquier ventana de 1 s queda entre −35,1 y −33,2 dBFS: nunca
  hay zonas «muertas» ni picos de ruido. Primer segundo: −34,2 dBFS RMS (> −40 dBFS exigido).
- **«El aire se abre» en la pausa de duda (f356 → f410):** cutoff +380 Hz, nivel +1,8 dB (medido +1,6 dB), banda de aire
  más presente (+4,9 dB entre 1 y 3 kHz), y la sala se ensancha un poco en el estéreo; se relaja despacio mientras entra la música (≈ f418 → f528).
  Centroide espectral 285 → 350 Hz. Es el único cambio perceptible del ambiente: apenas.

### teclado.wav
- **128 eventos** = 57 letras + 3 mayúsculas + 12 espacios + 4 puntuación + 52 ⌫ (2 «tecla hundida» + 48 repeticiones + 2 «suelta»).
  Cada evento cae a `frame/30 s` (el primer evento de cada fotograma, a ≤ 0,21 ms; ver «ráfaga» abajo).
- Cada golpe se sintetiza con ruido distinto (nunca la misma muestra repetida): transitorio de ruido pasa-altos
  (2–3,8 kHz) + golpe grave (130–190 Hz con caída de afinación) + «tok» de carcasa (≈0,8–1,3 kHz, para que se oiga en
  parlantes de celular) + una mini sala difusa. Nivel, tono y paneo varían por pulsación con el PRNG sembrado.
- **Letras:** tap suave (picos −11 … −7 dBFS). El **paneo sigue la columna de la tecla en el QWERTY** (mano izquierda a la
  izquierda, ±0,25); la **fuerza depende de la velocidad de tipeo** (rápido → más suave; tras una duda → más firme); la
  **mayúscula** pesa +1,4 dB y suena algo más grave; la **última tecla de cada mensaje** cae más asentada (cola más larga).
- **Espacio:** más grave y más largo (centroide 155 Hz vs 285 Hz de las letras). **Puntuación** (¿ . ? …): más seca y aguda,
  con un «ting» mínimo (centroide 472 Hz).
- **BORRAR (⌫ sostenida), la acción emocional — mucho más presente que en la v1 (ticks de −28…−22 dBFS):**
  1. primer evento = **tecla hundida**: golpe pesado y claro (≈100–116 Hz, −8 dBFS);
  2. los siguientes = **repeticiones** secas con cuerpo, **más graves a medida que avanza el borrado** (el texto «retrocede»;
     mediana −13 dBFS, con la densidad de la ráfaga cuidando que no se sature);
  3. un **«arrastre»** de fricción suave (ruido de banda 0,5 → 1 kHz, casi nada sobre 1,5 kHz) cuya envolvente sigue la
     densidad de la ráfaga: se acelera y suena como un dedo que arrastra, no como una chicharra;
  4. último evento = **suelta**: golpe de cierre asentado.
  Resultado medido: el RMS de cada borrado queda a ≤ 1 dB del RMS del tipeo del mismo mensaje.
- **Ráfaga de borrado.** El borrado quita hasta 4 caracteres por fotograma (p. ej. f195). El primer evento de cada fotograma
  cae exacto en `frame/30 s`; los demás del mismo fotograma se reparten uniformemente dentro de ese fotograma (`k·1600/n`
  muestras, hasta ≈25 ms): suena como una ráfaga que acelera y no como un golpe único saturado (todos los onsets quedan
  a ≤ 0,7 ms de su posición esperada).
- **Pausa de la duda:** la última tecla es el «…» del f356; desde ahí hasta el final del stem hay **silencio digital exacto**
  (1,8 s hasta el traspaso en f410). El teclado no suena en la pausa.

### musica.wav
Compás de 105 fotogramas (3,5 s) desde el f410; los cambios armónicos caen en **410, 515, 620, 725, 830, 935, 1040**.
Re mayor, sobria (I – vi – IV – V – I – IV – I):

| Compás | Fotogramas | Acorde | Raíz (sub) | Intención / hito |
|---|---|---|---|---|
| 1 | 410–515 | Dmaj7 | D2 | apertura tras la pausa del último mensaje; nace el trazo (410), la cámara se aleja (428), frase 1 (488) |
| 2 | 515–620 | Bm7 | B1 | vuelve la duda; frase 2 (548) |
| 3 | 620–725 | Gmaj7 | G1 | la composición se amplía (612), texto de acompañamiento (646), llegan los demás |
| 4 | 725–830 | Asus4 → A | A1 | la amiga se sienta (696) y ofrece la mano (722); **la suspensión se resuelve en el f772 = logo** |
| 5 | 830–935 | Dmaj7 | D2 | llegada: el grupo con la firma («a tu ritmo», 884) |
| 6 | 935–1040 | Gmaj7(9) | G1 | mensaje final (944): **melodía** sencilla que asciende (si → re → fa#) |
| 7 | 1040–1140 | Dmaj9 (sostenido) | D2 | resolución calma (plagal IV → I): mi → re por grado conjunto y el acorde se desvanece hasta f1140 |

- Capas: piano (arpegios lentos y escasos, 3–6 notas por compás, humanización ±6 ms / ±8 % de velocidad; las notas de
  cabecera de compás quedan exactas, con un «tic» de fieltro de 3–6 kHz que le da definición en parlantes de celular),
  pad (pedal La2 + voces por grados conjuntos una octava más grave que en la v1, más voces de color una octava arriba y
  más tenues; 3 voces desafinadas con vibrato lento), bajo (raíz una octava sobre el sub) y sub (seno + 2.º armónico).
  Reverb Freeverb (RT ≈ 2 s, amortiguada, envío sin graves). Limitador de picos a −9 dBFS (reducción máxima 3,6 dB).
- El piano **no toca sobre los hitos tonales de `sfx-hilo`** (488, 548, 722, 772, 944).
- Entrada: swell de 2,5 s (pad/bajo/sub desde el silencio, piano desde 35 %). `Reel.tsx` suma su rampa (`musicIn → +75 f`):
  ambas se multiplican; con ella la primera nota audible del piano es la de ≈ f447.
- **Cierre:** fundido propio de coseno desde f1065 que termina en 0 exacto en la última muestra; `Reel.tsx` suma el suyo desde
  `musicOutFrom` (f1070). RMS por tramo de 25 f: −16,7 → −17,9 → −23,0 → −37,7 dBFS: se desvanece de forma monótona, sin corte seco.

### sfx-hilo.wav — hitos (`SFX_CUES`)

Acentos MUY sutiles y cálidos (sin whooshes). Todos (salvo los tics) llevan una reverb corta para que «florezcan» sin quedar secos.

| Hito | Fotograma | Tiempo | Sonido | Pico de diseño |
|---|---|---|---|---|
| `threadBorn` | 410 | 13,67 s | soplo de aire ascendente (ruido pasa-banda 650→2500 Hz, < 4 kHz) + seno que «se estira» Re4→La4 (≈1,35 s) | −25 / −27 dBFS |
| `cameraPullOut` | 428 | 14,27 s | swell suave de quinta abierta La3–Mi4–La4 (ataque 1,1 s, relajación 1,6 s) con un hálito de aire que se abre | −22 dBFS |
| `phraseOne` | 488 | 16,27 s | tono grave cálido y breve, Re3 (armónicos 1–3, ataque suave, no campana) | −18,5 dBFS |
| `phraseTwo` | 548 | 18,27 s | ídem, Fa#3 (tercera mayor arriba: «abre») | −19,5 dBFS |
| `widen` | 612 | 20,40 s | swell que construye el acorde de Sol (Sol3 · Re4 · Si4 · Fa#5, ataque 0,95 s) y se ensancha en el estéreo | −21,5 dBFS |
| `companionText` | 646 | 21,53 s | «pip» redondo Si5, muy suave | −27 dBFS |
| `friendSits` | 696 | 23,20 s | tela al acomodarse (ruido 150–900 Hz, dos roces) + golpecito de madera grave; apenas | −27 / −26 dBFS |
| `friendGesture` | 722 | 24,07 s | cuerda suave mínima, dos notas Mi5 → La5 (+0,16 s) | −22 / −24 dBFS |
| `subtitleUnits[0..2]` | 764 / 838 / 884 | 25,47 / 27,93 / 29,47 s | «tic» apenas perceptible (seno 1,17 / 1,32 / 1,76 kHz + hálito de ruido) | −34 dBFS |
| `logoReveal` | 772 | 25,73 s | carillón cálido, arpegio de La mayor La5–Do#6–Mi6–La6 (aditivo, decaimiento ≈ 2 s, sin ataque metálico) | −16 … −21,5 dBFS (pico del stem −11,5) |
| `finalMessage` | 944 | 31,47 s | eco de los tonos del giro: Re3 + La3 (quinta abierta, decaimiento ≈ 2,4 s) | −20 dBFS |
| `musicIn` / `musicOutFrom` | 410 / 1070 | | marcas para la música (no suenan en `sfx-hilo`) | |

El carillón del logo es el pico del stem; los demás quedan 5–23 dB por debajo. Los más delicados (sentarse, texto, tics)
quedan por debajo de −30 dBFS en su banda propia.

## Espacio para la voz futura (locución desactivada)

`VOICEOVER.enabled = false`: no hay voz. Para que una voz posterior no tenga que competir, en las escenas 3–5 (f420–f930):
- el **pad está una octava más grave** que en la v1 y el piano es escaso y suave, en registro medio-grave;
- hay un **«hueco» de ecualización** (campana −4 dB en ≈1,15 kHz, Q 0,6) que se abre al entrar la escena 6 (sin voz);
- la música es **0,9–1,2 dB más baja** en 3–5 que el resto y **florece ≈ +1,8 dB recién en la escena 6**;
- la melodía aparece **solo en la escena 6**, que no tiene locución.

Medido (música sola, escenas 3–5): la banda de voz **300–3000 Hz es el 23 % de la energía** (v1: 38 %) y queda en **−26,2 dBFS RMS**
(v1: −24,2); 100–300 Hz concentra el 73 %. En la mezcla (×0,9) son ≈ −27,1 dBFS: ≥ 7 dB bajo una voz a −20 dBFS RMS. El RMS por compás en 3–5
no se mueve más de 0,9 dB (sin picos de nivel). Con locución real, además, se recomienda en `Reel.tsx` bajar la música ≈ 6 dB y los
sfx de frase (488, 548) ≈ 4 dB mientras habla (f488–f600 y f764–f930).

Nota de traducción a parlantes: por debajo de ~300 Hz un parlante de celular casi no reproduce; con un pasa-altos de 300 Hz la música queda en −23,1 LUFS
(v1: −22,9) y la mezcla completa en −24,4 LUFS (−18,9 LUFS a rango completo).

## Mezcla y volúmenes

La mezcla final la define `Reel.tsx`. `verify-audio.ts` **lee los `volume={…}` de `src/Reel.tsx`** (los evalúa) y simula la mezcla; mide
con `ffmpeg ebur128` (pico real = true peak; tras un códec AAC 192 kbps el pico no cambia):

| Escenario | Volúmenes | Sonoridad integrada | Pico real |
|---|---|---|---|
| **Reel.tsx actual** | ambiente 0→0,8 (en 20 f)→0,5 (con la música)→0 · teclado 1 · música 0→0,9→0 · sfx 1 | **−18,9 LUFS** (LRA 10,2 LU) | −6,0 dBTP |
| Propuesta | ídem, con el ambiente en 0,8 desde el f0 | −18,9 LUFS | −6,0 dBTP |

- Dentro del objetivo (−20 … −16 LUFS integrados) con ≈ 5 dB de margen de pico real. Sonoridad a corto plazo (S): ≈ −25 durante el tipeo,
  −28 en la ventana de la pausa (12–15 s), −21 al entrar la música y −17/−18 hasta el cierre (el contraste silencio/aire ↔ música es intencional).
- **Sugerencia para `Reel.tsx` (coordinación):** el ambiente arranca en volumen 0 y sube en 20 f; para que esté «audible desde el f0» se puede
  fijar 0,8 desde el fotograma 0 (el stem ya trae su propio anti-clic de 30 ms). Con eso la mezcla no cambia de sonoridad.
- Los volúmenes > 1 no existen en `<Audio>`: por eso se usa ≤ 1,0 y no ganancia extra en los stems.

## Verificación (resultado de la última corrida: `npm run audio:verify` → OK, 75 comprobaciones)

- **(a) Formato:** los 4 archivos `pcm_s16le · 48 000 Hz · 2 canales · 16 bit · 38,000000 s · 1 824 000 muestras` (ffprobe); `TOTAL_FRAMES = 1140`.
- **(b) Teclado:** detección **ciega** de onsets (máximo móvil de |HP 1,8 kHz| contra el piso previo, robusta al «arrastre» del borrado):
  128 eventos esperados, **128 onsets detectados, 0 espurios, 0 faltantes**; desvío máximo **0,67 ms** (medio 0,07 ms; los primeros eventos de
  cada fotograma ≤ 0,21 ms). Silencio digital exacto fuera de las ventanas de evento y **desde f356 hasta el final (pausa de la duda)**.
  ⌫: RMS de la ráfaga a ≤ 1 dB del tipeo, ticks con mediana −13 dBFS, tecla hundida −8 dBFS (≥ 3 dB sobre los ticks).
  Tipos distinguibles por centroide espectral (espacio < letras < ⌫ < puntuación; mayúsculas +2,4 dB de pico). Variación: 643 pares de pulsaciones
  aisladas del mismo tipo, correlación máxima 0,92 (ninguna repetida).
- **(c) Picos / clipping:** ningún stem toca 0 dBFS (pico máx. −6,5 dBFS en el teclado), 0 muestras al extremo, sin continua. Sin clics ni
  discontinuidades en ambiente, música y sfx (detector de 2.ª diferencia). Todos terminan en 0 exacto. **Música y sfx: silencio digital hasta f410.**
  **Ambiente:** RMS −34,5 dBFS (> −40 desde el primer segundo), ventanas de 1 s entre −35,1 y −33,2; «se abre» +1,6 dB en la pausa.
- **(d) Alineación de sfx:** los 13 hitos de `SFX_CUES` arrancan en su fotograma (tonos y tics: 0,2–6 ms de latencia del detector; los dos swells,
  de ataque lento, alcanzan el 90 % de su máximo a ≈ 0,7 s del hito, como se diseñó).
- **(e) Voz futura:** ver arriba (23 % de la música en 300–3000 Hz en las escenas 3–5).
- **(f) Mezcla simulada:** −18,9 LUFS integrados, −6,0 dBTP, con los volúmenes de `Reel.tsx`.
- **(g) Espectrogramas** (`ffmpeg showspectrumpic`, incluidos acercamientos del tipeo/borrado y de la pausa) revisados a ojo: sin ruido de banda ancha
  extraño ni siseo agudo, glissandos y swells limpios, teclas como impulsos bien separados, ráfaga de borrado con el arrastre visible entre 0,5 y 1 kHz,
  pausa de la duda sin nada salvo aire, cierre de la música sin cortes.
- **Límite de la verificación:** son comprobaciones objetivas; **nadie escuchó todavía** estos stems.

## Reemplazar por material real o licenciado

1. **Música licenciada:** pasarla a un WAV de 38 s, 48 kHz, estéreo, con silencio hasta el f410 y cierre suave:
   ```bash
   ffmpeg -i musica-licenciada.wav -af "adelay=13667|13667,apad,atrim=0:38,afade=t=in:st=13.667:d=2.5,afade=t=out:st=35.5:d=2.5" \
     -ar 48000 -ac 2 -c:a pcm_s16le public/audio/musica.wav
   ```
   (`13667` ms = f410; el resultado dura exactamente 38,000 s). Si la música entra en otro momento, cambiar `SFX_CUES.musicIn` en `timeline.ts`.
   Ajustar volumen en `Reel.tsx` según la sonoridad (objetivo −20 … −16 LUFS).
2. **Teclado real:** grabar o editar un teclado a los tiempos de `KEY_EVENTS` (`node -e "import('./src/config/typing.ts').then(m=>console.log(m.KEY_EVENTS))"`)
   y exportarlo con el mismo formato/duración, **con silencio entre f356 y el final** (pausa de la duda). Mantener el nombre `public/audio/teclado.wav`.
3. **Ambiente de consultorio / sfx:** reemplazar `ambiente.wav` o `sfx-hilo.wav` con el mismo formato (38 s alineados).
4. **Locución:** copiar la grabación a `public/audio/locucion.wav`, poner `VOICEOVER.enabled = true` en `src/config/timeline.ts` y ajustar `from` en
   `Reel.tsx` al fotograma de cada pieza (`VOICEOVER.cues`). Texto en `src/config/script.ts` (`VOICEOVER_TEXT`); la pronunciación de "ADIP" queda a
   confirmar con el equipo. Ver «Espacio para la voz futura» para el ducking recomendado.
5. Después de reemplazar, `npm run audio:verify` sigue sirviendo para (a), (c), (d) y (g) (los chequeos (b) de onsets y (e) fallarán si el teclado/la música
   ya no son los sintetizados: es esperable).

No volver a ejecutar `npm run audio` si ya se reemplazó algún stem: **sobrescribe los cuatro** archivos.

## Cambios respecto de la v1 (35 s)

- Duración 35 → **38 s** (1140 f) en los 4 stems; hitos de `SFX_CUES` v2 (los `threadDescend/threadRise` y `THREAD_TIMING.born*/descend*/rise*` ya no existen).
- Teclado: pausa de la duda explícita; ⌫ sostenida con tecla hundida, repeticiones graves, arrastre y suelta (v1: ticks de −28 a −22 dBFS); mayúsculas, última
  tecla de cada mensaje, paneo por columna del QWERTY y fuerza por velocidad de tipeo.
- Ambiente: suena desde el f0 (v1: entrada de 0,5 s), nivelado, con apertura del aire en la pausa y banda de aire para parlantes de celular.
- Música: 7 compases (v1: 6), resolución de la suspensión en el logo, melodía en la escena 6, cierre plagal con acorde sostenido hasta f1140, pad más grave y «hueco» de voz.
- Verificación: onsets robustos al arrastre, pausa, presencia de ⌫, variación, alineación por banda propia, espacio de voz, volúmenes leídos de `Reel.tsx`.
