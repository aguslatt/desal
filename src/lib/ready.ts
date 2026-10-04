// Señal global: el loader terminó y la página puede hacer su entrada.
let isReady = false;
const subs = new Set<() => void>();
export const markReady = () => { isReady = true; subs.forEach((f) => f()); subs.clear(); };
export const whenReady = (cb: () => void) => { if (isReady) cb(); else subs.add(cb); return () => subs.delete(cb); };
export const resetReady = () => { /* la señal se mantiene durante toda la sesión de página */ };
