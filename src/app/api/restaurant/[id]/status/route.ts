import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser, can } from '@/lib/auth'

// PATCH /api/restaurant/[id]/status — update an order's status (accept/prepare/dispatch)
// Body: { status: 'ACCEPTED' | 'PREPARING' | 'READY' | 'PICKED_UP' }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required', statusCode: 401 }, { status: 401 })
    }
    if (!can(user, 'orders.update')) {
      return NextResponse.json({ success: false, error: 'Access denied — cannot update orders', statusCode: 403 }, { status: 403 })
    }

    const { id } = await params
    const { status } = await req.json()
    const valid = ['ACCEPTED', 'PREPARING', 'READY', 'PICKED_UP', 'CANCELLED']
    if (!valid.includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 })
    }

    const order = await db.order.findUnique({ where: { id } })
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
    }

    // Verify the user owns/manages this restaurant (or is SUPER_ADMIN)
    if (!user.roles.includes('SUPER_ADMIN')) {
      const restaurant = await db.restaurant.findFirst({ where: { ownerUserId: user.id } })
      if (!restaurant || restaurant.id !== order.restaurantId) {
        return NextResponse.json({ success: false, error: 'You can only update orders for your own restaurant' }, { status: 403 })
      }
    }

    const updated = await db.order.update({ where: { id }, data: { status } })
    return NextResponse.json({ success: true, order: updated })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
