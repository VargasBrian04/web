import DirectoryAdmin from "@/components/portal/DirectoryAdmin";

export const metadata = { title: "Directorio — Administración" };

/**
 * Contactos y horarios por área (Dirección). Protegida por el layout de
 * /portal/admin y por el middleware (solo rol ADMIN).
 */
export default function AdminDirectorioPage() {
  return (
    <div className="grid gap-6">
      <section className="rounded-2xl bg-[var(--institutional)] p-6 text-white">
        <h2 className="text-xl font-extrabold">Directorio público</h2>
        <p className="mt-1 text-sm text-stone-200">
          Teléfonos, correos y horarios de atención por área. Se publican en
          /directorio para que las familias sepan a quién llamar.
        </p>
      </section>
      <DirectoryAdmin />
    </div>
  );
}