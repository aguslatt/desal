"""
Equipo ADIP · Admisiones 2027 — montaje.

Define el guion de edición (qué fragmentos de la entrevista entran, en qué orden), corta en los silencios
reales del audio (a cuadro exacto), arma el audio limpio de cada versión y escribe el timeline que consume
Remotion (src/timelines/<variante>.json).

Entradas : tools/transcript.whisper.json (palabras con tiempos) · tools/_cache/a48.wav (audio original 48 kHz)
Salidas  : src/timelines/*.json · out/audio/<variante>.wav (procesado y normalizado) · docs/EDL.md
Uso      : python3 -I tools/build.py
"""
import json, os, subprocess, sys, wave
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FPS = 30
SR = 48000
GAP = 3            # cuadros de aire entre fragmentos (room tone)
HOLD = 96          # cuadros que se sostienen después de la última palabra (cierre legible)
HOLD_BY = {"cut15": 90}
FA = lambda f: f / FPS

# ---------------------------------------------------------------- transcripción corregida
raw = json.load(open(f"{ROOT}/tools/transcript.whisper.json"))
W = []
for seg in raw:
    for w in seg["w"]:
        W.append({"w": w["w"].strip(), "s": w["s"], "e": w["e"]})
# correcciones de lo que Whisper entendió mal (revisadas contra la lista de terapias de Equipo ADIP)
FIX = {"sonodiología,": "fonoaudiología,", "¿este": "¿Este", "Equipo": "Equipo", "ADIP": "ADIP"}
out_words, i = [], 0
while i < len(W):
    w = dict(W[i])
    if w["w"] == "músico," and i + 1 < len(W) and W[i + 1]["w"] == "terapia":
        w = {"w": "musicoterapia", "s": w["s"], "e": W[i + 1]["e"]}
        i += 1
    w["w"] = FIX.get(w["w"], w["w"])
    if w["e"] - w["s"] < 0.06:
        w["e"] = w["s"] + 0.12
    out_words.append(w)
    i += 1
W = out_words

# ---------------------------------------------------------------- audio fuente
wf = wave.open(f"{ROOT}/tools/_cache/a48.wav")
assert wf.getframerate() == SR
x = np.frombuffer(wf.readframes(wf.getnframes()), dtype=np.int16).astype(np.float64) / 32768
x = x.reshape(-1, wf.getnchannels()).mean(1)
HOP = SR // 100
n10 = len(x) // HOP
db10 = 20 * np.log10(np.sqrt((x[: n10 * HOP].reshape(n10, HOP) ** 2).mean(1)) + 1e-9)


def db_at(t):
    """energía (dB) en una ventana de ~3 cuadros alrededor de t"""
    i = int(round(t * 100))
    return float(db10[max(0, i - 5): i + 6].mean())


def snap_in(t):
    lo = max([c for c in SRC_CUTS if c <= t + 0.05] + [0.0])
    cands = [k / FPS for k in range(int((t - 0.32) * FPS), int((t + 0.04) * FPS) + 1) if k >= 0 and k / FPS >= lo - 1e-6]
    return min(cands, key=lambda c: db_at(c) + 14 * (t - c))


def snap_out(t):
    hi = min([c for c in SRC_CUTS if c >= t - 0.05] + [99.0])
    cands = [k / FPS for k in range(int((t - 0.04) * FPS), int((t + 0.32) * FPS) + 1) if k / FPS <= hi + 1e-6]
    return min(cands, key=lambda c: db_at(c) + 14 * (c - t))


# ---------------------------------------------------------------- guion de edición
# fragmento: id, tipo, (primera palabra empieza, última palabra termina) en el original, cambios de plano internos
# cortes duros que ya trae el material original (no se pisan: un fragmento nunca cruza uno)
SRC_CUTS = [5.1333, 8.2, 9.4667, 12.5333, 15.8, 24.9, 27.9333, 31.1, 32.2333, 35.3, 37.6333, 42.4, 43.7333, 45.5, 46.7, 49.3333]
PIECES = {
    "HA":   dict(kind="hook",  a=12.76, b=15.80, speaker="lu"),
    "HB":   dict(kind="hookB", a=27.93, b=31.10, speaker="lu"),
    "HC":   dict(kind="hookC", a=49.62, b=52.20, speaker="int"),
    "IN":   dict(kind="intro", a=0.00,  b=3.58,  speaker="int"),
    "LI":   dict(kind="list",  a=16.06, b=24.80, speaker="lu"),
    "LI7":  dict(kind="list",  a=16.06, b=22.04, speaker="lu"),
    "A2":   dict(kind="a2",    a=27.93, b=31.10, speaker="lu"),
    "A3":   dict(kind="a3",    a=42.40, b=45.50, speaker="lu"),
    "CL":   dict(kind="close", a=49.62, b=55.04, speaker="int"),
    "CL15": dict(kind="close", a=49.62, b=52.20, speaker="int"),
    # pausas: la pregunta aparece como titular mientras la entrevistadora escucha (sin voz, sólo aire de sala)
    "B2":   dict(kind="beatQ2", silent=True, a=31.20, b=32.20, speaker="int"),
    "B3":   dict(kind="beatQ3", silent=True, a=33.30, b=34.30, speaker="int"),
}
BODY = ["IN", "LI", "B2", "A2", "B3", "A3", "CL"]
VARIANTS = {
    "main":  ["HA"] + BODY,
    "hookB": ["HB"] + BODY,
    "hookC": ["HC"] + BODY,
    "cut15": ["HA", "LI7", "CL15"],
}

# subtítulos: (desde, hasta) en el original + líneas. 1–2 líneas, pensados para leerse en el celular.
SUBS = [
    (12.76, 14.82, ["Acá en el centro", "realizamos siete tipos"]),
    (14.82, 15.80, ["de terapias", "diferentes."]),
    (0.00, 2.18, ["Estamos acá con Lu,", "la coordinadora del área"]),
    (2.18, 3.58, ["de rehabilitación", "de Equipo ADIP"]),
    (16.06, 18.22, ["Psicología, psicopedagogía,", "terapia ocupacional,"]),
    (18.40, 19.94, ["fonoaudiología, kinesiología,"]),
    (20.26, 22.04, ["musicoterapia, psicomotricidad"]),
    (22.04, 24.80, ["y además tenemos el servicio", "de orientación a padres."]),
    (27.93, 31.10, ["Desde el nacimiento hasta", "aproximadamente 100 años."]),
    (42.40, 44.08, ["En la actualidad, nosotros", "brindamos tratamientos"]),
    (44.08, 45.50, ["únicamente de manera", "individual."]),
    (49.62, 52.54, ["Es hoy el momento de realizar", "las admisiones para el 2027"]),
    (52.54, 55.04, ["y así arrancar el año que viene", "de manera organizada."]),
]

# momentos que sincronizan la gráfica (tiempo en el original, palabra de Whisper entre paréntesis)
MARKS = {
    "siete": 14.24, "terapiasH": 15.02,
    "psico": 16.06, "psicoped": 16.62, "ocupacional": 17.52, "fono": 18.40, "kine": 19.20, "musico": 20.26, "psicomot": 21.30,
    "ademas": 22.04, "orientacion": 23.94, "padres": 24.56,
    "edad": 25.84, "aprox": 29.42, "nacimiento": 28.36, "cien": 30.26, "anios": 30.62,
    "grupal": 39.62, "individualQ": 40.46, "individualA": 44.96, "unicamente": 44.08,
    "admisiones": 51.16, "dosmil": 51.86, "organizada": 54.46,
}


def build_variant(name, ids):
    segs, t = [], 0                       # t en cuadros de salida
    for k, pid in enumerate(ids):
        p = PIECES[pid]
        a, b = (p["a"], p["b"]) if p.get("silent") else (snap_in(p["a"]), snap_out(p["b"]))
        fa, fb = round(a * FPS), round(b * FPS)
        n = fb - fa
        s = dict(id=pid, kind=p["kind"], silent=bool(p.get("silent")), speaker=p["speaker"], srcF0=fa, srcF1=fb, outF0=t, outF1=t + n,
                 srcA=fa / FPS, srcB=fb / FPS, want=[p["a"], p["b"]], dbIn=round(db_at(fa / FPS), 1), dbOut=round(db_at(fb / FPS), 1))
        if "turn" in p:
            s["turnSrc"] = p["turn"]
            s["turnOut"] = (t + round((p["turn"] - fa / FPS) * FPS)) / FPS
        segs.append(s)
        t += n + (GAP if k < len(ids) - 1 else 0)
    last = segs[-1]["outF1"]
    hold = HOLD_BY.get(name, HOLD)
    total = last + hold

    def s2o(ts):
        for s in segs:
            if s["srcA"] - 0.05 <= ts <= s["srcB"] + 0.05:
                return s["outF0"] / FPS + (ts - s["srcA"])
        return None

    words = []
    for s in [q for q in segs if not q["silent"]]:
        for w in W:
            c = (w["s"] + w["e"]) / 2
            if s["srcA"] - 0.02 <= c <= s["srcB"] + 0.02:
                words.append({"w": w["w"], "s": round(s["outF0"] / FPS + (w["s"] - s["srcA"]), 3), "e": round(s["outF0"] / FPS + (w["e"] - s["srcA"]), 3), "seg": s["id"]})
    subs = []
    for (a, b, lines) in SUBS:
        for s in segs:
            if s["silent"]:
                continue
            # el subtítulo pertenece al fragmento donde empieza; si el fragmento termina antes, se recorta (mín. 0,5 s)
            if s["srcA"] - 0.03 <= a < s["srcB"] - 0.02:
                o0 = s["outF0"] / FPS + max(a - 0.04, s["srcA"]) - s["srcA"]
                o1 = s["outF0"] / FPS + min(b + 0.18, s["srcB"]) - s["srcA"]
                if o1 - o0 >= 0.5:
                    subs.append({"s": round(o0, 3), "e": round(o1, 3), "lines": lines, "seg": s["id"]})
                break
    subs.sort(key=lambda z: z["s"])
    for i in range(len(subs) - 1):          # sin solapes
        subs[i]["e"] = round(min(subs[i]["e"], subs[i + 1]["s"] - 0.03), 3)
    marks = {}
    for k, v in MARKS.items():
        o = s2o(v)
        if o is not None:
            marks.setdefault(k, round(o, 3))
    # marcas que aparecen dos veces según la variante (el gancho repite una frase del cuerpo): la 2ª ocurrencia aparte
    for k, v in MARKS.items():
        hits = [round(s["outF0"] / FPS + (v - s["srcA"]), 3) for s in segs if s["srcA"] - 0.05 <= v <= s["srcB"] + 0.05]
        marks[k] = hits
    tl = dict(id=name, fps=FPS, totalFrames=total, voiceEnd=last / FPS, hold=hold / FPS, segments=segs, words=words, subs=subs, marks=marks)
    return tl


# ---------------------------------------------------------------- audio
def room_tone():
    # la ventana de 0.4 s más silenciosa del original
    win = 40
    best, bi = 1e9, 0
    for i in range(0, n10 - win, 5):
        v = db10[i:i + win].mean()
        if v < best and v > -70 and db10[i:i + win].max() < -38:
            best, bi = v, i
    a = x[bi * HOP:(bi + win) * HOP]
    print(f"room tone en {bi/100:.2f}s ({best:.1f} dB)")
    return a


def make_audio(tl, tone):
    hold = round(tl["hold"] * FPS)
    parts = []
    fade = int(0.006 * SR)

    def tone_n(n):
        reps = int(np.ceil(n / len(tone))) + 1
        z = np.concatenate([tone] * reps)[:n].copy()
        return z

    for k, s in enumerate(tl["segments"]):
        if s["silent"]:
            parts.append(tone_n(int((s["srcF1"] - s["srcF0"]) / FPS * SR)))
            if k < len(tl["segments"]) - 1:
                parts.append(tone_n(int(GAP / FPS * SR)))
            continue
        seg = x[int(s["srcF0"] / FPS * SR): int(s["srcF1"] / FPS * SR)].copy()
        fi = int((0.025 if s["dbIn"] > -40 else 0.006) * SR)
        fo = int((0.025 if s["dbOut"] > -40 else 0.006) * SR)
        seg[:fi] *= np.linspace(0, 1, fi)
        seg[-fo:] *= np.linspace(1, 0, fo)
        parts.append(seg)
        if k < len(tl["segments"]) - 1:
            parts.append(tone_n(int(GAP / FPS * SR)))
    parts.append(tone_n(int(hold / FPS * SR)))
    y = np.concatenate(parts)
    want = int(tl["totalFrames"] / FPS * SR)
    y = np.pad(y, (0, max(0, want - len(y))))[:want]
    return y


def write_wav(path, y):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    st = np.stack([y, y], 1)
    pcm = (np.clip(st, -1, 1) * 32767).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())


CHAIN = ("highpass=f=75,afftdn=nr=9:nf=-48:tn=0,"
         "equalizer=f=260:t=q:w=1.0:g=-2,equalizer=f=3200:t=q:w=0.9:g=2.2,"
         "acompressor=threshold=-21dB:ratio=2.4:attack=8:release=140:makeup=2.5,"
         "alimiter=limit=0.89:level=disabled")


def process(wav_in, wav_out, target=-15.0):
    # loudnorm de dos pasadas (EBU R128, pico real -1.5 dBTP): -15 LUFS integrados, adecuado para Reels/Stories
    p = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", wav_in, "-af", CHAIN + f",loudnorm=I={target}:TP=-1.5:LRA=8:print_format=json",
                        "-f", "null", "-"], capture_output=True, text=True)
    js = json.loads(p.stderr[p.stderr.rfind("{"): p.stderr.rfind("}") + 1])
    ln = (f"loudnorm=I={target}:TP=-1.5:LRA=8:measured_I={js['input_i']}:measured_TP={js['input_tp']}:"
          f"measured_LRA={js['input_lra']}:measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true")
    os.makedirs(os.path.dirname(wav_out), exist_ok=True)
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", wav_in, "-af", CHAIN + "," + ln, "-ar", "48000", "-c:a", "pcm_s16le", wav_out], check=True)
    q = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", wav_out, "-af", "loudnorm=I=-15:TP=-1.5:LRA=8:print_format=json", "-f", "null", "-"], capture_output=True, text=True)
    jq = json.loads(q.stderr[q.stderr.rfind("{"): q.stderr.rfind("}") + 1])
    return js, jq


# =====================================================================================================
# VERSIÓN COMPLETA: la entrevista entera, en su orden original, sin sacar nada (los cortes duros del
# material se respetan tal cual). Opcionalmente lleva un adelanto de ~3 s al inicio (aperturas A/C).
# =====================================================================================================
FULL_END = 55.4333
# plano de cámara (reencuadre) por tramo del original; cada tramo empieza en un corte duro del material
SHOT_CAMS = [(0.0, "wide"), (5.1333, "wide"), (8.2, "intCU"), (9.4667, "intCU2"), (12.5333, "luA"), (15.8, "luB"),
             (24.9, "intCU"), (27.9333, "a2"), (31.1, "wide"), (32.2333, "wide2"), (35.3, "intCU"), (37.6333, "intCU2"),
             (42.4, "luC"), (43.7333, "luC"), (45.5, "frontal"), (46.7, "frontal"), (49.3333, "close")]

SUBS_FULL = [
    (0.00, 2.18, ["Estamos acá con Lu,", "la coordinadora del área"]),
    (2.18, 3.58, ["de rehabilitación", "de Equipo ADIP"]),
    (3.58, 5.12, ["y le vamos a hacer", "un par de preguntas"]),
    (5.12, 8.20, ["para que sepan todo acerca", "de las admisiones 2027."]),
    (8.52, 10.92, ["Para empezar un poco,", "contanos acerca del tipo"]),
    (10.92, 12.50, ["de terapias que hacen", "acá en el centro."]),
    (12.76, 14.82, ["Acá en el centro", "realizamos siete tipos"]),
    (14.82, 15.80, ["de terapias", "diferentes."]),
    (16.06, 18.22, ["Psicología, psicopedagogía,", "terapia ocupacional,"]),
    (18.40, 19.94, ["fonoaudiología, kinesiología,"]),
    (20.26, 22.04, ["musicoterapia, psicomotricidad"]),
    (22.04, 24.80, ["y además tenemos el servicio", "de orientación a padres."]),
    (24.92, 26.02, ["¿Para pacientes de qué edad"]),
    (26.02, 27.90, ["están pensadas cada una", "de estas terapias?"]),
    (27.93, 31.10, ["Desde el nacimiento hasta", "aproximadamente 100 años."]),
    (31.22, 33.18, ["Cada individuo puede,", "a la etapa de su vida,"]),
    (33.60, 35.20, ["requerir de alguno", "de estos tratamientos."]),
    (35.36, 37.60, ["Y entendiendo también", "que cada persona es única,"]),
    (37.74, 40.16, ["¿Este tipo de terapias", "se realizan de manera grupal,"]),
    (40.28, 42.26, ["de manera individual", "o depende de cada persona?"]),
    (42.40, 44.08, ["En la actualidad, nosotros", "brindamos tratamientos"]),
    (44.08, 45.50, ["únicamente de manera", "individual."]),
    (45.62, 47.38, ["Entonces, ya sabés,", "si estás buscando"]),
    (47.38, 49.34, ["o estás interesado", "en alguna de estas terapias,"]),
    (49.62, 52.54, ["Es hoy el momento de realizar", "las admisiones para el 2027"]),
    (52.54, 55.04, ["y así arrancar el año que viene", "de manera organizada."]),
]
MARKS.update({"cada": 36.34, "unica": 37.30, "q1": 9.70})
FULL_VARIANTS = {"full": None, "fullA": "HA", "fullC": "HC"}


def build_full(name, prefix):
    segs, t = [], 0
    off_sub = []
    if prefix:
        p = PIECES[prefix]
        a, b = snap_in(p["a"]), snap_out(p["b"])
        fa, fb = round(a * FPS), round(b * FPS)
        segs.append(dict(id=prefix, kind=p["kind"], silent=False, speaker=p["speaker"], srcF0=fa, srcF1=fb, outF0=0, outF1=fb - fa,
                         srcA=fa / FPS, srcB=fb / FPS, want=[p["a"], p["b"]], dbIn=round(db_at(fa / FPS), 1), dbOut=round(db_at(fb / FPS), 1)))
        t = (fb - fa) + GAP
    off = t
    bounds = [c for c, _ in SHOT_CAMS] + [FULL_END]
    for i, (c, cam) in enumerate(SHOT_CAMS):
        f0, f1 = round(c * FPS), round(bounds[i + 1] * FPS)
        segs.append(dict(id=f"F{i:02d}", kind="close" if cam == "close" else "shot", cam=cam, silent=False, speaker="x",
                         srcF0=f0, srcF1=f1, outF0=off + f0, outF1=off + f1, srcA=f0 / FPS, srcB=f1 / FPS, want=[c, bounds[i + 1]],
                         dbIn=0, dbOut=0))
    last = off + round(FULL_END * FPS)
    hold = HOLD_BY.get(name, HOLD)
    total = last + hold
    o = off / FPS

    def hits(v):
        r = []
        if prefix:
            ps = segs[0]
            if ps["srcA"] - 0.05 <= v <= ps["srcB"] + 0.05:
                r.append(round(ps["outF0"] / FPS + (v - ps["srcA"]), 3))
        r.append(round(o + v, 3))
        return r

    marks = {k: hits(v) for k, v in MARKS.items()}
    subs = []
    if prefix:
        ps = segs[0]
        for (a, b, lines) in SUBS:
            if ps["srcA"] - 0.03 <= a < ps["srcB"] - 0.02:
                o0 = max(a - 0.04, ps["srcA"]) - ps["srcA"]
                o1 = min(b + 0.18, ps["srcB"]) - ps["srcA"]
                if o1 - o0 >= 0.5:
                    subs.append({"s": round(o0, 3), "e": round(o1, 3), "lines": lines, "seg": prefix})
    for (a, b, lines) in SUBS_FULL:
        subs.append({"s": round(o + a - 0.04, 3) if a > 0.05 else round(o + a, 3), "e": round(o + b + 0.18, 3), "lines": lines, "seg": "FULL"})
    subs.sort(key=lambda z: z["s"])
    for i in range(len(subs) - 1):
        subs[i]["e"] = round(min(subs[i]["e"], subs[i + 1]["s"] - 0.03), 3)
    words = []
    for w in W:
        words.append({"w": w["w"], "s": round(o + w["s"], 3), "e": round(o + w["e"], 3), "seg": "FULL"})
    return dict(id=name, fps=FPS, totalFrames=total, voiceEnd=last / FPS, hold=hold / FPS, full=True, offset=o, segments=segs, words=words, subs=subs, marks=marks)


def make_audio_full(tl, tone):
    hold = round(tl["hold"] * FPS)
    parts = []
    fade = int(0.006 * SR)

    def tone_n(n):
        reps = int(np.ceil(n / len(tone))) + 1
        return np.concatenate([tone] * reps)[:n].copy()

    segs = tl["segments"]
    pref = segs[0] if segs[0]["kind"] != "shot" and segs[0]["kind"] != "close" else None
    if pref:
        seg = x[int(pref["srcF0"] / FPS * SR): int(pref["srcF1"] / FPS * SR)].copy()
        fi = int((0.025 if pref["dbIn"] > -40 else 0.006) * SR); fo = int((0.025 if pref["dbOut"] > -40 else 0.006) * SR)
        seg[:fi] *= np.linspace(0, 1, fi); seg[-fo:] *= np.linspace(1, 0, fo)
        parts.append(seg); parts.append(tone_n(int(GAP / FPS * SR)))
    full = x[: int(round(FULL_END * FPS) / FPS * SR)].copy()
    full[:fade] *= np.linspace(0, 1, fade); full[-fade:] *= np.linspace(1, 0, fade)
    parts.append(full)
    parts.append(tone_n(int(hold / FPS * SR)))
    y = np.concatenate(parts)
    want = int(tl["totalFrames"] / FPS * SR)
    return np.pad(y, (0, max(0, want - len(y))))[:want]


if __name__ == "__main__":
    only = sys.argv[1:] or (list(VARIANTS) + list(FULL_VARIANTS))
    os.makedirs(f"{ROOT}/src/timelines", exist_ok=True)
    tone = room_tone()
    md = ["# EDL generado (build.py)\n"]
    for name in only:
        is_full = name in FULL_VARIANTS
        tl = build_full(name, FULL_VARIANTS[name]) if is_full else build_variant(name, VARIANTS[name])
        json.dump(tl, open(f"{ROOT}/src/timelines/{name}.json", "w"), ensure_ascii=False, indent=1)
        raw_wav = f"{ROOT}/tools/_cache/{name}_raw.wav"
        write_wav(raw_wav, make_audio_full(tl, tone) if is_full else make_audio(tl, tone))
        js, jq = process(raw_wav, f"{ROOT}/out/audio/{name}.wav")
        md.append(f"\n## {name} · {tl['totalFrames']/FPS:.2f} s ({tl['totalFrames']} cuadros) · loudness {jq['input_i']} LUFS, pico {jq['input_tp']} dBTP\n")
        md.append("| fragmento | salida | original | dB corte in/out |\n|---|---|---|---|\n")
        for s in tl["segments"]:
            md.append(f"| {s['id']} ({s['kind']}) | {s['outF0']/FPS:.2f}–{s['outF1']/FPS:.2f} | {s['srcA']:.2f}–{s['srcB']:.2f} (pedido {s['want'][0]}–{s['want'][1]}) | {s['dbIn']} / {s['dbOut']} |\n")
        print(name, f"{tl['totalFrames']/FPS:.2f}s", "LUFS", jq["input_i"], "TP", jq["input_tp"])
        for s in tl["segments"]:
            print("  ", s["id"], f"out {s['outF0']/FPS:6.2f}-{s['outF1']/FPS:6.2f}  src {s['srcA']:6.2f}-{s['srcB']:6.2f}  cut dB {s['dbIn']:6.1f} / {s['dbOut']:6.1f}")
    open(f"{ROOT}/docs/EDL.md", "w").write("".join(md))
