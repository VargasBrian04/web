import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";

const NIVELES = ["INFO", "AVISO", "URGENTE"] as const;
type Nivel = (typeof NIVELES)[number];

/** Solo rutas internas o http(s): evita enlaces raros cargados por error. */
function enlaceSeguro(v: unknown): string | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  if (s.startsWith("/") && !s.startsWith("//")) return s.slice(0, 300);
  if (/^https?:\/\//i.test(s)) return s.slice(0, 300);
  return null;
}

/**
 * Fecha de vigencia en hora de Paraguay. Si llega "yyyy-mm-dd" se toma el
 * inicio o el final del día; si llega ISO completo se usa tal cual.
 */
function fechaVigencia(v: unknown, finDeDia: boolean): Date | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return new Date(`${s}T${finDeDia ? "23:59:59" : "00:00:00"}-03:00`);
  }
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function nivelValido(v: unknown): Nivel {
  const s = String(v ?? "").toUpperCase();
  return (NIVELES as readonly string[]).includes(s) ? (s as Nivel) : "INFO";
}

/**
 * Banner de avisos del sitio.
 * GET público (activas y vigentes) · ?all=1 solo ADMIN (todas).
 * POST/PATCH/DELETE solo ADMIN.
 */
export async function GET(request: Request) {
  const session = await auth();
  const { searchParams } = new URL(request.url);
  if (searchParams.get("all") === "1") {
    if (session?.user?.role !== "ADMIN")
      return NextResponse.json({ error: "Solo Dirección" }, { status: 403 });
    try {
      const data = await prisma.siteAlert.findMany({
        orderBy: [{ createdAt: "desc" }],
        take: 100,
      });
      return NextResponse.json({ data });
    } catch (e) {
      console.error("GET /api/alertas?all=1", e);
      return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
  }

  const ahora = new Date();
  try {
    const data = await prisma.siteAlert.findMany({
      where: {
        active: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: ahora } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: ahora } }] },
        ],
      },
      orderBy: [{ createdAt: "desc" }],
      take: 3,
      select: { id: true, message: true, level: true, link: true, linkLabel: true },
    });
    return NextResponse.json(
      { data },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    console.error("GET /api/alertas", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Solo Dirección" }, { status: 403 });

  const body = ((await request.json().catch(() => null)) ?? {}) as Record<string, unknown>;
  const message = String(body.message ?? "").trim();
  if (!message) return NextResponse.json({ error: "Escribí el mensaje del aviso" }, { status: 400 });

  const startsAt = fechaVigencia(body.startsAt, false);
  const endsAt = fechaVigencia(body.endsAt, true);
  if (startsAt && endsAt && endsAt < startsAt)
    return NextResponse.json({ error: "La fecha de fin es anterior al inicio" }, { status: 400 });

  try {
    const created = await prisma.siteAlert.create({
      data: {
        message: message.slice(0, 280),
        level: nivelValido(body.level),
        link: enlaceSeguro(body.link),
        linkLabel: enlaceSeguro(body.link) ? String(body.linkLabel ?? "").trim().slice(0, 40) || null : null,
        active: body.active === undefined ? true : Boolean(body.active),
        startsAt,
        endsAt,
        createdBy: session.user.id,
      },
    });
    await audit(session.user, "AVISO_SITE", created.message.slice(0, 80));
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (e) {
    console.error("POST /api/alertas", e);
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
  if (body.message !== undefined) {
    const message = String(body.message).trim();
    if (!message) return NextResponse.json({ error: "El mensaje no puede quedar vacío" }, { status: 400 });
    data.message = message.slice(0, 280);
  }
  if (body.level !== undefined) data.level = nivelValido(body.level);
  if (body.link !== undefined) data.link = enlaceSeguro(body.link);
  if (body.linkLabel !== undefined) data.linkLabel = String(body.linkLabel).trim().slice(0, 40) || null;
  if (body.active !== undefined) data.active = Boolean(body.active);
  if (body.startsAt !== undefined) data.startsAt = fechaVigencia(body.startsAt, false);
  if (body.endsAt !== undefined) data.endsAt = fechaVigencia(body.endsAt, true);
  if (Object.keys(data).length === 0)
    return NextResponse.json({ error: "Nada para actualizar" }, { status: 400 });

  try {
    const updated = await prisma.siteAlert.update({ where: { id }, data });
    await audit(session.user, updated.active ? "AVISO_EDIT" : "AVISO_OFF", id);
    return NextResponse.json({ data: updated });
  } catch (e) {
    console.error("PATCH /api/alertas", e);
    return NextResponse.json({ error: "No se pudo actualizar el aviso" }, { status: 404 });
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
    await prisma.siteAlert.delete({ where: { id } });
    await audit(session.user, "AVISO_DEL", id);
    return NextResponse.json({ data: { id } });
  } catch (e) {
    console.error("DELETE /api/alertas", e);
    return NextResponse.json({ error: "Aviso inexistente" }, { status: 404 });
  }
}
