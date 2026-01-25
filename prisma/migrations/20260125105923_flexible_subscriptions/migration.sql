-- DropIndex
DROP INDEX "Subscription_userId_planId_key";

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "origin" TEXT NOT NULL DEFAULT 'CRIPTONET',
ALTER COLUMN "planId" DROP NOT NULL;
