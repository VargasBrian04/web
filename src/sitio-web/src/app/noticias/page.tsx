import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { newsPosts } from "@/data/institucional";

export const metadata: Metadata = {
  title: "Noticias y novedades",
  description: "Blog institucional del Colegio Nacional Mariscal Francisco Solano López: anuncios, actividades y comunicados.",
};

export const dynamic = "force-dynamic";

type Card = {
  key: string;
  href: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  author: string;
  image: string | null;
};

function fmtDate(d: Date | null): string {
  if (!d) return "";
  return d.toLocaleDateString("es-PY", { day: "2-digit", month: "2-digit", year: "numeric" });
}

async function getPrincipal(): Promise<{ cards: Card[]; total: number }> {
  try {
    const [total, rows] = await Promise.all([
      prisma.newsPost.count({ where: { status: "PUBLICADA" } }),
      prisma.newsPost.findMany({
        where: { status: "PUBLICADA" },
        select: {
          id: true, slug: true, title: true, excerpt: true, category: true,
          imageUrl: true, imageFile: true, publishedAt: true, authorName: true,
        },
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        take: 4,
      }),
    ]);
    if (!rows.length) throw new Error("vacío");
    return {
      total,
      cards: (rows as any[]).map((n: any) => ({
        key: n.id,
        href: `/noticias/${n.slug}`,
        title: n.title,
        excerpt: n.excerpt ?? "",
        category: n.category,
        date: fmtDate(n.publishedAt),
        author: n.authorName ?? "Dirección",
        image: n.imageFile ? `/api/news/${n.id}/image` : n.imageUrl,
      })),
    };
  } catch {
    // Sin DB: las 4 estáticas de siempre (no se pierde la portada pública).
    return {
      total: newsPosts.length,
      cards: newsPosts.slice(0, 4).map((n) => ({
        key: n.slug,
        href: `/noticias/${n.slug}`,
        title: n.title,
        excerpt: n.excerpt,
        category: n.category,
        date: n.date.split("-").reverse().join("/"),
        author: n.author,
        image: n.image,
      })),
    };
  }
}

export default async function NoticiasPage() {
  const { cards, total } = await getPrincipal();

  return (
    <div className="container-c py-16">
      <h1 className="section-title">Noticias y novedades</h1>
      <p className="mt-3 text-slate-600">
        Publicaciones de la Dirección y la Coordinación Académica.
      </p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((n) => (
          <a
            key={n.key}
            href={n.href}
            className="block overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-md"
          >
            {n.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={n.image} alt={n.title} className="h-44 w-full object-cover" loading="lazy" />
            ) : (
              <div className="flex h-44 w-full items-center justify-center bg-[var(--paper)] text-4xl">📰</div>
            )}
            <div className="p-6">
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--gold)]">
                {n.category}{n.date ? ` · ${n.date}` : ""}
              </p>
              <h2 className="mt-2 font-bold text-slate-900">{n.title}</h2>
              <p className="mt-2 line-clamp-3 text-sm text-slate-600">{n.excerpt}</p>
              <p className="mt-3 text-xs text-slate-500">Por {n.author}</p>
            </div>
          </a>
        ))}
      </div>
      {total > cards.length && (
        <div className="mt-10 text-center">
          <a href="/noticias/todas" className="btn-primary">
            Ver más noticias →
          </a>
          <p className="mt-2 text-xs text-slate-500">
            {total - cards.length} anteriores en el archivo
          </p>
        </div>
      )}
    </div>
  );
}
