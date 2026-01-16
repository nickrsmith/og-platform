# O&G Platform Application

Digital asset management platform with integrated blockchain licensing, revenue distribution, and geographic restrictions for Oil & Gas assets.

## 🚀 Quick Start

See the [Setup Guide](./docs/SETUP_GUIDE.md) for detailed installation instructions.

### Prerequisites

- **Node.js**: 18+ (recommended: 20.x or 22.x)
- **Go**: 1.23.0+ (for data room backend)
- **pnpm**: Package manager (version 10.13.1+)
- **Docker**: For infrastructure services (PostgreSQL, Redis, RabbitMQ, MongoDB)
- **Docker Compose**: For multi-container orchestration

## 📁 Project Structure

```
og_application/
├── backend/              # Backend services
│   ├── og-backend/      # Core API services (NestJS)
│   ├── og-lens-platform/ # P2P services (NestJS)
│   └── og-data-room-backend/ # Data room backend (Go)
├── frontend/            # Frontend applications
│   ├── og-dashboard/    # Main dashboard (React)
│   ├── og-data-room-frontend/ # Data room UI (React)
│   └── og-marketplace/  # Marketplace UI (Vue 3)
├── contracts/           # Smart contracts
│   └── og-smart-contracts/ # Solidity contracts
└── docs/                # Documentation
```

## 🔧 Setup

### 1. Clean Up (First Time Only)

If you just cloned this repository, run the cleanup script to remove any accidentally included files:

```bash
# Windows PowerShell
.\CLEANUP_SCRIPT.ps1
```

### 2. Backend Services

#### OG Backend (Core API)

```bash
cd backend/og-backend
cp .env.example .env  # Configure environment variables
pnpm install
docker-compose --profile infrastructure up -d
pnpm start:dev
```

#### OG Lens Platform

```bash
cd backend/og-lens-platform
cp .env.example .env  # Configure environment variables
pnpm install
docker-compose up -d
pnpm start:dev
```

#### OG Data Room Backend

```bash
cd backend/og-data-room-backend
cp .env.example .env  # Configure environment variables
go mod download
docker-compose up -d
go run main.go
```

### 3. Frontend Applications

#### OG Dashboard

```bash
cd frontend/og-dashboard
npm install
npm run dev
```

#### OG Data Room Frontend

```bash
cd frontend/og-data-room-frontend
pnpm install  # or npm install
npm run dev
```

#### OG Marketplace

```bash
cd frontend/og-marketplace
npm install
npm run dev
```

## 📚 Documentation

- [Setup Guide](./docs/SETUP_GUIDE.md) - Detailed setup instructions
- [Architecture Overview](./docs/ARCHITECTURE.md) - System architecture
- [API Documentation](./docs/API.md) - API endpoints and usage
- [Environment Variables](./docs/ENVIRONMENT.md) - Configuration reference
- [Dependencies](./docs/DEPENDENCIES.md) - Complete dependency list

## 🏗️ Services Overview

### Backend Services

- **og-backend**: Core API, Admin Service, KMS Service, Blockchain Service, IPFS Service
- **og-lens-platform**: P2P indexer and lens manager
- **og-data-room-backend**: Document management service (Go)

### Frontend Applications

- **og-dashboard**: Main dashboard and marketplace UI (React)
- **og-data-room-frontend**: Data room interface (React)
- **og-marketplace**: Marketplace UI (Vue 3)

## 🔐 Environment Configuration

Each service requires environment variables. See `.env.example` files in each service directory for required configuration.

Key services requiring configuration:
- AWS KMS (for key management)
- Web3Auth (for authentication)
- Ethereum RPC endpoint
- Database connections
- Redis
- RabbitMQ

## 📦 Dependencies

See [DEPENDENCIES.md](./docs/DEPENDENCIES.md) for complete dependency list.

## 🤝 Contributing

See [CONTRIBUTING.md](./docs/CONTRIBUTING.md) for development guidelines.

## 📄 License

MIT License - See [LICENSE](./LICENSE) file for details.

---

For detailed setup instructions, see the [Setup Guide](./docs/SETUP_GUIDE.md).