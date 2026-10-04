import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/teacher/roster — nómina para el docente:
 * materias que imparte, períodos, y alumnos (con notas del período/materia).
 * Query opcional: ?subject=CODE&period=LABEL
 * ADMIN ve todo.
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const subjectCode = searchParams.get("subject") || undefined;
  const periodLabel = searchParams.get("period") || undefined;
  const q = (searchParams.get("q") || "").trim().toLowerCase();
  const page = Math.max(1, Number(searchParams.get("page") || "1") || 1);
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || "80") || 80));

  try {
    const subjects = await prisma.subject.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        gradeYear: true,
        academic: { select: { shortName: true, name: true } },
      },
      orderBy: { name: "asc" },
      take: 200,
    });

    let teacherSubjectCodes: string[] | null = null;
    if (session.user.role === "TEACHER") {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: session.user.id },
        include: { subjects: { include: { subject: { select: { code: true } } } } },
      });
      teacherSubjectCodes = teacher?.subjects.map((s: any) => s.subject.code) ?? [];
    }

    const visibleSubjects = teacherSubjectCodes
      ? subjects.filter((s: any) => teacherSubjectCodes!.includes(s.code))
      : subjects;

    // Si el docente pide una materia que no tiene asignada, denegar.
    if (session.user.role === "TEACHER" && subjectCode && teacherSubjectCodes && !teacherSubjectCodes.includes(subjectCode)) {
      return NextResponse.json({ error: "No tenés asignada esta materia" }, { status: 403 });
    }

    const periods = await prisma.period.findMany({
      select: { id: true, label: true, name: true },
      orderBy: { label: "desc" },
    });

    // Alumnos: solo del/los bachilleratos de las materias visibles.
    // Antes se devolvían todos (take 300) exponiendo PII a cualquier docente.
    const academicIds = [
      ...new Set(
        (await prisma.subject.findMany({
          where: { code: { in: visibleSubjects.map((s) => s.code) } },
          select: { academicId: true },
        })).map((s) => s.academicId)
      ),
    ];
    const students = await prisma.student.findMany({
      where: {
        ...(academicIds.length ? { academicId: { in: academicIds } } : { academicId: { in: [] } }),
        ...(q
          ? {
              OR: [
                { user: { firstName: { contains: q, mode: "insensitive" } } },
                { user: { lastName: { contains: q, mode: "insensitive" } } },
                { user: { ci: { contains: q } } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        academic: { select: { shortName: true, name: true } },
        user: { select: { firstName: true, lastName: true, ci: true, email: true } },
        grades: {
          where: {
            ...(subjectCode ? { subject: { code: subjectCode } } : {}),
            ...(periodLabel ? { period: { label: periodLabel } } : {}),
          },
          select: {
            id: true,
            score: true,
            note: true,
            subject: { select: { code: true, name: true } },
            period: { select: { label: true, name: true } },
          },
        },
      },
      orderBy: { user: { lastName: "asc" } },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return NextResponse.json({ data: { subjects: visibleSubjects, allSubjects: subjects, periods, students, page, pageSize } });
  } catch (e) {
    console.error("GET /api/teacher/roster", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
