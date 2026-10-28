"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/lugares", t: "Cafés" },
  { href: "/planes", t: "Planes" },
  { href: "/necesidades", t: "Mis necesidades" },
  { href: "/comercios", t: "Para cafés" },
];

/** Enlaces principales; la sección actual se marca con aria-current y con un fondo de color. */
export function NavLinks() {
  const ruta = usePathname();
  return (
    <ul className="flex flex-wrap items-center gap-1">
      {nav.map((n) => {
        const activo = ruta === n.href || ruta.startsWith(`${n.href}/`);
        return (
          <li key={n.href}>
            <Link
              href={n.href}
              aria-current={activo ? "page" : undefined}
              className={`tap inline-flex items-center rounded-full px-4 font-bold no-underline transition-colors hover:bg-surface-2 ${activo ? "bg-surface-2 text-accent underline decoration-2 underline-offset-8" : "text-ink"}`}
            >
              {n.t}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
