import GalleryExplorer from "./GalleryExplorer";

const bachilleratos = [
  {
    code: "CCB",
    short: "Ciencias Básicas",
    group: "Bachillerato Científico",
    name: "Científico con énfasis en Ciencias Básicas",
    desc: "Matemática, física, química y biología con énfasis en la investigación.",
    logo: null,
  },
  {
    code: "CCS",
    short: "Ciencias Sociales",
    group: "Bachillerato Científico",
    name: "Científico con énfasis en Ciencias Sociales",
    desc: "Historia, geografía, derecho y ciencias políticas.",
    logo: "/images/bachilleratos/ciencias-sociales.webp?v=2",
  },
  {
    code: "BTS",
    short: "Salud",
    group: "Bachillerato en Servicios",
    name: "Bachillerato Técnico en Salud",
    desc: "Enfermería, primeros auxilios y ciencias de la salud al servicio de la comunidad.",
    logo: null,
  },
  {
    code: "BTI",
    short: "Informática",
    group: "Bachillerato en Servicios",
    name: "Bachillerato Técnico en Informática",
    desc: "Programación, redes y mantenimiento de equipos para el mundo del software y las TIC.",
    logo: "/images/bachilleratos/informatica.webp?v=2",
  },
  {
    code: "BTC",
    short: "Contabilidad",
    group: "Bachillerato en Servicios",
    name: "Bachillerato Técnico en Contabilidad",
    desc: "Gestión contable y administrativa con salida laboral y base para estudios universitarios.",
    logo: "/images/bachilleratos/btc-contabilidad.webp?v=2",
  },
  {
    code: "ADN",
    short: "Administración",
    group: "Bachillerato en Servicios",
    name: "Bachillerato en Administración de Negocios",
    desc: "Gestión, administración y emprendedurismo para el mundo de los negocios.",
    logo: "/images/bachilleratos/adn-negocios.webp?v=2",
  },
  {
    code: "BTE",
    short: "Electricidad",
    group: "Bachillerato Técnico Industrial",
    name: "Bachillerato Técnico en Electricidad",
    desc: "Instalaciones eléctricas, electrónica y mantenimiento de sistemas de potencia.",
    logo: null,
  },
  {
    code: "BTM",
    short: "Mecánica",
    group: "Bachillerato Técnico Industrial",
    name: "Bachillerato Técnico en Mecánica",
    desc: "Mecánica automotriz e industrial, soldadura y mantenimiento de maquinarias.",
    logo: null,
  },
  {
    code: "BTCC",
    short: "Construcciones",
    group: "Bachillerato Técnico Industrial",
    name: "Bachillerato Técnico en Construcciones Civiles",
    desc: "Dibujo técnico, obra, instalaciones sanitarias y eléctricas.",
    logo: "/images/bachilleratos/construcciones-civiles.webp?v=2",
  },
  {
    code: "BTA",
    short: "Agropecuaria",
    group: "Bachillerato Técnico Industrial",
    name: "Bachillerato Técnico en Agropecuaria",
    desc: "Producción agrícola, ganadería y manejo sustentable de los recursos naturales.",
    logo: "/images/bachilleratos/agropecuaria.webp?v=2",
  }
];

const eebGrados = [
  {
    short: "7.º",
    name: "7.º Grado — Educación Escolar Básica",
    desc: "Lengua, matemática, ciencias y formación ciudadana. Turnos mañana y tarde.",
    image: null as string | null,
  },
  {
    short: "8.º",
    name: "8.º Grado — Educación Escolar Básica",
    desc: "Segundo año de la EEB, con talleres de orientación hacia el Nivel Medio.",
    image: "/images/galeria/eeb-8vo-1.jpg",
  },
  {
    short: "9.º",
    name: "9.º Grado — Educación Escolar Básica",
    desc: "Cierre de la EEB y antesala de los bachilleratos. Turnos mañana y tarde.",
    image: null as string | null,
  }
];

export function AcademicOfferSection() {
  return (
    <section id="oferta" className="bg-white py-12 sm:py-20">
      <div className="container-c">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="section-title">Oferta académica</h2>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-slate-600 sm:text-base">
              Educación Escolar Básica (7.º a 9.º) y diez bachilleratos del
              Nivel Medio, con salida laboral y preparación para la universidad.
            </p>
          </div>
        </div>

        <h3 className="mt-8 text-base font-extrabold text-[var(--institutional)] sm:mt-10 sm:text-lg">
          Nivel Medio — Bachilleratos
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Cada bachillerato construye su propia identidad. Estamos incorporando
          los logos de todas las orientaciones; los que ya están listos se
          muestran a continuación.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
          {bachilleratos.map((b) => (
            <article
              key={b.code}
              className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all hover:-translate-y-0.5 hover:border-[var(--gold)] hover:shadow-lg"
            >
              <div className="relative flex h-32 items-center justify-center overflow-hidden border-b border-slate-100 bg-[radial-gradient(circle_at_top,_#ffffff,_#f7f3ee)] sm:h-40 lg:h-44">
                <span className="absolute right-2.5 top-2.5 rounded-full bg-[var(--institutional)] px-2 py-0.5 text-[9px] font-bold tracking-wide text-white shadow-sm sm:right-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-[10px]">
                  {b.code}
                </span>
                {b.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={b.logo}
                    alt={`Logo de ${b.name}`}
                    loading="lazy"
                    className="h-24 w-24 object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-105 sm:h-28 sm:w-28 lg:h-32 lg:w-32"
                  />
                ) : (
                  <div className="flex flex-col items-center px-4 text-center">
                    <span className="text-3xl font-black tracking-tight text-slate-200 sm:text-4xl">
                      {b.code}
                    </span>
                    <span className="mt-2 rounded-full border border-dashed border-slate-300 bg-white/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Logo próximamente
                    </span>
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col p-4 sm:p-5">
                <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--gold)] sm:text-[10px]">
                  {b.group}
                </span>
                <h4 className="mt-1 text-[15px] font-bold leading-snug text-slate-900 sm:text-base">{b.name}</h4>
                <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600 sm:mt-2 sm:text-sm">{b.desc}</p>
              </div>
            </article>
          ))}
        </div>

        <h3 className="mt-10 text-base font-extrabold text-[var(--institutional)] sm:mt-12 sm:text-lg">
          Educación Escolar Básica — 7.º, 8.º y 9.º
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Turnos mañana y tarde. Base sólida en lengua, matemática, ciencias y
          formación ciudadana para el ingreso al Nivel Medio.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {eebGrados.map((g) => (
            <article
              key={g.short}
              className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-[var(--paper)] transition-shadow hover:shadow-md"
            >
              {g.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={g.image} alt={g.name} loading="lazy" className="h-32 w-full object-cover sm:h-36" />
              ) : (
                <div className="flex h-32 w-full items-center justify-center bg-[var(--institutional)] text-4xl font-extrabold text-white sm:h-36">
                  {g.short}
                </div>
              )}
              <div className="flex flex-1 flex-col p-4 sm:p-6">
                <span className="mb-3 inline-flex w-fit rounded-lg bg-[var(--gold)] px-3 py-1 text-xs font-bold text-white sm:mb-4">
                  EEB · {g.short}
                </span>
                <h4 className="text-[15px] font-bold text-slate-900 sm:text-base">{g.name}</h4>
                <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600 sm:mt-2 sm:text-sm">{g.desc}</p>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-6 text-[13px] leading-relaxed text-slate-500 sm:mt-8 sm:text-sm">
          Consulta disponibilidad de cupos, horarios y turnos en la Secretaría
          del colegio o a través del registro de inscripciones.
        </p>
      </div>
    </section>
  );
}

export function GallerySection() {
  return (
    <section id="galeria" className="container-c py-20">
      <h2 className="section-title">Galería institucional</h2>
      <p className="mt-3 text-slate-600">
        Instalaciones, talleres, laboratorios y proyectos destacados de nuestros
        estudiantes. Filtrá por categoría y seleccioná una foto para ampliarla.
      </p>

      <GalleryExplorer />
    </section>
  );
}

export function ContactSection() {
  return (
    <section id="contacto" className="bg-[var(--institutional)] py-16 text-white">
      <div className="container-c grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="text-3xl font-extrabold">Contacto e inscripciones</h2>
          <p className="mt-3 text-stone-200">
            La inscripción al ciclo lectivo se realiza de forma online a través
            del portal de inscripciones, o presencial en la Secretaría del
            colegio.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-stone-200">
            <li>Ciudad de Caaguazú, Departamento de Caaguazú, Paraguay</li>
            <li>Secretaría del colegio: lunes a viernes de 07:00 a 17:00</li>
            <li>Portal de inscripciones disponible en "/registro"</li>
            <li>
              GPS: -25.46817°, -56.01172° ·{" "}
              <a
                href="https://maps.app.goo.gl/jLyppMbyxBmu9eNn6"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold underline"
              >
                Abrir en Google Maps ↗
              </a>
            </li>
          </ul>
        </div>
        <div className="flex items-end justify-start md:justify-end">
          <a href="/inscripciones" className="btn-gold">
            Iniciar mi inscripción
          </a>
        </div>
      </div>
    </section>
  );
}