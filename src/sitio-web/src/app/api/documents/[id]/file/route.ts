import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readBuffer } from "@/lib/storage";

/** GET /api/documents/:id/file — descarga inline con control de acceso por rol. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const { id } = await ctx.params;
  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const role = session.user.role;
  let ok = false;
  if (role === "ADMIN") ok = true;
  else if (role === "TEACHER") {
    const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id }, include: { subjects: true } });
    ok = !!teacher && (doc.teacherId === teacher.id || (doc.subjectId != null && teacher.subjects.some((s: { subjectId: string }) => s.subjectId === doc.subjectId)));
  } else if (role === "STUDENT") {
    const student = await prisma.student.findUnique({ where: { userId: session.user.id } });
    ok = !!student && (doc.studentId === student.id || doc.studentId == null);
  } else if (role === "PARENT") {
    ok = doc.visibleToTutor && doc.studentId != null && !!(await prisma.studentGuardian.findFirst({
      where: { studentId: doc.studentId, guardian: { userId: session.user.id } },
    }));
  }
  if (!ok) return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  try {
    const buf = await readBuffer(doc.fileName);
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": doc.mime,
        "Content-Length": String(buf.length),
        "Content-Disposition": `inline; filename="${encodeURIComponent(doc.title)}"`,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch {
    return NextResponse.json({ error: "Archivo no disponible" }, { status: 404 });
  }
}
