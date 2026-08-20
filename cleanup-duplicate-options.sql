-- Cleanup duplicate question options
-- This script removes duplicate options keeping only the first one

-- Step 1: See how many duplicates you have
SELECT 
    questionId, 
    optionIndex, 
    COUNT(*) as duplicate_count
FROM question_options
GROUP BY questionId, optionIndex
HAVING COUNT(*) > 1;

-- Step 2: Delete duplicates (keeps the oldest record based on id)
DELETE t1 FROM question_options t1
INNER JOIN question_options t2 
WHERE t1.id > t2.id 
  AND t1.questionId = t2.questionId 
  AND t1.optionIndex = t2.optionIndex;

-- Step 3: Verify the cleanup
SELECT 
    questionId, 
    optionIndex, 
    COUNT(*) as count
FROM question_options
GROUP BY questionId, optionIndex
HAVING COUNT(*) > 1;

-- Should return 0 rows if cleanup was successful
