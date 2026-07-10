# Docker Deployment Guide

## 📦 Overview

This LMS platform is fully containerized using Docker with the following architecture:

- **3x NestJS App Instances** (800MB RAM each, 1.5 CPU cores) - Load balanced
- **1x MongoDB** (3.5GB RAM) - Primary database
- **1x Redis** (1GB RAM) - Caching layer
- **1x Nginx** (256MB RAM) - Reverse proxy & load balancer

**Total Resource Allocation:**

- Memory: ~7.4GB / 8GB
- CPU: All 6 cores utilized
- Storage: Persistent volumes for data

## 🚀 Quick Start

### Prerequisites on VPS

1. **Install Docker**

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

2. **Install Docker Compose**

```bash
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
docker-compose --version
```

### Initial Setup

1. **Clone the repository**

```bash
cd /opt
git clone <your-repo-url> lms-platform
cd lms-platform
```

2. **Configure environment**

```bash
cp .env.docker .env
nano .env  # Edit with your secure credentials
```

**Important:** Change these values in `.env`:

- `MONGO_ROOT_PASSWORD` - Strong MongoDB password
- `REDIS_PASSWORD` - Strong Redis password
- `JWT_SECRET` - 32+ character random string
- `JWT_REFRESH_SECRET` - Different 32+ character random string

3. **Build and start services**

```bash
# Production (all services with load balancing)
docker-compose up -d --build

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

## 🔧 Docker Commands

### Service Management

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Restart specific service
docker-compose restart app1

# View logs for specific service
docker-compose logs -f nginx

# View logs for all services
docker-compose logs -f

# Scale app instances (if needed)
docker-compose up -d --scale app=5
```

### Monitoring

```bash
# Check resource usage
docker stats

# Check container health
docker-compose ps

# Inspect specific container
docker inspect lms_app_1

# Execute command in container
docker-compose exec app1 sh
docker-compose exec mongodb mongosh
```

### Data Management

```bash
# Backup MongoDB
docker-compose exec mongodb mongodump --out /backup --authenticationDatabase admin -u admin -p your_password

# Restore MongoDB
docker-compose exec mongodb mongorestore /backup --authenticationDatabase admin -u admin -p your_password

# Backup Redis
docker-compose exec redis redis-cli --pass redis123 SAVE

# View volumes
docker volume ls

# Backup volume data
docker run --rm -v lms_mongodb_data:/data -v $(pwd):/backup alpine tar czf /backup/mongodb_backup.tar.gz /data
```

## 🌐 Nginx Load Balancing

### Load Balancing Configuration

The setup uses **least_conn** algorithm:

- Distributes traffic to the instance with fewest active connections
- 3 app instances handle requests in parallel
- Automatic health checks every 30 seconds
- Failed instances are removed from pool (max 3 failures)

### Testing Load Balancing

```bash
# Send multiple requests
for i in {1..10}; do
  curl http://your-vps-ip/api/v1
done

# Check which container handled the request (view logs)
docker-compose logs --tail=20 app1 app2 app3
```

### Rate Limiting

Built-in rate limiting:

- **API endpoints**: 10 requests/second per IP
- **Login endpoint**: 5 requests/minute per IP
- **Concurrent connections**: 10 per IP

## 🔒 SSL/TLS Setup (Production)

### Using Let's Encrypt (Recommended)

1. **Install Certbot**

```bash
sudo apt update
sudo apt install certbot
```

2. **Stop Nginx temporarily**

```bash
docker-compose stop nginx
```

3. **Obtain certificate**

```bash
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com
```

4. **Copy certificates**

```bash
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ./nginx/ssl/certificate.crt
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ./nginx/ssl/private.key
sudo chmod 644 ./nginx/ssl/certificate.crt
sudo chmod 600 ./nginx/ssl/private.key
```

5. **Enable HTTPS in Nginx**

```bash
nano nginx/conf.d/default.conf
# Uncomment the HTTPS server block
# Update server_name with your domain
```

6. **Restart services**

```bash
docker-compose up -d
```

7. **Setup auto-renewal**

```bash
sudo crontab -e
# Add: 0 0 1 * * certbot renew --quiet && docker-compose restart nginx
```

## 📊 Resource Monitoring

### Check Resource Usage

```bash
# Real-time stats
docker stats --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"

# Detailed container info
docker-compose exec app1 top
```

### MongoDB Monitoring

```bash
# Connect to MongoDB
docker-compose exec mongodb mongosh -u admin -p your_password --authenticationDatabase admin

# Inside mongosh
use lms_platform
db.stats()
db.serverStatus()
```

### Redis Monitoring

```bash
# Connect to Redis
docker-compose exec redis redis-cli -a redis123

# Inside redis-cli
INFO memory
INFO stats
DBSIZE
```

## 🔄 Updates & Maintenance

### Updating Application

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose build --no-cache
docker-compose up -d

# Clean up old images
docker image prune -a
```

### Zero-Downtime Deployment

```bash
# Scale up to 6 instances
docker-compose up -d --scale app=6 --no-recreate

# Build new image
docker-compose build

# Restart instances one by one
for i in 1 2 3; do
  docker-compose stop app$i
  docker-compose up -d app$i
  sleep 10  # Wait for health check
done

# Scale back to 3
docker-compose up -d --scale app=3
```

## 🐛 Troubleshooting

### App Won't Start

```bash
# Check logs
docker-compose logs app1

# Common issues:
# 1. MongoDB not ready - Wait 30 seconds and restart
# 2. Port already in use - Change port in docker-compose.yml
# 3. Memory limit - Check with 'docker stats'
```

### MongoDB Connection Issues

```bash
# Test connection from app container
docker-compose exec app1 sh
nc -zv mongodb 27017

# Check MongoDB logs
docker-compose logs mongodb
```

### Nginx Not Routing

```bash
# Test nginx config
docker-compose exec nginx nginx -t

# Reload nginx
docker-compose exec nginx nginx -s reload

# Check upstream health
curl http://localhost/health
```

### High Memory Usage

```bash
# Check memory by service
docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}"

# Restart specific service
docker-compose restart app1

# Clear Redis cache if needed
docker-compose exec redis redis-cli -a redis123 FLUSHALL
```

## 🔐 Security Best Practices

1. **Change default passwords** in `.env`
2. **Enable firewall**
   ```bash
   sudo ufw allow 22    # SSH
   sudo ufw allow 80    # HTTP
   sudo ufw allow 443   # HTTPS
   sudo ufw enable
   ```
3. **Disable direct MongoDB/Redis access** from outside
4. **Enable SSL/TLS** for production
5. **Regular backups** of volumes
6. **Update images regularly**
   ```bash
   docker-compose pull
   docker-compose up -d
   ```

## 📈 Performance Tuning

### Increase App Instances

```bash
# Edit docker-compose.yml to add app4, app5, etc.
# Or use scale (note: doesn't persist)
docker-compose up -d --scale app=5
```

### Adjust MongoDB Cache

```bash
# Edit docker-compose.yml
# Change: --wiredTigerCacheSizeGB 3.5
# to higher value if you have more RAM
```

### Adjust Redis Memory

```bash
# Edit docker-compose.yml under redis service
# Change: --maxmemory 1gb
```

## 📝 Health Checks

All services have health checks:

- **App**: HTTP check on `/api/v1` every 30s
- **Nginx**: HTTP check on `/health` every 30s
- **MongoDB**: Internal Docker health check
- **Redis**: Internal Docker health check

View health status:

```bash
docker-compose ps
```

## 🔄 Backup Strategy

### Automated Backup Script

Create `backup.sh`:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/lms_$DATE"

mkdir -p $BACKUP_DIR

# Backup MongoDB
docker-compose exec -T mongodb mongodump --out /tmp/backup --authenticationDatabase admin -u admin -p your_password
docker cp lms_mongodb:/tmp/backup $BACKUP_DIR/mongodb

# Backup Redis
docker-compose exec -T redis redis-cli --pass redis123 SAVE
docker cp lms_redis:/data/dump.rdb $BACKUP_DIR/redis_dump.rdb

# Backup uploads
docker cp lms_app_1:/app/uploads $BACKUP_DIR/uploads

# Compress
tar -czf "/backup/lms_backup_$DATE.tar.gz" $BACKUP_DIR
rm -rf $BACKUP_DIR

# Keep only last 7 days
find /backup -name "lms_backup_*.tar.gz" -mtime +7 -delete
```

Schedule with cron:

```bash
0 2 * * * /opt/lms-platform/backup.sh
```

## 📞 Support

For issues:

1. Check logs: `docker-compose logs -f`
2. Check health: `docker-compose ps`
3. Check resources: `docker stats`
4. Review this guide
