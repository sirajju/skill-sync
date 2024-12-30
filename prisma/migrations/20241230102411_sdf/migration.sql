/*
  Warnings:

  - A unique constraint covering the columns `[cloudId]` on the table `Employee` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cloudId]` on the table `Organization` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cloudId]` on the table `Projects` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cloudId]` on the table `Tasks` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `Employee_cloudId_key` ON `Employee`(`cloudId`);

-- CreateIndex
CREATE UNIQUE INDEX `Organization_cloudId_key` ON `Organization`(`cloudId`);

-- CreateIndex
CREATE UNIQUE INDEX `Projects_cloudId_key` ON `Projects`(`cloudId`);

-- CreateIndex
CREATE UNIQUE INDEX `Tasks_cloudId_key` ON `Tasks`(`cloudId`);
