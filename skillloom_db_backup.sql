-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: localhost    Database: skillloom_db
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `_prisma_migrations`
--

DROP TABLE IF EXISTS `_prisma_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `checksum` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `logs` text COLLATE utf8mb4_unicode_ci,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `applied_steps_count` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_prisma_migrations`
--

LOCK TABLES `_prisma_migrations` WRITE;
/*!40000 ALTER TABLE `_prisma_migrations` DISABLE KEYS */;
INSERT INTO `_prisma_migrations` VALUES ('5e32f4bd-d7b2-4cd9-9d8f-7a986b37f744','43c823bc5a35d257337a59387a3779bfc42bf42201bc5b1c3cd8e2fba1bcf398','2026-08-18 05:42:42.535','20260818054228_initial_authentication',NULL,NULL,'2026-08-18 05:42:28.245',1),('60300e52-aff0-4791-8a36-8c123ece9917','c4c1b32e9ea44f833bf0f7725b598daef1f3385d9d7d22cc5420090697b8092e','2026-08-18 22:48:24.910','20260818221854_add_job_applications','',NULL,'2026-08-18 22:48:24.910',0),('8f071c74-5eca-4a99-8470-937f7463e825','3960ff9bc1133b6e8200e5b51cabc56d0cc93c03f9003ae25e26d6b7ef3642b7','2026-08-18 21:23:40.278','20260818212305_add_job_system',NULL,NULL,'2026-08-18 21:23:05.741',1),('e97a15d4-3f62-4003-b233-6bca11dc5547','e7a2dae8d7d0c1990bcd1ab060006bf71f31504cfeaa227ef8bb14d81dcff65f',NULL,'20260818221854_add_job_applications','A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20260818221854_add_job_applications\n\nDatabase error code: 1826\n\nDatabase error:\nDuplicate foreign key constraint name \'jobs_posted_by_id_fkey\'\n\nPlease check the query number 6 from the migration file.\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name=\"20260818221854_add_job_applications\"\n             at schema-engine\\connectors\\sql-schema-connector\\src\\apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name=\"20260818221854_add_job_applications\"\n             at schema-engine\\commands\\src\\commands\\apply_migrations.rs:95\n   2: schema_core::state::ApplyMigrations\n             at schema-engine\\core\\src\\state.rs:255','2026-08-18 22:21:28.463','2026-08-18 22:18:54.276',0);
/*!40000 ALTER TABLE `_prisma_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `artisan_profiles`
--

DROP TABLE IF EXISTS `artisan_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `artisan_profiles` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `trade` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bio` text COLLATE utf8mb4_unicode_ci,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `location` varchar(160) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `years_experience` int DEFAULT NULL,
  `hourly_rate` decimal(10,2) DEFAULT NULL,
  `contract_rate` decimal(12,2) DEFAULT NULL,
  `currency` char(3) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'NGN',
  `is_available` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `artisan_profiles_user_id_key` (`user_id`),
  KEY `artisan_profiles_trade_idx` (`trade`),
  KEY `artisan_profiles_is_available_idx` (`is_available`),
  CONSTRAINT `artisan_profiles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `artisan_profiles`
--

LOCK TABLES `artisan_profiles` WRITE;
/*!40000 ALTER TABLE `artisan_profiles` DISABLE KEYS */;
INSERT INTO `artisan_profiles` VALUES ('47d306ca-4e04-4673-bea1-c1ca93c94b9f','9930ff78-8916-4b60-99ca-d295f5de0d15','Web Development','Web development artisan specializing in modern JavaScript and TypeScript applications.','08012345678','Makurdi, Benue State',3,5000.00,50000.00,'NGN',1,'2026-08-19 05:40:48.183','2026-08-19 11:27:29.257'),('e27a54ac-3070-4644-8b18-7edb4fee42dc','476e82dc-9d55-4d00-9e36-5e71496852e7','Web Developer',NULL,NULL,NULL,NULL,NULL,NULL,'NGN',1,'2026-08-20 03:30:46.891','2026-08-20 03:30:46.891');
/*!40000 ALTER TABLE `artisan_profiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `email_verification_tokens`
--

DROP TABLE IF EXISTS `email_verification_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `email_verification_tokens` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime(3) NOT NULL,
  `used_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email_verification_tokens_token_hash_key` (`token_hash`),
  KEY `email_verification_tokens_user_id_idx` (`user_id`),
  KEY `email_verification_tokens_expires_at_idx` (`expires_at`),
  CONSTRAINT `email_verification_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `email_verification_tokens`
--

LOCK TABLES `email_verification_tokens` WRITE;
/*!40000 ALTER TABLE `email_verification_tokens` DISABLE KEYS */;
INSERT INTO `email_verification_tokens` VALUES ('00cd5126-28eb-4cda-96bc-ad1f074ddd63','dde57b6c-229c-4e52-b63c-fc6e5ece23bb','83c0ef774279c7430f58e04d57fb9f946338d764edcae072dcd90b62bf9ed700','2026-08-21 03:34:55.221','2026-08-20 03:35:07.642','2026-08-20 03:34:55.225'),('0a5100fd-054b-4ad4-8cc6-b19178c4fe49','476e82dc-9d55-4d00-9e36-5e71496852e7','da9bb82df034b41cc1658e9ceac633d38657d5d77b21abd10c786b64ac991b1f','2026-08-21 03:33:04.276','2026-08-20 03:33:10.105','2026-08-20 03:33:04.278'),('29a7ed80-481f-4ef5-88a1-6357b1f27b9a','476e82dc-9d55-4d00-9e36-5e71496852e7','c33d8d9224e00951c6d5c1cb7b3ece569789121bbc817cb06eef461bc7f1285b','2026-08-21 03:33:10.361',NULL,'2026-08-20 03:33:10.362'),('50155288-3b4c-4469-a07e-837b8439b6a6','476e82dc-9d55-4d00-9e36-5e71496852e7','9d1e20b229b9e1a90c825205364be66531f521bf40e3620d179c1174f71d19f6','2026-08-21 03:30:47.482','2026-08-20 03:33:03.444','2026-08-20 03:30:47.489'),('59cd2833-f2bb-4a51-904c-b7062c627a21','dde57b6c-229c-4e52-b63c-fc6e5ece23bb','df235f4f819f140d5367eebdf7713e3a3a5c1a2491eeebe500029b8e9cebcf47','2026-08-21 03:35:07.774','2026-08-20 04:50:15.064','2026-08-20 03:35:07.775');
/*!40000 ALTER TABLE `email_verification_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employer_profiles`
--

DROP TABLE IF EXISTS `employer_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employer_profiles` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `company_name` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `logo_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `industry` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `website` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `location` varchar(160) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `approval_status` enum('PENDING','APPROVED','REJECTED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `approved_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `employer_profiles_user_id_key` (`user_id`),
  KEY `employer_profiles_approval_status_idx` (`approval_status`),
  CONSTRAINT `employer_profiles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employer_profiles`
--

LOCK TABLES `employer_profiles` WRITE;
/*!40000 ALTER TABLE `employer_profiles` DISABLE KEYS */;
INSERT INTO `employer_profiles` VALUES ('3952555d-40be-4aa8-bedb-4d9064ea839e','4ee6359d-b76a-4805-830e-50c413ad5b37','SkillLoom Technologies',NULL,NULL,NULL,NULL,NULL,NULL,'PENDING',NULL,'2026-08-19 04:28:29.272','2026-08-19 04:28:29.272'),('d449d173-d160-4e2b-a64a-c82b132d897e','322e8cb5-f4dc-4ff3-9933-b5e24f7d8c9a','SkillLoom Technologies',NULL,'A technology company connecting skilled graduates and artisans with employment opportunities.','Technology','https://skillloom.com','08098765432','Makurdi, Benue State','APPROVED',NULL,'2026-08-18 21:39:37.998','2026-08-19 05:22:30.725');
/*!40000 ALTER TABLE `employer_profiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `graduate_profiles`
--

DROP TABLE IF EXISTS `graduate_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `graduate_profiles` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `headline` varchar(160) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bio` text COLLATE utf8mb4_unicode_ci,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `location` varchar(160) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `education` text COLLATE utf8mb4_unicode_ci,
  `cv_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_available` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `graduate_profiles_user_id_key` (`user_id`),
  KEY `graduate_profiles_is_available_idx` (`is_available`),
  CONSTRAINT `graduate_profiles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `graduate_profiles`
--

LOCK TABLES `graduate_profiles` WRITE;
/*!40000 ALTER TABLE `graduate_profiles` DISABLE KEYS */;
INSERT INTO `graduate_profiles` VALUES ('77f70542-ff7f-4246-98c4-297df8c98f8a','b2cc81a8-6c62-468c-ac0a-483dcaa12fc7',NULL,NULL,NULL,NULL,NULL,NULL,1,'2026-08-18 20:59:05.702','2026-08-18 20:59:05.702'),('ad230c60-d43f-4da2-8bb4-f1db66afe683','870a29dd-77ad-442b-affb-1f2111adfd1b',NULL,NULL,NULL,NULL,NULL,NULL,1,'2026-08-18 07:55:11.824','2026-08-18 07:55:11.824'),('cb9ab7e8-8141-498d-9d1a-5bf164e274a2','7efd41df-520b-4261-88be-1a3a6dc46bbe','Junior Software Developer','Junior software developer with experience in JavaScript, TypeScript, Node.js and database development.','08012345678','Makurdi, Benue State','Computer Science',NULL,1,'2026-08-19 00:25:29.221','2026-08-19 05:20:48.643'),('e0ac6e47-35f2-4b79-8a3e-d6247b809df5','dde57b6c-229c-4e52-b63c-fc6e5ece23bb',NULL,NULL,NULL,NULL,NULL,NULL,1,'2026-08-20 03:34:55.044','2026-08-20 03:34:55.044');
/*!40000 ALTER TABLE `graduate_profiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `job_applications`
--

DROP TABLE IF EXISTS `job_applications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `job_applications` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `job_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `graduate_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `applicant_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cover_letter` text COLLATE utf8mb4_unicode_ci,
  `cv_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('PENDING','REVIEWING','SHORTLISTED','REJECTED','HIRED','WITHDRAWN') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `applied_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `artisan_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `job_applications_job_id_applicant_id_key` (`job_id`,`applicant_id`),
  KEY `job_applications_job_id_idx` (`job_id`),
  KEY `job_applications_graduate_id_idx` (`graduate_id`),
  KEY `job_applications_applicant_id_idx` (`applicant_id`),
  KEY `job_applications_status_idx` (`status`),
  KEY `job_applications_applied_at_idx` (`applied_at`),
  KEY `job_applications_artisan_id_idx` (`artisan_id`),
  CONSTRAINT `job_applications_applicant_id_fkey` FOREIGN KEY (`applicant_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `job_applications_artisan_id_fkey` FOREIGN KEY (`artisan_id`) REFERENCES `artisan_profiles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `job_applications_graduate_id_fkey` FOREIGN KEY (`graduate_id`) REFERENCES `graduate_profiles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `job_applications_job_id_fkey` FOREIGN KEY (`job_id`) REFERENCES `jobs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_applications`
--

LOCK TABLES `job_applications` WRITE;
/*!40000 ALTER TABLE `job_applications` DISABLE KEYS */;
INSERT INTO `job_applications` VALUES ('5841e37f-e878-4bf3-b437-192c5212ca04','2bc415ea-5553-49ee-b5c6-6c471cf61552','e0ac6e47-35f2-4b79-8a3e-d6247b809df5','dde57b6c-229c-4e52-b63c-fc6e5ece23bb','I am excited to apply for the Junior Software Developer position. I have experience with JavaScript, TypeScript, Node.js and database development.',NULL,'PENDING','2026-08-20 10:34:07.024','2026-08-20 10:34:07.024',NULL),('7e2e5f0b-768b-462c-a24a-e560bd354031','2bc415ea-5553-49ee-b5c6-6c471cf61552','cb9ab7e8-8141-498d-9d1a-5bf164e274a2','7efd41df-520b-4261-88be-1a3a6dc46bbe','I am interested in the Junior Software Developer position. I have experience with JavaScript, TypeScript, Node.js and database development, and I would be excited to contribute to the SkillLoom Technologies team.',NULL,'HIRED','2026-08-19 00:33:15.991','2026-08-19 04:51:18.297',NULL),('f896fed4-0c0d-4d10-bd42-672bf192a1f9','2bc415ea-5553-49ee-b5c6-6c471cf61552',NULL,'9930ff78-8916-4b60-99ca-d295f5de0d15','I am excited to apply for the Junior Software Developer position. As a web development artisan with experience in JavaScript, TypeScript, Node.js and database development, I am confident I can contribute effectively to the SkillLoom Technologies team.',NULL,'WITHDRAWN','2026-08-19 10:44:18.467','2026-08-19 11:11:59.936','47d306ca-4e04-4673-bea1-c1ca93c94b9f');
/*!40000 ALTER TABLE `job_applications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jobs`
--

DROP TABLE IF EXISTS `jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jobs` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `employer_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `posted_by_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `requirements` text COLLATE utf8mb4_unicode_ci,
  `location` varchar(160) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `salary_min` decimal(12,2) DEFAULT NULL,
  `salary_max` decimal(12,2) DEFAULT NULL,
  `currency` char(3) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'NGN',
  `job_type` enum('FULL_TIME','PART_TIME','CONTRACT','INTERNSHIP','FREELANCE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'FULL_TIME',
  `status` enum('DRAFT','OPEN','CLOSED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'OPEN',
  `application_deadline` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_employer_id_idx` (`employer_id`),
  KEY `jobs_posted_by_id_idx` (`posted_by_id`),
  KEY `jobs_status_idx` (`status`),
  KEY `jobs_job_type_idx` (`job_type`),
  KEY `jobs_location_idx` (`location`),
  KEY `jobs_created_at_idx` (`created_at`),
  CONSTRAINT `jobs_employer_id_fkey` FOREIGN KEY (`employer_id`) REFERENCES `employer_profiles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `jobs_posted_by_id_fkey` FOREIGN KEY (`posted_by_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jobs`
--

LOCK TABLES `jobs` WRITE;
/*!40000 ALTER TABLE `jobs` DISABLE KEYS */;
INSERT INTO `jobs` VALUES ('2bc415ea-5553-49ee-b5c6-6c471cf61552','d449d173-d160-4e2b-a64a-c82b132d897e','322e8cb5-f4dc-4ff3-9933-b5e24f7d8c9a','Junior Software Developer','We are looking for a motivated junior software developer to join our growing technology team.','JavaScript, TypeScript, Node.js, Git and basic database knowledge.','Makurdi, Benue State',150000.00,250000.00,'NGN','FULL_TIME','OPEN','2026-09-30 23:59:59.000','2026-08-18 21:52:03.943','2026-08-18 21:52:03.943');
/*!40000 ALTER TABLE `jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_tokens` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime(3) NOT NULL,
  `used_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `password_reset_tokens_token_hash_key` (`token_hash`),
  KEY `password_reset_tokens_user_id_idx` (`user_id`),
  KEY `password_reset_tokens_expires_at_idx` (`expires_at`),
  CONSTRAINT `password_reset_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_tokens`
--

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('EMPLOYER','GRADUATE','ARTISAN','ADMIN') COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_email_verified` tinyint(1) NOT NULL DEFAULT '0',
  `email_verified_at` datetime(3) DEFAULT NULL,
  `status` enum('PENDING_VERIFICATION','ACTIVE','SUSPENDED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING_VERIFICATION',
  `avatar_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_login_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_key` (`email`),
  KEY `users_role_idx` (`role`),
  KEY `users_status_idx` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('29bff139-ea7a-4a32-979f-dc4f0852e065','SkillLoom Administrator','admin.test@skillloom.com','$2b$12$NcH41LRDjhmUY6kRmR9Js.vO.aB.E1sKMn4q3rxuodJzjjbdoZBEC','ADMIN',1,NULL,'ACTIVE',NULL,'2026-08-20 20:02:07.454','2026-08-20 19:59:59.259','2026-08-20 20:02:07.521'),('322e8cb5-f4dc-4ff3-9933-b5e24f7d8c9a','Test Employer','employer@example.com','$2b$12$6faZv5b1vxtToHzLncFxP.futrF1TIPWPrndD2E57yMVIuyHe0MDS','EMPLOYER',1,'2026-08-20 12:10:27.000','ACTIVE',NULL,'2026-08-20 21:28:51.507','2026-08-18 21:39:37.987','2026-08-20 21:28:51.510'),('476e82dc-9d55-4d00-9e36-5e71496852e7','Gbande Desmond Kator','gbandedesmondkator@gmail.com','$2b$12$t6fvLk39J48yEtCP6kMBveNAKPfsfb2xpGCwdnLS/IpnEm7CViztm','ARTISAN',0,NULL,'PENDING_VERIFICATION',NULL,NULL,'2026-08-20 03:30:46.814','2026-08-20 03:30:46.814'),('4ee6359d-b76a-4805-830e-50c413ad5b37','SkillLoom Test Employer','employer.test@skillloom.com','$2b$12$J.x07T3CEfNKSCsxQsbEZuV/jrothRGW6Zb7PBF8Ye83Zjx.Z964S','EMPLOYER',0,NULL,'PENDING_VERIFICATION',NULL,NULL,'2026-08-19 04:28:28.743','2026-08-19 04:28:28.743'),('7efd41df-520b-4261-88be-1a3a6dc46bbe','Test Graduate Updated','graduate.test@skillloom.com','$2b$12$GNGX5Y9AYPuP8JOMZQpEDuG8K/jlplZbZqC8s9WL5sJJonn0dIdg6','GRADUATE',0,NULL,'PENDING_VERIFICATION',NULL,NULL,'2026-08-19 00:25:29.214','2026-08-19 05:20:48.368'),('870a29dd-77ad-442b-affb-1f2111adfd1b','Test Graduate','graduate@skillloom.test','$2b$12$O67mQPnZ2U9xqGsa160puOLd4mmWx8fWSp88XWyGZVsWhDq90PrNe','GRADUATE',0,NULL,'PENDING_VERIFICATION',NULL,'2026-08-18 08:17:05.167','2026-08-18 07:55:11.766','2026-08-18 08:17:05.184'),('9930ff78-8916-4b60-99ca-d295f5de0d15','Test Artisan Updated','artisan.test@skillloom.com','$2b$12$UxqlzI.TCgSLKTrs3vfJMuJalHtPTuZ8xN3gyjwRIMVmD7N7Kda0K','ARTISAN',1,'2026-08-20 11:50:27.000','ACTIVE',NULL,'2026-08-20 22:08:46.584','2026-08-19 05:40:48.176','2026-08-20 22:08:46.621'),('b2cc81a8-6c62-468c-ac0a-483dcaa12fc7','Test User','test@example.com','$2b$12$3KFAuoLKVxN5hNlv7NTY0OwY/RgyU8/jRPEzB3D4N5BYlkVZQOvDC','GRADUATE',0,NULL,'PENDING_VERIFICATION',NULL,'2026-08-18 21:04:31.849','2026-08-18 20:59:05.213','2026-08-18 21:04:31.852'),('dde57b6c-229c-4e52-b63c-fc6e5ece23bb','John Doe','gbandedesmond@gmail.com','$2b$12$u6XxZ72T9fEs.U6y4K36zuLjz4ZUrkKJcFQc2lok0ZKUZMg3mhV2W','GRADUATE',1,'2026-08-20 04:50:14.833','ACTIVE',NULL,'2026-08-20 22:08:22.354','2026-08-20 03:34:54.943','2026-08-20 22:08:22.358');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'skillloom_db'
--

--
-- Dumping routines for database 'skillloom_db'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-21  6:03:15
