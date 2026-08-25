-- Email Verification Migration
-- Add email verification fields to users table

ALTER TABLE users 
  ADD COLUMN isEmailVerified BOOLEAN DEFAULT FALSE NOT NULL,
  ADD COLUMN emailVerificationToken VARCHAR(255) NULL,
  ADD COLUMN emailVerificationTokenExpiry TIMESTAMP NULL;

-- Set existing users (teachers and admins) as verified
-- Students remain unverified and will need to verify on next login
UPDATE users 
SET isEmailVerified = TRUE 
WHERE role IN ('Teacher', 'Student');

-- Add index for faster token lookup
CREATE INDEX idx_users_verification_token ON users(emailVerificationToken);

-- Comments for documentation
COMMENT ON COLUMN users.isEmailVerified IS 'Whether the user has verified their email address';
COMMENT ON COLUMN users.emailVerificationToken IS 'Token sent to user email for verification';
COMMENT ON COLUMN users.emailVerificationTokenExpiry IS 'Expiration timestamp for verification token (24 hours from generation)';
