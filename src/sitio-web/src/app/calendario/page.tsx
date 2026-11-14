import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Calendario escolar",
  description:
    "Fechas del calendario académico del Colegio Nacional Mariscal Francisco Solano López: exámenes, actos, reuniones y feriados.",
};

export const dynamic = "force-dynamic";

const TZ = "America/Asuncion";

type Evento = { id: string; date: Date; title: string; body: string | null };

function partes(d: Date, opts: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("es-PY", { timeZone: TZ, ...opts }).format(d);
}

function claveDia(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function mesLargo(d: Date): string {
  const s = partes(d, { month: "long", year: "numeric" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function mesCorto(d: Date): string {
  return partes(d, { month: "short" }).replace(".", "").toUpperCase();
}

function diaNumero(d: Date): string {
  return partes(d, { day: "2-digit" });
}

function diaSemana(d: Date): string {
  const s = partes(d, { weekday: "long" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

async function getEventos(): Promise<Evento[]> {
  try {
    return await prisma.calendarEvent.findMany({
      where: { active: true },
      orderBy: { date: "asc" },
      take: 200,
      select: { id: true, date: true, title: true, body: true },
    });
  } catch {
    return [];
  }
}

function Tarjeta({ e }: { e: Evento }) {
  return (
    <li className="flex gap-4 rounded-2xl border border-[#e6d8c9] bg-white p-4 shadow-sm sm:p-5">
      <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl border border-[#e9dccd] bg-[#fbf7f1]">
        <span className="text-xl font-black leading-none text-[var(--institutional)]">
          {diaNumero(e.date)}
        </span>
        <span className="mt-1 text-[0.65rem] font-bold tracking-wide text-[var(--gold)]">
          {mesCorto(e.date)}
        </span>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
          {diaSemana(e.date)}
        </p>
        <h3 className="mt-0.5 font-extrabold text-[var(--institutional)]">{e.title}</h3>
        {e.body && <p className="mt-1 text-sm leading-relaxed text-stone-600">{e.body}</p>}
      </div>
    </li>
  );
}

export default async function CalendarioPage() {
  const eventos = await getEventos();
  const hoy = claveDia(new Date());
  const proximos = eventos.filter((e) => claveDia(e.date) >= hoy);
  const pasados = eventos.filter((e) => claveDia(e.date) < hoy).slice(-12).reverse();

  const grupos: { label: string; items: Evento[] }[] = [];
  for (const e of proximos) {
    const label = mesLargo(e.date);
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.label === label) ultimo.items.push(e);
    else grupos.push({ label, items: [e] });
  }

  return (
    <div className="container-c max-w-4xl py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="section-title">Calendario escolar</h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            Exámenes, actos, reuniones y fechas importantes del colegio. Las fechas
            pueden actualizarse; confirmá siempre con Secretaría.
          </p>
        </div>
        <a
          href="/api/calendario/ics"
          className="btn-primary shrink-0"
          download="calendario-escolar.ics"
        >
          Descargar calendario (.ics)
        </a>
      </div>

      <section className="mt-10" aria-labelledby="proximos">
        <h2 id="proximos" className="text-xl font-extrabold text-[var(--institutional)]">
          Próximos eventos
        </h2>

        {grupos.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-[#e6d8c9] bg-white p-8 text-center text-sm text-slate-500">
            Todavía no hay fechas próximas cargadas. Dirección publica los eventos
            desde el panel de administración.
          </p>
        ) : (
          grupos.map((g) => (
            <div key={g.label} className="mt-7">
              <h3 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-[var(--gold)]">
                {g.label}
              </h3>
              <ul className="grid gap-3">
                {g.items.map((e) => (
                  <Tarjeta key={e.id} e={e} />
                ))}
              </ul>
            </div>
          ))
        )}
      </section>

      {pasados.length > 0 && (
        <details className="mt-10 rounded-2xl border border-[#e6d8c9] bg-[#fbf7f1] p-5">
          <summary className="cursor-pointer text-sm font-extrabold text-[var(--institutional)]">
            Ver eventos anteriores ({pasados.length})
          </summary>
          <ul className="mt-4 grid gap-3">
            {pasados.map((e) => (
              <Tarjeta key={e.id} e={e} />
            ))}
          </ul>
        </details>
      )}

      <p className="mt-8 text-sm text-slate-500">
        ¿Necesitás confirmar una fecha?{" "}
        <a href="/#contacto" className="font-bold text-[var(--institutional)] underline">
          Contactá a Secretaría
        </a>
        .
      </p>
    </div>
  );
}
