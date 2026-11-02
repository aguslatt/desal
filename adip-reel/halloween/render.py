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

# ---------- escenas ----------
CUTS = [(3, 480, 320, 360), (5, 225, 630, 450), (2, 910, 380, 360), (5, 780, 570, 440)]

def sc_details(tl, tg):
    i = min(int(tl / 0.25), 3); loc = (tl - i * 0.25) / 0.25
    n, cx, cy, bw = CUTS[i]
    return crop_to(IM[n], W, H, cx, cy, 1.0 + 0.12 * loc, bw)

ARCH1 = (160, 840, 760, 1000)
def sc_title(tl, tg):
    cv = Image.new("RGB", (W, H), WHITE)
    bar(cv, 0, 22)
    pl = pulse(tg)
    circle(cv, 990, 90, 300 * e_back(seg(tl, 0.0, 0.6)) * (1 + 0.02 * pl), ORANGE)
    circle(cv, 800, 1060, 250 * e_back(seg(tl, 0.25, 0.6)), VIOLET)
    sz = fit_size(["Halloween"], 900, 160, 900)
    L = [("Halloween", 900, sz, BLACK), ("se vivió así", 300, 104, BLACK), ("en ADIP", 900, sz, VIOLET)]
    y = 150
    for k, (t, wt, s, col) in enumerate(L):
        lay = text_layer(t, wt, s, col)
        reveal(cv, lay, 80, y, seg(tl, 0.08 + 0.16 * k, 0.45))
        y += int(lay.height * 0.84)
    trazo(cv, 80, y - 10, 1.2, seg(tl, 0.9, 0.6), ORANGE)
    x, y0, w, h = ARCH1
    rise = e_out(seg(tl, 0.3, 0.7))
    img = crop_to(IM[1], w, h, 480, 640, 1.0 + 0.04 * seg(tl, 0.3, 2.7))
    put(cv, img, "arch", x, y0 + (1 - rise) * 1100)
    return cv

def sc_altar(tl, tg):
    cv = crop_to(IM[1], W, H, 480, 640, 1.0 + 0.12 * seg(tl, 0.7, 1.8))
    pill(cv, "DECORACIÓN", 80, 260, seg(tl, 0.9, 0.4))
    return cv

def sc_costume(tl, tg):
    cv = Image.new("RGB", (W, H), T_ORANGE)
    circle(cv, 900, 1650, 430 * (1 + 0.02 * pulse(tg)), VIOLET)
    circle(cv, 930, 250, 62 * e_back(seg(tl, 0.7, 0.4)), WHITE)
    img = crop_to(IM[3], 860, 1240, 520, 640, 1.0 + 0.07 * seg(tl, 0, 3.0))
    put(cv, img, "rr", 110, 340, 48)
    pill(cv, "DISFRACES", 110, 240, seg(tl, 0.55, 0.4))
    trazo(cv, 90, 1600, 2.4, seg(tl, 1.0, 0.7), VIOLET)
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
    circle(cv, 150, 250, 58 * e_back(seg(tl, 0.8, 0.4)), VIOLET)
    trazo(cv, 520, 1620, 1.5, seg(tl, 2.0, 0.6), ORANGE)
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
    s = 0.92 + 0.08 * e_back(seg(tl, 0.15, 0.6))
    ph = crop_to(IM[2], W, 618, 640, 366, 1.0 + 0.05 * seg(tl, 0.3, 4.2) + 0.012 * pulse(tg))
    cv.paste(ph, (0, 700))
    # recortes de máscaras
    dets = [(985, 235, 200), (665, 95, 170), (150, 100, 190)]
    for k, (cx, cy, bw) in enumerate(dets):
        s = e_back(seg(tl, 1.5 + 0.5 * k, 0.45))
        if s < 0.03: continue
        d = int(300 * s)
        put(cv, crop_to(IM[2], d, d, cx, cy, 1.0, bw), "circle", 90 + 300 * k + (300 - d) / 2, 1480 + (300 - d) / 2)
    bar(cv, 1898, 22)
    return cv

def sc_burst(tl, tg):
    cv = Image.new("RGB", (W, H), T_YELLOW)
    circle(cv, 880, 360, 110 * e_back(seg(tl, 0.9, 0.4)), VIOLET)
    circle(cv, 560, 1500, 80 * e_back(seg(tl, 1.4, 0.4)), ORANGE)
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
    for k, (t, wt, s2, col) in enumerate([("Así celebramos", 300, 84, BLACK), ("Halloween", 900, sz, BLACK),
                                           ("en Equipo ADIP", 900, 84, VIOLET)]):
        lay = text_layer(t, wt, s2, col)
        reveal(cv, lay, 80, y, seg(tl, 0.9 + 0.2 * k, 0.5))
        y += int(lay.height * 0.84)
    trazo(cv, 80, y + 5, 1.0, seg(tl, 1.7, 0.6), ORANGE)
    logo(cv, W / 2, 1640, 440, seg(tl, 2.6, 0.8))
    return cv

SCENES = [("details", sc_details), ("title", sc_title), ("altar", sc_altar), ("costume", sc_costume),
          ("collage", sc_collage), ("group", sc_group), ("burst", sc_burst), ("close", sc_close)]

# ---------- transiciones ----------
def tr_iris(A, B, p, cx, cy, ring, color):
    e = e_io(p); mx = max(math.hypot(cx, cy), math.hypot(W - cx, cy), math.hypot(cx, H - cy), math.hypot(W - cx, H - cy))
    r = mx * e
    out = A.copy()
    if r < 1: return out
    def mk(rad): return aamask(lambda d, ss: d.ellipse([(cx - rad) * ss, (cy - rad) * ss, (cx + rad) * ss, (cy + rad) * ss], fill=255))
    if p < 0.97: out.paste(Image.new("RGB", (W, H), color), (0, 0), mk(r + ring))
    out.paste(B, (0, 0), mk(r))
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

def tr_push(A, B, p):
    e = e_io(p); out = Image.new("RGB", (W, H), WHITE)
    out.paste(A, (int(-0.25 * W * e), 0)); out.paste(B, (int(W * (1 - e)), 0))
    return out

def hat_layer(sc):
    ss = 3; w, h = int(560 * sc), int(340 * sc)
    lay = Image.new("RGBA", (w * ss, h * ss), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    def P(pts): return [((x * sc + w / 2) * ss, (y * sc + h) * ss) for x, y in pts]
    cone = [(-140, 0), (-105, -70), (-65, -170), (-20, -250), (40, -300), (100, -290), (95, -225), (110, -120), (140, 0)]
    d.polygon(P(cone), fill=VIOLET + (255,))
    band = [(-112, -40), (-122, -10), (122, -10), (112, -50)]
    d.polygon(P([(-118, -26), (-110, -62), (112, -62), (120, -26)]), fill=ORANGE + (255,))
    return lay.resize((w, h), Image.LANCZOS)

def tr_hat(A, B, p):
    e = e_io(p); edge = int((H + 380) * (1 - e) - 60 * e)
    out = A.copy()
    if edge < H: out.paste(B.crop((0, max(edge, 0), W, H)), (0, max(edge, 0)))
    d = ImageDraw.Draw(out); d.rectangle([0, edge, W, edge + 34], fill=VIOLET)
    hl = hat_layer(1.5)
    out.paste(hl, (W // 2 - hl.width // 2, edge - hl.height + 18), hl)
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

def tr_rise(A, B, p):
    e = e_io(p); top = H * (1 - e) - 540 * e; out = A.copy()
    def mk(t): return aamask(lambda d, ss: d.rounded_rectangle([0, t * ss, W * ss - 1, (H + 700) * ss], radius=540 * ss, fill=255, corners=(True, True, False, False)))
    if p < 0.95: out.paste(Image.new("RGB", (W, H), YELLOW), (0, 0), mk(top - 34))
    out.paste(B, (0, 0), mk(top))
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
        if name == "costume": return tr_push(A, B, p)
        if name == "collage": return tr_hat(A, B, p)
        if name == "group": return tr_iris(A, B, p, 0, H, 40, VIOLET)
        if name == "burst": return tr_stripes(A, B, p)
        if name == "close": return tr_rise(A, B, p)
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
