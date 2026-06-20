import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/auth'

// PATCH /api/admin/menu/items/[id] — update a menu item (requires menus.update)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission('menus.update')
    const { id } = await params
    const body = await req.json()
    const existing = await db.menuItem.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 })
    }
    const data: any = {}
    const allowed = ['name', 'description', 'price', 'imageUrl', 'isVeg', 'isBestSeller', 'isRecommended', 'spiceLevel', 'variants', 'addons', 'isAvailable', 'rating']
    for (const key of allowed) {
      if (body[key] !== undefined) data[key] = body[key]
    }
    const item = await db.menuItem.update({ where: { id }, data })
    return NextResponse.json({ success: true, item })
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message, statusCode: e.statusCode || 500 },
      { status: e.statusCode || 500 }
    )
  }
}

// DELETE /api/admin/menu/items/[id] — delete a menu item (requires menus.delete)
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission('menus.delete')
    const { id } = await params
    const existing = await db.menuItem.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 })
    }
    await db.menuItem.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message, statusCode: e.statusCode || 500 },
      { status: e.statusCode || 500 }
    )
  }
}
