import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission, can } from '@/lib/auth'

// GET /api/admin/menu?restaurantId=... — list menu categories + items (requires menus.read)
export async function GET(req: NextRequest) {
  try {
    await requirePermission('menus.read')
    const { searchParams } = new URL(req.url)
    const restaurantId = searchParams.get('restaurantId')
    if (!restaurantId) {
      return NextResponse.json({ success: false, error: 'restaurantId is required' }, { status: 400 })
    }
    const categories = await db.menuCategory.findMany({
      where: { restaurantId },
      orderBy: { displayOrder: 'asc' },
      include: { items: { orderBy: [{ isBestSeller: 'desc' }, { name: 'asc' }] } },
    })
    return NextResponse.json({ success: true, categories })
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message, statusCode: e.statusCode || 500 },
      { status: e.statusCode || 500 }
    )
  }
}

// POST /api/admin/menu — create a menu category or item (requires menus.create)
// Body: { type: 'category' | 'item', ... }
export async function POST(req: NextRequest) {
  try {
    const user = await requirePermission('menus.create')
    const body = await req.json()

    if (body.type === 'category') {
      const { name, restaurantId, displayOrder } = body
      if (!name || !restaurantId) {
        return NextResponse.json({ success: false, error: 'name and restaurantId are required' }, { status: 400 })
      }
      const category = await db.menuCategory.create({
        data: { name, restaurantId, displayOrder: displayOrder || 0 },
      })
      return NextResponse.json({ success: true, category })
    }

    if (body.type === 'item') {
      const { name, description, price, imageUrl, isVeg, isBestSeller, isRecommended, spiceLevel, variants, addons, menuCategoryId, restaurantId } = body
      if (!name || !menuCategoryId || !restaurantId) {
        return NextResponse.json({ success: false, error: 'name, menuCategoryId, restaurantId are required' }, { status: 400 })
      }
      const item = await db.menuItem.create({
        data: {
          name,
          description: description || '',
          price: price || 0,
          imageUrl: imageUrl || null,
          isVeg: isVeg ?? true,
          isBestSeller: isBestSeller ?? false,
          isRecommended: isRecommended ?? false,
          spiceLevel: spiceLevel ?? 0,
          variants: variants || null,
          addons: addons || null,
          menuCategoryId,
          restaurantId,
        },
      })
      return NextResponse.json({ success: true, item })
    }

    return NextResponse.json({ success: false, error: 'Invalid type. Use "category" or "item".' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message, statusCode: e.statusCode || 500 },
      { status: e.statusCode || 500 }
    )
  }
}

// Re-export can for route convenience
export { can }
