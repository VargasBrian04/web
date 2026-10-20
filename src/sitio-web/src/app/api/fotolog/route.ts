import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { imageToDataUri, NEWS_IMAGE_MIME } from "@/lib/storage";
import { dataUriMeta } from "@/lib/data-uri";

const KINDS = ["ASISTENCIA", "TAREA"] as const;

/**
 * Convierte las filas de PhotoLog en una respuesta segura. Por defecto
 * conserva photoData (lo usan las pantallas docentes); con ?fields=meta
 * solo devuelve la URL y los metadatos para que el tutor cargue las
 * imágenes de forma diferida.
 */
function withPhotoUrls<T extends { id: string; photoData?: string | null }>(data: T[], metaOnly: boolean) {
  return data.map((log) => {
    const { photoData, ...rest } = log;
    const meta = dataUriMeta(photoData);
    return {
      ...rest,
      photoUrl: `/api/fotolog/${log.id}/photo`,
      photoMime: meta?.mime ?? null,
      photoSize: meta?.size ?? null,
      ...(metaOnly ? {} : { photoData: photoData ?? null }),
    };
  });
}

/**
 * Bitácora de fotos (listas y planillas en papel).
 * GET con sesión: TEACHER ve las suyas; STUDENT las de sus materias;
 * PARENT las de sus hijos; ADMIN todas (?kind=&take=&skip=).
 * ?teacher=<teacherId> filtra por docente (tutor/alumno: dentro de sus
 * bachilleratos; docente: solo las suyas). ?fields=meta devuelve URL y
 * metadatos en lugar del data URI completo.
 * POST TEACHER/ADMIN multipart: photo* (PNG/JPG/WEBP ≤4MB), kind*,
 * logDate? (hoy por defecto), caption?, subjectCode?
 * DELETE ?id= — el docente borra las suyas; ADMIN cualquiera.
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind") || undefined;
  const subjectCode = searchParams.get("subject") || undefined;
  const teacherId = searchParams.get("teacher") || undefined;
  const take = Math.min(60, Math.max(1, Number(searchParams.get("take") || "30") || 30));
  const skip = Math.min(10000, Math.max(0, Number(searchParams.get("skip") || "0") || 0));
  const metaOnly = searchParams.get("fields") === "meta";
  const role = session.user.role;

  const logSelect = {
    id: true,
    kind: true,
    caption: true,
    logDate: true,
    subjectId: true,
    teacherId: true,
    createdAt: true,
    subject: { select: { code: true, name: true } },
    teacher: { select: { user: { select: { firstName: true, lastName: true } } } },
    ...(metaOnly ? {} : { photoData: true }),
  };

  try {
    if (role === "ADMIN") {
      const data = await prisma.photoLog.findMany({
        where: {
          ...(kind ? { kind } : {}),
          ...(teacherId ? { teacherId } : {}),
          ...(subjectCode ? { subject: { code: subjectCode } } : {}),
        },
        select: logSelect,
        orderBy: { logDate: "desc" },
        take,
        skip,
      });
      return NextResponse.json({ data: withPhotoUrls(data, metaOnly) });
    }
    if (role === "TEACHER") {
      const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } });
      const data = await prisma.photoLog.findMany({
        where: {
          teacherId: teacher?.id ?? "nadie",
          ...(kind ? { kind } : {}),
          ...(subjectCode ? { subject: { code: subjectCode } } : {}),
        },
        select: logSelect,
        orderBy: { logDate: "desc" },
        take,
        skip,
      });
      return NextResponse.json({ data: withPhotoUrls(data, metaOnly) });
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
    // Alumno/tutor solo ven fotos de los bachilleratos a los que pertenecen.
    // Sin bachillerato asignado no hay fotos que mostrar: nunca abrir a "todas".
    if (!academicIds.length) return NextResponse.json({ data: [] });
    const subjectFilter: Record<string, unknown> = { academicId: { in: academicIds } };
    if (subjectCode) subjectFilter.code = subjectCode;
    const data = await prisma.photoLog.findMany({
      where: {
        ...(kind ? { kind } : {}),
        ...(teacherId ? { teacherId } : {}),
        subject: subjectFilter,
      },
      select: logSelect,
      orderBy: { logDate: "desc" },
      take,
      skip,
    });
    return NextResponse.json({ data: withPhotoUrls(data, metaOnly) });
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
  // Un docente solo puede subir fotos de sus materias asignadas.
  const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } });
  if (session.user.role === "TEACHER") {
    if (!teacher) return NextResponse.json({ error: "Sin perfil docente" }, { status: 403 });
    if (subjectId) {
      const link = await prisma.teacherSubject.findUnique({
        where: { teacherId_subjectId: { teacherId: teacher.id, subjectId } },
      });
      if (!link) return NextResponse.json({ error: "No tenés asignada esta materia" }, { status: 403 });
    }
  }

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
