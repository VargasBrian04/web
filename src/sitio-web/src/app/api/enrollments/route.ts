import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { normalizeUsername, usernameFromEmail } from "@/lib/users";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/enrollments — Solicitud pública de inscripción (aspirantes).
 * Crea/actualiza User(ASPIRANT) + perfil Student + Enrollment(PENDIENTE).
 * Body: datos personales, tutor, academicId, documents[{name,type,size}].
 * El almacenamiento binario real (S3/UploadThing) es fase 2: aquí se
 * registra el manifiesto y Secretaría verifica los físicos.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const {
    firstName, lastName, ci, birthDate, phone, email, password, address,
    guardian, academicId, periodLabel, documents
  } = body as {
    firstName?: string; lastName?: string; ci?: string; birthDate?: string;
    phone?: string; email?: string; password?: string; address?: string;
    guardian?: { name?: string; relation?: string; phone?: string; email?: string };
    academicId?: string; periodLabel?: string;
    documents?: { name: string; type: string; size: number }[];
  };

  // ---- Validaciones ----
  if (!firstName?.trim() || !lastName?.trim())
    return NextResponse.json({ error: "Nombres y apellidos son obligatorios" }, { status: 400 });
  if (!ci || !/^\d{6,10}$/.test(ci.trim()))
    return NextResponse.json({ error: "Cédula inválida (6 a 10 dígitos)" }, { status: 400 });
  if (!email || !EMAIL_RE.test(email.trim()))
    return NextResponse.json({ error: "Correo electrónico inválido" }, { status: 400 });
  if (!password || password.length < 8)
    return NextResponse.json({ error: "La contraseña debe tener al menos 8 caracteres" }, { status: 400 });
  if (!guardian?.name?.trim() || !guardian?.phone?.trim())
    return NextResponse.json({ error: "Datos del tutor/encargado incompletos" }, { status: 400 });
  if (!academicId)
    return NextResponse.json({ error: "Debés seleccionar un bachillerato" }, { status: 400 });
  if (!Array.isArray(documents) || documents.length === 0)
    return NextResponse.json({ error: "Adjuntá al menos un documento" }, { status: 400 });

  const academic = await prisma.academic.findUnique({ where: { id: academicId } });
  if (!academic || !academic.active)
    return NextResponse.json({ error: "Bachillerato no disponible" }, { status: 400 });

  const period = (periodLabel?.trim() || String(new Date().getFullYear()));
  const emailNorm = email.trim().toLowerCase();
  const ciNorm = ci.trim();

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Usuario existente por CI o email: se reutiliza, no se duplica
      const existing = await tx.user.findFirst({
        where: { OR: [{ ci: ciNorm }, { email: emailNorm }] }
      });
      if (existing && existing.ci !== ciNorm && existing.email !== emailNorm) {
        throw Object.assign(new Error("La cédula o el correo ya están registrados"), { status: 409 });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      // Nombre de usuario: se conserva el existente o se genera del correo.
      let username = existing?.username ?? "";
      if (!username) {
        const base = usernameFromEmail(emailNorm);
        username = base;
        for (let i = 2; ; i++) {
          const taken = await tx.user.findUnique({ where: { username } });
          if (!taken) break;
          username = `${base}${i}`.slice(0, 30);
        }
      }
      const user = existing
        ? await tx.user.update({
            where: { id: existing.id },
            data: {
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              phone: phone?.trim() || null,
              address: address?.trim() || null,
              username: existing.username ?? username,
            }
          })
        : await tx.user.create({
            data: {
              ci: ciNorm, email: emailNorm, username, passwordHash,
              firstName: firstName.trim(), lastName: lastName.trim(),
              phone: phone?.trim() || null,
              birthDate: birthDate ? new Date(birthDate) : null,
              address: address?.trim() || null,
              role: "ASPIRANT"
            }
          });

      const student = await tx.student.upsert({
        where: { userId: user.id },
        update: { academicId: academic.id, enrollmentYear: Number(period) || null },
        create: { userId: user.id, academicId: academic.id, enrollmentYear: Number(period) || null }
      });

      const enrollment = await tx.enrollment.create({
        data: {
          studentId: student.id,
          academicId: academic.id,
          periodLabel: period,
          status: "PENDIENTE",
          documents: documents as object,
          tutorName: guardian.name!.trim(),
          tutorRelation: guardian.relation?.trim() || null,
          tutorPhone: guardian.phone!.trim(),
          tutorEmail: guardian.email?.trim() || null
        }
      });

      return { enrollmentId: enrollment.id, username: user.username };
    });

    return NextResponse.json(
      { data: { ...result, estado: "PENDIENTE", mensaje: "Solicitud recibida. Secretaría la revisará." } },
      { status: 201 }
    );
  } catch (e: unknown) {
    if (e instanceof Error && "status" in e && typeof (e as Error & { status?: unknown }).status === "number") {
      const s = (e as Error & { status: number }).status;
      return NextResponse.json({ error: e.message }, { status: s });
    }
    // P2002 = solicitud duplicada (mismo alumno + bachillerato + período)
    if (typeof e === "object" && e !== null && "code" in e && (e as { code: string }).code === "P2002")
      return NextResponse.json(
        { error: "Ya existe una solicitud para este bachillerato y período" },
        { status: 409 }
      );
    console.error("POST /api/enrollments", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

/**
 * GET /api/enrollments — ADMIN ve solicitudes (filtros ?status=&academicId=);
 * STUDENT ve las propias. TEACHER/PARENT/ASPIRANT sin acceso (PII de menores).
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const role = session.user.role;
  if (role !== "ADMIN" && role !== "STUDENT")
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || undefined;
  const academicId = searchParams.get("academicId") || undefined;
  const validStatuses = ["PENDIENTE", "EN_REVISION", "APROBADA", "RECHAZADA", "CANCELADA"];
  if (status && !validStatuses.includes(status))
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });

  const include = {
    academic: { select: { code: true, name: true, shortName: true } },
    student: { include: { user: { select: { firstName: true, lastName: true, ci: true, email: true, phone: true } } } }
  };

  if (role === "STUDENT") {
    const student = await prisma.student.findUnique({ where: { userId: session.user.id } });
    if (!student) return NextResponse.json({ data: [] });
    const data = await prisma.enrollment.findMany({ where: { studentId: student.id }, include, orderBy: { createdAt: "desc" } });
    return NextResponse.json({ data });
  }

  const data = await prisma.enrollment.findMany({
    where: { ...(status ? { status: status as "PENDIENTE" } : {}), ...(academicId ? { academicId } : {}) },
    include,
    orderBy: { createdAt: "desc" },
    take: 100
  });
  return NextResponse.json({ data });
}

/**
 * PATCH /api/enrollments — Solo ADMIN/Secretaría cambia estados.
 * Body: { id, status: EN_REVISION | APROBADA | RECHAZADA | CANCELADA }.
 * Al aprobar, el aspirante pasa a STUDENT.
 */
export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Solo Secretaría/Dirección" }, { status: 403 });

  const { id, status } = (await request.json()) as { id?: string; status?: string };
  const valid = ["EN_REVISION", "APROBADA", "RECHAZADA", "CANCELADA"];
  if (!id || !status || !valid.includes(status))
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const updated = await prisma.enrollment.update({
    where: { id },
    data: { status: status as "APROBADA" },
    include: { student: true }
  });

  if (status === "APROBADA") {
    await prisma.user.updateMany({
      where: { id: updated.student.userId, role: "ASPIRANT" },
      data: { role: "STUDENT" }
    });
  }

  return NextResponse.json({ data: updated });
}
