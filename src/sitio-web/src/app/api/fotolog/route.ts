import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { imageToDataUri, NEWS_IMAGE_MIME } from "@/lib/storage";

const KINDS = ["ASISTENCIA", "TAREA"] as const;

/**
 * Bitácora de fotos (listas y planillas en papel).
 * GET con sesión: TEACHER ve las suyas; STUDENT las de sus materias;
 * PARENT las de sus hijos; ADMIN todas (?kind=&take=).
 * ?teacher=<teacherId> filtra por docente (tutor/alumno: dentro de sus
 * bachilleratos; docente: solo las suyas).
 * POST TEACHER/ADMIN multipart: photo* (PNG/JPG/WEBP ≤4MB), kind*,
 * logDate? (hoy por defecto), caption?, subjectCode?
 * DELETE ?id= — el docente borra las suyas; ADMIN cualquiera.
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind") || undefined;
  const teacherId = searchParams.get("teacher") || undefined;
  const take = Math.min(60, Math.max(1, Number(searchParams.get("take") || "30") || 30));
  const role = session.user.role;

  const include = {
    subject: { select: { code: true, name: true } },
    teacher: { select: { user: { select: { firstName: true, lastName: true } } } },
  };

  try {
    if (role === "ADMIN") {
      const data = await prisma.photoLog.findMany({
        where: { ...(kind ? { kind } : {}), ...(teacherId ? { teacherId } : {}) },
        include,
        orderBy: { logDate: "desc" },
        take,
      });
      return NextResponse.json({ data });
    }
    if (role === "TEACHER") {
      const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } });
      const data = await prisma.photoLog.findMany({
        where: { teacherId: teacher?.id ?? "nadie", ...(kind ? { kind } : {}) },
        include,
        orderBy: { logDate: "desc" },
        take,
      });
      return NextResponse.json({ data });
    }
    let academicIds: string[] = [];
    if (role === "STUDENT") {
      const st = await prisma.student.findUnique({
        where: { userId: session.user.id },
        select: { academicId: true },
      });
      if (st?.academicId) academicIds = [st.academicId];
    }
    if (role === "PARENT") {
      const links = await prisma.studentGuardian.findMany({
        where: { guardian: { userId: session.user.id } },
        select: { student: { select: { academicId: true } } },
      });
      academicIds = [...new Set(links.map((l: { student: { academicId: string | null } }) => l.student.academicId).filter(Boolean) as string[])];
    }
    const data = await prisma.photoLog.findMany({
      where: {
        ...(kind ? { kind } : {}),
        ...(teacherId ? { teacherId } : {}),
        ...(academicIds.length
          ? { subject: { academicId: { in: academicIds } } }
          : { subjectId: null }),
      },
      include,
      orderBy: { logDate: "desc" },
      take,
    });
    return NextResponse.json({ data });
  } catch (e) {
    console.error("GET /api/fotolog", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Formulario inválido" }, { status: 400 });
  const kind = String(form.get("kind") || "");
  const caption = String(form.get("caption") || "").trim().slice(0, 500) || null;
  const logDateRaw = String(form.get("logDate") || "").trim();
  const subjectCode = String(form.get("subjectCode") || "").trim() || null;
  if (!(KINDS as readonly string[]).includes(kind))
    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  const file = form.get("photo");
  if (!(file instanceof File) || file.size === 0)
    return NextResponse.json({ error: "Sacá/subí la foto de la lista" }, { status: 400 });

  let subjectId: string | null = null;
  if (subjectCode) {
    const subject = await prisma.subject.findFirst({ where: { code: subjectCode } });
    if (!subject) return NextResponse.json({ error: "Materia inválida" }, { status: 400 });
    subjectId = subject.id;
  }
  // La foto queda atribuida a la ficha docente del que sube (también
  // Dirección, si enseña): así aparece en su zona del directorio.
  const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } });

  try {
    const uri = imageToDataUri(
      Buffer.from(await file.arrayBuffer()), file.type, NEWS_IMAGE_MIME, "PNG/JPG/WEBP"
    );
    const created = await prisma.photoLog.create({
      data: {
        kind,
        photoData: uri,
        caption,
        logDate: logDateRaw ? new Date(logDateRaw + "T12:00:00") : new Date(),
        subjectId,
        teacherId: teacher?.id ?? null,
      },
      select: { id: true, kind: true, caption: true, logDate: true },
    });
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Imagen inválida" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  const id = new URL(request.url).searchParams.get("id") || "";
  const found = await prisma.photoLog.findUnique({ where: { id }, select: { teacherId: true } });
  if (!found) return NextResponse.json({ error: "Inexistente" }, { status: 404 });
  if (session.user.role === "TEACHER") {
    const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } });
    if (!teacher || found.teacherId !== teacher.id)
      return NextResponse.json({ error: "No es tuya" }, { status: 403 });
  }
  await prisma.photoLog.delete({ where: { id } });
  return NextResponse.json({ data: { id } });
}
