import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser, can } from '@/lib/auth'

// GET /api/rider/dashboard — rider-specific stats + assigned orders
// Requires: authenticated + DELIVERY_PARTNER role (orders.read)
export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required', statusCode: 401 }, { status: 401 })
    }
    if (!user.roles.includes('DELIVERY_PARTNER') && !user.roles.includes('SUPER_ADMIN')) {
      return NextResponse.json({ success: false, error: 'Delivery partner access required', statusCode: 403 }, { status: 403 })
    }

    // Find a rider record matching the user's phone (demo: Ajay Kumar → +919876543209)
    const rider = await db.rider.findFirst({
      where: { phone: user.phone },
    })

    // If no rider record, use the first rider as a demo fallback
    const effectiveRider = rider || (await db.rider.findFirst())
    if (!effectiveRider) {
      return NextResponse.json({ success: false, error: 'No rider profile found' }, { status: 404 })
    }

    // Orders assigned to this rider (across all statuses)
    const assignedOrders = await db.order.findMany({
      where: { riderId: effectiveRider.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { items: true, restaurant: true },
    })

    // Active deliveries (in-progress)
    const activeStatuses = ['ASSIGNED', 'PICKED_UP', 'ON_ROUTE']
    const activeDeliveries = assignedOrders.filter((o) => activeStatuses.includes(o.status))

    // Completed deliveries
    const completed = assignedOrders.filter((o) => o.status === 'DELIVERED')

    // Earnings: ₹15 per completed delivery + tips
    const deliveryEarnings = completed.length * 15
    const tipEarnings = completed.reduce((sum, o) => sum + (o.tip || 0), 0)
    const totalEarnings = deliveryEarnings + tipEarnings

    // Today's deliveries (simplified: last 24h)
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const todayDeliveries = completed.filter((o) => new Date(o.createdAt) > dayAgo).length

    return NextResponse.json({
      success: true,
      rider: {
        id: effectiveRider.id,
        name: effectiveRider.name,
        phone: effectiveRider.phone,
        vehicle: effectiveRider.vehicle,
        rating: effectiveRider.rating,
        isOnline: effectiveRider.isOnline,
        totalDeliveries: effectiveRider.totalDeliveries,
      },
      stats: {
        activeDeliveries: activeDeliveries.length,
        completedToday: todayDeliveries,
        totalCompleted: completed.length,
        totalEarnings,
        deliveryEarnings,
        tipEarnings,
      },
      activeDeliveries,
      recentOrders: assignedOrders.slice(0, 10),
    })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}

export { can }
