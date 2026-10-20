/**
 * Rotación de contraseña de una cuenta (Dirección/Secretaría o docente).
 *
 * Uso recomendado (la contraseña no queda en el historial del shell):
 *   $env:RESET_USER="direccion"; $env:RESET_PASSWORD="..."; npm run reset:password
 *
 * También acepta argumentos (quedan en el historial):
 *   npm run reset:password -- --user direccion --password "..."
 *
 * Nota: las sesiones son JWT; cambiar la contraseña no revoca tokens ya
 * emitidos (expiran solos en 8 h). Para cortar todo, rotar NEXTAUTH_SECRET.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { normalizeUsername } from "../src/lib/users";

const prisma = new PrismaClient();

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  const identifier = (process.env.RESET_USER || arg("user") || "").trim();
  const password = process.env.RESET_PASSWORD || arg("password") || "";
  if (!identifier) {
    console.error("Falta el usuario/correo/CI (RESET_USER o --user).");
    process.exit(1);
  }
  if (password.length < 12) {
    console.error("La contraseña debe tener al menos 12 caracteres.");
    process.exit(1);
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { username: normalizeUsername(identifier) },
        { email: identifier.toLowerCase() },
        { ci: identifier.replace(/\D/g, "") || identifier },
      ],
    },
    select: { id: true, username: true, email: true, role: true },
  });
  if (!user) {
    console.error("No existe una cuenta con ese identificador.");
    process.exit(1);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(password, 10) },
  });

  console.log(`Contraseña actualizada para @${user.username} (${user.role}).`);
  console.log("Las sesiones JWT activas siguen válidas hasta 8 h. Rotá NEXTAUTH_SECRET para cortarlas ya.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
