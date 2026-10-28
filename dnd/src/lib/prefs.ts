"use client";

import { useSyncExternalStore } from "react";

/** Preferencias de visualización y necesidades. Viven solo en este dispositivo (localStorage). */
export interface Prefs {
  texto: "100" | "125" | "150" | "200";
  contraste: "normal" | "high";
  tema: "auto" | "light" | "dark";
  movimiento: "auto" | "reduce";
  facil: boolean;
  /** ids de condiciones que el usuario marcó en "Mis necesidades" */
  necesidades: string[];
  /** "listo" | "salteado" | null: para saber si ya pasó por el onboarding */
  onboarding: "listo" | "salteado" | null;
  ocultarNoDisponible: boolean;
}

export const PREFS_POR_DEFECTO: Prefs = {
  texto: "100",
  contraste: "normal",
  tema: "auto",
  movimiento: "auto",
  facil: false,
  necesidades: [],
  onboarding: null,
  ocultarNoDisponible: false,
};

export const CLAVE = "umbral:prefs";

type Listener = () => void;
const listeners = new Set<Listener>();
let cache: Prefs = PREFS_POR_DEFECTO;
let cacheRaw: string | null = null;

function leer(): Prefs {
  try {
    const raw = localStorage.getItem(CLAVE);
    if (raw === cacheRaw) return cache;
    cacheRaw = raw;
    cache = raw ? { ...PREFS_POR_DEFECTO, ...JSON.parse(raw) } : PREFS_POR_DEFECTO;
  } catch {
    cache = PREFS_POR_DEFECTO;
  }
  return cache;
}

/** Aplica las preferencias de visualización al <html>. */
export function aplicar(p: Prefs, root: HTMLElement = document.documentElement) {
  root.dataset.text = p.texto;
  if (p.contraste === "high") root.dataset.contrast = "high";
  else delete root.dataset.contrast;
  const oscuro = p.tema === "dark" || (p.tema === "auto" && matchMedia("(prefers-color-scheme: dark)").matches);
  root.dataset.theme = oscuro ? "dark" : "light";
  if (p.movimiento === "reduce") root.dataset.motion = "reduce";
  else delete root.dataset.motion;
  root.dataset.easy = p.facil ? "on" : "off";
}

export function guardar(cambios: Partial<Prefs>) {
  const next = { ...leer(), ...cambios };
  try {
    localStorage.setItem(CLAVE, JSON.stringify(next));
  } catch {
    cache = next; // sin almacenamiento: funciona durante la sesión
  }
  cacheRaw = null;
  aplicar(leer());
  listeners.forEach((l) => l());
}

function suscribir(l: Listener) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => e.key === CLAVE && l();
  addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    removeEventListener("storage", onStorage);
  };
}

export function usePrefs(): Prefs {
  return useSyncExternalStore(suscribir, leer, () => PREFS_POR_DEFECTO);
}

/**
 * Script que corre antes del primer pintado para evitar el "flash" de tema/tamaño.
 * Mantener en sincronía con aplicar().
 */
export const SCRIPT_INICIAL = `(function(){try{var r=document.documentElement,p=JSON.parse(localStorage.getItem('${CLAVE}')||'{}');
r.dataset.text=p.texto||'100';if(p.contraste==='high')r.dataset.contrast='high';
var d=p.tema==='dark'||((!p.tema||p.tema==='auto')&&matchMedia('(prefers-color-scheme: dark)').matches);r.dataset.theme=d?'dark':'light';
if(p.movimiento==='reduce')r.dataset.motion='reduce';r.dataset.easy=p.facil?'on':'off';}catch(e){}})();`;
