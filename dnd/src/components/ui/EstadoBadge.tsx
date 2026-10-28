import type { Estado } from "@/lib/types";
import { Icon } from "./Icon";

export const ESTADOS: Record<Estado, { texto: string; clase: string }> = {
  confirmado: { texto: "Confirmado", clase: "text-ok bg-ok-bg border-ok" },
  no_disponible: { texto: "No disponible", clase: "text-no bg-no-bg border-no" },
  sin_info: { texto: "Sin información", clase: "text-unk bg-unk-bg border-unk border-dashed" },
};

/** Texto + ícono + color + forma del borde: nunca solo color. */
export function EstadoBadge({ estado, className = "" }: { estado: Estado; className?: string }) {
  const e = ESTADOS[estado];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border-2 px-2.5 py-0.5 text-sm font-bold ${e.clase} ${className}`}
    >
      <Icon name={estado} size={1.15} />
      {e.texto}
    </span>
  );
}
