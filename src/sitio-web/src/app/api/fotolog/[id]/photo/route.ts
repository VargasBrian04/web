import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dataUriMeta, dataUriToBuffer, extFromMime } from "@/lib/data-uri";

/**
 * GET /api/fotolog/:id/photo — sirve la fotografía de una planilla con
 * control de acceso equivalente al listado. Evita enviar data URIs
 * completos en la respuesta JSON y permite que el navegador cargue las
 * imágenes de forma diferida y cacheada.
 */
export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await ctx.params;
  const log = await prisma.photoLog
    .findUnique({
      where: { id },
      select: {
        photoData: true,
        teacherId: true,
        subject: { select: { academicId: true } },
      },
    })
    .catch(() => null);

  if (!log?.photoData) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const role = session.user.role;
  let allowed = role === "ADMIN";

  if (!allowed && role === "TEACHER") {
    const teacher = await prisma.teacher
      .findUnique({ where: { userId: session.user.id }, select: { id: true } })
      .catch(() => null);
    allowed = !!teacher && log.teacherId === teacher.id;
  }

  if (!allowed && role === "STUDENT") {
    const student = await prisma.student
      .findUnique({ where: { userId: session.user.id }, select: { academicId: true } })
      .catch(() => null);
    allowed = !!student?.academicId && log.subject?.academicId === student.academicId;
  }

  if (!allowed && role === "PARENT") {
    const academicId = log.subject?.academicId;
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

  // 404 también para no autorizados: no se revela si la foto existe.
  if (!allowed) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  if (/^https?:\/\//i.test(log.photoData)) return NextResponse.redirect(log.photoData);

  const info = dataUriMeta(log.photoData);
  const buffer = dataUriToBuffer(log.photoData);
  if (!info || !buffer) return NextResponse.json({ error: "Formato inválido" }, { status: 404 });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": info.mime,
      "Content-Length": String(buffer.length),
      "Content-Disposition": `inline; filename="planilla.${extFromMime(info.mime)}"`,
      "Cache-Control": "private, max-age=300, must-revalidate",
      "Vary": "Cookie",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
