.PHONY: help build up down restart logs ps clean backup

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build: ## Build Docker images
	docker-compose build --no-cache

up: ## Start all services in production mode
	docker-compose up -d
	@echo "Waiting for services to be healthy..."
	@sleep 10
	@make ps

down: ## Stop all services
	docker-compose down

restart: ## Restart all services
	docker-compose restart

logs: ## Show logs (all services)
	docker-compose logs -f

logs-app: ## Show application logs only
	docker-compose logs -f app1 app2 app3

logs-nginx: ## Show nginx logs only
	docker-compose logs -f nginx

logs-db: ## Show database logs
	docker-compose logs -f mongodb redis

ps: ## Show running containers
	docker-compose ps

stats: ## Show resource usage
	docker stats --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"

clean: ## Remove containers, volumes, and images
	docker-compose down -v --rmi all

clean-volumes: ## Remove only volumes (WARNING: deletes all data)
	docker-compose down -v

dev: ## Start development environment
	docker-compose -f docker-compose.dev.yml up -d

dev-down: ## Stop development environment
	docker-compose -f docker-compose.dev.yml down

shell-app: ## Open shell in app container
	docker-compose exec app1 sh

shell-mongo: ## Open MongoDB shell
	docker-compose exec mongodb mongosh -u admin -p admin123 --authenticationDatabase admin

shell-redis: ## Open Redis CLI
	docker-compose exec redis redis-cli -a redis123

backup: ## Backup MongoDB and Redis data
	@echo "Creating backup..."
	@mkdir -p ./backups
	@docker-compose exec -T mongodb mongodump --out /tmp/backup --authenticationDatabase admin -u admin -p admin123
	@docker cp lms_mongodb:/tmp/backup ./backups/mongodb_$(shell date +%Y%m%d_%H%M%S)
	@docker-compose exec -T redis redis-cli -a redis123 SAVE
	@docker cp lms_redis:/data/dump.rdb ./backups/redis_$(shell date +%Y%m%d_%H%M%S).rdb
	@echo "Backup completed!"

restore-mongo: ## Restore MongoDB from backup (specify BACKUP_DIR=./backups/mongodb_xxx)
	@test -n "$(BACKUP_DIR)" || (echo "Please specify BACKUP_DIR=./backups/mongodb_xxx" && exit 1)
	docker cp $(BACKUP_DIR) lms_mongodb:/tmp/restore
	docker-compose exec mongodb mongorestore /tmp/restore --authenticationDatabase admin -u admin -p admin123

health: ## Check health of all services
	@echo "Checking service health..."
	@docker-compose ps
	@echo ""
	@curl -s http://localhost/health || echo "Nginx health check failed"

test-load: ## Test load balancing (sends 20 requests)
	@echo "Testing load balancing..."
	@for i in $$(seq 1 20); do \
		curl -s http://localhost/api/v1 > /dev/null && echo "Request $$i: OK" || echo "Request $$i: FAILED"; \
	done

update: ## Update application (git pull, rebuild, restart)
	git pull origin main
	docker-compose build --no-cache
	docker-compose up -d
	@echo "Update completed!"

prune: ## Clean up unused Docker resources
	docker system prune -af --volumes

install: ## Initial setup (copy env, build, start)
	cp .env.docker .env
	@echo "Please edit .env file with your credentials before continuing..."
	@echo "Press Enter when ready..."
	@read dummy
	make build
	make up
	@echo "Installation completed! Access the app at http://localhost"
