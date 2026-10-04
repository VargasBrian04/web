import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { removeFile } from "@/lib/storage";

async function canSee(doc: { teacherId: string | null; studentId: string | null; subjectId: string | null; visibleToTutor: boolean }, userId: string, role: string): Promise<boolean> {
  if (role === "ADMIN") return true;
  if (role === "TEACHER") {
    const teacher = await prisma.teacher.findUnique({ where: { userId }, include: { subjects: true } });
    if (!teacher) return false;
    if (doc.teacherId === teacher.id) return true;
    if (doc.subjectId && teacher.subjects.some((s: { subjectId: string }) => s.subjectId === doc.subjectId)) return true;
    return false;
  }
  if (role === "STUDENT") {
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) return false;
    if (doc.studentId && doc.studentId === student.id) return true;
    if (!doc.studentId) return true; // general del curso/materia
    return false;
  }
  if (role === "PARENT") {
    if (!doc.visibleToTutor) return false;
    if (!doc.studentId) return false;
    const link = await prisma.studentGuardian.findFirst({
      where: { studentId: doc.studentId, guardian: { userId } },
    });
    return !!link;
  }
  return false;
}

/** GET /api/documents/:id — metadatos (con el mismo control que el archivo). */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const { id } = await ctx.params;
  const doc = await prisma.document.findUnique({
    where: { id },
    include: { subject: { select: { code: true, name: true } } },
  });
  if (!doc) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  if (!(await canSee(doc, session.user.id, session.user.role)))
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  const { fileName, ...meta } = doc;
  void fileName;
  return NextResponse.json({ data: meta });
}

/** PATCH /api/documents/:id — dueño o ADMIN: { title?, visibleToTutor? }. */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  const { id } = await ctx.params;
  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  if (session.user.role === "TEACHER") {
    const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } });
    if (!teacher || doc.teacherId !== teacher.id)
      return NextResponse.json({ error: "Solo el autor o Dirección" }, { status: 403 });
  }
  const body = (await req.json()) as { title?: string; visibleToTutor?: boolean };
  const data: Record<string, unknown> = {};
  if (typeof body.title === "string" && body.title.trim() && body.title.length <= 120) data.title = body.title.trim();
  if (typeof body.visibleToTutor === "boolean") data.visibleToTutor = body.visibleToTutor;
  if (!Object.keys(data).length) return NextResponse.json({ error: "Nada para actualizar" }, { status: 400 });
  const updated = await prisma.document.update({ where: { id }, data });
  const { fileName, ...meta } = updated;
  void fileName;
  return NextResponse.json({ data: meta });
}

/** DELETE /api/documents/:id — dueño o ADMIN (borra archivo + registro). */
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  const { id } = await ctx.params;
  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  if (session.user.role === "TEACHER") {
    const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } });
    if (!teacher || doc.teacherId !== teacher.id)
      return NextResponse.json({ error: "Solo el autor o Dirección" }, { status: 403 });
  }
  await prisma.document.delete({ where: { id } });
  await removeFile(doc.fileName);
  return NextResponse.json({ data: { ok: true } });
}
