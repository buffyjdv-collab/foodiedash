#!/bin/bash
# Run all seeds in order against the current DATABASE_URL.
# Usage: bun run db:seed  (or: bash scripts/seed.sh)
set -e

echo "🌱 Seeding database..."
echo "   DATABASE_URL: ${DATABASE_URL:0:30}..."

echo "  → Core data (cities, restaurants, menus, coupons, riders)..."
bun run prisma/seed.ts

echo "  → RBAC (roles, permissions, demo users)..."
bun run prisma/seed-rbac.ts

echo "  → Hyderabad restaurants..."
bun run prisma/seed-hyderabad.ts

echo "  → User↔Rider/Restaurant links..."
bun run prisma/seed-links.ts

echo "✅ All seeds complete!"
