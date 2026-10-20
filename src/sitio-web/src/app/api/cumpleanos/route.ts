import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * GET /api/cumpleanos — alumnos que cumplen hoy (día+mes, sin año).
 * Solo ADMIN y TEACHER. Para docentes se devuelve nombre abreviado y sin
 * edad (dato sensible innecesario); Dirección ve el nombre completo.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const role = session.user.role;
  if (role !== "ADMIN" && role !== "TEACHER")
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  try {
    const now = new Date();
    // 1.577 alumnos: traemos solo el mes/día que interesa vía rango amplio y
    // filtramos en memoria; el volumen es acotado y evita SQL crudo.
    const users = await prisma.user.findMany({
      where: { active: true, role: "STUDENT", birthDate: { not: null } },
      select: { firstName: true, lastName: true, birthDate: true },
      take: 5000,
    });
    const data = users
      .filter(
        (u: { birthDate: Date | null }) =>
          u.birthDate &&
          u.birthDate.getDate() === now.getDate() &&
          u.birthDate.getMonth() === now.getMonth()
      )
      .slice(0, 30)
      .map((u: { firstName: string; lastName: string }) =>
        role === "ADMIN"
          ? { nombre: `${u.firstName} ${u.lastName}`.trim() }
          : { nombre: `${u.firstName} ${u.lastName.charAt(0)}.`.trim() }
      );
    return NextResponse.json(
      { data },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    console.error("GET /api/cumpleanos", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
