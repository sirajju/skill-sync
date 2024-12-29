/*
  Warnings:

  - Added the required column `auth` to the `Employee` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `employee` ADD COLUMN `auth` JSON NOT NULL,
    ADD COLUMN `cloudId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `organization` ADD COLUMN `cloudId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `tasks` ADD COLUMN `cloudId` VARCHAR(191) NULL,
    ADD COLUMN `webhookData` JSON NULL,
    MODIFY `complexity` DOUBLE NULL,
    MODIFY `priority` ENUM('LOWEST', 'LOW', 'MEDIUM', 'HIGH', 'HIGHEST') NULL,
    MODIFY `deadline` DATETIME(3) NULL,
    MODIFY `estimatedTime` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `Token` (
    `id` VARCHAR(191) NOT NULL,
    `access_token` VARCHAR(191) NOT NULL,
    `cloudId` VARCHAR(191) NULL,
    `refreshToken` VARCHAR(191) NULL,
    `scope` VARCHAR(191) NULL,
    `expires_in` INTEGER NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `type` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Token_id_key`(`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
