import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * GET /api/contenido — público. Textos editables del sitio
 * (historia, mision, vision...). Lo que no existe usa el texto fijo.
 * PUT /api/contenido — solo ADMIN { key, title?, body }.
 */
const KEYS = ["historia", "mision", "vision"] as const;

export async function GET() {
  try {
    const rows = await prisma.siteContent.findMany({
      where: { key: { in: [...KEYS] } },
      select: { key: true, title: true, body: true, updatedAt: true },
    });
    return NextResponse.json({ data: rows });
  } catch (e) {
    console.error("GET /api/contenido", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Solo Dirección" }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const key = typeof body.key === "string" ? body.key.trim().toLowerCase() : "";
  const content = typeof body.body === "string" ? body.body.trim() : "";
  const title = typeof body.title === "string" ? body.title.trim().slice(0, 160) : null;
  if (!(KEYS as readonly string[]).includes(key))
    return NextResponse.json({ error: "Zona inválida (historia, mision, vision)" }, { status: 400 });
  if (content.length < 10 || content.length > 20000)
    return NextResponse.json({ error: "Texto de 10 a 20000 caracteres" }, { status: 400 });

  const saved = await prisma.siteContent.upsert({
    where: { key },
    update: { body: content, title, updatedBy: session.user.id },
    create: { key, body: content, title, updatedBy: session.user.id },
    select: { key: true, title: true, body: true, updatedAt: true },
  });
  return NextResponse.json({ data: saved });
}
