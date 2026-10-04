-- Solicitudes de cuenta de tutores y docentes (revisa Dirección)
-- CreateTable
CREATE TABLE "account_requests" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'PENDIENTE',
    "note" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "account_requests_status_idx" ON "account_requests"("status");
