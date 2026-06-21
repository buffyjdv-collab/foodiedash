import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

// POST /api/orders/[id]/feedback — customer submits post-delivery ratings
// Body: { foodRating: 1-5, restaurantRating: 1-5, deliveryRating: 1-5, comment?: string }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    const body = await req.json()
    const { foodRating, restaurantRating, deliveryRating, comment } = body

    // Validate ratings
    for (const [key, val] of Object.entries({ foodRating, restaurantRating, deliveryRating })) {
      if (typeof val !== 'number' || val < 1 || val > 5) {
        return NextResponse.json({ success: false, error: `${key} must be a number between 1 and 5` }, { status: 400 })
      }
    }

    const order = await db.order.findUnique({ where: { id } })
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
    }
    if (order.status !== 'DELIVERED') {
      return NextResponse.json({ success: false, error: 'Can only rate delivered orders' }, { status: 400 })
    }

    // Check if feedback already exists
    const existing = await db.orderFeedback.findUnique({ where: { orderId: id } })
    if (existing) {
      return NextResponse.json({ success: false, error: 'Feedback already submitted for this order' }, { status: 400 })
    }

    const feedback = await db.orderFeedback.create({
      data: {
        orderId: id,
        userId: user.id,
        foodRating,
        restaurantRating,
        deliveryRating,
        comment: comment || null,
      },
    })

    // Update restaurant's aggregate rating (simple running average)
    const restaurant = await db.restaurant.findUnique({ where: { id: order.restaurantId } })
    if (restaurant) {
      const newCount = restaurant.ratingCount + 1
      const newRating = ((restaurant.rating * restaurant.ratingCount) + restaurantRating) / newCount
      await db.restaurant.update({
        where: { id: restaurant.id },
        data: { rating: Math.round(newRating * 10) / 10, ratingCount: newCount },
      })
    }

    return NextResponse.json({ success: true, feedback })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}

// GET /api/orders/[id]/feedback — check if feedback exists
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const feedback = await db.orderFeedback.findUnique({ where: { orderId: id } })
    return NextResponse.json({ success: true, feedback })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
