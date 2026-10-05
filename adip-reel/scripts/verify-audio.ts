/**
 * verify-audio.ts — verificación objetiva de los 4 stems de public/audio (sin necesidad de "escuchar").
 *
 *   node scripts/verify-audio.ts            (o:  npm run audio:verify)
 *
 * Requiere ffmpeg/ffprobe en el PATH. Salida con código 1 si falla alguna comprobación dura.
 * Variables opcionales:  AUDIO_CHECK_DIR=<carpeta>  (espectrogramas y mezclas de prueba; por defecto <tmp>/adip-audio-check)
 *                        AUDIO_VERBOSE=1            (tabla completa de las 128 pulsaciones)
 *
 * (a) formato y duración exactos (ffprobe + lectura propia del WAV)
 * (b) teclado: detección CIEGA de onsets (envolvente de energía) y comparación con KEY_EVENTS (±1 ms) + silencio fuera de eventos
 * (c) picos / RMS / clipping / DC / empalmes (clics) por stem
 * (d) mezcla simulada con los volúmenes de Reel.tsx (y la propuesta recomendada; AUDIO_MUSIC_MAX=<0..1> cambia el máximo de música): pico real y sonoridad integrada (ebur128)
 * (e) espectrogramas (ffmpeg showspectrumpic) para revisar a ojo: banda ancha rara, clics, cortes
 */
import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { FPS, SFX_CUES, TOTAL_FRAMES } from "../src/config/timeline.ts";
import { KEY_EVENTS } from "../src/config/typing.ts";

const SR = 48000;
const SPF = SR / FPS;
const N = TOTAL_FRAMES * SPF;
const AUDIO_DIR = fileURLToPath(new URL("../public/audio/", import.meta.url));
const CHECK_DIR = process.env.AUDIO_CHECK_DIR ?? `${tmpdir()}/adip-audio-check`;
const VERBOSE = process.env.AUDIO_VERBOSE === "1";
mkdirSync(CHECK_DIR, { recursive: true });

const STEMS = ["ambiente", "teclado", "musica", "sfx-hilo"] as const;
type StemName = (typeof STEMS)[number];

const dbf = (x: number): number => 20 * Math.log10(Math.max(x, 1e-12));
let failures = 0;
const fail = (msg: string): void => {
  failures++;
  console.log(`  ✗ FALLA: ${msg}`);
};
const ok = (msg: string): void => console.log(`  ✓ ${msg}`);
const check = (cond: boolean, okMsg: string, failMsg: string): void => (cond ? ok(okMsg) : fail(failMsg));

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

function run(cmd: string, args: string[]): { out: string; err: string; status: number } {
  const p = spawnSync(cmd, args, { encoding: "utf8", maxBuffer: 1 << 28 });
  if (p.error) throw new Error(`no se pudo ejecutar ${cmd}: ${p.error.message}`);
  return { out: p.stdout ?? "", err: p.stderr ?? "", status: p.status ?? -1 };
}

const wavs = {} as Record<StemName, Wav>;

// ───────────────────────────────────────────────────────────── (a) formato y duración

console.log("\n(a) Formato y duración (ffprobe)");
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
  check(exact, `${name}.wav: PCM 16-bit, 48 kHz, estéreo, exactamente ${TOTAL_FRAMES / FPS} s (${N} muestras)`, `${name}.wav no cumple el formato/duración exactos`);
}

// ───────────────────────────────────────────────────────────── (b) teclado: onsets

console.log("\n(b) teclado.wav · onsets ciegos vs KEY_EVENTS");
{
  const w = wavs.teclado;
  const mono = new Float32Array(N);
  for (let i = 0; i < N; i++) mono[i] = (w.l[i] + w.r[i]) * 0.5;

  // pasa-altos de 2.º orden (1,8 kHz): deja el transitorio de ruido y quita el golpe grave
  const fc = 1800;
  const w0 = (2 * Math.PI * fc) / SR;
  const alpha = Math.sin(w0) / (2 * 0.707);
  const cs = Math.cos(w0);
  const a0 = 1 + alpha;
  const b0 = (1 + cs) / 2 / a0;
  const b1 = -(1 + cs) / a0;
  const a1 = (-2 * cs) / a0;
  const a2 = (1 - alpha) / a0;
  const hp = new Float32Array(N);
  let x1 = 0;
  let x2 = 0;
  let y1 = 0;
  let y2 = 0;
  for (let i = 0; i < N; i++) {
    const x = mono[i];
    const y = b0 * x + b1 * x1 + b0 * x2 - a1 * y1 - a2 * y2;
    x2 = x1;
    x1 = x;
    y2 = y1;
    y1 = y;
    hp[i] = y;
  }

  // seguidor de envolvente (ataque instantáneo, caída τ = 2 ms); onset = muestra que supera el umbral absoluto
  // y a 2,2× el seguidor decaído; refractario 3 ms.
  const T_ABS = 10 ** (-60 / 20);
  const decay = Math.exp(-1 / (0.002 * SR));
  const refractory = Math.round(0.003 * SR);
  let env = 0;
  let last = -1e9;
  const onsets: number[] = [];
  for (let i = 0; i < N; i++) {
    const a = Math.abs(hp[i]);
    const decayed = env * decay;
    if (a > T_ABS && a > 2.2 * decayed && i - last > refractory) {
      onsets.push(i);
      last = i;
    }
    env = Math.max(a, decayed);
  }

  // muestras esperadas: frame·1600 + reparto uniforme dentro del fotograma si hay varios eventos en el mismo (ráfaga de borrado)
  const groupSize = new Map<number, number>();
  for (const e of KEY_EVENTS) groupSize.set(e.frame, (groupSize.get(e.frame) ?? 0) + 1);
  const seen = new Map<number, number>();
  const expected = KEY_EVENTS.map((e) => {
    const n = groupSize.get(e.frame) ?? 1;
    const k = seen.get(e.frame) ?? 0;
    seen.set(e.frame, k + 1);
    return { e, sample: Math.round((e.frame / FPS) * SR) + Math.floor((k * SPF) / n), first: k === 0 };
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
  console.log("  msg  tipeo(tecla/esp/punt)  borrado   1.er-f  últ-f   Δmáx ms   Δmedio ms   amp.pico dBFS (min…max)");
  for (let m = 0; m < 3; m++) {
    const sub = rows.filter((r) => r.e.message === m);
    const cnt = (k: string): number => sub.filter((r) => r.e.kind === k).length;
    const dd = sub.filter((r) => r.detected >= 0).map((r) => ((r.detected - r.sample) / SR) * 1000);
    const peaks = sub.map((r) => {
      const a = r.sample;
      let p = 0;
      for (let i = a; i < Math.min(N, a + Math.round(0.02 * SR)); i++) p = Math.max(p, Math.abs(w.l[i]), Math.abs(w.r[i]));
      return dbf(p);
    });
    console.log(
      `  ${m + 1}    ${String(cnt("key")).padStart(3)}/${String(cnt("space")).padStart(2)}/${String(cnt("punct")).padStart(1)}            ${String(cnt("backspace")).padStart(3)}      ${String(Math.min(...sub.map((r) => r.e.frame))).padStart(5)}  ${String(Math.max(...sub.map((r) => r.e.frame))).padStart(5)}   ${Math.max(...dd.map(Math.abs)).toFixed(3).padStart(7)}   ${(dd.reduce((a, c) => a + c, 0) / dd.length).toFixed(3).padStart(8)}   ${Math.min(...peaks).toFixed(1)} … ${Math.max(...peaks).toFixed(1)}`,
    );
  }
  if (VERBOSE) {
    console.log("  frame  tipo       carácter  muestra esperada  detectada  Δ ms");
    for (const r of rows) console.log(`  ${String(r.e.frame).padStart(5)}  ${r.e.kind.padEnd(9)}  ${JSON.stringify(r.e.char).padEnd(8)}  ${String(r.sample).padStart(10)}  ${String(r.detected).padStart(10)}  ${(((r.detected - r.sample) / SR) * 1000).toFixed(3)}`);
  }
  const firsts = rows.filter((r) => r.first && r.detected >= 0).map((r) => ((r.detected - r.sample) / SR) * 1000);
  console.log(`  Δ del primer evento de cada fotograma: máx ${Math.max(...firsts.map(Math.abs)).toFixed(3)} ms (n = ${firsts.length}); todos: máx ${maxAbs.toFixed(3)} ms, medio ${meanD.toFixed(3)} ms`);
  check(missing === 0 && spurious === 0 && onsets.length === KEY_EVENTS.length, `${KEY_EVENTS.length}/${KEY_EVENTS.length} pulsaciones detectadas, sin onsets espurios ni faltantes`, `onsets: ${onsets.length} detectados vs ${KEY_EVENTS.length} esperados (faltan ${missing}, sobran ${spurious})`);
  check(maxAbs <= 1, `todos los onsets dentro de ±1 ms de frame/30 s (máx ${maxAbs.toFixed(3)} ms)`, `desvío máximo ${maxAbs.toFixed(3)} ms > 1 ms`);

  // silencio total fuera de los eventos: tras 160 ms del último evento y hasta el siguiente
  const starts = expected.map((x) => x.sample).sort((a, b) => a - b);
  const tailLen = Math.round(0.16 * SR);
  let nonZero = 0;
  let prevEnd = 0;
  const silentRegions: [number, number][] = [];
  for (const s of starts) {
    if (s > prevEnd) silentRegions.push([prevEnd, s]);
    prevEnd = Math.max(prevEnd, s + tailLen);
  }
  silentRegions.push([prevEnd, N]);
  for (const [a, b] of silentRegions) for (let i = a; i < b; i++) if (w.l[i] !== 0 || w.r[i] !== 0) nonZero++;
  check(nonZero === 0, "silencio digital exacto fuera de las ventanas de evento (160 ms tras cada pulsación)", `${nonZero} muestras no nulas fuera de eventos`);

  // contención de la ráfaga de borrado: pico por pulsación de borrado y densidad máxima
  const backPeaks = rows.filter((r) => r.e.kind === "backspace").map((r) => {
    let p = 0;
    for (let i = r.sample; i < Math.min(N, r.sample + Math.round(0.012 * SR)); i++) p = Math.max(p, Math.abs(w.l[i]), Math.abs(w.r[i]));
    return dbf(p);
  });
  console.log(`  borrado: ${backPeaks.length} ticks · pico por tick ${Math.min(...backPeaks).toFixed(1)} … ${Math.max(...backPeaks).toFixed(1)} dBFS (más suaves que las teclas, para que la ráfaga no sature)`);
}

// ───────────────────────────────────────────────────────────── (c) picos, RMS, clipping, empalmes

console.log("\n(c) Picos, RMS, clipping, DC y empalmes");
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
  const wantRange: Record<StemName, [number, number]> = { ambiente: [-45, -20], teclado: [-16.5, -11], musica: [-11, -9], "sfx-hilo": [-16, -9] };
  for (const name of STEMS) {
    const [lo, hi] = wantRange[name];
    check(peaksDb[name] >= lo && peaksDb[name] <= hi, `${name}: pico ${peaksDb[name].toFixed(1)} dBFS dentro de [${lo}, ${hi}]`, `${name}: pico ${peaksDb[name].toFixed(1)} dBFS fuera de [${lo}, ${hi}]`);
  }
  const amb = dbf(rmsOf(wavs.ambiente));
  check(Math.abs(amb + 42) < 0.5, `ambiente: RMS ${amb.toFixed(2)} dBFS ≈ −42`, `ambiente: RMS ${amb.toFixed(2)} dBFS (objetivo −42)`);
  const mus = wavs.musica;
  const musicInSample = Math.round((SFX_CUES.musicIn / FPS) * SR);
  let firstNonZero = -1;
  for (let i = 0; i < mus.n; i++) {
    if (mus.l[i] !== 0 || mus.r[i] !== 0) {
      firstNonZero = i;
      break;
    }
  }
  check(firstNonZero >= musicInSample, `música: silencio digital hasta el fotograma ${SFX_CUES.musicIn} (primera muestra no nula: ${firstNonZero} ≥ ${musicInSample})`, `música suena antes del fotograma ${SFX_CUES.musicIn} (muestra ${firstNonZero})`);
  // finales a cero (sin corte seco)
  for (const name of STEMS) {
    const w = wavs[name];
    const endPeak = peakOf(w, N - 48, N);
    check(endPeak < 1e-3, `${name}: termina en silencio (últimos 1 ms: pico ${dbf(endPeak).toFixed(1)} dBFS)`, `${name}: corte seco al final (pico ${dbf(endPeak).toFixed(1)} dBFS en el último ms)`);
  }
  // cola natural de la música hasta ~1049
  const tail = peakOf(mus, Math.round((1040 / FPS) * SR), N);
  console.log(`  música: nivel entre los fotogramas 1040 y 1049 → pico ${dbf(tail).toFixed(1)} dBFS (cola natural, sin corte)`);
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

// sfx: alineación con SFX_CUES (detector de subida de energía; las colas de hitos anteriores no cuentan)
{
  console.log("\n    sfx-hilo · alineación con SFX_CUES (primera subida de energía (1 ms > −66 dBFS y > 2,5× los 40 ms previos) en [−2, +14] fotogramas; incluye ~1–5 ms de latencia del detector)");
  const w = wavs["sfx-hilo"];
  /** Primer instante donde la energía de 1 ms supera −66 dBFS Y 2,5× la energía de los 40 ms previos (ignora colas anteriores). */
  const filtered = new Map<number | null, Float32Array>();
  const sig = (hpFc: number | null): Float32Array => {
    const hit = filtered.get(hpFc);
    if (hit) return hit;
    const out = new Float32Array(N);
    let b0 = 1;
    let b1 = 0;
    let b2 = 0;
    let a1 = 0;
    let a2 = 0;
    if (hpFc !== null) {
      const w0 = (2 * Math.PI * hpFc) / SR;
      const al = Math.sin(w0) / (2 * 0.707);
      const c = Math.cos(w0);
      const a0 = 1 + al;
      b0 = (1 + c) / 2 / a0;
      b1 = -(1 + c) / a0;
      b2 = b0;
      a1 = (-2 * c) / a0;
      a2 = (1 - al) / a0;
    }
    let x1 = 0;
    let x2 = 0;
    let y1 = 0;
    let y2 = 0;
    for (let i = 0; i < N; i++) {
      const x = (w.l[i] + w.r[i]) * 0.5;
      const y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
      x2 = x1;
      x1 = x;
      y2 = y1;
      y1 = y;
      out[i] = y;
    }
    filtered.set(hpFc, out);
    return out;
  };
  const cum = new Map<number | null, Float64Array>();
  const squares = (hpFc: number | null): Float64Array => {
    const hit = cum.get(hpFc);
    if (hit) return hit;
    const x = sig(hpFc);
    const c = new Float64Array(N + 1);
    for (let i = 0; i < N; i++) c[i + 1] = c[i] + x[i] * x[i];
    cum.set(hpFc, c);
    return c;
  };
  const riseOnset = (cue: number, hpFc: number | null): number => {
    const c = squares(hpFc);
    const short = Math.round(0.001 * SR);
    const long = Math.round(0.04 * SR);
    const gap = Math.round(0.002 * SR);
    const thr = 10 ** (-66 / 20);
    for (let i = cue - 2 * SPF; i < Math.min(N, cue + 14 * SPF); i++) {
      const es = Math.sqrt((c[i + 1] - c[i + 1 - short]) / short);
      const e1 = i + 1 - short - gap;
      const el = Math.sqrt((c[e1] - c[e1 - long]) / long);
      if (es > thr && es > 2.5 * el) return ((i - cue) / SR) * 1000;
    }
    return NaN;
  };
  const cues: [string, number, number | null, number][] = [
    ["threadBorn", SFX_CUES.threadBorn, null, 1.5],
    ["phraseOne", SFX_CUES.phraseOne, null, 1.5],
    ["phraseTwo", SFX_CUES.phraseTwo, null, 1.5],
    ["threadDescend", SFX_CUES.threadDescend, null, 1.2],
    ...SFX_CUES.subtitleUnits.map((f, i): [string, number, number | null, number] => [`subtitle[${i}]`, f, 3000, 0.1]),
    ["threadRise", SFX_CUES.threadRise, null, 1.2],
    ["logoReveal", SFX_CUES.logoReveal, null, 2.0],
  ];
  for (const [label, frame, hpFc, win] of cues) {
    const c = Math.round((frame / FPS) * SR);
    const dms = riseOnset(c, hpFc);
    const pk = peakOf(w, c, Math.min(N, c + Math.round(win * SR)));
    console.log(`    ${label.padEnd(14)} f${String(frame).padStart(4)}  ataque ${Number.isNaN(dms) ? "—" : `${dms >= 0 ? "+" : ""}${dms.toFixed(1)} ms`.padStart(8)}  pico (${win} s) ${dbf(pk).toFixed(1).padStart(6)} dBFS`);
    check(!Number.isNaN(dms) && dms >= -1 && dms <= 120, `sfx ${label}: arranca en el fotograma ${frame} (${dms.toFixed(1)} ms)`, `sfx ${label}: no se encuentra el hito en el fotograma ${frame}`);
  }
}

// ───────────────────────────────────────────────────────────── (d) mezcla simulada

console.log("\n(d) Mezcla simulada (volúmenes de Reel.tsx y recomendados) + sonoridad (ffmpeg ebur128)");

type Curve = (frame: number) => number;
const lerp = (xs: number[], ys: number[]): Curve => (f) => {
  if (f <= xs[0]) return ys[0];
  for (let i = 1; i < xs.length; i++) {
    if (f <= xs[i]) return ys[i - 1] + ((ys[i] - ys[i - 1]) * (f - xs[i - 1])) / (xs[i] - xs[i - 1]);
  }
  return ys[ys.length - 1];
};
const MI = SFX_CUES.musicIn;
type Volumes = Record<StemName, Curve>;
/** COPIA de los volúmenes de src/Reel.tsx (revisar si la coordinación los cambia). */
const REEL_DEFAULT: Volumes = {
  ambiente: lerp([0, 20, MI, MI + 60, TOTAL_FRAMES - 45, TOTAL_FRAMES], [0, 0.8, 0.8, 0.5, 0.5, 0]),
  teclado: () => 1,
  musica: lerp([MI, MI + 75, SFX_CUES.musicOutFrom, TOTAL_FRAMES], [0, 0.9, 0.9, 0]),
  "sfx-hilo": () => 1,
};
/** Volumen máximo de la música en la mezcla "recomendada" (AUDIO_MUSIC_MAX=0.8 para probar otros valores). */
const MUSIC_MAX = Number(process.env.AUDIO_MUSIC_MAX ?? "1");
/**
 * Propuesta de este set de stems: música/sfx/teclado a 1,0 (los stems ya traen su propio nivel y fundidos); el ambiente algo
 * más presente (0,8 → 0,5) para que el arranque no se sienta como silencio digital. Ver docs/AUDIO.md.
 */
const RECOMMENDED: Volumes = {
  ambiente: lerp([0, 20, MI, MI + 60, TOTAL_FRAMES - 45, TOTAL_FRAMES], [0, 0.8, 0.8, 0.5, 0.5, 0]),
  teclado: () => 1,
  musica: lerp([MI, MI + 75, SFX_CUES.musicOutFrom, TOTAL_FRAMES], [0, MUSIC_MAX, MUSIC_MAX, 0]),
  "sfx-hilo": () => 1,
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

const fmt = (x: number, d = 1): string => (Number.isFinite(x) ? x.toFixed(d) : "−∞");
console.log("  Sonoridad por stem (stem solo, volumen 1,0):");
for (const name of STEMS) {
  const lo = ebur128(`${AUDIO_DIR}${name}.wav`);
  console.log(`    ${name.padEnd(9)} integrada ${fmt(lo.I).padStart(6)} LUFS · pico real ${fmt(lo.TP).padStart(6)} dBTP`);
}
const sets: [string, Volumes][] = [
  ["Reel.tsx por defecto (amb 0,5→0,3 · teclado 0,9 · música 0→0,55 · sfx 0,8)", REEL_DEFAULT],
  [`Recomendado (amb 0,8→0,5 · teclado 1,0 · música 0→${MUSIC_MAX} · sfx 1,0)`, RECOMMENDED],
];
const mixResults: { label: string; loud: Loud; aacTP: number; peak: number }[] = [];
for (const [label, vol] of sets) {
  const m = mix(vol);
  let peak = 0;
  for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(m.l[i]), Math.abs(m.r[i]));
  const slug = label.startsWith("Reel") ? "mezcla-reel" : "mezcla-recomendada";
  const f32 = `${CHECK_DIR}/${slug}.wav`;
  writeFloatWav(f32, m.l, m.r);
  // sonoridad del tramo "con música" (donde está el cuerpo del reel) y de todo el reel
  const loud = ebur128(f32);
  // pico tras códec AAC 192 kbps (lo que sale en el MP4)
  const aac = `${CHECK_DIR}/${slug}.m4a`;
  run("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", "-i", f32, "-c:a", "aac", "-b:a", "192k", aac]);
  const dec = `${CHECK_DIR}/${slug}-aac.wav`;
  run("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", "-i", aac, "-c:a", "pcm_f32le", dec]);
  const la = ebur128(dec);
  mixResults.push({ label, loud, aacTP: la.TP, peak });
  console.log(`  ▸ ${label}`);
  if (slug === "mezcla-recomendada") {
    // perfil de sonoridad a corto plazo (ventana de 3 s, S) cada 3 s: muestra el contraste arranque ↔ música
    const pr = run("ffmpeg", ["-hide_banner", "-nostats", "-i", f32, "-filter_complex", "ebur128=peak=true", "-f", "null", "-"]);
    const prof: string[] = [];
    const seenT = new Set<number>();
    for (const line of pr.err.split("\n")) {
      const m = /t:\s+([\d.]+)\s.*?S:\s*(-?[\d.]+|-inf)\s+I:/.exec(line);
      if (!m) continue;
      const t = Math.round(Number(m[1]));
      if (t % 3 === 0 && t > 0 && !seenT.has(t)) {
        seenT.add(t);
        prof.push(`${t}s:${m[2] === "-inf" ? "−∞" : Number(m[2]).toFixed(0)}`);
      }
    }
    console.log(`      sonoridad a corto plazo (S, LUFS) → ${prof.join("  ")}`);
  }
  console.log(`      pico de muestra ${fmt(dbf(peak), 2)} dBFS · pico real ${fmt(loud.TP, 2)} dBTP (tras AAC: ${fmt(la.TP, 2)}) · sonoridad integrada ${fmt(loud.I, 1)} LUFS · LRA ${fmt(loud.LRA, 1)} LU`);
}
{
  const rec = mixResults[1];
  check(rec.loud.TP < -1, `mezcla recomendada: pico real ${fmt(rec.loud.TP, 2)} dBTP < −1 dBFS`, `mezcla recomendada: pico real ${fmt(rec.loud.TP, 2)} dBTP ≥ −1`);
  const def = mixResults[0];
  check(def.loud.TP < -1, `mezcla por defecto de Reel.tsx: pico real ${fmt(def.loud.TP, 2)} dBTP < −1 dBFS`, `mezcla por defecto: pico real ${fmt(def.loud.TP, 2)} dBTP ≥ −1`);
  console.log(`  (objetivo orientativo: −20 … −16 LUFS integrados · por defecto ${fmt(def.loud.I)} LUFS · recomendada ${fmt(rec.loud.I)} LUFS)`);
}

// ───────────────────────────────────────────────────────────── (e) espectrogramas

console.log("\n(e) Espectrogramas (ffmpeg showspectrumpic) →", CHECK_DIR);
for (const name of STEMS) {
  const out = `${CHECK_DIR}/espectro-${name}.png`;
  const p = run("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", "-i", `${AUDIO_DIR}${name}.wav`, "-lavfi", "showspectrumpic=s=1500x560:legend=1:scale=log:fscale=log:stop=20000:mode=combined", out]);
  console.log(`  ${p.status === 0 ? "✓" : "✗"} ${out}`);
  if (p.status !== 0) fail(`no se pudo generar el espectrograma de ${name}: ${p.err.trim()}`);
}
{
  const out = `${CHECK_DIR}/espectro-mezcla-recomendada.png`;
  const p = run("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", "-i", `${CHECK_DIR}/mezcla-recomendada.wav`, "-lavfi", "showspectrumpic=s=1500x560:legend=1:scale=log:fscale=log:stop=20000:mode=combined", out]);
  console.log(`  ${p.status === 0 ? "✓" : "✗"} ${out}`);
}

console.log(failures === 0 ? "\nVERIFICACIÓN OK" : `\nVERIFICACIÓN CON ${failures} FALLA(S)`);
process.exit(failures === 0 ? 0 : 1);
