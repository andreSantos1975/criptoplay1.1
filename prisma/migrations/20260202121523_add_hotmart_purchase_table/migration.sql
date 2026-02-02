-- CreateTable
CREATE TABLE "HotmartPurchase" (
    "id" TEXT NOT NULL,
    "buyerEmail" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HotmartPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HotmartPurchase_buyerEmail_key" ON "HotmartPurchase"("buyerEmail");
