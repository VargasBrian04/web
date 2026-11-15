import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Directorio y horarios",
  description:
    "Contactos y horarios de atención del Colegio Nacional Mariscal Francisco Solano López: Secretaría, Dirección, bedelía y orientación.",
};

export const dynamic = "force-dynamic";

type Area = {
  id: string;
  name: string;
  detail: string | null;
  phone: string | null;
  email: string | null;
  hours: string | null;
};

async function getAreas(): Promise<Area[]> {
  try {
    return await prisma.contactArea.findMany({
      where: { active: true },
      orderBy: [{ order: "asc" }, { name: "asc" }],
      take: 30,
      select: { id: true, name: true, detail: true, phone: true, email: true, hours: true },
    });
  } catch {
    return [];
  }
}

/** Solo deja pasar rutas internas o http(s). */
function enlaceSeguro(v: string | null): string | null {
  if (!v) return null;
  if (v.startsWith("/") && !v.startsWith("//")) return v;
  if (/^https?:\/\//i.test(v)) return v;
  return null;
}

export default async function DirectorioPage() {
  const areas = await getAreas();
  const conDatos = areas.filter((a) => a.phone || a.email || a.hours || a.detail);

  return (
    <div className="container-c max-w-4xl py-14">
      <h1 className="section-title">Directorio y horarios de atención</h1>
      <p className="mt-2 max-w-2xl text-slate-600">
        Contactos por área del Colegio Nacional Mariscal Francisco Solano López. Si
        necesitás algo urgente, Secretaría es la mejor puerta de entrada.
      </p>

      {conDatos.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-[#e6d8c9] bg-white p-8 text-center text-sm text-slate-500">
          El directorio todavía no está cargado. Dirección lo completa desde el panel
          de administración.
        </p>
      ) : (
        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {conDatos.map((a) => {
            const correo = enlaceSeguro(a.email);
            return (
              <li key={a.id} className="rounded-2xl border border-[#e6d8c9] bg-white p-5 shadow-sm">
                <h2 className="font-extrabold text-[var(--institutional)]">{a.name}</h2>
                {a.detail && <p className="mt-1 text-sm text-stone-600">{a.detail}</p>}
                <dl className="mt-3 grid gap-1.5 text-sm">
                  {a.phone && (
                    <div className="flex gap-2">
                      <dt className="font-bold text-[var(--gold)]">Teléfono:</dt>
                      <dd className="text-stone-700">{a.phone}</dd>
                    </div>
                  )}
                  {correo && (
                    <div className="flex gap-2">
                      <dt className="font-bold text-[var(--gold)]">Correo:</dt>
                      <dd>
                        <a href={correo} className="font-semibold text-[var(--institutional)] underline">
                          {a.email}
                        </a>
                      </dd>
                    </div>
                  )}
                  {a.hours && (
                    <div className="flex gap-2">
                      <dt className="font-bold text-[var(--gold)]">Horario:</dt>
                      <dd className="text-stone-700">{a.hours}</dd>
                    </div>
                  )}
                </dl>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-8 text-sm text-slate-500">
        ¿Querés escribirnos?{" "}
        <a href="/#contacto" className="font-bold text-[var(--institutional)] underline">
          Usá el formulario de contacto
        </a>
        .
      </p>
    </div>
  );
}