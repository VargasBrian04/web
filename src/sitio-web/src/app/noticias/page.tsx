import type { Metadata } from "next";
import { newsPosts } from "@/data/institucional";

export const metadata: Metadata = {
  title: "Noticias y novedades",
  description: "Blog institucional del Colegio Nacional Mariscal Francisco Solano López: anuncios, actividades y comunicados.",
};

export default function NoticiasPage() {
  return (
    <div className="container-c py-16">
      <h1 className="section-title">Noticias y novedades</h1>
      <p className="mt-3 text-slate-600">
        Publicaciones de la Dirección y la Coordinación Académica.
      </p>
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {newsPosts.map((n) => (
          <a
            key={n.slug}
            href={`/noticias/${n.slug}`}
            className="block overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-md"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={n.image} alt={n.title} className="h-44 w-full object-cover" loading="lazy" />
            <div className="p-6">
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--gold)]">
                {n.category} · {n.date}
              </p>
              <h2 className="mt-2 font-bold text-slate-900">{n.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{n.excerpt}</p>
              <p className="mt-3 text-xs text-slate-500">Por {n.author}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
