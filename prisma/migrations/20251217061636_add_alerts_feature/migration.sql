-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('PRICE', 'BUDGET', 'BILL');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('ACTIVE', 'TRIGGERED', 'ACKNOWLEDGED', 'DELETED');

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "AlertType" NOT NULL,
    "config" JSONB NOT NULL,
    "status" "AlertStatus" NOT NULL DEFAULT 'ACTIVE',
    "triggeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Alert_userId_status_idx" ON "Alert"("userId", "status");

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
