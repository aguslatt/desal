"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Icon } from "@/components/ui/Icon";
import { track } from "@/lib/analytics";
import { alternarGuardado, useGuardados } from "@/lib/guardados";

export function AccionesPlan({ planId, titulo, lugarId, lugarNombre }: { planId: string; titulo: string; lugarId: string; lugarNombre: string }) {
  const guardados = useGuardados();
  const guardado = guardados.includes(planId);
  useEffect(() => { track("plan_visto", { plan: planId }); }, [planId]);
  return (
    <div className="flex flex-wrap gap-3">
      <button type="button" className={`btn ${guardado ? "" : "btn-ghost"}`} aria-pressed={guardado} onClick={() => alternarGuardado(planId)}>
        <Icon name="guardar" />
        {guardado ? "Guardado" : "Guardar"}
        <span className="sr-only"> {titulo}</span>
      </button>
      <Link href={`/lugares/${lugarId}`} className="btn"><Icon name="casa" /> Ver el café<span className="sr-only">: {lugarNombre}</span></Link>
      <Link href={`/lugares/${lugarId}/reporte?tipo=dato`} className="btn btn-ghost"><Icon name="bandera" /> Reportar un dato incorrecto</Link>
    </div>
  );
}
