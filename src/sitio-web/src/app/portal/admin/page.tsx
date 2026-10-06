import AdminTabs from "@/components/portal/AdminTabs";

export const metadata = { title: "Panel de Administración" };

/**
 * Panel de Dirección/Secretaría ordenado por pestañas:
 * inscripciones, cuentas, contenido, académico y auditoría.
 */
export default function AdminPage() {
  return (
    <div className="grid gap-6">
      <section className="rounded-2xl bg-[var(--institutional)] p-6 text-white">
        <h2 className="text-xl font-extrabold">Administración / Secretaría</h2>
        <p className="mt-1 text-sm text-stone-200">
          Revisá solicitudes de inscripción, aprobá aspirantes (pasan a ALUMNO),
          registrá docentes y tutores, y vinculá tutores con alumnos.
        </p>
      </section>
      <AdminTabs />
    </div>
  );
}
