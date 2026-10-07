import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TeachersDirectory, { type TeachersScope } from "@/components/portal/TeachersDirectory";

export const metadata = { title: "Docentes — Portal del Tutor" };

/**
 * Zona de docentes para tutores: directorio completo del plantel.
 * Con ?hijo=<studentId> (verificado) se filtra a los docentes del
 * curso del hijo y se abre el primero con sus planillas.
 */
export default async function PadreDocentesPage({
  searchParams,
}: {
  searchParams: Promise<{ hijo?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/portal/padre/docentes");

  const { hijo } = await searchParams;
  let scope: TeachersScope | null = null;
  if (hijo) {
    let allowed = session.user.role === "ADMIN";
    if (!allowed && session.user.role === "PARENT") {
      const link = await prisma.studentGuardian
        .findFirst({ where: { studentId: hijo, guardian: { userId: session.user.id } } })
        .catch(() => null);
      allowed = !!link;
    }
    if (allowed) {
      const st = await prisma.student
        .findUnique({
          where: { id: hijo },
          select: {
            user: { select: { firstName: true, lastName: true } },
            academic: { select: { code: true, shortName: true } },
            group: { select: { gradeYear: true } },
          },
        })
        .catch(() => null);
      if (st?.academic) {
        scope = {
          academicCode: st.academic.code,
          academicShort: st.academic.shortName,
          gradeYear: st.group?.gradeYear ?? null,
          hijoNombre: `${st.user.firstName} ${st.user.lastName}`.trim(),
        };
      }
    }
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-2xl bg-[var(--institutional)] p-6 text-white">
        <h2 className="text-xl font-extrabold">Docentes del colegio</h2>
        <p className="mt-1 text-sm text-stone-200">
          Plantel docente, materias y horarios de atención.
        </p>
      </section>
      <TeachersDirectory scope={scope} />
    </div>
  );
}
