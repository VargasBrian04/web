import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/attendance — Asistencia según rol:
 *  STUDENT: propia · PARENT: hijos · TEACHER: materias propias · ADMIN: todo (filtros ?studentId=&subject=&from=&to=)
 * POST /api/attendance — TEACHER/ADMIN pasa lista.
 * Body: { studentId, subjectCode?, classDate (ISO), status: PRESENTE|TARDE|AUSENTE|JUSTIFICADO, note? }
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId") || undefined;
  const subjectCode = searchParams.get("subject") || undefined;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const dateFilter =
    from || to
      ? { gte: from ? new Date(from) : undefined, lte: to ? new Date(to) : undefined }
      : undefined;

  const baseWhere = {
    ...(studentId ? { studentId } : {}),
    ...(subjectCode ? { subject: { code: subjectCode } } : {}),
    ...(dateFilter ? { classDate: dateFilter } : {}),
  };

  const select = {
    id: true,
    classDate: true,
    status: true,
    note: true,
    student: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
    subject: { select: { code: true, name: true } },
  };

  try {
    const role = session.user.role;
    if (role === "STUDENT") {
      const student = await prisma.student.findUnique({ where: { userId: session.user.id } });
      if (!student) return NextResponse.json({ data: [] });
      const data = await prisma.attendance.findMany({
        where: { ...baseWhere, studentId: student.id },
        select,
        orderBy: { classDate: "desc" },
        take: 200,
      });
      return NextResponse.json({ data });
    }
    if (role === "PARENT") {
      const links = await prisma.studentGuardian.findMany({
        where: { guardian: { userId: session.user.id } },
        select: { studentId: true },
      });
      const ids = links.map((l: any) => l.studentId).filter((id: any) => !studentId || id === studentId);
      const data = await prisma.attendance.findMany({
        where: { ...baseWhere, studentId: { in: ids } },
        select,
        orderBy: { classDate: "desc" },
        take: 200,
      });
      return NextResponse.json({ data });
    }
    if (role === "TEACHER") {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: session.user.id },
        include: { subjects: true },
      });
      const subjectIds = teacher?.subjects.map((s: any) => s.subjectId) ?? [];
      const subjects = subjectIds.length
        ? await prisma.subject.findMany({ where: { id: { in: subjectIds } }, select: { code: true } })
        : [];
      const codes = subjects.map((s: any) => s.code);
      // Si pide una materia concreta, debe ser una de las suyas.
      if (subjectCode && !codes.includes(subjectCode)) {
        return NextResponse.json({ error: "No tenés asignada esta materia" }, { status: 403 });
      }
      const data = await prisma.attendance.findMany({
        where: {
          ...baseWhere,
          ...(codes.length && !subjectCode ? { subject: { code: { in: codes } } } : {}),
        },
        select,
        orderBy: { classDate: "desc" },
        take: 200,
      });
      return NextResponse.json({ data });
    }
    if (role === "ADMIN") {
      const data = await prisma.attendance.findMany({
        where: baseWhere,
        select,
        orderBy: { classDate: "desc" },
        take: 200,
      });
      return NextResponse.json({ data });
    }
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  } catch (e) {
    console.error("GET /api/attendance", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const { studentId, subjectCode, classDate, status, note } = (await request.json()) as {
    studentId?: string;
    subjectCode?: string;
    classDate?: string;
    status?: string;
    note?: string;
  };
  const valid = ["PRESENTE", "TARDE", "AUSENTE", "JUSTIFICADO"];
  if (!studentId || !classDate || !status || !valid.includes(status))
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  let subjectId: string | null = null;
  if (subjectCode) {
    const subject = await prisma.subject.findFirst({ where: { code: subjectCode } });
    if (!subject) return NextResponse.json({ error: "Materia inválida" }, { status: 400 });
    subjectId = subject.id;
    // El docente solo registra asistencia de sus materias asignadas.
    if (session.user.role === "TEACHER") {
      const teacherCheck = await prisma.teacher.findUnique({ where: { userId: session.user.id } });
      if (!teacherCheck) return NextResponse.json({ error: "Sin perfil docente" }, { status: 403 });
      const link = await prisma.teacherSubject.findUnique({
        where: { teacherId_subjectId: { teacherId: teacherCheck.id, subjectId: subject.id } }
      });
      if (!link) return NextResponse.json({ error: "No tenés asignada esta materia" }, { status: 403 });
    }
  }

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) return NextResponse.json({ error: "Alumno inválido" }, { status: 400 });

  const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } });
  const date = new Date(classDate);
  if (Number.isNaN(date.getTime())) return NextResponse.json({ error: "Fecha inválida" }, { status: 400 });

  // Con materia: upsert por unique(student, subject, fecha). Sin materia: crear directo
  // (el unique no cubre subjectId null y el parche "" generaba colisiones).
  if (subjectId) {
    const row = await prisma.attendance.upsert({
      where: {
        studentId_subjectId_classDate: {
          studentId,
          subjectId,
          classDate: date,
        },
      },
      update: { status: status as "PRESENTE", note: note ?? null, teacherId: teacher?.id ?? null },
      create: {
        studentId,
        subjectId,
        classDate: date,
        status: status as "PRESENTE",
        note: note ?? null,
        teacherId: teacher?.id ?? null,
      },
    });
    return NextResponse.json({ data: row }, { status: 201 });
  }
  const row = await prisma.attendance.create({
    data: {
      studentId,
      subjectId: null,
      classDate: date,
      status: status as "PRESENTE",
      note: note ?? null,
      teacherId: teacher?.id ?? null,
    },
  });
  return NextResponse.json({ data: row }, { status: 201 });
}
