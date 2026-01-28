# Backend Environment Variables Setup

This document describes all environment variables needed for the backend services.

## Quick Setup

1. Copy `.env.example` to `.env` in the `backend/` directory
2. Update values as needed for your environment
3. Create service-specific `.env` files if needed (see service sections below)
4. Restart services after making changes

## Core-API Environment Variables

The main core-api service requires the following variables:

### Database
```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/core_api_dev
```

### JWT Authentication
```bash
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRATION=7d
JWT_REFRESH_EXPIRATION=30d
```

### Redis (Cache & Job Queue)
```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_TLS=false
REDIS_TTL=300000
```

### RabbitMQ (Message Queue)
```bash
RABBITMQ_URL=amqp://guest:guest@localhost:5672
```

### Service URLs (Required)
```bash
KMS_SERVICE_URL=http://localhost:3004
BLOCKCHAIN_SERVICE_URL=http://localhost:3005
IPFS_SERVICE_URL=http://localhost:3006
```

### Service URLs (Optional but Recommended)
```bash
LENS_MANAGER_URL=http://localhost:5000
INDEXER_API_URL=http://localhost:5001
ROYALTY_MARKETPLACE_URL=http://localhost:5000
ADMIN_DASHBOARD_URL=http://localhost:5175
```

### HTTP Configuration
```bash
HTTP_TIMEOUT=100000
```

### Storage
```bash
TEMP_STORAGE_PATH=/usr/src/app/temp-uploads
```

### AI Services (Optional)
```bash
ENABLE_AI_SERVICES=false
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o
```

### Third-Party Services (Optional)
```bash
# Enverus API for O&G data
ENVERUS_SECRET_KEY=

# Persona KYC verification
PERSONA_API_KEY=
PERSONA_ENVIRONMENT_ID=

# Simplify payments
SIMPLIFY_API_KEY=
SIMPLIFY_BASE_URL=https://api.simplify.com/v1
```

### Email Service (Optional)
```bash
# SMTP Configuration
# EMAIL_FROM=
# EMAIL_HOST=
# EMAIL_PORT=
# EMAIL_SECURE=
# EMAIL_USER=
# EMAIL_PASS=
```

## Blockchain Service Environment Variables

```bash
# Database (shared)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/core_api_dev

# Redis (shared)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_USERNAME=default
REDIS_PASSWORD=
REDIS_TLS=false

# RabbitMQ (shared)
RABBITMQ_URL=amqp://guest:guest@localhost:5672

# Blockchain RPC
RPC_URL=http://localhost:8545

# Wallet Configuration
ADMIN_WALLET_PRIVATE_KEY=your-admin-wallet-private-key
FAUCET_WALLET_PRIVATE_KEY=your-faucet-wallet-private-key

# HTTP Configuration
HTTP_TIMEOUT=60000

# Service Configuration
BLOCKCHAIN_SERVICE_PORT=3005
BLOCKCHAIN_SERVICE_HOST=0.0.0.0
```

## IPFS Service Environment Variables

```bash
# Redis (shared)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_USERNAME=default
REDIS_PASSWORD=
REDIS_TLS=false

# Pinata IPFS Provider
PINATA_API_URL=https://api.pinata.cloud
PINATA_JWT=your-pinata-jwt-token
PINATA_UPLOAD_TIMEOUT=120000
PINATA_PIN_TIMEOUT=30000
PINATA_HEALTH_CHECK_TIMEOUT=3000

# HTTP Configuration
HTTP_TIMEOUT=60000
```

## KMS Service Environment Variables

```bash
# AWS KMS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
KMS_KEY_ALIAS_PREFIX=empressa-wallet-key
KMS_KEY_POOL_SIZE=10

# Service Configuration
KMS_SERVICE_PORT=3004
KMS_SERVICE_HOST=0.0.0.0
```

## Admin Service Environment Variables

```bash
# Database (shared)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/core_api_dev

# JWT Authentication (shared)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Service Configuration
ADMIN_SERVICE_PORT=3001
ADMIN_SERVICE_HOST=0.0.0.0
```

## Variable Details

### Required Variables (Production)

#### `DATABASE_URL`
- **Description:** PostgreSQL database connection string
- **Format:** `postgresql://user:password@host:port/database`
- **Required:** Yes

#### `JWT_SECRET`
- **Description:** Secret key for signing JWT tokens
- **Required:** Yes
- **Security:** Must be a strong random string in production

#### `KMS_SERVICE_URL`
- **Description:** KMS service URL
- **Default:** `http://localhost:3004`
- **Required:** Yes

#### `BLOCKCHAIN_SERVICE_URL`
- **Description:** Blockchain service URL
- **Default:** `http://localhost:3005`
- **Required:** Yes

#### `IPFS_SERVICE_URL`
- **Description:** IPFS service URL
- **Default:** `http://localhost:3006`
- **Required:** Yes

#### `RABBITMQ_URL`
- **Description:** RabbitMQ connection URL
- **Format:** `amqp://user:password@host:port`
- **Required:** Yes

### Optional Variables

#### `LENS_MANAGER_URL`
- **Description:** P2P Lens Manager service URL
- **Default:** `null` (operations disabled if not set)
- **Required:** No (but recommended for P2P features)

#### `INDEXER_API_URL`
- **Description:** Indexer API service URL for release operations
- **Default:** `null` (operations disabled if not set)
- **Required:** No (but recommended for release features)

#### `REDIS_HOST`
- **Description:** Redis server hostname
- **Default:** `localhost`
- **Required:** No

#### `REDIS_PORT`
- **Description:** Redis server port
- **Default:** `6379`
- **Required:** No

#### `REDIS_PASSWORD`
- **Description:** Redis server password (if required)
- **Default:** `undefined`
- **Required:** No

#### `REDIS_TLS`
- **Description:** Enable TLS for Redis connections
- **Default:** `false` (auto-enabled if port is 6380)
- **Required:** No

#### `HTTP_TIMEOUT`
- **Description:** HTTP request timeout in milliseconds
- **Default:** `60000` (60 seconds) for most services, `100000` (100 seconds) for core-api
- **Required:** No

#### `ENABLE_AI_SERVICES`
- **Description:** Enable AI-powered services (document analysis, etc.)
- **Default:** `false`
- **Required:** No

#### `OPENAI_API_KEY`
- **Description:** OpenAI API key for AI services
- **Required:** Yes if `ENABLE_AI_SERVICES=true`

#### `RPC_URL`
- **Description:** Ethereum JSON-RPC provider URL (for blockchain-service)
- **Required:** Yes for blockchain-service

#### `ADMIN_WALLET_PRIVATE_KEY`
- **Description:** Admin wallet private key for blockchain operations
- **Required:** Yes for blockchain-service
- **Security:** Keep secret and secure

#### `PINATA_JWT`
- **Description:** Pinata JWT token for IPFS pinning (for ipfs-service)
- **Required:** Yes for ipfs-service
- **Where to get:** https://app.pinata.cloud/developers/api-keys

#### `AWS_REGION`
- **Description:** AWS region for KMS operations (for kms-service)
- **Default:** `us-east-1`
- **Required:** Yes for kms-service

#### `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`
- **Description:** AWS credentials for KMS operations
- **Required:** Yes for kms-service
- **Security:** Keep secret and secure

## Service Ports

Default service ports (can be overridden with `*_SERVICE_PORT` env vars):

- **Core-API:** 3002
- **Admin-Service:** 3001
- **Blockchain-Service:** 3005
- **IPFS-Service:** 3006
- **KMS-Service:** 3004

## Example Configurations

### Development (Local)
```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/core_api_dev
JWT_SECRET=dev-secret-key-change-in-production
REDIS_HOST=localhost
REDIS_PORT=6379
KMS_SERVICE_URL=http://localhost:3004
BLOCKCHAIN_SERVICE_URL=http://localhost:3005
IPFS_SERVICE_URL=http://localhost:3006
RABBITMQ_URL=amqp://guest:guest@localhost:5672
LENS_MANAGER_URL=http://localhost:5000
INDEXER_API_URL=http://localhost:5001
```

### Production
```bash
DATABASE_URL=postgresql://user:strong-password@db-host:5432/core_api_prod
JWT_SECRET=strong-random-secret-key
REDIS_HOST=redis-host
REDIS_PORT=6379
REDIS_PASSWORD=redis-password
REDIS_TLS=true
KMS_SERVICE_URL=https://kms.your-domain.com
BLOCKCHAIN_SERVICE_URL=https://blockchain.your-domain.com
IPFS_SERVICE_URL=https://ipfs.your-domain.com
RABBITMQ_URL=amqp://user:password@rabbitmq-host:5672
LENS_MANAGER_URL=https://lens-manager.your-domain.com
INDEXER_API_URL=https://indexer.your-domain.com
ENABLE_AI_SERVICES=true
OPENAI_API_KEY=sk-...
```

## Notes

- All `.env` files should be in `.gitignore` (already configured)
- Never commit `.env` files with real secrets
- Use `.env.example` files as templates
- For Docker deployments, use Docker Compose environment variable files or secrets management
- In production, use a secrets manager (AWS Secrets Manager, HashiCorp Vault, etc.)

## Troubleshooting

### Service Connection Issues
- Verify all service URLs are correct and services are running
- Check network connectivity between services
- Verify port numbers match your configuration

### Database Connection Issues
- Verify `DATABASE_URL` format is correct
- Check database is running and accessible
- Verify credentials are correct

### Redis Connection Issues
- Verify Redis is running: `redis-cli ping`
- Check `REDIS_HOST` and `REDIS_PORT` are correct
- Verify `REDIS_PASSWORD` if authentication is enabled

### Missing Environment Variables
- Check service logs for specific missing variables
- Verify `.env` file is in the correct location
- Ensure variables are not commented out
