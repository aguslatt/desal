"""Transcripción con tiempos por palabra (faster-whisper, modelo medium, español).
uso: python3 -I tools/transcribe.py tools/_cache/a16.wav   → tools/transcript.whisper.json
(a16.wav = audio original a 16 kHz mono: ffmpeg -i LU.mp4 -vn -ac 1 -ar 16000 tools/_cache/a16.wav)"""
import json, sys, wave
import numpy as np
from faster_whisper import WhisperModel
w = wave.open(sys.argv[1])
audio = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
m = WhisperModel("medium", device="cpu", compute_type="int8")
seg, _ = m.transcribe(audio, language="es", word_timestamps=True, beam_size=5,
                      initial_prompt="Equipo ADIP, inclusión escolar, admisiones 2027, rehabilitación, Lu.")
out = [{"s": s.start, "e": s.end, "t": s.text.strip(), "w": [{"w": x.word, "s": x.start, "e": x.end, "p": x.probability} for x in s.words]} for s in seg]
json.dump(out, open("tools/transcript.whisper.json", "w"), ensure_ascii=False, indent=1)
