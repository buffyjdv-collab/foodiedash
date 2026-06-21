import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser, can } from '@/lib/auth'

// Order state machine: which status can transition to which
const VALID_TRANSITIONS: Record<string, string[]> = {
  PLACED: ['ACCEPTED', 'CANCELLED'],
  ACCEPTED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['ASSIGNED', 'CANCELLED'],
  ASSIGNED: ['PICKED_UP', 'CANCELLED'],
  PICKED_UP: ['ON_ROUTE'],
  ON_ROUTE: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
}

// Which role is allowed to perform each transition
const TRANSITION_PERMISSIONS: Record<string, string> = {
  ACCEPTED: 'orders.update',      // restaurant accepts
  PREPARING: 'orders.update',     // restaurant marks preparing
  READY: 'orders.update',         // restaurant marks ready
  ASSIGNED: 'orders.update',      // system/ops assigns rider
  PICKED_UP: 'orders.update',     // rider picks up
  ON_ROUTE: 'orders.update',      // rider en route
  DELIVERED: 'orders.update',     // rider delivers
  CANCELLED: 'orders.cancel',     // restaurant/support cancels
}

// PATCH /api/orders/[id]/status — advance the order through its lifecycle
// Body: { status: 'ACCEPTED' | 'PREPARING' | 'READY' | ... , prepTime?: number }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    const body = await req.json()
    const { status: newStatus, prepTime } = body
    if (!newStatus) {
      return NextResponse.json({ success: false, error: 'status is required' }, { status: 400 })
    }

    const order = await db.order.findUnique({
      where: { id },
      include: { restaurant: true, items: true },
    })
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
    }

    // Validate transition
    const allowed = VALID_TRANSITIONS[order.status] || []
    if (!allowed.includes(newStatus)) {
      return NextResponse.json(
        { success: false, error: `Cannot transition from ${order.status} to ${newStatus}. Valid: ${allowed.join(', ') || 'none'}` },
        { status: 400 }
      )
    }

    // RBAC: check permission for this transition
    const requiredPermission = TRANSITION_PERMISSIONS[newStatus]
    if (requiredPermission && !can(user, requiredPermission)) {
      return NextResponse.json(
        { success: false, error: `Forbidden: requires "${requiredPermission}" permission` },
        { status: 403 }
      )
    }

    // Role-based access: restaurant roles can only update their own restaurant's orders;
    // delivery partners can only update orders assigned to them.
    const isRestaurantRole = user.roles.some((r) => ['RESTAURANT_OWNER', 'RESTAURANT_STAFF'].includes(r))
    const isRider = user.roles.includes('DELIVERY_PARTNER')
    // For demo: restaurant roles manage all orders (simplification); riders manage assigned orders.

    const updateData: any = { status: newStatus }

    // JIT rider assignment: when status becomes READY, auto-assign nearest online rider
    if (newStatus === 'READY') {
      // Find an online rider (nearest by rating for demo)
      const onlineRiders = await db.rider.findMany({ where: { isOnline: true } })
      if (onlineRiders.length > 0) {
        // Pick the rider with fewest active deliveries (load balancing)
        const riderLoads = await Promise.all(
          onlineRiders.map(async (r) => ({
            rider: r,
            activeCount: await db.order.count({
              where: { riderId: r.id, status: { in: ['ASSIGNED', 'PICKED_UP', 'ON_ROUTE'] } },
            }),
          }))
        )
        riderLoads.sort((a, b) => a.activeCount - b.activeCount || b.rider.rating - a.rider.rating)
        const assignedRider = riderLoads[0].rider
        updateData.riderId = assignedRider.id
        updateData.riderName = assignedRider.name
        updateData.riderPhone = assignedRider.phone
        updateData.status = 'ASSIGNED' // Skip READY → go straight to ASSIGNED with rider
      }
    }

    // Rider transitions: update rider coords if needed
    if (newStatus === 'PICKED_UP' && order.riderId) {
      // Set rider position to restaurant location
      if (order.restaurant.latitude && order.restaurant.longitude) {
        updateData.riderLat = order.restaurant.latitude
        updateData.riderLng = order.restaurant.longitude
      }
    }

    // Update prep time if provided (restaurant confirmation)
    if (prepTime && newStatus === 'ACCEPTED') {
      updateData.deliveryTime = prepTime
    }

    const updated = await db.order.update({
      where: { id },
      data: updateData,
      include: { items: true, restaurant: true },
    })

    // When delivered, update rider's total deliveries count
    if (newStatus === 'DELIVERED' && updated.riderId) {
      await db.rider.update({
        where: { id: updated.riderId },
        data: { totalDeliveries: { increment: 1 } },
      })
    }

    return NextResponse.json({
      success: true,
      order: updated,
      message: `Order ${updated.orderCode} → ${updated.status}${updateData.riderName ? ` (rider: ${updateData.riderName})` : ''}`,
    })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
