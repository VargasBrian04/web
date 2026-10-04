import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isValidScore } from "@/lib/authorize";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/grades
 * Lista de calificaciones según el rol del usuario autenticado:
 *  - STUDENT: sus propias notas.
 *  - PARENT:  notas de los alumnos a su cargo.
 *  - TEACHER: notas de las materias que imparte.
 *  - ADMIN:   todas las notas (con filtros opcionales por query).
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const periodLabel = searchParams.get("period");
  const subjectCode = searchParams.get("subject");

  const where = {
    ...(periodLabel ? { period: { label: periodLabel } } : {}),
    ...(subjectCode ? { subject: { code: subjectCode } } : {})
  };

  const selectGrade = {
    id: true,
    score: true,
    note: true,
    updatedAt: true,
    period: { select: { label: true, name: true } },
    subject: { select: { code: true, name: true, gradeYear: true } }
  };

  try {
    switch (session.user.role) {
      case "STUDENT": {
        const student = await prisma.student.findUnique({
          where: { userId: session.user.id }
        });
        if (!student) return NextResponse.json({ data: [] });

        const grades = await prisma.grade.findMany({
          where: { ...where, studentId: student.id },
          select: selectGrade,
          orderBy: { subject: { name: "asc" } }
        });
        return NextResponse.json({ data: { grades } });
      }

      case "PARENT": {
        const guardianships = await prisma.studentGuardian.findMany({
          where: { guardian: { userId: session.user.id } },
          include: { student: { include: { user: true } } }
        });

        const children = await Promise.all(
          guardianships.map(async (g) => ({
            student: `${g.student.user.firstName} ${g.student.user.lastName}`,
            grades: await prisma.grade.findMany({
              where: { ...where, studentId: g.studentId },
              select: selectGrade
            })
          }))
        );
        return NextResponse.json({ data: children });
      }

      case "TEACHER": {
        const teacher = await prisma.teacher.findUnique({
          where: { userId: session.user.id },
          include: { subjects: true }
        });
        if (!teacher) return NextResponse.json({ data: [] });

        const subjectIds = teacher.subjects.map((s) => s.subjectId);
        const grades = await prisma.grade.findMany({
          where: {
            ...where,
            subjectId: { in: subjectIds },
            teacherId: teacher.id
          },
          select: selectGrade
        });
        return NextResponse.json({ data: { grades } });
      }

      case "ADMIN": {
        const grades = await prisma.grade.findMany({
          where,
          select: { ...selectGrade },
          orderBy: { updatedAt: "desc" }
        });
        return NextResponse.json({ data: { grades } });
      }

      default:
        return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
    }
  } catch (e) {
    console.error("GET /api/grades", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

/**
 * POST /api/grades
 * Solo TEACHER o ADMIN pueden cargar/actualizar notas.
 * Body: { studentId, subjectCode, periodLabel, score, note? }
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }

  const { studentId, subjectCode, periodLabel, score, note } =
    await request.json();

  if (!studentId || !subjectCode || !periodLabel || !isValidScore(score)) {
    return NextResponse.json(
      { error: "Datos incompletos: nota válida entre 1 y 5" },
      { status: 400 }
    );
  }

  const subject = await prisma.subject.findFirst({
    where: { code: subjectCode }
  });
  const period = await prisma.period.findUnique({ where: { label: periodLabel } });
  if (!subject || !period) {
    return NextResponse.json({ error: "Materia o período inválido" }, { status: 400 });
  }

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) {
    return NextResponse.json({ error: "Alumno inválido" }, { status: 400 });
  }

  let teacherId: string | null = null;
  if (session.user.role === "TEACHER") {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id }
    });
    if (!teacher) {
      return NextResponse.json({ error: "Sin perfil docente" }, { status: 403 });
    }
    // El docente solo puede calificar materias que tiene asignadas.
    const link = await prisma.teacherSubject.findUnique({
      where: { teacherId_subjectId: { teacherId: teacher.id, subjectId: subject.id } }
    });
    if (!link) {
      return NextResponse.json({ error: "No tenés asignada esta materia" }, { status: 403 });
    }
    teacherId = teacher.id;
  } else {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id }
    });
    teacherId = teacher?.id ?? null;
  }

  const grade = await prisma.grade.upsert({
    where: {
      studentId_subjectId_periodId: {
        studentId,
        subjectId: subject.id,
        periodId: period.id
      }
    },
    update: { score, note },
    create: {
      studentId,
      subjectId: subject.id,
      periodId: period.id,
      teacherId,
      score,
      note
    }
  });

  return NextResponse.json({ data: grade }, { status: 201 });
}