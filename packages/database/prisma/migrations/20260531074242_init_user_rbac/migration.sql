-- CreateTable
CREATE TABLE "SecurityIncident" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" "FraudSeverity" NOT NULL,
    "ipAddress" TEXT,
    "userId" TEXT,
    "userAgent" TEXT,
    "endpoint" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityIncident_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SecurityIncident_type_createdAt_idx" ON "SecurityIncident"("type", "createdAt");

-- CreateIndex
CREATE INDEX "SecurityIncident_ipAddress_createdAt_idx" ON "SecurityIncident"("ipAddress", "createdAt");

-- CreateIndex
CREATE INDEX "SecurityIncident_userId_createdAt_idx" ON "SecurityIncident"("userId", "createdAt");
