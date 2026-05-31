/*
  Warnings:

  - Changed the type of `window` on the `TrendingProduct` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "TrendingWindow" AS ENUM ('DAILY', 'WEEKLY');

-- AlterTable
ALTER TABLE "OrderItem" ALTER COLUMN "listingId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "TrendingProduct" DROP COLUMN "window",
ADD COLUMN     "window" "TrendingWindow" NOT NULL;

-- CreateIndex
CREATE INDEX "TrendingProduct_window_score_idx" ON "TrendingProduct"("window", "score" DESC);
