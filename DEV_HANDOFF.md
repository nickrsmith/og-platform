# Developer Handoff Document - O&G Platform MVP

**Date:** January 19, 2026  
**Platform:** Digital Ocean Deployment  
**Status:** Ready for Backend Integration & Production Deployment

---

## 🎯 Executive Summary

This document provides a comprehensive handoff for the O&G Platform MVP. The project is a NestJS backend with React frontend, built as a monorepo with multiple microservices.

### Current Status

- **Backend Development:** ~75% complete ✅
- **Frontend Development:** ~85% complete ✅
- **Backend Integration:** ~60% complete ⚠️
- **External Integrations:** ~48% complete ⚠️
- **Deployment Configuration:** ~40% complete ⚠️
- **Overall MVP Readiness:** ~71%

### Recent Completions (January 2026)

**Priority 1 - Backend Controllers (100% Complete):**
- ✅ NotificationsController - All 3 endpoints implemented
- ✅ DataRoomsController - All 9 endpoints implemented (Prisma schema, service, controller, DTOs)
- ✅ PSA Fields Backend - PSA fields added to CreateReleaseDto and ReleaseDto (20 fields total)

**Priority 2 - Documentation (100% Complete):**
- ✅ Environment Variables - Complete `ENVIRONMENT_SETUP.md` for all services
- ✅ Docker Production Config - Comprehensive `PRODUCTION_CONFIGURATION.md` with issues identified
- ✅ API Documentation - Updated `BACKEND_FRONTEND_MAPPING.md` with all new endpoints

**Priority 3 - Organization Roles Rename (100% Complete - January 16, 2026):**
- ✅ Database migration created and applied (`20260116200000_rename_organization_roles`)
- ✅ Backend code updated (12 files: schema, enums, services, controllers, interfaces, tests)
- ✅ Frontend code updated (4 files: role displays, team management, onboarding)
- ✅ Documentation updated (`BACKEND_FRONTEND_MAPPING.md`, `DEV_HANDOFF.md`)
- **Role changes:** Admin → Manager, Creator → AssetManager, Verifier → Compliance
- **Note:** On-chain role name remains `CREATOR_ROLE` for smart contract compatibility

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Environment Setup](#environment-setup)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [Recent Implementations](#recent-implementations)
8. [Deployment to Digital Ocean](#deployment-to-digital-ocean)
9. [Remaining Tasks & Blockers](#remaining-tasks--blockers)
10. [Quick Start Guide](#quick-start-guide)
11. [Key Documentation References](#key-documentation-references)

---

## 🏗️ Architecture Overview

### System Architecture

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

### Microservices

1. **core-api** (Port 3000) - Main API service (defaults to 3002, but docker-compose sets to 3000)
2. **admin-service** (Port 4243) - Admin dashboard API (defaults to 4243, can be set to 4242 via ADMIN_SERVICE_PORT)
3. **blockchain-service** (Port 3003) - Blockchain operations (defaults to 3003)
4. **ipfs-service** (Port 3004) - IPFS file storage (defaults to 3004)
5. **kms-service** (Port 3001) - Key management (AWS KMS) (defaults to 3001)

### Infrastructure

- **Database:** PostgreSQL 15
- **Cache/Queue:** Redis 7 (BullMQ job queues)
- **Message Queue:** RabbitMQ 3.13
- **File Storage:** IPFS (Pinata provider)
- **Key Management:** AWS KMS

---

## 🛠️ Technology Stack

### Backend
- **Framework:** NestJS (TypeScript)
- **Database:** PostgreSQL + Prisma ORM
- **Authentication:** JWT (Web3Auth integration)
- **Job Queue:** BullMQ (Redis-backed)
- **Message Queue:** RabbitMQ
- **File Upload:** Multer → IPFS (Pinata)
- **Blockchain:** ethers.js, smart contracts

### Frontend
- **Framework:** React 18 + Vite
- **UI Library:** shadcn/ui (Radix UI + Tailwind CSS)
- **Routing:** Wouter
- **State Management:** React hooks + Context
- **API Client:** Custom fetch wrapper with JWT interceptor

### DevOps
- **Containerization:** Docker + Docker Compose
- **Deployment:** Digital Ocean (target platform)
- **CI/CD:** (To be configured)

---

## 📁 Project Structure

```
og_application/
├── backend/                    # NestJS monorepo
│   ├── apps/
│   │   ├── core-api/          # Main API service
│   │   ├── admin-service/     # Admin dashboard API
│   │   ├── blockchain-service/# Blockchain operations
│   │   ├── ipfs-service/      # IPFS file storage
│   │   └── kms-service/       # Key management
│   ├── libs/                   # Shared libraries
│   │   ├── common/            # Shared DTOs, utilities
│   │   ├── database/          # Prisma schema & service
│   │   └── config/            # Configuration module
│   ├── docker-compose.yml     # Development setup
│   ├── docker-compose.prod.yml# Production setup
│   └── Dockerfile             # Multi-stage build
├── frontend/                   # React + Vite app
│   ├── src/
│   │   ├── pages/             # Route pages
│   │   ├── components/        # React components
│   │   └── lib/               # Services, utilities
│   └── public/                # Static assets
└── contracts/                  # Smart contracts
```

---

## 🔧 Environment Setup

### Required Environment Variables

All environment variables are documented in `backend/ENVIRONMENT_SETUP.md`. Key variables:

#### Core-API (Required)
```bash
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=your-jwt-secret-key
REDIS_HOST=localhost
REDIS_PORT=6379
RABBITMQ_URL=amqp://user:password@host:5672
KMS_SERVICE_URL=http://localhost:3004
BLOCKCHAIN_SERVICE_URL=http://localhost:3005
IPFS_SERVICE_URL=http://localhost:3006
```

#### Optional but Recommended
```bash
LENS_MANAGER_URL=http://localhost:5000
INDEXER_API_URL=http://localhost:5001
ENABLE_AI_SERVICES=false
OPENAI_API_KEY=
ENVERUS_SECRET_KEY=
PERSONA_API_KEY=
PERSONA_ENVIRONMENT_ID=
SIMPLIFY_API_KEY=
```

#### Service-Specific
- **Blockchain Service:** `RPC_URL`, `ADMIN_WALLET_PRIVATE_KEY`, `FAUCET_WALLET_PRIVATE_KEY`
- **IPFS Service:** `PINATA_API_URL`, `PINATA_JWT`
- **KMS Service:** `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `KMS_KEY_ALIAS_PREFIX`

### Setup Steps

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd og_application
   ```

2. **Backend Setup**
   ```bash
   cd backend
   cp .env.example .env  # If .env.example exists
   # Edit .env with your values
   pnpm install
   pnpm prisma generate
   pnpm prisma migrate dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   cp .env.example .env  # Configure API URL
   npm install
   ```

4. **Start Services (Development)**
   ```bash
   cd backend
   docker-compose --profile infrastructure up -d  # Start DB, Redis, RabbitMQ
   pnpm nest start core-api --watch  # Start core-api
   pnpm nest start blockchain-service --watch  # Start other services as needed
   ```

   ```bash
   cd frontend
   npm run dev  # Start frontend dev server
   ```

See `backend/ENVIRONMENT_SETUP.md` for complete environment variable documentation.

---

## 🗄️ Database Schema

### Key Models

- **User** - User accounts with Persona verification
- **Organization** - Organizations/companies
- **Release** - Asset listings (stored in P2P network, metadata in DB)
- **Offer** - Asset purchase offers
- **Transaction** - Completed sales transactions
- **Notification** - User notifications
- **DataRoom** - Data rooms for document storage
- **DataRoomDocument** - Documents in data rooms
- **DivisionOrder** - Division order management (Phase 2)

### Recent Schema Additions

- ✅ **DataRoom Models** (2026-01-19):
  - `DataRoom` - Data room metadata
  - `DataRoomDocument` - Document storage with folder support
  - Enums: `DataRoomStatus`, `DataRoomAccess`, `DataRoomTier`

**Note:** Prisma Client must be regenerated after schema changes:
```bash
cd backend
pnpm prisma generate
```

**Migration Status:** 
- ✅ Organization role rename migration applied (`20260116200000_rename_organization_roles`)
  - Updated roles: Admin → Manager, Creator → AssetManager, Verifier → Compliance
  - All code updated (backend, frontend, tests)
  - Database enum and existing records updated
- DataRoom migration file exists but not yet applied (`20260119000000_add_data_rooms`)

---

## 🔌 API Endpoints

### Complete API Documentation

See `BACKEND_FRONTEND_MAPPING.md` (1311 lines) for complete endpoint documentation.

### Recently Implemented Endpoints

#### Notifications (`/api/v1/notifications`) ✅
- `GET /notifications` - List notifications (paginated, filtered)
- `PATCH /notifications/:id/read` - Mark as read
- `PATCH /notifications/read-all` - Mark all as read

**Controller:** `NotificationsController`  
**Service:** `NotificationsService`  
**Status:** Complete, includes pagination and filtering

#### Data Rooms (`/api/v1/data-rooms`) ✅
- `POST /data-rooms` - Create data room
- `GET /data-rooms` - List data rooms (with filters)
- `GET /data-rooms/:id` - Get data room with documents
- `GET /data-rooms/listing/:listingId` - Get by listing/release ID
- `GET /data-rooms/asset/:assetId` - Get by asset ID
- `PATCH /data-rooms/:id` - Update data room
- `DELETE /data-rooms/:id` - Delete data room
- `POST /data-rooms/:id/documents` - Upload document
- `DELETE /data-rooms/:id/documents/:docId` - Delete document

**Controller:** `DataRoomsController`  
**Service:** `DataRoomsService`  
**Status:** Complete, supports folder organization

#### Releases - PSA Fields ✅
- `POST /releases` - Now accepts optional `psaData` JSONB object
  - Purchase Price Allocation (5 fields)
  - Revenue Distribution (4 fields)
  - Where Monies Go (6 fields)
  - Deal Structure (5 fields)

**Status:** Complete, all 20 PSA fields documented and implemented

### API Documentation

- **Swagger UI:** `http://localhost:3000/api/v1/docs` (when running)
- **Endpoint Mapping:** `BACKEND_FRONTEND_MAPPING.md` - Complete frontend/backend mapping

---

## ✨ Recent Implementations

### Task 1.1: NotificationsController ✅
- Created `NotificationsController` with 3 endpoints
- Enhanced `NotificationsService` with pagination and filters
- Created DTOs: `GetNotificationsQueryDto`, `NotificationResponseDto`, `NotificationsListResponseDto`
- Registered in `NotificationsModule` and `CoreApiModule`

### Task 1.3: DataRoomsController ✅
- Created Prisma schema models (`DataRoom`, `DataRoomDocument`)
- Created migration file (`20260119000000_add_data_rooms`)
- Created 6 DTOs for all operations
- Created `DataRoomsService` with full CRUD and document management
- Created `DataRoomsController` with 9 endpoints
- Created `DataRoomsModule` and registered in `CoreApiModule`

**Note:** Prisma Client needs regeneration (`pnpm prisma generate`) for TypeScript types.

### Task 1.4: PSA Fields Backend Integration ✅
- Added `psaData` JSONB object to `CreateReleaseDto`
- Added `psaData` to `ReleaseDto` for GET responses
- All 20 PSA fields organized into 4 groups
- No service changes needed (DTOs passed through automatically)

---

## 🚀 Deployment to Digital Ocean

### Pre-Deployment Checklist

- [ ] Fix `docker-compose.prod.yml` (change all `target: development` to `target: production`)
- [ ] Remove `--watch` commands from production services
- [ ] Remove development volume mounts
- [ ] Set all required environment variables
- [ ] Configure secrets management
- [ ] Set up database backups
- [ ] Configure SSL/TLS certificates
- [ ] Set up domain names and DNS

### Critical Production Configuration Issues

**⚠️ CRITICAL:** `backend/docker-compose.prod.yml` has issues that MUST be fixed:

1. **All services use `target: development`** instead of `target: production`
   - Fix: Change to `target: production` for all services

2. **All services use `--watch` commands**
   - Fix: Production services should run compiled JavaScript (see Dockerfile CMD)

3. **Development volume mounts present**
   - Fix: Remove `volumes:` sections for production builds

See `backend/PRODUCTION_CONFIGURATION.md` for detailed fixes and recommendations.

### Digital Ocean Deployment Steps

#### Option 1: Docker Compose on Droplet

1. **Create Droplet**
   - Ubuntu 22.04 LTS
   - Minimum: 4GB RAM, 2 vCPUs (recommend 8GB RAM, 4 vCPUs for production)
   - Enable Docker and Docker Compose

2. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd og_application/backend
   ```

3. **Configure Environment**
   ```bash
   # Create .env file with production values
   # Use Digital Ocean's Managed Databases for PostgreSQL
   # Use Digital Ocean's Managed Redis
   # Or run databases in Docker
   ```

4. **Fix Production Config**
   - Edit `docker-compose.prod.yml` per `PRODUCTION_CONFIGURATION.md`

5. **Build and Deploy**
   ```bash
   docker-compose -f docker-compose.prod.yml --profile infrastructure up -d
   docker-compose -f docker-compose.prod.yml --profile apps build
   docker-compose -f docker-compose.prod.yml --profile apps up -d
   ```

6. **Configure Reverse Proxy (Nginx)**
   ```nginx
   server {
       listen 80;
       server_name api.yourdomain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

7. **Set Up SSL (Let's Encrypt)**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d api.yourdomain.com
   ```

#### Option 2: Digital Ocean App Platform

1. **Connect Repository** to Digital Ocean App Platform
2. **Configure Services:**
   - **Frontend:** Static site or Node.js service
   - **Backend:** Multiple services (core-api, blockchain-service, etc.)
   - **Database:** Managed PostgreSQL
   - **Redis:** Managed Redis
3. **Set Environment Variables** in App Platform UI
4. **Configure Build Commands** per service
5. **Set Up Health Checks** for each service

#### Option 3: Kubernetes (Digital Ocean Kubernetes)

See `backend/PRODUCTION_CONFIGURATION.md` for Kubernetes deployment considerations.

### Production Environment Variables

**Critical Variables:**
```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:password@managed-db-host:25060/database
JWT_SECRET=<strong-random-secret>
REDIS_HOST=managed-redis-host
REDIS_PORT=25061
REDIS_PASSWORD=<redis-password>
RABBITMQ_URL=amqp://user:password@rabbitmq-host:5672
KMS_SERVICE_URL=http://kms-service:3004
BLOCKCHAIN_SERVICE_URL=http://blockchain-service:3005
IPFS_SERVICE_URL=http://ipfs-service:3006
```

**Security:**
- Use Digital Ocean's Secrets Manager or environment variables
- Never commit `.env` files
- Use strong passwords for all services
- Enable SSL/TLS for all connections

### Monitoring & Logging

**Recommended Tools:**
- **Logging:** Digital Ocean Logs or ELK Stack
- **Monitoring:** Prometheus + Grafana, Datadog
- **APM:** New Relic, Elastic APM
- **Error Tracking:** Sentry

**Key Metrics to Monitor:**
- CPU and memory usage per service
- Request rate and latency
- Error rates
- Database connection pool usage
- Redis cache hit/miss rates
- Queue lengths (RabbitMQ)
- Disk usage

---

## 🚧 Remaining Tasks & Blockers

### 🔴 CRITICAL BLOCKERS

#### 1. Simplify E-Notary/E-Recording Integration ⚠️ BLOCKED

**Priority:** CRITICAL  
**Status:** Cannot proceed - awaiting external dependency  
**Blocking:** Transaction completion workflow

**What's Done:**
- ✅ Backend endpoints created (placeholder implementations)
- ✅ Database schema updated
- ✅ Webhook handlers created
- ✅ Migration files created

**What's Needed:**
- [ ] Contact Simplify for API documentation (custom O&G product)
- [ ] Complete backend endpoint implementations
- [ ] Implement frontend integration
- [ ] End-to-end testing

**Files:**
- `backend/apps/core-api/src/simplify/`
- Migration: `20260118000000_add_simplify_recording_fields`

#### 2. Production Docker Configuration ⚠️ CRITICAL

**Priority:** CRITICAL (must fix before deployment)  
**Status:** Issues identified, fixes documented

**Issues:**
- All services use `target: development` instead of `production`
- All services use `--watch` commands
- Development volume mounts present

**Fix Required:**
See `backend/PRODUCTION_CONFIGURATION.md` for detailed fixes.

### 🟡 HIGH PRIORITY - UNBLOCKED

#### 3. Persona Verification Testing ⚠️ HIGH

**Priority:** HIGH  
**Status:** Implementation complete, testing pending  
**Estimated Time:** 1-2 days

**What's Done:**
- ✅ Backend endpoints implemented
- ✅ Frontend integration complete
- ✅ Testing guide created

**What's Needed:**
- [ ] Execute manual testing checklist (7 test cases)
- [ ] Set up Persona webhook endpoint (ngrok or public URL)
- [ ] Test end-to-end verification flow
- [ ] Test webhook handling

**Files:**
- `backend/apps/core-api/src/verification/verification.test-guide.md`

#### 4. Database Migrations ⚠️ HIGH

**Priority:** HIGH  
**Status:** Migration files exist but not applied

**What's Needed:**
- [ ] Run Prisma migration for DataRooms: `pnpm prisma migrate deploy`
- [ ] Generate Prisma Client: `pnpm prisma generate`
- [ ] Verify migration success

**Migration Files:**
- `backend/libs/database/prisma/migrations/20260119000000_add_data_rooms/migration.sql`

### 🟢 MEDIUM PRIORITY

#### 5. IPFS Integration Enhancement

**Status:** Basic document storage works, IPFS processing can be enhanced  
**What's Needed:**
- [ ] Queue IPFS processing jobs for DataRoom documents (currently stores temp path)
- [ ] Update document records with IPFS CID/URL when processing completes

#### 6. Testing

**Status:** Manual testing needed  
**What's Needed:**
- [ ] End-to-end testing of new endpoints (Notifications, DataRooms)
- [ ] Integration testing of PSA fields in release creation
- [ ] Load testing for production readiness

---

## 🚀 Quick Start Guide

### Local Development

1. **Start Infrastructure**
   ```bash
   cd backend
   docker-compose --profile infrastructure up -d
   ```

2. **Set Up Backend**
   ```bash
   cd backend
   pnpm install
   pnpm prisma generate
   pnpm prisma migrate dev
   pnpm nest start core-api --watch
   ```

3. **Set Up Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Access Application**
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:3000`
   - Swagger Docs: `http://localhost:3000/api/v1/docs`
   - Admin Service: `http://localhost:4242`

### Production Deployment (Digital Ocean)

1. **Review and Fix Production Config**
   - Fix `docker-compose.prod.yml` per `PRODUCTION_CONFIGURATION.md`

2. **Set Environment Variables**
   - Configure all required variables (see `ENVIRONMENT_SETUP.md`)

3. **Run Migrations**
   ```bash
   docker-compose -f docker-compose.prod.yml --profile apps run migrations
   ```

4. **Start Services**
   ```bash
   docker-compose -f docker-compose.prod.yml --profile infrastructure up -d
   docker-compose -f docker-compose.prod.yml --profile apps up -d
   ```

5. **Configure Reverse Proxy & SSL**
   - Set up Nginx
   - Configure SSL with Let's Encrypt

---

## 📚 Key Documentation References

### Primary Documentation

- **`BACKEND_FRONTEND_MAPPING.md`** - Complete API endpoint mapping (1311 lines)
  - All endpoints with frontend usage
  - Request/response examples
  - Service references

- **`backend/ENVIRONMENT_SETUP.md`** - Complete environment variable documentation
  - All services documented
  - Variable descriptions and defaults
  - Example configurations

- **`backend/PRODUCTION_CONFIGURATION.md`** - Production deployment guide
  - Docker configuration issues and fixes
  - Deployment checklists
  - Security considerations
  - Monitoring recommendations

### Additional Documentation

- **`CODEBASE_CATALOG.md`** - What exists vs what's documented
- **`backend/docs/`** - Backend architecture and workflows
- **`frontend/ENVIRONMENT_SETUP.md`** - Frontend environment variables

### Task Tracking

- **`Task System/TASKS/PRE_HANDOFF_TASKS.md`** - Pre-handoff task completion status

---

## 📞 Support & Next Steps

### Immediate Next Steps

1. **Review Production Configuration**
   - Read `backend/PRODUCTION_CONFIGURATION.md`
   - Fix `docker-compose.prod.yml` issues

2. **Set Up Environment**
   - Configure all environment variables
   - Set up secrets management

3. **Run Migrations**
   - Apply DataRooms migration
   - Generate Prisma Client

4. **Deploy to Digital Ocean**
   - Choose deployment method (Droplet, App Platform, Kubernetes)
   - Follow deployment steps above
   - Configure monitoring and logging

### Questions or Issues?

- Review relevant documentation files listed above
- Check `REMAINING_TASKS_AND_BLOCKERS.md` for known issues
- Refer to `BACKEND_FRONTEND_MAPPING.md` for API details

---

## 📝 Notes

- **Prisma Client:** Must be regenerated after schema changes (`pnpm prisma generate`)
- **Database Migrations:** 
  - ✅ Organization role rename migration applied (`20260116200000_rename_organization_roles`)
    - Roles updated: Admin → Manager, Creator → AssetManager, Verifier → Compliance
  - DataRooms migration file exists but not yet applied (`20260119000000_add_data_rooms`)
- **Organization Roles:** Updated to better reflect O&G platform use cases
  - Manager (operations management), AssetManager (asset creation), Compliance (verification - future use)
  - See `BACKEND_FRONTEND_MAPPING.md` for role permissions details
- **Production Config:** Must fix `docker-compose.prod.yml` before deployment
- **Simplify Integration:** Blocked awaiting API documentation
- **Persona Testing:** Code complete, needs manual testing

### Admin Panel Testing

**Admin Authentication (Phase 1 Complete - Ready for Testing):**
- ✅ Admin authentication system implemented
- ✅ Admin login page: `/admin/login`
- ✅ Admin routes protected with `AdminAuthGuard`
- **Testing Steps:**
  1. Create admin user: 
     ```bash
     cd backend
     node scripts/create-admin.mjs admin@example.com Admin User
     # Or with password:
     node scripts/create-admin.mjs admin@example.com Admin User "YourSecurePassword123!"
     ```
     - Script will generate a CSV file with credentials if password not provided
     - Password must be at least 12 characters (backend validation)
     - **Example:** `node scripts/create-admin.mjs nick@centexblueprint.com Nick User "YourPassword123!"`
  2. Start admin-service: 
     ```bash
     cd backend
     pnpm nest start admin-service --watch
     ```
     - Runs on port **4243** by default (or 4242 if `ADMIN_SERVICE_PORT` env var is set)
     - Check console for actual port: `Listening on http://[::]:4243` (or `[::]:4242` if env var is set)
     - Verify service is running: `http://localhost:4243/auth/login` should respond (POST request)
     - **Note:** `docker-compose.prod.yml` maps port 4242:4242, ensure `ADMIN_SERVICE_PORT=4242` is set if using production docker-compose
  3. Configure frontend environment variable (if needed):
     ```bash
     # In frontend/.env or .env.local
     VITE_ADMIN_API_URL=http://localhost:4243
     ```
     - Defaults to `http://localhost:4243` if not set
     - **Important:** Port must match admin-service port (default is 4243)
     - **Note:** If admin-service port is different, update this variable
  4. Start frontend: `npm run dev` (usually runs on port 5173 or 5000)
  5. Visit admin login: `http://localhost:5173/admin/login` (or `http://localhost:5000/admin/login`)
  6. Login with admin credentials from CSV file or provided password
  7. Verify redirect to `/admin` panel
  8. Verify admin token is stored in localStorage as `admin_access_token`
  9. Test logout and verify redirect back to `/admin/login`

- **Troubleshooting "Failed to fetch" Error:**
  - ✅ Verify admin-service is running: Check terminal for "Listening on..."
  - ✅ Verify admin-service port: Default is 4243, check `ADMIN_SERVICE_PORT` env var (can be set to 4242 in production)
  - ✅ Verify frontend API URL: Check `VITE_ADMIN_API_URL` matches admin-service port
  - ✅ Check CORS: Admin-service should allow frontend origin in CORS config
  - ✅ Check network tab: Verify API call is going to correct URL
  - ✅ Verify credentials: Make sure admin user exists in database
  - ✅ Check console: Look for detailed error messages in browser console
- **Files Created:**
  - `frontend/src/lib/api-admin.ts` - Admin API client
  - `frontend/src/lib/services/admin-auth.service.ts` - Admin auth service
  - `frontend/src/hooks/use-admin-auth.ts` - Admin auth hook
  - `frontend/src/pages/admin-login.tsx` - Admin login page
  - `frontend/src/components/guards/AdminAuthGuard.tsx` - Admin auth guard
- **Environment Variable:** `VITE_ADMIN_API_URL=http://localhost:4243` (defaults to `http://localhost:4243`)
  - **Note:** Admin-service runs on port **4243** by default (or 4242 if `ADMIN_SERVICE_PORT` env var is set)
  - **Fix:** Updated frontend API client default to match backend port
- **See:** `ADMIN_PANEL_AUTHENTICATION_PLAN.md` for complete implementation details

---

**Last Updated:** January 19, 2026  
**Platform:** Digital Ocean  
**Status:** Ready for Backend Integration & Production Deployment
