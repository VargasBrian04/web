-- Tareas con PDF y observaciones + foto de perfil del docente
ALTER TABLE "assignments" ADD COLUMN "fileData" TEXT;
ALTER TABLE "assignments" ADD COLUMN "notes" TEXT;
ALTER TABLE "teachers" ADD COLUMN "photo" TEXT;
