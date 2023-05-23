CREATE DATABASE  IF NOT EXISTS `dsgd` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `dsgd`;
-- MySQL dump 10.13  Distrib 8.0.31, for Win64 (x86_64)
--
-- Host: localhost    Database: dsgd
-- ------------------------------------------------------
-- Server version	8.0.31

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `audittrails`
--

DROP TABLE IF EXISTS `audittrails`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audittrails` (
  `id` int NOT NULL AUTO_INCREMENT,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `action` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `campaignId` int DEFAULT NULL,
  `mintId` int DEFAULT NULL,
  `transferId` int DEFAULT NULL,
  `recipientId` int DEFAULT NULL,
  `draftcampaignId` int DEFAULT NULL,
  `draftmintId` int DEFAULT NULL,
  `drafttransferId` int DEFAULT NULL,
  `draftrecipientId` int DEFAULT NULL,
  `description` varchar(255) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `blockchain` int DEFAULT NULL,
  `tokenname` varchar(45) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `amount` bigint DEFAULT NULL,
  `startdate` date DEFAULT NULL,
  `enddate` date DEFAULT NULL,
  `sponsor` int DEFAULT NULL,
  `bank` varchar(255) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `bankaccount` varchar(255) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `sourcewallet` varchar(255) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `recipientwallet` varchar(255) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `smartcontractaddress` varchar(255) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `status` int DEFAULT '0' COMMENT '0 - success\\notherwise failed\\n',
  `txntype` int DEFAULT NULL,
  `maker` int DEFAULT NULL,
  `checker` int DEFAULT NULL,
  `approver` int DEFAULT NULL,
  `checkerComments` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `approverComments` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `actionby` varchar(255) COLLATE utf8mb3_unicode_ci DEFAULT NULL COMMENT 'reference to username',
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `id_idx` (`actionby`)
) ENGINE=InnoDB AUTO_INCREMENT=106 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audittrails`
--

LOCK TABLES `audittrails` WRITE;
/*!40000 ALTER TABLE `audittrails` DISABLE KEYS */;
INSERT INTO `audittrails` VALUES (73,'2023-04-30 14:44:02','Mint  request - resubmitted','Project Happy',97,NULL,NULL,NULL,NULL,6,NULL,NULL,NULL,NULL,'HAPPY',25,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'0x78f6EEA7dDb66471ab90fB49803ccc0983390515',1,NULL,1,5,4,'hhh','gg','grsmoc','2023-04-30 14:44:02','2023-04-30 14:44:02'),(74,'2023-04-30 14:57:43','Mint  request - rejected','Project Happy',97,NULL,NULL,NULL,NULL,6,NULL,NULL,NULL,NULL,'HAPPY',25,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'0x78f6EEA7dDb66471ab90fB49803ccc0983390515',1,NULL,1,5,4,'hhh','gg','gtonic','2023-04-30 14:57:43','2023-04-30 14:57:43'),(75,'2023-04-30 15:14:32','Mint  request - dropped',NULL,NULL,NULL,NULL,NULL,NULL,6,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,-9,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2023-04-30 15:14:32','2023-04-30 15:14:32'),(76,'2023-04-30 15:15:16','Mint  request - rejected','Project Flower',100,NULL,NULL,NULL,NULL,15,NULL,NULL,NULL,NULL,'FLOWR',1050,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'0x68f44B03b36437159328109c544176CaA756aB3c',1,NULL,1,5,4,'fff','dont do it','gtonic','2023-04-30 15:15:16','2023-04-30 15:15:16'),(77,'2023-04-30 15:30:48','Mint  request - dropped',NULL,NULL,NULL,NULL,NULL,NULL,15,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,-9,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2023-04-30 15:30:48','2023-04-30 15:30:48'),(78,'2023-04-30 15:31:15','Mint  request - rejected','Project Happy',97,NULL,NULL,NULL,NULL,5,NULL,NULL,NULL,NULL,'HAPPY',1000,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'0x78f6EEA7dDb66471ab90fB49803ccc0983390515',1,NULL,1,5,4,'aa',NULL,'gtonic','2023-04-30 15:31:15','2023-04-30 15:31:15'),(79,'2023-04-30 15:40:31','Mint  request - resubmitted','Project Happy',97,NULL,NULL,NULL,NULL,5,NULL,NULL,NULL,NULL,'HAPPY',1000,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'0x78f6EEA7dDb66471ab90fB49803ccc0983390515',1,NULL,1,5,4,'aa',NULL,'grsmoc','2023-04-30 15:40:31','2023-04-30 15:40:31'),(80,'2023-04-30 15:42:30','Mint  request - accepted','Project Happy',97,NULL,NULL,NULL,NULL,5,NULL,NULL,NULL,NULL,'HAPPY',1000,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'0x78f6EEA7dDb66471ab90fB49803ccc0983390515',1,NULL,1,5,4,'aa',NULL,'gtonic','2023-04-30 15:42:30','2023-04-30 15:42:30'),(81,'2023-04-30 15:47:48','Mint  request - rejected','Project Happy',97,NULL,NULL,NULL,NULL,5,NULL,NULL,NULL,NULL,'HAPPY',1000,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'0x78f6EEA7dDb66471ab90fB49803ccc0983390515',1,NULL,1,5,4,'aa','gfsdg','grschc','2023-04-30 15:47:48','2023-04-30 15:47:48'),(82,'2023-04-30 15:50:52','Mint  request - dropped','Project Happy',97,NULL,NULL,NULL,NULL,5,NULL,NULL,NULL,NULL,'HAPPY',1000,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'0x78f6EEA7dDb66471ab90fB49803ccc0983390515',-9,NULL,1,5,4,'aa','gfsdg','grsmoc','2023-04-30 15:50:52','2023-04-30 15:50:52'),(83,'2023-04-30 15:51:31','Campaign delete request - created','Proj JJJ',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'aassasa',NULL,'JJJ',2000,'2023-01-01','2026-01-01',5,NULL,NULL,NULL,NULL,'0xdB1F7AfF47FA8F6D6c847ed6435757Fef1D84654',1,2,1,5,4,NULL,NULL,'grsmoc','2023-04-30 15:51:31','2023-04-30 15:51:31'),(84,'2023-04-30 15:53:04','Campaign delete request - rejected','Proj JJJ',NULL,NULL,NULL,NULL,129,NULL,NULL,NULL,'aassasa',NULL,'JJJ',2000,'2023-01-01','2026-01-01',5,NULL,NULL,NULL,NULL,NULL,-1,2,1,5,4,'sdf',NULL,'gtonic','2023-04-30 15:53:04','2023-04-30 15:53:04'),(85,'2023-04-30 15:53:15','Campaign delete request - dropped','Proj JJJ',NULL,NULL,NULL,NULL,129,NULL,NULL,NULL,'aassasa',NULL,'JJJ',2000,'2023-01-01','2026-01-01',5,NULL,NULL,NULL,NULL,NULL,9,2,1,5,4,'sdf',NULL,'grsmoc','2023-04-30 15:53:15','2023-04-30 15:53:15'),(86,'2023-04-30 15:54:20','Mint create request - created',NULL,88,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'AA3',50000,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'0x1cf51eA47b7F9f6d932Fc777Cd3DAf1FD20bC18D',1,0,1,5,4,NULL,NULL,'grsmoc','2023-04-30 15:54:20','2023-04-30 15:54:20'),(87,'2023-04-30 16:01:53','Campaign delete request - created','Proj JJJ',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'aassasa',NULL,'JJJ',2000,'2023-01-01','2026-01-01',5,NULL,NULL,NULL,NULL,'0xdB1F7AfF47FA8F6D6c847ed6435757Fef1D84654',1,2,1,5,4,NULL,NULL,'grsmoc','2023-04-30 16:01:53','2023-04-30 16:01:53'),(88,'2023-04-30 16:03:47','Campaign create request - created','aaaaaaa',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ssssssss',NULL,'AAA55',88888,'0001-01-01','0001-01-01',7,NULL,NULL,NULL,NULL,NULL,1,0,1,5,4,NULL,NULL,'grsmoc','2023-04-30 16:03:47','2023-04-30 16:03:47'),(89,'2023-04-30 16:04:31','Campaign update request - created','Project Demo',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'For demo2222',NULL,'DEMO1',5000,'2023-01-01','2025-02-01',7,NULL,NULL,NULL,NULL,'0x3Bae879853eA7559E80E82e50FC365f598681A86',1,1,1,5,4,NULL,NULL,'grsmoc','2023-04-30 16:04:31','2023-04-30 16:04:31'),(90,'2023-04-30 16:18:16','Transfer create request - rejected',NULL,88,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'AA3',9,NULL,NULL,NULL,NULL,NULL,'Internal campaign wallet','0x5F4606ce543351699ea66D4b432d5E695a4FDB54','0x1cf51eA47b7F9f6d932Fc777Cd3DAf1FD20bC18D',-1,0,NULL,5,4,NULL,'sdf','grsmoc','2023-04-30 16:18:16','2023-04-30 16:18:16'),(91,'2023-04-30 16:25:40','Transfer create request - created',NULL,88,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'AA3',7,NULL,NULL,NULL,NULL,NULL,'Internal campaign wallet','0x93Bb9595Db7f407B5220B5b2D78F79ff693D720E','0x1cf51eA47b7F9f6d932Fc777Cd3DAf1FD20bC18D',1,0,NULL,5,4,NULL,NULL,'grsmoc','2023-04-30 16:25:40','2023-04-30 16:25:40'),(92,'2023-04-30 16:27:50','Transfer create request - accepted',NULL,88,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'AA3',7,NULL,NULL,NULL,NULL,NULL,'Internal campaign wallet','0x93Bb9595Db7f407B5220B5b2D78F79ff693D720E','0x1cf51eA47b7F9f6d932Fc777Cd3DAf1FD20bC18D',3,0,NULL,5,4,NULL,NULL,'grsmoc','2023-04-30 16:27:50','2023-04-30 16:27:50'),(93,'2023-04-30 16:29:38','Transfer create request - rejected',NULL,88,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'AA3',7,NULL,NULL,NULL,NULL,NULL,'Internal campaign wallet','0x93Bb9595Db7f407B5220B5b2D78F79ff693D720E','0x1cf51eA47b7F9f6d932Fc777Cd3DAf1FD20bC18D',-1,0,NULL,5,4,NULL,'sdasd','grschc','2023-04-30 16:29:38','2023-04-30 16:29:38'),(94,'2023-04-30 17:06:24','Transfer create request - created',NULL,88,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'AA3',8,NULL,NULL,NULL,NULL,NULL,'Internal campaign wallet','0x6aBD8e3fb9830567162FC2f2b9ea67AFC1581EDF','0x1cf51eA47b7F9f6d932Fc777Cd3DAf1FD20bC18D',1,0,NULL,5,4,NULL,NULL,'grsmoc','2023-04-30 17:06:24','2023-04-30 17:06:24'),(95,'2023-04-30 17:07:31','Transfer create request - rejected',NULL,88,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'AA3',8,NULL,NULL,NULL,NULL,NULL,'Internal campaign wallet','0x6aBD8e3fb9830567162FC2f2b9ea67AFC1581EDF','0x1cf51eA47b7F9f6d932Fc777Cd3DAf1FD20bC18D',-1,0,NULL,5,4,'dfgs',NULL,'gtonic','2023-04-30 17:07:31','2023-04-30 17:07:31'),(96,'2023-04-30 17:08:23','Campaign update request - rejected','Project Demo',NULL,NULL,NULL,NULL,132,NULL,NULL,NULL,'For demo2222',NULL,'DEMO1',5000,'2023-01-01','2025-02-01',7,NULL,NULL,NULL,NULL,NULL,-1,1,1,5,4,'fdgf',NULL,'gtonic','2023-04-30 17:08:23','2023-04-30 17:08:23'),(97,'2023-04-30 17:39:45','Recipient create request - accepted','Company 2',NULL,NULL,NULL,NULL,10,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Bank 2','acct 2',NULL,'Wallet address 2',NULL,2,0,1,5,4,NULL,NULL,'gtonic','2023-04-30 17:39:45','2023-04-30 17:39:45'),(98,'2023-04-30 17:40:55','Recipient create request - rejected','Company 2',NULL,NULL,NULL,NULL,10,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Bank 2','acct 2',NULL,'Wallet address 2',NULL,-1,0,1,5,4,NULL,'fgsd ','grschc','2023-04-30 17:40:55','2023-04-30 17:40:55'),(99,'2023-04-30 17:45:18','Recipient create request - dropped','Company 2',NULL,NULL,NULL,NULL,10,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Bank 2','acct 2',NULL,'Wallet address 2',NULL,9,0,1,5,4,NULL,NULL,'grsmoc','2023-04-30 17:45:18','2023-04-30 17:45:18'),(100,'2023-04-30 17:46:44','Mint create request - rejected','Project AAA',88,NULL,NULL,NULL,NULL,16,NULL,NULL,NULL,NULL,'AA3',50000,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'0x1cf51eA47b7F9f6d932Fc777Cd3DAf1FD20bC18D',1,0,1,5,4,'sdf',NULL,'gtonic','2023-04-30 17:46:44','2023-04-30 17:46:44'),(101,'2023-04-30 17:48:01','Transfer create request - rejected',NULL,88,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'AA3',8,NULL,NULL,NULL,NULL,NULL,'Internal campaign wallet','0x6aBD8e3fb9830567162FC2f2b9ea67AFC1581EDF','0x1cf51eA47b7F9f6d932Fc777Cd3DAf1FD20bC18D',-1,0,NULL,5,4,'dfgs',NULL,'gtonic','2023-04-30 17:48:01','2023-04-30 17:48:01'),(102,'2023-04-30 18:22:33','Transfer create request - created',NULL,99,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'DEMO1',1,NULL,NULL,NULL,NULL,NULL,'Internal campaign wallet','0x93Bb9595Db7f407B5220B5b2D78F79ff693D720E','0x3Bae879853eA7559E80E82e50FC365f598681A86',1,0,NULL,5,4,NULL,NULL,'grsmoc','2023-04-30 18:22:33','2023-04-30 18:22:33'),(103,'2023-04-30 18:25:11','Transfer create request - rejected',NULL,99,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'DEMO1',1,NULL,NULL,NULL,NULL,NULL,'Internal campaign wallet','0x93Bb9595Db7f407B5220B5b2D78F79ff693D720E','0x3Bae879853eA7559E80E82e50FC365f598681A86',-1,0,1,5,4,'sdf',NULL,'gtonic','2023-04-30 18:25:11','2023-04-30 18:25:11'),(104,'2023-04-30 18:25:40','Transfer create request - created',NULL,91,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'AAAA',3,NULL,NULL,NULL,NULL,NULL,'Internal campaign wallet','0x75c071d279812eca1CCD8147A677Ae50132c8305','0x1E188Dc2921480f39CA27018E344F7CCf9eb4398',1,0,1,5,4,NULL,NULL,'grsmoc','2023-04-30 18:25:40','2023-04-30 18:25:40'),(105,'2023-04-30 18:25:51','Transfer create request - rejected',NULL,91,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'AAAA',3,NULL,NULL,NULL,NULL,NULL,'Internal campaign wallet','0x75c071d279812eca1CCD8147A677Ae50132c8305','0x1E188Dc2921480f39CA27018E344F7CCf9eb4398',-1,0,1,5,4,'dsfasdf',NULL,'gtonic','2023-04-30 18:25:51','2023-04-30 18:25:51');
/*!40000 ALTER TABLE `audittrails` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `campaigns`
--

DROP TABLE IF EXISTS `campaigns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `campaigns` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(45) COLLATE utf8mb3_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `tokenname` varchar(45) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `smartcontractaddress` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `startdate` date NOT NULL,
  `enddate` date NOT NULL,
  `sponsor` int NOT NULL COMMENT 'id of recipient table',
  `amount` bigint NOT NULL DEFAULT '0',
  `status` int DEFAULT NULL COMMENT '0=created pending checker, \\n1=checker ack, \\n2=approver ack\\n',
  `maker` int DEFAULT NULL,
  `checker` int DEFAULT NULL,
  `approver` int DEFAULT NULL,
  `draftcampaignid` int DEFAULT NULL COMMENT 'References the id from Campaigns_Draft table when new Campaign was created',
  `actionby` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL COMMENT 'user id',
  `actiontimedate` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name_UNIQUE` (`name`),
  KEY `id_idx` (`sponsor`),
  KEY `id_idx1` (`actionby`)
) ENGINE=InnoDB AUTO_INCREMENT=102 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `campaigns`
--

LOCK TABLES `campaigns` WRITE;
/*!40000 ALTER TABLE `campaigns` DISABLE KEYS */;
INSERT INTO `campaigns` VALUES (88,'Project AAA','whatever ab c d d ed','AA3','0x1cf51eA47b7F9f6d932Fc777Cd3DAf1FD20bC18D','2023-10-01','2024-10-01',4,1000000,NULL,NULL,NULL,NULL,NULL,'grsmoc','2023-01-18 02:46:58','2023-01-18 02:46:58','2023-01-18 04:53:04'),(90,'Project Orchid','ssss','ABCD','0xa431274af3Ef27aEd5dDa0baD193d9B660B9776d','2033-01-01','2034-01-01',6,10000,NULL,NULL,NULL,NULL,116,'grsmoc','2023-01-18 12:38:52','2023-01-18 12:38:52','2023-02-06 03:15:06'),(91,'Project Star','ss','AAAA','0x1E188Dc2921480f39CA27018E344F7CCf9eb4398','0001-01-01','0001-01-01',9,122222,NULL,NULL,NULL,NULL,NULL,'grsmoc','2023-01-18 12:40:05','2023-01-18 12:40:05','2023-01-18 12:40:31'),(97,'Project Happy','Happyss','HAPPY','0x78f6EEA7dDb66471ab90fB49803ccc0983390515','2023-01-01','2030-01-01',8,300000,NULL,NULL,NULL,NULL,120,'grschc','2023-01-28 03:28:11','2023-01-28 03:28:11','2023-04-29 16:21:56'),(98,'Project Batman','Batman rules','BAT','0xF1910EdE28e94f0b1880F19f74f7653Ad52eE04D','0001-01-01','0001-01-01',7,10000,NULL,NULL,NULL,NULL,117,'grsmoc','2023-02-06 03:12:15','2023-02-06 03:12:15','2023-02-06 03:12:15'),(99,'Project Demo','For demo','DEMO1','0x3Bae879853eA7559E80E82e50FC365f598681A86','2023-01-01','2025-02-01',7,5000,NULL,NULL,NULL,NULL,125,'grsmoc','2023-04-06 02:46:23','2023-04-06 02:46:23','2023-04-06 02:46:23'),(100,'Project Flower','Demo for orchid','FLOWR','0x68f44B03b36437159328109c544176CaA756aB3c','2023-01-01','2025-01-01',7,5000000,NULL,NULL,NULL,NULL,127,'grsmoc','2023-04-06 04:21:11','2023-04-06 04:21:11','2023-04-06 04:21:11'),(101,'Proj JJJ','aassasa','JJJ','0xdB1F7AfF47FA8F6D6c847ed6435757Fef1D84654','2023-01-01','2026-01-01',5,2000,NULL,NULL,NULL,NULL,121,'grschc','2023-04-29 16:41:12','2023-04-29 16:41:12','2023-04-29 16:41:12');
/*!40000 ALTER TABLE `campaigns` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `campaigns_drafts`
--

DROP TABLE IF EXISTS `campaigns_drafts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `campaigns_drafts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(45) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `description` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `tokenname` varchar(45) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `smartcontractaddress` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `startdate` date NOT NULL,
  `enddate` date NOT NULL,
  `sponsor` int NOT NULL COMMENT 'id of recipient table',
  `amount` bigint NOT NULL DEFAULT '0',
  `status` int DEFAULT NULL COMMENT '0=created pending checker, \\n1=checker ack, \\n2=approver ack\\n',
  `txntype` int NOT NULL DEFAULT '0' COMMENT 'default 0 - create\\n1 - edit\\n2 - delete',
  `maker` int DEFAULT NULL,
  `checker` int DEFAULT NULL,
  `approver` int DEFAULT NULL,
  `checkerComments` varchar(255) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `approverComments` varchar(255) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `actionby` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL COMMENT 'user id',
  `actiontimedate` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `approvedcampaignid` int DEFAULT NULL COMMENT 'References ID in campaigns table if users change a approved Campaign.',
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `name_changed` tinyint DEFAULT '0',
  `description_changed` tinyint DEFAULT '0',
  `startdate_changed` tinyint DEFAULT '0',
  `enddate_changed` tinyint DEFAULT '0',
  `sponsor_changed` tinyint DEFAULT '0',
  `amount_changed` tinyint DEFAULT '0',
  `name_original` varchar(45) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `description_original` varchar(255) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `startdate_original` date DEFAULT NULL,
  `enddate_original` date DEFAULT NULL,
  `sponsor_original` int DEFAULT NULL,
  `amount_original` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `id_idx` (`sponsor`),
  KEY `id_idx1` (`actionby`)
) ENGINE=InnoDB AUTO_INCREMENT=133 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `campaigns_drafts`
--

LOCK TABLES `campaigns_drafts` WRITE;
/*!40000 ALTER TABLE `campaigns_drafts` DISABLE KEYS */;
INSERT INTO `campaigns_drafts` VALUES (92,'Project test2','sss ssa saas','YYYY',NULL,'0001-01-01','0001-01-01',8,50000000,3,0,1,5,4,'Whatever xxx?',NULL,'grsmoc','2023-01-26 10:02:46',-1,'2023-01-26 10:02:46','2023-01-27 03:41:35',0,0,0,0,0,0,NULL,NULL,NULL,NULL,NULL,NULL),(105,'Project MMM','MMM','MMMMM',NULL,'0001-01-01','0001-01-01',5,12344445555,3,0,1,5,4,NULL,'a','grsmoc','2023-01-27 16:03:02',-1,'2023-01-27 16:03:02','2023-01-28 02:19:29',0,0,0,0,0,0,NULL,NULL,NULL,NULL,NULL,NULL),(106,'Project JJ','Sample test test','JJJ','0x12481419948BB5ab68C45bc0d368139888227aa4','2023-01-01','2025-02-01',7,28000000,3,1,1,5,4,'ss','s','grsmoc','2023-01-27 17:12:34',87,'2023-01-27 17:12:34','2023-01-28 03:19:33',0,0,0,0,0,0,NULL,NULL,NULL,NULL,NULL,NULL),(107,'Project Q3','q3','QQQ','0x3fd9617Fa9fB3844a47Db91ee2148636A43f2755','2022-01-01','2025-01-01',8,1000000,3,1,1,5,4,'sasa','aa','grsmoc','2023-01-28 02:28:01',89,'2023-01-28 02:28:01','2023-01-28 03:21:06',0,0,0,0,0,0,NULL,NULL,NULL,NULL,NULL,NULL),(108,'Project Happy','Happy','HAPPY',NULL,'2023-01-01','2030-01-01',8,300000,3,0,1,5,4,'asas','ss','grsmoc','2023-01-28 02:30:15',-1,'2023-01-28 02:30:15','2023-01-28 03:28:11',0,0,0,0,0,0,NULL,NULL,NULL,NULL,NULL,NULL),(111,'Project JJ','Sample test test','JJJ','0x12481419948BB5ab68C45bc0d368139888227aa4','2023-01-01','2025-02-01',7,28000000,3,2,1,5,4,'aa','dfdsf','grsmoc','2023-01-28 04:37:30',87,'2023-01-28 04:37:30','2023-01-28 16:12:56',0,0,0,0,0,0,NULL,NULL,NULL,NULL,NULL,NULL),(112,'Project Q3','q3','QQQ','0x3fd9617Fa9fB3844a47Db91ee2148636A43f2755','2022-01-01','2025-01-01',8,1000000,3,2,1,5,4,NULL,'sss','grsmoc','2023-01-28 16:14:46',89,'2023-01-28 16:14:46','2023-01-28 16:27:43',0,0,0,0,0,0,NULL,NULL,NULL,NULL,NULL,NULL),(113,'Project test test','whatever...','GGGG','0x20feb0963c63AF9B0E8E4Ae09f880D91Ae78F8f2','0001-01-01','0001-01-01',6,1000,3,2,1,5,4,NULL,NULL,'grsmoc','2023-01-28 16:19:08',92,'2023-01-28 16:19:08','2023-01-28 16:19:33',0,0,0,0,0,0,NULL,NULL,NULL,NULL,NULL,NULL),(114,'Project test2','sss ssa saas','YYYY','0x3Acef869eb0888dd8bE67BA81F055Fc01E310648','0001-01-01','0001-01-01',8,50000000,3,2,1,5,4,NULL,NULL,'grsmoc','2023-01-28 16:23:32',93,'2023-01-28 16:23:32','2023-01-28 16:24:57',0,0,0,0,0,0,NULL,NULL,NULL,NULL,NULL,NULL),(115,'Project MMM','MMM','MMMMM','0x18560327Cd2F99F3A1307F407b8454B1c51F6A07','0001-01-01','0001-01-01',5,12344445555,3,2,1,5,4,NULL,NULL,'grsmoc','2023-01-28 16:33:57',96,'2023-01-28 16:33:57','2023-01-28 16:40:40',0,0,0,0,0,0,NULL,NULL,NULL,NULL,NULL,NULL),(116,'Project Orchid','ssss','ABCD','0xa431274af3Ef27aEd5dDa0baD193d9B660B9776d','2033-01-01','2034-01-01',6,10000,3,1,1,5,4,'sdf','asa','grsmoc','2023-01-30 11:39:00',90,'2023-01-30 11:39:00','2023-02-06 03:15:06',0,0,0,0,0,0,NULL,NULL,NULL,NULL,NULL,NULL),(117,'Project Batman','Batman rules','BAT',NULL,'0001-01-01','0001-01-01',7,10000,3,0,1,5,4,NULL,NULL,'grsmoc','2023-02-06 03:11:28',-1,'2023-02-06 03:11:28','2023-02-06 03:12:15',0,0,0,0,0,0,NULL,NULL,NULL,NULL,NULL,NULL),(118,'Project Starss','ss','AAAA','0x1E188Dc2921480f39CA27018E344F7CCf9eb4398','0001-01-01','0001-01-01',9,122222,9,1,1,5,4,'sdfa',NULL,'grsmoc','2023-02-06 08:36:36',91,'2023-02-06 08:36:36','2023-02-07 10:12:11',1,0,0,0,0,0,NULL,NULL,NULL,NULL,NULL,NULL),(119,'Project Orchid','ssss','ABCD','0xa431274af3Ef27aEd5dDa0baD193d9B660B9776d','2033-01-01','2034-01-01',6,10000,9,2,1,5,4,NULL,'a','grsmoc','2023-02-06 08:38:15',90,'2023-02-06 08:38:15','2023-04-29 16:45:45',0,0,0,0,0,0,NULL,NULL,NULL,NULL,NULL,NULL),(120,'Project Happy','Happyss','HAPPY','0x78f6EEA7dDb66471ab90fB49803ccc0983390515','2023-01-01','2030-01-01',8,300000,3,1,1,5,4,NULL,NULL,'grsmoc','2023-02-06 08:38:49',97,'2023-02-06 08:38:49','2023-04-29 16:21:56',0,0,0,0,0,0,NULL,NULL,NULL,NULL,NULL,NULL),(121,'Proj JJJ','aassasa','JJJ',NULL,'2023-01-01','2026-01-01',5,2000,3,0,1,5,4,'aaa',NULL,'grsmoc','2023-02-06 08:40:24',-1,'2023-02-06 08:40:24','2023-04-29 16:41:12',0,0,0,0,0,0,NULL,NULL,NULL,NULL,NULL,NULL),(123,'Project Batman','Batman rules','BAT','0xF1910EdE28e94f0b1880F19f74f7653Ad52eE04D','0001-01-01','2050-01-01',7,10000,9,1,1,5,4,'dfgsfg',NULL,'grsmoc','2023-02-07 08:13:56',98,'2023-02-07 08:13:56','2023-02-07 11:30:52',0,0,0,1,0,0,'','',NULL,'0001-01-01',-1,-1),(124,'Project Batman','Batman rules','BAT','0xF1910EdE28e94f0b1880F19f74f7653Ad52eE04D','2022-01-01','2025-01-01',7,10000,9,1,1,5,4,'nope',NULL,'grsmoc','2023-02-07 11:33:09',98,'2023-02-07 11:33:09','2023-04-28 15:26:34',0,0,1,1,0,0,NULL,NULL,'0001-01-01','0001-01-01',-1,-1),(125,'Project Demo','For demo','DEMO1',NULL,'2023-01-01','2025-02-01',7,5000,3,0,1,5,4,NULL,'change total supply to 5000','grsmoc','2023-04-06 02:37:17',-1,'2023-04-06 02:37:17','2023-04-06 02:46:23',0,0,0,0,0,0,NULL,NULL,NULL,NULL,NULL,NULL),(127,'Project Flower','Demo for orchid','FLOWR',NULL,'2023-01-01','2025-01-01',7,5000000,3,0,1,5,4,'change supply to 5000000',NULL,'grsmoc','2023-04-06 04:19:29',-1,'2023-04-06 04:19:29','2023-04-06 04:21:11',0,0,0,0,0,0,NULL,NULL,NULL,NULL,NULL,NULL),(128,'camp1','ssdf','CAMP1',NULL,'2024-01-01','2025-01-01',10,1000000,9,0,1,5,4,'sdasd','aa','grsmoc','2023-04-29 17:16:27',-1,'2023-04-29 17:16:27','2023-04-29 17:36:52',0,0,0,0,0,0,NULL,NULL,NULL,NULL,NULL,NULL),(129,'Proj JJJ','aassasa','JJJ','0xdB1F7AfF47FA8F6D6c847ed6435757Fef1D84654','2023-01-01','2026-01-01',5,2000,9,2,1,5,4,'sdf',NULL,'grsmoc','2023-04-30 15:51:31',101,'2023-04-30 15:51:31','2023-04-30 15:53:15',0,0,0,0,0,0,NULL,NULL,NULL,NULL,NULL,NULL),(130,'Proj JJJ','aassasa','JJJ','0xdB1F7AfF47FA8F6D6c847ed6435757Fef1D84654','2023-01-01','2026-01-01',5,2000,1,2,1,5,4,NULL,NULL,'grsmoc','2023-04-30 16:01:53',101,'2023-04-30 16:01:53','2023-04-30 16:01:53',0,0,0,0,0,0,NULL,NULL,NULL,NULL,NULL,NULL),(131,'aaaaaaa','ssssssss','AAA55',NULL,'0001-01-01','0001-01-01',7,88888,1,0,1,5,4,NULL,NULL,'grsmoc','2023-04-30 16:03:47',-1,'2023-04-30 16:03:47','2023-04-30 16:03:47',0,0,0,0,0,0,NULL,NULL,NULL,NULL,NULL,NULL),(132,'Project Demo','For demo2222','DEMO1','0x3Bae879853eA7559E80E82e50FC365f598681A86','2023-01-01','2025-02-01',7,5000,-1,1,1,5,4,'fdgf',NULL,'grsmoc','2023-04-30 16:04:31',99,'2023-04-30 16:04:31','2023-04-30 17:08:23',0,1,0,0,0,0,NULL,'For demo',NULL,NULL,-1,-1);
/*!40000 ALTER TABLE `campaigns_drafts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mints`
--

DROP TABLE IF EXISTS `mints`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mints` (
  `id` int NOT NULL AUTO_INCREMENT,
  `campaignId` int DEFAULT NULL,
  `comments` varchar(255) DEFAULT NULL,
  `mintAmount` double DEFAULT NULL,
  `status` int DEFAULT NULL,
  `actionby` varchar(255) DEFAULT NULL,
  `actiontimedate` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `maker` int DEFAULT NULL,
  `checker` int DEFAULT NULL,
  `approver` int DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=66 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mints`
--

LOCK TABLES `mints` WRITE;
/*!40000 ALTER TABLE `mints` DISABLE KEYS */;
INSERT INTO `mints` VALUES (38,87,NULL,100,NULL,'grsmoc','2023-01-18 02:56:44',NULL,NULL,NULL,'2023-01-30 00:43:56','2023-01-30 00:43:56'),(40,88,NULL,1000,NULL,'grsmoc','2023-01-18 02:54:22',NULL,NULL,NULL,'2023-01-18 02:54:22','2023-01-18 02:54:22'),(41,88,NULL,8,NULL,'grsmoc','2023-01-18 02:55:24',NULL,NULL,NULL,'2023-01-18 02:55:24','2023-01-18 02:55:24'),(42,88,NULL,12,NULL,'grsmoc','2023-01-18 02:56:44',NULL,NULL,NULL,'2023-01-18 02:56:44','2023-01-18 02:56:44'),(60,88,NULL,101,NULL,'grsmoc','2023-01-31 10:51:57',NULL,NULL,NULL,'2023-01-31 10:51:57','2023-01-31 10:51:57'),(61,88,NULL,101,NULL,'grsmoc','2023-01-31 10:53:50',NULL,NULL,NULL,'2023-01-31 10:53:50','2023-01-31 10:53:50'),(62,88,NULL,101,NULL,'grsmoc','2023-01-31 10:54:34',NULL,NULL,NULL,'2023-01-31 10:54:34','2023-01-31 10:54:34'),(63,97,NULL,1000,NULL,'grsmoc','2023-03-28 13:40:15',NULL,NULL,NULL,'2023-03-28 13:40:15','2023-03-28 13:40:15'),(64,91,NULL,1000,NULL,'grsmoc','2023-03-28 16:11:54',NULL,NULL,NULL,'2023-03-28 16:11:54','2023-03-28 16:11:54'),(65,99,NULL,10,NULL,'grsmoc','2023-04-06 02:50:14',NULL,NULL,NULL,'2023-04-06 02:50:14','2023-04-06 02:50:14');
/*!40000 ALTER TABLE `mints` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mints_drafts`
--

DROP TABLE IF EXISTS `mints_drafts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mints_drafts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `campaignId` int DEFAULT NULL,
  `comments` varchar(255) DEFAULT NULL,
  `mintAmount` double DEFAULT NULL,
  `txntype` int DEFAULT '0' COMMENT '0 - create,  1-edit,  2-delete',
  `status` int DEFAULT NULL,
  `actionby` varchar(255) DEFAULT NULL,
  `actiontimedate` datetime DEFAULT CURRENT_TIMESTAMP,
  `maker` int DEFAULT NULL,
  `checker` int DEFAULT NULL,
  `approver` int DEFAULT NULL,
  `checkerComments` varchar(255) DEFAULT NULL,
  `approverComments` varchar(255) DEFAULT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mints_drafts`
--

LOCK TABLES `mints_drafts` WRITE;
/*!40000 ALTER TABLE `mints_drafts` DISABLE KEYS */;
INSERT INTO `mints_drafts` VALUES (1,88,NULL,101,0,3,'grsmoc','2023-01-30 11:17:06',1,5,4,'qqq','bggg','2023-01-30 11:17:06','2023-01-31 10:54:34'),(2,98,NULL,1000,0,1,'gtonic','2023-02-06 03:20:29',5,2,4,NULL,NULL,'2023-02-06 03:20:29','2023-02-06 03:20:29'),(3,97,NULL,1000,0,3,'grsmoc','2023-02-06 08:34:30',1,5,4,NULL,NULL,'2023-02-06 08:34:30','2023-03-28 13:40:15'),(4,90,NULL,2000,0,1,'grsmoc','2023-03-28 15:26:07',1,5,4,NULL,NULL,'2023-03-28 15:26:07','2023-03-28 15:26:07'),(5,97,NULL,1000,0,9,'grsmoc','2023-03-28 15:29:31',1,5,4,'aa','gfsdg','2023-03-28 15:29:31','2023-04-30 15:50:52'),(6,97,NULL,25,0,9,'grsmoc','2023-03-28 15:35:38',1,5,4,'hhh','gg','2023-03-28 15:35:38','2023-04-30 15:14:32'),(13,91,NULL,1000,0,3,'grsmoc','2023-03-28 15:55:11',1,5,4,NULL,NULL,'2023-03-28 15:55:11','2023-03-28 16:11:54'),(14,99,NULL,10,0,3,'grsmoc','2023-04-06 02:47:41',1,5,4,'reduce mint to 10',NULL,'2023-04-06 02:47:41','2023-04-06 02:50:14'),(15,100,NULL,1050,0,9,'grsmoc','2023-04-06 04:22:19',1,5,4,'fff','dont do it','2023-04-06 04:22:19','2023-04-30 15:30:48'),(16,88,NULL,50000,0,-1,'grsmoc','2023-04-30 15:54:20',1,5,4,'sdf',NULL,'2023-04-30 15:54:20','2023-04-30 17:46:44');
/*!40000 ALTER TABLE `mints_drafts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `opsroles`
--

DROP TABLE IF EXISTS `opsroles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `opsroles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL COMMENT '1. maker\n2. checker\n3. approver',
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`),
  UNIQUE KEY `name_UNIQUE` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `opsroles`
--

LOCK TABLES `opsroles` WRITE;
/*!40000 ALTER TABLE `opsroles` DISABLE KEYS */;
INSERT INTO `opsroles` VALUES (1,'maker','2023-01-04 09:04:53','2023-01-04 09:04:53'),(2,'checker','2023-01-04 09:04:53','2023-01-04 09:04:53'),(3,'approver','2023-01-04 09:04:53','2023-01-04 09:04:53');
/*!40000 ALTER TABLE `opsroles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `recipients`
--

DROP TABLE IF EXISTS `recipients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `recipients` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb3_unicode_ci NOT NULL,
  `walletaddress` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `bank` varchar(255) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `bankaccount` varchar(45) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `type` varchar(45) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `status` int DEFAULT NULL,
  `actionby` varchar(255) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `actiontimedate` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `maker` int DEFAULT NULL,
  `checker` int DEFAULT NULL,
  `approver` int DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name_UNIQUE` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recipients`
--

LOCK TABLES `recipients` WRITE;
/*!40000 ALTER TABLE `recipients` DISABLE KEYS */;
INSERT INTO `recipients` VALUES (4,'SuperMart','0x6aBD8e3fb9830567162FC2f2b9ea67AFC1581EDF','DBS','111-222-333','1',NULL,NULL,'2023-01-16 02:25:40',NULL,NULL,NULL,NULL,NULL),(5,'247 Eleven','0x75c071d279812eca1CCD8147A677Ae50132c8305','UOB','345-654-311','1',NULL,NULL,'2023-01-16 02:25:40',NULL,NULL,NULL,NULL,NULL),(6,'Super Cold Storage','0x29E572f8F0819E5A0B3Fe21c62E4f14bcadaFE25','OCBC','999-716-567','1',NULL,NULL,'2023-01-16 02:25:40',NULL,NULL,NULL,NULL,NULL),(7,'SSG','0xa7E73A44FE92f6F9518CE0298E90cC5FceE804e9','UOB','654-826-997','2',NULL,NULL,'2023-01-16 02:25:40',NULL,NULL,NULL,NULL,NULL),(8,'CDC','0x357f4976bD4567fCb34FC637Ec5d41A0140551D3','OCBC','872-926-012','1',NULL,NULL,'2023-01-16 02:25:40',NULL,NULL,NULL,NULL,NULL),(9,'My Schoolz','0x93Bb9595Db7f407B5220B5b2D78F79ff693D720E','DBS','436-764-129','1',NULL,NULL,'2023-01-16 02:25:40',NULL,NULL,NULL,NULL,NULL),(10,'LLL','0x5F4606ce543351699ea66D4b432d5E695a4FDB54','Haha','123','1',NULL,NULL,'2023-04-17 03:51:42',NULL,NULL,NULL,'2023-04-17 03:51:42','2023-04-17 03:51:42'),(15,'new recipient','new wallet','new bank','new bank account',NULL,NULL,'grschc','2023-04-29 15:52:01',NULL,NULL,NULL,'2023-04-29 15:52:01','2023-04-29 15:52:01');
/*!40000 ALTER TABLE `recipients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `recipients_drafts`
--

DROP TABLE IF EXISTS `recipients_drafts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `recipients_drafts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `walletaddress` varchar(255) DEFAULT NULL,
  `bank` varchar(255) DEFAULT NULL,
  `bankaccount` varchar(255) DEFAULT NULL,
  `type` varchar(255) DEFAULT NULL,
  `txntype` int DEFAULT '0' COMMENT '0 - create,  1-edit,  2-delete',
  `status` int DEFAULT NULL,
  `actionby` varchar(255) DEFAULT NULL,
  `actiontimedate` datetime DEFAULT CURRENT_TIMESTAMP,
  `approvedrecipientid` int DEFAULT NULL,
  `maker` int DEFAULT NULL,
  `checker` int DEFAULT NULL,
  `approver` int DEFAULT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recipients_drafts`
--

LOCK TABLES `recipients_drafts` WRITE;
/*!40000 ALTER TABLE `recipients_drafts` DISABLE KEYS */;
INSERT INTO `recipients_drafts` VALUES (6,'ttt','yyy','uuu','iii',NULL,0,3,'grsmoc','2023-04-28 11:16:51',NULL,1,5,4,'2023-04-28 11:16:51','2023-04-29 15:07:24'),(7,'aa','ss','dd','fff',NULL,0,3,'grsmoc','2023-04-28 11:26:48',NULL,1,5,4,'2023-04-28 11:26:48','2023-04-29 15:08:46'),(8,'gg','hh','jj','lll',NULL,0,3,'grsmoc','2023-04-28 11:32:14',NULL,1,5,4,'2023-04-28 11:32:14','2023-04-28 15:07:59'),(9,'new recipient','new wallet','new bank','new bank account',NULL,0,3,'grsmoc','2023-04-29 15:10:09',NULL,1,5,4,'2023-04-29 15:10:09','2023-04-29 15:52:01'),(10,'Company 2','Wallet address 2','Bank 2','acct 2',NULL,0,-1,'grsmoc','2023-04-30 17:31:47',NULL,1,5,4,'2023-04-30 17:31:47','2023-04-30 17:45:18');
/*!40000 ALTER TABLE `recipients_drafts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` int NOT NULL,
  `name` varchar(255) COLLATE utf8mb3_unicode_ci NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'user','2022-12-28 15:09:58','2022-12-28 15:09:58'),(2,'moderator','2022-12-28 15:10:18','2022-12-28 15:10:18'),(3,'admin','2022-12-28 15:10:29','2022-12-28 15:10:29');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `settings`
--

DROP TABLE IF EXISTS `settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `settings` (
  `privateKey` varchar(255) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `publicKey` varchar(255) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `walletaddress` varchar(255) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `web3APIkey` varchar(255) COLLATE utf8mb3_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings`
--

LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
/*!40000 ALTER TABLE `settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transfers`
--

DROP TABLE IF EXISTS `transfers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transfers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `comments` varchar(255) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `sourcewallet` varchar(255) COLLATE utf8mb3_unicode_ci NOT NULL,
  `recipientwallet` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `smartcontractaddress` varchar(255) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `transferAmount` double DEFAULT NULL,
  `campaignId` int DEFAULT NULL COMMENT 'refers to id from campaigns table',
  `recipientId` int DEFAULT NULL COMMENT 'refers to id from recipients table',
  `tokenname` varchar(45) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `actionby` varchar(255) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `actiontimedate` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` int DEFAULT NULL,
  `maker` int DEFAULT NULL,
  `checker` int DEFAULT NULL,
  `approver` int DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transfers`
--

LOCK TABLES `transfers` WRITE;
/*!40000 ALTER TABLE `transfers` DISABLE KEYS */;
INSERT INTO `transfers` VALUES (1,NULL,'0xf72e9F9a9a5F0e031d2507692b884b4444133688','0x6aBD8e3fb9830567162FC2f2b9ea67AFC1581EDF',NULL,2,86,NULL,NULL,'grsmoc','2023-01-16 09:22:10',NULL,NULL,NULL,NULL,'2023-01-16 09:22:10','2023-01-16 09:22:10'),(2,NULL,'0xf72e9F9a9a5F0e031d2507692b884b4444133688','0x357f4976bD4567fCb34FC637Ec5d41A0140551D3',NULL,3,86,NULL,NULL,'grsmoc','2023-01-16 09:32:26',NULL,NULL,NULL,NULL,'2023-01-16 09:32:26','2023-01-16 09:32:26'),(3,NULL,'0xf72e9F9a9a5F0e031d2507692b884b4444133688','0x6aBD8e3fb9830567162FC2f2b9ea67AFC1581EDF',NULL,8,87,NULL,NULL,'grsmoc','2023-01-16 11:16:50',NULL,NULL,NULL,NULL,'2023-01-16 11:16:50','2023-01-16 11:16:50'),(4,NULL,'0xf72e9F9a9a5F0e031d2507692b884b4444133688','0x6aBD8e3fb9830567162FC2f2b9ea67AFC1581EDF',NULL,2,87,NULL,NULL,'grsmoc','2023-01-18 03:56:24',NULL,NULL,NULL,NULL,'2023-01-18 03:56:24','2023-01-18 03:56:24'),(5,NULL,'0xf72e9F9a9a5F0e031d2507692b884b4444133688','0x6aBD8e3fb9830567162FC2f2b9ea67AFC1581EDF',NULL,4,87,NULL,NULL,'grsmoc','2023-01-18 11:21:38',NULL,NULL,NULL,NULL,'2023-01-18 11:21:38','2023-01-18 11:21:38'),(6,NULL,'0xf72e9F9a9a5F0e031d2507692b884b4444133688','0x6aBD8e3fb9830567162FC2f2b9ea67AFC1581EDF',NULL,88,87,NULL,NULL,'grsmoc','2023-01-18 11:41:53',NULL,NULL,NULL,NULL,'2023-01-18 11:41:53','2023-01-18 11:41:53'),(7,NULL,'0xf72e9F9a9a5F0e031d2507692b884b4444133688','0x6aBD8e3fb9830567162FC2f2b9ea67AFC1581EDF',NULL,10000,87,NULL,NULL,'grsmoc','2023-01-18 11:52:26',NULL,NULL,NULL,NULL,'2023-01-18 11:52:26','2023-01-18 11:52:26'),(8,NULL,'0xf72e9F9a9a5F0e031d2507692b884b4444133688','0x6aBD8e3fb9830567162FC2f2b9ea67AFC1581EDF',NULL,1000,87,NULL,NULL,'grsmoc','2023-01-18 12:02:37',NULL,NULL,NULL,NULL,'2023-01-18 12:02:37','2023-01-18 12:02:37'),(9,NULL,'0xf72e9F9a9a5F0e031d2507692b884b4444133688','0x6aBD8e3fb9830567162FC2f2b9ea67AFC1581EDF',NULL,0.5,87,NULL,NULL,'grsmoc','2023-01-18 12:42:50',NULL,NULL,NULL,NULL,'2023-01-18 12:42:50','2023-01-18 12:42:50'),(10,NULL,'0xf72e9F9a9a5F0e031d2507692b884b4444133688','0xa7E73A44FE92f6F9518CE0298E90cC5FceE804e9',NULL,1000,88,NULL,NULL,'grsmoc','2023-03-25 13:59:16',NULL,NULL,NULL,NULL,'2023-03-25 13:59:16','2023-03-25 13:59:16'),(11,NULL,'0xf72e9F9a9a5F0e031d2507692b884b4444133688','0x29E572f8F0819E5A0B3Fe21c62E4f14bcadaFE25',NULL,11,88,NULL,NULL,'grsmoc','2023-03-25 15:51:06',NULL,NULL,NULL,NULL,'2023-03-25 15:51:06','2023-03-25 15:51:06'),(12,NULL,'0xf72e9F9a9a5F0e031d2507692b884b4444133688','0x6aBD8e3fb9830567162FC2f2b9ea67AFC1581EDF',NULL,2,88,NULL,NULL,'grsmoc','2023-03-27 16:03:23',NULL,NULL,NULL,NULL,'2023-03-27 16:03:23','2023-03-27 16:03:23'),(13,NULL,'0xf72e9F9a9a5F0e031d2507692b884b4444133688','0x93Bb9595Db7f407B5220B5b2D78F79ff693D720E',NULL,1,88,NULL,NULL,'grsmoc','2023-03-27 16:33:04',NULL,NULL,NULL,NULL,'2023-03-27 16:33:04','2023-03-27 16:33:04'),(14,NULL,'0xf72e9F9a9a5F0e031d2507692b884b4444133688','0x75c071d279812eca1CCD8147A677Ae50132c8305',NULL,12,97,NULL,NULL,'grsmoc','2023-03-28 13:42:09',NULL,NULL,NULL,NULL,'2023-03-28 13:42:09','2023-03-28 13:42:09'),(15,NULL,'0xf72e9F9a9a5F0e031d2507692b884b4444133688','0x93Bb9595Db7f407B5220B5b2D78F79ff693D720E',NULL,2,99,NULL,NULL,'grsmoc','2023-04-06 02:54:06',NULL,NULL,NULL,NULL,'2023-04-06 02:54:06','2023-04-06 02:54:06'),(16,NULL,'0xf72e9F9a9a5F0e031d2507692b884b4444133688','0x5F4606ce543351699ea66D4b432d5E695a4FDB54',NULL,10,88,10,NULL,'grsmoc','2023-04-17 05:48:04',NULL,NULL,NULL,NULL,'2023-04-17 05:48:04','2023-04-17 05:48:04'),(17,NULL,'0xf72e9F9a9a5F0e031d2507692b884b4444133688','0x6aBD8e3fb9830567162FC2f2b9ea67AFC1581EDF',NULL,1,88,4,NULL,'grsmoc','2023-04-17 09:08:35',NULL,NULL,NULL,NULL,'2023-04-17 09:08:35','2023-04-17 09:08:35'),(18,NULL,'0xf72e9F9a9a5F0e031d2507692b884b4444133688','0x6aBD8e3fb9830567162FC2f2b9ea67AFC1581EDF',NULL,1,88,NULL,NULL,'grsmoc','2023-04-17 09:13:45',NULL,NULL,NULL,NULL,'2023-04-17 09:13:45','2023-04-17 09:13:45');
/*!40000 ALTER TABLE `transfers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transfers_drafts`
--

DROP TABLE IF EXISTS `transfers_drafts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transfers_drafts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `campaignId` int DEFAULT NULL COMMENT 'refers to id from campaigns table',
  `comments` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `sourcewallet` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `recipientwallet` varchar(255) COLLATE utf8mb3_unicode_ci NOT NULL,
  `smartcontractaddress` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `transferAmount` double DEFAULT NULL,
  `recipientId` int DEFAULT NULL COMMENT 'refers to id from recipients table',
  `tokenname` varchar(45) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `txntype` int DEFAULT '0' COMMENT '0 - create,  1-edit,  2-delete',
  `actionby` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `actiontimedate` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` int DEFAULT NULL,
  `maker` int DEFAULT NULL,
  `checker` int DEFAULT NULL,
  `approver` int DEFAULT NULL,
  `checkerComments` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `approverComments` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transfers_drafts`
--

LOCK TABLES `transfers_drafts` WRITE;
/*!40000 ALTER TABLE `transfers_drafts` DISABLE KEYS */;
INSERT INTO `transfers_drafts` VALUES (14,88,NULL,'our campaign wallet','0x6aBD8e3fb9830567162FC2f2b9ea67AFC1581EDF','0x1cf51eA47b7F9f6d932Fc777Cd3DAf1FD20bC18D',2,4,'AA3',0,'grsmoc','2023-03-26 14:56:49',3,1,5,4,'bbb','aaa','2023-03-26 14:56:49','2023-03-27 16:03:23'),(15,88,NULL,'our campaign wallet','0x93Bb9595Db7f407B5220B5b2D78F79ff693D720E','0x1cf51eA47b7F9f6d932Fc777Cd3DAf1FD20bC18D',1,9,'AA3',0,'grsmoc','2023-03-27 16:32:03',3,1,5,4,NULL,NULL,'2023-03-27 16:32:03','2023-03-27 16:33:04'),(16,97,NULL,'our campaign wallet','0x75c071d279812eca1CCD8147A677Ae50132c8305','0x78f6EEA7dDb66471ab90fB49803ccc0983390515',12,5,'HAPPY',0,'grsmoc','2023-03-28 13:41:18',3,1,5,4,NULL,NULL,'2023-03-28 13:41:18','2023-03-28 13:42:09'),(17,99,NULL,'our campaign wallet','0x93Bb9595Db7f407B5220B5b2D78F79ff693D720E','0x3Bae879853eA7559E80E82e50FC365f598681A86',2,9,'DEMO1',0,'grsmoc','2023-04-06 02:52:55',3,1,5,4,NULL,NULL,'2023-04-06 02:52:55','2023-04-06 02:54:06'),(18,88,NULL,'our campaign wallet','0x5F4606ce543351699ea66D4b432d5E695a4FDB54','0x1cf51eA47b7F9f6d932Fc777Cd3DAf1FD20bC18D',9,10,'AA3',0,'grsmoc','2023-04-17 07:43:00',-1,1,5,4,NULL,'sdf','2023-04-17 07:43:00','2023-04-30 16:18:16'),(19,88,NULL,'our campaign wallet','0x6aBD8e3fb9830567162FC2f2b9ea67AFC1581EDF','0x1cf51eA47b7F9f6d932Fc777Cd3DAf1FD20bC18D',1,4,'AA3',0,'grsmoc','2023-04-17 09:10:29',3,1,5,4,NULL,NULL,'2023-04-17 09:10:29','2023-04-17 09:13:45'),(20,88,NULL,'Internal campaign wallet','0x93Bb9595Db7f407B5220B5b2D78F79ff693D720E','0x1cf51eA47b7F9f6d932Fc777Cd3DAf1FD20bC18D',7,9,'AA3',0,'grsmoc','2023-04-30 16:25:40',-1,1,5,4,NULL,'sdasd','2023-04-30 16:25:40','2023-04-30 16:29:38'),(21,88,NULL,'Internal campaign wallet','0x6aBD8e3fb9830567162FC2f2b9ea67AFC1581EDF','0x1cf51eA47b7F9f6d932Fc777Cd3DAf1FD20bC18D',8,4,'AA3',0,'grsmoc','2023-04-30 17:06:24',2,1,5,4,'dfgs',NULL,'2023-04-30 17:06:24','2023-04-30 17:48:01'),(22,99,NULL,'Internal campaign wallet','0x93Bb9595Db7f407B5220B5b2D78F79ff693D720E','0x3Bae879853eA7559E80E82e50FC365f598681A86',1,9,'DEMO1',0,'grsmoc','2023-04-30 18:22:33',-1,1,5,4,'sdf',NULL,'2023-04-30 18:22:33','2023-04-30 18:25:11'),(23,91,NULL,'Internal campaign wallet','0x75c071d279812eca1CCD8147A677Ae50132c8305','0x1E188Dc2921480f39CA27018E344F7CCf9eb4398',3,5,'AAAA',0,'grsmoc','2023-04-30 18:25:40',-1,1,5,4,'dsfasdf',NULL,'2023-04-30 18:25:40','2023-04-30 18:25:51');
/*!40000 ALTER TABLE `transfers_drafts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_opsroles`
--

DROP TABLE IF EXISTS `user_opsroles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_opsroles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `opsroleId` int NOT NULL,
  `transactionType` varchar(45) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=173 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_opsroles`
--

LOCK TABLES `user_opsroles` WRITE;
/*!40000 ALTER TABLE `user_opsroles` DISABLE KEYS */;
INSERT INTO `user_opsroles` VALUES (1,1,1,'campaign','2023-01-31 01:16:21','2023-01-31 01:16:21'),(2,1,2,'campaign','2023-01-31 01:16:21','2023-01-31 01:16:21'),(3,3,2,'campaign','2023-01-31 01:16:21','2023-01-31 01:16:21'),(4,5,2,'campaign','2023-01-31 01:16:21','2023-01-31 01:16:21'),(5,4,3,'campaign','2023-01-31 01:16:21','2023-01-31 01:16:21'),(6,2,1,'campaign','2023-01-31 01:16:21','2023-01-31 01:16:21'),(7,2,2,'campaign','2023-01-31 01:16:21','2023-01-31 01:16:21'),(8,6,3,'campaign','2023-01-31 01:16:21','2023-01-31 01:16:21'),(9,1,1,'mint','2023-01-31 01:16:21','2023-01-31 01:16:21'),(10,2,2,'mint','2023-01-31 01:16:21','2023-01-31 01:16:21'),(11,5,2,'mint','2023-01-31 01:16:21','2023-01-31 01:16:21'),(12,4,3,'mint','2023-01-31 01:16:21','2023-01-31 01:16:21'),(13,5,1,'mint','2023-02-06 03:17:11','2023-02-06 03:17:11'),(14,2,3,'mint','2023-02-06 07:29:18','2023-02-06 07:29:18'),(150,1,1,'transfer','2023-02-26 15:07:14','2023-02-26 15:07:14'),(152,1,2,'transfer','2023-02-26 15:08:34','2023-02-26 15:08:34'),(153,3,2,'transfer','2023-02-26 15:08:34','2023-02-26 15:08:34'),(154,5,2,'transfer','2023-02-26 15:08:34','2023-02-26 15:08:34'),(155,4,3,'transfer','2023-02-26 15:08:34','2023-02-26 15:08:34'),(156,2,1,'transfer','2023-02-26 15:08:34','2023-02-26 15:08:34'),(157,2,2,'transfer','2023-02-26 15:08:34','2023-02-26 15:08:34'),(158,6,3,'transfer','2023-02-26 15:08:34','2023-02-26 15:08:34'),(159,1,1,'withdraw','2023-03-01 14:37:44','2023-03-01 14:37:44'),(160,2,2,'withdraw','2023-03-01 14:37:44','2023-03-01 14:37:44'),(161,5,2,'withdraw','2023-03-01 14:37:44','2023-03-01 14:37:44'),(162,4,3,'withdraw','2023-03-01 14:37:44','2023-03-01 14:37:44'),(163,5,1,'withdraw','2023-03-01 14:37:44','2023-03-01 14:37:44'),(164,2,3,'withdraw','2023-03-01 14:37:44','2023-03-01 14:37:44'),(165,1,2,'withdraw','2023-03-01 14:40:21','2023-03-01 14:40:21'),(166,1,1,'recipient','2023-04-11 17:27:18','2023-04-11 17:27:18'),(167,2,2,'recipient','2023-04-11 17:27:18','2023-04-11 17:27:18'),(168,5,2,'recipient','2023-04-11 17:27:18','2023-04-11 17:27:18'),(169,4,3,'recipient','2023-04-11 17:27:18','2023-04-11 17:27:18'),(170,5,1,'recipient','2023-04-11 17:27:18','2023-04-11 17:27:18'),(171,2,3,'recipient','2023-04-11 17:27:18','2023-04-11 17:27:18'),(172,1,2,'recipient','2023-04-11 17:27:18','2023-04-11 17:27:18');
/*!40000 ALTER TABLE `user_opsroles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_roles`
--

DROP TABLE IF EXISTS `user_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_roles` (
  `roleId` int NOT NULL,
  `userId` int NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` varchar(45) COLLATE utf8mb3_unicode_ci NOT NULL,
  PRIMARY KEY (`roleId`,`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_roles`
--

LOCK TABLES `user_roles` WRITE;
/*!40000 ALTER TABLE `user_roles` DISABLE KEYS */;
INSERT INTO `user_roles` VALUES (1,1,'2022-12-28 08:24:28','2022-12-28 08:24:28'),(1,2,'2022-12-28 09:55:45','2022-12-28 09:55:45'),(1,3,'2022-12-28 09:57:08','2022-12-28 09:57:08'),(1,4,'2022-12-28 09:58:01','2022-12-28 09:58:01'),(1,5,'2022-12-28 09:58:54','2022-12-28 09:58:54'),(1,6,'2023-01-05 07:42:36','2023-01-05 07:42:36');
/*!40000 ALTER TABLE `user_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(255) COLLATE utf8mb3_unicode_ci NOT NULL,
  `fullname` varchar(255) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb3_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb3_unicode_ci NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `lastlogin` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'grsmoc','Morgan Chia','chia.morgan@uobgroup.com','$2a$08$4UhiVdqkJ8sd82gXtk7t5ukuHNHlrpLwwXipY.9.UHDJPlFe2853u','2022-12-28 00:24:28','2023-04-12 06:37:38','2023-04-12 06:37:38'),(2,'gtolit','Lyselle Tan L C','lyselle.tanlc@uobgroup.com','$2a$08$i45Yl2KbQHIrWIXImk9IGewW4TrroLc5MZ.iafAOL3ip.jqm9UZhy','2022-12-28 01:55:45','2023-01-26 16:17:43','2023-01-26 16:17:43'),(3,'pqacho','CK Ong','ong.chunkiat@uobgroup.com','$08$3oNXyrIb5F.nOWKSlm4uhugphJp0JVd3HqHmM4jtQcXYOIQz9OrUe','2022-12-28 01:57:08','2022-12-28 01:57:08',NULL),(4,'grschc','CP Chua','chua.chekping@uobgroup.com','$2a$08$eydX1UJ7HNXJh4bayyba7eDQ1D7ItV2geE72YvIhN8uz0daEs1eua','2022-12-28 01:58:01','2023-02-28 13:57:00','2023-02-28 13:57:00'),(5,'gtonic','N Chogle','nikhil.chogle@uobgroup.com','$2a$08$eQpLLvwQt.gRyxXT0yB.beLllRvNWxfL/o0g0u155r2INMlrrW6JW','2022-12-28 01:58:54','2023-02-28 13:54:51','2023-02-28 13:54:51'),(6,'gibgym','Goh Y M','goh.yumin@uobgroup.com','$2a$08$Cd5JIuKu3eznQkAvqKA51eh7ipsjlrAcKrthZNUBvJdWwgavUPLKi','2023-01-05 07:42:36','2023-01-27 07:26:05','2023-01-27 07:26:05');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2023-05-01  2:27:41
