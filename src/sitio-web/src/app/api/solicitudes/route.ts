import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CI_RE, EMAIL_RE, normalizeUsername } from "@/lib/users";

const EEB_GRADES = ["7.º", "8.º", "9.º"];
const MEDIA_COURSES = ["1.º", "2.º", "3.º"];

type Hijo = { nombre: string; nivel: string; curso: string; bachiller?: string | null };

function bad(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

function validPerson(p: {
  ci?: unknown; firstName?: unknown; lastName?: unknown;
  phone?: unknown; email?: unknown;
}): string | null {
  if (typeof p.ci !== "string" || !CI_RE.test(p.ci.trim())) return "Cédula inválida (6 a 10 dígitos)";
  if (typeof p.firstName !== "string" || !p.firstName.trim()) return "Nombres obligatorios";
  if (typeof p.lastName !== "string" || !p.lastName.trim()) return "Apellidos obligatorios";
  if (typeof p.phone !== "string" || p.phone.replace(/\D/g, "").length < 6)
    return "Teléfono inválido (mínimo 6 dígitos)";
  if (typeof p.email !== "string" || !EMAIL_RE.test(p.email.trim().toLowerCase()))
    return "Correo electrónico inválido";
  return null;
}

/** Resuelve código o nombre corto de bachillerato contra la DB. */
async function resolveAcademic(ref: string) {
  const v = ref.trim();
  return prisma.academic.findFirst({
    where: { OR: [{ code: v }, { shortName: v }] },
    select: { id: true, code: true, shortName: true, name: true },
  });
}

/**
 * POST /api/solicitudes — público. Crea solicitud PENDIENTE (tutor/docente).
 * Toda la validación (incluidos combos dependientes) se repite en servidor.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return bad("JSON inválido");
  }

  if (body.type === "tutor") {
    const err = validPerson(body as never);
    if (err) return bad(err);
    const hijos = body.hijos;
    if (!Array.isArray(hijos) || hijos.length < 1 || hijos.length > 8)
      return bad("Registrá entre 1 y 8 hijos");
    const clean: Hijo[] = [];
    for (let i = 0; i < hijos.length; i++) {
      const h = hijos[i] as Record<string, unknown>;
      if (typeof h.nombre !== "string" || !h.nombre.trim())
        return bad(`Hijo ${i + 1}: nombre y apellido obligatorios`);
      if (h.nivel !== "EEB" && h.nivel !== "MEDIA")
        return bad(`Hijo ${i + 1}: nivel inválido`);
      const validCourses = h.nivel === "EEB" ? EEB_GRADES : MEDIA_COURSES;
      if (typeof h.curso !== "string" || !validCourses.includes(h.curso))
        return bad(`Hijo ${i + 1}: curso inválido para el nivel`);
      let bachiller: string | null = null;
      if (h.nivel === "MEDIA") {
        if (typeof h.bachiller !== "string" || !h.bachiller.trim())
          return bad(`Hijo ${i + 1}: elegí el bachiller`);
        const found = await resolveAcademic(h.bachiller);
        if (!found) return bad(`Hijo ${i + 1}: bachiller inexistente`);
        bachiller = found.code;
      }
      clean.push({ nombre: (h.nombre as string).trim(), nivel: h.nivel as string, curso: h.curso as string, bachiller });
    }
    const created = await prisma.accountRequest.create({
      data: {
        type: "TUTOR",
        status: "PENDIENTE",
        payload: {
          ci: (body.ci as string).trim(),
          firstName: (body.firstName as string).trim(),
          lastName: (body.lastName as string).trim(),
          phone: (body.phone as string).trim(),
          email: (body.email as string).trim().toLowerCase(),
          hijos: clean,
        },
      },
      select: { id: true },
    });
    return NextResponse.json(
      { data: { id: created.id, estado: "PENDIENTE" } },
      { status: 201 }
    );
  }

  if (body.type === "docente") {
    const err = validPerson(body as never);
    if (err) return bad(err);
    // Materia principal: código real o "OTRA:<texto>"
    const mp = body.materiaPrincipal;
    let materiaPrincipal: string | null = null;
    let materiaPrincipalOtra: string | null = null;
    if (typeof mp !== "string" || !mp.trim()) return bad("Elegí la materia principal");
    if (mp.startsWith("OTRA:")) {
      const t = mp.slice(5).trim();
      if (!t || t.length > 80) return bad("Describí la otra materia (máx 80)");
      materiaPrincipalOtra = t;
    } else {
      const found = await prisma.subject.findFirst({ where: { code: mp.trim() }, select: { code: true } });
      if (!found) return bad("Materia principal inexistente");
      materiaPrincipal = found.code;
    }
    // Otras (opcional, sin duplicados)
    const otrasRaw = Array.isArray(body.otrasMaterias) ? body.otrasMaterias : [];
    if (otrasRaw.length > 6) return bad("Máximo 6 otras materias");
    const seen = new Set<string>();
    const otrasMaterias: string[] = [];
    const otrasLibres: string[] = [];
    for (const o of otrasRaw) {
      if (typeof o !== "string" || !o.trim()) return bad("Materia inválida en la lista");
      const v = o.trim();
      if (seen.has(v)) return bad("Hay materias duplicadas en la lista");
      seen.add(v);
      if (v.startsWith("OTRA:")) {
        const t = v.slice(5).trim();
        if (!t || t.length > 80) return bad("Describí cada otra materia (máx 80)");
        otrasLibres.push(t);
      } else {
        const found = await prisma.subject.findFirst({ where: { code: v }, select: { code: true } });
        if (!found) return bad(`Materia inexistente: ${v}`);
        otrasMaterias.push(found.code);
      }
    }
    if (materiaPrincipal && (otrasMaterias.includes(materiaPrincipal) || seen.has(materiaPrincipal)))
      return bad("La materia principal ya está en la lista");
    // Asignación académica
    if (body.nivel !== "EEB" && body.nivel !== "MEDIA") return bad("Nivel inválido");
    const validCourses = body.nivel === "EEB" ? EEB_GRADES : MEDIA_COURSES;
    const cursos = body.cursos;
    if (!Array.isArray(cursos) || cursos.length < 1 || cursos.length > 6)
      return bad("Elegí entre 1 y 6 cursos");
    for (const c of cursos) {
      if (typeof c !== "string" || !validCourses.includes(c)) return bad(`Curso inválido: ${String(c)}`);
    }
    const uniqCursos = [...new Set(cursos as string[])];
    let bachilleres: string[] = [];
    if (body.nivel === "MEDIA") {
      const b = body.bachilleres;
      if (!Array.isArray(b) || b.length < 1 || b.length > 8)
        return bad("Indicá en qué bachiller(es) enseñás (Educación Media)");
      for (const x of b) {
        if (typeof x !== "string" || !x.trim()) return bad("Bachiller inválido");
        const found = await resolveAcademic(x);
        if (!found) return bad(`Bachiller inexistente: ${x}`);
        if (!bachilleres.includes(found.code)) bachilleres.push(found.code);
      }
    }
    const created = await prisma.accountRequest.create({
      data: {
        type: "DOCENTE",
        status: "PENDIENTE",
        payload: {
          ci: (body.ci as string).trim(),
          firstName: (body.firstName as string).trim(),
          lastName: (body.lastName as string).trim(),
          phone: (body.phone as string).trim(),
          email: (body.email as string).trim().toLowerCase(),
          materiaPrincipal,
          materiaPrincipalOtra,
          otrasMaterias,
          otrasLibres,
          nivel: body.nivel,
          cursos: uniqCursos,
          bachilleres,
        },
      },
      select: { id: true },
    });
    return NextResponse.json(
      { data: { id: created.id, estado: "PENDIENTE" } },
      { status: 201 }
    );
  }

  return bad("Tipo de solicitud inválido (tutor | docente)");
}

/** GET /api/solicitudes — solo ADMIN (?status=). */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) return bad("No autenticado", 401);
  if (session.user.role !== "ADMIN") return bad("Solo Dirección", 403);
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || undefined;
  const valid = ["PENDIENTE", "EN_REVISION", "APROBADA", "RECHAZADA", "CANCELADA"];
  if (status && !valid.includes(status)) return bad("Estado inválido");
  const data = await prisma.accountRequest.findMany({
    where: { ...(status ? { status: status as "PENDIENTE" } : {}) },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ data });
}

function suggestUsername(firstName: string, lastName: string, ci: string): string {
  const base = (
    normalizeUsername(firstName.split(" ")[0] + "." + lastName.split(" ")[0]).replace(/[^a-z0-9._-]/g, "") || "usuario"
  ).slice(0, 20);
  return `${base}.${ci.slice(-3)}`.slice(0, 30);
}

function tempPassword(): string {
  return randomBytes(8).toString("base64url").slice(0, 10);
}

/**
 * PATCH /api/solicitudes — solo ADMIN.
 * { id, action: "aprobar" | "rechazar" | "revision", note? }
 * Al aprobar crea la cuenta real (o reporta qué quedó pendiente).
 */
export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user) return bad("No autenticado", 401);
  if (session.user.role !== "ADMIN") return bad("Solo Dirección", 403);

  const { id, action, note } = (await request.json()) as {
    id?: string; action?: string; note?: string;
  };
  if (!id || !["aprobar", "rechazar", "revision"].includes(action ?? ""))
    return bad("Datos inválidos");

  const req = await prisma.accountRequest.findUnique({ where: { id } });
  if (!req) return bad("Solicitud inexistente", 404);
  if (req.status === "APROBADA") return bad("Ya fue aprobada", 409);

  const status =
    action === "aprobar" ? "APROBADA" : action === "rechazar" ? "RECHAZADA" : "EN_REVISION";
  const result: Record<string, unknown> = { action };

  if (action === "aprobar") {
    const p = req.payload as Record<string, unknown>;
    const ci = String(p.ci);
    const email = String(p.email || "").toLowerCase() || null;
    const orClauses: Array<{ ci?: string; email?: string }> = [{ ci }];
    if (email) orClauses.push({ email });
    const existing = await prisma.user.findFirst({
      where: { OR: orClauses as Array<{ ci: string } | { email: string }> },
    });
    if (existing && (existing.role !== (req.type === "TUTOR" ? "PARENT" : "TEACHER")))
      return bad(`La CI ya pertenece a una cuenta ${existing.role}`, 409);

    let username = existing?.username ?? "";
    if (!username) {
      username = suggestUsername(String(p.firstName), String(p.lastName), ci);
      for (let i = 2; ; i++) {
        const taken = await prisma.user.findUnique({ where: { username } });
        if (!taken) break;
        username = `${suggestUsername(String(p.firstName), String(p.lastName), ci)}${i}`.slice(0, 30);
      }
    }
    const password = tempPassword();
    const passwordHash = await bcrypt.hash(password, 10);
    const role = req.type === "TUTOR" ? ("PARENT" as const) : ("TEACHER" as const);

    const user = existing
      ? await prisma.user.update({
          where: { id: existing.id },
          data: {
            firstName: String(p.firstName), lastName: String(p.lastName),
            phone: String(p.phone), ...(email ? { email } : {}),
          },
        })
      : await prisma.user.create({
          data: {
            ci, username, email, passwordHash,
            firstName: String(p.firstName), lastName: String(p.lastName),
            phone: String(p.phone), role,
          },
        });
    result.cuenta = { username: user.username, tempPassword: existing ? null : password };
    result.reutilizada = !!existing;

    if (req.type === "TUTOR") {
      const guardian =
        (await prisma.guardian.findUnique({ where: { userId: user.id } })) ??
        (await prisma.guardian.create({ data: { userId: user.id } }));
      const vinculados: string[] = [];
      const pendientes: string[] = [];
      for (const h of (p.hijos as Hijo[]) ?? []) {
        // Vinculación por nombre exacto (único); si no hay match unívoco
        // queda pendiente para Secretaría (el formulario no pide CI del hijo).
        const matches = await prisma.student.findMany({
          where: {
            user: {
              firstName: { contains: h.nombre.split(" ")[0], mode: "insensitive" },
              lastName: { contains: h.nombre.split(" ").slice(-1)[0] ?? "", mode: "insensitive" },
            },
          },
          select: { id: true, user: { select: { firstName: true, lastName: true } } },
        });
        if (matches.length === 1) {
          await prisma.studentGuardian.upsert({
            where: { guardianId_studentId: { guardianId: guardian.id, studentId: matches[0].id } },
            update: {},
            create: { guardianId: guardian.id, studentId: matches[0].id, relation: "tutor" },
          });
          // Si el alumno no tenía bachillerato y la solicitud trae uno válido, asignarlo.
          if (h.bachiller) {
            const ac = await prisma.academic.findUnique({ where: { code: h.bachiller }, select: { id: true } });
            if (ac) {
              const st = await prisma.student.findUnique({ where: { id: matches[0].id }, select: { academicId: true } });
              if (st && !st.academicId) {
                await prisma.student.update({ where: { id: matches[0].id }, data: { academicId: ac.id } });
              }
            }
          }
          vinculados.push(`${matches[0].user.firstName} ${matches[0].user.lastName}`);
        } else {
          pendientes.push(`${h.nombre} (${h.nivel} ${h.curso}${h.bachiller ? ` · ${h.bachiller}` : ""})`);
        }
      }
      result.vinculados = vinculados;
      result.pendientesSecretaria = pendientes;
    } else {
      const teacher =
        (await prisma.teacher.findUnique({ where: { userId: user.id } })) ??
        (await prisma.teacher.create({ data: { userId: user.id } }));
      const vinculadas: string[] = [];
      const codes = [
        ...((p.materiaPrincipal as string | null) ? [p.materiaPrincipal as string] : []),
        ...((p.otrasMaterias as string[]) ?? []),
      ];
      for (const code of codes) {
        const s = await prisma.subject.findFirst({ where: { code }, select: { id: true } });
        if (!s) continue;
        await prisma.teacherSubject.upsert({
          where: { teacherId_subjectId: { teacherId: teacher.id, subjectId: s.id } },
          update: {},
          create: { teacherId: teacher.id, subjectId: s.id },
        });
        vinculadas.push(code);
      }
      result.materiasVinculadas = vinculadas;
      result.materiasLibres = [
        ...((p.materiaPrincipalOtra as string | null) ? [p.materiaPrincipalOtra as string] : []),
        ...((p.otrasLibres as string[]) ?? []),
      ];
      // Cursos/bachilleres quedan registrados; la asignación a secciones
      // formales la completa Secretaría (aún no existen cursos formales).
      result.cursosDeclarados = { nivel: p.nivel, cursos: p.cursos, bachilleres: p.bachilleres };
    }
  }

  const updated = await prisma.accountRequest.update({
    where: { id },
    data: {
      status: status as "APROBADA",
      note: typeof note === "string" ? note.trim().slice(0, 500) || null : null,
      reviewedBy: session.user.id,
      reviewedAt: new Date(),
    },
  });
  void updated;
  return NextResponse.json({ data: result });
}
