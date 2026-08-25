-- ============================================================
-- Subject Feature Migration Script
-- ============================================================
-- This script adds the subjects table and modifies the modules table
-- to support the new Course -> Subject -> Module hierarchy
-- ============================================================

-- Step 1: Create the subjects table
-- ============================================================
CREATE TABLE IF NOT EXISTS `subjects` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `courseId` VARCHAR(36) NOT NULL,
  `name` VARCHAR(500) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `sequenceOrder` INT NOT NULL,
  `isActive` TINYINT(1) NOT NULL DEFAULT 1,
  `thumbnailUrl` VARCHAR(500) DEFAULT NULL,
  `totalModules` INT NOT NULL DEFAULT 0,
  `totalDuration` INT NOT NULL DEFAULT 0 COMMENT 'Total duration in minutes',
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign key constraint
  CONSTRAINT `fk_subjects_courseId` FOREIGN KEY (`courseId`) REFERENCES `courses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  
  -- Indexes for performance
  INDEX `idx_subjects_courseId` (`courseId`),
  INDEX `idx_subjects_sequenceOrder` (`sequenceOrder`),
  INDEX `idx_subjects_isActive` (`isActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Subjects within courses';


-- Step 2: Add subjectId column to modules table
-- ============================================================
ALTER TABLE `modules`
  ADD COLUMN `subjectId` VARCHAR(36) DEFAULT NULL AFTER `id`,
  ADD INDEX `idx_modules_subjectId` (`subjectId`);

-- Add foreign key constraint for subjectId
ALTER TABLE `modules`
  ADD CONSTRAINT `fk_modules_subjectId` FOREIGN KEY (`subjectId`) REFERENCES `subjects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;


-- Step 3: Make courseId nullable in modules table (for backward compatibility)
-- ============================================================
ALTER TABLE `modules`
  MODIFY COLUMN `courseId` VARCHAR(36) DEFAULT NULL;


-- ============================================================
-- Data Migration Strategy (Execute these after creating subjects)
-- ============================================================
-- Note: These are EXAMPLE queries. You need to customize based on your data

-- Option 1: Create a default subject for each course
-- ------------------------------------------------------------
-- This creates one "General" subject per course and moves all modules there
-- Uncomment and customize as needed:

-- INSERT INTO subjects (id, courseId, name, description, sequenceOrder, isActive, totalModules, totalDuration)
-- SELECT 
--   UUID() as id,
--   c.id as courseId,
--   CONCAT(c.title, ' - General') as name,
--   'Default subject for course modules' as description,
--   1 as sequenceOrder,
--   1 as isActive,
--   COUNT(DISTINCT m.id) as totalModules,
--   COALESCE(SUM(m.totalDuration), 0) as totalDuration
-- FROM courses c
-- LEFT JOIN modules m ON m.courseId = c.id
-- WHERE c.isActive = 1
-- GROUP BY c.id;


-- Option 2: Update all modules to reference their new subject
-- ------------------------------------------------------------
-- After creating subjects, link modules to them:

-- UPDATE modules m
-- INNER JOIN subjects s ON s.courseId = m.courseId
-- SET m.subjectId = s.id
-- WHERE m.subjectId IS NULL;


-- Option 3: Create multiple subjects per course based on module sequence ranges
-- ------------------------------------------------------------
-- Example: Create subjects for every 5 modules
-- This is more complex and requires custom logic based on your course structure

-- Example query (customize based on your needs):
-- INSERT INTO subjects (id, courseId, name, sequenceOrder)
-- SELECT 
--   UUID() as id,
--   courseId,
--   CONCAT('Subject ', CEIL(sequenceOrder / 5)) as name,
--   CEIL(sequenceOrder / 5) as sequenceOrder
-- FROM (
--   SELECT DISTINCT courseId, CEIL(sequenceOrder / 5) as subject_group
--   FROM modules
-- ) grouped;


-- ============================================================
-- Verification Queries
-- ============================================================
-- Run these queries to verify the migration was successful

-- Check subjects table structure
-- DESCRIBE subjects;

-- Check modules table structure
-- DESCRIBE modules;

-- Count subjects per course
-- SELECT 
--   c.title as course_name,
--   COUNT(s.id) as subject_count
-- FROM courses c
-- LEFT JOIN subjects s ON s.courseId = c.id
-- GROUP BY c.id, c.title;

-- Count modules per subject
-- SELECT 
--   c.title as course_name,
--   s.name as subject_name,
--   COUNT(m.id) as module_count
-- FROM subjects s
-- INNER JOIN courses c ON c.id = s.courseId
-- LEFT JOIN modules m ON m.subjectId = s.id
-- GROUP BY s.id, c.title, s.name
-- ORDER BY c.title, s.sequenceOrder;

-- Find modules without subjectId (orphaned modules)
-- SELECT id, title, courseId FROM modules WHERE subjectId IS NULL;


-- ============================================================
-- Rollback Script (Use in case of issues)
-- ============================================================
-- WARNING: This will delete all subjects and remove the relationship
-- Uncomment only if you need to rollback the migration

-- -- Remove foreign key constraint from modules
-- ALTER TABLE `modules` DROP FOREIGN KEY `fk_modules_subjectId`;

-- -- Remove subjectId column from modules
-- ALTER TABLE `modules` DROP COLUMN `subjectId`;

-- -- Make courseId NOT NULL again
-- ALTER TABLE `modules` MODIFY COLUMN `courseId` VARCHAR(36) NOT NULL;

-- -- Drop subjects table
-- DROP TABLE IF EXISTS `subjects`;


-- ============================================================
-- Post-Migration Cleanup (Optional)
-- ============================================================
-- After confirming everything works, you may want to:

-- 1. Update subject statistics
-- UPDATE subjects s
-- SET 
--   totalModules = (SELECT COUNT(*) FROM modules WHERE subjectId = s.id),
--   totalDuration = (SELECT COALESCE(SUM(totalDuration), 0) FROM modules WHERE subjectId = s.id);

-- 2. Set courseId to match subject's course for consistency
-- UPDATE modules m
-- INNER JOIN subjects s ON s.id = m.subjectId
-- SET m.courseId = s.courseId
-- WHERE m.courseId IS NULL OR m.courseId != s.courseId;


-- ============================================================
-- End of Migration Script
-- ============================================================
