#!/bin/bash

# LMS Platform Deployment Script
# This script automates the deployment process

set -e  # Exit on error

echo "================================================"
echo "  LMS Platform - Automated Deployment Script"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed!${NC}"
    echo "Please install Docker first:"
    echo "curl -fsSL https://get.docker.com | sh"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed!${NC}"
    echo "Please install Docker Compose first."
    exit 1
fi

echo -e "${GREEN}✅ Docker and Docker Compose are installed${NC}"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from template...${NC}"
    cp .env.docker .env
    echo -e "${GREEN}✅ .env file created${NC}"
    echo ""
    echo -e "${YELLOW}📝 Please edit .env file with your secure credentials:${NC}"
    echo "   - DB_ROOT_PASSWORD"
    echo "   - DB_PASSWORD"
    echo "   - REDIS_PASSWORD"
    echo "   - JWT_SECRET"
    echo "   - JWT_REFRESH_SECRET"
    echo ""
    read -p "Press Enter after you've updated .env file..."
fi

echo ""
echo "Starting deployment..."
echo ""

# Build and start services
echo "🔨 Building Docker images..."
docker-compose build --no-cache

echo ""
echo "🚀 Starting services..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 15

# Check service health
echo ""
echo "🔍 Checking service status..."
docker-compose ps

# Wait for MySQL to be ready
echo ""
echo "⏳ Waiting for MySQL to be ready..."
MAX_TRIES=30
COUNT=0
until docker-compose exec -T mysql mysqladmin ping -h localhost -u root -p${DB_ROOT_PASSWORD:-root123} --silent &> /dev/null; do
    COUNT=$((COUNT + 1))
    if [ $COUNT -ge $MAX_TRIES ]; then
        echo -e "${RED}❌ MySQL failed to start after ${MAX_TRIES} attempts${NC}"
        echo "Check logs with: docker-compose logs mysql"
        exit 1
    fi
    echo "Waiting for MySQL... (${COUNT}/${MAX_TRIES})"
    sleep 2
done

echo -e "${GREEN}✅ MySQL is ready!${NC}"

# Run migrations
echo ""
echo "🗄️  Running database migrations..."
docker-compose exec -T app1 bun run migration:run

echo ""
echo "👤 Creating admin user..."
docker-compose exec -T app1 bun run seed:admin

# Final status check
echo ""
echo "🔍 Final health check..."
docker-compose ps

echo ""
echo "================================================"
echo -e "  ${GREEN}✅ Deployment Complete!${NC}"
echo "================================================"
echo ""
echo "🌐 Your LMS Platform is now running!"
echo ""
echo "📍 Access Points:"
echo "   - API: http://localhost/api/v1"
echo "   - Health: http://localhost/health"
echo ""
echo "🔑 Default Admin Credentials:"
echo "   - Email: admin@lmsplatform.com"
echo "   - Password: Admin@123456"
echo "   ⚠️  CHANGE THIS PASSWORD IMMEDIATELY!"
echo ""
echo "📝 Useful Commands:"
echo "   - View logs: docker-compose logs -f"
echo "   - Stop services: docker-compose down"
echo "   - Restart: docker-compose restart"
echo "   - Stats: docker stats"
echo ""
echo "📚 Documentation:"
echo "   - Complete Guide: COMPLETE_SETUP_SUMMARY.md"
echo "   - Docker Guide: DOCKER_README.md"
echo "   - Database: DATABASE_SETUP.md"
echo ""
echo "🎉 Happy coding!"
echo ""
