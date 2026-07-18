# 🚀 cPanel Deployment Guide - LMS Platform

## 📋 Prerequisites

- cPanel access with SSH enabled
- Node.js/Bun support (via Node.js Selector or custom install)
- MySQL/MariaDB database already created
- Domain or subdomain configured

## 🎯 Deployment Options

### Option A: Node.js App in cPanel (Recommended)

### Option B: Manual deployment via SSH

### Option C: Using PM2 process manager

---

## 📦 Option A: Using cPanel Node.js Selector

### Step 1: Setup Database

1. **Login to cPanel**
2. Go to **MySQL® Databases**
3. Database should already exist: `sonnetguru_LMS`
4. Note credentials:
   - Username: `sonnetguru_LMS`
   - Password: `?D#+D6WJjI4]A^1o`
   - Host: `localhost` or `144.79.249.3`

### Step 2: Import Database Schema

1. Go to **phpMyAdmin** in cPanel
2. Select database: `sonnetguru_LMS`
3. Click **SQL** tab
4. Copy contents of `database-setup.sql` file
5. Paste and click **Go**
6. Wait for "Query executed successfully"
7. Verify tables in left sidebar

### Step 3: Upload Project Files

**Method 1: Using File Manager**

1. Go to **File Manager** in cPanel
2. Navigate to `public_html` or create subdomain folder
3. Create folder: `lms-api` (or your preferred name)
4. Upload project as ZIP file
5. Extract the ZIP file
6. Delete the ZIP after extraction

**Method 2: Using FTP/SFTP**

```bash
# From your local machine
sftp username@yourdomain.com

# Navigate to directory
cd public_html/lms-api

# Upload files
put -r /path/to/sonnet-guru-backend/*
```

**Method 3: Using Git (Best)**

```bash
# SSH into cPanel
ssh username@yourdomain.com

# Navigate to directory
cd public_html
mkdir lms-api && cd lms-api

# Clone repository
git clone <your-repo-url> .

# Or initialize git and pull
git init
git remote add origin <your-repo-url>
git pull origin main
```

### Step 4: Setup Environment File

1. In File Manager, navigate to your project folder
2. Create file: `.env`
3. Add configuration:

```env
# Application
NODE_ENV=production
PORT=3000
API_PREFIX=api/v1

# MySQL Database
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=sonnetguru_LMS
DB_PASSWORD=?D#+D6WJjI4]A^1o
DB_DATABASE=sonnetguru_LMS

# Redis (if available, otherwise comment out)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT - CHANGE THESE!
JWT_SECRET=change-this-to-random-32-character-string-now-12345678
JWT_EXPIRATION=7d
JWT_REFRESH_SECRET=change-this-to-different-32-character-string-9876
JWT_REFRESH_EXPIRATION=30d

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DESTINATION=./uploads

# CDN & Storage
CDN_BASE_URL=https://yourdomain.com
STORAGE_TYPE=local

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=10

# CORS
CORS_ORIGIN=*

# Payment Gateway
BKASH_APP_KEY=
BKASH_APP_SECRET=
NAGAD_MERCHANT_ID=
```

### Step 5: Setup Node.js Application

1. Go to **Setup Node.js App** in cPanel
2. Click **CREATE APPLICATION**
3. Configure:
   - **Node.js version:** 18.x or higher
   - **Application mode:** Production
   - **Application root:** `lms-api` (your folder)
   - **Application URL:** `yourdomain.com` or subdomain
   - **Application startup file:** `dist/main.js`
   - **Passenger log file:** Leave default

4. Click **CREATE**

### Step 6: Install Dependencies & Build

1. After app creation, click **Run NPM Install**
2. Or use **Terminal** in cPanel:

```bash
cd ~/public_html/lms-api

# Install Bun (if not installed)
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc

# Install dependencies
bun install

# Build the application
bun run build

# Run migrations
bun run migration:run

# Create admin user
bun run seed:admin
```

### Step 7: Configure Startup Command

In cPanel Node.js App settings:

1. **Application startup file:** Change to `dist/main.js`
2. Or set **Custom startup command:**
   ```bash
   bun run start:prod
   ```
3. Click **RESTART**

### Step 8: Setup .htaccess (Important!)

Create `.htaccess` in your application root:

```apache
# Disable directory browsing
Options -Indexes

# Force HTTPS (optional)
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Proxy to Node.js app
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]
```

### Step 9: Test the Application

```bash
# Via terminal
curl http://localhost:3000/api/v1

# Or visit in browser
https://yourdomain.com/api/v1
```

---

## 🔧 Option B: Manual SSH Deployment

### Step 1: SSH into Server

```bash
ssh username@yourdomain.com
cd ~/public_html
```

### Step 2: Install Bun Runtime

```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash

# Reload shell
source ~/.bashrc

# Verify
bun --version
```

### Step 3: Clone & Setup Project

```bash
# Clone repository
git clone <your-repo-url> lms-api
cd lms-api

# Copy environment file
cp .env.example .env
nano .env  # Edit with your values

# Install dependencies
bun install

# Build application
bun run build
```

### Step 4: Setup Database

```bash
# Import database schema
mysql -u sonnetguru_LMS -p sonnetguru_LMS < database-setup.sql

# Verify tables
mysql -u sonnetguru_LMS -p -e "USE sonnetguru_LMS; SHOW TABLES;"
```

### Step 5: Run Application with PM2

```bash
# Install PM2
bun add -g pm2

# Start application
pm2 start bun --name "lms-api" -- run start:prod

# Save PM2 process list
pm2 save

# Setup PM2 to start on boot
pm2 startup

# Check status
pm2 status
pm2 logs lms-api
```

### Step 6: Configure Nginx/Apache Proxy

If you have access to web server config:

**Apache (.htaccess):**

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]
```

**Nginx:**

```nginx
location /api {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

---

## 🎯 Option C: Using PM2 Ecosystem File

### Step 1: Create Ecosystem File

Create `ecosystem.config.js` in project root:

```javascript
module.exports = {
  apps: [
    {
      name: 'lms-api',
      script: 'bun',
      args: 'run start:prod',
      instances: 2,
      exec_mode: 'cluster',
      max_memory_restart: '800M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
    },
  ],
};
```

### Step 2: Deploy with PM2

```bash
# Create logs directory
mkdir -p logs

# Start with ecosystem file
pm2 start ecosystem.config.js

# Monitor
pm2 monit

# View logs
pm2 logs lms-api
```

---

## 🌐 Domain Configuration

### Subdomain Setup (Recommended)

1. Go to **Subdomains** in cPanel
2. Create: `api.yourdomain.com`
3. Set document root: `public_html/lms-api/public`
4. Update DNS (if external)

### Configure API Access

After deployment, API will be available at:

- `https://yourdomain.com/api/v1`
- Or `https://api.yourdomain.com/v1`

---

## 🔒 SSL/TLS Certificate

### Using cPanel SSL

1. Go to **SSL/TLS Status** in cPanel
2. Select your domain
3. Click **Run AutoSSL**
4. Wait for certificate installation
5. Force HTTPS in `.htaccess`

### Let's Encrypt (Alternative)

```bash
# Install Certbot
sudo yum install certbot  # CentOS/AlmaLinux
# or
sudo apt install certbot  # Ubuntu/Debian

# Get certificate
sudo certbot certonly --webroot -w /home/username/public_html/lms-api -d api.yourdomain.com
```

---

## ✅ Post-Deployment Checklist

- [ ] Database created and imported
- [ ] `.env` file configured with production values
- [ ] Dependencies installed (`bun install`)
- [ ] Application built (`bun run build`)
- [ ] Migrations run (`bun run migration:run`)
- [ ] Admin user created (`bun run seed:admin`)
- [ ] Application started (PM2 or Node.js App)
- [ ] SSL certificate installed
- [ ] Test API endpoint: `curl https://yourdomain.com/api/v1`
- [ ] Test login with admin credentials
- [ ] Changed default admin password
- [ ] Configured CORS for your frontend domain
- [ ] Setup automated backups
- [ ] Monitor logs for errors

---

## 📊 Monitoring & Maintenance

### Check Application Status

```bash
# PM2
pm2 status
pm2 logs lms-api --lines 100

# cPanel Node.js App
# Check via cPanel interface or logs in application root
tail -f logs/error.log
```

### View Database

```bash
# Via MySQL CLI
mysql -u sonnetguru_LMS -p sonnetguru_LMS

# Or use phpMyAdmin in cPanel
```

### Application Logs

```bash
cd ~/public_html/lms-api
tail -f logs/combined.log
tail -f logs/err.log
```

---

## 🔄 Updating the Application

### Method 1: Using Git

```bash
cd ~/public_html/lms-api
git pull origin main
bun install
bun run build
pm2 restart lms-api
```

### Method 2: Manual Upload

1. Build locally: `bun run build`
2. Upload `dist` folder via FTP
3. Restart application in cPanel or PM2

---

## 🐛 Troubleshooting

### Application Won't Start

```bash
# Check logs
pm2 logs lms-api

# Check port availability
netstat -tulpn | grep 3000

# Check Node.js version
node --version

# Rebuild
bun run build
pm2 restart lms-api
```

### Database Connection Error

```bash
# Test connection
mysql -u sonnetguru_LMS -p -h localhost sonnetguru_LMS

# Check .env file
cat .env | grep DB_

# Verify credentials in cPanel MySQL Databases
```

### Permission Errors

```bash
# Fix ownership
chown -R username:username ~/public_html/lms-api

# Fix permissions
chmod -R 755 ~/public_html/lms-api
chmod 644 .env
```

### Port Already in Use

```bash
# Find process
lsof -i :3000

# Kill process
kill -9 <PID>

# Restart
pm2 restart lms-api
```

---

## 📞 Getting Help

### Check These First:

1. Application logs: `pm2 logs` or cPanel logs
2. MySQL error log: `/var/log/mysql/error.log`
3. Apache/Nginx error log: `/var/log/apache2/error.log`
4. cPanel error log in application root

### Useful Commands:

```bash
# System info
uname -a
free -h
df -h

# Process list
ps aux | grep node
ps aux | grep bun

# Network
netstat -tulpn
curl -I http://localhost:3000/api/v1
```

---

## 🎉 Success!

Your LMS API should now be running at:

- **API Endpoint:** `https://yourdomain.com/api/v1`
- **Health Check:** `https://yourdomain.com/api/v1`
- **Admin Login:** Use `admin@lmsplatform.com` / `Admin@123456`

**Next Steps:**

1. Test all API endpoints
2. Change admin password
3. Setup automated backups
4. Configure monitoring
5. Deploy frontend application
