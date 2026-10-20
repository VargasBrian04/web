import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { avisarInscripcion } from "@/lib/mail";
import { usernameFromEmail } from "@/lib/users";
import { audit } from "@/lib/audit";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EEB_GRADES = ["7.º", "8.º", "9.º"];
const MEDIA_COURSES = ["1.º", "2.º", "3.º"];
const EEB_SECCIONES = ["A", "B", "C", "D"];
const CCB_SECCIONES = ["A", "B"];
const TURNOS = ["MAÑANA", "TARDE"];

/**
 * POST /api/enrollments — Solicitud pública de inscripción (aspirantes).
 * Crea/actualiza User(ASPIRANT) + perfil Student + Enrollment(PENDIENTE).
 * Body: datos personales, tutor, academicId, documents[{name,type,size}].
 * El almacenamiento binario real (S3/UploadThing) es fase 2: aquí se
 * registra el manifiesto y Secretaría verifica los físicos.
 */
export async function POST(request: Request) {
  const ip = clientIp(request);
  const limited = rateLimit(`enroll:${ip}`, 20, 10 * 60 * 1000);
  if (!limited.ok)
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Esperá unos minutos e intentá de nuevo." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
    );

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const {
    firstName, lastName, ci, birthDate, phone, email, password, address,
    guardian, academicId, periodLabel, documents,
    nivel, curso, seccion, turno
  } = body as {
    firstName?: string; lastName?: string; ci?: string; birthDate?: string;
    phone?: string; email?: string; password?: string; address?: string;
    guardian?: { name?: string; relation?: string; phone?: string; email?: string };
    academicId?: string; periodLabel?: string;
    documents?: { name: string; type: string; size: number }[];
    nivel?: string; curso?: string; seccion?: string | null; turno?: string;
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
  // ---- Nivel solicitado ----
  if (nivel !== "EEB" && nivel !== "MEDIA")
    return NextResponse.json({ error: "Elegí el nivel (Básica o Media)" }, { status: 400 });
  const validCourses = nivel === "EEB" ? EEB_GRADES : MEDIA_COURSES;
  if (!curso || !validCourses.includes(curso))
    return NextResponse.json({ error: "Curso inválido para el nivel" }, { status: 400 });
  if (!turno || !TURNOS.includes(turno))
    return NextResponse.json({ error: "Elegí el turno (Mañana o Tarde)" }, { status: 400 });

  let academic: { id: string; code: string; name: string; shortName: string; active: boolean } | null = null;
  if (nivel === "MEDIA") {
    if (!academicId)
      return NextResponse.json({ error: "Debés seleccionar un bachillerato" }, { status: 400 });
    academic = await prisma.academic.findUnique({ where: { id: academicId } });
    if (!academic || !academic.active)
      return NextResponse.json({ error: "Bachillerato no disponible" }, { status: 400 });
  }
  // Sección: Escolar Básica A–D; Ciencias Básicas (CCB) A–B.
  const validSec = nivel === "EEB" ? EEB_SECCIONES : academic?.code === "CCB" ? CCB_SECCIONES : [];
  let sec: string | null = null;
  if (validSec.length > 0) {
    if (!seccion || !validSec.includes(seccion))
      return NextResponse.json({ error: `Elegí la sección (${validSec.join(" o ")})` }, { status: 400 });
    sec = seccion;
  }
  const docsToStore: { name: string; type: string; size: number }[] = [];
  if (!Array.isArray(documents) || documents.length === 0 || documents.length > 10)
    return NextResponse.json({ error: "Adjuntá entre 1 y 10 documentos" }, { status: 400 });
  for (const d of documents) {
    if (
      !d ||
      typeof d.name !== "string" ||
      !d.name.trim() ||
      d.name.length > 200 ||
      typeof d.size !== "number" ||
      !Number.isFinite(d.size) ||
      d.size < 0 ||
      d.size > 10 * 1024 * 1024
    )
      return NextResponse.json({ error: "Documento inválido (nombre o tamaño)" }, { status: 400 });
    docsToStore.push({
      name: d.name.trim().slice(0, 200),
      type: typeof d.type === "string" ? d.type.slice(0, 100) : "",
      size: Math.round(d.size),
    });
  }

  const birth = birthDate ? new Date(birthDate) : null;
  if (birth && Number.isNaN(birth.getTime()))
    return NextResponse.json({ error: "Fecha de nacimiento inválida" }, { status: 400 });

  const period = (periodLabel?.trim() || String(new Date().getFullYear()));
  const emailNorm = email.trim().toLowerCase();
  const ciNorm = ci.trim();

  try {
    const result = await prisma.$transaction(async (tx: any) => {
      // La inscripción pública NO modifica cuentas existentes: si la CI o el
      // correo ya existen, la persona debe iniciar sesión o ir a Secretaría.
      const existing = await tx.user.findFirst({
        where: { OR: [{ ci: ciNorm }, { email: emailNorm }] },
        select: { id: true },
      });
      if (existing) {
        throw Object.assign(
          new Error("Ya existe una cuenta con esa cédula o correo. Iniciá sesión o contactá a Secretaría."),
          { status: 409 }
        );
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const base = usernameFromEmail(emailNorm);
      let username = base;
      for (let i = 2; ; i++) {
        const taken = await tx.user.findUnique({ where: { username } });
        if (!taken) break;
        username = `${base}${i}`.slice(0, 30);
      }

      const user = await tx.user.create({
        data: {
          ci: ciNorm,
          email: emailNorm,
          username,
          passwordHash,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone?.trim() || null,
          birthDate: birth,
          address: address?.trim() || null,
          role: "ASPIRANT",
        },
      });

      const student = await tx.student.create({
        data: {
          userId: user.id,
          academicId: academic?.id ?? null,
          enrollmentYear: Number(period) || null,
        },
      });

      const enrollment = await tx.enrollment.create({
        data: {
          studentId: student.id,
          academicId: academic?.id ?? null,
          periodLabel: period,
          status: "PENDIENTE",
          nivel,
          curso,
          seccion: sec,
          turno,
          documents: docsToStore,
          tutorName: guardian.name!.trim(),
          tutorRelation: guardian.relation?.trim() || null,
          tutorPhone: guardian.phone!.trim(),
          tutorEmail: guardian.email?.trim() || null,
        },
      });

      return { enrollmentId: enrollment.id };
    });

    // Aviso por correo a Dirección (no bloquea si el correo falla)
    let emailSent = false;
    try {
      emailSent = await avisarInscripcion({
        codigo: result.enrollmentId,
        alumno: `${firstName.trim()} ${lastName.trim()}`,
        ci: ciNorm,
        nivel, curso,
        seccion: sec,
        turno,
        bachiller: academic ? `${academic.shortName} — ${academic.name}` : null,
        tutor: guardian.name!.trim(),
        tutorTelefono: guardian.phone!.trim(),
      });
      if (emailSent) {
        await prisma.enrollment.update({
          where: { id: result.enrollmentId },
          data: { emailSent: true },
        });
      }
    } catch (e) {
      console.error("aviso inscripcion", e);
    }

    return NextResponse.json(
      { data: { ...result, estado: "PENDIENTE", emailSent, mensaje: "Solicitud recibida. Secretaría la revisará." } },
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
  await audit(session.user, `INSCRIPCION_${status}`, updated.id);

  return NextResponse.json({ data: updated });
}
