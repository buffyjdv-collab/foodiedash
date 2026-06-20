'use client'

import { useEffect, useRef, useState } from 'react'
import { io, type Socket } from 'socket.io-client'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  Bike,
  Phone,
  Star,
  CheckCircle2,
  Clock,
  MapPin,
  RotateCcw,
  X,
  Navigation2,
  Home as HomeIcon,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useFoodStore } from '@/lib/store'
import { formatINR, timeAgo } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Order } from '@/lib/types'

// ---------------------------------------------------------------------------
// Tracking state shape returned by the websocket service
// ---------------------------------------------------------------------------

interface TrackingTimelineItem {
  status: string
  at: string
  label: string
}

interface TrackingState {
  orderId: string
  status: string
  rider?: { name: string; phone: string; lat: number; lng: number }
  restaurant: { name: string; lat: number; lng: number }
  destination: { lat: number; lng: number; address: string }
  timeline: TrackingTimelineItem[]
  startedAt: number
  updatedAt: number
}

const STATUS_FLOW = [
  'PLACED',
  'ACCEPTED',
  'PREPARING',
  'READY',
  'ASSIGNED',
  'PICKED_UP',
  'ON_ROUTE',
  'DELIVERED',
] as const

const STATUS_LABELS: Record<string, string> = {
  PLACED: 'Order placed',
  ACCEPTED: 'Restaurant accepted your order',
  PREPARING: 'Your food is being prepared',
  READY: 'Order is ready for pickup',
  ASSIGNED: 'Delivery partner assigned',
  PICKED_UP: 'Delivery partner picked up your order',
  ON_ROUTE: 'On the way to you',
  DELIVERED: 'Order delivered. Enjoy your meal!',
  CANCELLED: 'Order cancelled',
}

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

// ---------------------------------------------------------------------------
// Map geometry: stylized SVG bezier route from restaurant -> destination.
// Coordinate system is 0..100 for both x and y so the SVG can use
// preserveAspectRatio="none" and the rider marker (absolutely positioned
// using percent) lines up with the path.
// ---------------------------------------------------------------------------

const P0 = { x: 14, y: 26 } // restaurant (top-left)
const P1 = { x: 70, y: 12 } // bezier control point (curves up)
const P2 = { x: 88, y: 78 } // destination (bottom-right)

function bezierPoint(t: number): { x: number; y: number } {
  const mt = 1 - t
  const x = mt * mt * P0.x + 2 * mt * t * P1.x + t * t * P2.x
  const y = mt * mt * P0.y + 2 * mt * t * P1.y + t * t * P2.y
  return { x, y }
}

function geoDist(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  return Math.hypot(a.lat - b.lat, a.lng - b.lng)
}

function statusIndex(status: string): number {
  return STATUS_FLOW.indexOf(status as (typeof STATUS_FLOW)[number])
}

function etaMinutes(status: string, deliveryTime: number): number | null {
  const idx = statusIndex(status)
  if (idx < 0 || idx >= STATUS_FLOW.length - 1) return null
  const remaining = STATUS_FLOW.length - 1 - idx
  const fraction = remaining / (STATUS_FLOW.length - 1)
  return Math.max(2, Math.round(deliveryTime * fraction))
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'DELIVERED':
      return 'bg-green-100 text-green-700 border-green-200'
    case 'CANCELLED':
      return 'bg-red-100 text-red-700 border-red-200'
    default:
      return 'bg-primary/10 text-primary border-primary/20'
  }
}

function statusLabel(status: string): string {
  if (status === 'CANCELLED') return 'Cancelled'
  if (status === 'DELIVERED') return 'Delivered'
  return status.charAt(0) + status.slice(1).toLowerCase().replace('_', ' ')
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function OrderTracking({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<Order | null>(null)
  const [tracking, setTracking] = useState<TrackingState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const socketRef = useRef<Socket | null>(null)
  const updateOrderStatus = useFoodStore((s) => s.updateOrderStatus)
  const setView = useFoodStore((s) => s.setView)
  const clearCart = useFoodStore((s) => s.clearCart)

  // Reset state when orderId prop changes (React-recommended "adjust state
  // during render" pattern so the effect body never calls setState directly).
  const [prevOrderId, setPrevOrderId] = useState(orderId)
  if (orderId !== prevOrderId) {
    setPrevOrderId(orderId)
    setLoading(true)
    setError(null)
    setOrder(null)
    setTracking(null)
  }

  useEffect(() => {
    let mounted = true
    fetch(`/api/orders/${orderId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return
        if (!data.success) {
          setError(data.error || 'Order not found')
          setLoading(false)
          return
        }
        const fetchedOrder = data.order as Order
        setOrder(fetchedOrder)
        setLoading(false)

        // ---- connect socket & start tracking ----
        const socket = io('/', {
          path: '/',
          transports: ['websocket'],
          query: { XTransformPort: '3004' },
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        })
        socketRef.current = socket

        const emitTrack = () => {
          socket.emit('track-order', {
            orderId,
            restaurant: {
              name: fetchedOrder.restaurant?.name ?? 'Restaurant',
              lat: fetchedOrder.restaurant?.latitude ?? 12.9716,
              lng: fetchedOrder.restaurant?.longitude ?? 77.5946,
            },
            destination: {
              address: fetchedOrder.addressLine,
            },
          })
        }
        socket.on('connect', emitTrack)

        const handleUpdate = (state: TrackingState) => {
          setTracking(state)
          if (state.rider) {
            updateOrderStatus(orderId, state.status, {
              name: state.rider.name,
              phone: state.rider.phone,
            })
          } else {
            updateOrderStatus(orderId, state.status)
          }
        }
        socket.on('tracking-init', handleUpdate)
        socket.on('tracking-update', handleUpdate)
        socket.on('tracking-error', (e: { message?: string }) => {
          setError(e?.message || 'Tracking error')
        })
      })
      .catch((e: unknown) => {
        if (!mounted) return
        setError(e instanceof Error ? e.message : 'Failed to load order')
        setLoading(false)
      })

    return () => {
      mounted = false
      const s = socketRef.current
      if (s) {
        try {
          s.emit('stop-tracking', { orderId })
          s.disconnect()
        } catch {
          // ignore
        }
        socketRef.current = null
      }
    }
  }, [orderId, updateOrderStatus])

  // ---- derived state ----
  const currentStatus = tracking?.status ?? order?.status ?? 'PLACED'
  const currentIdx = statusIndex(currentStatus)
  const isCancelled = currentStatus === 'CANCELLED'
  const isDelivered = currentStatus === 'DELIVERED'
  const showRiderCard =
    !!tracking?.rider && currentIdx >= statusIndex('ASSIGNED')

  // Rider progress along the bezier path (0 at restaurant, 1 at destination)
  const riderT = (() => {
    if (!tracking) return 0
    if (isDelivered) return 1
    if (currentIdx >= 0 && currentIdx <= statusIndex('READY')) return 0
    if (!tracking.rider) return 0
    const total = Math.max(
      geoDist(tracking.restaurant, tracking.destination),
      1e-9
    )
    const riderFromStart = geoDist(tracking.restaurant, tracking.rider)
    return Math.min(1, Math.max(0, riderFromStart / total))
  })()

  const riderPos = bezierPoint(riderT)
  const eta = etaMinutes(currentStatus, order?.deliveryTime ?? 30)

  // ---- loading skeleton ----
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Skeleton className="lg:col-span-3 h-[380px] lg:h-[560px] rounded-2xl" />
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-56 rounded-2xl" />
        </div>
      </div>
    )
  }

  // ---- error state ----
  if (error || !order) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <div className="rounded-full bg-destructive/10 p-3">
            <X className="h-6 w-6 text-destructive" />
          </div>
          <p className="text-muted-foreground max-w-sm">
            {error || 'We could not load this order.'}
          </p>
          <Button onClick={() => setView('orders')}>Back to orders</Button>
        </CardContent>
      </Card>
    )
  }

  const restaurantName = tracking?.restaurant?.name ?? order.restaurant?.name ?? 'Restaurant'

  return (
    <motion.div
      className="grid grid-cols-1 lg:grid-cols-5 gap-4"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* ----------------------------------------------------------------- */}
      {/* LEFT: Stylized live map                                            */}
      {/* ----------------------------------------------------------------- */}
      <div className="lg:col-span-3">
        <div className="map-grid relative h-[360px] sm:h-[440px] lg:h-[560px] rounded-2xl overflow-hidden border shadow-sm">
          {/* LIVE badge */}
          <div className="absolute top-3 left-3 z-30 flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur px-2.5 py-1 shadow-md">
            {isDelivered ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
            ) : isCancelled ? (
              <X className="h-3.5 w-3.5 text-red-600" />
            ) : (
              <span
                className="live-dot inline-block h-2 w-2 rounded-full bg-red-500"
                aria-hidden
              />
            )}
            <span
              className={cn(
                'text-xs font-bold',
                isDelivered
                  ? 'text-green-700'
                  : isCancelled
                    ? 'text-red-700'
                    : 'text-red-600'
              )}
            >
              {isDelivered ? 'DELIVERED' : isCancelled ? 'CANCELLED' : 'LIVE'}
            </span>
          </div>

          {/* ETA chip */}
          {!isCancelled && !isDelivered && eta !== null && (
            <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur px-2.5 py-1 shadow-md">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold text-foreground">
                {tracking ? `Arriving in ${eta} min` : 'Connecting…'}
              </span>
            </div>
          )}

          {/* SVG route */}
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden
          >
            {/* soft route glow */}
            <path
              d={`M ${P0.x} ${P0.y} Q ${P1.x} ${P1.y} ${P2.x} ${P2.y}`}
              fill="none"
              stroke="#fc8019"
              strokeOpacity="0.18"
              strokeWidth="3"
              strokeLinecap="round"
            />
            {/* dashed route line */}
            <path
              d={`M ${P0.x} ${P0.y} Q ${P1.x} ${P1.y} ${P2.x} ${P2.y}`}
              fill="none"
              stroke="#fc8019"
              strokeWidth="0.7"
              strokeDasharray="2 1.6"
              strokeLinecap="round"
            />
          </svg>

          {/* Restaurant marker */}
          <Marker
            x={P0.x}
            y={P0.y}
            icon={<HomeIcon className="h-4 w-4 text-primary" />}
            label={restaurantName}
            tone="primary"
          />

          {/* Destination marker */}
          <Marker
            x={P2.x}
            y={P2.y}
            icon={<MapPin className="h-4 w-4 text-red-500" />}
            label={order.addressLine || 'Your location'}
            tone="destination"
          />

          {/* Rider marker (animated) */}
          {!isCancelled && (
            <motion.div
              className="absolute z-20"
              style={{ transform: 'translate(-50%, -50%)' }}
              initial={false}
              animate={{
                left: `${riderPos.x}%`,
                top: `${riderPos.y}%`,
              }}
              transition={{ type: 'spring', stiffness: 50, damping: 18 }}
            >
              <div className="rider-bounce flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-2 ring-white">
                {isDelivered ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <Bike className="h-5 w-5" />
                )}
              </div>
              <div className="mt-1 mx-auto w-fit rounded bg-white/95 px-1.5 py-0.5 text-[10px] font-semibold text-foreground shadow-sm">
                {tracking?.rider?.name?.split(' ')[0] ?? 'Rider'}
              </div>
            </motion.div>
          )}

          {/* Bottom status banner */}
          <div className="absolute bottom-3 left-3 right-3 z-30 rounded-xl bg-white/95 backdrop-blur px-3 py-2 shadow-md flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Current status</p>
              <p className="text-sm font-semibold truncate">
                {STATUS_LABELS[currentStatus] ?? currentStatus}
              </p>
            </div>
            <Navigation2 className="h-4 w-4 shrink-0 text-primary" />
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* RIGHT: Order info, timeline, rider, summary                       */}
      {/* ----------------------------------------------------------------- */}
      <div className="lg:col-span-2 space-y-4">
        {/* Order header card */}
        <Card className="rounded-2xl">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-mono">
                  {order.orderCode}
                </p>
                <h2 className="text-lg font-semibold truncate">{restaurantName}</h2>
                <p className="text-xs text-muted-foreground truncate">
                  {order.restaurant?.cuisine}
                </p>
              </div>
              <Badge variant="outline" className={statusBadgeClass(currentStatus)}>
                {statusLabel(currentStatus)}
              </Badge>
            </div>
            <Separator className="my-3" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Placed {timeAgo(order.createdAt)}</span>
              <span>Payment: {order.paymentMethod}</span>
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Order timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ol>
              {STATUS_FLOW.map((status, i) => {
                const isDone = !isCancelled && i < currentIdx
                const isCurrent = !isCancelled && i === currentIdx
                const isFuture = !isCancelled && i > currentIdx
                const item = tracking?.timeline?.find(
                  (t) => t.status === status
                )
                const isLast = i === STATUS_FLOW.length - 1
                return (
                  <li
                    key={status}
                    className="flex items-stretch gap-3"
                    aria-current={isCurrent ? 'step' : undefined}
                  >
                    <div className="flex flex-col items-center">
                      <span
                        className={cn(
                          'flex h-7 w-7 items-center justify-center rounded-full border-2 transition-colors',
                          isDone && 'border-green-600 bg-green-600 text-white',
                          isCurrent &&
                            'border-primary bg-primary text-primary-foreground',
                          (isFuture || isCancelled) &&
                            'border-border bg-muted text-muted-foreground'
                        )}
                      >
                        {isDone ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : isCurrent ? (
                          <span
                            className="live-dot block h-2.5 w-2.5 rounded-full bg-primary-foreground"
                            aria-hidden
                          />
                        ) : (
                          <span className="block h-2 w-2 rounded-full bg-muted-foreground/40" />
                        )}
                      </span>
                      {!isLast && (
                        <span
                          className={cn(
                            'my-1 w-0.5 flex-1 min-h-[18px]',
                            isDone ? 'bg-green-600' : 'bg-border'
                          )}
                        />
                      )}
                    </div>
                    <div className={cn('flex-1 pb-4', isLast && 'pb-0')}>
                      <p
                        className={cn(
                          'text-sm font-medium',
                          isFuture ? 'text-muted-foreground' : 'text-foreground'
                        )}
                      >
                        {STATUS_LABELS[status]}
                      </p>
                      {item && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {timeAgo(item.at)}
                        </p>
                      )}
                    </div>
                  </li>
                )
              })}
            </ol>
          </CardContent>
        </Card>

        {/* Rider card */}
        {showRiderCard && tracking?.rider && (
          <Card className="rounded-2xl">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {initials(tracking.rider.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{tracking.rider.name}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span>4.8 · Delivery partner</span>
                  </div>
                </div>
                <Button
                  asChild
                  size="icon"
                  variant="outline"
                  aria-label={`Call ${tracking.rider.name}`}
                >
                  <a href={`tel:${tracking.rider.phone.replace(/\s+/g, '')}`}>
                    <Phone className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Order summary */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Order summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {order.items.map((it) => (
              <div
                key={it.id}
                className="flex items-start justify-between gap-3 text-sm"
              >
                <span className="flex-1 min-w-0">
                  <span className="font-semibold text-muted-foreground">
                    {it.quantity}×
                  </span>{' '}
                  <span className="font-medium">{it.name}</span>
                </span>
                <span className="tabular-nums shrink-0">
                  {formatINR(it.total)}
                </span>
              </div>
            ))}

            <Separator className="my-2" />

            <SummaryRow label="Item total" value={formatINR(order.itemsTotal)} />
            <SummaryRow
              label="Delivery fee"
              value={formatINR(order.deliveryFee)}
            />
            <SummaryRow
              label="Taxes & charges"
              value={formatINR(order.taxes)}
            />
            {order.discount > 0 && (
              <SummaryRow
                label="Discount"
                value={`- ${formatINR(order.discount)}`}
                valueClass="text-green-600"
              />
            )}
            {order.tip > 0 && (
              <SummaryRow label="Delivery tip" value={formatINR(order.tip)} />
            )}

            <Separator className="my-2" />
            <div className="flex items-center justify-between font-bold">
              <span>To pay</span>
              <span className="tabular-nums">{formatINR(order.total)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Reorder */}
        <Button
          className="w-full"
          size="lg"
          onClick={() => {
            clearCart()
            toast.success('Reorder started', {
              description: 'Browse the restaurant to add items again.',
            })
            setView('home')
          }}
        >
          <RotateCcw className="h-4 w-4" /> Reorder
        </Button>
      </div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Small subcomponents
// ---------------------------------------------------------------------------

function Marker({
  x,
  y,
  icon,
  label,
  tone,
}: {
  x: number
  y: number
  icon: React.ReactNode
  label: string
  tone: 'primary' | 'destination'
}) {
  return (
    <div
      className="absolute z-10"
      style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
    >
      <div className="flex flex-col items-center">
        <div
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-md ring-2',
            tone === 'primary' ? 'ring-primary/30' : 'ring-red-500/30'
          )}
        >
          {icon}
        </div>
        <span className="mt-1 max-w-[130px] truncate rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-semibold text-foreground shadow-sm">
          {label}
        </span>
      </div>
    </div>
  )
}

function SummaryRow({
  label,
  value,
  valueClass,
}: {
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('tabular-nums', valueClass)}>{value}</span>
    </div>
  )
}
