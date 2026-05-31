-- CreateEnum
CREATE TYPE "InteractionType" AS ENUM ('VIEW', 'SEARCH', 'CLICK');

-- CreateEnum
CREATE TYPE "RecommendationType" AS ENUM ('BASED_ON_HISTORY', 'SIMILAR_PRODUCTS', 'TRENDING', 'FREQUENTLY_BOUGHT_TOGETHER', 'AUCTIONS_ENDING_SOON');

-- CreateTable
CREATE TABLE "UserInteraction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "listingId" TEXT,
    "interaction" "InteractionType" NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommendationCache" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "type" "RecommendationType" NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reason" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecommendationCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductSimilarity" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "similarProductId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductSimilarity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrendingProduct" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "orderCount" INTEGER NOT NULL DEFAULT 0,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "window" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrendingProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserInteraction_userId_createdAt_idx" ON "UserInteraction"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "UserInteraction_listingId_createdAt_idx" ON "UserInteraction"("listingId", "createdAt");

-- CreateIndex
CREATE INDEX "RecommendationCache_userId_type_score_idx" ON "RecommendationCache"("userId", "type", "score" DESC);

-- CreateIndex
CREATE INDEX "RecommendationCache_expiresAt_idx" ON "RecommendationCache"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "RecommendationCache_userId_productId_type_key" ON "RecommendationCache"("userId", "productId", "type");

-- CreateIndex
CREATE INDEX "ProductSimilarity_productId_score_idx" ON "ProductSimilarity"("productId", "score" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "ProductSimilarity_productId_similarProductId_key" ON "ProductSimilarity"("productId", "similarProductId");

-- CreateIndex
CREATE UNIQUE INDEX "TrendingProduct_productId_key" ON "TrendingProduct"("productId");

-- CreateIndex
CREATE INDEX "TrendingProduct_window_score_idx" ON "TrendingProduct"("window", "score" DESC);

-- AddForeignKey
ALTER TABLE "UserInteraction" ADD CONSTRAINT "UserInteraction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInteraction" ADD CONSTRAINT "UserInteraction_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationCache" ADD CONSTRAINT "RecommendationCache_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationCache" ADD CONSTRAINT "RecommendationCache_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSimilarity" ADD CONSTRAINT "ProductSimilarity_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSimilarity" ADD CONSTRAINT "ProductSimilarity_similarProductId_fkey" FOREIGN KEY ("similarProductId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrendingProduct" ADD CONSTRAINT "TrendingProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
