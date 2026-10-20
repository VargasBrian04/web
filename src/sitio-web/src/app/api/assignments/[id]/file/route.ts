import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dataUriMeta, dataUriToBuffer, extFromMime } from "@/lib/data-uri";

/**
 * GET /api/assignments/:id/file — sirve el adjunto de una tarea con el
 * mismo alcance que el listado: alumno y tutor solo dentro de sus
 * bachilleratos; docente solo sus propias tareas; Dirección todo.
 */
export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await ctx.params;
  const assignment = await prisma.assignment
    .findUnique({
      where: { id },
      select: {
        fileData: true,
        teacherId: true,
        subject: { select: { academicId: true } },
      },
    })
    .catch(() => null);

  if (!assignment?.fileData) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const role = session.user.role;
  let allowed = role === "ADMIN";

  if (!allowed && role === "TEACHER") {
    const teacher = await prisma.teacher
      .findUnique({ where: { userId: session.user.id }, select: { id: true } })
      .catch(() => null);
    allowed = !!teacher && assignment.teacherId === teacher.id;
  }

  if (!allowed && role === "STUDENT") {
    const student = await prisma.student
      .findUnique({ where: { userId: session.user.id }, select: { academicId: true } })
      .catch(() => null);
    allowed = !!student?.academicId && assignment.subject?.academicId === student.academicId;
  }

  if (!allowed && role === "PARENT") {
    const academicId = assignment.subject?.academicId;
    if (academicId) {
      const link = await prisma.studentGuardian
        .findFirst({
          where: {
            guardian: { userId: session.user.id },
            student: { academicId },
          },
          select: { studentId: true },
        })
        .catch(() => null);
      allowed = !!link;
    }
  }

  // 404 también para no autorizados: no se revela si el archivo existe.
  if (!allowed) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  if (/^https?:\/\//i.test(assignment.fileData)) return NextResponse.redirect(assignment.fileData);

  const info = dataUriMeta(assignment.fileData);
  const buffer = dataUriToBuffer(assignment.fileData);
  if (!info || !buffer) return NextResponse.json({ error: "Formato inválido" }, { status: 404 });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": info.mime,
      "Content-Length": String(buffer.length),
      "Content-Disposition": `inline; filename="adjunto.${extFromMime(info.mime)}"`,
      "Cache-Control": "private, max-age=300, must-revalidate",
      "Vary": "Cookie",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
