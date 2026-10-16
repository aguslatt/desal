"use client";
import { useEffect, useRef, type ElementType, type ReactNode } from "react";

/** Revelado al entrar en pantalla. Sin JS o con movimiento reducido queda visible. */
export default function Rv({
  as: Tag = "div",
  kind = "up",
  delay = 0,
  className,
  children,
}: {
  as?: ElementType;
  kind?: "up" | "img";
  delay?: number;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      el.dataset.in = "1";
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.dataset.in = "1";
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag ref={ref} data-rv={kind} className={className} style={delay ? ({ "--d": `${delay}s` } as React.CSSProperties) : undefined}>
      {children}
    </Tag>
  );
}
