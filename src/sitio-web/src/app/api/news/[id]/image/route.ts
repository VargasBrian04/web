import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readBuffer } from "@/lib/storage";

/**
 * GET /api/news/:id/image — portada pública (las noticias publicadas
 * las ve todo el mundo, con o sin sesión).
 */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const post = await prisma.newsPost.findUnique({
    where: { id },
    select: { imageFile: true, title: true },
  });
  if (!post?.imageFile)
    return NextResponse.json({ error: "Sin imagen" }, { status: 404 });
  try {
    const buf = await readBuffer(post.imageFile);
    const mime = post.imageFile.endsWith(".webp")
      ? "image/webp"
      : post.imageFile.endsWith(".png")
        ? "image/png"
        : "image/jpeg";
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": mime,
        "Content-Length": String(buf.length),
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "Imagen no disponible" }, { status: 404 });
  }
}
