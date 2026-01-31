-- AlterTable
ALTER TABLE "FuturesPosition" ADD COLUMN     "pnlInBrl" DECIMAL(18,8);

-- AlterTable
ALTER TABLE "Trade" ADD COLUMN     "pnlInBrl" DECIMAL(18,8);
