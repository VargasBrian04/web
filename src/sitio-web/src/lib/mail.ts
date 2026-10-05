import nodemailer from "nodemailer";

/**
 * Aviso por correo a Dirección. Requiere variables en Vercel:
 * SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS (contraseña de aplicación).
 * Sin configuración no rompe: la solicitud igual se guarda y queda pendiente.
 */

const DESTINO = "colegionacionalemd6@gmail.com";

export function mailConfigurado(): boolean {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export async function avisarInscripcion(detalle: {
  codigo: string;
  alumno: string;
  ci: string;
  nivel: string;
  curso: string;
  seccion?: string | null;
  turno: string;
  bachiller?: string | null;
  tutor: string;
  tutorTelefono: string;
}): Promise<boolean> {
  if (!mailConfigurado()) {
    console.warn("MAIL_SKIP sin SMTP configurado", detalle.codigo);
    return false;
  }
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: DESTINO,
      subject: `Nueva solicitud de inscripción ${detalle.codigo} — ${detalle.alumno}`,
      text: [
        `Nueva solicitud de inscripción (${detalle.codigo}) para revisión.`,
        ``,
        `Alumno: ${detalle.alumno} (CI ${detalle.ci})`,
        `Nivel: ${detalle.nivel} ${detalle.curso}${detalle.seccion ? ` "${detalle.seccion}"` : ""} — Turno ${detalle.turno}`,
        ...(detalle.bachiller ? [`Bachillerato: ${detalle.bachiller}`] : []),
        `Tutor: ${detalle.tutor} — Tel: ${detalle.tutorTelefono}`,
        ``,
        `Revisar en el panel de administración.`,
      ].join("\n"),
    });
    return true;
  } catch (e) {
    console.error("MAIL_ERROR", e);
    return false;
  }
}
