-- CreateTable
CREATE TABLE `jobs` (
    `id` CHAR(36) NOT NULL,
    `employer_id` CHAR(36) NOT NULL,
    `posted_by_id` CHAR(36) NOT NULL,
    `title` VARCHAR(180) NOT NULL,
    `description` TEXT NOT NULL,
    `requirements` TEXT NULL,
    `location` VARCHAR(160) NULL,
    `salary_min` DECIMAL(12, 2) NULL,
    `salary_max` DECIMAL(12, 2) NULL,
    `currency` CHAR(3) NOT NULL DEFAULT 'NGN',
    `job_type` ENUM('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE') NOT NULL DEFAULT 'FULL_TIME',
    `status` ENUM('DRAFT', 'OPEN', 'CLOSED') NOT NULL DEFAULT 'OPEN',
    `application_deadline` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `jobs_employer_id_idx`(`employer_id`),
    INDEX `jobs_posted_by_id_idx`(`posted_by_id`),
    INDEX `jobs_status_idx`(`status`),
    INDEX `jobs_job_type_idx`(`job_type`),
    INDEX `jobs_location_idx`(`location`),
    INDEX `jobs_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `job_applications` (
    `id` CHAR(36) NOT NULL,
    `job_id` CHAR(36) NOT NULL,
    `graduate_id` CHAR(36) NOT NULL,
    `applicant_id` CHAR(36) NOT NULL,
    `cover_letter` TEXT NULL,
    `cv_url` VARCHAR(500) NULL,
    `status` ENUM('PENDING', 'REVIEWING', 'SHORTLISTED', 'REJECTED', 'HIRED') NOT NULL DEFAULT 'PENDING',
    `applied_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `job_applications_job_id_idx`(`job_id`),
    INDEX `job_applications_graduate_id_idx`(`graduate_id`),
    INDEX `job_applications_applicant_id_idx`(`applicant_id`),
    INDEX `job_applications_status_idx`(`status`),
    INDEX `job_applications_applied_at_idx`(`applied_at`),
    UNIQUE INDEX `job_applications_job_id_graduate_id_key`(`job_id`, `graduate_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `jobs` ADD CONSTRAINT `jobs_employer_id_fkey` FOREIGN KEY (`employer_id`) REFERENCES `employer_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `jobs` ADD CONSTRAINT `jobs_posted_by_id_fkey` FOREIGN KEY (`posted_by_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `job_applications` ADD CONSTRAINT `job_applications_job_id_fkey` FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `job_applications` ADD CONSTRAINT `job_applications_graduate_id_fkey` FOREIGN KEY (`graduate_id`) REFERENCES `graduate_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `job_applications` ADD CONSTRAINT `job_applications_applicant_id_fkey` FOREIGN KEY (`applicant_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
