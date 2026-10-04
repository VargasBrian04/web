import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EMAIL_RE } from "@/lib/users";

/**
 * GET /api/profile — datos propios (sin hash).
 * PATCH /api/profile — vincular correo/teléfono y cambiar contraseña.
 *   Body: { email?, phone?, newPassword?, currentPassword? }.
 *   Para cambiar la contraseña se exige la actual.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      username: true,
      ci: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      createdAt: true,
    },
  });
  if (!user)
    return NextResponse.json({ error: "Cuenta inexistente" }, { status: 404 });
  return NextResponse.json({ data: user });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = (await request.json()) as {
    email?: string | null;
    phone?: string | null;
    currentPassword?: string;
    newPassword?: string;
  };
  const data: Record<string, unknown> = {};

  if (typeof body.email !== "undefined") {
    const em = body.email?.trim().toLowerCase() || null;
    if (em && !EMAIL_RE.test(em))
      return NextResponse.json({ error: "Correo inválido" }, { status: 400 });
    if (em) {
      const taken = await prisma.user.findFirst({
        where: { email: em, id: { not: session.user.id } },
        select: { id: true },
      });
      if (taken)
        return NextResponse.json(
          { error: "Ese correo ya está vinculado a otra cuenta" },
          { status: 409 }
        );
    }
    data.email = em;
  }
  if (typeof body.phone !== "undefined")
    data.phone = body.phone?.trim().slice(0, 30) || null;

  if (body.newPassword) {
    if (!body.currentPassword)
      return NextResponse.json(
        { error: "Confirmá tu contraseña actual" },
        { status: 400 }
      );
    if (body.newPassword.length < 8)
      return NextResponse.json(
        { error: "La nueva contraseña debe tener 8+ caracteres" },
        { status: 400 }
      );
    const me = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    });
    if (!me)
      return NextResponse.json({ error: "Cuenta inexistente" }, { status: 404 });
    const ok = await bcrypt.compare(body.currentPassword, me.passwordHash);
    if (!ok)
      return NextResponse.json(
        { error: "Tu contraseña actual no coincide" },
        { status: 403 }
      );
    data.passwordHash = await bcrypt.hash(body.newPassword, 10);
  }

  if (!Object.keys(data).length)
    return NextResponse.json({ error: "Nada para actualizar" }, { status: 400 });

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data,
    select: {
      id: true,
      username: true,
      ci: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
    },
  });
  return NextResponse.json({ data: updated });
}
