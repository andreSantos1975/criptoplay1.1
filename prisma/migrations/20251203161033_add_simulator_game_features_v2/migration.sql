-- AlterTable
ALTER TABLE "User" ADD COLUMN     "virtualBalance" DECIMAL(12,2) NOT NULL DEFAULT 10000;

-- CreateTable
CREATE TABLE "DailyPerformance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "startingBalance" DECIMAL(12,2) NOT NULL,
    "endingBalance" DECIMAL(12,2) NOT NULL,
    "dailyPercentageGain" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "DailyPerformance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyPerformance_userId_date_key" ON "DailyPerformance"("userId", "date");

-- AddForeignKey
ALTER TABLE "DailyPerformance" ADD CONSTRAINT "DailyPerformance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
