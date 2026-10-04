import RolePicker from "@/components/portal/RolePicker";

export const metadata = { title: "Elegí tu perfil" };

/** /acceso — selector de perfil: Docente / Padre-Tutor / Alumno. */
export default function AccesoPage() {
  return (
    <section className="container-c py-10">
      <RolePicker />
      <p className="mx-auto mt-4 max-w-4xl text-center text-xs text-slate-500">
        Dirección y Secretaría ingresan con su usuario en “Soy Docente” o directo en{" "}
        <a href="/login?next=/portal/admin" className="font-bold underline">
          /portal/admin
        </a>
        . Tras iniciar sesión, el sistema te lleva a tu zona según tu rol.
      </p>
    </section>
  );
}
