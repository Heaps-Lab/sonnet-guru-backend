# SQL Setup Instructions

## 📋 Files Provided

1. **database-setup.sql** - Creates all tables and structure
2. **create-admin.sql** - Creates the admin user (run separately)

## 🚀 How to Execute

### Method 1: Using MySQL/MariaDB Command Line

```bash
# Connect to your MariaDB server
mysql -h 144.79.249.3 -u sonnetguru_LMS -p sonnetguru_LMS

# Inside MySQL prompt, run:
source /path/to/database-setup.sql

# Exit and test
exit
```

### Method 2: Using File Directly

```bash
# From your local machine
mysql -h 144.79.249.3 -u sonnetguru_LMS -p sonnetguru_LMS < database-setup.sql

# Verify tables created
mysql -h 144.79.249.3 -u sonnetguru_LMS -p sonnetguru_LMS -e "SHOW TABLES;"
```

### Method 3: Copy and Paste (Most Reliable)

1. **Open the SQL file** in a text editor
2. **Copy all contents** of `database-setup.sql`
3. **Connect to your database:**
   ```bash
   mysql -h 144.79.249.3 -u sonnetguru_LMS -p sonnetguru_LMS
   ```
4. **Paste the entire SQL** and press Enter
5. **Wait for execution** to complete

### Method 4: Using phpMyAdmin (if available)

1. Login to phpMyAdmin
2. Select database: `sonnetguru_LMS`
3. Go to **SQL** tab
4. Paste contents of `database-setup.sql`
5. Click **Go**

## ✅ Verification Steps

After running the SQL file, verify everything is set up:

```bash
mysql -h 144.79.249.3 -u sonnetguru_LMS -p sonnetguru_LMS
```

Then run these commands:

```sql
-- Show all tables
SHOW TABLES;

-- Should show:
-- courses
-- enrollments
-- migrations
-- modules
-- payment_claims
-- quizzes
-- users

-- Check table structures
DESCRIBE users;
DESCRIBE courses;

-- Count records
SELECT COUNT(*) FROM users;  -- Should show 1 (admin user)

-- View admin user
SELECT id, name, email, role FROM users;
```

Expected output for admin user:

```
+--------------------------------------+------------------------+---------------------------+-------------+
| id                                   | name                   | email                     | role        |
+--------------------------------------+------------------------+---------------------------+-------------+
| 550e8400-e29b-41d4-a716-446655440000 | Super Administrator    | admin@lmsplatform.com     | Super Admin |
+--------------------------------------+------------------------+---------------------------+-------------+
```

## 🔑 Admin Credentials

After successful setup:

- **Email:** `admin@lmsplatform.com`
- **Password:** `Admin@123456`

⚠️ **IMPORTANT:** Change this password immediately after first login!

## 🐛 Troubleshooting

### Error: "Access denied"

```bash
# Make sure you're using the correct credentials
mysql -h 144.79.249.3 -u sonnetguru_LMS -p'?D#+D6WJjI4]A^1o' sonnetguru_LMS
```

### Error: "Can't connect to MySQL server"

- Check if port 3306 is open in firewall
- Verify MariaDB is running: `systemctl status mariadb`
- Check bind-address in MariaDB config

### Error: "Table already exists"

The SQL file includes `DROP TABLE IF EXISTS` statements, so it should work. If not:

```sql
-- Drop all tables manually
DROP TABLE IF EXISTS enrollments;
DROP TABLE IF EXISTS payment_claims;
DROP TABLE IF EXISTS quizzes;
DROP TABLE IF EXISTS modules;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS migrations;

-- Then re-run the database-setup.sql file
```

### Admin User Already Exists

The SQL file will create the admin. If you need to recreate:

```sql
DELETE FROM users WHERE email = 'admin@lmsplatform.com';
-- Then run create-admin.sql
```

## 🔄 After Database Setup

Once tables are created, test your application:

```bash
# Test database connection
bun run test-db-connection.ts

# Start the application
bun run start:dev

# Test API
curl http://localhost:3000/api/v1
```

## 📝 Alternative: Create Admin User via App

Instead of using SQL, you can create admin via the seed script:

```bash
# Make sure .env is configured correctly
# Then run:
bun run seed:admin
```

## 🎯 What Gets Created

### Tables (6 total):

1. **users** - User accounts with roles
2. **courses** - Course information
3. **modules** - Course modules/lessons
4. **quizzes** - Quiz questions
5. **payment_claims** - Payment verification
6. **enrollments** - Course enrollments
7. **migrations** - TypeORM tracking

### Indexes:

- Email lookup (users)
- Role filtering (users)
- Full-text search (courses)
- Sequence ordering (modules)
- Transaction lookup (payment_claims)
- Enrollment tracking (enrollments)

### Initial Data:

- 1 Super Admin user
- 1 Migration record

## 🔐 Security Notes

1. **Change admin password** immediately after setup
2. **Backup database** regularly
3. **Use strong passwords** in production
4. **Limit remote access** to specific IPs when possible

## ✅ Success Checklist

- [ ] All 7 tables created
- [ ] Admin user exists
- [ ] Can login with admin credentials
- [ ] Application connects successfully
- [ ] No errors in logs
- [ ] Changed default admin password

## 📞 Need Help?

If you encounter issues:

1. Check MariaDB error logs
2. Verify user permissions
3. Test connection with `mysql` command
4. Share error messages for support
