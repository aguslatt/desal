"use client";

import { useSyncExternalStore } from "react";

const CLAVE = "umbral:guardados";
const listeners = new Set<() => void>();
let raw: string | null = null;
let cache: string[] = [];
const VACIO: string[] = [];

function leer(): string[] {
  try {
    const r = localStorage.getItem(CLAVE);
    if (r !== raw) {
      raw = r;
      cache = r ? (JSON.parse(r) as string[]) : VACIO;
    }
  } catch {
    /* sin almacenamiento */
  }
  return cache;
}

export function alternarGuardado(id: string) {
  const act = leer();
  const next = act.includes(id) ? act.filter((x) => x !== id) : [...act, id];
  cache = next;
  try {
    localStorage.setItem(CLAVE, JSON.stringify(next));
    raw = localStorage.getItem(CLAVE);
  } catch {
    /* solo en esta sesión */
  }
  listeners.forEach((l) => l());
}

export function useGuardados(): string[] {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    leer,
    () => VACIO,
  );
}
