"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { guardarCafeAccion, type Estado } from "@/app/panel/acciones";
import { condicionesDe, dimensiones, ESTILOS } from "@/lib/catalogo";
import { FRANJAS_FORM, FUENTES, type EntradaCafe } from "@/lib/cafe-form";
import type { FotoCredito } from "@/lib/fotos";
import { Aviso, Campo } from "./Campos";

const NIVELES = [{ v: "1", t: "Bajo" }, { v: "2", t: "Medio" }, { v: "3", t: "Alto" }];

function FilaCondicion({ id, etiqueta, valores, error, unidad, ejemplo, tieneValor }: { id: string; etiqueta: string; valores: EntradaCafe; error?: string; unidad?: string; ejemplo?: string; tieneValor: boolean }) {
  const [estado, setEstado] = useState(valores[`c_${id}_estado`] || "sin_info");
  const [fuente, setFuente] = useState(valores[`c_${id}_fuente`] || "");
  const activo = estado !== "sin_info";
  const k = (s: string) => `c_${id}_${s}`;
  const desc = error ? `f-c_${id}-err` : undefined;
  return (
    <>
      <tr className="border-b border-[var(--border-soft)] align-top">
        <th scope="row" className="py-2 pr-3 text-left font-normal">{etiqueta}</th>
        <td className="py-2 pr-2">
          <select aria-label={`${etiqueta}: estado`} name={k("estado")} className="field !min-h-11 min-w-36" value={estado} onChange={(e) => setEstado(e.target.value)} aria-invalid={!!error} aria-describedby={desc}>
            <option value="sin_info">Sin información</option>
            <option value="confirmado">Confirmado</option>
            <option value="no_disponible">No disponible</option>
          </select>
        </td>
        <td className="py-2 pr-2">
          {tieneValor ? (
            <input aria-label={`${etiqueta}: valor${unidad ? ` en ${unidad}` : ""}`} name={k("valor")} defaultValue={valores[k("valor")]} disabled={!activo} placeholder={ejemplo} className="field !min-h-11 w-32" />
          ) : <span className="text-muted" aria-hidden="true">—</span>}
        </td>
        <td className="py-2 pr-2">
          <select aria-label={`${etiqueta}: quién lo aportó`} name={k("fuente")} className="field !min-h-11 min-w-44" value={fuente} onChange={(e) => setFuente(e.target.value)} disabled={!activo}>
            <option value="">Elegí</option>
            {FUENTES.map((f) => <option key={f.v} value={f.v}>{f.t}</option>)}
          </select>
        </td>
        <td className="py-2 pr-2">
          <input aria-label={`${etiqueta}: fecha del dato`} type="date" name={k("fecha")} defaultValue={valores[k("fecha")]} disabled={!activo} className="field !min-h-11 w-40" />
        </td>
        <td className="py-2">
          <input aria-label={`${etiqueta}: cantidad de visitantes`} type="number" min={1} name={k("cant")} defaultValue={valores[k("cant")]} disabled={!activo || fuente !== "visitantes"} className="field !min-h-11 w-24" />
        </td>
      </tr>
      {error && (
        <tr><td colSpan={6} className="pb-2"><p id={`f-c_${id}-err`} className="font-bold text-no">{etiqueta}: {error}</p></td></tr>
      )}
    </>
  );
}

function SelectorFoto({ slot, etiqueta, fotos, valor, error }: { slot: "fachada" | "interior" | "mesa"; etiqueta: string; fotos: FotoCredito[]; valor?: string; error?: string }) {
  const [sel, setSel] = useState(valor ?? "");
  return (
    <Campo id={`f-foto_${slot}`} etiqueta={etiqueta} error={error}>
      {(p) => (
        <div className="flex flex-wrap items-start gap-4">
          <select {...p} name={`foto_${slot}`} className="field max-w-md" value={sel} onChange={(e) => setSel(e.target.value)}>
            <option value="">Elegí una foto</option>
            {fotos.filter((f) => f.slot === slot).map((f) => <option key={f.id} value={f.id}>{f.alt.length > 70 ? `${f.alt.slice(0, 68)}…` : f.alt}</option>)}
          </select>
          {sel && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/fotos/${sel}-480.webp`} alt="" width={160} height={107} className="h-24 w-36 rounded-xl border border-soft object-cover" />
          )}
        </div>
      )}
    </Campo>
  );
}

export function FormCafe({ valores, fotos, barrios, idEditado }: { valores: EntradaCafe; fotos: FotoCredito[]; barrios: string[]; idEditado?: string }) {
  const [estado, accion, pendiente] = useActionState<Estado, FormData>(guardarCafeAccion, {});
  const v = estado.valores ?? valores;
  const e = estado.errores ?? {};
  const orden = Object.keys(e);

  return (
    <form action={accion} noValidate className="flex flex-col gap-10">
      {idEditado && <input type="hidden" name="__id" value={idEditado} />}
      {orden.length > 0 && (
        <div role="alert" className="rounded-2xl border-2 border-no bg-no-bg p-4 text-no">
          <p className="font-bold">{estado.mensaje}</p>
          <ul className="mt-2 list-disc pl-6">
            {orden.slice(0, 12).map((k) => <li key={k}><a href={`#f-${k}`} className="tap inline-flex items-center font-bold">{e[k]}</a></li>)}
            {orden.length > 12 && <li>Y {orden.length - 12} más.</li>}
          </ul>
        </div>
      )}

      <fieldset className="grid min-w-0 gap-5 sm:grid-cols-2">
        <legend className="display mb-2 text-2xl font-bold">Datos del café</legend>
        <div className="sm:col-span-2">
          <Campo id="f-nombre" etiqueta="Nombre del café" error={e.nombre} ayuda={idEditado ? "El nombre se puede cambiar; la dirección web del café no cambia." : "Con este nombre se arma la dirección web del café."}>
            {(p) => <input {...p} name="nombre" className="field" defaultValue={v.nombre} maxLength={80} />}
          </Campo>
        </div>
        <Campo id="f-estilo" etiqueta="Estilo de café" error={e.estilo}>
          {(p) => (
            <select {...p} name="estilo" className="field" defaultValue={v.estilo ?? ""}>
              <option value="">Elegí un estilo</option>
              {ESTILOS.map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
          )}
        </Campo>
        <Campo id="f-barrio" etiqueta="Barrio" error={e.barrio}>
          {(p) => (
            <>
              <input {...p} name="barrio" list="barrios-lista" className="field" defaultValue={v.barrio} maxLength={40} />
              <datalist id="barrios-lista">{barrios.map((b) => <option key={b} value={b} />)}</datalist>
            </>
          )}
        </Campo>
        <div className="sm:col-span-2">
          <Campo id="f-direccion" etiqueta="Dirección o referencia" error={e.direccion} ayuda="Por ejemplo: “Zona Plaza Güemes” o la dirección completa.">
            {(p) => <input {...p} name="direccion" className="field" defaultValue={v.direccion} maxLength={120} />}
          </Campo>
        </div>
        <Campo id="f-lat" etiqueta="Latitud" error={e.lat} ayuda="Dentro de CABA, entre -34,71 y -34,52.">
          {(p) => <input {...p} name="lat" inputMode="decimal" className="field" defaultValue={v.lat} />}
        </Campo>
        <Campo id="f-lng" etiqueta="Longitud" error={e.lng} ayuda="Dentro de CABA, entre -58,54 y -58,33.">
          {(p) => <input {...p} name="lng" inputMode="decimal" className="field" defaultValue={v.lng} />}
        </Campo>
        <div className="sm:col-span-2">
          <Campo id="f-descripcion" etiqueta="Descripción" error={e.descripcion} ayuda="Entre 10 y 400 caracteres.">
            {(p) => <textarea {...p} name="descripcion" className="field min-h-28" defaultValue={v.descripcion} maxLength={400} />}
          </Campo>
        </div>
        <Campo id="f-horarios" etiqueta="Horarios" error={e.horarios}>
          {(p) => <input {...p} name="horarios" className="field" defaultValue={v.horarios} maxLength={100} />}
        </Campo>
        <Campo id="f-telefono" etiqueta="Teléfono (opcional)" error={e.telefono}>
          {(p) => <input {...p} name="telefono" type="tel" className="field" defaultValue={v.telefono} />}
        </Campo>
        <Campo id="f-email" etiqueta="Correo de contacto (opcional)" error={e.email}>
          {(p) => <input {...p} name="email" type="email" className="field" defaultValue={v.email} />}
        </Campo>
        <Campo id="f-web" etiqueta="Sitio web (opcional)" error={e.web} ayuda="Tiene que empezar con https://">
          {(p) => <input {...p} name="web" type="url" className="field" defaultValue={v.web} />}
        </Campo>
        <label className="tap flex cursor-pointer items-start gap-3 sm:col-span-2">
          <input type="checkbox" name="patrocinado" defaultChecked={v.patrocinado === "on"} className="mt-1 size-6 shrink-0 accent-[var(--accent)]" />
          <span><span className="block font-bold">Café patrocinado</span><span className="block text-sm text-muted">Lleva la etiqueta “Patrocinado” y solo aparece si cumple todas las condiciones que la persona eligió.</span></span>
        </label>
      </fieldset>

      <fieldset className="grid min-w-0 gap-5">
        <legend className="display mb-2 text-2xl font-bold">Fotos</legend>
        <p className="max-w-prose text-muted">Se eligen de la biblioteca de fotos con licencia libre. El texto alternativo sale de la foto y aclara que es ilustrativa.</p>
        <SelectorFoto slot="fachada" etiqueta="Foto de la fachada" fotos={fotos} valor={v.foto_fachada} error={e.foto_fachada} />
        <SelectorFoto slot="interior" etiqueta="Foto del interior" fotos={fotos} valor={v.foto_interior} error={e.foto_interior} />
        <SelectorFoto slot="mesa" etiqueta="Foto de la mesa" fotos={fotos} valor={v.foto_mesa} error={e.foto_mesa} />
      </fieldset>

      <fieldset className="min-w-0">
        <legend className="display mb-2 text-2xl font-bold">Momentos tranquilos</legend>
        <p className="mb-3 max-w-prose text-muted">Nivel de ruido y de gente en cada franja horaria.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {FRANJAS_FORM.map((f, i) => (
            <div key={f} className="card grid grid-cols-2 gap-3 p-4">
              <p className="col-span-2 font-bold">{f}</p>
              <Campo id={`f-mom_${i}_ruido`} etiqueta="Ruido">
                {(p) => <select {...p} name={`mom_${i}_ruido`} className="field" defaultValue={v[`mom_${i}_ruido`] ?? "2"}>{NIVELES.map((n) => <option key={n.v} value={n.v}>{n.t}</option>)}</select>}
              </Campo>
              <Campo id={`f-mom_${i}_gente`} etiqueta="Gente">
                {(p) => <select {...p} name={`mom_${i}_gente`} className="field" defaultValue={v[`mom_${i}_gente`] ?? "2"}>{NIVELES.map((n) => <option key={n.v} value={n.v}>{n.t}</option>)}</select>}
              </Campo>
            </div>
          ))}
        </div>
      </fieldset>

      <fieldset className="min-w-0">
        <legend className="display mb-2 text-2xl font-bold">Condiciones de accesibilidad</legend>
        <p className="mb-4 max-w-prose text-muted">
          Lo que no cargues queda como <strong className="text-ink">“Sin información”</strong>: nunca se muestra como “sí”. Si lo confirmás o lo marcás como no disponible, hace falta
          decir quién lo aportó y cuándo.
        </p>
        <label className="tap mb-6 flex cursor-pointer items-start gap-3">
          <input type="checkbox" name="recorrido" defaultChecked={v.recorrido === "on"} className="mt-1 size-6 shrink-0 accent-[var(--accent)]" />
          <span><span className="block font-bold">Generar el recorrido visual de cinco pasos</span><span className="block text-sm text-muted">El texto de cada paso se escribe a partir de las condiciones de abajo, para que nunca las contradiga.</span></span>
        </label>
        <div className="flex flex-col gap-8">
          {dimensiones.map((d) => (
            <div key={d.id}>
              <h2 className="display text-xl font-bold">{d.nombre}</h2>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full min-w-[56rem] border-collapse text-left">
                  <caption className="sr-only">Condiciones de {d.nombre}</caption>
                  <thead>
                    <tr className="border-b-2 border-line text-sm">
                      <th scope="col" className="py-1 pr-3">Condición</th><th scope="col" className="py-1 pr-2">Estado</th><th scope="col" className="py-1 pr-2">Valor</th>
                      <th scope="col" className="py-1 pr-2">Quién lo aportó</th><th scope="col" className="py-1 pr-2">Fecha</th><th scope="col" className="py-1">Visitantes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {condicionesDe(d.id).map((c) => (
                      <FilaCondicion key={`${c.id}-${v[`c_${c.id}_estado`] ?? ""}`} id={c.id} etiqueta={c.etiqueta} valores={v} error={e[`c_${c.id}`]} unidad={c.valor?.unidad} ejemplo={c.valor?.ejemplo} tieneValor={!!c.valor} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </fieldset>

      <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center gap-3 border-t border-soft bg-bg/95 px-4 py-4 backdrop-blur">
        <button type="submit" className="btn" disabled={pendiente}>{pendiente ? "Guardando…" : idEditado ? "Guardar cambios" : "Agregar café"}</button>
        <Link href="/panel/admin/cafes" className="btn btn-ghost">Cancelar</Link>
        {pendiente && <Aviso tipo="info">Guardando…</Aviso>}
      </div>
    </form>
  );
}
