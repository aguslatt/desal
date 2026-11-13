"use client";

import { useActionState } from "react";
import { accionCuenta, cambiarClaveAccion, crearCuentaAccion, type Estado } from "@/app/panel/acciones";
import { Aviso, Campo } from "./Campos";
import { ConfirmarAccion } from "./ConfirmarAccion";

/** La clave provisoria se muestra una sola vez: se copia y se la pasás al café. */
function ClaveUnica({ clave }: { clave: string }) {
  return (
    <div className="rounded-2xl border-2 border-accent bg-surface-2 p-4">
      <p className="font-bold">Clave provisoria (se muestra una sola vez)</p>
      <p className="mt-2 select-all rounded-xl bg-surface p-3 font-mono text-2xl font-bold tracking-wider" data-testid="clave-provisoria">{clave}</p>
      <p className="mt-2 text-sm text-muted">El café va a tener que elegir una clave propia en su primer ingreso.</p>
    </div>
  );
}

export function FormCuenta({ cafes }: { cafes: { id: string; nombre: string }[] }) {
  const [estado, accion, pendiente] = useActionState<Estado, FormData>(crearCuentaAccion, {});
  const e = estado.errores ?? {};
  return (
    <form action={accion} noValidate className="card flex flex-col gap-5 p-6">
      <h2 className="display text-2xl font-bold">Crear la cuenta de un café Pro</h2>
      {estado.mensaje && <Aviso tipo="ok">{estado.mensaje}</Aviso>}
      {estado.clave && <ClaveUnica clave={estado.clave} />}
      <div className="grid gap-5 sm:grid-cols-2">
        <Campo id="c-cafe" etiqueta="Café" error={e.cafeId}>
          {(p) => (
            <select {...p} name="cafeId" className="field" defaultValue={estado.valores?.cafeId ?? ""}>
              <option value="">Elegí el café</option>
              {cafes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          )}
        </Campo>
        <Campo id="c-email" etiqueta="Correo de quien administra el café" error={e.email}>
          {(p) => <input {...p} name="email" type="email" autoComplete="off" className="field" defaultValue={estado.valores?.email} />}
        </Campo>
      </div>
      <button type="submit" className="btn self-start" disabled={pendiente}>{pendiente ? "Creando…" : "Crear cuenta"}</button>
    </form>
  );
}

export function AccionesCuenta({ email, estado: est }: { email: string; estado: "activa" | "suspendida" }) {
  const [estado, accion] = useActionState<Estado, FormData>(accionCuenta, {});
  const alternar = est === "activa" ? "suspender" : "reactivar";
  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex flex-wrap gap-2">
        <form action={accion}>
          <input type="hidden" name="email" value={email} />
          <input type="hidden" name="op" value={alternar} />
          <button type="submit" className="btn btn-ghost !min-h-11 !px-4 !py-1.5 text-sm">{est === "activa" ? "Suspender" : "Reactivar"}<span className="sr-only"> la cuenta de {email}</span></button>
        </form>
        <form action={accion}>
          <input type="hidden" name="email" value={email} />
          <input type="hidden" name="op" value="reiniciar" />
          <button type="submit" className="btn btn-ghost !min-h-11 !px-4 !py-1.5 text-sm">Nueva clave<span className="sr-only"> para {email}</span></button>
        </form>
        <ConfirmarAccion
          boton={<>Eliminar<span className="sr-only"> la cuenta de {email}</span></>}
          titulo="¿Eliminar esta cuenta?"
          descripcion={`${email} va a perder el acceso a su panel. El café sigue en la app.`}
          confirmar="Sí, eliminar la cuenta"
          action={(fd) => accion(fd)}
          campos={{ email, op: "eliminar" }}
        />
      </div>
      {estado.mensaje && <Aviso tipo="ok">{estado.mensaje}</Aviso>}
      {estado.clave && <ClaveUnica clave={estado.clave} />}
    </div>
  );
}

export function FormClave({ obligatorio }: { obligatorio: boolean }) {
  const [estado, accion, pendiente] = useActionState<Estado, FormData>(cambiarClaveAccion, {});
  const e = estado.errores ?? {};
  return (
    <form action={accion} noValidate className="card flex max-w-xl flex-col gap-5 p-6 sm:p-8">
      {obligatorio && <Aviso tipo="info">Entraste con una clave provisoria. Elegí una propia para seguir.</Aviso>}
      <Campo id="k-actual" etiqueta="Clave actual" error={e.actual}>
        {(p) => <input {...p} name="actual" type="password" autoComplete="current-password" className="field" />}
      </Campo>
      <Campo id="k-nueva" etiqueta="Clave nueva" error={e.nueva} ayuda="Al menos 10 caracteres, con letras y números.">
        {(p) => <input {...p} name="nueva" type="password" autoComplete="new-password" className="field" />}
      </Campo>
      <Campo id="k-repetir" etiqueta="Repetí la clave nueva" error={e.repetir}>
        {(p) => <input {...p} name="repetir" type="password" autoComplete="new-password" className="field" />}
      </Campo>
      <button type="submit" className="btn self-start" disabled={pendiente}>{pendiente ? "Guardando…" : "Cambiar clave"}</button>
    </form>
  );
}
