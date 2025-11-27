/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Budget` table. All the data in the column will be lost.
  - You are about to drop the column `income` on the `Budget` table. All the data in the column will be lost.
  - You are about to drop the column `month` on the `Budget` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Budget` table. All the data in the column will be lost.
  - You are about to drop the column `budgetId` on the `BudgetCategory` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `BudgetCategory` table. All the data in the column will be lost.
  - You are about to drop the column `percentage` on the `BudgetCategory` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `BudgetCategory` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,year]` on the table `Budget` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `type` to the `BudgetCategory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `BudgetCategory` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "BudgetCategory" DROP CONSTRAINT "BudgetCategory_budgetId_fkey";

-- DropIndex
DROP INDEX "Budget_userId_year_month_key";

-- AlterTable
ALTER TABLE "Budget" DROP COLUMN "createdAt",
DROP COLUMN "income",
DROP COLUMN "month",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "BudgetCategory" DROP COLUMN "budgetId",
DROP COLUMN "createdAt",
DROP COLUMN "percentage",
DROP COLUMN "updatedAt",
ADD COLUMN     "type" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "BudgetItem" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "BudgetItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BudgetItem_budgetId_categoryId_month_key" ON "BudgetItem"("budgetId", "categoryId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "UserProgress_userId_slug_key" ON "UserProgress"("userId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Budget_userId_year_key" ON "Budget"("userId", "year");

-- AddForeignKey
ALTER TABLE "BudgetCategory" ADD CONSTRAINT "BudgetCategory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetItem" ADD CONSTRAINT "BudgetItem_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetItem" ADD CONSTRAINT "BudgetItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "BudgetCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProgress" ADD CONSTRAINT "UserProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
