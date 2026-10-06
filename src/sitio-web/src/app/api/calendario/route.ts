import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";

/**
 * Calendario académico (público GET). POST/PATCH/DELETE solo ADMIN.
 * Body: { date (yyyy-mm-dd), title, body? }.
 */
export async function GET() {
  try {
    const data = await prisma.calendarEvent.findMany({
      where: { active: true },
      orderBy: [{ date: "asc" }],
      take: 100,
    });
    return NextResponse.json({ data });
  } catch (e) {
    console.error("GET /api/calendario", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

function onlyAdmin(session: { user?: { role?: string } } | null) {
  return !!session?.user && session.user.role === "ADMIN";
}

export async function POST(request: Request) {
  const session = await auth();
  if (!onlyAdmin(session)) return NextResponse.json({ error: "Solo Dirección" }, { status: 403 });
  const body = ((await request.json().catch(() => null)) ?? {}) as Record<string, unknown>;
  const date = String(body.date ?? "").trim();
  const title = String(body.title ?? "").trim();
  const content = String(body.body ?? "").trim() || null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date)) || !title)
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  const created = await prisma.calendarEvent.create({
    data: { date: new Date(date + "T12:00:00"), title: title.slice(0, 160), body: content?.slice(0, 2000) ?? null },
  });
  await audit(session!.user, "CALENDARIO", title);
  return NextResponse.json({ data: created }, { status: 201 });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!onlyAdmin(session)) return NextResponse.json({ error: "Solo Dirección" }, { status: 403 });
  const body = ((await request.json().catch(() => null)) ?? {}) as {
    id?: string; date?: string; title?: string; body?: string; active?: boolean;
  };
  if (!body.id) return NextResponse.json({ error: "Falta id" }, { status: 400 });
  const data: Record<string, unknown> = {};
  if (typeof body.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.date))
    data.date = new Date(body.date + "T12:00:00");
  if (typeof body.title === "string") data.title = body.title.trim().slice(0, 160);
  if (typeof body.body === "string") data.body = body.body.trim().slice(0, 2000) || null;
  if (typeof body.active === "boolean") data.active = body.active;
  const updated = await prisma.calendarEvent.update({ where: { id: body.id }, data });
  await audit(session!.user, "CALENDARIO_EDIT", body.id);
  return NextResponse.json({ data: updated });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!onlyAdmin(session)) return NextResponse.json({ error: "Solo Dirección" }, { status: 403 });
  const id = new URL(request.url).searchParams.get("id") || "";
  await prisma.calendarEvent.delete({ where: { id } });
  await audit(session!.user, "CALENDARIO_DEL", id);
  return NextResponse.json({ data: { id } });
}
