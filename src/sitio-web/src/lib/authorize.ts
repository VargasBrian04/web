import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import type { UserRole } from "@prisma/client";

export type SessionUser = {
  id: string;
  role: UserRole;
  name: string;
  email: string;
};

/** Sesión exigida. Retorna { session } o { response } con 401. */
export async function requireSession() {
  const session = await auth();
  if (!session?.user) {
    return {
      response: NextResponse.json({ error: "No autenticado" }, { status: 401 }),
    } as const;
  }
  return { session } as const;
}

/** Sesión + rol permitido. Retorna { session } o { response } con 401/403. */
export async function requireRole(allowed: UserRole[]) {
  const session = await auth();
  if (!session?.user) {
    return {
      response: NextResponse.json({ error: "No autenticado" }, { status: 401 }),
    } as const;
  }
  if (!allowed.includes(session.user.role as UserRole)) {
    return {
      response: NextResponse.json({ error: "Sin permiso" }, { status: 403 }),
    } as const;
  }
  return { session } as const;
}

/** Nota paraguaya válida: número finito entre 1 y 5. */
export function isValidScore(score: unknown): score is number {
  return (
    typeof score === "number" &&
    Number.isFinite(score) &&
    score >= 1 &&
    score <= 5
  );
}
