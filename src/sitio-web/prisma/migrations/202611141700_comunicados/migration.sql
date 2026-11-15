-- Comunicados publicos de Direccion y Secretaria, con adjuntos en la DB
CREATE TABLE "public_notices" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT,
    "body" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Comunicado',
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "publishedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "public_notices_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "public_notices_slug_key" ON "public_notices"("slug");
CREATE INDEX "public_notices_active_publishedAt_idx" ON "public_notices"("active", "publishedAt");

CREATE TABLE "public_notice_files" (
    "id" TEXT NOT NULL,
    "noticeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "data" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "public_notice_files_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "public_notice_files_noticeId_idx" ON "public_notice_files"("noticeId");

ALTER TABLE "public_notice_files"
ADD CONSTRAINT "public_notice_files_noticeId_fkey"
FOREIGN KEY ("noticeId") REFERENCES "public_notices"("id")
ON DELETE CASCADE ON UPDATE CASCADE;