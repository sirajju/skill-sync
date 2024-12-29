/*
  Warnings:

  - A unique constraint covering the columns `[cloudId]` on the table `Token` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `Token_cloudId_key` ON `Token`(`cloudId`);
