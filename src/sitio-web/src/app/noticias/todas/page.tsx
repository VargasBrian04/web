import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { newsPosts } from "@/data/institucional";

export const metadata: Metadata = {
  title: "Todas las noticias",
  description: "Archivo de noticias publicadas del colegio, de más recientes a más antiguas.",
};

export const dynamic = "force-dynamic";

const PAGE_SIZE = 9;

function fmtDate(d: Date | null): string {
  if (!d) return "";
  return d.toLocaleDateString("es-PY", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default async function TodasPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page || "1") || 1);

  let total = 0;
  let cards: {
    key: string; href: string; title: string; excerpt: string;
    category: string; date: string; author: string; image: string | null;
  }[] = [];
  try {
    const where = { status: "PUBLICADA" as const };
    [total, cards] = await Promise.all([
      prisma.newsPost.count({ where }),
      prisma.newsPost
        .findMany({
          where,
          select: {
            id: true, slug: true, title: true, excerpt: true, category: true,
            imageUrl: true, imageFile: true, publishedAt: true, authorName: true,
          },
          orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
          skip: (page - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
        })
        .then((rows: any[]) =>
          rows.map((n: any) => ({
            key: n.id,
            href: `/noticias/${n.slug}`,
            title: n.title,
            excerpt: n.excerpt ?? "",
            category: n.category,
            date: fmtDate(n.publishedAt),
            author: n.authorName ?? "Dirección",
            image: n.imageFile ? `/api/news/${n.id}/image` : n.imageUrl,
          }))
        ),
    ]);
  } catch {
    // Sin DB: archivo estático paginado en memoria.
    total = newsPosts.length;
    cards = newsPosts
      .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
      .map((n) => ({
        key: n.slug,
        href: `/noticias/${n.slug}`,
        title: n.title,
        excerpt: n.excerpt,
        category: n.category,
        date: n.date.split("-").reverse().join("/"),
        author: n.author,
        image: n.image,
      }));
  }

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="container-c py-16">
      <a href="/noticias" className="text-sm font-semibold text-[var(--institutional)] hover:underline">
        ← Blog / Noticias
      </a>
      <h1 className="section-title mt-2">Todas las noticias</h1>
      <p className="mt-3 text-slate-600">
        Archivo completo, de más recientes a más antiguas. ({total})
      </p>

      {cards.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-stone-200 bg-white p-8 text-center text-slate-500">
          Todavía no hay noticias publicadas.
        </p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
      )}

      {pages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-3">
          {page > 1 && (
            <a href={`/noticias/todas?page=${page - 1}`} className="btn-primary">
              ← Anterior
            </a>
          )}
          <span className="text-sm font-bold text-slate-600">
            Página {page} de {pages}
          </span>
          {page < pages && (
            <a href={`/noticias/todas?page=${page + 1}`} className="btn-primary">
              Siguiente →
            </a>
          )}
        </div>
      )}
    </div>
  );
}
