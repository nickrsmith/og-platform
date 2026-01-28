#!/bin/bash

# A script to back up ONLY THE DATA for specific tables from a PostgreSQL database.
# Ideal for use with schema migration tools like Prisma.
# It reads standard POSTGRES_* credentials from a .env file.

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
OUTPUT_FILE="$2"
shift 2
TABLES=("$@")

# --- Validation of Arguments ---
if [ -z "$CONTAINER_NAME" ] || [ -z "$OUTPUT_FILE" ] || [ ${#TABLES[@]} -eq 0 ]; then
    echo "Usage: $0 <container_name> <output_file.dump> <table1> [table2...]"
    echo "Example: $0 db data_backup.dump admin_users roles"
    exit 1
fi

# --- Main Logic ---
echo "Starting DATA-ONLY backup for database '$POSTGRES_DB' from container '$CONTAINER_NAME'..."

table_flags=""
for table in "${TABLES[@]}"; do
    table_flags+=" -t \"$table\""
done

echo "Tables to back up: ${TABLES[*]}"

# Map POSTGRES_PASSWORD to PGPASSWORD for pg_dump authentication.
export PGPASSWORD="$POSTGRES_PASSWORD"

# Execute the backup command with the crucial --data-only flag.
# --inserts is often more compatible for data-only restores than the default COPY.
docker exec \
    -e PGPASSWORD \
    "$CONTAINER_NAME" \
    bash -c "pg_dump -U \"$POSTGRES_USER\" -d \"$POSTGRES_DB\" --data-only --column-inserts $table_flags" > "$OUTPUT_FILE"

unset PGPASSWORD

echo "✅ Data-only backup complete! File saved as '$OUTPUT_FILE'."