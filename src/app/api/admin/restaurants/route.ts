import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/auth'

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

// POST /api/admin/restaurants — create a restaurant (requires restaurants.create)
export async function POST(req: NextRequest) {
  try {
    await requirePermission('restaurants.create')
    const body = await req.json()
    const { name, description, cuisine, imageUrl, coverUrl, costForTwo, deliveryTime, deliveryFee, priceLevel, isPureVeg, address, cityId, latitude, longitude } = body

    if (!name || !description || !cuisine || !cityId) {
      return NextResponse.json({ success: false, error: 'Name, description, cuisine, and cityId are required' }, { status: 400 })
    }

    let slug = body.slug ? slugify(body.slug) : slugify(name)
    // Ensure slug uniqueness
    const existing = await db.restaurant.findUnique({ where: { slug } })
    if (existing) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`

    const restaurant = await db.restaurant.create({
      data: {
        name,
        slug,
        description,
        cuisine,
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
        coverUrl: coverUrl || null,
        costForTwo: costForTwo || 300,
        deliveryTime: deliveryTime || 30,
        deliveryFee: deliveryFee || 20,
        priceLevel: priceLevel || 1,
        isPureVeg: isPureVeg || false,
        isPromoted: false,
        offer: body.offer || null,
        cityId,
        address: address || '',
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        isActive: true,
      },
    })
    return NextResponse.json({ success: true, restaurant })
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message, statusCode: e.statusCode || 500 },
      { status: e.statusCode || 500 }
    )
  }
}
