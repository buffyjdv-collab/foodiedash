import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/auth'

// GET /api/admin/riders — list all riders (requires riders.read)
export async function GET() {
  try {
    await requirePermission('riders.read')
    const riders = await db.rider.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ success: true, riders })
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message, statusCode: e.statusCode || 500 },
      { status: e.statusCode || 500 }
    )
  }
}

// POST /api/admin/riders — create a rider (requires riders.create)
export async function POST(req: NextRequest) {
  try {
    await requirePermission('riders.create')
    const { name, phone, vehicle } = await req.json()
    if (!name || !phone) {
      return NextResponse.json({ success: false, error: 'Name and phone are required' }, { status: 400 })
    }
    const existing = await db.rider.findUnique({ where: { phone } })
    if (existing) {
      return NextResponse.json({ success: false, error: 'A rider with this phone already exists' }, { status: 400 })
    }
    const rider = await db.rider.create({
      data: {
        name,
        phone,
        vehicle: vehicle || 'Bike',
        rating: 4.8,
        totalDeliveries: 0,
        isOnline: false,
      },
    })
    return NextResponse.json({ success: true, rider })
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message, statusCode: e.statusCode || 500 },
      { status: e.statusCode || 500 }
    )
  }
}
