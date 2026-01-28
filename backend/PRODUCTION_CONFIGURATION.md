# Production Configuration Guide

This document describes the production Docker configuration, issues identified, and recommendations for production deployment.

## Current Configuration Review

### Issues Identified in `docker-compose.prod.yml`

#### ❌ **CRITICAL ISSUE #1: Using Development Build Target**
All services in `docker-compose.prod.yml` are using `target: development` instead of `target: production`:
- `core-api`: Line 92 - `target: development`
- `admin-service`: Line 124 - `target: development`
- `kms-service`: Line 153 - `target: development`
- `blockchain-service`: Line 180 - `target: development`
- `ipfs-service`: Line 211 - `target: development`

**Impact:** Services are built with development dependencies, source maps, and watch mode, which are not suitable for production.

**Fix Required:** Change all services to use `target: production`.

#### ❌ **CRITICAL ISSUE #2: Using Watch Mode Commands**
All services are using `--watch` commands which are for development:
- `core-api`: Line 117 - `pnpm nest start core-api --watch`
- `admin-service`: Line 146 - `pnpm nest start admin-service --watch`
- `kms-service`: Line 173 - `pnpm nest start kms-service --watch`
- `blockchain-service`: Line 204 - `pnpm nest start blockchain-service --watch`
- `ipfs-service`: Line 233 - `pnpm nest start ipfs-service --watch`

**Impact:** Watch mode monitors file changes and restarts services, consuming unnecessary resources in production.

**Fix Required:** Production services should run the compiled JavaScript directly (see Dockerfile production target).

#### ⚠️ **ISSUE #3: Volume Mounts in Production**
All services mount source code as volumes:
```yaml
volumes:
  - .:/usr/src/app
  - /usr/src/app/node_modules
```

**Impact:** In production, you shouldn't need to mount source code volumes. The compiled code should be in the Docker image.

**Fix Required:** Remove volume mounts for production builds.

#### ✅ **GOOD: Production Dockerfile Target Exists**
The Dockerfile has a proper `production` target (lines 66-102) that:
- Uses multi-stage build
- Copies only built artifacts
- Runs `pnpm prune --prod` to remove dev dependencies
- Uses compiled JavaScript instead of TypeScript
- Includes Prisma client generation
- Runs migrations before starting the app

## Production Configuration Checklist

### ✅ Infrastructure Services (Already Configured)
- [x] PostgreSQL with health checks
- [x] Redis with health checks
- [x] RabbitMQ with health checks
- [x] Network configuration
- [x] Volume persistence for data

### ❌ Application Services (Needs Fixes)
- [ ] Use `target: production` for all services
- [ ] Remove `--watch` commands
- [ ] Remove development volume mounts
- [ ] Use production command from Dockerfile
- [ ] Set proper resource limits
- [ ] Configure restart policies
- [ ] Add health checks for application services

## Recommended Production Configuration

### Fixed `docker-compose.prod.yml` Example

```yaml
services:
  # ... infrastructure services remain the same ...

  core-api:
    profiles: ["apps"]
    build:
      context: .
      dockerfile: Dockerfile
      target: production  # ✅ Changed from development
      args:
        APP_NAME: core-api
    ports:
      - "3000:3000"
    env_file: ./.env
    environment:
      - NODE_ENV=production
      - POSTGRES_DB=${POSTGRES_DB:-core_api_prod}
      - DATABASE_URL=postgresql://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD:-postgres}@db:5432/${POSTGRES_DB:-core_api_prod}
      - REDIS_HOST=${REDIS_HOST:-redis}
      - REDIS_PORT=${REDIS_PORT:-6379}
    # ✅ Removed volume mounts for production
    networks:
      - core-services-net
    depends_on:
      migrations:
        condition: service_completed_successfully
      redis:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
    # ✅ Use production command (already in Dockerfile CMD)
    restart: always
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

**Note:** Apply similar changes to all other services (admin-service, kms-service, blockchain-service, ipfs-service).

## Production Requirements

### Environment Variables
All production environment variables must be set (see `ENVIRONMENT_SETUP.md`):
- Database credentials (strong passwords)
- JWT secret (strong random string)
- Service URLs (production endpoints)
- Redis/RabbitMQ credentials
- AWS credentials (for KMS service)
- Pinata credentials (for IPFS service)
- Blockchain RPC URL
- Private keys (securely managed)

### Security Considerations
1. **Secrets Management**: Do not commit `.env` files. Use:
   - Docker secrets
   - Environment variables in deployment platform
   - Secrets manager (AWS Secrets Manager, HashiCorp Vault, etc.)

2. **Network Security**:
   - Use internal networks for service communication
   - Expose only necessary ports externally
   - Use reverse proxy (nginx, traefik) for HTTPS termination

3. **Database Security**:
   - Use strong passwords
   - Enable SSL/TLS connections
   - Restrict network access
   - Regular backups

4. **Container Security**:
   - Run containers as non-root users
   - Use minimal base images (alpine)
   - Regularly update base images
   - Scan images for vulnerabilities

### Deployment Considerations

#### Option 1: Docker Compose (Simple)
- Good for: Single server deployments
- Pros: Simple, all services in one place
- Cons: No automatic scaling, manual updates

#### Option 2: Kubernetes (Recommended for Scale)
- Good for: Production at scale, high availability
- Pros: Auto-scaling, self-healing, rolling updates
- Cons: More complex setup

#### Option 3: Cloud Provider Services
- **AWS**: ECS, EKS, App Runner
- **Azure**: AKS, Container Instances
- **Google Cloud**: GKE, Cloud Run
- Pros: Managed infrastructure, scaling
- Cons: Vendor lock-in, costs

## Deployment Checklist

### Pre-Deployment
- [ ] Fix `docker-compose.prod.yml` (change targets to production)
- [ ] Set all required environment variables
- [ ] Configure secrets management
- [ ] Set up database backups
- [ ] Configure monitoring/logging
- [ ] Set up SSL/TLS certificates
- [ ] Configure reverse proxy

### Deployment Steps
1. **Build Production Images**:
   ```bash
   docker-compose -f docker-compose.prod.yml build
   ```

2. **Run Migrations** (automatically runs via migrations service):
   ```bash
   docker-compose -f docker-compose.prod.yml --profile apps up migrations
   ```

3. **Start Infrastructure**:
   ```bash
   docker-compose -f docker-compose.prod.yml --profile infrastructure up -d
   ```

4. **Start Application Services**:
   ```bash
   docker-compose -f docker-compose.prod.yml --profile apps up -d
   ```

5. **Verify Health**:
   ```bash
   docker-compose -f docker-compose.prod.yml ps
   curl http://localhost:3000/api/health
   ```

### Post-Deployment
- [ ] Verify all services are healthy
- [ ] Check application logs
- [ ] Test critical endpoints
- [ ] Monitor resource usage
- [ ] Set up alerting
- [ ] Configure backup schedule

## Monitoring & Logging

### Recommended Tools
- **Logging**: ELK Stack, Loki, CloudWatch Logs
- **Monitoring**: Prometheus + Grafana, Datadog, New Relic
- **APM**: Elastic APM, New Relic, AppDynamics
- **Error Tracking**: Sentry, Rollbar

### Key Metrics to Monitor
- CPU and memory usage per service
- Request rate and latency
- Error rates
- Database connection pool usage
- Redis cache hit/miss rates
- Queue lengths (RabbitMQ)
- Disk usage

## Troubleshooting

### Service Won't Start
1. Check logs: `docker-compose logs <service-name>`
2. Verify environment variables are set
3. Check service dependencies are healthy
4. Verify ports are available

### Database Connection Issues
1. Verify DATABASE_URL is correct
2. Check database is accessible from container network
3. Verify credentials are correct
4. Check database logs

### High Memory Usage
1. Review resource limits
2. Check for memory leaks
3. Optimize application code
4. Consider horizontal scaling

## Next Steps

1. **Immediate**: Fix `docker-compose.prod.yml` to use production targets
2. **Short-term**: Set up monitoring and logging
3. **Medium-term**: Implement CI/CD pipeline
4. **Long-term**: Consider migrating to Kubernetes for better scaling

## Additional Resources

- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [12-Factor App Methodology](https://12factor.net/)
- [NestJS Production Best Practices](https://docs.nestjs.com/techniques/performance)
