import Polls from "@/components/encuestas/Polls";

export const metadata = { title: "Encuestas" };

/** Ilustración minimalista: urna con papeleta y check. */
function UrnaIlustracion() {
  return (
    <svg
      viewBox="0 0 160 130"
      role="img"
      aria-label="Urna de votación con una papeleta y un check"
      className="mx-auto mb-5 h-28 w-auto"
    >
      <ellipse cx="80" cy="118" rx="52" ry="6" fill="#e9dccd" />
      <rect x="30" y="72" width="100" height="44" rx="8" fill="#8a5a3b" />
      <rect x="30" y="72" width="100" height="10" rx="5" fill="#6b4430" />
      <rect x="44" y="58" width="72" height="16" rx="4" fill="#a97a55" />
      <rect x="68" y="60" width="24" height="5" rx="2.5" fill="#4b291b" />
      <rect
        x="58"
        y="16"
        width="44"
        height="50"
        rx="5"
        fill="#fffdfa"
        stroke="#6b4430"
        strokeWidth="3"
      />
      <path
        d="M68 38l7 7 15-17"
        fill="none"
        stroke="#6b4430"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M46 92h68" stroke="#e9d5ba" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

/** /encuestas — votar y ver resultados. */
export default function EncuestasPage() {
  return (
    <section className="container-c py-14">
      <h1 className="section-title">Encuestas</h1>
      <p className="mt-2 text-slate-600">Tu opinión cuenta. Un voto por persona.</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,65fr)_minmax(0,30fr)] lg:items-start lg:gap-8">
        {/* Columna izquierda: encuestas reales */}
        <div className="min-w-0">
          <Polls />
        </div>

        {/* Columna derecha: tarjeta informativa */}
        <aside className="rounded-3xl border border-[#e9dccd] bg-[#fbf7f1] p-6 text-center shadow-sm">
          <UrnaIlustracion />
          <h2 className="text-lg font-extrabold leading-snug text-[var(--institutional)]">
            Tu voz también construye el colegio
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Participá en las encuestas y ayudanos a mejorar nuestra comunidad educativa.
          </p>

          <ul className="mt-5 grid gap-2.5 text-left">
            <li className="flex items-center gap-3 rounded-xl border border-[#ecdfd0] bg-white px-4 py-2.5 text-sm font-semibold text-[#4b291b]">
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-5 w-5 flex-none text-[var(--gold)]"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M17 11l2 2 3.5-4" />
              </svg>
              1 voto por persona
            </li>
            <li className="flex items-center gap-3 rounded-xl border border-[#ecdfd0] bg-white px-4 py-2.5 text-sm font-semibold text-[#4b291b]">
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-5 w-5 flex-none text-[var(--gold)]"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 20V10M12 20V4M20 20v-7" />
              </svg>
              Encuestas abiertas
            </li>
          </ul>

          <hr className="my-5 border-[#e3d4c2]" />

          <a
            href="/#contacto"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-[#6b4430] underline decoration-[#c7ab8c] underline-offset-4 transition-colors hover:text-[var(--institutional)]"
          >
            ¿Tenés una propuesta? Compartila
            <span aria-hidden="true">→</span>
          </a>
        </aside>
      </div>
    </section>
  );
}
