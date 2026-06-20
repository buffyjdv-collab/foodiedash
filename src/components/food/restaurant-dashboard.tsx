'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  Store,
  Star,
  MapPin,
  TrendingUp,
  ShoppingBag,
  CheckCircle2,
  XCircle,
  Receipt,
  IndianRupee,
  AlertCircle,
  RefreshCw,
  LogIn,
  Clock,
  Utensils,
  Pencil,
  Flame,
  ListOrdered,
  ShieldAlert,
  ChefHat,
  Check,
  ChevronRight,
} from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { useAuthStore } from '@/lib/auth-store'
import { useFoodStore } from '@/lib/store'
import { formatINR, timeAgo, formatCount } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Order } from '@/lib/types'

// ---------------------------------------------------------------------------
// Types (mirror of /api/restaurant-portal/dashboard payload)
// ---------------------------------------------------------------------------

interface RestaurantDTO {
  id: string
  name: string
  slug: string
  cuisine: string
  imageUrl: string
  rating: number
  ratingCount: number
  isActive: boolean
  isPromoted: boolean
  costForTwo: number
  deliveryTime: number
  address: string
  city: string | null
}

interface RestaurantStats {
  activeOrders: number
  todayOrders: number
  todayRevenue: number
  totalCompleted: number
  cancelledOrders: number
  totalRevenue: number
  avgOrderValue: number
  totalMenuItems: number
  availableItems: number
}

interface MenuCategoryDTO {
  id: string
  name: string
  itemCount: number
}

interface DashboardData {
  restaurant: RestaurantDTO
  stats: RestaurantStats
  activeOrders: Order[]
  recentOrders: Order[]
  menuCategories: MenuCategoryDTO[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function statusBadge(status: string): { className: string; label: string } {
  switch (status) {
    case 'DELIVERED':
      return {
        className: 'bg-green-100 text-green-700 border-green-200',
        label: 'Delivered',
      }
    case 'CANCELLED':
      return {
        className: 'bg-red-100 text-red-700 border-red-200',
        label: 'Cancelled',
      }
    default:
      return {
        className: 'bg-primary/10 text-primary border-primary/20',
        label:
          status.charAt(0) + status.slice(1).toLowerCase().replace('_', ' '),
      }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
}

// Kitchen display timeline steps.
// Each step maps to one or more order statuses. The "current step" is the
// highest completed step for the order.
const TIMELINE_STEPS: { label: string; statuses: string[] }[] = [
  { label: 'Placed', statuses: ['PLACED'] },
  { label: 'Accepted', statuses: ['ACCEPTED'] },
  { label: 'Preparing', statuses: ['PREPARING'] },
  { label: 'Ready', statuses: ['READY'] },
  {
    label: 'Dispatched',
    statuses: ['ASSIGNED', 'PICKED_UP', 'ON_ROUTE'],
  },
]

function currentStepIndex(status: string): number {
  for (let i = TIMELINE_STEPS.length - 1; i >= 0; i--) {
    if (TIMELINE_STEPS[i].statuses.includes(status)) return i
  }
  // Fallback for unknown / late-stage statuses (e.g. DELIVERED) → all done.
  if (status === 'DELIVERED') return TIMELINE_STEPS.length - 1
  return 0
}

// ---------------------------------------------------------------------------
// Access denied card
// ---------------------------------------------------------------------------

function AccessDenied({
  title,
  description,
  showSignIn,
}: {
  title: string
  description: string
  showSignIn: boolean
}) {
  const setLoginOpen = useAuthStore((s) => s.setLoginOpen)
  return (
    <Card className="rounded-2xl">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-3">
        <div className="rounded-full bg-primary/10 p-4">
          <AlertCircle className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            {description}
          </p>
        </div>
        {showSignIn && (
          <Button onClick={() => setLoginOpen(true)}>
            <LogIn className="h-4 w-4" /> Sign in
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function RestaurantDashboardSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-32 rounded-2xl" />
      <Skeleton className="h-36 rounded-2xl" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-2xl" />
      <Skeleton className="h-56 rounded-2xl" />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Stat tile
// ---------------------------------------------------------------------------

function StatTile({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Store
  label: string
  value: string
  hint?: string
}) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </span>
          <div className="rounded-lg bg-primary/10 p-1.5">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        </div>
        <p className="text-2xl font-bold tabular-nums">{value}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Timeline (kitchen display)
// ---------------------------------------------------------------------------

function OrderTimeline({ status }: { status: string }) {
  const currentIdx = currentStepIndex(status)
  return (
    <ol className="flex items-center gap-1 sm:gap-2">
      {TIMELINE_STEPS.map((step, idx) => {
        const isDone = idx < currentIdx
        const isCurrent = idx === currentIdx
        const isLast = idx === TIMELINE_STEPS.length - 1
        return (
          <li key={step.label} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center gap-1 min-w-0">
              <span
                className={cn(
                  'flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full text-[10px] font-bold border-2 transition-colors',
                  isDone && 'bg-primary border-primary text-primary-foreground',
                  isCurrent &&
                    'bg-primary/10 border-primary text-primary ring-2 ring-primary/20',
                  !isDone &&
                    !isCurrent &&
                    'bg-muted border-muted-foreground/30 text-muted-foreground'
                )}
                aria-label={`${step.label} ${
                  isDone ? 'completed' : isCurrent ? 'in progress' : 'pending'
                }`}
              >
                {isDone ? (
                  <Check className="h-3 w-3" />
                ) : (
                  idx + 1
                )}
              </span>
              <span
                className={cn(
                  'text-[10px] font-medium truncate',
                  isDone || isCurrent
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                )}
              >
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div
                className={cn(
                  'flex-1 h-0.5 mx-1 -mt-4 rounded',
                  idx < currentIdx
                    ? 'bg-primary'
                    : 'bg-muted-foreground/20'
                )}
                aria-hidden
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}

// ---------------------------------------------------------------------------
// Kitchen order card
// ---------------------------------------------------------------------------

function KitchenOrderCard({ order }: { order: Order }) {
  const badge = statusBadge(order.status)
  const currentIdx = currentStepIndex(order.status)

  const handleAction = (label: string, nextStatus: string) => {
    toast.info('Demo: would update status', {
      description: `Order ${order.orderCode} → ${nextStatus.replace('_', ' ')}`,
    })
  }

  // Decide which quick-action button (if any) to show.
  let action: { label: string; icon: typeof Check; next: string } | null = null
  if (order.status === 'PLACED') {
    action = { label: 'Accept', icon: Check, next: 'ACCEPTED' }
  } else if (order.status === 'ACCEPTED') {
    action = { label: 'Mark Preparing', icon: ChefHat, next: 'PREPARING' }
  } else if (order.status === 'PREPARING') {
    action = { label: 'Mark Ready', icon: CheckCircle2, next: 'READY' }
  }

  return (
    <Card className="rounded-2xl h-full hover:shadow-md transition-shadow overflow-hidden">
      <CardContent className="p-4 flex flex-col gap-3">
        {/* header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-mono text-xs text-muted-foreground">
                {order.orderCode}
              </p>
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase',
                  currentIdx <= 1
                    ? 'bg-amber-100 text-amber-700'
                    : currentIdx === 2
                      ? 'bg-primary/15 text-primary'
                      : 'bg-blue-100 text-blue-700'
                )}
              >
                <Clock className="h-2.5 w-2.5" />
                {timeAgo(order.createdAt)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {order.items.length} item
              {order.items.length !== 1 ? 's' : ''} ·{' '}
              <span className="font-semibold text-foreground tabular-nums">
                {formatINR(order.total)}
              </span>
            </p>
          </div>
          <Badge variant="outline" className={cn('shrink-0', badge.className)}>
            {badge.label}
          </Badge>
        </div>

        {/* items */}
        <ul className="space-y-1 rounded-xl bg-muted/40 p-3 text-sm">
          {order.items.map((it, i) => (
            <li
              key={i}
              className="flex items-center justify-between gap-2"
            >
              <span className="flex items-center gap-2 min-w-0">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-primary/15 text-[10px] font-bold text-primary shrink-0">
                  {it.quantity}
                </span>
                <span className="truncate">{it.name}</span>
              </span>
              <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                {formatINR(it.total)}
              </span>
            </li>
          ))}
        </ul>

        {/* timeline */}
        <OrderTimeline status={order.status} />

        {/* quick action */}
        {action && (
          <Button
            size="sm"
            className="w-full"
            onClick={() => handleAction(action!.label, action!.next)}
          >
            <action.icon className="h-3.5 w-3.5" /> {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function RestaurantDashboard() {
  const user = useAuthStore((s) => s.user)
  const authLoading = useAuthStore((s) => s.loading)
  const isRestaurant = useAuthStore((s) => s.isRestaurant)
  const isAdmin = useAuthStore((s) => s.isAdmin)
  const openRestaurant = useFoodStore((s) => s.openRestaurant)

  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (authLoading) return
    if (!user) return
    if (!isRestaurant() && !isAdmin()) return
    let mounted = true
    fetch('/api/restaurant-portal/dashboard', { cache: 'no-store' })
      .then((r) => r.json())
      .then((payload) => {
        if (!mounted) return
        if (payload.success) {
          setData(payload as DashboardData)
          setError(null)
        } else {
          setError(payload.error || 'Failed to load restaurant dashboard')
        }
        setLoading(false)
      })
      .catch((e: unknown) => {
        if (!mounted) return
        setError(
          e instanceof Error ? e.message : 'Failed to load restaurant dashboard'
        )
        setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [user, authLoading, isRestaurant, isAdmin, reloadKey])

  const retry = () => {
    setLoading(true)
    setError(null)
    setReloadKey((k) => k + 1)
  }

  // ---- access control ----
  if (authLoading) return <RestaurantDashboardSkeleton />
  if (!user) {
    return (
      <AccessDenied
        title="Access denied"
        description="Please sign in with your restaurant owner or staff account to view the restaurant dashboard."
        showSignIn
      />
    )
  }
  if (!isRestaurant() && !isAdmin()) {
    return (
      <AccessDenied
        title="Restaurant role required"
        description="Your account doesn't have restaurant access. Contact an admin if you believe this is an error."
        showSignIn={false}
      />
    )
  }

  // ---- loading ----
  if (loading) return <RestaurantDashboardSkeleton />

  // ---- error ----
  if (error || !data) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <div className="rounded-full bg-destructive/10 p-3">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <p className="text-muted-foreground max-w-sm">
            {error || 'Restaurant dashboard is unavailable right now.'}
          </p>
          <Button variant="outline" onClick={retry}>
            <RefreshCw className="h-4 w-4" /> Try again
          </Button>
        </CardContent>
      </Card>
    )
  }

  const { restaurant, stats, activeOrders, recentOrders, menuCategories } =
    data
  const totalCategoryItems = menuCategories.reduce(
    (s, c) => s + c.itemCount,
    0
  )

  return (
    <motion.div
      className="space-y-4"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.06 } },
      }}
    >
      {/* -------------------------------------------------------------- */}
      {/* Page heading                                                   */}
      {/* -------------------------------------------------------------- */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-primary/10 p-2">
            <Store className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Restaurant Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              Monitor orders, update kitchen status, and track performance.
            </p>
          </div>
        </div>
      </motion.div>

      {/* -------------------------------------------------------------- */}
      {/* Restaurant profile header                                      */}
      {/* -------------------------------------------------------------- */}
      <motion.div variants={itemVariants}>
        <Card className="rounded-2xl">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {/* thumbnail */}
              <div className="relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-2xl border bg-muted">
                <img
                  src={restaurant.imageUrl}
                  alt={restaurant.name}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-semibold truncate">
                    {restaurant.name}
                  </h2>
                  {restaurant.isActive ? (
                    <Badge className="bg-green-100 text-green-700 border-green-200 border">
                      Active
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="bg-muted text-muted-foreground"
                    >
                      Inactive
                    </Badge>
                  )}
                  {restaurant.isPromoted && (
                    <Badge className="bg-amber-100 text-amber-700 border-amber-200 border">
                      <Flame className="h-3 w-3" /> Promoted
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {restaurant.cuisine}
                </p>
                <div className="mt-1 flex flex-col sm:flex-row sm:items-center sm:gap-4 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="font-medium text-foreground">
                      {restaurant.rating.toFixed(1)}
                    </span>
                    <span className="text-xs">
                      ({formatCount(restaurant.ratingCount)} ratings)
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="truncate">
                      {restaurant.address}
                      {restaurant.city ? `, ${restaurant.city}` : ''}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {restaurant.deliveryTime} min
                  </span>
                </div>
              </div>

              <div className="flex gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    toast.info('Manage full menu', {
                      description:
                        'Available in Admin Portal > Restaurants.',
                    })
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit menu
                </Button>
                <Button
                  size="sm"
                  onClick={() => openRestaurant(restaurant.slug)}
                >
                  View store
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* -------------------------------------------------------------- */}
      {/* Today's performance card (orange gradient)                     */}
      {/* -------------------------------------------------------------- */}
      <motion.div variants={itemVariants}>
        <div className="relative overflow-hidden rounded-2xl p-5 text-primary-foreground shadow-md bg-gradient-to-br from-primary to-orange-600">
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-4 bottom-0 h-20 w-20 rounded-full bg-white/10"
            aria-hidden
          />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide opacity-90">
                <TrendingUp className="h-3.5 w-3.5" /> Today&apos;s Revenue
              </p>
              <p className="mt-1 text-3xl font-bold tabular-nums">
                {formatINR(stats.todayRevenue)}
              </p>
              <p className="text-xs opacity-80 mt-1">
                From {stats.todayOrders} order
                {stats.todayOrders !== 1 ? 's' : ''} placed today
              </p>
            </div>
            <div className="flex gap-4 sm:gap-6">
              <div>
                <p className="inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide opacity-80">
                  <ShoppingBag className="h-3 w-3" /> Today
                </p>
                <p className="text-lg font-bold tabular-nums">
                  {stats.todayOrders}
                </p>
              </div>
              <div>
                <p className="inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide opacity-80">
                  <IndianRupee className="h-3 w-3" /> Avg
                </p>
                <p className="text-lg font-bold tabular-nums">
                  {formatINR(stats.avgOrderValue)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* -------------------------------------------------------------- */}
      {/* Stats grid — first row                                         */}
      {/* -------------------------------------------------------------- */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        <StatTile
          icon={ShoppingBag}
          label="Active"
          value={String(stats.activeOrders)}
          hint="In kitchen"
        />
        <StatTile
          icon={CheckCircle2}
          label="Completed"
          value={String(stats.totalCompleted)}
          hint="All time"
        />
        <StatTile
          icon={IndianRupee}
          label="Avg Order"
          value={formatINR(stats.avgOrderValue)}
          hint="Per order"
        />
        <StatTile
          icon={TrendingUp}
          label="Total Revenue"
          value={formatINR(stats.totalRevenue)}
          hint="All time"
        />
      </motion.div>

      {/* -------------------------------------------------------------- */}
      {/* Stats grid — second row                                        */}
      {/* -------------------------------------------------------------- */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        <StatTile
          icon={XCircle}
          label="Cancelled"
          value={String(stats.cancelledOrders)}
          hint="All time"
        />
        <StatTile
          icon={Utensils}
          label="Menu Items"
          value={String(stats.totalMenuItems)}
          hint="Total"
        />
        <StatTile
          icon={Check}
          label="Available"
          value={String(stats.availableItems)}
          hint="Online now"
        />
        <StatTile
          icon={Star}
          label="Rating"
          value={restaurant.rating.toFixed(1)}
          hint={`${formatCount(restaurant.ratingCount)} ratings`}
        />
      </motion.div>

      {/* -------------------------------------------------------------- */}
      {/* Active orders (kitchen display)                                */}
      {/* -------------------------------------------------------------- */}
      <motion.div variants={itemVariants}>
        <Card className="rounded-2xl">
          <CardContent className="p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold inline-flex items-center gap-2">
                <ChefHat className="h-4 w-4 text-primary" /> Active Orders
              </h3>
              <Badge variant="secondary">{activeOrders.length}</Badge>
            </div>

            {activeOrders.length === 0 ? (
              <div className="rounded-xl border border-dashed p-8 text-center">
                <div className="mx-auto mb-3 w-fit rounded-full bg-primary/10 p-3">
                  <Receipt className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm font-medium">No active orders</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                  New orders from customers will show up here automatically.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {activeOrders.map((order) => (
                  <KitchenOrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* -------------------------------------------------------------- */}
      {/* Recent orders table                                            */}
      {/* -------------------------------------------------------------- */}
      <motion.div variants={itemVariants}>
        <Card className="rounded-2xl">
          <CardContent className="p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold inline-flex items-center gap-2">
                <Receipt className="h-4 w-4 text-primary" /> Recent Orders
              </h3>
              <span className="text-xs text-muted-foreground">
                Last {recentOrders.length} orders
              </span>
            </div>

            {recentOrders.length === 0 ? (
              <div className="rounded-xl border border-dashed p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No recent orders yet.
                </p>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Items</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">When</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentOrders.map((order) => {
                        const badge = statusBadge(order.status)
                        const itemCount = order.items.reduce(
                          (s, it) => s + it.quantity,
                          0
                        )
                        return (
                          <TableRow key={order.id}>
                            <TableCell className="font-mono text-xs">
                              {order.orderCode}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={badge.className}
                              >
                                {badge.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {itemCount}
                            </TableCell>
                            <TableCell className="text-right font-semibold tabular-nums">
                              {formatINR(order.total)}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {timeAgo(order.createdAt)}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile list */}
                <ul className="md:hidden divide-y">
                  {recentOrders.map((order) => {
                    const badge = statusBadge(order.status)
                    const itemCount = order.items.reduce(
                      (s, it) => s + it.quantity,
                      0
                    )
                    return (
                      <li
                        key={order.id}
                        className="py-3 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-muted-foreground">
                              {order.orderCode}
                            </span>
                            <Badge
                              variant="outline"
                              className={badge.className}
                            >
                              {badge.label}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {itemCount} item{itemCount !== 1 ? 's' : ''} ·{' '}
                            {timeAgo(order.createdAt)}
                          </p>
                        </div>
                        <span className="font-bold tabular-nums">
                          {formatINR(order.total)}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* -------------------------------------------------------------- */}
      {/* Menu summary                                                   */}
      {/* -------------------------------------------------------------- */}
      <motion.div variants={itemVariants}>
        <Card className="rounded-2xl">
          <CardContent className="p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold inline-flex items-center gap-2">
                <ListOrdered className="h-4 w-4 text-primary" /> Menu Categories
              </h3>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  toast.info('Manage full menu', {
                    description:
                      'Available in Admin Portal > Restaurants.',
                  })
                }
              >
                <Pencil className="h-3.5 w-3.5" /> Manage full menu
              </Button>
            </div>

            {menuCategories.length === 0 ? (
              <div className="rounded-xl border border-dashed p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No menu categories yet.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>
                    {menuCategories.length} categor
                    {menuCategories.length !== 1 ? 'ies' : 'y'}
                  </span>
                  <span aria-hidden>·</span>
                  <span>{totalCategoryItems} items total</span>
                </div>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {menuCategories.map((cat) => (
                    <li
                      key={cat.id}
                      className="flex items-center justify-between gap-2 rounded-xl border bg-card p-3"
                    >
                      <span className="inline-flex items-center gap-2 min-w-0">
                        <span className="rounded-lg bg-primary/10 p-1.5 shrink-0">
                          <Utensils className="h-3.5 w-3.5 text-primary" />
                        </span>
                        <span className="font-medium truncate">
                          {cat.name}
                        </span>
                      </span>
                      <Badge variant="secondary" className="tabular-nums">
                        {cat.itemCount}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* -------------------------------------------------------------- */}
      {/* Admin-viewing hint                                             */}
      {/* -------------------------------------------------------------- */}
      {isAdmin() && !isRestaurant() && (
        <motion.div variants={itemVariants}>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              You&apos;re viewing the restaurant dashboard as a super admin.
              Quick-action buttons are demo-only — wire them to a status-update
              API to enable real kitchen workflow updates.
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
