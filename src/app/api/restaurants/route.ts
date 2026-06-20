import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const cuisine = searchParams.get('cuisine') || ''
    const vegOnly = searchParams.get('veg') === 'true'
    const sort = searchParams.get('sort') || 'relevance' // relevance, rating, deliveryTime, costLow, costHigh
    const fastDelivery = searchParams.get('fast') === 'true'
    const rating4plus = searchParams.get('rating4') === 'true'

    const where: any = { isActive: true }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { cuisine: { contains: search } },
        { description: { contains: search } },
      ]
    }
    if (cuisine) {
      where.cuisine = { contains: cuisine }
    }
    if (vegOnly) where.isPureVeg = true

    let orderBy: any = [
      { isPromoted: 'desc' },
      { rating: 'desc' },
    ]
    if (sort === 'rating') orderBy = [{ rating: 'desc' }, { ratingCount: 'desc' }]
    if (sort === 'deliveryTime') orderBy = [{ deliveryTime: 'asc' }, { rating: 'desc' }]
    if (sort === 'costLow') orderBy = [{ costForTwo: 'asc' }]
    if (sort === 'costHigh') orderBy = [{ costForTwo: 'desc' }]

    let restaurants = await db.restaurant.findMany({
      where,
      orderBy,
    })

    if (fastDelivery) restaurants = restaurants.filter((r) => r.deliveryTime <= 30)
    if (rating4plus) restaurants = restaurants.filter((r) => r.rating >= 4.0)

    return NextResponse.json({ success: true, restaurants })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
