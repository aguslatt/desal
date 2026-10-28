/** Contraseña básica (HTTP Basic). El usuario puede ser cualquiera; vale solo la contraseña. */
export function autorizado(authorization: string | null, password: string | undefined): boolean {
  if (!password || !authorization?.startsWith("Basic ")) return false;
  let dado = "";
  try {
    const raw = atob(authorization.slice(6));
    dado = raw.slice(raw.indexOf(":") + 1);
  } catch {
    return false;
  }
  // Comparación en tiempo constante (no corta en la primera diferencia).
  const a = new TextEncoder().encode(dado);
  const b = new TextEncoder().encode(password);
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return diff === 0;
}
