-- CreateTable
CREATE TABLE "SellerDashboardMetrics" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "totalListings" INTEGER NOT NULL DEFAULT 0,
    "activeAuctions" INTEGER NOT NULL DEFAULT 0,
    "soldItemsThisMonth" INTEGER NOT NULL DEFAULT 0,
    "pendingPayouts" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "totalEarnings" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "recentOrders" JSONB,
    "salesLast7Days" JSONB,
    "lowStockItems" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SellerDashboardMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SellerDashboardMetrics_sellerId_key" ON "SellerDashboardMetrics"("sellerId");

-- AddForeignKey
ALTER TABLE "SellerDashboardMetrics" ADD CONSTRAINT "SellerDashboardMetrics_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "SellerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
