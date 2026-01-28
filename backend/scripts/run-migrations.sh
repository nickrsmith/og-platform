#!/bin/sh
# core-services/scripts/run-migrations.sh

# Exit immediately if a command exits with a non-zero status.
set -e

echo "Starting database migrations..."

# Ensure we're in the right directory
cd /usr/src/app

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL environment variable is not set"
    exit 1
fi

echo "Database URL: $DATABASE_URL"

# Unset any conflicting environment variables that might be loaded from .env
unset $(grep -v '^#' .env | grep -v '^$' | cut -d= -f1 | xargs) 2>/dev/null || true

# Set the correct DATABASE_URL
export DATABASE_URL="$DATABASE_URL"

# Generate Prisma client (in case it's not already generated)
echo "Generating Prisma client..."
pnpm prisma generate

# Run Prisma migrations
echo "Running Prisma migrations for core services..."
pnpm prisma migrate deploy

echo "Migrations completed successfully."

# The script will now exit. The container will stop.