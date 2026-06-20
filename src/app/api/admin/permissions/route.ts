import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/auth'
import { PERMISSIONS } from '@/lib/rbac'
import { db } from '@/lib/db'

// GET /api/admin/permissions — full permission catalogue + which roles have each
export async function GET() {
  try {
    await requirePermission('roles.read')
    const perms = await db.permission.findMany({
      orderBy: [{ module: 'asc' }, { action: 'asc' }],
      include: { roles: { include: { role: { select: { name: true } } } } },
    })
    const result = perms.map((p) => ({
      id: p.id,
      action: p.action,
      module: p.module,
      label: p.label,
      description: p.description,
      roles: p.roles.map((rp) => rp.role.name),
    }))
    return NextResponse.json({
      success: true,
      permissions: result,
      modules: [...new Set(PERMISSIONS.map((p) => p.module))],
    })
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message, statusCode: e.statusCode || 500 },
      { status: e.statusCode || 500 }
    )
  }
}
