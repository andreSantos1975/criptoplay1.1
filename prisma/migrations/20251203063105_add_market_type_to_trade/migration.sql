-- CreateEnum
CREATE TYPE "TradeMarketType" AS ENUM ('SPOT', 'FUTURES');

-- AlterTable
ALTER TABLE "Trade" ADD COLUMN     "marketType" "TradeMarketType" NOT NULL DEFAULT 'SPOT';
