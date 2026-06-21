# Task 4+6 — Order Lifecycle Frontend (Restaurant + Rider dashboards + Feedback UI)

## Task
Wire restaurant + rider dashboards to real status API (`PATCH /api/orders/[id]/status`), build a post-delivery feedback dialog (`POST /api/orders/[id]/feedback`), and integrate it into the customer orders list.

## Files Modified

### `src/components/food/restaurant-dashboard.tsx`
- Added imports: `Loader2`, `Ban` (lucide), `AlertDialog*` (shadcn).
- `KitchenOrderCard` now accepts `onUpdate: (orderId: string, newStatus: string) => Promise<boolean>` prop.
- Replaced the `toast.info('Demo: would update status')` stub with a real `handleAction` that calls `onUpdate` and shows a context-aware success toast:
  - PLACED → "Accept" → ACCEPTED → "Order accepted"
  - ACCEPTED → "Mark Preparing" → PREPARING → "Order is being prepared"
  - PREPARING → "Mark Ready" → READY → "Order marked ready — rider assigned automatically!"
- Added a small destructive **Reject** button (PLACED only) that opens an AlertDialog; confirming PATCHes `CANCELLED` → "Order rejected".
- Buttons show `Loader2` spinner + disabled state while in-flight.
- Added `updateOrderStatus(orderId, newStatus)` helper in `RestaurantDashboard`:
  - PATCHes `/api/orders/[id]/status`
  - 403 → toast "You don't have permission to update order status"
  - 401 → "Please sign in again to continue."
  - payload.error → toast.error
  - On success → bumps `reloadKey` to refetch the dashboard (activeOrders list refreshes).
- Removed the only `bg-blue-100 text-blue-700` chip (compliance with NO-blue rule).
- Passed `onUpdate={updateOrderStatus}` to every `KitchenOrderCard`.

### `src/components/food/rider-dashboard.tsx`
- Added `Loader2` import.
- `ActiveDeliveryCard` now accepts `onUpdate` prop and renders a context-aware primary button above the existing Track button:
  - ASSIGNED → "Pick Up Order" (Package icon) → PICKED_UP → "Order picked up! Head to the customer."
  - PICKED_UP → "Start Delivery" (Navigation icon) → ON_ROUTE → "Delivery started! Customer can track you live."
  - ON_ROUTE → "Mark Delivered" (CheckCircle2 icon, green variant) → DELIVERED → "Order delivered! 🎉"
- Spinner + disabled state on the primary action; Track button kept as outline variant below.
- Added `updateOrderStatus` helper (same pattern as restaurant dashboard).
- Passed `onUpdate={updateOrderStatus}` to every `ActiveDeliveryCard`.

### `src/components/food/orders-list.tsx`
- Extracted the inlined motion card into a dedicated `OrderCard` component (per-card state).
- Added imports: `Star`, `Check`, `Loader2`, `FeedbackDialog`.
- For DELIVERED orders: shows a "Rate Order" button (outline, orange). On click, fetches `GET /api/orders/[id]/feedback`:
  - If feedback exists → flip to "✓ Rated" green Badge (Check icon).
  - If not → open the `FeedbackDialog`.
  - Network error → still open the dialog (server re-validates on submit).
- After successful submission → `onSubmitted` callback sets `rated=true` → card flips to "✓ Rated".
- Existing Reorder + Track buttons untouched.

## Files Created

### `src/components/food/feedback-dialog.tsx` (NEW)
Exports `FeedbackDialog({ orderId, open, onOpenChange, onSubmitted })`.

- `'use client'` component, orange theme.
- Three star-rating groups: 🍔 Food Quality, 🍽️ Restaurant, 🛵 Delivery.
- `StarRating` sub-component:
  - lucide `Star` icons (h-7 w-7).
  - Selected stars: `fill-primary text-primary`.
  - Unselected: `fill-muted text-muted-foreground/40`.
  - Hover state (mouse enter/leave), keyboard Enter/Space support.
  - `role="radiogroup"` + `role="radio"` + `aria-checked` + `aria-label` ("1 star"…"5 stars").
  - Live tabular-nums readout (1.0–5.0 or "—") with `aria-live="polite"`.
- Optional comment `Textarea` (max 500 chars, with X/500 counter).
- Submit button POSTs `/api/orders/[orderId]/feedback` with `{ foodRating, restaurantRating, deliveryRating, comment? }`.
  - Disabled until all 3 ratings > 0.
  - Loading state with `Loader2` spinner.
  - Error handling: 403, 401, 409/`/already/i` ("Feedback already submitted"), generic `payload.error`.
  - On success: toast "Thanks for your feedback!" + close dialog + `onSubmitted()` callback.
- State resets 200ms after close (avoids visual flash).

## API endpoints used (all pre-existing — none created)
- `PATCH /api/orders/[id]/status` `{ status, prepTime? }` — kitchen/rider status transitions.
- `POST /api/orders/[id]/feedback` `{ foodRating, restaurantRating, deliveryRating, comment? }`.
- `GET /api/orders/[id]/feedback` — check if already rated.
- `GET /api/restaurant-portal/dashboard` (existing fetch in RestaurantDashboard).
- `GET /api/rider/dashboard` (existing fetch in RiderDashboard).

## Patterns followed
- All async fetches inside `useEffect` use the `let mounted = true` + `.then()/.catch()` pattern (no setState in effect bodies).
- The on-click feedback-check in `OrderCard` is a one-shot promise chain (no effect) — also no synchronous setState in any effect body.
- Reload-after-update uses the existing `reloadKey` counter pattern in both dashboards.
- Orange theme throughout (`bg-primary`, `primary/10` tints, `fill-primary` stars). NO indigo/blue.
- Accessible: aria-labels on stars and reject button, role="radiogroup"/"radio" on star ratings, sr descriptions in AlertDialog, focus-visible rings on stars.

## Verification
- `bun run lint` → 0 errors, 0 warnings. ✅
- `bunx tsc --noEmit` → no errors in any of the 4 modified/created files (remaining errors are pre-existing in unrelated files: profile.tsx, restaurant-detail.tsx, examples/, skills/). ✅
- Did NOT start the dev server (per task instructions).
