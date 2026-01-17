# Environment Variables Reference

Complete reference for all environment variables required by the O&G Platform services.

*Last Updated: January 16, 2026*

## Overview

Each service requires specific environment variables. Copy `.env.example` to `.env` in each service directory and configure the values.

## Backend Services

**Location:** `backend/.env`

See `backend/.env.example` for complete configuration.

**Key Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` - PostgreSQL credentials
- `REDIS_HOST`, `REDIS_PORT` - Redis configuration
- `RABBITMQ_USER`, `RABBITMQ_PASS` - RabbitMQ credentials
- `JWT_SECRET` - JWT signing secret
- `WEB3AUTH_JWKS_URL` - Web3Auth configuration
- `CORE_API_PORT` - Core API port (default: 3002)
- `ADMIN_SERVICE_PORT` - Admin service port (default: 4243)
- `KMS_SERVICE_PORT` - KMS service port (default: 3001)
- `BLOCKCHAIN_SERVICE_PORT` - Blockchain service port (default: 3003)
- `IPFS_SERVICE_PORT` - IPFS service port (default: 3004)
- `ROYALTY_MARKETPLACE_URL` - Frontend marketplace URL
- `ADMIN_DASHBOARD_URL` - Admin dashboard URL

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
- **Resend**: For backend email service
- Configure API keys in backend .env file

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