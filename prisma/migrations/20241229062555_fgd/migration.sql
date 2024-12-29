-- AlterTable
ALTER TABLE `token` MODIFY `access_token` VARCHAR(1500) NOT NULL,
    MODIFY `refreshToken` VARCHAR(1500) NULL;
