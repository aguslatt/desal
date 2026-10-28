"""Fidelidad del contenido hablado: re-transcribe el audio del MP4 final y lo compara con el original,
y mide el desfase entre la pista final y la original en el inicio, medio y final (misma velocidad = desfase ~0)."""
import json, os, re, subprocess, sys, unicodedata
import numpy as np, soundfile as sf
import config as C

mp4 = sys.argv[1]
W = os.environ.get("INTEGRIA_WORK", os.path.join(C.ROOT, "work"))


def norm(s):
    s = unicodedata.normalize("NFD", s.lower())
    return re.sub(r"[^a-z0-9]", "", "".join(c for c in s if unicodedata.category(c) != "Mn"))


def wav16(src, dst):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-vn", "-ac", "1", "-ar", "16000", "-c:a", "pcm_f32le", dst], check=True)
    x, _ = sf.read(dst, dtype="float32")
    return x


orig = wav16(os.path.join(W, "src.mp4"), os.path.join(W, "q_orig16.wav"))
fin = wav16(mp4, os.path.join(W, "q_final16.wav"))

print("== Desfase final vs original (ms) por ventana de 8 s ==")
for a in (0, 14, 28, 41):
    sa, sb = orig[a * 16000:(a + 8) * 16000], fin[a * 16000:(a + 8) * 16000]
    ea = np.abs(sa); eb = np.abs(sb)
    k = 160
    ea = np.convolve(ea, np.ones(k) / k, "same")[::16]; eb = np.convolve(eb, np.ones(k) / k, "same")[::16]
    ea -= ea.mean(); eb -= eb.mean()
    c = np.correlate(eb, ea, "full")
    print(f"  {a:2d}-{a + 8:2d} s: desfase {c.argmax() - (len(ea) - 1):+d} ms")

from faster_whisper import WhisperModel
m = WhisperModel("large-v3", device="cpu", compute_type="int8")
segs, _ = m.transcribe(fin, language="es", word_timestamps=True, beam_size=5,
                       initial_prompt="Entrevista sobre evaluaciones neurocognitivas en Integria Salud.")
new = [(w.word.strip(), w.start, w.end) for s in segs for w in s.words]
ref = json.load(open(os.path.join(C.ASSETS, "transcript_whisper_large-v3.json")))
ref = [(w["w"].strip(), w["s"], w["e"]) for s in ref for w in s["words"]]
a, b = [norm(w[0]) for w in new], [norm(w[0]) for w in ref]
print("\n== Texto hablado ==")
print(f"  palabras original: {len(b)} | video final: {len(a)} | idénticas en orden: {a == b}")
if a != b:
    import difflib
    for op in difflib.SequenceMatcher(None, b, a).get_opcodes():
        if op[0] != "equal":
            print("  ", op[0], "orig:", [w[0] for w in ref[op[1]:op[2]]], "final:", [w[0] for w in new[op[3]:op[4]]])
d = [abs(x[1] - y[1]) for x, y in zip(new, ref)] if len(new) == len(ref) else []
if d:
    print(f"  diferencia de inicio de palabra final vs original: media {np.mean(d) * 1000:.0f} ms, máx {np.max(d) * 1000:.0f} ms")
