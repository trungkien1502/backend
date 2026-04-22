-- DropIndex
DROP INDEX `Movie_tmdbId_key` ON `Movie`;

-- AlterTable
ALTER TABLE `Movie` MODIFY `tmdbId` INTEGER NULL;
