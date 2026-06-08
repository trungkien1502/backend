-- AlterTable
ALTER TABLE `Movie` ADD COLUMN `reviewCount` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `MovieReview` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `movieId` INTEGER NOT NULL,
    `bookingId` INTEGER NOT NULL,
    `rating` INTEGER NOT NULL,
    `content` TEXT NOT NULL,
    `spoiler` BOOLEAN NOT NULL DEFAULT false,
    `status` ENUM('PUBLISHED', 'HIDDEN') NOT NULL DEFAULT 'PUBLISHED',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `MovieReview_movieId_idx`(`movieId`),
    INDEX `MovieReview_userId_idx`(`userId`),
    INDEX `MovieReview_status_idx`(`status`),
    UNIQUE INDEX `MovieReview_bookingId_key`(`bookingId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `MovieReview` ADD CONSTRAINT `MovieReview_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MovieReview` ADD CONSTRAINT `MovieReview_movieId_fkey` FOREIGN KEY (`movieId`) REFERENCES `Movie`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MovieReview` ADD CONSTRAINT `MovieReview_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `Booking`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
