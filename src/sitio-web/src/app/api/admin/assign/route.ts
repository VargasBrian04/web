import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeUsername } from "@/lib/users";

/**
 * POST /api/admin/assign — Solo ADMIN. Asigna docente a materia y curso.
 * Body: { teacher (username/id/CI), subjectCode, classId? }.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.user.role !== "ADMIN")
    return NextResponse.json(
      { error: "Solo Secretaría/Dirección" },
      { status: 403 }
    );

  const { teacher, subjectCode, classId } = (await request.json()) as {
    teacher?: string;
    subjectCode?: string;
    classId?: string;
  };
  if (!teacher?.trim() || !subjectCode?.trim())
    return NextResponse.json(
      { error: "Indicá docente y código de materia" },
      { status: 400 }
    );

  const tUser = await prisma.user.findFirst({
    where: {
      OR: [
        { username: normalizeUsername(teacher) },
        { id: teacher.trim() },
        { ci: teacher.trim() },
      ],
    },
    include: { teacherProfile: true },
  });
  if (!tUser || tUser.role !== "TEACHER")
    return NextResponse.json(
      { error: "Docente inexistente (debe ser cuenta TEACHER)" },
      { status: 404 }
    );
  const profile =
    tUser.teacherProfile ??
    (await prisma.teacher.create({ data: { userId: tUser.id } }));

  const subject = await prisma.subject.findFirst({
    where: { code: subjectCode.trim() },
  });
  if (!subject)
    return NextResponse.json({ error: "Materia inexistente" }, { status: 404 });

  await prisma.teacherSubject.upsert({
    where: {
      teacherId_subjectId: { teacherId: profile.id, subjectId: subject.id },
    },
    update: {},
    create: { teacherId: profile.id, subjectId: subject.id },
  });

  let classLink = null;
  if (classId?.trim()) {
    const cl = await prisma.class.findUnique({
      where: { id: classId.trim() },
    });
    if (!cl)
      return NextResponse.json({ error: "Curso inexistente" }, { status: 404 });
    classLink = await prisma.classTeacher.upsert({
      where: { classId_teacherId: { classId: cl.id, teacherId: profile.id } },
      update: {},
      create: { classId: cl.id, teacherId: profile.id },
    });
  }

  return NextResponse.json(
    {
      data: {
        docente: `${tUser.firstName} ${tUser.lastName}`,
        materia: subject.code,
        curso: classLink?.classId ?? null,
      },
    },
    { status: 201 }
  );
}
