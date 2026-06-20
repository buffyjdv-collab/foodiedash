import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

// PATCH /api/rider/status — toggle rider online/offline
export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }
    if (!user.roles.includes('DELIVERY_PARTNER') && !user.roles.includes('SUPER_ADMIN')) {
      return NextResponse.json({ success: false, error: 'Delivery partner access required' }, { status: 403 })
    }
    const { isOnline } = await req.json()
    if (typeof isOnline !== 'boolean') {
      return NextResponse.json({ success: false, error: 'isOnline (boolean) is required' }, { status: 400 })
    }

    let rider = await db.rider.findFirst({ where: { phone: user.phone } })
    if (!rider) rider = await db.rider.findFirst()
    if (!rider) {
      return NextResponse.json({ success: false, error: 'No rider profile found' }, { status: 404 })
    }

    const updated = await db.rider.update({ where: { id: rider.id }, data: { isOnline } })
    return NextResponse.json({ success: true, rider: { id: updated.id, isOnline: updated.isOnline } })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
