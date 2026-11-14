"use client";

import { useState } from "react";
import {
  FieldError, Field, FormError, Icon, Person, PersonErrors, PersonFields, RegFoot,
  RegShell, SectionTitle, SubmitButton, SuccessView, inputCls, necesitaSeccion, useCatalog,
} from "./shared";

type Hijo = { nombre: string; nivel: "" | "EEB" | "MEDIA"; curso: string; seccion: string; turno: string; bachiller: string };
type HijoErr = { nombre?: string; nivel?: string; curso?: string; seccion?: string; turno?: string; bachiller?: string };

const BLANK_HIJO: Hijo = { nombre: "", nivel: "", curso: "", seccion: "", turno: "", bachiller: "" };

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
        // Al cambiar de nivel se reinician curso, sección, turno y bachiller.
        if (k === "nivel") {
          next.curso = "";
          next.seccion = "";
          next.turno = "";
          next.bachiller = "";
        }
        // Al cambiar de bachiller se reinicia la sección (solo CCB la usa).
        if (k === "bachiller") next.seccion = "";
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
      if (!["MAÑANA", "TARDE"].includes(h.turno)) e.turno = "Elegí el turno";
      if (necesitaSeccion(h.nivel, h.bachiller)) {
        const validSec = h.nivel === "EEB"
          ? (cat?.secciones ?? ["A", "B", "C", "D"])
          : (cat?.seccionesCCB ?? ["A", "B"]);
        if (!validSec.includes(h.seccion)) e.seccion = "Elegí la sección";
      }
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
            seccion: necesitaSeccion(h.nivel, h.bachiller) ? h.seccion : null,
            turno: h.turno,
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
    <RegShell>
      <form onSubmit={submit} noValidate>
        <section className="reg-block">
          <SectionTitle n="1" title="Datos personales" desc="Tus datos como tutor o encargado." icon={Icon.user} />
          <PersonFields
            value={person}
            errors={pErr}
            disabled={sending}
            onChange={(k, v) => setPerson((p) => ({ ...p, [k]: v }))}
          />
        </section>

        <section className="reg-block">
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: "0.7rem" }}>
            <SectionTitle n="2" title="Hijos a cargo" desc="Podés registrar varios hijos en la misma solicitud." icon={Icon.child} />
            <button
              type="button"
              disabled={sending || hijos.length >= 8}
              onClick={() => setHijos((hs) => [...hs, { ...BLANK_HIJO }])}
              className="reg-btn-add"
            >
              ＋ Agregar otro hijo
            </button>
          </div>

          <div style={{ marginTop: "0.9rem" }}>
            {hijos.map((h, i) => {
              const courses = h.nivel === "EEB" ? cat?.eebGrades ?? [] : h.nivel === "MEDIA" ? cat?.mediaCourses ?? [] : [];
              const e = hErr[i] ?? {};
              return (
                <article key={i} className="reg-child">
                  <div className="reg-child-head">
                    <b>Hijo {i + 1}</b>
                    {hijos.length > 1 && (
                      <button
                        type="button"
                        disabled={sending}
                        onClick={() => setHijos((hs) => hs.filter((_, j) => j !== i))}
                        className="reg-btn-mini"
                      >
                        ✕ Quitar
                      </button>
                    )}
                  </div>
                  <div className="reg-grid">
                    <Field label="Nombre y apellido del alumno" required error={e.nombre} className="reg-col-full">
                      <input
                        value={h.nombre}
                        onChange={(e2) => setHijo(i, "nombre", e2.target.value)}
                        disabled={sending}
                        placeholder="Ej: Ana Gómez"
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Nivel educativo" required error={e.nivel}>
                      <select
                        value={h.nivel}
                        onChange={(e2) => setHijo(i, "nivel", e2.target.value)}
                        disabled={sending || !cat}
                        className="reg-select"
                      >
                        <option value="">Seleccionar…</option>
                        <option value="EEB">Educación Escolar Básica</option>
                        <option value="MEDIA">Educación Media</option>
                      </select>
                    </Field>
                    <Field label="Curso" required error={e.curso}>
                      <select
                        value={h.curso}
                        onChange={(e2) => setHijo(i, "curso", e2.target.value)}
                        disabled={sending || !h.nivel}
                        className="reg-select"
                      >
                        <option value="">{h.nivel ? "Seleccionar…" : "Primero elegí el nivel"}</option>
                        {courses.map((c) => (
                          <option key={c} value={c}>{h.nivel === "EEB" ? `${c} grado` : `${c} curso`}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Turno" required error={e.turno}>
                      <select
                        value={h.turno}
                        onChange={(e2) => setHijo(i, "turno", e2.target.value)}
                        disabled={sending || !h.nivel}
                        className="reg-select"
                      >
                        <option value="">{h.nivel ? "Seleccionar…" : "Primero elegí el nivel"}</option>
                        <option value="MAÑANA">Mañana</option>
                        <option value="TARDE">Tarde</option>
                      </select>
                    </Field>
                    {necesitaSeccion(h.nivel, h.bachiller) && (
                      <Field label="Sección" required error={e.seccion}>
                        <select
                          value={h.seccion}
                          onChange={(e2) => setHijo(i, "seccion", e2.target.value)}
                          disabled={sending || !h.nivel}
                          className="reg-select"
                        >
                          <option value="">{h.nivel ? "Seleccionar…" : "Primero elegí el nivel"}</option>
                          {(h.nivel === "EEB"
                            ? (cat?.secciones ?? ["A", "B", "C", "D"])
                            : (cat?.seccionesCCB ?? ["A", "B"])
                          ).map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </Field>
                    )}
                    {h.nivel === "MEDIA" && (
                      <Field label="Bachiller" required error={e.bachiller} className="reg-col-full">
                        <select
                          value={h.bachiller}
                          onChange={(e2) => setHijo(i, "bachiller", e2.target.value)}
                          disabled={sending}
                          className="reg-select"
                        >
                          <option value="">Seleccionar bachiller…</option>
                          {(cat?.bachilleratos ?? []).map((b) => (
                            <option key={b.code} value={b.code}>
                              {b.shortName} — {b.name}
                            </option>
                          ))}
                        </select>
                      </Field>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
          {catError && <p className="reg-field-err show" style={{ marginTop: "0.6rem" }}>{catError}</p>}
        </section>

        <FormError msg={serverError} />

        <div style={{ marginTop: "0.2rem" }}>
          <SubmitButton sending={sending} label="Enviar solicitud" />
        </div>
        <RegFoot note="Dirección revisa la solicitud antes de crear tu cuenta." />
      </form>
    </RegShell>
  );
}
