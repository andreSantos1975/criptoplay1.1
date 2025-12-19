-- CreateEnum
CREATE TYPE "PositionSide" AS ENUM ('LONG', 'SHORT');

-- CreateEnum
CREATE TYPE "PositionStatus" AS ENUM ('OPEN', 'CLOSED', 'LIQUIDATED');

-- CreateTable
CREATE TABLE "FuturesPosition" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "side" "PositionSide" NOT NULL,
    "status" "PositionStatus" NOT NULL DEFAULT 'OPEN',
    "quantity" DECIMAL(18,8) NOT NULL,
    "leverage" INTEGER NOT NULL,
    "entryPrice" DECIMAL(18,8) NOT NULL,
    "liquidationPrice" DECIMAL(18,8) NOT NULL,
    "margin" DECIMAL(18,8) NOT NULL,
    "pnl" DECIMAL(18,8),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FuturesPosition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FuturesPosition_userId_status_idx" ON "FuturesPosition"("userId", "status");

-- AddForeignKey
ALTER TABLE "FuturesPosition" ADD CONSTRAINT "FuturesPosition_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
