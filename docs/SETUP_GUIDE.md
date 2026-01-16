# Setup Guide

Complete setup instructions for the O&G Platform application.

## Prerequisites

Install the following before starting:

- **Node.js**: 18+ (recommended: 20.x or 22.x)
  - Download: https://nodejs.org/
- **Go**: 1.23.0+ (toolchain: go1.24.5)
  - Download: https://golang.org/dl/
- **pnpm**: Package manager
  - Install: `npm install -g pnpm`
- **Docker Desktop**: For infrastructure services
  - Download: https://www.docker.com/products/docker-desktop/

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd og_application
   ```

2. **Start infrastructure services**
   ```bash
   cd backend/og-backend
   docker-compose --profile infrastructure up -d
   ```

3. **Configure environment variables**
   - Copy `.env.example` to `.env` in each service directory
   - Fill in required values (see Environment Variables section)

4. **Install dependencies and start services**
   - Follow service-specific setup instructions below

## Service Setup

### Backend: OG Backend

**Location:** `backend/og-backend/`

```bash
cd backend/og-backend

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env
# Edit .env with your configuration

# Start infrastructure (PostgreSQL, Redis, RabbitMQ)
docker-compose --profile infrastructure up -d

# Generate Prisma client
pnpm prisma generate

# Run migrations
docker-compose --profile apps run migrations

# Start services
pnpm start:dev
```

**Services run on:**
- Core API: http://localhost:3000
- Admin Service: http://localhost:4242
- KMS Service: http://localhost:3001
- Blockchain Service: http://localhost:3003
- IPFS Service: http://localhost:3004

### Backend: OG Lens Platform

**Location:** `backend/og-lens-platform/`

```bash
cd backend/og-lens-platform

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env
# Edit .env with your configuration
# Note: Requires GH_PAT for private @hauska/lens-sdk package

# Start infrastructure (PostgreSQL)
docker-compose up -d

# Generate Prisma client
pnpm prisma generate

# Run migrations
docker-compose run migrations

# Start services
pnpm start:dev
```

**Services run on:**
- Indexer API: http://localhost:4000
- Lens Manager: http://localhost:4001

### Backend: OG Data Room Backend

**Location:** `backend/og-data-room-backend/`

```bash
cd backend/og-data-room-backend

# Install dependencies
go mod download

# Configure environment
cp .env.example .env
# Edit .env with your configuration

# Start infrastructure (MongoDB, Redis)
docker-compose up -d

# Run the application
go run main.go
```

**Service runs on:** http://localhost:8080

### Frontend: OG Dashboard

**Location:** `frontend/og-dashboard/`

```bash
cd frontend/og-dashboard

# Install dependencies
npm install

# Configure environment (if needed)
# Edit vite.config.ts or create .env file

# Start development server
npm run dev
```

**Application runs on:** http://localhost:5173 (or Vite default port)

### Frontend: OG Data Room Frontend

**Location:** `frontend/og-data-room-frontend/`

```bash
cd frontend/og-data-room-frontend

# Install dependencies
pnpm install  # or npm install

# Configure environment (if needed)
cp .env.example .env  # if exists

# Start development server
npm run dev
```

**Application runs on:** http://localhost:5173 (or Vite default port)

### Frontend: OG Marketplace

**Location:** `frontend/og-marketplace/`

```bash
cd frontend/og-marketplace

# Install dependencies
npm install

# Configure environment (if needed)
cp .env.example .env  # if exists

# Start development server
npm run dev
```

**Application runs on:** http://localhost:5173 (or Vite default port)

## Environment Variables

Each service requires specific environment variables. See `.env.example` files in each service directory for complete configuration.

### Required Services

1. **AWS KMS**: For key management
2. **Web3Auth**: For authentication
3. **Ethereum RPC**: Blockchain endpoint
4. **Database**: PostgreSQL (og-backend, og-lens-platform) or MongoDB (og-data-room-backend)
5. **Redis**: Caching and queues
6. **RabbitMQ**: Message queue (og-backend only)

## Troubleshooting

### Port Conflicts

If ports are already in use:
- **PostgreSQL**: og-backend uses 5432, og-lens-platform uses 5433
- **Redis**: Default 6379 (check docker-compose files)
- **RabbitMQ**: 5672 (AMQP), 15672 (Management UI)

### Docker Issues

- Ensure Docker Desktop is running
- Check container logs: `docker-compose logs <service-name>`
- Restart containers: `docker-compose restart`

### Dependency Issues

- Clear caches: `pnpm store prune` or `npm cache clean --force`
- Remove node_modules and reinstall
- Check Node.js version: `node --version`

## Next Steps

- See [Architecture Overview](./ARCHITECTURE.md) for system design
- See [API Documentation](./API.md) for API endpoints
- See [Environment Variables](./ENVIRONMENT.md) for configuration details

## Support

For issues or questions, please refer to service-specific README files or open an issue in the repository.