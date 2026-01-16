 # MVP Build Guide (O&G Platform)
 
 This document defines the MVP scope, required services, endpoints, data flows, and build checklist so a dev team can implement a shippable MVP.
 
 ## MVP Goal
 
 A production‑ready MVP that supports:
 - List assets
 - Data rooms
 - Marketplace exposure
 - Authenticate via Persona
 - Auto‑record on courthouse (e‑notary + e‑recording)
 
 **Deferred to later release:** AI features (deal analytics, AI run sheets, AI verification).
 
 ## MVP Scope (Keep / Cut)
 
 **Keep**
 - Asset listing creation + browsing
 - Data room creation + document upload
 - Basic transaction flow (offers → close)
 - Persona identity verification gate
 - E‑notary + e‑recording integration
 
 **Cut / Defer**
 - AI verification in Create Listing (Enverus AI Verify UI)
 - AI Run Sheets and Deal Analytics
 - Advanced portfolio analytics
 - Division orders (unless required for immediate revenue distribution)
 - Tokenization of assets (blockchain automation is part of MVP - smart contracts already exist)
 
 ## Required Services
 
 **Frontend**
 - Dashboard UI (React + Vite) with mock mode disabled for MVP
 
**Backend Services (Production)**
- **core-api**: Assets, data rooms, transactions, authentication, Persona, Simplify/Simplifile
- **admin-service**: Optional for MVP, but required for admin reviews and overrides
- **kms-service**: Required if signing or encryption is needed in production
- **blockchain-service**: Required if on-chain escrow/settlement is in MVP scope
- **ipfs-service** (or alternative): Required for storing assignment docs if IPFS is used
- **og-lens-platform** (indexer-api + lens-manager): Required for P2P indexing if marketplace relies on lens data
- **og-data-room-backend**: Required if data room storage is served by the Go service
 
 **Infrastructure**
 - PostgreSQL, Redis
 - File storage (IPFS or S3; choose one for MVP)
 
## Current Code Inventory (Verified in Repo)

**Frontend**
- `frontend/` contains a single React + Vite dashboard app (Wouter routing).
- Web3Auth integration is present.
- Mock API system is enabled by default unless `VITE_USE_MOCK_API=false`.

**Backend**
- `backend/` is a NestJS monorepo with these apps (confirmed via `nest-cli.json`):
  - `core-api`
  - `admin-service`
  - `kms-service`
  - `blockchain-service`
  - `ipfs-service`
- Shared libraries under `backend/libs` (common, config, database).
- Infrastructure docker‑compose definitions present (`backend/docker-compose.yml`).

**Smart Contracts**
- `contracts/og-smart-contracts` exists.
- Status per contract README: base code copied, O&G adaptation pending.

**Referenced in Docs but Not Present in Repo**
- `og-lens-platform` code is **not** present in this workspace (docs exist).
- `og-data-room-backend` code is **not** present in this workspace.
- Separate `og-marketplace` and `og-data-room-frontend` repos are **not** present; only the single `frontend/` app is here.

## Service Ports (From backend/docker-compose.yml)

- **core-api**: 3000
- **admin-service**: 4242
- **kms-service**: 3001
- **blockchain-service**: 3003
- **ipfs-service**: 3004
- **PostgreSQL**: 5432
- **Redis**: 6379
- **RabbitMQ**: 5672 (AMQP), 15672 (management)

## Backend Services Detail (What Must Be Live)

**core-api**
- Mandatory. All MVP functionality routes through this service.

**og-lens-platform (indexer-api + lens-manager)**
- Required only if marketplace exposure depends on P2P/indexer data.
- If MVP relies on core-api only, defer lens platform to phase 2.

**og-data-room-backend**
- Required if data rooms are backed by the Go service.
- If data rooms are served directly from core-api, keep minimal or defer.

**blockchain-service + kms-service**
- Required if the MVP includes on-chain settlement or signature workflows.
- If MVP is off-chain only, keep minimal or defer blockchain automation.

## Backend Capabilities (What Exists)

**core-api**
- Auth flow (Web3Auth to internal JWT).
- REST API orchestration (assets, offers, transactions, revenue, notifications).
- Enverus integration in backend (see `backend/apps/core-api/src/enverus`).
- Event reconciliation patterns (RabbitMQ + BullMQ) in docs.

**admin-service**
- Admin auth + organization/user management.
- Asset verification workflows (per backend docs).

**kms-service**
- Wallet/key custody and signing helpers (AWS KMS integration in docs).

**blockchain-service**
- Job‑based on‑chain execution (BullMQ), transaction finalization events.

**ipfs-service**
- File pinning worker with Pinata/Fula providers.

## Smart Contracts (MVP Scope)

If the MVP includes on-chain escrow or settlement:
- Deploy escrow/settlement contracts (from `contracts/og-smart-contracts`)
- Store contract addresses in backend config
- Validate contract events update transaction status

If MVP is off-chain only:
- Keep contracts deployed to testnet only
- Record transaction status in DB without on-chain enforcement

 ## Required External Integrations
 
 **Persona**
 - Identity verification for users prior to listing or closing
 
 **Simplify / Simplifile**
 - E‑notary session
 - E‑recording submission
 - Status webhooks / polling
 
## What We Have vs MVP Requirement (Status Matrix)

| Requirement | Current State in Repo | Notes |
| --- | --- | --- |
| Asset listings | UI + backend services exist | Frontend defaults to mock data |
| Data rooms | UI + service layer exist | Go backend not present in repo |
| Marketplace exposure | UI exists | Needs real data source (core-api or lens) |
| Persona verification | Not implemented | Only mock flags exist in frontend |
| E‑notary + recording | Not implemented | Only UI/fields for recording exist |
| Blockchain escrow | Contracts present but not adapted | Requires on-chain integration work |
| Lens platform indexing | Not in repo | Docs exist; code missing |

 ## Required Internal Endpoints (Core API)
 
 ### Auth and Users
 - `POST /auth/login/web3auth` (or OAuth of choice)
 - `GET /me`
 - `GET /users/:id`
 - `PATCH /users/:id` (store `personaVerified`, `kycStatus`)
 
 ### Assets
 - `GET /assets`
 - `GET /assets/:id`
 - `POST /assets`
 - `PATCH /assets/:id`
 - `DELETE /assets/:id` (optional for MVP)
 
 ### Data Rooms
 - `GET /data-rooms`
 - `GET /data-rooms/:id`
 - `GET /data-rooms/asset/:id`
 - `POST /data-rooms`
 - `PATCH /data-rooms/:id`
 - `POST /data-rooms/:id/documents`
 - `DELETE /data-rooms/:id/documents/:docId`
 
 ### Transactions (Minimal)
 - `POST /offers` (or direct `POST /transactions` if offers are skipped)
 - `POST /transactions`
 - `GET /transactions`
 - `GET /transactions/:id`
 - `POST /transactions/:id/close`
 
 ### Persona (Identity Verification)
- `POST /verification/persona/session`
- `GET /verification/persona/status`
- `POST /webhooks/persona`
 
 ### Document Generation for Recording
 - `POST /transactions/:id/generate-assignment`
 - `GET /documents/:documentId`
 
 ### Simplify / Simplifile (Notary + Recording)
 - `POST /notary/simplify/session`
 - `POST /webhooks/simplify/notary`
 - `POST /recording/simplify/submit`
 - `GET /transactions/:id/recording-status`
 - `POST /webhooks/simplify/recording`
 
 ## Frontend Widget → Endpoint Mapping (MVP)
 
 | UI Area | Endpoint | Notes |
 | --- | --- | --- |
 | Marketplace list | `GET /assets` | Must be real (no mock) |
 | Asset detail | `GET /assets/:id` | Must be real |
 | Create listing | `POST /assets` | Must be real |
 | Data room list | `GET /data-rooms` | Must be real |
 | Data room detail | `GET /data-rooms/:id` | Must be real |
 | Upload doc | `POST /data-rooms/:id/documents` | Must be real |
 | Persona verification | `POST /verification/persona/session` | Must be real |
 | Recording status | `GET /transactions/:id/recording-status` | Must be real |
 
 ## Data Model Minimums
 
 **User**
 - `id`, `email`, `fullName`
 - `personaVerified: boolean`
 - `kycStatus: 'pending' | 'verified' | 'failed'`
 
 **Asset**
 - `id`, `name`, `type`, `category`, `county`, `state`
 - `price`, `status`, `ownerId`
 
 **DataRoom**
 - `id`, `assetId`, `name`, `status`
 
 **Document**
 - `id`, `dataRoomId`, `name`, `type`, `storageUrl`
 
 **Transaction**
 - `id`, `assetId`, `buyerId`, `sellerId`
 - `status`, `closedAt`
 - `recordingStatus`, `recordingFileNumber`, `recordingBookPage`
 
 ## MVP User Flow (End‑to‑End)
 
 1. User signs up / logs in.
 2. User completes Persona verification.
 3. User creates an asset listing.
 4. System creates a data room and allows uploads.
 5. Buyer browses marketplace and initiates offer / transaction.
 6. Transaction closes.
 7. Assignment document generated.
 8. Notary session initiated (Simplify).
 9. Notary completed (webhook).
 10. Recording submitted (Simplify).
 11. Recording completed (webhook).
 
 ## Acceptance Criteria (MVP)
 
 - Users cannot list or close without Persona verification.
 - Marketplace lists only real assets (no mock data).
 - Data rooms store and retrieve real documents.
 - Recording status transitions to `RECORDED` after Simplify callback.
 - Audit log captures Persona + recording events.

## Production Readiness (Real Users)

- HTTPS enforced; Web3Auth and Persona require secure origins.
- Error monitoring (Sentry or equivalent) for frontend + backend.
- Webhook reliability: retries, idempotency, and audit logs.
- Data retention and PII handling policy for Persona data.
- Incident response playbook and uptime monitoring.
 
 ## Implementation Checklist
 
 - Disable mock mode in frontend (`VITE_USE_MOCK_API=false`).
- Implement Persona session + webhook handling.
- Store Persona status in user profile.
 - Implement Simplify notary + recording endpoints.
 - Implement document generation for recording.
 - Wire frontend to real endpoints for assets + data rooms.
 - Add recording status UI to settlements (or a dedicated transaction screen).
 - Add monitoring/logs for webhook failures.
 
 ## Out of Scope for MVP (Explicit)
 
 - AI verification, AI run sheets, AI deal scoring
 - Advanced analytics / KPI dashboards
 - Division orders automation
 - Blockchain automation beyond minimal settlement hooks
 
