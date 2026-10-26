"use client";

import { useState } from "react";
import {
  FieldError, Field, FormError, Icon, Person, PersonErrors, PersonFields, RegFoot,
  RegShell, SectionTitle, SubmitButton, SuccessView, inputCls, useCatalog,
} from "./shared";

/** Formulario de solicitud de cuenta para docentes. */
export default function DocenteForm() {
  const { cat, error: catError } = useCatalog();
  const [person, setPerson] = useState<Person>({ ci: "", firstName: "", lastName: "", phone: "", email: "" });
  const [pErr, setPErr] = useState<PersonErrors>({});
  const [materiaPrincipal, setMateriaPrincipal] = useState("");
  const [materiaPrincipalOtra, setMateriaPrincipalOtra] = useState("");
  const [mpErr, setMpErr] = useState<string | undefined>();
  const [otraSel, setOtraSel] = useState("");
  const [otraLibre, setOtraLibre] = useState("");
  const [otras, setOtras] = useState<string[]>([]);
  const [otrasErr, setOtrasErr] = useState<string | undefined>();
  const [niveles, setNiveles] = useState<("EEB" | "MEDIA")[]>([]);
  const [cursos, setCursos] = useState<string[]>([]);
  const [bachilleres, setBachilleres] = useState<string[]>([]);
  const [asigErr, setAsigErr] = useState<string | undefined>();
  const [sending, setSending] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const subjects = cat?.subjects ?? [];
  const eeb = cat?.eebGrades ?? [];
  const media = cat?.mediaCourses ?? [];
  const courses = [...(niveles.includes("EEB") ? eeb : []), ...(niveles.includes("MEDIA") ? media : [])];

  /** Cursos elegidos como número (los catálogos traen "1.º", "2.º", "3.º"). */
  const cursosNums = cursos
    .map((c) => Number(c.replace(/\D/g, "")))
    .filter((n) => Number.isFinite(n) && n > 0);

  /** Códigos de bachillerato de la Media (las materias de EEB no lo son). */
  const codigosBach = new Set((cat?.bachilleratos ?? []).map((b) => b.code));

  /** ¿La materia corresponde a la asignación académica elegida? */
  function materiaAlcanzable(s: (typeof subjects)[number], nums: number[], bach: string[]) {
    if (!nums.includes(s.gradeYear)) return false;
    if (codigosBach.has(s.academicCode) && bach.length > 0 && !bach.includes(s.academicCode)) return false;
    return true;
  }

  /**
   * Materias reales agrupadas por bachiller y curso, filtradas por la
   * asignación académica elegida: solo aparecen las materias de los cursos
   * seleccionados y, en la Media, de los bachiller(es) marcados.
   */
  const subjectGroups = (() => {
    const map = new Map<string, typeof subjects>();
    if (cursosNums.length > 0) {
      for (const s of subjects) {
        if (!materiaAlcanzable(s, cursosNums, bachilleres)) continue;
        const key = `${s.academicShort} · ${s.gradeYear}º`;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(s);
      }
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], "es"));
  })();
  const sinMaterias = cursosNums.length === 0 || niveles.includes("MEDIA") && bachilleres.length === 0;

  /** Si se cambia la asignación, las materias que ya no aplican se descartan. */
  function podarSeleccion(cursosNuevos: string[], bachNuevos: string[]) {
    const nums = cursosNuevos.map((c) => Number(c.replace(/\D/g, ""))).filter((n) => Number.isFinite(n) && n > 0);
    const sigue = (code: string) => {
      const s = subjects.find((x) => x.code === code);
      return !!s && materiaAlcanzable(s, nums, bachNuevos);
    };
    setMateriaPrincipal((m) => (m && !m.startsWith("OTRA:") && !sigue(m) ? "" : m));
    setOtras((o) => o.filter((v) => v.startsWith("OTRA:") || sigue(v)));
  }

  const toggle = (list: string[], v: string) =>
    list.includes(v) ? list.filter((x) => x !== v) : [...list, v];

  function addOtra() {
    setOtrasErr(undefined);
    if (!otraSel) {
      setOtrasErr("Elegí una materia de la lista");
      return;
    }
    let value = otraSel;
    if (otraSel === "__OTRA__") {
      if (!otraLibre.trim()) {
        setOtrasErr("Describí la materia");
        return;
      }
      value = `OTRA:${otraLibre.trim().slice(0, 80)}`;
    }
    const main = materiaPrincipal === "__OTRA__" ? `OTRA:${materiaPrincipalOtra.trim()}` : materiaPrincipal;
    if ((value === main && main) || otras.includes(value)) {
      setOtrasErr("Esa materia ya está agregada");
      return;
    }
    if (otras.length >= 6) {
      setOtrasErr("Máximo 6 materias");
      return;
    }
    setOtras((o) => [...o, value]);
    setOtraSel("");
    setOtraLibre("");
  }

  function materiaLabel(code: string): string {
    if (code.startsWith("OTRA:")) return `${code.slice(5)} (a revisar)`;
    const s = subjects.find((x) => x.code === code);
    return s ? `${s.name} (${s.code})` : code;
  }

  function validate(): boolean {
    const pe: PersonErrors = {};
    if (!/^\d{6,10}$/.test(person.ci.trim())) pe.ci = "Cédula inválida (6 a 10 dígitos)";
    if (!person.firstName.trim()) pe.firstName = "Obligatorio";
    if (!person.lastName.trim()) pe.lastName = "Obligatorio";
    if (person.phone.replace(/\D/g, "").length < 6) pe.phone = "Mínimo 6 dígitos";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(person.email.trim())) pe.email = "Correo inválido";
    setPErr(pe);

    let mp: string | undefined;
    if (!materiaPrincipal) mp = "Elegí tu materia principal";
    else if (materiaPrincipal === "__OTRA__" && !materiaPrincipalOtra.trim())
      mp = "Describí la materia";
    setMpErr(mp);

    let ae: string | undefined;
    if (niveles.length < 1) ae = "Elegí al menos un nivel";
    else if (cursos.length < 1) ae = "Elegí al menos un curso";
    else if (niveles.includes("MEDIA") && bachilleres.length < 1)
      ae = "Indicá en qué bachiller(es) enseñás";
    setAsigErr(ae);

    return Object.keys(pe).length === 0 && !mp && !ae;
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
          type: "docente",
          ci: person.ci.trim(),
          firstName: person.firstName.trim(),
          lastName: person.lastName.trim(),
          phone: person.phone.trim(),
          email: person.email.trim(),
          materiaPrincipal:
            materiaPrincipal === "__OTRA__" ? `OTRA:${materiaPrincipalOtra.trim()}` : materiaPrincipal,
          otrasMaterias: otras,
          niveles,
          cursos,
          bachilleres: niveles.includes("MEDIA") ? bachilleres : [],
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
          Recibimos tu solicitud como docente. Dirección la revisará, creará tu cuenta
          y te contactará al teléfono o correo indicados.
        </p>
      </SuccessView>
    );
  }

  return (
    <RegShell>
      <form onSubmit={submit} noValidate>
        <section className="reg-block">
          <SectionTitle n="1" title="Datos personales" desc="Tus datos como docente." icon={Icon.user} />
          <PersonFields
            value={person}
            errors={pErr}
            disabled={sending}
            onChange={(k, v) => setPerson((p) => ({ ...p, [k]: v }))}
          />
        </section>

        <section className="reg-block">
          <SectionTitle
            n="2"
            title="Asignación académica"
            desc="Niveles y cursos en los que enseñás. Con esto filtramos tus materias."
            icon={Icon.cap}
          />
          <p className="reg-hint" style={{ marginBottom: "0.5rem" }}>
            Niveles <em className="req not-italic" style={{ color: "var(--reg-err)" }}>*</em> (podés marcar Básica y Media)
          </p>
          <div className="reg-chips">
            {(["EEB", "MEDIA"] as const).map((n) => {
              const on = niveles.includes(n);
              return (
                <button
                  key={n}
                  type="button"
                  disabled={sending}
                  onClick={() => {
                    setNiveles((l) => (l.includes(n) ? l.filter((x) => x !== n) : [...l, n]));
                    setCursos([]);
                    setBachilleres([]);
                    setMateriaPrincipal("");
                    setOtras([]);
                  }}
                  aria-pressed={on}
                  className={`reg-chip${on ? " on" : ""}`}
                >
                  {on ? "✓ " : ""}{n === "EEB" ? "Escolar Básica (7.º–9.º)" : "Media (1.º–3.º)"}
                </button>
              );
            })}
          </div>

          <p className="reg-hint" style={{ margin: "0.9rem 0 0.5rem" }}>
            Cursos en los que enseña <em className="req not-italic" style={{ color: "var(--reg-err)" }}>*</em>
          </p>
          {niveles.length === 0 ? (
            <p className="reg-hint">Primero elegí al menos un nivel.</p>
          ) : (
            <div className="reg-chips">
              {niveles.includes("EEB") && eeb.map((c) => {
                const on = cursos.includes(`${c}`);
                return (
                  <button
                    key={`EEB-${c}`}
                    type="button"
                    disabled={sending}
                    onClick={() => {
                      const nueva = toggle(cursos, `${c}`);
                      setCursos(nueva);
                      podarSeleccion(nueva, bachilleres);
                    }}
                    aria-pressed={on}
                    title="Escolar Básica"
                    className={`reg-chip${on ? " on" : ""}`}
                  >
                    {on ? "✓ " : ""}{c} EEB
                  </button>
                );
              })}
              {niveles.includes("MEDIA") && media.map((c) => {
                const on = cursos.includes(`${c}`);
                return (
                  <button
                    key={`MEDIA-${c}`}
                    type="button"
                    disabled={sending}
                    onClick={() => {
                      const nueva = toggle(cursos, `${c}`);
                      setCursos(nueva);
                      podarSeleccion(nueva, bachilleres);
                    }}
                    aria-pressed={on}
                    title="Educación Media"
                    className={`reg-chip${on ? " on" : ""}`}
                  >
                    {on ? "✓ " : ""}{c} Media
                  </button>
                );
              })}
            </div>
          )}

          {niveles.includes("MEDIA") && (
            <div style={{ marginTop: "0.9rem" }}>
              <p className="reg-hint" style={{ marginBottom: "0.5rem" }}>
                ¿En qué bachiller(es) enseñás?{" "}
                <em className="req not-italic" style={{ color: "var(--reg-err)" }}>*</em>
              </p>
              <div className="reg-chips">
                {(cat?.bachilleratos ?? []).map((b) => {
                  const on = bachilleres.includes(b.code);
                  return (
                    <button
                      key={b.code}
                      type="button"
                      disabled={sending}
                      onClick={() => {
                        const nueva = toggle(bachilleres, b.code);
                        setBachilleres(nueva);
                        podarSeleccion(cursos, nueva);
                      }}
                      aria-pressed={on}
                      title={b.name}
                      className={`reg-chip${on ? " on" : ""}`}
                    >
                      {on ? "✓ " : ""}{b.shortName}
                    </button>
                  );
                })}
              </div>
              {(cat?.bachilleratos.length ?? 0) === 0 && (
                <p className="reg-hint">Aún no hay bachilleratos cargados.</p>
              )}
            </div>
          )}
        </section>

        <section className="reg-block">
          <SectionTitle n="3" title="Materia principal" desc="La materia que más horas enseñás." icon={Icon.book} />
          {sinMaterias ? (
            <p className="reg-hint">
              Primero elegí tus cursos {niveles.includes("MEDIA") ? "y bachiller(es)" : ""} en la sección 2
              (Asignación académica) y acá aparecerán solo las materias de esos cursos.
            </p>
          ) : subjectGroups.length === 0 ? (
            <p className="reg-hint">
              No hay materias registradas todavía para esos cursos: usá “Otra materia” y Dirección la cargará.
            </p>
          ) : (
            <div className="reg-grid">
              <Field label="Materia" required error={mpErr}>
                <select
                  value={materiaPrincipal}
                  onChange={(e) => setMateriaPrincipal(e.target.value)}
                  disabled={sending || !cat}
                  className="reg-select"
                >
                  <option value="">Seleccionar…</option>
                  {subjectGroups.map(([grupo, lista]) => (
                    <optgroup key={grupo} label={grupo}>
                      {lista.map((s) => (
                        <option key={s.code} value={s.code}>{s.name}</option>
                      ))}
                    </optgroup>
                  ))}
                  <option value="__OTRA__">Otra materia (especificar)…</option>
                </select>
              </Field>
              {materiaPrincipal === "__OTRA__" && (
                <Field label="¿Cuál?" required>
                  <input
                    value={materiaPrincipalOtra}
                    onChange={(e) => setMateriaPrincipalOtra(e.target.value)}
                    disabled={sending}
                    maxLength={80}
                    placeholder="Ej: Física"
                    className={inputCls}
                  />
                </Field>
              )}
            </div>
          )}
          {!sinMaterias && subjectGroups.length > 0 && (
            <p className="reg-hint" style={{ marginTop: "0.5rem" }}>
              Se muestran solo las materias de los cursos y bachiller(es) que elegiste arriba.
              Si enseñás otra cosa, usá “Otra materia”.
            </p>
          )}
          {materiaPrincipal === "__OTRA__" && (
            <FieldError msg={mpErr} />
          )}
        </section>

        <section className="reg-block">
          <SectionTitle
            n="4"
            title="Otras materias que enseña"
            desc="Podés completar esta información ahora o agregarla después desde tu perfil."
            icon={Icon.layers}
          />
          {sinMaterias || subjectGroups.length === 0 ? (
            <p className="reg-hint">
              Aparecerán las materias según la asignación académica de la sección 2. Igual podés
              agregar una materia distinta con “Otra materia”.
            </p>
          ) : (
            <>
              <div className="reg-chips" style={{ alignItems: "flex-end", gap: "0.5rem" }}>
                <label className="reg-field" style={{ flex: "1 1 auto" }}>
                  <span>Materia</span>
                  <select
                    value={otraSel}
                    onChange={(e) => setOtraSel(e.target.value)}
                    disabled={sending || !cat}
                    className="reg-select"
                  >
                    <option value="">Seleccionar…</option>
                    {subjectGroups.map(([grupo, lista]) => (
                      <optgroup key={grupo} label={grupo}>
                        {lista.map((s) => (
                          <option key={s.code} value={s.code}>{s.name}</option>
                        ))}
                      </optgroup>
                    ))}
                    <option value="__OTRA__">Otra materia (especificar)…</option>
                  </select>
                </label>
                {otraSel === "__OTRA__" && (
                  <label className="reg-field" style={{ flex: "0 0 10rem" }}>
                    <span>¿Cuál?</span>
                    <input
                      value={otraLibre}
                      onChange={(e) => setOtraLibre(e.target.value)}
                      disabled={sending}
                      maxLength={80}
                      placeholder="Ej: Química"
                      className={inputCls}
                    />
                  </label>
                )}
                <button type="button" onClick={addOtra} disabled={sending} className="reg-btn-add">
                  ＋ Agregar materia
                </button>
              </div>
              <FieldError msg={otrasErr} />
              {otras.length > 0 && (
                <div className="reg-tags">
                  {otras.map((o) => (
                    <span key={o} className="reg-tag">
                      {materiaLabel(o)}
                      <button
                        type="button"
                        disabled={sending}
                        onClick={() => setOtras((l) => l.filter((x) => x !== o))}
                        aria-label={`Quitar ${o}`}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
        </section>

        <FormError msg={serverError} />
        {catError && <p className="reg-field-err show" style={{ marginTop: "0.6rem" }}>{catError}</p>}

        <div style={{ marginTop: "0.2rem" }}>
          <SubmitButton sending={sending} label="Enviar solicitud" />
        </div>
        <RegFoot note="Podés completar o modificar materias y asignaciones después desde tu perfil, sin nueva solicitud." />
      </form>
    </RegShell>
  );
}
