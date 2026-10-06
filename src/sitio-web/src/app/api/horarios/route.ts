import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";

/**
 * Horarios por curso (público GET). POST/PATCH/DELETE solo ADMIN.
 * Body: { curso, turno (MAÑANA|TARDE), detalle }.
 */
export async function GET() {
  try {
    const data = await prisma.timetable.findMany({
      where: { active: true },
      orderBy: [{ curso: "asc" }],
    });
    return NextResponse.json({ data });
  } catch (e) {
    console.error("GET /api/horarios", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

function onlyAdmin(session: { user?: { role?: string } } | null) {
  return !!session?.user && session.user.role === "ADMIN";
}

export async function POST(request: Request) {
  const session = await auth();
  if (!onlyAdmin(session)) return NextResponse.json({ error: "Solo Dirección" }, { status: 403 });
  const body = ((await request.json().catch(() => null)) ?? {}) as Record<string, unknown>;
  const curso = String(body.curso ?? "").trim();
  const turno = String(body.turno ?? "").trim();
  const detalle = String(body.detalle ?? "").trim();
  if (!curso || (turno !== "MAÑANA" && turno !== "TARDE") || !detalle)
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  const created = await prisma.timetable.create({
    data: { curso: curso.slice(0, 120), turno, detalle: detalle.slice(0, 5000) },
  });
  await audit(session!.user, "HORARIO", curso);
  return NextResponse.json({ data: created }, { status: 201 });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!onlyAdmin(session)) return NextResponse.json({ error: "Solo Dirección" }, { status: 403 });
  const body = ((await request.json().catch(() => null)) ?? {}) as {
    id?: string; curso?: string; turno?: string; detalle?: string; active?: boolean;
  };
  if (!body.id) return NextResponse.json({ error: "Falta id" }, { status: 400 });
  const data: Record<string, unknown> = {};
  if (typeof body.curso === "string") data.curso = body.curso.trim().slice(0, 120);
  if (typeof body.turno === "string") data.turno = body.turno.trim();
  if (typeof body.detalle === "string") data.detalle = body.detalle.trim().slice(0, 5000);
  if (typeof body.active === "boolean") data.active = body.active;
  const updated = await prisma.timetable.update({ where: { id: body.id }, data });
  await audit(session!.user, "HORARIO_EDIT", body.id);
  return NextResponse.json({ data: updated });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!onlyAdmin(session)) return NextResponse.json({ error: "Solo Dirección" }, { status: 403 });
  const id = new URL(request.url).searchParams.get("id") || "";
  await prisma.timetable.delete({ where: { id } });
  await audit(session!.user, "HORARIO_DEL", id);
  return NextResponse.json({ data: { id } });
}
