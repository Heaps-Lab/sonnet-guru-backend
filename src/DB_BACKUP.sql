-- MySQL dump 10.13  Distrib 8.0.44, for macos15 (arm64)
--
-- Host: 144.79.249.3    Database: serversonnetguru_LMS
-- ------------------------------------------------------
-- Server version	5.5.5-10.11.18-MariaDB

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
-- Table structure for table `courses`
--

DROP TABLE IF EXISTS `courses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courses` (
  `id` varchar(36) NOT NULL,
  `title` varchar(500) NOT NULL,
  `description` text NOT NULL,
  `fullDescription` text DEFAULT NULL,
  `instructorId` varchar(36) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `discount` decimal(5,2) NOT NULL DEFAULT 0.00 COMMENT 'Discount percentage (0-100)',
  `discountedPrice` decimal(10,2) DEFAULT NULL COMMENT 'Calculated price after discount',
  `isPublished` tinyint(1) NOT NULL DEFAULT 1,
  `thumbnailUrl` varchar(500) DEFAULT NULL,
  `introLink` text DEFAULT NULL COMMENT 'Introduction video URL (MP4 or any video link)',
  `category` varchar(100) DEFAULT NULL,
  `level` varchar(100) DEFAULT NULL,
  `totalDuration` int(11) DEFAULT 0,
  `enrollmentCount` int(11) NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `isActive` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_courses_instructor` (`instructorId`),
  KEY `idx_courses_published` (`isPublished`),
  KEY `idx_courses_active` (`isActive`),
  KEY `idx_courses_discount` (`discount`),
  FULLTEXT KEY `idx_courses_search` (`title`,`description`),
  CONSTRAINT `courses_ibfk_1` FOREIGN KEY (`instructorId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `courses`
--

LOCK TABLES `courses` WRITE;
/*!40000 ALTER TABLE `courses` DISABLE KEYS */;
INSERT INTO `courses` VALUES ('332f64a9-3047-4799-b965-0d0ab88e141d','Bangladesh History','Bangladesh history subtitle','Bangladesh details description','550e8400-e29b-41d4-a716-446655440000',499.00,0.00,499.00,0,'/api/v1/thumbnails/43909773-8bc0-4044-8e8f-c9d62a470cb7.jpeg',NULL,'অ্যাকাডেমিক','Advanced',0,0,'2026-08-21 18:03:34','2026-08-22 16:04:37',0),('40fa7b3e-81a6-4d8f-9d17-18ae64d6af28','Bangladesh History','Bangladesh history subtitle','sfdghdfghjfgh','550e8400-e29b-41d4-a716-446655440000',199.00,0.00,199.00,0,'/api/v1/thumbnails/99b73e4e-e94d-4aa9-a95a-dcae60c9d8dc.jpg',NULL,'অ্যাকাডেমিক','Intermediate',0,0,'2026-08-22 06:04:51','2026-08-24 08:45:38',0),('790f55ec-0cfd-4f5e-8411-7a726e2331ec','Science Course Pro','Science subtitle pro','Science course details pro','550e8400-e29b-41d4-a716-446655440000',1999.00,5.00,1899.05,1,'/api/v1/thumbnails/c5080fbc-9381-476a-80f7-909a11876803.png','https://www.youtube.com/watch?v=tNQwcbHgbdo','আইটি','Intermediate',10,1,'2026-08-25 10:46:03','2026-08-25 14:05:37',1),('9912fe2d-729d-4990-a584-2cdd1dc9e074','Science Course','subtitle course','test test test ','550e8400-e29b-41d4-a716-446655440000',299.00,0.00,299.00,1,'/api/v1/thumbnails/ddbbcb70-af50-48c2-800e-c8d33bcfbf20.png','https://www.youtube.com/watch?v=UpaKaf7lOAw','আইন','Intermediate',2,1,'2026-08-23 10:23:15','2026-08-24 08:35:08',0),('b45e8354-a2b0-4d58-9862-63d3dc5012ae','History Courses','History course subtitles','History course details','550e8400-e29b-41d4-a716-446655440000',599.00,0.00,599.00,1,'/api/v1/thumbnails/a9daa067-ab5b-43ea-a3d8-d9f5b62a2371.png','https://www.youtube.com/watch?v=tW2p6iYy3IA','অ্যাকাডেমিক','Beginner',5,1,'2026-08-24 10:36:52','2026-08-24 19:46:44',1),('b51f312e-16b1-4afd-875c-ab2689f2f0b5','Test History course','Test subtitle now ','test details','550e8400-e29b-41d4-a716-446655440000',499.00,0.00,499.00,1,'/api/v1/thumbnails/df2b6552-5a3b-4d3e-9979-d5e71d28b2cd.jpeg',NULL,'আইন','Intermediate',120,0,'2026-08-22 14:17:15','2026-08-24 08:35:13',0),('bd9520b8-e5d8-409c-8ffa-4a37fa9f7787','Bangladesh History','Test course summary','Test description for','550e8400-e29b-41d4-a716-446655440000',499.00,0.00,499.00,0,NULL,NULL,'অ্যাকাডেমিক','Advanced',0,0,'2026-08-21 18:29:49','2026-08-22 16:04:37',0),('bfb40719-694e-4662-90d3-1ba719989278','Bangladesh History','Bangladesh subtitle ','Bangladesh description','550e8400-e29b-41d4-a716-446655440000',499.00,0.00,499.00,1,'/api/v1/thumbnails/41374975-2ef7-4d47-bc7d-ad166eff1572.jpeg',NULL,'আইন','Advanced',0,1,'2026-08-22 06:35:22','2026-08-24 08:35:22',0),('c4d77deb-9b1e-49b5-bacb-6374b6c8d438','Law Course Foundation','Law courses subtitle','Law course details','550e8400-e29b-41d4-a716-446655440000',2999.00,10.00,2699.10,1,'/api/v1/thumbnails/510b6dfc-82a6-445a-9721-df1fc517e19e.png','https://www.youtube.com/watch?v=CloLjTNYZXs','আইন','Intermediate',10,1,'2026-08-25 17:52:39','2026-08-25 19:16:17',1),('deea5b85-d6c4-4f8c-b1c2-2d0c0b17fc8c','Test History','Test history problem','Test description','550e8400-e29b-41d4-a716-446655440000',499.00,0.00,499.00,0,'/api/v1/thumbnails/185c2c40-dbd0-4547-b2fe-2caf3de9c867.jpeg',NULL,'আইন','Advanced',0,0,'2026-08-22 05:09:09','2026-08-22 16:04:37',0);
/*!40000 ALTER TABLE `courses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `enrollments`
--

DROP TABLE IF EXISTS `enrollments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `enrollments` (
  `id` varchar(36) NOT NULL,
  `userId` varchar(36) NOT NULL,
  `courseId` varchar(36) NOT NULL,
  `paymentClaimId` varchar(36) NOT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `enrolledAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `completedAt` timestamp NULL DEFAULT NULL,
  `progressPercentage` int(11) NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_course` (`userId`,`courseId`),
  KEY `paymentClaimId` (`paymentClaimId`),
  KEY `idx_enrollment_course` (`courseId`),
  CONSTRAINT `enrollments_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `enrollments_ibfk_2` FOREIGN KEY (`courseId`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `enrollments_ibfk_3` FOREIGN KEY (`paymentClaimId`) REFERENCES `payment_claims` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `enrollments`
--

LOCK TABLES `enrollments` WRITE;
/*!40000 ALTER TABLE `enrollments` DISABLE KEYS */;
INSERT INTO `enrollments` VALUES ('2ebd74a2-c2fe-4930-95d9-af76348f7d81','c58c6586-12b1-4f2e-b23c-13baa75bc8a0','9912fe2d-729d-4990-a584-2cdd1dc9e074','09441963-eeb1-4a6d-ba41-311f81222317',1,'2026-08-23 17:46:19',NULL,0,'2026-08-23 13:46:19','2026-08-23 13:46:19'),('652e5870-8526-4176-a9c6-c02f728400ae','b5275933-32a5-444d-9455-83df7630ef6d','b45e8354-a2b0-4d58-9862-63d3dc5012ae','efb1ac4a-fd87-49b3-b657-8b6463eca389',1,'2026-08-24 18:12:44',NULL,0,'2026-08-24 14:12:44','2026-08-24 14:12:44'),('83697c7e-2296-4c24-bc96-d69de946cad4','b5275933-32a5-444d-9455-83df7630ef6d','c4d77deb-9b1e-49b5-bacb-6374b6c8d438','bfd491a4-e88b-4a8d-9f37-6bee685bb6f8',1,'2026-08-25 23:16:17',NULL,0,'2026-08-25 19:16:17','2026-08-25 19:16:17'),('86c2f00b-62af-4d7d-aa05-b38f839583e2','b5275933-32a5-444d-9455-83df7630ef6d','790f55ec-0cfd-4f5e-8411-7a726e2331ec','c37d26a8-aac8-448e-a5ee-cdcc6cd6cf9f',1,'2026-08-25 17:01:43',NULL,0,'2026-08-25 13:01:43','2026-08-25 13:01:43'),('c18a43a0-604c-481c-ba03-fd91fc68f2e5','c58c6586-12b1-4f2e-b23c-13baa75bc8a0','bfb40719-694e-4662-90d3-1ba719989278','ab14e323-0442-4b93-89ac-98f826de45ca',1,'2026-08-23 11:23:00',NULL,0,'2026-08-23 07:23:00','2026-08-23 07:23:00');
/*!40000 ALTER TABLE `enrollments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `migrations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `timestamp` bigint(20) NOT NULL,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migrations`
--

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES (1,1700000000000,'InitialSchema1700000000000'),(2,1700000000001,'AddPhoneNumberToUsers1700000000001'),(3,1700000000002,'CreateLMSEntities1700000000002');
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `module_sheets`
--

DROP TABLE IF EXISTS `module_sheets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `module_sheets` (
  `id` varchar(36) NOT NULL,
  `moduleId` varchar(36) NOT NULL,
  `title` varchar(500) NOT NULL,
  `description` text DEFAULT NULL,
  `fileName` varchar(1000) NOT NULL,
  `fileUrl` varchar(1000) NOT NULL,
  `isDownloadable` tinyint(1) DEFAULT 1,
  `isActive` tinyint(1) DEFAULT 1,
  `fileSize` bigint(20) NOT NULL,
  `mimeType` varchar(50) NOT NULL,
  `createdAt` timestamp NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_sheets_module` (`moduleId`),
  CONSTRAINT `fk_sheets_module` FOREIGN KEY (`moduleId`) REFERENCES `modules` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `module_sheets`
--

LOCK TABLES `module_sheets` WRITE;
/*!40000 ALTER TABLE `module_sheets` DISABLE KEYS */;
INSERT INTO `module_sheets` VALUES ('05f47d73-2177-48da-a1b9-e31f70bbdfef','1a57c729-75d7-4e95-833c-50b44a9f5b74','Second Sheet','Sheet details','7031cb90-ef02-42d8-a892-3e8173bef9bb.pdf','/api/v1/sheets/7031cb90-ef02-42d8-a892-3e8173bef9bb.pdf',1,1,6804745,'application/pdf','2026-08-25 11:12:55','2026-08-25 11:12:55'),('305e783f-e37d-4fe6-9e6c-aae35616e441','00e57d6c-a980-482c-91d9-e53047321511','tamadi law notes','tamadi law notes','e0d2c4d5-8872-4b1f-9e3a-cec46d0cebed.pdf','/api/v1/sheets/e0d2c4d5-8872-4b1f-9e3a-cec46d0cebed.pdf',1,1,425024,'application/pdf','2026-08-25 17:59:17','2026-08-25 17:59:17'),('437a42fe-184e-49d8-a32a-e69b92bad023','5f5ed6e0-91a8-4b5d-a6b7-16a9e7b2b27c','CRPC SHEET','CRPC SHEET','dd6cd351-24c5-4050-aa90-5a6fd4b0868d.pdf','/api/v1/sheets/dd6cd351-24c5-4050-aa90-5a6fd4b0868d.pdf',1,1,425024,'application/pdf','2026-08-25 18:09:46','2026-08-25 18:09:46'),('548ac973-9ef8-4898-89cd-34351bb9fba9','1a57c729-75d7-4e95-833c-50b44a9f5b74','First sheet','sheet details','c3ef2731-d1de-4198-aa1f-1cad8a5287ad.pdf','/api/v1/sheets/c3ef2731-d1de-4198-aa1f-1cad8a5287ad.pdf',1,1,80777,'application/pdf','2026-08-25 11:11:13','2026-08-25 11:11:13'),('73b7905b-21d2-48d4-87ff-6c0402329444','00e57d6c-a980-482c-91d9-e53047321511','tamadi sheet 2','sheet','3571fc33-aceb-4e98-b2b6-cde6725492ff.pdf','/api/v1/sheets/3571fc33-aceb-4e98-b2b6-cde6725492ff.pdf',1,1,287591,'application/pdf','2026-08-25 18:12:04','2026-08-25 18:12:04'),('b261bfd2-4b71-4551-94d6-10d76a12929f','854435f3-311d-4eb5-acd4-86453ed019af','Test note','test ','11f399bd-250a-48ff-9b55-8bfb99868e2d.pdf','/api/v1/sheets/11f399bd-250a-48ff-9b55-8bfb99868e2d.pdf',0,1,425024,'application/pdf','2026-08-23 17:33:45','2026-08-23 17:33:45'),('f0ecae12-879d-4f50-ac46-7a7e8787a093','6723e9dc-38ef-4d46-848b-90d223179de7','appeal sheet','nice sheet','628f9a04-2cbe-4097-bb49-fec52fbd7a2e.pdf','/api/v1/sheets/628f9a04-2cbe-4097-bb49-fec52fbd7a2e.pdf',1,1,301840,'application/pdf','2026-08-25 18:06:26','2026-08-25 18:06:26');
/*!40000 ALTER TABLE `module_sheets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `modules`
--

DROP TABLE IF EXISTS `modules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `modules` (
  `id` varchar(36) NOT NULL,
  `subjectId` varchar(36) DEFAULT NULL,
  `courseId` varchar(36) DEFAULT NULL,
  `title` varchar(500) NOT NULL,
  `description` text NOT NULL,
  `sequenceOrder` int(11) NOT NULL,
  `isPublished` tinyint(1) NOT NULL DEFAULT 1,
  `isCompleted` tinyint(1) DEFAULT 0,
  `totalDuration` int(11) DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_modules_course` (`courseId`),
  KEY `idx_modules_sequence` (`courseId`,`sequenceOrder`),
  KEY `idx_modules_subjectId` (`subjectId`),
  CONSTRAINT `fk_modules_subjectId` FOREIGN KEY (`subjectId`) REFERENCES `subjects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `modules_ibfk_1` FOREIGN KEY (`courseId`) REFERENCES `courses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `modules`
--

LOCK TABLES `modules` WRITE;
/*!40000 ALTER TABLE `modules` DISABLE KEYS */;
INSERT INTO `modules` VALUES ('00e57d6c-a980-482c-91d9-e53047321511','70d2acbd-ca64-4fcf-abe5-fa86c84d0464','c4d77deb-9b1e-49b5-bacb-6374b6c8d438','Introduction to cpc','details of cpc',1,1,1,0,'2026-08-25 17:54:06','2026-08-25 18:00:34'),('1a09970c-251a-48a2-99bf-5b5b8712210d','6b13affb-50c9-4199-8162-64cf30c5d42e','b51f312e-16b1-4afd-875c-ab2689f2f0b5','Test module','details',1,1,1,0,'2026-08-22 14:17:52','2026-08-22 14:23:01'),('1a57c729-75d7-4e95-833c-50b44a9f5b74','e63006a4-d74e-49b5-a38c-603f4d97a2a7','790f55ec-0cfd-4f5e-8411-7a726e2331ec','Module First','Module details',1,1,1,0,'2026-08-25 11:07:58','2026-08-25 11:13:09'),('3154ef69-c366-4de6-afe3-6139b2fd89a3','e63006a4-d74e-49b5-a38c-603f4d97a2a7','790f55ec-0cfd-4f5e-8411-7a726e2331ec','Test Module 2','Test module 2 details',2,1,1,0,'2026-08-25 13:52:32','2026-08-25 13:53:30'),('481981c0-08cd-4f9e-bf1a-0a2c1404bcf6','e0800146-418b-4fbf-b287-00dfee275fb4','bfb40719-694e-4662-90d3-1ba719989278','Test module','test details',1,1,1,0,'2026-08-22 07:22:24','2026-08-22 14:12:25'),('5f5ed6e0-91a8-4b5d-a6b7-16a9e7b2b27c','2437eef1-b69d-4418-836d-d2446d8afccd','c4d77deb-9b1e-49b5-bacb-6374b6c8d438','CRPC MODULE','CRPC MODULE INTRO',1,1,1,0,'2026-08-25 18:08:20','2026-08-25 18:09:52'),('6723e9dc-38ef-4d46-848b-90d223179de7','70d2acbd-ca64-4fcf-abe5-fa86c84d0464','c4d77deb-9b1e-49b5-bacb-6374b6c8d438','Appeal','appeal module comming soon',2,1,1,0,'2026-08-25 18:05:04','2026-08-25 18:06:30'),('6d22b44f-45ae-43c3-8476-96848858e956','e63006a4-d74e-49b5-a38c-603f4d97a2a7','790f55ec-0cfd-4f5e-8411-7a726e2331ec','Test Module 4','Test module details',4,1,1,0,'2026-08-25 14:09:53','2026-08-25 14:11:06'),('854435f3-311d-4eb5-acd4-86453ed019af','95306df8-20bf-4a41-9cb2-4b24437f51df','9912fe2d-729d-4990-a584-2cdd1dc9e074','1st module','1st details',1,1,1,0,'2026-08-23 10:26:23','2026-08-23 13:30:50'),('b1e655c2-82c5-40c9-bbae-eda674c89da1','e63006a4-d74e-49b5-a38c-603f4d97a2a7','790f55ec-0cfd-4f5e-8411-7a726e2331ec','Test Module 5','Test module details',5,1,1,0,'2026-08-25 14:15:40','2026-08-25 14:16:31'),('b72cd1e5-10ed-486b-aaca-b4846920c7dc','e63006a4-d74e-49b5-a38c-603f4d97a2a7','790f55ec-0cfd-4f5e-8411-7a726e2331ec','Test Module 3','Test module details',3,1,1,0,'2026-08-25 13:58:34','2026-08-25 14:00:02');
/*!40000 ALTER TABLE `modules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment_claims`
--

DROP TABLE IF EXISTS `payment_claims`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_claims` (
  `id` varchar(36) NOT NULL,
  `userId` varchar(36) NOT NULL,
  `courseId` varchar(36) NOT NULL,
  `gateway` enum('bKash','Nagad','Rocket') NOT NULL,
  `senderNumber` varchar(50) NOT NULL,
  `transactionId` varchar(100) NOT NULL,
  `amountPaid` decimal(10,2) NOT NULL,
  `status` enum('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  `adminRemarks` text DEFAULT NULL,
  `verifiedBy` varchar(36) DEFAULT NULL,
  `verifiedAt` timestamp NULL DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `transactionId` (`transactionId`),
  KEY `courseId` (`courseId`),
  KEY `verifiedBy` (`verifiedBy`),
  KEY `idx_payment_user_course` (`userId`,`courseId`),
  KEY `idx_payment_transaction` (`transactionId`),
  KEY `idx_payment_status` (`status`),
  CONSTRAINT `payment_claims_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `payment_claims_ibfk_2` FOREIGN KEY (`courseId`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `payment_claims_ibfk_3` FOREIGN KEY (`verifiedBy`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_claims`
--

LOCK TABLES `payment_claims` WRITE;
/*!40000 ALTER TABLE `payment_claims` DISABLE KEYS */;
INSERT INTO `payment_claims` VALUES ('09441963-eeb1-4a6d-ba41-311f81222317','c58c6586-12b1-4f2e-b23c-13baa75bc8a0','9912fe2d-729d-4990-a584-2cdd1dc9e074','bKash','0152512321231','Trx12345',299.00,'APPROVED','test','550e8400-e29b-41d4-a716-446655440000','2026-08-23 17:46:19','2026-08-23 13:45:52','2026-08-23 13:46:19'),('ab14e323-0442-4b93-89ac-98f826de45ca','c58c6586-12b1-4f2e-b23c-13baa75bc8a0','bfb40719-694e-4662-90d3-1ba719989278','bKash','01956380776','Trx1234',499.00,'APPROVED','It is okay','550e8400-e29b-41d4-a716-446655440000','2026-08-23 11:23:00','2026-08-23 07:22:20','2026-08-23 07:23:00'),('bfd491a4-e88b-4a8d-9f37-6bee685bb6f8','b5275933-32a5-444d-9455-83df7630ef6d','c4d77deb-9b1e-49b5-bacb-6374b6c8d438','bKash','01956380776','Trx123456',2999.00,'APPROVED','approved','550e8400-e29b-41d4-a716-446655440000','2026-08-25 23:16:17','2026-08-25 19:15:20','2026-08-25 19:16:17'),('c37d26a8-aac8-448e-a5ee-cdcc6cd6cf9f','b5275933-32a5-444d-9455-83df7630ef6d','790f55ec-0cfd-4f5e-8411-7a726e2331ec','bKash','01525147485','Trx2578',1999.00,'APPROVED','Test approved','550e8400-e29b-41d4-a716-446655440000','2026-08-25 17:01:43','2026-08-25 13:01:09','2026-08-25 13:01:43'),('efb1ac4a-fd87-49b3-b657-8b6463eca389','b5275933-32a5-444d-9455-83df7630ef6d','b45e8354-a2b0-4d58-9862-63d3dc5012ae','bKash','01821468795','Trx157462',599.00,'APPROVED','Test done','550e8400-e29b-41d4-a716-446655440000','2026-08-24 18:12:44','2026-08-24 14:12:07','2026-08-24 14:12:44');
/*!40000 ALTER TABLE `payment_claims` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `question_options`
--

DROP TABLE IF EXISTS `question_options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `question_options` (
  `id` varchar(36) NOT NULL,
  `questionId` varchar(36) NOT NULL,
  `optionIndex` int(11) NOT NULL,
  `text` text NOT NULL,
  `isActive` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_options_question` (`questionId`,`optionIndex`),
  CONSTRAINT `fk_options_question` FOREIGN KEY (`questionId`) REFERENCES `quiz_questions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `question_options`
--

LOCK TABLES `question_options` WRITE;
/*!40000 ALTER TABLE `question_options` DISABLE KEYS */;
INSERT INTO `question_options` VALUES ('00d1e4a8-6e7e-4d73-a376-64686ed763aa','837dfc00-bc74-456f-b028-47c6c7e1958d',2,'As Usual',1),('08cd8c81-dd5e-40d5-872b-ae9dee859d6a','e3dc63d8-a287-48dd-bcae-267bd7249439',3,'None',1),('0a1888af-5401-4873-bcbc-81c971651a1a','1b059d5b-b770-41ee-b7e2-8dfadbda20bf',2,'bolen ki',1),('12910feb-0ce0-42eb-94ff-94ac6c4d2263','0bd871da-4de0-4391-bd90-24e9c6830e6a',3,'turjo',1),('15972a83-8edc-45e1-ba72-a168c0d0632b','ad8301ff-3d87-4989-b779-bd5703724295',0,'Coding',1),('1a2a4d6a-8d41-43da-bddf-4f97a6c2b1ca','617e0667-8dc0-414b-88c7-7ab40a5a9c20',2,'goodest',1),('1e00a704-211b-4a51-b66d-2fdcb5edb33b','96e1f158-91a5-4e13-9e95-8a7482a6508b',3,'gg',1),('1f1a3afb-cd35-4b48-b1c6-1caea4854b76','89388755-f0fa-4882-bc1f-75496c08cfc7',3,'cc',1),('25c15329-82e3-4880-b332-d0fad8bece7b','64a74381-300d-4e56-bca7-d32d5cb080b0',3,'None',1),('2dcd5d0d-6a3c-4f91-b921-4907d1bd8972','e3dc63d8-a287-48dd-bcae-267bd7249439',0,'Good',1),('2fcc661c-737c-4011-907e-546746a21f5e','6ec60d8e-7203-4fe4-b7ad-a7cba6efb042',3,'gg',1),('33039c74-a2cf-42b1-88af-80692d2d6657','744420bb-6a3e-4d50-8fa1-7d75fe2600e0',0,'ok',1),('33ee4f2e-2fd9-406a-88ba-db90cca102d3','9eb2289f-1ad1-4a82-b1b5-0be3b9430876',3,'none',1),('341ad320-290c-4ac3-a0e1-be0e2c12e2da','64a74381-300d-4e56-bca7-d32d5cb080b0',1,'Demo',1),('35b71909-48a0-4ace-ad18-c0ccfb0b85de','5f9d976a-32a4-4ab8-b2df-f10998d19617',2,'Bad',1),('3aaf21a4-8e72-4c4f-8674-f81a37867090','ad8301ff-3d87-4989-b779-bd5703724295',1,'Studying',1),('4093a9ef-8d5f-4004-84cb-4a2b3a960b6a','617e0667-8dc0-414b-88c7-7ab40a5a9c20',1,'gooder',1),('42e5dbf5-6dbd-4374-aa76-a873afd0cb0c','64a74381-300d-4e56-bca7-d32d5cb080b0',0,'Test',1),('43c5235b-1b1e-4878-8f60-a8cdaf4a22bd','617e0667-8dc0-414b-88c7-7ab40a5a9c20',0,'good',1),('54ce8acf-aea1-4703-b4ce-6ce00e601fdd','96e1f158-91a5-4e13-9e95-8a7482a6508b',2,'ff',1),('58965fd3-7d7d-4254-bc50-8a10e2252cda','6ec60d8e-7203-4fe4-b7ad-a7cba6efb042',0,'ss',1),('605fcefc-1615-42b1-b087-db74ad41a200','0bd871da-4de0-4391-bd90-24e9c6830e6a',2,'rafi',1),('60f95256-dbaa-46d4-baf9-7556670eaeb5','f06265da-98d0-4760-8146-4fe9b5ab5bab',1,'Bad',1),('64e74c9a-ea1e-4015-be37-648f242bf2de','837dfc00-bc74-456f-b028-47c6c7e1958d',3,'Best',1),('69df9b18-27c4-46d6-97db-309cc72b3455','1b059d5b-b770-41ee-b7e2-8dfadbda20bf',3,'bolbo na',1),('6cb93314-20f8-4b20-9b3c-df3ca89b3287','5f9d976a-32a4-4ab8-b2df-f10998d19617',1,'Trial',1),('6dae5d5a-3810-44f9-be64-97f7e698c246','ad8301ff-3d87-4989-b779-bd5703724295',3,'Updating',1),('70691754-32b4-4578-8fce-ec5d0c46f1c9','64a74381-300d-4e56-bca7-d32d5cb080b0',2,'Trial',1),('7a30fde5-8c8f-4700-bd1c-9142e5efcde8','96e1f158-91a5-4e13-9e95-8a7482a6508b',1,'dd',1),('7aae3209-5134-49d9-b980-7ebde0943403','1b059d5b-b770-41ee-b7e2-8dfadbda20bf',1,'jani kintu bolbo na',1),('7c5c2834-c2e5-45da-95f8-7ee6f62f40df','6ec60d8e-7203-4fe4-b7ad-a7cba6efb042',2,'ff',1),('83ec9d36-22eb-46bc-bf9e-d73d6db56bf7','744420bb-6a3e-4d50-8fa1-7d75fe2600e0',3,'nooooo',1),('85e22705-58f4-4620-8262-cfd265448142','f06265da-98d0-4760-8146-4fe9b5ab5bab',0,'Good',1),('88337666-4519-4cbc-a8f9-2ffc3756f210','6ec60d8e-7203-4fe4-b7ad-a7cba6efb042',1,'xx',1),('982df86c-c030-4393-850b-9aefffb4155b','89388755-f0fa-4882-bc1f-75496c08cfc7',0,'ss',1),('9ab03991-6dd4-4059-a7b3-190b10558e68','1b059d5b-b770-41ee-b7e2-8dfadbda20bf',0,'jani na',1),('9f4d7ab8-c1b0-469b-ae3d-033cecf44267','0bd871da-4de0-4391-bd90-24e9c6830e6a',0,'tonmoy',1),('9f9430b2-a9d0-4157-a3c5-46c13ea8369b','5f9d976a-32a4-4ab8-b2df-f10998d19617',0,'Test',1),('a7d1a73e-18e5-4db5-bd7e-aa00895ef2aa','f06265da-98d0-4760-8146-4fe9b5ab5bab',3,'None',1),('ac5c391f-ecb1-4339-9ebe-5ef543e2ebf2','837dfc00-bc74-456f-b028-47c6c7e1958d',0,'Good',1),('ae840a0d-c292-431d-b16f-64a192614bb2','96e1f158-91a5-4e13-9e95-8a7482a6508b',0,'ss',1),('b4df1795-53ec-4618-9994-abcf11a1039e','744420bb-6a3e-4d50-8fa1-7d75fe2600e0',1,'ook',1),('b6f4e7f3-fbab-4359-aa4c-0cbbac1f414c','ad8301ff-3d87-4989-b779-bd5703724295',2,'Testing',1),('be3d429a-6f80-4abb-ab0e-3143ccf260b0','5f9d976a-32a4-4ab8-b2df-f10998d19617',3,'Good',1),('bfcafb1a-9351-4e54-9cab-1818fb1bb09c','744420bb-6a3e-4d50-8fa1-7d75fe2600e0',2,'ooook',1),('c5a77502-4675-46c2-811e-024e4e013fe9','f06265da-98d0-4760-8146-4fe9b5ab5bab',2,'As Usual',1),('cc5426b1-7f23-4bb7-99d4-a3853f9f0903','617e0667-8dc0-414b-88c7-7ab40a5a9c20',3,'badest',1),('cf877e05-08a2-4f92-a396-1dca774baf9a','e3dc63d8-a287-48dd-bcae-267bd7249439',1,'Bad',1),('d1a7294e-7178-49fe-a1c6-09d46c47413a','9eb2289f-1ad1-4a82-b1b5-0be3b9430876',1,'bad',1),('d39a08a3-ba22-43c1-aacb-ab41c1a9e380','e3dc63d8-a287-48dd-bcae-267bd7249439',2,'As Usual',1),('d45255d6-1edd-4f23-a07b-62a7ca55befc','0bd871da-4de0-4391-bd90-24e9c6830e6a',1,'zohani',1),('db0a3e49-efa8-4f9c-9025-fa6aa81c0eb8','89388755-f0fa-4882-bc1f-75496c08cfc7',2,'xx',1),('e2265b17-a8dc-4a72-a60c-c1f3f3a8bc8e','9eb2289f-1ad1-4a82-b1b5-0be3b9430876',2,'worst',1),('ee15822d-06e8-4b0c-85bd-4ffe30e25ee4','9eb2289f-1ad1-4a82-b1b5-0be3b9430876',0,'fine',1),('eeeb08f5-c70b-4499-a9ba-b10233116180','837dfc00-bc74-456f-b028-47c6c7e1958d',1,'Bad',1),('f2d3514b-19d0-41c0-b640-9d2142ad4106','89388755-f0fa-4882-bc1f-75496c08cfc7',1,'dd',1);
/*!40000 ALTER TABLE `question_options` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `quiz_questions`
--

DROP TABLE IF EXISTS `quiz_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quiz_questions` (
  `id` varchar(36) NOT NULL,
  `quizId` varchar(36) NOT NULL,
  `questionText` text NOT NULL,
  `explanation` text DEFAULT NULL,
  `marks` decimal(5,2) DEFAULT 1.00,
  `negativeMarking` decimal(5,2) DEFAULT 0.00,
  `correctOptionIndex` int(11) NOT NULL,
  `sequenceNumber` int(11) DEFAULT 1,
  `isActive` tinyint(1) DEFAULT 1,
  `createdAt` timestamp NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_questions_quiz_sequence` (`quizId`,`sequenceNumber`),
  CONSTRAINT `fk_questions_quiz` FOREIGN KEY (`quizId`) REFERENCES `quizzes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quiz_questions`
--

LOCK TABLES `quiz_questions` WRITE;
/*!40000 ALTER TABLE `quiz_questions` DISABLE KEYS */;
INSERT INTO `quiz_questions` VALUES ('0bd871da-4de0-4391-bd90-24e9c6830e6a','6d7b5bb3-63ea-4af3-b741-0fff386fdd56','what is your name?','option B is correct',11.00,0.25,1,3,1,'2026-08-25 18:03:55','2026-08-25 18:03:55'),('1b059d5b-b770-41ee-b7e2-8dfadbda20bf','aab928cf-61ae-43b6-8a9f-3592789dc425','Appeal Ki','option B is correct',100.00,0.25,1,1,1,'2026-08-25 18:07:18','2026-08-25 18:07:18'),('5f9d976a-32a4-4ab8-b2df-f10998d19617','34e9a7ab-0feb-4843-9fff-159064d08e3f','Kemon acho?','Trial',3.00,0.25,1,2,1,'2026-08-25 14:23:28','2026-08-25 14:23:28'),('617e0667-8dc0-414b-88c7-7ab40a5a9c20','6d7b5bb3-63ea-4af3-b741-0fff386fdd56','what is cpc?','option A e sothik uttor',2.00,0.25,0,1,1,'2026-08-25 18:02:09','2026-08-25 18:02:09'),('64a74381-300d-4e56-bca7-d32d5cb080b0','1b0ba4f0-49e2-417a-9685-461fe4eef617','What is your opinion?','This is test',1.00,0.25,2,1,1,'2026-08-23 13:31:57','2026-08-23 13:31:57'),('6ec60d8e-7203-4fe4-b7ad-a7cba6efb042','bd1ed2d1-1b72-44fb-aad7-d97786594c58','Test Test','xx',1.00,0.25,1,1,1,'2026-08-25 14:05:20','2026-08-25 14:05:20'),('744420bb-6a3e-4d50-8fa1-7d75fe2600e0','1b358e0b-2173-461c-8d6d-6b2e857d6795','CRPC KI?','OPTION D IS CORRECT',5.00,0.25,3,1,1,'2026-08-25 18:10:51','2026-08-25 18:10:51'),('837dfc00-bc74-456f-b028-47c6c7e1958d','5d0973b5-92ea-47c8-910a-ba94dcf479fc','How are you?','as usual',1.00,0.25,2,1,1,'2026-08-22 14:25:55','2026-08-22 14:25:55'),('89388755-f0fa-4882-bc1f-75496c08cfc7','218455b6-d1d2-4d68-b80e-72983fbb1648','Hola','ss',1.00,0.25,1,1,1,'2026-08-25 13:54:21','2026-08-25 13:54:21'),('96e1f158-91a5-4e13-9e95-8a7482a6508b','1e00295c-873f-4677-b773-fab113d8d614','Type','test test',5.00,0.25,3,1,1,'2026-08-25 14:12:59','2026-08-25 14:12:59'),('9eb2289f-1ad1-4a82-b1b5-0be3b9430876','6d7b5bb3-63ea-4af3-b741-0fff386fdd56','How are you?','option A is correct',2.00,0.25,0,2,1,'2026-08-25 18:03:06','2026-08-25 18:03:06'),('ad8301ff-3d87-4989-b779-bd5703724295','180a6f89-6065-4938-9e71-3cb704763d57','What are you doing?','Studying',1.00,0.25,1,2,1,'2026-08-25 11:23:15','2026-08-25 11:23:15'),('e3dc63d8-a287-48dd-bcae-267bd7249439','34e9a7ab-0feb-4843-9fff-159064d08e3f','How are you?','Bad',5.00,0.25,1,1,1,'2026-08-25 14:20:23','2026-08-25 14:20:23'),('f06265da-98d0-4760-8146-4fe9b5ab5bab','180a6f89-6065-4938-9e71-3cb704763d57','How are you?','Good',1.00,0.25,0,1,1,'2026-08-25 11:22:23','2026-08-25 11:22:23');
/*!40000 ALTER TABLE `quiz_questions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `quiz_submissions`
--

DROP TABLE IF EXISTS `quiz_submissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quiz_submissions` (
  `id` varchar(36) NOT NULL,
  `quizId` varchar(36) NOT NULL,
  `studentId` varchar(36) NOT NULL,
  `attemptNumber` int(11) DEFAULT 1,
  `totalScore` decimal(8,2) DEFAULT 0.00,
  `maxScore` decimal(8,2) DEFAULT 0.00,
  `percentage` decimal(5,2) DEFAULT 0.00,
  `isPassed` tinyint(1) DEFAULT 0,
  `status` enum('in_progress','submitted','auto_submitted') DEFAULT 'in_progress',
  `startedAt` timestamp NULL DEFAULT NULL,
  `submittedAt` timestamp NULL DEFAULT NULL,
  `timeSpent` int(11) DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_submissions_quiz` (`quizId`),
  KEY `idx_submissions_student` (`studentId`),
  KEY `idx_submissions_status` (`status`),
  CONSTRAINT `fk_submissions_quiz` FOREIGN KEY (`quizId`) REFERENCES `quizzes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_submissions_student` FOREIGN KEY (`studentId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quiz_submissions`
--

LOCK TABLES `quiz_submissions` WRITE;
/*!40000 ALTER TABLE `quiz_submissions` DISABLE KEYS */;
INSERT INTO `quiz_submissions` VALUES ('1a49aac0-0234-4f4a-a72e-47d06ea2510c','1b0ba4f0-49e2-417a-9685-461fe4eef617','c58c6586-12b1-4f2e-b23c-13baa75bc8a0',1,0.00,101.00,0.00,0,'submitted','2026-08-23 17:46:51','2026-08-23 17:46:56',4,'2026-08-23 13:46:51','2026-08-23 13:46:56'),('37fa5465-167d-48c4-9283-82860a485e84','1b358e0b-2173-461c-8d6d-6b2e857d6795','b5275933-32a5-444d-9455-83df7630ef6d',3,0.00,10.00,0.00,0,'submitted','2026-08-25 23:20:18','2026-08-25 23:20:22',3,'2026-08-25 19:20:18','2026-08-25 19:20:22'),('4b86753a-ba3b-4bb3-983a-bdc63282aaec','1b358e0b-2173-461c-8d6d-6b2e857d6795','b5275933-32a5-444d-9455-83df7630ef6d',2,5.00,10.00,100.00,1,'submitted','2026-08-25 23:19:40','2026-08-25 23:19:52',10,'2026-08-25 19:19:40','2026-08-25 19:19:52'),('5d0ba311-f814-45d5-b513-d9c26737166d','1b0ba4f0-49e2-417a-9685-461fe4eef617','c58c6586-12b1-4f2e-b23c-13baa75bc8a0',2,1.00,101.00,100.00,1,'submitted','2026-08-23 17:47:17','2026-08-23 17:47:24',5,'2026-08-23 13:47:17','2026-08-23 13:47:24'),('7d9ea2db-b424-4dc5-9888-3fa7196223a2','218455b6-d1d2-4d68-b80e-72983fbb1648','b5275933-32a5-444d-9455-83df7630ef6d',1,1.00,101.00,100.00,1,'submitted','2026-08-25 17:55:18','2026-08-25 17:55:21',2,'2026-08-25 13:55:18','2026-08-25 13:55:21'),('81cf8da0-5f93-44f2-9fe3-624d3cf3d3f4','1b0ba4f0-49e2-417a-9685-461fe4eef617','c58c6586-12b1-4f2e-b23c-13baa75bc8a0',3,0.00,101.00,0.00,0,'submitted','2026-08-23 17:47:27','2026-08-23 17:47:30',2,'2026-08-23 13:47:27','2026-08-23 13:47:30'),('9055ab6b-7a39-41a8-a973-03ca2bc9ac78','1b358e0b-2173-461c-8d6d-6b2e857d6795','b5275933-32a5-444d-9455-83df7630ef6d',1,0.00,10.00,0.00,0,'submitted','2026-08-25 23:19:31','2026-08-25 23:19:34',2,'2026-08-25 19:19:31','2026-08-25 19:19:34'),('91061786-c774-4bfa-9793-3249bcec3bb8','6d7b5bb3-63ea-4af3-b741-0fff386fdd56','b5275933-32a5-444d-9455-83df7630ef6d',1,0.00,30.00,0.00,0,'in_progress','2026-08-25 23:18:52',NULL,NULL,'2026-08-25 19:18:52','2026-08-25 19:18:52'),('a441da29-1bdd-4947-8d70-98d2275cac1a','34e9a7ab-0feb-4843-9fff-159064d08e3f','b5275933-32a5-444d-9455-83df7630ef6d',1,4.75,18.00,0.00,0,'submitted','2026-08-25 18:29:05','2026-08-25 18:29:11',5,'2026-08-25 14:29:05','2026-08-25 14:29:11'),('c4dc9836-675a-49c5-8b7f-993b39f94c4e','180a6f89-6065-4938-9e71-3cb704763d57','b5275933-32a5-444d-9455-83df7630ef6d',1,0.00,5.00,0.00,0,'submitted','2026-08-25 17:16:30','2026-08-25 18:29:40',5,'2026-08-25 13:16:30','2026-08-25 14:29:40'),('ccf1dc8d-c6a8-47db-91d1-9f34cbae8b0c','bd1ed2d1-1b72-44fb-aad7-d97786594c58','b5275933-32a5-444d-9455-83df7630ef6d',1,1.00,51.00,100.00,1,'submitted','2026-08-25 18:05:59','2026-08-25 18:06:02',2,'2026-08-25 14:05:59','2026-08-25 14:06:02');
/*!40000 ALTER TABLE `quiz_submissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `quizzes`
--

DROP TABLE IF EXISTS `quizzes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quizzes` (
  `id` varchar(36) NOT NULL,
  `moduleId` varchar(36) NOT NULL,
  `title` varchar(500) NOT NULL,
  `description` text NOT NULL,
  `duration` int(11) NOT NULL COMMENT 'Duration in minutes',
  `totalMarks` int(11) NOT NULL,
  `passingMarks` int(11) NOT NULL DEFAULT 0,
  `isPublished` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `isActive` tinyint(1) DEFAULT 1,
  `maxAttempts` int(11) DEFAULT 1,
  `shuffleQuestions` tinyint(1) DEFAULT 0,
  `showResultsImmediately` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_quizzes_module` (`moduleId`),
  CONSTRAINT `quizzes_ibfk_1` FOREIGN KEY (`moduleId`) REFERENCES `modules` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quizzes`
--

LOCK TABLES `quizzes` WRITE;
/*!40000 ALTER TABLE `quizzes` DISABLE KEYS */;
INSERT INTO `quizzes` VALUES ('180a6f89-6065-4938-9e71-3cb704763d57','1a57c729-75d7-4e95-833c-50b44a9f5b74','First Quiz','Quiz for this module first',30,5,2,1,'2026-08-25 11:21:39','2026-08-25 11:23:18',1,3,0,1),('1b0ba4f0-49e2-417a-9685-461fe4eef617','854435f3-311d-4eb5-acd4-86453ed019af','1st Quiz','Quiz for this module 1',30,101,50,1,'2026-08-23 13:31:07','2026-08-23 13:32:01',1,3,0,1),('1b358e0b-2173-461c-8d6d-6b2e857d6795','5f5ed6e0-91a8-4b5d-a6b7-16a9e7b2b27c','CRPC QUIZ','Quiz for this module',30,10,2,1,'2026-08-25 18:10:16','2026-08-25 18:10:53',1,3,0,1),('1e00295c-873f-4677-b773-fab113d8d614','6d22b44f-45ae-43c3-8476-96848858e956','Quiz mail test','Quiz for this module',30,15,5,1,'2026-08-25 14:11:51','2026-08-25 14:14:56',1,3,0,1),('218455b6-d1d2-4d68-b80e-72983fbb1648','3154ef69-c366-4de6-afe3-6139b2fd89a3','Test Quiz 2','Quiz for this module 2',30,101,50,1,'2026-08-25 13:53:43','2026-08-25 13:54:24',1,3,0,1),('34e9a7ab-0feb-4843-9fff-159064d08e3f','b1e655c2-82c5-40c9-bbae-eda674c89da1','Test Quiz 5','Quiz for this module 5',30,18,5,1,'2026-08-25 14:18:19','2026-08-25 14:26:28',1,3,0,1),('5d0973b5-92ea-47c8-910a-ba94dcf479fc','1a09970c-251a-48a2-99bf-5b5b8712210d','Test Quiz','Quiz for this module test',30,101,50,1,'2026-08-22 14:24:14','2026-08-22 14:25:58',1,3,0,1),('6d7b5bb3-63ea-4af3-b741-0fff386fdd56','00e57d6c-a980-482c-91d9-e53047321511','tamadi law quiz','Quiz for this module',30,30,5,1,'2026-08-25 18:01:05','2026-08-25 18:04:05',1,3,0,1),('aab928cf-61ae-43b6-8a9f-3592789dc425','6723e9dc-38ef-4d46-848b-90d223179de7','Appeal Quiz','Quiz for this module',30,200,50,1,'2026-08-25 18:06:43','2026-08-25 18:07:24',1,3,0,1),('bd1ed2d1-1b72-44fb-aad7-d97786594c58','b72cd1e5-10ed-486b-aaca-b4846920c7dc','Test quiz 3','Quiz for this module 3',30,51,30,1,'2026-08-25 14:01:47','2026-08-25 14:05:23',1,3,0,1);
/*!40000 ALTER TABLE `quizzes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subjects`
--

DROP TABLE IF EXISTS `subjects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subjects` (
  `id` varchar(36) NOT NULL,
  `courseId` varchar(36) NOT NULL,
  `name` varchar(500) NOT NULL,
  `description` text DEFAULT NULL,
  `sequenceOrder` int(11) NOT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `thumbnailUrl` varchar(500) DEFAULT NULL,
  `totalModules` int(11) NOT NULL DEFAULT 0,
  `totalDuration` int(11) NOT NULL DEFAULT 0 COMMENT 'Total duration in minutes',
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_subjects_courseId` (`courseId`),
  KEY `idx_subjects_sequenceOrder` (`sequenceOrder`),
  KEY `idx_subjects_isActive` (`isActive`),
  CONSTRAINT `fk_subjects_courseId` FOREIGN KEY (`courseId`) REFERENCES `courses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Subjects within courses';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subjects`
--

LOCK TABLES `subjects` WRITE;
/*!40000 ALTER TABLE `subjects` DISABLE KEYS */;
INSERT INTO `subjects` VALUES ('2437eef1-b69d-4418-836d-d2446d8afccd','c4d77deb-9b1e-49b5-bacb-6374b6c8d438','CRPC','CRPC KI?',2,1,NULL,1,0,'2026-08-25 18:08:03','2026-08-25 18:09:52'),('3a0853b0-7e71-4d1a-a0ca-89b5b2761c87','40fa7b3e-81a6-4d8f-9d17-18ae64d6af28','Test Subject','Test details',1,1,NULL,0,0,'2026-08-22 06:31:16','2026-08-22 06:31:16'),('6b13affb-50c9-4199-8162-64cf30c5d42e','b51f312e-16b1-4afd-875c-ab2689f2f0b5','Test Sub','Test details',1,1,NULL,1,0,'2026-08-22 14:17:42','2026-08-22 14:23:01'),('70d2acbd-ca64-4fcf-abe5-fa86c84d0464','c4d77deb-9b1e-49b5-bacb-6374b6c8d438','CPC','CPC foundation',1,1,NULL,2,0,'2026-08-25 17:53:30','2026-08-25 18:06:30'),('95306df8-20bf-4a41-9cb2-4b24437f51df','9912fe2d-729d-4990-a584-2cdd1dc9e074','1st Subject','1st details',1,1,NULL,1,0,'2026-08-23 10:26:09','2026-08-23 13:30:50'),('bd251de6-8bb5-4e6c-b96b-7142ba6bf50c','40fa7b3e-81a6-4d8f-9d17-18ae64d6af28','Test Subject','Test details',1,1,NULL,0,0,'2026-08-22 06:31:16','2026-08-22 06:31:16'),('e0800146-418b-4fbf-b287-00dfee275fb4','bfb40719-694e-4662-90d3-1ba719989278','Pre british period','pre british details',1,1,NULL,1,0,'2026-08-22 06:44:28','2026-08-22 14:12:25'),('e63006a4-d74e-49b5-a38c-603f4d97a2a7','790f55ec-0cfd-4f5e-8411-7a726e2331ec','History of Bangladesh','History details',1,1,NULL,5,0,'2026-08-25 11:07:39','2026-08-25 14:16:31');
/*!40000 ALTER TABLE `subjects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `submission_answers`
--

DROP TABLE IF EXISTS `submission_answers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `submission_answers` (
  `id` varchar(36) NOT NULL,
  `submissionId` varchar(36) NOT NULL,
  `questionId` varchar(36) NOT NULL,
  `selectedOptionIndex` int(11) DEFAULT NULL,
  `isCorrect` tinyint(1) DEFAULT 0,
  `marksObtained` decimal(5,2) DEFAULT 0.00,
  `answeredAt` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_answers_submission` (`submissionId`),
  KEY `idx_answers_question` (`questionId`),
  CONSTRAINT `fk_answers_question` FOREIGN KEY (`questionId`) REFERENCES `quiz_questions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_answers_submission` FOREIGN KEY (`submissionId`) REFERENCES `quiz_submissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `submission_answers`
--

LOCK TABLES `submission_answers` WRITE;
/*!40000 ALTER TABLE `submission_answers` DISABLE KEYS */;
INSERT INTO `submission_answers` VALUES ('28e4c87e-8fdd-4302-8286-52a4f151f749','37fa5465-167d-48c4-9283-82860a485e84','744420bb-6a3e-4d50-8fa1-7d75fe2600e0',0,0,-0.25,'2026-08-25 19:20:22'),('2d9ebfba-bf84-4a93-8f6c-ba8a624313a9','7d9ea2db-b424-4dc5-9888-3fa7196223a2','89388755-f0fa-4882-bc1f-75496c08cfc7',1,1,1.00,'2026-08-25 13:55:21'),('430d055d-df1d-41f4-a85b-fb00e790b0d8','c4dc9836-675a-49c5-8b7f-993b39f94c4e','ad8301ff-3d87-4989-b779-bd5703724295',0,0,-0.25,'2026-08-25 14:29:40'),('5072e58a-1fd0-4e0d-8640-bcf9ba0183a9','a441da29-1bdd-4947-8d70-98d2275cac1a','e3dc63d8-a287-48dd-bcae-267bd7249439',1,1,5.00,'2026-08-25 14:29:11'),('63a7537e-b4b3-44e4-b329-fa0230655787','4b86753a-ba3b-4bb3-983a-bdc63282aaec','744420bb-6a3e-4d50-8fa1-7d75fe2600e0',3,1,5.00,'2026-08-25 19:19:52'),('6436f6f2-d521-4461-918e-8a7b705be81f','ccf1dc8d-c6a8-47db-91d1-9f34cbae8b0c','6ec60d8e-7203-4fe4-b7ad-a7cba6efb042',1,1,1.00,'2026-08-25 14:06:02'),('8bd45228-e627-44c6-8bb5-4f21a1450f2b','c4dc9836-675a-49c5-8b7f-993b39f94c4e','f06265da-98d0-4760-8146-4fe9b5ab5bab',1,0,-0.25,'2026-08-25 14:29:40'),('9ef1d570-0bd2-47b2-9a54-1c74da814f8e','9055ab6b-7a39-41a8-a973-03ca2bc9ac78','744420bb-6a3e-4d50-8fa1-7d75fe2600e0',0,0,-0.25,'2026-08-25 19:19:34'),('a892c2d7-0959-489e-9d2f-e4088819de10','a441da29-1bdd-4947-8d70-98d2275cac1a','5f9d976a-32a4-4ab8-b2df-f10998d19617',2,0,-0.25,'2026-08-25 14:29:11'),('ada98fef-6e72-4af2-b144-6210b6cecbf0','1a49aac0-0234-4f4a-a72e-47d06ea2510c','64a74381-300d-4e56-bca7-d32d5cb080b0',1,0,-0.25,'2026-08-23 13:46:56'),('b9517151-47a9-4891-8e09-8640f8e681ba','81cf8da0-5f93-44f2-9fe3-624d3cf3d3f4','64a74381-300d-4e56-bca7-d32d5cb080b0',0,0,-0.25,'2026-08-23 13:47:30'),('c78c55d2-efd3-49a5-acfb-11b90887c226','5d0ba311-f814-45d5-b513-d9c26737166d','64a74381-300d-4e56-bca7-d32d5cb080b0',2,1,1.00,'2026-08-23 13:47:24');
/*!40000 ALTER TABLE `submission_answers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `teacher_applications`
--

DROP TABLE IF EXISTS `teacher_applications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `teacher_applications` (
  `id` varchar(36) NOT NULL,
  `fullName` varchar(255) NOT NULL COMMENT 'Full name of the applicant',
  `email` varchar(255) NOT NULL COMMENT 'Email address of the applicant',
  `phoneNumber` varchar(20) NOT NULL COMMENT 'Phone number of the applicant',
  `qualifications` text NOT NULL COMMENT 'Educational qualifications and degrees',
  `experience` text NOT NULL COMMENT 'Teaching and work experience',
  `subjectsToTeach` text NOT NULL COMMENT 'Subjects the applicant wants to teach',
  `additionalInfo` text DEFAULT NULL COMMENT 'Additional information about the applicant',
  `cvFileName` varchar(255) NOT NULL COMMENT 'Name of the uploaded CV file',
  `cvFileUrl` varchar(500) NOT NULL COMMENT 'URL to access the CV file',
  `cvFileSize` bigint(20) NOT NULL COMMENT 'Size of the CV file in bytes',
  `cvMimeType` varchar(100) NOT NULL COMMENT 'MIME type of the CV file (should be application/pdf)',
  `status` enum('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending' COMMENT 'Application status',
  `adminNotes` text DEFAULT NULL COMMENT 'Admin notes about the application',
  `reviewedBy` varchar(255) DEFAULT NULL COMMENT 'Name of the admin who reviewed the application',
  `reviewedAt` timestamp NULL DEFAULT NULL COMMENT 'Timestamp when the application was reviewed',
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_teacher_applications_email` (`email`),
  KEY `idx_teacher_applications_status` (`status`),
  KEY `idx_teacher_applications_created_at` (`createdAt`),
  KEY `idx_teacher_applications_reviewed_by` (`reviewedBy`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci COMMENT='Teacher application submissions with CV uploads';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teacher_applications`
--

LOCK TABLES `teacher_applications` WRITE;
/*!40000 ALTER TABLE `teacher_applications` DISABLE KEYS */;
INSERT INTO `teacher_applications` VALUES ('36cf2b50-9572-4f69-80fb-28ca350bf4c9','Rafi Chy','kamrulhasanchowdhury70@gmail.com','01734181970','Bachelor','3 years exp','Javascript',NULL,'cv_3218cab0-4611-4528-bc72-ab82f18e47b3.pdf','/api/v1/teacher-applications/cv/cv_3218cab0-4611-4528-bc72-ab82f18e47b3.pdf',425024,'application/pdf','Rejected','rejected','Super Administrator','2026-08-25 21:49:02','2026-08-25 06:04:44','2026-08-25 17:49:02'),('7e354272-6470-436f-b240-6c097a582de4','Akramul Turjo','akramulturjo1@gmail.com','01718738130','CSE','Marketing','Sales','I am a marketing specialist','cv_7608a01d-18a7-4e5b-952e-e0601a887a0e.pdf','/api/v1/teacher-applications/cv/cv_7608a01d-18a7-4e5b-952e-e0601a887a0e.pdf',80777,'application/pdf','Approved','shob ok','Super Administrator','2026-08-25 23:22:39','2026-08-25 19:21:44','2026-08-25 19:22:39'),('d2e4aa99-9303-4fdd-92d1-e921b116254d','Tonmoy Zohani','fadiashehrin@gmail.com','01303788797','law','d','Law','ud','cv_f0701671-f459-4342-9bf5-6e3bdebe814c.pdf','/api/v1/teacher-applications/cv/cv_f0701671-f459-4342-9bf5-6e3bdebe814c.pdf',80777,'application/pdf','Pending','Approved','Super Administrator','2026-08-25 19:35:08','2026-08-25 15:06:53','2026-08-25 15:35:08');
/*!40000 ALTER TABLE `teacher_applications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phoneNumber` varchar(20) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('Super Admin','Admin','Teacher','Student') NOT NULL DEFAULT 'Student',
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `activeSessions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`activeSessions`)),
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `isEmailVerified` tinyint(1) NOT NULL DEFAULT 0,
  `emailVerificationToken` varchar(255) DEFAULT NULL,
  `emailVerificationTokenExpiry` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_users_email` (`email`),
  KEY `idx_users_role` (`role`),
  KEY `idx_users_phone` (`phoneNumber`),
  KEY `idx_users_verification_token` (`emailVerificationToken`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('550e8400-e29b-41d4-a716-446655440000','Super Administrator','admin@lmsplatform.com',NULL,'$2a$10$TLHbu1IeP2ta.6fS5f0h4OKwVQRS8J/fuC2CKv6/DnMDASFDIjSLy','Super Admin',1,'[{\"deviceId\":\"df7a884c-3e21-49cf-8921-9e7bf331a980\",\"deviceName\":\"Chrome Browser - Windows 11\",\"sessionId\":\"sess_13a6030a\",\"lastActive\":\"2026-08-25T19:22:06.094Z\"},{\"deviceId\":\"dsjdsdjsojfsjjjofojfos\",\"deviceName\":\"android\",\"sessionId\":\"sess_cd149513\",\"lastActive\":\"2026-07-21T19:14:22.809Z\"}]','2026-07-14 17:21:10','2026-08-25 19:22:06',0,NULL,NULL),('5e1b69be-f1bb-402e-bdd2-a07296f1e598','John Doe','john.doe@example.com','+8801712345678','$2b$10$CW.BDgi7MB6lPiSFpAsyruABE6AeLL9JKOsvzAkjllSJHwbbEceMm','Student',1,'[{\"deviceId\":\"df7a884c-3e21-49cf-8921-9e7bf331a980\",\"deviceName\":\"Chrome Browser - Windows 11\",\"sessionId\":\"sess_c3d86c20\",\"lastActive\":\"2026-07-24T14:14:32.094Z\"}]','2026-07-24 09:50:56','2026-07-24 14:14:32',0,NULL,NULL),('5f6faaf5-cbc5-4a82-8e70-b4801b6bf667','Zohani Saleh','zohanisaleh@gmail.com','01303788797','$2b$10$Blm.2IRGffZxcvkxj67DfehgA/kdaC0hmGg/UY6yFMEstaPSJ6Y0e','Student',1,'[{\"deviceId\":\"df7a884c-3e21-49cf-8921-9e7bf331a980\",\"deviceName\":\"Chrome Browser - Windows 11\",\"sessionId\":\"sess_5e7456ce\",\"lastActive\":\"2026-08-24T19:52:35.349Z\"}]','2026-08-24 19:49:11','2026-08-24 19:52:35',1,NULL,NULL),('b5275933-32a5-444d-9455-83df7630ef6d','Md. Khaled Zohani Tonmoy','tonmoyzohani0804@gmail.com','01303788797','$2b$10$MZDAda57PlvOjYHmgJIUZu4oXaZTPsIUj.XDJ893tjP5NiNobf.0W','Student',1,'[{\"deviceId\":\"df7a884c-3e21-49cf-8921-9e7bf331a980\",\"deviceName\":\"Chrome Browser - Windows 11\",\"sessionId\":\"sess_b8dcfce5\",\"lastActive\":\"2026-08-25T19:18:50.212Z\"}]','2026-08-24 05:33:01','2026-08-25 19:18:50',1,'63ff68cd76a082dd25b7413145cc8810a0c4a7eb31facd1a59262e9561180f0f','2026-08-25 09:33:01'),('c58c6586-12b1-4f2e-b23c-13baa75bc8a0','Tonmoy Zohani','tonmoyzohani@gmail.com','01303788797','$2b$10$wFMvWv6U2Nga7hP4RC7vguI/AMltPzdNRoj1X42BtPQXI6gp7juY.','Student',1,'[{\"deviceId\":\"df7a884c-3e21-49cf-8921-9e7bf331a980\",\"deviceName\":\"Chrome Browser - Windows 11\",\"sessionId\":\"sess_fc684d62\",\"lastActive\":\"2026-08-23T13:46:28.422Z\"}]','2026-07-21 11:45:02','2026-08-23 13:46:28',0,NULL,NULL),('cdb95d9f-5279-4532-8142-a4440f700ec4','Kamrul Hasan','crafi245@gmail.com','01734181970','$2b$10$dAbHqQEPTomgOjsM/XFV5.pIUC0FKXkTqZoyyO/JCu8nsEA/YWUV6','Student',1,'[{\"deviceId\":\"df7a884c-3e21-49cf-8921-9e7bf331a980\",\"deviceName\":\"Chrome Browser - Windows 11\",\"sessionId\":\"sess_c6ac3c82\",\"lastActive\":\"2026-08-24T19:31:48.869Z\"}]','2026-08-24 19:30:41','2026-08-24 19:31:48',1,NULL,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `videos`
--

DROP TABLE IF EXISTS `videos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `videos` (
  `id` varchar(36) NOT NULL,
  `moduleId` varchar(36) NOT NULL,
  `title` varchar(500) NOT NULL,
  `description` text DEFAULT NULL,
  `fileName` varchar(1000) NOT NULL,
  `videoUrl` varchar(1000) NOT NULL,
  `hlsPlaylistUrl` varchar(1000) DEFAULT NULL,
  `duration` int(11) NOT NULL DEFAULT 0,
  `sequenceNumber` int(11) NOT NULL,
  `isDownloadable` tinyint(1) DEFAULT 1,
  `isActive` tinyint(1) DEFAULT 1,
  `fileSize` bigint(20) NOT NULL,
  `mimeType` varchar(50) NOT NULL,
  `status` enum('uploading','processing','ready','failed') DEFAULT 'uploading',
  `processingError` text DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_videos_module_sequence` (`moduleId`,`sequenceNumber`),
  KEY `idx_videos_status` (`status`),
  CONSTRAINT `fk_videos_module` FOREIGN KEY (`moduleId`) REFERENCES `modules` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `videos`
--

LOCK TABLES `videos` WRITE;
/*!40000 ALTER TABLE `videos` DISABLE KEYS */;
INSERT INTO `videos` VALUES ('1c7122a9-c739-42e7-b692-1a80c76a3fd1','481981c0-08cd-4f9e-bf1a-0a2c1404bcf6','Video test','video details','cbf16510-9392-44ca-8fc4-eecfb5057621.mp4','/api/v1/videos/cbf16510-9392-44ca-8fc4-eecfb5057621.mp4',NULL,0,1,0,1,87016367,'video/mp4','ready',NULL,'2026-08-22 07:23:12','2026-08-22 07:23:12'),('21ca9cef-73d9-4407-ae7f-1a8f81d14a48','00e57d6c-a980-482c-91d9-e53047321511','intro video','intro of tamadi law','5ab7be66-0417-4d6c-8c09-67ee261746f3.mp4','/api/v1/videos/5ab7be66-0417-4d6c-8c09-67ee261746f3.mp4',NULL,0,1,0,1,139138625,'video/mp4','ready',NULL,'2026-08-25 17:57:29','2026-08-25 17:57:29'),('37f82cee-d998-4f88-ac52-290388c91795','6723e9dc-38ef-4d46-848b-90d223179de7','apeal 1','appeal video intro','cda23c94-b7c5-42cf-b253-58e73e2072b4.mp4','/api/v1/videos/cda23c94-b7c5-42cf-b253-58e73e2072b4.mp4',NULL,0,1,0,1,139138625,'video/mp4','ready',NULL,'2026-08-25 18:05:56','2026-08-25 18:05:56'),('438b70de-c3f3-43ef-a609-bdec658b3a77','00e57d6c-a980-482c-91d9-e53047321511','second video','second video of tamadi law','0679291c-9c62-4e82-adfd-1355b5618618.mp4','/api/v1/videos/0679291c-9c62-4e82-adfd-1355b5618618.mp4',NULL,0,2,0,1,139138625,'video/mp4','ready',NULL,'2026-08-25 17:58:39','2026-08-25 17:58:39'),('552e4e8a-e09b-44bb-b68a-7a79e3234f86','b72cd1e5-10ed-486b-aaca-b4846920c7dc','Test Module Video','Test module details','69265792-a046-4893-aa47-3f6c8ae7634e.mp4','/api/v1/videos/69265792-a046-4893-aa47-3f6c8ae7634e.mp4',NULL,0,1,0,1,87016367,'video/mp4','ready',NULL,'2026-08-25 13:59:45','2026-08-25 13:59:45'),('5946b200-51f4-4fa2-872b-d384de3d6ab2','b1e655c2-82c5-40c9-bbae-eda674c89da1','Video 1','Video details ','50c0c66b-dfdd-4eed-929d-fceed2046128.mp4','/api/v1/videos/50c0c66b-dfdd-4eed-929d-fceed2046128.mp4',NULL,0,1,0,1,87016367,'video/mp4','ready',NULL,'2026-08-25 14:16:26','2026-08-25 14:16:26'),('5a2ce341-ae57-48da-b73d-5db5982212a8','1a09970c-251a-48a2-99bf-5b5b8712210d','Test video','test detatils','df92bcb3-8e9e-4ce4-a9d7-e72783b15adf.mp4','/api/v1/videos/df92bcb3-8e9e-4ce4-a9d7-e72783b15adf.mp4',NULL,0,1,0,1,87016367,'video/mp4','ready',NULL,'2026-08-22 14:18:35','2026-08-22 14:18:35'),('69a137dc-fa6d-4755-b42a-3bf2f527a256','3154ef69-c366-4de6-afe3-6139b2fd89a3','Test video 2','test video details','14732d43-148b-4b89-ba7a-d8486375082f.mp4','/api/v1/videos/14732d43-148b-4b89-ba7a-d8486375082f.mp4',NULL,0,2,0,1,87016367,'video/mp4','ready',NULL,'2026-08-25 13:53:22','2026-08-25 13:53:22'),('6f09b02c-d903-4fc9-9287-34ae02933656','854435f3-311d-4eb5-acd4-86453ed019af','3rd video','3rd video details','45347803-f80b-4add-a0a7-76ee9e7727a7.mp4','/api/v1/videos/45347803-f80b-4add-a0a7-76ee9e7727a7.mp4',NULL,0,3,0,1,87016367,'video/mp4','ready',NULL,'2026-08-23 13:30:42','2026-08-23 13:30:42'),('705cd5cf-300d-4d7a-844f-6e200f7f5fd8','00e57d6c-a980-482c-91d9-e53047321511','third video','third video tamadi law','de4c56b1-22cb-4e5f-aa4c-1fff2938bba5.mp4','/api/v1/videos/de4c56b1-22cb-4e5f-aa4c-1fff2938bba5.mp4',NULL,0,3,0,1,139138625,'video/mp4','ready',NULL,'2026-08-25 18:00:17','2026-08-25 18:00:17'),('7ace6d0b-97a8-48dc-b3ff-32f8b2f81644','1a57c729-75d7-4e95-833c-50b44a9f5b74','Second Video','second video details','c4e0dec7-f2a8-4b9f-9738-d1aac332c3ad.mp4','/api/v1/videos/c4e0dec7-f2a8-4b9f-9738-d1aac332c3ad.mp4',NULL,0,2,0,1,87016367,'video/mp4','ready',NULL,'2026-08-25 11:12:18','2026-08-25 11:12:18'),('8ddfab8b-140f-4f41-b1e1-b7dfcddffc8b','854435f3-311d-4eb5-acd4-86453ed019af','1st Video','1st video details','1214f0f2-b45d-42f8-9237-65406157d735.mp4','/api/v1/videos/1214f0f2-b45d-42f8-9237-65406157d735.mp4',NULL,0,1,0,1,87016367,'video/mp4','ready',NULL,'2026-08-23 13:28:58','2026-08-23 13:28:58'),('960217e8-8835-43ac-8c85-11a1d569a602','1a57c729-75d7-4e95-833c-50b44a9f5b74','First Video','Second video','a15681df-6852-466a-a99b-cc4328033094.mp4','/api/v1/videos/a15681df-6852-466a-a99b-cc4328033094.mp4',NULL,0,1,0,1,87016367,'video/mp4','ready',NULL,'2026-08-25 11:09:10','2026-08-25 11:09:10'),('9f2db37f-11b8-44bf-9565-9ac360ed1d47','854435f3-311d-4eb5-acd4-86453ed019af','2nd video','2nd video details','3bbc588d-4a22-42eb-b1a5-e6890ba0cb52.mp4','/api/v1/videos/3bbc588d-4a22-42eb-b1a5-e6890ba0cb52.mp4',NULL,0,2,0,1,87016367,'video/mp4','ready',NULL,'2026-08-23 13:29:56','2026-08-23 13:29:56'),('ad1f81d4-7706-4ec8-bce8-293b09b047cd','5f5ed6e0-91a8-4b5d-a6b7-16a9e7b2b27c','CRPC intro','CRPC intro','38624d41-a551-43ef-af61-ee707dfedd9c.mp4','/api/v1/videos/38624d41-a551-43ef-af61-ee707dfedd9c.mp4',NULL,0,1,0,1,139138625,'video/mp4','ready',NULL,'2026-08-25 18:09:10','2026-08-25 18:09:10'),('e02a465f-94e2-4664-9f2a-0ee172ce05b6','481981c0-08cd-4f9e-bf1a-0a2c1404bcf6','video test 2','video details 2','dd0dd6da-a1b4-4af6-84cb-b3d07ebf6561.mp4','/api/v1/videos/dd0dd6da-a1b4-4af6-84cb-b3d07ebf6561.mp4',NULL,0,2,0,1,87016367,'video/mp4','ready',NULL,'2026-08-22 07:24:48','2026-08-22 07:24:48'),('fc1ba3e1-ed90-4f08-9841-a7a58624a404','6d22b44f-45ae-43c3-8476-96848858e956','Test Module Video','Test details','1c291b52-84dc-49ee-8209-4de719f4cc84.mp4','/api/v1/videos/1c291b52-84dc-49ee-8209-4de719f4cc84.mp4',NULL,0,1,0,1,87016367,'video/mp4','ready',NULL,'2026-08-25 14:10:57','2026-08-25 14:10:57');
/*!40000 ALTER TABLE `videos` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-26 23:22:13
