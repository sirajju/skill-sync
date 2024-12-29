-- AlterTable
ALTER TABLE `token` MODIFY `access_token` VARCHAR(500) NOT NULL,
    MODIFY `refreshToken` VARCHAR(500) NULL;
