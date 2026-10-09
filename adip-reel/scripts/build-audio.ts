/**
 * build-audio.ts — v3 · sintetiza por código los 4 stems de audio del reel «El mensaje que borraste» (53 s).
 *
 *   node scripts/build-audio.ts          (o:  npm run audio)
 *
 * - 100 % original: ruido sembrado + osciladores + filtros + reverb de Schroeder/Freeverb. Sin samples de terceros,
 *   sin dependencias npm (síntesis en Float32Array, escritura WAV manual).
 * - Salida: public/audio/{ambiente,teclado,musica,sfx-hilo}.wav — PCM 16-bit, 48 kHz, estéreo, EXACTAMENTE
 *   TOTAL_FRAMES/FPS = 53 s (2 544 000 muestras). Cada stem ya está alineado al reel: el fotograma f cae en la
 *   muestra round(f/30*48000) = f·1600 (sin trimBefore ni desfasajes en Reel.tsx).
 * - Determinista: PRNG sembrado (mulberry32). Mismo resultado en cada ejecución.
 * - Tiempos: salen de src/config/timeline.ts (SFX_CUES, SEND_TIMING, MESSAGE_SPECS…) y src/config/typing.ts (KEY_EVENTS).
 *
 * Solo sintaxis borrable de TypeScript (Node 22 hace type-stripping): sin enums ni parameter properties.
 * Los 4 stems son PROVISIONALES: se pueden reemplazar por música licenciada y grabación real (ver docs/AUDIO.md).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { COMPANION_TIMING, FPS, MESSAGE_SPECS, SEND_TIMING, SFX_CUES, TOTAL_FRAMES } from "../src/config/timeline.ts";
import { KEY_EVENTS, MESSAGE_TIMINGS } from "../src/config/typing.ts";
import type { KeyEvent } from "../src/config/typing.ts";
import { mulberry32 } from "../src/lib/rng.ts";

// ───────────────────────────────────────────────────────────── constantes y utilidades

const SR = 48000;
const SPF = SR / FPS; // muestras por fotograma (1600)
if (!Number.isInteger(SPF)) throw new Error(`SR/FPS debe ser entero (${SPF})`);
const N = TOTAL_FRAMES * SPF; // muestras por stem (2 544 000 = 53 s exactos)
const TWO_PI = Math.PI * 2;

type Rnd = () => number;
type Stem = { l: Float32Array; r: Float32Array };

/** Muestra del fotograma `f` (alineación exacta con el reel). */
const frameToSample = (f: number): number => Math.round((f / FPS) * SR);
const secToSample = (s: number): number => Math.round(s * SR);
const dbToLin = (db: number): number => 10 ** (db / 20);
const linToDb = (x: number): number => 20 * Math.log10(Math.max(x, 1e-12));
const clamp = (x: number, a: number, b: number): number => Math.min(b, Math.max(a, x));
const lerpN = (a: number, b: number, u: number): number => a + (b - a) * u;
/** Rampa coseno 0→1 (derivada nula en los extremos). */
const cosRamp = (u: number): number => 0.5 - 0.5 * Math.cos(Math.PI * clamp(u, 0, 1));
const smoothstep = (u: number): number => {
  const c = clamp(u, 0, 1);
  return c * c * (3 - 2 * c);
};

/**
 * Pausa de la duda y del envío: desde que termina de escribirse «No sé por dónde empezar…» (f612) hasta que se pulsa ENVIAR (f702)
 * no suena NADA salvo el aire de la habitación (ni teclas, ni sfx, ni música). El teclado ya no vuelve a sonar hasta el final.
 */
const PAUSE_FROM = MESSAGE_SPECS[2].typeEnd; // 612
const PAUSE_TO = SEND_TIMING.pressFrom; // 702

const newStem = (): Stem => ({ l: new Float32Array(N), r: new Float32Array(N) });

/** Ganancias de panorama de potencia constante (pan −1 … +1). */
const panGains = (pan: number): [number, number] => {
  const a = ((clamp(pan, -1, 1) + 1) * Math.PI) / 4;
  return [Math.cos(a), Math.sin(a)];
};

/** Suma un buffer mono en `stem` desde la muestra `start` (admite recortes en los bordes). */
function addMono(stem: Stem, start: number, buf: Float32Array, gl: number, gr: number): void {
  const from = Math.max(0, start);
  const to = Math.min(N, start + buf.length);
  for (let i = from; i < to; i++) {
    const v = buf[i - start];
    stem.l[i] += v * gl;
    stem.r[i] += v * gr;
  }
}

/** Suma un buffer estéreo en `stem`. */
function addStereo(stem: Stem, start: number, l: Float32Array, r: Float32Array, gain = 1): void {
  const from = Math.max(0, start);
  const to = Math.min(N, start + l.length);
  for (let i = from; i < to; i++) {
    stem.l[i] += l[i - start] * gain;
    stem.r[i] += r[i - start] * gain;
  }
}

/** dst += src · g (mismo largo o menor). */
function mixInto(dst: Float32Array, src: Float32Array, g: number): void {
  const n = Math.min(dst.length, src.length);
  for (let i = 0; i < n; i++) dst[i] += src[i] * g;
}

const peakOf = (buf: Float32Array): number => {
  let p = 0;
  for (let i = 0; i < buf.length; i++) {
    const a = Math.abs(buf[i]);
    if (a > p) p = a;
  }
  return p;
};

/** Escala `buf` para que su pico sea `peakDb` dBFS. */
function normalizePeak(buf: Float32Array, peakDb: number): Float32Array {
  const p = peakOf(buf);
  if (p > 0) {
    const g = dbToLin(peakDb) / p;
    for (let i = 0; i < buf.length; i++) buf[i] *= g;
  }
  return buf;
}

function rmsOf(l: Float32Array, r: Float32Array, from = 0, to = l.length): number {
  let s = 0;
  for (let i = from; i < to; i++) s += l[i] * l[i] + r[i] * r[i];
  return Math.sqrt(s / (2 * Math.max(1, to - from)));
}

function scaleStem(stem: Stem, g: number): void {
  for (let i = 0; i < N; i++) {
    stem.l[i] *= g;
    stem.r[i] *= g;
  }
}

/** Nombre de nota ("F#4") → Hz (afinación a 440). */
function hz(name: string): number {
  const m = /^([A-G])(#|b)?(-?\d)$/.exec(name);
  if (!m) throw new Error(`nota inválida: ${name}`);
  const base: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const midi = 12 * (Number(m[3]) + 1) + base[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0);
  return 440 * 2 ** ((midi - 69) / 12);
}

// ───────────────────────────────────────────────────────────── filtros

type Filter = (x: number) => number;

/** Biquad genérico (coeficientes sin normalizar). */
function makeBiquad(b0: number, b1: number, b2: number, a0: number, a1: number, a2: number): Filter {
  const nb0 = b0 / a0;
  const nb1 = b1 / a0;
  const nb2 = b2 / a0;
  const na1 = a1 / a0;
  const na2 = a2 / a0;
  let x1 = 0;
  let x2 = 0;
  let y1 = 0;
  let y2 = 0;
  return (x: number): number => {
    const y = nb0 * x + nb1 * x1 + nb2 * x2 - na1 * y1 - na2 * y2;
    x2 = x1;
    x1 = x;
    y2 = y1;
    y1 = y;
    return y;
  };
}

/** Biquad RBJ (lp / hp / bp de ganancia pico 0 dB). */
function biquad(kind: "lp" | "hp" | "bp", fc: number, q: number): Filter {
  const w0 = (TWO_PI * fc) / SR;
  const cs = Math.cos(w0);
  const alpha = Math.sin(w0) / (2 * q);
  if (kind === "lp") return makeBiquad((1 - cs) / 2, 1 - cs, (1 - cs) / 2, 1 + alpha, -2 * cs, 1 - alpha);
  if (kind === "hp") return makeBiquad((1 + cs) / 2, -(1 + cs), (1 + cs) / 2, 1 + alpha, -2 * cs, 1 - alpha);
  return makeBiquad(alpha, 0, -alpha, 1 + alpha, -2 * cs, 1 - alpha);
}

/** Ecualizador paramétrico (campana RBJ): `gainDb` < 0 abre un «hueco» (usado para dejar sitio a la voz). */
function peakEq(fc: number, q: number, gainDb: number): Filter {
  const A = 10 ** (gainDb / 40);
  const w0 = (TWO_PI * fc) / SR;
  const cs = Math.cos(w0);
  const alpha = Math.sin(w0) / (2 * q);
  return makeBiquad(1 + alpha * A, -2 * cs, 1 - alpha * A, 1 + alpha / A, -2 * cs, 1 - alpha / A);
}

/** Pasa-bajos de un polo (coeficiente por frecuencia de corte). */
const onePoleCoef = (fc: number): number => 1 - Math.exp((-TWO_PI * fc) / SR);

// ───────────────────────────────────────────────────────────── reverb (Freeverb: 8 combs + 4 allpass por canal)

const COMB_TUNING = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617].map((t) => Math.round((t * SR) / 44100));
const ALLPASS_TUNING = [556, 441, 341, 225].map((t) => Math.round((t * SR) / 44100));
const STEREO_SPREAD = Math.round((23 * SR) / 44100);

function reverbChannel(input: Float32Array, spread: number, feedback: number, damp: number): Float32Array {
  const out = new Float32Array(input.length);
  const combs = COMB_TUNING.map((t) => ({ buf: new Float32Array(t + spread), idx: 0, filt: 0 }));
  const aps = ALLPASS_TUNING.map((t) => ({ buf: new Float32Array(t + spread), idx: 0 }));
  for (let n = 0; n < input.length; n++) {
    const x = input[n] * 0.015;
    let acc = 0;
    for (const c of combs) {
      const y = c.buf[c.idx];
      c.filt = y * (1 - damp) + c.filt * damp;
      c.buf[c.idx] = x + c.filt * feedback;
      c.idx = c.idx + 1 === c.buf.length ? 0 : c.idx + 1;
      acc += y;
    }
    for (const a of aps) {
      const b = a.buf[a.idx];
      const y = -acc + b;
      a.buf[a.idx] = acc + b * 0.5;
      a.idx = a.idx + 1 === a.buf.length ? 0 : a.idx + 1;
      acc = y;
    }
    out[n] = acc;
  }
  return out;
}

type ReverbOpts = { feedback: number; damp: number; preDelayMs: number; wetDb: number };

/**
 * Reverb estéreo sintética (Schroeder/Freeverb). Devuelve SOLO la señal húmeda, escalada para que su RMS
 * quede `wetDb` dB respecto del RMS de la señal de entrada (más fácil de balancear que una ganancia fija).
 */
function reverbWet(src: Stem, o: ReverbOpts): Stem {
  const pre = secToSample(o.preDelayMs / 1000);
  const mono = new Float32Array(N);
  for (let i = 0; i + pre < N; i++) mono[i + pre] = (src.l[i] + src.r[i]) * 0.5;
  const l = reverbChannel(mono, 0, o.feedback, o.damp);
  const r = reverbChannel(mono, STEREO_SPREAD, o.feedback, o.damp);
  const dryRms = rmsOf(src.l, src.r);
  const wetRms = rmsOf(l, r);
  const g = wetRms > 0 ? (dryRms * dbToLin(o.wetDb)) / wetRms : 0;
  for (let i = 0; i < N; i++) {
    l[i] *= g;
    r[i] *= g;
  }
  return { l, r };
}

// ───────────────────────────────────────────────────────────── limitador con lookahead

/** Limitador de picos (lookahead `lookMs`, recuperación `releaseMs`): el pico de salida nunca supera `ceilingDb`. */
function limit(stem: Stem, ceilingDb: number, lookMs = 5, releaseMs = 160): number {
  const ceil = dbToLin(ceilingDb);
  const look = Math.round((lookMs * SR) / 1000);
  const g = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const p = Math.max(Math.abs(stem.l[i]), Math.abs(stem.r[i]));
    g[i] = p > ceil ? ceil / p : 1;
  }
  // mínimo deslizante centrado (ventana 2·look+1) con deque monótona
  const gmin = new Float32Array(N);
  const dq = new Int32Array(N);
  let head = 0;
  let tail = 0;
  for (let i = 0; i < N + look; i++) {
    if (i < N) {
      while (tail > head && g[dq[tail - 1]] >= g[i]) tail--;
      dq[tail++] = i;
    }
    while (dq[head] < i - 2 * look) head++;
    const c = i - look;
    if (c >= 0) gmin[c] = g[dq[head]];
  }
  // media móvil (misma ventana) → atenuación suave sin sobrepicos
  const win = 2 * look + 1;
  const pre = new Float64Array(N + 1);
  for (let i = 0; i < N; i++) pre[i + 1] = pre[i] + gmin[i];
  const relCoef = 1 - Math.exp(-1 / ((releaseMs / 1000) * SR));
  let prev = 1;
  let maxReduction = 0;
  for (let i = 0; i < N; i++) {
    const a = Math.max(0, i - look);
    const b = Math.min(N, i + look + 1);
    const avg = (pre[b] - pre[a]) / (b - a < win ? b - a : win);
    // la ganancia solo puede subir con la constante de recuperación (pero nunca por encima de `avg`)
    const target = avg < prev ? avg : Math.min(avg, prev + (1 - prev) * relCoef);
    prev = target;
    stem.l[i] *= target;
    stem.r[i] *= target;
    if (1 - target > maxReduction) maxReduction = 1 - target;
  }
  return -linToDb(1 - maxReduction); // reducción máxima en dB (positivo)
}

// ───────────────────────────────────────────────────────────── escritura WAV

function wavBytes(stem: Stem): Buffer {
  const dataBytes = N * 4;
  const header = Buffer.alloc(44);
  header.write("RIFF", 0, "ascii");
  header.writeUInt32LE(36 + dataBytes, 4);
  header.write("WAVE", 8, "ascii");
  header.write("fmt ", 12, "ascii");
  header.writeUInt32LE(16, 16); // tamaño del bloque fmt
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(2, 22); // estéreo
  header.writeUInt32LE(SR, 24);
  header.writeUInt32LE(SR * 4, 28); // byte rate
  header.writeUInt16LE(4, 32); // block align
  header.writeUInt16LE(16, 34); // bits por muestra
  header.write("data", 36, "ascii");
  header.writeUInt32LE(dataBytes, 40);
  const pcm = Buffer.alloc(dataBytes);
  let o = 0;
  for (let i = 0; i < N; i++) {
    pcm.writeInt16LE(Math.round(clamp(stem.l[i], -1, 1) * 32767), o);
    pcm.writeInt16LE(Math.round(clamp(stem.r[i], -1, 1) * 32767), o + 2);
    o += 4;
  }
  return Buffer.concat([header, pcm]);
}

const OUT_DIR = fileURLToPath(new URL("../public/audio/", import.meta.url));

/**
 * Ajuste general de sonoridad (dB), aplicado a los cuatro stems al escribirlos: sube todo parejo, sin cambiar el balance relativo
 * (QA R1: la mezcla de −18,5 LUFS / −5,3 dBTP sonaba baja en parlantes de celular). Los niveles de diseño de más abajo ("pico −17 dBFS"…)
 * son ANTES de este ajuste; verify-audio.ts copia la constante (si se cambia acá, actualizarla allá).
 */
const MASTER_TRIM_DB = 3;

function writeStem(file: string, stem: Stem): void {
  mkdirSync(OUT_DIR, { recursive: true });
  scaleStem(stem, dbToLin(MASTER_TRIM_DB));
  writeFileSync(OUT_DIR + file, wavBytes(stem));
  const peak = Math.max(peakOf(stem.l), peakOf(stem.r));
  const rms = rmsOf(stem.l, stem.r);
  console.log(`  ${file.padEnd(14)} pico ${linToDb(peak).toFixed(1).padStart(6)} dBFS · RMS ${linToDb(rms).toFixed(1).padStart(6)} dBFS · ${(N / SR).toFixed(3)} s`);
}

/** Depuración: AUDIO_DUMP_LAYERS=<carpeta> escribe también las capas de la música (piano, pad, bajo, sub, reverb) para analizarlas. */
const DUMP_DIR = process.env.AUDIO_DUMP_LAYERS;
function dumpLayer(name: string, stem: Stem): void {
  if (!DUMP_DIR) return;
  mkdirSync(DUMP_DIR, { recursive: true });
  writeFileSync(`${DUMP_DIR}/${name}.wav`, wavBytes(stem));
}

// ───────────────────────────────────────────────────────────── 1) ambiente.wav

/**
 * «Apertura» del aire en la pausa de la duda (0 → 1): sube suave desde que termina el tipeo (f612), se sostiene hasta el
 * envío (f702) y se relaja despacio cuando llega la respuesta. Es el único cambio perceptible del ambiente: apenas.
 */
const airOpen = (frame: number): number => {
  const up = smoothstep((frame - PAUSE_FROM) / 60);
  const down = 1 - smoothstep((frame - SFX_CUES.reply - 6) / 100);
  return up * down;
};

/** «Calma» bajo la respuesta (0 → 1): desde que llega «Estoy acá. Te escucho.» el aire se aquieta (algo más oscuro, más centrado, −1 dB). */
const airCalm = (frame: number): number => smoothstep((frame - SFX_CUES.reply) / 110);

/** RMS objetivo del ambiente (dBFS). Audible pero discreto; > −40 dBFS desde el fotograma 0. */
const AMBIENCE_RMS_DB = -32.5;

/**
 * Aire de habitación: ruido marrón/rosa filtrado muy abajo + una banda de «aire» suave (≈1–3 kHz, sin siseo agudo) que
 * le da presencia en parlantes de celular. Cutoff y amplitud derivan lentamente. Suena desde el fotograma 0.
 * Evolución (v3): en la pausa de la duda (f612–f702) el aire se abre (cutoff +380 Hz, +1,8 dB, más banda de aire, algo más de
 * ancho estéreo); con la respuesta (f790) se aquieta (calma: algo más oscuro y centrado, −1 dB) mientras entra la música.
 */
function buildAmbience(): Stem {
  const rnd = mulberry32(0xa11b1e27);
  const stem = newStem();
  const channels = [stem.l, stem.r];
  const common = new Float32Array(N);

  // fuente común (parte correlacionada entre canales → sensación de «una sola sala»)
  {
    let brown = 0;
    for (let n = 0; n < N; n++) {
      brown = (brown + 0.02 * (rnd() * 2 - 1)) / 1.02;
      common[n] = brown;
    }
  }

  for (let ch = 0; ch < 2; ch++) {
    const out = channels[ch];
    const ph = [rnd() * TWO_PI, rnd() * TWO_PI, rnd() * TWO_PI, rnd() * TWO_PI];
    let brown = 0;
    let b0 = 0;
    let b1 = 0;
    let b2 = 0; // ruido rosa (Paul Kellet, versión económica)
    let lpB = 0;
    let lpP = 0;
    let lpC = 0;
    const hp1 = biquad("hp", 80, 0.707);
    const hp2 = biquad("hp", 80, 0.707); // 4.º orden: sin rumble de subgraves (inaudible en parlantes chicos, solo gasta margen)
    const airBp = biquad("bp", 1500, 0.6);
    const airLp1 = biquad("lp", 2600, 0.707);
    const airLp2 = biquad("lp", 2600, 0.707);
    for (let n = 0; n < N; n++) {
      const t = n / SR;
      const op = airOpen(n / SPF);
      const calm = airCalm(n / SPF);
      const white = rnd() * 2 - 1;
      brown = (brown + 0.02 * white) / 1.02;
      const w2 = rnd() * 2 - 1;
      b0 = 0.99765 * b0 + w2 * 0.099046;
      b1 = 0.963 * b1 + w2 * 0.2965164;
      b2 = 0.57 * b2 + w2 * 1.0526913;
      const pink = b0 + b1 + b2 + w2 * 0.1848;
      // cutoff que «respira» lentamente (400–760 Hz), se abre en la pausa de duda y se aquieta con la respuesta
      const fc = 640 + 170 * Math.sin(TWO_PI * 0.047 * t + ph[0]) + 80 * Math.sin(TWO_PI * 0.113 * t + ph[1]) + 380 * op - 110 * calm;
      const a = onePoleCoef(fc);
      lpB += a * (brown * 7 - lpB);
      lpC += a * (common[n] * 7 - lpC);
      lpP += onePoleCoef(900) * (pink * 0.05 - lpP);
      const amp = (1 + 0.1 * Math.sin(TWO_PI * 0.071 * t + ph[2]) + 0.06 * Math.sin(TWO_PI * 0.173 * t + ph[3])) ;
      const commonMix = 0.45 - 0.17 * op + 0.12 * calm; // al abrirse el aire, la sala se ensancha un poco; en la calma se centra
      const low = hp2(hp1((0.8 * lpB + commonMix * lpC + 0.34 * lpP) * amp));
      // banda de «aire» (≈1–3 kHz): casi inaudible por sí sola; da presencia en parlantes de celular; crece en la pausa
      const airAmp = (0.4 + 1.0 * op - 0.18 * calm) * (1 + 0.2 * Math.sin(TWO_PI * 0.083 * t + ph[0] * 1.7));
      const air = airLp2(airLp1(airBp(rnd() * 2 - 1))) * 0.17 * airAmp;
      out[n] = low + air;
    }
  }

  // nivelación lenta: el ruido marrón deriva en nivel entre tramos; se fija una envolvente estable (el RMS de cualquier tramo
  // de ≈1,5 s queda a ±0,5 dB de la curva objetivo: «respira» apenas, se abre +1,8 dB en la pausa de duda y baja −1 dB con la
  // respuesta) para que el aire esté SIEMPRE audible desde el fotograma 0
  {
    const e = new Float64Array(N);
    const k = onePoleCoef(1 / 1.2);
    let sm = 0;
    for (let i = 0; i < N; i++) {
      sm += k * ((stem.l[i] * stem.l[i] + stem.r[i] * stem.r[i]) * 0.5 - sm);
      e[i] = sm;
    }
    sm = e[N - 1];
    for (let i = N - 1; i >= 0; i--) {
      sm += k * (e[i] - sm);
      e[i] = sm;
    }
    for (let i = 0; i < N; i++) {
      const t = i / SR;
      const op = airOpen(i / SPF);
      const tgt = (1 + 0.04 * Math.sin(TWO_PI * 0.061 * t)) * (1 + 0.22 * op) * (1 - 0.12 * airCalm(i / SPF));
      const g = tgt / Math.sqrt(Math.max(e[i], 1e-12));
      stem.l[i] *= g;
      stem.r[i] *= g;
    }
  }

  // entrada de 30 ms (anti-clic: suena desde el fotograma 0) y salida de 0,6 s (coseno); último valor exactamente 0
  const fadeIn = secToSample(0.03);
  const fadeOut = secToSample(0.6);
  for (let i = 0; i < N; i++) {
    const gIn = i < fadeIn ? cosRamp(i / fadeIn) : 1;
    const gOut = i > N - fadeOut ? cosRamp((N - 1 - i) / fadeOut) : 1;
    const g = gIn * gOut;
    stem.l[i] *= g;
    stem.r[i] *= g;
  }
  const rms = rmsOf(stem.l, stem.r);
  scaleStem(stem, dbToLin(AMBIENCE_RMS_DB) / rms);
  return stem;
}

// ───────────────────────────────────────────────────────────── 2) teclado.wav

/**
 * Teclado de celular sintetizado, una pulsación por KEY_EVENTS en frame/30 s exactos (el primer evento de cada
 * fotograma; los demás de la ráfaga de borrado se reparten dentro de ese mismo fotograma).
 *  - letra: «tap» suave; su paneo sigue la columna de la tecla en el QWERTY (mano izquierda a la izquierda…);
 *    la fuerza depende de la velocidad de tipeo; la mayúscula pesa algo más; la última tecla de cada mensaje cae
 *    más asentada (cola más larga).
 *  - espacio: más grave y largo; puntuación: más seca y aguda con una resonancia breve.
 *  - BORRAR (⌫): la tecla se mantiene. Primer evento = «tecla hundida» (golpe pesado y claro); los siguientes = repeticiones
 *    que se vuelven más graves y más veloces (retroceso), con un leve «arrastre» de fricción por debajo que sigue la densidad
 *    de la ráfaga; el último evento «suelta» la tecla (golpe de cierre). Mucho más presente que en la v1.
 *  - v3: el borrado quita 1 carácter por fotograma como máximo (27 y 25 retrocesos en 40 f); el mensaje 3 NO se borra (se envía).
 *  - No hay NINGUNA pulsación (ni arrastre) desde el fin del tipeo del mensaje 3 (f612) hasta el final: silencio digital
 *    (la pausa de la duda y del envío suena solo a aire; ENVIAR es un acento de sfx-hilo, no del teclado).
 */
type KeyVoiceSpec = {
  dur: number;
  hpFc: number;
  clickTau: number;
  clickW: number;
  thumpHz: number;
  thumpTau: number;
  thumpW: number;
  thumpDrop: number;
  tokHz: number;
  tokTau: number;
  tokW: number;
  ringHz: number;
  ringTau: number;
  ringW: number;
  roomTau: number;
  roomW: number;
};

/** Ajuste global del nivel del teclado (dB). Se afinó para que la mezcla simulada quede en −20…−16 LUFS con margen. */
const KEYS_TRIM_DB = 1.5;

const KB_ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
const KB_ROW_OFFSET = [0, 0.3, 0.9];
const deaccent = (c: string): string => c.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Posición de la tecla en el teclado: paneo (−0,25 … +0,2) y fila (0 arriba … 2 abajo). */
function keyPlace(ch: string): { pan: number; row: number } {
  const b = deaccent(ch);
  for (let r = 0; r < KB_ROWS.length; r++) {
    const i = KB_ROWS[r].indexOf(b);
    if (i >= 0) return { pan: ((i + KB_ROW_OFFSET[r]) / 9.6 - 0.5) * 0.5, row: r };
  }
  return { pan: 0, row: 1 };
}

const isCapital = (c: string): boolean => c !== c.toLowerCase() && c === c.toUpperCase();

function keySpec(kind: "key" | "space" | "punct" | "bs-down" | "bs-tick" | "bs-last", o: { row: number; capital: boolean; final: boolean; u: number }, rnd: Rnd): KeyVoiceSpec {
  const r = (a: number, b: number): number => a + (b - a) * rnd();
  const base: KeyVoiceSpec = {
    dur: 0.11, hpFc: 3000, clickTau: 0.002, clickW: 0.7, thumpHz: 160, thumpTau: 0.008, thumpW: 0.8, thumpDrop: 0.18,
    tokHz: 1000, tokTau: 0.0045, tokW: 0.55, ringHz: 2500, ringTau: 0.009, ringW: 0, roomTau: 0.018, roomW: 0.1,
  };
  switch (kind) {
    case "space": // más grave y un poco más larga (el «golpe» de la barra)
      return { ...base, dur: 0.17, hpFc: r(1600, 2400), clickTau: r(0.003, 0.0042), clickW: 0.5, thumpHz: r(84, 112), thumpTau: r(0.014, 0.019), thumpW: 0.9, thumpDrop: 0.22, tokHz: r(520, 700), tokTau: 0.009, tokW: 0.5, roomW: 0.14, roomTau: 0.022 };
    case "punct": // más seca y aguda, con un «ting» mínimo de resonancia
      return { ...base, dur: pick(o.final, 0.11, 0.17), hpFc: r(3000, 4300), clickTau: r(0.0013, 0.0021), clickW: 0.8, thumpHz: r(160, 220), thumpTau: pick(o.final, r(0.0065, 0.0085), 0.012), thumpW: 0.6, tokHz: r(1100, 1600), tokTau: 0.004, tokW: 0.5, ringHz: r(2250, 2900), ringTau: 0.009, ringW: 0.24 };
    case "bs-down": // ⌫ hundida: golpe pesado y claro («tecla sostenida»)
      return { ...base, dur: 0.16, hpFc: r(2200, 3000), clickTau: r(0.0022, 0.003), clickW: 0.6, thumpHz: r(98, 116), thumpTau: r(0.016, 0.02), thumpW: 1, thumpDrop: 0.24, tokHz: r(560, 720), tokTau: 0.0085, tokW: 0.6, roomW: 0.13, roomTau: 0.02 };
    case "bs-tick": // repetición: seca pero con cuerpo; se vuelve más grave a medida que avanza el borrado (el texto «retrocede»)
      return { ...base, dur: 0.08, hpFc: r(2600, 4000), clickTau: r(0.0011, 0.0017), clickW: 0.6, thumpHz: lerpN(235, 140, o.u) * r(0.96, 1.04), thumpTau: r(0.0036, 0.0046), thumpW: 0.66, tokHz: lerpN(1050, 640, o.u) * r(0.95, 1.05), tokTau: 0.0018, tokW: 0.42, roomW: 0.05, roomTau: 0.01 };
    case "bs-last": // ⌫ suelta: golpe de cierre asentado
      return { ...base, dur: 0.14, hpFc: r(2400, 3200), clickTau: r(0.002, 0.0027), clickW: 0.6, thumpHz: r(128, 150), thumpTau: r(0.011, 0.014), thumpW: 0.9, thumpDrop: 0.2, tokHz: r(700, 900), tokTau: 0.0065, tokW: 0.55, roomW: 0.12, roomTau: 0.018 };
    default: {
      // tecla normal: tap suave de membrana/notebook. Fila alta → algo más aguda, fila baja → algo más grave.
      const rowK = 1 + (1 - o.row) * 0.045;
      const cap = o.capital ? 1 : 0;
      return {
        ...base,
        dur: pick(o.final, 0.12, 0.18) + 0.015 * cap,
        hpFc: r(2000, 3800),
        clickTau: r(0.0016, 0.0028),
        clickW: 0.82,
        thumpHz: r(130, 190) * rowK * (cap ? 0.9 : 1),
        thumpTau: pick(o.final, r(0.0075, 0.0095), 0.0125) * (cap ? 1.3 : 1),
        thumpW: 0.62 + 0.14 * cap,
        tokHz: r(800, 1300) * rowK * (cap ? 0.88 : 1),
        tokW: 0.6 + 0.1 * cap,
        roomW: pick(o.final, 0.1, 0.15),
      };
    }
  }
}
function pick(isFinal: boolean, normal: number, final: number): number {
  return isFinal ? final : normal;
}

/** Una pulsación (mono, pico normalizado a 1): transitorio de ruido pasa-altos + golpe grave + «tok» de carcasa (+ resonancia y mini sala). */
function keyVoice(s: KeyVoiceSpec, rnd: Rnd): Float32Array {
  const len = secToSample(s.dur);
  const click = new Float32Array(len);
  const thump = new Float32Array(len);
  const tok = new Float32Array(len);
  const ring = new Float32Array(len);
  const room = new Float32Array(len);
  const hp = biquad("hp", s.hpFc, 0.707);
  const lp = biquad("lp", 7000, 0.707);
  const bp = biquad("bp", s.tokHz, 2);
  const roomLp = biquad("lp", 2200, 0.707);
  let phase = 0;
  const ringPh = rnd() * TWO_PI;
  for (let n = 0; n < len; n++) {
    const t = n / SR;
    const att = 1 - Math.exp(-t / 0.0003); // ataque ~0,3 ms (sin clic digital, pero instante exacto)
    click[n] = lp(hp(rnd() * 2 - 1)) * att * Math.exp(-t / s.clickTau);
    const f = s.thumpHz * (1 + s.thumpDrop * Math.exp(-t / 0.01));
    phase += (TWO_PI * f) / SR;
    thump[n] = (Math.cos(phase) + 0.25 * Math.cos(2 * phase) * Math.exp(-t / (s.thumpTau * 0.5))) * (1 - Math.exp(-t / 0.0004)) * Math.exp(-t / s.thumpTau);
    tok[n] = bp(rnd() * 2 - 1) * att * Math.exp(-t / s.tokTau);
    if (s.ringW > 0) ring[n] = Math.sin(TWO_PI * s.ringHz * t + ringPh) * att * Math.exp(-t / s.ringTau);
    // mini sala: cola difusa que crece 2 ms y decae (sin ecos discretos → no crea falsos transitorios)
    room[n] = roomLp(rnd() * 2 - 1) * (1 - Math.exp(-t / 0.002)) * Math.exp(-t / s.roomTau);
  }
  normalizePeak(click, 0);
  normalizePeak(thump, 0);
  normalizePeak(tok, 0);
  if (s.ringW > 0) normalizePeak(ring, 0);
  normalizePeak(room, 0);
  const out = new Float32Array(len);
  for (let n = 0; n < len; n++) out[n] = s.clickW * click[n] + s.thumpW * thump[n] + s.tokW * tok[n] + s.ringW * ring[n] + s.roomW * room[n];
  // cola a cero exacto (últimos 8 ms)
  const taper = secToSample(0.008);
  for (let n = len - taper; n < len; n++) out[n] *= cosRamp((len - 1 - n) / taper);
  return normalizePeak(out, 0);
}

/**
 * «Arrastre» del borrado sostenido: fricción suave (ruido de banda ≈0,5→1 kHz, casi nada sobre 1,5 kHz) cuya envolvente sigue la densidad de
 * pulsaciones de la ráfaga (sube con la aceleración, suelta ≈0,3 s después de la última). Empieza EN el primer evento
 * (no antes) y termina en cero. Mantenido bajo y con poca energía sobre 1,8 kHz para no crear falsos onsets.
 */
function dragBed(starts: number[], rnd: Rnd): { start: number; buf: Float32Array } {
  const t0 = starts[0];
  const t1 = starts[starts.length - 1];
  const len = t1 - t0 + secToSample(0.32);
  const sum = new Float64Array(len);
  const tau = 0.05 * SR;
  for (const s of starts) {
    const o = s - t0;
    for (let n = o; n < len; n++) {
      const d = n - o;
      if (d > 6 * tau) break;
      sum[n] += 0.5 * Math.exp(-d / tau);
    }
  }
  const buf = new Float32Array(len);
  // filtro de estado variable: banda que sube durante el borrado (la ráfaga se acelera)
  let low = 0;
  let band = 0;
  const lp1 = biquad("lp", 1150, 0.707);
  const lp2 = biquad("lp", 1150, 0.707);
  let envS = 0;
  const att = onePoleCoef(160);
  const activeLen = t1 - t0 + 1;
  for (let n = 0; n < len; n++) {
    const u = clamp(n / activeLen, 0, 1);
    const fc = lerpN(520, 980, u);
    const f = 2 * Math.sin((Math.PI * fc) / SR);
    const x = rnd() * 2 - 1;
    low += f * band;
    const high = x - low - band / 1.1;
    band += f * high;
    envS += att * (1 - Math.exp(-sum[n] * 0.55) - envS);
    buf[n] = lp2(lp1(band)) * envS;
  }
  const taper = secToSample(0.03);
  for (let n = len - taper; n < len; n++) buf[n] *= cosRamp((len - 1 - n) / taper);
  return { start: t0, buf };
}

function buildKeys(): Stem {
  const rnd = mulberry32(0x4b455934);
  const stem = newStem();
  const groupSize = new Map<number, number>();
  for (const e of KEY_EVENTS) groupSize.set(e.frame, (groupSize.get(e.frame) ?? 0) + 1);
  const seen = new Map<number, number>();
  const backs = KEY_EVENTS.filter((e) => e.kind === "backspace").map((e) => e.frame);
  const runs = MESSAGE_TIMINGS.map((_, mi) => KEY_EVENTS.filter((e) => e.kind === "backspace" && e.message === mi));
  const lastTypedFrame = MESSAGE_TIMINGS.map((m) => m.charFrames[m.charFrames.length - 1]);
  const prevTyped = new Map<number, number>();
  const runStarts = new Map<number, number[]>();
  const counts: Record<string, number> = {};

  for (const e of KEY_EVENTS as readonly KeyEvent[]) {
    const n = groupSize.get(e.frame) ?? 1;
    const k = seen.get(e.frame) ?? 0;
    seen.set(e.frame, k + 1);
    const start = frameToSample(e.frame) + Math.floor((k * SPF) / n);
    const jitter = rnd(); // nivel por tecla (determinista)
    const panJitter = (rnd() * 2 - 1) * 0.06;
    let peakDb: number;
    let pan: number;
    let spec: KeyVoiceSpec;
    let tag: string;

    if (e.kind === "backspace") {
      const run = runs[e.message];
      const idx = run.indexOf(e);
      const u = run.length > 1 ? idx / (run.length - 1) : 1;
      const dens = backs.filter((f) => Math.abs(f - e.frame) <= 2).length;
      if (idx === 0) {
        tag = "bs-down";
        peakDb = -7.3 + (jitter - 0.5) * 1.5;
      } else if (idx === run.length - 1) {
        tag = "bs-last";
        peakDb = -10.5 + (jitter - 0.5) * 1.5;
      } else {
        tag = "bs-tick";
        // mucho más presente que en la v1 (−28…−22 dBFS): ≈ −15…−11 dBFS, algo menos cuando la ráfaga es muy densa
        peakDb = -11.5 + (jitter - 0.5) * 3 - 8 * Math.log10(1 + 0.25 * (dens - 1)) + 1.2 * u;
      }
      pan = 0.22 + panJitter; // ⌫ vive a la derecha del teclado
      spec = keySpec(tag as "bs-down" | "bs-tick" | "bs-last", { row: 0, capital: false, final: false, u }, rnd);
      const arr = runStarts.get(e.message) ?? [];
      arr.push(start);
      runStarts.set(e.message, arr);
    } else {
      const prev = prevTyped.get(e.message);
      const gap = prev === undefined ? 6 : e.frame - prev;
      prevTyped.set(e.message, e.frame);
      const vel = clamp((gap - 1) / 4, 0, 1); // tipeo rápido → más suave; tras una duda → más firme
      const isFinal = e.frame === lastTypedFrame[e.message];
      const place = keyPlace(e.char);
      if (e.kind === "space") {
        tag = "space";
        peakDb = -9.4 + 1.2 * vel + (jitter - 0.5) * 1.6;
        pan = 0.02 + panJitter;
        spec = keySpec("space", { row: 2, capital: false, final: false, u: 0 }, rnd);
      } else if (e.kind === "punct") {
        tag = "punct";
        peakDb = -10.4 + 1.2 * vel + (jitter - 0.5) * 1.6 + (isFinal ? 1.0 : 0);
        pan = 0.18 + panJitter;
        spec = keySpec("punct", { row: 0, capital: false, final: isFinal, u: 0 }, rnd);
      } else {
        const cap = isCapital(e.char);
        tag = cap ? "capital" : "key";
        peakDb = -11.4 + 2.2 * vel + (jitter - 0.5) * 2.2 + (cap ? 1.4 : 0) + (isFinal ? 0.6 : 0);
        pan = place.pan + panJitter;
        spec = keySpec("key", { row: place.row, capital: cap, final: isFinal, u: 0 }, rnd);
      }
    }
    peakDb += KEYS_TRIM_DB;
    counts[tag] = (counts[tag] ?? 0) + 1;
    const voice = keyVoice(spec, rnd);
    let [gl, gr] = panGains(pan);
    const m = Math.max(gl, gr);
    gl = (gl / m) * dbToLin(peakDb);
    gr = (gr / m) * dbToLin(peakDb);
    addMono(stem, start, voice, gl, gr);
  }

  // «arrastre» de cada ráfaga de borrado (tecla ⌫ sostenida)
  for (const [, starts] of runStarts) {
    const { start, buf } = dragBed(starts, rnd);
    normalizePeak(buf, -23);
    const [gl, gr] = panGains(0.1);
    addMono(stem, start, buf, gl / Math.max(gl, gr), gr / Math.max(gl, gr));
  }
  console.log(`  [teclado] eventos: ${Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(" · ")} · ráfagas de borrado: ${runStarts.size}`);
  return stem;
}

// ───────────────────────────────────────────────────────────── 3) musica.wav

/**
 * Música 53 s: instrumental cálida y sutil. Silencio digital hasta SFX_CUES.musicIn (f790): entra con la respuesta
 * «Estoy acá. Te escucho.». Compases de 105 fotogramas (3,5 s) desde ahí; cambios armónicos en
 * 790, 895, 1000, 1105, 1210, 1315, 1420, 1525. Re mayor, con pedal de La (A2) sostenido bajo todos los acordes:
 *
 *  1  790   Dmaj7       llega la respuesta (790): la música entra suave, escasa
 *  2  895   Bm7         la transición del naranja (900) y la 1.ª frase del giro (930)
 *  3  1000  Gmaj7(9)    2.ª frase del giro (998) → «se abre»; el naranja se retira y entra la ilustración (1068)
 *  4  1105  Asus4 → A   escena de escucha: entra la amiga (1104), texto (1114), llega (1154); la suspensión resuelve en el gesto (1172)
 *  5  1210  Dmaj9       firma (1240) y logo (1254): el acorde más pleno
 *  6  1315  Gmaj7(9)    bloque 2 de la firma (1304)
 *  7  1420  Em9         mensaje final (1420), fecha (1458) y composición final estática (1498): melodía sencilla
 *  8  1525  Dmaj9       resolución calma (ii → I) que se desvanece sin corte hasta f1590
 *
 * Cada acento de sfx-hilo abre un «hueco» de −3 dB en la música (DUCK_*): sin él la música, que concentra la energía en graves, los tapa.
 *
 * Espacio para la voz futura (la locución dirá las frases del giro, la firma y el cierre): pad una octava más grave, piano
 * escaso y suave en registro medio-grave, «hueco» de ecualización (campana −4 dB ≈1,15 kHz) mientras hay texto, y banda
 * 300–3000 Hz contenida (se mide en verify-audio.ts).
 */
const BAR_FRAMES = 105;
const MUSIC_IN = SFX_CUES.musicIn;
const END_FRAME = TOTAL_FRAMES;
/** Acento de cierre (no está en SFX_CUES): coincide con el último cambio armónico (compás 8 = resolución). */
const CLOSE_CUE = MUSIC_IN + 7 * BAR_FRAMES;
const barStart = (i: number): number => MUSIC_IN + i * BAR_FRAMES;
/**
 * Hueco de la música bajo cada acento de sfx-hilo (QA R3: la música, con casi toda la energía en graves, tapaba los acentos). Baja DUCK_DB dB
 * un instante antes del acento, se sostiene DUCK_HOLD_S y vuelve con coseno; dos acentos seguidos (firma 1240 y logo 1254) se funden en un
 * solo hueco (mínimo de las ganancias, nunca más profundo que DUCK_DB). Va en el stem, no en Reel.tsx. El swell de la transición (900) no
 * lo lleva: dura 3 s y se mezcla sin taparse (se afina con su propio nivel); la llegada de la respuesta (790) suena antes de la música.
 */
const DUCK_DB = -3;
const DUCK_PRE_S = 0.08;
const DUCK_HOLD_S = 0.25;
const DUCK_RELEASE_S = 0.35;
const DUCK_CUES: readonly number[] = [
  SFX_CUES.phraseOne,
  SFX_CUES.phraseTwo,
  SFX_CUES.reveal,
  SFX_CUES.companionText,
  SFX_CUES.friendArrive,
  SFX_CUES.gesture,
  SFX_CUES.signatureOne,
  SFX_CUES.logoReveal,
  SFX_CUES.signatureTwo,
  SFX_CUES.finalMessage,
  SFX_CUES.finalDate,
  CLOSE_CUE,
];
/** Inicio del fundido final propio del stem (Reel.tsx suma el suyo, lineal, desde SFX_CUES.musicOutFrom). */
const MUSIC_FADE_FROM = SFX_CUES.musicOutFrom;
/** Duración (s) del swell de entrada de la música (pad, bajo y sub desde el silencio; el piano arranca al 35 %). Reel.tsx suma su rampa de 75 f. */
const MUSIC_SWELL_S = 1.8;
/** Umbral (dB sobre el RMS) donde la saturación suave del piano empieza a redondear picos. */
const PIANO_KNEE_DB = 7;
/** El «hueco» de voz se cierra recién en el último compás (resolución, sin texto nuevo). */
const VOICE_POCKET_RELEASE_FROM = barStart(7);

/** [fotograma, nota, velocidad, duración en s (opcional: 4,5)]. */
type PianoNote = [frame: number, note: string, vel: number, durS?: number];

/**
 * Piano (acompañamiento): arpegios lentos y escasos, registro medio-grave. Se evita tocar sobre los hitos tonales de
 * sfx-hilo (790, 930, 998, 1114, 1154–1172, 1240–1254, 1304, 1420, 1458) para dejarles espacio. Las notas del final de cada compás
 * pertenecen también al acorde siguiente (no chocan cuando suenan encima); las que no, son cortas. Las notas atadas a un evento
 * (la suspensión de la llegada de la amiga y su resolución con el gesto, la nota de la ilustración) se calculan desde SFX_CUES.
 */
const PIANO: PianoNote[] = [
  // 1 · Dmaj7 — la respuesta: entra con calma (notas escasas y suaves)
  [802, "D3", 0.34], [828, "A3", 0.32], [852, "F#4", 0.3], [876, "A4", 0.24],
  // 2 · Bm7 — transición (900) y frase 1 (930)
  [895, "B2", 0.46], [914, "A3", 0.3], [950, "D4", 0.34], [968, "A4", 0.3], [984, "F#4", 0.26],
  // 3 · Gmaj7(9) — frase 2 (998): el Re3 de cabecera espera a que respire su acento; la ilustración entra (reveal, 1068): su nota, 12 f después
  [SFX_CUES.phraseTwo + 12, "D3", 0.36, 1.6], [1020, "B3", 0.38], [1036, "D4", 0.34], [SFX_CUES.reveal + 12, "F#4", 0.3], [SFX_CUES.reveal + 28, "A4", 0.26],
  // 4 · Asus4 → A — escena de escucha; la suspensión (re, corta) llega con la amiga (1154) y resuelve en do# con el gesto (1172), seguida de un arpegio de La mayor
  [1105, "A2", 0.46], [1122, "E3", 0.36], [SFX_CUES.friendArrive - 2, "D4", 0.3, 0.9], [SFX_CUES.gesture + 4, "C#4", 0.38], [SFX_CUES.gesture + 20, "E4", 0.32], [SFX_CUES.gesture + 30, "A4", 0.28],
  // 5 · Dmaj9 — firma (1240) y logo (1254)
  [1210, "D3", 0.5], [1226, "A3", 0.4], [SFX_CUES.logoReveal + 18, "F#4", 0.36], [1288, "A4", 0.3],
  // 6 · Gmaj7(9) — bloque 2 (1304)
  [1315, "G3", 0.5], [1334, "D4", 0.38], [1356, "B4", 0.36], [1380, "F#4", 0.3],
  // 7 · Em9 — mensaje final (1420: cae con el cambio de acorde) y fecha (1458)
  [1420, "E3", 0.5], [1440, "B3", 0.38], [SFX_CUES.finalDate + 12, "F#4", 0.32],
  // 8 · Dmaj9 — resolución
  [1525, "D3", 0.5], [1546, "F#4", 0.28],
];

/**
 * Melodía (compases 7–8, composición final estática: todo visible desde CLOSING_TIMING.allVisible = 1498): re → si → do# (séptima mayor,
 * anhelo) → la; notas cortas para que no se solapen.
 */
const LEAD: PianoNote[] = [
  [1492, "D5", 0.4, 1.5],
  [1512, "B4", 0.32, 1.1],
  [1532, "C#5", 0.38, 2.6],
  [1558, "A4", 0.3, 3],
];

/** `lead`/`lag`: fotogramas que la voz entra antes / sale después (fundido cruzado; 12 y 10 por defecto); `fadeIn`/`fadeOut` en s (1,1 y 1,0 por defecto). */
type PadLane = { note: string; from: number; to: number; gain?: number; lead?: number; lag?: number; fadeIn?: number; fadeOut?: number };

/** La suspensión del compás 4 resuelve con el gesto de la mano (SFX_CUES.gesture = f1172): re → do#. */
const SUS_RESOLVE = SFX_CUES.gesture;

/**
 * Voces del pad por compás, en terceras apiladas (sin segundas en el registro grave: nada de batidos lentos entre graves;
 * las novenas y séptimas van arriba). "D4<" = hasta la resolución de la suspensión; ">C#4" = desde ella. El bajo (raíz) y el sub
 * van aparte (ROOTS): D · B · G · A · D · G · E · D.
 */
const VOICINGS: string[][] = [
  ["A2", "F#3", "C#4"], //          1 · Dmaj7        (bajo D3)
  ["A3", "D4", "F#4"], //           2 · Bm7          (bajo B2): sin Fa#3 (queda libre para la 2.ª frase)
  ["B3", "D4", "F#4", "A4"], //     3 · Gmaj7(9)     (bajo G2): Si menor 7 sobre Sol; sin Re3 (deja libre la raíz grave y el Fa#3 de la 2.ª frase)
  ["E3", "A3", "D4<", ">C#4"], //   4 · Asus4 → A    (bajo A2): la cuarta suspendida resuelve en la tercera
  ["F#3", "A3", "C#4", "E4"], //    5 · Dmaj9        (bajo D3)
  ["B3", "D4", "F#4", "A4"], //     6 · Gmaj7(9)     (bajo G2)
  ["G3", "B3", "D4", "F#4"], //     7 · Em9          (bajo E3)
  ["F#3", "A3", "C#4", "E4"], //    8 · Dmaj9        (bajo D3)
];
/** Las extensiones (novena, séptima alta) van más tenues. */
const PAD_SOFT: Record<string, number> = { A4: 0.55, E4: 0.7, "F#4": 0.85 };

/** Une compases consecutivos que comparten una nota en una sola voz (sin fundidos cruzados innecesarios). */
function buildPadLanes(): PadLane[] {
  const lanes: PadLane[] = [];
  const last = new Map<string, PadLane>(); // voz abierta hasta el final del compás anterior, por nota
  VOICINGS.forEach((chord, bar) => {
    const nextBar = bar + 1 === VOICINGS.length ? END_FRAME : barStart(bar + 1);
    const prev = new Map(last);
    last.clear();
    for (const tag of chord) {
      const m = /^(>?)([A-G]#?\d)(<?)$/.exec(tag);
      if (!m) throw new Error(`voz inválida: ${tag}`);
      const [, after, note, until] = m;
      const gain = PAD_SOFT[note] ?? 1;
      const open = prev.get(note);
      if (open && !after) {
        open.to = until ? SUS_RESOLVE : nextBar;
        if (!until) last.set(note, open);
        continue;
      }
      const lane: PadLane = { note, from: after ? SUS_RESOLVE : barStart(bar), to: until ? SUS_RESOLVE : nextBar, gain };
      // la suspensión y su resolución (re → do#) se cruzan rápido (≈0,3 s): sin segunda menor sostenida
      if (until) Object.assign(lane, { lag: 0, fadeOut: 0.3 });
      if (after) Object.assign(lane, { lead: 0, fadeIn: 0.5 });
      lanes.push(lane);
      if (!until) last.set(note, lane);
    }
  });
  return lanes;
}
const PAD_LANES: PadLane[] = buildPadLanes();

/** Raíces: bajo (una octava sobre el sub) por compás. */
const ROOTS: { bass: string; sub: string }[] = [
  { bass: "D3", sub: "D2" },
  { bass: "B2", sub: "B1" },
  { bass: "G2", sub: "G1" },
  { bass: "A2", sub: "A1" },
  { bass: "D3", sub: "D2" },
  { bass: "G2", sub: "G1" },
  { bass: "E3", sub: "E2" },
  { bass: "D3", sub: "D2" },
];

/** Piano eléctrico/felt suave: parciales aditivos (inarmonicidad mínima) + cuerpo FM que se aplaca + golpe de fieltro. */
function pianoNote(freq: number, vel: number, durS: number, airy = 0): Float32Array {
  const len = secToSample(durS);
  const out = new Float32Array(len);
  const tau0 = clamp(1.9 * Math.pow(261.63 / freq, 0.45), 0.75, 2.6);
  const bright = 0.64 + 0.45 * vel + 0.08 * airy;
  const w = (TWO_PI * freq) / SR;
  const lp = onePoleCoef(2300 + 3200 * vel + 500 * airy);
  const thudLp = onePoleCoef(650);
  const thudNoise = mulberry32(Math.round(freq * 100) ^ 0x9e37);
  // «tic» del fieltro (≈2,8–6 kHz, 6 ms): da definición al ataque y hace que el piano se oiga en parlantes de celular sin sumar siseo
  const felt = mulberry32(Math.round(freq * 31) ^ 0x51ed);
  const feltHp = biquad("hp", 2800, 0.707);
  const feltLp = biquad("lp", 6000, 0.707);
  let y = 0;
  let thud = 0;
  const K = 5;
  const kf: number[] = [];
  const ka: number[] = [];
  const kt: number[] = [];
  for (let k = 1; k <= K; k++) {
    kf.push((TWO_PI * freq * k * Math.sqrt(1 + 0.00025 * k * k)) / SR);
    ka.push(Math.pow(k, -1.25) * Math.pow(bright, k - 1));
    kt.push(tau0 / (1 + 0.75 * (k - 1)));
  }
  for (let n = 0; n < len; n++) {
    const t = n / SR;
    let add = 0;
    for (let k = 0; k < K; k++) add += ka[k] * Math.exp(-t / kt[k]) * Math.sin(kf[k] * n);
    const index = (0.9 + 1.6 * vel) * Math.exp(-t / 0.35);
    const fm = Math.sin(w * n + index * Math.sin(w * n)) * Math.exp(-t / (tau0 * 0.8)); // razón 1:1 exacta (sin batido subsónico → sin DC)
    thud += thudLp * ((thudNoise() * 2 - 1) - thud);
    const hammer = thud * 0.9 * vel * Math.exp(-t / 0.022);
    const att = 1 - Math.exp(-t / 0.004);
    const v = (0.55 * add + 0.5 * fm + hammer) * att;
    y += lp * (v - y);
    out[n] = y + feltLp(feltHp(felt() * 2 - 1)) * 0.07 * (0.5 + vel) * Math.exp(-t / 0.006) * (1 - Math.exp(-t / 0.0008));
  }
  // cola a cero (últimos 0,5 s)
  const taper = secToSample(0.5);
  for (let n = len - taper; n < len; n++) out[n] *= cosRamp((len - 1 - n) / taper);
  return normalizePeak(out, 0);
}

/** Pad: nota sostenida (3 voces tipo sierra band-limited, desafinadas y con vibrato lento) con envolvente coseno. */
function padLane(bus: Stem, lane: PadLane, fadeInS: number, fadeOutS: number, rnd: Rnd): void {
  const f0 = hz(lane.note);
  const t0 = frameToSample(lane.from);
  const fadeIn = secToSample(fadeInS);
  const fadeOut = secToSample(fadeOutS);
  const body = frameToSample(lane.to) - t0;
  const len = Math.min(body + fadeOut, N - t0);
  const mono = [new Float32Array(len), new Float32Array(len), new Float32Array(len)];
  const cents = [-7, 0.5, 7.5];
  const pans = [-0.55, 0.05, 0.55];
  const H = 8;
  for (let v = 0; v < 3; v++) {
    let phase = rnd() * TWO_PI;
    const lfoRate = 0.09 + 0.045 * v + rnd() * 0.03;
    const lfoPh = rnd() * TWO_PI;
    const lp = onePoleCoef(620 + 170 * v); // más oscuro que en la v1 (760–1000 Hz): los armónicos altos quedan fuera de la banda de voz
    let y = 0;
    for (let n = 0; n < len; n++) {
      const t = n / SR;
      const f = f0 * 2 ** ((cents[v] + 2.5 * Math.sin(TWO_PI * lfoRate * t + lfoPh)) / 1200);
      phase += (TWO_PI * f) / SR;
      if (phase > TWO_PI) phase -= TWO_PI;
      const s1 = Math.sin(phase);
      const c1 = Math.cos(phase);
      let sPrev = 0;
      let sCur = s1;
      let acc = s1;
      for (let h = 2; h <= H; h++) {
        const sNext = 2 * c1 * sCur - sPrev;
        sPrev = sCur;
        sCur = sNext;
        acc += sCur * Math.pow(h, -1.5);
      }
      y += lp * (acc - y);
      mono[v][n] = y;
    }
  }
  const env = new Float32Array(len);
  for (let n = 0; n < len; n++) {
    const gIn = cosRamp(n / fadeIn);
    const gOut = n > body ? Math.cos((Math.PI / 2) * clamp((n - body) / fadeOut, 0, 1)) : 1;
    env[n] = gIn * (n <= body ? 1 : gOut);
  }
  for (let v = 0; v < 3; v++) {
    const [gl, gr] = panGains(pans[v]);
    for (let n = 0; n < len; n++) mono[v][n] *= env[n] * 0.33 * (lane.gain ?? 1);
    addMono(bus, t0, mono[v], gl, gr);
  }
}

/** Sub / bajo: seno en la fundamental + 2.º armónico leve (`h2`; audible en parlantes chicos; en el bajo, mínimo para no rozar las voces del pad). */
function subLane(bus: Stem, note: string, fromFrame: number, toFrame: number, fadeInS: number, fadeOutS: number, h2 = 0.3): void {
  const f = hz(note);
  const t0 = frameToSample(fromFrame);
  const body = frameToSample(toFrame) - t0;
  const fadeIn = secToSample(fadeInS);
  const fadeOut = secToSample(fadeOutS);
  const len = Math.min(body + fadeOut, N - t0);
  const buf = new Float32Array(len);
  for (let n = 0; n < len; n++) {
    const gIn = cosRamp(n / fadeIn);
    const gOut = n > body ? Math.cos((Math.PI / 2) * clamp((n - body) / fadeOut, 0, 1)) : 1;
    const t = n / SR;
    buf[n] = (Math.sin(TWO_PI * f * t) + h2 * Math.sin(TWO_PI * 2 * f * t + 0.6)) * gIn * gOut;
  }
  addMono(bus, t0, buf, Math.SQRT1_2, Math.SQRT1_2);
}

/**
 * Nivel de la música (dB, relativo) por compás (suave entre compases): pareja entre sí (el RMS por compás queda dentro de 3 dB:
 * sin picos que tapen una voz), apenas más contenida con las frases del giro y florece un poco en la firma y el cierre.
 */
const BAR_TRIM_DB = [0, -0.3, 1.0, -0.4, -0.2, 0, 0, 0.3];
const musicLevelDb = (f: number): number => {
  let db = BAR_TRIM_DB[0];
  for (let i = 1; i < BAR_TRIM_DB.length; i++) db += (BAR_TRIM_DB[i] - BAR_TRIM_DB[i - 1]) * smoothstep((f - (barStart(i) - 10)) / 40);
  return db;
};

function buildMusic(): Stem {
  const rnd = mulberry32(0x6d757333);
  const piano = newStem();
  const pad = newStem();
  const bass = newStem();
  const sub = newStem();

  // — piano (arpegios y melodía): humanización determinista ±6 ms / ±8 % de velocidad (las notas de cabecera de compás quedan exactas)
  const onBar = (f: number): boolean => (f - MUSIC_IN) % BAR_FRAMES === 0;
  const playNotes = (notes: PianoNote[], airy: number, gainDb: number): void => {
    for (const [frame, note, vel, durS] of notes) {
      const jt = onBar(frame) ? 0 : Math.round((rnd() * 2 - 1) * 0.006 * SR);
      const v = vel * (1 + (rnd() * 2 - 1) * 0.08);
      const f = hz(note);
      const buf = pianoNote(f, v, durS ?? 4.5, airy);
      const midi = 69 + 12 * Math.log2(f / 440);
      const [gl, gr] = panGains(clamp((midi - 62) / 40, -0.4, 0.4));
      const g = 0.5 * Math.pow(v, 1.15) * dbToLin(gainDb);
      addMono(piano, frameToSample(frame) + jt, buf, gl * g, gr * g);
    }
  };
  playNotes(PIANO, 0, 0);
  playNotes(LEAD, 1, 1.5);

  // saturación suave del piano (tanh): redondea los picos del ataque (más cálido y menos trabajo para el limitador)
  {
    const z0 = frameToSample(MUSIC_IN + 30);
    const z1 = frameToSample(MUSIC_FADE_FROM);
    const a = rmsOf(piano.l, piano.r, z0, z1) * dbToLin(PIANO_KNEE_DB);
    for (let i = 0; i < N; i++) {
      piano.l[i] = a * Math.tanh(piano.l[i] / a);
      piano.r[i] = a * Math.tanh(piano.r[i] / a);
    }
  }

  // — pad: capas que se mueven por grados conjuntos; los cambios son fundidos cruzados centrados en la línea de compás
  for (const lane of PAD_LANES) {
    const first = lane.from === barStart(0);
    const from = first ? lane.from : lane.from - (lane.lead ?? 12); // el nuevo entra ≈0,4 s antes
    const to = lane.to >= END_FRAME ? lane.to : lane.to + (lane.lag ?? 10); // el viejo sale ≈0,3 s después
    padLane(pad, { ...lane, from, to }, first ? MUSIC_SWELL_S : (lane.fadeIn ?? 1.1), lane.fadeOut ?? 1.0, rnd);
  }

  // — bajo y sub: la raíz de cada compás (D – B – G – A – D – G – E – D)
  for (let b = 0; b < ROOTS.length; b++) {
    const to = b === ROOTS.length - 1 ? END_FRAME : barStart(b + 1);
    subLane(sub, ROOTS[b].sub, barStart(b), to, 0.3, 0.55);
    subLane(bass, ROOTS[b].bass, barStart(b), to, 0.3, 0.55, 0.1);
  }

  // — balance entre capas (por RMS en la zona musical) y envío a reverb
  const from = frameToSample(MUSIC_IN + 30);
  const to = frameToSample(MUSIC_FADE_FROM);
  const refRms = rmsOf(piano.l, piano.r, from, to);
  const target = (st: Stem, db: number): void => {
    const r = rmsOf(st.l, st.r, from, to);
    if (r > 0) scaleStem(st, (refRms * dbToLin(db)) / r);
  };
  target(pad, -8.5);
  target(bass, -9.5);
  target(sub, -15);
  const pk = (st: Stem): string => `pico ${linToDb(Math.max(peakOf(st.l), peakOf(st.r))).toFixed(1)} dB / RMS ${linToDb(rmsOf(st.l, st.r, from, to)).toFixed(1)} dB`;
  console.log(`  [música] capas → piano ${pk(piano)} · pad ${pk(pad)} · bajo ${pk(bass)} · sub ${pk(sub)}`);

  // swell de entrada (≈1,8 s): el pad, el bajo y el sub nacen desde el silencio; el piano arranca suave (piso 0,35)
  const swellN = secToSample(MUSIC_SWELL_S);
  const tIn = frameToSample(MUSIC_IN);
  for (let i = tIn; i < Math.min(N, tIn + swellN); i++) {
    const sw = Math.sin((Math.PI / 2) * ((i - tIn) / swellN)) ** 2;
    const gp = 0.35 + 0.65 * sw;
    pad.l[i] *= sw;
    pad.r[i] *= sw;
    bass.l[i] *= sw;
    bass.r[i] *= sw;
    sub.l[i] *= sw;
    sub.r[i] *= sw;
    piano.l[i] *= gp;
    piano.r[i] *= gp;
  }

  // envío a la reverb sin graves (pasa-altos 170 Hz): la cola queda limpia y no embarra la raíz
  const send = newStem();
  {
    const hl = biquad("hp", 170, 0.707);
    const hr = biquad("hp", 170, 0.707);
    for (let i = 0; i < N; i++) {
      send.l[i] = hl(piano.l[i] + 0.55 * pad.l[i]);
      send.r[i] = hr(piano.r[i] + 0.55 * pad.r[i]);
    }
  }
  const wet = reverbWet(send, { feedback: 0.91, damp: 0.42, preDelayMs: 22, wetDb: -6 });

  dumpLayer("capa-piano", piano);
  dumpLayer("capa-pad", pad);
  dumpLayer("capa-bajo", bass);
  dumpLayer("capa-sub", sub);
  dumpLayer("capa-reverb", wet);

  // mezcla + automatización de nivel (contenida con las frases del giro, florece apenas en la firma)
  const out = newStem();
  for (let i = 0; i < N; i++) {
    const g = dbToLin(musicLevelDb(i / SPF));
    out.l[i] = (piano.l[i] + pad.l[i] + bass.l[i] + sub.l[i] + wet.l[i]) * g;
    out.r[i] = (piano.r[i] + pad.r[i] + bass.r[i] + sub.r[i] + wet.r[i]) * g;
  }

  // «hueco» para la voz futura: campana −4 dB en ≈1,15 kHz (cubre ≈500–2,5 kHz) que se abre recién en el último compás
  {
    const pl = peakEq(1150, 0.6, -4);
    const pr = peakEq(1150, 0.6, -4);
    for (let i = 0; i < N; i++) {
      const w = smoothstep((i / SPF - VOICE_POCKET_RELEASE_FROM) / 70);
      const l = pl(out.l[i]);
      const r = pr(out.r[i]);
      out.l[i] = l * (1 - w) + out.l[i] * w;
      out.r[i] = r * (1 - w) + out.r[i] * w;
    }
  }

  // silencio exacto hasta musicIn (la reverb/ruidos no pueden filtrarse antes del hito)
  for (let i = 0; i < tIn; i++) {
    out.l[i] = 0;
    out.r[i] = 0;
  }

  // pasa-altos de seguridad (28 Hz): sin continua ni subsónicos que gasten margen del limitador
  {
    const hl = biquad("hp", 28, 0.707);
    const hr = biquad("hp", 28, 0.707);
    for (let i = 0; i < N; i++) {
      out.l[i] = hl(out.l[i]);
      out.r[i] = hr(out.r[i]);
    }
  }

  // limitador + nivel: pico ≈ −8,5 dBFS con la dinámica comprimida lo justo (cresta baja → más sonoridad)
  const rms0 = rmsOf(out.l, out.r, from, to);
  scaleStem(out, dbToLin(-17.8) / rms0); // RMS objetivo de la zona musical (limitador ≤ ~3,5 dB, sin bombeo)
  const gr = limit(out, -8.5);
  console.log(`  [música] reducción máxima del limitador: ${gr.toFixed(1)} dB`);

  // huecos bajo los acentos (después del limitador: no cambian el pico ni el nivel de diseño, solo abren un espacio de −3 dB)
  {
    const duck = new Float32Array(N).fill(1);
    const gd = dbToLin(DUCK_DB);
    const pre = secToSample(DUCK_PRE_S);
    const hold = secToSample(DUCK_HOLD_S);
    const rel = secToSample(DUCK_RELEASE_S);
    for (const cue of DUCK_CUES) {
      const c = frameToSample(cue);
      for (let i = Math.max(0, c - pre); i < Math.min(N, c + hold + rel); i++) {
        const d = i - c;
        const g = d < 0 ? 1 - (1 - gd) * cosRamp((d + pre) / pre) : d < hold ? gd : gd + (1 - gd) * cosRamp((d - hold) / rel);
        if (g < duck[i]) duck[i] = g;
      }
    }
    for (let i = 0; i < N; i++) {
      out.l[i] *= duck[i];
      out.r[i] *= duck[i];
    }
    console.log(`  [música] huecos de ${DUCK_DB} dB bajo ${DUCK_CUES.length} acentos (previo ${DUCK_PRE_S * 1000} ms · sostenido ${DUCK_HOLD_S * 1000} ms · vuelta ${DUCK_RELEASE_S * 1000} ms)`);
  }

  // fundido final propio (raised-cosine desde MUSIC_FADE_FROM; termina en 0 exacto en la última muestra): la cola del acorde sostenido se desvanece
  const f0 = frameToSample(MUSIC_FADE_FROM);
  for (let i = f0; i < N; i++) {
    const g = cosRamp(1 - (i - f0) / (N - 1 - f0));
    out.l[i] *= g;
    out.r[i] *= g;
  }
  out.l[N - 1] = 0;
  out.r[N - 1] = 0;
  return out;
}

// ───────────────────────────────────────────────────────────── 4) sfx-hilo.wav

/** Soplo de aire (ruido pasa-banda con barrido de frecuencia, ancho estéreo por ruido independiente). `peakFrac` = dónde cae el máximo. */
function breath(durS: number, f0: number, f1: number, q: number, rnd: Rnd, peakFrac = 0.62): [Float32Array, Float32Array] {
  const len = secToSample(durS);
  const res: Float32Array[] = [];
  for (let ch = 0; ch < 2; ch++) {
    const out = new Float32Array(len);
    let low = 0;
    let band = 0;
    const soft1 = biquad("lp", 3200, 0.707);
    const soft2 = biquad("lp", 3200, 0.707); // sin siseo agudo: todo el soplo queda por debajo de ~4 kHz
    const tp = peakFrac * durS;
    for (let n = 0; n < len; n++) {
      const t = n / SR;
      const fc = f0 * Math.pow(f1 / f0, n / len);
      const f = 2 * Math.sin((Math.PI * fc) / SR);
      const x = rnd() * 2 - 1;
      low += f * band;
      const high = x - low - band / q;
      band += f * high;
      const env = t < tp ? Math.sin((Math.PI / 2) * (t / tp)) ** 2 : Math.cos((Math.PI / 2) * ((t - tp) / (durS - tp))) ** 2;
      out[n] = soft2(soft1(band)) * env;
    }
    res.push(out);
  }
  return [res[0], res[1]];
}

/** Tono sostenido con swell: ataque y relajación largos (coseno), entrada retrasada `delayS`, 2.º armónico leve. */
function swellTone(freq: number, totalS: number, attackS: number, releaseS: number, delayS: number, detune: number): Float32Array {
  const len = secToSample(totalS);
  const out = new Float32Array(len);
  let phase = 0;
  for (let n = 0; n < len; n++) {
    const t = n / SR;
    const te = t - delayS;
    phase += (TWO_PI * freq * (1 + detune)) / SR;
    if (te < 0) continue;
    const env = cosRamp(te / attackS) * (t > totalS - releaseS ? cosRamp((totalS - t) / releaseS) : 1);
    out[n] = env * (Math.sin(phase) + 0.1 * Math.sin(2 * phase + 0.3));
  }
  return out;
}

/** Tono grave cálido y breve (no campana): armónicos 1–3 con decaimientos distintos, ataque suave, «asentamiento» de afinación. */
function warmTone(freq: number, tau: number, durS: number, detune: number): Float32Array {
  const len = secToSample(durS);
  const out = new Float32Array(len);
  const amps = [1, 0.45, 0.18]; // 2.º y 3.er armónico algo más presentes que en la v1: el tono grave también se «lee» en parlantes de celular
  const phases = [0, 0, 0];
  const lp = onePoleCoef(1500);
  let y = 0;
  for (let n = 0; n < len; n++) {
    const t = n / SR;
    const f = freq * (1 + detune) * (1 + 0.0035 * Math.exp(-t / 0.05));
    let s = 0;
    for (let h = 0; h < 3; h++) {
      phases[h] += (TWO_PI * f * (h + 1)) / SR;
      s += amps[h] * Math.exp(-t / (tau / Math.pow(h + 1, 0.6))) * Math.sin(phases[h]);
    }
    const env = cosRamp(t / 0.014) * (t > durS - 0.25 ? cosRamp((durS - t) / 0.25) : 1);
    y += lp * (s * env - y);
    out[n] = y;
  }
  return out;
}

/** Carillón cálido: parciales aditivos casi armónicos con decaimientos largos→cortos (≈2 s), sin ataque metálico. */
function chime(freq: number, durS: number): Float32Array {
  const len = secToSample(durS);
  const out = new Float32Array(len);
  const ratios = [1, 2.0, 3.01, 4.17, 5.43];
  const amps = [1, 0.3, 0.13, 0.05, 0.02];
  const taus = [0.55, 0.3, 0.17, 0.09, 0.05];
  for (let n = 0; n < len; n++) {
    const t = n / SR;
    let s = 0;
    for (let k = 0; k < ratios.length; k++) s += amps[k] * Math.exp(-t / taus[k]) * Math.sin(TWO_PI * freq * ratios[k] * t);
    s += 0.35 * Math.exp(-t / 0.5) * Math.sin(TWO_PI * freq * 1.0016 * t + 0.7); // batido de brillo
    out[n] = s * cosRamp(t / 0.004);
  }
  const taper = secToSample(0.3);
  for (let n = len - taper; n < len; n++) out[n] *= cosRamp((len - 1 - n) / taper);
  return out;
}

/** Cuerda pulsada suave (aditivo): ataque de 3 ms, parciales 1–7 que decaen más rápido arriba. */
function pluck(freq: number, durS: number): Float32Array {
  const len = secToSample(durS);
  const out = new Float32Array(len);
  const K = 7;
  const lp = onePoleCoef(5200);
  let y = 0;
  for (let n = 0; n < len; n++) {
    const t = n / SR;
    let s = 0;
    for (let k = 1; k <= K; k++) {
      const f = freq * k * Math.sqrt(1 + 0.0004 * k * k);
      s += Math.pow(k, -1.1) * Math.exp(-t / (1.1 / Math.pow(k, 0.85))) * Math.sin(TWO_PI * f * t);
    }
    y += lp * (s * (1 - Math.exp(-t / 0.003)) - y);
    out[n] = y;
  }
  const taper = secToSample(0.35);
  for (let n = len - taper; n < len; n++) out[n] *= cosRamp((len - 1 - n) / taper);
  return out;
}

/** «Pip» suave (texto en pantalla): seno redondo con decaimiento corto y un 2.º armónico leve. */
function softPip(freq: number): Float32Array {
  const len = secToSample(0.32);
  const out = new Float32Array(len);
  for (let n = 0; n < len; n++) {
    const t = n / SR;
    const att = 1 - Math.exp(-t / 0.0025);
    out[n] = att * (Math.sin(TWO_PI * freq * t) * Math.exp(-t / 0.075) + 0.16 * Math.sin(TWO_PI * 2 * freq * t + 0.5) * Math.exp(-t / 0.035));
  }
  const taper = secToSample(0.06);
  for (let n = len - taper; n < len; n++) out[n] *= cosRamp((len - 1 - n) / taper);
  return out;
}

/** Envolvente de «roce»: sube en `att` s y decae con `tau` desde `t0`. */
const bump = (t: number, t0: number, att: number, tau: number): number => (t < t0 ? 0 : (1 - Math.exp(-(t - t0) / (att / 3))) * Math.exp(-(t - t0) / tau));

/** Golpecito de madera (la silla se detiene): seno grave con caída de afinación y un modo más agudo muy breve. */
function woodThump(): Float32Array {
  const len = secToSample(0.2);
  const out = new Float32Array(len);
  let p1 = 0;
  let p2 = 0;
  for (let n = 0; n < len; n++) {
    const t = n / SR;
    p1 += (TWO_PI * (80 + 45 * Math.exp(-t / 0.03))) / SR;
    p2 += (TWO_PI * 205) / SR;
    out[n] = (1 - Math.exp(-t / 0.004)) * (Math.sin(p1) * Math.exp(-t / 0.05) + 0.3 * Math.sin(p2) * Math.exp(-t / 0.028));
  }
  const taper = secToSample(0.03);
  for (let n = len - taper; n < len; n++) out[n] *= cosRamp((len - 1 - n) / taper);
  return out;
}

/** «Tic» apenas perceptible para el cambio de subtítulo: blip de seno corto con un hálito de ruido. */
function tick(freq: number, rnd: Rnd): Float32Array {
  const len = secToSample(0.07);
  const out = new Float32Array(len);
  const hp = biquad("hp", 3500, 0.707);
  for (let n = 0; n < len; n++) {
    const t = n / SR;
    const att = 1 - Math.exp(-t / 0.0006);
    out[n] = att * (Math.sin(TWO_PI * freq * t) * Math.exp(-t / 0.011) + 0.25 * hp(rnd() * 2 - 1) * Math.exp(-t / 0.0014));
  }
  const taper = secToSample(0.01);
  for (let n = len - taper; n < len; n++) out[n] *= cosRamp((len - 1 - n) / taper);
  return out;
}

/** Clic suave de ENVIAR: toque redondo (cuerpo ≈300 Hz que baja + «tac» de seno 1,25 kHz) con un hálito de ruido apenas. */
function softClick(rnd: Rnd): Float32Array {
  const len = secToSample(0.16);
  const out = new Float32Array(len);
  const hp = biquad("hp", 2200, 0.707);
  const lp = biquad("lp", 6000, 0.707);
  let ph = 0;
  for (let n = 0; n < len; n++) {
    const t = n / SR;
    const att = 1 - Math.exp(-t / 0.0008);
    ph += (TWO_PI * 300 * (1 + 0.5 * Math.exp(-t / 0.012))) / SR;
    const body = Math.sin(ph) * Math.exp(-t / 0.028);
    const top = Math.sin(TWO_PI * 1250 * t) * Math.exp(-t / 0.006);
    const air = lp(hp(rnd() * 2 - 1)) * Math.exp(-t / 0.0015);
    out[n] = att * (0.7 * body + 0.55 * top + 0.25 * air);
  }
  const taper = secToSample(0.03);
  for (let n = len - taper; n < len; n++) out[n] *= cosRamp((len - 1 - n) / taper);
  return out;
}

/** Asentamiento mínimo (la burbuja enviada llega a su lugar): seno redondo con decaimiento corto. */
function softTap(freq: number): Float32Array {
  const len = secToSample(0.22);
  const out = new Float32Array(len);
  for (let n = 0; n < len; n++) {
    const t = n / SR;
    out[n] = (1 - Math.exp(-t / 0.002)) * (Math.sin(TWO_PI * freq * t) * Math.exp(-t / 0.045) + 0.2 * Math.sin(TWO_PI * 2 * freq * t + 0.4) * Math.exp(-t / 0.02));
  }
  const taper = secToSample(0.04);
  for (let n = len - taper; n < len; n++) out[n] *= cosRamp((len - 1 - n) / taper);
  return out;
}

/**
 * LLEGADA DE LA RESPUESTA (el momento emocional): una sola nota cálida tipo «gota» — ataque inmediato, un brevísimo
 * ascenso de afinación (9 % en ≈25 ms, como una gota que cae), armónicos 1–3 redondos, cuerpo una octava abajo y cola larga.
 */
function dropNote(freq: number, detune: number): Float32Array {
  const dur = 2.4;
  const len = secToSample(dur);
  const out = new Float32Array(len);
  const amps = [1, 0.26, 0.07];
  const taus = [0.62, 0.33, 0.17];
  const ph = [0, 0, 0];
  let phSub = 0;
  const lp = onePoleCoef(4200);
  let y = 0;
  for (let n = 0; n < len; n++) {
    const t = n / SR;
    const f = freq * (1 + detune) * (1 - 0.09 * Math.exp(-t / 0.022));
    let s = 0;
    for (let h = 0; h < 3; h++) {
      ph[h] += (TWO_PI * f * (h + 1)) / SR;
      s += amps[h] * Math.exp(-t / taus[h]) * Math.sin(ph[h]);
    }
    phSub += (TWO_PI * f * 0.5) / SR;
    s += 0.32 * Math.exp(-t / 0.4) * Math.sin(phSub);
    const att = 1 - Math.exp(-t / 0.0022);
    y += lp * (s * att - y);
    out[n] = y;
  }
  const taper = secToSample(0.4);
  for (let n = len - taper; n < len; n++) out[n] *= cosRamp((len - 1 - n) / taper);
  return out;
}

/**
 * Rodar de la silla de ruedas (casi imperceptible): ruido pasa-banda ≈150–700 Hz modulado por el giro de las ruedas
 * (≈4,4 → 1,2 vueltas/s: desacelera al detenerse) con una envolvente que nace y se apaga; estéreo con ruido independiente.
 */
function wheelRoll(durS: number, rnd: Rnd): [Float32Array, Float32Array] {
  const len = secToSample(durS);
  const res: Float32Array[] = [];
  for (let ch = 0; ch < 2; ch++) {
    const out = new Float32Array(len);
    const hp1 = biquad("hp", 150, 0.707);
    const hp2 = biquad("hp", 150, 0.707);
    const lp1 = biquad("lp", 700, 0.707);
    const lp2 = biquad("lp", 700, 0.707);
    let turn = ch * 0.3;
    for (let n = 0; n < len; n++) {
      const t = n / SR;
      const u = t / durS;
      turn += (lerpN(4.4, 1.2, u * u) * TWO_PI) / SR;
      const spokes = 0.55 + 0.45 * Math.max(0, Math.sin(turn)) ** 1.5;
      const env = smoothstep(t / 0.35) * (1 - smoothstep((t - (durS - 0.5)) / 0.5)) * (0.75 + 0.25 * (1 - u));
      out[n] = lp2(lp1(hp2(hp1(rnd() * 2 - 1)))) * spokes * env;
    }
    res.push(out);
  }
  return [res[0], res[1]];
}

function buildSfx(): Stem {
  const rnd = mulberry32(0x73667833);
  const dry = newStem();
  const wetSend = newStem();
  const sampleAt = (frame: number): number => frameToSample(frame);

  /** Coloca un par estéreo normalizado a `peakDb` (por el canal más fuerte) en `frame`; `send` = parte que va a la reverb. */
  const placeStereo = (frame: number, l: Float32Array, r: Float32Array, peakDb: number, send = 0.0, offS = 0): void => {
    const p = Math.max(peakOf(l), peakOf(r));
    const g = p > 0 ? dbToLin(peakDb) / p : 0;
    addStereo(dry, sampleAt(frame) + secToSample(offS), l, r, g);
    if (send > 0) addStereo(wetSend, sampleAt(frame) + secToSample(offS), l, r, g * send);
  };
  const placeMono = (frame: number, buf: Float32Array, peakDb: number, pan: number, send = 0.0, offS = 0): void => {
    normalizePeak(buf, peakDb);
    const [pl, pr] = panGains(pan);
    const gl = pl / Math.max(pl, pr);
    const gr = pr / Math.max(pl, pr);
    addMono(dry, sampleAt(frame) + secToSample(offS), buf, gl, gr);
    if (send > 0) addMono(wetSend, sampleAt(frame) + secToSample(offS), buf, gl * send, gr * send);
  };
  /**
   * Acorde de varias voces `swellTone` con paneo propio → par estéreo normalizado a `peakDb` por sus TONOS; luego se suma un
   * hálito de aire (ruido de banda) cuyo nivel RMS queda `airDb` dB bajo el de los tonos (así el ruido no manda sobre el nivel).
   */
  const swellChord = (voices: { note: string; delay: number; gain: number; pan: number }[], totalS: number, attS: number, relS: number, peakDb: number, air: { f0: number; f1: number; peakFrac: number; db: number }): [Float32Array, Float32Array] => {
    const l = new Float32Array(secToSample(totalS));
    const r = new Float32Array(secToSample(totalS));
    for (const v of voices) {
      const [pl, pr] = panGains(v.pan);
      mixInto(l, swellTone(hz(v.note), totalS, attS, relS, v.delay, -0.0007), v.gain * pl);
      mixInto(r, swellTone(hz(v.note), totalS, attS, relS, v.delay, 0.0007), v.gain * pr);
    }
    const g = dbToLin(peakDb) / Math.max(peakOf(l), peakOf(r));
    for (let i = 0; i < l.length; i++) {
      l[i] *= g;
      r[i] *= g;
    }
    const [al, ar] = breath(totalS - 0.2, air.f0, air.f1, 0.8, rnd, air.peakFrac);
    const toneRms = Math.sqrt((l.reduce((a, x) => a + x * x, 0) + r.reduce((a, x) => a + x * x, 0)) / (2 * l.length));
    const airRms = Math.sqrt((al.reduce((a, x) => a + x * x, 0) + ar.reduce((a, x) => a + x * x, 0)) / (2 * al.length));
    const ga = (toneRms * dbToLin(air.db)) / Math.max(airRms, 1e-12);
    mixInto(l, al, ga);
    mixInto(r, ar, ga);
    return [l, r];
  };
  /** Dos tonos cálidos en quinta abierta (grave + agudo) que cierran un arco; el 2.º es 0,6 de amplitud. */
  const fifth = (low: string, high: string, decayS: number, durS: number): [Float32Array, Float32Array] => {
    const l = warmTone(hz(low), decayS, durS, -0.0005);
    const r = warmTone(hz(low), decayS, durS, 0.0005);
    mixInto(l, warmTone(hz(high), decayS * 0.9, durS, -0.0005), 0.6);
    mixInto(r, warmTone(hz(high), decayS * 0.9, durS, 0.0005), 0.6);
    return [l, r];
  };

  // El tiempo en pantalla de los puntos «Amiga escribe» (src/chat/geometry.ts THREAD_FX.dotsPeriod): el punto i alcanza su pico a
  // (π/2 + 0,95·i)·período/2π fotogramas del inicio del indicador.
  const DOTS_PERIOD = 21;

  // 1) ENVIAR pulsado (702): clic suave
  placeMono(SFX_CUES.sendPress, softClick(rnd), -21, 0.12, 0.25);

  // 2) burbuja enviada (712): swoosh corto y suave (soplo 450 → 2100 Hz, 0,42 s) + asentamiento al llegar al hilo (742). QA R2: la secuencia de
  //    envío sonaba 10–13 dB bajo un tecleo y casi no se oía → swoosh −27 → −23 dBFS y asentamiento −33 → −26 dBFS; el clic (−21) y los tics
  //    del indicador no se tocan; todo el envío queda bajo la gota de la respuesta (−17), que sigue siendo la cima de la secuencia.
  {
    const [bl, br] = breath(0.42, 450, 2100, 0.9, rnd, 0.38);
    placeStereo(SFX_CUES.sendFly, bl, br, -23, 0.3);
    placeMono(SEND_TIMING.flyTo, softTap(hz("D5")), -26, 0.2, 0.3);
  }

  // 3) indicador de escritura (756): «pop» de la burbuja de puntos + tics suaves, uno por rebote de punto (D6 · E6 · F#6)
  {
    placeMono(SFX_CUES.indicator, tick(hz("A5"), rnd), -29, -0.08);
    const pitch = ["D6", "E6", "F#6"];
    const pan = [-0.14, 0, 0.14];
    for (let cycle = 0; cycle < 2; cycle++) {
      for (let i = 0; i < 3; i++) {
        const at = SFX_CUES.indicator + ((Math.PI / 2 + 0.95 * i) * DOTS_PERIOD) / TWO_PI + cycle * DOTS_PERIOD;
        if (at > SFX_CUES.reply - 3) continue; // el último rebote cae sobre la respuesta: se omite
        const fr = Math.floor(at);
        placeMono(fr, tick(hz(pitch[i]), rnd), -31.5 + 0.5 * i, pan[i], 0, (at - fr) / FPS);
      }
    }
  }

  // 4) LLEGADA DE LA RESPUESTA (790): nota cálida tipo gota (Fa#5, tercera de Re mayor), breve y discreta; no tapa la música que entra
  {
    const dl = dropNote(hz("F#5"), -0.0005);
    const dr = dropNote(hz("F#5"), 0.0005);
    placeStereo(SFX_CUES.reply, dl, dr, -17, 0.5);
  }

  // QA R3: desde la entrada de la música, los acentos quedaban tapados por ella (casi toda su energía está en graves). Cada uno sube +3…+6 dB
  // (según cuánto lo tapaba; el carillón del logo, que ya es el pico del stem, queda como estaba) y la música abre un hueco de −3 dB bajo cada
  // uno (DUCK_CUES). Los niveles de abajo son los de diseño, antes de MASTER_TRIM_DB.

  // 5) transición (900): swell suave de Si menor en registro medio (Fa#4 · Si4 · Re5, sin segundas con el pad) mientras el naranja se expande
  {
    const [l, r] = swellChord(
      [
        { note: "F#4", delay: 0, gain: 1, pan: -0.15 },
        { note: "B4", delay: 0.14, gain: 0.7, pan: 0.2 },
        { note: "D5", delay: 0.34, gain: 0.4, pan: -0.05 },
      ],
      3.2,
      0.95,
      1.5,
      -21,
      { f0: 380, f1: 1700, peakFrac: 0.4, db: -11 },
    );
    placeStereo(SFX_CUES.transition, l, r, -21, 0.6);
  }

  // 6) frases del giro (930 / 998): tonos graves cálidos, breves y suaves (Re3 → Fa#3: tercera mayor que «abre»). Ambas notas quedan
  //    libres en el pad y el piano de su compás (ni se pisan ni rozan con el acorde): se oyen como acento (verify-audio.ts mide la relación con la música).
  {
    const dl = warmTone(hz("D3"), 0.3, 1.5, -0.0005);
    const dr = warmTone(hz("D3"), 0.3, 1.5, 0.0005);
    placeStereo(SFX_CUES.phraseOne, dl, dr, -14.5, 0.45);
    const fl = warmTone(hz("F#3"), 0.28, 1.4, -0.0005);
    const fr = warmTone(hz("F#3"), 0.28, 1.4, 0.0005);
    placeStereo(SFX_CUES.phraseTwo, fl, fr, -15.5, 0.45);
  }

  // 7) retirada del naranja / entrada de la ilustración (1068): soplo suave
  {
    const [bl, br] = breath(1.5, 480, 2600, 0.8, rnd, 0.36);
    placeStereo(SFX_CUES.reveal, bl, br, -22, 0.5);
  }

  // 8) texto de acompañamiento (1114): «pip» redondo, muy suave
  placeMono(SFX_CUES.companionText, softPip(hz("B5")), -20, 0.05, 0.3);

  // 9) la silla que rueda (muy leve y casi imperceptible): del ingreso de la amiga (1104) a su llegada (1154) + asentamiento mínimo
  {
    const rollS = (SFX_CUES.friendArrive - COMPANION_TIMING.friendEnterFrom) / FPS;
    const [rl, rr] = wheelRoll(rollS, rnd);
    placeStereo(COMPANION_TIMING.friendEnterFrom, rl, rr, -33, 0.2);
    placeMono(SFX_CUES.friendArrive, woodThump(), -28, 0.12, 0.2);
  }

  // 10) gesto de apoyar la mano (1172): cuerda / campanita mínima, dos notas (Mi5 → La5)
  {
    placeMono(SFX_CUES.gesture, pluck(hz("E5"), 2.2), -19, -0.18, 0.6);
    placeMono(SFX_CUES.gesture, pluck(hz("A5"), 2.2), -21, 0.18, 0.6, 0.16);
  }

  // 11) firma: bloque 1 (1240) quinta cálida Fa#4 + Do#5 (en la tercera de Re: libre en el pad) + logo (1254) carillón cálido discreto
  //     (La mayor sobre Dmaj9) + bloque 2 (1304) «pip»
  {
    const [sl, sr] = fifth("F#4", "C#5", 0.34, 1.9);
    placeStereo(SFX_CUES.signatureOne, sl, sr, -16.5, 0.5);
    const notes: [string, number, number, number][] = [
      ["A5", 0.0, -17.5, -0.22],
      ["C#6", 0.095, -19, 0.0],
      ["E6", 0.2, -20, 0.22],
      ["A6", 0.31, -23, 0.05],
    ];
    for (const [n, off, db, pan] of notes) {
      const buf = chime(hz(n), 2.6);
      normalizePeak(buf, db);
      const [pl, pr] = panGains(pan);
      const gl = pl / Math.max(pl, pr);
      const gr = pr / Math.max(pl, pr);
      const s0 = frameToSample(SFX_CUES.logoReveal) + secToSample(off);
      addMono(dry, s0, buf, gl, gr);
      addMono(wetSend, s0, buf, gl * 0.6, gr * 0.6);
    }
    placeMono(SFX_CUES.signatureTwo, softPip(hz("D5")), -20, -0.05, 0.35);
  }

  // 12) mensaje final (1420): eco de los tonos del giro, una octava y media arriba (Re5 + La5: quinta abierta consonante con Sol y con Mi menor,
  //     libre en el pad) que cierra el arco; fecha (1458): «pip» Si5
  {
    const [l, r] = fifth("D5", "A5", 0.38, 2.4);
    placeStereo(SFX_CUES.finalMessage, l, r, -15.5, 0.5);
    placeMono(SFX_CUES.finalDate, softPip(hz("B5")), -20, 0.08, 0.3);
  }

  // 13) cierre (último compás, 1525): eco del carillón del logo (La5 + Mi6, quinta y novena de Re mayor 9), muy suave, que se apaga con la música
  {
    for (const [n, off, db, pan] of [["A5", 0, -24, -0.15], ["E6", 0.11, -28, 0.18]] as [string, number, number, number][]) {
      const buf = chime(hz(n), 2.0);
      normalizePeak(buf, db);
      const [pl, pr] = panGains(pan);
      const gl = pl / Math.max(pl, pr);
      const gr = pr / Math.max(pl, pr);
      const s0 = frameToSample(CLOSE_CUE) + secToSample(off);
      addMono(dry, s0, buf, gl, gr);
      addMono(wetSend, s0, buf, gl * 0.6, gr * 0.6);
    }
  }

  const wet = reverbWet(wetSend, { feedback: 0.88, damp: 0.5, preDelayMs: 14, wetDb: -9 });
  const out = newStem();
  for (let i = 0; i < N; i++) {
    out.l[i] = dry.l[i] + wet.l[i];
    out.r[i] = dry.r[i] + wet.r[i];
  }
  // cola final a cero
  const taperN = secToSample(0.4);
  for (let i = N - taperN; i < N; i++) {
    const g = cosRamp((N - 1 - i) / taperN);
    out.l[i] *= g;
    out.r[i] *= g;
  }
  return out;
}

// ───────────────────────────────────────────────────────────── main

function main(): void {
  console.log(`build-audio v3 · ${TOTAL_FRAMES} fotogramas @ ${FPS} fps = ${(N / SR).toFixed(3)} s · ${SR} Hz · estéreo 16-bit`);
  console.log(`  eventos de teclado: ${KEY_EVENTS.length} · pausa de la duda y del envío f${PAUSE_FROM}–f${PAUSE_TO} · música desde el fotograma ${MUSIC_IN}`);
  const t0 = Date.now();
  writeStem("ambiente.wav", buildAmbience());
  writeStem("teclado.wav", buildKeys());
  writeStem("musica.wav", buildMusic());
  writeStem("sfx-hilo.wav", buildSfx());
  console.log(`listo en ${((Date.now() - t0) / 1000).toFixed(1)} s → ${OUT_DIR}`);
}

main();
