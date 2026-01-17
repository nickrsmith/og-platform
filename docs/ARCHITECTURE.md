# Architecture Overview

*Last Updated: January 16, 2026*

## System Architecture

The O&G Platform is a distributed system consisting of multiple backend services, frontend applications, and smart contracts.

## Backend Services

### Backend (NestJS Monorepo)

**Location:** `backend/`

Core backend services built with NestJS:

- **core-api**: Main API gateway (port 3002)
- **admin-service**: Admin dashboard backend (port 4243)
- **kms-service**: Key Management Service (port 3001)
- **blockchain-service**: Blockchain interactions (port 3003)
- **ipfs-service**: IPFS file management (port 3004)

**Technologies:**
- NestJS
- PostgreSQL (via Prisma)
- Redis
- RabbitMQ
- Docker

**Note:** Data rooms functionality is integrated as a module within the core-api service.

## Frontend Applications

### Frontend Dashboard

**Location:** `frontend/`

Main dashboard and marketplace UI (React + Vite)

**Technologies:**
- React 18
- TypeScript
- Vite
- TanStack Query
- shadcn/ui
- Tailwind CSS
- Web3Auth

## Infrastructure

- **PostgreSQL**: Primary database (backend services)
- **Redis**: Caching and queues
- **RabbitMQ**: Message queue (backend services)
- **Docker**: Containerization

## Smart Contracts

**Location:** `contracts/og-smart-contracts/`

Ethereum smart contracts for asset management and licensing.

See service-specific README files for detailed architecture information.