"""Recorte de personas (matting de retrato, MODNet · Apache-2.0) para colocar texto DETRÁS de una persona."""
import numpy as np, cv2, onnxruntime as ort
class Recorte:
    def __init__(self, modelo, w=576, h=1024):
        self.s = ort.InferenceSession(modelo, providers=["CPUExecutionProvider"]); self.w, self.h = w, h
        self.nombre = self.s.get_inputs()[0].name
    def matte(self, rgb):
        H, W = rgb.shape[:2]
        x = cv2.resize(rgb, (self.w, self.h), interpolation=cv2.INTER_AREA).astype(np.float32)
        x = ((x / 255.0 - 0.5) / 0.5).transpose(2, 0, 1)[None]
        m = self.s.run(None, {self.nombre: x})[0][0, 0]
        m = cv2.resize(m, (W, H), interpolation=cv2.INTER_CUBIC)
        return np.clip(m, 0, 1)
