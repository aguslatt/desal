#!/usr/bin/env python3
"""Reel Halloween Equipo ADIP · 1080x1920 · 30 fps · 26 s.
Uso: python3 render.py <work_dir> [frame_ini frame_fin]   (genera frames JPG en work_dir/frames)
Fotos esperadas en work_dir: p1.png..p5.png ; fuentes en work_dir/fonts/m{300,500,700,800,900}.ttf
Logo: ../public/brand/logo-color.png
"""
import sys, os, math
from multiprocessing import Pool
from PIL import Image, ImageDraw, ImageFont

W, H, FPS, DUR = 1080, 1920, 30, 26.0
WORK = sys.argv[1]
HERE = os.path.dirname(os.path.abspath(__file__))
LOGO = os.path.join(HERE, "..", "public", "brand", "logo-color.png")

VIOLET = (138, 0, 183); FUCSIA = (237, 41, 149); ORANGE = (254, 128, 28)
YELLOW = (255, 203, 1); LIME = (148, 201, 32); GRAY = (239, 239, 239)
BLACK = (0, 0, 0); WHITE = (255, 255, 255)
T_ORANGE = (255, 230, 210); T_YELLOW = (255, 240, 184)
PALETTE = [VIOLET, FUCSIA, ORANGE, YELLOW, LIME, BLACK]

# ---------- timeline (120 bpm, beat = .5 s) ----------
S = dict(details=0.0, title=1.0, altar=4.0, costume=6.5, collage=9.5,
         group=12.5, burst=17.0, close=19.5)
TD = dict(title=0.6, altar=0.7, costume=0.55, collage=0.8, group=0.65, burst=0.5, close=0.7)

# ---------- helpers ----------
def clamp(x, a=0.0, b=1.0): return max(a, min(b, x))
def seg(t, a, d): return clamp((t - a) / d)
def e_out(x): return 1 - (1 - x) ** 3
def e_io(x): return 4 * x ** 3 if x < .5 else 1 - (-2 * x + 2) ** 3 / 2
def e_back(x):
    c1 = 1.70158; c3 = c1 + 1
    return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2
def pulse(tg): return math.exp(-((tg * 2) % 1.0) * 7)

IM = {}; FONTS = {}; TXT = {}; LOGOIMG = None
def init():
    global LOGOIMG
    for i in range(1, 6):
        IM[i] = Image.open(os.path.join(WORK, f"p{i}.png")).convert("RGB")
    LOGOIMG = Image.open(LOGO).convert("RGBA")

def font(wt, size):
    k = (wt, size)
    if k not in FONTS: FONTS[k] = ImageFont.truetype(os.path.join(WORK, "fonts", f"m{wt}.ttf"), size)
    return FONTS[k]

def fit_size(texts, wt, size, maxw):
    while size > 20 and max(font(wt, size).getlength(t) for t in texts) > maxw: size -= 2
    return size

def text_layer(text, wt, size, fill, track=0):
    k = (text, wt, size, fill, track)
    if k in TXT: return TXT[k]
    f = font(wt, size); asc, desc = f.getmetrics()
    if track:
        w = int(sum(f.getlength(c) + track for c in text)) + 6
    else:
        w = int(f.getlength(text)) + 6
    lay = Image.new("RGBA", (w, asc + desc + 4), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    if track:
        x = 0
        for c in text:
            d.text((x, 0), c, font=f, fill=fill); x += f.getlength(c) + track
    else:
        d.text((0, 0), text, font=f, fill=fill)
    TXT[k] = lay
    return lay

def reveal(cv, lay, x, y, p):
    if p <= 0: return
    if p >= 1:
        cv.paste(lay, (int(x), int(y)), lay); return
    off = int((1 - e_out(p)) * (lay.height + 8))
    tmp = Image.new("RGBA", lay.size, (0, 0, 0, 0)); tmp.paste(lay, (0, off))
    cv.paste(tmp, (int(x), int(y)), tmp)

def aamask(fn, size=(W, H), ss=2):
    m = Image.new("L", (size[0] * ss, size[1] * ss), 0)
    fn(ImageDraw.Draw(m), ss)
    return m.resize(size, Image.LANCZOS)

_MC = {}
def shape_mask(kind, w, h, r=None):
    w, h = max(2, int(w)), max(2, int(h))
    k = (kind, w, h, None if r is None else int(r))
    if k in _MC: return _MC[k]
    def fn(d, ss):
        if kind == "circle": d.ellipse([0, 0, w * ss - 1, h * ss - 1], fill=255)
        elif kind == "rr": d.rounded_rectangle([0, 0, w * ss - 1, h * ss - 1], radius=r * ss, fill=255)
        elif kind == "arch":
            rr = (r if r is not None else w / 2) * ss
            d.rounded_rectangle([0, 0, w * ss - 1, h * ss - 1], radius=rr, fill=255, corners=(True, True, False, False))
    m = aamask(fn, (w, h))
    if len(_MC) > 300: _MC.clear()
    _MC[k] = m
    return m

def crop_box(img, w, h, cx, cy, zoom=1.0, bw=None):
    iw, ih = img.size
    if bw is None: bw = min(iw, ih * w / h)
    bw = bw / zoom; bh = bw * h / w
    if bh > ih: bh = ih; bw = bh * w / h
    if bw > iw: bw = iw; bh = bw * h / w
    x0 = clamp(cx - bw / 2, 0, iw - bw); y0 = clamp(cy - bh / 2, 0, ih - bh)
    return (x0, y0, x0 + bw, y0 + bh)

def crop_to(img, w, h, cx, cy, zoom=1.0, bw=None):
    w, h = max(2, int(round(w))), max(2, int(round(h)))
    return img.resize((w, h), Image.BICUBIC, box=crop_box(img, w, h, cx, cy, zoom, bw))

def put(cv, img, kind, x, y, r=None):
    m = shape_mask(kind, img.width, img.height, r)
    cv.paste(img, (int(x), int(y)), m)

def circle(cv, cx, cy, r, color):
    if r < 1: return
    d = int(2 * r)
    m = shape_mask("circle", d, d)
    cv.paste(Image.new("RGB", (d, d), color), (int(cx - r), int(cy - r)), m)

def bar(cv, y, h=22):
    w6 = W / 6
    d = ImageDraw.Draw(cv)
    for i, c in enumerate(PALETTE): d.rectangle([int(i * w6), y, int((i + 1) * w6), y + h], fill=c)

def pill(cv, text, x, y, p, bg=WHITE, fg=BLACK, size=30):
    if p <= 0: return
    lay = text_layer(text, 800, size, fg, track=2)
    pw, ph = lay.width + 56, lay.height + 22
    pl = Image.new("RGBA", (pw, ph), (0, 0, 0, 0))
    m = shape_mask("rr", pw, ph, ph // 2)
    pl.paste(Image.new("RGB", (pw, ph), bg), (0, 0), m)
    pl.paste(lay, (28, 11), lay)
    s = e_back(clamp(p))
    if s < 0.02: return
    sw, sh = max(2, int(pw * s)), max(2, int(ph * s))
    pl = pl.resize((sw, sh), Image.LANCZOS)
    cv.paste(pl, (int(x + (pw - sw) / 2), int(y + (ph - sh) / 2)), pl)

# trazo (bucle) de la marca
def _bez(p0, p1, p2, p3, n=40):
    out = []
    for i in range(n + 1):
        t = i / n; u = 1 - t
        out.append((u**3*p0[0]+3*u*u*t*p1[0]+3*u*t*t*p2[0]+t**3*p3[0], u**3*p0[1]+3*u*u*t*p1[1]+3*u*t*t*p2[1]+t**3*p3[1]))
    return out
TRAZO = (_bez((10,96),(70,98),(120,92),(156,74)) + _bez((156,74),(196,54),(204,16),(178,12))[1:]
         + _bez((178,12),(150,8),(146,54),(182,76))[1:] + _bez((182,76),(220,98),(300,98),(390,92))[1:])

def trazo(cv, x, y, scale, p, color):
    if p <= 0: return
    ss = 3
    n = max(2, int(len(TRAZO) * clamp(p)))
    pts = TRAZO[:n + 1]
    wl, hl = int(400 * scale), int(120 * scale)
    lay = Image.new("L", (wl * ss, hl * ss), 0)
    d = ImageDraw.Draw(lay)
    sw = 13 * scale * ss
    P = [(a * scale * ss, b * scale * ss) for a, b in pts]
    d.line(P, fill=255, width=int(sw), joint="curve")
    for q in (P[0], P[-1]):
        d.ellipse([q[0] - sw / 2, q[1] - sw / 2, q[0] + sw / 2, q[1] + sw / 2], fill=255)
    lay = lay.resize((wl, hl), Image.LANCZOS)
    cv.paste(Image.new("RGB", (wl, hl), color), (int(x), int(y)), lay)

def logo(cv, cx, y, w, p):
    if p <= 0: return
    s = 0.88 + 0.12 * e_out(p)
    ww = int(w * s); hh = int(ww * LOGOIMG.height / LOGOIMG.width)
    l = LOGOIMG.resize((ww, hh), Image.LANCZOS)
    a = l.getchannel("A").point(lambda v: int(v * clamp(p * 1.6)))
    l.putalpha(a)
    cv.paste(l, (int(cx - ww / 2), int(y + (w * LOGOIMG.height / LOGOIMG.width - hh) / 2)), l)

# ---------- sprites de Halloween (formas planas, colores de marca) ----------
DARKO = (214, 100, 8)
_SP = {}
def _rgba(w, h): return Image.new("RGBA", (int(w), int(h)), (0, 0, 0, 0))

def bat_sprite(size, phase, color):
    k = ("bat", int(size), int(phase * 12) % 12, color)
    if k in _SP: return _SP[k]
    ss = 3; u = size / 2 * ss; S_ = int(size * ss)
    c = math.cos(2 * math.pi * (int(phase * 12) % 12) / 12)
    lay = Image.new("RGBA", (S_, S_), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    base = [(0.08, -0.05), (0.25, -0.22), (0.55, -0.30), (1.0, -0.20), (0.86, 0.0), (0.74, 0.10), (0.66, -0.02),
            (0.52, 0.14), (0.42, 0.02), (0.30, 0.12), (0.14, 0.10)]
    for sgn in (1, -1):
        pts = [(sgn * x * u + u, (y - 0.5 * c * x) * u + u) for x, y in base]
        d.polygon(pts, fill=color + (255,))
    d.ellipse([u - 0.11 * u, u - 0.16 * u, u + 0.11 * u, u + 0.22 * u], fill=color + (255,))
    for sgn in (1, -1):
        d.polygon([(u + sgn * 0.10 * u, u - 0.12 * u), (u + sgn * 0.075 * u, u - 0.30 * u), (u + sgn * 0.02 * u, u - 0.14 * u)], fill=color + (255,))
    lay = lay.resize((int(size), int(size)), Image.LANCZOS)
    _SP[k] = lay; return lay

def pumpkin_sprite(r, face=True):
    k = ("pk", int(r), face)
    if k in _SP: return _SP[k]
    ss = 3; w, h = int(2.5 * r * ss), int(2.3 * r * ss)
    lay = Image.new("RGBA", (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    cx, cy = w / 2, h * 0.56; R = r * ss
    for ox in (-0.55, 0.55, 0):
        d.ellipse([cx + ox * R - 0.66 * R, cy - 0.86 * R, cx + ox * R + 0.66 * R, cy + 0.86 * R], fill=ORANGE + (255,), outline=DARKO + (255,), width=int(4 * ss / 2))
    d.polygon([(cx - 0.10 * R, cy - 0.80 * R), (cx + 0.16 * R, cy - 0.80 * R), (cx + 0.30 * R, cy - 1.12 * R), (cx + 0.06 * R, cy - 1.10 * R)], fill=LIME + (255,))
    if face:
        for sx in (-1, 1):
            ex = cx + sx * 0.34 * R
            d.polygon([(ex - 0.16 * R, cy - 0.02 * R), (ex + 0.16 * R, cy - 0.02 * R), (ex, cy - 0.32 * R)], fill=VIOLET + (255,))
        pts = [(cx - 0.55 * R, cy + 0.22 * R)]
        for i in range(1, 8): pts.append((cx - 0.55 * R + i * 0.157 * R, cy + (0.22 + (0.18 if i % 2 else 0)) * R))
        pts += [(cx + 0.55 * R, cy + 0.22 * R), (cx + 0.40 * R, cy + 0.55 * R), (cx - 0.40 * R, cy + 0.55 * R)]
        d.polygon(pts, fill=VIOLET + (255,))
    lay = lay.resize((int(w / ss), int(h / ss)), Image.LANCZOS)
    _SP[k] = lay; return lay

def ghost_sprite(w):
    k = ("gh", int(w))
    if k in _SP: return _SP[k]
    ss = 3; W3 = int(w * ss); H3 = int(w * 1.3 * ss); pad = 6 * ss
    lay = Image.new("RGBA", (W3 + 2 * pad, H3 + 2 * pad), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    def shape(fill, outline=None, grow=0):
        g = grow * ss
        d.ellipse([pad - g, pad - g, pad + W3 + g, pad + W3 + g], fill=fill)
        d.rectangle([pad - g, pad + W3 / 2, pad + W3 + g, pad + 1.0 * W3], fill=fill)
        rr = W3 / 6
        for i in range(3):
            cxx = pad + rr + i * 2 * rr * 1.0 + rr * 0  # tres festones
            cxx = pad + W3 / 6 + i * W3 / 3
            d.ellipse([cxx - rr - g * 0.3, pad + W3 - rr * 0.5 - g * 0.3, cxx + rr + g * 0.3, pad + W3 + rr * 1.3 + g * 0.3], fill=fill)
    shape(VIOLET + (255,), grow=5); shape((255, 255, 255, 255))
    for sx in (0.36, 0.64):
        d.ellipse([pad + sx * W3 - 0.05 * W3, pad + 0.42 * W3, pad + sx * W3 + 0.05 * W3, pad + 0.56 * W3], fill=VIOLET + (255,))
    d.ellipse([pad + 0.5 * W3 - 0.06 * W3, pad + 0.62 * W3, pad + 0.5 * W3 + 0.06 * W3, pad + 0.76 * W3], fill=VIOLET + (255,))
    lay = lay.resize((lay.width // ss, lay.height // ss), Image.LANCZOS)
    _SP[k] = lay; return lay

def spider_sprite(r):
    k = ("sp", int(r))
    if k in _SP: return _SP[k]
    ss = 3; S_ = int(6 * r * ss); c = S_ / 2
    lay = Image.new("RGBA", (S_, S_), (0, 0, 0, 0)); d = ImageDraw.Draw(lay); R = r * ss
    for sx in (-1, 1):
        for j, a in enumerate([-0.9, -0.3, 0.3, 0.9]):
            kx = c + sx * (1.4 + 0.3 * (1 - abs(a))) * R; ky = c + a * R * 1.2 - 0.9 * R
            ex = c + sx * 2.6 * R; ey = c + a * R * 2.0
            d.line([(c + sx * 0.4 * R, c + a * 0.3 * R), (kx, ky), (ex, ey)], fill=BLACK + (255,), width=int(0.22 * R), joint="curve")
    d.ellipse([c - 0.9 * R, c - 0.8 * R, c + 0.9 * R, c + 1.1 * R], fill=BLACK + (255,))
    d.ellipse([c - 0.5 * R, c - 1.4 * R, c + 0.5 * R, c - 0.5 * R], fill=BLACK + (255,))
    for sx in (-0.2, 0.2): d.ellipse([c + sx * R - 0.1 * R, c - 1.0 * R, c + sx * R + 0.1 * R, c - 0.8 * R], fill=WHITE + (255,))
    lay = lay.resize((int(r * 6), int(r * 6)), Image.LANCZOS)
    _SP[k] = lay; return lay

def sprite(cv, lay, cx, cy, sx=1.0, sy=None, rot=0):
    sy = sx if sy is None else sy
    if sx <= 0.02 or sy <= 0.02: return
    if sx != 1 or sy != 1: lay = lay.resize((max(2, int(lay.width * sx)), max(2, int(lay.height * sy))), Image.BICUBIC)
    if rot: lay = lay.rotate(rot, resample=Image.BICUBIC, expand=True)
    cv.paste(lay, (int(cx - lay.width / 2), int(cy - lay.height / 2)), lay)

def pumpkin(cv, cx, cy, r, tl, t0, tg, face=True, pop=0.45):
    s = e_back(seg(tl, t0, pop))
    if s < 0.03: return
    sq = pulse(tg) * 0.07
    sprite(cv, pumpkin_sprite(r, face), cx, cy, s * (1 + sq), s * (1 - sq), rot=3 * math.sin(tg * 5 + cx))

def ghost(cv, cx, cy, w, tg, ph=0.0, s=1.0):
    sprite(cv, ghost_sprite(w), cx + 10 * math.sin(tg * 2.2 + ph), cy + 16 * math.sin(tg * 3.1 + ph), s, rot=4 * math.sin(tg * 2 + ph))

def spider(cv, x, ytop, ylen, r, tl, t0, tg):
    p = e_back(seg(tl, t0, 0.8)) if seg(tl, t0, 0.8) < 1 else 1
    y = ytop + ylen * p + 14 * math.sin(tg * 3 + x) * (1 if seg(tl, t0, 0.8) >= 1 else 0)
    d = ImageDraw.Draw(cv); d.line([(x, ytop - 20), (x, y)], fill=BLACK, width=3)
    sprite(cv, spider_sprite(r), x, y + r * 1.4)

def bat(cv, cx, cy, size, tg, color=BLACK, off=0.0):
    sprite(cv, bat_sprite(size, ((tg * 3.2) + off) % 1.0, color), cx, cy)

def bat_fly(cv, tl, t0, dur, y0, amp, size, tg, color=BLACK, direction=1, off=0.0):
    u = (tl - t0) / dur
    if u < 0 or u > 1: return
    x = (-size) + (W + 2 * size) * u if direction > 0 else (W + size) - (W + 2 * size) * u
    y = y0 + amp * math.sin(u * 2 * math.pi * 1.5 + off)
    bat(cv, x, y, size, tg, color, off)

def bunting(cv, y0, sag, tl, t0, n=9, flag=84):
    d = ImageDraw.Draw(cv); pts = []
    for i in range(n + 1):
        x = -10 + i * (W + 20) / n
        y = y0 + sag * (1 - ((x - W / 2) / (W / 2)) ** 2) * 1.0
        pts.append((x, y))
    p0 = e_out(seg(tl, t0, 0.7))
    d.line([(x, y - 6 * (1 - p0)) for x, y in pts], fill=BLACK, width=3)
    cols = [VIOLET, ORANGE, FUCSIA, YELLOW, LIME]
    for i in range(n):
        s = e_back(seg(tl, t0 + 0.05 * i, 0.4))
        if s < 0.03: continue
        xa, ya = pts[i]; xb, yb = pts[i + 1]; xm, ym = (xa + xb) / 2, (ya + yb) / 2
        f = flag * s
        d.polygon([(xa + 6, ya), (xb - 6, yb), (xm, ym + f * 1.2)], fill=cols[i % 5])

def word_o(cv, text, x, y, wt, size, fill, tl, t0, tg, o_index=4):
    """Texto letra por letra (caen con rebote); la 'o' se reemplaza por una calabaza."""
    f = font(wt, size); asc, desc = f.getmetrics()
    for i, ch in enumerate(text):
        px = x + f.getlength(text[:i]); p = seg(tl, t0 + 0.05 * i, 0.5)
        if p <= 0: continue
        off = (1 - e_back(p)) * -170
        if i == o_index:
            ow = f.getlength(ch); r = ow * 0.60
            pumpkin(cv, px + ow / 2, y + asc * 0.58 + off, r, 99, 0, tg)
            continue
        lay = text_layer(ch, wt, size, fill)
        cv.paste(lay, (int(px), int(y + off)), lay)

# ---------- escenas ----------
CUTS = [(3, 480, 320, 360), (5, 225, 630, 450), (2, 910, 380, 360), (5, 780, 570, 440)]

def sc_details(tl, tg):
    i = min(int(tl / 0.25), 3); loc = (tl - i * 0.25) / 0.25
    n, cx, cy, bw = CUTS[i]
    cv = crop_to(IM[n], W, H, cx, cy, 1.0 + 0.12 * loc, bw)
    # murciélago gigante que cruza en cada corte (cubre el empalme)
    for k in range(0, 5):
        u = (tl - (k * 0.25 - 0.06)) / 0.2
        if 0 <= u <= 1:
            x = W + 600 - (W + 1200) * u
            sprite(cv, bat_sprite(760, (tg * 4) % 1, BLACK), x, 1640 + 60 * math.sin(k * 2.1))
    return cv

ARCH1 = (160, 840, 760, 1000)
def sc_title(tl, tg):
    cv = Image.new("RGB", (W, H), WHITE)
    bar(cv, 0, 22)
    pl = pulse(tg)
    circle(cv, 990, 90, 300 * e_back(seg(tl, 0.0, 0.6)) * (1 + 0.02 * pl), ORANGE)
    circle(cv, 800, 1060, 250 * e_back(seg(tl, 0.25, 0.6)), VIOLET)
    sz = fit_size(["Halloween"], 900, 160, 900)
    word_o(cv, "Halloween", 80, 150, 900, sz, BLACK, tl, 0.05, tg)
    y = 150 + int(text_layer("Halloween", 900, sz, BLACK).height * 0.84)
    lay = text_layer("se vivió así", 300, 104, BLACK); reveal(cv, lay, 80, y, seg(tl, 0.5, 0.45)); y += int(lay.height * 0.84)
    sz3 = fit_size(["en Equipo ADIP"], 900, sz, 920); lay = text_layer("en Equipo ADIP", 900, sz3, VIOLET); reveal(cv, lay, 80, y, seg(tl, 0.66, 0.45)); y += int(lay.height * 0.84)
    trazo(cv, 80, y - 10, 1.2, seg(tl, 1.0, 0.6), ORANGE)
    spider(cv, 985, 22, 560, 22, tl, 0.9, tg)
    ghost(cv, 905, 700, 120, tg, 0.0, e_back(seg(tl, 1.2, 0.5)))
    x, y0, w, h = ARCH1
    rise = e_out(seg(tl, 0.3, 0.7))
    img = crop_to(IM[1], w, h, 480, 640, 1.0 + 0.04 * seg(tl, 0.3, 2.7))
    put(cv, img, "arch", x, y0 + (1 - rise) * 1100)
    pumpkin(cv, 170, 1780, 80, tl, 1.5, tg)
    bat_fly(cv, tl, 1.4, 1.4, 620, 60, 150, tg, VIOLET, 1, 0.0)
    return cv

def sc_altar(tl, tg):
    cv = crop_to(IM[1], W, H, 480, 640, 1.0 + 0.12 * seg(tl, 0.7, 1.8))
    pill(cv, "DECORACIÓN", 80, 260, seg(tl, 0.9, 0.4))
    bat_fly(cv, tl, 0.8, 1.2, 420, 80, 200, tg, WHITE, 1, 0.0)
    bat_fly(cv, tl, 1.3, 1.2, 560, 60, 130, tg, ORANGE, -1, 1.0)
    return cv

def sc_costume(tl, tg):
    cv = Image.new("RGB", (W, H), T_ORANGE)
    circle(cv, 900, 1650, 430 * (1 + 0.02 * pulse(tg)), VIOLET)
    img = crop_to(IM[3], 860, 1240, 520, 640, 1.0 + 0.07 * seg(tl, 0, 3.0))
    put(cv, img, "rr", 110, 340, 48)
    pill(cv, "DISFRACES", 110, 240, seg(tl, 0.55, 0.4))
    ghost(cv, 930, 230, 110, tg, 1.0, e_back(seg(tl, 0.8, 0.5)))
    spider(cv, 60, 0, 330, 20, tl, 1.0, tg)
    pumpkin(cv, 130, 1590, 90, tl, 1.1, tg)
    trazo(cv, 230, 1640, 2.0, seg(tl, 1.3, 0.7), VIOLET)
    bat_fly(cv, tl, 1.6, 1.3, 1780, 40, 170, tg, BLACK, -1, 0.5)
    return cv

def sc_collage(tl, tg):
    cv = Image.new("RGB", (W, H), WHITE)
    circle(cv, 1000, 330, 420 * (1 + 0.015 * pulse(tg)), ORANGE)
    a = crop_to(IM[5], 720, 960, 600, 800, 1.0 + 0.06 * seg(tl, 0, 3.0))
    put(cv, a, "rr", 60, 360, 40)
    s = e_back(seg(tl, 1.0, 0.45))
    if s > 0.03:
        d = int(440 * s)
        put(cv, crop_to(IM[3], d, d, 470, 165, 1.0, 330), "circle", 800 - d / 2, 1320 - d / 2)
    s = e_back(seg(tl, 1.5, 0.45))
    if s > 0.03:
        w, h = int(340 * s), int(460 * s)
        put(cv, crop_to(IM[2], w, h, 900, 350, 1.0, 340), "arch", 80 + (340 - w) / 2, 1400 + (460 - h) / 2)
    pumpkin(cv, 120, 300, 70, tl, 0.8, tg)
    ghost(cv, 960, 1000, 120, tg, 2.0, e_back(seg(tl, 1.9, 0.5)))
    trazo(cv, 520, 1640, 1.5, seg(tl, 2.0, 0.6), ORANGE)
    for k, (y0, sz_, col) in enumerate([(220, 150, VIOLET), (330, 110, BLACK), (150, 90, FUCSIA)]):
        bat_fly(cv, tl, 0.6 + 0.35 * k, 1.5, y0, 50, sz_, tg, col, 1 if k % 2 == 0 else -1, k)
    return cv

def sc_group(tl, tg):
    cv = Image.new("RGB", (W, H), GRAY)
    circle(cv, 980, 130, 300 * (1 + 0.015 * pulse(tg)), ORANGE)
    bar(cv, 0, 22)
    lines = [("Disfraces,", BLACK), ("juegos y", BLACK), ("momentos", VIOLET), ("para compartir", BLACK)]
    sz = fit_size([t for t, _ in lines], 900, 96, 920)
    y = 120
    for k, (t, col) in enumerate(lines):
        lay = text_layer(t, 900, sz, col)
        reveal(cv, lay, 80, y, seg(tl, 0.25 + 0.14 * k, 0.45))
        y += int(lay.height * 0.88)
    bunting(cv, 610, 40, tl, 0.5)
    ph = crop_to(IM[2], W, 618, 640, 366, 1.0 + 0.05 * seg(tl, 0.3, 4.2) + 0.012 * pulse(tg))
    cv.paste(ph, (0, 720))
    dets = [(985, 235, 200), (665, 95, 170), (150, 100, 190)]
    for k, (cx, cy, bw) in enumerate(dets):
        s = e_back(seg(tl, 1.5 + 0.5 * k, 0.45))
        if s < 0.03: continue
        d = int(300 * s)
        put(cv, crop_to(IM[2], d, d, cx, cy, 1.0, bw), "circle", 90 + 300 * k + (300 - d) / 2, 1500 + (300 - d) / 2)
    pumpkin(cv, 985, 1820, 70, tl, 2.8, tg)
    spider(cv, 1020, 1330, 130, 18, tl, 3.0, tg)
    for k in range(3): bat_fly(cv, tl, 2.2 + 0.3 * k, 1.6, 450 + 120 * k, 40, 130 - 20 * k, tg, [BLACK, VIOLET, BLACK][k], -1, k)
    bar(cv, 1898, 22)
    return cv

def sc_burst(tl, tg):
    cv = Image.new("RGB", (W, H), T_YELLOW)
    circle(cv, 880, 360, 110 * e_back(seg(tl, 0.9, 0.4)), VIOLET)
    s = e_back(seg(tl, 0.0, 0.45))
    if s > 0.03:
        d = int(480 * s)
        put(cv, crop_to(IM[1], d, d, 500, 880, 1.0, 480), "circle", 70 + (480 - d) / 2, 260 + (480 - d) / 2)
    s = e_back(seg(tl, 0.5, 0.45))
    if s > 0.03:
        d = int(520 * s)
        put(cv, crop_to(IM[5], d, d, 660, 570, 1.0, 680), "rr", 520 + (520 - d) / 2, 760 + (520 - d) / 2, 40)
    s = e_back(seg(tl, 1.0, 0.45))
    if s > 0.03:
        w, h = int(440 * s), int(640 * s)
        put(cv, crop_to(IM[3], w, h, 600, 420, 1.0, 560), "arch", 100 + (440 - w) / 2, 1180 + (640 - h) / 2)
    pumpkin(cv, 900, 340, 85, tl, 0.3, tg)
    pumpkin(cv, 560, 1640, 70, tl, 0.8, tg)
    ghost(cv, 940, 1500, 130, tg, 0.5, e_back(seg(tl, 1.3, 0.5)))
    for k in range(4): bat_fly(cv, tl, 0.2 + 0.3 * k, 1.2, 1000 + 160 * (k % 2), 70, 120 + 30 * (k % 3), tg, [BLACK, VIOLET, ORANGE, BLACK][k], 1 if k % 2 else -1, k)
    return cv

def sc_close(tl, tg):
    cv = Image.new("RGB", (W, H), WHITE)
    bar(cv, 0, 22)
    circle(cv, 990, 210, 300 * (1 + 0.015 * pulse(tg)), ORANGE)
    s = e_back(seg(tl, 0.15, 0.6))
    cw, ch = int(1000 * (0.9 + 0.1 * s)), int(750 * (0.9 + 0.1 * s))
    ph = crop_to(IM[4], cw, ch, 640, 480, 1.0 + 0.04 * seg(tl, 0.3, 6.0))
    if tl > 0.15: put(cv, ph, "rr", 40 + (1000 - cw) / 2, 250 + (750 - ch) / 2, 40)
    sz = fit_size(["Halloween"], 900, 150, 900)
    y = 1040
    lay = text_layer("Así celebramos", 300, 84, BLACK); reveal(cv, lay, 80, y, seg(tl, 0.9, 0.5)); y += int(lay.height * 0.84)
    word_o(cv, "Halloween", 80, y, 900, sz, BLACK, tl, 1.1, tg)
    y += int(text_layer("Halloween", 900, sz, BLACK).height * 0.84)
    lay = text_layer("en Equipo ADIP", 900, 84, VIOLET); reveal(cv, lay, 80, y, seg(tl, 1.9, 0.5)); y += int(lay.height * 0.84)
    trazo(cv, 80, y + 5, 1.0, seg(tl, 2.2, 0.6), ORANGE)
    logo(cv, W / 2, 1640, 440, seg(tl, 2.9, 0.8))
    ghost(cv, 975, 1420, 110, tg, 3.0, e_back(seg(tl, 2.4, 0.5)))
    pumpkin(cv, 940, 1730, 62, tl, 3.4, tg)
    spider(cv, 70, 1000, 0, 0.1, tl, 99, tg) if False else None
    for k in range(3): bat_fly(cv, tl, 0.5 + 0.5 * k, 1.8, 120 + 70 * k, 40, 120 - 15 * k, tg, [BLACK, VIOLET, BLACK][k], 1, k)
    for k in range(2): bat_fly(cv, tl, 4.6 + 0.4 * k, 1.5, 1520 + 100 * k, 40, 110, tg, BLACK, -1, k)
    return cv

SCENES = [("details", sc_details), ("title", sc_title), ("altar", sc_altar), ("costume", sc_costume),
          ("collage", sc_collage), ("group", sc_group), ("burst", sc_burst), ("close", sc_close)]

# ---------- transiciones ----------
def tr_iris(A, B, p, cx, cy, ring, color, bats=False, tg=0.0):
    e = e_io(p); mx = max(math.hypot(cx, cy), math.hypot(W - cx, cy), math.hypot(cx, H - cy), math.hypot(W - cx, H - cy))
    r = mx * e
    out = A.copy()
    if r < 1: return out
    def mk(rad): return aamask(lambda d, ss: d.ellipse([(cx - rad) * ss, (cy - rad) * ss, (cx + rad) * ss, (cy + rad) * ss], fill=255))
    if p < 0.97: out.paste(Image.new("RGB", (W, H), color), (0, 0), mk(r + ring))
    out.paste(B, (0, 0), mk(r))
    if bats and p < 0.95:
        for k in range(9):
            a = -math.pi / 2 * (k / 8) if cx == 0 else 2 * math.pi * k / 9
            if cx == 0: a = -math.pi / 2 * (k / 8)
            bx = cx + (r + ring + 60) * math.cos(a); by = cy + (r + ring + 60) * math.sin(a)
            if -100 < bx < W + 100 and -100 < by < H + 100:
                bat(out, bx, by, 150, tg, BLACK, k * 0.11)
    return out

def tr_arch(A, p):
    out = A.copy(); e = e_io(p)
    x0, y0, w0, h0 = ARCH1
    x, y, w, h = x0 * (1 - e), y0 * (1 - e), w0 + (W - w0) * e, h0 + (H - h0) * e
    b0 = crop_box(IM[1], w0, h0, 480, 640, 1.04); b1 = crop_box(IM[1], W, H, 480, 640, 1.0)
    box = tuple(b0[i] + (b1[i] - b0[i]) * e for i in range(4))
    wi, hi = int(round(w)), int(round(h))
    img = IM[1].resize((wi, hi), Image.BICUBIC, box=box)
    put(out, img, "arch", int(round(x)), int(round(y)), (w / 2) * (1 - e))
    return out

def tr_push(A, B, p, tg=0.0):
    e = e_io(p); out = Image.new("RGB", (W, H), WHITE)
    out.paste(A, (int(-0.25 * W * e), 0)); out.paste(B, (int(W * (1 - e)), 0))
    if 0.02 < p < 0.98: ghost(out, W * (1 - e) - 20, H / 2 + 80, 520, tg, 0.0)
    return out

def hat_layer(sc):
    ss = 3; w, h = int(560 * sc), int(340 * sc)
    lay = Image.new("RGBA", (w * ss, h * ss), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    def P(pts): return [((x * sc + w / 2) * ss, (y * sc + h) * ss) for x, y in pts]
    cone = [(-140, 0), (-105, -70), (-65, -170), (-20, -250), (40, -300), (100, -290), (95, -225), (110, -120), (140, 0)]
    d.polygon(P(cone), fill=VIOLET + (255,))
    d.polygon(P([(-118, -26), (-110, -62), (112, -62), (120, -26)]), fill=ORANGE + (255,))
    return lay.resize((w, h), Image.LANCZOS)

def tr_hat(A, B, p, tg=0.0):
    e = e_io(p); edge = int((H + 380) * (1 - e) - 60 * e)
    out = A.copy()
    if edge < H: out.paste(B.crop((0, max(edge, 0), W, H)), (0, max(edge, 0)))
    d = ImageDraw.Draw(out); d.rectangle([0, edge, W, edge + 34], fill=VIOLET)
    hl = hat_layer(1.5)
    out.paste(hl, (W // 2 - hl.width // 2, edge - hl.height + 18), hl)
    for k, bx in enumerate([140, 320, 760, 940]):
        bat(out, bx, edge - 90 - 40 * (k % 2), 130, tg, BLACK, k * 0.25)
    return out

def tr_stripes(A, B, p):
    out = A.copy(); cols = [VIOLET, FUCSIA, ORANGE, YELLOW, LIME]; hh = H // 5; d = ImageDraw.Draw(out)
    for i, c in enumerate(cols):
        q = clamp((p - i * 0.07) / 0.65)
        L = int(e_io(clamp(2 * q - 1)) * W); R = int(e_io(clamp(2 * q)) * W)
        y0 = i * hh; y1 = H if i == 4 else y0 + hh
        if R > 0: d.rectangle([0, y0, R, y1], fill=c)
        if L > 0: out.paste(B.crop((0, y0, L, y1)), (0, y0))
    return out

def tr_rise(A, B, p, tg=0.0):
    e = e_io(p); top = H * (1 - e) - 540 * e; out = A.copy()
    def mk(t): return aamask(lambda d, ss: d.rounded_rectangle([0, t * ss, W * ss - 1, (H + 700) * ss], radius=540 * ss, fill=255, corners=(True, True, False, False)))
    if p < 0.95: out.paste(Image.new("RGB", (W, H), YELLOW), (0, 0), mk(top - 34))
    out.paste(B, (0, 0), mk(top))
    if 0.03 < p < 0.95:
        for k, bx in enumerate([200, 540, 880]):
            bat(out, bx, top - 60 - 50 * (k % 2) + 40 * (1 - abs(bx - 540) / 540), 150, tg, BLACK, k * 0.3)
    return out

def frame(n):
    t = n / FPS
    order = [k for k, _ in SCENES]
    i = max(j for j, k in enumerate(order) if S[k] <= t + 1e-9)
    name, fn = SCENES[i]; tl = t - S[name]
    if i > 0 and tl < TD[name]:
        pname, pfn = SCENES[i - 1]
        p = tl / TD[name]
        if name == "altar":
            return tr_arch(pfn(t - S[pname], t), p)
        A = pfn(t - S[pname], t); B = fn(tl, t)
        if name == "title": return tr_iris(A, B, p, W / 2, H / 2, 34, ORANGE)
        if name == "costume": return tr_push(A, B, p, t)
        if name == "collage": return tr_hat(A, B, p, t)
        if name == "group": return tr_iris(A, B, p, 0, H, 40, VIOLET, True, t)
        if name == "burst": return tr_stripes(A, B, p)
        if name == "close": return tr_rise(A, B, p, t)
    return fn(tl, t)

def work(args):
    a, b, outdir = args
    for n in range(a, b):
        frame(n).save(os.path.join(outdir, f"f{n:04d}.jpg"), quality=95, subsampling=0)
    return b

if __name__ == "__main__":
    total = int(DUR * FPS)
    a = int(sys.argv[2]) if len(sys.argv) > 2 else 0
    b = int(sys.argv[3]) if len(sys.argv) > 3 else total
    outdir = os.path.join(WORK, "frames"); os.makedirs(outdir, exist_ok=True)
    init()
    step = 10
    jobs = [(i, min(i + step, b), outdir) for i in range(a, b, step)]
    with Pool(4, initializer=init) as pool:
        for r in pool.imap_unordered(work, jobs): pass
    print("ok", a, b)
