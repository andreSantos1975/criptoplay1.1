-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bankruptcyExpiryDate" TIMESTAMP(3),
ADD COLUMN     "monthlyStartingBalance" DECIMAL(12,2) NOT NULL DEFAULT 10000;

-- CreateTable
CREATE TABLE "MonthlyRanking" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "startingBalance" DECIMAL(12,2) NOT NULL,
    "finalBalance" DECIMAL(12,2) NOT NULL,
    "roiPercentage" DOUBLE PRECISION NOT NULL,
    "rankPosition" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MonthlyRanking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MonthlyRanking_month_year_rankPosition_idx" ON "MonthlyRanking"("month", "year", "rankPosition");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyRanking_userId_month_year_key" ON "MonthlyRanking"("userId", "month", "year");

-- AddForeignKey
ALTER TABLE "MonthlyRanking" ADD CONSTRAINT "MonthlyRanking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
