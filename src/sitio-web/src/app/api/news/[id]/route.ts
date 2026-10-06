import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NEWS_IMAGE_MIME, imageToDataUri, removeFile } from "@/lib/storage";
import {
  NEWS_CATEGORIES,
  isNewsCategory,
  plainText,
  sanitizeHtml,
} from "@/lib/news";

const selectFull = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  content: true,
  category: true,
  imageUrl: true,
  imageFile: true,
  status: true,
  publishedAt: true,
  authorName: true,
  createdAt: true,
  updatedAt: true,
};

/** GET /api/news/:id — pública si PUBLICADA; borrador solo ADMIN y TEACHER. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const post = await prisma.newsPost.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    select: selectFull,
  });
  if (!post) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  if (post.status !== "PUBLICADA") {
    const session = await auth();
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER"))
      return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }
  return NextResponse.json({ data: post });
}

/**
 * PATCH /api/news/:id — ADMIN y TEACHER. Acepta JSON o multipart:
 *  title?, category?, publishDate?, status?, content?, removeImage?,
 *  image? (reemplaza). El slug NO cambia (URLs estables, sin duplicados).
 */
export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")
    return NextResponse.json({ error: "Solo Dirección y Docentes" }, { status: 403 });

  const { id } = await ctx.params;
  const post = await prisma.newsPost.findUnique({ where: { id } });
  if (!post) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

  const ctype = request.headers.get("content-type") || "";
  let f: Record<string, unknown> = {};
  let newImage: File | null = null;
  if (ctype.includes("multipart/form-data")) {
    const form = await request.formData();
    form.forEach((v, k) => {
      if (v instanceof File) {
        if (k === "image" && v.size > 0) newImage = v;
      } else f[k] = String(v);
    });
  } else {
    try {
      f = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
    }
  }

  const data: Record<string, unknown> = {};
  if (typeof f.title === "string") {
    const t = f.title.trim();
    if (!t || t.length > 160)
      return NextResponse.json({ error: "Título inválido (máx 160)" }, { status: 400 });
    data.title = t;
  }
  if (typeof f.category === "string") {
    if (!isNewsCategory(f.category))
      return NextResponse.json(
        { error: `Categoría inválida (${NEWS_CATEGORIES.join(" · ")})` },
        { status: 400 }
      );
    data.category = f.category;
  }
  if (typeof f.publishDate === "string") {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f.publishDate) || Number.isNaN(Date.parse(f.publishDate)))
      return NextResponse.json({ error: "Fecha inválida" }, { status: 400 });
    data.publishedAt = new Date(f.publishDate + "T12:00:00");
  }
  if (typeof f.status === "string") {
    const s = f.status.toUpperCase();
    if (s !== "BORRADOR" && s !== "PUBLICADA")
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    data.status = s;
  }
  if (typeof f.content === "string") {
    const clean = sanitizeHtml(f.content);
    if (plainText(clean).length < 10)
      return NextResponse.json({ error: "Contenido muy corto (mín 10)" }, { status: 400 });
    data.content = clean;
    data.excerpt = plainText(clean).slice(0, 280) || null;
  }
  const upload = newImage as File | null;
  if (upload) {
    try {
      const uri = imageToDataUri(
        Buffer.from(await upload.arrayBuffer()),
        upload.type,
        NEWS_IMAGE_MIME,
        "PNG/JPG/WEBP"
      );
      if (post.imageFile && !post.imageFile.startsWith("data:")) await removeFile(post.imageFile);
      data.imageFile = uri;
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Imagen inválida" },
        { status: 400 }
      );
    }
  } else if (f.removeImage === "1" || f.removeImage === true) {
    if (post.imageFile && !post.imageFile.startsWith("data:")) await removeFile(post.imageFile);
    data.imageFile = null;
  }
  if (!Object.keys(data).length)
    return NextResponse.json({ error: "Nada para actualizar" }, { status: 400 });

  const updated = await prisma.newsPost.update({
    where: { id },
    data,
    select: selectFull,
  });
  return NextResponse.json({ data: updated });
}

/** DELETE /api/news/:id — ADMIN y TEACHER. Borra registro + imagen subida. */
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")
    return NextResponse.json({ error: "Solo Dirección y Docentes" }, { status: 403 });

  const { id } = await ctx.params;
  const post = await prisma.newsPost.findUnique({ where: { id } });
  if (!post) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

  await prisma.newsPost.delete({ where: { id } });
  if (post.imageFile && !post.imageFile.startsWith("data:")) await removeFile(post.imageFile);
  return NextResponse.json({ data: { ok: true } });
}
