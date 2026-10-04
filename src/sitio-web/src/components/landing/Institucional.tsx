"use client";

import { useState } from "react";
import {
  PENDING,
  conductRules,
  enrollmentInfo,
  historyText,
  newsPosts,
  requirementGroups,
  studentStats,
  teacherAreas,
  teachers,
} from "@/data/institucional";
import { PendingBadge, Reveal, SectionHeader } from "./ui";
import RolePicker from "../portal/RolePicker";

/* 5. Historia de la institución */
export function HistorySection() {
  return (
    <section id="historia" className="bg-white py-20">
      <div className="container-c">
        <SectionHeader
          title="Historia de la institución"
          desc={historyText.intro}
        />
        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <Reveal className="lg:col-span-3">
            <blockquote className="rounded-2xl border-l-4 border-[var(--gold)] bg-[var(--paper)] p-6 text-sm leading-relaxed text-stone-700">
              {historyText.quote}
            </blockquote>
            <p className="mt-4 text-sm text-slate-500">
              {historyText.note}
              <PendingBadge />
            </p>
          </Reveal>
          <div className="lg:col-span-2">
            <ol className="space-y-4">
              {historyText.milestones.map((m, i) => (
                <Reveal key={m.title} delay={i * 100}>
                  <li className="flex gap-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--institutional)] text-sm font-extrabold text-white">
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="font-bold text-[var(--institutional)]">{m.title}</h3>
                      <p className="mt-1 text-sm text-slate-600">{m.text}</p>
                    </div>
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}

/* 12. Misión (sección dedicada; el resumen también vive en Institucional) */
export function MissionSection() {
  return (
    <section id="mision" className="container-c py-16">
      <div className="grid gap-6 md:grid-cols-2">
        <Reveal>
          <div className="h-full rounded-2xl bg-[var(--institutional)] p-8 text-white shadow-md">
            <h2 className="text-3xl font-extrabold">Misión</h2>
            <p className="mt-4 leading-relaxed text-stone-100">
              Formar personas íntegras con el saber acorde a las necesidades
              socio ambientales; permitir que nuestros estudiantes sean
              proactivos, responsables y conscientes.
            </p>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <div className="h-full rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
            <h3 className="text-lg font-bold text-[var(--institutional)]">
              Nuestro compromiso educativo
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li>Educación pública, gratuita e inclusiva para Caaguazú.</li>
              <li>Valores: patriotismo, respeto, responsabilidad, solidaridad y excelencia académica.</li>
              <li>Formación técnica con salida laboral y preparación universitaria.</li>
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* 13. Visión (sección dedicada) */
export function VisionSection() {
  return (
    <section id="vision" className="bg-white py-16">
      <div className="container-c grid gap-6 md:grid-cols-2">
        <Reveal>
          <div className="h-full rounded-2xl border border-stone-200 bg-[var(--paper)] p-8 shadow-sm">
            <h2 className="text-3xl font-extrabold text-[var(--institutional)]">Visión</h2>
            <p className="mt-4 leading-relaxed text-stone-700">
              Brindar un espacio de convivencia donde se enriquezca la dignidad
              humana y la unidad institucional, comprometida con la educación
              integral, con iniciativa, creatividad e innovación, responsables
              y respetuosos con su entorno, abierta al mundo globalizado.
            </p>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <div className="h-full rounded-2xl bg-[var(--institutional)] p-8 text-white shadow-md">
            <h3 className="text-lg font-bold text-[var(--gold)]">Hacia dónde apuntamos</h3>
            <ul className="mt-4 space-y-2 text-sm text-stone-100">
              <li>Talleres y laboratorios modernos para cada especialidad.</li>
              <li>Docentes en formación continua y proyectos liderados por estudiantes.</li>
              <li>Portal académico digital al servicio de las familias.</li>
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* 3. Oferta educativa por niveles (complementa la grilla de bachilleratos) */
export function LevelsSection() {
  const cards = [
    {
      tag: "EEB · 621 estudiantes",
      title: "Educación Escolar Básica — 7.º, 8.º y 9.º",
      text: "Turnos mañana y tarde. Base sólida en lengua, matemática, ciencias y formación ciudadana para el ingreso al Nivel Medio.",
    },
    {
      tag: "Media · 337 estudiantes",
      title: "Bachillerato Científico",
      text: "Énfasis en Ciencias Básicas (matemática, física, química, biología) y en Ciencias Sociales (historia, derecho, ciencias políticas).",
    },
    {
      tag: "Media · 287 estudiantes",
      title: "Bachillerato en Servicios",
      text: "Salud (BTS), Informática (BTI), Contabilidad (BTC) y Administración de Negocios (ADN).",
    },
    {
      tag: "Media · 332 estudiantes",
      title: "Técnico Industrial",
      text: "Electricidad (BTE), Mecánica (BTM), Construcción Civil (BTCC) y Agropecuaria (BTA): talleres y práctica intensiva.",
    },
  ];
  return (
    <section id="niveles" className="container-c py-20">
      <SectionHeader
        title="Niveles y modalidades"
        desc="La institución abarca la Educación Escolar Básica y tres grupos de bachillerato del Nivel Medio. Datos de matrícula: octubre 2026."
      />
      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        {cards.map((c, i) => (
          <Reveal key={c.title} delay={i * 80}>
            <article className="h-full rounded-2xl border border-stone-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
              <span className="mb-3 inline-block rounded-lg bg-[var(--institutional)] px-3 py-1 text-xs font-bold text-white">
                {c.tag}
              </span>
              <h3 className="font-bold text-slate-900">{c.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{c.text}</p>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* 6. Cantidad de alumnos por nivel — resumen + detalles desplegables */
export function StatsSection() {
  const [eebOpen, setEebOpen] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [openEeb, setOpenEeb] = useState<string[]>(studentStats.eeb.map((g) => g.grade));
  const [openMedia, setOpenMedia] = useState<string[]>([]);

  const sortedLevels = [...studentStats.levels].sort((a, b) => b.total - a.total);
  const max = Math.max(...sortedLevels.map((l) => l.total));
  const eebTotal = studentStats.eeb.reduce((s, g) => s + g.total, 0);
  const mediaTotal = studentStats.media.reduce((s, m) => s + m.total, 0);
  const sortedMedia = [...studentStats.media]
    .map((m) => ({
      ...m,
      rows: [...m.rows].sort((a, b) => b.c1 + b.c2 + b.c3 - (a.c1 + a.c2 + a.c3)),
    }))
    .sort((a, b) => b.total - a.total);

  const toggleEebGrade = (grade: string) =>
    setOpenEeb((cur) => (cur.includes(grade) ? cur.filter((g) => g !== grade) : [...cur, grade]));
  const toggleMediaGroup = (group: string) =>
    setOpenMedia((cur) => (cur.includes(group) ? cur.filter((g) => g !== group) : [...cur, group]));

  return (
    <section id="estadisticas" className="bg-white py-20">
      <div className="container-c">
        <SectionHeader
          title="Estudiantes por nivel"
          desc={`Matrícula total: 1.577 estudiantes · Fuente: ${studentStats.source}.`}
        />
        <div className="mt-8 grid gap-4">
          {sortedLevels.map((l, i) => (
            <Reveal key={l.name} delay={i * 80}>
              <div className="rounded-2xl border border-stone-200 bg-[var(--paper)] p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-bold text-slate-900">{l.name}</h3>
                  <span className="text-2xl font-extrabold text-[var(--institutional)]">
                    {l.total}
                  </span>
                </div>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-stone-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[var(--institutional)] to-[var(--gold)]"
                    style={{ width: `${Math.round((l.total / max) * 100)}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500">{l.detail}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          <button
            onClick={() => {
              setEebOpen(true);
              setMediaOpen(true);
              setOpenEeb(studentStats.eeb.map((g) => g.grade));
              setOpenMedia(sortedMedia.map((m) => m.group));
            }}
            className="rounded-full border border-stone-300 bg-white px-4 py-1.5 text-xs font-bold text-stone-600 hover:border-[var(--institutional)] hover:text-[var(--institutional)]"
          >
            Expandir todo
          </button>
          <button
            onClick={() => {
              setEebOpen(false);
              setMediaOpen(false);
              setOpenEeb([]);
              setOpenMedia([]);
            }}
            className="rounded-full border border-stone-300 bg-white px-4 py-1.5 text-xs font-bold text-stone-600 hover:border-[var(--institutional)] hover:text-[var(--institutional)]"
          >
            Colapsar todo
          </button>
        </div>

        {/* Detalle EEB — desplegable */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-stone-200 bg-[var(--paper)]">
          <button
            onClick={() => setEebOpen((v) => !v)}
            aria-expanded={eebOpen}
            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
          >
            <div>
              <h3 className="text-lg font-extrabold text-[var(--institutional)]">
                Detalle EEB por curso y turno
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                3 grados · {eebTotal} estudiantes · Turno mañana y tarde
              </p>
            </div>
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--institutional)] text-white transition-transform ${eebOpen ? "rotate-180" : ""}`}
            >
              ▾
            </span>
          </button>
          {eebOpen && (
            <div className="grid items-start gap-4 border-t border-stone-200 bg-white p-4 sm:p-5 lg:grid-cols-3">
              {studentStats.eeb.map((g) => {
                const tmTotal = g.tm.reduce((s, c) => s + c.count, 0);
                const ttTotal = g.tt.reduce((s, c) => s + c.count, 0);
                const isOpen = openEeb.includes(g.grade);
                return (
                  <div
                    key={g.grade}
                    className="overflow-hidden rounded-xl border border-stone-200"
                  >
                    <button
                      onClick={() => toggleEebGrade(g.grade)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center justify-between gap-2 bg-[var(--institutional)] px-4 py-3 text-left text-white"
                    >
                      <span>
                        <span className="block font-bold">{g.grade}</span>
                        <span className="block text-xs text-stone-200">
                          Total {g.total} · TM {tmTotal} · TT {ttTotal}
                        </span>
                      </span>
                      <span className={`transition-transform ${isOpen ? "rotate-180" : ""}`}>▾</span>
                    </button>
                    {isOpen && (
                      <div className="grid grid-cols-2 text-sm">
                        <div className="border-r border-stone-200 p-4">
                          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Turno mañana</p>
                          {g.tm.map((c) => (
                            <p key={c.course} className="flex justify-between py-0.5 text-slate-700">
                              <span>{c.course}</span>
                              <strong>{c.count}</strong>
                            </p>
                          ))}
                        </div>
                        <div className="p-4">
                          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Turno tarde</p>
                          {g.tt.map((c) => (
                            <p key={c.course} className="flex justify-between py-0.5 text-slate-700">
                              <span>{c.course}</span>
                              <strong>{c.count}</strong>
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Detalle Media — desplegable y agrupado */}
        <div className="mt-4 overflow-hidden rounded-2xl border border-stone-200 bg-[var(--paper)]">
          <button
            onClick={() => setMediaOpen((v) => !v)}
            aria-expanded={mediaOpen}
            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
          >
            <div>
              <h3 className="text-lg font-extrabold text-[var(--institutional)]">
                Detalle Nivel Medio por orientación y curso — Año 2026
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                3 grupos · {mediaTotal} estudiantes · 1.º, 2.º y 3.er curso
              </p>
            </div>
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--institutional)] text-white transition-transform ${mediaOpen ? "rotate-180" : ""}`}
            >
              ▾
            </span>
          </button>
          {mediaOpen && (
            <div className="grid items-start gap-4 border-t border-stone-200 bg-white p-4 sm:p-5 lg:grid-cols-3">
              {sortedMedia.map((m) => {
                const isOpen = openMedia.includes(m.group);
                return (
                  <div
                    key={m.group}
                    className="overflow-hidden rounded-xl border border-stone-200"
                  >
                    <button
                      onClick={() => toggleMediaGroup(m.group)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center justify-between gap-2 bg-[var(--institutional)] px-4 py-3 text-left text-white"
                    >
                      <span>
                        <span className="block font-bold">{m.group}</span>
                        <span className="block text-xs text-stone-200">
                          Total {m.total} · {m.rows.length} orientaciones
                        </span>
                      </span>
                      <span className={`transition-transform ${isOpen ? "rotate-180" : ""}`}>▾</span>
                    </button>
                    {isOpen && (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                            <th className="px-4 py-2">Orientación</th>
                            <th className="px-2 py-2 text-right">1.º</th>
                            <th className="px-2 py-2 text-right">2.º</th>
                            <th className="px-4 py-2 text-right">3.º</th>
                          </tr>
                        </thead>
                        <tbody>
                          {m.rows.map((r) => (
                            <tr key={r.orientation} className="border-t border-stone-100 text-slate-700">
                              <td className="px-4 py-2">{r.orientation}</td>
                              <td className="px-2 py-2 text-right font-semibold">{r.c1}</td>
                              <td className="px-2 py-2 text-right font-semibold">{r.c2}</td>
                              <td className="px-4 py-2 text-right font-semibold">{r.c3}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
export function TeachersSection() {
  const [area, setArea] = useState<(typeof teacherAreas)[number]>("Todas");
  const list = teachers.filter((t) => area === "Todas" || t.area === area);
  return (
    <section id="docentes" className="container-c py-20">
      <SectionHeader
        title="Repositorio de docentes"
        desc="Consultá el plantel docente por materia, nivel y área. La nómina completa está en actualización."
      />
      <div className="mt-6 flex flex-wrap gap-2">
        {teacherAreas.map((a) => (
          <button
            key={a}
            onClick={() => setArea(a)}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
              area === a
                ? "bg-[var(--institutional)] text-white shadow"
                : "border border-stone-300 bg-white text-stone-600 hover:border-[var(--institutional)] hover:text-[var(--institutional)]"
            }`}
          >
            {a}
          </button>
        ))}
      </div>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((t) => (
          <Reveal key={t.subject}>
            <article className="h-full overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {t.photo ? (
                <img src={t.photo} alt={t.subject} className="h-44 w-full object-cover" loading="lazy" />
              ) : (
                <div className="flex h-44 w-full items-center justify-center bg-[var(--institutional)] text-4xl text-white">👩‍🏫</div>
              )}
              <div className="p-6">
                <p className="text-sm font-bold text-slate-900">
                  {t.name === PENDING ? (
                    <>
                      Nombre y apellido
                      <PendingBadge />
                    </>
                  ) : (
                    t.name
                  )}
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--institutional)]">{t.subject}</p>
                <p className="mt-1 text-xs text-slate-500">{t.level} · {t.role} · {t.area}</p>
                <p className="mt-3 text-sm text-slate-600">{t.bio}</p>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
      <p className="mt-6 text-sm text-slate-500">
        Fotografía, cargo y perfil detallado por docente: <PendingBadge />
      </p>
    </section>
  );
}

/* 9. Blog / Noticias (portada destacada + otras estilo collage) */
const newsPill: Record<string, string> = {
  Inscripciones: "bg-[#b3261e]",
  "Académico": "bg-[#1d5fa8]",
  Institucional: "bg-[#2e7d46]",
};

function newsPillClass(category: string) {
  return newsPill[category] ?? "bg-[var(--gold)]";
}

export function NewsSection() {
  const [featured, ...rest] = newsPosts;
  return (
    <section id="noticias" className="container-c py-20">
      <SectionHeader
        title="Blog / Noticias"
        desc="Anuncios, actividades y comunicados. Tocá una noticia para leerla completa."
      />
      <Reveal>
        <a
          href={`/noticias/${featured.slug}`}
          className="relative mt-8 grid overflow-hidden rounded-3xl border border-[#eadfc9] bg-[#fffdf6] shadow-[0_26px_55px_rgba(62,42,34,0.22)] transition-transform hover:-translate-y-1 sm:grid-cols-2"
        >
          <span className="absolute left-1/2 top-0 z-10 h-14 w-6 -translate-x-1/2 bg-[#b91c1c] shadow-md [clip-path:polygon(0_0,100%_0,100%_100%,50%_82%,0_100%)]" />
          <div className="p-6 sm:p-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={featured.image}
              alt={featured.title}
              loading="lazy"
              className="h-64 w-full rounded-2xl border-4 border-white object-cover shadow-lg sm:h-full sm:min-h-[270px]"
            />
          </div>
          <div className="relative p-6 sm:p-8">
            <span className={`inline-block rounded-lg px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-white ${newsPillClass(featured.category)}`}>
              {featured.category}
            </span>
            <h3 className="mt-3 text-xl font-extrabold leading-snug text-[var(--institutional)]">
              {featured.title}
            </h3>
            <p className="mt-2 text-xs text-slate-500">
              📅 {featured.date} · Por {featured.author}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-stone-600">{featured.excerpt}</p>
            <span className="btn-gold mt-5">Leer más →</span>
          </div>
        </a>
      </Reveal>
      <div className="mt-12 -rotate-1">
        <span className="inline-block rounded-sm bg-[#f3e7cf] px-8 py-2 font-[Segoe_Print,'Comic_Sans_MS',cursive] text-2xl font-bold text-[var(--institutional)] shadow-[0_6px_16px_rgba(62,42,34,0.16)]">
          Otras noticias
        </span>
      </div>
      <div className="mt-6 grid items-start gap-6 md:grid-cols-3">
        {rest.map((n, i) => (
          <Reveal key={n.slug} delay={i * 80}>
            <a
              href={`/noticias/${n.slug}`}
              className={`relative block h-full rounded-2xl border border-[#eadfc9] bg-[#fffdf6] p-5 shadow-[0_10px_26px_rgba(62,42,34,0.14)] transition-all hover:-translate-y-1 hover:rotate-0 hover:shadow-[0_18px_38px_rgba(62,42,34,0.22)] ${i % 2 ? "rotate-[0.6deg]" : "rotate-[-0.6deg]"}`}
            >
              <span className="absolute -top-3 left-1/2 h-6 w-24 -translate-x-1/2 -rotate-2 bg-[#d2be9f]/80 shadow-sm" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={n.image} alt={n.title} className="h-44 w-full rounded-xl border-4 border-white object-cover shadow" loading="lazy" />
              <span className={`mt-4 inline-block rounded-lg px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-white ${newsPillClass(n.category)}`}>
                {n.category}
              </span>
              <p className="mt-2 text-xs text-slate-500">
                📅 {n.date}
              </p>
              <h3 className="mt-1 font-bold text-slate-900">{n.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{n.excerpt}</p>
              <p className="mt-3 text-xs text-slate-500">Por {n.author}</p>
              <span className="mt-3 inline-block text-sm font-extrabold text-[#8a2b23]">
                Leer más →
              </span>
            </a>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* 7 + 8. Requisitos de inscripción e ingreso */
export function RequirementsSection() {
  const [tab, setTab] = useState(requirementGroups[0].id);
  const active = requirementGroups.find((g) => g.id === tab)!;
  return (
    <section id="requisitos" className="bg-white py-20">
      <div className="container-c">
        <SectionHeader
          title="Requisitos de inscripción e ingreso"
          desc="Documentos y condiciones. La nómina oficial definitiva se confirma en Secretaría."
        />
        <div className="mt-6 flex flex-wrap gap-2">
          {requirementGroups.map((g) => (
            <button
              key={g.id}
              onClick={() => setTab(g.id)}
              className={`rounded-full px-4 py-2 text-xs font-bold transition-colors ${
                tab === g.id
                  ? "bg-[var(--institutional)] text-white shadow"
                  : "border border-stone-300 bg-[var(--paper)] text-stone-600 hover:border-[var(--institutional)] hover:text-[var(--institutional)]"
              }`}
            >
              {g.title}
            </button>
          ))}
        </div>
        <Reveal>
          <div className="mt-6 rounded-2xl border border-stone-200 bg-[var(--paper)] p-6 sm:p-8">
            <h3 className="text-lg font-extrabold text-[var(--institutional)]">{active.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{active.intro}</p>
            <ul className="mt-4 space-y-2">
              {active.items.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-slate-700">
                  <span className="mt-0.5 font-bold text-[var(--gold)]">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* 10. Matrículas */
export function EnrollmentInfoSection() {
  return (
    <section id="matriculas" className="container-c py-20">
      <SectionHeader
        title="Matrículas"
        desc="Fechas, costos, modalidades y procedimiento. Gestión disponible en Secretaría y en el panel de administración (/portal/admin)."
      />
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Reveal>
          <div className="h-full rounded-2xl bg-[var(--institutional)] p-8 text-white shadow-md">
            <h3 className="text-lg font-bold text-[var(--gold)]">Costos y fechas</h3>
            <p className="mt-3 text-sm leading-relaxed text-stone-100">{enrollmentInfo.cost}</p>
            <p className="mt-3 text-sm leading-relaxed text-stone-100">{enrollmentInfo.dates}</p>
            <p className="mt-3 text-sm leading-relaxed text-stone-100">{enrollmentInfo.payment}</p>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <div className="h-full rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
            <h3 className="text-lg font-bold text-[var(--institutional)]">Procedimiento</h3>
            <ol className="mt-4 space-y-3">
              {enrollmentInfo.steps.map((s, i) => (
                <li key={s} className="flex gap-3 text-sm text-slate-700">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--institutional)] text-xs font-extrabold text-white">
                    {i + 1}
                  </span>
                  {s}
                </li>
              ))}
            </ol>
            <a href="/inscripciones" className="btn-primary mt-6">
              Ir al portal de inscripciones
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* 11. Normas de convivencia */
export function ConductSection() {
  return (
    <section id="normas" className="bg-white py-20">
      <div className="container-c">
        <SectionHeader
          title="Normas de convivencia"
          desc="Pautas de la vida escolar, organizadas por categorías. El reglamento interno completo se socializa en cada curso."
        />
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {conductRules.map((c, i) => (
            <Reveal key={c.category} delay={i * 80}>
              <div className="h-full rounded-2xl border border-stone-200 bg-[var(--paper)] p-6 shadow-sm">
                <h3 className="font-extrabold text-[var(--institutional)]">{c.category}</h3>
                <ul className="mt-3 space-y-2">
                  {c.rules.map((r) => (
                    <li key={r} className="flex gap-2 text-sm text-slate-700">
                      <span className="mt-0.5 font-bold text-[var(--gold)]">•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* 4. Calificaciones (acceso privado — selector de perfil por zona) */
export function GradesAccessSection() {
  return (
    <section id="calificaciones" className="container-c py-20">
      <RolePicker compact />
      <p className="mt-6 text-center text-xs text-slate-500">
        Privacidad: el acceso al portal requiere usuario y contraseña. Los roles Alumno, Padre y Docente solo ven la información que les corresponde. Documentos oficiales en el{" "}
        <a
          href="https://aprendizaje.mec.edu.py/aprendizaje/familia/documentos"
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold underline"
        >
          MEC ↗
        </a>
        .
      </p>
    </section>
  );
}
