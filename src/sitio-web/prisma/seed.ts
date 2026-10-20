import { PrismaClient, UserRole, BachilleratoType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const onlyDigits = (v: string) => v.replace(/\D/g, "");

async function main() {
  // ---------------------------------------------------------------------------
  // Credenciales: nunca hardcodeadas. Se exigen por entorno.
  // ---------------------------------------------------------------------------
  const adminUsername = (process.env.SEED_ADMIN_USERNAME || "direccion").trim();
  const adminEmail = (process.env.SEED_ADMIN_EMAIL || "direccion@colegio.edu.py").trim().toLowerCase();
  const adminCi = onlyDigits(process.env.SEED_ADMIN_CI || "1000000") || "1000000";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "";
  if (adminPassword.length < 12) {
    console.error(
      "SEED_ADMIN_PASSWORD ausente o corta (mínimo 12 caracteres).\n" +
        "Definila por entorno antes de ejecutar el seed. Ejemplo (PowerShell):\n" +
        "  $env:SEED_ADMIN_PASSWORD='...' ; npm run seed"
    );
    process.exit(1);
  }

  const seedDemo = ["1", "true", "yes", "si", "sí"].includes(
    (process.env.SEED_DEMO || "").toLowerCase()
  );
  const demoPassword = process.env.SEED_DEMO_PASSWORD || "";
  if (seedDemo && demoPassword.length < 12) {
    console.error("SEED_DEMO=1 requiere SEED_DEMO_PASSWORD de al menos 12 caracteres.");
    process.exit(1);
  }

  console.log("Sembrando oferta académica (10 bachilleratos)...");

  const bachilleratos = [
    {
      code: "BTI",
      shortName: "BTI",
      name: "Bachillerato Técnico en Informática",
      type: BachilleratoType.TECNICO,
      duration: "3 años",
      level: "Nivel Medio - Técnico",
      description:
        "Programación, redes y mantenimiento de equipos. Preparación para el mundo del software y las TIC."
    },
    {
      code: "BTS",
      shortName: "BTS",
      name: "Bachillerato Técnico en Salud",
      type: BachilleratoType.TECNICO,
      duration: "3 años",
      level: "Nivel Medio - Técnico",
      description:
        "Formación en enfermería, primeros auxilios y ciencias de la salud."
    },
    {
      code: "BTE",
      shortName: "BTE",
      name: "Bachillerato Técnico en Electricidad",
      type: BachilleratoType.TECNICO,
      duration: "3 años",
      level: "Nivel Medio - Técnico",
      description:
        "Instalaciones eléctricas, electrónica y mantenimiento de sistemas de potencia."
    },
    {
      code: "MEC",
      shortName: "Mecánica",
      name: "Bachillerato Técnico en Mecánica",
      type: BachilleratoType.TECNICO,
      duration: "3 años",
      level: "Nivel Medio - Técnico",
      description:
        "Mecánica automotriz e industrial, soldadura y mantenimiento de maquinarias."
    },
    {
      code: "AGR",
      shortName: "Agropecuaria",
      name: "Bachillerato Técnico en Agropecuaria",
      type: BachilleratoType.TECNICO,
      duration: "3 años",
      level: "Nivel Medio - Técnico",
      description:
        "Producción agrícola, ganadería y manejo sustentable de los recursos naturales."
    },
    {
      code: "CIV",
      shortName: "Construcciones Civiles",
      name: "Bachillerato Técnico en Construcciones Civiles",
      type: BachilleratoType.TECNICO,
      duration: "3 años",
      level: "Nivel Medio - Técnico",
      description:
        "Dibujo técnico, obras de mampostería, instalaciones sanitarias y eléctricas."
    },
    {
      code: "BTC",
      shortName: "Contabilidad",
      name: "Bachillerato Técnico en Contabilidad",
      type: BachilleratoType.TECNICO,
      duration: "3 años",
      level: "Nivel Medio - Técnico",
      description:
        "Gestión contable y administrativa con salida laboral y base para estudios universitarios."
    },
    {
      code: "ADN",
      shortName: "Administración",
      name: "Bachillerato en Administración de Negocios",
      type: BachilleratoType.TECNICO,
      duration: "3 años",
      level: "Nivel Medio - Técnico",
      description:
        "Gestión, administración y emprendedurismo para el mundo de los negocios."
    },
    {
      code: "CCB",
      shortName: "Ciencias Básicas",
      name: "Bachillerato Científico con énfasis en Ciencias Básicas",
      type: BachilleratoType.CIENTIFICO,
      duration: "3 años",
      level: "Nivel Medio - Científico",
      description:
        "Matemática, física, química y biología con énfasis en la investigación."
    },
    {
      code: "CCS",
      shortName: "Ciencias Sociales",
      name: "Bachillerato Científico con énfasis en Ciencias Sociales",
      type: BachilleratoType.CIENTIFICO,
      duration: "3 años",
      level: "Nivel Medio - Científico",
      description:
        "Historia, geografía, derecho y ciencias políticas orientadas a las ciencias sociales."
    }
  ];

  for (const b of bachilleratos) {
    await prisma.academic.upsert({
      where: { code: b.code },
      update: {},
      create: b
    });
  }

  console.log("Creando cuenta de Dirección/Secretaría...");
  const adminHash = bcrypt.hashSync(adminPassword, 10);
  await prisma.user.upsert({
    where: { username: adminUsername },
    // No se pisa la contraseña de una cuenta existente: solo se sincroniza el correo.
    update: { email: adminEmail },
    create: {
      ci: adminCi,
      username: adminUsername,
      email: adminEmail,
      passwordHash: adminHash,
      firstName: "Dirección",
      lastName: "Administración",
      role: UserRole.ADMIN
    }
  });

  // ---------------------------------------------------------------------------
  // Datos de demostración: SOLO con SEED_DEMO=1. Nunca en producción real.
  // ---------------------------------------------------------------------------
  if (seedDemo) {
    console.log("Creando datos de demostración (SEED_DEMO=1)...");
    const demoHash = bcrypt.hashSync(demoPassword, 10);

    const teacher = await prisma.user.upsert({
      where: { username: "profesor" },
      update: {},
      create: {
        ci: "2000000",
        username: "profesor",
        email: "profesor@colegio.edu.py",
        passwordHash: demoHash,
        firstName: "Prof.",
        lastName: "Docente Demo",
        role: UserRole.TEACHER,
        teacherProfile: { create: { title: "Lic. en Ciencias de la Educación" } }
      }
    });

    const studentUser = await prisma.user.upsert({
      where: { username: "alumno" },
      update: {},
      create: {
        ci: "3000000",
        username: "alumno",
        email: "alumno@colegio.edu.py",
        passwordHash: demoHash,
        firstName: "Alumno",
        lastName: "Demo",
        role: UserRole.STUDENT
      }
    });

    const bti = await prisma.academic.findUnique({ where: { code: "BTI" } });
    let demoStudent: { id: string } | null = null;
    if (bti) {
      demoStudent = await prisma.student.upsert({
        where: { userId: studentUser.id },
        update: { academicId: bti.id },
        create: { userId: studentUser.id, academicId: bti.id, enrollmentYear: 2026 }
      });
    }

    const period = await prisma.period.upsert({
      where: { label: "2026-PrimerSemestre" },
      update: {},
      create: {
        label: "2026-PrimerSemestre",
        name: "Primer Semestre 2026",
        startDate: new Date("2026-02-02"),
        endDate: new Date("2026-06-30")
      }
    });

    if (bti && demoStudent) {
      const subjectsData = [
        { code: "BTI-MAT", name: "Matemática", gradeYear: 1 },
        { code: "BTI-LEN", name: "Lengua y Literatura", gradeYear: 1 },
        { code: "BTI-INF", name: "Informática Aplicada", gradeYear: 1 },
      ];
      for (const s of subjectsData) {
        await prisma.subject.upsert({
          where: { academicId_code: { academicId: bti.id, code: s.code } },
          update: {},
          create: { academicId: bti.id, ...s },
        });
      }
      const teacherProfile = await prisma.teacher.findUnique({ where: { userId: teacher.id } });
      if (teacherProfile) {
        const allSubs = await prisma.subject.findMany({ where: { academicId: bti.id } });
        for (const s of allSubs) {
          await prisma.teacherSubject.upsert({
            where: { teacherId_subjectId: { teacherId: teacherProfile.id, subjectId: s.id } },
            update: {},
            create: { teacherId: teacherProfile.id, subjectId: s.id },
          });
        }
        const scores: Record<string, number> = { "BTI-MAT": 4.2, "BTI-LEN": 3.8, "BTI-INF": 4.8 };
        for (const s of allSubs) {
          await prisma.grade.upsert({
            where: { studentId_subjectId_periodId: { studentId: demoStudent.id, subjectId: s.id, periodId: period.id } },
            update: { score: scores[s.code] ?? 4.0 },
            create: {
              studentId: demoStudent.id,
              subjectId: s.id,
              periodId: period.id,
              teacherId: teacherProfile.id,
              score: scores[s.code] ?? 4.0,
              note: "Nota de demostración",
            },
          });
        }
        await prisma.attendance.upsert({
          where: {
            studentId_subjectId_classDate: {
              studentId: demoStudent.id,
              subjectId: allSubs[0]?.id ?? "",
              classDate: new Date("2026-03-10"),
            },
          },
          update: {},
          create: {
            studentId: demoStudent.id,
            subjectId: allSubs[0]?.id ?? null,
            classDate: new Date("2026-03-10"),
            status: "PRESENTE",
            teacherId: teacherProfile.id,
          },
        }).catch(() => null);
        if (allSubs[0]) {
          await prisma.assignment.upsert({
            where: { id: "demo-task-1" },
            update: {},
            create: {
              id: "demo-task-1",
              subjectId: allSubs[0].id,
              teacherId: teacherProfile.id,
              periodId: period.id,
              title: "Práctico N.º 1 (demo)",
              description: "Resolver los ejercicios 1 al 10 del cuadernillo.",
            },
          }).catch(() => null);
        }
      }

      const parentUser = await prisma.user.upsert({
        where: { username: "padre" },
        update: {},
        create: {
          ci: "4000000",
          username: "padre",
          email: "padre@colegio.edu.py",
          passwordHash: demoHash,
          firstName: "Padre",
          lastName: "Demo",
          role: UserRole.PARENT,
        },
      });
      const guardian = await prisma.guardian.upsert({
        where: { userId: parentUser.id },
        update: {},
        create: { userId: parentUser.id },
      });
      await prisma.studentGuardian.upsert({
        where: { guardianId_studentId: { guardianId: guardian.id, studentId: demoStudent.id } },
        update: {},
        create: { guardianId: guardian.id, studentId: demoStudent.id, relation: "padre" },
      });
    }
  }

  console.log("Sembrando noticias existentes (4 publicadas)...");
  const { newsPosts } = await import("../src/data/institucional.js");
  for (const n of newsPosts as {
    slug: string;
    title: string;
    date: string;
    category: string;
    author: string;
    image: string;
    excerpt: string;
    content: string[];
  }[]) {
    const html = n.content.map((p) => `<p>${p}</p>`).join("");
    await prisma.newsPost.upsert({
      where: { slug: n.slug },
      update: {},
      create: {
        slug: n.slug,
        title: n.title,
        excerpt: n.excerpt,
        content: html,
        category: n.category,
        imageUrl: n.image,
        status: "PUBLICADA",
        publishedAt: new Date(n.date + "T12:00:00"),
        authorName: n.author,
      },
    });
  }

  console.log("Seed completado.");
  console.log(`  - ${adminUsername} (Administrador/Secretaría) — contraseña desde SEED_ADMIN_PASSWORD`);
  if (seedDemo) {
    console.log("  - profesor / alumno / padre (demo) — contraseña desde SEED_DEMO_PASSWORD");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
