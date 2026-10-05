/**
 * build-audio.ts — sintetiza por código los 4 stems de audio del reel "El mensaje que borraste".
 *
 *   node scripts/build-audio.ts          (o:  npm run audio)
 *
 * - 100 % original: ruido sembrado + osciladores + filtros + reverb de Schroeder/Freeverb. Sin samples de terceros,
 *   sin dependencias npm (síntesis en Float32Array, escritura WAV manual).
 * - Salida: public/audio/{ambiente,teclado,musica,sfx-hilo}.wav — PCM 16-bit, 48 kHz, estéreo, EXACTAMENTE
 *   TOTAL_FRAMES/FPS = 35 s. Cada stem ya está alineado al reel: el fotograma f cae en la muestra round(f/30*48000).
 * - Determinista: PRNG sembrado (mulberry32). Mismo resultado en cada ejecución.
 * - Tiempos: salen de src/config/timeline.ts (SFX_CUES, THREAD_TIMING, ...) y src/config/typing.ts (KEY_EVENTS).
 *
 * Solo sintaxis borrable de TypeScript (Node 22 hace type-stripping): sin enums ni parameter properties.
 * Los 4 stems son PROVISIONALES: se pueden reemplazar por música licenciada y grabación real (ver docs/AUDIO.md).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { CURSOR_HANDOFF, FPS, SFX_CUES, THREAD_TIMING, TOTAL_FRAMES } from "../src/config/timeline.ts";
import { KEY_EVENTS } from "../src/config/typing.ts";
import type { KeyKind } from "../src/config/typing.ts";
import { mulberry32 } from "../src/lib/rng.ts";

// ───────────────────────────────────────────────────────────── constantes y utilidades

const SR = 48000;
const SPF = SR / FPS; // muestras por fotograma (1600)
if (!Number.isInteger(SPF)) throw new Error(`SR/FPS debe ser entero (${SPF})`);
const N = TOTAL_FRAMES * SPF; // muestras por stem (1 680 000 = 35 s exactos)
const TWO_PI = Math.PI * 2;

type Rnd = () => number;
type Stem = { l: Float32Array; r: Float32Array };

/** Muestra del fotograma `f` (alineación exacta con el reel). */
const frameToSample = (f: number): number => Math.round((f / FPS) * SR);
const secToSample = (s: number): number => Math.round(s * SR);
const dbToLin = (db: number): number => 10 ** (db / 20);
const linToDb = (x: number): number => 20 * Math.log10(Math.max(x, 1e-12));
const clamp = (x: number, a: number, b: number): number => Math.min(b, Math.max(a, x));
/** Rampa coseno 0→1 (derivada nula en los extremos). */
const cosRamp = (u: number): number => 0.5 - 0.5 * Math.cos(Math.PI * clamp(u, 0, 1));
const smoothstep = (u: number): number => {
  const c = clamp(u, 0, 1);
  return c * c * (3 - 2 * c);
};

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

/** Biquad RBJ (lp / hp / bp de ganancia pico 0 dB). */
function biquad(kind: "lp" | "hp" | "bp", fc: number, q: number): Filter {
  const w0 = (TWO_PI * fc) / SR;
  const cs = Math.cos(w0);
  const alpha = Math.sin(w0) / (2 * q);
  let b0: number;
  let b1: number;
  let b2: number;
  if (kind === "lp") {
    b0 = (1 - cs) / 2;
    b1 = 1 - cs;
    b2 = (1 - cs) / 2;
  } else if (kind === "hp") {
    b0 = (1 + cs) / 2;
    b1 = -(1 + cs);
    b2 = (1 + cs) / 2;
  } else {
    b0 = alpha;
    b1 = 0;
    b2 = -alpha;
  }
  const a0 = 1 + alpha;
  const a1 = (-2 * cs) / a0;
  const a2 = (1 - alpha) / a0;
  b0 /= a0;
  b1 /= a0;
  b2 /= a0;
  let x1 = 0;
  let x2 = 0;
  let y1 = 0;
  let y2 = 0;
  return (x: number): number => {
    const y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1;
    x1 = x;
    y2 = y1;
    y1 = y;
    return y;
  };
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

function writeStem(file: string, stem: Stem): void {
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_DIR + file, wavBytes(stem));
  const peak = Math.max(peakOf(stem.l), peakOf(stem.r));
  const rms = rmsOf(stem.l, stem.r);
  console.log(`  ${file.padEnd(14)} pico ${linToDb(peak).toFixed(1).padStart(6)} dBFS · RMS ${linToDb(rms).toFixed(1).padStart(6)} dBFS · ${(N / SR).toFixed(3)} s`);
}

// ───────────────────────────────────────────────────────────── 1) ambiente.wav

/**
 * Aire de habitación: ruido marrón/rosa filtrado muy abajo, con cutoff y amplitud derivando lentamente.
 * Sin siseo agudo (todo por debajo de ~1,2 kHz), sin tonos reconocibles. RMS ≈ −42 dBFS.
 */
function buildAmbience(): Stem {
  const rnd = mulberry32(0xa11b1e27);
  const stem = newStem();
  const channels = [stem.l, stem.r];
  const common = new Float32Array(N);

  // fuente común (parte correlacionada entre canales → sensación de "una sola sala")
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
    for (let n = 0; n < N; n++) {
      const t = n / SR;
      const white = rnd() * 2 - 1;
      brown = (brown + 0.02 * white) / 1.02;
      const w2 = rnd() * 2 - 1;
      b0 = 0.99765 * b0 + w2 * 0.099046;
      b1 = 0.963 * b1 + w2 * 0.2965164;
      b2 = 0.57 * b2 + w2 * 1.0526913;
      const pink = b0 + b1 + b2 + w2 * 0.1848;
      // cutoff que "respira" lentamente (400–760 Hz)
      const fc = 640 + 170 * Math.sin(TWO_PI * 0.047 * t + ph[0]) + 80 * Math.sin(TWO_PI * 0.113 * t + ph[1]);
      const a = onePoleCoef(fc);
      lpB += a * (brown * 7 - lpB);
      lpC += a * (common[n] * 7 - lpC);
      lpP += onePoleCoef(900) * (pink * 0.05 - lpP);
      const amp = 1 + 0.1 * Math.sin(TWO_PI * 0.071 * t + ph[2]) + 0.06 * Math.sin(TWO_PI * 0.173 * t + ph[3]);
      out[n] = hp2(hp1((0.8 * lpB + 0.45 * lpC + 0.34 * lpP) * amp));
    }
  }

  // entrada ~0,5 s y salida ~0,5 s (raised-cosine); último valor exactamente 0
  const fadeIn = secToSample(0.5);
  const fadeOut = secToSample(0.5);
  for (let i = 0; i < N; i++) {
    const gIn = i < fadeIn ? cosRamp(i / fadeIn) : 1;
    const gOut = i > N - fadeOut ? cosRamp((N - 1 - i) / fadeOut) : 1;
    const g = gIn * gOut;
    stem.l[i] *= g;
    stem.r[i] *= g;
  }
  const rms = rmsOf(stem.l, stem.r);
  scaleStem(stem, dbToLin(-42) / rms);
  return stem;
}

// ───────────────────────────────────────────────────────────── 2) teclado.wav

type KeyVoiceSpec = {
  dur: number;
  hpFc: number;
  clickTau: number;
  clickW: number;
  thumpHz: number;
  thumpTau: number;
  thumpW: number;
  tokHz: number;
  tokTau: number;
  tokW: number;
};

function keySpec(kind: KeyKind, rnd: Rnd): KeyVoiceSpec {
  const r = (a: number, b: number): number => a + (b - a) * rnd();
  switch (kind) {
    case "space": // más grave y un poco más larga
      return { dur: 0.15, hpFc: r(1600, 2400), clickTau: r(0.003, 0.0042), clickW: 0.55, thumpHz: r(84, 112), thumpTau: r(0.012, 0.016), thumpW: 0.8, tokHz: r(520, 700), tokTau: 0.009, tokW: 0.5 };
    case "punct": // apenas distinta: algo más aguda y seca
      return { dur: 0.11, hpFc: r(3000, 4300), clickTau: r(0.0013, 0.0021), clickW: 0.75, thumpHz: r(150, 215), thumpTau: r(0.0065, 0.0085), thumpW: 0.75, tokHz: r(900, 1400), tokTau: 0.004, tokW: 0.5 };
    case "backspace": // tick seco y liviano
      return { dur: 0.06, hpFc: r(3000, 5000), clickTau: r(0.001, 0.0015), clickW: 0.85, thumpHz: r(230, 290), thumpTau: r(0.003, 0.0042), thumpW: 0.34, tokHz: 1000, tokTau: 0.002, tokW: 0 };
    default: // tecla normal: tap suave de membrana/notebook
      return { dur: 0.11, hpFc: r(2000, 3800), clickTau: r(0.0016, 0.0028), clickW: 0.7, thumpHz: r(130, 190), thumpTau: r(0.0075, 0.0095), thumpW: 0.8, tokHz: r(800, 1300), tokTau: 0.0045, tokW: 0.55 };
  }
}

/** Una pulsación (mono, pico normalizado a 1): transitorio de ruido pasa-altos + golpe grave + "tok" de carcasa. */
function keyVoice(kind: KeyKind, rnd: Rnd): Float32Array {
  const s = keySpec(kind, rnd);
  const len = secToSample(s.dur);
  const click = new Float32Array(len);
  const thump = new Float32Array(len);
  const tok = new Float32Array(len);
  const hp = biquad("hp", s.hpFc, 0.707);
  const lp = biquad("lp", 7000, 0.707);
  const bp = biquad("bp", s.tokHz, 2);
  let phase = 0;
  for (let n = 0; n < len; n++) {
    const t = n / SR;
    const att = 1 - Math.exp(-t / 0.0003); // ataque ~0,3 ms (sin clic digital, pero instante exacto)
    click[n] = lp(hp(rnd() * 2 - 1)) * att * Math.exp(-t / s.clickTau);
    const f = s.thumpHz * (1 + 0.18 * Math.exp(-t / 0.01));
    phase += (TWO_PI * f) / SR;
    thump[n] = (Math.cos(phase) + 0.25 * Math.cos(2 * phase) * Math.exp(-t / (s.thumpTau * 0.5))) * (1 - Math.exp(-t / 0.0004)) * Math.exp(-t / s.thumpTau);
    tok[n] = bp(rnd() * 2 - 1) * att * Math.exp(-t / s.tokTau);
  }
  normalizePeak(click, 0);
  normalizePeak(thump, 0);
  normalizePeak(tok, 0);
  const out = new Float32Array(len);
  for (let n = 0; n < len; n++) out[n] = s.clickW * click[n] + s.thumpW * thump[n] + s.tokW * tok[n];
  // cola a cero exacto (últimos 8 ms)
  const taper = secToSample(0.008);
  for (let n = len - taper; n < len; n++) out[n] *= cosRamp((len - 1 - n) / taper);
  return normalizePeak(out, 0);
}

/**
 * Un golpe por cada KEY_EVENTS en el instante exacto frame/30 s. Si varios eventos caen en el MISMO fotograma
 * (ráfaga de borrado: hasta 4 caracteres/fotograma), el primero queda exacto y los demás se reparten
 * uniformemente DENTRO de ese fotograma (k·1600/n muestras): suena a ráfaga acelerando, no a un golpe único saturado.
 */
function buildKeys(): Stem {
  const rnd = mulberry32(0x4b455953);
  const stem = newStem();
  const groupSize = new Map<number, number>();
  for (const e of KEY_EVENTS) groupSize.set(e.frame, (groupSize.get(e.frame) ?? 0) + 1);
  const seen = new Map<number, number>();
  const backs = KEY_EVENTS.filter((e) => e.kind === "backspace").map((e) => e.frame);

  for (const e of KEY_EVENTS) {
    const n = groupSize.get(e.frame) ?? 1;
    const k = seen.get(e.frame) ?? 0;
    seen.set(e.frame, k + 1);
    const start = frameToSample(e.frame) + Math.floor((k * SPF) / n);

    const voice = keyVoice(e.kind, rnd);
    const jitter = rnd(); // nivel por tecla (determinista)
    const pan = (rnd() * 2 - 1) * 0.15; // ±15 %
    let peakDb: number;
    if (e.kind === "backspace") {
      // amplitud contenida y decreciente con la densidad de la ráfaga (evita saturar / "chicharra")
      const dens = backs.filter((f) => Math.abs(f - e.frame) <= 2).length;
      peakDb = -21 + (jitter - 0.5) * 3 - 10 * Math.log10(1 + 0.25 * (dens - 1));
    } else if (e.kind === "space") {
      peakDb = -13 + (jitter - 0.5) * 2;
    } else if (e.kind === "punct") {
      peakDb = -14.5 + (jitter - 0.5) * 2;
    } else {
      peakDb = -14 + (jitter - 0.5) * 3; // −15,5 … −12,5
    }
    let [gl, gr] = panGains(pan);
    const m = Math.max(gl, gr);
    gl = (gl / m) * dbToLin(peakDb);
    gr = (gr / m) * dbToLin(peakDb);
    addMono(stem, start, voice, gl, gr);
  }
  return stem;
}

// ───────────────────────────────────────────────────────────── 3) musica.wav

/** Compás de 105 fotogramas (3,5 s) desde SFX_CUES.musicIn: los cambios armónicos caen en 410, 515, 620, 725, 830, 935. */
const BAR_FRAMES = 105;
const MUSIC_IN = SFX_CUES.musicIn;
const END_FRAME = TOTAL_FRAMES;
const barStart = (i: number): number => MUSIC_IN + i * BAR_FRAMES;
/** Inicio del fundido final propio del stem (Reel.tsx arranca el suyo en SFX_CUES.musicOutFrom). */
const MUSIC_FADE_FROM = 1000;
/** Umbral (dB sobre el RMS) donde la saturación suave del piano empieza a redondear picos. */
const PIANO_KNEE_DB = 7;

type PianoNote = [slot: number, note: string, vel: number];
type Bar = { chord: string; bass: string; notes: PianoNote[] };

/**
 * Armonía sobria en Re mayor. `slot` = corcheas dentro del compás (8 por compás: 0,4375 s cada una).
 * Se evita tocar el piano justo sobre los hitos de sfx-hilo (452, 540, 622, 832, 912) para dejarles espacio.
 */
const BARS: Bar[] = [
  { chord: "Dmaj7", bass: "D2", notes: [[0, "D3", 0.55], [2, "A3", 0.45], [4, "F#4", 0.5], [5, "C#5", 0.45], [7, "A4", 0.35]] },
  { chord: "Bm7", bass: "B1", notes: [[0, "B2", 0.55], [1, "F#3", 0.42], [3, "D4", 0.45], [4, "A4", 0.5], [5, "F#4", 0.38], [7, "D5", 0.33]] },
  { chord: "Gmaj7", bass: "G1", notes: [[0, "G3", 0.55], [2, "D4", 0.45], [3, "F#4", 0.45], [4, "B4", 0.5], [5, "D5", 0.42], [7, "F#4", 0.32]] },
  { chord: "Asus4 → A6", bass: "A1", notes: [[0, "A2", 0.55], [2, "E3", 0.45], [3, "D4", 0.45], [4, "E4", 0.5], [6, "C#4", 0.4], [7, "A4", 0.33]] },
  { chord: "Dmaj7", bass: "D2", notes: [[0, "D3", 0.58], [2, "A3", 0.5], [3, "F#4", 0.5], [4, "C#5", 0.5], [5, "A4", 0.42]] },
  { chord: "Dmaj9", bass: "D2", notes: [[0, "D3", 0.5], [2, "A3", 0.38], [3, "F#4", 0.32], [4.5, "C#5", 0.26]] },
];

/** Piano eléctrico/felt suave: parciales aditivos (inarmonicidad mínima) + cuerpo FM que se aplaca + golpe de fieltro. */
function pianoNote(freq: number, vel: number, durS: number): Float32Array {
  const len = secToSample(durS);
  const out = new Float32Array(len);
  const tau0 = clamp(1.9 * Math.pow(261.63 / freq, 0.45), 0.75, 2.6);
  const bright = 0.58 + 0.45 * vel;
  const w = (TWO_PI * freq) / SR;
  const lp = onePoleCoef(2300 + 3200 * vel);
  const thudLp = onePoleCoef(650);
  const thudNoise = mulberry32(Math.round(freq * 100) ^ 0x9e37);
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
    out[n] = y;
  }
  // cola a cero (últimos 0,5 s)
  const taper = secToSample(0.5);
  for (let n = len - taper; n < len; n++) out[n] *= cosRamp((len - 1 - n) / taper);
  return normalizePeak(out, 0);
}

type PadLane = { note: string; from: number; to: number };

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
    const lp = onePoleCoef(760 + 220 * v);
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
    for (let n = 0; n < len; n++) mono[v][n] *= env[n] * 0.33;
    addMono(bus, t0, mono[v], gl, gr);
  }
}

/** Sub: seno en la fundamental + 2.º armónico leve (audible en parlantes chicos). */
function subLane(bus: Stem, note: string, fromFrame: number, toFrame: number, fadeInS: number, fadeOutS: number): void {
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
    buf[n] = (Math.sin(TWO_PI * f * t) + 0.3 * Math.sin(TWO_PI * 2 * f * t + 0.6)) * gIn * gOut;
  }
  addMono(bus, t0, buf, Math.SQRT1_2, Math.SQRT1_2);
}

function buildMusic(): Stem {
  const rnd = mulberry32(0x6d757369);
  const piano = newStem();
  const pad = newStem();
  const sub = newStem();

  // — piano (arpegios lentos): humanización determinista ±6 ms / ±8 % de velocidad (el slot 0 queda exacto)
  for (let b = 0; b < BARS.length; b++) {
    const bar = BARS[b];
    const barSamples = BAR_FRAMES * SPF;
    for (const [slot, note, vel] of bar.notes) {
      const jt = slot === 0 ? 0 : Math.round((rnd() * 2 - 1) * 0.006 * SR);
      const v = vel * (1 + (rnd() * 2 - 1) * 0.08);
      const start = frameToSample(barStart(b)) + Math.round((slot * barSamples) / 8) + jt;
      const f = hz(note);
      const buf = pianoNote(f, v, 4.5);
      const midi = 69 + 12 * Math.log2(f / 440);
      const [gl, gr] = panGains(clamp((midi - 62) / 40, -0.4, 0.4));
      const g = 0.5 * Math.pow(v, 1.15);
      addMono(piano, start, buf, gl * g, gr * g);
    }
  }

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

  // — pad: pedal de La3 + voces que se mueven por grados conjuntos (cambios en los compases)
  const lanes: PadLane[] = [
    { note: "A3", from: barStart(0), to: END_FRAME },
    { note: "C#4", from: barStart(0), to: barStart(1) },
    { note: "D4", from: barStart(1), to: barStart(4) },
    { note: "C#4", from: barStart(4), to: END_FRAME },
    { note: "F#4", from: barStart(0), to: barStart(3) },
    { note: "E4", from: barStart(3), to: barStart(4) },
    { note: "F#4", from: barStart(4), to: END_FRAME },
    { note: "E4", from: barStart(5), to: END_FRAME },
  ];
  for (const lane of lanes) {
    const first = lane.from === barStart(0);
    // los cambios son fundidos cruzados centrados en la línea de compás (el nuevo entra antes, el viejo sale después)
    const shifted: PadLane = first ? lane : { ...lane, from: lane.from - 12 /* ≈ 0,4 s antes */ };
    const outer: PadLane = lane.to === END_FRAME ? shifted : { ...shifted, to: lane.to + 10 };
    padLane(pad, outer, first ? 2.5 : 1.1, 1.0, rnd);
  }

  // — sub: la raíz de cada compás (D – B – G – A – D – D)
  for (let b = 0; b < BARS.length; b++) {
    const to = b === BARS.length - 1 ? END_FRAME : barStart(b + 1);
    subLane(sub, BARS[b].bass, barStart(b), to, 0.3, 0.55);
  }

  // — balance entre capas (por RMS en la zona musical) y envío a reverb
  const from = frameToSample(MUSIC_IN + 30);
  const to = frameToSample(MUSIC_FADE_FROM);
  const refRms = rmsOf(piano.l, piano.r, from, to);
  const target = (st: Stem, db: number): void => {
    const r = rmsOf(st.l, st.r, from, to);
    if (r > 0) scaleStem(st, (refRms * dbToLin(db)) / r);
  };
  target(pad, -7.5);
  target(sub, -13.5);
  const pk = (st: Stem): string => `pico ${linToDb(Math.max(peakOf(st.l), peakOf(st.r))).toFixed(1)} dB / RMS ${linToDb(rmsOf(st.l, st.r, from, to)).toFixed(1)} dB`;
  console.log(`  [música] capas → piano ${pk(piano)} · pad ${pk(pad)} · sub ${pk(sub)}`);

  // swell de entrada (≈2,5 s): el pad y el sub nacen desde el silencio; el piano arranca suave (piso 0,35)
  const swellN = secToSample(2.5);
  const t410 = frameToSample(MUSIC_IN);
  for (let i = t410; i < Math.min(N, t410 + swellN); i++) {
    const sw = Math.sin((Math.PI / 2) * ((i - t410) / swellN)) ** 2;
    const gp = 0.35 + 0.65 * sw;
    pad.l[i] *= sw;
    pad.r[i] *= sw;
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

  const out = newStem();
  for (let i = 0; i < N; i++) {
    out.l[i] = piano.l[i] + pad.l[i] + sub.l[i] + wet.l[i];
    out.r[i] = piano.r[i] + pad.r[i] + sub.r[i] + wet.r[i];
  }

  // silencio exacto hasta 410 (la reverb/ruidos no pueden filtrarse antes del hito)
  for (let i = 0; i < t410; i++) {
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

  // limitador + nivel: pico ≈ −10 dBFS con la dinámica comprimida lo justo (cresta baja → más sonoridad)
  const rms0 = rmsOf(out.l, out.r, from, to);
  scaleStem(out, dbToLin(-19.3) / rms0); // RMS objetivo de la zona musical (limitador ≤ ~3 dB, sin bombeo)
  const gr = limit(out, -10);
  console.log(`  [música] reducción máxima del limitador: ${gr.toFixed(1)} dB`);

  // fundido final propio (raised-cosine, termina en 0 exacto en la última muestra)
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

/** Soplo de aire ascendente (ruido pasa-banda con barrido de frecuencia, ancho estéreo por ruido independiente). */
function breath(durS: number, f0: number, f1: number, q: number, rnd: Rnd): [Float32Array, Float32Array] {
  const len = secToSample(durS);
  const res: Float32Array[] = [];
  for (let ch = 0; ch < 2; ch++) {
    const out = new Float32Array(len);
    let low = 0;
    let band = 0;
    const soft1 = biquad("lp", 3200, 0.707);
    const soft2 = biquad("lp", 3200, 0.707); // sin siseo agudo: todo el soplo queda por debajo de ~4 kHz
    const tp = 0.62 * durS;
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

/** Tono sinusoidal suave con glissando (curva suave) y 2.º armónico leve; `detune` abre el estéreo con batido muy lento. */
function glideTone(f0: number, f1: number, glideS: number, totalS: number, attackS: number, releaseS: number, detune: number): Float32Array {
  const len = secToSample(totalS);
  const out = new Float32Array(len);
  let phase = 0;
  for (let n = 0; n < len; n++) {
    const t = n / SR;
    const f = (f0 + (f1 - f0) * smoothstep(t / glideS)) * (1 + detune);
    phase += (TWO_PI * f) / SR;
    const env = cosRamp(t / attackS) * (t > totalS - releaseS ? cosRamp((totalS - t) / releaseS) : 1);
    out[n] = env * (Math.sin(phase) + 0.14 * Math.sin(2 * phase + 0.4));
  }
  return out;
}

/** Tono grave cálido y breve (no campana): armónicos 1–3 con decaimientos distintos, ataque suave, "asentamiento" de afinación. */
function warmTone(freq: number, tau: number, durS: number, detune: number): Float32Array {
  const len = secToSample(durS);
  const out = new Float32Array(len);
  const amps = [1, 0.3, 0.1];
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

/** "Tic" apenas perceptible para el cambio de subtítulo: blip de seno corto con un hálito de ruido. */
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

function buildSfx(): Stem {
  const rnd = mulberry32(0x73667831);
  const dry = newStem();
  const wetSend = newStem();
  const sampleAt = (frame: number): number => frameToSample(frame);

  /** Coloca un par estéreo normalizado a `peakDb` (por el canal más fuerte) en `frame`; `send` = parte que va a la reverb. */
  const placeStereo = (frame: number, l: Float32Array, r: Float32Array, peakDb: number, send = 0.0): void => {
    const p = Math.max(peakOf(l), peakOf(r));
    const g = p > 0 ? dbToLin(peakDb) / p : 0;
    addStereo(dry, sampleAt(frame), l, r, g);
    if (send > 0) addStereo(wetSend, sampleAt(frame), l, r, g * send);
  };
  const placeMono = (frame: number, buf: Float32Array, peakDb: number, pan: number, send = 0.0): void => {
    normalizePeak(buf, peakDb);
    const [pl, pr] = panGains(pan);
    const gl = pl / Math.max(pl, pr);
    const gr = pr / Math.max(pl, pr);
    addMono(dry, sampleAt(frame), buf, gl, gr);
    if (send > 0) addMono(wetSend, sampleAt(frame), buf, gl * send, gr * send);
  };

  const dur = (a: number, b: number): number => (b - a) / FPS;

  // 1) nacimiento del hilo (410): soplo ascendente + seno que "se estira" (Re4 → La4, quinta justa consonante con Dmaj7)
  {
    const born = dur(THREAD_TIMING.bornFrom, THREAD_TIMING.bornTo); // 1,33 s
    const [bl, br] = breath(1.2, 650, 2500, 0.9, rnd);
    placeStereo(SFX_CUES.threadBorn, bl, br, -27, 0.5);
    const tl = glideTone(hz("D4"), hz("A4"), born * 0.85, 1.35, 0.22, 0.55, -0.0006);
    const tr = glideTone(hz("D4"), hz("A4"), born * 0.85, 1.35, 0.22, 0.55, 0.0006);
    placeStereo(SFX_CUES.threadBorn, tl, tr, -19, 0.5);
  }

  // 2) oraciones del giro (452 / 540): tono grave cálido, breve y suave
  {
    const dl = warmTone(hz("D3"), 0.3, 1.5, -0.0005);
    const dr = warmTone(hz("D3"), 0.3, 1.5, 0.0005);
    placeStereo(SFX_CUES.phraseOne, dl, dr, -18.5, 0.45);
    const al = warmTone(hz("A3"), 0.28, 1.4, -0.0005);
    const ar = warmTone(hz("A3"), 0.28, 1.4, 0.0005);
    placeStereo(SFX_CUES.phraseTwo, al, ar, -19.5, 0.45);
  }

  // 3) descenso del hilo (622): glissando descendente suave Si4 → Fa#4 (sobre Gmaj7)
  {
    const d = dur(THREAD_TIMING.descendFrom, THREAD_TIMING.descendTo); // 1 s
    const l = glideTone(hz("B4"), hz("F#4"), d, d + 0.3, 0.09, 0.45, -0.0006);
    const r = glideTone(hz("B4"), hz("F#4"), d, d + 0.3, 0.09, 0.45, 0.0006);
    placeStereo(SFX_CUES.threadDescend, l, r, -21, 0.45);
  }

  // 4) ascenso del hilo (832): glissando ascendente suave La4 → Re5 (sobre Dmaj7)
  {
    const d = dur(THREAD_TIMING.riseFrom, THREAD_TIMING.riseTo); // 1,07 s
    const l = glideTone(hz("A4"), hz("D5"), d, d + 0.3, 0.09, 0.45, -0.0006);
    const r = glideTone(hz("A4"), hz("D5"), d, d + 0.3, 0.09, 0.45, 0.0006);
    placeStereo(SFX_CUES.threadRise, l, r, -20, 0.45);
  }

  // 5) logo (912): carillón cálido (arpegio ascendente La5 – Re6 – Fa#6, decaimiento ≈ 2 s)
  {
    const notes: [string, number, number, number][] = [
      ["A5", 0.0, -16, -0.22],
      ["D6", 0.095, -17.5, 0.0],
      ["F#6", 0.2, -18.5, 0.22],
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
  }

  // 6) "tic" en cada cambio de subtítulo (apenas perceptible)
  {
    const freqs = ["D6", "E6", "A6"];
    SFX_CUES.subtitleUnits.forEach((fr, i) => {
      placeMono(fr, tick(hz(freqs[i % freqs.length]), rnd), -34, i % 2 === 0 ? -0.1 : 0.1);
    });
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
  console.log(`build-audio · ${TOTAL_FRAMES} fotogramas @ ${FPS} fps = ${(N / SR).toFixed(3)} s · ${SR} Hz · estéreo 16-bit`);
  console.log(`  eventos de teclado: ${KEY_EVENTS.length} · música desde el fotograma ${CURSOR_HANDOFF}`);
  const t0 = Date.now();
  writeStem("ambiente.wav", buildAmbience());
  writeStem("teclado.wav", buildKeys());
  writeStem("musica.wav", buildMusic());
  writeStem("sfx-hilo.wav", buildSfx());
  console.log(`listo en ${((Date.now() - t0) / 1000).toFixed(1)} s → ${OUT_DIR}`);
}

main();
