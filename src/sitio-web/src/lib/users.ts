/**
 * Identidad de usuario: se ingresa con correo O nombre de usuario.
 * El correo y el teléfono son vinculables después (estilo perfil de Facebook).
 */

export const USERNAME_RE = /^[a-z0-9._-]{3,30}$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const CI_RE = /^\d{6,10}$/;

/** Normaliza un nombre de usuario (minúsculas, sin espacios). */
export function normalizeUsername(v: unknown): string {
  return String(v ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita tildes
    .replace(/\s+/g, ".");
}

export function isValidUsername(v: unknown): boolean {
  return USERNAME_RE.test(normalizeUsername(v));
}

export function isValidEmail(v: unknown): boolean {
  return typeof v === "string" && EMAIL_RE.test(v.trim().toLowerCase());
}

/** Usuario sugerido a partir del correo (parte local normalizada). */
export function usernameFromEmail(email: string): string {
  const base =
    normalizeUsername(email.split("@")[0]).replace(/[^a-z0-9._-]/g, "") ||
    "usuario";
  return base.slice(0, 24);
}
