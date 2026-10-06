import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * PATCH /api/teacher/profile — el docente edita su ficha pública
 * (título, presentación, horario). ADMIN puede editar la de cualquiera
 * pasando { teacherUserId }.
 */
export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const targetUserId =
    session.user.role === "ADMIN" && typeof body.teacherUserId === "string"
      ? body.teacherUserId
      : session.user.id;

  const title = typeof body.title === "string" ? body.title.trim().slice(0, 120) : undefined;
  const bio = typeof body.bio === "string" ? body.bio.trim().slice(0, 2000) : undefined;
  const schedule = typeof body.schedule === "string" ? body.schedule.trim().slice(0, 300) : undefined;

  try {
    const target = await prisma.teacher.findUnique({ where: { userId: targetUserId }, select: { id: true } });
    if (!target) {
      if (session.user.role === "TEACHER" && targetUserId === session.user.id) {
        await prisma.teacher.create({ data: { userId: targetUserId } });
      } else {
        return NextResponse.json({ error: "Tu cuenta es de Dirección, sin ficha docente" }, { status: 400 });
      }
    }
    const updated = await prisma.teacher.update({
      where: { userId: targetUserId },
      data: {
        ...(title !== undefined ? { title: title || null } : {}),
        ...(bio !== undefined ? { bio: bio || null } : {}),
        ...(schedule !== undefined ? { schedule: schedule || null } : {}),
      },
      select: { title: true, bio: true, schedule: true },
    });
    return NextResponse.json({ data: updated });
  } catch {
    return NextResponse.json({ error: "Docente inexistente" }, { status: 404 });
  }
}
