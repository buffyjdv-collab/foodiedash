import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser, can } from '@/lib/auth'

// GET /api/restaurant/me — the restaurant owner's profile + live orders + sales stats
export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required', statusCode: 401 }, { status: 401 })
    }
    if (!can(user, 'orders.read')) {
      return NextResponse.json({ success: false, error: 'Access denied — Restaurant role required', statusCode: 403 }, { status: 403 })
    }

    // Find the restaurant linked to this user (or by staff fallback to owner's restaurant)
    let restaurant = await db.restaurant.findFirst({ where: { ownerUserId: user.id } })
    if (!restaurant) {
      // Staff: find the restaurant owned by a RESTAURANT_OWNER (fallback to first restaurant)
      restaurant = await db.restaurant.findFirst({ orderBy: { rating: 'desc' } })
    }
    if (!restaurant) {
      return NextResponse.json({ success: false, error: 'No restaurant linked to your account.' }, { status: 404 })
    }

    // Live orders: PLACED, ACCEPTED, PREPARING, READY (not yet dispatched)
    const liveOrders = await db.order.findMany({
      where: {
        restaurantId: restaurant.id,
        status: { in: ['PLACED', 'ACCEPTED', 'PREPARING', 'READY'] },
      },
      include: { items: true },
      orderBy: { createdAt: 'asc' },
    })

    // Today's stats
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const todayOrders = await db.order.findMany({
      where: {
        restaurantId: restaurant.id,
        createdAt: { gte: startOfDay },
        status: { not: 'CANCELLED' },
      },
    })
    const todayRevenue = todayOrders.reduce((s, o) => s + o.itemsTotal, 0)

    // Last 7 days for chart
    const startOfWeek = new Date()
    startOfWeek.setDate(startOfWeek.getDate() - 6)
    startOfWeek.setHours(0, 0, 0, 0)
    const weekOrders = await db.order.findMany({
      where: {
        restaurantId: restaurant.id,
        createdAt: { gte: startOfWeek },
        status: { not: 'CANCELLED' },
      },
    })
    const dayBuckets: { date: string; label: string; orders: number; revenue: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      d.setHours(0, 0, 0, 0)
      const next = new Date(d)
      next.setDate(next.getDate() + 1)
      const dayOrders = weekOrders.filter((o) => o.createdAt >= d && o.createdAt < next)
      dayBuckets.push({
        date: d.toISOString().slice(0, 10),
        label: d.toLocaleDateString('en-IN', { weekday: 'short' }),
        orders: dayOrders.length,
        revenue: dayOrders.reduce((s, o) => s + o.itemsTotal, 0),
      })
    }

    // Menu item count
    const menuCategories = await db.menuCategory.findMany({
      where: { restaurantId: restaurant.id },
      include: { _count: { select: { items: true } } },
    })
    const totalMenuItems = menuCategories.reduce((s, c) => s + c._count.items, 0)

    return NextResponse.json({
      success: true,
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        cuisine: restaurant.cuisine,
        imageUrl: restaurant.imageUrl,
        rating: restaurant.rating,
        isActive: restaurant.isActive,
        costForTwo: restaurant.costForTwo,
        deliveryTime: restaurant.deliveryTime,
        address: restaurant.address,
      },
      liveOrders,
      stats: {
        todayOrders: todayOrders.length,
        todayRevenue,
        totalMenuItems,
        totalCategories: menuCategories.length,
        avgOrderValue: todayOrders.length > 0 ? Math.round(todayRevenue / todayOrders.length) : 0,
      },
      weekChart: dayBuckets,
    })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
