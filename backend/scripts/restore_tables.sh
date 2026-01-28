#!/bin/bash

# A script to restore a plain-text SQL backup to a PostgreSQL database running in Docker.
# Reads user/password from .env and gets the target DB name from .env.

set -e

# --- Load Environment Variables (Robust Method) ---
if [ -f .env ]; then
  set -a; source .env; set +a
else
  echo "Error: .env file not found."
  exit 1
fi

# --- Validate Required Environment Variables ---
if [ -z "$POSTGRES_USER" ] || [ -z "$POSTGRES_PASSWORD" ] || [ -z "$POSTGRES_DB" ]; then
  echo "Error: Required variables (POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB) are not set in .env."
  exit 1
fi

# --- Configuration from Arguments ---
CONTAINER_NAME="$1"
INPUT_FILE="$2"
TARGET_DB_NAME="$POSTGRES_DB" # Reads the target DB name from the .env file

# --- Validation of Arguments ---
if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <container_name> <input_file>"
    echo "Example: $0 core-backend-db-1 admins_backup.dump"
    exit 1
fi

if [ ! -f "$INPUT_FILE" ]; then
    echo "Error: Backup file '$INPUT_FILE' not found!"
    exit 1
fi

# --- Main Logic ---
echo "Starting restore of '$INPUT_FILE' to database '$TARGET_DB_NAME' in container '$CONTAINER_NAME'..."

export PGPASSWORD="$POSTGRES_PASSWORD"

# *** THE KEY CHANGE IS HERE: Use the universally compatible -v ON_ERROR_STOP=1 flag ***
cat "$INPUT_FILE" | docker exec -i \
    -e PGPASSWORD \
    "$CONTAINER_NAME" \
    psql -U "$POSTGRES_USER" -d "$TARGET_DB_NAME" --quiet -v ON_ERROR_STOP=1

unset PGPASSWORD

echo "✅ Restore complete!"