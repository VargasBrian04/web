import TutorForm from "@/components/registro/TutorForm";

export const metadata = { title: "Registro de tutor" };

export default function RegistroTutorPage() {
  return (
    <div className="container-c py-16">
      <a href="/registro" className="text-sm font-semibold text-slate-500 hover:text-[var(--institutional)]">
        ← Elegir otro perfil
      </a>
      <h1 className="section-title mt-2">Registro de tutor / encargado</h1>
      <p className="mt-3 max-w-3xl text-slate-600">
        Tus datos y los de tus hijos. Dirección revisará la solicitud antes de crear tu cuenta.
      </p>
      <div className="mt-8">
        <TutorForm />
      </div>
    </div>
  );
}
