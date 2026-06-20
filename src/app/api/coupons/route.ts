import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const coupons = await db.coupon.findMany({ where: { isActive: true } })
    return NextResponse.json({ success: true, coupons })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { code, cartTotal } = await req.json()
    const coupon = await db.coupon.findUnique({ where: { code: (code || '').toUpperCase() } })
    if (!coupon || !coupon.isActive) {
      return NextResponse.json({ success: false, error: 'Invalid coupon code' }, { status: 400 })
    }
    if (cartTotal < coupon.minOrder) {
      return NextResponse.json({
        success: false,
        error: `Minimum order of ₹${coupon.minOrder} required for this coupon`,
      }, { status: 400 })
    }
    let discount = 0
    if (coupon.type === 'PERCENTAGE') {
      discount = Math.floor((cartTotal * coupon.value) / 100)
      if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount)
    } else {
      discount = coupon.value
    }
    return NextResponse.json({
      success: true,
      coupon: { code: coupon.code, description: coupon.description, type: coupon.type, value: coupon.value },
      discount,
      finalTotal: Math.max(0, cartTotal - discount),
    })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
