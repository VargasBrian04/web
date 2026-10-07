import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/teachers — público. Repositorio de docentes: nombre, título,
 * materias (especialidad), presentación y horario. Sin datos sensibles.
 * Incluye a Dirección si también enseña (ficha docente con materias).
 */
export async function GET() {
  try {
    const teachers = await prisma.teacher.findMany({
      where: {
        user: {
          active: true,
          OR: [
            { role: "TEACHER" },
            { role: "ADMIN", teacherProfile: { subjects: { some: {} } } },
          ],
        },
      },
      select: {
        id: true,
        user: { select: { firstName: true, lastName: true } },
        title: true,
        bio: true,
        schedule: true,
        photo: true,
        subjects: { select: { subject: { select: { code: true, name: true, gradeYear: true, academic: { select: { code: true, shortName: true, name: true } } } } } },
      },
      orderBy: { user: { firstName: "asc" } },
    });
    return NextResponse.json({
      data: teachers.map((t: {
        id: string;
        user: { firstName: string; lastName: string };
        title: string | null; bio: string | null; schedule: string | null; photo: string | null;
        subjects: { subject: { code: string; name: string; gradeYear: number; academic: { code: string; shortName: string; name: string } | null } }[];
      }) => ({
        id: t.id,
        nombre: `${t.user.firstName} ${t.user.lastName}`.trim(),
        titulo: t.title,
        materias: t.subjects.map((s: { subject: { code: string; name: string; gradeYear: number; academic: { code: string; shortName: string; name: string } | null } }) => s.subject),
        bio: t.bio,
        horario: t.schedule,
        foto: t.photo,
      })),
    });
  } catch (e) {
    console.error("GET /api/teachers", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
