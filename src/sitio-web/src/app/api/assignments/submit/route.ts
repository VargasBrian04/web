import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/assignments/submit — el alumno marca una tarea como entregada.
 * Solo puede entregar tareas de materias de su propio bachillerato y el
 * enlace adjunto debe ser una ruta interna (no URLs externas ni data URIs).
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.user.role !== "STUDENT")
    return NextResponse.json({ error: "Solo alumnos" }, { status: 403 });

  const payload = (await request.json().catch(() => null)) as {
    assignmentId?: string;
    fileUrl?: string;
  } | null;
  const assignmentId = payload?.assignmentId?.trim();
  if (!assignmentId) return NextResponse.json({ error: "Falta tarea" }, { status: 400 });

  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    select: { id: true, academicId: true },
  });
  if (!student) return NextResponse.json({ error: "Sin perfil de alumno" }, { status: 400 });

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: { id: true, subject: { select: { academicId: true } } },
  });
  if (!assignment) return NextResponse.json({ error: "Tarea inexistente" }, { status: 404 });
  if (!student.academicId || assignment.subject?.academicId !== student.academicId)
    return NextResponse.json({ error: "La tarea no pertenece a tu bachillerato" }, { status: 403 });

  // Solo rutas internas: evita javascript:, enlaces externos y data URIs.
  let safeFileUrl: string | null = null;
  const raw = payload?.fileUrl?.trim();
  if (raw) {
    if (raw.length > 500 || !/^\/(?!\/)[\w\-./?=&%]+$/.test(raw))
      return NextResponse.json({ error: "Enlace inválido" }, { status: 400 });
    safeFileUrl = raw;
  }

  const sub = await prisma.assignmentSubmission.upsert({
    where: { assignmentId_studentId: { assignmentId, studentId: student.id } },
    update: { status: "ENTREGADA", fileUrl: safeFileUrl, submittedAt: new Date() },
    create: {
      assignmentId,
      studentId: student.id,
      status: "ENTREGADA",
      fileUrl: safeFileUrl,
      submittedAt: new Date(),
    },
  });
  return NextResponse.json({ data: sub }, { status: 201 });
}
