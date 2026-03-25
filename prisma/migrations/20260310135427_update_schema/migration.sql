/*
  Warnings:

  - You are about to drop the column `expiresAt` on the `PasswordReset` table. All the data in the column will be lost.
  - Added the required column `expireAt` to the `PasswordReset` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `PasswordReset` DROP COLUMN `expiresAt`,
    ADD COLUMN `expireAt` DATETIME(3) NOT NULL;
