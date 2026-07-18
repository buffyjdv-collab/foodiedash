#!/bin/bash
# Production build script for Vercel.
# Handles:
# 1. Switching Prisma provider from sqlite → postgresql (for Neon DB)
# 2. Generating .z-ai-config from env vars (for the AI chatbot/search)
# 3. Prisma client generation
# 4. Next.js build

set -e

echo "🚀 Starting production build..."

# ---------------------------------------------------------
# 1. Switch Prisma provider to postgresql for Neon DB
# ---------------------------------------------------------
SCHEMA="prisma/schema.prisma"
if grep -q 'provider = "sqlite"' "$SCHEMA"; then
  echo "📦 Switching Prisma provider: sqlite → postgresql"
  sed -i 's/provider = "sqlite"/provider = "postgresql"/' "$SCHEMA"
else
  echo "📦 Prisma provider already postgresql — no switch needed"
fi

# ---------------------------------------------------------
# 2. Generate .z-ai-config from env vars (if provided)
# ---------------------------------------------------------
if [ -n "$ZAI_API_KEY" ] && [ -n "$ZAI_BASE_URL" ]; then
  echo "🤖 Generating .z-ai-config from env vars"
  cat > .z-ai-config << EOF
{
  "baseUrl": "$ZAI_BASE_URL",
  "apiKey": "$ZAI_API_KEY",
  "chatId": "$ZAI_CHAT_ID",
  "token": "$ZAI_TOKEN",
  "userId": "$ZAI_USER_ID"
}
EOF
  echo "   ✓ .z-ai-config created (baseUrl: $ZAI_BASE_URL)"
else
  echo "⚠️  ZAI_API_KEY / ZAI_BASE_URL not set — AI features will be disabled"
  echo "   The app will still build; AI chatbot/search will return errors at runtime."
fi

# ---------------------------------------------------------
# 3. Generate Prisma client (for postgresql)
# ---------------------------------------------------------
echo "📦 Generating Prisma client..."
npx prisma generate

# ---------------------------------------------------------
# 4. Build Next.js
# ---------------------------------------------------------
echo "🏗️  Building Next.js..."
npx next build

echo "✅ Production build complete!"
