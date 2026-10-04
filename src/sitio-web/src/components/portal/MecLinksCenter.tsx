/**
 * Centro de Enlaces Oficiales del MEC — tarjeta destacada del panel de
 * Padres/Alumnos. Las calificaciones OFICIALES (libretas, documentos) las
 * emite el Ministerio; el colegio solo enlaza a su plataforma para que la
 * familia consulte sin fricciones. Las notas que veas más abajo son
 * INTERNAS (carga del profesor antes de oficializar).
 */

const MEC_FAMILIA_URL = "https://aprendizaje.mec.edu.py/aprendizaje/familia/documentos";
const MEC_PORTAL_URL = "https://www.mec.gov.py/";

export default function MecLinksCenter() {
  return (
    <section className="overflow-hidden rounded-2xl border-2 border-[#0b3d9e] bg-white shadow-md">
      <div className="flex items-center gap-3 bg-[#0b3d9e] px-6 py-4 text-white">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg font-extrabold text-[#0b3d9e]">
          M
        </span>
        <div>
          <h2 className="text-lg font-extrabold leading-tight">
            Centro de Enlaces Oficiales del MEC
          </h2>
          <p className="text-xs text-blue-100">
            Ministerio de Educación y Ciencias · Paraguay — consulta oficial de notas y documentos
          </p>
        </div>
      </div>

      <div className="grid gap-4 p-6 md:grid-cols-2">
        {/* Acceso principal */}
        <a
          href={MEC_FAMILIA_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex flex-col rounded-xl bg-[#0b3d9e] p-5 text-white transition-transform hover:scale-[1.01]"
        >
          <span className="text-xs font-bold uppercase tracking-wide text-blue-200">
            Acceso principal · Familias
          </span>
          <span className="mt-1 text-lg font-extrabold leading-snug">
            Consultar notas, libretas y documentos académicos ↗
          </span>
          <span className="mt-2 text-sm text-blue-100">
            Plataforma oficial de aprendizaje del MEC para la familia.
          </span>
        </a>

        <div className="flex flex-col gap-4">
          <a
            href={MEC_PORTAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded-xl border border-slate-200 p-5 transition-colors hover:border-[#0b3d9e]"
          >
            <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Institucional
            </span>
            <span className="block text-base font-bold text-slate-900">
              Portal del MEC ↗
            </span>
            <span className="text-sm text-slate-500">Noticias, calendario y trámites ministeriales.</span>
          </a>

          <div className="flex-1 rounded-xl bg-slate-50 p-5">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Guía rápida
            </span>
            <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm text-slate-600">
              <li>Pulsá el botón azul de arriba (se abre el MEC).</li>
              <li>Identificá al estudiante con su C.I.</li>
              <li>Descargá libreta o documentos en PDF.</li>
            </ol>
          </div>
        </div>
      </div>

      <p className="border-t border-slate-100 bg-slate-50 px-6 py-3 text-xs text-slate-500">
        Aclaración: el colegio no emite calificaciones oficiales en este sitio. Lo que sigue
        son <strong>notas internas</strong> de seguimiento hasta su oficialización en el MEC.
      </p>
    </section>
  );
}
