import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/auth'

// GET /api/admin/cities — list all cities (requires restaurants.read)
export async function GET() {
  try {
    await requirePermission('restaurants.read')
    const cities = await db.city.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { restaurants: true } } },
    })
    return NextResponse.json({
      success: true,
      cities: cities.map((c) => ({ id: c.id, name: c.name, state: c.state, isActive: c.isActive, restaurantCount: c._count.restaurants })),
    })
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message, statusCode: e.statusCode || 500 },
      { status: e.statusCode || 500 }
    )
  }
}
