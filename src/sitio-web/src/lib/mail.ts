/**
 * Correo del colegio. Dos vías (se usa la primera configurada):
 *  1) Resend (recomendado): RESEND_API_KEY (+ RESEND_FROM opcional).
 *     Sin dominio propio solo permite enviar al correo de la cuenta.
 *  2) SMTP clásico: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS.
 * Sin configuración no rompe: todo igual se guarda y queda pendiente.
 */

const DESTINO = "colegionacionalemd6@gmail.com";

export function mailConfigurado(): boolean {
  return !!(
    process.env.RESEND_API_KEY ||
    (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
  );
}

/** Envío genérico a varios destinatarios (Resend o SMTP). Devuelve cuántos OK. */
export async function enviarCorreo(
  to: string[],
  subject: string,
  text: string
): Promise<number> {
  const dest = [...new Set(to.map((t) => t.trim().toLowerCase()).filter(Boolean))].slice(0, 400);
  if (!dest.length) return 0;
  if (process.env.RESEND_API_KEY) {
    try {
      // Resend sin dominio propio: de a un destinatario por llamada.
      let ok = 0;
      for (const d of dest) {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM || "Colegio <onboarding@resend.dev>",
            to: [d],
            subject,
            text,
          }),
        });
        if (res.ok) ok++;
        else console.error("RESEND_ERROR", res.status, (await res.text()).slice(0, 200));
      }
      return ok;
    } catch (e) {
      console.error("RESEND_ERROR", e);
      return 0;
    }
  }
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const nodemailer = (await import("nodemailer")).default;
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
      await transporter.sendMail({ from: process.env.SMTP_USER, to: dest, subject, text });
      return dest.length;
    } catch (e) {
      console.error("MAIL_ERROR", e);
      return 0;
    }
  }
  console.warn("MAIL_SKIP sin correo configurado");
  return 0;
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
  const ok = await enviarCorreo(
    [DESTINO],
    `Nueva solicitud de inscripción ${detalle.codigo} — ${detalle.alumno}`,
    texto
  );
  return ok > 0;
}
