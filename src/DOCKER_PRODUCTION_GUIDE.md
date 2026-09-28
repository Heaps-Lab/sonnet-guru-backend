# Docker Production Deployment Guide

## Server Specifications
- **VPS**: 4vCPU, 6GB RAM
- **OS**: CloudLinux with WHM/cPanel (Root Access)
- **Container**: Docker with Alpine Linux
- **Load Balancer**: Nginx Alpine
- **Issue**: High memory usage causing server crashes under load

## Architecture Overview

```
Internet → Nginx Load Balancer → Multiple Node.js App Instances → MySQL Database
```

## 1. Optimized Docker Setup

### 1.1 Production Dockerfile (Alpine-based)

Create `Dockerfile.prod`:

```dockerfile
# Multi-stage build for production optimization
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./

# Install dependencies (including devDependencies for build)
RUN npm ci --only=production --silent

# Copy source code
COPY src/ ./src/

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

WORKDIR /app

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --only=production --silent && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Create uploads directory with proper permissions
RUN mkdir -p uploads/sheets uploads/teacher-applications && \
    chown -R nestjs:nodejs uploads

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/main.js"]
```

### 1.2 Memory-Optimized Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  # MySQL Database with optimized settings
  mysql:
    image: mysql:8.0-debian
    container_name: sonnet_mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_PASSWORD}
      MYSQL_DATABASE: ${DB_NAME}
      MYSQL_USER: ${DB_USERNAME}
      MYSQL_PASSWORD: ${DB_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
      - ./mysql-config/my.cnf:/etc/mysql/conf.d/custom.cnf:ro
      - ./database-setup.sql:/docker-entrypoint-initdb.d/01-setup.sql:ro
    networks:
      - sonnet_network
    ports:
      - "3306:3306"
    command: >
      --innodb-buffer-pool-size=1G
      --max-connections=100
      --innodb-log-file-size=256M
      --query-cache-size=0
      --query-cache-type=0
    mem_limit: 1.5g
    mem_reservation: 1g
    cpus: 1.5

  # Application instances (3 instances for load distribution)
  app1:
    build:
      context: .
      dockerfile: Dockerfile.prod
    container_name: sonnet_app1
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 3000
      DB_HOST: mysql
      DB_PORT: 3306
      DB_NAME: ${DB_NAME}
      DB_USERNAME: ${DB_USERNAME}
      DB_PASSWORD: ${DB_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      EMAIL_HOST: ${EMAIL_HOST}
      EMAIL_PORT: ${EMAIL_PORT}
      EMAIL_USER: ${EMAIL_USER}
      EMAIL_PASSWORD: ${EMAIL_PASSWORD}
    volumes:
      - app_uploads:/app/uploads
    networks:
      - sonnet_network
    depends_on:
      - mysql
    mem_limit: 800m
    mem_reservation: 400m
    cpus: 0.8

  app2:
    build:
      context: .
      dockerfile: Dockerfile.prod
    container_name: sonnet_app2
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 3000
      DB_HOST: mysql
      DB_PORT: 3306
      DB_NAME: ${DB_NAME}
      DB_USERNAME: ${DB_USERNAME}
      DB_PASSWORD: ${DB_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      EMAIL_HOST: ${EMAIL_HOST}
      EMAIL_PORT: ${EMAIL_PORT}
      EMAIL_USER: ${EMAIL_USER}
      EMAIL_PASSWORD: ${EMAIL_PASSWORD}
    volumes:
      - app_uploads:/app/uploads
    networks:
      - sonnet_network
    depends_on:
      - mysql
    mem_limit: 800m
    mem_reservation: 400m
    cpus: 0.8

  app3:
    build:
      context: .
      dockerfile: Dockerfile.prod
    container_name: sonnet_app3
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 3000
      DB_HOST: mysql
      DB_PORT: 3306
      DB_NAME: ${DB_NAME}
      DB_USERNAME: ${DB_USERNAME}
      DB_PASSWORD: ${DB_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      EMAIL_HOST: ${EMAIL_HOST}
      EMAIL_PORT: ${EMAIL_PORT}
      EMAIL_USER: ${EMAIL_USER}
      EMAIL_PASSWORD: ${EMAIL_PASSWORD}
    volumes:
      - app_uploads:/app/uploads
    networks:
      - sonnet_network
    depends_on:
      - mysql
    mem_limit: 800m
    mem_reservation: 400m
    cpus: 0.8

  # Nginx Load Balancer
  nginx:
    image: nginx:alpine
    container_name: sonnet_nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - app_uploads:/var/www/uploads:ro
    networks:
      - sonnet_network
    depends_on:
      - app1
      - app2
      - app3
    mem_limit: 200m
    cpus: 0.4

  # Redis for session management and caching (optional but recommended)
  redis:
    image: redis:7-alpine
    container_name: sonnet_redis
    restart: unless-stopped
    volumes:
      - redis_data:/data
    networks:
      - sonnet_network
    mem_limit: 200m
    cpus: 0.2
    command: redis-server --maxmemory 150mb --maxmemory-policy allkeys-lru

volumes:
  mysql_data:
  redis_data:
  app_uploads:

networks:
  sonnet_network:
    driver: bridge
```

## 2. Nginx Load Balancer Configuration

### 2.1 Main Nginx Config (`nginx/nginx.conf`)

```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log notice;
pid /var/run/nginx.pid;

# Optimize for 4vCPU
worker_rlimit_nofile 65535;

events {
    worker_connections 2048;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    # Logging format
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                   '$status $body_bytes_sent "$http_referer" '
                   '"$http_user_agent" "$http_x_forwarded_for" '
                   'rt=$request_time uct="$upstream_connect_time" '
                   'uht="$upstream_header_time" urt="$upstream_response_time"';

    access_log /var/log/nginx/access.log main;

    # Performance optimizations
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 50M;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
    
    # Upstream configuration
    upstream sonnet_backend {
        least_conn;
        server app1:3000 max_fails=3 fail_timeout=30s weight=1;
        server app2:3000 max_fails=3 fail_timeout=30s weight=1;
        server app3:3000 max_fails=3 fail_timeout=30s weight=1;
        keepalive 32;
    }

    include /etc/nginx/conf.d/*.conf;
}
```

### 2.2 App Configuration (`nginx/conf.d/sonnet.conf`)

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # Security headers
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Rate limiting
    location /api/v1/auth/login {
        limit_req zone=login burst=10 nodelay;
        proxy_pass http://sonnet_backend;
        include /etc/nginx/conf.d/proxy_params;
    }
    
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://sonnet_backend;
        include /etc/nginx/conf.d/proxy_params;
    }
    
    # Static file serving
    location /uploads/ {
        alias /var/www/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        
        # Security for uploaded files
        location ~* \.(php|php3|php4|php5|phtml|pl|py|jsp|asp|sh|cgi)$ {
            deny all;
        }
    }
    
    # Health check
    location /health {
        proxy_pass http://sonnet_backend/health;
        access_log off;
    }
    
    # Default location
    location / {
        proxy_pass http://sonnet_backend;
        include /etc/nginx/conf.d/proxy_params;
    }
}
```

### 2.3 Proxy Parameters (`nginx/conf.d/proxy_params`)

```nginx
proxy_set_header Host $http_host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;

proxy_connect_timeout 5s;
proxy_send_timeout 60s;
proxy_read_timeout 60s;

proxy_buffering on;
proxy_buffer_size 4k;
proxy_buffers 8 4k;
proxy_busy_buffers_size 8k;

proxy_http_version 1.1;
proxy_set_header Connection "";
```

## 3. MySQL Optimization Configuration

### 3.1 MySQL Config (`mysql-config/my.cnf`)

```ini
[mysqld]
# Memory settings for 6GB RAM VPS (allocate 1.5GB to MySQL)
innodb_buffer_pool_size = 1G
innodb_log_buffer_size = 16M
innodb_log_file_size = 256M

# Connection settings
max_connections = 100
max_user_connections = 95
thread_cache_size = 16
table_open_cache = 2000

# Query cache (disabled for better performance in MySQL 8.0)
query_cache_type = 0
query_cache_size = 0

# InnoDB settings
innodb_flush_log_at_trx_commit = 2
innodb_file_per_table = 1
innodb_flush_method = O_DIRECT

# Slow query log
slow_query_log = 1
long_query_time = 2
slow_query_log_file = /var/log/mysql/slow.log

# Binary log settings
binlog_format = ROW
expire_logs_days = 7
max_binlog_size = 100M
```

## 4. Application Memory Optimization

### 4.1 Node.js Optimization Script (`scripts/optimize-node.sh`)

```bash
#!/bin/bash

# Set Node.js memory limits for 800MB container limit
export NODE_OPTIONS="--max-old-space-size=600 --max-semi-space-size=64"

# Enable garbage collection optimization
export NODE_ENV=production

# Start the application
exec "$@"
```

### 4.2 PM2 Configuration (Alternative to Docker if needed)

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'sonnet-guru-api',
    script: './dist/main.js',
    instances: 3,
    exec_mode: 'cluster',
    max_memory_restart: '600MB',
    env: {
      NODE_ENV: 'production',
      NODE_OPTIONS: '--max-old-space-size=600'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

## 5. Monitoring and Health Checks

### 5.1 Health Check Endpoint

Add to `src/app.controller.ts`:

```typescript
@Get('health')
getHealth() {
  const memUsage = process.memoryUsage();
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    memory: {
      used: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      total: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`
    },
    uptime: process.uptime()
  };
}
```

### 5.2 Docker Health Checks

Add to your `Dockerfile.prod`:

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node healthcheck.js || exit 1
```

Create `healthcheck.js`:

```javascript
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/health',
  timeout: 5000,
};

const request = http.request(options, (res) => {
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

request.on('error', () => {
  process.exit(1);
});

request.end();
```

## 6. Deployment Commands

### 6.1 Initial Deployment

```bash
# 1. Clone repository
git clone <your-repo-url> /opt/sonnet-guru-backend
cd /opt/sonnet-guru-backend

# 2. Create environment file
cp .env.example .env.prod
# Edit .env.prod with production values

# 3. Build and start services
docker-compose -f docker-compose.prod.yml up -d --build

# 4. Check logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 6.2 Update Deployment

```bash
# 1. Pull latest changes
git pull origin main

# 2. Rebuild and restart
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build

# 3. Clean up old images
docker image prune -f
```

### 6.3 Monitoring Commands

```bash
# Monitor resource usage
docker stats

# Check container health
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f app1

# Monitor MySQL performance
docker exec -it sonnet_mysql mysql -u root -p -e "SHOW PROCESSLIST;"
```

## 7. Performance Optimizations

### 7.1 System Level Optimizations

```bash
# Increase file descriptor limits
echo "* soft nofile 65535" >> /etc/security/limits.conf
echo "* hard nofile 65535" >> /etc/security/limits.conf

# Optimize TCP settings
echo "net.core.somaxconn = 65535" >> /etc/sysctl.conf
echo "net.ipv4.tcp_max_syn_backlog = 65535" >> /etc/sysctl.conf
sysctl -p
```

### 7.2 Database Connection Pooling

Update your TypeORM configuration:

```typescript
// src/config/typeorm.config.ts
export const typeOrmConfig: TypeOrmModuleOptions = {
  // ... other config
  extra: {
    connectionLimit: 20,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true,
  },
};
```

## 8. Backup Strategy

### 8.1 Automated Backup Script

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/opt/backups/sonnet-guru"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
docker exec sonnet_mysql mysqldump -u root -p${DB_PASSWORD} ${DB_NAME} > $BACKUP_DIR/db_backup_$DATE.sql

# Backup uploads
tar -czf $BACKUP_DIR/uploads_backup_$DATE.tar.gz -C /var/lib/docker/volumes/sonnet-guru-backend_app_uploads/_data .

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

## 9. Troubleshooting

### 9.1 High Memory Usage

```bash
# Check memory usage by container
docker stats --no-stream

# Restart high-memory containers
docker-compose -f docker-compose.prod.yml restart app1

# Check for memory leaks
docker exec -it sonnet_app1 node -e "console.log(process.memoryUsage())"
```

### 9.2 Database Performance Issues

```bash
# Check slow queries
docker exec -it sonnet_mysql mysql -u root -p -e "SELECT * FROM information_schema.processlist WHERE command != 'Sleep';"

# Optimize tables
docker exec -it sonnet_mysql mysql -u root -p -e "OPTIMIZE TABLE courses, modules, quizzes;"
```

This configuration should handle your VPS resources efficiently and prevent memory-related crashes while maintaining good performance under load.