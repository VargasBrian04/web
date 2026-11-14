import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const TZ = "America/Asuncion";

/** Fecha para un evento de día completo en formato YYYYMMDD (zona de Paraguay). */
function icsDia(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(d)
    .replace(/-/g, "");
}

function escapar(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** Calendario descargable (.ics) con los eventos públicos activos. */
export async function GET() {
  let eventos: { id: string; date: Date; title: string; body: string | null }[] = [];
  try {
    eventos = await prisma.calendarEvent.findMany({
      where: { active: true },
      orderBy: { date: "asc" },
      take: 200,
      select: { id: true, date: true, title: true, body: true },
    });
  } catch {
    // Sin base de datos: se entrega un calendario vacío válido.
  }

  const stamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const lineas = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Colegio Nacional Mariscal Francisco Solano Lopez//Calendario escolar//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Calendario escolar - Colegio Solano Lopez",
    "X-WR-TIMEZONE:America/Asuncion",
  ];

  for (const e of eventos) {
    lineas.push(
      "BEGIN:VEVENT",
      `UID:${e.id}@colegio-solano-lopez`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${icsDia(e.date)}`,
      `SUMMARY:${escapar(e.title)}`,
      ...(e.body ? [`DESCRIPTION:${escapar(e.body)}`] : []),
      "TRANSP:TRANSPARENT",
      "END:VEVENT"
    );
  }
  lineas.push("END:VCALENDAR");

  return new Response(lineas.join("\r\n"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="calendario-escolar.ics"',
      "Cache-Control": "public, max-age=3600",
    },
  });
}
