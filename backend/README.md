# Backend Services

This folder contains all backend services and smart contracts for the O&G Platform.

## Services

This is a NestJS monorepo containing the following microservices:

- **core-api** - Main API gateway (port 3002)
- **admin-service** - Admin dashboard backend (port 4243)
- **kms-service** - Key Management Service (port 3001)
- **blockchain-service** - Blockchain interactions (port 3003)
- **ipfs-service** - IPFS file management (port 3004)

## Structure

- **apps/** - Microservice applications
- **libs/** - Shared libraries (common, config, database)
- **scripts/** - Utility scripts
- **tests/** - Integration and security tests
- **docs/** - Backend documentation

Each service shares:
- Common database (PostgreSQL via Prisma)
- Shared libraries for common functionality
- Docker Compose for infrastructure services
- Centralized configuration management

## Development

See individual service README files for setup and development instructions.

---

**See [../CURRENT_STATUS_AND_ROADMAP.md](../CURRENT_STATUS_AND_ROADMAP.md) for current project status.**

