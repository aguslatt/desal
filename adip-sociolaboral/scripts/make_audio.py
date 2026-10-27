"""Música original + efectos sonoros sintetizados (sin licencias de terceros) y mezcla con la voz.
Uso: python3 make_audio.py <voice_edit.wav> <out_mix.wav>"""
import sys, numpy as np
from scipy import signal
from scipy.io import wavfile

SR = 48000
TOTAL = 38.95
N = int(TOTAL * SR)
rng = np.random.default_rng(7)

def add(buf, x, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= buf.shape[1]: return
    x = x[: buf.shape[1] - i]
    l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
    buf[0, i:i + len(x)] += x * gain * l
    buf[1, i:i + len(x)] += x * gain * r

def env(n, a, d, curve=3.0):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-t * curve / max(d, 1e-3))
    return e

def tone(f, dur, a=0.005, d=0.3, h=(1, 0.35, 0.12)):
    n = int(dur * SR); t = np.arange(n) / SR
    x = sum(a_ * np.sin(2 * np.pi * f * (k + 1) * t) for k, a_ in enumerate(h))
    return x * env(n, a, d)

def lp(x, fc, order=2):
    b, a = signal.butter(order, fc / (SR / 2), 'low'); return signal.lfilter(b, a, x)
def hp(x, fc, order=2):
    b, a = signal.butter(order, fc / (SR / 2), 'high'); return signal.lfilter(b, a, x)
def bp(x, f0, bw):
    b, a = signal.butter(2, [max(20, f0 - bw) / (SR / 2), min(20000, f0 + bw) / (SR / 2)], 'band'); return signal.lfilter(b, a, x)

def whoosh(dur=0.7, up=True, peak=0.55, bright=2800):
    n = int(dur * SR); noise = rng.standard_normal(n)
    out = np.zeros(n); t = np.linspace(0, 1, n)
    for k, fc in enumerate(np.geomspace(300, bright, 7)):
        c = (k / 6) if up else (1 - k / 6)
        w = np.exp(-((t - (0.15 + 0.7 * c)) ** 2) / (2 * 0.12 ** 2))
        out += bp(noise, fc, fc * 0.6) * w
    out *= np.sin(np.pi * t) ** 1.5
    return out / (np.abs(out).max() + 1e-9) * peak

def pop(f=880, dur=0.18):
    n = int(dur * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * (f + 260 * np.exp(-t * 40)) * t) * env(n, 0.002, 0.07, 4)

def swish(dur=0.5, peak=0.25):
    n = int(dur * SR); x = hp(rng.standard_normal(n), 3500) * np.sin(np.pi * np.linspace(0, 1, n)) ** 2
    return x / (np.abs(x).max() + 1e-9) * peak

def pluck(f, dur=0.5):
    return tone(f, dur, 0.003, 0.22, (1, 0.45, 0.18, 0.06))

def boom(dur=0.9):
    n = int(dur * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * (48 + 60 * np.exp(-t * 9)) * t) * env(n, 0.003, 0.3, 4)

def chime(f, dur=1.8):
    n = int(dur * SR); t = np.arange(n) / SR
    x = np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.76 * t) + 0.25 * np.sin(2 * np.pi * f * 5.4 * t)
    return x * env(n, 0.004, 1.1, 4)

# ───────── música: C – G – Am – F, 100 bpm, evoluciona con la imagen ─────────
BPM = 100; beat = 60 / BPM; bar = 4 * beat
chords = [(261.63, 329.63, 392.0), (196.0, 246.94, 392.0), (220.0, 261.63, 329.63), (174.61, 220.0, 261.63)]
bass = [65.41, 49.0, 55.0, 43.65]
music = np.zeros((2, N))
def lvl(t):  # intensidad de la música por momento
    return np.interp(t, [0, 3, 5, 5.6, 11, 22, 27, 30, 34, 35.5, 35.7, 38.95], [0.35, 0.5, 0.6, 1.0, 1.0, 1.15, 1.05, 0.8, 0.8, 0.9, 1.25, 0.0])
nb = int(TOTAL / bar) + 1
for b in range(nb):
    t0 = b * bar
    ch = chords[b % 4]
    n = int((bar + 0.6) * SR); t = np.arange(n) / SR
    pad = sum(np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 1.004 * t) + 0.18 * np.sin(2 * np.pi * f * 2 * t) for f in ch) / 6
    pe = np.minimum(1, t / 0.5) * np.minimum(1, (bar + 0.6 - t) / 0.6)
    add(music, lp(pad, 1800) * pe * 0.5, t0, lvl(t0 + 1), pan=0)
    bs = tone(bass[b % 4] * 2, bar, 0.01, 1.0, (1, 0.25)) * 0.5
    if t0 > 4.8: add(music, bs, t0, lvl(t0), 0)
    # arpeggio de corcheas (marimba suave)
    if t0 >= bar:
        pat = [0, 1, 2, 1, 2, 1, 0, 1]
        for k in range(8):
            tt = t0 + k * beat / 2
            f = ch[pat[k]] * 2 * (2 if (k % 4 == 3) else 1)
            add(music, pluck(f, 0.55), tt, 0.16 * lvl(tt) * (0.7 + 0.3 * (k % 2 == 0)), pan=(-0.35 if k % 2 == 0 else 0.35))
    # pulso muy suave desde que entra el programa
    if t0 > 5.4:
        for k in range(4):
            tt = t0 + k * beat
            if k % 2 == 0: add(music, boom(0.35) * 0.55, tt, 0.22 * lvl(tt))
            add(music, hp(rng.standard_normal(int(0.04 * SR)), 7000) * env(int(0.04 * SR), 0.001, 0.02, 4), tt + beat / 2, 0.05 * lvl(tt), pan=0.3)
# resolución final
for k, f in enumerate([523.25, 659.25, 783.99, 1046.5]):
    add(music, chime(f, 2.6), 35.6 + k * 0.11, 0.12, pan=-0.4 + 0.27 * k)
music *= np.interp(np.arange(N) / SR, [0, 0.6, 37.5, 38.95], [0, 1, 1, 0])

# ───────── efectos (sincronizados con las entradas de chips, tarjetas y cortes) ─────────
import json, os
cuts = json.load(open(os.path.join(os.path.dirname(os.path.abspath(sys.argv[0])), '..', 'src', 'cuts.json')))
def E(src):
    for g in reversed(cuts['segs']):
        if src >= g['src'] - 0.001: return g['edit'] + min(src, g['srcEnd']) - g['src']
cut1 = E(6.45); trab = E(5.12) - .05; callout = E(7.36) - .12; calloutEnd = E(8.65) + .4
prog_, form, socio, vida = E(9.32) - .05, E(9.86) - .05, E(10.36) - .05, E(11.12) - .05
para, jov, ins, pout = E(12.48) - .1, E(13.72) - .3, E(15.9) - .15, E(17.78) - .45
capa, emp, full2 = E(18.89) - .05, E(19.83) - .25, E(23.35) - .15
red, redChip, aco, fom = E(24.53) - .1, E(25.73) - .05, E(27.25) - .2, E(28.62) - .15
empleo, p2out, cta1, cta2, te = E(29.59) - .05, E(30.25) - .15, E(35.38) - .2, E(36.7) - .12, E(38.74) - .05
outro = cuts['total'] - .05
sfx = np.zeros((2, N))
add(sfx, whoosh(0.5, True, 0.35), 0.0, 0.5)
for i in range(10): add(sfx, pop(520 + 40 * i, 0.1), 0.5 + 0.1 * i, 0.10, pan=-0.5 + 0.1 * i)
add(sfx, pop(300, 0.25), trab, 0.25); add(sfx, whoosh(0.45, False, 0.4), trab + .05, 0.45)
add(sfx, whoosh(0.7, True, 0.5), cut1 - 0.55, 0.6); add(sfx, boom(), cut1 - 0.05, 0.4); add(sfx, swish(0.6), cut1 + 0.05, 0.5)
add(sfx, pop(700, 0.12), cut1 + 0.4, 0.14)
add(sfx, whoosh(0.5, False, 0.4), callout, 0.5); add(sfx, whoosh(0.45, True, 0.3), calloutEnd, 0.4)
for tt, f in [(prog_, 560), (form, 640), (socio, 740), (vida, 880)]: add(sfx, pluck(f, 0.5), tt + .05, 0.3)
add(sfx, whoosh(0.5, True, 0.45), para, 0.5); add(sfx, whoosh(0.6, True, 0.5), jov, 0.6); add(sfx, pop(780, 0.16), jov + .35, 0.2)
add(sfx, whoosh(0.6, False, 0.45), ins, 0.5); add(sfx, pop(700, 0.16), ins + .5, 0.2)
add(sfx, whoosh(0.5, True, 0.55), pout, 0.6)
add(sfx, pop(640, 0.16), capa + .05, 0.22); add(sfx, whoosh(0.55, True, 0.45), emp, 0.55); add(sfx, pop(780, 0.16), emp + .3, 0.2)
add(sfx, whoosh(0.5, False, 0.4), full2, 0.5)
add(sfx, whoosh(0.7, True, 0.55), red - 0.1, 0.6); add(sfx, pop(560, 0.16), redChip + .05, 0.22); add(sfx, pop(620, 0.16), redChip + .17, 0.2)
add(sfx, whoosh(0.55, True, 0.45), aco, 0.55); add(sfx, pop(820, 0.16), aco + .35, 0.2)
add(sfx, whoosh(0.6, True, 0.5), fom, 0.55); add(sfx, pop(700, 0.16), empleo + .05, 0.22); add(sfx, pop(800, 0.14), empleo + .17, 0.18)
add(sfx, whoosh(0.4, True, 0.5), p2out, 0.5)
add(sfx, pop(900, 0.14), cta1 + .05, 0.24); add(sfx, pop(1100, 0.12), cta2 + .05, 0.22)
add(sfx, pluck(880, 0.5), te + .05, 0.3); add(sfx, pop(620, 0.14), te + .02, 0.15)
add(sfx, whoosh(0.7, True, 0.55), outro - 0.05, 0.65); add(sfx, boom(1.0), outro + 0.5, 0.4); add(sfx, swish(0.9), outro + 0.85, 0.5)
# toque suave en cada corte de la entrevista (acompaña el cambio de encuadre)
for g in cuts['segs'][2:]:
    if abs(g['edit'] - cut1) > 0.05: add(sfx, boom(0.25), g['edit'] - 0.02, 0.12)

# ───────── mezcla ─────────
sr, v = wavfile.read(sys.argv[1]); v = v.astype(np.float32) / 32768 if v.dtype == np.int16 else v.astype(np.float32)
assert sr == SR
voice = np.zeros((2, N)); voice[0, : len(v)] = v; voice[1, : len(v)] = v
# ducking: la música baja ~9 dB cuando hay voz
e = np.abs(voice[0]); e = lp(e, 6)
d = np.clip(e / 0.06, 0, 1)
duck = 1 - 0.65 * d
music *= duck; sfx *= (1 - 0.35 * d)
music_g = 0.75; sfx_g = 1.2
rms=lambda x:20*np.log10(np.sqrt(np.mean(x[:, :int(38*SR)]**2))+1e-9)
print('RMS dB voz %.1f música %.1f sfx %.1f'%(rms(voice),rms(music*music_g),rms(sfx*sfx_g)))
mix = voice * 1.0 + music * music_g + sfx * sfx_g
peak = np.abs(mix).max()
mix = mix / max(1, peak / 0.93)
wavfile.write(sys.argv[2], SR, (mix.T * 32767).astype(np.int16))
print('ok', peak)
