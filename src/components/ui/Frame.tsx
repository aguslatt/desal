/** Hueco para una fotografía real que todavía no existe (se ve como pieza de contact sheet, no como "error"). */
export function PhotoSlot({ title, className = "", style }: { title: string; seed?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`ph-hatch relative overflow-hidden ${className}`} style={style}>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
        <span className="serif serif-i text-[3.4vw] md:text-[2vw]" style={{ lineHeight: 1 }}>{title}</span>
        <span className="label label-sm opacity-60">foto · <span className="ph">placeholder</span></span>
      </div>
    </div>
  );
}
