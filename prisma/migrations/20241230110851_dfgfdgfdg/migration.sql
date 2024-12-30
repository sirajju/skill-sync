-- DropForeignKey
ALTER TABLE `tasks` DROP FOREIGN KEY `Tasks_employeeId_fkey`;

-- DropIndex
DROP INDEX `Tasks_employeeId_fkey` ON `tasks`;

-- AlterTable
ALTER TABLE `tasks` MODIFY `employeeId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `Tasks` ADD CONSTRAINT `Tasks_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
