/*
  Warnings:

  - You are about to drop the column `aiReponse` on the `assesments` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `assesments` DROP COLUMN `aiReponse`,
    ADD COLUMN `aiResponse` VARCHAR(5000) NULL;
