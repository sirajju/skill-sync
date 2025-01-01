/*
  Warnings:

  - You are about to drop the column `completedAssesments` on the `employee` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `employee` DROP COLUMN `completedAssesments`,
    ADD COLUMN `assesments` JSON NULL;
