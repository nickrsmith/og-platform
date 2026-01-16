# Environment Variables Reference

Complete reference for all environment variables required by the O&G Platform services.

## Overview

Each service requires specific environment variables. Copy `.env.example` to `.env` in each service directory and configure the values.

## Backend: OG Backend

**Location:** `backend/og-backend/.env`

See `backend/og-backend/.env.example` for complete configuration.

**Key Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_HOST`, `REDIS_PORT` - Redis configuration
- `RABBITMQ_USER`, `RABBITMQ_PASS` - RabbitMQ credentials
- `JWT_SECRET` - JWT signing secret
- `WEB3AUTH_JWKS_URL` - Web3Auth configuration
- `BLOCKCHAIN_SERVICE_URL` - Blockchain service URL
- `INDEXER_API_URL` - Lens platform indexer URL
- `LENS_MANAGER_URL` - Lens platform manager URL

## Backend: OG Lens Platform

**Location:** `backend/og-lens-platform/.env`

See `backend/og-lens-platform/.env.example` for complete configuration.

**Key Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `GH_PAT` - GitHub Personal Access Token (for private packages)
- `LENS_MANAGER_MASTER_KEY` - P2P master key
- `BOOTSTRAP_PEERS` - P2P bootstrap peer addresses
- `P2P_MAX_OPEN_SITES` - Maximum open P2P sites

## Backend: OG Data Room Backend

**Location:** `backend/og-data-room-backend/.env`

See `backend/og-data-room-backend/.env.example` for complete configuration.

**Key Variables:**
- `MONGO_HOST`, `MONGO_PORT`, `MONGO_USER`, `MONGO_PASSWORD`, `MONGO_DATABASE` - MongoDB configuration
- `REDIS_HOST`, `REDIS_PORT` - Redis configuration
- `JWT_SECRET` - JWT signing secret
- `WEB3AUTH_JWKS_URL` - Web3Auth configuration
- `POSTMARK_API_KEY` - Email service API key

## Frontend Applications

Frontend applications typically use environment variables through build-time configuration or runtime configuration files.

See each frontend's README or configuration files for specific requirements.

## External Services

### AWS Services
- **KMS**: Key Management Service for encryption
- Configure via AWS credentials (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)

### Web3Auth
- Web3Auth service account and client ID
- Configure in service-specific .env files

### Ethereum/Blockchain
- Ethereum RPC endpoint URL
- Configure in blockchain service configuration

### Email Services
- **Resend**: For og-backend email service
- **Postmark**: For og-data-room-backend email service
- Configure API keys in respective .env files

## Security Notes

- Never commit `.env` files to version control
- Use `.env.example` files as templates
- Store secrets securely (use secret management services in production)
- Rotate secrets regularly
- Use different credentials for development, staging, and production

## Production Configuration

For production deployments:
- Use environment-specific configuration management
- Store secrets in secure secret management systems (AWS Secrets Manager, HashiCorp Vault, etc.)
- Use separate databases and services for each environment
- Enable SSL/TLS for all connections
- Configure proper firewall rules
- Use strong, unique passwords and keys