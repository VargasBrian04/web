import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseFileDataUri } from "@/lib/storage";

/**
 * GET /api/comunicados-publicos/:id — descarga pública de un adjunto.
 * Solo se sirve si el comunicado dueño está activo y publicado.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const file = await prisma.publicNoticeFile.findUnique({
      where: { id },
      select: { name: true, mime: true, data: true, notice: { select: { active: true, publishedAt: true } } },
    });
    if (!file || !file.notice.active || !file.notice.publishedAt)
      return NextResponse.json({ error: "Archivo no disponible" }, { status: 404 });

    const data = parseFileDataUri(file.data);
    if (!data) return NextResponse.json({ error: "Archivo no disponible" }, { status: 404 });

    return new NextResponse(new Uint8Array(data.buf), {
      headers: {
        "Content-Type": data.mime,
        "Content-Length": String(data.buf.length),
        "Content-Disposition": `inline; filename="${encodeURIComponent(file.name)}"`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (e) {
    console.error("GET /api/comunicados-publicos/[id]", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}