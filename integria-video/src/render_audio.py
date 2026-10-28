"""Audio: la voz original (sin cambiar velocidad ni contenido) + cama musical instrumental propia + SFX discretos.

- Nivelación entre las dos voces por turnos (ganancia suave en los silencios entre turnos).
- Limpieza liviana: pasa-altos, un toque de EQ, compresión suave, normalización -16 LUFS (sin gate ni denoise agresivo).
- Música: composición instrumental generada en código (sin derechos de terceros), muy por debajo del diálogo, con ducking.
- SFX: whoosh sólo en los 3 cambios de tema + campanita suave en el cierre.
"""
import json, os, subprocess, sys
import numpy as np
import soundfile as sf
from scipy import signal
import config as C

WORK = os.environ.get("INTEGRIA_WORK", os.path.join(C.ROOT, "work"))
SRC = os.environ.get("INTEGRIA_SRC", os.path.join(WORK, "src.mp4"))
SR = 48000
N = int(round(C.DURATION * SR))


def sh(cmd):
    subprocess.run(cmd, check=True)


def load_src():
    p = os.path.join(WORK, "a48.wav")
    sh(["ffmpeg", "-v", "error", "-y", "-i", SRC, "-vn", "-ac", "1", "-ar", str(SR), "-c:a", "pcm_f32le", p])
    x, _ = sf.read(p, dtype="float32")
    return x


def turns():
    # turnos de habla (segundos, verificados contra la transcripción)
    return [("R", 0.0, 7.30), ("L", 7.34, 23.00), ("R", 23.20, 32.14), ("L", 32.36, 48.40)]


def active_rms_db(x, t0, t1):
    seg = x[int(t0 * SR):int(t1 * SR)]
    win = int(0.05 * SR)
    r = np.array([np.sqrt(np.mean(seg[i:i + win] ** 2)) for i in range(0, len(seg) - win, win)])
    r = r[20 * np.log10(r + 1e-9) > -42]
    return 20 * np.log10(np.sqrt(np.mean(r ** 2)) + 1e-9)


def level_voices(x):
    tr = turns()
    lv = {k: [] for k in "LR"}
    for who, a, b in tr:
        lv[who].append(active_rms_db(x, a, b))
    m = {k: float(np.mean(v)) for k, v in lv.items()}
    tgt = (m["L"] + m["R"]) / 2
    gains = {k: float(np.clip(tgt - m[k], -5, 5)) for k in m}
    print("niveles por voz (dBFS RMS activo):", {k: round(v, 1) for k, v in m.items()}, "-> ganancias dB:", {k: round(v, 2) for k, v in gains.items()})
    g = np.zeros(len(x), np.float32)
    # ganancia por turno, con transición suave de 160 ms en el centro de cada pausa entre turnos
    pts = [(0.0, gains[tr[0][0]])]
    for i in range(1, len(tr)):
        mid = (tr[i - 1][2] + tr[i][1]) / 2
        pts.append((mid, gains[tr[i][0]]))
    for i, (tm, gdb) in enumerate(pts):
        a = int(tm * SR)
        g[a:] = gdb
    k = int(0.16 * SR)
    g = np.convolve(np.pad(g, (k, k), mode="edge"), np.ones(k) / k, mode="same")[k:-k]
    return x * (10 ** (g / 20)).astype(np.float32)


def ffmpeg_voice(inp, out):
    af = ("highpass=f=75,equalizer=f=240:t=q:w=1.2:g=-1.5,equalizer=f=3200:t=q:w=1.0:g=1.8,"
          "acompressor=threshold=-22dB:ratio=2.2:attack=12:release=180:makeup=3,"
          "loudnorm=I=-16:TP=-1.5:LRA=9")
    sh(["ffmpeg", "-v", "error", "-y", "-i", inp, "-af", af, "-ar", str(SR), "-c:a", "pcm_f32le", out])


# ------------------------------------------------------------------ música
def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def lowpass(x, fc, order=2):
    sos = signal.butter(order, fc / (SR / 2), btype="low", output="sos")
    return signal.sosfilt(sos, x)


def music(duration):
    n = int(duration * SR)
    out = np.zeros(n, np.float32)
    bpm = 76
    beat = 60 / bpm
    bar = beat * 4
    chords = [[50, 54, 57, 61, 64], [47, 54, 57, 62, 66], [43, 50, 54, 59, 62], [45, 52, 57, 61, 64]]  # Dmaj9 Bm9 Gmaj7 A
    arps = [[74, 78, 81, 85, 81, 78], [74, 78, 81, 86, 81, 78], [71, 74, 78, 83, 78, 74], [73, 76, 81, 85, 81, 76]]
    nchords = int(duration / (bar * 2)) + 2
    t = np.arange(n) / SR
    pad = np.zeros(n, np.float32)
    plk = np.zeros(n, np.float32)
    for ci in range(nchords):
        t0 = ci * bar * 2
        if t0 >= duration:
            break
        notes = chords[ci % 4]
        dur = bar * 2 + 2.2
        i0 = int(t0 * SR)
        i1 = min(n, i0 + int(dur * SR))
        tt = np.arange(i1 - i0) / SR
        env = np.minimum(1, tt / 1.6) * np.clip((dur - tt) / 2.0, 0, 1)
        env = env ** 1.5
        for nt in notes:
            f = midi(nt)
            sig = np.zeros(i1 - i0)
            for det in (-7, 0, 7):
                ff = f * 2 ** (det / 1200)
                sig += signal.sawtooth(2 * np.pi * ff * tt) * 0.33
            sig += np.sin(2 * np.pi * f * tt) * 0.4
            pad[i0:i1] += (sig * env * 0.18).astype(np.float32)
        # arpeggio sparse: una nota cada 1.5 beats
        ar = arps[ci % 4]
        k = 0
        tt0 = t0 + beat * 0.5
        while tt0 < t0 + bar * 2 and tt0 < duration:
            f = midi(ar[k % len(ar)])
            j0 = int(tt0 * SR)
            j1 = min(n, j0 + int(2.0 * SR))
            q = np.arange(j1 - j0) / SR
            note = (np.sin(2 * np.pi * f * q) + 0.28 * np.sin(2 * np.pi * 2 * f * q) + 0.08 * np.sin(2 * np.pi * 3 * f * q)) * np.exp(-q / 0.55)
            note *= np.minimum(1, q / 0.006)
            plk[j0:j1] += (note * 0.11).astype(np.float32)
            tt0 += beat * 1.5
            k += 1
    pad = lowpass(pad, 1500)
    dly = int(beat * 0.75 * SR)
    echo = plk.copy()
    for r in range(1, 5):
        echo[r * dly:] += plk[:-r * dly] * (0.38 ** r)
    mix = pad + lowpass(echo, 5200)
    # reverb sintética
    rng = np.random.default_rng(7)
    ir_t = np.arange(int(2.6 * SR)) / SR
    ir = rng.standard_normal(len(ir_t)) * np.exp(-ir_t / 0.75)
    ir = lowpass(ir, 4200)
    wet = signal.fftconvolve(mix, ir)[:n].astype(np.float32)
    wet /= (np.abs(wet).max() + 1e-9)
    mix = mix / (np.abs(mix).max() + 1e-9)
    mix = 0.72 * mix + 0.28 * wet
    fade = np.minimum(1, t / 1.4) * np.clip((duration - t) / 1.6, 0, 1)
    return (mix * fade).astype(np.float32)


def voice_envelope(v):
    """Envolvente suave de la voz para el ducking de la música."""
    a = np.abs(v)
    k = int(0.05 * SR)
    r = np.sqrt(np.convolve(a ** 2, np.ones(k) / k, mode="same"))
    d = 20 * np.log10(r + 1e-9)
    e = np.clip((d + 48) / 16, 0, 1)          # 0 silencio, 1 voz presente
    # ataque rápido / relajación lenta
    out = np.zeros_like(e)
    ac, rc = np.exp(-1 / (0.08 * SR)), np.exp(-1 / (0.45 * SR))
    cur = 0.0
    for i in range(0, len(e), 24):
        tgt = e[i]
        cur = tgt + (cur - tgt) * (ac if tgt > cur else rc) ** 24
        out[i:i + 24] = cur
    return out


def whoosh(center, dur=0.75):
    n = int(dur * SR)
    rng = np.random.default_rng(int(center * 100))
    nz = rng.standard_normal(n)
    t = np.arange(n) / SR
    sweep = np.zeros(n)
    bands = [(300, 900), (900, 2400), (2400, 6000)]
    for i, (lo, hi) in enumerate(bands):
        sos = signal.butter(2, [lo / (SR / 2), hi / (SR / 2)], btype="band", output="sos")
        b = signal.sosfilt(sos, nz)
        w = np.exp(-((t - (0.25 + 0.18 * i)) ** 2) / (2 * 0.11 ** 2))
        sweep += b * w
    env = np.exp(-((t - dur * 0.5) ** 2) / (2 * (dur * 0.2) ** 2))
    sweep = sweep * env
    return (sweep / (np.abs(sweep).max() + 1e-9)).astype(np.float32), int((center - dur * 0.5) * SR)


def chime(at):
    n = int(2.2 * SR)
    t = np.arange(n) / SR
    s = np.zeros(n)
    for f, g, d in ((659.25, 1.0, 1.1), (987.77, 0.55, 0.9), (1318.5, 0.25, 0.7)):
        s += g * np.sin(2 * np.pi * f * t) * np.exp(-t / d)
    s *= np.minimum(1, t / 0.004)
    return (s / np.abs(s).max()).astype(np.float32), int(at * SR)


def mix_all(voice):
    v = voice[:N] if len(voice) >= N else np.pad(voice, (0, N - len(voice)))
    m = music(N / SR + 0.001)[:N]
    env = voice_envelope(v)
    duck = 1.0 - 0.55 * env
    rms_m = np.sqrt(np.mean(m ** 2)) + 1e-9
    m = m / rms_m * (10 ** (-33.0 / 20))      # ~ -33 dBFS RMS de cama; la voz queda en torno a -20 dBFS RMS
    m = m * duck
    sfx = np.zeros(N, np.float32)
    for tc in C.WHOOSH_AT:
        w, i0 = whoosh(tc)
        i1 = min(N, i0 + len(w)); sfx[max(0, i0):i1] += w[max(0, -i0):i1 - i0] * 10 ** (-27 / 20)
    c, i0 = chime(C.CHIME_AT)
    i1 = min(N, i0 + len(c)); sfx[i0:i1] += c[:i1 - i0] * 10 ** (-27 / 20)
    mix = v + m + sfx
    return mix


def main():
    x = load_src()
    lv = level_voices(x)
    p_in = os.path.join(WORK, "voice_leveled.wav"); sf.write(p_in, lv, SR, subtype="FLOAT")
    p_v = os.path.join(WORK, "voice_proc.wav"); ffmpeg_voice(p_in, p_v)
    v, _ = sf.read(p_v, dtype="float32")
    if v.ndim > 1: v = v.mean(1)
    mix = mix_all(v)
    p_m = os.path.join(WORK, "mix_raw.wav"); sf.write(p_m, np.stack([mix, mix], 1), SR, subtype="FLOAT")
    out = os.path.join(WORK, "audio_final.wav")
    sh(["ffmpeg", "-v", "error", "-y", "-i", p_m, "-af", "alimiter=limit=0.89:attack=5:release=60:level=disabled", "-ar", str(SR), "-c:a", "pcm_s24le", out])
    print("audio listo", out)


if __name__ == "__main__":
    main()
