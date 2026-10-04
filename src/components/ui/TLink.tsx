"use client";

import Link from "next/link";
import type { ComponentProps, MouseEvent } from "react";
import { navigateTo } from "@/lib/transition";

/** Link con transición de página (corte de sal). */
export function TLink({ href, label, onClick, children, ...rest }: Omit<ComponentProps<typeof Link>, "href"> & { href: string; label?: string }) {
  return (
    <Link
      href={href}
      {...rest}
      onClick={(e: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(e);
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        navigateTo(href, label);
      }}
    >
      {children}
    </Link>
  );
}

/** Texto con rollover vertical (hover de links). */
export function Roll({ children }: { children: string }) {
  return (
    <span className="lnk" aria-label={children}>
      <span aria-hidden>{children}</span>
      <span aria-hidden>{children}</span>
    </span>
  );
}
