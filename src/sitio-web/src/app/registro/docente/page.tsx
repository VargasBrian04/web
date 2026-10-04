import DocenteForm from "@/components/registro/DocenteForm";

export const metadata = { title: "Registro de docente" };

export default function RegistroDocentePage() {
  return (
    <div className="container-c py-16">
      <a href="/registro" className="text-sm font-semibold text-slate-500 hover:text-[var(--institutional)]">
        ← Elegir otro perfil
      </a>
      <h1 className="section-title mt-2">Registro de docente</h1>
      <p className="mt-3 max-w-3xl text-slate-600">
        Tus datos, materia principal y asignación académica. Las otras materias son opcionales.
      </p>
      <div className="mt-8">
        <DocenteForm />
      </div>
    </div>
  );
}
