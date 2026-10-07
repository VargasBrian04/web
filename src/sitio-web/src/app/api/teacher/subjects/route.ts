import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const subjectSelect = {
  id: true,
  code: true,
  name: true,
  gradeYear: true,
  academic: { select: { shortName: true, name: true } },
};

/**
 * Mis vínculos docente ↔ materia (self-service del docente).
 * GET — { links, catalog, periods }. ADMIN ve todo como vínculos.
 * POST { subjectCode } — vincularme (crea mi ficha si falta).
 * DELETE ?subjectCode= — desvincularme.
 * Solo TEACHER (Dirección usa /api/admin/assign).
 */
export async function GET() {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const [catalog, periods] = await Promise.all([
    prisma.subject.findMany({ select: subjectSelect, orderBy: { name: "asc" }, take: 200 }),
    prisma.period.findMany({ select: { id: true, label: true, name: true }, orderBy: { label: "desc" } }),
  ]);
  if (session.user.role === "ADMIN")
    return NextResponse.json({ data: { links: catalog, catalog, periods } });

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
    select: { subjects: { select: { subject: { select: subjectSelect } } } },
  });
  const links = (teacher?.subjects ?? []).map((s: { subject: unknown }) => s.subject);
  return NextResponse.json({ data: { links, catalog, periods } });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.user.role !== "TEACHER")
    return NextResponse.json({ error: "Solo docentes (Dirección usa Asignar)" }, { status: 403 });

  const body = (await request.json().catch(() => null)) as { subjectCode?: string } | null;
  const code = (body?.subjectCode || "").trim();
  if (!code) return NextResponse.json({ error: "Falta la materia" }, { status: 400 });
  const subject = await prisma.subject.findFirst({ where: { code }, select: { id: true, code: true, name: true } });
  if (!subject) return NextResponse.json({ error: "Materia inexistente" }, { status: 404 });

  const teacher =
    (await prisma.teacher.findUnique({ where: { userId: session.user.id }, select: { id: true } })) ??
    (await prisma.teacher.create({ data: { userId: session.user.id } }));
  await prisma.teacherSubject.upsert({
    where: { teacherId_subjectId: { teacherId: teacher.id, subjectId: subject.id } },
    update: {},
    create: { teacherId: teacher.id, subjectId: subject.id },
  });
  return NextResponse.json({ data: { code: subject.code, name: subject.name } }, { status: 201 });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.user.role !== "TEACHER")
    return NextResponse.json({ error: "Solo docentes" }, { status: 403 });

  const code = (new URL(request.url).searchParams.get("subjectCode") || "").trim();
  if (!code) return NextResponse.json({ error: "Falta la materia" }, { status: 400 });
  const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!teacher) return NextResponse.json({ data: { ok: true } });
  const subject = await prisma.subject.findFirst({ where: { code }, select: { id: true } });
  if (subject) {
    await prisma.teacherSubject.deleteMany({
      where: { teacherId: teacher.id, subjectId: subject.id },
    });
  }
  return NextResponse.json({ data: { ok: true } });
}
