-- Directorio público de contactos por área
CREATE TABLE "contact_areas" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "detail" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "hours" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_areas_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "contact_areas_active_order_idx" ON "contact_areas"("active", "order");