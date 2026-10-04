import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/** /portal — deriva al home según rol (el login cae aquí). */
export default async function PortalIndex() {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/portal");
  switch (session.user.role) {
    case "ADMIN": redirect("/portal/admin");
    case "TEACHER": redirect("/portal/profesor");
    case "STUDENT": redirect("/portal/alumno");
    case "PARENT": redirect("/portal/padre");
    default: redirect("/inscripciones");
  }
}
