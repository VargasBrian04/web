"use client";

import Link from "next/link";

const CARDS = [
  {
    id: "docente",
    title: "Soy Docente",
    href: "/login?next=/portal/profesor",
    cardBg: "#faf4e9",
    barBg: "#e6c795",
    text: "#4a3320",
    accent: "#7c4a1e",
  },
  {
    id: "padre",
    title: "Soy Padre / Tutor",
    href: "/login?next=/portal/padre",
    cardBg: "#dce9fb",
    barBg: "#b9d2f4",
    text: "#173a5e",
    accent: "#1d5fa8",
  },
  {
    id: "visitante",
    title: "Soy Visitante",
    href: "/#galeria",
    cardBg: "#e7ddfb",
    barBg: "#c9aef0",
    text: "#3c2a5e",
    accent: "#6a3fb5",
  },
] as const;

function DocenteArt() {
  return (
    <svg viewBox="0 0 140 100" className="h-28 w-auto" aria-hidden>
      <rect x="14" y="12" width="112" height="58" rx="8" fill="#8a5a3b" />
      <rect x="20" y="18" width="100" height="46" rx="4" fill="#2e7d46" />
      <path d="M86 30h24M86 40h24M86 50h16" stroke="#e8f2e8" strokeWidth="3" strokeLinecap="round" />
      <rect x="8" y="66" width="26" height="9" rx="4" fill="#1d5fa8" />
      <rect x="8" y="75" width="22" height="9" rx="4" fill="#b3261e" />
      <rect x="106" y="62" width="16" height="22" rx="2" fill="#6d4c2f" />
      <path d="M109 62l-2-12M114 62v-14M119 62l2-12" stroke="#3b2a20" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="62" cy="42" r="14" fill="#f6c9a0" />
      <path d="M48 40c0-9 6-14 14-14s14 5 14 14c0 1-9-3-14-3s-14 4-14 3z" fill="#3b2a20" />
      <rect x="53" y="41" width="8" height="8" rx="4" fill="none" stroke="#3b2a20" strokeWidth="1.8" />
      <rect x="63" y="41" width="8" height="8" rx="4" fill="none" stroke="#3b2a20" strokeWidth="1.8" />
      <path d="M61 45h2" stroke="#3b2a20" strokeWidth="1.8" />
      <path d="M55 53c2 3 12 3 14 0l4 30H51l4-30z" fill="#1d5fa8" />
      <rect x="66" y="57" width="15" height="20" rx="2" fill="#b3261e" />
      <rect x="68" y="57" width="11" height="3" fill="#e8a0a0" />
    </svg>
  );
}

function PadreArt() {
  return (
    <svg viewBox="0 0 140 100" className="h-28 w-auto" aria-hidden>
      <circle cx="52" cy="32" r="14" fill="#f6c9a0" />
      <path d="M38 30c0-9 6-14 14-14s14 5 14 14c-4-4-7-5-10-3-3-2-6-2-8 0-4-1-7 0-10 3z" fill="#4a3320" />
      <path d="M32 96c0-16 8-25 20-25s20 9 20 25z" fill="#1d5fa8" />
      <circle cx="92" cy="50" r="11" fill="#f6c9a0" />
      <path d="M81 48c0-7 5-11 11-11s11 4 11 11c-5-3-17-3-22 0z" fill="#4a3320" />
      <path d="M76 96c0-12 7-19 16-19s16 7 16 19z" fill="#f2f5fa" />
      <path d="M80 78l-5 14M104 78l5 14" stroke="#1d3a5f" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

function VisitanteArt() {
  return (
    <svg viewBox="0 0 140 100" className="h-28 w-auto" aria-hidden>
      <path d="M44 92c-5-14-7-30-2-44 9-7 35-7 44 0 5 14 3 30-2 44z" fill="#5b3b2e" />
      <circle cx="66" cy="46" r="14" fill="#f6c9a0" />
      <path d="M52 44c2-9 26-9 28 0 2 7 0 13 0 13s-2-9-7-10c-3 3-18 3-21-3z" fill="#5b3b2e" />
      <circle cx="61" cy="47" r="1.8" fill="#3b2a20" />
      <circle cx="71" cy="47" r="1.8" fill="#3b2a20" />
      <path d="M62 53c2 2 6 2 8 0" stroke="#3b2a20" strokeWidth="1.8" fill="none" />
      <path d="M48 96c0-10 8-17 18-17s18 7 18 17z" fill="#f2f5fa" />
      <path d="M52 78l-7 12M80 78l7 12" stroke="#1d3a5f" strokeWidth="6" strokeLinecap="round" />
      <rect x="66" y="62" width="18" height="22" rx="2" fill="#8f7bd8" />
      <rect x="68" y="62" width="14" height="3" fill="#c9bdf3" />
    </svg>
  );
}

const ART: Record<string, () => React.JSX.Element> = {
  docente: DocenteArt,
  padre: PadreArt,
  visitante: VisitanteArt,
};

/**
 * Selector de perfil "¿Cómo querés ingresar?" — píldoras Docente / Padre-Tutor / Visitante.
 * El alumno no tiene botón propio: se registra como hijo del padre/tutor.
 * Docente y Padre llevan a /login?next=<zona>; Visitante va a la parte pública.
 */
export default function RolePicker({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl ${compact ? "px-4 py-10 sm:px-8" : "px-4 py-14 sm:px-8 sm:py-20"}`}
      style={{
        backgroundImage: "url(/images/institucion-frente.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative mx-auto max-w-4xl text-center">
        <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
          ¿Cómo querés <span className="text-amber-400">ingresar?</span>
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-stone-200">
          Elegí tu perfil para ir a tu zona. El acceso al portal requiere usuario y contraseña.
        </p>

        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {CARDS.map((c) => {
            const Art = ART[c.id];
            return (
              <Link
                key={c.id}
                href={c.href}
                className="group flex flex-col rounded-[2rem] p-5 pt-6 shadow-xl transition-transform hover:-translate-y-1"
                style={{ backgroundColor: c.cardBg }}
              >
                <Art />
                <span
                  className="mt-4 flex items-center justify-between rounded-full py-2 pl-5 pr-2"
                  style={{ backgroundColor: c.barBg }}
                >
                  <span className="text-base font-bold" style={{ color: c.text }}>
                    {c.title}
                  </span>
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white transition-transform group-hover:scale-110"
                    style={{ backgroundColor: c.accent }}
                  >
                    →
                  </span>
                </span>
              </Link>
            );
          })}
        </div>

        <p className="mt-7 text-xs text-stone-300">
          El alumno no necesita cuenta propia: el padre/tutor lo registra como su hijo en Secretaría.
        </p>
      </div>
    </div>
  );
}
