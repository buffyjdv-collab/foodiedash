# FoodieDash — Production Deployment Guide

A full-stack Swiggy/Zomato-style food delivery platform with OTP auth, particle-level RBAC, GPS-based nearby restaurants, AI-powered search/chatbot, live order tracking, rider & restaurant portals, and an admin dashboard.

## Tech Stack
- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui
- **Database**: PostgreSQL (Neon serverless)
- **ORM**: Prisma 6
- **AI**: Z.AI SDK (LLM chatbot + smart search)
- **Realtime**: Socket.IO (sandbox) / client-side simulation (production)

---

## Deployment Overview

| Platform | Purpose |
|---|---|
| **GitHub** | Source code repository |
| **Vercel** | Hosting (Next.js serverless) |
| **Neon** | PostgreSQL database |

---

## Step 1: Create a Neon Database

1. Go to [neon.tech](https://neon.tech) and sign up (free tier).
2. Create a new project (e.g., "foodiedash").
3. Copy the **pooled connection string** (with `-pooler` in the hostname):
   ```
   postgresql://user:password@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require
   ```
4. Save this — you'll need it as `DATABASE_URL`.

## Step 2: Push to GitHub

```bash
# Initialize git (if not already)
git init
git add .
git commit -m "Production-ready FoodieDash"

# Create a GitHub repo and push
git remote add origin https://github.com/YOUR_USERNAME/foodiedash.git
git branch -M main
git push -u origin main
```

## Step 3: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project**.
2. Import your GitHub repo.
3. Vercel auto-detects Next.js. Set these **Environment Variables**:

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | Your Neon pooled connection string |
   | `ZAI_BASE_URL` | `https://internal-api.z.ai/v1` |
   | `ZAI_API_KEY` | Your Z.AI API key |
   | `ZAI_CHAT_ID` | (optional) chat ID |
   | `ZAI_TOKEN` | (optional) token |
   | `ZAI_USER_ID` | (optional) user ID |

4. Click **Deploy**. The build script (`scripts/build.sh`) will:
   - Switch Prisma from SQLite → PostgreSQL
   - Generate `.z-ai-config` from env vars
   - Generate the Prisma client
   - Build Next.js

## Step 4: Initialize the Database

After the first deploy, run the schema + seeds against Neon:

```bash
# Set DATABASE_URL to your Neon connection string
export DATABASE_URL="postgresql://user:password@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require"

# Switch schema to postgresql
sed -i 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma

# Push schema to Neon
npx prisma db push

# Generate Prisma client
npx prisma generate

# Seed all data (restaurants, menus, roles, users, Hyderabad)
bash scripts/seed.sh
```

Or run seeds individually:
```bash
bun run prisma/seed.ts          # Core data: restaurants, menus, coupons, riders
bun run prisma/seed-rbac.ts     # RBAC: 10 roles, 56 permissions, 10 demo users
bun run prisma/seed-hyderabad.ts # 8 Hyderabad restaurants
bun run prisma/seed-links.ts    # User↔Rider/Restaurant links
```

## Step 5: Verify

Visit your Vercel URL. Try the demo logins (all use OTP `123456`):

| Role | Phone | Portal |
|---|---|---|
| Super Admin | +919876543201 | Admin Portal (14 modules) |
| City Admin | +919876543202 | Admin Portal (8 modules) |
| Restaurant Owner | +919876543207 | Restaurant Dashboard |
| Restaurant Staff | +919876543208 | Restaurant Dashboard |
| Delivery Partner | +919876543209 | Rider Dashboard |
| Customer | +919876543210 | Home (order food) |

---

## How the build works

The `scripts/build.sh` script handles the SQLite→PostgreSQL switch automatically:
1. `sed` replaces `provider = "sqlite"` → `provider = "postgresql"` in `prisma/schema.prisma`
2. If `ZAI_API_KEY` + `ZAI_BASE_URL` env vars are set, generates `.z-ai-config`
3. Runs `prisma generate` (PostgreSQL client)
4. Runs `next build`

This keeps the sandbox on SQLite (for fast local dev) while Vercel uses PostgreSQL (Neon).

## WebSocket Tracking (Production)

The sandbox uses a Socket.IO mini-service for live order tracking. Vercel doesn't support long-running WebSocket servers, so the `order-tracking.tsx` component includes a **client-side simulation fallback**: if the socket doesn't connect within 4 seconds, it runs the same lifecycle simulation in the browser. This keeps the tracking UX fully functional on Vercel.

## Project Structure

```
├── prisma/
│   ├── schema.prisma          # SQLite locally, PostgreSQL on Vercel
│   ├── seed.ts                # Core restaurants/menus
│   ├── seed-rbac.ts           # Roles + permissions + demo users
│   ├── seed-hyderabad.ts      # Hyderabad restaurants
│   └── seed-links.ts          # User↔Rider/Restaurant links
├── scripts/
│   ├── build.sh               # Vercel build script
│   └── seed.sh                # Run all seeds
├── src/
│   ├── app/
│   │   ├── api/               # REST + AI + admin APIs
│   │   ├── page.tsx           # Main SPA (all views)
│   │   └── layout.tsx
│   ├── components/food/       # All UI components
│   └── lib/                   # Auth, RBAC, store, geo, types
├── vercel.json
├── .env.example
└── next.config.ts
```

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | Neon PostgreSQL pooled connection string |
| `ZAI_BASE_URL` | For AI | `https://internal-api.z.ai/v1` |
| `ZAI_API_KEY` | For AI | Your Z.AI API key |
| `ZAI_CHAT_ID` | Optional | Z.AI chat ID |
| `ZAI_TOKEN` | Optional | Z.AI token |
| `ZAI_USER_ID` | Optional | Z.AI user ID |

Without the `ZAI_*` vars, the app builds and runs fine — only the AI chatbot and smart search features are disabled (they return friendly errors).
