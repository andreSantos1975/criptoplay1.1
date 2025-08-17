-- CreateTable
CREATE TABLE `Trade` (
    `id` VARCHAR(191) NOT NULL,
    `symbol` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'OPEN',
    `entryDate` DATETIME(3) NOT NULL,
    `exitDate` DATETIME(3) NULL,
    `entryPrice` DECIMAL(18, 8) NOT NULL,
    `exitPrice` DECIMAL(18, 8) NULL,
    `quantity` DECIMAL(18, 8) NOT NULL,
    `stopLoss` DECIMAL(18, 8) NOT NULL,
    `takeProfit` DECIMAL(18, 8) NOT NULL,
    `pnl` DECIMAL(18, 2) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Trade` ADD CONSTRAINT `Trade_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
