# Task 8 — Admin Portal (RBAC)

**Agent:** full-stack-developer (admin portal)
**Task ID:** 8
**File created:** `src/components/food/admin-portal.tsx`

## What was built

A single `'use client'` component `AdminPortal` (~1500 lines) that demonstrates
**particle-level RBAC** for the Swiggy-clone admin portal.

### Access gates
- While auth is loading → skeleton.
- Not logged in → "Access denied" card with **Sign in** button → `setLoginOpen(true)`.
- Logged in but `!isAdmin()` (i.e. only CUSTOMER) → "Limited access" card with **Back to home** button → `setView('home')`.
- Else → full portal.

### Portal shell
- Sticky desktop sidebar (220px) + top bar ("Admin Portal" + role badge pills + "{N} permissions" pill).
- Mobile: sidebar collapses into a horizontal scrollable pill bar (uses `.no-scrollbar`).
- Module swap animated with framer-motion `AnimatePresence`.
- Active module is **derived** via `useMemo` (falls back to first visible module when the previously-active one disappears) — avoids `setState` in effect bodies.

### Particle-level gating (the whole point)
- **Module level:** `ADMIN_MODULES` filtered by `canDo(user, m.permission)`. Hidden modules are not rendered in the sidebar.
- **Action level:** Every action button (Add / Edit / Delete / Cancel / etc.) is gated by the specific permission (e.g. `users.update`, `orders.cancel`). Hidden when the user lacks the permission.
- **Visibility banner:** Every module shows `ParticleScopeBanner` — "You have X of Y actions in the {module} module (Z%)" — to make the particle-level nature obvious.

### Modules
| Module | Permission | Data source | Real mutations? |
|---|---|---|---|
| Overview | always visible | `GET /api/admin/stats` (handles 403 gracefully) | — |
| Users | `users.read` | `GET /api/admin/users` | Yes — POST/PATCH/DELETE |
| Roles & Permissions | `roles.read` | `GET /api/admin/roles` + `GET /api/admin/permissions` | Yes — PATCH `/api/admin/roles` |
| Restaurants | `restaurants.read` | `GET /api/restaurants` | Demo toast.info |
| Orders | `orders.read` | `GET /api/orders` | Demo toast.info (Cancel) |
| Riders | `riders.read` | best-effort stats fetch | Demo toast.info |
| Coupons | `coupons.read` | `GET /api/coupons` | Demo toast.info |
| Analytics | `analytics.read` | mock 7-day data | — |
| Settings | `settings.read` | static demo values | Demo toast.info (Edit buttons gated by `settings.update`) |
| Payments, Settlements, Campaigns, Reviews, Tickets | each `<mod>.read` | `GenericModuleShell` placeholder card | Demo toast.info (Create/Edit/Delete + any other non-read actions like `payments.process`, `settlements.process`, `notifications.send`, `tickets.resolve`, `reviews.moderate`) |

### Charts (recharts)
- Overview: BarChart for `ordersByStatus`, horizontal BarChart for `usersByRole`.
- Analytics: AreaChart (revenue trend, orange gradient fill), BarChart (order volume).

### Dialogs
- **AddUserDialog:** phone + name + email + role checkboxes → `POST /api/admin/users`.
- **EditRolesDialog:** role checkboxes pre-populated from user → `PATCH /api/admin/users { id, roles }`. Uses React-recommended "adjust state during render" pattern (no setState-in-effect).
- **EditPermissionsDialog:** full checklist of all PERMISSIONS grouped by module, with per-module All/None shortcuts → `PATCH /api/admin/roles { roleName, permissions }`. SUPER_ADMIN is locked.

### Conventions followed
- Orange Swiggy theme throughout (`bg-primary`, `bg-primary/10`, `text-primary`); NO indigo/blue.
- shadcn/ui New York components: Card, Button, Badge, Avatar, Tabs, Table, Dialog, Input, Label, Checkbox, Separator, Skeleton.
- `framer-motion` staggered entrance on KPI cards + `AnimatePresence` module swap.
- Loading skeletons + `ErrorCard` with Retry + 403 graceful handling.
- Accessible: `aria-label` on icon buttons, `aria-current` on active module, semantic `<header>/<aside>/<nav>/<main>`.
- Toasts via `sonner`.
- Avoided `react-hooks/set-state-in-effect` rule violations by:
  - Initializing `loading: true` via `useState` (not in effect).
  - All `setState` calls inside `.then()` / `.catch()` async callbacks.
  - "Adjust state during render" pattern for prop-synced dialog state.
  - `key={reloadToken}` remount pattern for refresh buttons.

## Verification
- `bun run lint`: **0 errors** in `src/components/food/admin-portal.tsx` (only a pre-existing warning in `prisma/seed-rbac.ts`).
- `bunx tsc --noEmit`: **0 errors** in `src/components/food/admin-portal.tsx` (errors only in unrelated pre-existing files).
- Dev server was NOT started (per instructions).
