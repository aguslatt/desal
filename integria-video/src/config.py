"""Integria Salud - "Sil - Evaluaciones Neurocognitivas": configuración editable del montaje.

Todo lo que se ve o se oye de la posproducción se define acá (tiempos en segundos).
El video fuente NO se recorta ni se reordena: los cortes internos (SHOT_CUTS) ya vienen
del montaje aprobado y sólo se resuelven con transiciones de marca.
"""
import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, "assets")
FPS = 30
W, H = 1080, 1920
SRC_W, SRC_H = 2160, 3840

# ---- Paleta (Manual de Identidad Visual v1.0, p.13) -------------------------------------
AZUL = (0x34, 0x39, 0xE9)        # Azul Integria  #3439E9  color principal
PROFUNDO = (0x10, 0x20, 0x5A)    # Azul profundo  #10205A  textos y fondos
AQUA = (0x43, 0xC0, 0xC7)        # Aqua           #43C0C7  acentos y CTA
CELESTE = (0xB8, 0xCB, 0xFA)     # Celeste        #B8CBFA  apoyo y superficies
HIELO = (0xED, 0xF4, 0xFF)       # Hielo          #EDF4FF  fondos claros
BLANCO = (255, 255, 255)

FONT = {  # Montserrat (tipografía principal del manual, p.14)
    "bold": os.path.join(ASSETS, "fonts", "Montserrat-Bold.ttf"),
    "semibold": os.path.join(ASSETS, "fonts", "Montserrat-SemiBold.ttf"),
    "medium": os.path.join(ASSETS, "fonts", "Montserrat-Medium.ttf"),
}
LOGO = os.path.join(ASSETS, "logo_integria_color.png")   # logo original (PDF fondo de Zoom)
LOGO_BG = (238, 240, 251)                                # fondo propio de ese archivo

# ---- Planos del montaje aprobado (cortes detectados en el video fuente) -----------------
# (inicio, fin, cara izquierda=Silvina (nx,ny), cara derecha=entrevistadora (nx,ny))
SHOTS = [
    (0.00, 3.20, (.200, .450), (.750, .460)),
    (3.20, 7.37, (.240, .440), (.760, .445)),
    (7.37, 13.27, (.175, .456), (.736, .483)),
    (13.27, 17.90, (.245, .449), (.725, .463)),
    (17.90, 21.00, (.190, .460), (.740, .478)),
    (21.00, 23.27, (.247, .452), (.728, .464)),
    (23.27, 26.27, (.160, .530), (.708, .545)),
    (26.27, 30.67, (.175, .550), (.672, .567)),
    (30.67, 32.43, (.175, .555), (.700, .567)),
    (32.43, 36.33, (.136, .555), (.700, .560)),
    (36.33, 38.83, (.133, .555), (.694, .560)),
    (38.83, 47.80, (.233, .500), (.722, .520)),
    (47.80, 49.634, (.305, .525), (.767, .516)),
]
SHOT_CUTS = [s[0] for s in SHOTS[1:]]
DURATION = 49.633333

# ---- Plan de cámara: reencuadre digital (z = zoom, foco L/R/M, posición del foco en pantalla)
# (t0, t1, shot, foco, z0, z1, (ox, oy))
CAM = [
    (0.00, 3.20, 0, "M", 1.10, 1.14, (.50, .53)),
    (3.20, 7.37, 1, "M", 1.16, 1.21, (.50, .53)),
    (7.37, 13.27, 2, "L", 1.50, 1.56, (.40, .54)),
    (13.27, 17.90, 3, "M", 1.10, 1.14, (.50, .53)),
    (17.90, 21.00, 4, "L", 1.46, 1.52, (.40, .54)),
    (21.00, 23.27, 5, "M", 1.12, 1.16, (.50, .53)),
    (23.27, 26.27, 6, "R", 1.46, 1.52, (.52, .54)),
    (26.27, 30.67, 7, "M", 1.08, 1.12, (.50, .53)),
    (30.67, 32.43, 8, "R", 1.28, 1.34, (.52, .54)),
    (32.43, 36.33, 9, "L", 1.46, 1.52, (.40, .54)),
    (36.33, 38.83, 10, "M", 1.06, 1.10, (.50, .53)),
    (38.83, 41.20, 11, "L", 1.46, 1.52, (.40, .54)),
    (41.20, 44.26, 11, "M", 1.12, 1.16, (.50, .53)),   # reencuadre dentro del plano (reveal)
    (44.26, 47.80, 11, "L", 1.30, 1.38, (.42, .54)),   # reencuadre dentro del plano (reveal)
    (47.80, 49.634, 12, "M", 1.02, 1.06, (.50, .53)),
]
# Pequeños "punch" de escala (t, amplitud) sobre palabras clave.
PUNCH = [(10.85, .035), (14.55, .03), (20.95, .035), (29.45, .035), (35.30, .03), (41.65, .035), (46.85, .03)]

# ---- Transiciones de marca ---------------------------------------------------------------
# En cada corte del montaje: cierre -> (2 fotogramas cubiertos sobre el corte) -> apertura.
# (tiempo del corte, estilo, fotogramas a cada lado)  estilos: iris, window, arc, dots, circles
CUT_TRANSITIONS = [
    (3.20, "iris", 6),
    (7.37, "circles", 8),      # cambio de tema: entrevistada responde
    (13.27, "window", 5),
    (17.90, "arc", 5),
    (21.00, "dots", 6),
    (23.27, "circles", 8),     # cambio de tema: pregunta
    (26.27, "window", 5),
    (30.67, "iris", 5),
    (32.43, "arc", 9),         # cambio de tema: respuesta
    (36.33, "dots", 5),
    (38.83, "window", 6),
    (47.80, "iris", 6),        # hacia el cierre
]
# Reencuadres dentro de un mismo plano: (t, duración s). El nuevo encuadre entra por una máscara circular.
REVEALS = [(41.20, 0.50), (44.26, 0.50)]

# ---- Subtítulos (texto fiel al audio; Whisper large-v3 + revisión) -----------------------
# Cada bloque = frase; [[...]] marca palabras clave resaltadas en Aqua.
SUB_BLOCKS = [
    "Hola a todos, ¿cómo están?",
    "Estamos acá | junto a la licenciada Silvina,",
    "que nos va a contar un poco más acerca de",
    "las [[evaluaciones neurocognitivas.]]",
    "Estas evaluaciones son instancias muy necesarias",
    "cuando en el [[grupo familiar]] vemos a alguna persona",
    "que está comenzando con algunas [[dificultades]]",
    "en su [[comportamiento,]] en su [[vida diaria,]]",
    "o que le está imposibilitando de seguir el camino,",
    "[[olvidos, cambios de carácter.]]",
    "En el caso de que yo, | como [[hija, nieta,]]",
    "o vea que algún familiar esté viviendo",
    "alguna de estas diferentes situaciones",
    "que me comentaste recién,",
    "¿de qué manera debería [[proceder]]",
    "para recibir alguna de estas evaluaciones?",
    "Sucede muchas veces que",           # se une con la línea siguiente por ancho (ver subs.py)
    "los grupos familiares se encuentran [[desbordados,]]",
    "no entienden cómo [[proceder]] en estos casos.",
    "Por eso les recomendamos",
    "que frente a [[cualquier duda,]]",
    "por más pequeña que crean que sea,",
    "se [[comuniquen]] con nosotros",
    "y que vamos a estar [[orientándolos.]]",
    "Los esperamos.",
]

# ---- Gráficos en pantalla (sólo conceptos efectivamente mencionados) -------------------------
# (t_in, t_out, tipo, texto, slot)  tipo: id | title | chip | stack ; slot = posición vertical
OVERLAYS = [
    (2.30, 6.95, "id", "Lic. Silvina", 0),
    (5.35, 6.95, "title", "Evaluaciones\nneurocognitivas", 1),
    (10.75, 12.70, "chip", "Grupo familiar", 1),
    (14.45, 16.75, "chip", "Dificultades en\nel comportamiento", 1),
    (16.85, 18.50, "chip", "Vida diaria", 1),
    (20.85, 22.95, "chip", "Olvidos", 1),
    (21.60, 22.95, "chip", "Cambios de carácter", 2),
    (23.95, 26.05, "chip", "Hija · Nieta · Familiar", 1),
    (29.45, 32.05, "title", "¿Cómo\nproceder?", 1),
    (33.95, 36.10, "chip", "Grupos familiares\ndesbordados", 1),
    (41.20, 44.00, "title", "Cualquier\nduda", 1),
    (46.70, 47.60, "chip", "Orientación", 1),
]
INTRO_END = 2.35          # el logo grande se acomoda como sello en la esquina
END_CARD_START = 48.70    # después de la última palabra (termina ~48.34)

TAGLINE = "SALUD INTEGRAL  ·  VÍNCULO  ·  CONFIANZA"   # Manual p.4 / p.24

# ---- Audio ------------------------------------------------------------------------------------
WHOOSH_AT = [7.37, 23.27, 32.43]    # sólo en cambios de tema
CHIME_AT = 48.72


# =====================================================================================================
# v2 · dirección de arte "Conexión": profundidad (gráficos detrás de las personas), tipografía grande,
# transiciones por zoom/whip que NO tapan a nadie y subtítulos tipo vidrio con palabra activa.
# =====================================================================================================
SPEAKER_TURNS = [("R", 0.0, 7.32), ("L", 7.32, 23.10), ("R", 23.10, 32.25), ("L", 32.25, 49.7)]   # R=entrevistadora, L=Lic. Silvina

# Tipo de movimiento en cada corte del montaje: "topic" (cambio de tema), "whip" (respiro entre frases), "punch" (corte dentro de frase)
CUT_KIND = {3.20: "whip", 7.37: "topic", 13.27: "punch", 17.90: "punch", 21.00: "punch", 23.27: "topic",
            26.27: "punch", 30.67: "punch", 32.43: "topic", 36.33: "punch", 38.83: "whip", 47.80: "whip"}
CUT_PARAMS = {  # fotogramas antes/después, escala pico, desplazamiento px, desenfoque px
    "topic": dict(pre=6, post=11, scale=1.30, shift=150, blur=64),
    "whip": dict(pre=5, post=9, scale=1.15, shift=70, blur=30),
    "punch": dict(pre=3, post=8, scale=1.065, shift=0, blur=0),
}
CUT_DIR = {3.20: 1, 7.37: -1, 38.83: 1, 47.80: -1, 23.27: 1, 32.43: -1}

# Palabras clave GIGANTES (detrás de las personas): (t_in, t_out, [(línea, color)]) color: n=Azul profundo, a=Azul Integria
GIANT = [
    (5.30, 7.12, [("Evaluaciones", "n"), ("neurocognitivas", "a")]),
    (10.70, 12.72, [("Grupo", "n"), ("familiar", "a")]),
    (14.40, 16.78, [("Dificultades", "n"), ("en el", "n"), ("comportamiento", "a")]),
    (16.88, 18.58, [("Vida", "n"), ("diaria", "a")]),
    (20.85, 21.62, [("Olvidos", "a")]),
    (21.64, 22.98, [("Cambios", "n"), ("de carácter", "a")]),
    (23.95, 26.08, [("Hija · Nieta", "n"), ("Familiar", "a")]),
    (29.45, 32.08, [("¿Cómo", "n"), ("proceder?", "a")]),
    (33.90, 36.12, [("Grupos familiares", "n"), ("desbordados", "a")]),
    (41.20, 44.05, [("Cualquier", "n"), ("duda", "a")]),
    (46.70, 47.65, [("Orientación", "a")]),
]
ID_CHIP = (2.30, 6.95, "Lic. Silvina")
