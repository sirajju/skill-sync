/*
  Warnings:

  - A unique constraint covering the columns `[empId]` on the table `Conversation` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `Conversation_empId_key` ON `Conversation`(`empId`);
