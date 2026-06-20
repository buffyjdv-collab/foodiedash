'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  Bike,
  Phone,
  Star,
  Truck,
  Package,
  CheckCircle2,
  Wallet,
  Navigation,
  AlertCircle,
  RefreshCw,
  LogIn,
  Coins,
  Banknote,
  Clock,
  MapPin,
  ShieldAlert,
  Receipt,
} from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
import { formatINR, timeAgo } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Order } from '@/lib/types'

// ---------------------------------------------------------------------------
// Types (mirror of the /api/rider/dashboard payload)
// ---------------------------------------------------------------------------

interface RiderDTO {
  id: string
  name: string
  phone: string
  vehicle: string
  rating: number
  isOnline: boolean
  totalDeliveries: number
}

interface RiderStats {
  activeDeliveries: number
  completedToday: number
  totalCompleted: number
  totalEarnings: number
  deliveryEarnings: number
  tipEarnings: number
}

interface DashboardData {
  rider: RiderDTO
  stats: RiderStats
  activeDeliveries: Order[]
  recentOrders: Order[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function initials(name: string): string {
  return (
    name
      .split(' ')
      .map((n) => n[0] || '')
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?'
  )
}

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

function RiderDashboardSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-32 rounded-2xl" />
      <Skeleton className="h-40 rounded-2xl" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-2xl" />
      <Skeleton className="h-48 rounded-2xl" />
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
  icon: typeof Truck
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
// Active delivery card
// ---------------------------------------------------------------------------

function ActiveDeliveryCard({ order }: { order: Order }) {
  const goToTracking = useFoodStore((s) => s.goToTracking)
  const badge = statusBadge(order.status)
  const itemCount = order.items.reduce((s, it) => s + it.quantity, 0)

  return (
    <Card className="rounded-2xl h-full hover:shadow-md transition-shadow">
      <CardContent className="p-5 flex flex-col gap-3">
        {/* header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-mono text-xs text-muted-foreground">
              {order.orderCode}
            </p>
            <h3 className="font-semibold truncate">
              {order.restaurant?.name ?? 'Restaurant'}
            </h3>
          </div>
          <Badge variant="outline" className={cn('shrink-0', badge.className)}>
            {badge.label}
          </Badge>
        </div>

        {/* pickup -> drop */}
        <div className="space-y-2 rounded-xl bg-muted/40 p-3">
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Pickup
              </p>
              <p className="truncate">
                {order.restaurant?.address ?? 'Restaurant address'}
              </p>
            </div>
          </div>
          <Separator />
          <div className="flex items-start gap-2 text-sm">
            <Navigation className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Drop
              </p>
              <p className="truncate">{order.addressLine}</p>
            </div>
          </div>
        </div>

        {/* meta row */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Package className="h-3.5 w-3.5" />
            {itemCount} item{itemCount !== 1 ? 's' : ''}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {timeAgo(order.createdAt)}
          </span>
          <span className="font-bold tabular-nums text-foreground">
            {formatINR(order.total)}
          </span>
        </div>

        <Button
          size="sm"
          className="w-full"
          onClick={() => goToTracking(order.id)}
        >
          <Navigation className="h-3.5 w-3.5" /> Track Order
        </Button>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function RiderDashboard() {
  const user = useAuthStore((s) => s.user)
  const authLoading = useAuthStore((s) => s.loading)
  const isRider = useAuthStore((s) => s.isRider)
  const isAdmin = useAuthStore((s) => s.isAdmin)

  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toggling, setToggling] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (authLoading) return
    if (!user) return
    if (!isRider() && !isAdmin()) return
    let mounted = true
    fetch('/api/rider/dashboard', { cache: 'no-store' })
      .then((r) => r.json())
      .then((payload) => {
        if (!mounted) return
        if (payload.success) {
          setData(payload as DashboardData)
          setError(null)
        } else {
          setError(payload.error || 'Failed to load rider dashboard')
        }
        setLoading(false)
      })
      .catch((e: unknown) => {
        if (!mounted) return
        setError(e instanceof Error ? e.message : 'Failed to load rider dashboard')
        setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [user, authLoading, isRider, isAdmin, reloadKey])

  const retry = () => {
    setLoading(true)
    setError(null)
    setReloadKey((k) => k + 1)
  }

  // ---- access control ----
  if (authLoading) return <RiderDashboardSkeleton />
  if (!user) {
    return (
      <AccessDenied
        title="Access denied"
        description="Please sign in with your delivery partner account to view the rider dashboard."
        showSignIn
      />
    )
  }
  if (!isRider() && !isAdmin()) {
    return (
      <AccessDenied
        title="Delivery Partner role required"
        description="Your account doesn't have delivery partner access. Contact an admin if you believe this is an error."
        showSignIn={false}
      />
    )
  }

  // ---- loading ----
  if (loading) return <RiderDashboardSkeleton />

  // ---- error ----
  if (error || !data) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <div className="rounded-full bg-destructive/10 p-3">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <p className="text-muted-foreground max-w-sm">
            {error || 'Rider dashboard is unavailable right now.'}
          </p>
          <Button variant="outline" onClick={retry}>
            <RefreshCw className="h-4 w-4" /> Try again
          </Button>
        </CardContent>
      </Card>
    )
  }

  const { rider, stats, activeDeliveries, recentOrders } = data

  const handleToggle = async (next: boolean) => {
    setToggling(true)
    try {
      const res = await fetch('/api/rider/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOnline: next }),
      })
      const payload = await res.json()
      if (payload.success) {
        setData((prev) =>
          prev ? { ...prev, rider: { ...prev.rider, isOnline: next } } : prev
        )
        toast.success(
          next ? 'You are now online' : 'You are now offline',
          {
            description: next
              ? 'Accepting new delivery requests'
              : 'No longer accepting deliveries',
          }
        )
      } else {
        toast.error(payload.error || 'Failed to update status')
      }
    } catch (e: unknown) {
      toast.error(
        e instanceof Error ? e.message : 'Failed to update status'
      )
    } finally {
      setToggling(false)
    }
  }

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
            <Bike className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Rider Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              Track deliveries, manage earnings, and stay on schedule.
            </p>
          </div>
        </div>
      </motion.div>

      {/* -------------------------------------------------------------- */}
      {/* Profile header + online/offline toggle                         */}
      {/* -------------------------------------------------------------- */}
      <motion.div variants={itemVariants}>
        <Card className="rounded-2xl">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <Avatar className="h-16 w-16 border shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                  {initials(rider.name)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-semibold truncate">
                    {rider.name}
                  </h2>
                  <Badge
                    variant="outline"
                    className={cn(
                      'shrink-0',
                      rider.isOnline
                        ? 'bg-green-100 text-green-700 border-green-200'
                        : 'bg-muted text-muted-foreground border-border'
                    )}
                  >
                    <span
                      className={cn(
                        'h-1.5 w-1.5 rounded-full',
                        rider.isOnline ? 'bg-green-500' : 'bg-muted-foreground'
                      )}
                      aria-hidden
                    />
                    {rider.isOnline
                      ? 'Online — accepting deliveries'
                      : 'Offline'}
                  </Badge>
                </div>
                <div className="mt-1 flex flex-col sm:flex-row sm:items-center sm:gap-4 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" />
                    {rider.phone}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Bike className="h-3.5 w-3.5" />
                    {rider.vehicle}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    {rider.rating.toFixed(1)} rating
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Truck className="h-3.5 w-3.5" />
                    {rider.totalDeliveries} deliveries
                  </span>
                </div>
              </div>

              {/* Online / Offline toggle */}
              <div className="flex items-center gap-3 rounded-xl border bg-card p-3 shrink-0">
                <div className="text-right">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Availability
                  </p>
                  <p
                    className={cn(
                      'text-sm font-semibold',
                      rider.isOnline ? 'text-green-700' : 'text-muted-foreground'
                    )}
                  >
                    {rider.isOnline ? 'Online' : 'Offline'}
                  </p>
                </div>
                <Switch
                  checked={rider.isOnline}
                  disabled={toggling}
                  onCheckedChange={handleToggle}
                  aria-label="Toggle online status"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* -------------------------------------------------------------- */}
      {/* Earnings card (orange gradient)                                */}
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
                <Wallet className="h-3.5 w-3.5" /> Total Earnings
              </p>
              <p className="mt-1 text-3xl font-bold tabular-nums">
                {formatINR(stats.totalEarnings)}
              </p>
              <p className="text-xs opacity-80 mt-1">
                Completed today: {stats.completedToday}
              </p>
            </div>
            <div className="flex gap-4 sm:gap-6">
              <div>
                <p className="inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide opacity-80">
                  <Banknote className="h-3 w-3" /> Delivery
                </p>
                <p className="text-lg font-bold tabular-nums">
                  {formatINR(stats.deliveryEarnings)}
                </p>
              </div>
              <div>
                <p className="inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide opacity-80">
                  <Coins className="h-3 w-3" /> Tips
                </p>
                <p className="text-lg font-bold tabular-nums">
                  {formatINR(stats.tipEarnings)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* -------------------------------------------------------------- */}
      {/* Stats grid (2x2 mobile, 4-col desktop)                         */}
      {/* -------------------------------------------------------------- */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        <StatTile
          icon={Truck}
          label="Active"
          value={String(stats.activeDeliveries)}
          hint="In progress"
        />
        <StatTile
          icon={CheckCircle2}
          label="Today"
          value={String(stats.completedToday)}
          hint="Deliveries"
        />
        <StatTile
          icon={Package}
          label="Total"
          value={String(stats.totalCompleted)}
          hint="Completed"
        />
        <StatTile
          icon={Star}
          label="Rating"
          value={rider.rating.toFixed(1)}
          hint={`${rider.totalDeliveries} deliveries`}
        />
      </motion.div>

      {/* -------------------------------------------------------------- */}
      {/* Active deliveries                                              */}
      {/* -------------------------------------------------------------- */}
      <motion.div variants={itemVariants}>
        <Card className="rounded-2xl">
          <CardContent className="p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold inline-flex items-center gap-2">
                <Navigation className="h-4 w-4 text-primary" /> Active Deliveries
              </h3>
              <Badge variant="secondary">{activeDeliveries.length}</Badge>
            </div>

            {activeDeliveries.length === 0 ? (
              <div className="rounded-xl border border-dashed p-8 text-center">
                <div className="mx-auto mb-3 w-fit rounded-full bg-primary/10 p-3">
                  <Bike className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm font-medium">No active deliveries</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                  Go online to start receiving orders. New assignments will
                  appear here in real time.
                </p>
                {!rider.isOnline && (
                  <Button
                    size="sm"
                    className="mt-4"
                    onClick={() => handleToggle(true)}
                    disabled={toggling}
                  >
                    <Bike className="h-3.5 w-3.5" /> Go online
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {activeDeliveries.map((order) => (
                  <ActiveDeliveryCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* -------------------------------------------------------------- */}
      {/* Recent orders                                                  */}
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
                        <TableHead>Restaurant</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">When</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentOrders.map((order) => {
                        const badge = statusBadge(order.status)
                        return (
                          <TableRow key={order.id}>
                            <TableCell className="font-mono text-xs">
                              {order.orderCode}
                            </TableCell>
                            <TableCell className="font-medium">
                              {order.restaurant?.name ?? 'Restaurant'}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={badge.className}
                              >
                                {badge.label}
                              </Badge>
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
                          <p className="text-sm font-medium truncate mt-0.5">
                            {order.restaurant?.name ?? 'Restaurant'}
                          </p>
                          <p className="text-xs text-muted-foreground">
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
      {/* Admin-viewing hint                                             */}
      {/* -------------------------------------------------------------- */}
      {isAdmin() && !isRider() && (
        <motion.div variants={itemVariants}>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              You&apos;re viewing the rider dashboard as a super admin. Some
              actions (e.g. status updates) operate on the demo rider profile.
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
