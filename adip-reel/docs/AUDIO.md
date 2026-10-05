# Audio del reel — "El mensaje que borraste"

> **Estado: PROVISIONAL (versión de revisión).** Los cuatro stems de `public/audio/` se sintetizan por código y
> sirven para cerrar la edición con sonido sincronizado. Se pueden reemplazar, uno por uno, por **música licenciada**
> y/o **grabación real** (teclado, ambiente de consultorio, locución) sin tocar la animación (ver "Reemplazar").
> Sin locución (`VOICEOVER.enabled = false`): el sentido completo se entiende sin sonido.

## Origen y licencias

- **100 % sintetizado por código** en `scripts/build-audio.ts`: ruido pseudoaleatorio sembrado, osciladores
  (aditivos y FM), filtros biquad, envolventes y reverb de Schroeder/Freeverb. **Sin samples, sin bancos de sonidos,
  sin librerías ni dependencias de audio de terceros.** No queda ningún permiso de terceros pendiente.
- **Determinista:** PRNG `mulberry32` con semilla fija por stem (`src/lib/rng.ts`). Regenerar produce archivos
  idénticos byte a byte (se comprobó con `md5sum` en dos corridas).
- Los tiempos salen de `src/config/timeline.ts` (`SFX_CUES`, `THREAD_TIMING`, `CURSOR_HANDOFF`) y las teclas de
  `src/config/typing.ts` (`KEY_EVENTS`): si cambia el cronograma, se regenera y el audio sigue alineado.

## Cómo regenerar y verificar

```bash
npm run audio          # = node scripts/build-audio.ts   (≈10 s) → public/audio/*.wav
npm run audio:verify   # = node scripts/verify-audio.ts  (≈15 s; requiere ffmpeg/ffprobe en el PATH)
```

Variables opcionales de la verificación: `AUDIO_CHECK_DIR=<carpeta>` (espectrogramas y mezclas de prueba; por
defecto `<tmp>/adip-audio-check`), `AUDIO_VERBOSE=1` (tabla completa de las 128 pulsaciones),
`AUDIO_MUSIC_MAX=0.8` (prueba otro volumen máximo de música en la mezcla "recomendada").

Formato de salida (los 4 archivos): **WAV PCM 16-bit, 48 kHz, estéreo, exactamente 35,000 s (1 680 000 muestras)**.
El fotograma `f` del reel cae en la muestra `round(f/30·48000) = f·1600`: los stems entran en `Reel.tsx` tal cual,
sin `trimBefore` ni desfasajes.

## Stems

| Stem | Qué es | Pico | RMS | Sonoridad (stem solo) |
|---|---|---|---|---|
| `ambiente.wav` | Aire de habitación: ruido marrón/rosa muy filtrado (casi todo bajo ~1 kHz, sin siseo; sin graves < 80 Hz), cutoff y amplitud derivando lento; entrada de 0,5 s y salida de 0,5 s | −27,8 dBFS | **−36,0 dBFS** | −33,9 LUFS |
| `teclado.wav` | 128 pulsaciones exactas (una por `KEY_EVENTS`); silencio digital entre ellas | −12,1 dBFS | −38,8 dBFS | −29,7 LUFS |
| `musica.wav` | Piano eléctrico/felt suave + pad + sub, con reverb sintética; silencio digital hasta el f 410 | **−10,0 dBFS** | −22,3 dBFS | −17,9 LUFS |
| `sfx-hilo.wav` | Acentos sutiles en los hitos (tabla de abajo) | −12,5 dBFS | −32,8 dBFS | −23,2 LUFS |

### teclado.wav
- 128 eventos = 60 teclas + 12 espacios + 4 puntuación + 52 retrocesos, en 108 fotogramas distintos.
- Cada golpe: transitorio de ruido pasa-altos (2–5 kHz, 1–4 ms de decaimiento) + golpe grave (seno 85–290 Hz con
  caída de afinación, decae en ~25 ms) + "tok" de carcasa (≈0,5–1,4 kHz, para que se escuche también en parlantes
  de celular, que no reproducen el grave). Tono, nivel y paneo (±15 %) varían por tecla con el PRNG sembrado.
- Teclas −10,5 … −7,5 dBFS de pico; espacio más grave y más largo (−9 … −7); puntuación apenas más aguda y
  seca; **retroceso** = tick seco y liviano, −28 … −22 dBFS (más suave a propósito).
- **Ráfaga de borrado.** El borrado quita hasta 4 caracteres por fotograma (p. ej. f 195). El primer evento de
  cada fotograma cae exacto en `frame/30 s`; los demás del mismo fotograma se reparten uniformemente dentro de ese
  fotograma (`k·1600/n` muestras, hasta ≈25 ms): suena como una ráfaga que acelera y no como un golpe único
  saturado. Además el nivel de cada tick baja con la densidad de la ráfaga (nunca "chicharra").

### musica.wav
- Compás de 105 fotogramas (3,5 s) desde el f 410; los cambios armónicos caen en 410, 515, 620, 725, 830, 935
  (el de 620 coincide con el descenso del hilo, 622; el de 830 con el ascenso, 832). Re mayor, sobria:

| Compás | Fotogramas | Acorde | Raíz (sub) | Intención |
|---|---|---|---|---|
| 1 | 410–515 | Dmaj7 | D2 | apertura tras la pausa del último mensaje |
| 2 | 515–620 | Bm7 | B1 | vuelve la duda |
| 3 | 620–725 | Gmaj7 | G1 | el giro (baja el hilo) |
| 4 | 725–830 | Asus4 → A6 | A1 | acompañamiento, suspensión que se resuelve |
| 5 | 830–935 | Dmaj7 | D2 | llegada (sube el hilo); el carillón del logo cae acá |
| 6 | 935–1040 | Dmaj9 (sostenido) | D2 | resolución calma que se desvanece |

- Capas: piano (arpegios lentos de 4–6 notas por compás, humanización ±6 ms / ±8 % de velocidad, saturación suave),
  pad (pedal de La3 + voces por grados conjuntos, 3 voces desafinadas con vibrato lento) y sub (seno + 2.º armónico).
  Reverb Freeverb (RT ≈ 2 s, amortiguada, envío sin graves). Limitador de picos a −10 dBFS (reducción máxima 3,4 dB).
- El piano **no toca sobre los hitos de `sfx-hilo`** (452, 540, 622, 832, 912) para dejarles espacio.
- Entrada: swell de 2,5 s (pad/sub desde el silencio, piano desde 35 %). Cierre: fundido propio de coseno
  de 1000 a 1050 (termina en 0 exacto); la cola natural llega a ~1049 sin corte seco. `Reel.tsx` suma además su
  rampa (`musicIn → +75 f` y `musicOutFrom → fin`): ambas se multiplican (resultado: entrada y salida aún más
  suaves). Con esa rampa la primera nota del piano (f 410) queda casi inaudible y la primera audible es la de 436.

### sfx-hilo.wav — hitos (`SFX_CUES`)

| Hito | Fotograma | Tiempo | Sonido | Pico (con reverb) |
|---|---|---|---|---|
| `threadBorn` | 410 | 13,67 s | soplo de aire ascendente (ruido pasa-banda 650→2500 Hz, <4 kHz) + seno que "se estira" Re4→La4 (1,35 s) | −14,8 dBFS |
| `phraseOne` | 452 | 15,07 s | tono grave cálido y breve, Re3 (armónicos 1–3, ataque suave, no campana) | −18,3 dBFS |
| `phraseTwo` | 540 | 18,00 s | ídem, La3 | −19,5 dBFS |
| `threadDescend` | 622 | 20,73 s | glissando descendente suave Si4→Fa#4 (1 s, = `THREAD_TIMING.descend*`) | −19,0 dBFS |
| `subtitleUnits[0..2]` | 656 / 742 / 792 | 21,87 / 24,73 / 26,40 s | "tic" apenas perceptible (seno 1,17 / 1,32 / 1,76 kHz + hálito de ruido) | −34 dBFS |
| `threadRise` | 832 | 27,73 s | glissando ascendente suave La4→Re5 (1,07 s, = `THREAD_TIMING.rise*`) | −17,8 dBFS |
| `logoReveal` | 912 | 30,40 s | carillón cálido, arpegio La5–Re6–Fa#6 (aditivo, decaimiento ≈ 2 s, sin ataque metálico) | −12,5 dBFS |

Todos los acentos (salvo los tics) llevan una reverb corta para que "florezcan" sin quedar secos; el carillón es el pico del stem (−12,5 dBFS) y los demás quedan 2–7 dB por debajo.

## Mezcla y volúmenes

La mezcla final la define `Reel.tsx`. Mezcla simulada (`verify-audio.ts` replica las curvas de volumen y mide con
`ffmpeg ebur128`; pico real = true peak; el pico tras un códec AAC 192 kbps no cambia):

| Escenario | Volúmenes | Sonoridad integrada | Pico real |
|---|---|---|---|
| **Reel.tsx actual (versión de revisión)** | ambiente 0→0,8→0,5→0 · teclado 1 · música 0→0,9→0 · sfx 1 | **−18,5 … −19,3 LUFS** | −6,8 dBTP |
| Música 1,0 (máximo posible) | ídem | −18,5 LUFS | −6,8 dBTP |

- La mezcla actual cae dentro del objetivo (−20 … −16 LUFS integrados) con 5 dB de margen de pico real. Tras la revisión
  independiente se subieron: ambiente a −36 dBFS RMS (antes −42; el arranque ya no suena a silencio digital), teclado
  +5 dB (pico −7 dBFS, incluida la ráfaga de borrado) y se bajó 6 dB el seno del nacimiento del hilo (entrada de la música más suave).
- Contraste arranque ↔ música: arranque ≈ −25 LUFS de corto plazo, música ≈ −17/−19 (LRA ≈ 10 LU, antes 14).
- Con locución real (o con la grabación de la escena 3) `Reel.tsx` baja la música ~6 dB entre las escenas 3 y 4 (ducking
  automático si `VOICEOVER.enabled` o `MEDIA.turnVideo`).
- Los volúmenes > 1 no existen en `<Audio>`: por eso se recomienda ≤ 1,0 y no ganancia extra en los stems.

## Verificación (resultado de la última corrida: `npm run audio:verify` → OK)

- **(a) Formato:** los 4 archivos `pcm_s16le · 48 000 Hz · 2 canales · 16 bit · 35,000000 s · 1 680 000 muestras` (ffprobe).
- **(b) Teclado:** detección **ciega** de onsets (envolvente de energía pasa-altos): 128 eventos esperados,
  **128 onsets detectados, 0 espurios, 0 faltantes**; desvío máximo **0,229 ms** (medio 0,028 ms; los primeros
  eventos de cada fotograma ≤ 0,104 ms). Silencio digital exacto fuera de las ventanas de evento.
- **(c) Picos/clipping:** ningún stem toca 0 dBFS (pico máx. −10,0 dBFS), 0 muestras al extremo, sin continua.
  Sin clics ni discontinuidades en ambiente, música y sfx (detector de 2.ª diferencia). Todos terminan en 0 exacto.
  La música es silencio digital hasta el f 410 (primera muestra no nula: 656 002).
- **(d) Alineación sfx:** los 9 hitos de `SFX_CUES` arrancan en su fotograma (latencia del detector 0,3–11 ms por
  los ataques suaves).
- **(e) Espectrogramas** (`ffmpeg showspectrumpic`) revisados a ojo: sin ruido de banda ancha extraño ni siseo
  agudo (ambiente y música quedan por debajo de −80 dBFS en la banda de 5–10 kHz), glissandos limpios,
  teclas como impulsos bien separados, sin cortes en los empalmes.
- **Límite de la verificación:** son comprobaciones objetivas; **nadie escuchó todavía** estos stems. Conviene una
  escucha humana (auriculares y parlante de celular) antes de publicar.

## Reemplazar por material real o licenciado

1. **Música licenciada:** pasarla a un WAV de 35 s, 48 kHz, estéreo, con silencio hasta el f 410 y cierre suave:
   ```bash
   ffmpeg -i musica-licenciada.wav -af "adelay=13667|13667,apad,atrim=0:35,afade=t=in:st=13.667:d=2.5,afade=t=out:st=33:d=2" \
     -ar 48000 -ac 2 -c:a pcm_s16le public/audio/musica.wav
   ```
   (`13667` ms = f 410; el resultado dura exactamente 35,000 s). Si la música entra en otro momento, cambiar
   `SFX_CUES.musicIn` en `timeline.ts`. Ajustar volumen en `Reel.tsx` según la sonoridad (objetivo −20 … −16 LUFS).
2. **Teclado real:** grabar o editar un teclado a los tiempos de `KEY_EVENTS` (`node -e "import('./src/config/typing.ts').then(m=>console.log(m.KEY_EVENTS))"`)
   y exportarlo con el mismo formato/duración. Mantener el nombre `public/audio/teclado.wav`.
3. **Ambiente de consultorio / sfx:** reemplazar `ambiente.wav` o `sfx-hilo.wav` con el mismo formato (35 s alineados).
4. **Locución:** copiar la grabación a `public/audio/locucion.wav`, poner `VOICEOVER.enabled = true` en
   `src/config/timeline.ts` y ajustar `from` en `Reel.tsx` al fotograma de cada pieza (`VOICEOVER.cues`). Texto en
   `src/config/script.ts` (`VOICEOVER_TEXT`); la pronunciación de "ADIP" queda a confirmar con el equipo.
5. Después de reemplazar, `npm run audio:verify` sigue sirviendo para (a), (c), (d) y (e) (el chequeo (b) de onsets
   fallará si el teclado ya no es el sintetizado: es esperable).

No volver a ejecutar `npm run audio` si ya se reemplazó algún stem: **sobrescribe los cuatro** archivos.
