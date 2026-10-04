import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** POST /api/assignments/submit — el alumno marca una tarea como entregada. */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.user.role !== "STUDENT" && session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Solo alumnos" }, { status: 403 });

  const { assignmentId, fileUrl } = (await request.json()) as {
    assignmentId?: string;
    fileUrl?: string;
  };
  if (!assignmentId) return NextResponse.json({ error: "Falta tarea" }, { status: 400 });

  const student = await prisma.student.findUnique({ where: { userId: session.user.id } });
  if (!student) return NextResponse.json({ error: "Sin perfil de alumno" }, { status: 400 });

  const sub = await prisma.assignmentSubmission.upsert({
    where: { assignmentId_studentId: { assignmentId, studentId: student.id } },
    update: { status: "ENTREGADA", fileUrl: fileUrl ?? null, submittedAt: new Date() },
    create: {
      assignmentId,
      studentId: student.id,
      status: "ENTREGADA",
      fileUrl: fileUrl ?? null,
      submittedAt: new Date(),
    },
  });
  return NextResponse.json({ data: sub }, { status: 201 });
}
