import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";

const AUDIENCES = ["TODOS", "TEACHER", "PARENT", "STUDENT"] as const;
type Role = "ADMIN" | "TEACHER" | "PARENT" | "STUDENT" | "ASPIRANT";

/**
 * GET /api/comunicados — con sesión: activos para mi rol + si ya los leí.
 * POST — solo ADMIN { title, body, audience? }.
 * POST /api/comunicados/leer { id } — marca lectura propia.
 * PATCH — solo ADMIN { id, active }.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const role = session.user.role as Role;
  try {
    const rows = await prisma.announcement.findMany({
      where: {
        active: true,
        OR: [{ audience: "TODOS" }, { audience: role }],
      },
      select: {
        id: true, title: true, body: true, createdAt: true,
        reads: { where: { userId: session.user.id }, select: { readAt: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json({
      data: rows.map((r: { id: string; title: string; body: string; createdAt: Date; reads: { readAt: Date }[] }) => ({ ...r, leido: r.reads.length > 0, reads: undefined })),
      noLeidos: rows.filter((r: { reads: unknown[] }) => r.reads.length === 0).length,
    });
  } catch (e) {
    console.error("GET /api/comunicados", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  // Marcar lectura propia
  if (new URL(request.url).pathname.endsWith("/leer")) {
    return NextResponse.json({ error: "Usá /api/comunicados/leer" }, { status: 404 });
  }
  if (session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Solo Dirección" }, { status: 403 });
  const body = ((await request.json().catch(() => null)) ?? {}) as Record<string, unknown>;
  const title = String(body.title ?? "").trim();
  const content = String(body.body ?? "").trim();
  const audience = String(body.audience ?? "TODOS");
  if (!title || !content) return NextResponse.json({ error: "Título y texto obligatorios" }, { status: 400 });
  if (!(AUDIENCES as readonly string[]).includes(audience))
    return NextResponse.json({ error: "Destinatario inválido" }, { status: 400 });
  const created = await prisma.announcement.create({
    data: { title: title.slice(0, 160), body: content.slice(0, 5000), audience, createdBy: session.user.id },
  });
  await audit(session.user, "COMUNICADO", title);
  return NextResponse.json({ data: created }, { status: 201 });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Solo Dirección" }, { status: 403 });
  const { id, active } = ((await request.json().catch(() => null)) ?? {}) as {
    id?: string; active?: boolean;
  };
  if (!id || typeof active !== "boolean")
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  const updated = await prisma.announcement.update({ where: { id }, data: { active } });
  await audit(session.user, active ? "COMUNICADO_ACTIVADO" : "COMUNICADO_ARCHIVADO", id);
  return NextResponse.json({ data: updated });
}
