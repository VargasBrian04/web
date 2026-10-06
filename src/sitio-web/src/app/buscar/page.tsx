import { prisma } from "@/lib/prisma";

export const metadata = { title: "Buscar" };
export const dynamic = "force-dynamic";

/** /buscar — buscador global: noticias, docentes y cursos. */
export default async function BuscarPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const q = ((await searchParams).q || "").trim().slice(0, 60);
  let news: { slug: string; title: string }[] = [];
  let teachers: { nombre: string; materia: string }[] = [];
  let courses: { nombre: string }[] = [];
  if (q.length >= 2) {
    try {
      const [n, t, c] = await Promise.all([
        prisma.newsPost.findMany({
          where: { status: "PUBLICADA", title: { contains: q, mode: "insensitive" } },
          select: { slug: true, title: true },
          take: 10,
        }),
        prisma.teacher.findMany({
          where: {
            user: {
              active: true,
              role: "TEACHER",
              OR: [
                { firstName: { contains: q, mode: "insensitive" } },
                { lastName: { contains: q, mode: "insensitive" } },
              ],
            },
          },
          select: {
            user: { select: { firstName: true, lastName: true } },
            subjects: { select: { subject: { select: { name: true } } }, take: 1 },
          },
          take: 10,
        }),
        prisma.course.findMany({
          where: { active: true, nombre: { contains: q, mode: "insensitive" } },
          select: { nombre: true },
          take: 10,
        }),
      ]);
      news = n;
      teachers = t.map((x) => ({
        nombre: `${x.user.firstName} ${x.user.lastName}`,
        materia: x.subjects[0]?.subject.name ?? "Docente",
      }));
      courses = c;
    } catch {
      /* sin DB */
    }
  }
  const total = news.length + teachers.length + courses.length;

  return (
    <section className="container-c max-w-3xl py-14">
      <h1 className="section-title">Buscar en el sitio</h1>
      <form method="get" action="/buscar" className="mt-6 flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Noticias, docentes, cursos…"
          minLength={2}
          className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[var(--institutional)]"
        />
        <button type="submit" className="btn-primary shrink-0">
          Buscar
        </button>
      </form>
      {q.length >= 2 && (
        <p className="mt-4 text-sm text-slate-500">
          {total === 0 ? `Sin resultados para “${q}”.` : `${total} resultado(s) para “${q}”.`}
        </p>
      )}
      {news.length > 0 && (
        <div className="mt-6">
          <h2 className="font-extrabold text-[var(--institutional)]">Noticias</h2>
          <ul className="mt-2 grid gap-2">
            {news.map((n) => (
              <li key={n.slug}>
                <a href={`/noticias/${n.slug}`} className="block rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm font-semibold hover:border-[var(--institutional)]">
                  📰 {n.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      {teachers.length > 0 && (
        <div className="mt-6">
          <h2 className="font-extrabold text-[var(--institutional)]">Docentes</h2>
          <ul className="mt-2 grid gap-2">
            {teachers.map((t) => (
              <li key={t.nombre} className="rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm">
                👨‍🏫 <b>{t.nombre}</b> <span className="text-slate-500">· {t.materia}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {courses.length > 0 && (
        <div className="mt-6">
          <h2 className="font-extrabold text-[var(--institutional)]">Cursos</h2>
          <ul className="mt-2 grid gap-2">
            {courses.map((c) => (
              <li key={c.nombre} className="rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm">
                🎓 {c.nombre}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
