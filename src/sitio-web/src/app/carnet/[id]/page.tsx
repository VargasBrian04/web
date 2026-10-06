import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** /carnet/[id] — verificación pública de identidad (solo nombre, curso y estado). */
export default async function VerificarCarnet({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const student = await prisma.student.findUnique({
    where: { id },
    select: {
      user: { select: { firstName: true, lastName: true, active: true } },
      academic: { select: { name: true, shortName: true } },
      enrollmentYear: true,
    },
  });
  if (!student) notFound();
  const nombre = `${student.user.firstName} ${student.user.lastName}`;

  return (
    <div className="container-c max-w-md py-16">
      <div className="rounded-3xl border-2 border-[#c9a35c] bg-white p-8 text-center shadow-xl">
        <p className="text-5xl">{student.user.active ? "✅" : "⛔"}</p>
        <h1 className="mt-3 text-2xl font-extrabold text-[var(--institutional)]">{nombre}</h1>
        <p className="mt-2 text-sm text-slate-600">
          {student.academic ? student.academic.name : "Sin bachillerato asignado"}
          {student.enrollmentYear ? ` · Ingreso ${student.enrollmentYear}` : ""}
        </p>
        <p
          className={`mt-4 inline-block rounded-full px-4 py-1.5 text-sm font-bold ${
            student.user.active ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
          }`}
        >
          {student.user.active ? "Estudiante activo" : "Cuenta inactiva"}
        </p>
      </div>
    </div>
  );
}
