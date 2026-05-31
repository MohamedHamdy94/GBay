-- DropIndex
DROP INDEX "Order_checkoutSessionId_key";

-- CreateIndex
CREATE INDEX "Order_checkoutSessionId_idx" ON "Order"("checkoutSessionId");
