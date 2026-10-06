import NewsAdmin from "@/components/portal/NewsAdmin";

export const metadata = { title: "Gestionar noticias — Docente" };

/** Docente gestiona noticias del blog (misma herramienta que Dirección). */
export default function ProfesorNoticiasPage() {
  return (
    <div className="grid gap-6">
      <section className="rounded-2xl bg-[var(--institutional)] p-6 text-white">
        <h2 className="text-xl font-extrabold">Noticias del colegio</h2>
        <p className="mt-1 text-sm text-stone-200">
          Creá, editá y publicá noticias. Solo lo publicado aparece en el sitio.
        </p>
      </section>
      <NewsAdmin />
    </div>
  );
}
