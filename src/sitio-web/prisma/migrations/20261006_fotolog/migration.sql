-- Bitacora de fotos: asistencia y planillas de tareas (independiente de Crear tarea)
CREATE TABLE "photo_logs" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "photoData" TEXT NOT NULL,
    "caption" TEXT,
    "logDate" TIMESTAMP(3) NOT NULL,
    "subjectId" TEXT,
    "teacherId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "photo_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "photo_logs_kind_logDate_idx" ON "photo_logs"("kind", "logDate");
