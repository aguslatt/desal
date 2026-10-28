"""Alinea los bloques de subtítulos con los tiempos por palabra del audio y exporta SRT.

Verifica que el texto de los bloques sea exactamente la transcripción (sin agregar ni quitar palabras).
"""
import json, os, re, unicodedata
from PIL import ImageFont
import config as C

MAX_LINE_PX = 900
SUB_FONT_PX = 50


def _norm(s):
    s = unicodedata.normalize("NFD", s.lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]", "", s)


def load_words():
    d = json.load(open(os.path.join(C.ASSETS, "transcript_whisper_large-v3.json")))
    return [dict(w=w["w"].strip(), s=w["s"], e=w["e"]) for seg in d for w in seg["words"]]


STOP = {"a", "un", "una", "de", "la", "el", "en", "que", "y", "o", "los", "las", "se", "su", "con", "por", "para",
        "del", "al", "yo", "como", "me", "le", "les", "nos", "es", "muy", "mas", "alguna", "estas", "diferentes", "algun"}


def wrap_two_lines(tokens, font, forced=None):
    """<=2 líneas con cortes naturales (no termina en artículo/preposición; premia coma). tokens=[(texto, resaltado)]"""
    widths = [font.getlength(t + " ") for t, _ in tokens]
    total = sum(widths)
    if forced:
        return [tokens[:forced], tokens[forced:]]
    if total <= MAX_LINE_PX:
        return [tokens]
    best = None
    for k in range(1, len(tokens)):
        a, b = sum(widths[:k]), sum(widths[k:])
        if max(a, b) > MAX_LINE_PX:
            continue
        last = _norm(tokens[k - 1][0])
        cost = abs(a - b) / 10.0
        if last in STOP: cost += 80
        if tokens[k - 1][0].endswith((",", ".", "?")): cost -= 40
        if best is None or cost < best[0]:
            best = (cost, k)
    if best is None:
        raise ValueError("bloque demasiado largo para 2 líneas: " + " ".join(t for t, _ in tokens))
    k = best[1]
    return [tokens[:k], tokens[k:]]


def build_blocks():
    words = load_words()
    font = ImageFont.truetype(C.FONT["semibold"], SUB_FONT_PX)
    blocks, wi = [], 0
    for text in C.SUB_BLOCKS:
        toks, hl, forced = [], False, None
        for raw in re.findall(r"\[\[|\]\]|\||[^\s\[\]|]+", text):
            if raw == "|": forced = len(toks)
            elif raw == "[[": hl = True
            elif raw == "]]": hl = False
            else: toks.append((raw, hl))
        n = len(toks)
        chunk = words[wi:wi + n]
        for (t, _), w in zip(toks, chunk):
            assert _norm(t) == _norm(w["w"]), f"texto != audio: '{t}' vs '{w['w']}'"
        blocks.append(dict(tokens=toks, start=chunk[0]["s"], end=chunk[-1]["e"],
                           lines=wrap_two_lines(toks, font, forced)))
        wi += n
    assert wi == len(words), f"quedaron {len(words) - wi} palabras sin subtitular"
    for i, b in enumerate(blocks):
        nxt = blocks[i + 1]["start"] if i + 1 < len(blocks) else 1e9
        b["t_in"] = max(0.0, b["start"] - 0.06)
        b["t_out"] = min(b["end"] + 0.20, nxt - 0.04)
        if i > 0:
            b["t_in"] = max(b["t_in"], blocks[i - 1]["t_out"] + 0.02)
    return blocks


def srt_time(t):
    ms = int(round(t * 1000))
    return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"


def write_srt(path):
    blocks = build_blocks()
    out = []
    for i, b in enumerate(blocks, 1):
        lines = [" ".join(t for t, _ in ln) for ln in b["lines"]]
        out.append(f"{i}\n{srt_time(b['t_in'])} --> {srt_time(b['t_out'])}\n" + "\n".join(lines) + "\n")
    open(path, "w", encoding="utf-8").write("\n".join(out))
    return blocks


if __name__ == "__main__":
    bl = write_srt(os.path.join(C.ROOT, "out", "Integria_Evaluaciones_Neurocognitivas.srt"))
    for b in bl:
        print(f"{b['t_in']:6.2f}-{b['t_out']:6.2f} | " + " / ".join(" ".join(t for t, _ in ln) for ln in b["lines"]))
    print(len(bl), "bloques; texto verificado contra la transcripción")
