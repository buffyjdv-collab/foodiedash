import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser, can } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getAuthUser()
    // If authenticated, show their orders; otherwise fall back to the demo customer.
    let where: any = {}
    if (user) {
      where.userId = user.id
    } else {
      const customer = await db.customer.findFirst()
      if (!customer) return NextResponse.json({ success: true, orders: [] })
      where.customerId = customer.id
    }
    const orders = await db.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { items: true, restaurant: true },
    })
    return NextResponse.json({ success: true, orders })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    // RBAC: placing an order requires the orders.create permission (CUSTOMER role).
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Please log in to place an order.', statusCode: 401 },
        { status: 401 }
      )
    }
    if (!can(user, 'orders.create')) {
      return NextResponse.json(
        { success: false, error: 'Your role does not allow placing orders.', statusCode: 403 },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { items, restaurantId, addressLine, paymentMethod, couponCode, tip } = body as {
      items: { menuItemId: string; name: string; price: number; quantity: number; variants?: string; addons?: string; total: number }[]
      restaurantId: string
      addressLine: string
      paymentMethod: string
      couponCode?: string
      tip?: number
    }

    // Use the demo Customer record for wallet/loyalty linkage (or create one
    // matching the authenticated user's phone).
    let customer = await db.customer.findFirst({ where: { phone: user.phone } })
    if (!customer) customer = await db.customer.findFirst()
    if (!customer) {
      customer = await db.customer.create({
        data: { name: user.name || 'Customer', email: user.email || `${user.phone}@foodiedash.io`, phone: user.phone },
      })
    }
    const restaurant = await db.restaurant.findUnique({ where: { id: restaurantId } })
    if (!restaurant) return NextResponse.json({ success: false, error: 'Restaurant not found' }, { status: 404 })

    const itemsTotal = items.reduce((sum, it) => sum + it.total, 0)
    const taxes = Math.floor(itemsTotal * 0.05) // 5% GST
    let discount = 0
    if (couponCode) {
      const coupon = await db.coupon.findUnique({ where: { code: couponCode.toUpperCase() } })
      if (coupon && coupon.isActive && itemsTotal >= coupon.minOrder) {
        if (coupon.type === 'PERCENTAGE') {
          discount = Math.floor((itemsTotal * coupon.value) / 100)
          if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount)
        } else {
          discount = coupon.value
        }
        await db.coupon.update({ where: { id: coupon.id }, data: { usageCount: { increment: 1 } } })
      }
    }
    const tipAmount = tip || 0
    const total = itemsTotal + restaurant.deliveryFee + taxes - discount + tipAmount

    const orderCode = '#FD' + Math.floor(100000 + Math.random() * 900000)

    const order = await db.order.create({
      data: {
        orderCode,
        customerId: customer.id,
        userId: user.id, // RBAC link to authenticated user
        restaurantId,
        status: 'PLACED',
        itemsTotal,
        deliveryFee: restaurant.deliveryFee,
        taxes,
        discount,
        tip: tipAmount,
        total,
        paymentMethod: paymentMethod || 'UPI',
        paymentStatus: paymentMethod === 'COD' ? 'PENDING' : 'PAID',
        addressLine,
        couponCode: couponCode || null,
        deliveryTime: restaurant.deliveryTime,
        items: { create: items.map((it) => ({
          menuItemId: it.menuItemId,
          name: it.name,
          price: it.price,
          quantity: it.quantity,
          variants: it.variants || null,
          addons: it.addons || null,
          total: it.total,
        })) },
      },
      include: { items: true, restaurant: true },
    })

    return NextResponse.json({ success: true, order })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
