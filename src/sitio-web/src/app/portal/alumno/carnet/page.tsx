import { redirect } from "next/navigation";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** /portal/alumno/carnet — carné del alumno con QR verificable. */
export default async function CarnetPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/portal/alumno/carnet");
  if (session.user.role !== "STUDENT" && session.user.role !== "ADMIN")
    redirect("/no-autorizado");

  const student =
    session.user.role === "ADMIN"
      ? await prisma.student.findFirst({
          include: { user: true, academic: true },
          orderBy: { userId: "asc" },
        })
      : await prisma.student.findUnique({
          where: { userId: session.user.id },
          include: { user: true, academic: true },
        });
  if (!student) redirect("/portal/alumno");

  const host = (await headers()).get("host") ?? "colegio-solano-lopez.vercel.app";
  const verifyUrl = `https://${host}/carnet/${student.id}`;
  const qr = await QRCode.toDataURL(verifyUrl, { width: 280, margin: 1 });
  const nombre = `${student.user.firstName} ${student.user.lastName}`;

  return (
    <div className="mx-auto max-w-md">
      <div className="overflow-hidden rounded-3xl border-2 border-[#c9a35c] bg-white shadow-xl">
        <div className="bg-gradient-to-r from-[#5d0f1d] to-[#3a0912] p-5 text-center text-white">
          <p className="text-xs font-bold uppercase tracking-widest text-[#e9c98f]">
            Carné estudiantil
          </p>
          <h1 className="mt-1 text-lg font-black">Mariscal Francisco Solano López</h1>
        </div>
        <div className="p-6 text-center">
          <p className="text-2xl font-extrabold text-[var(--institutional)]">{nombre}</p>
          <p className="mt-1 text-sm text-slate-500">
            CI {student.user.ci} · {student.academic ? student.academic.name : "Sin bachillerato asignado"}
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="QR del carné" className="mx-auto mt-4 h-56 w-56" />
          <p className="mt-2 font-mono text-xs text-slate-400">{student.id}</p>
          <p className="mt-3 text-xs text-slate-500">
            Escaneá el QR para verificar la identidad del estudiante.
          </p>
        </div>
      </div>
    </div>
  );
}
