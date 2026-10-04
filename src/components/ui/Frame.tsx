import { paperCut, saltLine } from "@/lib/cut";

/** Recuadro "corte de papel": nunca es un rectángulo perfecto. */
export function Frame({ seed, children, className = "", style, amp = 1.8 }: {
  seed: number; children: React.ReactNode; className?: string; style?: React.CSSProperties; amp?: number;
}) {
  return (
    <div className={`overflow-hidden ${className}`} style={{ clipPath: paperCut(seed, { n: 9, amp }), ...style }}>{children}</div>
  );
}

/** Hueco para una fotografía real que todavía no existe. Se ve como pieza de contact sheet, no como "error". */
export function PhotoSlot({ title, seed = 3, className = "", style }: { title: string; seed?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <Frame seed={seed} className={`ph-hatch relative ${className}`} style={style}>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
        <span className="serif serif-i text-[3.4vw] md:text-[2vw]" style={{ lineHeight: 1 }}>{title}</span>
        <span className="label label-sm opacity-60">foto · <span className="ph">placeholder</span></span>
      </div>
    </Frame>
  );
}

/** Borde superior irregular (línea de sal) para abrir una sección de otro color. */
export function SectionEdge({ color, seed = 1 }: { color: string; seed?: number }) {
  return <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[6vw] -translate-y-[calc(100%-1px)]" style={{ background: color, clipPath: saltLine(seed, 54, 60) }} />;
}
