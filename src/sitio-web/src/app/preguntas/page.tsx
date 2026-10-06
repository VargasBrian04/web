export const metadata = { title: "Preguntas frecuentes" };

const FAQS: { q: string; a: string }[] = [
  {
    q: "¿La enseñanza es gratuita?",
    a: "Sí. Somos una institución pública: no se cobra matrícula ni aranceles.",
  },
  {
    q: "¿Cómo me inscribo?",
    a: "Completá la solicitud en la página Inscripciones con los datos del aspirante, el tutor y los documentos. Secretaría la revisa y te contacta.",
  },
  {
    q: "¿Qué niveles ofrecen?",
    a: "Educación Escolar Básica (7.º a 9.º) y Educación Media con bachilleratos científicos, en servicios y técnicos.",
  },
  {
    q: "¿Cómo creo mi cuenta de tutor o docente?",
    a: "Desde Registro enviás tu solicitud con tus datos. Dirección la aprueba y te contacta con tu usuario.",
  },
  {
    q: "Olvidé mi contraseña, ¿qué hago?",
    a: "Consultá en Secretaría (lunes a viernes 07:00 a 17:00) o escribinos por WhatsApp al 0975 493753.",
  },
  {
    q: "¿Dónde veo las notas de mi hijo?",
    a: "Ingresá como tutor en Acceder y abrí la ficha de cada hijo vinculado.",
  },
  {
    q: "¿Cómo activo los avisos del navegador?",
    a: "Dentro del portal, tocá el botón Activar avisos y aceptá el permiso. Te llegan los comunicados aunque no tengas la página abierta.",
  },
];

/** /preguntas — preguntas frecuentes. */
export default function PreguntasPage() {
  return (
    <section className="container-c max-w-3xl py-14">
      <h1 className="section-title">Preguntas frecuentes</h1>
      <div className="mt-8 grid gap-3">
        {FAQS.map((f) => (
          <details key={f.q} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <summary className="cursor-pointer font-extrabold text-[var(--institutional)]">
              {f.q}
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
