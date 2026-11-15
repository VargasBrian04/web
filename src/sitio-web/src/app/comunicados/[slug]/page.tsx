import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { sanitizeHtml } from "@/lib/news";

export const dynamic = "force-dynamic";

function fmtDate(d: Date | null): string {
  if (!d) return "";
  return d.toLocaleDateString("es-PY", { day: "2-digit", month: "long", year: "numeric" });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const n = await prisma.publicNotice
    .findUnique({
      where: { slug },
      select: { title: true, summary: true, active: true, publishedAt: true },
    })
    .catch(() => null);
  if (!n || !n.active || !n.publishedAt) return { title: "Comunicado no encontrado" };
  return {
    title: n.title,
    description: n.summary || undefined,
    openGraph: { type: "article", title: n.title, description: n.summary || undefined },
  };
}

type File = { id: string; name: string; mime: string; size: number };

function kbLabel(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${Math.round(b / 1024)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function icono(mime: string): string {
  if (mime === "application/pdf") return "PDF";
  if (mime.startsWith("image/")) return "IMG";
  return "ARCH";
}

export default async function ComunicadoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const n = await prisma.publicNotice
    .findUnique({
      where: { slug },
      include: { files: { orderBy: { createdAt: "asc" } } },
    })
    .catch(() => null);
  if (!n || !n.active || !n.publishedAt) notFound();

  const files = n.files as File[];
  const html = sanitizeHtml(n.body);

  return (
    <div className="container-c max-w-4xl py-14">
      <p className="text-xs font-black uppercase tracking-wide text-[var(--gold)]">
        {n.category}
      </p>
      <h1 className="mt-1 text-3xl font-black leading-tight text-[var(--institutional)] sm:text-4xl">
        {n.title}
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        Comunicado del {fmtDate(n.publishedAt)}
        {n.pinned ? " · fijado por Dirección" : ""}
      </p>

      <article className="mt-8 rounded-2xl border border-[#e6d8c9] bg-white p-5 shadow-sm sm:p-8">
        <div
          className="[&_a]:font-semibold [&_a]:text-[var(--institutional)] [&_a]:underline [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-extrabold [&_h2]:text-[var(--institutional)] [&_h3]:mt-5 [&_h3]:font-bold [&_li]:mt-1 [&_ol]:mt-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mt-5 [&_p]:leading-relaxed [&_p]:text-stone-700 [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-6"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </article>

      {files.length > 0 && (
        <section className="mt-8" aria-labelledby="adjuntos">
          <h2 id="adjuntos" className="text-lg font-extrabold text-[var(--institutional)]">
            Adjuntos ({files.length})
          </h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {files.map((f) => (
              <li
                key={f.id}
                className="flex items-center gap-3 rounded-2xl border border-[#e6d8c9] bg-white p-4 shadow-sm"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#fbf7f1] text-xs font-black text-[var(--gold)]">
                  {icono(f.mime)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-stone-700">{f.name}</p>
                  <p className="text-xs text-slate-400">{kbLabel(f.size)}</p>
                </div>
                <a
                  href={`/api/comunicados-publicos/${f.id}`}
                  download={f.name}
                  className="shrink-0 rounded-lg bg-[var(--institutional)] px-3 py-1.5 text-xs font-bold text-white"
                >
                  Descargar
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <a
          href="/comunicados"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-600"
        >
          Volver a comunicados
        </a>
      </div>
    </div>
  );
}