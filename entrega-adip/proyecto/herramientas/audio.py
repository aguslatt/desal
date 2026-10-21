#!/usr/bin/env python3
"""Banda sonora completa de la pieza:
   1) voz: se edita con los mismos segmentos que la imagen (fundidos de 12 ms solo donde hay un corte real),
      limpieza de ruido, compresión suave y realce de presencia
   2) base musical original (sintetizada: sin muestras ni licencias de terceros): pad cálido + bajo + pulsos suaves
   3) diseño sonoro sutil (pocos efectos, solo donde acompañan un movimiento gráfico)
   4) mezcla: la música baja bajo la voz (ducking) y todo se normaliza a −16 LUFS
Uso: audio.py VIDEO_ORIGINAL SALIDA.wav"""
import sys, json, subprocess, wave
from pathlib import Path
import numpy as np
from scipy import signal

AQUI = Path(__file__).resolve().parent.parent
SRC, SALIDA = sys.argv[1], Path(sys.argv[2])
PLAN = json.loads((AQUI / "plan.json").read_text()); MON = json.loads((AQUI / "montaje.json").read_text(encoding="utf-8"))
FPS = PLAN["fps"]; SR = 48000
TOTAL = PLAN["total_frames"] / FPS
TMP = SALIDA.parent / "audio_tmp"; TMP.mkdir(parents=True, exist_ok=True)

def s2o(ts):
    for s in PLAN["segs"]:
        if s["src_in"] - 1e-4 <= ts <= s["src_out"] + 1e-4: return (s["out_start_f"] + (ts - s["src_in"]) * FPS) / FPS
    for s in PLAN["segs"]:
        if ts < s["src_in"]: return s["out_start_f"] / FPS
    return PLAN["video_frames"] / FPS

# ---------------------------------------------------------------- 1) VOZ
segs = PLAN["segs"]; partes = []; cadena = []
for i, s in enumerate(segs):
    dur = s["n"] / FPS; a0 = s["src_in"] - s.get("audio_adelanto", 0.0)
    cont_ant = i > 0 and abs(segs[i - 1]["src_out"] - s["src_in"]) < 0.04 and not s.get("audio_adelanto")
    cont_sig = i + 1 < len(segs) and abs(s["src_out"] - segs[i + 1]["src_in"]) < 0.04 and not segs[i + 1].get("audio_adelanto")
    f = [f"atrim=start={a0:.4f}:duration={dur:.4f}", "asetpts=PTS-STARTPTS"]
    if not cont_ant: f.append("afade=t=in:st=0:d=0.012")
    if not cont_sig: f.append(f"afade=t=out:st={dur - 0.012:.4f}:d=0.012")
    cadena.append(f"[0:a]{','.join(f)}[v{i}]"); partes.append(f"[v{i}]")
voz_fc = (";".join(cadena) + f";{''.join(partes)}concat=n={len(segs)}:v=0:a=1,"
          "highpass=f=75,afftdn=nr=7:nf=-38,acompressor=threshold=-22dB:ratio=2.4:attack=12:release=200:makeup=2.5,"
          "equalizer=f=3200:t=q:w=1.1:g=1.6,equalizer=f=220:t=q:w=1.0:g=-1.2,"
          f"aresample={SR},aformat=channel_layouts=mono,apad=whole_dur={TOTAL:.3f}[voz]")
subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", SRC, "-filter_complex", voz_fc, "-map", "[voz]", "-t", f"{TOTAL:.3f}", "-ar", str(SR), str(TMP / "voz.wav")], check=True)

# ---------------------------------------------------------------- utilidades de síntesis
N = int(TOTAL * SR) + SR; t = np.arange(N) / SR
def suave(x): x = np.clip(x, 0, 1); return x * x * (3 - 2 * x)
def hz(m): return 440 * 2 ** ((m - 69) / 12)
rng = np.random.default_rng(11)

# ---------------------------------------------------------------- 2) MÚSICA (≈ 98 BPM, cálida, con pulso suave)
BPM = 98; beat = 60 / BPM; bar = 4 * beat
prog = [[48, 55, 59, 64], [45, 52, 55, 60], [41, 48, 52, 57], [43, 50, 55, 59]]     # Cmaj7 · Am7 · Fmaj7 · G6
L = np.zeros(N); R = np.zeros(N)
def poner(x, i0, pan=0.5):
    n = min(len(x), N - i0)
    if n > 0: L[i0:i0 + n] += x[:n] * (1 - pan) * 1.4; R[i0:i0 + n] += x[:n] * pan * 1.4

k = 0
while k * 2 * bar - 1.0 < TOTAL:                         # pad: colchón de acordes (2 compases c/u) con fundidos cruzados
    ini = k * 2 * bar - 1.0; largo = 2 * bar + 2.0
    env = suave((t - ini) / 1.4) * (1 - suave((t - (ini + largo - 1.6)) / 1.6))
    for m in prog[k % 4]:
        f = hz(m)
        for lado, det in ((L, 0.9988), (R, 1.0012)):
            lado += env * (np.sin(2 * np.pi * f * det * t) + .4 * np.sin(2 * np.pi * 2 * f * det * t) + .15 * np.sin(2 * np.pi * 3 * f * det * t)) * 0.045
    k += 1

b = 0
while b * beat < TOTAL:                                  # pulso: bajo suave en 1 y 3, golpe grave muy bajo, notas pulsadas en corcheas
    t0 = b * beat; acorde = prog[int(t0 // (2 * bar)) % 4]; i0 = int(t0 * SR); pos = b % 4
    if pos in (0, 2):
        f = hz(acorde[0] - 12) * (1 if pos == 0 else 1.4983)
        n = int(.55 * SR); tt = np.arange(n) / SR
        poner(np.sin(2 * np.pi * f * tt) * np.exp(-tt * 3.2) * suave(tt / .01) * 0.16, i0, .5)
        k_n = int(.22 * SR); tk = np.arange(k_n) / SR
        poner(np.sin(2 * np.pi * (46 + 62 * np.exp(-tk * 38)) * tk) * np.exp(-tk * 15) * 0.085, i0, .5)
    for sub in (0, 1):                                   # corcheas: arpegio de notas pulsadas (tipo marimba suave)
        j0 = i0 + int(sub * beat / 2 * SR)
        patron = [0, 2, 3, 2, 1, 2, 3, 2][((b % 4) * 2 + sub) % 8]
        if (b % 4 == 3 and sub == 1): continue
        f = hz(acorde[patron] + 12); n = int(.5 * SR); tt = np.arange(n) / SR
        nota = (np.sin(2 * np.pi * f * tt) + .28 * np.sin(2 * np.pi * 2 * f * tt)) * np.exp(-tt * 7.5) * suave(tt / .004) * (0.052 if sub == 0 else 0.036)
        poner(nota, j0, 0.30 if (b + sub) % 2 == 0 else 0.70)
    if True:                                             # contratiempo muy leve (shaker)
        j0 = i0 + int(beat / 2 * SR); n = int(.045 * SR)
        ruido = signal.sosfilt(signal.butter(2, 6500, "hp", fs=SR, output="sos"), rng.standard_normal(n)) * np.exp(-np.arange(n) / SR * 80) * 0.018
        poner(ruido, j0, .6)
    b += 1
musica = np.stack([L, R], 1)
musica *= (suave(t / 1.2) * (1 - suave((t - (TOTAL + .3 - 2.0)) / 2.0)))[:, None]
musica = signal.sosfilt(signal.butter(2, 3800, "lp", fs=SR, output="sos"), musica, axis=0)
musica *= 0.9 / max(np.abs(musica).max(), 1e-6)

# ---------------------------------------------------------------- 3) DISEÑO SONORO (muy puntual)
def barrido(dur, f0, f1, ancho=1.1, amp=1.0, subida=.5):
    n = int(dur * SR); x = rng.standard_normal(n)
    f, tt, Z = signal.stft(x, SR, nperseg=1024, noverlap=768)
    c = f0 * (f1 / f0) ** (tt / max(tt[-1], 1e-6))
    M = np.exp(-0.5 * ((np.log2(np.maximum(f[:, None], 1) / c[None, :])) / ancho) ** 2)
    _, y = signal.istft(Z * M, SR, nperseg=1024, noverlap=768)
    y = y[:n]; u = np.arange(len(y)) / max(len(y) - 1, 1)
    env = (u ** subida) * (1 - suave((u - .75) / .25)) if subida > 0 else (1 - u)
    return y / max(np.abs(y).max(), 1e-6) * env * amp
def pop(f0=620, dur=.16, amp=.35):
    n = int(dur * SR); tt = np.arange(n) / SR
    return np.sin(2 * np.pi * (f0 + 260 * (1 - np.exp(-tt * 40))) * tt) * np.exp(-tt * 28) * suave(tt / .003) * amp
def golpe(amp=.5):
    n = int(.5 * SR); tt = np.arange(n) / SR
    return (np.sin(2 * np.pi * (44 + 70 * np.exp(-tt * 22)) * tt) * np.exp(-tt * 7) + .12 * rng.standard_normal(n) * np.exp(-tt * 90)) * amp
def campana(amp=.28):
    n = int(2.0 * SR); tt = np.arange(n) / SR
    return sum(a * np.sin(2 * np.pi * f * tt) * np.exp(-tt * d) for f, a, d in ((523.25, 1, 2.2), (783.99, .6, 2.6), (1046.5, .35, 3.2), (1318.5, .18, 4.0))) * suave(tt / .008) * amp
SFX = {"swell": lambda: barrido(.34, 350, 3200, subida=1.6, amp=.42), "thud": lambda: golpe(.55), "pop": lambda: pop(),
       "swish": lambda: barrido(.26, 3800, 1400, subida=.35, amp=.30), "whoosh": lambda: barrido(.62, 280, 2600, ancho=1.3, subida=1.2, amp=.55),
       "chime": lambda: campana()}
fx = np.zeros((N, 2))
eventos = [(s2o(e["t"]), e["tipo"]) for e in MON["sfx"]]
eventos.append((s2o(MON["graficos"]["cta"]["expande"]) + 0.95, "chime"))
for te, tipo in eventos:
    y = SFX[tipo](); i0 = int(te * SR); n = min(len(y), N - i0)
    pan = 0.5 + 0.12 * np.sin(te * 3.1)
    if n > 0: fx[i0:i0 + n, 0] += y[:n] * (1 - pan) * 1.4; fx[i0:i0 + n, 1] += y[:n] * pan * 1.4

def guardar(nombre, x, ch):
    with wave.open(str(TMP / nombre), "wb") as w:
        w.setnchannels(ch); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())
guardar("musica.wav", musica[: int(TOTAL * SR)], 2); guardar("efectos.wav", fx[: int(TOTAL * SR)], 2)

# ---------------------------------------------------------------- 4) MEZCLA
mezcla = (f"[1:a]volume=-19dB[mus];[2:a]volume=-15dB[fx];[0:a]aformat=channel_layouts=stereo,asplit=2[v1][v2];"
          f"[mus][v1]sidechaincompress=threshold=0.02:ratio=3.2:attack=35:release=650:makeup=1[musd];"
          f"[v2][musd][fx]amix=inputs=3:normalize=0:duration=longest,loudnorm=I=-16:TP=-1.5:LRA=8,aresample={SR},atrim=0:{TOTAL:.3f}[sal]")
subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(TMP / "voz.wav"), "-i", str(TMP / "musica.wav"), "-i", str(TMP / "efectos.wav"),
                "-filter_complex", mezcla, "-map", "[sal]", "-t", f"{TOTAL:.3f}", "-ar", str(SR), str(SALIDA)], check=True)
print("ok", SALIDA, f"{TOTAL:.2f} s")
