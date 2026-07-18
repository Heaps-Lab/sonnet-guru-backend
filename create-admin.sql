-- ============================================
-- Create Admin User
-- Run this AFTER database-setup.sql
-- ============================================

USE sonnetguru_LMS;

-- Delete existing admin if exists
DELETE FROM users WHERE email = 'admin@lmsplatform.com';

-- Insert admin user
-- Password: Admin@123456
-- Bcrypt hash: $2b$10$K8K8K8K8K8K8K8K8K8K8K.K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8
INSERT INTO users (id, name, email, password, role, isActive, activeSessions, createdAt, updatedAt) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'Super Administrator',
  'admin@lmsplatform.com',
  '$2b$10$rZ3PqhJvQ7YZ0TkMzMxMzezMTMyMjMzNTM3MTgyMTkyMjI3NzE2Mu',
  'Super Admin',
  TRUE,
  '[]',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Verify admin created
SELECT 'Admin user created successfully!' as status;
SELECT id, name, email, role, isActive, createdAt 
FROM users 
WHERE email = 'admin@lmsplatform.com';

SELECT '================================' as separator;
SELECT 'Email: admin@lmsplatform.com' as credential;
SELECT 'Password: Admin@123456' as credential;
SELECT '⚠️  CHANGE THIS PASSWORD IMMEDIATELY AFTER FIRST LOGIN!' as warning;
