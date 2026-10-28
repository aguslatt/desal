import Link from "next/link";
import { Visualizacion } from "./a11y/Visualizacion";

const nav = [
  { href: "/lugares", t: "Lugares" },
  { href: "/necesidades", t: "Mis necesidades" },
  { href: "/comercios", t: "Para comercios" },
];

export function Header() {
  return (
    <header className="site-header z-40 sm:sticky sm:top-0 border-b border-soft bg-bg/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/" className="tap inline-flex items-center gap-2 text-xl font-bold text-ink no-underline">
          <span aria-hidden="true" className="inline-block h-6 w-6 rounded-t-full border-2 border-b-0 border-current" />
          Umbral
        </Link>
        <nav aria-label="Principal">
          <ul className="flex flex-wrap items-center gap-x-1">
            {nav.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="tap inline-flex items-center px-3 font-bold text-ink no-underline hover:underline">
                  {n.t}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <Visualizacion />
      </div>
    </header>
  );
}
