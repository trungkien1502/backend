/*
  Warnings:

  - You are about to alter the column `status` on the `Booking` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(2))`.

*/
-- AlterTable
ALTER TABLE `Booking` MODIFY `status` ENUM('PENDING', 'CONFIRMED', 'CANCELLED') NOT NULL;

-- AlterTable
ALTER TABLE `ShowtimeSeat` ADD COLUMN `heldBy` INTEGER NULL;
