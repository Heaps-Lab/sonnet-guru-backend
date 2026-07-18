# ✅ MySQL Migration Complete!

## What Changed

The project has been migrated from MongoDB to **MySQL 8.0** with **TypeORM**.

### Key Changes

- ✅ MongoDB dependencies removed
- ✅ TypeORM with MySQL2 driver installed
- ✅ All Mongoose schemas converted to TypeORM entities
- ✅ Complete migration system setup
- ✅ Initial schema migration created
- ✅ Admin seeder script included
- ✅ Docker Compose updated for MySQL
- ✅ All environment files updated

## 🚀 Quick Start Commands

### Docker Setup (Recommended)

```bash
# 1. Setup environment
cp .env.docker .env
nano .env  # Edit MySQL credentials

# 2. Start all services
docker-compose up -d

# 3. Wait for MySQL to be healthy
docker-compose ps

# 4. Run migrations
docker-compose exec app1 bun run migration:run

# 5. Seed admin user
docker-compose exec app1 bun run seed:admin

# 6. Check logs
docker-compose logs -f app1
```

### Local Development

```bash
# 1. Install MySQL 8.0 locally
brew install mysql@8.0  # macOS
# OR
sudo apt install mysql-server  # Ubuntu

# 2. Create database
mysql -u root -p
CREATE DATABASE lms_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'lms_user'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON lms_platform.* TO 'lms_user'@'localhost';
EXIT;

# 3. Configure environment
cp .env.example .env
nano .env  # Update DB credentials

# 4. Install dependencies
bun install

# 5. Run migrations
bun run migration:run

# 6. Seed admin
bun run seed:admin

# 7. Start app
bun run start:dev
```

## 📊 Database Schema

All tables are created via migrations in:
`src/database/migrations/1700000000000-InitialSchema.ts`

### Tables:

- **users** - User accounts with device sessions
- **courses** - Course catalog
- **modules** - Course content modules
- **quizzes** - Quiz questions (MCQ)
- **payment_claims** - Manual payment verification
- **enrollments** - Course enrollments

## 🔑 Default Admin

After running `bun run seed:admin`:

```
Email: admin@lmsplatform.com
Password: Admin@123456
```

⚠️ **IMPORTANT:** Change this password after first login!

## 📝 Migration Commands

```bash
# Run migrations (create tables)
bun run migration:run

# Revert last migration
bun run migration:revert

# Generate new migration from entity changes
bun run migration:generate src/database/migrations/MigrationName

# Create empty migration
bun run migration:create src/database/migrations/MigrationName

# Seed admin user
bun run seed:admin
```

## 🐳 Docker MySQL Access

```bash
# MySQL shell
docker-compose exec mysql mysql -u lms_user -p lms_platform

# Run SQL file
docker-compose exec -T mysql mysql -u lms_user -p < backup.sql

# Backup database
docker-compose exec mysql mysqldump -u lms_user -p lms_platform > backup.sql
```

## 📁 Entity Files

TypeORM entities replaced Mongoose schemas:

- `src/users/entities/user.entity.ts`
- `src/courses/entities/course.entity.ts`
- `src/modules/entities/module.entity.ts`
- `src/quizzes/entities/quiz.entity.ts`
- `src/payments/entities/payment-claim.entity.ts`
- `src/payments/entities/enrollment.entity.ts`

## 🔧 Environment Variables

### Docker (.env)

```env
DB_HOST=mysql
DB_PORT=3306
DB_ROOT_PASSWORD=root123
DB_USERNAME=lms_user
DB_PASSWORD=lms123
DB_DATABASE=lms_platform
```

### Local (.env)

```env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=lms_user
DB_PASSWORD=your_password
DB_DATABASE=lms_platform
```

## ✅ Verification

Test the setup:

```bash
# 1. Check if tables are created
docker-compose exec mysql mysql -u lms_user -p lms_platform -e "SHOW TABLES;"

# Expected output:
# +-------------------------+
# | Tables_in_lms_platform  |
# +-------------------------+
# | courses                 |
# | enrollments             |
# | modules                 |
# | payment_claims          |
# | quizzes                 |
# | users                   |
# +-------------------------+

# 2. Check admin user
docker-compose exec mysql mysql -u lms_user -p lms_platform -e \
"SELECT id, name, email, role FROM users WHERE role='Super Admin';"

# 3. Test API
curl http://localhost/api/v1

# 4. Check app logs
docker-compose logs app1
```

## 🔍 Troubleshooting

### MySQL Won't Start

```bash
# Check logs
docker-compose logs mysql

# Restart MySQL
docker-compose restart mysql

# Remove and recreate
docker-compose down -v
docker-compose up -d
```

### Migration Fails

```bash
# Check connection
docker-compose exec app1 sh
nc -zv mysql 3306

# Manually run migration
docker-compose exec app1 bun run migration:run

# Check migration table
docker-compose exec mysql mysql -u lms_user -p lms_platform -e \
"SELECT * FROM migrations;"
```

### Can't Connect to Database

1. Check MySQL is healthy: `docker-compose ps`
2. Verify credentials in `.env`
3. Check network: `docker network ls`
4. Test from app container: `docker-compose exec app1 nc -zv mysql 3306`

## 📚 Documentation

- **Database Setup:** [DATABASE_SETUP.md](DATABASE_SETUP.md)
- **Docker Guide:** [DOCKER_README.md](DOCKER_README.md)
- **Deployment:** [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

## 🎯 Ready to Go!

The project is now fully configured with MySQL and ready for development or deployment. All tables will be created automatically when you run migrations.
