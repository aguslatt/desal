"use client";

import { useEffect } from "react";

/** Registra el service worker (solo en producción) para que la app sea instalable. */
export function RegistrarSW() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
  }, []);
  return null;
}
