import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";

function soloAdmin(session: { user?: { role?: string } } | null) {
  return !!session?.user && session.user.role === "ADMIN";
}

function texto(v: unknown, max: number): string | null {
  const s = String(v ?? "").trim();
  return s ? s.slice(0, max) : null;
}

/** Valida formato de teléfono paraguayo: dígitos, espacios, guiones y +. */
function telefonoValido(v: unknown): boolean {
  const s = String(v ?? "").trim();
  return /^[+\d][\d\s-]{5,20}$/.test(s);
}

function correoValido(v: unknown): boolean {
  const s = String(v ?? "").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
}

/**
 * Directorio de contacto público. GET público (áreas activas).
 * POST crea (ADMIN) · PATCH edita (ADMIN) · DELETE borra (ADMIN).
 */
export async function GET() {
  try {
    const data = await prisma.contactArea.findMany({
      where: { active: true },
      orderBy: [{ order: "asc" }, { name: "asc" }],
      take: 30,
    });
    return NextResponse.json({ data }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("GET /api/directorio", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (!soloAdmin(session)) return NextResponse.json({ error: "Solo Dirección" }, { status: 403 });

  const body = ((await request.json().catch(() => null)) ?? {}) as Record<string, unknown>;
  const name = String(body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Falta el nombre del área" }, { status: 400 });

  const phone = texto(body.phone, 30);
  if (phone && !telefonoValido(phone))
    return NextResponse.json({ error: "Teléfono inválido (usá números, espacios o guion)" }, { status: 400 });
  const email = texto(body.email, 120);
  if (email && !correoValido(email))
    return NextResponse.json({ error: "Correo inválido" }, { status: 400 });

  try {
    const created = await prisma.contactArea.create({
      data: {
        name: name.slice(0, 80),
        detail: texto(body.detail, 200),
        phone,
        email,
        hours: texto(body.hours, 120),
        order: Number.isFinite(Number(body.order)) ? Number(body.order) : 0,
        active: body.active === undefined ? true : Boolean(body.active),
      },
    });
    await audit(session.user, "DIRECTORIO", created.name);
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (e) {
    console.error("POST /api/directorio", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (!soloAdmin(session)) return NextResponse.json({ error: "Solo Dirección" }, { status: 403 });

  const body = ((await request.json().catch(() => null)) ?? {}) as Record<string, unknown>;
  const id = String(body.id ?? "").trim();
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) return NextResponse.json({ error: "El nombre no puede quedar vacío" }, { status: 400 });
    data.name = name.slice(0, 80);
  }
  if (body.phone !== undefined) {
    const phone = texto(body.phone, 30);
    if (phone && !telefonoValido(phone))
      return NextResponse.json({ error: "Teléfono inválido" }, { status: 400 });
    data.phone = phone;
  }
  if (body.email !== undefined) {
    const email = texto(body.email, 120);
    if (email && !correoValido(email))
      return NextResponse.json({ error: "Correo inválido" }, { status: 400 });
    data.email = email;
  }
  if (body.detail !== undefined) data.detail = texto(body.detail, 200);
  if (body.hours !== undefined) data.hours = texto(body.hours, 120);
  if (body.active !== undefined) data.active = Boolean(body.active);
  if (body.order !== undefined && Number.isFinite(Number(body.order))) data.order = Number(body.order);

  if (Object.keys(data).length === 0)
    return NextResponse.json({ error: "Nada para actualizar" }, { status: 400 });

  try {
    const updated = await prisma.contactArea.update({ where: { id }, data });
    await audit(session.user, "DIRECTORIO_EDIT", id);
    return NextResponse.json({ data: updated });
  } catch (e) {
    console.error("PATCH /api/directorio", e);
    return NextResponse.json({ error: "No se pudo actualizar el área" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (!soloAdmin(session)) return NextResponse.json({ error: "Solo Dirección" }, { status: 403 });

  const id = new URL(request.url).searchParams.get("id") || "";
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });
  try {
    await prisma.contactArea.delete({ where: { id } });
    await audit(session.user, "DIRECTORIO_DEL", id);
    return NextResponse.json({ data: { id } });
  } catch (e) {
    console.error("DELETE /api/directorio", e);
    return NextResponse.json({ error: "Área inexistente" }, { status: 404 });
  }
}