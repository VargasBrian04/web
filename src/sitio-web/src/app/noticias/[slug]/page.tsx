import { notFound } from "next/navigation";
import { newsPosts } from "@/data/institucional";

export function generateStaticParams() {
  return newsPosts.map((n) => ({ slug: n.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = newsPosts.find((n) => n.slug === slug);
  if (!post) return { title: "Noticia no encontrada" };
  return { title: post.title, description: post.excerpt };
}

export default async function NoticiaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = newsPosts.find((n) => n.slug === slug);
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
        <div className="mt-3 overflow-hidden rounded-2xl border-2 border-[#e8d3a3] bg-[#fffdf6]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.image} alt={post.title} className="max-h-[440px] w-full object-cover" />
        </div>
        <div className="mt-3 rounded-2xl border-2 border-[#e8d3a3] bg-[#fffdf6] p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--gold)]">
            {post.category} · {post.date} · Por {post.author}
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-[var(--institutional)] sm:text-4xl">
            {post.title}
          </h1>
          {post.content.map((p, i) => (
            <p key={i} className="mt-5 leading-relaxed text-stone-700">
              {p}
            </p>
          ))}
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
