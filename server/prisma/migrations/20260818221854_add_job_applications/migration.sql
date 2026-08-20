/*
  Warnings:

  - A unique constraint covering the columns `[job_id,applicant_id]` on the table `job_applications` will be added.
*/

-- DropForeignKey
ALTER TABLE `job_applications`
DROP FOREIGN KEY `job_applications_job_id_fkey`;

-- DropIndex
DROP INDEX `job_applications_job_id_graduate_id_key`
ON `job_applications`;

-- AlterTable
ALTER TABLE `job_applications`
ADD COLUMN `artisan_id` CHAR(36) NULL,
MODIFY `graduate_id` CHAR(36) NULL,
MODIFY `status`
ENUM(
    'PENDING',
    'REVIEWING',
    'SHORTLISTED',
    'REJECTED',
    'HIRED',
    'WITHDRAWN'
)
NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX `job_applications_artisan_id_idx`
ON `job_applications`(`artisan_id`);

-- CreateIndex
CREATE UNIQUE INDEX `job_applications_job_id_applicant_id_key`
ON `job_applications`(`job_id`, `applicant_id`);

-- AddForeignKey
ALTER TABLE `job_applications`
ADD CONSTRAINT `job_applications_artisan_id_fkey`
FOREIGN KEY (`artisan_id`)
REFERENCES `artisan_profiles`(`id`)
ON DELETE CASCADE
ON UPDATE CASCADE;