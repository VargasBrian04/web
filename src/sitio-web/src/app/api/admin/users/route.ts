import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  CI_RE,
  EMAIL_RE,
  USERNAME_RE,
  normalizeUsername,
} from "@/lib/users";

const CREATABLE_ROLES = ["ADMIN", "TEACHER", "PARENT", "STUDENT"] as const;

const publicSelect = {
  id: true,
  username: true,
  ci: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  role: true,
  active: true,
  createdAt: true,
};

/**
 * GET /api/admin/users — Solo ADMIN. Lista usuarios (?q=&role=).
 * POST /api/admin/users — Solo ADMIN. Crea docente/tutor/admin/alumno.
 *   Body: { username, firstName, lastName, ci, password, role,
 *           email?, phone? } — el correo es opcional (se vincula después).
 * PATCH /api/admin/users — Solo ADMIN. { id, active?, password?, email?, phone? }
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.user.role !== "ADMIN")
    return NextResponse.json(
      { error: "Solo Secretaría/Dirección" },
      { status: 403 }
    );

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim().toLowerCase();
  const role = searchParams.get("role") || undefined;

  const data = await prisma.user.findMany({
    where: {
      ...(role ? { role: role as (typeof CREATABLE_ROLES)[number] } : {}),
      ...(q
        ? {
            OR: [
              { username: { contains: q, mode: "insensitive" } },
              { firstName: { contains: q, mode: "insensitive" } },
              { lastName: { contains: q, mode: "insensitive" } },
              { ci: { contains: q } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: publicSelect,
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.user.role !== "ADMIN")
    return NextResponse.json(
      { error: "Solo Secretaría/Dirección" },
      { status: 403 }
    );

  const body = (await request.json()) as {
    username?: string;
    firstName?: string;
    lastName?: string;
    ci?: string;
    password?: string;
    role?: string;
    email?: string | null;
    phone?: string | null;
  };
  const username = normalizeUsername(body.username);
  const email = body.email?.trim().toLowerCase() || null;

  if (!USERNAME_RE.test(username))
    return NextResponse.json(
      { error: "Usuario inválido (3-30: letras, números, . _ -)" },
      { status: 400 }
    );
  if (!body.firstName?.trim() || !body.lastName?.trim())
    return NextResponse.json(
      { error: "Nombres y apellidos obligatorios" },
      { status: 400 }
    );
  if (!body.ci || !CI_RE.test(body.ci.trim()))
    return NextResponse.json(
      { error: "Cédula inválida (6 a 10 dígitos)" },
      { status: 400 }
    );
  if (!body.password || body.password.length < 8)
    return NextResponse.json(
      { error: "Contraseña inicial mínima de 8 caracteres" },
      { status: 400 }
    );
  if (!body.role || !(CREATABLE_ROLES as readonly string[]).includes(body.role))
    return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
  if (email && !EMAIL_RE.test(email))
    return NextResponse.json({ error: "Correo inválido" }, { status: 400 });

  const clash = await prisma.user.findFirst({
    where: {
      OR: [
        { username },
        { ci: body.ci.trim() },
        ...(email ? [{ email }] : []),
      ],
    },
    select: { username: true, ci: true, email: true },
  });
  if (clash)
    return NextResponse.json(
      {
        error:
          clash.username === username
            ? "Ese usuario ya existe"
            : clash.ci === body.ci.trim()
              ? "Esa cédula ya está registrada"
              : "Ese correo ya está vinculado",
      },
      { status: 409 }
    );

  const passwordHash = await bcrypt.hash(body.password, 10);
  const user = await prisma.user.create({
    data: {
      username,
      ci: body.ci.trim(),
      email,
      passwordHash,
      firstName: body.firstName.trim(),
      lastName: body.lastName.trim(),
      phone: body.phone?.trim() || null,
      role: body.role as (typeof CREATABLE_ROLES)[number],
      ...(body.role === "TEACHER"
        ? { teacherProfile: { create: {} } }
        : {}),
      ...(body.role === "PARENT" ? { guardianProfile: { create: {} } } : {}),
      ...(body.role === "STUDENT" ? { studentProfile: { create: {} } } : {}),
    },
    select: publicSelect,
  });
  return NextResponse.json({ data: user }, { status: 201 });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.user.role !== "ADMIN")
    return NextResponse.json(
      { error: "Solo Secretaría/Dirección" },
      { status: 403 }
    );

  const body = (await request.json()) as {
    id?: string;
    active?: boolean;
    password?: string;
    email?: string | null;
    phone?: string | null;
  };
  if (!body.id)
    return NextResponse.json({ error: "Falta id" }, { status: 400 });
  const target = await prisma.user.findUnique({ where: { id: body.id } });
  if (!target)
    return NextResponse.json({ error: "Usuario inexistente" }, { status: 404 });
  // No auto-bloquearse: el último admin activo no puede desactivarse a sí mismo.
  if (
    target.id === session.user.id &&
    body.active === false &&
    target.role === "ADMIN"
  ) {
    const others = await prisma.user.count({
      where: { role: "ADMIN", active: true, id: { not: target.id } },
    });
    if (others === 0)
      return NextResponse.json(
        { error: "No podés desactivar tu cuenta: sos el único admin activo" },
        { status: 400 }
      );
  }

  const data: Record<string, unknown> = {};
  if (typeof body.active === "boolean") data.active = body.active;
  if (typeof body.phone !== "undefined")
    data.phone = body.phone?.trim() || null;
  if (typeof body.email !== "undefined") {
    const em = body.email?.trim().toLowerCase() || null;
    if (em && !EMAIL_RE.test(em))
      return NextResponse.json({ error: "Correo inválido" }, { status: 400 });
    if (em) {
      const taken = await prisma.user.findFirst({
        where: { email: em, id: { not: body.id } },
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
  if (body.password) {
    if (body.password.length < 8)
      return NextResponse.json(
        { error: "Contraseña mínima de 8 caracteres" },
        { status: 400 }
      );
    data.passwordHash = await bcrypt.hash(body.password, 10);
  }
  if (!Object.keys(data).length)
    return NextResponse.json(
      { error: "Nada para actualizar" },
      { status: 400 }
    );

  const updated = await prisma.user.update({
    where: { id: body.id },
    data,
    select: publicSelect,
  });
  return NextResponse.json({ data: updated });
}

/**
 * DELETE /api/admin/users — Solo ADMIN. { id }.
 * Borrado definitivo con verificación en pantalla (escribir el usuario).
 * Reglas:
 *  - las cuentas de Dirección NUNCA se borran (ni la propia ni otras);
 *  - el historial del resto se elimina en cascada dentro de una
 *    transacción: sus fotos, tareas (con entregas), vínculos y fichas;
 *    las notas/asistencias que cargó a alumnos quedan sin autor;
 *    el historial del alumno eliminado se borra con él.
 */
export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.user.role !== "ADMIN")
    return NextResponse.json(
      { error: "Solo Secretaría/Dirección" },
      { status: 403 }
    );

  const body = (await request.json().catch(() => null)) as { id?: string; confirm?: string } | null;
  if (!body?.id)
    return NextResponse.json({ error: "Falta id" }, { status: 400 });
  const target = await prisma.user.findUnique({
    where: { id: body.id },
    select: { id: true, username: true, role: true, active: true },
  });
  if (!target)
    return NextResponse.json({ error: "Usuario inexistente" }, { status: 404 });
  if (target.role === "ADMIN")
    return NextResponse.json({ error: "Las cuentas de Dirección no se borran" }, { status: 403 });
  if (target.id === session.user.id)
    return NextResponse.json({ error: "No podés eliminar tu propia cuenta" }, { status: 400 });
  // Verificación: hay que reescribir el nombre de usuario.
  if ((body.confirm || "").trim().toLowerCase() !== target.username.toLowerCase())
    return NextResponse.json({ error: "Escribí el usuario exacto para confirmar" }, { status: 400 });

  const teacher = await prisma.teacher.findUnique({
    where: { userId: target.id },
    select: { id: true },
  });
  const student = await prisma.student.findUnique({
    where: { userId: target.id },
    select: { id: true },
  });
  const guardian = await prisma.guardian.findUnique({
    where: { userId: target.id },
    select: { id: true },
  });

  try {
    await prisma.$transaction(async (tx: any) => {
      if (student) {
        await tx.assignmentSubmission.deleteMany({ where: { studentId: student.id } });
        await tx.grade.deleteMany({ where: { studentId: student.id } });
        await tx.attendance.deleteMany({ where: { studentId: student.id } });
        await tx.enrollment.deleteMany({ where: { studentId: student.id } });
        await tx.document.deleteMany({ where: { studentId: student.id } });
        await tx.observation.deleteMany({ where: { studentId: student.id } });
        await tx.studentGuardian.deleteMany({ where: { studentId: student.id } });
        await tx.student.delete({ where: { id: student.id } });
      }
      if (teacher) {
        const assigns: { id: string }[] = await tx.assignment.findMany({
          where: { teacherId: teacher.id },
          select: { id: true },
        });
        for (const a of assigns) {
          await tx.assignmentSubmission.deleteMany({ where: { assignmentId: a.id } });
        }
        await tx.assignment.deleteMany({ where: { teacherId: teacher.id } });
        await tx.photoLog.deleteMany({ where: { teacherId: teacher.id } });
        await tx.grade.updateMany({ where: { teacherId: teacher.id }, data: { teacherId: null } });
        await tx.attendance.updateMany({ where: { teacherId: teacher.id }, data: { teacherId: null } });
        await tx.document.updateMany({ where: { teacherId: teacher.id }, data: { teacherId: null } });
        await tx.observation.updateMany({ where: { teacherId: teacher.id }, data: { teacherId: null } });
        await tx.classTeacher.deleteMany({ where: { teacherId: teacher.id } });
        await tx.teacherSubject.deleteMany({ where: { teacherId: teacher.id } });
        await tx.teacher.delete({ where: { id: teacher.id } });
      }
      if (guardian) {
        await tx.studentGuardian.deleteMany({ where: { guardianId: guardian.id } });
        await tx.guardian.delete({ where: { id: guardian.id } });
      }
      await tx.user.delete({ where: { id: target.id } });
    }, { timeout: 30000 });
  } catch {
    return NextResponse.json(
      { error: "No se pudo eliminar. Probá de nuevo." },
      { status: 500 }
    );
  }
  return NextResponse.json({ data: { id: target.id, username: target.username } });
}
