import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser, can } from '@/lib/auth'

// GET /api/rider/me — the delivery partner's profile + active delivery + earnings + stats
export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required', statusCode: 401 }, { status: 401 })
    }
    if (!can(user, 'orders.read')) {
      return NextResponse.json({ success: false, error: 'Access denied — Delivery Partner role required', statusCode: 403 }, { status: 403 })
    }

    // Find the rider profile linked to this user (or by phone match as fallback)
    let rider = await db.rider.findFirst({ where: { userId: user.id } })
    if (!rider) {
      rider = await db.rider.findUnique({ where: { phone: user.phone } })
      if (rider) {
        rider = await db.rider.update({ where: { id: rider.id }, data: { userId: user.id } })
      }
    }
    if (!rider) {
      return NextResponse.json({ success: false, error: 'No rider profile linked to your account. Contact admin.' }, { status: 404 })
    }

    // Active delivery: the most recent order assigned to this rider that isn't DELIVERED/CANCELLED
    const activeDelivery = await db.order.findFirst({
      where: {
        riderId: rider.id,
        status: { in: ['ASSIGNED', 'PICKED_UP', 'ON_ROUTE'] },
      },
      include: { restaurant: true, items: true },
      orderBy: { createdAt: 'desc' },
    })

    // Today's completed deliveries
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const todayDeliveries = await db.order.findMany({
      where: {
        riderId: rider.id,
        status: 'DELIVERED',
        updatedAt: { gte: startOfDay },
      },
      orderBy: { updatedAt: 'desc' },
    })
    const todayEarnings = todayDeliveries.reduce((sum, o) => sum + Math.round(o.deliveryFee * 0.8) + o.tip, 0)

    // Last 7 days deliveries for the chart
    const startOfWeek = new Date()
    startOfWeek.setDate(startOfWeek.getDate() - 6)
    startOfWeek.setHours(0, 0, 0, 0)
    const weekDeliveries = await db.order.findMany({
      where: {
        riderId: rider.id,
        status: 'DELIVERED',
        updatedAt: { gte: startOfWeek },
      },
      orderBy: { updatedAt: 'asc' },
    })

    // Build per-day buckets
    const dayBuckets: { date: string; label: string; count: number; earnings: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      d.setHours(0, 0, 0, 0)
      const next = new Date(d)
      next.setDate(next.getDate() + 1)
      const dayOrders = weekDeliveries.filter(
        (o) => o.updatedAt >= d && o.updatedAt < next
      )
      dayBuckets.push({
        date: d.toISOString().slice(0, 10),
        label: d.toLocaleDateString('en-IN', { weekday: 'short' }),
        count: dayOrders.length,
        earnings: dayOrders.reduce((s, o) => s + Math.round(o.deliveryFee * 0.8) + o.tip, 0),
      })
    }

    return NextResponse.json({
      success: true,
      rider: {
        id: rider.id,
        name: rider.name,
        phone: rider.phone,
        vehicle: rider.vehicle,
        rating: rider.rating,
        totalDeliveries: rider.totalDeliveries,
        isOnline: rider.isOnline,
      },
      activeDelivery,
      stats: {
        todayDeliveries: todayDeliveries.length,
        todayEarnings,
        weekDeliveries: weekDeliveries.length,
        weekEarnings: weekDeliveries.reduce((s, o) => s + Math.round(o.deliveryFee * 0.8) + o.tip, 0),
        totalEarnings: rider.totalDeliveries * 45, // approx ₹45 per delivery
      },
      weekChart: dayBuckets,
    })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
