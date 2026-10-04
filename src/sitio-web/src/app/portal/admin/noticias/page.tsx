import NewsAdmin from "@/components/portal/NewsAdmin";

export const metadata = { title: "Blog / Noticias — Administración" };

/**
 * Administración del blog (Dirección). Protegida por middleware:
 * /portal/admin solo admite rol ADMIN (ver src/middleware.ts).
 */
export default function AdminNoticiasPage() {
  return (
    <div className="grid gap-6">
      <section className="rounded-2xl bg-[var(--institutional)] p-6 text-white">
        <h2 className="text-xl font-extrabold">📰 Blog / Noticias</h2>
        <p className="mt-1 text-sm text-stone-200">
          Creá, editá y publicá noticias. Solo lo publicado aparece en el sitio.
        </p>
      </section>
      <NewsAdmin />
    </div>
  );
}
