"use client";

import { useState } from "react";
import {
  FieldError, Person, PersonErrors, PersonFields, SectionTitle, SuccessView,
  inputCls, useCatalog,
} from "./shared";

type Hijo = { nombre: string; nivel: "" | "EEB" | "MEDIA"; curso: string; bachiller: string };
type HijoErr = { nombre?: string; nivel?: string; curso?: string; bachiller?: string };

const BLANK_HIJO: Hijo = { nombre: "", nivel: "", curso: "", bachiller: "" };

/** Formulario de solicitud de cuenta para tutores/encargados. */
export default function TutorForm() {
  const { cat, error: catError } = useCatalog();
  const [person, setPerson] = useState<Person>({ ci: "", firstName: "", lastName: "", phone: "", email: "" });
  const [pErr, setPErr] = useState<PersonErrors>({});
  const [hijos, setHijos] = useState<Hijo[]>([{ ...BLANK_HIJO }]);
  const [hErr, setHErr] = useState<HijoErr[]>([]);
  const [sending, setSending] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const setHijo = (i: number, k: keyof Hijo, v: string) => {
    setHijos((hs) =>
      hs.map((h, j) => {
        if (j !== i) return h;
        const next = { ...h, [k]: v };
        // Al cambiar de nivel se reinician curso y bachiller.
        if (k === "nivel") {
          next.curso = "";
          next.bachiller = "";
        }
        return next;
      })
    );
  };

  function validate(): boolean {
    const pe: PersonErrors = {};
    if (!/^\d{6,10}$/.test(person.ci.trim())) pe.ci = "Cédula inválida (6 a 10 dígitos)";
    if (!person.firstName.trim()) pe.firstName = "Obligatorio";
    if (!person.lastName.trim()) pe.lastName = "Obligatorio";
    if (person.phone.replace(/\D/g, "").length < 6) pe.phone = "Mínimo 6 dígitos";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(person.email.trim())) pe.email = "Correo inválido";
    const he: HijoErr[] = hijos.map((h) => {
      const e: HijoErr = {};
      if (!h.nombre.trim()) e.nombre = "Obligatorio";
      if (h.nivel !== "EEB" && h.nivel !== "MEDIA") e.nivel = "Elegí el nivel";
      const valid = h.nivel === "EEB" ? cat?.eebGrades : h.nivel === "MEDIA" ? cat?.mediaCourses : [];
      if (!h.curso || !valid?.includes(h.curso)) e.curso = "Elegí el curso";
      if (h.nivel === "MEDIA" && !h.bachiller) e.bachiller = "Elegí el bachiller";
      return e;
    });
    setPErr(pe);
    setHErr(he);
    return (
      Object.keys(pe).length === 0 && he.every((e) => Object.keys(e).length === 0)
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (sending) return;
    setServerError(null);
    if (!validate()) {
      setServerError("Revisá los campos marcados en rojo");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/solicitudes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "tutor",
          ci: person.ci.trim(),
          firstName: person.firstName.trim(),
          lastName: person.lastName.trim(),
          phone: person.phone.trim(),
          email: person.email.trim(),
          hijos: hijos.map((h) => ({
            nombre: h.nombre.trim(),
            nivel: h.nivel,
            curso: h.curso,
            bachiller: h.nivel === "MEDIA" ? h.bachiller : null,
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok) setServerError(json.error || "No se pudo enviar");
      else setDone(true);
    } catch {
      setServerError("Sin conexión con el servidor");
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return (
      <SuccessView title="¡Solicitud enviada!">
        <p>
          Recibimos tu solicitud de registro como tutor de <strong>{hijos.length}</strong>{" "}
          {hijos.length === 1 ? "hijo" : "hijos"}. Dirección la revisará y te contactará
          al teléfono o correo indicados.
        </p>
      </SuccessView>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-8" noValidate>
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <SectionTitle n="1" title="Datos personales" desc="Tus datos como tutor o encargado." />
        <div className="mt-5">
          <PersonFields
            value={person}
            errors={pErr}
            disabled={sending}
            onChange={(k, v) => setPerson((p) => ({ ...p, [k]: v }))}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionTitle n="2" title="Hijos a cargo" desc="Podés registrar varios hijos en la misma solicitud." />
          <button
            type="button"
            disabled={sending || hijos.length >= 8}
            onClick={() => setHijos((hs) => [...hs, { ...BLANK_HIJO }])}
            className="rounded-lg border-2 border-dashed border-[var(--gold)] px-4 py-2 text-sm font-bold text-[var(--institutional)] hover:bg-amber-50 disabled:opacity-40"
          >
            ＋ Agregar otro hijo
          </button>
        </div>

        <div className="mt-5 grid gap-4">
          {hijos.map((h, i) => {
            const courses = h.nivel === "EEB" ? cat?.eebGrades ?? [] : h.nivel === "MEDIA" ? cat?.mediaCourses ?? [] : [];
            const e = hErr[i] ?? {};
            return (
              <article key={i} className="rounded-xl border border-slate-200 bg-[var(--paper)] p-4 sm:p-5">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-extrabold text-[var(--institutional)]">Hijo {i + 1}</h4>
                  {hijos.length > 1 && (
                    <button
                      type="button"
                      disabled={sending}
                      onClick={() => setHijos((hs) => hs.filter((_, j) => j !== i))}
                      className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100"
                    >
                      ✕ Quitar
                    </button>
                  )}
                </div>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-semibold text-slate-700 sm:col-span-2">
                    Nombre y apellido del alumno <span className="text-red-600">*</span>
                    <input
                      value={h.nombre}
                      onChange={(e2) => setHijo(i, "nombre", e2.target.value)}
                      disabled={sending}
                      placeholder="Ej: Ana Gómez"
                      className={`${inputCls} ${e.nombre ? "!border-red-500" : ""}`}
                    />
                    <FieldError msg={e.nombre} />
                  </label>
                  <label className="block text-sm font-semibold text-slate-700">
                    Nivel educativo <span className="text-red-600">*</span>
                    <select
                      value={h.nivel}
                      onChange={(e2) => setHijo(i, "nivel", e2.target.value)}
                      disabled={sending || !cat}
                      className={`${inputCls} ${e.nivel ? "!border-red-500" : ""}`}
                    >
                      <option value="">Seleccionar…</option>
                      <option value="EEB">Educación Escolar Básica</option>
                      <option value="MEDIA">Educación Media</option>
                    </select>
                    <FieldError msg={e.nivel} />
                  </label>
                  <label className="block text-sm font-semibold text-slate-700">
                    Curso <span className="text-red-600">*</span>
                    <select
                      value={h.curso}
                      onChange={(e2) => setHijo(i, "curso", e2.target.value)}
                      disabled={sending || !h.nivel}
                      className={`${inputCls} ${e.curso ? "!border-red-500" : ""}`}
                    >
                      <option value="">{h.nivel ? "Seleccionar…" : "Primero elegí el nivel"}</option>
                      {courses.map((c) => (
                        <option key={c} value={c}>{h.nivel === "EEB" ? `${c} grado` : `${c} curso`}</option>
                      ))}
                    </select>
                    <FieldError msg={e.curso} />
                  </label>
                  {h.nivel === "MEDIA" && (
                    <label className="block text-sm font-semibold text-slate-700 sm:col-span-2">
                      Bachiller <span className="text-red-600">*</span>
                      <select
                        value={h.bachiller}
                        onChange={(e2) => setHijo(i, "bachiller", e2.target.value)}
                        disabled={sending}
                        className={`${inputCls} ${e.bachiller ? "!border-red-500" : ""}`}
                      >
                        <option value="">Seleccionar bachiller…</option>
                        {(cat?.bachilleratos ?? []).map((b) => (
                          <option key={b.code} value={b.code}>
                            {b.shortName} — {b.name}
                          </option>
                        ))}
                      </select>
                      <FieldError msg={e.bachiller} />
                    </label>
                  )}
                </div>
              </article>
            );
          })}
        </div>
        {catError && <p className="mt-3 text-sm font-semibold text-red-600">{catError}</p>}
      </section>

      {serverError && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{serverError}</p>
      )}
      <div>
        <button type="submit" disabled={sending} className="btn-primary w-full justify-center sm:w-auto">
          {sending ? "Enviando…" : "Enviar solicitud"}
        </button>
        <p className="mt-2 text-xs text-slate-500">
          Dirección revisará tu solicitud y te contactará. Los campos con * son obligatorios.
        </p>
      </div>
    </form>
  );
}
