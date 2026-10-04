import AdminBoard from "@/components/portal/AdminBoard";
import AdminUsers from "@/components/portal/AdminUsers";
import AccountRequests from "@/components/portal/AccountRequests";

export const metadata = { title: "Panel de Administración" };

/**
 * Panel de Dirección/Secretaría: estadísticas y bandeja de inscripciones.
 * Lee GET /api/admin/stats + GET /api/enrollments y aprueba con PATCH.
 * Más abajo: registro de usuarios con rol (solo Admin crea cuentas).
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
      <AdminBoard />
      <AccountRequests />
      <AdminUsers />
    </div>
  );
}
