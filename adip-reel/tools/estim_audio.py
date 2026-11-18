"""Original music bed + subtle sound design for the Estimulación reel.

Everything is synthesised here (no samples, no downloads), so there is no licence to clear.
usage: estim_audio.py <outdir>   -> music.wav, sfx.wav (48 kHz stereo, 36.4 s)
"""
import sys, wave
import numpy as np

SR = 48000
DUR = 36.4
N = int(SR * DUR)
rng = np.random.default_rng(7)


def buf():
    return np.zeros((N, 2), dtype=np.float64)


def add(dst, sig, t, gain=1.0, pan=0.0):
    i = int(round(t * SR))
    if i >= N or i < 0:
        return
    sig = sig[: N - i]
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    dst[i : i + len(sig), 0] += sig * gain * l
    dst[i : i + len(sig), 1] += sig * gain * r


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def tt(d):
    return np.arange(int(d * SR)) / SR


def onepole_lp(x, fc):
    a = np.exp(-2 * np.pi * fc / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc = (1 - a) * v + a * acc
        y[i] = acc
    return y


def fft_band(x, lo, hi):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    m = 1 / (1 + (lo / np.maximum(f, 1)) ** 6) * 1 / (1 + (f / hi) ** 6)
    return np.fft.irfft(X * m, len(x))


# ---------------- instruments ----------------
def pluck(n, d=1.1, bright=1.0):
    """soft kalimba / music-box style note"""
    f = midi(n)
    t = tt(d)
    s = np.sin(2 * np.pi * f * t) * np.exp(-t * 4.2)
    s += 0.32 * bright * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 7)
    s += 0.14 * bright * np.sin(2 * np.pi * 3.01 * f * t) * np.exp(-t * 11)
    s += 0.10 * bright * np.sin(2 * np.pi * 5.4 * f * t) * np.exp(-t * 38)  # tine click
    s *= np.minimum(1, t / 0.004)
    return s


def pad(notes, d):
    t = tt(d)
    s = np.zeros_like(t)
    for n in notes:
        f = midi(n)
        for det in (-0.35, 0.3):
            ff = f * 2 ** (det / 100)
            s += np.sin(2 * np.pi * ff * t + rng.uniform(0, 6.28)) + 0.25 * np.sin(2 * np.pi * 2 * ff * t)
    env = np.minimum(1, t / 0.7) * np.minimum(1, (d - t) / 0.9)
    return s * env / len(notes)


def bass(n, d=0.55):
    f = midi(n)
    t = tt(d)
    s = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2 * f * t)
    return s * np.minimum(1, t / 0.012) * np.exp(-t * 3.2)


def kick():
    t = tt(0.22)
    f = 48 + 60 * np.exp(-t * 28)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 16)


def shaker(d=0.07):
    t = tt(d)
    x = fft_band(rng.standard_normal(len(t)), 5000, 11000)
    return x * np.exp(-t * 55) * np.minimum(1, t / 0.006)


def fsnap():
    t = tt(0.12)
    x = fft_band(rng.standard_normal(len(t)), 1300, 4200)
    return x * np.exp(-t * 60)


# ---------------- music ----------------
BEAT = 0.6
T0 = 1.2  # bar 0; bars land on the cuts at 6.0 / 10.8 / 18.0 / 27.6
# F  Dm7  Bbmaj7  C   (warm, light)
CH = {
    "F": dict(root=41, tones=[65, 69, 72, 77], padn=[53, 57, 60]),
    "Dm": dict(root=38, tones=[62, 65, 69, 74], padn=[50, 53, 57, 60]),
    "Bb": dict(root=46, tones=[65, 70, 74, 77], padn=[46 + 12, 62, 65, 69]),
    "C": dict(root=36, tones=[64, 67, 72, 76], padn=[48, 55, 60, 64]),
    "Am": dict(root=45, tones=[64, 69, 72, 76], padn=[57, 60, 64]),
}
PROG = ["F", "Dm", "Bb", "C", "F", "Am", "Bb", "C", "F", "Dm", "Bb", "C", "Bb", "C"]
ARPS = [[0, 2, 1, 3, 2, 1, 3, 2], [0, 1, 2, 3, 1, 2, 3, 1], [3, 2, 1, 2, 0, 2, 1, 3]]


def music():
    plk, pd, bs, dr = buf(), buf(), buf(), buf()
    # pickup into bar 0, right after the snap
    add(plk, pluck(72), 0.6, 0.5, -0.2)
    add(plk, pluck(77), 0.9, 0.55, 0.2)
    for b, name in enumerate(PROG):
        c = CH[name]
        t = T0 + b * 4 * BEAT
        full = 2 <= b <= 6 or 8 <= b <= 12
        brk = b == 7  # JUGAR · MIRAR · HABLAR · RESPONDER
        last = b == 13
        add(pd, pad(c["padn"], 4 * BEAT + 0.8), t - 0.1, 0.5)
        arp = ARPS[b % 3]
        for k in range(8):
            tk = t + k * BEAT / 2
            if last and k >= 6:
                continue
            if brk:
                if k % 2 == 0:  # one bright note per word
                    add(plk, pluck(c["tones"][k // 2], 1.3, 1.3), tk, 0.9, (-0.3, 0.3, -0.15, 0.15)[k // 2])
                    add(plk, pluck(c["tones"][k // 2] - 12, 1.3), tk, 0.5, 0)
                continue
            if b < 2 and k in (3, 6):  # sparse intro
                continue
            vel = (0.75, 0.42, 0.55, 0.4, 0.68, 0.42, 0.55, 0.45)[k] * (0.85 + 0.25 * rng.random())
            swing = 0.018 if k % 2 else 0
            add(plk, pluck(c["tones"][arp[k]], 1.0, 0.9 + 0.3 * (k % 4 == 0)), tk + swing, vel, 0.35 * np.sin(k * 1.7 + b))
            if full:
                add(dr, shaker(), tk + swing, 0.20 if k % 2 else 0.11, 0.3)
        if full or last:
            add(bs, bass(c["root"]), t, 0.9)
            add(bs, bass(c["root"]), t + 1.5 * BEAT, 0.55)
            add(bs, bass(c["root"] + 7), t + 2.5 * BEAT, 0.5)
            add(dr, kick(), t, 0.75)
            add(dr, kick(), t + 2 * BEAT, 0.55)
        if 8 <= b <= 12:
            add(dr, fsnap(), t + BEAT, 0.16, -0.25)
            add(dr, fsnap(), t + 3 * BEAT, 0.18, -0.25)
    # final chord on the end card
    te = T0 + 13 * 4 * BEAT + 3 * BEAT  # 34.2
    for i, n in enumerate([53, 60, 65, 69, 72, 77]):
        add(plk, pluck(n, 2.4, 1.1), te + i * 0.035, 0.6, (i - 2.5) / 4)
    add(pd, pad([53, 57, 60, 65], 2.3), te, 0.55)
    add(bs, bass(41, 1.6), te, 0.9)

    # room: decaying-noise impulse response
    ir_t = tt(1.5)
    wet = buf()
    for ch in range(2):
        ir = rng.standard_normal(len(ir_t)) * np.exp(-ir_t * 4.5)
        ir = fft_band(ir, 300, 6000)
        src = plk[:, ch] + 0.5 * pd[:, ch]
        wet[:, ch] = np.fft.irfft(np.fft.rfft(src, N + len(ir)) * np.fft.rfft(ir, N + len(ir)))[:N]
    wet *= 0.2 / (np.abs(wet).max() + 1e-9) * np.abs(plk).max()
    mix = 0.62 * plk + 0.16 * pd + 0.42 * bs + 0.5 * dr + wet
    for ch in range(2):
        mix[:, ch] = fft_band(mix[:, ch], 35, 9500)
    t = np.arange(N) / SR
    mix *= np.minimum(1, t / 0.05)[:, None] * np.clip((DUR - 0.05 - t) / 1.3, 0, 1)[:, None] ** 1.5
    return mix / np.abs(mix).max() * 0.7


# ---------------- sound design ----------------
def whoosh(d=0.5):
    t = tt(d)
    x = rng.standard_normal(len(t))
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    out = np.zeros(len(t))
    for k in range(8):  # band sweeps upward in 8 overlapping slices
        fc = 350 * (9 ** (k / 7))
        band = np.fft.irfft(X * np.exp(-0.5 * ((np.log(np.maximum(f, 1) / fc)) / 0.35) ** 2), len(t))
        w = np.exp(-0.5 * ((t / d - (k + 0.5) / 8) / 0.14) ** 2)
        out += band * w
    return out * np.sin(np.pi * np.minimum(1, t / d)) ** 1.5


def pop(f0=520, f1=880, d=0.09):
    t = tt(d)
    f = f0 + (f1 - f0) * (t / d) ** 0.5
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 34) * np.minimum(1, t / 0.003)


def snap_layer():
    t = tt(0.09)
    x = fft_band(rng.standard_normal(len(t)), 1800, 5200) * np.exp(-t * 85)
    x[: int(0.002 * SR)] *= 2.2
    return x


def sfx():
    s = buf()
    add(s, snap_layer(), 0.243, 0.55, -0.3)  # reinforce the finger snap
    add(s, pop(300, 700, 0.14), 0.25, 0.12)
    add(s, whoosh(0.5), 3.93, 0.20)  # circle into the counter plate
    # counter: ticks that start fast and slow down, rising in pitch
    for i in range(22):
        p = i / 21
        tk = 4.36 + 0.92 * (1 - (1 - p) ** 0.45)
        add(s, pop(700 + 500 * p, 760 + 520 * p, 0.03), tk, 0.035 + 0.03 * p, 0.4 * np.sin(i))
    add(s, pop(440, 1320, 0.2), 5.31, 0.15)
    add(s, pluck(84, 0.9, 1.4), 5.31, 0.10)
    for k in range(9):  # connections being linked on the wall
        add(s, pop(600 + 60 * k, 900 + 60 * k, 0.05), 9.36 + k * 0.12, 0.04, 0.5 * np.sin(k))
    add(s, whoosh(0.35), 21.95, 0.10)  # into the arc
    for tp, g in [(0.62, 0.07), (0.92, 0.07), (22.12, 0.08), (28.74, 0.08), (6.43, 0.07), (6.7, 0.07), (10.8, 0.05), (18.03, 0.08), (18.51, 0.08), (19.03, 0.08), (19.71, 0.09), (21.4, 0.09), (23.35, 0.06), (32.2, 0.08), (34.34, 0.07)]:
        add(s, pop(), tp, g)
    add(s, whoosh(0.55), 33.66, 0.20)  # circle into the end card
    return s


def save(path, x):
    x = np.clip(x, -1, 1)
    w = wave.open(path, "wb")
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((x * 32767).astype("<i2").tobytes()); w.close()


if __name__ == "__main__":
    out = sys.argv[1]
    save(f"{out}/music.wav", music())
    save(f"{out}/sfx.wav", sfx())
    print("ok")
