import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NEWS_IMAGE_MIME, saveBuffer, removeFile } from "@/lib/storage";

/** Slots válidos: galería general + orientaciones de la portada. */
const SLOTS = [
  "GALERIA",
  "cb", "cs", "bts", "bti", "btc", "adn", "bte", "btm", "btcc", "bta",
  "eeb7", "eeb8", "eeb9",
];

/**
 * GET /api/media — público. Fotos subidas por Dirección (?slot=).
 * La portada las mezcla con su material fijo.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slot = searchParams.get("slot") || undefined;
  try {
    const data = await prisma.galleryItem.findMany({
      where: { ...(slot ? { slot } : {}) },
      select: { id: true, slot: true, category: true, caption: true, imageFile: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json({
      data: data.map((g: { id: string; slot: string; category: string | null; caption: string | null; createdAt: Date }) => ({ ...g, url: `/api/media/${g.id}/image` })),
    });
  } catch (e) {
    console.error("GET /api/media", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

/**
 * POST /api/media — solo ADMIN. multipart: image*, slot*, category?, caption?.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Solo Dirección" }, { status: 403 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Formulario inválido (multipart)" }, { status: 400 });
  }
  const slot = String(form.get("slot") || "").trim();
  const category = String(form.get("category") || "").trim().slice(0, 60) || null;
  const caption = String(form.get("caption") || "").trim().slice(0, 160) || null;
  const file = form.get("image");
  if (!SLOTS.includes(slot)) return NextResponse.json({ error: "Zona inválida" }, { status: 400 });
  if (!(file instanceof File) || file.size === 0)
    return NextResponse.json({ error: "Elegí una imagen" }, { status: 400 });

  try {
    const saved = await saveBuffer(
      Buffer.from(await file.arrayBuffer()), file.type, NEWS_IMAGE_MIME, "PNG/JPG/WEBP"
    );
    const created = await prisma.galleryItem.create({
      data: { slot, category, caption, imageFile: saved.fileName, createdBy: session.user.id },
      select: { id: true, slot: true, category: true, caption: true, createdAt: true },
    });
    return NextResponse.json(
      { data: { ...created, url: `/api/media/${created.id}/image` } },
      { status: 201 }
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Imagen inválida" },
      { status: 400 }
    );
  }
}

/** DELETE /api/media?id= — solo ADMIN (borra registro y archivo). */
export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Solo Dirección" }, { status: 403 });

  const id = new URL(request.url).searchParams.get("id") || "";
  const found = await prisma.galleryItem.findUnique({ where: { id }, select: { imageFile: true } });
  if (!found) return NextResponse.json({ error: "Foto inexistente" }, { status: 404 });
  await prisma.galleryItem.delete({ where: { id } });
  await removeFile(found.imageFile);
  return NextResponse.json({ data: { id } });
}
