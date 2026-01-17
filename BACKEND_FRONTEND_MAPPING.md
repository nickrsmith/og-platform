# Backend/Frontend Mapping & User Flow Documentation

**Last Updated:** January 16, 2026  
**Version:** 1.2  
**Recent Changes:**
- Organization roles renamed - Admin→Manager, Creator→AssetManager, Verifier→Compliance (Migration: `20260116200000_rename_organization_roles`)
- Admin panel documentation updated - Added admin-service endpoints (users, analytics, flagged/featured listings)
- Admin panel frontend routes documented - Added admin panel routes and component mappings

## Overview

This document provides a comprehensive mapping between the backend API endpoints and frontend components, along with detailed user flow logic for the O&G Platform MVP. The platform is built with a NestJS backend (core-api) and a React + Vite frontend, communicating via REST APIs with JWT authentication.

### Architecture Summary

- **Backend**: NestJS monorepo with core-api service (port 3000)
- **Frontend**: React + Vite with Wouter routing
- **Authentication**: Web3Auth → JWT tokens
- **API Base**: `http://localhost:3000/api/v1`
- **Documentation**: Swagger UI at `/api/v1/docs`
- **Blockchain**: Smart contracts for escrow, settlement, asset transfer
- **Blockchain Service**: Port 3003 (on-chain operations)
- **KMS Service**: Port 3001 (key management for signing)
- **Message Queue**: RabbitMQ (event-driven reconciliation)
- **Job Queue**: BullMQ (blockchain job processing)

### Key User Categories

- **Category A**: Major Operators & E&P Companies
- **Category B**: Brokers & Independent Operators  
- **Category C**: Individual Mineral Owners

---

## Backend API Endpoints

### Authentication (`/api/v1/auth`)

| Endpoint | Method | Description | Frontend Usage |
|----------|--------|-------------|----------------|
| `/auth/login/web3auth` | POST | Web3Auth login, returns JWT | `login.tsx` - Web3Auth integration |
| `/auth/logout` | POST | Logout user, invalidate token | User menu logout action |
| `/auth/refresh` | POST | Refresh JWT token | Token refresh interceptor |
| `/auth/session/start` | POST | Start authenticated session | Session initialization |

**Controller**: `AuthController` (`backend/apps/core-api/src/auth/auth.controller.ts`)

---

### Verification (`/api/v1/verification`)

| Endpoint | Method | Description | Frontend Usage |
|----------|--------|-------------|----------------|
| `/verification/persona/session` | POST | Create Persona verification session | `identity-verification.tsx` - start verification |
| `/verification/persona/status` | GET | Get Persona verification status | `identity-verification.tsx` - check status |
| `/verification/webhooks/persona` | POST | Persona webhook endpoint | Receives Persona verification status updates |

**Controller**: `VerificationController` (`backend/apps/core-api/src/verification/verification.controller.ts`)

---

### Users (`/api/v1/users`)

| Endpoint | Method | Description | Frontend Usage |
|----------|--------|-------------|----------------|
| `/users/me` | GET | Get current user profile | `profile.tsx`, `useAuth` hook |
| `/users/p2p/:peerId` | GET | Get user by P2P peer ID | **Deferred for MVP** - P2P features coming later |
| `/users/me/p2p-identity` | GET | Get current user's P2P identity | **Deferred for MVP** - P2P features coming later |
| `/users/me/wallet/balance` | GET | Get user wallet balance | `wallet.tsx` - balance display |
| `/users/me/sales` | GET | Get user's sales history | Sales analytics, portfolio |
| `/users/me/transaction-history` | GET | Get user's transaction history | Transaction history views |
| `/users/me/royalty-chart` | GET | Get royalty chart data | Portfolio charts, analytics |

**Controller**: `UsersController` (`backend/apps/core-api/src/users/users.controller.ts`)

**Note**: User profile updates may be handled via organizations endpoint for org members.

**MVP User Identification**:
- **Primary Identifier**: JWT User ID (`req.user.sub`) - UUID from user table
- **Organization Context**: `req.user.organizationId` - User's organization membership
- **Site Address**: `req.user.siteAddress` - Organization's unique site identifier
- **Wallet Address**: Retrieved via `userId` lookup in wallet table (for blockchain operations)

**MVP Scope**: P2P (peer-to-peer) features are deferred. For MVP, user identification uses:
- JWT User ID (`sub`) as the primary identifier
- Organization ID and Site Address for organization-scoped operations
- Wallet Address (via user lookup) for blockchain transactions

**Wallet Provisioning (All Users)**:
**ALL users** (Category A, B, and C) automatically receive a wallet during registration/login:
- Wallet is created via `kms-service` when user first logs in
- Wallet address stored in `wallets` table linked to `userId`
- Wallet is funded with gas and MockUSDC via faucet job (for development/testing)
- **Category C users DO get wallets** because they need them to:
  - Make offers on assets (on-chain operations)
  - Participate in transactions/escrow (requires wallet address)
  - Receive payments when selling assets (USDC distribution to wallet)
  - Pay platform fees (if applicable)

**Organization Roles** (Category A & B only):

**Important:** Category C (Individual Mineral Owners) **DO NOT have organizations** and therefore **DO NOT have organization roles**. They operate independently as individual users.

**Organization Roles** apply only to Category A & B organizations:
- **Category A**: Major Operators & E&P Companies (have organizations with team roles)
- **Category B**: Brokers & Independent Operators (have organizations with team roles)
- **Category C**: Individual Mineral Owners (**NO organization, NO roles** - operate independently)

**Category C Users:**
- Don't belong to any organization
- Don't have organization roles
- Can create their own asset listings directly (no organization needed)
- Have wallets for transactions (automatic provisioning)
- Get 0% platform fees (free listings)
- Operate as individual owners with full control over their own assets

**Organization Roles (Category A & B only):**

- **Principal** - Organization owner/leader (the person who created or is designated as the primary contact)
  - Full organization management (can invite members, update organization settings)
  - Can create assets/listings for the organization
  - Receives blockchain permissions automatically when organization contract is deployed
  - Only one Principal per organization (set at creation)

- **Manager** - Organization administrator with management permissions (formerly "Admin")
  - Can invite new members to the organization
  - Can manage member roles (change roles, remove members)
  - Can update organization profile and settings
  - Can create assets/listings for the organization
  - Typically used for department heads or trusted managers

- **AssetManager** - Team member who can create and manage assets/listings (formerly "Creator")
  - Can create new asset listings for the organization
  - Can edit assets they've created (within organization's assets)
  - Can manage offers and transactions on organization's assets
  - Receives on-chain `CREATOR_ROLE` when invited to organizations with smart contracts
  - Typical role for asset managers, deal makers, listing coordinators

- **Compliance** - Can verify/review assets (formerly "Verifier", currently reserved for future use)
  - Intended for internal asset verification workflows
  - May be used for quality assurance or compliance review
  - Currently not actively used in MVP workflows

**Role Permissions Summary (Category A & B only)**:
- **Invite Members**: Principal, Manager only (`@Roles(Role.Principal, Role.Manager)`)
- **Manage Members**: Principal, Manager only
- **Create Assets**: Principal, Manager, AssetManager
- **Manage Organization Settings**: Principal, Manager only

**Category C Permissions** (No organization roles):
- Category C users can create/manage their own assets directly (no role needed)
- Full control over their own listings and transactions
- No team management (they're solo operators)

---

### Assets/Releases (`/api/v1/releases`)

| Endpoint | Method | Description | Frontend Usage |
|----------|--------|-------------|----------------|
| `/releases` | GET | List assets/releases with filters | `marketplace.tsx` - browse assets |
| `/releases/:id` | GET | Get asset details | `asset-detail.tsx` - view asset |
| `/releases` | POST | Create new asset listing | `create-listing.tsx` - create asset |
|  |  | **PSA Fields**: `psaData` object with purchasePriceAllocation, revenueDistribution, whereMoniesGo, dealStructure |  |
| `/releases/:id` | PATCH | Update asset listing | `asset-edit.tsx` - edit asset |
| `/releases/:id` | DELETE | Delete asset listing | `my-assets.tsx` - delete action |
| `/releases/:id/files` | POST | Upload asset files/thumbnails | `create-listing.tsx`, `asset-edit.tsx` |
| `/releases/:id/licenses` | POST | License asset on-chain | Asset licensing flow |
| `/releases/check-hash/:hash` | GET | Check if asset hash exists | Asset validation |

**Controller**: `ReleasesController` (`backend/apps/core-api/src/releases/releases.controller.ts`)

**PSA (Purchase and Sale Agreement) Fields** ✅ IMPLEMENTED:
The `POST /releases` endpoint now accepts an optional `psaData` JSONB object containing:
- **Basic PSA Information**: executionDate, effectiveDate, effectiveTime, depositPercent, depositAmount, closingDate, leasesNotes, wellsNotes, contractsNotes, allocatedValuesNotes
- **Purchase Price Allocation** (5 fields): leases, wells, equipment, other, notes
- **Revenue Distribution** (4 fields): sellerPercent, buyerPercent, other, notes
- **Where Monies Go** (6 fields): sellerAmount, platformFee, integratorFee, escrowAmount, other, notes
- **Deal Structure** (5 fields): type, paymentTerms, financingTerms, closingConditions, notes

PSA data is stored in the release metadata and returned in `GET /releases/:id` responses.

**MVP Note**: Releases use `siteAddress` and `organizationId` from JWT for identification. P2P fields may be present in JWT but are not used for MVP business logic.

**Frontend Service**: `assets.service.ts`
- `listAssets(options)` → `GET /releases`
- `getAsset(id)` → `GET /releases/:id`
- `createAsset(data)` → `POST /releases`
- `updateAsset(id, data)` → `PATCH /releases/:id`
- `deleteAsset(id)` → `DELETE /releases/:id`
- `uploadAssetFiles(id, files)` → `POST /releases/:id/files`
- `licenseAsset(id, attemptId)` → `POST /releases/:id/licenses`
- `checkAssetHash(hash)` → `GET /releases/check-hash/:hash`

---

### Data Rooms (`/api/v1/data-rooms`) ✅ IMPLEMENTED

| Endpoint | Method | Description | Frontend Usage | Status |
|----------|--------|-------------|----------------|--------|
| `/data-rooms` | POST | Create data room | `create-listing.tsx` - create data room | ✅ Complete |
| `/data-rooms` | GET | List data rooms with filters | `data-rooms.tsx` - list data rooms | ✅ Complete |
| `/data-rooms/:id` | GET | Get data room with documents | `data-room-viewer.tsx` - view data room | ✅ Complete |
| `/data-rooms/listing/:listingId` | GET | Get data room by listing/release ID | `asset-detail.tsx` - linked data room | ✅ Complete |
| `/data-rooms/asset/:assetId` | GET | Get data room by asset ID | `asset-detail.tsx` - linked data room | ✅ Complete |
| `/data-rooms/:id` | PATCH | Update data room | `data-room.tsx` - edit data room | ✅ Complete |
| `/data-rooms/:id` | DELETE | Delete data room | `data-rooms.tsx` - delete action | ✅ Complete |
| `/data-rooms/:id/documents` | POST | Upload document (multipart/form-data) | `data-room.tsx` - upload document | ✅ Complete |
| `/data-rooms/:id/documents/:docId` | DELETE | Delete document | `data-room.tsx` - delete document | ✅ Complete |

**Controller**: `DataRoomsController` (`backend/apps/core-api/src/data-rooms/data-rooms.controller.ts`)

**Service**: `DataRoomsService` (`backend/apps/core-api/src/data-rooms/data-rooms.service.ts`)
- Supports folder organization via `folderId`
- Tracks `documentCount` and `totalSize` automatically
- Documents stored with IPFS CID/URL (metadata only, IPFS processing can be added later)

**Frontend Service**: `data-rooms.service.ts` exists in `frontend/src/lib/services/`
- `createDataRoom(data)` → `POST /data-rooms`
- `getDataRoom(id)` → `GET /data-rooms/:id`
- `getDataRoomByListing(listingId)` → `GET /data-rooms/listing/:listingId`
- `getDataRoomByAsset(assetId)` → `GET /data-rooms/asset/:assetId`
- `listDataRooms(options)` → `GET /data-rooms`
- `updateDataRoom(id, data)` → `PATCH /data-rooms/:id`
- `deleteDataRoom(id)` → `DELETE /data-rooms/:id`
- `uploadDocument(id, file, data)` → `POST /data-rooms/:id/documents`
- `deleteDocument(id, docId)` → `DELETE /data-rooms/:id/documents/:docId`

**Note**: Data rooms are implemented in core-api (not a separate service). Frontend endpoints match expected structure.

---

### Offers (`/api/v1/offers`)

| Endpoint | Method | Description | Frontend Usage |
|----------|--------|-------------|----------------|
| `/offers` | POST | Create offer on asset | `asset-detail.tsx` - make offer |
| `/offers` | GET | List offers (buyer/seller filters) | `offers.tsx` - list view |
| `/offers/:id` | GET | Get offer details | `offers.tsx` - offer detail |
| `/offers/:id` | PATCH | Update offer | `offers.tsx` - edit offer |
| `/offers/:id/accept` | POST | Accept offer | `offers.tsx` - accept action |
| `/offers/:id/decline` | POST | Decline offer | `offers.tsx` - decline action |
| `/offers/:id/withdraw` | POST | Withdraw offer | `offers.tsx` - withdraw action |
| `/offers/:id/counter` | POST | Create counter offer | `offers.tsx` - counter offer |

**Controller**: `OffersController` (`backend/apps/core-api/src/offers/offers.controller.ts`)

**Frontend Service**: `offers.service.ts`
- `createOffer(data, idempotencyKey)` → `POST /offers`
- `getOffer(id)` → `GET /offers/:id`
- `listOffers(options)` → `GET /offers`
- `updateOffer(id, data, key)` → `PATCH /offers/:id`
- `acceptOffer(id, data, key)` → `POST /offers/:id/accept`
- `declineOffer(id, data, key)` → `POST /offers/:id/decline`
- `withdrawOffer(id, key)` → `POST /offers/:id/withdraw`
- `createCounterOffer(id, data, key)` → `POST /offers/:id/counter`

---

### Transactions (`/api/v1/transactions`)

| Endpoint | Method | Description | Frontend Usage |
|----------|--------|-------------|----------------|
| `/transactions` | POST | Create transaction from accepted offer | Auto-created when offer accepted |
| `/transactions` | GET | List transactions with filters | `settlements.tsx` - list view |
| `/transactions/:id` | GET | Get transaction details | `settlement-detail.tsx` - view transaction |
| `/transactions/:id/status` | PATCH | Update transaction status | Transaction workflow |
| `/transactions/:id/deposit-earnest` | POST | Deposit earnest money | `settlement-detail.tsx` - earnest deposit |
| `/transactions/:id/complete-due-diligence` | POST | Complete due diligence | `settlement-detail.tsx` - DD completion |
| `/transactions/:id/fund` | POST | Fund transaction | `settlement-detail.tsx` - funding |
| `/transactions/:id/close` | POST | Close transaction | `settlement-detail.tsx` - close transaction |
| `/transactions/:id/settlement-statement` | GET | Get settlement statement | `settlement-detail.tsx` - view statement |
| `/transactions/:id/recording-status` | GET | Get recording status | `settlement-detail.tsx` - recording status |

**Controllers**: 
- `TransactionsBusinessController` (`backend/apps/core-api/src/transactions/transactions-business.controller.ts`) - Business logic endpoints
- `TransactionsController` (`backend/apps/core-api/src/transactions/transactions.controller.ts`) - Job status and transaction lookup

**Additional Endpoints**:
- `GET /transactions/jobs/:jobId` - Get blockchain job status
- `GET /transactions/:id` - Get transaction status (simplified lookup)

**Frontend Service**: `transactions.service.ts`
- `createTransaction(data, idempotencyKey)` → `POST /transactions`
- `getTransaction(id)` → `GET /transactions/:id`
- `listTransactions(options)` → `GET /transactions`
- `depositEarnest(id, data, key)` → `POST /transactions/:id/deposit-earnest`
- `completeDueDiligence(id, data, key)` → `POST /transactions/:id/complete-due-diligence`
- `fundTransaction(id, data, key)` → `POST /transactions/:id/fund`
- `closeTransaction(id, data, key)` → `POST /transactions/:id/close`
- `getSettlementStatement(id)` → `GET /transactions/:id/settlement-statement`

---

### Revenue Distribution (`/api/v1/revenue`)

| Endpoint | Method | Description | Frontend Usage |
|----------|--------|-------------|----------------|
| `/revenue/calculate-split` | POST | Calculate revenue split | Transaction settlement calculations |
| `/revenue/fee-structure/:orgContractAddress` | GET | Get fee structure | Organization settings |
| `/revenue/stats/:orgContractAddress` | GET | Get revenue statistics | Portfolio analytics |
| `/revenue/earnings/:organizationId` | GET | Get organization earnings | Revenue dashboard |

**Controller**: `RevenueController` (`backend/apps/core-api/src/revenue/revenue.controller.ts`)

**Frontend Service**: `revenue.service.ts`
- `calculateRevenueSplit(data)` → `POST /revenue/calculate-split`
- `getFeeStructure(orgContractAddress)` → `GET /revenue/fee-structure/:orgContractAddress`
- `getRevenueStatistics(orgContractAddress)` → `GET /revenue/stats/:orgContractAddress`
- `getOrganizationEarnings(orgId, options)` → `GET /revenue/earnings/:organizationId`

---

### Blockchain Service (`http://localhost:3003`)

The blockchain-service handles all on-chain operations via job queues and event-driven reconciliation.

#### Blockchain Jobs (`/jobs`)

| Endpoint | Method | Description | Usage |
|----------|--------|-------------|-------|
| `/jobs` | POST | Create blockchain job (escrow, asset transfer, etc.) | Called by core-api to enqueue on-chain operations |
| `/jobs/:jobId` | GET | Get job status | Job status polling |

**Job Types (ChainEventType)**:
- `CREATE_ESCROW` - Create escrow contract for transaction
- `DEPOSIT_EARNEST` - Deposit earnest money to escrow
- `COMPLETE_DUE_DILIGENCE` - Mark due diligence complete on-chain
- `FUND_TRANSACTION` - Fund transaction (transfer to escrow)
- `CLOSE_ESCROW` - Close escrow and distribute funds
- `CANCEL_ESCROW` - Cancel escrow and refund buyer
- `INITIATE_ASSET_TRANSFER` - Initiate asset ownership transfer
- `EXECUTE_ASSET_TRANSFER` - Execute asset ownership transfer
- `CREATE_ASSET` - Create asset on-chain (for asset registry)
- `GRANT_CREATOR_ROLE` - Grant asset manager role to user (on-chain role name remains CREATOR_ROLE for smart contract compatibility)
- `REVOKE_CREATOR_ROLE` - Revoke asset manager role from user (on-chain role name remains CREATOR_ROLE for smart contract compatibility)

**Controller**: `JobsController` (`backend/apps/blockchain-service/src/jobs/jobs.controller.ts`)

**Job Processing Flow**:
1. core-api creates job: `POST /jobs` with `X-Idempotency-Key` header
2. blockchain-service enqueues to BullMQ `blockchain-jobs` queue
3. Worker processes job:
   - Fetches private key from kms-service
   - Signs transaction with Ethers.js
   - Submits to blockchain
   - Waits for confirmation
4. On confirmation/failure: Publishes `transaction.finalized.*` event to RabbitMQ
5. core-api ReconciliationProcessor listens and updates database

#### Blockchain RPC (`/rpc`)

| Endpoint | Method | Description | Usage |
|----------|--------|-------------|-------|
| `/rpc/wallets/:walletAddress/balance` | GET | Get wallet balance | Wallet balance checks |
| `/rpc/receipts/:txHash` | GET | Get transaction receipt | Transaction verification |
| `/rpc/assets/check-hash/:hash` | GET | Check if asset hash exists | Asset validation |
| `/rpc/factory/fees` | GET | Get platform fees | Fee structure queries |
| `/rpc/orgs/:orgContractAddress/integrator` | GET | Get integration partner | Organization queries |
| `/rpc/orgs/:orgContractAddress/earnings` | GET | Get organization earnings | Revenue queries |
| `/rpc/revenue-distributor/stats/:orgContractAddress` | GET | Get revenue stats | Revenue analytics |
| `/rpc/revenue-distributor/earnings/:orgContractAddress` | GET | Get earnings breakdown | Revenue breakdown |
| `/rpc/revenue-distributor/fees/:orgContractAddress` | GET | Get custom fees | Fee structure queries |

**Controller**: `RpcController` (`backend/apps/blockchain-service/src/rpc/rpc.controller.ts`)

---

### Smart Contracts

#### EmpressaEscrow.sol

**Purpose**: Holds funds in escrow during transaction lifecycle and distributes automatically.

**Key Functions**:
- `createEscrow()` - Creates escrow with buyer, seller, purchase price, earnest amount
- `depositEarnest()` - Buyer deposits earnest money (USDC)
- `completeDueDiligence()` - Marks due diligence complete
- `fundTransaction()` - Buyer funds transaction (auto-closes when fully funded)
- `closeEscrow()` - Closes escrow, distributes funds via EmpressaRevenueDistributor
- `cancelEscrow()` - Cancels escrow, refunds buyer

**Events**:
- `EscrowCreated` - Escrow created
- `EarnestDeposited` - Earnest money deposited
- `DueDiligenceComplete` - Due diligence marked complete
- `FundingReceived` - Funding received
- `EscrowClosed` - Escrow closed, funds distributed
- `EscrowCancelled` - Escrow cancelled
- `EscrowRefunded` - Funds refunded

**Escrow Status Flow**:
```
PENDING → EARNEST_DEPOSITED → DUE_DILIGENCE → FUNDING → CLOSED
                                    ↓
                              CANCELLED / REFUNDED
```

#### EmpressaRevenueDistributor.sol

**Purpose**: Distributes revenue with category-based fee calculation.

**Fee Structure**:
- **Category A & B**: 5% Empressa fee, 1% Integrator fee, 94% to asset manager/organization
- **Category C**: 0% fees, 100% to asset owner (free listing)

**Key Function**:
- `distributeRevenue()` - Called by escrow contract to distribute funds

#### EmpressaAssetTransfer.sol

**Purpose**: Manages asset ownership transfer on-chain.

**Key Functions**:
- `initiateTransfer()` - Initiate asset transfer
- `executeTransfer()` - Execute asset ownership transfer
- `cancelTransfer()` - Cancel transfer

**Events**:
- `TransferInitiated` - Transfer initiated
- `AssetTransferred` - Asset ownership transferred
- `TransferCancelled` - Transfer cancelled

---

### Event Reconciliation System

**Architecture**: Event-driven reconciliation via RabbitMQ

**Flow**:
1. **Blockchain Service** publishes events to RabbitMQ:
   - Exchange: `Empressa.events.topic`
   - Routing Key: `transactions.finalized.confirmed` or `transactions.finalized.failed`
   - Queue: `core-api.reconciliation.queue`

2. **Core-API ReconciliationProcessor** subscribes to events:
   - Listens for `transaction.finalized.*` events
   - Updates database with transaction hash, block number, status
   - Updates related records (releases, transactions, etc.)
   - Handles event output (extracted from transaction logs)

3. **Event Payload**:
   ```typescript
   {
     id: string; // txId
     eventType: ChainEventType;
     finalStatus: 'CONFIRMED' | 'FAILED';
     blockNumber: string;
     txHash: string;
     originalPayload: any;
     finalizedAt: Date;
     eventOutput: any; // Extracted from transaction logs
     error?: string;
     jobId: string;
   }
   ```

**Reconciliation Steps**:
1. Update chain transaction record in indexer (if configured)
2. Extract event output (e.g., escrow address, asset ID)
3. Update related database records
4. Create activity records
5. Trigger notifications if needed

---

### Organizations (`/api/v1/organizations`)

| Endpoint | Method | Description | Frontend Usage |
|----------|--------|-------------|----------------|
| `/organizations/requests/me` | GET | Get my organization request status | Registration flow |
| `/organizations/requests` | POST | Submit organization creation request | Registration flow |
| `/organizations/me` | GET | Get my organization | `organization.tsx`, `company-profile.tsx` |
| `/organizations/me/logo/status` | GET | Get logo upload status | `organization.tsx` - logo status |
| `/organizations/me/logo` | POST | Upload organization logo | `organization.tsx` - logo upload |
| `/organizations/me` | PATCH | Update my organization | `organization.tsx`, `company-profile.tsx` |
| `/organizations/me/members` | GET | List my organization members | `team.tsx` |
| `/organizations/me/invites` | POST | Invite member to organization | `team.tsx` - invite member |
| `/organizations/invitations/accept` | POST | Accept organization invitation | Invitation acceptance flow |
| `/organizations` | GET | List organizations | Browse organizations |
| `/organizations/site/:siteAddress` | GET | Get organization by site address | Site lookup |
| `/organizations/:id` | GET | Get organization details | `company-profile.tsx` |
| `/organizations/me/following` | GET | Get organizations I'm following | Following list |
| `/organizations/:id/follow-status` | GET | Get follow status for organization | Follow button state |
| `/organizations/:id/follow` | POST | Follow organization | Follow action |
| `/organizations/:id/follow` | DELETE | Unfollow organization | Unfollow action |
| `/organizations/me/earnings/balance` | GET | Get organization earnings balance | Revenue dashboard |
| `/organizations/me/earnings/withdraw` | POST | Initiate earnings withdrawal | Earnings withdrawal |
| `/organizations/me/subscriptions` | GET | Get my organization subscriptions | Subscriptions list |
| `/organizations/subscriptions` | POST | Create subscription | Subscribe to organization |
| `/organizations/subscriptions/:targetSiteAddress` | DELETE | Remove subscription | Unsubscribe |

**Controller**: `OrganizationsController` (`backend/apps/core-api/src/organizations/organizations.controller.ts`)

---

### Division Orders (`/api/v1/division-orders`)

| Endpoint | Method | Description | Frontend Usage |
|----------|--------|-------------|----------------|
| `/division-orders` | POST | Create division order | `phase2/division-orders.tsx` - create DO |
| `/division-orders` | GET | List division orders | `phase2/division-orders.tsx` - list view |
| `/division-orders/:id` | GET | Get division order by ID | `phase2/division-orders.tsx` - detail view |
| `/division-orders/:id` | PATCH | Update division order | `phase2/division-orders.tsx` - edit |
| `/division-orders/:id/approve` | POST | Approve division order | `phase2/division-orders.tsx` - approve |
| `/division-orders/:id/reject` | POST | Reject division order | `phase2/division-orders.tsx` - reject |
| `/division-orders/:id/transfers` | POST | Create ownership transfer | `phase2/division-orders.tsx` - create transfer |
| `/division-orders/:id/transfers/:transferId/approve` | POST | Approve ownership transfer | `phase2/division-orders.tsx` - approve transfer |
| `/division-orders/:id/transfers/:transferId/reject` | POST | Reject ownership transfer | `phase2/division-orders.tsx` - reject transfer |
| `/division-orders/:id/calculate-revenue` | POST | Calculate revenue split | Revenue calculations |

**Controller**: `DivisionOrdersController` (`backend/apps/core-api/src/division-orders/division-orders.controller.ts`)

**Frontend Service**: `division-orders.service.ts`

---

### Validation (`/api/v1/validation`)

| Endpoint | Method | Description | Frontend Usage |
|----------|--------|-------------|----------------|
| `/validation/asset` | POST | Validate asset data | `create-listing.tsx` - asset validation |

**Controller**: `ValidationController` (`backend/apps/core-api/src/validation/validation.controller.ts`)

---

### Enverus Integration (`/api/v1/enverus`)

| Endpoint | Method | Description | Frontend Usage |
|----------|--------|-------------|----------------|
| `/enverus/wells` | GET | Get wells data | Asset data enrichment |
| `/enverus/production` | GET | Get production data | Asset analytics |
| `/enverus/rigs` | GET | Get rigs data | Asset data enrichment |
| `/enverus/permits` | GET | Get permits data | Asset data enrichment |
| `/enverus/completions` | GET | Get completions data | Asset data enrichment |
| `/enverus/transactions` | GET | Get transactions data | Market data |
| `/enverus/validate` | POST | Validate asset with Enverus | `create-listing.tsx` - validation |

**Controller**: `EnverusController` (`backend/apps/core-api/src/enverus/enverus.controller.ts`)

---

### AI Integration (`/api/v1/ai`) ✅ Implemented

| Endpoint | Method | Description | Frontend Usage |
|----------|--------|-------------|----------------|
| `/ai/analyze-document` | POST | Analyze document (AI document analysis) | Document analysis flow |
| `/ai/generate-valuation` | POST | Generate asset valuation (AI-powered) | Asset valuation flow |
| `/ai/assess-risk` | POST | Assess asset risk (AI-powered) | Risk assessment flow |
| `/ai/generate-listing` | POST | Generate listing description (AI-powered) | Listing creation flow |

**Controller**: `AiController` (`backend/apps/core-api/src/ai/ai.controller.ts`)

**Note:** AI endpoints are implemented but may not be actively used in all flows. Integration depends on AI service configuration.

**Status**: Deferred per MVP scope

---

### Notifications (`/api/v1/notifications`) ✅ IMPLEMENTED

| Endpoint | Method | Description | Frontend Usage | Status |
|----------|--------|-------------|----------------|--------|
| `/notifications` | GET | Get user notifications (paginated, filtered) | `notifications.tsx` - list notifications | ✅ Complete |
| `/notifications/:id/read` | PATCH | Mark notification as read | `notifications.tsx` - mark read | ✅ Complete |
| `/notifications/read-all` | PATCH | Mark all notifications as read | `notifications.tsx` - mark all read | ✅ Complete |

**Notification Types**:
- `OFFER_CREATED`, `OFFER_ACCEPTED`, `OFFER_DECLINED`, `OFFER_COUNTERED`, `OFFER_WITHDRAWN`, `OFFER_EXPIRED`
- `TRANSACTION_CREATED`, `TRANSACTION_EARNEST_DEPOSITED`, `TRANSACTION_DUE_DILIGENCE_COMPLETE`, `TRANSACTION_FUNDED`, `TRANSACTION_CLOSED`, `TRANSACTION_CANCELLED`
- `SETTLEMENT_STATEMENT_READY`

**Channels**: `EMAIL`, `IN_APP`, `SMS`

**Controller**: `NotificationsController` (`backend/apps/core-api/src/notifications/notifications.controller.ts`)

**Service**: `NotificationsService` (`backend/apps/core-api/src/notifications/notifications.service.ts`)
- Automatically sends notifications on offer/transaction events
- Creates notification records in database
- Sends email notifications via EmailService
- **Pagination**: Supports `page` and `pageSize` query parameters (default: page=1, pageSize=20)
- **Filtering**: Supports `type`, `read`, and `unreadOnly` query parameters
- Returns paginated response with `notifications`, `total`, `page`, `pageSize`, and `unreadCount`

---

---

### Simplify E-Notary & E-Recording (`/api/v1`)

| Endpoint | Method | Description | Frontend Usage |
|----------|--------|-------------|----------------|
| `/notary/simplify/session` | POST | Create Simplify e-notary session | `settlement-detail.tsx` - notary session |
| `/recording/simplify/submit` | POST | Submit recording to Simplify | `settlement-detail.tsx` - recording submission |
| `/webhooks/simplify/notary` | POST | Simplify e-notary webhook | Receives notary session completion |
| `/webhooks/simplify/recording` | POST | Simplify e-recording webhook | Receives recording status updates |

**Controller**: `SimplifyController` (`backend/apps/core-api/src/simplify/simplify.controller.ts`)

---

### Core API Utilities (`/api/v1`)

| Endpoint | Method | Description | Usage |
|----------|--------|-------------|-------|
| `/health` | GET | Health check endpoint | System health monitoring |
| `/platform/fees` | GET | Get platform fee structure | Fee information display |

**Controller**: `CoreApiController` (`backend/apps/core-api/src/core-api.controller.ts`)

---

### Admin Service (`http://localhost:4243`)

**Note:** Default port is 4243 (configurable via `ADMIN_SERVICE_PORT` env var).

Separate service for admin dashboard operations. Not part of main user-facing API. All endpoints (except `/health` and `/users/p2p/:peerId`) require admin authentication via `AdminJwtAuthGuard`.

**Frontend Integration:**
- Admin panel is integrated into main React app at `/admin/*` routes
- Uses separate API client: `frontend/src/lib/api-admin.ts`
- Uses separate auth service: `frontend/src/lib/services/admin-auth.service.ts`
- Admin token stored separately: `localStorage.getItem('admin_access_token')`

#### Admin Authentication (`/auth`)

| Endpoint | Method | Description | Usage |
|----------|--------|-------------|-------|
| `/auth/login` | POST | Admin login (email/password) | Admin dashboard login |
| `/auth/logout` | POST | Admin logout | Admin dashboard logout |
| `/auth/change-password` | POST | Change admin password | Admin settings |
| `/auth/me` | GET | Get current admin | Admin profile |

**Controller**: `AuthController` (`backend/apps/admin-service/src/auth/auth.controller.ts`)

#### Admin Releases - Verification (`/releases`)

| Endpoint | Method | Description | Usage |
|----------|--------|-------------|-------|
| `/releases/pending-verifications` | GET | List assets pending verification | Admin verification queue |
| `/releases/:id/approve-verification` | POST | Approve asset verification | Admin approves asset |
| `/releases/:id/reject-verification` | POST | Reject asset verification (with optional reason) | Admin rejects asset |
| `/releases/:id` | DELETE | Delete release | Admin deletes asset |

**Controller**: `ReleasesController` (`backend/apps/admin-service/src/releases/releases.controller.ts`)

#### Admin Organizations (`/organizations`)

| Endpoint | Method | Description | Usage |
|----------|--------|-------------|-------|
| `/organizations` | GET | List all organizations | Admin org management |
| `/organizations` | POST | Create organization (by admin) | Admin creates org |
| `/organizations/requests` | GET | List pending org requests | Admin approval queue |
| `/organizations/requests/:id/approve` | POST | Approve org request | Admin approves org |
| `/organizations/requests/:id/reject` | POST | Reject org request (with optional reason) | Admin rejects org |
| `/organizations/:id` | GET | Get organization details | Admin org details |
| `/organizations/:orgId/members` | GET | List org members | Admin member management |
| `/organizations/:orgId/members/invite` | POST | Invite member | Admin invites member |
| `/organizations/:orgId/members/:userId` | PATCH | Update member role | Admin updates role |
| `/organizations/:orgId/members/:userId` | DELETE | Remove member | Admin removes member |

**Controller**: `OrganizationsController` (`backend/apps/admin-service/src/organizations/organizations.controller.ts`)

#### Admin Users (`/users`)

| Endpoint | Method | Description | Usage |
|----------|--------|-------------|-------|
| `/users` | GET | List all users (with filters: status, search) | Admin user management |
| `/users/:id` | PATCH | Update user (firstName, lastName, category) | Admin edits user |
| `/users/:id/suspend` | PATCH | Suspend user account | Admin suspends user |
| `/users/:id/reactivate` | PATCH | Reactivate user account | Admin reactivates user |
| `/users/p2p/:peerId` | GET | Get user by P2P peer ID (public) | P2P user resolution |

**Controller**: `UsersController` (`backend/apps/admin-service/src/users/users.controller.ts`)

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 50)
- `status` (string): Filter by status ('all', 'active', 'inactive')
- `search` (string): Search by email, firstName, or lastName

**Response Format:**
```typescript
{
  items: Array<{
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    status: 'active' | 'suspended';
    category: 'A' | 'B' | 'C' | null;
    verified: boolean;
    joinDate: string;
    lastActive: string | null;
  }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

#### Admin Releases - Content Management (`/releases`)

| Endpoint | Method | Description | Usage |
|----------|--------|-------------|-------|
| `/releases/flagged` | GET | List flagged listings | Admin content moderation |
| `/releases/:id/flag` | POST | Flag a listing (with reason) | Admin flags listing |
| `/releases/:id/unflag` | POST | Unflag a listing | Admin unflags listing |
| `/releases/featured` | GET | List featured listings | Admin featured content |
| `/releases/:id/feature` | POST | Feature a listing | Admin features listing |
| `/releases/:id/unfeature` | POST | Unfeature a listing | Admin unfeatures listing |

**Controller**: `ReleasesController` (`backend/apps/admin-service/src/releases/releases.controller.ts`)

**Note:** Flagged and featured endpoints are placeholder implementations until `flagged` and `featured` fields are added to the Release schema.

#### Admin Analytics (`/analytics`)

| Endpoint | Method | Description | Usage |
|----------|--------|-------------|-------|
| `/analytics/metrics` | GET | Platform metrics (users, orgs, releases, transactions) | Admin analytics dashboard |
| `/analytics/revenue` | GET | Revenue data (placeholder) | Admin revenue analytics |
| `/analytics/funnel` | GET | User conversion funnel data | Admin funnel visualization |
| `/analytics/users-by-category` | GET | User distribution by category (A, B, C) | Admin user analytics |

**Controller**: `AnalyticsController` (`backend/apps/admin-service/src/analytics/analytics.controller.ts`)

**Response Examples:**

`/analytics/metrics`:
```typescript
{
  users: {
    total: number;
    active: number;
    verified: number;
    pending: number;
  };
  organizations: {
    total: number;
    active: number;
    unclaimed: number;
  };
  releases: { total: number };
  transactions: { total: number };
}
```

`/analytics/funnel`:
```typescript
{
  stages: Array<{
    name: string;
    count: number;
    conversionRate: number;
  }>;
}
```

`/analytics/users-by-category`:
```typescript
{
  A: number; // Major Operators
  B: number; // Brokers
  C: number; // Individual Mineral Owners
}
```

---

### KMS Service (`http://localhost:3001`)

Internal-only service for secure key management. **Never exposed to public internet.**

#### Wallets (`/wallets`)

| Endpoint | Method | Description | Usage |
|----------|--------|-------------|-------|
| `/wallets` | POST | Create new wallet for user | User registration flow |
| `/wallets/users/:userId/private-key` | GET | Get user private key (decrypted) | blockchain-service signing |
| `/wallets/platform/verifier-private-key` | GET | Get platform verifier key | Asset verification signing |

**Controller**: `WalletsController` (`backend/apps/kms-service/src/wallets/wallets.controller.ts`)

**Security**: 
- All endpoints protected by network-level security (VPC, firewall)
- Only accessible by trusted internal services
- Uses AWS KMS for envelope encryption
- Private keys encrypted with Data Encryption Key (DEK)
- DEK encrypted with AWS KMS Key Encryption Key (KEK)

**Flow**:
1. User registration → core-api calls `POST /wallets`
2. KMS service generates wallet, encrypts private key with AWS KMS
3. Encrypted key stored in database
4. blockchain-service requests key: `GET /wallets/users/:userId/private-key`
5. KMS service decrypts via AWS KMS, returns plaintext (in-memory only)
6. blockchain-service uses key to sign transaction, discards immediately

---

### IPFS Service (`http://localhost:3004`)

Internal service for file storage and IPFS pinning. Processes jobs asynchronously via BullMQ.

#### IPFS Operations

**Job-Based Processing** (via BullMQ queue `ipfs-pinning`):
- core-api enqueues file upload jobs
- ipfs-service worker processes jobs
- Files uploaded to IPFS (Pinata provider)
- Completion events published to RabbitMQ
- core-api reconciles via event listeners

**Providers**:
- **Pinata**: Primary IPFS pinning service
- **Fula**: Alternative provider (if configured)

**Endpoints** (Internal, not directly called):
- Job processing handled via BullMQ queue
- Events published to RabbitMQ for reconciliation

**Service**: `IpfsService` (`backend/apps/ipfs-service/`)

**Flow**:
1. User uploads file → core-api receives file
2. core-api enqueues job to `ipfs-pinning` queue
3. ipfs-service worker picks up job
4. Worker uploads to IPFS via provider (Pinata)
5. Worker publishes `completed` event to RabbitMQ
6. core-api `IpfsEventsProcessor` listens and updates database with CID

---

## Frontend Pages & Routes

### Authentication & Onboarding

| Route | Component | Description | Backend Endpoints |
|-------|-----------|-------------|-------------------|
| `/login` | `login.tsx` | Web3Auth login | `POST /auth/login/web3auth` |
| `/register` | `register.tsx` | Initial registration | User creation |
| `/register/a` | `register-category-a.tsx` | Category A registration | User + org creation |
| `/register/b` | `register-category-b.tsx` | Category B registration | User + org creation |
| `/register/c` | `register-category-c.tsx` | Category C registration | User creation |
| `/register/verify-email` | `verify-email.tsx` | Email verification | Email verification |
| `/verify-identity` | `identity-verification.tsx` | Persona verification | Persona integration |
| `/onboarding/a` | `onboarding-a.tsx` | Category A onboarding | User profile setup |
| `/onboarding/b` | `onboarding-b.tsx` | Category B onboarding | User profile setup |
| `/onboarding/c` | `onboarding-c.tsx` | Category C onboarding | User profile setup |

---

### Marketplace & Assets

| Route | Component | Description | Backend Endpoints |
|-------|-----------|-------------|-------------------|
| `/` or `/marketplace` | `marketplace.tsx` | Browse assets | `GET /releases` |
| `/asset/:id` | `asset-detail.tsx` | View asset details | `GET /releases/:id`, `GET /data-rooms/asset/:id` |
| `/asset/:id/edit` | `asset-edit.tsx` | Edit asset | `GET /releases/:id`, `PATCH /releases/:id` |
| `/my-assets` | `my-assets.tsx` | My listings | `GET /releases?userId=current` |
| `/create-listing` | `create-listing.tsx` | Create asset listing | `POST /releases`, `POST /data-rooms` |
| `/list-asset` | `list-asset.tsx` | Alternative listing page | `POST /releases` |

---

### Data Rooms

| Route | Component | Description | Backend Endpoints |
|-------|-----------|-------------|-------------------|
| `/data-rooms` | `data-rooms.tsx` | List data rooms | `GET /data-rooms` |
| `/data-room` | `data-room.tsx` | Data room management | `GET /data-rooms/:id`, `POST /data-rooms/:id/documents` |
| `/data-room/:id` | `data-room-viewer.tsx` | View data room documents | `GET /data-rooms/:id` |

---

### Transactions

| Route | Component | Description | Backend Endpoints |
|-------|-----------|-------------|-------------------|
| `/offers` | `offers.tsx` | List/manage offers | `GET /offers`, `POST /offers/:id/accept`, etc. |
| `/settlements` | `settlements.tsx` | List transactions | `GET /transactions` |
| `/settlements/:id` | `settlement-detail.tsx` | Transaction details | `GET /transactions/:id`, `POST /transactions/:id/close` |
| `/payees` | `payees.tsx` | Payees management | Payee management (Phase 2 feature) |
| `/phase2` | `phase2.tsx` | Phase 2 landing page | Phase 2 navigation hub |
| `/phase2/division-orders` | `phase2/division-orders.tsx` | Division orders management | Division orders workflow |
| `/phase2/leases` | `phase2/leases.tsx` | Leases management | Leases workflow |
| `/phase2/obligations` | `phase2/obligations.tsx` | Obligations management | Obligations workflow |
| `/phase2/jib-decks` | `phase2/jib-decks.tsx` | JIB decks management | JIB decks workflow |
| `/phase2/title-curative` | `phase2/title-curative.tsx` | Title curative workflow | Title curative process |
| `/phase2/contract-areas` | `phase2/contract-areas.tsx` | Contract areas management | Contract areas workflow |
| `/phase2/suspense` | `phase2/suspense.tsx` | Suspense management | Suspense account workflow |

---

### Profile & Settings

| Route | Component | Description | Backend Endpoints |
|-------|-----------|-------------|-------------------|
| `/profile` | `profile.tsx` | User profile | `GET /users/me`, `PATCH /users/:id` |
| `/company` | `company-profile.tsx` | Company profile | `GET /organizations/:id`, `PATCH /organizations/:id` |
| `/settings` | `settings.tsx` | User settings | `PATCH /users/:id` |
| `/privacy` | `privacy-center.tsx` | Privacy settings | User preferences |
| `/wallet` | `wallet.tsx` | Wallet management | Wallet service integration |

---

### Organization Management (Category A & B)

| Route | Component | Description | Backend Endpoints |
|-------|-----------|-------------|-------------------|
| `/organization` | `organization.tsx` | Organization settings | `GET /organizations/:id`, `PATCH /organizations/:id` |
| `/team` | `team.tsx` | Team management | `GET /organizations/:id/members`, `POST /organizations/:id/members` |
| `/roles` | `roles.tsx` | Role management | `GET /organizations/:id/roles`, `POST /organizations/:id/roles` |
| `/audit-log` | `audit-log.tsx` | Audit log | Audit log service |
| `/clients` | `clients.tsx` | Client management (Category B) | Client service |
| `/clients/:id` | `client-detail.tsx` | Client details (Category B) | Client service |
| `/commissions` | `commissions.tsx` | Commissions (Category B) | Commission service |

---

### Support & Learning

| Route | Component | Description | Backend Endpoints |
|-------|-----------|-------------|-------------------|
| `/learning` | `learning-center.tsx` | Learning resources | Static content |
| `/support` | `support.tsx` | Support center | Support service |
| `/notifications` | `notifications.tsx` | Notifications | Notification service |
| `/messages` | `messages.tsx` | Messages | Messaging service (deferred for MVP) |

---

### Analytics (Category A & B)

| Route | Component | Description | Backend Endpoints |
|-------|-----------|-------------|-------------------|
| `/portfolio` | `portfolio.tsx` | Portfolio analytics | `GET /users/me/sales`, `GET /users/me/royalty-chart`, `GET /revenue/stats/:orgContractAddress` |

---

### Admin Panel (Admin Users Only)

| Route | Component | Description | Backend Endpoints |
|-------|-----------|-------------|-------------------|
| `/admin/login` | `admin-login.tsx` | Admin login page | `POST /auth/login` (admin-service) |
| `/admin` | `admin.tsx` | Admin dashboard (main panel) | Multiple admin-service endpoints |
| `/admin/users` | `admin.tsx` (Users tab) | User management | `GET /users`, `PATCH /users/:id`, `PATCH /users/:id/suspend`, `PATCH /users/:id/reactivate` |
| `/admin/verification` | `admin.tsx` (Verification tab) | Asset verification queue | `GET /releases/pending-verifications`, `POST /releases/:id/approve-verification`, `POST /releases/:id/reject-verification` |
| `/admin/organizations` | `admin.tsx` (Organizations tab) | Organization management | `GET /organizations`, `GET /organizations/requests`, `POST /organizations/requests/:id/approve`, `POST /organizations/requests/:id/reject` |
| `/admin/content` | `admin.tsx` (Content tab) | Content moderation | `GET /releases/flagged`, `GET /releases/featured`, `POST /releases/:id/flag`, `POST /releases/:id/feature` |
| `/admin/analytics` | `admin.tsx` (Analytics tab) | Platform analytics | `GET /analytics/metrics`, `GET /analytics/revenue`, `GET /analytics/funnel`, `GET /analytics/users-by-category` |

**Authentication:**
- Admin panel uses separate authentication from user authentication
- Admin token stored in `localStorage` as `admin_access_token`
- All admin routes (except `/admin/login`) are protected by `AdminAuthGuard`
- Admin authentication flow: Email/Password → JWT token from `admin-service`

**API Client:**
- Uses separate API client: `frontend/src/lib/api-admin.ts`
- Default base URL: `http://localhost:4243` (configurable via `VITE_ADMIN_API_URL`)
- All requests include `Authorization: Bearer <admin_access_token>`

**Components:**
- `AdminAuthGuard.tsx` - Route guard for admin routes
- `use-admin-auth.ts` - React hook for admin authentication state
- `admin-auth.service.ts` - Service for admin authentication operations
- `admin.service.ts` - Service for all admin operations (users, orgs, releases, analytics)

---

## User Flow Logic

### 1. Registration & Onboarding Flow

```
1. User visits `/register`
   → Selects user category (A, B, or C)
   → Redirects to `/register/a`, `/register/b`, or `/register/c`

2. Category-specific registration
   → Category A: Organization creation + user account
   → Category B: Organization creation + user account  
   → Category C: Individual user account only
   → Email verification required

3. Email verification (`/register/verify-email`)
   → User receives email with verification link
   → Click link → verify email → proceed to onboarding

4. Onboarding flow (`/onboarding/a|b|c`)
   → Category A: Company details, team setup, preferences
   → Category B: Broker details, client management setup
   → Category C: Personal details, property information
   → Redirects to identity verification

5. Identity verification (`/verify-identity`)
   → Persona integration (required before listing/closing)
   → User completes Persona verification
   → Status stored in user profile (`personaVerified: boolean`)
   → Redirects to marketplace or dashboard
```

**Backend Flow**:
- `POST /auth/login/web3auth` - Initial authentication
- User creation in database
- Organization creation (if Category A or B)
- Email verification token generation
- Persona session creation via Persona API
- Webhook receives Persona verification status → updates user

---

### 2. Asset Listing Creation Flow

```
1. User navigates to `/create-listing`
   → Checks if user is authenticated (JWT token)
   → Checks if user is Persona verified (gate)
   → If not verified → redirect to `/verify-identity?redirect=/create-listing`

2. User fills out asset listing form
   → Asset details (name, type, category, location, price, etc.)
   → Optional: Enverus validation (deferred for MVP)
   → File uploads (thumbnails, documents)

3. Form submission
   → Frontend: `createAsset(data)` → `POST /releases`
   → Backend creates asset/release record
   → Backend auto-creates data room: `POST /data-rooms` (linked to asset)
   → Returns asset ID

4. Redirect to asset detail page
   → `/asset/:id` → User can view listing
   → Option to edit: `/asset/:id/edit`
   → Option to upload more documents to data room
```

**Backend Flow**:
- `POST /releases` - Create asset
- `POST /data-rooms` - Auto-create data room
- `POST /releases/:id/files` - Upload asset files
- Asset status: `draft` → `pending_review` → `active`

**Validation Gates**:
- User must be authenticated
- User must be Persona verified
- Required fields validated
- File size limits enforced (750MB max)

---

### 3. Marketplace Browsing Flow

```
1. User visits `/marketplace` or `/`
   → Frontend: `listAssets(options)` → `GET /releases`
   → Displays paginated asset cards
   → Filters: type, status, category, basin, state

2. User clicks on asset card
   → Navigates to `/asset/:id`
   → Frontend: `getAsset(id)` → `GET /releases/:id`
   → Displays full asset details
   → Shows data room link if available

3. User views data room
   → Clicks "View Data Room" → `/data-room/:id`
   → Frontend: `getDataRoom(id)` → `GET /data-rooms/:id`
   → Displays documents, folders, access controls
```

**Backend Flow**:
- `GET /releases` - List assets with filters
- `GET /releases/:id` - Get asset details
- Note: Data room endpoints may not be fully implemented; check backend implementation status

---

### 4. Offer & Transaction Flow

```
1. Buyer views asset (`/asset/:id`)
   → Checks if buyer is Persona verified (gate)
   → If not verified → redirect to `/verify-identity?redirect=/asset/:id`

2. Buyer creates offer
   → Clicks "Make Offer" button
   → Frontend: `POST /offers` with offer details
   → Backend validates: buyer ≠ seller, asset is active
   → Notification sent to seller

3. Seller views offers (`/offers`)
   → Frontend: `GET /offers?sellerId=current`
   → Lists all offers on seller's assets
   → Shows offer status: pending, accepted, declined, withdrawn

4. Seller accepts offer
   → Clicks "Accept Offer" → `POST /offers/:id/accept`
   → Backend creates transaction: `POST /transactions` (from offer)
   → Transaction status: `PENDING`
   → **Blockchain**: core-api creates `CREATE_ESCROW` job → `POST /jobs` (blockchain-service)
   → **Blockchain**: Escrow contract deployed, escrow address stored in transaction
   → Notification sent to buyer

5. Transaction workflow (`/settlements/:id`)
   → Step 1: Earnest deposit
     → Buyer: `POST /transactions/:id/deposit-earnest`
     → **Blockchain**: core-api creates `DEPOSIT_EARNEST` job
     → **Blockchain**: Buyer approves USDC, calls `escrow.depositEarnest()`
     → **Blockchain**: Event `EarnestDeposited` emitted
     → **Reconciliation**: RabbitMQ event → core-api updates transaction status
     → Status: `EARNEST_DEPOSITED`
   
   → Step 2: Due diligence
     → Buyer: `POST /transactions/:id/complete-due-diligence`
     → **Blockchain**: core-api creates `COMPLETE_DUE_DILIGENCE` job
     → **Blockchain**: Calls `escrow.completeDueDiligence()`
     → **Blockchain**: Event `DueDiligenceComplete` emitted
     → **Reconciliation**: RabbitMQ event → core-api updates transaction
     → Status: `DUE_DILIGENCE` → `FUNDING`
   
   → Step 3: Funding
     → Buyer: `POST /transactions/:id/fund`
     → **Blockchain**: core-api creates `FUND_TRANSACTION` job
     → **Blockchain**: Buyer approves USDC, calls `escrow.fundTransaction()`
     → **Blockchain**: Event `FundingReceived` emitted
     → **Blockchain**: If fully funded, auto-closes escrow
     → **Reconciliation**: RabbitMQ event → core-api updates transaction
     → Status: `FUNDING`
   
   → Step 4: Close transaction
     → Seller: `POST /transactions/:id/close`
     → **Blockchain**: core-api creates `CLOSE_ESCROW` job
     → **Blockchain**: Calls `escrow.closeEscrow()`
     → **Blockchain**: Escrow calls `EmpressaRevenueDistributor.distributeRevenue()`
     → **Blockchain**: Funds distributed: Seller/Organization (94%), Empressa (5%), Integrator (1%)
     → **Blockchain**: Event `EscrowClosed` emitted
     → **Reconciliation**: RabbitMQ event → core-api updates transaction
     → **Blockchain**: core-api creates `INITIATE_ASSET_TRANSFER` job
     → **Blockchain**: Asset transfer initiated on-chain
     → Status: `CLOSED`
     → Triggers: Assignment doc generation, e-notary, e-recording
```

**Backend Flow**:
- `POST /offers` - Create offer
- `POST /offers/:id/accept` - Accept offer → creates transaction
- **Blockchain**: `POST /jobs` (blockchain-service) - Create escrow job
- `POST /transactions/:id/deposit-earnest` - Earnest deposit
  - **Blockchain**: `POST /jobs` - Deposit earnest job
  - **Smart Contract**: `escrow.depositEarnest()`
  - **Event**: `EarnestDeposited` → RabbitMQ → Reconciliation
- `POST /transactions/:id/complete-due-diligence` - Due diligence
  - **Blockchain**: `POST /jobs` - Complete DD job
  - **Smart Contract**: `escrow.completeDueDiligence()`
  - **Event**: `DueDiligenceComplete` → RabbitMQ → Reconciliation
- `POST /transactions/:id/fund` - Funding
  - **Blockchain**: `POST /jobs` - Fund transaction job
  - **Smart Contract**: `escrow.fundTransaction()`
  - **Event**: `FundingReceived` → RabbitMQ → Reconciliation
- `POST /transactions/:id/close` - Close transaction
  - **Blockchain**: `POST /jobs` - Close escrow job
  - **Smart Contract**: `escrow.closeEscrow()` → `revenueDistributor.distributeRevenue()`
  - **Event**: `EscrowClosed` → RabbitMQ → Reconciliation
  - **Blockchain**: `POST /jobs` - Initiate asset transfer job
  - **Smart Contract**: `assetTransfer.initiateTransfer()` → `executeTransfer()`
  - **Event**: `AssetTransferred` → RabbitMQ → Reconciliation
- `POST /transactions/:id/generate-assignment` - Generate assignment doc
- `POST /notary/simplify/session` - E-notary session
- `POST /recording/simplify/submit` - E-recording submission
- Webhooks: Simplify notary completion, recording completion

**Transaction Status Flow**:
```
PENDING → EARNEST_DEPOSITED → DUE_DILIGENCE → FUNDING → CLOSED
                                    ↓
                              CANCELLED / FAILED
```

**Blockchain Integration Points**:
- **Transaction Creation**: Creates escrow contract on-chain
- **Earnest Deposit**: On-chain USDC deposit to escrow
- **Due Diligence**: On-chain status update
- **Funding**: On-chain USDC transfer to escrow
- **Settlement**: On-chain fund distribution via revenue distributor
- **Asset Transfer**: On-chain asset ownership transfer
- **Event Reconciliation**: RabbitMQ events update database status

---

### 5. Data Room Management Flow

```
1. Data room auto-created on asset listing
   → Linked to asset via `assetId`
   → Initial status: `incomplete`

2. Seller uploads documents (`/data-room/:id`)
   → Frontend: `uploadDocument(dataRoomId, file)` → `POST /data-rooms/:id/documents`
   → Documents stored (IPFS or S3)
   → Data room status: `incomplete` → `complete`

3. Buyer accesses data room
   → From asset detail page: "View Data Room"
   → `/data-room/:id` or `/data-room-viewer/:id`
   → Frontend: `getDataRoom(id)` → `GET /data-rooms/:id`
   → Displays documents, folders, metadata
   → Access controls enforced (public/restricted)
```

**Backend Flow**:
- `POST /data-rooms` - Create data room (auto on asset creation)
- `POST /data-rooms/:id/documents` - Upload document
- `GET /data-rooms/:id` - Get data room with documents
- `DELETE /data-rooms/:id/documents/:docId` - Delete document

---

### 6. E-Notary & E-Recording Flow

```
1. Transaction closes (`POST /transactions/:id/close`)
   → Backend generates assignment document
   → Backend initiates e-notary session: `POST /notary/simplify/session`
   → Returns notary session URL

2. Parties complete e-notary
   → Buyer and seller join Simplify notary session
   → Documents signed electronically
   → Simplify webhook: `POST /webhooks/simplify/notary`
   → Backend updates transaction: notary completed

3. E-recording submission
   → Backend submits to courthouse: `POST /recording/simplify/submit`
   → Returns recording submission ID
   → Status: `SUBMITTED` → `PENDING` → `RECORDED`

4. Recording completion webhook
   → Simplify webhook: `POST /webhooks/simplify/recording`
   → Backend updates: `recordingStatus: 'RECORDED'`
   → Backend stores: `recordingFileNumber`, `recordingBookPage`
   → Transaction fully complete
```

**Backend Flow**:
- `POST /transactions/:id/generate-assignment` - Generate assignment doc
- `POST /notary/simplify/session` - Create notary session
- `POST /webhooks/simplify/notary` - Notary completion webhook
- `POST /recording/simplify/submit` - Submit for recording
- `GET /transactions/:id/recording-status` - Check recording status
- `POST /webhooks/simplify/recording` - Recording completion webhook

**Recording Status Flow**:
```
NOT_STARTED → NOTARY_IN_PROGRESS → NOTARY_COMPLETED → SUBMITTED → PENDING → RECORDED
```

---

### 7. Revenue Distribution Flow

```
1. Transaction closes
   → Backend calculates revenue split: `POST /revenue/calculate-split`
   → Splits: Seller/Organization, Empressa fee, Integrator fee
   → Fee structure from: `GET /revenue/fee-structure/:orgContractAddress`

2. On-chain distribution (automatic via escrow)
   → When `escrow.closeEscrow()` is called:
   → Escrow contract automatically calls `EmpressaRevenueDistributor.distributeRevenue()`
   → Revenue distributor calculates fees based on asset category:
     - Category A & B: 5% Empressa, 1% Integrator, 94% to seller/organization
     - Category C: 0% fees, 100% to seller/asset owner
   → Funds distributed to:
     - Seller/organization wallet
     - Empressa treasury wallet
     - Integrator wallet (if applicable)
   → Event `EscrowClosed` emitted with distribution details
   → RabbitMQ event → core-api reconciliation updates database

3. Revenue tracking
   → Organization views earnings: `GET /revenue/earnings/:organizationId`
   → Statistics: `GET /revenue/stats/:orgContractAddress`
   → Blockchain queries: `GET /rpc/revenue-distributor/stats/:orgContractAddress`
   → Portfolio analytics: `GET /users/me/sales`, `GET /users/me/royalty-chart`
```

**Backend Flow**:
- `POST /revenue/calculate-split` - Calculate split (off-chain calculation)
- `GET /revenue/fee-structure/:orgContractAddress` - Get fees
- `GET /revenue/stats/:orgContractAddress` - Get statistics
- `GET /revenue/earnings/:organizationId` - Get earnings
- **Blockchain**: `escrow.closeEscrow()` → `revenueDistributor.distributeRevenue()` (automatic)
- **Blockchain**: `GET /rpc/revenue-distributor/stats/:orgContractAddress` - Query on-chain stats
- **Blockchain**: `GET /rpc/revenue-distributor/earnings/:orgContractAddress` - Query on-chain earnings
- **Event**: `EscrowClosed` → RabbitMQ → Reconciliation updates database

---

## Service Layer Architecture

### Frontend Service Layer

All API calls go through service layer in `frontend/src/lib/services/`:

- **`assets.service.ts`**: Asset/releases and portfolio operations
- **`transactions.service.ts`**: Transaction management
- **`data-rooms.service.ts`**: Data room operations
- **`revenue.service.ts`**: Revenue calculations
- **`analytics.service.ts`**: Analytics data
- **`offers.service.ts`**: Offer management (create, accept, decline, counter)
- **`division-orders.service.ts`**: Division orders management
- **`verification.service.ts`**: Identity verification (Persona)

**API Client**: `frontend/src/lib/api.ts`
- Base URL: `process.env.VITE_API_URL || 'http://localhost:3000/api/v1'`
- JWT token from localStorage: `access_token`
- Automatic token refresh on 401
- Error handling and retries

**Mock Mode**: `VITE_USE_MOCK_API=true` (development)
- Falls back to mock data when backend unavailable
- Mock services in `frontend/src/lib/mock-api/`

---

### Backend Service Layer

**Core API** (`backend/apps/core-api/`):
- Main REST API service
- Port: 3000
- Base path: `/api/v1`
- Swagger docs: `/api/v1/docs`

**Other Services**:
- **admin-service**: Port 4243 (admin operations, default, configurable via `ADMIN_SERVICE_PORT`)
- **kms-service**: Port 3001 (key management)
- **blockchain-service**: Port 3003 (on-chain operations)
- **ipfs-service**: Port 3004 (file storage)

---

## Authentication & Authorization

### Authentication Flow

1. **Web3Auth Login**:
   - Frontend: Web3Auth modal → user authenticates
   - Frontend sends token: `POST /auth/login/web3auth`
   - Backend validates Web3Auth token
   - Backend returns JWT: `accessToken`, `refreshToken`
   - Frontend stores tokens in localStorage

2. **JWT Usage**:
   - All API requests include: `Authorization: Bearer {accessToken}`
   - Token expires → use refresh token: `POST /auth/refresh`
   - Invalid token → redirect to `/login`

3. **Session Management**:
   - `POST /auth/session/start` - Initialize session
   - `POST /auth/logout` - End session, invalidate tokens

### Authorization Gates

**Identity Verification Gate**:
- Required for: Creating listings, Making offers, Closing transactions
- Check: `user.personaVerified === true`
- If not verified → redirect to `/verify-identity?redirect={currentPath}`

**Role-Based Access**:
- Category A: Full access (org management, team, roles)
- Category B: Broker features (clients, commissions)
- Category C: Individual owner features (simplified)

---

## Error Handling

### Frontend Error Handling

- API errors caught in service layer
- 401 Unauthorized → Clear tokens, redirect to login
- 403 Forbidden → Show access denied message
- 404 Not Found → Show not found page
- 500 Server Error → Show error message, log to console
- Network errors → Fall back to mock data (if enabled)

### Backend Error Handling

- Validation errors: 400 Bad Request with error details
- Authentication errors: 401 Unauthorized
- Authorization errors: 403 Forbidden
- Not found: 404 Not Found
- Server errors: 500 Internal Server Error
- Idempotency: Duplicate requests handled via `Idempotency-Key` header

---

## Data Flow Diagrams

### Asset Creation Flow

```
User → create-listing.tsx
  → createAsset(data)
  → POST /releases
  → Backend: ReleasesController.create()
  → Database: Asset created
  → Auto-create: POST /data-rooms
  → Database: DataRoom created (linked to asset)
  → (Optional) IPFS: Upload files → ipfs-service
  → (Optional) Blockchain: POST /jobs (blockchain-service) - CREATE_ASSET job
  → (Optional) Blockchain: Asset created on-chain
  → (Optional) Event: transaction.finalized.confirmed → RabbitMQ
  → (Optional) Reconciliation: Update asset with on-chain ID
  → Response: Asset + DataRoom IDs
  → Frontend: Redirect to /asset/:id
```

### Transaction Closing Flow

```
Seller → settlement-detail.tsx
  → closeTransaction(id, data)
  → POST /transactions/:id/close
  → Backend: Generate assignment doc
  → Backend: POST /jobs (blockchain-service) - CLOSE_ESCROW job
  → Blockchain: Worker fetches key from kms-service
  → Blockchain: Calls escrow.closeEscrow()
  → Blockchain: Escrow calls revenueDistributor.distributeRevenue()
  → Blockchain: Funds distributed on-chain (USDC)
  → Blockchain: Event EscrowClosed emitted
  → RabbitMQ: transaction.finalized.confirmed event
  → Reconciliation: Update transaction (status: CLOSED, onChainTxHash)
  → Backend: POST /jobs (blockchain-service) - INITIATE_ASSET_TRANSFER job
  → Blockchain: Calls assetTransfer.initiateTransfer()
  → Blockchain: Event TransferInitiated emitted
  → RabbitMQ: transaction.finalized.confirmed event
  → Reconciliation: Update asset ownership
  → Backend: POST /jobs (blockchain-service) - EXECUTE_ASSET_TRANSFER job
  → Blockchain: Calls assetTransfer.executeTransfer()
  → Blockchain: Event AssetTransferred emitted
  → RabbitMQ: transaction.finalized.confirmed event
  → Reconciliation: Final asset ownership update
  → Backend: POST /notary/simplify/session
  → Simplify: Notary session created
  → Parties: Complete notary (external)
  → Webhook: POST /webhooks/simplify/notary
  → Backend: Update transaction (notary completed)
  → Backend: POST /recording/simplify/submit
  → Simplify: Submit to courthouse
  → Webhook: POST /webhooks/simplify/recording
  → Backend: Update transaction (recordingStatus: RECORDED)
  → Frontend: Refresh settlement-detail.tsx
```

---

## Navigation Structure

Navigation is category-specific (see `navigation-config.tsx`):

**Category A (Major Operators)**:
- Dashboard: Portfolio Analytics
- Marketplace: Browse, My Listings, Create Listing
- Transactions: Offers, Settlements
- Data & Documents: Data Rooms
- Communication: Messages, Notifications
- Organization: Settings, Team, Roles, Audit Log
- Account: Profile, Company, Wallet, Settings, Privacy

**Category B (Brokers)**:
- Similar to Category A, plus:
- Deals & Transactions: Commissions
- Clients: Client Management

**Category C (Individual Owners)**:
- My Dashboard: My Properties
- Marketplace: Browse, List My Property
- My Deals: Offers, Settlements
- Data & Documents: Data Rooms
- Account: Profile, Wallet, Settings, Privacy

---

## Integration Points

### External Services

1. **Web3Auth**: Authentication provider
   - Social login integration
   - Returns JWT tokens to frontend
2. **Persona**: Identity verification (replaces CLEAR)
   - KYC/AML verification
   - Webhook integration for status updates
   - Required before listing/closing transactions
3. **Simplify/Simplifile**: E-notary and e-recording
   - E-notary session management
   - E-recording submission to courthouse
   - Webhook integration for status updates
4. **Enverus**: Asset data enrichment (optional, deferred for MVP)
   - Wells data, production data, rigs, permits, completions
   - Asset validation
5. **IPFS/Pinata**: Document storage (if enabled)
   - File pinning service
   - CID generation
   - Alternative: Fula provider
6. **Blockchain**: Smart contracts for escrow/settlement (required for MVP)
   - Ethereum-compatible chain
   - USDC token for payments
   - Smart contracts: EmpressaEscrow, EmpressaRevenueDistributor, EmpressaAssetTransfer
7. **AWS KMS**: Key management (required for blockchain)
   - Envelope encryption for wallet private keys
   - Multiple KMS keys for distributed risk
   - Automatic key rotation
8. **Email Service**: Notification delivery
   - Email notifications for offers, transactions, settlements
   - Configurable via EmailService

### Internal Services

- **core-api**: Main API (required)
  - Creates blockchain jobs via HTTP to blockchain-service
  - Listens to RabbitMQ events for reconciliation
  - Manages transaction lifecycle
  - Sends notifications (email, in-app)
  - Handles webhooks (Persona, Simplify)
- **admin-service**: Admin operations (optional for MVP)
  - Separate API for admin dashboard
  - Asset verification approval/rejection
  - Organization request approval/rejection
  - User and organization management
- **kms-service**: Key management (required for blockchain)
  - Stores private keys securely (AWS KMS envelope encryption)
  - Provides signing capabilities to blockchain-service
  - Wallet creation and management
  - Platform verifier key management
  - **Security**: Network-level protection, never exposed publicly
- **blockchain-service**: On-chain operations (required for MVP)
  - Processes blockchain jobs via BullMQ
  - Signs transactions using kms-service
  - Publishes events to RabbitMQ
  - RPC endpoints for blockchain queries
- **ipfs-service**: File storage (if IPFS enabled)
  - Document pinning via BullMQ jobs
  - IPFS CID generation
  - Provider support: Pinata, Fula
  - Event publishing for reconciliation

---

## MVP Scope Notes

### Included in MVP

✅ Asset listing creation + browsing  
✅ Data room creation + document upload  
✅ Basic transaction flow (offers → close)  
✅ Persona identity verification gate  
✅ E-notary + e-recording integration  
✅ Blockchain escrow/settlement (smart contracts exist)

### Deferred

❌ AI verification in Create Listing  
❌ AI Run Sheets and Deal Analytics  
❌ Advanced portfolio analytics  
❌ Tokenization of assets (blockchain automation is MVP, tokenization is not)
❌ P2P (peer-to-peer) features - P2P identity, peer discovery, etc.

---

## API Base URLs

**Development**:
- Frontend: `http://localhost:5173` (Vite default)
- Backend: `http://localhost:3000/api/v1`
- Swagger: `http://localhost:3000/api/v1/docs`

**Production**:
- Frontend: Deployed (Netlify/Vercel)
- Backend: `https://api.Empressa.io/api/v1`
- Swagger: `https://api.Empressa.io/api/v1/docs`

---

## Environment Variables

### Frontend

- `VITE_API_URL`: Backend API URL (default: `http://localhost:3000/api/v1`)
- `VITE_USE_MOCK_API`: Enable mock API (default: `true` for dev)
- `VITE_WEB3AUTH_CLIENT_ID`: Web3Auth client ID

### Backend

- `CORE_API_PORT`: API port (default: 3000)
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `JWT_SECRET`: JWT signing secret
- `PERSONA_API_KEY`: Persona API key
- `SIMPLIFY_API_KEY`: Simplify API key

---

## Testing & Development

### Mock Mode

Frontend can run in mock mode for development:
- Set `VITE_USE_MOCK_API=true`
- All API calls return mock data
- No backend required for UI development
- Mock data in `frontend/src/lib/mock-api/`

### Dev Token Bypass

For development, use `dev-token-bypass` in localStorage:
- Allows access without real authentication
- Skips all auth checks
- Useful for rapid UI development

---

## Summary

This document maps all backend API endpoints to their corresponding frontend components and documents the complete user flow logic for the O&G Platform MVP. The architecture follows a clean separation between frontend (React) and backend (NestJS), with service layers handling API communication and business logic.

### Key Flows

1. **Registration** → Email verification → Onboarding → Identity verification
2. **Listing Creation** → Asset creation → Data room auto-creation → (Optional) On-chain asset creation
3. **Marketplace** → Browse → View asset → Make offer
4. **Transaction** → Offer acceptance → **Escrow creation (on-chain)** → Earnest deposit (on-chain) → Due diligence (on-chain) → Funding (on-chain) → **Close escrow (on-chain distribution)** → **Asset transfer (on-chain)** → E-notary → E-recording
5. **Data Rooms** → Auto-created → Document upload → Buyer access
6. **Revenue Distribution** → Automatic on-chain via smart contracts → Event reconciliation → Database updates

### Blockchain Integration Highlights

- **Escrow Management**: All transaction funds held in smart contract escrow
- **Automatic Settlement**: Revenue distribution happens automatically on-chain via `EmpressaRevenueDistributor`
- **Event-Driven**: RabbitMQ events ensure database stays in sync with blockchain state
- **Job Queue System**: BullMQ handles async blockchain operations with retries
- **Key Management**: KMS service securely manages signing keys
- **Reconciliation**: Automatic reconciliation of on-chain events with database

### Smart Contracts

- **EmpressaEscrow**: Manages transaction escrow and fund distribution
- **EmpressaRevenueDistributor**: Handles fee calculation and revenue distribution
- **EmpressaAssetTransfer**: Manages asset ownership transfer on-chain

All flows include proper authentication gates, validation, error handling, and blockchain integration as documented above.
