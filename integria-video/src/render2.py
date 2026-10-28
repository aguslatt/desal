"""Integria Salud · render v2 ("Conexión").

Capas (de atrás hacia adelante):
  video graduado -> gráficos de marca DETRÁS de las personas (halo del que habla, palabras clave gigantes,
  barrido de arcos) usando el recorte de personas -> movimiento de corte (zoom/whip, sin tapar a nadie) ->
  sello de marca, identificación, subtítulos tipo vidrio con palabra activa -> cierre.

Uso:
  python3 render2.py stills 5.9 12.0 ...      -> work/stills2/*.png
  python3 render2.py full [salida_sin_audio.mp4]
"""
import json, math, os, subprocess, sys, time
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont
import config as C
import subs
import render_video as RV
from render_video import ease, ease_out, font, rrect, shadow, pil2np, text_w, draw_text

W, H, FPS = C.W, C.H, C.FPS
NF = int(round(C.DURATION * FPS))
WORK = RV.WORK
SRC = RV.SRC
FONT_XB = os.path.join(C.ASSETS, "fonts", "Montserrat-ExtraBold.ttf")


def clamp01(x):
    return min(1.0, max(0.0, x))


def sstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


# ======================================================================================== cámara
def _win(t, e):
    t0, t1, si, focus, z0, z1, (ox, oy) = e
    sh = C.SHOTS[si]
    L, R = sh[2], sh[3]
    fx, fy = {"L": L, "R": R, "M": ((L[0] + R[0]) / 2, (L[1] + R[1]) / 2)}[focus]
    z = z0 + (z1 - z0) * ease((t - t0) / max(1e-6, t1 - t0))
    return fx, fy, ox, oy, z


def _to_window(fx, fy, ox, oy, z):
    w = 1.0 / z
    return min(max(fx - ox * w, 0.0), 1 - w), min(max(fy - oy * w, 0.0), 1 - w), w


def cam(t):
    """Ventana (x0, y0, w) normalizada. Entre encuadres del MISMO plano hay un dolly suave (sin corte)."""
    idx = len(C.CAM) - 1
    for i, e in enumerate(C.CAM):
        if e[0] <= t < e[1]:
            idx = i
            break
    BL = 0.45
    win = None
    for i in range(len(C.CAM) - 1):
        a, b = C.CAM[i], C.CAM[i + 1]
        if a[2] == b[2] and abs(t - a[1]) < BL:
            q = ease((t - (a[1] - BL)) / (2 * BL))
            wa = _to_window(*_win(t, a)); wb = _to_window(*_win(t, b))
            cxa, cya, cxb, cyb = wa[0] + wa[2] / 2, wa[1] + wa[2] / 2, wb[0] + wb[2] / 2, wb[1] + wb[2] / 2
            w = math.exp(math.log(wa[2]) * (1 - q) + math.log(wb[2]) * q)
            cx, cy = cxa * (1 - q) + cxb * q, cya * (1 - q) + cyb * q
            win = (min(max(cx - w / 2, 0), 1 - w), min(max(cy - w / 2, 0), 1 - w), w)
            break
    if win is None:
        win = _to_window(*_win(t, C.CAM[idx]))
    x0, y0, w = win
    z = 1.0 / w
    for tp, amp in C.PUNCH:   # cambio de escala sutil sobre palabras clave
        d = (t - tp) / 0.85
        if 0 <= d <= 1:
            z *= 1 + amp * 0.8 * math.sin(math.pi * ease_out(d)) * (1 - d) ** .5
    w2 = 1.0 / z
    cx, cy = x0 + w / 2, y0 + w / 2
    return min(max(cx - w2 / 2, 0), 1 - w2), min(max(cy - w2 / 2, 0), 1 - w2), w2


def shot_of_frame(f):
    n = 0
    for tc in C.SHOT_CUTS:
        if f >= int(round(tc * FPS)):
            n += 1
    return n


def face_xy(t, who, f=None):
    si = shot_of_frame(f) if f is not None else RV.shot_at(t)
    sh = C.SHOTS[si]
    nx, ny = sh[2] if who == "L" else sh[3]
    x0, y0, w = cam(t)
    return (nx - x0) / w * W, (ny - y0) / w * H, w


def speaker(t):
    for who, a, b in C.SPEAKER_TURNS:
        if a <= t < b:
            return who, a
    return C.SPEAKER_TURNS[-1][0], C.SPEAKER_TURNS[-1][1]


# ======================================================================================== recorte de personas
class Matte:
    def __init__(self):
        self.m = np.load(os.path.join(WORK, "matte.npy"), mmap_mode="r")
        self.have = np.load(os.path.join(WORK, "matte_have.npy")) if os.path.exists(os.path.join(WORK, "matte_have.npy")) else None

    def has(self, f):
        if self.have is not None:
            return bool(self.have[f])
        return bool(self.m[f].max() > 0)

    def small(self, f):
        sf = shot_of_frame(f)
        if self.has(f):
            return self.m[f].astype(np.float32) / 255.0
        nb = [g for g in (f - 1, f + 1) if 0 <= g < NF and self.has(g) and shot_of_frame(g) == sf]
        if not nb:
            g = min((g for g in range(max(0, f - 6), min(NF, f + 7)) if self.has(g) and shot_of_frame(g) == sf), key=lambda g: abs(g - f))
            nb = [g]
        return np.mean([self.m[g].astype(np.float32) / 255.0 for g in nb], axis=0)


def guided(I, p, r=7, eps=2e-4):
    ks = (2 * r + 1, 2 * r + 1)
    mI = cv2.boxFilter(I, -1, ks); mp = cv2.boxFilter(p, -1, ks)
    cIp = cv2.boxFilter(I * p, -1, ks) - mI * mp
    vI = cv2.boxFilter(I * I, -1, ks) - mI * mI
    a = cIp / (vI + eps); b = mp - a * mI
    return cv2.boxFilter(a, -1, ks) * I + cv2.boxFilter(b, -1, ks)


def person_alpha(ms, win, img):
    x0, y0, w = win
    M = np.float32([[w * 540 / W, 0, x0 * 540], [0, w * 960 / H, y0 * 960]])
    a = cv2.warpAffine(ms, M, (W, H), flags=cv2.INTER_CUBIC | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REPLICATE)
    a = np.clip(a, 0, 1)
    g = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY).astype(np.float32) / 255.0
    gh, ah = cv2.resize(g, (W // 2, H // 2), interpolation=cv2.INTER_AREA), cv2.resize(a, (W // 2, H // 2), interpolation=cv2.INTER_AREA)
    r = guided(gh, ah, r=5, eps=3e-4)
    a2 = cv2.resize(np.clip(r, 0, 1), (W, H), interpolation=cv2.INTER_LINEAR)
    a2 = 0.6 * a2 + 0.4 * a
    return np.clip((a2 - 0.08) / 0.84, 0, 1)      # bordes algo más netos


# ======================================================================================== capa de gráficos detrás
YY, XX = np.mgrid[0:H, 0:W].astype(np.float32)


class Layer:
    """Acumula formas con alfa en una capa premultiplicada (P, A)."""
    def __init__(self):
        self.P = np.zeros((H, W, 3), np.float32)
        self.A = np.zeros((H, W), np.float32)

    def add_mask(self, m, color, op=1.0):
        m = m * op
        self.P = self.P * (1 - m[..., None]) + np.array(color, np.float32) * m[..., None]
        self.A = self.A * (1 - m) + m

    def circle(self, cx, cy, r, color, op=1.0):
        if r < 1:
            return
        x0, x1 = int(max(0, cx - r - 3)), int(min(W, cx + r + 3)); y0, y1 = int(max(0, cy - r - 3)), int(min(H, cy + r + 3))
        if x1 <= x0 or y1 <= y0:
            return
        d = np.hypot(XX[y0:y1, x0:x1] - cx, YY[y0:y1, x0:x1] - cy)
        m = np.clip(r - d + 0.5, 0, 1)
        self._add_patch(m, (x0, y0, x1, y1), color, op)

    def ring_arc(self, cx, cy, r, thick, a0, a1, color, op=1.0):
        """Arco (curva de conexión) con extremos redondeados; ángulos en grados."""
        if a1 - a0 < 0.5:
            return
        R = r + thick
        x0, x1 = int(max(0, cx - R - 3)), int(min(W, cx + R + 3)); y0, y1 = int(max(0, cy - R - 3)), int(min(H, cy + R + 3))
        if x1 <= x0 or y1 <= y0:
            return
        dx, dy = XX[y0:y1, x0:x1] - cx, YY[y0:y1, x0:x1] - cy
        d = np.hypot(dx, dy)
        ang = (np.degrees(np.arctan2(dy, dx)) - a0) % 360.0
        ring = np.clip(thick / 2 - np.abs(d - r) + 0.5, 0, 1)
        sweep = np.clip((a1 - a0) - ang, 0, 1) * 1.0
        sweep = np.clip(sweep * 1.0, 0, 1)
        m = ring * np.where(ang <= (a1 - a0), 1.0, 0.0)
        # extremos redondeados
        for a in (a0, a1):
            ex, ey = cx + r * math.cos(math.radians(a)), cy + r * math.sin(math.radians(a))
            m = np.maximum(m, np.clip(thick / 2 - np.hypot(XX[y0:y1, x0:x1] - ex, YY[y0:y1, x0:x1] - ey) + 0.5, 0, 1))
        self._add_patch(m.astype(np.float32), (x0, y0, x1, y1), color, op)

    def rgba(self, spr, x, y, op=1.0):
        h, w = spr.shape[:2]
        x0, y0, x1, y1 = max(0, x), max(0, y), min(W, x + w), min(H, y + h)
        if x1 <= x0 or y1 <= y0:
            return
        s = spr[y0 - y:y1 - y, x0 - x:x1 - x]
        m = (s[..., 3].astype(np.float32) / 255.0) * op
        col = s[..., :3].astype(np.float32)
        reg = self.P[y0:y1, x0:x1]
        self.P[y0:y1, x0:x1] = reg * (1 - m[..., None]) + col * m[..., None]
        self.A[y0:y1, x0:x1] = self.A[y0:y1, x0:x1] * (1 - m) + m

    def _add_patch(self, m, box, color, op):
        x0, y0, x1, y1 = box
        m = m * op
        reg = self.P[y0:y1, x0:x1]
        self.P[y0:y1, x0:x1] = reg * (1 - m[..., None]) + np.array(color, np.float32) * m[..., None]
        self.A[y0:y1, x0:x1] = self.A[y0:y1, x0:x1] * (1 - m) + m


# ======================================================================================== tipografía gigante
_GIANT_CACHE = {}


def giant_sprites(idx):
    if idx in _GIANT_CACHE:
        return _GIANT_CACHE[idx]
    t0, t1, lines = C.GIANT[idx]
    f100 = ImageFont.truetype(FONT_XB, 100)
    wmax = max(f100.getlength(t) for t, _ in lines)
    size = int(min(205, 930 / wmax * 100))
    f = ImageFont.truetype(FONT_XB, size)
    lh = int(size * 1.02)
    sprs = []
    for text, col in lines:
        tw = int(f.getlength(text)) + 12
        im = Image.new("RGBA", (tw, lh), (0, 0, 0, 0))
        color = C.PROFUNDO if col == "n" else C.AZUL
        ImageDraw.Draw(im).text((4, -int(size * 0.13)), text, font=f, fill=color + (255,))
        sprs.append(np.array(im))
    bar = None
    _GIANT_CACHE[idx] = (size, lh, sprs)
    return _GIANT_CACHE[idx]


# ======================================================================================== subtítulos tipo vidrio
class Captions:
    def __init__(self):
        self.blocks = subs.build_blocks()
        self.f = font("bold", 52)
        self.lay = [self._layout(b) for b in self.blocks]

    def _layout(self, b):
        f = self.f
        sp = f.getlength(" ")
        lines = b["lines"]
        lh = 70
        wid = [sum(f.getlength(t) for t, _ in ln) + sp * (len(ln) - 1) for ln in lines]
        padx, pady = 46, 26
        pw = int(max(wid) + padx * 2)
        ph = int(lh * len(lines) + pady * 2 - 8)
        txt = Image.new("RGBA", (pw, ph), (0, 0, 0, 0))
        words, wi = [], 0
        for li, ln in enumerate(lines):
            x = (pw - wid[li]) / 2
            for t, hl in ln:
                col = C.AZUL if hl else C.PROFUNDO
                ImageDraw.Draw(txt).text((x, pady - 10 + li * lh), t, font=f, fill=col + (255,))
                tw = f.getlength(t)
                s0, e0 = b["wt"][wi]
                words.append(dict(x=x, y=pady + li * lh - 4, w=tw, hl=hl, t0=s0, t1=e0))
                x += tw + sp
                wi += 1
        for i, w in enumerate(words):   # la palabra queda activa hasta que empieza la siguiente
            if i + 1 < len(words):
                w["t1"] = max(w["t1"], words[i + 1]["t0"])
        mask = np.array(rrect(pw, ph, 40, (255, 255, 255)).split()[3]).astype(np.float32) / 255.0
        border = rrect(pw, ph, 40, (255, 255, 255), outline=(255, 255, 255), ow=2, alpha=0)
        bd = np.array(border)
        # sombra suave
        base = Image.new("RGBA", (pw, ph), (255, 255, 255, 255)); base.putalpha(Image.fromarray((mask * 255).astype(np.uint8)))
        shs, pad = shadow(base, blur=18, alpha=60, dy=10)
        return dict(pw=pw, ph=ph, txt=np.array(txt), words=words, mask=mask, border=bd, shadow=np.array(shs), pad=pad)

    def draw(self, img, t):
        for b, lay in zip(self.blocks, self.lay):
            if b["t_in"] - 0.01 <= t <= b["t_out"] + 0.15:
                a_in = ease_out((t - b["t_in"]) / 0.16)
                a_out = 1 - ease((t - b["t_out"]) / 0.12)
                a = min(a_in, a_out)
                if a <= 0:
                    continue
                pw, ph = lay["pw"], lay["ph"]
                x = (W - pw) // 2
                y = 1470 - ph // 2 + int((1 - a_in) * 16)
                # sombra
                sh = lay["shadow"]; pad = lay["pad"]
                RV.blit(img, sh, x - pad, y - pad, a)
                # vidrio: desenfoque del fondo + velo blanco
                m = 40
                y0, y1, x0, x1 = max(0, y - m), min(H, y + ph + m), max(0, x - m), min(W, x + pw + m)
                reg = img[y0:y1, x0:x1]
                bl = cv2.GaussianBlur(reg, (0, 0), 16)
                bl = (bl.astype(np.float32) * 0.52 + 255 * 0.48)
                sub = bl[y - y0:y - y0 + ph, x - x0:x - x0 + pw]
                mk = (lay["mask"] * a)[..., None]
                cur = img[y:y + ph, x:x + pw].astype(np.float32)
                img[y:y + ph, x:x + pw] = (cur * (1 - mk) + sub * mk).astype(np.uint8)
                # palabra activa (marcador)
                for w in lay["words"]:
                    if w["t0"] - 0.03 <= t <= w["t1"] + 0.02:
                        p = ease_out((t - (w["t0"] - 0.03)) / 0.10)
                        hw = int(w["w"] + 22)
                        hh = 58
                        col = C.CELESTE if w["hl"] else C.AQUA
                        spr = np.array(rrect(hw, hh, 20, col, alpha=int(235 if w["hl"] else 150)))
                        spr = spr[:, :max(1, int(hw * p))]
                        RV.blit(img, spr, x + int(w["x"] - 11), y + int(w["y"] - 2), a)
                RV.blit(img, lay["txt"], x, y, a)
                return img
        return img


# ======================================================================================== escena
class Scene2:
    def __init__(self):
        self.matte = Matte()
        self.caps = Captions()
        self.bug = pil2np(shadow(RV.logo_card(272), 14, 70, 8)[0]); self.bug_pad = shadow(RV.logo_card(272), 14, 70, 8)[1]
        self.logo_big = RV.logo_card(600)
        self.end_logo = RV.logo_card(640)
        idspr = RV.id_card(C.ID_CHIP[2])
        sh, pad = shadow(idspr, 16, 70, 8)
        self.id_s, self.id_pad, self.id_wh = pil2np(sh), pad, idspr.size
        self.tag = self._tag()
        yy = np.linspace(-1, 1, H, dtype=np.float32)[:, None]; xx = np.linspace(-1, 1, W, dtype=np.float32)[None, :]
        self.vign = (1 - 0.075 * np.clip((xx ** 2 + yy ** 2) / 2, 0, 1))[..., None]
        self.hsv_ramp = sstep(0.58 * H, 0.66 * H, YY)
        # estado de gráficos
        self.head_top = None
        self.last_shot = -1

    def _tag(self):
        f = font("semibold", 27)
        sp = 4
        txt = C.TAGLINE
        w = int(text_w(txt, f, sp)) + 8
        im = Image.new("RGBA", (w, 44), (0, 0, 0, 0))
        draw_text(im, (4, 4), txt, f, C.BLANCO + (255,), sp)
        return pil2np(im)

    # ---- movimiento de corte
    def cut_motion(self, f):
        for tc, kind in C.CUT_KIND.items():
            fc = int(round(tc * FPS))
            P = C.CUT_PARAMS[kind]
            if fc - P["pre"] <= f < fc + P["post"]:
                v = C.CUT_DIR.get(tc, 0)
                if f < fc:
                    u = ((f - (fc - P["pre"]) + 1) / P["pre"]) ** 2
                    sgn = 1
                else:
                    u = 1 - ease_out((f - fc + 1) / (P["post"] + 1))
                    sgn = -1
                return dict(scale=1 + (P["scale"] - 1) * u, dx=sgn * v * P["shift"] * u, blur=P["blur"] * u, kind=kind, u=u, fc=fc, before=f < fc)
        return None

    def pop(self, f, t):
        """Progreso (0..1) de la 'entrada' del halo tras cada corte con cambio de interlocutor o inicio."""
        who, ts = speaker(t)
        last_cut = max([tc for tc in C.SHOT_CUTS if tc <= t] + [0.0])
        age = t - max(last_cut, 0.0)
        return ease_out(age / 0.42) if age < 0.42 else 1.0

    # ---- capa de fondo
    def background_layer(self, f, t, win, alpha):
        L = Layer()
        # leve velo celeste en la parte alta (la pared blanca toma color de marca)
        wash = np.clip(1 - YY / (0.66 * H), 0, 1) ** 1.4 * 0.78
        L.add_mask(wash.astype(np.float32), C.HIELO, 1.0)
        # barrido de arcos en cambios de tema (pasa por detrás de las personas)
        for tc, kind in C.CUT_KIND.items():
            if kind != "topic":
                continue
            d = (t - tc) / 0.9
            if -0.32 <= d <= 0.62:
                p = ease((d + 0.32) / 0.94)
                dirx = C.CUT_DIR.get(tc, 1)
                cx = (-760 + (W + 1520) * p) if dirx > 0 else (W + 760 - (W + 1520) * p)
                L.ring_arc(cx, 1060, 640, 74, 0, 359.9, C.AQUA, 0.92)
                L.ring_arc(cx - dirx * 120, 1060, 640, 28, 0, 359.9, C.AZUL, 0.9)
        # halo del que habla (superposición de círculos: manual p.16)
        who, ts = speaker(t)
        fx, fy, w = face_xy(t, who, f)
        pp = self.pop(f, t)
        R = 242.0 / w * (0.70 + 0.30 * pp)
        cx, cy = fx, fy + 0.10 * R
        sign = 1 if who == "L" else -1
        a = 0.95 * min(1.0, pp * 1.4)
        L.circle(cx, cy, R, C.CELESTE, 0.62 * a)
        L.circle(cx + sign * 0.86 * R, cy + 0.50 * R, 0.36 * R, C.AQUA, 0.90 * a)
        L.circle(cx - sign * 0.70 * R, cy + 0.80 * R, 0.15 * R, C.AZUL, 0.85 * a)
        sw = 40 * math.sin(t * 0.9)
        base_a = 90 if sign > 0 else 90
        L.ring_arc(cx, cy, R * 1.17, 9, base_a - 40 + sw, base_a + 35 + sw, C.AZUL, 0.95 * a)
        L.ring_arc(cx, cy, R * 1.17, 9, base_a + 62 + sw, base_a + 92 + sw, C.AQUA, 0.95 * a)
        # tipografía gigante detrás de las personas
        for i, (t0, t1, lines) in enumerate(C.GIANT):
            if t0 - 0.01 <= t <= t1 + 0.4:
                self._giant(L, i, t, alpha)
        return L

    def _giant(self, L, i, t, alpha):
        t0, t1, lines = C.GIANT[i]
        size, lh, sprs = giant_sprites(i)
        block_h = lh * len(lines)
        # cabeza más alta (para que el texto se "meta" detrás)
        top = self._head_top(alpha)
        y_top = int(max(430, top + 12 - block_h))
        y_top = min(y_top, 700)
        x = 64
        for li, spr in enumerate(sprs):
            tin = t - (t0 + 0.07 * li)
            tout = t - (t1 - 0.05 * (len(sprs) - li))
            pin = ease_out(tin / 0.50)
            pout = ease(tout / 0.30)
            if pin <= 0 or pout >= 1:
                continue
            h = spr.shape[0]
            yoff = int((1 - pin) * h * 0.95 - pout * h * 0.95)
            y = y_top + li * lh
            # recorte por línea (la palabra "sale" desde la base de su renglón)
            vis0 = max(0, -yoff) if yoff < 0 else 0
            if yoff >= 0:
                sub = spr[:max(0, h - yoff)]
                if sub.shape[0] > 0:
                    L.rgba(sub, x, y + yoff)
            else:
                sub = spr[-yoff:]
                if sub.shape[0] > 0:
                    L.rgba(sub, x, y)

    def _head_top(self, alpha):
        a = alpha[:1200:4, 60:1020:4]
        rows = (a > 0.6).sum(1)
        idx = np.where(rows >= 6)[0]
        top = float(idx[0] * 4) if len(idx) else 820.0
        if self.head_top is None or abs(top - self.head_top) > 160:
            self.head_top = top
        else:
            self.head_top = self.head_top * 0.7 + top * 0.3
        return self.head_top

    # ---- composición de escena
    def scene(self, src, f, t):
        win = cam(t)
        img = RV.grade(RV.crop_frame(src, *win), t)
        alpha = person_alpha(self.matte.small(f), win, img)
        L = self.background_layer(f, t, win, alpha)
        # el gráfico no pisa la mesa (se recorta contra ella) ni a las personas
        hsv = cv2.cvtColor(img, cv2.COLOR_RGB2HSV)
        wood = sstep(48, 80, hsv[..., 1].astype(np.float32)) * self.hsv_ramp
        gate = 1 - cv2.GaussianBlur(wood, (0, 0), 3)
        imf = img.astype(np.float32)
        bg = imf * (1 - (L.A * gate)[..., None]) + L.P * gate[..., None]
        out = alpha[..., None] * imf + (1 - alpha[..., None]) * bg
        out = out * self.vign
        return np.clip(out, 0, 255).astype(np.uint8)

    def motion(self, img, cm):
        s = cm["scale"]
        if s <= 1.0001 and cm["blur"] < 0.5:
            return img
        cx, cy = W / 2 + cm["dx"], H * 0.52
        M = np.float32([[s, 0, cx - s * W / 2 - cm["dx"] * 0 + cm["dx"] * 0], [0, s, cy - s * H * 0.52]])
        M[0, 2] = (W / 2 + cm["dx"]) - s * (W / 2)
        out = cv2.warpAffine(img, M, (W, H), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
        L = int(cm["blur"])
        if L >= 3:
            k = np.zeros((1, L | 1), np.float32); k[0, :] = 1.0 / k.shape[1]
            out = cv2.filter2D(out, -1, k, borderType=cv2.BORDER_REPLICATE)
        return out

    # ---- primer plano
    def foreground(self, img, t):
        # sello de marca (logo original) tras la apertura
        if t < C.INTRO_END + 0.6:
            if t < C.INTRO_END - 0.55:
                bw, bh = self.logo_big.size
                x, y = (W - bw) // 2, 262
                RV.reveal_blit(img, pil2np(self.logo_big), x, y, t / 0.7, 0.0, slide=30)
                if t > 0.7:
                    tg = self.tag
                    pill = self._intro_pill()
                    RV.blit(img, pill[0], (W - pill[0].shape[1]) // 2, y + bh + 26 - pill[1], ease_out((t - 0.8) / 0.5))
            else:
                q = ease((t - (C.INTRO_END - 0.55)) / 0.6)
                bw0, bh0 = self.logo_big.size
                x0, y0 = (W - bw0) // 2, 262
                x1, y1 = 60, 236
                s = 1 + (self.bug.shape[1] - 2 * self.bug_pad) / bw0 * 0 + ((272 / bw0) - 1) * q
                spr = cv2.resize(pil2np(self.logo_big), (int(bw0 * s), int(bh0 * s)), interpolation=cv2.INTER_AREA)
                if q < 1:
                    RV.blit(img, spr, int(x0 + (x1 - x0) * q), int(y0 + (y1 - y0) * q), 1.0)
                    pill = self._intro_pill()
                    RV.blit(img, pill[0], (W - pill[0].shape[1]) // 2, y0 + bh0 + 26 - pill[1], 1 - q)
        if C.INTRO_END <= t < C.END_CARD_START:
            p = ease_out((t - C.INTRO_END + 0.05) / 0.35) if t < C.INTRO_END + 0.4 else 1.0
            RV.blit(img, self.bug, 60 - self.bug_pad, 236 - self.bug_pad, p)
        # identificación
        t0, t1, _ = C.ID_CHIP
        if t0 - 0.01 <= t <= t1 + 0.4:
            RV.reveal_blit(img, self.id_s, 372 - self.id_pad, 270 - self.id_pad, (t - t0) / 0.45, max(0, (t - t1) / 0.30))
        if t < C.END_CARD_START + 0.1:
            img = self.caps.draw(img, t)
        return img

    def _intro_pill(self):
        if not hasattr(self, "_ip"):
            t = self.tag
            w, h = t.shape[1] + 56, 68
            pill = rrect(w, h, 34, C.PROFUNDO, alpha=235)
            pill.alpha_composite(Image.fromarray(t), (28, 12))
            sh, pad = shadow(pill, 12, 60, 6)
            self._ip = (pil2np(sh), pad)
        return self._ip

    def end_card(self, img, t):
        if t < C.END_CARD_START:
            return img
        p = ease((t - C.END_CARD_START) / 0.5)
        bl = cv2.GaussianBlur(img, (0, 0), 26)
        mix = img.astype(np.float32) * (1 - p) + (bl.astype(np.float32) * 0.28 + np.array(C.PROFUNDO, np.float32) * 0.72) * p
        img = mix.astype(np.uint8)
        lg = pil2np(self.end_logo)
        pr = ease_out((t - C.END_CARD_START - 0.12) / 0.5)
        RV.reveal_blit(img, lg, (W - lg.shape[1]) // 2, 780, pr, 0.0, slide=26)
        ap = RV.arcs_sprite(min(1, max(0, (t - C.END_CARD_START - 0.3) / 0.5)), size=170, thick=16)
        if pr > 0.3:
            RV.blit(img, pil2np(ap), (W + lg.shape[1]) // 2 - 110, 780 - 90, 1.0)
        ta = ease_out((t - C.END_CARD_START - 0.40) / 0.4)
        RV.blit(img, self.tag, (W - self.tag.shape[1]) // 2, 780 + lg.shape[0] + 56, ta)
        return img

    def frame(self, src, f):
        t = f / FPS
        if shot_of_frame(f) != self.last_shot:
            self.head_top = None
            self.last_shot = shot_of_frame(f)
        img = self.scene(src, f, t)
        cm = self.cut_motion(f)
        if cm:
            img = self.motion(img, cm)
        img = self.foreground(img, t)
        img = self.end_card(img, t)
        return img


# ======================================================================================== modos
def stills(times):
    sc = Scene2()
    out = os.path.join(WORK, "stills2")
    os.makedirs(out, exist_ok=True)
    fr = RV.read_stills(times)
    for t in times:
        f = int(round(t * FPS))
        # llevar el estado de la cabeza a régimen
        sc.head_top = None
        img = sc.frame(fr[t], f)
        Image.fromarray(img).save(os.path.join(out, f"t{t:06.2f}.png"))
    print("ok", times)


def full(out_path):
    sc = Scene2()
    cmd = ["ffmpeg", "-v", "error", "-y", "-i", SRC, "-an", "-vf", f"fps={FPS}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]
    dec = subprocess.Popen(cmd, stdout=subprocess.PIPE, bufsize=C.SRC_W * C.SRC_H * 3 * 2)
    enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
                            "-i", "-", "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-maxrate", "16M", "-bufsize", "32M",
                            "-pix_fmt", "yuv420p", "-profile:v", "high", "-colorspace", "bt709", "-color_primaries", "bt709",
                            "-color_trc", "bt709", "-movflags", "+faststart", out_path], stdin=subprocess.PIPE)
    nbytes = C.SRC_W * C.SRC_H * 3
    t0 = time.time()
    for f in range(NF):
        raw = dec.stdout.read(nbytes)
        if len(raw) < nbytes:
            raise RuntimeError(f"el decodificador entregó {f} fotogramas, se esperaban {NF}")
        src = np.frombuffer(raw, np.uint8).reshape(C.SRC_H, C.SRC_W, 3)
        enc.stdin.write(sc.frame(src, f).tobytes())
        if f % 50 == 0:
            print("frame", f, "/", NF, f"{time.time() - t0:.0f}s", flush=True)
    enc.stdin.close(); enc.wait(); dec.stdout.close(); dec.wait()
    print("listo", out_path)


if __name__ == "__main__":
    if sys.argv[1] == "stills":
        stills([float(x) for x in sys.argv[2:]])
    else:
        full(sys.argv[2] if len(sys.argv) > 2 else os.path.join(WORK, "video_noaudio_v2.mp4"))
