import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/** GET /api/cumpleanos — alumnos que cumplen hoy (día+mes, sin año). */
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  try {
    const users = await prisma.user.findMany({
      where: { active: true, birthDate: { not: null } },
      select: { firstName: true, lastName: true, birthDate: true, role: true },
      take: 500,
    });
    const now = new Date();
    const data = users
      .filter(
        (u: { birthDate: Date | null }) =>
          u.birthDate &&
          u.birthDate.getDate() === now.getDate() &&
          u.birthDate.getMonth() === now.getMonth()
      )
      .map((u: { firstName: string; lastName: string; birthDate: Date | null; role: string }) => ({
        nombre: `${u.firstName} ${u.lastName}`,
        edad: u.birthDate ? now.getFullYear() - u.birthDate.getFullYear() : null,
        rol: u.role,
      }))
      .slice(0, 30);
    return NextResponse.json({ data });
  } catch (e) {
    console.error("GET /api/cumpleanos", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
