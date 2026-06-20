import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/auth'

// PATCH /api/admin/riders/[id] — update a rider (requires riders.update)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission('riders.update')
    const { id } = await params
    const body = await req.json()
    const existing = await db.rider.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Rider not found' }, { status: 404 })
    }
    // Only allow updatable fields
    const data: any = {}
    if (body.name !== undefined) data.name = body.name
    if (body.phone !== undefined) {
      const dup = await db.rider.findUnique({ where: { phone: body.phone } })
      if (dup && dup.id !== id) {
        return NextResponse.json({ success: false, error: 'Phone already in use' }, { status: 400 })
      }
      data.phone = body.phone
    }
    if (body.vehicle !== undefined) data.vehicle = body.vehicle
    if (body.isOnline !== undefined) data.isOnline = body.isOnline
    if (body.rating !== undefined) data.rating = body.rating
    if (body.totalDeliveries !== undefined) data.totalDeliveries = body.totalDeliveries

    const rider = await db.rider.update({ where: { id }, data })
    return NextResponse.json({ success: true, rider })
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message, statusCode: e.statusCode || 500 },
      { status: e.statusCode || 500 }
    )
  }
}

// DELETE /api/admin/riders/[id] — delete a rider (requires riders.delete)
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission('riders.delete')
    const { id } = await params
    const existing = await db.rider.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Rider not found' }, { status: 404 })
    }
    // Detach from orders (set riderId to null) so historical orders are preserved
    await db.order.updateMany({ where: { riderId: id }, data: { riderId: null } })
    await db.rider.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message, statusCode: e.statusCode || 500 },
      { status: e.statusCode || 500 }
    )
  }
}
