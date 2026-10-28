"""Recorte de personas (ISNet, ONNX en CPU) para poner gráficos DETRÁS de las personas.
Calcula 1 de cada 2 fotogramas (+ los de cada corte) y guarda máscaras 540x960 en work/matte.u8."""
import os, subprocess, sys, time
import numpy as np, onnxruntime as ort
from PIL import Image
import config as C

WORK = os.environ.get("INTEGRIA_WORK", os.path.join(C.ROOT, "work"))
SRC = os.environ.get("INTEGRIA_SRC", os.path.join(WORK, "src.mp4"))
MODEL = os.environ.get("INTEGRIA_ISNET", os.path.join(WORK, "isnet-general-use.onnx"))
NF = int(round(C.DURATION * C.FPS))
MW, MH = 540, 960
mean = np.array([0.485, 0.456, 0.406], np.float32)


def needed():
    s = set(range(0, NF, 2))
    for tc in C.SHOT_CUTS:
        fc = int(round(tc * C.FPS)); s.update({fc - 1, fc, fc + 1})
    return sorted(x for x in s if 0 <= x < NF)


def main():
    so = ort.SessionOptions(); so.intra_op_num_threads = int(os.environ.get("MATTE_THREADS", "3"))
    sess = ort.InferenceSession(MODEL, so, providers=["CPUExecutionProvider"])
    inp = sess.get_inputs()[0].name
    out = np.lib.format.open_memmap(os.path.join(WORK, "matte.npy"), mode="w+", dtype=np.uint8, shape=(NF, MH, MW))
    have = np.zeros(NF, bool)
    todo = needed()
    dec = subprocess.Popen(["ffmpeg", "-v", "error", "-i", SRC, "-an", "-vf", "fps=30,scale=1024:1024", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                           stdout=subprocess.PIPE, bufsize=1024 * 1024 * 3 * 4)
    want = set(todo)
    t0 = time.time(); n = 0
    for f in range(NF):
        raw = dec.stdout.read(1024 * 1024 * 3)
        if f not in want:
            continue
        a = np.frombuffer(raw, np.uint8).reshape(1024, 1024, 3).astype(np.float32)
        a = a / max(a.max(), 1e-6)
        a = (a - mean)
        o = sess.run(None, {inp: a.transpose(2, 0, 1)[None].astype(np.float32)})[0][0, 0]
        o = (o - o.min()) / (o.max() - o.min() + 1e-9)
        out[f] = np.array(Image.fromarray((o * 255).astype(np.uint8)).resize((MW, MH), Image.BILINEAR))
        have[f] = True; n += 1
        if n % 25 == 0:
            print(f"matte {n}/{len(todo)}  {time.time() - t0:.0f}s", flush=True)
    out.flush()
    np.save(os.path.join(WORK, "matte_have.npy"), have)
    print("listo", n)


if __name__ == "__main__":
    main()
