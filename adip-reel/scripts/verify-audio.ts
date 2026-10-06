/**
 * verify-audio.ts — v2 · verificación objetiva de los 4 stems de public/audio (sin necesidad de «escuchar»).
 *
 *   node scripts/verify-audio.ts            (o:  npm run audio:verify)
 *
 * Requiere ffmpeg/ffprobe en el PATH. Salida con código 1 si falla alguna comprobación dura.
 * Variables opcionales:  AUDIO_CHECK_DIR=<carpeta>  (espectrogramas y mezclas de prueba; por defecto <tmp>/adip-audio-check)
 *                        AUDIO_VERBOSE=1            (tabla completa de las 128 pulsaciones)
 *
 * (a) formato y duración exactos: 38 s = 1140 f (ffprobe + lectura propia del WAV)
 * (b) teclado: detección CIEGA de onsets (envolvente de energía) vs KEY_EVENTS (±1 ms), silencio digital fuera de eventos,
 *     PAUSA de duda (sin teclado desde el fin del tipeo hasta el traspaso), presencia del borrado (⌫), distinción de tipos
 *     de tecla y variación entre pulsaciones (ninguna repetida)
 * (c) picos / RMS / clipping / DC / empalmes (clics) por stem; ambiente audible desde f0 y «aire que se abre» en la pausa;
 *     música y sfx en silencio hasta musicIn; finales a cero
 * (d) alineación de los hitos de sfx-hilo con SFX_CUES (detector de subida en banda propia de cada hito)
 * (e) espacio para la voz futura: balance espectral de la música en las escenas 3–5 (banda 300–3000 Hz contenida)
 * (f) mezcla simulada con los volúmenes REALES de src/Reel.tsx (se leen del archivo): pico real y sonoridad integrada (ebur128)
 * (g) espectrogramas (ffmpeg showspectrumpic) para revisar a ojo: banda ancha rara, clics, cortes
 */
import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { CURSOR_HANDOFF, FPS, MESSAGE_SPECS, SCENES, SFX_CUES, TOTAL_FRAMES } from "../src/config/timeline.ts";
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

const PAUSE_FROM = MESSAGE_SPECS[2].typeEnd; // fin del tipeo del último mensaje
const PAUSE_TO = CURSOR_HANDOFF; // traspaso cursor → trazo (entra la música)
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
check(TOTAL_FRAMES === 1140 && TOTAL_FRAMES / FPS === 38, "timeline.ts: TOTAL_FRAMES = 1140 f = 38 s (30 fps)", `timeline.ts: TOTAL_FRAMES = ${TOTAL_FRAMES} (se esperaban 1140 f = 38 s)`);
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

  // PAUSA de la duda: nada de teclado entre el fin del tipeo (typeEnd) y el traspaso (y de ahí al final)
  {
    const from = fSample(PAUSE_FROM) + Math.round(0.25 * SR);
    const nz = firstNonZero(w, from, N);
    check(nz < 0, `pausa de la duda: teclado en silencio digital desde f${PAUSE_FROM} (+0,25 s de cola) hasta f${PAUSE_TO} y hasta el final — ${((PAUSE_TO - PAUSE_FROM) / FPS).toFixed(2)} s sin una sola tecla`, `hay teclado (muestra ${nz}, f${(nz / SPF).toFixed(1)}) en la pausa de la duda`);
    const lastEv = Math.max(...KEY_EVENTS.map((e) => e.frame));
    check(lastEv <= PAUSE_FROM, `el último evento de KEY_EVENTS (f${lastEv}) no pasa de typeEnd (f${PAUSE_FROM})`, `KEY_EVENTS tiene eventos (f${lastEv}) dentro de la pausa de la duda`);
  }

  // BORRADO: presencia (tick, tecla hundida, arrastre) respecto del tipeo del mismo mensaje
  {
    console.log("  borrado (⌫ sostenida) vs tipeo del mismo mensaje:");
    const windowRms = (a: number, b: number): number => dbf(rmsOf(w, a, b));
    let allOk = true;
    for (let m = 0; m < 2; m++) {
      const t = MESSAGE_TIMINGS[m];
      const bs = rows.filter((r) => r.e.kind === "backspace" && r.e.message === m);
      const first = bs[0].sample;
      const lastS = bs[bs.length - 1].sample;
      const delRms = windowRms(first, lastS + Math.round(0.12 * SR));
      const typRms = windowRms(fSample(t.spec.start), fSample(t.spec.typeEnd) + Math.round(0.05 * SR));
      const ticks = bs.slice(1, -1).map((r) => peakAt(r.sample, 6));
      const down = peakAt(first, 20);
      const rel = peakAt(lastS, 20);
      // arrastre: energía de 0,6–1,8 kHz entre el 1.er y el último evento vs. la misma banda en un hueco sin ráfaga
      console.log(
        `    mensaje ${m + 1}: RMS borrado ${fmt(delRms)} dBFS vs tipeo ${fmt(typRms)} dBFS (Δ ${fmt(delRms - typRms)} dB) · tecla hundida ${fmt(down)} · ticks mediana ${fmt(med(ticks))} (min ${fmt(Math.min(...ticks))}) · suelta ${fmt(rel)} dBFS`,
      );
      const pass = delRms - typRms >= -4 && med(ticks) >= -16.5 && down >= -11 && down - med(ticks) >= 3;
      if (!pass) allOk = false;
    }
    check(allOk, "⌫ claramente presente: RMS de la ráfaga ≥ tipeo −4 dB, ticks con mediana ≥ −16,5 dBFS (la v1: ≈ −25), tecla hundida ≥ −11 dBFS y ≥ 3 dB sobre los ticks", "el borrado queda demasiado flojo respecto del tipeo o de la tecla hundida");
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
}
{
  // límites objetivo por stem (pico)
  const wantRange: Record<StemName, [number, number]> = { ambiente: [-28, -16], teclado: [-11, -5.5], musica: [-10.5, -8], "sfx-hilo": [-16, -9] };
  for (const name of STEMS) {
    const [lo, hi] = wantRange[name];
    check(peaksDb[name] >= lo && peaksDb[name] <= hi, `${name}: pico ${peaksDb[name].toFixed(1)} dBFS dentro de [${lo}, ${hi}]`, `${name}: pico ${peaksDb[name].toFixed(1)} dBFS fuera de [${lo}, ${hi}]`);
  }

  // AMBIENTE: audible desde el fotograma 0 (> −40 dBFS RMS) y estable; «el aire se abre» en la pausa de duda (apenas)
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
  check(total < -30 && maxWin < -31, `ambiente: discreto (RMS ${fmt(total, 1)} dBFS, ventana máx ${fmt(maxWin, 1)} dBFS, siempre < −30)`, "ambiente: demasiado fuerte");
  // apertura: 380–410 vs 300–356 (RMS y banda 1–3 kHz)
  const aFrom = fSample(300);
  const aTo = fSample(PAUSE_FROM);
  const bFrom = fSample(PAUSE_FROM + 24);
  const bTo = fSample(PAUSE_TO);
  const lvlA = dbf(rmsOf(amb, aFrom, aTo));
  const lvlB = dbf(rmsOf(amb, bFrom, bTo));
  const ma = monoOf(amb);
  const pa = welch(ma, aFrom, aTo, 4096);
  const pb = welch(ma, bFrom, bTo, 4096);
  const midA = 10 * Math.log10(bandMs(pa, 1000, 3000, 4096));
  const midB = 10 * Math.log10(bandMs(pb, 1000, 3000, 4096));
  const cenA = (() => {
    let n = 0;
    let d = 0;
    for (let k = 1; k < pa.length; k++) {
      const f = (k * SR) / 4096;
      if (f > 6000) break;
      n += f * pa[k];
      d += pa[k];
    }
    return n / d;
  })();
  const cenB = (() => {
    let n = 0;
    let d = 0;
    for (let k = 1; k < pb.length; k++) {
      const f = (k * SR) / 4096;
      if (f > 6000) break;
      n += f * pb[k];
      d += pb[k];
    }
    return n / d;
  })();
  console.log(`  ambiente · «el aire se abre»: f300–f${PAUSE_FROM} ${fmt(lvlA, 2)} dBFS → f${PAUSE_FROM + 24}–f${PAUSE_TO} ${fmt(lvlB, 2)} dBFS (Δ ${fmt(lvlB - lvlA, 2)} dB) · banda 1–3 kHz ${fmt(midA)} → ${fmt(midB)} dB (Δ ${fmt(midB - midA)}) · centroide ≤ 6 kHz ${fmt(cenA, 0)} → ${fmt(cenB, 0)} Hz`);
  check(lvlB - lvlA >= 0.8 && lvlB - lvlA <= 3.5, `ambiente: se abre apenas en la pausa (Δ ${fmt(lvlB - lvlA, 2)} dB, entre +0,8 y +3,5)`, `ambiente: la apertura en la pausa (${fmt(lvlB - lvlA, 2)} dB) está fuera de +0,8…+3,5 dB`);
  check(cenB > cenA * 1.05, `ambiente: el aire se vuelve algo más abierto (centroide ${fmt(cenA, 0)} → ${fmt(cenB, 0)} Hz)`, "ambiente: la pausa no cambia el color del aire");

  // MÚSICA y SFX: silencio digital hasta musicIn (y por tanto durante la pausa de la duda)
  const musicInSample = fSample(SFX_CUES.musicIn);
  for (const name of ["musica", "sfx-hilo"] as const) {
    const nz = firstNonZero(wavs[name], 0, N);
    check(nz >= musicInSample, `${name}: silencio digital hasta el fotograma ${SFX_CUES.musicIn} (primera muestra no nula: ${nz} ≥ ${musicInSample}) — la pausa de la duda queda solo con aire`, `${name} suena antes del fotograma ${SFX_CUES.musicIn} (muestra ${nz})`);
  }
  // finales a cero (sin corte seco)
  for (const name of STEMS) {
    const w = wavs[name];
    const endPeak = peakOf(w, N - 48, N);
    check(endPeak < 1e-3, `${name}: termina en silencio (últimos 1 ms: pico ${dbf(endPeak).toFixed(1)} dBFS)`, `${name}: corte seco al final (pico ${dbf(endPeak).toFixed(1)} dBFS en el último ms)`);
  }
  // cierre de la música: acorde sostenido que se desvanece hasta f1140
  const mus = wavs.musica;
  const seg = (f0: number, f1: number): number => dbf(rmsOf(mus, fSample(f0), fSample(f1)));
  console.log(`  música · cierre (RMS por tramo): f1040–1065 ${fmt(seg(1040, 1065))} · f1065–1090 ${fmt(seg(1065, 1090))} · f1090–1115 ${fmt(seg(1090, 1115))} · f1115–1140 ${fmt(seg(1115, 1140))} dBFS`);
  check(seg(1040, 1065) > seg(1065, 1090) && seg(1065, 1090) > seg(1090, 1115) && seg(1090, 1115) > seg(1115, 1140), "música: se desvanece de forma monótona hasta f1140 (sin corte seco)", "música: el cierre no decae de forma monótona");
  check(seg(1040, 1065) > -40 && seg(1065, 1090) > -45, "música: el acorde final sostenido suena (no se apaga antes de tiempo)", "música: el acorde final se apaga antes de tiempo");
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
  type Cue = { label: string; frame: number; fc: number | null; q: number; search: number; maxMs: number; kind: string; rel?: number; rise90?: [number, number] };
  const sub = SFX_CUES.subtitleUnits;
  const cues: Cue[] = [
    { label: "threadBorn", frame: SFX_CUES.threadBorn, fc: null, q: 1, search: 1.5, maxMs: 150, kind: "soplo + tono que se estira" },
    { label: "cameraPullOut", frame: SFX_CUES.cameraPullOut, fc: 220, q: 10, search: 1.6, maxMs: 300, kind: "swell (La3-Mi4-La4)", rel: 1.3, rise90: [0.62, 1.12] },
    { label: "phraseOne", frame: SFX_CUES.phraseOne, fc: 147, q: 4, search: 0.6, maxMs: 40, kind: "tono grave cálido Re3" },
    { label: "phraseTwo", frame: SFX_CUES.phraseTwo, fc: 185, q: 4, search: 0.6, maxMs: 40, kind: "tono grave cálido Fa#3" },
    { label: "widen", frame: SFX_CUES.widen, fc: 196, q: 4, search: 2.0, maxMs: 300, kind: "swell (Sol3-Re4-Si4-Fa#5)", rel: 1.3, rise90: [0.5, 1.0] },
    { label: "companionText", frame: SFX_CUES.companionText, fc: 988, q: 6, search: 0.25, maxMs: 20, kind: "pip suave Si5" },
    { label: "friendSits", frame: SFX_CUES.friendSits, fc: 95, q: 2.5, search: 0.3, maxMs: 25, kind: "tela + madera" },
    { label: "friendGesture", frame: SFX_CUES.friendGesture, fc: 659, q: 6, search: 0.12, maxMs: 25, kind: "cuerda suave Mi5→La5" },
    { label: "logoReveal", frame: SFX_CUES.logoReveal, fc: 880, q: 6, search: 0.09, maxMs: 25, kind: "carillón La mayor" },
    ...sub.map((f, i): Cue => ({ label: `subtitle[${i}]`, frame: f, fc: [1175, 1319, 1760][i % 3], q: 6, search: 0.06, maxMs: 15, kind: "tic" })),
    { label: "finalMessage", frame: SFX_CUES.finalMessage, fc: 147, q: 4, search: 0.6, maxMs: 40, kind: "tonos Re3+La3" },
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
      // swell de ataque lento: el «inicio» por umbral es tardío por diseño; se verifica cuándo alcanza el 90 % de su máximo en la banda
      let t90 = NaN;
      for (let i = s0; i < Math.min(N, s0 + Math.round(c.search * SR)); i++) {
        if (env[i] >= 0.9 * P) {
          t90 = (i - s0) / SR;
          break;
        }
      }
      console.log(`      ${"".padEnd(14)} swell: llega al 90 % de su máximo ${fmt(t90, 2)} s después del hito (esperado ${c.rise90[0]}–${c.rise90[1]} s; ataque de diseño 0,95–1,1 s)`);
      check(!Number.isNaN(t90) && t90 >= c.rise90[0] && t90 <= c.rise90[1] && rise, `sfx ${c.label}: el swell nace en el fotograma ${c.frame} (90 % del máximo a ${fmt(t90, 2)} s, esperado ${c.rise90[0]}–${c.rise90[1]} s)`, `sfx ${c.label}: el swell no está alineado con el fotograma ${c.frame} (90 % a ${fmt(t90, 2)} s; esperado ${c.rise90[0]}–${c.rise90[1]} s)`);
    } else {
      check(!Number.isNaN(ms) && ms >= -1 && ms <= c.maxMs && rise, `sfx ${c.label}: arranca en el fotograma ${c.frame} (${fmt(ms)} ms ≤ ${c.maxMs} ms)`, `sfx ${c.label}: no se encuentra el hito en el fotograma ${c.frame} (${fmt(ms)} ms, límite ${c.maxMs}${rise ? "" : "; sin contraste con lo previo"})`);
    }
  }
  // acentos sutiles (nivel en la banda propia de cada hito): sentarse y texto < −22 dBFS; tics < −30 dBFS
  check(bandPeaks["friendSits"] < -22 && bandPeaks["companionText"] < -22 && sub.every((_, i) => bandPeaks[`subtitle[${i}]`] < -30), `acentos muy sutiles: sentarse ${fmt(bandPeaks["friendSits"])} y texto ${fmt(bandPeaks["companionText"])} dBFS (< −22), tics ${sub.map((_, i) => fmt(bandPeaks[`subtitle[${i}]`])).join(" / ")} dBFS (< −30)`, "algún acento sutil (sentarse, texto o tics) está demasiado fuerte");
}

// ───────────────────────────────────────────────────────────── (e) espacio para la voz futura

console.log("\n(e) Espacio para la voz futura · música en las escenas 3–5 (banda 300–3000 Hz contenida)");
{
  const mono = monoOf(wavs.musica);
  const a = fSample(SCENES.s3.from);
  const b = fSample(SCENES.s5.to);
  const a6 = fSample(SCENES.s6.from + 20);
  const b6 = fSample(1065);
  const P = welch(mono, a, b);
  const P6 = welch(mono, a6, b6);
  const bands: [string, number, number][] = [
    ["20–100", 20, 100],
    ["100–300", 100, 300],
    ["300–3000", 300, 3000],
    ["3000–8000", 3000, 8000],
  ];
  const tot = bandMs(P, 20, 20000);
  const tot6 = bandMs(P6, 20, 20000);
  console.log(`  escenas 3–5 (f${SCENES.s3.from}–f${SCENES.s5.to}), música sola:  ${bands.map(([n, lo, hi]) => `${n} Hz ${fmt(10 * Math.log10(bandMs(P, lo, hi)))} dB (${fmt((100 * bandMs(P, lo, hi)) / tot, 0)} %)`).join(" · ")}  · total ${fmt(10 * Math.log10(tot))} dB`);
  console.log(`  escena 6 (sin voz, f${SCENES.s6.from + 20}–f1065):                ${bands.map(([n, lo, hi]) => `${n} Hz ${fmt(10 * Math.log10(bandMs(P6, lo, hi)))} dB (${fmt((100 * bandMs(P6, lo, hi)) / tot6, 0)} %)`).join(" · ")}  · total ${fmt(10 * Math.log10(tot6))} dB`);
  const share = bandMs(P, 300, 3000) / tot;
  const inBandDb = 10 * Math.log10(bandMs(P, 300, 3000));
  // la v1 tenía 38 % (−24,2 dB) en la misma banda con una música pad una octava más aguda y sin hueco de ecualización
  check(share <= 0.3, `la banda de voz 300–3000 Hz es el ${fmt(share * 100, 0)} % de la energía de la música (≤ 30 %; v1: 38 %)`, `la banda 300–3000 Hz concentra el ${fmt(share * 100, 0)} % de la música (> 30 %)`);
  check(inBandDb <= -25, `nivel de la música en 300–3000 Hz: ${fmt(inBandDb)} dBFS RMS (stem solo; ≤ −25; v1: −24,2); en la mezcla (×0,9): ${fmt(inBandDb + dbf(0.9))} dBFS → ≥ ${fmt(-20 - (inBandDb + dbf(0.9)), 0)} dB bajo una voz a −20 dBFS RMS`, `la música aporta ${fmt(inBandDb)} dBFS en 300–3000 Hz (> −25)`);
  // dinámica: la música en 3–5 no se mueve más de ±2 dB entre ventanas de 3,5 s (un compás)
  const lv: number[] = [];
  for (let f = SCENES.s3.from + 70; f + 105 <= SCENES.s5.to; f += 105) lv.push(dbf(rmsOf(wavs.musica, fSample(f), fSample(f + 105))));
  console.log(`  música · RMS por compás en 3–5: ${lv.map((x) => fmt(x)).join(" · ")} dBFS (rango ${fmt(Math.max(...lv) - Math.min(...lv))} dB)`);
  check(Math.max(...lv) - Math.min(...lv) <= 3, "música estable en 3–5 (RMS por compás dentro de 3 dB): sin picos de nivel que tapen la voz", "música inestable en 3–5");
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
/** Propuesta: el ambiente ya suena en el fotograma 0 (el stem trae su propio anti-clic de 30 ms): 0,8 constante y sale con el cierre. */
const PROPOSAL: Volumes = {
  ...REEL.vol,
  ambiente: lerp([0, MI, MI + 60, TOTAL_FRAMES - 45, TOTAL_FRAMES], [0.8, 0.8, 0.5, 0.5, 0]),
};

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
function ebur128(path: string): Loud {
  const p = run("ffmpeg", ["-hide_banner", "-nostats", "-i", path, "-filter_complex", "ebur128=peak=true", "-f", "null", "-"]);
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
const sets: [string, string, Volumes][] = [
  ["mezcla-reel", "Reel.tsx actual (ambiente 0→0,8→0,5→0 · teclado 1 · música 0→0,9→0 · sfx 1)", REEL.vol],
  ["mezcla-propuesta", "Propuesta (ambiente 0,8 desde el f0 → 0,5 con la música; resto igual)", PROPOSAL],
];
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
}
for (const r of mixResults) {
  check(r.loud.TP < -1, `${r.slug}: pico real ${fmt(r.loud.TP, 2)} dBTP < −1 dBFS (tras AAC ${fmt(r.aacTP, 2)})`, `${r.slug}: pico real ${fmt(r.loud.TP, 2)} dBTP ≥ −1`);
  check(r.peak < 1, `${r.slug}: pico de muestra ${fmt(dbf(r.peak), 2)} dBFS < 0`, `${r.slug}: pico de muestra ≥ 0 dBFS`);
  check(r.loud.I >= -20 && r.loud.I <= -16, `${r.slug}: sonoridad integrada ${fmt(r.loud.I, 1)} LUFS dentro de −20…−16`, `${r.slug}: sonoridad integrada ${fmt(r.loud.I, 1)} LUFS fuera de −20…−16`);
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
  // acercamientos: tipeo y borrado (f90–f420) y pausa + música entrando (f340–f520)
  const zoom: [string, number, number, string][] = [
    ["espectro-teclado-zoom", 3, 11, "teclado.wav"],
    ["espectro-pausa-zoom", 11.3, 6.2, "../mezcla-reel.wav"],
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
