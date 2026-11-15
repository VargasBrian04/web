import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Comunicados oficiales",
  description:
    "Comunicados de Dirección y Secretaría del Colegio Nacional Mariscal Francisco Solano López, con sus planillas y circulares en PDF para descargar.",
};

export const dynamic = "force-dynamic";

function fmtDate(d: Date | null): string {
  if (!d) return "";
  return d.toLocaleDateString("es-PY", { day: "2-digit", month: "2-digit", year: "numeric" });
}

type Item = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  pinned: boolean;
  date: string;
  files: { id: string; name: string; mime: string; size: number }[];
};

async function getComunicados(): Promise<Item[]> {
  try {
    const rows = await prisma.publicNotice.findMany({
      where: { active: true, publishedAt: { not: null } },
      orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }],
      take: 40,
      select: {
        id: true, slug: true, title: true, summary: true, body: true,
        category: true, pinned: true, publishedAt: true,
        files: { select: { id: true, name: true, mime: true, size: true } },
      },
    });
    return rows.map((n) => ({
      id: n.id,
      slug: n.slug,
      title: n.title,
      summary: n.summary || n.body.replace(/<[^>]*>/g, " ").slice(0, 180),
      category: n.category,
      pinned: n.pinned,
      date: fmtDate(n.publishedAt),
      files: n.files,
    }));
  } catch {
    return [];
  }
}

export default async function ComunicadosPage() {
  const lista = await getComunicados();

  return (
    <div className="container-c max-w-4xl py-14">
      <h1 className="section-title">Comunicados oficiales</h1>
      <p className="mt-2 max-w-2xl text-slate-600">
        Avisos y circulares de Dirección y Secretaría. Cuando un comunicado tiene
        planillas o formularios, se descargan en PDF desde esta misma página.
      </p>

      {lista.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-[#e6d8c9] bg-white p-8 text-center text-sm text-slate-500">
          Todavía no hay comunicados publicados. Dirección los publica desde el
          panel de administración.
        </p>
      ) : (
        <ul className="mt-8 grid gap-3">
          {lista.map((c) => (
            <li
              key={c.id}
              className="rounded-2xl border border-[#e6d8c9] bg-white p-4 shadow-sm sm:p-5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-[#fbf7f1] px-2 py-0.5 text-[0.65rem] font-black uppercase tracking-wide text-[var(--gold)]">
                  {c.category}
                </span>
                {c.pinned && (
                  <span className="rounded-md bg-[var(--institutional)] px-2 py-0.5 text-[0.65rem] font-black uppercase tracking-wide text-white">
                    Fijado
                  </span>
                )}
                <span className="text-xs font-bold text-slate-400">{c.date}</span>
                <span className="text-xs font-bold text-slate-400">
                  {c.files.length === 1 ? "1 adjunto" : c.files.length > 1 ? `${c.files.length} adjuntos` : ""}
                </span>
              </div>
              <h2 className="mt-2 text-lg font-extrabold text-[var(--institutional)]">
                <a href={`/comunicados/${c.slug}`} className="hover:underline">
                  {c.title}
                </a>
              </h2>
              {c.summary && (
                <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-stone-600">{c.summary}</p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <a
                  href={`/comunicados/${c.slug}`}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-600"
                >
                  Leer el comunicado
                </a>
                {c.files.slice(0, 1).map((f) => (
                  <a
                    key={f.id}
                    href={`/api/comunicados-publicos/${f.id}`}
                    download={f.name}
                    className="rounded-lg bg-[var(--institutional)] px-3 py-1.5 text-xs font-bold text-white"
                  >
                    Descargar {f.mime === "application/pdf" ? "PDF" : "archivo"}
                  </a>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-8 text-sm text-slate-500">
        ¿Buscás algo que no está acá?{" "}
        <a href="/#contacto" className="font-bold text-[var(--institutional)] underline">
          Contactá a Secretaría
        </a>
        .
      </p>
    </div>
  );
}