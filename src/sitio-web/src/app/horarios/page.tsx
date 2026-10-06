import { prisma } from "@/lib/prisma";

export const metadata = { title: "Horarios" };
export const dynamic = "force-dynamic";

/** /horarios — grillas de clase por curso y turno (lo carga Dirección). */
export default async function HorariosPage() {
  let rows: { id: string; curso: string; turno: string; detalle: string }[] = [];
  try {
    rows = await prisma.timetable.findMany({
      where: { active: true },
      select: { id: true, curso: true, turno: true, detalle: true },
      orderBy: [{ curso: "asc" }],
    });
  } catch {
    rows = [];
  }
  return (
    <section className="container-c max-w-4xl py-14">
      <h1 className="section-title">Horarios de clase</h1>
      <p className="mt-2 text-slate-600">Grillas por curso y turno, publicadas por Dirección.</p>
      {rows.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-stone-200 bg-white p-8 text-center text-slate-500">
          Todavía no hay horarios publicados.
        </p>
      ) : (
        <div className="mt-8 grid gap-4">
          {rows.map((h) => (
            <article key={h.id} className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <p className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-extrabold text-[var(--institutional)]">{h.curso}</span>
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                  Turno {h.turno === "MAÑANA" ? "Mañana" : "Tarde"}
                </span>
              </p>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-700">{h.detalle}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
