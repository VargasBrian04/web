import { prisma } from "@/lib/prisma";
import EnrollmentWizard from "@/components/enrollments/EnrollmentWizard";

export const metadata = { title: "Inscripciones" };

/**
 * /inscripciones — Portal público. Sin DB configurada muestra aviso
 * en vez de romper (los módulos con datos requieren PostgreSQL).
 */
export default async function InscripcionesPage() {
  let academics: { id: string; code: string; shortName: string; name: string; type: string }[] = [];
  let dbReady = true;
  try {
    academics = await prisma.academic.findMany({
      where: { active: true },
      select: { id: true, code: true, shortName: true, name: true, type: true },
      orderBy: { name: "asc" }
    });
  } catch {
    dbReady = false;
  }

  return (
    <section className="container-c max-w-3xl py-14">
      <p className="inline-flex rounded-full bg-[var(--gold)] px-4 py-1 text-xs font-bold uppercase tracking-wide text-white">
        Inscripciones {new Date().getFullYear()}
      </p>
      <h1 className="section-title mt-3">Solicitud de inscripción online</h1>
      <p className="mt-2 text-slate-600">
        Completá los 3 pasos. Tu solicitud ingresa como <strong>PENDIENTE</strong> y
        Secretaría la revisa (Aprueba / Rechaza).
      </p>

      <div className="mt-8">
        {dbReady ? (
          <EnrollmentWizard academics={academics} />
        ) : (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
            <strong>Módulo en pausa:</strong> la base de datos no está disponible.
            Levantala con <code>docker compose up -d</code> y luego{" "}
            <code>npx prisma migrate dev</code> + <code>npm run seed</code>.
          </div>
        )}
      </div>
    </section>
  );
}
