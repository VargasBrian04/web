import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { imageToDataUri, NEWS_IMAGE_MIME } from "@/lib/storage";

/**
 * POST /api/teacher/photo — el docente sube su foto de perfil
 * (PNG/JPG/WEBP ≤ 4 MB, se guarda en la DB). ADMIN con teacherUserId.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Formulario inválido" }, { status: 400 });
  const targetUserId =
    session.user.role === "ADMIN" && typeof form.get("teacherUserId") === "string" &&
    (form.get("teacherUserId") as string)
      ? (form.get("teacherUserId") as string)
      : session.user.id;
  const file = form.get("photo");
  if (!(file instanceof File) || file.size === 0)
    return NextResponse.json({ error: "Elegí una foto" }, { status: 400 });
  const existing = await prisma.teacher.findUnique({ where: { userId: targetUserId }, select: { id: true } });
  if (!existing) {
    if (session.user.role === "TEACHER" && targetUserId === session.user.id) {
      await prisma.teacher.create({ data: { userId: targetUserId } });
    } else {
      return NextResponse.json({ error: "Tu cuenta es de Dirección, sin ficha docente" }, { status: 400 });
    }
  }
  try {
    const uri = imageToDataUri(
      Buffer.from(await file.arrayBuffer()), file.type, NEWS_IMAGE_MIME, "PNG/JPG/WEBP"
    );
    const updated = await prisma.teacher.update({
      where: { userId: targetUserId },
      data: { photo: uri },
      select: { photo: true },
    });
    void updated;
    return NextResponse.json({ data: { ok: true } });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Imagen inválida" },
      { status: 400 }
    );
  }
}
