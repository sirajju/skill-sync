/*
  Warnings:

  - A unique constraint covering the columns `[cloudId]` on the table `Manager` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `Manager_cloudId_key` ON `Manager`(`cloudId`);
