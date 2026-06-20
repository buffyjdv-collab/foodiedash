# Task 4+5 — Upgrade admin RidersModule + RestaurantsModule to full CRUD with RBAC

## Summary

Replaced the read-only `RestaurantsModule`/`RestaurantsBody` and the placeholder `RidersModule`/`RidersBody` in `/home/z/my-project/src/components/food/admin-portal.tsx` with full CRUD surfaces that enforce particle-level RBAC on every action button.

## Files modified

- `/home/z/my-project/src/components/food/admin-portal.tsx` (2090 → 3748 lines; +1658 lines)

## Functions replaced

| Old | New |
|-----|-----|
| `RestaurantsModule` (read-only header) | `RestaurantsModule` (full CRUD with add dialog + reloadToken) |
| `RestaurantsBody` (read-only table with toast.info) | `RestaurantsBody` (CRUD table + Manage Menu button + dialogs) |
| `RidersModule` (placeholder) | `RidersModule` (full CRUD with add dialog + reloadToken) |
| `RidersBody` (coming soon card) | `RidersBody` (CRUD table + online toggle + dialogs) |

## New helper components

- `AddRestaurantDialog` — full form (name, description, cuisine, image, cost, delivery, fee, priceLevel select, pure-veg switch, address, city select, lat/lng)
- `EditRestaurantDialog` — same fields + isActive, isPromoted, offer; uses prevTarget pattern
- `DeleteRestaurantDialog` — AlertDialog confirmation
- `MenuSheet` — right-side Sheet (sm:max-w-2xl) with collapsible categories, items list with VegDot indicator, add category, add/edit/delete item, delete category
- `AddItemDialog` — name/desc/price/image/veg/bestseller/recommended/spice-level
- `EditItemDialog` — same + isAvailable switch; uses prevTarget pattern
- `AddRiderDialog` — name/phone/vehicle
- `EditRiderDialog` — name/phone/vehicle/isOnline; uses prevTarget pattern
- `DeleteRiderDialog` — AlertDialog confirmation
- `useCitiesFetcher(open)` — fetches `/api/admin/cities` when the dialog opens

## New interfaces

- `CityListItem` (id, name, state, isActive, restaurantCount)
- `RiderListItem` (id, name, phone, vehicle, rating, totalDeliveries, isOnline, createdAt)

## New imports

**Lucide icons**: `MapPin`, `Phone`, `UtensilsCrossed`, `ChevronRight`, `ChevronDown`, `Navigation`, `Package`

**shadcn UI**: `Textarea`, `Switch`, `Select` (+`SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue`), `Sheet` (+`SheetContent`, `SheetHeader`, `SheetTitle`, `SheetDescription`, `SheetFooter`, `SheetClose`), `AlertDialog` (+`AlertDialogContent`, `AlertDialogHeader`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogAction`, `AlertDialogCancel`), `ScrollArea`

**Types**: added `MenuCategory`, `MenuItem` to the existing `import type { Restaurant, Order, Coupon }` line.

## Particle-level RBAC enforcement

Every action button is gated by `canDo(user, '<permission>')`:

| Module | Action | Permission |
|--------|--------|------------|
| Restaurants | Add restaurant | `restaurants.create` |
| Restaurants | Edit restaurant | `restaurants.update` |
| Restaurants | Delete restaurant | `restaurants.delete` |
| Restaurants | Manage Menu (button) | `menus.read` |
| Menus | Add Category | `menus.create` |
| Menus | Add Item | `menus.create` |
| Menus | Edit Item | `menus.update` |
| Menus | Delete Item | `menus.delete` |
| Menus | Delete Category | `menus.delete` |
| Riders | Add rider | `riders.create` |
| Riders | Edit rider | `riders.update` |
| Riders | Delete rider | `riders.delete` |
| Riders | Toggle online (Switch) | `riders.update` |

When a user lacks all action permissions, the actions column shows a "—" placeholder instead of empty space.

## Patterns used

- `let mounted = true` + `.then().catch()` for all fetches (avoids `react-hooks/set-state-in-effect`).
- React "adjust state during render" prevTarget/prevTarget ref pattern for EditRestaurantDialog, EditRiderDialog, EditItemDialog, and MenuSheet's `displayed` (kept the last non-null restaurant so the close animation doesn't flash empty content).
- `key={reloadToken}` on RestaurantsBody/RidersBody to remount after mutations (same pattern as UsersBody).
- `reloadToken` pattern inside MenuSheet for menu refetches (after add/delete item/category).
- All dialogs controlled via `open` + `onOpenChange` props (no triggers) so they can be opened from table rows.
- AlertDialog for delete confirmations (rider, restaurant, menu item, menu category).

## API routes used (all pre-existing)

- `GET /api/admin/riders` → list riders (requires `riders.read`)
- `POST /api/admin/riders` → create rider (requires `riders.create`)
- `PATCH /api/admin/riders/[id]` → update rider (requires `riders.update`)
- `DELETE /api/admin/riders/[id]` → delete rider (requires `riders.delete`)
- `GET /api/restaurants` → list restaurants (public)
- `POST /api/admin/restaurants` → create restaurant (requires `restaurants.create`)
- `PATCH /api/admin/restaurants/[id]` → update restaurant (requires `restaurants.update`)
- `DELETE /api/admin/restaurants/[id]` → delete restaurant (requires `restaurants.delete`)
- `GET /api/admin/cities` → list cities (requires `restaurants.read`)
- `GET /api/admin/menu?restaurantId=...` → list menu (requires `menus.read`)
- `POST /api/admin/menu` → create category or item (requires `menus.create`)
- `DELETE /api/admin/menu/categories/[id]` → delete category (requires `menus.delete`)
- `PATCH /api/admin/menu/items/[id]` → update item (requires `menus.update`)
- `DELETE /api/admin/menu/items/[id]` → delete item (requires `menus.delete`)

## Verification

- `bun run lint`: 0 errors, 0 warnings.
- `bunx tsc --noEmit`: 0 errors in `admin-portal.tsx` (errors only in pre-existing unrelated files: `profile.tsx`, `restaurant-detail.tsx`, `examples/`, `skills/`).
- Dev server compiled successfully (`dev.log` shows `✓ Compiled in` messages after the change).
- Did NOT start the dev server (per task instructions).
