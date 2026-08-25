-- Teacher Applications Migration
-- Create teacher_applications table

CREATE TABLE teacher_applications (
  id VARCHAR(36) PRIMARY KEY,
  fullName VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phoneNumber VARCHAR(20) NOT NULL,
  qualifications TEXT NOT NULL,
  experience TEXT NOT NULL,
  subjectsToTeach TEXT NOT NULL,
  additionalInfo TEXT NULL,
  cvFileName VARCHAR(255) NOT NULL,
  cvFileUrl VARCHAR(500) NOT NULL,
  cvFileSize BIGINT NOT NULL,
  cvMimeType VARCHAR(100) NOT NULL,
  status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending' NOT NULL,
  adminNotes TEXT NULL,
  reviewedBy VARCHAR(255) NULL,
  reviewedAt TIMESTAMP NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

-- Add indexes for better performance
CREATE INDEX idx_teacher_applications_email ON teacher_applications(email);
CREATE INDEX idx_teacher_applications_status ON teacher_applications(status);
CREATE INDEX idx_teacher_applications_created_at ON teacher_applications(createdAt);
CREATE INDEX idx_teacher_applications_reviewed_by ON teacher_applications(reviewedBy);

-- Add comments for documentation
ALTER TABLE teacher_applications 
  COMMENT = 'Teacher application submissions with CV uploads';

ALTER TABLE teacher_applications 
  MODIFY COLUMN fullName VARCHAR(255) NOT NULL COMMENT 'Full name of the applicant',
  MODIFY COLUMN email VARCHAR(255) NOT NULL COMMENT 'Email address of the applicant',
  MODIFY COLUMN phoneNumber VARCHAR(20) NOT NULL COMMENT 'Phone number of the applicant',
  MODIFY COLUMN qualifications TEXT NOT NULL COMMENT 'Educational qualifications and degrees',
  MODIFY COLUMN experience TEXT NOT NULL COMMENT 'Teaching and work experience',
  MODIFY COLUMN subjectsToTeach TEXT NOT NULL COMMENT 'Subjects the applicant wants to teach',
  MODIFY COLUMN additionalInfo TEXT NULL COMMENT 'Additional information about the applicant',
  MODIFY COLUMN cvFileName VARCHAR(255) NOT NULL COMMENT 'Name of the uploaded CV file',
  MODIFY COLUMN cvFileUrl VARCHAR(500) NOT NULL COMMENT 'URL to access the CV file',
  MODIFY COLUMN cvFileSize BIGINT NOT NULL COMMENT 'Size of the CV file in bytes',
  MODIFY COLUMN cvMimeType VARCHAR(100) NOT NULL COMMENT 'MIME type of the CV file (should be application/pdf)',
  MODIFY COLUMN status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending' NOT NULL COMMENT 'Application status',
  MODIFY COLUMN adminNotes TEXT NULL COMMENT 'Admin notes about the application',
  MODIFY COLUMN reviewedBy VARCHAR(255) NULL COMMENT 'Name of the admin who reviewed the application',
  MODIFY COLUMN reviewedAt TIMESTAMP NULL COMMENT 'Timestamp when the application was reviewed';