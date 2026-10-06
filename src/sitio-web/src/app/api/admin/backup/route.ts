import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * GET /api/admin/backup — solo ADMIN. Exporta JSON con las tablas
 * principales (respaldo manual descargable; lo automático requiere
 * destino externo configurado).
 */
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Solo Dirección" }, { status: 403 });
  try {
    const [users, academics, news, enrollments, requests, courses, announcements, polls] =
      await Promise.all([
        prisma.user.findMany({ select: { id: true, ci: true, username: true, email: true, firstName: true, lastName: true, phone: true, role: true, active: true, createdAt: true } }),
        prisma.academic.findMany(),
        prisma.newsPost.findMany({ select: { id: true, slug: true, title: true, category: true, status: true, publishedAt: true, createdAt: true } }),
        prisma.enrollment.findMany(),
        prisma.accountRequest.findMany(),
        prisma.course.findMany(),
        prisma.announcement.findMany(),
        prisma.poll.findMany({ include: { votes: true } }),
      ]);
    const stamp = new Date().toISOString().slice(0, 10);
    return new NextResponse(
      JSON.stringify({ fecha: stamp, users, academics, news, enrollments, requests, courses, announcements, polls }),
      {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="respaldo-${stamp}.json"`,
        },
      }
    );
  } catch (e) {
    console.error("GET /api/admin/backup", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
