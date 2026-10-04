import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveBuffer } from "@/lib/storage";

const DOC_TYPES = ["PLANILLA", "BOLETIN", "CERTIFICADO", "DOCUMENTO", "FOTO", "OTRO"] as const;

const selectDoc = {
  id: true,
  title: true,
  type: true,
  studentId: true,
  subjectId: true,
  classId: true,
  periodId: true,
  teacherId: true,
  fileUrl: true,
  mime: true,
  size: true,
  visibleToTutor: true,
  uploadedBy: true,
  createdAt: true,
  subject: { select: { code: true, name: true } },
  student: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
};

/**
 * GET /api/documents — lista según rol:
 *  ADMIN: todo · TEACHER: lo que subió + materias propias
 *  STUDENT: propios · PARENT: hijos con visibleToTutor=true
 *  Filtros: ?studentId=&subject=&classId=&period=&type=
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const qStudent = searchParams.get("studentId") || undefined;
  const qSubject = searchParams.get("subject") || undefined;
  const qClass = searchParams.get("classId") || undefined;
  const qPeriod = searchParams.get("period") || undefined;
  const qType = searchParams.get("type") || undefined;

  const baseWhere: Record<string, unknown> = {
    ...(qSubject ? { subject: { code: qSubject } } : {}),
    ...(qClass ? { classId: qClass } : {}),
    ...(qPeriod ? { period: { label: qPeriod } } : {}),
    ...(qType ? { type: qType as (typeof DOC_TYPES)[number] } : {}),
  };

  try {
    const role = session.user.role;
    if (role === "ADMIN") {
      const data = await prisma.document.findMany({
        where: { ...baseWhere, ...(qStudent ? { studentId: qStudent } : {}) },
        select: selectDoc,
        orderBy: { createdAt: "desc" },
        take: 100,
      });
      return NextResponse.json({ data });
    }
    if (role === "TEACHER") {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: session.user.id },
        include: { subjects: true },
      });
      if (!teacher) return NextResponse.json({ data: [] });
      const subjectIds = teacher.subjects.map((s: { subjectId: string }) => s.subjectId);
      const data = await prisma.document.findMany({
        where: {
          ...baseWhere,
          ...(qStudent ? { studentId: qStudent } : {}),
          OR: [{ teacherId: teacher.id }, ...(subjectIds.length ? [{ subjectId: { in: subjectIds } }] : [])],
        },
        select: selectDoc,
        orderBy: { createdAt: "desc" },
        take: 100,
      });
      return NextResponse.json({ data });
    }
    if (role === "STUDENT") {
      const student = await prisma.student.findUnique({ where: { userId: session.user.id } });
      if (!student) return NextResponse.json({ data: [] });
      const data = await prisma.document.findMany({
        where: {
          ...baseWhere,
          OR: [{ studentId: student.id }, { studentId: null, subject: { academicId: student.academicId ?? undefined } }],
        },
        select: selectDoc,
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
      const data = await prisma.document.findMany({
        where: { ...baseWhere, studentId: { in: ids }, visibleToTutor: true },
        select: selectDoc,
        orderBy: { createdAt: "desc" },
        take: 100,
      });
      return NextResponse.json({ data });
    }
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  } catch (e) {
    console.error("GET /api/documents", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

/**
 * POST /api/documents — TEACHER/ADMIN sube planilla (multipart/form-data).
 * Campos: file (PDF/JPG/PNG ≤10MB, requerido), title, type,
 *  studentId?, subjectCode?, classId?, periodLabel?, visibleToTutor (on/true por defecto).
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Formulario inválido (multipart)" }, { status: 400 });
  }

  const file = form.get("file");
  const title = String(form.get("title") || "").trim();
  const type = String(form.get("type") || "DOCUMENTO").toUpperCase();
  const studentId = (form.get("studentId") as string) || null;
  const subjectCode = (form.get("subjectCode") as string) || null;
  const classId = (form.get("classId") as string) || null;
  const periodLabel = (form.get("periodLabel") as string) || null;
  const visibleRaw = String(form.get("visibleToTutor") ?? "true").toLowerCase();
  const visibleToTutor = !["0", "false", "no", "off"].includes(visibleRaw);

  if (!(file instanceof File) || file.size === 0)
    return NextResponse.json({ error: "Adjuntá un archivo PDF/JPG/PNG" }, { status: 400 });
  if (!title || title.length > 120)
    return NextResponse.json({ error: "Título obligatorio (máx 120)" }, { status: 400 });
  if (!(DOC_TYPES as readonly string[]).includes(type))
    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });

  let subjectId: string | null = null;
  if (subjectCode) {
    const subject = await prisma.subject.findFirst({ where: { code: subjectCode } });
    if (!subject) return NextResponse.json({ error: "Materia inválida" }, { status: 400 });
    subjectId = subject.id;
    if (session.user.role === "TEACHER") {
      const teacherCheck = await prisma.teacher.findUnique({ where: { userId: session.user.id } });
      if (!teacherCheck) return NextResponse.json({ error: "Sin perfil docente" }, { status: 403 });
      const link = await prisma.teacherSubject.findUnique({
        where: { teacherId_subjectId: { teacherId: teacherCheck.id, subjectId: subject.id } },
      });
      if (!link) return NextResponse.json({ error: "No tenés asignada esta materia" }, { status: 403 });
    }
  }
  let periodId: string | null = null;
  if (periodLabel) {
    const period = await prisma.period.findUnique({ where: { label: periodLabel } });
    if (!period) return NextResponse.json({ error: "Período inválido" }, { status: 400 });
    periodId = period.id;
  }
  if (studentId) {
    const st = await prisma.student.findUnique({ where: { id: studentId } });
    if (!st) return NextResponse.json({ error: "Alumno inválido" }, { status: 400 });
  }
  if (classId) {
    const cl = await prisma.class.findUnique({ where: { id: classId } });
    if (!cl) return NextResponse.json({ error: "Curso inválido" }, { status: 400 });
  }

  let saved: { fileName: string; size: number };
  try {
    const buf = Buffer.from(await file.arrayBuffer());
    saved = await saveBuffer(buf, file.type || "application/octet-stream");
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Archivo inválido" },
      { status: 400 }
    );
  }

  const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } });

  const doc = await prisma.document.create({
    data: {
      title,
      type: type as (typeof DOC_TYPES)[number],
      studentId,
      subjectId,
      classId,
      periodId,
      teacherId: teacher?.id ?? null,
      fileName: saved.fileName,
      fileUrl: "", // se completa abajo con el id real
      mime: file.type,
      size: saved.size,
      visibleToTutor,
      uploadedBy: session.user.id,
    },
    select: { id: true },
  });

  const fileUrl = `/api/documents/${doc.id}/file`;
  const full = await prisma.document.update({
    where: { id: doc.id },
    data: { fileUrl },
    select: selectDoc,
  });
  return NextResponse.json({ data: full }, { status: 201 });
}
