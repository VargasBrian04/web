-- Inscripcion por nivel: EEB (sin bachillerato) + seccion/turno + aviso de correo
ALTER TABLE "enrollments" ADD COLUMN "nivel" TEXT;
ALTER TABLE "enrollments" ADD COLUMN "curso" TEXT;
ALTER TABLE "enrollments" ADD COLUMN "seccion" TEXT;
ALTER TABLE "enrollments" ADD COLUMN "turno" TEXT;
ALTER TABLE "enrollments" ADD COLUMN "emailSent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "enrollments" ALTER COLUMN "academicId" DROP NOT NULL;
