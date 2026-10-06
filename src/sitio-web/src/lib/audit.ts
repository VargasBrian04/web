import { prisma } from "@/lib/prisma";

/** Auditoría best-effort: nunca rompe la operación principal. */
export async function audit(
  actor: { id?: string; name?: string | null } | null,
  action: string,
  detail?: string
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: actor?.id ?? null,
        actorName: actor?.name ?? null,
        action,
        detail: detail?.slice(0, 500) ?? null,
      },
    });
  } catch (e) {
    console.error("AUDIT", e);
  }
}
