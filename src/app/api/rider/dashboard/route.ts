import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser, can } from '@/lib/auth'

// GET /api/rider/dashboard — full rider dashboard data
export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }
    if (!can(user, 'orders.read')) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 })
    }

    let rider = await db.rider.findFirst({ where: { userId: user.id } })
    if (!rider) {
      rider = await db.rider.findUnique({ where: { phone: user.phone } })
      if (rider) rider = await db.rider.update({ where: { id: rider.id }, data: { userId: user.id } })
    }
    if (!rider) {
      return NextResponse.json({ success: false, error: 'No rider profile found' }, { status: 404 })
    }

    // Active deliveries (ASSIGNED, PICKED_UP, ON_ROUTE)
    const activeDeliveries = await db.order.findMany({
      where: { riderId: rider.id, status: { in: ['ASSIGNED', 'PICKED_UP', 'ON_ROUTE'] } },
      include: { restaurant: true, items: true },
      orderBy: { createdAt: 'desc' },
    })

    // Today's completed
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const todayCompleted = await db.order.findMany({
      where: { riderId: rider.id, status: 'DELIVERED', updatedAt: { gte: startOfDay } },
    })

    // All completed
    const allCompleted = await db.order.findMany({
      where: { riderId: rider.id, status: 'DELIVERED' },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { restaurant: true, items: true },
    })

    const deliveryEarnings = allCompleted.reduce((s, o) => s + Math.round(o.deliveryFee * 0.8), 0)
    const tipEarnings = allCompleted.reduce((s, o) => s + o.tip, 0)

    return NextResponse.json({
      success: true,
      rider: {
        id: rider.id,
        name: rider.name,
        phone: rider.phone,
        vehicle: rider.vehicle,
        rating: rider.rating,
        isOnline: rider.isOnline,
        totalDeliveries: rider.totalDeliveries,
      },
      stats: {
        activeDeliveries: activeDeliveries.length,
        completedToday: todayCompleted.length,
        totalCompleted: rider.totalDeliveries,
        totalEarnings: deliveryEarnings + tipEarnings,
        deliveryEarnings,
        tipEarnings,
      },
      activeDeliveries,
      recentOrders: allCompleted,
    })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
