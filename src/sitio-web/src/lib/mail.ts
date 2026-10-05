/** Aviso por correo — ver mailConfigurado() abajo. */

/**
 * Aviso por correo a Dirección. Dos vías (se usa la primera configurada):
 *  1) Resend (recomendado): RESEND_API_KEY (+ RESEND_FROM opcional).
 *     Sin dominio propio solo permite enviar al correo de la cuenta:
 *     registrando colegionacionalemd6@gmail.com alcanza, porque es el destino.
 *  2) SMTP clásico: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS.
 * Sin configuración no rompe: la solicitud igual se guarda y queda pendiente.
 */

const DESTINO = "colegionacionalemd6@gmail.com";

export function mailConfigurado(): boolean {
  return !!(
    process.env.RESEND_API_KEY ||
    (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
  );
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
  const texto = [
    `Nueva solicitud de inscripción (${detalle.codigo}) para revisión.`,
    ``,
    `Alumno: ${detalle.alumno} (CI ${detalle.ci})`,
    `Nivel: ${detalle.nivel} ${detalle.curso}${detalle.seccion ? ` "${detalle.seccion}"` : ""} — Turno ${detalle.turno}`,
    ...(detalle.bachiller ? [`Bachillerato: ${detalle.bachiller}`] : []),
    `Tutor: ${detalle.tutor} — Tel: ${detalle.tutorTelefono}`,
    ``,
    `Revisar en el panel de administración.`,
  ].join("\n");
  const asunto = `Nueva solicitud de inscripción ${detalle.codigo} — ${detalle.alumno}`;

  // Vía 1: Resend (HTTP, sin SMTP)
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM || "Colegio <onboarding@resend.dev>",
          to: [DESTINO],
          subject: asunto,
          text: texto,
        }),
      });
      if (res.ok) return true;
      console.error("RESEND_ERROR", res.status, (await res.text()).slice(0, 300));
    } catch (e) {
      console.error("RESEND_ERROR", e);
    }
  }

  // Vía 2: SMTP clásico
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const nodemailer = (await import("nodemailer")).default;
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: DESTINO,
        subject: asunto,
        text: texto,
      });
      return true;
    } catch (e) {
      console.error("MAIL_ERROR", e);
      return false;
    }
  }

  console.warn("MAIL_SKIP sin correo configurado", detalle.codigo);
  return false;
}
