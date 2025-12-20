/*
  Warnings:

  - The values [SIMULATOR] on the enum `TradeMarketType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
-- Update existing 'SIMULATOR' marketType values to 'SPOT' before altering the enum
UPDATE "public"."Trade" SET "marketType" = 'SPOT' WHERE "marketType" = 'SIMULATOR';

CREATE TYPE "TradeMarketType_new" AS ENUM ('SPOT', 'FUTURES');
ALTER TABLE "public"."Trade" ALTER COLUMN "marketType" DROP DEFAULT;
ALTER TABLE "Trade" ALTER COLUMN "marketType" TYPE "TradeMarketType_new" USING ("marketType"::text::"TradeMarketType_new");
ALTER TYPE "TradeMarketType" RENAME TO "TradeMarketType_old";
ALTER TYPE "TradeMarketType_new" RENAME TO "TradeMarketType";
DROP TYPE "public"."TradeMarketType_old";
ALTER TABLE "Trade" ALTER COLUMN "marketType" SET DEFAULT 'SPOT';
COMMIT;
