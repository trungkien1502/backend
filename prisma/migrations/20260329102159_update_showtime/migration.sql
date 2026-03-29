/*
  Warnings:

  - You are about to alter the column `status` on the `ShowtimeSeat` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(1))`.

*/
-- AlterTable
ALTER TABLE `ShowtimeSeat` ADD COLUMN `holdUntil` DATETIME(3) NULL,
    MODIFY `status` ENUM('AVAILABLE', 'HOLD', 'BOOKED') NOT NULL;
