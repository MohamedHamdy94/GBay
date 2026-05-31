-- CreateTable
CREATE TABLE "SearchIndexJob" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "SearchIndexJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SearchIndexJob_status_createdAt_idx" ON "SearchIndexJob"("status", "createdAt");
