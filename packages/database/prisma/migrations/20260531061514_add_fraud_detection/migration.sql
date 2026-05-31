-- CreateEnum
CREATE TYPE "FraudAction" AS ENUM ('LOG', 'FLAG', 'BLOCK');

-- CreateEnum
CREATE TYPE "FraudSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "FraudSignalStatus" AS ENUM ('OPEN', 'UNDER_INVESTIGATION', 'RESOLVED', 'DISMISSED');

-- CreateTable
CREATE TABLE "FraudRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "condition" JSONB NOT NULL,
    "action" "FraudAction" NOT NULL DEFAULT 'LOG',
    "severity" "FraudSeverity" NOT NULL DEFAULT 'LOW',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FraudRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FraudSignal" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sellerId" TEXT,
    "ruleId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "severity" "FraudSeverity" NOT NULL,
    "status" "FraudSignalStatus" NOT NULL DEFAULT 'OPEN',
    "evidence" JSONB,
    "resolution" TEXT,
    "resolvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FraudSignal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FraudRule_name_key" ON "FraudRule"("name");

-- CreateIndex
CREATE INDEX "FraudRule_enabled_idx" ON "FraudRule"("enabled");

-- CreateIndex
CREATE INDEX "FraudSignal_userId_status_idx" ON "FraudSignal"("userId", "status");

-- CreateIndex
CREATE INDEX "FraudSignal_sellerId_status_idx" ON "FraudSignal"("sellerId", "status");

-- CreateIndex
CREATE INDEX "FraudSignal_ruleId_status_idx" ON "FraudSignal"("ruleId", "status");

-- CreateIndex
CREATE INDEX "FraudSignal_entityType_entityId_idx" ON "FraudSignal"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "FraudSignal" ADD CONSTRAINT "FraudSignal_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "FraudRule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
