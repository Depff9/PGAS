#!/bin/sh
set -e

echo "Applying database migrations..."
npx prisma migrate deploy
npx prisma generate

if [ "${PGAS_SEED_ON_START:-false}" = "true" ]; then
  echo "Seeding demo data..."
  node prisma/seed.mjs
fi

echo "Starting PGAS backend..."
exec node src/server.js
