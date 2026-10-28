import type { FotoTipo, Rubro } from "@/lib/types";

/**
 * Escenas de ejemplo para los lugares que todavía no tienen foto: formas geométricas y una paleta propia
 * por rubro, con pequeñas variaciones por local (mismo id = misma escena). No son fotos de comercios reales.
 * Al reemplazar los datos por fotos reales, completá `src` en lugares.json.
 */
interface Paleta { cielo: string; pared: string; acento: string; oscuro: string; luz: string; verde: string; piso: string }

const PALETAS: Record<Rubro, Paleta> = {
  cafe: { cielo: "#FFE9C7", pared: "#F6C9A0", acento: "#C8553D", oscuro: "#5B2E1A", luz: "#FFD66B", verde: "#2F6B4F", piso: "#D9A66F" },
};

function semilla(texto: string) {
  let h = 2166136261;
  for (const c of texto) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0) % 1000) / 1000;
}

function Planta({ x, y, c, escala = 1 }: { x: number; y: number; c: Paleta; escala?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${escala})`}>
      <path d="M-14 0h28l-4 26h-20z" fill={c.oscuro} />
      <ellipse cx="0" cy="-16" rx="9" ry="20" fill={c.verde} />
      <ellipse cx="-13" cy="-8" rx="7" ry="15" fill={c.verde} opacity=".8" transform="rotate(-25 -13 -8)" />
      <ellipse cx="13" cy="-8" rx="7" ry="15" fill={c.verde} opacity=".8" transform="rotate(25 13 -8)" />
    </g>
  );
}

function Escena({ tipo, c, r }: { tipo: FotoTipo; c: Paleta; r: () => number }) {
  const n = 2 + Math.floor(r() * 3); // 2 a 4 elementos repetidos
  switch (tipo) {
    case "fachada": {
      const rayas = 6 + Math.floor(r() * 3) * 2;
      const ancho = 220 / rayas;
      return (
        <>
          <rect width="400" height="300" fill={c.cielo} />
          <circle cx={290 + r() * 60} cy={55 + r() * 20} r="26" fill={c.luz} />
          <rect y="248" width="400" height="52" fill={c.piso} />
          <rect x="60" y="92" width="280" height="158" fill={c.pared} />
          <rect x="52" y="80" width="296" height="16" fill={c.oscuro} />
          {Array.from({ length: rayas }, (_, i) => (
            <rect key={i} x={90 + i * ancho} y="128" width={ancho} height="34" fill={i % 2 ? c.luz : c.acento} />
          ))}
          <rect x="88" y="100" width="224" height="22" rx="4" fill={c.oscuro} />
          <rect x="102" y="108" width="70" height="6" rx="3" fill={c.luz} />
          <path d="M172 250v-62a28 28 0 0 1 56 0v62z" fill={c.acento} />
          <rect x="95" y="172" width="62" height="52" rx="4" fill={c.luz} stroke={c.oscuro} strokeWidth="4" />
          <rect x="243" y="172" width="62" height="52" rx="4" fill={c.luz} stroke={c.oscuro} strokeWidth="4" />
          <Planta x={50} y={228} c={c} />
          <Planta x={352} y={228} c={c} escala={0.9} />
        </>
      );
    }
    case "vereda":
      return (
        <>
          <rect width="400" height="300" fill={c.cielo} />
          <rect y="60" width="400" height="130" fill={c.pared} />
          <path d="M250 190v-60a26 26 0 0 1 52 0v60z" fill={c.acento} />
          <rect x="60" y="100" width="70" height="60" rx="4" fill={c.luz} stroke={c.oscuro} strokeWidth="4" />
          <path d="M0 190h400v110H0z" fill={c.piso} />
          {Array.from({ length: 8 }, (_, i) => (
            <path key={i} d={`M${i * 60 - 20} 300L${100 + i * 28} 190`} stroke={c.oscuro} strokeOpacity=".25" strokeWidth="3" />
          ))}
          <path d="M0 232h400M0 268h400" stroke={c.oscuro} strokeOpacity=".25" strokeWidth="3" />
          <rect x="30" y="120" width="10" height="90" fill={c.oscuro} />
          <circle cx="35" cy="108" r="34" fill={c.verde} />
          {Array.from({ length: n }, (_, i) => (
            <rect key={i} x={170 + i * 44} y="218" width="12" height="34" rx="6" fill={c.oscuro} />
          ))}
        </>
      );
    case "ingreso":
      return (
        <>
          <rect width="400" height="300" fill={c.pared} />
          {Array.from({ length: 6 }, (_, i) => (
            <path key={i} d={`M0 ${i * 52}h400`} stroke={c.oscuro} strokeOpacity=".12" strokeWidth="3" />
          ))}
          <path d="M120 270V120a80 80 0 0 1 160 0v150z" fill={c.oscuro} />
          <path d="M138 270V122a62 62 0 0 1 124 0v148z" fill={c.acento} />
          <circle cx="246" cy="196" r="7" fill={c.luz} />
          <path d="M200 60v70M138 122h124" stroke={c.oscuro} strokeOpacity=".35" strokeWidth="4" />
          <rect x="100" y="270" width="200" height="30" fill={c.piso} />
          <rect x="150" y="276" width="100" height="14" rx="5" fill={c.oscuro} opacity=".6" />
          <Planta x={64} y={250} c={c} />
          <Planta x={338} y={250} c={c} />
        </>
      );
    case "interior":
      return (
        <>
          <rect width="400" height="300" fill={c.pared} />
          <rect y="200" width="400" height="100" fill={c.piso} />
          <rect x="250" y="50" width="100" height="100" rx="6" fill={c.cielo} stroke={c.oscuro} strokeWidth="5" />
          <path d="M300 50v100M250 100h100" stroke={c.oscuro} strokeWidth="4" />
          {Array.from({ length: n }, (_, i) => {
            const x = 60 + (i * 220) / n;
            return (
              <g key={i}>
                <path d={`M${x} 0v${50 + (i % 2) * 22}`} stroke={c.oscuro} strokeWidth="3" />
                <path d={`M${x - 24} ${70 + (i % 2) * 22}a24 24 0 0 1 48 0z`} fill={c.luz} />
              </g>
            );
          })}
          {[90, 210, 320].map((x, i) => (
            <g key={x}>
              <ellipse cx={x} cy={228 + i * 6} rx="46" ry="12" fill={c.oscuro} />
              <rect x={x - 4} y={228 + i * 6} width="8" height="40" fill={c.oscuro} />
              <circle cx={x - 18} cy={216 + i * 6} r="7" fill={c.luz} />
              <circle cx={x + 16} cy={218 + i * 6} r="7" fill={c.acento} />
            </g>
          ))}
          <Planta x={360} y={196} c={c} escala={1.2} />
        </>
      );
    case "mesa":
      return (
        <>
          <rect width="400" height="300" fill={c.pared} />
          <circle cx="320" cy="70" r="46" fill={c.luz} opacity=".85" />
          <rect x="30" y="190" width="340" height="22" rx="8" fill={c.oscuro} />
          <rect x="60" y="212" width="14" height="88" fill={c.oscuro} />
          <rect x="326" y="212" width="14" height="88" fill={c.oscuro} />
          <ellipse cx="200" cy="186" rx="60" ry="9" fill={c.piso} />
          <rect x="90" y="140" width="44" height="46" rx="8" fill={c.cielo} stroke={c.oscuro} strokeWidth="4" />
          <path d="M134 152h14a10 10 0 0 1 0 22h-14" fill="none" stroke={c.oscuro} strokeWidth="5" />
          <rect x="250" y="148" width="40" height="38" rx="8" fill={c.acento} />
          <path d="M290 158h12a9 9 0 0 1 0 18h-12" fill="none" stroke={c.acento} strokeWidth="5" />
          <path d="M104 120c-6-10 6-14 0-24M118 120c-6-10 6-14 0-24" fill="none" stroke={c.oscuro} strokeOpacity=".4" strokeWidth="4" strokeLinecap="round" />
          <Planta x={50} y={130} c={c} escala={0.9} />
        </>
      );
    case "bano":
      return (
        <>
          <rect width="400" height="300" fill={c.cielo} />
          {Array.from({ length: 9 }, (_, i) => (
            <path key={i} d={`M${i * 50} 0v230`} stroke={c.oscuro} strokeOpacity=".14" strokeWidth="3" />
          ))}
          {Array.from({ length: 5 }, (_, i) => (
            <path key={i} d={`M0 ${i * 50}h400`} stroke={c.oscuro} strokeOpacity=".14" strokeWidth="3" />
          ))}
          <rect y="230" width="400" height="70" fill={c.piso} />
          <rect x="40" y="130" width="130" height="14" rx="7" fill={c.acento} />
          <rect x="52" y="128" width="12" height="40" rx="6" fill={c.acento} />
          <rect x="146" y="128" width="12" height="40" rx="6" fill={c.acento} />
          <rect x="215" y="100" width="120" height="14" rx="4" fill={c.oscuro} />
          <path d="M225 114h100v36a20 20 0 0 1-20 20h-60a20 20 0 0 1-20-20z" fill={c.pared} stroke={c.oscuro} strokeWidth="4" />
          <rect x="271" y="84" width="8" height="18" fill={c.oscuro} />
          <circle cx="275" cy="196" r="20" fill={c.luz} opacity=".0" />
          <rect x="228" y="170" width="94" height="60" fill={c.oscuro} opacity=".12" />
        </>
      );
  }
}

export function Foto({
  tipo,
  alt,
  src,
  srcSet,
  sizes = "(min-width: 1024px) 40vw, 100vw",
  prioridad = false,
  rubro = "cafe",
  semilla: sem = "umbral",
  className = "",
}: {
  tipo: FotoTipo;
  alt: string;
  src?: string;
  srcSet?: string;
  sizes?: string;
  /** La primera imagen visible se carga sin demora (mejora el LCP). */
  prioridad?: boolean;
  rubro?: Rubro;
  /** Normalmente el id del lugar: define las variaciones de la escena. */
  semilla?: string;
  className?: string;
}) {
  if (src) {
    // Foto real (ilustrativa o propia). Si trae srcSet, el navegador elige el ancho justo.
    return (
      <figure className={`relative m-0 overflow-hidden rounded-2xl bg-surface-2 ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          srcSet={srcSet}
          sizes={srcSet ? sizes : undefined}
          alt={alt}
          width={960}
          height={640}
          loading={prioridad ? "eager" : "lazy"}
          fetchPriority={prioridad ? "high" : undefined}
          decoding="async"
          className="block h-full w-full object-cover"
        />
        <figcaption className="absolute bottom-3 left-3 rounded-full bg-surface px-3 py-0.5 text-xs font-bold text-muted">Foto ilustrativa</figcaption>
      </figure>
    );
  }
  const c = PALETAS[rubro];
  return (
    <figure className={`relative m-0 overflow-hidden rounded-2xl ${className}`} style={{ background: c.cielo }}>
      <svg viewBox="0 0 400 300" role="img" aria-label={alt} preserveAspectRatio="xMidYMid slice" className="block h-full w-full">
        <Escena tipo={tipo} c={c} r={semilla(`${sem}-${tipo}`)} />
      </svg>
      <figcaption className="absolute bottom-3 left-3 rounded-full bg-surface px-3 py-0.5 text-xs font-bold text-muted">
        Ilustración de ejemplo
      </figcaption>
    </figure>
  );
}
