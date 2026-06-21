import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser, can } from '@/lib/auth'

// GET /api/restaurant/orders — order history for the logged-in restaurant
export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required', statusCode: 401 }, { status: 401 })
    }
    if (!can(user, 'orders.read')) {
      return NextResponse.json({ success: false, error: 'Access denied', statusCode: 403 }, { status: 403 })
    }

    let restaurant = await db.restaurant.findFirst({ where: { ownerUserId: user.id } })
    if (!restaurant) restaurant = await db.restaurant.findFirst({ orderBy: { rating: 'desc' } })
    if (!restaurant) {
      return NextResponse.json({ success: false, error: 'No restaurant found' }, { status: 404 })
    }

    const orders = await db.order.findMany({
      where: { restaurantId: restaurant.id },
      orderBy: { createdAt: 'desc' },
      include: { items: true },
      take: 30,
    })
    return NextResponse.json({ success: true, orders })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
