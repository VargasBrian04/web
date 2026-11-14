import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { newsPosts } from "@/data/institucional";
import { sanitizeHtml } from "@/lib/news";

export const dynamic = "force-dynamic";

function fmtDate(d: Date | null): string {
  if (!d) return "";
  return d.toLocaleDateString("es-PY", { day: "2-digit", month: "2-digit", year: "numeric" });
}

type View = {
  title: string;
  excerpt: string;
  contentHtml: string | null;
  paragraphs: string[];
  category: string;
  date: string;
  author: string;
  image: string | null;
};

type Relacionada = {
  key: string;
  href: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  image: string | null;
};

async function getPost(slug: string): Promise<View | null> {
  try {
    const n = await prisma.newsPost.findUnique({
      where: { slug },
      select: {
        title: true, excerpt: true, content: true, category: true,
        imageUrl: true, imageFile: true, id: true,
        status: true, publishedAt: true, authorName: true,
      },
    });
    if (n && n.status === "PUBLICADA") {
      return {
        title: n.title,
        excerpt: n.excerpt ?? "",
        contentHtml: sanitizeHtml(n.content),
        paragraphs: [],
        category: n.category,
        date: fmtDate(n.publishedAt),
        author: n.authorName ?? "Dirección",
        image: n.imageFile ? `/api/news/${n.id}/image` : n.imageUrl,
      };
    }
  } catch {
    // sin DB: abajo el fallback estático
  }
  const post = newsPosts.find((p) => p.slug === slug);
  if (!post) return null;
  return {
    title: post.title,
    excerpt: post.excerpt,
    contentHtml: null,
    paragraphs: post.content,
    category: post.category,
    date: post.date.split("-").reverse().join("/"),
    author: post.author,
    image: post.image,
  };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Noticia no encontrada" };
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      ...(post.image ? { images: [post.image] } : {}),
    },
  };
}

/** Tres noticias publicadas de la misma categoría, sin repetir la actual. */
async function getRelacionadas(category: string, slug: string): Promise<Relacionada[]> {
  try {
    const rows = await prisma.newsPost.findMany({
      where: { status: "PUBLICADA", category, slug: { not: slug } },
      select: {
        id: true, slug: true, title: true, excerpt: true, category: true,
        imageUrl: true, imageFile: true, publishedAt: true,
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 3,
    });
    return rows.map((n) => ({
      key: n.id,
      href: `/noticias/${n.slug}`,
      title: n.title,
      excerpt: n.excerpt ?? "",
      category: n.category,
      date: fmtDate(n.publishedAt),
      image: n.imageFile ? `/api/news/${n.id}/image` : n.imageUrl,
    }));
  } catch {
    return newsPosts
      .filter((p) => p.category === category && p.slug !== slug)
      .slice(0, 3)
      .map((p) => ({
        key: p.slug,
        href: `/noticias/${p.slug}`,
        title: p.title,
        excerpt: p.excerpt,
        category: p.category,
        date: p.date.split("-").reverse().join("/"),
        image: p.image,
      }));
  }
}

export default async function NoticiaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();
  const relacionadas = await getRelacionadas(post.category, slug);

  return (
    <div className="container-c max-w-4xl py-16">
      <article>
      <a href="/noticias" className="text-sm font-semibold text-[var(--institutional)] hover:underline">
        ← Todas las noticias
      </a>
      <div className="mt-6 overflow-hidden rounded-3xl border-2 border-[#c9a35c] bg-gradient-to-b from-[#4a0e18] to-[#2b060d] p-3 shadow-[0_30px_80px_rgba(0,0,0,0.35)] sm:p-4">
        <div className="relative flex items-center gap-3 overflow-hidden rounded-2xl border border-[#c9a35c] bg-gradient-to-r from-[#5d0f1d] to-[#3a0912] p-4">
          <span className="pointer-events-none absolute inset-y-[-30%] left-[60%] w-6 skew-x-[-24deg] bg-[#c9a35c]" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/logo-nuevo.png"
            alt="Escudo del colegio"
            className="h-14 w-14 shrink-0 rounded-full border-2 border-[#c9a35c] bg-white object-cover"
          />
          <div>
            <p className="text-2xl font-black tracking-wide text-white">NOTICIAS</p>
            <p className="text-sm text-[#e9c98f]">Novedades y comunicados del colegio</p>
          </div>
          <span className="z-10 ml-auto text-3xl">📢</span>
        </div>
        {post.image && (
          <div className="mt-3 overflow-hidden rounded-2xl border-2 border-[#e8d3a3] bg-[#fffdf6]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.image} alt={post.title} className="max-h-[440px] w-full object-cover" />
          </div>
        )}
        <div className="mt-3 rounded-2xl border-2 border-[#e8d3a3] bg-[#fffdf6] p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--gold)]">
            {post.category}{post.date ? ` · ${post.date}` : ""} · Por {post.author}
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-[var(--institutional)] sm:text-4xl">
            {post.title}
          </h1>
          {post.contentHtml ? (
            <div
              className="[&_a]:font-semibold [&_a]:text-[var(--institutional)] [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-[var(--gold)] [&_blockquote]:pl-4 [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-extrabold [&_h2]:text-[var(--institutional)] [&_h3]:mt-5 [&_h3]:font-bold [&_li]:mt-1 [&_ol]:mt-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mt-5 [&_p]:leading-relaxed [&_p]:text-stone-700 [&_strong]:font-extrabold [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-6"
              dangerouslySetInnerHTML={{ __html: post.contentHtml }}
            />
          ) : (
            post.paragraphs.map((p, i) => (
              <p key={i} className="mt-5 leading-relaxed text-stone-700">
                {p}
              </p>
            ))
          )}
        </div>
        <div className="flex justify-center pb-1 pt-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#c9a35c] bg-[#4a0e18] text-2xl shadow-lg">
            📖
          </span>
        </div>
      </div>
      </article>

      {relacionadas.length > 0 && (
        <section className="mt-12" aria-labelledby="relacionadas">
          <h2 id="relacionadas" className="text-xl font-extrabold text-[var(--institutional)]">
            Más de {post.category}
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {relacionadas.map((r) => (
              <a
                key={r.key}
                href={r.href}
                className="group overflow-hidden rounded-2xl border border-[#e6d8c9] bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                {r.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={r.image}
                    alt=""
                    className="h-32 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-32 items-center justify-center bg-[#fbf7f1] text-3xl text-[var(--gold)]" aria-hidden="true">
                    📰
                  </div>
                )}
                <div className="p-4">
                  <p className="text-[0.68rem] font-bold uppercase tracking-wide text-[var(--gold)]">
                    {r.category}
                    {r.date ? ` · ${r.date}` : ""}
                  </p>
                  <h3 className="mt-1 line-clamp-2 font-extrabold leading-snug text-[var(--institutional)] group-hover:underline">
                    {r.title}
                  </h3>
                  {r.excerpt && (
                    <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-stone-600">
                      {r.excerpt}
                    </p>
                  )}
                </div>
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
