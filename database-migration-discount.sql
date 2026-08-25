-- ============================================================
-- Course Discount Feature Migration Script
-- ============================================================
-- This script adds discount and discountedPrice fields to courses table
-- ============================================================

-- Add discount and discountedPrice columns to courses table
ALTER TABLE `courses`
  ADD COLUMN `discount` DECIMAL(5, 2) NOT NULL DEFAULT 0.00 COMMENT 'Discount percentage (0-100)' AFTER `price`,
  ADD COLUMN `discountedPrice` DECIMAL(10, 2) DEFAULT NULL COMMENT 'Calculated price after discount' AFTER `discount`;

-- Add index for discount field for filtering courses with discounts
ALTER TABLE `courses`
  ADD INDEX `idx_courses_discount` (`discount`);

-- ============================================================
-- Calculate discounted prices for existing courses
-- ============================================================
-- This updates the discountedPrice field based on existing price and discount
-- Note: By default, discount is 0, so discountedPrice will equal price

UPDATE `courses`
SET `discountedPrice` = CASE
  WHEN `discount` > 0 THEN ROUND(`price` - (`price` * `discount` / 100), 2)
  ELSE `price`
END
WHERE `discountedPrice` IS NULL;

-- ============================================================
-- Verification Queries
-- ============================================================
-- Run these queries to verify the migration was successful

-- Check table structure
-- DESCRIBE courses;

-- View courses with discount information
-- SELECT 
--   id, 
--   title, 
--   price, 
--   discount, 
--   discountedPrice,
--   CASE 
--     WHEN discount > 0 THEN CONCAT(discount, '% OFF')
--     ELSE 'No Discount'
--   END as discount_status
-- FROM courses
-- LIMIT 10;

-- Count courses with discounts
-- SELECT 
--   COUNT(*) as total_courses,
--   SUM(CASE WHEN discount > 0 THEN 1 ELSE 0 END) as discounted_courses,
--   SUM(CASE WHEN discount = 0 THEN 1 ELSE 0 END) as full_price_courses
-- FROM courses;

-- ============================================================
-- Example: Apply Discount to Existing Courses
-- ============================================================
-- Uncomment and modify as needed

-- Apply 10% discount to a specific course
-- UPDATE courses
-- SET discount = 10.00,
--     discountedPrice = ROUND(price - (price * 10 / 100), 2)
-- WHERE id = 'your-course-id';

-- Apply 15% discount to all courses in a category
-- UPDATE courses
-- SET discount = 15.00,
--     discountedPrice = ROUND(price - (price * 15 / 100), 2)
-- WHERE category = 'Web Development'
--   AND isActive = 1;

-- Apply bulk discount based on price range
-- UPDATE courses
-- SET discount = CASE
--   WHEN price > 5000 THEN 20.00
--   WHEN price > 3000 THEN 15.00
--   WHEN price > 1000 THEN 10.00
--   ELSE 5.00
-- END,
-- discountedPrice = CASE
--   WHEN price > 5000 THEN ROUND(price - (price * 20 / 100), 2)
--   WHEN price > 3000 THEN ROUND(price - (price * 15 / 100), 2)
--   WHEN price > 1000 THEN ROUND(price - (price * 10 / 100), 2)
--   ELSE ROUND(price - (price * 5 / 100), 2)
-- END
-- WHERE isActive = 1;

-- ============================================================
-- Rollback Script (Use in case of issues)
-- ============================================================
-- WARNING: This will remove the discount fields
-- Uncomment only if you need to rollback the migration

-- Remove discount fields from courses
-- ALTER TABLE `courses` DROP COLUMN `discountedPrice`;
-- ALTER TABLE `courses` DROP COLUMN `discount`;

-- ============================================================
-- End of Migration Script
-- ============================================================
