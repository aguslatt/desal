"""Synthesised, rights-free score + soft SFX for the "Taller" reel (44.1 kHz stereo wavs).
usage: python3 -I taller_audio.py OUT_DIR"""
import sys, wave, math
import numpy as np

SR = 44100
TOTAL = 58.5
out = sys.argv[1]
rng = np.random.default_rng(7)
N = int(TOTAL * SR)
tt = np.arange(N) / SR


def write(name, x):
    x = np.clip(x, -1, 1)
    pcm = (x * 32767).astype('<i2')
    with wave.open(f'{out}/{name}', 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(np.stack([pcm, pcm], 1).tobytes() if pcm.ndim == 1 else pcm.tobytes())


def put(buf, x, at):
    i = int(at * SR)
    j = min(len(buf), i + len(x))
    if i < len(buf):
        buf[i:j] += x[: j - i]


def lp(x, fc):
    a = 1 - math.exp(-2 * math.pi * fc / SR)
    y = np.empty_like(x); s = 0.0
    for i in range(len(x)):
        s += a * (x[i] - s); y[i] = s
    return y


# ---------------- SFX ----------------
def whoosh(dur, up=True, amp=0.30):
    n = int(dur * SR); x = rng.standard_normal(n)
    lo = lp(x, 500); hi = lp(x, 3800)
    k = np.linspace(0, 1, n); k = k if up else k[::-1]
    y = lo * (1 - k) + hi * k
    y = y - lp(y, 120)
    env = np.sin(np.pi * np.linspace(0, 1, n)) ** 2.2
    return y * env * amp / (np.abs(y).max() + 1e-9)


def pluck(f, dur=0.9, amp=0.22):
    t = np.arange(int(dur * SR)) / SR
    y = np.sin(2 * np.pi * f * t) * np.exp(-t * 5.5) + 0.35 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 9) + 0.12 * np.sin(2 * np.pi * 3 * f * t) * np.exp(-t * 14)
    y *= np.minimum(1, t / 0.004)
    return y * amp


def bell(f, dur=1.6, amp=0.2):
    t = np.arange(int(dur * SR)) / SR
    y = sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t * d) for r, a, d in [(1, 1, 2.6), (2.76, .35, 4), (5.4, .12, 6)])
    return y * np.minimum(1, t / 0.003) * amp


def thump(dur=0.5, amp=0.35):
    t = np.arange(int(dur * SR)) / SR
    f = 95 * np.exp(-t * 7) + 45
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7.5) * amp


sfx = np.zeros(N)
put(sfx, thump(), 0.0); put(sfx, whoosh(0.7, True, 0.16), 0.0)        # hook accent
put(sfx, pluck(660, 0.7, 0.10), 2.05)                                   # list starts
for a in (9.28, 15.98): put(sfx, whoosh(0.62, True, 0.26), a)             # colour-block wipes
for a in (18.5, 24.95, 29.2, 42.95, 48.62):                              # panels slide in
    put(sfx, whoosh(0.5, False, 0.17), a); put(sfx, pluck(523.25, 0.7, 0.10), a + 0.38)
put(sfx, bell(987.8, 1.4, 0.13), 50.34)                                  # INFO
put(sfx, whoosh(0.95, True, 0.30), 52.62)                                # ribbons to close
put(sfx, pluck(659.25, 1.4, 0.16), 53.65); put(sfx, pluck(987.8, 1.6, 0.11), 53.8)
put(sfx, pluck(523.25, 0.6, 0.08), 55.35)                                # button
write('sfx.wav', sfx)

# ---------------- music: warm, contemporary, low ----------------
BPM = 92; beat = 60 / BPM; bar = 4 * beat
mid = lambda m: 440 * 2 ** ((m - 69) / 12)
chords = [[48, 55, 59, 64], [45, 52, 55, 60], [41, 48, 52, 57], [43, 50, 53, 59]]  # Cmaj7(add9) Am7 Fmaj7 G(sus)
mus = np.zeros(N)
nb = int(TOTAL / bar) + 2
for b in range(nb):
    ch = chords[b % 4]; t0 = b * bar
    # pad: soft detuned triangles, slow swell
    for m in ch + [ch[0] + 12 + 7]:
        f = mid(m + 12)
        n = int((bar + 0.6) * SR); t = np.arange(n) / SR
        y = (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 1.004 * t) + 0.2 * np.sin(2 * np.pi * 2 * f * t))
        env = np.minimum(1, t / 0.5) * np.minimum(1, (bar + 0.6 - t) / 0.6)
        put(mus, y * env * 0.020, t0)
    # bass on 1 and 3
    for k in (0, 2):
        f = mid(ch[0] - 12); t = np.arange(int(beat * 1.9 * SR)) / SR
        put(mus, np.sin(2 * np.pi * f * t) * np.exp(-t * 1.8) * np.minimum(1, t / 0.01) * 0.20, t0 + k * beat)
    # rhodes-like arpeggio (from the workshop title onward) and shaker (from the guest's explanation)
    if t0 >= 9.3 and t0 < 53.3:
        pat = [0, 1, 2, 3, 2, 1, 2, 1]
        for k, p in enumerate(pat):
            f = mid(ch[p] + 12); t = np.arange(int(1.0 * SR)) / SR
            y = np.sin(2 * np.pi * f * t + 1.6 * np.exp(-t * 7) * np.sin(2 * np.pi * f * t)) * np.exp(-t * 3.6)
            put(mus, y * 0.085 * (1.0 if k % 2 == 0 else 0.7), t0 + k * beat / 2)
    if t0 >= 16.2 and t0 < 53.3:
        for k in range(8):
            if k % 2 == 1:
                n = int(0.05 * SR); s = rng.standard_normal(n); s = s - lp(s, 4000)
                put(mus, s * np.exp(-np.linspace(0, 9, n)) * 0.05, t0 + k * beat / 2)
# resolve: hold Cmaj7 at the close, fade at the very end
fade = np.clip((TOTAL - tt) / 2.6, 0, 1)
fade_in = np.clip(tt / 1.5, 0, 1)
mus = mus * fade * fade_in
mus = mus / (np.abs(mus).max() + 1e-9) * 0.5
write('music.wav', mus)
print('ok')
