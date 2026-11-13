"use client";

import { Dialog } from "radix-ui";
import type { ReactNode } from "react";

/** Confirmación antes de una acción que no se puede deshacer. Escape cancela y devuelve el foco al botón. */
export function ConfirmarAccion({
  boton, titulo, descripcion, confirmar, action, campos, peligro = true,
}: { boton: ReactNode; titulo: string; descripcion: string; confirmar: string; action: (fd: FormData) => void | Promise<void>; campos: Record<string, string>; peligro?: boolean }) {
  return (
    <Dialog.Root>
      <Dialog.Trigger className="btn btn-ghost !min-h-11 !px-4 !py-1.5 text-sm">{boton}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <Dialog.Content className="card fixed top-1/2 left-1/2 z-50 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 -translate-y-1/2 p-6">
          <Dialog.Title className="text-2xl font-bold">{titulo}</Dialog.Title>
          <Dialog.Description className="mt-2 text-muted">{descripcion}</Dialog.Description>
          <form action={action} className="mt-6 flex flex-wrap gap-3">
            {Object.entries(campos).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
            <button type="submit" className={`btn ${peligro ? "!bg-no !border-no" : ""}`}>{confirmar}</button>
            <Dialog.Close className="btn btn-ghost">Cancelar</Dialog.Close>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
