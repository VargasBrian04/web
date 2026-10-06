import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/** POST /api/comunicados/leer { id } — marca lectura propia. */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const { id } = ((await request.json().catch(() => null)) ?? {}) as { id?: string };
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });
  await prisma.announcementRead.upsert({
    where: { announcementId_userId: { announcementId: id, userId: session.user.id } },
    update: {},
    create: { announcementId: id, userId: session.user.id },
  });
  return NextResponse.json({ data: { id, leido: true } });
}
