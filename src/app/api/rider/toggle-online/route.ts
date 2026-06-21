import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser, can } from '@/lib/auth'

// PATCH /api/rider/toggle-online — toggle the rider's online/offline status
export async function PATCH() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required', statusCode: 401 }, { status: 401 })
    }
    if (!can(user, 'riders.read')) {
      return NextResponse.json({ success: false, error: 'Access denied', statusCode: 403 }, { status: 403 })
    }
    let rider = await db.rider.findFirst({ where: { userId: user.id } })
    if (!rider) rider = await db.rider.findUnique({ where: { phone: user.phone } })
    if (!rider) {
      return NextResponse.json({ success: false, error: 'No rider profile found' }, { status: 404 })
    }
    const updated = await db.rider.update({
      where: { id: rider.id },
      data: { isOnline: !rider.isOnline },
    })
    return NextResponse.json({ success: true, isOnline: updated.isOnline })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
