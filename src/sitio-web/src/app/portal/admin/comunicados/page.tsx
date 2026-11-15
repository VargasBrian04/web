import NoticesAdmin from "@/components/portal/NoticesAdmin";

export const metadata = { title: "Comunicados públicos — Administración" };

/**
 * Comunicados de Dirección/Secretaría (con adjuntos). Protegida por el
 * layout de /portal/admin y por el middleware (solo rol ADMIN).
 */
export default function AdminComunicadosPage() {
  return (
    <div className="grid gap-6">
      <section className="rounded-2xl bg-[var(--institutional)] p-6 text-white">
        <h2 className="text-xl font-extrabold">Comunicados públicos</h2>
        <p className="mt-1 text-sm text-stone-200">
          Circulares, cronogramas y formularios. Se publican en /comunicados y se
          descargan sin iniciar sesión.
        </p>
      </section>
      <NoticesAdmin />
    </div>
  );
}