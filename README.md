# Empressa O&G Platform

> A comprehensive digital asset marketplace platform for Oil & Gas industry built with NestJS and React.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11.0-red.svg)](https://nestjs.com/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![License](https://img.shields.io/badge/License-UNLICENSED-lightgrey.svg)](LICENSE)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Development](#development)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Documentation](#documentation)

## 🎯 Overview

The Empressa O&G Platform is a full-stack application designed for managing, licensing, and trading digital assets in the Oil & Gas industry. The platform provides a secure marketplace where organizations can publish assets, manage licenses, track revenue, and handle complex transactions with blockchain integration.

### Key Capabilities

- **Asset Management**: Create, publish, and manage digital O&G assets
- **Licensing System**: Purchase and manage asset licenses
- **Revenue Distribution**: Automated fee calculation and revenue splitting
- **Organization Management**: Multi-user organizations with role-based access
- **Data Rooms**: Secure document management and sharing
- **Blockchain Integration**: On-chain asset verification and transactions
- **Admin Dashboard**: Comprehensive platform administration tools

## ✨ Features

### Core Features
- 🔐 **Web3Auth Integration** - Secure user authentication
- 📦 **Asset Publishing** - Create and publish assets with metadata
- 💼 **Organization Management** - Multi-tenant organization system
- 📄 **Data Rooms** - Secure document management
- 💰 **Revenue Tracking** - Real-time revenue distribution tracking
- 🔔 **Notifications** - In-app and email notifications
- ✅ **Asset Verification** - Admin verification workflow
- 📊 **Analytics** - Platform and organization analytics

### Technical Features
- 🏗️ **Microservices Architecture** - Scalable NestJS monorepo
- 🗄️ **PostgreSQL Database** - Robust data persistence
- 🔄 **Message Queues** - RabbitMQ for async processing
- 📦 **Job Processing** - BullMQ for background jobs
- 🌐 **IPFS Storage** - Decentralized file storage
- 🔑 **AWS KMS Integration** - Secure key management
- ⛓️ **Blockchain Integration** - Ethereum smart contracts

## 🛠️ Tech Stack

### Backend
- **Framework**: NestJS 11
- **Language**: TypeScript 5.7
- **Database**: PostgreSQL 15 (Prisma ORM)
- **Cache/Queue**: Redis 7 (BullMQ)
- **Message Queue**: RabbitMQ 3.13
- **Package Manager**: pnpm
- **Authentication**: JWT, Web3Auth
- **Blockchain Library**: Ethers.js v6 (Ethereum blockchain interactions)
- **File Storage**: IPFS (Pinata)

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite 7
- **Language**: TypeScript 5.6
- **UI Library**: shadcn/ui, Radix UI
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query
- **Authentication**: Web3Auth Modal
- **Blockchain Library**: Ethers.js v6 (Ethereum wallet & contract interactions)

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Message Broker**: RabbitMQ 3.13
- **Cloud Services**: AWS KMS, Pinata IPFS

## 🏗️ Architecture

### System Overview

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Core-API   │────▶│  PostgreSQL │
│   (React)   │     │  (NestJS)    │     │   Database  │
└─────────────┘     └──────────────┘     └─────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼────┐      ┌─────▼─────┐     ┌─────▼─────┐
   │Blockchain│      │    IPFS   │     │    KMS    │
   │ Service  │      │  Service  │     │  Service  │
   └──────────┘      └───────────┘     └───────────┘
                           │
                    ┌──────▼──────┐
                    │  Redis/Bull │
                    │  RabbitMQ   │
                    └─────────────┘
```

### Backend Microservices

The backend is a NestJS monorepo with the following services:

| Service | Port | Description |
|---------|------|-------------|
| **core-api** | 3002 | Main API gateway for frontend |
| **admin-service** | 4243 | Admin dashboard API |
| **kms-service** | 3001 | Key Management Service (AWS KMS) |
| **blockchain-service** | 3003 | Blockchain transaction processing |
| **ipfs-service** | 3004 | IPFS file upload and pinning |

### Infrastructure Services

- **PostgreSQL** (5432) - Primary database
- **Redis** (6379) - Caching and job queues
- **RabbitMQ** (5672/15672) - Message broker

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ (recommended: 20.x or 22.x)
- **pnpm** 10.13.1+ (package manager)
- **Docker Desktop** (for infrastructure services)
- **Git** (for version control)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd og_application
   ```

2. **Start infrastructure services**
   ```bash
   cd backend
   docker-compose --profile infrastructure up -d
   ```

3. **Set up backend**
   ```bash
   cd backend
   pnpm install
   cp .env.example .env
   # Edit .env with your configuration
   pnpm prisma generate
   pnpm start:dev
   ```

4. **Set up frontend** (in a new terminal)
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Core API: http://localhost:3002
   - Admin Service: http://localhost:4243
   - API Docs: http://localhost:3002/api/docs

For detailed setup instructions, see [docs/SETUP_GUIDE.md](docs/SETUP_GUIDE.md).

## 💻 Development

### Backend Development

```bash
cd backend

# Install dependencies
pnpm install

# Start infrastructure
docker-compose --profile infrastructure up -d

# Generate Prisma client
pnpm prisma generate

# Run migrations
docker-compose --profile apps run migrations

# Start all services in development mode
pnpm start:dev

# Run tests
pnpm test

# Run linter
pnpm lint
```

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Type checking
npm run check
```

### Environment Variables

Each service requires specific environment variables. See:
- [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) - Complete environment variable reference
- [backend/ENVIRONMENT_SETUP.md](backend/ENVIRONMENT_SETUP.md) - Backend-specific setup

Key environment variables needed:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_HOST`, `REDIS_PORT` - Redis configuration
- `RABBITMQ_URL` - RabbitMQ connection string
- `JWT_SECRET` - JWT signing secret
- `WEB3AUTH_JWKS_URL` - Web3Auth configuration
- AWS credentials for KMS service
- Pinata API keys for IPFS

## 📁 Project Structure

```
og_application/
├── backend/                 # NestJS monorepo
│   ├── apps/               # Microservices
│   │   ├── core-api/       # Main API gateway
│   │   ├── admin-service/  # Admin dashboard API
│   │   ├── kms-service/    # Key management
│   │   ├── blockchain-service/  # Blockchain ops
│   │   └── ipfs-service/   # File storage
│   ├── libs/               # Shared libraries
│   │   ├── common/         # Common utilities
│   │   ├── config/         # Configuration
│   │   └── database/       # Prisma schema
│   ├── scripts/            # Utility scripts
│   └── docs/               # Backend documentation
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom hooks
│   │   ├── lib/            # Utilities
│   │   └── config/         # Configuration
│   └── public/             # Static assets
├── contracts/              # Smart contracts
│   └── og-smart-contracts/ # Ethereum contracts
├── docs/                   # Documentation
└── Task System/            # Project tasks
```

## 📚 API Documentation

### Core API

- **Base URL**: `http://localhost:3002`
- **API Prefix**: `/api/v1`
- **Swagger UI**: http://localhost:3002/api/docs

### Key Endpoints

- **Authentication**: `/api/v1/auth/*`
- **Users**: `/api/v1/users/*`
- **Organizations**: `/api/v1/organizations/*`
- **Releases/Assets**: `/api/v1/releases/*`
- **Transactions**: `/api/v1/transactions/*`
- **Revenue**: `/api/v1/revenue/*`
- **Data Rooms**: `/api/v1/data-rooms/*`

For complete API documentation, see:
- [docs/API.md](docs/API.md)
- [backend/docs/API_DOCUMENTATION.md](backend/docs/API_DOCUMENTATION.md)
- [BACKEND_FRONTEND_MAPPING.md](BACKEND_FRONTEND_MAPPING.md)

## 🚢 Deployment

### Production Deployment

See [backend/PRODUCTION_CONFIGURATION.md](backend/PRODUCTION_CONFIGURATION.md) for comprehensive deployment instructions.

### Docker Deployment

```bash
# Build and start all services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Environment-Specific Configs

- `docker-compose.yml` - Development
- `docker-compose.staging.yml` - Staging
- `docker-compose.prod.yml` - Production

## 📖 Documentation

### Main Documentation

- [Architecture Overview](docs/ARCHITECTURE.md) - System architecture
- [Setup Guide](docs/SETUP_GUIDE.md) - Complete setup instructions
- [Environment Variables](docs/ENVIRONMENT.md) - Environment configuration
- [Dependencies](docs/DEPENDENCIES.md) - Complete dependency list
- [Contributing Guide](docs/CONTRIBUTING.md) - Contribution guidelines

### Backend Documentation

- [Backend README](backend/README.md)
- [System Architecture](backend/docs/1_SYSTEM_ARCHITECTURE.md)
- [Core Workflows](backend/docs/2_CORE_WORKFLOWS/) - Detailed workflow documentation
- [Repository Breakdown](backend/docs/3_REPOSITORY_BREAKDOWN/) - Service documentation
- [AWS KMS Integration](backend/docs/5_AWS_KMS_INTEGRATION.md)

### Additional Resources

- [Developer Handoff](DEV_HANDOFF.md) - Complete handoff document
- [Backend/Frontend Mapping](BACKEND_FRONTEND_MAPPING.md) - API endpoint mapping
- [Migration Guide](HAUSKA_TO_EMPRESSA_MIGRATION_ISSUES.md) - Recent migration notes

## 🤝 Contributing

We welcome contributions! Please see [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for guidelines.

### Development Workflow

1. Create a feature branch from `main`
2. Make your changes
3. Ensure tests pass (`pnpm test`)
4. Run linter (`pnpm lint`)
5. Update documentation if needed
6. Submit a pull request

### Code Style

- **TypeScript/JavaScript**: Follow ESLint configuration
- **React**: Follow existing patterns and best practices
- **NestJS**: Follow framework conventions

## 📝 License

This project is proprietary and confidential. See [LICENSE](LICENSE) for details.

## 🔗 Links

- [Backend Documentation](backend/docs/README.md)
- [Frontend Repository](frontend/)
- [Smart Contracts](contracts/og-smart-contracts/)

## 📞 Support

For questions or issues:
- Review the [documentation](docs/)
- Check [DEV_HANDOFF.md](DEV_HANDOFF.md) for common issues
- Open an issue in the repository

---

**Last Updated**: January 16, 2026  
**Version**: 1.0.0
