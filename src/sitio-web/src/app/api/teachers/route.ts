import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/teachers — público. Repositorio de docentes: nombre, título,
 * materias (especialidad), presentación y horario. Sin datos sensibles.
 */
export async function GET() {
  try {
    const teachers = await prisma.teacher.findMany({
      where: { user: { active: true, role: "TEACHER" } },
      select: {
        user: { select: { firstName: true, lastName: true } },
        title: true,
        bio: true,
        schedule: true,
        subjects: { select: { subject: { select: { code: true, name: true } } } },
      },
      orderBy: { user: { firstName: "asc" } },
    });
    return NextResponse.json({
      data: teachers.map((t) => ({
        nombre: `${t.user.firstName} ${t.user.lastName}`.trim(),
        titulo: t.title,
        materias: t.subjects.map((s) => s.subject),
        bio: t.bio,
        horario: t.schedule,
      })),
    });
  } catch (e) {
    console.error("GET /api/teachers", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
