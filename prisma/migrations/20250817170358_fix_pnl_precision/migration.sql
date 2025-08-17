/*
  Warnings:

  - You are about to alter the column `pnl` on the `Trade` table. The data in that column could be lost. The data in that column will be cast from `Decimal(18,2)` to `Decimal(18,8)`.

*/
-- AlterTable
ALTER TABLE `Trade` MODIFY `pnl` DECIMAL(18, 8) NULL;
