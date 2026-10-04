import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeUsername } from "@/lib/users";

/**
 * POST /api/admin/links — Solo ADMIN. Vincula tutor ↔ alumno.
 * Body: { guardian (username o id de usuario), student (id de Student o CI),
 *         relation?: "padre"|"madre"|"tutor"|"encargado" }.
 * Si el usuario tutor no tiene perfil Guardian, se crea automáticamente.
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

  const { guardian, student, relation } = (await request.json()) as {
    guardian?: string;
    student?: string;
    relation?: string;
  };
  if (!guardian?.trim() || !student?.trim())
    return NextResponse.json(
      { error: "Indicá tutor y alumno" },
      { status: 400 }
    );

  const gUser = await prisma.user.findFirst({
    where: {
      OR: [
        { username: normalizeUsername(guardian) },
        { id: guardian.trim() },
        { ci: guardian.trim() },
      ],
    },
    include: { guardianProfile: true },
  });
  if (!gUser || (gUser.role !== "PARENT" && gUser.role !== "ADMIN"))
    return NextResponse.json(
      { error: "Tutor inexistente (debe ser cuenta PARENT)" },
      { status: 404 }
    );
  const guardianProfile =
    gUser.guardianProfile ??
    (await prisma.guardian.create({ data: { userId: gUser.id } }));

  const st = await prisma.student.findFirst({
    where: { OR: [{ id: student.trim() }, { user: { ci: student.trim() } }] },
    include: { user: { select: { firstName: true, lastName: true } } },
  });
  if (!st)
    return NextResponse.json({ error: "Alumno inexistente" }, { status: 404 });

  const link = await prisma.studentGuardian.upsert({
    where: {
      guardianId_studentId: { guardianId: guardianProfile.id, studentId: st.id },
    },
    update: { relation: relation?.trim().toLowerCase() || "tutor" },
    create: {
      guardianId: guardianProfile.id,
      studentId: st.id,
      relation: relation?.trim().toLowerCase() || "tutor",
    },
  });
  return NextResponse.json(
    {
      data: {
        ...link,
        tutor: `${gUser.firstName} ${gUser.lastName}`,
        alumno: `${st.user.firstName} ${st.user.lastName}`,
      },
    },
    { status: 201 }
  );
}
