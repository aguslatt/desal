/** Marcas de lápiz graso bermellón (SVG trazado a mano). El único gesto "ajeno" del sistema: 1 por vista, máx. */
export function PencilCircle({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 120 80" className={`pointer-events-none overflow-visible text-bermellon ${className}`} style={style} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden>
      <path d="M62 6c-30-2-56 14-57 36-1 22 24 33 53 31 31-2 57-17 56-40C113 14 88 4 58 8" />
      <path d="M58 8c-6 1-12 3-17 6" opacity=".6" />
    </svg>
  );
}
export function PencilArrow({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 120 60" className={`pointer-events-none overflow-visible text-bermellon ${className}`} style={style} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 44C30 52 62 40 96 14" />
      <path d="M78 10l20 3-3 21" />
    </svg>
  );
}
export function PencilX({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 80 80" className={`pointer-events-none overflow-visible text-bermellon ${className}`} style={style} fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" aria-hidden>
      <path d="M6 8c20 18 44 40 68 64" />
      <path d="M72 6C52 26 30 48 8 74" />
    </svg>
  );
}
