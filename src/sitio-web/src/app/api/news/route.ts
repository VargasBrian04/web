import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NEWS_IMAGE_MIME, imageToDataUri } from "@/lib/storage";
import { enviarCorreo } from "@/lib/mail";
import {
  NEWS_CATEGORIES,
  isNewsCategory,
  plainText,
  sanitizeHtml,
  slugify,
} from "@/lib/news";

const selectNews = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  category: true,
  imageUrl: true,
  imageFile: true,
  status: true,
  publishedAt: true,
  authorName: true,
  createdAt: true,
  updatedAt: true,
};

/**
 * GET /api/news — público: solo PUBLICADA, recientes primero.
 *  ?limit=4 (portada) · ?page=&pageSize= (paginado de "todas")
 *  ?all=1 → incluye borradores, solo ADMIN.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || "0") || 0));
  const page = Math.max(1, Number(searchParams.get("page") || "1") || 1);
  const pageSize = Math.min(24, Math.max(1, Number(searchParams.get("pageSize") || "9") || 9));
  const wantAll = searchParams.get("all") === "1";

  let where: Record<string, unknown> = { status: "PUBLICADA" };
  if (wantAll) {
    const session = await auth();
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER"))
      return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
    where = {};
  }

  const orderBy = [{ publishedAt: "desc" as const }, { createdAt: "desc" as const }];
  try {
    if (limit) {
      const data = await prisma.newsPost.findMany({
        where,
        select: selectNews,
        orderBy,
        take: limit,
      });
      return NextResponse.json({ data });
    }
    const [total, data] = await Promise.all([
      prisma.newsPost.count({ where }),
      prisma.newsPost.findMany({
        where,
        select: selectNews,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return NextResponse.json({ data, page, pageSize, total });
  } catch (e) {
    console.error("GET /api/news", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

/**
 * POST /api/news — ADMIN y TEACHER. multipart/form-data:
 *  title*, category*, publishDate (yyyy-mm-dd)*, status (BORRADOR|PUBLICADA),
 *  content (HTML)*, image? (PNG/JPG/WEBP ≤10MB).
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")
    return NextResponse.json({ error: "Solo Dirección y Docentes" }, { status: 403 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Formulario inválido (multipart)" }, { status: 400 });
  }

  const title = String(form.get("title") || "").trim();
  const category = String(form.get("category") || "").trim();
  const publishDate = String(form.get("publishDate") || "").trim();
  const statusRaw = String(form.get("status") || "BORRADOR").toUpperCase();
  const content = sanitizeHtml(String(form.get("content") || ""));
  const file = form.get("image");

  if (!title || title.length > 160)
    return NextResponse.json({ error: "Título obligatorio (máx 160)" }, { status: 400 });
  if (!isNewsCategory(category))
    return NextResponse.json(
      { error: `Categoría inválida (${NEWS_CATEGORIES.join(" · ")})` },
      { status: 400 }
    );
  if (!/^\d{4}-\d{2}-\d{2}$/.test(publishDate) || Number.isNaN(Date.parse(publishDate)))
    return NextResponse.json({ error: "Fecha de publicación inválida" }, { status: 400 });
  if (statusRaw !== "BORRADOR" && statusRaw !== "PUBLICADA")
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  if (plainText(content).length < 10)
    return NextResponse.json({ error: "El contenido es muy corto (mín 10 caracteres)" }, { status: 400 });

  let imageFile: string | null = null;
  if (file instanceof File && file.size > 0) {
    try {
      // Data URI en DB: sobrevive al disco efímero de Vercel.
      imageFile = imageToDataUri(
        Buffer.from(await file.arrayBuffer()),
        file.type,
        NEWS_IMAGE_MIME,
        "PNG/JPG/WEBP"
      );
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Imagen inválida" },
        { status: 400 }
      );
    }
  }

  // slug estable y único
  let slug = slugify(title);
  for (let i = 2; ; i++) {
    const taken = await prisma.newsPost.findUnique({ where: { slug }, select: { id: true } });
    if (!taken) break;
    slug = `${slugify(title)}-${i}`.slice(0, 90);
  }

  const created = await prisma.newsPost.create({
    data: {
      slug,
      title: title.slice(0, 160),
      excerpt: plainText(content).slice(0, 280) || null,
      content,
      category,
      imageFile,
      status: statusRaw as "BORRADOR" | "PUBLICADA",
      publishedAt: new Date(publishDate + "T12:00:00"),
      authorId: session.user.id,
      authorName: session.user.name || "Dirección",
    },
    select: selectNews,
  });
  // Avisos publicados: correo a cada cuenta registrada con email.
  let avisados = 0;
  if (category === "Avisos" && statusRaw === "PUBLICADA") {
    try {
      const users = await prisma.user.findMany({
        where: { active: true, email: { not: null } },
        select: { email: true },
        take: 400,
      });
      avisados = await enviarCorreo(
        users.map((u: { email: string | null }) => u.email as string),
        `Aviso: ${title.slice(0, 120)}`,
        `${title}\n\n${plainText(content, 500)}\n\n— Dirección`
      );
    } catch (e) {
      console.error("MAIL avisos", e);
    }
  }
  return NextResponse.json({ data: { ...created, avisados } }, { status: 201 });
}
