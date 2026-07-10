# Docker Setup - Quick Reference

## 🎯 Architecture Overview

```
                           Internet
                              |
                         [Nginx :80/443]
                         Load Balancer
                    (Round-robin/Least-conn)
                              |
         +--------------------|--------------------+
         |                    |                    |
    [App1 :3000]        [App2 :3000]        [App3 :3000]
    NestJS Instance     NestJS Instance     NestJS Instance
    (800MB, 1.5 CPU)    (800MB, 1.5 CPU)    (800MB, 1.5 CPU)
         |                    |                    |
         +--------------------|--------------------+
                              |
                    +---------+---------+
                    |                   |
            [MongoDB :27017]      [Redis :6379]
            (3.5GB RAM)           (1GB RAM, LRU)
            Persistent DB         Cache Layer
```

## 📊 Resource Allocation

| Service    | Memory  | CPU  | Storage | Replicas |
| ---------- | ------- | ---- | ------- | -------- |
| MongoDB    | 3.5 GB  | Auto | Volume  | 1        |
| Redis      | 1 GB    | Auto | Volume  | 1        |
| App (each) | 800 MB  | 1.5  | Volume  | 3        |
| Nginx      | 256 MB  | 0.5  | Volume  | 1        |
| **Total**  | ~7.4 GB | 6    | -       | 6        |

## 🚀 Quick Commands

### Initial Setup

```bash
# 1. Install Docker & Docker Compose on VPS
curl -fsSL https://get.docker.com | sh

# 2. Clone and setup
git clone <repo> lms-platform && cd lms-platform
make install  # Interactive setup

# Or manual:
cp .env.docker .env
nano .env  # Edit credentials
make build
make up
```

### Daily Operations

```bash
make up          # Start all services
make down        # Stop all services
make restart     # Restart services
make logs        # View all logs
make logs-app    # View app logs only
make ps          # Show status
make stats       # Show resource usage
make health      # Check health
```

### Development

```bash
make dev         # Start dev environment (MongoDB + Redis + 1 App)
make dev-down    # Stop dev environment
```

### Maintenance

```bash
make backup      # Backup MongoDB + Redis
make update      # Pull code, rebuild, restart
make clean       # Remove everything (careful!)
make prune       # Clean unused Docker resources
```

### Debugging

```bash
make shell-app   # Open shell in app container
make shell-mongo # Open MongoDB shell
make shell-redis # Open Redis CLI
make test-load   # Test load balancing
```

## 🔑 Environment Variables (.env)

### Required Changes

```bash
# CHANGE THESE BEFORE DEPLOYMENT!
MONGO_ROOT_PASSWORD=your_secure_password_here
REDIS_PASSWORD=your_redis_password_here
JWT_SECRET=minimum_32_character_random_string_here
JWT_REFRESH_SECRET=different_32_character_string_here
```

### Optional Configuration

```bash
# Database
MONGO_DATABASE=lms_platform  # Database name

# App Settings
NODE_ENV=production
PORT=3000
API_PREFIX=api/v1
CORS_ORIGIN=*  # Change to your domain in production

# File Upload
MAX_FILE_SIZE=10485760  # 10MB in bytes
CDN_BASE_URL=https://cdn.yourdomain.com

# Rate Limiting
THROTTLE_TTL=60    # seconds
THROTTLE_LIMIT=10  # requests per TTL
```

## 🌐 Accessing Services

### From Host Machine

```bash
# API (via Nginx)
http://localhost or http://your-vps-ip
http://localhost/api/v1/auth/login

# Direct access (for debugging)
MongoDB: localhost:27017
Redis: localhost:6379
```

### From Inside Docker Network

```bash
# Services communicate via service names
mongodb:27017
redis:6379
app1:3000, app2:3000, app3:3000
nginx:80
```

## 🔧 Configuration Files

### Core Files

- `docker-compose.yml` - Production setup (3 apps, load balanced)
- `docker-compose.dev.yml` - Development setup (1 app)
- `Dockerfile` - App image definition (Alpine-based)
- `.dockerignore` - Files excluded from image
- `Makefile` - Command shortcuts

### Nginx Configuration

- `nginx/nginx.conf` - Main Nginx config
- `nginx/conf.d/default.conf` - Server blocks and routing
- `nginx/ssl/` - SSL certificates (add your own)

## 🔒 SSL/TLS Setup

### Option 1: Let's Encrypt (Free)

```bash
# Install certbot
sudo apt install certbot

# Stop nginx temporarily
make down

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ./nginx/ssl/certificate.crt
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ./nginx/ssl/private.key

# Enable HTTPS in nginx/conf.d/default.conf (uncomment HTTPS block)
nano nginx/conf.d/default.conf

# Restart
make up

# Auto-renewal cron
0 0 1 * * certbot renew --quiet && cd /opt/lms-platform && make restart
```

### Option 2: Commercial Certificate

```bash
# Copy your certificates
cp your-cert.crt ./nginx/ssl/certificate.crt
cp your-private.key ./nginx/ssl/private.key
chmod 644 ./nginx/ssl/certificate.crt
chmod 600 ./nginx/ssl/private.key

# Enable HTTPS in nginx config
nano nginx/conf.d/default.conf  # Uncomment HTTPS block

# Restart
make restart
```

## 📊 Monitoring

### Real-time Stats

```bash
make stats  # Docker stats with formatting

# Or detailed:
docker stats --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}\t{{.BlockIO}}"
```

### Application Logs

```bash
make logs           # All services
make logs-app       # App instances only
make logs-nginx     # Nginx only
make logs-db        # MongoDB + Redis

# Follow specific container
docker logs -f lms_app_1

# Last 100 lines
docker logs --tail 100 lms_nginx
```

### Database Monitoring

```bash
# MongoDB
make shell-mongo
> use lms_platform
> db.stats()
> db.serverStatus().connections

# Redis
make shell-redis
> INFO memory
> INFO stats
> DBSIZE
```

## 🔄 Scaling

### Add More App Instances

Edit `docker-compose.yml` and add:

```yaml
app4:
  # Copy app3 configuration
  container_name: lms_app_4
  # ... rest of config
```

Update Nginx upstream block in `nginx/nginx.conf`:

```nginx
upstream lms_backend {
    server app1:3000;
    server app2:3000;
    server app3:3000;
    server app4:3000;  # Add new instance
}
```

Restart:

```bash
make up
```

### Temporary Scaling (doesn't persist)

```bash
docker-compose up -d --scale app=5
```

## 💾 Backup & Restore

### Backup

```bash
# Automated backup (saves to ./backups/)
make backup

# Manual MongoDB backup
docker-compose exec mongodb mongodump \
  --out /backup \
  --authenticationDatabase admin \
  -u admin -p your_password

# Manual Redis backup
docker-compose exec redis redis-cli -a redis123 SAVE
```

### Restore

```bash
# MongoDB
make restore-mongo BACKUP_DIR=./backups/mongodb_20240710_120000

# Redis
docker cp ./backups/redis_20240710_120000.rdb lms_redis:/data/dump.rdb
docker-compose restart redis
```

### Automated Backup Script

Create `/etc/cron.daily/lms-backup`:

```bash
#!/bin/bash
cd /opt/lms-platform
/usr/bin/make backup
find ./backups -type f -mtime +7 -delete  # Keep 7 days
```

## 🔥 Troubleshooting

### Services Won't Start

```bash
# Check logs
make logs

# Check individual service
docker logs lms_app_1
docker logs lms_mongodb

# Common fixes:
docker-compose down    # Stop everything
docker system prune    # Clean up
make up                # Start fresh
```

### Out of Memory

```bash
# Check usage
make stats

# Free up memory
docker system prune -a --volumes  # WARNING: removes volumes!

# Reduce app instances in docker-compose.yml
# Change from 3 to 2 instances
```

### MongoDB Connection Failed

```bash
# Test connectivity
docker-compose exec app1 nc -zv mongodb 27017

# Check MongoDB is running
docker-compose ps mongodb

# Restart MongoDB
docker-compose restart mongodb

# Check auth
docker-compose exec mongodb mongosh \
  -u admin -p your_password \
  --authenticationDatabase admin
```

### Nginx 502 Bad Gateway

```bash
# Check app health
docker-compose ps

# Test app directly
curl http://localhost:3000/api/v1

# Check nginx config
docker-compose exec nginx nginx -t

# View nginx error logs
docker logs lms_nginx

# Restart nginx
docker-compose restart nginx
```

### Port Already in Use

```bash
# Find what's using the port
sudo lsof -i :80
sudo lsof -i :27017

# Kill the process or change port in docker-compose.yml
ports:
  - "8080:80"  # Use 8080 instead of 80
```

## 🔐 Security Checklist

- [ ] Change all default passwords in `.env`
- [ ] Enable firewall (ufw/iptables)
- [ ] Configure SSL/TLS certificates
- [ ] Restrict MongoDB/Redis ports (don't expose publicly)
- [ ] Set strong JWT secrets (32+ characters)
- [ ] Enable HTTPS redirect in Nginx
- [ ] Regular backups (automated cron)
- [ ] Keep Docker images updated
- [ ] Use `.env` file (never commit to git)
- [ ] Configure CORS properly (not `*` in production)

## 📈 Performance Tips

1. **Monitor regularly**: `make stats`
2. **Check logs**: `make logs` for errors
3. **Keep images updated**: `docker-compose pull && make up`
4. **Optimize MongoDB indexes**: Run explain() on slow queries
5. **Monitor Redis memory**: Should stay under 1GB
6. **Use CDN for static files**: Don't serve through app
7. **Enable gzip**: Already configured in Nginx
8. **Database connection pooling**: Already configured in Mongoose

## 🆘 Emergency Commands

```bash
# Stop everything immediately
docker-compose down

# Restart everything
make restart

# Check what's running
docker ps -a

# Force remove stuck containers
docker rm -f $(docker ps -aq)

# Nuclear option (removes EVERYTHING)
docker system prune -af --volumes
```

## 📚 Additional Resources

- Full deployment guide: `DEPLOYMENT_GUIDE.md`
- Project setup: `PROJECT_SETUP.md`
- Main README: `README.md`
- Docker Compose docs: https://docs.docker.com/compose/
- Nginx docs: https://nginx.org/en/docs/
