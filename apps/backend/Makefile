.PHONY: help install dev build start clean test db-up db-down db-migrate db-seed docker-build docker-up docker-down logs

# Default target
help:
	@echo "Available commands:"
	@echo "  make install      - Install dependencies"
	@echo "  make dev          - Start development server with hot reload"
	@echo "  make build        - Build TypeScript to JavaScript"
	@echo "  make start        - Start production server"
	@echo "  make test         - Run tests"
	@echo "  make typecheck    - Run TypeScript type checking"
	@echo "  make clean        - Clean build artifacts"
	@echo ""
	@echo "Database commands:"
	@echo "  make db-generate  - Generate Prisma client"
	@echo "  make db-migrate   - Run database migrations"
	@echo "  make db-seed      - Seed database with initial data"
	@echo "  make db-studio    - Open Prisma Studio"
	@echo "  make db-reset     - Reset database (WARNING: deletes all data)"
	@echo ""
	@echo "Docker commands:"
	@echo "  make docker-build - Build Docker image"
	@echo "  make docker-up    - Start services with docker-compose"
	@echo "  make docker-down  - Stop services"
	@echo "  make docker-logs  - View logs"
	@echo "  make docker-shell - Open shell in backend container"

# Installation
install:
	npm install

# Development
dev:
	npm run dev

# Build
build:
	npm run build

# Start production
start:
	npm start

# Clean
clean:
	rm -rf dist node_modules coverage .nyc_output
	npm cache clean --force

# Testing
test:
	npm test

test-watch:
	npm run test:watch

test-unit:
	npm run test:unit

test-integration:
	npm run test:integration

# Type checking
typecheck:
	npm run typecheck

# Database
db-generate:
	npm run db:generate

db-migrate:
	npm run db:migrate

db-seed:
	npm run db:seed

db-studio:
	npm run db:studio

db-reset:
	@echo "⚠️  WARNING: This will delete all data!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		npx prisma migrate reset --force; \
	fi

# Docker
docker-build:
	docker build -t sbts-backend:latest .

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

docker-logs:
	docker-compose logs -f backend

docker-shell:
	docker-compose exec backend sh

docker-restart:
	docker-compose restart backend

docker-clean:
	docker-compose down -v
	docker rmi sbts-backend:latest

# Quick setup for new developers
setup: install db-generate db-migrate db-seed
	@echo "✅ Setup complete! Run 'make dev' to start development."

# Production deployment preparation
prepare-deploy: clean install build
	@echo "✅ Build ready for deployment!"
