import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** GET /api/admin/stats — resumen para Dirección/Secretaría. Solo ADMIN. */
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Solo Secretaría/Dirección" }, { status: 403 });

  try {
    const [usersByRole, enrollByStatus, gradesCount, assignCount, attendanceCount, academics] =
      await Promise.all([
        prisma.user.groupBy({ by: ["role"], _count: { role: true } }),
        prisma.enrollment.groupBy({ by: ["status"], _count: { status: true } }),
        prisma.grade.count(),
        prisma.assignment.count(),
        prisma.attendance.count(),
        prisma.academic.findMany({ select: { code: true, shortName: true, name: true, _count: { select: { students: true } } } }),
      ]);
    return NextResponse.json({
      data: { usersByRole, enrollByStatus, gradesCount, assignCount, attendanceCount, academics },
    });
  } catch (e) {
    console.error("GET /api/admin/stats", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
