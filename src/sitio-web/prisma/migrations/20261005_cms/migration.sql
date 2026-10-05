-- Ficha publica del docente + contenido editable + galeria real
ALTER TABLE "teachers" ADD COLUMN "bio" TEXT;
ALTER TABLE "teachers" ADD COLUMN "schedule" TEXT;

CREATE TABLE "site_contents" (
    "key" TEXT NOT NULL,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "site_contents_pkey" PRIMARY KEY ("key")
);

CREATE TABLE "gallery_items" (
    "id" TEXT NOT NULL,
    "slot" TEXT NOT NULL,
    "category" TEXT,
    "caption" TEXT,
    "imageFile" TEXT NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "gallery_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "gallery_items_slot_createdAt_idx" ON "gallery_items"("slot", "createdAt");
