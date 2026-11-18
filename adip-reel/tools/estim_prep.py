"""Builds src/estim/edl.json (corrected words + caption chunks) and the isotipo crop."""
import json, sys
from PIL import Image
import numpy as np
raw = json.load(open(sys.argv[1])); root = sys.argv[2]
fix = {"se": None}  # handled by index below
words = [dict(w=x["w"], s=x["s"], e=x["e"]) for x in raw]
txt = [w["w"] for w in words]
i = txt.index("No"); assert txt[i+1] == "se" and txt[i+2] == "falta"; words[i+1]["w"] = "hace"
for w in words:
    if w["w"] == "sabes,": w["w"] = "sabés,"
    if w["w"].lower().startswith("contáctanos"): w["w"] = "contactanos."
# caption chunks, written as they read on screen: *word = highlighted, leading ~ = hidden (a giant word is on screen)
LINES = """¿Viste *eso?|En el tiempo que|me tomó en *hacerlo,|el *cerebro|de un *bebé generó|~más de un millón de conexiones nuevas.
Y esto pasa|cada *segundo|en los *primeros años|de vida del *bebé.
¿Y cómo se arman|entonces estas *conexiones?|No hace falta|absolutamente *nada|de otro *mundo.|Simplemente *jugando,|mirándolos a los *ojos,|dándoles *atención|cuando te devuelven|la *mirada.
La realidad es|tan *simple como|~jugar, mirar, hablar y responder.
Por eso los|primeros *años son|~clave.
Desde Equipo *ADIP,|junto a nuestro equipo|de *estimulación temprana,|acompañamos el *desarrollo|de los más *pequeños|a través del *juego|y el *vínculo.|Siempre acompañados|por la *familia.
Así que ya sabés,|si tenés *dudas|acerca del desarrollo|de tu *bebé,|no esperes *más|y *contactanos."""
CH = []
for c in LINES.replace("\n", "|").split("|"):
    hid = c.startswith("~"); toks = c.lstrip("~").split()
    hi = next((i for i, t in enumerate(toks) if t.startswith("*")), -1)
    CH.append((len(toks), hi, hid, [t.lstrip("*") for t in toks]))
assert sum(c[0] for c in CH) == len(words), (sum(c[0] for c in CH), len(words))
chunks = []; k = 0
for n, hi, hid, toks in CH:
    ws = words[k:k+n]
    for w, tk in zip(ws, toks):
        assert w["w"].lower().strip("¿?.,") == tk.lower().strip("¿?.,"), (w, tk)
        w["w"] = tk
    if n > 2 and ws[2]["w"] == "en" and ws[1]["w"] == "tomó": ws[2]["w"] = ""
    chunks.append(dict(i0=k, n=n, hi=hi, hidden=bool(hid), s=ws[0]["s"], e=ws[-1]["e"], text=" ".join(w["w"] for w in ws if w["w"])))
    k += n
json.dump(dict(words=words, chunks=chunks), open(f"{root}/src/estim/edl.json", "w"), ensure_ascii=False, indent=1)
for c in chunks: print(("  (oculto) " if c["hidden"] else "") + f'{c["s"]:6.2f} {c["text"]}')
# isotipo: exact crop of the official colour logo (rows above the wordmark), no redraw
im = Image.open(f"{root}/public/brand/logo-color.png"); a = np.array(im)[:, :, 3]
top = a[:269]; cols = np.where((top > 8).any(0))[0]; rows = np.where((top > 8).any(1))[0]
iso = im.crop((cols[0], rows[0], cols[-1] + 1, rows[-1] + 1)); iso.save(f"{root}/public/estim/isotipo.png"); print("isotipo", iso.size)
