import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

// GET /api/restaurant-portal/dashboard — restaurant owner/staff stats + orders + menu summary
// Requires: authenticated + RESTAURANT_OWNER or RESTAURANT_STAFF role
export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required', statusCode: 401 }, { status: 401 })
    }
    const isRestaurantRole = user.roles.some((r) =>
      ['RESTAURANT_OWNER', 'RESTAURANT_STAFF', 'SUPER_ADMIN'].includes(r)
    )
    if (!isRestaurantRole) {
      return NextResponse.json({ success: false, error: 'Restaurant access required', statusCode: 403 }, { status: 403 })
    }

    // Demo: assign the first restaurant as "their" restaurant
    const restaurant = await db.restaurant.findFirst({
      orderBy: { rating: 'desc' },
      include: {
        menuCategories: {
          orderBy: { displayOrder: 'asc' },
          include: { _count: { select: { items: true } } },
        },
        city: true,
      },
    })
    if (!restaurant) {
      return NextResponse.json({ success: false, error: 'No restaurant found' }, { status: 404 })
    }

    // Orders for this restaurant
    const orders = await db.order.findMany({
      where: { restaurantId: restaurant.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: { items: true },
    })

    const activeOrders = orders.filter((o) =>
      ['PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'ASSIGNED', 'PICKED_UP', 'ON_ROUTE'].includes(o.status)
    )
    const completedOrders = orders.filter((o) => o.status === 'DELIVERED')
    const cancelledOrders = orders.filter((o) => o.status === 'CANCELLED')

    const revenue = completedOrders.reduce((sum, o) => sum + o.itemsTotal, 0)
    const avgOrderValue = completedOrders.length > 0 ? Math.round(revenue / completedOrders.length) : 0

    // Today's orders
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const todayOrders = orders.filter((o) => new Date(o.createdAt) > dayAgo)
    const todayRevenue = todayOrders
      .filter((o) => o.status === 'DELIVERED')
      .reduce((sum, o) => sum + o.itemsTotal, 0)

    // Menu summary
    const totalMenuItems = await db.menuItem.count({ where: { restaurantId: restaurant.id } })
    const availableItems = await db.menuItem.count({ where: { restaurantId: restaurant.id, isAvailable: true } })

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
        city: restaurant.city?.name,
      },
      stats: {
        activeOrders: activeOrders.length,
        todayOrders: todayOrders.length,
        todayRevenue,
        totalCompleted: completedOrders.length,
        cancelledOrders: cancelledOrders.length,
        totalRevenue: revenue,
        avgOrderValue,
        totalMenuItems,
        availableItems,
      },
      activeOrders,
      recentOrders: orders.slice(0, 10),
      menuCategories: restaurant.menuCategories.map((c) => ({
        id: c.id,
        name: c.name,
        itemCount: c._count.items,
      })),
    })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
