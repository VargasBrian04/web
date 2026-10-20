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
 * Mis vínculos docente ↔ materia (solo lectura).
 * GET — { links, catalog, periods }. ADMIN ve todo como vínculos.
 * La asignación la hace Dirección/Secretaría en /api/admin/assign.
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

export async function POST() {
  return NextResponse.json(
    { error: "La asignación de materias la realiza Dirección/Secretaría." },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: "La asignación de materias la realiza Dirección/Secretaría." },
    { status: 405 }
  );
}
