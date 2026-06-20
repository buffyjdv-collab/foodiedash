import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/auth'

// GET /api/admin/stats — aggregate counts for the admin overview (requires analytics.read)
export async function GET() {
  try {
    await requirePermission('analytics.read')
    const [
      totalUsers,
      activeUsers,
      totalRestaurants,
      totalOrders,
      totalRiders,
      totalCoupons,
      deliveredOrders,
      cancelledOrders,
      revenueAgg,
    ] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { isActive: true } }),
      db.restaurant.count(),
      db.order.count(),
      db.rider.count(),
      db.coupon.count(),
      db.order.count({ where: { status: 'DELIVERED' } }),
      db.order.count({ where: { status: 'CANCELLED' } }),
      db.order.aggregate({ _sum: { total: true }, where: { status: 'DELIVERED' } }),
    ])

    // Orders by status
    const statusGroups = await db.order.groupBy({ by: ['status'], _count: true })
    const ordersByStatus: Record<string, number> = {}
    for (const g of statusGroups) ordersByStatus[g.status] = g._count

    // Users by role
    const roleGroups = await db.userRole.groupBy({ by: ['roleId'], _count: true, orderBy: { _count: { roleId: 'desc' } } })
    const roleIds = roleGroups.map((g) => g.roleId)
    const roles = await db.role.findMany({ where: { id: { in: roleIds } } })
    const usersByRole: Record<string, number> = {}
    for (const g of roleGroups) {
      const r = roles.find((rr) => rr.id === g.roleId)
      if (r) usersByRole[r.name] = g._count
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        totalRestaurants,
        totalOrders,
        totalRiders,
        totalCoupons,
        deliveredOrders,
        cancelledOrders,
        revenue: revenueAgg._sum.total || 0,
        ordersByStatus,
        usersByRole,
      },
    })
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message, statusCode: e.statusCode || 500 },
      { status: e.statusCode || 500 }
    )
  }
}
