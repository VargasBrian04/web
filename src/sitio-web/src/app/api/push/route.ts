import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * Suscripciones push del navegador.
 * POST /api/push { endpoint, p256dh, auth } — guarda la mía.
 * DELETE /api/push — borra las mías (desactivar avisos).
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const body = ((await request.json().catch(() => null)) ?? {}) as {
    endpoint?: string; p256dh?: string; auth?: string;
  };
  if (!body.endpoint || !body.p256dh || !body.auth)
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  await prisma.pushSubscription.upsert({
    where: { endpoint: body.endpoint.slice(0, 500) },
    update: { userId: session.user.id, p256dh: body.p256dh, auth: body.auth },
    create: {
      userId: session.user.id,
      endpoint: body.endpoint.slice(0, 500),
      p256dh: body.p256dh,
      auth: body.auth,
    },
  });
  return NextResponse.json({ data: { ok: true } }, { status: 201 });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  await prisma.pushSubscription.deleteMany({ where: { userId: session.user.id } });
  return NextResponse.json({ data: { ok: true } });
}
