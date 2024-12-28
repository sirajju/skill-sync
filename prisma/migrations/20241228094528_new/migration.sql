/*
  Warnings:

  - Added the required column `email` to the `Employee` table without a default value. This is not possible if the table is not empty.
  - Added the required column `roleId` to the `Employee` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `employee` ADD COLUMN `availedBadges` JSON NULL,
    ADD COLUMN `badgeId` VARCHAR(191) NULL,
    ADD COLUMN `currentBadgeId` VARCHAR(191) NULL,
    ADD COLUMN `email` VARCHAR(191) NOT NULL,
    ADD COLUMN `employeeId` VARCHAR(191) NULL,
    ADD COLUMN `points` INTEGER NULL DEFAULT 0,
    ADD COLUMN `roleId` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `Badge` (
    `id` VARCHAR(191) NOT NULL,
    `minPoints` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `minRank` INTEGER NULL,
    `maxPoints` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Badge_id_key`(`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Employee` ADD CONSTRAINT `Employee_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
