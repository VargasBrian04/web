import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/observations?studentId= — STUDENT: propias · PARENT: hijos visibles
 *  TEACHER: las que escribió · ADMIN: todo.
 * POST /api/observations — TEACHER/ADMIN: { studentId, text, visibleToTutor?, periodLabel? }.
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const qStudent = searchParams.get("studentId") || undefined;
  const role = session.user.role;

  try {
    if (role === "ADMIN") {
      const data = await prisma.observation.findMany({
        where: { ...(qStudent ? { studentId: qStudent } : {}) },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
      return NextResponse.json({ data });
    }
    if (role === "TEACHER") {
      const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } });
      const data = await prisma.observation.findMany({
        where: { ...(teacher ? { teacherId: teacher.id } : {}), ...(qStudent ? { studentId: qStudent } : {}) },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
      return NextResponse.json({ data });
    }
    if (role === "STUDENT") {
      const student = await prisma.student.findUnique({ where: { userId: session.user.id } });
      if (!student) return NextResponse.json({ data: [] });
      const data = await prisma.observation.findMany({
        where: { studentId: student.id },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
      return NextResponse.json({ data });
    }
    if (role === "PARENT") {
      const links = await prisma.studentGuardian.findMany({
        where: { guardian: { userId: session.user.id } },
        select: { studentId: true },
      });
      const ids = links.map((l: { studentId: string }) => l.studentId).filter((id: string) => !qStudent || id === qStudent);
      if (!ids.length) return NextResponse.json({ data: [] });
      const data = await prisma.observation.findMany({
        where: { studentId: { in: ids }, visibleToTutor: true },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
      return NextResponse.json({ data });
    }
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  } catch (e) {
    console.error("GET /api/observations", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  const { studentId, text, visibleToTutor, periodLabel } = (await request.json()) as {
    studentId?: string; text?: string; visibleToTutor?: boolean; periodLabel?: string;
  };
  if (!studentId || !text?.trim() || text.trim().length > 1000)
    return NextResponse.json({ error: "Alumno y texto (máx 1000) obligatorios" }, { status: 400 });
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) return NextResponse.json({ error: "Alumno inválido" }, { status: 400 });
  let periodId: string | null = null;
  if (periodLabel) {
    const p = await prisma.period.findUnique({ where: { label: periodLabel } });
    if (!p) return NextResponse.json({ error: "Período inválido" }, { status: 400 });
    periodId = p.id;
  }
  const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } });
  const created = await prisma.observation.create({
    data: { studentId, teacherId: teacher?.id ?? null, periodId, text: text.trim(), visibleToTutor: visibleToTutor !== false },
  });
  return NextResponse.json({ data: created }, { status: 201 });
}
