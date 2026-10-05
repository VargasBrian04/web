import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/catalogo — público, solo lectura. Datos reales para los
 * ComboBoxes de los formularios (sin inventar oferta académica):
 *  - Niveles: EEB (7.º, 8.º, 9.º — oferta real) y MEDIA (1.º, 2.º, 3.º).
 *  - Bachilleratos y materias: los que existen en la base de datos.
 */
export async function GET() {
  try {
    const [academics, subjects] = await Promise.all([
      prisma.academic.findMany({
        where: { active: true },
        select: { code: true, shortName: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.subject.findMany({
        select: {
          code: true,
          name: true,
          gradeYear: true,
          academic: { select: { code: true, shortName: true } },
        },
        orderBy: { name: "asc" },
      }),
    ]);
    return NextResponse.json({
      data: {
        levels: [
          { id: "EEB", name: "Educación Escolar Básica" },
          { id: "MEDIA", name: "Educación Media" },
        ],
        eebGrades: ["7.º", "8.º", "9.º"],
        mediaCourses: ["1.º", "2.º", "3.º"],
        secciones: ["A", "B"],
        turnos: ["MAÑANA", "TARDE"],
        seccionBachiller: "CCB",
        bachilleratos: (academics as any[]).map((a: any) => ({
          code: a.code,
          shortName: a.shortName,
          name: a.name,
        })),
        subjects: (subjects as any[]).map((s: any) => ({
          code: s.code,
          name: s.name,
          gradeYear: s.gradeYear,
          academicCode: s.academic.code,
          academicShort: s.academic.shortName,
        })),
      },
    });
  } catch (e) {
    console.error("GET /api/catalogo", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
