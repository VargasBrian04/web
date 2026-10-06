import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";

/** GET /api/courses — público (solo activos). */
export async function GET() {
  try {
    const data = await prisma.course.findMany({
      where: { active: true },
      include: { academic: { select: { code: true, shortName: true, name: true } } },
      orderBy: [{ nivel: "asc" }, { curso: "asc" }, { seccion: "asc" }],
    });
    return NextResponse.json({ data });
  } catch (e) {
    console.error("GET /api/courses", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

/** POST /api/courses — solo ADMIN { nombre, nivel, curso, seccion?, turno, academicId? }. */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Solo Dirección" }, { status: 403 });
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const nombre = String(body?.nombre ?? "").trim();
  const nivel = String(body?.nivel ?? "").trim();
  const curso = String(body?.curso ?? "").trim();
  const turno = String(body?.turno ?? "").trim();
  const seccion = String(body?.seccion ?? "").trim() || null;
  const academicId = String(body?.academicId ?? "").trim() || null;
  if (!nombre || (nivel !== "EEB" && nivel !== "MEDIA") || !curso || (turno !== "MAÑANA" && turno !== "TARDE"))
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  const created = await prisma.course.create({
    data: { nombre: nombre.slice(0, 120), nivel, curso, seccion, turno, academicId },
  });
  await audit(session.user, "CURSO_CREADO", nombre);
  return NextResponse.json({ data: created }, { status: 201 });
}

/** PATCH /api/courses — solo ADMIN { id, ...campos, active? }. DELETE ?id= — solo ADMIN. */
export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Solo Dirección" }, { status: 403 });
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const id = String(body?.id ?? "");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });
  const data: Record<string, unknown> = {};
  for (const k of ["nombre", "nivel", "curso", "seccion", "turno", "academicId"]) {
    if (typeof body?.[k] === "string") data[k] = (body[k] as string).trim() || null;
  }
  if (typeof body?.active === "boolean") data.active = body.active;
  const updated = await prisma.course.update({ where: { id }, data });
  await audit(session.user, "CURSO_EDITADO", id);
  return NextResponse.json({ data: updated });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Solo Dirección" }, { status: 403 });
  const id = new URL(request.url).searchParams.get("id") || "";
  await prisma.course.delete({ where: { id } });
  await audit(session.user, "CURSO_ELIMINADO", id);
  return NextResponse.json({ data: { id } });
}
