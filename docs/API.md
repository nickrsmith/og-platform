# API Documentation

API documentation for the O&G Platform services.

## Backend Services

### OG Backend - Core API

**Base URL:** `http://localhost:3000`

Swagger documentation available at: `http://localhost:3000/api`

**Key Endpoints:**
- Authentication: `/auth/*`
- Users: `/users/*`
- Organizations: `/organizations/*`
- Releases/Assets: `/releases/*`
- Transactions: `/transactions/*`
- Offers: `/offers/*`
- Revenue: `/revenue/*`
- Division Orders: `/division-orders/*`

### OG Lens Platform - Indexer API

**Base URL:** `http://localhost:4000`

**Key Endpoints:**
- Sites: `/sites/*`
- Releases: `/releases/*`
- Activities: `/activities/*`
- Subscriptions: `/subscriptions/*`
- Transactions: `/transactions/*`
- Analytics: `/analytics/*`

### OG Data Room Backend

**Base URL:** `http://localhost:8080`

**Key Endpoints:**
- Authentication: `/auth/*`
- Users: `/users/*`
- Organizations: `/organizations/*`
- Documents: `/documents/*`
- Roles: `/roles/*`

## Authentication

Most endpoints require authentication via JWT tokens.

## Documentation

For detailed API documentation:
- OG Backend: See Swagger UI at `/api` endpoint
- Service-specific README files contain endpoint documentation
- OpenAPI/Swagger specs available in service directories

## Examples

See service-specific README files for API usage examples.