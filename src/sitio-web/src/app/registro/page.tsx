import Link from "next/link";

export const metadata = { title: "Registro de tutores y docentes" };

/**
 * /registro — hub: el tipo de usuario se elige primero (tutor o docente),
 * cada uno con su formulario independiente. Sin pasos repetidos.
 */
export default function RegistroPage() {
  return (
    <div className="container-c py-16">
      <h1 className="section-title">Registro de tutores y docentes</h1>
      <p className="mt-3 max-w-3xl text-slate-600">
        Completá la solicitud según tu perfil. Dirección la revisará, creará tu
        cuenta y te contactará. Los alumnos no se registran aquí: el tutor los
        vincula como sus hijos en Secretaría.
      </p>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Link
          href="/registro/tutor"
          className="group rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
        >
          <p className="text-5xl">👨‍👩‍👧</p>
          <h2 className="mt-4 text-xl font-extrabold text-[var(--institutional)]">
            Soy tutor / encargado
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Registrá tus datos y los de tus hijos a cargo (nivel, curso y
            bachillerato). Podés agregar varios hijos en la misma solicitud.
          </p>
          <span className="btn-primary mt-6">Comenzar registro →</span>
        </Link>
        <Link
          href="/registro/docente"
          className="group rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
        >
          <p className="text-5xl">👨‍🏫</p>
          <h2 className="mt-4 text-xl font-extrabold text-[var(--institutional)]">
            Soy docente
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Registrá tus datos, tu materia principal y los cursos en los que
            enseñás. Las otras materias son opcionales.
          </p>
          <span className="btn-gold mt-6">Comenzar registro →</span>
        </Link>
      </div>
      <p className="mt-8 text-sm text-slate-500">
        ¿Ya tenés cuenta?{" "}
        <a href="/acceso" className="font-bold text-[var(--institutional)] underline">
          Accedé al portal
        </a>
        . ¿Sos alumno? Tu tutor gestiona tu vinculación en Secretaría.
      </p>
    </div>
  );
}
