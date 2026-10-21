import type { UserRole } from "@prisma/client";

/**
 * Zonas de ingreso del portal.
 *
 * El login es la primera barrera: si una cuenta existe y la contraseña es
 * correcta pero su rol no corresponde a la zona elegida, no se crea sesión y
 * se muestra "Zona de Ingreso Incorrecta". El middleware sigue siendo la
 * barrera definitiva para navegar entre zonas.
 */
export type PortalZone = "docente" | "padre" | "alumno" | "admin";

/**
 * Roles que pueden ingresar desde cada tarjeta del selector de perfil.
 * - Docente incluye a Dirección/Secretaría (ADMIN), como indica /acceso.
 * - Padre/Tutor queda reservado a PARENT: una cuenta docente o administrativa
 *   no debe iniciar sesión desde esa tarjeta.
 */
export const LOGIN_ZONE_ROLES: Record<PortalZone, readonly UserRole[]> = {
  docente: ["TEACHER", "ADMIN"],
  padre: ["PARENT"],
  alumno: ["STUDENT"],
  admin: ["ADMIN"],
};

export const PORTAL_ZONE_LABEL: Record<PortalZone, string> = {
  docente: "la zona Docente",
  padre: "la zona Padre / Tutor",
  alumno: "la zona Alumno",
  admin: "la zona Administración",
};

const ZONE_PREFIXES: ReadonlyArray<{ zone: PortalZone; prefix: string }> = [
  { zone: "admin", prefix: "/portal/admin" },
  { zone: "docente", prefix: "/portal/profesor" },
  { zone: "alumno", prefix: "/portal/alumno" },
  { zone: "padre", prefix: "/portal/padre" },
];

/** Normaliza el valor que envía el formulario; ignora valores desconocidos. */
export function parsePortalZone(value: unknown): PortalZone | null {
  return value === "docente" || value === "padre" || value === "alumno" || value === "admin"
    ? value
    : null;
}

/** Deriva la zona desde el parámetro `next` de /login. */
export function portalZoneFromPath(path: string | null | undefined): PortalZone | null {
  if (!path) return null;

  let pathname = path;
  try {
    pathname = new URL(path, "http://portal.local").pathname;
  } catch {
    /* Si no es una URL válida, se compara el texto original. */
  }

  return (
    ZONE_PREFIXES.find(
      ({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    )?.zone ?? null
  );
}

export function canRoleAccessZone(
  role: string | null | undefined,
  zone: PortalZone | null
): boolean {
  if (!zone) return true;
  if (!role) return false;
  return (LOGIN_ZONE_ROLES[zone] as readonly string[]).includes(role);
}

export function wrongZoneMessage(zone: PortalZone): string {
  return `Zona de Ingreso Incorrecta. Tu usuario está registrado, pero no corresponde a ${PORTAL_ZONE_LABEL[zone]}. Elegí el perfil correcto para continuar.`;
}
