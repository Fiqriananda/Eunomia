#!/bin/sh
set -e

echo "=== Eunomia Backend Production Startup ==="
echo "Waiting for PostgreSQL to be ready and syncing database schema with Prisma..."

RETRIES=20
until npx prisma db push --skip-generate; do
  RETRIES=$((RETRIES - 1))
  if [ "$RETRIES" -le 0 ]; then
    echo "ERROR: Failed to connect to database or execute prisma db push after multiple attempts."
    exit 1
  fi
  echo "PostgreSQL not ready yet. Retrying in 2 seconds ($RETRIES attempts left)..."
  sleep 2
done

echo "Database schema synchronized successfully!"
echo "Starting NestJS Eunomia Backend on port ${PORT:-4000}..."
exec node dist/main.js
