/*
  Warnings:

  - You are about to drop the `HotmartPurchase` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "HotmartPurchase";

-- CreateTable
CREATE TABLE "ebook_purchases" (
    "id" TEXT NOT NULL,
    "buyerEmail" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "productId" TEXT,
    "price" DECIMAL(10,2),
    "transactionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ebook_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ebook_purchases_transactionId_key" ON "ebook_purchases"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "ebook_purchases_buyerEmail_platform_key" ON "ebook_purchases"("buyerEmail", "platform");
