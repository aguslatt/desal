"""Chequeo de sincronía: para cada marca gráfica (palabra clave) mide cuánto sube la energía del audio final
alrededor de ese instante. Un inicio de palabra debe mostrar una subida clara entre -0,12 s y +0,12 s.
uso: python3 -I tools/qa_sync.py main"""
import json, sys, wave
import numpy as np
name = sys.argv[1]
aud = {"main": "main", "hookB": "hookB", "hookC": "hookC", "cut15": "cut15"}[name]
tl = json.load(open(f"src/timelines/{name}.json"))
w = wave.open(f"out/audio/{aud}.wav"); sr = w.getframerate()
x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(float).reshape(-1, 2).mean(1) / 32768
hop = sr // 100
db = 20 * np.log10(np.sqrt((x[: len(x) // hop * hop].reshape(-1, hop) ** 2).mean(1)) + 1e-9)
print(f"{name}: duración audio {len(x)/sr:.2f}s · video {tl['totalFrames']/30:.2f}s")
for k, v in tl["marks"].items():
    for t in v:
        i = int(t * 100)
        pre = db[max(0, i - 15): i - 2].mean() if i > 15 else float('nan')
        post = db[i + 2: i + 15].mean()
        print(f"  {k:12s} t={t:6.2f}s  antes {pre:6.1f} dB  después {post:6.1f} dB  subida {post-pre:+5.1f}")
