import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const customer = await db.customer.findFirst()
    if (!customer) return NextResponse.json({ success: true, orders: [] })
    const orders = await db.order.findMany({
      where: { customerId: customer.id },
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
    const body = await req.json()
    const { items, restaurantId, addressLine, paymentMethod, couponCode, tip } = body as {
      items: { menuItemId: string; name: string; price: number; quantity: number; variants?: string; addons?: string; total: number }[]
      restaurantId: string
      addressLine: string
      paymentMethod: string
      couponCode?: string
      tip?: number
    }

    const customer = await db.customer.findFirst()
    if (!customer) return NextResponse.json({ success: false, error: 'No customer' }, { status: 400 })
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
