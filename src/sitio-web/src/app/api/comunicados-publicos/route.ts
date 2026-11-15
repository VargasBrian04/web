import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { sanitizeHtml, plainText, slugify } from "@/lib/news";

const CATEGORIAS = ["Comunicado", "Inscripciones", "Secretaría", "Institucional"] as const;
const MAX_ADJUNTOS = 5;

/** Solo rutas internas o http(s): evita enlaces peligrosos. */
function enlaceSeguro(v: unknown): string | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  if (s.startsWith("/") && !s.startsWith("//")) return s.slice(0, 300);
  if (/^https?:\/\//i.test(s)) return s.slice(0, 300);
  return null;
}

type Adjunto = { name: string; mime: string; size: number; data: string };

/** Tamaño real del archivo cuando llega como data URI base64. */
function bytesDeDataUri(data: string): number {
  const base64 = data.slice(data.indexOf(",") + 1);
  return Buffer.from(base64, "base64").length;
}

/**
 * Comunicados públicos. GET público (activos y publicados) · ?all=1 solo ADMIN.
 * POST crea (ADMIN) · PATCH edita (ADMIN) · DELETE borra (ADMIN).
 */
export async function GET(request: Request) {
  const session = await auth();
  const { searchParams } = new URL(request.url);
  if (searchParams.get("all") === "1") {
    if (session?.user?.role !== "ADMIN")
      return NextResponse.json({ error: "Solo Dirección" }, { status: 403 });
    try {
      const data = await prisma.publicNotice.findMany({
        orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
        take: 200,
        include: { files: { select: { id: true, name: true, mime: true, size: true } } },
      });
      return NextResponse.json({ data });
    } catch (e) {
      console.error("GET /api/comunicados-publicos?all=1", e);
      return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
  }

  try {
    const data = await prisma.publicNotice.findMany({
      where: { active: true, publishedAt: { not: null } },
      orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }],
      take: 30,
      select: {
        id: true, title: true, slug: true, summary: true, body: true,
        category: true, pinned: true, publishedAt: true,
        files: { select: { id: true, name: true, mime: true, size: true } },
      },
    });
    return NextResponse.json(
      {
        data: data.map((n) => ({
          id: n.id,
          title: n.title,
          slug: n.slug,
          summary: n.summary || plainText(n.body, 160),
          category: n.category,
          pinned: n.pinned,
          date: n.publishedAt,
          files: n.files.map((f) => ({ id: f.id, name: f.name, mime: f.mime, size: f.size })),
        })),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    console.error("GET /api/comunicados-publicos", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

/** Valida y decodifica los adjuntos del cuerpo. */
function adjuntos(body: Record<string, unknown>): { ok: true; files: Adjunto[] } | { ok: false; error: string } {
  const raw = Array.isArray(body.files) ? body.files : [];
  if (raw.length > MAX_ADJUNTOS)
    return { ok: false, error: `Máximo ${MAX_ADJUNTOS} adjuntos por comunicado` };
  const files: Adjunto[] = [];
  for (const f of raw) {
    if (!f || typeof f !== "object") continue;
    const name = String((f as Record<string, unknown>).name ?? "")
      .trim()
      .replace(/[\\/:*?"<>|]/g, "");
    const mime = String((f as Record<string, unknown>).mime ?? "");
    const data = String((f as Record<string, unknown>).data ?? "");
    if (!name || !data) return { ok: false, error: "Adjunto sin nombre o sin contenido" };
    // tipo y tamaño: solo PDF/JPG/PNG, máx 10 MB (mismo límite del resto del sistema)
    if (!/^data:(application\/pdf|image\/jpeg|image\/png);base64,/.test(data))
      return { ok: false, error: `Archivo no permitido: ${name} (solo PDF, JPG o PNG)` };
    if (bytesDeDataUri(data) > 10 * 1024 * 1024)
      return { ok: false, error: `Archivo muy pesado: ${name} (máx 10 MB)` };
    files.push({ name: name.slice(0, 120), mime, size: bytesDeDataUri(data), data });
  }
  return { ok: true, files };
}

function fechaDePublicacion(v: unknown): Date | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Solo Dirección" }, { status: 403 });

  const body = ((await request.json().catch(() => null)) ?? {}) as Record<string, unknown>;
  const title = String(body.title ?? "").trim();
  if (!title) return NextResponse.json({ error: "Falta el título" }, { status: 400 });
  const contenido = sanitizeHtml(String(body.body ?? "").trim());
  if (!contenido) return NextResponse.json({ error: "Falta el contenido" }, { status: 400 });

  const cat = String(body.category ?? "").trim();
  if (cat && !(CATEGORIAS as readonly string[]).includes(cat))
    return NextResponse.json({ error: `Categoría no válida (${CATEGORIAS.join(", ")})` }, { status: 400 });

  const adj = adjuntos(body);
  if (!adj.ok) return NextResponse.json({ error: adj.error }, { status: 400 });

  const publicar = body.publish !== false;
  try {
    const slug = `${slugify(title)}-${Math.random().toString(36).slice(2, 8)}`;
    const created = await prisma.publicNotice.create({
      data: {
        title: title.slice(0, 180),
        slug,
        summary: String(body.summary ?? "").trim().slice(0, 240) || null,
        body: contenido,
        category: (CATEGORIAS as readonly string[]).includes(cat) ? cat : "Comunicado",
        pinned: Boolean(body.pinned),
        active: body.active === undefined ? true : Boolean(body.active),
        publishedAt: publicar ? new Date() : null,
        createdBy: session.user.id,
        createdByName: session.user.name || null,
        files: adj.files.length ? { create: adj.files } : undefined,
      },
      include: { files: { select: { id: true, name: true, mime: true, size: true } } },
    });
    await audit(session.user, "COMUNICADO", title.slice(0, 80));
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (e) {
    console.error("POST /api/comunicados-publicos", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Solo Dirección" }, { status: 403 });

  const body = ((await request.json().catch(() => null)) ?? {}) as Record<string, unknown>;
  const id = String(body.id ?? "").trim();
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (body.title !== undefined) {
    const title = String(body.title).trim();
    if (!title) return NextResponse.json({ error: "El título no puede quedar vacío" }, { status: 400 });
    data.title = title.slice(0, 180);
  }
  if (body.summary !== undefined) data.summary = String(body.summary).trim().slice(0, 240) || null;
  if (body.body !== undefined) {
    const contenido = sanitizeHtml(String(body.body).trim());
    if (!contenido) return NextResponse.json({ error: "El contenido no puede quedar vacío" }, { status: 400 });
    data.body = contenido;
  }
  if (body.category !== undefined) {
    const cat = String(body.category).trim();
    if (!(CATEGORIAS as readonly string[]).includes(cat))
      return NextResponse.json({ error: "Categoría no válida" }, { status: 400 });
    data.category = cat;
  }
  if (body.pinned !== undefined) data.pinned = Boolean(body.pinned);
  if (body.active !== undefined) data.active = Boolean(body.active);
  if (body.publish === true) data.publishedAt = new Date();
  if (body.unpublish === true) data.publishedAt = null;

  if (Object.keys(data).length === 0 && body.files === undefined)
    return NextResponse.json({ error: "Nada para actualizar" }, { status: 400 });

  try {
    if (body.files !== undefined) {
      const adj = adjuntos(body);
      if (!adj.ok) return NextResponse.json({ error: adj.error }, { status: 400 });
      await prisma.$transaction([
        prisma.publicNoticeFile.deleteMany({ where: { noticeId: id } }),
        ...(adj.files.length
          ? [prisma.publicNoticeFile.createMany({ data: adj.files.map((f) => ({ ...f, noticeId: id })) })]
          : []),
      ]);
    }
    const updated = await prisma.publicNotice.update({
      where: { id },
      data,
      include: { files: { select: { id: true, name: true, mime: true, size: true } } },
    });
    await audit(session.user, "COMUNICADO_EDIT", id);
    return NextResponse.json({ data: updated });
  } catch (e) {
    console.error("PATCH /api/comunicados-publicos", e);
    return NextResponse.json({ error: "No se pudo actualizar el comunicado" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Solo Dirección" }, { status: 403 });

  const id = new URL(request.url).searchParams.get("id") || "";
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });
  try {
    await prisma.publicNotice.delete({ where: { id } });
    await audit(session.user, "COMUNICADO_DEL", id);
    return NextResponse.json({ data: { id } });
  } catch (e) {
    console.error("DELETE /api/comunicados-publicos", e);
    return NextResponse.json({ error: "Aviso inexistente" }, { status: 404 });
  }
}