/**
 * verify-audio.ts — v3 · verificación objetiva de los 4 stems de public/audio (sin necesidad de «escuchar»).
 *
 *   node scripts/verify-audio.ts            (o:  npm run audio:verify)
 *
 * Requiere ffmpeg/ffprobe en el PATH. Salida con código 1 si falla alguna comprobación dura.
 * Variables opcionales:  AUDIO_CHECK_DIR=<carpeta>  (espectrogramas y mezclas de prueba; por defecto <tmp>/adip-audio-check)
 *                        AUDIO_VERBOSE=1            (tabla completa de las 128 pulsaciones)
 *
 * (a) formato y duración exactos: 53 s = 1590 f (ffprobe + lectura propia del WAV)
 * (b) teclado: detección CIEGA de onsets (envolvente de energía) vs KEY_EVENTS (±1 ms), silencio digital fuera de eventos,
 *     silencio de teclado desde el fin del tipeo del mensaje 3 (f612) hasta el final, presencia de la ráfaga de borrado (⌫,
 *     1 retroceso por fotograma) sin saturar, distinción de tipos de tecla y variación entre pulsaciones (ninguna repetida)
 * (c) picos / RMS / clipping / DC / empalmes (clics) por stem; ambiente audible desde f0, «aire que se abre» en la duda y
 *     calma bajo la respuesta; música en silencio digital hasta musicIn (f790) y sfx hasta ENVIAR (f702); finales a cero
 * (d) alineación de los hitos de sfx-hilo con SFX_CUES (detector de subida en banda propia de cada hito)
 * (e) música: cambios armónicos en los compases de 105 f desde musicIn (detector de novedad de croma grave) y espacio para la
 *     voz futura (banda 300–3000 Hz contenida)
 * (f) mezcla simulada con los volúmenes REALES de src/Reel.tsx (se leen del archivo): pico real y sonoridad integrada (ebur128)
 * (g) espectrogramas (ffmpeg showspectrumpic) para revisar a ojo: banda ancha rara, clics, cortes
 */
import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { COMPANION_TIMING, FPS, MESSAGE_SPECS, SEND_TIMING, SFX_CUES, TOTAL_FRAMES } from "../src/config/timeline.ts";
import { KEY_EVENTS, MESSAGE_TIMINGS } from "../src/config/typing.ts";

const SR = 48000;
const SPF = SR / FPS;
const N = TOTAL_FRAMES * SPF;
const AUDIO_DIR = fileURLToPath(new URL("../public/audio/", import.meta.url));
const REEL_FILE = fileURLToPath(new URL("../src/Reel.tsx", import.meta.url));
const CHECK_DIR = process.env.AUDIO_CHECK_DIR ?? `${tmpdir()}/adip-audio-check`;
const VERBOSE = process.env.AUDIO_VERBOSE === "1";
mkdirSync(CHECK_DIR, { recursive: true });

const STEMS = ["ambiente", "teclado", "musica", "sfx-hilo"] as const;
type StemName = (typeof STEMS)[number];

const PAUSE_FROM = MESSAGE_SPECS[2].typeEnd; // fin del tipeo del último mensaje (f612): desde acá el teclado no vuelve a sonar
const PAUSE_TO = SEND_TIMING.pressFrom; // se pulsa ENVIAR (f702): fin de la pausa de la duda
const REPLY = SFX_CUES.reply; // llega «Estoy acá. Te escucho.» (f790) y entra la música
const TOTAL_S = TOTAL_FRAMES / FPS;
const fSample = (f: number): number => Math.round((f / FPS) * SR);

const dbf = (x: number): number => 20 * Math.log10(Math.max(x, 1e-12));
let failures = 0;
const fail = (msg: string): void => {
  failures++;
  console.log(`  ✗ FALLA: ${msg}`);
};
const ok = (msg: string): void => console.log(`  ✓ ${msg}`);
const check = (cond: boolean, okMsg: string, failMsg: string): void => (cond ? ok(okMsg) : fail(failMsg));
const fmt = (x: number, d = 1): string => (Number.isFinite(x) ? x.toFixed(d) : "−∞");

// ───────────────────────────────────────────────────────────── lectura de WAV (robusta a chunks extra)

type Wav = { sr: number; ch: number; bits: number; n: number; l: Float32Array; r: Float32Array; clipped: number; zeros: number };

function readWav(path: string): Wav {
  const b = readFileSync(path);
  if (b.toString("ascii", 0, 4) !== "RIFF" || b.toString("ascii", 8, 12) !== "WAVE") throw new Error(`${path}: no es RIFF/WAVE`);
  let off = 12;
  let sr = 0;
  let ch = 0;
  let bits = 0;
  let tag = 0;
  let dataOff = -1;
  let dataLen = 0;
  while (off + 8 <= b.length) {
    const id = b.toString("ascii", off, off + 4);
    const size = b.readUInt32LE(off + 4);
    if (id === "fmt ") {
      tag = b.readUInt16LE(off + 8);
      ch = b.readUInt16LE(off + 10);
      sr = b.readUInt32LE(off + 12);
      bits = b.readUInt16LE(off + 22);
    } else if (id === "data") {
      dataOff = off + 8;
      dataLen = size;
      break;
    }
    off += 8 + size + (size % 2);
  }
  if (dataOff < 0 || tag !== 1 || bits !== 16 || ch !== 2) throw new Error(`${path}: se esperaba PCM 16-bit estéreo (tag ${tag}, ${bits} bit, ${ch} ch)`);
  const n = dataLen / 4;
  const l = new Float32Array(n);
  const r = new Float32Array(n);
  let clipped = 0;
  let zeros = 0;
  for (let i = 0; i < n; i++) {
    const a = b.readInt16LE(dataOff + i * 4);
    const c = b.readInt16LE(dataOff + i * 4 + 2);
    if (Math.abs(a) >= 32767 || Math.abs(c) >= 32767) clipped++;
    if (a === 0 && c === 0) zeros++;
    l[i] = a / 32768;
    r[i] = c / 32768;
  }
  return { sr, ch, bits, n, l, r, clipped, zeros };
}

const peakOf = (w: Wav, from = 0, to = w.n): number => {
  let p = 0;
  for (let i = from; i < to; i++) p = Math.max(p, Math.abs(w.l[i]), Math.abs(w.r[i]));
  return p;
};
const rmsOf = (w: Wav, from = 0, to = w.n): number => {
  let s = 0;
  for (let i = from; i < to; i++) s += w.l[i] * w.l[i] + w.r[i] * w.r[i];
  return Math.sqrt(s / (2 * Math.max(1, to - from)));
};
const monoOf = (w: Wav): Float32Array => {
  const m = new Float32Array(w.n);
  for (let i = 0; i < w.n; i++) m[i] = (w.l[i] + w.r[i]) * 0.5;
  return m;
};
/** ¿Hay alguna muestra no nula en [from, to)? Devuelve el índice de la primera, o −1. */
const firstNonZero = (w: Wav, from = 0, to = w.n): number => {
  for (let i = from; i < to; i++) if (w.l[i] !== 0 || w.r[i] !== 0) return i;
  return -1;
};

function run(cmd: string, args: string[]): { out: string; err: string; status: number } {
  const p = spawnSync(cmd, args, { encoding: "utf8", maxBuffer: 1 << 28 });
  if (p.error) throw new Error(`no se pudo ejecutar ${cmd}: ${p.error.message}`);
  return { out: p.stdout ?? "", err: p.stderr ?? "", status: p.status ?? -1 };
}

// ───────────────────────────────────────────────────────────── DSP mínimo (biquad, FFT, Welch)

type Filter = (x: number) => number;
function bq(kind: "hp" | "bp" | "lp", fc: number, q: number): Filter {
  const w0 = (2 * Math.PI * fc) / SR;
  const al = Math.sin(w0) / (2 * q);
  const c = Math.cos(w0);
  const a0 = 1 + al;
  let b0: number;
  let b1: number;
  let b2: number;
  if (kind === "hp") {
    b0 = (1 + c) / 2;
    b1 = -(1 + c);
    b2 = b0;
  } else if (kind === "lp") {
    b0 = (1 - c) / 2;
    b1 = 1 - c;
    b2 = b0;
  } else {
    b0 = al;
    b1 = 0;
    b2 = -al;
  }
  b0 /= a0;
  b1 /= a0;
  b2 /= a0;
  const a1 = (-2 * c) / a0;
  const a2 = (1 - al) / a0;
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

function fft(re: Float64Array, im: Float64Array): void {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wr = Math.cos(ang);
    const wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1;
      let ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k;
        const b = i + k + len / 2;
        const vr = re[b] * cr - im[b] * ci;
        const vi = re[b] * ci + im[b] * cr;
        re[b] = re[a] - vr;
        im[b] = im[a] - vi;
        re[a] += vr;
        im[a] += vi;
        const ncr = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = ncr;
      }
    }
  }
}

/** Densidad espectral de potencia (cuadrado medio por bin, unilateral) de x[a, b) por el método de Welch (Hann, 50 %). */
function welch(x: Float32Array, a: number, b: number, nfft = 8192): Float64Array {
  const win = new Float64Array(nfft);
  let U = 0;
  for (let i = 0; i < nfft; i++) {
    win[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / nfft);
    U += win[i] * win[i];
  }
  const P = new Float64Array(nfft / 2 + 1);
  let segs = 0;
  const re = new Float64Array(nfft);
  const im = new Float64Array(nfft);
  for (let s = a; s + nfft <= b; s += nfft / 2) {
    for (let i = 0; i < nfft; i++) {
      re[i] = x[s + i] * win[i];
      im[i] = 0;
    }
    fft(re, im);
    for (let k = 0; k <= nfft / 2; k++) P[k] += (2 * (re[k] * re[k] + im[k] * im[k])) / (nfft * U);
    segs++;
  }
  if (segs > 0) for (let k = 0; k < P.length; k++) P[k] /= segs;
  return P;
}
const bandMs = (P: Float64Array, lo: number, hi: number, nfft = 8192): number => {
  let s = 0;
  for (let k = 0; k < P.length; k++) {
    const f = (k * SR) / nfft;
    if (f >= lo && f < hi) s += P[k];
  }
  return s;
};

const wavs = {} as Record<StemName, Wav>;

// ───────────────────────────────────────────────────────────── (a) formato y duración

console.log("\n(a) Formato y duración (ffprobe)");
check(TOTAL_FRAMES === 1590 && TOTAL_S === 53, "timeline.ts: TOTAL_FRAMES = 1590 f = 53 s (30 fps)", `timeline.ts: TOTAL_FRAMES = ${TOTAL_FRAMES} (se esperaban 1590 f = 53 s)`);
for (const name of STEMS) {
  const file = `${AUDIO_DIR}${name}.wav`;
  const pr = run("ffprobe", ["-v", "error", "-print_format", "json", "-show_streams", "-show_format", file]);
  const j = JSON.parse(pr.out) as { streams: { codec_name: string; sample_rate: string; channels: number; bits_per_sample: number; duration: string }[]; format: { duration: string } };
  const s = j.streams[0];
  const dur = Number(s.duration);
  const w = readWav(file);
  wavs[name] = w;
  const exact = s.codec_name === "pcm_s16le" && Number(s.sample_rate) === SR && s.channels === 2 && s.bits_per_sample === 16 && Math.abs(dur - TOTAL_FRAMES / FPS) < 1e-9 && w.n === N;
  console.log(`  ${name.padEnd(9)} ${s.codec_name} · ${s.sample_rate} Hz · ${s.channels} ch · ${s.bits_per_sample} bit · ${Number(j.format.duration).toFixed(6)} s · ${w.n} muestras · ${statSync(file).size} bytes`);
  check(exact, `${name}.wav: PCM 16-bit, 48 kHz, estéreo, exactamente ${TOTAL_FRAMES / FPS} s (${N} muestras), alineado al fotograma 0`, `${name}.wav no cumple el formato/duración exactos`);
}

// ───────────────────────────────────────────────────────────── (b) teclado

console.log("\n(b) teclado.wav · onsets ciegos vs KEY_EVENTS, pausa de duda, borrado y variación");
{
  const w = wavs.teclado;
  const mono = monoOf(w);

  // pasa-altos de 2.º orden (1,8 kHz): deja el transitorio de ruido y quita el golpe grave
  const hpf = bq("hp", 1800, 0.707);
  const hp = new Float32Array(N);
  for (let i = 0; i < N; i++) hp[i] = hpf(mono[i]);

  // Detector de onsets ciego, robusto a un «piso» de fondo (el arrastre del borrado): máximo móvil de |HP| de 0,25 ms contra el
  // máximo de la ventana [−6 ms, −1,5 ms]; onset = muestra que supera −60 dBFS y 3× ese piso; refractario 3 ms.
  const slidingMax = (a: Float32Array, win: number): Float32Array => {
    const out = new Float32Array(a.length);
    const dq = new Int32Array(a.length);
    let head = 0;
    let tail = 0;
    for (let i = 0; i < a.length; i++) {
      while (tail > head && a[dq[tail - 1]] <= a[i]) tail--;
      dq[tail++] = i;
      while (dq[head] <= i - win) head++;
      out[i] = a[dq[head]];
    }
    return out;
  };
  const rect = new Float32Array(N);
  for (let i = 0; i < N; i++) rect[i] = Math.abs(hp[i]);
  const fast = slidingMax(rect, Math.round(0.00025 * SR));
  const floorMax = slidingMax(rect, Math.round(0.0045 * SR));
  const gapFloor = Math.round(0.0015 * SR);
  const T_ABS = 10 ** (-60 / 20);
  const refractory = Math.round(0.003 * SR);
  let last = -1e9;
  const onsets: number[] = [];
  for (let i = 0; i < N; i++) {
    const base = i - gapFloor >= 0 ? floorMax[i - gapFloor] : 0;
    if (fast[i] > T_ABS && fast[i] > 3 * base && i - last > refractory) {
      // el máximo móvil ve la subida ≈0,25 ms «antes» de lo que muestra una sola muestra: se afina a la primera muestra ≥ 15 % del máximo local
      let j = i;
      const pk = Math.max(...Array.from(rect.subarray(i, i + 24)));
      for (let q = Math.max(0, i - 12); q < i + 24; q++) {
        if (rect[q] >= 0.15 * pk && rect[q] > T_ABS) {
          j = q;
          break;
        }
      }
      onsets.push(j);
      last = i;
    }
  }

  // muestras esperadas: frame·1600 + reparto uniforme dentro del fotograma si hay varios eventos en el mismo (ráfaga de borrado)
  const groupSize = new Map<number, number>();
  for (const e of KEY_EVENTS) groupSize.set(e.frame, (groupSize.get(e.frame) ?? 0) + 1);
  const seen = new Map<number, number>();
  const expected = KEY_EVENTS.map((e) => {
    const n = groupSize.get(e.frame) ?? 1;
    const k = seen.get(e.frame) ?? 0;
    seen.set(e.frame, k + 1);
    return { e, sample: fSample(e.frame) + Math.floor((k * SPF) / n), first: k === 0 };
  });

  // emparejamiento por cercanía (ambas listas ordenadas)
  const used = new Set<number>();
  const rows = expected.map((x) => {
    let best = -1;
    let bd = Infinity;
    for (let j = 0; j < onsets.length; j++) {
      const d = Math.abs(onsets[j] - x.sample);
      if (d < bd) {
        bd = d;
        best = j;
      }
    }
    if (best >= 0 && bd <= 0.004 * SR) used.add(best);
    return { ...x, detected: best >= 0 && bd <= 0.004 * SR ? onsets[best] : -1 };
  });
  const missing = rows.filter((r) => r.detected < 0).length;
  const spurious = onsets.length - used.size;
  const deltas = rows.filter((r) => r.detected >= 0).map((r) => ((r.detected - r.sample) / SR) * 1000);
  const maxAbs = Math.max(...deltas.map(Math.abs));
  const meanD = deltas.reduce((a, c) => a + c, 0) / deltas.length;
  const distinctFrames = groupSize.size;

  // resumen por mensaje
  console.log(`  eventos KEY_EVENTS: ${KEY_EVENTS.length} (en ${distinctFrames} fotogramas distintos) · onsets detectados: ${onsets.length}`);
  console.log("  msg  tipeo(tecla/esp/punt)  borrado   1.er-f  últ-f   Δmáx ms   Δmedio ms   pico tipeo dBFS (min…med…max)   pico ⌫ dBFS (min…med…max)");
  const peakAt = (sample: number, ms = 12): number => {
    let p = 0;
    for (let i = sample; i < Math.min(N, sample + Math.round((ms / 1000) * SR)); i++) p = Math.max(p, Math.abs(w.l[i]), Math.abs(w.r[i]));
    return dbf(p);
  };
  const med = (a: number[]): number => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
  for (let m = 0; m < 3; m++) {
    const sub = rows.filter((r) => r.e.message === m);
    const cnt = (k: string): number => sub.filter((r) => r.e.kind === k).length;
    const dd = sub.filter((r) => r.detected >= 0).map((r) => ((r.detected - r.sample) / SR) * 1000);
    const pt = sub.filter((r) => r.e.kind !== "backspace").map((r) => peakAt(r.sample));
    const pb = sub.filter((r) => r.e.kind === "backspace").map((r) => peakAt(r.sample, 6));
    console.log(
      `  ${m + 1}    ${String(cnt("key")).padStart(3)}/${String(cnt("space")).padStart(2)}/${String(cnt("punct")).padStart(1)}            ${String(cnt("backspace")).padStart(3)}      ${String(Math.min(...sub.map((r) => r.e.frame))).padStart(5)}  ${String(Math.max(...sub.map((r) => r.e.frame))).padStart(5)}   ${Math.max(...dd.map(Math.abs)).toFixed(3).padStart(7)}   ${(dd.reduce((a, c) => a + c, 0) / dd.length).toFixed(3).padStart(8)}   ${fmt(Math.min(...pt))} … ${fmt(med(pt))} … ${fmt(Math.max(...pt))}   ${pb.length ? `${fmt(Math.min(...pb))} … ${fmt(med(pb))} … ${fmt(Math.max(...pb))}` : "—"}`,
    );
  }
  if (VERBOSE) {
    console.log("  frame  tipo       carácter  muestra esperada  detectada  Δ ms");
    for (const r of rows) console.log(`  ${String(r.e.frame).padStart(5)}  ${r.e.kind.padEnd(9)}  ${JSON.stringify(r.e.char).padEnd(8)}  ${String(r.sample).padStart(10)}  ${String(r.detected).padStart(10)}  ${(((r.detected - r.sample) / SR) * 1000).toFixed(3)}`);
  }
  const firsts = rows.filter((r) => r.first && r.detected >= 0).map((r) => ((r.detected - r.sample) / SR) * 1000);
  console.log(`  Δ del primer evento de cada fotograma: máx ${Math.max(...firsts.map(Math.abs)).toFixed(3)} ms (n = ${firsts.length}); todos: máx ${maxAbs.toFixed(3)} ms, medio ${meanD.toFixed(3)} ms`);
  if (missing > 0) for (const r of rows.filter((x) => x.detected < 0)) console.log(`    falta el onset de f${r.e.frame} ${r.e.kind} ${JSON.stringify(r.e.char)} (muestra ${r.sample}, ${r.sample - fSample(r.e.frame)} muestras dentro del fotograma)`);
  check(missing === 0 && spurious === 0 && onsets.length === KEY_EVENTS.length, `${KEY_EVENTS.length}/${KEY_EVENTS.length} pulsaciones detectadas, sin onsets espurios ni faltantes`, `onsets: ${onsets.length} detectados vs ${KEY_EVENTS.length} esperados (faltan ${missing}, sobran ${spurious})`);
  check(maxAbs <= 1, `todos los onsets dentro de ±1 ms de frame/30 s (máx ${maxAbs.toFixed(3)} ms; los eventos que comparten fotograma se reparten dentro de él)`, `desvío máximo ${maxAbs.toFixed(3)} ms > 1 ms`);
  check(Math.max(...firsts.map(Math.abs)) <= 0.5, `el primer evento de cada fotograma cae a ≤ 0,5 ms de frame/30 s (máx ${Math.max(...firsts.map(Math.abs)).toFixed(3)} ms)`, "algún primer evento de fotograma se desvía > 0,5 ms");

  // silencio total fuera de los eventos: 200 ms tras cada pulsación (la más larga dura 180 ms); las ráfagas de borrado llevan un «arrastre» hasta 0,36 s tras la última
  const wins: [number, number][] = rows.map((x) => [x.sample, x.sample + Math.round(0.2 * SR)]);
  for (let m = 0; m < MESSAGE_TIMINGS.length; m++) {
    const bs = rows.filter((r) => r.e.kind === "backspace" && r.e.message === m).map((r) => r.sample);
    if (bs.length) wins.push([Math.min(...bs), Math.max(...bs) + Math.round(0.36 * SR)]);
  }
  wins.sort((a, b) => a[0] - b[0]);
  let nonZero = 0;
  let prevEnd = 0;
  const silentRegions: [number, number][] = [];
  for (const [a, b] of wins) {
    if (a > prevEnd) silentRegions.push([prevEnd, a]);
    prevEnd = Math.max(prevEnd, b);
  }
  silentRegions.push([prevEnd, N]);
  for (const [a, b] of silentRegions) for (let i = a; i < b; i++) if (w.l[i] !== 0 || w.r[i] !== 0) nonZero++;
  check(nonZero === 0, "silencio digital exacto fuera de las ventanas de evento (200 ms tras cada pulsación; arrastre del borrado ≤ 0,36 s)", `${nonZero} muestras no nulas fuera de eventos`);

  // PAUSA de la duda y del envío: nada de teclado desde el fin del tipeo del mensaje 3 (f612) hasta el final
  {
    const from = fSample(PAUSE_FROM) + Math.round(0.25 * SR);
    const nz = firstNonZero(w, from, N);
    check(nz < 0, `pausa de la duda y del envío: teclado en silencio digital desde f${PAUSE_FROM} (+0,25 s de cola) hasta el final — ${((PAUSE_TO - PAUSE_FROM) / FPS).toFixed(2)} s de duda hasta ENVIAR (f${PAUSE_TO}) y ${((TOTAL_FRAMES - PAUSE_FROM) / FPS).toFixed(1)} s en total sin una sola tecla`, `hay teclado (muestra ${nz}, f${(nz / SPF).toFixed(1)}) después del fin del tipeo (f${PAUSE_FROM})`);
    const lastEv = Math.max(...KEY_EVENTS.map((e) => e.frame));
    check(lastEv <= PAUSE_FROM, `el último evento de KEY_EVENTS (f${lastEv}) no pasa de typeEnd (f${PAUSE_FROM})`, `KEY_EVENTS tiene eventos (f${lastEv}) después del fin del tipeo`);
    const lastHeard = (() => {
      for (let i = N - 1; i >= 0; i--) if (w.l[i] !== 0 || w.r[i] !== 0) return i;
      return -1;
    })();
    console.log(`  última muestra no nula del teclado: ${lastHeard} (f${(lastHeard / SPF).toFixed(1)}; último evento f${lastEv} + cola de ≤ 0,2 s)`);
    check(lastHeard < fSample(lastEv) + Math.round(0.2 * SR), "el teclado termina con la cola de la última tecla (≤ 0,2 s) y no vuelve a sonar", "el teclado suena después de la cola de la última tecla");
  }

  // BORRADO: ráfaga de retrocesos (1 por fotograma como máximo) con presencia (tick, tecla hundida, arrastre) respecto del tipeo del mismo mensaje
  {
    console.log("  borrado (⌫ sostenida) vs tipeo del mismo mensaje:");
    const windowRms = (a: number, b: number): number => dbf(rmsOf(w, a, b));
    let allOk = true;
    let notSat = true;
    let denseOk = true;
    const erasedMsgs = MESSAGE_TIMINGS.map((t, m) => ({ t, m })).filter((x) => x.t.spec.deleteStart !== null);
    check(erasedMsgs.length === 2 && MESSAGE_TIMINGS[2].spec.deleteStart === null, "se borran los mensajes 1 y 2; el mensaje 3 NO se borra (se envía)", "la lista de mensajes borrados no es 1 y 2");
    for (const { t, m } of erasedMsgs) {
      const bs = rows.filter((r) => r.e.kind === "backspace" && r.e.message === m);
      const first = bs[0].sample;
      const lastS = bs[bs.length - 1].sample;
      const delRms = windowRms(first, lastS + Math.round(0.12 * SR));
      const typRms = windowRms(fSample(t.spec.start), fSample(t.spec.typeEnd) + Math.round(0.05 * SR));
      const ticks = bs.slice(1, -1).map((r) => peakAt(r.sample, 6));
      const down = peakAt(first, 20);
      const rel = peakAt(lastS, 20);
      const perFrame = new Map<number, number>();
      for (const r of bs) perFrame.set(r.e.frame, (perFrame.get(r.e.frame) ?? 0) + 1);
      const maxPerFrame = Math.max(...perFrame.values());
      const span = bs[bs.length - 1].e.frame - bs[0].e.frame + 1;
      const burstPeak = peakAt(first, ((lastS - first) / SR) * 1000 + 120);
      console.log(
        `    mensaje ${m + 1}: ${bs.length} retrocesos en ${span} f (máx ${maxPerFrame} por fotograma; ≈ ${(bs.length / (span / FPS)).toFixed(0)} por s) · RMS borrado ${fmt(delRms)} dBFS vs tipeo ${fmt(typRms)} dBFS (Δ ${fmt(delRms - typRms)} dB) · tecla hundida ${fmt(down)} · ticks mediana ${fmt(med(ticks))} (min ${fmt(Math.min(...ticks))}) · suelta ${fmt(rel)} · pico de la ráfaga ${fmt(burstPeak)} dBFS`,
      );
      const pass = delRms - typRms >= -4 && med(ticks) >= -16.5 && down >= -11 && down - med(ticks) >= 3;
      if (!pass) allOk = false;
      if (!(delRms - typRms <= 4 && burstPeak <= -5.5)) notSat = false;
      if (!(maxPerFrame === 1 && bs.length >= 20 && span <= 45)) denseOk = false;
    }
    check(denseOk, "borrado: ráfaga de ≥ 20 retrocesos en ≤ 45 f, UNO por fotograma como máximo (27 y 25 eventos en 40 f)", "la ráfaga de borrado no cumple 1 retroceso por fotograma o es demasiado corta");
    check(allOk, "⌫ claramente presente: RMS de la ráfaga ≥ tipeo −4 dB, ticks con mediana ≥ −16,5 dBFS (la v1: ≈ −25), tecla hundida ≥ −11 dBFS y ≥ 3 dB sobre los ticks", "el borrado queda demasiado flojo respecto del tipeo o de la tecla hundida");
    check(notSat, "⌫ sin saturar: RMS de la ráfaga ≤ tipeo +4 dB y pico de la ráfaga ≤ −5,5 dBFS", "el borrado satura o es mucho más fuerte que el tipeo");
  }

  // TIPOS de tecla distinguibles (centroide espectral de 32 ms tras el onset, eventos aislados ±40 ms)
  {
    const nfft = 2048;
    const win = new Float64Array(1536);
    for (let i = 0; i < win.length; i++) win[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (win.length - 1));
    const iso = rows.filter((r) => rows.every((o) => o === r || Math.abs(o.sample - r.sample) > Math.round(0.04 * SR)) || r.e.kind === "backspace");
    const cent = (sample: number): number => {
      const re = new Float64Array(nfft);
      const im = new Float64Array(nfft);
      for (let i = 0; i < win.length; i++) re[i] = mono[sample + i] * win[i];
      fft(re, im);
      let num = 0;
      let den = 0;
      for (let k = 2; k < nfft / 2; k++) {
        const f = (k * SR) / nfft;
        if (f > 8000) break;
        const p = re[k] * re[k] + im[k] * im[k];
        num += f * p;
        den += p;
      }
      return den > 0 ? num / den : 0;
    };
    const byKind = (pred: (r: (typeof rows)[number]) => boolean): number[] => iso.filter(pred).map((r) => cent(r.sample));
    const mean = (a: number[]): number => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN);
    const isCap = (r: (typeof rows)[number]): boolean => r.e.kind === "key" && r.e.char !== r.e.char.toLowerCase();
    const cKey = byKind((r) => r.e.kind === "key" && !isCap(r));
    const cSpace = byKind((r) => r.e.kind === "space");
    const cPunct = byKind((r) => r.e.kind === "punct");
    const cBs = byKind((r) => r.e.kind === "backspace");
    const pKey = rows.filter((r) => r.e.kind === "key" && !isCap(r)).map((r) => peakAt(r.sample));
    const pCap = rows.filter(isCap).map((r) => peakAt(r.sample));
    console.log(`  centroide espectral medio (Hz): letras ${fmt(mean(cKey), 0)} (n ${cKey.length}) · espacio ${fmt(mean(cSpace), 0)} (n ${cSpace.length}) · puntuación ${fmt(mean(cPunct), 0)} (n ${cPunct.length}) · ⌫ ${fmt(mean(cBs), 0)} (n ${cBs.length}) · mayúsculas (pico medio ${fmt(mean(pCap))} dBFS vs letras ${fmt(mean(pKey))} dBFS)`);
    check(mean(cSpace) < mean(cKey) * 0.9, "el espacio suena más grave que las letras (centroide ≥ 10 % más bajo)", "el espacio no se distingue de las letras");
    check(mean(cPunct) > mean(cKey) * 1.05, "la puntuación suena más aguda/seca que las letras (centroide ≥ 5 % más alto)", "la puntuación no se distingue de las letras");
    check(Math.abs(mean(cBs) / mean(cKey) - 1) >= 0.15, `⌫ se distingue de las letras (centroide ${fmt(mean(cBs) / mean(cKey), 1)}× el de las letras: ticks más secos y con «arrastre», no tap de letra)`, "⌫ no se distingue de las letras");
    check(mean(pCap) > mean(pKey), "las mayúsculas pesan algo más que las letras (pico medio mayor)", "las mayúsculas no se distinguen");
  }

  // VARIACIÓN: ninguna pulsación repetida (correlación normalizada de los primeros 10 ms entre eventos aislados del mismo tipo)
  {
    const L = Math.round(0.01 * SR);
    const iso = rows.filter((r) => rows.every((o) => o === r || Math.abs(o.sample - r.sample) > Math.round(0.04 * SR)));
    const snip = (sample: number): Float64Array => {
      const a = new Float64Array(L);
      let e = 0;
      for (let i = 0; i < L; i++) {
        a[i] = mono[sample + i];
        e += a[i] * a[i];
      }
      const n = Math.sqrt(e) || 1;
      for (let i = 0; i < L; i++) a[i] /= n;
      return a;
    };
    let worst = 0;
    let pairs = 0;
    let worstPair = "";
    const kinds = ["key", "space", "punct", "backspace"] as const;
    for (const k of kinds) {
      const sn = iso.filter((r) => r.e.kind === k).map((r) => ({ r, s: snip(r.sample) }));
      for (let i = 0; i < sn.length; i++)
        for (let j = i + 1; j < sn.length; j++) {
          let c = 0;
          for (let t = 0; t < L; t++) c += sn[i].s[t] * sn[j].s[t];
          pairs++;
          if (Math.abs(c) > worst) {
            worst = Math.abs(c);
            worstPair = `${k} f${sn[i].r.e.frame}/f${sn[j].r.e.frame}`;
          }
        }
    }
    console.log(`  variación: ${pairs} pares de eventos aislados del mismo tipo · correlación normalizada máxima ${worst.toFixed(3)} (${worstPair})`);
    check(worst < 0.98, "ninguna pulsación se repite (correlación máxima < 0,98 en los primeros 10 ms)", `hay pulsaciones casi idénticas (correlación ${worst.toFixed(3)} en ${worstPair})`);
  }
}

// ───────────────────────────────────────────────────────────── (c) picos, RMS, clipping, empalmes, ambiente y pausa

console.log("\n(c) Picos, RMS, clipping, DC, empalmes, ambiente y pausa");
const peaksDb = {} as Record<StemName, number>;
for (const name of STEMS) {
  const w = wavs[name];
  const p = peakOf(w);
  peaksDb[name] = dbf(p);
  const rms = rmsOf(w);
  let dc = 0;
  for (let i = 0; i < w.n; i++) dc += w.l[i] + w.r[i];
  dc /= 2 * w.n;
  console.log(`  ${name.padEnd(9)} pico ${dbf(p).toFixed(2).padStart(7)} dBFS · RMS ${dbf(rms).toFixed(2).padStart(7)} dBFS · cresta ${(dbf(p) - dbf(rms)).toFixed(1).padStart(5)} dB · DC ${(dc * 1e5).toFixed(2)}e-5 · muestras en cero ${((w.zeros / w.n) * 100).toFixed(1)} % · extremos ${w.clipped}`);
  check(p < 1 && w.clipped === 0, `${name}: sin clipping (pico < 0 dBFS)`, `${name}: clipping o pico ≥ 0 dBFS`);
  check(Math.abs(dc) < 1e-3, `${name}: sin offset de continua`, `${name}: DC ${dc}`);
  // compatibilidad mono (parlante de celular): la suma (L+R)/2 no pierde más de 1,5 dB (3 dB el aire de la sala) respecto del RMS estéreo
  {
    let sm = 0;
    let ss = 0;
    for (let i = 0; i < w.n; i++) {
      const m = (w.l[i] + w.r[i]) * 0.5;
      sm += m * m;
      ss += (w.l[i] * w.l[i] + w.r[i] * w.r[i]) * 0.5;
    }
    const loss = 10 * Math.log10((sm + 1e-20) / (ss + 1e-20));
    const maxLoss = name === "ambiente" ? 3 : 1.5; // el aire de la sala es ruido parcialmente descorrelacionado entre canales (≤ 3 dB es lo esperable; una fase opuesta daría mucho más)
    check(-loss < maxLoss, `${name}: compatible con mono (la suma L+R pierde ${fmt(-loss, 2)} dB, < ${maxLoss})`, `${name}: pierde ${fmt(-loss, 2)} dB al sumar a mono (fases opuestas)`);
  }
}
{
  // límites objetivo por stem (pico)
  const wantRange: Record<StemName, [number, number]> = { ambiente: [-28, -14], teclado: [-11, -5.5], musica: [-10, -7.5], "sfx-hilo": [-16, -9] };
  for (const name of STEMS) {
    const [lo, hi] = wantRange[name];
    check(peaksDb[name] >= lo && peaksDb[name] <= hi, `${name}: pico ${peaksDb[name].toFixed(1)} dBFS dentro de [${lo}, ${hi}]`, `${name}: pico ${peaksDb[name].toFixed(1)} dBFS fuera de [${lo}, ${hi}]`);
  }

  // AMBIENTE: audible desde el fotograma 0 (> −40 dBFS RMS) y estable; «el aire se abre» en la pausa de la duda (apenas) y se aquieta con la respuesta
  const amb = wavs.ambiente;
  const total = dbf(rmsOf(amb));
  const first = dbf(rmsOf(amb, 0, SR)); // primer segundo
  const preMusic = dbf(rmsOf(amb, 0, fSample(PAUSE_FROM)));
  let minWin = Infinity;
  let maxWin = -Infinity;
  for (let f = 0; f + 30 <= TOTAL_FRAMES - 30; f += 15) {
    const v = dbf(rmsOf(amb, f * SPF, (f + 30) * SPF));
    minWin = Math.min(minWin, v);
    maxWin = Math.max(maxWin, v);
  }
  console.log(`  ambiente: RMS total ${fmt(total, 2)} · primer segundo ${fmt(first, 2)} · f0–f${PAUSE_FROM} ${fmt(preMusic, 2)} dBFS · ventanas de 1 s: mín ${fmt(minWin, 2)} … máx ${fmt(maxWin, 2)} dBFS`);
  check(first > -40 && preMusic > -40, `ambiente: audible desde el fotograma 0 (RMS del 1.er segundo ${fmt(first, 1)} dBFS y de f0–f${PAUSE_FROM} ${fmt(preMusic, 1)} dBFS > −40 dBFS)`, `ambiente: demasiado bajo al inicio (${fmt(first, 1)} dBFS)`);
  check(minWin > -40, `ambiente: ninguna ventana de 1 s baja de −40 dBFS (mín ${fmt(minWin, 1)}), sin zonas «muertas»`, `ambiente: ventana de 1 s en ${fmt(minWin, 1)} dBFS`);
  check(total < -29 && maxWin < -29, `ambiente: discreto (RMS ${fmt(total, 1)} dBFS, ventana máx ${fmt(maxWin, 1)} dBFS, siempre < −29)`, "ambiente: demasiado fuerte");
  const specStats = (fa: number, fb: number): { lvl: number; mid: number; cen: number } => {
    const ma = monoOf(amb);
    const P = welch(ma, fSample(fa), fSample(fb), 4096);
    let n = 0;
    let d = 0;
    for (let k = 1; k < P.length; k++) {
      const f = (k * SR) / 4096;
      if (f > 6000) break;
      n += f * P[k];
      d += P[k];
    }
    return { lvl: dbf(rmsOf(amb, fSample(fa), fSample(fb))), mid: 10 * Math.log10(bandMs(P, 1000, 3000, 4096)), cen: n / d };
  };
  // apertura en la duda: f560–f612 (antes) vs f670–f702 (aire abierto)
  const A = specStats(560, PAUSE_FROM);
  const B = specStats(670, PAUSE_TO);
  // calma bajo la respuesta: f850–f892 (aire aquietado)
  const C = specStats(REPLY + 70, REPLY + 112);
  console.log(`  ambiente · «el aire se abre» en la duda: f560–f${PAUSE_FROM} ${fmt(A.lvl, 2)} dBFS → f670–f${PAUSE_TO} ${fmt(B.lvl, 2)} dBFS (Δ ${fmt(B.lvl - A.lvl, 2)} dB) · banda 1–3 kHz ${fmt(A.mid)} → ${fmt(B.mid)} dB (Δ ${fmt(B.mid - A.mid)}) · centroide ≤ 6 kHz ${fmt(A.cen, 0)} → ${fmt(B.cen, 0)} Hz`);
  console.log(`  ambiente · calma bajo la respuesta: f${REPLY + 70}–f${REPLY + 112} ${fmt(C.lvl, 2)} dBFS (Δ ${fmt(C.lvl - A.lvl, 2)} dB vs antes de la duda, ${fmt(C.lvl - B.lvl, 2)} vs la duda) · banda 1–3 kHz ${fmt(C.mid)} dB · centroide ${fmt(C.cen, 0)} Hz`);
  check(B.lvl - A.lvl >= 0.8 && B.lvl - A.lvl <= 3.5, `ambiente: se abre apenas en la duda (Δ ${fmt(B.lvl - A.lvl, 2)} dB, entre +0,8 y +3,5)`, `ambiente: la apertura en la duda (${fmt(B.lvl - A.lvl, 2)} dB) está fuera de +0,8…+3,5 dB`);
  check(B.cen > A.cen * 1.05, `ambiente: el aire se vuelve algo más abierto en la duda (centroide ${fmt(A.cen, 0)} → ${fmt(B.cen, 0)} Hz)`, "ambiente: la duda no cambia el color del aire");
  check(C.lvl < A.lvl - 0.4 && C.cen < A.cen && C.mid < A.mid, `ambiente: calma bajo la respuesta (nivel ${fmt(C.lvl - A.lvl, 2)} dB, centroide ${fmt(C.cen, 0)} Hz y banda 1–3 kHz más bajos que antes de la duda)`, "ambiente: no hay calma bajo la respuesta");

  // MÚSICA y SFX: silencio digital hasta musicIn / hasta ENVIAR (y por tanto durante la pausa de la duda)
  const musicInSample = fSample(SFX_CUES.musicIn);
  {
    const nz = firstNonZero(wavs.musica, 0, N);
    check(nz >= musicInSample, `musica: silencio digital hasta el fotograma ${SFX_CUES.musicIn} (primera muestra no nula: ${nz} ≥ ${musicInSample}) — entra con la respuesta «Estoy acá. Te escucho.»`, `musica suena antes del fotograma ${SFX_CUES.musicIn} (muestra ${nz})`);
    check(nz - musicInSample <= Math.round(0.1 * SR), `musica: arranca en el fotograma ${SFX_CUES.musicIn} (primera muestra no nula a ${(((nz - musicInSample) / SR) * 1000).toFixed(1)} ms del hito)`, `musica: arranca ${(((nz - musicInSample) / SR) * 1000).toFixed(0)} ms después del fotograma ${SFX_CUES.musicIn}`);
    const e1 = dbf(rmsOf(wavs.musica, musicInSample, musicInSample + fSample(15) - fSample(0)));
    const e2 = dbf(rmsOf(wavs.musica, fSample(REPLY + 45), fSample(REPLY + 60)));
    console.log(`  musica · entrada: RMS f${REPLY}–f${REPLY + 15} ${fmt(e1)} dBFS → f${REPLY + 45}–f${REPLY + 60} ${fmt(e2)} dBFS (swell de entrada; Reel.tsx suma su rampa de 75 f)`);
    check(e1 > -70 && e2 > e1 + 6 && e2 > -32, "musica: entra con un swell suave y ya suena durante la sostenida de la respuesta (≥ −32 dBFS a 1,5 s)", "musica: la entrada no es progresiva o no se oye durante la respuesta");
  }
  {
    const nz = firstNonZero(wavs["sfx-hilo"], 0, N);
    check(nz >= fSample(SFX_CUES.sendPress), `sfx-hilo: silencio digital hasta ENVIAR (f${SFX_CUES.sendPress}; primera muestra no nula ${nz} ≥ ${fSample(SFX_CUES.sendPress)}) — la duda (f${PAUSE_FROM}–f${PAUSE_TO}) queda solo con aire`, `sfx-hilo suena antes de ENVIAR (muestra ${nz}, f${(nz / SPF).toFixed(1)})`);
  }
  // finales a cero (sin corte seco)
  for (const name of STEMS) {
    const w = wavs[name];
    const endPeak = peakOf(w, N - 48, N);
    check(endPeak < 1e-3, `${name}: termina en silencio (últimos 1 ms: pico ${dbf(endPeak).toFixed(1)} dBFS)`, `${name}: corte seco al final (pico ${dbf(endPeak).toFixed(1)} dBFS en el último ms)`);
  }
  // cierre de la música: resolución calma (compás 8 desde f1525) que se desvanece sin corte hasta f1590
  const mus = wavs.musica;
  const seg = (f0: number, f1: number): number => dbf(rmsOf(mus, fSample(f0), fSample(f1)));
  const rf = 1545; // la resolución (Re mayor 9, f1525) ya asentó: desde acá el nivel solo baja
  const tr = [seg(rf - 20, rf), seg(rf, rf + 15), seg(rf + 15, rf + 30), seg(rf + 30, rf + 45)];
  console.log(`  música · cierre (RMS por tramo): f${rf - 20}–${rf} ${fmt(tr[0])} · f${rf}–${rf + 15} ${fmt(tr[1])} · f${rf + 15}–${rf + 30} ${fmt(tr[2])} · f${rf + 30}–${TOTAL_FRAMES} ${fmt(tr[3])} dBFS (la resolución entra en f1525; Reel.tsx suma su rampa lineal desde f${SFX_CUES.musicOutFrom})`);
  check(tr[0] > tr[1] && tr[1] > tr[2] && tr[2] > tr[3], `música: desde la resolución asentada (f${rf}) se desvanece de forma monótona hasta f${TOTAL_FRAMES} (sin corte seco)`, "música: el cierre no decae de forma monótona");
  check(tr[0] > -30 && tr[1] > -34, "música: la resolución final suena (no se apaga antes de tiempo)", "música: la resolución final se apaga antes de tiempo");
}

/** Detector de clics por 2.ª diferencia: muestras aisladas muy por encima del entorno (RMS local ±20 ms). */
function clickScan(name: StemName, ratioMax: number): void {
  const w = wavs[name];
  const d2 = new Float32Array(N);
  for (let i = 2; i < N; i++) {
    const x = (w.l[i] + w.r[i]) * 0.5;
    const x1 = (w.l[i - 1] + w.r[i - 1]) * 0.5;
    const x2 = (w.l[i - 2] + w.r[i - 2]) * 0.5;
    d2[i] = x - 2 * x1 + x2;
  }
  const win = Math.round(0.02 * SR);
  const pre = new Float64Array(N + 1);
  for (let i = 0; i < N; i++) pre[i + 1] = pre[i] + d2[i] * d2[i];
  const flagged: { t: number; ratio: number }[] = [];
  let worst = 0;
  for (let i = win; i < N - win; i += 1) {
    const a = Math.abs(d2[i]);
    if (a < 1e-4) continue; // < −80 dBFS: irrelevante
    const rms = Math.sqrt((pre[i + win] - pre[i - win]) / (2 * win));
    const ratio = a / Math.max(rms, 1e-9);
    if (ratio > worst) worst = ratio;
    if (ratio > ratioMax) flagged.push({ t: i / SR, ratio });
  }
  // agrupa vecinos (< 5 ms)
  const groups: { t: number; ratio: number }[] = [];
  for (const f of flagged) {
    const g = groups[groups.length - 1];
    if (g && f.t - g.t < 0.005) g.ratio = Math.max(g.ratio, f.ratio);
    else groups.push({ ...f });
  }
  check(groups.length === 0, `${name}: sin clics ni discontinuidades (2.ª diferencia máx = ${worst.toFixed(1)}× el RMS local; umbral ${ratioMax}×)`, `${name}: ${groups.length} posibles clics: ${groups.slice(0, 6).map((g) => `${g.t.toFixed(3)} s (${g.ratio.toFixed(0)}×)`).join(", ")}`);
}
clickScan("ambiente", 14);
clickScan("musica", 14);
clickScan("sfx-hilo", 14);

// ───────────────────────────────────────────────────────────── (d) alineación de hitos de sfx

{
  console.log("\n(d) sfx-hilo · alineación con SFX_CUES");
  console.log("    detector: en la banda propia de cada hito (pasa-banda), primer instante con la envolvente ≥ 2× (swells: 1,3×) lo que ya sonaba y ≥ 3 % (−30 dB) del máximo local; latencia respecto del fotograma del hito");
  const w = wavs["sfx-hilo"];
  const mono = monoOf(w);
  type Cue = { label: string; frame: number; fc: number | null; q: number; search: number; maxMs: number; kind: string; rel?: number; rise90?: [number, number]; rise10?: [number, number] };
  const cues: Cue[] = [
    { label: "sendPress", frame: SFX_CUES.sendPress, fc: null, q: 1, search: 0.3, maxMs: 10, kind: "clic suave de ENVIAR" },
    { label: "sendFly", frame: SFX_CUES.sendFly, fc: null, q: 1, search: 0.5, maxMs: 120, kind: "swoosh corto muy suave" },
    { label: "indicator", frame: SFX_CUES.indicator, fc: 880, q: 6, search: 0.06, maxMs: 15, kind: "pop + tics de los puntos" },
    { label: "reply", frame: SFX_CUES.reply, fc: 740, q: 6, search: 0.3, maxMs: 10, kind: "gota cálida Fa#5" },
    { label: "transition", frame: SFX_CUES.transition, fc: 370, q: 10, search: 2.0, maxMs: 300, kind: "swell (Fa#4-Si4-Re5)", rel: 1.3, rise90: [0.5, 1.8], rise10: [0.05, 0.5] },
    { label: "phraseOne", frame: SFX_CUES.phraseOne, fc: 147, q: 4, search: 0.6, maxMs: 40, kind: "tono grave cálido Re3" },
    { label: "phraseTwo", frame: SFX_CUES.phraseTwo, fc: 185, q: 4, search: 0.6, maxMs: 40, kind: "tono grave cálido Fa#3" },
    { label: "reveal", frame: SFX_CUES.reveal, fc: null, q: 1, search: 1.0, maxMs: 150, kind: "soplo suave" },
    { label: "companionText", frame: SFX_CUES.companionText, fc: 988, q: 6, search: 0.25, maxMs: 20, kind: "pip suave Si5" },
    { label: "friendArrive", frame: SFX_CUES.friendArrive, fc: 95, q: 2.5, search: 0.3, maxMs: 25, kind: "silla se detiene (madera)" },
    { label: "gesture", frame: SFX_CUES.gesture, fc: 659, q: 6, search: 0.12, maxMs: 25, kind: "cuerda suave Mi5→La5" },
    { label: "signatureOne", frame: SFX_CUES.signatureOne, fc: 370, q: 5, search: 0.6, maxMs: 40, kind: "quinta cálida Fa#4+Do#5" },
    { label: "logoReveal", frame: SFX_CUES.logoReveal, fc: 880, q: 6, search: 0.09, maxMs: 25, kind: "carillón La mayor" },
    { label: "signatureTwo", frame: SFX_CUES.signatureTwo, fc: 587, q: 6, search: 0.25, maxMs: 20, kind: "pip suave Re5" },
    { label: "finalMessage", frame: SFX_CUES.finalMessage, fc: 587, q: 5, search: 0.6, maxMs: 40, kind: "tonos Re5+La5" },
    { label: "finalDate", frame: SFX_CUES.finalDate, fc: 988, q: 6, search: 0.25, maxMs: 20, kind: "pip suave Si5" },
    { label: "cierre", frame: SFX_CUES.musicIn + 7 * 105, fc: 880, q: 6, search: 0.2, maxMs: 25, kind: "eco del carillón La5+Mi6" },
  ];
  /** Máximo móvil de |x| en `win` muestras (envolvente de pico sin rizado). */
  const peakEnv = (x: Float32Array, win: number): Float32Array => {
    const out = new Float32Array(x.length);
    const dq = new Int32Array(x.length);
    let head = 0;
    let tail = 0;
    for (let i = 0; i < x.length; i++) {
      const v = Math.abs(x[i]);
      while (tail > head && Math.abs(x[dq[tail - 1]]) <= v) tail--;
      dq[tail++] = i;
      while (dq[head] <= i - win) head++;
      out[i] = Math.abs(x[dq[head]]);
    }
    return out;
  };
  const bandPeaks: Record<string, number> = {};
  for (const c of cues) {
    const x = new Float32Array(N);
    if (c.fc === null) x.set(mono);
    else {
      const f = bq("bp", c.fc, c.q);
      for (let i = 0; i < N; i++) x[i] = f(mono[i]);
    }
    const win = Math.max(Math.round(0.001 * SR), c.fc === null ? 0 : Math.round((2 / c.fc) * SR));
    const env = peakEnv(x, win);
    const s0 = fSample(c.frame);
    let P = 0;
    for (let i = s0; i < Math.min(N, s0 + Math.round(c.search * SR)); i++) P = Math.max(P, env[i]);
    // piso previo: lo más alto que estaba sonando en esta banda entre 6 fotogramas y 1 antes del hito (colas de hitos anteriores)
    let floor = 0;
    for (let i = s0 - 6 * SPF; i < s0 - SPF; i++) floor = Math.max(floor, env[i]);
    // el hito «empieza» cuando la banda supera 2× el piso previo Y el 3 % (−30 dB) del máximo local de la ventana de búsqueda
    const thr = Math.max((c.rel ?? 2) * floor, P * 10 ** (-30 / 20), 10 ** (-80 / 20));
    let on = -1;
    for (let i = s0 - 2 * SPF; i < Math.min(N, s0 + Math.round(c.search * SR)); i++) {
      if (env[i] >= thr) {
        on = i;
        break;
      }
    }
    const ms = on < 0 ? NaN : ((on - s0) / SR) * 1000;
    const bandPk = dbf(P);
    bandPeaks[c.label] = bandPk;
    const broadPk = peakOf(w, s0, Math.min(N, s0 + Math.round(Math.max(c.search, 0.3) * SR)));
    const contrast = dbf(P) - dbf(floor);
    const rise = P > 2 * floor; // el hito emerge sobre lo que ya sonaba (≥ 6 dB)
    console.log(`    ${c.label.padEnd(14)} f${String(c.frame).padStart(4)} (${(c.frame / FPS).toFixed(2)} s)  ${c.kind.padEnd(28)} banda ${c.fc === null ? "ancha" : `${c.fc} Hz`.padEnd(8)}  inicio ${Number.isNaN(ms) ? "—" : `${ms >= 0 ? "+" : ""}${ms.toFixed(1)} ms`.padStart(8)}  pico banda ${fmt(bandPk).padStart(6)} dBFS (hito completo ${fmt(dbf(broadPk)).padStart(6)}) contraste ${fmt(contrast)} dB${rise ? "" : "  (poco contraste con lo previo)"}`);
    if (c.rise90) {
      // swell de ataque lento: el «inicio» por umbral es tardío por diseño; se verifica cuándo alcanza el 10 % (nace en el hito) y el 90 % de su máximo en la banda
      let t90 = NaN;
      let t10 = NaN;
      for (let i = s0 - SPF; i < Math.min(N, s0 + Math.round(c.search * SR)); i++) {
        if (Number.isNaN(t10) && env[i] >= 0.1 * P) t10 = (i - s0) / SR;
        if (env[i] >= 0.9 * P) {
          t90 = (i - s0) / SR;
          break;
        }
      }
      const r10 = c.rise10 ?? [-0.05, 0.5];
      console.log(`      ${"".padEnd(14)} swell: 10 % de su máximo a ${fmt(t10, 2)} s y 90 % a ${fmt(t90, 2)} s del hito (esperado ${r10[0]}–${r10[1]} s y ${c.rise90[0]}–${c.rise90[1]} s; ataque de diseño 0,95 s + cola de reverb)`);
      check(!Number.isNaN(t90) && t90 >= c.rise90[0] && t90 <= c.rise90[1] && !Number.isNaN(t10) && t10 >= r10[0] && t10 <= r10[1] && rise, `sfx ${c.label}: el swell nace en el fotograma ${c.frame} (10 % a ${fmt(t10, 2)} s y 90 % del máximo a ${fmt(t90, 2)} s, esperado ${r10[0]}–${r10[1]} y ${c.rise90[0]}–${c.rise90[1]} s)`, `sfx ${c.label}: el swell no está alineado con el fotograma ${c.frame} (10 % a ${fmt(t10, 2)} s y 90 % a ${fmt(t90, 2)} s; esperado ${r10[0]}–${r10[1]} y ${c.rise90[0]}–${c.rise90[1]} s)`);
    } else {
      check(!Number.isNaN(ms) && ms >= -1 && ms <= c.maxMs && rise, `sfx ${c.label}: arranca en el fotograma ${c.frame} (${fmt(ms)} ms ≤ ${c.maxMs} ms)`, `sfx ${c.label}: no se encuentra el hito en el fotograma ${c.frame} (${fmt(ms)} ms, límite ${c.maxMs}${rise ? "" : "; sin contraste con lo previo"})`);
    }
  }
  // silla que rueda (casi imperceptible): banda 150–700 Hz entre la entrada de la amiga y su llegada
  {
    const lo = bq("hp", 150, 0.707);
    const hi = bq("lp", 700, 0.707);
    let pk = 0;
    const a0 = fSample(COMPANION_TIMING.friendEnterFrom);
    const b0 = fSample(SFX_CUES.friendArrive);
    for (let i = a0; i < b0; i++) pk = Math.max(pk, Math.abs(hi(lo(mono[i]))));
    // referencia: antes de la entrada de la amiga nada suena en esa banda (cola del soplo y del pip a < −45 dBFS)
    console.log(`    silla que rueda f${COMPANION_TIMING.friendEnterFrom}–f${SFX_CUES.friendArrive}: pico en 150–700 Hz ${fmt(dbf(pk))} dBFS (diseño −35, sutil: < −30)`);
    check(dbf(pk) < -30 && dbf(pk) > -50, `la silla que rueda es muy leve y casi imperceptible (pico ${fmt(dbf(pk))} dBFS en 150–700 Hz, entre −50 y −30)`, `la silla que rueda está fuera de rango (${fmt(dbf(pk))} dBFS)`);
  }
  // acentos sutiles (nivel en la banda propia de cada hito): pips, sentarse/silla y tics < −22 dBFS; tics < −30 dBFS; la respuesta es el más presente
  check(bandPeaks["companionText"] < -22 && bandPeaks["signatureTwo"] < -22 && bandPeaks["finalDate"] < -22 && bandPeaks["friendArrive"] < -28 && bandPeaks["indicator"] < -28, `acentos muy sutiles: texto ${fmt(bandPeaks["companionText"])} · firma 2 ${fmt(bandPeaks["signatureTwo"])} · fecha ${fmt(bandPeaks["finalDate"])} · silla ${fmt(bandPeaks["friendArrive"])} · indicador ${fmt(bandPeaks["indicator"])} dBFS`, "algún acento sutil (pips, silla, indicador) está demasiado fuerte");
  check(bandPeaks["reply"] <= -14 && bandPeaks["reply"] >= -22, `la llegada de la respuesta es una nota cálida y breve, discreta (${fmt(bandPeaks["reply"])} dBFS en su banda; entre −22 y −14)`, `la gota de la respuesta está fuera de nivel (${fmt(bandPeaks["reply"])} dBFS)`);
  // tics de los puntos «Amiga escribe»: 5 rebotes (3 + 2) con el período de THREAD_FX.dotsPeriod (21 f)
  {
    const ticks: number[] = [];
    for (let cycle = 0; cycle < 2; cycle++)
      for (let i = 0; i < 3; i++) {
        const at = SFX_CUES.indicator + ((Math.PI / 2 + 0.95 * i) * 21) / (2 * Math.PI) + cycle * 21;
        if (at <= SFX_CUES.reply - 3) ticks.push(at);
      }
    let worst = 0;
    const fcs = [1175, 1319, 1480];
    let pkAll = 0;
    ticks.forEach((at, idx) => {
      const f = bq("bp", fcs[idx % 3], 6);
      const s0 = Math.round((at / FPS) * SR);
      let pk = 0;
      let pos = 0;
      for (let i = s0 - Math.round(0.01 * SR); i < s0 + Math.round(0.04 * SR); i++) {
        const v = Math.abs(f(mono[i]));
        if (v > pk) {
          pk = v;
          pos = i;
        }
      }
      worst = Math.max(worst, Math.abs(((pos - s0) / SR) * 1000 - 3));
      pkAll = Math.max(pkAll, pk);
    });
    console.log(`    tics de los puntos: ${ticks.length} tics en f${ticks.map((t) => t.toFixed(1)).join(" · f")} (pico en banda ${fmt(dbf(pkAll))} dBFS)`);
    check(ticks.length === 5 && dbf(pkAll) < -30, `tics suaves de los puntos: ${ticks.length} (uno por rebote, ${fmt(dbf(pkAll))} dBFS < −30), el último rebote antes de la respuesta se omite`, "los tics de los puntos no cumplen (cantidad o nivel)");
  }
}

// ───────────────────────────────────────────────────────────── (e) música: cambios armónicos y espacio para la voz futura

console.log("\n(e) Música · cambios armónicos cada 105 f desde musicIn y espacio para la voz futura (banda 300–3000 Hz contenida)");
{
  const mono = monoOf(wavs.musica);
  const BAR = 105;
  const barFrames = Array.from({ length: 8 }, (_, i) => REPLY + i * BAR);

  // — cambios armónicos: novedad del croma grave (90–260 Hz: bajo y voces graves del pad) entre las ventanas de ±0,3 s
  const NF = 32768;
  const win = new Float64Array(NF);
  for (let i = 0; i < NF; i++) win[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / NF);
  const chromaAt = (center: number): Float64Array => {
    const re = new Float64Array(NF);
    const im = new Float64Array(NF);
    const s0 = center - NF / 2;
    for (let i = 0; i < NF; i++) re[i] = (s0 + i >= 0 && s0 + i < N ? mono[s0 + i] : 0) * win[i];
    fft(re, im);
    const c = new Float64Array(12);
    for (let k = 1; k < NF / 2; k++) {
      const f = (k * SR) / NF;
      if (f < 90) continue;
      if (f > 260) break;
      const pc = ((Math.round(12 * Math.log2(f / 440) + 69) % 12) + 12) % 12;
      c[pc] += Math.sqrt(re[k] * re[k] + im[k] * im[k]);
    }
    return c;
  };
  const cosSim = (a: Float64Array, b: Float64Array): number => {
    let ab = 0;
    let aa = 0;
    let bb = 0;
    for (let i = 0; i < 12; i++) {
      ab += a[i] * b[i];
      aa += a[i] * a[i];
      bb += b[i] * b[i];
    }
    return aa > 0 && bb > 0 ? ab / Math.sqrt(aa * bb) : 1;
  };
  const f0 = REPLY + 40;
  const f1 = TOTAL_FRAMES - 40;
  const half = Math.round(0.3 * FPS); // 9 f
  const chroma = new Map<number, Float64Array>();
  const ch = (f: number): Float64Array => {
    let c = chroma.get(f);
    if (!c) {
      c = chromaAt(fSample(f));
      chroma.set(f, c);
    }
    return c;
  };
  const nov: number[] = [];
  for (let f = f0; f <= f1; f++) nov.push(1 - cosSim(ch(f - half), ch(f + half)));
  const novAt = (f: number): number => nov[f - f0];
  const nearBoundary = (f: number): boolean => barFrames.some((c) => f >= c - 22 && f <= c + 30);
  const steady = nov.filter((_, i) => !nearBoundary(f0 + i)).sort((a, b) => a - b);
  const steadyMed = steady.length ? steady[Math.floor(steady.length / 2)] : 0;
  let allOk = true;
  const rowsTxt: string[] = [];
  for (let i = 1; i < barFrames.length; i++) {
    const c = barFrames[i];
    // un cambio de acorde da una meseta de novedad de ≈ 2·½ ventana de ancho (±9 f): su centro es el instante del cambio
    let best = c - 12;
    for (let f = c - 25; f <= c + 25; f++) if (f >= f0 && f <= f1 && novAt(f) > novAt(best)) best = f;
    const thr = 0.6 * novAt(best);
    let lo = best;
    let hi = best;
    while (lo - 1 >= f0 && novAt(lo - 1) >= thr) lo--;
    while (hi + 1 <= f1 && novAt(hi + 1) >= thr) hi++;
    const center = (lo + hi) / 2;
    const off = center - c;
    const ratio = novAt(best) / Math.max(steadyMed, 1e-4);
    const ok2 = off >= -8 && off <= 8 && ratio >= 2; // el pad anticipa ≈0,4 s (fundido cruzado); bajo y piano caen exactos
    if (!ok2) allOk = false;
    rowsTxt.push(`f${c}: cambio centrado en ${off >= 0 ? "+" : ""}${off.toFixed(1)} f (meseta f${lo}–f${hi}; pico ${fmt(novAt(best), 3)} = ${fmt(ratio, 1)}× la mediana estable)${ok2 ? "" : "  ✗"}`);
  }
  console.log(`  novedad del croma grave (90–260 Hz, ventanas ±${half} f); mediana dentro de los compases ${fmt(steadyMed, 4)}:`);
  for (const r of rowsTxt) console.log(`    ${r}`);
  check(allOk, `los 7 cambios armónicos caen en 895, 1000, 1105, 1210, 1315, 1420, 1525 (centro de la meseta de novedad a ±8 f del compás —el pad anticipa ≈0,4 s— y pico ≥ 2× la mediana estable)`, "algún cambio armónico no coincide con su compás de 105 f (ver la tabla)");

  // — raíz del bajo: cruce entre la raíz saliente y la entrante en cada compás (filtros angostos en las fundamentales del bajo)
  {
    const HZ: Record<string, number> = { D: 146.83, B: 123.47, G: 98.0, A: 110.0, E: 164.81 };
    const SEQ = ["D", "B", "G", "A", "D", "G", "E", "D"];
    const env: Record<string, Float32Array> = {};
    for (const k of Object.keys(HZ)) {
      const f = bq("bp", HZ[k], 12);
      const e = new Float32Array(N);
      let sm = 0;
      const a = 1 - Math.exp(-1 / (0.02 * SR));
      for (let i = 0; i < N; i++) {
        sm += a * (Math.abs(f(mono[i])) - sm);
        e[i] = sm;
      }
      env[k] = e;
    }
    // raíz dominante en el centro de cada compás (entre +40 y +90 f del inicio)
    let rootsOk = true;
    const got: string[] = [];
    for (let i = 0; i < barFrames.length; i++) {
      const a0 = fSample(barFrames[i] + (i === barFrames.length - 1 ? 8 : 40));
      const b0 = fSample(barFrames[i] + (i === barFrames.length - 1 ? 30 : 90));
      let top = "";
      let topV = -1;
      for (const k of Object.keys(HZ)) {
        let m = 0;
        for (let q = a0; q < b0; q += 16) m += env[k][q];
        if (m > topV) {
          topV = m;
          top = k;
        }
      }
      got.push(top);
      if (top !== SEQ[i]) rootsOk = false;
    }
    console.log(`  raíz grave dominante por compás: ${got.join(" – ")} (esperada ${SEQ.join(" – ")})`);
    check(rootsOk, `la raíz del bajo de cada compás es la esperada (${SEQ.join("–")})`, "alguna raíz del bajo no es la esperada");
    const lines: string[] = [];
    let crossOk = true;
    for (let i = 1; i < barFrames.length; i++) {
      const c = barFrames[i];
      const o = env[SEQ[i - 1]];
      const n = env[SEQ[i]];
      let x = NaN;
      for (let f = c - 10; f <= c + 30; f++) {
        const q = fSample(f);
        if (n[q] > o[q] && n[q + 800] > o[q + 800] && n[q + 1600] > o[q + 1600]) {
          x = f - c;
          break;
        }
      }
      const okc = !Number.isNaN(x) && x >= -3 && x <= 14;
      if (!okc) crossOk = false;
      lines.push(`${SEQ[i - 1]}→${SEQ[i]} en f${c}: cruce ${Number.isNaN(x) ? "—" : `${x >= 0 ? "+" : ""}${x}`} f${okc ? "" : " ✗"}`);
    }
    console.log(`  cruce de raíces del bajo (esperado entre −3 y +14 f; fundido de 0,3 s del bajo nuevo): ${lines.join(" · ")}`);
    check(crossOk, "el bajo cambia de raíz en cada compás (cruce entre −3 y +14 f del inicio del compás: 895, 1000, 1105, 1210, 1315, 1420, 1525)", "el bajo no cambia de raíz en el compás esperado");
  }

  // — espacio para la voz futura: texto en pantalla de f900 (transición + frases) a f1500 (fecha + cierre)
  const a = fSample(SFX_CUES.transition);
  const b = fSample(SFX_CUES.musicOutFrom - 30);
  const P = welch(mono, a, b);
  const bands: [string, number, number][] = [
    ["20–100", 20, 100],
    ["100–300", 100, 300],
    ["300–3000", 300, 3000],
    ["3000–8000", 3000, 8000],
  ];
  const tot = bandMs(P, 20, 20000);
  console.log(`  f${SFX_CUES.transition}–f${SFX_CUES.musicOutFrom - 30} (frases, firma y cierre), música sola:  ${bands.map(([n, lo, hi]) => `${n} Hz ${fmt(10 * Math.log10(bandMs(P, lo, hi)))} dB (${fmt((100 * bandMs(P, lo, hi)) / tot, 0)} %)`).join(" · ")}  · total ${fmt(10 * Math.log10(tot))} dB`);
  const share = bandMs(P, 300, 3000) / tot;
  const inBandDb = 10 * Math.log10(bandMs(P, 300, 3000));
  check(share <= 0.3, `la banda de voz 300–3000 Hz es el ${fmt(share * 100, 0)} % de la energía de la música (≤ 30 %; v1: 38 %)`, `la banda 300–3000 Hz concentra el ${fmt(share * 100, 0)} % de la música (> 30 %)`);
  check(inBandDb <= -25, `nivel de la música en 300–3000 Hz: ${fmt(inBandDb)} dBFS RMS (stem solo; ≤ −25); en la mezcla (×0,9): ${fmt(inBandDb + dbf(0.9))} dBFS → ≥ ${fmt(-20 - (inBandDb + dbf(0.9)), 0)} dB bajo una voz a −20 dBFS RMS`, `la música aporta ${fmt(inBandDb)} dBFS en 300–3000 Hz (> −25)`);
  // dinámica: la música no se mueve más de 3 dB entre compases completos (sin picos de nivel que tapen una voz)
  const lv: number[] = [];
  for (let i = 1; i < 7; i++) lv.push(dbf(rmsOf(wavs.musica, fSample(barFrames[i] + 20), fSample(barFrames[i] + BAR))));
  console.log(`  música · RMS por compás (2.º al 7.º): ${lv.map((x) => fmt(x)).join(" · ")} dBFS (rango ${fmt(Math.max(...lv) - Math.min(...lv))} dB)`);
  check(Math.max(...lv) - Math.min(...lv) <= 3, "música estable entre compases (RMS dentro de 3 dB): sin picos de nivel que tapen la voz", "música inestable entre compases");
}

// ───────────────────────────────────────────────────────────── (f) mezcla simulada

console.log("\n(f) Mezcla simulada (volúmenes de src/Reel.tsx) + sonoridad (ffmpeg ebur128)");

type Curve = (frame: number) => number;
type Volumes = Record<StemName, Curve>;

/** interpolate() de Remotion con extrapolación «clamp» (suficiente para leer las curvas de Reel.tsx). */
function interpolateClamp(frame: number, xs: number[], ys: number[]): number {
  if (frame <= xs[0]) return ys[0];
  for (let i = 1; i < xs.length; i++) if (frame <= xs[i]) return ys[i - 1] + ((ys[i] - ys[i - 1]) * (frame - xs[i - 1])) / (xs[i] - xs[i - 1]);
  return ys[ys.length - 1];
}

/** Copia de respaldo de los volúmenes de src/Reel.tsx (si no se puede leer el archivo). */
const lerp = (xs: number[], ys: number[]): Curve => (f) => interpolateClamp(f, xs, ys);
const MI = SFX_CUES.musicIn;
const REEL_FALLBACK: Volumes = {
  ambiente: lerp([0, MI, MI + 60, TOTAL_FRAMES - 45, TOTAL_FRAMES], [0.8, 0.8, 0.5, 0.5, 0]),
  teclado: () => 1,
  musica: lerp([MI, MI + 75, SFX_CUES.musicOutFrom, TOTAL_FRAMES], [0, 0.9, 0.9, 0]),
  "sfx-hilo": () => 1,
};

/** Lee `volume={…}` de cada <Audio name="…"> de Reel.tsx y lo evalúa (interpolate + SFX_CUES + TOTAL_FRAMES). */
function readReelVolumes(): { vol: Volumes; fromFile: boolean; note: string } {
  try {
    const src = readFileSync(REEL_FILE, "utf8");
    const nameOf: Record<string, StemName> = { Ambiente: "ambiente", Teclado: "teclado", "Música": "musica", SFX: "sfx-hilo" };
    const vol = { ...REEL_FALLBACK } as Volumes;
    const found: string[] = [];
    for (const [label, stem] of Object.entries(nameOf)) {
      const at = src.indexOf(`<Audio name="${label}"`);
      if (at < 0) continue;
      const v = src.indexOf("volume={", at);
      const end = src.indexOf("/>", at);
      if (v < 0 || (end >= 0 && v > end)) continue;
      let depth = 0;
      let j = v + "volume=".length;
      const start = j + 1;
      for (; j < src.length; j++) {
        if (src[j] === "{") depth++;
        else if (src[j] === "}") {
          depth--;
          if (depth === 0) break;
        }
      }
      const expr = src.slice(start, j);
      const fn = new Function("frame", "interpolate", "SFX_CUES", "TOTAL_FRAMES", `return (${expr});`) as (f: number, i: typeof interpolateClamp2, s: typeof SFX_CUES, t: number) => number;
      const probe = fn(0, interpolateClamp2, SFX_CUES, TOTAL_FRAMES);
      if (!Number.isFinite(probe)) throw new Error(`volumen no numérico para ${label}`);
      vol[stem] = (f: number) => fn(f, interpolateClamp2, SFX_CUES, TOTAL_FRAMES);
      found.push(label);
    }
    return { vol, fromFile: found.length === 4, note: `leídos de src/Reel.tsx: ${found.join(", ")}${found.length === 4 ? "" : " (el resto: copia de respaldo)"}` };
  } catch (e) {
    return { vol: REEL_FALLBACK, fromFile: false, note: `no se pudo leer src/Reel.tsx (${(e as Error).message}); se usa la copia de respaldo` };
  }
}
function interpolateClamp2(frame: number, xs: number[], ys: number[], _opts?: unknown): number {
  return interpolateClamp(frame, xs, ys);
}

const REEL = readReelVolumes();
console.log(`  volúmenes: ${REEL.note}`);
function mix(vol: Volumes): { l: Float32Array; r: Float32Array } {
  const l = new Float32Array(N);
  const r = new Float32Array(N);
  for (const name of STEMS) {
    const w = wavs[name];
    const v = vol[name];
    for (let i = 0; i < N; i++) {
      const g = v(i / SPF);
      l[i] += w.l[i] * g;
      r[i] += w.r[i] * g;
    }
  }
  return { l, r };
}

function writeFloatWav(path: string, l: Float32Array, r: Float32Array): void {
  const n = l.length;
  const data = Buffer.alloc(n * 8);
  for (let i = 0; i < n; i++) {
    data.writeFloatLE(l[i], i * 8);
    data.writeFloatLE(r[i], i * 8 + 4);
  }
  const h = Buffer.alloc(44);
  h.write("RIFF", 0, "ascii");
  h.writeUInt32LE(36 + data.length, 4);
  h.write("WAVEfmt ", 8, "ascii");
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(3, 20); // IEEE float
  h.writeUInt16LE(2, 22);
  h.writeUInt32LE(SR, 24);
  h.writeUInt32LE(SR * 8, 28);
  h.writeUInt16LE(8, 32);
  h.writeUInt16LE(32, 34);
  h.write("data", 36, "ascii");
  h.writeUInt32LE(data.length, 40);
  writeFileSync(path, Buffer.concat([h, data]));
}

type Loud = { I: number; LRA: number; TP: number };
function ebur128(path: string, pre = ""): Loud {
  const p = run("ffmpeg", ["-hide_banner", "-nostats", "-i", path, "-filter_complex", `${pre}ebur128=peak=true`, "-f", "null", "-"]);
  const t = p.err.slice(p.err.lastIndexOf("Summary:"));
  const grab = (re: RegExp): number => {
    const m = re.exec(t);
    return m ? Number(m[1]) : NaN;
  };
  return { I: grab(/I:\s+(-?[\d.]+|-inf)\s+LUFS/), LRA: grab(/LRA:\s+(-?[\d.]+)\s+LU/), TP: grab(/Peak:\s+(-?[\d.]+|-inf)\s+dBFS/) };
}

console.log("  Sonoridad por stem (stem solo, volumen 1,0):");
for (const name of STEMS) {
  const lo = ebur128(`${AUDIO_DIR}${name}.wav`);
  console.log(`    ${name.padEnd(9)} integrada ${fmt(lo.I).padStart(6)} LUFS · pico real ${fmt(lo.TP).padStart(6)} dBTP`);
}
const sets: [string, string, Volumes][] = [["mezcla-reel", "Reel.tsx actual (ambiente 0,8 desde el f0 → 0,5 con la música → 0 · teclado 1 · música 0→0,9→0 · sfx 1)", REEL.vol]];
const mixResults: { slug: string; label: string; loud: Loud; aacTP: number; peak: number }[] = [];
for (const [slug, label, vol] of sets) {
  const m = mix(vol);
  let peak = 0;
  for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(m.l[i]), Math.abs(m.r[i]));
  const f32 = `${CHECK_DIR}/${slug}.wav`;
  writeFloatWav(f32, m.l, m.r);
  const loud = ebur128(f32);
  // pico tras códec AAC 192 kbps (lo que sale en el MP4)
  const aac = `${CHECK_DIR}/${slug}.m4a`;
  run("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", "-i", f32, "-c:a", "aac", "-b:a", "192k", aac]);
  const dec = `${CHECK_DIR}/${slug}-aac.wav`;
  run("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", "-i", aac, "-c:a", "pcm_f32le", dec]);
  const la = ebur128(dec);
  mixResults.push({ slug, label, loud, aacTP: la.TP, peak });
  console.log(`  ▸ ${label}`);
  // perfil de sonoridad a corto plazo (ventana de 3 s, S) cada 3 s: muestra el contraste arranque ↔ música
  const pr = run("ffmpeg", ["-hide_banner", "-nostats", "-i", f32, "-filter_complex", "ebur128=peak=true", "-f", "null", "-"]);
  const prof: string[] = [];
  const seenT = new Set<number>();
  for (const line of pr.err.split("\n")) {
    const mm = /t:\s+([\d.]+)\s.*?S:\s*(-?[\d.]+|-inf)\s+I:/.exec(line);
    if (!mm) continue;
    const t = Math.round(Number(mm[1]));
    if (t % 3 === 0 && t > 0 && !seenT.has(t)) {
      seenT.add(t);
      prof.push(`${t}s:${mm[2] === "-inf" ? "−∞" : Number(mm[2]).toFixed(0)}`);
    }
  }
  console.log(`      sonoridad a corto plazo (S, LUFS) → ${prof.join("  ")}`);
  console.log(`      pico de muestra ${fmt(dbf(peak), 2)} dBFS · pico real ${fmt(loud.TP, 2)} dBTP (tras AAC: ${fmt(la.TP, 2)}) · sonoridad integrada ${fmt(loud.I, 1)} LUFS · LRA ${fmt(loud.LRA, 1)} LU`);
  // traducción a parlantes de celular (informativo): pasa-altos de 300 Hz (por debajo casi no se reproduce)
  const phone = ebur128(f32, "highpass=f=300:poles=2,");
  console.log(`      parlante de celular (pasa-altos 300 Hz): ${fmt(phone.I, 1)} LUFS integrados (${fmt(phone.I - loud.I, 1)} LU respecto del rango completo)`);
}
for (const r of mixResults) {
  check(r.loud.TP < -1, `${r.slug}: pico real ${fmt(r.loud.TP, 2)} dBTP < −1 dBFS (tras AAC ${fmt(r.aacTP, 2)})`, `${r.slug}: pico real ${fmt(r.loud.TP, 2)} dBTP ≥ −1`);
  check(r.peak < 1, `${r.slug}: pico de muestra ${fmt(dbf(r.peak), 2)} dBFS < 0`, `${r.slug}: pico de muestra ≥ 0 dBFS`);
  check(r.loud.I >= -20 && r.loud.I <= -16, `${r.slug}: sonoridad integrada ${fmt(r.loud.I, 1)} LUFS dentro de −20…−16`, `${r.slug}: sonoridad integrada ${fmt(r.loud.I, 1)} LUFS fuera de −20…−16`);
}

// ───────────────────────────────────────────────────────────── (h) audibilidad de los acentos sobre la música

console.log("\n(h) Audibilidad de los acentos en la mezcla (banda de 1/3 de octava del acento: sfx vs música × volumen de Reel.tsx)");
{
  const sfx = monoOf(wavs["sfx-hilo"]);
  const mus = monoOf(wavs.musica);
  const volMusic = REEL.vol.musica;
  const NF = 8192;
  const bandDb = (x: Float32Array, a: number, lo: number, hi: number, gain: number): number => {
    const re = new Float64Array(NF);
    const im = new Float64Array(NF);
    for (let i = 0; i < NF; i++) re[i] = (x[a + i] ?? 0) * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / NF)) * gain;
    fft(re, im);
    let sum = 0;
    for (let k = 1; k < NF / 2; k++) {
      const f = (k * SR) / NF;
      if (f >= lo && f < hi) sum += re[k] * re[k] + im[k] * im[k];
    }
    return 10 * Math.log10((2 * sum) / (NF * NF * 0.375) + 1e-20);
  };
  // [etiqueta, fotograma, centro Hz, desfase s de la ventana, SNR mínimo dB]
  const items: [string, number, number, number, number][] = [
    ["reply", SFX_CUES.reply, 740, 0.02, 6],
    ["transition", SFX_CUES.transition, 494, 0.9, -3],
    ["phraseOne", SFX_CUES.phraseOne, 147, 0.02, 3],
    ["phraseTwo", SFX_CUES.phraseTwo, 185, 0.02, 3],
    ["companionText", SFX_CUES.companionText, 988, 0.02, 3],
    ["gesture", SFX_CUES.gesture, 659, 0.02, 3],
    ["signatureOne", SFX_CUES.signatureOne, 370, 0.02, 3],
    ["logoReveal", SFX_CUES.logoReveal, 880, 0.02, 3],
    ["signatureTwo", SFX_CUES.signatureTwo, 587, 0.02, 3],
    ["finalMessage", SFX_CUES.finalMessage, 587, 0.02, 3],
    ["finalDate", SFX_CUES.finalDate, 988, 0.02, 3],
    ["cierre", SFX_CUES.musicIn + 7 * 105, 880, 0.02, 3],
  ];
  let allOk = true;
  const rowsTxt: string[] = [];
  for (const [label, frame, fc, off, minSnr] of items) {
    const a = fSample(frame) + Math.round(off * SR);
    const lo = fc / 2 ** (1 / 6);
    const hi = fc * 2 ** (1 / 6);
    const s = bandDb(sfx, a, lo, hi, 1);
    const m = bandDb(mus, a, lo, hi, Math.max(volMusic(frame + off * FPS), 1e-6));
    const snr = s - m;
    const pass = snr >= minSnr;
    if (!pass) allOk = false;
    rowsTxt.push(`${label.padEnd(14)} f${String(frame).padStart(4)} ${String(fc).padStart(4)} Hz: acento ${fmt(s).padStart(6)} dB · música ${fmt(m).padStart(6)} dB · diferencia ${fmt(snr).padStart(6)} dB (mín ${minSnr})${pass ? "" : "  ✗"}`);
  }
  for (const r of rowsTxt) console.log(`    ${r}`);
  check(allOk, "todos los acentos tonales se oyen sobre la música en su propia banda (≥ +3 dB; la llegada de la respuesta ≥ +6 dB; el swell de la transición no queda tapado: ≥ −3 dB)", "algún acento queda tapado por la música en su banda (ver la tabla)");
}

// ───────────────────────────────────────────────────────────── (g) espectrogramas

console.log("\n(g) Espectrogramas (ffmpeg showspectrumpic) →", CHECK_DIR);
const specArgs = ["-lavfi", "showspectrumpic=s=1500x560:legend=1:scale=log:fscale=log:stop=20000:mode=combined"];
for (const name of STEMS) {
  const out = `${CHECK_DIR}/espectro-${name}.png`;
  const p = run("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", "-i", `${AUDIO_DIR}${name}.wav`, ...specArgs, out]);
  console.log(`  ${p.status === 0 ? "✓" : "✗"} ${out}`);
  if (p.status !== 0) fail(`no se pudo generar el espectrograma de ${name}: ${p.err.trim()}`);
}
{
  const out = `${CHECK_DIR}/espectro-mezcla-reel.png`;
  const p = run("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", "-i", `${CHECK_DIR}/mezcla-reel.wav`, ...specArgs, out]);
  console.log(`  ${p.status === 0 ? "✓" : "✗"} ${out}`);
  // acercamientos: tipeo y borrado (f90–f640), duda + envío + respuesta (f580–f900) y cierre (f1380–f1590)
  const zoom: [string, number, number, string][] = [
    ["espectro-teclado-zoom", 3, 18.5, "teclado.wav"],
    ["espectro-duda-envio-zoom", 19.3, 10.7, "../mezcla-reel.wav"],
    ["espectro-sfx-zoom", 29.5, 18, "sfx-hilo.wav"],
    ["espectro-cierre-zoom", 45.5, 7.5, "../mezcla-reel.wav"],
  ];
  for (const [nm, ss, t, src] of zoom) {
    const o = `${CHECK_DIR}/${nm}.png`;
    const input = src.startsWith("../") ? `${CHECK_DIR}/${src.slice(3)}` : `${AUDIO_DIR}${src}`;
    const pz = run("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", "-ss", String(ss), "-t", String(t), "-i", input, ...specArgs, o]);
    console.log(`  ${pz.status === 0 ? "✓" : "✗"} ${o}`);
  }
}

console.log(failures === 0 ? "\nVERIFICACIÓN OK" : `\nVERIFICACIÓN CON ${failures} FALLA(S)`);
process.exit(failures === 0 ? 0 : 1);
