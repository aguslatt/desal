"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";

/** Registra (de forma anónima) que se vio una ficha. No renderiza nada. */
export function FichaVista({ lugarId }: { lugarId: string }) {
  useEffect(() => { track("ficha_vista", { lugar: lugarId }); }, [lugarId]);
  return null;
}
