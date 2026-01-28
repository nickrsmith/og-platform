#!/bin/bash

# Helper script to resolve DATABASE_URL from .env
# Usage: source ./scripts/get-db-url.sh && pnpm prisma migrate dev

# Load environment variables
set -a
source .env
set +a

# Export resolved DATABASE_URL
export DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}"

echo "DATABASE_URL resolved to: ${DATABASE_URL}"
