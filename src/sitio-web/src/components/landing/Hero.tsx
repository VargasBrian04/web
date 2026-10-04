import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Imagen institucional con filtro oscuro (reemplazar por el JPG real en /public/images/hero-colegio.jpg) */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/hero-colegio.jpg')" }}
      />
      <div className="absolute inset-0 bg-black/65" />

      <div className="container-c relative flex min-h-[70vh] flex-col items-start justify-center py-20">
        <span className="mb-4 inline-flex items-center rounded-full bg-[var(--gold)] px-4 py-1 text-xs font-bold uppercase tracking-wide text-white">
          Nivel Básico y Nivel Medio público
        </span>
        <h1 className="max-w-3xl text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
          Colegio Nacional Mariscal{" "}
          <span className="text-[var(--gold)]">Francisco Solano López</span>
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-slate-200">
          Formamos ciudadanos íntegros y técnicos altamente capacitados en
          Caaguazú. 8 bachilleratos técnicos y científicos, educación pública,
          gratuita y de calidad.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link href="/inscripciones" className="btn-gold">
            Inscripciones 2026
          </Link>
          <a href="#oferta" className="btn-outline">
            Ver oferta académica
          </a>
        </div>

        <dl className="mt-12 grid grid-cols-3 gap-6 sm:gap-10">
          {[
            ["+40", "Años de trayectoria"],
            ["8", "Bachilleratos técnicos y científicos"],
            ["100%", "Educación pública y gratuita"]
          ].map(([n, l]) => (
            <div key={l}>
              <dt className="text-3xl font-extrabold text-white">{n}</dt>
              <dd className="mt-1 max-w-[10rem] text-sm text-slate-300">{l}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}