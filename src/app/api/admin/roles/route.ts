import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission, can } from '@/lib/auth'
import { ROLES, PERMISSIONS } from '@/lib/rbac'

// GET /api/admin/roles — list roles + their permissions (requires roles.read)
export async function GET() {
  try {
    await requirePermission('roles.read')
    const roles = await db.role.findMany({
      orderBy: { name: 'asc' },
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { users: true } },
      },
    })
    const result = roles.map((r) => ({
      id: r.id,
      name: r.name,
      label: r.label,
      description: r.description,
      isSystem: r.isSystem,
      userCount: r._count.users,
      permissions: r.permissions.map((rp) => ({
        action: rp.permission.action,
        module: rp.permission.module,
        label: rp.permission.label,
      })),
    }))
    return NextResponse.json({ success: true, roles: result })
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message, statusCode: e.statusCode || 500 },
      { status: e.statusCode || 500 }
    )
  }
}

// PATCH /api/admin/roles — update a role's permission set (requires roles.update)
// Body: { roleName, permissions: string[] }
export async function PATCH(req: Request) {
  try {
    await requirePermission('roles.update')
    const { roleName, permissions } = await req.json()
    if (!roleName) {
      return NextResponse.json({ success: false, error: 'roleName is required' }, { status: 400 })
    }
    if (!Array.isArray(permissions)) {
      return NextResponse.json({ success: false, error: 'permissions must be an array' }, { status: 400 })
    }
    const role = await db.role.findUnique({ where: { name: roleName } })
    if (!role) {
      return NextResponse.json({ success: false, error: 'Role not found' }, { status: 404 })
    }
    // SUPER_ADMIN is untouchable (always has all permissions)
    if (role.name === 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: 'SUPER_ADMIN permissions cannot be modified' }, { status: 400 })
    }
    // Validate all permission actions exist
    const validActions = new Set(PERMISSIONS.map((p) => p.action))
    const requested = permissions.filter((p: string) => validActions.has(p))

    // Replace the role-permission set
    await db.rolePermission.deleteMany({ where: { roleId: role.id } })
    if (requested.length > 0) {
      const permRecords = await db.permission.findMany({ where: { action: { in: requested } } })
      await db.rolePermission.createMany({
        data: permRecords.map((p) => ({ roleId: role.id, permissionId: p.id })),
      })
    }
    return NextResponse.json({ success: true, granted: requested.length })
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message, statusCode: e.statusCode || 500 },
      { status: e.statusCode || 500 }
    )
  }
}

// Re-export can for convenience in route handlers
export { can }
