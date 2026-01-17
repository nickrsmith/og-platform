# Complete Dependencies List for Oil & Gas Application

This document provides a comprehensive list of all dependencies required to run the frontend and backend applications, organized by service with file paths.

---

## 📋 Table of Contents

1. [System Requirements](#system-requirements)
2. [Backend Dependencies](#backend-dependencies)
3. [Frontend Dependencies](#frontend-dependencies)
4. [Infrastructure Services](#infrastructure-services)
5. [External Services & APIs](#external-services--apis)

---

## 🔧 System Requirements

### Required Runtime Environments

- **Node.js**: Version 18+ (recommended: 20.x or 22.x)
- **Go**: Version 1.23.0+ (toolchain: go1.24.5)
- **pnpm**: Package manager (version 10.13.1+ recommended)
- **Docker**: Required for infrastructure services (PostgreSQL, Redis, RabbitMQ, MongoDB)
- **Docker Compose**: Required for multi-container orchestration

---

## 🔙 Backend Dependencies

### 1. Backend (NestJS Monorepo)

**File Path**: `backend/package.json`

**Package Manager**: pnpm (workspace configured)

**Runtime**: Node.js (NestJS framework)

#### Production Dependencies:
- `@aws-sdk/client-kms`: ^3.913.0 - AWS KMS integration
- `@golevelup/nestjs-rabbitmq`: ^6.0.2 - RabbitMQ integration
- `@libp2p/crypto`: ^5.1.8 - Cryptographic functions
- `@nestjs/axios`: ^4.0.1 - HTTP client
- `@nestjs/bullmq`: ^11.0.3 - Job queue management
- `@nestjs/cache-manager`: ^3.0.1 - Caching layer
- `@nestjs/common`: ^11.0.1 - NestJS core
- `@nestjs/config`: ^4.0.2 - Configuration management
- `@nestjs/core`: ^11.0.1 - NestJS core framework
- `@nestjs/jwt`: ^11.0.0 - JWT authentication
- `@nestjs/passport`: ^11.0.5 - Authentication middleware
- `@nestjs/platform-express`: ^11.0.1 - Express adapter
- `@nestjs/swagger`: ^8.0.7 - API documentation
- `@peerbit/crypto`: ^2.3.11 - Peer-to-peer cryptography
- `@prisma/client`: 6.14.0 - Prisma ORM client
- `@types/multer`: ^2.0.0 - File upload types
- `amqplib`: ^0.10.8 - AMQP protocol client
- `multer`: ^2.0.2 - File upload handling
- `axios`: ^1.11.0 - HTTP client
- `bcrypt`: ^6.0.0 - Password hashing
- `bullmq`: ^5.58.1 - Redis-based queue
- `cache-manager`: ^7.1.1 - Cache abstraction
- `cache-manager-redis-store`: ^3.0.1 - Redis cache store
- `class-transformer`: ^0.5.1 - Object transformation
- `class-validator`: ^0.14.2 - Validation decorators
- `dotenv`: ^17.2.2 - Environment variable management
- `ethers`: ^6.15.0 - Ethereum library
- `form-data`: ^4.0.4 - Form data encoding
- `humanparser`: ^2.7.0 - Name parsing
- `jose`: ^4.15.9 - JWT/JWE/JWS library
- `js-sha3`: ^0.9.3 - SHA-3 hashing
- `passport-jwt`: ^4.0.1 - JWT passport strategy
- `prisma`: ^6.16.2 - Prisma CLI
- `reflect-metadata`: ^0.2.2 - Metadata reflection
- `resend`: ^6.1.0 - Email service
- `rxjs`: ^7.8.1 - Reactive programming
- `tweetnacl`: ^1.0.3 - Cryptography library
- `uint8arrays`: ^5.1.0 - Typed array utilities
- `uuid`: ^11.1.0 - UUID generation

#### Development Dependencies:
- `@eslint/eslintrc`: ^3.2.0
- `@eslint/js`: ^9.18.0
- `@nestjs/cli`: ^11.0.0
- `@nestjs/schematics`: ^11.0.0
- `@nestjs/testing`: ^11.0.1
- `@types/bcrypt`: ^6.0.0
- `@types/express`: ^5.0.0
- `@types/humanparser`: ^1.1.8
- `@types/jest`: ^30.0.0
- `@types/node`: ^22.10.7
- `@types/passport-jwt`: ^4.0.1
- `@types/supertest`: ^6.0.2
- `concurrently`: ^9.2.1
- `eslint`: ^9.18.0
- `husky`: ^9.1.7
- `lint-staged`: ^15.2.11
- `eslint-config-prettier`: ^10.0.1
- `eslint-plugin-prettier`: ^5.2.2
- `eslint-plugin-security`: ^3.0.1
- `globals`: ^16.0.0
- `jest`: ^30.0.0
- `prettier`: ^3.4.2
- `source-map-support`: ^0.5.21
- `supertest`: ^7.0.0
- `ts-jest`: ^29.2.5
- `ts-loader`: ^9.5.4
- `ts-node`: ^10.9.2
- `tsconfig-paths`: ^4.2.0
- `typescript`: ^5.7.3
- `typescript-eslint`: ^8.20.0

**Additional Configuration Files**:
- `backend/pnpm-workspace.yaml` - pnpm workspace configuration
- `backend/docker-compose.yml` - Docker services configuration
- `backend/libs/database/prisma/schema.prisma` - Prisma database schema

**Infrastructure Services** (via docker-compose.yml):
- PostgreSQL 15
- Redis 7-alpine
- RabbitMQ 3.13-management-alpine

---

## 🎨 Frontend Dependencies

### 1. Frontend Dashboard (React + Vite)

**File Path**: `frontend/package.json`

**Package Manager**: npm (package-lock.json present)

**Runtime**: Node.js (React application)

#### Production Dependencies:
- `@hookform/resolvers`: ^3.10.0 - Form validation resolvers
- `@jridgewell/trace-mapping`: ^0.3.25 - Source map tracing
- `@radix-ui/react-accordion`: ^1.2.4 - Accordion component
- `@radix-ui/react-alert-dialog`: ^1.1.7 - Alert dialog
- `@radix-ui/react-aspect-ratio`: ^1.1.3 - Aspect ratio component
- `@radix-ui/react-avatar`: ^1.1.4 - Avatar component
- `@radix-ui/react-checkbox`: ^1.1.5 - Checkbox component
- `@radix-ui/react-collapsible`: ^1.1.4 - Collapsible component
- `@radix-ui/react-context-menu`: ^2.2.7 - Context menu
- `@radix-ui/react-dialog`: ^1.1.7 - Dialog component
- `@radix-ui/react-dropdown-menu`: ^2.1.7 - Dropdown menu
- `@radix-ui/react-hover-card`: ^1.1.7 - Hover card
- `@radix-ui/react-label`: ^2.1.3 - Label component
- `@radix-ui/react-menubar`: ^1.1.7 - Menubar component
- `@radix-ui/react-navigation-menu`: ^1.2.6 - Navigation menu
- `@radix-ui/react-popover`: ^1.1.7 - Popover component
- `@radix-ui/react-progress`: ^1.1.3 - Progress indicator
- `@radix-ui/react-radio-group`: ^1.2.4 - Radio group
- `@radix-ui/react-scroll-area`: ^1.2.4 - Scroll area
- `@radix-ui/react-select`: ^2.1.7 - Select component
- `@radix-ui/react-separator`: ^1.1.3 - Separator component
- `@radix-ui/react-slider`: ^1.2.4 - Slider component
- `@radix-ui/react-slot`: ^1.2.0 - Slot component
- `@radix-ui/react-switch`: ^1.1.4 - Switch component
- `@radix-ui/react-tabs`: ^1.1.4 - Tabs component
- `@radix-ui/react-toast`: ^1.2.7 - Toast notifications
- `@radix-ui/react-toggle`: ^1.1.3 - Toggle component
- `@radix-ui/react-toggle-group`: ^1.1.3 - Toggle group
- `@radix-ui/react-tooltip`: ^1.2.0 - Tooltip component
- `@tanstack/react-query`: ^5.60.5 - Data fetching & caching
- `@types/memoizee`: ^0.4.12 - Memoization types
- `@web3auth/modal`: ^10.10.0 - Web3Auth authentication modal
- `class-variance-authority`: ^0.7.1 - Component variants
- `clsx`: ^2.1.1 - Conditional class names
- `cmdk`: ^1.1.1 - Command menu
- `connect-pg-simple`: ^10.0.0 - PostgreSQL session store
- `date-fns`: ^3.6.0 - Date utilities
- `drizzle-orm`: ^0.39.3 - TypeScript ORM
- `drizzle-zod`: ^0.7.0 - Zod validation integration
- `embla-carousel-react`: ^8.6.0 - Carousel component
- `ethers`: ^6.0.0 - Ethereum library
- `express`: ^4.21.2 - Express server (for SSR/API routes)
- `express-session`: ^1.18.2 - Session management
- `framer-motion`: ^11.13.1 - Animation library
- `input-otp`: ^1.4.2 - OTP input component
- `lucide-react`: ^0.453.0 - Icon library
- `memoizee`: ^0.4.17 - Memoization utility
- `memorystore`: ^1.6.7 - Memory session store
- `next-themes`: ^0.4.6 - Theme management
- `openid-client`: ^6.8.1 - OpenID Connect client
- `passport`: ^0.7.0 - Authentication middleware
- `passport-local`: ^1.0.0 - Local authentication strategy
- `pg`: ^8.16.3 - PostgreSQL client
- `react`: ^18.3.1 - React library
- `react-day-picker`: ^8.10.1 - Date picker
- `react-dom`: ^18.3.1 - React DOM
- `react-hook-form`: ^7.55.0 - Form handling
- `react-icons`: ^5.4.0 - Icon library
- `react-resizable-panels`: ^2.1.7 - Resizable panels
- `recharts`: ^2.15.2 - Charting library
- `tailwind-merge`: ^2.6.0 - Tailwind class merging
- `tailwindcss-animate`: ^1.0.7 - Tailwind animations
- `tw-animate-css`: ^1.2.5 - Additional animations
- `vaul`: ^1.1.2 - Drawer component
- `wouter`: ^3.3.5 - Router library
- `ws`: ^8.18.0 - WebSocket client
- `zod`: ^3.24.2 - Schema validation
- `zod-validation-error`: ^3.4.0 - Zod error formatting

#### Development Dependencies:
- `@replit/vite-plugin-cartographer`: ^0.4.4
- `@replit/vite-plugin-dev-banner`: ^0.1.1
- `@replit/vite-plugin-runtime-error-modal`: ^0.0.3
- `@tailwindcss/typography`: ^0.5.15
- `@tailwindcss/vite`: ^4.1.18
- `@types/connect-pg-simple`: ^7.0.3
- `@types/express`: 4.17.21
- `@types/express-session`: ^1.18.2
- `@types/node`: 20.19.27
- `@types/passport`: ^1.0.17
- `@types/passport-local`: ^1.0.38
- `@types/react`: ^18.3.11
- `@types/react-dom`: ^18.3.1
- `@types/ws`: ^8.5.13
- `@vitejs/plugin-react`: ^4.7.0
- `autoprefixer`: ^10.4.20
- `buffer`: ^6.0.3
- `crypto-browserify`: ^3.12.1
- `drizzle-kit`: ^0.31.8
- `esbuild`: ^0.25.0
- `postcss`: ^8.4.47
- `process`: ^0.11.10
- `stream-browserify`: ^3.0.0
- `tailwindcss`: ^3.4.17
- `tsx`: ^4.20.5
- `typescript`: 5.6.3
- `vite`: ^7.3.0

**Additional Configuration Files**:
- `frontend/vite.config.ts` - Vite configuration
- `frontend/tsconfig.json` - TypeScript configuration
- `frontend/tailwind.config.ts` - Tailwind CSS configuration
- `frontend/postcss.config.js` - PostCSS configuration
- `frontend/components.json` - shadcn/ui configuration

---

## 🏗️ Infrastructure Services

### Docker Services Required

All infrastructure services are defined in respective `docker-compose.yml` files:

#### Backend Infrastructure (`backend/docker-compose.yml`):
- **PostgreSQL 15**: Database (port 5432)
- **Redis 7-alpine**: Cache & queues (port 6379)
- **RabbitMQ 3.13-management-alpine**: Message queue
  - AMQP port: 5672
  - Management UI: 15672

---

## 🌐 External Services & APIs

### Required External Services:

1. **AWS Services**:
   - AWS KMS (Key Management Service) - For encryption key management
   - AWS SDK credentials must be configured

2. **Web3Auth**:
   - Web3Auth service account
   - Client ID configuration required

3. **Ethereum/Blockchain**:
   - Ethereum RPC endpoint (for blockchain interactions)
   - Smart contract addresses

4. **Email Service** (Resend):
   - Resend API key for email functionality

---

## 📦 Installation Commands

### Backend Services:

#### Backend:
```bash
cd backend
pnpm install
docker-compose --profile infrastructure up -d
pnpm start:dev
```

### Frontend Services:

#### Frontend Dashboard:
```bash
cd frontend
npm install
npm run dev
```

---

## 📝 Notes

1. **Package Manager**: Backend uses `pnpm`, while frontend uses `npm`.

2. **Database Migrations**: 
   - Backend uses Prisma migrations
   - Run migrations before starting services: `pnpm prisma migrate dev` or via docker-compose

3. **Environment Variables**: All services require `.env` files with specific configuration. Refer to respective README files or `.env.example` files.

4. **Port Conflicts**: 
   - Ensure Docker containers for infrastructure services are running before starting applications
   - Default ports: Core API (3002), Admin Service (4243), KMS (3001), Blockchain (3003), IPFS (3004)

5. **Node.js Version**: All Node.js services recommend Node.js 18+ (20.x or 22.x preferred).

---

*Last Updated: January 16, 2026*