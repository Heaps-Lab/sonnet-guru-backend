/* eslint-disable @typescript-eslint/no-unused-vars */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLMSEntities1700000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new columns to courses table
    await queryRunner.query(`
      ALTER TABLE courses 
      ADD COLUMN IF NOT EXISTS fullDescription TEXT NULL,
      ADD COLUMN IF NOT EXISTS category VARCHAR(100) NULL,
      ADD COLUMN IF NOT EXISTS level VARCHAR(100) NULL,
      ADD COLUMN IF NOT EXISTS totalDuration INT DEFAULT 0,
      ADD COLUMN IF NOT EXISTS isActive BOOLEAN DEFAULT TRUE
    `);

    // Add new columns to modules table
    await queryRunner.query(`
      ALTER TABLE modules 
      ADD COLUMN IF NOT EXISTS isCompleted BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS totalDuration INT DEFAULT 0
    `);

    // Drop old JSON columns from modules
    await queryRunner.query(`ALTER TABLE modules DROP COLUMN IF EXISTS sheets`);
    await queryRunner.query(`ALTER TABLE modules DROP COLUMN IF EXISTS videos`);

    // Create videos table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS videos (
        id VARCHAR(36) NOT NULL PRIMARY KEY,
        moduleId VARCHAR(36) NOT NULL,
        title VARCHAR(500) NOT NULL,
        description TEXT NULL,
        fileName VARCHAR(1000) NOT NULL,
        videoUrl VARCHAR(1000) NOT NULL,
        hlsPlaylistUrl VARCHAR(1000) NULL,
        duration INT NOT NULL DEFAULT 0,
        sequenceNumber INT NOT NULL,
        isDownloadable BOOLEAN DEFAULT TRUE,
        isActive BOOLEAN DEFAULT TRUE,
        fileSize BIGINT NOT NULL,
        mimeType VARCHAR(50) NOT NULL,
        status ENUM('uploading', 'processing', 'ready', 'failed') DEFAULT 'uploading',
        processingError TEXT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_videos_module_sequence (moduleId, sequenceNumber),
        INDEX idx_videos_status (status),
        CONSTRAINT fk_videos_module FOREIGN KEY (moduleId) REFERENCES modules(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create module_sheets table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS module_sheets (
        id VARCHAR(36) NOT NULL PRIMARY KEY,
        moduleId VARCHAR(36) NOT NULL,
        title VARCHAR(500) NOT NULL,
        description TEXT NULL,
        fileName VARCHAR(1000) NOT NULL,
        fileUrl VARCHAR(1000) NOT NULL,
        isDownloadable BOOLEAN DEFAULT TRUE,
        isActive BOOLEAN DEFAULT TRUE,
        fileSize BIGINT NOT NULL,
        mimeType VARCHAR(50) NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_sheets_module (moduleId),
        CONSTRAINT fk_sheets_module FOREIGN KEY (moduleId) REFERENCES modules(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Add new columns to quizzes table
    await queryRunner.query(`
      ALTER TABLE quizzes 
      ADD COLUMN IF NOT EXISTS isActive BOOLEAN DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS maxAttempts INT DEFAULT 1,
      ADD COLUMN IF NOT EXISTS shuffleQuestions BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS showResultsImmediately BOOLEAN DEFAULT FALSE
    `);

    // Drop old questions JSON column
    await queryRunner.query(
      `ALTER TABLE quizzes DROP COLUMN IF EXISTS questions`,
    );

    // Create quiz_questions table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS quiz_questions (
        id VARCHAR(36) NOT NULL PRIMARY KEY,
        quizId VARCHAR(36) NOT NULL,
        questionText TEXT NOT NULL,
        explanation TEXT NULL,
        marks DECIMAL(5,2) DEFAULT 1.0,
        negativeMarking DECIMAL(5,2) DEFAULT 0.0,
        correctOptionIndex INT NOT NULL,
        sequenceNumber INT DEFAULT 1,
        isActive BOOLEAN DEFAULT TRUE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_questions_quiz_sequence (quizId, sequenceNumber),
        CONSTRAINT fk_questions_quiz FOREIGN KEY (quizId) REFERENCES quizzes(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create question_options table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS question_options (
        id VARCHAR(36) NOT NULL PRIMARY KEY,
        questionId VARCHAR(36) NOT NULL,
        optionIndex INT NOT NULL,
        text TEXT NOT NULL,
        isActive BOOLEAN DEFAULT TRUE,
        INDEX idx_options_question (questionId, optionIndex),
        CONSTRAINT fk_options_question FOREIGN KEY (questionId) REFERENCES quiz_questions(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create quiz_submissions table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS quiz_submissions (
        id VARCHAR(36) NOT NULL PRIMARY KEY,
        quizId VARCHAR(36) NOT NULL,
        studentId VARCHAR(36) NOT NULL,
        attemptNumber INT DEFAULT 1,
        totalScore DECIMAL(8,2) DEFAULT 0.0,
        maxScore DECIMAL(8,2) DEFAULT 0.0,
        percentage DECIMAL(5,2) DEFAULT 0.0,
        isPassed BOOLEAN DEFAULT FALSE,
        status ENUM('in_progress', 'submitted', 'auto_submitted') DEFAULT 'in_progress',
        startedAt TIMESTAMP NULL,
        submittedAt TIMESTAMP NULL,
        timeSpent INT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_submissions_quiz (quizId),
        INDEX idx_submissions_student (studentId),
        INDEX idx_submissions_status (status),
        CONSTRAINT fk_submissions_quiz FOREIGN KEY (quizId) REFERENCES quizzes(id) ON DELETE CASCADE,
        CONSTRAINT fk_submissions_student FOREIGN KEY (studentId) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create submission_answers table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS submission_answers (
        id VARCHAR(36) NOT NULL PRIMARY KEY,
        submissionId VARCHAR(36) NOT NULL,
        questionId VARCHAR(36) NOT NULL,
        selectedOptionIndex INT NULL,
        isCorrect BOOLEAN DEFAULT FALSE,
        marksObtained DECIMAL(5,2) DEFAULT 0.0,
        answeredAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_answers_submission (submissionId),
        INDEX idx_answers_question (questionId),
        CONSTRAINT fk_answers_submission FOREIGN KEY (submissionId) REFERENCES quiz_submissions(id) ON DELETE CASCADE,
        CONSTRAINT fk_answers_question FOREIGN KEY (questionId) REFERENCES quiz_questions(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Add performance indexes
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_courses_instructor ON courses(instructorId)',
      'CREATE INDEX IF NOT EXISTS idx_courses_published ON courses(isPublished)',
      'CREATE INDEX IF NOT EXISTS idx_courses_active ON courses(isActive)',
    ];

    for (const indexQuery of indexes) {
      try {
        await queryRunner.query(indexQuery);
      } catch (error: any) {
        // Index might already exist, continue
        console.log(`Index creation skipped or already exists`);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order
    await queryRunner.query(`DROP TABLE IF EXISTS submission_answers`);
    await queryRunner.query(`DROP TABLE IF EXISTS quiz_submissions`);
    await queryRunner.query(`DROP TABLE IF EXISTS question_options`);
    await queryRunner.query(`DROP TABLE IF EXISTS quiz_questions`);
    await queryRunner.query(`DROP TABLE IF EXISTS module_sheets`);
    await queryRunner.query(`DROP TABLE IF EXISTS videos`);

    // Revert courses table
    await queryRunner.query(`
      ALTER TABLE courses 
      DROP COLUMN IF EXISTS isActive,
      DROP COLUMN IF EXISTS totalDuration,
      DROP COLUMN IF EXISTS level,
      DROP COLUMN IF EXISTS category,
      DROP COLUMN IF EXISTS fullDescription
    `);

    // Revert modules table
    await queryRunner.query(`
      ALTER TABLE modules 
      DROP COLUMN IF EXISTS totalDuration,
      DROP COLUMN IF EXISTS isCompleted
    `);

    // Revert quizzes table
    await queryRunner.query(`
      ALTER TABLE quizzes 
      DROP COLUMN IF EXISTS showResultsImmediately,
      DROP COLUMN IF EXISTS shuffleQuestions,
      DROP COLUMN IF EXISTS maxAttempts,
      DROP COLUMN IF EXISTS isActive
    `);
  }
}
