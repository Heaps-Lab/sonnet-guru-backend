# MySQL Database Setup Guide

## 📋 Overview

This project uses **MySQL 8.0** with **TypeORM** for database management. All tables are created via migrations for version control and consistency.

## 🗄️ Database Schema

### Tables Created

1. **users** - User accounts with roles and device sessions
2. **courses** - Course information with instructor relationships
3. **modules** - Course modules/lessons with sequence ordering
4. **quizzes** - Quiz questions with negative marking support
5. **payment_claims** - Manual payment verification system
6. **enrollments** - Course enrollment records linked to payments

## 🚀 Quick Setup

### Option 1: Using Docker (Recommended)

Docker Compose already includes MySQL setup. Just run:

```bash
# Copy environment file
cp .env.docker .env

# Edit credentials
nano .env

# Start all services (MySQL included)
docker-compose up -d

# Wait for MySQL to be ready (check health)
docker-compose ps

# Run migrations inside app container
docker-compose exec app1 bun run migration:run

# Seed admin user
docker-compose exec app1 bun run seed:admin
```

**Default Admin Credentials:**

- Email: `admin@lmsplatform.com`
- Password: `Admin@123456`
- ⚠️ **Change after first login!**

### Option 2: Local MySQL Installation

1. **Install MySQL 8.0**

```bash
# macOS with Homebrew
brew install mysql@8.0
brew services start mysql@8.0

# Ubuntu/Debian
sudo apt update
sudo apt install mysql-server-8.0
sudo systemctl start mysql

# Verify installation
mysql --version
```

2. **Create Database and User**

```bash
# Connect to MySQL as root
mysql -u root -p

# Run these commands in MySQL shell
CREATE DATABASE lms_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'lms_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON lms_platform.* TO 'lms_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

3. **Configure Environment**

```bash
# Copy example env
cp .env.example .env

# Edit .env file
nano .env
```

Update these values:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=lms_user
DB_PASSWORD=your_secure_password
DB_DATABASE=lms_platform
```

4. **Run Migrations**

```bash
# Install dependencies
bun install

# Run migrations to create tables
bun run migration:run

# Seed initial admin user
bun run seed:admin
```

5. **Start Application**

```bash
bun run start:dev
```

## 📝 Migration Commands

### Running Migrations

```bash
# Run pending migrations
bun run migration:run

# Show migration status
bun run typeorm migration:show -d src/config/typeorm.config.ts

# Revert last migration
bun run migration:revert
```

### Creating New Migrations

```bash
# Generate migration from entity changes
bun run migration:generate src/database/migrations/UpdateUserTable

# Create empty migration
bun run migration:create src/database/migrations/AddIndexToUsers
```

### Development Helpers

```bash
# Sync schema (DEVELOPMENT ONLY - don't use in production!)
bun run schema:sync

# Drop entire schema (DANGEROUS!)
bun run schema:drop

# Seed admin user
bun run seed:admin
```

## 🔧 Migration Files

### Initial Migration

Located at: `src/database/migrations/1700000000000-InitialSchema.ts`

Creates all tables with:

- Primary keys (UUID)
- Foreign key relationships
- Indexes for performance
- Default values
- Timestamps (auto-updated)

### Tables Structure

#### users

```sql
- id (UUID, PK)
- name, email, password
- role (ENUM: Super Admin, Admin, Teacher, Student)
- isActive (BOOLEAN)
- activeSessions (JSON) - Device tracking
- createdAt, updatedAt
```

#### courses

```sql
- id (UUID, PK)
- title, description
- instructorId (FK -> users)
- price (DECIMAL)
- isPublished, thumbnailUrl
- enrollmentCount
- createdAt, updatedAt
```

#### modules

```sql
- id (UUID, PK)
- courseId (FK -> courses)
- title, description
- sequenceOrder (INT)
- isPublished
- sheets (JSON) - PDF documents
- videos (JSON) - Video URLs
- createdAt, updatedAt
```

#### quizzes

```sql
- id (UUID, PK)
- moduleId (FK -> modules)
- title, description
- duration (minutes)
- totalMarks, passingMarks
- isPublished
- questions (JSON) - MCQ data
- createdAt, updatedAt
```

#### payment_claims

```sql
- id (UUID, PK)
- userId, courseId (FK)
- gateway (ENUM: bKash, Nagad, Rocket)
- senderNumber, transactionId (UNIQUE)
- amountPaid (DECIMAL)
- status (ENUM: PENDING, APPROVED, REJECTED)
- adminRemarks, verifiedBy, verifiedAt
- createdAt, updatedAt
```

#### enrollments

```sql
- id (UUID, PK)
- userId, courseId (FK)
- paymentClaimId (FK, UNIQUE)
- isActive
- enrolledAt, completedAt
- progressPercentage
- createdAt, updatedAt
- UNIQUE(userId, courseId)
```

## 🔍 Database Indexes

Performance indexes created:

- `users.email` - Fast login lookups
- `users.role` - Role-based queries
- `courses.instructorId` - Instructor's courses
- `courses.isPublished` - Published course listings
- `courses (title, description)` - Full-text search
- `modules (courseId, sequenceOrder)` - Ordered module retrieval
- `payment_claims.transactionId` - Duplicate prevention
- `payment_claims.status` - Payment status filtering
- `enrollments (userId, courseId)` - Unique constraint + fast lookups

## 💾 Backup & Restore

### Backup Database

```bash
# Local MySQL backup
mysqldump -u lms_user -p lms_platform > backup_$(date +%Y%m%d_%H%M%S).sql

# Docker MySQL backup
docker-compose exec mysql mysqldump -u lms_user -p lms_platform > backup.sql
```

### Restore Database

```bash
# Local restore
mysql -u lms_user -p lms_platform < backup.sql

# Docker restore
docker-compose exec -T mysql mysql -u lms_user -p lms_platform < backup.sql
```

### Automated Backup Script

Create `backup-mysql.sh`:

```bash
#!/bin/bash
BACKUP_DIR="./backups/mysql"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Using Docker
docker-compose exec -T mysql mysqldump \
  -u ${DB_USERNAME} \
  -p${DB_PASSWORD} \
  ${DB_DATABASE} > $BACKUP_DIR/lms_backup_$DATE.sql

# Compress
gzip $BACKUP_DIR/lms_backup_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: lms_backup_$DATE.sql.gz"
```

Schedule with cron:

```bash
0 2 * * * /opt/lms-platform/backup-mysql.sh
```

## 🔐 Security Best Practices

1. **Never use root user** for application
2. **Strong passwords** (minimum 16 characters)
3. **Limit permissions** to specific database only
4. **Enable SSL/TLS** for MySQL connections
5. **Regular backups** with retention policy
6. **Monitor slow queries** and optimize
7. **Keep MySQL updated** to latest patch version

## 🐛 Troubleshooting

### Migration Fails

```bash
# Check migration status
bun run typeorm migration:show -d src/config/typeorm.config.ts

# Check database connection
mysql -u lms_user -p -h localhost lms_platform

# Drop and recreate (DEVELOPMENT ONLY!)
bun run schema:drop
bun run migration:run
```

### Connection Issues

```bash
# Test connection
mysql -u lms_user -p -h localhost -P 3306 lms_platform

# Check MySQL is running
# macOS
brew services list | grep mysql

# Linux
sudo systemctl status mysql

# Docker
docker-compose ps mysql
```

### Permission Errors

```sql
-- Reconnect as root
mysql -u root -p

-- Grant permissions
GRANT ALL PRIVILEGES ON lms_platform.* TO 'lms_user'@'localhost';
GRANT ALL PRIVILEGES ON lms_platform.* TO 'lms_user'@'%';
FLUSH PRIVILEGES;
```

### Character Set Issues

```sql
-- Check database charset
SELECT DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME
FROM information_schema.SCHEMATA
WHERE SCHEMA_NAME = 'lms_platform';

-- Should return utf8mb4 and utf8mb4_unicode_ci

-- Fix if needed
ALTER DATABASE lms_platform
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

## 📊 Monitoring Queries

### Useful SQL Commands

```sql
-- Show all tables
SHOW TABLES;

-- Describe table structure
DESCRIBE users;

-- Count records
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM courses;
SELECT COUNT(*) FROM enrollments;

-- Check admin user
SELECT id, name, email, role FROM users WHERE role = 'Super Admin';

-- Recent enrollments
SELECT e.*, u.name as user_name, c.title as course_title
FROM enrollments e
JOIN users u ON e.userId = u.id
JOIN courses c ON e.courseId = c.id
ORDER BY e.createdAt DESC
LIMIT 10;

-- Pending payments
SELECT pc.*, u.name as user_name, c.title as course_title
FROM payment_claims pc
JOIN users u ON pc.userId = u.id
JOIN courses c ON pc.courseId = c.id
WHERE pc.status = 'PENDING'
ORDER BY pc.createdAt DESC;
```

## 🚀 Performance Optimization

### Enable Query Logging (Development)

Edit `src/config/typeorm.config.ts`:

```typescript
logging: true, // Enable SQL query logging
```

### Analyze Slow Queries

```sql
-- Enable slow query log
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2; -- Queries slower than 2 seconds

-- Check slow query log
SHOW VARIABLES LIKE 'slow_query_log_file';
```

### Optimize Tables

```sql
-- Analyze tables for index optimization
ANALYZE TABLE users, courses, modules, quizzes, payment_claims, enrollments;

-- Check table sizes
SELECT
    table_name,
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS "Size (MB)"
FROM information_schema.TABLES
WHERE table_schema = 'lms_platform'
ORDER BY (data_length + index_length) DESC;
```

## 📚 Additional Resources

- [TypeORM Documentation](https://typeorm.io/)
- [MySQL 8.0 Reference](https://dev.mysql.com/doc/refman/8.0/en/)
- [TypeORM Migrations Guide](https://typeorm.io/migrations)
- [MySQL Performance Tuning](https://dev.mysql.com/doc/refman/8.0/en/optimization.html)
