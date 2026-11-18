"""Voice clean-up + original music bed + SFX -> public/audio/mix.wav (48 kHz stereo).
usage: python3 scripts/make_audio.py source/video.mp4"""
import subprocess, sys, wave, json
import numpy as np
SR = 48000
DUR = 50.5
src = sys.argv[1]

# 1) voice: rumble cut, light FFT denoise, presence, gentle compression, loudness to -16 LUFS
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-vn', '-ac', '1', '-ar', str(SR), '-af',
    'highpass=f=85,afftdn=nr=7:nf=-42:tn=1,equalizer=f=250:t=q:w=1:g=-1.5,equalizer=f=3800:t=q:w=1.2:g=2,'
    'deesser=i=0.25,acompressor=threshold=-20dB:ratio=2.5:attack=8:release=160:makeup=2,'
    'loudnorm=I=-16:TP=-1.5:LRA=7', 'work/voice.wav'], check=True)

def read(p):
    w = wave.open(p); a = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float64) / 32768
    return a
N = int(SR * DUR)
voice = np.zeros(N); v = read('work/voice.wav'); voice[:len(v)] = v[:N]
voice[int(48.3 * SR):int(48.5 * SR)] *= np.linspace(1, 0, int(48.5 * SR) - int(48.3 * SR)); voice[int(48.5 * SR):] = 0

rng = np.random.default_rng(7)
def env(n, a, r):  # attack / exponential release
    t = np.arange(n) / SR
    return np.minimum(t / a, 1) * np.exp(-np.maximum(t - a, 0) / r)
def tone(f, n, a=0.005, r=0.3, harm=((1, 1), (2, 0.25), (3, 0.08))):
    t = np.arange(n) / SR
    return sum(g * np.sin(2 * np.pi * f * h * t) for h, g in harm) * env(n, a, r)
def lowpass(x, fc):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); return np.fft.irfft(X / (1 + (f / fc) ** 4), len(x))
def bandnoise(n, f0, f1):  # noise with a moving band centre -> soft "whoosh"
    x = rng.standard_normal(n); out = np.zeros(n); seg = 2048; hop = 512; win = np.hanning(seg)
    for i in range(0, n - seg, hop):
        c = f0 + (f1 - f0) * i / n
        X = np.fft.rfft(x[i:i + seg] * win); f = np.fft.rfftfreq(seg, 1 / SR)
        out[i:i + seg] += np.fft.irfft(X * np.exp(-((f - c) / (0.45 * c)) ** 2), seg) * win
    return out / (np.abs(out).max() + 1e-9)

# 2) music: original soft bed, 92 bpm, Fmaj7 - Am7 - Dm7 - Bbmaj7 (felt-piano plucks + warm pad)
bpm = 92; beat = 60 / bpm; bar = 4 * beat
chords = [[174.61, 220.0, 261.63, 329.63], [220.0, 261.63, 329.63, 392.0], [146.83, 220.0, 261.63, 349.23], [116.54, 233.08, 293.66, 349.23]]
music = np.zeros(N + SR * 4)
nb = int(DUR / bar) + 1
for b in range(nb):
    ch = chords[b % 4]; t0 = b * bar
    n = int(bar * 1.15 * SR); t = np.arange(n) / SR
    pad = sum(np.sin(2 * np.pi * f * t + rng.uniform(0, 6)) + 0.5 * np.sin(2 * np.pi * f * 1.003 * t) for f in ch)
    e = np.minimum(t / 0.9, 1) * np.minimum((t[-1] - t) / 0.9, 1)
    music[int(t0 * SR):int(t0 * SR) + n] += 0.045 * pad * e
    music[int(t0 * SR):int(t0 * SR) + int(2 * SR)] += 0.20 * tone(ch[0] / 2, int(2 * SR), 0.02, 0.9, ((1, 1), (2, 0.3)))
    pat = [(0, 1), (1, 2), (1.5, 3), (2.5, 2), (3, 1), (3.5, 3)]
    for k, (bt, idx) in enumerate(pat):
        f = ch[idx] * (2 if idx != 3 else 1)
        s = int((t0 + bt * beat) * SR); n2 = int(1.6 * SR)
        music[s:s + n2] += (0.11 if k % 2 == 0 else 0.075) * tone(f, n2, 0.004, 0.42, ((1, 1), (2, 0.35), (3, 0.1), (4, 0.04)))
music = lowpass(music, 3200)[:N]
music /= np.abs(music).max()
# level: sits low under dialogue, breathes up a little on the outro
gain = np.full(N, 0.085); o = int(48.2 * SR); gain[o:] = np.linspace(0.085, 0.22, N - o)
fade = np.ones(N); fade[:int(0.6 * SR)] = np.linspace(0.3, 1, int(0.6 * SR)); fade[-int(1.0 * SR):] = np.linspace(1, 0, int(1.0 * SR))
music = music * gain * fade

# 3) SFX, timed from src/sfx.json (written next to the timeline)
sfx = np.zeros(N + SR * 3)
def put(t, x, g):
    s = max(0, int(t * SR)); sfx[s:s + len(x)] += g * x
def whoosh(d=0.32, up=True):
    n = int(d * SR); x = bandnoise(n, 500 if up else 2600, 2600 if up else 500); return x * np.sin(np.pi * np.arange(n) / n) ** 1.5
def pop(f=520):
    n = int(0.16 * SR); t = np.arange(n) / SR; ph = 2 * np.pi * np.cumsum(f * (1 + 0.9 * np.exp(-t * 45))) / SR; return np.sin(ph) * env(n, 0.003, 0.04)
def tick(f=1250):
    n = int(0.12 * SR); return tone(f, n, 0.002, 0.03, ((1, 1), (2.4, 0.2)))
def swipe():
    n = int(0.22 * SR); x = bandnoise(n, 1800, 4200); return x * np.sin(np.pi * np.arange(n) / n) ** 2
def bloom():
    n = int(2.0 * SR); return sum(tone(f, n, 0.03, 0.7, ((1, 1), (2, 0.2))) for f in (349.23, 440.0, 523.25, 659.25)) / 4
for e in json.load(open('src/sfx.json')):
    k, t = e['k'], e['t']
    if k == 'card': put(t - 0.05, whoosh(0.30), 0.10); put(t + 0.16, pop(480), 0.16)
    elif k == 'pill': put(t, whoosh(0.24, up=False), 0.07)
    elif k == 'line': put(t, swipe(), 0.06)
    elif k == 'tick': put(t, tick(e.get('f', 1250)), 0.10)
    elif k == 'pop': put(t, pop(e.get('f', 620)), 0.16)
    elif k == 'frame': put(t, tick(880), 0.09); put(t + 0.07, tick(1320), 0.07)
    elif k == 'bloom': put(t, bloom(), 0.30)
sfx = sfx[:N]

mix = voice + music + sfx
mix = np.tanh(mix * 1.0)  # safety soft-clip (rarely engaged)
st = np.stack([mix, mix], 1)
for name, a in (('mix', st), ('music', np.stack([music, music], 1)), ('sfx', np.stack([sfx, sfx], 1)), ('voice', np.stack([voice, voice], 1))):
    w = wave.open(f'public/audio/{name}.wav', 'w'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(a, -1, 1) * 32767).astype(np.int16).tobytes()); w.close()
print('audio ok')
