import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser, can } from '@/lib/auth'

// GET /api/restaurant-portal/dashboard — full restaurant dashboard data
export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }
    if (!can(user, 'orders.read')) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 })
    }

    let restaurant = await db.restaurant.findFirst({ where: { ownerUserId: user.id } })
    if (!restaurant) {
      restaurant = await db.restaurant.findFirst({ orderBy: { rating: 'desc' } })
    }
    if (!restaurant) {
      return NextResponse.json({ success: false, error: 'No restaurant found' }, { status: 404 })
    }

    const city = await db.city.findUnique({ where: { id: restaurant.cityId } })

    // Active orders (PLACED, ACCEPTED, PREPARING, READY)
    const activeOrders = await db.order.findMany({
      where: { restaurantId: restaurant.id, status: { in: ['PLACED', 'ACCEPTED', 'PREPARING', 'READY'] } },
      include: { items: true },
      orderBy: { createdAt: 'asc' },
    })

    // Today's orders
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const todayOrders = await db.order.findMany({
      where: { restaurantId: restaurant.id, createdAt: { gte: startOfDay } },
    })
    const todayRevenue = todayOrders.filter(o => o.status !== 'CANCELLED').reduce((s, o) => s + o.itemsTotal, 0)

    // All-time stats
    const allOrders = await db.order.findMany({ where: { restaurantId: restaurant.id } })
    const totalCompleted = allOrders.filter(o => o.status === 'DELIVERED').length
    const cancelledOrders = allOrders.filter(o => o.status === 'CANCELLED').length
    const totalRevenue = allOrders.filter(o => o.status !== 'CANCELLED').reduce((s, o) => s + o.itemsTotal, 0)

    // Recent orders (last 10)
    const recentOrders = await db.order.findMany({
      where: { restaurantId: restaurant.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { items: true },
    })

    // Menu categories
    const menuCategories = await db.menuCategory.findMany({
      where: { restaurantId: restaurant.id },
      orderBy: { displayOrder: 'asc' },
      include: { _count: { select: { items: true } }, items: true },
    })
    const totalMenuItems = menuCategories.reduce((s, c) => s + c._count.items, 0)
    const availableItems = menuCategories.reduce((s, c) => s + c.items.filter(i => i.isAvailable).length, 0)

    return NextResponse.json({
      success: true,
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        cuisine: restaurant.cuisine,
        imageUrl: restaurant.imageUrl,
        rating: restaurant.rating,
        ratingCount: restaurant.ratingCount,
        isActive: restaurant.isActive,
        isPromoted: restaurant.isPromoted,
        costForTwo: restaurant.costForTwo,
        deliveryTime: restaurant.deliveryTime,
        address: restaurant.address,
        city: city?.name || null,
      },
      stats: {
        activeOrders: activeOrders.length,
        todayOrders: todayOrders.filter(o => o.status !== 'CANCELLED').length,
        todayRevenue,
        totalCompleted,
        cancelledOrders,
        totalRevenue,
        avgOrderValue: totalCompleted > 0 ? Math.round(totalRevenue / totalCompleted) : 0,
        totalMenuItems,
        availableItems,
      },
      activeOrders,
      recentOrders,
      menuCategories: menuCategories.map(c => ({ id: c.id, name: c.name, itemCount: c._count.items })),
    })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
