"use client";

import { track } from "@/lib/analytics";

/** Teléfono y correo como enlaces: llamar o escribir. Cada clic se cuenta (sin datos de la persona). */
export function Contacto({ lugarId, telefono, email }: { lugarId: string; telefono?: string; email?: string }) {
  return (
    <>
      {telefono && (
        <div>
          <dt className="font-bold">Teléfono</dt>
          <dd><a href={`tel:${telefono.replace(/[^\d+]/g, "")}`} className="tap inline-flex items-center" onClick={() => track("contacto_clic", { lugar: lugarId, tipo: "telefono" })}>{telefono}</a></dd>
        </div>
      )}
      {email && (
        <div>
          <dt className="font-bold">Correo</dt>
          <dd><a href={`mailto:${email}`} className="tap inline-flex items-center" onClick={() => track("contacto_clic", { lugar: lugarId, tipo: "correo" })}>{email}</a></dd>
        </div>
      )}
    </>
  );
}
