import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create users table
    await queryRunner.query(`
      CREATE TABLE users (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('Super Admin', 'Admin', 'Teacher', 'Student') NOT NULL DEFAULT 'Student',
        isActive BOOLEAN NOT NULL DEFAULT TRUE,
        activeSessions JSON NULL,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_users_email (email),
        INDEX idx_users_role (role)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Create courses table
    await queryRunner.query(`
      CREATE TABLE courses (
        id VARCHAR(36) PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        description TEXT NOT NULL,
        instructorId VARCHAR(36) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        isPublished BOOLEAN NOT NULL DEFAULT TRUE,
        thumbnailUrl VARCHAR(500) NULL,
        enrollmentCount INT NOT NULL DEFAULT 0,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (instructorId) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_courses_instructor (instructorId),
        INDEX idx_courses_published (isPublished),
        FULLTEXT idx_courses_search (title, description)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Create modules table
    await queryRunner.query(`
      CREATE TABLE modules (
        id VARCHAR(36) PRIMARY KEY,
        courseId VARCHAR(36) NOT NULL,
        title VARCHAR(500) NOT NULL,
        description TEXT NOT NULL,
        sequenceOrder INT NOT NULL,
        isPublished BOOLEAN NOT NULL DEFAULT TRUE,
        sheets JSON NULL,
        videos JSON NULL,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (courseId) REFERENCES courses(id) ON DELETE CASCADE,
        INDEX idx_modules_course (courseId),
        INDEX idx_modules_sequence (courseId, sequenceOrder)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Create quizzes table
    await queryRunner.query(`
      CREATE TABLE quizzes (
        id VARCHAR(36) PRIMARY KEY,
        moduleId VARCHAR(36) NOT NULL,
        title VARCHAR(500) NOT NULL,
        description TEXT NOT NULL,
        duration INT NOT NULL COMMENT 'Duration in minutes',
        totalMarks INT NOT NULL,
        passingMarks INT NOT NULL DEFAULT 0,
        isPublished BOOLEAN NOT NULL DEFAULT TRUE,
        questions JSON NOT NULL,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (moduleId) REFERENCES modules(id) ON DELETE CASCADE,
        INDEX idx_quizzes_module (moduleId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Create payment_claims table
    await queryRunner.query(`
      CREATE TABLE payment_claims (
        id VARCHAR(36) PRIMARY KEY,
        userId VARCHAR(36) NOT NULL,
        courseId VARCHAR(36) NOT NULL,
        gateway ENUM('bKash', 'Nagad', 'Rocket') NOT NULL,
        senderNumber VARCHAR(50) NOT NULL,
        transactionId VARCHAR(100) NOT NULL UNIQUE,
        amountPaid DECIMAL(10, 2) NOT NULL,
        status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
        adminRemarks TEXT NULL,
        verifiedBy VARCHAR(36) NULL,
        verifiedAt TIMESTAMP NULL,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (courseId) REFERENCES courses(id) ON DELETE CASCADE,
        FOREIGN KEY (verifiedBy) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_payment_user_course (userId, courseId),
        INDEX idx_payment_transaction (transactionId),
        INDEX idx_payment_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Create enrollments table
    await queryRunner.query(`
      CREATE TABLE enrollments (
        id VARCHAR(36) PRIMARY KEY,
        userId VARCHAR(36) NOT NULL,
        courseId VARCHAR(36) NOT NULL,
        paymentClaimId VARCHAR(36) NOT NULL,
        isActive BOOLEAN NOT NULL DEFAULT TRUE,
        enrolledAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        completedAt TIMESTAMP NULL,
        progressPercentage INT NOT NULL DEFAULT 0,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (courseId) REFERENCES courses(id) ON DELETE CASCADE,
        FOREIGN KEY (paymentClaimId) REFERENCES payment_claims(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_course (userId, courseId),
        INDEX idx_enrollment_course (courseId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS enrollments`);
    await queryRunner.query(`DROP TABLE IF EXISTS payment_claims`);
    await queryRunner.query(`DROP TABLE IF EXISTS quizzes`);
    await queryRunner.query(`DROP TABLE IF EXISTS modules`);
    await queryRunner.query(`DROP TABLE IF EXISTS courses`);
    await queryRunner.query(`DROP TABLE IF EXISTS users`);
  }
}
