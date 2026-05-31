-- CreateEnum
CREATE TYPE "ListingType" AS ENUM ('BUY_NOW', 'AUCTION', 'HYBRID');

-- CreateEnum
CREATE TYPE "InventoryReservationStatus" AS ENUM ('ACTIVE', 'CONSUMED', 'RELEASED', 'EXPIRED');

-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "currency" "Currency" NOT NULL DEFAULT 'EUR',
ADD COLUMN     "type" "ListingType" NOT NULL DEFAULT 'BUY_NOW',
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "InventorySegment" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "segmentNo" INTEGER NOT NULL,
    "availableQuantity" INTEGER NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "InventorySegment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryReservation" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "status" "InventoryReservationStatus" NOT NULL DEFAULT 'ACTIVE',
    "idempotencyKey" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryReservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InventorySegment_listingId_availableQuantity_idx" ON "InventorySegment"("listingId", "availableQuantity");

-- CreateIndex
CREATE UNIQUE INDEX "InventorySegment_listingId_segmentNo_key" ON "InventorySegment"("listingId", "segmentNo");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryReservation_idempotencyKey_key" ON "InventoryReservation"("idempotencyKey");

-- CreateIndex
CREATE INDEX "InventoryReservation_listingId_status_idx" ON "InventoryReservation"("listingId", "status");

-- CreateIndex
CREATE INDEX "InventoryReservation_userId_status_idx" ON "InventoryReservation"("userId", "status");

-- CreateIndex
CREATE INDEX "InventoryReservation_expiresAt_idx" ON "InventoryReservation"("expiresAt");

-- CreateIndex
CREATE INDEX "Listing_type_status_idx" ON "Listing"("type", "status");

-- AddForeignKey
ALTER TABLE "InventoryReservation" ADD CONSTRAINT "InventoryReservation_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
