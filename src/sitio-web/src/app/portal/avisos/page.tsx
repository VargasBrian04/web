import Avisos from "@/components/portal/Avisos";

export const metadata = { title: "Avisos" };

/** /portal/avisos — comunicados de Dirección con lectura confirmada. */
export default function AvisosPage() {
  return (
    <div className="grid gap-6">
      <section className="rounded-2xl bg-[var(--institutional)] p-6 text-white">
        <h2 className="text-xl font-extrabold">Avisos</h2>
        <p className="mt-1 text-sm text-stone-200">Comunicados de Dirección. Confirmá la lectura.</p>
      </section>
      <Avisos />
    </div>
  );
}
