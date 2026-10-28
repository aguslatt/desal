"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Asistente } from "./Asistente";

export function PaginaReporte({ lugarId, nombre }: { lugarId: string; nombre: string }) {
  // Se lee al montar: la página se genera en el servidor con el formulario de visita ya dibujado.
  const [tipo, setTipo] = useState<"visita" | "dato">("visita");
  useEffect(() => {
    if (new URLSearchParams(location.search).get("tipo") === "dato") setTipo("dato");
  }, []);
  return (
    <div className="mx-auto max-w-2xl">
      <Link href={`/lugares/${lugarId}`} className="tap inline-flex items-center gap-1 font-bold">
        <span className="rotate-180"><Icon name="flecha" /></span> Volver a {nombre}
      </Link>
      <h1 className="mt-4 text-4xl leading-tight font-bold">
        {tipo === "dato" ? "Reportar un dato incorrecto" : "Contar cómo te fue"}
        <span className="mt-1 block text-2xl text-muted">{nombre}</span>
      </h1>
      <p className="mt-3 mb-8 max-w-prose text-muted">
        Tu reporte es anónimo. No te pedimos ningún dato personal y no hay límite de tiempo.
      </p>
      <Asistente lugarId={lugarId} nombre={nombre} tipo={tipo} />
    </div>
  );
}
