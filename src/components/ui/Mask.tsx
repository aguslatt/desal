import { createElement, type ReactNode } from "react";

/** Línea de texto con revelado por máscara (sube desde abajo). */
export function Mask({ children, as = "span", delay, className = "", start }: {
  children: ReactNode; as?: string; delay?: number; className?: string; start?: string;
}) {
  return createElement(
    as,
    { className: `mask ${className}` },
    <span className="mask-in" data-rv="up" data-rv-delay={delay} data-rv-start={start}>{children}</span>,
  );
}

/** Dato por definir: se ve como placeholder y nunca como información oficial. */
export function Ph({ children = "por definir" }: { children?: ReactNode }) {
  return <span className="ph" title="Placeholder: dato real por definir">[{children}]</span>;
}
