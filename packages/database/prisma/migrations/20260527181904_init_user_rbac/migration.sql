-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('EUR', 'USD');

-- CreateEnum
CREATE TYPE "SellerStatus" AS ENUM ('NOT_STARTED', 'SUBMITTED', 'IN_REVIEW', 'NEEDS_MORE_INFO', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- CreateTable
CREATE TABLE "SellerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "businessName" TEXT,
    "businessType" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL DEFAULT 'DE',
    "payoutCurrency" "Currency" NOT NULL DEFAULT 'EUR',
    "status" "SellerStatus" NOT NULL DEFAULT 'SUBMITTED',
    "rejectionReason" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "suspendedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SellerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SellerVerificationEvent" (
    "id" TEXT NOT NULL,
    "sellerProfileId" TEXT NOT NULL,
    "fromStatus" "SellerStatus",
    "toStatus" "SellerStatus" NOT NULL,
    "actorUserId" TEXT,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SellerVerificationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SellerProfile_userId_key" ON "SellerProfile"("userId");

-- CreateIndex
CREATE INDEX "SellerProfile_status_submittedAt_idx" ON "SellerProfile"("status", "submittedAt");

-- CreateIndex
CREATE INDEX "SellerProfile_countryCode_status_idx" ON "SellerProfile"("countryCode", "status");

-- CreateIndex
CREATE INDEX "SellerVerificationEvent_sellerProfileId_createdAt_idx" ON "SellerVerificationEvent"("sellerProfileId", "createdAt");

-- CreateIndex
CREATE INDEX "SellerVerificationEvent_toStatus_createdAt_idx" ON "SellerVerificationEvent"("toStatus", "createdAt");

-- AddForeignKey
ALTER TABLE "SellerProfile" ADD CONSTRAINT "SellerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellerVerificationEvent" ADD CONSTRAINT "SellerVerificationEvent_sellerProfileId_fkey" FOREIGN KEY ("sellerProfileId") REFERENCES "SellerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
