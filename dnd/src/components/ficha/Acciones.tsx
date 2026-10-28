"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { alternarGuardado, useGuardados } from "@/lib/guardados";

export function Acciones({ id, nombre, tieneRecorrido }: { id: string; nombre: string; tieneRecorrido: boolean }) {
  const guardados = useGuardados();
  const guardado = guardados.includes(id);
  return (
    <div className="flex flex-wrap gap-3">
      <button type="button" className={`btn ${guardado ? "" : "btn-ghost"}`} aria-pressed={guardado} onClick={() => alternarGuardado(id)}>
        <Icon name="guardar" />
        {guardado ? "Guardado" : "Guardar"}
        <span className="sr-only"> {nombre}</span>
      </button>
      <Link href={`/lugares/${id}/reporte`} className="btn">
        <Icon name="comentario" /> Contar cómo te fue
      </Link>
      <Link href={`/lugares/${id}/reporte?tipo=dato`} className="btn btn-ghost">
        <Icon name="bandera" /> Reportar un dato incorrecto
      </Link>
      {tieneRecorrido && (
        <Link href={`/lugares/${id}/recorrido`} className="btn btn-ghost">
          <Icon name="ojo" /> Ver el recorrido
        </Link>
      )}
    </div>
  );
}
