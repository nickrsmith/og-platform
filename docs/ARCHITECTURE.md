# Architecture Overview

## System Architecture

The O&G Platform is a distributed system consisting of multiple backend services, frontend applications, and smart contracts.

## Backend Services

### OG Backend (NestJS Monorepo)

**Location:** `backend/og-backend/`

Core backend services built with NestJS:

- **core-api**: Main API gateway (port 3000)
- **admin-service**: Admin dashboard backend (port 4242)
- **kms-service**: Key Management Service (port 3001)
- **blockchain-service**: Blockchain interactions (port 3003)
- **ipfs-service**: IPFS file management (port 3004)

**Technologies:**
- NestJS
- PostgreSQL (via Prisma)
- Redis
- RabbitMQ
- Docker

### OG Lens Platform (NestJS Monorepo)

**Location:** `backend/og-lens-platform/`

P2P services for decentralized data:

- **indexer-api**: P2P data indexing (port 4000)
- **lens-manager**: P2P node manager (port 4001)

**Technologies:**
- NestJS
- PostgreSQL (via Prisma)
- Peerbit P2P framework
- Docker

### OG Data Room Backend (Go)

**Location:** `backend/og-data-room-backend/`

Document management service:

- **API**: REST API (port 8080)

**Technologies:**
- Go (Gin framework)
- MongoDB
- Redis
- Docker

## Frontend Applications

### OG Dashboard

**Location:** `frontend/og-dashboard/`

Main dashboard and marketplace UI (React + Vite)

**Technologies:**
- React 18
- TypeScript
- Vite
- TanStack Query
- shadcn/ui
- Tailwind CSS

### OG Data Room Frontend

**Location:** `frontend/og-data-room-frontend/`

Data room interface (React + Vite)

**Technologies:**
- React 19
- TypeScript
- Vite
- TanStack Query
- Tailwind CSS
- Web3Auth

### OG Marketplace

**Location:** `frontend/og-marketplace/`

Marketplace UI (Vue 3 + Vite)

**Technologies:**
- Vue 3
- TypeScript
- Vite
- Vuetify
- TanStack Query
- Web3Auth

## Infrastructure

- **PostgreSQL**: Primary database (og-backend, og-lens-platform)
- **MongoDB**: Document storage (og-data-room-backend)
- **Redis**: Caching and queues
- **RabbitMQ**: Message queue (og-backend)
- **Docker**: Containerization

## Smart Contracts

**Location:** `contracts/og-smart-contracts/`

Ethereum smart contracts for asset management and licensing.

See service-specific README files for detailed architecture information.