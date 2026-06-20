import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const restaurant = await db.restaurant.findUnique({
      where: { slug },
      include: {
        menuCategories: {
          orderBy: { displayOrder: 'asc' },
          include: {
            items: {
              orderBy: [{ isBestSeller: 'desc' }, { isRecommended: 'desc' }, { name: 'asc' }],
            },
          },
        },
        reviews: { include: { customer: true }, orderBy: { createdAt: 'desc' }, take: 8 },
        city: true,
      },
    })
    if (!restaurant) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true, restaurant })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
