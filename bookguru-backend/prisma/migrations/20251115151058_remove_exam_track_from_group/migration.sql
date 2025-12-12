/*
  Warnings:

  - You are about to drop the column `exam` on the `group` table. All the data in the column will be lost.
  - You are about to drop the column `track` on the `group` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `group` DROP COLUMN `exam`,
    DROP COLUMN `track`;
