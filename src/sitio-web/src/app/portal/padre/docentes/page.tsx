import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TeachersDirectory, { type TeachersScope } from "@/components/portal/TeachersDirectory";

export const metadata = { title: "Docentes — Portal del Tutor" };

/**
 * Zona de docentes para tutores: directorio completo del plantel.
 * Con ?hijo=<studentId> (verificado) se priorizan los docentes del
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          href="/portal/padre"
          className="inline-flex w-fit items-center gap-1.5 rounded-lg px-1 py-1 text-sm font-bold text-[var(--institutional)] hover:underline"
        >
          <span aria-hidden="true">←</span>
          Volver a Mis hijos
        </Link>
        <span className="rounded-full bg-white px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-500 ring-1 ring-stone-200">
          Portal del tutor
        </span>
      </div>
      <TeachersDirectory key={hijo ?? "todos"} scope={scope} />
    </div>
  );
}
