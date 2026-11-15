-- Banner de avisos del sitio publico (solo agrega tabla nueva)
CREATE TABLE "site_alerts" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'INFO',
    "link" TEXT,
    "linkLabel" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_alerts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "site_alerts_active_startsAt_endsAt_idx" ON "site_alerts"("active", "startsAt", "endsAt");
