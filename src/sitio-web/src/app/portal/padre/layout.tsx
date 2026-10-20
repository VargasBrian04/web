import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/** Defensa en profundidad: además del middleware, valida el rol en el servidor. */
export default async function PadreLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/portal/padre");
  if (session.user.role !== "PARENT" && session.user.role !== "ADMIN") redirect("/no-autorizado");
  return children;
}
