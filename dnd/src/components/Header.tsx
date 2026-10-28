import Link from "next/link";
import { Visualizacion } from "./a11y/Visualizacion";
import { NavLinks } from "./NavLinks";

/** Marca: un arco, el umbral de una puerta. */
export function Marca({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" width="1.75em" height="1.75em" aria-hidden="true" focusable="false" className={className}>
      <rect width="40" height="40" rx="11" fill="currentColor" />
      <path d="M12 29V19a8 8 0 0 1 16 0v10" fill="none" stroke="var(--bg)" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 29h24" stroke="var(--bg)" strokeWidth="3.6" strokeLinecap="round" />
    </svg>
  );
}

export function Header() {
  return (
    <header className="site-header z-40 border-b border-soft bg-bg/90 backdrop-blur sm:sticky sm:top-0">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/" className="tap display inline-flex items-center gap-2.5 text-2xl font-extrabold tracking-tight text-accent no-underline">
          <Marca />
          <span className="text-ink">Umbral</span>
        </Link>
        <nav aria-label="Principal">
          <NavLinks />
        </nav>
        <Visualizacion />
      </div>
    </header>
  );
}
