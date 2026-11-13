"use client";

import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";

/** Campo con etiqueta visible, ayuda y error en texto asociado (aria-describedby). */
export function Campo({
  id, etiqueta, error, ayuda, children,
}: { id: string; etiqueta: string; error?: string; ayuda?: string; children: (props: { id: string; "aria-invalid": boolean; "aria-describedby"?: string }) => ReactNode }) {
  const desc = [ayuda ? `${id}-ayuda` : "", error ? `${id}-err` : ""].filter(Boolean).join(" ") || undefined;
  return (
    <div>
      <label htmlFor={id} className="mb-1 block font-bold">{etiqueta}</label>
      {children({ id, "aria-invalid": !!error, "aria-describedby": desc })}
      {ayuda && <p id={`${id}-ayuda`} className="mt-1 text-sm text-muted">{ayuda}</p>}
      {error && <p id={`${id}-err`} className="mt-1 flex items-start gap-1.5 font-bold text-no"><Icon name="no_disponible" size={1.2} />{error}</p>}
    </div>
  );
}

export function Aviso({ tipo, children }: { tipo: "ok" | "error" | "info"; children: ReactNode }) {
  const clase = tipo === "error" ? "border-no bg-no-bg text-no" : tipo === "ok" ? "border-ok bg-ok-bg text-ok" : "border-line bg-surface-2";
  return (
    <p role={tipo === "error" ? "alert" : "status"} className={`flex items-start gap-2 rounded-2xl border-2 p-4 font-bold ${clase}`}>
      <Icon name={tipo === "error" ? "no_disponible" : tipo === "ok" ? "confirmado" : "alerta"} size={1.3} />
      <span>{children}</span>
    </p>
  );
}
