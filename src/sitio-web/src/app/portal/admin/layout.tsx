import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/** Defensa en profundidad: además del middleware, valida el rol en el servidor. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/portal/admin");
  if (session.user.role !== "ADMIN") redirect("/no-autorizado");
  return children;
}
