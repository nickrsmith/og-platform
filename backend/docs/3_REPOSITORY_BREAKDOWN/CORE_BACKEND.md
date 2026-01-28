# Repository Breakdown: `core-backend`

## Role in System

The `core-backend` is the central nervous system of the Empressa platform. It is a NestJS monorepo containing multiple microservices that collectively handle all business logic, data orchestration, security, and interaction with external systems like the blockchain and IPFS.

This repository orchestrates the workflows that are triggered by or result in changes to the state of the platform, including data room management functionality integrated within the core-api service.

## Tech Stack

- **Framework:** NestJS
- **Database:** PostgreSQL with Prisma ORM
- **Job Queues:** BullMQ with Redis
- **Event Messaging:** RabbitMQ
- **Authentication:** Passport.js with JWT strategy, `jose` for external token validation.
- **Blockchain Interaction:** Ethers.js

## Microservice Breakdown

This monorepo contains five distinct, deployable applications (`apps/*`).

### 1. `core-api`

- **Role:** The primary API gateway for the frontend dashboard.
- **Port:** 3002 (default)
- **API Prefix:** `/api/v1` for all endpoints, `/api/docs` for Swagger documentation
- **Responsibilities:**
  - Handles the user authentication flow (exchanging Web3Auth tokens for internal JWTs).
  - Provides REST endpoints for all user-facing actions (e.g., updating profiles, submitting organization requests, initiating asset purchases, data room management).
  - Acts as an orchestrator and proxy, forwarding requests to other internal services (`kms-service`, `blockchain-service`).
  - Listens for events from RabbitMQ (via `ReconciliationProcessor`) to perform final data updates after background jobs complete.
  - Data room management functionality for document organization and access control.

### 2. `admin-service`

- **Role:** The dedicated, secure API gateway for the admin dashboard frontend.
- **Port:** 4243 (default)
- **Responsibilities:**
  - Handles administrator authentication (email/password with JWT).
  - Provides REST endpoints for all administrative actions (approving/rejecting organizations, verifying assets, managing users, analytics).
  - Forwards requests to other services (like `core-api` or directly to the database) to execute these actions.

### 3. `kms-service` (Key Management Service)

- **Role:** A highly secure, internal-only service for managing all cryptographic keys.
- **Port:** 3001 (default)
- **Responsibilities:**
  - Creates and stores new user blockchain wallets using **envelope encryption** (encrypting a private key with a Data Encryption Key, which is itself encrypted by a master Key Encryption Key via AWS KMS).
  - Securely serves decrypted private keys *only* to trusted internal services (like `blockchain-service`) on demand for signing transactions. **It never exposes private keys to the outside world.**

### 4. `ipfs-service`

- **Role:** An asynchronous background worker for handling all file uploads and pinning.
- **Port:** 3004 (default)
- **Responsibilities:**
  - Processes jobs from the `ipfs-pinning` **BullMQ** queue.
  - Uses a provider strategy to upload files to IPFS pinning service (Pinata).
  - Reports job completion or failure back to the queue system, which `core-api` listens to.

### 5. `blockchain-service`

- **Role:** An asynchronous background worker for executing all on-chain transactions.
- **Port:** 3003 (default)
- **Responsibilities:**
  - Processes jobs from the `blockchain-jobs` **BullMQ** queue.
  - Contains job handlers for each type of on-chain action (e.g., `CREATE_ASSET`, `LICENSE_ASSET`, `VERIFY_ASSET`).
  - Fetches the appropriate private key from `kms-service` to sign the transaction (e.g., the user's key for a purchase, the platform's verifier key for a verification).
  - Submits the signed transaction to the blockchain via an RPC endpoint and waits for confirmation.
  - Upon confirmation, it publishes a `transaction.finalized` event to **RabbitMQ** to notify other services that the on-chain state has changed.

## External Interactions

The `core-backend` is the primary integration point for most of the system's external and internal services.

- **Frontend Dashboard**: Consumes the `core-api` for user-facing functionality.
- **Admin Dashboard**: Consumes the `admin-service` for administrative functionality.
- **Blockchain RPC**: The `blockchain-service` connects to an Ethereum RPC node to submit transactions.
- **IPFS Providers**: The `ipfs-service` connects to Pinata for IPFS pinning.
- **AWS KMS**: The `kms-service` uses AWS KMS for key encryption/decryption operations.
- **Shared Infrastructure**: All services connect to PostgreSQL (port 5432), Redis (port 6379), and RabbitMQ (ports 5672/15672) as needed.
