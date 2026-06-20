import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser, can, requirePermission } from '@/lib/auth'
import { ROLES } from '@/lib/rbac'

// GET /api/admin/users — list all users with their roles (requires users.read)
export async function GET() {
  try {
    await requirePermission('users.read')
    const users = await db.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: { userRoles: { include: { role: true } } },
    })
    const result = users.map((u) => ({
      id: u.id,
      phone: u.phone,
      name: u.name,
      email: u.email,
      isActive: u.isActive,
      createdAt: u.createdAt,
      roles: u.userRoles.map((ur) => ({ name: ur.role.name, label: ur.role.label })),
    }))
    return NextResponse.json({ success: true, users: result })
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message, statusCode: e.statusCode || 500 },
      { status: e.statusCode || 500 }
    )
  }
}

// POST /api/admin/users — create a user + assign roles (requires users.create)
export async function POST(req: NextRequest) {
  try {
    await requirePermission('users.create')
    const { phone, name, email, roles } = await req.json()
    if (!phone) {
      return NextResponse.json({ success: false, error: 'Phone is required' }, { status: 400 })
    }
    const existing = await db.user.findUnique({ where: { phone } })
    if (existing) {
      return NextResponse.json({ success: false, error: 'User with this phone already exists' }, { status: 400 })
    }
    const validRoles = (roles || ['CUSTOMER']).filter((r: string) => ROLES.some((def) => def.name === r))
    if (validRoles.length === 0) {
      return NextResponse.json({ success: false, error: 'At least one valid role is required' }, { status: 400 })
    }
    const user = await db.user.create({
      data: {
        phone,
        name: name || null,
        email: email || null,
        userRoles: { create: validRoles.map((r: string) => ({ role: { connect: { name: r } } })) },
      },
      include: { userRoles: { include: { role: true } } },
    })
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        email: user.email,
        isActive: user.isActive,
        createdAt: user.createdAt,
        roles: user.userRoles.map((ur) => ({ name: ur.role.name, label: ur.role.label })),
      },
    })
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message, statusCode: e.statusCode || 500 },
      { status: e.statusCode || 500 }
    )
  }
}

// PATCH /api/admin/users — update user roles / active status (requires users.update)
export async function PATCH(req: NextRequest) {
  try {
    await requirePermission('users.update')
    const { id, roles, isActive, name, email } = await req.json()
    if (!id) {
      return NextResponse.json({ success: false, error: 'User id is required' }, { status: 400 })
    }
    const caller = await getAuthUser()
    // Guard: cannot deactivate yourself
    if (isActive === false && caller?.id === id) {
      return NextResponse.json({ success: false, error: 'You cannot deactivate your own account' }, { status: 400 })
    }

    const existing = await db.user.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    if (roles && Array.isArray(roles)) {
      const validRoles = roles.filter((r: string) => ROLES.some((def) => def.name === r))
      await db.userRole.deleteMany({ where: { userId: id } })
      if (validRoles.length > 0) {
        await db.userRole.createMany({
          data: validRoles.map((r: string) => ({ userId: id, roleId: undefined as any })),
        })
        // createMany can't connect by name, so do it via individual upserts
        for (const r of validRoles) {
          const role = await db.role.findUnique({ where: { name: r } })
          if (role) {
            await db.userRole.upsert({
              where: { userId_roleId: { userId: id, roleId: role.id } },
              create: { userId: id, roleId: role.id },
              update: {},
            })
          }
        }
      }
    }

    const updated = await db.user.update({
      where: { id },
      data: {
        ...(typeof isActive === 'boolean' ? { isActive } : {}),
        ...(name !== undefined ? { name } : {}),
        ...(email !== undefined ? { email } : {}),
      },
      include: { userRoles: { include: { role: true } } },
    })

    return NextResponse.json({
      success: true,
      user: {
        id: updated.id,
        phone: updated.phone,
        name: updated.name,
        email: updated.email,
        isActive: updated.isActive,
        createdAt: updated.createdAt,
        roles: updated.userRoles.map((ur) => ({ name: ur.role.name, label: ur.role.label })),
      },
    })
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message, statusCode: e.statusCode || 500 },
      { status: e.statusCode || 500 }
    )
  }
}

// DELETE /api/admin/users?id=... — delete user (requires users.delete)
export async function DELETE(req: NextRequest) {
  try {
    await requirePermission('users.delete')
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ success: false, error: 'User id is required' }, { status: 400 })
    }
    const caller = await getAuthUser()
    if (caller?.id === id) {
      return NextResponse.json({ success: false, error: 'You cannot delete your own account' }, { status: 400 })
    }
    // Detach orders first (set userId to null) so historical orders are preserved
    await db.order.updateMany({ where: { userId: id }, data: { userId: null } })
    await db.user.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message, statusCode: e.statusCode || 500 },
      { status: e.statusCode || 500 }
    )
  }
}
