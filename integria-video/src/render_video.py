"""Render del video: reencuadres, color, gráficos de marca, subtítulos y transiciones.

Uso:
  python3 render_video.py stills 1.0 8.2 ...      -> PNG de control en work/stills/
  python3 render_video.py full [video_sin_audio.mp4]
"""
import math, os, subprocess, sys, json
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import config as C
import subs

WORK = os.environ.get("INTEGRIA_WORK", os.path.join(C.ROOT, "work"))
os.makedirs(WORK, exist_ok=True)
SRC = os.environ.get("INTEGRIA_SRC", os.path.join(WORK, "src.mp4"))
W, H, FPS = C.W, C.H, C.FPS
NF = int(round(C.DURATION * FPS))  # 1489


def ease(x):  # easeInOutCubic
    x = min(1.0, max(0.0, x))
    return 4 * x ** 3 if x < .5 else 1 - (-2 * x + 2) ** 3 / 2


def ease_out(x):
    x = min(1.0, max(0.0, x))
    return 1 - (1 - x) ** 3


def font(kind, px):
    return ImageFont.truetype(C.FONT[kind], px)


# ====================================================================== cámara
def shot_at(t):
    for i, s in enumerate(C.SHOTS):
        if s[0] <= t < s[1]:
            return i
    return len(C.SHOTS) - 1


def cam_entry(t):
    for e in C.CAM:
        if e[0] <= t < e[1]:
            return e
    return C.CAM[-1]


def window(t, entry=None):
    """Ventana de recorte normalizada (x0, y0, w) para el tiempo t."""
    e = entry or cam_entry(t)
    t0, t1, si, focus, z0, z1, (ox, oy) = e
    sh = C.SHOTS[si]
    L, R = sh[2], sh[3]
    fx, fy = {"L": L, "R": R, "M": ((L[0] + R[0]) / 2, (L[1] + R[1]) / 2)}[focus]
    u = ease((t - t0) / max(1e-6, (t1 - t0)))
    z = z0 + (z1 - z0) * u
    for tp, amp in C.PUNCH:   # cambio de escala sutil en palabras clave
        d = (t - tp) / 0.85
        if 0 <= d <= 1:
            z *= 1 + amp * math.sin(math.pi * ease_out(d) * (1 if d < .5 else 1)) * (1 - d) ** .5
    w = 1.0 / z
    x0 = min(max(fx - ox * w, 0.0), 1 - w)
    y0 = min(max(fy - oy * w, 0.0), 1 - w)
    return x0, y0, w


def crop_frame(src, x0, y0, w):
    """src uint8 RGB (3840x2160). Devuelve 1920x1080 con remuestreo de buena calidad y subpíxel."""
    X0, Y0, WW = x0 * C.SRC_W, y0 * C.SRC_H, w * C.SRC_W
    f = W / WW
    m = 6
    rx0 = max(0, int(math.floor(X0 - m / f))); ry0 = max(0, int(math.floor(Y0 - m / f)))
    rx1 = min(C.SRC_W, int(math.ceil(X0 + WW + m / f))); ry1 = min(C.SRC_H, int(math.ceil(Y0 + WW * H / W + m / f)))
    roi = src[ry0:ry1, rx0:rx1]
    rw, rh = max(1, round((rx1 - rx0) * f)), max(1, round((ry1 - ry0) * f))
    res = cv2.resize(roi, (rw, rh), interpolation=cv2.INTER_AREA if f < 1 else cv2.INTER_CUBIC)
    fx_, fy_ = rw / (rx1 - rx0), rh / (ry1 - ry0)
    M = np.float32([[1, 0, (X0 - rx0) * fx_], [0, 1, (Y0 - ry0) * fy_]])
    return cv2.warpAffine(res, M, (W, H), flags=cv2.INTER_CUBIC | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REPLICATE)


# ====================================================================== color
# Referencia de pared medida en los planos 6-12 (más luminosos); los planos 0-5 se igualan a ella.
WALL_REF = np.array([227.0, 224.3, 216.4])
WALL_BY_SHOT = [
    (216.6, 213.0, 201.5), (216.1, 212.8, 201.5), (215.1, 210.9, 199.9), (214.9, 211.6, 199.9), (216.1, 212.7, 200.6),
    (217.8, 214.4, 202.3), (228.1, 225.6, 217.1), (228.0, 224.8, 216.2), (227.6, 225.0, 216.6), (226.2, 223.6, 215.2),
    (227.2, 224.6, 216.2), (226.3, 224.0, 217.6), (227.8, 224.9, 216.7)]


def build_luts():
    luts = []
    x = np.arange(256, dtype=np.float32)
    for wall in WALL_BY_SHOT:
        g = np.clip(WALL_REF / np.array(wall), 0.96, 1.085)
        chans = []
        for c in range(3):
            v = x * g[c]
            knee = 232.0
            v = np.where(v > knee, knee + (v - knee) * (255 - knee) / max(1.0, 255 * g[c] - knee), v)
            # contraste suave + leve apertura de sombras (imagen limpia y luminosa, sin filtros fuertes)
            n = np.clip(v / 255.0, 0, 1)
            n = n + 0.045 * np.sin(2 * np.pi * (n - 0.5)) * -1 * 0.5 + 0.018 * (1 - n) ** 2
            chans.append(np.clip(n * 255, 0, 255).astype(np.uint8))
        luts.append(np.stack(chans, -1))
    return luts


LUTS = build_luts()


def grade(img, t):
    lut = LUTS[shot_at(t)]
    out = np.empty_like(img)
    for c in range(3):
        out[..., c] = cv2.LUT(img[..., c], lut[:, c])
    return out


# ====================================================================== sprites de marca
def _ss(draw_fn, w, h, ss=3):
    im = Image.new("RGBA", (w * ss, h * ss), (0, 0, 0, 0))
    draw_fn(ImageDraw.Draw(im), ss)
    return im.resize((w, h), Image.LANCZOS)


def shadow(spr, blur=22, alpha=60, dy=10, color=C.PROFUNDO):
    pad = blur * 3
    w, h = spr.size
    base = Image.new("RGBA", (w + pad * 2, h + pad * 2), (0, 0, 0, 0))
    a = spr.split()[3].point(lambda v: int(v * alpha / 255))
    sh = Image.new("RGBA", spr.size, color + (0,)); sh.putalpha(a)
    base.paste(sh, (pad, pad + dy), sh)
    base = base.filter(ImageFilter.GaussianBlur(blur))
    base.alpha_composite(spr, (pad, pad))
    return base, pad


def rrect(w, h, r, fill, outline=None, ow=0, alpha=255):
    def d(dr, s):
        dr.rounded_rectangle([0, 0, w * s - 1, h * s - 1], r * s, fill=fill + (alpha,),
                             outline=(outline + (255,)) if outline else None, width=ow * s)
    return _ss(d, w, h)


def text_w(txt, f, spacing=0):
    return sum(f.getlength(ch) + spacing for ch in txt) - spacing if spacing else f.getlength(txt)


def draw_text(im, xy, txt, f, fill, spacing=0):
    d = ImageDraw.Draw(im)
    if not spacing:
        d.text(xy, txt, font=f, fill=fill)
        return
    x, y = xy
    for ch in txt:
        d.text((x, y), ch, font=f, fill=fill)
        x += f.getlength(ch) + spacing


LOGO_IMG = Image.open(C.LOGO).convert("RGB")


def logo_card(width, pad_ratio=0.085, radius=None):
    """Contenedor (color propio del archivo del logo) con el logo ORIGINAL sin deformar."""
    lw = int(width * (1 - 2 * pad_ratio))
    lh = int(lw * LOGO_IMG.height / LOGO_IMG.width)
    pad = int(width * pad_ratio)
    h = lh + pad * 2
    r = radius or int(width * 0.09)
    card = rrect(width, h, r, C.LOGO_BG, outline=C.CELESTE, ow=max(2, width // 150))
    lg = LOGO_IMG.resize((lw, lh), Image.LANCZOS).convert("RGBA")
    card.alpha_composite(lg, (pad, pad))
    return card


def title_card(lines, size=76):
    f = font("bold", size)
    lh = int(size * 1.18)
    tw = max(f.getlength(l) for l in lines)
    padx, pady = 52, 46
    w = int(tw + padx * 2 + 8)
    h = int(pady * 2 + 34 + lh * len(lines) - (lh - size) + 8)

    def d(dr, s):
        dr.rounded_rectangle([0, 0, w * s - 1, h * s - 1], 40 * s, fill=C.HIELO + (255,), outline=C.CELESTE + (255,), width=3 * s)
        dr.rounded_rectangle([padx * s, pady * s, (padx + 160) * s, (pady + 9) * s], 4 * s, fill=C.AZUL + (255,))
        dr.rounded_rectangle([padx * s, (pady + 20) * s, (padx + 96) * s, (pady + 29) * s], 4 * s, fill=C.AQUA + (255,))
    im = _ss(d, w, h)
    for i, l in enumerate(lines):
        draw_text(im, (padx, pady + 44 + i * lh - 8), l, f, C.PROFUNDO + (255,))
    return im


def chip(lines, size=52):
    f = font("bold", size)
    lh = int(size * 1.22)
    tw = max(f.getlength(l) for l in lines)
    padx, pady = 44, 28
    dot = 20
    w = int(tw + padx * 2 + dot + 22)
    h = int(pady * 2 + lh * len(lines) - (lh - size) + 6)
    r = h // 2 if len(lines) == 1 else 44

    def d(dr, s):
        dr.rounded_rectangle([0, 0, w * s - 1, h * s - 1], r * s, fill=C.AZUL + (255,))
        cy = (pady + size * 0.62) * s if len(lines) > 1 else h * s / 2
        dr.ellipse([padx * s, cy - dot * s / 2, (padx + dot) * s, cy + dot * s / 2], fill=C.AQUA + (255,))
    im = _ss(d, w, h)
    for i, l in enumerate(lines):
        draw_text(im, (padx + dot + 22, pady - 4 + i * lh), l, f, C.BLANCO + (255,))
    return im


def id_card(text, size=50):
    f = font("bold", size)
    padx, pady = 40, 26
    w = int(f.getlength(text) + padx * 2 + 22)
    h = int(size * 1.22 + pady * 2)

    def d(dr, s):
        dr.rounded_rectangle([0, 0, w * s - 1, h * s - 1], 34 * s, fill=C.PROFUNDO + (255,))
        dr.rounded_rectangle([0, 0, 16 * s, h * s - 1], 8 * s, fill=C.AQUA + (255,))
        dr.rectangle([8 * s, 0, 18 * s, h * s - 1], fill=C.PROFUNDO + (255,))
        dr.rounded_rectangle([0, 18 * s, 14 * s, (h - 18) * s], 7 * s, fill=C.AQUA + (255,))
    im = _ss(d, w, h)
    draw_text(im, (padx + 22, pady - 5), text, f, C.BLANCO + (255,))
    return im


def sub_sprite(block):
    f = font("semibold", subs.SUB_FONT_PX)
    fh = font("bold", subs.SUB_FONT_PX)
    lh = 70
    lines = block["lines"]
    def _adv(t, hl): return (fh if hl else f).getlength(t + " ")
    lw = [sum(_adv(t, h) for t, h in ln) - f.getlength(" ") for ln in lines]
    padx, pady = 40, 24
    w = int(max(lw) + padx * 2)
    h = int(lh * len(lines) + pady * 2 - 10)

    def d(dr, s):
        dr.rounded_rectangle([0, 0, w * s - 1, h * s - 1], 36 * s, fill=C.PROFUNDO + (int(255 * .88),))
    im = _ss(d, w, h)
    for i, ln in enumerate(lines):
        x = (w - lw[i]) / 2
        for t, hl in ln:
            ff = fh if hl else f
            draw_text(im, (x, pady - 8 + i * lh), t, ff, (C.AQUA if hl else C.BLANCO) + (255,))
            x += _adv(t, hl)
    return im


def arcs_sprite(p, size=190, thick=18):
    """Curvas de conexión (recurso principal): dos cuartos de anillo que se dibujan."""
    def d(dr, s):
        box = [thick * s, thick * s, (size - thick) * s, (size - thick) * s]
        a1 = 270 + 90 * ease(p)
        if p > 0.01:
            dr.arc(box, 270, a1, fill=C.AZUL + (255,), width=thick * s)
        q = max(0.0, (p - 0.25) / 0.75)
        if q > 0.01:
            dr.arc(box, 90, 90 + 90 * ease(q), fill=C.CELESTE + (255,), width=thick * s)
    return _ss(d, size, size, 2)


# ----- blits ------------------------------------------------------------------------------
def blit(dst, spr, x, y, a=1.0):
    h, w = spr.shape[:2]
    x0, y0 = max(0, x), max(0, y); x1, y1 = min(W, x + w), min(H, y + h)
    if x1 <= x0 or y1 <= y0 or a <= 0:
        return None
    s = spr[y0 - y:y1 - y, x0 - x:x1 - x]
    al = (s[..., 3:4].astype(np.float32) / 255.0) * a
    reg = dst[y0:y1, x0:x1].astype(np.float32)
    dst[y0:y1, x0:x1] = (reg * (1 - al) + s[..., :3].astype(np.float32) * al + 0.5).astype(np.uint8)
    return (x0, y0, x1, y1)


def reveal_blit(dst, spr, x, y, p_in, p_out=0.0, slide=22, rec=None):
    """Entrada: máscara que descubre de izquierda a derecha con leve ascenso. Salida: la máscara se retira."""
    h, w = spr.shape[:2]
    pin, pout = ease_out(p_in), ease(p_out)
    a, b = int(w * pout), int(w * pin)
    if b <= a:
        return None
    yo = int((1 - pin) * slide + pout * -8)
    box = blit(dst, spr[:, a:b], x + a, y + yo, 1.0)
    if rec is not None and box:
        rec.append(box)
    return box


def pil2np(im):
    return np.array(im)


# ====================================================================== transiciones
YY, XX = np.mgrid[0:H, 0:W].astype(np.float32)


def _sm(x):
    return np.clip(x / 1.6 + 0.5, 0, 1)[..., None]


def paint_bands(frame, s, cols, widths):
    """s>0 = zona cubierta (profundidad en px). cols[0] borde de ataque, cols[-1] relleno."""
    out = frame.astype(np.float32)
    acc = 0.0
    for c, wd in zip(cols, widths):
        a = _sm(s - acc)
        out = out * (1 - a) + np.array(c, np.float32) * a
        acc += wd
    return out


def trans_frame(frame, style, u, cx=None, cy=None, variant=0):
    """u=0 sin cubrir, u=1 cubierto por completo."""
    if u <= 0.0:
        return frame
    ue = u ** 1.8   # cierre acelerado / apertura que desacelera
    diag = math.hypot(W, H)
    cx = W * 0.5 if cx is None else cx
    cy = H * 0.5 if cy is None else cy
    if style == "iris":
        Rmax = math.hypot(max(cx, W - cx), max(cy, H - cy)) + 40
        R = Rmax * (1 - ue) - 100 * ue
        s = np.hypot(XX - cx, YY - cy) - R
        return paint_bands(frame, s, [C.AQUA, C.AZUL, C.PROFUNDO], [14, 26, 0]).astype(np.uint8)
    if style == "window":
        hx = (W / 2 + 160) * (1 - ue) - 40 * ue
        hy = (H / 2 + 160) * (1 - ue) - 40 * ue
        rad = max(2.0, min(90.0, min(hx, hy)))
        qx = np.abs(XX - cx) - hx + rad
        qy = np.abs(YY - cy) - hy + rad
        sd = np.hypot(np.maximum(qx, 0), np.maximum(qy, 0)) + np.minimum(np.maximum(qx, qy), 0) - rad
        s = sd if (hx > 0 and hy > 0) else sd * 0 + 1e4
        return paint_bands(frame, s, [C.CELESTE, C.AQUA, C.AZUL], [12, 18, 0]).astype(np.uint8)
    if style == "arc":
        ccx, ccy = (0, H) if variant == 0 else (W, 0)
        R = -60 + (diag + 160) * ue
        s = R - np.hypot(XX - ccx, YY - ccy)
        return paint_bands(frame, s, [C.CELESTE, C.AQUA, C.AZUL], [34, 34, 0]).astype(np.uint8)
    if style == "circles":
        out = frame.astype(np.float32)
        R1 = -40 + (diag + 120) * min(1.0, ue * 1.3)
        R2 = -40 + (diag + 120) * max(0.0, min(1.0, ue * 1.3 - 0.3) / 0.7)
        s1 = R1 - np.hypot(XX - 0, YY - 0)
        a1 = _sm(s1) * 0.92
        out = out * (1 - a1) + np.array(C.AQUA, np.float32) * a1
        s2 = R2 - np.hypot(XX - W, YY - H)
        a2 = _sm(s2)
        out = out * (1 - a2) + np.array(C.AZUL, np.float32) * a2
        ring = np.clip(1 - np.abs(s2 - 6) / 7.0, 0, 1)[..., None] * (R2 > -30)
        out = out * (1 - ring) + np.array(C.CELESTE, np.float32) * ring
        return out.astype(np.uint8)
    if style == "dots":
        g = 120
        ni, nj = W // g + 1, H // g + 1
        ii, jj = np.meshgrid(np.arange(ni), np.arange(nj))
        dly = ((ii / ni) + (jj / nj)) * 0.5 * 0.55
        rad = g * 0.76 * np.clip(ue * 1.6 - dly, 0, 1) ** 0.8
        rad = np.where(u >= 0.999, g * 0.76, rad)
        ci = np.clip((XX // g).astype(np.int32), 0, ni - 1)
        cj = np.clip((YY // g).astype(np.int32), 0, nj - 1)
        dx = XX - (ci * g + g / 2); dy = YY - (cj * g + g / 2)
        s = rad[cj, ci] - np.hypot(dx, dy)
        a = _sm(s)
        col = np.where(((ci + cj) % 2 == 0)[..., None], np.array(C.AZUL, np.float32), np.array(C.AQUA, np.float32))
        m = float(np.clip((ue - 0.62) / 0.3, 0, 1))      # el patrón se funde en Azul Integria al cubrir
        col = col * (1 - m) + np.array(C.AZUL, np.float32) * m
        out = frame.astype(np.float32) * (1 - a) + col * a
        return out.astype(np.uint8)
    return frame


def reveal_iris(a_img, b_img, u, cx, cy):
    """El encuadre nuevo (b) aparece dentro de un círculo que crece sobre el anterior (a). Sin ocultar contenido."""
    ue = ease(u)
    Rmax = math.hypot(max(cx, W - cx), max(cy, H - cy)) + 30
    R = Rmax * ue
    s = R - np.hypot(XX - cx, YY - cy)
    a = _sm(s)
    out = a_img.astype(np.float32) * (1 - a) + b_img.astype(np.float32) * a
    ring = np.clip(1 - np.abs(s) / 8.0, 0, 1)[..., None] * (0.02 < u < 0.995)
    out = out * (1 - ring) + np.array(C.AQUA, np.float32) * ring
    return out.astype(np.uint8)


# ====================================================================== composición por fotograma
class Scene:
    def __init__(self):
        self.blocks = subs.build_blocks()
        self.sub_sprites = [pil2np(sub_sprite(b)) for b in self.blocks]
        self.logo_big = logo_card(600)
        self.bug = logo_card(272)
        self.end_logo = logo_card(640)
        self.ov = []
        for (t0, t1, kind, text, slot) in C.OVERLAYS:
            lines = text.split("\n")
            spr = {"id": id_card, "title": title_card, "chip": chip}[kind](lines if kind != "id" else text)
            sh, pad = shadow(spr, blur=16, alpha=70, dy=8)
            self.ov.append(dict(t0=t0, t1=t1, kind=kind, slot=slot, spr=pil2np(sh), pad=pad, w=spr.width, h=spr.height))
        sh, pad = shadow(self.bug, 14, 70, 8)
        self.bug_s, self.bug_pad = pil2np(sh), pad
        self.tag_font = font("semibold", 27)
        self.end_tag = self._tagline()
        self.intro_tag = self._tag_pill()

    def _tagline(self):
        f = self.tag_font
        sp = 4
        txt = C.TAGLINE
        w = int(text_w(txt, f, sp)) + 8
        im = Image.new("RGBA", (w, 44), (0, 0, 0, 0))
        draw_text(im, (4, 4), txt, f, C.BLANCO + (255,), sp)
        return pil2np(im)

    def _tag_pill(self):
        t = self.end_tag
        w, h = t.shape[1] + 56, 68
        pill = rrect(w, h, 34, C.PROFUNDO, alpha=235)
        pill.alpha_composite(Image.fromarray(t), (28, 12))
        sh, pad = shadow(pill, 12, 60, 6)
        return pil2np(sh), pad

    # --- posiciones de la zona superior segura (arriba de las cabezas; fuera de la interfaz de redes)
    INTRO_Y = 262
    BUG_POS = (60, 236)
    SLOT_Y = {0: 262, 1: 430, 2: 640}

    def overlays(self, frame, t, rec):
        # --- apertura: logo grande que se acomoda como sello (0 -> INTRO_END)
        if t < C.INTRO_END + 0.6:
            if t < C.INTRO_END - 0.55:
                p = ease_out(t / 0.55)
                bw, bh = self.logo_big.width, self.logo_big.height
                x, y = (W - bw) // 2, self.INTRO_Y
                box = reveal_blit(frame, pil2np(self.logo_big), x, y, t / 0.7, 0.0, slide=30, rec=rec)
                ap = arcs_sprite(min(1, max(0, (t - 0.25) / 0.8)))
                blit(frame, pil2np(ap), x + bw - 120, y - 96, 1.0)
                if t > 0.7:
                    tg, tp = self.intro_tag
                    ta = ease_out((t - 0.8) / 0.5)
                    rec.append(blit(frame, tg, (W - tg.shape[1]) // 2, y + bh + 26 - tp, ta))
            else:
                q = ease((t - (C.INTRO_END - 0.55)) / 0.6)
                bw0, bh0 = self.logo_big.width, self.logo_big.height
                x0, y0 = (W - bw0) // 2, self.INTRO_Y
                x1, y1 = self.BUG_POS
                s = 1 + (self.bug.width / bw0 - 1) * q
                spr = cv2.resize(pil2np(self.logo_big), (int(bw0 * s), int(bh0 * s)), interpolation=cv2.INTER_AREA)
                x = int(x0 + (x1 - x0) * q + (bw0 - bw0 * s) * 0.0)
                y = int(y0 + (y1 - y0) * q)
                tg, tp = self.intro_tag
                if q < 1:
                    rec.append(blit(frame, spr, x, y, 1.0))
                    blit(frame, tg, (W - tg.shape[1]) // 2, y0 + bh0 + 26 - tp, 1 - q)
        if t >= C.INTRO_END and t < C.END_CARD_START:
            p = ease_out((t - C.INTRO_END + 0.05) / 0.35) if t < C.INTRO_END + 0.4 else 1.0
            rec.append(blit(frame, self.bug_s, self.BUG_POS[0] - self.bug_pad, self.BUG_POS[1] - self.bug_pad, p))
        # --- títulos / palabras clave
        for o in self.ov:
            if o["t0"] - 0.01 <= t <= o["t1"] + 0.4:
                pin = (t - o["t0"]) / 0.45
                pout = (t - o["t1"]) / 0.30
                if pout >= 1 or pin <= 0:
                    continue
                if o["kind"] == "id":
                    x, y = 372, self.SLOT_Y[0] + 8
                else:
                    x, y = 60, self.SLOT_Y[o["slot"]]
                box = reveal_blit(frame, o["spr"], x - o["pad"], y - o["pad"], pin, max(0, pout), rec=None)
                if box:
                    rec.append((x, y + int((1 - ease_out(pin)) * 22), x + o["w"] * ease_out(pin), y + o["h"]))
                if o["kind"] == "title" and 0.15 < pin:
                    ap = arcs_sprite(min(1, (t - o["t0"] - 0.15) / 0.7) if pout < 0 else max(0, 1 - pout), size=150, thick=14)
                    blit(frame, pil2np(ap), x + o["w"] - 70, y - 78, 1.0 if pout < 0 else max(0, 1 - pout))
        # --- subtítulos
        for b, spr in zip(self.blocks, self.sub_sprites):
            if b["t_in"] - 0.01 <= t <= b["t_out"] + 0.15:
                a_in = ease_out((t - b["t_in"]) / 0.14)
                a_out = 1 - ease((t - b["t_out"]) / 0.12)
                a = min(a_in, a_out)
                if a <= 0:
                    continue
                x = (W - spr.shape[1]) // 2
                y = 1488 + int((1 - a_in) * 18) - spr.shape[0] // 2
                blit(frame, spr, x, y, a)
        return frame

    def end_card(self, frame, t):
        if t < C.END_CARD_START:
            return frame
        p = ease((t - C.END_CARD_START) / 0.42)
        out = frame.astype(np.float32) * (1 - 0.90 * p) + np.array(C.PROFUNDO, np.float32) * 0.90 * p
        frame = out.astype(np.uint8)
        lg = pil2np(self.end_logo)
        pr = ease_out((t - C.END_CARD_START - 0.12) / 0.5)
        reveal_blit(frame, lg, (W - lg.shape[1]) // 2, 780, pr, 0.0, slide=26)
        if pr > 0.3:
            ap = arcs_sprite(min(1, (t - C.END_CARD_START - 0.3) / 0.5), size=170, thick=16)
            blit(frame, pil2np(ap), (W + lg.shape[1]) // 2 - 110, 780 - 90, 1.0)
        ta = ease_out((t - C.END_CARD_START - 0.40) / 0.4)
        blit(frame, self.end_tag, (W - self.end_tag.shape[1]) // 2, 780 + lg.shape[0] + 56, ta)
        return frame


# ====================================================================== lógica de transiciones
def face_center_out(t, who):
    """Centro de cara (pantalla, px) de L/R en el encuadre del tiempo t."""
    si = shot_at(t)
    sh = C.SHOTS[si]
    nx, ny = sh[2] if who == "L" else sh[3]
    x0, y0, w = window(t)
    return (nx - x0) / w * W, (ny - y0) / w * H


def cut_state(f):
    """Para el fotograma f devuelve (estilo, u, cx, cy, variant) o None."""
    for (tc, style, n) in C.CUT_TRANSITIONS:
        fc = int(round(tc * FPS))   # primer fotograma del plano nuevo
        d = f - (fc - 0.5)
        if abs(d) <= n + 0.5:
            u = min(1.0, max(0.0, 1 - (abs(d) - 0.5) / n))
            who_prev = "R" if tc < 7.37 or 23.27 <= tc < 32.43 else "L"
            who_next = "L" if tc in (7.37, 32.43) else "R" if tc == 23.27 else who_prev
            cx, cy = 0.5 * W, 0.5 * H
            if style == "iris":
                tt = tc - 0.05 if d < 0 else tc + 0.05
                cx, cy = face_center_out(tt, who_prev if d < 0 else who_next)
            return style, u, cx, cy, (0 if d < 0 else 1)
    return None


def reveal_state(f):
    for (tr, dur) in C.REVEALS:
        t = f / FPS
        if tr <= t < tr + dur:
            return tr, dur, (t - tr) / dur
    return None


def frame_time(f):
    return f / FPS


def render_frame(sc, src, f, rec=None):
    t = frame_time(f)
    rs = reveal_state(f)
    if rs:
        tr, dur, u = rs
        # nuevo encuadre vs encuadre anterior (misma imagen, mismo instante: no se pierde nada)
        e_new = cam_entry(t)
        idx = C.CAM.index(e_new)
        e_old = C.CAM[idx - 1]
        img_new = grade(crop_frame(src, *window(t, e_new)), t)
        img_old = grade(crop_frame(src, *window(t, e_old)), t)
        fx = face_center_out(t, "L" if e_new[3] == "L" else "R")[0] if e_new[3] != "M" else W * 0.5
        cy = H * 0.55
        img = reveal_iris(img_old, img_new, u, fx if e_new[3] != "M" else W * 0.5, cy)
    else:
        img = grade(crop_frame(src, *window(t)), t)
    rec = [] if rec is None else rec
    img = sc.overlays(img, t, rec)
    img = sc.end_card(img, t)
    cs = cut_state(f)
    if cs:
        style, u, cx, cy, var = cs
        img = trans_frame(img, style, u, cx, cy, var)
    return img


# ====================================================================== modos
def read_stills(times):
    out = {}
    for t in times:
        raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{t:.3f}", "-i", SRC, "-frames:v", "1", "-vf",
                              f"scale={C.SRC_W}:{C.SRC_H}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                             capture_output=True).stdout
        out[t] = np.frombuffer(raw, np.uint8).reshape(C.SRC_H, C.SRC_W, 3)
    return out


def stills(times):
    sc = Scene()
    os.makedirs(os.path.join(WORK, "stills"), exist_ok=True)
    fr = read_stills(times)
    for t in times:
        f = int(round(t * FPS))
        img = render_frame(sc, fr[t], f)
        Image.fromarray(img).save(os.path.join(WORK, "stills", f"t{t:06.2f}.png"))
    print("ok", times)


def full(out_path):
    sc = Scene()
    cmd = ["ffmpeg", "-v", "error", "-y", "-i", SRC, "-an", "-vf", f"fps={FPS}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]
    dec = subprocess.Popen(cmd, stdout=subprocess.PIPE, bufsize=C.SRC_W * C.SRC_H * 3 * 2)
    enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
                            "-i", "-", "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-maxrate", "16M", "-bufsize", "32M",
                            "-pix_fmt", "yuv420p", "-profile:v", "high", "-colorspace", "bt709", "-color_primaries", "bt709",
                            "-color_trc", "bt709", "-movflags", "+faststart", out_path], stdin=subprocess.PIPE)
    nbytes = C.SRC_W * C.SRC_H * 3
    qc = []
    for f in range(NF):
        raw = dec.stdout.read(nbytes)
        if len(raw) < nbytes:
            raise RuntimeError(f"el decodificador entregó {f} fotogramas, se esperaban {NF}")
        src = np.frombuffer(raw, np.uint8).reshape(C.SRC_H, C.SRC_W, 3)
        rec = []
        img = render_frame(sc, src, f, rec)
        enc.stdin.write(img.tobytes())
        qc.append((f, [tuple(map(float, b)) for b in rec if b]))
        if f % 100 == 0:
            print("frame", f, "/", NF, flush=True)
    enc.stdin.close(); enc.wait(); dec.stdout.close(); dec.wait()
    json.dump(qc, open(os.path.join(WORK, "overlay_boxes.json"), "w"))
    print("listo", out_path)


if __name__ == "__main__":
    mode = sys.argv[1]
    if mode == "stills":
        stills([float(x) for x in sys.argv[2:]])
    else:
        full(sys.argv[2] if len(sys.argv) > 2 else os.path.join(WORK, "video_noaudio.mp4"))
