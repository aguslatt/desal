#!/usr/bin/env python3
"""Música original (sintetizada, sin derechos) + SFX para el reel Halloween ADIP. 120 bpm, La menor armónica."""
import sys, wave, math
import numpy as np

SR = 44100; DUR = 26.0; BEAT = 0.5
N = int(SR * (DUR + 1)); L = np.zeros(N); R = np.zeros(N)
rng = np.random.default_rng(7)

def add(sig, t0, gain=1.0, pan=0.5):
    i = int(t0 * SR)
    if i >= N: return
    sig = sig[: N - i]
    L[i:i + len(sig)] += sig * gain * (1 - pan) * 1.4
    R[i:i + len(sig)] += sig * gain * pan * 1.4

def tt(d): return np.arange(int(SR * d)) / SR
def lp(x, cut):
    a = np.broadcast_to(1 - np.exp(-2 * np.pi * np.asarray(cut, dtype=float) / SR), x.shape)
    y = np.zeros_like(x); s = 0.0
    for i in range(len(x)):
        s += a[i] * (x[i] - s); y[i] = s
    return y

def kick():
    t = tt(0.32); f = 45 + 90 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 11)
def clap():
    t = tt(0.16); n = rng.standard_normal(len(t)); n = n - lp(n, 900)
    return n * (np.exp(-t * 28) * 0.8 + 0.2 * np.exp(-((t - 0.012) ** 2) * 9e4)) * 0.5
def hat():
    t = tt(0.05); n = rng.standard_normal(len(t)); n = n - lp(n, 6000)
    return n * np.exp(-t * 90) * 0.35
def bass(f):
    t = tt(0.4); s = np.sin(2 * np.pi * f * t) + 0.5 * np.sin(4 * np.pi * f * t) + 0.25 * np.sin(6 * np.pi * f * t)
    return s * np.exp(-t * 7) * (1 - np.exp(-t * 400)) * 0.55
def marimba(f):
    t = tt(0.5)
    s = np.sin(2 * np.pi * f * t) * np.exp(-t * 9) + 0.35 * np.sin(2 * np.pi * 4 * f * t) * np.exp(-t * 28)
    return s * 0.5
def bell(f, d=1.6):
    t = tt(d)
    s = sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t * k) for a, r, k in [(1, 1, 2.2), (0.5, 2.76, 3.5), (0.25, 5.4, 6)])
    return s * 0.3 * (1 - np.exp(-t * 600))
def pop():
    t = tt(0.12); f = 260 + 900 * np.exp(-t * 55)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 38) * 0.55
def whoosh(d=0.7, up=True):
    t = tt(d); n = rng.standard_normal(len(t))
    ph = t / d; cut = 400 + 5200 * (np.sin(np.pi * ph) ** 2)
    y = lp(n, cut); y = y - lp(y, 250)
    return y * np.sin(np.pi * np.clip(ph, 0, 1)) ** 1.5 * 0.9
def ghost(d=1.1):
    t = tt(d); f = 330 + 160 * (t / d) + 14 * np.sin(2 * np.pi * 6 * t)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / d) ** 2 * 0.22
def sweep(d=1.0):
    t = tt(d); f = 220 * 2 ** (2.0 * t / d)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * (t / d) ** 1.5 * 0.35
def tok(f=1500):
    t = tt(0.12)
    return (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.3 * t)) * np.exp(-t * 55) * 0.5
def thump():
    t = tt(0.35); f = 40 + 40 * np.exp(-t * 25)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9) * 0.8
def riser(d=1.0):
    t = tt(d); n = rng.standard_normal(len(t)); y = lp(n, 300 + 7000 * (t / d) ** 2)
    return y * (t / d) ** 2 * 0.5

# acordes por compás (4 pulsos): Am, F, Dm, E
ROOT = [110.0, 87.31, 73.42, 82.41]
CH = [[440, 523.25, 659.26], [349.23, 440, 523.25], [293.66, 349.23, 440], [329.63, 415.30, 493.88]]
PAT = [0, 1, 2, 1, 2, 1, 0, 2]

# apertura: clicks sobre los cortes + riser
add(sweep(1.0), 0.0, 0.5)
for k in range(4): add(clap(), k * 0.25, 0.5, 0.5); add(pop(), k * 0.25, 0.25, 0.5)

t = 1.0
nb = int(DUR / BEAT)
for b in range(nb):
    tb = b * BEAT
    if tb < 1.0: continue
    bar, beat = divmod(b, 4); ch = bar % 4
    outro = tb >= 22.0
    if not outro: add(kick(), tb, 0.9, 0.5)
    add(hat(), tb + BEAT / 2, 0.5 if not outro else 0.3, 0.62)
    if beat in (1, 3) and tb >= 4.0 and not outro: add(clap(), tb, 0.7, 0.5)
    for e in range(2):
        te = tb + e * BEAT / 2
        ei = (b % 4) * 2 + e
        # bajo
        f = ROOT[ch] * (2 if (beat == 2 and e == 1) else 1)
        if not outro or beat % 2 == 0: add(bass(f), te, 0.8 if e == 0 else 0.5, 0.5)
        # arpegio marimba
        if te >= 2.0:
            note = CH[ch][PAT[ei]] * (2 if (bar % 2 == 1 and ei == 6) else 1)
            add(marimba(note), te, 0.55 if e == 0 else 0.4, 0.35 + 0.3 * ((ei % 3) / 2))
    # campana en el primer pulso de cada compás
    if beat == 0 and tb >= 4.0: add(bell(CH[ch][2] * 2), tb, 0.45, 0.65)
    # caída cromática "misteriosa" al final de cada 4 compases
    if bar % 4 == 3 and beat == 2 and tb >= 6.0:
        for k, f in enumerate([1318.5, 1244.5, 1174.7, 880.0]): add(bell(f, 0.9), tb + k * 0.25, 0.4, 0.5)

# fantasmita al aparecer el título
add(ghost(), 0.95, 0.6, 0.4)
add(bell(1318.5, 2.0), 1.0, 0.5, 0.5)

# SFX: transiciones musicales (glissando de marimba/campana + golpe grave suave)
SC = [440.0, 493.88, 523.25, 659.26, 783.99, 880.0, 987.77, 1046.5, 1318.5]  # La menor (armónica)
def gliss(tx, n=5, step=0.045, start=0, g=0.5):
    for i in range(n):
        f = SC[min(start + i, len(SC) - 1)]
        add(marimba(f), tx - 0.04 - (n - 1 - i) * step, g * (0.6 + 0.4 * i / max(1, n - 1)), 0.3 + 0.4 * i / max(1, n - 1))
    add(bell(SC[min(start + n - 1, len(SC) - 1)] * 2, 1.0), tx - 0.02, 0.25, 0.5)
    add(thump(), tx, 0.5, 0.5)
for tx, n, st in [(1.0, 4, 1), (4.0, 5, 0), (6.5, 4, 2), (9.5, 7, 0), (12.5, 5, 1), (17.0, 5, 0), (19.5, 6, 0)]:
    gliss(tx, n, 0.045, st)
# toques suaves (marimba/woodblock) al aparecer elementos
for tp in [1.08, 1.24, 1.40, 5.4, 7.05, 10.5, 11.0, 13.0, 13.12, 13.26, 13.4, 14.0, 14.5, 15.0, 17.0, 17.5, 18.0, 20.4, 20.6, 20.8]:
    add(tok(1250 + 120 * ((int(tp * 10)) % 4)), tp, 0.4, 0.5)
# logo final
add(bell(880, 3.5), 22.1, 0.7, 0.5); add(bell(1318.5, 3.5), 22.1, 0.4, 0.5); add(bell(1760, 3.5), 22.6, 0.4, 0.5)

# fade de salida
n = int(DUR * SR)
fade = np.ones(N); k = int(1.4 * SR); fade[n - k:n] = np.linspace(1, 0, k); fade[n:] = 0
L *= fade; R *= fade
m = max(np.abs(L).max(), np.abs(R).max()); L /= m * 1.05; R /= m * 1.05
st = np.stack([L[:n], R[:n]], 1)
with wave.open(sys.argv[1], "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((st * 32767).astype("<i2").tobytes())
print("ok")
