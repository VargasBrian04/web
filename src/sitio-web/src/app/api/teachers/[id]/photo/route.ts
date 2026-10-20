import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/teachers/:id/photo — foto pública del docente.
 * La foto se guarda como data URI en la base; aquí se sirve como binario
 * cacheado para no exponer un string enorme en el listado /api/teachers.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const teacher = await prisma.teacher.findUnique({
    where: { id },
    select: { photo: true },
  });
  const photo = teacher?.photo;
  if (!photo) return NextResponse.json({ error: "Sin foto" }, { status: 404 });

  // Si algún día se migra a R2/URL externa, redirigir.
  if (/^https?:\/\//i.test(photo)) return NextResponse.redirect(photo);

  const match = /^data:([^;]+);base64,(.+)$/s.exec(photo);
  if (!match) return NextResponse.json({ error: "Formato inválido" }, { status: 404 });
  const mime = match[1];
  const buf = Buffer.from(match[2], "base64");
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": mime,
      "Content-Length": String(buf.length),
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
