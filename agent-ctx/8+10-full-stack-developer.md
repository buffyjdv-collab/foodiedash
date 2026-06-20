# Task 8+10 — full-stack-developer (tracking/orders/profile)

## Scope
Build three React view components for the Swiggy-clone Next.js 16 app:
1. Live Order Tracking view (`src/components/food/order-tracking.tsx`)
2. Orders History view (`src/components/food/orders-list.tsx`)
3. Profile / Wallet view (`src/components/food/profile.tsx`)

## What was built

### 1. `src/components/food/order-tracking.tsx`
- `'use client'`. Props: `{ orderId: string }`.
- On mount: fetches order from `GET /api/orders/[id]`, then connects to the
  tracking socket (`io('/', { path: '/', transports: ['websocket'], query:
  { XTransformPort: '3004' } })`) and emits `track-order` with restaurant +
  destination data derived from the fetched order.
- Listens for `tracking-init` and `tracking-update` → stores tracking state and
  calls `useFoodStore.updateOrderStatus(orderId, status, {name, phone})` to
  keep the orders list in sync. Also listens for `tracking-error`.
- Cleanup: emits `stop-tracking` and disconnects the socket.
- Layout: 2-column grid on `lg:` (map 3/5, info 2/5), stacked on mobile.
  - LEFT: stylized animated map (`.map-grid` background) with an SVG dashed
    bezier route from restaurant → destination, restaurant marker (HomeIcon in
    a white pill) and destination marker (MapPin in a white pill), and an
    animated rider marker (Bike icon, `rider-bounce` CSS class) moved along the
    bezier curve by `framer-motion` based on the rider's lat/lng progress.
    Includes a LIVE pulsing badge (top-left), an ETA chip (top-right), and a
    current-status banner (bottom). When DELIVERED the rider swaps to a
    CheckCircle2 icon at the destination; CANCELLED hides the rider.
  - RIGHT: order header card (code, restaurant name + cuisine, status badge,
    placed time + payment method), vertical timeline of all 8 lifecycle
    statuses (completed = green check + connector, current = pulsing orange
    dot, future = gray dot), rider card with avatar initials, name, rating,
    call button (`tel:` link), order summary (items list + totals:
    items/delivery/taxes/discount/tip/total), and a Reorder button (clears
    cart + `setView('home')` + toast).
- Loading skeleton + error state handled.
- Fully responsive + accessible (aria-labels on icon button, aria-current on
  timeline step).
- Resets state on `orderId` change using the React "adjust state during
  render" pattern to satisfy the `react-hooks/set-state-in-effect` rule.

### 2. `src/components/food/orders-list.tsx`
- `'use client'`. Fetches `GET /api/orders` and calls `setOrders` from the
  store.
- Loading skeleton (4 cards), error state, and friendly empty state with a
  "Browse restaurants" button (`setView('home')`).
- Responsive grid: 1 col mobile, 2 cols `md:`. Staggered entrance animation
  via framer-motion.
- Each card: restaurant name + cuisine, status badge (green=DELIVERED,
  orange=in-progress, red=CANCELLED), order code, `timeAgo(createdAt)`, item
  count, items summary (first 2 + "and N more"), total (`formatINR`), and
  Reorder + Track buttons (Track only shown for in-progress orders, calls
  `goToTracking(order.id)`).

### 3. `src/components/food/profile.tsx`
- `'use client'`. Fetches `GET /api/customer` → customer with addresses.
- Sections:
  1. Profile header card: avatar (initials), name + loyalty tier badge
     (Silver/Gold/Platinum based on points), phone, email, "Edit" button.
  2. Wallet card: orange gradient (`from-primary to-orange-600`) with
     decorative circles, balance in `formatINR`, "Add Money" button (toast).
  3. Loyalty card: points total, progress bar to next tier, "X pts to Y"
     helper text.
  4. Saved Addresses: list of addresses with Home icon, label, fullAddress,
     landmark; empty state with "Add address" CTA.
  5. Quick links grid (2x2 mobile, 1x4 desktop): My Orders (→ setView
     'orders'), Saved Restaurants, Help & Support, Settings (each a card with
     Lucide icon, toasts for placeholders).
- Loading skeleton + error state. Staggered entrance animations.

## Files created
- `/home/z/my-project/src/components/food/order-tracking.tsx`
- `/home/z/my-project/src/components/food/orders-list.tsx`
- `/home/z/my-project/src/components/food/orders-list.tsx` (edits)
- `/home/z/my-project/src/components/food/profile.tsx`

## Notes for downstream agents
- Tracking socket connection pattern (use this exact form):
  ```ts
  io('/', { path: '/', transports: ['websocket'], query: { XTransformPort: '3004' } })
  ```
- Tracking state shape (matches `mini-services/tracking-service/index.ts`):
  `{ orderId, status, rider?, restaurant, destination, timeline, startedAt, updatedAt }`.
- All three components are `'use client'` and self-contained — no parent
  wiring needed beyond placing them at the appropriate view slot.
- All lint passes for these three files (`bun run lint` is clean except for a
  pre-existing unused-eslint-disable warning in `prisma/seed.ts`).
