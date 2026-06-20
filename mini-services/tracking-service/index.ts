import { createServer } from 'http'
import { Server, Socket } from 'socket.io'

// ---------------------------------------------------------------------------
// Order tracking state machine
// ---------------------------------------------------------------------------

const LIFECYCLE: string[] = [
  'PLACED',
  'ACCEPTED',
  'PREPARING',
  'READY',
  'ASSIGNED',
  'PICKED_UP',
  'ON_ROUTE',
  'DELIVERED',
]

const CANCELLED = 'CANCELLED'

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

interface GeoPoint {
  lat: number
  lng: number
}

interface Rider {
  name: string
  phone: string
  lat: number
  lng: number
}

interface TimelineEntry {
  status: string
  at: string
  label: string
}

interface OrderTrackingState {
  orderId: string
  status: string
  rider?: Rider
  restaurant: { name: string; lat: number; lng: number }
  destination: { lat: number; lng: number; address: string }
  timeline: TimelineEntry[]
  startedAt: number
  updatedAt: number
}

interface TrackOrderPayload {
  orderId: string
  restaurant?: { name?: string; lat?: number; lng?: number }
  destination?: { lat?: number; lng?: number; address?: string }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BANGALORE_CENTER: GeoPoint = { lat: 12.9716, lng: 77.5946 }

const RIDER_NAMES = [
  'Ravi Kumar',
  'Sneha Reddy',
  'Arjun Nair',
  'Priya Iyer',
  'Mohammed Imran',
  'Deepak Singh',
  'Anjali Rao',
  'Vikram Shetty',
  'Fatima Sheikh',
  'Karthik Subramaniam',
]

const RESTAURANT_NAMES = [
  'Spice Junction',
  'Biryani House',
  'Dosa Plaza',
  'Punjab Grill Express',
  'Burger Lab',
  'Pizza Heaven',
  'Noodle Bowl',
  'Tandoori Nights',
]

const pickRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

const randomPhone = (): string => {
  const n = () => Math.floor(Math.random() * 10)
  return `+91 9${n()}${n()}${n()}${n()} ${n()}${n()}${n()}${n()}${n()}${n()}`
}

// Random coord around a center, ± delta
const jitter = (center: number, delta: number): number =>
  center + (Math.random() * 2 - 1) * delta

const nowISO = (): string => new Date().toISOString()

const addTimelineEntry = (state: OrderTrackingState, status: string): void => {
  state.timeline.push({
    status,
    at: nowISO(),
    label: STATUS_LABELS[status] ?? status,
  })
}

const nextStatus = (current: string): string | null => {
  const idx = LIFECYCLE.indexOf(current)
  if (idx === -1 || idx >= LIFECYCLE.length - 1) return null
  return LIFECYCLE[idx + 1]
}

// Move a rider 25% of remaining distance toward target each tick
const stepRiderToward = (rider: Rider, target: GeoPoint): void => {
  const dLat = target.lat - rider.lat
  const dLng = target.lng - rider.lng
  rider.lat += dLat * 0.25
  rider.lng += dLng * 0.25
  // Snap if very close
  if (Math.abs(dLat) < 1e-5 && Math.abs(dLng) < 1e-5) {
    rider.lat = target.lat
    rider.lng = target.lng
  }
}

// ---------------------------------------------------------------------------
// In-memory store & per-order interval tracking
// ---------------------------------------------------------------------------

const orders = new Map<string, OrderTrackingState>()
// Track intervals per socket + orderId so we can clean up on disconnect/stop
const socketIntervals = new Map<string, Set<NodeJS.Timeout>>()
const orderIntervals = new Map<string, NodeJS.Timeout>()

const addIntervalToSocket = (socketId: string, handle: NodeJS.Timeout): void => {
  if (!socketIntervals.has(socketId)) socketIntervals.set(socketId, new Set())
  socketIntervals.get(socketId)!.add(handle)
}

const clearSocketIntervals = (socketId: string): void => {
  const set = socketIntervals.get(socketId)
  if (!set) return
  for (const h of set) clearInterval(h)
  set.clear()
  socketIntervals.delete(socketId)
}

const stopOrderInterval = (orderId: string): void => {
  const h = orderIntervals.get(orderId)
  if (h) {
    clearInterval(h)
    orderIntervals.delete(orderId)
  }
}

// ---------------------------------------------------------------------------
// Socket.IO server
// ---------------------------------------------------------------------------

const httpServer = createServer()
const io = new Server(httpServer, {
  // DO NOT change the path, it is used by Caddy to forward the request to the correct port
  path: '/',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
})

io.on('connection', (socket: Socket) => {
  console.log(`[tracking] socket connected: ${socket.id}`)

  // --- track-order ---------------------------------------------------------
  socket.on('track-order', (payload: TrackOrderPayload) => {
    try {
      const orderId: string =
        payload?.orderId || `ord_${Math.random().toString(36).slice(2, 10)}`

      // Clean up any existing interval for this order before re-creating
      stopOrderInterval(orderId)

      // Build restaurant coords around Bangalore ± 0.05
      const restaurant = {
        name: payload?.restaurant?.name || pickRandom(RESTAURANT_NAMES),
        lat:
          payload?.restaurant?.lat ?? jitter(BANGALORE_CENTER.lat, 0.05),
        lng:
          payload?.restaurant?.lng ?? jitter(BANGALORE_CENTER.lng, 0.05),
      }

      // Destination near restaurant (±0.02)
      const destination = {
        lat: payload?.destination?.lat ?? jitter(restaurant.lat, 0.02),
        lng: payload?.destination?.lng ?? jitter(restaurant.lng, 0.02),
        address:
          payload?.destination?.address ||
          `${Math.floor(Math.random() * 999)} MG Road, Bengaluru`,
      }

      // Fake rider — initially positioned at restaurant
      const rider: Rider = {
        name: pickRandom(RIDER_NAMES),
        phone: randomPhone(),
        lat: restaurant.lat,
        lng: restaurant.lng,
      }

      const state: OrderTrackingState = {
        orderId,
        status: 'PLACED',
        rider,
        restaurant,
        destination,
        timeline: [],
        startedAt: Date.now(),
        updatedAt: Date.now(),
      }
      addTimelineEntry(state, 'PLACED')

      orders.set(orderId, state)

      // Room-scoped updates so multiple clients tracking same order share it
      void socket.join(orderId)

      socket.emit('tracking-init', state)
      console.log(
        `[tracking] order ${orderId} started for socket ${socket.id}`,
      )

      // Advance status every ~5 seconds
      const TICK_MS = 5000
      const handle = setInterval(() => {
        const current = orders.get(orderId)
        if (!current) {
          stopOrderInterval(orderId)
          return
        }

        const nxt = nextStatus(current.status)
        if (!nxt) {
          // Already at DELIVERED (or unknown) — stop
          stopOrderInterval(orderId)
          return
        }

        current.status = nxt
        current.updatedAt = Date.now()
        addTimelineEntry(current, nxt)

        // Move the rider when in delivery phases
        if (current.rider) {
          if (nxt === 'ASSIGNED' || nxt === 'PICKED_UP' || nxt === 'ON_ROUTE') {
            // First PICKED_UP moves rider from restaurant toward destination.
            // For ASSIGNED, keep rider at restaurant (waiting for pickup),
            // but nudge slightly so map feels alive.
            if (nxt === 'ASSIGNED') {
              stepRiderToward(current.rider, {
                lat: current.restaurant.lat,
                lng: current.restaurant.lng,
              })
            } else {
              stepRiderToward(current.rider, {
                lat: current.destination.lat,
                lng: current.destination.lng,
              })
            }
          } else if (nxt === 'DELIVERED') {
            // Snap to destination
            current.rider.lat = current.destination.lat
            current.rider.lng = current.destination.lng
          }
        }

        io.to(orderId).emit('tracking-update', current)
        console.log(
          `[tracking] order ${orderId} -> ${nxt} (rider: ${current.rider?.lat.toFixed(5)}, ${current.rider?.lng.toFixed(5)})`,
        )

        if (nxt === 'DELIVERED') {
          stopOrderInterval(orderId)
          console.log(`[tracking] order ${orderId} delivered, interval cleared`)
        }
      }, TICK_MS)

      orderIntervals.set(orderId, handle)
      addIntervalToSocket(socket.id, handle)
    } catch (err) {
      console.error('[tracking] track-order error:', err)
      socket.emit('tracking-error', {
        message: 'Failed to start tracking',
        error: String(err),
      })
    }
  })

  // --- stop-tracking -------------------------------------------------------
  socket.on('stop-tracking', (payload: { orderId?: string }) => {
    const orderId = payload?.orderId
    if (!orderId) return
    stopOrderInterval(orderId)
    orders.delete(orderId)
    void socket.leave(orderId)
    console.log(`[tracking] stopped tracking order ${orderId}`)
  })

  // --- cancel-order (bonus, terminal branch) ------------------------------
  socket.on('cancel-order', (payload: { orderId?: string }) => {
    const orderId = payload?.orderId
    if (!orderId) return
    const current = orders.get(orderId)
    if (!current) return
    stopOrderInterval(orderId)
    current.status = CANCELLED
    current.updatedAt = Date.now()
    addTimelineEntry(current, CANCELLED)
    io.to(orderId).emit('tracking-update', current)
    console.log(`[tracking] order ${orderId} cancelled`)
  })

  // --- disconnect ----------------------------------------------------------
  socket.on('disconnect', () => {
    clearSocketIntervals(socket.id)
    console.log(`[tracking] socket disconnected: ${socket.id}`)
  })

  socket.on('error', (error) => {
    console.error(`[tracking] socket error (${socket.id}):`, error)
  })
})

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

const PORT = 3004
httpServer.listen(PORT, () => {
  console.log(`Tracking service running on port ${PORT}`)
})

// Graceful shutdown
const shutdown = (signal: string) => {
  console.log(`[tracking] received ${signal}, shutting down...`)
  for (const h of orderIntervals.values()) clearInterval(h)
  orderIntervals.clear()
  socketIntervals.clear()
  orders.clear()
  io.close(() => {
    httpServer.close(() => {
      console.log('[tracking] server closed')
      process.exit(0)
    })
  })
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
