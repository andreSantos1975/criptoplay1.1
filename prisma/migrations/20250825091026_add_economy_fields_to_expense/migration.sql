-- AlterTable
ALTER TABLE `Expense` ADD COLUMN `originalValor` DECIMAL(18, 2) NULL,
    ADD COLUMN `savedAmount` DECIMAL(18, 2) NULL,
    ALTER COLUMN `status` DROP DEFAULT;
