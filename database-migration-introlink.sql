-- ============================================================
-- Course Intro Link Feature Migration Script
-- ============================================================
-- This script adds introLink field to courses table for
-- introduction/preview video URLs
-- ============================================================

-- Add introLink column to courses table
ALTER TABLE `courses`
  ADD COLUMN `introLink` TEXT DEFAULT NULL COMMENT 'Introduction video URL (MP4 or any video link)' AFTER `thumbnailUrl`;

-- ============================================================
-- Verification Query
-- ============================================================
-- Run this query to verify the migration was successful

-- Check table structure
-- DESCRIBE courses;

-- View courses with intro links
-- SELECT 
--   id,
--   title,
--   thumbnailUrl,
--   introLink,
--   isPublished
-- FROM courses
-- LIMIT 10;

-- ============================================================
-- Example: Add Intro Links to Existing Courses
-- ============================================================
-- Uncomment and modify as needed

-- Add YouTube intro link
-- UPDATE courses
-- SET introLink = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
-- WHERE id = 'your-course-id';

-- Add direct MP4 link
-- UPDATE courses
-- SET introLink = 'https://cdn.example.com/videos/course-intro.mp4'
-- WHERE id = 'your-course-id';

-- Add Vimeo link
-- UPDATE courses
-- SET introLink = 'https://vimeo.com/123456789'
-- WHERE id = 'your-course-id';

-- Bulk update - add intro links to all courses in a category
-- UPDATE courses
-- SET introLink = 'https://example.com/intro.mp4'
-- WHERE category = 'Web Development'
--   AND introLink IS NULL
--   AND isActive = 1;

-- ============================================================
-- Find Courses Without Intro Links
-- ============================================================
-- SELECT 
--   id,
--   title,
--   category,
--   isPublished
-- FROM courses
-- WHERE introLink IS NULL
--   AND isActive = 1
-- ORDER BY createdAt DESC;

-- ============================================================
-- Statistics
-- ============================================================
-- Count courses with and without intro links
-- SELECT 
--   COUNT(*) as total_courses,
--   SUM(CASE WHEN introLink IS NOT NULL THEN 1 ELSE 0 END) as courses_with_intro,
--   SUM(CASE WHEN introLink IS NULL THEN 1 ELSE 0 END) as courses_without_intro
-- FROM courses
-- WHERE isActive = 1;

-- ============================================================
-- Rollback Script (Use in case of issues)
-- ============================================================
-- WARNING: This will remove the introLink field
-- Uncomment only if you need to rollback the migration

-- Remove introLink column
-- ALTER TABLE `courses` DROP COLUMN `introLink`;

-- ============================================================
-- End of Migration Script
-- ============================================================
