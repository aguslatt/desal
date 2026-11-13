"use client";

import { useActionState } from "react";
import { ingresarAccion, type Estado } from "@/app/panel/acciones";
import { Aviso, Campo } from "./Campos";

export function FormIngreso({ motivo }: { motivo?: string }) {
  const [estado, accion, pendiente] = useActionState<Estado, FormData>(ingresarAccion, {});
  return (
    <form action={accion} className="card flex flex-col gap-5 p-6 sm:p-8" noValidate>
      {motivo === "acceso" && <Aviso tipo="info">Tu acceso cambió o se suspendió. Volvé a ingresar.</Aviso>}
      {estado.mensaje && <Aviso tipo="error">{estado.mensaje}</Aviso>}
      <Campo id="i-email" etiqueta="Correo">
        {(p) => <input {...p} name="email" type="email" autoComplete="username" required className="field" defaultValue={estado.valores?.email} />}
      </Campo>
      <Campo id="i-clave" etiqueta="Clave">
        {(p) => <input {...p} name="clave" type="password" autoComplete="current-password" required className="field" />}
      </Campo>
      <button type="submit" className="btn self-start" disabled={pendiente}>{pendiente ? "Ingresando…" : "Ingresar"}</button>
    </form>
  );
}
