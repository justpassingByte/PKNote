#!/bin/sh

# 1. Run migrations to ensure database is up to date
echo "🚀 Running database migrations..."
npx prisma migrate deploy

# 2. Seed database (idempotent — safe to run every startup)
echo "🌱 Seeding database..."
npx prisma db seed

# 3. Start the server
echo "🌟 Starting backend server..."
node dist/src/server.js
