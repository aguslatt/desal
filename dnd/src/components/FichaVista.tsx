"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";
import { necesidadesActuales } from "@/lib/prefs";

/**
 * Registra (de forma anónima) que se vio una ficha. Si la persona marcó condiciones, se suman al evento
 * solo para que cada café vea, agregado, qué buscan quienes llegan a su ficha: nunca se guardan por persona.
 */
export function FichaVista({ lugarId }: { lugarId: string }) {
  useEffect(() => {
    const nec = necesidadesActuales();
    track("ficha_vista", { lugar: lugarId, ...(nec.length ? { valor: nec.join(",") } : {}) });
  }, [lugarId]);
  return null;
}
