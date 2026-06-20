import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/auth'

// PATCH /api/admin/restaurants/[id] — update a restaurant (requires restaurants.update)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission('restaurants.update')
    const { id } = await params
    const body = await req.json()
    const existing = await db.restaurant.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Restaurant not found' }, { status: 404 })
    }
    const data: any = {}
    const allowed = ['name', 'description', 'cuisine', 'imageUrl', 'coverUrl', 'costForTwo', 'deliveryTime', 'deliveryFee', 'priceLevel', 'isPureVeg', 'isPromoted', 'offer', 'address', 'latitude', 'longitude', 'isActive', 'rating']
    for (const key of allowed) {
      if (body[key] !== undefined) data[key] = body[key]
    }
    const restaurant = await db.restaurant.update({ where: { id }, data })
    return NextResponse.json({ success: true, restaurant })
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message, statusCode: e.statusCode || 500 },
      { status: e.statusCode || 500 }
    )
  }
}

// DELETE /api/admin/restaurants/[id] — delete a restaurant (requires restaurants.delete)
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission('restaurants.delete')
    const { id } = await params
    const existing = await db.restaurant.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Restaurant not found' }, { status: 404 })
    }
    await db.restaurant.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message, statusCode: e.statusCode || 500 },
      { status: e.statusCode || 500 }
    )
  }
}
