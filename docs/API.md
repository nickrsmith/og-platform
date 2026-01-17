# API Documentation

API documentation for the O&G Platform services.

*Last Updated: January 16, 2026*

## Backend Services

### Core API

**Base URL:** `http://localhost:3002`

Swagger documentation available at: `http://localhost:3002/api/docs`

**Key Endpoints:**
- Authentication: `/api/v1/auth/*`
- Users: `/api/v1/users/*`
- Organizations: `/api/v1/organizations/*`
- Releases/Assets: `/api/v1/releases/*`
- Transactions: `/api/v1/transactions/*`
- Offers: `/api/v1/offers/*`
- Revenue: `/api/v1/revenue/*`
- Division Orders: `/api/v1/division-orders/*`
- Data Rooms: `/api/v1/data-rooms/*`
- Health: `/api/health` or `/api/v1/health`

### Admin Service

**Base URL:** `http://localhost:4243`

**Key Endpoints:**
- Authentication: `/auth/*`
- Users: `/users/*`
- Organizations: `/organizations/*`
- Releases: `/releases/*`
- Analytics: `/analytics/*`

### KMS Service

**Base URL:** `http://localhost:3001`

Key Management Service for cryptographic operations.

### Blockchain Service

**Base URL:** `http://localhost:3003`

Blockchain interaction service for smart contract operations.

### IPFS Service

**Base URL:** `http://localhost:3004`

IPFS file management and pinning service.

## Authentication

Most endpoints require authentication via JWT tokens.

## Documentation

For detailed API documentation:
- Core API: See Swagger UI at `http://localhost:3002/api/docs`
- Backend documentation: See `backend/docs/` directory
- Service-specific README files contain endpoint documentation

## Examples

See service-specific README files for API usage examples.