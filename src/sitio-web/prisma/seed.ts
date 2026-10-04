import { PrismaClient, UserRole, BachilleratoType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const passwordHash = bcrypt.hashSync("12345678", 10);

async function main() {
  console.log("Sembrando oferta académica (8 bachilleratos)...");

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
      shortName: "Agronomía",
      name: "Bachillerato Técnico en Agronomía",
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

  console.log("Creando usuarios de demostración...");

  const admin = await prisma.user.upsert({
    where: { username: "direccion" },
    update: {},
    create: {
      ci: "1000000",
      username: "direccion",
      email: "direccion@colegio.edu.py",
      passwordHash,
      firstName: "Dirección",
      lastName: "Administración",
      role: UserRole.ADMIN
    }
  });

  // Administrador real: Luis Velazquez — cuenta de pruebas y registro.
  // Correo vinculado: colegionacionalemd6@gmail.com (recibe las solicitudes).
  // CI provisoria 1000001: corregir en el panel cuando se confirme.
  const luisHash = bcrypt.hashSync("n4cio210", 10);
  await prisma.user.upsert({
    where: { username: "luis.velazquez" },
    update: { email: "colegionacionalemd6@gmail.com" },
    create: {
      ci: "1000001",
      username: "luis.velazquez",
      email: "colegionacionalemd6@gmail.com",
      passwordHash: luisHash,
      firstName: "Luis",
      lastName: "Velazquez",
      role: UserRole.ADMIN
    }
  });

  const teacher = await prisma.user.upsert({
    where: { username: "profesor" },
    update: {},
    create: {
      ci: "2000000",
      username: "profesor",
      email: "profesor@colegio.edu.py",
      passwordHash,
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
      passwordHash,
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

  // ---- Materias demo (BTI) + vínculo docente + notas + padre demo ----
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
      // Notas demo del alumno (escala 1-5)
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
      // Asistencia demo
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
      // Tarea demo
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

    // Padre demo vinculado al alumno demo
    const parentUser = await prisma.user.upsert({
      where: { username: "padre" },
      update: {},
      create: {
        ci: "4000000",
        username: "padre",
        email: "padre@colegio.edu.py",
        passwordHash,
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
  console.log("Cuentas (demo: 12345678 · Luis: n4cio210, cambiar tras probar):");
  console.log("  - luis.velazquez (Administrador real, sin correo — vincular en Mi perfil)");
  console.log("  - direccion / direccion@colegio.edu.py (Administrador demo)");
  console.log("  - profesor / profesor@colegio.edu.py  (Docente)");
  console.log("  - alumno / alumno@colegio.edu.py    (Alumno)");
  console.log("  - padre / padre@colegio.edu.py     (Padre/Encargado)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });