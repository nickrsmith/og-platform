# Codebase Catalog - What Exists vs What's Documented

**Date:** 2024-12-19  
**Purpose:** Comprehensive catalog of what actually exists in the codebase versus what's documented in BACKEND_FRONTEND_MAPPING.md

---

## Executive Summary

### ✅ Fully Implemented & Documented
- Authentication (Web3Auth)
- Users endpoints
- Releases/Assets endpoints
- Offers endpoints
- Transactions endpoints (business controller)
- Revenue endpoints
- Organizations endpoints
- Blockchain service (jobs, RPC)
- Admin service

### ⚠️ Partially Implemented / Missing Endpoints
- **Notifications**: Service exists, but NO controller/endpoints exposed
- **Data Rooms**: Frontend service exists, but NO backend endpoints found in core-api
- **Webhooks**: Documented but NO webhook controllers found
- **Persona/Simplify Integration**: Documented but NO endpoints found
- **Settlement Document Generation**: Service exists, but NO endpoints exposed

### ❌ Documented But Not Found
- Notification API endpoints (`GET /notifications`, `PATCH /notifications/:id/read`)
- Data room endpoints (`GET /data-rooms`, `POST /data-rooms`, etc.)
- Webhook endpoints (`POST /webhooks/persona`, `POST /webhooks/simplify/*`)
- Persona verification endpoints (`POST /verification/persona/session`)
- Simplify notary/recording endpoints (`POST /notary/simplify/*`, `POST /recording/simplify/*`)
- Document generation endpoints (`POST /transactions/:id/generate-assignment`)

---

## Backend API Endpoints - Actual Implementation

### ✅ Core API Controllers (Found in Codebase)

#### 1. AuthController (`/api/v1/auth`)
**Location:** `backend/apps/core-api/src/auth/auth.controller.ts`

**Endpoints Found:**
- ✅ `POST /auth/login/web3auth` - Web3Auth login
- ✅ `POST /auth/logout` - Logout
- ✅ `POST /auth/refresh` - Refresh token
- ✅ `POST /auth/session/start` - Start session

**Status:** ✅ Fully implemented and documented

---

#### 2. UsersController (`/api/v1/users`)
**Location:** `backend/apps/core-api/src/users/users.controller.ts`

**Endpoints Found:**
- ✅ `GET /users/me` - Get current user
- ✅ `GET /users/p2p/:peerId` - Find user by P2P peer ID (public)
- ✅ `GET /users/me/p2p-identity` - Get P2P identity
- ✅ `GET /users/me/wallet/balance` - Get wallet balance
- ✅ `GET /users/me/sales` - Get user sales
- ✅ `GET /users/me/transaction-history` - Get transaction history
- ✅ `GET /users/me/royalty-chart` - Get royalty chart data

**Missing from Documentation:**
- `GET /users/p2p/:peerId` - Public P2P user lookup
- `GET /users/me/p2p-identity` - P2P identity endpoint
- `GET /users/me/wallet/balance` - Wallet balance
- `GET /users/me/sales` - Sales data
- `GET /users/me/transaction-history` - Transaction history
- `GET /users/me/royalty-chart` - Royalty chart

**Status:** ⚠️ Partially documented - Missing several endpoints

---

#### 3. ReleasesController (`/api/v1/releases`)
**Location:** `backend/apps/core-api/src/releases/releases.controller.ts`

**Endpoints Found:**
- ✅ `GET /releases` - List releases
- ✅ `GET /releases/:releaseId` - Get release
- ✅ `GET /releases/check-hash/:hash` - Check asset hash
- ✅ `POST /releases` - Create release
- ✅ `PATCH /releases/:releaseId` - Update release
- ✅ `DELETE /releases/:releaseId` - Delete release
- ✅ `POST /releases/:releaseId/files` - Upload files
- ✅ `POST /releases/:releaseId/licenses` - License asset

**Missing from Documentation:**
- `GET /releases/check-hash/:hash` - Hash validation
- `POST /releases/:releaseId/licenses` - Asset licensing

**Status:** ⚠️ Partially documented - Missing 2 endpoints

---

#### 4. OffersController (`/api/v1/offers`)
**Location:** `backend/apps/core-api/src/offers/offers.controller.ts`

**Endpoints Found:**
- ✅ `POST /offers` - Create offer
- ✅ `GET /offers` - List offers
- ✅ `GET /offers/:id` - Get offer
- ✅ `PATCH /offers/:id` - Update offer
- ✅ `POST /offers/:id/accept` - Accept offer
- ✅ `POST /offers/:id/decline` - Decline offer
- ✅ `POST /offers/:id/withdraw` - Withdraw offer
- ✅ `POST /offers/:id/counter` - Counter offer

**Status:** ✅ Fully implemented and documented

---

#### 5. TransactionsBusinessController (`/api/v1/transactions`)
**Location:** `backend/apps/core-api/src/transactions/transactions-business.controller.ts`

**Endpoints Found:**
- ✅ `POST /transactions` - Create transaction
- ✅ `GET /transactions` - List transactions
- ✅ `GET /transactions/:id` - Get transaction
- ✅ `PATCH /transactions/:id/status` - Update status
- ✅ `POST /transactions/:id/deposit-earnest` - Deposit earnest
- ✅ `POST /transactions/:id/complete-due-diligence` - Complete DD
- ✅ `POST /transactions/:id/fund` - Fund transaction
- ✅ `POST /transactions/:id/close` - Close transaction
- ✅ `GET /transactions/:id/settlement-statement` - Get settlement statement

**Status:** ✅ Fully implemented and documented

---

#### 6. TransactionsController (`/api/v1/transactions`)
**Location:** `backend/apps/core-api/src/transactions/transactions.controller.ts`

**Endpoints Found:**
- ✅ `GET /transactions/:id` - Get transaction status (duplicate)
- ✅ `GET /transactions/jobs/:jobId` - Get job status

**Missing from Documentation:**
- `GET /transactions/jobs/:jobId` - Job status endpoint

**Status:** ⚠️ Partially documented - Job status endpoint missing

---

#### 7. RevenueController (`/api/v1/revenue`)
**Location:** `backend/apps/core-api/src/revenue/revenue.controller.ts`

**Endpoints Found:**
- ✅ `POST /revenue/calculate-split` - Calculate split
- ✅ `GET /revenue/fee-structure/:orgContractAddress` - Get fee structure
- ✅ `GET /revenue/stats/:orgContractAddress` - Get stats
- ✅ `GET /revenue/earnings/:organizationId` - Get earnings

**Status:** ✅ Fully implemented and documented

---

#### 8. OrganizationsController (`/api/v1/organizations`)
**Location:** `backend/apps/core-api/src/organizations/organizations.controller.ts`

**Endpoints Found:**
- ✅ `GET /organizations/requests/me` - Get my request status
- ✅ `POST /organizations/requests` - Submit org request
- ✅ `GET /organizations/me` - Get my organization
- ✅ `PATCH /organizations/me` - Update organization
- ✅ `POST /organizations/me/logo` - Upload logo
- ✅ `GET /organizations/me/members` - List members
- ✅ `POST /organizations/me/members/invite` - Invite member
- ✅ `PATCH /organizations/me/members/:userId` - Update member role
- ✅ `DELETE /organizations/me/members/:userId` - Remove member
- ✅ `POST /organizations/me/members/invitations/:invitationId/accept` - Accept invitation
- ✅ `GET /organizations/me/subscriptions` - List subscriptions
- ✅ `POST /organizations/me/subscriptions` - Create subscription
- ✅ `DELETE /organizations/me/subscriptions/:subscriptionId` - Delete subscription

**Missing from Documentation:**
- `GET /organizations/requests/me` - Request status
- `POST /organizations/requests` - Submit request
- `POST /organizations/me/logo` - Logo upload
- `POST /organizations/me/members/invitations/:invitationId/accept` - Accept invitation
- `GET /organizations/me/subscriptions` - Subscriptions
- `POST /organizations/me/subscriptions` - Create subscription
- `DELETE /organizations/me/subscriptions/:subscriptionId` - Delete subscription

**Status:** ⚠️ Partially documented - Missing many endpoints

---

#### 9. ValidationController (`/api/v1/validation`)
**Location:** `backend/apps/core-api/src/validation/validation.controller.ts`

**Endpoints Found:**
- ✅ `POST /validation/asset` - Validate asset

**Status:** ✅ Fully implemented and documented

---

#### 10. EnverusController (`/api/v1/enverus`)
**Location:** `backend/apps/core-api/src/enverus/enverus.controller.ts`

**Endpoints Found:**
- ✅ `GET /enverus/wells` - Get wells
- ✅ `GET /enverus/production` - Get production
- ✅ `GET /enverus/rigs` - Get rigs
- ✅ `GET /enverus/permits` - Get permits
- ✅ `GET /enverus/completions` - Get completions
- ✅ `GET /enverus/transactions` - Get transactions
- ✅ `POST /enverus/validate` - Validate asset

**Status:** ✅ Fully implemented and documented

---

#### 11. AiController (`/api/v1/ai`)
**Location:** `backend/apps/core-api/src/ai/ai.controller.ts`

**Endpoints Found:**
- ✅ `POST /ai/analyze-document` - Analyze document
- ✅ `POST /ai/generate-valuation` - Generate valuation
- ✅ `POST /ai/assess-risk` - Assess risk
- ✅ `POST /ai/generate-listing` - Generate listing

**Status:** ✅ Fully implemented and documented (but deferred for MVP)

---

#### 12. CoreApiController (`/`)
**Location:** `backend/apps/core-api/src/core-api.controller.ts`

**Endpoints Found:**
- ✅ `GET /health` - Health check

**Status:** ✅ Documented

---

### ❌ Missing Controllers (Documented But Not Found)

#### 1. NotificationsController
**Documented:** `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`

**Reality:**
- ✅ `NotificationsService` exists (`backend/apps/core-api/src/notifications/notifications.service.ts`)
- ❌ NO controller found
- ❌ NO endpoints exposed

**Impact:** Frontend `notifications.tsx` page cannot fetch notifications via API

---

#### 2. DataRoomsController
**Documented:** `GET /data-rooms`, `POST /data-rooms`, `GET /data-rooms/:id`, etc.

**Reality:**
- ✅ Frontend service exists (`frontend/src/lib/services/data-rooms.service.ts`)
- ❌ NO controller found in core-api
- ❌ NO endpoints found
- ⚠️ May be in separate service (og-data-room-backend) - not in this repo

**Impact:** Frontend data room pages cannot function without backend

---

#### 3. WebhooksController
**Documented:** 
- `POST /webhooks/persona` - Persona webhook
- `POST /webhooks/simplify/notary` - Simplify notary webhook
- `POST /webhooks/simplify/recording` - Simplify recording webhook

**Reality:**
- ❌ NO webhook controller found
- ❌ NO webhook endpoints found

**Impact:** Persona and Simplify integrations cannot receive webhooks

---

#### 4. Persona/Simplify Integration Controllers
**Documented:**
- `POST /verification/persona/session` - Create Persona session
- `GET /verification/persona/status` - Get verification status
- `POST /notary/simplify/session` - Create notary session
- `POST /recording/simplify/submit` - Submit recording
- `GET /transactions/:id/recording-status` - Get recording status

**Reality:**
- ❌ NO Persona controller found
- ❌ NO Simplify controller found
- ❌ NO endpoints found

**Impact:** Identity verification and e-notary/e-recording flows cannot work

---

#### 5. Document Generation Endpoints
**Documented:**
- `POST /transactions/:id/generate-assignment` - Generate assignment document

**Reality:**
- ✅ `SettlementService` exists with `generateSettlementStatement()` method
- ❌ NO endpoint exposed for document generation
- ❌ NO assignment document generation found

**Impact:** Assignment documents cannot be generated via API

---

## Frontend Pages - Actual Implementation

### ✅ All Pages Found (40 pages)

**Authentication & Onboarding:**
- ✅ `login.tsx`
- ✅ `register.tsx`
- ✅ `register-category-a.tsx`
- ✅ `register-category-b.tsx`
- ✅ `register-category-c.tsx`
- ✅ `verify-email.tsx`
- ✅ `identity-verification.tsx`
- ✅ `onboarding-a.tsx`
- ✅ `onboarding-b.tsx`
- ✅ `onboarding-c.tsx`

**Marketplace & Assets:**
- ✅ `marketplace.tsx`
- ✅ `asset-detail.tsx`
- ✅ `asset-edit.tsx`
- ✅ `my-assets.tsx`
- ✅ `create-listing.tsx`
- ✅ `list-asset.tsx`

**Data Rooms:**
- ✅ `data-rooms.tsx`
- ✅ `data-room.tsx`
- ✅ `data-room-viewer.tsx`

**Transactions:**
- ✅ `offers.tsx`
- ✅ `settlements.tsx`
- ✅ `settlement-detail.tsx`

**Profile & Settings:**
- ✅ `profile.tsx`
- ✅ `company-profile.tsx`
- ✅ `settings.tsx`
- ✅ `privacy-center.tsx`
- ✅ `wallet.tsx`

**Organization Management:**
- ✅ `organization.tsx`
- ✅ `team.tsx`
- ✅ `roles.tsx`
- ✅ `audit-log.tsx`
- ✅ `clients.tsx`
- ✅ `client-detail.tsx`
- ✅ `commissions.tsx`

**Support & Learning:**
- ✅ `learning-center.tsx`
- ✅ `support.tsx`
- ✅ `notifications.tsx`
- ✅ `messages.tsx`

**Analytics:**
- ✅ `portfolio.tsx`

**Admin:**
- ✅ `admin.tsx`

**Utility:**
- ✅ `not-found.tsx`

**Status:** ✅ All frontend pages exist and are documented

---

## Frontend Services - Actual Implementation

### ✅ Services Found

1. **`assets.service.ts`** - ✅ Exists, documented
2. **`transactions.service.ts`** - ✅ Exists, documented
3. **`data-rooms.service.ts`** - ✅ Exists, but NO backend endpoints
4. **`revenue.service.ts`** - ✅ Exists, documented
5. **`analytics.service.ts`** - ✅ Exists, but NO backend endpoints found
6. **`division-orders.service.ts`** - ✅ Exists, but deferred (not in MVP)

**Missing Backend Support:**
- ⚠️ `data-rooms.service.ts` - No backend endpoints
- ⚠️ `analytics.service.ts` - No backend endpoints found

---

## Backend Services - Actual Implementation

### ✅ Services Found

1. **core-api** - ✅ Fully implemented
2. **admin-service** - ✅ Fully implemented
3. **blockchain-service** - ✅ Fully implemented
4. **kms-service** - ✅ Fully implemented
5. **ipfs-service** - ✅ Fully implemented

**Status:** ✅ All services exist and are documented

---

## Critical Gaps - What's Missing

### 🔴 High Priority (Blocks MVP Features)

1. **Notifications API Endpoints**
   - Service exists but no controller
   - Frontend `notifications.tsx` cannot work
   - **Action Required:** Create `NotificationsController`

2. **Data Rooms API Endpoints**
   - Frontend service exists but no backend
   - Frontend pages cannot function
   - **Action Required:** Create `DataRoomsController` OR integrate with separate data-room-backend service

3. **Persona Integration Endpoints**
   - Identity verification flow documented but no endpoints
   - **Action Required:** Create Persona integration controller

4. **Simplify Integration Endpoints**
   - E-notary and e-recording documented but no endpoints
   - **Action Required:** Create Simplify integration controller

5. **Webhook Endpoints**
   - Persona and Simplify webhooks documented but no handlers
   - **Action Required:** Create webhook controller

### 🟡 Medium Priority (Missing Features)

6. **Document Generation Endpoint**
   - Settlement service exists but no endpoint
   - **Action Required:** Add endpoint to `TransactionsBusinessController`

7. **Analytics Endpoints**
   - Frontend service exists but no backend endpoints
   - **Action Required:** Create analytics endpoints OR remove frontend service

8. **Additional User Endpoints**
   - Several user endpoints not documented
   - **Action Required:** Document missing endpoints

9. **Additional Organization Endpoints**
   - Many organization endpoints not documented
   - **Action Required:** Document missing endpoints

10. **Transaction Job Status Endpoint**
    - `GET /transactions/jobs/:jobId` exists but not documented
    - **Action Required:** Document endpoint

---

## Recommendations

### Immediate Actions (MVP Blockers)

1. **Create NotificationsController**
   ```typescript
   @Controller('notifications')
   export class NotificationsController {
     @Get()
     getUserNotifications(@Request() req: RequestWithUser) { }
     
     @Patch(':id/read')
     markAsRead(@Param('id') id: string) { }
     
     @Patch('read-all')
     markAllAsRead(@Request() req: RequestWithUser) { }
   }
   ```

2. **Create DataRoomsController OR Document Separate Service**
   - If data rooms are in separate service, document the service URL
   - If in core-api, create the controller

3. **Create Persona Integration**
   - Controller for session creation
   - Webhook handler for status updates

4. **Create Simplify Integration**
   - Controller for notary/recording
   - Webhook handlers for status updates

5. **Create WebhookController**
   - Handle Persona webhooks
   - Handle Simplify webhooks

### Documentation Updates

1. **Update BACKEND_FRONTEND_MAPPING.md** with:
   - All missing user endpoints
   - All missing organization endpoints
   - Transaction job status endpoint
   - Note which features are missing implementations

2. **Add "Implementation Status" column** to endpoint tables showing:
   - ✅ Implemented
   - ⚠️ Partially implemented
   - ❌ Not implemented

3. **Create separate section** for "Documented but Not Implemented" features

---

## Summary Statistics

- **Total Controllers Found:** 12
- **Total Controllers Documented:** 12
- **Missing Controllers:** 5 (Notifications, DataRooms, Webhooks, Persona, Simplify)
- **Total Frontend Pages:** 40 (all exist)
- **Total Frontend Services:** 6 (2 missing backend support)
- **Critical Gaps:** 5 (block MVP features)
- **Medium Priority Gaps:** 5 (missing features)

---

**Last Updated:** 2024-12-19
