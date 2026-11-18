import sys, json
from faster_whisper import WhisperModel
m = WhisperModel("medium", device="cpu", compute_type="int8", cpu_threads=4)
import wave, numpy as np
w_=wave.open(sys.argv[1]); A=np.frombuffer(w_.readframes(w_.getnframes()),dtype=np.int16).astype(np.float32)/32768
segs, info = m.transcribe(A, language="es", word_timestamps=True, vad_filter=False,
    initial_prompt="Preguntas frecuentes de Equipo ADIP. Acompañamiento terapéutico, inclusión escolar, CET, obra social, admisión.")
out=[]
for s in segs:
    print(f"[{s.start:.2f}-{s.end:.2f}] {s.text}")
    out.append({"start":s.start,"end":s.end,"text":s.text,"words":[{"w":w.word,"s":round(w.start,2),"e":round(w.end,2),"p":round(w.probability,2)} for w in s.words]})
json.dump(out, open(sys.argv[2],"w"), ensure_ascii=False, indent=1)
