import type { FotoTipo } from "@/lib/types";

/** Siluetas neutras de línea para fotos que todavía no tenemos. Nada de ilustraciones infantiles. */
const escenas: Record<FotoTipo, React.ReactNode> = {
  fachada: (<><path d="M30 150V70h140v80" /><path d="M20 150h160" /><rect x="84" y="96" width="32" height="54" /><path d="M42 70V52h116v18" /><rect x="44" y="92" width="26" height="30" /><rect x="130" y="92" width="26" height="30" /></>),
  vereda: (<><path d="M0 130h200M0 150h200" /><path d="M120 130V60h56v70" /><rect x="136" y="90" width="24" height="40" /><path d="M20 150l50-20M60 150l50-20" /></>),
  ingreso: (<><rect x="62" y="40" width="76" height="110" /><path d="M62 150H20m160 0h-42" /><circle cx="124" cy="98" r="3" /><path d="M62 40h76" /></>),
  interior: (<><path d="M20 60h160M20 150h160M20 60l30 30h100l30-30" /><rect x="60" y="106" width="30" height="20" /><rect x="110" y="106" width="30" height="20" /></>),
  mesa: (<><path d="M50 100h100M100 100v50M70 150h60" /><path d="M40 110v40M160 110v40" /></>),
  bano: (<><rect x="40" y="50" width="120" height="100" /><path d="M40 90h120M70 110h4M70 130h4" /><circle cx="130" cy="120" r="14" /></>),
};

/**
 * Foto o, si no hay archivo, un placeholder neutro. El alt describe lo que muestra la foto real.
 * Al reemplazar los datos por fotos reales, completá `src` en lugares.json.
 */
export function Foto({ tipo, alt, src, className = "" }: { tipo: FotoTipo; alt: string; src?: string; className?: string }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} loading="lazy" className={`w-full rounded-xl object-cover ${className}`} />;
  }
  return (
    <figure className={`relative m-0 overflow-hidden rounded-xl border border-soft bg-surface-2 ${className}`}>
      <svg viewBox="0 0 200 180" role="img" aria-label={alt} className="block h-full w-full text-muted" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        {escenas[tipo]}
      </svg>
      <figcaption className="absolute bottom-2 left-2 rounded-full bg-surface px-2.5 py-0.5 text-xs font-bold text-muted">
        Foto de ejemplo
      </figcaption>
    </figure>
  );
}
