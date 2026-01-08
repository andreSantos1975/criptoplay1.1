-- AlterTable
ALTER TABLE "FuturesPosition" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "sentiment" TEXT,
ADD COLUMN     "strategy" TEXT;

-- AlterTable
ALTER TABLE "Trade" ADD COLUMN     "sentiment" TEXT,
ADD COLUMN     "strategy" TEXT;
