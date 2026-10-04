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
  return { title: post.title, description: post.excerpt };
}

export default async function NoticiaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  return (
    <article className="container-c max-w-4xl py-16">
      <a href="/noticias" className="text-sm font-semibold text-[var(--institutional)] hover:underline">
        ← Todas las noticias
      </a>
      <div className="mt-6 overflow-hidden rounded-3xl border-2 border-[#c9a35c] bg-gradient-to-b from-[#4a0e18] to-[#2b060d] p-3 shadow-[0_30px_80px_rgba(0,0,0,0.35)] sm:p-4">
        <div className="relative flex items-center gap-3 overflow-hidden rounded-2xl border border-[#c9a35c] bg-gradient-to-r from-[#5d0f1d] to-[#3a0912] p-4">
          <span className="pointer-events-none absolute inset-y-[-30%] left-[60%] w-6 skew-x-[-24deg] bg-[#c9a35c]" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/logo-colegio.png"
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
  );
}
