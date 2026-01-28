# Empressa O&G Platform API Documentation

**Version:** 1.0.0  
**Base URL:** `http://localhost:3000/api/v1`  
**Swagger UI:** `http://localhost:3000/api/v1/docs`

---

## Table of Contents

1. [Authentication](#authentication)
2. [Transaction Management APIs](#transaction-management-apis)
3. [Revenue Distribution APIs](#revenue-distribution-apis)
4. [Offer Management APIs](#offer-management-apis)
5. [Notification APIs](#notification-apis)
6. [Asset Validation APIs](#asset-validation-apis)
7. [Enverus Integration APIs](#enverus-integration-apis)
8. [AI Model APIs](#ai-model-apis)
9. [Organization APIs](#organization-apis)
10. [Error Handling](#error-handling)

---

## Authentication

All API endpoints require JWT authentication except health check endpoints.

### Getting a JWT Token

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
```

### Using the Token

Include the token in the Authorization header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Transaction Management APIs

### Create Transaction from Accepted Offer

Creates a new transaction from an accepted offer.

```http
POST /api/v1/transactions
Authorization: Bearer {token}
Content-Type: application/json
Idempotency-Key: {unique-key}

{
  "offerId": "offer-uuid",
  "notes": "Optional notes"
}
```

**Response:** `201 Created`
```json
{
  "id": "transaction-uuid",
  "offerId": "offer-uuid",
  "assetId": "asset-123",
  "buyerId": "buyer-uuid",
  "sellerId": "seller-uuid",
  "purchasePrice": 100000,
  "earnestAmount": 10000,
  "status": "PENDING",
  "platformFee": 5000,
  "integratorFee": 1000,
  "creatorAmount": 94000,
  "netProceeds": 94000,
  "createdAt": "2025-01-30T00:00:00Z"
}
```

**Errors:**
- `400` - Offer not accepted or transaction already exists
- `403` - Not authorized (not buyer or seller)
- `404` - Offer not found

---

### Get Transaction Details

Retrieves transaction details by ID.

```http
GET /api/v1/transactions/{id}
Authorization: Bearer {token}
```

**Response:** `200 OK`
```json
{
  "id": "transaction-uuid",
  "offerId": "offer-uuid",
  "assetId": "asset-123",
  "buyerId": "buyer-uuid",
  "sellerId": "seller-uuid",
  "purchasePrice": 100000,
  "earnestAmount": 10000,
  "status": "EARNEST_DEPOSITED",
  "earnestDepositedAt": "2025-01-31T00:00:00Z",
  "platformFee": 5000,
  "integratorFee": 1000,
  "creatorAmount": 94000,
  "netProceeds": 93000,
  "createdAt": "2025-01-30T00:00:00Z",
  "updatedAt": "2025-01-31T00:00:00Z"
}
```

**Errors:**
- `403` - Not authorized (not buyer or seller)
- `404` - Transaction not found

---

### List Transactions

Lists transactions with optional filters.

```http
GET /api/v1/transactions?page=1&pageSize=20&status=PENDING
Authorization: Bearer {token}
```

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `pageSize` (optional) - Items per page (default: 20)
- `buyerId` (optional) - Filter by buyer ID
- `sellerId` (optional) - Filter by seller ID
- `assetId` (optional) - Filter by asset ID
- `status` (optional) - Filter by status (PENDING, EARNEST_DEPOSITED, DUE_DILIGENCE, FUNDING, CLOSED, CANCELLED, FAILED)

**Response:** `200 OK`
```json
{
  "transactions": [
    {
      "id": "transaction-uuid",
      "status": "PENDING",
      "purchasePrice": 100000,
      // ... other fields
    }
  ],
  "total": 10,
  "page": 1,
  "pageSize": 20
}
```

---

### Deposit Earnest Money

Records earnest money deposit for a transaction.

```http
POST /api/v1/transactions/{id}/deposit-earnest
Authorization: Bearer {token}
Content-Type: application/json
Idempotency-Key: {unique-key}

{
  "amount": 10000,
  "depositedAt": "2025-01-31T00:00:00Z",
  "notes": "Earnest money deposited"
}
```

**Response:** `200 OK`
```json
{
  "id": "transaction-uuid",
  "status": "EARNEST_DEPOSITED",
  "earnestAmount": 10000,
  "earnestDepositedAt": "2025-01-31T00:00:00Z",
  // ... other fields
}
```

**Errors:**
- `400` - Invalid transaction status
- `403` - Only buyer can deposit earnest money

---

### Complete Due Diligence

Marks due diligence as complete.

```http
POST /api/v1/transactions/{id}/complete-due-diligence
Authorization: Bearer {token}
Content-Type: application/json
Idempotency-Key: {unique-key}

{
  "completedAt": "2025-02-15T00:00:00Z",
  "notes": "Due diligence complete"
}
```

**Response:** `200 OK`
```json
{
  "id": "transaction-uuid",
  "status": "DUE_DILIGENCE",
  "ddCompletedAt": "2025-02-15T00:00:00Z",
  // ... other fields
}
```

---

### Fund Transaction

Records funding/payment for a transaction.

```http
POST /api/v1/transactions/{id}/fund
Authorization: Bearer {token}
Content-Type: application/json
Idempotency-Key: {unique-key}

{
  "amount": 90000,
  "fundedAt": "2025-02-20T00:00:00Z",
  "onChainTxHash": "0x...",
  "notes": "Payment funded"
}
```

**Response:** `200 OK`
```json
{
  "id": "transaction-uuid",
  "status": "FUNDING",
  "onChainTxHash": "0x...",
  // ... other fields
}
```

---

### Close Transaction

Closes a transaction and generates settlement statement.

```http
POST /api/v1/transactions/{id}/close
Authorization: Bearer {token}
Content-Type: application/json
Idempotency-Key: {unique-key}

{
  "closedAt": "2025-02-25T00:00:00Z",
  "onChainTxHash": "0x...",
  "notes": "Transaction closed"
}
```

**Response:** `200 OK`
```json
{
  "id": "transaction-uuid",
  "status": "CLOSED",
  "closedAt": "2025-02-25T00:00:00Z",
  "settlementStatement": {
    "transactionId": "transaction-uuid",
    "netProceeds": 92900,
    "breakdown": {
      "purchasePrice": 100000,
      "minusFees": 6000,
      "equalsGrossProceeds": 94000,
      "minusProrations": 700,
      "minusAdjustments": 300,
      "equalsNetProceeds": 92900
    }
  },
  // ... other fields
}
```

---

### Get Settlement Statement

Retrieves or generates settlement statement for a transaction.

```http
GET /api/v1/transactions/{id}/settlement-statement
Authorization: Bearer {token}
```

**Response:** `200 OK`
```json
{
  "transactionId": "transaction-uuid",
  "buyerName": "John Buyer",
  "sellerName": "Jane Seller",
  "assetId": "asset-123",
  "closingDate": "2025-02-25T00:00:00Z",
  "purchasePrice": 100000,
  "earnestAmount": 10000,
  "fees": {
    "platformFee": 5000,
    "integratorFee": 1000,
    "totalFees": 6000
  },
  "prorations": {
    "propertyTaxes": 500,
    "royalties": 200
  },
  "adjustments": {
    "titleInsurance": 300
  },
  "totals": {
    "totalProrations": 700,
    "totalAdjustments": 300,
    "grossProceeds": 94000,
    "netProceeds": 92900
  }
}
```

---

## Revenue Distribution APIs

### Calculate Revenue Split

Calculates revenue split for a transaction amount.

```http
POST /api/v1/revenue/calculate-split
Authorization: Bearer {token}
Content-Type: application/json

{
  "amount": 100000,
  "category": "A",
  "orgContractAddress": "0x1234...",
  "assetOwnerAddress": "0xowner...",
  "integrationPartnerAddress": "0xpartner..." // Optional
}
```

**Response:** `200 OK`
```json
{
  "totalAmount": 100000,
  "creatorAmount": 94000,
  "EmpressaFee": 5000,
  "integratorFee": 1000,
  "EmpressaFeePercentage": 500,
  "integratorFeePercentage": 100,
  "isFreeListing": false,
  "category": "A"
}
```

**Category C (Free Listing):**
```json
{
  "totalAmount": 100000,
  "creatorAmount": 100000,
  "EmpressaFee": 0,
  "integratorFee": 0,
  "EmpressaFeePercentage": 0,
  "integratorFeePercentage": 0,
  "isFreeListing": true,
  "category": "C"
}
```

---

### Get Fee Structure

Retrieves fee structure for an organization.

```http
GET /api/v1/revenue/fee-structure/{orgContractAddress}
Authorization: Bearer {token}
```

**Response:** `200 OK`
```json
{
  "orgContractAddress": "0x1234...",
  "EmpressaFeePercentage": 500,
  "integratorFeePercentage": 100,
  "hasCustomFees": false
}
```

---

### Get Revenue Statistics

Retrieves revenue statistics for an organization.

```http
GET /api/v1/revenue/stats/{orgContractAddress}
Authorization: Bearer {token}
```

**Response:** `200 OK`
```json
{
  "orgContractAddress": "0x1234...",
  "totalRevenue": 1000000,
  "creatorRevenue": 940000,
  "EmpressaRevenue": 50000,
  "integratorRevenue": 10000,
  "pendingCreatorEarnings": 10000,
  "pendingEmpressaEarnings": 500,
  "pendingIntegratorEarnings": 100,
  "distributedCreatorEarnings": 930000,
  "distributedEmpressaEarnings": 49500,
  "distributedIntegratorEarnings": 9900
}
```

---

### Get Organization Earnings

Retrieves earnings breakdown for an organization.

```http
GET /api/v1/revenue/earnings/{organizationId}
Authorization: Bearer {token}
```

**Response:** `200 OK`
```json
{
  "organizationId": "org-uuid",
  "orgContractAddress": "0x1234...",
  "pendingTotal": 10600,
  "distributedTotal": 979400,
  "pendingCreatorEarnings": 10000,
  "pendingEmpressaEarnings": 500,
  "pendingIntegratorEarnings": 100,
  "distributedCreatorEarnings": 930000,
  "distributedEmpressaEarnings": 49500,
  "distributedIntegratorEarnings": 9900
}
```

**Errors:**
- `404` - Organization not found or has no contract address

---

## Offer Management APIs

### Create Offer

Creates a new offer on an asset.

```http
POST /api/v1/offers
Authorization: Bearer {token}
Content-Type: application/json
Idempotency-Key: {unique-key}

{
  "assetId": "asset-123",
  "amount": 100000,
  "earnestMoney": 10000,
  "ddPeriod": 30,
  "closingDate": "2025-03-01T00:00:00Z",
  "offerType": "CASH",
  "contingencies": [
    {
      "type": "title",
      "description": "Clear title required",
      "required": true
    }
  ],
  "terms": {
    "inspectionPeriod": 10
  },
  "notes": "Interested in purchasing"
}
```

**Response:** `201 Created`
```json
{
  "id": "offer-uuid",
  "assetId": "asset-123",
  "buyerId": "buyer-uuid",
  "sellerId": "seller-uuid",
  "amount": 100000,
  "earnestMoney": 10000,
  "ddPeriod": 30,
  "status": "PENDING",
  "offerType": "CASH",
  "createdAt": "2025-01-30T00:00:00Z"
}
```

**Errors:**
- `400` - Invalid request or duplicate offer
- `403` - Cannot create offer on own asset

---

### Accept Offer

Accepts an offer. Only seller can accept.

```http
POST /api/v1/offers/{id}/accept
Authorization: Bearer {token}
Content-Type: application/json
Idempotency-Key: {unique-key}

{
  "notes": "Offer accepted"
}
```

**Response:** `200 OK`
```json
{
  "id": "offer-uuid",
  "status": "ACCEPTED",
  // ... other fields
}
```

**Errors:**
- `400` - Offer cannot be accepted (wrong status or expired)
- `403` - Only seller can accept

---

### Decline Offer

Declines an offer. Only seller can decline.

```http
POST /api/v1/offers/{id}/decline
Authorization: Bearer {token}
Content-Type: application/json
Idempotency-Key: {unique-key}

{
  "notes": "Offer declined"
}
```

**Response:** `200 OK`
```json
{
  "id": "offer-uuid",
  "status": "DECLINED",
  // ... other fields
}
```

---

### Withdraw Offer

Withdraws an offer. Only buyer can withdraw.

```http
POST /api/v1/offers/{id}/withdraw
Authorization: Bearer {token}
Idempotency-Key: {unique-key}
```

**Response:** `200 OK`
```json
{
  "id": "offer-uuid",
  "status": "WITHDRAWN",
  // ... other fields
}
```

---

## Asset Validation APIs

### Validate Asset

Validates an asset using Enverus, AI, and category-based rules.

```http
POST /api/v1/validation/asset
Authorization: Bearer {token}
Content-Type: application/json

{
  "assetId": "asset-123",
  "category": "A",
  "assetType": "MINERAL",
  "county": "REEVES",
  "state": "TX"
}
```

**Response:** `200 OK`
```json
{
  "assetId": "asset-123",
  "status": "APPROVED",
  "score": 85,
  "issues": [
    {
      "type": "WARNING",
      "severity": "MEDIUM",
      "message": "Low Enverus match confidence",
      "field": "enverus"
    }
  ],
  "enverusValidation": {
    "verified": true,
    "matchScore": 90
  },
  "aiAnalysis": {
    "confidence": 85
  }
}
```

---

## Enverus Integration APIs

### Validate Asset with Enverus

Validates asset data against Enverus records.

```http
POST /api/v1/enverus/validate
Authorization: Bearer {token}
Content-Type: application/json

{
  "county": "REEVES",
  "state": "TX",
  "operator": "Pioneer Natural Resources"
}
```

**Response:** `200 OK`
```json
{
  "verified": true,
  "matchScore": 95,
  "enverusId": "12345678",
  "matchedFields": ["county", "state", "operator"],
  "discrepancies": []
}
```

---

## AI Model APIs

### Analyze Document

Analyzes uploaded document and extracts structured data.

```http
POST /api/v1/ai/analyze-document
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: [binary]
documentType: "DEED"
```

**Response:** `200 OK`
```json
{
  "extraction": {
    "legalDescription": "Section 10, Block 10",
    "county": "REEVES",
    "state": "TX",
    "ownerNames": ["John Doe"],
    "confidence": 90
  }
}
```

---

## Organization APIs

### Get Organization Profile

Retrieves organization profile with category classification.

```http
GET /api/v1/organizations/{id}/profile
Authorization: Bearer {token}
```

**Response:** `200 OK`
```json
{
  "id": "org-uuid",
  "name": "Pioneer Natural Resources",
  "category": "A",
  "legalEntityType": "Corporation",
  "primaryIndustry": "Exploration & Production",
  // ... other fields
}
```

---

## Error Handling

### Standard Error Response

```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Bad Request"
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error, invalid data)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `500` - Internal Server Error

### Validation Errors

When validation fails, the response includes details:

```json
{
  "statusCode": 400,
  "message": ["amount must be a positive number", "category must be one of: A, B, C"],
  "error": "Bad Request"
}
```

---

## Rate Limiting

API requests are rate-limited to prevent abuse:
- **Authenticated requests:** 100 requests per minute
- **Unauthenticated requests:** 20 requests per minute

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

## Idempotency

Mutation endpoints (POST, PATCH, DELETE) support idempotency keys to prevent duplicate operations.

Include the `Idempotency-Key` header with a unique value:

```http
POST /api/v1/transactions
Authorization: Bearer {token}
Idempotency-Key: unique-key-12345
Content-Type: application/json

{
  "offerId": "offer-uuid"
}
```

If the same idempotency key is used within 24 hours, the original response is returned.

---

## Pagination

List endpoints support pagination:

```http
GET /api/v1/transactions?page=1&pageSize=20
```

**Response:**
```json
{
  "transactions": [...],
  "total": 100,
  "page": 1,
  "pageSize": 20
}
```

---

## Webhooks & Notifications

The platform sends email notifications for:
- Offer created/accepted/declined
- Transaction status changes
- Settlement statement ready

Notifications are sent automatically and cannot be disabled via API (future enhancement).

---

## Swagger UI

Interactive API documentation is available at:

**Local:** `http://localhost:3000/api/v1/docs`  
**Production:** `https://api.Empressa.io/api/v1/docs`

The Swagger UI allows you to:
- Browse all available endpoints
- See request/response schemas
- Test API calls directly
- View authentication requirements

---

## Support

For API support, contact:
- **Email:** api-support@Empressa.io
- **Documentation:** https://docs.Empressa.io
- **Status Page:** https://status.Empressa.io

---

*Last Updated: January 30, 2025*

