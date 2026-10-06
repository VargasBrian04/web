import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";

/**
 * Encuestas. GET público (activas + mi voto + conteo).
 * POST voto { pollId, optionIdx } (con sesión, un voto por usuario).
 * POST admin { question, options[] } · PATCH admin { id, active }.
 */
export async function GET(request: Request) {
  const session = await auth();
  try {
    const polls = await prisma.poll.findMany({
      where: { active: true },
      select: {
        id: true, question: true, options: true, createdAt: true,
        votes: { select: { optionIdx: true, userId: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    const data = polls.map((p: { id: string; question: string; options: unknown; votes: { optionIdx: number; userId: string }[] }) => {
      const opts = p.options as string[];
      const counts = opts.map((_, i) => p.votes.filter((v: { optionIdx: number }) => v.optionIdx === i).length);
      const mine = session?.user
        ? p.votes.find((v: { userId: string }) => v.userId === session.user.id)?.optionIdx ?? null
        : null;
      return { id: p.id, question: p.question, options: opts, counts, total: p.votes.length, miVoto: mine };
    });
    void request;
    return NextResponse.json({ data, login: !!session?.user });
  } catch (e) {
    console.error("GET /api/encuestas", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const body = ((await request.json().catch(() => null)) ?? {}) as Record<string, unknown>;

  // Crear (ADMIN)
  if (Array.isArray(body.options)) {
    if (session.user.role !== "ADMIN")
      return NextResponse.json({ error: "Solo Dirección" }, { status: 403 });
    const question = String(body.question ?? "").trim();
    const options = (body.options as unknown[]).map((o) => String(o).trim()).filter(Boolean).slice(0, 8);
    if (!question || options.length < 2)
      return NextResponse.json({ error: "Pregunta + 2 opciones mínimo" }, { status: 400 });
    const created = await prisma.poll.create({
      data: { question: question.slice(0, 280), options, createdBy: session.user.id },
    });
    await audit(session.user, "ENCUESTA", question);
    return NextResponse.json({ data: created }, { status: 201 });
  }

  // Votar
  const pollId = String(body.pollId ?? "");
  const optionIdx = Number(body.optionIdx);
  if (!pollId || !Number.isInteger(optionIdx))
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  const poll = await prisma.poll.findUnique({ where: { id: pollId }, select: { options: true, active: true } });
  if (!poll || !poll.active) return NextResponse.json({ error: "Encuesta no disponible" }, { status: 404 });
  if (optionIdx < 0 || optionIdx >= (poll.options as string[]).length)
    return NextResponse.json({ error: "Opción inválida" }, { status: 400 });
  try {
    await prisma.vote.create({ data: { pollId, userId: session.user.id, optionIdx } });
  } catch {
    return NextResponse.json({ error: "Ya votaste en esta encuesta" }, { status: 409 });
  }
  return NextResponse.json({ data: { pollId, optionIdx } }, { status: 201 });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Solo Dirección" }, { status: 403 });
  const { id, active } = ((await request.json().catch(() => null)) ?? {}) as {
    id?: string; active?: boolean;
  };
  if (!id || typeof active !== "boolean")
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  const updated = await prisma.poll.update({ where: { id }, data: { active } });
  await audit(session.user, active ? "ENCUESTA_ON" : "ENCUESTA_OFF", id);
  return NextResponse.json({ data: { id: updated.id, active: updated.active } });
}
