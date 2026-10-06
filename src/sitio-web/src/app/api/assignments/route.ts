import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/assignments — Tareas según rol.
 *  STUDENT: tareas de su bachillerato + su estado de entrega.
 *  PARENT: tareas de los bachilleratos de sus hijos.
 *  TEACHER: las que creó + entregas.
 *  ADMIN: todas.
 * POST /api/assignments — TEACHER/ADMIN crea tarea.
 * Body: { subjectCode, title, description?, dueDate?, periodLabel? }
 * POST /api/assignments/submit — STUDENT marca entrega.
 * Body: { assignmentId, fileUrl? }
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const subjectCode = searchParams.get("subject") || undefined;
  const role = session.user.role;

  const where = { ...(subjectCode ? { subject: { code: subjectCode } } : {}) };
  const include = {
    subject: { select: { code: true, name: true } },
    teacher: { select: { user: { select: { firstName: true, lastName: true } } } },
    period: { select: { label: true, name: true } },
    submissions: {
      select: { id: true, studentId: true, status: true, submittedAt: true, score: true, feedback: true },
    },
  };

  try {
    if (role === "STUDENT") {
      const student = await prisma.student.findUnique({ where: { userId: session.user.id } });
      if (!student) return NextResponse.json({ data: [] });
      const data = await prisma.assignment.findMany({
        where: {
          ...where,
          ...(student.academicId ? { subject: { academicId: student.academicId } } : {}),
        },
        include: {
          ...include,
          submissions: { where: { studentId: student.id }, select: include.submissions.select },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
      return NextResponse.json({ data });
    }
    if (role === "PARENT") {
      const links = await prisma.studentGuardian.findMany({
        where: { guardian: { userId: session.user.id } },
        include: { student: { select: { academicId: true } } },
      });
      const academicIds = [...new Set(links.map((l: any) => l.student.academicId).filter(Boolean))] as string[];
      const data = await prisma.assignment.findMany({
        where: {
          ...where,
          ...(academicIds.length && !subjectCode ? { subject: { academicId: { in: academicIds } } } : {}),
        },
        include,
        orderBy: { createdAt: "desc" },
        take: 100,
      });
      return NextResponse.json({ data });
    }
    if (role === "TEACHER") {
      const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } });
      const data = await prisma.assignment.findMany({
        where: { ...where, ...(teacher ? { teacherId: teacher.id } : {}) },
        include,
        orderBy: { createdAt: "desc" },
        take: 100,
      });
      return NextResponse.json({ data });
    }
    if (role === "ADMIN") {
      const data = await prisma.assignment.findMany({
        where,
        include,
        orderBy: { createdAt: "desc" },
        take: 100,
      });
      return NextResponse.json({ data });
    }
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  } catch (e) {
    console.error("GET /api/assignments", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  // Nota: la entrega del alumno vive en /api/assignments/submit (submit/route.ts).
  // Se eliminó la rama muerta pathname.endsWith("/submit") que nunca era true aquí.

  const ctype = request.headers.get("content-type") || "";
  let subjectCode: string | undefined;
  let title: string | undefined;
  let description: string | undefined;
  let dueDate: string | undefined;
  let periodLabel: string | undefined;
  let notes: string | undefined;
  let fileData: string | null = null;
  if (ctype.includes("multipart/form-data")) {
    const form = await request.formData().catch(() => null);
    if (!form) return NextResponse.json({ error: "Formulario inválido" }, { status: 400 });
    subjectCode = String(form.get("subjectCode") || "") || undefined;
    title = String(form.get("title") || "") || undefined;
    description = String(form.get("description") || "") || undefined;
    dueDate = String(form.get("dueDate") || "") || undefined;
    periodLabel = String(form.get("periodLabel") || "") || undefined;
    notes = String(form.get("notes") || "").trim().slice(0, 2000) || undefined;
    const file = form.get("file");
    if (file instanceof File && file.size > 0) {
      if (file.type !== "application/pdf")
        return NextResponse.json({ error: "Solo PDF (máx 4 MB)" }, { status: 400 });
      if (file.size > 4 * 1024 * 1024)
        return NextResponse.json({ error: "PDF muy pesado (máx 4 MB)" }, { status: 400 });
      const buf = Buffer.from(await file.arrayBuffer());
      fileData = `data:application/pdf;base64,${buf.toString("base64")}`;
    }
  } else {
    const body = (await request.json().catch(() => null)) as {
      subjectCode?: string;
      title?: string;
      description?: string;
      dueDate?: string;
      periodLabel?: string;
      notes?: string;
    } | null;
    if (!body) return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
    ({ subjectCode, title, description, dueDate, periodLabel } = body);
    notes = body.notes?.trim().slice(0, 2000) || undefined;
  }
  if (!subjectCode || !title?.trim())
    return NextResponse.json({ error: "Materia y título obligatorios" }, { status: 400 });

  const subject = await prisma.subject.findFirst({ where: { code: subjectCode } });
  if (!subject) return NextResponse.json({ error: "Materia inválida" }, { status: 400 });
  let periodId: string | null = null;
  if (periodLabel) {
    const period = await prisma.period.findUnique({ where: { label: periodLabel } });
    periodId = period?.id ?? null;
  }
  const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } });
  if (session.user.role === "TEACHER") {
    if (!teacher) return NextResponse.json({ error: "Sin perfil docente" }, { status: 403 });
    const link = await prisma.teacherSubject.findUnique({
      where: { teacherId_subjectId: { teacherId: teacher.id, subjectId: subject.id } }
    });
    if (!link) return NextResponse.json({ error: "No tenés asignada esta materia" }, { status: 403 });
  }

  const created = await prisma.assignment.create({
    data: {
      subjectId: subject.id,
      teacherId: teacher?.id ?? null,
      periodId,
      title: title.trim(),
      description: description?.trim() || null,
      fileData,
      notes,
      dueDate: dueDate ? new Date(dueDate) : null,
    },
  });
  return NextResponse.json({ data: created }, { status: 201 });
}
