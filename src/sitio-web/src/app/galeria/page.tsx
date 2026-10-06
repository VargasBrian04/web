import { prisma } from "@/lib/prisma";

export const metadata = { title: "Galería" };
export const dynamic = "force-dynamic";

/** /galeria — álbumes públicos por zona (las fotos que sube Dirección). */
export default async function GaleriaPage() {
  let groups: { slot: string; items: { url: string; caption: string | null }[] }[] = [];
  try {
    const rows = await prisma.galleryItem.findMany({
      select: { id: true, slot: true, caption: true, imageFile: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    const map = new Map<string, { url: string; caption: string | null }[]>();
    for (const r of rows) {
      const url = r.imageFile.startsWith("data:")
        ? r.imageFile
        : `/api/media/${r.id}/image`;
      if (!map.has(r.slot)) map.set(r.slot, []);
      map.get(r.slot)!.push({ url, caption: r.caption });
    }
    groups = [...map.entries()].map(([slot, items]) => ({ slot, items }));
  } catch {
    groups = [];
  }
  const NAMES: Record<string, string> = { GALERIA: "Galería general" };
  return (
    <section className="container-c max-w-5xl py-14">
      <h1 className="section-title">Galería</h1>
      <p className="mt-2 text-slate-600">Álbumes por zona, publicados por Dirección.</p>
      {groups.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-stone-200 bg-white p-8 text-center text-slate-500">
          Todavía no hay álbumes publicados.
        </p>
      ) : (
        <div className="mt-8 grid gap-8">
          {groups.map((g) => (
            <div key={g.slot}>
              <h2 className="font-extrabold text-[var(--institutional)]">
                {NAMES[g.slot] ?? g.slot} ({g.items.length})
              </h2>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {g.items.map((it, i) => (
                  <figure key={i} className="overflow-hidden rounded-xl border border-stone-200 bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={it.url} alt={it.caption ?? ""} className="h-36 w-full object-cover" loading="lazy" />
                    {it.caption && <figcaption className="truncate px-2 py-1 text-xs text-slate-500">{it.caption}</figcaption>}
                  </figure>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
