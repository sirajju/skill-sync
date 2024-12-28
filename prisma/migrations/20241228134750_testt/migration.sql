-- DropForeignKey
ALTER TABLE `assesments` DROP FOREIGN KEY `Assesments_roleId_fkey`;

-- DropForeignKey
ALTER TABLE `department` DROP FOREIGN KEY `Department_orgId_fkey`;

-- DropForeignKey
ALTER TABLE `employee` DROP FOREIGN KEY `Employee_departmentId_fkey`;

-- DropForeignKey
ALTER TABLE `employee` DROP FOREIGN KEY `Employee_orgId_fkey`;

-- DropForeignKey
ALTER TABLE `employee` DROP FOREIGN KEY `Employee_roleId_fkey`;

-- DropForeignKey
ALTER TABLE `manager` DROP FOREIGN KEY `Manager_departmentId_fkey`;

-- DropForeignKey
ALTER TABLE `performancemetrics` DROP FOREIGN KEY `PerformanceMetrics_employeeId_fkey`;

-- DropIndex
DROP INDEX `Assesments_roleId_fkey` ON `assesments`;

-- DropIndex
DROP INDEX `Department_orgId_fkey` ON `department`;

-- DropIndex
DROP INDEX `Employee_departmentId_fkey` ON `employee`;

-- DropIndex
DROP INDEX `Employee_orgId_fkey` ON `employee`;

-- DropIndex
DROP INDEX `Employee_roleId_fkey` ON `employee`;

-- DropIndex
DROP INDEX `Manager_departmentId_fkey` ON `manager`;

-- DropIndex
DROP INDEX `PerformanceMetrics_employeeId_fkey` ON `performancemetrics`;

-- AlterTable
ALTER TABLE `assesments` MODIFY `expireAt` DATETIME(3) NULL;

-- AddForeignKey
ALTER TABLE `Manager` ADD CONSTRAINT `Manager_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `Department`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Employee` ADD CONSTRAINT `Employee_orgId_fkey` FOREIGN KEY (`orgId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Employee` ADD CONSTRAINT `Employee_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Employee` ADD CONSTRAINT `Employee_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `Department`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Department` ADD CONSTRAINT `Department_orgId_fkey` FOREIGN KEY (`orgId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Assesments` ADD CONSTRAINT `Assesments_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PerformanceMetrics` ADD CONSTRAINT `PerformanceMetrics_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
