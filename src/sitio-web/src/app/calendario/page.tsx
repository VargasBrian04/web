import { prisma } from "@/lib/prisma";

export const metadata = { title: "Calendario académico" };
export const dynamic = "force-dynamic";

function fmt(d: Date): string {
  return d.toLocaleDateString("es-PY", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** /calendario — fechas importantes del ciclo lectivo. */
export default async function CalendarioPage() {
  let rows: { id: string; date: Date; title: string; body: string | null }[] = [];
  try {
    rows = await prisma.calendarEvent.findMany({
      where: { active: true },
      select: { id: true, date: true, title: true, body: true },
      orderBy: [{ date: "asc" }],
      take: 100,
    });
  } catch {
    rows = [];
  }
  return (
    <section className="container-c max-w-4xl py-14">
      <h1 className="section-title">Calendario académico</h1>
      <p className="mt-2 text-slate-600">Fechas importantes del ciclo lectivo.</p>
      {rows.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-stone-200 bg-white p-8 text-center text-slate-500">
          Todavía no hay fechas publicadas.
        </p>
      ) : (
        <ol className="mt-8 grid gap-3">
          {rows.map((e) => (
            <li key={e.id} className="flex gap-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <span className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-[var(--institutional)] text-white">
                <b className="text-lg leading-none">{String(e.date.getDate()).padStart(2, "0")}</b>
                <small className="text-[10px] uppercase">
                  {e.date.toLocaleDateString("es-PY", { month: "short" })}
                </small>
              </span>
              <div>
                <p className="font-extrabold text-[var(--institutional)]">{e.title}</p>
                <p className="text-xs text-slate-400">{fmt(e.date)}</p>
                {e.body && <p className="mt-1 text-sm text-slate-600">{e.body}</p>}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
