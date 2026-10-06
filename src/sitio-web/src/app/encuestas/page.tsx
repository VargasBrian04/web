import Polls from "@/components/encuestas/Polls";

export const metadata = { title: "Encuestas" };

/** /encuestas — votar y ver resultados. */
export default function EncuestasPage() {
  return (
    <section className="container-c max-w-3xl py-14">
      <h1 className="section-title">Encuestas</h1>
      <p className="mt-2 text-slate-600">Tu opinión cuenta. Un voto por persona.</p>
      <div className="mt-8">
        <Polls />
      </div>
    </section>
  );
}
